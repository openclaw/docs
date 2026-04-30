---
read_when:
    - scripts から 1 回のエージェントターンを実行したい（任意で返信を配信）
summary: '`openclaw agent` の CLI リファレンス (Gateway 経由でエージェントの 1 ターンを送信)'
title: エージェント
x-i18n:
    generated_at: "2026-04-30T05:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway 経由でエージェントターンを実行します（埋め込みには `--local` を使用）。
構成済みのエージェントを直接対象にするには `--agent <id>` を使用します。

少なくとも 1 つのセッションセレクターを渡します。

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

関連:

- エージェント送信ツール: [エージェント送信](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: 必須のメッセージ本文
- `-t, --to <dest>`: セッションキーの導出に使う受信者
- `--session-id <id>`: 明示的なセッション ID
- `--agent <id>`: エージェント ID。ルーティングバインディングを上書きします
- `--model <id>`: この実行のモデル上書き（`provider/model` またはモデル ID）
- `--thinking <level>`: エージェントの思考レベル（`off`、`minimal`、`low`、`medium`、`high` に加え、`xhigh`、`adaptive`、`max` などプロバイダーがサポートするカスタムレベル）
- `--verbose <on|off>`: セッションの詳細出力レベルを永続化します
- `--channel <channel>`: 配信チャネル。省略するとメインセッションチャネルを使用します
- `--reply-to <target>`: 配信先ターゲットの上書き
- `--reply-channel <channel>`: 配信チャネルの上書き
- `--reply-account <id>`: 配信アカウントの上書き
- `--local`: 埋め込みエージェントを直接実行します（Plugin レジストリのプリロード後）
- `--deliver`: 選択したチャネル/ターゲットに返信を送り返します
- `--timeout <seconds>`: エージェントのタイムアウトを上書きします（デフォルトは 600 または構成値）
- `--json`: JSON を出力します

## 例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注記

- Gateway モードでは、Gateway リクエストが失敗した場合に埋め込みエージェントへフォールバックします。最初から埋め込み実行を強制するには `--local` を使用します。
- `--local` でも最初に Plugin レジストリをプリロードするため、Plugin が提供するプロバイダー、ツール、チャネルは埋め込み実行中も利用できます。
- `--local` と埋め込みフォールバック実行は、ワンショット実行として扱われます。そのローカルプロセス用に開かれたバンドル MCP ループバックリソースとウォーム Claude stdio セッションは返信後に破棄されるため、スクリプト呼び出しがローカル子プロセスを実行し続けることはありません。
- Gateway ベースの実行では、Gateway 所有の MCP ループバックリソースは実行中の Gateway プロセス配下に残ります。古いクライアントは履歴上のクリーンアップフラグをまだ送信する場合がありますが、Gateway は互換性のための no-op として受け付けます。
- `--channel`、`--reply-channel`、`--reply-account` は返信の配信に影響し、セッションルーティングには影響しません。
- `--json` は stdout を JSON レスポンス専用にします。Gateway、Plugin、埋め込みフォールバックの診断は stderr に送られるため、スクリプトは stdout を直接解析できます。
- 埋め込みフォールバックの JSON には `meta.transport: "embedded"` と `meta.fallbackFrom: "gateway"` が含まれるため、スクリプトはフォールバック実行と Gateway 実行を区別できます。
- Gateway がエージェント実行を受け付けたものの、CLI が最終返信を待機中にタイムアウトした場合、埋め込みフォールバックは新しい明示的な `gateway-fallback-*` セッション/実行 ID を使用し、`meta.fallbackReason: "gateway_timeout"` とフォールバックセッションフィールドを報告します。これにより、Gateway 所有のトランスクリプトロックと競合したり、元のルーティング済み会話セッションを黙って置き換えたりすることを避けます。
- このコマンドが `models.json` の再生成をトリガーする場合、SecretRef 管理のプロバイダー認証情報は解決済みのシークレット平文ではなく、非シークレットマーカー（たとえば環境変数名、`secretref-env:ENV_VAR_NAME`、`secretref-managed`）として永続化されます。
- マーカー書き込みはソースを権威とします。OpenClaw は、解決済みのランタイムシークレット値ではなく、アクティブなソース構成スナップショットからマーカーを永続化します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [エージェントランタイム](/ja-JP/concepts/agent)
