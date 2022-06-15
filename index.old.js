
// -----------------------------------------------------------------------------
// モジュールのインポート
const server = require("express")();
const line = require("@line/bot-sdk"); // Messaging APIのSDKをインポート
const dialogflow = require("@google-cloud/dialogflow");

// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};

// -----------------------------------------------------------------------------
// Webサーバー設定
server.listen(process.env.PORT || 3000);

// APIコールのためのクライアントインスタンスを作成
const bot = new line.Client(line_config);

// Dialogflowのクライアントインスタンスを作成
const session_client = new dialogflow.SessionsClient({
    project_id: process.env.GOOGLE_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }
});

// -----------------------------------------------------------------------------
// ルーター設定
server.post('/bot/webhook', line.middleware(line_config), (req, res, next) => {
    // 先行してLINE側にステータスコード200でレスポンスする。
    res.sendStatus(200);

    // すべてのイベント処理のプロミスを格納する配列。
    let events_processed = [];

    // イベントオブジェクトを順次処理。
    req.body.events.forEach((event) => {
        console.log("----------event start---------");
        // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
        if (event.type == "message" && event.message.type == "text"){
            events_processed.push(
                session_client.detectIntent({
                    session: session_client.projectAgentSessionPath(process.env.GOOGLE_PROJECT_ID, event.source.userId),
                    queryInput: {
                        text: {
                            text: event.message.text,
                            languageCode: "ja",
                        }
                    }
                }).then((responses) => {
                    if (responses[0].queryResult && responses[0].queryResult.action == "handle-delivery-order"){
                        let message_text
                        if (responses[0].queryResult.parameters.fields.menu.stringValue){
                            message_text = `毎度！${responses[0].queryResult.parameters.fields.menu.stringValue}ね。どちらにお届けしましょ？`;
                            // ここでテイクアウトか出前の選択をするようにボタンを出せるといいな
                        } else {
                            message_text = `毎度！ご注文は？`;
                        }
                        return bot.replyMessage(event.replyToken, {
                            type: "text",
                            text: message_text
                        });
                    }
                    if (responses[0].queryResult && responses[0].queryResult.action == "asked-a-question"){
                        let message_text
                        if (responses[0].queryResult.parameters.fields.question.stringValue == "メニュー"){
                            message_text = `【メニュー】\r\n梅　￥1,200（一人前）\r\n竹　￥2,000（一人前）\r\n松　￥2,800（一人前）`;
                        } else if (responses[0].queryResult.parameters.fields.question.stringValue == "配達時間"){
                            message_text = `今からですと、約30分程でお届けできます！`;
                        } else if (responses[0].queryResult.parameters.fields.question.stringValue == "予約"){
                            message_text = `予約受け付けております！\r\n何にしましょ？`;
                        } else if (responses[0].queryResult.parameters.fields.question.stringValue == "お店"){
                            message_text = `【店舗情報】\r\n営業時間：10:00～21:00\r\n　　住所：東京都新宿区高田馬場0-00-0\r\n電話番号：000-0000-0000\r\n　定休日：隔週水曜日`;
                        } else if (responses[0].queryResult.parameters.fields.question.stringValue == "おすすめ"){
                            message_text = `当店のおすすめメニュー\r\n「梅　￥1,200（一人前）」\r\n\r\n獲れたて新鮮なお魚を使用したお寿司を、お手頃価格で提供しています！\r\n是非ご賞味あれ！`;
                        } else if (responses[0].queryResult.parameters.fields.question.stringValue == "テイクアウト"){
                            message_text = `テイクアウト可能です！\r\nご注文お決まりの方は「テイクアウトで注文」と入力してください。`;
                        } else {
                            message_text = `店舗から10km圏内でしたら配達可能です！`;
                        }
                        return bot.replyMessage(event.replyToken, {
                            type: "text",
                            text: message_text
                        });
                    }
                    if (responses[0].queryResult && responses[0].queryResult.action == "applying-for-a-job"){
                        let message_text
                        if (responses[0].queryResult.parameters.fields.Recruitment.stringValue == "アルバイト"){
                            message_text = `ご連絡ありがとうございます。\r\n現在、アルバイトを募集しています！\r\n\r\n現在募集している職種は「配達員」です。
                                            \r\n18歳以上で元気がある方大歓迎です！\r\n\r\n詳しくは000-0000-0000までお電話ください。`;
                        } else if (responses[0].queryResult.parameters.fields.Recruitment.stringValue == "正社員") {
                            message_text = `ご連絡ありがとうございます。\r\n現在、正社員は募集しておりません。`;
                        } else if (responses[0].queryResult.parameters.fields.Recruitment.stringValue == "パート"){
                            message_text = `ご連絡ありがとうございます。\r\n現在、パートタイマーを募集しています！\r\n\r\n現在募集している職種は「配達員」です。
                                            \r\n18歳以上で元気がある方大歓迎です！\r\n\r\n詳しくは000-0000-0000までお電話ください。`;
                        } else if (responses[0].queryResult.parameters.fields.Recruitment.stringValue == "中途"){
                            message_text = `ご連絡ありがとうございます。\r\n現在、中途採用は行っておりません。`;
                        }
                        return bot.replyMessage(event.replyToken, {
                            type: "text",
                            text: message_text
                        });
                    }
                    if (responses[0].queryResult && responses[0].queryResult.action == "rant-rant"){
                        let message_text
                        if (responses[0].queryResult.parameters.fields.slander.stringValue){
                            message_text = `誹謗中傷。ダメ。ゼッタイ。`;
                        }
                        return bot.replyMessage(event.replyToken, {
                            type: "text",
                            text: message_text
                        });
                    }
                    if (responses[0].queryResult && responses[0].queryResult.action == "nice-to-meet-you"){
                        let message_text
                        if (responses[0].queryResult.parameters.fields.greeting.stringValue == "初めまして"){
                            message_text = `一見さん、いらっしゃい！`;
                        } else {
                            message_text = `いらっしゃい！`
                        }
                        return bot.replyMessage(event.replyToken, {
                            type: "text",
                            text: message_text
                        });
                    }
                    if (responses[0].queryResult && responses[0].queryResult.action == "order-cancel"){
                        let message_text
                        if (responses[0].queryResult.parameters.fields.Cancel.stringValue){
                            message_text = `かしこまりました。ご注文をキャンセルいたします。\r\nまたのご利用お待ちしております！`;
                        }
                        return bot.replyMessage(event.replyToken, {
                            type: "text",
                            text: message_text
                        });
                    }
                    if (responses[0].queryResult && responses[0].queryResult.action == "take-out"){
                        let message_text
                        if (responses[0].queryResult.parameters.fields.takeout.stringValue){
                            message_text = `毎度！ご注文は？`;
                            // bot.replyMessage(event.replyToken, {
                            //     type: "text",
                            //     text: message_text
                            // });
                        } //if (responses[0].queryResult.parameters.fields.menu.stringValue){
                        //     message_text = `${responses[0].queryResult.parameters.fields.menu.stringValue}ね。何時頃お受け取りになりますか？`;
                        //     bot.replyMessage(event.replyToken, {
                        //         type: "text",
                        //         text: message_text
                        //     });
                        // }
                        return bot.replyMessage(event.replyToken, {
                            type: "text",
                            text: message_text
                        });
                    }
                })
            );
        }
    });

    // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );
});