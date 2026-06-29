---
read_when:
    - आप किसी स्रोत चेकआउट को सुरक्षित रूप से अपडेट करना चाहते हैं
    - आप `openclaw update` आउटपुट या विकल्पों को डीबग कर रहे हैं
    - आपको `--update` शॉर्टहैंड व्यवहार समझना होगा
summary: '`openclaw update` के लिए CLI संदर्भ (काफी सुरक्षित स्रोत अपडेट + Gateway का स्वचालित पुनरारंभ)'
title: अपडेट
x-i18n:
    generated_at: "2026-06-28T22:54:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw को सुरक्षित रूप से अपडेट करें और stable/beta/dev चैनलों के बीच स्विच करें।

अगर आपने **npm/pnpm/bun** के जरिए इंस्टॉल किया है (global install, कोई git metadata नहीं),
तो अपडेट [Updating](/hi/install/updating) में दिए package-manager flow के जरिए होते हैं।

## उपयोग

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## विकल्प

- `--no-restart`: सफल अपडेट के बाद Gateway सेवा को दोबारा शुरू करना छोड़ें। Gateway को दोबारा शुरू करने वाले package-manager अपडेट, command के सफल होने से पहले सत्यापित करते हैं कि दोबारा शुरू की गई सेवा अपेक्षित अपडेटेड version रिपोर्ट कर रही है।
- `--channel <stable|beta|dev>`: अपडेट चैनल सेट करें (git + npm; config में कायम रखा जाता है)।
- `--tag <dist-tag|version|spec>`: केवल इस अपडेट के लिए package target को override करें। Package installs के लिए, `main` `github:openclaw/openclaw#main` पर map होता है; GitHub/git source specs को staged global npm install से पहले अस्थायी tarball में pack किया जाता है।
- `--dry-run`: config लिखे बिना, install किए बिना, plugins sync किए बिना, या restart किए बिना नियोजित update actions (channel/tag/target/restart flow) का preview करें।
- `--json`: machine-readable `UpdateRunResult` JSON print करें, जिसमें
  `postUpdate.plugins.warnings` शामिल होता है जब core update सफल होने के बाद corrupt या unloadable managed plugins को
  repair की जरूरत होती है, beta-channel plugin fallback details
  जब किसी plugin की beta release नहीं होती, और `postUpdate.plugins.integrityDrifts`
  जब post-update plugin sync के दौरान npm plugin artifact drift detected होता है।
- `--timeout <seconds>`: प्रत्येक step का timeout (default 1800s है)।
- `--yes`: confirmation prompts छोड़ें (उदाहरण के लिए downgrade confirmation)।
- `--acknowledge-clawhub-risk`: community ClawHub trust
  warnings की समीक्षा के बाद, post-update plugin sync को interactive
  prompt के बिना जारी रखने दें। इसके बिना, risky community ClawHub plugin releases skip कर दी जाती हैं और
  जब OpenClaw prompt नहीं कर सकता तो unchanged छोड़ दी जाती हैं। Official ClawHub packages और
  bundled OpenClaw plugin sources इस release-trust prompt को bypass करते हैं।

`openclaw update` में `--verbose` flag नहीं है। नियोजित
channel/tag/install/restart actions का preview करने के लिए `--dry-run`, machine-readable
results के लिए `--json`, और जब आपको केवल channel और
availability details चाहिए हों तो `openclaw update status --json` का उपयोग करें। अगर आप update के आसपास Gateway logs debug कर रहे हैं,
तो console verbosity और file log level अलग हैं: Gateway `--verbose`
terminal/WebSocket output को प्रभावित करता है, जबकि file logs के लिए config में `logging.level: "debug"` या
`"trace"` चाहिए। [Gateway logging](/hi/gateway/logging) देखें।

<Note>
Nix mode (`OPENCLAW_NIX_MODE=1`) में, mutating `openclaw update` runs disabled हैं। इसके बजाय इस install के लिए Nix source या flake input update करें; nix-openclaw के लिए agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) का उपयोग करें। `openclaw update status` और `openclaw update --dry-run` read-only बने रहते हैं।
</Note>

