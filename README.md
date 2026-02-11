Blockchain IMS (v6)

This is version 6 of the Blockchain IMS application, built using Hyperledger Fabric.

Setup Instructions
Clone the repository to your local machine.
Modify the .env file to set the required environment variables for # env var for containers.
Use Docker Compose to start the network, which will create the Fabric CA, CouchDB, and Node.js containers.
Once the containers are ruuning and the network is up and connected to containers, revert any temporary changes to the .env file.
Ensure the admin user is registered and enrolled by running the enrollAdmin script.
Once the admin is enrolled, revert any temporary changes to the .env file to # env var for client app.
Start the application locally with npm start. This should enroll admin if it was not already.

Important Notes
Ensure Docker and Docker Compose are installed before starting.
Modify the .env file to set up CouchDB and Fabric CA connections before running the app.
After running containers, revert any temporary changes made in the .env file.
As of now ignore config ( excepting db.js and utils ).
The adminuser dir contains enrollment scripts and wallet stores them.

Dependencies
Hyperledger Fabric
Docker
Node.js

Completed the setup of blockchain IMS v6 prototype with integrated Hyperledger Fabric network and Node.js application.

Fabric Binaries Installed: Successfully integrated necessary Fabric binaries for the v6 version, ensuring proper operation of Hyperledger Fabric components.
Peer and Orderer Configuration: Configured peer and orderer containers with appropriate environment settings and network connections, ready for blockchain transaction processing.
Single Organization Setup: Implemented a single organization setup in the Fabric network, providing a streamlined configuration for testing and development.
Node.js App Integrated with Ledger: The Node.js application is now successfully communicating with the Fabric ledger through a deployed smart contract, allowing seamless interaction with the blockchain.
Data Persistence: Docker volumes configured to persist state and ledger data, ensuring reliability of the blockchain network over time.
CouchDB Integration: Integrated CouchDB as the state database, providing fast and reliable storage for chaincode state.
Smooth Deployment: Ensured that the Fabric CA, peer, orderer, and CouchDB containers are linked properly, creating a robust environment for both development and testing.
Flutter QR Code Implementation: Added Flutter integration to generate and scan QR codes, enhancing user interaction for blockchain transactions.
Next Steps Completed: User registration was finalized, chaincode has been deployed, and integration tests were performed to ensure all components work together efficiently