---
read_when:
    - OpenClaw で Anthropic モデルを使用する場合
    - ペアリングされたコンピューター間で Claude CLI または Claude Desktop のセッションを閲覧したい場合
summary: API キーまたは Claude CLI を使用して、OpenClaw で Anthropic Claude を利用する
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T12:00:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic は **Claude** モデルファミリーを開発しています。OpenClaw は 2 つの認証経路をサポートしています。

- **API キー** - 使用量ベースの課金による Anthropic API への直接アクセス（`anthropic/*` モデル）
- **Claude CLI** - 同じホスト上の既存の Claude Code ログインを再利用

## 使用量とコストの追跡

OpenClaw は利用可能な Anthropic 認証情報を検出し、対応する使用量画面を選択します。

- Claude のサブスクリプション／セットアップ認証情報では、クォータ期間とオプションの追加使用量予算が表示されます。
- `ANTHROPIC_ADMIN_KEY` または `ANTHROPIC_ADMIN_API_KEY` では、Control UI の **使用量** に、プロバイダーから報告された組織の 30 日間のコストと Messages API 使用量が表示されます。これには、日別支出、トークン／キャッシュ合計、上位モデル、コストカテゴリが含まれます。
- Anthropic プロバイダープロファイルに保存された `sk-ant-admin...` 認証情報は、Admin API キーとして自動的に検出されます。

Admin API のコスト履歴は、Anthropic の [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) から取得されます。これは実際のプロバイダー請求額であり、OpenClaw がセッションから算出する推定コストとは別です。

<Warning>
OpenClaw の Claude CLI バックエンドは、インストール済みの Claude Code CLI を
非対話型の print モード（`claude -p`）で実行します。Anthropic の現在の Claude Code ドキュメントでは、
このモードを Agent SDK／プログラムによる使用として説明しています。Anthropic の 2026 年 6 月 15 日の
サポート更新により、発表されていた個別の Agent SDK 課金変更は一時停止されました。Claude
Agent SDK、`claude -p`、およびサードパーティ製アプリの使用量は、引き続きログイン中の
サブスクリプションの使用量上限から消費されます。また、以前発表された月間 Agent SDK
クレジットは、Anthropic がこのプランを見直している間は利用できません。

対話型の Claude Code も、引き続きログイン中の Claude プランの上限から消費されます。
API キー認証は直接の従量課金であり、そのプランには依存しません。
長期間稼働する Gateway ホスト、共有自動化、予測可能な本番環境の
支出には、Anthropic API キーを使用してください。

