---
read_when:
    - आपको हर Codex हार्नेस कॉन्फ़िग फ़ील्ड की आवश्यकता है
    - आप app-server transport, auth, discovery, या timeout व्यवहार बदल रहे हैं
    - आप Codex हार्नेस स्टार्टअप, मॉडल खोज, या परिवेश अलगाव को डीबग कर रहे हैं
summary: Codex हार्नेस के लिए कॉन्फ़िगरेशन, प्रमाणीकरण, डिस्कवरी, और ऐप-सर्वर संदर्भ
title: Codex हार्नेस संदर्भ
x-i18n:
    generated_at: "2026-07-04T10:40:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

यह संदर्भ bundled `codex` Plugin के विस्तृत कॉन्फ़िगरेशन को कवर करता है। सेटअप और रूटिंग निर्णयों के लिए,
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

| फ़ील्ड                     | डिफ़ॉल्ट                 | अर्थ                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | सक्षम                    | Codex app-server `model/list` के लिए मॉडल डिस्कवरी सेटिंग्स।                                                                              |
| `appServer`                | managed stdio app-server | ट्रांसपोर्ट, कमांड, auth, approval, sandbox, और timeout सेटिंग्स।                                                                         |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw dynamic tools को सीधे शुरुआती Codex tool context में रखने के लिए `"direct"` का उपयोग करें।                                       |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server turns से हटाने के लिए अतिरिक्त OpenClaw dynamic tool नाम।                                                               |
| `codexPlugins`             | अक्षम                    | migrated source-installed curated plugins के लिए native Codex plugin/app support। देखें [Native Codex plugins](/hi/plugins/codex-native-plugins)। |
| `computerUse`              | अक्षम                    | Codex Computer Use सेटअप। देखें [Codex Computer Use](/hi/plugins/codex-computer-use)।                                                        |

## App-server ट्रांसपोर्ट

डिफ़ॉल्ट रूप से, OpenClaw bundled Plugin के साथ भेजे गए managed Codex binary को शुरू करता है:

```bash
codex app-server --listen stdio://
```

