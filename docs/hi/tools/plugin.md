---
doc-schema-version: 1
read_when:
    - Plugin इंस्टॉल या कॉन्फ़िगर करना
    - Plugin खोज और लोड नियमों को समझना
    - Codex/Claude-संगत Plugin बंडल के साथ काम करना
sidebarTitle: Getting Started
summary: OpenClaw Plugins इंस्टॉल, कॉन्फ़िगर और प्रबंधित करें
title: Plugins
x-i18n:
    generated_at: "2026-06-29T00:23:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugins OpenClaw को channels, model providers, agent harnesses, tools,
skills, speech, realtime transcription, voice, media understanding, generation,
web fetch, web search, और अन्य runtime क्षमताओं से विस्तारित करते हैं।

इस पृष्ठ का उपयोग तब करें जब आप कोई Plugin इंस्टॉल करना चाहते हों, Gateway को restart करना चाहते हों, यह सत्यापित करना चाहते हों
कि runtime ने उसे load किया है, और सामान्य setup विफलताओं को route करना चाहते हों। केवल-command
उदाहरणों के लिए, [Plugins प्रबंधित करें](/hi/plugins/manage-plugins) देखें। bundled, official external, और source-only plugins की पूरी generated
inventory के लिए,
[Plugin inventory](/hi/plugins/plugin-inventory) देखें।

## आवश्यकताएँ

Plugin इंस्टॉल करने से पहले, सुनिश्चित करें कि आपके पास:

- `openclaw` CLI उपलब्ध होने के साथ OpenClaw checkout या installation हो
- चयनित source तक network access हो, जैसे ClawHub, npm, या git host
- उस plugin के setup docs में बताए गए plugin-specific credentials, config keys, या operating-system tools हों
- आपके channels को serve करने वाले Gateway को reload या restart करने की अनुमति हो

## त्वरित शुरुआत

<Steps>
  <Step title="Plugin खोजें">
    public plugin packages के लिए [ClawHub](/hi/clawhub) खोजें:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub community plugins के लिए प्राथमिक discovery surface है। launch cutover के दौरान,
    ordinary bare package specs अब भी npm से install होते हैं, जब तक
    वे किसी official plugin id से match न करें। Raw `@openclaw/*` package specs जो
    bundled plugins से match करते हैं, current OpenClaw build से bundled copy का उपयोग करते हैं। जब आपको एक
    source चाहिए तो explicit prefix का उपयोग करें।

  </Step>

  <Step title="Plugin इंस्टॉल करें">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    plugin installs को code चलाने जैसा मानें। जब आपको reproducible production installs चाहिए हों,
    pinned versions को प्राथमिकता दें।

  </Step>

  <Step title="Configure और enable करें">
    `plugins.entries.<id>.config` के अंतर्गत plugin-specific settings configure करें।
    Plugin को enable करें जब वह पहले से enabled न हो:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    यदि आपका config restrictive `plugins.allow` list का उपयोग करता है, तो installed plugin
    id plugin load होने से पहले वहाँ मौजूद होना चाहिए।
    `openclaw plugins install` installed id को मौजूदा
    `plugins.allow` list में जोड़ता है और वही id `plugins.deny` से हटाता है ताकि
    explicit install restart के बाद load हो सके।

  </Step>

  <Step title="Gateway को reload होने दें">
    Plugin code install, update, या uninstall करने के लिए Gateway
    restart आवश्यक है। जब managed Gateway पहले से config reload
    enabled के साथ running हो, OpenClaw बदले हुए plugin install record का पता लगाता है और
    Gateway को automatically restart करता है। यदि Gateway managed नहीं है या reload disabled है,
    तो उसे स्वयं restart करें:

    ```bash
    openclaw gateway restart
    ```

    Enable और disable operations config update करते हैं और cold registry refresh करते हैं।
    live runtime surfaces के लिए runtime inspect अब भी सबसे स्पष्ट verification path है।

  </Step>

  <Step title="Runtime registration सत्यापित करें">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    जब आपको registered tools, hooks, services,
    Gateway methods, या plugin-owned CLI commands साबित करने हों, तो `--runtime` का उपयोग करें। Plain `inspect` cold
    manifest और registry check है।

  </Step>
</Steps>

## Configuration

### Install source चुनें

