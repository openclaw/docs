---
read_when:
    - TUI の初心者向けウォークスルーが必要な場合
    - TUI の機能、コマンド、ショートカットの完全な一覧が必要です
summary: 'ターミナル UI (TUI): Gateway に接続するか、組み込みモードでローカル実行する'
title: TUI
x-i18n:
    generated_at: "2026-05-06T05:23:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
    source_path: web/tui.md
    workflow: 16
---

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

3. メッセージを入力して Enter を押します。

リモートGateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gatewayがパスワード認証を使用している場合は、`--password`を使用します。

### ローカルモード

GatewayなしでTUIを実行します。

```bash
openclaw chat
# or
openclaw tui --local
```

注記:

- `openclaw chat`と`openclaw terminal`は`openclaw tui --local`のエイリアスです。
- `--local`は`--url`、`--token`、`--password`と組み合わせることはできません。
- ローカルモードは埋め込みエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway専用機能は利用できません。
- `openclaw`と`openclaw crestodian`もこのTUIシェルを使用し、Crestodianがローカルセットアップと修復チャットのバックエンドになります。

## 表示される内容

- ヘッダー: 接続URL、現在のエージェント、現在のセッション。
- チャットログ: ユーザーメッセージ、アシスタントの返信、システム通知、ツールカード。
- ステータス行: 接続/実行状態（接続中、実行中、ストリーミング中、アイドル、エラー）。
- フッター: 接続状態 + エージェント + セッション + モデル + think/fast/verbose/trace/reasoning + トークン数 + deliver。
- 入力: オートコンプリート付きテキストエディター。

## メンタルモデル: エージェント + セッション

- エージェントは一意のスラッグです（例: `main`、`research`）。Gatewayが一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは`agent:<agentId>:<sessionKey>`として保存されます。
  - `/session main`と入力すると、TUIはそれを`agent:<currentAgent>:main`に展開します。
  - `/session agent:other:main`と入力すると、そのエージェントセッションに明示的に切り替わります。
- セッションスコープ:
  - `per-sender`（デフォルト）: 各エージェントが複数のセッションを持ちます。
  - `global`: TUIは常に`global`セッションを使用します（ピッカーは空の場合があります）。
- 現在のエージェント + セッションは常にフッターに表示されます。
- `--session`なしで開始した場合、GatewayモードのTUIは、同じGateway、エージェント、セッションスコープについて最後に選択されたセッションがまだ存在するなら再開します。`--session`、`/session`、`/new`、`/reset`を渡す操作は引き続き明示的です。

## 送信 + 配信

- メッセージはGatewayに送信されます。プロバイダーへの配信はデフォルトでオフです。
- 配信をオンにする:
  - `/deliver on`
  - または設定パネル
  - または`openclaw tui --deliver`で開始

## ピッカー + オーバーレイ

- モデルピッカー: 利用可能なモデルを一覧表示し、セッションの上書きを設定します。
- エージェントピッカー: 別のエージェントを選択します。
- セッションピッカー: 過去7日以内に更新された現在のエージェントのセッションを最大50件表示します。古い既知のセッションへ移動するには`/session <key>`を使用します。
- 設定: deliver、ツール出力の展開、思考の表示を切り替えます。

## キーボードショートカット

- Enter: メッセージを送信
- Esc: アクティブな実行を中止
- Ctrl+C: 入力をクリア（2回押すと終了）
- Ctrl+D: 終了
- Ctrl+L: モデルピッカー
- Ctrl+G: エージェントピッカー
- Ctrl+P: セッションピッカー
- Ctrl+O: ツール出力の展開を切り替え
- Ctrl+T: 思考の表示を切り替え（履歴を再読み込み）

## スラッシュコマンド

コア:

- `/help`
- `/status`
- `/agent <id>`（または`/agents`）
- `/session <key>`（または`/sessions`）
- `/model <provider/model>`（または`/models`）

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

- `/new`または`/reset`（セッションをリセット）
- `/abort`（アクティブな実行を中止）
- `/settings`
- `/exit`

ローカルモードのみ:

- `/auth [provider]`はTUI内でプロバイダー認証/ログインフローを開きます。

その他のGatewayスラッシュコマンド（例: `/context`）はGatewayに転送され、システム出力として表示されます。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## ローカルシェルコマンド

- TUIホストでローカルシェルコマンドを実行するには、行の先頭に`!`を付けます。
- TUIはローカル実行を許可するかどうかをセッションごとに1回確認します。拒否すると、そのセッションでは`!`が無効のままになります。
- コマンドは、TUIの作業ディレクトリで新しい非対話型シェルとして実行されます（永続的な`cd`/envはありません）。
- ローカルシェルコマンドは環境内で`OPENCLAW_SHELL=tui-local`を受け取ります。
- 単独の`!`は通常のメッセージとして送信されます。先頭の空白ではローカル実行はトリガーされません。

