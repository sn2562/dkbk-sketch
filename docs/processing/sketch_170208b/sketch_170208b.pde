//色情報
String c = hex( color(#FFFFFF));
c = "0x"+c.substring(2);

//ストローク情報
PVector[] vertex = { 
  new PVector(0, 0, 0), new PVector(0, 0, 0), new PVector(0, 0, 0)
  };
  println(vertex);
今回だけならそういう捉え方できるけど昨年からどうでもいいオーラめっちゃ出ててつらい⊂⌒~⊃｡Д｡)⊃



JSONObject obj = new JSONObject();
//json.append(obj);


JSONArray arr = new JSONArray();
//json.append();



JSONObject json = new JSONObject();
json.setInt("color", int(str(c)));

println("json "+json);



//PrintWriterを使った記録方法
public void printPCD2() {
  println("printPCD");
  int linenum=0;
  PrintWriter output = createWriter("PCD/PointCroudData.pcd");
  //pcl用のヘッダを追加
  output.println("VERSION .7");
  output.println("FIELDS x y z rgb");
  output.println("SIZE 4 4 4 4");
  output.println("TYPE F F F F");
  output.println("COUNT 1 1 1 1");
  output.println("WIDTH 1");
  output.println("HEIGHT 1");
  output.println("VIEWPOINT 0 0 0 1 0 0 0");
  output.println("POINTS 0");
  output.println("DATA ascii");

  //realWorldPointの中身を出力
  int W=data.get(tool.nowDataNumber).getW();//データの幅
  int H=data.get(tool.nowDataNumber).getH();//データの高さ
  PImage img = data.get(tool.nowDataNumber).img;//画像 ほんとはcloneしたほうがいい
  img.loadPixels();
  for (int y=0; y < H; y+=2) {//1ずつ読み込み
    for (int x=0; x < W; x+=1) {//1ずつ読み込み
      int index = x + y * W;//インデックスを計算する
      PVector realWorldPoint = data.get(tool.nowDataNumber).getVector(index);//realWorldMap_backのindexの値を取得する
      if (realWorldPoint.z > 0) {//もしポイントのｚの値が0以上なら
        linenum++;//linenumを1増やす
        //色情報を取得する
        //        String c = str(img.pixels[index]);//10進数で
        String c = hex(img.pixels[index]);
        c = "0x"+c.substring(2);
        if (c!="")
          output.println(str(realWorldPoint.x)+" "+str(realWorldPoint.y)+" "+str(realWorldPoint.z)+" "+c);//値のx座標,y座標,z座標,色情報を書き込む
      }
    }
  }

