class DApp {
    constructor() {
        this.web3 = new Web3(window.ethereum);
        this.contractInstance = new this.web3.eth.Contract(contractAbi, contractAddress);
        this.tokenContract = new this.web3.eth.Contract(tokenAbi, tokenAddress); // tokenContract tanımlanması
        this.userAddress = "";
    }

    setupEventListeners() {
        //document.getElementById('create-pump-button').addEventListener('click', () => this.createPump());
        document.getElementById('connectMetamask').addEventListener('click', () => this.initialize());
        document.getElementById('buy-station-button').addEventListener('click', () => this.buyStation());
        document.getElementById('deposit-button').addEventListener('click', () => this.deposit());
        document.getElementById('withdraw-button').addEventListener('click', () => this.withdraw());
        document.getElementById('buy-button').addEventListener('click', () => this.createPump());
    }

    async getConnectedNetwork() {
        const networkId = await window.ethereum.request({ method: 'eth_chainId' });
        return networkId;
}
    async switchToMumbai() {
        const mumbaiChain = {
            chainId: '0x13881',
            chainName: 'Mumbai Testnet',
            nativeCurrency: {
                name: 'Matic',
                symbol: 'MATIC',
                decimals: 18,
            },
            rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
            blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
        };
    
        try {
            // Önce Mumbai ağını kullanıcının cüzdanına ekleyin
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [mumbaiChain],
            });
    
            // Ardından Mumbai ağına geçin
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x13881' }],
            });
        } catch (error) {
            console.error(error);
        }
    }

    async initialize() {
        if (window.ethereum) {
            try {
                const { networkId } = await this.getConnectedNetwork();
                if (networkId != 80001) {
                    await this.switchToMumbai();
                }
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                this.userAddress = accounts[0];
                this.contractInstance = new this.web3.eth.Contract(contractAbi, contractAddress);
                this.updateUI();
            } catch (error) {
                console.error("Kullanıcı hesabına erişim reddedildi. Lütfen tekrar deneyin.", error);
            }
        } else {
            console.error("Ethereum tarayıcı eklentisi bulunamadı.");
        }
    }
    
    async getUserFeatures() {
        let users = await this.contractInstance.methods.users(this.userAddress).call();
        let isStationOwner = users.isStationOwner;
        let maxPumps = users.maxPumps;
        let depositBalance = await this.contractInstance.methods.depositBalance(this.userAddress).call()
        this.isStationOwner = isStationOwner;
        this.depositBalance = depositBalance;
        this.maxPumps = maxPumps;
    }
    async getPumpFeatures() {
        let userPumpsLength = await this.contractInstance.methods.getUserPumpsLength(this.userAddress).call();
        var createCost = await this.contractInstance.methods.getUpgradeCost(1).call();
        this.createCost = createCost;
        this.userPumpsLength = userPumpsLength;
    }
    async updatePumps() {
        for(let index = 0; index<this.userPumpsLength; index++){
            let pumpAtIndex = await this.contractInstance.methods.userPumps(this.userAddress, index).call();
            let level = pumpAtIndex.level;
            let fuelCapacity = pumpAtIndex.fuelCapacity;
            const pumpLevel = document.getElementById(`pump${index}-level`);
            const pumpFuel = document.getElementById(`pump${index}-fuel`);
            pumpLevel.textContent = `Level: ${level}`;
            pumpFuel.textContent = `Capacity: ${fuelCapacity}`;
        }
    }
    async updateDepositBalance() {
        let balanceElement = document.getElementById("balance");
        let balance = await this.contractInstance.methods.depositBalance(this.userAddress).call();
        let balanceInEther = this.web3.utils.fromWei(balance);
        balanceElement.textContent = `Balance: ${balanceInEther} PWL`;
    }
    async updateFuelPrice() {
        const fuelPriceElement = document.getElementById("fuelPrice");
        const fuelPrice = await this.contractInstance.methods.getCurrentFuelPrice().call();
        const fuelPriceInEther = this.web3.utils.fromWei(fuelPrice);
        fuelPriceElement.textContent = `Fuel Price: ${fuelPriceInEther}`;
    }
    
    async updateMaticBalance() {
        const maticBalanceElement = document.getElementById("maticBalance");
        let maticBalance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [this.userAddress, 'latest']
        });
        maticBalance = this.web3.utils.fromWei(maticBalance, 'ether');
        maticBalanceElement.textContent = `MATIC: ${parseFloat(maticBalance).toFixed(1)}`;
    }
    async updateMenus() {
        if (this.isStationOwner) {
            document.getElementById("buy-station-button").style.display = "none";
            document.getElementById("topMenu").style.display = "block";
            document.getElementById("bankMenu").style.display = "block";
            document.getElementById("pumpMenu").style.display = "block";
        } else {
            document.getElementById("buy-station-button").style.display = "block";
            document.getElementById("topMenu").style.display = "none";
            document.getElementById("bankMenu").style.display = "none";
            document.getElementById("pumpMenu").style.display = "none";
        }
    }
    async updateUI() {
        await this.getUserFeatures();
        await this.getPumpFeatures();
        await this.updatePumps();
        this.updateMenus()
        this.updateDepositBalance();
        this.updateFuelPrice();
        this.updateMaticBalance();
        
        console.log("Wallet: ", this.userAddress);
        console.log("PumpsLength: ", this.userPumpsLength);
        console.log("Is station owner: ", this.isStationOwner);
        console.log("Max Pumps: ", this.maxPumps);
        console.log("Deposit Balance: ", this.depositBalance);
        console.log("Create Cost ", this.createCost);
    }

    async buyStation() {
        try {
            await this.contractInstance.methods.buyStation().send({
                from: this.userAddress,
                value: this.web3.utils.toWei("0.01", "ether")
            });
            this.updateUI();
        } catch (error) {
            console.error("İstasyon satın alma işlemi başarısız oldu.");
        }
    }

    async deposit() {
        try {
            let depositAmount = document.getElementById("depositAmount").value;
            let tokenAmount = this.web3.utils.toWei(depositAmount.toString());
            await this.tokenContract.methods.approve(contractAddress,tokenAmount).send({ from: this.userAddress });
            await this.contractInstance.methods.deposit(tokenAmount).send({ from: this.userAddress });
            this.updateUI();
            }
        catch (error) {
            console.error("Deposit işlemi başarısız oldu.", error);
        }
    }
    async withdraw() {
        try {
            let withdrawAmount = document.getElementById("withdrawAmount").value;
            let tokenAmount = this.web3.utils.toWei(withdrawAmount.toString());
            await this.contractInstance.methods.withdraw(tokenAmount).send({ from: this.userAddress });
            this.updateUI();
        } catch (error) {
            console.error("Withdraw işlemi başarısız oldu.", error);
        }
    }
    
    async createPump() {
        const result = await this.contractInstance.methods.createPump().send({ from: this.userAddress });
        console.log("Pump created successfully:", result);
    }
}

const dApp = new DApp();

// Set up event listeners
dApp.setupEventListeners();