<Warning>
Downgrades के लिए confirmation चाहिए क्योंकि पुराने versions configuration तोड़ सकते हैं।
</Warning>

## `update status`

Active update channel + git tag/branch/SHA (source checkouts के लिए), और update availability दिखाएं।

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

विकल्प:

- `--json`: machine-readable status JSON print करें।
- `--timeout <seconds>`: checks के लिए timeout (default 3s है)।

## `update repair`

Core package पहले ही बदल चुका हो लेकिन बाद का
repair work साफ़ तौर पर finish न हुआ हो, तो update finalization दोबारा चलाएं। यह supported recovery path है जब
`openclaw update` ने नया core package install कर दिया हो लेकिन post-core plugin sync,
managed npm plugin metadata, registry refresh, या doctor repair को अभी भी
converge होना हो।

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

विकल्प:

- `--channel <stable|beta|dev>`: repair से पहले update channel persist करें और
  उस channel के विरुद्ध plugin convergence चलाएं।
- `--json`: machine-readable finalization JSON print करें।
- `--timeout <seconds>`: repair steps के लिए timeout (default `1800`)।
- `--yes`: confirmation prompts छोड़ें।
- `--acknowledge-clawhub-risk`: community ClawHub trust
  warnings की समीक्षा के बाद, repair-time plugin convergence को
  interactive prompt के बिना जारी रखने दें। Official ClawHub packages और bundled OpenClaw plugin
  sources इस release-trust prompt को bypass करते हैं।
- `--no-restart`: update command parity के लिए accepted है; repair Gateway को कभी restart नहीं करता।

`openclaw update repair` `openclaw doctor --fix` चलाता है, repaired
config और install records reload करता है, active update channel के लिए tracked plugins sync करता है,
managed npm plugin installs update करता है, missing configured plugin payloads repair करता है,
plugin registry refresh करता है, और converged install-record metadata लिखता है।
यह नया core package install नहीं करता और Gateway को restart नहीं करता।

## `update wizard`

Update channel चुनने और update के बाद Gateway को restart करना है या नहीं इसकी पुष्टि करने के लिए interactive flow
(default restart करना है)। अगर आप git checkout के बिना `dev` चुनते हैं, तो यह
एक बनाने की पेशकश करता है।

विकल्प:

- `--timeout <seconds>`: हर update step के लिए timeout (default `1800`)

## यह क्या करता है

जब आप channels को स्पष्ट रूप से switch करते हैं (`--channel ...`), OpenClaw
install method को भी aligned रखता है:

- `dev` → git checkout सुनिश्चित करता है (default: `~/openclaw`, या
  `OPENCLAW_HOME` set होने पर `$OPENCLAW_HOME/openclaw`;
  `OPENCLAW_GIT_DIR` से override करें),
  उसे update करता है, और उस checkout से global CLI install करता है।
- `stable` → `latest` का उपयोग करके npm से install करता है।
- `beta` → npm dist-tag `beta` को prefer करता है, लेकिन जब beta
  missing हो या current stable release से पुराना हो तो `latest` पर fall back करता है।

Gateway core auto-updater (जब config के जरिए enabled हो) live Gateway request handler के बाहर
CLI update path launch करता है। Control-plane `update.run`
package-manager updates और supervised git-checkout updates भी live Gateway process के अंदर package tree replace करने या
`dist/` rebuild करने के बजाय
managed-service handoff का उपयोग करते हैं। Gateway detached helper शुरू करता है,
exit करता है, और helper Gateway process tree के बाहर से normal `openclaw update --yes --json` CLI path चलाता है।
अगर वह handoff unavailable हो, तो
`update.run` manually चलाने के लिए safe shell command के साथ structured response return करता है।

