---
read_when:
    - models CLI の追加または変更（models list/set/scan/aliases/fallbacks）
    - モデルのフォールバック動作または選択 UX の変更
    - モデルスキャンプローブの更新（ツール/画像）
sidebarTitle: Models CLI
summary: 'モデル CLI: 一覧表示、設定、エイリアス、フォールバック、スキャン、ステータス'
title: モデル CLI
x-i18n:
    generated_at: "2026-05-02T20:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="モデル フェイルオーバー" href="/ja-JP/concepts/model-failover">
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

モデル参照はプロバイダーとモデルを選択します。通常、低レベルのエージェントランタイムは選択しません。たとえば、`openai/gpt-5.5` は、`agents.defaults.agentRuntime.id` に応じて、通常の OpenAI プロバイダーパス経由でも、Codex アプリサーバーランタイム経由でも実行できます。Codex ランタイムモードでは、`openai/gpt-*` 参照は API キー課金を意味しません。認証は Codex アカウントまたは `openai-codex` 認証プロファイルから取得できます。[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を参照してください。

## モデル選択の仕組み

OpenClaw は次の順序でモデルを選択します。

<Steps>
  <Step title="プライマリモデル">
    `agents.defaults.model.primary`（または `agents.defaults.model`）。
  </Step>
  <Step title="フォールバック">
    `agents.defaults.model.fallbacks`（順序どおり）。
  </Step>
  <Step title="プロバイダー認証フェイルオーバー">
    認証フェイルオーバーは、次のモデルへ移る前にプロバイダー内で発生します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="関連するモデルサーフェス">
    - `agents.defaults.models` は、OpenClaw が使用できるモデルの許可リスト/カタログです（エイリアスを含む）。
    - `agents.defaults.imageModel` は、プライマリモデルが画像を受け付けられない場合**にのみ**使用されます。
    - `agents.defaults.pdfModel` は `pdf` ツールで使用されます。省略した場合、ツールは `agents.defaults.imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
    - `agents.defaults.imageGenerationModel` は共有の画像生成機能で使用されます。省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、次に残りの登録済み画像生成プロバイダーをプロバイダー ID 順で試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - `agents.defaults.musicGenerationModel` は共有の音楽生成機能で使用されます。省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、次に残りの登録済み音楽生成プロバイダーをプロバイダー ID 順で試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - `agents.defaults.videoGenerationModel` は共有の動画生成機能で使用されます。省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーのデフォルトを推測できます。まず現在のデフォルトプロバイダーを試し、次に残りの登録済み動画生成プロバイダーをプロバイダー ID 順で試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - エージェントごとのデフォルトは、`agents.list[].model` とバインディングにより `agents.defaults.model` を上書きできます（[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照）。

  </Accordion>
</AccordionGroup>

## 選択元とフォールバック動作

同じ `provider/model` でも、どこから来たかによって意味が変わる場合があります。

- 設定済みデフォルト（`agents.defaults.model.primary` とエージェント固有のプライマリ）は通常の開始点であり、`agents.defaults.model.fallbacks` を使用します。
- 自動フォールバック選択は一時的な復旧状態です。`modelOverrideSource: "auto"` とともに保存されるため、後続のターンでは、既知の不良プライマリを最初に試すことなくフォールバックチェーンを使い続けられます。
- ユーザーセッション選択は厳密です。`/model`、モデルピッカー、`session_status(model=...)`、`sessions.patch` は `modelOverrideSource: "user"` を保存します。その選択されたプロバイダー/モデルに到達できない場合、OpenClaw は別の設定済みモデルへフォールスルーせず、見える形で失敗します。
- Cron の `--model` / ペイロード `model` はジョブごとのプライマリです。ジョブが明示的なペイロード `fallbacks` を指定しない限り、設定済みフォールバックを引き続き使用します（厳密な cron 実行には `fallbacks: []` を使用します）。
- CLI のデフォルトモデルと許可リストのピッカーは、組み込みカタログ全体を読み込む代わりに明示的な `models.providers.*.models` を一覧表示することで、`models.mode: "replace"` を尊重します。
- コントロール UI のモデルピッカーは、Gateway に設定済みモデルビューを問い合わせます。存在する場合は `agents.defaults.models`、そうでない場合は明示的な `models.providers.*.models` と利用可能な認証を持つプロバイダーです。完全な組み込みカタログは、`view: "all"` を指定した `models.list` や `openclaw models list --all` など、明示的な参照ビュー用に予約されています。

## 簡単なモデルポリシー

- プライマリには、利用可能な最新世代の最も強力なモデルを設定します。
- コスト/レイテンシに敏感なタスクやリスクの低いチャットにはフォールバックを使用します。
- ツール有効エージェントや信頼できない入力では、古い/弱いモデル階層を避けてください。

## オンボーディング（推奨）

設定を手動編集したくない場合は、オンボーディングを実行します。

```bash
openclaw onboard
```

これは、**OpenAI Code（Codex）サブスクリプション**（OAuth）や **Anthropic**（API キーまたは Claude CLI）を含む一般的なプロバイダー向けに、モデルと認証をセットアップできます。

## 設定キー（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + プロバイダーパラメーター）
- `models.providers`（`models.json` に書き込まれるカスタムプロバイダー）

<Note>
モデル参照は小文字に正規化されます。`z.ai/*` のようなプロバイダーエイリアスは `zai/*` に正規化されます。

プロバイダー設定例（OpenCode を含む）は [OpenCode](/ja-JP/providers/opencode) にあります。
</Note>

### 安全な許可リスト編集

`agents.defaults.models` を手動で更新する場合は、追加書き込みを使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="上書き保護ルール">
    `openclaw config set` は、モデル/プロバイダーマップを意図しない上書きから保護します。`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` へのプレーンオブジェクト代入は、既存のエントリを削除する場合は拒否されます。追加変更には `--merge` を使用し、指定した値を完全なターゲット値にする場合にのみ `--replace` を使用してください。

    対話型プロバイダーセットアップと `openclaw configure --section model` も、プロバイダースコープの選択を既存の許可リストにマージするため、Codex、Ollama、または別のプロバイダーを追加しても、関係のないモデルエントリは削除されません。Configure は、プロバイダー認証が再適用されるときに既存の `agents.defaults.model.primary` を保持します。`openclaw models auth login --provider <id> --set-default` や `openclaw models set <model>` などの明示的なデフォルト設定コマンドは、引き続き `agents.defaults.model.primary` を置き換えます。

  </Accordion>
</AccordionGroup>

## 「モデルは許可されていません」（そして返信が止まる理由）

`agents.defaults.models` が設定されている場合、それは `/model` とセッション上書き用の**許可リスト**になります。ユーザーがその許可リストにないモデルを選択すると、OpenClaw は次を返します。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
これは通常の返信が生成される**前に**発生するため、メッセージは「応答しなかった」ように感じられる場合があります。修正するには、次のいずれかを行います。

- モデルを `agents.defaults.models` に追加する、または
- 許可リストをクリアする（`agents.defaults.models` を削除する）、または
- `/model list` からモデルを選ぶ。

</Warning>

ローカル/GGUF モデルでは、許可リストに完全なプロバイダー接頭辞付き参照を保存します。
たとえば `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`、または
`openclaw models list --provider <provider>` に表示される正確な
プロバイダー/モデルです。許可リストが有効な場合、素のローカルファイル名や表示名だけでは不十分です。

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

再起動せずに、現在のセッションのモデルを切り替えられます。

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
    - Discord では、`/model` と `/models` が、プロバイダーとモデルのドロップダウンに加えて送信ステップを備えた対話型ピッカーを開きます。
    - Telegram では、`/models` ピッカーの選択はセッションスコープです。`openclaw.json` 内のエージェントの永続的なデフォルトは変更しません。
    - `/models add` は非推奨で、現在はチャットからモデルを登録する代わりに非推奨メッセージを返します。
    - `/model <#>` はそのピッカーから選択します。

  </Accordion>
  <Accordion title="永続化とライブ切り替え">
    - `/model` は新しいセッション選択を即座に永続化します。
    - エージェントがアイドル状態の場合、次の実行はすぐに新しいモデルを使用します。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンな再試行ポイントでのみ新しいモデルへ再起動します。
    - ツールのアクティビティまたは返信出力がすでに開始している場合、保留中の切り替えは、後の再試行機会または次のユーザーターンまでキューに残る場合があります。
    - ユーザーが選択した `/model` 参照は、そのセッションでは厳密です。選択されたプロバイダー/モデルに到達できない場合、`agents.defaults.model.fallbacks` から静かに回答するのではなく、返信は見える形で失敗します。これは、引き続きフォールバックチェーンを使用できる設定済みデフォルトや cron ジョブのプライマリとは異なります。
    - `/model status` は詳細ビューです（認証候補、および設定されている場合はプロバイダーエンドポイントの `baseUrl` + `api` モード）。

  </Accordion>
  <Accordion title="参照の解析">
    - モデル参照は、**最初の** `/` で分割して解析されます。`/model <ref>` を入力するときは `provider/model` を使用します。
    - モデル ID 自体に `/` が含まれる場合（OpenRouter 形式）、プロバイダー接頭辞を含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
    - プロバイダーを省略した場合、OpenClaw は次の順序で入力を解決します。
      1. エイリアス一致
      2. その正確な接頭辞なしモデル ID に対する、一意の設定済みプロバイダー一致
      3. 設定済みデフォルトプロバイダーへの非推奨フォールバック — そのプロバイダーが設定済みデフォルトモデルを公開しなくなっている場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示しないよう、代わりに最初の設定済みプロバイダー/モデルへフォールバックします。
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

`openclaw models`（サブコマンドなし）は `models status` のショートカットです。

### `models list`

デフォルトでは、設定済み/認証利用可能なモデルを表示します。便利なフラグ:

<ParamField path="--all" type="boolean">
  完全なカタログ。認証が設定される前の同梱プロバイダー所有の静的カタログ行を含むため、検出専用ビューで、一致するプロバイダー認証情報を追加するまで利用できないモデルを表示できます。
</ParamField>
<ParamField path="--local" type="boolean">
  ローカルプロバイダーのみ。
</ParamField>
<ParamField path="--provider <id>" type="string">
  プロバイダー ID でフィルターします。例: `moonshot`。対話型ピッカーの表示ラベルは受け付けません。
</ParamField>
<ParamField path="--plain" type="boolean">
  1行に1モデル。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読出力。
</ParamField>

### `models status`

解決済みのプライマリモデル、フォールバック、画像モデル、設定済みプロバイダーの認証概要を表示します。また、認証ストアで見つかったプロファイルの OAuth 有効期限ステータスも表示します（デフォルトでは24時間以内に警告）。`--plain` は解決済みのプライマリモデルのみを出力します。

<AccordionGroup>
  <Accordion title="認証とプローブの動作">
    - OAuth ステータスは常に表示されます（`--json` 出力にも含まれます）。設定済みプロバイダーに認証情報がない場合、`models status` は **認証不足** セクションを出力します。
    - JSON には `auth.oauth`（警告期間 + プロファイル）と `auth.providers`（env に基づく認証情報を含む、プロバイダーごとの有効な認証）が含まれます。`auth.oauth` は認証ストアのプロファイル健全性のみです。env のみのプロバイダーはそこには表示されません。
    - 自動化には `--check` を使用します（不足/期限切れの場合は終了コード `1`、期限切れ間近の場合は `2`）。
    - ライブ認証チェックには `--probe` を使用します。プローブ行は認証プロファイル、env 認証情報、または `models.json` から取得できます。
    - 明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブは試行せずに `excluded_by_auth_order` を報告します。認証は存在するものの、そのプロバイダーでプローブ可能なモデルを解決できない場合、プローブは `status: no_model` を報告します。

  </Accordion>
</AccordionGroup>

<Note>
認証の選択はプロバイダー/アカウントに依存します。常時稼働の Gateway ホストでは、通常 API キーが最も予測しやすい方法です。Claude CLI の再利用と既存の Anthropic OAuth/トークンプロファイルもサポートされています。
</Note>

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## スキャン（OpenRouter 無料モデル）

`openclaw models scan` は OpenRouter の **無料モデルカタログ** を検査し、任意でモデルのツールおよび画像サポートをプローブできます。

<ParamField path="--no-probe" type="boolean">
  ライブプローブをスキップします（メタデータのみ）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小パラメーターサイズ（十億単位）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  古いモデルをスキップします。
</ParamField>
<ParamField path="--provider <name>" type="string">
  プロバイダー接頭辞フィルター。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  フォールバックリストのサイズ。
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` を最初の選択に設定します。
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` を最初の画像選択に設定します。
</ParamField>

<Note>
OpenRouter の `/models` カタログは公開されているため、メタデータのみのスキャンではキーなしで無料候補を一覧できます。プローブと推論には引き続き OpenRouter API キー（認証プロファイルまたは `OPENROUTER_API_KEY` から）が必要です。キーが利用できない場合、`openclaw models scan` はメタデータのみの出力にフォールバックし、設定は変更しません。メタデータのみのモードを明示的に要求するには `--no-probe` を使用します。
</Note>

スキャン結果は次の順でランク付けされます。

1. 画像サポート
2. ツールレイテンシ
3. コンテキストサイズ
4. パラメーター数

入力:

- OpenRouter `/models` リスト（フィルター `:free`）
- ライブプローブには、認証プロファイルまたは `OPENROUTER_API_KEY` からの OpenRouter API キーが必要です（[環境変数](/ja-JP/help/environment) を参照）
- 任意のフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- リクエスト/プローブ制御: `--timeout`、`--concurrency`

ライブプローブが TTY で実行される場合、フォールバックを対話的に選択できます。非対話モードでは、デフォルトを受け入れるために `--yes` を渡します。メタデータのみの結果は情報提供用です。`--set-default` と `--set-image` にはライブプローブが必要です。これにより、OpenClaw が使用不能なキーなしの OpenRouter モデルを設定しないようにします。

## モデルレジストリ（`models.json`）

`models.providers` のカスタムプロバイダーは、エージェントディレクトリ配下の `models.json`（デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`）に書き込まれます。このファイルは、`models.mode` が `replace` に設定されていない限りデフォルトでマージされます。

<AccordionGroup>
  <Accordion title="マージモードの優先順位">
    一致するプロバイダー ID に対するマージモードの優先順位:

    - エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
    - エージェントの `models.json` 内の空でない `apiKey` は、そのプロバイダーが現在の設定/認証プロファイルコンテキストで SecretRef 管理ではない場合にのみ優先されます。
    - SecretRef 管理のプロバイダー `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env 参照の場合は `ENV_VAR_NAME`、file/exec 参照の場合は `secretref-managed`）から更新されます。
    - SecretRef 管理のプロバイダーヘッダー値は、ソースマーカー（env 参照の場合は `secretref-env:ENV_VAR_NAME`、file/exec 参照の場合は `secretref-managed`）から更新されます。
    - 空または欠落しているエージェントの `apiKey`/`baseUrl` は、設定の `models.providers` にフォールバックします。
    - その他のプロバイダーフィールドは、設定と正規化済みカタログデータから更新されます。

  </Accordion>
</AccordionGroup>

<Note>
マーカーの永続化ではソースが権威です。OpenClaw は、解決済みランタイムシークレット値ではなく、アクティブなソース設定スナップショット（解決前）からマーカーを書き込みます。これは、`openclaw agent` のようなコマンド駆動パスを含め、OpenClaw が `models.json` を再生成するたびに適用されます。
</Note>

## 関連

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes) — PI、Codex、その他のエージェントループランタイム
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [画像生成](/ja-JP/tools/image-generation) — 画像モデル設定
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [モデルプロバイダー](/ja-JP/concepts/model-providers) — プロバイダーのルーティングと認証
- [音楽生成](/ja-JP/tools/music-generation) — 音楽モデル設定
- [動画生成](/ja-JP/tools/video-generation) — 動画モデル設定
