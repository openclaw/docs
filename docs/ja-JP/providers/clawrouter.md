---
read_when:
    - 複数のモデルプロバイダーに対して、1つの管理されたキーを使用したい場合
    - OpenClaw で ClawRouter のモデル検出またはクォータレポートが必要です
summary: 認証情報のスコープに限定されたモデルを ClawRouter 経由でルーティングし、管理対象のクォータを表示する
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T14:46:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter は、複数の上流モデルプロバイダーに対して、ポリシーでスコープされた単一のキーを OpenClaw に提供します。バンドルされている `clawrouter` Plugin は、そのキーで許可されたモデルのみを検出し、各モデルを宣言済みのプロトコル経由でルーティングし、OpenClaw の使用量画面にキーの予算と集計使用量を報告します。

上流の認証情報とプロバイダー固有の転送処理は ClawRouter 内に保持されるため、OpenClaw ホストに上流プロバイダーごとの Plugin をインストールしたり、認証したりする必要はありません。この Plugin は OpenClaw にバンドルされて出荷されます（`enabledByDefault: true`）。必要なのは、発行済みの ClawRouter 認証情報だけです。

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
    使用すべきプロバイダー、モデル、月間予算をポリシーに含む認証情報を、ClawRouter 管理者に依頼してください。認証情報は発行時に一度だけ表示されます。
  </Step>
  <Step title="OpenClaw を設定する">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` はバンドルされており、デフォルトで有効です。設定で `plugins.allow` を指定している場合は、有効化する前に `clawrouter` をそのリストへ追加してください。カスタムデプロイの場合は、`models.providers.clawrouter.baseUrl` を ClawRouter のオリジンに設定してください。デフォルトは `https://clawrouter.openclaw.ai` です。

  </Step>
  <Step title="許可されたモデルを一覧表示する">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    返されたモデル参照は、表示されたとおり正確に使用してください。これらは、`clawrouter/openai/gpt-5.5`、`clawrouter/anthropic/claude-sonnet-4-6`、`clawrouter/google/gemini-3.5-flash` のように、上流の名前空間を保持します。設定で `agents.defaults.models` を許可リストとして使用している場合は、選択した各 ClawRouter 参照を追加してください。

  </Step>
  <Step title="モデルを選択する">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."` を使用して、返されたモデルを 1 回の実行だけに選択することもできます。

  </Step>
</Steps>

## 管理された非対話型デプロイ

プロキシキーはワークロードのシークレット注入に保持し、`openclaw.json` には SecretRef のみを保存してください。標準の管理対象フィールドは次のとおりです。

| 目的       | 設定または環境フィールド                                              |
| ------------- | ------------------------------------------------------------------------ |
| ルーターのオリジン | `models.providers.clawrouter.baseUrl`                                    |
| 認証情報    | `models.providers.clawrouter.apiKey` -> env SecretRef                    |
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

ドライランでは SecretRef を解決しますが、その値は決して出力しません。認証情報をローテーションするには、`CLAWROUTER_API_KEY` を供給する外部 Secret を更新し、新しいプロセス環境が読み込まれるように Gateway ワークロードを再起動してください。設定ファイルとモデル参照は変更されません。

