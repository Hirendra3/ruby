const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
var async  = require('async');
var fs = require('fs');


let moment = require('moment');
var validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const useragent = require('useragent');
var Client = require('node-rest-client').Client;
var restCli = new Client();

const variiable = require('../../config/variables');

let transaction = require('../../model/transaction');

let blockInfo = require('../../model/blockInfo');

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
fullnode.listen(8092);

var soliditynode = express()
soliditynode.use('/', createProxyMiddleware({
    target: variiable.solidityNode,
    changeOrigin: true,
    onProxyRes
}))
soliditynode.listen(8093);

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

router.get('/getbalance/:address', (req,res) => {
	var args = { headers: {"Content-Type":"application/json"} };
	url = variiable.blockchain_url+"/balance/"+req.params.address;

	restCli.get(url, args, function (resData, resp) { 
		if(resData.status == true){
			res.json(resData.RUBY_Balance);
		}else{
			res.json("balance not found !");
		}
	});
});

router.get('/gettransactions_txId/:txId', (req,res) => {
	var args = { headers: {"Content-Type":"application/json"} };
	var url = variiable.blockchain_url+"/tx/"+req.params.txId;
	
	restCli.get(url, args, function (resData, resp) { 
		if(resData.status == true){
			res.json(resData);
		}else{
			res.json("transaction not found !");
		}
	});
});

router.get('/gettransactions_address/:addr', (req,res) => {

});

router.get('/sendamount/:toAddr/:amount/:privateKey', (req,res) => {
	var amount = req.params.amount * 1000000;
	url = variiable.blockchain_url+"/transfer/"+req.params.toAddr+"/"+amount+"/"+req.params.privateKey;
	var args = { headers: {"Content-Type":"application/json"} };
	restCli.get(url, args, function (resData, resp) { 
		if(resData['status'] == true) {
			res.json(resData);
		};
	});
});

router.get('/sendtoken/:contractAddr/:sendtoUserAddr/:userAdd/:amount', (req,res) => {
	transferToken()
	async function transferToken(){
		amount = req.params.amount * 1000000000000000000;
		amount = amount.toString();
		/*const hrcryptoWeb = new HrcryptoWeb(
		    fullNode,
		    solidityNode,
		    eventServer,
		    privateKey
		);*/
		var conaddr = req.params.contractAddr;
		var usaddr = req.params.userAdd;

		var args = { headers: {"Content-Type":"application/json"} };
		let url = variiable.blockchain_url+"/balanceOf/"+conaddr+"/"+usaddr;
		restCli.get(url, args, async function (resData1, resp) {
			var tokenbal = parseInt(resData1['Token_balance']['hex'],16);

			if(tokenbal >= req.params.amount){
				let instance = await rubyweb.contract().at(conaddr);
				let result = await instance["transfer"](req.params.sendtoUserAddr,amount).send({
					callValue: 0,		
				}); 
				res.json({success: 1, "Set_write": result, message: "Transaction success"})
			}
			else{
				res.json({success:0,message:"Insufficient Balance"});
			}
		})		
	}
});


router.get('/getblockdata/:start/:end', (req,res) => {
 transferToken()
 async function transferToken(){
    transaction.find({"blockNumber" : {"$gte":req.params.start,"$lte":req.params.end}, "type":"TransferContract"}).exec(function(err, data){
    	res.json(data);
    })
 }
});



router.get('/getLatestBlockCount', (req, res) => {
	blockcount()
	async function blockcount(){
		blockInfo.findOne().sort({created_at: -1}).select("blockNumber").exec(function(err, data) {
			res.json({blockNumber:data.blockNumber});
		});
	}
})

module.exports = router;