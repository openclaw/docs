---
read_when:
    - OpenClaw で Anthropic モデルを使用したい
summary: OpenClaw で API キーまたは Claude CLI を使って Anthropic Claude を使用する
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:08:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを構築しています。OpenClaw は 2 つの認証ルートをサポートします。

- **API キー** — 使用量ベースの課金で Anthropic API に直接アクセス（`anthropic/*` モデル）
- **Claude CLI** — 同じホスト上の既存の Claude Code ログインを再利用

<Warning>
OpenClaw の Claude CLI バックエンドは、インストール済みの Claude Code CLI を
非対話型の print モードで実行します。Anthropic の現在の Claude Code ドキュメントでは、
`claude -p` を Agent SDK/プログラム利用として説明しています。Anthropic の 2026 年 6 月 15 日のサポート
更新では、発表済みだった Agent SDK 課金変更が一時停止されました。現時点で Anthropic は、
Claude Agent SDK、`claude -p`、サードパーティアプリの使用量は引き続き
サブスクリプションの使用量上限から消費されると述べています。以前発表された月次の Agent SDK クレジットは、
Anthropic がその計画を見直している間は利用できません。

対話型の Claude Code も、サインイン中の Claude プラン上限から引き続き消費されます。API
キー認証は引き続き直接の従量課金 API 課金です。長期間稼働する Gateway ホスト、
共有オートメーション、予測可能な本番支出には、Anthropic API キーを使用してください。

サブスクリプション課金の挙動に依存する前に、Anthropic の現在のサポート記事を確認してください。

