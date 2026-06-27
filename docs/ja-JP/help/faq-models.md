---
read_when:
    - モデルの選択や切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルの理解と管理方法
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-06-27T11:41:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルのQ&A。セットアップ、セッション、gateway、チャネル、
  トラブルシューティングについては、メインの[FAQ](/ja-JP/help/faq)を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClawのデフォルトモデルは、次の設定値です。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `anthropic/claude-sonnet-4-6`）。プロバイダーを省略すると、OpenClawはまずエイリアスを試し、次にその正確なモデルIDに一致する一意の設定済みプロバイダーを試し、最後に非推奨の互換パスとして設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合、OpenClawは古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。それでも `provider/model` を**明示的に**設定する必要があります。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨デフォルト:** プロバイダースタックで利用できる最も強力な最新世代モデルを使用してください。
    **ツール有効または信頼できない入力を扱うエージェント:** コストよりモデルの強度を優先してください。
    **日常的/低リスクのチャット:** より安価なフォールバックモデルを使用し、エージェントロールごとにルーティングしてください。

    MiniMaxには独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクの作業には**予算内で使える最良のモデル**を使い、日常的なチャットや要約にはより安価な
    モデルを使ってください。エージェントごとにモデルをルーティングし、サブエージェントを使って
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents)を参照してください。

    強い警告: より弱いモデルや過度に量子化されたモデルは、プロンプト
    インジェクションや安全でない挙動に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security)を参照してください。

    追加の背景情報: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか？">
    **モデルコマンド**を使うか、**model**フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の `/model`（素早い、セッション単位）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うことは避けてください。
    RPC編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookupペイロードには、正規化されたパス、浅いスキーマドキュメント/制約、直下の子要素の要約が含まれます。
    部分更新に使用します。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[Configure](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）を使えますか？">
    はい。ローカルモデルではOllamaが最も簡単なパスです。

    最速のセットアップ:

    1. `https://ollama.com/download` からOllamaをインストールする
    2. `ollama pull gemma4` のようにローカルモデルを取得する
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行し、`Ollama` を選択する
    5. `Local` または `Cloud + Local` を選択する

    注記:

    - `Cloud + Local` では、クラウドモデルに加えてローカルのOllamaモデルを利用できます
    - `kimi-k2.5:cloud` のようなクラウドモデルにはローカルでの取得は不要です
    - 手動で切り替える場合は、`openclaw models list` と `openclaw models set ollama/<model>` を使用してください

    セキュリティ上の注意: 小さいモデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使用できるbotには、**大規模モデル**を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krillはモデルに何を使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わる可能性があります。固定のプロバイダー推奨はありません。
    - 各gatewayの現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティに敏感なエージェントやツール有効のエージェントには、利用できる最も強力な最新世代モデルを使用してください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるにはどうすればよいですか？">
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

    利用可能なモデルは `/model`、`/model list`、または `/model status` で一覧できます。

    `/model`（および `/model list`）は、コンパクトな番号付きピッカーを表示します。番号で選択します。

    ```
    /model 3
    ```

    プロバイダーに対して特定の認証プロファイルを強制することもできます（セッション単位）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使用されているか、次にどの認証プロファイルが試されるかを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）とAPIモード（`api`）も表示します。

    **@profileで設定したプロファイルの固定を解除するにはどうすればよいですか？**

    `@profile` サフィックス**なしで** `/model` を再実行してください。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選択してください（または `/model <default provider/model>` を送信してください）。
    どの認証プロファイルがアクティブか確認するには `/model status` を使用してください。

  </Accordion>

  <Accordion title="2つのプロバイダーが同じモデルIDを公開している場合、/modelはどちらを使いますか？">
    `/model provider/model` は、そのセッションで正確なプロバイダールートを選択します。

    たとえば、`qianfan/deepseek-v4-flash` と `deepseek/deepseek-v4-flash` は、どちらも `deepseek-v4-flash` を含んでいても異なるモデル参照です。OpenClawは、素のモデルIDが一致するという理由だけで、一方のプロバイダーから他方へ暗黙に切り替えるべきではありません。

    ユーザーが選択した `/model` 参照は、フォールバックポリシーでも厳密です。その選択済みプロバイダー/モデルが利用できない場合、`agents.defaults.model.fallbacks` から応答するのではなく、返信は明示的に失敗します。設定済みのフォールバックチェーンは、設定済みデフォルト、Cronジョブのプライマリ、自動選択されたフォールバック状態には引き続き適用されます。

    セッション以外のオーバーライドから開始した実行でフォールバックの使用が許可されている場合、OpenClawはまずリクエストされたプロバイダー/モデルを試し、次に設定済みフォールバックを試し、最後に設定済みプライマリを試します。これにより、重複した素のモデルIDがデフォルトプロバイダーへ直接戻ることを防ぎます。

    [モデル](/ja-JP/concepts/models) と [モデルフェイルオーバー](/ja-JP/concepts/model-failover)を参照してください。

  </Accordion>

  <Accordion title="日常タスクにGPT 5.5、コーディングにCodex 5.5を使えますか？">
    はい。モデルの選択とランタイムの選択は別々に扱ってください。

    - **ネイティブCodexコーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に設定します。ChatGPT/Codexサブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai` でサインインしてください。
    - **エージェントループ外の直接OpenAI APIタスク:** 画像、埋め込み、音声、リアルタイム、その他の非エージェントOpenAI APIサーフェスには `OPENAI_API_KEY` を設定してください。
    - **OpenAIエージェントAPIキー認証:** 順序付きの `openai` APIキープロファイルで `/model openai/gpt-5.5` を使用してください。
    - **サブエージェント:** コーディングタスクを、独自の `openai/gpt-5.5` モデルを持つCodex重視のエージェントへルーティングしてください。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5のfast modeを設定するにはどうすればよいですか？">
    セッショントグルまたは設定デフォルトのどちらかを使用してください。

    - **セッション単位:** セッションが `openai/gpt-5.5` を使用している間に `/fast on` を送信します。
    - **モデル単位のデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` を `true` に設定します。
    - **自動カットオフ:** `/fast auto` または `params.fastMode: "auto"` を使用すると、自動カットオフまでは新しいモデル呼び出しをfastで開始し、その後の再試行、フォールバック、ツール結果、または継続呼び出しはfast modeなしで開始します。カットオフのデフォルトは60秒です。変更するには、アクティブなモデルに `params.fastAutoOnSeconds` を設定してください。

    例:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    OpenAIでは、fast modeはサポートされるネイティブResponsesリクエストで `service_tier = "priority"` に対応します。セッションの `/fast` オーバーライドは設定デフォルトより優先されます。Codex app-serverのターンはターン開始時にしかtierを受け取れないため、`auto` はすでに実行中のapp-serverターン内ではなく、次にOpenClawが開始するモデルターンに適用されます。

    [思考とfast mode](/ja-JP/tools/thinking) と [OpenAI fast mode](/ja-JP/providers/openai#fast-mode)を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とあらゆる
    セッションオーバーライドの**許可リスト**になります。そのリストにないモデルを選択すると、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    このエラーは通常の返信の**代わりに**返されます。修正: 正確なモデルを
    `agents.defaults.models` に追加する、動的プロバイダーカタログ用に `"provider/*": {}` のようなプロバイダーワイルドカードを追加する、許可リストを削除する、または `/model list` からモデルを選択してください。
    コマンドに `--runtime codex` も含まれていた場合は、先に許可リストを更新してから、同じ
    `/model provider/model --runtime codex` コマンドを再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M3」と表示されるのはなぜですか？'>
    これは**プロバイダーが設定されていない**（MiniMaxプロバイダー設定または認証
    プロファイルが見つからない）ため、モデルを解決できないことを意味します。

    修正チェックリスト:

    1. 現在のOpenClawリリースにアップグレードする（またはソース `main` から実行する）うえで、gatewayを再起動します。
    2. MiniMaxが設定されている（ウィザードまたはJSON）こと、または一致するプロバイダーを注入できるようにMiniMax認証
       がenv/認証プロファイルに存在することを確認してください
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済みMiniMax
       OAuth）。
    3. 認証パスに対応する正確なモデルID（大文字小文字を区別）を使用してください:
       APIキーセットアップでは `minimax/MiniMax-M3`、`minimax/MiniMax-M2.7`、または
       `minimax/MiniMax-M2.7-highspeed`、OAuthセットアップでは
       `minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7`、または
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します。

       ```bash
       openclaw models list
       ```

       そして一覧から選択します（またはチャット内の `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models)を参照してください。

  </Accordion>

  <Accordion title="MiniMaxをデフォルトにし、複雑なタスクにはOpenAIを使えますか？">
    はい。**MiniMaxをデフォルト**として使用し、必要に応じて**セッション単位**でモデルを切り替えてください。
    フォールバックは**エラー**用であり、「難しいタスク」用ではないため、`/model` または別のエージェントを使用してください。

    **選択肢A: セッション単位で切り替える**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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

    **選択肢B: 別々のエージェント**

    - エージェントAのデフォルト: MiniMax
    - エージェントBのデフォルト: OpenAI
    - エージェントでルーティングするか、`/agent` を使用して切り替える

    Docs: [Models](/ja-JP/concepts/models)、[Multi-Agent Routing](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮形が同梱されています（モデルが `agents.defaults.models` に存在する場合のみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    同じ名前で独自のエイリアスを設定した場合は、その値が優先されます。

  </Accordion>

  <Accordion title="モデルのショートカット（エイリアス）はどう定義または上書きしますか？">
    エイリアスは `agents.defaults.models.<modelId>.alias` から取得されます。例:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    その後、`/model sonnet`（またはサポートされている場合は `/<alias>`）はそのモデル ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など、他のプロバイダーのモデルを追加するにはどうすればよいですか？">
    OpenRouter（トークン単位課金、多数のモデル）:

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

    プロバイダーまたはモデルを参照しているのに必要なプロバイダーキーがない場合、実行時の認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後に、プロバイダーの API キーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとで、次に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuth プロファイルでは、そのエージェントに専用アカウントが必要な場合は新しいエージェントからサインインします。それ以外の場合、OpenClaw はリフレッシュトークンを複製せずにデフォルト/メインエージェントを読み通せます。

    エージェント間で `agentDir` を再利用しないでください。認証/セッションの衝突が発生します。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で発生します。

    1. 同じプロバイダー内での**認証プロファイルローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を続けられます。

    レート制限バケットには、単純な `429` レスポンス以外も含まれます。OpenClaw は
    `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用量ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバー対象の
    レート制限として扱います。

    課金に見えるレスポンスの一部は `402` ではなく、一部の HTTP `402`
    レスポンスもその一時的バケットに残ります。プロバイダーが `401` または `403` で
    明示的な課金テキストを返す場合、OpenClaw はそれを
    課金レーンに維持できますが、プロバイダー固有のテキストマッチャーは、それを所有する
    プロバイダーにスコープされます（例: OpenRouter `Key limit exceeded`）。一方で `402`
    メッセージが、再試行可能な使用量ウィンドウまたは
    組織/ワークスペースの支出制限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）に見える場合、OpenClaw はそれを
    長期の課金無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは異なります:
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` などのシグネチャは、モデルフォールバックに進むのではなく
    Compaction/再試行パスに残ります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むものすべて」より意図的に狭く扱われます。OpenClaw は、Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような停止理由エラー、一時的なサーバーテキスト
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）を含む JSON `api_error` ペイロード、`ModelNotReadyException` のようなプロバイダー混雑エラーなど、
    プロバイダーにスコープされた一時的な形状を、プロバイダーコンテキストが
    一致する場合に、フェイルオーバー対象のタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown
    error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それ単独ではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とはどういう意味ですか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使用しようとしたものの、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの場所を確認する**（新旧のパス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、systemd/launchd 経由で Gateway を実行している場合、継承されないことがあります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にします。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在することがあります。
    - **モデル/認証ステータスを簡易確認する**
      - `openclaw models status` を使用して、設定済みモデルとプロバイダーが認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているものの、Gateway が
    認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使用する**
      - ゲートウェイホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使用したい場合**
      - **ゲートウェイホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 見つからないプロファイルを強制する固定順序をクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ゲートウェイホストでコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはノート PC ではなくゲートウェイマシン上にあります。

  </Accordion>

  <Accordion title="Google Gemini も試行して失敗したのはなぜですか？">
    モデル設定に Google Gemini がフォールバックとして含まれている場合（または Gemini の短縮形に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試行します。Google 認証情報を設定していない場合、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、`agents.defaults.model.fallbacks` / エイリアスから Google モデルを削除または回避し、フォールバックがそこへルーティングされないようにします。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因: セッション履歴に**署名のない thinking ブロック**が含まれています（多くの場合、
    中断または部分的なストリームが原因です）。Google Antigravity は thinking ブロックに署名を要求します。

    修正: OpenClaw は現在、Google Antigravity Claude について未署名の thinking ブロックを取り除きます。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定します。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: その概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルは、プロバイダーに紐づく名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを調べるには、`openclaw models auth list` を実行します（必要に応じて `--provider <id>` または `--json`）。詳細は [Models CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="典型的なプロファイル ID は何ですか？">
    OpenClaw は次のようなプロバイダー接頭辞付き ID を使用します。

    - `anthropic:default`（メール ID が存在しない場合によく使われます）
    - OAuth ID 用の `anthropic:<email>`
    - ユーザーが選ぶカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試行する認証プロファイルを制御できますか？">
    はい。設定では、プロファイルの任意メタデータとプロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存しません。ID をプロバイダー/モードにマップし、ローテーション順序を設定します。

    OpenClaw は、短い**クールダウン**（レート制限/タイムアウト/認証失敗）または長い**無効化**状態（課金/クレジット不足）にあるプロファイルを一時的にスキップすることがあります。これを調べるには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限クールダウンはモデルスコープにできます。あるモデルでクールダウン中の
    プロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き使用可能な場合があります。
    一方、課金/無効化ウィンドウはプロファイル全体をブロックします。

    CLI を使用して、**エージェントごと**の順序上書き（そのエージェントの `auth-state.json` に保存）も設定できます。

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

    実際に何が試行されるかを確認するには、次を使用します。

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、probe は
    それを黙って試す代わりに、そのプロファイルについて `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートしています。

    - **OAuth / CLI ログイン**は、プロバイダーがサポートしている場合、
      サブスクリプションアクセスを活用することがよくあります。Anthropic では、OpenClaw の Claude CLI バックエンドは
      Claude Code `claude -p` を使用します。Anthropic は現在これを Agent
      SDK/プログラム利用として扱い、2026 年 6 月 15 日から別の月次 Agent SDK クレジットが適用されます。
    - **API キー**はトークン単位課金を使用します。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
