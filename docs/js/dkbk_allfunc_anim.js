/* ***** 複数スケッチViewer スケッチ機能付き ***** */

var startTime = new Date().getTime();//開始時間

//load Files
var dataPath = [
	'anim01',
	'anim02',
	'anim03',
	'anim02'
];//読み込みファイル一覧
for(var i=0;i<dataPath.length;i++){
	dataPath[i] = "https://sn2562.github.io/dkbk-sketch/data/"+dataPath[i]+".dsddata.txt";
}

var onPC = true;

//DOM
var container;

//DOWNLOAD
var download = new FileDownloader();


//操作
var controls;
var isDragging = false;
var onCanvas = false;

//intraction
var raycaster, mouse;

//constract
var zoom = 1;
var width=640*zoom;
var height=480*zoom;
var z0 = (height/2)/Math.tan(Math.PI/8)*2;//z0は元の座標系における原点に合うように設定.*2でスケッチ空間の中央に原点を移動

var renderer;
var scene;
var camera;

//objects
var group = null;

//depthdata
var depthStep = 5;//デプスデータの表示数を減らして軽くする
var depthGeometry;
var depthObject;

//sketchdata
var sketchGeometry;
var sketchObject;

//user Sketch Data
var userSketchGeometry;
var userSketchObject;

//loaded Sketch Data
var loadedSketchObject;
var loadedSketchGeometry;

//現在の選択データ
var nowDataNumber = 0;

//Datas
var allData = [];
var loadedSketchData = {
	"vertices": [],
	"colors": [],
	"lineWidth":[]
};

//users sketch data
var sketchMode = false;
var usersSketchData =  {
	"maxpoints": 100000,
	"lines": 0,
	"vertices": [[]],
	"positions_": [],
	"colors": [],
	"colors_": [],
	"lineWidth":[],
	"indices_array":[],
	"endpoints":0
};
//Animation
var isAnimation = true;//animation mode
var isAnimation_SUB = false;
var animOrder = [0,1,2,1];//読み込みデータに応じて表示順序を指示
var animIndex = 0;//
//calc framerate
var fps = 10;//
var oldFrame = 0;
var isFrameChange = false;


function drawLoading(){
	var loadingArea = document.getElementById("loader-bg");
	loadingArea.style.height = height;
	loadingArea.style.width = width;

}

