const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
var async  = require('async');
var loginAttempts = require('../../model/loginAttempts');
var blockip = require('../../model/blockip');
const userhis = require('../../model/userhistory');
var fs = require('fs');

let common = require('../../helpers/common');
let socketdata = require('../../helpers/socketdata');
var endecrypt = require('../../helpers/newendecryption');
var mail = require('../../helpers/mail');
var disposal = require('../../helpers/disposal_email');

let moment = require('moment');
var validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const useragent = require('useragent');
var Client = require('node-rest-client').Client;
var restCli = new Client();
const plivo = require('plivo');
const plivoCli = new plivo.Client('MAM2Y5Y2QYYZIXN2I0MJ','ODkyNzczMDUxYzk3YzE5OTg4M2Y1YzE2MTU2Nzc5');

//db schemas
const users = require('../../model/users');
const userBal = require('../../model/userBalance');
const userAddr = require('../../model/userAddress');
const srUser = require('../../model/sr_users_info');
const freezeInfo = require('../../model/freeze_info');
const proposalInfo = require('../../model/proposals_info');
const userVotes = require('../../model/votes');
const proposal = require('../../model/proposal');

const variiable = require('../../config/variables');


const { createProxyMiddleware } = require('http-proxy-middleware')
const HrcryptoWeb = require('hrcryptoweb');
const RubyWeb = require('rubyweb');
function onProxyRes(proxyRes, req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-with,Content-Type,Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
}

var fullnode = express()
fullnode.use('/', createProxyMiddleware({
    target: variiable.fullNode,
    changeOrigin: true,
    onProxyRes
}))
fullnode.listen(8099)

var soliditynode = express()
soliditynode.use('/', createProxyMiddleware({
    target: variiable.solidityNode,
    changeOrigin: true,
    onProxyRes
}))
soliditynode.listen(8098)

const fullNode = variiable.fullNode;
const solidityNode = variiable.solidityNode; 
const eventServer = variiable.eventServer;
const privateKey = variiable.privateKey;

const hrcryptoWeb = new HrcryptoWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

const rubyweb = new RubyWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

router.get('/fetchSRList_feature', (req,res) => {
	listSuperRepresentatives()
	async function listSuperRepresentatives(){
		rubyweb.ruby.listSuperRepresentatives().then(result => {
			generatefetchSRListData(result, function(returnData) {
				return res.json({success: 1, "SR_details":returnData});
			});
			//res.json({status: true, "SR_details": result})
		});
	}
});

router.get('/fetchSRList', common.tokenMiddleware, (req,res) => {
	let userId = req.userId;
	srUser.find().sort({votes_count: -1}).exec(function(err, resp) {
		if(resp){
	 		generatefetchSRListData(resp, userId, function(returnData) {
	 			userVotes.aggregate([{ $group: { _id:null, totalvotes: {$sum: "$votes"}}}]).exec(function(err2, data2) {
	 				userBal.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err, data1) {
	 					userVotes.aggregate([{"$match": {"user_id" : mongoose.mongo.ObjectId(userId)}},{"$group": {'_id': 'null','totals': {'$sum': "$votes"}}}]).exec(function(err2, data3) {
		 					srUser.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err4, data4){
		 						if(data4){
		 							var findsruser = "sruser";
		 						}
		 						else{
		 							var findsruser = "nonsruser";
		 						}
								
				 				if(data2.length > 0){	
				 					var totalvotes = data2[0].totalvotes;
				 					return res.json({success: 1, "SR_details": returnData,'total_votes':totalvotes, "bal": data1, "votecount": data3, "user" : findsruser});
				 				}
				 				else{
				 					var totalvotes = 0;
				 					return res.json({success: 1, "SR_details": returnData,'total_votes':totalvotes, "bal": data1, "votecount": data3, "user" : findsruser});
				 				}
		 					})
	 					})
					})
				});
	 		});
		}else{
			return res.json({success: 0, msg : "usernot found"});
		}
 	});
});

