const express = require("express");
const HttpStatus = require("http-status-codes");
const cors = require("cors");
const echoQueryRouter = require("./echo_query");
const store = require("./store");

const REST_NOUNS = ["cake", "user"];

const SERVER_PORT = 5000;
let data = {};
let newId = 0;

const nounPlural = noun => noun + "s";

const app = express();
app.use(cors({ method: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());
app.use(function(req, res, next) {
  // log request
  var requestedUrl = req.protocol + "://" + req.get("Host") + req.url;
  console.log(new Date().toLocaleString(), req.method, requestedUrl);
  next();
});

app.use("/echo/query", echoQueryRouter);

app.get("/", (req, res) => {
  let html = "<h1>Basic REST API server</h1>";
  for (const noun of REST_NOUNS) {
    const plural = nounPlural(noun);
    html += `<h2>${plural}</h2>
      <ul>
        <li>POST JSON object to <span class="url">/${plural}</span> - create new ${noun} and return new id</li>
        <li>GET <a href="/${plural}" class="url">/${plural}</a> - read all ${plural}</li>
        <li>GET <a href="/${plural}/123" class="url">/${plural}/123</a> - read single ${noun} with id of 123</li>
        <li>GET <a href="/${plural}?name=foo" class="url">/${plural}?name=foo</a> - read all ${plural} with names containing 'foo'</li>
        <li>GET <a href="/${plural}?page=0&limit=20" class="url">/${plural}?page=0&limit=20</a> - read first page of ${plural}</li>
        <li>PUT JSON object to <span class="url">/${plural}/123</span> - update ${noun} with id of 123</li>
        <li>DELETE <span class="url">/${plural}/123</span> - delete ${noun} with id of 123</li>
      </ul>
      <style>.url{font-weight:bold}</style>`;
  }

  res.status(HttpStatus.OK).send(html);
});

for (const noun of REST_NOUNS) {
  const plural = nounPlural(noun);
  store.load(plural, initData => {
    data[plural] = initData;
    newId = Math.max(newId, Math.max(...initData.map(item => item.id))) + 1;
  });

  // Create
  app.post(`/${plural}`, (req, res) => {
    const newItem = req.body;

    if (!newItem || !Object.keys(newItem).length) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Error - ${noun} data not supplied`);
    } else {
      newItem.id = newId;
      newId++;
      data[plural].push(newItem);
      res
        .status(HttpStatus.CREATED)
        .location(`/${plural}/${newItem.id}`)
        .json(newItem);
      store.persist(plural, data[plural]);
    }
  });

  // Read one
  app.get(`/${plural}/:id`, (req, res) => {
    const id = parseInt(req.params.id);
    const foundItem = data[plural].find(item => item.id == id);

    if (foundItem) {
      res.status(HttpStatus.OK).json(foundItem);
    } else {
      res
        .status(HttpStatus.NOT_FOUND)
        .send(`Error - ${noun} not found - Invalid ID`);
    }
  });

  // Read many - all or query
  app.get(`/${plural}`, (req, res) => {
    let items = data[plural];
    const { page, limit, ...query } = req.query;

    // filter results by query
    for (const key of Object.keys(query)) {
      const searchTerm = query[key].toLowerCase();
      items = items.filter(item => {
        if (typeof item[key] == "string") {
          return item[key].toLowerCase().includes(searchTerm);
        } else if (typeof item[key] == "number") {
          return item[key] == searchTerm;
        }
      });
    }

    // paginate results
    if (page) {
      const start = page * limit,
        end = start + limit;
      items = items.slice(start, end);
    }

    res.status(HttpStatus.OK).json(items);
  });

  // Update
  app.put(`/${plural}/:id`, (req, res) => {
    const id = parseInt(req.params.id);
    const updatedItem = req.body;
    const foundItemIndex = data[plural].findIndex(item => item.id == id);

    if (!updatedItem || !Object.keys(updatedItem).length) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Error - ${noun} data not supplied`);
      console.log(noun, id, updatedItem);
    } else if (foundItemIndex >= 0) {
      updatedItem.id = id;
      data[plural][foundItemIndex] = updatedItem;
      res.status(HttpStatus.OK).json(updatedItem);
      store.persist(plural, data[plural]);
    } else {
      res
        .status(HttpStatus.NOT_FOUND)
        .send(`Error - ${noun} not found - Invalid ID`);
    }
  });

  // Delete
  app.delete(`/${plural}/:id`, (req, res) => {
    const id = parseInt(req.params.id);
    const foundItemIndex = data[plural].findIndex(item => item.id == id);

    if (foundItemIndex >= 0) {
      data[plural].splice(foundItemIndex, 1);
      res.status(HttpStatus.OK).send({ msg: `Deleted ${noun}` });
      store.persist(plural, data[plural]);
    } else {
      res
        .status(HttpStatus.NOT_FOUND)
        .send(`Error - ${noun} not found - Invalid ID`);
    }
  });
}

app.listen(SERVER_PORT, () => {
  console.log(`Server started and listening on port ${SERVER_PORT}.`);
});
