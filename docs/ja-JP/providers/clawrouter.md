---
read_when:
    - 複数のモデルプロバイダーに対して、管理されたキーを1つ使いたい
    - OpenClaw で ClawRouter モデル検出またはクォータ報告が必要です
summary: 認証情報スコープのモデルを ClawRouter 経由でルーティングし、管理対象のクォータを表示する
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:36:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter は、複数の上流モデルプロバイダーに対して、OpenClaw にポリシースコープ付きのキーを 1 つ提供します。バンドルされたプラグインは、そのキーで許可されたモデルだけを検出し、各モデルを宣言されたプロトコル経由でルーティングし、キーの予算と集計使用量を OpenClaw の使用状況サーフェスに報告します。

OpenClaw ホストに各上流プロバイダープラグインをインストールしたり認証したりする必要はありません。上流の認証情報とプロバイダー固有の転送は ClawRouter に残ります。OpenClaw に必要なのは、バンドルされた `@openclaw/clawrouter` プラグインと、発行済みの ClawRouter 認証情報だけです。

| プロパティ      | 値                                    |
| ------------- | ---------------------------------------- |
| プロバイダー      | `clawrouter`                             |
| パッケージ       | `@openclaw/clawrouter`                   |
| 認証          | `CLAWROUTER_API_KEY`                     |
| デフォルト URL   | `https://clawrouter.openclaw.ai`         |
| モデルカタログ | `/v1/catalog` による認証情報スコープ      |
| クォータ        | `/v1/usage` による月次予算と使用量 |

## はじめに

<Steps>
  <Step title="スコープ付き認証情報を取得する">
    使用すべきプロバイダー、モデル、月次予算を含むポリシーを持つ認証情報を ClawRouter 管理者に依頼します。認証情報は発行時に一度だけ表示されます。
  </Step>
  <Step title="OpenClaw を設定する">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    このプラグインは OpenClaw にバンドルされています。設定で `plugins.allow` を指定している場合は、有効化する前に `clawrouter` をそのリストに追加してください。カスタムデプロイでは、`models.providers.clawrouter.baseUrl` を ClawRouter のオリジンに設定します。デフォルトは `https://clawrouter.openclaw.ai` です。

  </Step>
  <Step title="付与されたモデルを一覧表示する">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    返されたモデル参照を表示どおりに使用してください。これらは `clawrouter/openai/...`、`clawrouter/anthropic/...`、`clawrouter/google/...` などの上流名前空間を保持します。設定で `agents.defaults.models` が許可リストになっている場合は、選択した各 ClawRouter 参照をそこに追加してください。

  </Step>
  <Step title="モデルを選択する">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` を使って、返されたモデルを 1 回の実行だけに選択することもできます。

  </Step>
</Steps>

## モデル検出

`GET /v1/catalog` が信頼できる情報源です。OpenClaw は、ClawRouter モデルの 2 つ目の固定リストを同梱しません。ClawRouter で設定されたモデルは、次の場合に表示されます。

- 認証情報のポリシーがそのプロバイダーを許可している。
- プロバイダー接続が有効で準備完了になっている。
- カタログモデルがサポート対象の LLM 機能を提示している。
- カタログがプラグインでサポートされるトランスポート契約を公開している。

そのため、サポート対象の ClawRouter プロバイダーに別のモデルを追加しても、OpenClaw のリリースや別のプロバイダープラグインは不要です。次回のカタログ更新で検出されます。新しいワイヤープロトコルを必要とするモデルは、OpenClaw が広告する前に ClawRouter プラグインでのサポートが必要です。

## プロトコルとプロバイダープラグイン

すべての上流企業の認証プラグインをインストールする必要はありません。ClawRouter が上流認証情報を所有し、そのカタログが使用するトランスポートを OpenClaw に伝えます。このプラグインは次をサポートします。

| カタログルート                  | OpenClaw トランスポート     |
| ------------------------------ | ---------------------- |
| OpenAI 互換チャット         | `openai-completions`   |
| OpenAI 互換 Responses    | `openai-responses`     |
| ネイティブ Anthropic Messages      | `anthropic-messages`   |
| ネイティブ Google Gemini ストリーミング | `google-generative-ai` |

このプラグインは、これらのファミリーに一致するリプレイポリシーとツールスキーマポリシーも適用します。別のリクエスト/ストリーム形式を使用するカタログ行は、意図的に OpenClaw テキストモデルとして広告されません。互換性のないペイロードを送信するのではなく、ClawRouter でそれらのプロバイダーをサポート対象の契約のいずれかに正規化してください。

## クォータと使用状況

ClawRouter の `/v1/usage` レスポンスは、通常の OpenClaw プロバイダー使用状況サーフェスに反映されます。`/status` と関連するダッシュボードステータスは、キーに制限がある場合は月次予算ウィンドウに加え、リクエスト、トークン、支出の合計を表示します。従量制限のないキーでも、パーセンテージウィンドウなしで集計使用量が表示されます。

クォータ検索は、モデル検出と同じスコープ付きキーを使用します。クォータ検索に失敗しても、モデル実行はブロックされません。

ライブスナップショットは次で確認します。

```bash
openclaw status --usage
openclaw models status
```

同じプロバイダースナップショットは、チャット内の `/status` と OpenClaw の使用状況 UI でも利用できます。予算はポリシー全体に適用されるため、同じ ClawRouter ポリシーを使う別のクライアントからのリクエストによって、残りの割合が変わることがあります。

## トラブルシューティング

| 症状                                  | 確認                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter モデルがない                     | プラグインが有効で、`plugins.allow` によって許可されていることを確認し、認証情報がアクティブで、少なくとも 1 つの準備完了プロバイダーを許可していることを確認します。 |
| 設定済みの ClawRouter モデルが見つからない | その `/v1/catalog` 機能とルート形式を確認します。サポートされていないトランスポート契約は意図的に除外されます。                             |
| `Unknown model: clawrouter/...`          | その設定マップが許可リストとして使われている場合は、正確なカタログ参照を `agents.defaults.models` に追加します。                               |
| カタログまたは使用状況からの `401` または `403`     | ClawRouter 認証情報を再発行するか、スコープを再設定します。OpenClaw は上流プロバイダーキーにフォールバックしません。                                          |
| 検出後にモデル呼び出しが失敗する         | ClawRouter でプロバイダー接続と上流の健全性を確認し、その準備完了状態が回復した後に再試行します。                                |
| 使用状況に合計はあるがパーセンテージがない       | ポリシーは従量制限なしです。パーセンテージウィンドウを公開するには、ClawRouter に月次予算を追加します。                                                     |

## セキュリティ動作

- カタログ検出は、設定されたプロキシキーにスコープされ、キーごとにキャッシュされます。
- プロキシキーはリクエストディスパッチ時にのみ付与されます。モデルメタデータには保存されません。
- ネイティブ Anthropic および Gemini のモデル ID は、ディスパッチ時にのみ上流 ID に書き換えられます。
- サポート対象外または許可されていないカタログ行は fail closed となり、選択できません。

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー設定とモデル選択。
  </Card>
  <Card title="使用状況の追跡" href="/ja-JP/concepts/usage-tracking" icon="chart-line">
    OpenClaw の使用状況とステータスサーフェス。
  </Card>
</CardGroup>
