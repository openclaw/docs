---
read_when:
    - TUI の初心者向けウォークスルーが必要です
    - TUI の機能、コマンド、ショートカットの完全な一覧が必要です
summary: 'ターミナル UI (TUI): Gateway に接続するか、埋め込みモードでローカルに実行する'
title: TUI
x-i18n:
    generated_at: "2026-07-06T10:54:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eec565ebdf91d705074798ef5bad433fd3d8e7c429e6bd0214a3eb3baa39c1f
    source_path: web/tui.md
    workflow: 16
---

## クイックスタート

### Gateway モード

1. Gateway を開始します。

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

Gateway がパスワード認証を使用している場合は、`--password` を使用します。

### ローカルモード

Gateway なしで TUI を実行します。

```bash
openclaw chat
# or
openclaw tui --local
```

- `openclaw chat` と `openclaw terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、`--password` と組み合わせることはできません。
- ローカルモードでは、埋め込みエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- 裸の `openclaw`（サブコマンドなし）はターゲットを自動的に選びます。未設定のインストールではオンボーディングを実行し、無効な設定では [Crestodian](#crestodian-setup-and-repair-helper) を開き、有効な設定では Gateway に到達できる場合は Gateway モードでこの TUI シェルを開き、それ以外の場合はローカルモードで開きます。

## 表示される内容

- ヘッダー: 接続 URL、現在のエージェント、現在のセッション。
- チャットログ: ユーザーメッセージ、アシスタントの返信、システム通知、ツールカード。
- ステータス行: 接続/実行状態（接続中、実行中、ストリーミング中、アイドル、エラー）。
- フッター: エージェント + セッション + モデル + 目標状態 + think/fast/verbose/trace/reasoning + トークン数 + 配信。`tui.footer.showRemoteHost` が有効な場合、リモート Gateway 接続では接続ホストも表示されます。
- 入力: オートコンプリート付きテキストエディター。

## メンタルモデル: エージェント + セッション

- エージェントは一意のスラッグです（例: `main`、`research`）。Gateway が一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUI はそれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのエージェントセッションへ明示的に切り替わります。
- セッションスコープ:
  - `per-sender`（デフォルト）: 各エージェントが複数のセッションを持ちます。
  - `global`: TUI は常に `global` セッションを使用します（ピッカーは空の場合があります）。
- 現在のエージェント + セッションは常にフッターに表示されます。
- 非ローカルの URL ベース接続で Gateway ホストを表示するには、次で有効化します。

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  デフォルトは `false` です。ループバック接続と埋め込みローカル接続では、ホストラベルは表示されません。

- セッションに [目標](/ja-JP/tools/goal) がある場合、フッターにはそのコンパクトな状態が表示されます:
  `Pursuing goal`、`Goal paused (/goal resume)`、`Goal blocked (/goal resume)`、または `Goal achieved`。
- `--session` なしで起動した場合、Gateway モードの TUI は、同じ Gateway、エージェント、セッションスコープについて最後に選択されたセッションがまだ存在していれば再開します。`--session`、`/session`、`/new`、`/reset` を渡す操作は引き続き明示的です。

## 送信 + 配信

- メッセージは常に Gateway（またはローカルモードの埋め込みランタイム）へ送られます。アシスタントの返信をチャットプロバイダーへ戻す配信は、デフォルトで無効な別ステップです。
- TUI は WebChat と同様の内部ソースサーフェスであり、汎用の送信チャネルではありません。表示される返信に `tools.message` を必要とするハーネスは、ターゲットなしの `message.send` でアクティブな TUI ターンを満たせます。明示的なプロバイダー配信は通常の設定済みチャネルを使用し、`lastChannel` へフォールバックすることはありません。
- 配信は TUI セッション全体について起動時に固定されます。有効にするには `openclaw tui --deliver` で開始します。セッション中に切り替える `/deliver` スラッシュコマンドや Settings トグルはありません。変更するには TUI を再起動します。

## ピッカー + オーバーレイ

- モデルピッカー: 利用可能なモデルを一覧表示し、セッションの上書きを設定します。
- エージェントピッカー: 別のエージェントを選びます。
- セッションピッカー: 現在のエージェントについて、過去 7 日以内に更新された最大 50 件のセッションを表示します。古い既知のセッションへ移動するには `/session <key>` を使用します。
- Settings（`/settings`）: ツール出力の展開と思考表示を切り替えます。このパネルは配信を制御しません。

## キーボードショートカット

- Enter: メッセージを送信
- Esc: アクティブな実行を中止
- Ctrl+C: 入力をクリア（終了するには 2 回押す）
- Ctrl+D: 終了
- Ctrl+L: モデルピッカー
- Ctrl+G: エージェントピッカー
- Ctrl+P: セッションピッカー
- Ctrl+O: ツール出力の展開を切り替え
- Ctrl+T: 思考表示を切り替え（履歴を再読み込み）

## スラッシュコマンド

コア:

- `/help`
- `/status`（Gateway に転送されます。セッション/モデルの要約を表示）
- `/gateway-status`（エイリアス `/gwstatus`。Gateway 接続状態を直接表示）
- `/agent <id>`（または `/agents`）
- `/session <key>`（または `/sessions`）
- `/model <provider/model>`（または `/models`）

セッション制御:

- `/think <off|minimal|low|medium|high>`（高い階層では、モデルによって `xhigh`/`max` のようなレベルが追加される場合があります）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` はセッションの上書きをクリアします）
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（エイリアス: `/elev`）
- `/activation <mention|always>`

