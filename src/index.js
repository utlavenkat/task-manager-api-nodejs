const { request, response } = require('express')
const express = require('express')
const { update } = require('./models/task')
const Task = require('./models/task')
require('./db/mongoose')
const userRouter = require('./routers/users')
const taskRouter = require('./routers/tasks')

const app = express()

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)


const port = process.env.PORT
app.listen(port, () => {
    console.log('Sever is up on port '+ port)
})