यह app-server संस्करण को locally installed किसी भी अलग Codex CLI के बजाय bundled `codex` Plugin से जोड़े रखता है। `appServer.command` केवल तब सेट करें जब आप जानबूझकर कोई अलग executable चलाना चाहते हों।

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
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex को उत्पन्न करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` प्रत्येक OpenClaw agent के लिए Codex स्थिति को अलग करता है। `"user"` मूल `$CODEX_HOME` या `~/.codex` साझा करता है, मूल प्रमाणीकरण का उपयोग करता है, और केवल-स्वामी थ्रेड प्रबंधन सक्षम करता है। उपयोगकर्ता स्कोप के लिए stdio आवश्यक है।                                                                                                                                                                                               |
| `command`                                     | प्रबंधित Codex बाइनरी                                   | stdio ट्रांसपोर्ट के लिए निष्पादन योग्य। प्रबंधित बाइनरी का उपयोग करने के लिए इसे अनसेट छोड़ें।                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio ट्रांसपोर्ट के लिए आर्ग्युमेंट।                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | अनसेट                                                  | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | अनसेट                                                  | WebSocket ट्रांसपोर्ट के लिए Bearer टोकन। शाब्दिक स्ट्रिंग या `${CODEX_APP_SERVER_TOKEN}` जैसे SecretInput को स्वीकार करता है।                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket हेडर। हेडर मान शाब्दिक स्ट्रिंग या SecretInput मान स्वीकार करते हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना इनहेरिट किया गया वातावरण बनाने के बाद उत्पन्न stdio app-server प्रक्रिया से हटाए गए अतिरिक्त environment variable नाम।                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | अनसेट                                                  | दूरस्थ Codex app-server workspace root। सेट होने पर, OpenClaw हल किए गए OpenClaw workspace से स्थानीय workspace root का अनुमान लगाता है, इस दूरस्थ root के अंतर्गत वर्तमान cwd suffix को संरक्षित करता है, और Codex को केवल अंतिम app-server cwd भेजता है। यदि cwd हल किए गए OpenClaw workspace root के बाहर है, तो OpenClaw दूरस्थ app-server को gateway-local path भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server control-plane calls के लिए timeout।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा turn स्वीकार करने के बाद, या turn-scoped app-server request के बाद, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है, शांत विंडो।                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Completion-idle और progress guard, जिसका उपयोग tool handoff, native tool completion, post-tool raw assistant progress, raw reasoning completion, या reasoning progress के बाद किया जाता है, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है। इसका उपयोग विश्वसनीय या भारी workloads के लिए करें जहां post-tool synthesis अंतिम assistant release budget से अधिक समय तक वैध रूप से शांत रह सकता है।                                |
| `mode`                                        | `"yolo"` जब तक स्थानीय Codex आवश्यकताएं YOLO को अस्वीकार न करें | YOLO या संरक्षक-समीक्षित execution के लिए preset।                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` या अनुमत संरक्षक approval policy       | thread start, resume, और turn को भेजी गई मूल Codex approval policy।                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` या अनुमत संरक्षक sandbox  | thread start और resume को भेजा गया मूल Codex sandbox mode। सक्रिय OpenClaw sandboxes `danger-full-access` turns को Codex `workspace-write` तक सीमित करते हैं; turn network flag OpenClaw sandbox egress का अनुसरण करता है।                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` या अनुमत संरक्षक reviewer               | अनुमति होने पर Codex को मूल approval prompts की समीक्षा करने देने के लिए `"auto_review"` का उपयोग करें।                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | वर्तमान प्रक्रिया निर्देशिका                              | `--cwd` छोड़े जाने पर `/codex bind` द्वारा उपयोग किया गया workspace।                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | अनसेट                                                  | वैकल्पिक Codex app-server service tier। `"priority"` fast-mode routing सक्षम करता है, `"flex"` flex processing का अनुरोध करता है, और `null` override हटाता है। Legacy `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                                                 |
| `networkProxy`                                | अक्षम                                               | app-server commands के लिए Codex permissions-profile networking में opt in करें। OpenClaw चयनित `permissions.<profile>.network` config को परिभाषित करता है और `sandbox` भेजने के बजाय `default_permissions` से उसे चुनता है।                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Preview opt-in, जो Codex app-server 0.132.0 या नए के साथ OpenClaw sandbox-backed Codex environment को register करता है ताकि मूल Codex execution सक्रिय OpenClaw sandbox के अंदर चल सके।                                                                                                                                                                                                         |

`appServer.networkProxy` स्पष्ट है क्योंकि यह Codex sandbox
contract को बदलता है। सक्षम होने पर, OpenClaw Codex thread config में
`features.network_proxy.enabled` और
`default_permissions` भी सेट करता है ताकि generated permission
profile Codex managed networking शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw
profile body से collision-resistant `openclaw-network-<fingerprint>` profile name
बनाता है; `profileName` का उपयोग केवल तब करें जब स्थिर स्थानीय नाम आवश्यक हो।

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

यदि सामान्य ऐप-सर्वर runtime `danger-full-access` होता, तो `networkProxy` सक्षम करने पर जनरेट की गई permission profile के लिए workspace-शैली का filesystem access उपयोग होता है। Codex managed network enforcement सैंडबॉक्सयुक्त networking है, इसलिए full-access profile outbound traffic की रक्षा नहीं करेगी।

Plugin पुराने या unversioned ऐप-सर्वर handshakes को ब्लॉक करता है। Codex ऐप-सर्वर को stable version `0.125.0` या नया रिपोर्ट करना होगा।

OpenClaw non-loopback WebSocket ऐप-सर्वर URLs को remote मानता है और `appServer.authToken` या `Authorization` header के माध्यम से identity-bearing WebSocket auth की आवश्यकता रखता है। `appServer.authToken` और प्रत्येक `appServer.headers.*` value SecretInput हो सकती है; secrets runtime OpenClaw द्वारा ऐप-सर्वर start options बनाने से पहले SecretRefs और env shorthand को resolve करता है, और unresolved structured SecretRefs किसी token या header के भेजे जाने से पहले fail हो जाते हैं। जब native Codex plugins configure किए जाते हैं, तो OpenClaw उन plugins को install या refresh करने के लिए connected ऐप-सर्वर के plugin control plane का उपयोग करता है और फिर app inventory refresh करता है ताकि plugin-owned apps Codex thread को दिखाई दें। `app/list` अब भी authoritative inventory और metadata source है, लेकिन OpenClaw policy तय करती है कि listed accessible app के लिए `thread/start` `config.apps[appId].enabled = true` भेजे या नहीं, भले ही Codex वर्तमान में उसे disabled mark करता हो। Unknown या missing app ids fail-closed ही रहते हैं; यह path केवल marketplace plugins को `plugin/install` के माध्यम से activate करता है और inventory refresh करता है। OpenClaw को केवल उन remote ऐप-सर्वरों से connect करें जिन पर OpenClaw-managed plugin installs और app inventory refreshes स्वीकार करने के लिए भरोसा किया जाता है।

## स्वीकृति और सैंडबॉक्स modes

Local stdio ऐप-सर्वर sessions default रूप से YOLO mode पर होते हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यह trusted local operator posture unattended OpenClaw turns और heartbeats को native approval prompts के बिना आगे बढ़ने देता है, जिनका उत्तर देने के लिए कोई मौजूद नहीं होता।

यदि Codex की local system requirements file implicit YOLO approval, reviewer, या sandbox values को disallow करती है, तो OpenClaw implicit default को इसके बजाय guardian मानता है और allowed guardian permissions चुनता है। `tools.exec.mode: "auto"` भी guardian-reviewed Codex approvals को force करता है और unsafe legacy `approvalPolicy: "never"` या `sandbox: "danger-full-access"` overrides को preserve नहीं करता; intentional no-approval posture के लिए `tools.exec.mode: "full"` set करें।
उसी requirements file में hostname-matching
`[[remote_sandbox_config]]` entries sandbox default decision के लिए honored होती हैं।

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

`guardian` preset, जब ये values allowed हों, `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, और `sandbox: "workspace-write"` में expand होता है। Individual policy fields `mode` को override करते हैं। पुराना `guardian_subagent` reviewer value अब भी compatibility alias के रूप में accepted है, लेकिन नए configs को `auto_review` उपयोग करना चाहिए।

