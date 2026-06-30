---
read_when:
    - आप समझना चाहते हैं कि OpenClaw मॉडल संदर्भ कैसे तैयार करता है
    - आप लेगेसी इंजन और Plugin इंजन के बीच स्विच कर रहे हैं
    - आप एक संदर्भ इंजन Plugin बना रहे हैं
sidebarTitle: Context engine
summary: 'संदर्भ इंजन: प्लगेबल संदर्भ असेंबली, Compaction, और उप-एजेंट जीवनचक्र'
title: संदर्भ इंजन
x-i18n:
    generated_at: "2026-06-30T14:04:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

एक **संदर्भ इंजन** यह नियंत्रित करता है कि OpenClaw प्रत्येक रन के लिए मॉडल संदर्भ कैसे बनाता है: कौन-से संदेश शामिल करने हैं, पुराने इतिहास को कैसे सारांशित करना है, और subagent सीमाओं के पार संदर्भ कैसे प्रबंधित करना है।

OpenClaw एक अंतर्निहित `legacy` इंजन के साथ आता है और डिफ़ॉल्ट रूप से उसी का उपयोग करता है - अधिकांश उपयोगकर्ताओं को इसे बदलने की आवश्यकता कभी नहीं होती। किसी Plugin इंजन को केवल तभी इंस्टॉल और चुनें जब आप अलग assembly, Compaction, या cross-session recall व्यवहार चाहते हों।

## त्वरित शुरुआत

<Steps>
  <Step title="जांचें कि कौन-सा इंजन सक्रिय है">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Plugin इंजन इंस्टॉल करें">
    संदर्भ इंजन plugins किसी भी अन्य OpenClaw plugin की तरह इंस्टॉल किए जाते हैं।

    <Tabs>
      <Tab title="npm से">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="स्थानीय पाथ से">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="इंजन सक्षम करें और चुनें">
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

    इंस्टॉल और कॉन्फ़िगर करने के बाद gateway को फिर से शुरू करें।

  </Step>
  <Step title="legacy पर वापस स्विच करें (वैकल्पिक)">
    `contextEngine` को `"legacy"` पर सेट करें (या key को पूरी तरह हटा दें - `"legacy"` डिफ़ॉल्ट है)।
  </Step>
</Steps>

## यह कैसे काम करता है

हर बार जब OpenClaw कोई मॉडल prompt चलाता है, संदर्भ इंजन चार lifecycle बिंदुओं पर भाग लेता है:

<AccordionGroup>
  <Accordion title="1. Ingest">
    तब कॉल किया जाता है जब session में नया संदेश जोड़ा जाता है। इंजन संदेश को अपने data store में store या index कर सकता है।
  </Accordion>
  <Accordion title="2. Assemble">
    प्रत्येक model run से पहले कॉल किया जाता है। इंजन संदेशों का एक क्रमबद्ध set (और एक वैकल्पिक `systemPromptAddition`) लौटाता है जो token budget में फिट होता है।
  </Accordion>
  <Accordion title="3. Compact">
    तब कॉल किया जाता है जब context window भर जाती है, या जब उपयोगकर्ता `/compact` चलाता है। इंजन space खाली करने के लिए पुराने history को summarize करता है।
  </Accordion>
  <Accordion title="4. After turn">
    run पूरा होने के बाद कॉल किया जाता है। इंजन state को persist कर सकता है, background compaction trigger कर सकता है, या indexes update कर सकता है।
  </Accordion>
</AccordionGroup>

bundled non-ACP Codex harness के लिए, OpenClaw assembled context को Codex developer instructions और current turn prompt में project करके वही lifecycle लागू करता है। Codex अब भी अपने native thread history और native compactor का स्वामी रहता है।

### Subagent lifecycle (वैकल्पिक)

OpenClaw दो वैकल्पिक subagent lifecycle hooks कॉल करता है:

<ParamField path="prepareSubagentSpawn" type="method">
  child run शुरू होने से पहले shared context state तैयार करें। hook parent/child session keys, `contextMode` (`isolated` या `fork`), उपलब्ध transcript ids/files, और वैकल्पिक TTL प्राप्त करता है। यदि यह rollback handle लौटाता है, तो preparation सफल होने के बाद spawn असफल होने पर OpenClaw उसे कॉल करता है। Native subagent spawns जो `lightContext` मांगते हैं और `contextMode="isolated"` में resolve होते हैं, जानबूझकर इस hook को skip करते हैं ताकि child, context-engine-managed pre-spawn state के बिना lightweight bootstrap context से शुरू हो।
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  subagent session पूरा होने या swept होने पर clean up करें।
</ParamField>

