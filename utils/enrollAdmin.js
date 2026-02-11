const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function enrollAdmin() {
  const ccpPath = path.resolve(__dirname, '../config/network-config.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

  const caURL = ccp.certificateAuthorities['ca_org1'].url;
  const ca = new FabricCAServices(caURL);

  const walletPath = path.join(process.cwd(), '../wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identity = await wallet.get('admin');
  if (identity) {
    console.log('Admin is already enrolled');
    return;
  }

  const enrollment = await ca.enroll({
    enrollmentID: 'admin',
    enrollmentSecret: 'adminpw',
  });

  const x509Identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: 'Org1MSP',
    type: 'X.509',
  };

  await wallet.put('admin', x509Identity);
  console.log('Admin enrolled successfully');
}

enrollAdmin().catch((error) => console.error(`Failed to enroll admin: ${error}`));
