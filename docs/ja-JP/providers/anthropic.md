---
read_when:
    - OpenClaw で Anthropic モデルを使用したい場合
    - ペアリングされたコンピューター間で Claude CLI または Claude Desktop のセッションを閲覧したい場合
summary: OpenClaw で API キーまたは Claude CLI を使用して Anthropic Claude を利用する
title: Anthropic
x-i18n:
    generated_at: "2026-07-12T14:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f15c88c33120f64d0c1c64b291380f4b8824c13262ba0b2a57662003cfb26adc
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを開発しています。OpenClaw は 2 つの認証経路をサポートしています。

- **API キー** - 使用量ベースの課金による Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** - 同じホスト上にある既存の Claude Code ログインを再利用

## 使用量とコストの追跡

OpenClaw は利用可能な Anthropic 認証情報を検出し、対応する使用量表示を選択します。

- Claude のサブスクリプション／セットアップ認証情報では、クォータ期間と、オプションの追加使用量予算が表示されます。
- `ANTHROPIC_ADMIN_KEY` または `ANTHROPIC_ADMIN_API_KEY` を使用すると、プロバイダーから報告された過去 30 日間の組織コストと Messages API 使用量が Control UI の **使用量** に表示されます。これには、日別支出、トークン／キャッシュ合計、上位モデル、コストカテゴリが含まれます。
- Anthropic プロバイダープロファイルに保存された `sk-ant-admin...` 認証情報は、Admin API キーとして自動的に検出されます。

Admin API のコスト履歴は、Anthropic の [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) から取得されます。これはプロバイダーによる実際の請求額であり、OpenClaw がセッションから算出する推定コストとは別のものです。

<Warning>
OpenClaw の Claude CLI バックエンドは、インストール済みの Claude Code CLI を
非対話型の出力モード（`claude -p`）で実行します。Anthropic の現在の Claude Code ドキュメントでは、
このモードを Agent SDK／プログラムによる使用として説明しています。2026 年 6 月 15 日の
Anthropic のサポート更新により、発表されていた Agent SDK の個別課金への変更は一時停止されました。Claude
Agent SDK、`claude -p`、およびサードパーティーアプリでの使用は、引き続きログイン中の
サブスクリプションの使用量上限から消費されます。また、以前発表された月次 Agent SDK
クレジットは、Anthropic がこのプランを見直している間は利用できません。

対話型の Claude Code も、引き続きログイン中の Claude プランの上限から消費されます。
API キー認証では従量課金が直接適用され、そのプランには依存しません。
長時間稼働する Gateway ホスト、共有自動化、予測可能な本番環境の
支出には、Anthropic API キーを使用してください。

Anthropic の現在のサポート記事によって、OpenClaw のリリースなしにこの動作が変更される
可能性があります。