### System prompt addition

`assemble` method एक `systemPromptAddition` string लौटा सकता है। OpenClaw इसे run के लिए system prompt से पहले जोड़ता है। इससे engines static workspace files की आवश्यकता के बिना dynamic recall guidance, retrieval instructions, या context-aware hints inject कर सकते हैं।

## legacy इंजन

अंतर्निहित `legacy` इंजन OpenClaw के मूल व्यवहार को संरक्षित रखता है:

- **Ingest**: no-op (session manager सीधे message persistence संभालता है)।
- **Assemble**: pass-through (runtime में मौजूदा sanitize → validate → limit pipeline context assembly संभालती है)।
- **Compact**: built-in summarization compaction को delegate करता है, जो पुराने messages का एक single summary बनाता है और recent messages को intact रखता है।
- **After turn**: no-op।

legacy इंजन tools register नहीं करता या `systemPromptAddition` प्रदान नहीं करता।

जब कोई `plugins.slots.contextEngine` सेट नहीं है (या यह `"legacy"` पर सेट है), तो यह इंजन अपने-आप उपयोग किया जाता है।

## Plugin engines

एक plugin, plugin API का उपयोग करके context engine register कर सकता है:

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
values शामिल होते हैं ताकि plugins पहले lifecycle hook के चलने से पहले per-agent या per-workspace state initialize कर सकें।

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
| `info`             | Property | Engine id, name, version, और क्या यह compaction own करता है |
| `ingest(params)`   | Method   | एक single message store करें                                   |
| `assemble(params)` | Method   | model run के लिए context बनाएं (`AssembleResult` लौटाता है) |
| `compact(params)`  | Method   | context को summarize/reduce करें                                 |

`assemble` एक `AssembleResult` लौटाता है जिसमें:

<ParamField path="messages" type="Message[]" required>
  मॉडल को भेजे जाने वाले क्रमबद्ध messages।
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  assembled context में total tokens का engine estimate। OpenClaw इसे compaction threshold decisions और diagnostic reporting के लिए उपयोग करता है।
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  system prompt से पहले जोड़ा जाता है।
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  runner preemptive overflow prechecks के लिए कौन-सा token estimate उपयोग करता है, इसे नियंत्रित करता है। डिफ़ॉल्ट `"assembled"` है, जिसका अर्थ है कि जो engines compaction own नहीं करते, उनके लिए केवल assembled prompt का estimate जांचा जाता है। जो engines `ownsCompaction: true` सेट करते हैं, वे अपना prompt admission स्वयं manage करते हैं, इसलिए OpenClaw default रूप से generic pre-prompt precheck skip करता है। `"preassembly_may_overflow"` केवल तब सेट करें जब आपका assembled view underlying transcript में overflow risk छिपा सकता है; फिर runner generic precheck active रखता है और preemptively compact करना है या नहीं तय करते समय assembled estimate और pre-assembly (unwindowed) session-history estimate का maximum लेता है। किसी भी स्थिति में, आपके लौटाए गए messages ही model देखता है - `promptAuthority` केवल precheck को प्रभावित करता है।
</ParamField>

`compact` एक `CompactResult` लौटाता है। जब compaction active
transcript rotate करता है, तो `result.sessionId` और `result.sessionFile` successor
session की पहचान करते हैं जिसे अगले retry या turn में उपयोग करना होगा।

वैकल्पिक members:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | किसी session के लिए engine state initialize करें। जब engine पहली बार session देखता है, तब एक बार कॉल किया जाता है (जैसे, import history)। |
| `ingestBatch(params)`          | Method | completed turn को batch के रूप में ingest करें। run पूरा होने के बाद, उस turn के सभी messages के साथ एक बार कॉल किया जाता है।     |
| `afterTurn(params)`            | Method | Post-run lifecycle work (state persist करना, background compaction trigger करना)।                                         |
| `prepareSubagentSpawn(params)` | Method | child session शुरू होने से पहले shared state set up करें।                                                       |
| `onSubagentEnded(params)`      | Method | subagent समाप्त होने के बाद clean up करें।                                                                                 |
| `dispose()`                    | Method | resources release करें। gateway shutdown या plugin reload के दौरान कॉल किया जाता है - per-session नहीं।                           |

### Runtime settings

OpenClaw के अंदर चलने वाले lifecycle hooks को एक वैकल्पिक
`runtimeSettings` object मिलता है। यह एक versioned, read-only internal
producer/consumer API surface है: OpenClaw इसे selected context
engine के लिए produce करता है, और context engine इसे lifecycle hooks के अंदर consume करता है। इसे users को सीधे render नहीं किया जाता और यह कोई dedicated reporting surface नहीं बनाता।

