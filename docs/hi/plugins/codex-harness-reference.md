---
read_when:
    - आपको हर Codex हार्नेस कॉन्फ़िगरेशन फ़ील्ड की आवश्यकता है
    - आप app-server transport, auth, discovery, या timeout व्यवहार बदल रहे हैं
    - आप Codex हार्नेस स्टार्टअप, मॉडल डिस्कवरी, या एनवायरनमेंट आइसोलेशन को डीबग कर रहे हैं
summary: Codex हार्नेस के लिए कॉन्फ़िगरेशन, प्रमाणीकरण, खोज और ऐप-सर्वर संदर्भ
title: Codex हार्नेस संदर्भ
x-i18n:
    generated_at: "2026-07-04T20:33:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

यह संदर्भ बंडल किए गए `codex` Plugin के विस्तृत कॉन्फ़िगरेशन को कवर करता है। सेटअप और रूटिंग निर्णयों के लिए,
[Codex हार्नेस](/hi/plugins/codex-harness) से शुरू करें।

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

| फ़ील्ड                      | डिफ़ॉल्ट                  | अर्थ                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | सक्षम                  | Codex ऐप-सर्वर `model/list` के लिए मॉडल खोज सेटिंग्स।                                                                               |
| `appServer`                | प्रबंधित stdio ऐप-सर्वर | ट्रांसपोर्ट, कमांड, ऑथ, अनुमोदन, सैंडबॉक्स, और टाइमआउट सेटिंग्स।                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw डायनेमिक टूल्स को सीधे आरंभिक Codex टूल संदर्भ में रखने के लिए `"direct"` का उपयोग करें।                                                  |
| `codexDynamicToolsExclude` | `[]`                     | Codex ऐप-सर्वर टर्न्स से हटाने के लिए अतिरिक्त OpenClaw डायनेमिक टूल नाम।                                                               |
| `codexPlugins`             | अक्षम                 | माइग्रेट किए गए स्रोत-इंस्टॉल्ड क्यूरेटेड plugins के लिए नेटिव Codex plugin/app समर्थन। [नेटिव Codex plugins](/hi/plugins/codex-native-plugins) देखें। |
| `computerUse`              | अक्षम                 | Codex Computer Use सेटअप। [Codex Computer Use](/hi/plugins/codex-computer-use) देखें।                                                          |

## ऐप-सर्वर ट्रांसपोर्ट

डिफ़ॉल्ट रूप से, OpenClaw बंडल किए गए
Plugin के साथ भेजे गए प्रबंधित Codex बाइनरी को शुरू करता है:

```bash
codex app-server --listen stdio://
```

