---
read_when:
    - 初心者にもわかりやすいTUIのチュートリアルが必要です
    - TUIの機能、コマンド、ショートカットの完全な一覧が必要です
summary: ターミナル UI（TUI）：Gateway に接続するか、組み込みモードでローカル実行する
title: TUI
x-i18n:
    generated_at: "2026-07-12T14:56:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
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

3. メッセージを入力して Enter キーを押します。

リモート Gateway：

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gateway がパスワード認証を使用している場合は、`--password` を使用します。

### ローカルモード

Gateway なしで TUI を実行します。

```bash
openclaw chat
# または
openclaw tui --local
```

- `openclaw chat` と `openclaw terminal` は、`openclaw tui --local` のエイリアスです。
- `--local` は、`--url`、`--token`、`--password` と併用できません。
- ローカルモードでは、組み込みのエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- サブコマンドなしの `openclaw` は、対象を自動的に選択します。未設定のインストールでは推論のオンボーディングを実行し、無効な設定の場合は従来の doctor ガイダンスを開き、設定済みの Gateway に到達可能な場合はこの TUI シェルを Gateway モードで開き、それ以外でローカルモデルが設定済みの場合はローカルモードで開きます。

## 表示内容

- ヘッダー：接続 URL、現在のエージェント、現在のセッション。
- チャットログ：ユーザーメッセージ、アシスタントの応答、システム通知、ツールカード。
- ステータス行：接続／実行状態（接続中、実行中、ストリーミング中、アイドル、エラー）。
- フッター：エージェント + セッション + モデル + 目標状態 + think/fast/verbose/trace/reasoning + トークン数 + deliver。`tui.footer.showRemoteHost` が有効な場合、リモート Gateway 接続では接続先ホストも表示されます。
- 入力：オートコンプリート付きテキストエディター。

## メンタルモデル：エージェント + セッション

- エージェントは一意のスラッグです（例：`main`、`research`）。Gateway がその一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUI はこれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのエージェントのセッションへ明示的に切り替わります。
- セッションのスコープ：
  - `per-sender`（デフォルト）：各エージェントに複数のセッションがあります。
  - `global`：TUI は常に `global` セッションを使用します（選択リストが空の場合があります）。
- 現在のエージェントとセッションは、常にフッターに表示されます。
- ローカル以外の URL ベース接続で Gateway ホストを表示するには、次の設定でオプトインします。

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  デフォルトは `false` です。local loopback 接続と埋め込みローカル接続では、ホストラベルは表示されません。

- セッションに[目標](/ja-JP/tools/goal)がある場合、フッターにはその簡略化された状態が表示されます:
  `Pursuing goal`、`Goal paused (/goal resume)`、`Goal blocked (/goal resume)`、または`Goal achieved`。
- `--session`を指定せずに起動した場合、Gateway モードの TUI は、そのセッションがまだ存在していれば、同じ Gateway、エージェント、セッションスコープで最後に選択されたセッションを再開します。`--session`、`/session`、`/new`、または`/reset`の指定は、引き続き明示的な指定として扱われます。

## 送信と配信

- メッセージは常に Gateway（またはローカルモードの組み込みランタイム）に送信されます。アシスタントの応答をチャットプロバイダーへ送り返す処理は、デフォルトで無効になっている別の手順です。
- TUI は WebChat と同様の内部ソースサーフェスであり、汎用の送信チャネルではありません。表示される応答に `tools.message` が必要なハーネスは、送信先を指定しない `message.send` でアクティブな TUI ターンを満たせます。明示的なプロバイダーへの配信には、引き続き通常の設定済みチャネルが使用され、`lastChannel` にフォールバックすることはありません。
- 配信設定は起動時に TUI セッション全体に対して固定されます。有効にするには、`openclaw tui --deliver` で起動します。セッションの途中で切り替えるための `/deliver` スラッシュコマンドや Settings トグルはありません。変更するには TUI を再起動してください。

## ピッカーとオーバーレイ

- モデルピッカー：利用可能なモデルを一覧表示し、セッションのオーバーライドを設定します。
- エージェントピッカー：別のエージェントを選択します。
- セッションピッカー：現在のエージェントについて、過去 7 日以内に更新されたセッションを最大 50 件表示します。既知の古いセッションへ移動するには、`/session <key>` を使用します。
- 設定（`/settings`）：ツール出力の展開と思考の表示を切り替えます。このパネルでは配信を制御できません。

