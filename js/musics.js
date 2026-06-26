function music_on() {
    var audio1 = document.getElementById('bg_music');
    if (audio1.paused) {
        audio1.play();
    }else{
        audio1.pause();
        audio1.currentTime = 0;//音乐从头播放
    }
}
