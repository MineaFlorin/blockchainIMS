import { Gateway, Wallets } from 'fabric-network';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../logger.js';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const walletPath = path.join(process.cwd(), 'wallet');
const ccpPath = path.resolve(__dirname, '../config/network-config.json'); // Correct path to the config folder

export async function connectToFabric() {
    try {
        // Load the wallet and check for the admin identity
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const identity = await wallet.get('admin');
        if (!identity) {
            logger.error('Identity "admin" does not exist in the wallet');
            throw new Error('Admin identity not found. Enroll the admin first.');
        }

        // Connect to Fabric Gateway
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true },
        });

        logger.info('Connected to Fabric Network');
        return gateway;
    } catch (error) {
        logger.error(`Fabric connection failed: ${error.message}`);
        throw error;
    }
}

export async function disconnectFromFabric(gateway) {
    try {
        await gateway.disconnect();
        logger.info('Disconnected from Fabric Network');
    } catch (error) {
        logger.error(`Error during disconnect: ${error.message}`);
    }
}
