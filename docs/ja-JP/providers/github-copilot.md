---
read_when:
    - GitHub Copilot をモデルプロバイダーとして使用したい場合
    - '`openclaw models auth login-github-copilot` フローが必要です'
    - 組み込みの Copilot プロバイダー、Copilot SDK ハーネス、Copilot Proxy のいずれかを選択しています
summary: デバイスフローまたは非対話型トークンインポートを使用して、OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-11T22:36:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot は GitHub の AI コーディングアシスタントです。GitHub アカウントとプランで利用可能な Copilot
モデルへのアクセスを提供します。OpenClaw では、Copilot をモデル
プロバイダーまたはエージェントランタイムとして、3 つの異なる方法で使用できます。

## OpenClaw で Copilot を使用する 3 つの方法

<Tabs>
  <Tab title="組み込みプロバイダー (github-copilot)">
    ネイティブのデバイスログインフローを使用して GitHub トークンを取得し、OpenClaw の実行時に
    Copilot API トークンと交換します。VS Code を必要としないため、これが**デフォルト**かつ最も簡単な方法
    です。

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

        または設定内で指定します。

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
    Copilot CLI と SDK に低レベルのエージェントループを管理させる場合は、外部の
    `@openclaw/copilot` Plugin をインストールします。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    次に、モデルまたはプロバイダーでこのランタイムを明示的に有効化します。

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

    ネイティブの Copilot CLI セッション、SDK が管理するスレッド
    状態、および Copilot が管理するエージェントターンの Compaction を使用する場合は、この方法を選択します。
    `agentRuntime` で明示的に有効化しない場合、`github-copilot/*` モデルは引き続き
    組み込みプロバイダーを使用します。ランタイムの完全な契約については、[Copilot SDK ハーネス](/ja-JP/plugins/copilot)を
    参照してください。

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 拡張機能をローカルブリッジとして使用します。OpenClaw は
    プロキシの `/v1` エンドポイント（デフォルトは `http://localhost:3000/v1`）と通信し、設定した
    モデル一覧を使用します。

    `copilot-proxy` Plugin は OpenClaw に同梱され、デフォルトで有効になっています。
    次のコマンドでベース URL とモデル ID を設定します。

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    VS Code ですでに Copilot Proxy を実行している場合、または
    それを経由してルーティングする必要がある場合は、この方法を選択します。VS Code 拡張機能は実行したままにする必要があります。
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise（データ所在地）

組織がデータ所在地対応の GitHub Enterprise テナント（
`your-org.ghe.com` のような `*.ghe.com` ホスト）を使用している場合、Copilot は公開
`github.com` ではなく、テナントローカルのエンドポイント上で動作します。OpenClaw ではこれを
正式な認証選択肢として提供しているため、URL を手動で編集する必要はありません。

<Steps>
  <Step title="Enterprise 認証オプションを選択する">
    オンボーディングまたは `openclaw models auth` で、
    **GitHub Copilot (Enterprise / data residency)** を選択します。Enterprise ドメイン
    （例: `your-org.ghe.com`）の入力を求められ、その後、そのテナントに対してデバイス
    ログインが実行されます。

    テナントルートのみ（`your-org.ghe.com`）を入力してください。
    `api.your-org.ghe.com` や `copilot-api.your-org.ghe.com` などの派生サービスホストは受け付けられません。
    OpenClaw がテナントルートからこれらのエンドポイントを自動的に導出します。

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="ドメインが設定に保存される">
    選択したホストはプロバイダーのパラメーターに保存されるため、以降のトークン更新と
    補完は自動的にそのテナントを対象とします。

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

デバイスフロー、トークン交換、補完はそれぞれ
`https://your-org.ghe.com/login/device/code`、
`https://api.your-org.ghe.com/copilot_internal/v2/token`、
`https://copilot-api.your-org.ghe.com` に解決されます。データ所在地対応トークンには
テナントスタンプが含まれ、プロキシヒントは含まれないため、補完のベース URL は公開エンドポイントではなく
テナントの Copilot ホストにフォールバックします。

<Note>
ドメインを切り替えると、必ずデバイスログインが再実行されます。Copilot トークンがすでに保存されていて
別のドメイン（公開 `github.com` ↔ `*.ghe.com`
テナント、またはテナント間）を選択した場合、OpenClaw は既存のトークンを再利用しません。
設定に書き込まれるドメインにトークンのスコープが限定されるよう、再ログインを強制します。
*同じ*ドメインでログインを再実行した場合は、現在のトークンを再利用する選択肢が引き続き表示されます。
公開 `github.com` に戻すと、保存された
`githubDomain` がクリアされ、設定はデフォルトに戻ります。
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` 環境変数は、ドメインを解決するすべての Copilot 経路で
解決済みドメインを上書きします。対象には Enterprise デバイスログイン
（`--method device-enterprise`）、スタンドアロンの
`openclaw models auth login-github-copilot` ショートカット、トークン更新、埋め込み、
補完が含まれます。完全なヘッドレス環境または CI 環境では、`*.ghe.com` ホストを設定してください。
公開 `github.com` を使用する場合は、この変数を未設定のままにし、設定パラメーターも指定しないでください。
ログインでは、トークンが発行されたドメインが保存されます（公開 `github.com` に対してログインした場合はクリアされます）。
そのため、環境変数を解除した後もルーティングは正しく維持されます。
</Note>

## オプションフラグ

| コマンド                                                               | フラグ          | 説明                                                     |
| ---------------------------------------------------------------------- | --------------- | -------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 確認せずに既存の認証プロファイルを上書きする             |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | プロバイダー推奨のデフォルトモデルも適用する             |

```bash
# 再ログインの確認をスキップ
openclaw models auth login-github-copilot --yes

