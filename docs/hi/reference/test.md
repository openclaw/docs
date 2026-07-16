---
read_when:
    - परीक्षण चलाना या ठीक करना
summary: स्थानीय रूप से परीक्षण कैसे चलाएँ (vitest) और force/coverage मोड का उपयोग कब करें
title: परीक्षण
x-i18n:
    generated_at: "2026-07-16T17:12:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- संपूर्ण परीक्षण किट (सूट, लाइव, Docker): [परीक्षण](/hi/help/testing)
- अपडेट और Plugin पैकेज सत्यापन: [अपडेट और Plugin का परीक्षण](/hi/help/testing-updates-plugins)

## एजेंट डिफ़ॉल्ट

एजेंट सत्र केवल विश्वसनीय स्रोत के लिए और मौजूदा डिपेंडेंसी इंस्टॉलेशन
तैयार होने पर एक/कुछ केंद्रित परीक्षण और कम लागत वाली स्थैतिक जाँच स्थानीय रूप से चलाते हैं।
अविश्वसनीय रिपॉज़िटरी टूलिंग कभी भी स्थानीय रूप से निष्पादित न करें। बड़े सूट, typecheck/lint
फैन-आउट वाले परिवर्तित गेट, बिल्ड, Docker, पैकेज लेन, E2E, लाइव प्रमाण और
क्रॉस-प्लेटफ़ॉर्म सत्यापन Crabbox के माध्यम से दूरस्थ रूप से चलते हैं। विश्वसनीय मेंटेनर
के भारी प्रमाण के लिए डिफ़ॉल्ट Blacksmith Testbox है। कॉन्फ़िगर किया गया Testbox वर्कफ़्लो
क्रेडेंशियल हाइड्रेट करता है, इसलिए अविश्वसनीय योगदानकर्ता या फ़ोर्क कोड को इसके बजाय
सीक्रेट-रहित फ़ोर्क CI या सैनिटाइज़ किया हुआ प्रत्यक्ष AWS Crabbox उपयोग करना होगा।

प्रत्याशित कार्य के लिए पहले से वार्म न करें। पहला भारी कमांड तैयार होने पर
बैकएंड को आवश्यकतानुसार प्राप्त करें, बाद के भारी कमांड के लिए लौटाई गई `tbx_...` id
का पुनः उपयोग करें, प्रत्येक रन में वर्तमान चेकआउट सिंक करें और हैंडऑफ़ से पहले इसे रोक दें।

पहले सफल पुनः उपयोग के बाद, रैपर लीज़ के बेस, डिपेंडेंसी और Testbox
वर्कफ़्लो फ़िंगरप्रिंट को `.crabbox/testbox-leases/` के अंतर्गत रिकॉर्ड करता है।
केवल स्रोत के संपादन वार्म किए गए बॉक्स का पुनः उपयोग जारी रखते हैं। बदला हुआ मर्ज बेस, लॉकफ़ाइल,
पैकेज-मैनेजर इनपुट, रैपर या Testbox वर्कफ़्लो बंद स्थिति में विफल होता है और
नई लीज़ की आवश्यकता होती है। प्रत्येक रन फिर भी वर्तमान चेकआउट सिंक करता है।
`OPENCLAW_TESTBOX_ALLOW_STALE=1` केवल जानबूझकर किए जाने वाले निदान के लिए है,
रिलीज़ प्रमाण के लिए नहीं।

नीचे दिए गए स्थानीय परीक्षण कमांड मानव वर्कफ़्लो और सीमित एजेंट प्रमाण के लिए हैं।
दूरस्थ प्रदाता की अनुपलब्धता की सूचना देनी होगी; यह चुपचाप
व्यापक स्थानीय गेट चलाने की अनुमति नहीं है।

