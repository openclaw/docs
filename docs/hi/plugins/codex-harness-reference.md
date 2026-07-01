---
read_when:
    - आपको हर Codex harness config फ़ील्ड चाहिए
    - आप app-server परिवहन, प्रमाणीकरण, डिस्कवरी, या टाइमआउट व्यवहार बदल रहे हैं
    - आप Codex harness स्टार्टअप, मॉडल खोज, या environment isolation को डीबग कर रहे हैं
summary: Codex हार्नेस के लिए कॉन्फ़िगरेशन, प्रमाणीकरण, डिस्कवरी, और ऐप-सर्वर संदर्भ
title: Codex हार्नेस संदर्भ
x-i18n:
    generated_at: "2026-07-01T08:06:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

यह संदर्भ bundled `codex`
plugin के विस्तृत कॉन्फ़िगरेशन को कवर करता है। सेटअप और रूटिंग निर्णयों के लिए,
[Codex harness](/hi/plugins/codex-harness) से शुरू करें।

## Plugin कॉन्फ़िग सतह

सभी Codex harness सेटिंग्स `plugins.entries.codex.config` के अंतर्गत रहती हैं।

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

समर्थित शीर्ष-स्तरीय फ़ील्ड:

| फ़ील्ड                      | डिफ़ॉल्ट                  | अर्थ                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | सक्षम                  | Codex app-server `model/list` के लिए मॉडल डिस्कवरी सेटिंग्स।                                                                               |
| `appServer`                | managed stdio app-server | ट्रांसपोर्ट, कमांड, auth, approval, sandbox, और timeout सेटिंग्स।                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw dynamic tools को सीधे आरंभिक Codex tool context में रखने के लिए `"direct"` का उपयोग करें।                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server turns से हटाए जाने वाले अतिरिक्त OpenClaw dynamic tool नाम।                                                               |
| `codexPlugins`             | अक्षम                 | माइग्रेट किए गए source-installed curated plugins के लिए native Codex plugin/app समर्थन। [Native Codex plugins](/hi/plugins/codex-native-plugins) देखें। |
| `computerUse`              | अक्षम                 | Codex Computer Use सेटअप। [Codex Computer Use](/hi/plugins/codex-computer-use) देखें।                                                          |

## App-server ट्रांसपोर्ट

डिफ़ॉल्ट रूप से, OpenClaw bundled
plugin के साथ शिप किए गए managed Codex binary को शुरू करता है:

```bash
codex app-server --listen stdio://
```

यह app-server संस्करण को स्थानीय रूप से इंस्टॉल किए गए किसी अलग Codex CLI के बजाय bundled `codex` plugin से जोड़े रखता है। `appServer.command` केवल तब सेट करें जब आप जानबूझकर कोई अलग
executable चलाना चाहते हों।

पहले से चल रहे app-server के लिए, WebSocket ट्रांसपोर्ट का उपयोग करें:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

समर्थित `appServer` फ़ील्ड:

