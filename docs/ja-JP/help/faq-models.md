---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルのフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルとその管理方法を理解する
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-05-12T04:10:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルに関する Q&A。セットアップ、セッション、gateway、チャンネル、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか?'>
    OpenClaw のデフォルトモデルは、次として設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `anthropic/claude-sonnet-4-6`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後でのみ、非推奨の互換パスとして設定済みデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みデフォルトモデルをもう公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初に設定されているプロバイダー/モデルへフォールバックします。それでも `provider/model` を**明示的に**設定するべきです。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか?">
    **推奨デフォルト:** プロバイダースタックで利用できる最も強力な最新世代モデルを使用してください。
    **ツール有効または信頼できない入力を扱うエージェント:** コストよりもモデルの強さを優先してください。
    **日常的/低リスクのチャット:** より安価なフォールバックモデルを使用し、エージェントロールでルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクの作業には**予算内で利用できる最良のモデル**を使用し、日常的なチャットや要約にはより安価な
    モデルを使用してください。エージェントごとにモデルをルーティングし、サブエージェントを使って
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: より弱いモデルや過度に量子化されたモデルは、プロンプト
    インジェクションや安全でない挙動に対して脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    詳細な背景: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか?">
    **モデルコマンド**を使用するか、**model** フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の `/model`（素早く、セッション単位）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup ペイロードには、正規化されたパス、浅いスキーマのドキュメント/制約、直下の子要素の概要が含まれます。
    部分更新用です。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストのモデル（llama.cpp、vLLM、Ollama）を使えますか?">
    はい。ローカルモデルには Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールする
    2. `ollama pull gemma4` などのローカルモデルを取得する
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行し、`Ollama` を選択する
    5. `Local` または `Cloud + Local` を選ぶ

    注記:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルも使えます
    - `kimi-k2.5:cloud` などのクラウドモデルにはローカル取得は不要です
    - 手動で切り替えるには、`openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ上の注意: 小さいモデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使用できるボットには、**大規模モデル**を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はどのモデルを使っていますか?">
    - これらのデプロイは異なる場合があり、時間とともに変わることがあります。固定のプロバイダー推奨はありません。
    - 各 gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティが重要なエージェントやツール有効エージェントには、利用可能な最も強力な最新世代モデルを使ってください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるにはどうすればよいですか?">
    `/model` コマンドを単独のメッセージとして使用してください。

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

    `/model`（および `/model list`）は、コンパクトな番号付きピッカーを表示します。番号で選択します。

    ```
    /model 3
    ```

    プロバイダーに対して特定の認証プロファイルを強制することもできます（セッション単位）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの認証プロファイルが試されるかを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も表示します。

    **@profile で設定したプロファイルの固定を解除するにはどうすればよいですか?**

    `@profile` サフィックス**なし**で `/model` を再実行してください。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選ぶか（または `/model <default provider/model>` を送信してください）。
    どの認証プロファイルがアクティブか確認するには `/model status` を使ってください。

  </Accordion>

  <Accordion title="2 つのプロバイダーが同じモデル ID を公開している場合、/model はどちらを使いますか?">
    `/model provider/model` は、そのセッションに対して正確なプロバイダールートを選択します。

    たとえば、`qianfan/deepseek-v4-flash` と `deepseek/deepseek-v4-flash` は、どちらも `deepseek-v4-flash` を含んでいても異なるモデル参照です。OpenClaw は、素のモデル ID が一致するという理由だけで、片方のプロバイダーからもう片方へ暗黙に切り替えるべきではありません。

    ユーザーが選択した `/model` 参照は、フォールバックポリシーでも厳密です。その選択されたプロバイダー/モデルが利用できない場合、`agents.defaults.model.fallbacks` から回答する代わりに、返信は見える形で失敗します。設定済みのフォールバックチェーンは、設定済みデフォルト、cron ジョブのプライマリ、自動選択されたフォールバック状態には引き続き適用されます。

    非セッションの上書きから開始した実行がフォールバックの使用を許可されている場合、OpenClaw は要求されたプロバイダー/モデルを最初に試し、次に設定済みフォールバックを試し、その後でのみ設定済みプライマリを試します。これにより、重複する素のモデル ID がデフォルトプロバイダーへ直接戻るのを防ぎます。

    [モデル](/ja-JP/concepts/models) と [モデルフェイルオーバー](/ja-JP/concepts/model-failover) を参照してください。

  </Accordion>

  <Accordion title="日常タスクに GPT 5.5、コーディングに Codex 5.5 を使えますか?">
    はい。モデル選択とランタイム選択は別々に扱ってください。

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインしてください。
    - **エージェントループ外の直接 OpenAI API タスク:** 画像、埋め込み、音声、リアルタイム、その他の非エージェント OpenAI API サーフェスには `OPENAI_API_KEY` を設定します。
    - **OpenAI エージェント API キー認証:** 順序付きの `openai-codex` API キープロファイルで `/model openai/gpt-5.5` を使います。
    - **サブエージェント:** コーディングタスクを、独自の `openai/gpt-5.5` モデルを持つ Codex 重視のエージェントへルーティングします。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するにはどうすればよいですか?">
    セッション切り替えまたは設定デフォルトのいずれかを使ってください。

    - **セッション単位:** セッションが `openai/gpt-5.5` を使用している間に `/fast on` を送信します。
    - **モデル単位のデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` を `true` に設定します。

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

    OpenAI では、高速モードは対応するネイティブ Responses リクエストで `service_tier = "priority"` に対応します。セッションの `/fast` 上書きは設定デフォルトより優先されます。

    [Thinking と高速モード](/ja-JP/tools/thinking) と [OpenAI 高速モード](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか?'>
    `agents.defaults.models` が設定されている場合、それは `/model` とあらゆる
    セッション上書きの**許可リスト**になります。そのリストにないモデルを選択すると、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    このエラーは通常の返信の**代わりに**返されます。修正方法: 正確なモデルを
    `agents.defaults.models` に追加する、動的なプロバイダーカタログ用に `"provider/*": {}` のようなプロバイダーワイルドカードを追加する、許可リストを削除する、または `/model list` からモデルを選んでください。
    コマンドに `--runtime codex` も含まれていた場合は、まず許可リストを更新してから、同じ
    `/model provider/model --runtime codex` コマンドを再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか?'>
    これは**プロバイダーが設定されていない**（MiniMax プロバイダー設定または認証
    プロファイルが見つからない）ため、モデルを解決できないことを意味します。

    修正チェックリスト:

    1. 現在の OpenClaw リリースにアップグレードする（またはソース `main` から実行する）し、その後 gateway を再起動する。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax 認証が
       env/認証プロファイルに存在し、一致するプロバイダーを注入できることを確認する
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済みの MiniMax
       OAuth）。
    3. 認証パスに対して正確なモデル ID（大文字小文字を区別）を使用する:
       API キー
       セットアップでは `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth セットアップでは `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行する:

       ```bash
       openclaw models list
       ```

       そして一覧から選択する（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクには OpenAI を使えますか?">
    はい。**MiniMax をデフォルト**として使用し、必要に応じて**セッション単位**でモデルを切り替えてください。
    フォールバックは**エラー**のためのものであり、「難しいタスク」のためではないため、`/model` または別のエージェントを使ってください。

    **選択肢 A: セッション単位で切り替える**

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

    次に:

    ```
    /model gpt
    ```

    **選択肢 B: エージェントを分ける**

    - エージェント A のデフォルト: MiniMax
    - エージェント B のデフォルト: OpenAI
    - エージェントでルーティングするか、`/agent` で切り替える

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか?">
    はい。OpenClaw にはいくつかのデフォルト短縮表現が同梱されています（`agents.defaults.models` にモデルが存在する場合にのみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、その値が優先されます。

  </Accordion>

  <Accordion title="モデルのショートカット（エイリアス）を定義または上書きするにはどうすればよいですか？">
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

    その後、`/model sonnet`（または対応している場合は `/<alias>`）はそのモデル ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など、他のプロバイダーのモデルを追加するにはどうすればよいですか？">
    OpenRouter（トークン単位の従量課金、多数のモデル）:

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

    プロバイダーまたはモデルを参照しているのに必要なプロバイダーキーがない場合、ランタイム認証エラー（例: `No API key found for provider "zai"`）が発生します。

    **新しいエージェントを追加した後に、プロバイダーの API キーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとに管理され、次の場所に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから移植可能な静的 `api_key` / `token` プロファイルのみを新しいエージェントの認証ストアへコピーします。
    - OAuth プロファイルの場合、独自のアカウントが必要なときは新しいエージェントからサインインします。それ以外の場合、OpenClaw はリフレッシュトークンを複製しなくてもデフォルト/メインエージェントを通じて読み取れます。

    エージェント間で `agentDir` を再利用しないでください。認証/セッションの衝突が発生します。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「すべてのモデルが失敗しました」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で発生します。

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を継続できます。

    レート制限バケットには、単純な `429` レスポンス以外も含まれます。OpenClaw は、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な使用期間の制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバー対象のレート制限として扱います。

    課金関連に見える一部のレスポンスは `402` ではなく、一部の HTTP `402` レスポンスもこの一時的なバケットに残ります。プロバイダーが `401` または `403` で明示的な課金テキストを返した場合、OpenClaw はそれを課金レーンに保持できますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーのスコープに留まります（たとえば OpenRouter の `Key limit exceeded`）。一方、`402` メッセージが再試行可能な使用期間、または組織/ワークスペースの支出制限（`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）のように見える場合、OpenClaw はそれを長期の課金無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは異なります。`request_too_large`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、または `ollama error: context length exceeded` のようなシグネチャは、モデルフォールバックへ進まず、Compaction/再試行パスに留まります。

    汎用的なサーバーエラーテキストは、「不明」や「エラー」を含むものすべてよりも意図的に狭く扱われます。OpenClaw は、Anthropic の単独の `An unknown error occurred`、OpenRouter の単独の `Provider returned error`、`Unhandled stop reason: error` のような停止理由エラー、一時的なサーバーテキスト（`internal server error`、`unknown error, 520`、`upstream error`、`backend error`）を含む JSON `api_error` ペイロード、`ModelNotReadyException` のようなプロバイダー混雑エラーなど、プロバイダーにスコープされた一時的な形を、プロバイダーのコンテキストが一致するときに、フェイルオーバー対象のタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それだけではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「プロファイル anthropic:default の認証情報が見つかりません」とはどういう意味ですか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使用しようとしたものの、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの保存場所を確認する**（新しいパスと従来のパス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 従来: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、systemd/launchd 経由で Gateway を実行している場合、それを継承しないことがあります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在することがあります。
    - **モデル/認証の状態を簡単に確認する**
      - 設定済みモデルとプロバイダーが認証済みかどうかを確認するには、`openclaw models status` を使用します。

    **「プロファイル anthropic の認証情報が見つかりません」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているものの、Gateway が認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使用する**
      - Gateway ホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使用したい場合**
      - **Gateway ホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 存在しないプロファイルを強制する固定順序をクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway ホストでコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはノートパソコンではなく Gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試行して失敗したのですか？">
    モデル設定にフォールバックとして Google Gemini が含まれている場合（または Gemini の短縮表記に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試行します。Google の認証情報を設定していない場合は、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、`agents.defaults.model.fallbacks` / エイリアスから Google モデルを削除または回避して、フォールバックがそこにルーティングされないようにします。

    **LLM リクエストが拒否されました: thinking シグネチャが必要です（Google Antigravity）**

    原因: セッション履歴に**シグネチャのない thinking ブロック**が含まれています（多くの場合、中止または部分的なストリームが原因です）。Google Antigravity は thinking ブロックにシグネチャを要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに署名なし thinking ブロックを除去します。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: それが何であり、どのように管理するか

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークンストレージ、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルは、プロバイダーに関連付けられた名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次の場所にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを調べるには、`openclaw models auth list`（必要に応じて `--provider <id>` または `--json`）を実行します。詳細は [モデル CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="一般的なプロファイル ID は何ですか？">
    OpenClaw は次のようなプロバイダー接頭辞付き ID を使用します。

    - `anthropic:default`（メール ID が存在しない場合によく使われます）
    - OAuth ID 用の `anthropic:<email>`
    - 選択したカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試行される認証プロファイルを制御できますか？">
    はい。設定では、プロファイルの任意メタデータと、プロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存しません。ID をプロバイダー/モードにマッピングし、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）または長い**無効化**状態（課金/クレジット不足）にある場合、一時的にそのプロファイルをスキップすることがあります。これを調べるには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限のクールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き使用できる場合があります。一方で、課金/無効化の期間は引き続きプロファイル全体をブロックします。

    CLI を使用して、**エージェントごとの**順序上書き（そのエージェントの `auth-state.json` に保存）も設定できます。

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    特定のエージェントを対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試行されるかを検証するには、次を使用します。

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、プローブはそれを黙って試行するのではなく、そのプロファイルについて `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートしています。

    - **OAuth** は、多くの場合サブスクリプションアクセスを活用します（該当する場合）。
    - **API キー** は、トークン単位の従量課金を使用します。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、および API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回実行セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
