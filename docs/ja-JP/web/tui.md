---
read_when:
    - TUI の初心者向けウォークスルーが必要な場合
    - TUI の機能、コマンド、ショートカットの完全な一覧が必要です
summary: 'ターミナル UI (TUI): Gateway に接続するか、埋め込みモードでローカルで実行する'
title: TUI
x-i18n:
    generated_at: "2026-05-02T21:10:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
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

Gateway がパスワード認証を使う場合は `--password` を使用します。

### ローカルモード

Gateway なしで TUI を実行します。

```bash
openclaw chat
# or
openclaw tui --local
```

注:

- `openclaw chat` と `openclaw terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、`--password` と組み合わせることはできません。
- ローカルモードは、組み込みのエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- `openclaw` と `openclaw crestodian` もこの TUI シェルを使用し、Crestodian がローカルセットアップと修復チャットのバックエンドになります。

## 表示される内容

- ヘッダー: 接続 URL、現在のエージェント、現在のセッション。
- チャットログ: ユーザーメッセージ、アシスタントの返信、システム通知、ツールカード。
- ステータス行: 接続/実行状態 (接続中、実行中、ストリーミング中、アイドル、エラー)。
- フッター: 接続状態 + エージェント + セッション + モデル + think/fast/verbose/trace/reasoning + トークン数 + 配信。
- 入力: オートコンプリート付きのテキストエディター。

## メンタルモデル: エージェント + セッション

- エージェントは一意のスラッグです (例: `main`、`research`)。Gateway はその一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUI はそれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのエージェントセッションに明示的に切り替えます。
- セッションスコープ:
  - `per-sender` (デフォルト): 各エージェントに複数のセッションがあります。
  - `global`: TUI は常に `global` セッションを使用します (ピッカーが空の場合があります)。
- 現在のエージェント + セッションは常にフッターに表示されます。
- `--session` なしで起動した場合、Gateway モードの TUI は、同じ Gateway、エージェント、セッションスコープで最後に選択されたセッションがまだ存在していれば、そのセッションを再開します。`--session`、`/session`、`/new`、`/reset` を渡した場合は明示的な操作のままです。

## 送信 + 配信

- メッセージは Gateway に送信されます。プロバイダーへの配信はデフォルトでオフです。
- 配信をオンにする:
  - `/deliver on`
  - または設定パネル
  - または `openclaw tui --deliver` で起動

## ピッカー + オーバーレイ

- モデルピッカー: 利用可能なモデルを一覧表示し、セッションのオーバーライドを設定します。
- エージェントピッカー: 別のエージェントを選択します。
- セッションピッカー: 現在のエージェントのセッションのみを表示します。
- 設定: 配信、ツール出力の展開、思考の表示を切り替えます。

## キーボードショートカット

- Enter: メッセージを送信
- Esc: アクティブな実行を中止
- Ctrl+C: 入力をクリア (2 回押すと終了)
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

セッションライフサイクル:

- `/new` または `/reset` (セッションをリセット)
- `/abort` (アクティブな実行を中止)
- `/settings`
- `/exit`

ローカルモードのみ:

- `/auth [provider]` は TUI 内でプロバイダーの認証/ログインフローを開きます。

その他の Gateway スラッシュコマンド (例: `/context`) は Gateway に転送され、システム出力として表示されます。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## ローカルシェルコマンド

- 行の先頭に `!` を付けると、TUI ホストでローカルシェルコマンドを実行します。
- TUI はセッションごとに一度、ローカル実行を許可するか確認します。拒否すると、そのセッションでは `!` が無効のままになります。
- コマンドは、TUI の作業ディレクトリで新しい非対話シェルとして実行されます (永続的な `cd`/env はありません)。
- ローカルシェルコマンドは環境で `OPENCLAW_SHELL=tui-local` を受け取ります。
- 単独の `!` は通常のメッセージとして送信されます。先頭の空白ではローカル実行は発動しません。

## ローカル TUI から設定を修復する

現在の設定がすでに検証を通過していて、組み込みエージェントに同じマシン上で設定を検査させ、ドキュメントと比較し、実行中の Gateway に依存せずにドリフトの修復を支援させたい場合は、ローカルモードを使用します。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure` または `openclaw doctor --fix` から始めます。`openclaw chat` は無効な設定のガードをバイパスしません。