Package-manager installs के लिए, `openclaw update` package manager invoke करने से पहले target package
version resolve करता है। npm global installs staged
install का उपयोग करते हैं: OpenClaw नए package को temporary npm prefix में install करता है, वहां packaged `dist` inventory verify करता है,
फिर उस clean package tree को real global prefix में swap करता है।
अगर verification fail होती है, तो post-update doctor, plugin sync, और
restart work suspect tree से नहीं चलते। जब installed version
पहले से target से match करता हो, तब भी command global package install refresh करता है,
फिर plugin sync, core-command completion refresh, और restart work चलाता है। इससे
packaged sidecars और channel-owned plugin records installed OpenClaw build के साथ aligned रहते हैं,
जबकि full plugin-command completion rebuilds को explicit `openclaw completion --write-state` runs के लिए छोड़ा जाता है।

जब local managed Gateway service installed हो और restart enabled हो,
तो package-manager और git-checkout updates package tree replace करने या checkout/build output mutate करने से पहले
running service को stop करते हैं। फिर updater
updated install से service metadata refresh करता है, service restart करता है,
और `Gateway: restarted and verified.` report करने से पहले restarted Gateway verify करता है। Package-manager updates अतिरिक्त रूप से verify करते हैं
कि restarted Gateway expected package version report करता है; git-checkout updates
rebuild के बाद gateway health और service readiness verify करते हैं। macOS पर,
post-update check active profile के लिए LaunchAgent loaded/running है और configured loopback port healthy है, यह भी verify करता है। अगर plist installed है
लेकिन launchd उसे supervise नहीं कर रहा, तो OpenClaw LaunchAgent को
automatically re-bootstrap करता है, फिर health/version/channel readiness checks दोबारा चलाता है। Fresh
bootstrap RunAtLoad job को directly load करता है, इसलिए update recovery
नई spawned Gateway को तुरंत `kickstart -k` नहीं करता। अगर Gateway फिर भी
healthy नहीं होता, तो command non-zero exit करता है और restart log path
साथ में explicit restart, reinstall, और package rollback instructions print करता है। अगर restart
नहीं चल सकता, तो command manual `openclaw gateway restart` hint के साथ `Gateway: restart skipped (...)` या
`Gateway: restart failed: ...` print करता है।
`--no-restart` के साथ, package replacement या git rebuild फिर भी चलता है लेकिन
managed service stop या restart नहीं की जाती, इसलिए running Gateway में old
code तब तक रह सकता है जब तक आप उसे manually restart न करें।

### Control-plane response shape

जब `update.run` Gateway control plane के जरिए
package-manager install या supervised git checkout पर invoke होता है, तो handler
Gateway exit के बाद जारी रहने वाले CLI update से handoff initiation को अलग report करता है:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"`, और
  `handoff.status: "started"` का अर्थ है कि Gateway ने managed-service
  handoff बनाया और अपना restart schedule किया ताकि detached helper
  live service process के बाहर `openclaw update --yes --json` चला सके।
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"`, और
  `handoff.status: "unavailable"` का अर्थ है कि OpenClaw safe handoff के लिए supervising
  service boundary और durable service identity नहीं ढूंढ सका। उदाहरण के लिए,
  systemd handoff को OpenClaw unit identity
  (`OPENCLAW_SYSTEMD_UNIT`) चाहिए, केवल ambient systemd process markers नहीं। Response में
  `handoff.command` शामिल होता है, Gateway के बाहर से चलाने के लिए shell command।
- `ok: false`, `result.reason: "managed-service-handoff-failed"` का अर्थ है कि
  Gateway ने handoff बनाने की कोशिश की लेकिन detached helper spawn नहीं कर सका।

`sentinel` payload Gateway exit से पहले अब भी लिखा जाता है, और CLI
handoff managed-service restart health checks complete होने के बाद उसी restart sentinel को update करता है।
Handoff के दौरान, sentinel
`stats.reason: "restart-health-pending"` carry कर सकता है जिसमें कोई success continuation नहीं होता; restarted Gateway उसे polling करता रहता है और continuation केवल तब fire करता है जब CLI
ने service health verify करके final `ok`
result के साथ sentinel rewrite कर दिया हो। `openclaw status` और `openclaw status --all` उस sentinel के pending या failed होने पर `Update restart`
row दिखाते हैं, और `update.status` latest sentinel refresh करके
return करता है।