यह ऐप-सर्वर संस्करण को स्थानीय रूप से इंस्टॉल किए गए किसी भी अलग Codex CLI के बजाय बंडल किए गए `codex` Plugin से जोड़े रखता है। `appServer.command` केवल तब सेट करें जब आप जानबूझकर कोई अलग executable चलाना चाहते हों।

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
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex को स्पॉन करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` हर OpenClaw agent के लिए Codex स्थिति को अलग रखता है। `"user"` मूल `$CODEX_HOME` या `~/.codex` साझा करता है, मूल auth का उपयोग करता है, और केवल-owner thread प्रबंधन सक्षम करता है। User scope के लिए stdio आवश्यक है।                                                                                                                                                                                               |
| `command`                                     | प्रबंधित Codex binary                                   | stdio transport के लिए executable। प्रबंधित binary का उपयोग करने के लिए इसे unset छोड़ें।                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio transport के लिए arguments।                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | unset                                                  | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | unset                                                  | WebSocket transport के लिए Bearer token। literal string या SecretInput जैसे `${CODEX_APP_SERVER_TOKEN}` स्वीकार करता है।                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket headers। Header values literal strings या SecretInput values स्वीकार करते हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना inherited environment बनाने के बाद spawned stdio app-server process से हटाए गए अतिरिक्त environment variable names।                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | unset                                                  | Remote Codex app-server workspace root। सेट होने पर, OpenClaw resolved OpenClaw workspace से local workspace root अनुमानित करता है, इस remote root के अंतर्गत current cwd suffix सुरक्षित रखता है, और Codex को केवल अंतिम app-server cwd भेजता है। अगर cwd resolved OpenClaw workspace root के बाहर है, तो OpenClaw remote app-server को gateway-local path भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server control-plane calls के लिए timeout।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा turn स्वीकार करने के बाद या turn-scoped app-server request के बाद, जब OpenClaw `turn/completed` की प्रतीक्षा करता है, quiet window।                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Tool handoff, native tool completion, post-tool raw assistant progress, raw reasoning completion, या reasoning progress के बाद, जब OpenClaw `turn/completed` की प्रतीक्षा करता है, उपयोग किया जाने वाला completion-idle और progress guard। इसे trusted या heavy workloads के लिए उपयोग करें जहाँ post-tool synthesis अंतिम assistant release budget से अधिक समय तक वैध रूप से quiet रह सकता है।                                |
| `mode`                                        | `"yolo"` जब तक local Codex requirements YOLO की अनुमति न दें | YOLO या guardian-reviewed execution के लिए preset।                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` या अनुमत guardian approval policy       | Thread start, resume, और turn को भेजी गई native Codex approval policy।                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` या अनुमत guardian sandbox  | Thread start और resume को भेजा गया native Codex sandbox mode। Active OpenClaw sandboxes `danger-full-access` turns को Codex `workspace-write` तक सीमित करते हैं; turn network flag OpenClaw sandbox egress का पालन करता है।                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` या अनुमत guardian reviewer               | अनुमति होने पर Codex से native approval prompts की समीक्षा करवाने के लिए `"auto_review"` का उपयोग करें।                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | वर्तमान process directory                              | जब `--cwd` छोड़ा जाता है, तब `/codex bind` द्वारा उपयोग किया गया workspace।                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | unset                                                  | वैकल्पिक Codex app-server service tier। `"priority"` fast-mode routing सक्षम करता है, `"flex"` flex processing का अनुरोध करता है, और `null` override साफ़ करता है। Legacy `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                                                 |
| `networkProxy`                                | disabled                                               | app-server commands के लिए Codex permissions-profile networking में opt in करें। OpenClaw selected `permissions.<profile>.network` config परिभाषित करता है और `sandbox` भेजने के बजाय `default_permissions` से उसे चुनता है।                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Preview opt-in जो Codex app-server 0.132.0 या नए के साथ OpenClaw sandbox-backed Codex environment रजिस्टर करता है ताकि native Codex execution active OpenClaw sandbox के अंदर चल सके।                                                                                                                                                                                                         |

`appServer.networkProxy` स्पष्ट है क्योंकि यह Codex sandbox
contract को बदलता है। सक्षम होने पर, OpenClaw Codex thread config में
`features.network_proxy.enabled` और
`default_permissions` भी सेट करता है ताकि generated permission
profile Codex managed networking शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw
profile body से collision-resistant `openclaw-network-<fingerprint>` profile name
बनाता है; `profileName` का उपयोग केवल तब करें जब stable local name आवश्यक हो।

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
`networkProxy` सक्षम करने पर जनरेट की गई permission profile के लिए
workspace-style filesystem access इस्तेमाल होता है। Codex द्वारा प्रबंधित
network enforcement sandboxed networking है, इसलिए full-access profile
outbound traffic की सुरक्षा नहीं करेगी।

Plugin पुराने या बिना version वाले app-server handshakes को ब्लॉक करता है।
Codex app-server को stable version `0.125.0` या उससे नया रिपोर्ट करना होगा।

OpenClaw non-loopback WebSocket app-server URLs को remote मानता है और
`appServer.authToken` या `Authorization` header के जरिए identity-bearing
WebSocket auth की आवश्यकता रखता है। `appServer.authToken` और प्रत्येक
`appServer.headers.*` value SecretInput हो सकती है; secrets runtime
OpenClaw द्वारा app-server start options बनाने से पहले SecretRefs और env
shorthand को resolve करता है, और unresolved structured SecretRefs किसी token
या header के भेजे जाने से पहले fail हो जाते हैं। जब native Codex plugins
configure होते हैं, OpenClaw connected app-server के plugin control plane का
इस्तेमाल उन plugins को install या refresh करने के लिए करता है और फिर app
inventory को refresh करता है ताकि plugin-owned apps Codex thread को दिखाई
दें। `app/list` अभी भी authoritative inventory और metadata source है, लेकिन
OpenClaw policy तय करती है कि क्या `thread/start` किसी listed accessible app
के लिए `config.apps[appId].enabled = true` भेजता है, भले ही Codex अभी उसे
disabled चिह्नित करता हो। Unknown या missing app ids fail-closed ही रहते हैं;
यह path केवल `plugin/install` के जरिए marketplace plugins को activate करता है
और inventory refresh करता है। OpenClaw को केवल उन remote app-servers से
connect करें जिन पर OpenClaw-managed plugin installs और app inventory
refreshes स्वीकार करने के लिए भरोसा हो।

## Approval और sandbox modes

Local stdio app-server sessions डिफ़ॉल्ट रूप से YOLO mode में होते हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यह trusted local operator posture unattended
OpenClaw turns और heartbeats को native approval prompts के बिना आगे बढ़ने देता
है, जिनका जवाब देने के लिए कोई मौजूद नहीं होता।

यदि Codex की local system requirements file implicit YOLO approval, reviewer,
या sandbox values की अनुमति नहीं देती, तो OpenClaw implicit default को इसके
बजाय guardian मानता है और allowed guardian permissions चुनता है।
`tools.exec.mode: "auto"` भी guardian-reviewed Codex approvals को force करता
है और unsafe legacy `approvalPolicy: "never"` या
`sandbox: "danger-full-access"` overrides को preserve नहीं करता; जानबूझकर
no-approval posture के लिए `tools.exec.mode: "full"` set करें। उसी
requirements file में hostname-matching `[[remote_sandbox_config]]` entries
sandbox default decision के लिए honored होती हैं।

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
`approvalsReviewer: "auto_review"`, और `sandbox: "workspace-write"` में expand
होता है, जब ये values allowed हों। Individual policy fields `mode` को override
करती हैं। पुराना `guardian_subagent` reviewer value compatibility alias के रूप
में अभी भी accepted है, लेकिन नए configs को `auto_review` इस्तेमाल करना चाहिए।

जब OpenClaw sandbox active होता है, local Codex app-server process फिर भी
Gateway host पर चलता है। इसलिए OpenClaw उस turn के लिए Codex native Code Mode,
user MCP servers, और app-backed plugin execution को disable करता है, बजाय इसके
कि Codex host-side sandboxing को OpenClaw sandbox backend के equivalent माना
जाए। जब सामान्य exec/process tools उपलब्ध हों, shell access OpenClaw
sandbox-backed dynamic tools जैसे `sandbox_exec` और `sandbox_process` के जरिए
expose किया जाता है।

Ubuntu/AppArmor hosts पर, जब आप active OpenClaw sandboxing के बिना जानबूझकर
native Codex `workspace-write` चलाते हैं, तो shell command शुरू होने से पहले
Codex bwrap `workspace-write` के तहत fail हो सकता है। यदि आपको
`bwrap: setting up uid map: Permission denied` या
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` दिखे, तो
`openclaw doctor` चलाएं और broader Docker container privileges देने के बजाय
OpenClaw service user के लिए reported host namespace policy को fix करें।
Service process के लिए scoped AppArmor profile को प्राथमिकता दें;
`kernel.apparmor_restrict_unprivileged_userns=0` fallback host-wide है और
इसमें security tradeoffs हैं।

