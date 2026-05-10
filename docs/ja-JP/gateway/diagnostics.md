---
read_when:
    - バグ報告またはサポートリクエストの準備
    - Gateway のクラッシュ、再起動、メモリ負荷、または過大なペイロードのデバッグ
    - 診断データとして記録または秘匿される内容を確認する
summary: バグ報告用に共有可能な Gateway 診断バンドルを作成する
title: 診断情報のエクスポート
x-i18n:
    generated_at: "2026-05-10T19:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw は、バグ報告用のローカル診断 zip を作成できます。これには、サニタイズされた Gateway の状態、ヘルス、ログ、設定形状、最近のペイロードなしの安定性イベントがまとめられます。

診断バンドルは、確認するまではシークレットのように扱ってください。ペイロードや認証情報を省略またはリダクトするように設計されていますが、それでもローカル Gateway ログとホストレベルのランタイム状態が要約されています。

## クイックスタート

```bash
openclaw gateway diagnostics export
```

このコマンドは、書き込まれた zip のパスを出力します。パスを選ぶには次のようにします。

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

自動化の場合:

```bash
openclaw gateway diagnostics export --json
```

## チャットコマンド

所有者はチャットで `/diagnostics [note]` を使い、ローカル Gateway のエクスポートを要求できます。バグが実際の会話で発生し、サポート向けにコピー&ペースト可能なレポートを 1 つ作成したい場合に使用します。

1. 問題に気づいた会話で `/diagnostics` を送信します。役立つ場合は、たとえば `/diagnostics bad tool choice` のように短いメモを追加します。
2. OpenClaw は診断の前文を送信し、明示的な exec 承認を 1 回求めます。この承認により `openclaw gateway diagnostics export --json` が実行されます。allow-all ルールで診断を承認しないでください。
3. 承認後、OpenClaw はローカルバンドルのパス、マニフェスト要約、プライバシーノート、関連するセッション ID を含む貼り付け可能なレポートを返信します。

グループチャットでは、所有者が引き続き `/diagnostics` を実行できますが、OpenClaw は診断の詳細を共有チャットには投稿しません。前文、承認プロンプト、Gateway エクスポート結果、Codex セッション/スレッドの内訳は、非公開の承認経路を通じて所有者に送信されます。グループには、診断フローが非公開で送信されたという短い通知だけが届きます。OpenClaw が所有者への非公開経路を見つけられない場合、コマンドは安全側に失敗し、所有者に DM から実行するよう求めます。

アクティブな OpenClaw セッションがネイティブ OpenAI Codex ハーネスを使用している場合、同じ exec 承認は、OpenClaw が把握している Codex ランタイムスレッドに対する OpenAI フィードバックアップロードも対象にします。そのアップロードはローカル Gateway zip とは別であり、Codex ハーネスのセッションでのみ表示されます。承認前に、プロンプトは診断を承認すると Codex フィードバックも送信されることを説明しますが、Codex セッション ID やスレッド ID は列挙しません。承認後、チャット返信には、OpenAI サーバーへ送信されたスレッドのチャンネル、OpenClaw セッション ID、Codex スレッド ID、ローカル再開コマンドが列挙されます。承認を拒否または無視した場合、OpenClaw はエクスポートを実行せず、Codex フィードバックを送信せず、Codex ID も出力しません。

