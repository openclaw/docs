---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルの概要と管理方法
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-04-30T05:17:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルの質疑応答。セットアップ、セッション、Gateway、チャネル、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: 既定値、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「既定のモデル」とは何ですか？'>
    OpenClaw の既定モデルは、次のように設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `openai-codex/gpt-5.5`）。プロバイダーを省略した場合、OpenClaw はまずエイリアスを試し、次にその正確なモデル ID に一致する一意の設定済みプロバイダーを試し、その後にのみ、非推奨の互換パスとして設定済みの既定プロバイダーへフォールバックします。そのプロバイダーが設定済みの既定モデルをすでに公開していない場合、OpenClaw は古い削除済みプロバイダーの既定値を表示する代わりに、最初の設定済みプロバイダー/モデルへフォールバックします。それでも `provider/model` は**明示的に**設定するべきです。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨される既定値:** プロバイダースタックで利用できる最も強力な最新世代モデルを使用してください。
    **ツール有効または信頼できない入力を扱うエージェント:** コストよりもモデルの強さを優先してください。
    **通常の低リスクなチャット:** より安価なフォールバックモデルを使用し、エージェントの役割ごとにルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安として、高リスクな作業には**手の届く範囲で最良のモデル**を使用し、通常のチャットや要約にはより安価な
    モデルを使用してください。エージェントごとにモデルをルーティングし、サブエージェントを使って
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプト
    インジェクションや安全でない動作に対して脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    詳細: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるにはどうすればよいですか？">
    **モデルコマンド**を使用するか、**モデル**フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の `/model`（すばやく、セッションごと）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換えるつもりでない限り、部分オブジェクトで `config.apply` を使うことは避けてください。
    RPC 編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup ペイロードは、正規化されたパス、浅いスキーマドキュメント/制約、直下の子要素の要約を提供します。
    部分更新用です。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）を使用できますか？">
    はい。ローカルモデルには Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールします
    2. `ollama pull gemma4` などでローカルモデルを取得します
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行します
    4. `openclaw onboard` を実行し、`Ollama` を選択します
    5. `Local` または `Cloud + Local` を選択します

    注:

    - `Cloud + Local` では、クラウドモデルに加えてローカルの Ollama モデルを使用できます
    - `kimi-k2.5:cloud` などのクラウドモデルにはローカルでの取得は不要です
    - 手動で切り替えるには、`openclaw models list` と `openclaw models set ollama/<model>` を使用します

    セキュリティ上の注意: 小さいモデルや強く量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使用できるボットには**大規模モデル**を強く推奨します。
    それでも小さいモデルを使いたい場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はどのモデルを使用していますか？">
    - これらのデプロイメントは異なる場合があり、時間とともに変わることがあります。固定のプロバイダー推奨はありません。
    - 各 Gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティに敏感なエージェントやツール有効エージェントには、利用可能な最も強力な最新世代モデルを使用してください。

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

    利用可能なモデルは `/model`、`/model list`、または `/model status` で一覧表示できます。

    `/model`（および `/model list`）は、コンパクトな番号付きピッカーを表示します。番号で選択します。

    ```
    /model 3
    ```

    プロバイダーに対して特定の認証プロファイルを強制することもできます（セッションごと）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` は、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使用されているか、次にどの認証プロファイルが試されるかを表示します。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）と API モード（`api`）も表示します。

    **@profile で設定したプロファイルの固定を解除するにはどうすればよいですか？**

    `@profile` サフィックスを付けずに `/model` を再実行してください。

    ```
    /model anthropic/claude-opus-4-6
    ```

    既定値に戻したい場合は、`/model` から選択します（または `/model <default provider/model>` を送信します）。
    どの認証プロファイルがアクティブかを確認するには、`/model status` を使用してください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.5、コーディングには Codex 5.5 を使用できますか？">
    はい。片方をデフォルトに設定し、必要に応じて切り替えます。

    - **クイック切り替え（セッションごと）:** 現在の直接 OpenAI API キータスクには `/model openai/gpt-5.5`、GPT-5.5 Codex OAuth タスクには `/model openai-codex/gpt-5.5` を使用します。
    - **デフォルト:** API キー使用には `agents.defaults.model.primary` を `openai/gpt-5.5` に、GPT-5.5 Codex OAuth 使用には `openai-codex/gpt-5.5` に設定します。
    - **サブエージェント:** コーディングタスクを、異なるデフォルトモデルを持つサブエージェントにルーティングします。

    [モデル](/ja-JP/concepts/models)と[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するにはどうすればよいですか？">
    セッショントグルまたは設定デフォルトのいずれかを使用します。

    - **セッションごと:** セッションが `openai/gpt-5.5` または `openai-codex/gpt-5.5` を使用している間に `/fast on` を送信します。
    - **モデルごとのデフォルト:** `agents.defaults.models["openai/gpt-5.5"].params.fastMode` または `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` を `true` に設定します。

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

    OpenAI の場合、高速モードは対応しているネイティブ Responses リクエストで `service_tier = "priority"` に対応します。セッションの `/fast` オーバーライドは設定デフォルトより優先されます。

    [思考と高速モード](/ja-JP/tools/thinking)と[OpenAI 高速モード](/ja-JP/providers/openai#fast-mode)を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示された後、返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` とすべての
    セッションオーバーライドの**許可リスト**になります。そのリストにないモデルを選択すると、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    このエラーは通常の返信の**代わりに**返されます。修正方法: モデルを
    `agents.defaults.models` に追加する、許可リストを削除する、または `/model list` からモデルを選択します。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは**プロバイダーが設定されていない**ことを意味します（MiniMax プロバイダー設定または認証
    プロファイルが見つかりませんでした）。そのため、モデルを解決できません。

    修正チェックリスト:

    1. 最新の OpenClaw リリースにアップグレードする（またはソース `main` から実行する）し、その後 Gateway を再起動します。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax 認証が
       env/認証プロファイルに存在し、一致するプロバイダーを注入できることを確認します
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証パスに対応する正確なモデル ID（大文字小文字を区別）を使用します:
       API キー
       設定では `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth 設定では `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します。

       ```bash
       openclaw models list
       ```

       そしてリストから選択します（またはチャットで `/model list`）。

    [MiniMax](/ja-JP/providers/minimax)と[モデル](/ja-JP/concepts/models)を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにし、複雑なタスクには OpenAI を使用できますか？">
    はい。**MiniMax をデフォルト**として使用し、必要なときに**セッションごと**にモデルを切り替えます。
    フォールバックは**エラー**用であり、「難しいタスク」用ではないため、`/model` または別のエージェントを使用してください。

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

    **オプション B: 個別のエージェント**

    - エージェント A のデフォルト: MiniMax
    - エージェント B のデフォルト: OpenAI
    - エージェントでルーティングするか、`/agent` を使用して切り替える

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮名が同梱されています（モデルが `agents.defaults.models` に存在する場合にのみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API キー設定では `openai/gpt-5.5`、Codex OAuth 用に設定されている場合は `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、その値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）を定義または上書きするにはどうすればよいですか？">
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

  <Accordion title="OpenRouter や Z.AI など他のプロバイダーのモデルを追加するにはどうすればよいですか？">
    OpenRouter（トークンごとの課金、多数のモデル）:

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

    プロバイダー/モデルを参照していて、必要なプロバイダーキーがない場合、実行時の認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後にプロバイダーの API キーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとに分かれており、
    次の場所に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuth プロファイルの場合、そのエージェント固有のアカウントが必要なときは新しいエージェントからサインインします。それ以外の場合、OpenClaw は更新トークンを複製せずにデフォルト/メインエージェントを読み通せます。

    エージェント間で `agentDir` を再利用**しないでください**。認証/セッションの衝突が発生します。

  </Accordion>
</AccordionGroup>

## モデルのフェイルオーバーと「すべてのモデルが失敗しました」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で発生します。

    1. 同じプロバイダー内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、プロバイダーがレート制限中または一時的に失敗している場合でも、OpenClaw は応答を続けられます。

    レート制限バケットには、単なる `429` 応答以外も含まれます。OpenClaw は
    `Too many concurrent requests`、
    `ThrottlingException`、`concurrency limit reached`、
    `workers_ai ... quota limit exceeded`、`resource exhausted`、および定期的な
    使用期間の上限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバー対象の
    レート制限として扱います。

    請求関連に見える応答の一部は `402` ではなく、HTTP `402`
    応答の一部も同じ一時的バケットに残ります。プロバイダーが
    `401` または `403` で明示的な請求関連テキストを返す場合、OpenClaw はそれを
    請求レーンに保持できますが、プロバイダー固有のテキストマッチャーは、それを所有する
    プロバイダーの範囲内に保たれます（例: OpenRouter `Key limit exceeded`）。`402`
    メッセージが、再試行可能な使用期間の上限、または
    組織/ワークスペースの支出上限（`daily limit reached, resets tomorrow`、
    `organization spending limit exceeded`）のように見える場合、OpenClaw はそれを
    長期の請求無効化ではなく `rate_limit` として扱います。

    コンテキストあふれのエラーは異なります。
    `request_too_large`、`input exceeds the maximum number of tokens`、
    `input token count exceeds the maximum number of input tokens`、
    `input is too long for the model`、または `ollama error: context length
    exceeded` のようなシグネチャは、モデルフォールバックへ進まずに
    Compaction/再試行パスに残ります。

    汎用のサーバーエラーテキストは、「unknown/error を含むものなら何でも」より意図的に狭くなっています。
    OpenClaw は、プロバイダーコンテキストが一致する場合に、Anthropic の素の `An unknown error occurred`、OpenRouter の素の
    `Provider returned error`、`Unhandled stop reason:
    error` のような停止理由エラー、一時的なサーバーテキストを含む JSON `api_error` ペイロード
    （`internal server error`、`unknown error, 520`、`upstream error`、`backend
    error`）、および `ModelNotReadyException` のようなプロバイダー混雑エラーを、
    フェイルオーバー対象のタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown
    error.` のような汎用の内部フォールバックテキストは保守的に扱われ、それ自体ではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」は何を意味しますか？'>
    これは、システムが認証プロファイル ID `anthropic:default` を使おうとしたものの、想定される認証ストア内にその認証情報が見つからなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの保存場所を確認する**（新旧のパス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、systemd/launchd 経由で Gateway を実行している場合、継承されないことがあります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - 複数エージェント構成では、`auth-profiles.json` ファイルが複数存在する場合があります。
    - **モデル/認証ステータスの健全性を確認する**
      - `openclaw models status` を使って、設定済みモデルとプロバイダーが認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているものの、Gateway が
    認証ストア内でそれを見つけられないことを意味します。

    - **Claude CLI を使う**
      - Gateway ホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使いたい場合**
      - **Gateway ホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 見つからないプロファイルを強制する固定順序をクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway ホスト上でコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはノート PC ではなく Gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか？">
    モデル設定にフォールバックとして Google Gemini が含まれている場合（または Gemini の省略表記に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試します。Google の認証情報を設定していない場合、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、`agents.defaults.model.fallbacks` / エイリアス内の Google モデルを削除または回避して、フォールバックがそこへルーティングされないようにします。

    **LLM リクエストが拒否されました: thinking シグネチャが必要です（Google Antigravity）**

    原因: セッション履歴に**シグネチャのない thinking ブロック**が含まれています（多くの場合、
    中断された/部分的なストリームが原因です）。Google Antigravity は thinking ブロックにシグネチャを要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに署名されていない thinking ブロックを取り除きます。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: 概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、複数アカウントのパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルは、プロバイダーに紐づく名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次の場所にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="一般的なプロファイル ID は何ですか？">
    OpenClaw は次のようなプロバイダー接頭辞付き ID を使います。

    - `anthropic:default`（メール ID がない場合によく使われます）
    - OAuth ID 用の `anthropic:<email>`
    - 自分で選ぶカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="最初に試行される認証プロファイルを制御できますか？">
    はい。設定では、プロファイル用の任意メタデータと、プロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存しません。ID をプロバイダー/モードへ対応付け、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）または長い**無効**状態（請求/クレジット不足）にある場合、一時的にスキップすることがあります。これを確認するには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限のクールダウンはモデル単位にできます。あるモデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは使用可能な場合があります。
    一方、請求/無効化ウィンドウは引き続きプロファイル全体をブロックします。

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

    実際に何が試行されるかを確認するには、次を使います。

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、probe はそのプロファイルを黙って試すのではなく、
    `excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートしています。

    - **OAuth** は、多くの場合サブスクリプションアクセスを活用します（該当する場合）。
    - **API キー**はトークンごとの従量課金を使用します。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、および API キーを明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回実行セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
