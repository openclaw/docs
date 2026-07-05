---
read_when:
    - モデル CLI の追加または変更（models list/set/scan/aliases/fallbacks）
    - モデルのフォールバック動作または選択UXの変更
    - モデルスキャンプローブの更新（ツール/画像）
sidebarTitle: Models CLI
summary: 'モデル CLI: 一覧表示、設定、エイリアス、フォールバック、スキャン、ステータス'
title: モデル CLI
x-i18n:
    generated_at: "2026-07-05T01:55:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd2576d01243fe046e0c54629b5263130dbda6521df219a195cecd0fb1531771
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="モデルフェイルオーバー" href="/ja-JP/concepts/model-failover">
    認証プロファイルのローテーション、クールダウン、およびそれがフォールバックとどのように相互作用するか。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers">
    プロバイダーの簡単な概要と例。
  </Card>
  <Card title="エージェントランタイム" href="/ja-JP/concepts/agent-runtimes">
    OpenClaw、Codex、およびその他のエージェントループランタイム。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults">
    モデル設定キー。
  </Card>
</CardGroup>

モデル参照はプロバイダーとモデルを選択します。通常、低レベルのエージェントランタイムは選択しません。OpenAI エージェント参照は主な例外です。`openai/gpt-5.5` は、公式 OpenAI プロバイダーではデフォルトで Codex アプリサーバーランタイムを通じて実行されます。サブスクリプション Copilot 参照（`github-copilot/*`）は、外部の GitHub Copilot エージェントランタイム Plugin に追加でオプトインできます。この経路は明示的なままです（`auto` フォールバックなし）。明示的なランタイムオーバーライドは、エージェント全体やセッションではなく、プロバイダー/モデルポリシーに属します。Codex ランタイムモードでは、`openai/gpt-*` 参照は API キー課金を意味しません。認証は Codex アカウントまたは `openai` OAuth プロファイルから取得できます。[エージェントランタイム](/ja-JP/concepts/agent-runtimes)と [GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)を参照してください。

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
    - `agents.defaults.models` は、OpenClaw が使用できるモデルの許可リスト/カタログ（およびエイリアス）です。プロバイダー検出を動的に保ちながら表示プロバイダーを制限するには、`provider/*` エントリを使用します。
    - `agents.defaults.utilityModel` は、生成されたダッシュボードセッションタイトルや、対応チャンネルのスレッド/トピックタイトルなど、短い内部タスク向けの任意の低コストモデルです。エージェントごとの `agents.list[].utilityModel` がこれをオーバーライドします。未設定の場合、これらのタスクはエージェントのプライマリモデルを使用します。ユーティリティタスクは個別のモデル呼び出しであり、選択されたモデルプロバイダーに限定されたタスク内容を送信する場合があります。
    - `agents.defaults.imageModel` は、プライマリモデルが画像を受け付けられない場合**にのみ**使用されます。
    - `agents.defaults.pdfModel` は `pdf` ツールで使用されます。省略した場合、ツールは `agents.defaults.imageModel` にフォールバックし、その後、解決済みのセッション/デフォルトモデルにフォールバックします。
    - `agents.defaults.imageGenerationModel` は共有の画像生成機能で使用されます。省略した場合でも、`image_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み画像生成プロバイダーをプロバイダー ID 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - `agents.defaults.musicGenerationModel` は共有の音楽生成機能で使用されます。省略した場合でも、`music_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み音楽生成プロバイダーをプロバイダー ID 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - `agents.defaults.videoGenerationModel` は共有の動画生成機能で使用されます。省略した場合でも、`video_generate` は認証に裏付けられたプロバイダーのデフォルトを推論できます。現在のデフォルトプロバイダーを最初に試し、その後、残りの登録済み動画生成プロバイダーをプロバイダー ID 順に試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/API キーも設定してください。
    - エージェントごとのデフォルトは、`agents.list[].model` とバインディングを通じて `agents.defaults.model` をオーバーライドできます（[マルチエージェントルーティング](/ja-JP/concepts/multi-agent)を参照）。

  </Accordion>
