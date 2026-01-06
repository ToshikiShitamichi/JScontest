let current_array = []
let current_limit = 0
let current_type = ""
let current_allow = []

let player_hand = []
let item_used = false
let rival_hand = []

let current_turn = ""

let call_array = []
let call_type = ""

let player_name = ""
let rival_name = ""

$(".content").hide();
// ①「CPU戦」をクリックしゲーム画面に遷移
$("#cpu-match").on("click", function () {
    $(".start").fadeOut(1000);
    $(".content").delay(1000).fadeIn(500);
    $("body").addClass("cpu-mode");
    $(".login-area").css("visibility", "hidden");


    player_name = "Player"
    rival_name = "CPU"

    change_result_text("Choose three number.")
    open_numpad(player_hand, 3, "image", dicide_turn)
    rival_hand_choice()
});


/**
 * result-areaの文字列を変更
 * @param {String} text 変更後の文字列
 */
function change_result_text(text) {
    $(".result-area p").animate({ opacity: 0 }, 500, function () {
        $(".result-area p").text(text);
    }).animate({ opacity: 1 }, 500);
}

/**
 * 操作する配列を指定してnumpadを開く
 * @param {Array} target_array 選択中の配列 
 * @param {Number} target_limit 選択する数字数
 * @param {String} target_type 反映させる箇所(画像/テキスト)
 * @param {Function} target_function Enter後に実行する関数
 * @param {null} [allow_array=null] 選択許可配列
 */
function open_numpad(target_array, target_limit, target_type, target_function, target_allow = null) {
    current_array = target_array
    current_limit = target_limit
    current_type = target_type
    current_allow = target_allow

    // ①選択フォーム表示
    $(".rival-score-area .score-table").css("display", "none");
    $(".numpad").css("display", "grid");
    $(".select-num").attr("disabled", false);

    if (current_allow) {
        for (i = 0; i < 10; i++) {
            if (current_allow.indexOf(i) === -1) {
                $(`#btn-${i}`).attr("disabled", true);
            }
        }
    }

    if (!item_used && (window.player_tug === current_turn || (window.player_tug === -1 && current_turn === 0))) {
        $(".player-button").removeClass("is-disabled");
    }

    /**
     * 数字ボタン押下
     */
    $(document).off("click", ".select-num")
    $(document).on("click", ".select-num", function () {
        const select_num_id = $(this).attr("id");
        const select_num = select_num_id.substr(4, 1)

        // ②同じ数字は選択できないようdisableに変更   
        $(`#${select_num_id}`).attr("disabled", true);

        if (current_type === "image") {
            // ③選択した数字を保持、画面のカードに反映
            current_array.push(parseInt(select_num))

            $(`#player-hand-${current_array.length}`).attr("src", `./img/${select_num}.png`);
        } else if (current_type === "text") {
            current_array.push(parseInt(select_num))

            $(".result-area p").append(select_num);
        }

        if (current_array.length === current_limit) {
            $(".select-num").attr("disabled", true);
        }
    });


    /**
     * 確定ボタン押下
     */
    $("#btn-enter").off("click")
    $("#btn-enter").on("click", function () {
        if (current_array.length !== current_limit) return

        // ④選択フォーム非表示
        $(".numpad").css("display", "none");
        $(".rival-score-area .score-table").css("display", "table");
        $(".player-button").addClass("is-disabled");

        target_function()
    });

    /**
     * リセットボタン押下
     */
    $("#btn-reset").off("click")
    $("#btn-reset").on("click", function () {
        current_array.length = 0

        $(".select-num").attr("disabled", false);

        if (current_type === "image") {
            $("#player-hand-1").attr("src", "./img/black.png");
            $("#player-hand-2").attr("src", "./img/black.png");
            $("#player-hand-3").attr("src", "./img/black.png");
        } else if (current_type === "text") {
            let text = $(".result-area p").text();
            text = text.substr(0, 9)
            $(".result-area p").text(text);
        }

    });

    /**
     * HIGHLOWボタン押下
     */
    $("#highlow").off("click")
    $("#highlow").on("click", async function () {
        item_used = true
        $(".player-button").addClass("is-disabled");

        $(".numpad").css("display", "none");
        $(".rival-score-area .score-table").css("display", "table");


        if (window.player_tug === 0 || window.player_tug === 1) {

            const actionRef = window.dbref(window.db, `action/${window.roomid}`);
            const newActionRef = window.dbpush(actionRef);

            await window.dbset(newActionRef, {
                type: "HIGHLOW",
                by: window.player_tug
            })
            return
        }

        change_result_text("HIGHLOW")
        setTimeout(() => {
            $(".player-score-area tbody").append(`<tr><td colspan=2>HIGHLOW</td></tr>`);
            for (i = 0; i < rival_hand.length; i++) {
                if (rival_hand[i] < 5) {
                    $(`#rival-hand-${i + 1}`).attr("src", "./img/low.png");
                } else {
                    $(`#rival-hand-${i + 1}`).attr("src", "./img/high.png");
                }
            }
            change_turn()
        }, 1500);
    });

    /**
     * TARGETボタン押下
     */
    $("#target").off("click")
    $("#target").on("click", function () {
        item_used = true
        $(".player-button").addClass("is-disabled");

        $(".numpad").css("display", "none");
        $(".rival-score-area .score-table").css("display", "table");

        change_result_text("TARGET > ")
        setTimeout(() => {
            open_numpad(call_array, 1, "text", target_check)
        }, 1500);
    })

    /**
     * SHUFFLEボタン押下
     */
    $("#shuffle").off("click")
    $("#shuffle").on("click", function () {
        item_used = true
        $(".player-button").addClass("is-disabled");

        $(".numpad").css("display", "none");
        $(".rival-score-area .score-table").css("display", "table");

        change_result_text("SHUFFLE")

        const old_hand = [...player_hand]

        player_hand.length = 0
        $("#player-hand-1").attr("src", "./img/black.png");
        $("#player-hand-2").attr("src", "./img/black.png");
        $("#player-hand-3").attr("src", "./img/black.png");

        setTimeout(() => {
            $(".player-score-area tbody").append(`<tr><td colspan=2>SHUFFLE</td></tr>`);
            open_numpad(player_hand, 3, "image", change_turn, old_hand)
        }, 1500);
    })

    /**
     * CHANGEボタン押下
     */
    $("#change").off("click")
    $("#change").on("click", function () {
        item_used = true
        $(".player-button").addClass("is-disabled");

        $(".numpad").css("display", "none");
        $(".rival-score-area .score-table").css("display", "table");

        change_result_text("CHANGE")
        setTimeout(() => {
            $(".player-hand-area").addClass("choose-hand");
            change_result_text("Choose change hand.")
        }, 1500);

        $(".player-hand").off("click")
        $(".player-hand").on("click", function () {
            $(".player-hand-area").removeClass("choose-hand");
            const select_hand_id = $(this).attr("id");
            const select_hand = select_hand_id.substr(12, 1)
            open_numpad(call_array, 1, "image", change_turn)
        });
    })
}

