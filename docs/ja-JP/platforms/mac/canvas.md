---
read_when:
    - macOS Canvas パネルの実装
    - 視覚的ワークスペース向けのエージェント制御の追加
    - WKWebView のキャンバス読み込みのデバッグ
summary: WKWebView + カスタム URL スキーム経由で埋め込まれたエージェント制御の Canvas パネル
title: キャンバス
x-i18n:
    generated_at: "2026-07-05T11:35:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a28ebad43f6135e199f1aa03e45aa92ad309d11348d5a47121b1418442b6fe17
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS アプリは、`WKWebView` を使ってエージェント制御の **Canvas パネル**を埋め込みます。これは HTML/CSS/JS、A2UI、小さなインタラクティブ UI サーフェス向けの軽量なビジュアルワークスペースです。

## Canvas の場所

Canvas の状態は Application Support 配下に保存されます。

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、カスタム URL スキーム `openclaw-canvas://<session>/<path>` 経由でそれらのファイルを提供します。

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

ルートに `index.html` が存在しない場合、アプリは組み込みのスキャフォールドページを表示します。

## パネルの動作

- メニューバー（またはマウスカーソル）の近くに固定される、枠なしでサイズ変更可能なパネル。
- セッションごとにサイズと位置を記憶します。
- ローカルの Canvas ファイルが変更されると自動リロードします。
- 表示される Canvas パネルは一度に 1 つだけです（必要に応じてセッションが切り替わります）。

Canvas は 設定 -> **Canvas を許可** から無効にできます。無効な場合、canvas node コマンドは `CANVAS_DISABLED` を返します。

## エージェント API サーフェス

Canvas は Gateway WebSocket 経由で公開されるため、エージェントはパネルの表示/非表示、パスまたは URL へのナビゲーション、JavaScript の評価、スナップショット画像のキャプチャを実行できます。

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` は、ローカル Canvas パス、`http(s)` URL、`file://` URL を受け付けます。`"/"` を渡すと、ローカルのスキャフォールドまたは `index.html` が表示されます。

## Canvas の A2UI

A2UI は Gateway canvas ホストによってホストされ、Canvas パネル内にレンダリングされます。Gateway が Canvas ホストをアドバタイズすると、macOS アプリは初回オープン時に A2UI ホストページへ自動で移動します。

デフォルトの A2UI ホスト URL: `http://<gateway-host>:18789/__openclaw__/a2ui/`

### A2UI コマンド (v0.8)

Canvas は A2UI v0.8 のサーバーからクライアントへのメッセージを受け付けます: `beginRendering`, `surfaceUpdate`, `dataModelUpdate`, `deleteSurface`。`createSurface` (v0.9) はまだサポートされていません。

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

クイックスモークテスト:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Canvas からエージェント実行をトリガーする

Canvas は `openclaw://agent?...` ディープリンク経由で新しいエージェント実行をトリガーできます。

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

サポートされるクエリパラメーター:

| パラメーター               | 意味                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | 事前入力されるエージェントプロンプト。                |
| `sessionKey`               | 安定したセッション識別子。                            |
| `thinking`                 | 任意の thinking プロファイル。                        |
| `deliver`, `to`, `channel` | 配信先。                                              |
| `timeoutSeconds`           | 任意の実行タイムアウト。                              |
| `key`                      | 信頼済みローカル呼び出し元向けにアプリが生成する安全トークン。 |

有効なキーが提供されていない限り、アプリは確認を求めます。キーなしのリンクでは、承認前にメッセージと URL が表示され、配信ルーティングフィールドは無視されます。キー付きリンクは通常の Gateway 実行パスを使用します。

## セキュリティメモ

- Canvas スキームはディレクトリトラバーサルをブロックします。ファイルはセッションルート配下に存在する必要があります。
- ローカル Canvas コンテンツはカスタムスキームを使用します（ループバックサーバー不要）。
- 外部 `http(s)` URL は、明示的にナビゲートされた場合にのみ許可されます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [WebChat](/ja-JP/web/webchat)
