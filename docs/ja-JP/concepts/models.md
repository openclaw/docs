---
read_when:
    - models CLI の追加または変更 (models list/set/scan/aliases/fallbacks)
    - モデルのフォールバック動作または選択UXの変更
    - モデルスキャンプローブの更新 (ツール/画像)
sidebarTitle: Models CLI
summary: 'モデル CLI: list、set、aliases、fallbacks、scan、status'
title: モデル CLI
x-i18n:
    generated_at: "2026-05-10T19:31:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b4d473b9b437e213f8cd2b40cf0ae6000d8fb4a8fa3522813e14659cecc5450
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="モデルフェイルオーバー" href="/ja-JP/concepts/model-failover">
    認証プロファイルのローテーション、クールダウン、それらがフォールバックとどう相互作用するか。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers">
    プロバイダーの簡単な概要と例。
  </Card>
  <Card title="エージェントランタイム" href="/ja-JP/concepts/agent-runtimes">
    PI、Codex、その他のエージェントループランタイム。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults">
    モデル設定キー。
  </Card>
</CardGroup>

モデル参照はプロバイダーとモデルを選択します。通常、低レベルのエージェントランタイムは選択しません。OpenAI エージェント参照が主な例外です。公式 OpenAI プロバイダーでは、`openai/gpt-5.5` はデフォルトで Codex アプリサーバーランタイムを通じて実行されます。明示的なランタイム上書きは、エージェントやセッション全体ではなく、プロバイダー/モデルポリシーに属します。Codex ランタイムモードでは、`openai/gpt-*` 参照は API キー課金を意味しません。認証は Codex アカウントまたは `openai-codex` 認証プロファイルから取得できます。[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

## モデル選択の仕組み

OpenClaw は次の順序でモデルを選択します。

<Steps>
  <Step title="プライマリモデル">
    `agents.defaults.model.primary`（または `agents.defaults.model`）。
  </Step>
  <Step title="フォールバック">
    `agents.defaults.model.fallbacks`（順番どおり）。
  </Step>
  <Step title="プロバイダー認証フェイルオーバー">
    認証フェイルオーバーは、次のモデルへ移る前にプロバイダー内で発生します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="関連するモデルサーフェス">
    - `agents.defaults.models` は、OpenClaw が使用できるモデル（およびエイリアス）の許可リスト/カタログです。プロバイダー検出を動的に保ちながら表示プロバイダーを制限するには、`provider/*` エントリを使用します。
    - `agents.defaults.imageModel` は、プライマリモデルが画像を受け付けられない場合**にのみ**使用されます。
    - `agents.defaults.pdfModel` は `pdf` ツールで使用されます。省略した場合、このツールは `agents.defaults.imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
    - `agents.defaults.imageGenerationModel` は共有画像生成機能で使用されます。省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - `agents.defaults.musicGenerationModel` は共有音楽生成機能で使用されます。省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - `agents.defaults.videoGenerationModel` は共有動画生成機能で使用されます。省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - エージェントごとのデフォルトは、`agents.list[].model` とバインディングにより `agents.defaults.model` を上書きできます（[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照）。

  </Accordion>
</AccordionGroup>

## 選択元とフォールバック動作

同じ `provider/model` でも、その由来によって意味が異なる場合があります。

- 設定済みデフォルト（`agents.defaults.model.primary` とエージェント固有のプライマリ）は通常の開始点であり、`agents.defaults.model.fallbacks` を使用します。
- 自動フォールバック選択は一時的な復旧状態です。これらは `modelOverrideSource: "auto"` とともに保存されるため、後続のターンでは、既知の不良プライマリを最初に試さずにフォールバックチェーンを使い続けられます。
- ユーザーのセッション選択は厳密です。`/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を保存します。選択されたプロバイダー/モデルに到達できない場合、OpenClaw は別の設定済みモデルへフォールスルーするのではなく、目に見える形で失敗します。
- Cron の `--model` / ペイロード `model` はジョブごとのプライマリです。ジョブが明示的なペイロード `fallbacks` を指定しない限り、設定済みフォールバックを引き続き使用します（厳密な cron 実行には `fallbacks: []` を使用します）。
- CLI のデフォルトモデルと許可リストのピッカーは、完全な組み込みカタログを読み込むのではなく、明示的な `models.providers.*.models` を列挙することで `models.mode: "replace"` を尊重します。
- Control UI のモデルピッカーは、Gateway に設定済みモデルビューを問い合わせます。存在する場合は、プロバイダー全体の `provider/*` エントリを含む `agents.defaults.models` を使用し、それ以外の場合は、明示的な `models.providers.*.models` と利用可能な認証を持つプロバイダーを使用します。完全な組み込みカタログは、`view: "all"` を指定した `models.list` や `openclaw models list --all` など、明示的な参照ビュー用に予約されています。

## クイックモデルポリシー

- プライマリには、利用可能な最新世代の最強モデルを設定します。
- コスト/レイテンシに敏感なタスクや低リスクのチャットにはフォールバックを使用します。
- ツール対応エージェントや信頼できない入力では、古い/弱いモデル階層を避けます。

## オンボーディング（推奨）

設定を手動編集したくない場合は、オンボーディングを実行します。

```bash
openclaw onboard
```

これにより、**OpenAI Code (Codex) サブスクリプション**（OAuth）や **Anthropic**（API キーまたは Claude CLI）を含む一般的なプロバイダーのモデル + 認証を設定できます。

## 設定キー（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + プロバイダーパラメーター + `provider/*` 動的プロバイダーエントリ）
- `models.providers`（`models.json` に書き込まれるカスタムプロバイダー）

<Note>
モデル参照は小文字に正規化されます。`z.ai/*` のようなプロバイダーエイリアスは `zai/*` に正規化されます。

OpenCode を含むプロバイダー設定例は [OpenCode](/ja-JP/providers/opencode) にあります。
</Note>

### 安全な許可リスト編集

`agents.defaults.models` を手動で更新するときは、追加型の書き込みを使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="上書き保護ルール">
    `openclaw config set` は、モデル/プロバイダーマップを偶発的な上書きから保護します。`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` への単純なオブジェクト代入は、既存エントリを削除することになる場合、拒否されます。追加変更には `--merge` を使用し、指定した値を完全な対象値にする必要がある場合にのみ `--replace` を使用します。

    対話型プロバイダー設定と `openclaw configure --section model` も、プロバイダー範囲の選択を既存の許可リストにマージするため、Codex、Ollama、または別のプロバイダーを追加しても、無関係なモデルエントリは削除されません。プロバイダー認証を再適用するとき、Configure は既存の `agents.defaults.model.primary` を保持します。`openclaw models auth login --provider <id> --set-default` や `openclaw models set <model>` などの明示的なデフォルト設定コマンドは、引き続き `agents.defaults.model.primary` を置き換えます。

  </Accordion>
</AccordionGroup>

## 「Model is not allowed」（および返信が止まる理由）

`agents.defaults.models` が設定されている場合、それは `/model` とセッション上書きの**許可リスト**になります。ユーザーがその許可リストにないモデルを選択すると、OpenClaw は次を返します。

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
これは通常の返信が生成される**前に**発生するため、メッセージが「応答しなかった」ように感じられることがあります。修正方法は次のいずれかです。

- モデルを `agents.defaults.models` に追加する、または
- 許可リストをクリアする（`agents.defaults.models` を削除する）、または
- `/model list` からモデルを選択する。

</Warning>

拒否されたコマンドに `/model openai/gpt-5.5 --runtime codex` のようなランタイム上書きが含まれていた場合は、まず許可リストを修正し、その後、同じ `/model ... --runtime ...` コマンドを再試行してください。ネイティブ Codex 実行でも、選択されるモデルは引き続き `openai/gpt-5.5` です。`codex` ランタイムはハーネスを選択し、Codex 認証を別途使用します。

ローカル/GGUF モデルでは、許可リストに完全なプロバイダー接頭辞付き参照を保存します。
たとえば `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`、または
`openclaw models list --provider <provider>` に表示される正確な
プロバイダー/モデルを使用します。許可リストが有効な場合、裸のローカルファイル名や表示名だけでは不十分です。

すべてのモデルを手動で列挙せずにプロバイダーを制限したい場合は、
`provider/*` エントリを `agents.defaults.models` に追加します。

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

このポリシーでは、`/model`、`/models`、モデルピッカーは、それらのプロバイダーのみについて検出済みカタログを表示します。選択されたプロバイダーの新しいモデルは、許可リストを編集せずに表示される可能性があります。別のプロバイダーから特定の 1 つのモデルが必要な場合は、正確な `provider/model` エントリを `provider/*` エントリと混在させることができます。

許可リスト設定の例:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## チャットでモデルを切り替える（`/model`）

再起動せずに現在のセッションのモデルを切り替えられます。

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="ピッカーの動作">
    - `/model`（および `/model list`）は、コンパクトな番号付きピッカーです（モデルファミリー + 利用可能なプロバイダー）。
    - Discord では、`/model` と `/models` により、プロバイダーとモデルのドロップダウン、および送信ステップを備えた対話型ピッカーが開きます。
    - Telegram では、`/models` ピッカーの選択はセッション範囲です。`openclaw.json` 内のエージェントの永続的デフォルトは変更しません。
    - `/models add` は非推奨であり、現在はチャットからモデルを登録する代わりに非推奨メッセージを返します。
    - `/model <#>` は、そのピッカーから選択します。

  </Accordion>
  <Accordion title="永続化とライブ切り替え">
    - `/model` は新しいセッション選択をただちに永続化します。
    - エージェントがアイドル状態の場合、次の実行では新しいモデルがすぐに使用されます。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留としてマークし、クリーンな再試行ポイントでのみ新しいモデルへ再起動します。
    - ツールアクティビティまたは返信出力がすでに開始されている場合、保留中の切り替えは、後続の再試行機会または次のユーザーターンまでキューに残ることがあります。
    - ユーザーが選択した `/model` 参照は、そのセッションでは厳密です。選択されたプロバイダー/モデルに到達できない場合、返信は `agents.defaults.model.fallbacks` から黙って回答するのではなく、目に見える形で失敗します。これは、引き続きフォールバックチェーンを使用できる設定済みデフォルトや cron ジョブのプライマリとは異なります。
    - `/model status` は詳細ビューです（認証候補と、設定されている場合はプロバイダーエンドポイントの `baseUrl` + `api` モード）。

  </Accordion>
  <Accordion title="参照の解析">
    - モデル参照は **最初の** `/` で分割して解析されます。`/model <ref>` を入力するときは `provider/model` を使用します。
    - モデル ID 自体に `/` が含まれる場合 (OpenRouter 形式)、プロバイダープレフィックスを含める必要があります (例: `/model openrouter/moonshotai/kimi-k2`)。
    - プロバイダーを省略すると、OpenClaw は次の順序で入力を解決します:
      1. エイリアス一致
      2. その正確なプレフィックスなしモデル ID に対する、一意の設定済みプロバイダー一致
      3. 設定済みデフォルトプロバイダーへの非推奨フォールバック — そのプロバイダーが設定済みデフォルトモデルを公開しなくなっている場合、削除済みプロバイダーの古いデフォルトを表示しないように、OpenClaw は代わりに最初の設定済みプロバイダー/モデルへフォールバックします。
  </Accordion>
</AccordionGroup>

完全なコマンド動作/設定: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

## CLI コマンド

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (サブコマンドなし) は `models status` のショートカットです。

### `models list`

デフォルトでは、設定済み/認証利用可能なモデルを表示します。有用なフラグ:

<ParamField path="--all" type="boolean">
  完全なカタログ。認証が設定される前に、同梱プロバイダー所有の静的カタログ行も含めるため、探索専用ビューで、対応するプロバイダー認証情報を追加するまで利用できないモデルを表示できます。
</ParamField>
<ParamField path="--local" type="boolean">
  ローカルプロバイダーのみ。
</ParamField>
<ParamField path="--provider <id>" type="string">
  プロバイダー ID でフィルターします。例: `moonshot`。インタラクティブピッカーの表示ラベルは受け付けられません。
</ParamField>
<ParamField path="--plain" type="boolean">
  1 行に 1 モデル。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読な出力。
</ParamField>

### `models status`

解決済みのプライマリモデル、フォールバック、画像モデル、設定済みプロバイダーの認証概要を表示します。また、認証ストアで見つかったプロファイルの OAuth 有効期限ステータスも表示します (デフォルトでは 24 時間以内に警告)。`--plain` は解決済みプライマリモデルのみを出力します。

<AccordionGroup>
  <Accordion title="認証とプローブの動作">
    - OAuth ステータスは常に表示されます (`--json` 出力にも含まれます)。設定済みプロバイダーに認証情報がない場合、`models status` は **認証不足** セクションを出力します。
    - JSON には `auth.oauth` (警告ウィンドウ + プロファイル) と `auth.providers` (env ベースの認証情報を含む、プロバイダーごとの有効な認証) が含まれます。`auth.oauth` は認証ストアのプロファイル健全性のみです。env のみのプロバイダーはそこには表示されません。
    - 自動化には `--check` を使用します (不足/期限切れなら終了コード `1`、期限切れ間近なら `2`)。
    - ライブ認証チェックには `--probe` を使用します。プローブ行は、認証プロファイル、env 認証情報、または `models.json` から来ることがあります。
    - 明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブはそれを試行せず `excluded_by_auth_order` を報告します。認証は存在するが、そのプロバイダーでプローブ可能なモデルを解決できない場合、プローブは `status: no_model` を報告します。

  </Accordion>
</AccordionGroup>

<Note>
認証の選択はプロバイダー/アカウントに依存します。常時稼働の Gateway ホストでは、通常 API キーが最も予測しやすい選択です。Claude CLI の再利用と既存の Anthropic OAuth/トークンプロファイルもサポートされています。
</Note>

例 (Claude CLI):

```bash
claude auth login
openclaw models status
```

## スキャン (OpenRouter 無料モデル)

`openclaw models scan` は OpenRouter の **無料モデルカタログ** を検査し、任意でツールと画像のサポートについてモデルをプローブできます。

<ParamField path="--no-probe" type="boolean">
  ライブプローブをスキップします (メタデータのみ)。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小パラメーターサイズ (十億単位)。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  古いモデルをスキップします。
</ParamField>
<ParamField path="--provider <name>" type="string">
  プロバイダープレフィックスフィルター。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  フォールバックリストサイズ。
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` を最初の選択に設定します。
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` を最初の画像選択に設定します。
</ParamField>

<Note>
OpenRouter `/models` カタログは公開されているため、メタデータのみのスキャンではキーなしで無料候補を一覧できます。プローブと推論には引き続き OpenRouter API キー (認証プロファイルまたは `OPENROUTER_API_KEY`) が必要です。キーが利用できない場合、`openclaw models scan` はメタデータのみの出力にフォールバックし、設定は変更しません。メタデータのみモードを明示的に要求するには `--no-probe` を使用します。
</Note>

スキャン結果は次の基準でランク付けされます:

1. 画像サポート
2. ツールレイテンシー
3. コンテキストサイズ
4. パラメーター数

入力:

- OpenRouter `/models` リスト (フィルター `:free`)
- ライブプローブには、認証プロファイルまたは `OPENROUTER_API_KEY` からの OpenRouter API キーが必要です ([環境変数](/ja-JP/help/environment) を参照)
- 任意のフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- リクエスト/プローブ制御: `--timeout`、`--concurrency`

ライブプローブが TTY で実行される場合、フォールバックをインタラクティブに選択できます。非インタラクティブモードでは、デフォルトを受け入れるために `--yes` を渡します。メタデータのみの結果は情報提供用です。OpenClaw が使用できないキーなしの OpenRouter モデルを設定しないように、`--set-default` と `--set-image` にはライブプローブが必要です。

## モデルレジストリ (`models.json`)

`models.providers` のカスタムプロバイダーは、エージェントディレクトリ配下の `models.json` に書き込まれます (デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`)。`models.mode` が `replace` に設定されていない限り、このファイルはデフォルトでマージされます。

<AccordionGroup>
  <Accordion title="マージモードの優先順位">
    一致するプロバイダー ID に対するマージモードの優先順位:

    - エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
    - エージェントの `models.json` にある空でない `apiKey` は、現在の設定/認証プロファイルコンテキストでそのプロバイダーが SecretRef 管理ではない場合にのみ優先されます。
    - SecretRef 管理のプロバイダー `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー (env 参照では `ENV_VAR_NAME`、file/exec 参照では `secretref-managed`) から更新されます。
    - SecretRef 管理のプロバイダーヘッダー値は、ソースマーカー (env 参照では `secretref-env:ENV_VAR_NAME`、file/exec 参照では `secretref-managed`) から更新されます。
    - エージェントの `apiKey`/`baseUrl` が空または欠落している場合、設定の `models.providers` にフォールバックします。
    - その他のプロバイダーフィールドは、設定と正規化済みカタログデータから更新されます。

  </Accordion>
</AccordionGroup>

<Note>
マーカーの永続化はソースを正とします。OpenClaw は、解決済みランタイムシークレット値からではなく、アクティブなソース設定スナップショット (解決前) からマーカーを書き込みます。これは、`openclaw agent` のようなコマンド駆動パスを含め、OpenClaw が `models.json` を再生成するたびに適用されます。
</Note>

## 関連

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes) — PI、Codex、その他のエージェントループランタイム
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [画像生成](/ja-JP/tools/image-generation) — 画像モデル設定
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [モデルプロバイダー](/ja-JP/concepts/model-providers) — プロバイダールーティングと認証
- [音楽生成](/ja-JP/tools/music-generation) — 音楽モデル設定
- [動画生成](/ja-JP/tools/video-generation) — 動画モデル設定
