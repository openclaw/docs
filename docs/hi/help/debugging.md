---
read_when:
    - आपको reasoning leakage के लिए कच्चे model output की जांच करनी होगी
    - आप पुनरावृत्ति करते समय Gateway को वॉच मोड में चलाना चाहते हैं
    - आपको दोहराने योग्य डिबगिंग वर्कफ़्लो चाहिए
summary: 'डिबगिंग टूल्स: वॉच मोड, रॉ मॉडल स्ट्रीम, और रीजनिंग लीकेज को ट्रेस करना'
title: डीबगिंग
x-i18n:
    generated_at: "2026-06-28T23:15:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

स्ट्रीमिंग आउटपुट के लिए डिबगिंग सहायक, खासकर जब कोई प्रदाता reasoning को सामान्य टेक्स्ट में मिला देता है।

## रनटाइम डिबग ओवरराइड

**केवल-रनटाइम** कॉन्फिग ओवरराइड (मेमरी, डिस्क नहीं) सेट करने के लिए चैट में `/debug` का उपयोग करें।
`/debug` डिफ़ॉल्ट रूप से अक्षम है; इसे `commands.debug: true` से सक्षम करें।
यह तब उपयोगी है जब आपको `openclaw.json` संपादित किए बिना अस्पष्ट सेटिंग्स टॉगल करनी हों।

उदाहरण:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` सभी ओवरराइड साफ़ करता है और ऑन-डिस्क कॉन्फिग पर वापस लौटता है।

## सेशन ट्रेस आउटपुट

जब आप पूर्ण verbose मोड चालू किए बिना एक सेशन में Plugin-स्वामित्व वाली ट्रेस/डिबग लाइनें देखना चाहते हों, तो `/trace` का उपयोग करें।

उदाहरण:

```text
/trace
/trace on
/trace off
```

Active Memory डिबग सारांश जैसे Plugin डायग्नॉस्टिक्स के लिए `/trace` का उपयोग करें।
सामान्य verbose स्थिति/टूल आउटपुट के लिए `/verbose` का उपयोग जारी रखें, और केवल-रनटाइम कॉन्फिग ओवरराइड के लिए `/debug` का उपयोग जारी रखें।

## Plugin लाइफ़साइकल ट्रेस

जब Plugin लाइफ़साइकल कमांड धीमे लगें और आपको Plugin मेटाडेटा, डिस्कवरी, रजिस्ट्री, रनटाइम मिरर, कॉन्फिग म्यूटेशन, और रिफ्रेश काम के लिए बिल्ट-इन चरण विभाजन चाहिए, तो `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` का उपयोग करें। ट्रेस ऑप्ट-इन है और stderr पर लिखता है, इसलिए JSON कमांड आउटपुट पार्स किया जा सकता है।

उदाहरण:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

उदाहरण आउटपुट:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU प्रोफाइलर तक जाने से पहले Plugin लाइफ़साइकल जांच के लिए इसका उपयोग करें।
अगर कमांड किसी सोर्स चेकआउट से चल रहा है, तो `pnpm build` के बाद `node dist/entry.js ...` के साथ बने हुए रनटाइम को मापना बेहतर है; `pnpm openclaw ...` सोर्स-रनर ओवरहेड भी मापता है।

## CLI स्टार्टअप और कमांड प्रोफाइलिंग

जब कोई कमांड धीमा लगे, तो चेक-इन किए गए स्टार्टअप बेंचमार्क का उपयोग करें:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

सामान्य सोर्स रनर के माध्यम से एकबारगी प्रोफाइलिंग के लिए, `OPENCLAW_RUN_NODE_CPU_PROF_DIR` सेट करें:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

सोर्स रनर Node CPU प्रोफाइल फ़्लैग जोड़ता है और कमांड के लिए `.cpuprofile` लिखता है। कमांड कोड में अस्थायी इंस्ट्रूमेंटेशन जोड़ने से पहले इसका उपयोग करें।

ऐसे स्टार्टअप स्टॉल के लिए जो सिंक्रोनस फाइलसिस्टम या मॉड्यूल-लोडर काम जैसे दिखते हैं, सोर्स रनर के माध्यम से Node का sync I/O ट्रेस फ़्लैग जोड़ें:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` देखे जा रहे Gateway चाइल्ड के लिए इस फ़्लैग को डिफ़ॉल्ट रूप से अक्षम रखता है। जब आप watch मोड में स्पष्ट रूप से Node sync I/O ट्रेस आउटपुट चाहते हों, तो `OPENCLAW_TRACE_SYNC_IO=1` सेट करें।

## Gateway watch मोड

तेज़ iteration के लिए, gateway को फ़ाइल watcher के तहत चलाएँ:

```bash
pnpm gateway:watch
```

