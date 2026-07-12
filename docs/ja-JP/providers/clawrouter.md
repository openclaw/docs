---
read_when:
    - 複数のモデルプロバイダーに対して、1つの管理されたキーを使用したい場合
    - OpenClaw で ClawRouter のモデル検出またはクォータレポートが必要です
summary: 認証情報にスコープされたモデルを ClawRouter 経由でルーティングし、管理対象のクォータを表示する
title: ClawRouter
x-i18n:
    generated_at: "2026-07-11T22:36:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter は、複数の上流モデルプロバイダーに対して、ポリシーでスコープ設定された1つのキーを OpenClaw に提供します。同梱の `clawrouter` Plugin は、そのキーで許可されたモデルのみを検出し、各モデルを宣言されたプロトコル経由でルーティングし、キーの予算と集計使用量を OpenClaw の使用量画面に報告します。

上流の認証情報とプロバイダー固有の転送処理は ClawRouter 内に保持されるため、OpenClaw ホスト上で上流プロバイダーごとの Plugin をインストールしたり認証したりする必要はありません。この Plugin は OpenClaw に同梱されています（`enabledByDefault: true`）。必要なのは、発行済みの ClawRouter 認証情報だけです。

| プロパティ      | 値                                    |
| ------------- | ---------------------------------------- |
| プロバイダー      | `clawrouter`                             |
| Plugin        | 同梱（OpenClaw に含まれる）           |
| 認証          | `CLAWROUTER_API_KEY`                     |
| デフォルト URL   | `https://clawrouter.openclaw.ai`         |
| モデルカタログ | `/v1/catalog` による認証情報スコープ      |
| クォータ        | `/v1/usage` による月間予算と使用量 |

## はじめに

<Steps>
  <Step title="スコープ設定された認証情報を取得する">
    使用すべきプロバイダー、モデル、月間予算をポリシーに含む認証情報を ClawRouter 管理者に依頼してください。認証情報は発行時に一度だけ表示されます。
  </Step>
  <Step title="OpenClaw を設定する">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` は同梱され、デフォルトで有効です。設定で `plugins.allow` を指定している場合は、有効化する前にそのリストへ `clawrouter` を追加してください。カスタムデプロイでは、`models.providers.clawrouter.baseUrl` を ClawRouter のオリジンに設定します。デフォルトは `https://clawrouter.openclaw.ai` です。

  </Step>
  <Step title="許可されたモデルを一覧表示する">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    返されたモデル参照を表示どおりに使用してください。これらは、`clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6`、`clawrouter/google/gemini-3.5-flash` などの上流名前空間を保持します。設定で `agents.defaults.models` を許可リストとして使用している場合は、選択した各 ClawRouter 参照を追加してください。

  </Step>
  <Step title="モデルを選択する">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` を使用して、返されたモデルを1回の実行に対して選択することもできます。

  </Step>
</Steps>

## 管理された非対話型デプロイ

プロキシキーはワークロードのシークレット注入に保持し、`openclaw.json` には SecretRef のみを保存してください。標準の管理対象フィールドは次のとおりです。

| 用途       | 設定または環境フィールド                                              |
| ------------- | ------------------------------------------------------------------------ |
| ルーターのオリジン | `models.providers.clawrouter.baseUrl`                                    |
| 認証情報    | `models.providers.clawrouter.apiKey` -> 環境変数の SecretRef                    |
| シークレット値  | Gateway プロセス環境内の `CLAWROUTER_API_KEY`                  |
| デフォルトモデル | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| ワークロードタグ  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（任意） |

たとえば、デプロイコントローラーは次の JSON5 パッチを管理できます。

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

デプロイで `plugins.allow` を設定している場合は、既存のエントリを保持したまま `clawrouter` を追加してください。対話型ウィザードを使わずに検証して適用します。

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

ドライランは SecretRef を解決しますが、その値を出力することはありません。認証情報をローテーションするには、`CLAWROUTER_API_KEY` を供給する外部 Secret を更新し、Gateway ワークロードを再起動して新しいプロセス環境を読み込ませます。設定ファイルとモデル参照は変更されません。

ソースからビルドしたスタンドアロン Docker Gateway では、ClawRouter はすでにルートランタイムに含まれています。個別のパッケージ化が必要なチャンネル Plugin のみを、`OPENCLAW_EXTENSIONS=clickclack`、`slack`、`msteams` などとして選択してください。[選択した Plugin を含むソースビルドイメージ](/ja-JP/install/docker#source-built-images-with-selected-plugins)を参照してください。アーカイブ／アプライアンス形式のデプロイでは、OCI イメージを使用するのではなく、同じ取り込み済みソースを独自のアーティファクトパイプラインでパッケージ化する必要があります。

## 準備状態とライブ検証

以下のチェックはそれぞれ異なる境界を検証します。相互に代用しないでください。

```bash
# ClawRouter プロセスの正常性のみ。認証情報や上流モデルは使用しません。
curl -fsS https://clawrouter.internal.example/v1/health