- `schemaVersion`: वर्तमान में `1`
- `runtime`: OpenClaw host, runtime mode (`normal`, `fallback`, या
  `degraded`), और वैकल्पिक harness/runtime ids
- `contextEngineSelection`: selected context engine id और selection source
- `executionHost`: hook invoke करने वाली surface के लिए host id और label
- `model`: requested model, resolved model, provider, और वैकल्पिक model family
- `limits`: prompt token budget और max output tokens, जब ज्ञात हों
- `diagnostics`: closed fallback और degraded reason codes, जब ज्ञात हों

जो fields unknown हो सकती हैं उन्हें `null` के रूप में represent किया जाता है; discriminator fields जैसे runtime mode और selection source non-nullable रहते हैं। Older engines compatible रहते हैं: यदि कोई strict legacy engine `runtimeSettings` को unknown property मानकर reject करता है, तो OpenClaw engine को quarantine करने के बजाय lifecycle call को इसके बिना retry करता है।

### Host requirements

Context engines `info.hostRequirements` पर host capability requirements घोषित कर सकते हैं।
OpenClaw operation शुरू करने से पहले इन requirements की जांच करता है और selected runtime उन्हें satisfy नहीं कर सकता तो descriptive error के साथ fail closed करता है।

Agent runs के लिए, जब engine को `assemble()` के माध्यम से actual model prompt control करना हो तो `assemble-before-prompt` declare करें:

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

Native Codex और OpenClaw embedded agent runs `assemble-before-prompt` satisfy करते हैं।
Generic CLI backends ऐसा नहीं करते, इसलिए जिन engines को इसकी आवश्यकता होती है, उन्हें CLI process शुरू होने से पहले reject कर दिया जाता है।

### Failure isolation

OpenClaw चयनित Plugin इंजन को मुख्य उत्तर पथ से अलग रखता है। यदि कोई
गैर-लेगेसी इंजन अनुपस्थित है, अनुबंध सत्यापन में विफल होता है, फैक्टरी
बनाते समय त्रुटि फेंकता है, या किसी जीवनचक्र विधि से त्रुटि फेंकता है, तो
OpenClaw उस इंजन को वर्तमान Gateway प्रक्रिया के लिए क्वारंटीन कर देता है और
context-engine कार्य को अंतर्निहित `legacy` इंजन पर डाउनग्रेड कर देता है। त्रुटि
विफल ऑपरेशन के साथ लॉग की जाती है ताकि ऑपरेटर एजेंट के मौन हुए बिना Plugin
की मरम्मत, अपडेट, या उसे अक्षम कर सके।

होस्ट आवश्यकता विफलताएं अलग होती हैं: जब कोई इंजन घोषित करता है कि किसी
runtime में आवश्यक क्षमता नहीं है, तो OpenClaw रन शुरू करने से पहले fail closed
करता है। यह उन इंजनों की रक्षा करता है जो असमर्थित होस्ट में चलने पर स्थिति को
भ्रष्ट कर देंगे।

### ownsCompaction

