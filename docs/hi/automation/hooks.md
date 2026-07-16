---
read_when:
    - आप /new, /reset, /stop और एजेंट जीवनचक्र इवेंट के लिए इवेंट-संचालित स्वचालन चाहते हैं
    - आप hooks बनाना, इंस्टॉल करना या डीबग करना चाहते हैं
summary: 'हुक्स: कमांड और जीवनचक्र घटनाओं के लिए घटना-संचालित स्वचालन'
title: हुक्स
x-i18n:
    generated_at: "2026-07-16T13:09:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooks छोटी स्क्रिप्ट होती हैं जो एजेंट इवेंट सक्रिय होने पर Gateway के भीतर चलती हैं: `/new`, `/reset`, `/stop` जैसे कमांड, सेशन Compaction, Gateway जीवनचक्र और संदेश प्रवाह। इन्हें डायरेक्टरियों से खोजा जाता है और `openclaw hooks` से प्रबंधित किया जाता है। Gateway आंतरिक Hooks को तभी लोड करता है, जब आप Hooks सक्षम करते हैं या कम-से-कम एक Hook प्रविष्टि, Hook पैक, लेगेसी हैंडलर या अतिरिक्त Hook डायरेक्टरी कॉन्फ़िगर करते हैं।

OpenClaw में Hooks दो प्रकार के होते हैं:

