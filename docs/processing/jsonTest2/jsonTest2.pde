JSONArray json;

void setup() {

  json = new JSONArray();

  json.append(32);
  json.append(1.5);
  json.append("grape");
  json.append(true);

  JSONObject obj = new JSONObject();
  obj.setFloat("persistence", 0.75);
  json.append(obj);

  JSONArray arr = new JSONArray();
  arr.append("red");
  arr.append("green");
  arr.append("blue");
  json.append(arr);

  println(json);
}

// Sketch prints:
// [
//   32,
//   1.5,
//   "grape",
//   true,
//   {"persistence": 0.75},
//   [
//     "red",
//     "green",
//     "blue"
//   ]
// ]
