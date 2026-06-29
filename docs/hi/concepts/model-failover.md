---
read_when:
    - प्रमाणीकरण प्रोफ़ाइल रोटेशन, कूलडाउन, या मॉडल फ़ॉलबैक व्यवहार का निदान
    - प्रमाणीकरण प्रोफ़ाइलों या मॉडलों के लिए फ़ेलओवर नियम अपडेट करना
    - सत्र मॉडल ओवरराइड फ़ॉलबैक पुनःप्रयासों के साथ कैसे इंटरैक्ट करते हैं, यह समझना
sidebarTitle: Model failover
summary: OpenClaw प्रमाणीकरण प्रोफ़ाइलों को कैसे रोटेट करता है और मॉडलों के बीच फ़ॉलबैक करता है
title: मॉडल फ़ेलओवर
x-i18n:
    generated_at: "2026-06-28T23:00:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw विफलताओं को दो चरणों में संभालता है:

1. वर्तमान प्रदाता के भीतर **ऑथ प्रोफ़ाइल रोटेशन**।
2. `agents.defaults.model.fallbacks` में अगले मॉडल पर **मॉडल फ़ॉलबैक**।

यह दस्तावेज़ runtime नियमों और उन्हें आधार देने वाले डेटा की व्याख्या करता है।

## Runtime प्रवाह

सामान्य टेक्स्ट रन के लिए, OpenClaw उम्मीदवारों का मूल्यांकन इस क्रम में करता है:

<Steps>
  <Step title="सेशन स्थिति हल करें">
    सक्रिय सेशन मॉडल और ऑथ-प्रोफ़ाइल प्राथमिकता हल करें।
  </Step>
  <Step title="उम्मीदवार श्रृंखला बनाएं">
    वर्तमान मॉडल चयन और उस चयन स्रोत की फ़ॉलबैक नीति से मॉडल उम्मीदवार श्रृंखला बनाएं। कॉन्फ़िगर किए गए डिफ़ॉल्ट, cron जॉब प्राथमिक मॉडल, और अपने-आप चुने गए फ़ॉलबैक मॉडल कॉन्फ़िगर किए गए फ़ॉलबैक का उपयोग कर सकते हैं; स्पष्ट यूज़र सेशन चयन सख्त होते हैं।
  </Step>
  <Step title="वर्तमान प्रदाता आज़माएं">
    वर्तमान प्रदाता को ऑथ-प्रोफ़ाइल रोटेशन/cooldown नियमों के साथ आज़माएं।
  </Step>
  <Step title="failover-योग्य त्रुटियों पर आगे बढ़ें">
    यदि वह प्रदाता failover-योग्य त्रुटि के साथ समाप्त हो जाता है, तो अगले मॉडल उम्मीदवार पर जाएं।
  </Step>
  <Step title="फ़ॉलबैक ओवरराइड कायम रखें">
    retry शुरू होने से पहले चयनित फ़ॉलबैक ओवरराइड कायम रखें ताकि दूसरे सेशन रीडर वही प्रदाता/मॉडल देखें जिसे runner उपयोग करने वाला है। कायम रखा गया मॉडल ओवरराइड `modelOverrideSource: "auto"` के रूप में चिह्नित होता है।
  </Step>
  <Step title="विफलता पर सीमित rollback करें">
    यदि फ़ॉलबैक उम्मीदवार विफल होता है, तो केवल फ़ॉलबैक-स्वामित्व वाले सेशन ओवरराइड फ़ील्ड को rollback करें, जब वे अभी भी उसी विफल उम्मीदवार से मेल खाते हों।
  </Step>
  <Step title="समाप्त होने पर FallbackSummaryError फेंकें">
    यदि हर उम्मीदवार विफल होता है, तो प्रति-attempt विवरण और ज्ञात होने पर सबसे जल्द cooldown समाप्ति के साथ `FallbackSummaryError` फेंकें।
  </Step>
</Steps>

यह जानबूझकर "पूरे सेशन को save और restore करें" से संकरा है। reply runner केवल वे मॉडल-चयन फ़ील्ड कायम रखता है जिनका स्वामित्व उसके पास फ़ॉलबैक के लिए है:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

यह किसी विफल फ़ॉलबैक retry को नई असंबंधित सेशन mutations, जैसे manual `/model` बदलाव या attempt चलते समय हुए सेशन rotation updates, को overwrite करने से रोकता है।

## चयन स्रोत नीति

