const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:32771/task-manager-api',
    {
        useNewUrlParser: true,
        useCreateIndex:true,
        useUnifiedTopology: true
    }
)
