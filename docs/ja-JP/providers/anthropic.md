---
read_when:
    - OpenClaw で Anthropic モデルを使用したい場合
summary: OpenClaw で API キーまたは Claude CLI 経由で Anthropic Claude を使用する
title: Anthropic
x-i18n:
    generated_at: "2026-07-05T11:42:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95930cec942ae6a57221cdca7db88a82a69e1670fd49e9726bba9850303aa9a6
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを構築しています。OpenClaw は 2 つの認証ルートをサポートします。

- **API キー** - 使用量ベースの課金による Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** - 同じホスト上の既存の Claude Code ログインを再利用

<Warning>
OpenClaw の Claude CLI バックエンドは、インストール済みの Claude Code CLI を
非対話の print モード（`claude -p`）で実行します。Anthropic の現在の Claude Code ドキュメントでは、
このモードを Agent SDK/プログラムによる使用として説明しています。Anthropic の 2026 年 6 月 15 日の
サポート更新では、発表済みだった別個の Agent SDK 課金変更が一時停止されました。Claude
Agent SDK、`claude -p`、およびサードパーティアプリの使用は引き続き、サインイン済み
サブスクリプションの使用制限から消費され、以前発表された月次 Agent SDK
クレジットは、Anthropic がその計画を見直している間は利用できません。

対話型の Claude Code も、引き続きサインイン済み Claude プランの制限から消費されます。
API キー認証は直接の従量課金であり、そのプランには依存しません。
長期間稼働する Gateway ホスト、共有オートメーション、予測可能な本番環境の
支出には、Anthropic API キーを使用してください。

Anthropic の現在のサポート記事により、OpenClaw のリリースなしにこの動作が変更される可能性があります。

