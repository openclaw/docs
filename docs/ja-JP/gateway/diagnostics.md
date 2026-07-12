---
read_when:
    - バグ報告またはサポートリクエストの準備
    - Gateway のクラッシュ、再起動、メモリ負荷、または過大なペイロードのデバッグ
    - 記録または墨消しされる診断データの確認
summary: バグ報告用に共有可能な Gateway 診断バンドルを作成する
title: 診断情報のエクスポート
x-i18n:
    generated_at: "2026-07-11T22:11:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw は、バグ報告用にローカル診断 `.zip` を作成できます。内容は、サニタイズ済みの Gateway
ステータス、ヘルス情報、ログ、設定構造、最近のペイロードを含まない安定性イベントです。

診断バンドルは、確認が完了するまでシークレットとして扱ってください。ペイロードと認証情報は
設計上秘匿化されますが、バンドルにはローカル Gateway ログとホストレベルのランタイム状態の
概要が含まれます。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

書き込まれた zip のパスを表示します。出力パスを指定するには、次を実行します。

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化する場合:

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

所有者は任意の会話で `/diagnostics [note]` を実行し、コピー＆ペースト可能な単一のサポートレポートとしてローカル
Gateway のエクスポートを要求できます。

1. `/diagnostics` を送信します。必要に応じて短いメモを追加できます（`/diagnostics bad tool choice`）。
2. OpenClaw は事前説明を送信し、`openclaw gateway diagnostics export --json` を実行するための明示的な実行承認を
   1 回求めます。すべてを許可するルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルのパス、マニフェストの概要、
   プライバシーに関する注記、関連するセッション ID を返信します。

グループチャットでも所有者は `/diagnostics` を実行できますが、OpenClaw は
エクスポート結果、承認プロンプト、Codex のセッション／スレッド内訳を
所有者に非公開で送信します。グループには、診断情報が非公開で送信されたことを示す短い通知のみが表示されます。
所有者への非公開ルートが存在しない場合、コマンドは安全側に失敗し、
所有者に DM から実行するよう求めます。

アクティブなセッションがネイティブ OpenAI Codex ハーネスを使用している場合、同じ実行承認で、
OpenClaw が認識している Codex スレッドの OpenAI フィードバックアップロードも承認されます。
このアップロードはローカル Gateway の zip とは別であり、
Codex ハーネスセッションの場合にのみ実行されます。承認プロンプトには、承認すると
Codex フィードバックも送信されることが明記されますが、Codex のセッション ID やスレッド ID は表示されません。
承認後の返信には、OpenAI に送信されたスレッドについて、チャンネル、OpenClaw セッション ID、
Codex スレッド ID、ローカル再開コマンドが一覧表示されます。承認を拒否または無視すると、
エクスポート、Codex フィードバックのアップロード、Codex ID 一覧のすべてがスキップされます。

これにより Codex のデバッグループが短くなります。チャンネルで不適切な動作に気づいたら、
`/diagnostics` を実行し、一度承認してレポートを共有します。その後、自分でスレッドを調査したい場合は、
表示された `codex resume <thread-id>` コマンドをローカルで実行します。
[Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-codex-threads-locally)を参照してください。

## エクスポートに含まれるもの

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、ステータス、ヘルス情報、
  安定性データの機械可読な概要。
- `manifest.json`: エクスポートのメタデータとファイル一覧。
- サニタイズ済みの設定構造と、シークレットではない設定の詳細。
- サニタイズ済みのログ概要と、最近の秘匿化されたログ行。
- ベストエフォート方式の Gateway ステータスおよびヘルス情報のスナップショット。
- `stability/latest.json`: 利用可能な場合、永続化された最新の安定性バンドル。

Gateway が異常な状態でも、エクスポートは有用です。ステータス／ヘルス情報の
リクエストに失敗した場合も、利用可能であればローカルログ、設定構造、最新の安定性バンドルが
収集されます。

## プライバシーモデル

保持されるもの: サブシステム名、プラグイン ID、プロバイダー ID、チャンネル ID、設定済みの
モード、ステータスコード、所要時間、バイト数、キュー状態、メモリ測定値、
サニタイズ済みのログメタデータ、秘匿化された運用メッセージ、設定構造、
シークレットではない機能設定。

