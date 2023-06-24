class Verify {
    // Define important valuables and contracts in constructor
    constructor() {
        this.web3 = new Web3(window.ethereum); // web3 library for metamask
        // contractAbi and contractAddress and tokenAbi and tokenAddress comes from verify.js file
        this.contract = new this.web3.eth.Contract(verifyContractAbi, verifyContractAddress); // Smart Contract setup
        this.userAddress = "";
    }
    setupEventListeners() {
        document.getElementById('verify-button').addEventListener('click', () => this.verify());
    }
    async getConnectedNetwork() {
        const networkId = await window.ethereum.request({ method: 'eth_chainId' });
        return networkId;
    }
    async switchToNetwork() {
        // Define network.
        const polygonChain = {
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency: {
                name: 'Matic',
                symbol: 'MATIC',
                decimals: 18,
            },
            rpcUrls: ['https://polygon-rpc.com/'],
            blockExplorerUrls: ['https://polygonscan.com/'],
        };
    
        try {
            // Add network to metamask.
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [polygonChain],
            });
    
            // And switch to network we added.
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }],
            });
        } catch (error) {
            console.error(error);
        }
    }
    // Connect metamask and start to update and pull data.
    async initialize() {
        if (window.ethereum) { // Check is metamask exist.
            try {
                const { networkId } = await this.getConnectedNetwork(); // Check is user connected to true network
                if (networkId != 137) { // 8001 is mumbai network's chain id
                    await this.switchToNetwork(); // if user is not connected to true network, switch it
                }
                // Get user's metamask address.
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                this.userAddress = accounts[0]; // bring and define user's first address from metamask.
                console.log(this.userAddress);
                this.setupEventListeners();
            } catch (error) {
                console.error("Access denied, please try again.", error);
            }
        } else {
            this.showAlert("Metamask extension is not found.");
        }
    }
    async getGasPrice() {
        let gasPrice = await this.web3.eth.getGasPrice();
    
        // gasPrice is already in Wei. If you want to convert it to Gwei, use the following line.
        // gasPrice = this.web3.utils.fromWei(gasPrice, 'gwei');
    
        return gasPrice;
    }
    
    async verify() {
        const urlParams = new URLSearchParams(window.location.search);
        const discordID = urlParams.get('discordID');
        const code = urlParams.get('code');
        let gasPrice = await this.getGasPrice(); // get current gas price
        await this.contract.methods.verify(discordID, code).send({
            from: this.userAddress,
            value: this.web3.utils.toWei("0.5", "ether"),
            gasPrice: gasPrice  // use gas price here
        });
    }
    showAlert(message) {
        let alertDiv = document.createElement('div');
        alertDiv.style.position = 'fixed';
        alertDiv.style.bottom = '10px';
        alertDiv.style.left = '10px';
        alertDiv.style.backgroundColor = 'red';
        alertDiv.style.color = 'white';
        alertDiv.style.padding = '10px';
        alertDiv.textContent = message;
    
        document.body.appendChild(alertDiv);
    
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 5000); // After 5 seconds, remove the alert.
    }
       
}
window.onload = async function() {
    let verify = new Verify();
    await verify.initialize();
}
