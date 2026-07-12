---
read_when:
    - ログ出力または形式の変更
    - CLI または Gateway の出力のデバッグ
summary: ログ出力先、ファイルログ、WSログのスタイル、コンソールの書式設定
title: Gateway のログ記録
x-i18n:
    generated_at: "2026-07-11T22:16:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging)を参照してください。

OpenClawには2つのログ出力先があります。

- **コンソール出力** - ターミナル / デバッグUIに表示される内容です。
- **ファイルログ** - Gatewayロガーによって書き込まれるJSON Linesです。

起動時に、Gatewayは解決済みのデフォルトエージェントモデルと、新しいセッションに影響するモードのデフォルト値をログに記録します。

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking`はデフォルトエージェント、モデルパラメーター、またはグローバルなエージェントのデフォルト値から取得され、未設定の場合は`medium`と表示されます。`fast`はデフォルトエージェントまたはモデルの`fastMode`パラメーターから取得されます。

## ファイルベースのロガー

- デフォルトのローテーションログファイルは`/tmp/openclaw/`配下にあります（1日1ファイル）。ファイル名は`openclaw-YYYY-MM-DD.log`で、Gatewayホストのローカルタイムゾーンに基づく日付が使用されます。そのディレクトリが安全でないか書き込み不能な場合（所有者が不正、全ユーザーが書き込み可能、シンボリックリンク）、OpenClawは代わりにユーザー単位の`os.tmpdir()/openclaw-<uid>`パスへフォールバックします。Windowsでは常にこのOS一時ディレクトリのフォールバックを使用します。
- アクティブなログファイルは`logging.maxFileBytes`（デフォルト: 100 MB）でローテーションされ、番号付きアーカイブを最大5個（`.1`から`.5`）保持し、新しいアクティブファイルへの書き込みを続けます。
- ログファイルのパスとレベルは`~/.openclaw/openclaw.json`の`logging.file`、`logging.level`で設定します。
- ファイル形式は1行につき1つのJSONオブジェクトです。

通話、リアルタイム音声、管理対象ルームのコードパスでは、運用デバッグおよびOTLPログのエクスポートを目的とした、範囲を限定したライフサイクル記録に共有ファイルロガーを使用します。トランスクリプトのテキスト、音声ペイロード、ターンID、通話ID、プロバイダー項目IDがログレコードへコピーされることはありません。

Control UIのログタブは、Gateway（`logs.tail`）経由でこのファイルを追跡します。CLIも同様です。

```bash
openclaw logs --follow
```

### 詳細出力とログレベル

- **ファイルログ**は`logging.level`のみで制御されます。
- `--verbose`は**コンソールの詳細度**（およびWSログ形式）にのみ影響し、ファイルログレベルは引き上げません。
- 詳細出力時のみの情報をファイルログに記録するには、`logging.level`を`debug`または`trace`に設定します。
- トレースログには、Pluginツールファクトリーの準備など、選択されたホットパスの診断用タイミング要約も含まれます。[/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup)を参照してください。

## コンソールのキャプチャ

CLIは`console.log/info/warn/error/debug/trace`をキャプチャし、ファイルログに書き込むと同時に、引き続きstdout/stderrにも出力します。

コンソールの詳細度は個別に調整できます。

- `logging.consoleLevel`（デフォルトは`info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`。TTYではデフォルトが`pretty`、それ以外では`compact`）

## マスキング

OpenClawは、ログまたはトランスクリプトの出力がプロセス外へ送られる前に機密トークンをマスキングします。このマスキングポリシーは、コンソール、ファイルログ、OTLPログレコード、セッショントランスクリプトのテキスト出力先に適用されるため、一致したシークレット値はJSONL行やメッセージがディスクへ書き込まれる前にマスキングされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動的に`gi`を適用）、またはカスタムフラグを指定する`/pattern/flags`を使用します。
  - 一致箇所は先頭6文字と末尾4文字を残してマスキングされます（18文字以上の値）。短い値は`***`になります。
  - デフォルトでは、一般的なキー代入、CLIフラグ、JSONフィールド、Bearerヘッダー、PEMブロック、主要ベンダーのトークンプレフィックス、および決済認証情報のフィールド名（カード番号、CVC/CVV、共有決済トークン、決済認証情報）が対象です。

一部の安全境界では、`logging.redactSensitive`の設定に関係なく常にマスキングされます。対象は、Control UIのツール呼び出しイベント、`sessions_history`ツールの出力、診断サポートのエクスポート、プロバイダーエラーの観測、exec承認コマンドの表示、Gateway WebSocketプロトコルログです。これらの出力先でも追加パターンとして`logging.redactPatterns`が適用されますが、`redactSensitive: "off"`を指定しても未加工のシークレットは出力されません。

## Gateway WebSocketログ

GatewayはWebSocketプロトコルログを2つのモードで出力します。

- **通常モード（`--verbose`なし）**: 「注目すべき」RPC結果のみを出力します。対象は、エラー（`ok=false`）、遅い呼び出し（デフォルトのしきい値: `>= 50ms`）、解析エラーです。
- **詳細モード（`--verbose`）**: すべてのWSリクエスト/レスポンストラフィックを出力します。

### WSログ形式

`openclaw gateway`はGateway単位の形式切り替えをサポートします。

- `--ws-log auto`（デフォルト）: 通常モードは最適化された出力を使用し、詳細モードはコンパクトな出力を使用します。
- `--ws-log compact`: 詳細モードでコンパクトな出力（リクエスト/レスポンスのペア）を使用します。
- `--ws-log full`: 詳細モードでフレームごとの完全な出力を使用します。
- `--compact`: `--ws-log compact`のエイリアスです。

```bash
# 最適化（エラー/低速のみ）
openclaw gateway

