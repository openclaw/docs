---
read_when:
    - GitHub Copilot をモデルプロバイダーとして使用したい
    - '`openclaw models auth login-github-copilot` フローが必要です'
    - 組み込みの Copilot プロバイダー、Copilot SDK ハーネス、Copilot Proxy のどれを使うか選択しています
summary: デバイスフローまたは非対話型トークンインポートを使用して、OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T12:43:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot は GitHub の AI コーディングアシスタントです。GitHub アカウントとプランに応じた Copilot
モデルへのアクセスを提供します。OpenClaw は Copilot をモデル
プロバイダーまたはエージェントランタイムとして、3 つの異なる方法で使用できます。

## OpenClaw で Copilot を使用する 3 つの方法

<Tabs>
  <Tab title="組み込みプロバイダー (github-copilot)">
    ネイティブのデバイスログインフローを使って GitHub トークンを取得し、OpenClaw の実行時に
    Copilot API トークンと交換します。これは VS Code を必要としないため、**デフォルト**かつ最も簡単な手順です。

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
    選択した `github-copilot/*` モデルについて、低レベルのエージェントループを GitHub の
    Copilot CLI と SDK に任せたい場合は、外部の `@openclaw/copilot` Plugin をインストールします。

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
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

    そのエージェントターンでネイティブの Copilot CLI セッション、SDK 管理のスレッド状態、
    Copilot 所有の Compaction が必要な場合に選択します。完全なランタイム契約については
    [Copilot SDK ハーネス](/ja-JP/plugins/copilot)を参照してください。

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    ローカルブリッジとして **Copilot Proxy** VS Code 拡張機能を使用します。OpenClaw は
    プロキシの `/v1` エンドポイントと通信し、そこで設定したモデルリストを使用します。

    <Note>
    すでに VS Code で Copilot Proxy を実行している場合、またはそこを経由してルーティングする必要がある場合に選択します。
    Plugin を有効にし、VS Code 拡張機能を実行し続ける必要があります。
    </Note>

  </Tab>
</Tabs>

## 任意のフラグ

| フラグ          | 説明                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | 確認プロンプトをスキップします                      |
| `--set-default` | プロバイダー推奨のデフォルトモデルも適用します      |

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
GitHub Copilot プロバイダーの認証選択が推論されます。このフラグを省略した場合、オンボーディングは
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、次に `GITHUB_TOKEN` にフォールバックします。
`COPILOT_GITHUB_TOKEN` を設定したうえで `--secret-input-mode ref` を使用すると、
平文ではなく環境変数に基づく `tokenRef` が `auth-profiles.json` に保存されます。

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    デバイスログインフローには対話型 TTY が必要です。非対話型スクリプトや CI パイプラインではなく、
    ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="モデルの利用可否はプランによって異なります">
    Copilot モデルの利用可否は GitHub プランによって異なります。モデルが拒否された場合は、
    別の ID（例: `github-copilot/gpt-5.5`）を試してください。現在のモデルリストについては、
    GitHub の [Copilot プランごとの対応モデル](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    を参照してください。
  </Accordion>

  <Accordion title="Copilot API からのライブカタログ更新">
    デバイスログイン（または環境変数）の認証パスで GitHub トークンが解決されると、
    OpenClaw は `${baseUrl}/models`（VS Code Copilot が使用するものと同じエンドポイント）から
    必要に応じてモデルカタログを更新します。これにより、ランタイムはマニフェストの変更なしで
    アカウントごとの権利付与と正確なコンテキストウィンドウを追跡します。
    新しく公開された Copilot モデルは OpenClaw のアップグレードなしで表示され、
    コンテキストウィンドウには実際のモデルごとの制限が反映されます
    （例: gpt-5.x 系列は 400k、内部の `claude-opus-*-1m` バリアントは 1M）。

    検出が無効、ユーザーに GitHub 認証プロファイルがない、トークン交換が失敗する、
    または `/models` HTTPS 呼び出しでエラーが発生する場合、バンドルされた静的カタログが
    表示上のフォールバックとして残ります。オプトアウトして静的マニフェストカタログのみに依存するには
    （オフライン / エアギャップ環境）:

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

  <Accordion title="トランスポート選択">
    Claude モデル ID は Anthropic Messages トランスポートを自動的に使用します。GPT、
    o-series、Gemini モデルは OpenAI Responses トランスポートを維持します。OpenClaw は
    モデル参照に基づいて正しいトランスポートを選択します。
  </Accordion>

  <Accordion title="リクエスト互換性">
    OpenClaw は、組み込み Compaction、ツール結果、画像フォローアップターンを含め、
    Copilot トランスポートで Copilot IDE 形式のリクエストヘッダーを送信します。
    その動作が Copilot の API に対して検証されていない限り、Copilot でプロバイダーレベルの
    Responses 継続は有効にしません。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は次の優先順位で環境変数から Copilot 認証を解決します。

    | 優先度 | 変数                  | 備考                             |
    | ------ | --------------------- | -------------------------------- |
    | 1      | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot 固有             |
    | 2      | `GH_TOKEN`            | GitHub CLI トークン（フォールバック） |
    | 3      | `GITHUB_TOKEN`        | 標準 GitHub トークン（最低）     |

    複数の変数が設定されている場合、OpenClaw は最も優先度の高いものを使用します。
    デバイスログインフロー（`openclaw models auth login-github-copilot`）は
    トークンを認証プロファイルストアに保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="トークン保存">
    ログインは GitHub トークンを認証プロファイルストアに保存し、OpenClaw の実行時に
    Copilot API トークンと交換します。トークンを手動で管理する必要はありません。
  </Accordion>
</AccordionGroup>

<Warning>
デバイスログインコマンドには対話型 TTY が必要です。ヘッドレスセットアップが必要な場合は、
非対話型オンボーディングを使用してください。
</Warning>

## メモリ検索埋め込み

GitHub Copilot は [メモリ検索](/ja-JP/concepts/memory-search) の埋め込みプロバイダーとしても使用できます。
Copilot サブスクリプションがあり、ログイン済みであれば、OpenClaw は別の API キーなしで
埋め込みに使用できます。

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

1. OpenClaw が GitHub トークンを解決します（環境変数または認証プロファイルから）。
2. それを短命の Copilot API トークンと交換します。
3. Copilot `/models` エンドポイントに問い合わせて、利用可能な埋め込みモデルを検出します。
4. 最適なモデルを選択します（`text-embedding-3-small` を優先）。
5. Copilot `/embeddings` エンドポイントに埋め込みリクエストを送信します。

モデルの利用可否は GitHub プランによって異なります。埋め込みモデルが利用できない場合、
OpenClaw は Copilot をスキップし、次のプロバイダーを試します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と資格情報の再利用ルール。
  </Card>
</CardGroup>
