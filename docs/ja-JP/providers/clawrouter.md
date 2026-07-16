---
read_when:
    - 複数のモデルプロバイダーで使用できる単一のマネージドキーが必要な場合
    - OpenClaw で ClawRouter のモデル検出またはクォータ報告が必要であること
summary: 認証情報のスコープに応じたモデルを ClawRouter 経由でルーティングし、管理対象のクォータを表示する
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T12:12:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter は、複数のアップストリームモデルプロバイダーに対して、ポリシースコープのキーを 1 つ OpenClaw に提供します。バンドルされた `clawrouter` Plugin は、そのキーに許可されたモデルのみを検出し、各モデルを宣言されたプロトコル経由でルーティングし、OpenClaw の使用量画面にキーの予算と集計使用量を表示します。

アップストリームの認証情報とプロバイダー固有の転送処理は ClawRouter 内に保持されるため、OpenClaw ホスト上でアップストリームプロバイダーごとの Plugin をインストールしたり認証したりする必要はありません。この Plugin は OpenClaw にバンドルされています（`enabledByDefault: true`）。必要なのは、発行された ClawRouter 認証情報だけです。

| プロパティ      | 値                                    |
| ------------- | ---------------------------------------- |
| プロバイダー      | `clawrouter`                             |
| Plugin        | バンドル済み（OpenClaw に同梱）           |
| 認証          | `CLAWROUTER_API_KEY`                     |
| デフォルト URL   | `https://clawrouter.openclaw.ai`         |
| モデルカタログ | `/v1/catalog` による認証情報スコープ      |
| クォータ        | `/v1/usage` による月間予算と使用量 |

## はじめに

<Steps>
  <Step title="スコープ付き認証情報を取得する">
    使用すべきプロバイダー、モデル、月間予算をポリシーに含む認証情報を ClawRouter 管理者に依頼してください。認証情報は発行時に一度だけ表示されます。
  </Step>
  <Step title="OpenClaw を設定する">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` はバンドルされており、デフォルトで有効です。設定で `plugins.allow` を指定している場合は、有効化する前に `clawrouter` をそのリストに追加してください。カスタムデプロイでは、`models.providers.clawrouter.baseUrl` を ClawRouter のオリジンに設定します。デフォルトは `https://clawrouter.openclaw.ai` です。

  </Step>
  <Step title="許可されたモデルを一覧表示する">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    返されたモデル参照を表示どおり正確に使用してください。これらは、`clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6`、`clawrouter/google/gemini-3.5-flash` などのアップストリーム名前空間を維持します。設定内の `agents.defaults.models` が許可リストとして使用されている場合は、選択した各 ClawRouter 参照を追加してください。

  </Step>
  <Step title="モデルを選択する">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` を使用して、返されたモデルを 1 回の実行用に選択することもできます。

  </Step>
</Steps>

## 管理された非対話型デプロイ

プロキシキーはワークロードのシークレット注入に保持し、`openclaw.json` には SecretRef のみを保存してください。標準の管理対象フィールドは次のとおりです。

| 目的       | 設定または環境フィールド                                              |
| ------------- | ------------------------------------------------------------------------ |
| ルーターオリジン | `models.providers.clawrouter.baseUrl`                                    |
| 認証情報    | `models.providers.clawrouter.apiKey` -> 環境変数の SecretRef                    |
| シークレット値  | Gateway プロセス環境内の `CLAWROUTER_API_KEY`                  |
| デフォルトモデル | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| ワークロードタグ  | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id`（任意） |

たとえば、デプロイコントローラーで次の JSON5 パッチを管理できます。

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

デプロイで `plugins.allow` を設定する場合は、既存のエントリを保持したまま `clawrouter` を追加してください。対話型ウィザードを使用せずに検証して適用します。

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

ドライランでは SecretRef を解決しますが、その値は決して出力しません。認証情報をローテーションするには、`CLAWROUTER_API_KEY` を提供する外部 Secret を更新し、新しいプロセス環境が読み込まれるように Gateway ワークロードを再起動します。設定ファイルとモデル参照は変更されません。