# OpenClaw Gateway の起動準備状態のみ。モデル呼び出しは行いません。
curl -fsS http://127.0.0.1:18789/readyz

# 認証情報スコープのカタログ検出。
openclaw models list --all --provider clawrouter --json

# 設定済みの ClawRouter プロバイダーを通じた最小限の実推論プローブ。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 許可された正確なモデル参照を使用するワークロードカナリア。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

例のモデルをそのままコピーするのではなく、スコープ設定されたカタログから返されたモデルを使用してください。`/readyz` の応答が成功することは、Gateway がリクエストを処理できることを意味しますが、ClawRouter、その認証情報、または上流プロバイダーが準備完了であることを示すものではありません。モデルプローブとエージェントカナリアが推論の検証になります。

ライブ診断では、カナリアを実行し、Gateway の標準ログを確認してください。既存のメタデータのみのモデル転送診断では、次の形式の行が出力されます。

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

識別子が利用可能な場合、Plugin は長さを制限した `X-ClawRouter-Client`、`X-ClawRouter-Agent-Id`、`X-ClawRouter-Session-Id` ヘッダーを送信します。また、モデル呼び出しの診断用 `callId`（`<run-id>:model:<n>`）を `X-Request-ID` に対応付けるため、OpenClaw のモデル呼び出しイベントを ClawRouter のメタデータのみの監査証跡と関連付けられます。128文字のリクエスト ID 制限内の値は同一です。より長い値は `:model:<n>` サフィックスと決定論的ハッシュを保持するため、個別の呼び出しを制限内に収めたまま関連付けられます。`X-ClawRouter-Project-Id` などの静的デプロイメタデータは、プロバイダーの `headers` マップで設定できます。エージェントとセッションの帰属ヘッダーには、それぞれ個別の256文字制限が維持されます。ClawRouter の ASCII 識別子セット外の文字を含む自動リクエスト ID にも、同じ決定論的な制限形式が使用されます。
`X-Request-ID` の大文字・小文字違いを含む明示的に設定されたヘッダーは、自動値より優先されます。転送診断はルーティングと応答のメタデータを記録しますが、認証情報、リクエスト ID、プロンプト、完了内容は記録しません。ClawRouter 自体の監査イベントでは、選択された上流プロバイダーとコンテンツ保持状態が提供されます。

## モデル検出

`GET /v1/catalog` は `{ providers: [...] }` を返します。各プロバイダーエントリには、それぞれの `models[]`（上流 ID、機能、価格を含む）と、サポートされるリクエストルートが列挙されます。OpenClaw は、ClawRouter モデルの固定された第2のリストを同梱しません。カタログモデルが OpenClaw モデルとして公開される条件は次のとおりです。

- 認証情報のポリシーでそのプロバイダーが許可されている。
- カタログモデルが、サポート対象の LLM 機能（`llm.responses`、`llm.chat`、`llm.messages`、または対応するストリーミングルートを持つ `llm.stream`）を公開している。
- プロバイダーが、以下のいずれかの転送方式に対応するルートを公開している。

サポート対象の ClawRouter プロバイダーへモデルを追加する際、OpenClaw のリリースは不要です。次回のカタログ更新（認証情報スコープごとに60秒間キャッシュ）で検出されます。新しい通信プロトコルを必要とするモデルには、先に Plugin 側のサポートが必要です。

## プロトコルとプロバイダー Plugin

