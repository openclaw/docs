---
read_when:
    - ログ出力または形式の変更
    - CLI または Gateway の出力をデバッグする
summary: ログ出力サーフェス、ファイルログ、WSログ形式、コンソール書式設定
title: Gateway のログ記録
x-i18n:
    generated_at: "2026-07-12T14:30:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging)を参照してください。

OpenClawには2つのログ出力先があります。

- **コンソール出力** - ターミナル / Debug UIに表示される内容。
- **ファイルログ** - Gatewayロガーによって書き込まれるJSON行。

起動時に、Gatewayは解決済みのデフォルトエージェントモデルと、新しいセッションに影響するモードのデフォルト値をログに記録します。

```text
エージェントモデル: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking`は、デフォルトエージェント、モデルパラメーター、またはグローバルなエージェントのデフォルト値から取得されます。未設定の場合は`medium`と表示されます。`fast`は、デフォルトエージェントまたはモデルの`fastMode`パラメーターから取得されます。

## ファイルベースのロガー

- デフォルトのローテーションログファイルは`/tmp/openclaw/`配下にあります（1日につき1ファイル）。ファイル名は`openclaw-YYYY-MM-DD.log`で、Gatewayホストのローカルタイムゾーンに基づいて日付が付けられます。そのディレクトリが安全でない、または書き込み不可（所有者が不正、誰でも書き込み可能、シンボリックリンク）な場合、OpenClawは代わりにユーザースコープの`os.tmpdir()/openclaw-<uid>`パスへフォールバックします。Windowsでは常にこのOS一時ディレクトリへのフォールバックを使用します。
- アクティブなログファイルは`logging.maxFileBytes`（デフォルト: 100 MB）に達するとローテーションされ、番号付きアーカイブを最大5つ（`.1`から`.5`）保持し、新しいアクティブファイルへの書き込みを継続します。
- `~/.openclaw/openclaw.json`の`logging.file`と`logging.level`で、ログファイルのパスとレベルを設定します。
- ファイル形式は、1行につき1つのJSONオブジェクトです。

Talk、リアルタイム音声、管理対象ルームのコードパスは、運用デバッグおよびOTLPログエクスポート向けの、範囲を限定したライフサイクル記録に共有ファイルロガーを使用します。トランスクリプトテキスト、音声ペイロード、ターンID、通話ID、プロバイダー項目IDがログレコードへコピーされることはありません。

Control UIのLogsタブは、Gateway（`logs.tail`）経由でこのファイルを追尾します。CLIも同じ処理を行います。

```bash
openclaw logs --follow
```

### 詳細出力とログレベルの違い

- **ファイルログ**は`logging.level`によってのみ制御されます。
- `--verbose`が影響するのは**コンソールの詳細度**（およびWSログ形式）のみで、ファイルのログレベルは引き上げません。
- 詳細出力でのみ表示される情報をファイルログに記録するには、`logging.level`を`debug`または`trace`に設定します。
- トレースログには、Pluginツールファクトリーの準備など、選択されたホットパスの診断タイミング概要も含まれます。[/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup)を参照してください。

## コンソールキャプチャ

CLIは`console.log/info/warn/error/debug/trace`をキャプチャしてファイルログに書き込みつつ、引き続きstdout/stderrにも出力します。

コンソールの詳細度は個別に調整できます。

- `logging.consoleLevel`（デフォルトは`info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`。TTYではデフォルトが`pretty`、それ以外では`compact`）

## 秘匿化

OpenClawは、ログまたはトランスクリプトの出力がプロセス外へ送られる前に、機密トークンをマスクします。この秘匿化ポリシーは、コンソール、ファイルログ、OTLPログレコード、セッショントランスクリプトのテキスト出力先に適用されるため、一致したシークレット値はJSONL行やメッセージがディスクへ書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動的に`gi`）を使用するか、カスタムフラグには`/pattern/flags`を使用します。
  - 一致部分は、先頭6文字と末尾4文字を残してマスクされます（18文字以上の値）。短い値は`***`になります。
  - デフォルトでは、一般的なキー代入、CLIフラグ、JSONフィールド、Bearerヘッダー、PEMブロック、主要ベンダーのトークンプレフィックス、決済認証情報のフィールド名（カード番号、CVC/CVV、共有決済トークン、決済認証情報）が対象です。

