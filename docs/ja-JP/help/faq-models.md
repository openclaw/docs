---
read_when:
    - モデルの選択または切り替え、エイリアスの設定
    - モデルフェイルオーバー / 「すべてのモデルが失敗しました」のデバッグ
    - 認証プロファイルとその管理方法を理解する
sidebarTitle: Models FAQ
summary: 'FAQ: モデルのデフォルト、選択、エイリアス、切り替え、フェイルオーバー、認証プロファイル'
title: 'よくある質問: モデルと認証'
x-i18n:
    generated_at: "2026-05-10T19:38:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62ff4ee6f455e9b8786d79b71dc9be53e650afbe177e3d467665aa407cadfdfd
    source_path: help/faq-models.md
    workflow: 16
---

  モデルと認証プロファイルのQ&A。セットアップ、セッション、Gateway、チャネル、
  トラブルシューティングについては、メインの [FAQ](/ja-JP/help/faq) を参照してください。

  ## モデル: デフォルト、選択、エイリアス、切り替え

  <AccordionGroup>
  <Accordion title='「デフォルトモデル」とは何ですか？'>
    OpenClaw のデフォルトモデルは、次で設定したものです。

    ```
    agents.defaults.model.primary
    ```

    モデルは `provider/model` として参照されます（例: `openai/gpt-5.5` または `anthropic/claude-sonnet-4-6`）。プロバイダーを省略すると、OpenClaw はまずエイリアスを試し、次にその正確なモデルIDに一致する一意の設定済みプロバイダーを試し、その後にのみ非推奨の互換パスとして設定済みのデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みのデフォルトモデルをもう公開していない場合、OpenClaw は古くなった削除済みプロバイダーのデフォルトを表示するのではなく、最初に設定されたプロバイダー/モデルにフォールバックします。それでも `provider/model` は**明示的に**設定するべきです。

  </Accordion>

  <Accordion title="どのモデルを推奨しますか？">
    **推奨デフォルト:** プロバイダースタックで利用可能な最も強力な最新世代モデルを使用してください。
    **ツール有効または信頼できない入力を扱うエージェント:** コストよりモデルの強さを優先してください。
    **日常的/低リスクのチャット:** 安価なフォールバックモデルを使用し、エージェントロールでルーティングしてください。

    MiniMax には独自のドキュメントがあります: [MiniMax](/ja-JP/providers/minimax) と
    [ローカルモデル](/ja-JP/gateway/local-models)。

    目安: 高リスクの作業には**予算内で最良のモデル**を使い、日常的なチャットや要約には安価な
    モデルを使います。エージェントごとにモデルをルーティングでき、サブエージェントを使って
    長いタスクを並列化できます（各サブエージェントはトークンを消費します）。[モデル](/ja-JP/concepts/models) と
    [サブエージェント](/ja-JP/tools/subagents) を参照してください。

    強い警告: 弱いモデルや過度に量子化されたモデルは、プロンプト
    インジェクションや安全でない動作に対してより脆弱です。[セキュリティ](/ja-JP/gateway/security) を参照してください。

    詳細な背景: [モデル](/ja-JP/concepts/models)。

  </Accordion>

  <Accordion title="設定を消さずにモデルを切り替えるには？">
    **モデルコマンド**を使うか、**model** フィールドだけを編集してください。設定全体の置き換えは避けてください。

    安全な選択肢:

    - チャット内の `/model`（素早い、セッション単位）
    - `openclaw models set ...`（モデル設定だけを更新）
    - `openclaw configure --section model`（対話式）
    - `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

    設定全体を置き換える意図がない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
    RPC編集では、まず `config.schema.lookup` で確認し、`config.patch` を優先してください。lookup ペイロードには、正規化されたパス、浅いスキーマドキュメント/制約、直接の子要素の概要が含まれます。
    部分更新向けです。
    設定を上書きしてしまった場合は、バックアップから復元するか、`openclaw doctor` を再実行して修復してください。

    ドキュメント: [モデル](/ja-JP/concepts/models)、[設定](/ja-JP/cli/configure)、[Config](/ja-JP/cli/config)、[Doctor](/ja-JP/gateway/doctor)。

  </Accordion>

  <Accordion title="セルフホストモデル（llama.cpp、vLLM、Ollama）は使えますか？">
    はい。ローカルモデルでは Ollama が最も簡単な方法です。

    最短セットアップ:

    1. `https://ollama.com/download` から Ollama をインストールする
    2. `ollama pull gemma4` などでローカルモデルを取得する
    3. クラウドモデルも使いたい場合は、`ollama signin` を実行する
    4. `openclaw onboard` を実行して `Ollama` を選ぶ
    5. `Local` または `Cloud + Local` を選ぶ

    注記:

    - `Cloud + Local` ではクラウドモデルに加えてローカルの Ollama モデルを使えます
    - `kimi-k2.5:cloud` などのクラウドモデルはローカル取得を必要としません
    - 手動で切り替えるには、`openclaw models list` と `openclaw models set ollama/<model>` を使ってください

    セキュリティ上の注意: 小さいモデルや大きく量子化されたモデルは、プロンプト
    インジェクションに対してより脆弱です。ツールを使えるボットには**大規模モデル**を強く推奨します。
    それでも小さいモデルを使う場合は、サンドボックス化と厳格なツール許可リストを有効にしてください。

    ドキュメント: [Ollama](/ja-JP/providers/ollama)、[ローカルモデル](/ja-JP/gateway/local-models)、
    [モデルプロバイダー](/ja-JP/concepts/model-providers)、[セキュリティ](/ja-JP/gateway/security)、
    [サンドボックス化](/ja-JP/gateway/sandboxing)。

  </Accordion>

  <Accordion title="OpenClaw、Flawd、Krill はモデルに何を使っていますか？">
    - これらのデプロイは異なる場合があり、時間とともに変わる可能性があります。固定のプロバイダー推奨はありません。
    - 各 Gateway で `openclaw models status` を使い、現在のランタイム設定を確認してください。
    - セキュリティに敏感な、またはツール有効のエージェントには、利用可能な最も強力な最新世代モデルを使ってください。

  </Accordion>

  <Accordion title="再起動せずにその場でモデルを切り替えるには？">
    `/model` コマンドを単独メッセージとして使います。

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

    プロバイダーの特定の認証プロファイルを強制することもできます（セッション単位）。

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    ヒント: `/model status` では、どのエージェントがアクティブか、どの `auth-profiles.json` ファイルが使われているか、次にどの認証プロファイルが試されるかが表示されます。
    利用可能な場合は、設定済みのプロバイダーエンドポイント（`baseUrl`）とAPIモード（`api`）も表示されます。

    **@profile で設定したプロファイルの固定を解除するには？**

    `@profile` サフィックス**なし**で `/model` を再実行します。

    ```
    /model anthropic/claude-opus-4-6
    ```

    デフォルトに戻したい場合は、`/model` から選ぶか、`/model <default provider/model>` を送信してください。
    どの認証プロファイルがアクティブかを確認するには `/model status` を使ってください。

  </Accordion>

  <Accordion title="日常タスクには GPT 5.5、コーディングには Codex 5.5 を使えますか？">
    はい。モデル選択とランタイム選択は別々に扱ってください。

    - **ネイティブ Codex コーディングエージェント:** `agents.defaults.model.primary` を `openai/gpt-5.5` に設定します。ChatGPT/Codex サブスクリプション認証を使いたい場合は、`openclaw models auth login --provider openai-codex` でサインインします。
    - **エージェントループ外の直接 OpenAI API タスク:** 画像、埋め込み、音声、リアルタイム、その他の非エージェント OpenAI API サーフェスには `OPENAI_API_KEY` を設定します。
    - **OpenAI エージェントAPIキー認証:** 順序付きの `openai-codex` APIキープロファイルで `/model openai/gpt-5.5` を使います。
    - **サブエージェント:** コーディングタスクを、独自の `openai/gpt-5.5` モデルを持つ Codex 重視のエージェントにルーティングします。

    [モデル](/ja-JP/concepts/models) と [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

  </Accordion>

  <Accordion title="GPT 5.5 の高速モードを設定するには？">
    セッショントグルまたは設定デフォルトのどちらかを使います。

    - **セッション単位:** セッションが `openai/gpt-5.5` を使っている間に `/fast on` を送信します。
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

    OpenAI では、高速モードは対応するネイティブ Responses リクエストで `service_tier = "priority"` に対応します。セッションの `/fast` オーバーライドは設定デフォルトより優先されます。

    [Thinking と高速モード](/ja-JP/tools/thinking) と [OpenAI 高速モード](/ja-JP/providers/openai#fast-mode) を参照してください。

  </Accordion>

  <Accordion title='「Model ... is not allowed」と表示され、その後返信がないのはなぜですか？'>
    `agents.defaults.models` が設定されている場合、それは `/model` と任意の
    セッションオーバーライドの**許可リスト**になります。そのリストにないモデルを選ぶと、次が返されます。

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    このエラーは通常の返信の**代わりに**返されます。修正: 正確なモデルを
    `agents.defaults.models` に追加する、動的なプロバイダーカタログ向けに `"provider/*": {}` のようなプロバイダーワイルドカードを追加する、許可リストを削除する、または `/model list` からモデルを選んでください。
    コマンドに `--runtime codex` も含まれていた場合は、まず許可リストを更新してから、同じ
    `/model provider/model --runtime codex` コマンドを再試行してください。

  </Accordion>

  <Accordion title='「Unknown model: minimax/MiniMax-M2.7」と表示されるのはなぜですか？'>
    これは**プロバイダーが設定されていない**ことを意味します（MiniMax プロバイダー設定または認証
    プロファイルが見つからなかったため）、モデルを解決できません。

    修正チェックリスト:

    1. 現在の OpenClaw リリースにアップグレードする（またはソースの `main` から実行する）し、その後 Gateway を再起動する。
    2. MiniMax が設定されていること（ウィザードまたはJSON）、または一致するプロバイダーを注入できるように MiniMax 認証
       が env/認証プロファイルに存在することを確認する
       （`minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または保存済み MiniMax
       OAuth）。
    3. 認証パスに合った正確なモデルID（大文字小文字を区別）を使う:
       APIキー
       セットアップでは `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`、OAuth セットアップでは `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`。
    4. 次を実行します。

       ```bash
       openclaw models list
       ```

       そして一覧から選択します（またはチャット内で `/model list`）。

    [MiniMax](/ja-JP/providers/minimax) と [モデル](/ja-JP/concepts/models) を参照してください。

  </Accordion>

  <Accordion title="MiniMax をデフォルトにして、複雑なタスクには OpenAI を使えますか？">
    はい。**MiniMax をデフォルト**として使い、必要に応じて**セッション単位**でモデルを切り替えてください。
    フォールバックは**エラー**用であり、「難しいタスク」用ではないため、`/model` または別のエージェントを使ってください。

    **オプションA: セッション単位で切り替える**

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

    **オプションB: 別々のエージェント**

    - エージェントAのデフォルト: MiniMax
    - エージェントBのデフォルト: OpenAI
    - エージェントでルーティングするか、`/agent` を使って切り替える

    ドキュメント: [モデル](/ja-JP/concepts/models)、[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)、[MiniMax](/ja-JP/providers/minimax)、[OpenAI](/ja-JP/providers/openai)。

  </Accordion>

  <Accordion title="opus / sonnet / gpt は組み込みショートカットですか？">
    はい。OpenClaw にはいくつかのデフォルト短縮名が同梱されています（モデルが `agents.defaults.models` に存在する場合にのみ適用されます）。

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

  <Accordion title="モデルショートカット（エイリアス）を定義/上書きするには？">
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

    その後、`/model sonnet`（またはサポートされている場合は `/<alias>`）はそのモデルIDに解決されます。

  </Accordion>

  <Accordion title="OpenRouter や Z.AI など他のプロバイダーのモデルを追加するには？">
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

    provider/モデルを参照しているが、必要な provider キーがない場合は、ランタイム認証エラーが発生します（例: `No API key found for provider "zai"`）。

    **新しいエージェントを追加した後に provider の API キーが見つからない**

    これは通常、**新しいエージェント**の認証ストアが空であることを意味します。認証はエージェントごとに管理され、次の場所に保存されます。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    修正方法:

    - `openclaw agents add <id>` を実行し、ウィザード中に認証を設定します。
    - または、メインエージェントの認証ストアから、新しいエージェントの認証ストアへ、移植可能な静的 `api_key` / `token` プロファイルだけをコピーします。
    - OAuth プロファイルでは、新しいエージェントに独自アカウントが必要な場合はそのエージェントからサインインします。そうでない場合、OpenClaw はリフレッシュトークンを複製せずに、デフォルト/メインエージェントを読み取り先として利用できます。

    エージェント間で `agentDir` を再利用しないでください。認証/セッションの衝突が発生します。

  </Accordion>
</AccordionGroup>

## モデルフェイルオーバーと「すべてのモデルが失敗しました」

<AccordionGroup>
  <Accordion title="フェイルオーバーはどのように動作しますか？">
    フェイルオーバーは 2 段階で発生します。

    1. 同じ provider 内での**認証プロファイルのローテーション**。
    2. `agents.defaults.model.fallbacks` 内の次のモデルへの**モデルフォールバック**。

    失敗したプロファイルにはクールダウン（指数バックオフ）が適用されるため、provider がレート制限中または一時的に失敗している場合でも、OpenClaw は応答を継続できます。

    レート制限バケットには、単純な `429` レスポンスだけでなく、さらに多くのものが含まれます。OpenClaw は、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、`resource exhausted`、および周期的な使用量ウィンドウ制限（`weekly/monthly limit reached`）のようなメッセージも、フェイルオーバー対象のレート制限として扱います。

    請求に見えるレスポンスの一部は `402` ではなく、HTTP `402` レスポンスの一部もその一時的なバケットに残ります。provider が `401` または `403` で明示的な請求関連テキストを返す場合、OpenClaw はそれを請求レーンに保持できますが、provider 固有のテキストマッチャーは、それを所有する provider にスコープされます（例: OpenRouter `Key limit exceeded`）。代わりに `402` メッセージが、再試行可能な使用量ウィンドウまたは組織/ワークスペースの支出上限（`daily limit reached, resets tomorrow`、`organization spending limit exceeded`）のように見える場合、OpenClaw はそれを長期の請求無効化ではなく `rate_limit` として扱います。

    コンテキストオーバーフローエラーは別です。`request_too_large`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、または `ollama error: context length exceeded` のようなシグネチャは、モデルフォールバックへ進まず、Compaction/再試行パスに残ります。

    汎用的なサーバーエラーテキストは、「unknown/error を含むすべてのもの」よりも意図的に狭くしています。OpenClaw は、provider コンテキストが一致する場合、Anthropic の素の `An unknown error occurred`、OpenRouter の素の `Provider returned error`、`Unhandled stop reason: error` のような停止理由エラー、一時的なサーバーテキスト（`internal server error`、`unknown error, 520`、`upstream error`、`backend error`）を含む JSON `api_error` ペイロード、および `ModelNotReadyException` のような provider 混雑エラーを、フェイルオーバー対象のタイムアウト/過負荷シグナルとして扱います。
    `LLM request failed with an unknown error.` のような汎用的な内部フォールバックテキストは保守的に扱われ、それだけではモデルフォールバックをトリガーしません。

  </Accordion>

  <Accordion title="「No credentials found for profile anthropic:default」は何を意味しますか？">
    これは、システムが認証プロファイル ID `anthropic:default` を使用しようとしたが、想定される認証ストア内でその認証情報を見つけられなかったことを意味します。

    **修正チェックリスト:**

    - **認証プロファイルの場所を確認する**（新しいパスとレガシーパス）
      - 現在: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - レガシー: `~/.openclaw/agent/*`（`openclaw doctor` によって移行）
    - **環境変数が Gateway に読み込まれていることを確認する**
      - シェルで `ANTHROPIC_API_KEY` を設定していても、systemd/launchd 経由で Gateway を実行している場合、それを継承しないことがあります。`~/.openclaw/.env` に入れるか、`env.shellEnv` を有効にしてください。
    - **正しいエージェントを編集していることを確認する**
      - マルチエージェント構成では、複数の `auth-profiles.json` ファイルが存在する可能性があります。
    - **モデル/認証ステータスを健全性チェックする**
      - `openclaw models status` を使用して、設定済みモデルと provider が認証済みかどうかを確認します。

    **「No credentials found for profile anthropic」の修正チェックリスト**

    これは、実行が Anthropic 認証プロファイルに固定されているが、Gateway がその認証ストア内で見つけられないことを意味します。

    - **Claude CLI を使用する**
      - Gateway ホストで `openclaw models auth login --provider anthropic --method cli --set-default` を実行します。
    - **代わりに API キーを使用したい場合**
      - **Gateway ホスト**上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を入れます。
      - 見つからないプロファイルを強制する固定順序をクリアします。

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Gateway ホスト上でコマンドを実行していることを確認する**
      - リモートモードでは、認証プロファイルはラップトップではなく Gateway マシン上に存在します。

  </Accordion>

  <Accordion title="なぜ Google Gemini も試して失敗したのですか？">
    モデル設定に Google Gemini がフォールバックとして含まれている場合（または Gemini の短縮表記に切り替えた場合）、OpenClaw はモデルフォールバック中にそれを試します。Google の認証情報を設定していない場合は、`No API key found for provider "google"` が表示されます。

    修正: Google 認証を提供するか、フォールバックがそこにルーティングされないように、`agents.defaults.model.fallbacks` / エイリアスから Google モデルを削除または回避します。

    **LLM リクエストが拒否されました: thinking signature が必要です（Google Antigravity）**

    原因: セッション履歴に**シグネチャのない thinking ブロック**が含まれています（多くの場合、中断された/部分的なストリームに由来します）。Google Antigravity は thinking ブロックにシグネチャを要求します。

    修正: OpenClaw は現在、Google Antigravity Claude 向けに未署名の thinking ブロックを取り除きます。それでも表示される場合は、**新しいセッション**を開始するか、そのエージェントで `/thinking off` を設定してください。

  </Accordion>
</AccordionGroup>

## 認証プロファイル: その概要と管理方法

関連: [/concepts/oauth](/ja-JP/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントパターン）

<AccordionGroup>
  <Accordion title="認証プロファイルとは何ですか？">
    認証プロファイルは、provider に紐づく名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次の場所にあります。

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    シークレットを出力せずに保存済みプロファイルを調べるには、`openclaw models auth list`（必要に応じて `--provider <id>` または `--json`）を実行します。詳細は [Models CLI](/ja-JP/cli/models#auth-profiles) を参照してください。

  </Accordion>

  <Accordion title="典型的なプロファイル ID は何ですか？">
    OpenClaw は次のような provider プレフィックス付き ID を使用します。

    - `anthropic:default`（メール ID が存在しない場合によく使われます）
    - OAuth ID 用の `anthropic:<email>`
    - 選択したカスタム ID（例: `anthropic:work`）

  </Accordion>

  <Accordion title="どの認証プロファイルを最初に試すか制御できますか？">
    はい。設定では、プロファイル用の任意のメタデータと、provider ごとの順序（`auth.order.<provider>`）をサポートします。これはシークレットを保存しません。ID を provider/モードにマップし、ローテーション順序を設定します。

    OpenClaw は、プロファイルが短い**クールダウン**（レート制限/タイムアウト/認証失敗）または長い**無効化**状態（請求/クレジット不足）にある場合、一時的にそのプロファイルをスキップすることがあります。これを調べるには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認します。調整: `auth.cooldowns.billingBackoffHours*`。

    レート制限クールダウンはモデルにスコープできます。あるモデルでクールダウン中のプロファイルでも、同じ provider 上の兄弟モデルでは引き続き使用できる場合があります。一方で、請求/無効化ウィンドウはプロファイル全体を引き続きブロックします。

    CLI を使用して、**エージェントごとの**順序オーバーライド（そのエージェントの `auth-state.json` に保存）も設定できます。

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

    実際に何が試されるかを確認するには、次を使用します。

    ```bash
    openclaw models status --probe
    ```

    保存済みプロファイルが明示的な順序から省略されている場合、probe はそのプロファイルを黙って試すのではなく、`excluded_by_auth_order` を報告します。

  </Accordion>

  <Accordion title="OAuth と API キーの違いは何ですか？">
    OpenClaw は両方をサポートします。

    - **OAuth** は多くの場合、サブスクリプションアクセスを活用します（該当する場合）。
    - **API キー** はトークンごとの従量課金を使用します。

    ウィザードは、Anthropic Claude CLI、OpenAI Codex OAuth、および API キーを明示的にサポートします。

  </Accordion>
</AccordionGroup>

## 関連

- [FAQ](/ja-JP/help/faq) — メイン FAQ
- [FAQ — クイックスタートと初回実行セットアップ](/ja-JP/help/faq-first-run)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