function generatefetchSRListData(data, userId, callback) {
	var length = data.length;
	var result = [];
	if(length > 0){
		var i = 1;
		data.forEach((val) => {
			users.findOne({_id:mongoose.mongo.ObjectId(val.user_id)}).exec(function(err, data1){
				userVotes.aggregate([
					{ $match: {user_id:mongoose.mongo.ObjectId(userId), vote_receiver:mongoose.mongo.ObjectId(val.user_id)} },
					{ $group: { _id:null, totalvotes: {$sum: "$votes"} } }
				]).exec(function(err2, data2) {
					if(data2[0]) {
							var totalvotes = data2[0].totalvotes
					} else {
							var totalvotes = 0;
					}
					var SRlistdata_data = {
						Vote_Count: parseInt(val['vote_count']),
						url: val['website_url'],
						Latest_BlockNum: val['lastest_block'],
						UserName: data1.username,
						Rankno:i,
						UserId: val.user_id,
						myVotes: totalvotes 
					}
					result.push(SRlistdata_data);
					if(i == length) { callback(result); }
					i = i+1;	
				});
			});
		});
	}
	else{
		callback([]);
	}
}

function generatefetchSRListData_feature(data, callback) {
	var length = data.length;
	var result = [];
	data.sort(function(a, b){return b.Vote_Count - a.Vote_Count});
	if(length > 0){
		var i = 1;
		data.forEach((val) => {
			userAddr.findOne({address_hex: val.address}).exec(function(err1, res){
				users.findOne({_id:mongoose.mongo.ObjectId(res.user_id)}).exec(function(err, data1){
					val.userName =  data1.username;
					val.Rank = i;

					var SRlistdata_data = {
						User_address:  val['address'],
						Vote_Count: val['voteCount'],
						url : val['url'],
						Total_Block_Produced : val['totalProduced'],
						Latest_BlockNum : val['latestBlockNum'],
						Latest_SlotNum : val['latestSlotNum'],
						isJobs: val['isJobs'],
						UserName : val['userName'],
						Rankno:val['Rank']
					}
					result.push(SRlistdata_data);
					if(i == length) { callback(result); }
					i = i+1;
				})
			});
		});
	}
	else{
		callback([]);
	}
}

router.get('/getUserBalance', common.tokenMiddleware, (req,res) => {
	let userId  = req.userId;
	userBal.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {
		if(data){
			res.json({status:1, balance:data.balance / 1000000 });
		}else{
			res.json({status:0, msg: "balance not found", balance: 0 });
		}
	})
});


router.post('/createSR', common.tokenMiddleware, (req,res) => {
	let userId  = req.userId;
	srUser.findOne({user_id:mongoose.mongo.ObjectId(userId)}).countDocuments().exec(function(err, data) { 
		if(data) {
			res.json({status:0, msg:'You are already SR.' });
		} else {
			userBal.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err, data) { 
				if((data.balance/1000000) >= 9999) {
					userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {
						if(data) {
							var privateKey = data.privateKey;
							url = variiable.blockchain_url+"/transfer/H7hSNyHe7jihCvbBpnN7x3GyVG3NfuU8b9/9999000000/"+privateKey;
							var args = { headers: {"Content-Type":"application/json"} };
							restCli.get(url, args, function (resData, resp) { 
								if(data) {
									let obj = {
										user_id: userId,
										website_url: req.body.webaddress,
										vote_count: 0,
										lastest_block: 0,
										status: 'Normal',
									}

									let isInserted = srUser.create(obj, function(err,resData1) {
										if(resData1) {
											res.json({status:1, msg:'Success Now you are SR' });
										}
										if(err) {
											res.json({status:0, msg:'Please Try Again' });
										}
									});
								}
								if(err) {
									res.json({status:0, msg:'Please try again' });
								}
							});
						} 

						if(err) {
							res.json({status:0, msg:'Please Try Again' });
						}
					});
				} else {
					res.json({status:0, msg:'Insufficient Balance' });
				}
				if(err) {
					res.json({status:0, msg:'Something went Wrong' });
				}
			})
		}
	});
});