| फ़ील्ड                                         | डिफ़ॉल्ट                                                | अर्थ                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex शुरू करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | प्रबंधित Codex बाइनरी                                   | stdio ट्रांसपोर्ट के लिए निष्पादन योग्य फ़ाइल। प्रबंधित बाइनरी का उपयोग करने के लिए इसे सेट न करें।                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio ट्रांसपोर्ट के लिए आर्ग्युमेंट।                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | सेट नहीं                                                  | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | सेट नहीं                                                  | WebSocket ट्रांसपोर्ट के लिए बेयरर टोकन। कोई शाब्दिक स्ट्रिंग या `${CODEX_APP_SERVER_TOKEN}` जैसा SecretInput स्वीकार करता है।                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket हेडर। हेडर मान शाब्दिक स्ट्रिंग या SecretInput मान स्वीकार करते हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना विरासत में मिला वातावरण बनाने के बाद शुरू की गई stdio app-server प्रक्रिया से हटाए गए अतिरिक्त वातावरण चर नाम।                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | सेट नहीं                                                  | रिमोट Codex app-server वर्कस्पेस रूट। सेट होने पर, OpenClaw हल किए गए OpenClaw वर्कस्पेस से स्थानीय वर्कस्पेस रूट का अनुमान लगाता है, इस रिमोट रूट के अंतर्गत मौजूदा cwd सफ़िक्स को सुरक्षित रखता है, और केवल अंतिम app-server cwd Codex को भेजता है। यदि cwd हल किए गए OpenClaw वर्कस्पेस रूट के बाहर है, तो OpenClaw रिमोट app-server को gateway-स्थानीय पथ भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server नियंत्रण-प्लेन कॉल के लिए टाइमआउट।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा turn स्वीकार करने के बाद या turn-स्कोप वाले app-server अनुरोध के बाद शांत अवधि, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है।                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | टूल हैंडऑफ़, नेटिव टूल पूर्णता, टूल के बाद कच्ची assistant प्रगति, कच्ची reasoning पूर्णता, या reasoning प्रगति के बाद इस्तेमाल होने वाला पूर्णता-निष्क्रिय और प्रगति गार्ड, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है। इसका उपयोग विश्वसनीय या भारी वर्कलोड के लिए करें, जहाँ टूल के बाद synthesis अंतिम assistant रिलीज़ बजट से वैध रूप से अधिक समय तक शांत रह सकता है।                                |
| `mode`                                        | `"yolo"` जब तक स्थानीय Codex आवश्यकताएँ YOLO की अनुमति न दें | YOLO या guardian-समीक्षित निष्पादन के लिए प्रीसेट।                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` या अनुमत guardian approval policy       | थ्रेड शुरू करने, फिर से शुरू करने, और turn को भेजी गई नेटिव Codex approval policy।                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` या अनुमत guardian sandbox  | थ्रेड शुरू करने और फिर से शुरू करने को भेजा गया नेटिव Codex sandbox मोड। सक्रिय OpenClaw sandbox `danger-full-access` turn को Codex `workspace-write` तक सीमित करते हैं; turn नेटवर्क फ़्लैग OpenClaw sandbox egress का अनुसरण करता है।                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` या अनुमत guardian reviewer               | अनुमति होने पर Codex को नेटिव approval prompts की समीक्षा करने देने के लिए `"auto_review"` का उपयोग करें।                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | मौजूदा प्रक्रिया डायरेक्टरी                              | `/codex bind` द्वारा उपयोग किया जाने वाला वर्कस्पेस जब `--cwd` छोड़ा गया हो।                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | सेट नहीं                                                  | वैकल्पिक Codex app-server सेवा स्तर। `"priority"` fast-mode routing सक्षम करता है, `"flex"` flex processing का अनुरोध करता है, और `null` override साफ़ करता है। लेगेसी `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                                                 |
| `networkProxy`                                | अक्षम                                               | app-server कमांड के लिए Codex permissions-profile networking में ऑप्ट इन करें। OpenClaw चुना हुआ `permissions.<profile>.network` कॉन्फ़िग परिभाषित करता है और `sandbox` भेजने के बजाय इसे `default_permissions` से चुनता है।                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | पूर्वावलोकन ऑप्ट-इन जो Codex app-server 0.132.0 या नए के साथ OpenClaw sandbox-समर्थित Codex वातावरण पंजीकृत करता है, ताकि नेटिव Codex निष्पादन सक्रिय OpenClaw sandbox के अंदर चल सके।                                                                                                                                                                                                         |

`appServer.networkProxy` स्पष्ट है क्योंकि यह Codex sandbox अनुबंध बदलता है।
सक्षम होने पर, OpenClaw Codex थ्रेड कॉन्फ़िग में `features.network_proxy.enabled` और
`default_permissions` भी सेट करता है, ताकि उत्पन्न permission
profile Codex प्रबंधित networking शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw
profile body से collision-resistant `openclaw-network-<fingerprint>` profile नाम बनाता है;
`profileName` का उपयोग केवल तब करें जब स्थिर स्थानीय नाम आवश्यक हो।

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

यदि सामान्य app-server runtime `danger-full-access` होता, तो
`networkProxy` सक्षम करने से उत्पन्न permission profile के लिए workspace-शैली
फाइल सिस्टम पहुँच इस्तेमाल होती है। Codex प्रबंधित network enforcement sandboxed networking है,
इसलिए full-access profile outbound traffic की सुरक्षा नहीं करेगा।

Plugin पुराने या version रहित app-server handshakes को ब्लॉक करता है। Codex app-server
को स्थिर version `0.125.0` या नया रिपोर्ट करना होगा।

