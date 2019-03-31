import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";
import ipfs from './ipfs';

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      storageValue: 0,
      web3: null,
      accounts: null,
      contract: null,
      buffer: null,
      ipfsHash: ''
    };
  }


  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.retrieveFile);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  retrieveFile = async () => {
    const { accounts, contract } = this.state;
    // Get the value from the contract to prove it worked.
    const ipfsHash = await contract.methods.get().call();
    // Update state with the result.
    this.setState({ ipfsHash: ipfsHash });
  };


  // uploads the buffer file stored in state to IPFS using ipfs API
  // store the IPFS hash in contract
  onSubmit = async (event) => {
    event.preventDefault(); // prevents browser from refreshing or getting a new page on click
    console.log("on submit...");

    // post file to IPFS, get the IPFS hash and store it in contract
    try {
      let results = await ipfs.add(this.state.buffer);
      let ipfsHash = results[0].hash;

      // store IPFS hash in contract
      const { accounts, contract } = this.state;
      await contract.methods.set(ipfsHash).send({ from: accounts[0] });

      this.setState({ ipfsHash: ipfsHash });

    } catch (error) {
      console.error(error);
    }

  }

  // this method is called whenever a file is uploaded
  // gets uploaded file and converts it to appropriate format for IPFS
  // stores the file in this component's state
  captureFile = (event) => {
    event.preventDefault();

    const file = event.target.files[0]; // access file from user input
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file); // convert file to array for buffer
    // after reader finishes, initialise buffer and store in component state
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });

      console.log('buffer', this.state.buffer); // console should log uint8array...
    }
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Your Image</h1>
        <p>This image is stored on IPFS & Ethereum blockchain!</p>
        <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt="" />
        <h2>Upload Image</h2>
        <form onSubmit={this.onSubmit}>
          <input type='file' onChange={this.captureFile}/>
          <input type='submit' />
        </form>
      </div>
    );
  }
}

export default App;
