const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
var async  = require('async');

var fs = require('fs');
let common = require('../../helpers/common');
let socketdata = require('../../helpers/socketdata');
var endecrypt = require('../../helpers/newendecryption');

let moment = require('moment');
var validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const useragent = require('useragent');

var Client = require('node-rest-client').Client;
var restCli = new Client();

//schemas

const users = require('../../model/users');
const userAddr = require('../../model/userAddress');
const userBal = require('../../model/userBalance');
const amountTransfer = require('../../model/amountTransfer');
let contracts = require('../../model/contracts');
let transaction = require('../../model/transaction');
let token = require('../../model/token');
let user_token = require('../../model/user_tokens');

const variiable = require('../../config/variables');

const { createProxyMiddleware } = require('http-proxy-middleware')
const HrcryptoWeb = require('hrcryptoweb');
const RubyWeb = require('rubyweb');
const cron = require('node-cron');
const TronTxDecoder = require('@beycandeveloper/tron-tx-decoder');
const decoder = new TronTxDecoder(variiable.fullNode);
const sessionStorage = require('node-sessionstorage');

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
fullnode.listen(8094)

var soliditynode = express()
soliditynode.use('/', createProxyMiddleware({
  target: variiable.solidityNode,
  changeOrigin: true,
  onProxyRes
}))
soliditynode.listen(8095)

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

router.get('/test', (req, response) => {
	var args = { headers: {"Content-Type":"application/json"} };
	restCli.get(variiable.blockchain_url+"/generategenerate", args, function (resData, resp) { 
			return response.json({res: resp});
	});
});

router.post('/fetchAddress', common.tokenMiddleware, (req, response) => {
	let userId  = req.userId;
	
	userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {	
		if(data) {
				response.json({success:1,address:data.address_base58,firsttime:0});
		} else {
			var args = { headers: {"Content-Type":"application/json"} };
			restCli.get(variiable.blockchain_url+"/generateaddr", args, function (resData, resp) { 
				// res.json(resData['status']);
				if(resData['status'] == true) {
					let obj = {
						user_id : userId,
						privateKey : resData['createAccount']['privateKey'],
						publicKey : resData['createAccount']['publicKey'],
						address_base58 : resData['createAccount']['address']['base58'],
						address_hex : resData['createAccount']['address']['hex']
					}
					userAddr.create(obj, function(err, res) {
						if(res) {
								response.json({success:1,address:resData['createAccount']['address']['base58'], privateKey:resData['createAccount']['privateKey'],firsttime:1});
						} else {
								response.json({success:0,message:"Please try again"});
						}
					// socketdata.socketpassdata('userAddr', 'empty1', 'empty2');
					})
				} else {
					response.json({success:0,message:"Please try again"});
				}
			})
			/*let obj = {
				user_id : userId,
				privateKey : common.randomAddrKey(64),
				publicKey : common.randomAddrKey(130),
				address_base58 : common.randomAddrKey(34),
				address_hex : common.randomAddrKey(42),
				
			}
			userAddr.create(obj, function(err, res) {
				if(res) {
					response.json({success:1,address:obj.address_base58, privateKey:obj.privateKey,firsttime:1});
				} else {
					response.json({success:0,message:"Please try again"});
				}
			})*/
		}
	})
});

router.post('/resouredata',async function(req, res){
	var address =  req.body.address;
	var result = await rubyweb.ruby.getAccountResources(address);
	  return res.json({result:result});
});

router.post('/checkValidAddress', function(req,response){
	var url = variiable.blockchain_url+"/isAddress/"+req.body.address;
	var args = { headers: {"Content-Type":"application/json"} };
	restCli.get(url, args, function (resData, resp) { 
		if(resData['status'] == true && resData['isAddress'] == true)
		{
			response.json({success:1,message:"Valid address"});
		} else {
			response.json({success:0,message:"Invalid address"});
		}
	});
	//response.json({success:1,message:"Valid address"});
});


