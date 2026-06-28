---
read_when:
    - OpenClawでAnthropicモデルを使用したい場合
summary: OpenClaw で API キーまたは Claude CLI を介して Anthropic Claude を使用する
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを構築しています。OpenClaw は 2 つの認証ルートをサポートします。

- **API キー** — 使用量ベースの課金による Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** — 同じホスト上の既存の Claude Code ログインを再利用

<Warning>
OpenClaw の Claude CLI バックエンドは、インストール済みの Claude Code CLI を非対話型の print モードで実行します。Anthropic の現在の Claude Code ドキュメントでは、`claude -p` は Agent SDK/プログラム利用として説明されています。Anthropic の 2026 年 6 月 15 日のサポート更新では、発表済みだった Agent SDK 課金変更が一時停止されました。現時点では、Anthropic は Claude Agent SDK、`claude -p`、サードパーティアプリの利用は引き続きサブスクリプションの使用量上限から消費されるとしています。以前に発表された月次 Agent SDK クレジットは、Anthropic がその計画を見直している間は利用できません。

対話型の Claude Code も、サインイン済みの Claude プランの上限から消費されます。API キー認証は、引き続き直接の従量課金 API 課金です。長期間稼働する Gateway ホスト、共有オートメーション、予測可能な本番支出には、Anthropic API キーを使用してください。

サブスクリプション課金の動作に依存する前に、Anthropic の現在のサポート記事を確認してください。