</AccordionGroup>

## 選択元とフォールバック動作

同じ `provider/model` でも、どこから来たかによって意味が異なる場合があります。

- 設定済みのデフォルト（`agents.defaults.model.primary` とエージェント固有のプライマリ）は通常の開始点であり、`agents.defaults.model.fallbacks` を使用します。
- 自動フォールバック選択は一時的な回復状態です。これは `modelOverrideSource: "auto"` として保存されるため、以降のターンでは既知の不良プライマリを毎回プローブせずにフォールバックチェーンを使い続けられます。OpenClaw は定期的に元のプライマリを再度プローブし、回復したら自動選択をクリアし、フォールバック/回復の遷移を状態変更ごとに 1 回通知します。
- ユーザーのセッション選択は厳密です。`/model`、モデルピッカー、`session_status(model=...)`、および `sessions.patch` は `modelOverrideSource: "user"` を保存します。その選択されたプロバイダー/モデルに到達できない場合、OpenClaw は別の設定済みモデルへフォールスルーせず、見える形で失敗します。
- `agents.defaults.model.primary` を変更しても、既存のセッション選択は書き換えられません。ステータスに `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` と表示される場合は、`/model default` で現在のセッション選択をクリアし、設定済みプライマリを再び継承するようにします。
- Cron の `--model` / ペイロード `model` はジョブごとのプライマリです。ジョブが明示的なペイロード `fallbacks` を指定しない限り、設定済みフォールバックを引き続き使用します（厳格な cron 実行には `fallbacks: []` を使用します）。
- CLI のデフォルトモデルおよび許可リストピッカーは、完全な組み込みカタログを読み込む代わりに、明示的な `models.providers.*.models` を一覧表示することで `models.mode: "replace"` を尊重します。
- Control UI のモデルピッカーは、Gateway に設定済みモデルビューを問い合わせます。存在する場合は `agents.defaults.models`（プロバイダー全体の `provider/*` エントリを含む）、それ以外の場合は明示的な `models.providers.*.models` と使用可能な認証を持つプロバイダーです。完全な組み込みカタログは、`view: "all"` を指定した `models.list` や `openclaw models list --all` など、明示的な参照ビュー用に予約されています。

## クイックモデルポリシー

- プライマリは、利用可能な中で最も強力な最新世代モデルに設定します。
- コスト/レイテンシーに敏感なタスクや低リスクのチャットにはフォールバックを使用します。
- ツール対応エージェントや信頼できない入力では、古い/弱いモデル階層を避けます。

## オンボーディング（推奨）

設定を手作業で編集したくない場合は、オンボーディングを実行します。

```bash
openclaw onboard
```

一般的なプロバイダーのモデル + 認証をセットアップできます。これには **OpenAI Code (Codex) サブスクリプション**（OAuth）と **Anthropic**（API キーまたは Claude CLI）が含まれます。

## 設定キー（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.utilityModel`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + プロバイダーパラメーター + `provider/*` 動的プロバイダーエントリ）
- `models.providers`（`models.json` に書き込まれるカスタムプロバイダー）

<Note>
モデル参照は小文字に正規化されます。プロバイダー ID はそれ以外では厳密です。Plugin が公開している
プロバイダー ID を使用してください。

プロバイダー設定例（OpenCode を含む）は [OpenCode](/ja-JP/providers/opencode) にあります。
</Note>

### 安全な許可リスト編集

