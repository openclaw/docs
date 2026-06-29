---
read_when:
    - आपको हर Codex हार्नेस कॉन्फ़िग फ़ील्ड चाहिए
    - आप app-server transport, auth, discovery, या timeout व्यवहार बदल रहे हैं
    - आप Codex हार्नेस स्टार्टअप, मॉडल डिस्कवरी, या एनवायरनमेंट आइसोलेशन डिबग कर रहे हैं
summary: Codex हार्नेस के लिए कॉन्फ़िगरेशन, प्रमाणीकरण, खोज, और ऐप-सर्वर संदर्भ
title: Codex हार्नेस संदर्भ
x-i18n:
    generated_at: "2026-06-28T23:33:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

यह संदर्भ बंडल किए गए `codex` Plugin के विस्तृत कॉन्फ़िगरेशन को कवर करता है। सेटअप और रूटिंग निर्णयों के लिए, [Codex हार्नेस](/hi/plugins/codex-harness) से शुरू करें।

## Plugin कॉन्फ़िग सतह

सभी Codex हार्नेस सेटिंग्स `plugins.entries.codex.config` के अंतर्गत रहती हैं।

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

| फ़ील्ड                     | डिफ़ॉल्ट                 | अर्थ                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | सक्षम                    | Codex ऐप-सर्वर `model/list` के लिए मॉडल डिस्कवरी सेटिंग्स।                                                                               |
| `appServer`                | प्रबंधित stdio ऐप-सर्वर | ट्रांसपोर्ट, कमांड, ऑथ, अप्रूवल, सैंडबॉक्स, और टाइमआउट सेटिंग्स।                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw डायनेमिक टूल्स को सीधे शुरुआती Codex टूल संदर्भ में रखने के लिए `"direct"` का उपयोग करें।                                      |
| `codexDynamicToolsExclude` | `[]`                     | Codex ऐप-सर्वर टर्न्स से हटाए जाने वाले अतिरिक्त OpenClaw डायनेमिक टूल नाम।                                                             |
| `codexPlugins`             | अक्षम                    | माइग्रेट किए गए स्रोत-इंस्टॉल्ड क्यूरेटेड Plugins के लिए नेटिव Codex Plugin/ऐप समर्थन। [नेटिव Codex Plugins](/hi/plugins/codex-native-plugins) देखें। |
| `computerUse`              | अक्षम                    | Codex Computer Use सेटअप। [Codex Computer Use](/hi/plugins/codex-computer-use) देखें।                                                       |

## ऐप-सर्वर ट्रांसपोर्ट

डिफ़ॉल्ट रूप से, OpenClaw बंडल किए गए Plugin के साथ शिप किए गए प्रबंधित Codex बाइनरी को शुरू करता है:

```bash
codex app-server --listen stdio://
```

इससे ऐप-सर्वर संस्करण स्थानीय रूप से इंस्टॉल किए गए किसी अलग Codex CLI के बजाय बंडल किए गए `codex` Plugin से जुड़ा रहता है। `appServer.command` केवल तब सेट करें जब आप जानबूझकर कोई अलग executable चलाना चाहते हों।

