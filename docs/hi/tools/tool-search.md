---
read_when:
    - आप चाहते हैं कि OpenClaw एजेंट prompt में हर tool schema जोड़े बिना एक बड़े tool catalog का उपयोग करें
    - आप OpenClaw tools, MCP tools, और client tools को एक संक्षिप्त runtime सतह के माध्यम से उजागर करना चाहते हैं
    - आप OpenClaw रन के लिए टूल डिस्कवरी लागू कर रहे हैं या डिबग कर रहे हैं
summary: 'टूल खोज: बड़े OpenClaw टूल कैटलॉग को खोज, वर्णन, और कॉल के पीछे संक्षिप्त करें'
title: टूल खोज
x-i18n:
    generated_at: "2026-06-30T14:06:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search OpenClaw एजेंट रनटाइम की एक प्रयोगात्मक सुविधा है। यह एजेंटों को बड़े टूल कैटलॉग खोजने और कॉल करने का एक
कॉम्पैक्ट तरीका देता है। यह तब उपयोगी होता है जब रन में
कई उपलब्ध टूल हों लेकिन मॉडल को संभवतः उनमें से केवल कुछ की ही आवश्यकता हो।

यह पृष्ठ OpenClaw Tool Search का दस्तावेज़ीकरण करता है। यह Codex-native tool
search या dynamic-tools surface नहीं है। Codex-native code mode, tool search, deferred
dynamic tools, और nested tool calls स्थिर Codex harness surfaces हैं और
`tools.toolSearch` पर निर्भर नहीं हैं।

OpenClaw रन के लिए सक्षम होने पर, मॉडल को डिफ़ॉल्ट रूप से एक `tool_search_code` टूल
मिलता है। वह टूल एक अलग-थलग Node
सबप्रोसेस में `openclaw.tools` ब्रिज के साथ एक छोटा JavaScript body चलाता है:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

कैटलॉग में OpenClaw टूल, Plugin टूल, MCP टूल, और
क्लाइंट-प्रदान किए गए टूल शामिल हो सकते हैं। मॉडल हर पूर्ण स्कीमा को शुरुआत में नहीं देखता।
इसके बजाय, यह कॉम्पैक्ट descriptor खोजता है, सटीक स्कीमा की
आवश्यकता होने पर एक चुने हुए टूल का वर्णन करता है, और उस टूल को OpenClaw के माध्यम से कॉल करता है।

Codex harness रन को ये प्रयोगात्मक OpenClaw Tool Search
नियंत्रण नहीं मिलते। OpenClaw उत्पाद क्षमताओं को Codex को dynamic tools के रूप में पास करता है, और
Codex स्थिर native code mode, native tool search, deferred dynamic
tools, और nested tool calls का स्वामी है।

## एक टर्न कैसे चलता है

योजना के समय OpenClaw embedded runner रन के लिए प्रभावी कैटलॉग बनाता है:

1. एजेंट, प्रोफ़ाइल, sandbox, और session के लिए सक्रिय टूल नीति हल करें।
2. योग्य OpenClaw और Plugin टूल सूचीबद्ध करें।
3. session MCP runtime के माध्यम से योग्य MCP टूल सूचीबद्ध करें।
4. मौजूदा रन के लिए दिए गए योग्य क्लाइंट टूल जोड़ें।
5. खोज के लिए कॉम्पैक्ट descriptor इंडेक्स करें।
6. मॉडल को OpenClaw code bridge, structured fallback tools, या
   compact directory surface expose करें।

execution time पर हर वास्तविक टूल कॉल OpenClaw पर लौटती है। अलग-थलग Node
runtime में Plugin implementations, MCP client objects, या secrets नहीं होते।
`openclaw.tools.call(...)` ब्रिज पार करके Gateway में वापस जाता है, जहाँ
सामान्य policy, approval, hook, logging, और result handling अभी भी लागू होते हैं।

## मोड