OpenClaw चयनित प्रदाता/मॉडल को उसके चयन के कारण से अलग रखता है। वही स्रोत नियंत्रित करता है कि फ़ॉलबैक श्रृंखला की अनुमति है या नहीं:

- **कॉन्फ़िगर किया गया डिफ़ॉल्ट**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` का उपयोग करता है।
- **Agent प्राथमिक मॉडल**: `agents.list[].model` सख्त होता है, जब तक कि उस agent मॉडल object में अपने `fallbacks` शामिल न हों। सख्त व्यवहार को स्पष्ट करने के लिए `fallbacks: []` का उपयोग करें, या उस agent को मॉडल फ़ॉलबैक में शामिल करने के लिए non-empty list दें।
- **Auto फ़ॉलबैक ओवरराइड**: runtime फ़ॉलबैक retry करने से पहले `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, और चयनित origin मॉडल लिखता है। वह auto ओवरराइड हर message पर primary को probe किए बिना कॉन्फ़िगर की गई फ़ॉलबैक श्रृंखला पर आगे चल सकता है, लेकिन OpenClaw समय-समय पर कॉन्फ़िगर किए गए origin को फिर probe करता है और recover होने पर auto ओवरराइड साफ़ कर देता है। `/new`, `/reset`, और `sessions.reset` भी auto-sourced ओवरराइड साफ़ करते हैं। स्पष्ट `heartbeat.model` के बिना Heartbeat runs direct auto overrides को तब साफ़ करते हैं जब उनका origin वर्तमान कॉन्फ़िगर किए गए डिफ़ॉल्ट से मेल नहीं खाता।
- **यूज़र सेशन ओवरराइड**: `/model`, model picker, `session_status(model=...)`, और `sessions.patch`, `modelOverrideSource: "user"` लिखते हैं। यह एक सटीक सेशन चयन है। यदि चयनित प्रदाता/मॉडल reply बनाने से पहले विफल होता है, तो OpenClaw किसी असंबंधित कॉन्फ़िगर किए गए फ़ॉलबैक से उत्तर देने के बजाय विफलता रिपोर्ट करता है।
- **Legacy सेशन ओवरराइड**: पुराने सेशन entries में `modelOverride` हो सकता है, पर `modelOverrideSource` नहीं। OpenClaw उन्हें यूज़र ओवरराइड मानता है ताकि कोई स्पष्ट पुराना चयन चुपचाप फ़ॉलबैक व्यवहार में न बदले।
- **Cron payload मॉडल**: cron job `payload.model` / `--model` एक job primary है, यूज़र सेशन ओवरराइड नहीं। यह कॉन्फ़िगर किए गए फ़ॉलबैक का उपयोग करता है, जब तक job `payload.fallbacks` न दे; `payload.fallbacks: []` cron run को सख्त बनाता है।

auto फ़ॉलबैक primary-probe interval पांच मिनट है और configurable नहीं है। OpenClaw प्रति सेशन और primary model हालिया probes याद रखता है ताकि विफल primary को हर turn पर retry न किया जाए। जब कोई सेशन फ़ॉलबैक पर जाता है, OpenClaw एक visible notice भेजता है और चयनित primary पर लौटने पर दूसरा notice भेजता है; sticky fallback turn पर यह notice बार-बार नहीं दोहराता।

## Auth failure skip cache

डिफ़ॉल्ट रूप से, हर नया turn मौजूदा फ़ॉलबैक retry व्यवहार रखता है: OpenClaw
हर कॉन्फ़िगर किए गए फ़ॉलबैक उम्मीदवार को फिर आज़माएगा, जिसमें वे non-primary
उम्मीदवार भी शामिल हैं जो हाल ही में `auth` या `auth_permanent` के साथ विफल हुए थे।

जो operators इन दोहराई जाने वाली auth failures को suppress करना पसंद करते हैं, वे इसके साथ opt in कर सकते हैं:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

सक्षम होने पर, OpenClaw auth-class failure के बाद किसी non-primary fallback candidate के लिए
in-memory, session-scoped skip marker record करता है। marker session id,
provider, और model से keyed होता है। Primary candidates कभी skip नहीं किए जाते, इसलिए
explicit user model selection अभी भी वास्तविक auth error surface करता है। cache
process-local है और Gateway restart पर clear हो जाता है।

value milliseconds में TTL है। `0` या unset value cache को disable करता है।
Positive values को 1 second और 10 minutes के बीच clamp किया जाता है।

