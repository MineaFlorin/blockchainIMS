import express from 'express';
import { connectToFabric, disconnectFromFabric } from '../utils/fabricConnection.js';
import logger from '../logger.js';

const router = express.Router();

router.get('/connect', async (req, res) => {
  try {
    const gateway = await connectToFabric();
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('mychaincode');

    // Submit a transaction (e.g., createAsset)
    await contract.submitTransaction('createAsset', 'asset1', 'value1');
    logger.info('Transaction submitted successfully');

    res.status(200).send('Transaction has been submitted successfully!');

    await disconnectFromFabric(gateway);
  } catch (error) {
    logger.error(`Fabric error: ${error.message}`);
    res.status(500).send('Failed to connect or execute transaction.');
  }
});

export default router;