`agents.defaults.models` を手作業で更新する場合は、追加書き込みを使用します。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="上書き保護ルール">
    `openclaw config set` は、モデル/プロバイダーマップを偶発的な上書きから保護します。`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` への通常のオブジェクト代入は、既存エントリを削除する場合は拒否されます。追加変更には `--merge` を使用します。指定された値を完全なターゲット値にする必要がある場合にのみ `--replace` を使用します。

    対話型プロバイダーセットアップと `openclaw configure --section model` も、プロバイダー単位の選択を既存の許可リストにマージするため、Codex、Ollama、または別のプロバイダーを追加しても、無関係なモデルエントリは削除されません。Configure は、プロバイダー認証が再適用されるときに既存の `agents.defaults.model.primary` を保持します。`openclaw models auth login --provider <id> --set-default` や `openclaw models set <model>` などの明示的なデフォルト設定コマンドは、引き続き `agents.defaults.model.primary` を置き換えます。

  </Accordion>
</AccordionGroup>

## 「モデルは許可されていません」（そして返信が止まる理由）

`agents.defaults.models` が設定されている場合、それは `/model` とセッションオーバーライドの**許可リスト**になります。ユーザーがその許可リストに含まれないモデルを選択すると、OpenClaw は次を返します。

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
これは通常の返信が生成される**前に**発生するため、メッセージが「応答しなかった」ように感じられる場合があります。修正方法は次のいずれかです。

- モデルを `agents.defaults.models` に追加する、または
- 許可リストをクリアする（`agents.defaults.models` を削除する）、または
- `/model list` からモデルを選択する。

</Warning>

拒否されたコマンドに `/model openai/gpt-5.5 --runtime codex` のようなランタイムオーバーライドが含まれていた場合は、まず許可リストを修正してから、同じ `/model ... --runtime ...` コマンドを再試行します。ネイティブの Codex 実行では、選択されたモデルは引き続き `openai/gpt-5.5` です。`codex` ランタイムはハーネスを選択し、Codex 認証を別に使用します。

ローカル/GGUF モデルの場合は、プロバイダープレフィックス付きの完全な参照を許可リストに保存します。
たとえば `ollama/gemma4:26b`、`lmstudio/Gemma4-26b-a4-it-gguf`、または
`openclaw models list --provider <provider>` で表示される正確な provider/model です。
許可リストが有効な場合、裸のローカルファイル名や表示名だけでは不十分です。

すべてのモデルを手動で一覧化せずにプロバイダーを制限したい場合は、
`provider/*` エントリを `agents.defaults.models` に追加します。

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

このポリシーでは、`/model`、`/models`、およびモデルピッカーは、それらのプロバイダーだけの検出済み
カタログを表示します。選択したプロバイダーからの新しいモデルは、
許可リストを編集しなくても表示される場合があります。別のプロバイダーから特定のモデルを 1 つ必要とする場合は、
正確な `provider/model` エントリを `provider/*` エントリと混在させることができます。

許可リスト設定例:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
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
/model default
/model status
```

<AccordionGroup>
  <Accordion title="ピッカーの動作">
    - `/model`（および `/model list`）は、コンパクトな番号付きピッカーです（モデルファミリー + 利用可能なプロバイダー）。
    - Discord では、`/model` と `/models` が、プロバイダーとモデルのドロップダウンに加えて送信ステップを備えた対話型ピッカーを開きます。
    - Telegram では、`/models` ピッカーの選択はセッション単位です。`openclaw.json` 内のエージェントの永続的なデフォルトは変更しません。
    - `/models add` は非推奨であり、現在はチャットからモデルを登録する代わりに非推奨メッセージを返します。
    - `/model <#>` はそのピッカーから選択します。

  </Accordion>
  <Accordion title="永続化とライブ切り替え">
    - `/model` は新しいセッション選択をただちに永続化します。
    - エージェントがアイドル状態の場合、次の実行では新しいモデルがすぐに使われます。
    - 実行がすでにアクティブな場合、OpenClaw はライブ切り替えを保留中としてマークし、クリーンなリトライ地点でのみ新しいモデルへ再起動します。
    - ツールアクティビティまたは返信出力がすでに開始されている場合、保留中の切り替えは後続のリトライ機会または次のユーザーターンまでキューに残ることがあります。
    - `/model default` はセッション選択をクリアし、セッションを設定済みのデフォルトモデルに戻します。
    - ユーザーが選択した `/model` ref はそのセッションでは厳格です。選択されたプロバイダー/モデルに到達できない場合、`agents.defaults.model.fallbacks` から黙って応答するのではなく、返信は見える形で失敗します。これは、引き続きフォールバックチェーンを使用できる設定済みデフォルトや cron ジョブのプライマリとは異なります。
    - `/model status` は詳細ビューです (認証候補、および設定されている場合はプロバイダーエンドポイントの `baseUrl` + `api` モード)。

  </Accordion>
  <Accordion title="Ref の解析">
    - モデル ref は **最初の** `/` で分割して解析されます。`/model <ref>` を入力するときは `provider/model` を使います。
    - モデル ID 自体に `/` が含まれる場合 (OpenRouter 形式)、プロバイダープレフィックスを含める必要があります (例: `/model openrouter/moonshotai/kimi-k2`)。
    - プロバイダーを省略した場合、OpenClaw は次の順序で入力を解決します。
      1. エイリアス一致
      2. その正確なプレフィックスなしモデル ID に対する一意の設定済みプロバイダー一致
      3. 設定済みデフォルトプロバイダーへの非推奨フォールバック — そのプロバイダーが設定済みデフォルトモデルを公開しなくなっている場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表面化させないよう、代わりに最初の設定済みプロバイダー/モデルへフォールバックします。
  </Accordion>