## यूज़र-दृश्यमान फ़ॉलबैक notices

जब कोई सेशन auto-selected fallback पर जाता है, OpenClaw उसी reply surface में status notice भेजता है:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

जब बाद का probe सफल होता है और सेशन चयनित primary पर लौटता है, OpenClaw भेजता है:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

ये notices operational messages हैं, assistant content नहीं। इन्हें हर state change पर एक बार deliver किया जाता है, जिसमें feasible होने पर side-effect-only turns भी शामिल हैं, लेकिन sticky fallback turns इन्हें repeat नहीं करते। Delivery normal source-reply suppression को bypass करती है, notice threaded channels के लिए first assistant reply slot consume नहीं करता, और यह text-to-speech और commitment extraction से excluded रहता है।

## Auth storage (keys + OAuth)

OpenClaw API keys और OAuth tokens दोनों के लिए **auth profiles** का उपयोग करता है।

- Secrets और runtime auth-routing state `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` में रहते हैं।
- Config `auth.profiles` / `auth.order` केवल **metadata + routing** हैं (कोई secrets नहीं)।
- Legacy import-only OAuth file: `~/.openclaw/credentials/oauth.json` (पहली बार उपयोग पर per-agent auth store में imported)।
- Legacy `auth-profiles.json`, `auth-state.json`, और per-agent `auth.json` files को `openclaw doctor --fix` द्वारा import किया जाता है।

अधिक विवरण: [OAuth](/hi/concepts/oauth)

Credential types:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (कुछ providers के लिए + `projectId`/`enterpriseUrl`)

## Profile IDs

OAuth logins अलग-अलग profiles बनाते हैं ताकि कई accounts साथ मौजूद रह सकें।

- Default: जब कोई email उपलब्ध न हो तो `provider:default`।
- email के साथ OAuth: `provider:<email>` (उदाहरण के लिए `google-antigravity:user@gmail.com`)।

Profiles per-agent `openclaw-agent.sqlite` auth profile store में रहते हैं।

## Rotation order

जब किसी provider के पास कई profiles होते हैं, OpenClaw इस तरह order चुनता है:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (यदि set हो)।
  </Step>
  <Step title="Configured profiles">
    provider द्वारा filtered `auth.profiles`।
  </Step>
  <Step title="Stored profiles">
    उस provider के लिए per-agent SQLite auth profile entries।
  </Step>
</Steps>

यदि कोई explicit order configured नहीं है, तो OpenClaw round-robin order उपयोग करता है:

- **Primary key:** profile type (**API keys से पहले OAuth**)।
- **Secondary key:** `usageStats.lastUsed` (हर type के भीतर सबसे पुराना पहले)।
- **Cooldown/disabled profiles** को end में move किया जाता है, soonest expiry के अनुसार ordered।

### Session stickiness (cache-friendly)

OpenClaw provider caches को warm रखने के लिए **चुनी गई auth profile को per session pin करता है**। यह हर request पर rotate **नहीं** करता। pinned profile तब तक reused रहती है जब तक:

- session reset नहीं होता (`/new` / `/reset`)
- compaction complete नहीं होता (compaction count increment होता है)
- profile cooldown/disabled में नहीं होती

`/model …@<profileId>` के माध्यम से manual selection उस session के लिए **user override** set करता है और new session शुरू होने तक auto-rotated नहीं होता।

<Note>
Auto-pinned profiles (session router द्वारा selected) को **preference** माना जाता है: उन्हें पहले try किया जाता है, लेकिन OpenClaw rate limits/timeouts पर दूसरी profile पर rotate कर सकता है। जब original profile फिर available हो जाती है, तो new runs selected model या runtime बदले बिना फिर उसे prefer कर सकते हैं। User-pinned profiles उसी profile पर locked रहती हैं; यदि वह fail होती है और model fallbacks configured हैं, तो OpenClaw profiles switch करने के बजाय next model पर जाता है।
</Note>

### OpenAI Codex subscription plus API-key backup

OpenAI agent models के लिए, auth और runtime अलग हैं। `openai/gpt-*`
Codex harness पर रहता है, जबकि auth Codex subscription profile और
OpenAI API-key backup के बीच rotate कर सकता है।

user-facing order के लिए `auth.order.openai` उपयोग करें:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

