---
read_when:
    - OpenClaw で Anthropic モデルを使いたい場合
summary: API キーまたは Claude CLI を使って OpenClaw で Anthropic Claude を利用する
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T05:13:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic（Claude）

Anthropic は **Claude** モデルファミリを開発しています。OpenClaw は 2 つの認証経路をサポートします:

- **API キー** — 使用量課金付きの Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** — 同じホスト上にある既存の Claude CLI ログインを再利用

<Warning>
Anthropic スタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられているため、
Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI 再利用と
`claude -p` 利用を認可済みとして扱います。

長期間稼働する gateway ホストでは、Anthropic API キーが依然としてもっとも明確で
予測しやすい本番経路です。

Anthropic の現在の公開ドキュメント:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## はじめに

<Tabs>
  <Tab title="API キー">
    **最適な用途:** 標準的な API アクセスと使用量課金。

    <Steps>
      <Step title="API キーを取得">
        [Anthropic Console](https://console.anthropic.com/) で API キーを作成してください。
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        またはキーを直接渡します:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認">
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
    **最適な用途:** 別の API キーなしで既存の Claude CLI ログインを再利用する。

    <Steps>
      <Step title="Claude CLI がインストールされログイン済みであることを確認">
        次で確認してください:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw は既存の Claude CLI 認証情報を検出して再利用します。
      </Step>
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI バックエンドのセットアップとランタイム詳細は [CLI Backends](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    <Tip>
    もっとも明確な課金経路が欲しい場合は、代わりに Anthropic API キーを使ってください。OpenClaw は [OpenAI Codex](/ja-JP/providers/openai), [Qwen Cloud](/ja-JP/providers/qwen), [MiniMax](/ja-JP/providers/minimax), [Z.AI / GLM](/ja-JP/providers/glm) のサブスクリプション系オプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## Thinking のデフォルト（Claude 4.6）

Claude 4.6 モデルは、明示的な thinking level が設定されていない場合、OpenClaw ではデフォルトで `adaptive` thinking を使います。

メッセージ単位では `/think:<level>`、モデル params では次のように上書きします:

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

## プロンプトキャッシュ

OpenClaw は API キー認証向けに Anthropic の prompt caching 機能をサポートしています。

| 値                  | キャッシュ時間 | 説明                                   |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（デフォルト） | 5 分           | API キー認証に自動適用される           |
| `"long"`            | 1 時間         | 拡張キャッシュ                         |
| `"none"`            | キャッシュなし | prompt caching を無効化                |

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
  <Accordion title="エージェント単位のキャッシュ上書き">
    モデルレベル params をベースラインとして使い、その後 `agents.list[].params` で特定エージェントを上書きします:

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

    config のマージ順序:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（一致する `id`、キー単位で上書き）

    これにより、同じモデルを使っていても、あるエージェントは長寿命キャッシュを維持し、別のエージェントはバースト的 / 再利用の少ないトラフィック向けにキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claude に関する注記">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されていれば `cacheRetention` の pass-through を受け付けます。
    - Anthropic 以外の Bedrock モデルは、実行時に強制的に `cacheRetention: "none"` にされます。
    - API キーのスマートデフォルトは、明示値が設定されていない Claude-on-Bedrock 参照に対しても `cacheRetention: "short"` を設定します。
  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw の共有 `/fast` トグルは、Anthropic への直接トラフィック（API キーと `api.anthropic.com` への OAuth）をサポートします。

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
    - 直接 `api.anthropic.com` へのリクエストにのみ注入されます。プロキシ経路では `service_tier` は変更されません。
    - 明示的な `serviceTier` または `service_tier` params は、両方が設定されている場合 `/fast` より優先されます。
    - Priority Tier 容量のないアカウントでは、`service_tier: "auto"` が `standard` に解決されることがあります。
    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    同梱 Anthropic Plugin は画像と PDF 理解を登録します。OpenClaw は
    設定済み Anthropic auth からメディア機能を自動解決するため、追加設定は不要です。

    | 項目             | 値                   |
    | ---------------- | -------------------- |
    | デフォルトモデル | `claude-opus-4-6`    |
    | 対応入力         | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw は自動的に
    Anthropic のメディア理解プロバイダへルーティングします。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ（beta）">
    Anthropic の 1M コンテキストウィンドウは beta gated です。モデルごとに有効化します:

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

    OpenClaw はこれをリクエスト時に `anthropic-beta: context-1m-2025-08-07` にマッピングします。

    <Warning>
    あなたの Anthropic 認証情報に長文コンテキストアクセス権が必要です。旧来の token 認証（`sk-ant-oat-*`）は 1M コンテキスト要求では拒否され、OpenClaw は警告をログに記録して標準コンテキストウィンドウへフォールバックします。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 の 1M コンテキスト">
    `anthropic/claude-opus-4.7` とその `claude-cli` バリアントは、デフォルトで 1M コンテキスト
    ウィンドウを持っています。`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / token が突然無効になった">
    Anthropic token 認証は期限切れになったり取り消されたりします。新しいセットアップでは、代わりに Anthropic API キーを使ってください。
  </Accordion>

  <Accordion title='provider "anthropic" に API key が見つからない'>
    Anthropic 認証は **エージェント単位** です。新しいエージェントは main エージェントのキーを継承しません。そのエージェント向けにオンボーディングを再実行するか（または gateway ホスト上に API キーを設定し）、その後 `openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='profile "anthropic:default" の credentials が見つからない'>
    どの auth profile がアクティブかは `openclaw models status` で確認してください。オンボーディングを再実行するか、その profile パス向けに API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な auth profile がない（すべて cooldown 中）">
    `auth.unusableProfiles` は `openclaw models status --json` で確認してください。Anthropic のレート制限 cooldown はモデル単位の場合があるため、兄弟 Anthropic モデルならまだ使えることがあります。別の Anthropic profile を追加するか、cooldown が終わるのを待ってください。
  </Accordion>
</AccordionGroup>

<Note>
さらに支援が必要なら: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダ、モデル参照、failover 動作の選び方。
  </Card>
  <Card title="CLI バックエンド" href="/ja-JP/gateway/cli-backends" icon="terminal">
    Claude CLI バックエンドのセットアップとランタイム詳細。
  </Card>
  <Card title="プロンプトキャッシュ" href="/ja-JP/reference/prompt-caching" icon="database">
    プロバイダ横断での prompt caching の仕組み。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