ソースからビルドしたスタンドアロン Docker Gateway の場合、ClawRouter はすでにルートランタイムに含まれています。別個のパッケージ化が必要なチャネル Plugin のみを、`OPENCLAW_EXTENSIONS=clickclack`、`slack`、`msteams` などから選択してください。[選択した Plugin を含むソースビルドイメージ](/ja-JP/install/docker#source-built-images-with-selected-plugins)を参照してください。アーカイブまたはアプライアンス形式のデプロイでは、OCI イメージを使用するのではなく、取り込まれた同じソースを独自のアーティファクトパイプラインでパッケージ化する必要があります。

## 準備状態とライブ検証

以下のチェックはそれぞれ異なる境界を検証します。相互に代用しないでください。

```bash
# ClawRouter プロセスの稼働状態のみ。認証情報や上流モデルは使用されません。
curl -fsS https://clawrouter.internal.example/v1/health

# OpenClaw Gateway の起動準備状態のみ。モデル呼び出しは行われません。
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

例のモデルをそのままコピーせず、スコープ付きカタログから返されたモデルを使用してください。`/readyz` の応答が成功した場合、Gateway がリクエストを処理できることを意味しますが、ClawRouter、その認証情報、または上流プロバイダーの準備が完了していることまでは示しません。モデルプローブとエージェントカナリアが推論の検証になります。

ライブ診断では、カナリアを実行して Gateway の標準ログを確認してください。既存のメタデータのみのモデル転送診断では、次の形式の行が出力されます。

```text
[model-fetch] 開始 provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] 応答 provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

これらの識別子が利用可能な場合、Plugin は長さを制限した `X-ClawRouter-Client`、`X-ClawRouter-Agent-Id`、`X-ClawRouter-Session-Id` ヘッダーを送信します。また、モデル呼び出しの診断用 `callId`（`<run-id>:model:<n>`）を `X-Request-ID` にマッピングするため、OpenClaw のモデル呼び出しイベントを ClawRouter のメタデータのみの監査証跡と関連付けられます。128 文字のリクエスト ID 上限内の値は同一です。より長い値では `:model:<n>` サフィックスと決定論的ハッシュが保持されるため、個別の呼び出しは長さを制限されたまま関連付け可能です。`X-ClawRouter-Project-Id` などの静的なデプロイメタデータは、プロバイダーの `headers` マップで設定できます。エージェントおよびセッションの帰属ヘッダーには、個別の 256 文字制限が維持されます。ClawRouter の ASCII 識別子セットに含まれない文字を使用する自動リクエスト ID にも、同じ決定論的な長さ制限形式が使用されます。
大文字と小文字が異なる `X-Request-ID` を含め、明示的に設定されたヘッダーは自動値より優先されます。転送診断にはルーティングと応答のメタデータが記録されますが、認証情報、リクエスト ID、プロンプト、生成結果は記録されません。ClawRouter 自体の監査イベントには、選択された上流プロバイダーとコンテンツ保持状態が記録されます。

## モデル検出

`GET /v1/catalog` は `{ providers: [...] }` を返します。各プロバイダーエントリには、そのプロバイダー自身の `models[]`（上流 ID、機能、料金を含む）と、サポートされるリクエストルートが列挙されます。OpenClaw は ClawRouter モデルの固定された第 2 のリストを同梱しません。カタログのモデルは、次の場合に OpenClaw モデルとして公開されます。

- 認証情報のポリシーでそのプロバイダーが許可されている。
- カタログモデルが、サポートされる LLM 機能（`llm.responses`、`llm.chat`、`llm.messages`、または対応するストリーミングルートを持つ `llm.stream`）を公開している。
- プロバイダーが、以下のいずれかの転送方式に対応するルートを公開している。

サポート対象の ClawRouter プロバイダーにモデルを追加しても、OpenClaw のリリースは不要です。次回のカタログ更新（認証情報スコープごとに 60 秒間キャッシュ）で検出されます。新しいワイヤープロトコルを必要とするモデルには、先に Plugin の対応が必要です。

## プロトコルとプロバイダー Plugin

ClawRouter が上流の認証情報を管理します。カタログが使用する転送方式を OpenClaw に通知するため、上流企業ごとの認証 Plugin をすべてインストールする必要はありません。

