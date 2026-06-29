---
read_when:
    - आप समझना चाहते हैं कि OpenClaw में "संदर्भ" का क्या अर्थ है
    - आप यह डिबग कर रहे हैं कि मॉडल कुछ "जानता" क्यों है (या उसे क्यों भूल गया)
    - आप संदर्भ का अतिरिक्त भार कम करना चाहते हैं (/context, /status, /compact)
summary: 'संदर्भ: मॉडल क्या देखता है, यह कैसे बनाया जाता है, और इसका निरीक्षण कैसे करें'
title: संदर्भ
x-i18n:
    generated_at: "2026-06-28T22:57:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

"संदर्भ" वह **सब कुछ है जो OpenClaw किसी रन के लिए मॉडल को भेजता है**। यह मॉडल की **संदर्भ विंडो** (टोकन सीमा) से सीमित होता है।

शुरुआती मानसिक मॉडल:

- **सिस्टम प्रॉम्प्ट** (OpenClaw-निर्मित): नियम, टूल, Skills सूची, समय/रनटाइम, और इंजेक्ट की गई कार्यस्थान फ़ाइलें।
- **बातचीत का इतिहास**: इस सत्र के लिए आपके संदेश + असिस्टेंट के संदेश।
- **टूल कॉल/परिणाम + अटैचमेंट**: कमांड आउटपुट, फ़ाइल रीड, इमेज/ऑडियो, आदि।

संदर्भ "मेमोरी" के _समान नहीं_ है: मेमोरी डिस्क पर संग्रहीत की जा सकती है और बाद में फिर से लोड की जा सकती है; संदर्भ वह है जो मॉडल की वर्तमान विंडो के अंदर है।

## त्वरित शुरुआत (संदर्भ जांचें)

- `/status` → तेज़ "मेरी विंडो कितनी भरी है?" दृश्य + सत्र सेटिंग।
- `/context list` → क्या इंजेक्ट किया गया है + अनुमानित आकार (प्रति फ़ाइल + कुल)।
- `/context detail` → गहरा विभाजन: प्रति-फ़ाइल, प्रति-टूल स्कीमा आकार, प्रति-Skills एंट्री आकार, सिस्टम प्रॉम्प्ट आकार, और कॉम्पैक्ट किए जा सकने वाले ट्रांसक्रिप्ट संदेशों की गिनती।
- `/context map` → वर्तमान सत्र के ट्रैक किए गए संदर्भ योगदानकर्ताओं की WinDirStat-शैली की ट्रीमैप इमेज।
- `/usage tokens` → सामान्य उत्तरों में प्रति-उत्तर उपयोग फ़ुटर जोड़ें।
- `/compact` → विंडो स्थान खाली करने के लिए पुराने इतिहास को एक कॉम्पैक्ट एंट्री में सारांशित करें।

यह भी देखें: [स्लैश कमांड](/hi/tools/slash-commands), [टोकन उपयोग और लागत](/hi/reference/token-use), [Compaction](/hi/concepts/compaction).

## उदाहरण आउटपुट

मान मॉडल, प्रदाता, टूल नीति, और आपके कार्यस्थान में मौजूद चीज़ों के अनुसार बदलते हैं।

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

नवीनतम कैश किए गए रन रिपोर्ट से उत्पन्न इमेज भेजता है। सत्र में किसी सामान्य संदेश द्वारा रन रिपोर्ट बनाए जाने से पहले, `/context map` अनुमान रेंडर करने के बजाय अनुपलब्धता संदेश लौटाता है। आयत का क्षेत्रफल ट्रैक किए गए प्रॉम्प्ट वर्णों के अनुपात में होता है:

- इंजेक्ट की गई कार्यस्थान फ़ाइलें
- बेस सिस्टम प्रॉम्प्ट टेक्स्ट
- Skills प्रॉम्प्ट एंट्री
- टूल JSON स्कीमा

जब कोई रन रिपोर्ट कैश नहीं होती, तब भी `/context list`, `/context detail`, और `/context json` ऑन-डिमांड अनुमान की जांच कर सकते हैं।

## संदर्भ विंडो में क्या गिना जाता है

मॉडल को मिलने वाली हर चीज़ गिनी जाती है, जिसमें शामिल हैं:

- सिस्टम प्रॉम्प्ट (सभी सेक्शन)।
- बातचीत का इतिहास।
- टूल कॉल + टूल परिणाम।
- अटैचमेंट/ट्रांसक्रिप्ट (इमेज/ऑडियो/फ़ाइलें)।
- Compaction सारांश और pruning आर्टिफैक्ट।
- प्रदाता "रैपर" या छिपे हुए हेडर (दिखते नहीं, फिर भी गिने जाते हैं)।

## OpenClaw सिस्टम प्रॉम्प्ट कैसे बनाता है

सिस्टम प्रॉम्प्ट **OpenClaw-स्वामित्व वाला** है और हर रन में फिर से बनाया जाता है। इसमें शामिल हैं:

- टूल सूची + छोटे विवरण।
- Skills सूची (सिर्फ़ मेटाडेटा; नीचे देखें)।
- कार्यस्थान स्थान।
- समय (UTC + कॉन्फ़िगर होने पर परिवर्तित उपयोगकर्ता समय)।
- रनटाइम मेटाडेटा (होस्ट/OS/मॉडल/thinking)।
- **Project Context** के अंतर्गत इंजेक्ट की गई कार्यस्थान बूटस्ट्रैप फ़ाइलें।

पूरा विभाजन: [सिस्टम प्रॉम्प्ट](/hi/concepts/system-prompt).

## इंजेक्ट की गई कार्यस्थान फ़ाइलें (Project Context)

डिफ़ॉल्ट रूप से, OpenClaw कार्यस्थान फ़ाइलों का एक निश्चित सेट इंजेक्ट करता है (यदि मौजूद हों):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (सिर्फ़ पहले रन में)

बड़ी फ़ाइलें प्रति-फ़ाइल `agents.defaults.bootstrapMaxChars` (डिफ़ॉल्ट `20000` वर्ण) का उपयोग करके काटी जाती हैं। OpenClaw `agents.defaults.bootstrapTotalMaxChars` (डिफ़ॉल्ट `60000` वर्ण) के साथ फ़ाइलों में कुल बूटस्ट्रैप इंजेक्शन सीमा भी लागू करता है। `/context` **कच्चे बनाम इंजेक्ट किए गए** आकार और truncation हुआ या नहीं, दिखाता है।

जब truncation होता है, रनटाइम Project Context के अंतर्गत इन-प्रॉम्प्ट चेतावनी ब्लॉक इंजेक्ट कर सकता है। इसे `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; डिफ़ॉल्ट `always`) से कॉन्फ़िगर करें।

## Skills: इंजेक्टेड बनाम ऑन-डिमांड लोडेड

सिस्टम प्रॉम्प्ट में एक कॉम्पैक्ट **Skills सूची** (नाम + विवरण + स्थान) शामिल होती है। इस सूची का वास्तविक ओवरहेड होता है।

Skill निर्देश डिफ़ॉल्ट रूप से शामिल _नहीं_ होते। मॉडल से अपेक्षा की जाती है कि वह Skill की `SKILL.md` को **केवल ज़रूरत पड़ने पर** `read` करे।

## टूल: दो लागतें हैं

टूल संदर्भ को दो तरीकों से प्रभावित करते हैं:

1. सिस्टम प्रॉम्प्ट में **टूल सूची टेक्स्ट** (जिसे आप "Tooling" के रूप में देखते हैं)।
2. **टूल स्कीमा** (JSON)। इन्हें मॉडल को भेजा जाता है ताकि वह टूल कॉल कर सके। ये संदर्भ में गिने जाते हैं, भले ही आप उन्हें साधारण टेक्स्ट के रूप में नहीं देखते।

`/context detail` सबसे बड़े टूल स्कीमा का विभाजन देता है ताकि आप देख सकें कि कौन-सा हिस्सा प्रमुख है।

## कमांड, निर्देश, और "इनलाइन शॉर्टकट"

स्लैश कमांड Gateway द्वारा संभाले जाते हैं। कुछ अलग-अलग व्यवहार हैं:

- **स्टैंडअलोन कमांड**: ऐसा संदेश जो केवल `/...` है, कमांड के रूप में चलता है।
- **निर्देश**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` मॉडल द्वारा संदेश देखने से पहले हटा दिए जाते हैं।
  - सिर्फ़-निर्देश संदेश सत्र सेटिंग बनाए रखते हैं।
  - सामान्य संदेश में इनलाइन निर्देश प्रति-संदेश संकेतों की तरह काम करते हैं।
