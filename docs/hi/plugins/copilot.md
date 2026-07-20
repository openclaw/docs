---
read_when:
    - आप किसी एजेंट के लिए GitHub Copilot SDK हार्नेस का उपयोग करना चाहते हैं
    - आपको `copilot` रनटाइम के लिए कॉन्फ़िगरेशन उदाहरणों की आवश्यकता है
    - आप एक एजेंट को सदस्यता वाले Copilot (github / openclaw / copilot) से जोड़ रहे हैं और चाहते हैं कि वह Copilot CLI के माध्यम से चले।
summary: बाहरी GitHub Copilot SDK हार्नेस के माध्यम से OpenClaw के एम्बेडेड एजेंट टर्न चलाएँ
title: Copilot SDK हार्नेस
x-i18n:
    generated_at: "2026-07-20T07:29:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b67959c2c72bda97a81d0b45bc32ba363373064ec40c54f9709705dd15dd9fc
    source_path: plugins/copilot.md
    workflow: 16
---

बाहरी `@openclaw/copilot` Plugin, OpenClaw के अंतर्निहित हार्नेस के बजाय GitHub Copilot CLI (`@github/copilot-sdk`) के माध्यम से एम्बेड किए गए सब्सक्रिप्शन Copilot
एजेंट टर्न चलाता है। Copilot CLI सत्र निम्न-स्तरीय
एजेंट लूप का स्वामी होता है: नेटिव टूल निष्पादन, नेटिव Compaction (`infiniteSessions`), और
`copilotHome` के अंतर्गत CLI-प्रबंधित थ्रेड स्थिति। OpenClaw अब भी चैट
चैनलों, सत्र फ़ाइलों, मॉडल चयन, डायनेमिक टूल (ब्रिज किए गए), अनुमोदनों,
मीडिया डिलीवरी, दृश्यमान ट्रांसक्रिप्ट मिरर, `/btw` सहायक प्रश्नों (देखें
[सहायक प्रश्न (`/btw`)](#side-questions-btw)), और `openclaw doctor` का स्वामी बना रहता है।

व्यापक मॉडल/प्रोवाइडर/रनटाइम विभाजन के लिए,
[एजेंट रनटाइम](/hi/concepts/agent-runtimes) से शुरुआत करें।

## आवश्यकताएँ

- OpenClaw, जिसमें `@openclaw/copilot` Plugin इंस्टॉल हो।
- यदि आपका कॉन्फ़िगरेशन `plugins.allow` का उपयोग करता है, तो `copilot` (Plugin द्वारा घोषित मैनिफ़ेस्ट आईडी)
  शामिल करें। npm पैकेज नाम
  `@openclaw/copilot` के लिए अनुमत-सूची प्रविष्टि मेल नहीं खाएगी और
  `agentRuntime.id: "copilot"` सेट होने पर भी Plugin अवरुद्ध रहेगा।
- एक GitHub Copilot सब्सक्रिप्शन जो Copilot CLI चला सके, या
  हेडलेस अथवा Cron रन के लिए `gitHubToken` एनवायरनमेंट वेरिएबल / ऑथ-प्रोफ़ाइल प्रविष्टि।
- एक लिखने योग्य `copilotHome` डायरेक्टरी। OpenClaw द्वारा एजेंट डायरेक्टरी
  उपलब्ध कराने पर डिफ़ॉल्ट `<agentDir>/copilot`, अन्यथा
  `~/.openclaw/agents/<agentId>/copilot`।

`openclaw doctor`, सत्र-स्थिति स्वामित्व और भविष्य के कॉन्फ़िगरेशन माइग्रेशन के लिए
Plugin का [डॉक्टर अनुबंध](#doctor) चलाता है। यह
Copilot CLI परिवेश की जाँच नहीं करता।

## इंस्टॉल करना

Copilot रनटाइम एक बाहरी Plugin के रूप में भेजा जाता है, ताकि मुख्य `openclaw`
पैकेज में `@github/copilot-sdk` या उसका प्लेटफ़ॉर्म-विशिष्ट
`@github/copilot-<platform>-<arch>` CLI बाइनरी (दोनों मिलाकर लगभग 260 MB) शामिल न हो।
इसे केवल उन एजेंटों के लिए इंस्टॉल करें जो इस रनटाइम को चुनते हैं:

```bash
openclaw plugins install @openclaw/copilot
```

जब आप पहली बार कोई `github-copilot/*` मॉडल चुनते हैं **और** आपका कॉन्फ़िगरेशन
`agentRuntime: { id: "copilot" }` के माध्यम से उस मॉडल (या उसके प्रोवाइडर) को Copilot रनटाइम पर रूट करता है, तो सेटअप विज़ार्ड
Plugin को अपने-आप इंस्टॉल करता है; देखें
[त्वरित शुरुआत](#quickstart)। इस विकल्प को चुने बिना, OpenClaw अपने अंतर्निहित
GitHub Copilot प्रोवाइडर का उपयोग करता है और इस Plugin को कभी इंस्टॉल नहीं करता।

रनटाइम SDK को इस क्रम में रिज़ॉल्व करता है:

1. इंस्टॉल किए गए `@openclaw/copilot`
   पैकेज से `import("@github/copilot-sdk")`।
2. फ़ॉलबैक डायरेक्टरी `~/.openclaw/npm-runtime/copilot/` (लेगेसी ऑन-डिमांड
   इंस्टॉल लक्ष्य)।

SDK न मिलने पर कोड `COPILOT_SDK_MISSING` वाली एक त्रुटि और
ऊपर दिया गया पुनः इंस्टॉल करने का कमांड दिखाई देता है।

## त्वरित शुरुआत

एक मॉडल (या एक प्रोवाइडर) को हार्नेस से पिन करें:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

केवल किसी एक मॉडल को हार्नेस के माध्यम से रूट करने के लिए उस मॉडल प्रविष्टि पर
`agentRuntime.id` सेट करें, या उस प्रोवाइडर के अंतर्गत प्रत्येक मॉडल को रूट करने के लिए इसे प्रोवाइडर पर सेट करें।

`github-copilot/auto` पोर्टेबल शुरुआती बिंदु है। नामित Copilot मॉडल
खाते और संगठन की नीति पर निर्भर होते हैं; किसी मॉडल को पिन करने से पहले पुष्टि करें कि आपका प्रमाणीकृत
Copilot CLI वास्तव में उसे उपलब्ध कराता है।

## समर्थित प्रोवाइडर

हार्नेस, `extensions/github-copilot` के स्वामित्व वाले मानक `github-copilot` प्रोवाइडर के साथ-साथ,
कस्टम `models.providers` प्रविष्टियों का समर्थन करता है, जब
मॉडल में एक गैर-रिक्त `baseUrl` और निम्न में से कोई एक `api` संरचना हो:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI-संगत कम्प्लीशन)
- `openai-completions`
- `openai-responses`

नेटिव प्रोवाइडर आईडी (`openai`, `anthropic`, `google`, `ollama`) अपने
नेटिव रनटाइम के स्वामित्व में रहते हैं। इसके बजाय किसी एंडपॉइंट को
Copilot BYOK के माध्यम से रूट करने के लिए एक अलग कस्टम प्रोवाइडर आईडी का उपयोग करें।

Copilot BYOK एंडपॉइंट सार्वजनिक HTTPS URL होने चाहिए। हार्नेस
Copilot SDK को प्रत्येक प्रयास के लिए एक लूपबैक प्रॉक्सी देता है, फिर प्रोवाइडर ट्रैफ़िक को
OpenClaw के संरक्षित फ़ेच पथ के माध्यम से अग्रेषित करता है, ताकि DNS पिनिंग और SSRF नीति का
स्वामित्व OpenClaw के पास बना रहे। स्थानीय Ollama, LM
Studio या LAN मॉडल सर्वर के लिए नेटिव OpenClaw रनटाइम का उपयोग करें।

## BYOK

Copilot BYOK, SDK के सत्र-स्तरीय कस्टम प्रोवाइडर अनुबंध का उपयोग करता है। OpenClaw
रिज़ॉल्व किया गया मॉडल एंडपॉइंट, API कुंजी, बेयरर-टोकन मोड, हेडर, मॉडल
आईडी और कॉन्टेक्स्ट/आउटपुट सीमाएँ पास करता है; प्रोवाइडर ट्रांसपोर्ट लॉजिक SDK में रहता है, मुख्य
सिस्टम में नहीं।

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK सत्रों की कुंजियाँ सब्सक्रिप्शन सत्रों और अन्य
BYOK एंडपॉइंट या क्रेडेंशियल से अलग रखी जाती हैं। कुंजी, हेडर, मॉडल या एंडपॉइंट बदलने पर
असंगत स्थिति फिर से शुरू करने के बजाय एक नया Copilot SDK सत्र आरंभ होता है।

## प्रमाणीकरण

`runCopilotAttempt` के दौरान प्रत्येक एजेंट पर लागू होने वाली प्राथमिकता:

1. प्रयास इनपुट पर **स्पष्ट `useLoggedInUser: true`** — एजेंट के `copilotHome` के अंतर्गत
   Copilot CLI के लॉग-इन उपयोगकर्ता का उपयोग करता है।
2. प्रयास इनपुट पर **स्पष्ट `gitHubToken`** (`profileId` +
   `profileVersion` आवश्यक)। सीधे CLI आह्वानों और ऐसे परीक्षणों के लिए जिन्हें
   ऑथ-प्रोफ़ाइल रिज़ॉल्यूशन को बायपास करना हो।
3. **अनुबंध द्वारा रिज़ॉल्व किया गया `resolvedApiKey` + `authProfileId`** — उत्पादन का
   मुख्य पथ। मुख्य सिस्टम हार्नेस का आह्वान करने से पहले एजेंट की कॉन्फ़िगर की गई `github-copilot` ऑथ
   प्रोफ़ाइल (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) को रिज़ॉल्व करता है, इसलिए
   `github-copilot:<profile>` ऑथ प्रोफ़ाइल बिना एनवायरनमेंट वेरिएबल के हेडलेस, Cron या मल्टी-प्रोफ़ाइल सेटअप में
   शुरू से अंत तक काम करती है।
4. **एनवायरनमेंट-वेरिएबल फ़ॉलबैक**, इस क्रम में जाँचा जाता है (पहला गैर-रिक्त मान प्रभावी होता है,
   रिक्त स्ट्रिंग अनुपस्थित मानी जाती हैं; `extensions/github-copilot/auth.ts` में भेजी गई `github-copilot`
   प्रोवाइडर प्राथमिकता को प्रतिबिंबित करता है):
   1. `OPENCLAW_GITHUB_TOKEN` — हार्नेस-विशिष्ट ओवरराइड; इससे आप सिस्टम-व्यापी `gh` /
      Copilot CLI कॉन्फ़िगरेशन को प्रभावित किए बिना OpenClaw हार्नेस के लिए
      टोकन पिन कर सकते हैं।
   2. `COPILOT_GITHUB_TOKEN` — मानक Copilot SDK / CLI एनवायरनमेंट वेरिएबल।
   3. `GH_TOKEN` — मानक `gh` CLI एनवायरनमेंट वेरिएबल।
   4. `GITHUB_TOKEN` — सामान्य GitHub टोकन फ़ॉलबैक।

   संश्लेषित पूल प्रोफ़ाइल आईडी `env:<NAME>` है; प्रोफ़ाइल संस्करण टोकन का
   अपरिवर्तनीय sha256 फ़िंगरप्रिंट है, इसलिए एनवायरनमेंट मान बदलने पर
   क्लाइंट पूल साफ़ रूप से अमान्य हो जाता है।

5. टोकन का कोई संकेत उपलब्ध न होने पर **डिफ़ॉल्ट `useLoggedInUser`**।

हर एजेंट को अपना अलग `copilotHome` मिलता है, ताकि एक ही मशीन पर एजेंटों के बीच Copilot CLI टोकन, सत्र और
कॉन्फ़िगरेशन कभी लीक न हों। डिफ़ॉल्ट:
`<agentDir>/copilot` (SDK स्थिति को OpenClaw की
`models.json` / `auth-profiles.json` वाली डायरेक्टरी से अलग रखता है), या
एजेंट डायरेक्टरी न मिलने पर `~/.openclaw/agents/<agentId>/copilot`।
कस्टम स्थान के लिए प्रयास इनपुट पर `copilotHome: <path>` से ओवरराइड करें
(उदाहरण के लिए, माइग्रेशन हेतु साझा माउंट)।

लाइव हार्नेस परीक्षण सीधे टोकन के लिए `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` का उपयोग करते हैं।
साझा लाइव-परीक्षण सेटअप वास्तविक ऑथ प्रोफ़ाइल को अलग-थलग परीक्षण होम में स्टेज करने के बाद
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` और `GITHUB_TOKEN` को साफ़ करता है, इसलिए समर्पित वेरिएबल के माध्यम से
दिया गया `gh auth token` मान असंबंधित सुइट में लीक हुए बिना
गलत स्किप से बचाता है।

## कॉन्फ़िगरेशन सतह

हार्नेस, प्रत्येक प्रयास के इनपुट (`runCopilotAttempt({...})`) तथा
`extensions/copilot/src/` के भीतर एनवायरनमेंट के डिफ़ॉल्ट मानों के एक छोटे समूह से कॉन्फ़िगरेशन पढ़ता है:

| फ़ील्ड                    | उद्देश्य                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | प्रत्येक एजेंट की CLI स्थिति डायरेक्टरी (डिफ़ॉल्ट ऊपर दिए गए हैं)।                                                                                                                                                                                                                                                 |
| `model`                  | स्ट्रिंग या `{ provider, id, api?, baseUrl?, headers?, authHeader? }`। एजेंट के सामान्य मॉडल चयन का उपयोग करने के लिए इसे छोड़ दें; हार्नेस पुष्टि करता है कि रिज़ॉल्व किया गया प्रोवाइडर समर्थित है।                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`। `auto-reply/thinking.ts` में OpenClaw के `ThinkLevel` / `ReasoningLevel` रिज़ॉल्यूशन से मैप होता है।                                                                                                                                                          |
| `infiniteSessionConfig`  | `harness.compact` द्वारा संचालित SDK `infiniteSessions` ब्लॉक के लिए वैकल्पिक ओवरराइड। इसे यथावत छोड़ना सुरक्षित है।                                                                                                                                                                                        |
| `hooksConfig`            | टूल/MCP, उपयोगकर्ता-प्रॉम्प्ट, सत्र और त्रुटि कॉलबैक के लिए वैकल्पिक नेटिव Copilot SDK `SessionHooks` कॉन्फ़िगरेशन। OpenClaw के पोर्टेबल लाइफ़साइकल हुक से अलग।                                                                                                                                   |
| `permissionPolicy`       | अंतर्निहित SDK टूल प्रकारों (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`) के लिए SDK के `onPermissionRequest` हैंडलर का वैकल्पिक ओवरराइड। सुरक्षा उपाय के रूप में डिफ़ॉल्ट `rejectAllPolicy`; यह वास्तव में कभी सक्रिय क्यों नहीं होता, इसके लिए [अनुमतियाँ और ask_user](#permissions-and-ask_user) देखें। |
| `enableSessionTelemetry` | वैकल्पिक SDK सत्र टेलीमेट्री फ़्लैग।                                                                                                                                                                                                                                                            |

OpenClaw Plugin हुक को Copilot-विशिष्ट प्रयास कॉन्फ़िगरेशन की आवश्यकता नहीं है।
हार्नेस मानक हार्नेस हेल्पर के माध्यम से `before_prompt_build`, `llm_input`, `llm_output` और `agent_end` चलाता है।
सफल SDK Compaction, `before_compaction` और `after_compaction` भी चलाते हैं।
ब्रिज किए गए OpenClaw टूल `before_tool_call` चलाते हैं और `after_tool_call` रिपोर्ट करते हैं; बिना पोर्टेबल समकक्ष वाले
नेटिव केवल-SDK कॉलबैक के लिए `hooksConfig` बना रहता है।

OpenClaw में किसी अन्य हिस्से को इन फ़ील्ड के बारे में जानने की आवश्यकता नहीं है। अन्य Plugin,
चैनल और मुख्य कोड केवल मानक `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult` संरचना देखते हैं।

## Compaction

जब `harness.compact` चलता है, तो Copilot SDK हार्नेस:

1. लंबित कार्य जारी रखे बिना ट्रैक किया गया SDK सत्र फिर से शुरू करता है।
2. SDK के सत्र-स्कोप वाले इतिहास Compaction RPC को कॉल करता है।
3. वर्कस्पेस के अंतर्गत संगतता मार्कर फ़ाइलें लिखे बिना SDK Compaction परिणाम
   लौटाता है।

OpenClaw-पक्षीय ट्रांसक्रिप्ट मिरर (नीचे) Compaction के बाद के संदेश प्राप्त करता रहता है,
इसलिए उपयोगकर्ता को दिखाई देने वाला चैट इतिहास सुसंगत रहता है।

## ट्रांसक्रिप्ट मिररिंग

`runCopilotAttempt` प्रत्येक टर्न के मिरर किए जा सकने वाले संदेशों को
`extensions/copilot/src/dual-write-transcripts.ts` के माध्यम से OpenClaw ऑडिट ट्रांसक्रिप्ट में
दोहरी तरह से लिखता है। मिरर का दायरा प्रति सत्र
(`copilot:${sessionId}`) होता है और इसकी कुंजी प्रति संदेश
(`${role}:${sha256_16(role,content)}`) होती है, इसलिए दोबारा उत्सर्जित पिछली टर्न प्रविष्टियाँ
डुप्लिकेट बनने के बजाय डिस्क पर मौजूद कुंजियों से टकराती हैं।

विफलता-नियंत्रण की दो परतें मिरर को आवृत करती हैं, ताकि ट्रांसक्रिप्ट लिखने की
विफलता से प्रयास कभी विफल न हो: एक आंतरिक सर्वोत्तम-प्रयास रैपर और प्रयास
स्तर पर एक अतिरिक्त सुरक्षा `.catch(...)`। विफलताएँ लॉग की जाती हैं,
प्रदर्शित नहीं।

## सहायक प्रश्न (`/btw`)

`/btw` इस हार्नेस पर मूल रूप से उपलब्ध **नहीं** है। `createCopilotAgentHarness()`
जानबूझकर `harness.runSideQuestion` को अपरिभाषित छोड़ता है
(`extensions/copilot/harness.test.ts`, `describe("runSideQuestion")` में अभिपुष्ट),
इसलिए OpenClaw का `/btw` डिस्पैचर (`src/agents/btw.ts`) उसी
पथ पर चला जाता है जिसका उपयोग वह प्रत्येक गैर-Codex रनटाइम के लिए करता है:
कॉन्फ़िगर किए गए मॉडल प्रदाता को एक छोटे सहायक-प्रश्न प्रॉम्प्ट के साथ सीधे
कॉल किया जाता है और उत्तर `streamSimple` के माध्यम से वापस स्ट्रीम किया
जाता है (कोई CLI सत्र नहीं, कोई अतिरिक्त पूल स्लॉट नहीं)।

इससे Copilot CLI सत्र एजेंट के मुख्य टर्न लूप के लिए आरक्षित रहते हैं और
`/btw` का व्यवहार अन्य गैर-Codex रनटाइम के समान बना रहता है।

## Doctor

`extensions/copilot/doctor-contract-api.ts` को
`src/plugins/doctor-contract-registry.ts` द्वारा स्वतः लोड किया जाता है। यह निम्नलिखित प्रदान करता है:

- एक खाली `legacyConfigRules` (अभी कोई सेवानिवृत्त फ़ील्ड नहीं)।
- एक निष्क्रिय `normalizeCompatibilityConfig` (रखा गया है ताकि भविष्य में फ़ील्ड
  सेवानिवृत्तियों के लिए ट्री के भीतर एक स्थिर स्थान हो)।
- एक `sessionRouteStateOwners` प्रविष्टि: प्रदाता `github-copilot`, रनटाइम
  `copilot`, CLI सत्र कुंजी `copilot`, प्रमाणीकरण प्रोफ़ाइल उपसर्ग `github-copilot:`।

## सीमाएँ

- हार्नेस `github-copilot` के साथ स्वामित्व-रहित कस्टम BYOK प्रदाता आईडी का दावा करता है।
  मैनिफ़ेस्ट-स्वामित्व वाली मूल प्रदाता आईडी अपने स्वामी रनटाइम पर बनी रहती हैं,
  तब भी जब `agentRuntime.id` को बलपूर्वक `copilot` पर सेट किया जाता है।
- कोई TUI सतह नहीं; जिन रनटाइम में समकक्ष सतह नहीं है, उनके लिए Pi का TUI
  फ़ॉलबैक बना रहता है।
- जब कोई एजेंट `copilot` पर स्विच करता है, तो Pi सत्र स्थिति माइग्रेट नहीं होती।
  चयन प्रति प्रयास होता है; मौजूदा Pi सत्र मान्य बने रहते हैं।
- `ask_user` प्रदाता-निरपेक्ष Gateway प्रश्न रनटाइम का उपयोग करता है। Control
  UI अन्य OpenClaw प्रश्नों जैसा ही प्रश्न कार्ड दिखाता है, समर्थित
  चैनल विकल्प बटन रेंडर करते हैं, और अगला कतारबद्ध सादा-पाठ संदेश
  SDK अनुरोध के लौटने से पहले उस Gateway रिकॉर्ड को हल करता है।

## अनुमतियाँ और ask_user

ब्रिज किए गए OpenClaw टूल के लिए अनुमति प्रवर्तन SDK के
`onPermissionRequest` कॉलबैक के माध्यम से नहीं, बल्कि **टूल रैपर के भीतर**
होता है। Pi द्वारा उपयोग किया जाने वाला वही
`wrapToolWithBeforeToolCallHook`
(`src/agents/agent-tools.before-tool-call.ts`) प्रत्येक कोडिंग टूल पर
`createOpenClawCodingTools` द्वारा लागू किया जाता है: लूप पहचान, विश्वसनीय
Plugin नीतियाँ, टूल-कॉल-पूर्व हुक और Gateway के माध्यम से दो-चरणीय Plugin
स्वीकृतियाँ (`plugin.approval.request`)—सभी मूल Pi प्रयासों वाले ठीक उसी कोड
पथ से गुजरते हैं।

Copilot टूल ब्रिज द्वारा लौटाए गए प्रत्येक SDK टूल को इनके साथ चिह्नित किया जाता है:

- `overridesBuiltInTool: true` — समान नाम वाले Copilot CLI के अंतर्निहित टूल
  (edit, read, write, bash, ...) को प्रतिस्थापित करता है, ताकि प्रत्येक टूल कॉल
  वापस OpenClaw तक रूट हो।
- `skipPermission: true` — SDK को बताता है कि टूल चलाने से पहले
  `onPermissionRequest({kind: "custom-tool"})` ट्रिगर न करे।
  आवृत `execute()` पहले ही अधिक समृद्ध OpenClaw नीति जाँच करता है;
  SDK-स्तरीय प्रॉम्प्ट या तो OpenClaw के प्रवर्तन को बीच में रोक देगा
  (सभी को अनुमति) या प्रत्येक टूल कॉल को अवरुद्ध कर देगा (सभी को अस्वीकार) —
  दोनों में से कोई भी Pi समानता से मेल नहीं खाता।

ट्री के भीतर का Codex हार्नेस भी इसी विभाजन का उपयोग करता है: ब्रिज किए गए
OpenClaw टूल आवृत किए जाते हैं (`extensions/codex/src/app-server/dynamic-tools.ts`) और
codex-app-server के अपने मूल स्वीकृति प्रकार
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) `plugin.approval.request` के माध्यम से रूट होते हैं
(`extensions/codex/src/app-server/approval-bridge.ts`)। Copilot SDK का
समतुल्य—`onPermissionRequest` तक कभी पहुँचने वाले किसी भी गैर-`custom-tool`
प्रकार के लिए विफलता-पर-बंद `rejectAllPolicy`—वही सुरक्षा तंत्र है, और
व्यवहार में यह कभी ट्रिगर नहीं होता क्योंकि `overridesBuiltInTool: true` प्रत्येक
अंतर्निहित टूल को विस्थापित कर देता है।

आवृत-टूल परत को Pi के समतुल्य नीतिगत निर्णय लेने योग्य बनाने के लिए,
हार्नेस पूरा Pi प्रयास-टूल संदर्भ
`createOpenClawCodingTools` को अग्रेषित करता है: पहचान (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), चैनल/रूटिंग (`groupId`,
`currentChannelId`, `replyToMode`, संदेश-टूल टॉगल), प्रमाणीकरण
(`authProfileStore`), रन पहचान (`sandboxSessionKey`, `runId` से व्युत्पन्न
`sessionKey` / `runSessionKey`), मॉडल संदर्भ (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) और रन हुक
(`onToolOutcome`, `onYield`)। इन फ़ील्ड के बिना, केवल-स्वामी अनुमतिसूचियाँ
डिफ़ॉल्ट रूप से चुपचाप अस्वीकार कर देती हैं, Plugin-विश्वास नीतियाँ सही दायरे
का समाधान नहीं कर सकतीं और `session_status: "current"` एक पुरानी सैंडबॉक्स कुंजी में
हल होता है। ब्रिज बिल्डर `extensions/copilot/src/tool-bridge.ts` है, जो
`src/agents/embedded-agent-runner/run/attempt.ts:1262` पर Pi की प्रामाणिक कॉल को प्रतिबिंबित करता है।
`runAttempt` साझा
`resolveSandboxContext` सीम के माध्यम से सैंडबॉक्स संदर्भ हल करता है, SDK को एक
प्रभावी कार्यशील डायरेक्टरी देता है और `sandbox` के साथ सबएजेंट-स्पॉन
वर्कस्पेस को टूल ब्रिज में अग्रेषित करता है। ब्रिज उन सीमित टूल-निर्माण
नियंत्रणों को भी अग्रेषित करता है जिन्हें वह SDK सीमा पर लागू कर सकता है:
`includeCoreTools`, रनटाइम टूल अनुमतिसूची और `toolConstructionPlan`।

Pi समानता के लिए ब्रिज
`openclaw/plugin-sdk/agent-harness-tool-runtime` से साझा हार्नेस टूल-सतह सहायक का भी उपयोग करता है।
टूल-खोज सक्षम होने पर, SDK प्रत्येक OpenClaw टूल स्कीमा के बजाय संक्षिप्त
नियंत्रण टूल और एक छिपा हुआ कैटलॉग निष्पादक देखता है। कोड मोड सक्षम होने पर,
सहायक वही कोड-मोड नियंत्रण सतह और कैटलॉग जीवनचक्र बनाता है जिसका उपयोग अन्य
एजेंट हार्नेस करते हैं। स्थानीय-मॉडल के हल्के डिफ़ॉल्ट, रनटाइम-संगत स्कीमा
फ़िल्टरिंग, डायरेक्टरी हाइड्रेशन और कैटलॉग सफ़ाई—सभी साझा सहायक में बने रहते
हैं, ताकि Copilot और Codex-सन्निकट हार्नेस में अंतर न आए।

### सत्र-स्तरीय GitHub टोकन

Copilot SDK अनुबंध **क्लाइंट-स्तरीय** GitHub टोकन
(`CopilotClientOptions.gitHubToken`, स्वयं CLI प्रक्रिया को प्रमाणित करता है)
को **सत्र-स्तरीय** टोकन (`SessionConfig.gitHubToken`, उस सत्र के लिए
सामग्री बहिष्करण, मॉडल रूटिंग और कोटा निर्धारित करता है; `createSession`
और `resumeSession` दोनों पर मान्य) से अलग करता है। हार्नेस
`resolveCopilotAuth` के माध्यम से एक बार प्रमाणीकरण हल करता है और प्रमाणीकरण मोड
`gitHubToken` होने पर दोनों फ़ील्ड सेट करता है
(एक स्पष्ट `auth.gitHubToken` या कॉन्फ़िगर किए गए `github-copilot`
प्रमाणीकरण प्रोफ़ाइल से अनुबंध द्वारा हल किया गया `resolvedApiKey`)। जब हल किया
गया मोड `useLoggedInUser` होता है, तब सत्र-स्तरीय फ़ील्ड छोड़ दिया जाता है,
ताकि SDK लॉग-इन पहचान से पहचान व्युत्पन्न करता रहे।

`ask_user`, `SessionConfig.onUserInputRequest` का उपयोग करता है। ब्रिज SDK
विकल्पों या विकल्प-रहित मुक्त-पाठ प्रॉम्प्ट को Gateway प्रश्नों के रूप में
पंजीकृत करता है, निश्चित-विकल्प अनुरोधों के लिए विकल्प सूचकांक या लेबल स्वीकार
करता है और SDK अनुरोध द्वारा अनुमति मिलने पर मुक्त-रूप उत्तर स्वीकार करता है।
OpenClaw प्रयास को निरस्त करने पर Gateway रिकॉर्ड रद्द हो जाता है और एक खाली
SDK उत्तर लौटता है।

## संबंधित

- [एजेंट रनटाइम](/hi/concepts/agent-runtimes)
- [Codex हार्नेस](/hi/plugins/codex-harness)
- [एजेंट हार्नेस Plugin (SDK संदर्भ)](/hi/plugins/sdk-agent-harness)
