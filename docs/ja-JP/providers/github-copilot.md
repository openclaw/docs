---
read_when:
    - model provider として GitHub Copilot を使いたい場合
    - '`openclaw models auth login-github-copilot` フローが必要な場合'
summary: デバイスフローを使って OpenClaw から GitHub Copilot にサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T04:50:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7faafbd3bdcd8886e75fb0d40c3eec66355df3fca6160ebbbb9a0018b7839fe
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot は GitHub の AI コーディングアシスタントです。GitHub アカウントとプランに応じて、Copilot
model へのアクセスを提供します。OpenClaw は Copilot を model
provider として 2 つの異なる方法で使用できます。

## OpenClaw で Copilot を使う 2 つの方法

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    ネイティブの device-login フローを使用して GitHub token を取得し、その後 OpenClaw 実行時に
    Copilot API token へ交換します。これが **デフォルト** で最も簡単な方法です。
    VS Code を必要としないためです。

    <Steps>
      <Step title="ログインコマンドを実行する">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL にアクセスして一時コードを入力するよう求められます。完了するまで
        terminal は開いたままにしてください。
      </Step>
      <Step title="デフォルト model を設定する">
        ```bash
        openclaw models set github-copilot/claude-opus-4.6
        ```

        または config で:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.6" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 拡張をローカル bridge として使用します。OpenClaw は
    proxy の `/v1` endpoint と通信し、そこで設定した model 一覧を使用します。

    <Note>
    すでに VS Code で Copilot Proxy を動かしている場合や、それ経由でルーティングしたい場合はこれを選んでください。
    Plugin を有効化し、VS Code 拡張を起動したままにしておく必要があります。
    </Note>

  </Tab>
</Tabs>

## 任意フラグ

| Flag | 説明 |
| --------------- | --------------------------------------------------- |
| `--yes` | 確認プロンプトをスキップする |
| `--set-default` | provider 推奨のデフォルト model も適用する |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="対話型 TTY が必要">
    device-login フローには対話型 TTY が必要です。非対話スクリプトや CI パイプラインではなく、
    terminal で直接実行してください。
  </Accordion>

  <Accordion title="model の可用性はプランに依存する">
    Copilot の model 可用性は GitHub のプランに依存します。model が
    拒否される場合は、別の ID（たとえば `github-copilot/gpt-4.1`）を試してください。
  </Accordion>

  <Accordion title="トランスポートの選択">
    Claude の model ID は自動的に Anthropic Messages transport を使用します。GPT、
    o-series、Gemini model は OpenAI Responses transport を使い続けます。OpenClaw は
    model ref に基づいて正しい transport を選択します。
  </Accordion>

  <Accordion title="環境変数の解決順序">
    OpenClaw は Copilot auth を次の優先順位で環境変数から解決します。

    | 優先順位 | 変数 | 注記 |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot 固有 |
    | 2        | `GH_TOKEN`            | GitHub CLI token（フォールバック） |
    | 3        | `GITHUB_TOKEN`        | 標準 GitHub token（最下位） |

    複数の変数が設定されている場合、OpenClaw は最優先のものを使います。
    device-login フロー（`openclaw models auth login-github-copilot`）は
    auth profile store に token を保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="token の保存">
    ログインでは GitHub token を auth profile store に保存し、OpenClaw 実行時にそれを
    Copilot API token に交換します。token を手動管理する必要はありません。
  </Accordion>
</AccordionGroup>

<Warning>
対話型 TTY が必要です。ログインコマンドは headless script や CI job の中ではなく、
terminal で直接実行してください。
</Warning>

## メモリ検索 embedding

GitHub Copilot は
[memory search](/ja-JP/concepts/memory-search) 用の embedding provider としても利用できます。Copilot サブスクリプションがあり、
ログイン済みであれば、OpenClaw は別の API キーなしで embedding に使用できます。

### 自動検出

`memorySearch.provider` が `"auto"`（デフォルト）の場合、GitHub Copilot は
優先度 15 で試されます。これはローカル embedding の後、OpenAI や他の有料
provider の前です。GitHub token が利用可能なら、OpenClaw は
Copilot API から利用可能な embedding model を検出し、自動で最適なものを選びます。

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

1. OpenClaw が GitHub token を解決します（env var または auth profile から）。
2. それを短命の Copilot API token に交換します。
3. Copilot の `/models` endpoint に問い合わせ、利用可能な embedding model を検出します。
4. 最適な model を選びます（`text-embedding-3-small` を優先）。
5. embedding リクエストを Copilot の `/embeddings` endpoint に送信します。

model の可用性は GitHub のプランに依存します。embedding model が
利用できない場合、OpenClaw は Copilot をスキップして次の provider を試します。

## 関連

<CardGroup cols={2}>
  <Card title="model 選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover 動作の選び方。
  </Card>
  <Card title="OAuth と auth" href="/ja-JP/gateway/authentication" icon="key">
    auth の詳細と credential 再利用ルール。
  </Card>
</CardGroup>