- [Claude Code CLI リファレンス](https://code.claude.com/docs/en/cli-usage)
- [Claude プランで Claude Agent SDK を使用する](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Pro または Max プランで Claude Code を使用する](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Team または Enterprise プランで Claude Code を使用する](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code のコストを管理する](https://code.claude.com/docs/en/costs)

</Warning>

## はじめに

<Tabs>
  <Tab title="API キー">
    **最適な用途：** 標準的な API アクセスと使用量ベースの課金。

    <Steps>
      <Step title="API キーを取得する">
        [Anthropic Console](https://console.anthropic.com/) で API キーを作成します。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # 選択：Anthropic API key
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
    **最適な用途：** 個別の API キーを使わずに、既存の Claude CLI ログインを再利用する場合。

    <Steps>
      <Step title="Claude CLI がインストール済みでログインされていることを確認する">
        次のコマンドで確認します。

        ```bash
        claude --version
        ```
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # 選択：Claude CLI
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
    Claude CLI バックエンドのセットアップとランタイムの詳細については、[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。
    </Note>

    <Warning>
    Claude CLI の再利用では、OpenClaw プロセスが Claude CLI のログインと同じホスト上で実行される
    ことを前提とします。Docker インストールではコンテナのホームを永続化し、そこで
    Claude Code にログインできます。詳細については、
    [Docker での Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker)を参照してください。
    [Podman](/ja-JP/install/podman) など、その他のコンテナインストールでは、ホストの
    `~/.claude` はセットアップ時にもランタイム時にもマウントされません。その場合は Anthropic API キーを使用するか、
    [OpenAI Codex](/ja-JP/providers/openai) など、OpenClaw が管理する OAuth を備えた
    プロバイダーを選択してください。
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

    後方互換性のため、従来の `claude-cli/claude-opus-4-7` モデル参照も引き続き機能しますが、
    新しい設定ではプロバイダー／モデルの選択を
    `anthropic/*` とし、実行バックエンドをプロバイダー／モデルのランタイムポリシーに配置してください。

    ### 課金と `claude -p`

    OpenClaw は Claude CLI の実行に、Claude Code の非対話型 `claude -p` 経路を
    使用します。Anthropic は現在、この経路を Agent SDK／プログラムによる使用として扱っています。

    - 2026 年 6 月 15 日の Anthropic のサポート更新により、以前発表されていた
      Agent SDK の個別クレジットプランは一時停止されました。
    - サブスクリプションプランでの Claude Agent SDK、`claude -p`、およびサードパーティーアプリの使用は、
      引き続きログイン中のサブスクリプションの使用量上限から消費されます。
    - 以前発表された月次 Agent SDK クレジットは、
      Anthropic がこのプランを見直している間は利用できません。
    - Console／API キーによるログインには従量課金の API 請求が適用され、
      サブスクリプションの Agent SDK クレジットは付与されません。

    一時停止のお知らせについては Anthropic の [Agent SDK プランに関する
    記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)を、サブスクリプションの動作については Claude Code プランの記事
    [Pro／Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    および
    [Team／Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    を参照してください。

    Anthropic は OpenClaw のリリースなしに、Claude Code の課金およびレート制限の動作を
    変更する可能性があります。課金の予測可能性が重要な場合は、`claude auth status`、`/status`、および
    リンク先の Anthropic ドキュメントを確認してください。

    <Tip>
    共有の本番自動化には、Claude CLI ではなく Anthropic API キーを使用してください。
    OpenClaw は、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/zai) の
    サブスクリプション形式のオプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## コンピューター間の Claude セッション

バンドルされている Anthropic Plugin は、通常のセッションサイドバーに **Claude Code** グループを
追加します。各行は通常の Chat ペインで開きます。このグループは、Gateway および接続済み Node ホスト上にある、
アーカイブされていない Claude Code セッションを検出します。

- Claude CLI セッションは、有効なプロジェクトインデックスレコードと、限定されたメタデータ接頭辞によって
  `~/.claude/projects/` 配下の非サイドチェーン `sdk-cli` セッションと識別される現在の JSONL
  ファイルから取得されます。
- Claude Desktop セッションでは、そのメタデータが同じ Claude Code セッション ID を指している場合、
  Desktop のタイトル、アクティビティ時刻、アーカイブ状態が使用されます。
- CLI のみのセッションにはアーカイブフラグがないため、トランスクリプトが存在する間は
  表示されたままになります。

OpenClaw の追加設定は不要です。Anthropic Plugin はバンドルされており、
デフォルトで有効です。ネイティブ macOS Node は、ローカルの `~/.claude/projects/` ディレクトリが存在すると、
読み取り専用の Claude セッションコマンドを公開します。これらのコマンドが初めて表示されたときに、
Node ペアリングのアップグレードを承認してください。

サイドバーは各ホストの最新の上限付きページから開始し、通常の 30 秒間隔で更新されます。カタロググループの下にある **さらにセッションを読み込む** を使用すると、
より多くの履歴があるすべてのホストについて次のページが追加されます。追加された行は
表示されたままになり、更新時にも同じ深さまで再取得されます。カタログクライアントは
`sessions.catalog.list` を使用し、行を開く際には `sessions.catalog.read` を使用します。

行を選択すると、最初に最新のトランスクリプトページが読み込まれます。**古いトランスクリプト項目を読み込む**
は不透明なバイトカーソルに従い、履歴全体を読み込む代わりに
JSONL ファイルから上限付きの別セクションを読み込みます。通常のユーザー、アシスタント、
推論、ツール呼び出し、ツール結果の内容は保持されます。個々の項目が
Node／Gateway の安全上限を超える場合は、切り詰められたことが明確に示されます。

Gateway ローカルの `claude-cli` 行では、通常のコンポーザーに入力すると
`sessions.catalog.continue` が呼び出されます。OpenClaw はローカルカタログレコードを再解決し、
モデルが固定されたネイティブセッションを作成または再利用して、表示可能な項目を最大 200 件
または 512 KiB までインポートし、Claude CLI バインディングをシードします。最初のターンは
`--fork-session` で再開されます。Claude はフォークに新しいセッション ID を割り当てるため、以降のターンでは
フォークが使用され、元のセッションは変更されません。Claude Desktop とペアリング済み Node の
行は表示専用です。

<Note>
ペアリング済み Node 上の Claude セッションは読み取り専用です。OpenClaw は Claude
Desktop のメタデータを変更したり、Claude セッションをアーカイブしたり、所有元のコンピューター上で
2 つ目のランナーを起動したりしません。両方の Claude Node コマンドは読み取り専用ですが、
このページでは認証済みの `node.invoke` トランスポートを使用するため、書き込みスコープを持つ
オペレーター接続が必要です。
</Note>

Node コマンドとセキュリティ境界については、[Node：Claude セッションとトランスクリプト](/ja-JP/nodes#claude-sessions-and-transcripts)
を参照してください。

## Thinking のデフォルト（Claude Sonnet 5、Mythos 5、Fable 5、4.8、4.6）

`anthropic/claude-sonnet-5` は、デフォルトで `high` エフォートの適応型 Thinking を使用します。
Thinking を無効にするには `/think off` を使用し、モデルのより高いネイティブエフォートレベルを使用するには
`/think xhigh|max` を使用します。Anthropic は Sonnet 5 でこれらのリクエスト機能をサポートしていないため、
OpenClaw は手動の Thinking バジェット、カスタムサンプリングパラメーター、アシスタントのプリフィル、
および Priority Tier を省略します。
カタログでは、2026 年 8 月 31 日まで Anthropic の導入価格である入力／出力 `$2/$10` を使用します。
標準価格の `$3/$15` は 2026 年 9 月 1 日に開始されます。

`anthropic/claude-fable-5` は常に適応型 Thinking を使用し、デフォルトのエフォートは `high`
です。Anthropic はこのモデルで Thinking を無効にすることを許可していないため、
`/think off` と `/think minimal` は代わりに `low` エフォートへマッピングされます。また、Anthropic は
Thinking が有効なリクエストで temperature のオーバーライドを拒否するため、OpenClaw は Fable 5 のリクエストから
カスタム temperature 値を省略します。

`anthropic/claude-mythos-5` は、同じ常時有効の適応型 Thinking 契約を持つ限定アクセスモデルです。
OpenClaw のデフォルトは `high` で、`/think off` と
`/think minimal` を `low` にマッピングし、呼び出し元が選択したサンプリングパラメーターを省略します。
カタログには、1,000,000 トークンのコンテキストウィンドウ、128,000 トークンの出力
上限、画像入力、および入力／出力価格 `$10/$50` が掲載されます。

Claude Opus 4.8 では、OpenClaw のデフォルトで Thinking は無効です。`/think high|xhigh|max` で
適応型 Thinking を明示的に有効にすると、OpenClaw は
Anthropic の Opus 4.8 エフォート値を送信します。Claude 4.6 モデル（Opus 4.6 および Sonnet 4.6）の
デフォルトは `adaptive` です。

メッセージごとに `/think:<level>` でオーバーライドするか、モデルパラメーターで指定します。

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
関連する Anthropic ドキュメント：
- [適応型 Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [拡張 Thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 安全性拒否時のフォールバック（Claude Fable 5）

<Warning>
Claude Fable 5 を使用すると、Claude Opus 4.8 も使用することになります。Fable 5 には、
リクエストを拒否する場合がある安全性分類器が搭載されており、Anthropic が認める
回復方法は、そのターンを `claude-opus-4-8` に処理させることです。OpenClaw は
API キーによる直接リクエストでこれを自動的に有効にするため、一部の Fable のターンは
Claude Opus 4.8 によって回答され、Claude Opus 4.8 として課金されます。ポリシーまたは予算上、
Opus が処理するターンを許容できない場合は、`anthropic/claude-fable-5` を選択しないでください。
</Warning>

### これが存在する理由

Fable 5 の分類器は、制限対象の分野に関するリクエストに対して
`stop_reason: "refusal"` を返します。また、無害な隣接分野の作業（セキュリティ
ツール、ライフサイエンス、さらにはモデルに生の推論を再現するよう依頼する場合）も
誤検知します。フォールバックがなければ、別の Claude モデルなら問題なく処理できる場合でも、
そのターンはエラーで終了します。Anthropic 自身の拒否メッセージでも、
API インテグレーターにフォールバックモデルを設定するよう案内しています。

### 仕組み

1. `anthropic/claude-fable-5` に対する API キーによるすべての直接リクエストで、OpenClaw は
   Anthropic のサーバー側フォールバックのオプトインを送信します。具体的には、
   `server-side-fallback-2026-06-01` ベータヘッダーと
   `fallbacks: [{"model": "claude-opus-4-8"}]` です。Claude Opus 4.8 は、
   Anthropic が Fable 5 に対して許可している唯一のフォールバック先です。
2. フォールバックをトリガーするのは、安全性分類器による拒否だけです。レート制限、
   過負荷、サーバーエラーの動作は以前とまったく同じで、OpenClaw の通常の
   [モデルフェイルオーバー](/ja-JP/concepts/model-failover)を経由します。
3. 救済処理は同じ呼び出し内で行われます。出力前の拒否は、レイテンシー以外では
   確認できず、回答全体が Opus 4.8 から返されます。ストリーム途中で拒否された場合、
   部分的なテキストは、フォールバックモデルが続きを生成するためのプレフィックスとして
   保持されます。一方、拒否したモデルの推論とツール呼び出しは、Anthropic の再生ルールに
   従って破棄されます（それらを応答に含めたり、実行したりしてはなりません）。
4. Claude Opus 4.8 も拒否した場合、そのターンでは、この機能の導入前とまったく同様に、
   拒否がエラーとして表面化します。

フォールバックは Anthropic API レベルで行われるため、`claude-opus-4-8` を
設定済みモデルリストやフォールバックチェーンに含める必要はありません。Fable を利用可能な
API キーでは、常に Opus も利用できます。

### 可観測性と課金

- フォールバックで処理されたターンでは、アシスタントメッセージに `fromModel` と
  `toModel` を示す `provider_fallback` 診断情報が記録され、メッセージの
  `responseModel` は `claude-opus-4-8` を報告します。
- Anthropic は試行ごとに課金します。出力前の拒否は無料で、救済処理には
  Claude Opus 4.8 の料金（現在は Fable 5 の半額）が適用されます。これと一致するように、
  OpenClaw のターンごとのコスト見積もりでは、フォールバックで処理されたターンを
  Opus の料金で計算します。
- ストリーム途中で拒否された場合、Anthropic 側では、すでにストリーミングされた Fable の
  部分にも追加で課金されます。その部分は API の試行ごとの使用量には報告されますが、
  OpenClaw のターンごとの見積もりには含まれません。

### 適用範囲

API キー認証を使用して `api.anthropic.com` に接続する
`anthropic/claude-fable-5` に適用されます。OAuth（Claude CLI サブスクリプションの再利用）、
プロキシのベース URL、Bedrock、Vertex、Foundry のリクエストには変更がなく、
これらでは引き続き拒否がエラーとして表面化します。

ライブ検証済み：Fable 5 に生の思考連鎖を再現するよう求める無害なプロンプトは、
フォールバックなしで送信すると `category: "reasoning_extraction"` で拒否されますが、
同じプロンプトを OpenClaw 経由で送信すると、`provider_fallback` 診断情報が付加された、
Opus が処理する通常の回答が返されます。

基盤となる動作については、Anthropic の[拒否とフォールバックの
ガイド](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)を参照してください。

## プロンプトキャッシュ

OpenClaw は、API キー認証で Anthropic のプロンプトキャッシュ機能をサポートします。

| 値                  | キャッシュ期間 | 説明                                         |
| ------------------- | -------------- | -------------------------------------------- |
| `"short"`（既定値） | 5 分           | API キー認証で自動的に適用されます          |
| `"long"`            | 1 時間         | キャッシュ期間を延長します                   |
| `"none"`            | キャッシュなし | プロンプトキャッシュを無効にします           |

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
    モデルレベルのパラメーターを基準として使用し、`agents.list[].params` で特定のエージェントを上書きします。

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

    設定のマージ順序：

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（一致する `id` をキーごとに上書き）

    これにより、同じモデルを使用する一方のエージェントでは長期間のキャッシュを維持しながら、別のエージェントでは突発的で再利用率の低いトラフィックに対してキャッシュを無効にできます。

  </Accordion>

  <Accordion title="Bedrock Claude に関する注意事項">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合に `cacheRetention` のパススルーを受け付けます。
    - Anthropic 以外の Bedrock モデルは、実行時に `cacheRetention: "none"` を強制されます。
    - API キー向けのスマートな既定値では、明示的な値が設定されていない場合、Bedrock 上の Claude の参照にも `cacheRetention: "short"` が設定されます。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClaw の共通 `/fast` トグルは、`api.anthropic.com` への API キーによる直接トラフィックに対して、Anthropic の `service_tier` フィールドを設定します。

    | コマンド | 対応する値 |
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
    - API キーを使用して行われる `api.anthropic.com` への直接リクエストにのみ適用されます。OAuth／サブスクリプショントークンによるリクエストとプロキシ経由のリクエストには、`service_tier` フィールドが追加されません。
    - 明示的な `serviceTier` または `service_tier` パラメーターが設定されている場合は、`/fast` よりも優先されます。
    - Priority Tier の容量がないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    同梱の Anthropic Plugin は、画像と PDF の理解機能を登録します。OpenClaw は、
    設定された Anthropic 認証からメディア機能を自動的に解決するため、
    追加の設定は必要ありません。

    | プロパティ       | 値                    |
    | --------------- | --------------------- |
    | 既定モデル       | `claude-opus-4-8`     |
    | 対応入力         | 画像、PDF ドキュメント |

    画像または PDF が会話に添付されると、OpenClaw は自動的に
    Anthropic メディア理解プロバイダー経由で処理します。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ">
    Claude Sonnet 5、Mythos 5、Fable 5 は、正確に 1,000,000 トークンの入力
    ウィンドウを持ち、最大 128,000 出力トークンをサポートします。Anthropic の 1M コンテキスト
    ウィンドウは、適応的思考を備えた Claude 4.x モデルでも GA です。対象は Opus 4.8、
    Opus 4.7、Opus 4.6、Sonnet 4.6 です。OpenClaw はこれらのモデルのサイズを
    自動的に設定するため、`params.context1m` は不要です。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    古い設定では `params.context1m: true` を維持できます。これはこれらのモデルでは
    無害な no-op であり、OpenClaw は設定にかかわらず、廃止された
    `context-1m-2025-08-07` ベータヘッダーを送信しなくなりました。その値を持つ古い
    `anthropicBeta` 設定エントリは、リクエストヘッダーの解決時に削除されます。サポート対象外の
    古い Claude モデルでは、通常のコンテキストウィンドウが引き続き使用されます。

    Claude CLI バックエンド（`claude-cli/*`）でも、`params.context1m: true` は
    同様に動作します。GA 対応の対象となる Opus と Sonnet モデルには、すでに
    1M ウィンドウが自動的に適用されるため、そこでもこのパラメーターは省略可能です。

    <Warning>
    Anthropic の資格情報で長いコンテキストへのアクセス権が必要です。OAuth／サブスクリプショントークン認証では、必要な Anthropic ベータヘッダーが維持されますが、古い設定に廃止済みの 1M ベータヘッダーが残っている場合、OpenClaw はそれを削除します。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 の 1M コンテキスト">
    `anthropic/claude-opus-4-8` とその `claude-cli` バリアントには、既定で 1M コンテキスト
    ウィンドウがあるため、`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー／トークンが突然無効になった">
    Anthropic のトークン認証には有効期限があり、取り消されることもあります。新規セットアップでは、代わりに Anthropic API キーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の API キーが見つかりません'>
    Anthropic 認証は**エージェントごと**に設定されます。新しいエージェントは、メインエージェントのキーを継承しません。そのエージェントでオンボーディングを再実行するか、Gateway ホストで API キーを設定してから、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の資格情報が見つかりません'>
    `openclaw models status` を実行して、どの認証プロファイルが有効か確認してください。オンボーディングを再実行するか、そのプロファイルパスに API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `openclaw models status --json` の `auth.unusableProfiles` を確認してください。Anthropic のレート制限によるクールダウンはモデル単位の場合があるため、同じ Anthropic の別モデルは引き続き利用できる可能性があります。別の Anthropic プロファイルを追加するか、クールダウンが終了するまで待ってください。
  </Accordion>
</AccordionGroup>

<Note>
その他のヘルプ：[トラブルシューティング](/ja-JP/help/troubleshooting)と[よくある質問](/ja-JP/help/faq)。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
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
