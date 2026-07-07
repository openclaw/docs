---
read_when:
    - OpenClaw で Anthropic モデルを使用したい
summary: OpenClaw で API キーまたは Claude CLI を介して Anthropic Claude を使用する
title: Anthropic
x-i18n:
    generated_at: "2026-07-06T21:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c19e88b2461e5d98a02044867625a2d508821a4ab43aeb3e10a7a493efbcca22
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを構築しています。OpenClaw は 2 つの認証ルートをサポートしています。

- **APIキー** - 使用量ベースの課金による Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** - 同じホスト上の既存の Claude Code ログインを再利用

## 使用量とコストの追跡

OpenClaw は利用可能な Anthropic 認証情報を検出し、一致する使用状況サーフェスを選択します。

- Claude サブスクリプション/セットアップ認証情報では、クォータ期間と任意の追加使用量予算が表示されます。
- `ANTHROPIC_ADMIN_KEY` または `ANTHROPIC_ADMIN_API_KEY` では、Control UI の **使用状況** に、プロバイダーが報告する過去 30 日間の組織コストと Messages API 使用量が表示されます。日次支出、トークン/キャッシュ合計、上位モデル、コストカテゴリが含まれます。
- Anthropic プロバイダープロファイルに保存された `sk-ant-admin...` 認証情報は、Admin APIキーとして自動的に検出されます。

Admin API のコスト履歴は Anthropic の [使用量とコスト API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) から取得されます。これは実際のプロバイダー請求であり、OpenClaw のセッション由来の推定コストとは別です。

<Warning>
OpenClaw の Claude CLI バックエンドは、インストール済みの Claude Code CLI を
非対話型の print モード（`claude -p`）で実行します。Anthropic の現在の Claude Code ドキュメントでは、
そのモードを Agent SDK/プログラム的使用として説明しています。Anthropic の 2026 年 6 月 15 日の
サポート更新では、発表済みだった別個の Agent SDK 課金変更が一時停止されました。Claude
Agent SDK、`claude -p`、サードパーティアプリの使用は、引き続きサインイン中の
サブスクリプションの使用制限から消費されます。また、以前に発表された月次 Agent SDK
クレジットは、Anthropic がそのプランを見直している間は利用できません。

対話型の Claude Code も、引き続きサインイン中の Claude プランの制限から消費されます。
APIキー認証は直接の従量課金であり、そのプランには依存しません。
長期間稼働する Gateway ホスト、共有自動化、予測可能な本番
支出には、Anthropic APIキーを使用してください。

Anthropic の現在のサポート記事により、この動作は
OpenClaw リリースなしで変更される可能性があります。

