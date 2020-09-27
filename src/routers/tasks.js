const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post("/tasks", auth, async (request,response) => {
    const task = new Task(request.body)
    task.owner = request.user._id
    try {
        await task.save()
        response.status(201).send(task)
    } catch (error) {
        response.status(400).send(error)
    }
})

// Get tasks?completed=true
// Get tasks?limit=10&skip=0
// Get tasks?soryBy=createdAt:desc
router.get("/tasks",auth, async (request,response) => {
    const match = {}
    const sort = {}
    if(request.query.completed) {
        match.completed = request.query.completed === 'true'
    }

    if(request.query.sortBy) {
        const parts = request.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
         await request.user.populate(
             { path: 'tasks', 
             match,
             options: {
                 limit: parseInt(request.query.limit),
                 skip: parseInt(request.query.skip),
                 sort
             },
            })
             .execPopulate()
        response.status(200).send(request.user.tasks)
    } catch (error) {
        response.status(500).send(error)
    }
})

router.get("/tasks/:id", auth, async (request,response) => {
    const id = request.params.id
    try {
        const task = await Task.findOne({_id:id,owner: request.user._id})
        response.status(200).send(task)
    } catch (error) {
        response.status(400).send(error)
    }
})

router.patch("/tasks/:id",auth, async (request,response) => {
    const updates = Object.keys(request.body)
    const allowedUpdates = ['title','description','completed']
    const validUpdate = updates.every((update) => allowedUpdates.includes(update))

    if(!validUpdate) {
        return response.status(400).send({error: 'Invalid request'})
    }
    try {
        const task = await Task.findOneAndUpdate({_id:request.params.id,owner: request.user._id},request.body, {new:true,runValidators:true})
        if(!task) {
            response.status(403).send()
        }
        response.status(200).send(task)
    } catch (error) {
        return response.status(500).send(error)
    }

})

router.delete("/tasks/:id", auth,async (request,response) => {
    try {
        const task = await Task.findOneAndDelete({_id:request.params.id,owner: request.user._id})
        if(!task) {
            return response.status(403).send({error: 'Unauthorized to perform the task'})
        }
        return response.status(200).send(task)
    } catch (error) {
        return response.status(500).send({error: 'Error while deleting Task'})
    }
})

module.exports= router