function ready(){

	//delete loading dom
	var loader = document.getElementById("loader-bg");
	loader.parentNode.removeChild(loader);

	// DOM
	container = document.createElement('div');
	//				document.body.appendChild(container);
	document.getElementById("canvas").appendChild(container);

	// Scene
	scene = new THREE.Scene();

	// Camera
	camera = new THREE.PerspectiveCamera(45, width/height, 10, 150000);
	camera.position.set(0,0,z0);


	//Axis
	drawAxis();


	//Objects
	group = new THREE.Object3D();//表示グループ
	scene.add(group);
	var positions_;//すべての構成点
	var colors_;//すべての構成色情報

	//後から座標と色を書き換える前提で領域を確保しておく

	//Depth Objects with Buffer Geometry
	var max = 100000;//360 * 480より多めに頂点を用意;

	positions_ = new Float32Array(max*3*3);//デプスデータの構成点(x,y,z座標分)で初期化
	colors_ = new Float32Array(max*3*3);//点に対応する色情報(r,g,b情報分)で初期化
	//ジオメトリを設定
	depthGeometry = new THREE.BufferGeometry();
	depthGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions_ , 3 ) );//構成点を設定
	depthGeometry.addAttribute( 'color', new THREE.BufferAttribute( colors_ , 3 ) );//色情報を設定
	//マテリアルを設定
	var depthMaterial = new THREE.PointsMaterial( { size: 15, vertexColors: THREE.VertexColors, opacity:1 } );//見た目を設定
	//オブジェクトを設定
	depthObject = new THREE.Points( depthGeometry, depthMaterial );//オブジェクトの作成
	depthObject.visible = false;//表示,非表示設定
	scene.add(depthObject);

	//Sketch Stroke Objects with Buffer Geometry
	positions_ = new Float32Array(max*3*3);//デプスデータの構成点(x,y,z座標分)で初期化
	colors_ = new Float32Array(max*3*3);//点に対応する色情報(r,g,b情報分)で初期化
	sketchGeometry = new THREE.BufferGeometry();
	sketchGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions_ ), 3 ) );//構成点
	sketchGeometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( colors_ ), 3 ) );//色
	var sketchMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors,linewidth: 8});//線の見え方を設定
	sketchObject = new THREE.LineSegments( sketchGeometry, sketchMaterial );
	group.add( sketchObject );


	//User Sketch Stroke Objects with Buffer Geometry
	positions_ = new Float32Array(max*3*3);//デプスデータの構成点(x,y,z座標分)で初期化
	colors_ = new Float32Array(max*3*3);//点に対応する色情報(r,g,b情報分)で初期化
	userSketchGeometry = new THREE.BufferGeometry();
	userSketchGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions_ ), 3 ) );//構成点
	userSketchGeometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( colors_ ), 3 ) );//色
	var userSketchMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors,linewidth: 8});//線の見え方を設定
	userSketchObject = new THREE.LineSegments( userSketchGeometry, userSketchMaterial );
	group.add( userSketchObject );

	changeDrawData(nowDataNumber);//描画範囲を現在のデータのみに絞る

	//Loaded Sketch Stroke Objects with Buffer Geometry
	positions_ = new Float32Array(max*3*3);//デプスデータの構成点(x,y,z座標分)で初期化
	colors_ = new Float32Array(max*3*3);//点に対応する色情報(r,g,b情報分)で初期化
	loadedSketchGeometry = new THREE.BufferGeometry();
	loadedSketchGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions_ , 3 ) );//構成点
	loadedSketchGeometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( colors_ ), 3 ) );//色
	var loadedSketchMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors,linewidth: 8});
	loadedSketchObject = new THREE.LineSegments( loadedSketchGeometry, loadedSketchMaterial );
	loadedSketchObject.visible = false;//表示,非表示設定
	group.add( loadedSketchObject );


	//raycaste
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();


	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
	renderer.setSize(width, height);//画面サイズ
	renderer.setClearColor(0xFCFBF6, 1);//背景色
	renderer.setPixelRatio(window.devicePixelRatio);
	container.appendChild(renderer.domElement);

	//controles
	controls = new THREE.TrackballControls( camera,container );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.3;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	if(sketchMode){
		controls.pause = true;
		controls.noRotate = true;
		controls.noZoom = true;
		controls.noPan = true;
	}

	// trackballに変化があった時だけ描画を呼ぶ
	controls.addEventListener( 'change', render );

	//スマホ向けに画面を最大化する
	if (navigator.userAgent.indexOf('iPhone') > 0 || navigator.userAgent.indexOf('iPad') > 0 || navigator.userAgent.indexOf('iPod') > 0 || navigator.userAgent.indexOf('Android') > 0) {
		//スマートフォン時に実行したいjs
		window.scrollTo(0,0);
		resize();
		onPC = false;
	}
	//ボタンの設定初期化
	$("#changeMode").prop('checked', sketchMode);

	render();//描画
	if(isAnimation_SUB){
		isAnimation = true;
		isAnimation_SUB = false;
	}
	animate();


	document.getElementById('files').addEventListener('change', uploadFile, false);

	function animate() {
		requestAnimationFrame(animate);

		if(!sketchMode){
		}
		controls.update();
		if(isAnimation)
			render();
	}

	function render() {

		//animation
		if(isAnimation){
			var frame = Math.floor( (new Date().getTime() - startTime) / ( 1000 / fps ) );
			if(oldFrame != frame){//フレームが切り替わっていたら実行
				changeDrawData(animOrder[animIndex%animOrder.length]);
				animIndex++;
				oldFrame = frame;
			}
		}
		renderer.render(scene, camera);
	}

	function resize() {
		//TODO 基本的には横幅を画面サイズに合わせて、高さを最大化する
		var h = window.innerWidth;
		var w = window.innerHeight;

		camera.updateProjectionMatrix();
		h = height*window.innerWidth/width;

		//もし新しく設定した高さが画面からはみ出る場合は,横幅を再設定する
		//					if(h>window.innerHeight){
		//						h = window.innerWidth;
		//						w = width*window.innerHeight/height;
		//					}

		renderer.setSize(h, w);

		var newheight = height*window.innerWidth/width;
		renderer.setSize(window.innerWidth, newheight);
	}

	function createGeometry(count) {
		var geometry = new THREE.Geometry();

		for (var i = 0; i < count; i++) {
			var x = Math.random() * 1000 - 500;
			var y = Math.random() * 1000 - 500;
			var z = Math.random() * 1000 - 500;
			var particle = new THREE.Vector3(x, y, z);
			particle.velocity = new THREE.Vector3(0, -Math.random(), 0);
			geometry.vertices.push(particle);
		}
		return geometry;
	}

	//座標系
	function drawAxis(){
		// line
		//create a blue LineBasicMaterial
		var material = new THREE.LineBasicMaterial({ color: 0x0000ff });

		var geometry = new THREE.Geometry();

		var lineLenght = 10000;
		geometry.vertices.push(new THREE.Vector3(0, 0, 0));
		geometry.vertices.push(new THREE.Vector3(lineLenght, 0, 0));
		geometry.vertices.push(new THREE.Vector3(0, 0, 0));
		geometry.vertices.push(new THREE.Vector3(0, lineLenght, 0));
		geometry.vertices.push(new THREE.Vector3(0, 0, 0));
		geometry.vertices.push(new THREE.Vector3(0, 0, lineLenght));

		var line = new THREE.Line(geometry, material);

		scene.add(line);
	}
	//				window.addEventListener('resize', resize, false);//キャンバスサイズを画面に合わせる
	window.addEventListener( 'keydown', function ( event ) {
		console.log("keydown", event.keyCode);
		switch ( event.keyCode ) {

			case 13: //0 reset
				controls.reset();//始点をリセットする
				break;
							   }
	});
};
function init(){

	drawLoading();

	if(isAnimation){
		isAnimation = false;//読込が終わるまで一旦false
		isAnimation_SUB = true;//上記の代わりにフラグを立てておく
	}
	
	var dataList = [];

	for (var i = 0; i <= dataPath.length; i++) {
		dataList.push($.ajax({ // $.ajaxの戻り値をdataList配列に格納
			url: dataPath[i]
		}));
	}
	//読み込み終了後の処理
	$.when.apply($, dataList).done(function () {
		// 結果は仮引数に可変長で入る **順番は保証されている**
		// 取り出すには arguments から取り出す
		// argumentsはそれぞれ [data, textStatus, jqXHR] の配列になっている

		//全てを取り出す
		//					for (var i = 0; i < arguments.length-1; i++) {
		//						var result = arguments[i];
		//						console.log(i,result[0]);//data
		//						//						console.log(i,result[1]);//textStatus
		//						//						console.log(i,result[3]);jqXHR
		//					}

		//それぞれについて処理する 0番目はPCD,1番目はsketchデータ
		//ラジオボタンも同時に生成する
		var element = document.getElementById("datalist");
		for(var i=0; i<arguments.length-1;i++){
			perseData(arguments[i][0]);

			//チェックボックスの生成
			var box = document.createElement('div');
			box.className = "radio";
			//ラベルの生成
			var label = document.createElement('label');

			//radioボタンの生成
			var button = document.createElement('input');
			button.type = "radio";
			button.name = "optionsRadios";
			button.id = "optionsRadios"+i;
			button.value = i;
			button.for = box.name;
			button.className = "datalist_contents";
			if(i==0){
				button.checked = "true"
			}
			//最後の子要素として追加
			label.appendChild(button);
			var num = i+1;
			label.appendChild(document.createTextNode("Sketch Data "+num));
			box.appendChild(label);
			element.appendChild(box);

		}
		//					persePCD(arguments[0][0]);//デプスデータの準備
		//					perseSketchData(arguments[1][0]);//スケッチデータの準備
		ready();//描画
	});
}
function perseData (data){
	var dataname = data[0];
	var data = data.split(/\r\n|\r|\n/);// 行ごとに分割
	var pcd_index = data[1].split(' ').map(Number);//数値に変換
	var sketch_index = data[2].split(' ').map(Number);//数値に変換

	//PCD部分とSKETCH部分をそれぞれ取り出して、perseする
	var newData ={
		"depthData":{
			"vertices": [],
			"colors": []
		},
		"sketchData":{
			"vertices": [],
			"colors": [],
			"lineWidth":[]
		},
		"userSketchData":{
			"vertices": [[]],
			"colors": [],
			"lineWidth":[]
		}
	};
	allData.push(newData);

	persePCD(data.slice(pcd_index[1], pcd_index[2]));//デプスデータの準備
	perseSketchData(data.slice(sketch_index[1], sketch_index[2]));//スケッチデータの準備
}

