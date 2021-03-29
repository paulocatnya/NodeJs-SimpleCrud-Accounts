const express = require('express');
const {v4: uuidv4} = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

const getBalance = (statement) => {
    const balance = statement.reduce((acc,operation) => {
        if (operation.type === "credit"){
            return acc + operation.amount
        }else{
            return acc - operation.amount
        }
    }, 0);

    return balance
}

const verifyIfExistsAccountCPF = (req,res,next) => {
    const {cpf} = req.headers
    const customer = customers.find(customer => customer.cpf === cpf); 
   
    if(!customer){
        return res.status(400).json({error:"Customer not found"});
    }

    req.customer = customer;

    return next();
}

app.post('/account', (req, res) => {
    const {name} = req.body; 
    const {cpf} = req.headers
  
    const customerExist = customers.some(conta => conta.cpf === cpf);

    if(customerExist){
        return res.status(400).json({error:"Account already exists"});
    }

    customers.push({
        id:uuidv4(),   
        cpf,
        name,
        statement:[]
    })

    return res.status(201).send();
})

app.get('/account',verifyIfExistsAccountCPF,(req,res) => {
    const {customer} = req;
    return res.status(200).send(customer)
})

app.delete('/account',verifyIfExistsAccountCPF, (req, res) => {
    const {customer} = req;
    customers.splice(customer,1)   
    return res.status(204).send({message:"Customer deleteted!"});    
})

app.get('/accounts',(req,res) => {
    return res.status(200).send(customers)
})

app.get('/statement',verifyIfExistsAccountCPF, (req,res) => {  
    const {customer} = req;

    return res.json(customer.statement)
})  

app.post('/deposit',verifyIfExistsAccountCPF, (req, res) => {
    const {description, amount} = req.body;

    const {customer} = req;
    
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    } 

    customer.statement.push(statementOperation)

    return res.status(201).send();
})

app.post('/withdraw',verifyIfExistsAccountCPF, (req, res) => {
    const {amount,description} = req.body;
    const {customer} = req;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return res.status(400).json({error:"Insuficient funds"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return res.status(201).send();

    
})

app.get('/statement/date',verifyIfExistsAccountCPF, (req,res) => {    
    const {customer} = req;
    const {date} = req.query;

    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter(
        (statement) => 
            statement.created_at.toDateString() ===
            new Date(dateFormat).toDateString()
    )
    return res.json(statement)
})  

app.put('/account',verifyIfExistsAccountCPF,(req,res) => {
    const {name} = req.body;
    const {customer} = req;

    customer.name = name;
    return res.status(201).send()
})

app.get("/balance", verifyIfExistsAccountCPF, (req,res) => {
    const {customer} = req;

    const balance = getBalance(customer.statement)

    return res.status(200).send(balance);
})

app.listen(3333,console.log('Servidor na 3333'));