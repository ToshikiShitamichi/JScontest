// $(".content").hide();
// // ①「CPU戦」をクリックしゲーム画面に遷移
// $(".start button").on("click", function () {
//     $(".start").fadeOut(1000);
//     $(".content").delay(1000).fadeIn(500);
// });

$(".select-num").on("click", function () {
    const select_num_id = $(this).attr("id");
    const select_num = select_num_id.substr(4,1) 
       
    $(`#${select_num_id}`).attr("disabled","true");
    console.log(select_num);
    
});