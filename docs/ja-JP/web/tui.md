---
read_when:
    - TUIの初心者向けウォークスルーが欲しい場合
    - TUIの機能、コマンド、ショートカットの完全な一覧が必要な場合
summary: 'ターミナルUI（TUI）: Gatewayへ接続するか、埋め込みモードでローカル実行する'
title: TUI
x-i18n:
    generated_at: "2026-04-23T14:11:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI（ターミナルUI）

## クイックスタート

### Gatewayモード

1. Gatewayを起動します。

```bash
openclaw gateway
```

2. TUIを開きます。

```bash
openclaw tui
```

3. メッセージを入力してEnterを押します。

リモートGateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gatewayがパスワード認証を使っている場合は `--password` を使用してください。

### ローカルモード

GatewayなしでTUIを実行します:

```bash
openclaw chat
# または
openclaw tui --local
```

注意:

- `openclaw chat` と `openclaw terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、`--password` と併用できません。
- ローカルモードは埋め込みエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway専用機能は利用できません。

## 表示されるもの

- ヘッダー: 接続URL、現在のエージェント、現在のセッション。
- チャットログ: ユーザーメッセージ、アシスタント返信、システム通知、ツールカード。
- ステータス行: 接続/実行状態（connecting、running、streaming、idle、error）。
- フッター: 接続状態 + エージェント + セッション + モデル + think/fast/verbose/trace/reasoning + トークン数 + deliver。
- 入力欄: オートコンプリート付きテキストエディター。

## メンタルモデル: エージェント + セッション

- エージェントは一意なスラッグです（例: `main`, `research`）。Gatewayが一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUIはこれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのエージェントセッションへ明示的に切り替えます。
- セッションスコープ:
  - `per-sender`（デフォルト）: 各エージェントは複数のセッションを持ちます。
  - `global`: TUIは常に `global` セッションを使います（ピッカーが空の場合があります）。
- 現在のエージェント + セッションは常にフッターに表示されます。

## 送信 + 配信

- メッセージはGatewayへ送信され、プロバイダーへの配信はデフォルトでオフです。
- 配信を有効にするには:
  - `/deliver on`
  - またはSettingsパネル
  - または `openclaw tui --deliver` で起動

## ピッカー + オーバーレイ

- モデルピッカー: 利用可能なモデルを一覧表示し、セッション上書きを設定します。
- エージェントピッカー: 別のエージェントを選択します。
- セッションピッカー: 現在のエージェントのセッションだけを表示します。
- Settings: deliver、ツール出力展開、thinking表示を切り替えます。

## キーボードショートカット

- Enter: メッセージ送信
- Esc: 実行中のrunを中断
- Ctrl+C: 入力欄をクリア（2回押すと終了）
- Ctrl+D: 終了
- Ctrl+L: モデルピッカー
- Ctrl+G: エージェントピッカー
- Ctrl+P: セッションピッカー
- Ctrl+O: ツール出力展開を切り替え
- Ctrl+T: thinking表示を切り替え（履歴を再読み込み）

## スラッシュコマンド

コア:

- `/help`
- `/status`
- `/agent <id>`（または `/agents`）
- `/session <key>`（または `/sessions`）
- `/model <provider/model>`（または `/models`）

セッション制御:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（エイリアス: `/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

セッションライフサイクル:

- `/new` または `/reset`（セッションをリセット）
- `/abort`（実行中のrunを中断）
- `/settings`
- `/exit`

ローカルモード専用:

- `/auth [provider]` はTUI内でプロバイダー認証/loginフローを開きます。

その他のGatewayスラッシュコマンド（たとえば `/context`）はGatewayへ転送され、システム出力として表示されます。[Slash commands](/ja-JP/tools/slash-commands) を参照してください。

## ローカルシェルコマンド

- 行頭に `!` を付けると、TUIホスト上でローカルシェルコマンドを実行します。
- TUIはセッションごとに一度だけローカル実行の許可を求めます。拒否すると、そのセッションでは `!` が無効のままになります。
- コマンドは、TUIの作業ディレクトリ内で新しい非対話シェルで実行されます（`cd`/env は持続しません）。
- ローカルシェルコマンドは、環境変数として `OPENCLAW_SHELL=tui-local` を受け取ります。
- 単独の `!` は通常のメッセージとして送信されます。先頭にスペースがある場合、ローカルexecは発動しません。

