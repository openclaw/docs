---
read_when:
    - TUIの初心者向けチュートリアルを参照したい場合
    - TUI の機能、コマンド、ショートカットの完全な一覧が必要です
summary: ターミナル UI（TUI）：Gateway に接続するか、組み込みモードでローカル実行する
title: TUI
x-i18n:
    generated_at: "2026-07-11T22:47:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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
- `--local` は、`--url`、`--token`、`--password` と組み合わせて使用できません。
- ローカルモードでは、組み込みのエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- サブコマンドなしの `openclaw` は、対象を自動的に選択します。未設定のインストールでは推論のオンボーディングを実行し、無効な設定では従来の Doctor ガイダンスを開き、設定済みの到達可能な Gateway がある場合は Gateway モードでこの TUI シェルを開き、それ以外でローカルモデルが設定されている場合はローカルモードで開きます。

## 表示内容

- ヘッダー：接続 URL、現在のエージェント、現在のセッション。
- チャットログ：ユーザーメッセージ、アシスタントの応答、システム通知、ツールカード。
- ステータス行：接続／実行状態（接続中、実行中、ストリーミング中、アイドル、エラー）。
- フッター：エージェント + セッション + モデル + 目標状態 + 思考／高速／詳細／トレース／推論 + トークン数 + 配信。`tui.footer.showRemoteHost` が有効な場合、リモート Gateway 接続では接続先ホストも表示されます。
- 入力：自動補完付きテキストエディター。

## 基本概念：エージェント + セッション

- エージェントは一意のスラッグです（例：`main`、`research`）。Gateway が一覧を公開します。
- セッションは現在のエージェントに属します。
- セッションキーは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUI はそれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのエージェントのセッションへ明示的に切り替わります。
- セッションスコープ：
  - `per-sender`（既定）：各エージェントが複数のセッションを持ちます。
  - `global`：TUI は常に `global` セッションを使用します（選択画面が空の場合があります）。
- 現在のエージェント + セッションは常にフッターに表示されます。
- ローカル以外の URL ベース接続で Gateway ホストを表示するには、次のようにオプトインします。

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  既定値は `false` です。ループバック接続と組み込みローカル接続では、ホストラベルは表示されません。

- セッションに[目標](/ja-JP/tools/goal)がある場合、フッターにはその簡略状態として、`目標を追求中`、`目標を一時停止中（/goal resume）`、`目標がブロック中（/goal resume）`、または `目標を達成済み` が表示されます。
- `--session` なしで起動した場合、Gateway モードの TUI は、同じ Gateway、エージェント、セッションスコープで最後に選択されたセッションがまだ存在すれば、そのセッションを再開します。`--session`、`/session`、`/new`、`/reset` を指定した場合は、引き続き明示的な指定として扱われます。

## 送信 + 配信

- メッセージは常に Gateway（ローカルモードでは組み込みランタイム）へ送信されます。アシスタントの応答をチャットプロバイダーへ送り返す配信は、既定で無効な別の手順です。
- TUI は WebChat と同様の内部ソース画面であり、汎用の送信チャネルではありません。表示可能な応答に `tools.message` を必要とするハーネスは、送信先なしの `message.send` で現在の TUI ターンを満たせます。明示的なプロバイダー配信では、引き続き通常の設定済みチャネルを使用し、`lastChannel` へフォールバックすることはありません。
- 配信設定は起動時に TUI セッション全体について固定されます。有効にするには、`openclaw tui --deliver` で起動します。セッション中に切り替えるための `/deliver` スラッシュコマンドや設定トグルはありません。変更するには TUI を再起動します。

## 選択画面 + オーバーレイ

- モデル選択画面：利用可能なモデルを一覧表示し、セッションのオーバーライドを設定します。
- エージェント選択画面：別のエージェントを選択します。
- セッション選択画面：過去 7 日以内に更新された現在のエージェントのセッションを最大 50 件表示します。既知の古いセッションへ移動するには、`/session <key>` を使用します。
- 設定（`/settings`）：ツール出力の展開と思考の表示を切り替えます。このパネルでは配信を制御できません。

## キーボードショートカット

