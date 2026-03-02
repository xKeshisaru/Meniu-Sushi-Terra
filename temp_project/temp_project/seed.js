
const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const { menuData } = require("./src/lib/data-static"); 

// !!! TREBUIE SA CREEZI UN FISIER data-static.js CARE EXPORTA menuData CA COMMONJS
// SAU SA ADAPTEZI SCRIPTUL SA CITEASCA DIN data.ts DACA FOLOSESTI TS-NODE

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadData() {
  for (const category of menuData) {
    const catRef = db.collection("categories").doc(category.id);
    await catRef.set({
      id: category.id,
      title: category.title,
      icon: category.icon
    });

    for (const item of category.items) {
      // Folosim un ID generat sau slug din nume
      const itemId = item.name.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
      await catRef.collection("products").doc(itemId).set(item);
      console.log(`Added ${item.name}`);
    }
  }
}

uploadData();