पहले से चल रहे ऐप-सर्वर के लिए, WebSocket ट्रांसपोर्ट का उपयोग करें:

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
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex को spawn करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | प्रबंधित Codex बाइनरी                                   | stdio transport के लिए executable। प्रबंधित बाइनरी का उपयोग करने के लिए इसे unset छोड़ दें।                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio transport के लिए arguments।                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | unset                                                  | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | unset                                                  | WebSocket transport के लिए Bearer टोकन। literal string या `${CODEX_APP_SERVER_TOKEN}` जैसे SecretInput को स्वीकार करता है।                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket headers। Header values literal strings या SecretInput values स्वीकार करती हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना inherited environment बनाने के बाद spawned stdio app-server process से हटाए गए अतिरिक्त environment variable names।                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | unset                                                  | Remote Codex app-server workspace root। सेट होने पर, OpenClaw resolved OpenClaw workspace से local workspace root का अनुमान लगाता है, इस remote root के तहत current cwd suffix को सुरक्षित रखता है, और Codex को केवल final app-server cwd भेजता है। यदि cwd resolved OpenClaw workspace root के बाहर है, तो OpenClaw remote app-server को gateway-local path भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server control-plane calls के लिए timeout।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा turn स्वीकार करने के बाद या turn-scoped app-server request के बाद quiet window, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है।                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Tool handoff, native tool completion, post-tool raw assistant progress, raw reasoning completion, या reasoning progress के बाद उपयोग किया जाने वाला completion-idle और progress guard, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है। इसे trusted या heavy workloads के लिए उपयोग करें जहाँ post-tool synthesis अंतिम assistant release budget से अधिक देर तक वैध रूप से quiet रह सकता है।                                |
| `mode`                                        | `"yolo"` जब तक local Codex requirements YOLO को disallow न करें | YOLO या guardian-reviewed execution के लिए preset।                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` या allowed guardian approval policy       | Thread start, resume, और turn को भेजी गई native Codex approval policy।                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` या allowed guardian sandbox  | Thread start और resume को भेजा गया native Codex sandbox mode। Active OpenClaw sandboxes `danger-full-access` turns को Codex `workspace-write` तक सीमित करते हैं; turn network flag OpenClaw sandbox egress का अनुसरण करता है।                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` या allowed guardian reviewer               | अनुमति होने पर Codex को native approval prompts review करने देने के लिए `"auto_review"` का उपयोग करें।                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | current process directory                              | `--cwd` omit होने पर `/codex bind` द्वारा उपयोग किया गया workspace।                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | unset                                                  | वैकल्पिक Codex app-server service tier। `"priority"` fast-mode routing सक्षम करता है, `"flex"` flex processing का अनुरोध करता है, और `null` override को clear करता है। Legacy `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                                                 |
| `networkProxy`                                | disabled                                               | app-server commands के लिए Codex permissions-profile networking में opt in करें। OpenClaw `sandbox` भेजने के बजाय selected `permissions.<profile>.network` config परिभाषित करता है और उसे `default_permissions` के साथ चुनता है।                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Preview opt-in जो Codex app-server 0.132.0 या नए के साथ OpenClaw sandbox-backed Codex environment register करता है ताकि native Codex execution active OpenClaw sandbox के अंदर चल सके।                                                                                                                                                                                                         |

`appServer.networkProxy` explicit है क्योंकि यह Codex sandbox contract को बदलता है।
Enabled होने पर, OpenClaw Codex thread config में `features.network_proxy.enabled`
और `default_permissions` भी सेट करता है ताकि generated permission profile
Codex managed networking शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw profile body से
collision-resistant `openclaw-network-<fingerprint>` profile name generate करता है;
`profileName` का उपयोग केवल तब करें जब stable local name आवश्यक हो।

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

यदि normal app-server runtime `danger-full-access` होगा, तो `networkProxy`
enable करने से generated permission profile के लिए workspace-style filesystem access
का उपयोग होता है। Codex managed network enforcement sandboxed networking है,
इसलिए full-access profile outbound traffic की सुरक्षा नहीं करेगा।

Plugin पुराने या unversioned app-server handshakes को block करता है। Codex app-server
को stable version `0.125.0` या नया report करना होगा।

OpenClaw non-loopback WebSocket app-server URL को remote मानता है और
`appServer.authToken` या `Authorization` header के माध्यम से identity-bearing
WebSocket auth की आवश्यकता रखता है। `appServer.authToken` और प्रत्येक
`appServer.headers.*` value SecretInput हो सकती है; secrets runtime OpenClaw
द्वारा app-server start options बनाने से पहले SecretRefs और env shorthand को
resolve करता है, और unresolved structured SecretRefs कोई token या header भेजे
जाने से पहले fail हो जाते हैं। जब native Codex plugins configured होते हैं,
OpenClaw उन plugins को install या refresh करने के लिए connected app-server के
plugin control plane का उपयोग करता है और फिर app inventory refresh करता है
ताकि plugin-owned apps Codex thread को दिखाई दें। `app/list` अब भी
authoritative inventory और metadata source है, लेकिन OpenClaw policy यह तय
करती है कि listed accessible app के लिए `thread/start`
`config.apps[appId].enabled = true` भेजे या नहीं, भले ही Codex अभी उसे disabled
mark करता हो। Unknown या missing app ids fail-closed ही रहते हैं; यह path केवल
`plugin/install` के माध्यम से marketplace plugins activate करता है और inventory
refresh करता है। OpenClaw को केवल उन remote app-servers से connect करें जिन पर
OpenClaw-managed plugin installs और app inventory refreshes accept करने के लिए
trust किया गया हो।

