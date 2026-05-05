const axios = require("axios");

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2YXJ1bnZhc2lzdGg0MzNAZ21haWwuY29tIiwiZXhwIjoxNzc3OTc0Mjk4LCJpYXQiOjE3Nzc5NzMzOTgsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiIzYWNkNDZmNi03OWJjLTQyMGItOWFmZC1iY2Q5MDUwOGJkM2MiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJ2YXJ1biB2YXNpc3RoIiwic3ViIjoiYTk0MTVkOGQtZWM3ZC00YjM3LTg1YzMtODY2ZGQxNjM5NWEzIn0sImVtYWlsIjoidmFydW52YXNpc3RoNDMzQGdtYWlsLmNvbSIsIm5hbWUiOiJ2YXJ1biB2YXNpc3RoIiwicm9sbE5vIjoiMmsyM2NzdW4wMTEyMyIsImFjY2Vzc0NvZGUiOiJYanZUWngiLCJjbGllbnRJRCI6ImE5NDE1ZDhkLWVjN2QtNGIzNy04NWMzLTg2NmRkMTYzOTVhMyIsImNsaWVudFNlY3JldCI6ImNCZFFucGFlQ2dWYlVSZmQifQ.e6Q44RKgOfNynWjslHDr60HhdpoFU5YoRQT4fCTd0Io";

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

async function getPriorityInbox(top = 10) {
  const response = await axios.get(
    "http://20.207.122.201/evaluation-service/notifications",
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );

  const notifications = response.data.notifications;

  const scored = notifications.map((n) => {
    const typeWeight = TYPE_WEIGHT[n.Type] || 1;
    const ageInMinutes = (Date.now() - new Date(n.Timestamp).getTime()) / 60000;
    const recencyScore = 1 / (1 + ageInMinutes);
    return { ...n, priorityScore: typeWeight + recencyScore };
  });

  const topN = scored
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, top);

  console.log(`Top ${top} Priority Notifications:`);
  console.log(JSON.stringify(topN, null, 2));
}

getPriorityInbox(10);