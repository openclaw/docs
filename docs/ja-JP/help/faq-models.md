---
read_when:
    - モデルを選択または切り替えたり、エイリアスを設定したりすること
    - モデルのフェイルオーバーや「All models failed」のデバッグ
    - auth profile とその管理方法を理解すること
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、auth profile＿日本ี่ปุ่น'
title: 'FAQ: モデルと認証'
x-i18n:
    generated_at: "2026-04-24T05:01:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  モデルと auth profile に関する Q&A です。セットアップ、セッション、gateway、チャンネル、トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次で設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.4` または `openai-codex/gpt-5.5`）。プロバイダーを省略すると、OpenClaw は最初にエイリアスを試し、次にその正確な model id に対する一意な configured-provider 一致を試し、それでも見つからない場合にのみ、非推奨の互換パスとして設定済みデフォルトプロバイダーにフォールバックします。そのプロバイダーがもはや設定済みデフォルトモデルを公開していない場合、OpenClaw は stale な削除済みプロバイダーデフォルトを表に出すのではなく、最初の configured provider/model にフォールバックします。それでも、**明示的に** `provider/model` を設定するべきです。

  </Accordion>

  <Accordion title="どのモデルをおすすめしますか？">
    **推奨デフォルト:** 利用可能なプロバイダースタックの中で、最も強力な最新世代モデルを使ってください。
    **tool 対応または信頼できない入力を扱うエージェント向け:** コストよりモデルの強さを優先してください。
    **定型/低リスクのチャット向け:** より安価なフォールバックモデルを使い、エージェントの役割ごとにルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [Local models](/ja-JP/gateway/local-models)。

    経験則として、高リスクな作業には**払える範囲で最良のモデル**を使い、定型チャットや要約にはより安価な
    モデルを使ってください。エージェントごとにモデルをルーティングでき、sub-agent を使って
    長いタスクを並列化することもできます（各 sub-agent は token を消費します）。[Models](/ja-JP/concepts/models) と
    [Sub-agents](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプトインジェクションや危険な挙動に対してより脆弱です。[Security](/ja-JP/gateway/security) を参照してください。

    さらに詳しくは: [Models](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="config を消さずにモデルを切り替えるにはどうすればいいですか？">
    **model コマンド**を使うか、**model** フィールドだけを編集してください。config 全体の置換は避けてください。

    安全な方法:

    - チャットで `/model`（手早い、セッション単位）
    - `openclaw models set ...`（model config だけを更新）
    - `openclaw configure --section model`（対話型）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    config 全体を置き換える意図がない限り、部分オブジェクトに対して `config.apply` を使わないでください。
    RPC 編集では、まず `config.schema.lookup` で調べ、部分更新には `config.patch` を優先してください。lookup payload は正規化されたパス、浅い schema のドキュメント/制約、および直下の子要約を返します。
    部分更新に使ってください。
    もし config を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [Models](/ja-JP/concepts/models), [Configure](/ja-JP/cli/configure), [Config](/ja-JP/cli/config), [Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルでは Ollama が最も簡単な経路です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールする
    2. `ollama pull gemma4` のようにローカルモデルを pull する
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行し、`Ollama` を選ぶ
    5. `Local` または `Cloud + Local` を選ぶ

    注:

    - `Cloud + Local` では、クラウドモデルとローカル Ollama モデルの両方が使えます
    - `kimi-k2.5:cloud` のようなクラウドモデルにはローカル pull は不要です
    - 手動切り替えには `openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ注記: 小型モデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。tools を使える bot には**大きなモデル**を強く推奨します。
    それでも小型モデルを使いたい場合は、sandboxing と厳格な tool allowlist を有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama), [Local models](/ja-JP/gateway/local-models),
    [Model providers](/ja-JP/concepts/model-providers), [Security](/ja-JP/gateway/security),
    [Sandboxing](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill ではどのモデルを使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わることもあります。固定のプロバイダー推奨はありません。
    - 各 gateway の現在のランタイム設定は `openclaw models status` で確認してください。
    - セキュリティに敏感で tool 対応のエージェントには、利用可能な中で最も強力な最新世代モデルを使ってください。
  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるにはどうすればいいですか？">
    `/model` コマンドを単独メッセージとして使ってください。

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

    利用可能なモデルは `/model`, `/model list`, `/model status` で一覧できます。

    `/model`（および `/model list`）はコンパクトな番号付きピッカーを表示します。番号で選択します。

    ```
    /model 3
    ```

    プロバイダーに対して特定の auth profile を強制することもできます（セッション単位）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` には、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの auth profile が試されるかが表示されます。
    利用可能であれば、設定されたプロバイダー endpoint（`baseUrl`）と API mode（`api`）も表示されます。

    **`@profile` で設定した profile pin を解除するには？**

    `@profile` 接尾辞**なし**で `/model` を再実行してください。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` からそれを選んでください（または `/model <default provider/model>` を送信してください）。
    どの auth profile がアクティブかは `/model status` で確認できます。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.5、コーディングには Codex 5.5 を使えますか？">
    はい。1 つをデフォルトに設定し、必要に応じて切り替えてください。

    - **クイック切り替え（セッション単位）:** 現在の direct OpenAI API-key タスクには `/model openai/gpt-5.4`、GPT-5.5 Codex OAuth タスクには `/model openai-codex/gpt-5.5` を使います。
    - **デフォルト:** API-key 利用には `agents.defaults.model.primary` を `openai/gpt-5.4` に、GPT-5.5 Codex OAuth 利用には `openai-codex/gpt-5.5` に設定します。
    - **Sub-agents:** コーディングタスクを、異なるデフォルトモデルを持つ sub-agent にルーティングします。

    `openai/gpt-5.5` への direct API-key アクセスは、OpenAI が
    GPT-5.5 を公開 API で有効化すればサポートされます。それまでは GPT-5.5 は subscription/OAuth 専用です。

    [Models](/ja-JP/concepts/models) と [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の fast mode はどう設定しますか？">
    セッショントグルまたは config デフォルトのどちらかを使ってください。

    - **セッション単位:** セッションが `openai/gpt-5.4` または `openai-codex/gpt-5.5` を使っている間に `/fast on` を送信します。
    - **モデル単位のデフォルト:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` または `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` を `true` に設定します。

    例:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI では、fast mode はサポートされるネイティブ Responses request で `service_tier = "priority"` に対応します。セッションの `/fast` 上書きは config デフォルトより優先されます。

    [Thinking and fast mode](/ja-JP/tools/thinking) と [OpenAI fast mode](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示されて返信が来ないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` と
    セッション上書きの**allowlist**になります。その一覧にないモデルを選ぶと次が返されます。

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    このエラーは通常の返信の**代わりに**返されます。修正方法は、モデルを
    `agents.defaults.models` に追加する、allowlist を削除する、または `/model list` からモデルを選ぶことです。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは**プロバイダーが設定されていない**ことを意味します（MiniMax の provider config または auth
    profile が見つからない）ので、モデルを解決できません。

    修正チェックリスト:

    1. 現行の OpenClaw リリースにアップグレードする（または source の `main` から実行する）その後 gateway を再起動する。
    2. MiniMax が設定されていること（ウィザードまたは JSON）、または MiniMax の auth
       が env/auth profile に存在していて、一致するプロバイダーを注入できることを確認する
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証経路に対して正確な model id（大文字小文字を区別）を使う:
       API-key
       セットアップには `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth セットアップには
       `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します:

       ```bash
       openclaw models list
       ```

       そして一覧から選んでください（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [Models](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**にし、必要なときに**セッション単位**でモデルを切り替えてください。
    フォールバックは**エラー**用であり、「難しいタスク」用ではないため、`/model` または別エージェントを使ってください。

    **オプション A: セッション単位で切り替える**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    その後:

    ```
    /model gpt
    ```

    **オプション B: 別エージェントを使う**

    - エージェント A のデフォルト: MiniMax
    - エージェント B のデフォルト: OpenAI
    - エージェントごとにルーティングするか、`/agent` で切り替える

    ドキュメント: [Models](/ja-JP/concepts/models), [Multi-Agent Routing](/ja-JP/concepts/multi-agent), [MiniMax](/ja-JP/providers/minimax), [OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト shorthand が同梱されています（`agents.defaults.models` にそのモデルが存在する場合のみ適用されます）。

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → API-key セットアップでは `openai/gpt-5.4`、Codex OAuth 用に設定されている場合は `openai-codex/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    同じ名前で独自のエイリアスを設定した場合は、あなたの値が優先されます。

  </Accordion>

  <Accordion title="モデルショートカット（エイリアス）を定義/上書きするにはどうすればいいですか？">
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

    その後 `/model sonnet`（またはサポートされる場合は `/<alias>`）で、その model ID に解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI のような他のプロバイダーのモデルを追加するにはどうすればいいですか？">
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

    provider/model を参照しているのに必要な provider key がない場合、ランタイム auth エラーになります（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後に No API key found for provider が出る**

    これは通常、**新しいエージェント**の auth store が空であることを意味します。auth はエージェント単位で、
    次に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に auth を設定する。
    - または、メインエージェントの `agentDir` にある `auth-profiles.json` を、新しいエージェントの `agentDir` にコピーする。

    複数のエージェント間で `agentDir` を再利用してはいけません。auth/セッション衝突の原因になります。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「All models failed」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどう動きますか？">
    フェイルオーバーは 2 段階で起こります。

    1. 同じ provider 内での **auth profile ローテーション**
    2. `agents.defaults.model.fallbacks` 内の次モデルへの **モデルフォールバック**

    失敗中の profile にはクールダウン（指数バックオフ）が適用されるため、provider がレート制限中、または一時的に失敗していても、OpenClaw は応答を続けられます。

    レート制限バケットには、単なる `429` 応答以上のものが含まれます。OpenClaw
    は `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`、および
    定期的な使用量ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも、
    フェイルオーバーに値するレート制限として扱います。

    一見課金エラーに見える応答の中には `402` でないものもあり、HTTP `402`
    応答の一部もこの一時的バケットに残ります。provider が
    `401` または `403` で明示的な課金テキストを返した場合、OpenClaw はそれを
    課金レーンに留めることもできますが、provider 固有のテキストマッチャーはその
    provider にスコープされたままです（たとえば OpenRouter の `Key limit exceeded`）。逆に `402`
    メッセージが再試行可能な使用量ウィンドウや
    organization/workspace の spend limit（`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`）のように見える場合、OpenClaw はそれを
    長期的な課金停止ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは別扱いです。たとえば
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, `ollama error: context length
    exceeded` といったシグネチャは、モデルフォールバックに進まず、compaction/再試行パスに残ります。

    汎用的なサーバーエラーテキストは、意図的に「unknown/error を含むもの全部」より狭くしています。OpenClaw は
    Anthropic の bare な `An unknown error occurred`、OpenRouter の bare
    `Provider returned error`、`Unhandled stop reason:
    error` のような stop-reason エラー、JSON の `api_error` payload に含まれる一時的サーバーテキスト
    （`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`）、および `ModelNotReadyException` のような provider-busy エラーを、
    provider コンテキストが一致する場合に、フェイルオーバーに値する timeout/過負荷シグナルとして扱います。
    一方で、`LLM request failed with an unknown
    error.` のような一般的な内部フォールバックテキストは保守的に扱われ、それ単体ではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title='「No credentials found for profile anthropic:default」とは何ですか？'>
    これは、システムが auth profile ID `anthropic:default` を使おうとしたが、期待される auth store にその認証情報が見つからなかったことを意味します。

    **修正チェックリスト:**

    - **auth profile の保存場所を確認する**（新旧パス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - 旧式: `~/.openclaw/agent/*`（`openclaw doctor` により移行されます）
    - **env var が Gateway に読み込まれていることを確認する**
      - `ANTHROPIC_API_KEY` をシェルに設定しても、Gateway を systemd/launchd 経由で実行している場合、それを継承しないことがあります。`~/.openclaw/.env` に置くか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルがありえます。
    - **モデル/auth 状態をざっと確認する**
      - `openclaw models status` を使って、設定済みモデルと provider が認証済みかどうかを確認してください。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、その実行が Anthropic auth profile に pin されているが、Gateway
    が auth store 内にそれを見つけられないことを意味します。

    - **Claude CLI を使う**
      - gateway ホスト上で `openclaw models auth login --provider anthropic --method cli --set-default` を実行する。
    - **代わりに API key を使いたい場合**
      - **gateway ホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れる。
      - 不足している profile を強制する pin 済み order をクリアする:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **gateway ホスト上でコマンドを実行していることを確認する**
      - remote mode では、auth profile はラップトップではなく gateway マシン上にあります。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか？">
    model config に Google Gemini がフォールバックとして含まれている場合（または Gemini shorthand に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試します。Google 認証情報を設定していない場合、`No API key found for provider "google"` が表示されます。

    修正: Google auth を提供するか、`agents.defaults.model.fallbacks` / エイリアスから Google モデルを削除または回避して、フォールバックがそちらに向かわないようにしてください。

    **LLM request rejected: thinking signature required（Google Antigravity）**

    原因: セッション履歴に**署名のない thinking block** が含まれています（多くの場合、
    中断/部分的なストリームから発生します）。Google Antigravity は thinking block に署名を要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 用に署名なし thinking block を除去します。それでも発生する場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## Auth profile: それが何か、そしてどう管理するか

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、token 保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="auth profile とは何ですか？">
    auth profile は、provider に紐付いた名前付きの認証情報レコード（OAuth または API key）です。profile は次に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="典型的な profile ID は何ですか？">
    OpenClaw は次のような provider 接頭辞付き ID を使います。

    - `anthropic:default`（メール identity がない場合によく使われる）
    - OAuth identity には `anthropic:<email>`
    - 自分で選ぶカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="どの auth profile を最初に試すか制御できますか？">
    はい。config は profile の任意メタデータと provider ごとの順序（`auth.order.<provider>`）をサポートします。これはシークレット自体は保存せず、ID を provider/mode に対応付け、ローテーション順序を設定します。

    OpenClaw は、短い **cooldown**（レート制限/timeout/auth failure）または、より長い **disabled** 状態（課金/クレジット不足）にある profile を一時的にスキップすることがあります。これを確認するには `openclaw models status --json` を実行し、`auth.unusableProfiles` を見てください。調整項目: `auth.cooldowns.billingBackoffHours*`。

    レート制限クールダウンはモデル単位にできる場合があります。1 つの provider 上で 1 つのモデルに対してクールダウン中の profile でも、その provider 上の兄弟モデルにはまだ使えることがあります。一方、課金/disabled ウィンドウは profile 全体をブロックします。

    CLI から **エージェント単位** の順序上書き（そのエージェントの `auth-state.json` に保存）を設定することもできます。

    ```bash
    # 設定済みのデフォルトエージェントが対象（--agent を省略）
    openclaw models auth order get --provider anthropic

    # ローテーションを単一 profile に固定する（これだけを試す）
    openclaw models auth order set --provider anthropic anthropic:default

    # または明示的な順序を設定する（provider 内フォールバック）
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # 上書きをクリアする（config auth.order / round-robin に戻す）
    openclaw models auth order clear --provider anthropic
    ```

    特定のエージェントを対象にするには:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    実際に何が試されるかを確認するには、次を使ってください。

    ```bash
    openclaw models status --probe
    ```

    保存済み profile が明示的な順序から外れている場合、probe は
    その profile を黙って試すのではなく `excluded_by_auth_order` と報告します。

  </Accordion>

  <Accordion title="OAuth と API key の違いは何ですか？">
    OpenClaw は両方をサポートします。

    - **OAuth** は、該当する場合、サブスクリプションアクセスを活用することがよくあります。
    - **API key** は従量課金を使います。

    ウィザードは Anthropic Claude CLI、OpenAI Codex OAuth、API keys を明示的にサポートしています。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — quick start and first-run setup](/ja-JP/help/faq-first-run)
- [Model selection](/ja-JP/concepts/model-providers)
- [Model failover](/ja-JP/concepts/model-failover)
