---
read_when:
    - रीज़निंग लीक के लिए आपको अपरिष्कृत मॉडल आउटपुट का निरीक्षण करना होगा
    - आप पुनरावृत्तियाँ करते समय Gateway को वॉच मोड में चलाना चाहते हैं
    - आपको दोहराने योग्य डीबगिंग कार्यप्रवाह की आवश्यकता है
summary: 'डीबगिंग टूल: वॉच मोड, रॉ मॉडल स्ट्रीम और रीजनिंग लीक का ट्रेसिंग'
title: डीबगिंग
x-i18n:
    generated_at: "2026-07-19T08:53:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc06b15958dc4a7607a9bce98794e61d82bba42fd943419cd00ca8bceef0b7c4
    source_path: help/debugging.md
    workflow: 16
---

स्ट्रीमिंग आउटपुट, Gateway पुनरावृत्ति और स्टार्टअप प्रोफ़ाइलिंग के लिए डीबगिंग सहायक।

## रनटाइम डीबग ओवरराइड

`/debug` **केवल-रनटाइम** कॉन्फ़िगरेशन ओवरराइड (मेमोरी में, डिस्क पर नहीं) सेट करता है। डिफ़ॉल्ट रूप से अक्षम; `commands.debug: true` से सक्षम करें।

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` सभी ओवरराइड साफ़ करता है और डिस्क पर मौजूद कॉन्फ़िगरेशन पर वापस लौटता है।

## सेशन ट्रेस आउटपुट

`/trace` पूर्ण वर्बोज़ मोड सक्षम किए बिना एक सेशन के लिए Plugin के स्वामित्व वाली ट्रेस/डीबग पंक्तियाँ दिखाता है। Active Memory डीबग सारांश जैसे Plugin निदान के लिए इसका उपयोग करें; सामान्य स्थिति/टूल आउटपुट के लिए `/verbose` का उपयोग करें।

```text
/trace
/trace on
/trace off
```

## Plugin जीवनचक्र ट्रेस

Plugin मेटाडेटा, खोज, रजिस्ट्री, रनटाइम मिरर, कॉन्फ़िगरेशन परिवर्तन और रीफ़्रेश कार्य के चरण-दर-चरण विश्लेषण के लिए `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` सेट करें। यह stderr पर लिखता है, इसलिए JSON कमांड आउटपुट पार्स करने योग्य रहता है।
इस ट्रेस के सक्षम होने पर Plugin लोड विफलताओं में उनका स्टैक ट्रेस शामिल होता है।

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU प्रोफ़ाइलर का सहारा लेने से पहले इसका उपयोग करें। स्रोत चेकआउट से, `pnpm build` के बाद `node dist/entry.js ...` से निर्मित रनटाइम को मापें; `pnpm openclaw ...` स्रोत-रनर ओवरहेड को भी मापता है।

सिंक्रोनस मॉड्यूल-लोड समय के लिए, अलग केवल-Plugin एनवायरनमेंट स्विच के बजाय साझा निदान सतह का उपयोग करें:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## CLI स्टार्टअप और कमांड प्रोफ़ाइलिंग

रिपॉज़िटरी में सम्मिलित स्टार्टअप बेंचमार्क:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

सामान्य स्रोत रनर के माध्यम से एकबारगी प्रोफ़ाइलिंग के लिए `OPENCLAW_RUN_NODE_CPU_PROF_DIR` सेट करें:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

स्रोत रनर Node CPU प्रोफ़ाइल फ़्लैग जोड़ता है और कमांड के लिए एक `.cpuprofile` लिखता है। कमांड कोड में अस्थायी इंस्ट्रूमेंटेशन जोड़ने से पहले इसका उपयोग करें।

सिंक्रोनस फ़ाइल-सिस्टम या मॉड्यूल-लोडर कार्य जैसी दिखाई देने वाली स्टार्टअप रुकावटों के लिए, स्रोत रनर के माध्यम से Node का सिंक I/O ट्रेस फ़्लैग जोड़ें:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` निगरानी किए जा रहे Gateway चाइल्ड के लिए इस फ़्लैग को डिफ़ॉल्ट रूप से अक्षम रखता है; वॉच मोड में भी सिंक I/O ट्रेस आउटपुट चाहिए तो `OPENCLAW_TRACE_SYNC_IO=1` सेट करें।

## Gateway वॉच मोड

```bash
pnpm gateway:watch
```