`tools.toolSearch` के तीन model-facing मोड हैं:

- `code`: `tool_search_code` expose करता है, डिफ़ॉल्ट compact JavaScript bridge।
- `tools`: code प्राप्त नहीं करने वाले providers के लिए `tool_search`, `tool_describe`, और `tool_call` को plain
  structured tools के रूप में expose करता है।
- `directory`: `tool_search`, `tool_describe`, और `tool_call` के साथ-साथ
  providers के लिए उपलब्ध टूल नामों और विवरणों की एक bounded prompt directory expose करता है
  जिन्हें हर full schema के बिना टूल नाम देखने चाहिए। OpenClaw
  मौजूदा टर्न के लिए संभावित या आवश्यक tool schemas का छोटा bounded set भी सीधे expose कर सकता है।

सभी मोड समान policy-filtered catalog और सामान्य OpenClaw execution
path का उपयोग करते हैं। यदि मौजूदा runtime अलग-थलग Node code-mode child
process launch नहीं कर सकता, तो डिफ़ॉल्ट `code` mode catalog
Compaction से पहले `tools` पर fallback करता है। `directory` mode में, client-provided tools मौजूदा रन के लिए सीधे visible रहते हैं, जबकि OpenClaw tools, Plugin tools, और MCP tools को
directory catalog के पीछे compact किया जा सकता है। exact hidden
directory name पर direct call execution से पहले उसी authorized catalog से hydrate की जाती है।

सभी मोड प्रयोगात्मक हैं। छोटे OpenClaw tool
catalogs के लिए direct tool exposure को प्राथमिकता दें, और Codex harness runs के लिए Codex-native stable surfaces को प्राथमिकता दें।

कोई अलग source-selection config नहीं है। Tool Search सक्षम होने पर,
catalog में सामान्य policy filtering के बाद योग्य OpenClaw, MCP, और client tools शामिल होते हैं।

## यह क्यों मौजूद है

बड़े catalogs उपयोगी होते हैं लेकिन महंगे होते हैं। हर tool schema को मॉडल को भेजना
request को बड़ा बनाता है, planning को धीमा करता है, और आकस्मिक tool
selection बढ़ाता है।

Tool Search आकार बदलता है:

- direct tools: मॉडल first token से पहले हर selected schema देखता है
- Tool Search code mode: मॉडल एक compact code tool और छोटा API
  contract देखता है
- Tool Search tools mode: मॉडल तीन compact structured fallback
  tools देखता है
- Tool Search directory mode: मॉडल एक bounded directory के साथ
  search/describe/call controls और संभावित या आवश्यक
  schemas का छोटा bounded set देखता है
- turn के दौरान: मॉडल आवश्यकता अनुसार शेष schemas लोड कर सकता है

छोटे catalogs के लिए direct tool exposure अभी भी सही default है। Tool Search
तब सबसे अच्छा है जब एक रन कई टूल देख सकता हो, विशेषकर MCP servers या
client-provided app tools से।

## API

`openclaw.tools.search(query, options?)`

मौजूदा रन के effective catalog में खोजता है। परिणाम compact और prompt context में
वापस रखने के लिए सुरक्षित होते हैं।

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

एक search result के लिए पूरा metadata लोड करता है, जिसमें exact input schema शामिल है।

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

OpenClaw के माध्यम से चुने गए टूल को call करता है।

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

structured fallback mode उन्हीं operations को tools के रूप में expose करता है:

- `tool_search`
- `tool_describe`
- `tool_call`

Directory mode expose करता है:

- `tool_search`
- `tool_describe`
- `tool_call`

यह client-provided tools को सीधे visible भी रखता है और मौजूदा
turn के लिए संभावित या आवश्यक catalog tool schemas का छोटा
bounded set सीधे expose कर सकता है। यदि bounded directory entries छोड़ती है, तो उन्हें खोजने के लिए `tool_search` का उपयोग करें। यदि
मॉडल exact hidden directory tool name सीधे request करता है, तो OpenClaw
normal execution से पहले उसे authorized catalog से hydrate करता है।
Directory-mode client tool names को OpenClaw, Plugin, या MCP
tool names से collide नहीं करना चाहिए क्योंकि exact deferred dispatch उन्हीं names का उपयोग करता है।

