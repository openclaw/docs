---
read_when:
    - आप समझना चाहते हैं कि OpenClaw मॉडल संदर्भ कैसे संयोजित करता है
    - आप लेगेसी इंजन और Plugin इंजन के बीच स्विच कर रहे हैं
    - आप एक संदर्भ इंजन Plugin बना रहे हैं
sidebarTitle: Context engine
summary: 'संदर्भ इंजन: प्लग करने योग्य संदर्भ संयोजन, Compaction, और उप-एजेंट जीवनचक्र'
title: संदर्भ इंजन
x-i18n:
    generated_at: "2026-06-28T22:57:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

एक **संदर्भ इंजन** नियंत्रित करता है कि OpenClaw हर रन के लिए मॉडल संदर्भ कैसे बनाता है: कौन से संदेश शामिल करने हैं, पुराने इतिहास को कैसे सारांशित करना है, और subagent सीमाओं के पार संदर्भ कैसे प्रबंधित करना है।

OpenClaw एक बिल्ट-इन `legacy` इंजन के साथ आता है और डिफ़ॉल्ट रूप से उसी का उपयोग करता है - अधिकांश उपयोगकर्ताओं को इसे बदलने की कभी आवश्यकता नहीं होती। Plugin इंजन केवल तब इंस्टॉल और चुनें जब आपको अलग assembly, Compaction, या cross-session recall व्यवहार चाहिए।

## त्वरित शुरुआत

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    संदर्भ इंजन Plugins किसी अन्य OpenClaw Plugin की तरह इंस्टॉल किए जाते हैं।

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    इंस्टॉल और कॉन्फ़िगर करने के बाद Gateway को रीस्टार्ट करें।

  </Step>
  <Step title="Switch back to legacy (optional)">
    `contextEngine` को `"legacy"` पर सेट करें (या key को पूरी तरह हटा दें - `"legacy"` डिफ़ॉल्ट है)।
  </Step>
</Steps>

## यह कैसे काम करता है

हर बार जब OpenClaw कोई मॉडल prompt चलाता है, संदर्भ इंजन चार lifecycle बिंदुओं पर भाग लेता है:

<AccordionGroup>
  <Accordion title="1. Ingest">
    session में नया संदेश जोड़े जाने पर कॉल किया जाता है। इंजन संदेश को अपने data store में store या index कर सकता है।
  </Accordion>
  <Accordion title="2. Assemble">
    हर मॉडल रन से पहले कॉल किया जाता है। इंजन संदेशों का एक क्रमबद्ध सेट (और वैकल्पिक `systemPromptAddition`) लौटाता है, जो token budget में फिट होता है।
  </Accordion>
  <Accordion title="3. Compact">
    जब context window भर जाती है, या जब उपयोगकर्ता `/compact` चलाता है, तब कॉल किया जाता है। इंजन जगह खाली करने के लिए पुराने इतिहास का सारांश बनाता है।
  </Accordion>
  <Accordion title="4. After turn">
    रन पूरा होने के बाद कॉल किया जाता है। इंजन state persist कर सकता है, background Compaction trigger कर सकता है, या indexes अपडेट कर सकता है।
  </Accordion>
</AccordionGroup>

bundled non-ACP Codex harness के लिए, OpenClaw assembled context को Codex developer instructions और current turn prompt में project करके वही lifecycle लागू करता है। Codex अब भी अपने native thread history और native compactor का मालिक रहता है।

### Subagent lifecycle (वैकल्पिक)

OpenClaw दो वैकल्पिक subagent lifecycle hooks कॉल करता है:

<ParamField path="prepareSubagentSpawn" type="method">
  child run शुरू होने से पहले shared context state तैयार करें। hook को parent/child session keys, `contextMode` (`isolated` या `fork`), उपलब्ध transcript ids/files, और वैकल्पिक TTL मिलते हैं। यदि यह rollback handle लौटाता है, तो preparation सफल होने के बाद spawn विफल होने पर OpenClaw उसे कॉल करता है। वे native subagent spawns जो `lightContext` मांगते हैं और `contextMode="isolated"` में resolve होते हैं, जानबूझकर इस hook को छोड़ देते हैं ताकि child संदर्भ-इंजन-प्रबंधित pre-spawn state के बिना हल्के bootstrap context से शुरू हो।
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  subagent session पूरा होने या sweep होने पर cleanup करें।
</ParamField>