डिफ़ॉल्ट रूप से यह `openclaw-gateway-watch-<profile>` नामक tmux सेशन शुरू या पुनः आरंभ करता है (उदाहरण के लिए `openclaw-gateway-watch-main`), जिसमें `openclaw-gateway-watch-dev-19001` जैसा पोर्ट प्रत्यय केवल तभी जोड़ा जाता है जब `OPENCLAW_GATEWAY_PORT` डिफ़ॉल्ट पोर्ट `18789` से अलग हो। यह इंटरैक्टिव टर्मिनलों से स्वतः अटैच होता है; गैर-इंटरैक्टिव शेल, CI और एजेंट exec कॉल अलग रहते हैं और इसके बजाय अटैच करने के निर्देश प्रिंट करते हैं:

```bash
tmux attach -t openclaw-gateway-watch-main
# अटैच किए बिना हाल का आउटपुट पढ़ें
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

पेन tmux `remain-on-exit` का उपयोग करता है, इसलिए स्टार्टअप विफलताएँ सेशन को हटाने के बजाय अटैच या कैप्चर करने के लिए उपलब्ध रहती हैं। `pnpm gateway:watch` को दोबारा चलाने पर वह पेन फिर से स्पॉन होता है।

tmux पेन सीधे वॉचर चलाता है:

```bash
node scripts/watch-node.mjs gateway --force
```

कॉन्फ़िगर किए गए/डिफ़ॉल्ट पोर्ट की निगरानी करने से पहले, tmux रैपर सक्रिय प्रोफ़ाइल की इंस्टॉल की गई Gateway सेवा रोकता है। इससे launchd, systemd या Scheduled Task द्वारा दोबारा स्पॉन होकर उसे प्रतिस्थापित किए बिना पोर्ट स्रोत वॉचर को मिल जाता है। सेवा इंस्टॉल रहती है; वॉच सेशन के बाद इसे इससे पुनर्स्थापित करें:

```bash
pnpm openclaw gateway start
```

जब स्पष्ट `--port` या `OPENCLAW_GATEWAY_PORT` इंस्टॉल की गई सेवा के प्रभावी पोर्ट से अलग होता है, तो रैपर सेवा को चालू छोड़ देता है ताकि दोनों Gateway साथ-साथ चल सकें।

tmux के बिना फ़ोरग्राउंड मोड:

```bash
pnpm gateway:watch:raw
# या
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

रॉ मोड इंस्टॉल की गई सेवा को प्रबंधित नहीं करता। यदि वह समान पोर्ट का उपयोग करती है, तो पहले `pnpm openclaw gateway stop` चलाएँ।

tmux प्रबंधन बनाए रखें लेकिन स्वतः-अटैच अक्षम करें:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

स्टार्टअप/रनटाइम हॉटस्पॉट डीबग करते समय निगरानी किए जा रहे Gateway के CPU समय की प्रोफ़ाइल बनाएँ:

```bash
pnpm gateway:watch --benchmark
```

वॉच रैपर Gateway को शुरू करने से पहले `--benchmark` का उपयोग करता है और `.artifacts/gateway-watch-profiles/` के अंतर्गत प्रत्येक Gateway चाइल्ड निकास पर एक V8 `.cpuprofile` लिखता है। वर्तमान प्रोफ़ाइल को फ़्लश करने के लिए निगरानी किए जा रहे Gateway को रोकें या पुनः आरंभ करें, फिर इसे Chrome DevTools या Speedscope से खोलें:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: प्रोफ़ाइल कहीं और लिखें।
- `--benchmark-no-force`: डिफ़ॉल्ट `--force` पोर्ट क्लीनअप छोड़ें और Gateway पोर्ट पहले से उपयोग में होने पर तुरंत विफल हों।

बेंचमार्क मोड डिफ़ॉल्ट रूप से सिंक-I/O ट्रेस स्पैम दबाता है। CPU प्रोफ़ाइल और सिंक-I/O स्टैक ट्रेस दोनों पाने के लिए `--benchmark` के साथ `OPENCLAW_TRACE_SYNC_IO=1` सेट करें; बेंचमार्क मोड में वे ट्रेस ब्लॉक बेंचमार्क डायरेक्टरी के अंतर्गत `gateway-watch-output.log` में जाते हैं (टर्मिनल पेन से फ़िल्टर किए जाते हैं), जबकि सामान्य Gateway लॉग दिखाई देते रहते हैं।

