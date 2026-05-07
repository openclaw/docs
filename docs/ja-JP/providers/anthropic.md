---
read_when:
    - OpenClaw で Anthropic モデルを使いたい場合
summary: OpenClaw で Anthropic Claude を API キーまたは Claude CLI 経由で使用する
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:24:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを構築しています。OpenClaw は 2 つの認証ルートをサポートしています。

- **API キー** — 使用量ベースの課金による Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** — 同じホスト上の既存の Claude CLI ログインを再利用

<Warning>
Anthropic スタッフから、OpenClaw 形式の Claude CLI 使用は再び許可されていると聞いているため、
Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の使用を
認可されたものとして扱います。

長期稼働する gateway ホストでは、Anthropic API キーが今も最も明確で
予測しやすい本番運用パスです。

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

        または、キーを直接渡します:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
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
    **最適な用途:** 別の API キーなしで既存の Claude CLI ログインを再利用する場合。

    <Steps>
      <Step title="Claude CLI がインストールされ、ログイン済みであることを確認する">
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
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI バックエンドのセットアップとランタイムの詳細は [CLI バックエンド](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    ### 設定例

    正規の Anthropic モデル参照に CLI ランタイムのオーバーライドを組み合わせることを推奨します:

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

    レガシーな `claude-cli/claude-opus-4-7` モデル参照も互換性のために引き続き機能しますが、
    新しい設定では provider/model の選択を `anthropic/*` のままにし、
    実行バックエンドを `agentRuntime.id` に指定してください。

    <Tip>
    最も明確な課金パスを求める場合は、代わりに Anthropic API キーを使用してください。OpenClaw は [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/glm) のサブスクリプション形式のオプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## thinking のデフォルト（Claude 4.6）

Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、OpenClaw ではデフォルトで `adaptive` thinking を使用します。

メッセージごとに `/think:<level>` で、またはモデルパラメータ内でオーバーライドします:

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
| `"short"`（デフォルト） | 5 分           | API キー認証で自動的に適用されます     |
| `"long"`            | 1 時間         | 拡張キャッシュ                         |
| `"none"`            | キャッシュなし | プロンプトキャッシュを無効化します     |

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
  <Accordion title="エージェントごとのキャッシュオーバーライド">
    モデルレベルのパラメータをベースラインとして使用し、`agents.list[].params` で特定のエージェントをオーバーライドします:

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
    2. `agents.list[].params`（一致する `id`、キーごとにオーバーライド）

    これにより、同じモデル上の別のエージェントがバースト的で再利用の少ないトラフィック向けにキャッシュを無効化する一方で、あるエージェントは長期間有効なキャッシュを維持できます。

  </Accordion>

  <Accordion title="Bedrock Claude の注意事項">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合に `cacheRetention` のパススルーを受け付けます。
    - Anthropic 以外の Bedrock モデルは、ランタイムで `cacheRetention: "none"` に強制されます。
    - API キーのスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock 参照にも `cacheRetention: "short"` を初期値として設定します。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClaw の共有 `/fast` トグルは、Anthropic への直接トラフィック（API キーおよび `api.anthropic.com` への OAuth）をサポートします。

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
    - 直接の `api.anthropic.com` リクエストにのみ注入されます。プロキシルートでは `service_tier` は変更されません。
    - 明示的な `serviceTier` または `service_tier` パラメータは、両方が設定されている場合に `/fast` をオーバーライドします。
    - Priority Tier 容量のないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドルされた Anthropic Plugin は、画像と PDF の理解を登録します。OpenClaw は、
    設定済みの Anthropic 認証からメディア機能を自動解決します。
    追加設定は不要です。

    | プロパティ      | 値                    |
    | --------------- | --------------------- |
    | デフォルトモデル | `claude-opus-4-7`     |
    | サポートされる入力 | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw は自動的に
    Anthropic メディア理解プロバイダー経由でルーティングします。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ（ベータ）">
    Anthropic の 1M コンテキストウィンドウはベータで制限されています。モデルごとに有効化します:

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

    OpenClaw はリクエスト上でこれを `anthropic-beta: context-1m-2025-08-07` にマッピングします。

    `params.context1m: true` は、対象となる Opus および Sonnet モデルの Claude CLI バックエンド
    （`claude-cli/*`）にも適用され、その CLI セッションのランタイム
    コンテキストウィンドウを直接 API の動作に合わせて拡張します。

    <Warning>
    Anthropic 認証情報でロングコンテキストアクセスが必要です。レガシートークン認証（`sk-ant-oat-*`）は 1M コンテキストリクエストで拒否されます。OpenClaw は警告をログに記録し、標準のコンテキストウィンドウにフォールバックします。
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
    Anthropic トークン認証は期限切れになり、取り消されることがあります。新規セットアップでは、代わりに Anthropic API キーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の API キーが見つかりません'>
    Anthropic 認証は **エージェントごと** です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントでオンボーディングを再実行するか（または gateway ホストで API キーを設定して）、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の認証情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルがアクティブか確認します。オンボーディングを再実行するか、そのプロファイルパスに API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限クールダウンはモデルスコープの場合があるため、同系統の別の Anthropic モデルはまだ使用できる可能性があります。別の Anthropic プロファイルを追加するか、クールダウンを待ってください。
  </Accordion>
</AccordionGroup>

<Note>
詳細なヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="CLI バックエンド" href="/ja-JP/gateway/cli-backends" icon="terminal">
    Claude CLI バックエンドのセットアップとランタイムの詳細。
  </Card>
  <Card title="プロンプトキャッシュ" href="/ja-JP/reference/prompt-caching" icon="database">
    プロバイダー横断でプロンプトキャッシュがどのように機能するか。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