OpenClaw गैर-loopback WebSocket ऐप-सर्वर URL को remote मानता है और
`appServer.authToken` या `Authorization` header के जरिए पहचान-सहित WebSocket auth
की आवश्यकता रखता है। `appServer.authToken` और हर `appServer.headers.*` value
SecretInput हो सकती है; OpenClaw द्वारा ऐप-सर्वर start options बनाने से पहले
secrets runtime SecretRefs और env shorthand को resolve करता है, और unresolved
structured SecretRefs किसी token या header के भेजे जाने से पहले fail हो जाते हैं।
जब native Codex plugins configured होते हैं, OpenClaw उन plugins को install या
refresh करने के लिए connected ऐप-सर्वर के plugin control plane का उपयोग करता है
और फिर app inventory refresh करता है ताकि plugin-owned apps Codex thread को दिखें।
`app/list` अब भी authoritative inventory और metadata source है, लेकिन OpenClaw
policy यह तय करती है कि किसी listed accessible app के लिए `thread/start`
`config.apps[appId].enabled = true` भेजे या नहीं, भले ही Codex उसे अभी disabled
mark करता हो। Unknown या missing app ids fail-closed रहते हैं; यह path केवल
`plugin/install` के जरिए marketplace plugins activate करता है और inventory refresh
करता है। OpenClaw को केवल उन remote app-servers से connect करें जिन पर
OpenClaw-managed plugin installs और app inventory refreshes accept करने के लिए
trust किया गया हो।

## Approval और sandbox modes

Local stdio ऐप-सर्वर sessions default रूप से YOLO mode में होते हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यह trusted local operator posture unattended
OpenClaw turns और heartbeats को native approval prompts के बिना progress करने
देता है, जिनका उत्तर देने के लिए कोई मौजूद नहीं होता।

यदि Codex की local system requirements file implicit YOLO approval, reviewer,
या sandbox values को disallow करती है, तो OpenClaw implicit default को इसके
बजाय guardian मानता है और allowed guardian permissions select करता है।
`tools.exec.mode: "auto"` भी guardian-reviewed Codex approvals force करता है और
unsafe legacy `approvalPolicy: "never"` या `sandbox: "danger-full-access"`
overrides preserve नहीं करता; intentional no-approval posture के लिए
`tools.exec.mode: "full"` set करें। उसी requirements file में hostname-matching
`[[remote_sandbox_config]]` entries sandbox default decision के लिए honored होती
हैं।

Codex guardian-reviewed approvals के लिए `appServer.mode: "guardian"` set करें:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

`guardian` preset `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, और `sandbox: "workspace-write"` तक expand
होता है, जब वे values allowed हों। Individual policy fields `mode` को override
करते हैं। पुराना `guardian_subagent` reviewer value अब भी compatibility alias के
रूप में accepted है, लेकिन नए configs को `auto_review` उपयोग करना चाहिए।

जब OpenClaw sandbox active होता है, local Codex ऐप-सर्वर process अब भी Gateway
host पर चलता है। इसलिए OpenClaw उस turn के लिए Codex native Code Mode, user MCP
servers, और app-backed plugin execution को disable करता है, बजाय इसके कि Codex
host-side sandboxing को OpenClaw sandbox backend के equivalent माना जाए। Shell
access OpenClaw sandbox-backed dynamic tools जैसे `sandbox_exec` और
`sandbox_process` के जरिए expose होता है, जब normal exec/process tools available
हों।

Ubuntu/AppArmor hosts पर, जब आप active OpenClaw sandboxing के बिना native Codex
`workspace-write` intentional रूप से run करते हैं, तो shell command start होने से
पहले Codex bwrap `workspace-write` के तहत fail हो सकता है। यदि आपको
`bwrap: setting up uid map: Permission denied` या
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` दिखे, तो
`openclaw doctor` run करें और broad Docker container privileges देने के बजाय
OpenClaw service user के लिए reported host namespace policy ठीक करें। service
process के लिए scoped AppArmor profile को prefer करें; 
`kernel.apparmor_restrict_unprivileged_userns=0` fallback host-wide है और इसमें
security tradeoffs हैं।

## Sandboxed native execution

