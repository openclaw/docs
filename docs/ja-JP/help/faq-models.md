---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルとその管理方法を理解する
sidebarTitle: Models FAQ
summary: 'よくある質問: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: よくある質問：モデルと認証
x-i18n:
    generated_at: "2026-05-11T20:32:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1bd3bcfdca583472d42782448271879a2bcaaa21858ab3304da48556ae922c
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルに関するQ&A。セットアップ、セッション、Gateway、チャンネル、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次に設定したものです:

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `anthropic/claude-sonnet-4-6`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル id に一致する一意の設定済みプロバイダーを試し、その後で非推奨の互換パスとして設定済みのデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みのデフォルトモデルをすでに公開していない場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示するのではなく、最初に設定されたプロバイダー/モデルにフォールバックします。それでも `provider/model` を**明示的に**設定する必要があります。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨デフォルト:** プロバイダースタックで利用可能な最も強力な最新世代モデルを使用します。
    **ツール有効エージェントまたは信頼できない入力を扱うエージェント:** コストよりモデルの強さを優先します。
    **日常的/低リスクのチャット:** 安価なフォールバックモデルを使い、エージェントの役割でルーティングします。

    MiniMax には専用ドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) および
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: リスクの高い作業には**予算内で使える最良のモデル**を使い、日常的なチャットや要約には安価な
    モデルを使います。エージェントごとにモデルをルーティングでき、サブエージェントを使って
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプトインジェクションや
    安全でない動作に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    詳細: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるには？">
    **モデルコマンド**を使うか、**model** フィールドだけを編集します。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の `/model`（素早く、セッション単位）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先します。lookup ペイロードには、正規化されたパス、浅いスキーマドキュメント/制約、直下の子要素の要約が含まれます。
    部分更新用です。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復します。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）を使えますか？">
    はい。ローカルモデルには Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールする
    2. `ollama pull gemma4` などのローカルモデルを取得する
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行して `Ollama` を選択する
    5. `Local` または `Cloud + Local` を選ぶ

    注記:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルを使えます
    - `kimi-k2.5:cloud` などのクラウドモデルはローカルへの取得を必要としません
    - 手動で切り替える場合は、`openclaw models list` と `openclaw models set ollama/<model>` を使います

    セキュリティ上の注記: 小さいモデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使用できるボットには、**大規模モデル**を強く推奨します。
    それでも小さいモデルを使う場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はどのモデルを使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変更される可能性があります。固定のプロバイダー推奨はありません。
    - 各 gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティ上重要なエージェントやツール有効エージェントには、利用可能な最も強力な最新世代モデルを使ってください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるには？">
    `/model` コマンドを単独メッセージとして使います:

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

    プロバイダー用の特定の認証プロファイルを強制することもできます（セッション単位）:

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次に試される認証プロファイルがどれかを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も表示します。

    **@profile で設定したプロファイルの固定を解除するには？**

    `@profile` サフィックス**なしで** `/model` を再実行します:

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選択します（または `/model <default provider/model>` を送信します）。
    どの認証プロファイルがアクティブかを確認するには `/model status` を使います。

  </Accordion>

  <Accordion title="2つのプロバイダーが同じモデル id を公開している場合、/model はどちらを使いますか？">
    `/model provider/model` は、そのセッションに対してその正確なプロバイダールートを選択します。

    たとえば、`qianfan/deepseek-v4-flash` と `deepseek/deepseek-v4-flash` は、どちらも `deepseek-v4-flash` を含んでいても異なるモデル参照です。OpenClaw は、ベアモデル id が一致するという理由だけで、片方のプロバイダーからもう片方へ暗黙に切り替えるべきではありません。

    ユーザーが選択した `/model` 参照は、フォールバックポリシーでも厳密です。その選択済みプロバイダー/モデルが利用できない場合、`agents.defaults.model.fallbacks` から応答するのではなく、返信は明示的に失敗します。設定済みフォールバックチェーンは、設定済みデフォルト、cron ジョブのプライマリ、自動選択されたフォールバック状態には引き続き適用されます。

    非セッションオーバーライドから開始された実行がフォールバックの使用を許可されている場合、OpenClaw はまず要求されたプロバイダー/モデルを試し、次に設定済みフォールバックを試し、その後で設定済みプライマリを試します。これにより、重複するベアモデル id がデフォルトプロバイダーへ直接戻ることを防ぎます。

    [モデル](/ja-JP/concepts/models) と [モデルフェイルオーバー](/ja-JP/concepts/model-failover) を参照してください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.5、コーディングには Codex 5.5 を使えますか？">
    はい。モデル選択とランタイム選択は別々に扱います:

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインします。
    - **エージェントループ外の直接 OpenAI API タスク:** 画像、埋め込み、音声、リアルタイム、その他の非エージェント OpenAI API サーフェスには `OPENAI_API_KEY` を設定します。
    - **OpenAI エージェント API キー認証:** 順序付きの `openai-codex` API キープロファイルで `/model openai/gpt-5.5` を使います。
    - **サブエージェント:** コーディングタスクを、独自の `openai/gpt-5.5` モデルを持つ Codex 重視のエージェントへルーティングします。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の fast mode を設定するには？">
    セッショントグルまたは設定デフォルトのいずれかを使います:

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

    OpenAI では、fast mode は対応するネイティブ Responses リクエスト上の `service_tier = "priority"` に対応します。セッションの `/fast` オーバーライドは設定デフォルトより優先されます。

    [思考と fast mode](/ja-JP/tools/thinking) および [OpenAI fast mode](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示された後、返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とあらゆる
    セッションオーバーライドの**許可リスト**になります。そのリストにないモデルを選ぶと、次が返されます:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    このエラーは通常の返信の**代わりに**返されます。修正方法: 正確なモデルを
    `agents.defaults.models` に追加する、動的なプロバイダーカタログ用に `"provider/*": {}` のようなプロバイダーワイルドカードを追加する、許可リストを削除する、または `/model list` からモデルを選びます。
    コマンドに `--runtime codex` も含まれていた場合は、先に許可リストを更新してから、同じ
    `/model provider/model --runtime codex` コマンドを再試行します。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは**プロバイダーが設定されていない**ことを意味します（MiniMax プロバイダー設定または認証
    プロファイルが見つからなかったため、モデルを解決できません）。

    修正チェックリスト:

    1. 現在の OpenClaw リリースへアップグレードする（またはソースの `main` から実行する）し、gateway を再起動する。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax 認証が
       env/認証プロファイルに存在し、一致するプロバイダーを注入できることを確認する
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証パスに応じて正確なモデル id（大文字小文字を区別）を使う:
       API キー
       セットアップでは `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、
       OAuth セットアップでは `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行する:

       ```bash
       openclaw models list
       ```

       そしてリストから選択します（またはチャット内の `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクに OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**として使い、必要に応じて**セッションごと**にモデルを切り替えます。
    フォールバックは**エラー**のためのものであり、「難しいタスク」のためではないため、`/model` または別のエージェントを使ってください。

    **オプション A: セッションごとに切り替える**

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

    **オプション B: エージェントを分ける**

    - エージェント A のデフォルト: MiniMax
    - エージェント B のデフォルト: OpenAI
    - エージェントでルーティングするか、`/agent` で切り替える

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮名が同梱されています（モデルが `agents.defaults.models` に存在する場合にのみ適用されます）:

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
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

  <Accordion title="OpenRouter や Z.AI など、ほかのプロバイダーのモデルを追加するにはどうすればよいですか？">
    OpenRouter（トークン従量課金、多数のモデル）:

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

    プロバイダー/モデルを参照しているが、必要なプロバイダーキーがない場合は、実行時の認証エラー（例: `No API key found for provider "zai"`）が発生します。

    **新しいエージェントを追加した後にプロバイダーの API キーが見つからない**

    通常、これは**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとに管理され、次に保存されます:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから、新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuth プロファイルの場合、そのプロファイルが独自のアカウントを必要とするときは新しいエージェントからサインインします。それ以外の場合、OpenClaw は更新トークンを複製せずに、デフォルト/メインエージェントを読み取り先として利用できます。

    エージェント間で `agentDir` を再利用**しないでください**。認証/セッションの衝突が発生します。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で発生します:

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を継続できます。

    レート制限バケットには、単純な `429` レスポンス以外も含まれます。OpenClaw は
    `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用期間制限（`weekly/monthly limit reached`）のようなメッセージも、
    フェイルオーバー対象のレート制限として扱います。

    請求関連に見えるレスポンスの一部は `402` ではなく、HTTP `402`
    レスポンスの一部もその一時的なバケットに残ります。プロバイダーが
    `401` または `403` で明示的な請求テキストを返す場合、OpenClaw はそれを
    請求レーンに保持できますが、プロバイダー固有のテキストマッチャーは、
    それを所有するプロバイダーの範囲に留まります（たとえば OpenRouter の `Key limit exceeded`）。`402`
    メッセージが代わりに再試行可能な使用期間制限、または
    組織/ワークスペースの支出制限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）のように見える場合、OpenClaw はそれを
    長期の請求無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは異なります:
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` のようなシグネチャは、モデルフォールバックを進めるのではなく、
    Compaction/再試行パスに残ります。

    汎用的なサーバーエラーのテキストは、「unknown/error を含むものは何でも」より意図的に狭くなっています。OpenClaw は、Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような停止理由エラー、一時的なサーバーテキスト
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）を含む JSON の `api_error` ペイロード、そして `ModelNotReadyException` のようなプロバイダー混雑エラーなど、
    プロバイダー範囲の一時的な形状を、
    プロバイダーコンテキストが一致する場合にフェイルオーバー対象のタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown
    error.` のような汎用の内部フォールバックテキストは保守的に扱われ、それだけではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とはどういう意味ですか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使用しようとしたものの、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの保存場所を確認する**（新しいパスとレガシーパス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、Gateway を systemd/launchd 経由で実行している場合は継承されないことがあります。`~/.openclaw/.env` に配置するか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在する場合があります。
    - **モデル/認証の状態を簡易確認する**
      - 設定済みモデルとプロバイダーの認証状態を確認するには、`openclaw models status` を使用します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているが、Gateway が
    認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使用する**
      - Gateway ホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使用したい場合**
      - **Gateway ホスト**の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を配置します。
      - 見つからないプロファイルを強制する固定順序をすべてクリアします:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway ホスト上でコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはあなたのノート PC ではなく Gateway マシンに存在します。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試行して失敗したのですか？">
    モデル設定にフォールバックとして Google Gemini が含まれている場合（または Gemini の短縮名へ切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試行します。Google 認証情報を設定していない場合は、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、`agents.defaults.model.fallbacks` / エイリアス内の Google モデルを削除または回避して、フォールバックがそこへルーティングされないようにします。

    **LLM リクエストが拒否されました: 思考シグネチャが必要です（Google Antigravity）**

    原因: セッション履歴に**シグネチャのない思考ブロック**が含まれています（多くの場合、
    中断または部分的なストリームが原因です）。Google Antigravity は思考ブロックにシグネチャを要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに署名されていない思考ブロックを除去します。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルは、プロバイダーに紐づいた名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次に存在します:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを調べるには、`openclaw models auth list`（必要に応じて `--provider <id>` または `--json`）を実行します。詳細は [Models CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="一般的なプロファイル ID は何ですか？">
    OpenClaw は次のようなプロバイダー接頭辞付き ID を使用します:

    - `anthropic:default`（メール ID が存在しない場合によく使われます）
    - OAuth ID 用の `anthropic:<email>`
    - 自分で選ぶカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="どの認証プロファイルを最初に試すか制御できますか？">
    はい。設定では、プロファイルの任意メタデータと、プロバイダーごとの順序（`auth.order.<provider>`）をサポートします。これはシークレットを保存**しません**。ID をプロバイダー/モードへマッピングし、ローテーション順序を設定します。

    OpenClaw は、短い**クールダウン**（レート制限/タイムアウト/認証失敗）または長い**無効化**状態（請求/クレジット不足）にある場合、プロファイルを一時的にスキップすることがあります。これを調べるには、`openclaw models status --json` を実行して `auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限のクールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、
    同じプロバイダー上の兄弟モデルでは引き続き使用できる場合がありますが、
    請求/無効化ウィンドウはプロファイル全体をブロックします。

    CLI を通じて、**エージェントごと**の順序上書き（そのエージェントの `auth-state.json` に保存）も設定できます:

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

    実際に何が試行されるかを確認するには、次を使用します:

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、probe は
    そのプロファイルを黙って試す代わりに `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートします:

    - **OAuth** は多くの場合、サブスクリプションアクセスを活用します（該当する場合）。
    - **API キー** はトークン従量課金を使用します。

    ウィザードは、Anthropic Claude CLI、OpenAI Codex OAuth、API キーを明示的にサポートします。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
