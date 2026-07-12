---
read_when:
    - GitHub Copilot をモデルプロバイダーとして使用する場合
    - '`openclaw models auth login-github-copilot` フローが必要です'
    - 組み込みの Copilot プロバイダー、Copilot SDK ハーネス、Copilot Proxy のいずれかを選択しています
summary: デバイスフローまたは非対話型トークンインポートを使用して、OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T14:47:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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
    Copilot API トークンと交換します。VS Code が不要なため、これが**デフォルト**かつ最も簡単な方法
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

        または設定ファイルで指定します。

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
    選択した `github-copilot/*` モデルの低レベルなエージェントループを GitHub の
    Copilot CLI と SDK に管理させる場合は、外部 Plugin `@openclaw/copilot` を
    インストールします。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    次に、モデルまたはプロバイダーでこのランタイムの使用を明示的に有効にします。

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

    これらのエージェントターンでネイティブ Copilot CLI セッション、SDK が管理するスレッド
    状態、および Copilot が管理する Compaction を使用する場合は、この方法を選択してください。
    `agentRuntime` を明示的に有効にしない場合、`github-copilot/*` モデルは引き続き
    組み込みプロバイダーを使用します。完全なランタイム契約については、[Copilot SDK ハーネス](/ja-JP/plugins/copilot)
    を参照してください。

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 拡張機能をローカルブリッジとして使用します。OpenClaw は
    プロキシの `/v1` エンドポイント（デフォルトは `http://localhost:3000/v1`）と通信し、
    設定したモデルリストを使用します。

    `copilot-proxy` Plugin は OpenClaw に同梱され、デフォルトで有効になっています。
    ベース URL とモデル ID は次のコマンドで設定します。

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    VS Code ですでに Copilot Proxy を実行している場合、またはそれを経由してルーティングする
    必要がある場合は、この方法を選択してください。VS Code 拡張機能を実行したままにする必要があります。
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise（データ所在地）

組織でデータ所在地に対応した GitHub Enterprise テナント（`your-org.ghe.com` のような
`*.ghe.com` ホスト）を使用している場合、Copilot は公開 `github.com` ではなく
テナントローカルのエンドポイントに配置されます。OpenClaw ではこれを第一級の認証選択肢として
提供するため、URL を手動で編集する必要はありません。

<Steps>
  <Step title="Enterprise 認証オプションを選択する">
    オンボーディングまたは `openclaw models auth` で、
    **GitHub Copilot (Enterprise / data residency)** を選択します。Enterprise
    ドメイン（例: `your-org.ghe.com`）の入力を求められ、その後そのテナントに対して
    デバイスログインが実行されます。

    テナントルート（`your-org.ghe.com`）のみを入力してください。`api.your-org.ghe.com` や
    `copilot-api.your-org.ghe.com` のような派生サービスホストは受け付けられません。
    OpenClaw がテナントルートからこれらのエンドポイントを自動的に導出します。

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="ドメインは設定に永続化される">
    選択したホストはプロバイダーパラメーターに保存されるため、以降のトークン更新と
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
ドメインを切り替えると、必ずデバイスログインが再実行されます。保存済みの
Copilot トークンがある状態で別のドメイン（公開 `github.com` ↔ `*.ghe.com`
テナント、またはあるテナントから別のテナント）を選択しても、OpenClaw は既存のトークンを再利用しません。
設定に書き込むドメインにトークンのスコープを限定するため、新規ログインを強制します。
*同じ*ドメインでログインを再実行した場合は、引き続き現在のトークンを再利用する選択肢が提示されます。
公開 `github.com` に戻すと、永続化された `githubDomain` が消去され、
設定はデフォルトに戻ります。
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` 環境変数は、ドメインを解決するすべての Copilot パスで
解決済みドメインを上書きします。対象には Enterprise デバイスログイン
（`--method device-enterprise`）、単独の
`openclaw models auth login-github-copilot` ショートカット、トークン更新、埋め込み、
補完が含まれます。完全なヘッドレス環境または CI セットアップでは、これを `*.ghe.com` ホストに
設定してください。公開 `github.com` を使用する場合は未設定のままにし、設定パラメーターも
指定しないでください。ログイン時には、トークンを発行したドメインが永続化されます
（公開 `github.com` に対してログインした場合は消去されます）。そのため、
環境変数を解除した後もルーティングは正しく維持されます。
</Note>

## オプションのフラグ

| コマンド                                                               | フラグ          | 説明                                                       |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 確認を求めずに既存の認証プロファイルを上書きする             |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | プロバイダーが推奨するデフォルトモデルも適用する             |

```bash
# 再ログインの確認を省略
openclaw models auth login-github-copilot --yes

# 1 つの手順でログインしてデフォルトモデルを設定
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

