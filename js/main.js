let current_array = []
let current_limit = 0
let current_type = ""

let player_hand = []
let cpu_hand = []

// $(".content").hide();
// // ①「CPU戦」をクリックしゲーム画面に遷移
// $(".start button").on("click", function () {
//     $(".start").fadeOut(1000);
//     $(".content").delay(1000).fadeIn(500);
//     open_numpad(player_hand,3,"image")
//     cpu_hand_choice()
// });

/**
 * result-areaの文字列を変更
 * @param {String} text 変更後の文字列
 */
function change_result_text(text) {
    $(".result-area p").animate({ opacity: 0 }, 500, function () {
        $(".result-area p").text(text);
    }).animate({ opacity: 1 }, 500);
}

$(window).on("load", function () {
    change_result_text("Choose three number.")
    open_numpad(player_hand, 3, "image")
    cpu_hand_choice()

    if (player_hand.length === 3) {
        dicide_turn()
    }
});

/**
 * 操作する配列を指定してnumpadを開く
 * @param {Array} target_array 
 * @param {Number} target_limit 
 * @param {String} target_type 
 */
function open_numpad(target_array, target_limit, target_type) {
    current_array = target_array
    current_limit = target_limit
    current_type = target_type

    // ①選択フォーム表示
    $(".rival-score-area .score-table").css("display", "none");
    $(".numpad").css("display", "grid");
}

/**
 * CPUの手札設定
 */
function cpu_hand_choice() {
    let number_list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    while (true) {
        const num = number_list[Math.floor(Math.random() * 10)]
        if (num === "") {
            continue
        }
        number_list[num] = ""
        cpu_hand.push(num)
        if (cpu_hand.length === 3) {
            console.log(cpu_hand);
            break
        }
    }
}

function dicide_turn() {
    if ((Math.random() * 2) < 1) {

        $(".result-area p").text("Player turn");
    } else {
        $(".result-area p").text("CPU turn");
    }
}

/**
 * 数字ボタン押下
 */
$(document).on("click", ".select-num", function () {
    const select_num_id = $(this).attr("id");
    const select_num = select_num_id.substr(4, 1)

    // ②同じ数字は選択できないようdisableに変更   
    $(`#${select_num_id}`).attr("disabled", true);

    if (current_type === "image") {
        // ③選択した数字を保持、画面のカードに反映
        current_array.push(select_num)
        $(`#player-hand-${current_array.length}`).attr("src", `./img/${select_num}.png`);
    }

    if (current_array.length === current_limit) {
        $(".select-num").attr("disabled", true);
    }
});


/**
 * 確定ボタン押下
 */
$("#btn-enter").on("click", function () {
    if (current_array.length !== current_limit) return

    // ④選択フォーム非表示
    $(".numpad").css("display", "none");
    $(".rival-score-area .score-table").css("display", "table");
});

/**
 * リセットボタン押下
 */
$("#btn-reset").on("click", function () {
    current_array = []

    $(".select-num").attr("disabled", false);

    if (current_type === "image") {
        $("#player-hand-1").attr("src", "./img/black.png");
        $("#player-hand-2").attr("src", "./img/black.png");
        $("#player-hand-3").attr("src", "./img/black.png");
    }

});
