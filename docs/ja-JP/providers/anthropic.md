---
read_when:
    - OpenClaw で Anthropic の model を使いたい場合
summary: Anthropic Claude を OpenClaw で API key または Claude CLI 経由で使う
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T14:06:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic（Claude）

Anthropic は **Claude** model ファミリーを提供しています。OpenClaw は 2 つの認証経路をサポートします:

- **API key** — 使用量ベース課金の直接 Anthropic API アクセス（`anthropic/*` models）
- **Claude CLI** — 同じ host 上の既存 Claude CLI ログインを再利用

<Warning>
Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 利用は再び許可されていると伝えられたため、
Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の使用を許可済みとして扱います。

長期間稼働する Gateway host では、Anthropic API key が依然として最も明確で
予測可能な本番経路です。

Anthropic の現在の公開ドキュメント:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## はじめに

<Tabs>
  <Tab title="API key">
    **最適な用途:** 標準的な API アクセスと使用量ベース課金。

    <Steps>
      <Step title="API key を取得する">
        [Anthropic Console](https://console.anthropic.com/) で API key を作成します。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        または key を直接渡します:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="model が利用可能であることを確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 設定例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最適な用途:** 別の API key なしで既存の Claude CLI ログインを再利用すること。

    <Steps>
      <Step title="Claude CLI がインストールされログイン済みであることを確認する">
        次で確認します:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw は既存の Claude CLI 認証情報を検出して再利用します。
      </Step>
      <Step title="model が利用可能であることを確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI バックエンドのセットアップとランタイムの詳細は [CLI Backends](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    <Tip>
    最も明確な課金経路が欲しい場合は、代わりに Anthropic API key を使用してください。OpenClaw は [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/glm) のサブスクリプション型オプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## Thinking のデフォルト（Claude 4.6）

Claude 4.6 models は、明示的な thinking level が設定されていない場合、OpenClaw ではデフォルトで `adaptive` thinking を使います。

メッセージごとに `/think:<level>` で上書きするか、model params で指定します:

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
関連する Anthropic ドキュメント:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## prompt caching

OpenClaw は、API key 認証向けに Anthropic の prompt caching 機能をサポートします。

| 値 | キャッシュ時間 | 説明 |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（デフォルト） | 5 分 | API key 認証に自動適用 |
| `"long"` | 1 時間 | 拡張キャッシュ |
| `"none"` | キャッシュなし | prompt caching を無効化 |

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
  <Accordion title="agent ごとのキャッシュ上書き">
    model レベルの params をベースラインとして使い、そのうえで `agents.list[].params` で特定の agent を上書きします:

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

    設定のマージ順序:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（一致する `id`、キー単位で上書き）

    これにより、同じ model 上でも、一方の agent は長寿命キャッシュを維持しつつ、別の agent はバースト的で再利用の少ないトラフィック向けにキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claude に関する注意">
    - Bedrock 上の Anthropic Claude models（`amazon-bedrock/*anthropic.claude*`）は、設定されていれば `cacheRetention` のパススルーを受け付けます。
    - Anthropic 以外の Bedrock models は、実行時に `cacheRetention: "none"` が強制されます。
    - API key のスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock ref にも `cacheRetention: "short"` を設定します。
  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="Fast モード">
    OpenClaw の共有 `/fast` トグルは、直接の Anthropic トラフィック（`api.anthropic.com` への API key と OAuth）をサポートしています。

    | コマンド | 対応先 |
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
    - 直接の `api.anthropic.com` リクエストにのみ注入されます。proxy 経路では `service_tier` は変更されません。
    - `serviceTier` または `service_tier` params が明示されている場合、両方が設定されていても `/fast` より優先されます。
    - Priority Tier 容量のないアカウントでは、`service_tier: "auto"` は `standard` に解決される場合があります。
    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドルされた Anthropic plugin は画像と PDF の理解を登録します。OpenClaw
    は、設定済みの Anthropic 認証からメディア capability を自動解決するため、追加設定は不要です。

    | プロパティ | 値 |
    | -------------- | -------------------- |
    | デフォルト model | `claude-opus-4-6` |
    | 対応入力 | 画像、PDF ドキュメント |

    画像または PDF が conversation に添付されると、OpenClaw は自動的に
    Anthropic メディア理解 provider 経由にルーティングします。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ（beta）">
    Anthropic の 1M コンテキストウィンドウは beta 制御されています。model ごとに有効化します:

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

    OpenClaw はこれをリクエスト上で `anthropic-beta: context-1m-2025-08-07` にマッピングします。

    <Warning>
    使用する Anthropic credential に long-context アクセスが必要です。従来の token 認証（`sk-ant-oat-*`）は 1M context リクエストでは拒否されます。OpenClaw は warning を記録し、標準コンテキストウィンドウにフォールバックします。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 の 1M コンテキスト">
    `anthropic/claude-opus-4.7` とその `claude-cli` variant は、デフォルトで 1M context
    window を持っています。`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / token が突然無効になった">
    Anthropic の token 認証は期限切れまたは失効する場合があります。新しいセットアップでは、Anthropic API key への移行を推奨します。
  </Accordion>

  <Accordion title='provider "anthropic" の API key が見つからない'>
    認証は **agent ごと** です。新しい agent はメイン agent の key を継承しません。その agent に対してオンボーディングを再実行するか、Gateway host に API key を設定し、その後 `openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='profile "anthropic:default" の認証情報が見つからない'>
    `openclaw models status` を実行して、どの auth profile がアクティブか確認してください。オンボーディングを再実行するか、その profile path に対して API key を設定してください。
  </Accordion>

  <Accordion title="利用可能な auth profile がない（すべて cooldown 中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限 cooldown は model スコープの場合があるため、兄弟の Anthropic model はまだ使える可能性があります。別の Anthropic profile を追加するか、cooldown が終わるまで待ってください。
  </Accordion>
</AccordionGroup>

<Note>
さらに助けが必要な場合: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="CLI バックエンド" href="/ja-JP/gateway/cli-backends" icon="terminal">
    Claude CLI バックエンドのセットアップとランタイム詳細。
  </Card>
  <Card title="Prompt caching" href="/ja-JP/reference/prompt-caching" icon="database">
    prompt caching が provider 間でどのように動作するか。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