- **आंतरिक Hooks** (यह पृष्ठ): एजेंट इवेंट सक्रिय होने पर Gateway के भीतर चलते हैं।
- **Webhooks**: बाहरी HTTP एंडपॉइंट, जो अन्य सिस्टम को OpenClaw में कार्य शुरू करने देते हैं। [Webhooks](/hi/automation/cron-jobs#webhooks) देखें।

Hooks को Plugins के भीतर भी बंडल किया जा सकता है। `openclaw hooks list` स्टैंडअलोन Hooks और Plugin-प्रबंधित Hooks (जिन्हें `plugin:<id>` के रूप में दिखाया जाता है), दोनों दिखाता है।

## सही सतह चुनें

OpenClaw में कई एक्सटेंशन सतहें हैं जो देखने में समान लगती हैं, लेकिन अलग-अलग समस्याएँ हल करती हैं:

| यदि आप यह करना चाहते हैं...                                                                                                     | इसका उपयोग करें...                                | कारण                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/new` पर स्नैपशॉट सहेजना, `/reset` को लॉग करना, `message:sent` के बाद बाहरी API कॉल करना या मोटे स्तर का ऑपरेटर ऑटोमेशन जोड़ना | आंतरिक Hooks (`HOOK.md`, यह पृष्ठ) | फ़ाइल-आधारित Hooks ऑपरेटर-प्रबंधित साइड इफ़ेक्ट और कमांड/जीवनचक्र ऑटोमेशन के लिए होते हैं |
| प्रॉम्प्ट फिर से लिखना, टूल ब्लॉक करना, आउटबाउंड संदेश रद्द करना या क्रमबद्ध मिडलवेयर/नीति जोड़ना                              | `api.on(...)` के माध्यम से टाइप किए गए Plugin Hooks  | टाइप किए गए Hooks में स्पष्ट अनुबंध, प्राथमिकताएँ, मर्ज नियम और ब्लॉक/रद्द करने की अर्थवत्ता होती है      |
| केवल टेलीमेट्री का निर्यात या ऑब्ज़र्वेबिलिटी जोड़ना                                                                            | डायग्नोस्टिक इवेंट                     | ऑब्ज़र्वेबिलिटी एक अलग इवेंट बस है, नीति Hook सतह नहीं                              |

जब आप ऐसा ऑटोमेशन चाहते हों जो एक छोटे इंस्टॉल किए गए इंटीग्रेशन की तरह काम करे, तो आंतरिक Hooks का उपयोग करें। जब आपको रनटाइम जीवनचक्र नियंत्रण चाहिए, तो टाइप किए गए Plugin Hooks का उपयोग करें।

## त्वरित शुरुआत

```bash
# उपलब्ध hooks सूचीबद्ध करें
openclaw hooks list

# किसी hook को सक्षम करें
openclaw hooks enable session-memory

# hook की स्थिति जाँचें
openclaw hooks check

# विस्तृत जानकारी प्राप्त करें
openclaw hooks info session-memory
```

## इवेंट प्रकार

Hooks इस तालिका की किसी विशिष्ट कुंजी की सदस्यता लेते हैं, या उस परिवार की प्रत्येक क्रिया प्राप्त करने के लिए
केवल परिवार के नाम (`command`, `session`, `agent`, `gateway`, `message`) की सदस्यता लेते हैं।
OpenClaw कोर इनके अलावा कुछ भी उत्सर्जित नहीं करता, इसलिए कोई अन्य नाम लगभग
हमेशा टाइपो होता है, जो Hook को बिना किसी सूचना के निष्क्रिय छोड़ देता है (केवल कस्टम
इवेंट उत्सर्जित करने वाला Plugin ही उसे सक्रिय कर सकता है)। Hook लोडर ऐसे नामों
(उदाहरण के लिए `command:nwe`) के लिए चेतावनी लॉग करता है और `openclaw hooks info <name>` उन्हें चिह्नित करता है, इसलिए
कभी न चलने वाले Hook का निदान किया जा सकता है।

| इवेंट                    | यह कब सक्रिय होता है                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` कमांड जारी होने पर                                      |
| `command:reset`          | `/reset` कमांड जारी होने पर                                    |
| `command:stop`           | `/stop` कमांड जारी होने पर                                     |
| `command`                | कोई भी कमांड इवेंट (सामान्य लिसनर)                       |
| `session:compact:before` | Compaction द्वारा इतिहास का सारांश बनाने से पहले                       |
| `session:compact:after`  | Compaction पूरा होने के बाद                                 |
| `session:patch`          | सेशन गुणों में बदलाव होने पर                       |
| `agent:bootstrap`        | वर्कस्पेस बूटस्ट्रैप फ़ाइलें इंजेक्ट होने से पहले              |
| `gateway:startup`        | चैनल शुरू होने और Hooks लोड होने के बाद                  |
| `gateway:shutdown`       | Gateway शटडाउन शुरू होने पर                               |
| `gateway:pre-restart`    | अपेक्षित Gateway रीस्टार्ट से पहले                         |
| `message:received`       | किसी भी चैनल से इनबाउंड संदेश                           |
| `message:transcribed`    | ऑडियो ट्रांसक्रिप्शन पूरा होने के बाद                        |
| `message:preprocessed`   | मीडिया और लिंक की प्रीप्रोसेसिंग पूरी होने या छोड़े जाने के बाद |
| `message:sent`           | आउटबाउंड प्रेषण का प्रयास होने पर (`context.success` में परिणाम होता है) |

## Hooks लिखना

### Hook संरचना

प्रत्येक Hook एक डायरेक्टरी होता है जिसमें दो फ़ाइलें होती हैं:

```text
my-hook/
├── HOOK.md          # मेटाडेटा + दस्तावेज़
└── handler.ts       # हैंडलर कार्यान्वयन
```

हैंडलर फ़ाइल `handler.ts`, `handler.js`, `index.ts` या `index.js` हो सकती है।

### HOOK.md प्रारूप

```markdown
---
name: my-hook
description: "यह hook क्या करता है, इसका संक्षिप्त विवरण"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# मेरा Hook

विस्तृत दस्तावेज़ यहाँ दिए जाते हैं।
```

**मेटाडेटा फ़ील्ड** (`metadata.openclaw`):

| फ़ील्ड      | विवरण                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI के लिए प्रदर्शित इमोजी                                |
| `events`   | सुने जाने वाले इवेंट की सरणी                        |
| `export`   | उपयोग किया जाने वाला नामित एक्सपोर्ट (डिफ़ॉल्ट `"default"`)        |
| `os`       | आवश्यक प्लेटफ़ॉर्म (जैसे, `["darwin", "linux"]`)     |
| `requires` | आवश्यक `bins`, `anyBins`, `env` या `config` पाथ |
| `always`   | पात्रता जाँच को बायपास करना (बूलियन)                  |
| `hookKey`  | कॉन्फ़िगरेशन कुंजी ओवरराइड (डिफ़ॉल्ट Hook का नाम)      |
| `homepage` | `openclaw hooks info` द्वारा दिखाई जाने वाली दस्तावेज़ URL              |
| `install`  | इंस्टॉलेशन विधियाँ                                 |

### हैंडलर कार्यान्वयन

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] नया कमांड सक्रिय हुआ`);
  // आपका तर्क यहाँ

  // उत्तर देने योग्य सतहों पर वैकल्पिक रूप से उत्तर भेजें
  event.messages.push("Hook निष्पादित हुआ!");
};

export default handler;
```

