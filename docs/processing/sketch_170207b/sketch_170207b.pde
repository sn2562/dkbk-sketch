color c1 = color(#FF9900); //16進数で#FF9900として登録
background(c1);

println("c1 "+c1); //-26368 と出力

loadPixels();
println(pixels[0]); //-26368 これも10進数

println(hex(pixels[0])); //FFFF9900 16進数に直され出力

String c = hex(color(#FF9900));

//最初の二文字を0xに書き換える(16進数であることを明記)
String newC = "0x"+c.substring(2);
println(newC); //0xFF9900と表示


String c2 = hex(pixels[0]);

