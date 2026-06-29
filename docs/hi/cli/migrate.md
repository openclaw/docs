---
read_when:
    - आप Hermes या किसी अन्य एजेंट सिस्टम से OpenClaw में माइग्रेट करना चाहते हैं
    - आप Plugin-स्वामित्व वाला माइग्रेशन प्रदाता जोड़ रहे हैं
summary: '`openclaw migrate` के लिए CLI संदर्भ (किसी अन्य एजेंट सिस्टम से स्थिति आयात करें)'
title: माइग्रेट करें
x-i18n:
    generated_at: "2026-06-28T22:50:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin-स्वामित्व वाले माइग्रेशन प्रदाता के माध्यम से किसी दूसरे एजेंट सिस्टम से स्थिति आयात करें। बंडल किए गए प्रदाता Codex CLI स्थिति, [Claude](/hi/install/migrating-claude), और [Hermes](/hi/install/migrating-hermes) को कवर करते हैं; तृतीय-पक्ष plugins अतिरिक्त प्रदाता पंजीकृत कर सकते हैं।

<Tip>
उपयोगकर्ता-उन्मुख मार्गदर्शिकाओं के लिए, [Claude से माइग्रेट करना](/hi/install/migrating-claude) और [Hermes से माइग्रेट करना](/hi/install/migrating-hermes) देखें। [माइग्रेशन हब](/hi/install/migrating) सभी पथों की सूची देता है।
</Tip>

## कमांड

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  किसी पंजीकृत माइग्रेशन प्रदाता का नाम, उदाहरण के लिए `hermes`। इंस्टॉल किए गए प्रदाता देखने के लिए `openclaw migrate list` चलाएँ।
</ParamField>
<ParamField path="--dry-run" type="boolean">
  योजना बनाएँ और स्थिति बदले बिना बाहर निकलें।
</ParamField>
<ParamField path="--from <path>" type="string">
  स्रोत स्थिति निर्देशिका को ओवरराइड करें। Hermes डिफ़ॉल्ट रूप से `~/.hermes` का उपयोग करता है।
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  समर्थित क्रेडेंशियल बिना संकेत दिए आयात करें। इंटरैक्टिव apply, पहचाने गए auth क्रेडेंशियल आयात करने से पहले पूछता है, जहाँ डिफ़ॉल्ट रूप से हाँ चयनित होता है; गैर-इंटरैक्टिव `--yes` में इन्हें आयात करने के लिए `--include-secrets` आवश्यक है।
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  इंटरैक्टिव संकेत सहित auth क्रेडेंशियल आयात छोड़ें।
</ParamField>
<ParamField path="--overwrite" type="boolean">
  जब योजना conflicts रिपोर्ट करे, तब apply को मौजूदा targets बदलने की अनुमति दें।
</ParamField>
<ParamField path="--yes" type="boolean">
  पुष्टिकरण संकेत छोड़ें। गैर-इंटरैक्टिव मोड में आवश्यक।
</ParamField>
<ParamField path="--skill <name>" type="string">
  skill नाम या item id द्वारा एक skill copy item चुनें। कई skills माइग्रेट करने के लिए flag दोहराएँ। छोड़े जाने पर, इंटरैक्टिव Codex माइग्रेशन checkbox selector दिखाते हैं और गैर-इंटरैक्टिव माइग्रेशन सभी planned skills रखते हैं।
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin नाम या item id द्वारा एक Codex Plugin install item चुनें। कई Codex plugins माइग्रेट करने के लिए flag दोहराएँ। छोड़े जाने पर, इंटरैक्टिव Codex माइग्रेशन native Codex Plugin checkbox selector दिखाते हैं और गैर-इंटरैक्टिव माइग्रेशन सभी planned plugins रखते हैं। यह केवल Codex app-server inventory द्वारा खोजे गए source-installed `openai-curated` Codex plugins पर लागू होता है।
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  केवल Codex। native Plugin activation की योजना बनाने से पहले ताज़ा source Codex app-server `app/list` traversal बाध्य करें। माइग्रेशन planning तेज़ रखने के लिए डिफ़ॉल्ट रूप से बंद।
</ParamField>
<ParamField path="--no-backup" type="boolean">
  pre-apply backup छोड़ें। local OpenClaw state मौजूद होने पर `--force` आवश्यक है।
</ParamField>
<ParamField path="--force" type="boolean">
  जब apply अन्यथा backup छोड़ने से मना कर देता, तब `--no-backup` के साथ आवश्यक।
</ParamField>
<ParamField path="--json" type="boolean">
  योजना या apply परिणाम को JSON के रूप में प्रिंट करें। `--json` और बिना `--yes` के, apply योजना प्रिंट करता है और state को mutate नहीं करता।
