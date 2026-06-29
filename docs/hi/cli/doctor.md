---
read_when:
    - आपको कनेक्टिविटी/प्रमाणीकरण संबंधी समस्याएँ हैं और निर्देशित सुधार चाहते हैं
    - आपने अपडेट किया है और एक त्वरित जांच चाहते हैं
summary: '`openclaw doctor` के लिए CLI संदर्भ (स्वास्थ्य जांच + निर्देशित सुधार)'
title: डॉक्टर
x-i18n:
    generated_at: "2026-06-28T22:49:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway और चैनलों के लिए स्वास्थ्य जांचें + त्वरित सुधार।

संबंधित:

- समस्या निवारण: [समस्या निवारण](/hi/gateway/troubleshooting)
- सुरक्षा ऑडिट: [सुरक्षा](/hi/gateway/security)

## इसका उपयोग क्यों करें

`openclaw doctor` OpenClaw की स्वास्थ्य सतह है। इसका उपयोग तब करें जब Gateway,
चैनल, Plugin, Skills, मॉडल रूटिंग, स्थानीय स्थिति, या कॉन्फ़िग माइग्रेशन
अपेक्षा के अनुसार व्यवहार नहीं कर रहे हों और आप ऐसा एक कमांड चाहते हों जो
समझा सके कि क्या गलत है।

Doctor की तीन स्थितियां हैं:

| स्थिति | कमांड                   | व्यवहार                                                                         |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| निरीक्षण | `openclaw doctor`        | मानव-केंद्रित जांचें और निर्देशित प्रॉम्प्ट।                                    |
| मरम्मत  | `openclaw doctor --fix`  | समर्थित मरम्मतें लागू करता है, जब तक गैर-इंटरैक्टिव मरम्मत सुरक्षित न हो, प्रॉम्प्ट का उपयोग करता है। |
| Lint    | `openclaw doctor --lint` | CI, प्रीफ्लाइट, और समीक्षा गेट के लिए केवल-पढ़ने योग्य संरचित निष्कर्ष।          |

जब ऑटोमेशन को स्थिर परिणाम चाहिए हो, तो `--lint` को प्राथमिकता दें। जब कोई
मानव ऑपरेटर जानबूझकर doctor से कॉन्फ़िग या स्थिति संपादित करवाना चाहता हो, तो
`--fix` को प्राथमिकता दें।

## उदाहरण

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

चैनल-विशिष्ट अनुमतियों के लिए, `doctor` के बजाय चैनल probes का उपयोग करें:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

लक्षित Discord क्षमताएं probe bot की प्रभावी चैनल अनुमतियां रिपोर्ट करता है; status probe कॉन्फ़िगर किए गए Discord चैनलों और voice auto-join लक्ष्यों का ऑडिट करता है।

## विकल्प

- `--no-workspace-suggestions`: workspace memory/search सुझाव अक्षम करें
- `--yes`: बिना प्रॉम्प्ट किए डिफ़ॉल्ट स्वीकार करें
- `--repair`: बिना प्रॉम्प्ट किए अनुशंसित गैर-service मरम्मतें लागू करें; Gateway service इंस्टॉल और rewrite के लिए अभी भी इंटरैक्टिव पुष्टि या स्पष्ट Gateway कमांड चाहिए
- `--fix`: `--repair` का alias
- `--force`: जरूरत पड़ने पर custom service config overwrite करने सहित आक्रामक मरम्मतें लागू करें
- `--non-interactive`: बिना प्रॉम्प्ट चलाएं; केवल सुरक्षित माइग्रेशन और गैर-service मरम्मतें
- `--generate-gateway-token`: Gateway token जनरेट और कॉन्फ़िगर करें
- `--allow-exec`: secrets सत्यापित करते समय doctor को configured exec SecretRefs चलाने की अनुमति दें
- `--deep`: अतिरिक्त Gateway installs के लिए system services scan करें और हालिया Gateway supervisor restart handoffs रिपोर्ट करें
- `--lint`: read-only mode में आधुनिक health checks चलाएं और diagnostic findings emit करें
- `--post-upgrade`: post-upgrade Plugin compatibility probes चलाएं; findings को stdout पर emit करता है; यदि कोई error-level findings मौजूद हों तो code 1 के साथ exit करता है
- `--json`: `--lint` के साथ, human output के बजाय JSON findings emit करें; `--post-upgrade` के साथ, machine-readable JSON envelope (`{ probesRun, findings }`) emit करें
- `--severity-min <level>`: `--lint` के साथ, `info`, `warning`, या `error` से नीचे की findings हटाएं
- `--all`: `--lint` के साथ, default automation set से बाहर रखी गई opt-in checks सहित सभी registered checks चलाएं
- `--skip <id>`: `--lint` के साथ, check id छोड़ें; एक से अधिक छोड़ने के लिए repeat करें
- `--only <id>`: `--lint` के साथ, केवल एक check id चलाएं; छोटा selected set चलाने के लिए repeat करें