जब OpenClaw sandbox active होता है, local Codex ऐप-सर्वर process फिर भी Gateway host पर चलता है। इसलिए OpenClaw उस turn के लिए Codex native Code Mode, user MCP servers, और app-backed plugin execution को disable करता है, बजाय इसके कि Codex host-side sandboxing को OpenClaw sandbox backend के बराबर माना जाए। Shell access OpenClaw sandbox-backed dynamic tools जैसे `sandbox_exec` और `sandbox_process` के माध्यम से expose होता है, जब normal exec/process tools उपलब्ध हों।

Ubuntu/AppArmor hosts पर, जब आप active OpenClaw sandboxing के बिना native Codex `workspace-write` जानबूझकर run करते हैं, तो Codex bwrap shell command शुरू होने से पहले `workspace-write` के तहत fail हो सकता है। यदि आपको `bwrap: setting up uid map: Permission denied` या
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` दिखे, तो `openclaw doctor` run करें और broader Docker container privileges देने के बजाय OpenClaw service user के लिए reported host namespace policy fix करें। Service process के लिए scoped AppArmor profile को prefer करें; `kernel.apparmor_restrict_unprivileged_userns=0` fallback host-wide है और इसके security tradeoffs हैं।

## सैंडबॉक्सयुक्त native execution

Stable default fail-closed है: active OpenClaw sandboxing native Codex execution surfaces को disable करता है, जो अन्यथा Codex ऐप-सर्वर host से run होतीं। `appServer.experimental.sandboxExecServer: true` केवल तब उपयोग करें जब आप OpenClaw के sandbox backend के साथ Codex के remote environment support को try करना चाहते हों। इस preview path के लिए Codex ऐप-सर्वर 0.132.0 या नया आवश्यक है।

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

जब flag on हो और current OpenClaw session sandboxed हो, तो OpenClaw active sandbox द्वारा backed local loopback exec-server शुरू करता है, उसे Codex ऐप-सर्वर के साथ register करता है, और उस OpenClaw-owned environment के साथ Codex thread और turn शुरू करता है। यदि ऐप-सर्वर environment register नहीं कर सकता, तो run चुपचाप host execution पर fallback करने के बजाय fail closed होता है।

यह preview path केवल local है। Remote WebSocket ऐप-सर्वर loopback exec-server तक नहीं पहुंच सकता जब तक वह उसी host पर run न कर रहा हो, इसलिए OpenClaw उस combination को reject करता है।

## Auth और environment isolation

Default per-agent home में, auth इस order में selected होता है:

1. Agent के लिए explicit OpenClaw Codex auth profile.
2. उस agent के Codex home में ऐप-सर्वर का existing account.
3. केवल local stdio ऐप-सर्वर launches के लिए, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`, जब कोई ऐप-सर्वर account present न हो और OpenAI auth अब भी required हो।