一部の安全境界では、`logging.redactSensitive`の設定に関係なく常に秘匿化されます。対象は、Control UIのツール呼び出しイベント、`sessions_history`ツールの出力、診断サポートのエクスポート、プロバイダーエラーの観測情報、実行承認コマンドの表示、Gateway WebSocketプロトコルログです。これらの出力先でも追加パターンとして`logging.redactPatterns`が適用されますが、`redactSensitive: "off"`にしても未加工のシークレットは出力されません。

## Gateway WebSocketログ

GatewayはWebSocketプロトコルログを2つのモードで出力します。

- **通常モード（`--verbose`なし）**: 「注目すべき」RPC結果のみを出力します。エラー（`ok=false`）、遅い呼び出し（デフォルトしきい値: `>= 50ms`）、解析エラーが対象です。
- **詳細モード（`--verbose`）**: すべてのWSリクエスト/レスポンストラフィックを出力します。

### WSログ形式

`openclaw gateway`では、Gatewayごとに形式を切り替えられます。

- `--ws-log auto`（デフォルト）: 通常モードでは最適化された出力を使用し、詳細モードではコンパクト出力を使用します。
- `--ws-log compact`: 詳細モードでコンパクト出力（リクエスト/レスポンスのペア）を使用します。
- `--ws-log full`: 詳細モードでフレームごとの完全な出力を使用します。
- `--compact`: `--ws-log compact`のエイリアスです。

```bash
# 最適化（エラー/低速のみ）
openclaw gateway

# すべてのWSトラフィックを表示（ペア形式）
openclaw gateway --verbose --ws-log compact

# すべてのWSトラフィックを表示（完全なメタ情報）
openclaw gateway --verbose --ws-log full
```

## コンソール形式（サブシステムロギング）

コンソールフォーマッターは**TTYを認識**し、一貫したプレフィックス付きの行を出力します。サブシステムロガーによって、出力はグループ化され、確認しやすくなります。

- 各行の**サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）。
- **サブシステムの色**（サブシステムごとに固定され、名前からハッシュ化）とレベル別の色。
- 出力先がTTYの場合、または環境が高機能ターミナルのように見える場合（`TERM`/`COLORTERM`/`TERM_PROGRAM`）に**色を使用**します。`NO_COLOR`と`FORCE_COLOR`が尊重されます。
- **短縮されたサブシステムプレフィックス**: 先頭の`gateway/`、`channels/`、または`providers/`セグメントを削除し、残りの末尾最大2セグメントを保持します（例: `channels/turn/kernel`は`turn/kernel`と表示）。既知のチャンネルサブシステム（`telegram`、`whatsapp`、`slack`など）は、常にチャンネル名だけに短縮されます。
- **サブシステム別のサブロガー**（自動プレフィックス + 構造化フィールド`{ subsystem }`）。
- QR/UX出力には**`logRaw()`**を使用します（プレフィックスなし、形式設定なし）。
- **コンソール形式**: `pretty` | `compact` | `json`。
- **コンソールログレベル**はファイルログレベルとは別です（`logging.level`が`debug`/`trace`の場合、ファイルには完全な詳細が保持されます）。
- **WhatsAppのメッセージ本文**は`debug`でログに記録されます（表示するには`--verbose`を使用）。

これにより、ファイルログの安定性を保ちながら、対話型出力を確認しやすくできます。

## 関連項目

- [ロギング](/ja-JP/logging)
- [OpenTelemetryエクスポート](/ja-JP/gateway/opentelemetry)
- [診断エクスポート](/ja-JP/gateway/diagnostics)