router.post('/addToken', common.tokenMiddleware, function(req,response){
	let userId  = req.userId;
	let token_type = req.body.token_type;
	if(token_type == 'RUBY10')
	{
		userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err1, data1) {
			let obj =  {
  			user_id : userId,
  			tokenId : req.body.address.tokenId,
  			token_type : token_type,
  			user_address_hex : data1.address_hex,
  			user_address_base58 : data1.address_base58,
  			token_balance : 0,
  		}
  		user_token.create(obj, function(err1, res1) { 
				if(res1) {
					response.json({success:1,message:'Token Added successfully'})
				} 
				if(err1) {
					response.json({success:0,message:'Please Try Again'});
				}
  		})
    });
	} else {
		var address = req.body.address.contractAddress;
		contracts.findOne({'contract_address': address, 'contract_status' : 'verified' }).exec(function (err, data) {
    if(err){
    	return response.json({success:2, message:"Try again later2"});
    }
    if(data){
    	token.findOne({'contract_address': address }).exec(function (err2, data2){
    		if(data2){
	    		user_token.findOne({'user_id':mongoose.mongo.ObjectId(userId),'contract_address': address }).exec(function (err3, data3){
    				if(data3){
  						response.json({success:0,message:'Contract already added'});
    				} else {
  						userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err1, data1) {
		    				let obj =  {
				    			user_id : userId,
				    			contract_address : address,
				    			token_type : token_type,
				    			user_address_hex : data1.address_hex,
				    			user_address_base58 : data1.address_base58,
				    			token_balance : 0,
				    		}
				    		user_token.create(obj, function(err1, res1) { 
			    				if(res1) {
		    						response.json({success:1,message:'Token Added successfully'})
			    				} 
			    				if(err1) {
		    						response.json({success:0,message:'Please Try Again'});
			    				}
				    		})
					    });
    				}	
	    		})
    		} else {
    			return response.json({success:0, message:"Contract not registered as token!"});
    		}
    	})
    } else {
      return response.json({success:0, message:"Contract not verified yet / Contract not registered as token!"});
	  }
  });
	}
});


router.get('/fetchTransaction', common.tokenMiddleware, (req, response) => {
	let userId = req.userId;
	userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {
		if(data) {
			address_hex = data.address_hex.toLowerCase();
			transaction.find({$or:[{owner_address:address_hex}, {to_address:address_hex}]}).exec(function(err1, data1) {
				if(data1) {
					generateTransactionData(data1, address_hex, function(returnData){ 
						if(returnData.length > 0) {
							response.json({success:1, transactionData:returnData});
						} else {
							response.json({success:0, msg:"No record found"});
						}
					})
				} else {
					response.json({success:0, msg:"No record found"});
				}
			});
		} else {
			response.json({success:0, msg:"No record found"});
		}
	})
})

function generateTransactionData(data, address, callback) { 
	var length = data.length;
	var result = [];
	if(length > 0) {
		var i = 1;
		data.forEach((val) => {
			let theDate = new Date(parseInt(val['timestamp']));
			
			if(address == val['owner_address']) {
				var type = "Send";
			} else {
				var type = "Receive";
			}

			if(val['type'] == 'TriggerSmartContract') {
				var amount = val['amount'] / 1000000000000000000;
			} else {
				var amount = val['amount'] / 1000000;
			}

			var fromAddress = val['owner_address'];
			var toAddress = val['to_address'];
			var txID = val['txID'];

			var fromaddress_split = fromAddress.substring(0, 10)+ "..." +fromAddress.slice(-6);
			var txID_split = txID.substring(0, 10)+ "..." +txID.slice(-6);
			if(toAddress == "undefined"){
				var toaddress_split = "NaN";
			}else{
				var toaddress_split = toAddress.substring(0, 10)+ "..." +toAddress.slice(-6);
			}

			if(val.type == "TransferContract"){
				val.type = 'Transfer RUBY';
			}else if(val.type == 'TriggerSmartContract'){
				val.type = 'Transfer Token';
			}

			var transactionData = {
				txID:txID,
				txID_split: txID_split,
				approveHash:val['witness_address'],
				amount:amount,
				from:fromAddress,
				to:toAddress,
				fromaddress_split: fromaddress_split,
				toaddress_split: toaddress_split,
				type:type,
				dateTime:theDate,
				blockId:val['blockNumber'],
				method:val['type'],
				fee:val['net_fee'] / 1000000
			}

			result.push(transactionData);
			if(i == length) { callback(result); }
			i = i+1;
		});
	} else {
		callback([]);
	}
}