ChatGPT/Codex OAuth profiles और OpenAI API-key
profiles दोनों के लिए `openai:*` उपयोग करें। जब subscription Codex usage limit तक पहुंचता है,
यदि Codex reset time देता है तो OpenClaw exact reset time record करता है, अगली
ordered auth profile try करता है, और run को Codex harness के भीतर रखता है। reset
time बीत जाने के बाद, subscription profile फिर eligible हो जाती है और next automatic
selection उस पर लौट सकता है।

user-pinned profile का उपयोग केवल तब करें जब आप उस
session के लिए एक account/key force करना चाहते हों। User-pinned profiles जानबूझकर strict होती हैं और चुपचाप
दूसरी profile पर jump नहीं करतीं।

## Cooldowns

जब कोई profile auth/rate-limit errors (या rate limiting जैसा दिखने वाले timeout) के कारण fail होती है, OpenClaw उसे cooldown में mark करता है और next profile पर move करता है।

<AccordionGroup>
  <Accordion title="rate-limit / timeout bucket में क्या आता है">
    वह rate-limit bucket plain `429` से broader है: इसमें provider messages जैसे `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, और periodic usage-window limits जैसे `weekly/monthly limit reached` भी शामिल हैं।

    Format/invalid-request errors आमतौर पर terminal होते हैं क्योंकि same payload retry करने पर same way fail होगा, इसलिए OpenClaw auth profiles rotate करने के बजाय उन्हें surface करता है। Known retry-repair paths explicit रूप से opt in कर सकते हैं: उदाहरण के लिए Cloud Code Assist tool call ID validation failures को sanitize किया जाता है और `allowFormatRetry` policy के माध्यम से एक बार retry किया जाता है। OpenAI-compatible stop-reason errors जैसे `Unhandled stop reason: error`, `stop reason: error`, और `reason: error` को timeout/failover signals के रूप में classified किया जाता है।

    Generic server text भी उस timeout bucket में आ सकता है जब source known transient pattern से match करता है। उदाहरण के लिए, bare model runtime stream-wrapper message `An unknown error occurred` को हर provider के लिए failover-worthy माना जाता है क्योंकि shared model runtime इसे तब emit करता है जब provider streams specific details के बिना `stopReason: "aborted"` या `stopReason: "error"` के साथ end होती हैं। transient server text जैसे `internal server error`, `unknown error, 520`, `upstream error`, या `backend error` वाले JSON `api_error` payloads को भी failover-worthy timeouts माना जाता है।

    OpenRouter-specific generic upstream text जैसे bare `Provider returned error` को timeout केवल तब माना जाता है जब provider context वास्तव में OpenRouter हो। Generic internal fallback text जैसे `LLM request failed with an unknown error.` conservative रहता है और अपने-आप failover trigger नहीं करता।

  </Accordion>
  <Accordion title="SDK retry-after सीमाएँ">
    कुछ प्रदाता SDK अन्यथा OpenClaw को नियंत्रण लौटाने से पहले लंबे `Retry-After` अंतराल तक प्रतीक्षा कर सकते हैं। Anthropic और OpenAI जैसे Stainless-आधारित SDK के लिए, OpenClaw डिफ़ॉल्ट रूप से SDK-आंतरिक `retry-after-ms` / `retry-after` प्रतीक्षाओं को 60 सेकंड पर सीमित करता है और लंबे पुनः प्रयास योग्य प्रत्युत्तर तुरंत सामने लाता है ताकि यह फ़ॉलबैक पथ चल सके। सीमा को `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` से समायोजित या अक्षम करें; [पुनः प्रयास व्यवहार](/hi/concepts/retry) देखें।
  </Accordion>
  <Accordion title="मॉडल-स्कोप्ड कूलडाउन">
    दर-सीमा कूलडाउन मॉडल-स्कोप्ड भी हो सकते हैं:

    - विफल मॉडल id ज्ञात होने पर OpenClaw दर-सीमा विफलताओं के लिए `cooldownModel` रिकॉर्ड करता है।
    - उसी प्रदाता पर कोई सहोदर मॉडल अभी भी आज़माया जा सकता है जब कूलडाउन किसी अलग मॉडल तक सीमित हो।
    - बिलिंग/अक्षम विंडो अब भी सभी मॉडलों में पूरी प्रोफ़ाइल को ब्लॉक करती हैं।

  </Accordion>
</AccordionGroup>

कूलडाउन घातीय बैकऑफ का उपयोग करते हैं:

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

## बिलिंग अक्षमकरण

बिलिंग/क्रेडिट विफलताओं (उदाहरण के लिए "insufficient credits" / "credit balance too low") को फ़ॉलबैक-योग्य माना जाता है, लेकिन वे आम तौर पर अस्थायी नहीं होतीं। छोटे कूलडाउन के बजाय, OpenClaw प्रोफ़ाइल को **अक्षम** के रूप में चिह्नित करता है (लंबे बैकऑफ के साथ) और अगली प्रोफ़ाइल/प्रदाता पर रोटेट करता है।

<Note>
हर बिलिंग-जैसा प्रत्युत्तर `402` नहीं होता, और हर HTTP `402` यहाँ नहीं आता। OpenClaw स्पष्ट बिलिंग पाठ को बिलिंग लेन में रखता है, भले ही प्रदाता इसके बजाय `401` या `403` लौटाए, लेकिन प्रदाता-विशिष्ट मैचर उसी प्रदाता तक सीमित रहते हैं जो उनका स्वामी है (उदाहरण के लिए OpenRouter `403 Key limit exceeded`)।

इस बीच अस्थायी `402` उपयोग-विंडो और संगठन/वर्कस्पेस खर्च-सीमा त्रुटियों को `rate_limit` के रूप में वर्गीकृत किया जाता है जब संदेश पुनः प्रयास योग्य दिखता है (उदाहरण के लिए `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, या `organization spending limit exceeded`)। वे लंबे बिलिंग-अक्षम पथ के बजाय छोटे कूलडाउन/फ़ॉलबैक पथ पर रहते हैं।
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