जब OpenClaw ChatGPT subscription-style Codex auth profile देखता है, तो वह spawned Codex child process से `CODEX_API_KEY` और `OPENAI_API_KEY` हटा देता है। इससे Gateway-level API keys embeddings या direct OpenAI models के लिए उपलब्ध रहती हैं, बिना native Codex ऐप-सर्वर turns को गलती से API के माध्यम से bill कराए।

Explicit Codex API-key profiles और local stdio env-key fallback inherited child-process env के बजाय ऐप-सर्वर login का उपयोग करते हैं। WebSocket ऐप-सर्वर connections को Gateway env API-key fallback नहीं मिलता; explicit auth profile या remote ऐप-सर्वर के अपने account का उपयोग करें।

Stdio ऐप-सर्वर launches default रूप से OpenClaw का process environment inherit करते हैं। OpenClaw Codex ऐप-सर्वर account bridge own करता है और `CODEX_HOME` को उस agent के OpenClaw state के अंतर्गत per-agent directory पर set करता है। इससे Codex config, accounts, plugin cache/data, और thread state operator के personal `~/.codex` home से leak होने के बजाय OpenClaw agent तक scoped रहते हैं।

Native Codex state को Codex Desktop और CLI के साथ share करने के लिए `appServer.homeScope: "user"` set करें। यह local-stdio-only mode `$CODEX_HOME` set होने पर उसका उपयोग करता है और अन्यथा `~/.codex` का, जिसमें native auth, config, plugins, और threads शामिल हैं। OpenClaw ऐप-सर्वर के लिए अपना auth-profile bridge skip करता है। Verified owner turns `codex_threads` का उपयोग करके उन threads को list, search, read, fork, rename, archive, और restore कर सकते हैं। OpenClaw में thread जारी रखने से पहले उसे fork करें; independent Codex processes उसी thread के लिए concurrent writers को coordinate नहीं करते।

OpenClaw normal local ऐप-सर्वर launches के लिए `HOME` rewrite नहीं करता। Codex-run subprocesses जैसे `openclaw`, `gh`, `git`, cloud CLIs, और shell commands normal process home देखते हैं और user-home config और tokens खोज सकते हैं। Codex `$HOME/.agents/skills` और `$HOME/.agents/plugins/marketplace.json` भी discover कर सकता है; वह `.agents` discovery जानबूझकर operator home के साथ shared है और isolated `~/.codex` state से अलग है।

Default agent scope में, OpenClaw plugins और OpenClaw skill snapshots अब भी OpenClaw की अपनी plugin registry और skill loader से होकर flow करते हैं; personal Codex `~/.codex` assets नहीं। यदि आपके पास Codex home से उपयोगी Codex CLI skills या plugins हैं जिन्हें isolated OpenClaw agent का हिस्सा बनना चाहिए, तो उन्हें explicitly inventory करें:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

यदि किसी deployment को additional environment isolation चाहिए, तो उन variables को `appServer.clearEnv` में add करें:

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

`appServer.clearEnv` केवल spawned Codex ऐप-सर्वर child process को affect करता है। OpenClaw local launch normalization के दौरान इस list से `CODEX_HOME` और `HOME` हटाता है: `CODEX_HOME` selected agent या user scope की ओर pointed रहता है, और `HOME` inherited रहता है ताकि subprocesses normal user-home state का उपयोग कर सकें।

## Dynamic tools

Codex dynamic tools default रूप से `searchable` loading पर होते हैं। OpenClaw ऐसे dynamic tools expose नहीं करता जो Codex-native workspace operations को duplicate करते हैं:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

अधिकांश बाकी OpenClaw integration tools, जैसे messaging, media, cron, browser, nodes, gateway, `heartbeat_respond`, और `web_search`, `openclaw` namespace के अंतर्गत Codex tool search के माध्यम से उपलब्ध हैं। इससे initial model context छोटा रहता है। `sessions_yield` और message-tool-only source replies direct रहते हैं क्योंकि वे turn-control contracts हैं। `sessions_spawn` searchable रहता है ताकि Codex का native `spawn_agent` primary Codex subagent surface बना रहे, जबकि explicit OpenClaw या ACP delegation अब भी `openclaw` dynamic tool namespace के माध्यम से उपलब्ध है।

`codexDynamicToolsLoading: "direct"` केवल तब set करें जब custom Codex ऐप-सर्वर से connect कर रहे हों जो deferred dynamic tools search नहीं कर सकता या full tool payload debug कर रहे हों।

## Timeouts