## Sandboxed native execution

Stable default fail-closed है: active OpenClaw sandboxing native Codex execution
surfaces को disable करता है जो अन्यथा Codex app-server host से run होते। केवल
तभी `appServer.experimental.sandboxExecServer: true` इस्तेमाल करें जब आप
OpenClaw के sandbox backend के साथ Codex के remote environment support को try
करना चाहते हों। इस preview path के लिए Codex app-server 0.132.0 या नया चाहिए।

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

जब flag on हो और current OpenClaw session sandboxed हो, OpenClaw active
sandbox द्वारा backed local loopback exec-server start करता है, उसे Codex
app-server के साथ register करता है, और उस OpenClaw-owned environment के साथ
Codex thread और turn start करता है। यदि app-server environment register नहीं
कर सकता, तो run host execution पर silently fallback करने के बजाय fail closed
हो जाता है।

यह preview path केवल local है। Remote WebSocket app-server loopback
exec-server तक नहीं पहुंच सकता, जब तक वह उसी host पर run न कर रहा हो, इसलिए
OpenClaw उस combination को reject करता है।

## Auth और environment isolation

Default per-agent home में, auth इस क्रम में selected होता है:

1. Agent के लिए explicit OpenClaw Codex auth profile।
2. उस agent के Codex home में app-server का existing account।
3. केवल local stdio app-server launches के लिए, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`, जब कोई app-server account मौजूद न हो और OpenAI auth अभी
   भी required हो।

जब OpenClaw ChatGPT subscription-style Codex auth profile देखता है, तो वह
spawned Codex child process से `CODEX_API_KEY` और `OPENAI_API_KEY` हटा देता
है। इससे Gateway-level API keys embeddings या direct OpenAI models के लिए
available रहती हैं, बिना native Codex app-server turns को गलती से API के
through bill कराए।

Explicit Codex API-key profiles और local stdio env-key fallback inherited
child-process env के बजाय app-server login इस्तेमाल करते हैं। WebSocket
app-server connections को Gateway env API-key fallback नहीं मिलता; explicit
auth profile या remote app-server का अपना account इस्तेमाल करें।

Stdio app-server launches default रूप से OpenClaw का process environment
inherit करते हैं। OpenClaw Codex app-server account bridge own करता है और
`CODEX_HOME` को उस agent की OpenClaw state के तहत per-agent directory पर set
करता है। इससे Codex config, accounts, plugin cache/data, और thread state
operator के personal `~/.codex` home से leak होने के बजाय OpenClaw agent तक
scoped रहती है।

Codex Desktop और CLI के साथ native Codex state share करने के लिए
`appServer.homeScope: "user"` set करें। यह local-stdio-only mode set होने पर
`$CODEX_HOME` और अन्यथा `~/.codex` इस्तेमाल करता है, जिसमें native auth,
config, plugins, और threads शामिल हैं। OpenClaw app-server के लिए अपने
auth-profile bridge को skip करता है। Verified owner turns `codex_threads` का
इस्तेमाल उन threads को list, search, read, fork, rename, archive, और restore
करने के लिए कर सकते हैं। किसी thread को OpenClaw में continue करने से पहले
fork करें; independent Codex processes उसी thread के लिए concurrent writers
coordinate नहीं करते।

OpenClaw सामान्य local app-server launches के लिए `HOME` rewrite नहीं करता।
Codex-run subprocesses जैसे `openclaw`, `gh`, `git`, cloud CLIs, और shell
commands सामान्य process home देखते हैं और user-home config और tokens खोज सकते
हैं। Codex `$HOME/.agents/skills` और
`$HOME/.agents/plugins/marketplace.json` भी discover कर सकता है; वह `.agents`
discovery operator home के साथ जानबूझकर shared है और isolated `~/.codex` state
से अलग है।

Default agent scope में, OpenClaw plugins और OpenClaw skill snapshots अभी भी
OpenClaw की अपनी plugin registry और skill loader से होकर flow करते हैं;
personal Codex `~/.codex` assets ऐसा नहीं करते। यदि आपके पास Codex home से
useful Codex CLI skills या plugins हैं जिन्हें isolated OpenClaw agent का
हिस्सा बनना चाहिए, तो उन्हें explicitly inventory करें:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

यदि किसी deployment को additional environment isolation चाहिए, तो उन variables
को `appServer.clearEnv` में add करें:

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

`appServer.clearEnv` केवल spawned Codex app-server child process को affect
करता है। OpenClaw local launch normalization के दौरान इस list से `CODEX_HOME`
और `HOME` को हटाता है: `CODEX_HOME` selected agent या user scope पर pointed
रहता है, और `HOME` inherited रहता है ताकि subprocesses सामान्य user-home state
इस्तेमाल कर सकें।

## Dynamic tools

Codex dynamic tools default रूप से `searchable` loading पर होते हैं। OpenClaw
ऐसे dynamic tools expose नहीं करता जो Codex-native workspace operations को
duplicate करते हैं:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

अधिकांश remaining OpenClaw integration tools, जैसे messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond`, और `web_search`, `openclaw`
namespace के तहत Codex tool search के through available हैं। इससे initial
model context छोटा रहता है। `sessions_yield` और message-tool-only source
replies direct रहते हैं क्योंकि वे turn-control contracts हैं।
`sessions_spawn` searchable रहता है ताकि Codex का native `spawn_agent`
primary Codex subagent surface बना रहे, जबकि explicit OpenClaw या ACP
delegation अभी भी `openclaw` dynamic tool namespace के through available है।