- बिलिंग बैकऑफ **5 घंटे** से शुरू होता है, हर बिलिंग विफलता पर दोगुना होता है, और **24 घंटे** पर सीमित होता है।
- यदि प्रोफ़ाइल **24 घंटे** से विफल नहीं हुई है तो बैकऑफ काउंटर रीसेट हो जाते हैं (कॉन्फ़िगर करने योग्य)।
- ओवरलोडेड पुनः प्रयास मॉडल फ़ॉलबैक से पहले **1 समान-प्रदाता प्रोफ़ाइल रोटेशन** की अनुमति देते हैं।
- ओवरलोडेड पुनः प्रयास डिफ़ॉल्ट रूप से **0 ms बैकऑफ** का उपयोग करते हैं।

## मॉडल फ़ॉलबैक

यदि किसी प्रदाता की सभी प्रोफ़ाइल विफल हो जाती हैं, तो OpenClaw `agents.defaults.model.fallbacks` में अगले मॉडल पर चला जाता है। यह प्रमाणीकरण विफलताओं, दर सीमाओं, और उन टाइमआउट पर लागू होता है जिन्होंने प्रोफ़ाइल रोटेशन समाप्त कर दिया है (अन्य त्रुटियाँ फ़ॉलबैक को आगे नहीं बढ़ातीं)। पर्याप्त विवरण न दिखाने वाली प्रदाता त्रुटियों को फ़ॉलबैक स्थिति में फिर भी सटीक रूप से लेबल किया जाता है: `empty_response` का अर्थ है कि प्रदाता ने कोई उपयोगी संदेश या स्थिति नहीं लौटाई, `no_error_details` का अर्थ है कि प्रदाता ने स्पष्ट रूप से `Unknown error (no error details in response)` लौटाया, और `unclassified` का अर्थ है कि OpenClaw ने कच्चा पूर्वावलोकन सुरक्षित रखा लेकिन अभी तक कोई वर्गीकारक उससे मेल नहीं खाया।

