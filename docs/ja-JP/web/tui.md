---
read_when:
    - TUI の初心者向けウォークスルーが必要です
    - TUI の機能、コマンド、ショートカットの完全な一覧が必要です
summary: 'ターミナルユーザーインターフェイス (TUI): Gateway に接続するか、埋め込みモードでローカル実行する'
title: TUI
x-i18n:
    generated_at: "2026-06-27T13:24:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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

Gateway がパスワード認証を使用している場合は、`--password` を使用します。

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
- ローカルモードは、埋め込みのエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- 設定ファイルに作成済みの設定がある場合、`openclaw` と `openclaw crestodian` もこの TUI シェルを使用し、Crestodian がローカルのセットアップおよび修復チャットバックエンドになります。

## 表示される内容

- ヘッダー: 接続 URL、現在のエージェント、現在のセッション。
- チャットログ: ユーザーメッセージ、アシスタントの返信、システム通知、ツールカード。
- ステータス行: 接続/実行状態 (接続中、実行中、ストリーミング中、アイドル、エラー)。
- フッター: エージェント + セッション + モデル + ゴール状態 + think/fast/verbose/trace/reasoning + トークン数 + 配信。`tui.footer.showRemoteHost` が有効な場合、リモート Gateway 接続では接続先ホストも表示されます。
- 入力: オートコンプリート付きのテキストエディター。

## メンタルモデル: エージェント + セッション

- エージェントは一意のスラッグです (例: `main`、`research`)。Gateway が一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUI はそれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのエージェントセッションへ明示的に切り替わります。
- セッションスコープ:
  - `per-sender` (デフォルト): 各エージェントが多数のセッションを持ちます。
  - `global`: TUI は常に `global` セッションを使用します (ピッカーは空の場合があります)。
- 現在のエージェント + セッションは常にフッターに表示されます。
- ローカルではない URL ベースの接続で Gateway ホストを表示するには、次でオプトインします。

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  ループバック接続と埋め込みローカル接続では、ホストラベルは表示されません。

- セッションに [ゴール](/ja-JP/tools/goal) がある場合、フッターには `Pursuing goal`、`Goal paused (/goal resume)`、`Goal achieved` などのコンパクトな状態が表示されます。
- `--session` なしで開始した場合、gateway モードの TUI は、同じ gateway、エージェント、セッションスコープについて最後に選択されたセッションがまだ存在すれば再開します。`--session`、`/session`、`/new`、`/reset` の指定は引き続き明示的です。

## 送信 + 配信

- メッセージは Gateway に送信されます。プロバイダーへの配信はデフォルトでオフです。
- TUI は WebChat と同様の内部ソースサーフェスであり、汎用のアウトバウンドチャネルではありません。表示される返信に `tools.message` を必要とするハーネスは、ターゲットなしの `message.send` でアクティブな TUI ターンを満たせます。明示的なプロバイダー配信は通常の設定済みチャネルを引き続き使用し、`lastChannel` へフォールバックすることはありません。
- 配信をオンにする:
  - `/deliver on`
  - または設定パネル
  - または `openclaw tui --deliver` で開始

## ピッカー + オーバーレイ

- モデルピッカー: 利用可能なモデルを一覧表示し、セッションのオーバーライドを設定します。
- エージェントピッカー: 別のエージェントを選択します。
- セッションピッカー: 現在のエージェントで過去 7 日以内に更新された最大 50 件のセッションを表示します。古い既知のセッションに移動するには `/session <key>` を使用します。
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
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` はセッションのオーバーライドをクリアします)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (エイリアス: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

セッションライフサイクル:

- `/new` または `/reset` (セッションをリセット)
- `/abort` (アクティブな実行を中止)
- `/settings`
- `/exit`

ローカルモードのみ:

- `/auth [provider]` は、TUI 内でプロバイダーの認証/ログインフローを開きます。

その他の Gateway スラッシュコマンド (例: `/context`) は Gateway に転送され、システム出力として表示されます。[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

## ローカルシェルコマンド

- TUI ホスト上でローカルシェルコマンドを実行するには、行の先頭に `!` を付けます。
- TUI はローカル実行を許可するかどうかをセッションごとに 1 回確認します。拒否すると、そのセッションでは `!` が無効なままになります。
- コマンドは TUI の作業ディレクトリで、新しい非対話型シェルとして実行されます (永続的な `cd`/env はありません)。
- ローカルシェルコマンドは環境で `OPENCLAW_SHELL=tui-local` を受け取ります。
- 単独の `!` は通常のメッセージとして送信されます。先頭のスペースはローカル実行をトリガーしません。

## ローカル TUI から設定を修復する

現在の設定がすでに検証に通っており、埋め込みエージェントに同じマシン上で設定を検査させ、ドキュメントと比較し、実行中の Gateway に依存せずにドリフトの修復を支援させたい場合は、ローカルモードを使用します。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure` または `openclaw doctor --fix` から始めます。`openclaw chat` は無効な設定のガードを迂回しません。

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

