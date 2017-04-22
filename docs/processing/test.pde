//スケッチデータを読み込む
for (DT line : data.get (sketch1).getLines()) {//TODO 現在選択中のデータに変更
	//new line
	data.get(data.size()-1).addMergedLine(line.c, line.w);//新しい線を追加
	for (PVector p : line) {
		//三次元座標pを取得
		
	}
}