`codexDynamicToolsLoading: "direct"` केवल तब set करें जब custom Codex
app-server से connect कर रहे हों जो deferred dynamic tools search नहीं कर
सकता, या full tool payload debug कर रहे हों।

## Timeouts

OpenClaw-owned dynamic tool calls `appServer.requestTimeoutMs` से स्वतंत्र रूप
से bounded हैं। प्रत्येक Codex `item/tool/call` request इस क्रम में पहला
available timeout इस्तेमाल करता है:

- Positive per-call `timeoutMs` argument।
- `image_generate` के लिए, `agents.defaults.imageGenerationModel.timeoutMs`।
- Configured timeout के बिना `image_generate` के लिए, 120 second
  image-generation default।
- Media-understanding `image` tool के लिए, `tools.media.image.timeoutSeconds`
  को milliseconds में converted, या 60 second media default। Image
  understanding के लिए, यह request पर ही लागू होता है और earlier preparation
  work से कम नहीं किया जाता।
- 90 second dynamic-tool default।

यह watchdog outer dynamic `item/tool/call` budget है। Provider-specific request
timeouts उस call के अंदर run होते हैं और अपनी timeout semantics रखते हैं।
Dynamic tool budgets 600000 ms पर capped हैं। Timeout पर, OpenClaw जहां
supported हो tool signal abort करता है और Codex को failed dynamic-tool response
return करता है ताकि turn session को `processing` में छोड़े बिना continue कर
सके।

