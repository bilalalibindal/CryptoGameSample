// DApp class
class DApp {
    // Define important valuables and contracts in constructor
    constructor() {
        this.web3 = new Web3(window.ethereum); // web3 library for metamask
        this.contractInstance = new this.web3.eth.Contract(contractAbi, contractAddress); // Contract setup
        this.tokenContract = new this.web3.eth.Contract(tokenAbi, tokenAddress); // tokenContract
        this.userAddress = "";
        this.pumpCountDowns = []; // Array for multiple count down times
        this.intervalIDs = []; // Array for multiple count downs
        if (this.userAddress != "") {
            document.addEventListener("DOMContentLoaded", this.updateUI.bind(this));
        }
    }
    
    setupEventListeners() {
        //document.getElementById('create-pump-button').addEventListener('click', () => this.createPump());
        document.getElementById('connectMetamask').addEventListener('click', () => this.initialize());
        document.getElementById('buy-station-button').addEventListener('click', () => this.buyStation());
        document.getElementById('deposit-button').addEventListener('click', () => this.deposit());
        document.getElementById('withdraw-button').addEventListener('click', () => this.withdraw());
        document.getElementById('buy-button').addEventListener('click', () => this.createPump());
        document.getElementById('buy-place-button').addEventListener('click', () => this.buyPlace());
        document.getElementById('collect-button-0').addEventListener('click', () => this.collectPump(0));
        document.getElementById('refuel-button-0').addEventListener('click', () => this.refuelPump(0));
        document.getElementById('upgrade-button-0').addEventListener('click', () => this.upgradePump(0));
        document.getElementById('collect-button-1').addEventListener('click', () => this.collectPump(1));
        document.getElementById('refuel-button-1').addEventListener('click', () => this.refuelPump(1));
        document.getElementById('upgrade-button-1').addEventListener('click', () => this.upgradePump(1));
        document.getElementById('collect-button-2').addEventListener('click', () => this.collectPump(2));
        document.getElementById('refuel-button-2').addEventListener('click', () => this.refuelPump(2));
        document.getElementById('upgrade-button-2').addEventListener('click', () => this.upgradePump(2));
        document.getElementById('collect-button-3').addEventListener('click', () => this.collectPump(3));
        document.getElementById('refuel-button-3').addEventListener('click', () => this.refuelPump(3));
        document.getElementById('upgrade-button-3').addEventListener('click', () => this.upgradePump(3));
        document.getElementById('collect-button-4').addEventListener('click', () => this.collectPump(4));
        document.getElementById('refuel-button-4').addEventListener('click', () => this.refuelPump(4));
        document.getElementById('upgrade-button-4').addEventListener('click', () => this.upgradePump(4));
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
                this.updatePumpButtons();
            } catch (error) {
                console.error("Kullanıcı hesabına erişim reddedildi. Lütfen tekrar deneyin.", error);
            }
        } else {
            console.error("Ethereum tarayıcı eklentisi bulunamadı.");
        }
    }
    async getUpgradeCosts(level) {
        return await this.contractInstance.methods.getUpgradeCost(level).call();
    }
    async getFeatures() {
        let users = await this.contractInstance.methods.users(this.userAddress).call();
        let depositBalance = await this.contractInstance.methods.depositBalance(this.userAddress).call()
        let totalMined = await this.contractInstance.methods.totalMined().call({ from: this.userAddress })
        this.isStationOwner = users.isStationOwner;
        this.depositBalance = depositBalance;
        this.maxPumps = users.maxPumps;
        this.totalMined = parseFloat(this.web3.utils.fromWei(totalMined)).toFixed(2);
    }
    async getPumpFeatures() {
        let userPumpsLength = await this.contractInstance.methods.getUserPumpsLength(this.userAddress).call();
        this.upgradeCost_2 = await this.getUpgradeCosts(2)
        this.upgradeCost_3 = await this.getUpgradeCosts(3)
        this.userPumpsLength = userPumpsLength;
    }
    async updatePumpButtons() {
        let buyButton = document.getElementById(`buy-button`);
        buyButton.innerText = `buy\n${this.web3.utils.fromWei(await this.getUpgradeCosts(1))} PWL`;
        for(let index = 0; index<this.userPumpsLength; index++){
            let pumpAtIndex = await this.contractInstance.methods.userPumps(this.userAddress, index).call();
            let level = pumpAtIndex.level;
            let pumpIsWorking = pumpAtIndex.isWorking;
            let collectButton = document.getElementById(`collect-button-${index}`);
            let refuelButton = document.getElementById(`refuel-button-${index}`);
            let upgradeButton = document.getElementById(`upgrade-button-${index}`);
            if (pumpIsWorking && this.pumpCountDowns[index]>0) {
                collectButton.disabled = true; 
                collectButton.className = "disabled"; 
                refuelButton.disabled = true; 
                refuelButton.className = "disabled"; 
                upgradeButton.disabled = true; 
                upgradeButton.className = "disabled"; 

            } else if (pumpIsWorking && this.pumpCountDowns[index] <= 0) {
                collectButton.disabled = false; 
                collectButton.className = "enabled";
                refuelButton.disabled = true; 
                refuelButton.className = "disabled"; 
                upgradeButton.disabled = true; 
                upgradeButton.className = "disabled"; 
            } else if (!pumpIsWorking && pumpAtIndex.fuel == 0) {
                collectButton.disabled = true; 
                collectButton.className = "disabled"; 
                refuelButton.disabled = false;
                refuelButton.className = "enabled";
                upgradeButton.disabled = false; 
                upgradeButton.className = "enabled";
            }
            collectButton.innerText = `collect\n${this.fuelPriceInEther * pumpAtIndex.fuelCapacity} PWL`;
            refuelButton.innerText = `Refuel\n${parseFloat(this.fuelPriceInEther * pumpAtIndex.fuelCapacity * 0.05).toFixed(4)} PWL`;
            if (level == 1) {
                upgradeButton.innerText = `upgrade\n${this.web3.utils.fromWei(this.upgradeCost_2)} PWL`;
            }
            else if (level == 2) {
                upgradeButton.innerText = `upgrade\n${this.web3.utils.fromWei(this.upgradeCost_3)} PWL`;
            }
        }
    }
    async updatePumps() {
        if(this.userPumpsLength >= 3) {
            let buyPlace = document.getElementById("buy-place-button");
            buyPlace.style.display = "block";
        }
        for(let index = 0; index<this.userPumpsLength; index++){
            let pumpAtIndex = await this.contractInstance.methods.userPumps(this.userAddress, index).call();
            let level = pumpAtIndex.level;
            let fuelCapacity = pumpAtIndex.fuelCapacity;
            this.pumpCountDowns[index] = await this.contractInstance.methods
            .getRemainingCooldown(index)
            .call({ from: this.userAddress });
            console.log("Cool Down: ", this.pumpCountDowns[index]);
            let timeElement = document.getElementById(`pump${index}-time`);
            let timeBarElements = document.getElementById(`pump${index}-progress`);
            let pump = document.getElementById(`pump${index}`);
            let pumpImg = document.getElementById(`pump${index}-img`);
            let upgradeButton = document.getElementById(`upgrade-button-${index}`);
            if (level >= 3){
                upgradeButton.style.display = "none";
            }
            pump.style.display = "block";
            pump.style.display = "flex";
            pumpImg.src = `./images/${level}.png`;
            const pumpLevel = document.getElementById(`pump${index}-level`);
            const pumpFuel = document.getElementById(`pump${index}-fuel`);
            pumpLevel.textContent = `Level: ${level}`;
            pumpFuel.innerHTML = `Capacity: ${fuelCapacity}`;
            // Eğer önceden bir setInterval varsa onu temizle
            if (this.intervalIDs[index]) {
                clearInterval(this.intervalIDs[index]);
            }
            
            // Yeni bir setInterval oluştur ve ID'sini sakla
            this.intervalIDs[index] = setInterval(() => {
                this.pumpCountDowns[index] -= 1;
                if (this.pumpCountDowns[index] <= 0) {
                    clearInterval(this.intervalIDs[index]);
                    timeElement.innerText = `Ready`;
                    timeBarElements.style.width = '0%';
                    this.updatePumpButtons();
                    return;
                }
                timeElement.innerText = `Time: ${this.pumpCountDowns[index]}`;
                let percentRemaining = (this.pumpCountDowns[index] / pumpAtIndex.refuelTime) * 100;
                timeBarElements.style.width = `${percentRemaining}%`;
            },1000);
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
        this.fuelPriceInEther = this.web3.utils.fromWei(fuelPrice);
        fuelPriceElement.textContent = `Fuel Price: ${this.fuelPriceInEther}`;
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
        await this.getFeatures();
        console.log("Total Mined: ",this.totalMined);
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
                value: this.web3.utils.toWei("0.0", "ether")
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
        this.updateUI();
        this.updatePumpButtons();
    }
    async collectPump(pumpIndex) {
        await this.contractInstance.methods.collect(pumpIndex).send({ from: this.userAddress });
        this.updateUI();
        this.updatePumpButtons();
    }
    async refuelPump(pumpIndex) {
        await this.contractInstance.methods.refuelPump(pumpIndex).send({ from: this.userAddress });
        this.updateUI();
        this.updatePumpButtons();
    }
    async upgradePump(pumpIndex) {
        await this.contractInstance.methods.upgradePump(pumpIndex).send({ from: this.userAddress });
        this.updateUI();
        this.updatePumpButtons();
    }
    async buyPlace() {
        await this.contractInstance.methods.buyExtraPlace().send({ 
            from: this.userAddress,
            value: this.web3.utils.toWei("0.0", "ether") });
        this.updateUI();
    }
}

const dApp = new DApp();

// Set up event listeners
dApp.setupEventListeners();