## Approval और sandbox modes

Local stdio app-server sessions default रूप से YOLO mode में होती हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यह trusted local operator posture unattended
OpenClaw turns और heartbeats को उन native approval prompts के बिना progress
करने देता है जिनका जवाब देने के लिए कोई मौजूद नहीं होता।

यदि Codex की local system requirements file implicit YOLO approval, reviewer,
या sandbox values को disallow करती है, तो OpenClaw implicit default को इसके
बजाय guardian मानता है और allowed guardian permissions चुनता है।
`tools.exec.mode: "auto"` भी guardian-reviewed Codex approvals को force करता है
और unsafe legacy `approvalPolicy: "never"` या `sandbox: "danger-full-access"`
overrides preserve नहीं करता; intentional no-approval posture के लिए
`tools.exec.mode: "full"` set करें। उसी requirements file में hostname-matching
`[[remote_sandbox_config]]` entries sandbox default decision के लिए honor की
जाती हैं।

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

जब वे values allowed हों, तो `guardian` preset `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, और `sandbox: "workspace-write"` में expand
होता है। Individual policy fields `mode` को override करते हैं। पुरानी
`guardian_subagent` reviewer value compatibility alias के रूप में अब भी accepted
है, लेकिन नए configs को `auto_review` का उपयोग करना चाहिए।

जब OpenClaw sandbox active होता है, local Codex app-server process फिर भी
Gateway host पर चलता है। इसलिए OpenClaw उस turn के लिए Codex native Code Mode,
user MCP servers, और app-backed plugin execution को disable कर देता है, बजाय
इसके कि Codex host-side sandboxing को OpenClaw sandbox backend के equivalent
माना जाए। जब normal exec/process tools available होते हैं, shell access
OpenClaw sandbox-backed dynamic tools जैसे `sandbox_exec` और `sandbox_process`
के माध्यम से exposed होता है।

Ubuntu/AppArmor hosts पर, जब आप active OpenClaw sandboxing के बिना native Codex
`workspace-write` intentionally run करते हैं, तो shell command start होने से
पहले Codex bwrap `workspace-write` के अंतर्गत fail हो सकता है। यदि आपको
`bwrap: setting up uid map: Permission denied` या
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` दिखे, तो
`openclaw doctor` run करें और broader Docker container privileges देने के बजाय
OpenClaw service user के लिए reported host namespace policy fix करें। service
process के लिए scoped AppArmor profile prefer करें; fallback
`kernel.apparmor_restrict_unprivileged_userns=0` host-wide है और इसमें
security tradeoffs हैं।

## Sandboxed native execution

Stable default fail-closed है: active OpenClaw sandboxing native Codex execution
surfaces को disable कर देता है, जो अन्यथा Codex app-server host से run होते।
`appServer.experimental.sandboxExecServer: true` का उपयोग केवल तब करें जब आप
OpenClaw के sandbox backend के साथ Codex का remote environment support आजमाना
चाहते हों। इस preview path के लिए Codex app-server 0.132.0 या newer चाहिए।

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
द्वारा backed local loopback exec-server start करता है, उसे Codex app-server के
साथ register करता है, और Codex thread तथा turn को उस OpenClaw-owned
environment के साथ start करता है। यदि app-server environment register नहीं कर
सकता, तो run silently host execution पर fallback करने के बजाय fail closed हो
जाता है।

यह preview path local-only है। Remote WebSocket app-server loopback exec-server
तक तब तक नहीं पहुंच सकता जब तक वह same host पर run न कर रहा हो, इसलिए
OpenClaw उस combination को reject करता है।

## Auth और environment isolation

Auth इस order में select होता है:

