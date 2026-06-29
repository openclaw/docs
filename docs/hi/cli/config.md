---
read_when:
    - आप config को non-interactively पढ़ना या संपादित करना चाहते हैं
sidebarTitle: Config
summary: '`openclaw config` के लिए CLI संदर्भ (get/set/patch/unset/file/schema/validate)'
title: कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-06-28T22:47:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` में non-interactive संपादनों के लिए config helpers: path के अनुसार values get/set/patch/unset/file/schema/validate करें और active config file print करें। configure wizard खोलने के लिए subcommand के बिना चलाएँ (`openclaw configure` जैसा ही)।

<Note>
जब `OPENCLAW_NIX_MODE=1` होता है, OpenClaw `openclaw.json` को immutable मानता है। `config get`, `config file`, `config schema`, और `config validate` जैसे read-only commands फिर भी काम करते हैं, लेकिन config writers अस्वीकार कर देते हैं। एजेंट्स को इसके बजाय install के लिए Nix source edit करना चाहिए; first-party nix-openclaw distribution के लिए, [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) उपयोग करें और values को `programs.openclaw.config` या `instances.<name>.config` के अंतर्गत set करें।
</Note>

## Root options

<ParamField path="--section <section>" type="string">
  जब आप `openclaw config` को subcommand के बिना चलाते हैं, तब repeatable guided-setup section filter।
</ParamField>

Supported guided sections: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## उदाहरण

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json` के लिए generated JSON schema को stdout पर JSON के रूप में print करें।

<AccordionGroup>
  <Accordion title="What it includes">
    - वर्तमान root config schema, और editor tooling के लिए root `$schema` string field।
    - Control UI द्वारा उपयोग किया गया field `title` और `description` docs metadata।
    - Nested object, wildcard (`*`), और array-item (`[]`) nodes, matching field documentation मौजूद होने पर वही `title` / `description` metadata inherit करते हैं।
    - matching field documentation मौजूद होने पर `anyOf` / `oneOf` / `allOf` branches भी वही docs metadata inherit करती हैं।
    - जब runtime manifests load किए जा सकते हैं, तब best-effort live Plugin + channel schema metadata।
    - वर्तमान config invalid होने पर भी clean fallback schema।

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` एक normalized config path लौटाता है, जिसमें shallow schema node (`title`, `description`, `type`, `enum`, `const`, common bounds), matched UI hint metadata, और immediate child summaries होते हैं। इसे Control UI या custom clients में path-scoped drill-down के लिए उपयोग करें।
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

जब आप इसे अन्य tools से inspect या validate करना चाहते हैं, तो इसे file में pipe करें:

```bash
openclaw config schema > openclaw.schema.json
```

### Paths

Paths dot या bracket notation का उपयोग करते हैं। Shell examples में bracket-notation paths को quote करें ताकि zsh जैसे shells, OpenClaw को path मिलने से पहले `[0]` को glob के रूप में expand न करें:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

किसी specific agent को target करने के लिए agent list index का उपयोग करें:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Values

जहाँ संभव हो, values को JSON5 के रूप में parse किया जाता है; अन्यथा उन्हें strings माना जाता है। बिना string fallback के standard JSON parsing require करने के लिए `--strict-json` उपयोग करें। `--json`, `--strict-json` के legacy alias के रूप में supported रहता है।

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

जब `--strict-json` enabled होता है, तो comments, trailing commas, या unquoted object keys जैसी JSON5-only syntax reject की जाती है। raw-string fallback के साथ JSON5 value parsing के लिए `--strict-json` omit करें।

`config get <path> --json` terminal-formatted text के बजाय raw value को JSON के रूप में print करता है।

<Note>
Object assignment default रूप से target path को replace करता है। Protected map/list paths जो आम तौर पर user-added entries रखते हैं, जैसे `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, और `auth.profiles`, ऐसी replacements से इनकार करते हैं जो existing entries को remove कर देंगी, जब तक आप `--replace` pass न करें।
</Note>

उन maps में entries जोड़ते समय `--merge` उपयोग करें:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

`--replace` केवल तब उपयोग करें जब आप जानबूझकर provided value को complete target value बनाना चाहते हों।

## `config set` modes

