const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccount(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer not found" });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "deposit") {
      return acc + operation.amount;
    } else if (operation.type === "withdraw") {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

/**
 * cpf: string
 * name: string
 * id: uuid
 * statement: []
 */
app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists" });
  }

  customers.push({ cpf, name, id: uuidv4(), statement: [] });

  return response.status(201).send();
});

app.get("/statement", verifyIfExistsAccount, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccount, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    type: "deposit",
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccount, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds" });
  }

  const statementOperation = {
    amount,
    type: "withdraw",
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccount, (request, response) => {
  const { date } = request.query;
  const { customer } = request;

  const dateFormat = new Date(date + " 00:00");

  const operations = customer.statement.filter(
    (operation) =>
      operation.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(operations);
});

app.put("/account", verifyIfExistsAccount, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).json(customer);
});

app.get("/account", verifyIfExistsAccount, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifyIfExistsAccount, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get("/balance", verifyIfExistsBalance, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);
