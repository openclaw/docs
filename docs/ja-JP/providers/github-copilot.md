---
read_when:
    - GitHub Copilot をモデルプロバイダーとして使用したい
    - '`openclaw models auth login-github-copilot` フローが必要です'
    - 組み込みの Copilot プロバイダー、Copilot SDK ハーネス、Copilot Proxy のいずれかを選択しています
summary: デバイスフローまたは非対話型トークンインポートを使って OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-05T11:40:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8af0ed48af8586da0e2bd922e3a674b73c57fdaf25ae5a3a7988e38a467cab7f
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot は GitHub の AI コーディングアシスタントです。GitHub アカウントとプラン向けの Copilot
モデルへのアクセスを提供します。OpenClaw は Copilot をモデル
プロバイダーまたはエージェントランタイムとして、3 つの異なる方法で使用できます。

## OpenClaw で Copilot を使用する 3 つの方法

<Tabs>
  <Tab title="組み込みプロバイダー (github-copilot)">
    ネイティブのデバイスログインフローを使用して GitHub トークンを取得し、OpenClaw の実行時に
    Copilot API トークンと交換します。これは VS Code を必要としないため、**デフォルト**で最も簡単な方法です。

    <Steps>
      <Step title="ログインコマンドを実行する">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL にアクセスしてワンタイムコードを入力するよう求められます。完了するまで
        ターミナルを開いたままにしてください。
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        または設定で指定します。

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot SDK ハーネス Plugin (copilot)">
    選択した `github-copilot/*` モデルについて、GitHub の
    Copilot CLI と SDK に低レベルのエージェントループを所有させたい場合は、外部の `@openclaw/copilot` Plugin をインストールします。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    次に、モデルまたはプロバイダーをランタイムにオプトインします。

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    これらのエージェントターンで、ネイティブの Copilot CLI セッション、SDK 管理のスレッド状態、
    Copilot 所有の Compaction が必要な場合に選択します。明示的な
    `agentRuntime` オプトインがない場合、`github-copilot/*` モデルは引き続き
    組み込みプロバイダーを使用します。完全なランタイム契約については [Copilot SDK ハーネス](/ja-JP/plugins/copilot) を参照してください。

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 拡張機能をローカルブリッジとして使用します。OpenClaw は
    プロキシの `/v1` エンドポイント (デフォルトは `http://localhost:3000/v1`) と通信し、
    設定したモデル一覧を使用します。

    `copilot-proxy` Plugin は OpenClaw に同梱されており、デフォルトで有効です。
    ベース URL とモデル ID は次で設定します。

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    すでに VS Code で Copilot Proxy を実行している場合、またはそれを経由してルーティングする必要がある場合に選択します。VS Code 拡張機能は実行したままにする必要があります。
    </Note>

  </Tab>
</Tabs>

## 任意のフラグ

| コマンド                                                               | フラグ          | 説明                                                 |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 確認なしで既存の認証プロファイルを上書きする         |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | プロバイダー推奨のデフォルトモデルも適用する         |

