---
read_when:
    - आप एम्बेडेड एजेंट रनटाइम या हार्नेस रजिस्ट्री बदल रहे हैं
    - आप बंडल किए गए या विश्वसनीय Plugin से एजेंट हार्नेस पंजीकृत कर रहे हैं
    - आपको यह समझना होगा कि Codex प्लगइन मॉडल प्रदाताओं से कैसे संबंधित है
sidebarTitle: Agent Harness
summary: निम्न-स्तरीय एम्बेडेड एजेंट निष्पादक को प्रतिस्थापित करने वाले Plugin के लिए प्रायोगिक SDK सतह
title: एजेंट हार्नेस Plugin
x-i18n:
    generated_at: "2026-06-28T23:51:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

एक **एजेंट हार्नेस** एक तैयार OpenClaw एजेंट टर्न के लिए निम्न-स्तरीय निष्पादक है। यह मॉडल प्रदाता नहीं है, चैनल नहीं है, और टूल रजिस्ट्री नहीं है। उपयोगकर्ता-सामने मानसिक मॉडल के लिए, [एजेंट रनटाइम](/hi/concepts/agent-runtimes) देखें।

इस सतह का उपयोग केवल बंडल किए गए या विश्वसनीय नेटिव Plugin के लिए करें। अनुबंध अभी भी प्रयोगात्मक है क्योंकि पैरामीटर प्रकार जानबूझकर वर्तमान एम्बेडेड रनर को प्रतिबिंबित करते हैं।

## हार्नेस कब उपयोग करें

जब किसी मॉडल परिवार का अपना नेटिव सेशन रनटाइम हो और सामान्य OpenClaw प्रदाता ट्रांसपोर्ट गलत अमूर्तन हो, तब एजेंट हार्नेस रजिस्टर करें।

उदाहरण:

- एक नेटिव कोडिंग-एजेंट सर्वर जो थ्रेड और Compaction का स्वामी होता है
- एक स्थानीय CLI या डेमन जिसे नेटिव योजना/तर्क/टूल इवेंट स्ट्रीम करने होते हैं
- एक मॉडल रनटाइम जिसे OpenClaw सेशन ट्रांसक्रिप्ट के अलावा अपनी रिज्यूम आईडी चाहिए

सिर्फ नई LLM API जोड़ने के लिए हार्नेस रजिस्टर **न** करें। सामान्य HTTP या WebSocket मॉडल API के लिए, एक [प्रदाता Plugin](/hi/plugins/sdk-provider-plugins) बनाएं।

## core अब भी क्या स्वामित्व रखता है

हार्नेस चुने जाने से पहले, OpenClaw पहले ही इन्हें हल कर चुका होता है:

- प्रदाता और मॉडल
- रनटाइम auth स्थिति
- thinking स्तर और संदर्भ बजट
- OpenClaw ट्रांसक्रिप्ट/सेशन फ़ाइल
- workspace, sandbox, और टूल नीति
- चैनल उत्तर callback और स्ट्रीमिंग callback
- मॉडल fallback और लाइव मॉडल स्विचिंग नीति

यह विभाजन जानबूझकर है। हार्नेस एक तैयार attempt चलाता है; यह प्रदाता नहीं चुनता, चैनल डिलीवरी को नहीं बदलता, और चुपचाप मॉडल स्विच नहीं करता।

तैयार attempt में `params.runtimePlan` भी शामिल होता है, जो रनटाइम निर्णयों के लिए OpenClaw-स्वामित्व वाला नीति बंडल है जिसे OpenClaw और नेटिव हार्नेस में साझा रहना चाहिए:

- प्रदाता-जागरूक टूल स्कीमा नीति के लिए `runtimePlan.tools.normalize(...)` और
  `runtimePlan.tools.logDiagnostics(...)`
- ट्रांसक्रिप्ट सैनिटाइजेशन और टूल-कॉल रिपेयर नीति के लिए `runtimePlan.transcript.resolvePolicy(...)`
- साझा `NO_REPLY` और मीडिया डिलीवरी suppression के लिए `runtimePlan.delivery.isSilentPayload(...)`
- मॉडल fallback वर्गीकरण के लिए `runtimePlan.outcome.classifyRunResult(...)`
- हल किए गए प्रदाता/मॉडल/हार्नेस metadata के लिए `runtimePlan.observability`

हार्नेस उन निर्णयों के लिए योजना का उपयोग कर सकते हैं जिन्हें OpenClaw व्यवहार से मेल खाना चाहिए, लेकिन फिर भी इसे host-स्वामित्व वाली attempt स्थिति मानना चाहिए। इसे mutate न करें या किसी टर्न के अंदर प्रदाता/मॉडल स्विच करने के लिए इसका उपयोग न करें।

