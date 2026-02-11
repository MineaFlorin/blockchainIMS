import QRCode from 'qrcode';  // Import the QRCode library
import Item from '../models/Item.js';  // Import your Item model
import logger from '../logger.js';  // Logger for debugging purposes
import NodeCouchDb from 'node-couchdb';
const couch = new NodeCouchDb({
    host: process.env.COUCHDB_HOST,
    port: process.env.COUCHDB_PORT,
    auth: {
        user: process.env.COUCHDB_USER,
        pass: process.env.COUCHDB_PASSWORD,
    },
});
const ledgerDbName = process.env.COUCHDB_LEDGER_DB; // Database for ledger/history
const stateDbName = process.env.COUCHDB_STATE_DB;  // e.g. 'state_ims'

export const getItemHistory = async (itemId) => {
    try {
        if (!itemId) {
            throw new Error('Invalid request: Missing item ID');
        }

        // Query the ledger database for the item's history
        const ledgerResponse = await couch.get(ledgerDbName, '_all_docs', {
            include_docs: true,
            startkey: `${itemId}_`,
            endkey: `${itemId}_\ufff0`,
        });

        const ledgerEntries = ledgerResponse.data.rows.map(row => row.doc);

        if (ledgerEntries.length === 0) {
            // Fetch the current state as fallback
            try {
                const stateResponse = await couch.get(stateDbName, itemId);
                const stateItem = stateResponse.data;

                logger.warn(`No ledger history found for item: ${itemId}. Returning current state.`);
                return {
                    ...stateItem,
                    updates: [], // No updates since there's no history
                };
            } catch (stateError) {
                logger.error(`Failed to fetch current state for item: ${itemId} from state database. Error: ${stateError.message}`);
                throw stateError;
            }
        }

        // Reassemble the ledger history
        let stateItem = {
            _id: itemId,
            _rev: null,
            name: '',
            description: '',
            supplier: '',
            price: 0,
            quantity: 0,
            category: '',
            dateReceived: '',
            branch: '',
            userRole: '',
            userName: '',
            updates: [],
        };

        let isInitialStateSet = false;

        ledgerEntries.forEach(entry => {
            const {
                stateRev, name, description, supplier, price, quantity,
                category, dateReceived, branch, userRole, userName,
                action, timestamp
            } = entry;

            if (action === 'create' && !isInitialStateSet) {
                Object.assign(stateItem, {
                    _rev: stateRev,
                    name,
                    description,
                    supplier,
                    price,
                    quantity,
                    category,
                    dateReceived,
                    branch,
                    userRole,
                    userName,
                });
                isInitialStateSet = true;
            }

            if (action === 'update') {
                stateItem.updates.push({
                    _rev: stateRev,
                    timestamp,
                    changes: {
                        name,
                        description,
                        supplier,
                        price,
                        quantity,
                        category,
                        dateReceived,
                        branch,
                        userRole,
                        userName,
                    },
                });

                Object.assign(stateItem, {
                    name,
                    description,
                    supplier,
                    price,
                    quantity,
                    category,
                    dateReceived,
                    branch,
                    userRole,
                    userName,
                });
            }
        });

        logger.info(`Successfully reassembled history for item: ${itemId}.`);
        return stateItem;

    } catch (error) {
        logger.error(`Error retrieving item history for ${itemId}: ${error.message}`);
        throw error;
    }
};



// Function to generate base64 encoded QR code for each item in the database
export const generateItemQR = async () => {
    try {
        const items = await Item.getItems();  // Fetch items from the database

        // Create a QR code for each item and store the base64 encoded image
        const qrCodes = await Promise.all(
            items.map(async (item) => {
                const qrCodeData = {
                    _id: item._id,  // Unique identifier for the item
                    _rev: item._rev,  // Revision ID for history tracking in CouchDB
                    name: item.name,  
                    description: item.description,  
                    supplier: item.supplier,
                    price: item.price,  
                    quantity: item.quantity,  
                    category: item.category,  
                    dateReceived: item.dateReceived,  
                    type:item.type, 
                    branch: item.branch,
                    userRole: item.userRole,
                    userName: item.userRole,
                };

                // Convert the item data into a base64-encoded QR code
                const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrCodeData));

                return {
                    itemId: item._id,
                    itemName:item.name,
                    qrCodeBase64,  // Store the base64 QR code for each item
                };
            })
        );

        return qrCodes;  // Return the array of QR codes
    } catch (error) {
        logger.error('Error generating QR codes: ' + error.message);
        throw error;  // Rethrow the error to be handled elsewhere
    }
};





/**
 * Reassemble the ledger history into a state JSON format
 * @param {string} itemId - The unique identifier for the item.
 * @returns {Promise<Object>} - The reassembled state JSON for the item.
 */


























