function persePCD(data){
	var dData = allData[allData.length-1].depthData

	//PCDは10行目から
	for(var i=10;i<data.length;i++){
		var d = data[i].split(' ');

		//色情報
		var c = new THREE.Color(parseInt(d[3]));// color 10進数
		dData.colors.push(c);

		//座標情報
		var px = parseFloat(d[0]);
		var py = parseFloat(d[1]);
		var pz = parseFloat(d[2]*-1+z0);

		dData.vertices.push(new THREE.Vector3(px,py,pz));
	}
}

function perseSketchData(data){
	//スケッチデータの処理
	//形式 1行ストローク [色 太さ P1座標 P1座標 P2座標 P3座標...]
	var sData = allData[allData.length-1].sketchData;

	for(var i=0;i<data.length;i++){
		var d = data[i].split(' ');

		//色
		var c = new THREE.Color(parseInt(d[0]));// color 10進数
		sData.colors.push(c);

		//線の太さ
		var w = parseInt(d[1]);// 太さ情報
		sData.lineWidth.push(w);

		//座標情報
		var points = [];
		for(var j=2 ; j<d.length ; j=j+3){
			var px = parseFloat(d[j]);
			var py = parseFloat(d[j+1]);
			var pz = parseFloat(d[j+2]*-1+z0);
			var p = new THREE.Vector3(px,py,pz);
			points.push(p);
		}
		sData.vertices.push(points);
	}
}