### System prompt addition

`assemble` method एक `systemPromptAddition` string लौटा सकता है। OpenClaw इसे रन के system prompt से पहले जोड़ता है। इससे engines static workspace files की आवश्यकता के बिना dynamic recall guidance, retrieval instructions, या context-aware hints inject कर सकते हैं।

## legacy इंजन

बिल्ट-इन `legacy` इंजन OpenClaw के मूल व्यवहार को सुरक्षित रखता है:

- **Ingest**: no-op (session manager सीधे message persistence संभालता है)।
- **Assemble**: pass-through (runtime में मौजूद sanitize → validate → limit pipeline context assembly संभालती है)।
- **Compact**: बिल्ट-इन summarization Compaction को delegate करता है, जो पुराने संदेशों का एक single summary बनाता है और हालिया संदेशों को intact रखता है।
- **After turn**: no-op।

legacy इंजन tools register नहीं करता और `systemPromptAddition` प्रदान नहीं करता।

जब कोई `plugins.slots.contextEngine` सेट नहीं है (या वह `"legacy"` पर सेट है), तो यह इंजन अपने आप उपयोग होता है।

## Plugin engines

Plugin, plugin API का उपयोग करके context engine register कर सकता है:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

factory `ctx` में वैकल्पिक `config`, `agentDir`, और `workspaceDir`
values शामिल होते हैं ताकि Plugins पहले lifecycle hook के चलने से पहले per-agent या per-workspace state initialize कर सकें।

फिर इसे config में enable करें:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### ContextEngine interface

आवश्यक members:

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | इंजन id, name, version, और क्या यह Compaction का मालिक है |
| `ingest(params)`   | Method   | एक single message store करें                                   |
| `assemble(params)` | Method   | model run के लिए context बनाएं (`AssembleResult` लौटाता है) |
| `compact(params)`  | Method   | context को summarize/reduce करें                                 |

`assemble` एक `AssembleResult` लौटाता है जिसमें:

<ParamField path="messages" type="Message[]" required>
  मॉडल को भेजने के लिए क्रमबद्ध messages।
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  assembled context में total tokens का इंजन का estimate। OpenClaw इसे Compaction threshold decisions और diagnostic reporting के लिए उपयोग करता है।
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  system prompt से पहले जोड़ा गया।
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  नियंत्रित करता है कि runner preemptive overflow
  prechecks के लिए कौन सा token estimate उपयोग करता है। डिफ़ॉल्ट `"assembled"` है, जिसका अर्थ है कि केवल assembled
  prompt का estimate जांचा जाता है - यह उन engines के लिए उपयुक्त है जो
  windowed, self-contained context लौटाते हैं। `"preassembly_may_overflow"` केवल तब सेट करें
  जब आपका assembled view underlying
  transcript में overflow risk छिपा सकता हो; तब runner assembled estimate
  और pre-assembly (unwindowed) session-history estimate में से अधिकतम लेता है, जब यह तय करता है
  कि preemptively compact करना है या नहीं। किसी भी स्थिति में, आपके लौटाए messages
  ही मॉडल देखता है - `promptAuthority` केवल precheck को प्रभावित करता है।
</ParamField>

`compact` एक `CompactResult` लौटाता है। जब Compaction active
transcript को rotate करता है, `result.sessionId` और `result.sessionFile` successor
session की पहचान करते हैं जिसका अगला retry या turn उपयोग करेगा।

वैकल्पिक members:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | session के लिए engine state initialize करें। जब engine पहली बार session देखता है, तब एक बार कॉल होता है (जैसे, history import)। |
| `ingestBatch(params)`          | Method | पूरा turn batch के रूप में ingest करें। run पूरा होने के बाद, उस turn के सभी messages के साथ एक बार कॉल होता है।     |
| `afterTurn(params)`            | Method | Post-run lifecycle work (persist state, trigger background Compaction)।                                         |
| `prepareSubagentSpawn(params)` | Method | child session शुरू होने से पहले shared state set up करें।                                                       |
| `onSubagentEnded(params)`      | Method | subagent समाप्त होने के बाद cleanup करें।                                                                                 |
| `dispose()`                    | Method | resources release करें। Gateway shutdown या Plugin reload के दौरान कॉल होता है - per-session नहीं।                           |