## Lint मोड

`openclaw doctor --lint` doctor checks के लिए read-only automation posture है।
यह structured health-check path का उपयोग करता है, प्रॉम्प्ट नहीं करता, और
config/state की मरम्मत या rewrite नहीं करता। इसे CI, preflight scripts, और
review workflows में उपयोग करें जब आपको guided repair prompts के बजाय
machine-readable findings चाहिए हों।
`--json`, `--severity-min`, `--all`, `--only`, और `--skip` जैसे Lint-output विकल्प
केवल `--lint` के साथ स्वीकार किए जाते हैं।

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Human output compact है:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON output lint runs के लिए scripting surface है:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

Exit व्यवहार:

- `0`: चुनी गई severity threshold पर या उससे ऊपर कोई findings नहीं
- `1`: कम से कम एक finding चुनी गई threshold को पूरा करती है
- `2`: lint findings बन पाने से पहले command/runtime failure

`--severity-min` visible findings और exit threshold दोनों को नियंत्रित करता है।
उदाहरण के लिए, `openclaw doctor --lint --severity-min error` कोई findings print
नहीं कर सकता और `0` exit कर सकता है, भले ही lower-severity `info` या `warning`
findings मौजूद हों।

`--all` severity filtering से पहले चुनी जाने वाली checks को नियंत्रित करता है।
default lint run stable automation gate है और ऐसी checks को बाहर रखता है जिन्हें
जानबूझकर opt-in बनाया गया है क्योंकि वे deep, historical, या repairable legacy
residue surface करने की अधिक संभावना वाली हैं। जब आप हर check id सूचीबद्ध किए
बिना पूरा lint inventory चाहते हों, तो `--all` का उपयोग करें। `--only <id>` सबसे
सटीक selector बना रहता है और id द्वारा कोई भी registered check चला सकता है।

## संरचित स्वास्थ्य जांचें

आधुनिक doctor checks एक छोटे structured contract का उपयोग करती हैं:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` `doctor --lint` को power करता है। `repair()` वैकल्पिक है और केवल
`doctor --fix` / `doctor --repair` द्वारा विचार किया जाता है। जो checks अभी इस
shape में migrate नहीं हुई हैं, वे legacy doctor contribution flow का उपयोग
जारी रखती हैं।

विभाजन जानबूझकर है: `detect()` diagnosis का मालिक है, जबकि `repair()` यह report
करने का मालिक है कि उसने क्या बदला या बदलेगा। Repair contexts `dryRun`/`diff`
requests carry कर सकते हैं, और repair results config/file edits के लिए structured
`diffs` और service, process, package, state, या अन्य side effects के लिए `effects`
return कर सकते हैं। इससे converted checks mutation planning को `detect()` में
लाए बिना `doctor --fix --dry-run` और diff reporting की दिशा में बढ़ सकती हैं।

`repair()` report करता है कि उसने requested repair को `status:
"repaired" | "skipped" | "failed"` के साथ attempt किया या नहीं। Omitted status
का अर्थ `repaired` है, इसलिए simple repair checks को केवल changes return करने
की जरूरत होती है। जब repair `skipped` या `failed` return करता है, doctor कारण
report करता है और उस check के लिए validation नहीं चलाता।

Successful structured repair के बाद, doctor repaired findings को scope बनाकर
`detect()` फिर से चलाता है। Checks focused validation के लिए selected findings,
paths, या `ocPath` values का उपयोग कर सकती हैं। यदि finding अभी भी मौजूद है,
तो doctor change को silently complete मानने के बजाय repair warning report करता
है।

Finding में शामिल है:

| Field             | उद्देश्य                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | skip/only filters और CI allowlists के लिए stable id।    |
| `severity`        | `info`, `warning`, या `error`।                         |
| `message`         | मानव-पठनीय problem statement।                          |
| `path`            | उपलब्ध होने पर config, file, या logical path।           |
| `line` / `column` | उपलब्ध होने पर source location।                        |
| `ocPath`          | जब check किसी एक पर point कर सके तो precise `oc://` address। |
| `fixHint`         | सुझाई गई operator action या repair summary।             |

