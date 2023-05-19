// DApp class
class DApp {
    // Define important valuables and contracts in constructor
    constructor() {
        this.web3 = new Web3(window.ethereum); // web3 library for metamask
        // contractAbi and contractAddress and tokenAbi and tokenAddress comes from config.js file
        this.contract = new this.web3.eth.Contract(contractAbi, contractAddress); // Smart Contract setup
        this.tokenContract = new this.web3.eth.Contract(tokenAbi, tokenAddress); // token Contract
        this.userAddress = ""; // Define user address as none
        this.pumpCountDowns = []; // Array for multiple count down times
        this.intervalIDs = []; // Array for multiple count downs
    }
    setupEventListeners() {
        this.buyStationButton_HTML.addEventListener('click', () => this.buyStation());
        // Pump Buttons
        document.getElementById('buy-pump-button').addEventListener('click', () => this.createPump());
        document.getElementById('collect-button-0').addEventListener('click', () => this.collectPump(0));
        document.getElementById('refuel-button-0').addEventListener('click', () => this.refuelPump(0));
        document.getElementById('upgrade-button-0').addEventListener('click', () => this.upgradePump(0));
        document.getElementById('collect-button-1').addEventListener('click', () => this.collectPump(1));
        document.getElementById('refuel-button-1').addEventListener('click', () => this.refuelPump(1));
        document.getElementById('upgrade-button-1').addEventListener('click', () => this.upgradePump(1));
        document.getElementById('collect-button-2').addEventListener('click', () => this.collectPump(2));
        document.getElementById('refuel-button-2').addEventListener('click', () => this.refuelPump(2));
        document.getElementById('upgrade-button-2').addEventListener('click', () => this.upgradePump(2));
        /*document.getElementById('collect-button-3').addEventListener('click', () => this.collectPump(3));
        document.getElementById('refuel-button-3').addEventListener('click', () => this.refuelPump(3));
        document.getElementById('upgrade-button-3').addEventListener('click', () => this.upgradePump(3));
        document.getElementById('collect-button-4').addEventListener('click', () => this.collectPump(4));
        document.getElementById('refuel-button-4').addEventListener('click', () => this.refuelPump(4));
        document.getElementById('upgrade-button-4').addEventListener('click', () => this.upgradePump(4));*/
    }
    async getConnectedNetwork() {
        const networkId = await window.ethereum.request({ method: 'eth_chainId' });
        return networkId;
    }
    async switchToNetwork() {
        // Define network.
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
            // Add network to metamask.
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [mumbaiChain],
            });
    
            // And switch to network we added.
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x13881' }],
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
                if (networkId != 80001) { // 8001 is mumbai network's chain id
                    await this.switchToNetwork(); // if user is not connected to true network, switch it
                }
                // Get user's metamask address.
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                this.userAddress = accounts[0]; // bring and define user's first address from metamask.
                await this.buildPage();
                console.log(this.userAddress);
            } catch (error) {
                console.error("Access denied, please try again.", error);
            }
        } else {
            console.error("Metamask extension is not found.");
        }
    }
    /* ---------------------------------------------- CONTRACT METHODS ---------------------------------------------- */
    // Method to bring upgrade costs from contract
    async getUpgradeCosts(level) {
        return await this.contract.methods.getUpgradeCost(level).call();
    }
    async defineFromContract() {
        // Define users mapping and variables from smart contract
        this.users = await this.contract.methods.users(this.userAddress).call();
        this.isStationOwner = this.users.isStationOwner;
        this.isRefineryOwner = this.users.isRefineryOwner;
        this.lastDrillOilTime = this.users.lastDrillOilTime;
        this.maxPumps = this.users.maxPumps;
        this.tokenBalance = this.web3.utils.fromWei(this.users.tokenBalance);
        this.oilBalance = this.users.oilBalance;
        // Define and get userPumpsLength from smart contract
        this.userPumpsLength = await this.contract.methods.getUserPumpsLength(this.userAddress).call();
        // Define total mined and pull value from smart contract
        this.totalMined = await this.contract.methods.totalMined().call({ from: this.userAddress })
        // Get value of current fuel price
        this.fuelPrice = this.web3.utils.fromWei(await this.contract.methods.getCurrentFuelPrice().call());
        console.log(this.web3.utils.fromWei(this.totalMined));
        await this.web3.eth.getBalance(contractAddress, (err, wei) => { 
            this.maticPoolAmount = this.web3.utils.fromWei(wei, 'ether'); 
        });
    }
    /* ---------------------------------------------- EVENT METHODS ---------------------------------------------- */
    async buyStation() {
        try {
            await this.contract.methods.buyStation().send({
                from: this.userAddress,
                value: this.web3.utils.toWei("0.0", "ether")
            })
            this.buildPage();
        } catch (error) {
            console.error("Purchase station transaction has been denied");
        }
    }
    async buyRefinery() {
        try {
            await this.contract.methods.buyRefinery().send({
                from: this.userAddress,
                value: this.web3.utils.toWei("0.0", "ether")
            })
            // Update method here
        } catch (error) {
            console.error("Purchase station transaction has been denied");
        }
    }
    async createPump() {
        const result = await this.contract.methods.createPump().send({ from: this.userAddress });
        console.log("Pump created successfully:", result);
        await this.updateTopMenu();
        this.buildPumps();
    }
    async collectPump(pumpIndex) {
        await this.contract.methods.collect(pumpIndex).send({ from: this.userAddress });
        await this.updateTopMenu();
        this.buildPump(pumpIndex);
    }
    async refuelPump(pumpIndex) {
        await this.contract.methods.refuelPump(pumpIndex).send({ from: this.userAddress });
        await this.updateTopMenu();
        this.buildPump(pumpIndex);
    }
    async upgradePump(pumpIndex) {
        await this.contract.methods.upgradePump(pumpIndex).send({ from: this.userAddress });
        await this.updateTopMenu();
        this.buildPump(pumpIndex);
    }
    /* ---------------------------------------------- UPDATE METHODS ---------------------------------------------- */
    async buildPage() {
        // run set variables function.
        await this.defineFromHTML();
        this.loadingIcon.style.display = 'block';
        await this.defineFromContract();
        await this.checkStation();
        await this.updateTopMenu();
        await this.buildPumps();
        this.setupEventListeners();
        this.loadingIcon.style.display = 'none';
    }
    async buildPumps() {
        this.loadingIcon.style.display = 'block';
        await this.updateAllPumpCooldown();
        await this.updateAllPumpFeatures();
        await this.updateAllPump();
        this.loadingIcon.style.display = 'none';
    }
    async buildPump(pumpIndex) {
        this.loadingIcon.style.display = 'block';
        await this.updatePumpCooldown(pumpIndex);
        await this.updatePumpFeatures(pumpIndex);
        await this.updatePump(pumpIndex);
        this.loadingIcon.style.display = 'none';
    }
    async updateUI() {
        await this.defineFromContract();
        this.updateTopMenu();
    }
    async checkStation() { // Check is user has station.
        this.loadingIcon.style.display = 'block';
        if (!this.isStationOwner) {
            this.displayPart2();
            this.hideContainer();
            this.hideContainer2();
            this.hideContainer3();
        }                                // Visibility settings of images and properties
        else {
            this.hidePart2();
            this.displayContainer();
            this.displayContainer2();
            this.displayContainer3();
        }
        this.loadingIcon.style.display = 'none'; 
    }   
    async updateTopMenu() {
        await this.defineFromContract();
        this.loadingIcon.style.display = 'block';
        this.depositBalance_HTML.innerText = this.tokenBalance;
        this.fuelPrice_HTML.innerText = `= ${this.fuelPrice}`;
        this.maticPool_HTML.innerText = this.maticPoolAmount;
        this.loadingIcon.style.display = 'none'; 
    }
    async updateAllPump(){
        for(let index = 0; index<this.userPumpsLength; index++){
            await this.updatePump(index);
        }
    }
    async updateAllPumpFeatures(){
        for(let index = 0; index<this.userPumpsLength; index++){
            await this.updatePumpFeatures(index);
        }
    }
    async updateAllPumpCooldown(){
        for(let index = 0; index<this.userPumpsLength; index++){
            await this.updatePumpCooldown(index);
        }
    }
    async updatePump(pumpIndex) {
        let pump = await this.contract.methods.userPumps(this.userAddress, pumpIndex).call();
        let pumpSection = document.getElementById(`pump-section-${pumpIndex}`);
        let pumpImg = document.getElementById(`pump-img-${pumpIndex}`);
        pumpSection.style.display = "flex";
        pumpImg.src = `./images/pump${pump.level}.svg`;
        console.log("1");
    }
    async updatePumpFeatures(pumpIndex) {
        let pump = await this.contract.methods.userPumps(this.userAddress, pumpIndex).call();
        let pumpFuelCapacity = document.getElementById(`pump-fuel-capacity-${pumpIndex}`);
        let pumpCollectButton = document.getElementById(`collect-button-${pumpIndex}`);
        let pumpRefuelButton = document.getElementById(`refuel-button-${pumpIndex}`);
        let pumpUpgradeButton = document.getElementById(`upgrade-button-${pumpIndex}`);
        let pumpFuelBar = document.getElementById(`fuel-bar-${pumpIndex}`);
        const pumpIsWorking = pump.isWorking;
        if (pump.level >= 3){
            pumpUpgradeButton.style.display = "none";
        }
        if (pump.fuel != 0){
            pumpFuelBar.style.height = "100%";
        }
        else {
            pumpFuelBar.style.height = "0%";
        }
        pumpFuelCapacity.innerText = pump.fuelCapacity;
        pumpCollectButton.innerText = `COLLECT\n${pump.fuelCapacity * this.fuelPrice} PWL`;
        pumpRefuelButton.innerText = `REFUEL\n${pump.fuelCapacity * this.fuelPrice * 0.05} PWL`;
        pumpUpgradeButton.innerText = `UPGRADE\n${this.web3.utils.fromWei
            (await this.getUpgradeCosts(parseInt(pump.level)+1))} PWL`;
        if (Boolean(pumpIsWorking) && this.pumpCountDowns[pumpIndex]>0) {
            pumpCollectButton.disabled = true; 
            //pumpCollectButton.className = "disabled"; 
            pumpRefuelButton.disabled = true; 
            //pumpRefuelButton.className = "disabled"; 
            pumpUpgradeButton.disabled = true; 
            //pumpUpgradeButton.className = "disabled"; 
        } else if (!Boolean(pumpIsWorking) && pump.fuel == 0) {
            pumpCollectButton.disabled = true; 
            //pumpCollectButton.className = "disabled"; 
            pumpRefuelButton.disabled = false;
            //pumpRefuelButton.className = "enabled";
            pumpUpgradeButton.disabled = false; 
            //pumpUpgradeButton.className = "enabled";
        } else if (this.pumpCountDowns[pumpIndex] <= 0 && Boolean(pumpIsWorking)) {
            pumpCollectButton.disabled = false; 
            //pumpCollectButton.className = "enabled";
            pumpRefuelButton.disabled = true; 
            //pumpRefuelButton.className = "disabled"; 
            pumpUpgradeButton.disabled = true; 
            //pumpUpgradeButton.className = "disabled"; 
        }
        console.log("2");
    }
    async updatePumpCooldown(pumpIndex) {
        let pump = await this.contract.methods.userPumps(this.userAddress, pumpIndex).call();
        this.pumpCountDowns[pumpIndex] = await this.contract.methods
            .getRemainingCooldown(pumpIndex)
            .call({ from: this.userAddress });
        if(this.pumpCountDowns[pumpIndex] > 0){
            this.pumpCountDowns[pumpIndex] = parseInt(this.pumpCountDowns[pumpIndex]) + parseInt(10);
            let timeElement = document.getElementById(`pump-time-${pumpIndex}`);
            let timeBarElement = document.getElementById(`pump-progress-${pumpIndex}`);
            // Eğer önceden bir setInterval varsa onu temizle
            if (this.intervalIDs[pumpIndex]) {
                clearInterval(this.intervalIDs[pumpIndex]);
            }
            // Yeni bir setInterval oluştur ve ID'sini sakla
            this.intervalIDs[pumpIndex] = setInterval(() => {
                this.pumpCountDowns[pumpIndex] -= 1;
                if (this.pumpCountDowns[pumpIndex] <= 0) {
                    clearInterval(this.intervalIDs[pumpIndex]);
                    timeElement.innerText = `READY`;
                    timeBarElement.style.width = '0%';
                    this.buildPump(pumpIndex);
                    return;
                }
                timeElement.innerText = `Time: ${this.pumpCountDowns[pumpIndex]}`;
                let percentRemaining = (this.pumpCountDowns[pumpIndex] / pump.refuelTime) * 100;
                timeBarElement.style.width = `${percentRemaining}%`;
            },1000);
        }
        console.log("3");  
    }
    /* ---------------------------------------------- HTML METHODS ---------------------------------------------- */
    async defineFromHTML() { // Define html elements by id
        this.loadingIcon = document.getElementById('loading-icon');
        this.depositBalance_HTML = document.getElementById("deposit-balance");
        this.fuelPrice_HTML = document.getElementById("current-fuel-price");
        this.maticPool_HTML = document.getElementById("matic-pool");
        this.buyStationButton_HTML = document.getElementById("buy-station-button");
        this.container_HTML = document.querySelectorAll(".container");
        this.container_2_HTML = document.querySelectorAll(".container2");
        this.container_3_HTML = document.querySelectorAll(".container3 .card2");
        this.part_2_HTML = document.querySelectorAll(".part2");
        this.collectPumpButton_0_HTML = document.getElementById("collect-button-0");
        this.collectPumpButton_1_HTML = document.getElementById("collect-button-1");
        this.collectPumpButton_2_HTML = document.getElementById("collect-button-2");
        /*this.collectPumpButton_3_HTML = document.getElementById("collect-button-3");
        this.collectPumpButton_4_HTML = document.getElementById("collect-button-4");*/
        this.refuelPumpButton_0_HTML = document.getElementById("refuel-button-0");
        this.refuelPumpButton_1_HTML = document.getElementById("refuel-button-1");
        this.refuelPumpButton_2_HTML = document.getElementById("refuel-button-2");
        /*this.refuelPumpButton_3_HTML = document.getElementById("refuel-button-3");
        this.refuelPumpButton_4_HTML = document.getElementById("refuel-button-4");*/
        this.upgradeButton_0_HTML = document.getElementById("upgrade-button-0");
        this.upgradeButton_1_HTML = document.getElementById("upgrade-button-1");
        this.upgradeButton_2_HTML = document.getElementById("upgrade-button-2");
        /*this.upgradeButton_3_HTML = document.getElementById("upgrade-button-3");
        this.upgradeButton_4_HTML = document.getElementById("upgrade-button-4");*/
    }
    displayContainer() {
        // Makes the display property "flex" for each element
        this.container_HTML.forEach(function(element) {
            element.style.display = "flex";
            });
    }
    hideContainer() {
        // Makes the display property "none" for each element
        this.container_HTML.forEach(function(element) {
            element.style.display = "none";
            });
    }
    displayPart2() {
        // Makes the display property "flex" for each element
        this.part_2_HTML.forEach(function(element) {
            element.style.display = "flex";
            });
    }
    hidePart2() {
        // Makes the display property "none" for each element
        this.part_2_HTML.forEach(function(element) {
            element.style.display = "none";
            });
    }
    displayContainer2() {
        // Makes the display property "flex" for each element
        this.container_2_HTML.forEach(function(element) {
            element.style.display = "flex";
            });
    }
    hideContainer2() {
        // Makes the display property "none" for each element
        this.container_2_HTML.forEach(function(element) {
            element.style.display = "none";
            });
    }
    displayContainer3() {
        // Makes the display property "flex" for each element
        this.container_3_HTML.forEach(function(element) {
            element.style.display = "flex";
            });
    }
    hideContainer3() {
        // Makes the display property "none" for each element
        this.container_3_HTML.forEach(function(element) {
            element.style.display = "none";
            });
    }
}
window.onload = async function() {
    let dApp = new DApp();
    await dApp.initialize();
    // Diğer başlangıç kodlarınız
}