</AccordionGroup>

コマンド動作/設定の完全版: [スラッシュコマンド](/ja-JP/tools/slash-commands)。

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

デフォルトでは、設定済み/認証で利用可能なモデルを表示します。便利なフラグ:

<ParamField path="--all" type="boolean">
  完全なカタログ。認証が設定される前の、バンドルされたプロバイダー所有の静的カタログ行を含むため、検出専用ビューでは、一致するプロバイダー認証情報を追加するまで利用できないモデルも表示できます。
</ParamField>
<ParamField path="--local" type="boolean">
  ローカルプロバイダーのみ。
</ParamField>
<ParamField path="--provider <id>" type="string">
  プロバイダー ID でフィルターします。例: `moonshot`。対話型ピッカーの表示ラベルは受け付けません。
</ParamField>
<ParamField path="--plain" type="boolean">
  1 行につき 1 モデル。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読出力。
</ParamField>

### `models status`

解決済みのプライマリモデル、フォールバック、画像モデル、および設定済みプロバイダーの認証概要を表示します。また、認証ストアで見つかったプロファイルの OAuth 有効期限ステータスも表示します (デフォルトでは 24 時間以内に警告)。`--plain` は解決済みのプライマリモデルのみを出力します。

<AccordionGroup>
  <Accordion title="認証とプローブの動作">
    - OAuth ステータスは常に表示されます (`--json` 出力にも含まれます)。設定済みプロバイダーに認証情報がない場合、`models status` は **認証不足** セクションを出力します。
    - JSON には `auth.oauth` (警告ウィンドウ + プロファイル) と `auth.providers` (env 由来の認証情報を含む、プロバイダーごとの有効な認証) が含まれます。`auth.oauth` は認証ストアのプロファイル健全性のみです。env のみのプロバイダーはそこには表示されません。
    - 自動化には `--check` を使います (不足/期限切れの場合は終了 `1`、期限切れ間近の場合は `2`)。
    - ライブ認証チェックには `--probe` を使います。プローブ行は認証プロファイル、env 認証情報、または `models.json` から取得されることがあります。
    - 明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブはそれを試行せずに `excluded_by_auth_order` を報告します。認証は存在するものの、そのプロバイダーでプローブ可能なモデルを解決できない場合、プローブは `status: no_model` を報告します。

  </Accordion>
</AccordionGroup>

<Note>
認証の選択はプロバイダー/アカウントに依存します。常時稼働の Gateway ホストでは通常、API キーが最も予測可能です。Claude CLI の再利用と既存の Anthropic OAuth/トークンプロファイルもサポートされています。
</Note>

