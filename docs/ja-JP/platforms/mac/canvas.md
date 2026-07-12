---
read_when:
    - macOS Canvas パネルの実装
    - ビジュアルワークスペース用のエージェントコントロールを追加
    - WKWebView の canvas 読み込みをデバッグする
summary: WKWebView + カスタム URL スキームで埋め込まれたエージェント制御の Canvas パネル
title: キャンバス
x-i18n:
    generated_at: "2026-07-12T14:35:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

macOS アプリには、エージェントが制御する **Canvas パネル**が `WKWebView` を使用して組み込まれています。これは、HTML/CSS/JS、A2UI、および小規模なインタラクティブ UI サーフェス向けの軽量なビジュアルワークスペースです。

## Canvas の保存場所

Canvas の状態は Application Support 配下に保存されます。

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas パネルは、カスタム URL スキーム `openclaw-canvas://<session>/<path>` を介してこれらのファイルを提供します。

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

ルートに `index.html` が存在しない場合、アプリは組み込みのスキャフォールドページを表示します。

## パネルの動作

- メニューバー（またはマウスカーソル）の近くに固定される、枠なしでサイズ変更可能なパネル。
- セッションごとにサイズと位置を記憶。
- ローカルの Canvas ファイルが変更されると自動的に再読み込み。
- 一度に表示される Canvas パネルは 1 つのみ（必要に応じてセッションを切り替え）。

Canvas は Settings -> **Allow Canvas** から無効にできます。無効にすると、Canvas の Node コマンドは `CANVAS_DISABLED` を返します。

## エージェント API サーフェス

Canvas は Gateway WebSocket を介して公開されるため、エージェントはパネルの表示と非表示、パスまたは URL への移動、JavaScript の評価、およびスナップショット画像のキャプチャを行えます。

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` は、ローカルの Canvas パス、`http(s)` URL、および `file://` URL を受け付けます。`"/"` を渡すと、ローカルのスキャフォールドまたは `index.html` が表示されます。

`/__openclaw__/canvas/` および `/__openclaw__/a2ui/` 配下の Gateway ホスト対象は、Node セッションの現在のスコープ付き Canvas URL を介して解決されます。アプリは移動前にこの短期間有効なケイパビリティを更新するため、ケイパビリティ URL を自分で構築またはコピーする必要はありません。

## Canvas 内の A2UI

A2UI は Gateway の Canvas ホストによってホストされ、Canvas パネル内にレンダリングされます。Gateway が Canvas ホストを通知すると、macOS アプリは初回起動時に A2UI ホストページへ自動的に移動します。

通知される URL はケイパビリティでスコープされており、たとえば `http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos` です。安定したリンクではなく、一時的な認証情報として扱ってください。

### A2UI コマンド（v0.8）

Canvas は、A2UI v0.8 のサーバーからクライアントへのメッセージ `beginRendering`、`surfaceUpdate`、`dataModelUpdate`、`deleteSurface` を受け付けます。`createSurface`（v0.9）はまだサポートされていません。

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas（A2UI v0.8）"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"これを読める場合、A2UI プッシュは機能しています。"},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

簡単なスモークテスト：

```bash
openclaw nodes canvas a2ui push --node <id> --text "A2UI からこんにちは"
```

## Canvas からのエージェント実行のトリガー

Canvas は、`openclaw://agent?...` ディープリンクを介して新しいエージェント実行をトリガーできます。

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

サポートされるクエリパラメータ：

| パラメータ                 | 意味                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | 入力済みのエージェントプロンプト。                    |
| `sessionKey`               | 安定したセッション識別子。                            |
| `thinking`                 | 任意の思考プロファイル。                              |
| `deliver`, `to`, `channel` | 配信先。                                              |
| `timeoutSeconds`           | 任意の実行タイムアウト。                              |
| `key`                      | 信頼済みのローカル呼び出し元向けにアプリが生成する安全トークン。 |

有効なキーが指定されていない限り、アプリは確認を求めます。キーなしのリンクでは、承認前にメッセージと URL が表示され、配信ルーティングフィールドは無視されます。キー付きのリンクでは、通常の Gateway 実行パスが使用されます。

## セキュリティに関する注意事項

- Canvas スキームはディレクトリトラバーサルをブロックします。ファイルはセッションルート配下に存在する必要があります。
- ローカルの Canvas コンテンツはカスタムスキームを使用します（ループバックサーバーは不要）。
- 外部の `http(s)` URL は、明示的に移動した場合にのみ許可されます。
- 通常のウェブページはレンダリング専用です。エージェントアクションは、アプリ所有の Canvas スキーム、またはアプリが選択した正確なケイパビリティスコープ付き Gateway A2UI ドキュメントからのみ受け付けられます。サブフレーム、リダイレクト、期限切れのケイパビリティ、および変更されたクエリからはアクションを送信できません。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [WebChat](/ja-JP/web/webchat)