डिफ़ॉल्ट रूप से, यह `openclaw-gateway-watch-main` नाम का tmux सेशन शुरू या रीस्टार्ट करता है (या `openclaw-gateway-watch-dev-19001` जैसा कोई profile/port-विशिष्ट variant) और interactive terminals से अपने-आप attach होता है। Non-interactive shells, CI, और agent exec calls detached रहते हैं और इसके बजाय attach निर्देश प्रिंट करते हैं। ज़रूरत होने पर मैन्युअल रूप से attach करें:

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane कच्चा watcher चलाता है:

```bash
node scripts/watch-node.mjs gateway --force
```

जब tmux नहीं चाहिए, तो foreground मोड का उपयोग करें:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux प्रबंधन बनाए रखते हुए auto-attach अक्षम करें:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

स्टार्टअप/रनटाइम hotspots डिबग करते समय देखे जा रहे Gateway CPU समय को प्रोफाइल करें:

```bash
pnpm gateway:watch --benchmark
```

watch wrapper Gateway को invoke करने से पहले `--benchmark` consume करता है और `.artifacts/gateway-watch-profiles/` के तहत हर Gateway child exit पर एक V8 `.cpuprofile` लिखता है। वर्तमान प्रोफाइल flush करने के लिए देखे जा रहे gateway को रोकें या रीस्टार्ट करें, फिर उसे Chrome DevTools या Speedscope से खोलें:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

जब आप profiles कहीं और चाहते हों, तो `--benchmark-dir <path>` का उपयोग करें।
जब आप benchmarked child से default `--force` port cleanup छोड़वाना चाहते हों और Gateway port पहले से उपयोग में हो तो जल्दी fail करवाना चाहते हों, तो `--benchmark-no-force` का उपयोग करें।
Benchmark मोड डिफ़ॉल्ट रूप से sync-I/O trace spam को दबा देता है। जब आप स्पष्ट रूप से CPU profiles और Node sync-I/O stack traces दोनों चाहते हों, तो `--benchmark` के साथ `OPENCLAW_TRACE_SYNC_IO=1` सेट करें। benchmark मोड में वे trace blocks benchmark directory के तहत `gateway-watch-output.log` में लिखे जाते हैं और terminal pane से filter किए जाते हैं; सामान्य Gateway logs दिखाई देते रहते हैं।

tmux wrapper सामान्य non-secret runtime selectors जैसे `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT`, और `OPENCLAW_SKIP_CHANNELS` को pane में ले जाता है। Provider credentials को अपनी सामान्य profile/config में रखें, या एकबारगी ephemeral secrets के लिए raw foreground mode का उपयोग करें।
अगर देखा जा रहा Gateway स्टार्टअप के दौरान exit करता है, तो watcher एक बार `openclaw doctor --fix --non-interactive` चलाता है और Gateway child को रीस्टार्ट करता है। जब आप dev-only repair pass के बिना मूल startup failure चाहते हों, तो `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` का उपयोग करें।
Managed tmux pane readability के लिए रंगीन Gateway logs पर भी डिफ़ॉल्ट करता है; ANSI output अक्षम करने के लिए `pnpm gateway:watch` शुरू करते समय `FORCE_COLOR=0` सेट करें।

Watcher `src/` के तहत build-relevant files, extension source files, extension `package.json` और `openclaw.plugin.json` metadata, `tsconfig.json`, `package.json`, और `tsdown.config.ts` पर restart करता है। Extension metadata changes gateway को `tsdown` rebuild force किए बिना restart करते हैं; source और config changes पहले अब भी `dist` rebuild करते हैं।

`gateway:watch` के बाद कोई भी gateway CLI flags जोड़ें और वे हर restart पर pass through किए जाएँगे। वही watch command दोबारा चलाने पर named tmux pane respawn होता है, और raw watcher अब भी अपना single-watcher lock रखता है ताकि duplicate watcher parents piling up होने के बजाय replace हो जाएँ।

## Dev profile + dev gateway (--dev)

debugging के लिए state को isolate करने और safe, disposable setup spin up करने के लिए dev profile का उपयोग करें। **दो** `--dev` flags हैं:

- **Global `--dev` (profile):** state को `~/.openclaw-dev` के तहत isolate करता है और gateway port को `19001` पर default करता है (derived ports इसके साथ shift होते हैं)।
- **`gateway --dev`: Gateway को missing होने पर default config + workspace auto-create करने के लिए कहता है** (और BOOTSTRAP.md छोड़ता है)।

Recommended flow (dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

अगर आपके पास अभी global install नहीं है, तो CLI को `pnpm openclaw ...` के माध्यम से चलाएँ।

यह क्या करता है:

1. **Profile isolation** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas accordingly shift होते हैं)

2. **Dev bootstrap** (`gateway --dev`)
   - missing होने पर minimal config लिखता है (`gateway.mode=local`, bind loopback)।
   - `agent.workspace` को dev workspace पर सेट करता है।
   - `agent.skipBootstrap=true` सेट करता है (कोई BOOTSTRAP.md नहीं)।
   - missing होने पर workspace files seed करता है:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Default identity: **C3-PO** (protocol droid)।
   - dev mode में channel providers छोड़ता है (`OPENCLAW_SKIP_CHANNELS=1`)।

