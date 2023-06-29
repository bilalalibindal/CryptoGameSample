var verifyContractAddress = "0x42458f6F1955e88DDcb5104cEedA6d12599A71a6";
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
				"indexed": true,
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
	}
]