## Git checkout flow

### Channel selection

- `stable`: latest non-beta tag checkout करें, फिर build और doctor करें।
- `beta`: latest `-beta` tag prefer करें, लेकिन beta missing या older होने पर latest stable tag पर fall back करें।
- `dev`: `main` checkout करें, फिर fetch और rebase करें।

### Update steps

<Steps>
  <Step title="साफ़ कार्य-वृक्ष सत्यापित करें">
    बिना किसी अपुष्ट बदलाव के होना आवश्यक है।
  </Step>
  <Step title="चैनल बदलें">
    चयनित चैनल (टैग या ब्रांच) पर स्विच करता है।
  </Step>
  <Step title="अपस्ट्रीम फ़ेच करें">
    केवल विकास के लिए।
  </Step>
  <Step title="पूर्व-जांच बिल्ड (केवल विकास)">
    अस्थायी कार्य-वृक्ष में TypeScript बिल्ड चलाता है। यदि टिप विफल होती है, तो नवीनतम बिल्ड-योग्य कमिट खोजने के लिए 10 कमिट तक पीछे जाता है। इस पूर्व-जांच के दौरान lint भी चलाने के लिए `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` सेट करें; lint सीमित सीरियल मोड में चलता है क्योंकि उपयोगकर्ता अपडेट होस्ट अक्सर CI रनर से छोटे होते हैं।
  </Step>
  <Step title="रीबेस">
    चयनित कमिट पर रीबेस करता है (केवल विकास)।
  </Step>
  <Step title="निर्भरताएँ इंस्टॉल करें">
    रिपॉजिटरी पैकेज मैनेजर का उपयोग करता है। pnpm चेकआउट के लिए, अपडेटर pnpm कार्यक्षेत्र के अंदर `npm run build` चलाने के बजाय आवश्यकता पड़ने पर `pnpm` को बूटस्ट्रैप करता है (पहले `corepack` के माध्यम से, फिर अस्थायी `npm install pnpm@11` फ़ॉलबैक से)।
  </Step>
  <Step title="Control UI बिल्ड करें">
    Gateway और Control UI को बिल्ड करता है।
  </Step>
  <Step title="doctor चलाएँ">
    अंतिम सुरक्षित-अपडेट जाँच के रूप में `openclaw doctor` चलता है।
  </Step>
  <Step title="Plugins सिंक करें">
    Plugins को सक्रिय चैनल से सिंक करता है। विकास में बंडल किए गए Plugins का उपयोग होता है; stable और beta npm का उपयोग करते हैं। ट्रैक किए गए Plugin इंस्टॉल अपडेट करता है।
  </Step>
</Steps>

beta अपडेट चैनल पर, डिफ़ॉल्ट/latest लाइन का अनुसरण करने वाले ट्रैक किए गए npm और ClawHub Plugin इंस्टॉल पहले Plugin `@beta` रिलीज़ आज़माते हैं। यदि Plugin की कोई beta रिलीज़ नहीं है, तो OpenClaw दर्ज किए गए डिफ़ॉल्ट/latest spec पर वापस जाता है और उसे चेतावनी के रूप में रिपोर्ट करता है। npm Plugins के लिए, OpenClaw तब भी वापस जाता है जब beta पैकेज मौजूद हो लेकिन इंस्टॉल सत्यापन में विफल हो जाए। ये Plugin फ़ॉलबैक चेतावनियाँ कोर अपडेट को विफल नहीं करतीं। सटीक संस्करण और स्पष्ट टैग फिर से नहीं लिखे जाते।

<Warning>
यदि कोई सटीक पिन किया गया npm Plugin अपडेट ऐसे आर्टिफ़ैक्ट पर रिज़ॉल्व होता है जिसकी अखंडता संग्रहीत इंस्टॉल रिकॉर्ड से अलग है, तो `openclaw update` उसे इंस्टॉल करने के बजाय उस Plugin आर्टिफ़ैक्ट अपडेट को रोक देता है। नए आर्टिफ़ैक्ट पर भरोसा होने की पुष्टि करने के बाद ही Plugin को स्पष्ट रूप से फिर से इंस्टॉल या अपडेट करें।
</Warning>

