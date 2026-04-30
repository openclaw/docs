---
read_when:
    - GitHub Copilot をモデルプロバイダーとして使用したい場合
    - '`openclaw models auth login-github-copilot` フローが必要です'
summary: デバイスフローまたは非対話型トークンインポートを使用して、OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T05:30:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot は GitHub の AI コーディングアシスタントです。GitHub アカウントとプランで Copilot
モデルにアクセスできます。OpenClaw では Copilot をモデル
プロバイダーとして 2 つの方法で使用できます。

## OpenClaw で Copilot を使用する 2 つの方法

<Tabs>
  <Tab title="組み込みプロバイダー (github-copilot)">
    ネイティブのデバイスログインフローを使用して GitHub トークンを取得し、OpenClaw の実行時に
    それを Copilot API トークンと交換します。これは **デフォルト** で最も簡単な方法です。
    VS Code を必要としないためです。

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

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 拡張機能をローカルブリッジとして使用します。OpenClaw は
    プロキシの `/v1` エンドポイントと通信し、そこで設定したモデル一覧を使用します。

    <Note>
    すでに VS Code で Copilot Proxy を実行している場合、またはそれを経由してルーティングする必要がある場合に
    これを選択します。Plugin を有効にし、VS Code 拡張機能を実行したままにする必要があります。
    </Note>

  </Tab>
</Tabs>

## 任意のフラグ

| フラグ            | 説明                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 確認プロンプトをスキップします                        |
| `--set-default` | プロバイダーが推奨するデフォルトモデルも適用します |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非対話型オンボーディング

Copilot 用の GitHub OAuth アクセストークンをすでに持っている場合は、
ヘッドレスセットアップ中に `openclaw onboard --non-interactive` でインポートします。

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice` を省略することもできます。`--github-copilot-token` を渡すと、
GitHub Copilot プロバイダーの認証選択が推測されます。フラグを省略した場合、オンボーディングは
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、その後 `GITHUB_TOKEN` にフォールバックします。
`COPILOT_GITHUB_TOKEN` を設定した状態で `--secret-input-mode ref` を使用すると、
平文ではなく、env に基づく `tokenRef` を `auth-profiles.json` に保存できます。

<AccordionGroup>
  <Accordion title="対話型 TTY が必要です">
    デバイスログインフローには対話型 TTY が必要です。非対話型スクリプトや CI パイプラインではなく、
    ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="モデルの利用可否はプランによって異なります">
    Copilot モデルの利用可否は GitHub プランによって異なります。モデルが
    拒否された場合は、別の ID (例: `github-copilot/gpt-4.1`) を試してください。
  </Accordion>

  <Accordion title="トランスポートの選択">
    Claude モデル ID では、Anthropic Messages トランスポートが自動的に使用されます。GPT、
    o-series、Gemini モデルでは OpenAI Responses トランスポートが維持されます。OpenClaw は
    モデル参照に基づいて正しいトランスポートを選択します。
  </Accordion>

  <Accordion title="リクエスト互換性">
    OpenClaw は Copilot トランスポートで、組み込みの Compaction、ツール結果、画像フォローアップターンを含む、
    Copilot IDE 形式のリクエストヘッダーを送信します。Copilot の API に対して
    その動作が検証されていない限り、Copilot でプロバイダーレベルの Responses continuation は
    有効にしません。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は次の優先順位で環境変数から Copilot 認証を解決します。

    | 優先度 | 変数              | 注記                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot 専用 |
    | 2        | `GH_TOKEN`            | GitHub CLI トークン (フォールバック)      |
    | 3        | `GITHUB_TOKEN`        | 標準の GitHub トークン (最低)   |

    複数の変数が設定されている場合、OpenClaw は最も優先度の高いものを使用します。
    デバイスログインフロー (`openclaw models auth login-github-copilot`) は
    トークンを認証プロファイルストアに保存し、すべての環境
    変数より優先されます。

  </Accordion>

  <Accordion title="トークンの保存">
    ログインでは GitHub トークンを認証プロファイルストアに保存し、OpenClaw の実行時に
    それを Copilot API トークンと交換します。トークンを手動で管理する必要は
    ありません。
  </Accordion>
</AccordionGroup>

<Warning>
デバイスログインコマンドには対話型 TTY が必要です。ヘッドレスセットアップが必要な場合は、
非対話型オンボーディングを使用してください。
</Warning>

## メモリ検索埋め込み

GitHub Copilot は [memory search](/ja-JP/concepts/memory-search) の埋め込みプロバイダーとしても
機能できます。Copilot サブスクリプションがあり、ログイン済みであれば、
別の API キーなしで OpenClaw が埋め込みに使用できます。

### 自動検出

`memorySearch.provider` が `"auto"` (デフォルト) の場合、GitHub Copilot は
優先度 15 で試行されます -- ローカル埋め込みの後、OpenAI やその他の有料
プロバイダーの前です。GitHub トークンが利用可能な場合、OpenClaw は Copilot API から
利用可能な埋め込みモデルを検出し、最適なものを自動的に選択します。

### 明示的な設定

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

1. OpenClaw が GitHub トークンを解決します (env vars または認証プロファイルから)。
2. それを短命の Copilot API トークンと交換します。
3. 利用可能な埋め込みモデルを検出するため、Copilot `/models` エンドポイントに問い合わせます。
4. 最適なモデルを選択します (`text-embedding-3-small` を優先)。
5. 埋め込みリクエストを Copilot `/embeddings` エンドポイントに送信します。

モデルの利用可否は GitHub プランによって異なります。埋め込みモデルが
利用できない場合、OpenClaw は Copilot をスキップして次のプロバイダーを試します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と資格情報の再利用ルール。
  </Card>
</CardGroup>