`--auth-choice` を省略することもできます。`--github-copilot-token` を渡すと、
GitHub Copilot プロバイダーの認証オプションが推論されます。このフラグを省略した場合、オンボーディングは
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN` の順にフォールバックします。
`COPILOT_GITHUB_TOKEN` を設定した状態で `--secret-input-mode ref` を使用すると、
`auth-profiles.json` にプレーンテキストではなく環境変数を参照する `tokenRef` が保存されます。

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    デバイスログインフローには対話型 TTY が必要です。非対話型スクリプトや
    CI パイプラインではなく、ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="モデルの利用可否はプランによって異なる">
    Copilot モデルの利用可否は GitHub プランによって異なります。モデルが
    拒否された場合は、別の ID（例: `github-copilot/gpt-5.5`）を試してください。
    最新のモデルリストについては、GitHub の
    [Copilot プランごとの対応モデル](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    を参照してください。
  </Accordion>

  <Accordion title="Copilot API からのライブカタログ更新">
    デバイスログイン（または環境変数）による認証パスで GitHub トークンが解決されると、
    OpenClaw は `${baseUrl}/models`（VS Code Copilot が使用するものと同じエンドポイント）から
    必要に応じてモデルカタログを更新します。これにより、マニフェストを頻繁に変更することなく、
    ランタイムはアカウントごとの利用資格と正確なコンテキストウィンドウを追跡できます。
    新しく公開された Copilot モデルは OpenClaw をアップグレードせずに表示されるようになり、
    コンテキストウィンドウには実際のモデルごとの制限が反映されます
    （例: gpt-5.x シリーズでは 400k、内部の
    `claude-opus-*-1m` バリアントでは 1M）。

    検出が無効である場合、ユーザーに GitHub 認証プロファイルがない場合、トークン交換が
    失敗した場合、または `/models` HTTPS 呼び出しでエラーが発生した場合は、同梱の静的カタログが
    表示上のフォールバックとして維持されます。無効化して静的マニフェストカタログのみに
    依存するには（オフライン環境またはエアギャップ環境）:

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
    Gemini モデルでは OpenAI Chat Completions トランスポートが使用され、GPT および o-series
    モデルでは引き続き OpenAI Responses トランスポートが使用されます。OpenClaw はモデル参照に基づいて
    適切なトランスポートを選択します。
  </Accordion>

  <Accordion title="リクエストの互換性">
    OpenClaw は Copilot トランスポートで Copilot IDE 形式のリクエストヘッダー
    （VS Code エディター/Plugin のバージョンおよび `vscode-chat` インテグレーション ID）を送信し、
    ツール結果に続くターンをエージェント起点としてマークし、ターンに画像入力が含まれる場合は Copilot
    ビジョンヘッダーを設定します。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は、次の優先順位で環境変数から Copilot 認証を解決します。

    | 優先順位 | 変数                   | 備考                                  |
    | -------- | ---------------------- | ------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot 固有                  |
    | 2        | `GH_TOKEN`             | GitHub CLI トークン（フォールバック） |
    | 3        | `GITHUB_TOKEN`         | 標準 GitHub トークン（最低優先度）    |

    複数の変数が設定されている場合、OpenClaw は最も優先度の高いものを使用します。
    デバイスログインフロー（`openclaw models auth login-github-copilot`）は
    トークンを認証プロファイルストアに保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="トークンの保存">
    ログインにより、GitHub トークンが認証プロファイルストア（プロファイル ID
    `github-copilot:github`）に保存され、OpenClaw の実行時に有効期間の短い Copilot API
    トークンと交換されます。トークンを手動で管理する必要はありません。
  </Accordion>
</AccordionGroup>

## メモリ検索の埋め込み

GitHub Copilot は、[メモリ検索](/ja-JP/concepts/memory-search)の埋め込みプロバイダーとしても
使用できます。Copilot サブスクリプションを契約し、ログイン済みであれば、
OpenClaw は個別の API キーなしで Copilot を埋め込みに使用できます。

### 設定

GitHub Copilot の埋め込みを使用するには、`memorySearch.provider` を明示的に設定します。
GitHub トークンが利用可能な場合、OpenClaw は Copilot API から利用可能な埋め込みモデルを
検出し、最適なモデルを自動的に選択します。

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

### 動作の仕組み

1. OpenClaw が GitHub トークンを解決します（環境変数または認証プロファイルから）。
2. 有効期間の短い Copilot API トークンと交換します。
3. Copilot の `/models` エンドポイントに問い合わせ、利用可能な埋め込みモデルを検出します。
4. 最適なモデルを選択します（優先順位: `text-embedding-3-small`、
   `text-embedding-3-large`、`text-embedding-ada-002`）。
5. Copilot の `/embeddings` エンドポイントに埋め込みリクエストを送信します。

モデルの利用可否は GitHub プランによって異なります。利用可能な埋め込みモデルがない場合、
OpenClaw は Copilot をスキップして次のプロバイダーを試します。

## 関連情報

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
