import express from 'express';
import Joi from 'joi';
import Item from '../models/Item.js';
import NodeCouchDb from 'node-couchdb';
import logger from '../logger.js';


const router = express.Router();
const couch = new NodeCouchDb({
    host: process.env.COUCHDB_HOST,
    port: process.env.COUCHDB_PORT,
    auth: {
        user: process.env.COUCHDB_USER,
        pass: process.env.COUCHDB_PASSWORD,
    },
});
const ledgerDbName = process.env.COUCHDB_LEDGER_DB; // Database for ledger/history


// Route to get item history by itemId 
router.get('/:itemId/history', async (req, res) => {
    const { itemId } = req.params;

    try {
        if (!itemId) {
            throw new Error('Invalid request: Missing item ID');
        }

        // Query the ledger database for the item's history
        const response = await couch.get(ledgerDbName, '_all_docs', {
            include_docs: true,
            startkey: `${itemId}_`,  // Start key for this item's ledger entries
            endkey: `${itemId}_\ufff0`,  // End key for this item's ledger entries
        });

        const ledgerEntries = response.data.rows.map(row => row.doc);

        if (ledgerEntries.length === 0) {
            // Fetch current state from state database as fallback
            const stateResponse = await couch.get(stateDbName, itemId);
            const stateItem = stateResponse.data;

            logger.warn(`No ledger history found for item: ${itemId}. Returning current state.`);
            return res.json({
                history: {
                    ...stateItem,
                    updates: [], // No updates since there's no history
                },
            });
        }

        // Reassemble history (existing logic for assembling stateItem from ledgerEntries)
        let stateItem = {
            _id: itemId,
            updates: [],
        };
        let isInitialStateSet = false;

        ledgerEntries.forEach(entry => {
            if (entry.action === 'create' && !isInitialStateSet) {
                Object.assign(stateItem, {
                    ...entry,
                    _rev: entry.stateRev,
                });
                isInitialStateSet = true;
            }

            if (entry.action === 'update') {
                stateItem.updates.push({
                    _rev: entry.stateRev,
                    timestamp: entry.timestamp,
                    changes: { ...entry },
                });
            }
        });

        res.json({ history: stateItem });

    } catch (error) {
        logger.error(`Failed to retrieve history for item ${itemId}: ${error.message}`);
        res.status(500).json({ error: 'Error retrieving item history' });
    }
});

// Render the form for adding a new item
router.get('/new', (req, res) => {
    res.render('newItemForm', { title: 'BlockchainIMS app', message: 'Inventory Form' });
});

// Render the form for updating an item
router.get('/update', async (req, res) => {
    try {
        const items = await Item.getItems();
        res.render('updateItemForm', { title: 'Update Item', message: 'Update Form', items });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).send('Server Error');
    }
});

// Render the form for scrapping an item
router.get('/scrap', async (req, res) => {
    try {
        const items = await Item.getItems();
        res.render('scrapAssetForm', { title: 'Scrap Asset', message: 'Scrapped', items });
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).send('Server Error');
    }
});


// Route to render the dashboard with items and their index
router.get('/', async (req, res) => {
    try {
        const items = await Item.getItems();
        const userRole = req.session.user?.role || 'guest'; // Get the role from the session, default to 'guest' if not found
    //    console.log(userRole)
    //     console.log(items);
        
        res.render('items', { items, userRole }); // Pass items and userRole to the template
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).send('Server Error');
    }
});


//  Route to fetch item data for populating the form
// Fetch item data by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.getItemById(req.params.id);
        if (!item) return res.status(404).send('Item not found');
        res.json(item);
    } catch (err) {
        console.error('Error fetching item:', err);
        res.status(500).send('Server Error');
    }
});


// Post request to add a new item
router.post('/', async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(25).required(),
        description: Joi.string().min(5).required(),
        supplier: Joi.string().min(3).required(),
        price: Joi.number().min(0).required(),
        quantity: Joi.number().min(1).required(),
        category: Joi.string().required(),
        dateReceived: Joi.date().required(),
        branch: Joi.string().valid('London', 'Amsterdam', 'Bucharest').required(),
        userRole: Joi.string().valid('assistant', 'manager').required(),
        userName: Joi.string().required(),
    });

    const itemRequest = schema.validate(req.body);
    if (itemRequest.error) {
        return res.status(400).send(itemRequest.error.details[0].message);
    }

    const itemData = {
        name: req.body.name,
        description: req.body.description,
        supplier: req.body.supplier,
        price: req.body.price,
        quantity: req.body.quantity,
        category: req.body.category,
        dateReceived: req.body.dateReceived,
        branch: req.body.branch, // New field for branch
        userRole: req.body.userRole, // New field for user role
        userName: req.body.userName, // New field for user name
    };
    

    try {
        await Item.createItem(itemData); // Save item to CouchDB
        
        res.redirect('/api/items'); // Redirect to dashboard after saving
    } catch (err) {
        res.status(500).send('Error saving item to the database');
    }
});

// Update an existing item
router.post('/update', async (req, res) => {
    const { itemId, name, description, supplier, price, quantity, category, dateReceived, branch, userRole, userName } = req.body;

    if (!itemId) {
        return res.status(400).send('Item ID is required');
    }

    const updatedItem = {
        name,
        description,
        supplier,
        price: Number(price),
        quantity: Number(quantity),
        category,
        dateReceived,
        branch, // New field
        userRole, // New field
        userName, // New field
    };

    try {
        await Item.updateItem(itemId, updatedItem);
        res.redirect('/api/items'); // Redirect to dashboard after update
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).send('Error updating item in the database');
    }
});



// Scrap an existing item
router.post('/scrap', async (req, res) => {
    const { itemId, dateScrapped, executor } = req.body;

    // Validate input
    if (!itemId || !dateScrapped) {
        return res.status(400).send('Item ID and scrapped date are required');
    }

    try {
        const scrapDetails = { dateScrapped , executor}; // Create the scrap details object
        const result = await Item.scrapItem(itemId, scrapDetails);

        console.log('Scrap result:', result);

        // Redirect to the dashboard after successful scrapping
        res.redirect('/api/items');
    } catch (err) {
        console.error('Error scrapping item:', err);

        // Return an error response
        res.status(500).send('Error scrapping item in the database');
    }
});

































export default router;
