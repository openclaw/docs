---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバーのデバッグ / 「すべてのモデルが失敗しました」
    - 認証プロファイルとその管理方法を理解する
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-05-02T04:57:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bf7a6bb4a0e2bf791c73dbb4005ba4628afc2c20e06417f8147f4c65583e884
    source_path: help/faq-models.md
    workflow: 16
---

  モデルおよび認証プロファイルの Q&A。セットアップ、セッション、Gateway、チャンネル、トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次の値として設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `openai-codex/gpt-5.5`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを探し、その後にのみ非推奨の互換パスとして設定済みのデフォルトプロバイダーへフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを公開しなくなっている場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初に設定されたプロバイダー/モデルへフォールバックします。それでも `provider/model` を**明示的に**設定する必要があります。

  </Accordion>

  <Accordion title="どのモデルがおすすめですか？">
    **推奨デフォルト:** 使用しているプロバイダースタックで利用可能な最強の最新世代モデルを使用してください。
    **ツールを有効にしたエージェント、または信頼できない入力を扱うエージェント:** コストよりもモデルの性能を優先してください。
    **日常的/低リスクのチャット:** より安価なフォールバックモデルを使用し、エージェントのロールでルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) および
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクの作業には**手の届く範囲で最良のモデル**を使用し、日常的なチャットや要約にはより安価な
    モデルを使用してください。エージェントごとにモデルをルーティングし、サブエージェントを使用して
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプトインジェクションや
    安全でない動作に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    追加の背景情報: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるには？">
    **モデルコマンド**を使用するか、**モデル**フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の `/model`（素早い、セッション単位）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` 内の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
    RPC 編集では、まず `config.schema.lookup` で調べ、`config.patch` を優先してください。lookup ペイロードは、正規化されたパス、浅いスキーマドキュメント/制約、直下の子要素の要約を提供します。
    部分更新用です。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。Ollama はローカルモデルを使う最も簡単な方法です。

    最短のセットアップ:

    1. `https://ollama.com/download` から Ollama をインストールする
    2. `ollama pull gemma4` などのローカルモデルを取得する
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行し、`Ollama` を選択する
    5. `Local` または `Cloud + Local` を選択する

    注:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルも利用できます
    - `kimi-k2.5:cloud` などのクラウドモデルはローカルでの取得を必要としません
    - 手動で切り替える場合は、`openclaw models list` と `openclaw models set ollama/<model>` を使用してください

    セキュリティ上の注意: 小さいモデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使用できるボットには**大規模モデル**を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はどのモデルを使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わる可能性があります。固定のプロバイダー推奨はありません。
    - 各 Gateway の現在のランタイム設定を `openclaw models status` で確認してください。
    - セキュリティに敏感なエージェントやツールを有効にしたエージェントには、利用可能な最強の最新世代モデルを使用してください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるには？">
    `/model` コマンドを単独のメッセージとして使用します。

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    これらは組み込みのエイリアスです。カスタムエイリアスは `agents.defaults.models` で追加できます。

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

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次に試される認証プロファイルを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も表示します。

    **@profile で設定したプロファイルの固定を解除するには？**

    `@profile` サフィックスを付けずに `/model` を再実行してください。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選ぶ（または `/model <default provider/model>` を送信する）してください。
    どの認証プロファイルがアクティブかを確認するには `/model status` を使用してください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.5、コーディングには Codex 5.5 を使えますか？">
    はい。モデル選択とランタイム選択は別々に扱ってください。

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に、`agents.defaults.agentRuntime.id` を `"codex"` に設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインしてください。
    - **PI 経由の直接 OpenAI API タスク:** Codex ランタイムの上書きなしで `/model openai/gpt-5.5` を使用し、`OPENAI_API_KEY` を設定します。
    - **PI 経由の Codex OAuth:** 通常の PI ランナーで Codex OAuth を意図的に使いたい場合にのみ、`/model openai-codex/gpt-5.5` を使用します。
    - **サブエージェント:** コーディングタスクを、独自のモデルと `agentRuntime` デフォルトを持つ Codex 専用エージェントへルーティングします。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するには？">
    セッションの切り替え、または設定デフォルトのいずれかを使用します。

    - **セッション単位:** セッションが `openai/gpt-5.5` または `openai-codex/gpt-5.5` を使用している間に `/fast on` を送信します。
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

    OpenAI では、高速モードは対応するネイティブ Responses リクエスト上の `service_tier = "priority"` に対応します。セッションの `/fast` 上書きは設定デフォルトより優先されます。

    [思考と高速モード](/ja-JP/tools/thinking) および [OpenAI 高速モード](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とあらゆる
    セッション上書きの**許可リスト**になります。そのリストにないモデルを選択すると、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    このエラーは通常の返信の**代わりに**返されます。修正: そのモデルを
    `agents.defaults.models` に追加する、許可リストを削除する、または `/model list` からモデルを選択してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは、**プロバイダーが設定されていない**（MiniMax プロバイダー設定または認証
    プロファイルが見つからなかった）ため、モデルを解決できないことを意味します。

    修正チェックリスト:

    1. 現行の OpenClaw リリースにアップグレードする（またはソースの `main` から実行する）してから、Gateway を再起動する。
    2. MiniMax が設定されている（ウィザードまたは JSON）こと、または MiniMax 認証が
       env/認証プロファイルに存在し、一致するプロバイダーを注入できることを確認する
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済みの MiniMax
       OAuth）。
    3. 認証パスに対応する正確なモデル ID（大文字小文字を区別）を使用する:
       API キー
       セットアップでは `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth セットアップでは
       `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行する:

       ```bash
       openclaw models list
       ```

       そして一覧から選択する（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにし、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**として使用し、必要に応じて**セッション単位**でモデルを切り替えてください。
    フォールバックは「難しいタスク」用ではなく**エラー**用なので、`/model` または別のエージェントを使用してください。

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
    - エージェントでルーティングする、または `/agent` を使用して切り替える

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮名が同梱されています（モデルが `agents.defaults.models` に存在する場合にのみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API キーセットアップでは `openai/gpt-5.5`、Codex OAuth 用に設定されている場合は `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、その値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）を定義/上書きするには？">
    エイリアスは `agents.defaults.models.<modelId>.alias` から来ます。例:

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

  <Accordion title="OpenRouter や Z.AI など他のプロバイダーのモデルを追加するには？">
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

    プロバイダー/モデルを参照しているのに必要なプロバイダーキーがない場合、ランタイム認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後にプロバイダーの API キーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとに管理され、次に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから、新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuth プロファイルでは、新しいエージェントが独自のアカウントを必要とする場合、そのエージェントからサインインします。それ以外の場合、OpenClaw はリフレッシュトークンを複製せずにデフォルト/メインエージェントを参照できます。

    エージェント間で `agentDir` を再利用**しないでください**。認証/セッションの衝突が発生します。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で発生します。

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を続けられます。

    レート制限バケットには、単純な `429` レスポンス以外も含まれます。OpenClaw は、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な使用量ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバー対象のレート制限として扱います。

    課金に見えるレスポンスの一部は `402` ではなく、一部の HTTP `402` レスポンスもその一時的なバケットに残ります。プロバイダーが `401` または `403` で明示的な課金テキストを返す場合、OpenClaw はそれを課金レーンに保持できますが、プロバイダー固有のテキストマッチャーは、それを所有するプロバイダーのスコープに留まります（たとえば OpenRouter の `Key limit exceeded`）。一方、`402` メッセージがリトライ可能な使用量ウィンドウや組織/ワークスペースの支出上限（`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）に見える場合、OpenClaw はそれを長期の課金無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは異なります。`request_too_large`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、または `ollama error: context length exceeded` のようなシグネチャは、モデルフォールバックを進めるのではなく、Compaction/リトライパスに留まります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むものなら何でも」よりも意図的に狭く扱われます。OpenClaw は、Anthropic の裸の `An unknown error occurred`、OpenRouter の裸の `Provider returned error`、`Unhandled stop reason: error` のような停止理由エラー、一時的なサーバーテキスト（`internal server error`、`unknown error, 520`、`upstream error`、`backend error`）を含む JSON `api_error` ペイロード、`ModelNotReadyException` のようなプロバイダー混雑エラーなど、プロバイダースコープの一時的な形を、プロバイダーコンテキストが一致する場合にフェイルオーバー対象のタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それ単体ではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」はどういう意味ですか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使用しようとしたものの、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの保存場所を確認する**（新しいパスとレガシーパス）
      - 現行: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、Gateway を systemd/launchd 経由で実行している場合、それを継承しないことがあります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在することがあります。
    - **モデル/認証ステータスを健全性確認する**
      - `openclaw models status` を使用して、設定済みモデルとプロバイダーが認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているものの、Gateway がその認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使用する**
      - Gateway ホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使用したい場合**
      - **Gateway ホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 存在しないプロファイルを強制する固定順序をクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway ホスト上でコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはノートパソコンではなく Gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか？">
    モデル設定にフォールバックとして Google Gemini が含まれている（または Gemini の省略形に切り替えた）場合、OpenClaw はモデルフォールバック中にそれを試します。Google の認証情報を設定していない場合、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、フォールバックがそこへルーティングされないように、`agents.defaults.model.fallbacks` / エイリアス内の Google モデルを削除または回避してください。

    **LLM リクエストが拒否されました: thinking シグネチャが必要です（Google Antigravity）**

    原因: セッション履歴に**シグネチャのない thinking ブロック**が含まれています（多くの場合、中断/部分的なストリームが原因）。Google Antigravity は thinking ブロックにシグネチャを要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに署名なしの thinking ブロックを取り除きます。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルとは、プロバイダーに紐づけられた名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的なプロファイル ID は何ですか？">
    OpenClaw は次のような、プロバイダー接頭辞付きの ID を使用します。

    - `anthropic:default`（メール ID が存在しない場合によく使われます）
    - OAuth ID 用の `anthropic:<email>`
    - 選択したカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試す認証プロファイルを制御できますか？">
    はい。設定では、プロファイルの任意メタデータと、プロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存しません。ID をプロバイダー/モードに対応付け、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）またはより長い**無効化**状態（課金/クレジット不足）にある場合、一時的にスキップすることがあります。これを確認するには、`openclaw models status --json` を実行して `auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限クールダウンはモデルスコープにできます。あるモデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き使用可能なことがあります。一方、課金/無効化ウィンドウは引き続きプロファイル全体をブロックします。

    CLI を使用して、**エージェントごと**の順序オーバーライド（そのエージェントの `auth-state.json` に保存）も設定できます。

    ```bash
    # 設定済みのデフォルトエージェントが既定（--agent は省略）
    openclaw models auth order get --provider anthropic

    # ローテーションを単一のプロファイルに固定（これだけを試行）
    openclaw models auth order set --provider anthropic anthropic:default

    # または明示的な順序を設定（プロバイダー内フォールバック）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # オーバーライドをクリア（config auth.order / ラウンドロビンにフォールバック）
    openclaw models auth order clear --provider anthropic
    ```

    特定のエージェントを対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるかを確認するには、次を使用します。

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、プローブは黙って試す代わりに、そのプロファイルについて `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートしています。

    - **OAuth** は、多くの場合サブスクリプションアクセスを活用します（該当する場合）。
    - **API キー**は従量課金を使用します。

    ウィザードは、Anthropic Claude CLI、OpenAI Codex OAuth、および API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回実行セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
