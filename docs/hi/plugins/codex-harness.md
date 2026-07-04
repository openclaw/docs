---
read_when:
    - आप bundled Codex app-server harness का उपयोग करना चाहते हैं
    - आपको Codex हार्नेस कॉन्फ़िगरेशन उदाहरणों की आवश्यकता है
    - आप चाहते हैं कि केवल-Codex deployments OpenClaw पर वापस जाने के बजाय विफल हों
summary: बंडल किए गए Codex app-server हार्नेस के माध्यम से OpenClaw एम्बेडेड एजेंट टर्न चलाएँ
title: Codex हार्नेस
x-i18n:
    generated_at: "2026-07-04T10:40:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

The bundled `codex` plugin lets OpenClaw run embedded OpenAI agent turns
through Codex app-server instead of the built-in OpenClaw harness.

Use the Codex harness when you want Codex to own the low-level agent session:
native thread resume, native tool continuation, native compaction, and
app-server execution. OpenClaw still owns chat channels, session files, model
selection, OpenClaw dynamic tools, approvals, media delivery, and the visible
transcript mirror.

The normal setup uses canonical OpenAI model refs such as `openai/gpt-5.5`.
Do not configure legacy Codex GPT refs. Put OpenAI agent auth order
under `auth.order.openai`; older legacy Codex auth profile ids and
legacy Codex auth order entries are legacy state repaired by
`openclaw doctor --fix`.

When no OpenClaw sandbox is active, OpenClaw starts Codex app-server threads
with Codex native code mode enabled while leaving code-mode-only off by default.
That keeps Codex native workspace and code capabilities available while
OpenClaw dynamic tools continue through the app-server `item/tool/call` bridge.
Active OpenClaw sandboxing and restricted tool policies disable native code mode
entirely unless you opt into the experimental sandbox exec-server path.

This Codex-native feature is separate from
[OpenClaw code mode](/hi/reference/code-mode), which is an opt-in QuickJS-WASI
runtime for generic OpenClaw runs with a different `exec` input shape.

For the broader model/provider/runtime split, start with
[Agent runtimes](/hi/concepts/agent-runtimes). The short version is:
`openai/gpt-5.5` is the model ref, `codex` is the runtime, and Telegram,
Discord, Slack, or another channel remains the communication surface.

## आवश्यकताएँ

- OpenClaw with the bundled `codex` plugin available.
- If your config uses `plugins.allow`, include `codex`.
- Codex app-server `0.125.0` or newer. The bundled plugin manages a compatible
  Codex app-server binary by default, so local `codex` commands on `PATH` do not
  affect normal harness startup.
- Codex auth available through `openclaw models auth login --provider openai`,
  an app-server account in the agent's Codex home, or an explicit Codex API-key
  auth profile.

For auth precedence, environment isolation, custom app-server commands, model
discovery, and all config fields, see
[Codex harness reference](/hi/plugins/codex-harness-reference).

## त्वरित शुरुआत

Most users who want Codex in OpenClaw want this path: sign in with a
ChatGPT/Codex subscription, enable the bundled `codex` plugin, and use a
canonical `openai/gpt-*` model ref.

Sign in with Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Enable the bundled `codex` plugin and select an OpenAI agent model:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

If your config uses `plugins.allow`, add `codex` there too:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Restart the gateway after changing plugin config. If an existing chat already
has a session, use `/new` or `/reset` before testing runtime changes so the next
turn resolves the harness from current config.

## Codex Desktop और CLI के साथ threads साझा करें

The default `appServer.homeScope: "agent"` keeps each OpenClaw agent isolated
from the operator's native Codex state. To let an owner ask OpenClaw to inspect
and manage the same native threads shown by Codex Desktop and the Codex CLI,
opt into the user Codex home:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

User-home mode is available only with local stdio transport. It uses
`$CODEX_HOME` when set and `~/.codex` otherwise, including that home's native
Codex auth, config, plugins, and thread store. OpenClaw does not inject an
OpenClaw auth profile into this app-server.

Owner turns gain the `codex_threads` tool. It can list, search, read, fork,
rename, archive, and restore native threads. Ask the agent to fork a thread when
you want to continue it in OpenClaw; the fork is attached to the current
OpenClaw session and remains visible to other native Codex clients. Archive
requires explicit confirmation that the thread is closed elsewhere.

Do not resume or write the same thread concurrently from OpenClaw and another
Codex client. Codex coordinates live writers inside one app-server process, not
across independent Desktop, CLI, and OpenClaw processes. Forking creates a
separate continuation and is the safe coexistence path.

## Configuration

The quickstart config is the minimum viable Codex harness config. Set Codex
harness options in OpenClaw config, and use the CLI only for Codex auth:

| Need                                   | Set                                                                              | Where                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Enable the harness                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw config                    |
| Keep an allowlisted plugin install     | Include `codex` in `plugins.allow`                                               | OpenClaw config                    |
| Route OpenAI agent turns through Codex | `agents.defaults.model` or `agents.list[].model` as `openai/gpt-*`               | OpenClaw agent config              |
| Sign in with ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | CLI auth profile                   |
| Add API-key backup for Codex runs      | `openai:*` API-key profile listed after subscription auth in `auth.order.openai` | CLI auth profile + OpenClaw config |
| Fail closed when Codex is unavailable  | Provider or model `agentRuntime.id: "codex"`                                     | OpenClaw model/provider config     |
| Use direct OpenAI API traffic          | Provider or model `agentRuntime.id: "openclaw"` with normal OpenAI auth          | OpenClaw model/provider config     |
| Tune app-server behavior               | `plugins.entries.codex.config.appServer.*`                                       | Codex plugin config                |
| Enable native Codex plugin apps        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex plugin config                |
| Enable Codex Computer Use              | `plugins.entries.codex.config.computerUse.*`                                     | Codex plugin config                |

Use `openai/gpt-*` model refs for Codex-backed OpenAI agent turns. Prefer
`auth.order.openai` for subscription-first/API-key-backup ordering. Existing
legacy Codex auth profile ids and legacy Codex auth order are doctor-only
legacy state; do not write new legacy Codex GPT refs.