| カタログの機能 / ルート                               | OpenClaw 転送方式     |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses`（OpenAI 互換プロバイダー）             | `openai-responses`     |
| `llm.chat`（OpenAI 互換プロバイダー）                  | `openai-completions`   |
| `llm.messages` + `anthropic.messages` ルート              | `anthropic-messages`   |
| `llm.stream` + ストリーミング `google.generate_content` ルート | `google-generative-ai` |

この Plugin は、これらのファミリーに対応する再生ポリシーとツールスキーマポリシーも適用します（OpenAI/DeepSeek/Gemini のツールスキーマ互換性、Anthropic および Google Gemini のネイティブ再生ポリシー）。サポートされていないリクエスト形式のみを公開するカタログプロバイダーは、意図的に OpenClaw テキストモデルとして公開されません。互換性のないペイロードを送信するのではなく、ClawRouter でそれらのプロバイダーをサポート対象のいずれかの契約に正規化してください。

## クォータと使用量

ClawRouter の `/v1/usage` 応答は、通常の OpenClaw プロバイダー使用量画面に反映されます。これにはリクエスト、トークン、支出の合計に加え、キーに上限がある場合は月間予算期間が含まれます。従量制限のないキーでも、割合の期間表示なしで集計使用量が表示されます。

クォータの取得には、モデル検出と同じスコープ付きキーが使用されます。クォータの取得に失敗しても、モデルの実行はブロックされません。

次のコマンドでライブスナップショットを確認します。

```bash
openclaw status --usage
openclaw models status
```

同じプロバイダースナップショットは、チャット内の `/status` と OpenClaw の使用量 UI でも利用できます。予算はポリシー全体に適用されるため、同じ ClawRouter ポリシーを使用する別のクライアントからのリクエストによって、残りの割合が変化する場合があります。

## トラブルシューティング

| 症状                                  | 確認事項                                                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter モデルがない                     | Plugin が有効で `plugins.allow` によって許可されていることを確認し、認証情報が有効で、準備完了済みのプロバイダーが少なくとも 1 つ許可されていることを確認してください。 |
| 設定済みの ClawRouter モデルが見つからない | その `/v1/catalog` の機能とルート対応状況を確認してください。サポートされていない転送契約は意図的に除外されます。                            |
| `Unknown model: clawrouter/...`          | その設定マップを許可リストとして使用している場合は、正確なカタログ参照を `agents.defaults.models` に追加してください。                               |
| カタログまたは使用量からの `401` または `403`     | ClawRouter 認証情報を再発行するかスコープを再設定してください。OpenClaw は上流プロバイダーのキーへフォールバックしません。                                          |
| 検出後にモデル呼び出しが失敗する         | ClawRouter 内のプロバイダー接続と上流の稼働状態を確認し、準備状態が回復してから再試行してください。                                |
| 使用量に合計はあるが割合がない       | ポリシーは従量制限なしです。割合の期間表示を公開するには、ClawRouter で月間予算を追加してください。                                                     |

## セキュリティ動作

- カタログ検出のスコープは設定済みのプロキシキーに限定され、認証情報のスコープ（エージェントディレクトリ、ワークスペースディレクトリ、認証プロファイル ID、ベース URL）ごとにキャッシュされます。
- プロキシキーはリクエストのディスパッチ時にのみ付加され、モデルのメタデータには保存されません。
- 自動アトリビューション値とリクエスト相関値は、ディスパッチ前に前後の空白が除去され、制御文字を含む場合は拒否されます。アトリビューション値は 256 文字、リクエスト ID は 128 文字に制限されます。
- モデルトランスポートの診断情報にはメタデータのみが含まれ、プロキシキーやモデルの内容は一切含まれません。
- ネイティブの Anthropic および Gemini モデル ID は、ディスパッチ時にのみアップストリームの ID に書き換えられます。
- サポートされていない、または許可されていないカタログ行はフェイルクローズとなり、選択できません。

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダーの設定とモデルの選択。
  </Card>
  <Card title="使用状況の追跡" href="/ja-JP/concepts/usage-tracking" icon="chart-line">
    OpenClaw の使用状況とステータスの表示。
  </Card>
</CardGroup>