## ローカルTUIから設定を修復する

現在の設定がすでに検証に通っていて、埋め込みエージェントに同じマシン上でそれを検査させ、ドキュメントと比較させ、実行中のGatewayに依存せずにドリフトの修復を支援させたい場合は、ローカルモードを使用します。

`openclaw config validate`がすでに失敗している場合は、まず`openclaw configure`または`openclaw doctor --fix`から開始します。`openclaw chat`は無効な設定ガードを回避しません。

一般的なループ:

1. ローカルモードを開始します。

```bash
openclaw chat
```

2. 確認したい内容をエージェントに尋ねます。例:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 正確な証拠と検証にはローカルシェルコマンドを使用します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set`または`openclaw configure`で限定的な変更を適用し、その後`!openclaw config validate`を再実行します。
5. Doctorが自動移行または修復を推奨する場合は、それを確認して`!openclaw doctor --fix`を実行します。

ヒント:

- `openclaw.json`を手動編集するよりも、`openclaw config set`または`openclaw configure`を優先します。
- `openclaw docs "<query>"`は同じマシンからライブドキュメントインデックスを検索します。
- `openclaw config validate --json`は、構造化されたスキーマやSecretRef/解決可能性エラーが必要な場合に便利です。

## ツール出力

- ツール呼び出しは、引数 + 結果を含むカードとして表示されます。
- Ctrl+Oは折りたたみ/展開ビューを切り替えます。
- ツールの実行中、部分更新は同じカードにストリーミングされます。

## ターミナルカラー

- TUIは、暗いターミナルと明るいターミナルのどちらでも読みやすいように、アシスタント本文テキストをターミナルのデフォルト前景色のままにします。
- ターミナルが明るい背景を使用していて自動検出が間違っている場合は、`openclaw tui`を起動する前に`OPENCLAW_THEME=light`を設定します。
- 代わりに元のダークパレットを強制するには、`OPENCLAW_THEME=dark`を設定します。

## 履歴 + ストリーミング

- 接続時、TUIは最新の履歴を読み込みます（デフォルトは200件のメッセージ）。
- ストリーミング応答は確定するまでその場で更新されます。
- TUIは、よりリッチなツールカードのためにエージェントツールイベントもリッスンします。

## 接続の詳細

- TUIは`mode: "tui"`としてGatewayに登録します。
- 再接続はシステムメッセージを表示します。イベントの欠落はログに表示されます。

## オプション

- `--local`: ローカルの埋め込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL（デフォルトは設定または`ws://127.0.0.1:<port>`）
- `--token <token>`: Gatewayトークン（必要な場合）
- `--password <password>`: Gatewayパスワード（必要な場合）
- `--session <key>`: セッションキー（デフォルト: `main`、またはスコープがglobalの場合は`global`）
- `--deliver`: アシスタントの返信をプロバイダーに配信（デフォルトはオフ）
- `--thinking <level>`: 送信時の思考レベルを上書き
- `--message <text>`: 接続後に初期メッセージを送信
- `--timeout-ms <ms>`: エージェントタイムアウト（ms単位、デフォルトは`agents.defaults.timeoutSeconds`）
- `--history-limit <n>`: 読み込む履歴エントリ数（デフォルトは`200`）

<Warning>
`--url`を設定すると、TUIは設定または環境認証情報にフォールバックしません。`--token`または`--password`を明示的に渡してください。明示的な認証情報がない場合はエラーになります。ローカルモードでは、`--url`、`--token`、`--password`を渡さないでください。
</Warning>

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUIで`/status`を実行し、Gatewayが接続済みでアイドル/ビジーであることを確認します。
- Gatewayログを確認します: `openclaw logs --follow`。
- エージェントが実行できることを確認します: `openclaw status`と`openclaw models status`。
- チャットチャネルでメッセージを想定している場合は、配信を有効にします（`/deliver on`または`--deliver`）。

## 接続のトラブルシューティング

- `disconnected`: Gatewayが実行中であり、`--url/--token/--password`が正しいことを確認します。
- ピッカーにエージェントがない: `openclaw agents list`とルーティング設定を確認します。
- セッションピッカーが空: globalスコープ内にいるか、まだセッションがない可能性があります。

## 関連

- [Control UI](/ja-JP/web/control-ui) — Webベースの制御インターフェイス
- [Config](/ja-JP/cli/config) — `openclaw.json`を検査、検証、編集する
- [Doctor](/ja-JP/cli/doctor) — ガイド付きの修復と移行チェック
- [CLIリファレンス](/ja-JP/cli) — CLIコマンドの完全なリファレンス