प्रत्येक इवेंट में ये शामिल होते हैं: `type`, `action`, `sessionKey`, `timestamp`, `messages` और `context` (इवेंट-विशिष्ट डेटा)। एजेंट और टूल Hooks के लिए टाइप किए गए Plugin Hook संदर्भों में `trace` भी शामिल हो सकता है, जो केवल-पढ़ने योग्य W3C-संगत डायग्नोस्टिक ट्रेस संदर्भ है और जिसे Plugins OTEL सहसंबंध के लिए संरचित लॉग में भेज सकते हैं।

`event.messages` में भेजी गई स्ट्रिंग केवल
`command:new` और `command:reset` के लिए चैट में वापस पहुँचाई जाती हैं (मूल
बातचीत के उत्तर के रूप में रूट की जाती हैं) और `session:compact:before` / `session:compact:after`
के लिए (Compaction स्थिति सूचनाओं के रूप में भेजी जाती हैं)। `command:stop`, `message:*`, `agent:bootstrap`, `session:patch` और
`gateway:*` सहित अन्य सभी इवेंट भेजे गए संदेशों को अनदेखा करते हैं।

### इवेंट संदर्भ की मुख्य बातें

**कमांड इवेंट** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`।

**कमांड इवेंट** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`।

**संदेश इवेंट** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` सहित प्रदाता-विशिष्ट डेटा)। `context.content` कमांड-जैसे संदेशों के लिए पहले गैर-रिक्त कमांड बॉडी को प्राथमिकता देता है, फिर कच्ची इनबाउंड बॉडी और सामान्य बॉडी पर वापस जाता है; इसमें थ्रेड इतिहास या लिंक सारांश जैसे केवल-एजेंट संवर्धन शामिल नहीं होते।

**संदेश इवेंट** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, और प्रेषण विफल होने पर `context.error`।

**संदेश इवेंट** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`।

**संदेश इवेंट** (`message:preprocessed`): `context.bodyForAgent` (अंतिम संवर्धित बॉडी), `context.from`, `context.channelId`।

**बूटस्ट्रैप इवेंट** (`agent:bootstrap`): `context.bootstrapFiles` (परिवर्तनीय सरणी), `context.agentId`।

**सेशन पैच इवेंट** (`session:patch`): `context.sessionEntry`, `context.patch` (केवल बदले हुए फ़ील्ड), `context.cfg`। केवल विशेषाधिकार प्राप्त क्लाइंट ही पैच इवेंट सक्रिय कर सकते हैं; संदर्भ एक क्लोन है, इसलिए हैंडलर लाइव सेशन प्रविष्टि को परिवर्तित नहीं कर सकते।

**Compaction इवेंट**: `session:compact:before` में `messageCount`, `tokenCount` शामिल होते हैं। `session:compact:after` में `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` भी जोड़े जाते हैं।

`command:stop` उपयोगकर्ता द्वारा `/stop` जारी किए जाने को देखता है; यह रद्दीकरण/कमांड
जीवनचक्र है, एजेंट-अंतिमीकरण गेट नहीं। जिन Plugins को किसी
स्वाभाविक अंतिम उत्तर का निरीक्षण करके एजेंट से एक और चरण माँगना हो, उन्हें इसके बजाय टाइप किए गए
Plugin Hook `before_agent_finalize` का उपयोग करना चाहिए। [Plugin Hooks](/hi/plugins/hooks) देखें।

