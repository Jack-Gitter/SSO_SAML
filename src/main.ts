import express from 'express'
import bodyParser from 'body-parser'
import { generateCustomResponse, generateResponse } from './saml'


const app = express()
app.use(bodyParser)
const port = 3000

app.get('/saml', async (req, res) => {
	const resp = await generateResponse()
	res.send(resp)
})

app.get('/saml-custom', async (req, res) => {
	const resp = await generateCustomResponse()
	res.send(resp)
})

app.get('/saml-sp-initiated', async (req, res) => {
	console.log(req.body)
	res.send(200)
})

app.get('/', async (req, res) => {
	res.sendFile(`${__dirname}/html/index.html`)
})


app.listen(port, () => { console.log(`listening on ${port}`) })