function changeDrawData(idx){
	//idx番目のデータに描画内容を書き換える

	nowDataNumber = idx;


	//depthData
	//座標と色の書き換えを実行
	depthGeometry.attributes.position.needsUpdate = true;//頂点座標の書き換えを許可
	depthGeometry.attributes.color.needsUpdate = true;//色情報の書き換えを許可
	var position = depthGeometry.attributes.position.array;
	var color = depthGeometry.attributes.color.array;

	var endOfRange = 0;
	for( var i=0 ; i<allData[nowDataNumber].depthData.vertices.length ; i++ ){
		//TODO depthStepに応じて表示数を減少

		//座標
		var p = allData[nowDataNumber].depthData.vertices[i];
		position[i*3] = p.x;
		position[i*3+1] = p.y;
		position[i*3+2] = p.z;
		//色
		var rgb = allData[nowDataNumber].depthData.colors[i].toArray();
		color[i*3] = rgb[0];
		color[i*3+1] = rgb[1];
		color[i*3+2] = rgb[2];
	}
	var endOfRange = allData[nowDataNumber].depthData.vertices.length*3;//表示領域の最後尾
	depthGeometry.setDrawRange(0,endOfRange);//表示領域を再設定


	//sketch data
	//座標と色の書き換えを実行
	sketchGeometry.attributes.position.needsUpdate = true;//頂点座標の書き換えを許可
	sketchGeometry.attributes.color.needsUpdate = true;//色情報の書き換えを許可
	var position = sketchGeometry.attributes.position.array;
	var color = sketchGeometry.attributes.color.array;
	var indices_array = [];//構成点同士のつなぎ方を設定

	var nowIndex = 0;
	for( var i=0 ; i<allData[nowDataNumber].sketchData.vertices.length ; i++ ){
		if(allData[nowDataNumber].sketchData.vertices[i].length != 0){//構成点があるなら実行
			//色
			var rgb = allData[nowDataNumber].sketchData.colors[i].toArray();
			for( var j=0 ; j<allData[nowDataNumber].sketchData.vertices[i].length ; j++){
				var p = allData[nowDataNumber].sketchData.vertices[i][j];
				//座標
				position[nowIndex*3] = p.x;
				position[nowIndex*3+1] = p.y;
				position[nowIndex*3+2] = p.z;

				//色
				color[nowIndex*3] = rgb[0];
				color[nowIndex*3+1] = rgb[1];
				color[nowIndex*3+2] = rgb[2];

				if( j!=0 ){
					indices_array.push( nowIndex-1, nowIndex );//ひとつ前の登録点とつなぐように設定
				}
				nowIndex++;
			}
		}
	}
	sketchGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( indices_array ), 1 ) );//線のつなぎ方を設定
	sketchGeometry.setDrawRange(0,nowIndex*3);//表示領域を再設定

	//user sketch data
	//座標と色の書き換えを実行
	userSketchGeometry.attributes.position.needsUpdate = true;//頂点座標の書き換えを許可
	userSketchGeometry.attributes.color.needsUpdate = true;//色情報の書き換えを許可
	var position = userSketchGeometry.attributes.position.array;
	var color = userSketchGeometry.attributes.color.array;
	var indices_array = [];//構成点同士のつなぎ方を設定

	var nowIndex = 0;
	for( var i=0 ; i<allData[nowDataNumber].userSketchData.vertices.length ; i++ ){
		if(allData[nowDataNumber].userSketchData.vertices[i].length != 0){//構成点があるなら実行
			//色
			var rgb = allData[nowDataNumber].userSketchData.colors[i].toArray();
			for( var j=0 ; j<allData[nowDataNumber].userSketchData.vertices[i].length ; j++){
				var p = allData[nowDataNumber].userSketchData.vertices[i][j];
				//座標
				position[nowIndex*3] = p.x;
				position[nowIndex*3+1] = p.y;
				position[nowIndex*3+2] = p.z;

				//色
				color[nowIndex*3] = rgb[0];
				color[nowIndex*3+1] = rgb[1];
				color[nowIndex*3+2] = rgb[2];

				if( j!=0 ){
					indices_array.push( nowIndex-1, nowIndex );//ひとつ前の登録点とつなぐように設定
				}
				nowIndex++;
			}
		}
	}
	userSketchGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( indices_array ), 1 ) );//線のつなぎ方を設定
	userSketchGeometry.setDrawRange(0,nowIndex*3);//表示領域を再設定
}

