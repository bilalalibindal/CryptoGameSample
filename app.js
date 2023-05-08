let web3;
let userAddress;
let contractInstance;

async function getConnectedNetwork() {
    const web3 = new Web3(window.ethereum);
    const networkId = await web3.eth.net.getId();
    const networkType = await web3.eth.net.getNetworkType();
    return { networkId, networkType };
}

async function switchToMumbai() {
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



async function initialize() {
    if (window.ethereum) {
        const { networkId } = await getConnectedNetwork();
        if (networkId != 80001){
            try {
                await switchToMumbai();
            }
            catch (error) {
                console.error(error);
            }
        }
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            userAddress = (await web3.eth.getAccounts())[0];
            contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
            tokenContract = new web3.eth.Contract(tokenAbi, tokenAddress);
            updateUI();
        } catch (error) {
            console.error("Kullanıcı hesabına erişim reddedildi.");
        }
    } else {
        console.error("Ethereum tarayıcı eklentisi bulunamadı.");
    }
}

async function purchaseStation() {
    try {
        await contractInstance.methods.purchaseStation().send({
            from: userAddress,
            value: web3.utils.toWei("0.01", "ether")
        });
        updateUI();
    } catch (error) {
        console.error("İstasyon satın alma işlemi başarısız oldu.");
    }
}

async function purchasePump() {
    try {
        await contractInstance.methods.purchasePump().send({from: userAddress})
        updateUI();
    } catch (error) {
        console.error("İstasyon satın alma işlemi başarısız oldu.");
    }
}

async function deposit() {
    try {
        const depositAmount = document.getElementById("depositAmount").value;
        const tokenAmount = web3.utils.toWei(depositAmount.toString());
        await tokenContract.methods.approve(contractAddress,tokenAmount).send({ from: userAddress });
        await contractInstance.methods.deposit(tokenAmount).send({ from: userAddress });
        updateUI();
        }
    catch (error) {
        console.error("Deposit işlemi başarısız oldu.", error);
    }
}

async function withdraw() {
    try {
        const withdrawAmount = document.getElementById("withdrawAmount").value;
        const tokenAmount = web3.utils.toWei(withdrawAmount.toString());
        await contractInstance.methods.withdraw(tokenAmount).send({ from: userAddress });
        updateUI();
    } catch (error) {
        console.error("Withdraw işlemi başarısız oldu.", error);
    }
}

async function displayBalances() {
    try {
        const depositBalance = await contractInstance.methods.depositBalance(userAddress).call();
        const depositBalanceInTokens = web3.utils.fromWei(depositBalance);

        // Deposit bakiyesini görüntüleyin
        console.log(`Deposit Bakiyesi: ${depositBalanceInTokens} OWL`);
    } catch (error) {
        console.error("Bakiye görüntüleme işlemi başarısız oldu.", error);
    }
}


async function updateUI() {
    const isStationOwner = await contractInstance.methods.stationOwner(userAddress).call();
    const pumpCount = await contractInstance.methods.gasPumpCount(userAddress).call();
    console.log(isStationOwner);
    if (isStationOwner) {
        document.getElementById("pumpSection").style.display = "block";
        document.getElementById("stationSection").style.display = "none"
    } else {
        document.getElementById("stationSection").style.display = "block"
        document.getElementById("pumpSection").style.display = "none";
    }

    document.getElementById("pumpCount").innerText = pumpCount;
    updateBalance();
}

async function updateBalance() {
    const balance = await contractInstance.methods.depositBalance(userAddress).call();
    const balanceInEther = web3.utils.fromWei(balance);
    balanceElement.textContent = balanceInEther;
}

const balanceElement = document.getElementById("balance");
document.getElementById("purchaseStation").addEventListener("click", purchaseStation);
document.getElementById("purchasePump").addEventListener("click", purchasePump);
document.getElementById("connectMetamask").addEventListener("click", initialize);
document.getElementById("deposit").addEventListener("click",deposit);
document.getElementById("withdraw").addEventListener("click",withdraw);

