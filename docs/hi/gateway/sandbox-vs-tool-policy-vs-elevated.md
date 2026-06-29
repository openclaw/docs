---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'कोई टूल क्यों अवरुद्ध है: सैंडबॉक्स रनटाइम, टूल अनुमति/अस्वीकृति नीति, और उन्नत exec गेट'
title: Sandbox बनाम टूल नीति बनाम उच्चाधिकार प्राप्त
x-i18n:
    generated_at: "2026-06-28T23:12:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw में तीन संबंधित (लेकिन अलग) नियंत्रण हैं:

1. **सैंडबॉक्स** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) तय करता है कि **टूल कहां चलते हैं** (सैंडबॉक्स बैकएंड बनाम होस्ट)।
2. **टूल नीति** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) तय करती है कि **कौन से टूल उपलब्ध/अनुमत हैं**।
3. **एलिवेटेड** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) सैंडबॉक्स में होने पर सैंडबॉक्स के बाहर चलाने के लिए एक **केवल-exec निकास मार्ग** है (डिफ़ॉल्ट रूप से `gateway`, या जब exec लक्ष्य `node` पर कॉन्फ़िगर हो तो `node`)।

## त्वरित डीबग

यह देखने के लिए inspector का उपयोग करें कि OpenClaw _वास्तव में_ क्या कर रहा है:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

यह प्रिंट करता है:

- प्रभावी सैंडबॉक्स मोड/स्कोप/वर्कस्पेस एक्सेस
- क्या सेशन वर्तमान में सैंडबॉक्स किया गया है (मुख्य बनाम गैर-मुख्य)
- प्रभावी सैंडबॉक्स टूल allow/deny (और क्या यह एजेंट/वैश्विक/डिफ़ॉल्ट से आया)
- एलिवेटेड गेट और fix-it key paths

## सैंडबॉक्स: टूल कहां चलते हैं

सैंडबॉक्सिंग `agents.defaults.sandbox.mode` से नियंत्रित होती है:

- `"off"`: सब कुछ होस्ट पर चलता है।
- `"non-main"`: केवल गैर-मुख्य सेशन सैंडबॉक्स किए जाते हैं (समूहों/चैनलों के लिए आम "आश्चर्य")।
- `"all"`: सब कुछ सैंडबॉक्स किया जाता है।

पूर्ण मैट्रिक्स (स्कोप, वर्कस्पेस माउंट, इमेज) के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) देखें।

### Bind mounts (सुरक्षा त्वरित जांच)

- `docker.binds` सैंडबॉक्स फाइलसिस्टम को _भेदता_ है: आप जो भी माउंट करते हैं, वह कंटेनर के अंदर आपके सेट किए गए मोड (`:ro` या `:rw`) के साथ दिखाई देता है।
- यदि आप मोड छोड़ देते हैं तो डिफ़ॉल्ट read-write होता है; स्रोत/सीक्रेट के लिए `:ro` को प्राथमिकता दें।
- `scope: "shared"` प्रति-एजेंट binds को अनदेखा करता है (केवल वैश्विक binds लागू होते हैं)।
- OpenClaw bind स्रोतों को दो बार वैलिडेट करता है: पहले normalized स्रोत पथ पर, फिर deepest existing ancestor के माध्यम से resolve करने के बाद फिर से। Symlink-parent escapes blocked-path या allowed-root जांचों को bypass नहीं करते।
- गैर-मौजूद leaf paths अब भी सुरक्षित रूप से जांचे जाते हैं। यदि `/workspace/alias-out/new-file` symlinked parent के माध्यम से किसी blocked path या कॉन्फ़िगर किए गए allowed roots के बाहर resolve होता है, तो bind अस्वीकार कर दिया जाता है।
- `/var/run/docker.sock` को bind करना प्रभावी रूप से सैंडबॉक्स को होस्ट नियंत्रण दे देता है; ऐसा केवल जानबूझकर करें।
- वर्कस्पेस एक्सेस (`workspaceAccess: "ro"`/`"rw"`) bind modes से स्वतंत्र है।

## टूल नीति: कौन से टूल मौजूद/कॉल किए जा सकते हैं

दो लेयर मायने रखती हैं:

- **टूल प्रोफ़ाइल**: `tools.profile` और `agents.list[].tools.profile` (बेस allowlist)
- **प्रदाता टूल प्रोफ़ाइल**: `tools.byProvider[provider].profile` और `agents.list[].tools.byProvider[provider].profile`
- **वैश्विक/प्रति-एजेंट टूल नीति**: `tools.allow`/`tools.deny` और `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **प्रदाता टूल नीति**: `tools.byProvider[provider].allow/deny` और `agents.list[].tools.byProvider[provider].allow/deny`
- **सैंडबॉक्स टूल नीति** (केवल सैंडबॉक्स होने पर लागू): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` और `agents.list[].tools.sandbox.tools.*`

सामान्य नियम:

- `deny` हमेशा जीतता है।
- यदि `allow` खाली नहीं है, तो बाकी सब blocked माना जाता है।
- टूल नीति hard stop है: `/exec` denied `exec` टूल को override नहीं कर सकता।
- टूल नीति नाम के आधार पर टूल उपलब्धता फ़िल्टर करती है; यह `exec` के अंदर side effects का निरीक्षण नहीं करती। यदि `exec` allowed है, तो `write`, `edit`, या `apply_patch` को deny करने से shell commands read-only नहीं बनतीं।
- `/exec` केवल अधिकृत senders के लिए सेशन defaults बदलता है; यह टूल एक्सेस grant नहीं करता।
  प्रदाता टूल keys या तो `provider` (जैसे `google-antigravity`) या `provider/model` (जैसे `openai/gpt-5.4`) स्वीकार करती हैं।