function showUserSketchData(){
	//user sketch data
	//座標と色の書き換えを実行
	userSketchGeometry.attributes.position.needsUpdate = true;//頂点座標の書き換えを許可
	userSketchGeometry.attributes.color.needsUpdate = true;//色情報の書き換えを許可
	var position = userSketchGeometry.attributes.position.array;
	var color = userSketchGeometry.attributes.color.array;
	var indices_array = [];//構成点同士のつなぎ方を設定

	var nowIndex = 0;
	for( var i=0 ; i<allData[nowDataNumber].userSketchData.vertices.length ; i++ ){
		if(allData[nowDataNumber].userSketchData.vertices[i].length != 0){//構成点があるなら実行
			//色
			var rgb = allData[nowDataNumber].userSketchData.colors[i].toArray();
			for( var j=0 ; j<allData[nowDataNumber].userSketchData.vertices[i].length ; j++){
				var p = allData[nowDataNumber].userSketchData.vertices[i][j];
				//座標
				position[nowIndex*3] = p.x;
				position[nowIndex*3+1] = p.y;
				position[nowIndex*3+2] = p.z;

				//色
				color[nowIndex*3] = rgb[0];
				color[nowIndex*3+1] = rgb[1];
				color[nowIndex*3+2] = rgb[2];

				if( j!=0 ){
					indices_array.push( nowIndex-1, nowIndex );//ひとつ前の登録点とつなぐように設定
				}
				nowIndex++;
			}
		}
	}
	userSketchGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( indices_array ), 1 ) );//線のつなぎ方を設定
	userSketchGeometry.setDrawRange(0,nowIndex*3);//表示領域を再設定

	renderer.render(scene, camera);//表示を更新
}

//DOM側から実行する関数
function changeControl(state){
	//var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
	controls.changeState(state);
}
function resetView(){
	controls.reset();//始点をリセットする
}
function deleteSketch(){
	//現在表示中のスケッチデータを削除する
	//初期化
	allData[nowDataNumber].userSketchData.colors=[];
	allData[nowDataNumber].userSketchData.vertices=[[]];
	allData[nowDataNumber].userSketchData.lineWidth=[];
	showUserSketchData();//表示の更新
}
//depth data,sketch data の表示/非表示切り替え
function changeVisible(e){
	//value = 0ならdepth,1ならsketchの表示を切り替える
	if( e.value==0 ){
		depthObject.visible = e.checked;
	}else if( e.value==1 ){
		sketchObject.visible = e.checked;
	}else if( e.value==2 ){
		userSketchObject.visible = e.checked;
	}
	renderer.render(scene, camera);//表示を更新
}
//リストのラジオボタンが押された時に表示データを変更する
$(document).on("click",".datalist_contents",function(e) {
	var num = $(".datalist_contents").index(this);
	changeDrawData(num);

	renderer.render(scene, camera);//表示を更新
	controls.reset();//始点をリセットする
})
$(document).on("change","#changeMode",function(e) {
	sketchMode = !sketchMode; // sketching/viewing
	if(sketchMode){
		controls.noRotate = true;
		controls.noZoom = true;
		controls.noPan = true;
		controls.pause = true;
	}else{
		controls.noRotate = false;
		controls.noZoom = false;
		controls.noPan = false;
		controls.pause = false;
	}
})