ओवरलोडेड और दर-सीमा त्रुटियों को बिलिंग कूलडाउन की तुलना में अधिक आक्रामक ढंग से संभाला जाता है। डिफ़ॉल्ट रूप से, OpenClaw एक समान-प्रदाता प्रमाणीकरण-प्रोफ़ाइल पुनः प्रयास की अनुमति देता है, फिर प्रतीक्षा किए बिना अगले कॉन्फ़िगर किए गए मॉडल फ़ॉलबैक पर स्विच करता है। `ModelNotReadyException` जैसे प्रदाता-व्यस्त संकेत उसी ओवरलोडेड बकेट में आते हैं। इसे `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, और `auth.cooldowns.rateLimitedProfileRotations` से समायोजित करें।

जब कोई रन कॉन्फ़िगर किए गए डिफ़ॉल्ट प्राथमिक, किसी Cron जॉब प्राथमिक, स्पष्ट फ़ॉलबैक वाले एजेंट प्राथमिक, या स्वतः-चयनित फ़ॉलबैक ओवरराइड से शुरू होता है, तो OpenClaw मेल खाती कॉन्फ़िगर की गई फ़ॉलबैक शृंखला पर चल सकता है। बिना स्पष्ट फ़ॉलबैक वाले एजेंट प्राथमिक और स्पष्ट उपयोगकर्ता चयन (उदाहरण के लिए `/model ollama/qwen3.5:27b`, मॉडल पिकर, `sessions.patch`, या एकबारगी CLI प्रदाता/मॉडल ओवरराइड) सख्त होते हैं: यदि वह प्रदाता/मॉडल पहुँच योग्य नहीं है या उत्तर बनाने से पहले विफल हो जाता है, तो OpenClaw किसी असंबंधित फ़ॉलबैक से उत्तर देने के बजाय विफलता रिपोर्ट करता है।

### उम्मीदवार शृंखला नियम

OpenClaw वर्तमान में अनुरोधित `provider/model` और कॉन्फ़िगर किए गए फ़ॉलबैक से उम्मीदवार सूची बनाता है।

<AccordionGroup>
  <Accordion title="नियम">
    - अनुरोधित मॉडल हमेशा पहले होता है।
    - स्पष्ट कॉन्फ़िगर किए गए फ़ॉलबैक का डुप्लीकेशन हटाया जाता है, लेकिन उन्हें मॉडल allowlist से फ़िल्टर नहीं किया जाता। उन्हें स्पष्ट ऑपरेटर आशय माना जाता है।
    - यदि वर्तमान रन पहले से ही उसी प्रदाता परिवार में किसी कॉन्फ़िगर किए गए फ़ॉलबैक पर है, तो OpenClaw पूरी कॉन्फ़िगर की गई शृंखला का उपयोग जारी रखता है।
    - जब कोई स्पष्ट फ़ॉलबैक ओवरराइड नहीं दिया जाता, तो कॉन्फ़िगर किए गए फ़ॉलबैक कॉन्फ़िगर किए गए प्राथमिक से पहले आज़माए जाते हैं, भले ही अनुरोधित मॉडल किसी अलग प्रदाता का उपयोग करता हो।
    - जब फ़ॉलबैक रनर को कोई स्पष्ट फ़ॉलबैक ओवरराइड नहीं दिया जाता, तो कॉन्फ़िगर किया गया प्राथमिक अंत में जोड़ा जाता है ताकि पहले के उम्मीदवार समाप्त होने के बाद शृंखला सामान्य डिफ़ॉल्ट पर वापस स्थिर हो सके।
    - जब कोई कॉलर `fallbacksOverride` देता है, तो रनर ठीक अनुरोधित मॉडल और उस ओवरराइड सूची का उपयोग करता है। खाली सूची मॉडल फ़ॉलबैक को अक्षम करती है और कॉन्फ़िगर किए गए प्राथमिक को छिपे हुए पुनः प्रयास लक्ष्य के रूप में जोड़े जाने से रोकती है।

  </Accordion>
</AccordionGroup>

### कौन सी त्रुटियाँ फ़ॉलबैक आगे बढ़ाती हैं

<Tabs>
  <Tab title="इन पर जारी रहता है">
    - प्रमाणीकरण विफलताएँ
    - दर सीमाएँ और कूलडाउन समाप्ति
    - ओवरलोडेड/प्रदाता-व्यस्त त्रुटियाँ
    - टाइमआउट-जैसी फ़ेलओवर त्रुटियाँ
    - बिलिंग अक्षमकरण
    - `LiveSessionModelSwitchError`, जिसे फ़ेलओवर पथ में सामान्यीकृत किया जाता है ताकि पुराना स्थायी मॉडल बाहरी पुनः प्रयास लूप न बनाए
    - अन्य अपरिचित त्रुटियाँ जब अभी भी शेष उम्मीदवार हों

  </Tab>
  <Tab title="इन पर जारी नहीं रहता">
    - स्पष्ट निरस्तीकरण जो टाइमआउट/फ़ेलओवर-जैसे नहीं हैं
    - संदर्भ ओवरफ़्लो त्रुटियाँ जिन्हें Compaction/पुनः प्रयास तर्क के भीतर ही रहना चाहिए (उदाहरण के लिए `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, या `ollama error: context length exceeded`)
    - अंतिम अज्ञात त्रुटि जब कोई उम्मीदवार शेष न हो

  </Tab>
