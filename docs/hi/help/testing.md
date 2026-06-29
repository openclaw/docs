---
read_when:
    - स्थानीय रूप से या CI में परीक्षण चलाना
    - मॉडल/प्रदाता बग के लिए रिग्रेशन जोड़ना
    - Debugging gateway + agent व्यवहार
summary: 'परीक्षण किट: यूनिट/e2e/लाइव सूट, Docker रनर, और प्रत्येक परीक्षण क्या कवर करता है'
title: परीक्षण
x-i18n:
    generated_at: "2026-06-28T23:17:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw में तीन Vitest सूट (यूनिट/इंटीग्रेशन, e2e, लाइव) और Docker रनर का एक छोटा सेट है। यह दस्तावेज़ "हम परीक्षण कैसे करते हैं" मार्गदर्शिका है:

- प्रत्येक सूट क्या कवर करता है (और क्या जानबूझकर _कवर नहीं_ करता)।
- सामान्य वर्कफ़्लो (लोकल, प्री-पुश, डीबगिंग) के लिए कौन-से कमांड चलाने हैं।
- लाइव टेस्ट क्रेडेंशियल कैसे खोजते हैं और मॉडल/प्रोवाइडर कैसे चुनते हैं।
- वास्तविक दुनिया की मॉडल/प्रोवाइडर समस्याओं के लिए रिग्रेशन कैसे जोड़ें।

<Note>
**QA स्टैक (qa-lab, qa-channel, लाइव ट्रांसपोर्ट लेन)** अलग से दस्तावेजीकृत है:

- [QA अवलोकन](/hi/concepts/qa-e2e-automation) - आर्किटेक्चर, कमांड सतह, सिनारियो लेखन।
- [Matrix QA](/hi/concepts/qa-matrix) - `pnpm openclaw qa matrix` के लिए संदर्भ।
- [Maturity स्कोरकार्ड](/hi/maturity/scorecard) - रिलीज़ QA प्रमाण स्थिरता और LTS निर्णयों को कैसे समर्थन देता है।
- [QA चैनल](/hi/channels/qa-channel) - रेपो-समर्थित सिनारियो द्वारा उपयोग किया जाने वाला सिंथेटिक ट्रांसपोर्ट Plugin।