function mouseDragg(event,mode){
	//かなしいかな...ドラッグイベントが実装できないので無理やりTrackballControlsから呼び出す
	//mode:0 ドラッグ mode:1 クリック(ドラッグの開始)

	var rect = event.target.getBoundingClientRect();

	//スケッチモードで対象がキャンバスなら実行する
	//				if(sketchMode && width == rect.width){
	if(sketchMode){
		event.preventDefault();
		var h,w;
		if(onPC){
			w = width;
			h = height;
		}else{
			console.log("けたい");
			w = rect.width;
			h = rect.height;
		}

		mouse.x = (event.clientX-rect.left)/w *2 - 1;
		mouse.y = -(event.clientY-rect.top)/h *2 + 1;


		//マウスの2D座標から、depthDataに登録されているマウス位置の該当indexのデプスを引き抜く
		var x = parseInt(event.clientX-rect.left);
		var y = parseInt(event.clientY-rect.top);
		var index = x + y * width;

		if( index < allData[nowDataNumber].depthData.vertices.length ){//indexがはみ出ていなければ実行
			var p = allData[nowDataNumber].depthData.vertices[index];//正面から見た時のマウス位置の三次元座標
			var c = allData[nowDataNumber].depthData.colors[index];//正面から見た時のマウス位置の色情報

			if( p.z==z0 ) return;//点の座標が原点なら追加しない

			if(mode==1){//マウスを押した瞬間なら
				//新しいスケッチストロークを追加
				var length = allData[nowDataNumber].userSketchData.vertices.length;
				var l = allData[nowDataNumber].userSketchData.vertices.length;
				if( allData[nowDataNumber].userSketchData.vertices[l-1].length != 0 ){//一つ前に線があれば、新しい線を追加
					allData[nowDataNumber].userSketchData.vertices.push([]);
				}
				allData[nowDataNumber].userSketchData.colors.push(c);//色を追加
			}
			var length = allData[nowDataNumber].userSketchData.vertices.length;
			allData[nowDataNumber].userSketchData.vertices[length-1].push(p);
		}

		showUserSketchData();//表示の更新

		//raycaster
		raycaster.setFromCamera( mouse, camera );

		var intersects = raycaster.intersectObject( depthObject );
		if ( intersects.length > 0 ) {

			var intersect = intersects[ 0 ];
			var face = intersect.face;

			//						var linePosition = line.geometry.attributes.position;//あわせるメッシュ
			var meshPosition = depthObject.geometry.attributes.position;//マウス位置のメッシュ
			//
			//						linePosition.copyAt( 0, meshPosition, face.a );
			//						linePosition.copyAt( 1, meshPosition, face.b );
			//						linePosition.copyAt( 2, meshPosition, face.c );
			//						linePosition.copyAt( 3, meshPosition, face.a );

			//						object_d.updateMatrix();
			//						line.geometry.applyMatrix( mesh.matrix );
			//						line.visible = true;
		}
	}
}

