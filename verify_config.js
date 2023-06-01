var verifyContractAddress = "0x1B5737e7B2FF42aE04C1400928213480DB1FA305";
var verifyContractAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "userAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "discordId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "secretCode",
				"type": "string"
			}
		],
		"name": "UserRegistered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_discordId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_secretCode",
				"type": "string"
			}
		],
		"name": "verify",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userDiscordId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];