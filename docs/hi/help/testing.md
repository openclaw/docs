---
read_when:
    - स्थानीय रूप से या CI में परीक्षण चलाना
    - मॉडल/प्रदाता बग्स के लिए रिग्रेशन जोड़ना
    - Gateway + एजेंट व्यवहार की डीबगिंग
summary: 'परीक्षण किट: यूनिट/e2e/लाइव सूट, Docker रनर, और प्रत्येक परीक्षण क्या कवर करता है'
title: परीक्षण
x-i18n:
    generated_at: "2026-07-04T03:47:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw में तीन Vitest सूट (यूनिट/इंटीग्रेशन, e2e, लाइव) और Docker रनरों का एक छोटा सेट है। यह दस्तावेज़ "हम कैसे परीक्षण करते हैं" मार्गदर्शिका है:

- हर सूट क्या कवर करता है (और जानबूझकर क्या _नहीं_ कवर करता)।
- सामान्य वर्कफ़्लो (लोकल, pre-push, डीबगिंग) के लिए कौन-से कमांड चलाने हैं।
- लाइव परीक्षण क्रेडेंशियल कैसे खोजते हैं और मॉडल/प्रोवाइडर कैसे चुनते हैं।
- वास्तविक दुनिया के मॉडल/प्रोवाइडर समस्याओं के लिए रिग्रेशन कैसे जोड़ें।

<Note>
**QA स्टैक (qa-lab, qa-channel, लाइव ट्रांसपोर्ट लेन)** अलग से प्रलेखित है:

- [QA अवलोकन](/hi/concepts/qa-e2e-automation) - आर्किटेक्चर, कमांड सतह, सिनेरियो लेखन।
- [Matrix QA](/hi/concepts/qa-matrix) - `pnpm openclaw qa matrix` के लिए संदर्भ।
- [परिपक्वता स्कोरकार्ड](/hi/maturity/scorecard) - रिलीज़ QA प्रमाण स्थिरता और LTS निर्णयों का समर्थन कैसे करता है।
- [QA चैनल](/hi/channels/qa-channel) - repo-backed सिनेरियो द्वारा उपयोग किया जाने वाला सिंथेटिक ट्रांसपोर्ट Plugin।

