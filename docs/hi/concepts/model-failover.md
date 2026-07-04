---
read_when:
    - प्रमाणीकरण प्रोफ़ाइल रोटेशन, कूलडाउन, या मॉडल फ़ॉलबैक व्यवहार का निदान
    - प्रमाणीकरण प्रोफ़ाइलों या मॉडलों के लिए फ़ेलओवर नियम अपडेट करना
    - यह समझना कि सत्र मॉडल ओवरराइड फ़ॉलबैक पुनः प्रयासों के साथ कैसे इंटरैक्ट करते हैं
sidebarTitle: Model failover
summary: OpenClaw प्रमाणीकरण प्रोफ़ाइल कैसे रोटेट करता है और मॉडलों में फ़ॉलबैक करता है
title: मॉडल फेलओवर
x-i18n:
    generated_at: "2026-07-04T15:18:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw विफलताओं को दो चरणों में संभालता है:

1. मौजूदा प्रदाता के भीतर **प्रमाणीकरण प्रोफ़ाइल रोटेशन**।
2. `agents.defaults.model.fallbacks` में अगले मॉडल पर **मॉडल फ़ॉलबैक**।

यह दस्तावेज़ रनटाइम नियमों और उन्हें आधार देने वाले डेटा की व्याख्या करता है।

## रनटाइम प्रवाह

सामान्य टेक्स्ट रन के लिए, OpenClaw उम्मीदवारों का मूल्यांकन इस क्रम में करता है:

<Steps>
  <Step title="सत्र स्थिति हल करें">
    सक्रिय सत्र मॉडल और प्रमाणीकरण-प्रोफ़ाइल वरीयता हल करें।
  </Step>
  <Step title="उम्मीदवार श्रृंखला बनाएं">
    मौजूदा मॉडल चयन और उस चयन स्रोत की फ़ॉलबैक नीति से मॉडल उम्मीदवार श्रृंखला बनाएं। कॉन्फ़िगर किए गए डिफ़ॉल्ट, cron job प्राथमिक मॉडल, और स्वतः-चयनित फ़ॉलबैक मॉडल कॉन्फ़िगर किए गए फ़ॉलबैक उपयोग कर सकते हैं; स्पष्ट उपयोगकर्ता सत्र चयन सख्त होते हैं।
  </Step>
  <Step title="मौजूदा प्रदाता आज़माएं">
    प्रमाणीकरण-प्रोफ़ाइल रोटेशन/कूलडाउन नियमों के साथ मौजूदा प्रदाता आज़माएं।
  </Step>
  <Step title="फ़ेलओवर-योग्य त्रुटियों पर आगे बढ़ें">
    यदि वह प्रदाता फ़ेलओवर-योग्य त्रुटि के साथ समाप्त हो जाता है, तो अगले मॉडल उम्मीदवार पर जाएं।
  </Step>
  <Step title="फ़ॉलबैक ओवरराइड कायम रखें">
    पुनः प्रयास शुरू होने से पहले चयनित फ़ॉलबैक ओवरराइड कायम रखें, ताकि दूसरे सत्र रीडर वही प्रदाता/मॉडल देखें जिसे रनर उपयोग करने वाला है। कायम रखा गया मॉडल ओवरराइड `modelOverrideSource: "auto"` के रूप में चिह्नित होता है।
  </Step>
  <Step title="विफलता पर संकीर्ण रूप से वापस रोल करें">
    यदि फ़ॉलबैक उम्मीदवार विफल होता है, तो केवल फ़ॉलबैक-स्वामित्व वाले सत्र ओवरराइड फ़ील्ड वापस रोल करें, जब वे अभी भी उस विफल उम्मीदवार से मेल खाते हों।
  </Step>
  <Step title="समाप्त होने पर FallbackSummaryError फेंकें">
    यदि हर उम्मीदवार विफल होता है, तो प्रत्येक प्रयास के विवरण और ज्ञात होने पर सबसे जल्दी कूलडाउन समाप्ति के साथ `FallbackSummaryError` फेंकें।
  </Step>
</Steps>

यह जानबूझकर "पूरा सत्र सहेजें और बहाल करें" से अधिक संकीर्ण है। reply runner केवल उन मॉडल-चयन फ़ील्ड को कायम रखता है जिनका वह फ़ॉलबैक के लिए स्वामी है:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

