
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
    getDatabase, push, ref, set, get, onValue, update, onChildAdded
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { firebaseConfig } from "./api.js"

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.db = db
window.dbpush = push
window.dbref = ref
window.dbset = set

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

let currentUser = null
$("#login").on("click", function () {
    signInWithPopup(auth, provider);
});

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        $(".login-area").css("visibility", "hidden");
    }
});


let roomid = 0
window.player_tug = -1
let player_icon = ""
let rival_icon = ""

let host_name = "Host player"
let guest_name = "Guest player"

$("#room-create").on("click", async function () {
    // ・プレイヤータグを0に設定
    window.player_tug = 0
    player_name = "Host player"
    rival_name = "Guest player"

    // ・作成時にルームID作成、保存、表示
    roomid = Math.floor(Math.random() * (99999 - 10000) + 10000)
    window.roomid = roomid
    const roomRef = ref(db, `rooms/${roomid}`)
    await set(roomRef, { status: "waiting" })

    $(".room-id-area p").text(`ルームID：${roomid}`);

    // ・チャットの入力フォーム非表示
    $(".chat-input").css("visibility", "hidden");

    $(".start").fadeOut(1000);
    $(".content").delay(1000).fadeIn(500);
    $(".login-area").css("visibility", "hidden");

    const hostPlayerRef = ref(db, `player/${roomid}/0`)
    await set(hostPlayerRef, {
        name: currentUser?.displayName ?? "Host player",
        photoURL: currentUser?.photoURL ?? "./img/default.png"
    })

    msgSubscribe()
    open_numpad(player_hand, 3, "image", hand_dicide)
});

$("#room-join").on("click", async function () {
    try {
        // ・プレイヤータグを1に設定
        window.player_tug = 1
        player_name = "Guest player"
        rival_name = "Host player"

        // ルームIDを入力し、画面遷移
        roomid = $("#join-roomid").val();
        window.roomid = roomid
        const roomRef = ref(db, `rooms/${roomid}`)

        const get_joinroom_status = await get(roomRef)
        const joinroom_status = get_joinroom_status.val().status

        if (joinroom_status !== "waiting") {
            location.reload()
        } else {
            await update(roomRef, { status: "matched" })
        }

        $(".room-id-area p").text(`ルームID：${roomid}`);

        // ・チャットの入力フォーム非表示
        $(".chat-input").css("visibility", "hidden");

        $(".start").fadeOut(1000);
        $(".content").delay(1000).fadeIn(500);
        $(".login-area").css("visibility", "hidden");

        const guestPlayerRef = ref(db, `player/${roomid}/1`)
        await set(guestPlayerRef, {
            name: currentUser?.displayName ?? "Guest player",
            photoURL: currentUser?.photoURL ?? "./img/default.png"
        })

        msgSubscribe()
        open_numpad(player_hand, 3, "image", hand_dicide)
    } catch (error) {
        location.reload()
    }
});

$("#gallery-join").on("click", async function () {
    try {
        // ルームIDを入力し、画面遷移
        roomid = $("#gallery-roomid").val();
        window.roomid = roomid
        const roomRef = ref(db, `rooms/${roomid}`)

        const get_joinroom_status = await get(roomRef)
        const joinroom_status = get_joinroom_status.val().status

        console.log(joinroom_status);

        if (!joinroom_status) {
            location.reload()
        }

        $(".room-id-area p").text(`ルームID：${roomid}`);

        // ・プレイヤーの手を全てblindに
        $("#player-hand-1").attr("src", "./img/blind.png");
        $("#player-hand-2").attr("src", "./img/blind.png");
        $("#player-hand-3").attr("src", "./img/blind.png");

        $(".start").fadeOut(1000);
        $(".content").delay(1000).fadeIn(500);
        $(".login-area").css("visibility", "hidden");

        msgSubscribe()
        subscribe()
    } catch (error) {
        location.reload()
    }
});

