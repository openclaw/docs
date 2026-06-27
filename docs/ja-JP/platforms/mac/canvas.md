---
read_when:
    - macOS Canvas パネルの実装
    - ビジュアルワークスペース用のエージェントコントロールの追加
    - WKWebView の canvas 読み込みのデバッグ
summary: WKWebView + カスタム URL スキーム経由で埋め込まれたエージェント制御の Canvas パネル
title: キャンバス
x-i18n:
    generated_at: "2026-05-06T09:07:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

macOS アプリは、`WKWebView` を使用してエージェント制御の **Canvas パネル**を組み込んでいます。これは、HTML/CSS/JS、A2UI、小さなインタラクティブ UI サーフェス向けの軽量なビジュアルワークスペースです。

## Canvas の場所

Canvas の状態は Application Support 配下に保存されます。

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、それらのファイルを **カスタム URL スキーム**経由で提供します。

- `openclaw-canvas://<session>/<path>`

例:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

ルートに `index.html` が存在しない場合、アプリは**組み込みのスキャフォールドページ**を表示します。

## パネルの動作

- メニューバー付近（またはマウスカーソル付近）に固定される、枠なしでサイズ変更可能なパネル。
- セッションごとにサイズと位置を記憶します。
- ローカルの Canvas ファイルが変更されると自動で再読み込みします。
- 一度に表示される Canvas パネルは 1 つだけです（必要に応じてセッションが切り替わります）。

Canvas は設定 → **Canvas を許可**から無効にできます。無効な場合、canvas ノードコマンドは `CANVAS_DISABLED` を返します。

## エージェント API サーフェス

Canvas は **Gateway WebSocket** 経由で公開されるため、エージェントは次のことができます。

- パネルを表示/非表示にする
- パスまたは URL に移動する
- JavaScript を評価する
- スナップショット画像をキャプチャする

CLI の例:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注記:

- `canvas.navigate` は**ローカル Canvas パス**、`http(s)` URL、`file://` URL を受け付けます。
- `"/"` を渡すと、Canvas はローカルのスキャフォールドまたは `index.html` を表示します。

## Canvas 内の A2UI

A2UI は Gateway canvas ホストによってホストされ、Canvas パネル内でレンダリングされます。Gateway が Canvas ホストをアドバタイズしている場合、macOS アプリは初回オープン時に A2UI ホストページへ自動で移動します。

デフォルトの A2UI ホスト URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI コマンド（v0.8）

Canvas は現在、**A2UI v0.8** のサーバー→クライアントメッセージを受け付けます。

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface`（v0.9）はサポートされていません。

CLI の例:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

簡易スモーク:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas からエージェント実行をトリガーする

Canvas はディープリンク経由で新しいエージェント実行をトリガーできます。

- `openclaw://agent?...`

例（JS 内）:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

有効なキーが提供されていない限り、アプリは確認を求めます。

## セキュリティ上の注意

- Canvas スキームはディレクトリトラバーサルをブロックします。ファイルはセッションルート配下に存在する必要があります。
- ローカル Canvas コンテンツはカスタムスキームを使用します（local loopback サーバーは不要です）。
- 外部の `http(s)` URL は、明示的に移動した場合にのみ許可されます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [WebChat](/ja-JP/web/webchat)