## キーボードショートカット

- Enter：メッセージを送信
- Esc：アクティブな実行を中止
- Ctrl+C：入力をクリア（終了するには 2 回押す）
- Ctrl+D：終了
- Ctrl+L：モデルピッカー
- Ctrl+G：エージェントピッカー
- Ctrl+P：セッションピッカー
- Ctrl+O：ツール出力の展開を切り替え
- Ctrl+T：思考の表示を切り替え（履歴を再読み込み）

## スラッシュコマンド

コア:

- `/help`
- `/status`（Gateway 経由で転送され、セッションとモデルの概要を表示）
- `/gateway-status`（エイリアス: `/gwstatus`。Gateway の接続状態を直接表示）
- `/agent <id>`（または `/agents`）
- `/session <key>`（または `/sessions`）
- `/model <provider/model>`（または `/models`）

セッション制御:

- `/think <off|minimal|low|medium|high>`（モデルによっては、上位の段階に `xhigh`/`max` などのレベルが追加される場合があります）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` はセッションのオーバーライドを解除します）
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（エイリアス: `/elev`）
- `/activation <mention|always>`

セッションのライフサイクル:

- `/new`（新しいキーで、独立した新規セッションを生成します。古いセッション上の他の TUI クライアントには影響しません）
- `/reset`（現在のセッションキーをそのままリセット）
- `/abort`（実行中の処理を中止）
- `/settings`
- `/exit`（または `/quit`）

ローカルモードのみ:

- `/auth [provider]` は、TUI 内でプロバイダーの認証/ログインフローを開きます。

Crestodian:

- `/crestodian [request]` は、通常のエージェント TUI から [Crestodian](#crestodian-setup-and-repair-helper) のセットアップ／修復チャットに戻り、必要に応じて 1 件のリクエストを転送します。

その他の Gateway スラッシュコマンド（例: `/context`）は Gateway に転送され、システム出力として表示されます。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## ローカルシェルコマンド

- 行の先頭に `!` を付けると、TUI ホストでローカルシェルコマンドを実行します。
- TUI はセッションごとに 1 回、ローカル実行を許可するか確認します。拒否すると、そのセッションでは `!` が無効のままになります。
- コマンドは TUI の作業ディレクトリにある新しい非対話型シェルで実行されます（`cd`／環境変数は維持されません）。
- ローカルシェルコマンドの環境には `OPENCLAW_SHELL=tui-local` が渡されます。
- `!` だけの行は通常のメッセージとして送信されます。先頭に空白がある場合、ローカル実行はトリガーされません。

## Crestodian セットアップ／修復ヘルパー

Crestodian はリング 0 のセットアップ／修復アシスタントで、設定済みのデフォルトモデルがライブ推論チェックに合格すると `openclaw crestodian` として利用できます。推論を利用できない場合、対話型の呼び出しは推論のオンボーディングに戻り、自動化は修復ガイダンスとともに失敗します。`openclaw tui --local` と同じローカル TUI シェル内で実行され、Crestodian の型付きかつ承認制の操作のみに制限された AI エージェントによって動作します。

```bash
openclaw crestodian                       # 対話形式で開始
openclaw crestodian -m "status"           # 1 件のリクエストを実行して終了
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # 設定への書き込みを適用
```

- 永続的な設定への書き込みには承認が必要です。対話形式で確認するか、`--yes` を渡してください。
- `--json` はチャットを開始する代わりに、起動時の概要を JSON として出力します。
- Crestodian 内から `open-tui` をリクエストすると（たとえば通常のエージェントとの対話を依頼すると）、Crestodian を終了して通常のエージェント TUI を開きます。そこから戻るには `/crestodian` を使用してください。

現在の設定がすでに検証を通過しており、同じマシン上で組み込みエージェントに設定を調査させ、ドキュメントと比較し、実行中の Gateway に依存せずに設定のずれを修復したい場合は、ローカルモードを使用してください。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure` または `openclaw doctor --fix` から始めてください。`openclaw chat` の起動にも読み込み可能な設定が必要です。

一般的な手順:

1. ローカルモードを開始します。

```bash
openclaw chat
```

2. 確認してほしい内容をエージェントに依頼します。例:

```text
Gateway の認証設定をドキュメントと比較し、最小限の修正を提案してください。
```