async function hand_dicide() {
    // ・それぞれで自身の数字を決定→firebaseで保持
    const playerHandRef = ref(db, `hands/${roomid}/${window.player_tug}`)
    await set(playerHandRef, player_hand)

    // ・双方の数字が決まったらホスト側でターン決め(決まるまで待機)
    const handRef = ref(db, `hands/${roomid}`)
    const unsubscribeHands = onValue(handRef, async (snapshot) => {
        const data = snapshot.val()
        console.log(data);
        if (data.length === 2) {
            if (window.player_tug === 0) {
                rival_hand = data[1]
                console.log("player_hand" + player_hand);
                console.log("rival_hand" + rival_hand);

                current_turn = Math.round(Math.random())

                const textRef = ref(db, `text/${roomid}`)
                const newTextRef = push(textRef)
                if (current_turn === 0) {
                    await set(newTextRef, `${host_name} turn.`)
                } else {
                    await set(newTextRef, `${guest_name} turn.`)
                }
                unsubscribeHands()
                subscribe()
            } else {
                rival_hand = data[0]
                console.log("player_hand" + player_hand);
                console.log("rival_hand" + rival_hand);

                unsubscribeHands()
                subscribe()
            }
        }
    })
}

function msgSubscribe() {
    const chatRef = ref(db, `chat/${roomid}`)
    onValue(chatRef, (snapshot) => {
        $(".chat-view").html("");

        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val()

            const msgHtml = `<div class="chat"><div class="chat-user"><img class="chat-icon" src="${data.uI}"></div><div class="chat-msg"><p class="chat-user-name">${data.uN}</p><p>${data.message}</p></div></div>`

            $(".chat-view").append(msgHtml);
        });
    })

    const playerRef = ref(db, `player/${roomid}`)
    onValue(playerRef, (snapshot) => {
        const data = snapshot.val()

        const p0 = data[0] ?? { name: "Host player", photoURL: "./img/default.png" }
        const p1 = data[1] ?? { name: "Guest player", photoURL: "./img/default.png" }

        host_name = p0.name
        guest_name = p1.name

        if (window.player_tug === 0 || window.player_tug === -1) {
            player_name = p0.name
            player_icon = p0.photoURL

            rival_name = p1.name
            rival_icon = p1.photoURL
        } else if (window.player_tug === 1) {
            player_name = p1.name
            player_icon = p1.photoURL

            rival_name = p0.name
            rival_icon = p0.photoURL
        }

        $(".player-name-area p").text(player_name);
        $(".player-turn p").text(`${player_name}のターン`);
        $(".player-icon-area img").attr("src", player_icon);

        $(".rival-name-area p").text(rival_name);
        $(".rival-turn p").text(`${rival_name}のターン`);
        $(".rival-icon-area img").attr("src", rival_icon)
    })

}