- [Claude Code CLI リファレンス](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK を Claude プランで使用する](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code を Pro または Max プランで使用する](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code を Team または Enterprise プランで使用する](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code のコストを管理する](https://code.claude.com/docs/en/costs)

</Warning>

## はじめに

<Tabs>
  <Tab title="APIキー">
    **最適な用途:** 標準の API アクセスと使用量ベースの課金。

    <Steps>
      <Step title="APIキーを取得する">
        [Anthropic Console](https://console.anthropic.com/) で APIキーを作成します。
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
    **最適な用途:** 別個の APIキーなしで既存の Claude CLI ログインを再利用する。

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
    Claude CLI バックエンドのセットアップとランタイムの詳細は [CLI バックエンド](/ja-JP/gateway/cli-backends) にあります。
    </Note>

    <Warning>
    Claude CLI の再利用では、OpenClaw プロセスが
    Claude CLI ログインと同じホストで実行されることを想定しています。Docker インストールではコンテナのホームを永続化し、そこで
    Claude Code にログインできます。詳しくは
    [Docker の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker) を参照してください。
    [Podman](/ja-JP/install/podman) など他のコンテナインストールでは、ホストの
    `~/.claude` はセットアップまたはランタイムにマウントされません。その場合は Anthropic APIキーを使用するか、
    [OpenAI Codex](/ja-JP/providers/openai) のような OpenClaw 管理の OAuth を持つ
    プロバイダーを選択してください。
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

    レガシーの `claude-cli/claude-opus-4-7` モデル参照は互換性のために引き続き動作しますが、
    新しい設定ではプロバイダー/モデル選択を
    `anthropic/*` のままにし、実行バックエンドはプロバイダー/モデルのランタイムポリシーに置く必要があります。

    ### 課金と `claude -p`

    OpenClaw は Claude CLI
    実行に Claude Code の非対話型 `claude -p` パスを使用します。Anthropic は現在、そのパスを Agent SDK/プログラム的使用として扱っています。

    - Anthropic の 2026 年 6 月 15 日のサポート更新では、以前に発表された
      別個の Agent SDK クレジットプランが一時停止されました。
    - サブスクリプションプランの Claude Agent SDK、`claude -p`、サードパーティアプリの使用は、
      引き続きサインイン中のサブスクリプションの使用制限から消費されます。
    - 以前に発表された月次 Agent SDK クレジットは、
      Anthropic がそのプランを見直している間は利用できません。
    - Console/APIキーのログインは従量課金の API 課金を使用し、
      サブスクリプションの Agent SDK クレジットは受け取りません。

    一時停止の通知については Anthropic の [Agent SDK プラン
    記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) を参照してください。また、サブスクリプションの動作については Claude Code プラン記事の
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    および
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    を参照してください。

    Anthropic は、OpenClaw リリースなしで Claude Code の課金とレート制限の動作を変更できます。
    課金の予測可能性が重要な場合は、`claude auth status`、`/status`、および
    Anthropic のリンク先ドキュメントを確認してください。

    <Tip>
    共有の本番自動化には、
    Claude CLI ではなく Anthropic APIキーを使用してください。OpenClaw は
    [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/zai) の
    サブスクリプション形式のオプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## Thinking のデフォルト（Claude Fable 5、4.8、4.6）

`anthropic/claude-fable-5` は常に adaptive thinking を使用し、デフォルトは `high`
effort です。Anthropic はこのモデルで thinking を無効にすることを許可していないため、
`/think off` と `/think minimal` は代わりに `low` effort にマッピングされます。OpenClaw はまた、
Fable 5 リクエストではカスタム温度値を省略します。Anthropic が
thinking が有効なすべてのリクエストで温度オーバーライドを拒否するためです。

Claude Opus 4.8 は OpenClaw ではデフォルトで thinking をオフのままにします。`/think high|xhigh|max` で adaptive thinking を明示的に
有効にすると、OpenClaw は
Anthropic の Opus 4.8 effort 値を送信します。Claude 4.6 モデル（Opus 4.6 と Sonnet 4.6）は
デフォルトで `adaptive` になります。

メッセージごとに `/think:<level>` で、またはモデルパラメータでオーバーライドします。

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

## 安全性拒否フォールバック（Claude Fable 5）

<Warning>
Claude Fable 5 を使用することは、Claude Opus 4.8 も使用することを意味します。Fable 5 には
リクエストを拒否できる安全性分類器が同梱されており、Anthropic が認める
回復方法は、そのターンを `claude-opus-4-8` に処理させることです。OpenClaw は
直接の APIキーリクエストではこれに自動的にオプトインするため、一部の Fable ターンは
Claude Opus 4.8 として回答され、課金されます。ポリシーまたは予算上、
Opus が処理するターンを受け入れられない場合は、`anthropic/claude-fable-5` を選択しないでください。
</Warning>

### これが存在する理由

Fable 5 の分類器は、制限付き
ドメインのリクエストで `stop_reason: "refusal"` を返し、良性に近い作業（セキュリティ
ツール、ライフサイエンス、さらにはモデルに生の
推論を再現させる依頼）でも誤検知することがあります。フォールバックがない場合、別の Claude モデルなら問題なく処理できる場合でも、
ターンはエラーで終了します。Anthropic 自身の拒否メッセージは、
API インテグレーターにフォールバックモデルを設定するよう伝えています。

### 仕組み

1. `anthropic/claude-fable-5` へのすべての直接 APIキーリクエストで、OpenClaw は
   Anthropic のサーバー側フォールバックのオプトインを送信します。つまり、
   `server-side-fallback-2026-06-01` ベータヘッダーと
   `fallbacks: [{"model": "claude-opus-4-8"}]` です。Claude Opus 4.8 は、Anthropic が Fable 5 に対して許可する唯一の
   フォールバックターゲットです。
2. 安全性分類器による拒否のみがフォールバックをトリガーします。レート制限、
   過負荷、サーバーエラーは以前とまったく同じように動作し、
   OpenClaw の通常の [モデルフェイルオーバー](/ja-JP/concepts/model-failover) を通ります。
3. レスキューは同じ呼び出しの内部で発生します。出力前の拒否は
   レイテンシ以外では見えません。回答全体が Opus 4.8 から返されます。
   ストリーム途中の拒否では、部分テキストがフォールバック
   モデルの継続元プレフィックスとして保持され、一方で拒否されたモデルの推論とツール呼び出しは
   Anthropic のリプレイルールに従って破棄されます（それらを返したり
   実行したりしてはなりません）。
4. Claude Opus 4.8 も拒否した場合、そのターンは
   この機能以前とまったく同じように拒否をエラーとして表面化します。

フォールバックは Anthropic API レベルで発生するため、`claude-opus-4-8` は
設定済みのモデルリストやフォールバックチェーンに含まれている必要はありません。Fable 対応の
APIキーであれば、常に Opus を提供できます。

### 可観測性と課金

- フォールバックで処理されたターンは、アシスタントメッセージに
  `fromModel` と `toModel` を示す `provider_fallback` 診断を記録し、メッセージの
  `responseModel` は `claude-opus-4-8` を報告します。
- Anthropic は試行ごとに課金します。出力前の拒否は無料で、レスキューは
  Claude Opus 4.8 の料金（現在は Fable 5 の料金の半分）で課金されます。OpenClaw の
  ターンごとのコスト推定も、これに合わせてフォールバック処理されたターンを Opus 料金で価格付けします。
- ストリーム途中の拒否では、すでにストリーミングされた Fable の部分も
  Anthropic 側で追加課金されます。その部分は API の試行ごとの
  使用量に報告されますが、OpenClaw のターンごとの推定には組み込まれません。

### スコープ

`api.anthropic.com` に対する APIキー認証の
`anthropic/claude-fable-5` に適用されます。OAuth（Claude CLI サブスクリプション再利用）、プロキシベース URL、
Bedrock、Vertex、Foundry リクエストは変更されず、そこでは引き続き
拒否がエラーとして表面化します。

ライブ検証済み: Fable 5 に生の chain of
thought を再現するよう求める良性のプロンプトは、フォールバックなしで送信すると
`category: "reasoning_extraction"` で拒否され、OpenClaw 経由の同じプロンプトは
`provider_fallback` 診断が添付された通常の Opus 処理の回答を返します。

基礎となる動作については、Anthropic の [拒否とフォールバック
ガイド](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) を参照してください。

## プロンプトキャッシュ

OpenClaw は APIキー認証で Anthropic のプロンプトキャッシュ機能をサポートしています。

| 値                 | キャッシュ期間 | 説明                                |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (デフォルト) | 5分            | APIキー認証に自動適用 |
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
  <Accordion title="エージェントごとのキャッシュ上書き">
    モデルレベルの params をベースラインとして使用し、`agents.list[].params` で特定のエージェントを上書きします。

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

    これにより、同じモデル上のあるエージェントでは長寿命キャッシュを維持し、別のエージェントではバースト的で再利用の少ないトラフィック向けにキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claude の注意点">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合に `cacheRetention` のパススルーを受け付けます。
    - Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` へ強制されます。
    - 明示的な値が設定されていない場合、APIキーのスマートデフォルトは Claude-on-Bedrock 参照にも `cacheRetention: "short"` を設定します。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClaw の共有 `/fast` トグルは、`api.anthropic.com` への直接 APIキー トラフィックに対して Anthropic の `service_tier` フィールドを設定します。

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
    - APIキーで行われる直接の `api.anthropic.com` リクエストにのみ適用されます。OAuth/サブスクリプショントークンのリクエストとプロキシルートには、`service_tier` フィールドは追加されません。
    - 明示的な `serviceTier` または `service_tier` params は、両方が設定されている場合に `/fast` を上書きします。
    - Priority Tier 容量がないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドルされた Anthropic Plugin は、画像と PDF の理解を登録します。OpenClaw は
    設定済みの Anthropic 認証からメディア機能を自動解決します。追加の
    設定は不要です。

    | プロパティ      | 値                    |
    | --------------- | --------------------- |
    | デフォルトモデル | `claude-opus-4-8`     |
    | サポートされる入力 | 画像、PDFドキュメント |

    会話に画像または PDF が添付されると、OpenClaw は自動的に
    Anthropic メディア理解プロバイダー経由でルーティングします。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ">
    Anthropic の 1M コンテキストウィンドウは、adaptive
    thinking 対応の Claude 4.x モデルで GA です。対象は Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6 です。OpenClaw はこれらの
    モデルを自動的に 1,048,576 トークンとしてサイズ設定するため、`params.context1m` は不要です。

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

    古い設定では `params.context1m: true` を残してもかまいません。これらの
    モデルでは無害な no-op であり、OpenClaw は廃止済みの
    `context-1m-2025-08-07` beta ヘッダーを今後送信しません。その値を持つ古い `anthropicBeta` 設定
    エントリはリクエストヘッダー解決時に削除され、
    サポート対象外の古い Claude モデルは通常のコンテキストウィンドウのままです。

    `params.context1m: true` は Claude CLI バックエンド
    （`claude-cli/*`）でも同じように動作します。対象の GA 対応 Opus および Sonnet モデルはすでに
    1M ウィンドウを自動的に取得するため、この param はそこでも任意です。

    <Warning>
    Anthropic 資格情報でロングコンテキストアクセスが必要です。OAuth/サブスクリプショントークン認証は必要な Anthropic beta ヘッダーを維持しますが、OpenClaw は古い設定に廃止済みの 1M beta ヘッダーが残っている場合、それを削除します。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M コンテキスト">
    `anthropic/claude-opus-4-8` とその `claude-cli` バリアントは、デフォルトで 1M コンテキスト
    ウィンドウを持ちます。`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / トークンが突然無効になる">
    Anthropic トークン認証は期限切れになり、取り消される場合があります。新しいセットアップでは、代わりに Anthropic APIキーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の APIキーが見つかりません'>
    Anthropic 認証は**エージェントごと**です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントでオンボーディングを再実行するか、Gateway ホストで APIキーを設定してから、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の資格情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルがアクティブか確認してください。オンボーディングを再実行するか、そのプロファイルパスの APIキーを設定してください。
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
    Claude CLI バックエンドのセットアップと実行時の詳細。
  </Card>
  <Card title="プロンプトキャッシュ" href="/ja-JP/reference/prompt-caching" icon="database">
    プロンプトキャッシュがプロバイダー間でどのように機能するか。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と資格情報の再利用ルール。
  </Card>
</CardGroup>
