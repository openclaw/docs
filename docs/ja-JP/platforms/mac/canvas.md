---
read_when:
    - macOS Canvas パネルを実装している場合
    - 視覚的 workspace 向けのエージェント制御を追加している場合
    - WKWebView canvas の読み込みをデバッグしている場合
summary: WKWebView + カスタム URL スキーム経由で埋め込まれた、エージェント制御の Canvas パネル
title: Canvas
x-i18n:
    generated_at: "2026-04-24T05:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

macOS アプリは、`WKWebView` を使ってエージェント制御の **Canvas パネル** を埋め込みます。これは HTML / CSS / JS、A2UI、および小規模なインタラクティブ UI 面のための軽量な視覚的 workspace です。

## Canvas の保存場所

Canvas の state は Application Support 配下に保存されます:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、**カスタム URL スキーム** を通じてそれらのファイルを配信します:

- `openclaw-canvas://<session>/<path>`

例:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

ルートに `index.html` が存在しない場合、アプリは **組み込み scaffold ページ** を表示します。

## パネルの動作

- メニューバー（またはマウスカーソル）付近に固定される、ボーダーなしでサイズ変更可能なパネル。
- セッションごとにサイズ / 位置を記憶する。
- ローカル Canvas ファイルが変更されると自動リロードする。
- 同時に表示される Canvas パネルは 1 つだけ（必要に応じてセッションを切り替える）。

Canvas は Settings → **Allow Canvas** から無効にできます。無効時は、canvas
node コマンドは `CANVAS_DISABLED` を返します。

## エージェント API surface

Canvas は **Gateway WebSocket** 経由で公開されるため、エージェントは次を実行できます:

- パネルの表示 / 非表示
- パスまたは URL への移動
- JavaScript の評価
- スナップショット画像の取得

CLI 例:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注記:

- `canvas.navigate` は **ローカル Canvas パス**、`http(s)` URL、`file://` URL を受け付けます。
- `"/"` を渡すと、Canvas はローカル scaffold または `index.html` を表示します。

## Canvas 内の A2UI

A2UI は Gateway canvas host によってホストされ、Canvas パネル内で描画されます。
Gateway が Canvas host を通知している場合、macOS アプリは初回オープン時に
A2UI host ページへ自動的に移動します。

デフォルトの A2UI host URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI コマンド（v0.8）

Canvas は現在、**A2UI v0.8** の server→client メッセージを受け付けます:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface`（v0.9）はサポートされていません。

CLI 例:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

クイックスモーク:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas からエージェント実行をトリガーする

Canvas は deep link を通じて新しいエージェント実行をトリガーできます:

- `openclaw://agent?...`

例（JS 内）:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

有効なキーが指定されていない限り、アプリは確認を求めます。

## セキュリティに関する注記

- Canvas スキームはディレクトリトラバーサルをブロックします。ファイルはセッションルート配下に存在する必要があります。
- ローカル Canvas コンテンツはカスタムスキームを使います（loopback サーバー不要）。
- 外部 `http(s)` URL は、明示的に移動した場合にのみ許可されます。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [WebChat](/ja-JP/web/webchat)