function subscribe() {
    if (window.player_tug === -1) {
        const handRef = ref(db, `hands/${roomid}`)
        const unsubscribeHands = onValue(handRef, async (snapshot) => {
            const data = snapshot.val()
            if (data === null) return
            console.log(data);
            if (data.length === 2) {
                player_hand = data[0]
                rival_hand = data[1]
                console.log("player_hand" + player_hand);
                console.log("rival_hand" + rival_hand);
                unsubscribeHands()
            }
        })
    }
    const textRef = ref(db, `text/${roomid}`)
    onChildAdded(textRef, (snapshot) => {
        const data = snapshot.val()

        $(".result-area p").animate({ opacity: 0 }, 500, function () {
            $(".result-area p").text(data);
        }).animate({ opacity: 1 }, 500)

        if (data === `${host_name} turn.`) {
            current_turn = 0

            if (window.player_tug === current_turn) {
                host_player_turn()
            }
            return
        }

        if (data === `${guest_name} turn.`) {
            current_turn = 1

            if (window.player_tug === current_turn) {
                guest_player_turn()
            }
            return
        }
    })

    const hostScoreRef = ref(db, `score/${roomid}/host`)
    onChildAdded(hostScoreRef, (snapshot) => {
        const data = snapshot.val()
        console.log(data);

        if (data.number !== "action") {
            if (window.player_tug === 0 || window.player_tug === -1) {
                $(".player-score-area tbody").append(`<tr><td>${data.number}</td><td>${data.h_b}</td></tr>`);
            } else if (window.player_tug === 1) {
                $(".rival-score-area tbody").append(`<tr><td>${data.number}</td><td>${data.h_b}</td></tr>`);
            }
        } else {
            if (window.player_tug === 0 || window.player_tug === -1) {
                $(".player-score-area tbody").append(`<tr><td colspan=2>${data.h_b}</td></tr>`);
            } else if (window.player_tug === 1) {
                $(".rival-score-area tbody").append(`<tr><td colspan=2>${data.h_b}</td></tr>`);
            }
        }

    })

    const guestScoreRef = ref(db, `score/${roomid}/guest`)
    onChildAdded(guestScoreRef, (snapshot) => {
        const data = snapshot.val()
        console.log(data);

        if (data.number !== "action") {
            if (window.player_tug === 1) {
                $(".player-score-area tbody").append(`<tr><td>${data.number}</td><td>${data.h_b}</td></tr>`);
            } else if (window.player_tug === 0 || window.player_tug === -1) {
                $(".rival-score-area tbody").append(`<tr><td>${data.number}</td><td>${data.h_b}</td></tr>`);
            }
        } else {
            if (window.player_tug === 1) {
                $(".player-score-area tbody").append(`<tr><td colspan=2>${data.h_b}</td></tr>`);
            } else if (window.player_tug === 0 || window.player_tug === -1) {
                $(".rival-score-area tbody").append(`<tr><td colspan=2>${data.h_b}</td></tr>`);
            }
        }

    })

    const actionRef = ref(db, `action/${roomid}`);
    onChildAdded(actionRef, (snapshot) => {
        const data = snapshot.val();

        if (data.type === "HIGHLOW" && window.player_tug === data.by) {
            if (window.player_tug === data.by) {
                const textRef = ref(db, `text/${roomid}`)
                const newTextRef = push(textRef)
                setTimeout(async () => {
                    await set(newTextRef, `HIGHLOW`)
                }, 1500);
            }

            if (window.player_tug === 0 || window.player_tug === -1) {
                const hostScoreRef = ref(db, `score/${roomid}/host`)
                const newHostScoreRef = push(hostScoreRef)
                const msg = {
                    number: "action",
                    h_b: `HIGHLOW`
                }
                setTimeout(async () => {
                    await set(newHostScoreRef, msg)
                }, 3500);
            } else if (window.player_tug === 1) {
                const guestScoreRef = ref(db, `score/${roomid}/guest`)
                const newGuestScoreRef = push(guestScoreRef)
                const msg = {
                    number: "action",
                    h_b: `HIGHLOW`
                }
                setTimeout(async () => {
                    await set(newGuestScoreRef, msg)
                }, 3500);
            }
        }

        setTimeout(() => {
            if (data.by === window.player_tug) {
                for (let i = 0; i < rival_hand.length; i++) {
                    if (rival_hand[i] < 5) {
                        $(`#rival-hand-${i + 1}`).attr("src", "./img/low.png");
                    } else {
                        $(`#rival-hand-${i + 1}`).attr("src", "./img/high.png");
                    }
                }
            } else if (window.player_tug === -1) {
                if (data.by === 0) {
                    for (let i = 0; i < rival_hand.length; i++) {
                        if (rival_hand[i] < 5) {
                            $(`#rival-hand-${i + 1}`).attr("src", "./img/low.png");
                        } else {
                            $(`#rival-hand-${i + 1}`).attr("src", "./img/high.png");
                        }
                    }
                } else if (data.by === 1) {
                    for (let i = 0; i < player_hand.length; i++) {
                        if (player_hand[i] < 5) {
                            $(`#player-hand-${i + 1}`).attr("src", "./img/low.png");
                        } else {
                            $(`#player-hand-${i + 1}`).attr("src", "./img/high.png");
                        }
                    }
                }
            }

            if (window.player_tug === data.by) {
                online_change_turn()
            }
        }, 3500);
    });
}