Modernized core doctor checks उस ordered doctor contribution से जुड़ी रहती हैं
जो उनके human `doctor` / `doctor --fix` behavior का मालिक है। shared structured
health registry extension point है: bundled और plugin-backed checks core doctor
checks के बाद चलती हैं, जब उनका owning package उन्हें active command path में
register करता है। `openclaw/plugin-sdk/health` subpath उन extension consumers के
लिए वही contract expose करता है।

## Check चयन

जब workflow focused gate चाहता हो, तो `--only` और `--skip` का उपयोग करें:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` और `--skip` full check ids स्वीकार करते हैं और repeat किए जा सकते हैं।
यदि कोई `--only` id registered नहीं है, तो उस id के लिए कोई check नहीं चलती;
focused gate आपकी अपेक्षित checks चुन रहा है या नहीं, यह verify करने के लिए
command के `checksRun` और `checksSkipped` fields का उपयोग करें।

## Post-upgrade मोड

`openclaw doctor --post-upgrade` build या upgrade के बाद chain किए जाने के लिए
बनाए गए Plugin compatibility probes चलाता है। Findings stdout पर emit होती हैं;
यदि किसी finding में `level: "error"` है तो command code 1 के साथ exit करता है।
CI, community `fork-upgrade` skill, और अन्य post-upgrade smoke tooling के लिए
उपयुक्त machine-readable envelope (`{ probesRun, findings }`) पाने के लिए
`--json` जोड़ें। यदि installed Plugin index missing या malformed है, तो JSON mode
फिर भी उस envelope को `plugin.index_unavailable` error finding के साथ emit करता
है।

नोट्स:

- Nix मोड (`OPENCLAW_NIX_MODE=1`) में, read-only doctor जांचें अभी भी काम करती हैं, लेकिन `doctor --fix`, `doctor --repair`, `doctor --yes`, और `doctor --generate-gateway-token` अक्षम हैं क्योंकि `openclaw.json` अपरिवर्तनीय है। इसके बजाय इस इंस्टॉल के लिए Nix स्रोत संपादित करें; nix-openclaw के लिए, agent-first [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) का उपयोग करें।
- इंटरैक्टिव प्रॉम्प्ट (जैसे keychain/OAuth सुधार) केवल तब चलते हैं जब stdin एक TTY हो और `--non-interactive` **सेट न** हो। हेडलेस रन (cron, Telegram, कोई टर्मिनल नहीं) प्रॉम्प्ट छोड़ देंगे।
- प्रदर्शन: non-interactive `doctor` रन eager plugin loading छोड़ देते हैं ताकि हेडलेस स्वास्थ्य जांचें तेज रहें। इंटरैक्टिव doctor सत्र अभी भी legacy health और repair flow के लिए आवश्यक Plugin सतहें लोड करते हैं।
- `--lint`, `--non-interactive` से अधिक सख्त है: यह हमेशा read-only रहता है, कभी प्रॉम्प्ट नहीं करता, और कभी safe migrations लागू नहीं करता। जब आप चाहते हैं कि doctor बदलाव करे, तो `doctor --fix` या `doctor --repair` चलाएं।
- डिफ़ॉल्ट रूप से, doctor secrets जांचते समय `exec` SecretRefs निष्पादित नहीं करता। `openclaw doctor --allow-exec` या `openclaw doctor --lint --allow-exec` का उपयोग केवल तब करें जब आप जानबूझकर चाहते हों कि doctor वे configured secret resolvers चलाए।
- `--fix` (`--repair` का alias) `~/.openclaw/openclaw.json.bak` में backup लिखता है और अज्ञात config keys हटाता है, हर हटाने को सूचीबद्ध करते हुए।
- आधुनिकीकृत स्वास्थ्य जांचें `doctor --fix` के लिए `repair()` path उजागर कर सकती हैं; जो जांचें ऐसा नहीं करतीं, वे मौजूदा doctor repair flow से जारी रहती हैं।
- `doctor --fix --non-interactive` गायब या stale gateway service definitions रिपोर्ट करता है, लेकिन update repair mode के बाहर उन्हें install या rewrite नहीं करता। गायब service के लिए `openclaw gateway install` चलाएं, या जब आप जानबूझकर launcher बदलना चाहते हों तो `openclaw gateway install --force` चलाएं।
- State integrity checks अब sessions directory में orphan transcript files पहचानती हैं। उन्हें `.deleted.<timestamp>` के रूप में archive करने के लिए interactive confirmation चाहिए; `--fix`, `--yes`, और headless runs उन्हें वहीं छोड़ देते हैं।
- Doctor legacy cron job shapes के लिए `~/.openclaw/cron/jobs.json` (या `cron.store`) भी scan करता है और canonical rows को SQLite में import करने से पहले उन्हें rewrite करता है।
- Doctor explicit `payload.model` overrides वाले cron jobs रिपोर्ट करता है, जिनमें provider namespace counts और `agents.defaults.model` के विरुद्ध mismatches शामिल हैं, ताकि default model inherit न करने वाले scheduled jobs auth या billing investigations के दौरान दिख सकें।
- Linux पर, doctor चेतावनी देता है जब user का crontab अभी भी legacy `~/.openclaw/bin/ensure-whatsapp.sh` चलाता है; वह script अब maintained नहीं है और जब cron के पास systemd user-bus environment नहीं होता तो false WhatsApp gateway outages log कर सकता है।
- जब WhatsApp enabled होता है, doctor local `openclaw-tui` clients अभी भी चल रहे होने पर degraded Gateway event loop की जांच करता है। `doctor --fix` केवल verified local TUI clients रोकता है ताकि WhatsApp replies stale TUI refresh loops के पीछे queue न हों।
- Doctor primary models, fallbacks, image/video generation models, heartbeat/subagent/compaction overrides, hooks, channel model overrides, और stale session route pins में legacy `openai-codex/*` model refs को canonical `openai/*` refs में rewrite करता है। `--fix` legacy `openai-codex:*` auth profiles और `auth.order.openai-codex` entries को `openai:*` में migrate भी करता है, Codex intent को provider/model-scoped `agentRuntime.id: "codex"` entries पर ले जाता है, stale whole-agent/session runtime pins हटाता है, और repaired OpenAI agent refs को direct OpenAI API-key auth के बजाय Codex auth routing पर रखता है।
- Doctor पुराने OpenClaw versions द्वारा बनाई गई legacy Plugin dependency staging state साफ करता है और managed npm plugins के लिए host `openclaw` package relink करता है जो इसे peer dependency के रूप में declare करते हैं। यह config द्वारा referenced missing downloadable plugins की भी repair करता है, जैसे `plugins.entries`, configured channels, configured provider/search settings, या configured agent runtimes। Package updates के दौरान, doctor package-manager Plugin repair को तब तक छोड़ देता है जब तक package swap पूरा न हो; यदि configured Plugin को अभी भी recovery चाहिए, तो बाद में `openclaw doctor --fix` दोबारा चलाएं। यदि download fail होता है, तो doctor install error रिपोर्ट करता है और अगले repair attempt के लिए configured Plugin entry सुरक्षित रखता है।
- Doctor stale Plugin config को repair करता है, `plugins.allow`/`plugins.deny`/`plugins.entries` से missing Plugin ids हटाकर, साथ में matching dangling channel config, Heartbeat targets, और channel model overrides भी हटाता है जब Plugin discovery स्वस्थ हो।
- Doctor affected `plugins.entries.<id>` entry को disable करके और उसका invalid `config` payload हटाकर invalid Plugin config को quarantine करता है। Gateway startup पहले से ही केवल उस खराब Plugin को skip करता है ताकि अन्य plugins और channels चलते रह सकें।
- जब कोई दूसरा supervisor gateway lifecycle own करता हो, तो `OPENCLAW_SERVICE_REPAIR_POLICY=external` सेट करें। Doctor अभी भी gateway/service health रिपोर्ट करता है और non-service repairs लागू करता है, लेकिन service install/start/restart/bootstrap और legacy service cleanup skip करता है।
- Linux पर, doctor inactive extra gateway-like systemd units को ignore करता है और repair के दौरान running systemd gateway service के लिए command/entrypoint metadata rewrite नहीं करता। जब आप जानबूझकर active launcher बदलना चाहते हों, तो पहले service रोकें या `openclaw gateway install --force` का उपयोग करें।
- Doctor legacy flat Talk config (`talk.voiceId`, `talk.modelId`, और संबंधित entries) को `talk.provider` + `talk.providers.<provider>` में auto-migrate करता है।
- Repeat `doctor --fix` runs अब Talk normalization को report/apply नहीं करते जब केवल object key order का अंतर हो।
- Doctor में memory-search readiness check शामिल है और embedding credentials गायब होने पर `openclaw configure --section model` recommend कर सकता है।
- Doctor चेतावनी देता है जब कोई command owner configured नहीं होता। Command owner वह human operator account है जिसे owner-only commands चलाने और dangerous actions approve करने की अनुमति है। DM pairing केवल किसी को bot से बात करने देती है; यदि आपने first-owner bootstrap मौजूद होने से पहले किसी sender को approve किया था, तो `commands.ownerAllowFrom` स्पष्ट रूप से सेट करें।
- जब Codex-mode agents configured हों और operator के Codex home में personal Codex CLI assets मौजूद हों, तो Doctor एक info note रिपोर्ट करता है। Local Codex app-server launches isolated per-agent homes का उपयोग करते हैं, इसलिए जरूरत हो तो पहले Codex Plugin install करें, फिर जानबूझकर promote किए जाने वाले assets inventory करने के लिए `openclaw migrate plan codex` का उपयोग करें।
- Doctor retired `plugins.entries.codex.config.codexDynamicToolsProfile` हटाता है; Codex app-server हमेशा Codex-native workspace tools को native रखता है।
- Doctor चेतावनी देता है जब default agent के लिए allowed Skills current runtime environment में unavailable हों क्योंकि bins, env vars, config, या OS requirements गायब हैं। `doctor --fix` उन unavailable Skills को `skills.entries.<skill>.enabled=false` के साथ disable कर सकता है; जब आप skill active रखना चाहते हों, तो missing requirement install/configure करें।
- यदि sandbox mode enabled है लेकिन Docker unavailable है, तो doctor remediation (`install Docker` या `openclaw config set agents.defaults.sandbox.mode off`) के साथ high-signal warning रिपोर्ट करता है।
- यदि legacy sandbox registry files या shard directories मौजूद हैं (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/`, या `~/.openclaw/sandbox/browsers/`), तो doctor उन्हें रिपोर्ट करता है; `openclaw doctor --fix` valid entries को SQLite में migrate करता है और invalid legacy files को quarantine करता है।
- यदि `gateway.auth.token`/`gateway.auth.password` SecretRef-managed हैं और current command path में unavailable हैं, तो doctor read-only warning रिपोर्ट करता है और plaintext fallback credentials नहीं लिखता। exec-backed SecretRefs के लिए, doctor `--allow-exec` मौजूद न होने तक execution skip करता है।
- यदि fix path में channel SecretRef inspection fail होता है, तो doctor जल्दी exit करने के बजाय जारी रहता है और warning रिपोर्ट करता है।
- State-directory migrations के बाद, doctor चेतावनी देता है जब enabled default Telegram या Discord accounts env fallback पर निर्भर हों और `TELEGRAM_BOT_TOKEN` या `DISCORD_BOT_TOKEN` doctor process के लिए unavailable हो।
- Telegram `allowFrom` username auto-resolution (`doctor --fix`) के लिए current command path में resolvable Telegram token चाहिए। यदि token inspection unavailable है, तो doctor warning रिपोर्ट करता है और उस pass के लिए auto-resolution skip करता है।

## macOS: `launchctl` env overrides

यदि आपने पहले `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (या `...PASSWORD`) चलाया था, तो वह value आपकी config file को override करती है और persistent "unauthorized" errors पैदा कर सकती है।

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Gateway doctor](/hi/gateway/doctor)