- [Claude Code CLI リファレンス](https://code.claude.com/docs/en/cli-usage)
- [Claude プランで Claude Agent SDK を使用する](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Team または Enterprise プランで Claude Code を使用する](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code のコストを管理する](https://code.claude.com/docs/en/costs)

</Warning>

## はじめに

<Tabs>
  <Tab title="API key">
    **最適な用途:** 標準の API アクセスと使用量ベースの課金。

    <Steps>
      <Step title="Get your API key">
        [Anthropic Console](https://console.anthropic.com/) で API キーを作成します。
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        または、キーを直接渡します。

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
    **最適な用途:** 別の API キーなしで既存の Claude CLI ログインを再利用する場合。

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
    Claude CLI バックエンドのセットアップとランタイムの詳細は、[CLI バックエンド](/ja-JP/gateway/cli-backends)にあります。
    </Note>

    <Warning>
    Claude CLI の再利用では、OpenClaw プロセスが Claude CLI ログインと同じホストで実行されることを想定しています。Docker インストールでは、コンテナのホームを永続化し、そこで Claude Code にログインできます。詳しくは [Docker の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker)を参照してください。[Podman](/ja-JP/install/podman) など他のコンテナインストールでは、ホストの `~/.claude` はセットアップやランタイムにマウントされません。その場合は Anthropic API キーを使用するか、[OpenAI Codex](/ja-JP/providers/openai) など OpenClaw 管理の OAuth を持つプロバイダーを選択してください。
    </Warning>

    ### 設定例

    正規の Anthropic モデル参照と CLI ランタイムのオーバーライドを使用することを推奨します。

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

    レガシーの `claude-cli/claude-opus-4-7` モデル参照は互換性のため引き続き動作しますが、新しい設定ではプロバイダー/モデル選択を `anthropic/*` として維持し、実行バックエンドはプロバイダー/モデルのランタイムポリシーに置いてください。

    ### 課金と `claude -p`

    OpenClaw は Claude CLI 実行に、Claude Code の非対話型 `claude -p` パスを使用します。Anthropic は現在、そのパスを Agent SDK/プログラム利用として扱っています。

    - Anthropic の 2026 年 6 月 15 日のサポート更新では、以前に発表された個別の Agent SDK クレジットプランが一時停止されました。
    - 現時点では、サブスクリプションプランの Claude Agent SDK、`claude -p`、サードパーティアプリの利用は、引き続きサインイン済みサブスクリプションの使用量上限から消費されます。
    - 以前に発表された月次 Agent SDK クレジットは、Anthropic がその計画を見直している間は利用できません。
    - Console/API キーログインは従量課金 API 課金を使用し、サブスクリプションの Agent SDK クレジットは受け取りません。

    一時停止の通知については Anthropic の [Agent SDK プランの記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)を参照し、サブスクリプションの動作については Claude Code プランの記事の [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) と [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) を参照してください。

    Anthropic は、OpenClaw のリリースなしに Claude Code の課金とレート制限の動作を変更できます。課金の予測可能性が重要な場合は、`claude auth status`、`/status`、および Anthropic のリンク先ドキュメントを確認してください。

    <Tip>
    共有の本番オートメーションには、Claude CLI ではなく Anthropic API キーを使用してください。OpenClaw は、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、[MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/zai) のサブスクリプション型オプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## 思考のデフォルト（Claude Fable 5、4.8、4.6）

`anthropic/claude-fable-5` は常にアダプティブ思考を使用し、デフォルトは `high` エフォートです。Anthropic はこのモデルで思考を無効にすることを許可していないため、`/think off` と `/think minimal` は `low` エフォートを使用します。OpenClaw は Fable 5 リクエストではカスタム temperature 値も省略します。

Claude Opus 4.8 は OpenClaw ではデフォルトで思考がオフのままです。`/think high|xhigh|max` でアダプティブ思考を明示的に有効にすると、OpenClaw は Anthropic の Opus 4.8 エフォート値を送信します。Claude 4.6 モデルのデフォルトは `adaptive` です。

メッセージごとに `/think:<level>` で、またはモデル params でオーバーライドします。

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
- [アダプティブ思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [拡張思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## プロンプトキャッシュ

OpenClaw は、API キー認証で Anthropic のプロンプトキャッシュ機能をサポートします。

| 値                  | キャッシュ期間 | 説明                                   |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（デフォルト） | 5 分           | API キー認証に自動的に適用            |
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
  <Accordion title="Per-agent cache overrides">
    モデルレベルの params をベースラインとして使用し、その後 `agents.list[].params` を介して特定のエージェントをオーバーライドします。

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

    これにより、同じモデル上の別のエージェントがバースト的で再利用の少ないトラフィックのためにキャッシュを無効化する一方で、1 つのエージェントは長期間有効なキャッシュを維持できます。

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合 `cacheRetention` パススルーを受け入れます。
    - Anthropic 以外の Bedrock モデルは、ランタイムで `cacheRetention: "none"` に強制されます。
    - API キーのスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock 参照にも `cacheRetention: "short"` を設定します。

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
    - 直接の `api.anthropic.com` リクエストにのみ注入されます。プロキシルートでは `service_tier` は変更されません。
    - 明示的な `serviceTier` または `service_tier` params は、両方が設定されている場合 `/fast` をオーバーライドします。
    - Priority Tier の容量がないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    バンドルされた Anthropic Plugin は、画像と PDF の理解を登録します。OpenClaw は、設定済みの Anthropic 認証からメディア機能を自動解決します。追加の設定は不要です。

    | プロパティ      | 値                    |
    | --------------- | --------------------- |
    | デフォルトモデル | `claude-opus-4-8`     |
    | サポートされる入力 | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw は自動的に Anthropic メディア理解プロバイダー経由でルーティングします。

  </Accordion>

  <Accordion title="1M context window">
    Anthropic の 1M コンテキストウィンドウは、Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6 などの GA 対応 Claude 4.x モデルで利用できます。OpenClaw はそれらのモデルを自動的に 1M としてサイズ設定します。

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

    古い設定では `params.context1m: true` を維持できますが、OpenClaw は廃止済みの `context-1m-2025-08-07` ベータヘッダーを送信しなくなりました。その値を含む古い `anthropicBeta` 設定エントリはリクエストヘッダー解決時に無視され、サポート対象外の古い Claude モデルは通常のコンテキストウィンドウのままになります。

    `params.context1m: true` は、対象となる GA 対応 Opus および Sonnet モデルの Claude CLI バックエンド（`claude-cli/*`）にも適用され、それらの CLI セッションのランタイムコンテキストウィンドウを直接 API の動作と一致するように維持します。

    <Warning>
    Anthropic 認証情報で長いコンテキストへのアクセスが必要です。OAuth/サブスクリプショントークン認証は必要な Anthropic ベータヘッダーを維持しますが、OpenClaw は古い設定に残っている場合、廃止済みの 1M ベータヘッダーを除去します。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M コンテキスト">
    `anthropic/claude-opus-4-8` とその `claude-cli` バリアントは、デフォルトで 1M コンテキスト
    ウィンドウを持ちます — `params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / トークンが突然無効になる">
    Anthropic トークン認証は期限切れになり、取り消される場合があります。新しいセットアップでは、代わりに Anthropic API キーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の API キーが見つかりません'>
    Anthropic 認証は**エージェントごと**です — 新しいエージェントはメインエージェントのキーを継承しません。そのエージェントのオンボーディングを再実行するか、Gateway ホストで API キーを設定してから、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の認証情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルがアクティブかを確認してください。オンボーディングを再実行するか、そのプロファイルパスの API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限クールダウンはモデル単位の場合があるため、兄弟の Anthropic モデルはまだ使用できる可能性があります。別の Anthropic プロファイルを追加するか、クールダウンを待ってください。
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
    Claude CLI バックエンドのセットアップとランタイムの詳細。
  </Card>
  <Card title="プロンプトキャッシュ" href="/ja-JP/reference/prompt-caching" icon="database">
    プロバイダー間でプロンプトキャッシュがどのように機能するか。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