router.get('/getTestCoin', common.tokenMiddleware, async (req, response) => { // after testing purpose please remove this file;
	getTestCoin();
	async function getTestCoin()
	{
		let userId  = req.userId;
		let user_addr = await userAddr.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec();
		if(user_addr)
		{
			/*var amount = 1000 * 1000000;
			var url = variiable.blockchain_url+"/transfer/"+user_addr.address_base58+"/"+amount+"/78e53d939e374bd757c11469a746b978e2a9c4979c1c1763d2071f54a4f7779b";
			var args = { headers: {"Content-Type":"application/json"} };
			restCli.get(url, args, function(data){
				return response.json({success:1, message:"RUBY created"});
			});*/
				return response.json({success:1, message:"RUBY created"});
		}
	}
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

router.post('/sendAmount', common.tokenMiddleware, (req, response) => {
	if(isNum(req.body.amount) == true){
		checkaddres(req.body.toAddress, function(data1){
	    if(data1 == true){
				let userId  = req.userId;

				userAddr.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err, data) {
					if(err) {
						response.json({success:0,message:"Balance info not found"});
					}

					var url = variiable.blockchain_url+"/balance/"+data.address_base58;
					var args = { headers: {"Content-Type":"application/json"} };
					restCli.get(url, args, async function(resData1, err2) { 
						var balance = parseFloat(resData1['RUBY_Balance']) / 1000000;

					if(balance >= req.body.amount) {
						var privatekey = req.body.privateKey.toUpperCase();
						userAddr.findOne({user_id:mongoose.mongo.ObjectId(userId),privateKey: privatekey}).exec(function(err2, data2){
							if(data2) {
								var amount = req.body.amount * 1000000;
								url = variiable.blockchain_url+"/transfer/"+req.body.toAddress+"/"+amount+"/"+data2.privateKey;
								var args = { headers: {"Content-Type":"application/json"} };
								restCli.get(url, args, function (resData, resp) { 
								//response.json(resData);
									if(resData['status'] == true) {
										var txID = resData['Transfer_details']['txid'];
										let obj = {
											user_id 	 : userId,
											to_address : req.body.toAddress,
											privateKey : req.body.privateKey,
											token_type : req.body.type,
											amount 		 : req.body.amount,
											note 			 : req.body.note,
											txID			 : txID
										}

										amountTransfer.create(obj, function(err1, res1) {
											if(res1) {
												var new_bal = balance - req.body.amount;

												userBal.updateOne({user_id:mongoose.mongo.ObjectId(userId)},{"$set": {balance:new_bal}} ).exec(function(err3, res3){
														if(res3) {
															response.json({success:1,message:"Amount transferred successfully"})
														} else {
															response.json({success:0,message:"Please try again"});
														}
													});
											} else {
												response.json({success:0,message:"Please try again"});
											}
										});
								 	} else {
								 		response.json({success:0,message:"Amount couldn't be sent"});
								 	}
								})
								/*var txID = common.randomtrxId(64);
								let obj = {
									user_id 	 : userId,
									to_address : req.body.toAddress,
									privateKey : req.body.privateKey,
									token_type : req.body.type,
									amount 		 : req.body.amount,
									note 			 : req.body.note,
									txID			 : txID
								}
								amountTransfer.create(obj, function(err1, res1) {
									if(res1) {
										var new_bal = balance - req.body.amount;
										userBal.updateOne({user_id:mongoose.mongo.ObjectId(userId)},{"$set": {balance:new_bal}} ).exec(function(err3, res3){
												if(res3) {
													response.json({success:1,message:"Amount transferred successfully"})
												} else {
													response.json({success:0,message:"Please try again"});
												}
											});
									} else {
										response.json({success:0,message:"Please try again"});
									}
								});*/


							} else {
								response.json({success:0,message:"Can't be found private key"});
							}
						});
					} else {
					  response.json({success:0,message:"Insufficient Balance"});
					}
				});
				})
	    }else{
	    	res.json({success:0,message:"toAddress must be address format"});
	    }
		})
	}else{
		res.json({success:0,message:"amount must be numerical format"});
	}
})