```bash
# Skip the re-login confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非対話型オンボーディング

デバイスログインフローには対話型 TTY が必要です。ヘッドレスセットアップでは、
`openclaw onboard --non-interactive` で既存の GitHub OAuth アクセストークンをインポートします。

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice` を省略することもできます。`--github-copilot-token` を渡すと、
GitHub Copilot プロバイダーの認証選択として推論されます。フラグを省略した場合、
オンボーディングは `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、次に `GITHUB_TOKEN` へフォールバックします。
`COPILOT_GITHUB_TOKEN` を設定したうえで `--secret-input-mode ref` を使用すると、
`auth-profiles.json` にプレーンテキストではなく環境変数ベースの
`tokenRef` を保存できます。

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    デバイスログインフローには対話型 TTY が必要です。非対話型スクリプトや CI パイプラインではなく、
    ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="モデルの利用可否はプランに依存します">
    Copilot モデルの利用可否は GitHub プランに依存します。モデルが
    拒否された場合は、別の ID (例: `github-copilot/gpt-5.5`) を試してください。現在のモデル一覧については、
    GitHub の [Copilot プランごとの対応モデル](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    を参照してください。
  </Accordion>

  <Accordion title="Copilot API からのライブカタログ更新">
    デバイスログイン (または環境変数) の認証パスで GitHub トークンが解決されると、
    OpenClaw は `${baseUrl}/models` (VS Code Copilot が使用するものと同じエンドポイント)
    からオンデマンドでモデルカタログを更新するため、ランタイムは
    アカウントごとの権限と正確なコンテキストウィンドウをマニフェストの変更なしで追跡できます。
    新しく公開された Copilot モデルは OpenClaw のアップグレードなしで表示され、
    コンテキストウィンドウは実際のモデルごとの制限を反映します
    (例: gpt-5.x シリーズは 400k、内部
    `claude-opus-*-1m` バリアントは 1M)。

    検出が無効な場合、ユーザーに GitHub 認証プロファイルがない場合、トークン交換に
    失敗した場合、または `/models` HTTPS 呼び出しでエラーが発生した場合、同梱の静的カタログが表示上のフォールバックとして残ります。
    オプトアウトして、静的マニフェストカタログのみに依存するには (オフライン / エアギャップ環境):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="トランスポートの選択">
    Claude モデル ID は Anthropic Messages トランスポートを自動的に使用します。
    Gemini モデルは OpenAI Chat Completions トランスポートを使用し、GPT と o-series
    モデルは OpenAI Responses トランスポートを維持します。OpenClaw はモデル参照に基づいて
    正しいトランスポートを選択します。
  </Accordion>

  <Accordion title="リクエスト互換性">
    OpenClaw は Copilot トランスポートで Copilot IDE 形式のリクエストヘッダー
    (VS Code エディター/Plugin バージョンと `vscode-chat` 統合 ID) を送信し、
    ツール結果のフォローアップターンをエージェント起点としてマークし、ターンが画像入力を含む場合は Copilot
    ビジョンヘッダーを設定します。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は次の優先順位で環境変数から Copilot 認証を解決します。

    | 優先度 | 変数                  | 注記                                 |
    | ------ | --------------------- | ------------------------------------ |
    | 1      | `COPILOT_GITHUB_TOKEN` | 最高優先度、Copilot 固有             |
    | 2      | `GH_TOKEN`            | GitHub CLI トークン (フォールバック) |
    | 3      | `GITHUB_TOKEN`        | 標準の GitHub トークン (最低)        |

    複数の変数が設定されている場合、OpenClaw は最も優先度の高いものを使用します。
    デバイスログインフロー (`openclaw models auth login-github-copilot`) は
    そのトークンを認証プロファイルストアに保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="トークン保存">
    ログインは GitHub トークンを認証プロファイルストア (プロファイル ID
    `github-copilot:github`) に保存し、OpenClaw の実行時に短命の Copilot API
    トークンと交換します。トークンを手動で管理する必要はありません。
  </Accordion>
</AccordionGroup>

## メモリ検索埋め込み

GitHub Copilot は [メモリ検索](/ja-JP/concepts/memory-search) の埋め込みプロバイダーとしても機能できます。
Copilot サブスクリプションがあり、ログイン済みであれば、
OpenClaw は別個の API キーなしで埋め込みに使用できます。

### 設定

GitHub Copilot 埋め込みを使用するには、`memorySearch.provider` を明示的に設定します。
GitHub トークンが利用可能な場合、OpenClaw は Copilot API から利用可能な埋め込みモデルを検出し、
最適なものを自動的に選択します。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 仕組み

1. OpenClaw が GitHub トークンを解決します (環境変数または認証プロファイルから)。
2. それを短命の Copilot API トークンと交換します。
3. Copilot `/models` エンドポイントを照会して、利用可能な埋め込みモデルを検出します。
4. 最適なモデルを選択します (優先順: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`)。
5. 埋め込みリクエストを Copilot `/embeddings` エンドポイントへ送信します。

モデルの利用可否は GitHub プランに依存します。利用可能な埋め込みモデルがない場合、
OpenClaw は Copilot をスキップし、次のプロバイダーを試します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