### Runtime settings

OpenClaw के अंदर चलने वाले lifecycle hooks को वैकल्पिक
`runtimeSettings` object मिलता है। यह versioned, read-only internal
producer/consumer API surface है: OpenClaw इसे selected context
engine के लिए produce करता है, और context engine इसे lifecycle hooks के अंदर consume करता है। इसे
सीधे users को render नहीं किया जाता और यह dedicated reporting surface नहीं बनाता।

- `schemaVersion`: वर्तमान में `1`
- `runtime`: OpenClaw host, runtime mode (`normal`, `fallback`, या
  `degraded`), और वैकल्पिक harness/runtime ids
- `contextEngineSelection`: selected context engine id और selection source
- `executionHost`: hook invoke करने वाली surface के लिए host id और label
- `model`: requested model, resolved model, provider, और वैकल्पिक model family
- `limits`: ज्ञात होने पर prompt token budget और max output tokens
- `diagnostics`: ज्ञात होने पर closed fallback और degraded reason codes

जो fields unknown हो सकते हैं उन्हें `null` के रूप में दर्शाया जाता है; runtime mode और selection source जैसे discriminator fields non-nullable रहते हैं। पुराने engines compatible रहते हैं: यदि कोई strict legacy engine `runtimeSettings` को unknown property के रूप में reject करता है, तो OpenClaw engine को quarantine करने के बजाय lifecycle call को उसके बिना retry करता है।

### Host requirements

Context engines `info.hostRequirements` पर host capability requirements घोषित कर सकते हैं।
OpenClaw operation शुरू करने से पहले इन requirements की जांच करता है और selected runtime उन्हें पूरा न कर सके तो descriptive error के साथ fail closed करता है।

agent runs के लिए, जब engine को `assemble()` के माध्यम से actual model prompt control करना हो, तब `assemble-before-prompt` घोषित करें:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Native Codex और OpenClaw embedded agent runs `assemble-before-prompt` पूरा करते हैं।
Generic CLI backends नहीं करते, इसलिए जिन engines को इसकी आवश्यकता होती है उन्हें
CLI process शुरू होने से पहले reject कर दिया जाता है।

### Failure isolation

OpenClaw selected Plugin engine को core reply path से isolate करता है। यदि कोई
non-legacy engine missing हो, contract validation में fail हो, factory
creation के दौरान throw करे, या lifecycle method से throw करे, तो OpenClaw उस engine को
current Gateway process के लिए quarantine करता है और context-engine work को
बिल्ट-इन `legacy` engine पर downgrade कर देता है। error failed operation के साथ log होता है ताकि
operator agent को silent किए बिना Plugin को repair, update, या disable कर सके।

Host आवश्यकता विफलताएँ अलग होती हैं: जब कोई engine घोषित करता है कि किसी runtime में आवश्यक capability नहीं है, तो OpenClaw run शुरू करने से पहले fail closed करता है। यह उन engines की रक्षा करता है जो unsupported host में चलने पर state को corrupt कर देंगे।

### ownsCompaction

