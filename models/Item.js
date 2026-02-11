
import Joi from 'joi';
import NodeCouchDb from 'node-couchdb';
import dotenv from 'dotenv';

dotenv.config();

const couch = new NodeCouchDb({
    host: process.env.COUCHDB_HOST,
    port: process.env.COUCHDB_PORT,
    auth: {
        user: process.env.COUCHDB_USER,
        pass: process.env.COUCHDB_PASSWORD,
    },
});

const stateDbName = process.env.COUCHDB_STATE_DB;  // e.g. 'state_ims'
const ledgerDbName = process.env.COUCHDB_LEDGER_DB; // e.g. 'ledger_ims'

class Item {

    // Joi schema for item validation
    static itemSchema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        supplier: Joi.string().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().positive().integer().required(),
        category: Joi.string().required(),
        dateReceived: Joi.string().isoDate().required(),
        branch: Joi.string().valid('London', 'Amsterdam', 'Bucharest').required(),
        userRole: Joi.string().valid('assistant', 'manager').required(),
        userName: Joi.string().required(),
    
    });

    // Get all items
    static async getItems() {
        try {
            const response = await couch.get(stateDbName, '_all_docs', { include_docs: true });
            return response.data.rows
                .map(row => row.doc)
                .filter(doc => doc.type === 'item'); // Only return documents with type 'item'
        } catch (error) {
            throw new Error(`Error fetching items: ${error.message}`);
        }
    }

    // Get a single item by id
    static async getItemById(id) {
        try {
            const response = await couch.get(stateDbName, id);
            return response.data;
        } catch (error) {
            throw new Error(`Error fetching item by ID: ${error.message}`);
        }
    }

    // Create an item
    static async createItem(itemData) {
        try {
            // Validate itemData using Joi
            const { error } = Item.itemSchema.validate(itemData);
            if (error) {
                throw new Error(`Validation Error: ${error.details[0].message}`);
            }

            // Ensure itemData fields are properly typed
            itemData.price = Number(itemData.price); // Convert price to a number
            itemData.quantity = Number(itemData.quantity); // Convert quantity to a number
            itemData.type = 'item'; // Set the type for the item

            // Insert the item into CouchDB (state_ims)
            const response = await couch.insert(stateDbName, itemData);

            // Extract the _id and _rev from the response
        const { id: createdId, rev: createdRev } = response.data;

        // console.log('response.data:' , response.data)

            // Create a ledger entry for the new item
           //  Create a ledger entry for the new item
        const ledgerItem = {
            ...itemData,  // Copy all the fields from the original item
            stateId: createdId,  // Use the same ID as the state item
            stateRev: createdRev,  // Store the _rev from the state item
            timestamp: new Date().toISOString(),
            action: 'create',
            type: 'ledger-item',  // Mark it as a ledger entry
        };

            // Insert the ledger entry into the ledger database
            const ledgerInsertResponse = await couch.insert(ledgerDbName, ledgerItem);

            // Log the response from the ledger insert to ensure it's working
            console.log('Ledger Insert Response:', ledgerInsertResponse);

            return response.data; // Return the response data, which should include the new document
        } catch (error) {
            console.error("Error saving item:", error);
            throw new Error(`Error saving item: ${error.message}`);
        }
    }

    
   

     static async updateItem(id, updatedData) {
        try {
            // Validate updatedData using Joi
            const { error } = Item.itemSchema.validate(updatedData);
            if (error) {
                throw new Error(`Validation Error: ${error.details[0].message}`);
            }
    
            // Ensure updatedData fields are properly typed
            updatedData.price = Number(updatedData.price);  // Convert price to a number
            updatedData.quantity = Number(updatedData.quantity);  // Convert quantity to a number
            updatedData.type = 'item';  // Set the type for the item
    
            // Fetch the existing item from CouchDB (state_ims) to get the current revision (_rev)
            const existingItemResponse = await couch.get(stateDbName, id);
            const existingItem = existingItemResponse.data;
    
            // Ensure the existing item is found
            if (!existingItem || !existingItem._id || !existingItem._rev) {
                throw new Error('Item not found or missing necessary properties (_id or _rev)');
            }
    
            // Merge the updated data with the existing item, ensuring the existing _rev is used for conflict resolution
            const updatedItem = {
                ...existingItem, // Spread existing fields
                ...updatedData,  // Apply updated fields
                _id: existingItem._id, // Ensure the same ID is used
                _rev: existingItem._rev // Keep the latest _rev
            };
    
            // Update the item in the state first
            const updateResponse = await couch.update(stateDbName, updatedItem);
    
            // Log the update response to ensure the item was updated
            console.log('State Update Response:', updateResponse);
    
            // Fetch the updated item (ensures we have the latest _rev)
            const updatedItemResponse = await couch.get(stateDbName, id);
            const updatedItemFromState = updatedItemResponse.data;
    
            // Create a ledger entry based on the updated state item
            const ledgerItem = {
                stateRev:updatedItemFromState._rev,  // Modify _rev by appending _ledger_ and Date.now()
                stateId: updatedItemFromState._id,   // Store the current (state) _id under a different key `stateId`
                // Copy the updated data (the new values for the fields)
                name: updatedItemFromState.name,
                description: updatedItemFromState.description,
                supplier: updatedItemFromState.supplier,
                price: updatedItemFromState.price,
                quantity: updatedItemFromState.quantity,
                category: updatedItemFromState.category, 
                dateReceived: updatedItemFromState.dateReceived,
                branch: updatedItemFromState.branch, // New field
                userRole: updatedItemFromState.userRole, // New field
                userName: updatedItemFromState.userName, // New field
                timestamp: new Date().toISOString(), // Add a timestamp for the ledger entry
                action: 'update',  // Action type (for this case, 'update')
                type: 'ledger-item',  // Mark it as a ledger entry
                _id: `${updatedItemFromState._id}_ledger_${Date.now()}`,  // Generate a unique _id for the ledger entry
            };
    
            // Insert the unique ledger entry into the ledger database
            const ledgerInsertResponse = await couch.insert(ledgerDbName, ledgerItem);
    
            // Log the response from the ledger insert to ensure it was successful
            console.log('Ledger Insert Response:', ledgerInsertResponse);
    
            return updateResponse.data;  // Return the response data, which should include the updated document
    
        } catch (error) {
            console.error("Error updating item:", error);
            throw new Error(`Error updating item: ${error.message}`);
        }
    }
    
    