router.post('/sendHRCToken', common.tokenMiddleware, (req, response) => {
	if(isNum(req.body.amount) == true){
		checkaddres(req.body.toAddress, function(data1){
	    if(data1 == true){
				let userId  = req.userId;
				var privatekey = (req.body.privateKey).toUpperCase();
				userAddr.findOne({user_id:mongoose.mongo.ObjectId(userId),privateKey: privatekey}).exec(function(err2, data2){
					if(data2) {

						rubyweb.ruby.getAccount(data2.address_base58).then(result => {
							var asset = result.assetV2;
							asset.forEach((val) => {
								if(val.key == req.body.tokenId)
								{
									if(val.value >= req.body.amount)
									{
										rubyweb.ruby.sendToken(req.body.toAddress,req.body.amount,req.body.tokenId, data2.privateKey, function(err3, res3){
											if(err3) {
												return response.json({success:0,message:err3})
											}

											if(res3) {
												var txID = "";
												let obj = {
													user_id 	 : userId,
													to_address : req.body.toAddress,
													privateKey : req.body.privateKey,
													token_type : "RUBY10",
													amount 		 : req.body.amount,
													note 			 : req.body.note,
													txID			 : txID
												}

												amountTransfer.create(obj, function(err1, res1) {
													if(res1) {
														response.json({success:1,message:"Amount transferred successfully"})
													} else {
														response.json({success:0,message:"Please try again"});
													}
												});
											}
										})	
									} else {
										//return message
									}
								}
							});
						});

						/*var txID = "";
						let obj = {
							user_id 	 : userId,
							to_address : req.body.toAddress,
							privateKey : req.body.privateKey,
							token_type : "RUBY10",
							amount 		 : req.body.amount,
							note 			 : req.body.note,
							txID			 : txID
						}
						amountTransfer.create(obj, function(err1, res1) {
							if(res1) {
								response.json({success:1,message:"Amount transferred successfully"})
							} else {
								response.json({success:0,message:"Please try again"});
							}
						});*/

					} else {
						response.json({success:0,message:"Can't be found private key"});
					}
				});				
	    } else {
	    	res.json({success:0,message:"toAddress must be address format"});
	    }
		})
	} else {
		res.json({success:0,message:"amount must be numerical format"});
	}
})


// router.post('/sendToken', common.tokenMiddleware, (req, response) => {
// 		let userId  = req.userId;

// 		userAddr.findOne({user_id:mongoose.mongo.ObjectId(userId)}).exec(function(err2, data2){
// 				if(data2) {
// 					var amount = parseFloat(req.body.amount) * 1000000000000000000;
// 					var args = { headers: {"Content-Type":"application/json"} };

// 					url = variiable.blockchain_url+"/getAddress/"+req.body.toAddress;
// 					restCli.get(url, args, function (resData, resp) {
// 						var toaddress = resData['getAddress'];

// 						url = variiable.blockchain_url+"/getAddress/"+req.body.caddr;
// 						restCli.get(url, args, function (resData1, resp) {
// 							var conhexadd = resData1['getAddress'];
// 							var usehexadd = data2.address_base58;

// 								url = "https://api.hrscan.org/contract/balanceOf/"+conhexadd+"/"+usehexadd;
// 								restCli.get(url, args, function (resData2, resp) {
// 									var tokenbal = parseInt(resData2['Token_balance']['hex'],16);