Reset flow (fresh start):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` एक **global** profile flag है और कुछ runners द्वारा consume हो जाता है। अगर आपको इसे स्पष्ट रूप से लिखना हो, तो env var form का उपयोग करें:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` config, credentials, sessions, और dev workspace को wipe करता है (`trash` का उपयोग करके, `rm` नहीं), फिर default dev setup को दोबारा बनाता है।

<Tip>
अगर non-dev gateway पहले से चल रहा है (launchd या systemd), तो पहले उसे रोकें:

```bash
openclaw gateway stop
```

</Tip>

## Raw stream logging (OpenClaw)

OpenClaw किसी भी filtering/formatting से पहले **raw assistant stream** log कर सकता है।
यह देखने का सबसे अच्छा तरीका है कि reasoning plain text deltas के रूप में आ रही है या नहीं (या अलग thinking blocks के रूप में)।

इसे CLI के माध्यम से सक्षम करें:

```bash
pnpm gateway:watch --raw-stream
```

Optional path override:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Equivalent env vars:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Default file:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw OpenAI-compatible chunk logging

Blocks में parse होने से पहले **raw OpenAI-compat chunks** capture करने के लिए, transport logger सक्षम करें:

```bash
OPENCLAW_RAW_STREAM=1
```

Optional path:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Default file:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## सुरक्षा नोट्स

- Raw stream logs में full prompts, tool output, और user data शामिल हो सकते हैं।
- logs को local रखें और debugging के बाद delete करें।
- अगर आप logs share करते हैं, तो पहले secrets और PII scrub करें।

## VSCode में debugging

VSCode-आधारित IDEs में debugging सक्षम करने के लिए source maps आवश्यक हैं क्योंकि generated files में से कई build process के हिस्से के रूप में hashed names के साथ समाप्त होती हैं। शामिल `launch.json` configurations Gateway service को target करती हैं, लेकिन इन्हें अन्य उद्देश्यों के लिए जल्दी adapt किया जा सकता है:

1. **Gateway को rebuild और debug करें** - नया build बनाने के बाद Gateway service debug करता है
2. **Gateway debug करें** - पहले से मौजूद build की Gateway service debug करता है

### Setup

Default **Gateway को rebuild और debug करें** configuration batteries-included है, यह `/dist` folder को automatically delete करेगा और debugging enabled के साथ project को rebuild करेगा:

1. Activity Bar से **Run and Debug** panel खोलें या `Ctrl`+`Shift`+`D` दबाएँ
2. IDE में, सुनिश्चित करें कि configuration dropdown में **Gateway को rebuild और debug करें** selected है और फिर **Start Debugging** button दबाएँ

वैकल्पिक रूप से - अगर आप build और debug processes manually manage करना पसंद करते हैं:

1. terminal खोलें और source maps enable करें:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. उसी terminal में, project rebuild करें: `pnpm clean:dist && pnpm build`
3. IDE में, **Run and Debug** configuration dropdown में **Gateway debug करें** option चुनें और फिर **Start Debugging** button दबाएँ

अब आप अपनी TypeScript source files (`src/` directory) में breakpoints set कर सकते हैं और debugger source maps के माध्यम से breakpoints को compiled JavaScript पर correctly map करेगा। आप variables inspect कर पाएँगे, code में step through कर पाएँगे, और call stacks को अपेक्षित रूप से examine कर पाएँगे।

### नोट्स

- अगर **"Gateway को rebuild और debug करें"** option का उपयोग कर रहे हैं - debugger launch होने पर हर बार यह `/dist` folder को पूरी तरह delete करेगा और Gateway शुरू करने से पहले source maps enabled के साथ full `pnpm build` चलाएगा
- अगर **"Gateway debug करें"** option का उपयोग कर रहे हैं - debug sessions को `/dist` folder को प्रभावित किए बिना कभी भी start और stop किया जा सकता है, लेकिन debugging enable करने और build cycle manage करने दोनों के लिए आपको अलग terminal process का उपयोग करना होगा
- project के अन्य sections debug करने के लिए `args` के लिए `launch.json` settings modify करें
- अगर आपको अन्य tasks के लिए built OpenClaw CLI का उपयोग करना है (यानी अगर आपका debug session नया auth token spawn करता है तो `dashboard --no-open`), तो आप इसे दूसरे terminal में `node ./openclaw.mjs` के रूप में execute कर सकते हैं या `alias openclaw-build="node $(pwd)/openclaw.mjs"` जैसा shell alias बना सकते हैं

## संबंधित

- [समस्या निवारण](/hi/help/troubleshooting)
- [FAQ](/hi/help/faq)
