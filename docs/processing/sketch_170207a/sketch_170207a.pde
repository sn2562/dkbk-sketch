
final float data_width=640;//画像の解像度
final float data_height=480;//画像の解像度
String data[];

void setup() {

  size(int(data_width), int(data_height), P3D);

  //表示について
  perspective(PI/4, float(width)/float(height), 10, 150000);//視野角は45度
  float z0 = (height/2)/tan(PI/8);//tan(radian(45/2))を使うと、微妙に数字がズレるのでダメ
  //カメラの位置を決める
  camera( width/2, height/2, z0, width/2, height/2, 0, 0, 1, 0);
  printCamera();

  //ファイルの
  data = loadStrings("../../data/PointCroudData.pcd");
  println("there are " + data.length + " lines");
  for (int i = 0; i < data.length; i++) {
  }
  println(data[10]);

  noLoop();
}

void draw() {
  beginShape(POINTS);
  vertex(30, 75, -50);
  for (int i = 10; i < data.length; i=i+1) {
    float[] d = float(split(data[i], ' '));
    vertex(d[0]*-1, d[1], d[2]*-1);
  }
  vertex(30, 75, -50);
  endShape();

  //box
  box(50);

  //axis
  stroke(126);
  int lineLnegth = 1000;
  line(-lineLnegth, 0, 0, lineLnegth, 0, 0);
  line( 0, -lineLnegth, 0, 0, lineLnegth, 0);
  line( 0, 0, -lineLnegth, 0, 0, lineLnegth);
}