यह विफल फ़ॉलबैक पुनः प्रयास को नए, असंबंधित सत्र बदलावों को अधिलेखित करने से रोकता है, जैसे मैनुअल `/model` बदलाव या सत्र रोटेशन अपडेट जो प्रयास चलने के दौरान हुए थे।

## चयन स्रोत नीति

OpenClaw चयनित प्रदाता/मॉडल को उससे अलग रखता है कि उसे क्यों चुना गया था। वही स्रोत नियंत्रित करता है कि फ़ॉलबैक श्रृंखला की अनुमति है या नहीं:

- **कॉन्फ़िगर किया गया डिफ़ॉल्ट**: `agents.defaults.model.primary` `agents.defaults.model.fallbacks` का उपयोग करता है।
- **एजेंट प्राथमिक**: `agents.list[].model` सख्त है, जब तक उस एजेंट मॉडल ऑब्जेक्ट में अपने `fallbacks` शामिल न हों। सख्त व्यवहार को स्पष्ट करने के लिए `fallbacks: []` उपयोग करें, या उस एजेंट को मॉडल फ़ॉलबैक में शामिल करने के लिए गैर-रिक्त सूची दें।
- **स्वतः फ़ॉलबैक ओवरराइड**: रनटाइम फ़ॉलबैक पुनः प्रयास करने से पहले `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, और चयनित मूल मॉडल लिखता है। वह ऑटो ओवरराइड हर संदेश पर प्राथमिक को जांचे बिना कॉन्फ़िगर की गई फ़ॉलबैक श्रृंखला पर आगे बढ़ता रह सकता है, लेकिन OpenClaw समय-समय पर कॉन्फ़िगर किए गए मूल को फिर से जांचता है और उसके ठीक होने पर ऑटो ओवरराइड साफ़ कर देता है। `/new`, `/reset`, और `sessions.reset` भी ऑटो-स्रोत ओवरराइड साफ़ करते हैं। स्पष्ट `heartbeat.model` के बिना Heartbeat रन सीधे ऑटो ओवरराइड साफ़ करते हैं जब उनका मूल मौजूदा कॉन्फ़िगर किए गए डिफ़ॉल्ट से अब मेल नहीं खाता।
- **उपयोगकर्ता सत्र ओवरराइड**: `/model`, मॉडल पिकर, `session_status(model=...)`, और `sessions.patch` `modelOverrideSource: "user"` लिखते हैं। यह एक सटीक सत्र चयन है। यदि चयनित प्रदाता/मॉडल उत्तर बनाने से पहले विफल होता है, तो OpenClaw किसी असंबंधित कॉन्फ़िगर किए गए फ़ॉलबैक से उत्तर देने के बजाय विफलता रिपोर्ट करता है।
- **लेगेसी सत्र ओवरराइड**: पुराने सत्र एंट्री में `modelOverrideSource` के बिना `modelOverride` हो सकता है। OpenClaw इन्हें उपयोगकर्ता ओवरराइड मानता है, ताकि कोई स्पष्ट पुराना चयन चुपचाप फ़ॉलबैक व्यवहार में परिवर्तित न हो।
- **Cron पेलोड मॉडल**: cron job `payload.model` / `--model` एक job primary है, उपयोगकर्ता सत्र ओवरराइड नहीं। यह कॉन्फ़िगर किए गए फ़ॉलबैक उपयोग करता है, जब तक job `payload.fallbacks` न दे; `payload.fallbacks: []` cron रन को सख्त बनाता है।

ऑटो फ़ॉलबैक प्राथमिक-जांच अंतराल पांच मिनट है और कॉन्फ़िगर करने योग्य नहीं है। OpenClaw प्रति सत्र और प्राथमिक मॉडल हाल की जांचों को याद रखता है, ताकि विफल प्राथमिक को हर turn पर दोबारा न आज़माया जाए। जब कोई सत्र फ़ॉलबैक पर जाता है तो OpenClaw एक दृश्यमान सूचना भेजता है, और चयनित प्राथमिक पर लौटने पर दूसरी सूचना भेजता है; यह हर sticky fallback turn पर सूचना दोहराता नहीं है।

## प्रमाणीकरण विफलता स्किप कैश

डिफ़ॉल्ट रूप से, हर नया turn मौजूदा फ़ॉलबैक पुनः प्रयास व्यवहार बनाए रखता है: OpenClaw
हर कॉन्फ़िगर किए गए फ़ॉलबैक उम्मीदवार को फिर से आज़माएगा, जिसमें वे गैर-प्राथमिक
उम्मीदवार भी शामिल हैं जो हाल ही में `auth` या `auth_permanent` के साथ विफल हुए थे।

जो ऑपरेटर इन दोहराई गई प्रमाणीकरण विफलताओं को दबाना पसंद करते हैं, वे इसके साथ opt in कर सकते हैं:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

सक्षम होने पर, OpenClaw किसी प्रमाणीकरण-वर्ग विफलता के बाद गैर-प्राथमिक फ़ॉलबैक उम्मीदवार के लिए
इन-मेमोरी, सत्र-स्कोप वाला स्किप मार्कर रिकॉर्ड करता है। मार्कर session id,
प्रदाता, और मॉडल से keyed होता है। प्राथमिक उम्मीदवार कभी स्किप नहीं होते, इसलिए
स्पष्ट उपयोगकर्ता मॉडल चयन फिर भी वास्तविक प्रमाणीकरण त्रुटि दिखाता है। कैश
प्रक्रिया-स्थानीय है और Gateway restart पर साफ़ हो जाता है।

मान मिलीसेकंड में TTL है। `0` या unset मान कैश को अक्षम करता है।
धनात्मक मान 1 सेकंड और 10 मिनट के बीच सीमित किए जाते हैं।

## उपयोगकर्ता-दृश्य फ़ॉलबैक सूचनाएं

जब कोई सत्र स्वतः-चयनित फ़ॉलबैक पर जाता है, OpenClaw उसी reply surface में स्थिति सूचना भेजता है:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

जब बाद की जांच सफल होती है और सत्र चयनित प्राथमिक पर लौटता है, OpenClaw भेजता है:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

ये सूचनाएं संचालनात्मक संदेश हैं, assistant content नहीं। संभव होने पर इन्हें हर स्थिति बदलाव पर एक बार डिलीवर किया जाता है, जिसमें side-effect-only turns भी शामिल हैं, लेकिन sticky fallback turns इन्हें दोहराते नहीं हैं। डिलीवरी सामान्य source-reply suppression को बायपास करती है, सूचना threaded channels के लिए पहले assistant reply slot का उपभोग नहीं करती, और इसे text-to-speech तथा commitment extraction से बाहर रखा जाता है।

## प्रमाणीकरण स्टोरेज (कुंजियां + OAuth)

OpenClaw API keys और OAuth tokens दोनों के लिए **प्रमाणीकरण प्रोफ़ाइल** उपयोग करता है।

- Secrets और रनटाइम auth-routing स्थिति `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` में रहती है।
- Config `auth.profiles` / `auth.order` केवल **metadata + routing** हैं (कोई secrets नहीं)।
- लेगेसी import-only OAuth फ़ाइल: `~/.openclaw/credentials/oauth.json` (पहले उपयोग पर per-agent auth store में आयात की जाती है)।
- लेगेसी `auth-profiles.json`, `auth-state.json`, और per-agent `auth.json` फ़ाइलें `openclaw doctor --fix` द्वारा आयात की जाती हैं।

अधिक विवरण: [OAuth](/hi/concepts/oauth)

क्रेडेंशियल प्रकार:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (कुछ प्रदाताओं के लिए + `projectId`/`enterpriseUrl`)

## प्रोफ़ाइल ID

OAuth लॉगिन अलग-अलग प्रोफ़ाइल बनाते हैं ताकि कई खाते साथ-साथ रह सकें।

- डिफ़ॉल्ट: जब कोई ईमेल उपलब्ध न हो तो `provider:default`।
- ईमेल के साथ OAuth: `provider:<email>` (उदाहरण के लिए `google-antigravity:user@gmail.com`)।

प्रोफ़ाइल प्रति-एजेंट `openclaw-agent.sqlite` auth प्रोफ़ाइल स्टोर में रहती हैं।

## रोटेशन क्रम

जब किसी प्रदाता के पास कई प्रोफ़ाइल हों, तो OpenClaw इस तरह का क्रम चुनता है:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (यदि सेट हो)।
  </Step>
  <Step title="Configured profiles">
    प्रदाता के अनुसार फ़िल्टर की गई `auth.profiles`।
  </Step>
  <Step title="Stored profiles">
    प्रदाता के लिए प्रति-एजेंट SQLite auth प्रोफ़ाइल प्रविष्टियाँ।
  </Step>
</Steps>

यदि कोई स्पष्ट क्रम कॉन्फ़िगर नहीं है, तो OpenClaw राउंड-रॉबिन क्रम का उपयोग करता है:

- **प्राथमिक कुंजी:** प्रोफ़ाइल प्रकार (**API keys से पहले OAuth**)।
- **द्वितीयक कुंजी:** `usageStats.lastUsed` (प्रत्येक प्रकार के भीतर सबसे पुराना पहले)।
- **Cooldown/disabled profiles** को अंत में ले जाया जाता है, निकटतम समाप्ति के अनुसार क्रमबद्ध।

### सेशन स्टिकिनेस (कैश-अनुकूल)

प्रदाता कैश को गर्म रखने के लिए OpenClaw **चुनी गई auth प्रोफ़ाइल को प्रति सेशन पिन करता है**। यह हर अनुरोध पर रोटेट **नहीं** करता। पिन की गई प्रोफ़ाइल तब तक पुनः उपयोग होती है जब तक:

- सेशन रीसेट हो (`/new` / `/reset`)
- कोई Compaction पूरी हो जाए (Compaction गणना बढ़ती है)
- प्रोफ़ाइल cooldown/disabled में हो

`/model …@<profileId>` के जरिए मैन्युअल चयन उस सेशन के लिए **उपयोगकर्ता ओवरराइड** सेट करता है और नया सेशन शुरू होने तक अपने आप रोटेट नहीं होता।

<Note>
ऑटो-पिन की गई प्रोफ़ाइल (सेशन राउटर द्वारा चुनी गई) को **प्राथमिकता** माना जाता है: उन्हें पहले आज़माया जाता है, लेकिन rate limit/timeout पर OpenClaw दूसरी प्रोफ़ाइल पर रोटेट कर सकता है। जब मूल प्रोफ़ाइल फिर उपलब्ध हो जाती है, तो नए रन चुने गए मॉडल या रनटाइम को बदले बिना उसे फिर प्राथमिकता दे सकते हैं। उपयोगकर्ता-पिन की गई प्रोफ़ाइल उसी प्रोफ़ाइल पर लॉक रहती हैं; यदि वह विफल होती है और मॉडल fallback कॉन्फ़िगर हैं, तो OpenClaw प्रोफ़ाइल बदलने के बजाय अगले मॉडल पर चला जाता है।
</Note>

### OpenAI Codex सब्सक्रिप्शन और API-key बैकअप

OpenAI एजेंट मॉडल के लिए, auth और रनटाइम अलग-अलग हैं। `openai/gpt-*`
Codex harness पर रहता है, जबकि auth Codex सब्सक्रिप्शन प्रोफ़ाइल और
OpenAI API-key बैकअप के बीच रोटेट कर सकता है।

उपयोगकर्ता-सामने आने वाले क्रम के लिए `auth.order.openai` का उपयोग करें:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ChatGPT/Codex OAuth प्रोफ़ाइल और OpenAI API-key प्रोफ़ाइल, दोनों के लिए
`openai:*` का उपयोग करें। जब सब्सक्रिप्शन Codex उपयोग सीमा तक पहुँचता है,
तो Codex द्वारा उपलब्ध कराए जाने पर OpenClaw सटीक रीसेट समय रिकॉर्ड करता है,
अगली क्रमबद्ध auth प्रोफ़ाइल आज़माता है, और रन को Codex harness के भीतर
रखता है। रीसेट समय बीत जाने के बाद, सब्सक्रिप्शन प्रोफ़ाइल फिर पात्र हो जाती
है और अगला स्वचालित चयन उस पर लौट सकता है।

उपयोगकर्ता-पिन की गई प्रोफ़ाइल का उपयोग केवल तब करें जब आप उस सेशन के लिए
एक खाते/key को बाध्य करना चाहते हों। उपयोगकर्ता-पिन की गई प्रोफ़ाइल जानबूझकर
सख्त होती हैं और चुपचाप दूसरी प्रोफ़ाइल पर नहीं जातीं।

## Cooldowns

जब कोई प्रोफ़ाइल auth/rate-limit त्रुटियों (या rate limiting जैसी दिखने वाली timeout) के कारण विफल होती है, तो OpenClaw उसे cooldown में चिह्नित करता है और अगली प्रोफ़ाइल पर चला जाता है।

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    वह rate-limit bucket साधारण `429` से व्यापक है: इसमें प्रदाता संदेश जैसे `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, और आवधिक उपयोग-विंडो सीमाएँ जैसे `weekly/monthly limit reached` भी शामिल हैं।

    फ़ॉर्मैट/invalid-request त्रुटियाँ आम तौर पर अंतिम होती हैं क्योंकि उसी payload को फिर आज़माने पर वही विफलता होगी, इसलिए OpenClaw auth प्रोफ़ाइल रोटेट करने के बजाय उन्हें सामने लाता है। ज्ञात retry-repair पथ स्पष्ट रूप से opt in कर सकते हैं: उदाहरण के लिए Cloud Code Assist tool call ID validation विफलताओं को sanitize किया जाता है और `allowFormatRetry` नीति के जरिए एक बार फिर आज़माया जाता है। OpenAI-संगत stop-reason त्रुटियाँ जैसे `Unhandled stop reason: error`, `stop reason: error`, और `reason: error` timeout/failover संकेतों के रूप में वर्गीकृत की जाती हैं।

    सामान्य सर्वर टेक्स्ट भी उस timeout bucket में जा सकता है जब स्रोत किसी ज्ञात transient पैटर्न से मेल खाता है। उदाहरण के लिए, bare model runtime stream-wrapper संदेश `An unknown error occurred` को हर प्रदाता के लिए failover योग्य माना जाता है क्योंकि साझा model runtime इसे तब emit करता है जब प्रदाता streams विशिष्ट विवरणों के बिना `stopReason: "aborted"` या `stopReason: "error"` के साथ समाप्त होती हैं। transient सर्वर टेक्स्ट जैसे `internal server error`, `unknown error, 520`, `upstream error`, या `backend error` वाले JSON `api_error` payload भी failover योग्य timeout माने जाते हैं।

    OpenRouter-विशिष्ट सामान्य upstream टेक्स्ट जैसे bare `Provider returned error` को timeout केवल तब माना जाता है जब प्रदाता संदर्भ वास्तव में OpenRouter हो। सामान्य internal fallback टेक्स्ट जैसे `LLM request failed with an unknown error.` सतर्क रहता है और अपने आप failover ट्रिगर नहीं करता।

  </Accordion>
  <Accordion title="SDK retry-after सीमाएं">
    कुछ प्रदाता SDK अन्यथा OpenClaw को नियंत्रण लौटाने से पहले लंबे `Retry-After` अंतराल तक प्रतीक्षा कर सकते हैं। Anthropic और OpenAI जैसे Stainless-आधारित SDK के लिए, OpenClaw डिफ़ॉल्ट रूप से SDK-आंतरिक `retry-after-ms` / `retry-after` प्रतीक्षाओं को 60 सेकंड तक सीमित करता है और लंबी retryable प्रतिक्रियाओं को तुरंत सामने लाता है ताकि यह फेलओवर पथ चल सके। सीमा को `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` से समायोजित या अक्षम करें; [Retry behavior](/hi/concepts/retry) देखें।
  </Accordion>
  <Accordion title="मॉडल-स्कोप्ड कूलडाउन">
    दर-सीमा कूलडाउन मॉडल-स्कोप्ड भी हो सकते हैं:

    - विफल मॉडल id ज्ञात होने पर OpenClaw दर-सीमा विफलताओं के लिए `cooldownModel` रिकॉर्ड करता है।
    - उसी प्रदाता पर sibling मॉडल तब भी आज़माया जा सकता है जब कूलडाउन किसी अलग मॉडल तक स्कोप्ड हो।
    - बिलिंग/अक्षम विंडो अब भी सभी मॉडलों में पूरी प्रोफ़ाइल को ब्लॉक करती हैं।

  </Accordion>
