'use strict';

const { Contract } = require('fabric-contract-api');

class ItemContract extends Contract {

    // Initialize the ledger (optional)
    async initLedger(ctx) {
        console.info('Initializing the ledger...');
        const items = [
            {
                name: 'Laptop',
                description: 'Dell XPS 13',
                supplier: 'Dell Inc.',
                price: 1200,
                quantity: 10,
                category: 'Electronics',
                dateReceived: '2024-06-14',
                branch: 'London',
                userRole: 'manager',
                userName: 'admin1',
            }
        ];

        for (let i = 0; i < items.length; i++) {
            const item = { ...items[i], type: 'item' };
            await ctx.stub.putState(`ITEM${i}`, Buffer.from(JSON.stringify(item)));
            console.info(`Item ${i} initialized`);
        }
    }

    // Create a new item
    async createItem(ctx, itemId, itemDataJson) {
        const itemData = JSON.parse(itemDataJson);

        // Validate mandatory fields
        if (!itemData.name || !itemData.price || !itemData.quantity) {
            throw new Error('Missing required fields (name, price, quantity)');
        }

        // Check if item already exists
        const itemExists = await this.itemExists(ctx, itemId);
        if (itemExists) {
            throw new Error(`The item ${itemId} already exists`);
        }

        itemData.type = 'item'; // Mark the type as 'item'
        await ctx.stub.putState(itemId, Buffer.from(JSON.stringify(itemData)));

        // Create a ledger entry for item creation
        const ledgerEntry = {
            action: 'create',
            timestamp: new Date().toISOString(),
            ...itemData,
            stateId: itemId,
        };

        await ctx.stub.putState(`${itemId}_ledger_${Date.now()}`, Buffer.from(JSON.stringify(ledgerEntry)));

        console.info(`Item ${itemId} created successfully`);
    }

    // Read item by ID
    async readItem(ctx, itemId) {
        const itemBuffer = await ctx.stub.getState(itemId);
        if (!itemBuffer || itemBuffer.length === 0) {
            throw new Error(`The item ${itemId} does not exist`);
        }
        console.info(`Item ${itemId} fetched successfully`);
        return itemBuffer.toString();
    }

    // Update an existing item
    async updateItem(ctx, itemId, updatedDataJson) {
        const updatedData = JSON.parse(updatedDataJson);

        // Validate item existence
        const itemBuffer = await ctx.stub.getState(itemId);
        if (!itemBuffer || itemBuffer.length === 0) {
            throw new Error(`The item ${itemId} does not exist`);
        }

        // Merge updates
        const existingItem = JSON.parse(itemBuffer.toString());
        const updatedItem = { ...existingItem, ...updatedData, type: 'item' };

        await ctx.stub.putState(itemId, Buffer.from(JSON.stringify(updatedItem)));

        // Ledger entry for update
        const ledgerEntry = {
            action: 'update',
            timestamp: new Date().toISOString(),
            stateId: itemId,
            ...updatedItem,
        };

        await ctx.stub.putState(`${itemId}_ledger_${Date.now()}`, Buffer.from(JSON.stringify(ledgerEntry)));

        console.info(`Item ${itemId} updated successfully`);
    }

    // Scrap an item (logical deletion)
    async scrapItem(ctx, itemId, scrapDetailsJson) {
        const scrapDetails = JSON.parse(scrapDetailsJson);

        const itemBuffer = await ctx.stub.getState(itemId);
        if (!itemBuffer || itemBuffer.length === 0) {
            throw new Error(`The item ${itemId} does not exist`);
        }

        // Mark item as scrapped
        const item = JSON.parse(itemBuffer.toString());
        item.status = 'scrapped';
        item.dateScrapped = scrapDetails.dateScrapped;
        item.executor = scrapDetails.executor;

        await ctx.stub.putState(itemId, Buffer.from(JSON.stringify(item)));

        // Ledger entry for scrapping
        const ledgerEntry = {
            action: 'scrapped',
            timestamp: new Date().toISOString(),
            stateId: itemId,
            ...item,
        };

        await ctx.stub.putState(`${itemId}_ledger_${Date.now()}`, Buffer.from(JSON.stringify(ledgerEntry)));

        console.info(`Item ${itemId} scrapped successfully`);
    }

    // // Query item history
    // async getItemHistory(ctx, itemId) {
    //     console.info(`Fetching history for item ${itemId}`);
    //     const historyIterator = await ctx.stub.getHistoryForKey(itemId);
    //     const history = [];
    //     let result = await historyIterator.next();

    //     while (!result.done) {
    //         if (result.value) {
    //             const record = {
    //                 txId: result.value.txId,
    //                 timestamp: result.value.timestamp,
    //                 data: JSON.parse(result.value.value.toString('utf8')),
    //             };
    //             history.push(record);
    //         }
    //         result = await historyIterator.next();
    //     }
    //     await historyIterator.close();

    //     console.info(`History for item ${itemId}:`, history);
    //     return JSON.stringify(history);
    // }

    // // Utility method: Check if item exists
    // async itemExists(ctx, itemId) {
    //     const itemBuffer = await ctx.stub.getState(itemId);
    //     return itemBuffer && itemBuffer.length > 0;
    // }













  // Method to get item history using the ctx (Hyperledger Fabric context)
async getItemHistory(ctx, itemId) {
    console.info(`Fetching history for item ${itemId}`);

    try {
        // Use the getHistoryForKey method from the context to access the item's history in the ledger
        const historyIterator = await ctx.stub.getHistoryForKey(itemId); // Fetch historical data from the ledger
        const history = [];
        let result = await historyIterator.next();

        // Iterate through the history results
        while (!result.done) {
            if (result.value) {
                // Process each ledger entry to extract relevant details
                const record = {
                    txId: result.value.txId,             // Transaction ID for the change
                    timestamp: result.value.timestamp,    // Timestamp of the transaction
                    data: JSON.parse(result.value.value.toString('utf8')),  // The item state at the time of the transaction
                    _rev: result.value.value.toString('utf8')._rev || '' // _rev from CouchDB state
                };
                history.push(record);
            }
            result = await historyIterator.next();  // Move to the next history entry
        }

        // Close the iterator once all history records are processed
        await historyIterator.close();

        console.info(`History for item ${itemId}:`, history);
        return JSON.stringify(history);  // Return the assembled history as a JSON string

    } catch (error) {
        console.error(`Failed to fetch item history from ledger for ${itemId}: ${error.message}`);
        return JSON.stringify({ error: `Error retrieving item history: ${error.message}` });
    }
}


}

module.exports = ItemContract;




