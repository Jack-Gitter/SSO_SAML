import express from 'express'
import { generateResponse } from './saml'

const app = express()
const port = 3000

app.get('/saml', async (req, res) => {
	const resp = await generateResponse()
	res.send(resp)
})

app.get('/', async (req, res) => {
	res.sendFile(`${__dirname}/fe/index.html`)
})


app.listen(port, () => { console.log(`listening on ${port}`) })