Do not set `compaction.model` or `compaction.provider` on Codex-backed agents.
Codex compacts through its native app-server thread state, so OpenClaw ignores
those local summarizer overrides at runtime and `openclaw doctor --fix` removes
them when the agent uses Codex.

Lossless remains supported as a context engine for assembly, ingestion, and
maintenance around Codex turns. Configure it through
`plugins.slots.contextEngine: "lossless-claw"` and
`plugins.entries.lossless-claw.config.summaryModel`, not through
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migrates the old
`compaction.provider: "lossless-claw"` shape to the Lossless context-engine slot
when Codex is the active runtime, but native Codex still owns compaction.

The native Codex app-server harness supports context engines that require
pre-prompt assembly. Generic CLI backends, including `codex-cli`, do not provide
that host capability.

For Codex-backed agents, `/compact` starts native Codex app-server compaction on
the bound thread. OpenClaw does not wait for completion, impose an OpenClaw
timeout, restart the shared app-server, or fall back to a context-engine or
public OpenAI summarizer. If the native Codex thread binding is missing or
stale, the command fails closed so the operator sees the real runtime boundary
instead of silently switching compaction backends.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In that shape, both profiles still run through Codex for `openai/gpt-*` agent
turns. The API key is only an auth fallback, not a request to switch to OpenClaw or
plain OpenAI Responses.

The rest of this page covers common variants users must choose between:
deployment shape, fail-closed routing, guardian approval policy, native Codex
plugins, and Computer Use. For full option lists, defaults, enums, discovery,
environment isolation, timeouts, and app-server transport fields, see
[Codex harness reference](/hi/plugins/codex-harness-reference).

## Codex runtime सत्यापित करें

Use `/status` in the chat where you expect Codex. A Codex-backed OpenAI agent
turn shows:

```text
Runtime: OpenAI Codex
```

Then check Codex app-server state:

```text
/codex status
/codex models
```