## ローカルTUIからconfigを修復する

現在のconfigがすでに妥当であり、埋め込みエージェントに同じマシン上でそれを確認させ、docsと比較し、実行中のGatewayに依存せずにずれを修復させたい場合はローカルモードを使ってください。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure`
または `openclaw doctor --fix` から始めてください。`openclaw chat` は無効configガードをバイパスしません。

典型的な流れ:

1. ローカルモードを開始:

```bash
openclaw chat
```

2. 確認したい内容をエージェントへ依頼します。たとえば:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 正確な証拠と検証のためにローカルシェルコマンドを使います:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` または `openclaw configure` で狭い変更を適用し、その後 `!openclaw config validate` を再実行します。
5. Doctorが自動移行または修復を勧めた場合は、内容を確認して `!openclaw doctor --fix` を実行してください。

ヒント:

- `openclaw.json` を手で編集するより、`openclaw config set` または `openclaw configure` を優先してください。
- `openclaw docs "<query>"` は、同じマシンからライブdocsインデックスを検索します。
- `openclaw config validate --json` は、構造化されたスキーマエラーおよびSecretRef/解決可能性エラーが欲しいときに便利です。

## ツール出力

- ツール呼び出しは、引数 + 結果を持つカードとして表示されます。
- Ctrl+Oで折りたたみ/展開表示を切り替えます。
- ツール実行中は、部分更新が同じカードへストリーミングされます。

## ターミナルカラー

- TUIはアシスタント本文テキストにターミナルのデフォルト前景色を使うため、暗いターミナルでも明るいターミナルでも読みやすさを保ちます。
- ターミナルが明るい背景なのに自動検出が誤る場合は、`openclaw tui` 起動前に `OPENCLAW_THEME=light` を設定してください。
- 元のダークパレットを強制したい場合は、代わりに `OPENCLAW_THEME=dark` を設定してください。

## 履歴 + ストリーミング

- 接続時に、TUIは最新の履歴を読み込みます（デフォルト200メッセージ）。
- ストリーミング応答は、確定されるまでその場で更新されます。
- TUIは、より豊かなツールカードのためにエージェントツールイベントも監視します。

## 接続の詳細

- TUIは `mode: "tui"` としてGatewayへ登録されます。
- 再接続時はシステムメッセージが表示され、イベント欠落はログ上に示されます。

## オプション

- `--local`: ローカル埋め込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL（デフォルトはconfigまたは `ws://127.0.0.1:<port>`）
- `--token <token>`: Gatewayトークン（必要な場合）
- `--password <password>`: Gatewayパスワード（必要な場合）
- `--session <key>`: セッションキー（デフォルト: `main`、またはスコープがglobalなら `global`）
- `--deliver`: アシスタント返信をプロバイダーへ配信（デフォルトはoff）
- `--thinking <level>`: 送信時のthinkingレベルを上書き
- `--message <text>`: 接続後に最初のメッセージを送信
- `--timeout-ms <ms>`: エージェントタイムアウト（ミリ秒）（デフォルトは `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`: 読み込む履歴件数（デフォルト `200`）

注意: `--url` を設定した場合、TUIはconfigや環境の認証情報へフォールバックしません。
`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。
ローカルモードでは `--url`、`--token`、`--password` を渡さないでください。

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUIで `/status` を実行し、Gatewayが接続済みで idle/busy のどちらかであることを確認してください。
- Gatewayログを確認: `openclaw logs --follow`。
- エージェントが実行可能か確認: `openclaw status` と `openclaw models status`。
- チャットチャンネルにメッセージが出ることを期待している場合は、配信を有効化してください（`/deliver on` または `--deliver`）。

## 接続トラブルシューティング

- `disconnected`: Gatewayが動作しており、`--url/--token/--password` が正しいことを確認してください。
- ピッカーにエージェントがない: `openclaw agents list` とルーティングconfigを確認してください。
- セッションピッカーが空: globalスコープにいるか、まだセッションがない可能性があります。

## 関連

- [Control UI](/ja-JP/web/control-ui) — Webベースの制御インターフェース
- [Config](/ja-JP/cli/config) — `openclaw.json` の確認、検証、編集
- [Doctor](/ja-JP/cli/doctor) — ガイド付き修復と移行チェック
- [CLI Reference](/ja-JP/cli) — 完全なCLIコマンドリファレンス