Stable default fail-closed है: active OpenClaw sandboxing native Codex execution
surfaces को disable करता है, जो अन्यथा Codex ऐप-सर्वर host से run होते।
`appServer.experimental.sandboxExecServer: true` केवल तब use करें जब आप OpenClaw
के sandbox backend के साथ Codex का remote environment support try करना चाहते हों।
इस preview path के लिए Codex ऐप-सर्वर 0.132.0 या newer आवश्यक है।

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

जब flag on हो और current OpenClaw session sandboxed हो, OpenClaw active sandbox
backed एक local loopback exec-server start करता है, उसे Codex ऐप-सर्वर के साथ
register करता है, और उस OpenClaw-owned environment के साथ Codex thread और turn
start करता है। यदि app-server environment register नहीं कर सकता, तो run host
execution पर silently fallback करने के बजाय fail closed होता है।

यह preview path केवल local है। Remote WebSocket ऐप-सर्वर loopback exec-server तक
नहीं पहुंच सकता, जब तक वह उसी host पर run न कर रहा हो, इसलिए OpenClaw उस
combination को reject करता है।

## Auth और environment isolation

Auth इस order में selected होता है:

1. agent के लिए explicit OpenClaw Codex auth profile।
2. उस agent के Codex home में app-server का existing account।
3. केवल local stdio app-server launches के लिए, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`, जब कोई app-server account present न हो और OpenAI auth अब
   भी required हो।

जब OpenClaw ChatGPT subscription-style Codex auth profile देखता है, तो यह spawned
Codex child process से `CODEX_API_KEY` और `OPENAI_API_KEY` remove करता है। इससे
Gateway-level API keys embeddings या direct OpenAI models के लिए available रहती
हैं, बिना native Codex app-server turns को गलती से API के जरिए bill कराए।

Explicit Codex API-key profiles और local stdio env-key fallback inherited
child-process env के बजाय app-server login use करते हैं। WebSocket app-server
connections को Gateway env API-key fallback receive नहीं होता; explicit auth
profile या remote app-server के own account का उपयोग करें।

Stdio app-server launches default रूप से OpenClaw का process environment inherit
करते हैं। OpenClaw Codex app-server account bridge own करता है और `CODEX_HOME`
को उस agent के OpenClaw state के तहत per-agent directory पर set करता है। इससे
Codex config, accounts, plugin cache/data, और thread state operator के personal
`~/.codex` home से leak होने के बजाय OpenClaw agent तक scoped रहते हैं।

OpenClaw normal local app-server launches के लिए `HOME` rewrite नहीं करता।
Codex-run subprocesses जैसे `openclaw`, `gh`, `git`, cloud CLIs, और shell
commands normal process home देखते हैं और user-home config और tokens खोज सकते
हैं। Codex `$HOME/.agents/skills` और `$HOME/.agents/plugins/marketplace.json` भी
discover कर सकता है; यह `.agents` discovery intentionally operator home के साथ
shared है और isolated `~/.codex` state से अलग है।

OpenClaw plugins और OpenClaw skill snapshots अब भी OpenClaw की own plugin
registry और skill loader से flow करते हैं। Personal Codex `~/.codex` assets ऐसा
नहीं करते। यदि आपके पास Codex home से उपयोगी Codex CLI skills या plugins हैं
जिन्हें OpenClaw agent का part बनना चाहिए, तो उन्हें explicitly inventory करें:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

यदि deployment को additional environment isolation चाहिए, तो वे variables
`appServer.clearEnv` में add करें:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` केवल spawned Codex ऐप-सर्वर child process को affect करता
है। OpenClaw local launch normalization के दौरान इस list से `CODEX_HOME` और
`HOME` remove करता है: `CODEX_HOME` per-agent रहता है, और `HOME` inherited रहता
है ताकि subprocesses normal user-home state use कर सकें।

## Dynamic tools

Codex dynamic tools default रूप से `searchable` loading करते हैं। OpenClaw उन
dynamic tools को expose नहीं करता जो Codex-native workspace operations duplicate
करते हैं:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

