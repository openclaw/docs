---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルのフェイルオーバー / 「All models failed」のデバッグ
    - 認証プロファイルとその管理方法を理解する
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、および認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-04-25T18:18:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  モデルおよび認証プロファイルに関する Q&A です。セットアップ、セッション、Gateway、チャネル、および
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次の設定に指定したものです:

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `openai-codex/gpt-5.5`）。provider を省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の configured-provider を試し、それでも見つからない場合にのみ、非推奨の互換パスとして設定済みのデフォルト provider にフォールバックします。その provider が設定済みのデフォルトモデルをもう公開していない場合、OpenClaw は古くなって削除済みの provider デフォルトをそのまま出すのではなく、最初に設定された provider/model にフォールバックします。それでも、`provider/model` を**明示的に**設定するべきです。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨デフォルト:** 利用中の provider スタックで利用可能な、最新世代の最も強力なモデルを使ってください。
    **ツール対応または信頼できない入力を扱うエージェント向け:** コストよりモデル性能を優先してください。
    **日常的/低リスクなチャット向け:** より安価なフォールバックモデルを使い、エージェントの役割ごとにルーティングしてください。

    MiniMax には専用ドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) および
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安として、高リスクな作業には**無理なく使える範囲で最良のモデル**を使い、日常的な
    チャットや要約には安価なモデルを使ってください。エージェントごとにモデルをルーティングでき、サブエージェントを使って
    長いタスクを並列化することもできます（各サブエージェントはトークンを消費します）。[Models](/ja-JP/concepts/models) および
    [Sub-agents](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや量子化しすぎたモデルは、プロンプト
    インジェクションや危険な挙動に対してより脆弱です。[Security](/ja-JP/gateway/security) を参照してください。

    詳細: [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか？">
    **モデル用コマンド**を使うか、**model** フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な方法:

    - チャット内の `/model`（手早く、セッション単位）
    - `openclaw models set ...`（モデル設定のみを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup ペイロードには、正規化されたパス、浅いスキーマのドキュメント/制約、および直下の子要素の要約が含まれます。
    部分更新向けです。
    もし設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [Models](/ja-JP/concepts/models), [Configure](/ja-JP/cli/configure), [Config](/ja-JP/cli/config), [Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホスト型モデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルでは Ollama が最も簡単な方法です。

    最短のセットアップ:

    1. `https://ollama.com/download` から Ollama をインストール
    2. `ollama pull gemma4` のようにローカルモデルを pull
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行
    4. `openclaw onboard` を実行して `Ollama` を選択
    5. `Local` または `Cloud + Local` を選択

    メモ:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルも利用できます
    - `kimi-k2.5:cloud` のようなクラウドモデルはローカル pull を必要としません
    - 手動で切り替える場合は、`openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ注意: 小規模モデルや強く量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使えるボットには、**大規模モデル**を強く推奨します。
    それでも小規模モデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama), [ローカルモデル](/ja-JP/gateway/local-models),
    [モデル provider](/ja-JP/concepts/model-providers), [Security](/ja-JP/gateway/security),
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill ではどのモデルを使っていますか？">
    - これらのデプロイはそれぞれ異なる場合があり、時間とともに変わる可能性があります。固定の provider 推奨はありません。
    - 各 Gateway の現在の実行時設定は `openclaw models status` で確認してください。
    - セキュリティに敏感でツール対応のエージェントには、利用可能な最新世代の最も強力なモデルを使用してください。
  </Accordion>

  <Accordion title="再起動せずに、その場でモデルを切り替えるにはどうすればよいですか？">
    `/model` コマンドを単独メッセージとして使ってください:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    これらは組み込みエイリアスです。カスタムエイリアスは `agents.defaults.models` で追加できます。

    利用可能なモデルは `/model`、`/model list`、または `/model status` で一覧表示できます。

    `/model`（および `/model list`）は、コンパクトな番号付きピッカーを表示します。番号で選択します:

    ```
    /model 3
    ```

    また、provider 用に特定の認証プロファイルを強制することもできます（セッション単位）:

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` では、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの認証プロファイルが試されるかが表示されます。
    利用可能な場合は、設定された provider エンドポイント（`baseUrl`）と API モード（`api`）も表示されます。

    **`@profile` で設定したプロファイルの固定を解除するには？**

    `@profile` サフィックスを付けずに `/model` を再実行してください:

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選択するか（または `/model <default provider/model>` を送信してください）。
    どの認証プロファイルが有効かは `/model status` で確認できます。

  </Accordion>

  <Accordion title="日常業務に GPT 5.5 を使い、コーディングに Codex 5.5 を使えますか？">
    はい。片方をデフォルトに設定し、必要に応じて切り替えてください:

    - **クイック切り替え（セッション単位）:** 現在の直接 OpenAI API キー作業には `/model openai/gpt-5.5`、GPT-5.5 Codex OAuth 作業には `/model openai-codex/gpt-5.5` を使います。
    - **デフォルト:** API キー利用には `agents.defaults.model.primary` を `openai/gpt-5.5` に、GPT-5.5 Codex OAuth 利用には `openai-codex/gpt-5.5` に設定します。
    - **サブエージェント:** 別のデフォルトモデルを持つサブエージェントにコーディングタスクをルーティングします。

    [Models](/ja-JP/concepts/models) および [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の fast mode はどう設定しますか？">
    セッショントグルまたは設定デフォルトのどちらかを使います:

    - **セッション単位:** セッションが `openai/gpt-5.5` または `openai-codex/gpt-5.5` を使っている間に `/fast on` を送信します。
    - **モデル単位のデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` または `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` を `true` に設定します。

    例:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI では、fast mode はサポートされているネイティブ Responses リクエスト上で `service_tier = "priority"` にマッピングされます。セッションの `/fast` 上書きは設定デフォルトより優先されます。

    [Thinking and fast mode](/ja-JP/tools/thinking) および [OpenAI fast mode](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信が来ないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とすべての
    セッション上書きに対する**許可リスト**になります。そのリストにないモデルを選ぶと、次が返されます:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    このエラーは通常の返信の**代わりに**返されます。対処法: そのモデルを
    `agents.defaults.models` に追加する、許可リストを削除する、または `/model list` からモデルを選んでください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは **provider が設定されていない** ことを意味します（MiniMax の provider 設定または認証
    プロファイルが見つからなかったため）、そのモデルを解決できません。

    確認チェックリスト:

    1. 現在の OpenClaw リリースにアップグレードする（またはソースの `main` から実行する）し、その後 Gateway を再起動します。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または一致する provider が注入できるよう
       env/auth profiles に MiniMax 認証が存在することを確認します
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証経路に対して大文字小文字を区別する正確なモデル ID を使います:
       API キー構成では `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、
       OAuth 構成では `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します:

       ```bash
       openclaw models list
       ```

       そしてリストから選んでください（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) および [Models](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**にし、必要なときだけ**セッション単位**でモデルを切り替えてください。
    フォールバックは**エラー時**のためのものであり、「難しいタスク」のためではないので、`/model` または別エージェントを使ってください。

    **オプション A: セッション単位で切り替える**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    その後:

    ```
    /model gpt
    ```

    **オプション B: 別々のエージェント**

    - エージェント A のデフォルト: MiniMax
    - エージェント B のデフォルト: OpenAI
    - エージェントごとにルーティングするか、`/agent` で切り替える

    ドキュメント: [Models](/ja-JP/concepts/models), [複数エージェントルーティング](/ja-JP/concepts/multi-agent), [MiniMax](/ja-JP/providers/minimax), [OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮名が用意されています（`agents.defaults.models` にそのモデルが存在する場合にのみ適用されます）:

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API キー構成では `openai/gpt-5.5`、Codex OAuth 用に構成されている場合は `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、あなたの設定が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）はどう定義/上書きしますか？">
    エイリアスは `agents.defaults.models.<modelId>.alias` から取得されます。例:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    その後、`/model sonnet`（またはサポートされている場合は `/<alias>`）はそのモデル ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など他の provider のモデルを追加するにはどうすればよいですか？">
    OpenRouter（従量課金、多数のモデル）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI（GLM モデル）:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    provider/model を参照していて、必要な provider キーが欠けている場合は、実行時の認証エラーになります（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後に「No API key found for provider」と表示される**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとで、
    次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    対処方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定する。
    - または、メインエージェントの `agentDir` から `auth-profiles.json` を新しいエージェントの `agentDir` にコピーする。

    エージェント間で `agentDir` を使い回してはいけません。認証/セッションの衝突を引き起こします。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で行われます:

    1. 同じ provider 内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、provider がレート制限中だったり一時的に失敗していたりしても、OpenClaw は応答を続けられます。

    レート制限バケットには単純な `429` レスポンス以上のものが含まれます。OpenClaw は
    `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用量ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも、
    フェイルオーバーに値するレート制限として扱います。

    一見課金系に見えるレスポンスの中には `402` ではないものもあり、HTTP `402`
    レスポンスの一部もこの一時的バケットに残ります。provider が
    `401` または `403` で明示的な課金テキストを返す場合、OpenClaw はそれを引き続き
    billing レーンに置けますが、provider 固有のテキストマッチャーはそれを所有する
    provider に限定されます（たとえば OpenRouter の `Key limit exceeded`）。もし `402`
    メッセージが代わりに再試行可能な使用量ウィンドウや
    organization/workspace の支出上限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）のように見える場合、OpenClaw はそれを
    長期の billing 無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは別です。たとえば
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` のようなシグネチャは、モデルフォールバックを進めるのではなく、
    compaction/再試行パスに留まります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むものすべて」より意図的に
    狭くしています。OpenClaw は、provider コンテキストが一致する場合、
    Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような stop-reason エラー、一時的なサーバーテキストを含む JSON `api_error`
    ペイロード（`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）、および `ModelNotReadyException` のような provider-busy エラーを、
    フェイルオーバーに値する timeout/過負荷シグナルとして扱います。
    `LLM request failed with an unknown
    error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それ単体ではモデルフォールバックを引き起こしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とはどういう意味ですか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使おうとしたが、期待される認証ストア内にその認証情報が見つからなかったことを意味します。

    **確認チェックリスト:**

    - **認証プロファイルの保存場所を確認する**（新しいパス vs レガシーパス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` によって移行されます）
    - **env var が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、Gateway を systemd/launchd 経由で実行している場合は継承されないことがあります。`~/.openclaw/.env` に置くか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - 複数エージェント構成では、複数の `auth-profiles.json` ファイルが存在し得ます。
    - **モデル/認証ステータスをざっと確認する**
      - `openclaw models status` を使って、設定済みモデルと provider が認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」への確認チェックリスト**

    これは、その実行が Anthropic の認証プロファイルに固定されているが、Gateway
    が認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使う**
      - Gateway ホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使いたい場合**
      - **Gateway ホスト**の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を置きます。
      - 欠けているプロファイルを強制する固定順序を解除します:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway ホスト上でコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはあなたのノート PC ではなく Gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試されて失敗したのですか？">
    モデル設定に Google Gemini がフォールバックとして含まれている場合（または Gemini の短縮名に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試します。Google の認証情報を設定していなければ、`No API key found for provider "google"` が表示されます。

    対処法: Google 認証を用意するか、`agents.defaults.model.fallbacks` / エイリアスから Google モデルを削除または回避して、フォールバック先にルーティングされないようにしてください。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因: セッション履歴に**署名のない thinking ブロック**が含まれています（多くは
    中断/部分ストリーム由来です）。Google Antigravity では thinking ブロックに署名が必要です。

    対処法: OpenClaw は現在、Google Antigravity Claude 向けに署名なし thinking ブロックを除去します。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: それが何か、そして管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、複数アカウントのパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルは、provider に紐づいた名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的なプロファイル ID には何がありますか？">
    OpenClaw は次のような provider 接頭辞付き ID を使います:

    - `anthropic:default`（メール ID が存在しない場合によくある）
    - OAuth ID 用の `anthropic:<email>`
    - 自分で選んだカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試す認証プロファイルを制御できますか？">
    はい。設定では、プロファイルの任意メタデータと provider ごとの順序（`auth.order.<provider>`）をサポートしています。これは**シークレットを保存するものではなく**、ID を provider/mode に対応付けてローテーション順を設定します。

    OpenClaw は、そのプロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）中、または長めの**無効化**状態（課金/クレジット不足）にある場合、一時的にスキップすることがあります。これを確認するには、`openclaw models status --json` を実行して `auth.unusableProfiles` を確認してください。調整項目: `auth.cooldowns.billingBackoffHours*`。

    レート制限のクールダウンはモデル単位になることがあります。あるモデルで
    クールダウン中のプロファイルでも、同じ provider 上の別の兄弟モデルではまだ利用可能なことがあり、
    一方で billing/無効化ウィンドウは引き続きプロファイル全体をブロックします。

    CLI から**エージェント単位**の順序上書き（そのエージェントの `auth-state.json` に保存されます）も設定できます:

    ```bash
    # 設定済みのデフォルトエージェントが対象（--agent を省略）
    openclaw models auth order get --provider anthropic

    # ローテーションを単一プロファイルに固定する（これだけを試す）
    openclaw models auth order set --provider anthropic anthropic:default

    # または明示的な順序を設定する（provider 内フォールバック）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 上書きをクリアする（config auth.order / round-robin に戻る）
    openclaw models auth order clear --provider anthropic
    ```

    特定のエージェントを対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるか確認するには、次を使ってください:

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省かれている場合、probe はそのプロファイルを黙って試す代わりに
    `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートします:

    - **OAuth** は多くの場合、サブスクリプションアクセスを活用します（該当する場合）。
    - **API キー** は従量課金を使用します。

    ウィザードは、Anthropic Claude CLI、OpenAI Codex OAuth、および API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回実行セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
