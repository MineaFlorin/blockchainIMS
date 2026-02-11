

import { Wallets } from 'fabric-network'; // Correct import for Wallets
import FabricCAServices from 'fabric-ca-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary modules to fix __dirname in ESM
import { dirname } from 'path';

// Get the directory name of the current module (index.js)
const __filename = fileURLToPath(import.meta.url); // Get current file path
const __dirname = dirname(__filename); // Get directory name of the current file

// Get the current working directory (root directory of the project)
const projectRootDir = process.cwd();

// Log the resolved current working directory for debugging
console.log('Resolved project root directory:', projectRootDir);

// Fix wallet path resolution using process.cwd() to avoid double "C:\" issue
const walletPath = path.join(projectRootDir, 'wallet'); // This should resolve to the correct path

// Log the wallet path for debugging
console.log('Resolved wallet path:', walletPath);

// URL of the Fabric CA server
const caURL = 'http://localhost:4444'; // External port where CA is accessible

// Create a new instance of the Fabric CA client
const caClient = new FabricCAServices(caURL);

export async function registerAndEnrollAdmin() {
    try {
        console.log('Starting admin registration and enrollment...');

        // Create a wallet to hold the credentials of the application user
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if the admin user is already enrolled
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('Admin user already exists in the wallet');
            return;
        }

        // Enroll the admin user
        console.log('Admin user not found, starting enrollment...');
        const enrollment = await caClient.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw',
        });

        // Log enrollment details
        console.log('Admin user enrolled:', enrollment);

        // Define the MSP path and user object
        const mspPath = path.join(__dirname, 'msp');  // Correctly resolving the msp path
        const user = {
            credentials: enrollment,
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // Import the admin's credentials into the wallet
        await wallet.put('admin', user);
        console.log('Admin user enrolled and added to the wallet successfully');
    } catch (error) {
        console.error(`Failed to register and enroll admin: ${error}`);
    }
}