1. agent के लिए explicit OpenClaw Codex auth profile.
2. उस agent के Codex home में app-server का existing account.
3. केवल local stdio app-server launches के लिए, जब कोई app-server account मौजूद
   न हो और OpenAI auth अब भी required हो, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`.

जब OpenClaw ChatGPT subscription-style Codex auth profile देखता है, तो वह
spawned Codex child process से `CODEX_API_KEY` और `OPENAI_API_KEY` remove कर
देता है। इससे Gateway-level API keys embeddings या direct OpenAI models के लिए
available रहती हैं, बिना native Codex app-server turns को गलती से API के
through bill किए।

Explicit Codex API-key profiles और local stdio env-key fallback inherited
child-process env के बजाय app-server login का उपयोग करते हैं। WebSocket
app-server connections को Gateway env API-key fallback नहीं मिलता; explicit auth
profile या remote app-server के अपने account का उपयोग करें।

Stdio app-server launches default रूप से OpenClaw का process environment inherit
करते हैं। OpenClaw Codex app-server account bridge own करता है और `CODEX_HOME`
को उस agent के OpenClaw state के अंदर per-agent directory पर set करता है। इससे
Codex config, accounts, plugin cache/data, और thread state operator के personal
`~/.codex` home से leak होने के बजाय OpenClaw agent तक scoped रहते हैं।

OpenClaw normal local app-server launches के लिए `HOME` rewrite नहीं करता।
Codex-run subprocesses जैसे `openclaw`, `gh`, `git`, cloud CLIs, और shell
commands normal process home देखते हैं और user-home config तथा tokens पा सकते
हैं। Codex `$HOME/.agents/skills` और
`$HOME/.agents/plugins/marketplace.json` भी discover कर सकता है; वह `.agents`
discovery intentionally operator home के साथ shared है और isolated `~/.codex`
state से अलग है।

OpenClaw plugins और OpenClaw skill snapshots अब भी OpenClaw की अपनी plugin
registry और skill loader के through flow करते हैं। Personal Codex `~/.codex`
assets ऐसा नहीं करते। यदि आपके पास Codex home से useful Codex CLI skills या
plugins हैं जिन्हें OpenClaw agent का हिस्सा बनना चाहिए, तो उन्हें explicitly
inventory करें:

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

`appServer.clearEnv` केवल spawned Codex app-server child process को affect करता
है। OpenClaw local launch normalization के दौरान इस list से `CODEX_HOME` और
`HOME` remove करता है: `CODEX_HOME` per-agent रहता है, और `HOME` inherited रहता
है ताकि subprocesses normal user-home state का उपयोग कर सकें।

## Dynamic tools

Codex dynamic tools default रूप से `searchable` loading का उपयोग करते हैं।
OpenClaw ऐसे dynamic tools expose नहीं करता जो Codex-native workspace
operations को duplicate करते हैं:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

अधिकांश remaining OpenClaw integration tools, जैसे messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond`, और `web_search`, `openclaw`
namespace के अंतर्गत Codex tool search के through available हैं। इससे initial
model context छोटा रहता है। `sessions_yield` और message-tool-only source
replies direct रहती हैं क्योंकि वे turn-control contracts हैं।
`sessions_spawn` searchable रहता है ताकि Codex का native `spawn_agent` primary
Codex subagent surface रहे, जबकि explicit OpenClaw या ACP delegation अब भी
`openclaw` dynamic tool namespace के through available है।

`codexDynamicToolsLoading: "direct"` केवल तब set करें जब custom Codex app-server
से connect कर रहे हों जो deferred dynamic tools search नहीं कर सकता या full
tool payload debug कर रहे हों।

## Timeouts

OpenClaw-owned dynamic tool calls `appServer.requestTimeoutMs` से independently
bounded होती हैं। प्रत्येक Codex `item/tool/call` request इस order में पहला
available timeout उपयोग करती है:

- Positive per-call `timeoutMs` argument.
- `image_generate` के लिए, `agents.defaults.imageGenerationModel.timeoutMs`.
- Configured timeout के बिना `image_generate` के लिए, 120 second
  image-generation default.
- media-understanding `image` tool के लिए, `tools.media.image.timeoutSeconds`
  को milliseconds में convert किया गया, या 60 second media default. Image
  understanding के लिए, यह request itself पर apply होता है और earlier
  preparation work से reduce नहीं होता।