- Gateway logs में `agents/tool-policy` audit entries शामिल होती हैं जब कोई टूल नीति चरण टूल हटाता है या कोई सैंडबॉक्स टूल नीति कॉल block करती है। rule label, config key, और प्रभावित टूल नाम देखने के लिए `openclaw logs` का उपयोग करें।

### टूल समूह (शॉर्टहैंड)

टूल नीतियां (वैश्विक, एजेंट, सैंडबॉक्स) `group:*` entries का समर्थन करती हैं जो कई टूल में expand होती हैं:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

उपलब्ध समूह:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` को `exec` के alias के रूप में स्वीकार किया जाता है)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  read-only एजेंटों के लिए, mutating filesystem tools के साथ-साथ `group:runtime` को भी deny करें, जब तक कि सैंडबॉक्स फाइलसिस्टम नीति या अलग होस्ट सीमा read-only constraint लागू न करे।
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: सभी built-in OpenClaw टूल (provider plugins को छोड़कर)
- `group:plugins`: सभी loaded plugin-owned टूल, जिनमें `bundle-mcp` के माध्यम से expose किए गए configured MCP servers शामिल हैं

सैंडबॉक्स किए गए MCP servers के लिए, सैंडबॉक्स टूल नीति दूसरा allow gate है। यदि `mcp.servers` configured है लेकिन सैंडबॉक्स किए गए turns में केवल built-in टूल दिखते हैं, तो `tools.sandbox.tools.alsoAllow` में `bundle-mcp`, `group:plugins`, या server-prefixed MCP tool name/glob जैसे `outlook__send_mail` या `outlook__*` जोड़ें, फिर gateway को restart/reload करें और tool list दोबारा capture करें। Server globs provider-safe MCP server prefix का उपयोग करते हैं: गैर-`[A-Za-z0-9_-]` characters `-` बन जाते हैं, जो नाम letter से शुरू नहीं होते उन्हें `mcp-` prefix मिलता है, और लंबे या duplicate prefixes truncate या suffix किए जा सकते हैं।

`openclaw doctor` वर्तमान में `mcp.servers` में OpenClaw-managed servers के लिए इस shape की जांच करता है। bundled plugin manifests या Claude `.mcp.json` से loaded MCP servers वही sandbox gate उपयोग करते हैं, लेकिन यह diagnostic अभी उन sources को enumerate नहीं करता; यदि उनके टूल sandboxed turns में गायब हो जाते हैं, तो वही allowlist entries उपयोग करें।

## एलिवेटेड: केवल-exec "होस्ट पर चलाएं"

एलिवेटेड अतिरिक्त टूल grant **नहीं** करता; यह केवल `exec` को प्रभावित करता है।

- यदि आप सैंडबॉक्स में हैं, तो `/elevated on` (या `elevated: true` के साथ `exec`) सैंडबॉक्स के बाहर चलता है (approvals फिर भी लागू हो सकते हैं)।
- सेशन के लिए exec approvals छोड़ने के लिए `/elevated full` का उपयोग करें।
- यदि आप पहले से direct चल रहे हैं, तो elevated प्रभावी रूप से no-op है (फिर भी gated)।
- एलिवेटेड **skill-scoped नहीं** है और टूल allow/deny को override **नहीं** करता।
- एलिवेटेड `host=auto` से arbitrary cross-host overrides grant नहीं करता; यह सामान्य exec target rules का पालन करता है और केवल `node` को तब preserve करता है जब configured/session target पहले से `node` हो।
- `/exec` elevated से अलग है। यह केवल authorized senders के लिए per-session exec defaults adjust करता है।

Gates:

- Enablement: `tools.elevated.enabled` (और वैकल्पिक रूप से `agents.list[].tools.elevated.enabled`)
- Sender allowlists: `tools.elevated.allowFrom.<provider>` (और वैकल्पिक रूप से `agents.list[].tools.elevated.allowFrom.<provider>`)

[एलिवेटेड मोड](/hi/tools/elevated) देखें।

## आम "सैंडबॉक्स जेल" सुधार

### "Tool X blocked by sandbox tool policy"

Fix-it keys (एक चुनें):

- सैंडबॉक्स disable करें: `agents.defaults.sandbox.mode=off` (या प्रति-एजेंट `agents.list[].sandbox.mode=off`)
- सैंडबॉक्स के अंदर टूल allow करें:
  - इसे `tools.sandbox.tools.deny` (या प्रति-एजेंट `agents.list[].tools.sandbox.tools.deny`) से हटाएं
  - या इसे `tools.sandbox.tools.allow` (या प्रति-एजेंट allow) में जोड़ें
- `agents/tool-policy` entry के लिए `openclaw logs` जांचें। यह sandbox mode और यह record करता है कि allow या deny rule ने टूल block किया।

### "I thought this was main, why is it sandboxed?"

`"non-main"` mode में, group/channel keys _main_ नहीं होतीं। main session key (जो `sandbox explain` द्वारा दिखाई जाती है) का उपयोग करें या mode को `"off"` पर switch करें।

## संबंधित

- [सैंडबॉक्सिंग](/hi/gateway/sandboxing) -- पूर्ण sandbox reference (modes, scopes, backends, images)
- [Multi-Agent Sandbox और टूल](/hi/tools/multi-agent-sandbox-tools) -- प्रति-एजेंट overrides और precedence
- [एलिवेटेड मोड](/hi/tools/elevated)
