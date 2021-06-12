const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const app = express();
app.use(bodyParser.json());
app.use(cors());



const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'ssss',
    database : 'facedb'
  }
});

app.post('/signin', (req, res) => {
	const {email, password} = req.body;
	db.select('email','hash').from('login')
	.where('email', '=', email)
	.then(data => {
		if(bcrypt.compareSync(password, data[0].hash)){
			return db.select('*').from('users')
			.where('email', '=', email)
			.then(user=>{
				res.json(user[0])
			}).catch(err => res.status(400).json("unable to connect"))
		}else{
			res.status(400).json("Wrong Credentials")
		}
	}).catch(err => res.status(400).json("Wrong Credentials"))
})

app.post('/register', (req, res) => {
	const {email, name, password} = req.body;
	const hash = bcrypt.hashSync(password);
	return db.transaction(trx => {
	trx.insert({email, hash}).
		into('login')
		.returning('email')
		.then(loginEmail => {
			trx('users')
			.returning('*')
			.insert({
				name : name,
				email : loginEmail[0],
				joined : new Date()
			}).then(user => {
				res.json(user[0]);
			}).catch(trx.rollback)
		}).then(trx.commit)
		.catch(trx.rollback)
	}).catch(err => res.status(400).json("unable to register"));
})

app.put('/image', (req, res) => {
	const {id} = req.body;
	db('users')
	.where({id})
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	}).catch(err => res.status(400).json("Unable to fetch"));
})

app.get('/profile/:id', (req,res) => {
	const {id} = req.params;
	return db.select('*').from('users')
	.where({id}).returning('*')
	.then(user => {
		if(user.length == 0){
			res.status(400).json("No user found")
		}else{
			res.json(user[0])
		}
	}).catch(err => res.json("Unable to get user"))
})
app.listen(3000);