ソースからビルドしたスタンドアロン Docker Gateway では、ClawRouter はすでにルートランタイムに含まれています。個別のパッケージ化が必要なチャンネル Plugin（`OPENCLAW_EXTENSIONS=clickclack`、`slack`、`msteams` など）のみを選択してください。[選択した Plugin を含むソースビルドイメージ](/ja-JP/install/docker#source-built-images-with-selected-plugins)を参照してください。アーカイブ／アプライアンスデプロイでは、OCI イメージを使用するのではなく、取り込まれた同じソースを独自のアーティファクトパイプラインでパッケージ化する必要があります。

## 準備状況とライブ検証

以下のチェックはそれぞれ異なる境界を検証します。相互に代用しないでください。

```bash
# ClawRouter プロセスの正常性のみ。認証情報やアップストリームモデルは使用されません。
curl -fsS https://clawrouter.internal.example/v1/health

# OpenClaw Gateway の起動準備状況のみ。モデル呼び出しは行われません。
curl -fsS http://127.0.0.1:18789/readyz

# 認証情報スコープのカタログ検出。
openclaw models list --all --provider clawrouter --json

# 設定済みの ClawRouter プロバイダーを介した最小限の実推論プローブ。
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# 許可された正確なモデル参照を使用するワークロードカナリア。
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "正確に次のように応答してください: CLAWROUTER_CANARY_OK" \
  --json
```

例のモデルを無条件にコピーするのではなく、スコープ付きカタログから返されたモデルを使用してください。`/readyz` の応答が成功した場合、Gateway がリクエストを処理できることを意味しますが、ClawRouter、その認証情報、またはアップストリームプロバイダーの準備が完了していることを示すものではありません。モデルプローブとエージェントカナリアが推論の検証となります。

ライブ診断では、カナリアを実行し、Gateway の標準ログを確認してください。既存のメタデータのみのモデル転送診断では、次の形式の行が出力されます。

```text
[model-fetch] 開始 provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] 応答 provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

これらの識別子が利用可能な場合、Plugin は上限付きの `X-ClawRouter-Client`、`X-ClawRouter-Agent-Id`、`X-ClawRouter-Session-Id` ヘッダーを送信します。また、モデル呼び出しの診断用 `callId`（`<run-id>:model:<n>`）を `X-Request-ID` にマッピングするため、OpenClaw のモデル呼び出しイベントを ClawRouter のメタデータのみの監査証跡と結合できます。128 文字のリクエスト ID 上限に収まる値は同一です。より長い値では `:model:<n>` サフィックスと決定論的ハッシュが保持されるため、個別の呼び出しは上限内に収まり、引き続き結合可能です。`X-ClawRouter-Project-Id` などの静的なデプロイメタデータは、プロバイダーの `headers` マップで設定できます。エージェントおよびセッション帰属ヘッダーには、それぞれ独立した 256 文字の上限が維持されます。ClawRouter の ASCII 識別子セットに含まれない文字を含む自動リクエスト ID にも、同じ決定論的な上限付き形式が使用されます。
`X-Request-ID` の大文字小文字のバリエーションを含め、明示的に設定されたヘッダーは自動値より優先されます。転送診断にはルーティングと応答のメタデータが記録されますが、認証情報、リクエスト ID、プロンプト、完了内容は記録されません。ClawRouter 自体の監査イベントには、選択されたアップストリームプロバイダーとコンテンツ保持状態が記録されます。

## モデル検出

`GET /v1/catalog` は `{ providers: [...] }` を返します。各プロバイダーエントリには、独自の `models[]`（アップストリーム ID、機能、料金を含む）と、サポートされるリクエストルートが一覧表示されます。OpenClaw は、ClawRouter モデルの第 2 の固定リストを同梱しません。カタログモデルは、次の場合に OpenClaw モデルとして提示されます。

- 認証情報のポリシーでそのプロバイダーが許可されている。
- カタログモデルが、サポートされる LLM 機能（`llm.responses`、`llm.chat`、`llm.messages`、または対応するストリーミングルートを持つ `llm.stream`）を提示している。さらに
- プロバイダーが、以下の転送方式のいずれかに対応するルートを公開している。

サポートされている ClawRouter プロバイダーへのモデル追加に OpenClaw のリリースは不要です。次回のカタログ更新（認証情報スコープごとに 60 秒間キャッシュ）で検出されます。新しいワイヤープロトコルを必要とするモデルには、まず Plugin 側のサポートが必要です。

## プロトコルとプロバイダー Plugin

ClawRouter がアップストリーム認証情報を管理し、そのカタログが使用する転送方式を OpenClaw に通知するため、アップストリーム各社の認証 Plugin をすべてインストールする必要はありません。

| カタログの機能／ルート                               | OpenClaw 転送方式     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 互換プロバイダー）             | `openai-responses`     |
| `llm.chat`（OpenAI 互換プロバイダー）                  | `openai-completions`   |
| `llm.messages` + `anthropic.messages` ルート              | `anthropic-messages`   |
| `llm.stream` + ストリーミング `google.generate_content` ルート | `google-generative-ai` |

Plugin は、これらのファミリーに対応する再生ポリシーとツールスキーマポリシーも適用します（OpenAI／DeepSeek／Gemini／Perplexity のツールスキーマ互換性、Anthropic および Google Gemini のネイティブ再生ポリシー）。Perplexity モデルには厳格なスキーマ書き換えが適用されます。Perplexity はそれらがないツールスキーマを拒否するため、`patternProperties` と `additionalProperties` が削除され、すべてのオブジェクトスキーマで `properties` が宣言されます。サポートされていないリクエスト形式のみを公開するカタログプロバイダーは、意図的に OpenClaw のテキストモデルとして提示されません。互換性のないペイロードを送信するのではなく、それらのプロバイダーを ClawRouter 内でサポートされている契約のいずれかに正規化してください。

## クォータと使用量

ClawRouter の `/v1/usage` 応答は、通常の OpenClaw プロバイダー使用量画面に反映されます。リクエスト数、トークン数、支出額の合計に加え、キーに上限がある場合は月間予算期間も表示されます。従量制限のないキーでも、パーセンテージ期間なしで集計使用量が表示されます。

クォータ検索では、モデル検出と同じスコープ付きキーを使用します。クォータ検索が失敗しても、モデルの実行はブロックされません。

ライブスナップショットは次のコマンドで確認します。

```bash
openclaw status --usage
openclaw models status
```

同じプロバイダースナップショットを、チャット内の `/status` と OpenClaw の使用量 UI でも利用できます。予算はポリシー全体に適用されるため、同じ ClawRouter ポリシーを使用する別のクライアントからのリクエストによって残りの割合が変化する場合があります。

## トラブルシューティング

| 症状                                  | 確認事項                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter モデルがない                     | Plugin が有効であり、`plugins.allow` で許可されていることを確認してから、認証情報が有効で、準備済みのプロバイダーが少なくとも 1 つ許可されていることを確認します。 |
| 設定した ClawRouter モデルが見つからない | その `/v1/catalog` 機能とルートのサポート状況を確認します。サポートされていない転送契約は意図的に除外されます。                            |
| `Unknown model: clawrouter/...`          | その設定マップが許可リストとして使用されている場合は、正確なカタログ参照を `agents.defaults.models` に追加します。                               |
| カタログまたは使用量からの `401` または `403`     | ClawRouter 認証情報を再発行するかスコープを再設定してください。OpenClaw はアップストリームプロバイダーキーにフォールバックしません。                                          |
| 検出後にモデル呼び出しが失敗する         | ClawRouter 内のプロバイダー接続とアップストリームの正常性を確認し、準備状態が回復してから再試行します。                                |
| 使用量に合計はあるが割合がない       | ポリシーは従量制限なしです。パーセンテージ期間を表示するには、ClawRouter で月間予算を追加します。                                                     |

## セキュリティ動作

- カタログ検出は、設定されたプロキシキーのスコープに限定され、認証情報のスコープ（エージェントディレクトリ、ワークスペースディレクトリ、認証プロファイル ID、ベース URL）ごとにキャッシュされます。
- プロキシキーはリクエストの送信時にのみ付加され、モデルのメタデータには保存されません。
- 自動帰属情報とリクエスト相関値は、送信前に前後の空白が除去され、制御文字を含む場合は拒否されます。帰属情報の値は 256 文字、リクエスト ID は 128 文字に制限されます。
- モデル転送の診断情報にはメタデータのみが含まれ、プロキシキーやモデルの内容が含まれることはありません。
- Anthropic および Gemini のネイティブモデル ID は、送信時にのみアップストリームの ID に書き換えられます。
- サポートされていない、または許可されていないカタログ行はフェイルクローズとなり、選択できません。

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダーの設定とモデルの選択。
  </Card>
  <Card title="使用状況の追跡" href="/ja-JP/concepts/usage-tracking" icon="chart-line">
    OpenClaw の使用状況とステータス画面。
  </Card>
</CardGroup>