// Method to scrap an item
static async scrapItem(id, scrapDetails) {
    try {
        // Fetch the existing item to get its current revision (_rev)
        const existingItem = await Item.getItemById(id);

        if (!existingItem || !existingItem._rev) {
            throw new Error('Item not found or missing _rev');
        }

        // Create a ledger entry for the scrapped item
        const ledgerItem = {
            stateRev: `${existingItem._rev}_ledger_${Date.now()}`, // Unique revision for ledger
            stateId: existingItem._id, // Original state document ID
            name: existingItem.name, // Copy existing data
            description: existingItem.description,
            supplier: existingItem.supplier,
            price: existingItem.price,
            quantity: existingItem.quantity,
            category: existingItem.category,
            dateReceived: existingItem.dateReceived,
            branch: existingItem.branch, // Include branch from the existing item
            userRole: scrapDetails.userRole, // User role provided in scrapDetails
            userName: scrapDetails.userName, // User name provided in scrapDetails
            executor:scrapDetails.executor,
            action: 'scrapped', // Action type
            dateScrapped: scrapDetails.dateScrapped, // Date when scrapped
            timestamp: new Date().toISOString(), // Current timestamp
            type: 'ledger-item', // Type of entry
            _id: `${existingItem._id}_ledger_${Date.now()}`, // Unique ID for ledger item
            
        };

        // Save the ledger entry to the ledger database
        const ledgerResponse = await couch.insert(ledgerDbName, ledgerItem);

        // Remove the item from the state database
        const deleteResponse = await couch.del(stateDbName, id, existingItem._rev);

        // Log responses for debugging
        console.log('Ledger Insert Response:', ledgerResponse);
        console.log('State Delete Response:', deleteResponse);

        return { message: 'Item scrapped successfully', ledger: ledgerResponse, delete: deleteResponse };
    } catch (error) {
        console.error("Error scrapping item:", error);
        throw new Error(`Error scrapping item: ${error.message}`);
    }
}
        
}



export default Item;