async function online_change_turn() {
    const textRef = ref(db, `text/${roomid}`)
    const newTextRef = push(textRef)
    call_array.length = 0
    if (current_turn === 0 && window.player_tug === 0) {
        current_turn = 1
        setTimeout(async () => {
            await set(newTextRef, `${guest_name} turn.`)
        }, 1500);
    } else if (current_turn === 1 && window.player_tug === 1) {
        current_turn = 0
        setTimeout(async () => {
            await set(newTextRef, `${host_name} turn.`)
        }, 1500);
    }
}

/**
 * プレイヤーのターン
 */
function host_player_turn() {
    setTimeout(() => {
        change_result_text("CALL > ")
        setTimeout(() => {
            open_numpad(call_array, 3, "text", online_judge)
        }, 500);
    }, 1500);
}

/**
 * CPUのターン
 */
function guest_player_turn() {
    setTimeout(() => {
        change_result_text("CALL > ")
        setTimeout(() => {
            open_numpad(call_array, 3, "text", online_judge)
        }, 500);
    }, 1500);
}

/**
 * HIT/BLOW判定
 */
async function online_judge() {
    const textRef = ref(db, `text/${roomid}`)
    let newTextRef = push(textRef)

    await set(newTextRef, `CALL > ${call_array[0]}${call_array[1]}${call_array[2]}`)

    let hit_count = 0
    let blow_count = 0

    if (current_turn === 0) {
        for (let i = 0; i < call_array.length; i++) {
            let judge_index = rival_hand.indexOf(call_array[i])
            if (judge_index === i) {
                hit_count++
            } else if (judge_index !== -1) {
                blow_count++
            }
        }
        const hostScoreRef = ref(db, `score/${roomid}/host`)
        const newHostScoreRef = push(hostScoreRef)
        const msg = {
            number: call_array,
            h_b: `${hit_count}-${blow_count}`
        }
        setTimeout(async () => {
            await set(newHostScoreRef, msg)
        }, 2500);
    } else {
        for (let i = 0; i < call_array.length; i++) {
            let judge_index = rival_hand.indexOf(call_array[i])
            if (judge_index === i) {
                hit_count++
            } else if (judge_index !== -1) {
                blow_count++
            }
        }
        const guestScoreRef = ref(db, `score/${roomid}/guest`)
        const newGuestScoreRef = push(guestScoreRef)
        const msg = {
            number: call_array,
            h_b: `${hit_count}-${blow_count}`
        }
        setTimeout(async () => {
            await set(newGuestScoreRef, msg)
        }, 2500);
    }
    newTextRef = push(textRef)
    setTimeout(async () => {
        await set(newTextRef, `${hit_count}HIT ${blow_count}BLOW`)
    }, 1500);

    setTimeout(async () => {
        if (hit_count === 3) {
            newTextRef = push(textRef)
            await set(newTextRef, `${player_name} win.`)
            return
        }
        online_change_turn()
    }, 3000);
}

$("#send").on("click", async function () {
    const chatRef = ref(db, `chat/${roomid}`)
    const newChatRef = push(chatRef)

    const msg = {
        uI: currentUser?.photoURL ?? "./img/default.png",
        uN: currentUser?.displayName ?? "ゲスト",
        message: $("#input-message").val()
    }

    await set(newChatRef, msg)

    $("#input-message").val("")
});


$("#input-message").keydown(function (e) {
    if ($("#input-message").val() === "") return
    if (e.key === "Enter") {
        $("#send").click()
    }
});