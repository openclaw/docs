---
read_when:
    - スマートフォンから、エージェントに実際にログイン済みのChromeを操作させたい場合
    - 誰もデスクにいないのに、Chrome の「Allow remote debugging?」プロンプトが繰り返し表示される
    - 拡張機能を介したブラウザ制御のセキュリティモデルを理解したい場合
summary: Chrome 拡張機能：リモートデバッグの確認なしで、OpenClaw がログイン済みの Chrome を操作できるようにする
title: Chrome 拡張機能
x-i18n:
    generated_at: "2026-07-11T22:44:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 拡張機能

OpenClaw Chrome 拡張機能を使うと、別の管理対象ブラウザを起動することなく、また Chrome の処理を妨げる「リモート デバッグを許可しますか？」プロンプトも表示せずに、エージェントが**ログイン済みの Chrome タブ**を操作できます。

これは、スマートフォン（Telegram、WhatsApp など）から OpenClaw を操作するときに重要です。[`user` プロファイル](/ja-JP/tools/browser#profiles-openclaw-user-chrome)は Chrome のリモートデバッグポート経由で接続するため、その場を離れていると誰もクリックできないデスクトップの同意ダイアログが表示されます。一方、拡張機能は代わりに `chrome.debugger` API を使用するため、ページ内に表示されるのは、閉じることができる Chrome の「OpenClaw がこのブラウザのデバッグを開始しました」バナーだけです。

これは Anthropic の Claude in Chrome 拡張機能や OpenAI の Codex Chrome 拡張機能と同じ構成です。

## 仕組み

3 つの部分で構成されます。

- **ブラウザ制御サービス**（Gateway または Node ホスト）：`browser` ツールが呼び出す API。
- **拡張機能リレー**（ループバック WebSocket）：制御サービスが `127.0.0.1` で起動する小規模なサーバー。OpenClaw に Chrome DevTools Protocol エンドポイントを提供し、拡張機能と通信します。両側はホストローカルのトークンで認証されます（後述）。
- **OpenClaw Chrome 拡張機能**（MV3）：`chrome.debugger` でタブに接続し、CDP トラフィックを転送して、**OpenClaw タブグループ**を管理します。

OpenClaw が認識して操作できるのは、**OpenClaw タブグループ**内のタブだけです。このグループが同意の境界となります。タブをグループ内にドラッグすると共有され、グループ外にドラッグする（またはツールバーボタンをクリックする）とアクセスが即座に取り消されます。

## インストールとペアリング

1. 展開済み拡張機能のパスを表示します。

   ```bash
   openclaw browser extension path
   ```

2. `chrome://extensions` を開き、**Developer mode** を有効にして **Load unpacked** をクリックし、表示されたディレクトリを選択します。

3. ペアリング文字列を表示します。

   ```bash
   openclaw browser extension pair
   ```

4. OpenClaw のツールバーアイコンをクリックし、ペアリング文字列をポップアップに貼り付けます。拡張機能がリレーに接続すると、バッジが **ON** に変わります。

ペアリングトークンは、初回使用時に作成される**ホストローカルのシークレット**で、状態ディレクトリの `credentials/` 配下に保存されます（モード `0600`）。ブラウザを実行する各マシン（Gateway ホストおよびすべてのブラウザ Node ホスト）はそれぞれ独自のトークンを持つため、認証情報をマシン間で転送する必要はありません。ローテーションするには、`browser-extension-relay.secret` ファイルを削除して、再度ペアリングします。

## 使用方法

`browser` ツールの呼び出しで組み込みの `chrome` プロファイルを選択するか、デフォルトに設定します。

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- タブを共有する：そのタブで OpenClaw のツールバーボタンをクリックする（OpenClaw タブグループに追加されます）か、任意のタブをグループ内にドラッグします。
- エージェントは新しいタブを開くこともできます。そのタブは自動的にグループに追加されます。
- 取り消す：ボタンをもう一度クリックするか、タブをグループ外にドラッグするか、Chrome のデバッグバナーを閉じます。エージェントはそのタブへのアクセスを即座に失います。

## リモート／マシン間

Chrome を Gateway ホスト上で実行する必要はありません。次の 3 つの構成を利用できます。

- **同一ホスト**（1 台のマシン上で Gateway と Chrome を実行）：そのマシン上で `openclaw browser extension pair` を使用してペアリングします。リレーはループバック専用です。
- **リモート Gateway への直接接続**（ノート PC 上で Chrome、VPS 上で Gateway を実行し、**ノート PC 上ではほかに何も実行しない**）：Gateway 上で `openclaw browser extension pair --gateway-url wss://your-gateway.example.com` を実行します。`wss://…/browser/extension#<secret>` 文字列が表示されるので、ノート PC 上で拡張機能を読み込んでペアリングします。拡張機能は `wss://` 経由で **Gateway に直接接続**します。ノート PC 上に OpenClaw、Node、CLI、または外部から接続可能な受信ポートは必要ありません。これはマネージドホスティング向けの経路です。
- **ブラウザ Node ホスト経由**（すでに OpenClaw Node を実行しているマシン上で Chrome を使用）：Node 上で `pair` を実行してローカルでペアリングします。Gateway は既存の認証済み Node リンク経由で、ブラウザ操作を Node にプロキシします。

ペアリングシークレットはホストごと（直接接続の場合は Gateway ごと）に割り当てられ、Gateway の `/browser/extension` ルートで検証されます。直接接続では、ペアリングシークレットと CDP トラフィックが暗号化されるように、TLS（`wss://`）経由で Gateway を提供してください。
シークレットはペアリング文字列の URL フラグメント内に保持され、WebSocket ハンドシェイク時にサブプロトコルの認証情報として提示されるため、通常のプロキシアクセスログではリクエスト URL に記録されません。リバースプロキシが標準の `Sec-WebSocket-Protocol` ヘッダーを保持するようにしてください。

## 診断

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

拡張機能のポップアップに **Connected** と表示されるまで、`doctor` は **Chrome 拡張機能リレー**のチェックを失敗として報告します。

## セキュリティモデル

- リレーはループバックのみにバインドされます。WebSocket の両側は派生トークンで認証され、拡張機能側ではオリジンが `chrome-extension://` であることが確認されます。
- Gateway への直接ペアリングでは、リクエスト URL 内のリレートークンを受け付けません。代わりに、同梱の拡張機能が WebSocket サブプロトコルリストにトークンを含めます。
- エージェントが認識して操作できるのは、**OpenClaw タブグループ**内のタブだけです。それ以外のタブは非公開のままです。
- リモートデバッグのプロンプトを承認するとログイン済みブラウザ全体が公開される `user`（Chrome MCP）プロファイルと比較して、この拡張機能では、共有範囲がひと目で管理できるタブグループ内に限定されます。

完全なプロファイルモデルと、管理対象の `openclaw` プロファイルおよび Chrome MCP の `user` プロファイルについては、[ブラウザ](/ja-JP/tools/browser)も参照してください。