अधिकांश remaining OpenClaw integration tools, जैसे messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond`, और `web_search`, `openclaw`
namespace के तहत Codex tool search के जरिए available हैं। इससे initial model
context छोटा रहता है। `sessions_yield` और message-tool-only source replies direct
रहते हैं क्योंकि वे turn-control contracts हैं। `sessions_spawn` searchable रहता
है ताकि Codex का native `spawn_agent` primary Codex subagent surface बना रहे,
जबकि explicit OpenClaw या ACP delegation अब भी `openclaw` dynamic tool namespace
के जरिए available है।

`codexDynamicToolsLoading: "direct"` केवल तब set करें जब custom Codex app-server
से connect कर रहे हों जो deferred dynamic tools search नहीं कर सकता, या full
tool payload debug करते समय।

## Timeouts

OpenClaw-owned dynamic tool calls `appServer.requestTimeoutMs` से independently
bounded हैं। हर Codex `item/tool/call` request इस order में पहला available
timeout use करती है:

- Positive per-call `timeoutMs` argument।
- `image_generate` के लिए, `agents.defaults.imageGenerationModel.timeoutMs`।
- Configured timeout के बिना `image_generate` के लिए, 120 second
  image-generation default।
- Media-understanding `image` tool के लिए, `tools.media.image.timeoutSeconds` को
  milliseconds में converted, या 60 second media default। Image understanding के
  लिए, यह request itself पर apply होता है और earlier preparation work से reduced
  नहीं होता।
- 90 second dynamic-tool default।

यह watchdog outer dynamic `item/tool/call` budget है। Provider-specific request
timeouts उस call के अंदर run होते हैं और अपनी timeout semantics रखते हैं।
Dynamic tool budgets 600000 ms पर capped हैं। Timeout पर, OpenClaw जहां supported
हो tool signal abort करता है और Codex को failed dynamic-tool response return करता
है ताकि turn session को `processing` में छोड़े बिना continue कर सके।

Codex द्वारा turn accept करने के बाद, और OpenClaw द्वारा turn-scoped app-server
request का response देने के बाद, harness अपेक्षा करता है कि Codex current-turn
progress करे और अंततः native turn को `turn/completed` के साथ finish करे। यदि
app-server `appServer.turnCompletionIdleTimeoutMs` तक quiet रहता है, OpenClaw
best-effort Codex turn interrupt करता है, diagnostic timeout record करता है, और
OpenClaw session lane release करता है ताकि follow-up chat messages stale native
turn के पीछे queued न रहें।

अधिकांश non-terminal सूचनाएं उसी turn के लिए उस छोटे watchdog को disarm कर देती हैं
क्योंकि Codex ने सिद्ध कर दिया है कि turn अभी भी alive है। Tool handoff एक लंबे
post-tool idle budget का उपयोग करते हैं: OpenClaw द्वारा `item/tool/call` response लौटाने के बाद, `commandExecution` जैसे
native tool items पूरे होने के बाद, raw
`custom_tool_call_output` completions के बाद, और post-tool raw assistant
progress, raw reasoning completions, या reasoning progress के बाद। Guard
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` का उपयोग करता है जब वह configured हो और
अन्यथा पांच मिनट पर default करता है। वही post-tool budget उस
silent synthesis window के लिए progress watchdog को भी बढ़ाता है, इससे पहले कि Codex अगला
current-turn event emit करे। Reasoning completions, commentary
`agentMessage` completions, और pre-tool raw reasoning या assistant progress के बाद
automatic final reply आ सकता है, इसलिए वे session lane को तुरंत release करने के बजाय
post-progress reply guard का उपयोग करते हैं। केवल
final/non-commentary completed `agentMessage` items और pre-tool raw assistant
completions assistant-output release को arm करते हैं: यदि Codex फिर
`turn/completed` के बिना शांत हो जाता है, तो OpenClaw best-effort native turn को interrupt करता है और
session lane को release करता है। Replay-safe stdio app-server failures, जिनमें
assistant, tool, active-item, या side-effect evidence के बिना turn-completion idle timeouts शामिल हैं,
fresh app-server attempt पर एक बार retry किए जाते हैं। Unsafe
timeouts फिर भी अटके हुए app-server client को retire करते हैं और OpenClaw
session lane को release करते हैं। वे stale native thread binding को automatic replay करने के बजाय
clear भी करते हैं। Completion-watch timeouts Codex-specific timeout
text दिखाते हैं: replay-safe cases कहते हैं कि response incomplete हो सकता है, जबकि unsafe cases
user को retry करने से पहले current state verify करने को कहते हैं। Public timeout diagnostics में
last app-server notification method,
raw assistant response item id/type/role, active request/item counts, और armed
watch state जैसे structural fields शामिल होते हैं। जब last notification raw assistant response item होती है, तो वे
bounded assistant text preview भी शामिल करते हैं। वे raw prompt या
tool content शामिल नहीं करते।