## Runtime boundary

code bridge एक अल्पकालिक Node subprocess में चलता है। subprocess
Node permission mode enabled, empty environment, no filesystem or
network grants, और no child-process or worker grants के साथ शुरू होता है। OpenClaw
parent-process wall-clock timeout लागू करता है और timeout पर subprocess को kill करता है, जिसमें
async continuations के बाद भी शामिल है।

runtime केवल expose करता है:

- `console.log`, `console.warn`, और `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

final calls पर सामान्य OpenClaw behavior अभी भी लागू होता है:

- tool allow और deny policies
- per-agent और per-sandbox tool restrictions
- channel/runtime tool policy
- approval hooks
- Plugin `before_tool_call` hooks
- session identity, logs, और telemetry

## Config

डिफ़ॉल्ट code bridge के साथ OpenClaw runs के लिए Tool Search सक्षम करें:

```bash
openclaw config set tools.toolSearch true
```

समतुल्य JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

OpenClaw runs के लिए इसके बजाय structured fallback tools का उपयोग करें:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw runs के लिए इसके बजाय compact directory surface का उपयोग करें:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

code-mode timeout और search result limits tune करें:

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

इसे अक्षम करें:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt और telemetry

Tool Search direct tool exposure से तुलना करने के लिए पर्याप्त telemetry record करता है:

- harness को भेजे गए कुल serialized tool और prompt bytes
- catalog size और source breakdown
- search, describe, और call counts
- OpenClaw के माध्यम से execute किए गए final tool calls
- selected tool ids और sources

Session logs से इन प्रश्नों का उत्तर देना संभव होना चाहिए:

- मॉडल ने शुरुआत में कितने tool schemas देखे
- उसने कितने search और describe operations किए
- कौन-सा final tool call किया गया
- result OpenClaw, MCP, या client tool से आया या नहीं

## E2E validation

QA Lab Gateway scenario OpenClaw runtime के साथ दोनों paths सिद्ध करता है:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

यह large tool catalog के साथ एक temporary fake Plugin बनाता है, mock
OpenAI provider शुरू करता है, Gateway को direct mode में एक बार और Tool Search
enabled के साथ एक बार शुरू करता है, फिर provider request payloads और session logs की तुलना करता है।

regression सिद्ध करता है:

1. Direct mode fake Plugin tool को call कर सकता है।
2. Tool Search उसी fake Plugin tool को call कर सकता है।
3. Direct mode fake Plugin tool schemas को सीधे provider को expose करता है।
4. Tool Search केवल compact bridge expose करता है।
5. बड़े fake catalog के लिए Tool Search request payload छोटा होता है।
6. Session logs expected tool-call counts और bridged call telemetry दिखाते हैं।

## Failure behavior

Tool Search fail closed होना चाहिए:

- यदि कोई टूल effective policy में नहीं है, तो search उसे return नहीं करना चाहिए
- यदि selected tool unavailable हो जाता है, तो `tool_call` fail होना चाहिए
- यदि policy या approval execution को block करता है, तो call result को उसे
  bypass करने के बजाय block report करना चाहिए
- यदि code bridge isolated runtime नहीं बना सकता, तो `mode: "tools"` उपयोग करें या
  उस deployment के लिए Tool Search disable करें

## संबंधित

- [टूल और plugins](/hi/tools)
- [Multi-agent sandbox और tools](/hi/tools/multi-agent-sandbox-tools)
- [Exec tool](/hi/tools/exec)
- [ACP agents setup](/hi/tools/acp-agents-setup)
- [Building plugins](/hi/plugins/building-plugins)