यह पेज नियमित परीक्षण सूट और Docker/Parallels रनर चलाने को कवर करता है। नीचे दिया गया QA-विशिष्ट रनर अनुभाग ([QA-विशिष्ट रनर](#qa-specific-runners)) ठोस `qa` आह्वान सूचीबद्ध करता है और ऊपर दिए गए संदर्भों की ओर वापस इंगित करता है।
</Note>

## तुरंत शुरू करें

अधिकतर दिनों में:

- पूरा गेट (push से पहले अपेक्षित): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- अधिक संसाधनों वाली मशीन पर तेज़ लोकल पूरा-सूट रन: `pnpm test:max`
- प्रत्यक्ष Vitest वॉच लूप: `pnpm test:watch`
- प्रत्यक्ष फ़ाइल लक्ष्यीकरण अब extension/channel पाथ भी रूट करता है: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- जब आप किसी एक विफलता पर पुनरावृत्ति कर रहे हों, तो पहले लक्षित रन को प्राथमिकता दें।
- Docker-backed QA साइट: `pnpm qa:lab:up`
- Linux VM-backed QA लेन: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

जब आप परीक्षणों को छूते हैं या अतिरिक्त भरोसा चाहते हैं:

- कवरेज गेट: `pnpm test:coverage`
- E2E सूट: `pnpm test:e2e`

## परीक्षण अस्थायी डायरेक्टरियाँ

परीक्षण-स्वामित्व वाली अस्थायी डायरेक्टरियों के लिए `test/helpers/temp-dir.ts` में साझा हेल्परों को प्राथमिकता दें। वे स्वामित्व स्पष्ट करते हैं और सफ़ाई को उसी परीक्षण लाइफ़साइकल में रखते हैं:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` जानबूझकर कोई मैनुअल सफ़ाई मेथड उजागर नहीं करता; Vitest हर परीक्षण के बाद सफ़ाई का स्वामी है। मौजूदा निचले-स्तर के हेल्पर उन परीक्षणों के लिए बने रहते हैं जो अभी माइग्रेट नहीं हुए हैं, लेकिन नए और माइग्रेट किए गए परीक्षणों को ऑटो-क्लीनिंग ट्रैकर का उपयोग करना चाहिए। नए मैनुअल `makeTempDir`, `cleanupTempDirs`, या `createTempDirTracker` उपयोग से बचें और परीक्षणों में नए सीधे `fs.mkdtemp*` कॉल से बचें, जब तक कि कोई मामला स्पष्ट रूप से कच्चे temp-dir व्यवहार को सत्यापित न कर रहा हो। जब किसी परीक्षण को जानबूझकर सीधे temp डायरेक्टरी चाहिए, तो ठोस कारण के साथ ऑडिट योग्य allow टिप्पणी जोड़ें:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

माइग्रेशन दृश्यता के लिए, `node scripts/report-test-temp-creations.mjs` जोड़ी गई diff लाइनों में नई सीधी temp-dir रचना और नए मैनुअल साझा-हेल्पर उपयोग की रिपोर्ट करता है, बिना मौजूदा सफ़ाई शैलियों को ब्लॉक किए। इसका फ़ाइल स्कोप जानबूझकर `scripts/changed-lanes.mjs` द्वारा उपयोग किए गए उसी test-path वर्गीकरण का अनुसरण करता है, अलग test-helper फ़ाइलनाम हीयूरिस्टिक बनाए रखने के बजाय, और साझा हेल्पर इम्प्लीमेंटेशन को छोड़ता है। `check:changed` बदले हुए test पाथ के लिए इस रिपोर्ट को warning-only CI सिग्नल के रूप में चलाता है; निष्कर्ष GitHub warning annotations होते हैं, विफलताएँ नहीं।

वास्तविक प्रोवाइडर/मॉडल डीबग करते समय (वास्तविक क्रेडेंशियल चाहिए):

- लाइव सूट (मॉडल + Gateway टूल/इमेज probes): `pnpm test:live`
- एक लाइव फ़ाइल को शांतिपूर्वक लक्ष्य करें: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- रनटाइम प्रदर्शन रिपोर्ट: वास्तविक `openai/gpt-5.5` agent turn के लिए `live_openai_candidate=true` के साथ या Kova CPU/heap/trace artifacts के लिए `deep_profile=true` के साथ `OpenClaw Performance` dispatch करें। जब `CLAWGRIT_REPORTS_TOKEN` कॉन्फ़िगर हो, तो दैनिक scheduled रन mock-provider, deep-profile, और GPT 5.5 लेन artifacts को `openclaw/clawgrit-reports` पर publish करते हैं। mock-provider रिपोर्ट में source-level Gateway boot, memory, plugin-pressure, repeated fake-model hello-loop, और CLI startup numbers भी शामिल हैं।
- Docker लाइव मॉडल sweep: `pnpm test:docker:live-models`
  - हर चुना गया मॉडल अब एक text turn और एक छोटा file-read-style probe चलाता है। जिन मॉडलों का metadata `image` input विज्ञापित करता है, वे एक छोटा image turn भी चलाते हैं। प्रोवाइडर विफलताओं को अलग करते समय अतिरिक्त probes को `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` या `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` से अक्षम करें।
  - CI कवरेज: दैनिक `OpenClaw Scheduled Live And E2E Checks` और मैनुअल `OpenClaw Release Checks` दोनों reusable live/E2E workflow को `include_live_suites: true` के साथ कॉल करते हैं, जिसमें provider द्वारा sharded अलग Docker live model matrix jobs शामिल हैं।
  - केंद्रित CI reruns के लिए, `OpenClaw Live And E2E Checks (Reusable)` को `include_live_suites: true` और `live_models_only: true` के साथ dispatch करें।
  - नए high-signal provider secrets को `scripts/ci-hydrate-live-auth.sh` और `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` तथा उसके scheduled/release callers में जोड़ें।
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server path के विरुद्ध Docker live lane चलाता है, `/codex bind` के साथ synthetic Slack DM bind करता है, `/codex fast` और `/codex permissions` exercise करता है, फिर ACP के बजाय native Plugin binding के माध्यम से plain reply और image attachment route सत्यापित करता है।
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - plugin-owned Codex app-server harness के माध्यम से Gateway agent turns चलाता है, `/codex status` और `/codex models` सत्यापित करता है, और डिफ़ॉल्ट रूप से image, Cron MCP, sub-agent, और Guardian probes exercise करता है। अन्य Codex app-server विफलताओं को अलग करते समय sub-agent probe को `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` से अक्षम करें। केंद्रित sub-agent जांच के लिए, अन्य probes अक्षम करें:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    यह sub-agent probe के बाद बाहर निकलता है, जब तक कि `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` सेट न हो।
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - packaged OpenClaw tarball को Docker में install करता है, OpenAI API-key प्रारंभिक सेटअप चलाता है, और सत्यापित करता है कि Codex Plugin तथा `@openai/codex` dependency मांग पर managed npm project root में डाउनलोड हुईं।
- Live Plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - वास्तविक `slugify` dependency के साथ fixture Plugin pack करता है, उसे `npm-pack:` के माध्यम से install करता है, managed npm project root के तहत dependency सत्यापित करता है, फिर live OpenAI model से Plugin tool call करने और hidden slug लौटाने को कहता है।
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command सतह के लिए opt-in belt-and-suspenders जांच। यह `/crestodian status` exercise करता है, persistent model change queue करता है, `/crestodian yes` reply करता है, और audit/config write path सत्यापित करता है।
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - configless container में Crestodian को `PATH` पर fake Claude CLI के साथ चलाता है और सत्यापित करता है कि fuzzy planner fallback audited typed config write में translate होता है।
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - खाली OpenClaw state dir से शुरू करता है, modern onboard Crestodian entrypoint सत्यापित करता है, setup/model/agent/Discord Plugin + SecretRef writes लागू करता है, config validate करता है, और audit entries सत्यापित करता है। वही Ring 0 setup path QA Lab में भी `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` द्वारा कवर है।
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` सेट होने पर, `openclaw models list --provider moonshot --json` चलाएँ, फिर `moonshot/kimi-k2.6` के विरुद्ध isolated `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` चलाएँ। सत्यापित करें कि JSON Moonshot/K2.6 रिपोर्ट करता है और assistant transcript normalized `usage.cost` संग्रहीत करता है।

<Tip>
जब आपको केवल एक विफल मामला चाहिए, तो नीचे वर्णित allowlist env vars के माध्यम से live tests को संकुचित करना प्राथमिकता दें।
</Tip>

## QA-विशिष्ट रनर

जब आपको QA-lab यथार्थवाद चाहिए, ये कमांड मुख्य परीक्षण सूट के साथ बैठते हैं:

CI QA Lab को dedicated workflows में चलाता है। Agentic parity `QA-Lab - All Lanes` और release validation के तहत nested है, standalone PR workflow नहीं। व्यापक validation को `rerun_group=qa-parity` या release-checks QA group के साथ `Full Release Validation` का उपयोग करना चाहिए। Stable/default release checks exhaustive live/Docker soak को `run_release_soak=true` के पीछे रखते हैं; `full` profile soak को force करता है। `QA-Lab - All Lanes` `main` पर nightly और manual dispatch से mock parity lane, live Matrix lane, Convex-managed live Telegram lane, और Convex-managed live Discord lane को parallel jobs के रूप में चलाता है। Scheduled QA और release checks Matrix `--profile fast` को स्पष्ट रूप से pass करते हैं, जबकि Matrix CLI और manual workflow input default `all` बने रहते हैं; manual dispatch `all` को `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, और `e2ee-cli` jobs में shard कर सकता है। `OpenClaw Release Checks` release approval से पहले parity plus fast Matrix और Telegram lanes चलाता है, release transport checks के लिए `mock-openai/gpt-5.5` का उपयोग करते हुए ताकि वे deterministic रहें और सामान्य provider-plugin startup से बचें। ये live transport gateways memory search अक्षम करते हैं; memory behavior QA parity suites द्वारा कवर रहता है।

Full release live media shards `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` का उपयोग करते हैं, जिसमें पहले से `ffmpeg` और `ffprobe` हैं। Docker live model/backend shards चयनित commit पर एक बार built shared `ghcr.io/openclaw/openclaw-live-test:<sha>` image का उपयोग करते हैं, फिर हर shard में rebuild करने के बजाय उसे `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ pull करते हैं।

- `pnpm openclaw qa suite`
  - रेपो-समर्थित QA परिदृश्यों को सीधे होस्ट पर चलाता है।
  - चुने गए परिदृश्य सेट के लिए शीर्ष-स्तरीय `qa-evidence.json`, `qa-suite-summary.json`, और
    `qa-suite-report.md` आर्टिफैक्ट लिखता है, जिनमें
    मिश्रित flow, Vitest, और Playwright परिदृश्य चयन शामिल हैं।
  - जब `pnpm openclaw qa run --qa-profile <profile>` द्वारा डिस्पैच किया जाता है, तो
    चुने गए taxonomy profile scorecard को उसी `qa-evidence.json` में एम्बेड करता है।
    `smoke-ci` पतला evidence लिखता है, जो `evidenceMode: "slim"` सेट करता है और
    प्रति-एंट्री `execution` छोड़ देता है। `release` curated release-readiness slice को कवर करता है;
    `all` हर सक्रिय maturity category चुनता है और explicit QA
    Profile Evidence workflow dispatches के लिए है जब full scorecard artifact की
    जरूरत हो।
  - अलग-थलग gateway workers के साथ default रूप से कई चुने गए परिदृश्य समानांतर चलाता है।
    `qa-channel` concurrency 4 पर default होता है (चुने गए
    scenario count से सीमित)। worker
    count को tune करने के लिए `--concurrency <count>` उपयोग करें, या पुराने serial lane के लिए `--concurrency 1`।
  - किसी भी परिदृश्य के fail होने पर non-zero exit करता है। जब आप
    failing exit code के बिना artifacts चाहते हों तो `--allow-failures` उपयोग करें।
  - provider modes `live-frontier`, `mock-openai`, और `aimock` का समर्थन करता है।
    `aimock` experimental
    fixture और protocol-mock coverage के लिए local AIMock-backed provider server शुरू करता है, बिना scenario-aware
    `mock-openai` lane को बदलते हुए।
- `pnpm openclaw qa coverage --match <query>`
  - scenario IDs, titles, surfaces, coverage IDs, docs refs, code refs,
    plugins, और provider requirements खोजता है, फिर matching suite targets प्रिंट करता है।
  - QA Lab run से पहले इसका उपयोग करें जब आपको touched behavior या file path पता हो
    लेकिन सबसे छोटा scenario नहीं। यह केवल सलाहकारी है; फिर भी बदले जा रहे behavior से
    mock, live, Multipass, Matrix, या transport proof चुनें।
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab के माध्यम से live OpenAI Kitchen Sink plugin gauntlet चलाता है। यह
    external Kitchen Sink package install करता है, plugin SDK surface
    inventory सत्यापित करता है, `/healthz` और `/readyz` probe करता है, gateway CPU/RSS
    evidence रिकॉर्ड करता है, live OpenAI turn चलाता है, और adversarial diagnostics जांचता है।
    `OPENAI_API_KEY` जैसे live OpenAI auth की आवश्यकता होती है। hydrated Testbox
    sessions में, जब `openclaw-testbox-env` helper मौजूद हो तो यह अपने आप Testbox live-auth profile source करता है।
- `pnpm test:gateway:cpu-scenarios`
  - gateway startup bench और छोटा mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) चलाता है और combined CPU observation
    summary `.artifacts/gateway-cpu-scenarios/` के अंदर लिखता है।
  - default रूप से केवल sustained hot CPU observations flag करता है (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), इसलिए छोटे startup bursts metrics के रूप में रिकॉर्ड होते हैं
    बिना minutes-long gateway peg regression जैसे दिखे।
  - built `dist` artifacts उपयोग करता है; जब checkout में पहले से fresh runtime output न हो
    तो पहले build चलाएं।
- `pnpm openclaw qa suite --runner multipass`
  - वही QA suite disposable Multipass Linux VM के अंदर चलाता है।
  - host पर `qa suite` जैसी ही scenario-selection behavior रखता है।
  - `qa suite` जैसे ही provider/model selection flags फिर से उपयोग करता है।
  - Live runs guest के लिए व्यावहारिक supported QA auth inputs forward करते हैं:
    env-based provider keys, QA live provider config path, और `CODEX_HOME`
    जब मौजूद हो।
  - Output dirs repo root के अंदर ही रहने चाहिए ताकि guest mounted workspace के माध्यम से
    वापस लिख सके।
  - normal QA report + summary और Multipass logs
    `.artifacts/qa-e2e/...` के अंदर लिखता है।
- `pnpm qa:lab:up`
  - operator-style QA work के लिए Docker-backed QA site शुरू करता है।
- `pnpm test:docker:npm-onboard-channel-agent`
  - current checkout से npm tarball बनाता है, Docker में globally install करता है,
    non-interactive OpenAI API-key onboarding चलाता है, default रूप से Telegram
    configure करता है, startup
    dependency repair के बिना packaged plugin runtime load होना verify करता है, doctor चलाता है, और mocked OpenAI endpoint के विरुद्ध एक local agent turn चलाता है।
  - Discord के साथ वही packaged-install
    lane चलाने के लिए `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` उपयोग करें।
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context
    transcripts के लिए deterministic built-app Docker smoke चलाता है। यह verify करता है कि hidden OpenClaw runtime context visible user turn में leak होने के बजाय
    non-display custom message के रूप में persisted है,
    फिर affected broken session JSONL seed करता है और verify करता है कि
    `openclaw doctor --fix` उसे backup के साथ active branch में rewrite करता है।
- `pnpm test:docker:npm-telegram-live`
  - Docker में OpenClaw package candidate install करता है, installed-package
    onboarding चलाता है, installed CLI के माध्यम से Telegram configure करता है, फिर उस installed package को SUT Gateway के रूप में उपयोग करते हुए
    live Telegram QA lane फिर से उपयोग करता है।
  - wrapper checkout से केवल `qa-lab` harness source mount करता है; installed package
    `dist`, `openclaw/plugin-sdk`, और bundled plugin
    runtime का मालिक होता है ताकि lane current checkout plugins को test के अंतर्गत package में mix न करे।
  - default `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` होता है; registry से install करने के बजाय
    resolved local tarball test करने के लिए
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` या
    `OPENCLAW_CURRENT_PACKAGE_TGZ` सेट करें।
  - default रूप से `qa-evidence.json` में repeated RTT timing emit करता है, जिसमें
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` होता है। RTT run tune करने के लिए
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, या
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` override करें।
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` sample करने के लिए
    Telegram QA check IDs की comma-separated list स्वीकार करता है; unset होने पर default RTT-capable check
    `telegram-mentioned-message-reply` है।
  - `pnpm openclaw qa telegram` जैसे ही Telegram env credentials या Convex credential source उपयोग करता है।
    CI/release automation के लिए,
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` और role secret सेट करें। यदि
    `OPENCLAW_QA_CONVEX_SITE_URL` और Convex role secret CI में मौजूद हैं,
    तो Docker wrapper Convex अपने आप चुनता है।
  - Docker build/install work से पहले wrapper host पर Telegram या Convex credential env validate करता है।
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` केवल तब सेट करें
    जब जानबूझकर pre-credential setup debug कर रहे हों।
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` इस lane के लिए ही shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` override करता है। जब Convex credentials
    चुने जाते हैं और कोई role set नहीं होता, wrapper CI में `ci` और
    CI के बाहर `maintainer` उपयोग करता है।
  - GitHub Actions इस lane को manual maintainer workflow
    `NPM Telegram Beta E2E` के रूप में expose करता है। यह merge पर नहीं चलता। workflow
    `qa-live-shared` environment और Convex CI credential leases उपयोग करता है।
- GitHub Actions side-run product proof के लिए `Package Acceptance` भी expose करता है
  एक candidate package के विरुद्ध। यह trusted ref, published npm spec,
  HTTPS tarball URL plus SHA-256, या दूसरे run से tarball artifact स्वीकार करता है, normalized
  `openclaw-current.tgz` को `package-under-test` के रूप में upload करता है, फिर
  smoke, package, product, full, या custom
  lane profiles के साथ existing Docker E2E scheduler चलाता है। उसी `package-under-test` artifact के विरुद्ध
  Telegram QA workflow चलाने के लिए `telegram_mode=mock-openai` या `live-frontier` सेट करें।
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof को digest की आवश्यकता होती है और public URL safety policy उपयोग करता है:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private tarball mirrors explicit trusted-source policy उपयोग करते हैं:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` trusted workflow ref से `.github/package-trusted-sources.json` पढ़ता है और URL credentials या workflow-input private-network bypass स्वीकार नहीं करता। यदि named policy bearer auth declare करती है, तो fixed `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret configure करें।

- Artifact proof दूसरे Actions run से tarball artifact download करता है:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Docker में current OpenClaw build pack और install करता है, OpenAI configured के साथ Gateway
    शुरू करता है, फिर config
    edits के माध्यम से bundled channel/plugins enable करता है।
  - verify करता है कि setup discovery unconfigured downloadable plugins को absent छोड़ती है,
    पहला configured doctor repair हर missing downloadable
    plugin को explicitly install करता है, और दूसरा restart hidden dependency
    repair नहीं चलाता।
  - साथ ही known older npm baseline install करता है, `openclaw update --tag <candidate>` चलाने से पहले
    Telegram enable करता है, और verify करता है कि candidate का
    post-update doctor legacy plugin dependency debris को बिना
    harness-side postinstall repair के clean करता है।
- `pnpm test:parallels:npm-update`
  - Parallels guests के across native packaged-install update smoke चलाता है। हर
    चुना गया platform पहले requested baseline package install करता है, फिर उसी guest में
    installed `openclaw update` command चलाता है और
    installed version, update status, gateway readiness, और एक local agent
    turn verify करता है।
  - एक guest पर iterate करते समय `--platform macos`, `--platform windows`, या `--platform linux` उपयोग करें।
    summary artifact path और
    per-lane status के लिए `--json` उपयोग करें।
  - OpenAI lane default रूप से live agent-turn proof के लिए `openai/gpt-5.5` उपयोग करता है।
    किसी दूसरे OpenAI model को जानबूझकर validate करते समय
    `--model <provider/model>` पास करें या `OPENCLAW_PARALLELS_OPENAI_MODEL` सेट करें।
  - लंबे local runs को host timeout में wrap करें ताकि Parallels transport stalls
    testing window का बाकी हिस्सा consume न कर सकें:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script nested lane logs `/tmp/openclaw-parallels-npm-update.*` के अंदर लिखता है।
    outer wrapper के hung होने का अनुमान लगाने से पहले `windows-update.log`, `macos-update.log`, या `linux-update.log`
    inspect करें।
  - Windows update cold guest पर post-update doctor और package
    update work में 10 से 15 मिनट खर्च कर सकता है; nested npm
    debug log advance हो रहा हो तो यह अभी भी healthy है।
  - इस aggregate wrapper को individual Parallels
    macOS, Windows, या Linux smoke lanes के साथ parallel में न चलाएं। वे VM state share करते हैं और
    snapshot restore, package serving, या guest gateway state पर collide कर सकते हैं।
  - post-update proof normal bundled plugin surface चलाता है क्योंकि
    speech, image generation, और media
    understanding जैसी capability facades bundled runtime APIs के माध्यम से loaded होती हैं, भले ही agent
    turn स्वयं केवल simple text response check करे।

- `pnpm openclaw qa aimock`
  - सीधे protocol smoke परीक्षण के लिए केवल local AIMock provider server शुरू करता है.
- `pnpm openclaw qa matrix`
  - Disposable Docker-backed Tuwunel homeserver के विरुद्ध Matrix live QA lane चलाता है. केवल source-checkout - packaged installs में `qa-lab` ship नहीं होता.
  - पूरा CLI, profile/scenario catalog, env vars, और artifact layout: [Matrix QA](/hi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env से driver और SUT bot tokens का उपयोग करके वास्तविक private group के विरुद्ध Telegram live QA lane चलाता है.
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, और `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` आवश्यक हैं. group id numeric Telegram chat id होना चाहिए.
  - Shared pooled credentials के लिए `--credential-source convex` का समर्थन करता है. default रूप से env mode का उपयोग करें, या pooled leases में opt in करने के लिए `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` सेट करें.
  - Defaults में canary, mention gating, command addressing, `/status`, bot-to-bot mentioned replies, और core native command replies शामिल हैं. `mock-openai` defaults deterministic reply-chain और Telegram final-message streaming regressions को भी cover करते हैं. `session_status` जैसे optional probes के लिए `--list-scenarios` का उपयोग करें.
  - कोई भी scenario fail होने पर non-zero exit करता है. जब आप failing exit code के बिना artifacts चाहते हों, तो `--allow-failures` का उपयोग करें.
  - एक ही private group में दो अलग-अलग bots आवश्यक हैं, जिनमें SUT bot Telegram username expose करता हो.
  - Stable bot-to-bot observation के लिए, दोनों bots के लिए `@BotFather` में Bot-to-Bot Communication Mode enable करें और सुनिश्चित करें कि driver bot group bot traffic observe कर सकता है.
  - `.artifacts/qa-e2e/...` के अंतर्गत Telegram QA report, summary, और `qa-evidence.json` लिखता है. Replying scenarios में driver send request से observed SUT reply तक RTT शामिल होता है.

`Mantis Telegram Live` इस lane के चारों ओर PR-evidence wrapper है. यह
candidate ref को Convex-leased Telegram credentials के साथ चलाता है, redacted QA
report/evidence bundle को Crabbox desktop browser में render करता है, MP4 evidence record करता है,
motion-trimmed GIF generate करता है, artifact bundle upload करता है, और `pr_number` सेट होने पर Mantis GitHub App के माध्यम से inline PR
evidence post करता है. Maintainers इसे Actions UI से `Mantis Scenario` (`scenario_id:
telegram-live`) के माध्यम से या सीधे pull request comment से शुरू कर सकते हैं:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` PR visual proof के लिए agentic native Telegram Desktop
before/after wrapper है. इसे Actions UI से
freeform `instructions` के साथ, `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) के माध्यम से, या PR comment से शुरू करें:

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent PR पढ़ता है, तय करता है कि कौन सा Telegram-visible behavior बदलाव को prove करता है,
baseline और candidate refs पर real-user Crabbox Telegram Desktop proof lane चलाता है,
native GIFs उपयोगी होने तक iterate करता है, paired
`motionPreview` manifest लिखता है, और `pr_number` सेट होने पर Mantis GitHub App के माध्यम से वही 2-column GIF table post करता है.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux desktop lease या reuse करता है, native Telegram Desktop install करता है, leased Telegram SUT bot token के साथ OpenClaw configure करता है, gateway शुरू करता है, और visible VNC desktop से screenshot/MP4 evidence record करता है.
  - Default `--credential-source convex` है ताकि workflows को केवल Convex broker secret की आवश्यकता हो. `pnpm openclaw qa telegram` जैसे ही `OPENCLAW_QA_TELEGRAM_*` variables के साथ `--credential-source env` का उपयोग करें.
  - Telegram Desktop को अभी भी user login/profile चाहिए. bot token केवल OpenClaw configure करता है. base64 `.tgz` profile archive के लिए `--telegram-profile-archive-env <name>` का उपयोग करें, या `--keep-lease` का उपयोग करके VNC के माध्यम से एक बार manually log in करें.
  - Output directory के अंतर्गत `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, और `telegram-desktop-builder.mp4` लिखता है.

Live transport lanes एक standard contract साझा करती हैं ताकि नए transports drift न करें; per-lane coverage matrix [QA overview → Live transport coverage](/hi/concepts/qa-e2e-automation#live-transport-coverage) में है. `qa-channel` broad synthetic suite है और उस matrix का हिस्सा नहीं है.

### Convex के माध्यम से साझा Telegram credentials (v1)

जब live transport QA के लिए `--credential-source convex` (या `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) enabled होता है,
QA lab Convex-backed pool से exclusive lease acquire करता है, lane चलने के दौरान उस
lease को heartbeat करता है, और shutdown पर lease release करता है. Section name
Discord, Slack, और WhatsApp support से पहले का है; lease contract सभी kinds में shared है.

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