典型的なループ:

1. ローカルモードを開始します。

```bash
openclaw chat
```

2. 確認してほしい内容をエージェントに依頼します。例:

```text
Gateway 認証設定をドキュメントと比較し、最小の修正を提案してください。
```

3. 正確な根拠と検証にはローカルシェルコマンドを使用します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` または `openclaw configure` で絞り込んだ変更を適用し、その後 `!openclaw config validate` を再実行します。
5. Doctor が自動移行または修復を推奨する場合は、内容を確認して `!openclaw doctor --fix` を実行します。

ヒント:

- `openclaw.json` を手編集するよりも、`openclaw config set` または `openclaw configure` を優先してください。
- `openclaw docs "<query>"` は同じマシンからライブドキュメントインデックスを検索します。
- 構造化されたスキーマや SecretRef/解決可能性のエラーを確認したい場合は、`openclaw config validate --json` が便利です。

## ツール出力

- ツール呼び出しは引数 + 結果を含むカードとして表示されます。
- Ctrl+O で折りたたみ表示と展開表示を切り替えます。
- ツールの実行中、部分更新は同じカードにストリーミングされます。

## ターミナルカラー

- TUI は、暗いターミナルと明るいターミナルの両方で読みやすさを保つため、アシスタント本文のテキストをターミナルのデフォルト前景色のままにします。
- ターミナルが明るい背景を使用していて自動検出が間違っている場合は、`openclaw tui` を起動する前に `OPENCLAW_THEME=light` を設定します。
- 代わりに元の暗いパレットを強制するには、`OPENCLAW_THEME=dark` を設定します。

## 履歴 + ストリーミング

- 接続時、TUI は最新の履歴 (デフォルト 200 件のメッセージ) を読み込みます。
- ストリーミング応答は、確定するまでその場で更新されます。
- TUI は、よりリッチなツールカードのためにエージェントツールイベントもリッスンします。

## 接続の詳細

- TUI は `mode: "tui"` として Gateway に登録します。
- 再接続はシステムメッセージとして表示され、イベントの欠落はログに表示されます。

## オプション

- `--local`: ローカルの組み込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL (デフォルトは設定または `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway トークン (必要な場合)
- `--password <password>`: Gateway パスワード (必要な場合)
- `--session <key>`: セッションキー (デフォルト: `main`、スコープがグローバルの場合は `global`)
- `--deliver`: アシスタントの返信をプロバイダーに配信 (デフォルトはオフ)
- `--thinking <level>`: 送信時の思考レベルをオーバーライド
- `--message <text>`: 接続後に初期メッセージを送信
- `--timeout-ms <ms>`: エージェントのタイムアウト (ミリ秒、デフォルトは `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 読み込む履歴エントリ数 (デフォルト `200`)

<Warning>
`--url` を設定した場合、TUI は設定や環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。ローカルモードでは、`--url`、`--token`、`--password` を渡さないでください。
</Warning>

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUI で `/status` を実行し、Gateway が接続済みでアイドル/ビジー状態であることを確認します。
- Gateway ログを確認します: `openclaw logs --follow`。
- エージェントが実行できることを確認します: `openclaw status` と `openclaw models status`。
- チャットチャネルでメッセージを期待している場合は、配信を有効にします (`/deliver on` または `--deliver`)。

## 接続のトラブルシューティング

- `disconnected`: Gateway が実行中で、`--url/--token/--password` が正しいことを確認してください。
- ピッカーにエージェントがない: `openclaw agents list` とルーティング設定を確認してください。
- セッションピッカーが空: グローバルスコープにいるか、まだセッションがない可能性があります。

## 関連

- [制御 UI](/ja-JP/web/control-ui) — Web ベースの制御インターフェイス
- [設定](/ja-JP/cli/config) — `openclaw.json` の検査、検証、編集
- [Doctor](/ja-JP/cli/doctor) — ガイド付き修復と移行チェック
- [CLI リファレンス](/ja-JP/cli) — 完全な CLI コマンドリファレンス