Anthropic の現在のサポート記事によって、OpenClaw のリリースなしに
この動作が変更される可能性があります。

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
        # 選択: Anthropic API key
        ```

        または、キーを直接渡します。

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最適な用途:** 別の API キーを使わずに、既存の Claude CLI ログインを再利用する場合。

    <Steps>
      <Step title="Claude CLI がインストールされ、ログイン済みであることを確認する">
        次のコマンドで確認します。

        ```bash
        claude --version
        ```
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard
        # 選択: Claude CLI
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
    Claude CLI バックエンドのセットアップと実行時の詳細については、[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。
    </Note>

    <Warning>
    Claude CLI の再利用では、OpenClaw プロセスが Claude CLI のログインと同じホストで
    実行される必要があります。Docker インストールではコンテナのホームを永続化し、そこで
    Claude Code にログインできます。詳細は
    [Docker での Claude CLI バックエンド](/ja-JP/install/docker#claude-cli-backend-in-docker)を参照してください。
    [Podman](/ja-JP/install/podman) などのほかのコンテナインストールでは、ホストの
    `~/.claude` はセットアップ時にも実行時にもマウントされません。その場合は Anthropic API キーを使用するか、
    [OpenAI Codex](/ja-JP/providers/openai) など、OpenClaw が管理する OAuth を備えた
    プロバイダーを選択してください。
    </Warning>

    ### セットアップトークンを取得する

    Claude Code がインストールされている任意のマシンで `claude setup-token` を実行します。
    `sk-ant-oat01-` で始まる長期間有効なトークンが出力されます。

    オンボーディング中に、macOS アプリの **Connect with an API key or token** で
    **Anthropic setup-token** を選択してトークンを貼り付けるか、次を使用します。

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### 設定例

    正規の Anthropic モデル参照と CLI ランタイムオーバーライドの組み合わせを推奨します。

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

    後方互換性のため、従来の `claude-cli/claude-opus-4-7` モデル参照も引き続き動作しますが、
    新しい設定ではプロバイダー／モデルの選択を `anthropic/*` として維持し、
    実行バックエンドをプロバイダー／モデルのランタイムポリシーに配置してください。

    ### 課金と `claude -p`

    OpenClaw は Claude CLI の実行に、Claude Code の非対話型 `claude -p` 経路を使用します。
    Anthropic は現在、この経路を Agent SDK／プログラムによる使用として扱っています。

    - Anthropic の 2026 年 6 月 15 日のサポート更新により、以前発表されていた
      個別の Agent SDK クレジットプランは一時停止されました。
    - サブスクリプションプランでの Claude Agent SDK、`claude -p`、およびサードパーティ製アプリの使用量は、
      引き続きログイン中のサブスクリプションの使用量上限から消費されます。
    - 以前発表された月間 Agent SDK クレジットは、Anthropic が
      このプランを見直している間は利用できません。
    - Console／API キーによるログインでは従量課金の API 請求が適用され、
      サブスクリプションの Agent SDK クレジットは付与されません。

    一時停止の告知については Anthropic の [Agent SDK プランに関する
    記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)を参照してください。また、サブスクリプションの動作については Claude Code プランの記事
    [Pro／Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    および
    [Team／Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    を参照してください。

    Anthropic は、OpenClaw のリリースなしに Claude Code の課金とレート制限の動作を
    変更する可能性があります。課金の予測可能性が重要な場合は、`claude auth status`、`/status`、
    およびリンク先の Anthropic ドキュメントを確認してください。

    <Tip>
    共有の本番自動化には、Claude CLI ではなく Anthropic API キーを使用してください。
    OpenClaw は、[OpenAI Codex](/ja-JP/providers/openai)、[Qwen Cloud](/ja-JP/providers/qwen)、
    [MiniMax](/ja-JP/providers/minimax)、[Z.AI / GLM](/ja-JP/providers/zai) の
    サブスクリプション形式のオプションもサポートしています。
    </Tip>

  </Tab>
</Tabs>

## コンピューター間の Claude セッション

同梱の Anthropic Plugin は、通常のセッションサイドバーに **Claude Code** グループを追加します。
各行は通常のチャットペインで開きます。Gateway および接続済み Node ホスト上にある、
アーカイブされていない Claude Code セッションを検出します。

- Claude CLI セッションは、有効なプロジェクトインデックスレコードと、制限付きメタデータ接頭辞によって
  `~/.claude/projects/` 配下の非サイドチェーン `sdk-cli`
  セッションであることが識別される現在の JSONL ファイルから取得されます。
- Claude Desktop セッションでは、そのメタデータが同じ Claude Code セッション ID を指している場合、
  Desktop のタイトル、アクティビティ時刻、アーカイブ状態が使用されます。
- CLI のみのセッションにはアーカイブフラグがないため、トランスクリプトが存在する間は
  表示されたままになります。

検出に追加の OpenClaw 設定は必要ありません。Anthropic Plugin は同梱されており、
デフォルトで有効です。ネイティブ macOS Node は、ローカルの `~/.claude/projects/` ディレクトリが存在する場合、
読み取り専用の Claude セッションコマンドを通知します。
これらのコマンドが初めて表示されたときに、Node ペアリングのアップグレードを承認してください。

サイドバーでは、各行が Gateway またはペアリングされた Node ホストごとにグループ化され、
各ホストの最新の制限付きページから開始し、通常の 30 秒間隔で更新されます。
カタロググループの下にある **さらにセッションを読み込む** を使用すると、履歴がさらにあるすべてのホストについて
次のページが追加されます。追加された行は表示されたままになり、更新時にも同じ深さまで
再取得されます。カタログクライアントは `sessions.catalog.list` を使用し、行を開くときは `sessions.catalog.read` を使用します。

ターミナルへの引き継ぎでは、サービス／デーモンの PATH より先に、所有ホストユーザーのログインシェルの
PATH から `claude` を解決します。これにより、アプリから起動したセッションは、オペレーターが通常の
ターミナルで使用する Claude CLI と一致します。

行を選択すると、最初に最新のトランスクリプトページが読み込まれます。**古いトランスクリプト項目を
読み込む** は不透明なバイトカーソルをたどり、履歴全体を読み込む代わりに
JSONL ファイルから次の制限付きセクションを読み込みます。通常のユーザー、アシスタント、
推論、ツール呼び出し、ツール結果の内容は保持されます。Node／Gateway の安全上限を
超える個別項目は、切り詰められたことが明確に示されます。

Gateway ローカルの `claude-cli` 行では、通常のコンポーザーに入力すると
`sessions.catalog.continue` が呼び出されます。OpenClaw はローカルカタログレコードを再解決し、
モデルが固定されたネイティブセッションを作成または再利用し、表示可能な項目を最大 200 件
または 512 KiB までインポートして、Claude CLI バインディングをシードします。最初のターンは
`--fork-session` で再開されます。Claude はフォークに新しいセッション ID を割り当てるため、
以降のターンではフォークが使用され、元のセッションは変更されません。

ヘッドレス Node ホストでも、以下の Node ローカル設定を有効にして Node ホストを再起動することで、
Claude CLI の行を継続可能にできます。

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node は、設定が有効であり、ローカルの `claude` 実行可能ファイルを解決できる場合にのみ
`agent.cli.claude.run.v1` を通知します。OpenClaw はその Node 上でカタログレコードを再解決し、
同じ制限付き履歴をインポートして、引き継いだセッションを Node およびカタログから報告された
作業ディレクトリにバインドします。各ターンでは、その Node の Claude ファイルとログインを使用して、
Node の実際の `claude -p` プロセスを実行します。Node の exec 承認ポリシーは引き続き適用され、
Gateway がこのオプトインを強制することはできません。

Node 継続 v1 は 1 回限りです。Gateway の local loopback MCP 設定と
Gateway Skills Plugin の引数を省略し、Gateway のトランスクリプトから再シードせず、
添付ファイルと画像を拒否します。Claude Desktop の行は引き続き閲覧専用です。ネイティブ
macOS アプリの Node も、アプリが実行コマンドを通知するまでは閲覧専用のままです。

<Note>
ペアリングされた Node の Claude セッションは、ヘッドレス Node が明示的に
`agent.cli.claude.run.v1` を通知しない限り、読み取り専用のままです。OpenClaw は Claude Desktop の
メタデータを変更したり、Claude セッションをアーカイブしたりしません。このページでは、認証済みの
`node.invoke` を使用するため、書き込みスコープを持つオペレーター接続が必要です。継続が有効な
Node 上でも、一覧表示と読み取りは引き続き読み取り専用です。
</Note>

Node コマンドとセキュリティ境界については、[Node：Claude セッションとトランスクリプト](/ja-JP/nodes#claude-sessions-and-transcripts)
を参照してください。

## 思考のデフォルト（Claude Sonnet 5、Mythos 5、Fable 5、4.8、4.6）

`anthropic/claude-sonnet-5` はデフォルトで `high` エフォートの適応的思考を使用します。
思考を無効にするには `/think off` を、モデル固有の
より高いエフォートレベルを使用するには `/think xhigh|max` を使用します。Anthropic はこのモデルでこれらのリクエスト機能をサポートしていないため、
OpenClaw は Sonnet 5 に対して、手動の思考バジェット、カスタム
サンプリングパラメータ、アシスタントのプリフィル、および Priority Tier を省略します。
カタログでは、2026 年 8 月 31 日まで Anthropic の導入時の `$2/$10` 入出力料金を使用し、
2026 年 9 月 1 日から標準の `$3/$15` 料金が適用されます。

`anthropic/claude-fable-5` は常に適応的思考を使用し、デフォルトのエフォートは `high`
です。Anthropic はこのモデルの思考を無効にできないため、
`/think off` と `/think minimal` は代わりに `low` エフォートへマッピングされます。また、Anthropic は
思考が有効なリクエストでの temperature の上書きを拒否するため、OpenClaw は Fable 5 のリクエストに対する
カスタム temperature 値も省略します。

`anthropic/claude-mythos-5` は、常時有効な同じ
適応的思考契約を持つ限定アクセスモデルです。OpenClaw のデフォルトは `high` で、`/think off` と
`/think minimal` を `low` にマッピングし、呼び出し元が選択したサンプリングパラメータを省略します。
カタログには、1,000,000 トークンのコンテキストウィンドウ、128,000 トークンの出力
上限、画像入力、および `$10/$50` 入出力料金が掲載されています。

Claude Opus 4.8 では、OpenClaw のデフォルトで思考が無効になっています。`/think high|xhigh|max` で適応的思考を明示的に
有効にすると、OpenClaw は
Anthropic の Opus 4.8 エフォート値を送信します。Claude 4.6 モデル（Opus 4.6 と Sonnet 4.6）の
デフォルトは `adaptive` です。

メッセージごとに `/think:<level>` を使用するか、モデルパラメータで上書きします。

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
関連する Anthropic のドキュメント：
- [適応的思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [拡張思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 安全性による拒否時のフォールバック（Claude Fable 5）

<Warning>
Claude Fable 5 を使用すると、Claude Opus 4.8 も使用されます。Fable 5 には
リクエストを拒否する場合がある安全性分類器が搭載されており、Anthropic が認める
復旧方法は、そのターンを `claude-opus-4-8` に処理させることです。OpenClaw は API キーを直接使用するリクエストに対して
これを自動的に有効にするため、一部の Fable ターンは
Claude Opus 4.8 として回答および課金されます。ポリシーまたは予算上、
Opus によって処理されるターンを許容できない場合は、`anthropic/claude-fable-5` を選択しないでください。
</Warning>

### この機能が存在する理由

Fable 5 の分類器は制限対象の
分野のリクエストに対して `stop_reason: "refusal"` を返し、無害な隣接領域の作業（セキュリティ
ツール、ライフサイエンス、さらにはモデルに生の
推論を再現するよう求める場合）でも誤検知することがあります。フォールバックがなければ、
別の Claude モデルなら問題なく処理できる場合でもターンがエラーで終了します。Anthropic 自身の拒否メッセージでも、
API インテグレーターにフォールバックモデルを設定するよう案内しています。

### 仕組み

1. `anthropic/claude-fable-5` に対する API キーを直接使用するすべてのリクエストで、OpenClaw は
   Anthropic のサーバー側フォールバックのオプトイン、すなわち
   `server-side-fallback-2026-06-01` ベータヘッダーと
   `fallbacks: [{"model": "claude-opus-4-8"}]` を送信します。Anthropic が Fable 5 の
   フォールバック先として許可しているのは Claude Opus 4.8 のみです。
2. 安全性分類器による拒否のみがフォールバックをトリガーします。レート制限、
   過負荷、サーバーエラーの動作は従来とまったく同じで、
   OpenClaw の通常の[モデルフェイルオーバー](/ja-JP/concepts/model-failover)を経由します。
3. 救済処理は同じ呼び出し内で行われます。出力前の拒否は
   レイテンシー以外では認識できず、回答全体が Opus 4.8 から生成されます。
   ストリーム途中で拒否された場合、部分テキストはフォールバック
   モデルが続きを生成するためのプレフィックスとして保持されます。一方、拒否されたモデルの推論とツール呼び出しは、
   Anthropic のリプレイルールに従って破棄されます（応答として再送信したり、
   実行したりしてはなりません）。
4. Claude Opus 4.8 も拒否した場合、そのターンでは
   この機能が導入される前とまったく同様に、拒否がエラーとして提示されます。

フォールバックは Anthropic API レベルで行われるため、`claude-opus-4-8` を
設定済みのモデル一覧やフォールバックチェーンに含める必要はありません。Fable 対応の
API キーは常に Opus を処理できます。

### 可観測性と課金

- フォールバックによって処理されたターンでは、アシスタントメッセージに
  `fromModel` と `toModel` を示す `provider_fallback` 診断が記録され、メッセージの
  `responseModel` には `claude-opus-4-8` が報告されます。
- Anthropic は試行ごとに課金します。出力前の拒否は無料で、救済処理は
  Claude Opus 4.8 の料金（現在は Fable 5 の半額）で課金されます。それに合わせて、OpenClaw の
  ターンごとのコスト見積もりでも、フォールバックによって処理されたターンを Opus の料金で計算します。
- ストリーム途中の拒否では、Anthropic 側でストリーミング済みの Fable の部分についても
  追加で課金されます。その部分は API の試行ごとの
  使用量には報告されますが、OpenClaw のターンごとの見積もりには含まれません。

### 適用範囲

`api.anthropic.com` に対する API キー認証を使用する `anthropic/claude-fable-5` に
適用されます。OAuth（Claude CLI サブスクリプションの再利用）、プロキシのベース URL、
Bedrock、Vertex、Foundry のリクエストには変更がなく、これらでは引き続き
拒否がエラーとして提示されます。

実環境で検証済み：Fable 5 に生の思考過程を再現するよう求める無害なプロンプトは、
フォールバックなしで送信すると `category: "reasoning_extraction"` で拒否されますが、
OpenClaw を通じて同じプロンプトを送信すると、`provider_fallback` 診断が付加された
通常の Opus による回答が返されます。

基盤となる動作については、Anthropic の[拒否とフォールバックの
ガイド](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)を参照してください。

## プロンプトキャッシュ

OpenClaw は API キー認証で Anthropic のプロンプトキャッシュ機能をサポートします。

| 値               | キャッシュ期間 | 説明                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"`（デフォルト） | 5 分      | API キー認証に自動的に適用 |
| `"long"`            | 1 時間         | 拡張キャッシュ                         |
| `"none"`            | キャッシュなし     | プロンプトキャッシュを無効化                 |

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
    モデルレベルのパラメータを基準として使用し、`agents.list[].params` を介して特定のエージェントを上書きします。

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
    2. `agents.list[].params`（一致する `id`、キー単位で上書き）

    これにより、あるエージェントでは長期間のキャッシュを維持しつつ、同じモデルを使用する別のエージェントでは、バースト的で再利用率の低いトラフィックに対してキャッシュを無効にできます。

  </Accordion>

  <Accordion title="Bedrock Claude に関する注意事項">
    - Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）は、設定されている場合に `cacheRetention` のパススルーを受け入れます。
    - Anthropic 以外の Bedrock モデルは、実行時に強制的に `cacheRetention: "none"` に設定されます。
    - API キーのスマートデフォルトは、明示的な値が設定されていない場合、Bedrock 上の Claude の参照にも `cacheRetention: "short"` を設定します。

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="高速モード">
    OpenClaw の共通 `/fast` トグルは、`api.anthropic.com` への API キーを直接使用するトラフィックに対して、Anthropic の `service_tier` フィールドを設定します。

    | コマンド | マッピング先 |
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
    - API キーを使用して直接行われる `api.anthropic.com` リクエストにのみ適用されます。OAuth／サブスクリプショントークンのリクエストとプロキシルートに `service_tier` フィールドが付与されることはありません。
    - `serviceTier` または `service_tier` パラメータが明示的に指定されている場合、両方が設定されていると `/fast` より優先されます。
    - Priority Tier のキャパシティがないアカウントでは、`service_tier: "auto"` が `standard` に解決される場合があります。

    </Note>

  </Accordion>

  <Accordion title="メディア理解（画像と PDF）">
    バンドルされた Anthropic Plugin は、画像と PDF の理解機能を登録します。OpenClaw は
    設定された Anthropic 認証からメディア機能を自動的に解決するため、
    追加の設定は不要です。

    | プロパティ        | 値                 |
    | --------------- | --------------------- |
    | デフォルトモデル   | `claude-opus-4-8`     |
    | 対応入力 | 画像、PDF ドキュメント |

    会話に画像または PDF が添付されると、OpenClaw は自動的に
    Anthropic メディア理解プロバイダーを経由して処理します。

  </Accordion>

  <Accordion title="1M コンテキストウィンドウ">
    Claude Sonnet 5、Mythos 5、Fable 5 は、正確に 1,000,000 トークンの入力
    ウィンドウを持ち、最大 128,000 出力トークンをサポートします。Anthropic の 1M コンテキスト
    ウィンドウは、適応的思考を使用する Claude 4.x モデルでも一般提供されています：Opus 4.8、
    Opus 4.7、Opus 4.6、Sonnet 4.6。OpenClaw はこれらのモデルのサイズを
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

    古い設定では `params.context1m: true` を残してもかまいません。これらのモデルでは無害な no-op となり、
    OpenClaw は廃止された
    `context-1m-2025-08-07` ベータヘッダーを設定にかかわらず送信しなくなりました。その値を持つ古い `anthropicBeta` 設定
    エントリは、リクエストヘッダーの解決時に削除され、サポートされていない古い Claude モデルは
    通常のコンテキストウィンドウのままです。

    `params.context1m: true` は Claude CLI バックエンド
    （`claude-cli/*`）でも同様に動作します。一般提供されている対象の Opus および Sonnet モデルにはすでに
    1M ウィンドウが自動的に適用されるため、このパラメータはそちらでも省略可能です。

    <Warning>
    Anthropic の認証情報でロングコンテキストへのアクセス権が必要です。OAuth／サブスクリプショントークン認証では必要な Anthropic ベータヘッダーが維持されますが、古い設定に廃止済みの 1M ベータヘッダーが残っている場合、OpenClaw はそれを削除します。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 の 1M コンテキスト">
    `anthropic/claude-opus-4-8` とその `claude-cli` バリアントは、デフォルトで 1M コンテキスト
    ウィンドウを備えているため、`params.context1m: true` は不要です。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="401 エラー／トークンが突然無効になる">
    Anthropic のトークン認証には有効期限があり、取り消される場合もあります。新規セットアップでは、代わりに Anthropic API キーを使用してください。
  </Accordion>

  <Accordion title='プロバイダー "anthropic" の API キーが見つからない'>
    Anthropic 認証は**エージェントごと**です。新しいエージェントはメインエージェントのキーを継承しません。そのエージェントでオンボーディングを再実行する（または Gateway ホストで API キーを設定する）とともに、`openclaw models status` で確認してください。
  </Accordion>

  <Accordion title='プロファイル "anthropic:default" の認証情報が見つからない'>
    `openclaw models status` を実行して、アクティブな認証プロファイルを確認してください。オンボーディングを再実行するか、そのプロファイルパスに API キーを設定してください。
  </Accordion>

  <Accordion title="利用可能な認証プロファイルがありません（すべてクールダウン中）">
    `auth.unusableProfiles`については、`openclaw models status --json`を確認してください。Anthropic のレート制限によるクールダウンはモデル単位で適用される場合があるため、別の Anthropic モデルは引き続き使用できる可能性があります。別の Anthropic プロファイルを追加するか、クールダウンが終了するまで待ってください。
  </Accordion>
</AccordionGroup>

<Note>
詳しくは、[トラブルシューティング](/ja-JP/help/troubleshooting)と[よくある質問](/ja-JP/help/faq)を参照してください。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
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