// 										if(tokenbal >= req.body.amount){
// 											response.json({success:1,message:"token have Balance"});
// 											// url = "http://54.215.133.239:4000/transferToken/"+conhexadd+"/"+toaddress+"/"+amount;
// 											// restCli.get(url, args, function (resData3, resp) {
// 											// })
// 										}
// 										else{
// 											response.json({success:0,message:"Insufficient Balance"});
// 										}
// 								})
// 						})
// 					})

// 				} else {
// 						response.json({success:0,message:"Can't be found private key"});
// 				}
// 		});

// })


function generateTokenData(data, callback) { 
	var length = data.length;
	var result = [];
	if(length > 0) {
		var i = 1;
		var args = { headers: {"Content-Type":"application/json"} };
		data.forEach((val) => {
			if(val.token_type == "RUBY10") {
				token.findOne({tokenId:val['tokenId']}).exec(function(err, res){
					if(res) {
						var token_logo = res['token_logo'];
						var token_name = res['token_name'];
					} else {
						var token_logo = '';
						var token_name = '';
					}
					rubyweb.ruby.getAccount(val.user_address_base58).then(result1 => {
						let assets = result1.assetV2;
						// console.log(assets);
						// const getToken = assets.filter(value => value.key == val.tokenId);
						/*if(getToken){}*/
						assets.forEach((value) => {
							if(value.key == val.tokenId) {
								var transactionData = {
									token_type:val['token_type'],
									token_logo:token_logo,
									token_name:token_name,
									token_bal:parseInt(value.value),
									tokenId:val['tokenId'],
									user_address_hex:val['user_address_hex'],
									created_at: val['created_at'],
								}
								result.push(transactionData);
								if(i == length) { callback(result); }
							}
						});
						i = i+1;
					});
					/*var transactionData = {
						token_type:val['token_type'],
						token_logo:token_logo,
						token_name:token_name,
						token_bal:0,
						tokenId:val['tokenId'],
						user_address_hex:val['user_address_hex'],
						created_at: val['created_at'],
					}
					result.push(transactionData);
					if(i == length) { callback(result); }
					i = i+1;*/
				});
			} else {
				token.findOne({contract_address:val['contract_address']}).exec(function(err, res){
					if(res) {
						var token_logo = res['token_logo'];
						var token_name = res['token_name'];
					} else {
						var token_logo = '';
						var token_name = '';
					}
					balanceOf()
					async function balanceOf(){
						let instance = await rubyweb.contract().at(val['contract_address']);
						let bal = await instance["balanceOf"](val['user_address_hex']).call();
						if(bal){
							var balance = parseInt(bal['_hex'])/1000000000000000000;
						}else{
							var balance = "0.00";
						}
						var transactionData = {
							token_logo:token_logo,
							token_type:val['token_type'],
							token_name:token_name,
							token_bal:balance,
							contract_address:val['contract_address'],
							user_address_hex:val['user_address_hex'],
							created_at: val['created_at'],
						}
						await result.push(transactionData);
						if(i == length) { callback(result); }
						i = i+1;
					}
					/*let url = variiable.blockchain_url+"/balanceOf/"+val['contract_address']+"/"+val['user_address_hex'];
					restCli.get(url, args, function (resData2, resp) { 
						var transactionData = {
							token_logo:token_logo,
							token_type:val['token_type'],
							token_name:token_name,
							token_bal:parseInt(resData2['Token_balance']['hex']) / 1000000000000000000,
							contract_address:val['contract_address'],
							user_address_hex:val['user_address_hex'],
							created_at: val['created_at'],
						}
						result.push(transactionData);

						if(i == length) { callback(result); }
						i = i+1;
					});*/
				});
			}
		});
	} else {
		callback([]);
	}
}


router.get('/getTokenData', common.tokenMiddleware, function(req, response) {
	let userId  = req.userId;
	user_token.find({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err, res) {
		if(res){
 			generateTokenData(res, function(returnData) {
				let tokenData = {tokenData:returnData}
				return response.json({success:1, result:tokenData});
 			});
		}else{
			return response.json({success:0, msg : "userTokenNotFound..!"});
		}
 	})
});

