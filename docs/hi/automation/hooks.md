---
read_when:
    - आप /new, /reset, /stop, और एजेंट लाइफ़साइकल इवेंट्स के लिए इवेंट-संचालित ऑटोमेशन चाहते हैं
    - आप hooks बनाना, इंस्टॉल करना या debug करना चाहते हैं
summary: 'हुक्स: कमांड और जीवनचक्र घटनाओं के लिए इवेंट-संचालित स्वचालन'
title: Hooks
x-i18n:
    generated_at: "2026-06-28T22:32:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

हुक छोटे स्क्रिप्ट होते हैं जो Gateway के अंदर कुछ होने पर चलते हैं। उन्हें डायरेक्टरियों से खोजा जा सकता है और `openclaw hooks` से निरीक्षित किया जा सकता है। Gateway आंतरिक हुक केवल तब लोड करता है जब आप हुक सक्षम करते हैं या कम से कम एक हुक एंट्री, हुक पैक, लेगेसी हैंडलर, या अतिरिक्त हुक डायरेक्टरी कॉन्फ़िगर करते हैं।

OpenClaw में दो प्रकार के हुक होते हैं:

- **आंतरिक हुक** (यह पेज): Gateway के अंदर तब चलते हैं जब एजेंट इवेंट फायर होते हैं, जैसे `/new`, `/reset`, `/stop`, या लाइफ़साइकल इवेंट।
- **Webhooks**: बाहरी HTTP एंडपॉइंट जो अन्य सिस्टमों को OpenClaw में काम ट्रिगर करने देते हैं। देखें [Webhooks](/hi/automation/cron-jobs#webhooks)।

हुक Plugin के अंदर भी बंडल किए जा सकते हैं। `openclaw hooks list` स्टैंडअलोन हुक और Plugin-प्रबंधित हुक, दोनों दिखाता है।

## सही सतह चुनें

OpenClaw में कई एक्सटेंशन सतहें हैं जो समान दिखती हैं लेकिन अलग समस्याएँ हल करती हैं:

| यदि आप चाहते हैं...                                                                                                     | उपयोग करें...                                | क्यों                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/new` पर स्नैपशॉट सहेजना, `/reset` लॉग करना, `message:sent` के बाद बाहरी API कॉल करना, या मोटा ऑपरेटर ऑटोमेशन जोड़ना | आंतरिक हुक (`HOOK.md`, यह पेज) | फ़ाइल-आधारित हुक ऑपरेटर-प्रबंधित साइड इफ़ेक्ट और कमांड/लाइफ़साइकल ऑटोमेशन के लिए हैं |
| प्रॉम्प्ट फिर से लिखना, टूल ब्लॉक करना, आउटबाउंड संदेश रद्द करना, या क्रमबद्ध मिडलवेयर/नीति जोड़ना                              | `api.on(...)` के माध्यम से टाइप्ड Plugin हुक  | टाइप्ड हुक में स्पष्ट कॉन्ट्रैक्ट, प्राथमिकताएँ, मर्ज नियम, और ब्लॉक/रद्द सेमांटिक्स होते हैं      |
| केवल टेलीमेट्री एक्सपोर्ट या ऑब्ज़र्वेबिलिटी जोड़ना                                                                            | डायग्नॉस्टिक इवेंट                     | ऑब्ज़र्वेबिलिटी एक अलग इवेंट बस है, नीति हुक सतह नहीं                              |

जब आप ऐसा ऑटोमेशन चाहते हैं जो छोटे इंस्टॉल किए गए इंटीग्रेशन जैसा व्यवहार करे, तब आंतरिक हुक इस्तेमाल करें। जब आपको रनटाइम लाइफ़साइकल नियंत्रण चाहिए, तब टाइप्ड Plugin हुक इस्तेमाल करें।

## क्विक स्टार्ट

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## इवेंट प्रकार

| इवेंट                    | कब फायर होता है                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` कमांड जारी किया गया                                      |
| `command:reset`          | `/reset` कमांड जारी किया गया                                    |
| `command:stop`           | `/stop` कमांड जारी किया गया                                     |
| `command`                | कोई भी कमांड इवेंट (सामान्य लिस्नर)                       |
| `session:compact:before` | Compaction इतिहास का सारांश बनाने से पहले                       |
| `session:compact:after`  | Compaction पूरी होने के बाद                                 |
| `session:patch`          | जब सेशन प्रॉपर्टियाँ बदली जाती हैं                       |
| `agent:bootstrap`        | वर्कस्पेस बूटस्ट्रैप फ़ाइलें इंजेक्ट होने से पहले              |
| `gateway:startup`        | चैनल शुरू होने और हुक लोड होने के बाद                  |
| `gateway:shutdown`       | जब Gateway शटडाउन शुरू होता है                               |
| `gateway:pre-restart`    | अपेक्षित Gateway रीस्टार्ट से पहले                         |
| `message:received`       | किसी भी चैनल से इनबाउंड संदेश                           |
| `message:transcribed`    | ऑडियो ट्रांसक्रिप्शन पूरा होने के बाद                        |
| `message:preprocessed`   | मीडिया और लिंक प्रीप्रोसेसिंग पूरी होने या स्किप होने के बाद |
| `message:sent`           | आउटबाउंड संदेश डिलीवर हुआ                                 |

## हुक लिखना

### हुक संरचना

हर हुक एक डायरेक्टरी है जिसमें दो फ़ाइलें होती हैं:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md फ़ॉर्मैट

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**मेटाडेटा फ़ील्ड** (`metadata.openclaw`):

| फ़ील्ड      | विवरण                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI के लिए डिस्प्ले इमोजी                                |
| `events`   | सुनने के लिए इवेंट की ऐरे                        |
| `export`   | उपयोग करने के लिए नामित एक्सपोर्ट (डिफ़ॉल्ट `"default"`)        |
| `os`       | आवश्यक प्लेटफ़ॉर्म (जैसे, `["darwin", "linux"]`)     |
| `requires` | आवश्यक `bins`, `anyBins`, `env`, या `config` पाथ |
| `always`   | पात्रता जाँचों को बायपास करें (बूलियन)                  |
| `install`  | इंस्टॉलेशन विधियाँ                                 |

### हैंडलर इम्प्लीमेंटेशन

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

हर इवेंट में शामिल होता है: `type`, `action`, `sessionKey`, `timestamp`, `messages` (केवल जवाब देने योग्य सतहों पर जवाब यहाँ पुश करें), और `context` (इवेंट-विशिष्ट डेटा)। एजेंट और टूल Plugin हुक कॉन्टेक्स्ट में `trace` भी शामिल हो सकता है, एक रीड-ओनली W3C-संगत डायग्नॉस्टिक ट्रेस कॉन्टेक्स्ट जिसे Plugin OTEL सहसंबंध के लिए स्ट्रक्चर्ड लॉग में पास कर सकते हैं।

`event.messages` केवल जवाब देने योग्य सतहों जैसे
`command:*` और `message:received` पर अपने आप डिलीवर किया जाता है। केवल लाइफ़साइकल इवेंट जैसे
`agent:bootstrap`, `session:*`, `gateway:*`, या `message:sent` में
जवाब चैनल नहीं होता और वे पुश किए गए संदेशों को अनदेखा करते हैं।

### इवेंट कॉन्टेक्स्ट हाइलाइट

**कमांड इवेंट** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`।

**संदेश इवेंट** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (प्रोवाइडर-विशिष्ट डेटा जिसमें `senderId`, `senderName`, `guildId` शामिल हैं)। `context.content` कमांड-जैसे संदेशों के लिए गैर-रिक्त कमांड बॉडी को प्राथमिकता देता है, फिर कच्ची इनबाउंड बॉडी और जेनेरिक बॉडी पर वापस जाता है; इसमें एजेंट-ओनली एनरिचमेंट जैसे थ्रेड इतिहास या लिंक सारांश शामिल नहीं होते।

**संदेश इवेंट** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`।

**संदेश इवेंट** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`।

**संदेश इवेंट** (`message:preprocessed`): `context.bodyForAgent` (अंतिम एनरिच्ड बॉडी), `context.from`, `context.channelId`।

**बूटस्ट्रैप इवेंट** (`agent:bootstrap`): `context.bootstrapFiles` (म्यूटेबल ऐरे), `context.agentId`।

**सेशन पैच इवेंट** (`session:patch`): `context.sessionEntry`, `context.patch` (केवल बदले हुए फ़ील्ड), `context.cfg`। केवल विशेषाधिकार प्राप्त क्लाइंट पैच इवेंट ट्रिगर कर सकते हैं।

**Compaction इवेंट**: `session:compact:before` में `messageCount`, `tokenCount` शामिल हैं। `session:compact:after` में `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` जोड़े जाते हैं।

`command:stop` उपयोगकर्ता द्वारा `/stop` जारी करने को देखता है; यह रद्दीकरण/कमांड
लाइफ़साइकल है, एजेंट-फ़ाइनलाइज़ेशन गेट नहीं। जिन Plugin को प्राकृतिक अंतिम उत्तर का निरीक्षण करना हो
और एजेंट से एक और पास माँगना हो, उन्हें इसके बजाय टाइप्ड
Plugin हुक `before_agent_finalize` इस्तेमाल करना चाहिए। देखें [Plugin हुक](/hi/plugins/hooks)।

**Gateway लाइफ़साइकल इवेंट**: `gateway:shutdown` में `reason` और `restartExpectedMs` शामिल होते हैं और Gateway शटडाउन शुरू होने पर फायर होता है। `gateway:pre-restart` में वही कॉन्टेक्स्ट शामिल होता है लेकिन केवल तब फायर होता है जब शटडाउन अपेक्षित रीस्टार्ट का हिस्सा हो और एक सीमित `restartExpectedMs` मान दिया गया हो। शटडाउन के दौरान, हर लाइफ़साइकल हुक प्रतीक्षा बेस्ट-एफ़र्ट और सीमित होती है ताकि हैंडलर रुक जाए तो भी शटडाउन जारी रहे। डिफ़ॉल्ट प्रतीक्षा बजट `gateway:shutdown` के लिए 5 सेकंड और `gateway:pre-restart` के लिए 10 सेकंड है।

जब चैनल अभी भी उपलब्ध हों, छोटे रीस्टार्ट नोटिस के लिए `gateway:pre-restart` इस्तेमाल करें:

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
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

`gateway:shutdown` (या `gateway:pre-restart`) इवेंट और शटडाउन क्रम के बाकी हिस्से के बीच, Gateway हर उस सेशन के लिए एक टाइप्ड `session_end` Plugin हुक भी फायर करता है जो प्रोसेस रुकने के समय अभी भी सक्रिय था। साधारण SIGTERM/SIGINT स्टॉप के लिए इवेंट का `reason` `shutdown` होता है और जब बंद होना अपेक्षित रीस्टार्ट के हिस्से के रूप में शेड्यूल किया गया था तब `restart`। यह ड्रेन सीमित है ताकि धीमा `session_end` हैंडलर प्रोसेस एक्ज़िट को ब्लॉक न कर सके, और जिन सेशन को replace / reset / delete / compaction के माध्यम से पहले ही फ़ाइनलाइज़ किया जा चुका है उन्हें डबल-फायरिंग से बचाने के लिए स्किप किया जाता है।

## हुक खोज

हुक इन डायरेक्टरियों से, बढ़ती ओवरराइड प्राथमिकता के क्रम में, खोजे जाते हैं:

1. **बंडल्ड हुक**: OpenClaw के साथ शिप किए गए
2. **Plugin हुक**: इंस्टॉल किए गए Plugin के अंदर बंडल किए गए हुक
3. **प्रबंधित हुक**: `~/.openclaw/hooks/` (यूज़र-इंस्टॉल्ड, वर्कस्पेसों में साझा)। `hooks.internal.load.extraDirs` से अतिरिक्त डायरेक्टरियाँ इसी प्राथमिकता को साझा करती हैं।
4. **वर्कस्पेस हुक**: `<workspace>/hooks/` (प्रति-एजेंट, स्पष्ट रूप से सक्षम होने तक डिफ़ॉल्ट रूप से अक्षम)

वर्कस्पेस हुक नए हुक नाम जोड़ सकते हैं लेकिन समान नाम वाले बंडल्ड, प्रबंधित, या Plugin-प्रदत्त हुक को ओवरराइड नहीं कर सकते।

Gateway स्टार्टअप पर आंतरिक हुक खोज को तब तक स्किप करता है जब तक आंतरिक हुक कॉन्फ़िगर न हों। बंडल्ड या प्रबंधित हुक को `openclaw hooks enable <name>` से सक्षम करें, हुक पैक इंस्टॉल करें, या ऑप्ट इन करने के लिए `hooks.internal.enabled=true` सेट करें। जब आप एक नामित हुक सक्षम करते हैं, Gateway केवल उस हुक का हैंडलर लोड करता है; `hooks.internal.enabled=true`, अतिरिक्त हुक डायरेक्टरियाँ, और लेगेसी हैंडलर व्यापक खोज में ऑप्ट इन करते हैं।

### हुक पैक

हुक पैक npm पैकेज होते हैं जो `package.json` में `openclaw.hooks` के माध्यम से हुक एक्सपोर्ट करते हैं। इसके साथ इंस्टॉल करें:

```bash
openclaw plugins install <path-or-spec>
```

Npm स्पेक केवल रजिस्ट्री-ओनली हैं (पैकेज नाम + वैकल्पिक सटीक वर्शन या dist-tag)। Git/URL/फ़ाइल स्पेक और semver रेंज अस्वीकार किए जाते हैं।

## बंडल्ड हुक

| हुक                  | इवेंट्स                                            | यह क्या करता है                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | सत्र संदर्भ को `<workspace>/memory/` में सहेजता है                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | glob पैटर्न से अतिरिक्त bootstrap फाइलें इंजेक्ट करता है          |
| command-logger        | `command`                                         | सभी कमांड को `~/.openclaw/logs/commands.log` में लॉग करता है           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | सत्र Compaction शुरू/समाप्त होने पर दिखाई देने वाली चैट सूचनाएं भेजता है |
| boot-md               | `gateway:startup`                                 | Gateway शुरू होने पर `BOOT.md` चलाता है                         |

किसी भी bundled हुक को सक्षम करें:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory विवरण

अंतिम 15 उपयोगकर्ता/सहायक संदेश निकालता है और होस्ट की स्थानीय तारीख का उपयोग करके `<workspace>/memory/YYYY-MM-DD-HHMM.md` में सहेजता है। मेमोरी कैप्चर पृष्ठभूमि में चलता है, ताकि `/new` और `/reset` स्वीकृतियां transcript पढ़ने या वैकल्पिक slug जनरेशन से विलंबित न हों। कॉन्फिगर किए गए मॉडल के साथ वर्णनात्मक filename slugs बनाने के लिए `hooks.internal.entries.session-memory.llmSlug: true` सेट करें। `workspace.dir` कॉन्फिगर होना आवश्यक है।

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files कॉन्फिगरेशन

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

Paths workspace के सापेक्ष resolve होते हैं। केवल पहचाने गए bootstrap basenames लोड किए जाते हैं (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)।

<a id="command-logger"></a>

### command-logger विवरण

हर slash command को `~/.openclaw/logs/commands.log` में लॉग करता है।

<a id="compaction-notifier"></a>

### compaction-notifier विवरण

जब OpenClaw सत्र transcript को compact करना शुरू और पूरा करता है, तो वर्तमान बातचीत में छोटे status संदेश भेजता है। इससे chat surfaces पर लंबे turns कम भ्रमित करते हैं, क्योंकि उपयोगकर्ता देख सकता है कि सहायक संदर्भ का सारांश बना रहा है और Compaction के बाद जारी रखेगा।

<a id="boot-md"></a>

### boot-md विवरण

Gateway शुरू होने पर सक्रिय workspace से `BOOT.md` चलाता है।

## Plugin हुक्स

Plugins गहरे integration के लिए Plugin SDK के माध्यम से typed hooks रजिस्टर कर सकते हैं:
tool calls को intercept करना, prompts को modify करना, message flow को control करना, और भी बहुत कुछ।
जब आपको `before_tool_call`, `before_agent_reply`,
`before_install`, या अन्य in-process lifecycle hooks की जरूरत हो, तो plugin hooks का उपयोग करें।

Plugin-managed internal hooks अलग होते हैं: वे इस पेज के
coarse command/lifecycle event system में भाग लेते हैं और `openclaw hooks list` में
`plugin:<id>` के रूप में दिखाई देते हैं। इन्हें side effects और hook packs के साथ compatibility के लिए उपयोग करें, ordered middleware या policy gates के लिए नहीं।

पूर्ण plugin hook reference के लिए, [Plugin hooks](/hi/plugins/hooks) देखें।

## कॉन्फिगरेशन

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

प्रति-हुक environment variables:

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

अतिरिक्त hook directories:

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
पुराना `hooks.internal.handlers` array config format अभी भी backwards compatibility के लिए समर्थित है, लेकिन नए hooks को discovery-based system का उपयोग करना चाहिए।
</Note>

## CLI संदर्भ

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## श्रेष्ठ अभ्यास

- **Handlers तेज रखें।** Hooks command processing के दौरान चलते हैं। भारी काम को `void processInBackground(event)` के साथ fire-and-forget करें।
- **Errors को सहजता से handle करें।** जोखिम भरे operations को try/catch में wrap करें; throw न करें ताकि अन्य handlers चल सकें।
- **Events को जल्दी filter करें।** यदि event type/action प्रासंगिक नहीं है, तो तुरंत return करें।
- **विशिष्ट event keys का उपयोग करें।** overhead कम करने के लिए `"events": ["command"]` के बजाय `"events": ["command:new"]` को प्राथमिकता दें।

## समस्या निवारण

### Hook discover नहीं हुआ

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook eligible नहीं है

```bash
openclaw hooks info my-hook
```

गुम binaries (PATH), environment variables, config values, या OS compatibility की जांच करें।

### Hook execute नहीं हो रहा है

1. पुष्टि करें कि hook enabled है: `openclaw hooks list`
2. अपना Gateway process restart करें ताकि hooks reload हों।
3. Gateway logs जांचें: `./scripts/clawlog.sh | grep hook`

## संबंधित

- [CLI संदर्भ: hooks](/hi/cli/hooks)
- [Webhooks](/hi/automation/cron-jobs#webhooks)
- [Plugin hooks](/hi/plugins/hooks) — in-process plugin lifecycle hooks
- [कॉन्फिगरेशन](/hi/gateway/configuration-reference#hooks)