`openclaw config set` चार assignment styles support करता है:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    Provider builder mode केवल `secrets.providers.<alias>` paths को target करता है:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
SecretRef assignments unsupported runtime-mutable surfaces पर reject किए जाते हैं (उदाहरण के लिए `hooks.token`, `commands.ownerDisplaySecret`, Discord thread-binding webhook tokens, और WhatsApp creds JSON)। [SecretRef Credential Surface](/hi/reference/secretref-credential-surface) देखें।
</Warning>

Batch parsing हमेशा batch payload (`--batch-json`/`--batch-file`) को source of truth के रूप में उपयोग करती है। `--strict-json` / `--json` batch parsing behavior नहीं बदलते।

## `config patch`

जब आप कई path-based `config set` commands चलाने के बजाय config-shaped patch paste या pipe करना चाहते हों, तो `config patch` उपयोग करें। Input एक JSON5 object है। Objects recursively merge होते हैं, arrays और scalar values target value को replace करते हैं, और `null` target path delete करता है।

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

आप stdin पर patch pipe भी कर सकते हैं, जो remote setup scripts के लिए उपयोगी है:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Example patch:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

जब एक object या array को recursively patched होने के बजाय exactly provided value बनना हो, तो `--replace-path <path>` उपयोग करें:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` लिखे बिना schema और SecretRef resolvability checks चलाता है। Exec-backed SecretRefs dry-run के दौरान default रूप से skipped होते हैं; जब आप जानबूझकर dry-run से provider commands execute करवाना चाहते हों, तो `--allow-exec` जोड़ें।

JSON path/value mode SecretRefs और providers, दोनों के लिए supported रहता है:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider builder flags

Provider builder targets को path के रूप में `secrets.providers.<alias>` उपयोग करना ही होगा।

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repeatable)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (required)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (required)
    - `--provider-arg <arg>` (repeatable)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (repeatable)
    - `--provider-pass-env <ENV_VAR>` (repeatable)
    - `--provider-trusted-dir <path>` (repeatable)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Hardened exec provider example:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

`openclaw.json` लिखे बिना changes validate करने के लिए `--dry-run` उपयोग करें।

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="ड्राई-रन व्यवहार">
    - बिल्डर मोड: बदले गए refs/providers के लिए SecretRef resolvability जांचें चलाता है।
    - JSON मोड (`--strict-json`, `--json`, या बैच मोड): स्कीमा सत्यापन और SecretRef resolvability जांचें चलाता है।
    - ज्ञात असमर्थित SecretRef लक्ष्य सतहों के लिए नीति सत्यापन भी चलता है।
    - नीति जांचें पूरे post-change config का मूल्यांकन करती हैं, इसलिए parent-object writes (उदाहरण के लिए `hooks` को object के रूप में सेट करना) unsupported-surface validation को बाइपास नहीं कर सकते।
    - कमांड साइड इफेक्ट से बचने के लिए dry-run के दौरान Exec SecretRef जांचें डिफ़ॉल्ट रूप से छोड़ दी जाती हैं।
    - exec SecretRef जांचों में opt in करने के लिए `--dry-run` के साथ `--allow-exec` का उपयोग करें (यह provider commands निष्पादित कर सकता है)।
    - `--allow-exec` केवल dry-run के लिए है और `--dry-run` के बिना उपयोग करने पर त्रुटि देता है।

  </Accordion>
  <Accordion title="--dry-run --json फ़ील्ड">
    `--dry-run --json` मशीन-पठनीय रिपोर्ट प्रिंट करता है:

    - `ok`: क्या dry-run पास हुआ
    - `operations`: मूल्यांकित assignments की संख्या
    - `checks`: क्या schema/resolvability जांचें चलीं
    - `checks.resolvabilityComplete`: क्या resolvability जांचें पूर्णता तक चलीं (जब exec refs छोड़े जाते हैं तो false)
    - `refsChecked`: dry-run के दौरान वास्तव में resolved refs की संख्या
    - `skippedExecRefs`: छोड़े गए exec refs की संख्या क्योंकि `--allow-exec` सेट नहीं था
    - `errors`: जब `ok=false` हो, तब structured missing-path, schema, या resolvability विफलताएं

  </Accordion>
</AccordionGroup>

### JSON आउटपुट आकार

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="सफलता उदाहरण">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="विफलता उदाहरण">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="यदि dry-run विफल हो">
    - `config schema validation failed`: आपका post-change config shape अमान्य है; path/value या provider/ref object shape ठीक करें।
    - `Config policy validation failed: unsupported SecretRef usage`: उस credential को वापस plaintext/string input में ले जाएं और SecretRefs को केवल समर्थित सतहों पर रखें।
    - `SecretRef assignment(s) could not be resolved`: संदर्भित provider/ref वर्तमान में resolve नहीं हो सकता (missing env var, invalid file pointer, exec provider failure, या provider/source mismatch)।
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run ने exec refs छोड़ दिए; यदि आपको exec resolvability validation चाहिए तो `--allow-exec` के साथ फिर चलाएं।
    - बैच मोड के लिए, failing entries ठीक करें और लिखने से पहले `--dry-run` फिर चलाएं।

  </Accordion>
</AccordionGroup>

## लिखने की सुरक्षा

`openclaw config set` और अन्य OpenClaw-owned config writers पूरी post-change config को डिस्क पर commit करने से पहले validate करते हैं। यदि नया payload schema validation में विफल होता है या destructive clobber जैसा दिखता है, तो active config को बिना बदले छोड़ दिया जाता है और rejected payload को उसके पास `openclaw.json.rejected.*` के रूप में सहेजा जाता है।

<Warning>
active config path एक regular file होना चाहिए। Symlinked `openclaw.json` layouts writes के लिए unsupported हैं; इसके बजाय वास्तविक file की ओर सीधे point करने के लिए `OPENCLAW_CONFIG_PATH` का उपयोग करें।
</Warning>

छोटे edits के लिए CLI writes को प्राथमिकता दें:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

यदि write reject हो जाता है, तो saved payload देखें और full config shape ठीक करें:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Direct editor writes अभी भी allowed हैं, लेकिन running Gateway उन्हें validation तक untrusted मानता है। अमान्य direct edits startup fail करते हैं या hot reload द्वारा छोड़ दिए जाते हैं; Gateway `openclaw.json` को rewrite नहीं करता। prefixed/clobbered config को repair करने या last-known-good copy restore करने के लिए `openclaw doctor --fix` चलाएं। [Gateway troubleshooting](/hi/gateway/troubleshooting#gateway-rejected-invalid-config) देखें।

Whole-file recovery doctor repair के लिए reserved है। Plugin schema changes या `minHostVersion` skew, models, providers, auth profiles, channels, gateway exposure, tools, memory, browser, या cron config जैसी unrelated user settings को rollback करने के बजाय loud रहते हैं।

## उपकमांड

- `config file`: active config file path प्रिंट करें (`OPENCLAW_CONFIG_PATH` या default location से resolved)। path को regular file का नाम देना चाहिए, symlink का नहीं।

edits के बाद gateway restart करें।

## Validate

gateway शुरू किए बिना current config को active schema के विरुद्ध validate करें।

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` पास होने के बाद, आप उसी terminal से प्रत्येक change validate करते समय embedded agent से active config की docs से तुलना करवाने के लिए local TUI का उपयोग कर सकते हैं:

<Note>
यदि validation पहले से fail हो रहा है, तो `openclaw configure` या `openclaw doctor --fix` से शुरू करें। `openclaw chat` invalid-config guard को bypass नहीं करता।
</Note>

```bash
openclaw chat
```

फिर TUI के अंदर:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

सामान्य repair loop:

<Steps>
  <Step title="docs से तुलना करें">
    agent से कहें कि आपके current config की relevant docs page से तुलना करे और सबसे छोटा fix सुझाए।
  </Step>
  <Step title="लक्षित edits लागू करें">
    `openclaw config set` या `openclaw configure` के साथ targeted edits लागू करें।
  </Step>
  <Step title="फिर validate करें">
    प्रत्येक change के बाद `openclaw config validate` फिर चलाएं।
  </Step>
  <Step title="runtime issues के लिए Doctor">
    यदि validation पास हो जाता है लेकिन runtime अब भी unhealthy है, तो migration और repair help के लिए `openclaw doctor` या `openclaw doctor --fix` चलाएं।
  </Step>
</Steps>

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Configuration](/hi/gateway/configuration)