</ParamField>

## सुरक्षा मॉडल

`openclaw migrate` पहले preview करता है।

<AccordionGroup>
  <Accordion title="Apply से पहले preview">
    प्रदाता कुछ भी बदलने से पहले itemized योजना लौटाता है, जिसमें conflicts, छोड़े गए items, और sensitive items शामिल होते हैं। JSON plans, apply output, और migration reports nested secret-looking keys जैसे API keys, tokens, authorization headers, cookies, और passwords को redact करते हैं।

    `openclaw migrate apply <provider>` योजना का preview करता है और state बदलने से पहले संकेत देता है, जब तक `--yes` सेट न हो। गैर-इंटरैक्टिव मोड में, apply के लिए `--yes` आवश्यक है।

  </Accordion>
  <Accordion title="Backups">
    Apply माइग्रेशन लागू करने से पहले OpenClaw backup बनाता और verify करता है। अगर अभी तक कोई local OpenClaw state मौजूद नहीं है, तो backup step छोड़ा जाता है और माइग्रेशन जारी रह सकता है। state मौजूद होने पर backup छोड़ने के लिए, `--no-backup` और `--force` दोनों पास करें।
  </Accordion>
  <Accordion title="Conflicts">
    जब योजना में conflicts हों तो apply जारी रखने से मना कर देता है। योजना की समीक्षा करें, फिर अगर मौजूदा targets बदलना जानबूझकर है तो `--overwrite` के साथ फिर चलाएँ। Providers अभी भी migration report directory में overwritten files के लिए item-level backups लिख सकते हैं।
  </Accordion>
  <Accordion title="Secrets">
    इंटरैक्टिव apply पूछता है कि पहचाने गए auth credentials आयात करने हैं या नहीं, जहाँ डिफ़ॉल्ट रूप से हाँ चयनित होता है। उन्हें छोड़ने के लिए `--no-auth-credentials` का उपयोग करें, या `--yes` के साथ unattended credential import के लिए `--include-secrets` का उपयोग करें।
  </Accordion>
</AccordionGroup>

## Claude प्रदाता

बंडल किया गया Claude प्रदाता डिफ़ॉल्ट रूप से `~/.claude` पर Claude Code state पहचानता है। किसी विशिष्ट Claude Code home या project root को आयात करने के लिए `--from <path>` का उपयोग करें।

<Tip>
उपयोगकर्ता-उन्मुख मार्गदर्शिका के लिए, [Claude से माइग्रेट करना](/hi/install/migrating-claude) देखें।
</Tip>

### Claude क्या आयात करता है

- Project `CLAUDE.md` और `.claude/CLAUDE.md` को OpenClaw एजेंट workspace में।
- User `~/.claude/CLAUDE.md` को workspace `USER.md` में append किया गया।
- project `.mcp.json`, Claude Code `~/.claude.json`, और Claude Desktop `claude_desktop_config.json` से MCP server definitions।
- Claude skill directories जिनमें `SKILL.md` शामिल है।
- Claude command Markdown files को केवल manual invocation वाले OpenClaw skills में परिवर्तित किया गया।

### Archive और manual-review state

Claude hooks, permissions, environment defaults, local memory, path-scoped rules, subagents, caches, plans, और project history को migration report में सुरक्षित रखा जाता है या manual-review items के रूप में रिपोर्ट किया जाता है। OpenClaw hooks execute नहीं करता, broad allowlists copy नहीं करता, या OAuth/Desktop credential state को अपने-आप import नहीं करता।

## Codex प्रदाता

बंडल किया गया Codex प्रदाता डिफ़ॉल्ट रूप से `~/.codex` पर Codex CLI state पहचानता है, या
जब वह environment variable set हो तो `CODEX_HOME` पर। किसी विशिष्ट Codex home का
inventory लेने के लिए `--from <path>` का उपयोग करें।

इस प्रदाता का उपयोग तब करें जब आप OpenClaw Codex harness पर जा रहे हों और
उपयोगी personal Codex CLI assets को सोच-समझकर promote करना चाहते हों। Local Codex app-server
launches per-agent `CODEX_HOME` का उपयोग करते हैं, इसलिए वे डिफ़ॉल्ट रूप से आपके personal
`~/.codex` को नहीं पढ़ते। सामान्य process `HOME` अब भी inherited होता है, इसलिए Codex
shared `$HOME/.agents/*` skills/plugin marketplace entries देख सकता है और
subprocesses user-home config और tokens खोज सकते हैं।

