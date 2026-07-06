---
read_when:
    - スマートフォンから、実際にサインイン済みの Chrome をエージェントに操作させたい
    - デスクに誰もいないのに、Chrome の「リモート デバッグを許可しますか？」プロンプトに何度も引っかかる
    - ブラウザ拡張機能によるブラウザ乗っ取りのセキュリティモデルを理解したい
summary: 'Chrome 拡張機能: リモートデバッグのプロンプトなしで、OpenClaw がサインイン済みの Chrome を操作できるようにする'
title: Chrome 拡張機能
x-i18n:
    generated_at: "2026-07-06T10:53:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c189e8f5585fb28544190690a2177e247d6f7e213b1e33c0534d74dde2eeae62
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 拡張機能

OpenClaw Chrome 拡張機能を使うと、エージェントは別の管理対象ブラウザーを起動せずに、また Chrome のブロック型の「Allow remote debugging?」プロンプトなしで、**サインイン済みの Chrome
タブ**を制御できます。

これは、スマートフォン (Telegram、WhatsApp など) から OpenClaw を操作するときに重要です。
[`user` プロファイル](/ja-JP/tools/browser#profiles-openclaw-user-chrome) は Chrome のリモートデバッグポート経由で接続しますが、その場合、外出中には誰もクリックできないデスクトップの同意ダイアログが表示されます。拡張機能は代わりに `chrome.debugger` API を使用するため、ページ内に表示される唯一の通知は、閉じることができる Chrome の「OpenClaw started debugging
this browser」バナーです。

これは、Anthropic の Claude in Chrome と OpenAI の Codex Chrome 拡張機能で使われているものと同じ形です。

## 仕組み

3 つの部分で構成されます。

- **ブラウザー制御サービス** (Gateway または node ホスト): `browser`
  ツールが呼び出す API。
- **拡張機能リレー** (local loopback WebSocket): 制御サービスが `127.0.0.1` で起動する小さなサーバー。OpenClaw に Chrome DevTools Protocol エンドポイントを提示し、拡張機能と通信します。双方はホストローカルのトークンで認証します (下記参照)。
- **OpenClaw Chrome 拡張機能** (MV3): `chrome.debugger` でタブに接続し、
  CDP トラフィックを転送し、**OpenClaw タブグループ**を管理します。

OpenClaw は **OpenClaw タブグループ**内にあるタブだけを認識し、制御します。このグループが同意の境界です。タブをドラッグして中に入れると共有され、外に出す (またはツールバーボタンをクリックする) と即座にアクセスを取り消せます。

## インストールとペアリング

1. 展開済み拡張機能のパスを表示します。

   ```bash
   openclaw browser extension path
   ```

2. `chrome://extensions` を開き、**デベロッパー モード**を有効にして、**パッケージ化されていない拡張機能を読み込む**をクリックし、表示されたディレクトリを選択します。

3. ペアリング文字列を表示します。

   ```bash
   openclaw browser extension pair
   ```

4. OpenClaw ツールバーアイコンをクリックし、ペアリング文字列をポップアップに貼り付けます。
   拡張機能がリレーに接続すると、バッジが **ON** になります。

ペアリングトークンは初回使用時に作成され、状態ディレクトリ内の `credentials/` に保存される **ホストローカルのシークレット**です (モード `0600`)。ブラウザーを実行する各マシン (Gateway ホストとすべてのブラウザー node ホスト) がそれぞれ独自のトークンを持つため、認証情報をマシン間で移動する必要はありません。ローテーションするには、`browser-extension-relay.secret` ファイルを削除して、もう一度ペアリングします。

## 使い方

`browser` ツール呼び出しで組み込みの `chrome` プロファイルを選択するか、デフォルトにします。

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

- タブを共有する: そのタブで OpenClaw ツールバーボタンをクリックする (OpenClaw タブグループに参加します) か、任意のタブをグループにドラッグします。
- エージェントは新しいタブも開けます。それらは自動的にグループに入ります。
- 取り消す: ボタンをもう一度クリックする、タブをグループの外へドラッグする、または Chrome のデバッグバナーを閉じます。エージェントはそのタブへのアクセスをただちに失います。

## リモートブラウザー node

拡張機能は、Chrome が Gateway ホストで動作している場合でも、別の [ブラウザー node ホスト](/ja-JP/tools/browser#local-vs-remote-control) で動作している場合でも機能します。リレーは常に loopback のみで、**ブラウザーがあるマシン上**で動作します。

- **同一ホスト** (Gateway + Chrome が 1 台のマシン上): そのマシンでペアリングします。
- **リモート node** (Chrome は node 上、Gateway は別の場所): `openclaw browser extension path` / `pair` を **node 上**で実行し、そこで拡張機能を読み込んでペアリングします。Gateway は、既存の認証済み node リンク経由でブラウザー操作を node にプロキシします。node のローカルリレーが拡張機能を駆動します。
  node に新しいインバウンドポートは開かれません。

ペアリングトークンはホストごとなので、各 node が独自の文字列を表示します。

## 診断

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` は、拡張機能ポップアップに **Connected** と表示されるまで、**Chrome 拡張機能リレー**チェックを失敗として報告します。

## セキュリティモデル

- リレーは loopback のみにバインドされます。WebSocket の双方は派生トークンで認証され、拡張機能側は `chrome-extension://` に対してオリジンチェックされます。
- エージェントが表示および操作できるのは、**OpenClaw タブグループ**内のタブだけです。その他のタブは非公開のままです。
- リモートデバッグプロンプトを承認するとサインイン済みブラウザー全体を公開する `user` (Chrome MCP) プロファイルと比べて、拡張機能は共有範囲を、ひと目で管理できるタブグループに限定します。

関連項目: プロファイルモデル全体、および管理対象の `openclaw` プロファイルと Chrome MCP `user` プロファイルについては、[ブラウザー](/ja-JP/tools/browser) を参照してください。