router.post('/createSR_feature', common.tokenMiddleware, (req,res) => {
	let userId  = req.userId;
	
	userBal.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(balerr, baldata) {
		if((baldata.balance/1000000) >= 9999) {
			userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(addrerr, addrdata) { 
				if(addrdata) {
					var url = Buffer.from(req.body.webaddress).toString('hex');
					var args = { data: {owner_address:addrdata.address_hex,url:url}, headers: {"Content-Type":"application/json"} };
					restCli.post(variiable.fullNode+"/wallet/createwitness", args, function (resData, response) {
						if(resData) {
							var transaction = {
								raw_data:resData['raw_data'],
								raw_data_hex:resData['raw_data_hex']
							}
							var privateKey = addrdata.privateKey;
							privateKey = privateKey.toLowerCase();
							var args1 = { data: {transaction:transaction,privateKey:privateKey}, headers: {"Content-Type":"application/json"} };
							restCli.post(variiable.fullNode+"/wallet/gettransactionsign", args1, function (resData1, response1) {
								if(resData1) {
									var signature = resData1['raw_data'];
									var args2 = { data: {raw_data:resData1['raw_data'],raw_data_hex:resData1['raw_data_hex']}, headers: {"Content-Type":"application/json"} };

									restCli.post(variiable.fullNode+"/wallet/broadcasttransaction", args2, function (resData2, response2) {
										let obj = {
											user_id: userId,
											website_url: req.body.webaddress,
											vote_count: 0,
											lastest_block: 0,
											status: 'Normal',
										};
										let isInserted = srUser.create(obj, function(err,resData3) {
											if(resData3) {
												res.json({status:1, msg:'Created sr user', datas : resData, datas1 : resData1, datas2 : resData2 });
											}
											if(err) {
												res.json({status:0, msg:'Please Try Again' });
											}
										});
									});

								} else {
									res.json({status:0, msg:'Please try again' });
								}
							});
						} else {
							res.json({status:0, msg:'Please try again' });
						}
					});
				} 
				if(addrerr) {
					res.json({status:0, msg:'Please try again' });
				}
			});				
		} else {
			res.json({status:0, msg:'Insufficient Balance' });
		}
		if(balerr) {
			res.json({status:0, msg:'Something went Wrong' });
		}
	});
});

router.get('/chainparams', (req,res) => {
	chainparams()
	async function chainparams(){
		const getChainParameters = await rubyweb.ruby.getChainParameters();
		res.json({success: 1, getChainParameters:getChainParameters});
	}
})

router.get('/listProposal', (req,res) => {

	// const privateKey = '35591DF7BF4A4F74F31F52D568E97891CD155E4A2DE8E8D6A178C4CD58723CFC'

	// const hrcryptoWeb = new HrcryptoWeb(
	//     fullNode,
	//     solidityNode,
	//     eventServer,
	//     privateKey
	// );

	listProposals()
	async function listProposals(){
		rubyweb.ruby.listProposals().then(result => {
			res.json({success: 1, "Proposal_details": result})
		});
	}
})

router.get('/srUsers', common.tokenMiddleware, (req, res) => {
	let userId = req.userId;
	srUser.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err, data){
		if(data){
			res.json({success:1, msg: "find SR user !" });
		}else{
			res.json({success:0, msg: " user not found!" });
		}
	});
})

router.get('/probalance', common.tokenMiddleware, (req, res) => {
	let userId = req.userId;
	userBal.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {
		if((data.balance/1000000) >= 9999){
			res.json({success:1, msg: "User have a Balance!" });
		}
		else{
			res.json({success:0, msg:'it costs 9.999 TRX to apply for a super representative, and the balance is insufficient' });
		}
	})
});

router.get('/resourceslist', common.tokenMiddleware, (req, res) => {
	let userId = req.userId;
	userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {
		freezeInfo.aggregate([
		  {
		    "$match": { "status" : "staked", "user_id" : mongoose.mongo.ObjectId(userId)}
		  },
		  {
		    "$group": {'_id': 'null','totals': {'$sum': "$amount_staked" }
		  },
		}
		]).then((staked) => {
			freezeInfo.aggregate([
			  {
			    "$match": {"status" : "unstaked", "user_id" : mongoose.mongo.ObjectId(userId)}
			  },
			  {
			    "$group": {'_id': 'null','totals': {'$sum': "$amount_staked"}
			  },
			}
			]).then((unstaked) => {
				if(data){
					freezeInfo.find({user_id:mongoose.mongo.ObjectId(userId), status:"staked"}).exec(function(err, data1) {
						if(data1){
							substringfun(data1, function(returnData) {
								if(unstaked.length > 0){var unskaval = unstaked[0]
								}else{var unskaval = 0;
								}if(staked.length > 0){var skaval = staked[0]
								}else{var skaval = 0;
								}
								res.json({success:1, resourcedata : returnData, address: data.address_base58, totalunstaked: unskaval, totalstaked: skaval });
							});
						}
						else{
							res.json({success: 0, msg: "user data not found !"})
						}
					})
				}
				else{
					res.json({success: 0, msg: "User Not Found !"});
				}
		   	});
	   	});
	})
})