**Gateway जीवनचक्र इवेंट**: `gateway:shutdown` में `reason` और `restartExpectedMs` शामिल होते हैं और यह Gateway शटडाउन शुरू होने पर सक्रिय होता है। `gateway:pre-restart` में समान संदर्भ शामिल होता है, लेकिन यह तभी सक्रिय होता है जब शटडाउन किसी अपेक्षित रीस्टार्ट का हिस्सा हो और सीमित `restartExpectedMs` मान दिया गया हो। शटडाउन के दौरान, प्रत्येक जीवनचक्र Hook की प्रतीक्षा सर्वोत्तम-प्रयास और सीमित होती है, ताकि कोई हैंडलर अटक जाने पर भी शटडाउन जारी रहे। डिफ़ॉल्ट प्रतीक्षा बजट `gateway:shutdown` के लिए 5 सेकंड और `gateway:pre-restart` के लिए 10 सेकंड है।

जब चैनल अभी भी उपलब्ध हों, तब संक्षिप्त रीस्टार्ट सूचनाओं के लिए `gateway:pre-restart` का उपयोग करें:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway लगभग ${restartInSeconds}s में रीस्टार्ट हो रहा है (${event.context.reason})। अभी चेकपॉइंट बनाएँ।`,
  ]);
}
```

`gateway:shutdown` (या `gateway:pre-restart`) इवेंट और शेष शटडाउन क्रम के बीच, Gateway हर उस सेशन के लिए टाइप किया गया `session_end` Plugin Hook भी सक्रिय करता है, जो प्रक्रिया रुकने के समय अभी सक्रिय था। साधारण SIGTERM/SIGINT स्टॉप के लिए इवेंट का `reason`, `shutdown` होता है और अपेक्षित रीस्टार्ट के हिस्से के रूप में क्लोज़ निर्धारित होने पर `restart` होता है। यह ड्रेन सीमित होता है, ताकि धीमा `session_end` हैंडलर प्रक्रिया को बंद होने से न रोक सके, और replace / reset / delete / Compaction के माध्यम से पहले ही अंतिम रूप दिए जा चुके सेशन छोड़ दिए जाते हैं, ताकि दोबारा सक्रिय न हों।

## Hook खोज

Hooks चार स्रोतों से खोजे जाते हैं:

1. **बंडल किए गए Hooks**: OpenClaw के साथ भेजे जाते हैं
2. **Plugin Hooks**: इंस्टॉल किए गए Plugins के भीतर बंडल किए जाते हैं; समान नाम वाले बंडल किए गए Hooks को ओवरराइड कर सकते हैं
3. **प्रबंधित Hooks**: `~/.openclaw/hooks/` (उपयोगकर्ता द्वारा इंस्टॉल किए गए, सभी वर्कस्पेस में साझा); बंडल किए गए और Plugin Hooks को ओवरराइड कर सकते हैं। `hooks.internal.load.extraDirs` की अतिरिक्त डायरेक्टरियाँ समान प्राथमिकता साझा करती हैं।
4. **वर्कस्पेस Hooks**: `<workspace>/hooks/` (प्रति-एजेंट, स्पष्ट रूप से सक्षम किए जाने तक डिफ़ॉल्ट रूप से अक्षम)

Workspace हुक नए हुक नाम जोड़ सकते हैं, लेकिन समान नाम वाले बंडल किए गए, प्रबंधित या Plugin-प्रदत्त हुक को ओवरराइड नहीं कर सकते।

आंतरिक हुक कॉन्फ़िगर होने तक Gateway स्टार्टअप पर आंतरिक हुक खोज को छोड़ देता है। बंडल किए गए या प्रबंधित हुक को `openclaw hooks enable <name>` से सक्षम करें, हुक पैक इंस्टॉल करें या ऑप्ट इन करने के लिए `hooks.internal.enabled=true` सेट करें। जब आप किसी नामित हुक को सक्षम करते हैं, तो Gateway केवल उसी हुक का हैंडलर लोड करता है; `hooks.internal.enabled=true`, अतिरिक्त हुक डायरेक्टरियाँ और लीगेसी हैंडलर व्यापक खोज के लिए ऑप्ट इन करते हैं।

### हुक पैक

हुक पैक ऐसे npm पैकेज हैं जो `package.json` में `openclaw.hooks` के माध्यम से हुक एक्सपोर्ट करते हैं। इससे इंस्टॉल करें:

```bash
openclaw plugins install <path-or-spec>
```

Npm स्पेसिफ़िकेशन केवल रजिस्ट्री के लिए हैं (पैकेज नाम + वैकल्पिक सटीक वर्ज़न या dist-tag)। Git/URL/file स्पेसिफ़िकेशन और semver रेंज अस्वीकार कर दी जाती हैं। पुराने `openclaw hooks install` और `openclaw hooks update` कमांड, `openclaw plugins install` / `openclaw plugins update` के बहिष्कृत उपनाम हैं।

