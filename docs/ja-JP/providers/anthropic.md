---
read_when:
    - OpenClawでAnthropicモデルを使用したい
summary: OpenClaw で API キーまたは Claude CLI 経由で Anthropic Claude を使用する
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T12:39:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを構築しています。OpenClaw は 2 つの認証ルートをサポートしています。

- **APIキー** — 使用量ベースの課金による Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** — 同じホスト上の既存の Claude Code ログインを再利用

<Warning>
OpenClaw の Claude CLI バックエンドは、インストール済みの Claude Code CLI を
非対話の print モードで実行します。Anthropic の現在の Claude Code ドキュメントでは、
`claude -p` は Agent SDK/プログラム利用として説明されています。2026年6月15日以降、Anthropic は、
サブスクリプションプランでの `claude -p` の使用は通常の Claude
プラン上限から消費されなくなり、まず別個の月間 Agent SDK クレジットから消費され、その後、
それらのクレジットが有効な場合は標準 API レートの使用クレジットから消費されるとしています。

対話型の Claude Code は引き続き、サインイン中の Claude プラン上限から消費されます。API
キー認証は、従量課金の API 課金に直接つながります。長時間稼働する Gateway ホスト、
共有自動化、予測可能な本番支出には、Anthropic APIキーを使用してください。

Anthropic の現在の公開ドキュメント:

- [Claude Code CLI リファレンス](https://code.claude.com/docs/en/cli-usage)
- [Claude プランで Claude Agent SDK を使用する](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Team または Enterprise プランで Claude Code を使用する](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code のコストを管理する](https://code.claude.com/docs/en/costs)

</Warning>

## はじめに

<Tabs>
  <Tab title="API key">
    **最適な用途:** 標準 API アクセスと使用量ベースの課金。

    <Steps>
      <Step title="Get your API key">
        [Anthropic Console](https://console.anthropic.com/) で APIキーを作成します。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        またはキーを直接渡します。

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 設定例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最適な用途:** 別個の APIキーなしで既存の Claude CLI ログインを再利用する場合。

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        次で確認します。

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw は既存の Claude CLI 認証情報を検出して再利用します。
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI バックエンドのセットアップとランタイムの詳細は [CLI バックエンド](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    <Warning>
    Claude CLI の再利用では、OpenClaw プロセスが Claude CLI ログインと同じホスト上で
    実行されることが前提です。Docker インストールではコンテナのホームを永続化し、そこで
    Claude Code にログインできます。詳しくは
    [Docker の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker) を参照してください。
    [Podman](/ja-JP/install/podman) などの他のコンテナインストールでは、ホストの
    `~/.claude` はセットアップやランタイムにマウントされません。そこでは Anthropic APIキーを使用するか、
    [OpenAI Codex](/ja-JP/providers/openai) など OpenClaw 管理の OAuth を持つプロバイダーを
    選択してください。
    </Warning>

    ### 設定例

    正規の Anthropic モデル参照に CLI ランタイムオーバーライドを組み合わせることを推奨します。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    従来の `claude-cli/claude-opus-4-7` モデル参照も互換性のために引き続き動作しますが、
    新しい設定ではプロバイダー/モデル選択を `anthropic/*` のままにし、
    実行バックエンドはプロバイダー/モデルのランタイムポリシーに置くべきです。

    ### 課金と `claude -p`

    OpenClaw は Claude CLI 実行に Claude Code の非対話型 `claude -p` パスを使用します。
    Anthropic は現在、そのパスを Agent SDK/プログラム利用として扱っています。

    - 2026年6月15日までは、サブスクリプションプランの扱いはサインイン中アカウントに対する Anthropic の有効な
      Claude Code ルールに従います。
    - 2026年6月15日以降、サブスクリプションプランでの `claude -p` の使用は、
      まずユーザーの月間 Agent SDK クレジットから消費され、その後、使用クレジットが有効な場合は標準
      API レートの使用クレジットから消費されます。
    - Console/APIキーのログインは従量課金 API 課金を使用し、
      サブスクリプションの Agent SDK クレジットは受け取りません。

    Anthropic は OpenClaw リリースなしに Claude Code の課金とレート制限の挙動を変更できます。
    課金の予測可能性が重要な場合は、`claude auth status`、`/status`、および
    Anthropic のリンク先ドキュメントを確認してください。

    <Tip>
    共有の本番自動化には、Claude CLI ではなく Anthropic APIキーを使用してください。
    OpenClaw は [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/zai) の
    サブスクリプション型オプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## 思考のデフォルト（Claude Fable 5、4.8、4.6）

`anthropic/claude-fable-5` は常に適応型思考を使用し、デフォルトは `high`
エフォートです。Anthropic はこのモデルで思考の無効化を許可していないため、
`/think off` と `/think minimal` は `low` エフォートを使用します。OpenClaw は Fable 5 リクエストではカスタム
temperature 値も省略します。

Claude Opus 4.8 は OpenClaw ではデフォルトで思考がオフのままです。`/think high|xhigh|max` で適応型思考を明示的に有効にすると、OpenClaw は Anthropic の Opus 4.8 エフォート値を送信します。Claude 4.6 モデルのデフォルトは `adaptive` です。

メッセージごとに `/think:<level>` で、またはモデルパラメーターでオーバーライドします。

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
関連する Anthropic ドキュメント:
- [適応型思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [拡張思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## プロンプトキャッシュ

OpenClaw は APIキー認証で Anthropic のプロンプトキャッシュ機能をサポートしています。

| 値                  | キャッシュ期間 | 説明                                   |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（デフォルト） | 5分            | APIキー認証に自動的に適用されます     |
| `"long"`            | 1時間          | 拡張キャッシュ                         |
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
  <Accordion title="Per-agent cache overrides">
    モデルレベルのパラメーターをベースラインとして使用し、その後 `agents.list[].params` で特定のエージェントをオーバーライドします。

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
    2. `agents.list[].params`（一致する `id`、キー単位でオーバーライド）

    これにより、同じモデル上の別のエージェントがバースト的/低再利用トラフィック向けにキャッシュを無効化する一方で、あるエージェントは長寿命キャッシュを維持できます。

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定時に `cacheRetention` のパススルーを受け付けます。
    - Anthropic 以外の Bedrock モデルは、ランタイムで `cacheRetention: "none"` に強制されます。
    - APIキーのスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock 参照にも `cacheRetention: "short"` を設定します。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw の共有 `/fast` トグルは、Anthropic への直接トラフィック（APIキーおよび `api.anthropic.com` への OAuth）をサポートします。

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
    - 明示的な `serviceTier` または `service_tier` パラメーターは、両方が設定されている場合 `/fast` をオーバーライドします。
    - Priority Tier 容量がないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    バンドルされた Anthropic Plugin は、画像と PDF の理解を登録します。OpenClaw は
    設定済みの Anthropic 認証からメディア機能を自動解決します。追加の設定は
    必要ありません。

    | プロパティ      | 値                    |
    | --------------- | --------------------- |
    | デフォルトモデル | `claude-opus-4-8`     |
    | サポート入力    | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw は自動的に
    Anthropic メディア理解プロバイダー経由でルーティングします。

  </Accordion>

  <Accordion title="1M context window">
    Anthropic の 1M コンテキストウィンドウは、Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6 などの GA 対応 Claude 4.x モデルで利用できます。OpenClaw はそれらのモデルを
    自動的に 1M としてサイズ設定します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    古い設定では `params.context1m: true` を維持できますが、OpenClaw は廃止された
    `context-1m-2025-08-07` ベータヘッダーを送信しなくなりました。その値を持つ古い `anthropicBeta` 設定
    エントリはリクエストヘッダー解決時に無視され、
    サポートされていない古い Claude モデルは通常のコンテキストウィンドウのままです。

    `params.context1m: true` は、対象となる GA 対応の Opus および Sonnet モデルについて
    Claude CLI バックエンド（`claude-cli/*`）にも適用され、それらの CLI セッションの
    ランタイムコンテキストウィンドウを直接 API の挙動と一致するように維持します。

    <Warning>
    Anthropic 認証情報でロングコンテキストアクセスが必要です。OAuth/サブスクリプショントークン認証は必要な Anthropic ベータヘッダーを保持しますが、古い設定に廃止された 1M ベータヘッダーが残っている場合、OpenClaw はそれを取り除きます。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` とその `claude-cli` バリアントは、デフォルトで 1M コンテキスト
    ウィンドウを持ちます。`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic トークン認証は期限切れになり、取り消される可能性があります。新しいセットアップでは、代わりに Anthropic APIキーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の API key が見つかりません'>
    Anthropic 認証は**エージェントごと**です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントでオンボーディングを再実行するか、Gateway ホストで API key を設定してから、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の認証情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルがアクティブかを確認してください。オンボーディングを再実行するか、そのプロファイルパスの API key を設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限クールダウンはモデル単位の場合があるため、同じ Anthropic の別モデルはまだ利用できる可能性があります。別の Anthropic プロファイルを追加するか、クールダウンを待ってください。
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
    プロンプトキャッシュがプロバイダー間でどのように機能するか。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