| Source      | कब उपयोग करें                                                                       | Example                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | आप OpenClaw-native discovery, scans, version metadata, और install hints चाहते हैं | `openclaw plugins install clawhub:<package>`                   |
| npm         | आपको direct npm registry या dist-tag workflows चाहिए                             | `openclaw plugins install npm:<package>`                       |
| git         | आपको repository से branch, tag, या commit चाहिए                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| local path  | आप उसी machine पर plugin develop या test कर रहे हैं                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | आप Claude-compatible marketplace plugin install कर रहे हैं                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Bare package specs में special compatibility behavior होता है। यदि bare name
bundled plugin id से match करता है, OpenClaw उस bundled source का उपयोग करता है। यदि यह
official external plugin id से match करता है, OpenClaw official package catalog का उपयोग करता है। अन्य
ordinary bare package specs launch cutover के दौरान npm के माध्यम से install होते हैं। Raw
`@openclaw/*` package specs जो bundled plugins से match करते हैं, वे भी
npm fallback से पहले bundled copy पर resolve होते हैं। जब
आप सचमुच image-owned bundled copy के बजाय external npm package चाहते हों, तो `npm:@openclaw/<plugin>@<version>` का उपयोग करें।
जब आपको deterministic source selection चाहिए हो, तो `clawhub:`, `npm:`, `git:`, या `npm-pack:` का उपयोग करें।
पूर्ण command contract के लिए [`openclaw plugins`](/hi/cli/plugins#install)
देखें।

npm installs के लिए, unpinned package specs और `@latest` सबसे नया stable
package चुनते हैं जो इस OpenClaw build के साथ compatibility advertise करता है। यदि npm की
current latest release नया `openclaw.compat.pluginApi` या
`openclaw.install.minHostVersion` declare करती है, OpenClaw पुराने stable package versions scan करता है
और सबसे नया उपयुक्त version install करता है। Exact versions और explicit channel tags
जैसे `@beta` selected package पर pinned रहते हैं और incompatible होने पर fail होते हैं।

### Operator install policy

Plugin install या update आगे बढ़ने से पहले trusted local policy command चलाने के लिए
`security.installPolicy` configure करें। Policy metadata और staged
source path receive करती है और install को allow या block कर सकती है। यह CLI और Gateway-backed
plugin install/update paths को cover करती है। Plugin `before_install` hooks बाद में केवल उन
OpenClaw processes में run होते हैं जहाँ plugin hooks loaded हैं, इसलिए operator-owned install decisions के लिए `security.installPolicy`
का उपयोग करें। Deprecated
`--dangerously-force-unsafe-install` flag compatibility के लिए accepted है लेकिन
install policy या OpenClaw की built-in plugin dependency denylist को bypass नहीं करता।

Skills और
plugins दोनों द्वारा उपयोग किए जाने वाले shared `security.installPolicy` exec schema के लिए [Skills config](/hi/tools/skills-config#operator-install-policy-securityinstallpolicy)
देखें।

### Plugin policy configure करें

सामान्य plugin config shape है:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

मुख्य policy rules:

- `plugins.enabled: false` सभी plugins को disable करता है और plugin discovery/load
  work skip करता है। जब यह active हो, stale plugin references inert रहते हैं; stale ids हटवाने के लिए doctor cleanup चलाने से पहले
  plugins को re-enable करें।
- `plugins.deny` allow और per-plugin enablement पर प्राथमिकता रखता है।
- `plugins.allow` एक exclusive allowlist है। Allowlist के बाहर plugin-owned tools
  unavailable रहते हैं, भले ही `tools.allow` में `"*"` शामिल हो।
- `plugins.entries.<id>.enabled: false` एक plugin को disable करता है और उसका
  config preserve रखता है।
- `plugins.load.paths` explicit local plugin files या directories जोड़ता है। Managed
  `plugins install` local paths plugin directories या archives होने चाहिए; standalone plugin files के लिए
  `plugins.load.paths` का उपयोग करें।
- Workspace-origin plugins default रूप से disabled होते हैं; local workspace code का उपयोग करने से पहले उन्हें explicitly enable या
  allowlist करें।
- Bundled plugins अपने built-in default-on/default-off metadata का पालन करते हैं, जब तक
  config उन्हें explicitly override न करे।
- `plugins.slots.<slot>` memory और context engines जैसी exclusive categories के लिए
  एक plugin चुनता है। Slot selection selected plugin को उस slot के लिए explicit activation के रूप में count करके force-enable करता है; वह तब भी load हो सकता है जब वह
  otherwise opt-in होता। `plugins.deny` और
  `plugins.entries.<id>.enabled: false` फिर भी उसे block करते हैं।
- Bundled opt-in plugins तब auto-activate हो सकते हैं जब config उनकी owned
  surfaces में से किसी एक का नाम देता है, जैसे provider/model ref, channel config, CLI backend, या agent
  harness runtime।
- OpenAI-family Codex routing provider और runtime plugin boundaries को
  अलग रखती है: legacy Codex model refs legacy config हैं जिन्हें doctor repair करता है, जबकि bundled
  `codex` plugin canonical `openai/*` agent
  refs, explicit `agentRuntime.id: "codex"`, और legacy `codex/*` refs के लिए Codex app-server runtime own करता है।

जब `plugins.allow` unset हो और non-bundled plugins workspace या global plugin roots से auto-discovered हों,
startup logs
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` दिखाते हैं।
Warning में discovered plugin ids शामिल होते हैं और, short lists के लिए, minimal
`plugins.allow` snippet भी। Trusted plugins को `openclaw.json` में copy करने से पहले
listed plugin id के साथ
[`openclaw plugins list --enabled --verbose`](/hi/cli/plugins#list) या
[`openclaw plugins inspect <id>`](/hi/cli/plugins#inspect) run करें। वही trust-pinning
guidance तब लागू होती है जब diagnostics कहें कि कोई plugin
`without install/load-path provenance` loaded हुआ: उस plugin id को inspect करें, फिर
trusted id को `plugins.allow` में pin करें या trusted source से reinstall करें ताकि OpenClaw
install provenance record करे।

जब config validation stale plugin ids, allowlist/tool mismatches, या legacy bundled plugin paths report करे,
तो `openclaw doctor` या `openclaw doctor --fix` run करें।

## Plugin formats समझें

OpenClaw दो plugin formats पहचानता है:

| Format                 | कैसे load होता है                                                                 | कब उपयोग करें                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Native OpenClaw plugin | `openclaw.plugin.json` plus process में loaded runtime module               | आप OpenClaw-specific runtime capabilities install या build कर रहे हैं  |
| Compatible bundle      | Codex, Claude, या Cursor plugin layout OpenClaw plugin inventory में mapped | आप compatible skills, commands, hooks, या bundle metadata reuse कर रहे हैं |

दोनों formats `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable`, और `openclaw plugins disable` में दिखाई देते हैं। Bundle compatibility boundary के लिए
[Plugin bundles](/hi/plugins/bundles) और native plugin authoring के लिए
[Building plugins](/hi/plugins/building-plugins) देखें।

## Plugin hooks

Plugins runtime पर hooks register कर सकते हैं, लेकिन अलग-अलग jobs वाली दो अलग APIs हैं।

- Runtime lifecycle hooks के लिए `api.on(...)` के माध्यम से typed hooks का उपयोग करें। यह
  middleware, policy, message rewriting, prompt shaping,
  और tool control के लिए preferred surface है।
- `api.registerHook(...)` का उपयोग केवल तब करें जब आप [Hooks](/hi/automation/hooks) में वर्णित internal
  hook system में participate करना चाहते हों। यह मुख्य रूप से coarse
  command/lifecycle side effects और existing HOOK-style
  automation के साथ compatibility के लिए है।

त्वरित rule:

- यदि handler को priority, merge semantics, या block/cancel behavior चाहिए, तो
  typed plugin hooks का उपयोग करें।
- यदि handler केवल `command:new`, `command:reset`, `message:sent`,
  या समान coarse events पर react करता है, तो `api.registerHook(...)` ठीक है।

Plugin-managed internal hooks `openclaw hooks list` में
`plugin:<id>` के साथ दिखाई देते हैं। आप उन्हें `openclaw hooks` के माध्यम से enable या disable नहीं कर सकते;
इसके बजाय plugin को enable या disable करें।

## Active Gateway सत्यापित करें

`openclaw plugins list` और साधारण `openclaw plugins inspect` कोल्ड कॉन्फ़िगरेशन,
मैनिफ़ेस्ट, और रजिस्ट्री स्थिति पढ़ते हैं। वे यह सिद्ध नहीं करते कि पहले से चल रहे Gateway
ने वही Plugin कोड आयात किया है।

जब कोई Plugin इंस्टॉल दिखता है लेकिन लाइव चैट ट्रैफ़िक उसका उपयोग नहीं करता:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

प्रबंधित Gateway, Plugin इंस्टॉल, अपडेट, और अनइंस्टॉल में हुए ऐसे बदलावों के बाद
अपने-आप रीस्टार्ट होते हैं जो Plugin स्रोत बदलते हैं। VPS या कंटेनर इंस्टॉल पर, सुनिश्चित करें
कि कोई भी मैन्युअल रीस्टार्ट उस वास्तविक `openclaw gateway run` चाइल्ड को लक्षित करे जो
आपके चैनलों को सेवा देता है, केवल किसी wrapper या supervisor को नहीं।

## समस्या निवारण

| लक्षण                                                        | जांच                                                                                                                                      | समाधान                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin `plugins list` में दिखता है लेकिन रनटाइम हुक नहीं चलते  | `openclaw plugins inspect <id> --runtime --json` का उपयोग करें और `gateway status --deep --require-rpc` से सक्रिय Gateway की पुष्टि करें             | इंस्टॉल, अपडेट, कॉन्फ़िगरेशन, या स्रोत बदलावों के बाद लाइव Gateway रीस्टार्ट करें                               |
| डुप्लिकेट चैनल या टूल स्वामित्व डायग्नॉस्टिक दिखाई देते हैं         | `openclaw plugins list --enabled --verbose` चलाएं, प्रत्येक संदिग्ध Plugin को `--runtime --json` से देखें, और चैनल/टूल स्वामित्व की तुलना करें | एक स्वामी अक्षम करें, पुराने इंस्टॉल हटाएं, या जानबूझकर प्रतिस्थापन के लिए मैनिफ़ेस्ट `preferOver` का उपयोग करें      |
| कॉन्फ़िगरेशन कहता है कि कोई Plugin गुम है                                | [Plugin इन्वेंटरी](/hi/plugins/plugin-inventory) देखें कि वह bundled, आधिकारिक external, या केवल स्रोत वाला है या नहीं                           | external पैकेज इंस्टॉल करें, bundled Plugin सक्षम करें, या पुराना कॉन्फ़िगरेशन हटाएं                         |
| इंस्टॉल के दौरान कॉन्फ़िगरेशन अमान्य है                               | वैलिडेशन संदेश पढ़ें और जब वह पुराने Plugin state की ओर संकेत करे तो `openclaw doctor --fix` चलाएं                                           | Doctor entry को अक्षम करके और अमान्य payload हटाकर अमान्य Plugin कॉन्फ़िगरेशन को quarantine कर सकता है     |
| संदिग्ध स्वामित्व या permissions के लिए Plugin path ब्लॉक है | कॉन्फ़िगरेशन त्रुटि से पहले डायग्नॉस्टिक देखें                                                                                             | फ़ाइल-सिस्टम स्वामित्व/permissions ठीक करें, फिर `openclaw plugins registry --refresh` चलाएं                    |
| `OPENCLAW_NIX_MODE=1` lifecycle commands को ब्लॉक करता है                | पुष्टि करें कि इंस्टॉल Nix द्वारा प्रबंधित है                                                                                                      | Plugin mutator commands का उपयोग करने के बजाय Nix स्रोत में Plugin चयन बदलें                      |
| रनटाइम पर dependency import विफल होता है                             | जांचें कि Plugin npm/git/ClawHub के ज़रिए इंस्टॉल किया गया था या local path से लोड हुआ था                                                 | `openclaw plugins update <id>` चलाएं, स्रोत फिर से इंस्टॉल करें, या local Plugin dependencies स्वयं इंस्टॉल करें |

जब पुराना Plugin कॉन्फ़िगरेशन अब खोज में न आने वाले चैनल Plugin का नाम अब भी रखता है,
तो Gateway startup हर दूसरे चैनल को ब्लॉक करने के बजाय उस Plugin-backed चैनल को छोड़ देता है।
पुरानी Plugin और चैनल entries हटाने के लिए `openclaw doctor --fix` चलाएं। पुराने-Plugin प्रमाण के बिना
अज्ञात चैनल keys अब भी वैलिडेशन विफल करते हैं ताकि typos दिखाई देते रहें।

जानबूझकर चैनल प्रतिस्थापन के लिए, पसंदीदा Plugin को legacy या कम-priority
Plugin id के साथ `channelConfigs.<channel-id>.preferOver` घोषित करना चाहिए। यदि दोनों Plugin स्पष्ट रूप से
सक्षम हैं, तो OpenClaw उस अनुरोध को रखता है और चुपचाप एक स्वामी चुनने के बजाय
डुप्लिकेट चैनल या टूल डायग्नॉस्टिक रिपोर्ट करता है।

यदि कोई इंस्टॉल किया गया पैकेज बताता है कि उसे `requires compiled runtime output for
TypeScript entry ...`, तो पैकेज OpenClaw को रनटाइम पर चाहिए JavaScript फ़ाइलों के बिना प्रकाशित हुआ था।
publisher द्वारा compiled JavaScript भेजने के बाद अपडेट या फिर से इंस्टॉल करें, या तब तक Plugin को अक्षम/अनइंस्टॉल करें।

### ब्लॉक किया गया Plugin path ownership

यदि Plugin डायग्नॉस्टिक कहता है
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
और कॉन्फ़िगरेशन वैलिडेशन में `plugin present but blocked` आता है, तो OpenClaw को
ऐसी Plugin फ़ाइलें मिलीं जिनका स्वामी उस प्रक्रिया से अलग Unix user है जो उन्हें लोड कर रही है।
Plugin कॉन्फ़िगरेशन को यथास्थान रखें; फ़ाइल-सिस्टम स्वामित्व ठीक करें या
OpenClaw को उसी user के रूप में चलाएं जिसके पास state directory का स्वामित्व है।

Docker इंस्टॉल के लिए, आधिकारिक image `node` (uid `1000`) के रूप में चलती है, इसलिए
host bind-mounted OpenClaw कॉन्फ़िगरेशन और workspace directories सामान्यतः
uid `1000` के स्वामित्व में होनी चाहिए:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

यदि आप जानबूझकर OpenClaw को root के रूप में चलाते हैं, तो managed Plugin root को
इसके बजाय root स्वामित्व में सुधारें:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

स्वामित्व ठीक करने के बाद, `openclaw doctor --fix` या
`openclaw plugins registry --refresh` फिर से चलाएं ताकि persisted Plugin registry
सुधारी गई फ़ाइलों से मेल खाए।

### धीमा Plugin tool setup

यदि agent turns tools तैयार करते समय रुकते हुए दिखते हैं, तो trace logging सक्षम करें और
Plugin tool factory timing lines जांचें:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

यह खोजें:

```text
[trace:plugin-tools] factory timings ...
```

सारांश कुल factory समय और सबसे धीमी Plugin tool factories सूचीबद्ध करता है,
जिसमें Plugin id, घोषित tool names, result shape, और tool optional है या नहीं शामिल होते हैं।
जब एक factory कम से कम 1s लेती है या कुल Plugin tool factory prep कम से कम 5s लेता है,
तो धीमी lines को warnings में promote किया जाता है।

OpenClaw समान effective request context के साथ दोहराए गए resolutions के लिए सफल
Plugin tool factory results को cache करता है। cache key में effective runtime config,
workspace, agent/session ids, sandbox policy, browser settings, delivery context,
requester identity, और ownership state शामिल होते हैं, इसलिए उन trusted fields पर निर्भर factories
context बदलने पर फिर से चलाई जाती हैं। यदि timings ऊंची रहती हैं, तो Plugin अपने tool
definitions लौटाने से पहले महंगा काम कर रहा हो सकता है।

यदि एक Plugin timing पर हावी है, तो उसके runtime registrations देखें:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

फिर उस Plugin को अपडेट, फिर से इंस्टॉल, या अक्षम करें। Plugin authors को expensive dependency loading
को tool factory के अंदर करने के बजाय tool execution path के पीछे ले जाना चाहिए।

dependency roots, package metadata validation, registry records, startup
reload behavior, और legacy cleanup के लिए,
[Plugin dependency resolution](/hi/plugins/dependency-resolution) देखें।

## संबंधित

- [Plugins प्रबंधित करें](/hi/plugins/manage-plugins) - list, install, update, uninstall, और publish के लिए command examples
- [`openclaw plugins`](/hi/cli/plugins) - पूरा CLI reference
- [Plugin इन्वेंटरी](/hi/plugins/plugin-inventory) - generated bundled और external Plugin सूची
- [Plugin reference](/hi/plugins/reference) - generated per-Plugin reference pages
- [Community plugins](/hi/plugins/community) - ClawHub discovery और docs PR policy
- [Plugin dependency resolution](/hi/plugins/dependency-resolution) - install roots, registry records, और runtime boundaries
- [Building plugins](/hi/plugins/building-plugins) - native Plugin authoring guide
- [Plugin SDK overview](/hi/plugins/sdk-overview) - runtime registration, hooks, और API fields
- [Plugin manifest](/hi/plugins/manifest) - manifest और package metadata
