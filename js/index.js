$(function(){
    // 初期表示
    if( location.hash === ''){
        displayPage("#one");
    }else{
        displayPage(location.hash);
    }
    // 完了フラグ(falseになったら遷移は不可にする)　
    // 途中でURLを変更しても、falseになっていたら遷移不可
    var completeFlg = true;

    // ボタン押下のページ遷移処理
    // ハッシュのみ変更する
    $('.btn').click(function(e){
        e.preventDefault();
        var hash = "#"+$(this).attr('data-hash');
        location.hash = hash;
    });

    // ハッシュが変更されたら、そのハッシュに基づいて表示する
    $(window).hashchange(function(){
        if(completeFlg === true){
            clearPage();
            displayPage(location.hash);        
        }else{
            location.hash = "#three";    
            return false;
        }
        if(location.hash === "#three"){
            completeFlg = false;
        }
    });    

    // ページ初期化処理
    function clearPage(){
        $(".page").css("display", "none");
    }
    // ページ表示処理
    function displayPage(hash){
        $(hash).css("display", "block");
        // $(hash).fadeIn(2000, "linear"); // アニメーションをつけることも出来る
    }
}); 