<Note>
अपडेट के बाद की Plugin सिंक विफलताएँ, जो किसी प्रबंधित Plugin तक सीमित हैं और जिन्हें सिंक पथ बायपास कर सकता है (उदाहरण के लिए, किसी गैर-आवश्यक Plugin के लिए अप्राप्य npm registry), कोर अपडेट सफल होने के बाद चेतावनियों के रूप में रिपोर्ट की जाती हैं। JSON परिणाम शीर्ष-स्तरीय अपडेट `status: "ok"` रखता है और `openclaw update repair` तथा `openclaw plugins inspect <id> --runtime --json` मार्गदर्शन के साथ `postUpdate.plugins.status: "warning"` रिपोर्ट करता है। अनपेक्षित अपडेटर या सिंक अपवाद अब भी अपडेट परिणाम को विफल करते हैं। Plugin इंस्टॉल या अपडेट त्रुटि ठीक करें, फिर `openclaw update repair` दोबारा चलाएँ।

प्रति-Plugin सिंक चरण के बाद, `openclaw update` Gateway को फिर से शुरू करने से पहले अनिवार्य **पोस्ट-कोर convergence** पास चलाता है: यह गायब कॉन्फ़िगर किए गए Plugin payloads की मरम्मत करता है, डिस्क पर हर _सक्रिय_ ट्रैक किए गए इंस्टॉल रिकॉर्ड को सत्यापित करता है, और स्थिर रूप से जाँचता है कि उसका `package.json` parse किया जा सकता है (और कोई स्पष्ट रूप से घोषित `main` मौजूद है)। इस पास से आई विफलताएँ — और अमान्य OpenClaw config snapshot — `postUpdate.plugins.status: "error"` लौटाती हैं और शीर्ष-स्तरीय अपडेट `status` को `"error"` में बदल देती हैं, इसलिए `openclaw update` non-zero के साथ बाहर निकलता है और Gateway को असत्यापित Plugin सेट के साथ फिर से शुरू _नहीं_ किया जाता। त्रुटि में संरचित `postUpdate.plugins.warnings[].guidance` पंक्तियाँ शामिल होती हैं, जो आगे की कार्रवाई के लिए `openclaw update repair` और `openclaw plugins inspect <id> --runtime --json` की ओर संकेत करती हैं। Disabled Plugin entries और ऐसे records जो trusted-source-linked official sync targets नहीं हैं, यहाँ छोड़ दिए जाते हैं, ठीक उसी तरह जैसे missing-payload check द्वारा उपयोग की गई `skipDisabledPlugins` नीति में होता है, इसलिए कोई stale disabled Plugin record अन्यथा मान्य अपडेट को रोक नहीं सकता।

जब अपडेट किया गया Gateway शुरू होता है, Plugin लोडिंग केवल सत्यापन के लिए होती है: startup package managers नहीं चलाता और dependency trees को mutate नहीं करता। Package-manager `update.run` restarts CLI managed-service path को सौंपे जाते हैं, इसलिए package swap पुराने Gateway process के बाहर होता है और service health checks तय करते हैं कि अपडेट को complete के रूप में report किया जा सकता है या नहीं।

यदि pnpm bootstrap फिर भी विफल होता है, तो updater checkout के अंदर `npm run build` आज़माने के बजाय package-manager-specific error के साथ जल्दी रुक जाता है।
</Note>

## `--update` संक्षिप्त रूप

`openclaw --update` को `openclaw update` में फिर से लिखा जाता है (shells और launcher scripts के लिए उपयोगी)।

## संबंधित

- `openclaw doctor` (git checkouts पर पहले update चलाने का प्रस्ताव देता है)
- [विकास चैनल](/hi/install/development-channels)
- [अपडेट करना](/hi/install/updating)
- [CLI संदर्भ](/hi/cli)
