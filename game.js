// MetaMask bağlantısı ve Web3 örneği oluşturma
let web3;
let accounts;
let gameContractInstance;

async function initWeb3() {
    if (typeof window.ethereum !== "undefined") {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            accounts = await web3.eth.getAccounts();
            document.getElementById("account").innerText = `Hesap: ${accounts[0]}`;
            initGameContract(); // Bu satırı ekleyin
        } catch (error) {
            console.error("Kullanıcı MetaMask'a bağlanmayı reddetti.");
        }
    } else {
        console.error("MetaMask yüklü değil.");
    }
}

// Oyun akıllı kontratı örneği oluşturma
function initGameContract() {
    gameContractInstance = new web3.eth.Contract(gameABI, gameContractAddress);
}

// Oyunu oynama ve ödül talep etme fonksiyonları
async function playGame() {
    try {
        await gameContractInstance.methods.playGame().send({ from: accounts[0] });
        alert("Oyun oynandı ve ödül kazanıldı!");
    } catch (error) {
        console.error("Oyun oynanamadı:", error.message);
    }
}

async function claimReward() {
    try {
        await gameContractInstance.methods.claimReward().send({ from: accounts[0] });
        alert("Ödül başarıyla talep edildi!");
    } catch (error) {
        console.error("Ödül talep edilemedi:", error.message);
    }
}

// Event listener'lar ve fonksiyonları çalıştırma
document.getElementById("connect").addEventListener("click", initWeb3);
document.getElementById("play-game").addEventListener("click", playGame);
document.getElementById("claim-reward").addEventListener("click", claimReward);