ClawRouter が上流の認証情報を管理し、そのカタログが使用する転送方式を OpenClaw に通知するため、上流企業ごとの認証 Plugin をすべてインストールする必要はありません。

| カタログの機能／ルート                               | OpenClaw の転送方式     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 互換プロバイダー）             | `openai-responses`     |
| `llm.chat`（OpenAI 互換プロバイダー）                  | `openai-completions`   |
| `llm.messages` + `anthropic.messages` ルート              | `anthropic-messages`   |
| `llm.stream` + ストリーミング `google.generate_content` ルート | `google-generative-ai` |

Plugin は、それらのファミリーに対応する再生およびツールスキーマポリシーも適用します（OpenAI／DeepSeek／Gemini のツールスキーマ互換性、Anthropic および Google Gemini のネイティブ再生ポリシー）。サポートされていないリクエスト形式のみを公開するカタログプロバイダーは、意図的に OpenClaw のテキストモデルとして公開されません。互換性のないペイロードを送信するのではなく、ClawRouter 内でそれらのプロバイダーをサポート対象のいずれかの契約に正規化してください。

## クォータと使用量

ClawRouter の `/v1/usage` 応答は、通常の OpenClaw プロバイダー使用量画面へ、リクエスト数、トークン数、支出額の合計に加え、キーに上限がある場合は月間予算期間を提供します。従量制限のないキーでも、パーセンテージ期間なしで集計使用量が表示されます。

クォータ検索には、モデル検出と同じスコープ設定済みキーが使用されます。クォータ検索に失敗しても、モデルの実行は妨げられません。

次のコマンドでライブスナップショットを確認します。

```bash
openclaw status --usage
openclaw models status
```

同じプロバイダースナップショットは、チャット内の `/status` と OpenClaw の使用量 UI でも利用できます。予算はポリシー全体に適用されるため、同じ ClawRouter ポリシーを使用する別のクライアントからのリクエストによって、残りの割合が変化することがあります。

## トラブルシューティング

| 症状                                  | 確認事項                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter モデルがない                     | Plugin が有効で `plugins.allow` により許可されていることを確認し、認証情報が有効で、準備完了のプロバイダーを少なくとも1つ許可していることを確認します。 |
| 設定済みの ClawRouter モデルが見つからない | その `/v1/catalog` の機能とルート対応状況を確認します。サポートされていない転送契約は意図的に除外されます。                            |
| `Unknown model: clawrouter/...`          | その設定マップを許可リストとして使用している場合は、正確なカタログ参照を `agents.defaults.models` に追加します。                               |
| カタログまたは使用量で `401` または `403`     | ClawRouter 認証情報を再発行するかスコープを再設定してください。OpenClaw は上流プロバイダーのキーへフォールバックしません。                                          |
| 検出後にモデル呼び出しが失敗する         | ClawRouter 内のプロバイダー接続と上流の正常性を確認し、準備状態が回復してから再試行します。                                |
| 使用量に合計はあるが割合がない       | ポリシーは従量制限なしです。ClawRouter に月間予算を追加すると、パーセンテージ期間が表示されます。                                                     |

## セキュリティ動作

- カタログ検出は、設定されたプロキシキーのスコープに限定され、認証情報のスコープ（エージェントディレクトリ、ワークスペースディレクトリ、認証プロファイルID、ベースURL）ごとにキャッシュされます。
- プロキシキーはリクエスト送信時にのみ付加され、モデルのメタデータには保存されません。
- 自動帰属情報およびリクエスト相関値は、送信前に前後の空白が除去され、制御文字を含む場合は拒否されます。帰属情報の値は256文字、リクエストIDは128文字に制限されます。
- モデル転送の診断情報にはメタデータのみが含まれ、プロキシキーやモデルの内容は一切含まれません。
- ネイティブのAnthropicおよびGeminiのモデルIDは、送信時にのみアップストリームのIDへ書き換えられます。
- サポートされていない、または許可されていないカタログ行は安全側に失敗し、選択できません。

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダーの設定とモデルの選択。
  </Card>
  <Card title="使用量の追跡" href="/ja-JP/concepts/usage-tracking" icon="chart-line">
    OpenClawの使用量とステータスを表示する画面。
  </Card>
</CardGroup>