- Enter：メッセージを送信
- Esc：実行中の処理を中止
- Ctrl+C：入力をクリア（2 回押すと終了）
- Ctrl+D：終了
- Ctrl+L：モデル選択画面
- Ctrl+G：エージェント選択画面
- Ctrl+P：セッション選択画面
- Ctrl+O：ツール出力の展開を切り替え
- Ctrl+T：思考の表示を切り替え（履歴を再読み込み）

## スラッシュコマンド

コア：

- `/help`
- `/status`（Gateway へ転送され、セッション／モデルの概要を表示）
- `/gateway-status`（エイリアス：`/gwstatus`。Gateway の接続状態を直接表示）
- `/agent <id>`（または `/agents`）
- `/session <key>`（または `/sessions`）
- `/model <provider/model>`（または `/models`）

セッション制御：

- `/think <off|minimal|low|medium|high>`（モデルによっては、上位階層に `xhigh`／`max` などのレベルが追加される場合があります）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`／`inherit`／`clear`／`default` はセッションのオーバーライドを解除）
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（エイリアス：`/elev`）
- `/activation <mention|always>`

セッションのライフサイクル：

- `/new`（新しいキーで分離された新規セッションを作成。古いセッションを使用する他の TUI クライアントには影響しません）
- `/reset`（現在のセッションキーをそのままリセット）
- `/abort`（実行中の処理を中止）
- `/settings`
- `/exit`（または `/quit`）

ローカルモードのみ：

- `/auth [provider]` は、TUI 内でプロバイダーの認証／ログインフローを開きます。

Crestodian：

- `/crestodian [request]` は、通常のエージェント TUI から [Crestodian](#crestodian-setup-and-repair-helper) のセットアップ／修復チャットへ戻り、必要に応じて 1 件のリクエストを転送します。

その他の Gateway スラッシュコマンド（例：`/context`）は Gateway へ転送され、システム出力として表示されます。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

## ローカルシェルコマンド

- TUI ホスト上でローカルシェルコマンドを実行するには、行の先頭に `!` を付けます。
- TUI はセッションごとに一度、ローカル実行を許可するか確認します。拒否すると、そのセッションでは `!` が無効のままになります。
- コマンドは TUI の作業ディレクトリで、新しい非対話型シェル内で実行されます（`cd`／環境変数は保持されません）。
- ローカルシェルコマンドの環境には `OPENCLAW_SHELL=tui-local` が設定されます。
- `!` だけの行は通常のメッセージとして送信されます。先頭に空白がある場合、ローカル実行は開始されません。

## Crestodian セットアップ／修復ヘルパー

Crestodian はリング 0 のセットアップ／修復アシスタントです。設定済みの既定モデルがライブ推論チェックに合格すると、`openclaw crestodian` として利用できます。推論を利用できない場合、対話型の呼び出しは推論のオンボーディングへ戻り、自動化は修復ガイダンスとともに失敗します。`openclaw tui --local` と同じローカル TUI シェル内で動作し、型付けされた承認必須の Crestodian 操作のみに制限された AI エージェントによって実行されます。

```bash
openclaw crestodian                       # 対話形式で開始
openclaw crestodian -m "status"           # 1 件のリクエストを実行して終了
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # 設定の書き込みを適用
```

- 永続的な設定の書き込みには承認が必要です。対話形式で確認するか、`--yes` を指定します。
- `--json` はチャットを開始する代わりに、起動時の概要を JSON として出力します。
- Crestodian 内から `open-tui` リクエストを行うと（たとえば通常のエージェントとの会話を依頼すると）、Crestodian を終了して通常のエージェント TUI を開きます。戻るには、そこで `/crestodian` を使用します。

現在の設定がすでに検証を通過しており、同じマシン上で組み込みエージェントに設定を調査させ、ドキュメントと比較し、実行中の Gateway に依存せずに設定のずれを修復したい場合は、ローカルモードを使用します。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure` または `openclaw doctor --fix` から開始します。`openclaw chat` の起動にも読み込み可能な設定が必要です。

一般的な手順：

1. ローカルモードを起動します。

```bash
openclaw chat
```

2. 確認したい内容をエージェントに依頼します。例：

```text
Gateway の認証設定をドキュメントと比較し、最小限の修正を提案してください。
```