</AccordionGroup>

कूलडाउन exponential backoff का उपयोग करते हैं:

- 1 मिनट
- 5 मिनट
- 25 मिनट
- 1 घंटा (सीमा)

स्थिति प्रति-एजेंट SQLite प्रमाणीकरण स्थिति में `usageStats` के अंतर्गत संग्रहीत होती है:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## बिलिंग अक्षम

बिलिंग/क्रेडिट विफलताओं (उदाहरण के लिए "insufficient credits" / "credit balance too low") को फेलओवर-योग्य माना जाता है, लेकिन वे आमतौर पर अस्थायी नहीं होतीं। छोटे कूलडाउन के बजाय, OpenClaw प्रोफ़ाइल को **अक्षम** के रूप में चिह्नित करता है (लंबे backoff के साथ) और अगली प्रोफ़ाइल/प्रदाता पर घूमता है।

<Note>
हर बिलिंग-जैसी प्रतिक्रिया `402` नहीं होती, और हर HTTP `402` यहां नहीं आता। OpenClaw स्पष्ट बिलिंग टेक्स्ट को बिलिंग lane में रखता है, भले ही प्रदाता इसके बजाय `401` या `403` लौटाए, लेकिन प्रदाता-विशिष्ट matchers उसी प्रदाता तक स्कोप्ड रहते हैं जो उनका स्वामी है (उदाहरण के लिए OpenRouter `403 Key limit exceeded`)।