`/codex status` reports app-server connectivity, account, rate limits, MCP
servers, and skills. `/codex models` lists the live Codex app-server catalog for
the harness and account. If `/status` is surprising, see
[Troubleshooting](#troubleshooting).

## Routing और model selection

Keep provider refs and runtime policy separate:

- Use `openai/gpt-*` for OpenAI agent turns through Codex.
- Do not use legacy Codex GPT refs in config. Run `openclaw doctor --fix` to
  repair legacy refs and stale session route pins.
- `agentRuntime.id: "codex"` is optional for normal OpenAI auto mode, but useful
  when a deployment should fail closed if Codex is unavailable.
- `agentRuntime.id: "openclaw"` opts a provider or model into the OpenClaw
  embedded runtime when that is intentional.
- `/codex ...` controls native Codex app-server conversations from chat.
- ACP/acpx is a separate external harness path. Use it only when the user asks
  for ACP/acpx or an external harness adapter.

Common command routing:

| उपयोगकर्ता का इरादा                                  | उपयोग                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| वर्तमान चैट संलग्न करें                              | `/codex bind [--cwd <path>]`                                                                          |
| मौजूदा Codex थ्रेड फिर से शुरू करें                  | `/codex resume <thread-id>`                                                                           |
| Codex थ्रेड सूचीबद्ध या फ़िल्टर करें                 | `/codex threads [filter]`                                                                             |
| मूल Codex Plugin सूचीबद्ध करें                       | `/codex plugins list`                                                                                 |
| कॉन्फ़िगर किए गए मूल Codex Plugin को सक्षम या अक्षम करें | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| युग्मित नोड पर मौजूदा Codex CLI सत्र संलग्न करें     | `/codex sessions --host <node> [filter]`, फिर `/codex resume <session-id> --host <node> --bind here` |
| केवल Codex फ़ीडबैक भेजें                             | `/codex diagnostics [note]`                                                                           |
| ACP/acpx कार्य शुरू करें                             | ACP/acpx सत्र कमांड, `/codex` नहीं                                                                   |

| उपयोग का मामला                                      | कॉन्फ़िगर करें                                                        | सत्यापित करें                          | नोट्स                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| मूल Codex रनटाइम के साथ ChatGPT/Codex सदस्यता       | `openai/gpt-*` और सक्षम `codex` Plugin                                 | `/status` में `Runtime: OpenAI Codex` दिखता है | अनुशंसित मार्ग                       |
| Codex अनुपलब्ध होने पर बंद होकर विफल करें           | प्रदाता या मॉडल `agentRuntime.id: "codex"`                             | अंतर्निहित फ़ॉलबैक के बजाय टर्न विफल होता है | केवल Codex तैनातियों के लिए उपयोग करें |
| OpenClaw के माध्यम से प्रत्यक्ष OpenAI API-कुंजी ट्रैफ़िक | प्रदाता या मॉडल `agentRuntime.id: "openclaw"` और सामान्य OpenAI प्रमाणीकरण | `/status` OpenClaw रनटाइम दिखाता है    | केवल तब उपयोग करें जब OpenClaw अभिप्रेत हो |
| लेगेसी कॉन्फ़िग                                      | लेगेसी Codex GPT रेफ़रेंस                                              | `openclaw doctor --fix` इसे फिर से लिखता है | नया कॉन्फ़िग इस तरह न लिखें          |
| ACP/acpx Codex अडैप्टर                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP कार्य/सत्र स्थिति                  | मूल Codex हार्नेस से अलग             |

`agents.defaults.imageModel` उसी प्रीफ़िक्स विभाजन का पालन करता है। सामान्य OpenAI मार्ग के लिए `openai/gpt-*`
और केवल तब `codex/gpt-*` उपयोग करें जब छवि समझ को सीमित Codex ऐप-सर्वर टर्न के माध्यम से चलना
चाहिए। लेगेसी Codex GPT रेफ़रेंस का उपयोग न करें; doctor उस लेगेसी प्रीफ़िक्स को `openai/gpt-*` में फिर से लिखता है।

## तैनाती पैटर्न

### बुनियादी Codex तैनाती

जब सभी OpenAI एजेंट टर्न को डिफ़ॉल्ट रूप से Codex का उपयोग करना चाहिए, तब क्विकस्टार्ट कॉन्फ़िग का उपयोग करें।

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### मिश्रित प्रदाता तैनाती

यह आकार Claude को डिफ़ॉल्ट एजेंट बनाए रखता है और एक नामित Codex एजेंट जोड़ता है:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

इस कॉन्फ़िग के साथ, `main` एजेंट अपने सामान्य प्रदाता मार्ग का उपयोग करता है और
`codex` एजेंट Codex ऐप-सर्वर का उपयोग करता है।

### बंद होकर विफल होने वाली Codex तैनाती

OpenAI एजेंट टर्न के लिए, बंडल किया गया Plugin उपलब्ध होने पर `openai/gpt-*` पहले से ही Codex पर
रिज़ॉल्व होता है। जब आप लिखित बंद-होकर-विफल नियम चाहते हैं, तो स्पष्ट रनटाइम नीति जोड़ें:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex को बाध्य करने पर, यदि Codex Plugin अक्षम है, ऐप-सर्वर बहुत पुराना है, या ऐप-सर्वर शुरू नहीं हो सकता,
तो OpenClaw जल्दी विफल हो जाता है।

## ऐप-सर्वर नीति

डिफ़ॉल्ट रूप से, Plugin OpenClaw के प्रबंधित Codex बाइनरी को स्थानीय रूप से stdio
ट्रांसपोर्ट के साथ शुरू करता है। `appServer.command` केवल तब सेट करें जब आप जानबूझकर कोई
अलग executable चलाना चाहते हों। WebSocket ट्रांसपोर्ट केवल तब उपयोग करें जब कोई ऐप-सर्वर पहले से
कहीं और चल रहा हो:

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
          },
        },
      },
    },
  },
}
```

स्थानीय stdio ऐप-सर्वर सत्र डिफ़ॉल्ट रूप से विश्वसनीय स्थानीय ऑपरेटर मुद्रा अपनाते हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यदि स्थानीय Codex आवश्यकताएं उस अंतर्निहित YOLO मुद्रा को अस्वीकार करती हैं,
तो OpenClaw इसके बजाय अनुमत guardian अनुमतियां चुनता है।
जब सत्र के लिए OpenClaw sandbox सक्रिय होता है, तो OpenClaw उस टर्न के लिए Codex
मूल Code Mode, उपयोगकर्ता MCP सर्वर और ऐप-समर्थित Plugin निष्पादन को अक्षम कर देता है,
Codex होस्ट-पक्ष sandboxing पर निर्भर रहने के बजाय। सामान्य exec/process टूल उपलब्ध होने पर Shell पहुंच
OpenClaw sandbox-समर्थित dynamic tools जैसे `sandbox_exec` और
`sandbox_process` के माध्यम से उजागर की जाती है।

जब आप sandbox से बाहर निकलने या अतिरिक्त अनुमतियों से पहले Codex मूल auto-review चाहते हैं, तो सामान्यीकृत OpenClaw exec मोड उपयोग करें:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex ऐप-सर्वर सत्रों के लिए, OpenClaw `tools.exec.mode: "auto"` को Codex
Guardian-समीक्षित अनुमोदनों पर मैप करता है, आमतौर पर
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, और
`sandbox: "workspace-write"` जब स्थानीय आवश्यकताएं उन मानों की अनुमति देती हैं।
`tools.exec.mode: "auto"` में, OpenClaw लेगेसी असुरक्षित Codex
`approvalPolicy: "never"` या `sandbox: "danger-full-access"` ओवरराइड संरक्षित नहीं करता; जानबूझकर बिना-अनुमोदन Codex मुद्रा के लिए
`tools.exec.mode: "full"` उपयोग करें। लेगेसी `plugins.entries.codex.config.appServer.mode: "guardian"` प्रीसेट अभी भी
काम करता है, लेकिन `tools.exec.mode: "auto"` सामान्यीकृत OpenClaw सतह है।

होस्ट exec अनुमोदनों और ACPX अनुमतियों के साथ मोड-स्तर तुलना के लिए,
[अनुमति मोड](/hi/tools/permission-modes) देखें।

प्रत्येक ऐप-सर्वर फ़ील्ड, प्रमाणीकरण क्रम, environment isolation, discovery, और
timeout behavior के लिए, [Codex harness reference](/hi/plugins/codex-harness-reference) देखें।

## कमांड और निदान

बंडल किया गया Plugin किसी भी ऐसे चैनल पर `/codex` को slash command के रूप में पंजीकृत करता है
जो OpenClaw text commands का समर्थन करता है।

मूल निष्पादन और नियंत्रण के लिए owner या `operator.admin` Gateway
client आवश्यक है। इसमें थ्रेड bind या resume करना, turns भेजना या रोकना,
model, fast-mode, या permission state बदलना, compacting या reviewing, और
binding detach करना शामिल है। अन्य अधिकृत senders के पास read-only status, help,
account, model, thread, MCP server, skill, और binding inspection commands बने रहते हैं।

सामान्य रूप:

- `/codex status` ऐप-सर्वर connectivity, models, account, rate limits,
  MCP servers, और skills जांचता है।
- `/codex models` live Codex ऐप-सर्वर models सूचीबद्ध करता है।
- `/codex threads [filter]` हाल के Codex ऐप-सर्वर threads सूचीबद्ध करता है।
- `/codex resume <thread-id>` वर्तमान OpenClaw सत्र को मौजूदा Codex thread से संलग्न करता है।
- `/codex compact` Codex ऐप-सर्वर से संलग्न thread को compact करने के लिए कहता है।
- `/codex review` संलग्न thread के लिए Codex native review शुरू करता है।
- `/codex diagnostics [note]` संलग्न thread के लिए Codex feedback भेजने से पहले पूछता है।
- `/codex account` account और rate-limit status दिखाता है।
- `/codex mcp` Codex ऐप-सर्वर MCP server status सूचीबद्ध करता है।
- `/codex skills` Codex ऐप-सर्वर skills सूचीबद्ध करता है।

अधिकांश support reports के लिए, उस conversation में `/diagnostics [note]` से शुरू करें
जहां bug हुआ था। यह एक Gateway diagnostics report बनाता है और, Codex
harness sessions के लिए, संबंधित Codex feedback bundle भेजने की स्वीकृति मांगता है।
privacy model और group chat behavior के लिए [Diagnostics export](/hi/gateway/diagnostics) देखें।

`/codex diagnostics [note]` केवल तब उपयोग करें जब आप वर्तमान में संलग्न thread के लिए full Gateway
diagnostics bundle के बिना विशेष रूप से Codex feedback upload चाहते हों।

### Codex threads को स्थानीय रूप से निरीक्षण करें

खराब Codex run का निरीक्षण करने का सबसे तेज़ तरीका अक्सर native Codex
thread को सीधे खोलना होता है:

```bash
codex resume <thread-id>
```

thread id पूर्ण `/diagnostics` reply, `/codex binding`, या
`/codex threads [filter]` से प्राप्त करें।

upload mechanics और runtime-level diagnostics boundaries के लिए,
[Codex harness runtime](/hi/plugins/codex-harness-runtime#codex-feedback-upload) देखें।

डिफ़ॉल्ट per-agent home में, auth इस क्रम में चुना जाता है:

1. एजेंट के लिए ordered OpenAI auth profiles, बेहतर होगा
   `auth.order.openai` के अंतर्गत। पुराने लेगेसी Codex auth profile ids और लेगेसी Codex auth order migrate करने के लिए `openclaw doctor --fix` चलाएं।
2. उस एजेंट के Codex home में ऐप-सर्वर का मौजूदा account।
3. केवल स्थानीय stdio ऐप-सर्वर launches के लिए, जब कोई ऐप-सर्वर account मौजूद नहीं है और OpenAI auth
   अभी भी आवश्यक है, तो `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`।

जब OpenClaw को ChatGPT subscription-style Codex auth profile दिखती है, तो यह spawned Codex child process से
`CODEX_API_KEY` और `OPENAI_API_KEY` हटा देता है। इससे Gateway-level API keys embeddings या direct OpenAI models
के लिए उपलब्ध रहती हैं, बिना native Codex app-server turns को गलती से API के माध्यम से bill कराए।
Explicit Codex API-key profiles और local stdio env-key fallback inherited child-process env के बजाय app-server
login उपयोग करते हैं। WebSocket app-server connections को Gateway env API-key fallback प्राप्त नहीं होता; explicit auth profile या
remote app-server का अपना account उपयोग करें।
जब native Codex plugins कॉन्फ़िगर किए जाते हैं, तो OpenClaw plugin-owned apps को
Codex thread के सामने उजागर करने से पहले connected app-server के माध्यम से उन
plugins को install या refresh करता है। `app/list` app ids,
accessibility, और metadata के लिए source of truth बना रहता है, लेकिन OpenClaw per-thread enablement
decision का owner है: यदि policy किसी listed accessible app की अनुमति देती है, तो OpenClaw
`thread/start.config.apps[appId].enabled = true` भेजता है, भले ही `app/list` वर्तमान में
उस app को disabled रिपोर्ट करता हो। यह path unknown ids के लिए app installation invent नहीं करता;
OpenClaw केवल marketplace plugins को `plugin/install` से activate करता है
और फिर inventory refresh करता है।

यदि कोई subscription profile Codex usage limit से टकराती है, तो Codex द्वारा reset time रिपोर्ट करने पर OpenClaw उसे record करता है
और उसी Codex run के लिए अगली ordered auth profile आज़माता है।
reset time बीतने पर, subscription profile फिर से eligible हो जाती है
बिना selected `openai/gpt-*` model या Codex runtime बदले।

स्थानीय stdio ऐप-सर्वर लॉन्च के लिए, OpenClaw `CODEX_HOME` को प्रति-एजेंट
डायरेक्टरी पर सेट करता है ताकि Codex कॉन्फ़िग, auth/account फ़ाइलें, Plugin कैश/डेटा, और नेटिव
थ्रेड स्थिति डिफ़ॉल्ट रूप से ऑपरेटर के निजी `~/.codex` को पढ़ें या उसमें लिखें नहीं।
OpenClaw सामान्य प्रक्रिया `HOME` को बनाए रखता है; Codex-द्वारा चलाए गए सबप्रोसेस
अब भी उपयोगकर्ता-होम कॉन्फ़िग और टोकन ढूंढ सकते हैं, और Codex साझा
`$HOME/.agents/skills` और `$HOME/.agents/plugins/marketplace.json` प्रविष्टियां खोज सकता है।
`appServer.homeScope: "user"` के साथ, OpenClaw इसके बजाय नेटिव उपयोगकर्ता Codex
होम और उसके मौजूदा खाते का उपयोग करता है, बिना OpenClaw auth प्रोफ़ाइल इंजेक्ट किए।

यदि किसी डिप्लॉयमेंट को अतिरिक्त एनवायरनमेंट अलगाव चाहिए, तो उन वेरिएबल्स को
`appServer.clearEnv` में जोड़ें:

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

`appServer.clearEnv` केवल स्पॉन किए गए Codex ऐप-सर्वर चाइल्ड प्रोसेस को प्रभावित करता है।
OpenClaw स्थानीय लॉन्च नॉर्मलाइज़ेशन के दौरान इस सूची से `CODEX_HOME` और `HOME`
हटा देता है: `CODEX_HOME` चयनित एजेंट या उपयोगकर्ता स्कोप की ओर इंगित रहता है,
और `HOME` इनहेरिटेड रहता है ताकि सबप्रोसेस सामान्य उपयोगकर्ता-होम स्थिति का उपयोग कर सकें।

Codex डायनेमिक टूल डिफ़ॉल्ट रूप से `searchable` लोडिंग का उपयोग करते हैं। OpenClaw
ऐसे डायनेमिक टूल एक्सपोज़ नहीं करता जो Codex-नेटिव वर्कस्पेस ऑपरेशनों की नकल करते हैं:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, और `update_plan`। बचे हुए
अधिकांश OpenClaw इंटीग्रेशन टूल, जैसे मैसेजिंग, मीडिया, cron, ब्राउज़र, नोड्स,
gateway, और `heartbeat_respond`, `openclaw` नेमस्पेस के तहत Codex टूल खोज के
माध्यम से उपलब्ध हैं, जिससे प्रारंभिक मॉडल संदर्भ छोटा रहता है। खोज सक्षम होने और
कोई मैनेज्ड प्रदाता चयनित न होने पर वेब खोज डिफ़ॉल्ट रूप से Codex के होस्टेड
`web_search` टूल का उपयोग करती है। नेटिव होस्टेड खोज और OpenClaw का मैनेज्ड
`web_search` डायनेमिक टूल परस्पर अनन्य हैं, ताकि मैनेज्ड खोज नेटिव डोमेन प्रतिबंधों को
बायपास न कर सके। जब होस्टेड खोज अनुपलब्ध हो, स्पष्ट रूप से अक्षम हो, या किसी चयनित
मैनेज्ड प्रदाता से बदली गई हो, तो OpenClaw मैनेज्ड टूल का उपयोग करता है। OpenClaw
Codex के स्टैंडअलोन `web.run` एक्सटेंशन को अक्षम रखता है क्योंकि प्रोडक्शन ऐप-सर्वर
ट्रैफ़िक उसके उपयोगकर्ता-परिभाषित `web` नेमस्पेस को अस्वीकार करता है।
`tools.web.search.enabled: false` दोनों पाथ अक्षम करता है, जैसे टूल-अक्षम
LLM-only रन करते हैं। Codex `"cached"` को प्राथमिकता के रूप में मानता है और
अप्रतिबंधित ऐप-सर्वर टर्न के लिए उसे लाइव बाहरी एक्सेस में बदल देता है। जब नेटिव
`allowedDomains` सेट हों, तो स्वचालित मैनेज्ड फ़ॉलबैक fail closed होता है ताकि allowlist
बायपास न की जा सके। स्थायी प्रभावी खोज-नीति बदलाव अगले टर्न से पहले बाउंड Codex
थ्रेड को रोटेट करते हैं। अस्थायी प्रति-टर्न प्रतिबंध एक अस्थायी प्रतिबंधित थ्रेड का उपयोग
करते हैं और बाद में resume के लिए मौजूदा बाइंडिंग सुरक्षित रखते हैं। `sessions_yield`
और message-tool-only स्रोत उत्तर सीधे रहते हैं क्योंकि वे टर्न-कंट्रोल अनुबंध हैं।
`sessions_spawn` searchable रहता है ताकि Codex का नेटिव `spawn_agent` प्राथमिक
Codex सबएजेंट सतह बना रहे, जबकि स्पष्ट OpenClaw या ACP डेलिगेशन अब भी
`openclaw` डायनेमिक टूल नेमस्पेस के माध्यम से उपलब्ध है। Heartbeat सहयोग निर्देश
Codex को कहते हैं कि जब टूल पहले से लोड न हो, तो Heartbeat टर्न समाप्त करने से पहले
`heartbeat_respond` खोजे।

`codexDynamicToolsLoading: "direct"` केवल तब सेट करें जब आप ऐसे कस्टम Codex
ऐप-सर्वर से कनेक्ट कर रहे हों जो deferred डायनेमिक टूल खोज नहीं सकता, या जब पूरे
टूल पेलोड को डीबग कर रहे हों।

समर्थित शीर्ष-स्तरीय Codex Plugin फ़ील्ड:

| फ़ील्ड                      | डिफ़ॉल्ट        | अर्थ                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw डायनेमिक टूल को सीधे प्रारंभिक Codex टूल संदर्भ में रखने के लिए `"direct"` का उपयोग करें। |
| `codexDynamicToolsExclude` | `[]`           | Codex ऐप-सर्वर टर्न से हटाने के लिए अतिरिक्त OpenClaw डायनेमिक टूल नाम।              |
| `codexPlugins`             | अक्षम       | माइग्रेट किए गए स्रोत-इंस्टॉल्ड क्यूरेटेड plugins के लिए नेटिव Codex plugin/app समर्थन।           |

समर्थित `appServer` फ़ील्ड:

| फ़ील्ड                                        | डिफ़ॉल्ट                                             | अर्थ                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex को शुरू करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                          |
| `homeScope`                                   | `"agent"`                                              | `"agent"` प्रत्येक OpenClaw एजेंट के लिए Codex स्थिति को अलग करता है। `"user"` मूल `$CODEX_HOME` या `~/.codex` साझा करता है, मूल प्रमाणीकरण का उपयोग करता है, और केवल-स्वामी थ्रेड प्रबंधन सक्षम करता है। उपयोगकर्ता स्कोप के लिए stdio आवश्यक है।                                                                                                                                             |
| `command`                                     | प्रबंधित Codex बाइनरी                                 | stdio ट्रांसपोर्ट के लिए निष्पादन योग्य। प्रबंधित बाइनरी का उपयोग करने के लिए इसे सेट न करें; इसे केवल स्पष्ट ओवरराइड के लिए सेट करें।                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio ट्रांसपोर्ट के लिए आर्ग्युमेंट।                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | सेट नहीं                                               | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                        |
| `authToken`                                   | सेट नहीं                                               | WebSocket ट्रांसपोर्ट के लिए Bearer टोकन। शाब्दिक स्ट्रिंग या `${CODEX_APP_SERVER_TOKEN}` जैसे SecretInput को स्वीकार करता है।                                                                                                                                                                                                                                                                   |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket हेडर। हेडर मान शाब्दिक स्ट्रिंग या SecretInput मान स्वीकार करते हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                         |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना इनहेरिटेड वातावरण बनाने के बाद शुरू की गई stdio app-server प्रक्रिया से हटाए गए अतिरिक्त पर्यावरण वेरिएबल नाम। OpenClaw स्थानीय लॉन्च के लिए चुने गए `CODEX_HOME` और इनहेरिटेड `HOME` को बनाए रखता है।                                                                                                                                                                  |
| `codeModeOnly`                                | `false`                                                | Codex के केवल-code-mode टूल सतह को चुनें। OpenClaw डायनेमिक टूल Codex के साथ पंजीकृत रहते हैं ताकि नेस्टेड `tools.*` कॉल app-server `item/tool/call` ब्रिज के माध्यम से लौटें।                                                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | सेट नहीं                                               | दूरस्थ Codex app-server वर्कस्पेस रूट। सेट होने पर, OpenClaw हल किए गए OpenClaw वर्कस्पेस से स्थानीय वर्कस्पेस रूट का अनुमान लगाता है, इस दूरस्थ रूट के अंतर्गत वर्तमान cwd प्रत्यय को सुरक्षित रखता है, और केवल अंतिम app-server cwd Codex को भेजता है। यदि cwd हल किए गए OpenClaw वर्कस्पेस रूट के बाहर है, तो OpenClaw दूरस्थ app-server को gateway-local पथ भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server control-plane कॉल के लिए टाइमआउट।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा turn स्वीकार करने के बाद या turn-स्कोप वाले app-server अनुरोध के बाद शांत विंडो, जब OpenClaw `turn/completed` की प्रतीक्षा करता है।                                                                                                                                                                                                                                                 |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | टूल हैंडऑफ, मूल टूल पूर्णता, post-tool raw assistant प्रगति, raw reasoning पूर्णता, या reasoning प्रगति के बाद उपयोग किया गया completion-idle और प्रगति गार्ड, जब OpenClaw `turn/completed` की प्रतीक्षा करता है। इसका उपयोग विश्वसनीय या भारी वर्कलोड के लिए करें जहाँ post-tool synthesis अंतिम assistant release बजट से अधिक समय तक वैध रूप से शांत रह सकता है।                         |
| `mode`                                        | `"yolo"` जब तक स्थानीय Codex आवश्यकताएँ YOLO को अस्वीकार न करें | YOLO या guardian-reviewed निष्पादन के लिए प्रीसेट। `danger-full-access`, `never` अनुमोदन, या `user` reviewer को छोड़ने वाली स्थानीय stdio आवश्यकताएँ अंतर्निहित डिफ़ॉल्ट को guardian बनाती हैं।                                                                                                                                                                                                   |
| `approvalPolicy`                              | `"never"` या अनुमत guardian अनुमोदन नीति               | थ्रेड शुरू/resume/turn को भेजी गई मूल Codex अनुमोदन नीति। Guardian डिफ़ॉल्ट अनुमति होने पर `"on-request"` को प्राथमिकता देते हैं।                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` या अनुमत guardian sandbox       | थ्रेड शुरू/resume को भेजा गया मूल Codex sandbox मोड। Guardian डिफ़ॉल्ट अनुमति होने पर `"workspace-write"` को प्राथमिकता देते हैं, अन्यथा `"read-only"`। जब OpenClaw sandbox सक्रिय होता है, तो `danger-full-access` turn Codex `workspace-write` का उपयोग करते हैं, जिसमें नेटवर्क पहुँच OpenClaw sandbox egress सेटिंग से व्युत्पन्न होती है।                                                        |
| `approvalsReviewer`                           | `"user"` या अनुमत guardian reviewer                    | अनुमति होने पर Codex को मूल अनुमोदन prompts की समीक्षा करने देने के लिए `"auto_review"` का उपयोग करें, अन्यथा `guardian_subagent` या `user`। `guardian_subagent` legacy alias बना रहता है।                                                                                                                                                                                                        |
| `serviceTier`                                 | सेट नहीं                                               | वैकल्पिक Codex app-server सेवा स्तर। `"priority"` fast-mode routing सक्षम करता है, `"flex"` flex processing का अनुरोध करता है, `null` ओवरराइड साफ़ करता है, और legacy `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                  |
| `networkProxy`                                | अक्षम                                                  | app-server कमांड के लिए Codex permissions-profile networking को चुनें। OpenClaw चुने गए `permissions.<profile>.network` config को परिभाषित करता है और `sandbox` भेजने के बजाय उसे `default_permissions` के साथ चुनता है।                                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                                | Preview opt-in जो Codex app-server 0.132.0 या नए संस्करण के साथ OpenClaw sandbox-backed Codex वातावरण पंजीकृत करता है ताकि मूल Codex निष्पादन सक्रिय OpenClaw sandbox के अंदर चल सके।                                                                                                                                                                                                           |

`appServer.networkProxy` स्पष्ट है क्योंकि यह Codex sandbox
अनुबंध को बदलता है। सक्षम होने पर, OpenClaw Codex थ्रेड config में
`features.network_proxy.enabled` और `default_permissions` भी सेट करता है ताकि जनरेट की गई permission
profile Codex managed networking शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw
profile body से टकराव-प्रतिरोधी `openclaw-network-<fingerprint>` profile नाम जनरेट करता है;
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
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
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

यदि सामान्य app-server runtime `danger-full-access` होता, तो `networkProxy` सक्षम करने पर जनरेट की गई अनुमति प्रोफ़ाइल के लिए workspace-शैली filesystem access का उपयोग होता है। Codex द्वारा प्रबंधित network enforcement sandboxed networking है, इसलिए full-access प्रोफ़ाइल outbound traffic की सुरक्षा नहीं करेगी।
Domain entries `allow` या `deny` का उपयोग करती हैं; Unix socket entries Codex के `allow` या `none` मानों का उपयोग करती हैं।

OpenClaw-स्वामित्व वाली dynamic tool calls `appServer.requestTimeoutMs` से स्वतंत्र रूप से सीमित होती हैं: Codex `item/tool/call` अनुरोध डिफ़ॉल्ट रूप से 90 सेकंड के OpenClaw watchdog का उपयोग करते हैं। कोई सकारात्मक per-call `timeoutMs` argument उस विशिष्ट tool budget को बढ़ाता या घटाता है। `image_generate` tool, जब tool call अपना timeout नहीं देती, तो `agents.defaults.imageGenerationModel.timeoutMs` का उपयोग करता है, या अन्यथा 120 सेकंड का image-generation default उपयोग करता है। media-understanding `image` tool `tools.media.image.timeoutSeconds` या अपने 60 सेकंड के media default का उपयोग करता है। image understanding के लिए, वह timeout अनुरोध पर ही लागू होता है और पहले के preparation work से कम नहीं किया जाता। Dynamic tool budgets 600000 ms पर capped हैं। Timeout पर, जहाँ समर्थित हो OpenClaw tool signal को abort करता है और Codex को failed dynamic-tool response लौटाता है ताकि turn session को `processing` में छोड़े बिना जारी रह सके।
यह watchdog बाहरी dynamic `item/tool/call` budget है; provider-specific request timeouts उस call के अंदर चलते हैं और अपने timeout semantics बनाए रखते हैं।

Codex द्वारा turn स्वीकार करने के बाद, और OpenClaw द्वारा turn-scoped app-server request का उत्तर देने के बाद, harness अपेक्षा करता है कि Codex current-turn progress करे और अंततः native turn को `turn/completed` के साथ पूरा करे। यदि app-server `appServer.turnCompletionIdleTimeoutMs` तक शांत रहता है, तो OpenClaw best-effort रूप से Codex turn को interrupt करता है, diagnostic timeout रिकॉर्ड करता है, और OpenClaw session lane को release करता है ताकि follow-up chat messages किसी stale native turn के पीछे queued न रहें। उसी turn के लिए अधिकांश non-terminal notifications उस छोटे watchdog को disarm कर देती हैं क्योंकि Codex ने प्रमाणित कर दिया है कि turn अभी जीवित है। Tool handoffs लंबे post-tool idle budget का उपयोग करते हैं: OpenClaw द्वारा `item/tool/call` response लौटाने के बाद, `commandExecution` जैसे native tool items के complete होने के बाद, raw `custom_tool_call_output` completions के बाद, और post-tool raw assistant progress, raw reasoning completions, या reasoning progress के बाद। Guard configured होने पर `appServer.postToolRawAssistantCompletionIdleTimeoutMs` का उपयोग करता है और अन्यथा पाँच मिनट पर default करता है। वही post-tool budget Codex द्वारा अगला current-turn event emit करने से पहले की silent synthesis window के लिए progress watchdog को भी extend करता है। Global app-server notifications, जैसे rate-limit updates, turn-idle progress को reset नहीं करतीं। Reasoning completions, commentary `agentMessage` completions, और pre-tool raw reasoning या assistant progress के बाद automatic final reply आ सकता है, इसलिए वे session lane को तुरंत release करने के बजाय post-progress reply guard का उपयोग करते हैं। केवल final/non-commentary completed `agentMessage` items और pre-tool raw assistant completions assistant-output release को arm करते हैं: यदि Codex फिर `turn/completed` के बिना शांत हो जाता है, तो OpenClaw best-effort रूप से native turn को interrupt करता है और session lane को release करता है। यदि कोई दूसरा turn watch उस release race को जीत जाता है, तो OpenClaw completed final assistant item को तब भी स्वीकार करता है जब कोई native request, item, या dynamic tool completion active न रहे और assistant-output release अभी भी latest completed item से संबंधित हो, और कोई later item completion न हो। यह completed tool work के बाद final answer को turn replay किए बिना preserve कर सकता है। Partial assistant deltas, stale earlier replies, और empty later completions qualify नहीं करते। Replay-safe stdio app-server failures,
जिनमें assistant, tool, active-item, या side-effect evidence के बिना turn-completion idle timeouts शामिल हैं, fresh app-server attempt पर एक बार retry किए जाते हैं। Unsafe timeouts फिर भी stuck app-server client को retire करते हैं और OpenClaw session lane को release करते हैं। वे stale native thread binding को automatically replay करने के बजाय clear भी करते हैं। Completion-watch timeouts Codex-specific timeout text surface करते हैं: replay-safe मामलों में कहा जाता है कि response incomplete हो सकता है, जबकि unsafe cases user को retry करने से पहले current state verify करने को कहते हैं। Public timeout diagnostics में structural fields शामिल होते हैं जैसे last app-server notification method, raw assistant response item id/type/role, active request/item counts, और armed watch state। जब last notification raw assistant response item होता है, तो वे bounded assistant text preview भी शामिल करते हैं। वे raw prompt या tool content शामिल नहीं करते।

Local testing के लिए environment overrides उपलब्ध रहते हैं:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, जब `appServer.command` unset हो, managed binary को bypass करता है।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटा दिया गया था। इसके बजाय `plugins.entries.codex.config.appServer.mode: "guardian"` उपयोग करें, या one-off local testing के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`। Repeatable deployments के लिए config preferred है क्योंकि यह plugin behavior को बाकी Codex harness setup वाली same reviewed file में रखता है।