function getStrokeData(){
	//スケッチデータの処理
	//1行目 DATE 保存日時
	//2行目 LINES Line数
	//3行目以降 1行1ストローク [色 太さ P1座標 P1座標 P2座標 P3座標...]
	var DataNmae = "SKETCH_";
	var now = new Date;
	now = now.toString();

	var outputText = "DATE "+now+"\r\n";

	//チェックボックスの状態を取得して書き出すストロークを決める
	var chxBox = document.getElementById("changeVisibility").getElementsByTagName("input");;

	var lineWidth = 0;//ストロークサイズはいまのところ決めうち

	if(chxBox[1].checked){
		//読み込み済みのスケッチを保存
		for( var i=0 ; i<allData[nowDataNumber].sketchData.vertices.length ; i++ ){
			//色情報
			var c = "0x"+allData[nowDataNumber].sketchData.colors[i].getHexString();//0xFFFFFF
			var line = "";

			for ( var j=0;j<allData[nowDataNumber].sketchData.vertices[i].length ; j++ ){
				//座標
				var p = allData[nowDataNumber].sketchData.vertices[i][j];
				line = line+" "+p.x+" "+p.y+" "+p.z;
			}
			var row = c+" "+lineWidth+line+"\r\n";
			outputText = outputText + row;
		}
	}
	if(chxBox[2].checked){
		//ユーザのスケッチを保存
		for( var i=0 ; i<allData[nowDataNumber].userSketchData.vertices.length ; i++ ){
			//色情報
			var c = "0x"+allData[nowDataNumber].userSketchData.colors[i].getHexString();//0xFFFFFF
			var line = "";

			for ( var j=0;j<allData[nowDataNumber].userSketchData.vertices[i].length ; j++ ){
				//座標
				var p = allData[nowDataNumber].userSketchData.vertices[i][j];
				line = line+" "+p.x+" "+p.y+" "+p.z;
			}
			var row = c+" "+lineWidth+line+"\r\n";
			outputText = outputText + row;
		}
	}
	return outputText;
}
//ユーザスケッチをダウンロード
function downloadFile(e){
	var STATE = { TEXT: 0, CANVAS: 1 };
	var filteName = "test";//保存する時のファイル名

	if(e.value == STATE.TEXT){
		var textData = getStrokeData();
		if(textData!=0){
			download.downloadTXT_U(textData,filteName);
		}else{
			console.log("no sketch");
		}

	}else if(e.value == STATE.CANVAS){
		console.log("save canvas");
		var myCanvas = document.getElementsByTagName('canvas');
		download.downloadCanvasIMG(myCanvas[0],filteName);
	}
}

//ユーザスケッチを読み込む
function uploadFile(e){
	//perse
	var files = e.target.files; // FileList object
	if (files.length<=0) return;

	//TODO ファイルタイプがtxt以外は受け付けない
	//				if (!files[0].type.match(/text/)) {
	//					return;
	//				}

	var reader = new FileReader();// ファイルリーダー生成
	reader.onload = (function(e) {
		console.log("acccc");

		loadSketch(e.target.result);//読み込んだデータを基にスケッチを構成する
	});

	var encode_type = 'UTF-8';
	reader.readAsText(files[0],encode_type);//読み込んだファイルは一つだけ使う
}

function loadSketch(data){
	data = data.split(/\r\n|\r|\n/);// 行ごとに分割

	//既に入っているデータを初期化
	loadedSketchData.vertices = [];
	loadedSketchData.colors = [];
	loadedSketchData.lineWidth = [];

	//perse data and add sketch lines
	loadedSketchGeometry.attributes.position.needsUpdate = true;//頂点座標の書き換えを許可
	loadedSketchGeometry.attributes.color.needsUpdate = true;//色情報の書き換えを許可
	var position = loadedSketchGeometry.attributes.position.array;
	var color = loadedSketchGeometry.attributes.color.array;
	var indices_array = [];
	var nowIndex = 0;

	for(var i=1;i<data.length;i++){//データは一行目から
		var d = data[i].split(' ');

		//行の色
		var c = new THREE.Color(parseInt(d[0]));// color 10進数
		var rgb = c.toArray(); 
		loadedSketchData.colors.push(c);

		//線の太さ
		var w = parseInt(d[1]);// 太さ情報
		loadedSketchData.lineWidth.push(w);

		var points = [];

		//座標情報と色情報の書き換え・登録
		for(var j=2 ; j<d.length ; j=j+3){
			var px = parseFloat(d[j]);
			var py = parseFloat(d[j+1]);
			var pz = parseFloat(d[j+2]);

			var p = new THREE.Vector3(px,py,pz);

			//頂点情報の書き換え TODO
			var idx = nowIndex*3;

			position[idx] = p.x;
			position[idx+1] = p.y;
			position[idx+2] = p.z;

			//線の色の書き換え
			color[idx] = rgb[0];
			color[idx+1] = rgb[1];
			color[idx+2] = rgb[2];

			//どの点同士をつなぐか
			if( j != 2 )//ストロークの最初の線でなければ
				indices_array.push(nowIndex-1,nowIndex);//一つ前の点とつなぐように設定

			points.push(p);
			nowIndex++;
		}
		loadedSketchData.vertices.push(points);
	}
	loadedSketchGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( indices_array ), 1 ) );//線のつなぎ方を設定
	loadedSketchGeometry.setDrawRange(0,nowIndex*3);//表示領域を再設定
	loadedSketchObject.visible = true;//表示,非表示設定
	renderer.render(scene, camera);
}