function substringfun(data, callback){
	var length = data.length;
	var result = [];
	if(length > 0 ){
		var i = 1;
		data.forEach((val)=>{
			staking_account_address_split = val.staking_account.substring(0, 6)+ "..." +val.staking_account.slice(28, 34);
			receiving_account_address_split = val.receiving_account.substring(0, 6)+ "..." +val.receiving_account.slice(28, 34);
			val.staking_account = staking_account_address_split;
			val.receiving_account = receiving_account_address_split;

			var resourcelist = {
				_id: val._id,
				user_id:val.user_id,
				staking_account: staking_account_address_split,
				receiving_account : receiving_account_address_split,
				resource_type : val.resource_type,
				amount_staked : val.amount_staked,
				frozen_duration : val.frozen_duration,
				txID: val.txID,
				signature : val.signature,
				status:val.status,
				unfreeze_txID:val.unfreeze_txID,
				unfreeze_signature:val.unfreeze_signature,
				staked_time:val.staked_time,
				unstaked_time: val.unstaked_time,
			}

			var currenttime = new Date(new Date().toString().split('GMT')[0]+' UTC').toISOString();

			var date1 = new Date(val.unstaked_time);
			var date2 = new Date(currenttime);
			if(new Date(date1.getTime()) < new Date(date2.getTime())){
				resourcelist.stake = 'active';
			}
			else{
				resourcelist.stake = 'diactive';
			}

			result.push(resourcelist);
			if(i == length) { callback(result); }
			i = i+1;
		})
	}
	else{
		callback([]);
	}
}

router.get('/proposalinfo', (req, res) => {
	proposalInfo.find().exec(function(err, data){
		res.json({success:1, resourcedata : data });
	})
})

router.post('/proposals', common.tokenMiddleware, (req, res) => {
	let userId  = req.userId;
	let obj = req.body;
	generateProposalListData(obj, userId, function(returnData) {
		let isInserted = proposal.create(returnData);
		if(isInserted) {
				res.json({success:1, message:"newProposal_created"});
		} else {
				res.json({success:0, message:"Please try again"});
		}
	});
})

function generateProposalListData(data, userId, callback){
	var length = data.length;
	var result = [];
	if(length > 0){
		var i = 1;
		data.forEach((val) => {
			let obj = {
				user_id: userId,
				parameter: val.parameter,
				old_value: val.currentvalue,
				new_value: val.newValue,
			}
			result.push(obj);
			if(i == length) { callback(result); }
			i = i+1;
		});
	}
	else{
		callback([]);
	}
}