Interactive terminal में `openclaw migrate codex` चलाने पर full
plan का preview होता है, फिर final apply confirmation से पहले checkbox selectors खुलते हैं। Skill
copy items पहले prompt किए जाते हैं। Bulk selection के लिए `Toggle all on` या `Toggle all off` का उपयोग करें।
Rows toggle करने के लिए Space दबाएँ, या highlighted
row activate करके जारी रखने के लिए Enter दबाएँ। Planned skills checked शुरू होते हैं, conflict skills unchecked शुरू होते हैं, और
`Skip for now` इस run के लिए skill copies छोड़ देता है, जबकि plugin
selection जारी रहता है। जब source-installed curated Codex plugins migratable हों और
`--plugin` supplied न हो, तो migration फिर Plugin name द्वारा native Codex Plugin
activation के लिए prompt करता है। Plugin items
checked शुरू होते हैं जब तक target OpenClaw Codex Plugin config में वह
Plugin पहले से न हो। मौजूदा target plugins unchecked शुरू होते हैं और
`conflict: plugin exists` जैसा conflict hint दिखाते हैं; उस run में कोई native Codex
plugins migrate न करने के लिए `Toggle all off` चुनें, या applying से पहले रुकने के लिए `Skip for now` चुनें। Scripted या
exact runs के लिए, प्रति skill एक बार `--skill <name>` पास करें, उदाहरण के लिए:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Native Codex Plugin migration को non-interactively एक या अधिक source-installed curated plugins तक सीमित करने के लिए
`--plugin <name>` का उपयोग करें:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex क्या आयात करता है

- `$CODEX_HOME/skills` के अंतर्गत Codex CLI skill directories, Codex के
  `.system` cache को छोड़कर।
- `$HOME/.agents/skills` के अंतर्गत personal AgentSkills, जब आप per-agent ownership चाहते हैं तो current
  OpenClaw agent workspace में copy किए जाते हैं।
- Codex app-server `plugin/list` के माध्यम से खोजे गए source-installed `openai-curated` Codex plugins।
  Planning हर enabled installed Plugin के लिए `plugin/read` पढ़ता है।
  App-backed plugins के लिए source Codex app-server
  account response का ChatGPT subscription account होना आवश्यक है; non-ChatGPT या missing
  account responses को `codex_subscription_required` के साथ skip किया जाता है। डिफ़ॉल्ट रूप से,
  migration source `app/list` call नहीं करता, इसलिए account gate पास करने वाले app-backed plugins
  source app accessibility verification के बिना planned होते हैं, और
  account lookup transport failures `codex_account_unavailable` के साथ skip होते हैं। जब आप migration से ताज़ा source
  `app/list` snapshot force कराना चाहते हों और native activation plan करने से पहले हर owned app का present, enabled, और
  accessible होना require करना चाहते हों, तब
  `--verify-plugin-apps` पास करें। उस mode में, account lookup
  transport failures source app inventory verification में fall through करते हैं। Current process के लिए
  source app inventory snapshot memory में रखा जाता है; इसे
  migration output या target config में नहीं लिखा जाता। Disabled plugins,
  unreadable Plugin details, subscription-gated source accounts, और, जब
  verification requested हो, missing apps, disabled apps, inaccessible apps, या
  source app inventory failures target config entries के बजाय typed reasons वाले manual skipped items
  बनते हैं।
  Apply हर selected eligible Plugin के लिए app-server `plugin/install` call करता है,
  भले ही target app-server पहले से उस Plugin को installed और
  enabled रिपोर्ट करे। Migrated Codex plugins केवल उन sessions में usable होते हैं जो
  native Codex harness चुनते हैं; उन्हें OpenClaw provider runs,
  ACP conversation bindings, या अन्य harnesses के लिए expose नहीं किया जाता।

### Manual-review Codex state

Codex `config.toml`, native `hooks/hooks.json`, non-curated marketplaces, cached
Plugin bundles जो source-installed curated plugins नहीं हैं, और source-installed
plugins जो source subscription gate fail करते हैं, automatically activated नहीं होते।
जब `--verify-plugin-apps` set हो, तो source app-inventory
gate fail करने वाले plugins भी skip किए जाते हैं। उन्हें manual review के लिए
migration report में copy या report किया जाता है।

Migrated source-installed curated plugins के लिए, apply लिखता है:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- हर selected Plugin के लिए `marketplaceName: "openai-curated"` और
  `pluginName` वाली एक explicit Plugin entry

