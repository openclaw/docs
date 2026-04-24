---
read_when:
    - モデルプロバイダーとしてGitHub Copilotを使いたい場合
    - '`openclaw models auth login-github-copilot`フローが必要な場合'
summary: デバイスフローを使ってOpenClawからGitHub Copilotにサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T05:14:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub CopilotはGitHubのAIコーディングアシスタントです。GitHubアカウントとプランに対して、Copilot
モデルへのアクセスを提供します。OpenClawでは、Copilotをモデル
プロバイダーとして2つの異なる方法で利用できます。

## OpenClawでCopilotを使う2つの方法

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    ネイティブのdevice-loginフローを使ってGitHub tokenを取得し、その後OpenClaw実行時に
    Copilot API tokenへ交換します。これは**デフォルト**かつ最も簡単な経路です。
    VS Codeを必要としないためです。

    <Steps>
      <Step title="ログインコマンドを実行する">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URLへアクセスしてワンタイムコードを入力するよう促されます。完了するまで
        ターミナルは開いたままにしてください。
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        または設定で:

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
    **Copilot Proxy** VS Code拡張機能をローカルブリッジとして使います。OpenClawは
    プロキシの`/v1`エンドポイントと通信し、そこで設定したモデル一覧を使用します。

    <Note>
    すでにVS CodeでCopilot Proxyを実行している場合、または
    それ経由でルーティングする必要がある場合は、こちらを選んでください。Pluginを有効化し、
    VS Code拡張機能を起動したままにしておく必要があります。
    </Note>

  </Tab>
</Tabs>

## 任意フラグ

| フラグ | 説明 |
| --------------- | --------------------------------------------------- |
| `--yes`         | 確認プロンプトをスキップ |
| `--set-default` | プロバイダー推奨のデフォルトモデルも適用する |

```bash
# 確認をスキップ
openclaw models auth login-github-copilot --yes

# ログインしてデフォルトモデルも一度に設定
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    device-loginフローには対話型TTYが必要です。非対話スクリプトやCIパイプラインではなく、
    ターミナルで直接実行してください。
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Copilotのモデル可用性はGitHubプランに依存します。モデルが
    拒否された場合は、別のID（たとえば`github-copilot/gpt-4.1`）を試してください。
  </Accordion>

  <Accordion title="Transport selection">
    ClaudeモデルIDは自動的にAnthropic Messagesトランスポートを使用します。GPT、
    o-series、およびGeminiモデルはOpenAI Responsesトランスポートを維持します。OpenClawは
    モデル参照に基づいて正しいトランスポートを選択します。
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClawは、Copilot認証を次の優先順位で環境変数から解決します。

    | 優先順位 | 変数 | 注記 |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最優先、Copilot専用 |
    | 2        | `GH_TOKEN`            | GitHub CLI token（フォールバック） |
    | 3        | `GITHUB_TOKEN`        | 標準GitHub token（最低優先） |

    複数の変数が設定されている場合、OpenClawは最優先のものを使用します。
    device-loginフロー（`openclaw models auth login-github-copilot`）は
    tokenをauth profileストアへ保存し、すべての環境変数より優先されます。

  </Accordion>

  <Accordion title="Token storage">
    このログインは、GitHub tokenをauth profileストアへ保存し、OpenClaw実行時に
    Copilot API tokenへ交換します。手動でtokenを管理する必要はありません。
  </Accordion>
</AccordionGroup>

<Warning>
対話型TTYが必要です。ログインコマンドは、ヘッドレススクリプトやCIジョブの中ではなく、
ターミナルで直接実行してください。
</Warning>

## メモリ検索の埋め込み

GitHub Copilotは、
[memory search](/ja-JP/concepts/memory-search)向けの埋め込みプロバイダーとしても使用できます。Copilotサブスクリプションがあり、
ログイン済みであれば、OpenClawは別個のAPI keyなしで
埋め込みにそれを使用できます。

### 自動検出

`memorySearch.provider`が`"auto"`（デフォルト）の場合、GitHub Copilotは
優先度15で試されます。ローカル埋め込みの後、OpenAIやその他の有料
プロバイダーの前です。GitHub tokenが利用可能であれば、OpenClawは
Copilot APIから利用可能な埋め込みモデルを検出し、最適なものを自動選択します。

### 明示設定

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 任意: 自動検出されたモデルを上書き
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 仕組み

1. OpenClawがGitHub tokenを解決する（env varsまたはauth profileから）。
2. それを短命なCopilot API tokenへ交換する。
3. Copilotの`/models`エンドポイントへ問い合わせて、利用可能な埋め込みモデルを検出する。
4. 最適なモデルを選ぶ（`text-embedding-3-small`を優先）。
5. Copilotの`/embeddings`エンドポイントへ埋め込みリクエストを送る。

モデル可用性はGitHubプランに依存します。埋め込みモデルが
利用できない場合、OpenClawはCopilotをスキップして次のプロバイダーを試します。

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、およびフェイルオーバー動作の選び方。
  </Card>
  <Card title="OAuth and auth" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と資格情報再利用ルール。
  </Card>
</CardGroup>