यह पेज नियमित टेस्ट सूट और Docker/Parallels रनर चलाने को कवर करता है। नीचे का QA-विशिष्ट रनर सेक्शन ([QA-विशिष्ट रनर](#qa-specific-runners)) ठोस `qa` इनवोकेशन सूचीबद्ध करता है और ऊपर के संदर्भों की ओर वापस इंगित करता है।
</Note>

## त्वरित शुरुआत

अधिकांश दिनों में:

- पूर्ण गेट (पुश से पहले अपेक्षित): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- अधिक संसाधन वाली मशीन पर तेज़ लोकल पूर्ण-सूट रन: `pnpm test:max`
- प्रत्यक्ष Vitest वॉच लूप: `pnpm test:watch`
- प्रत्यक्ष फ़ाइल लक्ष्यीकरण अब एक्सटेंशन/चैनल पाथ भी रूट करता है: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- जब आप किसी एक विफलता पर काम कर रहे हों, तो पहले लक्षित रन को प्राथमिकता दें।
- Docker-समर्थित QA साइट: `pnpm qa:lab:up`
- Linux VM-समर्थित QA लेन: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

जब आप टेस्ट छूते हैं या अतिरिक्त भरोसा चाहते हैं:

- कवरेज गेट: `pnpm test:coverage`
- E2E सूट: `pnpm test:e2e`

## टेस्ट अस्थायी डायरेक्टरी

टेस्ट-स्वामित्व वाली अस्थायी डायरेक्टरी के लिए `test/helpers/temp-dir.ts` में साझा हेल्पर को प्राथमिकता दें। वे स्वामित्व स्पष्ट करते हैं और क्लीनअप को उसी टेस्ट लाइफ़सायकल में रखते हैं:

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

जब कोई टेस्ट पहले से पाथ की किसी array या set का स्वामी हो, तो `makeTempDir(tempDirs, prefix)` और `cleanupTempDirs(tempDirs)` का उपयोग करें। टेस्ट में नए सीधे `fs.mkdtemp*` कॉल से बचें, जब तक कोई केस स्पष्ट रूप से कच्चे temp-dir व्यवहार की पुष्टि नहीं कर रहा हो। जब किसी टेस्ट को जानबूझकर सीधे temp directory चाहिए, तो ठोस कारण के साथ ऑडिट योग्य allow टिप्पणी जोड़ें:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

माइग्रेशन दृश्यता के लिए, `node scripts/report-test-temp-creations.mjs` मौजूदा क्लीनअप शैलियों को ब्लॉक किए बिना जोड़ी गई diff लाइनों में नई सीधी temp-dir creation की रिपोर्ट करता है। इसका फ़ाइल स्कोप अलग test-helper filename heuristic बनाए रखने के बजाय जानबूझकर वही test-path classification अपनाता है जिसका उपयोग `scripts/changed-lanes.mjs` करता है, और साझा helper implementation को छोड़ देता है। `check:changed` बदले गए test paths के लिए इस रिपोर्ट को warning-only CI signal के रूप में चलाता है; findings GitHub warning annotations हैं, failures नहीं।

जब वास्तविक प्रोवाइडर/मॉडल डीबग कर रहे हों (वास्तविक creds आवश्यक):

- लाइव सूट (models + gateway tool/image probes): `pnpm test:live`
- एक लाइव फ़ाइल को शांत रूप से लक्ष्य करें: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- रनटाइम प्रदर्शन रिपोर्ट: वास्तविक `openai/gpt-5.5` agent turn के लिए `live_openai_candidate=true` या Kova CPU/heap/trace artifacts के लिए `deep_profile=true` के साथ `OpenClaw Performance` डिस्पैच करें। जब `CLAWGRIT_REPORTS_TOKEN` कॉन्फ़िगर हो, तो दैनिक निर्धारित रन mock-provider, deep-profile, और GPT 5.5 lane artifacts को `openclaw/clawgrit-reports` पर प्रकाशित करते हैं। mock-provider रिपोर्ट में source-level gateway boot, memory, plugin-pressure, repeated fake-model hello-loop, और CLI startup numbers भी शामिल होते हैं।
- Docker लाइव मॉडल स्वीप: `pnpm test:docker:live-models`
  - प्रत्येक चुना गया मॉडल अब एक text turn और एक छोटा file-read-style probe चलाता है। जिन मॉडल का metadata `image` input घोषित करता है, वे एक छोटा image turn भी चलाते हैं। provider failures को isolate करते समय अतिरिक्त probes को `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` या `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` से बंद करें।
  - CI कवरेज: दैनिक `OpenClaw Scheduled Live And E2E Checks` और मैनुअल `OpenClaw Release Checks` दोनों reusable live/E2E workflow को `include_live_suites: true` के साथ कॉल करते हैं, जिसमें provider के अनुसार sharded अलग Docker live model matrix jobs शामिल हैं।
  - केंद्रित CI reruns के लिए, `OpenClaw Live And E2E Checks (Reusable)` को `include_live_suites: true` और `live_models_only: true` के साथ डिस्पैच करें।
  - नए high-signal provider secrets को `scripts/ci-hydrate-live-auth.sh` के साथ `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` और उसके scheduled/release callers में जोड़ें।
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server path के विरुद्ध Docker live lane चलाता है, `/codex bind` के साथ synthetic Slack DM bind करता है, `/codex fast` और `/codex permissions` exercise करता है, फिर ACP के बजाय native plugin binding के माध्यम से plain reply और image attachment route की पुष्टि करता है।
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - plugin-owned Codex app-server harness के माध्यम से gateway agent turns चलाता है, `/codex status` और `/codex models` की पुष्टि करता है, और default रूप से image, cron MCP, sub-agent, और Guardian probes exercise करता है। अन्य Codex app-server failures isolate करते समय sub-agent probe को `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` से बंद करें। केंद्रित sub-agent check के लिए, अन्य probes बंद करें: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    यह sub-agent probe के बाद बाहर निकलता है, जब तक `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` सेट न हो।
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - packaged OpenClaw tarball को Docker में install करता है, OpenAI API-key onboarding चलाता है, और पुष्टि करता है कि Codex plugin तथा `@openai/codex` dependency demand पर managed npm project root में डाउनलोड किए गए।
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - वास्तविक `slugify` dependency के साथ fixture plugin pack करता है, उसे `npm-pack:` के माध्यम से install करता है, managed npm project root के अंतर्गत dependency की पुष्टि करता है, फिर live OpenAI model से plugin tool call करवाकर hidden slug लौटाने को कहता है।
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command surface के लिए opt-in belt-and-suspenders check। यह `/crestodian status` exercise करता है, persistent model change queue करता है, `/crestodian yes` reply करता है, और audit/config write path की पुष्टि करता है।
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - configless container में `PATH` पर fake Claude CLI के साथ Crestodian चलाता है और पुष्टि करता है कि fuzzy planner fallback audited typed config write में अनुवादित होता है।
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - खाली OpenClaw state dir से शुरू करता है, modern onboard Crestodian entrypoint की पुष्टि करता है, setup/model/agent/Discord plugin + SecretRef writes apply करता है, config validate करता है, और audit entries की पुष्टि करता है। वही Ring 0 setup path QA Lab में भी `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` द्वारा कवर किया गया है।
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` सेट होने पर, `openclaw models list --provider moonshot --json` चलाएँ, फिर `moonshot/kimi-k2.6` के विरुद्ध isolated `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` चलाएँ। पुष्टि करें कि JSON Moonshot/K2.6 रिपोर्ट करता है और assistant transcript normalized `usage.cost` store करता है।

<Tip>
जब आपको केवल एक failing case चाहिए, तो नीचे वर्णित allowlist env vars के माध्यम से live tests को narrow करना प्राथमिकता दें।
</Tip>

## QA-विशिष्ट रनर

जब आपको QA-lab realism चाहिए, तो ये कमांड main test suites के साथ रहते हैं:

CI dedicated workflows में QA Lab चलाता है। Agentic parity `QA-Lab - All Lanes` और release validation के अंतर्गत nested है, standalone PR workflow नहीं। Broad validation को `rerun_group=qa-parity` या release-checks QA group के साथ `Full Release Validation` का उपयोग करना चाहिए। Stable/default release checks exhaustive live/Docker soak को `run_release_soak=true` के पीछे रखते हैं; `full` profile soak को force करता है। `QA-Lab - All Lanes` `main` पर nightly और manual dispatch से mock parity lane, live Matrix lane, Convex-managed live Telegram lane, और Convex-managed live Discord lane को parallel jobs के रूप में चलाता है। Scheduled QA और release checks Matrix `--profile fast` explicitly pass करते हैं, जबकि Matrix CLI और manual workflow input default `all` रहता है; manual dispatch `all` को `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, और `e2ee-cli` jobs में shard कर सकता है। `OpenClaw Release Checks` release approval से पहले parity के साथ fast Matrix और Telegram lanes चलाता है, release transport checks के लिए `mock-openai/gpt-5.5` का उपयोग करते हुए ताकि वे deterministic रहें और normal provider-plugin startup से बचें। ये live transport gateways memory search disable करते हैं; memory behavior QA parity suites द्वारा कवर रहता है।

Full release live media shards `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` का उपयोग करते हैं, जिसमें पहले से `ffmpeg` और `ffprobe` हैं। Docker live model/backend shards चुने गए commit के लिए एक बार built shared `ghcr.io/openclaw/openclaw-live-test:<sha>` image का उपयोग करते हैं, फिर हर shard के अंदर rebuild करने के बजाय उसे `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ pull करते हैं।

- `pnpm openclaw qa suite`
  - रेपो-समर्थित QA परिदृश्यों को सीधे होस्ट पर चलाता है।
  - चुने गए परिदृश्य सेट के लिए शीर्ष-स्तरीय `qa-evidence.json`, `qa-suite-summary.json`, और
    `qa-suite-report.md` आर्टिफैक्ट लिखता है, जिनमें मिश्रित फ्लो, Vitest, और Playwright
    परिदृश्य चयन शामिल होते हैं।
  - जब `pnpm openclaw qa run --qa-profile <profile>` द्वारा डिस्पैच किया जाता है, तो उसी
    `qa-evidence.json` में चुने गए टैक्सोनॉमी प्रोफाइल स्कोरकार्ड को एम्बेड करता है।
    `smoke-ci` हल्का साक्ष्य लिखता है, जो `evidenceMode: "slim"` सेट करता है और
    प्रति-एंट्री `execution` को छोड़ देता है। `release` क्यूरेटेड रिलीज-तैयारी हिस्से को कवर करता है;
    `all` हर सक्रिय मैच्योरिटी श्रेणी चुनता है और इसका उद्देश्य उन स्पष्ट QA
    Profile Evidence workflow डिस्पैचों के लिए है जब पूरा स्कोरकार्ड आर्टिफैक्ट
    चाहिए।
  - डिफॉल्ट रूप से अलग-थलग Gateway वर्करों के साथ कई चुने गए परिदृश्य समानांतर चलाता है।
    `qa-channel` की डिफॉल्ट concurrency 4 है (चुनी गई परिदृश्य संख्या से सीमित)।
    वर्कर संख्या समायोजित करने के लिए `--concurrency <count>` का उपयोग करें, या पुराने
    सीरियल लेन के लिए `--concurrency 1`।
  - कोई भी परिदृश्य विफल होने पर शून्येतर कोड से बाहर निकलता है। जब आप विफल exit code के बिना
    आर्टिफैक्ट चाहते हों, तो `--allow-failures` का उपयोग करें।
  - प्रदाता मोड `live-frontier`, `mock-openai`, और `aimock` का समर्थन करता है।
    `aimock` परिदृश्य-जागरूक `mock-openai` लेन को बदले बिना प्रयोगात्मक
    fixture और protocol-mock कवरेज के लिए स्थानीय AIMock-समर्थित प्रदाता सर्वर शुरू करता है।
- `pnpm openclaw qa coverage --match <query>`
  - परिदृश्य ID, शीर्षक, सतहें, कवरेज ID, docs refs, code refs,
    plugins, और प्रदाता आवश्यकताओं में खोजता है, फिर मेल खाते suite targets प्रिंट करता है।
  - QA Lab run से पहले इसका उपयोग करें जब आपको बदला गया व्यवहार या फ़ाइल पथ पता हो
    लेकिन सबसे छोटा परिदृश्य नहीं। यह केवल सलाहकारी है; बदले जा रहे व्यवहार से अभी भी mock,
    live, Multipass, Matrix, या transport proof चुनें।
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab के जरिए live OpenAI Kitchen Sink Plugin gauntlet चलाता है। यह
    बाहरी Kitchen Sink पैकेज इंस्टॉल करता है, Plugin SDK surface inventory सत्यापित करता है,
    `/healthz` और `/readyz` को probes करता है, Gateway CPU/RSS
    साक्ष्य रिकॉर्ड करता है, live OpenAI turn चलाता है, और adversarial diagnostics जांचता है।
    `OPENAI_API_KEY` जैसे live OpenAI auth की आवश्यकता होती है। Hydrated Testbox
    sessions में, जब `openclaw-testbox-env` helper मौजूद हो, तो यह Testbox live-auth profile
    को अपने-आप source करता है।
- `pnpm test:gateway:cpu-scenarios`
  - Gateway startup bench और एक छोटा mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) चलाता है और `.artifacts/gateway-cpu-scenarios/`
    के तहत संयुक्त CPU observation summary लिखता है।
  - डिफॉल्ट रूप से केवल sustained hot CPU observations को flag करता है (`--cpu-core-warn`
    और `--hot-wall-warn-ms`), इसलिए छोटे startup bursts metrics के रूप में दर्ज होते हैं
    और minutes-long gateway peg regression जैसे नहीं दिखते।
  - बने हुए `dist` आर्टिफैक्ट का उपयोग करता है; जब checkout में पहले से ताजा runtime output
    न हो, तो पहले build चलाएं।
- `pnpm openclaw qa suite --runner multipass`
  - उसी QA suite को disposable Multipass Linux VM के अंदर चलाता है।
  - होस्ट पर `qa suite` जैसा ही scenario-selection व्यवहार बनाए रखता है।
  - `qa suite` जैसे ही provider/model selection flags का पुनः उपयोग करता है।
  - Live runs अतिथि के लिए व्यावहारिक समर्थित QA auth inputs forward करते हैं:
    env-आधारित provider keys, QA live provider config path, और मौजूद होने पर `CODEX_HOME`।
  - Output dirs रेपो root के तहत ही रहने चाहिए ताकि अतिथि mounted workspace के जरिए वापस लिख सके।
  - `.artifacts/qa-e2e/...` के तहत सामान्य QA report + summary और Multipass logs लिखता है।
- `pnpm qa:lab:up`
  - operator-style QA कार्य के लिए Docker-समर्थित QA site शुरू करता है।
- `pnpm test:docker:npm-onboard-channel-agent`
  - वर्तमान checkout से npm tarball बनाता है, उसे Docker में globally इंस्टॉल करता है,
    non-interactive OpenAI API-key onboarding चलाता है, डिफॉल्ट रूप से Telegram configure करता है,
    सत्यापित करता है कि packaged Plugin runtime startup dependency repair के बिना load होता है,
    doctor चलाता है, और mocked OpenAI endpoint के विरुद्ध एक local agent turn चलाता है।
  - उसी packaged-install लेन को Discord के साथ चलाने के लिए `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`
    का उपयोग करें।
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcripts के लिए deterministic built-app Docker smoke चलाता है।
    यह सत्यापित करता है कि hidden OpenClaw runtime context visible user turn में leak होने के बजाय
    non-display custom message के रूप में persisted है, फिर प्रभावित broken session JSONL seed करता है
    और सत्यापित करता है कि `openclaw doctor --fix` उसे backup के साथ active branch में rewrite करता है।
- `pnpm test:docker:npm-telegram-live`
  - Docker में OpenClaw package candidate इंस्टॉल करता है, installed-package onboarding चलाता है,
    installed CLI के जरिए Telegram configure करता है, फिर उस installed package को SUT Gateway बनाकर
    live Telegram QA lane का पुनः उपयोग करता है।
  - Wrapper checkout से केवल `qa-lab` harness source mount करता है; installed package
    `dist`, `openclaw/plugin-sdk`, और bundled Plugin runtime का owner होता है ताकि lane
    current checkout plugins को test के तहत package में mix न करे।
  - डिफॉल्ट `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` है; registry से इंस्टॉल करने के बजाय
    resolved local tarball test करने के लिए `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz`
    या `OPENCLAW_CURRENT_PACKAGE_TGZ` सेट करें।
  - डिफॉल्ट रूप से `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` के साथ `qa-evidence.json` में
    repeated RTT timing emit करता है। RTT run समायोजित करने के लिए
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, या
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` override करें।
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` sample करने के लिए comma-separated
    Telegram QA check IDs की सूची स्वीकार करता है; unset होने पर default RTT-capable check
    `telegram-mentioned-message-reply` है।
  - `pnpm openclaw qa telegram` जैसे ही Telegram env credentials या Convex credential source
    का उपयोग करता है। CI/release automation के लिए,
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` के साथ
    `OPENCLAW_QA_CONVEX_SITE_URL` और role secret सेट करें। यदि
    `OPENCLAW_QA_CONVEX_SITE_URL` और Convex role secret CI में मौजूद हों,
    तो Docker wrapper अपने-आप Convex चुनता है।
  - Docker build/install कार्य से पहले wrapper host पर Telegram या Convex credential env validate करता है।
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` केवल तब सेट करें जब जानबूझकर
    pre-credential setup debug कर रहे हों।
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` इस lane के लिए ही shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` को override करता है। जब Convex credentials
    चुने जाते हैं और कोई role set नहीं होता, तो wrapper CI में `ci` और CI के बाहर
    `maintainer` का उपयोग करता है।
  - GitHub Actions इस lane को manual maintainer workflow
    `NPM Telegram Beta E2E` के रूप में expose करता है। यह merge पर नहीं चलता। Workflow
    `qa-live-shared` environment और Convex CI credential leases का उपयोग करता है।
- GitHub Actions एक candidate package के विरुद्ध side-run product proof के लिए `Package Acceptance`
  भी expose करता है। यह trusted ref, published npm spec,
  HTTPS tarball URL plus SHA-256, या किसी दूसरे run से tarball artifact स्वीकार करता है, normalized
  `openclaw-current.tgz` को `package-under-test` के रूप में upload करता है, फिर smoke, package,
  product, full, या custom lane profiles के साथ existing Docker E2E scheduler चलाता है।
  उसी `package-under-test` artifact के विरुद्ध Telegram QA workflow चलाने के लिए
  `telegram_mode=mock-openai` या `live-frontier` सेट करें।
  - नवीनतम beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof को digest चाहिए और यह public URL safety policy का उपयोग करता है:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private tarball mirrors explicit trusted-source policy का उपयोग करते हैं:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` trusted workflow ref से `.github/package-trusted-sources.json` पढ़ता है और URL credentials या workflow-input private-network bypass स्वीकार नहीं करता। यदि named policy bearer auth घोषित करती है, तो fixed `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret configure करें।

- Artifact proof किसी दूसरे Actions run से tarball artifact download करता है:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - वर्तमान OpenClaw build को Docker में pack और install करता है, OpenAI configured के साथ Gateway
    शुरू करता है, फिर config edits के जरिए bundled channel/plugins enable करता है।
  - सत्यापित करता है कि setup discovery unconfigured downloadable plugins को अनुपस्थित छोड़ती है,
    पहला configured doctor repair हर missing downloadable Plugin को explicit रूप से install करता है,
    और दूसरा restart hidden dependency repair नहीं चलाता।
  - एक known older npm baseline भी install करता है, `openclaw update --tag <candidate>` चलाने से पहले
    Telegram enable करता है, और सत्यापित करता है कि candidate का post-update doctor
    harness-side postinstall repair के बिना legacy Plugin dependency debris साफ करता है।
- `pnpm test:parallels:npm-update`
  - Parallels guests में native packaged-install update smoke चलाता है। हर selected platform पहले
    requested baseline package install करता है, फिर उसी guest में installed `openclaw update` command
    चलाता है और installed version, update status, gateway readiness, तथा एक local agent turn
    सत्यापित करता है।
  - एक guest पर iterate करते समय `--platform macos`, `--platform windows`, या `--platform linux`
    का उपयोग करें। Summary artifact path और per-lane status के लिए `--json` का उपयोग करें।
  - OpenAI lane डिफॉल्ट रूप से live agent-turn proof के लिए `openai/gpt-5.5` का उपयोग करती है।
    किसी दूसरे OpenAI model को जानबूझकर validate करते समय `--model <provider/model>` पास करें
    या `OPENCLAW_PARALLELS_OPENAI_MODEL` सेट करें।
  - लंबे local runs को host timeout में wrap करें ताकि Parallels transport stalls testing window
    का बाकी हिस्सा consume न कर सकें:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script nested lane logs `/tmp/openclaw-parallels-npm-update.*` के तहत लिखता है।
    Outer wrapper को hung मानने से पहले `windows-update.log`, `macos-update.log`, या `linux-update.log`
    inspect करें।
  - Cold guest पर Windows update post-update doctor और package update work में 10 से 15 मिनट
    खर्च कर सकता है; nested npm debug log आगे बढ़ रहा हो तो यह अभी भी healthy है।
  - इस aggregate wrapper को individual Parallels macOS, Windows, या Linux smoke lanes के साथ
    समानांतर न चलाएं। वे VM state share करते हैं और snapshot restore, package serving,
    या guest Gateway state पर collide कर सकते हैं।
  - Post-update proof सामान्य bundled Plugin surface चलाता है क्योंकि speech, image generation,
    और media understanding जैसी capability facades bundled runtime APIs के जरिए load होती हैं,
    भले ही agent turn स्वयं केवल simple text response जांचता हो।

- `pnpm openclaw qa aimock`
  - सीधे प्रोटोकॉल स्मोक परीक्षण के लिए केवल स्थानीय AIMock प्रदाता सर्वर शुरू करता है।
- `pnpm openclaw qa matrix`
  - डिस्पोज़ेबल Docker-समर्थित Tuwunel होमसर्वर के विरुद्ध Matrix लाइव QA लेन चलाता है। केवल स्रोत-चेकआउट - पैकेज्ड इंस्टॉल `qa-lab` शिप नहीं करते।
  - पूरा CLI, प्रोफ़ाइल/परिदृश्य कैटलॉग, env vars, और आर्टिफ़ैक्ट लेआउट: [Matrix QA](/hi/concepts/qa-matrix)।
- `pnpm openclaw qa telegram`
  - env से ड्राइवर और SUT bot tokens का उपयोग करके वास्तविक निजी समूह के विरुद्ध Telegram लाइव QA लेन चलाता है।
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, और `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` आवश्यक हैं। समूह id संख्यात्मक Telegram chat id होना चाहिए।
  - साझा पूल्ड क्रेडेंशियल्स के लिए `--credential-source convex` का समर्थन करता है। डिफ़ॉल्ट रूप से env मोड का उपयोग करें, या पूल्ड लीज़ में शामिल होने के लिए `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` सेट करें।
  - डिफ़ॉल्ट canary, उल्लेख gating, कमांड addressing, `/status`, bot-to-bot उल्लेखित उत्तर, और core native command replies को कवर करते हैं। `mock-openai` डिफ़ॉल्ट deterministic reply-chain और Telegram final-message streaming regressions को भी कवर करते हैं। `session_status` जैसे वैकल्पिक probes के लिए `--list-scenarios` का उपयोग करें।
  - किसी भी परिदृश्य के विफल होने पर non-zero से बाहर निकलता है। जब आप failing exit code के बिना आर्टिफ़ैक्ट चाहते हों, तो `--allow-failures` का उपयोग करें।
  - उसी निजी समूह में दो अलग-अलग bots आवश्यक हैं, जिनमें SUT bot Telegram username expose करता हो।
  - स्थिर bot-to-bot अवलोकन के लिए, दोनों bots के लिए `@BotFather` में Bot-to-Bot Communication Mode सक्षम करें और सुनिश्चित करें कि driver bot समूह bot traffic देख सकता है।
  - `.artifacts/qa-e2e/...` के अंतर्गत Telegram QA रिपोर्ट, सारांश, और `qa-evidence.json` लिखता है। उत्तर देने वाले परिदृश्यों में driver send request से देखे गए SUT reply तक RTT शामिल है।

`Mantis Telegram Live` इस लेन के चारों ओर PR-evidence wrapper है। यह Convex-लीज़्ड Telegram क्रेडेंशियल्स के साथ candidate ref चलाता है, Crabbox desktop browser में redacted QA report/evidence bundle render करता है, MP4 evidence रिकॉर्ड करता है, motion-trimmed GIF जनरेट करता है, artifact bundle अपलोड करता है, और `pr_number` सेट होने पर Mantis GitHub App के माध्यम से inline PR evidence पोस्ट करता है। Maintainers इसे Actions UI से `Mantis Scenario` (`scenario_id:
telegram-live`) के माध्यम से या सीधे pull request comment से शुरू कर सकते हैं:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` PR visual proof के लिए agentic native Telegram Desktop before/after wrapper है। इसे Actions UI से freeform `instructions` के साथ, `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) के माध्यम से, या PR comment से शुरू करें:

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent PR पढ़ता है, तय करता है कि कौन-सा Telegram-visible व्यवहार बदलाव को साबित करता है, baseline और candidate refs पर real-user Crabbox Telegram Desktop proof lane चलाता है, native GIFs उपयोगी होने तक iterate करता है, paired `motionPreview` manifest लिखता है, और `pr_number` सेट होने पर Mantis GitHub App के माध्यम से वही 2-column GIF table पोस्ट करता है।

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux desktop लीज़ या पुन: उपयोग करता है, native Telegram Desktop इंस्टॉल करता है, leased Telegram SUT bot token के साथ OpenClaw कॉन्फ़िगर करता है, Gateway शुरू करता है, और visible VNC desktop से screenshot/MP4 evidence रिकॉर्ड करता है।
  - डिफ़ॉल्ट `--credential-source convex` है ताकि workflows को केवल Convex broker secret की ज़रूरत हो। `pnpm openclaw qa telegram` जैसे समान `OPENCLAW_QA_TELEGRAM_*` variables के साथ `--credential-source env` का उपयोग करें।
  - Telegram Desktop को अभी भी user login/profile चाहिए। bot token केवल OpenClaw को कॉन्फ़िगर करता है। base64 `.tgz` profile archive के लिए `--telegram-profile-archive-env <name>` का उपयोग करें, या `--keep-lease` का उपयोग करके VNC के माध्यम से एक बार manually log in करें।
  - output directory के अंतर्गत `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, और `telegram-desktop-builder.mp4` लिखता है।

लाइव transport lanes एक standard contract साझा करते हैं ताकि नए transports drift न करें; per-lane coverage matrix [QA overview → Live transport coverage](/hi/concepts/qa-e2e-automation#live-transport-coverage) में है। `qa-channel` broad synthetic suite है और उस matrix का हिस्सा नहीं है।

### Convex के माध्यम से साझा Telegram क्रेडेंशियल्स (v1)

जब live transport QA के लिए `--credential-source convex` (या `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) सक्षम होता है, QA lab Convex-backed pool से exclusive lease प्राप्त करता है, lane चलने के दौरान उस lease को heartbeat करता है, और shutdown पर lease release करता है। section name Discord, Slack, और WhatsApp support से पहले का है; lease contract kinds में साझा है।

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

आवश्यक env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (उदाहरण `https://your-deployment.convex.site`)
- चुनी गई role के लिए एक secret:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` `maintainer` के लिए
  - `OPENCLAW_QA_CONVEX_SECRET_CI` `ci` के लिए
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI में डिफ़ॉल्ट `ci`, अन्यथा `maintainer`)

वैकल्पिक env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (डिफ़ॉल्ट `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (डिफ़ॉल्ट `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (डिफ़ॉल्ट `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (डिफ़ॉल्ट `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (डिफ़ॉल्ट `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (वैकल्पिक trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` local-only development के लिए loopback `http://` Convex URLs की अनुमति देता है।

`OPENCLAW_QA_CONVEX_SITE_URL` को सामान्य operation में `https://` का उपयोग करना चाहिए।

Maintainer admin commands (pool add/remove/list) को विशेष रूप से `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` चाहिए।

maintainers के लिए CLI helpers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live runs से पहले Convex site URL, broker secrets, endpoint prefix, HTTP timeout, और admin/list reachability को secret values print किए बिना check करने के लिए `doctor` का उपयोग करें। scripts और CI utilities में machine-readable output के लिए `--json` का उपयोग करें।

Default endpoint contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Success: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }` (या खाली `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }` (या खाली `2xx`)
- `POST /admin/add` (केवल maintainer secret)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove` (केवल maintainer secret)
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (केवल maintainer secret)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram kind के लिए payload shape:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` संख्यात्मक Telegram chat id string होना चाहिए।
- `admin/add` `kind: "telegram"` के लिए इस shape को validate करता है और malformed payloads reject करता है।

Telegram real-user kind के लिए payload shape:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, और `telegramApiId` numeric strings होने चाहिए।
- `tdlibArchiveSha256` और `desktopTdataArchiveSha256` SHA-256 hex strings होने चाहिए।
- `kind: "telegram-user"` Mantis Telegram Desktop proof workflow के लिए reserved है। Generic QA Lab lanes को इसे acquire नहीं करना चाहिए।

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes भी pool से lease कर सकते हैं, लेकिन Slack payload validation currently broker के बजाय Slack QA runner में रहता है। Slack rows के लिए `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` का उपयोग करें।

### QA में channel जोड़ना

नए channel adapters के लिए architecture और scenario-helper names [QA overview → Adding a channel](/hi/concepts/qa-e2e-automation#adding-a-channel) में हैं। minimum bar: shared `qa-lab` host seam पर transport runner implement करें, plugin manifest में `qaRunners` declare करें, `openclaw qa <runner>` के रूप में mount करें, और `qa/scenarios/` के अंतर्गत scenarios author करें।

## Test suites (कहाँ क्या चलता है)

suites को "बढ़ती realism" (और बढ़ती flakiness/cost) के रूप में सोचें:

### Unit / integration (default)

- Command: `pnpm test`
- Config: untargeted runs `vitest.full-*.config.ts` shard set का उपयोग करते हैं और parallel scheduling के लिए multi-project shards को per-project configs में expand कर सकते हैं
- Files: `src/**/*.test.ts`, `packages/**/*.test.ts`, और `test/**/*.test.ts` के अंतर्गत core/unit inventories; UI unit tests dedicated `unit-ui` shard में चलते हैं
- Scope:
  - Pure unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - ज्ञात bugs के लिए deterministic regressions
- Expectations:
  - CI में चलता है
  - वास्तविक keys आवश्यक नहीं
  - तेज और स्थिर होना चाहिए
  - Resolver और public-surface loader tests को generated tiny plugin fixtures के साथ broad `api.js` और `runtime-api.js` fallback behavior साबित करना चाहिए, real bundled plugin source APIs के साथ नहीं। Real plugin API loads plugin-owned contract/integration suites में आते हैं।

Native dependency policy:

- Default test installs optional native Discord opus builds skip करते हैं। Discord voice bundled `libopus-wasm` का उपयोग करता है, और `@discordjs/opus` `allowBuilds` में disabled रहता है ताकि local tests और Testbox lanes native addon compile न करें।
- native opus performance की तुलना `libopus-wasm` benchmark repo में करें, default OpenClaw install/test loops में नहीं। default `allowBuilds` में `@discordjs/opus` को `true` पर सेट न करें; इससे unrelated install/test loops native code compile करने लगते हैं।

<AccordionGroup>
  <Accordion title="प्रोजेक्ट्स, shards, और scoped lanes">

    - बिना लक्ष्य वाला `pnpm test` एक विशाल नेटिव रूट-प्रोजेक्ट प्रक्रिया के बजाय बारह छोटे shard configs (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) चलाता है। इससे लोडेड मशीनों पर peak RSS घटता है और auto-reply/extension काम असंबंधित suites को भूखा रखने से बचता है।
    - `pnpm test --watch` अब भी नेटिव रूट `vitest.config.ts` प्रोजेक्ट ग्राफ का उपयोग करता है, क्योंकि multi-shard watch loop व्यावहारिक नहीं है।
    - `pnpm test`, `pnpm test:watch`, और `pnpm test:perf:imports` स्पष्ट file/directory targets को पहले scoped lanes से route करते हैं, इसलिए `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` को पूरे root project startup tax का खर्च नहीं उठाना पड़ता।
    - `pnpm test:changed` बदले हुए git paths को डिफ़ॉल्ट रूप से सस्ते scoped lanes में फैलाता है: सीधे test edits, sibling `*.test.ts` files, explicit source mappings, और local import-graph dependents। Config/setup/package edits tests को broad-run नहीं करते, जब तक आप स्पष्ट रूप से `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` का उपयोग न करें।
    - `pnpm check:changed` संकरे काम के लिए सामान्य smart local check gate है। यह diff को core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, और tooling में वर्गीकृत करता है, फिर matching typecheck, lint, और guard commands चलाता है। यह Vitest tests नहीं चलाता; test proof के लिए `pnpm test:changed` या स्पष्ट `pnpm test <target>` चलाएँ। केवल release metadata वाले version bumps targeted version/config/root-dependency checks चलाते हैं, एक guard के साथ जो top-level version field के बाहर package changes को अस्वीकार करता है।
    - Live Docker ACP harness edits focused checks चलाते हैं: live Docker auth scripts के लिए shell syntax और live Docker scheduler dry-run। `package.json` changes केवल तब शामिल होते हैं जब diff `scripts["test:docker:live-*"]` तक सीमित हो; dependency, export, version, और अन्य package-surface edits अब भी broader guards का उपयोग करते हैं।
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk`, और समान pure utility areas से import-light unit tests `unit-fast` lane से route होते हैं, जो `test/setup-openclaw-runtime.ts` को छोड़ता है; stateful/runtime-heavy files मौजूदा lanes पर रहते हैं।
    - चुनी हुई `plugin-sdk` और `commands` helper source files भी changed-mode runs को उन light lanes में explicit sibling tests से map करती हैं, इसलिए helper edits उस directory के लिए पूरी heavy suite दोबारा चलाने से बचते हैं।
    - `auto-reply` में top-level core helpers, top-level `reply.*` integration tests, और `src/auto-reply/reply/**` subtree के लिए dedicated buckets हैं। CI reply subtree को आगे agent-runner, dispatch, और commands/state-routing shards में split करता है, ताकि एक import-heavy bucket पूरी Node tail का मालिक न बन जाए।
    - Normal PR/main CI जानबूझकर extension batch sweep और release-only `agentic-plugins` shard को छोड़ता है। Full Release Validation release candidates पर उन plugin/extension-heavy suites के लिए अलग `Plugin Prerelease` child workflow dispatch करता है।

  </Accordion>

  <Accordion title="एम्बेडेड runner coverage">

    - जब आप message-tool discovery inputs या compaction runtime
      context बदलते हैं, तो coverage के दोनों स्तर बनाए रखें।
    - pure routing और normalization boundaries के लिए focused helper regressions
      जोड़ें।
    - embedded runner integration suites को healthy रखें:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, और
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`।
    - ये suites verify करते हैं कि scoped ids और compaction behavior अब भी
      वास्तविक `run.ts` / `compact.ts` paths से flow करते हैं; helper-only tests
      उन integration paths का पर्याप्त विकल्प नहीं हैं।

  </Accordion>

  <Accordion title="Vitest pool और isolation defaults">

    - Base Vitest config डिफ़ॉल्ट रूप से `threads` पर है।
    - shared Vitest config `isolate: false` fix करता है और root projects,
      e2e, और live configs में non-isolated runner का उपयोग करता है।
    - root UI lane अपना `jsdom` setup और optimizer रखता है, लेकिन shared
      non-isolated runner पर भी चलता है।
    - हर `pnpm test` shard shared Vitest config से वही `threads` + `isolate: false`
      defaults inherit करता है।
    - `scripts/run-vitest.mjs` बड़े local runs के दौरान V8 compile churn घटाने
      के लिए डिफ़ॉल्ट रूप से Vitest child Node processes में `--no-maglev` जोड़ता है।
      stock V8 behavior से तुलना करने के लिए `OPENCLAW_VITEST_ENABLE_MAGLEV=1` set करें।
    - `scripts/run-vitest.mjs` explicit non-watch Vitest runs को 5 मिनट तक
      stdout या stderr output न आने पर terminate करता है। जानबूझकर silent investigation
      के लिए watchdog disable करने के लिए `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` set करें।

  </Accordion>

  <Accordion title="तेज़ local iteration">

    - `pnpm changed:lanes` दिखाता है कि कोई diff कौन-सी architectural lanes trigger करता है।
    - pre-commit hook केवल formatting करता है। यह formatted files को restage करता है और
      lint, typecheck, या tests नहीं चलाता।
    - handoff या push से पहले जब smart local check gate चाहिए हो, तो
      `pnpm check:changed` स्पष्ट रूप से चलाएँ।
    - `pnpm test:changed` डिफ़ॉल्ट रूप से सस्ते scoped lanes से route करता है। `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`
      केवल तब उपयोग करें जब agent तय करे कि harness, config, package, या contract edit को सच में broader
      Vitest coverage चाहिए।
    - `pnpm test:max` और `pnpm test:changed:max` वही routing behavior रखते हैं,
      बस higher worker cap के साथ।
    - Local worker auto-scaling जानबूझकर conservative है और host load average
      पहले से high होने पर back off करता है, इसलिए multiple concurrent
      Vitest runs डिफ़ॉल्ट रूप से कम नुकसान करते हैं।
    - base Vitest config projects/config files को `forceRerunTriggers` के रूप में mark करता है,
      ताकि test wiring बदलने पर changed-mode reruns सही रहें।
    - config supported hosts पर `OPENCLAW_VITEST_FS_MODULE_CACHE` enabled रखता है;
      direct profiling के लिए एक explicit cache location चाहिए तो
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` set करें।

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` Vitest import-duration reporting और
      import-breakdown output enable करता है।
    - `pnpm test:perf:imports:changed` वही profiling view `origin/main` से बदली
      files तक scope करता है।
    - Shard timing data `.artifacts/vitest-shard-timings.json` में लिखा जाता है।
      Whole-config runs key के रूप में config path का उपयोग करते हैं; include-pattern CI
      shards shard name append करते हैं ताकि filtered shards को अलग से track किया जा सके।
    - जब एक hot test अब भी अपना अधिकांश समय startup imports में खर्च करता है,
      heavy dependencies को संकरे local `*.runtime.ts` seam के पीछे रखें और runtime helpers को
      सिर्फ `vi.mock(...)` से pass कराने के लिए deep-import करने के बजाय उस seam को सीधे mock करें।
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` उस committed diff के लिए routed
      `test:changed` की native root-project path से तुलना करता है और wall time plus macOS max RSS print करता है।
    - `pnpm test:perf:changed:bench -- --worktree` current dirty tree को benchmark करता है,
      changed file list को `scripts/test-projects.mjs` और root Vitest config से route करके।
    - `pnpm test:perf:profile:main` Vitest/Vite startup और transform overhead के लिए
      main-thread CPU profile लिखता है।
    - `pnpm test:perf:profile:runner` file parallelism disabled के साथ unit suite के लिए
      runner CPU+heap profiles लिखता है।

  </Accordion>
</AccordionGroup>

### स्थिरता (gateway)

- Command: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, forced to one worker
- Scope:
  - diagnostics डिफ़ॉल्ट रूप से enabled होने के साथ वास्तविक loopback Gateway start करता है
  - diagnostic event path से synthetic gateway message, memory, और large-payload churn drive करता है
  - Gateway WS RPC पर `diagnostics.stability` query करता है
  - diagnostic stability bundle persistence helpers cover करता है
  - Assert करता है कि recorder bounded रहता है, synthetic RSS samples pressure budget के नीचे रहते हैं, और per-session queue depths वापस zero पर drain होते हैं
- Expectations:
  - CI-safe और keyless
  - stability-regression follow-up के लिए narrow lane, पूरी Gateway suite का विकल्प नहीं

### E2E (repo aggregate)

- Command: `pnpm test:e2e`
- Scope:
  - gateway smoke E2E lane चलाता है
  - mocked Control UI browser E2E lane चलाता है
- Expectations:
  - CI-safe और keyless
  - Playwright Chromium installed होना आवश्यक है

### E2E (gateway smoke)

- Command: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Files: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, और bundled-plugin E2E tests `extensions/` के अंतर्गत
- Runtime defaults:
  - repo के बाकी हिस्से से match करते हुए Vitest `threads` with `isolate: false` का उपयोग करता है।
  - adaptive workers का उपयोग करता है (CI: up to 2, local: डिफ़ॉल्ट रूप से 1)।
  - console I/O overhead घटाने के लिए डिफ़ॉल्ट रूप से silent mode में चलता है।
- Useful overrides:
  - worker count force करने के लिए `OPENCLAW_E2E_WORKERS=<n>` (16 तक capped)।
  - verbose console output दोबारा enable करने के लिए `OPENCLAW_E2E_VERBOSE=1`।
- Scope:
  - Multi-instance gateway end-to-end behavior
  - WebSocket/HTTP surfaces, node pairing, और heavier networking
- Expectations:
  - CI में चलता है (जब pipeline में enabled हो)
  - वास्तविक keys की आवश्यकता नहीं
  - unit tests की तुलना में अधिक moving parts (धीमा हो सकता है)

### E2E (Control UI mocked browser)

- Command: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Files: `ui/src/**/*.e2e.test.ts`
- Scope:
  - Vite Control UI start करता है
  - Playwright से वास्तविक Chromium page drive करता है
  - Gateway WebSocket को deterministic in-browser mocks से replace करता है
- Expectations:
  - `pnpm test:e2e` के हिस्से के रूप में CI में चलता है
  - वास्तविक Gateway, agents, या provider keys की आवश्यकता नहीं
  - Browser dependency मौजूद होनी चाहिए (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - active local OpenShell gateway reuse करता है
  - temporary local Dockerfile से sandbox बनाता है
  - real `sandbox ssh-config` + SSH exec पर OpenClaw का OpenShell backend exercise करता है
  - sandbox fs bridge के माध्यम से remote-canonical filesystem behavior verify करता है
- Expectations:
  - केवल opt-in; default `pnpm test:e2e` run का हिस्सा नहीं
  - local `openshell` CLI और working Docker daemon आवश्यक हैं
  - active local OpenShell gateway और उसके config source की आवश्यकता है
  - isolated `HOME` / `XDG_CONFIG_HOME` का उपयोग करता है, फिर test sandbox destroy करता है
- Useful overrides:
  - broader e2e suite manually चलाते समय test enable करने के लिए `OPENCLAW_E2E_OPENSHELL=1`
  - non-default CLI binary या wrapper script की ओर point करने के लिए `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - isolated test को registered gateway config expose करने के लिए `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture द्वारा उपयोग किए गए Docker gateway IP को override करने के लिए `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live (वास्तविक providers + वास्तविक models)

- कमांड: `pnpm test:live`
- कॉन्फ़िग: `vitest.live.config.ts`
- फ़ाइलें: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, और `extensions/` के अंतर्गत bundled-plugin लाइव टेस्ट
- डिफ़ॉल्ट: `pnpm test:live` द्वारा **सक्षम** (`OPENCLAW_LIVE_TEST=1` सेट करता है)
- दायरा:
  - "क्या यह provider/model असली creds के साथ _आज_ सच में काम करता है?"
  - provider फ़ॉर्मैट बदलाव, tool-calling quirks, auth समस्याएँ, और rate limit व्यवहार पकड़ना
- अपेक्षाएँ:
  - डिज़ाइन के अनुसार CI-stable नहीं (असली नेटवर्क, असली provider नीतियाँ, quotas, outages)
  - पैसे खर्च करता है / rate limits उपयोग करता है
  - "सब कुछ" के बजाय सीमित subsets चलाना बेहतर है
- लाइव रन पहले से export की गई API keys और staged auth profiles का उपयोग करते हैं।
- डिफ़ॉल्ट रूप से, लाइव रन फिर भी `HOME` को isolate करते हैं और config/auth सामग्री को temp test home में copy करते हैं ताकि unit fixtures आपके असली `~/.openclaw` को mutate न कर सकें।
- `OPENCLAW_LIVE_USE_REAL_HOME=1` केवल तब सेट करें जब आपको जानबूझकर live tests को अपनी असली home directory उपयोग करवानी हो।
- `pnpm test:live` डिफ़ॉल्ट रूप से शांत mode में चलता है: यह `[live] ...` progress output रखता है और gateway bootstrap logs/Bonjour chatter को mute करता है। यदि आप पूरे startup logs वापस चाहते हैं तो `OPENCLAW_LIVE_TEST_QUIET=0` सेट करें।
- API key rotation (provider-specific): comma/semicolon फ़ॉर्मैट के साथ `*_API_KEYS` या `*_API_KEY_1`, `*_API_KEY_2` सेट करें (उदाहरण के लिए `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) या per-live override के लिए `OPENCLAW_LIVE_*_KEY`; tests rate limit responses पर retry करते हैं।
- Progress/heartbeat output:
  - लाइव suites अब stderr पर progress lines emit करते हैं ताकि लंबे provider calls visibly active रहें, भले ही Vitest console capture शांत हो।
  - `vitest.live.config.ts` Vitest console interception disable करता है ताकि provider/gateway progress lines लाइव रन के दौरान तुरंत stream हों।
  - direct-model heartbeats को `OPENCLAW_LIVE_HEARTBEAT_MS` से tune करें।
  - gateway/probe heartbeats को `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` से tune करें।

## मुझे कौन-सा suite चलाना चाहिए?

इस decision table का उपयोग करें:

- Logic/tests edit कर रहे हों: `pnpm test` चलाएँ (और यदि आपने काफ़ी बदला है तो `pnpm test:coverage`)
- gateway networking / WS protocol / pairing को touch कर रहे हों: `pnpm test:e2e` जोड़ें
- "my bot is down" / provider-specific failures / tool calling debug कर रहे हों: सीमित `pnpm test:live` चलाएँ

## लाइव (network-touching) tests

लाइव model matrix, CLI backend smokes, ACP smokes, Codex app-server
harness, और सभी media-provider live tests (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - साथ ही live runs के लिए credential handling - के लिए
[लाइव suites की Testing](/hi/help/testing-live) देखें। dedicated update और
plugin validation checklist के लिए
[updates और plugins की Testing](/hi/help/testing-updates-plugins) देखें।

## Docker runners (वैकल्पिक "Linux में काम करता है" checks)

ये Docker runners दो buckets में विभाजित हैं:

- Live-model runners: `test:docker:live-models` और `test:docker:live-gateway` repo Docker image के अंदर केवल अपनी matching profile-key live file चलाते हैं (`src/agents/models.profiles.live.test.ts` और `src/gateway/gateway-models.profiles.live.test.ts`), आपकी local config dir, workspace, और वैकल्पिक profile env file mount करते हुए। matching local entrypoints `test:live:models-profiles` और `test:live:gateway-profiles` हैं।
- Docker live runners जरूरत पड़ने पर अपने practical caps रखते हैं:
  `test:docker:live-models` curated supported high-signal set पर default करता है, और
  `test:docker:live-gateway` `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, और
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` पर default करता है। जब आपको स्पष्ट रूप से छोटा cap या बड़ा scan चाहिए, तो `OPENCLAW_LIVE_MAX_MODELS`
  या gateway env vars सेट करें।
- `test:docker:all` live Docker image को `test:docker:live-build` के जरिए एक बार build करता है, `scripts/package-openclaw-for-docker.mjs` के माध्यम से OpenClaw को npm tarball के रूप में एक बार pack करता है, फिर दो `scripts/e2e/Dockerfile` images build/reuse करता है। bare image install/update/plugin-dependency lanes के लिए केवल Node/Git runner है; वे lanes prebuilt tarball mount करते हैं। functional image built-app functionality lanes के लिए उसी tarball को `/app` में install करती है। Docker lane definitions `scripts/lib/docker-e2e-scenarios.mjs` में रहती हैं; planner logic `scripts/lib/docker-e2e-plan.mjs` में रहती है; `scripts/test-docker-all.mjs` selected plan execute करता है। aggregate weighted local scheduler उपयोग करता है: `OPENCLAW_DOCKER_ALL_PARALLELISM` process slots नियंत्रित करता है, जबकि resource caps heavy live, npm-install, और multi-service lanes को एक साथ शुरू होने से रोकते हैं। यदि कोई single lane active caps से भारी है, तो scheduler pool खाली होने पर उसे फिर भी शुरू कर सकता है और capacity फिर उपलब्ध होने तक उसे अकेले चलाता रहता है। Defaults 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, और `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` हैं; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` या `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` केवल तब tune करें जब Docker host में ज़्यादा headroom हो। runner डिफ़ॉल्ट रूप से Docker preflight करता है, stale OpenClaw E2E containers हटाता है, हर 30 seconds में status print करता है, successful lane timings `.artifacts/docker-tests/lane-timings.json` में store करता है, और बाद के runs में longer lanes पहले start करने के लिए उन timings का उपयोग करता है। Docker build या run किए बिना weighted lane manifest print करने के लिए `OPENCLAW_DOCKER_ALL_DRY_RUN=1` उपयोग करें, या selected lanes, package/image needs, और credentials के लिए CI plan print करने के लिए `node scripts/test-docker-all.mjs --plan-json` उपयोग करें।
- `Package Acceptance` "क्या यह installable tarball product के रूप में काम करता है?" के लिए GitHub-native package gate है। यह `source=npm`, `source=ref`, `source=url`, या `source=artifact` से एक candidate package resolve करता है, उसे `package-under-test` के रूप में upload करता है, फिर selected ref को repack करने के बजाय उसी exact tarball के against reusable Docker E2E lanes चलाता है। Profiles breadth के अनुसार ordered हैं: `smoke`, `package`, `product`, और `full`। package/update/plugin contract, published-upgrade survivor matrix, release defaults, और failure triage के लिए [updates और plugins की Testing](/hi/help/testing-updates-plugins) देखें।
- Build और release checks tsdown के बाद `scripts/check-cli-bootstrap-imports.mjs` चलाते हैं। guard `dist/entry.js` और `dist/cli/run-main.js` से static built graph walk करता है और command dispatch से पहले pre-dispatch startup imports package dependencies जैसे Commander, prompt UI, undici, या logging import हों तो fail करता है; यह bundled gateway run chunk को budget के भीतर भी रखता है और known cold gateway paths के static imports reject करता है। Packaged CLI smoke root help, onboard help, doctor help, status, config schema, और model-list command भी cover करता है।
- Package Acceptance legacy compatibility `2026.4.25` (`2026.4.25-beta.*` शामिल) तक capped है। उस cutoff तक, harness केवल shipped-package metadata gaps tolerate करता है: omitted private QA inventory entries, missing `gateway install --wrapper`, tarball-derived git fixture में missing patch files, missing persisted `update.channel`, legacy plugin install-record locations, missing marketplace install-record persistence, और `plugins update` के दौरान config metadata migration। `2026.4.25` के बाद packages के लिए ये paths strict failures हैं।
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, और `test:docker:config-reload` एक या अधिक real containers boot करते हैं और higher-level integration paths verify करते हैं।
- Docker/Bash E2E lanes जो packed OpenClaw tarball को `scripts/lib/openclaw-e2e-instance.sh` के जरिए install करते हैं, `npm install` को `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` पर cap करते हैं (default `600s`; debugging के लिए wrapper disable करने हेतु `0` सेट करें)।

live-model Docker runners केवल आवश्यक CLI auth homes भी bind-mount करते हैं (या run narrowed न होने पर सभी supported ones), फिर run से पहले उन्हें container home में copy करते हैं ताकि external-CLI OAuth host auth store को mutate किए बिना tokens refresh कर सके:

- Direct models: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; default रूप से Claude, Codex, और Gemini cover करता है, strict Droid/OpenCode coverage `pnpm test:docker:live-acp-bind:droid` और `pnpm test:docker:live-acp-bind:opencode` के जरिए)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, और `pnpm qa:observability:smoke` private QA source-checkout lanes हैं। वे जानबूझकर package Docker release lanes का हिस्सा नहीं हैं क्योंकि npm tarball QA Lab omit करता है।
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, full scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` packed OpenClaw tarball को Docker में globally install करता है, env-ref onboarding के जरिए OpenAI और default रूप से Telegram configure करता है, doctor चलाता है, और एक mocked OpenAI agent turn चलाता है। prebuilt tarball reuse करने के लिए `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, host rebuild skip करने के लिए `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, या channel switch करने के लिए `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` या `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` उपयोग करें।

- रिलीज़ उपयोगकर्ता यात्रा स्मोक: `pnpm test:docker:release-user-journey` पैक किए गए OpenClaw tarball को साफ़ Docker home में वैश्विक रूप से इंस्टॉल करता है, onboarding चलाता है, mocked OpenAI प्रदाता कॉन्फ़िगर करता है, एजेंट टर्न चलाता है, बाहरी plugins इंस्टॉल/अनइंस्टॉल करता है, ClickClack को local fixture के विरुद्ध कॉन्फ़िगर करता है, outbound/inbound messaging सत्यापित करता है, Gateway रीस्टार्ट करता है, और doctor चलाता है।
- रिलीज़ typed onboarding स्मोक: `pnpm test:docker:release-typed-onboarding` पैक किए गए tarball को इंस्टॉल करता है, वास्तविक TTY के माध्यम से `openclaw onboard` चलाता है, OpenAI को env-ref प्रदाता के रूप में कॉन्फ़िगर करता है, raw key persistence न होने की पुष्टि करता है, और mocked एजेंट टर्न चलाता है।
- रिलीज़ media/memory स्मोक: `pnpm test:docker:release-media-memory` पैक किए गए tarball को इंस्टॉल करता है, PNG attachment से image understanding, OpenAI-compatible image generation output, memory search recall, और Gateway restart के बाद recall survival सत्यापित करता है।
- रिलीज़ upgrade उपयोगकर्ता यात्रा स्मोक: `pnpm test:docker:release-upgrade-user-journey` डिफ़ॉल्ट रूप से candidate tarball से पुराना नवीनतम प्रकाशित baseline इंस्टॉल करता है, प्रकाशित package पर provider/plugin/ClickClack state कॉन्फ़िगर करता है, candidate tarball पर upgrade करता है, फिर core agent/plugin/channel यात्रा दोबारा चलाता है। यदि कोई पुराना प्रकाशित baseline मौजूद नहीं है, तो यह candidate version का पुनः उपयोग करता है। Baseline को `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` से override करें।
- रिलीज़ Plugin marketplace स्मोक: `pnpm test:docker:release-plugin-marketplace` local fixture marketplace से इंस्टॉल करता है, इंस्टॉल किए गए Plugin को update करता है, उसे uninstall करता है, और पुष्टि करता है कि install metadata prune होने के साथ Plugin CLI गायब हो जाता है।
- Skill install स्मोक: `pnpm test:docker:skill-install` पैक किए गए OpenClaw tarball को Docker में वैश्विक रूप से इंस्टॉल करता है, config में uploaded archive installs अक्षम करता है, search से मौजूदा live ClawHub skill slug resolve करता है, उसे `openclaw skills install` से इंस्टॉल करता है, और इंस्टॉल किए गए skill तथा `.clawhub` origin/lock metadata को सत्यापित करता है।
- Update channel switch स्मोक: `pnpm test:docker:update-channel-switch` पैक किए गए OpenClaw tarball को Docker में वैश्विक रूप से इंस्टॉल करता है, package `stable` से git `dev` पर switch करता है, persisted channel और Plugin post-update कार्य सत्यापित करता है, फिर package `stable` पर वापस switch करता है और update status जाँचता है।
- Upgrade survivor स्मोक: `pnpm test:docker:upgrade-survivor` पैक किए गए OpenClaw tarball को agents, channel config, Plugin allowlists, stale Plugin dependency state, और मौजूदा workspace/session files वाले dirty old-user fixture पर इंस्टॉल करता है। यह live provider या channel keys के बिना package update और non-interactive doctor चलाता है, फिर loopback Gateway शुरू करता है और config/state preservation तथा startup/status budgets जाँचता है।
- Published upgrade survivor स्मोक: `pnpm test:docker:published-upgrade-survivor` डिफ़ॉल्ट रूप से `openclaw@latest` इंस्टॉल करता है, वास्तविक existing-user files seed करता है, उस baseline को baked command recipe से कॉन्फ़िगर करता है, परिणामी config validate करता है, उस प्रकाशित install को candidate tarball पर update करता है, non-interactive doctor चलाता है, `.artifacts/upgrade-survivor/summary.json` लिखता है, फिर loopback Gateway शुरू करता है और configured intents, state preservation, startup, `/healthz`, `/readyz`, और RPC status budgets जाँचता है। एक baseline को `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` से override करें, aggregate scheduler से exact local baselines को `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` जैसे `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` के साथ expand करने को कहें, और issue-shaped fixtures को `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` जैसे `reported-issues` से expand करें; reported-issues set में automatic external OpenClaw Plugin install repair के लिए `configured-plugin-installs` शामिल है। Package Acceptance इन्हें `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, और `published_upgrade_survivor_scenarios` के रूप में expose करता है, `last-stable-4` या `all-since-2026.4.23` जैसे meta baseline tokens resolve करता है, और Full Release Validation release-soak package gate को `last-stable-4 2026.4.23 2026.5.2 2026.4.15` तथा `reported-issues` तक expand करता है।
- Session runtime context स्मोक: `pnpm test:docker:session-runtime-context` hidden runtime context transcript persistence और प्रभावित duplicated prompt-rewrite branches की doctor repair सत्यापित करता है।
- Bun global install स्मोक: `bash scripts/e2e/bun-global-install-smoke.sh` मौजूदा tree को pack करता है, isolated home में `bun install -g` से इंस्टॉल करता है, और पुष्टि करता है कि `openclaw infer image providers --json` अटकने के बजाय bundled image providers लौटाता है। Prebuilt tarball को `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` से पुनः उपयोग करें, host build को `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` से skip करें, या built Docker image से `dist/` को `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` से copy करें।
- Installer Docker स्मोक: `bash scripts/test-install-sh-docker.sh` अपने root, update, और direct-npm containers में एक npm cache साझा करता है। Update smoke candidate tarball पर upgrade करने से पहले stable baseline के रूप में npm `latest` पर default करता है। स्थानीय रूप से `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` से, या GitHub पर Install Smoke workflow के `update_baseline_version` input से override करें। Non-root installer checks isolated npm cache रखते हैं ताकि root-owned cache entries user-local install behavior को mask न करें। Local reruns में root/update/direct-npm cache पुनः उपयोग करने के लिए `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` set करें।
- Install Smoke CI duplicate direct-npm global update को `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` से skip करता है; जब direct `npm install -g` coverage चाहिए, तो उस env के बिना script स्थानीय रूप से चलाएँ।
- Agents delete shared workspace CLI स्मोक: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) डिफ़ॉल्ट रूप से root Dockerfile image build करता है, isolated container home में एक workspace के साथ दो agents seed करता है, `agents delete --json` चलाता है, और valid JSON तथा retained workspace behavior सत्यापित करता है। Install-smoke image को `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` से पुनः उपयोग करें।
- Gateway networking (दो containers, WS auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot स्मोक: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) source E2E image और Chromium layer build करता है, Chromium को raw CDP के साथ शुरू करता है, `browser doctor --deep` चलाता है, और पुष्टि करता है कि CDP role snapshots link URLs, cursor-promoted clickables, iframe refs, और frame metadata cover करते हैं।
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) Gateway के माध्यम से mocked OpenAI server चलाता है, पुष्टि करता है कि `web_search` `reasoning.effort` को `minimal` से `low` तक बढ़ाता है, फिर provider schema reject force करता है और जाँचता है कि raw detail Gateway logs में दिखाई देता है।
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame स्मोक): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP tools (real stdio MCP server + embedded OpenClaw profile allow/deny स्मोक): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (real Gateway + isolated cron और one-shot subagent runs के बाद stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (local path, `file:`, hoisted dependencies वाली npm registry, malformed npm package metadata, git moving refs, ClawHub kitchen-sink, marketplace updates, और Claude-bundle enable/inspect के लिए install/update स्मोक): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  ClawHub block skip करने के लिए `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` set करें, या default kitchen-sink package/runtime pair को `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` और `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` से override करें। `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` के बिना, test hermetic local ClawHub fixture server का उपयोग करता है।
- Plugin update unchanged स्मोक: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix स्मोक: `pnpm test:docker:plugin-lifecycle-matrix` bare container में packed OpenClaw tarball इंस्टॉल करता है, npm Plugin इंस्टॉल करता है, enable/disable toggle करता है, local npm registry के माध्यम से उसे upgrade और downgrade करता है, installed code delete करता है, फिर पुष्टि करता है कि uninstall stale state को फिर भी हटाता है और प्रत्येक lifecycle phase के लिए RSS/CPU metrics log करता है।
- Config reload metadata स्मोक: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` local path, `file:`, hoisted dependencies वाली npm registry, git moving refs, ClawHub fixtures, marketplace updates, और Claude-bundle enable/inspect के लिए install/update smoke cover करता है। `pnpm test:docker:plugin-update` installed plugins के लिए unchanged update behavior cover करता है। `pnpm test:docker:plugin-lifecycle-matrix` resource-tracked npm Plugin install, enable, disable, upgrade, downgrade, और missing-code uninstall cover करता है।

Shared functional image को manually prebuild और reuse करने के लिए:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific image overrides जैसे `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` set होने पर अभी भी priority लेते हैं। जब `OPENCLAW_SKIP_DOCKER_BUILD=1` किसी remote shared image की ओर point करता है, तो scripts उसे local न होने पर pull करते हैं। QR और installer Docker tests अपनी Dockerfiles रखते हैं क्योंकि वे shared built-app runtime के बजाय package/install behavior validate करते हैं।

live-model Docker रनर मौजूदा checkout को read-only bind-mount भी करते हैं और
उसे container के अंदर एक अस्थायी workdir में stage करते हैं। इससे runtime
image पतली रहती है, जबकि Vitest अब भी आपके ठीक local source/config पर चलता है।