## Native Codex plugins

Native Codex plugin support, OpenClaw harness turn वाले same Codex thread में Codex app-server की अपनी app और plugin capabilities का उपयोग करता है। OpenClaw Codex plugins को synthetic `codex_plugin_*` OpenClaw dynamic tools में translate नहीं करता।

`codexPlugins` केवल उन sessions को प्रभावित करता है जो native Codex harness select करते हैं। इसका built-in harness runs, normal OpenAI provider runs, ACP conversation bindings, या अन्य harnesses पर कोई प्रभाव नहीं है।

Minimal migrated config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Thread app config तब compute होता है जब OpenClaw Codex harness session establish करता है या stale Codex thread binding को replace करता है। यह हर turn पर recompute नहीं होता।
`codexPlugins` बदलने के बाद, `/new`, `/reset` उपयोग करें, या gateway restart करें ताकि future Codex harness sessions updated app set के साथ start हों।

Migration eligibility, app inventory, destructive action policy, elicitations, और native plugin diagnostics के लिए, देखें
[Native Codex plugins](/hi/plugins/codex-native-plugins).

OpenAI-side app और plugin access signed-in Codex account द्वारा और, Business तथा Enterprise/Edu workspaces के लिए, workspace app controls द्वारा controlled होता है। OpenAI के account और workspace-control overview के लिए देखें
[Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Computer Use

Computer Use अपनी setup guide में covered है:
[Codex Computer Use](/hi/plugins/codex-computer-use).

संक्षिप्त रूप: OpenClaw desktop-control app को vendor नहीं करता या desktop actions स्वयं execute नहीं करता। यह Codex app-server तैयार करता है, verify करता है कि `computer-use` MCP server उपलब्ध है, और फिर Codex-mode turns के दौरान native MCP tool calls का ownership Codex को देता है।

## Runtime boundaries

Codex harness केवल low-level embedded agent executor को बदलता है।

- OpenClaw dynamic tools supported हैं। Codex OpenClaw से उन tools को execute करने को कहता है, इसलिए OpenClaw execution path में बना रहता है।
- Codex-native shell, patch, MCP, और native app tools Codex के स्वामित्व में हैं। OpenClaw supported relay के माध्यम से selected native events को observe या block कर सकता है, लेकिन यह native tool arguments को rewrite नहीं करता।
- Codex native compaction का owner है। OpenClaw channel history, search, `/new`, `/reset`, और future model या harness switching के लिए transcript mirror रखता है, लेकिन यह Codex compaction को OpenClaw या context-engine summarizer से replace नहीं करता।
- Media generation, media understanding, TTS, approvals, और messaging-tool output matching OpenClaw provider/model settings के माध्यम से जारी रहते हैं।
- `tool_result_persist` OpenClaw-owned transcript tool results पर लागू होता है, Codex-native tool result records पर नहीं।

Hook layers, supported V1 surfaces, native permission handling, queue steering, Codex feedback upload mechanics, और compaction details के लिए, देखें
[Codex harness runtime](/hi/plugins/codex-harness-runtime).

## Troubleshooting

**Codex normal `/model` provider के रूप में दिखाई नहीं देता:** new configs के लिए यह expected है। `openai/gpt-*` model select करें, `plugins.entries.codex.enabled` enable करें, और check करें कि `plugins.allow` `codex` को exclude करता है या नहीं।

**OpenClaw Codex के बजाय built-in harness का उपयोग करता है:** सुनिश्चित करें कि model ref official OpenAI provider पर `openai/gpt-*` है और Codex plugin installed तथा enabled है। यदि testing के दौरान strict proof चाहिए, तो provider या model `agentRuntime.id: "codex"` set करें। Forced Codex runtime OpenClaw पर falling back करने के बजाय fail करता है।

**OpenAI Codex runtime API-key path पर fall back करता है:** redacted gateway excerpt collect करें जो model, runtime, selected provider, और failure दिखाता हो।
प्रभावित collaborators से उनके OpenClaw host पर यह read-only command चलाने को कहें:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

उपयोगी excerpts में आमतौर पर `openai/gpt-5.5` या `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` या `harnessRuntime`,
`candidateProvider: "openai"`, और `401`, `Incorrect API key`, या
`No API key` result शामिल होता है। Corrected run को plain OpenAI API-key failure के बजाय OpenAI OAuth path दिखाना चाहिए।

**Legacy Codex model refs config बची हुई है:** `openclaw doctor --fix` चलाएँ।
Doctor legacy model refs को `openai/*` में rewrite करता है, stale session और whole-agent runtime pins हटाता है, और existing auth-profile overrides preserve करता है।

**app-server rejected है:** Codex app-server `0.125.0` या newer उपयोग करें।
Same-version prereleases या build-suffixed versions जैसे
`0.125.0-alpha.2` या `0.125.0+custom` rejected होते हैं क्योंकि OpenClaw stable `0.125.0` protocol floor test करता है।

**`/codex status` connect नहीं कर सकता:** check करें कि bundled `codex` plugin enabled है, configured allowlist होने पर `plugins.allow` उसे include करता है, और कोई भी custom `appServer.command`, `url`, `authToken`, या headers valid हैं।

**Model discovery slow है:** `plugins.entries.codex.config.discovery.timeoutMs` घटाएँ या discovery disable करें। देखें
[Codex harness reference](/hi/plugins/codex-harness-reference#model-discovery).

**WebSocket transport तुरंत fail होता है:** `appServer.url`, `authToken`, headers, और यह check करें कि remote app-server same Codex app-server protocol version बोलता है।

**नेटिव शेल या पैच टूल `Native hook relay unavailable` के साथ अवरुद्ध हैं:**
Codex थ्रेड अभी भी एक नेटिव हुक रिले id का उपयोग करने की कोशिश कर रहा है जिसे OpenClaw ने अब
पंजीकृत नहीं रखा है। यह नेटिव Codex हुक ट्रांसपोर्ट समस्या है, ACP
बैकएंड, प्रदाता, GitHub, या शेल-कमांड विफलता नहीं। प्रभावित चैट में
`/new` या `/reset` से नया सत्र शुरू करें, फिर कोई हानिरहित कमांड दोबारा आजमाएं। यदि वह
एक बार काम करता है लेकिन अगली नेटिव टूल कॉल फिर विफल हो जाती है, तो `/new` को केवल अस्थायी
वैकल्पिक उपाय मानें: Codex
app-server या OpenClaw Gateway को रीस्टार्ट करने के बाद प्रॉम्प्ट को एक नए सत्र में कॉपी करें ताकि पुराने थ्रेड हट जाएं और नेटिव हुक
पंजीकरण दोबारा बनाए जाएं।

**कोई गैर-Codex मॉडल अंतर्निर्मित harness का उपयोग करता है:** यह अपेक्षित है, जब तक
प्रदाता या मॉडल runtime नीति उसे किसी दूसरे harness पर रूट न करे। सामान्य गैर-OpenAI
प्रदाता refs `auto` मोड में अपने सामान्य प्रदाता पथ पर रहते हैं।

**Computer Use इंस्टॉल है लेकिन टूल नहीं चलते:** नए सत्र से
`/codex computer-use status` जांचें। यदि कोई टूल
`Native hook relay unavailable` रिपोर्ट करता है, तो ऊपर दी गई नेटिव हुक रिले रिकवरी का उपयोग करें। देखें
[Codex Computer Use](/hi/plugins/codex-computer-use#troubleshooting)।

## संबंधित

- [Codex harness संदर्भ](/hi/plugins/codex-harness-reference)
- [Codex harness runtime](/hi/plugins/codex-harness-runtime)
- [नेटिव Codex plugins](/hi/plugins/codex-native-plugins)
- [Codex Computer Use](/hi/plugins/codex-computer-use)
- [Agent runtimes](/hi/concepts/agent-runtimes)
- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [OpenAI प्रदाता](/hi/providers/openai)
- [OpenAI Codex सहायता](https://help.openai.com/en/collections/14937394-codex)
- [Agent harness plugins](/hi/plugins/sdk-agent-harness)
- [Plugin hooks](/hi/plugins/hooks)
- [Diagnostics निर्यात](/hi/gateway/diagnostics)
- [स्थिति](/hi/cli/status)
- [परीक्षण](/hi/help/testing-live#live-codex-app-server-harness-smoke)