4. `openclaw config set` または `openclaw configure` で範囲の狭い変更を適用し、その後 `!openclaw config validate` を再実行します。
5. Doctor が自動マイグレーションまたは修復を推奨する場合は、それを確認して `!openclaw doctor --fix` を実行します。

ヒント:

- `openclaw.json` を手で編集するよりも、`openclaw config set` または `openclaw configure` を優先します。
- `openclaw docs "<query>"` は、同じマシンからライブのドキュメントインデックスを検索します。
- `openclaw config validate --json` は、構造化されたスキーマと SecretRef/解決可能性のエラーが必要な場合に便利です。

## ツール出力

- ツール呼び出しは args + results を含むカードとして表示されます。
- Ctrl+O は折りたたみ/展開ビューを切り替えます。
- ツールの実行中、部分的な更新は同じカードにストリーミングされます。

## ターミナルカラー

- TUI は、暗いターミナルと明るいターミナルの両方で読みやすさを保つため、アシスタント本文のテキストをターミナルのデフォルト前景色のままにします。
- ターミナルが明るい背景を使用していて自動検出が誤っている場合は、`openclaw tui` を起動する前に `OPENCLAW_THEME=light` を設定します。
- 代わりに元のダークパレットを強制するには、`OPENCLAW_THEME=dark` を設定します。

## 履歴 + ストリーミング

- 接続時、TUI は最新の履歴を読み込みます (デフォルトは 200 メッセージ)。
- ストリーミング応答は確定するまでその場で更新されます。
- TUI は、よりリッチなツールカードのためにエージェントのツールイベントもリッスンします。

## 接続の詳細

- TUI は Gateway に `mode: "tui"` として登録します。
- 再接続はシステムメッセージを表示します。イベントの欠落はログに表示されます。

## オプション

- `--local`: ローカルの埋め込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL (デフォルトは設定または `ws://127.0.0.1:<port>`)
- `--token <token>`: Gateway トークン (必要な場合)
- `--password <password>`: Gateway パスワード (必要な場合)
- `--session <key>`: セッションキー (デフォルト: `main`、またはスコープが global の場合は `global`)
- `--deliver`: アシスタントの返信をプロバイダーに配信 (デフォルトはオフ)
- `--thinking <level>`: 送信時の思考レベルをオーバーライド
- `--message <text>`: 接続後に初期メッセージを送信
- `--timeout-ms <ms>`: エージェントのタイムアウト (ミリ秒、デフォルトは `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: 読み込む履歴エントリ数 (デフォルトは `200`)

<Warning>
`--url` を設定すると、TUI は設定または環境の認証情報へフォールバックしません。`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーです。ローカルモードでは、`--url`、`--token`、`--password` を渡さないでください。
</Warning>

## トラブルシューティング

メッセージ送信後に出力がない場合:

- TUI で `/status` を実行し、Gateway が接続済みでアイドル/ビジー状態であることを確認します。
- Gateway ログを確認します: `openclaw logs --follow`。
- エージェントが実行できることを確認します: `openclaw status` と `openclaw models status`。
- チャットチャネルでメッセージを期待している場合は、配信を有効にします (`/deliver on` または `--deliver`)。

## 接続のトラブルシューティング

- `disconnected`: Gateway が実行中で、`--url/--token/--password` が正しいことを確認します。
- ピッカーにエージェントがない: `openclaw agents list` とルーティング設定を確認します。
- セッションピッカーが空: global スコープ内にいるか、まだセッションがない可能性があります。

## 関連

- [Control UI](/ja-JP/web/control-ui) — Web ベースの制御インターフェイス
- [設定](/ja-JP/cli/config) — `openclaw.json` を検査、検証、編集する
- [Doctor](/ja-JP/cli/doctor) — ガイド付きの修復およびマイグレーション確認
- [CLI リファレンス](/ja-JP/cli) — 完全な CLI コマンドリファレンス
