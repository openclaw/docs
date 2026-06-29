---
read_when:
    - आप चाहते हैं कि OpenClaw एजेंट हर टूल स्कीमा को प्रॉम्प्ट में जोड़े बिना एक बड़े टूल कैटलॉग का उपयोग करें
    - आप चाहते हैं कि OpenClaw टूल, MCP टूल, और क्लाइंट टूल एक ही कॉम्पैक्ट रनटाइम सतह के माध्यम से उपलब्ध हों
    - आप OpenClaw रन के लिए टूल खोज लागू या डीबग कर रहे हैं
summary: 'टूल खोज: बड़े OpenClaw टूल कैटलॉग को खोज, वर्णन और कॉल के पीछे संक्षिप्त करें'
title: टूल खोज
x-i18n:
    generated_at: "2026-06-29T00:25:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

टूल खोज OpenClaw एजेंट रनटाइम की एक प्रयोगात्मक सुविधा है। यह एजेंटों को बड़े टूल कैटलॉग खोजने और कॉल करने का एक
कॉम्पैक्ट तरीका देता है। यह तब उपयोगी है जब रन में
कई उपलब्ध टूल हों, लेकिन मॉडल को संभवतः उनमें से केवल कुछ की ही आवश्यकता हो।

यह पेज OpenClaw टूल खोज का दस्तावेज़ीकरण करता है। यह Codex-नेटिव टूल
खोज या डायनेमिक-टूल्स सतह नहीं है। Codex-नेटिव कोड मोड, टूल खोज, deferred
डायनेमिक टूल्स, और नेस्टेड टूल कॉल स्थिर Codex harness सतहें हैं और
`tools.toolSearch` पर निर्भर नहीं करतीं।

OpenClaw रन के लिए सक्षम होने पर, मॉडल को डिफ़ॉल्ट रूप से एक `tool_search_code` टूल
मिलता है। वह टूल एक isolated Node
सबप्रोसेस में `openclaw.tools` bridge के साथ एक छोटा JavaScript body चलाता है:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

कैटलॉग में OpenClaw टूल, Plugin टूल, MCP टूल, और
क्लाइंट-प्रदत्त टूल शामिल हो सकते हैं। मॉडल हर पूर्ण schema को पहले से नहीं देखता।
इसके बजाय, यह कॉम्पैक्ट descriptors खोजता है, जब exact schema की
आवश्यकता होती है तब एक चयनित टूल का वर्णन करता है, और उस टूल को OpenClaw के माध्यम से कॉल करता है।

Codex harness रन को ये प्रयोगात्मक OpenClaw टूल खोज
कंट्रोल नहीं मिलते। OpenClaw product capabilities को Codex को dynamic tools के रूप में पास करता है, और
Codex stable native code mode, native tool search, deferred dynamic
tools, और nested tool calls का मालिक है।

## एक turn कैसे चलता है

planning time पर OpenClaw embedded runner रन के लिए effective catalog बनाता है:

1. एजेंट, profile, sandbox, और session के लिए active tool policy resolve करें।
2. eligible OpenClaw और Plugin टूल सूचीबद्ध करें।
3. session MCP runtime के माध्यम से eligible MCP टूल सूचीबद्ध करें।
4. current run के लिए दिए गए eligible client टूल जोड़ें।
5. search के लिए compact descriptors index करें।
6. OpenClaw code bridge, structured fallback tools, या
   compact directory surface को मॉडल के सामने expose करें।

execution time पर हर वास्तविक tool call OpenClaw पर लौटता है। isolated Node
runtime में Plugin implementations, MCP client objects, या secrets नहीं होते।
`openclaw.tools.call(...)` bridge पार करके वापस Gateway में जाता है, जहाँ
normal policy, approval, hook, logging, और result handling अभी भी लागू होते हैं।

## मोड

`tools.toolSearch` में तीन model-facing मोड हैं:

- `code`: `tool_search_code` expose करता है, default compact JavaScript bridge।
- `tools`: code न पाने वाले providers के लिए `tool_search`, `tool_describe`, और `tool_call` को plain
  structured tools के रूप में expose करता है।
- `directory`: `tool_search`, `tool_describe`, और `tool_call` के साथ
  उपलब्ध tool names और descriptions की bounded prompt directory expose करता है उन
  providers के लिए जिन्हें हर full schema के बिना tool names दिखने चाहिए। OpenClaw current turn के लिए
  likely या required tool schemas का एक छोटा bounded set भी सीधे expose कर सकता है।

सभी मोड वही policy-filtered catalog और सामान्य OpenClaw execution
path उपयोग करते हैं। यदि current runtime isolated Node code-mode child
process launch नहीं कर सकता, तो default `code` mode catalog
compaction से पहले `tools` पर fallback करता है। `directory` mode में, client-provided tools current run के लिए सीधे visible रहते हैं जबकि OpenClaw tools, Plugin tools, और MCP tools को
directory catalog के पीछे compact किया जा सकता है। किसी exact hidden
directory name पर direct call को execution से पहले उसी authorized catalog से hydrate किया जाता है।

सभी मोड experimental हैं। छोटे OpenClaw tool
catalogs के लिए direct tool exposure को प्राथमिकता दें, और Codex harness runs के लिए Codex-native stable surfaces को प्राथमिकता दें।

कोई अलग source-selection config नहीं है। जब टूल खोज सक्षम होता है, तो
catalog में normal policy filtering के बाद eligible OpenClaw, MCP, और client tools शामिल होते हैं।

## यह क्यों मौजूद है

