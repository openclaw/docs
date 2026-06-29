---
read_when:
    - आप एक स्थानीय AI CLI बैकएंड Plugin बना रहे हैं
    - आप `acme-cli/model` जैसे मॉडल संदर्भों के लिए एक बैकएंड पंजीकृत करना चाहते हैं
    - आपको किसी तृतीय-पक्ष CLI को OpenClaw के टेक्स्ट फ़ॉलबैक रनर में मैप करना होगा
sidebarTitle: CLI backend plugins
summary: एक plugin बनाएँ जो स्थानीय AI CLI backend पंजीकृत करता है
title: CLI बैकएंड Plugin बनाना
x-i18n:
    generated_at: "2026-06-28T23:32:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI बैकएंड Plugin OpenClaw को स्थानीय AI CLI को टेक्स्ट इन्फरेंस
बैकएंड के रूप में कॉल करने देते हैं। बैकएंड मॉडल refs में provider प्रीफ़िक्स के रूप में दिखाई देता है:

```text
acme-cli/acme-large
```

CLI बैकएंड का उपयोग तब करें जब upstream एकीकरण पहले से किसी स्थानीय
command के रूप में उपलब्ध हो, जब CLI स्थानीय लॉगिन स्थिति का स्वामी हो, या जब API providers अनुपलब्ध हों तो CLI एक उपयोगी
fallback हो।

<Info>
  यदि upstream सेवा सामान्य HTTP मॉडल API उपलब्ध कराती है, तो इसके बजाय
  [provider plugin](/hi/plugins/sdk-provider-plugins) लिखें। यदि upstream
  runtime पूर्ण एजेंट सेशन, टूल events, compaction, या पृष्ठभूमि
  task स्थिति का स्वामी है, तो [agent harness](/hi/plugins/sdk-agent-harness) का उपयोग करें।
</Info>

## Plugin क्या स्वामित्व रखता है

CLI बैकएंड Plugin के तीन contracts होते हैं:

| Contract             | फ़ाइल                  | उद्देश्य                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| पैकेज entry          | `package.json`         | OpenClaw को plugin runtime module की ओर इंगित करता है     |
| Manifest ownership   | `openclaw.plugin.json` | runtime लोड होने से पहले backend id घोषित करता है         |
| Runtime registration | `index.ts`             | command defaults के साथ `api.registerCliBackend(...)` कॉल करता है |

manifest discovery metadata है। यह CLI execute नहीं करता और
runtime behavior register नहीं करता। Runtime behavior तब शुरू होता है जब plugin entry
`api.registerCliBackend(...)` कॉल करती है।

## न्यूनतम बैकएंड Plugin

<Steps>
  <Step title="पैकेज metadata बनाएँ">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    प्रकाशित packages को built JavaScript runtime files ship करनी चाहिए। यदि आपका source
    entry `./src/index.ts` है, तो `openclaw.runtimeExtensions` जोड़ें जो
    built JavaScript peer की ओर इंगित करे। [Entry points](/hi/plugins/sdk-entrypoints) देखें।

  </Step>

  <Step title="बैकएंड ownership घोषित करें">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "OpenClaw के ज़रिए Acme का स्थानीय AI CLI चलाएँ",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` runtime ownership सूची है। यह OpenClaw को तब plugin auto-load करने देता है
    जब config या model selection में `acme-cli/...` का उल्लेख हो।

    `setup.cliBackends` descriptor-first setup surface है। इसे तब जोड़ें जब
    model discovery, onboarding, या status को plugin runtime लोड किए बिना
    backend पहचानना चाहिए। `requiresRuntime: false` का उपयोग केवल तब करें जब वे static
    descriptors setup के लिए पर्याप्त हों।

  </Step>

  <Step title="बैकएंड register करें">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "OpenClaw के ज़रिए Acme का स्थानीय AI CLI चलाएँ",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    backend id को manifest `cliBackends` entry से मेल खाना चाहिए। registered
    `config` केवल default है; `agents.defaults.cliBackends.acme-cli` के अंतर्गत user config
    runtime पर इसके ऊपर merge किया जाता है।

  </Step>
</Steps>

## Config shape

`CliBackendConfig` बताता है कि OpenClaw को CLI कैसे launch और parse करनी चाहिए:

| Field                                     | उपयोग                                                       |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Binary name या absolute command path                        |
| `args`                                    | fresh runs के लिए base argv                                 |
| `resumeArgs`                              | resumed sessions के लिए alternate argv; `{sessionId}` support करता है |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl`, या `text`                          |
| `input`                                   | Prompt transport: `arg` या `stdin`                          |
| `modelArg`                                | model id से पहले उपयोग किया जाने वाला flag                  |
| `modelAliases`                            | OpenClaw model ids को CLI-native ids पर map करें            |
| `sessionArg` / `sessionArgs`              | session id pass करने का तरीका                               |
| `sessionMode`                             | `always`, `existing`, या `none`                             |
| `sessionIdFields`                         | JSON fields जिन्हें OpenClaw CLI output से पढ़ता है         |
| `systemPromptArg` / `systemPromptFileArg` | System prompt transport                                     |
| `systemPromptWhen`                        | `first`, `always`, या `never`                               |
| `imageArg` / `imageMode`                  | Image path support                                          |
| `serialize`                               | same-backend runs को ordered रखें                           |
| `reliability.watchdog`                    | no-output timeout tuning                                    |