अविश्वसनीय भारी प्रमाण के लिए, `--provider aws` से आवश्यकतानुसार वार्म करें। प्रत्येक रन को
`CRABBOX_ENV_ALLOW=CI` सेट करना, `--provider aws --no-hydrate` पास करना और
डिपेंडेंसी इंस्टॉल करने या परीक्षण चलाने से पहले एक नई अस्थायी दूरस्थ `HOME`
का उपयोग करना होगा। उस अविश्वसनीय स्रोत के लिए समर्पित नई वार्म की गई लीज़ का उपयोग करें;
विश्वसनीय या पहले हाइड्रेट की गई लीज़ का कभी पुनः उपयोग न करें। साफ़ विश्वसनीय
`main` चेकआउट से इंस्टॉल किया गया विश्वसनीय Crabbox बाइनरी लॉन्च करें और केवल दूरस्थ PR को
`--fresh-pr` से फ़ेच करें; अविश्वसनीय चेकआउट के रैपर या कॉन्फ़िग को कभी स्थानीय रूप से निष्पादित न करें।
`CRABBOX_AWS_INSTANCE_PROFILE` को अनसेट करें और तब तक बंद स्थिति में विफल हों जब तक हल किया गया
`aws.instanceProfile` खाली न हो। किसी भी इंस्टॉल/परीक्षण से पहले, विश्वसनीय
एब्सोल्यूट-पाथ टूल का उपयोग करके IMDSv2 टोकन आवश्यक बनाएँ, प्रमाणित करें कि IAM क्रेडेंशियल
एंडपॉइंट 404 लौटाता है और सत्यापित करें कि दूरस्थ `git rev-parse HEAD` पूर्ण
समीक्षित PR हेड SHA के बराबर है। लीज़ को उस SHA से बाँधें और हेड बदलने पर
इसे रोककर फिर से वार्म करें। साफ़ `main` से विश्वसनीय `scripts/crabbox-untrusted-bootstrap.sh`
को `--fresh-pr` के साथ अपलोड करें; यह पिन किए गए Node/pnpm इंस्टॉल करता है, SHA
और पैकेज-मैनेजर पिन सत्यापित करता है, `HOME` को पृथक करता है, डिपेंडेंसी इंस्टॉल करता है और फिर
अनुरोधित परीक्षण निष्पादित करता है। यदि ब्रोकर यह प्रमाणित नहीं कर सकता कि कोई रोल नहीं है या कोई दूरस्थ PR मौजूद नहीं है,
तो सीक्रेट-रहित फ़ोर्क CI का उपयोग करें। `hydrate-github`, `--no-sync` या
क्रेडेंशियल-हाइड्रेटेड Testbox वर्कफ़्लो का उपयोग न करें।
सभी `CRABBOX_TAILSCALE*` ओवरराइड अनसेट करें, `--network public
--tailscale=false` को बाध्य करें, exit-node/LAN फ़्लैग साफ़ करें और कोई भी स्क्रिप्ट अपलोड करने से पहले `crabbox inspect` से
बिना Tailscale स्थिति वाली सार्वजनिक नेटवर्किंग की रिपोर्ट करना आवश्यक बनाएँ।

## नियमित स्थानीय क्रम

1. परिवर्तित-स्कोप Vitest प्रमाण के लिए `pnpm test:changed`।
2. एक फ़ाइल, डायरेक्टरी या स्पष्ट लक्ष्य के लिए `pnpm test <path-or-filter>`।
3. केवल तभी `pnpm test`, जब आपको जानबूझकर पूर्ण स्थानीय Vitest सूट की आवश्यकता हो।

Codex वर्कट्री या लिंक किए गए/स्पार्स चेकआउट में, एजेंट प्रत्यक्ष स्थानीय
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` से बचते हैं:

- तैयार डिपेंडेंसी के साथ सीमित केंद्रित प्रमाण:
  `node scripts/run-vitest.mjs <path-or-filter>`।
- पहले-वर्गीकरण वाली परिवर्तित जाँच: `node scripts/check-changed.mjs`; केवल दस्तावेज़,
  कोई-परिवर्तन नहीं और छोटी मेटाडेटा योजनाएँ डिपेंडेंसी तैयार होने पर स्थानीय रहती हैं,
  जबकि भारी या डिपेंडेंसी-विहीन योजनाएँ Testbox को सौंप दी जाती हैं।
- स्पष्ट रखी-गई-लीज़ वाला व्यापक प्रमाण: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, ताकि pnpm Testbox के भीतर चले।
- रैपर का अंतिम `exitCode` और टाइमिंग JSON ही कमांड परिणाम हैं। सफल SSH कमांड के बाद सौंपा गया Blacksmith GitHub Actions रन `cancelled` दिखा सकता है, क्योंकि Testbox को कीपअलाइव एक्शन के बाहर से रोका जाता है; इसे विफलता मानने से पहले रैपर सारांश और कमांड आउटपुट जाँचें।
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` और लक्षित `pnpm test ...` जैसे कमांड के लिए भारी-जाँच क्रमबद्धता को Git कॉमन डायरेक्टरी के बजाय वर्तमान वर्कट्री के भीतर रखता है। इसका उपयोग केवल उच्च-क्षमता वाले स्थानीय होस्ट पर करें, जब आप जानबूझकर लिंक की गई वर्कट्री में स्वतंत्र जाँच चलाते हों।

## मुख्य कमांड

परीक्षण रैपर रन एक छोटे `[test] passed|failed|skipped ... in ...` सारांश के साथ समाप्त होते हैं; Vitest की अपनी अवधि पंक्ति प्रति-शार्ड विवरण बनी रहती है।