- [Claude Code CLI リファレンス](https://code.claude.com/docs/en/cli-usage)
- [Claude プランで Claude Agent SDK を使用する](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Team または Enterprise プランで Claude Code を使用する](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code のコストを管理する](https://code.claude.com/docs/en/costs)

</Warning>

## はじめに

<Tabs>
  <Tab title="API キー">
    **最適な用途:** 標準的な API アクセスと使用量ベースの課金。

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
    **最適な用途:** 別個の API キーなしで既存の Claude CLI ログインを再利用する場合。

    <Steps>
      <Step title="Claude CLI がインストールされ、ログイン済みであることを確認する">
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

    <Warning>
    Claude CLI の再利用では、OpenClaw プロセスが Claude CLI ログインと同じホスト上で実行されることが前提です。Docker インストールではコンテナのホームを永続化し、そこで Claude Code にログインできます。詳しくは
    [Docker の Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker) を参照してください。
    [Podman](/ja-JP/install/podman) などの他のコンテナインストールでは、セットアップや実行時にホストの
    `~/.claude` はマウントされません。そこでは Anthropic API キーを使用するか、
    [OpenAI Codex](/ja-JP/providers/openai) のような OpenClaw 管理の OAuth を持つプロバイダーを選択してください。
    </Warning>

    ### 設定例

    正規の Anthropic モデル参照と CLI ランタイムのオーバーライドを優先します。

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

    従来の `claude-cli/claude-opus-4-7` モデル参照は互換性のため引き続き動作しますが、
    新しい設定ではプロバイダー/モデルの選択を `anthropic/*` のままにし、
    実行バックエンドはプロバイダー/モデルのランタイムポリシーに配置する必要があります。

    ### 課金と `claude -p`

    OpenClaw は Claude CLI 実行に Claude Code の非対話 `claude -p` パスを使用します。
    Anthropic は現在、そのパスを Agent SDK/プログラムによる使用として扱っています。

    - Anthropic の 2026 年 6 月 15 日のサポート更新では、以前発表された
      別個の Agent SDK クレジットプランが一時停止されました。
    - サブスクリプションプランの Claude Agent SDK、`claude -p`、およびサードパーティアプリの使用は、
      引き続きサインイン済みサブスクリプションの使用制限から消費されます。
    - 以前発表された月次 Agent SDK クレジットは、Anthropic がその計画を見直している間は利用できません。
    - Console/API キーログインは従量課金の API 課金を使用し、
      サブスクリプションの Agent SDK クレジットは受け取りません。

    一時停止通知については Anthropic の [Agent SDK プラン
    記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) を参照し、サブスクリプションの動作については Claude Code プランの記事の
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    および
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    を参照してください。

    Anthropic は OpenClaw のリリースなしに、Claude Code の課金とレート制限の動作を変更できます。課金の予測可能性が重要な場合は、`claude auth status`、`/status`、および
    Anthropic のリンクされたドキュメントを確認してください。

    <Tip>
    共有本番オートメーションには、Claude CLI ではなく Anthropic API キーを使用してください。
    OpenClaw は [OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、および [Z.AI / GLM](/ja-JP/providers/zai) の
    サブスクリプション形式のオプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## thinking のデフォルト（Claude Fable 5、4.8、4.6）

`anthropic/claude-fable-5` は常に adaptive thinking を使用し、デフォルトは `high`
effort です。Anthropic はこのモデルで thinking を無効にすることを許可していないため、
`/think off` と `/think minimal` は代わりに `low` effort にマップされます。OpenClaw はまた、
Fable 5 リクエストではカスタム temperature 値を省略します。これは、Anthropic が
thinking 有効リクエストの temperature オーバーライドを拒否するためです。

Claude Opus 4.8 では、OpenClaw のデフォルトで thinking はオフのままです。`/think high|xhigh|max` で adaptive thinking を明示的に有効にすると、OpenClaw は
Anthropic の Opus 4.8 effort 値を送信します。Claude 4.6 モデル（Opus 4.6 と Sonnet 4.6）は
デフォルトで `adaptive` です。

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 安全性による拒否のフォールバック（Claude Fable 5）

<Warning>
Claude Fable 5 を使用することは、Claude Opus 4.8 も使用することを意味します。Fable 5 には
リクエストを拒否できる安全性分類器が同梱されており、Anthropic が認可する
復旧方法は、そのターンを `claude-opus-4-8` に処理させることです。OpenClaw は
直接 API キーリクエストではこれに自動的にオプトインするため、一部の Fable ターンは
Claude Opus 4.8 として回答され、課金されます。ポリシーまたは予算上、
Opus が処理するターンを受け入れられない場合は、`anthropic/claude-fable-5` を選択しないでください。
</Warning>

### これが存在する理由

Fable 5 の分類器は、制限されたドメインのリクエストに対して `stop_reason: "refusal"` を返し、
無害に近い作業（セキュリティツール、ライフサイエンス、またはモデルに生の推論を
再現するよう求める場合でさえ）でも誤検知します。フォールバックがないと、
別の Claude モデルなら問題なく処理できる場合でもターンはエラーで終了します。Anthropic 自身の拒否メッセージは、
API インテグレーターにフォールバックモデルを設定するよう伝えています。

### 仕組み

1. `anthropic/claude-fable-5` へのすべての直接 API キーリクエストで、OpenClaw は
   Anthropic のサーバー側フォールバックのオプトインを送信します。つまり
   `server-side-fallback-2026-06-01` ベータヘッダーと
   `fallbacks: [{"model": "claude-opus-4-8"}]` です。Claude Opus 4.8 は、Anthropic が Fable 5 に対して許可する唯一の
   フォールバック先です。
2. 安全性分類器による拒否のみがフォールバックをトリガーします。レート制限、
   過負荷、サーバーエラーはこれまでとまったく同じように動作し、
   OpenClaw の通常の [モデルフェイルオーバー](/ja-JP/concepts/model-failover) を通ります。
3. 救済は同じ呼び出し内で発生します。出力前の拒否は
   レイテンシ以外では見えず、回答全体は Opus 4.8 から来ます。
   ストリーム途中の拒否では、部分テキストはフォールバック
   モデルが続行するプレフィックスとして保持されます。一方、拒否されたモデルの推論とツール呼び出しは、
   Anthropic のリプレイルールに従って破棄されます（それらはエコーバックしたり
   実行したりしてはなりません）。
4. Claude Opus 4.8 も拒否した場合、そのターンはこの機能以前とまったく同じように、
   拒否をエラーとして表面化します。

フォールバックは Anthropic API レベルで発生するため、`claude-opus-4-8` は
設定済みモデルリストやフォールバックチェーンに含まれている必要はありません。Fable 対応の
API キーは常に Opus を処理できます。

### 可観測性と課金

- フォールバックで処理されたターンは、assistant メッセージに `fromModel` と `toModel` を示す
  `provider_fallback` 診断を記録し、メッセージの
  `responseModel` は `claude-opus-4-8` を報告します。
- Anthropic は試行ごとに課金します。出力前の拒否は無料で、救済は
  Claude Opus 4.8 の料金（現在は Fable 5 の料金の半分）で課金されます。OpenClaw の
  ターンごとのコスト見積もりは、これに合わせてフォールバック処理されたターンを Opus 料金で価格設定します。
- ストリーム途中の拒否では、すでにストリームされた Fable の部分が Anthropic 側で追加課金されます。
  その部分は API の試行ごとの使用量には報告されますが、
  OpenClaw のターンごとの見積もりには組み込まれません。

### スコープ

`api.anthropic.com` に対する API キー認証での `anthropic/claude-fable-5` に適用されます。
OAuth（Claude CLI サブスクリプション再利用）、プロキシベース URL、
Bedrock、Vertex、Foundry リクエストは変更されず、そこでは引き続き
拒否がエラーとして表面化します。

ライブ検証済み: Fable 5 に生の chain of thought を再現するよう求める無害なプロンプトは、
フォールバックなしで送信すると `category: "reasoning_extraction"` で拒否され、同じプロンプトを OpenClaw 経由で送信すると、
`provider_fallback` 診断が添付された通常の Opus 処理の回答が返ります。

基礎となる動作については Anthropic の [拒否とフォールバック
ガイド](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) を参照してください。

## プロンプトキャッシュ

OpenClaw は API キー認証で Anthropic のプロンプトキャッシュ機能をサポートします。

| 値                  | キャッシュ期間 | 説明                                  |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (デフォルト) | 5 分           | API キー認証に自動的に適用されます |
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
  <Accordion title="エージェントごとのキャッシュオーバーライド">
    モデルレベルの params をベースラインとして使用し、その後 `agents.list[].params` で特定のエージェントをオーバーライドします。

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
    2. `agents.list[].params`（`id` が一致するもの、キーごとに上書き）

    これにより、同じモデル上のあるエージェントでは長期間保持されるキャッシュを使い、別のエージェントではバースト的で再利用の少ないトラフィック向けにキャッシュを無効化できます。

  </Accordion>

  <Accordion title="Bedrock Claude の注意事項">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合に `cacheRetention` のパススルーを受け付けます。
    - Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` に強制されます。
    - 明示的な値が設定されていない場合、APIキーのスマートデフォルトも Claude-on-Bedrock 参照に `cacheRetention: "short"` をシードします。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClaw の共有 `/fast` トグルは、`api.anthropic.com` への直接 APIキートラフィックに対して Anthropic の `service_tier` フィールドを設定します。

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
    - APIキーを使って行われる直接の `api.anthropic.com` リクエストにのみ適用されます。OAuth/サブスクリプショントークンのリクエストとプロキシルートには、`service_tier` フィールドは追加されません。
    - 明示的な `serviceTier` または `service_tier` パラメーターは、両方が設定されている場合に `/fast` を上書きします。
    - Priority Tier 容量のないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドルされた Anthropic Plugin は、画像と PDF の理解を登録します。OpenClaw は、設定済みの Anthropic 認証からメディア機能を自動解決します。追加設定は不要です。

    | プロパティ        | 値                 |
    | --------------- | --------------------- |
    | デフォルトモデル   | `claude-opus-4-8`     |
    | 対応入力 | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw は自動的にそれを Anthropic メディア理解プロバイダー経由でルーティングします。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ">
    Anthropic の 1M コンテキストウィンドウは、adaptive thinking 対応の Claude 4.x モデルで GA です: Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6。OpenClaw はこれらのモデルを自動的に 1,048,576 トークンとしてサイズ設定するため、`params.context1m` は不要です:

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

    古い設定では `params.context1m: true` を保持できます。これらのモデルでは無害な no-op であり、OpenClaw は廃止済みの `context-1m-2025-08-07` ベータヘッダーを今後送信しません。その値を持つ古い `anthropicBeta` 設定エントリは、リクエストヘッダー解決時に削除され、非対応の古い Claude モデルは通常のコンテキストウィンドウのままです。

    `params.context1m: true` は Claude CLI バックエンド（`claude-cli/*`）でも同じように動作します。対象となる GA 対応の Opus および Sonnet モデルはすでに 1M ウィンドウを自動的に取得するため、そこでもこのパラメーターは任意です。

    <Warning>
    Anthropic 資格情報で long-context アクセスが必要です。OAuth/サブスクリプショントークン認証は必要な Anthropic ベータヘッダーを保持しますが、古い設定に廃止済みの 1M ベータヘッダーが残っている場合、OpenClaw はそれを削除します。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M コンテキスト">
    `anthropic/claude-opus-4-8` とその `claude-cli` バリアントは、デフォルトで 1M コンテキストウィンドウを持ちます。`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー / トークンが突然無効になる">
    Anthropic トークン認証は期限切れになり、取り消されることもあります。新規セットアップでは、代わりに Anthropic APIキーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の APIキーが見つかりません'>
    Anthropic 認証は**エージェントごと**です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントのオンボーディングを再実行するか、Gateway ホストで APIキーを設定してから、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の資格情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルがアクティブかを確認してください。オンボーディングを再実行するか、そのプロファイルパス用の APIキーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `openclaw models status --json` で `auth.unusableProfiles` を確認してください。Anthropic のレート制限クールダウンはモデル単位の場合があるため、兄弟 Anthropic モデルはまだ利用可能なことがあります。別の Anthropic プロファイルを追加するか、クールダウンを待ってください。
  </Accordion>
</AccordionGroup>

<Note>
さらにヘルプが必要な場合: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
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
    プロバイダー間でプロンプトキャッシュがどのように機能するか。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と資格情報の再利用ルール。
  </Card>
</CardGroup>