CLI से मेल खाने वाला सबसे छोटा static config पसंद करें। plugin callbacks
केवल उस behavior के लिए जोड़ें जो सचमुच backend से संबंधित हो।

## उन्नत बैकएंड hooks

`CliBackendPlugin` यह भी define कर सकता है:

| Hook                               | उपयोग                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | merge के बाद legacy user config rewrite करें                                  |
| `resolveExecutionArgs(ctx)`        | thinking effort या side-question isolation जैसे request-scoped flags जोड़ें   |
| `prepareExecution(ctx)`            | launch से पहले temporary auth या config bridges बनाएँ                         |
| `transformSystemPrompt(ctx)`       | अंतिम CLI-specific system prompt transform लागू करें                          |
| `textTransforms`                   | Bidirectional prompt/output replacements                                      |
| `defaultAuthProfileId`             | किसी specific OpenClaw auth profile को preference दें                         |
| `authEpochMode`                    | तय करें कि auth changes stored CLI sessions को कैसे invalidate करते हैं       |
| `nativeToolMode`                   | घोषित करें कि CLI में always-on native tools हैं या नहीं                      |
| `sideQuestionToolMode`             | `/btw` side questions के लिए disabled native tools घोषित करें                 |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw के loopback MCP tool bridge में opt in करें                          |
| `ownsNativeCompaction`             | Backend अपनी compaction का स्वामी है - OpenClaw defer करता है                 |

इन hooks को provider-owned रखें। जब backend hook behavior व्यक्त कर सकता हो, तो core में
CLI-specific branches न जोड़ें।

`ctx.executionMode` सामान्य turns के लिए `"agent"` और
ephemeral `/btw` calls के लिए `"side-question"` होता है। इसका उपयोग तब करें जब CLI को अलग one-shot flags चाहिए हों, जैसे
BTW के लिए native tools, session persistence, या resume behavior disable करना। यदि कोई
backend सामान्यतः `nativeToolMode: "always-on"` रखता है लेकिन उसका side-question argv
उन tools को भरोसेमंद रूप से disable करता है, तो `sideQuestionToolMode: "disabled"` भी set करें;
अन्यथा जब BTW को no-tools CLI run चाहिए होता है तो OpenClaw fail closed करता है।

### `ownsNativeCompaction`: OpenClaw compaction से opt out करना

यदि आपका backend ऐसा agent चलाता है जो अपने **स्वयं** के transcript को compact करता है, तो
`ownsNativeCompaction: true` set करें ताकि OpenClaw का safeguard summarizer उसकी
sessions के विरुद्ध कभी न चले - CLI compaction lifecycle no-op लौटाता है और turn आगे बढ़ता है। `claude-cli`
इसे घोषित करता है क्योंकि Claude Code बिना harness endpoint के internally compact करता है। Native-harness
sessions जैसे Codex इसके बजाय अपने harness compaction endpoint पर route होते रहते हैं।

**इसे केवल तब घोषित करें जब नीचे की सभी बातें सही हों**, अन्यथा deferred over-budget session
budget से ऊपर रह सकता है / stale हो सकता है (OpenClaw अब उसे rescue नहीं करता):