</Tabs>

### कूलडाउन छोड़ना बनाम प्रोब व्यवहार

जब किसी प्रदाता की हर प्रमाणीकरण प्रोफ़ाइल पहले से कूलडाउन में हो, तो OpenClaw उस प्रदाता को हमेशा के लिए अपने-आप नहीं छोड़ता। यह प्रति-उम्मीदवार निर्णय लेता है:

<AccordionGroup>
  <Accordion title="प्रति-उम्मीदवार निर्णय">
    - स्थायी प्रमाणीकरण विफलताएँ पूरे प्रदाता को तुरंत छोड़ देती हैं।
    - बिलिंग अक्षमकरण आम तौर पर छोड़े जाते हैं, लेकिन प्राथमिक उम्मीदवार को फिर भी थ्रॉटल पर प्रोब किया जा सकता है ताकि पुनर्प्राप्ति बिना पुनः आरंभ किए संभव हो।
    - प्राथमिक उम्मीदवार को कूलडाउन समाप्ति के पास, प्रति-प्रदाता थ्रॉटल के साथ प्रोब किया जा सकता है।
    - समान-प्रदाता फ़ॉलबैक सहोदर कूलडाउन के बावजूद आज़माए जा सकते हैं जब विफलता अस्थायी दिखती है (`rate_limit`, `overloaded`, या अज्ञात)। यह विशेष रूप से तब प्रासंगिक है जब दर सीमा मॉडल-स्कोप्ड हो और कोई सहोदर मॉडल अभी भी तुरंत पुनर्प्राप्त हो सकता हो।
    - अस्थायी कूलडाउन प्रोब प्रति फ़ॉलबैक रन प्रति प्रदाता एक तक सीमित हैं ताकि कोई एक प्रदाता क्रॉस-प्रदाता फ़ॉलबैक को रोक न दे।

  </Accordion>
</AccordionGroup>

## सत्र ओवरराइड और लाइव मॉडल स्विचिंग

सत्र मॉडल परिवर्तन साझा स्थिति हैं। सक्रिय रनर, `/model` कमांड, Compaction/सत्र अपडेट, और लाइव-सत्र पुनर्मिलान सभी उसी सत्र प्रविष्टि के हिस्से पढ़ते या लिखते हैं।

इसका अर्थ है कि फ़ॉलबैक पुनः प्रयासों को लाइव मॉडल स्विचिंग के साथ समन्वय करना होता है:

- केवल स्पष्ट उपयोगकर्ता-चालित मॉडल परिवर्तन लंबित लाइव स्विच को चिह्नित करते हैं। इसमें `/model`, `session_status(model=...)`, और `sessions.patch` शामिल हैं।
- सिस्टम-चालित मॉडल परिवर्तन जैसे फ़ॉलबैक रोटेशन, Heartbeat ओवरराइड, या Compaction अपने-आप लंबित लाइव स्विच को कभी चिह्नित नहीं करते।
- उपयोगकर्ता-चालित मॉडल ओवरराइड को फ़ॉलबैक नीति के लिए सटीक चयन माना जाता है, इसलिए कोई पहुँच-अयोग्य चयनित प्रदाता `agents.defaults.model.fallbacks` से छिपने के बजाय विफलता के रूप में सामने आता है।
- फ़ॉलबैक पुनः प्रयास शुरू होने से पहले, reply runner चयनित फ़ॉलबैक ओवरराइड फ़ील्ड को सत्र प्रविष्टि में स्थायी करता है।
- स्वतः फ़ॉलबैक ओवरराइड बाद की बारीयों पर चयनित रहते हैं ताकि OpenClaw हर संदेश पर ज्ञात-खराब प्राथमिक को प्रोब न करे। OpenClaw समय-समय पर कॉन्फ़िगर किए गए मूल को फिर से प्रोब करता है और उसके पुनर्प्राप्त होने पर स्वतः ओवरराइड साफ़ करता है; `/new`, `/reset`, और `sessions.reset` स्वतः-स्रोत ओवरराइड तुरंत साफ़ करते हैं।
- उपयोगकर्ता प्रत्युत्तर प्रति स्थिति परिवर्तन एक बार फ़ॉलबैक संक्रमण और फ़ॉलबैक-साफ़ पुनर्प्राप्ति की घोषणा करते हैं। चिपके हुए फ़ॉलबैक टर्न सूचना दोहराते नहीं हैं।
- `/status` चयनित मॉडल दिखाता है और, जब फ़ॉलबैक स्थिति अलग हो, सक्रिय फ़ॉलबैक मॉडल और कारण भी दिखाता है।
- लाइव-सत्र पुनर्मिलान पुराने runtime मॉडल फ़ील्ड की तुलना में स्थायी सत्र ओवरराइड को प्राथमिकता देता है।
- यदि कोई लाइव-स्विच त्रुटि सक्रिय फ़ॉलबैक शृंखला में बाद के उम्मीदवार की ओर संकेत करती है, तो OpenClaw पहले असंबंधित उम्मीदवारों पर चलने के बजाय सीधे उस चयनित मॉडल पर जाता है।
- यदि फ़ॉलबैक प्रयास विफल हो जाता है, तो रनर केवल वे ओवरराइड फ़ील्ड वापस रोल करता है जिन्हें उसने लिखा था, और केवल तब जब वे अभी भी उस विफल उम्मीदवार से मेल खाते हों।

