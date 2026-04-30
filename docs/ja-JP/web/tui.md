---
read_when:
    - TUI の初心者向け手順解説が必要な場合
    - TUI の機能、コマンド、ショートカットの完全な一覧が必要です
summary: 'ターミナル UI (TUI): Gateway に接続するか、組み込みモードでローカルに実行'
title: TUI
x-i18n:
    generated_at: "2026-04-30T05:41:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5caca4b3f4df02ce1226a8ed0d759023464e5b0752b9cd1b7922b20099d58df1
    source_path: web/tui.md
    workflow: 16
---

## クイックスタート

### Gateway モード

1. Gateway を起動します。

```bash
openclaw gateway
```

2. TUI を開きます。

```bash
openclaw tui
```

3. メッセージを入力して Enter を押します。

リモート Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway がパスワード認証を使っている場合は `--password` を使用します。

### ローカルモード

Gateway なしで TUI を実行します。

```bash
openclaw chat
# or
openclaw tui --local
```

注:

- `openclaw chat` と `openclaw terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、または `--password` と組み合わせることはできません。
- ローカルモードでは、組み込みのエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- `openclaw` と `openclaw crestodian` もこの TUI シェルを使用し、Crestodian がローカルセットアップおよび修復チャットバックエンドになります。

## 表示される内容

- ヘッダー: 接続 URL、現在のエージェント、現在のセッション。
- チャットログ: ユーザーメッセージ、アシスタントの返信、システム通知、ツールカード。
- ステータス行: 接続/実行状態 (connecting、running、streaming、idle、error)。
- フッター: 接続状態 + エージェント + セッション + モデル + think/fast/verbose/trace/reasoning + トークン数 + deliver。
- 入力: オートコンプリート付きのテキストエディター。

## メンタルモデル: エージェント + セッション

- エージェントは一意のスラッグです (例: `main`、`research`)。Gateway はその一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUI はそれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのエージェントセッションへ明示的に切り替えます。
- セッションスコープ:
  - `per-sender` (デフォルト): 各エージェントに複数のセッションがあります。
  - `global`: TUI は常に `global` セッションを使用します (ピッカーは空の場合があります)。
- 現在のエージェント + セッションは常にフッターに表示されます。

## 送信 + 配信

- メッセージは Gateway に送信されます。プロバイダーへの配信はデフォルトでオフです。
- 配信をオンにします:
  - `/deliver on`
  - または設定パネル
  - または `openclaw tui --deliver` で起動

## ピッカー + オーバーレイ

- モデルピッカー: 利用可能なモデルを一覧表示し、セッションのオーバーライドを設定します。
- エージェントピッカー: 別のエージェントを選択します。
- セッションピッカー: 現在のエージェントのセッションのみを表示します。
- 設定: deliver、ツール出力の展開、思考の表示を切り替えます。

## キーボードショートカット

- Enter: メッセージを送信
- Esc: アクティブな実行を中止
- Ctrl+C: 入力をクリア (終了するには 2 回押す)
- Ctrl+D: 終了
- Ctrl+L: モデルピッカー
- Ctrl+G: エージェントピッカー
- Ctrl+P: セッションピッカー
- Ctrl+O: ツール出力の展開を切り替え
- Ctrl+T: 思考の表示を切り替え (履歴を再読み込み)

## スラッシュコマンド

コア:

- `/help`
- `/status`
- `/agent <id>` (または `/agents`)
- `/session <key>` (または `/sessions`)
- `/model <provider/model>` (または `/models`)

セッション制御:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (エイリアス: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

セッションのライフサイクル:

- `/new` または `/reset` (セッションをリセット)
- `/abort` (アクティブな実行を中止)
- `/settings`
- `/exit`

ローカルモードのみ:

- `/auth [provider]` は、TUI 内でプロバイダーの認証/ログインフローを開きます。

その他の Gateway スラッシュコマンド (例: `/context`) は Gateway に転送され、システム出力として表示されます。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## ローカルシェルコマンド

- TUI ホストでローカルシェルコマンドを実行するには、行の先頭に `!` を付けます。
- TUI はローカル実行を許可するかセッションごとに一度だけ確認します。拒否すると、そのセッションでは `!` が無効のままになります。
- コマンドは TUI の作業ディレクトリで、新しい非対話型シェルとして実行されます (永続的な `cd`/env はありません)。
- ローカルシェルコマンドの環境には `OPENCLAW_SHELL=tui-local` が渡されます。
- 単独の `!` は通常のメッセージとして送信されます。先頭にスペースがある場合はローカル実行をトリガーしません。

## ローカル TUI から設定を修復する

現在の設定がすでに検証に通っており、実行中の Gateway に依存せず、同じマシン上で組み込みエージェントに設定を検査させ、ドキュメントと比較し、ずれの修復を支援させたい場合は、ローカルモードを使用します。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure` または `openclaw doctor --fix` から開始します。`openclaw chat` は無効な設定のガードを迂回しません。