3. 正確な証拠と検証には、ローカルシェルコマンドを使用します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` または `openclaw configure` で範囲を絞った変更を適用し、`!openclaw config validate` を再実行します。
5. Doctor が自動移行または修復を推奨する場合は、その内容を確認して `!openclaw doctor --fix` を実行します。

ヒント：

- `openclaw.json` を手動編集するよりも、`openclaw config set` または `openclaw configure` を優先してください。
- `openclaw docs "<query>"` は、同じマシンからライブドキュメントのインデックスを検索します。
- 構造化されたスキーマエラーや SecretRef／解決可能性のエラーが必要な場合は、`openclaw config validate --json` が便利です。

## ツール出力

- ツール呼び出しは、引数 + 結果を含むカードとして表示されます。
- Ctrl+O で折りたたみ表示と展開表示を切り替えます。
- ツールの実行中は、部分的な更新が同じカードにストリーミングされます。

## ターミナルの色

- TUI はアシスタント本文をターミナルの既定の前景色で表示するため、暗いターミナルでも明るいターミナルでも読みやすさが維持されます。
- ターミナルが明るい背景を使用しており、自動検出が正しくない場合は、`openclaw tui` を起動する前に `OPENCLAW_THEME=light` を設定します。
- 元の暗色パレットを強制するには、代わりに `OPENCLAW_THEME=dark` を設定します。

## 履歴 + ストリーミング

- 接続時に、TUI は最新の履歴を読み込みます（既定は 200 メッセージ）。
- ストリーミング応答は確定するまでその場で更新されます。
- TUI は、より詳細なツールカードを表示するため、エージェントのツールイベントも受信します。

## 接続の詳細

- TUI は、粗粒度の `ui` クライアントモード（Control UI と WebChat が Gateway ポリシーで使用するものと同じモード）で、クライアント ID `openclaw-tui` を使用して接続します。
- 再接続時にはシステムメッセージが表示され、イベントの欠落はログに示されます。

## オプション

- `--local`：ローカルの組み込みエージェントランタイムに対して実行
- `--url <url>`：Gateway WebSocket URL（既定では設定の `gateway.remote.url`、またはループバック上の `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway トークン（必要な場合）
- `--password <password>`：Gateway パスワード（必要な場合）
- `--tls-fingerprint <sha256>`：証明書を固定した `wss://` Gateway で想定される TLS 証明書フィンガープリント
- `--session <key>`：セッションキー（既定：`main`。スコープがグローバルの場合は `global`）
- `--deliver`：アシスタントの応答をプロバイダーへ配信（既定では無効）
- `--thinking <level>`：送信時の思考レベルをオーバーライド
- `--message <text>`：接続後に初期メッセージを送信
- `--timeout-ms <ms>`：エージェントのタイムアウト（ミリ秒。既定は `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：読み込む履歴エントリ数（既定は `200`）

<Warning>
`--url` を設定すると、TUI は設定または環境変数の認証情報へフォールバックしません。`--token` または `--password` を明示的に指定し、接続先で固定証明書を使用している場合は `--tls-fingerprint` も指定してください。明示的な認証情報がない場合はエラーになります。ローカルモードでは、`--url`、`--token`、`--password`、`--tls-fingerprint` を指定しないでください。
</Warning>

## トラブルシューティング

メッセージ送信後に出力がない場合：

- TUI で `/status` を実行し、Gateway が接続済みでアイドル状態または処理中であることを確認します。
- Gateway のログを確認します：`openclaw logs --follow`。
- エージェントを実行できることを確認します：`openclaw status` および `openclaw models status`。
- チャットチャネルにメッセージが表示されることを期待している場合は、TUI が `--deliver` 付きで起動されたことを確認します（再起動せずに後から有効にすることはできません）。

## 接続のトラブルシューティング

- `disconnected`：Gateway が実行中であり、`--url/--token/--password` が正しいことを確認します。
- 選択画面にエージェントが表示されない：`openclaw agents list` とルーティング設定を確認します。
- セッション選択画面が空：グローバルスコープを使用しているか、まだセッションがない可能性があります。

## 関連項目

- [Control UI](/ja-JP/web/control-ui) — Web ベースの制御インターフェース
- [設定](/ja-JP/cli/config) — `openclaw.json` の確認、検証、編集
- [Doctor](/ja-JP/cli/doctor) — ガイド付きの修復と移行チェック
- [CLI リファレンス](/ja-JP/cli) — CLI コマンドの完全なリファレンス
