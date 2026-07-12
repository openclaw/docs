---
read_when:
    - スマートフォンから、実際にログイン済みの Chrome をエージェントに操作させたい場合
    - デスクに誰もいない状態で、Chrome の「Allow remote debugging?」プロンプトが繰り返し表示される
    - 拡張機能を介したブラウザ乗っ取りのセキュリティモデルを理解したい場合
summary: Chrome 拡張機能：リモートデバッグの確認なしで、OpenClaw にログイン済みの Chrome を操作させる
title: Chrome 拡張機能
x-i18n:
    generated_at: "2026-07-12T14:55:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 拡張機能

OpenClaw Chrome 拡張機能を使用すると、別の管理対象ブラウザーを起動することなく、Chrome のブロックを伴う「Allow remote debugging?」プロンプトも**表示せずに**、エージェントが**ログイン済みの Chrome タブ**を操作できます。

これは、スマートフォン（Telegram、WhatsApp など）から OpenClaw を操作する場合に重要です。[`user` プロファイル](/ja-JP/tools/browser#profiles-openclaw-user-chrome)は Chrome のリモートデバッグポート経由で接続しますが、外出中には誰もクリックできないデスクトップの同意ダイアログが表示されます。代わりに、この拡張機能は `chrome.debugger` API を使用するため、ページ内に表示されるのは閉じることができる Chrome の「OpenClaw started debugging this browser」バナーだけです。

これは、Anthropic の Claude in Chrome および OpenAI の Codex Chrome 拡張機能で使用されているものと同じ構成です。

## 仕組み

3 つの部分で構成されます。

- **ブラウザー制御サービス**（Gateway または Node ホスト）：`browser` ツールが呼び出す API。
- **拡張機能リレー**（loopback WebSocket）：制御サービスが `127.0.0.1` で起動する小規模なサーバー。OpenClaw に Chrome DevTools Protocol エンドポイントを提供し、拡張機能と通信します。双方がホストローカルのトークンで認証します（後述）。
- **OpenClaw Chrome 拡張機能**（MV3）：`chrome.debugger` でタブに接続し、CDP トラフィックを転送して、**OpenClaw タブグループ**を管理します。

OpenClaw が認識して操作できるのは、**OpenClaw タブグループ**内のタブだけです。このグループが同意の境界になります。タブをグループ内にドラッグすると共有され、グループ外にドラッグする（またはツールバーボタンをクリックする）と、アクセスが即座に取り消されます。

## インストールとペアリング

1. 展開済み拡張機能のパスを表示します。

   ```bash
   openclaw browser extension path
   ```

2. `chrome://extensions` を開き、**Developer mode** を有効にして **Load
   unpacked** をクリックし、表示されたディレクトリを選択します。

3. ペアリング文字列を表示します。

   ```bash
   openclaw browser extension pair
   ```

4. OpenClaw のツールバーアイコンをクリックし、ペアリング文字列をポップアップに貼り付けます。
   拡張機能がリレーに接続すると、バッジが **ON** になります。

ペアリングトークンは、初回使用時に作成され、状態ディレクトリの `credentials/` 配下（モード `0600`）に保存される**ホストローカルのシークレット**です。ブラウザーを実行する各マシン（Gateway ホストおよびすべてのブラウザー Node ホスト）がそれぞれ独自のトークンを持つため、マシン間で認証情報を転送する必要はありません。ローテーションするには、`browser-extension-relay.secret` ファイルを削除して、再度ペアリングします。

## 使用方法

`browser` ツール呼び出しで組み込みの `chrome` プロファイルを選択するか、デフォルトに設定します。

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

- タブを共有する：対象のタブで OpenClaw ツールバーボタンをクリックする（タブが OpenClaw タブグループに参加します）か、任意のタブをグループ内にドラッグします。
- エージェントは新しいタブを開くこともでき、そのタブは自動的にグループ内に配置されます。
- 取り消す：ボタンをもう一度クリックする、タブをグループ外にドラッグする、または Chrome のデバッグバナーを閉じます。エージェントはそのタブへのアクセスを即座に失います。

## リモート／マシン間

Chrome を Gateway ホスト上で実行する必要はありません。次の 3 つのトポロジーを使用できます。

- **同一ホスト**（1 台のマシン上に Gateway と Chrome）：そのマシン上で
  `openclaw browser extension pair` を使用してペアリングします。リレーは loopback 専用です。
- **リモート Gateway への直接接続**（Chrome はノート PC、Gateway は VPS 上で動作し、**ノート PC 上にはほかに何もない**）：Gateway 上で
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com` を実行します。
  `wss://…/browser/extension#<secret>` 文字列が表示されるので、ノート PC に拡張機能を読み込んでペアリングします。拡張機能は `wss://` 経由で **Gateway に直接**接続します。ノート PC 上に OpenClaw のインストール、Node、CLI、または開放された受信ポートは不要です。これはマネージドホスティング向けの経路です。
- **ブラウザー Node ホスト経由**（OpenClaw Node をすでに実行しているマシン上の Chrome）：Node 上で `pair` を実行してローカルでペアリングします。Gateway は、既存の認証済み Node リンク経由でブラウザー操作を Node にプロキシします。

ペアリングシークレットはホストごと（直接接続の場合は Gateway のもの）に割り当てられ、Gateway の `/browser/extension` ルートによって検証されます。直接接続では、ペアリングシークレットと CDP トラフィックを暗号化するため、TLS（`wss://`）経由で Gateway を提供してください。
シークレットはペアリング文字列の URL フラグメント内に保持され、WebSocket ハンドシェイク中にサブプロトコルの認証情報として提示されるため、通常のプロキシアクセスログがリクエスト URL からシークレットを受け取ることはありません。リバースプロキシが標準の `Sec-WebSocket-Protocol` ヘッダーを維持するようにしてください。

## 診断

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

拡張機能のポップアップに **Connected** と表示されるまで、`doctor` は **Chrome 拡張機能リレー**のチェックを失敗として報告します。

## セキュリティモデル

- リレーは loopback のみにバインドされます。WebSocket の双方は派生トークンで認証され、拡張機能側はオリジンが `chrome-extension://` であることを確認されます。
- Gateway への直接ペアリングでは、リクエスト URL 内のリレートークンは受け付けられません。代わりに、同梱の拡張機能が WebSocket サブプロトコルリストにトークンを含めます。
- エージェントが認識して操作できるのは、**OpenClaw タブグループ**内のタブだけです。それ以外のタブは非公開のままです。
- リモートデバッグプロンプトを承認するとログイン済みブラウザー全体が公開される `user`（Chrome MCP）プロファイルと比較して、拡張機能では、ひと目で管理できるタブグループに共有範囲を限定できます。

完全なプロファイルモデル、および管理対象の `openclaw` プロファイルと Chrome MCP の `user` プロファイルについては、[ブラウザー](/ja-JP/tools/browser)も参照してください。