## Model discovery

Default रूप से, Codex plugin app-server से available models पूछता है। Model
availability Codex app-server के स्वामित्व में है, इसलिए list तब बदल सकती है जब OpenClaw
bundled `@openai/codex` version को upgrade करता है या जब deployment
`appServer.command` को किसी अलग Codex binary पर point करता है। Availability
account-scoped भी हो सकती है। उस harness और account के लिए live catalog देखने हेतु running gateway पर
`/codex models` का उपयोग करें।

यदि discovery fail होती है या time out होती है, तो OpenClaw इनके लिए bundled fallback catalog उपयोग करता है:

- GPT-5.5
- GPT-5.4 mini

Current bundled harness `@openai/codex` `0.142.4` है। GPT-5.6-enabled workspace में उस bundled app-server के विरुद्ध `model/list` probe ने ये
public picker rows लौटाईं:

| Model id              | Input modalities | Reasoning efforts                    |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh             |

GPT-5.6 access limited preview के दौरान account-scoped है। `max` एक model
reasoning effort है। `ultra` अलग Codex multi-agent orchestration metadata है,
standard OpenAI reasoning effort नहीं।

Internal या specialized flows के लिए hidden models app-server catalog द्वारा लौटाए जा सकते हैं, लेकिन वे normal model-picker choices नहीं हैं।

Discovery को `plugins.entries.codex.config.discovery` के अंतर्गत tune करें:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

जब आप चाहते हैं कि startup Codex को probe करने से बचे और केवल
fallback catalog का उपयोग करे, तो discovery disable करें:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Workspace bootstrap files

Codex `AGENTS.md` को native project-doc discovery के माध्यम से स्वयं handle करता है। OpenClaw
synthetic Codex project-doc files नहीं लिखता या persona files के लिए Codex fallback
filenames पर निर्भर नहीं करता, क्योंकि Codex fallbacks केवल तब apply होते हैं जब
`AGENTS.md` missing हो।

OpenClaw workspace parity के लिए, Codex harness अन्य bootstrap
files को resolve करता है। `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, और `USER.md` को
OpenClaw Codex developer instructions के रूप में forward किया जाता है क्योंकि वे active agent,
available workspace guidance, और user profile define करते हैं। Compact OpenClaw skills
list को turn-scoped collaboration developer instructions के रूप में forward किया जाता है।
`HEARTBEAT.md` content inject नहीं किया जाता; heartbeat turns को file मौजूद और non-empty होने पर उसे पढ़ने के लिए collaboration-mode
pointer मिलता है। Configured agent workspace से `MEMORY.md` content
native Codex turn input में paste नहीं किया जाता जब उस workspace के लिए memory tools available हों; जब वह मौजूद होता है, harness
turn-scoped collaboration developer
instructions में एक छोटा workspace-memory pointer जोड़ता है और durable
memory relevant होने पर Codex को `memory_search` या `memory_get` उपयोग करना चाहिए। यदि tools disabled हैं, memory search unavailable है, या
active workspace agent memory workspace से अलग है, तो `MEMORY.md`
normal bounded turn-context path का उपयोग करता है।
`BOOTSTRAP.md` मौजूद होने पर OpenClaw turn input reference
context के रूप में forward किया जाता है।

## Environment overrides

Local testing के लिए environment overrides उपलब्ध रहते हैं:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` unset होने पर
managed binary को bypass करता है।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटाया गया था। इसके बजाय
`plugins.entries.codex.config.appServer.mode: "guardian"` का उपयोग करें, या
one-off local testing के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` उपयोग करें। Repeatable deployments के लिए config
preferred है क्योंकि यह plugin behavior को बाकी Codex harness setup के साथ
उसी reviewed file में रखता है।

## Related

- [Codex harness](/hi/plugins/codex-harness)
- [Codex harness runtime](/hi/plugins/codex-harness-runtime)
- [Native Codex plugins](/hi/plugins/codex-native-plugins)
- [Codex Computer Use](/hi/plugins/codex-computer-use)
- [OpenAI provider](/hi/providers/openai)
- [Configuration reference](/hi/gateway/configuration-reference)
