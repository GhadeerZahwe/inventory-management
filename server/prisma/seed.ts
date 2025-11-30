import { PrismaClient } from "@prisma/client";
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Helper to capitalize model names
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Delete tables in child → parent order
async function deleteAllData(deleteOrder: string[]) {
  for (const fileName of deleteOrder) {
    const modelName = path.basename(fileName, path.extname(fileName));
    const model: any = prisma[capitalize(modelName)];
    if (model) {
      await model.deleteMany({});
      console.log(`Cleared data from ${capitalize(modelName)}`);
    } else {
      console.error(`Model ${capitalize(modelName)} not found.`);
    }
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  // Child → Parent order for deletion
  const deleteOrder = [
    "sales.json",
    "salesSummary.json",
    "purchases.json",
    "purchaseSummary.json",
    "expenses.json",
    "expenseByCategory.json",
    "expenseSummary.json",
    "products.json",
    "users.json",
  ];

  await deleteAllData(deleteOrder);

  // Parent → Child order for seeding
  const seedOrder = [
    "users.json",
    "products.json",
    "expenseByCategory.json",
    "expenses.json",
    "expenseSummary.json",
    "purchases.json",
    "purchaseSummary.json",
    "sales.json",
    "salesSummary.json",
  ];

  for (const fileName of seedOrder) {
    const filePath = path.join(dataDirectory, fileName);
    if (!fs.existsSync(filePath)) {
      console.error(`Seed file not found: ${fileName}`);
      continue;
    }

    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelName = path.basename(fileName, path.extname(fileName));
    const model: any = prisma[capitalize(modelName)];

    if (!model) {
      console.error(`No Prisma model matches the file name: ${fileName}`);
      continue;
    }

    for (const data of jsonData) {
      await model.create({ data });
    }

    console.log(`Seeded ${capitalize(modelName)} with data from ${fileName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