tmux रैपर सामान्य गैर-गोपनीय रनटाइम चयनकर्ताओं को पेन में ले जाता है, जिनमें `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` और `OPENCLAW_SKIP_CHANNELS` शामिल हैं। प्रदाता क्रेडेंशियल अपने सामान्य प्रोफ़ाइल/कॉन्फ़िगरेशन में रखें या एकबारगी अस्थायी सीक्रेट के लिए रॉ फ़ोरग्राउंड मोड का उपयोग करें।

यदि निगरानी किया जा रहा Gateway स्टार्टअप के दौरान बंद हो जाता है, तो वॉचर `openclaw doctor --fix --non-interactive` को एक बार चलाता है और Gateway चाइल्ड को पुनः आरंभ करता है। केवल-विकास सुधार चरण के बिना मूल स्टार्टअप विफलता देखने के लिए `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` सेट करें।

प्रबंधित tmux पेन में डिफ़ॉल्ट रूप से रंगीन Gateway लॉग होते हैं; ANSI आउटपुट अक्षम करने के लिए `pnpm gateway:watch` शुरू करते समय `FORCE_COLOR=0` सेट करें।

वॉचर `src/` के अंतर्गत बिल्ड-संबंधित फ़ाइलों, एक्सटेंशन स्रोत फ़ाइलों, एक्सटेंशन `package.json` और `openclaw.plugin.json` मेटाडेटा, `tsconfig.json`, `package.json` और `tsdown.config.ts` में बदलाव होने पर पुनः आरंभ होता है। एक्सटेंशन मेटाडेटा बदलाव बिल्ड को बाध्य किए बिना Gateway को पुनः आरंभ करते हैं; स्रोत और कॉन्फ़िगरेशन बदलाव अब भी पहले `dist` को फिर से बिल्ड करते हैं।

`gateway:watch` के बाद Gateway CLI फ़्लैग जोड़ें और वे प्रत्येक पुनः आरंभ पर आगे भेजे जाते हैं। समान वॉच कमांड को दोबारा चलाने पर नामित tmux पेन फिर से स्पॉन होता है; रॉ वॉचर एकल-वॉचर लॉक बनाए रखता है, ताकि डुप्लिकेट वॉचर पैरेंट जमा होने के बजाय प्रतिस्थापित हो जाएँ।

## विकास प्रोफ़ाइल + विकास Gateway (--dev)

दो **अलग** `--dev` फ़्लैग:

- **वैश्विक `--dev` (प्रोफ़ाइल):** स्थिति को `~/.openclaw-dev` के अंतर्गत अलग करता है और Gateway पोर्ट को डिफ़ॉल्ट रूप से `19001` पर सेट करता है (व्युत्पन्न पोर्ट भी इसके साथ बदलते हैं)।
- **`gateway --dev`:** Gateway को अनुपस्थित होने पर डिफ़ॉल्ट कॉन्फ़िगरेशन + कार्यक्षेत्र स्वतः बनाने (और बूटस्ट्रैप छोड़ने) का निर्देश देता है।

अनुशंसित प्रवाह (विकास प्रोफ़ाइल + विकास बूटस्ट्रैप):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

वैश्विक इंस्टॉल के बिना CLI को `pnpm openclaw ...` के माध्यम से चलाएँ।

यह क्या करता है:

1. **प्रोफ़ाइल पृथक्करण** (वैश्विक `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (ब्राउज़र/कैनवस पोर्ट तदनुसार बदलते हैं)

2. **विकास बूटस्ट्रैप** (`gateway --dev`)
   - अनुपस्थित होने पर न्यूनतम कॉन्फ़िगरेशन लिखता है (`gateway.mode=local`, लूपबैक से बाइंड)।
   - `agents.defaults.workspace` को विकास कार्यक्षेत्र और `agents.defaults.skipBootstrap=true` पर सेट करता है।
   - अनुपस्थित होने पर कार्यक्षेत्र फ़ाइलों को आरंभिक सामग्री देता है: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`।
   - डिफ़ॉल्ट पहचान: **C3-PO** (प्रोटोकॉल ड्रॉइड)।
   - `pnpm gateway:dev` चैनल प्रदाताओं को छोड़ने के लिए `OPENCLAW_SKIP_CHANNELS=1` भी सेट करता है।

रीसेट प्रवाह (नए सिरे से शुरुआत):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` एक **वैश्विक** प्रोफ़ाइल फ़्लैग है और कुछ रनर इसे हटा देते हैं। यदि आपको इसे स्पष्ट रूप से लिखना हो, तो एनवायरनमेंट वेरिएबल रूप का उपयोग करें:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` कॉन्फ़िगरेशन, क्रेडेंशियल, सेशन और विकास कार्यक्षेत्र को साफ़ करता है (ट्रैश में ले जाया जाता है, हटाया नहीं जाता), फिर डिफ़ॉल्ट विकास सेटअप फिर से बनाता है।

<Tip>
यदि कोई गैर-विकास Gateway पहले से चल रहा है (launchd या systemd), तो पहले उसे रोकें:

```bash
openclaw gateway stop
```

</Tip>

## रॉ स्ट्रीम लॉगिंग

OpenClaw किसी भी फ़िल्टरिंग/फ़ॉर्मैटिंग से पहले **रॉ सहायक स्ट्रीम** लॉग कर सकता है। यह देखने का सबसे अच्छा तरीका है कि रीजनिंग सामान्य टेक्स्ट डेल्टा के रूप में आ रही है या अलग विचार ब्लॉक के रूप में।

इसे CLI के माध्यम से सक्षम करें:

```bash
pnpm gateway:watch --raw-stream
```

वैकल्पिक पथ ओवरराइड:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

समकक्ष एनवायरनमेंट वेरिएबल:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

डिफ़ॉल्ट फ़ाइल: `~/.openclaw/logs/raw-stream.jsonl`

## सुरक्षा संबंधी टिप्पणियाँ

- रॉ स्ट्रीम लॉग में पूरे प्रॉम्प्ट, टूल आउटपुट और उपयोगकर्ता डेटा शामिल हो सकते हैं।
- लॉग स्थानीय रखें और डीबगिंग के बाद उन्हें हटा दें।
- यदि आप लॉग साझा करते हैं, तो पहले सीक्रेट और PII हटा दें।

## VSCode में डीबगिंग

स्रोत मैप आवश्यक हैं क्योंकि बिल्ड जनरेट किए गए फ़ाइल नामों को हैश करता है। सम्मिलित `launch.json` Gateway सेवा को लक्षित करता है:

1. **Rebuild and Debug Gateway** - Gateway शुरू करने से पहले `/dist` हटाता है और डीबगिंग सक्षम करके पुनः बिल्ड करता है।
2. **Debug Gateway** - `/dist` को बदले बिना मौजूदा बिल्ड को डीबग करता है।

### सेटअप

1. **Run and Debug** खोलें (Activity Bar या `Ctrl`+`Shift`+`D`)।
2. **Rebuild and Debug Gateway** चुनें और **Start Debugging** दबाएँ।

इसके बजाय बिल्ड/डीबग चक्र को मैन्युअल रूप से प्रबंधित करने के लिए:

1. टर्मिनल में स्रोत मैप सक्षम करें:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. पुनः बिल्ड करें: `pnpm clean:dist && pnpm build`
3. **Debug Gateway** चुनें और **Start Debugging** दबाएँ।

`src/` TypeScript फ़ाइलों में ब्रेकपॉइंट सेट करें; डीबगर स्रोत मैप के माध्यम से उन्हें संकलित JavaScript से मैप करता है।

### टिप्पणियाँ

- **Rebuild and Debug Gateway** `/dist` हटाता है और प्रत्येक लॉन्च पर स्रोत मैप के साथ पूर्ण `pnpm build` चलाता है।
- **Debug Gateway** `/dist` को प्रभावित किए बिना शुरू/बंद हो सकता है, लेकिन बिल्ड चक्र को आप अलग टर्मिनल में प्रबंधित करते हैं।
- अन्य CLI उपकमांड डीबग करने के लिए `launch.json` `args` संपादित करें।
- अन्य कार्यों के लिए निर्मित CLI का उपयोग करने हेतु (उदाहरण के लिए, यदि आपका डीबग सेशन नया प्रमाणीकरण टोकन स्पॉन करता है तो `dashboard --no-open`), इसे किसी अन्य टर्मिनल से चलाएँ: `node ./openclaw.mjs` या `alias openclaw-build="node $(pwd)/openclaw.mjs"` जैसा उपनाम।

## संबंधित

- [समस्या निवारण](/hi/help/troubleshooting)
- [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)
