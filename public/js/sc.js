var doc = app.activeDocument;
var textLayer = doc.artLayers.getByName("number"); // 텍스트 레이어 이름을 지정하세요

for (var i = 1; i <= 99; i++) {
  textLayer.textItem.contents = "1_" + i.toString(); // 텍스트 내용을 "1_1", "1_2", ..., "1_99"로 변경
  var file = new File("C:/송수련/디자인/dcu/num/1_" + i + ".png"); // 저장 경로 설정
  var options = new PNGSaveOptions(); // PNG로 저장 옵션
  doc.saveAs(file, options, true, Extension.LOWERCASE);
}