Required env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (उदाहरण के लिए `https://your-deployment.convex.site`)
- Selected role के लिए एक secret:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` `maintainer` के लिए
  - `OPENCLAW_QA_CONVEX_SECRET_CI` `ci` के लिए
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI में default `ci`, अन्यथा `maintainer`)

Optional env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optional trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` local-only development के लिए loopback `http://` Convex URLs allow करता है.

सामान्य operation में `OPENCLAW_QA_CONVEX_SITE_URL` को `https://` उपयोग करना चाहिए.

Maintainer admin commands (pool add/remove/list) के लिए
विशेष रूप से `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` आवश्यक है.

Maintainers के लिए CLI helpers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Live runs से पहले Convex site URL, broker secrets,
endpoint prefix, HTTP timeout, और admin/list reachability को secret values print किए बिना check करने के लिए `doctor` का उपयोग करें. Scripts और CI
utilities में machine-readable output के लिए `--json` का उपयोग करें.

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
  - Success: `{ status: "ok" }` (या empty `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }` (या empty `2xx`)
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
- `groupId` numeric Telegram chat id string होना चाहिए.
- `admin/add` `kind: "telegram"` के लिए इस shape को validate करता है और malformed payloads reject करता है.

Telegram real-user kind के लिए payload shape:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, और `telegramApiId` numeric strings होने चाहिए.
- `tdlibArchiveSha256` और `desktopTdataArchiveSha256` SHA-256 hex strings होने चाहिए.
- `kind: "telegram-user"` Mantis Telegram Desktop proof workflow के लिए reserved है. Generic QA Lab lanes को इसे acquire नहीं करना चाहिए.

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes भी pool से lease कर सकती हैं, लेकिन Slack payload validation अभी
broker के बजाय Slack QA runner में रहता है. Slack rows के लिए
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
का उपयोग करें.

### QA में channel जोड़ना

नए channel adapters के लिए architecture और scenario-helper names [QA overview → Adding a channel](/hi/concepts/qa-e2e-automation#adding-a-channel) में हैं. Minimum bar: shared `qa-lab` host seam पर transport runner implement करें, plugin manifest में `qaRunners` declare करें, `openclaw qa <runner>` के रूप में mount करें, और `qa/scenarios/` के अंतर्गत scenarios author करें.

## Test suites (कहाँ क्या चलता है)

Suites को "बढ़ता realism" (और बढ़ती flakiness/cost) के रूप में सोचें:

### Unit / integration (default)

- Command: `pnpm test`
- Config: untargeted runs `vitest.full-*.config.ts` shard set का उपयोग करते हैं और parallel scheduling के लिए multi-project shards को per-project configs में expand कर सकते हैं
- Files: `src/**/*.test.ts`, `packages/**/*.test.ts`, और `test/**/*.test.ts` के अंतर्गत core/unit inventories; UI unit tests dedicated `unit-ui` shard में चलते हैं
- Scope:
  - Pure unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Known bugs के लिए deterministic regressions
- Expectations:
  - CI में चलता है
  - Real keys आवश्यक नहीं
  - Fast और stable होना चाहिए
  - Resolver और public-surface loader tests को generated tiny plugin fixtures के साथ broad `api.js` और
    `runtime-api.js` fallback behavior prove करना चाहिए, real bundled plugin source APIs के साथ नहीं. Real plugin API loads
    plugin-owned contract/integration suites में होने चाहिए.

Native dependency policy:

- Default test installs optional native Discord opus builds skip करते हैं. Discord voice bundled `libopus-wasm` का उपयोग करता है, और `@discordjs/opus` `allowBuilds` में disabled रहता है ताकि local tests और Testbox lanes native addon compile न करें.
- Native opus performance की तुलना `libopus-wasm` benchmark repo में करें, default OpenClaw install/test loops में नहीं. Default `allowBuilds` में `@discordjs/opus` को `true` पर set न करें; इससे unrelated install/test loops native code compile करते हैं.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - बिना लक्ष्य वाला `pnpm test` एक विशाल नेटिव रूट-प्रोजेक्ट प्रक्रिया के बजाय बारह छोटे shard configs (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) चलाता है। इससे लोडेड मशीनों पर पीक RSS घटता है और auto-reply/extension कार्य असंबंधित suites को भूखा रखने से बचता है।
    - `pnpm test --watch` अब भी नेटिव रूट `vitest.config.ts` प्रोजेक्ट ग्राफ का उपयोग करता है, क्योंकि multi-shard watch loop व्यावहारिक नहीं है।
    - `pnpm test`, `pnpm test:watch`, और `pnpm test:perf:imports` स्पष्ट फ़ाइल/डायरेक्टरी लक्ष्यों को पहले scoped lanes से रूट करते हैं, इसलिए `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` को पूरे रूट प्रोजेक्ट startup tax की कीमत नहीं चुकानी पड़ती।
    - `pnpm test:changed` बदले हुए git paths को डिफ़ॉल्ट रूप से सस्ते scoped lanes में फैलाता है: direct test edits, sibling `*.test.ts` फ़ाइलें, स्पष्ट source mappings, और local import-graph dependents। Config/setup/package edits व्यापक tests नहीं चलाते, जब तक आप स्पष्ट रूप से `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` का उपयोग न करें।
    - `pnpm check:changed` संकरे काम के लिए सामान्य smart local check gate है। यह diff को core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, और tooling में वर्गीकृत करता है, फिर मेल खाते typecheck, lint, और guard commands चलाता है। यह Vitest tests नहीं चलाता; test proof के लिए `pnpm test:changed` या स्पष्ट `pnpm test <target>` चलाएँ। केवल release metadata वाले version bumps targeted version/config/root-dependency checks चलाते हैं, एक guard के साथ जो top-level version field के बाहर package changes को अस्वीकार करता है।
    - Live Docker ACP harness edits focused checks चलाते हैं: live Docker auth scripts के लिए shell syntax और live Docker scheduler dry-run। `package.json` changes केवल तब शामिल होते हैं जब diff `scripts["test:docker:live-*"]` तक सीमित हो; dependency, export, version, और अन्य package-surface edits अब भी व्यापक guards का उपयोग करते हैं।
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk`, और समान pure utility areas से import-light unit tests `unit-fast` lane से रूट होते हैं, जो `test/setup-openclaw-runtime.ts` को छोड़ देता है; stateful/runtime-heavy फ़ाइलें मौजूदा lanes पर रहती हैं।
    - चुनी हुई `plugin-sdk` और `commands` helper source files भी changed-mode runs को उन light lanes में स्पष्ट sibling tests से map करती हैं, ताकि helper edits उस directory के लिए पूरे heavy suite को फिर से चलाने से बचें।
    - `auto-reply` में top-level core helpers, top-level `reply.*` integration tests, और `src/auto-reply/reply/**` subtree के लिए समर्पित buckets हैं। CI reply subtree को agent-runner, dispatch, और commands/state-routing shards में और विभाजित करता है ताकि एक import-heavy bucket पूरे Node tail का मालिक न बने।
    - सामान्य PR/main CI जानबूझकर extension batch sweep और release-only `agentic-plugins` shard को छोड़ता है। Full Release Validation release candidates पर उन plugin/extension-heavy suites के लिए अलग `Plugin Prerelease` child workflow dispatch करता है।

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - जब आप message-tool discovery inputs या compaction runtime
      context बदलें, coverage के दोनों स्तर बनाए रखें।
    - pure routing और normalization boundaries के लिए focused helper regressions
      जोड़ें।
    - embedded runner integration suites को स्वस्थ रखें:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, और
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`।
    - ये suites सत्यापित करते हैं कि scoped ids और compaction behavior अब भी
      वास्तविक `run.ts` / `compact.ts` paths से होकर बहते हैं; केवल helper tests
      उन integration paths का पर्याप्त विकल्प नहीं हैं।

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Base Vitest config डिफ़ॉल्ट रूप से `threads` पर सेट है।
    - shared Vitest config `isolate: false` को स्थिर करता है और root projects,
      e2e, और live configs में non-isolated runner का उपयोग करता है।
    - root UI lane अपना `jsdom` setup और optimizer बनाए रखता है, लेकिन वह भी
      shared non-isolated runner पर चलता है।
    - हर `pnpm test` shard shared Vitest config से वही `threads` + `isolate: false`
      defaults विरासत में लेता है।
    - `scripts/run-vitest.mjs` बड़े local runs के दौरान V8 compile churn घटाने के लिए
      Vitest child Node processes में डिफ़ॉल्ट रूप से `--no-maglev` जोड़ता है।
      stock V8 behavior से तुलना करने के लिए `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      सेट करें।
    - `scripts/run-vitest.mjs` स्पष्ट non-watch Vitest runs को 5 मिनट तक stdout
      या stderr output न आने पर समाप्त कर देता है। जानबूझकर silent investigation
      के लिए watchdog को बंद करने हेतु `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`
      सेट करें।

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` दिखाता है कि diff किन architectural lanes को trigger करता है।
    - pre-commit hook केवल formatting करता है। यह formatted files को फिर से stage करता है और
      lint, typecheck, या tests नहीं चलाता।
    - handoff या push से पहले, जब smart local check gate चाहिए, तो `pnpm check:changed`
      स्पष्ट रूप से चलाएँ।
    - `pnpm test:changed` डिफ़ॉल्ट रूप से सस्ते scoped lanes से रूट करता है। `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`
      केवल तब उपयोग करें जब agent निर्णय करे कि किसी harness, config, package, या contract edit को सच में व्यापक
      Vitest coverage चाहिए।
    - `pnpm test:max` और `pnpm test:changed:max` वही routing behavior रखते हैं,
      बस worker cap अधिक होता है।
    - Local worker auto-scaling जानबूझकर conservative है और host load average पहले से अधिक होने पर
      पीछे हटता है, इसलिए कई concurrent Vitest runs डिफ़ॉल्ट रूप से कम नुकसान करते हैं।
    - base Vitest config projects/config files को `forceRerunTriggers` के रूप में चिह्नित करता है
      ताकि test wiring बदलने पर changed-mode reruns सही रहें।
    - config समर्थित hosts पर `OPENCLAW_VITEST_FS_MODULE_CACHE` enabled रखता है;
      यदि direct profiling के लिए एक स्पष्ट cache location चाहिए, तो `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      सेट करें।

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` Vitest import-duration reporting और import-breakdown output enabled करता है।
    - `pnpm test:perf:imports:changed` वही profiling view `origin/main` के बाद बदली फ़ाइलों तक scoped करता है।
    - Shard timing data `.artifacts/vitest-shard-timings.json` में लिखा जाता है।
      Whole-config runs key के रूप में config path का उपयोग करते हैं; include-pattern CI
      shards shard name जोड़ते हैं ताकि filtered shards को अलग से track किया जा सके।
    - जब एक hot test अब भी अपना अधिकांश समय startup imports में खर्च करता है,
      heavy dependencies को संकरे local `*.runtime.ts` seam के पीछे रखें और उस seam को सीधे mock करें,
      runtime helpers को केवल `vi.mock(...)` से pass कराने के लिए deep-import न करें।
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` उस committed
      diff के लिए routed `test:changed` की तुलना native root-project path से करता है और wall time तथा macOS max RSS प्रिंट करता है।
    - `pnpm test:perf:changed:bench -- --worktree` current
      dirty tree को benchmark करता है, changed file list को
      `scripts/test-projects.mjs` और root Vitest config से रूट करके।
    - `pnpm test:perf:profile:main` Vitest/Vite startup और transform overhead के लिए
      main-thread CPU profile लिखता है।
    - `pnpm test:perf:profile:runner` file parallelism disabled के साथ unit suite के लिए
      runner CPU+heap profiles लिखता है।

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Command: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, एक worker पर forced
- Scope:
  - diagnostics डिफ़ॉल्ट रूप से enabled रखते हुए वास्तविक loopback Gateway शुरू करता है
  - diagnostic event path से synthetic gateway message, memory, और large-payload churn चलाता है
  - Gateway WS RPC पर `diagnostics.stability` query करता है
  - diagnostic stability bundle persistence helpers cover करता है
  - Assert करता है कि recorder bounded रहता है, synthetic RSS samples pressure budget के नीचे रहते हैं, और per-session queue depths वापस zero तक drain हो जाते हैं
- Expectations:
  - CI-safe और keyless
  - stability-regression follow-up के लिए narrow lane, पूरे Gateway suite का विकल्प नहीं

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
  - Vitest `threads` का उपयोग करता है, `isolate: false` के साथ, repo के बाकी हिस्से से मेल खाते हुए।
  - adaptive workers का उपयोग करता है (CI: 2 तक, local: डिफ़ॉल्ट रूप से 1)।
  - console I/O overhead घटाने के लिए डिफ़ॉल्ट रूप से silent mode में चलता है।
- Useful overrides:
  - worker count force करने के लिए `OPENCLAW_E2E_WORKERS=<n>` (16 पर capped)।
  - verbose console output फिर से enabled करने के लिए `OPENCLAW_E2E_VERBOSE=1`।
- Scope:
  - Multi-instance gateway end-to-end behavior
  - WebSocket/HTTP surfaces, node pairing, और heavier networking
- Expectations:
  - CI में चलता है (जब pipeline में enabled हो)
  - वास्तविक keys आवश्यक नहीं
  - unit tests से अधिक moving parts (धीमा हो सकता है)

### E2E (Control UI mocked browser)

- Command: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Files: `ui/src/**/*.e2e.test.ts`
- Scope:
  - Vite Control UI शुरू करता है
  - Playwright के माध्यम से वास्तविक Chromium page चलाता है
  - Gateway WebSocket को deterministic in-browser mocks से बदलता है
- Expectations:
  - `pnpm test:e2e` के हिस्से के रूप में CI में चलता है
  - वास्तविक Gateway, agents, या provider keys आवश्यक नहीं
  - Browser dependency मौजूद होनी चाहिए (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - सक्रिय local OpenShell gateway का पुन: उपयोग करता है
  - temporary local Dockerfile से sandbox बनाता है
  - वास्तविक `sandbox ssh-config` + SSH exec पर OpenClaw के OpenShell backend का अभ्यास करता है
  - sandbox fs bridge के माध्यम से remote-canonical filesystem behavior सत्यापित करता है
- Expectations:
  - केवल opt-in; default `pnpm test:e2e` run का हिस्सा नहीं
  - local `openshell` CLI और working Docker daemon आवश्यक हैं
  - सक्रिय local OpenShell gateway और उसका config source आवश्यक है
  - isolated `HOME` / `XDG_CONFIG_HOME` का उपयोग करता है, फिर test sandbox को नष्ट करता है
- Useful overrides:
  - broader e2e suite manually चलाते समय test enabled करने के लिए `OPENCLAW_E2E_OPENSHELL=1`
  - non-default CLI binary या wrapper script की ओर point करने के लिए `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - registered gateway config को isolated test में expose करने के लिए `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture द्वारा उपयोग किए जाने वाले Docker gateway IP को override करने के लिए `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live (real providers + real models)

- कमांड: `pnpm test:live`
- कॉन्फ़िग: `vitest.live.config.ts`
- फ़ाइलें: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, और `extensions/` के अंतर्गत बंडल किए गए Plugin लाइव टेस्ट
- डिफ़ॉल्ट: `pnpm test:live` द्वारा **सक्षम** (`OPENCLAW_LIVE_TEST=1` सेट करता है)
- दायरा:
  - "क्या यह प्रदाता/मॉडल वास्तविक क्रेडेंशियल्स के साथ _आज_ सच में काम करता है?"
  - प्रदाता फ़ॉर्मैट बदलाव, टूल-कॉलिंग की बारीकियां, ऑथ समस्याएं, और रेट लिमिट व्यवहार पकड़ना
- अपेक्षाएं:
  - डिज़ाइन के अनुसार CI-स्थिर नहीं (वास्तविक नेटवर्क, वास्तविक प्रदाता नीतियां, कोटा, आउटेज)
  - पैसे खर्च करता है / रेट लिमिट का उपयोग करता है
  - "सब कुछ" के बजाय सीमित उपसमुच्चय चलाना बेहतर है
- लाइव रन पहले से एक्सपोर्ट की गई API कुंजियों और स्टेज किए गए ऑथ प्रोफ़ाइलों का उपयोग करते हैं।
- डिफ़ॉल्ट रूप से, लाइव रन फिर भी `HOME` को अलग रखते हैं और कॉन्फ़िग/ऑथ सामग्री को एक अस्थायी टेस्ट होम में कॉपी करते हैं ताकि यूनिट फ़िक्स्चर आपके वास्तविक `~/.openclaw` को बदल न सकें।
- `OPENCLAW_LIVE_USE_REAL_HOME=1` केवल तब सेट करें जब आप जानबूझकर चाहते हों कि लाइव टेस्ट आपकी वास्तविक होम डायरेक्टरी का उपयोग करें।
- `pnpm test:live` डिफ़ॉल्ट रूप से अधिक शांत मोड पर रहता है: यह `[live] ...` प्रगति आउटपुट रखता है और Gateway बूटस्ट्रैप लॉग/Bonjour शोर को म्यूट करता है। यदि आप पूरे स्टार्टअप लॉग वापस चाहते हैं, तो `OPENCLAW_LIVE_TEST_QUIET=0` सेट करें।
- API कुंजी रोटेशन (प्रदाता-विशिष्ट): कॉमा/सेमीकोलन फ़ॉर्मैट में `*_API_KEYS` या `*_API_KEY_1`, `*_API_KEY_2` सेट करें (उदाहरण के लिए `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) या `OPENCLAW_LIVE_*_KEY` के ज़रिए प्रति-लाइव ओवरराइड करें; टेस्ट रेट लिमिट प्रतिक्रियाओं पर फिर से प्रयास करते हैं।
- प्रगति/Heartbeat आउटपुट:
  - लाइव सूट अब stderr पर प्रगति पंक्तियां उत्सर्जित करते हैं ताकि लंबे प्रदाता कॉल स्पष्ट रूप से सक्रिय दिखें, भले ही Vitest कंसोल कैप्चर शांत हो।
  - `vitest.live.config.ts` Vitest कंसोल इंटरसेप्शन को अक्षम करता है ताकि लाइव रन के दौरान प्रदाता/Gateway प्रगति पंक्तियां तुरंत स्ट्रीम हों।
  - डायरेक्ट-मॉडल Heartbeat को `OPENCLAW_LIVE_HEARTBEAT_MS` से ट्यून करें।
  - Gateway/प्रोब Heartbeat को `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` से ट्यून करें।

## मुझे कौन-सा सूट चलाना चाहिए?

यह निर्णय तालिका उपयोग करें:

- लॉजिक/टेस्ट संपादित करना: `pnpm test` चलाएं (और यदि आपने बहुत कुछ बदला है तो `pnpm test:coverage`)
- Gateway नेटवर्किंग / WS प्रोटोकॉल / पेयरिंग को छूना: `pnpm test:e2e` जोड़ें
- "मेरा बॉट डाउन है" / प्रदाता-विशिष्ट विफलताओं / टूल कॉलिंग की डिबगिंग: सीमित `pnpm test:live` चलाएं

## लाइव (नेटवर्क-छूने वाले) टेस्ट

लाइव मॉडल मैट्रिक्स, CLI बैकएंड स्मोक्स, ACP स्मोक्स, Codex ऐप-सर्वर
हार्नेस, और सभी मीडिया-प्रदाता लाइव टेस्ट (Deepgram, BytePlus, ComfyUI, इमेज,
म्यूज़िक, वीडियो, मीडिया हार्नेस) - साथ ही लाइव रन के लिए क्रेडेंशियल हैंडलिंग - के लिए
[लाइव सूट टेस्ट करना](/hi/help/testing-live) देखें। समर्पित अपडेट और
Plugin वैलिडेशन चेकलिस्ट के लिए
[अपडेट और Plugin टेस्ट करना](/hi/help/testing-updates-plugins) देखें।

## Docker रनर (वैकल्पिक "Linux में काम करता है" चेक)

ये Docker रनर दो बकेट में बंटते हैं:

- लाइव-मॉडल रनर: `test:docker:live-models` और `test:docker:live-gateway` repo Docker इमेज के अंदर केवल अपनी मेल खाती profile-key लाइव फ़ाइल चलाते हैं (`src/agents/models.profiles.live.test.ts` और `src/gateway/gateway-models.profiles.live.test.ts`), आपकी स्थानीय कॉन्फ़िग डायरेक्टरी, वर्कस्पेस, और वैकल्पिक प्रोफ़ाइल env फ़ाइल माउंट करते हुए। मेल खाते स्थानीय एंट्रीपॉइंट `test:live:models-profiles` और `test:live:gateway-profiles` हैं।
- Docker लाइव रनर जहां आवश्यक हो अपने व्यावहारिक कैप रखते हैं:
  `test:docker:live-models` डिफ़ॉल्ट रूप से चुने हुए समर्थित हाई-सिग्नल सेट पर रहता है, और
  `test:docker:live-gateway` डिफ़ॉल्ट रूप से `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, और
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` पर रहता है। जब आप स्पष्ट रूप से छोटा कैप या बड़ा स्कैन चाहते हैं, तो `OPENCLAW_LIVE_MAX_MODELS`
  या Gateway env vars सेट करें।
- `test:docker:all` `test:docker:live-build` के ज़रिए लाइव Docker इमेज को एक बार बनाता है, `scripts/package-openclaw-for-docker.mjs` के माध्यम से OpenClaw को npm tarball के रूप में एक बार पैक करता है, फिर दो `scripts/e2e/Dockerfile` इमेज बनाता/फिर से उपयोग करता है। बेयर इमेज केवल install/update/plugin-dependency लेन के लिए Node/Git रनर है; वे लेन पहले से बने tarball को माउंट करते हैं। फ़ंक्शनल इमेज built-app कार्यक्षमता लेन के लिए उसी tarball को `/app` में इंस्टॉल करती है। Docker लेन परिभाषाएं `scripts/lib/docker-e2e-scenarios.mjs` में रहती हैं; प्लानर लॉजिक `scripts/lib/docker-e2e-plan.mjs` में रहता है; `scripts/test-docker-all.mjs` चयनित प्लान चलाता है। एग्रीगेट weighted स्थानीय scheduler का उपयोग करता है: `OPENCLAW_DOCKER_ALL_PARALLELISM` process slots नियंत्रित करता है, जबकि resource caps heavy live, npm-install, और multi-service lanes को एक साथ शुरू होने से रोकते हैं। यदि कोई एकल lane active caps से भारी है, तो scheduler pool empty होने पर फिर भी उसे शुरू कर सकता है और फिर capacity फिर से उपलब्ध होने तक उसे अकेले running रखता है। डिफ़ॉल्ट 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, और `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` हैं; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` या `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` केवल तब ट्यून करें जब Docker host के पास अधिक headroom हो। runner default रूप से Docker preflight करता है, stale OpenClaw E2E containers हटाता है, हर 30 seconds में status print करता है, successful lane timings को `.artifacts/docker-tests/lane-timings.json` में stores करता है, और later runs पर longer lanes पहले शुरू करने के लिए उन timings का उपयोग करता है। Docker build या run किए बिना weighted lane manifest print करने के लिए `OPENCLAW_DOCKER_ALL_DRY_RUN=1` उपयोग करें, या selected lanes, package/image needs, और credentials के लिए CI plan print करने हेतु `node scripts/test-docker-all.mjs --plan-json` उपयोग करें।
- `Package Acceptance` "क्या यह installable tarball product के रूप में काम करता है?" के लिए GitHub-native package gate है। यह `source=npm`, `source=ref`, `source=url`, या `source=artifact` से एक candidate package resolve करता है, उसे `package-under-test` के रूप में upload करता है, फिर selected ref को repack करने के बजाय उसी exact tarball के खिलाफ reusable Docker E2E lanes चलाता है। Profiles breadth के हिसाब से ordered हैं: `smoke`, `package`, `product`, और `full`। package/update/plugin contract, published-upgrade survivor matrix, release defaults, और failure triage के लिए [अपडेट और Plugin टेस्ट करना](/hi/help/testing-updates-plugins) देखें।
- Build और release checks tsdown के बाद `scripts/check-cli-bootstrap-imports.mjs` चलाते हैं। guard `dist/entry.js` और `dist/cli/run-main.js` से static built graph walk करता है और fail करता है यदि pre-dispatch startup command dispatch से पहले Commander, prompt UI, undici, या logging जैसे package dependencies import करता है; यह bundled Gateway run chunk को budget के भीतर भी रखता है और known cold Gateway paths के static imports reject करता है। Packaged CLI smoke root help, onboard help, doctor help, status, config schema, और model-list command भी cover करता है।
- Package Acceptance legacy compatibility `2026.4.25` (`2026.4.25-beta.*` शामिल) पर capped है। उस cutoff तक, harness केवल shipped-package metadata gaps tolerate करता है: omitted private QA inventory entries, missing `gateway install --wrapper`, tarball-derived git fixture में missing patch files, missing persisted `update.channel`, legacy plugin install-record locations, missing marketplace install-record persistence, और `plugins update` के दौरान config metadata migration। `2026.4.25` के बाद के packages के लिए, ये paths strict failures हैं।
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, और `test:docker:config-reload` एक या अधिक वास्तविक containers boot करते हैं और higher-level integration paths verify करते हैं।
- Docker/Bash E2E lanes जो packed OpenClaw tarball को `scripts/lib/openclaw-e2e-instance.sh` के ज़रिए install करते हैं, `npm install` को `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` पर cap करते हैं (default `600s`; debugging के लिए wrapper disable करने हेतु `0` set करें)।

लाइव-मॉडल Docker रनर केवल आवश्यक CLI auth homes (या run narrowed न होने पर सभी supported ones) को bind-mount भी करते हैं, फिर run से पहले उन्हें container home में copy करते हैं ताकि external-CLI OAuth host auth store को mutate किए बिना tokens refresh कर सके:

- डायरेक्ट मॉडल: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; default रूप से Claude, Codex, और Gemini cover करता है, strict Droid/OpenCode coverage `pnpm test:docker:live-acp-bind:droid` और `pnpm test:docker:live-acp-bind:opencode` के ज़रिए)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, और `pnpm qa:observability:smoke` private QA source-checkout lanes हैं। वे जानबूझकर package Docker release lanes का हिस्सा नहीं हैं क्योंकि npm tarball QA Lab को omit करता है।
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, full scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` packed OpenClaw tarball को Docker में globally install करता है, env-ref onboarding के ज़रिए OpenAI और default रूप से Telegram configure करता है, doctor चलाता है, और एक mocked OpenAI agent turn चलाता है। पहले से बने tarball को `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` से reuse करें, host rebuild को `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` से skip करें, या channel को `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` या `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` से switch करें।

- रिलीज़ उपयोगकर्ता यात्रा स्मोक: `pnpm test:docker:release-user-journey` पैक किए गए OpenClaw tarball को साफ Docker home में वैश्विक रूप से इंस्टॉल करता है, onboarding चलाता है, mocked OpenAI provider कॉन्फ़िगर करता है, agent turn चलाता है, बाहरी plugins इंस्टॉल/अनइंस्टॉल करता है, ClickClack को local fixture के विरुद्ध कॉन्फ़िगर करता है, outbound/inbound messaging सत्यापित करता है, Gateway रीस्टार्ट करता है, और doctor चलाता है।
- रिलीज़ typed onboarding स्मोक: `pnpm test:docker:release-typed-onboarding` पैक किए गए tarball को इंस्टॉल करता है, `openclaw onboard` को वास्तविक TTY के माध्यम से चलाता है, OpenAI को env-ref provider के रूप में कॉन्फ़िगर करता है, सत्यापित करता है कि कोई raw key persistence नहीं है, और mocked agent turn चलाता है।
- रिलीज़ media/memory स्मोक: `pnpm test:docker:release-media-memory` पैक किए गए tarball को इंस्टॉल करता है, PNG attachment से image understanding, OpenAI-compatible image generation output, memory search recall, और Gateway restart के बाद recall survival सत्यापित करता है।
- रिलीज़ upgrade user journey स्मोक: `pnpm test:docker:release-upgrade-user-journey` डिफ़ॉल्ट रूप से candidate tarball से पुराना सबसे नया published baseline इंस्टॉल करता है, published package पर provider/plugin/ClickClack state कॉन्फ़िगर करता है, candidate tarball में upgrade करता है, फिर core agent/plugin/channel journey फिर से चलाता है। यदि कोई पुराना published baseline मौजूद नहीं है, तो यह candidate version का पुनः उपयोग करता है। Baseline को `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` से override करें।
- रिलीज़ Plugin marketplace स्मोक: `pnpm test:docker:release-plugin-marketplace` local fixture marketplace से इंस्टॉल करता है, installed plugin को update करता है, उसे uninstall करता है, और सत्यापित करता है कि install metadata prune होने के साथ plugin CLI गायब हो जाता है।
- Skill install स्मोक: `pnpm test:docker:skill-install` packed OpenClaw tarball को Docker में वैश्विक रूप से install करता है, config में uploaded archive installs disable करता है, search से current live ClawHub skill slug resolve करता है, उसे `openclaw skills install` से install करता है, और installed skill तथा `.clawhub` origin/lock metadata सत्यापित करता है।
- Update channel switch स्मोक: `pnpm test:docker:update-channel-switch` packed OpenClaw tarball को Docker में वैश्विक रूप से install करता है, package `stable` से git `dev` पर switch करता है, persisted channel और plugin post-update work सत्यापित करता है, फिर package `stable` पर वापस switch करता है और update status जांचता है।
- Upgrade survivor स्मोक: `pnpm test:docker:upgrade-survivor` packed OpenClaw tarball को agents, channel config, plugin allowlists, stale plugin dependency state, और मौजूदा workspace/session files वाले dirty old-user fixture पर install करता है। यह live provider या channel keys के बिना package update और non-interactive doctor चलाता है, फिर loopback Gateway शुरू करता है और startup/status budgets के साथ config/state preservation जांचता है।
- Published upgrade survivor स्मोक: `pnpm test:docker:published-upgrade-survivor` डिफ़ॉल्ट रूप से `openclaw@latest` install करता है, realistic existing-user files seed करता है, baked command recipe के साथ उस baseline को configure करता है, resulting config validate करता है, उस published install को candidate tarball में update करता है, non-interactive doctor चलाता है, `.artifacts/upgrade-survivor/summary.json` लिखता है, फिर loopback Gateway शुरू करता है और configured intents, state preservation, startup, `/healthz`, `/readyz`, और RPC status budgets जांचता है। एक baseline को `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` से override करें, aggregate scheduler से exact local baselines expand कराने के लिए `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` जैसे `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` दें, और issue-shaped fixtures को `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` जैसे `reported-issues` से expand करें; reported-issues set में automatic external OpenClaw plugin install repair के लिए `configured-plugin-installs` शामिल है। Package Acceptance इन्हें `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, और `published_upgrade_survivor_scenarios` के रूप में expose करता है, `last-stable-4` या `all-since-2026.4.23` जैसे meta baseline tokens resolve करता है, और Full Release Validation release-soak package gate को `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues` तक expand करता है।
- Session runtime context स्मोक: `pnpm test:docker:session-runtime-context` hidden runtime context transcript persistence और प्रभावित duplicated prompt-rewrite branches की doctor repair सत्यापित करता है।
- Bun global install स्मोक: `bash scripts/e2e/bun-global-install-smoke.sh` current tree को pack करता है, isolated home में `bun install -g` से install करता है, और सत्यापित करता है कि `openclaw infer image providers --json` hang होने के बजाय bundled image providers लौटाता है। Prebuilt tarball को `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` से reuse करें, host build को `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` से skip करें, या built Docker image से `dist/` को `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` से copy करें।
- Installer Docker स्मोक: `bash scripts/test-install-sh-docker.sh` अपने root, update, और direct-npm containers में एक npm cache share करता है। Update smoke candidate tarball में upgrade करने से पहले stable baseline के रूप में npm `latest` पर default करता है। Locally `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` से override करें, या GitHub पर Install Smoke workflow के `update_baseline_version` input से। Non-root installer checks isolated npm cache रखते हैं ताकि root-owned cache entries user-local install behavior को mask न करें। Local reruns में root/update/direct-npm cache reuse करने के लिए `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` सेट करें।
- Install Smoke CI duplicate direct-npm global update को `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` से skip करता है; जब direct `npm install -g` coverage चाहिए हो, script को उस env के बिना locally चलाएं।
- Agents delete shared workspace CLI स्मोक: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) डिफ़ॉल्ट रूप से root Dockerfile image build करता है, isolated container home में एक workspace वाले दो agents seed करता है, `agents delete --json` चलाता है, और valid JSON plus retained workspace behavior सत्यापित करता है। Install-smoke image को `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` से reuse करें।
- Gateway networking (दो containers, WS auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot स्मोक: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) source E2E image plus Chromium layer build करता है, raw CDP के साथ Chromium शुरू करता है, `browser doctor --deep` चलाता है, और सत्यापित करता है कि CDP role snapshots link URLs, cursor-promoted clickables, iframe refs, और frame metadata cover करते हैं।
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) Gateway के माध्यम से mocked OpenAI server चलाता है, सत्यापित करता है कि `web_search` `reasoning.effort` को `minimal` से `low` तक बढ़ाता है, फिर provider schema reject force करता है और जांचता है कि raw detail Gateway logs में दिखाई देता है।
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame स्मोक): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP tools (real stdio MCP server + embedded OpenClaw profile allow/deny स्मोक): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (real Gateway + stdio MCP child teardown after isolated Cron and one-shot subagent runs): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (local path, `file:`, hoisted dependencies वाली npm registry, malformed npm package metadata, git moving refs, ClawHub kitchen-sink, marketplace updates, और Claude-bundle enable/inspect के लिए install/update smoke): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  ClawHub block skip करने के लिए `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` सेट करें, या default kitchen-sink package/runtime pair को `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` और `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` से override करें। `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` के बिना, test hermetic local ClawHub fixture server का उपयोग करता है।
- Plugin update unchanged स्मोक: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix स्मोक: `pnpm test:docker:plugin-lifecycle-matrix` bare container में packed OpenClaw tarball install करता है, npm plugin install करता है, enable/disable toggle करता है, local npm registry के माध्यम से उसे upgrade और downgrade करता है, installed code delete करता है, फिर सत्यापित करता है कि uninstall अभी भी stale state हटाता है, जबकि हर lifecycle phase के लिए RSS/CPU metrics log करता है।
- Config reload metadata स्मोक: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` local path, `file:`, hoisted dependencies वाली npm registry, git moving refs, ClawHub fixtures, marketplace updates, और Claude-bundle enable/inspect के लिए install/update smoke cover करता है। `pnpm test:docker:plugin-update` installed plugins के लिए unchanged update behavior cover करता है। `pnpm test:docker:plugin-lifecycle-matrix` resource-tracked npm plugin install, enable, disable, upgrade, downgrade, और missing-code uninstall cover करता है।

Shared functional image को manually prebuild और reuse करने के लिए:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific image overrides जैसे `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` सेट होने पर अभी भी प्राथमिकता लेते हैं। जब `OPENCLAW_SKIP_DOCKER_BUILD=1` किसी remote shared image की ओर point करता है, तो scripts उसे pull करते हैं यदि वह पहले से local नहीं है। QR और installer Docker tests अपने Dockerfiles रखते हैं क्योंकि वे shared built-app runtime के बजाय package/install behavior validate करते हैं।

लाइव-मॉडल Docker runners मौजूदा checkout को read-only रूप में bind-mount भी करते हैं और
उसे container के अंदर एक temporary workdir में stage करते हैं। इससे runtime
image हल्की रहती है, जबकि Vitest फिर भी आपके ठीक स्थानीय source/config के विरुद्ध चलता है।
staging चरण बड़े local-only caches और app build outputs जैसे
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, और app-local `.build` या
Gradle output directories को छोड़ देता है, ताकि Docker live runs को
machine-specific artifacts कॉपी करने में कई मिनट न लगें।
वे `OPENCLAW_SKIP_CHANNELS=1` भी सेट करते हैं, ताकि gateway live probes container के अंदर
वास्तविक Telegram/Discord/आदि channel workers शुरू न करें।
`test:docker:live-models` फिर भी `pnpm test:live` चलाता है, इसलिए जब आपको उस Docker lane से gateway
live coverage को सीमित या बाहर करना हो, तो
`OPENCLAW_LIVE_GATEWAY_*` भी pass through करें।
`test:docker:openwebui` एक उच्च-स्तरीय compatibility smoke है: यह OpenAI-compatible HTTP endpoints enabled के साथ एक
OpenClaw gateway container शुरू करता है,
उस gateway के विरुद्ध एक pinned Open WebUI container शुरू करता है, Open WebUI के ज़रिए sign in करता है,
जांचता है कि `/api/models` `openclaw/default` expose करता है, फिर Open WebUI के
`/api/chat/completions` proxy के ज़रिए एक वास्तविक chat request भेजता है।
release-path CI checks के लिए, जिन्हें Open WebUI sign-in और model discovery के बाद
बिना live model completion की प्रतीक्षा किए रुकना चाहिए, `OPENWEBUI_SMOKE_MODE=models` सेट करें।
पहला run स्पष्ट रूप से धीमा हो सकता है, क्योंकि Docker को
Open WebUI image pull करनी पड़ सकती है और Open WebUI को अपना cold-start setup पूरा करना पड़ सकता है।
यह lane एक उपयोगी live model key की अपेक्षा करती है। इसे process
environment, staged auth profiles, या explicit `OPENCLAW_PROFILE_FILE` के ज़रिए दें।
सफल runs `{ "ok": true, "model":
"openclaw/default", ... }` जैसा एक छोटा JSON payload print करते हैं।
`test:docker:mcp-channels` जानबूझकर deterministic है और इसे वास्तविक
Telegram, Discord, या iMessage account की ज़रूरत नहीं होती। यह seeded Gateway
container boot करता है, एक दूसरा container शुरू करता है जो `openclaw mcp serve` spawn करता है, फिर
routed conversation discovery, transcript reads, attachment metadata,
live event queue behavior, outbound send routing, और वास्तविक stdio MCP bridge पर Claude-style channel +
permission notifications verify करता है। notification check
raw stdio MCP frames को सीधे inspect करता है, ताकि smoke validate करे कि
bridge वास्तव में क्या emit करता है, न कि केवल कोई specific client SDK क्या surface करता है।
`test:docker:agent-bundle-mcp-tools` deterministic है और इसे live
model key की ज़रूरत नहीं होती। यह repo Docker image build करता है, container के अंदर एक वास्तविक stdio MCP probe server
शुरू करता है, उस server को embedded OpenClaw bundle
MCP runtime के ज़रिए materialize करता है, tool execute करता है, फिर verify करता है कि `coding` और `messaging`
`bundle-mcp` tools रखते हैं, जबकि `minimal` और `tools.deny: ["bundle-mcp"]` उन्हें filter करते हैं।
`test:docker:cron-mcp-cleanup` deterministic है और इसे live model
key की ज़रूरत नहीं होती। यह वास्तविक stdio MCP probe server के साथ एक seeded Gateway शुरू करता है, एक
isolated cron turn और एक `sessions_spawn` one-shot child turn चलाता है, फिर verify करता है कि
MCP child process हर run के बाद exit हो जाता है।

Manual ACP plain-language thread smoke (CI नहीं):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- इस script को regression/debug workflows के लिए रखें। ACP thread routing validation के लिए इसकी फिर ज़रूरत पड़ सकती है, इसलिए इसे delete न करें।

उपयोगी env vars:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) `/home/node/.openclaw` पर mounted
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` पर mounted
- `OPENCLAW_PROFILE_FILE=...` tests चलाने से पहले mounted और sourced
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` ताकि केवल `OPENCLAW_PROFILE_FILE` से sourced env vars verify हों, temporary config/workspace dirs और बिना external CLI auth mounts के
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) Docker के अंदर cached CLI installs के लिए `/home/node/.npm-global` पर mounted
- `$HOME` के अंतर्गत external CLI auth dirs/files `/host-auth...` के तहत read-only mounted होते हैं, फिर tests शुरू होने से पहले `/home/node/...` में copied होते हैं
  - Default dirs: `.minimax`
  - Default files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Narrowed provider runs केवल `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` से inferred ज़रूरी dirs/files mount करते हैं
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, या `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` जैसी comma list से manually override करें
- run को सीमित करने के लिए `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- in-container providers filter करने के लिए `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- rebuild की ज़रूरत न रखने वाले reruns के लिए मौजूदा `openclaw:local-live` image reuse करने हेतु `OPENCLAW_SKIP_DOCKER_BUILD=1`
- यह सुनिश्चित करने के लिए कि creds profile store से आएं (env से नहीं), `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke के लिए gateway द्वारा expose किया गया model चुनने हेतु `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke द्वारा उपयोग किए गए nonce-check prompt को override करने हेतु `OPENCLAW_OPENWEBUI_PROMPT=...`
- pinned Open WebUI image tag override करने हेतु `OPENWEBUI_IMAGE=...`

## Docs sanity

doc edits के बाद docs checks चलाएं: `pnpm check:docs`.
जब आपको in-page heading checks भी चाहिए हों, तो full Mintlify anchor validation चलाएं: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

ये वास्तविक providers के बिना "real pipeline" regressions हैं:

- Gateway tool calling (mock OpenAI, वास्तविक gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config writes + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

हमारे पास पहले से कुछ CI-safe tests हैं जो "agent reliability evals" की तरह व्यवहार करते हैं:

- वास्तविक gateway + agent loop के ज़रिए mock tool-calling (`src/gateway/gateway.test.ts`)।
- End-to-end wizard flows जो session wiring और config effects validate करते हैं (`src/gateway/gateway.test.ts`)।

skills के लिए अभी भी जो missing है (देखें [Skills](/hi/tools/skills)):

- **Decisioning:** जब skills prompt में listed हों, तो क्या agent सही skill चुनता है (या अप्रासंगिक ones से बचता है)?
- **Compliance:** क्या agent उपयोग से पहले `SKILL.md` पढ़ता है और required steps/args follow करता है?
- **Workflow contracts:** multi-turn scenarios जो tool order, session history carryover, और sandbox boundaries assert करते हैं।

Future evals को पहले deterministic रहना चाहिए:

- mock providers का उपयोग करने वाला scenario runner, जो tool calls + order, skill file reads, और session wiring assert करे।
- skill-focused scenarios का छोटा suite (use vs avoid, gating, prompt injection)।
- optional live evals (opt-in, env-gated) केवल CI-safe suite तैयार होने के बाद।

## Contract tests (plugin और channel shape)

Contract tests verify करते हैं कि हर registered plugin और channel अपने
interface contract के अनुरूप है। वे सभी discovered plugins पर iterate करते हैं और
shape तथा behavior assertions का suite चलाते हैं। default `pnpm test` unit lane जानबूझकर
इन shared seam और smoke files को skip करता है; जब आप shared channel या provider surfaces छुएं,
तो contract commands explicit रूप से चलाएं।

### Commands

- सभी contracts: `pnpm test:contracts`
- केवल channel contracts: `pnpm test:contracts:channels`
- केवल provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts` में स्थित:

- **plugin** - basic plugin shape (id, name, capabilities)
- **setup** - setup wizard contract
- **session-binding** - session binding behavior
- **outbound-payload** - message payload structure
- **inbound** - inbound message handling
- **actions** - channel action handlers
- **threading** - thread ID handling
- **directory** - directory/roster API
- **group-policy** - group policy enforcement

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts` में स्थित।

- **status** - channel status probes
- **registry** - Plugin registry shape

### Provider contracts

`src/plugins/contracts/*.contract.test.ts` में स्थित:

- **auth** - auth flow contract
- **auth-choice** - auth choice/selection
- **catalog** - model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - provider runtime
- **shape** - Plugin shape/interface
- **wizard** - setup wizard

### कब चलाएं

- plugin-sdk exports या subpaths बदलने के बाद
- channel या provider plugin जोड़ने या modify करने के बाद
- plugin registration या discovery refactor करने के बाद

Contract tests CI में चलते हैं और वास्तविक API keys की आवश्यकता नहीं होती।

## Regressions जोड़ना (guidance)

जब आप live में मिला provider/model issue fix करते हैं:

- संभव हो तो CI-safe regression जोड़ें (mock/stub provider, या exact request-shape transformation capture करें)
- अगर यह inherently live-only है (rate limits, auth policies), तो live test को narrow और env vars के ज़रिए opt-in रखें
- bug पकड़ने वाली सबसे छोटी layer target करना prefer करें:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke या CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` registry metadata (`listSecretTargetRegistryEntries()`) से हर SecretRef class के लिए एक sampled target derive करता है, फिर assert करता है कि traversal-segment exec ids rejected हैं।
  - अगर आप `src/secrets/target-registry-data.ts` में नया `includeInPlan` SecretRef target family जोड़ते हैं, तो उस test में `classifyTargetClass` update करें। test जानबूझकर unclassified target ids पर fail होता है, ताकि नई classes silently skip न हो सकें।

## Related

- [Testing live](/hi/help/testing-live)
- [Testing updates and plugins](/hi/help/testing-updates-plugins)
- [CI](/hi/ci)