これにより、一般的な Codex デバッグループが短くなります。Telegram、Discord、または別のチャンネルで問題のある挙動に気づいたら、`/diagnostics` を実行し、1 回承認し、レポートをサポートと共有してから、ネイティブ Codex スレッドを自分で確認したい場合は、出力された `codex resume <thread-id>` コマンドをローカルで実行します。その確認ワークフローについては、[Codex ハーネス](/ja-JP/plugins/codex-harness#inspect-codex-threads-locally)を参照してください。

## エクスポートに含まれるもの

zip には次が含まれます。

- `summary.md`: サポート向けの人間が読める概要。
- `diagnostics.json`: 設定、ログ、状態、ヘルス、安定性データの機械可読な要約。
- `manifest.json`: エクスポートのメタデータとファイル一覧。
- サニタイズされた設定形状と非シークレットの設定詳細。
- サニタイズされたログ要約と最近のリダクト済みログ行。
- ベストエフォートの Gateway 状態とヘルスのスナップショット。
- `stability/latest.json`: 利用可能な場合、最新の永続化済み安定性バンドル。

Gateway が異常な状態でも、このエクスポートは有用です。Gateway が状態やヘルスのリクエストに応答できない場合でも、利用可能であればローカルログ、設定形状、最新の安定性バンドルが収集されます。

## プライバシーモデル

診断は共有可能になるよう設計されています。エクスポートには、デバッグに役立つ次のような運用データが保持されます。

- サブシステム名、Plugin ID、プロバイダー ID、チャンネル ID、設定済みモード
- ステータスコード、所要時間、バイト数、キュー状態、メモリ読み取り値
- サニタイズされたログメタデータとリダクト済み運用メッセージ
- 設定形状と非シークレットの機能設定

エクスポートでは次が省略またはリダクトされます。

- チャットテキスト、プロンプト、指示、webhook 本文、ツール出力
- 認証情報、API キー、トークン、Cookie、シークレット値
- 生のリクエスト本文またはレスポンス本文
- アカウント ID、メッセージ ID、生のセッション ID、ホスト名、ローカルユーザー名

ログメッセージがユーザー、チャット、プロンプト、またはツールのペイロードテキストに見える場合、エクスポートではメッセージが省略されたこととバイト数だけを保持します。

## 安定性レコーダー

Gateway は、診断が有効な場合、デフォルトで制限付きのペイロードなし安定性ストリームを記録します。これは運用上の事実のためのものであり、コンテンツのためのものではありません。

同じ診断 Heartbeat は、Gateway は稼働し続けているものの、Node.js のイベントループまたは CPU が飽和しているように見える場合に、ライブネスサンプルを記録します。これらの `diagnostic.liveness.warning` イベントには、イベントループ遅延、イベントループ使用率、CPU コア比率、active/waiting/queued セッション数、判明している場合は現在の起動/ランタイムフェーズ、最近のフェーズ期間、制限付きの active/queued 作業ラベルが含まれます。アイドルサンプルは `info` レベルでテレメトリに残ります。ライブネスサンプルが Gateway 警告になるのは、作業が待機中またはキューにある場合、またはアクティブな作業が継続的なイベントループ遅延と重なっている場合のみです。それ以外は健全なバックグラウンド作業中の一時的な最大遅延スパイクは、デバッグログに残ります。それ自体で Gateway を再起動することはありません。

起動フェーズは、実時間と CPU タイミングを含む `diagnostic.phase.completed` イベントも発行します。停滞した埋め込み実行診断では、最後のブリッジ進行が生のレスポンス項目やレスポンス完了イベントなどの終端に見えるものの、Gateway がまだ埋め込み実行をアクティブと見なしている場合に、`terminalProgressStale=true` が設定されます。

ライブレコーダーを確認します。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

致命的な終了、シャットダウンタイムアウト、または再起動時の起動失敗の後に、最新の永続化済み安定性バンドルを確認します。

```bash
openclaw gateway stability --bundle latest
```

最新の永続化済みバンドルから診断 zip を作成します。

```bash
openclaw gateway stability --bundle latest --export
```

イベントが存在する場合、永続化済みバンドルは `~/.openclaw/logs/stability/` 配下にあります。

## 便利なオプション

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: 特定の zip パスへ書き込みます。
- `--log-lines <count>`: 含めるサニタイズ済みログ行の最大数。
- `--log-bytes <bytes>`: 検査するログバイト数の最大値。
- `--url <url>`: 状態とヘルスのスナップショット用 Gateway WebSocket URL。
- `--token <token>`: 状態とヘルスのスナップショット用 Gateway トークン。
- `--password <password>`: 状態とヘルスのスナップショット用 Gateway パスワード。
- `--timeout <ms>`: 状態とヘルスのスナップショットのタイムアウト。
- `--no-stability-bundle`: 永続化済み安定性バンドルの検索をスキップします。
- `--json`: 機械可読なエクスポートメタデータを出力します。

## 診断を無効にする

診断はデフォルトで有効です。安定性レコーダーと診断イベント収集を無効にするには、次のようにします。

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

診断を無効にすると、バグ報告の詳細は減ります。通常の Gateway ログには影響しません。

## 関連

- [ヘルスチェック](/ja-JP/gateway/health)
- [Gateway CLI](/ja-JP/cli/gateway#gateway-diagnostics-export)
- [Gateway プロトコル](/ja-JP/gateway/protocol#system-and-identity)
- [ログ](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — 診断をコレクターへストリーミングするための別フロー