| कमांड                                           | यह क्या करता है                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | स्पष्ट फ़ाइल/डायरेक्टरी लक्ष्य स्कोप किए गए Vitest लेन से रूट होते हैं। लक्ष्य-रहित रन पूर्ण-सूट प्रमाण हैं: स्थिर शार्ड समूह स्थानीय समानांतर निष्पादन के लिए लीफ़ कॉन्फ़िग तक विस्तारित होते हैं और शुरू होने से पहले अपेक्षित शार्ड फैन-आउट प्रिंट होता है। एक्सटेंशन समूह एक विशाल रूट-प्रोजेक्ट प्रोसेस के बजाय हमेशा प्रति-एक्सटेंशन शार्ड कॉन्फ़िग तक विस्तारित होता है।           |
| `pnpm test:changed`                               | कम लागत वाला स्मार्ट परिवर्तित-परीक्षण रन: प्रत्यक्ष परीक्षण संपादनों, सहोदर `*.test.ts` फ़ाइलों, स्पष्ट स्रोत मैपिंग और स्थानीय इंपोर्ट ग्राफ़ से सटीक लक्ष्य। व्यापक/कॉन्फ़िग/पैकेज परिवर्तन तब तक छोड़ दिए जाते हैं, जब तक वे सटीक परीक्षणों से मैप न हों।                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | स्पष्ट व्यापक परिवर्तित-परीक्षण रन; इसका उपयोग तब करें जब परीक्षण हार्नेस/कॉन्फ़िग/पैकेज संपादन को Vitest के व्यापक परिवर्तित-परीक्षण व्यवहार पर वापस जाना चाहिए।                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | कॉन्फ़िगर किया गया OpenClaw Gateway पोर्ट (डिफ़ॉल्ट `18789`) मुक्त करता है, फिर पृथक Gateway पोर्ट के साथ पूरा सूट चलाता है, ताकि सर्वर परीक्षण चल रहे इंस्टेंस से न टकराएँ।                                                                                                                                                                                    |
| `pnpm test:coverage`                              | डिफ़ॉल्ट यूनिट लेन (`vitest.unit.config.ts`) के लिए सूचनात्मक V8 कवरेज रिपोर्ट उत्सर्जित करता है; कोई कवरेज थ्रेशोल्ड लागू नहीं किया जाता।                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | `origin/main` के बाद से बदली फ़ाइलों के लिए केवल यूनिट कवरेज।                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | `origin/main` के विरुद्ध डिफ़ से ट्रिगर हुई आर्किटेक्चरल लेन दिखाता है।                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | निष्पादन चुनने से पहले परिवर्तित लेन का वर्गीकरण करता है। केवल दस्तावेज़, कोई-परिवर्तन नहीं और छोटी मेटाडेटा योजनाएँ डिपेंडेंसी तैयार होने पर स्थानीय रहती हैं; typecheck/lint फैन-आउट, अन्य भारी लेन या अनुपलब्ध स्थानीय डिपेंडेंसी वाली योजनाएँ CI के बाहर Crabbox/Testbox को सौंप दी जाती हैं। Vitest नहीं चलाता; परीक्षण प्रमाण के लिए `pnpm test:changed` या `pnpm test <target>` का उपयोग करें। |

## साझा परीक्षण स्थिति और प्रोसेस सहायक