`ownsCompaction` नियंत्रित करता है कि रन के लिए OpenClaw runtime की अंतर्निहित in-attempt auto-compaction सक्षम रहे या नहीं:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    इंजन Compaction व्यवहार का स्वामी होता है। OpenClaw उस रन के लिए OpenClaw runtime की अंतर्निहित auto-compaction और सामान्य pre-prompt overflow precheck को अक्षम करता है, और इंजन का `compact()` कार्यान्वयन `/compact`, provider overflow recovery compaction, और `afterTurn()` में वह जो भी proactive compaction करना चाहता है, उसके लिए जिम्मेदार होता है। जब इंजन `assemble()` से `promptAuthority: "preassembly_may_overflow"` लौटाता है, तब भी OpenClaw pre-prompt overflow safeguard चलाता है।
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    OpenClaw runtime की अंतर्निहित auto-compaction prompt execution के दौरान अभी भी चल सकती है, लेकिन सक्रिय इंजन की `compact()` विधि फिर भी `/compact` और overflow recovery के लिए कॉल की जाती है।
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` का अर्थ यह **नहीं** है कि OpenClaw अपने-आप legacy इंजन के Compaction पथ पर वापस चला जाता है।
</Warning>

इसका मतलब है कि दो वैध Plugin पैटर्न हैं:

<Tabs>
  <Tab title="Owning mode">
    अपना Compaction algorithm लागू करें और `ownsCompaction: true` सेट करें।
  </Tab>
  <Tab title="Delegating mode">
    `ownsCompaction: false` सेट करें और OpenClaw के अंतर्निहित Compaction व्यवहार का उपयोग करने के लिए `compact()` से `openclaw/plugin-sdk/core` के `delegateCompactionToRuntime(...)` को कॉल कराएं।
  </Tab>
</Tabs>

सक्रिय non-owning इंजन के लिए no-op `compact()` असुरक्षित है क्योंकि यह उस इंजन slot के लिए सामान्य `/compact` और overflow-recovery compaction पथ को अक्षम कर देता है।

## कॉन्फ़िगरेशन संदर्भ

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
slot रन टाइम पर exclusive होता है - किसी दिए गए रन या Compaction ऑपरेशन के लिए केवल एक पंजीकृत संदर्भ इंजन resolve किया जाता है। अन्य सक्षम `kind: "context-engine"` plugins अभी भी लोड हो सकते हैं और अपना registration code चला सकते हैं; `plugins.slots.contextEngine` केवल यह चुनता है कि OpenClaw को संदर्भ इंजन की आवश्यकता होने पर वह किस पंजीकृत engine id को resolve करे।
</Note>

<Note>
**Plugin uninstall:** जब आप वर्तमान में `plugins.slots.contextEngine` के रूप में चयनित Plugin को uninstall करते हैं, तो OpenClaw slot को वापस default (`legacy`) पर reset कर देता है। वही reset व्यवहार `plugins.slots.memory` पर लागू होता है। कोई manual config edit आवश्यक नहीं है।
</Note>

## Compaction और memory से संबंध

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction संदर्भ इंजन की एक जिम्मेदारी है। legacy इंजन OpenClaw के अंतर्निहित summarization को delegate करता है। Plugin इंजन कोई भी Compaction strategy लागू कर सकते हैं (DAG summaries, vector retrieval, आदि)।
  </Accordion>
  <Accordion title="Memory plugins">
    Memory plugins (`plugins.slots.memory`) संदर्भ इंजनों से अलग होते हैं। Memory plugins search/retrieval प्रदान करते हैं; संदर्भ इंजन नियंत्रित करते हैं कि model क्या देखता है। वे साथ काम कर सकते हैं - कोई संदर्भ इंजन assembly के दौरान memory plugin data का उपयोग कर सकता है। जिन Plugin इंजनों को सक्रिय memory prompt path चाहिए, उन्हें `openclaw/plugin-sdk/core` से `buildMemorySystemPromptAddition(...)` को प्राथमिकता देनी चाहिए, जो सक्रिय memory prompt sections को ready-to-prepend `systemPromptAddition` में बदलता है। यदि किसी इंजन को lower-level control चाहिए, तो वह फिर भी `openclaw/plugin-sdk/memory-host-core` से `buildActiveMemoryPromptSection(...)` के माध्यम से raw lines खींच सकता है।
  </Accordion>
  <Accordion title="Session pruning">
    पुराने tool results को in-memory trim करना फिर भी चलता है, चाहे कौन सा संदर्भ इंजन सक्रिय हो।
  </Accordion>
</AccordionGroup>

## सुझाव

- यह सत्यापित करने के लिए `openclaw doctor` का उपयोग करें कि आपका इंजन सही ढंग से लोड हो रहा है।
- यदि इंजन बदल रहे हैं, तो मौजूदा sessions अपने वर्तमान history के साथ जारी रहते हैं। नया इंजन भविष्य के runs के लिए नियंत्रण संभालता है।
- इंजन त्रुटियां लॉग की जाती हैं और चयनित Plugin इंजन वर्तमान Gateway प्रक्रिया के लिए क्वारंटीन किया जाता है। OpenClaw user turns के लिए `legacy` पर वापस चला जाता है ताकि replies जारी रह सकें, लेकिन आपको फिर भी टूटे हुए Plugin की मरम्मत, update, disable, या uninstall करना चाहिए।
- development के लिए, copy किए बिना local Plugin directory को link करने के लिए `openclaw plugins install -l ./my-engine` का उपयोग करें।

## संबंधित

- [Compaction](/hi/concepts/compaction) - लंबी conversations का summarization
- [संदर्भ](/hi/concepts/context) - agent turns के लिए context कैसे बनाया जाता है
- [Plugin Architecture](/hi/plugins/architecture) - context engine plugins को register करना
- [Plugin manifest](/hi/plugins/manifest) - plugin manifest fields
- [Plugins](/hi/tools/plugin) - plugin overview