यह क्लासिक रेस को रोकता है:

<Steps>
  <Step title="प्राथमिक विफल होता है">
    चयनित प्राथमिक मॉडल विफल होता है।
  </Step>
  <Step title="फ़ॉलबैक मेमोरी में चुना गया">
    फ़ॉलबैक उम्मीदवार मेमोरी में चुना जाता है।
  </Step>
  <Step title="सत्र स्टोर अभी भी पुराना प्राथमिक कहता है">
    सत्र स्टोर अभी भी पुराने प्राथमिक को दर्शाता है।
  </Step>
  <Step title="लाइव पुनर्मिलान पुरानी स्थिति पढ़ता है">
    लाइव-सत्र पुनर्मिलान पुरानी सत्र स्थिति पढ़ता है।
  </Step>
  <Step title="पुनः प्रयास वापस स्नैप हुआ">
    फ़ॉलबैक प्रयास शुरू होने से पहले पुनः प्रयास पुराने मॉडल पर वापस स्नैप हो जाता है।
  </Step>
</Steps>

स्थायी फ़ॉलबैक ओवरराइड उस विंडो को बंद करता है, और संकीर्ण रोलबैक नए मैन्युअल या runtime सत्र परिवर्तनों को अक्षुण्ण रखता है।

## प्रेक्षणीयता और विफलता सारांश

`runWithModelFallback(...)` प्रति-प्रयास विवरण रिकॉर्ड करता है जो लॉग और उपयोगकर्ता-दृश्य कूलडाउन संदेशों को फ़ीड करते हैं:

- आज़माया गया प्रदाता/मॉडल
- कारण (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, और समान फ़ेलओवर कारण)
- वैकल्पिक स्थिति/कोड
- मानव-पठनीय त्रुटि सारांश

संरचित `model_fallback_decision` लॉग में सपाट `fallbackStep*` फ़ील्ड भी शामिल होते हैं जब कोई उम्मीदवार विफल होता है, छोड़ा जाता है, या बाद का फ़ॉलबैक सफल होता है। ये फ़ील्ड आज़माए गए संक्रमण को स्पष्ट बनाते हैं (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) ताकि लॉग और निदान निर्यातक प्राथमिक विफलता को फिर से बना सकें, भले ही अंतिम फ़ॉलबैक भी विफल हो।

जब हर उम्मीदवार विफल हो जाता है, तो OpenClaw `FallbackSummaryError` फेंकता है। बाहरी reply runner इसका उपयोग अधिक विशिष्ट संदेश बनाने के लिए कर सकता है, जैसे "सभी मॉडल अस्थायी रूप से दर-सीमित हैं", और ज्ञात होने पर सबसे निकट कूलडाउन समाप्ति शामिल कर सकता है।

वह कूलडाउन सारांश मॉडल-सचेत है:

- असंबंधित मॉडल-स्कोप्ड दर सीमाओं को आज़माई गई प्रदाता/मॉडल शृंखला के लिए अनदेखा किया जाता है
- यदि शेष ब्लॉक मेल खाती मॉडल-स्कोप्ड दर सीमा है, तो OpenClaw उस मॉडल को अभी भी ब्लॉक करने वाली अंतिम मेल खाती समाप्ति रिपोर्ट करता है

## संबंधित कॉन्फ़िगरेशन

[Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` रूटिंग

व्यापक मॉडल चयन और फ़ॉलबैक अवलोकन के लिए [मॉडल](/hi/concepts/models) देखें।
