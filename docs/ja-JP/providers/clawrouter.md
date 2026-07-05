---
read_when:
    - 複数のモデルプロバイダーに対して1つの管理キーを使いたい
    - OpenClaw で ClawRouter のモデル検出またはクォータレポートが必要です
summary: 認証情報スコープのモデルをClawRouter経由でルーティングし、管理対象クォータを表示する
title: ClawRouter
x-i18n:
    generated_at: "2026-07-05T11:43:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 888516e7b7c8bd25e15c9506e6b10f0b4847274755cc72377cb06415a55cb988
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter は、複数の上流モデルプロバイダーに対して、ポリシー範囲のキーを 1 つ OpenClaw に提供します。バンドル済みの `clawrouter` Plugin は、そのキーで許可されたモデルのみを検出し、各モデルを宣言済みのプロトコル経由でルーティングし、キーの予算と集計使用量を OpenClaw の使用量サーフェスに報告します。

上流の認証情報とプロバイダー固有の転送は ClawRouter に留まるため、OpenClaw ホスト上で各上流プロバイダー Plugin をインストールしたり認証したりする必要はありません。この Plugin は OpenClaw にバンドルされています（`enabledByDefault: true`）。必要なのは発行済みの ClawRouter 認証情報だけです。

| プロパティ      | 値                                    |
| ------------- | ---------------------------------------- |
| プロバイダー      | `clawrouter`                             |
| Plugin        | バンドル済み（OpenClaw に含まれる）           |
| 認証          | `CLAWROUTER_API_KEY`                     |
| デフォルト URL   | `https://clawrouter.openclaw.ai`         |
| モデルカタログ | `/v1/catalog` 経由で認証情報範囲      |
| クォータ        | `/v1/usage` 経由の月次予算と使用量 |

## はじめに

