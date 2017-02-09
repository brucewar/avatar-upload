const BASE = 250;
const webPage = {
  currentRadio: 1,
  init: function(){
    this.bindEvent();
  },
  bindEvent: function(){
    var self = this;
    $('.avatar-editor').click(function(e){
        $(this).siblings('form').find('input[name="picture"]').click();
    });
    $('input[name="picture"]').change(function(e){
        var originalImg = $(this)[0].files[0];
        if(!originalImg){
            return;
        }
        self.getImgBase64(originalImg, function(imgBase64){
            var $avatarEditorDialog = $('#avatarEditorDialog');
            $avatarEditorDialog.find('img').remove();
            var img = new Image();
            img.title = '拖动图片';
            img.onload = function(){
                var $img = $(img);
                var originalHeight = img.height;
                var originalWidth = img.width;
                $img.attr('data-original-width', originalWidth);
                $img.attr('data-original-height', originalHeight);
                if(originalHeight > originalWidth){
                    var newHeight = (BASE * originalHeight / originalWidth).toFixed(3);
                    $img.css({
                        'width': BASE + 'px',
                        'height': newHeight + 'px',
                        'left': '30px',
                        'top': -((newHeight - 310) / 2).toFixed(3) + 'px'
                    });
                }else{
                    var newWidth = (BASE * originalWidth / originalHeight).toFixed(3);
                    $img.css({
                        'height': BASE + 'px',
                        'width': newWidth + 'px',
                        'top': '30px',
                        'left': -((newWidth - 310) / 2).toFixed(3) + 'px'
                    });
                }
                $avatarEditorDialog.find('.avatar-editor-window-inner').append($img);
                $avatarEditorDialog.find('.avatar-editor-window-inner').after($img.clone());
            };
            img.src = imgBase64;
            $avatarEditorDialog.find('.slider-thumb').css('left', 0);
            $avatarEditorDialog.modal('show');
        });
    });
    var $avatarEditorDialog = $('#avatarEditorDialog');
    $avatarEditorDialog.delegate('.slider-thumb', 'mousedown', function(e){
        var left = parseInt($(this).css('left'));
        $(this).addClass('moving');
        self.currentRadio = left / $(this).siblings('.line').width() + 1;
    });
    $avatarEditorDialog.delegate('.avatar-editor-container img', 'mousedown', function(e){
        $('.avatar-editor-container img').addClass('moving');
    });
    $(document).on('mousemove', function(e){
        e.preventDefault();
        var $thumb = $('.slider-thumb');
        if($thumb.hasClass('moving')){
            // 调整大小
            var left = parseFloat($thumb.css('left'));
            if(self.lastPosition){
                var max = $thumb.siblings('.line').width() - $thumb.width();
                (e.pageX >= self.lastPosition.x)
                    ? (left >= max ? left = max : left += (e.pageX - self.lastPosition.x))
                    : (left <= 0 ? left = 0 : left += (e.pageX - self.lastPosition.x));
                $thumb.css('left', left);
            }
            self.currentRadio = left / $thumb.siblings('.line').width() + 1;
            self.resizeImg(self.currentRadio);
        }
        var $imgs = $('#avatarEditorDialog').find('img');
        if($imgs.hasClass('moving')){
            // 移动图片位置
            var left = parseFloat($imgs.css('left'));
            var top = parseFloat($imgs.css('top'));
            var width = parseFloat($imgs.css('width'));
            var height = parseFloat($imgs.css('height'));
            if(self.lastPosition){
                var leftMin = -(width - BASE - 30);
                var topMin = -(height - BASE - 30);
                (e.pageX < self.lastPosition.x)
                    ? (left <= leftMin ? left = leftMin : left += (e.pageX - self.lastPosition.x))
                    : (left >= 30 ? left = 30 : left += (e.pageX - self.lastPosition.x));
                (e.pageY < self.lastPosition.y)
                    ? (top <= topMin ? top = topMin : top += (e.pageY - self.lastPosition.y))
                    : (top >= 30 ? top = 30 : top += (e.pageY - self.lastPosition.y));
                $imgs.css({
                    left: left,
                    top: top
                });
            }
        }
        self.lastPosition = {
            x: e.pageX,
            y: e.pageY
        };
    });
    $(document).on('mouseup', function(e){
        $('.slider-thumb').removeClass('moving');
        $('.line').removeClass('moving');
        $('.avatar-editor-container img').removeClass('moving');
        delete self.lastPosition;
    });
    $avatarEditorDialog.find('.line').click(function(e){
        var $thumb = $(this).siblings('.slider-thumb');
        var left = parseInt($thumb.css('left'));
        $thumb.offset().left < e.clientX ? left += 20 : left -= 20;
        if(left <= 0){
            left = 0;
        }
        if(left >= $(this).width() - $thumb.width()){
            left = $(this).width() - $thumb.width();
        }
        $thumb.css('left', left);
        self.currentRadio = left / $(this).width() + 1;
        self.resizeImg(self.currentRadio);
    });
    $('#saveAvatar').click(function(){
        var canvas = document.createElement('canvas');
        canvas.id = 'avatarCanvas';
        var ctx = canvas.getContext('2d');
        var $img = $('.avatar-editor-window-inner img');
        var originalWidth = parseFloat($img.attr('data-original-width'));
        var originalHeight = parseFloat($img.attr('data-original-height'));
        var nWidth = $img.width();
        var nHeight = $img.height();
        var x = (30 - parseFloat($img.css('left'))) * originalWidth / nWidth;
        var y = (30 - parseFloat($img.css('top'))) * originalHeight / nHeight;
        canvas.width = BASE * originalWidth / nWidth;
        canvas.style.width = canvas.width;
        canvas.height = BASE * originalHeight / nHeight;
        canvas.style.height = canvas.height;
        ctx.drawImage($img[0], x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        var avatar = canvas.toDataURL($img.attr('src').match(/data:(.*);base64/)[1] || 'image/jpg');
        // TODO FormData形式提交
        // var fd = new FormData();
        // fd.append('avatar', self.dataURItoBlob(avatar));
        $('#avatarEditorDialog').modal('hide');
        $('.avatar-editor').find('img').attr('src', avatar);
    });
  },
  convertImgToBase64: function(imgFile, cb){
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function(){
        ctx.drawImage(img, 0, 0);
        cb && cb(canvas.toDataURL(imgFile.type || 'image/jpg'));
    };
    img.src = imgFile;
  },
  getImgBase64: function(imgFile, cb){
      if(!window.FileReader){
          alert('系统暂不支持针对你的浏览器的文件上传功能，建议使用最新版的Chrome！');
          return false;
      }
      var reader = new FileReader();
      reader.onload = function(){
          cb && cb(reader.result);
      };
      reader.readAsDataURL(imgFile);
      return true;
  },
  resizeImg: function(radio){
      var $imgs = $('#avatarEditorDialog').find('img');
      var height = $imgs.height();
      var width = $imgs.width();
      if(height > width){
          $imgs.css({
              width: BASE * radio,
              height: (BASE * height / width) * radio,
              top: -((BASE * height / width) * radio - 310) / 2,
              left: -(BASE * radio - 310) / 2
          });
      }else{
          $imgs.css({
              height: BASE * radio,
              width: (BASE * width / height) * radio,
              top: -(BASE * radio - 310) / 2,
              left : -((BASE * width / height) * radio - 310) / 2
          });
      }
  },
  dataURItoBlob: function (dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string
      var byteString;
      if (dataURI.split(',')[0].indexOf('base64') >= 0)
          byteString = atob(dataURI.split(',')[1]);
      else
          byteString = unescape(dataURI.split(',')[1]);

      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // write the bytes of the string to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
      }

      return new Blob([ia], {type:mimeString});
  }
};

$(function(){
  webPage.init();
});