セッションライフサイクル:

- `/new`（新しいキーの下に新しい分離セッションを生成します。古いセッション上の他の TUI クライアントには影響しません）
- `/reset`（現在のセッションキーをその場でリセットします）
- `/abort`（アクティブな実行を中止します）
- `/settings`
- `/exit`（または `/quit`）

ローカルモードのみ:

- `/auth [provider]` は TUI 内でプロバイダーの認証/ログインフローを開きます。

Crestodian:

- `/crestodian [request]` は通常のエージェント TUI から [Crestodian](#crestodian-setup-and-repair-helper) のセットアップ/修復チャットへ戻り、必要に応じて 1 件のリクエストを転送します。

その他の Gateway スラッシュコマンド（例: `/context`）は Gateway に転送され、システム出力として表示されます。[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

## ローカルシェルコマンド

- TUI ホストでローカルシェルコマンドを実行するには、行の先頭に `!` を付けます。
- TUI はローカル実行を許可するためにセッションごとに一度プロンプトを表示します。拒否すると、そのセッションでは `!` が無効のままになります。
- コマンドは TUI の作業ディレクトリで、新しい非対話シェルとして実行されます（永続的な `cd`/env はありません）。
- ローカルシェルコマンドは環境で `OPENCLAW_SHELL=tui-local` を受け取ります。
- 単独の `!` は通常のメッセージとして送信されます。先頭のスペースはローカル実行をトリガーしません。

## Crestodian セットアップおよび修復ヘルパー

Crestodian はリングゼロのセットアップ/修復アシスタントで、`openclaw crestodian` として公開されています（または裸の `openclaw` が無効な設定を検出したときに自動起動されます）。`openclaw tui --local` と同じローカル TUI シェル内で実行されますが、ライブのモデル+ツールセッションではなく、専用の対話/操作レイヤーに支えられています。

```bash
openclaw crestodian                       # start interactively
openclaw crestodian -m "status"           # run one request and exit
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # apply a config write
```

- 永続的な設定書き込みには承認が必要です。対話的に確認するか、`--yes` を渡します。
- `--json` はチャットを開始する代わりに、起動時の概要を JSON として出力します。
- Crestodian 内から `open-tui` リクエスト（たとえば通常のエージェントと話したいと依頼するなど）を行うと、Crestodian を終了して通常のエージェント TUI を開きます。戻るにはそこで `/crestodian` を使用します。

現在の設定がすでに検証に通っており、同じマシン上の埋め込みエージェントにそれを検査させ、ドキュメントと比較し、実行中の Gateway に依存せずにドリフトの修復を支援させたい場合は、ローカルモードを使用します。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure` または `openclaw doctor --fix` から始めてください。`openclaw chat` も起動するには読み込み可能な設定が必要です。

典型的なループ:

1. ローカルモードを開始します。

```bash
openclaw chat
```

2. チェックしてほしい内容をエージェントに依頼します。例:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 正確な証拠と検証のためにローカルシェルコマンドを使用します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` または `openclaw configure` で狭い変更を適用し、その後 `!openclaw config validate` を再実行します。
5. Doctor が自動移行または修復を推奨した場合は、それを確認して `!openclaw doctor --fix` を実行します。

ヒント:

- `openclaw.json` を手作業で編集するより、`openclaw config set` または `openclaw configure` を優先します。
- `openclaw docs "<query>"` は同じマシンからライブドキュメントインデックスを検索します。
- `openclaw config validate --json` は、構造化されたスキーマや SecretRef/解決可能性エラーが必要な場合に便利です。

## ツール出力

- ツール呼び出しは引数 + 結果付きのカードとして表示されます。
- Ctrl+O は折りたたみ表示と展開表示を切り替えます。
- ツールの実行中、部分更新は同じカードへストリーミングされます。

## ターミナルカラー

- TUI はアシスタント本文テキストを端末のデフォルト前景色のままにするため、暗い端末でも明るい端末でも読みやすさが保たれます。
- 端末が明るい背景を使用していて自動検出が誤っている場合は、`openclaw tui` を起動する前に `OPENCLAW_THEME=light` を設定します。
- 代わりに元の暗いパレットを強制するには、`OPENCLAW_THEME=dark` を設定します。

## 履歴 + ストリーミング

- 接続時、TUI は最新の履歴を読み込みます（デフォルト 200 メッセージ）。
- ストリーミング応答は確定するまでその場で更新されます。
- TUI は、より充実したツールカードのためにエージェントツールイベントもリッスンします。

## 接続の詳細

- TUI は、粗い `ui` クライアントモードの下でクライアント ID `openclaw-tui` を使用して接続します（Control UI と WebChat が Gateway ポリシーに使用するものと同じモードです）。
- 再接続はシステムメッセージを表示します。イベントの欠落はログに表示されます。

## オプション

- `--local`: ローカルの埋め込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL（デフォルトは設定の `gateway.remote.url`、またはループバック上の `ws://127.0.0.1:<port>`）
- `--token <token>`: Gateway トークン（必要な場合）
- `--password <password>`: Gateway パスワード（必要な場合）
- `--session <key>`: セッションキー（デフォルト: `main`、スコープがグローバルの場合は `global`）
- `--deliver`: アシスタントの返信をプロバイダーへ配信（デフォルトはオフ）
- `--thinking <level>`: 送信時の思考レベルを上書き
- `--message <text>`: 接続後に初期メッセージを送信
- `--timeout-ms <ms>`: エージェントのタイムアウト（ミリ秒、デフォルトは `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`: 読み込む履歴エントリ数（デフォルト `200`）

<Warning>
`--url` を設定した場合、TUI は設定や環境の認証情報へフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。ローカルモードでは、`--url`、`--token`、`--password` を渡さないでください。
</Warning>

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUI で `/status` を実行し、Gateway が接続済みでアイドル/ビジー状態であることを確認します。
- Gateway ログを確認します: `openclaw logs --follow`。
- エージェントが実行可能であることを確認します: `openclaw status` と `openclaw models status`。
- チャットチャネルにメッセージが表示されることを期待している場合は、TUI が `--deliver` 付きで起動されたことを確認します（これは再起動なしに後から有効化することはできません）。

## 接続のトラブルシューティング

- `disconnected`: Gateway が実行中で、`--url/--token/--password` が正しいことを確認します。
- ピッカーにエージェントがない場合: `openclaw agents list` とルーティング設定を確認します。
- セッションピッカーが空の場合: グローバルスコープになっているか、まだセッションがない可能性があります。

## 関連

- [Control UI](/ja-JP/web/control-ui) — Web ベースの制御インターフェイス
- [Config](/ja-JP/cli/config) — `openclaw.json` を検査、検証、編集
- [Doctor](/ja-JP/cli/doctor) — ガイド付き修復と移行チェック
- [CLI リファレンス](/ja-JP/cli) — 完全な CLI コマンドリファレンス
