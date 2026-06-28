---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルの理解と管理方法
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-06-28T20:43:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルのQ&A。セットアップ、セッション、Gateway、チャンネル、トラブルシューティングについては、メインの[FAQ](/ja-JP/help/faq)を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClawのデフォルトモデルは、次で設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは`provider/model`として参照されます（例: `openai/gpt-5.5`または`anthropic/claude-sonnet-4-6`）。プロバイダーを省略した場合、OpenClawはまずエイリアスを試し、次にその正確なモデルIDに一致する一意の設定済みプロバイダーを試し、その後でのみ、非推奨の互換パスとして設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルをもう公開していない場合、OpenClawは古い削除済みプロバイダーのデフォルトを表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。それでも`provider/model`を**明示的に**設定する必要があります。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨デフォルト:** プロバイダースタックで利用できる最も強力な最新世代モデルを使用してください。
    **ツール有効または信頼できない入力を扱うエージェント:** コストよりモデルの強さを優先してください。
    **日常的/低リスクのチャット:** より安価なフォールバックモデルを使い、エージェントの役割でルーティングしてください。

    MiniMaxには独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax)と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクの作業には**予算内で使える最良のモデル**を使い、日常的なチャットや要約にはより安価な
    モデルを使ってください。エージェントごとにモデルをルーティングし、サブエージェントを使って
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models)と
    [サブエージェント](/ja-JP/tools/subagents)を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプト
    インジェクションや安全でない動作に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security)を参照してください。

    詳細: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるには？">
    **モデルコマンド**を使うか、**model**フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の`/model`（高速、セッション単位）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json`の`agents.defaults.model`を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで`config.apply`を使うのは避けてください。
    RPC編集では、まず`config.schema.lookup`で確認し、`config.patch`を優先してください。lookupペイロードには、正規化済みパス、浅いスキーマドキュメント/制約、直下の子要素の概要が含まれます。
    部分更新用です。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor`を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。Ollamaはローカルモデルを使う最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download`からOllamaをインストールする
    2. `ollama pull gemma4`などのローカルモデルをpullする
    3. クラウドモデルも使いたい場合は、`ollama signin`を実行する
    4. `openclaw onboard`を実行して`Ollama`を選ぶ
    5. `Local`または`Cloud + Local`を選ぶ

    メモ:

    - `Cloud + Local`では、クラウドモデルに加えてローカルOllamaモデルを使えます
    - `kimi-k2.5:cloud`などのクラウドモデルはローカルpullを必要としません
    - 手動で切り替えるには、`openclaw models list`と`openclaw models set ollama/<model>`を使ってください

    セキュリティメモ: 小さいモデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使用できるボットには、**大規模モデル**を強く推奨します。
    それでも小さいモデルを使う場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krillはどのモデルを使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わる可能性があります。固定のプロバイダー推奨はありません。
    - 各Gatewayで`openclaw models status`を使い、現在のランタイム設定を確認してください。
    - セキュリティに敏感な/ツール有効エージェントには、利用できる最も強力な最新世代モデルを使ってください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるには？">
    `/model`コマンドを単独メッセージとして使ってください。

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    これらは組み込みエイリアスです。カスタムエイリアスは`agents.defaults.models`で追加できます。

    利用可能なモデルは、`/model`、`/model list`、または`/model status`で一覧表示できます。

    `/model`（および`/model list`）はコンパクトな番号付きピッカーを表示します。番号で選択してください。

    ```
    /model 3
    ```

    プロバイダーの特定の認証プロファイルを強制することもできます（セッション単位）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status`は、どのエージェントがアクティブか、どの`auth-profiles.json`ファイルが使われているか、次にどの認証プロファイルが試行されるかを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）とAPIモード（`api`）も表示します。

    **@profileで設定したプロファイルの固定を解除するには？**

    `@profile`サフィックス**なし**で`/model`を再実行してください。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model`から選ぶ（または`/model <default provider/model>`を送る）してください。
    `/model status`を使って、どの認証プロファイルがアクティブか確認してください。

  </Accordion>

  <Accordion title="2つのプロバイダーが同じモデルIDを公開している場合、/modelはどちらを使いますか？">
    `/model provider/model`は、そのセッションで正確なプロバイダールートを選択します。

    たとえば、`qianfan/deepseek-v4-flash`と`deepseek/deepseek-v4-flash`は、どちらも`deepseek-v4-flash`を含んでいても異なるモデル参照です。OpenClawは、裸のモデルIDが一致するという理由だけで、一方のプロバイダーから他方へ暗黙に切り替えるべきではありません。

    ユーザーが選択した`/model`参照は、フォールバックポリシーについても厳密です。その選択されたプロバイダー/モデルが利用できない場合、`agents.defaults.model.fallbacks`から回答する代わりに、返信は見える形で失敗します。設定済みのフォールバックチェーンは、設定済みデフォルト、Cronジョブのプライマリ、自動選択されたフォールバック状態には引き続き適用されます。

    セッション以外のオーバーライドから開始された実行でフォールバックの使用が許可されている場合、OpenClawはまず要求されたプロバイダー/モデルを試し、次に設定済みフォールバックを試し、その後でのみ設定済みプライマリを試します。これにより、重複する裸のモデルIDがデフォルトプロバイダーへ直接戻るのを防ぎます。

    [モデル](/ja-JP/concepts/models)と[モデルフェイルオーバー](/ja-JP/concepts/model-failover)を参照してください。

  </Accordion>

  <Accordion title="日常タスクにはGPT 5.5を、コーディングにはCodex 5.5を使えますか？">
    はい。モデル選択とランタイム選択は別々に扱ってください。

    - **ネイティブCodexコーディングエージェント:** `agents.defaults.model.primary`を`openai/gpt-5.5`に設定します。ChatGPT/Codexサブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai`でサインインしてください。
    - **エージェントループ外の直接OpenAI APIタスク:** 画像、埋め込み、音声、リアルタイム、その他の非エージェントOpenAI APIサーフェスには`OPENAI_API_KEY`を設定してください。
    - **OpenAIエージェントAPIキー認証:** 順序付きの`openai` APIキープロファイルで`/model openai/gpt-5.5`を使います。
    - **サブエージェント:** コーディングタスクを、独自の`openai/gpt-5.5`モデルを持つCodex重視のエージェントにルーティングします。

    [モデル](/ja-JP/concepts/models)と[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5の高速モードを設定するには？">
    セッショントグルまたは設定デフォルトのどちらかを使ってください。

    - **セッション単位:** セッションが`openai/gpt-5.5`を使っている間に`/fast on`を送信します。
    - **モデルごとのデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode`を`true`に設定します。
    - **自動カットオフ:** `/fast auto`または`params.fastMode: "auto"`を使うと、自動カットオフまで新しいモデル呼び出しを高速で開始し、その後の再試行、フォールバック、ツール結果、継続呼び出しは高速モードなしで開始します。カットオフのデフォルトは60秒です。変更するには、アクティブなモデルで`params.fastAutoOnSeconds`を設定してください。

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

    OpenAIでは、高速モードは対応するネイティブResponsesリクエストの`service_tier = "priority"`に対応します。セッションの`/fast`オーバーライドは設定デフォルトより優先されます。Codexアプリサーバーのターンはターン開始時にのみtierを受け取れるため、`auto`はすでに実行中のアプリサーバーターン内ではなく、次にOpenClawが開始するモデルターンに適用されます。

    [思考と高速モード](/ja-JP/tools/thinking)と[OpenAI高速モード](/ja-JP/providers/openai#fast-mode)を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models`が設定されている場合、それは`/model`と任意の
    セッションオーバーライドの**許可リスト**になります。そのリストにないモデルを選ぶと、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    そのエラーは通常の返信の**代わりに**返されます。修正: 正確なモデルを
    `agents.defaults.models`に追加する、動的プロバイダーカタログ用に`"provider/*": {}`のようなプロバイダーワイルドカードを追加する、許可リストを削除する、または`/model list`からモデルを選んでください。
    コマンドに`--runtime codex`も含まれていた場合は、まず許可リストを更新してから、同じ
    `/model provider/model --runtime codex`コマンドを再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M3」と表示されるのはなぜですか？'>
    これは**プロバイダーが設定されていない**（MiniMaxプロバイダー設定または認証
    プロファイルが見つからなかった）ため、モデルを解決できないことを意味します。

    修正チェックリスト:

    1. 現在のOpenClawリリースへアップグレードする（またはソース`main`から実行する）し、その後Gatewayを再起動します。
    2. MiniMaxが設定されている（ウィザードまたはJSON）こと、または一致するプロバイダーを注入できるようenv/認証プロファイルにMiniMax認証
       が存在することを確認してください
       （`minimax`には`MINIMAX_API_KEY`、`minimax-portal`には`MINIMAX_OAUTH_TOKEN`または保存済みMiniMax
       OAuth）。
    3. 認証パスに対応する正確なモデルID（大文字小文字を区別）を使ってください:
       APIキー設定では`minimax/MiniMax-M3`、`minimax/MiniMax-M2.7`、または
       `minimax/MiniMax-M2.7-highspeed`、OAuth設定では
       `minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7`、または
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 実行:

       ```bash
       openclaw models list
       ```

       そして一覧から選択します（またはチャット内で`/model list`）。

    [MiniMax](/ja-JP/providers/minimax)と[モデル](/ja-JP/concepts/models)を参照してください。

  </Accordion>

  <Accordion title="MiniMaxをデフォルトにして、複雑なタスクにはOpenAIを使えますか？">
    はい。**MiniMaxをデフォルト**として使い、必要に応じて**セッション単位**でモデルを切り替えてください。
    フォールバックは**エラー**用であり、「難しいタスク」用ではないため、`/model`または別のエージェントを使ってください。

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
    - エージェントでルーティングするか、`/agent`を使って切り替える

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮表記が同梱されています（モデルが `agents.defaults.models` に存在する場合にのみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    同じ名前で独自のエイリアスを設定した場合は、あなたの値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）はどのように定義または上書きしますか？">
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

    プロバイダーまたはモデルを参照していて、必要なプロバイダーキーがない場合は、実行時の認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後、プロバイダーの API キーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとで、次に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから、新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuth プロファイルについては、新しいエージェントが独自のアカウントを必要とする場合は、そのエージェントからサインインします。それ以外の場合、OpenClaw は更新トークンを複製せずに、デフォルトまたはメインエージェントを透過的に読み取れます。

    複数のエージェント間で `agentDir` を再利用しないでください。認証やセッションの衝突を引き起こします。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「すべてのモデルが失敗した」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように機能しますか？">
    フェイルオーバーは 2 段階で発生します。

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を続けられます。

    レート制限バケットには、単なる `429` レスポンス以外も含まれます。OpenClaw は、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な使用期間制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバー対象のレート制限として扱います。

    請求に見える一部のレスポンスは `402` ではなく、一部の HTTP `402` レスポンスもその一時的なバケットに残ります。プロバイダーが `401` または `403` で明示的な請求関連テキストを返した場合、OpenClaw はそれを請求レーンに保持できますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーの範囲に限定されます（たとえば OpenRouter の `Key limit exceeded`）。一方、`402` メッセージが再試行可能な使用期間制限、または組織/ワークスペースの支出制限（`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）のように見える場合、OpenClaw はそれを長期的な請求無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは別です。`request_too_large`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、または `ollama error: context length exceeded` のようなシグネチャは、モデルフォールバックを進めるのではなく、Compaction/再試行パスに留まります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むものなら何でも」より意図的に狭くしています。OpenClaw は、Anthropic の単独の `An unknown error occurred`、OpenRouter の単独の `Provider returned error`、`Unhandled stop reason: error` のような停止理由エラー、一時的なサーバーテキスト（`internal server error`、`unknown error, 520`、`upstream error`、`backend error`）を含む JSON `api_error` ペイロード、`ModelNotReadyException` のようなプロバイダー混雑エラーなど、プロバイダー範囲の一時的な形を、プロバイダーコンテキストが一致する場合にフェイルオーバー対象のタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それだけではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」は何を意味しますか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使用しようとしたものの、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの保存場所を確認する**（新しいパスとレガシーパス）
      - 現行: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` によって移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、Gateway を systemd/launchd 経由で実行している場合は、継承されないことがあります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在する場合があります。
    - **モデル/認証の状態を簡易確認する**
      - `openclaw models status` を使って、設定済みモデルと、プロバイダーが認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、その実行が Anthropic 認証プロファイルに固定されているものの、Gateway が認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使用する**
      - ゲートウェイホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使いたい場合**
      - **ゲートウェイホスト**の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 存在しないプロファイルを強制する固定順序をクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ゲートウェイホストでコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはあなたのノート PC ではなくゲートウェイマシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試行して失敗したのですか？">
    モデル設定にフォールバックとして Google Gemini が含まれている場合（または Gemini の短縮表記に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試行します。Google 認証情報を設定していない場合は、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、`agents.defaults.model.fallbacks` / エイリアス内の Google モデルを削除または回避して、フォールバックがそこにルーティングされないようにします。

    **LLM リクエストが拒否されました: thinking シグネチャが必要です（Google Antigravity）**

    原因: セッション履歴に**シグネチャのない thinking ブロック**が含まれています（多くの場合、中断または部分的なストリームによるものです）。Google Antigravity は thinking ブロックにシグネチャを要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 用に署名されていない thinking ブロックを取り除きます。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルとは、プロバイダーに紐づく名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを調べるには、`openclaw models auth list`（必要に応じて `--provider <id>` または `--json`）を実行します。詳細は [Models CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="典型的なプロファイル ID は何ですか？">
    OpenClaw は次のようなプロバイダー接頭辞付き ID を使用します。

    - `anthropic:default`（メール ID がない場合によく使われます）
    - OAuth ID 用の `anthropic:<email>`
    - 自分で選ぶカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試行される認証プロファイルを制御できますか？">
    はい。設定では、プロファイル用の任意のメタデータと、プロバイダーごとの順序（`auth.order.<provider>`）がサポートされています。これはシークレットを保存しません。ID をプロバイダー/モードに対応付け、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）中、またはより長い**無効**状態（請求/クレジット不足）にある場合、一時的にスキップすることがあります。これを確認するには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限のクールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き使用可能な場合があります。一方、請求/無効化ウィンドウはプロファイル全体をブロックします。

    CLI を使って、**エージェントごとの**順序上書き（そのエージェントの `auth-state.json` に保存）も設定できます。

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

    保存済みプロファイルが明示的な順序から省略されている場合、プローブはそれを黙って試行する代わりに、そのプロファイルについて `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートしています。

    - **OAuth / CLI ログイン**は、プロバイダーがサポートしている場合、サブスクリプションアクセスを利用することがよくあります。Anthropic では、OpenClaw の Claude CLI バックエンドは Claude Code `claude -p` を使用します。Anthropic は現在、これを Agent SDK/プログラム利用として扱っています。Anthropic は 2026 年 6 月 15 日の個別の Agent SDK クレジット変更を一時停止したため、現時点ではこれは引き続きサブスクリプション使用制限から消費されます。現在の一時停止通知については、Anthropic の [Agent SDK プラン記事](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) を参照してください。
    - **API キー**はトークン従量課金を使用します。

    ウィザードは、Anthropic Claude CLI、OpenAI Codex OAuth、および API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回起動セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