Codex द्वारा turn accept करने के बाद, और OpenClaw द्वारा turn-scoped
app-server request का response देने के बाद, harness अपेक्षा करता है कि Codex
current-turn progress करे और अंततः native turn को `turn/completed` के साथ
finish करे। यदि app-server `appServer.turnCompletionIdleTimeoutMs` तक quiet
रहता है, तो OpenClaw best-effort Codex turn interrupt करता है, diagnostic
timeout record करता है, और OpenClaw session lane release करता है ताकि follow-up
chat messages stale native turn के पीछे queued न रहें।

एक ही turn के लिए अधिकांश non-terminal notifications उस छोटे watchdog को निष्क्रिय कर देते हैं
क्योंकि Codex ने साबित कर दिया है कि turn अभी भी सक्रिय है। Tool handoffs एक लंबे
post-tool idle budget का उपयोग करते हैं: OpenClaw द्वारा `item/tool/call` response लौटाने के बाद,
`commandExecution` जैसे native tool items पूरे होने के बाद, raw
`custom_tool_call_output` completions के बाद, और post-tool raw assistant
progress, raw reasoning completions, या reasoning progress के बाद। Guard कॉन्फ़िगर होने पर
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` का उपयोग करता है और
अन्यथा डिफ़ॉल्ट रूप से पांच मिनट लेता है। वही post-tool budget Codex के अगला
current-turn event उत्सर्जित करने से पहले silent synthesis window के लिए
progress watchdog को भी बढ़ाता है। Reasoning completions, commentary
`agentMessage` completions, और pre-tool raw reasoning या assistant progress के बाद
automatic final reply आ सकता है, इसलिए वे session lane को तुरंत रिलीज़ करने के बजाय
post-progress reply guard का उपयोग करते हैं। केवल
final/non-commentary completed `agentMessage` items और pre-tool raw assistant
completions assistant-output release को arm करते हैं: अगर Codex फिर
`turn/completed` के बिना शांत हो जाता है, तो OpenClaw best-effort native turn को
interrupt करता है और session lane को रिलीज़ करता है। Replay-safe stdio app-server failures, जिनमें
assistant, tool, active-item, या side-effect evidence के बिना
turn-completion idle timeouts शामिल हैं, fresh app-server attempt पर एक बार retry किए जाते हैं। Unsafe
timeouts अभी भी अटके हुए app-server client को retire करते हैं और OpenClaw
session lane को रिलीज़ करते हैं। वे stale native thread binding को भी साफ़ करते हैं, बजाय इसके कि
उसे automatic रूप से replay किया जाए। Completion-watch timeouts Codex-specific timeout
text दिखाते हैं: replay-safe cases कहते हैं कि response अधूरा हो सकता है, जबकि unsafe cases
user को retry करने से पहले current state verify करने को कहते हैं। Public timeout diagnostics
में last app-server notification method,
raw assistant response item id/type/role, active request/item counts, और armed
watch state जैसे structural fields शामिल होते हैं। जब last notification raw assistant response item होता है, तो वे
bounded assistant text preview भी शामिल करते हैं। वे raw prompt या
tool content शामिल नहीं करते।

## Model discovery

डिफ़ॉल्ट रूप से, Codex Plugin app-server से उपलब्ध models मांगता है। Model
availability Codex app-server के स्वामित्व में होती है, इसलिए OpenClaw द्वारा bundled
`@openai/codex` version upgrade करने पर या deployment के
`appServer.command` को किसी अलग Codex binary की ओर point करने पर list बदल सकती है।
Availability account-scoped भी हो सकती है। उस harness और account के लिए live catalog
देखने के लिए running Gateway पर `/codex models` का उपयोग करें।

यदि discovery fail होती है या time out होती है, तो OpenClaw इनके लिए bundled fallback catalog का उपयोग करता है:

- GPT-5.5
- GPT-5.4 mini

Current bundled harness `@openai/codex` `0.142.5` है। उस bundled app-server के खिलाफ `model/list` probe ने ये public picker rows लौटाए:

| Model id              | Input modalities | Reasoning efforts        |
| --------------------- | ---------------- | ------------------------ |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh |

Internal या specialized flows के लिए hidden models app-server catalog द्वारा लौटाए जा सकते हैं, लेकिन वे normal model-picker choices नहीं होते।

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

जब आप startup में Codex probe करने से बचना चाहते हों और केवल
fallback catalog का उपयोग करना चाहते हों, तो discovery disable करें:

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

Codex native project-doc discovery के माध्यम से `AGENTS.md` को स्वयं handle करता है। OpenClaw
synthetic Codex project-doc files नहीं लिखता या persona files के लिए Codex fallback
filenames पर निर्भर नहीं करता, क्योंकि Codex fallbacks केवल तब लागू होते हैं जब
`AGENTS.md` missing हो।

OpenClaw workspace parity के लिए, Codex harness दूसरे bootstrap
files resolve करता है। `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, और `USER.md` को
OpenClaw Codex developer instructions के रूप में forward किया जाता है क्योंकि वे active agent,
available workspace guidance, और user profile define करते हैं। Compact OpenClaw skills
list turn-scoped collaboration developer instructions के रूप में forward की जाती है।
`HEARTBEAT.md` content inject नहीं किया जाता; heartbeat turns को file मौजूद और non-empty होने पर उसे पढ़ने के लिए collaboration-mode
pointer मिलता है। Configured agent workspace से `MEMORY.md` content
native Codex turn input में paste नहीं किया जाता जब उस workspace के लिए memory tools
available हों; जब यह मौजूद होता है, harness turn-scoped collaboration developer
instructions में एक छोटा workspace-memory pointer जोड़ता है और durable
memory relevant होने पर Codex को `memory_search` या `memory_get` का उपयोग करना चाहिए।
यदि tools disabled हैं, memory search unavailable है, या active workspace agent memory workspace से अलग है, तो `MEMORY.md` normal bounded turn-context path का उपयोग करता है।
`BOOTSTRAP.md` मौजूद होने पर OpenClaw turn input reference
context के रूप में forward किया जाता है।

## Environment overrides

Local testing के लिए environment overrides उपलब्ध रहते हैं:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` unset होने पर managed binary को bypass करता है।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटा दिया गया था। इसके बजाय
`plugins.entries.codex.config.appServer.mode: "guardian"` का उपयोग करें, या
one-off local testing के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` का उपयोग करें। Repeatable deployments के लिए config
preferred है क्योंकि यह plugin behavior को Codex harness setup के बाकी हिस्से वाली उसी reviewed file में रखता है।

## संबंधित

- [Codex harness](/hi/plugins/codex-harness)
- [Codex harness runtime](/hi/plugins/codex-harness-runtime)
- [Native Codex plugins](/hi/plugins/codex-native-plugins)
- [Codex Computer Use](/hi/plugins/codex-computer-use)
- [OpenAI provider](/hi/providers/openai)
- [Configuration reference](/hi/gateway/configuration-reference)
