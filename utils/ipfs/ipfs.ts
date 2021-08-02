import { create } from 'ipfs-http-client'

const ipfs = create({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

// export const retrieveFileContent = (path) => {
//   const result = ipfs.get(path)

//   const localURL = ''
//   return localURL
// }

export const retrieveFileContent = async (ipfsHash) => {
  // const url = process.env.NEXT_PUBLIC_MORALIS_GATEWAY + ipfsHash
  const url = `https://gateway.moralisipfs.com/ipfs/${ipfsHash}`;
  let text = "";
  const response = await fetch(url).then((value) => value.text()).then((value) => text = value);
  console.log('ipfs response', text)
  return text; // await response.json();
}

export default ipfs;