<Steps>
  <Step title="範囲指定された認証情報を取得する">
    使用すべきプロバイダー、モデル、月次予算を含むポリシーの認証情報を ClawRouter 管理者に依頼してください。認証情報は発行時に一度だけ表示されます。
  </Step>
  <Step title="OpenClaw を設定する">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` はバンドル済みで、デフォルトで有効です。設定で `plugins.allow` を指定している場合は、有効化する前にそのリストへ `clawrouter` を追加してください。カスタムデプロイでは、`models.providers.clawrouter.baseUrl` を ClawRouter のオリジンに設定します。デフォルトは `https://clawrouter.openclaw.ai` です。

  </Step>
  <Step title="許可されたモデルを一覧表示する">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    返されたモデル参照を表示どおりに使用してください。これらは `clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6`、`clawrouter/google/gemini-3.5-flash` のように、上流の名前空間を保持します。設定で `agents.defaults.models` が allowlist の場合は、選択した各 ClawRouter 参照を追加してください。

  </Step>
  <Step title="モデルを選択する">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` を使用して、返されたモデルを 1 回の実行に対して選択することもできます。

  </Step>
</Steps>

## モデル検出

`GET /v1/catalog` は `{ providers: [...] }` を返します。各プロバイダーエントリには、その `models[]`（上流 ID、機能、価格を含む）とサポートされるリクエストルートが一覧表示されます。OpenClaw は ClawRouter モデルの 2 つ目の固定リストを同梱しません。カタログモデルは、次の場合に OpenClaw モデルとして公開されます。

- 認証情報のポリシーがそのプロバイダーを許可している。
- カタログモデルがサポート対象の LLM 機能（`llm.responses`、`llm.chat`、`llm.messages`、または一致するストリーミングルートを持つ `llm.stream`）を公開している。
- プロバイダーが、以下のトランスポートのいずれかに一致するルートを公開している。

サポート対象の ClawRouter プロバイダーへモデルを追加しても、OpenClaw のリリースは不要です。次のカタログ更新（認証情報スコープごとに 60 秒キャッシュ）で検出されます。新しいワイヤプロトコルが必要なモデルには、先に Plugin サポートが必要です。

## プロトコルとプロバイダー Plugin

ClawRouter は上流の認証情報を所有します。そのカタログが使用するトランスポートを OpenClaw に伝えるため、すべての上流会社の認証 Plugin をインストールする必要はありません。

| カタログ機能 / ルート                               | OpenClaw トランスポート     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 互換プロバイダー）             | `openai-responses`     |
| `llm.chat`（OpenAI 互換プロバイダー）                  | `openai-completions`   |
| `llm.messages` + `anthropic.messages` ルート              | `anthropic-messages`   |
| `llm.stream` + ストリーミング `google.generate_content` ルート | `google-generative-ai` |

この Plugin は、それらのファミリーに一致するリプレイおよびツールスキーマポリシーも適用します（OpenAI/DeepSeek/Gemini ツールスキーマ互換、ネイティブ Anthropic と Google Gemini のリプレイポリシー）。サポートされていないリクエスト形式のみを公開するカタログプロバイダーは、意図的に OpenClaw テキストモデルとして公開されません。互換性のないペイロードを送信するのではなく、それらのプロバイダーを ClawRouter 内でサポート対象契約のいずれかに正規化してください。

## クォータと使用量

ClawRouter の `/v1/usage` レスポンスは、通常の OpenClaw プロバイダー使用量サーフェスに反映されます。リクエスト、トークン、支出の合計に加え、キーに制限がある場合は月次予算ウィンドウも含まれます。従量制でないキーでも、割合ウィンドウなしで集計使用量が表示されます。

クォータ検索は、モデル検出と同じ範囲指定キーを使用します。クォータ検索が失敗しても、モデル実行はブロックされません。

ライブスナップショットは次で確認します。

```bash
openclaw status --usage
openclaw models status
```

同じプロバイダースナップショットは、チャット内の `/status` と OpenClaw の使用量 UI でも利用できます。予算はポリシー全体に適用されるため、同じ ClawRouter ポリシーを使用する別のクライアントからのリクエストによって、残り割合が変化することがあります。

## トラブルシューティング

| 症状                                  | 確認                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter モデルがない                     | Plugin が有効化され、`plugins.allow` で許可されていることを確認し、そのうえで認証情報が有効で、少なくとも 1 つの準備済みプロバイダーを許可していることを確認してください。 |
| 設定済みの ClawRouter モデルが見つからない | その `/v1/catalog` の機能とルートサポートを調べてください。サポートされていないトランスポート契約は意図的に除外されます。                            |
| `Unknown model: clawrouter/...`          | その設定マップが allowlist として使用されている場合は、正確なカタログ参照を `agents.defaults.models` に追加してください。                               |
| カタログまたは使用量からの `401` または `403`     | ClawRouter 認証情報を再発行するか、範囲を再設定してください。OpenClaw は上流プロバイダーキーへフォールバックしません。                                          |
| 検出後にモデル呼び出しが失敗する         | ClawRouter 内のプロバイダー接続と上流の健全性を確認し、準備状態が回復した後に再試行してください。                                |
| 使用量に合計はあるが割合がない       | ポリシーは従量制ではありません。割合ウィンドウを公開するには、ClawRouter に月次予算を追加してください。                                                     |

## セキュリティ動作

- カタログ検出は、設定済みのプロキシキーに範囲指定され、認証情報スコープ（エージェントディレクトリ、ワークスペースディレクトリ、認証プロファイル ID、base URL）ごとにキャッシュされます。
- プロキシキーはリクエスト送信時にのみ付与され、モデルメタデータには保存されません。
- ネイティブ Anthropic と Gemini のモデル ID は、送信時にのみ上流 ID へ書き換えられます。
- サポートされていない、または許可されていないカタログ行は fail closed となり、選択できません。

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー設定とモデル選択。
  </Card>
  <Card title="使用量追跡" href="/ja-JP/concepts/usage-tracking" icon="chart-line">
    OpenClaw の使用量とステータスサーフェス。
  </Card>
</CardGroup>
