import express from 'express';
import { generateItemQR } from '../api/mobileService.js';
import { getItemHistory } from '../api/mobileService.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Route to display the items and their QR codes
router.get('/qrcodes', async (req, res) => {
    try {
        const qrCodes = await generateItemQR();

        // Render the page with QR codes
        res.render('itemsQRcode', { qrCodes });

        // Debug: Log the QR codes
        console.log('QR Codes:', qrCodes);

        // Write the entire QR code JSON array to a file
        const filePath = path.resolve(process.cwd(), 'qrcodes.txt');
        const fileContent = JSON.stringify(qrCodes, null, 2); // Prettify the JSON

        fs.writeFile(filePath, fileContent, (err) => {
            if (err) {
                console.error('Error writing QR codes to file:', err);
            } else {
                console.log('QR codes written successfully to qrcodes.txt');
            }
        });
    } catch (error) {
        res.status(500).send('Error generating QR codes: ' + error.message);
    }
});

router.get('/items/:itemId/history', async (req, res) => {
    const { itemId } = req.params;

    try {
        // Fetch the item's history
        const history = await getItemHistory(itemId);

        // Respond with the history in JSON format
        res.json({ history }); // Returning the history data as JSON
    } catch (error) {
        console.error(`Failed to load history for item ${itemId}: ${error.message}`);
        res.status(500).send({ error: 'Error retrieving item history' });
    }
});

// Route to handle item history retrieval
router.post('/history', async (req, res) => {
    const { itemId, itemName, qrCode } = req.body;

    if (!itemId || !itemName) {
        return res.status(400).send('Invalid request: Missing itemId or itemName');
    }

    console.log('Received Data:', { itemId, itemName, qrCode }); // Debugging

    try {
        const history = await getItemHistory(itemId);
        console.log('Item history for mobile: ', {history});
        res.status(200).send({ itemId, itemName, history });
    } catch (error) {
        console.error('Error processing history request:', error.message);
        res.status(500).send({ error: error.message });
    }
});
export default router;

