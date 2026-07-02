---
read_when:
    - स्थानीय रूप से या CI में परीक्षण चलाना
    - प्रतिगमन जोड़ना model/provider बगों के लिए
    - Gateway + एजेंट व्यवहार की डिबगिंग
summary: 'परीक्षण किट: यूनिट/e2e/लाइव सुइट, Docker रनर, और प्रत्येक परीक्षण क्या कवर करता है'
title: परीक्षण
x-i18n:
    generated_at: "2026-07-02T08:17:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw में तीन Vitest सूट (यूनिट/इंटीग्रेशन, e2e, live) और Docker रनर्स का एक छोटा सेट है। यह दस्तावेज़ "हम कैसे परीक्षण करते हैं" गाइड है:

- हर सूट क्या कवर करता है (और जानबूझकर क्या _नहीं_ कवर करता)।
- सामान्य वर्कफ़्लो (लोकल, प्री-पुश, डिबगिंग) के लिए कौन से कमांड चलाने हैं।
- live टेस्ट क्रेडेंशियल कैसे खोजते हैं और मॉडल/प्रोवाइडर कैसे चुनते हैं।
- वास्तविक दुनिया के मॉडल/प्रोवाइडर समस्याओं के लिए रिग्रेशन कैसे जोड़ें।

<Note>
**QA स्टैक (qa-lab, qa-channel, live ट्रांसपोर्ट लेन)** अलग से दस्तावेजीकृत है:

- [QA अवलोकन](/hi/concepts/qa-e2e-automation) - आर्किटेक्चर, कमांड सतह, सिनेरियो लेखन।
- [Matrix QA](/hi/concepts/qa-matrix) - `pnpm openclaw qa matrix` के लिए संदर्भ।
- [परिपक्वता स्कोरकार्ड](/hi/maturity/scorecard) - रिलीज़ QA प्रमाण स्थिरता और LTS निर्णयों का समर्थन कैसे करता है।
- [QA चैनल](/hi/channels/qa-channel) - repo-backed सिनेरियो द्वारा उपयोग किया जाने वाला सिंथेटिक ट्रांसपोर्ट Plugin।

