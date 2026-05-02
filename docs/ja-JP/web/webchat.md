---
read_when:
    - WebChat へのアクセスのデバッグまたは設定
summary: ループバック WebChat 静的ホストとチャット UI 向け Gateway WS の使用方法
title: ウェブチャット
x-i18n:
    generated_at: "2026-05-02T23:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

ステータス: macOS/iOS SwiftUIチャットUIはGateway WebSocketと直接通信します。

## 概要

- Gateway向けのネイティブチャットUIです（組み込みブラウザーもローカル静的サーバーも不要）。
- 他のチャネルと同じセッションおよびルーティングルールを使用します。
- 決定的ルーティング: 返信は常にWebChatに戻ります。

## クイックスタート

1. Gatewayを起動します。
2. WebChat UI（macOS/iOSアプリ）またはControl UIのチャットタブを開きます。
3. 有効なGateway認証パスが設定されていることを確認します（デフォルトは共有シークレット、
   loopback上でも同様）。

## 仕組み（動作）

- UIはGateway WebSocketに接続し、`chat.history`、`chat.send`、`chat.inject`、`chat.transcribeAudio`を使用します。
- `chat.history`は安定性のために制限されています: Gatewayは長いテキストフィールドを切り詰め、重いメタデータを省略し、サイズが大きすぎるエントリを`[chat.history omitted: message too large]`に置き換えることがあります。
- `chat.history`は、現代的な追記専用セッションファイルではアクティブなトランスクリプトブランチに従うため、放棄された書き換えブランチや置き換え済みのプロンプトコピーはWebChatにレンダリングされません。
- Control UIは`chat.history`から返されたバックエンドのGateway `sessionId`を記憶し、後続の`chat.send`呼び出しに含めます。そのため、ユーザーがセッションを開始またはリセットしない限り、再接続やページ更新後も同じ保存済み会話が継続されます。
- Control UIは、新しい`chat.send`実行IDを生成する前に、同じセッション、メッセージ、添付ファイルに対する重複した送信中リクエストをまとめます。Gateway側でも、同じべき等性キーを再利用する繰り返しリクエストは重複排除されます。
- `chat.history`は表示用にも正規化されます: ランタイム専用のOpenClawコンテキスト、
  受信エンベロープラッパー、`[[reply_to_*]]`や`[[audio_as_voice]]`などのインライン配信ディレクティブタグ、プレーンテキストのツール呼び出しXML
  ペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
  `<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、漏洩したASCII/全角のモデル制御トークンは表示テキストから除去され、
  表示テキスト全体が正確なサイレントトークン`NO_REPLY` / `no_reply`のみであるassistantエントリは省略されます。
- reasoningフラグ付きの返信ペイロード（`isReasoning: true`）は、WebChatのassistantコンテンツ、トランスクリプト再生テキスト、音声コンテンツブロックから除外されるため、思考専用ペイロードが表示可能なassistantメッセージや再生可能な音声として表面化することはありません。
- `chat.transcribeAudio`は、Control UIチャットコンポーザーのサーバー側ディクテーションを支えます。ブラウザーがマイク音声を録音し、base64としてGatewayに送信すると、Gatewayは設定済みの`tools.media.audio`パイプラインを実行します。返されたトランスクリプトは下書きに挿入されます。ユーザーが送信するまでagent実行は開始されません。
- `chat.inject`はassistantメモをトランスクリプトに直接追加し、UIへブロードキャストします（agent実行なし）。
- 中止された実行では、部分的なassistant出力がUIに表示されたままになることがあります。
- Gatewayは、バッファ済み出力が存在する場合、中止された部分的なassistantテキストをトランスクリプト履歴に永続化し、それらのエントリに中止メタデータを付けます。
- 履歴は常にGatewayから取得されます（ローカルファイル監視はありません）。
- Gatewayに到達できない場合、WebChatは読み取り専用になります。

## Control UI agentsツールパネル

- Control UIの`/agents` Toolsパネルには2つの別々のビューがあります:
  - **現在利用可能** は`tools.effective(sessionKey=...)`を使用し、core、plugin、チャネル所有のツールを含め、現在の
    セッションが実行時に実際に使用できるものを表示します。
  - **ツール設定** は`tools.catalog`を使用し、プロファイル、オーバーライド、
    カタログセマンティクスに焦点を当てます。
- ランタイム可用性はセッション単位です。同じagentでセッションを切り替えると、
  **現在利用可能** リストが変わることがあります。
- 設定エディターはランタイム可用性を意味しません。有効なアクセスは引き続きポリシーの
  優先順位（`allow`/`deny`、agentごとおよびプロバイダー/チャネルのオーバーライド）に従います。

## リモート使用

- リモートモードは、Gateway WebSocketをSSH/Tailscale経由でトンネルします。
- 別個のWebChatサーバーを実行する必要はありません。

## 設定リファレンス（WebChat）

完全な設定: [設定](/ja-JP/gateway/configuration)

WebChatオプション:

- `gateway.webchat.chatHistoryMaxChars`: `chat.history`レスポンス内のテキストフィールドの最大文字数。トランスクリプトエントリがこの制限を超える場合、Gatewayは長いテキストフィールドを切り詰め、サイズが大きすぎるメッセージをプレースホルダーに置き換えることがあります。クライアントはリクエストごとの`maxChars`を送信して、単一の`chat.history`呼び出しに対してこのデフォルトを上書きすることもできます。

関連するグローバルオプション:

- `gateway.port`、`gateway.bind`: WebSocketのホスト/ポート。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`:
  共有シークレットWebSocket認証。
- `gateway.auth.allowTailscale`: 有効な場合、ブラウザーのControl UIチャットタブはTailscale
  Serve IDヘッダーを使用できます。
- `gateway.auth.mode: "trusted-proxy"`: ID認識型の**非loopback**プロキシソースの背後にあるブラウザークライアント向けのリバースプロキシ認証（[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照）。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`: リモートGatewayターゲット。
- `session.*`: セッションストレージとメインキーのデフォルト。

## 関連

- [Control UI](/ja-JP/web/control-ui)
- [Dashboard](/ja-JP/web/dashboard)
