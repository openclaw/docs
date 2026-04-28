---
read_when:
    - OpenClawでAnthropicモデルを使いたい場合
summary: OpenClawでAPIキーまたはClaude CLIを使ってAnthropic Claudeを利用する
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:38:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropicは**Claude**モデルファミリーを提供しています。OpenClawは2つの認証経路をサポートしています。

- **APIキー** — 使用量ベース課金によるAnthropic APIへの直接アクセス（`anthropic/*`モデル）
- **Claude CLI** — 同じホスト上にある既存のClaude CLIログインを再利用

<Warning>
Anthropicのスタッフから、OpenClawスタイルのClaude CLI使用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはClaude CLIの再利用と`claude -p`の使用を許可されたものとして扱います。

長期間稼働するGatewayホストでは、Anthropic APIキーが依然として最も明確で予測しやすい本番経路です。

Anthropicの現在の公開ドキュメント:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## はじめに

<Tabs>
  <Tab title="APIキー">
    **最適な用途:** 標準的なAPIアクセスと使用量ベース課金。

    <Steps>
      <Step title="APIキーを取得する">
        [Anthropic Console](https://console.anthropic.com/)でAPIキーを作成します。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### config例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最適な用途:** 別のAPIキーなしで既存のClaude CLIログインを再利用する場合。

    <Steps>
      <Step title="Claude CLIがインストール済みでログイン済みであることを確認する">
        次のコマンドで確認します。

        ```bash
        claude --version
        ```
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClawは既存のClaude CLI認証情報を検出して再利用します。
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLIバックエンドのセットアップとランタイムの詳細は[CLI Backends](/ja-JP/gateway/cli-backends)にあります。
    </Note>

    ### config例

    正式なAnthropic model refとCLIランタイムオーバーライドを組み合わせることをおすすめします。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    互換性のため、従来の`claude-cli/claude-opus-4-7` model refも引き続き動作しますが、新しいconfigでは、プロバイダー/モデル選択は`anthropic/*`のままにし、実行バックエンドは`agentRuntime.id`に置くべきです。

    <Tip>
    最も明確な課金経路を望む場合は、代わりにAnthropic APIキーを使用してください。OpenClawは、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、および[Z.AI / GLM](/ja-JP/providers/glm)のサブスクリプション型オプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## Thinkingのデフォルト（Claude 4.6）

Claude 4.6モデルは、明示的なthinkingレベルが設定されていない場合、OpenClawではデフォルトで`adaptive` thinkingになります。

メッセージごとに`/think:<level>`で上書きするか、model paramsで上書きしてください。

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
関連するAnthropicドキュメント:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## プロンプトキャッシュ

OpenClawは、APIキー認証に対してAnthropicのプロンプトキャッシュ機能をサポートしています。

| 値 | キャッシュ期間 | 説明 |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（デフォルト） | 5分 | APIキー認証に対して自動的に適用 |
| `"long"` | 1時間 | 拡張キャッシュ |
| `"none"` | キャッシュなし | プロンプトキャッシュを無効化 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="エージェントごとのキャッシュ上書き">
    モデルレベルのparamsをベースラインとして使用し、その後`agents.list[].params`で特定のエージェントを上書きします。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    configのマージ順序:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（一致する`id`、キーごとに上書き）

    これにより、あるエージェントでは長期間有効なキャッシュを維持しながら、同じモデル上の別のエージェントでは、バースト的で再利用の少ないトラフィックに対してキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claudeに関する注意">
    - Bedrock上のAnthropic Claudeモデル（`amazon-bedrock/*anthropic.claude*`）は、設定されていれば`cacheRetention`のパススルーを受け付けます。
    - Anthropic以外のBedrockモデルは、ランタイムで`cacheRetention: "none"`に強制されます。
    - APIキーのスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock refに対しても`cacheRetention: "short"`を設定します。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClawの共有`/fast`トグルは、直接のAnthropicトラフィック（`api.anthropic.com`へのAPIキーおよびOAuth）をサポートします。

    | コマンド | マッピング先 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 直接の`api.anthropic.com`リクエストに対してのみ注入されます。プロキシルートでは`service_tier`は変更されません。
    - `serviceTier`または`service_tier` paramsが明示されている場合、両方が設定されているときは`/fast`より優先されます。
    - Priority Tier容量のないアカウントでは、`service_tier: "auto"`が`standard`に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像とPDF）">
    バンドル済みのAnthropic Pluginは、画像とPDFの理解を登録します。OpenClawは、設定済みのAnthropic認証からメディアcapabilityを自動解決するため、追加のconfigは不要です。

    | プロパティ | 値 |
    | -------------- | -------------------- |
    | デフォルトモデル | `claude-opus-4-6` |
    | サポートされる入力 | 画像、PDFドキュメント |

    会話に画像またはPDFが添付されると、OpenClawは自動的にAnthropicのメディア理解プロバイダーを通して処理します。

  </Accordion>

  <Accordion title="1Mコンテキストウィンドウ（ベータ）">
    Anthropicの1Mコンテキストウィンドウはベータ制限付きです。モデルごとに有効化してください。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClawはこれをリクエスト時に`anthropic-beta: context-1m-2025-08-07`へマッピングします。

    `params.context1m: true`は、対象のOpusおよびSonnetモデルに対してClaude CLIバックエンド（`claude-cli/*`）にも適用され、それらのCLIセッションのランタイムコンテキストウィンドウを直接APIの挙動に合わせて拡張します。

    <Warning>
    Anthropic認証情報に長コンテキストアクセス権が必要です。従来のトークン認証（`sk-ant-oat-*`）は1Mコンテキストリクエストでは拒否されます。OpenClawは警告をログに出し、標準のコンテキストウィンドウにフォールバックします。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1Mコンテキスト">
    `anthropic/claude-opus-4.7`とその`claude-cli`バリアントは、デフォルトで1Mコンテキストウィンドウを持っています。`params.context1m: true`は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401エラー / トークンが突然無効になる">
    Anthropicのトークン認証は期限切れになり、失効することがあります。新規セットアップでは、代わりにAnthropic APIキーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー"anthropic"のAPIキーが見つかりません'>
    Anthropic認証は**エージェントごと**です。新しいエージェントはメインエージェントのキーを引き継ぎません。そのエージェントに対してオンボーディングを再実行するか（またはGatewayホスト上にAPIキーを設定し）、その後`openclaw models status`で確認してください。
  </Accordion>

  <Accordion title='プロファイル"anthropic:default"の認証情報が見つかりません'>
    どの認証プロファイルが有効かを確認するには`openclaw models status`を実行してください。オンボーディングを再実行するか、そのプロファイルパスに対してAPIキーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `auth.unusableProfiles`を確認するには`openclaw models status --json`を使ってください。Anthropicのレート制限クールダウンはモデル単位の場合があるため、兄弟のAnthropicモデルはまだ利用できる可能性があります。別のAnthropicプロファイルを追加するか、クールダウンが終わるまで待ってください。
  </Accordion>
</AccordionGroup>

<Note>
さらにサポートが必要な場合: [トラブルシューティング](/ja-JP/help/troubleshooting)および[FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="CLIバックエンド" href="/ja-JP/gateway/cli-backends" icon="terminal">
    Claude CLIバックエンドのセットアップとランタイムの詳細。
  </Card>
  <Card title="プロンプトキャッシュ" href="/ja-JP/reference/prompt-caching" icon="database">
    プロンプトキャッシュがプロバイダー間でどのように機能するか。
  </Card>
  <Card title="OAuthと認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