- backend अपनी window के पास पहुँचते समय भरोसेमंद रूप से अपने transcript को compact या bound करता है;
- यह resumable session persist करता है ताकि compacted state turns के बीच बची रहे
  (उदा. `--resume` / `--session-id`);
- यह native-harness compaction session नहीं है - matching `agentHarnessId` sessions
  इसके बजाय harness endpoint पर route होते हैं।

## MCP tool bridge

CLI backends को default रूप से OpenClaw tools नहीं मिलते। यदि CLI कोई
MCP configuration consume कर सकता है, तो स्पष्ट रूप से opt in करें:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Supported bridge modes हैं:

| Mode                     | उपयोग                                                           |
| ------------------------ | --------------------------------------------------------------- |
| `claude-config-file`     | CLIs जो MCP config file स्वीकार करते हैं                        |
| `codex-config-overrides` | CLIs जो argv पर config overrides स्वीकार करते हैं               |
| `gemini-system-settings` | CLIs जो अपने system settings directory से MCP settings पढ़ते हैं |

bridge केवल तब enable करें जब CLI सचमुच उसे consume कर सकता हो। यदि CLI की
अपनी built-in tool layer है जिसे disable नहीं किया जा सकता, तो `nativeToolMode:
"always-on"` set करें ताकि जब caller को no native tools चाहिए हों तो OpenClaw fail closed कर सके।

## User configuration

Users किसी भी backend default को override कर सकते हैं:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

उस न्यूनतम override को document करें जिसकी users को संभवतः जरूरत होगी। आम तौर पर यह केवल
`command` होता है जब binary `PATH` से बाहर हो।

## सत्यापन

bundled Plugin के लिए, बिल्डर और सेटअप पंजीकरण के आसपास एक केंद्रित टेस्ट जोड़ें,
फिर Plugin की लक्षित टेस्ट लेन चलाएँ:

```bash
pnpm test extensions/acme-cli
```

स्थानीय या इंस्टॉल किए गए Plugin के लिए, डिस्कवरी और एक वास्तविक मॉडल रन सत्यापित करें:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

अगर बैकएंड इमेज या MCP का समर्थन करता है, तो एक लाइव स्मोक जोड़ें जो वास्तविक CLI के साथ
उन पाथ को साबित करे। प्रॉम्प्ट, इमेज, MCP, या सत्र-रिज्यूम व्यवहार के लिए स्थिर निरीक्षण पर निर्भर न रहें।

## चेकलिस्ट

<Check>`package.json` में प्रकाशित पैकेजों के लिए `openclaw.extensions` और निर्मित runtime एंट्रियाँ हैं</Check>
<Check>`openclaw.plugin.json` `cliBackends` और आशयित `activation.onStartup` घोषित करता है</Check>
<Check>जब सेटअप/मॉडल डिस्कवरी को बैकएंड को cold देखना चाहिए, तब `setup.cliBackends` मौजूद है</Check>
<Check>`api.registerCliBackend(...)` manifest के समान बैकएंड id का उपयोग करता है</Check>
<Check>`agents.defaults.cliBackends.<id>` के अंतर्गत उपयोगकर्ता ओवरराइड अब भी जीतते हैं</Check>
<Check>सत्र, सिस्टम प्रॉम्प्ट, इमेज, और आउटपुट पार्सर सेटिंग्स वास्तविक CLI अनुबंध से मेल खाती हैं</Check>
<Check>लक्षित टेस्ट और कम से कम एक लाइव CLI स्मोक बैकएंड पाथ को साबित करते हैं</Check>

## संबंधित

- [CLI बैकएंड](/hi/gateway/cli-backends) - उपयोगकर्ता कॉन्फ़िगरेशन और runtime व्यवहार
- [Plugin बनाना](/hi/plugins/building-plugins) - पैकेज और manifest की मूल बातें
- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview) - पंजीकरण API संदर्भ
- [Plugin manifest](/hi/plugins/manifest) - `cliBackends` और सेटअप descriptor
- [एजेंट हार्नेस](/hi/plugins/sdk-agent-harness) - पूर्ण बाहरी एजेंट runtime