3. 正確な証拠の取得と検証には、ローカルシェルコマンドを使用します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` または `openclaw configure` で限定的な変更を適用し、`!openclaw config validate` を再実行します。
5. Doctor が自動移行または修復を推奨した場合は、その内容を確認して `!openclaw doctor --fix` を実行します。

ヒント:

- `openclaw.json` を手動編集するより、`openclaw config set` または `openclaw configure` を優先してください。
- `openclaw docs "<query>"` は、同じマシンから最新のドキュメントインデックスを検索します。
- 構造化されたスキーマエラーや SecretRef／解決可能性エラーが必要な場合は、`openclaw config validate --json` が役立ちます。

## ツール出力

- ツール呼び出しは、引数と結果を含むカードとして表示されます。
- Ctrl+O で折りたたみ表示と展開表示を切り替えます。
- ツールの実行中、途中経過は同じカードにストリーミング表示されます。

## ターミナルの色

- TUI はアシスタントの本文テキストにターミナルのデフォルトの前景色を使用するため、暗いターミナルでも明るいターミナルでも読みやすさが保たれます。
- ターミナルの背景が明るく、自動検出が正しくない場合は、`openclaw tui` を起動する前に `OPENCLAW_THEME=light` を設定してください。
- 元のダークパレットを強制するには、代わりに `OPENCLAW_THEME=dark` を設定してください。

## 履歴とストリーミング

- 接続時、TUI は最新の履歴を読み込みます（デフォルトは 200 件のメッセージ）。
- ストリーミング応答は、確定するまでその場で更新されます。
- TUI は、より詳細なツールカードを表示するために、エージェントのツールイベントも監視します。

## 接続の詳細

- TUI は、大まかな `ui` クライアントモード（Control UI および WebChat が Gateway ポリシーに使用するものと同じモード）で、クライアント ID `openclaw-tui` を使用して接続します。
- 再接続時にはシステムメッセージが表示され、イベントの欠落はログに示されます。

## オプション

- `--local`: ローカルの組み込みエージェントランタイムに対して実行
- `--url <url>`: Gateway WebSocket URL（デフォルトは設定の `gateway.remote.url`、またはループバック上の `ws://127.0.0.1:<port>`）
- `--token <token>`: Gateway トークン（必要な場合）
- `--password <password>`: Gateway パスワード（必要な場合）
- `--tls-fingerprint <sha256>`: 証明書が固定された `wss://` Gateway に期待される TLS 証明書フィンガープリント
- `--session <key>`: セッションキー（デフォルトは `main`、スコープがグローバルの場合は `global`）
- `--deliver`: アシスタントの応答をプロバイダーに配信（デフォルトはオフ）
- `--thinking <level>`: 送信時の思考レベルを上書き
- `--message <text>`: 接続後に最初のメッセージを送信
- `--timeout-ms <ms>`: エージェントのタイムアウト（ミリ秒、デフォルトは `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`: 読み込む履歴エントリ数（デフォルトは `200`）

<Warning>
`--url` を設定すると、TUI は設定または環境の認証情報にフォールバックしません。`--token` または `--password` を明示的に渡し、対象が固定証明書を使用している場合は `--tls-fingerprint` も渡してください。明示的な認証情報がない場合はエラーになります。ローカルモードでは、`--url`、`--token`、`--password`、`--tls-fingerprint` を渡さないでください。
</Warning>

## トラブルシューティング

メッセージを送信しても出力がない場合:

- TUI で `/status` を実行し、Gateway が接続済みで、アイドル状態またはビジー状態であることを確認します。
- Gateway のログを確認します: `openclaw logs --follow`。
- エージェントを実行できることを確認します: `openclaw status` および `openclaw models status`。
- チャットチャネルにメッセージが届くことを期待している場合は、TUI が `--deliver` を指定して起動されたことを確認します（再起動せずに後から有効にすることはできません）。

## 接続のトラブルシューティング

- `disconnected`: Gateway が実行中であり、`--url/--token/--password` が正しいことを確認してください。
- ピッカーにエージェントが表示されない: `openclaw agents list` とルーティング設定を確認してください。
- セッションピッカーが空: グローバルスコープを使用しているか、まだセッションが存在しない可能性があります。

## 関連項目

- [Control UI](/ja-JP/web/control-ui) — Web ベースの制御インターフェース
- [設定](/ja-JP/cli/config) — `openclaw.json` の調査、検証、編集
- [Doctor](/ja-JP/cli/doctor) — ガイド付きの修復および移行チェック
- [CLI リファレンス](/ja-JP/cli) — CLI コマンドの完全なリファレンス