- [Claude Code CLI リファレンス](https://code.claude.com/docs/en/cli-usage)
- [Claude プランで Claude Agent SDK を使用する](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Team または Enterprise プランで Claude Code を使用する](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code のコストを管理する](https://code.claude.com/docs/en/costs)

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最適な用途:** 別の API キーなしで既存の Claude CLI ログインを再利用する場合。

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
    Claude CLI バックエンドのセットアップとランタイムの詳細は [CLI Backends](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    <Warning>
    Claude CLI の再利用では、OpenClaw プロセスが Claude CLI ログインと同じホストで実行されることを想定しています。
    Docker インストールでは、コンテナのホームを永続化してそこで Claude Code にログインできます。詳しくは
    [Docker の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker) を参照してください。
    [Podman](/ja-JP/install/podman) など他のコンテナインストールでは、ホストの
    `~/.claude` はセットアップまたはランタイムにマウントされません。その場合は Anthropic API キーを使用するか、
    [OpenAI Codex](/ja-JP/providers/openai) など OpenClaw 管理の OAuth を持つプロバイダーを選択してください。
    </Warning>

    ### 設定例

    正規の Anthropic モデル参照に CLI ランタイム上書きを組み合わせることを推奨します。

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

    レガシーな `claude-cli/claude-opus-4-7` モデル参照も互換性のため引き続き動作しますが、
    新しい設定ではプロバイダー/モデル選択を `anthropic/*` として保持し、
    実行バックエンドはプロバイダー/モデルのランタイムポリシーに置いてください。

    ### 課金と `claude -p`

    OpenClaw は Claude CLI 実行に Claude Code の非対話型 `claude -p` パスを使用します。
    Anthropic は現在、そのパスを Agent SDK/プログラム利用として扱っています。

    - Anthropic の 2026 年 6 月 15 日のサポート更新では、以前発表されていた
      個別の Agent SDK クレジットプランが一時停止されました。
    - 現時点では、サブスクリプションプランの Claude Agent SDK、`claude -p`、サードパーティ
      アプリの使用量は、引き続きサインイン中のサブスクリプションの使用量上限から消費されます。
    - 以前発表された月次の Agent SDK クレジットは、Anthropic がその計画を見直している間は利用できません。
    - Console/API キーログインは従量課金 API 課金を使用し、サブスクリプションの Agent SDK クレジットは受け取りません。

    一時停止の通知については Anthropic の [Agent SDK プラン
    記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) を参照し、サブスクリプションの挙動については Claude Code プラン記事の
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    および
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    を参照してください。

    Anthropic は OpenClaw のリリースなしに Claude Code の課金とレート制限の挙動を変更できます。
    課金の予測可能性が重要な場合は、`claude auth status`、`/status`、および
    Anthropic のリンク先ドキュメントを確認してください。

    <Tip>
    共有本番オートメーションでは、Claude CLI ではなく Anthropic API キーを使用してください。
    OpenClaw は [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/zai) のサブスクリプション型オプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## 思考のデフォルト（Claude Fable 5、4.8、4.6）

`anthropic/claude-fable-5` は常に adaptive thinking を使用し、デフォルトは `high`
effort です。Anthropic はこのモデルで thinking の無効化を許可していないため、
`/think off` と `/think minimal` は `low` effort を使用します。OpenClaw は Fable 5 リクエストでカスタム
temperature 値も省略します。

Claude Opus 4.8 は OpenClaw ではデフォルトで thinking がオフのままです。`/think high|xhigh|max` で adaptive thinking を明示的に有効にすると、OpenClaw は Anthropic の Opus 4.8 effort 値を送信します。Claude 4.6 モデルのデフォルトは `adaptive` です。

メッセージごとに `/think:<level>` で上書きするか、モデルパラメーターで指定します。

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 安全拒否フォールバック（Claude Fable 5）

<Warning>
Claude Fable 5 を使用することは、Claude Opus 4.8 も使用することを意味します。Fable 5 には
リクエストを拒否できる安全分類器が同梱されており、Anthropic が認可する
回復策は `claude-opus-4-8` にそのターンを処理させることです。OpenClaw は
直接 API キーリクエストではこれに自動でオプトインするため、一部の Fable ターンは
Claude Opus 4.8 として回答され、課金されます。ポリシーまたは予算で
Opus が処理するターンを許容できない場合は、`anthropic/claude-fable-5` を選択しないでください。
</Warning>

### これが存在する理由

Fable 5 の分類器は、制限対象ドメインのリクエストで `stop_reason: "refusal"` を返し、
また無害に近い作業（セキュリティツール、ライフサイエンス、あるいはモデルに生の
推論を再現させる要求）でも誤検知します。フォールバックがないと、別の Claude モデルなら
問題なく処理できるにもかかわらず、そのターンはエラーで終了します。Anthropic 自身の拒否メッセージは、
API インテグレーターにフォールバックモデルの設定を求めています。

### 仕組み

1. `anthropic/claude-fable-5` へのすべての直接 API キーリクエストで、OpenClaw は
   Anthropic のサーバー側フォールバックのオプトインを送信します。つまり
   `server-side-fallback-2026-06-01` ベータヘッダーと
   `fallbacks: [{"model": "claude-opus-4-8"}]` です。Claude Opus 4.8 は Anthropic が Fable 5 に許可する唯一の
   フォールバック先です。
2. フォールバックをトリガーするのは安全分類器による拒否のみです。レート制限、
   過負荷、サーバーエラーは従来どおりに動作し、OpenClaw の通常の
   [モデルフェイルオーバー](/ja-JP/concepts/model-failover) を通ります。
3. 救済は同じ呼び出しの中で発生します。出力前の拒否は
   レイテンシ以外では見えず、回答全体は Opus 4.8 から来ます。
   ストリーム途中の拒否では、部分テキストはフォールバック
   モデルが続行するプレフィックスとして保持されます。一方で、拒否したモデルの推論とツール呼び出しは、
   Anthropic のリプレイルールに従って破棄されます（それらをエコーバックしたり実行したりしてはなりません）。
4. Claude Opus 4.8 も拒否した場合、そのターンはこの機能以前と同じく
   拒否をエラーとして表面化します。

フォールバックは Anthropic API レベルで発生するため、`claude-opus-4-8` が
設定済みのモデルリストやフォールバックチェーンに含まれている必要はありません。Fable 対応の
API キーは常に Opus を処理できます。

### 可観測性と課金

- フォールバックで処理されたターンは、アシスタントメッセージに
  `fromModel` と `toModel` を示す `provider_fallback` 診断を記録し、メッセージの
  `responseModel` は `claude-opus-4-8` を報告します。
- Anthropic は試行ごとに課金します。出力前の拒否は無料で、救済は
  Claude Opus 4.8 の料金（現在は Fable 5 料金の半額）で課金されます。OpenClaw の
  ターンごとのコスト見積もりも、一致するようにフォールバック処理ターンを Opus 料金で計算します。
- ストリーム途中の拒否では、すでにストリームされた Fable の部分も
  Anthropic 側で追加課金されます。その部分は API の試行ごとの
  使用量では報告されますが、OpenClaw のターンごとの見積もりには組み込まれません。

### 範囲

`api.anthropic.com` に対する API キー認証での `anthropic/claude-fable-5` に適用されます。
OAuth（Claude CLI サブスクリプション再利用）、プロキシベース URL、
Bedrock、Vertex、Foundry のリクエストは変更されず、そこでの拒否は引き続き
エラーとして表面化します。

ライブ検証済み: Fable 5 に生の chain of
thought の再現を求める無害なプロンプトは、フォールバックなしで送信すると
`category: "reasoning_extraction"` で拒否されます。同じプロンプトを OpenClaw 経由で送ると、
`provider_fallback` 診断が添付された通常の Opus 処理の回答が返ります。

基盤となる挙動については、Anthropic の [拒否とフォールバック
ガイド](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) を参照してください。

## プロンプトキャッシュ

OpenClaw は API キー認証で Anthropic のプロンプトキャッシュ機能をサポートします。

| 値                  | キャッシュ期間 | 説明                                      |
| ------------------- | -------------- | ----------------------------------------- |
| `"short"` (デフォルト) | 5 分           | API キー認証に自動で適用されます          |
| `"long"`            | 1 時間         | 拡張キャッシュ                            |
| `"none"`            | キャッシュなし | プロンプトキャッシュを無効化              |

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
    モデルレベルのパラメーターをベースラインとして使用し、その後 `agents.list[].params` で特定のエージェントを上書きします。

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

    これにより、あるエージェントは長期間維持されるキャッシュを使い、同じモデル上の別のエージェントはバースト的で再利用の少ないトラフィック向けにキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claude の注意事項">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合に `cacheRetention` のパススルーを受け入れます。
    - Anthropic 以外の Bedrock モデルは、ランタイムで `cacheRetention: "none"` に強制されます。
    - API キーのスマートデフォルトは、明示的な値が設定されていない場合、Claude-on-Bedrock 参照にも `cacheRetention: "short"` を設定します。

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
    - 明示的な `serviceTier` または `service_tier` パラメータは、両方が設定されている場合に `/fast` を上書きします。
    - Priority Tier 容量のないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドルされている Anthropic Plugin は、画像と PDF の理解を登録します。OpenClaw は
    設定済みの Anthropic 認証からメディア機能を自動解決します。追加の設定は
    必要ありません。

    | プロパティ        | 値                 |
    | --------------- | --------------------- |
    | デフォルトモデル   | `claude-opus-4-8`     |
    | 対応入力 | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw はそれを Anthropic メディア理解プロバイダー経由で自動的にルーティングします。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ">
    Anthropic の 1M コンテキストウィンドウは、Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6 などの
    GA 対応 Claude 4.x モデルで利用できます。OpenClaw はこれらのモデルを
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

    古い設定では `params.context1m: true` を保持できますが、OpenClaw は廃止された
    `context-1m-2025-08-07` ベータヘッダーを送信しなくなりました。その値を持つ古い `anthropicBeta` 設定
    エントリは、リクエストヘッダー解決中に無視され、
    サポート対象外の古い Claude モデルは通常のコンテキストウィンドウのままになります。

    `params.context1m: true` は、対象となる GA 対応 Opus および Sonnet モデルについて
    Claude CLI バックエンド（`claude-cli/*`）にも適用され、これらの CLI セッションの
    ランタイムコンテキストウィンドウが直接 API
    の動作と一致するよう維持されます。

    <Warning>
    Anthropic 認証情報で長いコンテキストへのアクセス権が必要です。OAuth/サブスクリプショントークン認証は必要な Anthropic ベータヘッダーを保持しますが、OpenClaw は、古い設定に残っている場合、廃止された 1M ベータヘッダーを取り除きます。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M コンテキスト">
    `anthropic/claude-opus-4-8` とその `claude-cli` バリアントは、デフォルトで 1M コンテキスト
    ウィンドウを持ちます。`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / トークンが突然無効になった">
    Anthropic トークン認証は期限切れになり、取り消されることがあります。新しいセットアップでは、代わりに Anthropic API キーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の API キーが見つかりません'>
    Anthropic 認証は**エージェントごと**です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントでオンボーディングを再実行するか（または Gateway ホストで API キーを設定し）、その後 `openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の認証情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルが有効か確認してください。オンボーディングを再実行するか、そのプロファイルパスの API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限クールダウンはモデル単位の場合があるため、兄弟 Anthropic モデルはまだ使用できる可能性があります。別の Anthropic プロファイルを追加するか、クールダウンを待ってください。
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
    プロバイダーをまたいだプロンプトキャッシュの仕組み。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
</CardGroup>