OpenClaw-owned dynamic tool calls `appServer.requestTimeoutMs` से स्वतंत्र रूप से bounded होते हैं। प्रत्येक Codex `item/tool/call` request इस order में पहला available timeout उपयोग करता है:

- Positive per-call `timeoutMs` argument.
- `image_generate` के लिए, `agents.defaults.imageGenerationModel.timeoutMs`.
- Configured timeout के बिना `image_generate` के लिए, 120 second
  image-generation default.
- Media-understanding `image` tool के लिए, `tools.media.image.timeoutSeconds`
  को milliseconds में converted, या 60 second media default. Image
  understanding के लिए, यह request itself पर apply होता है और earlier preparation work से reduced नहीं होता।
- 90 second dynamic-tool default.

यह watchdog outer dynamic `item/tool/call` budget है। Provider-specific request timeouts उस call के अंदर run होते हैं और अपनी timeout semantics रखते हैं। Dynamic tool budgets 600000 ms पर capped हैं। Timeout पर, OpenClaw जहां supported हो tool signal abort करता है और Codex को failed dynamic-tool response return करता है ताकि turn session को `processing` में छोड़ने के बजाय continue कर सके।

Codex द्वारा turn accept करने के बाद, और OpenClaw द्वारा turn-scoped ऐप-सर्वर request का response देने के बाद, harness अपेक्षा करता है कि Codex current-turn progress करे और अंततः native turn को `turn/completed` के साथ finish करे। यदि ऐप-सर्वर `appServer.turnCompletionIdleTimeoutMs` तक quiet रहता है, तो OpenClaw best-effort Codex turn interrupt करता है, diagnostic timeout record करता है, और OpenClaw session lane release करता है ताकि follow-up chat messages stale native turn के पीछे queued न रहें।