इस बीच अस्थायी `402` उपयोग-विंडो और संगठन/workspace खर्च-सीमा त्रुटियों को `rate_limit` के रूप में वर्गीकृत किया जाता है जब संदेश retryable लगता है (उदाहरण के लिए `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, या `organization spending limit exceeded`)। ये लंबे बिलिंग-अक्षम पथ के बजाय छोटे कूलडाउन/फेलओवर पथ पर रहते हैं।
</Note>

स्थिति प्रति-एजेंट SQLite प्रमाणीकरण स्थिति में संग्रहीत होती है:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

डिफ़ॉल्ट:

- बिलिंग backoff **5 घंटे** से शुरू होता है, प्रत्येक बिलिंग विफलता पर दोगुना होता है, और **24 घंटे** पर सीमित होता है।
- यदि प्रोफ़ाइल **24 घंटे** तक विफल नहीं हुई है तो backoff काउंटर रीसेट हो जाते हैं (कॉन्फ़िगर करने योग्य)।
- ओवरलोडेड retries मॉडल फॉलबैक से पहले **1 समान-प्रदाता प्रोफ़ाइल रोटेशन** की अनुमति देती हैं।
- ओवरलोडेड retries डिफ़ॉल्ट रूप से **0 ms backoff** का उपयोग करती हैं।

## मॉडल फॉलबैक

यदि किसी प्रदाता की सभी प्रोफ़ाइल विफल हो जाती हैं, तो OpenClaw `agents.defaults.model.fallbacks` में अगले मॉडल पर चला जाता है। यह प्रमाणीकरण विफलताओं, दर सीमाओं, और उन timeouts पर लागू होता है जिनमें प्रोफ़ाइल रोटेशन समाप्त हो चुका है (अन्य त्रुटियां फॉलबैक को आगे नहीं बढ़ातीं)। जो प्रदाता त्रुटियां पर्याप्त विवरण उजागर नहीं करतीं, उन्हें फिर भी फॉलबैक स्थिति में सटीक रूप से लेबल किया जाता है: `empty_response` का अर्थ है कि प्रदाता ने कोई उपयोगी संदेश या स्थिति नहीं लौटाई, `no_error_details` का अर्थ है कि प्रदाता ने स्पष्ट रूप से `Unknown error (no error details in response)` लौटाया, और `unclassified` का अर्थ है कि OpenClaw ने raw preview सुरक्षित रखा लेकिन अभी तक कोई classifier उससे मेल नहीं खाया।

ओवरलोडेड और दर-सीमा त्रुटियों को बिलिंग कूलडाउन की तुलना में अधिक आक्रामक रूप से संभाला जाता है। डिफ़ॉल्ट रूप से, OpenClaw एक समान-प्रदाता auth-profile retry की अनुमति देता है, फिर बिना प्रतीक्षा किए अगले कॉन्फ़िगर किए गए मॉडल फॉलबैक पर स्विच करता है। `ModelNotReadyException` जैसे provider-busy संकेत उस ओवरलोडेड bucket में आते हैं। इसे `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, और `auth.cooldowns.rateLimitedProfileRotations` से समायोजित करें।

जब कोई रन कॉन्फ़िगर किए गए डिफ़ॉल्ट primary, किसी Cron job primary, स्पष्ट fallbacks वाले agent primary, या auto-selected fallback override से शुरू होता है, तो OpenClaw मिलती-जुलती कॉन्फ़िगर की गई fallback chain पर चल सकता है। स्पष्ट fallbacks के बिना agent primaries और स्पष्ट उपयोगकर्ता चयन (उदाहरण के लिए `/model ollama/qwen3.5:27b`, model picker, `sessions.patch`, या one-off CLI प्रदाता/मॉडल overrides) strict होते हैं: यदि वह प्रदाता/मॉडल पहुंच योग्य नहीं है या उत्तर देने से पहले विफल हो जाता है, तो OpenClaw किसी असंबंधित fallback से उत्तर देने के बजाय विफलता रिपोर्ट करता है।

### Candidate chain नियम

OpenClaw मौजूदा अनुरोधित `provider/model` और कॉन्फ़िगर किए गए fallbacks से candidate सूची बनाता है।

<AccordionGroup>
  <Accordion title="नियम">
    - अनुरोधित मॉडल हमेशा पहले होता है।
    - स्पष्ट रूप से कॉन्फ़िगर किए गए fallbacks deduplicated होते हैं लेकिन model allowlist से फ़िल्टर नहीं किए जाते। उन्हें स्पष्ट operator intent माना जाता है।
    - यदि मौजूदा रन उसी provider family में पहले से ही किसी कॉन्फ़िगर किए गए fallback पर है, तो OpenClaw पूरी कॉन्फ़िगर की गई chain का उपयोग जारी रखता है।
    - जब कोई स्पष्ट fallback override प्रदान नहीं किया जाता, तो कॉन्फ़िगर किए गए fallbacks को कॉन्फ़िगर किए गए primary से पहले आज़माया जाता है, भले ही अनुरोधित मॉडल किसी अलग प्रदाता का उपयोग करता हो।
    - जब fallback runner को कोई स्पष्ट fallback override प्रदान नहीं किया जाता, तो कॉन्फ़िगर किया गया primary अंत में जोड़ा जाता है ताकि पहले के candidates समाप्त होने पर chain सामान्य डिफ़ॉल्ट पर वापस टिक सके।
    - जब caller `fallbacksOverride` प्रदान करता है, तो runner ठीक अनुरोधित मॉडल और उस override सूची का उपयोग करता है। खाली सूची model fallback को अक्षम करती है और कॉन्फ़िगर किए गए primary को hidden retry target के रूप में जोड़े जाने से रोकती है।

  </Accordion>
</AccordionGroup>

### कौन सी त्रुटियां फॉलबैक को आगे बढ़ाती हैं

<Tabs>
  <Tab title="इन पर जारी रहता है">
    - auth विफलताएं
    - दर सीमाएं और कूलडाउन समाप्ति
    - ओवरलोडेड/provider-busy त्रुटियां
    - timeout-जैसी failover त्रुटियां
    - बिलिंग अक्षम
    - `LiveSessionModelSwitchError`, जिसे failover path में normalize किया जाता है ताकि stale persisted model बाहरी retry loop न बनाए
    - अन्य अपरिचित त्रुटियां जब अभी भी शेष candidates हों

  </Tab>
  <Tab title="इन पर जारी नहीं रहता">
    - स्पष्ट aborts जो timeout/failover-जैसे नहीं हैं
    - context overflow त्रुटियां जिन्हें compaction/retry logic के भीतर रहना चाहिए (उदाहरण के लिए `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, या `ollama error: context length exceeded`)
    - अंतिम unknown error जब कोई candidate शेष नहीं है
    - Claude Fable 5 safety refusals; direct API-key requests इन्हें इसके बजाय Anthropic के server-side fallback से `claude-opus-4-8` पर प्रदाता स्तर पर संभालते हैं (देखें [Anthropic](/hi/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Cooldown skip बनाम probe व्यवहार

जब किसी प्रदाता की हर auth profile पहले से ही कूलडाउन में हो, तो OpenClaw उस प्रदाता को हमेशा के लिए अपने-आप skip नहीं करता। यह प्रति-candidate निर्णय लेता है:

<AccordionGroup>
  <Accordion title="प्रति-candidate निर्णय">
    - Persistent auth विफलताएं पूरे प्रदाता को तुरंत skip कर देती हैं।
    - बिलिंग disables आमतौर पर skip करते हैं, लेकिन primary candidate को throttle पर फिर भी probe किया जा सकता है ताकि restart किए बिना recovery संभव हो।
    - primary candidate को cooldown expiry के पास, per-provider throttle के साथ probe किया जा सकता है।
    - समान-प्रदाता fallback siblings को cooldown के बावजूद आज़माया जा सकता है जब विफलता अस्थायी लगती है (`rate_limit`, `overloaded`, या unknown)। यह विशेष रूप से तब प्रासंगिक है जब rate limit model-scoped हो और sibling model फिर भी तुरंत recover कर सकता हो।
    - Transient cooldown probes प्रति fallback run प्रति प्रदाता एक तक सीमित होते हैं ताकि एक single provider cross-provider fallback को stall न करे।

  </Accordion>
</AccordionGroup>

## Session overrides और live model switching

Session model changes साझा स्थिति हैं। active runner, `/model` command, compaction/session updates, और live-session reconciliation सभी उसी session entry के हिस्सों को पढ़ते या लिखते हैं।

इसका अर्थ है कि fallback retries को live model switching के साथ समन्वय करना होगा:

- केवल स्पष्ट user-driven model changes pending live switch चिह्नित करते हैं। इसमें `/model`, `session_status(model=...)`, और `sessions.patch` शामिल हैं।
- system-driven model changes जैसे fallback rotation, Heartbeat overrides, या Compaction अपने-आप pending live switch चिह्नित नहीं करते।
- User-driven model overrides को fallback policy के लिए exact selections माना जाता है, इसलिए unreachable selected provider `agents.defaults.model.fallbacks` से छिपने के बजाय failure के रूप में सामने आता है।
- fallback retry शुरू होने से पहले, reply runner selected fallback override fields को session entry में persist करता है।
- Auto fallback overrides बाद के turns पर selected रहते हैं ताकि OpenClaw हर message पर known-bad primary को probe न करे। OpenClaw समय-समय पर configured origin को फिर से probe करता है और recover होने पर auto override साफ़ करता है; `/new`, `/reset`, और `sessions.reset` auto-sourced overrides को तुरंत साफ़ करते हैं।
- User replies fallback transitions और fallback-cleared recovery को प्रति state change एक बार announce करते हैं। Sticky fallback turns notice को दोहराते नहीं हैं।
- `/status` selected model दिखाता है और, जब fallback state अलग हो, active fallback model और reason भी दिखाता है।
- Live-session reconciliation stale runtime model fields की तुलना में persisted session overrides को प्राथमिकता देता है।
- यदि live-switch error active fallback chain में किसी later candidate की ओर इशारा करती है, तो OpenClaw पहले unrelated candidates पर चलने के बजाय सीधे उस selected model पर जाता है।
- यदि fallback attempt विफल होती है, तो runner केवल उन override fields को rollback करता है जिन्हें उसने लिखा था, और केवल तभी जब वे अब भी उस failed candidate से मेल खाते हों।

यह classic race को रोकता है:

<Steps>
  <Step title="Primary विफल होता है">
    selected primary model विफल होता है।
  </Step>
  <Step title="Fallback memory में चुना गया">
    Fallback candidate memory में चुना जाता है।
  </Step>
  <Step title="Session store अब भी पुराना primary कहता है">
    Session store अब भी पुराने primary को दर्शाता है।
  </Step>
  <Step title="Live reconciliation stale state पढ़ता है">
    Live-session reconciliation stale session state पढ़ता है।
  </Step>
  <Step title="Retry वापस snap हो गया">
    fallback attempt शुरू होने से पहले retry वापस पुराने model पर snap हो जाता है।
  </Step>
</Steps>

persisted fallback override उस window को बंद करता है, और narrow rollback नए manual या runtime session changes को intact रखता है।

## Observability और failure summaries

`runWithModelFallback(...)` प्रति-attempt details रिकॉर्ड करता है जो logs और user-facing cooldown messaging को feed करती हैं:

- आज़माया गया provider/model
- reason (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, और समान failover reasons)
- optional status/code
- human-readable error summary

Structured `model_fallback_decision` logs में flat `fallbackStep*` fields भी शामिल होते हैं जब कोई candidate विफल होता है, skip होता है, या कोई later fallback सफल होता है। ये fields attempted transition को explicit बनाते हैं (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) ताकि log और diagnostic exporters terminal fallback भी विफल होने पर भी primary failure को reconstruct कर सकें।

जब हर candidate विफल हो जाता है, OpenClaw `FallbackSummaryError` throw करता है। outer reply runner इसका उपयोग अधिक specific message बनाने के लिए कर सकता है, जैसे "all models are temporarily rate-limited", और known होने पर soonest cooldown expiry शामिल कर सकता है।

वह cooldown summary model-aware है:

- unrelated model-scoped rate limits को attempted provider/model chain के लिए ignore किया जाता है
- यदि remaining block matching model-scoped rate limit है, तो OpenClaw आख़िरी matching expiry रिपोर्ट करता है जो अब भी उस model को block करती है

## संबंधित config

[Gateway configuration](/hi/gateway/configuration) देखें इनके लिए:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` रूटिंग

व्यापक मॉडल चयन और फ़ॉलबैक अवलोकन के लिए [मॉडल](/hi/concepts/models) देखें।