router.get('/getWalletPageData', common.tokenMiddleware, function(req, response) {
	let userId  = req.userId;
	userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err1, res1){
 		if(res1) {
			var address_base58 = res1.address_base58;

			var url = variiable.blockchain_url+"/balance/"+address_base58;
			var args = { headers: {"Content-Type":"application/json"} };
			restCli.get(url, args, async function(resData1, err2) { 
				var balance = parseFloat(resData1['RUBY_Balance']) / 1000000;
				userAddr.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err5, res5){
					transaction.find({$or:[{owner_address:address_base58}, {to_address:address_base58}]}).sort({created_at: -1}).exec(function(err3, res3) {
						if(res3) {
							generateTransactionData(res3, address_base58, function(returnData){
								token.findOne({user_id: mongoose.mongo.ObjectId(userId)}).exec(function(err4, res4){
									if(res4) {
											var token_data = {token_avl:1,name:res4['token_name'],token_logo:res4['token_logo']};
									} else {
											var token_data = {token_avl:0};
									}

									var useraddress = {
										address_hex:res5.address_hex,
										publicKey:res5.publicKey,
										privateKey:res5.privateKey.toLowerCase(),
										address_base58:res5.address_base58,
									}

									let homePageData = {address:res1.address_base58, balance:balance, transactions:returnData.length, listTransactions:returnData,useraddress:useraddress};
									return response.json({success:1, result:homePageData});
								})
							})
						}
					});
				});
			});
 		}
	});
});

cron.schedule('*/60 * * * * *', () => {
  fetchUserBalance();
});

function fetchUserBalance()
{
	userAddr.find().exec(function(err, data) {	
		if(data) {
			var args = { headers: {"Content-Type":"application/json"} };
			data.forEach((val) => {
				url = variiable.blockchain_url+"/balance/"+val['address_base58'];
				restCli.get(url, args, function (resData, resp) {
					if(resData['status'] == true)
					{
						userBal.findOne({user_id:mongoose.mongo.ObjectId(val['user_id'])}).exec(function(err1, res1) {
							if(res1) {
								userBal.updateOne({user_id:mongoose.mongo.ObjectId(val['user_id'])},{"$set": {balance:resData['RUBY_Balance']}} ).exec(function(err2, res2){ 
								})
							} else {
								let obj = {
									balance : resData['RUBY_Balance'],
									user_id : val['user_id'],
									address_base58 : val['address_base58']
								}
								userBal.create(obj, function(err3, res3) {
								})
							}
						})
					}
				})
			})
		}
	});
}

router.get('/updateBalance', function(req, response) {

	userAddr.find().exec(function(err, data) {	
		if(data) { 
			
			var args = { headers: {"Content-Type":"application/json"} };
			data.forEach((val) => {
				url = variiable.blockchain_url+"/balance/"+val['address_base58'];
				restCli.get(url, args, function (resData, resp) { 
					if(resData['status'] == true)
					{
						userBal.findOne({user_id:mongoose.mongo.ObjectId(val['user_id'])}).exec(function(err1, res1) {
							if(res1) {
								userBal.updateOne({user_id:mongoose.mongo.ObjectId(val['user_id'])},{"$set": {balance:resData['RUBY_Balance']}} ).exec(function(err2, res2){ 
								})
							} else {
								let obj = {
									balance : resData['RUBY_Balance'],
									user_id : val['user_id'],
									address_base58 : val['address_base58']
								}
								userBal.create(obj, function(err3, res3) {
								})
							}
						})
					}
				});
			});
		}
	});
})

router.post('/checkValidprivatekey', common.tokenMiddleware, function(req, res){
	var userId = req.userId;
	var privateKey = req.body.privatekey.toUpperCase();
	userAddr.findOne({user_id:mongoose.mongo.ObjectId(userId), privateKey:privateKey}).exec(function(err1, res1) {
		if(res1){
			res.json({success:1,message:"valid privatekey"});
		}else{
			res.json({success:0,message:"invalid privatekey"});
		}
	})
})

module.exports = router;
