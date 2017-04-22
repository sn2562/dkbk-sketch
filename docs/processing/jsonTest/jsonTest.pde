JSONObject json;
String[] species = { 
  "Capra hircus", "Panthera pardus", "Equus zebra"
};
String[] names = { 
  "Goat", "Leopard", "Zebra"
};
void setup() {

  json = new JSONObject();
  JSONArray values = new JSONArray();

  for (int i = 0; i < species.length; i++) {

    JSONObject animal = new JSONObject();

    animal.setInt("id", i);
    animal.setString("species", species[i]);
    animal.setString("name", names[i]);

    values.setJSONObject(i, animal);
  }

  json.setInt("id", 0);
  json.setString("species", "Panthera leo");
  json.setString("name", "Lion");
  json.setJSONArray("animals", values);


  saveJSONObject(json, "data/new.json");
}

// Sketch saves the following to a file called "new.json":
// {
//   "id": 0,
//   "species": "Panthera leo",
//   "name": "Lion"
// }