- 90 second dynamic-tool default.

यह watchdog outer dynamic `item/tool/call` budget है। Provider-specific request
timeouts उस call के अंदर run होते हैं और अपनी timeout semantics रखते हैं।
Dynamic tool budgets 600000 ms पर capped होते हैं। Timeout पर, OpenClaw जहां
supported हो tool signal abort करता है और Codex को failed dynamic-tool response
return करता है ताकि turn session को `processing` में छोड़े बिना continue कर
सके।

Codex द्वारा turn accept करने के बाद, और OpenClaw द्वारा turn-scoped
app-server request का जवाब देने के बाद, harness अपेक्षा करता है कि Codex
current-turn progress करे और अंततः native turn को `turn/completed` के साथ finish
करे। यदि app-server `appServer.turnCompletionIdleTimeoutMs` तक quiet रहता है,
OpenClaw best-effort Codex turn को interrupt करता है, diagnostic timeout record
करता है, और OpenClaw session lane release करता है ताकि follow-up chat messages
stale native turn के पीछे queued न रहें।

उसी turn के लिए अधिकांश गैर-टर्मिनल सूचनाएं उस छोटे watchdog को निष्क्रिय कर देती हैं
क्योंकि Codex ने साबित कर दिया है कि turn अभी भी सक्रिय है। Tool handoffs लंबे
post-tool idle budget का उपयोग करते हैं: OpenClaw द्वारा `item/tool/call` प्रतिक्रिया लौटाने के बाद, `commandExecution` जैसे
native tool items पूरे होने के बाद, raw
`custom_tool_call_output` completions के बाद, और post-tool raw assistant
progress, raw reasoning completions, या reasoning progress के बाद। Guard
कॉन्फ़िगर होने पर `appServer.postToolRawAssistantCompletionIdleTimeoutMs` का उपयोग करता है और
अन्यथा डिफ़ॉल्ट रूप से पांच मिनट का होता है। वही post-tool budget Codex द्वारा अगला
current-turn event emit करने से पहले silent synthesis window के लिए
progress watchdog को भी बढ़ाता है। Reasoning completions, commentary
`agentMessage` completions, और pre-tool raw reasoning या assistant progress के बाद
automatic final reply आ सकता है, इसलिए वे session lane को तुरंत release करने के बजाय
post-progress reply guard का उपयोग करते हैं। केवल
final/non-commentary completed `agentMessage` items और pre-tool raw assistant
completions assistant-output release को arm करते हैं: अगर Codex फिर
`turn/completed` के बिना शांत हो जाता है, तो OpenClaw best-effort native turn को interrupt करता है और
session lane release करता है। Replay-safe stdio app-server failures, जिनमें
assistant, tool, active-item, या side-effect evidence के बिना
turn-completion idle timeouts शामिल हैं, fresh app-server attempt पर एक बार retry किए जाते हैं। Unsafe
timeouts फिर भी अटके हुए app-server client को retire करते हैं और OpenClaw
session lane release करते हैं। वे stale native thread binding को भी clear करते हैं, बजाय इसके कि
उसे अपने-आप replay किया जाए। Completion-watch timeouts Codex-specific timeout
text दिखाते हैं: replay-safe मामलों में कहा जाता है कि response incomplete हो सकता है, जबकि unsafe मामलों में
user से retry करने से पहले current state verify करने को कहा जाता है। Public timeout diagnostics में
last app-server notification method,
raw assistant response item id/type/role, active request/item counts, और armed
watch state जैसे structural fields शामिल होते हैं। जब last notification raw assistant response item होता है, तो उनमें
bounded assistant text preview भी शामिल होता है। इनमें raw prompt या
tool content शामिल नहीं होता।

## Model discovery

डिफ़ॉल्ट रूप से, Codex plugin app-server से उपलब्ध models मांगता है। Model
availability Codex app-server के स्वामित्व में है, इसलिए OpenClaw द्वारा bundled `@openai/codex` version upgrade करने पर या deployment द्वारा
`appServer.command` को किसी अलग Codex binary की ओर point करने पर list बदल सकती है। Availability
account-scoped भी हो सकती है। उस harness और account के लिए live catalog देखने के लिए running Gateway पर `/codex models` का उपयोग करें।