router.get('/myproposallist', common.tokenMiddleware, (req, res) => {
	let userId = req.userId;
	proposal.find({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {
		if(data){
			res.json({success:1, result : data });
		}else{
			res.json({success:0, msg: "user data not found !"})
		}
	})
})

function isNum(val){
  return !isNaN(val)
}

function checkaddres(value, callback){
	var url = variiable.blockchain_url+"/isAddress/"+value;
	var args = { headers: {"Content-Type":"application/json"} };
	restCli.get(url, args, function (resData, resp) { 
		if(resData['status'] == true && resData['isAddress'] == true)
		{
				return callback(true);
		} else {
				return callback(false);
		}
	});
	// return callback(true);
}

///freeze functionality
router.post('/freezeBalance', common.tokenMiddleware, (req,res) => {
	if(isNum(req.body.amount) == true){
		checkaddres(req.body.toAddress, function(data1){
		    if(data1 == true){
				let userId  = req.userId;
				freezeBalance()
				async function freezeBalance(){
					var balance = await userBal.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec();
					balance = balance.balance;
					amount = parseFloat(req.body.amount) * 1000000;
					if(balance >= amount) {
						duration = req.body.duration;
						resource = req.body.obtain_type;
						var userpk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec();
						if(!userpk) {	
							return res.json({success:0,message:'User PrivateKey not found'});
						}
						/*const hrcryptoWeb = new HrcryptoWeb(
						    fullNode,
						    solidityNode,
						    eventServer,
						    userpk.privateKey
						);*/
						useraddr = rubyweb.address.fromPrivateKey(userpk.privateKey)
						receiveraddr = rubyweb.address.fromPrivateKey(userpk.privateKey)
						const transaction = await rubyweb.transactionBuilder.freezeBalance(amount, duration, resource, useraddr, receiveraddr);

						const signedTransaction = await rubyweb.ruby.sign(transaction, userpk.privateKey);

						if(!signedTransaction.signature){
								return res.json({success:0,message:'Transaction was not signed properly'});
						}
						const contract = await rubyweb.ruby.sendRawTransaction(signedTransaction);
						if(contract['result'] == true) {	
							//var myDate = new Date(1601528702*1000);
							let obj = {
								user_id: userId,
								staking_account: useraddr,
								receiving_account: req.body.toAddress,
								resource_type: req.body.obtain_type,
								amount_staked: amount,
								frozen_duration : duration,
								txID: contract['txid'],
								signature: contract['transaction']['signature']['0'],
								expired_time: contract['transaction']['raw_data']['expiration'],
								status:"staked",
								unfreeze_txID: "",
								unfreeze_signature: "",
								unstaked_time : new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
							}

							let isInserted = freezeInfo.create(obj);
							if(isInserted) {
								res.json({success:1, message:"Amount Freezed"});
								//socketdata
								socketdata.socketpassdata('freezeInfo', 'empty1', 'empty2');
							} else {
								res.json({success:0, message:"Please try again"});
							}
						} 

						if(contract.code){
							return res.json({success:0,message:rubyweb.toUtf8(contract.message)});	
						}
						// res.json({success:1, message:"somthing wents wrong !"});
					} else {
						res.json({success: 0, message:"Insufficient Balance"});
					}
				}
		    }else{
	    		res.json({success:0,message:"To address must be address format"});
	    	}
		});
	}else{
		res.json({success:0,message:"amount must be numerical format"});
	}
})

router.post('/unfreezeBalance', common.tokenMiddleware, (req,res) => {
	let userId  = req.userId;
	unfreezeBalance()
	async function unfreezeBalance(){
		var frzInfo = await freezeInfo.findOne({user_id: mongoose.mongo.ObjectId(userId), _id:mongoose.mongo.ObjectId(req.body.id)}).exec();
		if(frzInfo) {
			resource = frzInfo.resource_type;
			userpk = await userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec();
			userpk = userpk.privateKey;
			useraddr = rubyweb.address.fromPrivateKey(userpk);
			receiveraddr = rubyweb.address.fromPrivateKey(userpk);
			try {
				const transaction = await rubyweb.transactionBuilder.unfreezeBalance(resource, useraddr, receiveraddr );
				const signedTransaction = await rubyweb.ruby.sign(transaction, userpk);
				const contract = await rubyweb.ruby.sendRawTransaction(signedTransaction);
				if(contract) {
					var isUpdated = freezeInfo.updateOne({_id:mongoose.mongo.ObjectId(req.body.id)}, {"$set": {unfreeze_txID:contract['txid'],signature: contract['transaction']['signature']['0'],status:"unstaked" }}).exec();
					if(isUpdated) {
						res.json({success:1, message:"Balance Unfreezed"});
					} else {
						res.json({success:0, message:"Please Try Again"});
					}
				}
				if(contract.code) {
					res.json({success:0, message:rubyweb.toUtf8(contract.message) });
				}
			}
			catch(e) {
				// console.log(e);
				res.json({success:0, message:"Something went wrong"});
			}
			// res.json({success:0, message:"Something wents wrong !"});
		} else {
			res.json({success:0, message:"Stake info not found" });
		}
	}
});

router.post('/submitVote', common.tokenMiddleware, (req,res) => { 
	let userId  = req.userId;
	submitVote()
	async function submitVote(){ 
		var srvote = srUser.findOne({user_id:mongoose.mongo.ObjectId(req.body.userId)}).exec();
		if(srvote) {
			var vote = parseInt(req.body.Vote_Count) + parseInt(req.body.vote_val);
			var isUpdated = srUser.updateOne({user_id:mongoose.mongo.ObjectId(req.body.UserId)},{"$set":{vote_count:vote}}).exec();

			let obj = {
				user_id: userId,
				votes: parseInt(req.body.vote_val),
				vote_receiver: req.body.UserId
			}

			var isInserted = userVotes.create(obj);
			if(isInserted) {
				res.json({success: 1, message:"Voted successfully"});
			} else {
				res.json({success: 0, message:"Please try again"});
			}

		} else {
			res.json({success: 0, message:"SR user not found"});
		}
	}
});

module.exports = router;