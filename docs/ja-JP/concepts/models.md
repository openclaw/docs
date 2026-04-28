---
read_when:
    - models CLI（models list/set/scan/aliases/fallbacks）を追加または変更する
    - model fallback動作または選択UXを変更する
    - model scan probe（tools/images）を更新する
sidebarTitle: Models CLI
summary: 'Models CLI: 一覧表示、設定、alias、fallback、scan、status'
title: Models CLI
x-i18n:
    generated_at: "2026-04-26T11:28:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Model failover" href="/ja-JP/concepts/model-failover">
    auth profileのローテーション、cooldown、およびそれらがfallbackとどう相互作用するか。
  </Card>
  <Card title="Model providers" href="/ja-JP/concepts/model-providers">
    providerの概要と例を手早く確認できます。
  </Card>
  <Card title="Agent runtimes" href="/ja-JP/concepts/agent-runtimes">
    Pi、Codex、その他のagent loop runtime。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/config-agents#agent-defaults">
    model config key。
  </Card>
</CardGroup>

model refはproviderとmodelを選択します。通常、低レベルのagent runtimeは選択しません。たとえば、`openai/gpt-5.5` は、`agents.defaults.agentRuntime.id` に応じて、通常のOpenAI provider経路またはCodex app-server runtime経由で実行できます。[Agent runtimes](/ja-JP/concepts/agent-runtimes)を参照してください。

## model選択の仕組み

OpenClawは次の順序でmodelを選択します。

