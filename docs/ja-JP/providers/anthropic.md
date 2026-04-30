---
read_when:
    - OpenClawでAnthropicモデルを使用したい場合
summary: OpenClaw で API キーまたは Claude CLI 経由で Anthropic Claude を使用する
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T05:29:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを開発しています。OpenClaw は 2 つの認証経路をサポートします。

- **API キー** — 使用量ベースの課金で Anthropic API に直接アクセス（`anthropic/*` モデル）
- **Claude CLI** — 同じホスト上の既存の Claude CLI ログインを再利用

<Warning>
Anthropic スタッフから、OpenClaw のような Claude CLI 使用は再び許可されていると伝えられたため、
Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の使用を許可されたものとして扱います。

長期稼働する gateway ホストでは、Anthropic API キーが今でも最も明確で
予測しやすい本番運用の経路です。

Anthropic の現在の公開ドキュメント:

- [Claude Code CLI リファレンス](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概要](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Team または Enterprise プランで Claude Code を使用する](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## はじめに

<Tabs>
  <Tab title="API キー">
    **最適な用途:** 標準の API アクセスと使用量ベースの課金。

    <Steps>
      <Step title="API キーを取得する">
        [Anthropic Console](https://console.anthropic.com/) で API キーを作成します。
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
      <Step title="Claude CLI がインストール済みでログイン済みであることを確認する">
        次で確認します。

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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI バックエンドのセットアップと実行時の詳細は [CLI バックエンド](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    ### 設定例

    正規の Anthropic モデル参照に CLI ランタイム上書きを加える形を推奨します。

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

    レガシーな `claude-cli/claude-opus-4-7` モデル参照も互換性のため引き続き動作しますが、
    新しい設定では provider/model の選択を `anthropic/*` のままにし、
    実行バックエンドを `agentRuntime.id` に置くべきです。

    <Tip>
    最も明確な課金経路が必要な場合は、代わりに Anthropic API キーを使用してください。OpenClaw は [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/glm) のサブスクリプション形式の選択肢もサポートしています。
    </Tip>

  </Tab>
</Tabs>

## 思考のデフォルト（Claude 4.6）

Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、OpenClaw ではデフォルトで `adaptive` thinking を使用します。

メッセージごとに `/think:<level>` で上書きするか、モデルパラメータで上書きします。

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

OpenClaw は、API キー認証向けに Anthropic のプロンプトキャッシュ機能をサポートしています。

| 値                  | キャッシュ期間 | 説明                                   |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（デフォルト） | 5 分           | API キー認証では自動的に適用されます |
| `"long"`            | 1 時間         | 拡張キャッシュ                         |
| `"none"`            | キャッシュなし | プロンプトキャッシュを無効化           |

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
    モデルレベルのパラメータをベースラインとして使用し、`agents.list[].params` で特定のエージェントを上書きします。

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
    2. `agents.list[].params`（`id` に一致し、キー単位で上書き）

    これにより、同じモデル上のあるエージェントは長寿命キャッシュを維持し、別のエージェントはバースト的で再利用の少ないトラフィック向けにキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claude の注記">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合に `cacheRetention` のパススルーを受け入れます。
    - Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` に強制されます。
    - API キーのスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock 参照にも `cacheRetention: "short"` をシードします。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClaw の共有 `/fast` トグルは、Anthropic への直接トラフィック（API キーおよび `api.anthropic.com` への OAuth）をサポートします。

    | コマンド | マップ先 |
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
    - 直接の `api.anthropic.com` リクエストにのみ注入されます。プロキシ経路では `service_tier` は変更されません。
    - 明示的な `serviceTier` または `service_tier` パラメータは、両方が設定されている場合に `/fast` を上書きします。
    - Priority Tier 容量のないアカウントでは、`service_tier: "auto"` が `standard` に解決されることがあります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドルされた Anthropic plugin は画像と PDF の理解を登録します。OpenClaw は
    設定された Anthropic 認証からメディア機能を自動解決します。追加の
    設定は不要です。

    | プロパティ     | 値                   |
    | -------------- | -------------------- |
    | デフォルトモデル | `claude-opus-4-6`    |
    | サポートされる入力 | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw は自動的に
    Anthropic メディア理解プロバイダー経由でルーティングします。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ（ベータ）">
    Anthropic の 1M コンテキストウィンドウはベータゲートされています。モデルごとに有効化します。

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

    OpenClaw はリクエスト上でこれを `anthropic-beta: context-1m-2025-08-07` にマップします。

    `params.context1m: true` は、対象となる Opus および Sonnet モデルの Claude CLI バックエンド
    （`claude-cli/*`）にも適用され、それらの CLI セッションの実行時
    コンテキストウィンドウを直接 API の挙動に合わせて拡張します。

    <Warning>
    Anthropic 認証情報でロングコンテキストアクセスが必要です。レガシートークン認証（`sk-ant-oat-*`）は 1M コンテキストリクエストでは拒否されます。OpenClaw は警告をログに記録し、標準コンテキストウィンドウにフォールバックします。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M コンテキスト">
    `anthropic/claude-opus-4.7` とその `claude-cli` バリアントは、デフォルトで 1M コンテキスト
    ウィンドウを持ちます。`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / トークンが突然無効になる">
    Anthropic トークン認証は期限切れになったり、取り消されたりすることがあります。新規セットアップでは、代わりに Anthropic API キーを使用してください。
  </Accordion>

  <Accordion title='provider "anthropic" の API キーが見つかりません'>
    Anthropic 認証は **エージェントごと** です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントでオンボーディングを再実行する（または Gateway ホストに API キーを設定する）ことで、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='profile "anthropic:default" の認証情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルがアクティブか確認してください。オンボーディングを再実行するか、そのプロファイルパスに API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限クールダウンはモデルスコープの場合があるため、兄弟関係にある Anthropic モデルはまだ使用できることがあります。別の Anthropic プロファイルを追加するか、クールダウンを待ってください。
  </Accordion>
</AccordionGroup>

<Note>
その他のヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="CLI バックエンド" href="/ja-JP/gateway/cli-backends" icon="terminal">
    Claude CLI バックエンドのセットアップと実行時の詳細。
  </Card>
  <Card title="プロンプトキャッシュ" href="/ja-JP/reference/prompt-caching" icon="database">
    プロバイダー全体でプロンプトキャッシュがどのように機能するか。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