`ownsCompaction` नियंत्रित करता है कि OpenClaw runtime का built-in in-attempt auto-compaction run के लिए enabled रहता है या नहीं:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    engine compaction behavior का मालिक होता है। OpenClaw उस run के लिए OpenClaw runtime का built-in auto-compaction disabled करता है, और engine का `compact()` implementation `/compact`, overflow recovery compaction, और `afterTurn()` में की जाने वाली किसी भी proactive compaction के लिए जिम्मेदार होता है। OpenClaw फिर भी pre-prompt overflow safeguard चला सकता है; जब यह अनुमान लगाता है कि पूरा transcript overflow होगा, तो recovery path दूसरा prompt submit करने से पहले active engine का `compact()` call करता है।
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw runtime का built-in auto-compaction prompt execution के दौरान फिर भी चल सकता है, लेकिन active engine का `compact()` method फिर भी `/compact` और overflow recovery के लिए call किया जाता है।
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` का अर्थ यह **नहीं** है कि OpenClaw अपने-आप legacy engine के compaction path पर fall back करता है।
</Warning>

इसका मतलब है कि दो valid plugin patterns हैं:

<Tabs>
  <Tab title="Owning mode">
    अपना compaction algorithm implement करें और `ownsCompaction: true` set करें।
  </Tab>
  <Tab title="Delegating mode">
    `ownsCompaction: false` set करें और OpenClaw के built-in compaction behavior का उपयोग करने के लिए `compact()` से `openclaw/plugin-sdk/core` में `delegateCompactionToRuntime(...)` call करवाएँ।
  </Tab>
</Tabs>

एक no-op `compact()` किसी active non-owning engine के लिए unsafe है क्योंकि यह उस engine slot के लिए सामान्य `/compact` और overflow-recovery compaction path को disabled कर देता है।

## Configuration reference

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
slot run time पर exclusive होता है - किसी दिए गए run या compaction operation के लिए केवल एक registered context engine resolve किया जाता है। अन्य enabled `kind: "context-engine"` plugins फिर भी load हो सकते हैं और अपना registration code चला सकते हैं; `plugins.slots.contextEngine` केवल यह select करता है कि जब OpenClaw को context engine चाहिए हो, तो वह किस registered engine id को resolve करे।
</Note>

<Note>
**Plugin uninstall:** जब आप उस plugin को uninstall करते हैं जो वर्तमान में `plugins.slots.contextEngine` के रूप में selected है, तो OpenClaw slot को default (`legacy`) पर reset कर देता है। यही reset behavior `plugins.slots.memory` पर लागू होता है। Manual config edit की आवश्यकता नहीं है।
</Note>

## Compaction और memory से संबंध

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction context engine की एक responsibility है। legacy engine OpenClaw के built-in summarization को delegate करता है। Plugin engines कोई भी compaction strategy implement कर सकते हैं (DAG summaries, vector retrieval, आदि)।
  </Accordion>
  <Accordion title="Memory plugins">
    Memory plugins (`plugins.slots.memory`) context engines से अलग होते हैं। Memory plugins search/retrieval प्रदान करते हैं; context engines नियंत्रित करते हैं कि model क्या देखता है। वे साथ काम कर सकते हैं - कोई context engine assembly के दौरान memory plugin data का उपयोग कर सकता है। जो Plugin engines active memory prompt path चाहते हैं, उन्हें `openclaw/plugin-sdk/core` से `buildMemorySystemPromptAddition(...)` को prefer करना चाहिए, जो active memory prompt sections को ready-to-prepend `systemPromptAddition` में convert करता है। यदि किसी engine को lower-level control चाहिए, तो वह फिर भी `openclaw/plugin-sdk/memory-host-core` से `buildActiveMemoryPromptSection(...)` के माध्यम से raw lines pull कर सकता है।
  </Accordion>
  <Accordion title="Session pruning">
    पुराने tool results को in-memory trim करना फिर भी चलता है, चाहे कोई भी context engine active हो।
  </Accordion>
</AccordionGroup>

## Tips

- आपका engine सही ढंग से load हो रहा है, यह verify करने के लिए `openclaw doctor` का उपयोग करें।
- यदि engines switch कर रहे हैं, तो existing sessions अपनी current history के साथ जारी रहते हैं। नया engine future runs के लिए take over करता है।
- Engine errors log किए जाते हैं और selected plugin engine current Gateway process के लिए quarantined कर दिया जाता है। OpenClaw user turns के लिए `legacy` पर fall back करता है ताकि replies जारी रह सकें, लेकिन आपको broken plugin को फिर भी repair, update, disable, या uninstall करना चाहिए।
- Development के लिए, local plugin directory को copy किए बिना link करने हेतु `openclaw plugins install -l ./my-engine` का उपयोग करें।

## Related

- [Compaction](/hi/concepts/compaction) - लंबी conversations को summarize करना
- [Context](/hi/concepts/context) - agent turns के लिए context कैसे बनाया जाता है
- [Plugin Architecture](/hi/plugins/architecture) - context engine plugins register करना
- [Plugin manifest](/hi/plugins/manifest) - plugin manifest fields
- [Plugins](/hi/tools/plugin) - plugin overview