<Steps>
  <Step title="Primary model">
    `agents.defaults.model.primary`（または `agents.defaults.model`）。
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks`（順番どおり）。
  </Step>
  <Step title="Provider auth failover">
    auth failoverは、次のmodelへ移る前にprovider内部で発生します。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="関連するmodel surface">
    - `agents.defaults.models` は、OpenClawが使用できるmodelのallowlist/catalogです（aliasを含む）。
    - `agents.defaults.imageModel` は、primary modelがimageを受け付けられない**場合にのみ**使われます。
    - `agents.defaults.pdfModel` は `pdf` toolで使われます。省略した場合、このtoolは `agents.defaults.imageModel`、次に解決済みsession/default modelへfallbackします。
    - `agents.defaults.imageGenerationModel` は共有image-generation capabilityで使われます。省略した場合でも、`image_generate` はauth対応のprovider defaultを推論できます。まず現在のdefault providerを試し、その後、残りの登録済みimage-generation providerをprovider-id順に試します。特定のprovider/modelを設定する場合は、そのproviderのauth/API keyも設定してください。
    - `agents.defaults.musicGenerationModel` は共有music-generation capabilityで使われます。省略した場合でも、`music_generate` はauth対応のprovider defaultを推論できます。まず現在のdefault providerを試し、その後、残りの登録済みmusic-generation providerをprovider-id順に試します。特定のprovider/modelを設定する場合は、そのproviderのauth/API keyも設定してください。
    - `agents.defaults.videoGenerationModel` は共有video-generation capabilityで使われます。省略した場合でも、`video_generate` はauth対応のprovider defaultを推論できます。まず現在のdefault providerを試し、その後、残りの登録済みvideo-generation providerをprovider-id順に試します。特定のprovider/modelを設定する場合は、そのproviderのauth/API keyも設定してください。
    - agentごとのdefaultは、`agents.list[].model` とbindingによって `agents.defaults.model` を上書きできます（[Multi-agent routing](/ja-JP/concepts/multi-agent)を参照）。

  </Accordion>
</AccordionGroup>

## クイックmodelポリシー

- primaryには、自分が利用できる中で最も強力な最新世代modelを設定してください。
- fallbackは、コスト/レイテンシ重視のタスクや重要度の低いchatに使ってください。
- tool有効agentや信頼できない入力に対しては、古い/弱いmodel tierは避けてください。

## オンボーディング（推奨）

手でconfigを編集したくない場合は、onboardingを実行してください。

```bash
openclaw onboard
```

これは、**OpenAI Code (Codex) subscription**（OAuth）や**Anthropic**（API keyまたはClaude CLI）を含む一般的なprovider向けに、model + authをセットアップできます。

## Config key（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（allowlist + alias + provider param）
- `models.providers`（`models.json` に書き込まれるcustom provider）

<Note>
model refは小文字に正規化されます。`z.ai/*` のようなprovider aliasは `zai/*` に正規化されます。

OpenCodeを含むprovider設定例は[OpenCode](/ja-JP/providers/opencode)にあります。
</Note>

### 安全なallowlist編集

`agents.defaults.models` を手で更新する場合は、加算的な書き込みを使ってください。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="上書き防止ルール">
    `openclaw config set` は、model/provider mapの意図しない上書きから保護します。`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` に対する単純なobject代入で、既存entryを削除する場合は拒否されます。加算的な変更には `--merge` を使ってください。指定した値を完全なtarget値にしたい場合にのみ `--replace` を使ってください。

    対話型providerセットアップと `openclaw configure --section model` も、provider単位の選択を既存allowlistにマージするため、Codex、Ollama、または別のproviderを追加しても、無関係なmodel entryは失われません。configureは、provider authが再適用されても既存の `agents.defaults.model.primary` を保持します。`openclaw models auth login --provider <id> --set-default` や `openclaw models set <model>` のような明示的なdefault設定commandは、引き続き `agents.defaults.model.primary` を置き換えます。

  </Accordion>
</AccordionGroup>

## 「Model is not allowed」（そしてなぜ返信が止まるのか）

`agents.defaults.models` が設定されている場合、それは `/model` とsession overrideの**allowlist**になります。ユーザーがそのallowlistにないmodelを選ぶと、OpenClawは次を返します。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
これは通常の返信が生成される**前に**発生するため、「応答しなかった」ように感じることがあります。修正方法は次のいずれかです。

- modelを `agents.defaults.models` に追加する
- allowlistをクリアする（`agents.defaults.models` を削除する）
- `/model list` からmodelを選ぶ

</Warning>

allowlist configの例:

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

## chat内でのmodel切り替え（`/model`）

再起動せずに、現在のsessionのmodelを切り替えられます。

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="pickerの動作">
    - `/model`（および `/model list`）は、コンパクトな番号付きpickerです（model family + 利用可能provider）。
    - Discordでは、`/model` と `/models` は、providerとmodelのドロップダウンにSubmitステップを加えた対話型pickerを開きます。
    - `/models add` は非推奨で、chatからmodelを登録する代わりに非推奨メッセージを返すようになりました。
    - `/model <#>` はそのpickerから選択します。

  </Accordion>
  <Accordion title="永続化とライブ切り替え">
    - `/model` は新しいsession選択を即座に永続化します。
    - agentがidleなら、次のrunですぐに新しいmodelが使われます。
    - すでにrunがアクティブな場合、OpenClawはライブ切り替えを保留としてマークし、クリーンなretry pointでのみ新しいmodelへ再起動します。
    - すでにtool activityやreply outputが始まっている場合、保留中の切り替えは、後のretry機会または次のuser turnまでキューされたままになることがあります。
    - `/model status` は詳細ビューです（auth candidate、および設定されている場合はprovider endpointの `baseUrl` + `api` mode）。

  </Accordion>
  <Accordion title="ref parsing">
    - model refは**最初の** `/` で分割して解析されます。`/model <ref>` を入力するときは `provider/model` を使ってください。
    - model ID自体に `/` が含まれる場合（OpenRouterスタイル）、provider prefixを含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
    - providerを省略した場合、OpenClawは入力を次の順序で解決します。
      1. alias一致
      2. その正確なprefixなしmodel idに対する、一意なconfigured-provider一致
      3. 設定済みdefault providerへの非推奨fallback — そのproviderが設定済みdefault modelをもう公開していない場合、OpenClawは古い削除済みprovider defaultを表面化しないように、代わりに最初のconfigured provider/modelへfallbackします。
  </Accordion>
</AccordionGroup>

完全なcommand動作/config: [Slash commands](/ja-JP/tools/slash-commands)。

## CLI command

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

`openclaw models`（subcommandなし）は `models status` のshortcutです。

### `models list`

デフォルトでは設定済みmodelを表示します。便利なflag:

<ParamField path="--all" type="boolean">
  完全なcatalog。auth設定前でも、同梱providerが持つ静的catalog rowを含むため、discovery専用ビューでは、一致するprovider credentialを追加するまで利用不可のmodelも表示できます。
</ParamField>
<ParamField path="--local" type="boolean">
  ローカルproviderのみ。
</ParamField>
<ParamField path="--provider <id>" type="string">
  provider idで絞り込みます。たとえば `moonshot`。対話型pickerの表示ラベルは受け付けられません。
</ParamField>
<ParamField path="--plain" type="boolean">
  1行に1model。
</ParamField>
<ParamField path="--json" type="boolean">
  機械可読出力。
</ParamField>

### `models status`

解決されたprimary model、fallback、image model、および設定済みproviderのauth概要を表示します。また、auth store内で見つかったprofileのOAuth有効期限状態も表示します（デフォルトでは24時間以内に警告）。`--plain` は解決されたprimary modelのみを表示します。

<AccordionGroup>
  <Accordion title="authとprobeの動作">
    - OAuth statusは常に表示され（`--json` 出力にも含まれます）、設定済みproviderにcredentialがない場合、`models status` は **Missing auth** セクションを表示します。
    - JSONには `auth.oauth`（警告ウィンドウ + profile）と `auth.providers`（env対応credentialを含む、providerごとの実効auth）が含まれます。`auth.oauth` はauth-store profileの健全性のみであり、env-only providerはここには表示されません。
    - automationには `--check` を使ってください（不足/期限切れでexit `1`、期限間近で `2`）。
    - ライブauth確認には `--probe` を使ってください。probe rowはauth profile、env credential、または `models.json` から来ることがあります。
    - 明示的な `auth.order.<provider>` が保存済みprofileを省略している場合、probeはそれを試す代わりに `excluded_by_auth_order` を報告します。authは存在するが、そのprovider向けにprobe可能なmodelを解決できない場合、probeは `status: no_model` を報告します。

  </Accordion>
</AccordionGroup>

<Note>
auth選択はprovider/account依存です。常時稼働のgateway hostでは、通常API keyが最も予測しやすい方法です。Claude CLIの再利用や、既存のAnthropic OAuth/token profileもサポートされています。
</Note>

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## Scanning（OpenRouter free model）

`openclaw models scan` はOpenRouterの**free model catalog**を検査し、任意でtoolおよびimage対応についてmodelをprobeできます。

<ParamField path="--no-probe" type="boolean">
  ライブprobeをスキップします（metadataのみ）。
</ParamField>
<ParamField path="--min-params <b>" type="number">
  最小parameterサイズ（10億単位）。
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  古いmodelをスキップします。
</ParamField>
<ParamField path="--provider <name>" type="string">
  provider prefix filter。
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  fallback listサイズ。
</ParamField>
<ParamField path="--set-default" type="boolean">
  `agents.defaults.model.primary` を最初の選択に設定します。
</ParamField>
<ParamField path="--set-image" type="boolean">
  `agents.defaults.imageModel.primary` を最初のimage選択に設定します。
</ParamField>

<Note>
OpenRouterの `/models` catalogは公開されているため、metadataのみのscanではkeyなしでfree candidateを一覧できます。probeとinferenceには引き続きOpenRouter API key（auth profileまたは `OPENROUTER_API_KEY`）が必要です。keyが利用できない場合、`openclaw models scan` はmetadataのみの出力にフォールバックし、configは変更しません。明示的にmetadataのみモードを要求するには `--no-probe` を使用してください。
</Note>

scan結果は次の順序で順位付けされます。

1. image対応
2. toolレイテンシ
3. contextサイズ
4. parameter数

入力:

- OpenRouter `/models` 一覧（` :free` でfilter）
- ライブprobeには、auth profileまたは `OPENROUTER_API_KEY` からのOpenRouter API keyが必要です（[Environment variables](/ja-JP/help/environment)を参照）
- 任意のfilter: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- request/probe制御: `--timeout`、`--concurrency`

TTYでライブprobeが実行されると、fallbackを対話的に選択できます。非対話モードでは、デフォルトを受け入れるために `--yes` を渡してください。metadataのみの結果は情報提供用です。`--set-default` と `--set-image` はライブprobeを必要とします。これは、OpenClawが使えないkeyなしOpenRouter modelを設定しないようにするためです。

## Models registry（`models.json`）

`models.providers` 内のcustom providerは、agent directory配下の `models.json` に書き込まれます（デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`）。このfileは、`models.mode` が `replace` に設定されていない限り、デフォルトでマージされます。

<AccordionGroup>
  <Accordion title="マージモードの優先順位">
    一致するprovider IDに対するマージモードの優先順位:

    - agentの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
    - agentの `models.json` にある空でない `apiKey` は、そのproviderが現在のconfig/auth-profile contextでSecretRef管理されていない場合にのみ優先されます。
    - SecretRef管理されたproviderの `apiKey` 値は、解決済みsecretを永続化する代わりに、source marker（env refなら `ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
    - SecretRef管理されたprovider header値は、source marker（env refなら `secretref-env:ENV_VAR_NAME`、file/exec refなら `secretref-managed`）から更新されます。
    - agentの `apiKey` / `baseUrl` が空または欠落している場合、configの `models.providers` にフォールバックします。
    - その他のprovider fieldはconfigと正規化されたcatalog dataから更新されます。

  </Accordion>
</AccordionGroup>

<Note>
markerの永続化はsource authoritativeです。OpenClawは、解決済みruntime secret値からではなく、アクティブなsource config snapshot（解決前）からmarkerを書き込みます。これは、`openclaw agent` のようなcommand駆動経路を含め、OpenClawが `models.json` を再生成するたびに適用されます。
</Note>

## 関連

- [Agent runtimes](/ja-JP/concepts/agent-runtimes) — Pi、Codex、その他のagent loop runtime
- [Configuration reference](/ja-JP/gateway/config-agents#agent-defaults) — model config key
- [Image generation](/ja-JP/tools/image-generation) — image model設定
- [Model failover](/ja-JP/concepts/model-failover) — fallback chain
- [Model providers](/ja-JP/concepts/model-providers) — providerルーティングとauth
- [Music generation](/ja-JP/tools/music-generation) — music model設定
- [Video generation](/ja-JP/tools/video-generation) — video model設定
