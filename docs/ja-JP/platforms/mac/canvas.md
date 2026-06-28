---
read_when:
    - macOS Canvas パネルの実装
    - ビジュアルワークスペース向けのエージェントコントロールの追加
    - WKWebView の canvas 読み込みのデバッグ
summary: Agent制御の Canvas パネルを WKWebView + カスタム URL スキーム経由で埋め込み
title: キャンバス
x-i18n:
    generated_at: "2026-06-28T00:12:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS アプリは、`WKWebView` を使用してエージェントが制御する **Canvas パネル**を埋め込みます。これは HTML/CSS/JS、A2UI、小さなインタラクティブ UI サーフェス向けの軽量なビジュアルワークスペースです。

## Canvas の場所

Canvas の状態は Application Support 配下に保存されます。

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、これらのファイルを **カスタム URL スキーム**経由で提供します。

- `openclaw-canvas://<session>/<path>`

例:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

ルートに `index.html` が存在しない場合、アプリは **組み込みのスキャフォールドページ**を表示します。

## パネルの動作

- メニューバー付近（またはマウスカーソル付近）に固定される、ボーダーレスでサイズ変更可能なパネル。
- セッションごとにサイズと位置を記憶します。
- ローカル Canvas ファイルが変更されると自動的に再読み込みします。
- 表示される Canvas パネルは常に 1 つだけです（必要に応じてセッションが切り替わります）。

Canvas は Settings → **Canvas を許可** から無効化できます。無効化されている場合、canvas ノードコマンドは `CANVAS_DISABLED` を返します。

## エージェント API サーフェス

Canvas は **Gateway WebSocket** 経由で公開されるため、エージェントは次の操作ができます。

- パネルの表示/非表示
- パスまたは URL への移動
- JavaScript の評価
- スナップショット画像の取得

CLI の例:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注:

- `canvas.navigate` は **ローカル Canvas パス**、`http(s)` URL、`file://` URL を受け付けます。
- `"/"` を渡すと、Canvas はローカルのスキャフォールドまたは `index.html` を表示します。

## Canvas 内の A2UI

A2UI は Gateway canvas ホストによってホストされ、Canvas パネル内でレンダリングされます。Gateway が Canvas ホストを通知すると、macOS アプリは初回オープン時に A2UI ホストページへ自動的に移動します。

デフォルトの A2UI ホスト URL:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### A2UI コマンド (v0.8)

Canvas は現在、**A2UI v0.8** のサーバー→クライアントメッセージを受け付けます。

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) はサポートされていません。

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

例 (JS 内):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

サポートされるクエリパラメーター:

- `message`: 事前入力されるエージェントプロンプト。
- `sessionKey`: 安定したセッション識別子。
- `thinking`: 任意の thinking プロファイル。
- `deliver`、`to`、または `channel`: 配信先。
- `timeoutSeconds`: 任意の実行タイムアウト。
- `key`: 信頼されたローカル呼び出し元向けにアプリが生成する安全トークン。

有効なキーが指定されていない限り、アプリは確認を求めます。キーなしのリンクでは承認前にメッセージと URL が表示され、配信ルーティングフィールドは無視されます。キー付きのリンクは通常の Gateway 実行パスを使用します。

## セキュリティ上の注意

- Canvas スキームはディレクトリトラバーサルをブロックします。ファイルはセッションルート配下に存在する必要があります。
- ローカル Canvas コンテンツはカスタムスキームを使用します（ループバックサーバーは不要です）。
- 外部 `http(s)` URL は、明示的に移動した場合にのみ許可されます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [WebChat](/ja-JP/web/webchat)