## बंडल किए गए हुक

| हुक                   | इवेंट                                             | यह क्या करता है                                                 |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | सेशन संदर्भ को `<workspace>/memory/` में सहेजता है                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob पैटर्न से अतिरिक्त बूटस्ट्रैप फ़ाइलें इंजेक्ट करता है          |
| command-logger        | `command`                                         | सभी कमांड को `~/.openclaw/logs/commands.log` में लॉग करता है           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | सेशन Compaction शुरू/समाप्त होने पर दृश्यमान चैट सूचनाएँ भेजता है |
| boot-md               | `gateway:startup`                                 | Gateway शुरू होने पर `BOOT.md` चलाता है                         |

किसी भी बंडल किए गए हुक को सक्षम करें:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory का विवरण

अंतिम उपयोगकर्ता/सहायक संदेशों (डिफ़ॉल्ट 15, `hooks.internal.entries.session-memory.messages` से कॉन्फ़िगर करने योग्य) को निकालता है और होस्ट की स्थानीय तारीख का उपयोग करके उन्हें `<workspace>/memory/YYYY-MM-DD-HHMM.md` में सहेजता है। मेमोरी कैप्चर पृष्ठभूमि में चलता है, इसलिए ट्रांसक्रिप्ट पढ़ने या वैकल्पिक स्लग जनरेशन से `/new` और `/reset` की अभिस्वीकृतियों में देरी नहीं होती। वर्णनात्मक फ़ाइलनाम स्लग जनरेट करने के लिए `hooks.internal.entries.session-memory.llmSlug: true` सेट करें और वैकल्पिक रूप से `hooks.internal.entries.session-memory.model` को किसी कॉन्फ़िगर किए गए उपनाम, जैसे `sonnet`, एजेंट के डिफ़ॉल्ट प्रदाता पर एक साधारण मॉडल ID या किसी `provider/model` संदर्भ पर सेट करें। `model` छोड़े जाने पर स्लग जनरेशन एजेंट के डिफ़ॉल्ट मॉडल का उपयोग करता है और अनुपलब्ध होने पर टाइमस्टैम्प स्लग पर वापस जाता है। `workspace.dir` का कॉन्फ़िगर होना आवश्यक है।

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files कॉन्फ़िगरेशन

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

`patterns` और `files` को `paths` के उपनामों के रूप में स्वीकार किया जाता है। पथ Workspace के सापेक्ष रिज़ॉल्व होते हैं और उसके अंदर ही रहने चाहिए। केवल मान्य बूटस्ट्रैप बेसनाम लोड किए जाते हैं (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)।

<a id="command-logger"></a>

### command-logger का विवरण

हर स्लैश कमांड को JSON पंक्ति (टाइमस्टैम्प, क्रिया, सेशन कुंजी, प्रेषक ID, स्रोत) के रूप में `~/.openclaw/logs/commands.log` में लॉग करता है।

<a id="compaction-notifier"></a>

### compaction-notifier का विवरण

जब OpenClaw सेशन ट्रांसक्रिप्ट को कॉम्पैक्ट करना शुरू और समाप्त करता है, तब वर्तमान वार्तालाप में छोटे स्थिति संदेश भेजता है। इससे चैट इंटरफ़ेस पर लंबे टर्न कम भ्रमित करते हैं, क्योंकि उपयोगकर्ता देख सकता है कि सहायक संदर्भ का सारांश बना रहा है और Compaction के बाद जारी रखेगा।

<a id="boot-md"></a>

### boot-md का विवरण

यदि फ़ाइल उस एजेंट के रिज़ॉल्व किए गए Workspace में मौजूद है, तो प्रत्येक कॉन्फ़िगर किए गए एजेंट स्कोप के लिए Gateway स्टार्टअप पर `BOOT.md` चलाता है।

## Plugin हुक