# ログインとデフォルトモデルの設定を一度に実行
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非対話型オンボーディング

デバイスログインフローには対話型 TTY が必要です。ヘッドレスセットアップでは、
`openclaw onboard --non-interactive` を使用して既存の GitHub OAuth アクセストークンをインポートします。

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice` は省略することもできます。`--github-copilot-token` を渡すと、
GitHub Copilot プロバイダーの認証選択肢が推論されます。このフラグを省略すると、オンボーディングは
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` の順にフォールバックします。
`COPILOT_GITHUB_TOKEN` を設定したうえで `--secret-input-mode ref` を使用すると、
`auth-profiles.json` に平文ではなく、環境変数を参照する
`tokenRef` が保存されます。

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    デバイスログインフローには対話型 TTY が必要です。非対話型スクリプトや CI パイプラインではなく、
    ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="利用可能なモデルはプランによって異なる">
    利用可能な Copilot モデルは GitHub プランによって異なります。モデルが
    拒否された場合は、別の ID（例: `github-copilot/gpt-5.5`）を試してください。現在のモデル一覧については、
    GitHub の[Copilot プランごとの対応モデル](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    を参照してください。
  </Accordion>

  <Accordion title="Copilot API からのライブカタログ更新">
    デバイスログイン（または環境変数）の認証経路で GitHub トークンが解決されると、
    OpenClaw は必要に応じて `${baseUrl}/models`
    （VS Code Copilot が使用するものと同じエンドポイント）からモデルカタログを更新します。これにより、マニフェストを
    頻繁に変更することなく、ランタイムがアカウントごとの利用権限と正確なコンテキストウィンドウを追跡できます。
    新しく公開された Copilot モデルは OpenClaw をアップグレードしなくても表示されるようになり、
    コンテキストウィンドウにはモデルごとの実際の上限が反映されます
    （例: gpt-5.x シリーズは 400k、内部の
    `claude-opus-*-1m` バリアントは 1M）。

    検出が無効な場合、ユーザーに GitHub 認証プロファイルがない場合、トークン交換に
    失敗した場合、または `/models` への HTTPS 呼び出しでエラーが発生した場合、同梱の静的カタログが
    表示用のフォールバックとして維持されます。オプトアウトして静的なマニフェストカタログのみに
    依存するには（オフラインまたはエアギャップ環境）次のように設定します。

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
    Claude モデル ID では Anthropic Messages トランスポートが自動的に使用されます。
    Gemini モデルでは OpenAI Chat Completions トランスポートが使用され、GPT および o シリーズ
    モデルでは引き続き OpenAI Responses トランスポートが使用されます。OpenClaw はモデル参照に基づいて
    適切なトランスポートを選択します。
  </Accordion>

  <Accordion title="リクエストの互換性">
    OpenClaw は Copilot トランスポートで Copilot IDE 形式のリクエストヘッダー
    （VS Code エディター／Plugin のバージョンと `vscode-chat` 統合 ID）を送信し、
    ツール結果に続くターンをエージェント起点としてマークします。また、ターンに画像入力が含まれる場合は Copilot
    ビジョンヘッダーを設定します。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は以下の優先順位で環境変数から Copilot 認証を解決します。

    | 優先順位 | 変数                   | 注記                                      |
    | -------- | ---------------------- | ----------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot 固有                     |
    | 2        | `GH_TOKEN`             | GitHub CLI トークン（フォールバック）     |
    | 3        | `GITHUB_TOKEN`         | 標準 GitHub トークン（優先順位が最も低い） |

    複数の変数が設定されている場合、OpenClaw は最も優先順位の高いものを使用します。
    デバイスログインフロー（`openclaw models auth login-github-copilot`）は
    トークンを認証プロファイルストアに保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="トークンの保存">
    ログインでは GitHub トークンが認証プロファイルストア（プロファイル ID
    `github-copilot:github`）に保存され、OpenClaw の実行時に有効期間の短い Copilot API
    トークンと交換されます。トークンを手動で管理する必要はありません。
  </Accordion>
</AccordionGroup>

## メモリ検索の埋め込み

GitHub Copilot は、[メモリ検索](/ja-JP/concepts/memory-search)用の
埋め込みプロバイダーとしても機能します。Copilot サブスクリプションがあり、
ログイン済みであれば、OpenClaw は別の API キーなしで埋め込みに Copilot を使用できます。

### 設定

GitHub Copilot の埋め込みを使用するには、`memorySearch.provider` を明示的に設定します。
GitHub トークンが利用可能な場合、OpenClaw は Copilot API から利用可能な埋め込みモデルを検出し、
最適なモデルを自動的に選択します。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // オプション: 自動検出されたモデルを上書き
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 仕組み

1. OpenClaw が GitHub トークン（環境変数または認証プロファイルから）を解決します。
2. 有効期間の短い Copilot API トークンと交換します。
3. Copilot の `/models` エンドポイントを照会して、利用可能な埋め込みモデルを検出します。
4. 最適なモデルを選択します（優先順位: `text-embedding-3-small`、
   `text-embedding-3-large`、`text-embedding-ada-002`）。
5. Copilot の `/embeddings` エンドポイントに埋め込みリクエストを送信します。

利用可能なモデルは GitHub プランによって異なります。利用可能な埋め込みモデルがない場合、
OpenClaw は Copilot をスキップして次のプロバイダーを試します。

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