省略または秘匿化されるもの: チャット本文、プロンプト、指示、Webhook 本文、ツール
出力、認証情報、API キー、トークン、Cookie、シークレット値、生の
リクエスト／レスポンス本文、アカウント ID、メッセージ ID、生のセッション ID、
ホスト名、ローカルユーザー名。

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロード本文に見える場合、
エクスポートにはメッセージが省略されたことと、そのバイト数のみが保持されます。

## 安定性レコーダー

診断が有効な場合、Gateway は既定で、サイズ制限付きのペイロードを含まない安定性ストリームを
記録します。コンテンツではなく、運用上の事実を取得します。

同じ Heartbeat では、イベントループまたは CPU が飽和しているように見える場合に稼働性もサンプリングし、
イベントループ遅延、イベントループ使用率、CPU コア比率、アクティブ／待機中／キュー内のセッション数、
現在の起動／ランタイムフェーズ（判明している場合）、最近のフェーズ期間、
サイズ制限付きの作業ラベルを含む `diagnostic.liveness.warning` イベントを発行します。
これらが Gateway の `warn` レベルのログ行になるのは、作業が待機中またはキュー内にある場合、
あるいはアクティブな作業が持続的なイベントループ遅延と重なっている場合のみです。それ以外では `debug` で記録されます。
アイドル時の稼働性サンプルも診断イベントとして記録されますが、それ自体で警告に昇格することはありません。

起動フェーズでは、実時間と CPU 時間を含む `diagnostic.phase.completed` イベントが発行されます。
停止した組み込み実行の診断では、最後のブリッジ進捗が終了状態に見える
（たとえば、生のレスポンス項目やレスポンス完了イベント）ものの、Gateway が引き続き
組み込み実行をアクティブとみなしている場合、`terminalProgressStale=true` と記録されます。

稼働中のレコーダーを調査するには、次を実行します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的な終了、シャットダウンのタイムアウト、または再起動時の起動失敗後に、
永続化された最新のバンドルを調査するには、次を実行します。

```bash
openclaw gateway stability --bundle latest
```

永続化された最新のバンドルから診断 zip を作成するには、次を実行します。

```bash
openclaw gateway stability --bundle latest --export
```

イベントが存在する場合、永続化されたバンドルは `~/.openclaw/logs/stability/` に保存されます。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| フラグ                  | 既定値                                                                        | 説明                                                         |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | 特定の zip パス（またはディレクトリ）に書き込みます。        |
| `--log-lines <count>`   | `5000`                                                                        | 含めるサニタイズ済みログ行の最大数。                         |
| `--log-bytes <bytes>`   | `1000000`                                                                     | 調査するログの最大バイト数。                                 |
| `--url <url>`           | -                                                                             | ステータス／ヘルス情報のスナップショット用 Gateway WebSocket URL。 |
| `--token <token>`       | -                                                                             | ステータス／ヘルス情報のスナップショット用 Gateway トークン。 |
| `--password <password>` | -                                                                             | ステータス／ヘルス情報のスナップショット用 Gateway パスワード。 |
| `--timeout <ms>`        | `3000`                                                                        | ステータス／ヘルス情報のスナップショットのタイムアウト。     |
| `--no-stability-bundle` | オフ                                                                          | 永続化された安定性バンドルの検索をスキップします。           |
| `--json`                | オフ                                                                          | 機械可読なエクスポートメタデータを表示します。               |

## 診断を無効にする

診断は既定で有効です。安定性レコーダーと
診断イベントの収集を無効にするには、次を設定します。

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

診断を無効にするとバグ報告の詳細度は低下しますが、通常の
Gateway ログには影響しません。

重大なメモリ圧迫時のスナップショットは、既定で無効です。通常の診断イベントに加えて
OOM 発生前の安定性スナップショットを取得するには、次を設定します。

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

これは、重大なメモリ圧迫時に追加のファイルシステムスキャンと
スナップショット書き込みを許容できるホストでのみ使用してください。スナップショットが無効でも、
通常のメモリ圧迫イベントには RSS、ヒープ、しきい値、増加に関する情報
（`rss_threshold`、`heap_threshold`、`rss_growth`）が記録されます。

## 関連項目

- [ヘルスチェック](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway プロトコル](/ja-JP/gateway/protocol#rpc-method-families)
- [ログ](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) - 診断情報をコレクターへストリーミングするための別フロー