## हार्नेस रजिस्टर करें

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## चयन नीति

OpenClaw प्रदाता/मॉडल resolution के बाद हार्नेस चुनता है:

1. मॉडल-स्कोप वाली रनटाइम नीति जीतती है।
2. प्रदाता-स्कोप वाली रनटाइम नीति इसके बाद आती है।
3. `auto` रजिस्टर किए गए हार्नेस से पूछता है कि क्या वे हल किए गए प्रदाता/मॉडल का समर्थन करते हैं।
4. यदि कोई रजिस्टर किया हुआ हार्नेस मेल नहीं खाता, तो OpenClaw अपना एम्बेडेड रनटाइम उपयोग करता है।

Plugin हार्नेस विफलताएं run failures के रूप में सामने आती हैं। `auto` मोड में, एम्बेडेड fallback केवल तब उपयोग किया जाता है जब कोई रजिस्टर किया हुआ Plugin हार्नेस हल किए गए प्रदाता/मॉडल का समर्थन नहीं करता। एक बार जब Plugin हार्नेस किसी run को claim कर लेता है, OpenClaw उसी टर्न को किसी दूसरे रनटाइम से replay नहीं करता क्योंकि इससे auth/runtime semantics बदल सकते हैं या side effects duplicate हो सकते हैं।

पूरे-सेशन और पूरे-एजेंट runtime pins को चयन द्वारा अनदेखा किया जाता है। इसमें stale सेशन `agentHarnessId` मान, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, और `OPENCLAW_AGENT_RUNTIME` शामिल हैं। `/status` प्रदाता/मॉडल route से चुना गया प्रभावी रनटाइम दिखाता है।
यदि चुना गया हार्नेस अप्रत्याशित है, तो `agents/harness` debug logging सक्षम करें और gateway का structured `agent harness selected` record जांचें। इसमें चयनित हार्नेस id, चयन कारण, runtime/fallback नीति, और `auto` मोड में, प्रत्येक Plugin candidate का support result शामिल होता है।

बंडल किया गया Codex Plugin अपने हार्नेस id के रूप में `codex` रजिस्टर करता है। core इसे एक सामान्य Plugin हार्नेस id मानता है; Codex-specific aliases Plugin या operator config में होने चाहिए, साझा runtime selector में नहीं।

## प्रदाता और हार्नेस pairing

अधिकांश हार्नेस को प्रदाता भी रजिस्टर करना चाहिए। प्रदाता model refs, auth status, model metadata, और `/model` selection को बाकी OpenClaw के लिए दृश्यमान बनाता है। फिर हार्नेस `supports(...)` में उस प्रदाता को claim करता है।

बंडल किया गया Codex Plugin यह pattern अपनाता है:

- पसंदीदा उपयोगकर्ता model refs: `openai/gpt-5.5`
- compatibility refs: legacy `codex/gpt-*` refs अब भी स्वीकार किए जाते हैं, लेकिन नए configs को उन्हें सामान्य provider/model refs के रूप में उपयोग नहीं करना चाहिए
- हार्नेस id: `codex`
- auth: synthetic provider availability, क्योंकि Codex हार्नेस नेटिव Codex login/session का स्वामी है
- app-server request: OpenClaw bare model id Codex को भेजता है और हार्नेस को नेटिव app-server protocol से बात करने देता है

Codex Plugin additive है। official OpenAI प्रदाता पर plain `openai/gpt-*` एजेंट refs default रूप से Codex हार्नेस चुनते हैं। पुराने `codex/gpt-*` refs compatibility के लिए अब भी Codex प्रदाता और हार्नेस चुनते हैं।

operator setup, model prefix examples, और Codex-only configs के लिए, [Codex Harness](/hi/plugins/codex-harness) देखें।

OpenClaw को Codex app-server `0.125.0` या नया चाहिए। Codex Plugin app-server initialize handshake की जांच करता है और पुराने या unversioned servers को block करता है ताकि OpenClaw केवल उसी protocol surface के विरुद्ध चले जिसके साथ इसे test किया गया है। `0.125.0` floor में native MCP hook payload support शामिल है जो Codex `0.124.0` में आया था, जबकि OpenClaw को नए tested stable line पर pin करता है।

### टूल-result middleware

matching manifest contracts वाले बंडल किए गए Plugin और स्पष्ट रूप से सक्षम installed Plugin, जब उनका manifest `contracts.agentToolResultMiddleware` में targeted runtime ids घोषित करता है, `api.registerAgentToolResultMiddleware(...)` के माध्यम से runtime-neutral tool-result middleware attach कर सकते हैं। यह trusted seam async tool-result transforms के लिए है जिन्हें OpenClaw या Codex द्वारा मॉडल में tool output वापस feed करने से पहले चलना चाहिए।