- `src/test-utils/openclaw-test-state.ts`: Vitest से तब उपयोग करें जब किसी परीक्षण को पृथक `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, कॉन्फ़िग फ़िक्स्चर, वर्कस्पेस, एजेंट डायरेक्टरी या ऑथ-प्रोफ़ाइल स्टोर की आवश्यकता हो।
- `pnpm test:env-mutations:report`: उन परीक्षणों/हार्नेस की नॉन-ब्लॉकिंग रिपोर्ट जो `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` या संबंधित env कुंजियों को सीधे बदलते हैं। साझा परीक्षण-स्थिति सहायक के लिए माइग्रेशन उम्मीदवार खोजने हेतु इसका उपयोग करें।
- `test/helpers/openclaw-test-instance.ts`: एक ही स्थान पर चालू Gateway, CLI env, लॉग कैप्चर और क्लीनअप की आवश्यकता वाले प्रोसेस-स्तरीय E2E परीक्षण।
- `scripts/lib/docker-e2e-image.sh` को सोर्स करने वाली Docker/Bash E2E लेन `docker_e2e_test_state_shell_b64 <label> <scenario>` को कंटेनर में पास कर सकती हैं और इसे `scripts/lib/openclaw-e2e-instance.sh` से डीकोड कर सकती हैं; मल्टी-होम स्क्रिप्ट `docker_e2e_test_state_function_b64` पास कर सकती हैं और प्रत्येक फ़्लो में `openclaw_test_state_create <label> <scenario>` कॉल कर सकती हैं। `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` सोर्स करने योग्य होस्ट env फ़ाइल लिखता है (`create` से पहले का `--` नए Node रनटाइम को `--env-file` को Node फ़्लैग मानने से रोकता है)। Gateway लॉन्च करने वाली लेन एंट्रीपॉइंट रिज़ॉल्यूशन, मॉक OpenAI स्टार्टअप, फ़ोरग्राउंड/बैकग्राउंड लॉन्च, रेडीनेस प्रोब, स्थिति env एक्सपोर्ट, लॉग डंप और प्रोसेस क्लीनअप के लिए `scripts/lib/openclaw-e2e-instance.sh` को सोर्स कर सकती हैं।

## Control UI, TUI और एक्सटेंशन लेन

- **मॉक किया गया Control UI E2E:** `pnpm test:ui:e2e` उस Vitest + Playwright लेन को चलाता है जो Vite Control UI शुरू करती है और मॉक किए गए Gateway WebSocket के विरुद्ध वास्तविक Chromium पेज संचालित करती है। परीक्षण `ui/src/**/*.e2e.test.ts` में हैं; साझा मॉक/नियंत्रण `ui/src/test-helpers/control-ui-e2e.ts` में हैं। `pnpm test:e2e` में यह लेन शामिल है। लक्षित प्रमाण सहित, एजेंट रन डिफ़ॉल्ट रूप से Testbox/Crabbox का उपयोग करते हैं; केवल स्पष्ट स्थानीय फ़ॉलबैक के लिए `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` का उपयोग करें।
- **TUI PTY परीक्षण:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` तेज़ नकली-बैकएंड PTY लेन चलाता है। `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` या `pnpm tui:pty:test:watch --mode local` धीमा `tui --local` स्मोक परीक्षण चलाता है, जो केवल बाहरी मॉडल एंडपॉइंट को मॉक करता है। रॉ ANSI स्नैपशॉट के बजाय स्थिर दृश्यमान टेक्स्ट या फ़िक्स्चर कॉल का अभिकथन करें।
- `pnpm test:extensions` और `pnpm test extensions` सभी एक्सटेंशन/Plugin शार्ड चलाते हैं। भारी चैनल Plugin, ब्राउज़र Plugin और OpenAI समर्पित शार्ड के रूप में चलते हैं; अन्य Plugin समूह बैच में बने रहते हैं। `pnpm test extensions/<id>` एक बंडल की गई Plugin लेन चलाता है।
- सिबलिंग परीक्षणों वाली स्रोत फ़ाइलें व्यापक डायरेक्टरी ग्लॉब पर फ़ॉलबैक करने से पहले उस सिबलिंग पर मैप होती हैं। `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, और `src/plugins/contracts` के अंतर्गत सहायक फ़ाइलों में किए गए संपादन, निर्भरता पथ सटीक होने पर प्रत्येक शार्ड को व्यापक रूप से चलाने के बजाय आयात करने वाले परीक्षणों को चलाने के लिए स्थानीय इम्पोर्ट ग्राफ़ का उपयोग करते हैं।
- कॉन्ट्रैक्ट डायरेक्टरी लक्ष्य अपनी कॉन्ट्रैक्ट लेन में विस्तृत होते हैं: `pnpm test src/channels/plugins/contracts` चार चैनल कॉन्ट्रैक्ट कॉन्फ़िग चलाता है और `pnpm test src/plugins/contracts` Plugin कॉन्ट्रैक्ट कॉन्फ़िग चलाता है, क्योंकि सामान्य `channels`/`plugins` प्रोजेक्ट `contracts/**` को बाहर रखते हैं।
- `auto-reply` तीन समर्पित कॉन्फ़िग (`core`, `top-level`, `reply`) में विभाजित होता है, ताकि उत्तर हार्नेस हल्के शीर्ष-स्तरीय स्टेटस/टोकन/सहायक परीक्षणों पर हावी न हो।
- चयनित `plugin-sdk` और `commands` परीक्षण फ़ाइलें समर्पित हल्की लेन से रूट होती हैं, जो केवल `test/setup.ts` रखती हैं और रनटाइम-भारी मामलों को उनकी मौजूदा लेन पर छोड़ती हैं।
- मूल Vitest कॉन्फ़िग डिफ़ॉल्ट रूप से `pool: "threads"` और `isolate: false` का उपयोग करता है, और साझा गैर-पृथक रनर पूरे रिपॉज़िटरी के कॉन्फ़िग में सक्षम रहता है।
- `pnpm test:channels`, `vitest.channels.config.ts` चलाता है।

## Gateway और E2E

- Gateway एकीकरण ऑप्ट-इन है: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` या `pnpm test:gateway`।
- `pnpm test:e2e`: रिपॉज़िटरी E2E समुच्चय = `pnpm test:e2e:gateway && pnpm test:ui:e2e`।
- `pnpm test:e2e:gateway`: Gateway एंड-टू-एंड स्मोक परीक्षण (बहु-इंस्टेंस WS/HTTP/Node पेयरिंग)। `vitest.e2e.config.ts` में अनुकूली वर्कर के साथ डिफ़ॉल्ट रूप से `threads` + `isolate: false` का उपयोग होता है; `OPENCLAW_E2E_WORKERS=<n>` से समायोजित करें, और विस्तृत लॉग के लिए `OPENCLAW_E2E_VERBOSE=1` का उपयोग करें।
- `pnpm test:live`: प्रोवाइडर लाइव परीक्षण (Claude/Minimax/DeepSeek/z.ai/आदि, `*.live.test.ts` द्वारा नियंत्रित)। स्किप हटाने के लिए API कुंजियाँ और `LIVE=1` (या `OPENCLAW_LIVE_TEST=1`) आवश्यक हैं; विस्तृत आउटपुट के लिए `OPENCLAW_LIVE_TEST_QUIET=0` का उपयोग करें।

## संपूर्ण Docker सुइट (`pnpm test:docker:all`)

साझा लाइव-परीक्षण इमेज बनाता है, OpenClaw को एक बार npm टारबॉल के रूप में पैक करता है, एक मूल Node/Git रनर इमेज और उस टारबॉल को `/app` में इंस्टॉल करने वाली कार्यात्मक इमेज बनाता/पुनः उपयोग करता है, फिर भारित शेड्यूलर के माध्यम से Docker स्मोक लेन चलाता है। `scripts/package-openclaw-for-docker.mjs` एकमात्र स्थानीय/CI पैकेज पैकर है और Docker द्वारा उपयोग किए जाने से पहले टारबॉल तथा `dist/postinstall-inventory.json` को सत्यापित करता है।

- मूल इमेज (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): इंस्टॉलर/अपडेट/Plugin-निर्भरता लेन; कॉपी किए गए रिपॉज़िटरी स्रोतों के बजाय पहले से निर्मित टारबॉल माउंट करती है।
- कार्यात्मक इमेज (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): सामान्य निर्मित-ऐप कार्यक्षमता लेन।
- लेन परिभाषाएँ: `scripts/lib/docker-e2e-scenarios.mjs`। प्लानर: `scripts/lib/docker-e2e-plan.mjs`। एक्ज़ीक्यूटर: `scripts/test-docker-all.mjs`।
- `node scripts/test-docker-all.mjs --plan-json` Docker बनाए या चलाए बिना शेड्यूलर-स्वामित्व वाली CI योजना (लेन, इमेज प्रकार, पैकेज/लाइव-इमेज आवश्यकताएँ, स्टेट परिदृश्य, क्रेडेंशियल जाँच) उत्सर्जित करता है।

शेड्यूलिंग नियंत्रण (पर्यावरण चर, कोष्ठकों में डिफ़ॉल्ट):

| पर्यावरण चर                                                                                                         | डिफ़ॉल्ट             | उद्देश्य                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | प्रोसेस स्लॉट।                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | प्रोवाइडर-संवेदनशील टेल पूल।                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | भारी लाइव-प्रोवाइडर लेन सीमा।                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm-संसाधन लेन सीमा।                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | सेवा-संसाधन लेन सीमा।                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | प्रति-प्रोवाइडर भारी-लेन सीमाएँ।                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | अधिक सीमित प्रति-प्रोवाइडर सीमाएँ।                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | बड़े होस्ट के लिए ओवरराइड।                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | लेन प्रारंभों के बीच विलंब, स्थानीय Docker डेमन निर्माण तूफ़ानों से बचाता है।                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 मिनट) | प्रति-लेन फ़ॉलबैक टाइमआउट; चयनित लाइव/टेल लेन अधिक कड़ी सीमाएँ उपयोग करती हैं।                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | अस्थायी लाइव-प्रोवाइडर विफलताओं के लिए पुनः प्रयास।                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | बंद                 | Docker चलाए बिना लेन मैनिफ़ेस्ट प्रिंट करें।                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | सक्रिय-लेन स्थिति प्रिंट अंतराल।                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | चालू                  | सबसे लंबी अवधि को पहले रखने के क्रम के लिए `.artifacts/docker-tests/lane-timings.json` का पुनः उपयोग करें; अक्षम करने के लिए `0` पर सेट करें।                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | केवल निर्धारक/स्थानीय लेन के लिए `skip`, केवल लाइव-प्रोवाइडर लेन के लिए `only`। उपनाम: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`। केवल-लाइव मोड मुख्य और टेल लाइव लेन को एक सबसे-लंबी-अवधि-पहले पूल में मिलाता है, ताकि प्रोवाइडर बकेट Claude/Codex/Gemini कार्य को साथ पैक करें। |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI बैकएंड Docker सेटअप टाइमआउट।                                                                                                                                                                                                                                                          |

संसाधन सीमाओं के लिए पर्यावरण चर पैटर्न `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` है (संसाधन नाम अपरकेस में, गैर-अक्षरांकीय वर्ण `_` में समेटे जाते हैं)।

अन्य व्यवहार: रनर डिफ़ॉल्ट रूप से Docker की प्रीफ़्लाइट जाँच करता है, पुराने OpenClaw E2E कंटेनर साफ़ करता है, संगत लेन के बीच प्रोवाइडर CLI टूल कैश साझा करता है, और पहली विफलता के बाद नई पूल की गई लेन शेड्यूल करना बंद कर देता है, जब तक कि `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` सेट न हो। यदि कम-समानांतरता वाले होस्ट पर कोई लेन प्रभावी भार/संसाधन सीमा पार करती है, तो भी वह खाली पूल से शुरू होकर क्षमता जारी करने तक अकेले चल सकती है। प्रति-लेन लॉग, `summary.json`, `failures.json`, और चरण समयावधियाँ `.artifacts/docker-tests/<run-id>/` के अंतर्गत लिखी जाती हैं; धीमी लेन की जाँच के लिए `pnpm test:docker:timings <summary.json>` और कम लागत वाले लक्षित पुनः-रन कमांड प्रिंट करने के लिए `pnpm test:docker:rerun <run-id|summary.json|failures.json>` का उपयोग करें।

### उल्लेखनीय Docker लेन

| कमांड                                                                     | सत्यापित करता है                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | रॉ CDP + पृथक Gateway वाला Chromium-समर्थित स्रोत E2E कंटेनर; `browser doctor --deep` CDP भूमिका स्नैपशॉट में लिंक URL, कर्सर द्वारा क्लिक-योग्य बनाए गए तत्व, iframe संदर्भ और फ़्रेम मेटाडेटा शामिल होते हैं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | पैक किए गए टारबॉल को `skills.install.allowUploadedArchives: false` वाले मूलभूत Docker रनर में इंस्टॉल करता है, लाइव ClawHub खोज से मौजूदा स्किल स्लग निर्धारित करता है, `openclaw skills install` के माध्यम से इंस्टॉल करता है, और `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, तथा `skills info --json` को सत्यापित करता है।                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | केंद्रित CLI बैकएंड लाइव जाँच; Gemini के लिए संगत `:resume` और `:mcp` उपनाम उपलब्ध हैं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | Docker में चलने वाला OpenClaw + Open WebUI: साइन इन करता है, `/api/models` की जाँच करता है, और `/api/chat/completions` के माध्यम से वास्तविक प्रॉक्सी चैट चलाता है। उपयोग-योग्य लाइव मॉडल कुंजी आवश्यक है और यह बाहरी इमेज पुल करता है; यूनिट/e2e सुइट की तरह इसके CI-स्थिर होने की अपेक्षा नहीं है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | पहले से डेटा भरा Gateway कंटेनर और `openclaw mcp serve` शुरू करने वाला क्लाइंट कंटेनर: रूट किए गए वार्तालाप की खोज, ट्रांसक्रिप्ट रीड, अटैचमेंट मेटाडेटा, लाइव इवेंट क्यू व्यवहार, आउटबाउंड प्रेषण रूटिंग, और वास्तविक stdio ब्रिज पर Claude-शैली की चैनल + अनुमति सूचनाएँ (अभिकथन सीधे रॉ stdio MCP फ़्रेम पढ़ता है)।                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | पैक किए गए टारबॉल को पुराने उपयोगकर्ता के अस्वच्छ फ़िक्स्चर पर इंस्टॉल करता है, लाइव प्रोवाइडर/चैनल कुंजियों के बिना पैकेज अपडेट और गैर-संवादात्मक डॉक्टर चलाता है, लूपबैक Gateway शुरू करता है, और जाँचता है कि एजेंट/चैनल कॉन्फ़िगरेशन/Plugin अनुमत-सूचियाँ/वर्कस्पेस/सेशन फ़ाइलें/पुराने विरासती Plugin की निर्भरता स्थिति/स्टार्टअप/RPC स्थिति सुरक्षित रहती हैं।                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | डिफ़ॉल्ट रूप से `openclaw@latest` इंस्टॉल करता है, यथार्थवादी मौजूदा-उपयोगकर्ता फ़ाइलें पहले से भरता है, पहले से तैयार `openclaw config set` विधि से कॉन्फ़िगर करता है, पैक किए गए टारबॉल पर अपडेट करता है, गैर-संवादात्मक डॉक्टर चलाता है, `.artifacts/upgrade-survivor/summary.json` लिखता है, और `/healthz`, `/readyz`, RPC स्थिति की जाँच करता है। `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` से ओवरराइड करें, `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` से मैट्रिक्स विस्तृत करें, या `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` से परिदृश्य फ़िक्स्चर जोड़ें (इसमें `configured-plugin-installs` और `stale-source-plugin-shadow` शामिल हैं)। पैकेज स्वीकृति इन्हें `published_upgrade_survivor_baseline(s)` / `_scenarios` के रूप में उपलब्ध कराती है और `last-stable-4` या `all-since-2026.4.23` जैसे मेटा टोकन निर्धारित करती है। |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` परिदृश्य में प्रकाशित-अपग्रेड सर्वाइवर हार्नेस, जो डिफ़ॉल्ट रूप से `openclaw@2026.4.23` से शुरू होता है। `Update Migration` वर्कफ़्लो इसे `baselines=all-since-2026.4.23` के साथ विस्तृत करता है, ताकि पूर्ण रिलीज़ CI के बाहर कॉन्फ़िगर किए गए Plugin की निर्भरता सफ़ाई प्रमाणित की जा सके।                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | स्थानीय पथ, `file:`, होइस्ट की गई निर्भरताओं वाले npm रजिस्ट्री पैकेज, बदलते git संदर्भ, ClawHub फ़िक्स्चर, मार्केटप्लेस अपडेट, और Claude-बंडल सक्षम करने/जाँचने के लिए इंस्टॉल/अपडेट स्मोक जाँच।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## स्थानीय PR गेट

स्थानीय PR लैंडिंग/गेट जाँच के लिए, चलाएँ:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

यदि लोड वाले होस्ट पर `pnpm test` अस्थायी रूप से विफल होता है, तो इसे रिग्रेशन मानने से पहले एक बार पुनः चलाएँ, फिर `pnpm test <path/to/test>` से पृथक करें। मेमोरी-सीमित होस्ट के लिए:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## परीक्षण प्रदर्शन टूलिंग

- `pnpm test:perf:imports`: स्पष्ट फ़ाइल/डायरेक्टरी लक्ष्यों के लिए दायरा-निर्धारित लेन रूटिंग का उपयोग जारी रखते हुए Vitest इंपोर्ट-अवधि + इंपोर्ट-विवरण रिपोर्टिंग सक्षम करता है। `pnpm test:perf:imports:changed` उसी प्रोफ़ाइलिंग को `origin/main` के बाद बदली गई फ़ाइलों तक सीमित करता है।
- `pnpm test:perf:changed:bench -- --ref <git-ref>` समान कमिट किए गए git अंतर के लिए रूट किए गए परिवर्तन-मोड पथ की तुलना नेटिव रूट-प्रोजेक्ट रन से करता है; `pnpm test:perf:changed:bench -- --worktree` पहले कमिट किए बिना मौजूदा वर्कट्री परिवर्तन सेट को बेंचमार्क करता है।
- `pnpm test:perf:profile:main` Vitest मुख्य थ्रेड के लिए CPU प्रोफ़ाइल लिखता है (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` यूनिट रनर के लिए CPU + हीप प्रोफ़ाइल लिखता है (`.artifacts/vitest-runner-profile`)।
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: प्रत्येक पूर्ण-सुइट Vitest लीफ़ कॉन्फ़िगरेशन को क्रमिक रूप से चलाता है और समूहीकृत अवधि डेटा के साथ प्रति-कॉन्फ़िगरेशन JSON/लॉग आर्टिफ़ैक्ट लिखता है। पूर्ण-सुइट रिपोर्ट डिफ़ॉल्ट रूप से फ़ाइलों को पृथक करती हैं, ताकि पिछली फ़ाइलों के बनाए रखे गए मॉड्यूल ग्राफ़ और GC विरामों का भार बाद के अभिकथनों पर न पड़े; `-- --no-isolate` केवल तभी पास करें जब जानबूझकर साझा-वर्कर संचय की प्रोफ़ाइलिंग कर रहे हों। परीक्षण प्रदर्शन एजेंट धीमे-परीक्षण सुधारों का प्रयास करने से पहले इसे अपनी आधाररेखा के रूप में उपयोग करता है। `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` प्रदर्शन-केंद्रित परिवर्तन के बाद समूहीकृत रिपोर्ट की तुलना करता है।
- पूर्ण, एक्सटेंशन और इन्क्लूड-पैटर्न शार्ड रन `.artifacts/vitest-shard-timings.json` में स्थानीय समय डेटा अपडेट करते हैं; बाद के संपूर्ण-कॉन्फ़िगरेशन रन धीमे और तेज़ शार्ड को संतुलित करने के लिए उन समयावधियों का उपयोग करते हैं। इन्क्लूड-पैटर्न CI शार्ड समय कुंजी में शार्ड का नाम जोड़ते हैं, जिससे फ़िल्टर किए गए शार्ड की समयावधियाँ संपूर्ण-कॉन्फ़िगरेशन समय डेटा को बदले बिना दिखाई देती रहती हैं। स्थानीय समय आर्टिफ़ैक्ट को अनदेखा करने के लिए `OPENCLAW_TEST_PROJECTS_TIMINGS=0` सेट करें।

## बेंचमार्क

<Accordion title="मॉडल विलंबता (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

वैकल्पिक परिवेश चर: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`। डिफ़ॉल्ट प्रॉम्प्ट: "केवल एक शब्द में उत्तर दें: ok। कोई विराम-चिह्न या अतिरिक्त टेक्स्ट नहीं।"

</Accordion>

<Accordion title="CLI स्टार्टअप (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

प्रीसेट:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: दोनों प्रीसेट संयुक्त

आउटपुट में `sampleCount`, औसत, p50, p95, न्यूनतम/अधिकतम, एग्ज़िट-कोड/सिग्नल वितरण और प्रत्येक कमांड के लिए अधिकतम RSS शामिल हैं। `--cpu-prof-dir` / `--heap-prof-dir` प्रत्येक रन के लिए V8 प्रोफ़ाइल लिखते हैं।

सहेजा गया आउटपुट: `pnpm test:startup:bench:smoke`, `.artifacts/cli-startup-bench-smoke.json` लिखता है; `pnpm test:startup:bench:save`, `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`) लिखता है। चेक-इन किया गया फ़िक्स्चर: `test/fixtures/cli-startup-bench.json`, जिसे `pnpm test:startup:bench:update` द्वारा रीफ़्रेश और `pnpm test:startup:bench:check` द्वारा तुलना किया जाता है।

</Accordion>

<Accordion title="Gateway स्टार्टअप (scripts/bench-gateway-startup.ts)">

डिफ़ॉल्ट रूप से `dist/entry.js` पर बिल्ट CLI एंट्री का उपयोग होता है; पहले `pnpm build` चलाएँ। इसके बजाय सोर्स रनर को मापने के लिए `--entry scripts/run-node.mjs` पास करें और उन परिणामों को बिल्ट-एंट्री बेसलाइन से अलग रखें।

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

केस आईडी: `default`, `skipChannels` (चैनल स्टार्टअप छोड़ा गया), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 मैनिफ़ेस्ट Plugin), `fiftyStartupLazyPlugins` (50 स्टार्टअप-लेज़ी मैनिफ़ेस्ट Plugin)।

आउटपुट में पहली प्रोसेस का आउटपुट, `/healthz`, `/readyz`, HTTP लिसन लॉग समय, Gateway रेडी लॉग समय, CPU समय, CPU कोर अनुपात, अधिकतम RSS, हीप, स्टार्टअप ट्रेस मेट्रिक्स, इवेंट-लूप विलंब और Plugin लुकअप-टेबल के विस्तृत मेट्रिक्स शामिल हैं। स्क्रिप्ट चाइल्ड Gateway परिवेश में `OPENCLAW_GATEWAY_STARTUP_TRACE=1` सेट करती है।

`/healthz` जीवंतता है (HTTP सर्वर उत्तर दे सकता है)। `/readyz` उपयोग-योग्य तत्परता है (स्टार्टअप Plugin साइडकार, चैनल और रेडी-क्रिटिकल पोस्ट-अटैच कार्य स्थिर हो चुके हैं)। स्टार्टअप हुक असिंक्रोनस रूप से डिस्पैच होते हैं और तत्परता की गारंटी का हिस्सा नहीं हैं। रेडी लॉग समय Gateway का आंतरिक टाइमस्टैम्प है, जो प्रोसेस-पक्ष एट्रिब्यूशन के लिए उपयोगी है, लेकिन बाहरी `/readyz` प्रोब का विकल्प नहीं है।

परिवर्तनों की तुलना करते समय JSON आउटपुट या `--output` का उपयोग करें। `--cpu-prof-dir` का उपयोग केवल तभी करें, जब ट्रेस आउटपुट इंपोर्ट, कंपाइल या CPU-बाउंड कार्य की ओर संकेत करे, जिसे केवल चरण समय समझा नहीं सकते।

</Accordion>

<Accordion title="Gateway रीस्टार्ट (scripts/bench-gateway-restart.ts)">

केवल macOS और Linux (इन-प्रोसेस रीस्टार्ट के लिए SIGUSR1 का उपयोग करता है; Windows पर तुरंत विफल होता है)। वही बिल्ट-एंट्री डिफ़ॉल्ट और `--entry scripts/run-node.mjs` ओवरराइड, जो ऊपर Gateway स्टार्टअप में है।

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

केस आईडी: `skipChannels`, `skipChannelsAcpxProbe` (ACPX स्टार्टअप प्रोब चालू), `skipChannelsNoAcpxProbe` (प्रोब बंद), `default`, `fiftyPlugins`।

आउटपुट में अगला `/healthz`, अगला `/readyz`, डाउनटाइम, रीस्टार्ट रेडी समय, CPU, RSS, प्रतिस्थापन प्रोसेस के लिए स्टार्टअप ट्रेस मेट्रिक्स और सिग्नल हैंडलिंग, सक्रिय-कार्य ड्रेन, क्लोज़ चरणों, अगले स्टार्ट, रेडी समय तथा मेमोरी स्नैपशॉट के लिए रीस्टार्ट ट्रेस मेट्रिक्स शामिल हैं। स्क्रिप्ट `OPENCLAW_GATEWAY_STARTUP_TRACE=1` और `OPENCLAW_GATEWAY_RESTART_TRACE=1` सेट करती है।

जब कोई परिवर्तन रीस्टार्ट सिग्नलिंग, क्लोज़ हैंडलर, रीस्टार्ट के बाद स्टार्टअप, साइडकार शटडाउन, सेवा हैंडऑफ़ या रीस्टार्ट के बाद तत्परता को प्रभावित करता हो, तब इस बेंचमार्क का उपयोग करें। Gateway की कार्यप्रणाली को चैनल स्टार्टअप से अलग करने के लिए `skipChannels` से शुरू करें; `default` या Plugin-बहुल केस का उपयोग केवल तब करें, जब संकीर्ण केस रीस्टार्ट पथ को स्पष्ट कर दे। ट्रेस मेट्रिक्स एट्रिब्यूशन के संकेत हैं, निर्णय नहीं — रीस्टार्ट परिवर्तन का आकलन कई नमूनों, मेल खाते ओनर स्पैन, `/healthz`/`/readyz` व्यवहार और उपयोगकर्ता को दिखाई देने वाले रीस्टार्ट अनुबंध के आधार पर करें।

</Accordion>

## ऑनबोर्डिंग E2E (Docker)

वैकल्पिक; केवल कंटेनरीकृत ऑनबोर्डिंग स्मोक परीक्षणों के लिए आवश्यक। एक साफ़ Linux कंटेनर में पूर्ण कोल्ड-स्टार्ट प्रवाह:

```bash
scripts/e2e/onboard-docker.sh
```

इंटरैक्टिव विज़ार्ड को स्यूडो-tty के माध्यम से संचालित करता है, कॉन्फ़िगरेशन/वर्कस्पेस/सेशन फ़ाइलों को सत्यापित करता है, फिर Gateway शुरू करके `openclaw health` चलाता है।

## QR इंपोर्ट स्मोक (Docker)

सुनिश्चित करता है कि अनुरक्षित QR रनटाइम हेल्पर समर्थित Docker Node रनटाइम के अंतर्गत लोड होता है (Node 24 डिफ़ॉल्ट, Node 22 संगत):

```bash
pnpm test:docker:qr
```

## संबंधित

- [परीक्षण](/hi/help/testing)
- [लाइव परीक्षण](/hi/help/testing-live)
- [अपडेट और Plugin का परीक्षण](/hi/help/testing-updates-plugins)