典型的なループ:

1. ローカルモードを開始します。

```bash
openclaw chat
```

2. 確認したい内容をエージェントに依頼します。例:

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

4. `openclaw config set` または `openclaw configure` で狭い変更を適用し、その後 `!openclaw config validate` を再実行します。
5. Doctor が自動移行または修復を推奨する場合は、それを確認して `!openclaw doctor --fix` を実行します。

ヒント:

- `openclaw.json` を手で編集するより、`openclaw config set` または `openclaw configure` を優先してください。
- `openclaw docs "<query>"` は、同じマシンからライブドキュメントインデックスを検索します。
- `openclaw config validate --json` は、構造化されたスキーマと SecretRef/解決可能性のエラーが必要な場合に便利です。

## ツール出力

- ツール呼び出しは args + results を含むカードとして表示されます。
- Ctrl+O で折りたたみ/展開ビューを切り替えます。
- ツールの実行中、部分更新は同じカードにストリームされます。

## ターミナルカラー

- TUI は、暗いターミナルと明るいターミナルのどちらでも読みやすいように、アシスタント本文のテキストをターミナルのデフォルト前景色のままにします。
- ターミナルが明るい背景を使用していて自動検出が誤っている場合は、`openclaw tui` を起動する前に `OPENCLAW_THEME=light` を設定してください。
- 代わりに元のダークパレットを強制するには、`OPENCLAW_THEME=dark` を設定します。

## 履歴 + ストリーミング

- 接続時、TUI は最新の履歴 (デフォルト 200 件のメッセージ) を読み込みます。
- ストリーミング応答は確定するまでその場で更新されます。
- TUI は、よりリッチなツールカードのためにエージェントツールイベントもリッスンします。

## 接続の詳細

- TUI は Gateway に `mode: "tui"` として登録します。
- 再接続ではシステムメッセージが表示され、イベントの欠落はログに表示されます。

## オプション

- `--local`: ローカルの組み込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL (デフォルトは設定、または `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway トークン (必要な場合)
- `--password <password>`: Gateway パスワード (必要な場合)
- `--session <key>`: セッションキー (デフォルト: `main`、またはスコープが global の場合は `global`)
- `--deliver`: アシスタントの返信をプロバイダーに配信 (デフォルトはオフ)
- `--thinking <level>`: 送信時の思考レベルを上書き
- `--message <text>`: 接続後に初期メッセージを送信
- `--timeout-ms <ms>`: エージェントのタイムアウト (ミリ秒、デフォルトは `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 読み込む履歴エントリ数 (デフォルト `200`)

<Warning>
`--url` を設定すると、TUI は設定や環境認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーになります。ローカルモードでは、`--url`、`--token`、または `--password` を渡さないでください。
</Warning>

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUI で `/status` を実行し、Gateway が接続済みで idle/busy であることを確認します。
- Gateway ログを確認します: `openclaw logs --follow`。
- エージェントが実行できることを確認します: `openclaw status` と `openclaw models status`。
- チャットチャネルにメッセージが表示されることを期待している場合は、配信を有効にします (`/deliver on` または `--deliver`)。

## 接続のトラブルシューティング

- `disconnected`: Gateway が実行中で、`--url/--token/--password` が正しいことを確認してください。
- ピッカーにエージェントがない場合: `openclaw agents list` とルーティング設定を確認してください。
- セッションピッカーが空の場合: global スコープになっているか、まだセッションがない可能性があります。

## 関連

- [Control UI](/ja-JP/web/control-ui) — Web ベースの制御インターフェイス
- [設定](/ja-JP/cli/config) — `openclaw.json` を検査、検証、編集する
- [Doctor](/ja-JP/cli/doctor) — ガイド付きの修復と移行チェック
- [CLI リファレンス](/ja-JP/cli) — 完全な CLI コマンドリファレンス