例 (Claude CLI):

```bash
claude auth login
openclaw models status
```

## スキャン (OpenRouter 無料モデル)

`openclaw models scan` は OpenRouter の **無料モデルカタログ** を検査し、必要に応じてツールと画像サポートについてモデルをプローブできます。

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
OpenRouter の `/models` カタログは公開されているため、メタデータのみのスキャンではキーなしで無料候補を一覧できます。プローブと推論には引き続き OpenRouter API キー (認証プロファイルまたは `OPENROUTER_API_KEY` から) が必要です。キーが利用できない場合、`openclaw models scan` はメタデータのみの出力にフォールバックし、設定は変更しません。メタデータのみのモードを明示的に要求するには `--no-probe` を使います。
</Note>

スキャン結果は次の順でランク付けされます。

1. 画像サポート
2. ツールレイテンシ
3. コンテキストサイズ
4. パラメーター数

入力:

- OpenRouter `/models` リスト (フィルター `:free`)
- ライブプローブには、認証プロファイルまたは `OPENROUTER_API_KEY` からの OpenRouter API キーが必要です ([環境変数](/ja-JP/help/environment) を参照)
- 任意のフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- リクエスト/プローブ制御: `--timeout`、`--concurrency`

TTY でライブプローブを実行する場合、フォールバックを対話的に選択できます。非対話モードでは、デフォルトを受け入れるために `--yes` を渡します。メタデータのみの結果は情報提供用です。OpenClaw が使用不能なキーなし OpenRouter モデルを設定しないよう、`--set-default` と `--set-image` にはライブプローブが必要です。

## モデルレジストリ (`models.json`)

`models.providers` のカスタムプロバイダーは、エージェントディレクトリ配下の `models.json` に書き込まれます (デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`)。プロバイダー Plugin カタログは、エージェントの Plugin 状態配下に生成された Plugin 所有のカタログシャードとして保存され、自動的に読み込まれます。このファイルは、`models.mode` が `replace` に設定されていない限り、デフォルトでマージされます。

<AccordionGroup>
  <Accordion title="マージモードの優先順位">
    一致するプロバイダー ID に対するマージモードの優先順位:

    - エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
    - エージェントの `models.json` の空でない `apiKey` は、そのプロバイダーが現在の設定/認証プロファイルコンテキストで SecretRef 管理されていない場合にのみ優先されます。
    - SecretRef 管理のプロバイダー `apiKey` 値は、解決済みシークレットを永続化するのではなく、ソースマーカー (env ref の場合は `ENV_VAR_NAME`、file/exec ref の場合は `secretref-managed`) から更新されます。
    - SecretRef 管理のプロバイダーヘッダー値は、ソースマーカー (env ref の場合は `secretref-env:ENV_VAR_NAME`、file/exec ref の場合は `secretref-managed`) から更新されます。
    - 空または欠落したエージェントの `apiKey`/`baseUrl` は設定の `models.providers` にフォールバックします。
    - その他のプロバイダーフィールドは設定と正規化済みカタログデータから更新されます。

  </Accordion>
</AccordionGroup>

<Note>
マーカーの永続化ではソースが権威です。OpenClaw は、解決済みランタイムシークレット値ではなく、アクティブなソース設定スナップショット (解決前) からマーカーを書き込みます。これは、`openclaw agent` のようなコマンド駆動パスを含め、OpenClaw が `models.json` を再生成するたびに適用されます。
</Note>

## 関連

- [エージェントランタイム](/ja-JP/concepts/agent-runtimes) — OpenClaw、Codex、およびその他のエージェントループランタイム
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [画像生成](/ja-JP/tools/image-generation) — 画像モデル設定
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [モデルプロバイダー](/ja-JP/concepts/model-providers) — プロバイダールーティングと認証
- [音楽生成](/ja-JP/tools/music-generation) — 音楽モデル設定
- [動画生成](/ja-JP/tools/video-generation) — 動画モデル設定