माइग्रेशन कभी भी `plugins["*"]` नहीं लिखता और स्थानीय marketplace cache
paths कभी संग्रहित नहीं करता। स्रोत-पक्ष subscription विफलताएं manual items पर typed
reasons जैसे `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled`, या `plugin_read_unavailable` के साथ रिपोर्ट की जाती हैं। `--verify-plugin-apps` के साथ,
source app-inventory विफलताएं `app_inaccessible`,
`app_disabled`, `app_missing`, या `app_inventory_unavailable` के रूप में भी दिखाई दे सकती हैं। छोड़े गए plugins
target config में नहीं लिखे जाते।
Target-पक्ष auth-required installs प्रभावित plugin item पर
`status: "skipped"`, `reason: "auth_required"`, और sanitized app identifiers के साथ रिपोर्ट किए जाते हैं।
उनकी explicit config entries तब तक disabled लिखी जाती हैं जब तक आप उन्हें फिर से authorize और
enable नहीं करते। अन्य install विफलताएं item-scoped `error` results होती हैं।

यदि planning के दौरान Codex app-server plugin inventory अनुपलब्ध है, तो migration
पूरे migration को विफल करने के बजाय cached bundle advisory items पर fallback करता है।

## Hermes प्रदाता

Bundled Hermes प्रदाता default रूप से `~/.hermes` पर state detect करता है। जब Hermes कहीं और हो, तो `--from <path>` का उपयोग करें।

### Hermes क्या import करता है

- `config.yaml` से default model configuration।
- `providers` और `custom_providers` से configured model providers और custom OpenAI-compatible endpoints।
- `mcp_servers` या `mcp.servers` से MCP server definitions।
- OpenClaw agent workspace में `SOUL.md` और `AGENTS.md`।
- Workspace memory files में append किए गए `memories/MEMORY.md` और `memories/USER.md`।
- OpenClaw file memory के लिए memory config defaults, साथ ही Honcho जैसे external memory providers के लिए archive या manual-review items।
- वे Skills जिनमें `skills/<name>/` के अंतर्गत `SKILL.md` file शामिल है।
- `skills.config` से per-skill config values।
- OpenCode `auth.json` से OpenCode OpenAI OAuth credentials, जब interactive credential migration स्वीकार किया जाता है, या जब `--include-secrets` set होता है। Hermes `auth.json` OAuth entries legacy state हैं जिन्हें manual OpenAI reauth या doctor repair के लिए report किया जाता है।
- Hermes `.env` और OpenCode `auth.json` से supported API keys और tokens, जब interactive credential migration स्वीकार किया जाता है, या जब `--include-secrets` set होता है।

### Supported `.env` keys

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Archive-only state

Hermes state जिसे OpenClaw सुरक्षित रूप से interpret नहीं कर सकता, manual review के लिए migration report में copy किया जाता है, लेकिन इसे live OpenClaw config या credentials में load नहीं किया जाता। यह opaque या unsafe state को सुरक्षित रखता है, बिना यह दिखावा किए कि OpenClaw उसे automatically execute या trust कर सकता है:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### Apply करने के बाद

```bash
openclaw doctor
```

## Plugin contract

Migration sources plugins हैं। कोई plugin `openclaw.plugin.json` में अपने provider ids declare करता है:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Runtime पर plugin `api.registerMigrationProvider(...)` call करता है। Provider `detect`, `plan`, और `apply` implement करता है। Core CLI orchestration, backup policy, prompts, JSON output, और conflict preflight का owner है। Core reviewed plan को `apply(ctx, plan)` में pass करता है, और providers compatibility के लिए plan को केवल तभी rebuild कर सकते हैं जब वह argument absent हो।

Provider plugins item construction और summary counts के लिए `openclaw/plugin-sdk/migration`, साथ ही conflict-aware file copies, archive-only report copies, cached config-runtime wrappers, और migration reports के लिए `openclaw/plugin-sdk/migration-runtime` का उपयोग कर सकते हैं।

## Onboarding integration

जब कोई provider known source detect करता है, तो onboarding migration offer कर सकती है। `openclaw onboard --flow import` और `openclaw setup --wizard --import-from hermes` दोनों वही plugin migration provider उपयोग करते हैं और apply करने से पहले अभी भी preview दिखाते हैं।

<Note>
Onboarding imports के लिए fresh OpenClaw setup आवश्यक है। यदि आपके पास पहले से local state है, तो पहले config, credentials, sessions, और workspace reset करें। Backup-plus-overwrite या merge imports existing setups के लिए feature-gated हैं।
</Note>

## Related

- [Hermes से migration](/hi/install/migrating-hermes): user-facing walkthrough।
- [Claude से migration](/hi/install/migrating-claude): user-facing walkthrough।
- [Migrating](/hi/install/migrating): OpenClaw को नई machine पर move करें।
- [Doctor](/hi/gateway/doctor): migration apply करने के बाद health check।
- [Plugins](/hi/tools/plugin): plugin install और registration।
