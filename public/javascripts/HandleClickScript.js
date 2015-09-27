var Resample = function(img, width, height) {
  var load = typeof img == "string";
  var i = load || img;
  if (load) {
    i = new Image;
    i.onload = function() {
      var img = this, width = img._width, height = img._height;
      width == null && (width = round(img.width * height / img.height));
      height == null && (height = round(img.height * width / img.width));
      delete img._width;
      delete img._height;
      var canvas = $('#canvas')[0];
      var context = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
    };
    i.onerror = function() {
      throw ("not found: " + this.src);
    };
  }
  i._width = width;
  i._height = height;
  load ? (i.src = img) : onload.call(img);
}

$('img').click(function() {
  $('.selected').removeClass('selected');
  $('#selected-id').removeAttr('id','selected-id');
  $(this).parent().toggleClass('selected');
  $(this).attr('id','selected-id');
});

$('#submit').click(function() {
  $('#hidden').prop('src','');
  var cv = $('#canvas');
  cv.prop('width','640');
  cv.prop('height','640');
  cv.empty();
  var imgEl = $('#selected-id');
  var standardResUrl = imgEl.prop('alt');
  $.get('/api?'+standardResUrl, function(responseData){
    var imgObj = JSON.parse(responseData);
    var height = imgObj.h;
    var width = imgObj.w;
    var pixelArr = imgObj.arr.data;
    var canvas = $('#canvas')[0];
    var canvasContext = canvas.getContext('2d');
    var imgData = canvasContext.createImageData(width, height);
    var data = imgData.data;
    var len = width * height * 4;
    for(var i=0; i<len; i++) {
      data[i] = pixelArr[i];
    }
    greyscaleImgData(imgData);
    canvasContext.putImageData(imgData, 0, 0, 0, 0, imgData.width, imgData.height);
    var hiddenEl = $('#hidden');
    hiddenEl.attr('src', canvas.toDataURL("image/png"));
    var srcData = hiddenEl.prop('src');
    var inputWidth = parseInt($('#input-width').val());
    var inputHeight = parseInt($('#input-height').val());
    Resample(srcData, inputWidth, inputHeight);

    setTimeout(function() {
      var canv = $('#canvas');
      var imgDataForFS = canvasContext.getImageData(0, 0, canv.prop('width'), canv.prop('height'));
      floydSteinberg(imgDataForFS);
      var imgDataAfterFS = canvasContext.getImageData(0, 0, canv.prop('width'), canv.prop('height'));
      var arr = Array.prototype.slice.call(imgDataAfterFS.data);
      var d3dataArr = [];
      for(var i=0; i<arr.length; i+=4){
        d3dataArr.push(arr[i]);
      }
      $('#svg').empty();
      d3.select('svg')
        .append('rect')
        .attr('width', 1000)
        .attr('height', 1000)
        .attr('fill', 'yellow');

      var discreteUnit = (1000/inputWidth);
      d3.select('svg').selectAll('rect')
        .data(d3dataArr)
        .enter()
        .append('rect')
        .attr('x', function (d, i) {
          return ((i % inputWidth) * discreteUnit);
        })
        .attr('y', function (d, i) {
          return (Math.floor((i % (inputWidth*inputWidth)) / inputWidth) * (discreteUnit));//+5;
        })
        .attr('fill', function (d) {
          if (d === 0) {
            return 'black';
          } else if (d === 255) {
            return 'white';
          }
        })
        .attr({'width': (discreteUnit), 'height': (discreteUnit)});
    }, 10);
  });
});

function floydSteinberg(imgPixels) {
  var h = imgPixels.height;
  var w = imgPixels.width;
  var copiedArr = [];
  for(var x=0;x<imgPixels.data.length;x+=4) {
    copiedArr.push(imgPixels.data[x]);
  }
  for(var i = 0; i < h; i++) {
    for(var j = 0; j < w; j++) {
      var ci = i*w+j;
      var cc = copiedArr[ci];
      var rc = (cc<128?0:255);
      var err = cc-rc;
      copiedArr[ci] = rc;
      if(j+1<w) {
        copiedArr[ci+1] += (err*7)>>4;
      }
      if(i+1==h) {
        continue;
      }
      if(j > 0) {
        copiedArr[ci+w-1] += (err*3)>>4;
        copiedArr[ci+w  ] += (err*5)>>4;
      }
      if(j+1+w) {
        copiedArr[ci+w+1] += (err*1)>>4;
      }
    }
  }
  var outputArr = [];
  for(var f=0; f<copiedArr.length; f++) {
    var val = copiedArr[f];
    outputArr.push(val);
    outputArr.push(val);
    outputArr.push(val);
    outputArr.push(255);
  }
  var canvas = $('#canvas')[0];
  var canvasContext = canvas.getContext('2d');
  var imgData = canvasContext.createImageData(w, h);
  var data = imgData.data;
  var len = w * h * 4;
  for(var i = 0; i<len; i++) {
    data[i] = outputArr[i];
  }
  canvasContext.clearRect(0, 0, imgData.width, imgData.height);
  canvasContext.putImageData(imgData, 0, 0, 0, 0, imgData.width, imgData.height);
}

function greyscaleImgData(imgPixels) {
  for (var y = 0; y < imgPixels.height; y++) {
    for (var x = 0; x < imgPixels.width; x++) {
      var i = (y * 4) * imgPixels.width + x * 4;
      var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
      imgPixels.data[i] = avg;
      imgPixels.data[i + 1] = avg;
      imgPixels.data[i + 2] = avg;
    }
  }
}