बड़े catalogs उपयोगी लेकिन महंगे होते हैं। हर tool schema को मॉडल को भेजने से
request बड़ा हो जाता है, planning धीमी होती है, और accidental tool
selection बढ़ती है।

टूल खोज shape बदलता है:

- direct tools: मॉडल first token से पहले हर selected schema देखता है
- टूल खोज code mode: मॉडल एक compact code tool और एक छोटा API
  contract देखता है
- टूल खोज tools mode: मॉडल तीन compact structured fallback
  tools देखता है
- टूल खोज directory mode: मॉडल bounded directory plus
  search/describe/call controls और likely या required
  schemas का एक छोटा bounded set देखता है
- turn के दौरान: मॉडल remaining schemas को आवश्यकता अनुसार load कर सकता है

छोटे catalogs के लिए direct tool exposure अभी भी सही default है। टूल खोज
तब सबसे अच्छा है जब एक run कई tools देख सकता हो, खासकर MCP servers या
client-provided app tools से।

## API

`openclaw.tools.search(query, options?)`

current run के लिए effective catalog खोजता है। Results compact और safe हैं
prompt context में वापस रखने के लिए।

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

एक search result के लिए full metadata load करता है, जिसमें exact input schema शामिल है।

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

OpenClaw के माध्यम से selected tool कॉल करता है।

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

structured fallback mode वही operations tools के रूप में expose करता है:

- `tool_search`
- `tool_describe`
- `tool_call`

Directory mode expose करता है:

- `tool_search`
- `tool_describe`
- `tool_call`

यह client-provided tools को सीधे visible भी रखता है और current
turn के लिए likely या required catalog tool schemas का एक छोटा
bounded set सीधे expose कर सकता है। यदि bounded directory entries omit करती है, तो उन्हें खोजने के लिए `tool_search` उपयोग करें। यदि
मॉडल किसी exact hidden directory tool name को सीधे request करता है, तो OpenClaw
normal execution से पहले उसे authorized catalog से hydrate करता है।
Directory-mode client tool names को OpenClaw, Plugin, या MCP
tool names से collide नहीं करना चाहिए क्योंकि exact deferred dispatch उन्हीं names का उपयोग करता है।

## Runtime boundary

code bridge एक short-lived Node subprocess में चलता है। subprocess
Node permission mode enabled, empty environment, filesystem या
network grants के बिना, और child-process या worker grants के बिना start होता है। OpenClaw
parent-process wall-clock timeout enforce करता है और timeout पर subprocess को kill करता है, जिसमें
async continuations के बाद भी शामिल है।

runtime केवल expose करता है:

- `console.log`, `console.warn`, और `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

final calls पर normal OpenClaw behavior अभी भी लागू होता है:

- tool allow और deny policies
- per-agent और per-sandbox tool restrictions
- channel/runtime tool policy
- approval hooks
- Plugin `before_tool_call` hooks
- session identity, logs, और telemetry

## Config

default code bridge के साथ OpenClaw runs के लिए टूल खोज सक्षम करें:

```bash
openclaw config set tools.toolSearch true
```

Equivalent JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

OpenClaw runs के लिए इसके बजाय structured fallback tools उपयोग करें:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw runs के लिए इसके बजाय compact directory surface उपयोग करें:

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

इसे disable करें:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt और telemetry

टूल खोज direct tool exposure से तुलना करने के लिए पर्याप्त telemetry record करता है:

- harness को भेजे गए total serialized tool और prompt bytes
- catalog size और source breakdown
- search, describe, और call counts
- OpenClaw के माध्यम से executed final tool calls
- selected tool ids और sources

Session logs से इनका उत्तर देना संभव होना चाहिए:

- मॉडल ने शुरुआत में कितने tool schemas देखे
- उसने कितने search और describe operations perform किए
- कौन सा final tool call किया गया
- result OpenClaw, MCP, या client tool से आया या नहीं

## E2E validation

gateway E2E runner OpenClaw runtime के साथ दोनों paths prove करता है:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

यह एक large tool catalog के साथ temporary fake Plugin बनाता है, mock
OpenAI provider start करता है, Gateway को direct mode में एक बार और Tool Search
enabled के साथ एक बार start करता है, फिर provider request payloads और session logs की तुलना करता है।

regression prove करता है:

1. Direct mode fake Plugin tool को call कर सकता है।
2. टूल खोज उसी fake Plugin tool को call कर सकता है।
3. Direct mode fake Plugin tool schemas को provider के सामने directly expose करता है।
4. टूल खोज केवल compact bridge expose करता है।
5. large fake catalog के लिए Tool Search request payload छोटा है।
6. Session logs expected tool-call counts और bridged call telemetry दिखाते हैं।

## Failure behavior

टूल खोज को fail closed होना चाहिए:

- यदि कोई tool effective policy में नहीं है, तो search को उसे return नहीं करना चाहिए
- यदि selected tool unavailable हो जाता है, तो `tool_call` fail होना चाहिए
- यदि policy या approval execution block करता है, तो call result को उसे
  bypass करने के बजाय उस block को report करना चाहिए
- यदि code bridge isolated runtime create नहीं कर सकता, तो `mode: "tools"` उपयोग करें या
  उस deployment के लिए टूल खोज disable करें

## Related

- [टूल और Plugins](/hi/tools)
- [Multi-agent sandbox और tools](/hi/tools/multi-agent-sandbox-tools)
- [Exec tool](/hi/tools/exec)
- [ACP agents setup](/hi/tools/acp-agents-setup)
- [Plugins बनाना](/hi/plugins/building-plugins)