अगर discovery fail हो जाती है या timeout हो जाता है, तो OpenClaw इनके लिए bundled fallback catalog का उपयोग करता है:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

वर्तमान bundled harness `@openai/codex` `0.139.0` है। उस bundled app-server के विरुद्ध `model/list` probe ने लौटाया:

| Model id        | डिफ़ॉल्ट | छिपा हुआ | Input modalities | Reasoning efforts        |
| --------------- | ------- | ------ | ---------------- | ------------------------ |
| `gpt-5.5`       | हां     | नहीं     | text, image      | low, medium, high, xhigh |
| `gpt-5.4`       | नहीं      | नहीं     | text, image      | low, medium, high, xhigh |
| `gpt-5.4-mini`  | नहीं      | नहीं     | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex` | नहीं      | नहीं     | text, image      | low, medium, high, xhigh |
| `gpt-5.2`       | नहीं      | नहीं     | text, image      | low, medium, high, xhigh |

Hidden models internal या specialized flows के लिए app-server catalog द्वारा लौटाए जा सकते हैं, लेकिन वे सामान्य model-picker choices नहीं होते।

`plugins.entries.codex.config.discovery` के अंतर्गत discovery tune करें:

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

जब आप startup को Codex probe करने से बचाना चाहते हैं और केवल
fallback catalog का उपयोग करना चाहते हैं, तो discovery disable करें:

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

Codex `AGENTS.md` को native project-doc discovery के माध्यम से स्वयं संभालता है। OpenClaw
synthetic Codex project-doc files नहीं लिखता और persona files के लिए Codex fallback
filenames पर निर्भर नहीं करता, क्योंकि Codex fallbacks केवल तब apply होते हैं जब
`AGENTS.md` missing हो।

OpenClaw workspace parity के लिए, Codex harness बाकी bootstrap
files resolve करता है। `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, और `USER.md` को
OpenClaw Codex developer instructions के रूप में forward किया जाता है क्योंकि वे active agent,
available workspace guidance, और user profile define करते हैं। Compact OpenClaw Skills
list को turn-scoped collaboration developer instructions के रूप में forward किया जाता है।
`HEARTBEAT.md` content inject नहीं किया जाता; Heartbeat turns को file मौजूद और non-empty होने पर उसे पढ़ने के लिए collaboration-mode
pointer मिलता है। Configured agent workspace से `MEMORY.md` content
native Codex turn input में paste नहीं किया जाता जब उस workspace के लिए memory tools उपलब्ध हों; जब यह मौजूद होता है, तो harness
turn-scoped collaboration developer instructions में एक छोटा workspace-memory pointer जोड़ता है
और durable memory relevant होने पर Codex को `memory_search` या `memory_get` का उपयोग करना चाहिए। अगर tools disabled हैं, memory search unavailable है, या
active workspace agent memory workspace से अलग है, तो `MEMORY.md`
normal bounded turn-context path का उपयोग करता है।
`BOOTSTRAP.md` मौजूद होने पर OpenClaw turn input reference
context के रूप में forward किया जाता है।

## Environment overrides

Environment overrides local testing के लिए उपलब्ध रहते हैं:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

जब `appServer.command` unset हो, तो `OPENCLAW_CODEX_APP_SERVER_BIN`
managed binary को bypass करता है।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटा दिया गया था। इसके बजाय
`plugins.entries.codex.config.appServer.mode: "guardian"` का उपयोग करें, या
one-off local testing के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` का उपयोग करें। Repeatable deployments के लिए config
preferred है क्योंकि यह plugin behavior को बाकी Codex harness setup के समान
reviewed file में रखता है।

## Related

- [Codex harness](/hi/plugins/codex-harness)
- [Codex harness runtime](/hi/plugins/codex-harness-runtime)
- [Native Codex plugins](/hi/plugins/codex-native-plugins)
- [Codex Computer Use](/hi/plugins/codex-computer-use)
- [OpenAI provider](/hi/providers/openai)
- [Configuration reference](/hi/gateway/configuration-reference)