# すべてのWSトラフィックを表示（ペア）
openclaw gateway --verbose --ws-log compact

# すべてのWSトラフィックを表示（完全なメタデータ）
openclaw gateway --verbose --ws-log full
```

## コンソールの書式設定（サブシステムロギング）

コンソールフォーマッターは**TTYを認識**し、一貫したプレフィックス付きの行を出力します。サブシステムロガーにより、出力はグループ化され、確認しやすくなります。

- 各行の**サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）。
- **サブシステムの色**（サブシステムごとに固定され、名前からハッシュ化）とレベルごとの色分け。
- 出力先がTTYの場合、または環境が高機能ターミナルのように見える場合（`TERM`/`COLORTERM`/`TERM_PROGRAM`）は**色付きで出力**します。`NO_COLOR`と`FORCE_COLOR`を尊重します。
- **短縮されたサブシステムプレフィックス**: 先頭の`gateway/`、`channels/`、`providers/`セグメントを削除し、残りの末尾最大2セグメントを保持します（例: `channels/turn/kernel`は`turn/kernel`と表示）。既知のチャンネルサブシステム（`telegram`、`whatsapp`、`slack`など）は、常にチャンネル名だけに短縮されます。
- **サブシステム別のサブロガー**（自動プレフィックス + 構造化フィールド`{ subsystem }`）。
- QR/UX出力用の**`logRaw()`**（プレフィックスなし、書式設定なし）。
- **コンソール形式**: `pretty` | `compact` | `json`。
- **コンソールログレベル**はファイルログレベルとは別です（`logging.level`が`debug`/`trace`の場合、ファイルには完全な詳細が保持されます）。
- **WhatsAppのメッセージ本文**は`debug`でログに記録されます（表示するには`--verbose`を使用）。

これにより、ファイルログの安定性を保ちながら、対話型出力を確認しやすくできます。

## 関連項目

- [ロギング](/ja-JP/logging)
- [OpenTelemetryのエクスポート](/ja-JP/gateway/opentelemetry)
- [診断のエクスポート](/ja-JP/gateway/diagnostics)
