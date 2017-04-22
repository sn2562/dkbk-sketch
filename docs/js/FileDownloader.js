FileDownloader = function () {
//	this.canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d");
	//save Shift_JIS text
	this.downloadTXT_S = function (text, fileName) {
		//		var text = "Hello, world!!!!!";
		var blob = new Blob([text], {type: "text/plain;charset=Shift_JIS"});
		saveAs(blob, fileName);
	};

	//save UTF-8 text
	this.downloadTXT_U = function (text, fileName) {
		//		var text = "Hello, world!!!!!";
		var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
		saveAs(blob, fileName);
	};

	//save canvas as image
	this.downloadCanvasIMG = function (canvas, fileName) {
		//		var canvas = document.getElementById("Canvas")
		ctx = canvas.getContext("2d");
		// draw to canvas...
		canvas.toBlob(function(blob) {
			saveAs(blob, fileName+".png");
		});
	};
	//test
	this.test = function () {
		console.log("test");
	};
}