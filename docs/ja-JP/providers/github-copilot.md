---
read_when:
    - GitHub Copilot をモデルプロバイダーとして使用したい
    - '`openclaw models auth login-github-copilot` フローが必要です'
summary: デバイスフローまたは非対話型トークンインポートを使用して、OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T19:49:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot は GitHub の AI コーディングアシスタントです。GitHub アカウントとプランに応じた Copilot
モデルへのアクセスを提供します。OpenClaw は Copilot をモデル
provider として 2 つの方法で使用できます。

## OpenClaw で Copilot を使用する 2 つの方法

<Tabs>
  <Tab title="組み込み provider (github-copilot)">
    ネイティブのデバイスログインフローを使って GitHub トークンを取得し、OpenClaw の実行時に
    Copilot API トークンと交換します。これは VS Code を必要としないため、**デフォルト**かつ最も簡単な方法です。

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

        または config で指定します。

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

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 拡張機能をローカルブリッジとして使用します。OpenClaw は
    プロキシの `/v1` エンドポイントと通信し、そこで設定したモデルリストを使用します。

    <Note>
    VS Code で Copilot Proxy をすでに実行している場合、またはそれを経由してルーティングする必要がある場合に選択します。
    Plugin を有効にし、VS Code 拡張機能を実行したままにする必要があります。
    </Note>

  </Tab>
</Tabs>

## 任意のフラグ

| フラグ          | 説明                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | 確認プロンプトをスキップします                      |
| `--set-default` | provider が推奨するデフォルトモデルも適用します     |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非対話型オンボーディング

Copilot 用の GitHub OAuth アクセストークンをすでに持っている場合は、
`openclaw onboard --non-interactive` を使ったヘッドレスセットアップ中にインポートします。

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice` を省略することもできます。`--github-copilot-token` を渡すと、
GitHub Copilot provider の認証選択が推論されます。このフラグを省略した場合、オンボーディングは
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、次に `GITHUB_TOKEN` にフォールバックします。
`COPILOT_GITHUB_TOKEN` を設定したうえで `--secret-input-mode ref` を使用すると、
`auth-profiles.json` に平文で保存する代わりに、環境変数に裏付けられた `tokenRef` を保存します。

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    デバイスログインフローには対話型 TTY が必要です。非対話型スクリプトや CI パイプラインではなく、
    ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="モデルの利用可否はプランに依存します">
    Copilot モデルの利用可否は GitHub プランに依存します。モデルが
    拒否された場合は、別の ID（例: `github-copilot/gpt-4.1`）を試してください。
  </Accordion>

  <Accordion title="Copilot API からのライブカタログ更新">
    デバイスログイン（または環境変数）認証パスで GitHub トークンを解決すると、
    OpenClaw は `${baseUrl}/models`（VS Code Copilot が使用するものと同じエンドポイント）
    からオンデマンドでモデルカタログを更新します。これにより、ランタイムは
    manifest の変更なしにアカウントごとの権限と正確なコンテキストウィンドウを追跡します。
    新しく公開された Copilot モデルは OpenClaw のアップグレードなしで表示され、
    コンテキストウィンドウは実際のモデルごとの制限を反映します
    （例: gpt-5.x シリーズは 400k、内部
    `claude-opus-*-1m` バリアントは 1M）。

    探索が無効な場合、ユーザーに GitHub 認証プロファイルがない場合、トークン交換が
    失敗した場合、または `/models` HTTPS 呼び出しでエラーが発生した場合、バンドルされた静的カタログが
    表示されるフォールバックとして残ります。オプトアウトして静的 manifest カタログのみに依存するには
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

  <Accordion title="トランスポートの選択">
    Claude モデル ID は Anthropic Messages トランスポートを自動的に使用します。GPT、
    o-series、および Gemini モデルは OpenAI Responses トランスポートを維持します。OpenClaw は
    model ref に基づいて正しいトランスポートを選択します。
  </Accordion>

  <Accordion title="リクエスト互換性">
    OpenClaw は、組み込みの Compaction、ツール結果、画像フォローアップターンを含め、
    Copilot トランスポートで Copilot IDE スタイルのリクエストヘッダーを送信します。
    その挙動が Copilot の API に対して検証されていない限り、Copilot で
    provider レベルの Responses 継続は有効にしません。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は、次の優先順位で環境変数から Copilot 認証を解決します。

    | 優先度 | 変数                  | 注記                                  |
    | ------ | --------------------- | ------------------------------------- |
    | 1      | `COPILOT_GITHUB_TOKEN` | 最高優先度、Copilot 固有              |
    | 2      | `GH_TOKEN`            | GitHub CLI トークン（フォールバック） |
    | 3      | `GITHUB_TOKEN`        | 標準の GitHub トークン（最低）        |

    複数の変数が設定されている場合、OpenClaw は最も優先度の高いものを使用します。
    デバイスログインフロー（`openclaw models auth login-github-copilot`）は
    トークンを認証プロファイルストアに保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="トークンの保存">
    ログインは GitHub トークンを認証プロファイルストアに保存し、OpenClaw の実行時に
    Copilot API トークンと交換します。トークンを手動で管理する必要はありません。
  </Accordion>
</AccordionGroup>

<Warning>
デバイスログインコマンドには対話型 TTY が必要です。ヘッドレスセットアップが必要な場合は、
非対話型オンボーディングを使用してください。
</Warning>

## メモリ検索埋め込み

GitHub Copilot は [memory search](/ja-JP/concepts/memory-search) の埋め込み provider としても機能します。
Copilot サブスクリプションがあり、ログイン済みであれば、OpenClaw は別個の API キーなしで
埋め込みに使用できます。

### 自動検出

`memorySearch.provider` が `"auto"`（デフォルト）の場合、GitHub Copilot は
優先度 15 で試行されます -- ローカル埋め込みの後、OpenAI やその他の有料
provider の前です。GitHub トークンが利用可能な場合、OpenClaw は Copilot API から
利用可能な埋め込みモデルを検出し、最適なものを自動的に選択します。

### 明示的な config

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

モデルの利用可否は GitHub プランに依存します。利用可能な埋め込みモデルがない場合、
OpenClaw は Copilot をスキップし、次の provider を試します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー挙動の選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
