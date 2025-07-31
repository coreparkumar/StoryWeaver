import nacl from 'tweetnacl';
import base64url from 'base64url';

// Your FID and domain
const FID = 977521;
const DOMAIN = 'https://story-chain-paaritoshkumar.replit.app';

// Your Ed25519 private key (you'll need to provide this)
// This should be your 32-byte private key seed for FID 977521
const PRIVATE_KEY = process.env.FARCASTER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Error: FARCASTER_PRIVATE_KEY environment variable is required');
  console.log('Please set your Ed25519 private key (32 bytes, hex encoded)');
  process.exit(1);
}

try {
  // Convert hex private key to Uint8Array
  const privateKeyBytes = new Uint8Array(Buffer.from(PRIVATE_KEY, 'hex'));
  
  // Ensure it's 32 bytes (pad with zeros if needed)
  const paddedPrivateKey = new Uint8Array(32);
  paddedPrivateKey.set(privateKeyBytes.slice(0, 32));
  
  console.log('Private key length:', paddedPrivateKey.length);
  console.log('Private key (first 8 bytes):', Array.from(paddedPrivateKey.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  // Generate keypair from private key
  const keyPair = nacl.sign.keyPair.fromSeed(paddedPrivateKey);
  
  console.log('Public key:', Array.from(keyPair.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  // Create the payload object
  const payload = {
    domain: DOMAIN,
    fid: FID
  };
  
  console.log('Payload:', payload);
  
  // Encode payload as base64url
  const payloadJson = JSON.stringify(payload);
  const encodedPayload = base64url.encode(payloadJson);
  
  console.log('Encoded payload:', encodedPayload);
  
  // Create message to sign (payload bytes)
  const messageBytes = Buffer.from(payloadJson, 'utf8');
  
  // Sign the message
  const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);
  
  // Encode signature as base64url
  const encodedSignature = base64url.encode(Buffer.from(signature));
  
  console.log('Signature length:', signature.length);
  console.log('Encoded signature:', encodedSignature);
  
  // Create the accountAssociation object
  const accountAssociation = {
    payload: encodedPayload,
    signature: encodedSignature
  };
  
  console.log('\n✅ Generated accountAssociation:');
  console.log(JSON.stringify(accountAssociation, null, 2));
  
  // Verify the signature
  const isValid = nacl.sign.detached.verify(messageBytes, signature, keyPair.publicKey);
  console.log('\n✅ Signature verification:', isValid ? 'VALID' : 'INVALID');
  
  // Show the complete manifest structure
  const manifest = {
    accountAssociation,
    miniApp: {
      name: "Story Weaver",
      description: "Collaborative storytelling where the community writes together",
      icon: `${DOMAIN}/icon.svg`,
      url: DOMAIN,
      buttonTitle: "Start Writing",
      splashImageUrl: `${DOMAIN}/icon.svg`,
      splashBackgroundColor: "#8a63d2"
    }
  };
  
  console.log('\n📄 Complete manifest:');
  console.log(JSON.stringify(manifest, null, 2));
  
} catch (error) {
  console.error('Error generating accountAssociation:', error);
  process.exit(1);
}