Legacy bundled Plugin अब भी Codex app-server-only middleware के लिए `api.registerCodexAppServerExtensionFactory(...)` उपयोग कर सकते हैं, लेकिन नए result transforms को runtime-neutral API उपयोग करनी चाहिए।
embedded-runner-only `api.registerEmbeddedExtensionFactory(...)` hook हटा दिया गया है; embedded tool-result transforms को runtime-neutral middleware उपयोग करना होगा।

### Terminal outcome classification

जो नेटिव हार्नेस अपने protocol projection का स्वामित्व रखते हैं, वे completed turn में कोई visible assistant text न बनने पर `openclaw/plugin-sdk/agent-harness-runtime` से `classifyAgentHarnessTerminalOutcome(...)` उपयोग कर सकते हैं। helper `empty`, `reasoning-only`, या `planning-only` लौटाता है ताकि OpenClaw की fallback नीति तय कर सके कि किसी अलग मॉडल पर retry करना है या नहीं। `planning-only` के लिए हार्नेस का explicit `planText` field आवश्यक है; OpenClaw इसे assistant prose से infer नहीं करता। helper prompt errors, in-flight turns, और `NO_REPLY` जैसे intentional silent replies को जानबूझकर unclassified छोड़ता है।

### Agent-end side effects

नेटिव हार्नेस को attempt finalize करने के बाद `openclaw/plugin-sdk/agent-harness-runtime` से `runAgentEndSideEffects(...)` call करना होगा। यह portable `agent_end` hook और OpenClaw की research capture को interactive replies में देरी किए बिना dispatch करता है। local, non-interactive runs के लिए `awaitAgentEndSideEffects(...)` उपयोग करें जहां attempt को तब तक resolve नहीं होना चाहिए जब तक ये side effects पूरा न हो जाएं। दोनों helpers `runAgentHarnessAgentEndHook(...)` के समान `{ event, ctx }` payload स्वीकार करते हैं; उनकी failures completed attempt result को नहीं बदलतीं।

### User input और tool surfaces

जो नेटिव हार्नेस runtime-level user-input request expose करते हैं, उन्हें prompt format करने, उसे OpenClaw के blocking reply path के माध्यम से deliver करने, और choice/free-form answers को runtime के native response shape में वापस normalize करने के लिए `openclaw/plugin-sdk/agent-harness-runtime` के user-input helpers उपयोग करने चाहिए। helper channel/TUI presentation को consistent रखता है जबकि प्रत्येक हार्नेस अपना protocol parsing और pending-request lifecycle रखता है।

जिन नेटिव हार्नेस को PI-like compact tool routing चाहिए, उन्हें `openclaw/plugin-sdk/agent-harness-tool-runtime` से `createAgentHarnessToolSurfaceRuntime(...)` उपयोग करना चाहिए। यह tool-search/code-mode control selection, local-model lean defaults, runtime-compatible schema filtering, hidden catalog execution, directory hydration, और catalog cleanup का स्वामी है। हार्नेस अब भी अपने SDK-specific tool conversion और native execution callback के स्वामी रहते हैं।

### Native Codex harness mode

बंडल किया गया `codex` हार्नेस embedded OpenClaw एजेंट turns के लिए native Codex mode है। पहले बंडल किया गया `codex` Plugin सक्षम करें, और यदि आपका config restrictive allowlist उपयोग करता है तो `plugins.allow` में `codex` शामिल करें। native app-server configs को `openai/gpt-*` उपयोग करना चाहिए; OpenAI agent turns default रूप से Codex हार्नेस चुनते हैं। Legacy Codex model refs routes को `openclaw doctor --fix` से repair करना चाहिए, और legacy `codex/*` model refs native हार्नेस के लिए compatibility aliases बने रहते हैं।

जब यह mode चलता है, Codex native thread id, resume behavior, compaction, और app-server execution का स्वामी होता है। OpenClaw अब भी chat channel, visible transcript mirror, tool policy, approvals, media delivery, और session selection का स्वामी होता है। जब आपको यह साबित करना हो कि केवल Codex app-server path run claim कर सकता है, तब provider/model `agentRuntime.id: "codex"` उपयोग करें। explicit Plugin runtimes fail closed होते हैं; Codex app-server selection failures और runtime failures को किसी दूसरे runtime से retry नहीं किया जाता।

## Runtime strictness