- **इनलाइन शॉर्टकट** (सिर्फ़ allowlist किए गए प्रेषक): सामान्य संदेश के भीतर कुछ `/...` टोकन तुरंत चल सकते हैं (उदाहरण: "hey /status"), और मॉडल द्वारा बचा हुआ टेक्स्ट देखने से पहले हटा दिए जाते हैं।

विवरण: [स्लैश कमांड](/hi/tools/slash-commands).

## सत्र, Compaction, और pruning (क्या बना रहता है)

संदेशों के बीच क्या बना रहता है, यह तंत्र पर निर्भर करता है:

- **सामान्य इतिहास** सत्र ट्रांसक्रिप्ट में तब तक बना रहता है जब तक नीति द्वारा compact/prune नहीं किया जाता।
- **Compaction** ट्रांसक्रिप्ट में एक सारांश बनाए रखता है और हाल के संदेशों को जस का तस रखता है।
- **Pruning** संदर्भ-विंडो स्थान खाली करने के लिए _इन-मेमोरी_ प्रॉम्प्ट से पुराने टूल परिणाम हटाता है, लेकिन सत्र ट्रांसक्रिप्ट को फिर से नहीं लिखता - पूरा इतिहास अभी भी डिस्क पर जांचा जा सकता है।

डॉक्स: [सत्र](/hi/concepts/session), [Compaction](/hi/concepts/compaction), [सत्र pruning](/hi/concepts/session-pruning).

डिफ़ॉल्ट रूप से, OpenClaw assembly और
compaction के लिए बिल्ट-इन `legacy` संदर्भ इंजन का उपयोग करता है। यदि आप ऐसा Plugin इंस्टॉल करते हैं जो `kind: "context-engine"` प्रदान करता है और
उसे `plugins.slots.contextEngine` से चुनते हैं, तो OpenClaw संदर्भ
assembly, `/compact`, और संबंधित subagent संदर्भ lifecycle hooks उस
इंजन को सौंप देता है। `ownsCompaction: false` legacy
इंजन पर auto-fallback नहीं करता; active engine को फिर भी `compact()` सही ढंग से लागू करना होगा। पूर्ण
pluggable interface, lifecycle hooks, और configuration के लिए
[Context Engine](/hi/concepts/context-engine) देखें।

## `/context` वास्तव में क्या रिपोर्ट करता है

`/context` उपलब्ध होने पर नवीनतम **रन-निर्मित** सिस्टम प्रॉम्प्ट रिपोर्ट को प्राथमिकता देता है:

- `System prompt (run)` = पिछले embedded (tool-capable) रन से कैप्चर किया गया और सत्र store में persist किया गया।
- `System prompt (estimate)` = जब कोई रन रिपोर्ट मौजूद नहीं होती (या जब ऐसे CLI backend के माध्यम से चलाया जा रहा हो जो रिपोर्ट generate नहीं करता), तब तुरंत compute किया गया।

दोनों ही स्थितियों में, यह आकार और शीर्ष योगदानकर्ता रिपोर्ट करता है; यह पूरा सिस्टम प्रॉम्प्ट या टूल स्कीमा डंप **नहीं** करता। विस्तृत मोड में, यह सत्र ट्रांसक्रिप्ट की तुलना उसी real-conversation message predicate से भी करता है जिसका उपयोग compaction करता है, इसलिए high prompt/cache usage को compactable conversation history से अलग पहचानना आसान होता है।

## संबंधित

<CardGroup cols={2}>
  <Card title="Context engine" href="/hi/concepts/context-engine" icon="puzzle-piece">
    plugins के माध्यम से कस्टम संदर्भ इंजेक्शन।
  </Card>
  <Card title="Compaction" href="/hi/concepts/compaction" icon="compress">
    लंबी बातचीत को सारांशित करना ताकि वे मॉडल विंडो के अंदर रहें।
  </Card>
  <Card title="सिस्टम प्रॉम्प्ट" href="/hi/concepts/system-prompt" icon="message-lines">
    सिस्टम प्रॉम्प्ट कैसे बनाया जाता है और हर turn में क्या इंजेक्ट करता है।
  </Card>
  <Card title="एजेंट लूप" href="/hi/concepts/agent-loop" icon="arrows-rotate">
    inbound message से final reply तक पूरा agent execution cycle।
  </Card>
</CardGroup>