Plugins अधिक गहन एकीकरण के लिए Plugin SDK के माध्यम से टाइप किए गए हुक पंजीकृत कर सकते हैं:
टूल कॉल को इंटरसेप्ट करना, प्रॉम्प्ट संशोधित करना, संदेश प्रवाह नियंत्रित करना और बहुत कुछ।
जब आपको `before_tool_call`, `before_agent_reply`,
`before_install` या अन्य इन-प्रोसेस लाइफ़साइकल हुक की आवश्यकता हो, तब Plugin हुक का उपयोग करें।

Plugin-प्रबंधित आंतरिक हुक अलग होते हैं: वे इस पृष्ठ की
स्थूल कमांड/लाइफ़साइकल इवेंट प्रणाली में भाग लेते हैं और `openclaw hooks list` में
`plugin:<id>` के रूप में दिखाई देते हैं। उनका उपयोग हुक पैक के साथ साइड इफ़ेक्ट और संगतता के लिए करें,
क्रमबद्ध मिडलवेयर या नीति गेट के लिए नहीं।

Plugin हुक का पूरा संदर्भ देखने के लिए [Plugin हुक](/hi/plugins/hooks) देखें।

## कॉन्फ़िगरेशन

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

प्रति-हुक परिवेश मान किसी हुक की `requires.env` पात्रता जाँच (प्रोसेस परिवेश के साथ) को पूरा करते हैं और हैंडलर उन्हें अपनी हुक कॉन्फ़िगरेशन प्रविष्टि से पढ़ सकते हैं:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

अतिरिक्त हुक डायरेक्टरियाँ:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
पश्चगामी संगतता के लिए लीगेसी `hooks.internal.handlers` ऐरे कॉन्फ़िगरेशन प्रारूप अभी भी समर्थित है, लेकिन नए हुक को खोज-आधारित प्रणाली का उपयोग करना चाहिए।
</Note>

## CLI संदर्भ

```bash
# सभी हुक सूचीबद्ध करें (--eligible, --verbose या --json जोड़ें)
openclaw hooks list

# किसी हुक की विस्तृत जानकारी दिखाएँ
openclaw hooks info <hook-name>

# पात्रता सारांश दिखाएँ
openclaw hooks check

# सक्षम/अक्षम करें
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## सर्वोत्तम अभ्यास

- **हैंडलर तेज़ रखें।** हुक कमांड प्रोसेसिंग के दौरान चलते हैं। `void processInBackground(event)` के साथ भारी कार्य को शुरू करके उसके पूरा होने की प्रतीक्षा न करें।
- **त्रुटियों को सुचारु रूप से संभालें।** जोखिमपूर्ण ऑपरेशन को try/catch में लपेटें; अपवाद न फेंकें, ताकि अन्य हैंडलर चल सकें।
- **इवेंट को जल्दी फ़िल्टर करें।** यदि इवेंट प्रकार/क्रिया प्रासंगिक नहीं है, तो तुरंत लौटें।
- **विशिष्ट इवेंट कुंजियों का उपयोग करें।** ओवरहेड कम करने के लिए `"events": ["command"]` के बजाय `"events": ["command:new"]` को प्राथमिकता दें।

## समस्या निवारण

### हुक नहीं मिला

```bash
# डायरेक्टरी संरचना सत्यापित करें
ls -la ~/.openclaw/hooks/my-hook/
# यह दिखना चाहिए: HOOK.md, handler.ts

# खोजे गए सभी हुक सूचीबद्ध करें
openclaw hooks list
```

### हुक पात्र नहीं है

```bash
openclaw hooks info my-hook
```

गुम बाइनरी (PATH), परिवेश चर, कॉन्फ़िगरेशन मान या OS संगतता की जाँच करें।

### हुक निष्पादित नहीं हो रहा

1. सत्यापित करें कि हुक सक्षम है: `openclaw hooks list`
2. हुक फिर से लोड करने के लिए अपनी Gateway प्रोसेस पुनः आरंभ करें।
3. Gateway लॉग जाँचें: `openclaw logs --follow | grep -i hook`

## संबंधित

- [CLI संदर्भ: हुक](/hi/cli/hooks)
- [Webhooks](/hi/automation/cron-jobs#webhooks)
- [Plugin हुक](/hi/plugins/hooks) — इन-प्रोसेस Plugin लाइफ़साइकल हुक
- [कॉन्फ़िगरेशन](/hi/gateway/configuration-reference#hooks)