Default रूप से, OpenClaw `auto` provider/model runtime policy उपयोग करता है: registered Plugin harnesses provider/model pair claim कर सकते हैं, और जब कोई मेल नहीं खाता तब embedded runtime turn संभालता है। official OpenAI provider पर OpenAI agent refs default रूप से Codex होते हैं।
जब missing harness selection को embedded runtime के माध्यम से route होने के बजाय fail होना चाहिए, तब explicit provider/model Plugin runtime जैसे `agentRuntime.id: "codex"` उपयोग करें। selected Plugin harness failures हमेशा hard fail होती हैं। यह explicit provider/model `agentRuntime.id: "openclaw"` को block नहीं करता।

Codex-only embedded runs के लिए:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

यदि आप एक canonical model के लिए CLI backend चाहते हैं, तो runtime को उस model entry पर रखें:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Per-agent overrides वही model-scoped shape उपयोग करते हैं:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

इस तरह के legacy whole-agent runtime examples अनदेखा किए जाते हैं:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

स्पष्ट Plugin रनटाइम के साथ, कोई सेशन जल्दी विफल हो जाता है जब अनुरोधित
हार्नेस पंजीकृत नहीं है, हल किए गए प्रदाता/मॉडल का समर्थन नहीं करता, या
टर्न साइड इफेक्ट्स बनाने से पहले विफल हो जाता है। यह Codex-केवल
डिप्लॉयमेंट और उन लाइव परीक्षणों के लिए जानबूझकर है जिन्हें साबित करना होता है कि Codex ऐप-सर्वर पथ
वास्तव में उपयोग में है।

यह सेटिंग केवल एम्बेडेड एजेंट हार्नेस को नियंत्रित करती है। यह
छवि, वीडियो, संगीत, TTS, PDF, या अन्य प्रदाता-विशिष्ट मॉडल रूटिंग को अक्षम नहीं करती।

## नेटिव सेशन और ट्रांसक्रिप्ट मिरर

कोई हार्नेस नेटिव सेशन id, थ्रेड id, या daemon-side resume token रख सकता है।
उस बाइंडिंग को स्पष्ट रूप से OpenClaw सेशन से संबद्ध रखें, और
उपयोगकर्ता-दृश्य असिस्टेंट/टूल आउटपुट को OpenClaw ट्रांसक्रिप्ट में मिरर करते रहें।

OpenClaw ट्रांसक्रिप्ट इनके लिए संगतता परत बनी रहती है:

- चैनल-दृश्य सेशन इतिहास
- ट्रांसक्रिप्ट खोज और इंडेक्सिंग
- बाद के किसी टर्न पर बिल्ट-इन OpenClaw हार्नेस पर वापस स्विच करना
- सामान्य `/new`, `/reset`, और सेशन हटाने का व्यवहार

अगर आपका हार्नेस कोई साइडकार बाइंडिंग संग्रहीत करता है, तो `reset(...)` लागू करें ताकि OpenClaw
स्वामी OpenClaw सेशन रीसेट होने पर उसे साफ कर सके।

## टूल और मीडिया परिणाम

कोर OpenClaw टूल सूची बनाता है और उसे तैयार प्रयास में पास करता है।
जब कोई हार्नेस डायनेमिक टूल कॉल निष्पादित करता है, तो चैनल मीडिया खुद भेजने के बजाय
टूल परिणाम को हार्नेस परिणाम आकार के माध्यम से वापस करें।

इससे टेक्स्ट, छवि, वीडियो, संगीत, TTS, अनुमोदन, और मैसेजिंग-टूल आउटपुट
OpenClaw-समर्थित रन के समान डिलीवरी पथ पर रहते हैं।

## मौजूदा सीमाएं

- सार्वजनिक इम्पोर्ट पथ सामान्य है, लेकिन कुछ प्रयास/परिणाम टाइप alias अभी भी
  संगतता के लिए legacy नाम रखते हैं।
- तृतीय-पक्ष हार्नेस इंस्टॉलेशन प्रयोगात्मक है। जब तक आपको नेटिव सेशन रनटाइम की आवश्यकता न हो,
  प्रदाता plugins को प्राथमिकता दें।
- हार्नेस स्विचिंग टर्न के बीच समर्थित है। नेटिव टूल, अनुमोदन, असिस्टेंट टेक्स्ट, या संदेश
  भेजना शुरू होने के बाद किसी टर्न के बीच में हार्नेस न बदलें।

## संबंधित

- [SDK अवलोकन](/hi/plugins/sdk-overview)
- [रनटाइम हेल्पर](/hi/plugins/sdk-runtime)
- [प्रदाता Plugin](/hi/plugins/sdk-provider-plugins)
- [Codex हार्नेस](/hi/plugins/codex-harness)
- [मॉडल प्रदाता](/hi/concepts/model-providers)