एक ही टर्न के लिए अधिकांश गैर-टर्मिनल सूचनाएं उस छोटे वॉचडॉग को निष्क्रिय कर देती हैं
क्योंकि Codex ने साबित कर दिया है कि टर्न अभी भी जीवित है। टूल हैंडऑफ लंबे
पोस्ट-टूल निष्क्रिय बजट का उपयोग करते हैं: OpenClaw द्वारा `item/tool/call` प्रतिक्रिया लौटाने के बाद, `commandExecution` जैसे
नेटिव टूल आइटम पूरे होने के बाद, कच्चे
`custom_tool_call_output` पूर्ण होने के बाद, और पोस्ट-टूल कच्ची सहायक
प्रगति, कच्चे reasoning पूर्ण होने, या reasoning प्रगति के बाद। कॉन्फ़िगर होने पर गार्ड
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` का उपयोग करता है और
अन्यथा डिफ़ॉल्ट रूप से पांच मिनट उपयोग करता है। वही पोस्ट-टूल बजट Codex के अगले
वर्तमान-टर्न इवेंट उत्सर्जित करने से पहले की मौन synthesis विंडो के लिए
प्रगति वॉचडॉग को भी बढ़ाता है। Reasoning पूर्णताएं, commentary
`agentMessage` पूर्णताएं, और प्री-टूल कच्ची reasoning या सहायक प्रगति के बाद
स्वचालित अंतिम उत्तर आ सकता है, इसलिए वे सेशन लेन को तुरंत रिलीज़ करने के बजाय
पोस्ट-प्रोग्रेस उत्तर गार्ड का उपयोग करते हैं। केवल
अंतिम/गैर-commentary पूर्ण `agentMessage` आइटम और प्री-टूल कच्ची सहायक
पूर्णताएं सहायक-आउटपुट रिलीज़ को सक्रिय करती हैं: यदि Codex फिर
`turn/completed` के बिना शांत हो जाता है, तो OpenClaw सर्वोत्तम-प्रयास से नेटिव टर्न को बाधित करता है और
सेशन लेन रिलीज़ करता है। रीप्ले-सुरक्षित stdio app-server विफलताएं, जिनमें
assistant, tool, active-item, या side-effect प्रमाण के बिना turn-completion idle timeouts शामिल हैं,
एक ताज़ा app-server प्रयास पर एक बार फिर से आज़माई जाती हैं। असुरक्षित
timeouts फिर भी अटके हुए app-server client को रिटायर करते हैं और OpenClaw
session lane रिलीज़ करते हैं। वे stale native thread binding को भी अपने-आप
रीप्ले करने के बजाय साफ़ कर देते हैं। Completion-watch timeouts Codex-विशिष्ट timeout
पाठ दिखाते हैं: रीप्ले-सुरक्षित मामलों में कहा जाता है कि response अधूरी हो सकती है, जबकि असुरक्षित मामले
उपयोगकर्ता से दोबारा कोशिश करने से पहले वर्तमान स्थिति सत्यापित करने को कहते हैं। सार्वजनिक timeout diagnostics
में संरचनात्मक fields शामिल होते हैं, जैसे अंतिम app-server notification method,
raw assistant response item id/type/role, active request/item counts, और armed
watch state। जब अंतिम notification एक raw assistant response item होती है, तो उनमें
सीमित assistant text preview भी शामिल होता है। इनमें raw prompt या
tool content शामिल नहीं होता।

## मॉडल खोज

डिफ़ॉल्ट रूप से, Codex Plugin उपलब्ध मॉडलों के लिए app-server से पूछता है। मॉडल
उपलब्धता Codex app-server के स्वामित्व में है, इसलिए OpenClaw द्वारा bundled `@openai/codex` version upgrade करने पर या deployment द्वारा
`appServer.command` को किसी अलग Codex binary पर point करने पर list बदल सकती है।
उपलब्धता account-scoped भी हो सकती है। उस harness और account के लिए live catalog देखने हेतु running gateway पर `/codex models` उपयोग करें।

यदि discovery विफल हो जाती है या timeout हो जाती है, तो OpenClaw इनके लिए bundled fallback catalog उपयोग करता है:

- GPT-5.5
- GPT-5.4 mini

वर्तमान bundled harness `@openai/codex` `0.142.4` है। GPT-5.6-enabled workspace में उस bundled app-server के विरुद्ध `model/list` probe ने ये
public picker rows लौटाईं:

| मॉडल id              | इनपुट modalities | Reasoning efforts                    |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh             |

सीमित preview के दौरान GPT-5.6 access account-scoped है। `max` एक model
reasoning effort है। `ultra` अलग Codex multi-agent orchestration metadata है,
standard OpenAI reasoning effort नहीं।

Hidden models internal या specialized flows के लिए app-server catalog द्वारा लौटाए जा सकते हैं,
लेकिन वे सामान्य model-picker choices नहीं होते।

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

जब आप चाहते हैं कि startup Codex probe करने से बचे और केवल
fallback catalog उपयोग करे, तो discovery disable करें:

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
filenames पर निर्भर नहीं करता, क्योंकि Codex fallbacks केवल तब लागू होते हैं जब
`AGENTS.md` मौजूद न हो।

OpenClaw workspace parity के लिए, Codex harness बाकी bootstrap
files resolve करता है। `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, और `USER.md` को
OpenClaw Codex developer instructions के रूप में forward किया जाता है क्योंकि वे active agent,
available workspace guidance, और user profile define करते हैं। Compact OpenClaw skills
list को turn-scoped collaboration developer instructions के रूप में forward किया जाता है।
`HEARTBEAT.md` content inject नहीं किया जाता; heartbeat turns को file मौजूद और non-empty होने पर उसे पढ़ने के लिए collaboration-mode
pointer मिलता है। Configured agent workspace से `MEMORY.md` content
native Codex turn input में paste नहीं किया जाता
जब उस workspace के लिए memory tools उपलब्ध हों; जब यह मौजूद होता है, तो harness
turn-scoped collaboration developer instructions में एक छोटा workspace-memory pointer जोड़ता है
और durable memory relevant होने पर Codex को `memory_search` या `memory_get` उपयोग करना चाहिए।
यदि tools disabled हैं, memory search unavailable है, या
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

`appServer.command` unset होने पर `OPENCLAW_CODEX_APP_SERVER_BIN` managed binary को bypass करता है।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटा दिया गया था। इसके बजाय
`plugins.entries.codex.config.appServer.mode: "guardian"` उपयोग करें, या
one-off local testing के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` उपयोग करें। Repeatable deployments के लिए
config बेहतर है क्योंकि यह Plugin behavior को बाकी Codex harness setup के समान
reviewed file में रखता है।

## संबंधित

- [Codex harness](/hi/plugins/codex-harness)
- [Codex harness runtime](/hi/plugins/codex-harness-runtime)
- [Native Codex plugins](/hi/plugins/codex-native-plugins)
- [Codex Computer Use](/hi/plugins/codex-computer-use)
- [OpenAI provider](/hi/providers/openai)
- [Configuration reference](/hi/gateway/configuration-reference)