यह पेज नियमित टेस्ट सूट और Docker/Parallels रनर्स चलाने को कवर करता है। नीचे दिया गया QA-विशिष्ट रनर्स सेक्शन ([QA-विशिष्ट रनर्स](#qa-specific-runners)) ठोस `qa` invocations सूचीबद्ध करता है और ऊपर दिए गए संदर्भों की ओर वापस इंगित करता है।
</Note>

## त्वरित शुरुआत

अधिकांश दिनों में:

- पूरा गेट (पुश से पहले अपेक्षित): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- अधिक जगह वाली मशीन पर तेज़ लोकल full-suite रन: `pnpm test:max`
- सीधा Vitest watch लूप: `pnpm test:watch`
- सीधा फ़ाइल targeting अब extension/channel पाथ भी रूट करता है: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- जब आप किसी एक failure पर iterate कर रहे हों, पहले targeted runs को प्राथमिकता दें।
- Docker-backed QA साइट: `pnpm qa:lab:up`
- Linux VM-backed QA लेन: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

जब आप टेस्ट छूते हैं या अतिरिक्त भरोसा चाहते हैं:

- कवरेज गेट: `pnpm test:coverage`
- E2E सूट: `pnpm test:e2e`

## टेस्ट अस्थायी डायरेक्टरी

टेस्ट-स्वामित्व वाली अस्थायी डायरेक्टरी के लिए `test/helpers/temp-dir.ts` में साझा helpers को प्राथमिकता दें। वे ownership को स्पष्ट बनाते हैं और cleanup को उसी टेस्ट lifecycle में रखते हैं:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` जानबूझकर कोई manual cleanup method expose नहीं करता; Vitest हर टेस्ट के बाद cleanup का मालिक है। मौजूदा lower-level helpers उन टेस्टों के लिए बने रहते हैं जो अभी migrate नहीं हुए हैं, लेकिन नए और migrated टेस्टों को auto-cleaning tracker का उपयोग करना चाहिए। टेस्टों में नए manual `makeTempDir`, `cleanupTempDirs`, या `createTempDirTracker` usage से बचें और नए bare `fs.mkdtemp*` calls से बचें, जब तक कोई case स्पष्ट रूप से raw temp-dir behavior verify नहीं कर रहा हो। जब किसी टेस्ट को जानबूझकर bare temp directory चाहिए, तो ठोस कारण के साथ auditable allow comment जोड़ें:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Migration visibility के लिए, `node scripts/report-test-temp-creations.mjs` added diff lines में नए bare temp-dir creation और नए manual shared-helper usage की रिपोर्ट करता है, मौजूदा cleanup styles को block किए बिना। इसका file scope जानबूझकर `scripts/changed-lanes.mjs` द्वारा उपयोग की गई उसी test-path classification का अनुसरण करता है, अलग test-helper filename heuristic बनाए रखने के बजाय, और shared helper implementation को स्वयं skip करता है। `check:changed` बदले हुए test paths के लिए इस report को warning-only CI signal के रूप में चलाता है; findings GitHub warning annotations हैं, failures नहीं।

वास्तविक providers/models को debug करते समय (वास्तविक creds चाहिए):

- Live सूट (models + gateway tool/image probes): `pnpm test:live`
- एक live फ़ाइल को quietly target करें: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime performance reports: वास्तविक `openai/gpt-5.5` agent turn के लिए `live_openai_candidate=true` या Kova CPU/heap/trace artifacts के लिए `deep_profile=true` के साथ `OpenClaw Performance` dispatch करें। Daily scheduled runs, `CLAWGRIT_REPORTS_TOKEN` configured होने पर, mock-provider, deep-profile, और GPT 5.5 lane artifacts को `openclaw/clawgrit-reports` पर publish करते हैं। mock-provider report में source-level gateway boot, memory, plugin-pressure, repeated fake-model hello-loop, और CLI startup numbers भी शामिल हैं।
- Docker live model sweep: `pnpm test:docker:live-models`
  - हर selected model अब एक text turn और एक छोटा file-read-style probe चलाता है। जिन models की metadata `image` input advertise करती है, वे एक tiny image turn भी चलाते हैं। Provider failures isolate करते समय extra probes को `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` या `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` से disable करें।
  - CI coverage: daily `OpenClaw Scheduled Live And E2E Checks` और manual `OpenClaw Release Checks` दोनों reusable live/E2E workflow को `include_live_suites: true` के साथ call करते हैं, जिसमें provider द्वारा sharded अलग Docker live model matrix jobs शामिल हैं।
  - Focused CI reruns के लिए, `include_live_suites: true` और `live_models_only: true` के साथ `OpenClaw Live And E2E Checks (Reusable)` dispatch करें।
  - नए high-signal provider secrets को `scripts/ci-hydrate-live-auth.sh` के साथ `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` और उसके scheduled/release callers में जोड़ें।
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server path के विरुद्ध Docker live lane चलाता है, `/codex bind` के साथ synthetic Slack DM bind करता है, `/codex fast` और `/codex permissions` exercise करता है, फिर verify करता है कि plain reply और image attachment route ACP के बजाय native Plugin binding से होकर जाते हैं।
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin-owned Codex app-server harness के माध्यम से gateway agent turns चलाता है, `/codex status` और `/codex models` verify करता है, और default रूप से image, cron MCP, sub-agent, और Guardian probes exercise करता है। अन्य Codex app-server failures isolate करते समय sub-agent probe को `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` से disable करें। Focused sub-agent check के लिए, अन्य probes disable करें:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    यह sub-agent probe के बाद exit करता है, जब तक `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` set न हो।
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Packaged OpenClaw tarball को Docker में install करता है, OpenAI API-key onboarding चलाता है, और verify करता है कि Codex Plugin plus `@openai/codex` dependency demand पर managed npm project root में downloaded हुई।
- Live Plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - वास्तविक `slugify` dependency के साथ fixture Plugin pack करता है, उसे `npm-pack:` के माध्यम से install करता है, managed npm project root के तहत dependency verify करता है, फिर live OpenAI model से Plugin tool call करने और hidden slug return करने को कहता है।
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command surface के लिए opt-in belt-and-suspenders check। यह `/crestodian status` exercise करता है, persistent model change queue करता है, `/crestodian yes` reply करता है, और audit/config write path verify करता है।
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` पर fake Claude CLI के साथ configless container में Crestodian चलाता है और verify करता है कि fuzzy planner fallback audited typed config write में translate होता है।
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - खाली OpenClaw state dir से शुरू करता है, modern onboard Crestodian entrypoint verify करता है, setup/model/agent/Discord Plugin + SecretRef writes apply करता है, config validate करता है, और audit entries verify करता है। वही Ring 0 setup path QA Lab में भी `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` द्वारा cover किया गया है।
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` set होने पर, `openclaw models list --provider moonshot --json` चलाएँ, फिर `moonshot/kimi-k2.6` के विरुद्ध isolated `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` चलाएँ। Verify करें कि JSON Moonshot/K2.6 report करता है और assistant transcript normalized `usage.cost` store करता है।

<Tip>
जब आपको केवल एक failing case चाहिए, तो नीचे वर्णित allowlist env vars के माध्यम से live tests को narrow करना प्राथमिकता दें।
</Tip>

## QA-विशिष्ट रनर्स

जब आपको QA-lab realism चाहिए, ये commands main test suites के साथ रखे गए हैं:

CI dedicated workflows में QA Lab चलाता है। Agentic parity `QA-Lab - All Lanes` और release validation के अंदर nested है, standalone PR workflow नहीं। Broad validation को `rerun_group=qa-parity` या release-checks QA group के साथ `Full Release Validation` का उपयोग करना चाहिए। Stable/default release checks exhaustive live/Docker soak को `run_release_soak=true` के पीछे रखते हैं; `full` profile soak को force करता है। `QA-Lab - All Lanes` nightly `main` पर और manual dispatch से mock parity lane, live Matrix lane, Convex-managed live Telegram lane, और Convex-managed live Discord lane के साथ parallel jobs के रूप में चलता है। Scheduled QA और release checks Matrix `--profile fast` को explicitly pass करते हैं, जबकि Matrix CLI और manual workflow input default `all` रहते हैं; manual dispatch `all` को `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, और `e2ee-cli` jobs में shard कर सकता है। `OpenClaw Release Checks` release approval से पहले parity plus fast Matrix और Telegram lanes चलाता है, release transport checks के लिए `mock-openai/gpt-5.5` का उपयोग करते हुए ताकि वे deterministic रहें और normal provider-plugin startup से बचें। ये live transport gateways memory search disable करते हैं; memory behavior QA parity suites द्वारा covered रहता है।

Full release live media shards `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` का उपयोग करते हैं, जिसमें पहले से `ffmpeg` और `ffprobe` हैं। Docker live model/backend shards selected commit प्रति एक बार built shared `ghcr.io/openclaw/openclaw-live-test:<sha>` image का उपयोग करते हैं, फिर हर shard के अंदर rebuild करने के बजाय उसे `OPENCLAW_SKIP_DOCKER_BUILD=1` के साथ pull करते हैं।

- `pnpm openclaw qa suite`
  - होस्ट पर सीधे repo-backed QA परिदृश्य चलाता है।
  - चुने गए परिदृश्य सेट के लिए शीर्ष-स्तरीय `qa-evidence.json`, `qa-suite-summary.json`, और
    `qa-suite-report.md` artifacts लिखता है, जिसमें
    mixed flow, Vitest, और Playwright परिदृश्य चयन शामिल होते हैं।
  - जब `pnpm openclaw qa run --qa-profile <profile>` द्वारा dispatch किया जाता है, तो उसी
    `qa-evidence.json` में चुने गए taxonomy profile scorecard को embed करता है।
    `smoke-ci` slim evidence लिखता है, जो `evidenceMode: "slim"` सेट करता है और
    प्रति-entry `execution` को छोड़ देता है। `release` curated release-readiness slice को कवर करता है;
    `all` हर active maturity category चुनता है और explicit QA
    Profile Evidence workflow dispatches के लिए अभिप्रेत है, जब पूर्ण scorecard artifact
    चाहिए हो।
  - isolated gateway workers के साथ default रूप से कई चुने गए परिदृश्य parallel में चलाता है।
    `qa-channel` concurrency 4 पर default करता है (चुने गए scenario count से bounded)।
    worker count tune करने के लिए `--concurrency <count>` का उपयोग करें, या पुराने serial lane के लिए `--concurrency 1`।
  - किसी भी परिदृश्य के fail होने पर non-zero exit करता है। जब आप failing exit code के बिना artifacts
    चाहते हों, तो `--allow-failures` का उपयोग करें।
  - provider modes `live-frontier`, `mock-openai`, और `aimock` का समर्थन करता है।
    `aimock` experimental fixture और protocol-mock coverage के लिए local AIMock-backed provider server शुरू करता है,
    बिना scenario-aware `mock-openai` lane को replace किए।
- `pnpm openclaw qa coverage --match <query>`
  - scenario IDs, titles, surfaces, coverage IDs, docs refs, code refs,
    plugins, और provider requirements खोजता है, फिर matching suite targets print करता है।
  - इसका उपयोग QA Lab run से पहले करें, जब आपको touched behavior या file path पता हो
    लेकिन सबसे छोटा scenario न पता हो। यह केवल advisory है; फिर भी बदले जा रहे behavior से
    mock, live, Multipass, Matrix, या transport proof चुनें।
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab के माध्यम से live OpenAI Kitchen Sink Plugin gauntlet चलाता है। यह
    external Kitchen Sink package install करता है, plugin SDK surface
    inventory verify करता है, `/healthz` और `/readyz` probe करता है, gateway CPU/RSS
    evidence record करता है, live OpenAI turn चलाता है, और adversarial diagnostics check करता है।
    `OPENAI_API_KEY` जैसे live OpenAI auth की आवश्यकता होती है। hydrated Testbox
    sessions में, जब `openclaw-testbox-env` helper मौजूद हो, तो यह automatic रूप से Testbox live-auth profile source करता है।
- `pnpm test:gateway:cpu-scenarios`
  - gateway startup bench के साथ छोटा mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) चलाता है और `.artifacts/gateway-cpu-scenarios/` के तहत combined CPU observation
    summary लिखता है।
  - default रूप से केवल sustained hot CPU observations flag करता है (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), इसलिए छोटे startup bursts metrics के रूप में record होते हैं
    और minutes-long gateway peg regression जैसे नहीं दिखते।
  - built `dist` artifacts का उपयोग करता है; जब checkout में पहले से fresh runtime output न हो,
    तो पहले build चलाएं।
- `pnpm openclaw qa suite --runner multipass`
  - उसी QA suite को disposable Multipass Linux VM के अंदर चलाता है।
  - host पर `qa suite` जैसा ही scenario-selection behavior रखता है।
  - `qa suite` जैसे ही provider/model selection flags फिर से उपयोग करता है।
  - Live runs guest के लिए practical supported QA auth inputs forward करते हैं:
    env-based provider keys, QA live provider config path, और मौजूद होने पर `CODEX_HOME`।
  - Output dirs repo root के तहत ही रहने चाहिए ताकि guest mounted workspace के माध्यम से वापस लिख सके।
  - normal QA report + summary के साथ Multipass logs
    `.artifacts/qa-e2e/...` के तहत लिखता है।
- `pnpm qa:lab:up`
  - operator-style QA work के लिए Docker-backed QA site शुरू करता है।
- `pnpm test:docker:npm-onboard-channel-agent`
  - current checkout से npm tarball build करता है, उसे Docker में globally install करता है,
    non-interactive OpenAI API-key onboarding चलाता है, default रूप से Telegram configure करता है,
    verifies करता है कि packaged plugin runtime startup dependency repair के बिना load होता है,
    doctor चलाता है, और mocked OpenAI endpoint के विरुद्ध एक local agent turn चलाता है।
  - उसी packaged-install lane को Discord के साथ चलाने के लिए `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` का उपयोग करें।
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcripts के लिए deterministic built-app Docker smoke चलाता है।
    यह verify करता है कि hidden OpenClaw runtime context visible user turn में leak होने के बजाय
    non-display custom message के रूप में persisted है,
    फिर affected broken session JSONL seed करता है और verify करता है कि
    `openclaw doctor --fix` उसे backup के साथ active branch में rewrite करता है।
- `pnpm test:docker:npm-telegram-live`
  - Docker में OpenClaw package candidate install करता है, installed-package
    onboarding चलाता है, installed CLI के माध्यम से Telegram configure करता है, फिर उस installed package को SUT Gateway बनाकर
    live Telegram QA lane reuse करता है।
  - wrapper checkout से केवल `qa-lab` harness source mount करता है; installed package
    `dist`, `openclaw/plugin-sdk`, और bundled plugin runtime own करता है ताकि lane current checkout plugins को
    test के अधीन package में mix न करे।
  - `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` पर default करता है; registry से install करने के बजाय
    resolved local tarball test करने के लिए
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` या
    `OPENCLAW_CURRENT_PACKAGE_TGZ` set करें।
  - default रूप से `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` के साथ
    `qa-evidence.json` में repeated RTT timing emit करता है। RTT run tune करने के लिए
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, या
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` override करें।
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` sample करने के लिए
    Telegram QA check IDs की comma-separated list accept करता है; unset होने पर default RTT-capable check
    `telegram-mentioned-message-reply` है।
  - `pnpm openclaw qa telegram` जैसे ही Telegram env credentials या Convex credential source का उपयोग करता है।
    CI/release automation के लिए,
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` के साथ
    `OPENCLAW_QA_CONVEX_SITE_URL` और एक role secret set करें। यदि
    `OPENCLAW_QA_CONVEX_SITE_URL` और Convex role secret CI में मौजूद हों,
    तो Docker wrapper automatic रूप से Convex चुनता है।
  - Docker build/install work से पहले wrapper host पर Telegram या Convex credential env validate करता है।
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` केवल तब set करें
    जब जानबूझकर pre-credential setup debug कर रहे हों।
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` इस lane के लिए ही shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` override करता है। जब Convex credentials
    चुने गए हों और कोई role set न हो, तो wrapper CI में `ci` और
    CI के बाहर `maintainer` का उपयोग करता है।
  - GitHub Actions इस lane को manual maintainer workflow
    `NPM Telegram Beta E2E` के रूप में expose करता है। यह merge पर नहीं चलता। workflow
    `qa-live-shared` environment और Convex CI credential leases का उपयोग करता है।
- GitHub Actions एक candidate package के विरुद्ध side-run product proof के लिए `Package Acceptance` भी expose करता है।
  यह trusted ref, published npm spec,
  HTTPS tarball URL plus SHA-256, या किसी अन्य run से tarball artifact accept करता है,
  normalized `openclaw-current.tgz` को `package-under-test` के रूप में upload करता है, फिर
  existing Docker E2E scheduler को smoke, package, product, full, या custom
  lane profiles के साथ चलाता है। उसी `package-under-test` artifact के विरुद्ध
  Telegram QA workflow चलाने के लिए `telegram_mode=mock-openai` या `live-frontier` set करें।
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof के लिए digest चाहिए और public URL safety policy का उपयोग करता है:

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

`source=trusted-url` trusted workflow ref से `.github/package-trusted-sources.json` पढ़ता है और URL credentials या workflow-input private-network bypass accept नहीं करता। यदि named policy bearer auth declare करती है, तो fixed `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret configure करें।

- Artifact proof किसी अन्य Actions run से tarball artifact download करता है:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - current OpenClaw build को Docker में pack और install करता है, OpenAI configured होने के साथ Gateway
    start करता है, फिर config edits के माध्यम से bundled channel/plugins enable करता है।
  - verify करता है कि setup discovery unconfigured downloadable plugins को absent छोड़ता है,
    first configured doctor repair हर missing downloadable
    plugin को explicitly install करता है, और second restart hidden dependency
    repair नहीं चलाता।
  - एक known older npm baseline भी install करता है, `openclaw update --tag <candidate>` चलाने से पहले Telegram enable करता है,
    और verify करता है कि candidate का
    post-update doctor legacy plugin dependency debris को harness-side postinstall repair के बिना clean करता है।
- `pnpm test:parallels:npm-update`
  - Parallels guests में native packaged-install update smoke चलाता है। हर
    चुना गया platform पहले requested baseline package install करता है, फिर उसी guest में
    installed `openclaw update` command चलाता है और installed version,
    update status, gateway readiness, और एक local agent turn verify करता है।
  - एक guest पर iterate करते समय `--platform macos`, `--platform windows`, या `--platform linux` का उपयोग करें।
    summary artifact path और per-lane status के लिए `--json` का उपयोग करें।
  - OpenAI lane default रूप से live agent-turn proof के लिए `openai/gpt-5.5` का उपयोग करता है।
    किसी अन्य OpenAI model को जानबूझकर validate करते समय `--model <provider/model>` pass करें या
    `OPENCLAW_PARALLELS_OPENAI_MODEL` set करें।
  - लंबे local runs को host timeout में wrap करें ताकि Parallels transport stalls
    testing window के शेष भाग को consume न कर सकें:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script `/tmp/openclaw-parallels-npm-update.*` के तहत nested lane logs लिखती है।
    outer wrapper के hung होने का अनुमान लगाने से पहले
    `windows-update.log`, `macos-update.log`, या `linux-update.log` inspect करें।
  - Windows update cold guest पर post-update doctor और package
    update work में 10 से 15 मिनट लगा सकता है; nested npm
    debug log आगे बढ़ रहा हो तो यह अभी भी healthy है।
  - इस aggregate wrapper को individual Parallels
    macOS, Windows, या Linux smoke lanes के parallel में न चलाएं। वे VM state share करते हैं और
    snapshot restore, package serving, या guest gateway state पर collide कर सकते हैं।
  - post-update proof normal bundled plugin surface चलाता है क्योंकि
    speech, image generation, और media
    understanding जैसी capability facades bundled runtime APIs के माध्यम से load होती हैं, भले ही agent
    turn स्वयं केवल simple text response check करता हो।

- `pnpm openclaw qa aimock`
  - सीधे प्रोटोकॉल स्मोक परीक्षण के लिए केवल स्थानीय AIMock प्रदाता सर्वर शुरू करता है।
- `pnpm openclaw qa matrix`
  - एक डिस्पोज़ेबल Docker-समर्थित Tuwunel homeserver के विरुद्ध Matrix लाइव QA लेन चलाता है। केवल स्रोत-checkout - पैकेज्ड इंस्टॉल `qa-lab` शिप नहीं करते।
  - पूरा CLI, प्रोफ़ाइल/परिदृश्य कैटलॉग, env vars, और आर्टिफैक्ट लेआउट: [Matrix QA](/hi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env से ड्राइवर और SUT bot टोकन का उपयोग करके वास्तविक निजी समूह के विरुद्ध Telegram लाइव QA लेन चलाता है।
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, और `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` आवश्यक हैं। समूह id संख्यात्मक Telegram chat id होना चाहिए।
  - साझा pooled credentials के लिए `--credential-source convex` समर्थित है। डिफ़ॉल्ट रूप से env मोड का उपयोग करें, या pooled leases में opt in करने के लिए `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` सेट करें।
  - डिफ़ॉल्ट canary, mention gating, command addressing, `/status`, bot-to-bot mentioned replies, और core native command replies को कवर करते हैं। `mock-openai` डिफ़ॉल्ट deterministic reply-chain और Telegram final-message streaming regressions को भी कवर करते हैं। `session_status` जैसे वैकल्पिक probes के लिए `--list-scenarios` का उपयोग करें।
  - कोई भी परिदृश्य विफल होने पर non-zero के साथ बाहर निकलता है। जब आप failing exit code के बिना artifacts चाहते हों, तो `--allow-failures` का उपयोग करें।
  - उसी निजी समूह में दो अलग-अलग bots आवश्यक हैं, जिसमें SUT bot एक Telegram username expose करता हो।
  - स्थिर bot-to-bot अवलोकन के लिए, दोनों bots के लिए `@BotFather` में Bot-to-Bot Communication Mode सक्षम करें और सुनिश्चित करें कि driver bot समूह bot traffic देख सकता है।
  - `.artifacts/qa-e2e/...` के अंतर्गत Telegram QA report, summary, और `qa-evidence.json` लिखता है। Replying scenarios में driver send request से observed SUT reply तक RTT शामिल होता है।

`Mantis Telegram Live` इस लेन के इर्द-गिर्द PR-evidence wrapper है। यह Convex-leased Telegram credentials के साथ candidate ref चलाता है, Crabbox desktop browser में redacted QA report/evidence bundle render करता है, MP4 evidence रिकॉर्ड करता है, motion-trimmed GIF जनरेट करता है, artifact bundle upload करता है, और `pr_number` सेट होने पर Mantis GitHub App के माध्यम से inline PR evidence पोस्ट करता है। Maintainers इसे Actions UI से `Mantis Scenario` (`scenario_id:
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

Mantis agent PR पढ़ता है, तय करता है कि कौन-सा Telegram-visible behavior बदलाव को साबित करता है, baseline और candidate refs पर real-user Crabbox Telegram Desktop proof lane चलाता है, native GIFs उपयोगी होने तक iterate करता है, paired `motionPreview` manifest लिखता है, और `pr_number` सेट होने पर Mantis GitHub App के माध्यम से वही 2-column GIF table पोस्ट करता है।

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux desktop lease या reuse करता है, native Telegram Desktop इंस्टॉल करता है, leased Telegram SUT bot token के साथ OpenClaw configure करता है, gateway शुरू करता है, और visible VNC desktop से screenshot/MP4 evidence रिकॉर्ड करता है।
  - डिफ़ॉल्ट `--credential-source convex` है ताकि workflows को केवल Convex broker secret चाहिए। `pnpm openclaw qa telegram` जैसे वही `OPENCLAW_QA_TELEGRAM_*` variables के साथ `--credential-source env` का उपयोग करें।
  - Telegram Desktop को अभी भी user login/profile चाहिए। bot token केवल OpenClaw configure करता है। base64 `.tgz` profile archive के लिए `--telegram-profile-archive-env <name>` का उपयोग करें, या `--keep-lease` का उपयोग करके VNC के माध्यम से एक बार manually log in करें।
  - output directory के अंतर्गत `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, और `telegram-desktop-builder.mp4` लिखता है।

Live transport lanes एक standard contract साझा करती हैं ताकि नए transports drift न हों; प्रति-lane coverage matrix [QA overview → Live transport coverage](/hi/concepts/qa-e2e-automation#live-transport-coverage) में है। `qa-channel` broad synthetic suite है और उस matrix का हिस्सा नहीं है।

### Convex के माध्यम से साझा Telegram credentials (v1)

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

सामान्य operation में `OPENCLAW_QA_CONVEX_SITE_URL` को `https://` का उपयोग करना चाहिए।

Maintainer admin commands (pool add/remove/list) के लिए विशेष रूप से `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` आवश्यक है।

maintainers के लिए CLI helpers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live runs से पहले Convex site URL, broker secrets, endpoint prefix, HTTP timeout, और admin/list reachability को secret values print किए बिना जांचने के लिए `doctor` का उपयोग करें। scripts और CI utilities में machine-readable output के लिए `--json` का उपयोग करें।

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
- `POST /admin/add` (maintainer secret only)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove` (maintainer secret only)
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (maintainer secret only)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram kind के लिए payload shape:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` संख्यात्मक Telegram chat id string होना चाहिए।
- `admin/add`, `kind: "telegram"` के लिए इस shape को validate करता है और malformed payloads reject करता है।

Telegram real-user kind के लिए payload shape:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, और `telegramApiId` numeric strings होने चाहिए।
- `tdlibArchiveSha256` और `desktopTdataArchiveSha256` SHA-256 hex strings होने चाहिए।
- `kind: "telegram-user"` Mantis Telegram Desktop proof workflow के लिए reserved है। Generic QA Lab lanes को इसे acquire नहीं करना चाहिए।

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lanes भी pool से lease कर सकती हैं, लेकिन Slack payload validation वर्तमान में broker के बजाय Slack QA runner में रहता है। Slack rows के लिए `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` का उपयोग करें।

### QA में channel जोड़ना

नए channel adapters के लिए architecture और scenario-helper names [QA overview → Adding a channel](/hi/concepts/qa-e2e-automation#adding-a-channel) में हैं। minimum bar: shared `qa-lab` host seam पर transport runner implement करें, plugin manifest में `qaRunners` declare करें, `openclaw qa <runner>` के रूप में mount करें, और `qa/scenarios/` के अंतर्गत scenarios author करें।

## Test suites (कहाँ क्या चलता है)

suites को "increasing realism" (और बढ़ती flakiness/cost) के रूप में सोचें:

### Unit / integration (default)

- Command: `pnpm test`
- Config: untargeted runs `vitest.full-*.config.ts` shard set का उपयोग करते हैं और parallel scheduling के लिए multi-project shards को per-project configs में expand कर सकते हैं
- Files: `src/**/*.test.ts`, `packages/**/*.test.ts`, और `test/**/*.test.ts` के अंतर्गत core/unit inventories; UI unit tests dedicated `unit-ui` shard में चलते हैं
- Scope:
  - Pure unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - known bugs के लिए deterministic regressions
- Expectations:
  - CI में चलता है
  - वास्तविक keys आवश्यक नहीं
  - तेज और स्थिर होना चाहिए
  - Resolver और public-surface loader tests को generated tiny plugin fixtures के साथ broad `api.js` और `runtime-api.js` fallback behavior साबित करना चाहिए, वास्तविक bundled plugin source APIs के साथ नहीं। Real plugin API loads plugin-owned contract/integration suites में होने चाहिए।

Native dependency policy:

- Default test installs optional native Discord opus builds skip करते हैं। Discord voice bundled `libopus-wasm` का उपयोग करता है, और `@discordjs/opus` `allowBuilds` में disabled रहता है ताकि local tests और Testbox lanes native addon compile न करें।
- Native opus performance की तुलना default OpenClaw install/test loops में नहीं, बल्कि `libopus-wasm` benchmark repo में करें। default `allowBuilds` में `@discordjs/opus` को `true` पर सेट न करें; इससे unrelated install/test loops native code compile करते हैं।

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - बिना लक्ष्य वाले `pnpm test` एक विशाल नेटिव रूट-प्रोजेक्ट प्रक्रिया के बजाय बारह छोटे shard configs (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) चलाते हैं। इससे लोडेड मशीनों पर peak RSS घटता है और auto-reply/extension कार्य असंबंधित suites को भूखा नहीं रखते।
    - `pnpm test --watch` अब भी नेटिव रूट `vitest.config.ts` प्रोजेक्ट ग्राफ का उपयोग करता है, क्योंकि multi-shard watch loop व्यावहारिक नहीं है।
    - `pnpm test`, `pnpm test:watch`, और `pnpm test:perf:imports` स्पष्ट file/directory targets को पहले scoped lanes से route करते हैं, इसलिए `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` पूरे root project startup tax से बचता है।
    - `pnpm test:changed` बदले हुए git paths को default रूप से सस्ते scoped lanes में expand करता है: direct test edits, sibling `*.test.ts` files, explicit source mappings, और local import-graph dependents। Config/setup/package edits tests को broad-run नहीं करते, जब तक आप स्पष्ट रूप से `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` का उपयोग न करें।
    - `pnpm check:changed` संकरे काम के लिए सामान्य smart local check gate है। यह diff को core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling, और tooling में classify करता है, फिर matching typecheck, lint, और guard commands चलाता है। यह Vitest tests नहीं चलाता; test proof के लिए `pnpm test:changed` या explicit `pnpm test <target>` चलाएं। Release metadata-only version bumps targeted version/config/root-dependency checks चलाते हैं, ऐसे guard के साथ जो top-level version field के बाहर package changes को reject करता है।
    - Live Docker ACP harness edits focused checks चलाते हैं: live Docker auth scripts के लिए shell syntax और live Docker scheduler dry-run। `package.json` changes केवल तब शामिल होते हैं जब diff `scripts["test:docker:live-*"]` तक सीमित हो; dependency, export, version, और अन्य package-surface edits अब भी broader guards का उपयोग करते हैं।
    - agents, commands, plugins, auto-reply helpers, `plugin-sdk`, और समान pure utility areas से import-light unit tests `unit-fast` lane से route होते हैं, जो `test/setup-openclaw-runtime.ts` को skip करता है; stateful/runtime-heavy files मौजूदा lanes पर रहते हैं।
    - चुने हुए `plugin-sdk` और `commands` helper source files भी changed-mode runs को उन light lanes में explicit sibling tests से map करते हैं, ताकि helper edits उस directory के लिए पूरी heavy suite दोबारा चलाने से बचें।
    - `auto-reply` में top-level core helpers, top-level `reply.*` integration tests, और `src/auto-reply/reply/**` subtree के लिए dedicated buckets हैं। CI reply subtree को आगे agent-runner, dispatch, और commands/state-routing shards में split करता है ताकि एक import-heavy bucket पूरे Node tail का मालिक न बन जाए।
    - सामान्य PR/main CI extension batch sweep और release-only `agentic-plugins` shard को जानबूझकर skip करता है। Full Release Validation release candidates पर उन plugin/extension-heavy suites के लिए अलग `Plugin Prerelease` child workflow dispatch करता है।

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - जब आप message-tool discovery inputs या compaction runtime
      context बदलते हैं, तो coverage के दोनों स्तर बनाए रखें।
    - pure routing और normalization boundaries के लिए focused helper regressions
      जोड़ें।
    - embedded runner integration suites को स्वस्थ रखें:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, और
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`।
    - ये suites सत्यापित करते हैं कि scoped ids और compaction behavior अब भी
      वास्तविक `run.ts` / `compact.ts` paths से flow करते हैं; helper-only tests
      उन integration paths का पर्याप्त substitute नहीं हैं।

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Base Vitest config का default `threads` है।
    - shared Vitest config `isolate: false` fix करता है और root projects,
      e2e, और live configs में non-isolated runner का उपयोग करता है।
    - root UI lane अपना `jsdom` setup और optimizer रखता है, लेकिन shared
      non-isolated runner पर भी चलता है।
    - प्रत्येक `pnpm test` shard shared Vitest config से वही `threads` + `isolate: false`
      defaults inherit करता है।
    - `scripts/run-vitest.mjs` बड़े local runs के दौरान V8 compile churn घटाने के लिए
      Vitest child Node processes में default रूप से `--no-maglev` जोड़ता है।
      stock V8 behavior से तुलना करने के लिए `OPENCLAW_VITEST_ENABLE_MAGLEV=1`
      सेट करें।
    - `scripts/run-vitest.mjs` explicit non-watch Vitest runs को
      5 मिनट तक कोई stdout या stderr output न होने पर terminate करता है। किसी
      जानबूझकर silent investigation के लिए watchdog disable करने हेतु
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` सेट करें।

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` दिखाता है कि diff किन architectural lanes को trigger करता है।
    - pre-commit hook केवल formatting के लिए है। यह formatted files को restage करता है और
      lint, typecheck, या tests नहीं चलाता।
    - handoff या push से पहले जब आपको smart local check gate चाहिए हो, तो
      `pnpm check:changed` स्पष्ट रूप से चलाएं।
    - `pnpm test:changed` default रूप से सस्ते scoped lanes से route करता है। केवल तब
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` उपयोग करें जब agent
      यह तय करे कि harness, config, package, या contract edit को सच में broader
      Vitest coverage चाहिए।
    - `pnpm test:max` और `pnpm test:changed:max` वही routing behavior रखते हैं,
      बस worker cap अधिक होता है।
    - Local worker auto-scaling जानबूझकर conservative है और host load average
      पहले से high होने पर पीछे हटता है, इसलिए multiple concurrent Vitest runs
      default रूप से कम नुकसान करते हैं।
    - base Vitest config projects/config files को `forceRerunTriggers` के रूप में
      mark करता है ताकि test wiring बदलने पर changed-mode reruns सही रहें।
    - config supported hosts पर `OPENCLAW_VITEST_FS_MODULE_CACHE` enabled रखता है;
      अगर direct profiling के लिए एक explicit cache location चाहिए, तो
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` सेट करें।

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` Vitest import-duration reporting और
      import-breakdown output enable करता है।
    - `pnpm test:perf:imports:changed` वही profiling view `origin/main` से बदली
      files तक scope करता है।
    - Shard timing data `.artifacts/vitest-shard-timings.json` में लिखा जाता है।
      Whole-config runs key के रूप में config path का उपयोग करते हैं; include-pattern CI
      shards shard name append करते हैं ताकि filtered shards को अलग से track किया जा सके।
    - जब एक hot test अब भी अपना अधिकांश समय startup imports में बिताता है,
      heavy dependencies को narrow local `*.runtime.ts` seam के पीछे रखें और
      उस seam को सीधे mock करें, बजाय इसके कि runtime helpers को deep-import करके
      सिर्फ उन्हें `vi.mock(...)` से pass through किया जाए।
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` उस committed
      diff के लिए routed `test:changed` की native root-project path से तुलना करता है
      और wall time plus macOS max RSS print करता है।
    - `pnpm test:perf:changed:bench -- --worktree` वर्तमान dirty tree को
      changed file list को `scripts/test-projects.mjs` और root Vitest config से
      route करके benchmark करता है।
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
  - default रूप से diagnostics enabled के साथ वास्तविक loopback Gateway शुरू करता है
  - diagnostic event path के माध्यम से synthetic gateway message, memory, और large-payload churn चलाता है
  - Gateway WS RPC पर `diagnostics.stability` query करता है
  - diagnostic stability bundle persistence helpers cover करता है
  - assert करता है कि recorder bounded रहता है, synthetic RSS samples pressure budget से नीचे रहते हैं, और per-session queue depths वापस zero तक drain हो जाते हैं
- Expectations:
  - CI-safe और keyless
  - stability-regression follow-up के लिए narrow lane, पूरे Gateway suite का substitute नहीं

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
- Files: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, और `extensions/` के अंतर्गत bundled-plugin E2E tests
- Runtime defaults:
  - बाकी repo से matching, Vitest `threads` का `isolate: false` के साथ उपयोग करता है।
  - adaptive workers का उपयोग करता है (CI: 2 तक, local: default रूप से 1)।
  - console I/O overhead घटाने के लिए default रूप से silent mode में चलता है।
- Useful overrides:
  - worker count force करने के लिए `OPENCLAW_E2E_WORKERS=<n>` (16 पर capped)।
  - verbose console output फिर से enable करने के लिए `OPENCLAW_E2E_VERBOSE=1`।
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
  - Gateway WebSocket को deterministic in-browser mocks से replace करता है
- Expectations:
  - `pnpm test:e2e` के हिस्से के रूप में CI में चलता है
  - वास्तविक Gateway, agents, या provider keys आवश्यक नहीं
  - Browser dependency मौजूद होनी चाहिए (`pnpm --dir ui exec playwright install chromium`)

### E2E: OpenShell backend smoke

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - active local OpenShell gateway का पुनः उपयोग करता है
  - temporary local Dockerfile से sandbox बनाता है
  - वास्तविक `sandbox ssh-config` + SSH exec पर OpenClaw के OpenShell backend को exercise करता है
  - sandbox fs bridge के माध्यम से remote-canonical filesystem behavior verify करता है
- Expectations:
  - केवल opt-in; default `pnpm test:e2e` run का हिस्सा नहीं
  - local `openshell` CLI और working Docker daemon आवश्यक हैं
  - active local OpenShell gateway और उसका config source आवश्यक है
  - isolated `HOME` / `XDG_CONFIG_HOME` का उपयोग करता है, फिर test sandbox destroy करता है
- Useful overrides:
  - broader e2e suite manually चलाते समय test enable करने के लिए `OPENCLAW_E2E_OPENSHELL=1`
  - non-default CLI binary या wrapper script की ओर point करने के लिए `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - registered gateway config को isolated test में expose करने के लिए `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture द्वारा उपयोग किए गए Docker gateway IP को override करने के लिए `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live (real providers + real models)

- कमांड: `pnpm test:live`
- कॉन्फ़िग: `vitest.live.config.ts`
- फ़ाइलें: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, और `extensions/` के अंतर्गत बंडल किए गए-plugin live परीक्षण
- डिफ़ॉल्ट: `pnpm test:live` द्वारा **सक्षम** (`OPENCLAW_LIVE_TEST=1` सेट करता है)
- दायरा:
  - "क्या यह provider/model वास्तविक क्रेडेंशियल के साथ _आज_ सच में काम करता है?"
  - provider फ़ॉर्मैट बदलाव, tool-calling quirks, auth समस्याएँ, और rate limit व्यवहार पकड़ना
- अपेक्षाएँ:
  - डिज़ाइन के अनुसार CI-स्थिर नहीं (वास्तविक नेटवर्क, वास्तविक provider नीतियाँ, कोटा, आउटेज)
  - पैसे खर्च करता है / rate limits का उपयोग करता है
  - "सब कुछ" चलाने के बजाय सीमित subsets चलाना बेहतर है
- Live रन पहले से exported API keys और staged auth profiles का उपयोग करते हैं।
- डिफ़ॉल्ट रूप से, live रन फिर भी `HOME` को isolate करते हैं और config/auth सामग्री को temp test home में कॉपी करते हैं ताकि unit fixtures आपके वास्तविक `~/.openclaw` को mutate न कर सकें।
- `OPENCLAW_LIVE_USE_REAL_HOME=1` केवल तब सेट करें जब आपको जानबूझकर live tests के लिए अपनी वास्तविक home directory का उपयोग कराना हो।
- `pnpm test:live` डिफ़ॉल्ट रूप से शांत मोड में रहता है: यह `[live] ...` progress output रखता है और gateway bootstrap logs/Bonjour chatter को mute करता है। यदि आप full startup logs वापस चाहते हैं, तो `OPENCLAW_LIVE_TEST_QUIET=0` सेट करें।
- API key rotation (provider-specific): comma/semicolon format के साथ `*_API_KEYS` या `*_API_KEY_1`, `*_API_KEY_2` सेट करें (उदाहरण के लिए `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) या `OPENCLAW_LIVE_*_KEY` के ज़रिए per-live override करें; tests rate limit responses पर retry करते हैं।
- Progress/Heartbeat output:
  - Live suites अब stderr पर progress lines emit करते हैं ताकि लंबे provider calls Vitest console capture शांत होने पर भी visibly active रहें।
  - `vitest.live.config.ts` Vitest console interception को disable करता है ताकि provider/gateway progress lines live runs के दौरान तुरंत stream हों।
  - direct-model Heartbeat को `OPENCLAW_LIVE_HEARTBEAT_MS` से tune करें।
  - gateway/probe Heartbeat को `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` से tune करें।

## मुझे कौन-सा suite चलाना चाहिए?

इस decision table का उपयोग करें:

- logic/tests edit करना: `pnpm test` चलाएँ (और यदि आपने बहुत कुछ बदला है तो `pnpm test:coverage`)
- gateway networking / WS protocol / pairing को छूना: `pnpm test:e2e` जोड़ें
- "my bot is down" / provider-specific failures / tool calling debug करना: सीमित `pnpm test:live` चलाएँ

## Live (network-touching) tests

live model matrix, CLI backend smokes, ACP smokes, Codex app-server
harness, और सभी media-provider live tests (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - साथ ही live runs के लिए credential handling - के लिए
[Live suites का परीक्षण](/hi/help/testing-live) देखें। dedicated update और
plugin validation checklist के लिए
[Updates और plugins का परीक्षण](/hi/help/testing-updates-plugins) देखें।

## Docker runners (वैकल्पिक "Linux में काम करता है" checks)

ये Docker runners दो buckets में विभाजित होते हैं:

- Live-model runners: `test:docker:live-models` और `test:docker:live-gateway` केवल अपनी matching profile-key live file को repo Docker image के अंदर चलाते हैं (`src/agents/models.profiles.live.test.ts` और `src/gateway/gateway-models.profiles.live.test.ts`), आपके local config dir, workspace, और optional profile env file को mount करते हुए। matching local entrypoints `test:live:models-profiles` और `test:live:gateway-profiles` हैं।
- Docker live runners जहाँ ज़रूरत हो वहाँ अपनी practical caps रखते हैं:
  `test:docker:live-models` curated supported high-signal set पर default होता है, और
  `test:docker:live-gateway` `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, और
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` पर default होता है। जब आपको स्पष्ट रूप से छोटा cap या बड़ा scan चाहिए, तो `OPENCLAW_LIVE_MAX_MODELS`
  या gateway env vars सेट करें।
- `test:docker:all` `test:docker:live-build` के ज़रिए live Docker image को एक बार build करता है, `scripts/package-openclaw-for-docker.mjs` के माध्यम से OpenClaw को npm tarball के रूप में एक बार pack करता है, फिर दो `scripts/e2e/Dockerfile` images build/reuse करता है। bare image केवल install/update/plugin-dependency lanes के लिए Node/Git runner है; वे lanes prebuilt tarball mount करते हैं। functional image built-app functionality lanes के लिए उसी tarball को `/app` में install करती है। Docker lane definitions `scripts/lib/docker-e2e-scenarios.mjs` में रहती हैं; planner logic `scripts/lib/docker-e2e-plan.mjs` में रहती है; `scripts/test-docker-all.mjs` selected plan execute करता है। aggregate weighted local scheduler का उपयोग करता है: `OPENCLAW_DOCKER_ALL_PARALLELISM` process slots नियंत्रित करता है, जबकि resource caps heavy live, npm-install, और multi-service lanes को एक साथ शुरू होने से रोकते हैं। यदि कोई single lane active caps से भारी है, तो scheduler pool खाली होने पर फिर भी उसे शुरू कर सकता है और फिर capacity फिर उपलब्ध होने तक उसे अकेले running रखता है। Defaults 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, और `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` हैं; `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` या `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` केवल तब tune करें जब Docker host में अधिक headroom हो। runner default रूप से Docker preflight करता है, stale OpenClaw E2E containers हटाता है, हर 30 seconds में status print करता है, successful lane timings को `.artifacts/docker-tests/lane-timings.json` में store करता है, और बाद के runs में लंबे lanes पहले start करने के लिए उन timings का उपयोग करता है। Docker build या run किए बिना weighted lane manifest print करने के लिए `OPENCLAW_DOCKER_ALL_DRY_RUN=1` का उपयोग करें, या selected lanes, package/image needs, और credentials के लिए CI plan print करने हेतु `node scripts/test-docker-all.mjs --plan-json` चलाएँ।
- `Package Acceptance` "क्या यह installable tarball product के रूप में काम करता है?" के लिए GitHub-native package gate है। यह `source=npm`, `source=ref`, `source=url`, या `source=artifact` से एक candidate package resolve करता है, उसे `package-under-test` के रूप में upload करता है, फिर selected ref को repack करने के बजाय उसी exact tarball के विरुद्ध reusable Docker E2E lanes चलाता है। Profiles breadth के अनुसार ordered हैं: `smoke`, `package`, `product`, और `full`। package/update/plugin contract, published-upgrade survivor matrix, release defaults, और failure triage के लिए [Updates और plugins का परीक्षण](/hi/help/testing-updates-plugins) देखें।
- Build और release checks tsdown के बाद `scripts/check-cli-bootstrap-imports.mjs` चलाते हैं। guard `dist/entry.js` और `dist/cli/run-main.js` से static built graph walk करता है और command dispatch से पहले Commander, prompt UI, undici, या logging जैसी package dependencies को pre-dispatch startup imports करने पर fail करता है; यह bundled gateway run chunk को budget के अंदर भी रखता है और known cold gateway paths के static imports को reject करता है। Packaged CLI smoke root help, onboard help, doctor help, status, config schema, और model-list command को भी cover करता है।
- Package Acceptance legacy compatibility `2026.4.25` (`2026.4.25-beta.*` शामिल) पर capped है। उस cutoff तक, harness केवल shipped-package metadata gaps tolerate करता है: omitted private QA inventory entries, missing `gateway install --wrapper`, tarball-derived git fixture में missing patch files, missing persisted `update.channel`, legacy plugin install-record locations, missing marketplace install-record persistence, और `plugins update` के दौरान config metadata migration। `2026.4.25` के बाद के packages के लिए, वे paths strict failures हैं।
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, और `test:docker:config-reload` एक या अधिक वास्तविक containers boot करते हैं और higher-level integration paths verify करते हैं।
- Docker/Bash E2E lanes जो packed OpenClaw tarball को `scripts/lib/openclaw-e2e-instance.sh` के माध्यम से install करते हैं, `npm install` को `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (default `600s`; debugging के लिए wrapper disable करने हेतु `0` सेट करें) पर cap करते हैं।

live-model Docker runners केवल आवश्यक CLI auth homes को भी bind-mount करते हैं (या run narrowed न होने पर सभी supported ones), फिर run से पहले उन्हें container home में copy करते हैं ताकि external-CLI OAuth host auth store को mutate किए बिना tokens refresh कर सके:

- Direct models: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; default रूप से Claude, Codex, और Gemini cover करता है, Droid/OpenCode coverage strict रूप से `pnpm test:docker:live-acp-bind:droid` और `pnpm test:docker:live-acp-bind:opencode` के ज़रिए)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Observability smokes: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, और `pnpm qa:observability:smoke` private QA source-checkout lanes हैं। वे जानबूझकर package Docker release lanes का हिस्सा नहीं हैं क्योंकि npm tarball QA Lab को omit करता है।
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Onboarding wizard (TTY, full scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` packed OpenClaw tarball को Docker में globally install करता है, env-ref onboarding के ज़रिए OpenAI और default रूप से Telegram configure करता है, doctor चलाता है, और एक mocked OpenAI agent turn चलाता है। prebuilt tarball को `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` के साथ reuse करें, host rebuild को `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` से skip करें, या channel को `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` या `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` से switch करें।

- रिलीज़ उपयोगकर्ता यात्रा स्मोक: `pnpm test:docker:release-user-journey` पैक किए गए OpenClaw tarball को साफ Docker home में वैश्विक रूप से इंस्टॉल करता है, onboarding चलाता है, mocked OpenAI provider कॉन्फ़िगर करता है, agent turn चलाता है, बाहरी plugins इंस्टॉल/अनइंस्टॉल करता है, ClickClack को local fixture के विरुद्ध कॉन्फ़िगर करता है, outbound/inbound messaging सत्यापित करता है, Gateway पुनः प्रारंभ करता है, और doctor चलाता है।
- रिलीज़ typed onboarding स्मोक: `pnpm test:docker:release-typed-onboarding` पैक किया गया tarball इंस्टॉल करता है, वास्तविक TTY के माध्यम से `openclaw onboard` चलाता है, OpenAI को env-ref provider के रूप में कॉन्फ़िगर करता है, सत्यापित करता है कि कोई raw key persistence नहीं है, और mocked agent turn चलाता है।
- रिलीज़ media/memory स्मोक: `pnpm test:docker:release-media-memory` पैक किया गया tarball इंस्टॉल करता है, PNG attachment से image understanding, OpenAI-संगत image generation output, memory search recall, और Gateway restart के पार recall survival सत्यापित करता है।
- रिलीज़ upgrade उपयोगकर्ता यात्रा स्मोक: `pnpm test:docker:release-upgrade-user-journey` डिफ़ॉल्ट रूप से candidate tarball से पुराना नवीनतम प्रकाशित baseline इंस्टॉल करता है, प्रकाशित package पर provider/plugin/ClickClack state कॉन्फ़िगर करता है, candidate tarball पर upgrade करता है, फिर core agent/plugin/channel journey फिर से चलाता है। यदि कोई पुराना प्रकाशित baseline मौजूद नहीं है, तो यह candidate version का फिर से उपयोग करता है। baseline को `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` से override करें।
- रिलीज़ Plugin marketplace स्मोक: `pnpm test:docker:release-plugin-marketplace` local fixture marketplace से इंस्टॉल करता है, इंस्टॉल किए गए Plugin को update करता है, उसे uninstall करता है, और सत्यापित करता है कि install metadata prune होने के साथ Plugin CLI गायब हो जाता है।
- Skill install स्मोक: `pnpm test:docker:skill-install` पैक किए गए OpenClaw tarball को Docker में वैश्विक रूप से इंस्टॉल करता है, config में uploaded archive installs अक्षम करता है, search से मौजूदा live ClawHub skill slug resolve करता है, उसे `openclaw skills install` से इंस्टॉल करता है, और installed skill तथा `.clawhub` origin/lock metadata सत्यापित करता है।
- Update channel switch स्मोक: `pnpm test:docker:update-channel-switch` पैक किए गए OpenClaw tarball को Docker में वैश्विक रूप से इंस्टॉल करता है, package `stable` से git `dev` पर switch करता है, persisted channel और plugin post-update work सत्यापित करता है, फिर package `stable` पर वापस switch करता है और update status जांचता है।
- Upgrade survivor स्मोक: `pnpm test:docker:upgrade-survivor` agents, channel config, plugin allowlists, stale plugin dependency state, और मौजूदा workspace/session files वाले dirty old-user fixture पर पैक किया गया OpenClaw tarball इंस्टॉल करता है। यह live provider या channel keys के बिना package update और non-interactive doctor चलाता है, फिर loopback Gateway शुरू करता है और config/state preservation तथा startup/status budgets जांचता है।
- Published upgrade survivor स्मोक: `pnpm test:docker:published-upgrade-survivor` डिफ़ॉल्ट रूप से `openclaw@latest` इंस्टॉल करता है, realistic existing-user files seed करता है, उस baseline को baked command recipe से कॉन्फ़िगर करता है, resulting config validate करता है, उस published install को candidate tarball पर update करता है, non-interactive doctor चलाता है, `.artifacts/upgrade-survivor/summary.json` लिखता है, फिर loopback Gateway शुरू करता है और configured intents, state preservation, startup, `/healthz`, `/readyz`, और RPC status budgets जांचता है। एक baseline को `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` से override करें, aggregate scheduler से exact local baselines को `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` के साथ expand करने के लिए कहें, जैसे `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, और issue-shaped fixtures को `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` के साथ expand करें, जैसे `reported-issues`; reported-issues set में automatic external OpenClaw plugin install repair के लिए `configured-plugin-installs` शामिल है। Package Acceptance इन्हें `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, और `published_upgrade_survivor_scenarios` के रूप में expose करता है, `last-stable-4` या `all-since-2026.4.23` जैसे meta baseline tokens resolve करता है, और Full Release Validation release-soak package gate को `last-stable-4 2026.4.23 2026.5.2 2026.4.15` तथा `reported-issues` तक expand करता है।
- Session runtime context स्मोक: `pnpm test:docker:session-runtime-context` hidden runtime context transcript persistence और प्रभावित duplicated prompt-rewrite branches की doctor repair सत्यापित करता है।
- Bun global install स्मोक: `bash scripts/e2e/bun-global-install-smoke.sh` मौजूदा tree को pack करता है, isolated home में `bun install -g` से उसे इंस्टॉल करता है, और सत्यापित करता है कि `openclaw infer image providers --json` hang होने के बजाय bundled image providers लौटाता है। prebuilt tarball को `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` से reuse करें, host build को `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` से skip करें, या built Docker image से `dist/` को `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` से copy करें।
- Installer Docker स्मोक: `bash scripts/test-install-sh-docker.sh` अपने root, update, और direct-npm containers में एक npm cache साझा करता है। Update smoke candidate tarball पर upgrade करने से पहले stable baseline के रूप में npm `latest` को default करता है। स्थानीय रूप से `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` से, या GitHub पर Install Smoke workflow के `update_baseline_version` input से override करें। Non-root installer checks isolated npm cache रखते हैं ताकि root-owned cache entries user-local install behavior को mask न करें। local reruns में root/update/direct-npm cache को reuse करने के लिए `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` set करें।
- Install Smoke CI duplicate direct-npm global update को `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` से skip करता है; जब direct `npm install -g` coverage चाहिए हो, तो script को उस env के बिना स्थानीय रूप से चलाएं।
- Agents delete shared workspace CLI स्मोक: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) डिफ़ॉल्ट रूप से root Dockerfile image build करता है, isolated container home में एक workspace के साथ दो agents seed करता है, `agents delete --json` चलाता है, और valid JSON तथा retained workspace behavior सत्यापित करता है। install-smoke image को `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` से reuse करें।
- Gateway networking (दो containers, WS auth + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot स्मोक: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) source E2E image और Chromium layer build करता है, raw CDP के साथ Chromium शुरू करता है, `browser doctor --deep` चलाता है, और सत्यापित करता है कि CDP role snapshots link URLs, cursor-promoted clickables, iframe refs, और frame metadata cover करते हैं।
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) mocked OpenAI server को Gateway के माध्यम से चलाता है, सत्यापित करता है कि `web_search` `reasoning.effort` को `minimal` से `low` तक बढ़ाता है, फिर provider schema reject को force करता है और जांचता है कि raw detail Gateway logs में दिखाई देता है।
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame स्मोक): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP tools (real stdio MCP server + embedded OpenClaw profile allow/deny स्मोक): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (real Gateway + isolated cron और one-shot subagent runs के बाद stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (local path, `file:`, hoisted dependencies वाली npm registry, malformed npm package metadata, git moving refs, ClawHub kitchen-sink, marketplace updates, और Claude-bundle enable/inspect के लिए install/update smoke): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  ClawHub block skip करने के लिए `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` set करें, या default kitchen-sink package/runtime pair को `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` और `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` से override करें। `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` के बिना, test hermetic local ClawHub fixture server का उपयोग करता है।
- Plugin update unchanged स्मोक: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix स्मोक: `pnpm test:docker:plugin-lifecycle-matrix` packed OpenClaw tarball को bare container में इंस्टॉल करता है, npm plugin इंस्टॉल करता है, enable/disable toggle करता है, local npm registry के माध्यम से उसे upgrade और downgrade करता है, installed code delete करता है, फिर सत्यापित करता है कि uninstall अब भी stale state हटाता है जबकि हर lifecycle phase के लिए RSS/CPU metrics log करता है।
- Config reload metadata स्मोक: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` local path, `file:`, hoisted dependencies वाली npm registry, git moving refs, ClawHub fixtures, marketplace updates, और Claude-bundle enable/inspect के लिए install/update smoke cover करता है। `pnpm test:docker:plugin-update` installed plugins के लिए unchanged update behavior cover करता है। `pnpm test:docker:plugin-lifecycle-matrix` resource-tracked npm plugin install, enable, disable, upgrade, downgrade, और missing-code uninstall cover करता है।

shared functional image को manually prebuild और reuse करने के लिए:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` जैसे suite-specific image overrides set होने पर अब भी प्राथमिकता लेते हैं। जब `OPENCLAW_SKIP_DOCKER_BUILD=1` किसी remote shared image की ओर point करता है, scripts उसे pull करते हैं यदि वह पहले से local नहीं है। QR और installer Docker tests अपने स्वयं के Dockerfiles रखते हैं क्योंकि वे shared built-app runtime के बजाय package/install behavior validate करते हैं।

लाइव-मॉडल Docker रनर मौजूदा checkout को read-only रूप में bind-mount भी करते हैं और
उसे container के अंदर एक अस्थायी workdir में stage करते हैं। इससे runtime
image हल्की रहती है, जबकि Vitest फिर भी आपके ठीक उसी स्थानीय source/config के विरुद्ध चलता है।
staging चरण बड़े स्थानीय-केवल cache और app build outputs जैसे
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, और app-local `.build` या
Gradle output directories को छोड़ देता है, ताकि Docker live runs
machine-specific artifacts की copying में मिनट न लगाएँ।
वे `OPENCLAW_SKIP_CHANNELS=1` भी सेट करते हैं, ताकि gateway live probes container के अंदर
वास्तविक Telegram/Discord/आदि channel workers शुरू न करें।
`test:docker:live-models` अब भी `pnpm test:live` चलाता है, इसलिए जब आपको उस Docker lane से gateway
live coverage को सीमित या बाहर करना हो, तो
`OPENCLAW_LIVE_GATEWAY_*` भी pass through करें।
`test:docker:openwebui` एक उच्च-स्तरीय compatibility smoke है: यह OpenAI-compatible HTTP endpoints enabled के साथ
एक OpenClaw gateway container शुरू करता है,
उस gateway के विरुद्ध pinned Open WebUI container शुरू करता है, Open WebUI के माध्यम से sign in करता है,
सत्यापित करता है कि `/api/models` `openclaw/default` expose करता है, फिर
Open WebUI के `/api/chat/completions` proxy के माध्यम से एक
वास्तविक chat request भेजता है।
release-path CI checks के लिए `OPENWEBUI_SMOKE_MODE=models` सेट करें, जिन्हें
Open WebUI sign-in और model discovery के बाद रुक जाना चाहिए,
live model completion का इंतजार किए बिना।
पहला run साफ़ तौर पर धीमा हो सकता है, क्योंकि Docker को
Open WebUI image pull करनी पड़ सकती है और Open WebUI को अपना cold-start setup पूरा करना पड़ सकता है।
इस lane को उपयोग योग्य live model key चाहिए। इसे process
environment, staged auth profiles, या explicit `OPENCLAW_PROFILE_FILE` के माध्यम से दें।
सफल runs `{ "ok": true, "model":
"openclaw/default", ... }` जैसा छोटा JSON payload print करते हैं।
`test:docker:mcp-channels` जानबूझकर deterministic है और इसे
वास्तविक Telegram, Discord, या iMessage account की जरूरत नहीं है। यह seeded Gateway
container boot करता है, दूसरा container शुरू करता है जो `openclaw mcp serve` spawn करता है, फिर
routed conversation discovery, transcript reads, attachment metadata,
live event queue behavior, outbound send routing, और real stdio MCP bridge पर Claude-style channel +
permission notifications सत्यापित करता है। notification check
raw stdio MCP frames को सीधे inspect करता है, ताकि smoke यह validate करे कि
bridge वास्तव में क्या emit करता है, केवल वह नहीं जो कोई specific client SDK surface करता है।
`test:docker:agent-bundle-mcp-tools` deterministic है और इसे live
model key की जरूरत नहीं है। यह repo Docker image build करता है, container के अंदर एक real stdio MCP probe server
शुरू करता है, उस server को embedded OpenClaw bundle
MCP runtime के माध्यम से materialize करता है, tool execute करता है, फिर सत्यापित करता है कि `coding` और `messaging`
`bundle-mcp` tools रखते हैं, जबकि `minimal` और `tools.deny: ["bundle-mcp"]` उन्हें filter करते हैं।
`test:docker:cron-mcp-cleanup` deterministic है और इसे live model
key की जरूरत नहीं है। यह real stdio MCP probe server के साथ seeded Gateway शुरू करता है, एक
isolated cron turn और `sessions_spawn` one-shot child turn चलाता है, फिर सत्यापित करता है
कि MCP child process हर run के बाद exit होता है।

Manual ACP plain-language thread smoke (CI नहीं):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- regression/debug workflows के लिए इस script को रखें। ACP thread routing validation के लिए इसकी फिर जरूरत पड़ सकती है, इसलिए इसे delete न करें।

उपयोगी env vars:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) `/home/node/.openclaw` पर mounted
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) `/home/node/.openclaw/workspace` पर mounted
- `OPENCLAW_PROFILE_FILE=...` mounted और tests चलाने से पहले sourced
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` केवल `OPENCLAW_PROFILE_FILE` से sourced env vars verify करने के लिए, temporary config/workspace dirs का उपयोग करते हुए और बिना external CLI auth mounts के
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) Docker के अंदर cached CLI installs के लिए `/home/node/.npm-global` पर mounted
- `$HOME` के अंतर्गत external CLI auth dirs/files `/host-auth...` के अंतर्गत read-only mounted होते हैं, फिर tests शुरू होने से पहले `/home/node/...` में copy किए जाते हैं
  - Default dirs: `.minimax`
  - Default files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Narrowed provider runs केवल `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` से inferred जरूरी dirs/files mount करते हैं
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, या `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` जैसी comma list से manually override करें
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` run को सीमित करने के लिए
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` in-container providers filter करने के लिए
- `OPENCLAW_SKIP_DOCKER_BUILD=1` उन reruns के लिए existing `openclaw:local-live` image reuse करने के लिए जिन्हें rebuild की जरूरत नहीं है
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` यह सुनिश्चित करने के लिए कि creds profile store से आएँ (env से नहीं)
- `OPENCLAW_OPENWEBUI_MODEL=...` Open WebUI smoke के लिए gateway द्वारा exposed model चुनने के लिए
- `OPENCLAW_OPENWEBUI_PROMPT=...` Open WebUI smoke द्वारा उपयोग किए गए nonce-check prompt को override करने के लिए
- `OPENWEBUI_IMAGE=...` pinned Open WebUI image tag को override करने के लिए

## Docs sanity

doc edits के बाद docs checks चलाएँ: `pnpm check:docs`.
जब आपको in-page heading checks भी चाहिए हों, तो full Mintlify anchor validation चलाएँ: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

ये वास्तविक providers के बिना "real pipeline" regressions हैं:

- Gateway tool calling (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, config writes + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

हमारे पास पहले से कुछ CI-safe tests हैं जो "agent reliability evals" की तरह behave करते हैं:

- real gateway + agent loop के माध्यम से mock tool-calling (`src/gateway/gateway.test.ts`)।
- End-to-end wizard flows जो session wiring और config effects validate करते हैं (`src/gateway/gateway.test.ts`)।

Skills के लिए अभी भी क्या missing है (देखें [Skills](/hi/tools/skills)):

- **Decisioning:** जब prompt में skills listed हों, तो क्या agent सही skill चुनता है (या irrelevant ones से बचता है)?
- **Compliance:** क्या agent उपयोग से पहले `SKILL.md` पढ़ता है और required steps/args follow करता है?
- **Workflow contracts:** multi-turn scenarios जो tool order, session history carryover, और sandbox boundaries assert करते हैं।

Future evals को पहले deterministic रहना चाहिए:

- mock providers का उपयोग करने वाला scenario runner, जो tool calls + order, skill file reads, और session wiring assert करे।
- skill-focused scenarios का छोटा suite (use vs avoid, gating, prompt injection)।
- Optional live evals (opt-in, env-gated) केवल CI-safe suite मौजूद होने के बाद।

## Contract tests (plugin और channel shape)

Contract tests verify करते हैं कि हर registered Plugin और channel अपने
interface contract के अनुरूप है। वे सभी discovered plugins पर iterate करते हैं और
shape और behavior assertions का suite चलाते हैं। default `pnpm test` unit lane जानबूझकर
इन shared seam और smoke files को skip करता है; जब आप shared channel या provider surfaces touch करें,
तो contract commands explicit रूप से चलाएँ।

### Commands

- सभी contracts: `pnpm test:contracts`
- केवल channel contracts: `pnpm test:contracts:channels`
- केवल provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts` में स्थित:

- **plugin** - Basic plugin shape (id, name, capabilities)
- **setup** - Setup wizard contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handlers
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts` में स्थित।

- **status** - Channel status probes
- **registry** - Plugin registry shape

### Provider contracts

`src/plugins/contracts/*.contract.test.ts` में स्थित:

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### कब चलाएँ

- plugin-sdk exports या subpaths बदलने के बाद
- channel या provider plugin जोड़ने या modify करने के बाद
- plugin registration या discovery refactor करने के बाद

Contract tests CI में चलते हैं और वास्तविक API keys की जरूरत नहीं होती।

## Regressions जोड़ना (guidance)

जब आप live में discovered provider/model issue fix करते हैं:

- संभव हो तो CI-safe regression जोड़ें (mock/stub provider, या exact request-shape transformation capture करें)
- यदि यह inherently live-only है (rate limits, auth policies), तो live test को narrow और env vars के माध्यम से opt-in रखें
- bug पकड़ने वाली smallest layer target करना prefer करें:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke या CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` registry metadata (`listSecretTargetRegistryEntries()`) से हर SecretRef class के लिए एक sampled target derive करता है, फिर assert करता है कि traversal-segment exec ids rejected हैं।
  - यदि आप `src/secrets/target-registry-data.ts` में नया `includeInPlan` SecretRef target family जोड़ते हैं, तो उस test में `classifyTargetClass` update करें। test unclassified target ids पर जानबूझकर fail होता है, ताकि new classes silently skip न हो सकें।

## Related

- [Testing live](/hi/help/testing-live)
- [Testing updates and plugins](/hi/help/testing-updates-plugins)
- [CI](/hi/ci)
