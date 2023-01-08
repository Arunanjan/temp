/* eslint-disable no-undef */
const request = require("supertest");
let cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

const extractCsrfToken = (res) => {
  var $ = cheerio.load(res.text);
  return $("[name = _csrf]").val();
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  // test-1 todocreations
  test("todo_will_be_created_and_resposnse_to_json as mentioned", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  //test-2 todo updation
  test("todo_marked_as_complete_with_given_id_as_follows", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy biscuits",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");

    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
      });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });

  // tst-3 -todoupdation
  test("todo_marked_as_incomplete_with_given_id_directs_as_follows", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Go to football practice",
      dueDate: new Date().toISOString(),
      completed: true,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");

    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const markedCompleteCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[markedCompleteCount - 1];
    boolStatus = latestTodo.completed;

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markInCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: boolStatus,
      });

    const parsedUpdateResponse = JSON.parse(markInCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);
  });

  // test 4 - Fetching_of_Todos
  test("using /todos endpoint_Fetches_all_todos_in_the_database for fetching as follows", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Play ps4",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(5);
    expect(parsedResponse[4]["title"]).toBe("Play ps4");
  });

  // Test 5  Todos Deletion
  test("_with_the_given_ID_Deletes_a_todo,_if_it_exists_and_sends_a_boolean_response_and_performs_the_required_action", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Go for auditions",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");

    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const deleteResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });

    const parsedDeleteResponse = JSON.parse(deleteResponse.text);
    expect(parsedDeleteResponse).toBe(true);
  });
});