/**
 * CPUの手札設定
 */
function rival_hand_choice() {
    let number_list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    while (true) {
        const num = number_list[Math.floor(Math.random() * 10)]
        if (num === "") {
            continue
        }
        number_list[num] = ""
        rival_hand.push(num)
        if (rival_hand.length === 3) {
            console.log("rival_hand" + rival_hand);
            break
        }
    }
}

/**
 * 先攻後攻決定
 */
function dicide_turn() {
    current_turn = Math.round(Math.random())

    if (current_turn === 0) {
        $(".player-turn").css("visibility", "visible");
        change_result_text(`${player_name} turn.`)
        player_turn()
    } else {
        $(".rival-turn").css("visibility", "visible");
        change_result_text(`${rival_name} turn.`);
        rival_turn()
    }
}

/**
 * ターン切り替え
 */
function change_turn() {
    call_array.length = 0
    if (current_turn === 0) {
        current_turn = 1
        $(".player-turn").css("visibility", "hidden");
        $(".rival-turn").css("visibility", "visible");
        change_result_text(`${rival_name} turn.`);
        rival_turn()
    } else {
        current_turn = 0
        $(".rival-turn").css("visibility", "hidden");
        $(".player-turn").css("visibility", "visible");
        change_result_text(`${player_name} turn.`)
        player_turn()
    }
}

/**
 * プレイヤーのターン
 */
function player_turn() {
    setTimeout(() => {
        change_result_text("CALL > ")
        setTimeout(() => {
            open_numpad(call_array, 3, "text", judge)
        }, 500);
    }, 1500);
}

/**
 * CPUのターン
 */
function rival_turn() {
    setTimeout(() => {
        change_result_text("CALL > ")
        let number_list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        while (true) {
            const num = number_list[Math.floor(Math.random() * 10)]
            if (num === "") {
                continue
            }
            number_list[num] = ""
            call_array.push(num)
            if (call_array.length === 3) {
                break
            }
        }
    }, 1500);
    setTimeout(() => {
        call_array.forEach(number => {
            $(".result-area p").append(number);
        });
    }, 3000);
    setTimeout(() => {
        judge()
    }, 4500);
}

/**
 * HIT/BLOW判定
 */
function judge() {
    let hit_count = 0
    let blow_count = 0

    if (current_turn === 0) {
        for (i = 0; i < call_array.length; i++) {
            let judge_index = rival_hand.indexOf(call_array[i])
            if (judge_index === i) {
                hit_count++
            } else if (judge_index !== -1) {
                blow_count++
            }
        }
        $(".player-score-area tbody").append(`<tr><td>${call_array}</td><td>${hit_count}-${blow_count}</td></tr>`);
    } else {
        for (i = 0; i < call_array.length; i++) {
            let judge_index = player_hand.indexOf(call_array[i])
            if (judge_index === i) {
                hit_count++
            } else if (judge_index !== -1) {
                blow_count++
            }
        }
        $(".rival-score-area tbody").append(`<tr><td>${call_array}</td><td>${hit_count}-${blow_count}</td></tr>`);
    }
    change_result_text(`${hit_count}HIT ${blow_count}BLOW`)
    setTimeout(() => {
        if (hit_count === 3) {
            if (current_turn === 0) {
                change_result_text(`${player_name} win.`)
                return
            }
            else {
                change_result_text(`${rival_name} win.`)
                return
            }
        }
        change_turn()
    }, 1500);
}

/**
 * 選択した数字のターゲット判定
 */
function target_check() {
    const target_index = rival_hand.indexOf(call_array[0])

    if (target_index > 0) {
        $(`#rival-hand-${target_index + 1}`).attr("src", `./img/${call_array[0]}.png`);
    }
    $(".player-score-area tbody").append(`<tr><td colspan=2>TARGET ${call_array[0]}</td></tr>`);
    change_turn()
}