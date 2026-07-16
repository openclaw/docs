---
read_when:
    - डॉक्टर माइग्रेशन जोड़ना या संशोधित करना
    - ब्रेकिंग कॉन्फ़िगरेशन बदलाव प्रस्तुत करना
sidebarTitle: Doctor
summary: 'Doctor कमांड: स्वास्थ्य जाँच, कॉन्फ़िगरेशन माइग्रेशन और सुधार चरण'
title: डॉक्टर
x-i18n:
    generated_at: "2026-07-16T14:47:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` OpenClaw के लिए मरम्मत और माइग्रेशन टूल है। यह पुराने config/state को ठीक करता है, स्वास्थ्य की जाँच करता है और कार्रवाई योग्य मरम्मत चरण प्रदान करता है।

## त्वरित शुरुआत

```bash
openclaw doctor
```

### हेडलेस और ऑटोमेशन मोड

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    संकेत दिए बिना डिफ़ॉल्ट स्वीकार करें (लागू होने पर रीस्टार्ट/सेवा/सैंडबॉक्स मरम्मत चरणों सहित)।

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    संकेत दिए बिना अनुशंसित मरम्मत लागू करें (`--repair` एक उपनाम है)।

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI या प्रीफ़्लाइट ऑटोमेशन के लिए संरचित स्वास्थ्य जाँच चलाएँ। केवल-पठन: कोई
    संकेत, मरम्मत, माइग्रेशन, रीस्टार्ट या state लेखन नहीं।

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    आक्रामक मरम्मत भी लागू करें (कस्टम सुपरवाइज़र config को अधिलेखित करता है)।

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    संकेतों के बिना चलाएँ और केवल सुरक्षित माइग्रेशन लागू करें (config सामान्यीकरण +
    ऑन-डिस्क state स्थानांतरण)। मानव पुष्टि की आवश्यकता वाली रीस्टार्ट/सेवा/सैंडबॉक्स
    कार्रवाइयाँ छोड़ देता है। पुराने state माइग्रेशन का पता चलने पर वे अब भी स्वतः चलते हैं।

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    अतिरिक्त gateway इंस्टॉल के लिए सिस्टम सेवाएँ स्कैन करें (launchd/systemd/schtasks)।

  </Tab>
</Tabs>

लिखने से पहले परिवर्तनों की समीक्षा करने के लिए, पहले config फ़ाइल खोलें:

```bash
cat ~/.openclaw/openclaw.json
```

## केवल-पठन lint मोड

`openclaw doctor --lint`, `openclaw doctor --fix` का ऑटोमेशन-अनुकूल सहोदर है।
वे समान Doctor नियम रजिस्ट्री साझा करते हैं, लेकिन नियमों का चयन करने या उन पर
कार्रवाई करने का उनका तरीका समान नहीं है:

| मोड                     | संकेत   | config/state लिखता है     | आउटपुट                 | इसका उपयोग करें                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | हाँ       | नहीं                      | अनुकूल स्वास्थ्य रिपोर्ट | किसी व्यक्ति द्वारा स्थिति जाँचने के लिए         |
| `openclaw doctor --fix`  | कभी-कभी | हाँ, मरम्मत नीति के साथ | अनुकूल मरम्मत लॉग    | अनुमोदित मरम्मत लागू करने के लिए       |
| `openclaw doctor --lint` | नहीं        | नहीं                      | संरचित निष्कर्ष    | CI, प्रीफ़्लाइट और समीक्षा गेट के लिए |

डिफ़ॉल्ट `doctor --lint` व्यापक-सुरक्षित ऑटोमेशन प्रोफ़ाइल चलाता है: ऐसी जाँचें जो
स्थिर, स्थानीय और CI या प्रीफ़्लाइट आउटपुट में उपयोगी हैं। यह वैकल्पिक जाँचों को छोड़ देता है जो
परामर्शात्मक, परिवेश-संवेदनशील, सक्रिय-सेवा पर निर्भर, खाता/वर्कस्पेस
इन्वेंटरी या ऐतिहासिक सफ़ाई से संबंधित हैं। उन वैकल्पिक जाँचों सहित पूर्ण पंजीकृत
lint ऑडिट के लिए `doctor --lint --all` या लक्षित जाँच के लिए `--only <id>` का उपयोग करें।

`doctor --fix` lint की डिफ़ॉल्ट प्रोफ़ाइल का उपयोग नहीं करता और
`--all` स्वीकार नहीं करता। यह Doctor का क्रमबद्ध मरम्मत पथ चलाता है: आधुनिक स्वास्थ्य जाँचें
एक वैकल्पिक `repair()` कार्यान्वयन प्रदान कर सकती हैं और पुराने क्षेत्र अब भी अपने पुराने
Doctor मरम्मत प्रवाह का उपयोग करते हैं। कुछ lint निष्कर्ष जानबूझकर केवल निदानात्मक होते हैं, इसलिए
`--lint --all` में किसी जाँच के दिखाई देने का अर्थ यह नहीं है कि `--fix` उस क्षेत्र को बदल देगा।
यह अनुबंध `detect()` (निष्कर्ष रिपोर्ट करता है) को `repair()` (परिवर्तन/diff/दुष्प्रभाव
रिपोर्ट करता है) से अलग करता है, जिससे lint जाँचों को परिवर्तन योजनाकार बनाए बिना भविष्य के
`doctor --fix --dry-run` के लिए मार्ग खुला रहता है।

कुछ अंतर्निहित जाँचें आंतरिक रूप से डिफ़ॉल्ट-अक्षम होती हैं, ताकि वे डिफ़ॉल्ट
`doctor --lint` ऑटोमेशन प्रोफ़ाइल का भाग बने बिना `--all`, `--only` और Doctor मरम्मत प्रवाहों के लिए
उपलब्ध रहें। निष्कर्ष की गंभीरता अब भी प्रत्येक निष्कर्ष के अनुसार उत्सर्जित होती है
(`info`, `warning` या `error`); डिफ़ॉल्ट चयन गंभीरता
स्तर नहीं है।

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON आउटपुट फ़ील्ड:

- `ok`: क्या कोई निष्कर्ष चयनित गंभीरता सीमा पर या उससे ऊपर था
- `checksRun` / `checksSkipped`: संख्याएँ (प्रोफ़ाइल, `--only` या `--skip` द्वारा छोड़ी गईं)
- `findings`: `checkId`, `severity`, `message` और वैकल्पिक `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint` वाले संरचित निदान

निकास कोड:

| कोड | अर्थ                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | चयनित सीमा पर या उससे ऊपर कोई निष्कर्ष नहीं           |
| `1`  | एक या अधिक निष्कर्ष चयनित सीमा तक पहुँचे          |
| `2`  | निष्कर्ष उत्सर्जित होने से पहले कमांड/रनटाइम विफलता |

फ़्लैग:

- `--severity-min info|warning|error` (डिफ़ॉल्ट `warning`): क्या प्रिंट होता है और किस कारण गैर-शून्य निकास होता है, दोनों को नियंत्रित करता है।
- `--all`: डिफ़ॉल्ट ऑटोमेशन सेट से बाहर रखी गई वैकल्पिक जाँचों सहित प्रत्येक पंजीकृत lint जाँच चलाता है।
- `--only <id>` (दोहराने योग्य): केवल नामित जाँच id चलाएँ; अज्ञात id को त्रुटि निष्कर्ष के रूप में रिपोर्ट किया जाता है।
- `--skip <id>` (दोहराने योग्य): शेष रन सक्रिय रखते हुए किसी जाँच को बाहर रखें।
- `--json`, `--severity-min`, `--all`, `--only` और `--skip` के लिए `--lint` आवश्यक है; साधारण `openclaw doctor` और `--fix` रन उन्हें अस्वीकार करते हैं।

## यह क्या करता है (सारांश)

<AccordionGroup>
  <Accordion title="स्वास्थ्य, UI और अपडेट">
    - git इंस्टॉल के लिए वैकल्पिक प्री-फ़्लाइट अपडेट (केवल इंटरैक्टिव)।
    - UI प्रोटोकॉल ताज़गी जाँच (प्रोटोकॉल स्कीमा नया होने पर Control UI को फिर से बनाता है)।
    - स्वास्थ्य जाँच + रीस्टार्ट संकेत।
    - केवल समस्या वाले skill और plugin नोट; स्वस्थ इन्वेंटरी `openclaw skills check` और `openclaw plugins list` में रहती है।

  </Accordion>
  <Accordion title="Config और माइग्रेशन">
    - पुराने मान आकारों के लिए config सामान्यीकरण।
    - पुराने समतल `talk.*` फ़ील्ड से `talk.provider` + `talk.providers.<provider>` में Talk config माइग्रेशन।
    - पुराने Chrome extension config और Chrome MCP तत्परता के लिए ब्राउज़र माइग्रेशन जाँच।
    - OpenCode प्रदाता ओवरराइड चेतावनियाँ (`models.providers.opencode` / `opencode-zen` / `opencode-go`)।
    - पुराना OpenAI Codex प्रदाता/प्रोफ़ाइल माइग्रेशन (`openai-codex` → `openai`) और पुराने `models.providers.openai-codex` के लिए छायांकन चेतावनियाँ।
    - OpenAI Codex OAuth प्रोफ़ाइल के लिए OAuth TLS पूर्वापेक्षा जाँच।
    - जब `plugins.allow` प्रतिबंधात्मक हो, लेकिन टूल नीति अब भी वाइल्डकार्ड या plugin-स्वामित्व वाले टूल माँगती हो, तब plugin/tool अनुमतिसूची चेतावनियाँ।
    - पुराना ऑन-डिस्क state माइग्रेशन (सत्र/एजेंट निर्देशिका/WhatsApp प्रमाणीकरण)।
    - पुराना plugin manifest अनुबंध कुंजी माइग्रेशन (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)।
    - पुराना Cron स्टोर माइग्रेशन (`jobId`, `schedule.cron`, शीर्ष-स्तरीय डिलीवरी/payload फ़ील्ड, payload `provider`, `notify: true` Webhook फ़ॉलबैक जॉब)।
    - Codex CLI रनटाइम पिन मरम्मत (`agentRuntime.id: "codex-cli"` → `"codex"`) `agents.defaults`, `agents.list[]` और `models.providers.*` में (प्रति-मॉडल प्रविष्टियों सहित)।
    - plugin सक्षम होने पर पुराने plugin config की सफ़ाई; `plugins.enabled=false` होने पर पुराने plugin संदर्भ निष्क्रिय नियंत्रण config के रूप में संरक्षित रहते हैं।

  </Accordion>
  <Accordion title="State और अखंडता">
    - सत्र लॉक फ़ाइल निरीक्षण और पुराने लॉक की सफ़ाई।
    - प्रभावित 2026.4.24 बिल्ड द्वारा बनाई गई डुप्लिकेट प्रॉम्प्ट-पुनर्लेखन शाखाओं के लिए सत्र ट्रांसक्रिप्ट मरम्मत।
    - अटके हुए सबएजेंट की रीस्टार्ट-पुनर्प्राप्ति टॉम्बस्टोन पहचान, पुराने निरस्त पुनर्प्राप्ति फ़्लैग साफ़ करने के लिए `--fix` समर्थन सहित, ताकि स्टार्टअप चाइल्ड को बार-बार रीस्टार्ट-निरस्त न माने।
    - State अखंडता और अनुमति जाँच (सत्र, ट्रांसक्रिप्ट, state निर्देशिका)।
    - स्थानीय रूप से चलते समय config फ़ाइल अनुमति जाँच (chmod 600)।
    - मॉडल प्रमाणीकरण स्वास्थ्य: OAuth समाप्ति की जाँच करता है, समाप्त होने वाले टोकन रीफ़्रेश कर सकता है और प्रमाणीकरण-प्रोफ़ाइल कूलडाउन/अक्षम स्थितियों की रिपोर्ट करता है।

  </Accordion>
  <Accordion title="Gateway, सेवाएँ और सुपरवाइज़र">
    - सैंडबॉक्सिंग सक्षम होने पर सैंडबॉक्स इमेज मरम्मत।
    - पुरानी सेवा माइग्रेशन और अतिरिक्त gateway पहचान।
    - Matrix चैनल पुराना state माइग्रेशन (`--fix` / `--repair` मोड में)।
    - Gateway रनटाइम जाँच (सेवा इंस्टॉल है लेकिन चल नहीं रही; कैश किया गया launchd लेबल)।
    - चैनल स्थिति चेतावनियाँ (चल रहे gateway से जाँची गईं)।
    - चैनल-विशिष्ट अनुमति जाँच `openclaw channels capabilities` के अंतर्गत रहती हैं; उदाहरण के लिए, Discord वॉइस चैनल अनुमतियों का ऑडिट `openclaw channels capabilities --channel discord --target channel:<channel-id>` से किया जाता है।
    - स्थानीय TUI क्लाइंट के अब भी चलते रहने के साथ खराब Gateway इवेंट-लूप स्वास्थ्य के लिए WhatsApp प्रत्युत्तरशीलता जाँच; `--fix` केवल सत्यापित स्थानीय TUI क्लाइंट को रोकता है।
    - प्राथमिक मॉडल, फ़ॉलबैक, इमेज/वीडियो जनरेशन मॉडल, Heartbeat/सबएजेंट/Compaction ओवरराइड, हुक, चैनल मॉडल ओवरराइड और सत्र रूट पिन में पुराने `openai-codex/*` मॉडल संदर्भों के लिए Codex रूट मरम्मत; `--fix` उन्हें `openai/*` में पुनर्लिखता है, `openai-codex:*` प्रमाणीकरण प्रोफ़ाइल/क्रम को `openai:*` में माइग्रेट करता है, पुराने सत्र/पूर्ण-एजेंट रनटाइम पिन हटाता है और मरम्मत किए गए प्रभावी रूट को यह निर्धारित करने देता है कि Codex संगत है या नहीं।
    - वैकल्पिक मरम्मत के साथ सुपरवाइज़र config ऑडिट (launchd/systemd/schtasks)।
    - इंस्टॉल या अपडेट के दौरान shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` मान कैप्चर करने वाली gateway सेवाओं के लिए एम्बेडेड प्रॉक्सी परिवेश सफ़ाई।
    - Gateway रनटाइम जाँच (असमर्थित पुराने Bun सेवाएँ, संस्करण-प्रबंधक पथ)।
    - Gateway पोर्ट टकराव निदान (डिफ़ॉल्ट `18789`)।

  </Accordion>
  <Accordion title="प्रमाणीकरण, सुरक्षा और पेयरिंग">
    - खुली DM नीतियों के लिए सुरक्षा चेतावनियाँ।
    - स्थानीय टोकन मोड के लिए Gateway प्रमाणीकरण जाँच (कोई टोकन स्रोत मौजूद न होने पर टोकन जनरेशन की पेशकश करता है; टोकन SecretRef config को अधिलेखित नहीं करता)।
    - डिवाइस पेयरिंग समस्या पहचान (लंबित पहली बार के पेयर अनुरोध, लंबित भूमिका/स्कोप अपग्रेड, पुराने स्थानीय डिवाइस-टोकन कैश विचलन और पेयर किए गए रिकॉर्ड का प्रमाणीकरण विचलन)।

  </Accordion>
  <Accordion title="वर्कस्पेस और shell">
    - Linux पर systemd linger जाँच।
    - वर्कस्पेस बूटस्ट्रैप फ़ाइल आकार जाँच (संदर्भ फ़ाइलों के लिए कटाव/सीमा-निकट चेतावनियाँ)।
    - डिफ़ॉल्ट एजेंट के लिए Skills तत्परता जाँच; अनुपलब्ध बाइनरी, env, config या OS आवश्यकताओं वाले अनुमत skill की रिपोर्ट करता है और `--fix`, `skills.entries` में अनुपलब्ध skill को अक्षम कर सकता है।
    - Shell completion स्थिति जाँच और स्वतः इंस्टॉल/अपग्रेड।
    - मेमोरी खोज एम्बेडिंग प्रदाता तत्परता जाँच (स्थानीय मॉडल, रिमोट API कुंजी या QMD बाइनरी)।
    - स्रोत इंस्टॉल जाँच (pnpm वर्कस्पेस बेमेल, अनुपलब्ध UI एसेट, अनुपलब्ध tsx बाइनरी)।
    - अपडेट किया गया config + विज़ार्ड मेटाडेटा लिखता है।

  </Accordion>
</AccordionGroup>

## Dreams UI बैकफ़िल और रीसेट

Control UI के Dreams दृश्य में grounded dreaming कार्यप्रवाह के लिए **Backfill**, **Reset**, और **Clear Grounded** क्रियाएँ शामिल हैं। ये Gateway की doctor-शैली वाली RPC विधियों का उपयोग करती हैं, लेकिन `openclaw doctor` CLI सुधार/माइग्रेशन का हिस्सा **नहीं** हैं।

| क्रिया         | यह क्या करती है                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | सक्रिय कार्यस्थान में ऐतिहासिक `memory/YYYY-MM-DD.md` फ़ाइलों को स्कैन करती है, grounded REM डायरी पास चलाती है, और `DREAMS.md` में प्रतिवर्ती backfill प्रविष्टियाँ लिखती है। |
| Reset          | `DREAMS.md` से केवल चिह्नित backfill डायरी प्रविष्टियाँ हटाती है।                                                                                                  |
| Clear Grounded | ऐतिहासिक रीप्ले से केवल चरणबद्ध grounded-only अल्पकालिक प्रविष्टियाँ हटाती है, जिनमें अभी तक लाइव रिकॉल या दैनिक समर्थन संचित नहीं हुआ है।                           |

इनमें से कोई भी `MEMORY.md` को संपादित नहीं करती, पूर्ण doctor माइग्रेशन नहीं चलाती, या grounded उम्मीदवारों को अपने आप लाइव अल्पकालिक प्रमोशन स्टोर में चरणबद्ध नहीं करती। grounded ऐतिहासिक रीप्ले को सामान्य गहन प्रमोशन लेन में भेजने के लिए, इसके बजाय CLI प्रवाह का उपयोग करें:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

यह grounded टिकाऊ उम्मीदवारों को अल्पकालिक dreaming स्टोर में चरणबद्ध करता है, जबकि `DREAMS.md` समीक्षा सतह बनी रहती है।

## विस्तृत व्यवहार और औचित्य

<AccordionGroup>
  <Accordion title="0. वैकल्पिक अपडेट (git इंस्टॉल)">
    यदि यह git चेकआउट है और doctor इंटरैक्टिव रूप से चल रहा है, तो यह doctor चलाने से पहले अपडेट (fetch/rebase/build) करने का प्रस्ताव देता है।
  </Accordion>
  <Accordion title="1. कॉन्फ़िग सामान्यीकरण">
    Doctor पुराने मान आकारों को वर्तमान स्कीमा में सामान्यीकृत करता है। वर्तमान Talk स्पीच कॉन्फ़िग `talk.provider` + `talk.providers.<provider>` है, जिसमें रीयलटाइम वॉइस कॉन्फ़िग `talk.realtime.*` के अंतर्गत है। Doctor पुराने `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` आकारों को प्रोवाइडर मैप में दोबारा लिखता है, और पुराने शीर्ष-स्तरीय रीयलटाइम चयनकर्ताओं (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) को `talk.realtime` में दोबारा लिखता है।

    जब `plugins.allow` खाली नहीं होता और टूल नीति वाइल्डकार्ड या Plugin-स्वामित्व वाली टूल प्रविष्टियों का उपयोग करती है, तब Doctor चेतावनी भी देता है। `tools.allow: ["*"]` केवल वास्तव में लोड होने वाले plugins के टूल से मेल खाता है; यह विशिष्ट Plugin अनुमति-सूची को बायपास नहीं करता।

  </Accordion>
  <Accordion title="2. पुराने कॉन्फ़िग कुंजी माइग्रेशन">
    जब कॉन्फ़िग में सक्रिय माइग्रेशन वाली कोई अप्रचलित कुंजी होती है, तो अन्य कमांड चलने से मना कर देते हैं और आपसे `openclaw doctor` चलाने को कहते हैं। Doctor बताता है कि कौन-सी पुरानी कुंजियाँ मिलीं, लागू किया गया माइग्रेशन दिखाता है, और अपडेट किए गए स्कीमा के साथ `~/.openclaw/openclaw.json` को दोबारा लिखता है। Gateway स्टार्टअप पुराने कॉन्फ़िग प्रारूपों को अस्वीकार करता है और आपसे `openclaw doctor --fix` चलाने को कहता है; यह स्टार्टअप पर `openclaw.json` को दोबारा नहीं लिखता। Cron जॉब स्टोर माइग्रेशन भी `openclaw doctor --fix` द्वारा संभाले जाते हैं।

    <Note>
      किसी कुंजी के हटाए जाने के बाद Doctor केवल लगभग दो महीनों तक
      स्वचालित माइग्रेशन रखता है। अधिक पुरानी कुंजियों (उदाहरण के लिए मूल
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, शीर्ष-स्तरीय `agent.*`, या शीर्ष-स्तरीय `identity`
      जो मल्टी-एजेंट से पहले के कॉन्फ़िग आकार से हैं) के लिए अब कोई माइग्रेशन पथ नहीं है;
      उनका उपयोग करने वाला कॉन्फ़िग दोबारा लिखे जाने के बजाय अब सत्यापन में विफल होता है। Doctor के
      आगे बढ़ने से पहले उन कुंजियों को वर्तमान कॉन्फ़िग संदर्भ के अनुसार
      मैन्युअल रूप से ठीक करें।
    </Note>

    सक्रिय माइग्रेशन:

    | पुरानी कुंजी                                                                                    | वर्तमान कुंजी                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | हटाया गया (WebChat बंद कर दिया गया है)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (और प्रति-अकाउंट)      | `...threadBindings.idleHours`                                               |
    | पुराने `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | पुराने शीर्ष-स्तरीय रीयलटाइम Talk चयनकर्ता (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS स्पीकर फ़ील्ड `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (Discord को छोड़कर सभी चैनल)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (Discord सहित सभी चैनल)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (Gateway स्टार्टअप उन प्रोवाइडरों को भी छोड़ देता है जिनका `api` विफलता के साथ बंद होने के बजाय भविष्य/अज्ञात enum मान होता है) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | हटाया गया (पुरानी Chrome एक्सटेंशन रिले सेटिंग)                             |
    | `mcp.servers.*.type` (CLI-मूल उपनाम)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | हटाया गया (Codex ऐप-सर्वर हमेशा Codex-मूल कार्यस्थान टूल को मूल रूप में रखता है) |
    | `commands.modelsWrite`                                                                           | हटाया गया (`/models add` अप्रचलित है)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | हटाया गया (सटीक `NO_REPLY` को अब दृश्यमान फ़ॉलबैक टेक्स्ट में दोबारा नहीं लिखा जाता)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | हटाया गया (OpenClaw जनरेट किए गए सिस्टम प्रॉम्प्ट का स्वामी है)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | हटाया गया (धीमे मॉडल/प्रोवाइडर टाइमआउट के लिए `models.providers.<id>.timeoutSeconds` का उपयोग करें, जिसे एजेंट/रन टाइमआउट सीमा से नीचे रखा जाता है) |
    | शीर्ष-स्तरीय `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (किसी भी स्तर पर)                                                            | हटाया गया (मेमोरी इंडेक्स प्रत्येक एजेंट डेटाबेस में रहते हैं)                       |
    | शीर्ष-स्तरीय `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` नीति आईडी                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | हटाया गया (अप्रचलित)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      ऊपर की `plugins.entries.voice-call.config.*` पंक्तियाँ प्रत्येक कॉन्फ़िग लोड पर
      Voice Call Plugin द्वारा ही सामान्यीकृत की जाती हैं, `openclaw
      doctor` द्वारा नहीं। Plugin `openclaw
      doctor --fix` की ओर संकेत करने वाली स्टार्टअप चेतावनी भी लॉग करता है, लेकिन doctor वर्तमान में इन कुंजियों के लिए
      `openclaw.json` को दोबारा नहीं लिखता; Plugin का अपना सामान्यीकरण ही
      रनटाइम पर परिवर्तन लागू करता है।
    </Note>

    एकाधिक-अकाउंट चैनलों के लिए अकाउंट-डिफ़ॉल्ट मार्गदर्शन:

    - यदि दो या अधिक `channels.<channel>.accounts` प्रविष्टियाँ `channels.<channel>.defaultAccount` या `accounts.default` के बिना कॉन्फ़िगर की जाती हैं, तो doctor चेतावनी देता है कि फ़ॉलबैक रूटिंग किसी अप्रत्याशित अकाउंट को चुन सकती है।
    - यदि `channels.<channel>.defaultAccount` किसी अज्ञात अकाउंट आईडी पर सेट है, तो doctor चेतावनी देता है और कॉन्फ़िगर किए गए अकाउंट आईडी सूचीबद्ध करता है।

  </Accordion>
  <Accordion title="2b. OpenCode प्रदाता ओवरराइड">
    यदि आपने `models.providers.opencode`, `opencode-zen`, या `opencode-go` को मैन्युअल रूप से जोड़ा है, तो यह `openclaw/plugin-sdk/llm` से अंतर्निहित OpenCode कैटलॉग को ओवरराइड करता है। इससे मॉडल गलत API पर जा सकते हैं या लागत शून्य हो सकती है। Doctor चेतावनी देता है, ताकि आप ओवरराइड हटाकर प्रत्येक मॉडल के लिए API रूटिंग + लागत बहाल कर सकें।
  </Accordion>
  <Accordion title="2c. ब्राउज़र माइग्रेशन और Chrome MCP की तत्परता">
    यदि आपका ब्राउज़र कॉन्फ़िगरेशन अब भी हटाए गए Chrome एक्सटेंशन पथ की ओर संकेत करता है, तो doctor उसे वर्तमान होस्ट-स्थानीय Chrome MCP अटैच मॉडल के अनुरूप सामान्यीकृत करता है (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` हटाया गया)।

    जब आप `defaultProfile: "user"` या कॉन्फ़िगर की गई `existing-session` प्रोफ़ाइल का उपयोग करते हैं, तब Doctor होस्ट-स्थानीय Chrome MCP पथ का ऑडिट भी करता है:

    - जाँचता है कि डिफ़ॉल्ट स्वतः-कनेक्ट प्रोफ़ाइलों के लिए Google Chrome उसी होस्ट पर इंस्टॉल है या नहीं
    - पता लगाए गए Chrome संस्करण की जाँच करता है और उसके Chrome 144 से कम होने पर चेतावनी देता है
    - आपको ब्राउज़र निरीक्षण पृष्ठ में रिमोट डीबगिंग सक्षम करने की याद दिलाता है (उदाहरण के लिए `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, या `edge://inspect/#remote-debugging`)

    Doctor आपके लिए Chrome की ओर वाली सेटिंग सक्षम नहीं कर सकता। होस्ट-स्थानीय Chrome MCP के लिए अब भी gateway/node होस्ट पर स्थानीय रूप से चल रहा Chromium-आधारित ब्राउज़र 144+, सक्षम रिमोट डीबगिंग, और ब्राउज़र में पहले अटैच सहमति संकेत की स्वीकृति आवश्यक है।

    यहाँ तत्परता केवल स्थानीय अटैच की पूर्वापेक्षाओं को कवर करती है। मौजूदा-सत्र वर्तमान Chrome MCP रूट सीमाएँ बनाए रखता है; `responsebody`, PDF निर्यात, डाउनलोड इंटरसेप्शन, और बैच कार्रवाइयों जैसे उन्नत रूटों के लिए अब भी प्रबंधित ब्राउज़र या रॉ CDP प्रोफ़ाइल आवश्यक है। यह जाँच Docker, सैंडबॉक्स, रिमोट-ब्राउज़र, या अन्य हेडलेस प्रवाहों पर लागू नहीं होती, जो रॉ CDP का उपयोग जारी रखते हैं।

  </Accordion>
  <Accordion title="2d. OAuth TLS की पूर्वापेक्षाएँ">
    जब OpenAI Codex OAuth प्रोफ़ाइल कॉन्फ़िगर होती है, तो doctor यह सत्यापित करने के लिए OpenAI प्राधिकरण एंडपॉइंट की जाँच करता है कि स्थानीय Node/OpenSSL TLS स्टैक प्रमाणपत्र शृंखला को मान्य कर सकता है। यदि जाँच प्रमाणपत्र त्रुटि के साथ विफल होती है (उदाहरण के लिए `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, समाप्त प्रमाणपत्र, या स्व-हस्ताक्षरित प्रमाणपत्र), तो doctor प्लेटफ़ॉर्म-विशिष्ट सुधार मार्गदर्शन प्रिंट करता है। Homebrew Node वाले macOS पर, सुधार सामान्यतः `brew postinstall ca-certificates` होता है। `--deep` के साथ, gateway के स्वस्थ होने पर भी जाँच चलती है।
  </Accordion>
  <Accordion title="2e. Codex OAuth प्रदाता ओवरराइड">
    यदि आपने पहले `models.providers.openai-codex` के अंतर्गत पुराने OpenAI ट्रांसपोर्ट सेटिंग जोड़े थे, तो वे अंतर्निहित Codex OAuth प्रदाता पथ को ओझल कर सकते हैं। Doctor पुराने ट्रांसपोर्ट सेटिंग को Codex OAuth के साथ देखने पर चेतावनी देता है, ताकि आप अप्रचलित ट्रांसपोर्ट ओवरराइड को हटा या दोबारा लिखकर वर्तमान रूटिंग व्यवहार बहाल कर सकें। कस्टम प्रॉक्सी और केवल-हेडर ओवरराइड समर्थित रहते हैं और यह चेतावनी उत्पन्न नहीं करते, लेकिन वे उपयोगकर्ता-निर्मित अनुरोध रूट अंतर्निहित Codex चयन के पात्र नहीं होते।
  </Accordion>
  <Accordion title="2f. Codex रूट सुधार">
    Doctor पुराने `openai-codex/*` मॉडल संदर्भों की जाँच करता है। नेटिव Codex हार्नेस रूटिंग कैनोनिकल `openai/*` मॉडल संदर्भों का उपयोग करती है, लेकिन केवल प्रीफ़िक्स कभी Codex का चयन नहीं करता। रनटाइम नीति सेट न होने या `auto` होने पर, केवल बिना किसी उपयोगकर्ता-निर्मित अनुरोध ओवरराइड वाला सटीक आधिकारिक HTTPS Platform Responses या ChatGPT Responses रूट पात्र होता है। [OpenAI अंतर्निहित एजेंट रनटाइम](/hi/providers/openai#implicit-agent-runtime) देखें।

    `--fix` / `--repair` मोड में, doctor प्रभावित डिफ़ॉल्ट-एजेंट और प्रति-एजेंट संदर्भों को दोबारा लिखता है, जिनमें प्राथमिक मॉडल, फ़ॉलबैक, छवि/वीडियो जनरेशन मॉडल, heartbeat/सबएजेंट/compaction ओवरराइड, हुक, चैनल मॉडल ओवरराइड, और अप्रचलित स्थायी सत्र रूट स्थिति शामिल हैं:

    - `openai-codex/gpt-*`, `openai/gpt-*` बन जाता है।
    - Codex अभिप्राय सुधारे गए एजेंट मॉडल संदर्भों के लिए प्रदाता/मॉडल-स्कोप वाले `agentRuntime.id: "codex"` प्रविष्टियों में चला जाता है।
    - अप्रचलित पूरे-एजेंट रनटाइम कॉन्फ़िगरेशन और स्थायी सत्र रनटाइम पिन हटा दिए जाते हैं, क्योंकि रनटाइम चयन प्रदाता/मॉडल-स्कोप वाला है।
    - मौजूदा प्रदाता/मॉडल रनटाइम नीति तब तक संरक्षित रहती है, जब तक सुधारे गए पुराने मॉडल संदर्भ को पुराना प्रमाणीकरण पथ बनाए रखने के लिए Codex रूटिंग की आवश्यकता न हो।
    - मौजूदा मॉडल फ़ॉलबैक सूचियाँ संरक्षित रहती हैं और उनकी पुरानी प्रविष्टियाँ दोबारा लिखी जाती हैं; कॉपी की गई प्रति-मॉडल सेटिंग पुराने कुंजी से कैनोनिकल `openai/*` कुंजी में चली जाती हैं।
    - स्थायी सत्र `modelProvider`/`providerOverride`, `model`/`modelOverride`, फ़ॉलबैक सूचनाएँ, और प्रमाणीकरण-प्रोफ़ाइल पिन सभी खोजे गए एजेंट सत्र स्टोर में सुधारे जाते हैं।
    - Doctor अप्रचलित `agentRuntime.id: "codex-cli"` पिनों (एक अलग पुरानी रनटाइम आईडी) को `agents.defaults`, `agents.list[]`, और `models.providers.*` मॉडल प्रविष्टियों में अलग से `"codex"` में सुधारता है।
    - `/codex ...` का अर्थ है "चैट से नेटिव Codex वार्तालाप नियंत्रित या बाइंड करना।"
    - `/acp ...` या `runtime: "acp"` का अर्थ है "बाहरी ACP/acpx अडैप्टर का उपयोग करना।"

  </Accordion>
  <Accordion title="2g. सत्र रूट की सफ़ाई">
    Doctor आपके द्वारा कॉन्फ़िगर किए गए मॉडल या रनटाइम को Codex जैसे Plugin-स्वामित्व वाले रूट से हटाने के बाद अप्रचलित स्वतः-निर्मित रूट स्थिति के लिए खोजे गए एजेंट सत्र स्टोर भी स्कैन करता है।

    `openclaw doctor --fix`, स्वामित्व वाला रूट अब कॉन्फ़िगर न होने पर `modelOverrideSource: "auto"` मॉडल पिन, रनटाइम मॉडल मेटाडेटा, पिन किए गए हार्नेस आईडी, CLI सत्र बाइंडिंग, और स्वतः प्रमाणीकरण-प्रोफ़ाइल ओवरराइड जैसी स्वतः-निर्मित अप्रचलित स्थिति साफ़ कर सकता है। स्पष्ट उपयोगकर्ता या पुराने सत्र मॉडल विकल्पों को मैन्युअल समीक्षा के लिए रिपोर्ट किया जाता है और अपरिवर्तित छोड़ा जाता है; जब उस रूट का उपयोग अब अपेक्षित न हो, तो उन्हें `/model ...`, `/new` से बदलें, या सत्र रीसेट करें।

  </Accordion>
  <Accordion title="3. पुरानी स्थिति के माइग्रेशन (डिस्क लेआउट)">
    Doctor पुराने ऑन-डिस्क लेआउट को वर्तमान संरचना में माइग्रेट कर सकता है:

    - सत्र स्टोर + ट्रांसक्रिप्ट: `~/.openclaw/sessions/` से `~/.openclaw/agents/<agentId>/sessions/` में
    - एजेंट डायरेक्टरी: `~/.openclaw/agent/` से `~/.openclaw/agents/<agentId>/agent/` में
    - WhatsApp प्रमाणीकरण स्थिति (Baileys): पुराने `~/.openclaw/credentials/*.json` से (`oauth.json` को छोड़कर) `~/.openclaw/credentials/whatsapp/<accountId>/...` में (डिफ़ॉल्ट खाता आईडी: `default`)

    ये माइग्रेशन सर्वोत्तम-प्रयास वाले और पुनरावृत्ति-सुरक्षित हैं; जब doctor किसी पुराने फ़ोल्डर को बैकअप के रूप में छोड़ता है, तो वह चेतावनी जारी करता है। Gateway/CLI स्टार्टअप पर पुराने सत्रों + एजेंट डायरेक्टरी को भी स्वतः माइग्रेट करता है, ताकि इतिहास/प्रमाणीकरण/मॉडल मैन्युअल doctor संचालन के बिना प्रति-एजेंट पथ में पहुँच जाएँ। WhatsApp प्रमाणीकरण जानबूझकर केवल `openclaw doctor` के माध्यम से माइग्रेट किया जाता है। Talk प्रदाता/प्रदाता-मैप सामान्यीकरण संरचनात्मक समानता के आधार पर तुलना करता है, इसलिए केवल कुंजी-क्रम के अंतर अब बार-बार निष्प्रभावी `doctor --fix` परिवर्तन उत्पन्न नहीं करते।

  </Accordion>
  <Accordion title="3a. पुराने Plugin मैनिफ़ेस्ट के माइग्रेशन">
    Doctor अप्रचलित शीर्ष-स्तरीय क्षमता कुंजियों (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) के लिए सभी इंस्टॉल किए गए Plugin मैनिफ़ेस्ट स्कैन करता है। मिलने पर, वह उन्हें `contracts` ऑब्जेक्ट में ले जाने और मैनिफ़ेस्ट फ़ाइल को उसी स्थान पर दोबारा लिखने का विकल्प देता है। यह माइग्रेशन पुनरावृत्ति-सुरक्षित है; यदि `contracts` में पहले से वही मान हैं, तो डेटा की प्रतिलिपि बनाए बिना पुरानी कुंजी हटा दी जाती है।
  </Accordion>
  <Accordion title="3b. पुराने Cron स्टोर के माइग्रेशन">
    Doctor पुराने जॉब आकारों के लिए Cron जॉब स्टोर (डिफ़ॉल्ट रूप से `~/.openclaw/cron/jobs.json`, या ओवरराइड किए जाने पर `cron.store`) की भी जाँच करता है, जिन्हें शेड्यूलर अब भी संगतता के लिए स्वीकार करता है।

    वर्तमान Cron सफ़ाइयों में शामिल हैं:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - शीर्ष-स्तरीय पेलोड फ़ील्ड (`message`, `model`, `thinking`, ...) → `payload`
    - शीर्ष-स्तरीय डिलीवरी फ़ील्ड (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - पेलोड `provider` डिलीवरी उपनाम → स्पष्ट `delivery.channel`
    - पुराने `notify: true` Webhook फ़ॉलबैक जॉब → सेट होने पर `cron.webhook` से स्पष्ट Webhook डिलीवरी; घोषणा जॉब अपनी चैट डिलीवरी बनाए रखते हैं और उन्हें `delivery.completionDestination` मिलता है। जब `cron.webhook` सेट न हो, तो बिना लक्ष्य वाले जॉब के लिए निष्क्रिय शीर्ष-स्तरीय `notify` मार्कर हटा दिया जाता है (घोषणा सहित मौजूदा डिलीवरी संरक्षित रहती है), क्योंकि रनटाइम डिलीवरी इसे कभी नहीं पढ़ती।

    Gateway लोड के समय विकृत Cron पंक्तियों को भी साफ़ करता है, ताकि मान्य जॉब चलते रहें। रॉ विकृत पंक्तियों को `jobs.json` से हटाने से पहले सक्रिय स्टोर के पास `jobs-quarantine.json` में कॉपी किया जाता है; doctor पृथक की गई पंक्तियों की रिपोर्ट करता है, ताकि आप उनकी मैन्युअल समीक्षा या मरम्मत कर सकें।

    Gateway स्टार्टअप रनटाइम प्रोजेक्शन को सामान्यीकृत करता है और शीर्ष-स्तरीय `notify` मार्कर की उपेक्षा करता है, लेकिन स्थायी Cron कॉन्फ़िगरेशन को doctor द्वारा सुधारने के लिए छोड़ देता है। जब `cron.webhook` सेट न हो, तो doctor बिना किसी माइग्रेशन लक्ष्य वाले जॉब (`delivery.mode` कोई नहीं/अनुपस्थित, अनुपयोगी Webhook लक्ष्य, या मौजूदा घोषणा/चैट डिलीवरी) के लिए निष्क्रिय मार्कर हटा देता है और मौजूदा डिलीवरी अपरिवर्तित छोड़ता है, ताकि बार-बार `doctor --fix` चलाने पर उसी जॉब के बारे में फिर से चेतावनी न मिले। यदि `cron.webhook` सेट है लेकिन मान्य HTTP(S) URL नहीं है, तो doctor फिर भी चेतावनी देता है और मार्कर को छोड़ देता है, ताकि आप URL ठीक कर सकें।

    Linux पर, जब उपयोगकर्ता का crontab अब भी पुराने `~/.openclaw/bin/ensure-whatsapp.sh` को चलाता है, तब doctor चेतावनी भी देता है। वर्तमान OpenClaw उस होस्ट-स्थानीय स्क्रिप्ट का रखरखाव नहीं करता और जब Cron systemd उपयोगकर्ता बस तक नहीं पहुँच पाता, तब वह `~/.openclaw/logs/whatsapp-health.log` में गलत `Gateway inactive` संदेश लिख सकती है। `crontab -e` से अप्रचलित crontab प्रविष्टि हटाएँ; वर्तमान स्वास्थ्य जाँचों के लिए `openclaw channels status --probe`, `openclaw doctor`, और `openclaw gateway status` का उपयोग करें।

  </Accordion>
  <Accordion title="3c. सत्र लॉक की सफ़ाई">
    Doctor असामान्य रूप से सत्र समाप्त होने पर पीछे छूटी अप्रचलित लेखन-लॉक फ़ाइलों के लिए प्रत्येक एजेंट सत्र डायरेक्टरी को स्कैन करता है। मिली प्रत्येक लॉक फ़ाइल के लिए यह रिपोर्ट करता है: पथ, PID, PID अब भी सक्रिय है या नहीं, लॉक की आयु, और क्या इसे अप्रचलित माना जाता है (निष्क्रिय PID, विकृत स्वामी मेटाडेटा, 30 मिनट से अधिक पुराना, या ऐसा सक्रिय PID जिसका गैर-OpenClaw प्रक्रिया से संबंधित होना सिद्ध हो)। `--fix` / `--repair` मोड में यह निष्क्रिय, अनाथ, पुनः उपयोग किए गए, विकृत-पुराने, या गैर-OpenClaw स्वामियों वाले लॉक स्वतः हटा देता है। किसी सक्रिय OpenClaw प्रक्रिया के स्वामित्व वाले पुराने लॉक रिपोर्ट किए जाते हैं, लेकिन यथास्थान छोड़े जाते हैं, ताकि doctor सक्रिय ट्रांसक्रिप्ट लेखक को बाधित न करे।
  </Accordion>
  <Accordion title="3d. सत्र ट्रांसक्रिप्ट शाखा सुधार">
    Doctor 2026.4.24 के प्रॉम्प्ट ट्रांसक्रिप्ट पुनर्लेखन बग द्वारा बनाए गए दोहराए गए शाखा आकार के लिए एजेंट सत्र JSONL फ़ाइलों को स्कैन करता है: OpenClaw के आंतरिक रनटाइम संदर्भ वाला एक परित्यक्त उपयोगकर्ता चरण और वही दृश्यमान उपयोगकर्ता प्रॉम्प्ट रखने वाला एक सक्रिय सहोदर। `--fix` / `--repair` मोड में, doctor प्रत्येक प्रभावित फ़ाइल का मूल के पास बैकअप लेता है और ट्रांसक्रिप्ट को सक्रिय शाखा में दोबारा लिखता है, ताकि gateway इतिहास और मेमोरी रीडर अब दोहराए गए चरण न देखें।
  </Accordion>
  <Accordion title="4. स्थिति अखंडता जाँच (सत्र स्थायित्व, रूटिंग, और सुरक्षा)">
    स्थिति डायरेक्टरी संचालन का मस्तिष्क-तना है। यदि यह गायब हो जाती है, तो कहीं और बैकअप न होने पर आपके सत्र, क्रेडेंशियल, लॉग, और कॉन्फ़िगरेशन खो जाएँगे।

    Doctor जाँचता है:

    - **स्टेट डायरेक्टरी अनुपलब्ध**: विनाशकारी स्टेट हानि के बारे में चेतावनी देता है, डायरेक्टरी फिर से बनाने का संकेत देता है, और याद दिलाता है कि यह अनुपलब्ध डेटा पुनर्प्राप्त नहीं कर सकता।
    - **स्टेट डायरेक्टरी अनुमतियाँ**: लिखने की क्षमता सत्यापित करता है; अनुमतियाँ सुधारने की पेशकश करता है (और स्वामी/समूह बेमेल मिलने पर `chown` संकेत देता है)।
    - **macOS क्लाउड-सिंक की गई स्टेट डायरेक्टरी**: जब स्टेट iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) या `~/Library/CloudStorage/...` के अंतर्गत रिज़ॉल्व होता है, तब चेतावनी देता है, क्योंकि सिंक-समर्थित पाथ धीमे I/O और लॉक/सिंक रेस का कारण बन सकते हैं।
    - **Linux SD या eMMC स्टेट डायरेक्टरी**: जब स्टेट किसी `mmcblk*` माउंट स्रोत पर रिज़ॉल्व होता है, तब चेतावनी देता है, क्योंकि SD/eMMC-समर्थित रैंडम I/O धीमा हो सकता है और सत्र तथा क्रेडेंशियल लिखे जाने पर तेज़ी से घिस सकता है।
    - **Linux अस्थिर स्टेट डायरेक्टरी**: जब स्टेट `tmpfs` या `ramfs` पर रिज़ॉल्व होता है, तब चेतावनी देता है, क्योंकि रीबूट होने पर सत्र, क्रेडेंशियल, कॉन्फ़िग और SQLite स्टेट (WAL/जर्नल साइडकार सहित) गायब हो जाते हैं। Docker `overlay` माउंट को जानबूझकर चिह्नित नहीं किया जाता, क्योंकि कंटेनर के बने रहने तक उनकी लिखने योग्य लेयर होस्ट रीबूट के बाद भी बनी रहती हैं।
    - **सत्र डायरेक्टरियाँ अनुपलब्ध**: इतिहास बनाए रखने और `ENOENT` क्रैश से बचने के लिए `sessions/` और सत्र स्टोर डायरेक्टरी आवश्यक हैं।
    - **ट्रांसक्रिप्ट बेमेल**: हाल की सत्र प्रविष्टियों की ट्रांसक्रिप्ट फ़ाइलें अनुपलब्ध होने पर चेतावनी देता है।
    - **मुख्य सत्र "1-पंक्ति JSONL"**: मुख्य ट्रांसक्रिप्ट में केवल एक पंक्ति होने पर चिह्नित करता है (इतिहास संचित नहीं हो रहा है)।
    - **एकाधिक स्टेट डायरेक्टरियाँ**: होम डायरेक्टरियों में एकाधिक `~/.openclaw` फ़ोल्डर मौजूद होने पर, या `OPENCLAW_STATE_DIR` के किसी अन्य स्थान की ओर संकेत करने पर चेतावनी देता है (इतिहास इंस्टॉलेशन के बीच विभाजित हो सकता है)।
    - **रिमोट मोड अनुस्मारक**: यदि `gateway.mode=remote`, तो doctor आपको इसे रिमोट होस्ट पर चलाने की याद दिलाता है (स्टेट वहीं रहता है)।
    - **कॉन्फ़िग फ़ाइल अनुमतियाँ**: यदि `~/.openclaw/openclaw.json` समूह/सभी के लिए पठनीय है, तो चेतावनी देता है और इसे `600` तक सीमित करने की पेशकश करता है।

  </Accordion>
  <Accordion title="5. मॉडल प्रमाणीकरण स्वास्थ्य (OAuth समाप्ति)">
    Doctor प्रमाणीकरण स्टोर में OAuth प्रोफ़ाइलों की जाँच करता है, टोकन जल्द समाप्त होने या समाप्त हो चुके होने पर चेतावनी देता है, और सुरक्षित होने पर उन्हें रीफ़्रेश कर सकता है। यदि Anthropic OAuth/टोकन प्रोफ़ाइल पुरानी है, तो यह Anthropic API कुंजी या Anthropic सेटअप-टोकन पाथ सुझाता है। रीफ़्रेश संकेत केवल इंटरैक्टिव रूप से (TTY) चलाते समय दिखाई देते हैं; `--non-interactive` रीफ़्रेश प्रयासों को छोड़ देता है।

    जब OAuth रीफ़्रेश स्थायी रूप से विफल होता है (उदाहरण के लिए `refresh_token_reused`, `invalid_grant`, या कोई प्रदाता आपको फिर से साइन इन करने को कहता है), तो doctor बताता है कि पुनः प्रमाणीकरण आवश्यक है और चलाने के लिए सटीक `openclaw models auth login --provider ...` कमांड प्रिंट करता है।

    Doctor उन प्रमाणीकरण प्रोफ़ाइलों की भी सूचना देता है जो छोटी कूलडाउन अवधि (रेट सीमाएँ/टाइमआउट/प्रमाणीकरण विफलताएँ) या लंबी निष्क्रियता अवधि (बिलिंग/क्रेडिट विफलताएँ) के कारण अस्थायी रूप से अनुपयोगी हैं।

    वे लीगेसी Codex OAuth प्रोफ़ाइल जिनके टोकन macOS Keychain में रहते हैं (फ़ाइल-आधारित साइडकार लेआउट से पहले की पुरानी ऑनबोर्डिंग), केवल doctor द्वारा सुधारे जाते हैं। Keychain-समर्थित लीगेसी टोकन को उसी स्थान पर `auth-profiles.json` में माइग्रेट करने के लिए इंटरैक्टिव टर्मिनल से एक बार `openclaw doctor --fix` चलाएँ; उसके बाद एम्बेडेड टर्न (Telegram, cron, सब-एजेंट डिस्पैच) उन्हें कैनोनिकल OpenAI OAuth प्रोफ़ाइलों के रूप में रिज़ॉल्व करते हैं।

  </Accordion>
  <Accordion title="6. हुक मॉडल सत्यापन">
    यदि `hooks.gmail.model` सेट है, तो doctor कैटलॉग और अनुमति-सूची के विरुद्ध मॉडल संदर्भ सत्यापित करता है और उसके रिज़ॉल्व न होने या अस्वीकृत होने पर चेतावनी देता है।
  </Accordion>
  <Accordion title="7. सैंडबॉक्स इमेज सुधार">
    सैंडबॉक्सिंग सक्षम होने पर doctor Docker इमेजों की जाँच करता है और वर्तमान इमेज अनुपलब्ध होने पर उसे बिल्ड करने या लीगेसी नामों पर स्विच करने की पेशकश करता है।
  </Accordion>
  <Accordion title="7b. Plugin इंस्टॉलेशन सफ़ाई">
    Doctor `openclaw doctor --fix` / `openclaw doctor --repair` मोड में OpenClaw द्वारा जनरेट की गई लीगेसी Plugin निर्भरता स्टेजिंग स्टेट हटाता है: पुराने जनरेट किए गए निर्भरता रूट, पुरानी इंस्टॉल-स्टेज डायरेक्टरियाँ, पहले के बंडल्ड-Plugin निर्भरता सुधार कोड से बचा पैकेज-स्थानीय मलबा, और बंडल्ड `@openclaw/*` Plugins की अनाथ या पुनर्प्राप्त प्रबंधित npm प्रतियाँ, जो वर्तमान बंडल्ड मैनिफ़ेस्ट को ओवरराइड कर सकती हैं। Doctor होस्ट के `openclaw` पैकेज को उन प्रबंधित npm Plugins में फिर से लिंक भी करता है जो `peerDependencies.openclaw` घोषित करते हैं, ताकि अपडेट या npm सुधार के बाद भी `openclaw/plugin-sdk/*` जैसे पैकेज-स्थानीय रनटाइम इम्पोर्ट रिज़ॉल्व होते रहें।

    जब कॉन्फ़िग उनका संदर्भ देता है लेकिन स्थानीय Plugin रजिस्ट्री उन्हें नहीं खोज पाती, तब doctor अनुपलब्ध डाउनलोड-योग्य Plugins को फिर से इंस्टॉल भी कर सकता है (ठोस `plugins.entries`, कॉन्फ़िगर की गई चैनल/प्रदाता/खोज सेटिंग, कॉन्फ़िगर किए गए एजेंट रनटाइम)। पैकेज अपडेट के दौरान, जब कोर पैकेज बदला जा रहा हो, doctor Plugin पैकेजों को फिर से इंस्टॉल करने से बचता है; यदि किसी कॉन्फ़िगर किए गए Plugin को अब भी पुनर्प्राप्ति चाहिए, तो अपडेट के बाद `openclaw doctor --fix` फिर से चलाएँ। नीचे दिए गए कंटेनर इमेज स्टार्टअप अपवाद के अतिरिक्त, Gateway स्टार्टअप और कॉन्फ़िग रीलोड पैकेज सुधार नहीं चलाते; Plugin इंस्टॉलेशन स्पष्ट doctor/install/update कार्य बने रहते हैं।

    कंटेनरीकृत Gateway स्टार्टअप में एक सीमित अपग्रेड अपवाद है: जब `openclaw gateway run` नए OpenClaw संस्करण पर शुरू होता है, तो यह तैयार होने से पहले सुरक्षित स्टेट माइग्रेशन और मौजूदा पोस्ट-कोर Plugin अभिसरण चलाता है, फिर प्रति-संस्करण चेकपॉइंट दर्ज करता है। यह स्टार्टअप पास पुराने बंडल्ड-Plugin रिकॉर्ड साफ़ कर सकता है, स्थानीय Plugin लिंक सुधार सकता है, अभिसरण पाथ द्वारा आवश्यक होने पर कॉन्फ़िगर किए गए Plugin पैकेज फिर से इंस्टॉल कर सकता है, और सक्रिय Plugin पेलोड जाँच सकता है। यदि स्टार्टअप सुरक्षित रूप से सुधार नहीं कर सकता, तो कंटेनर को सामान्य रूप से पुनः आरंभ करने से पहले समान माउंट किए गए स्टेट/कॉन्फ़िग के विरुद्ध वही इमेज `openclaw doctor --fix` के साथ एक बार चलाएँ।

  </Accordion>
  <Accordion title="8. Gateway सेवा माइग्रेशन और सफ़ाई संकेत">
    Doctor लीगेसी Gateway सेवाओं (launchd/systemd/schtasks) का पता लगाता है और उन्हें हटाकर वर्तमान Gateway पोर्ट का उपयोग करने वाली OpenClaw सेवा इंस्टॉल करने की पेशकश करता है। यह अतिरिक्त Gateway-जैसी सेवाओं के लिए स्कैन करके सफ़ाई संकेत भी प्रिंट कर सकता है। प्रोफ़ाइल-नाम वाली OpenClaw Gateway सेवाओं को प्रथम-श्रेणी माना जाता है और उन्हें "अतिरिक्त" के रूप में चिह्नित नहीं किया जाता।

    Linux पर, यदि उपयोगकर्ता-स्तरीय Gateway सेवा अनुपलब्ध है लेकिन सिस्टम-स्तरीय OpenClaw Gateway सेवा मौजूद है, तो doctor स्वचालित रूप से दूसरी उपयोगकर्ता-स्तरीय सेवा इंस्टॉल नहीं करता। `openclaw gateway status --deep` या `openclaw doctor --deep` से निरीक्षण करें, फिर डुप्लिकेट हटाएँ या जब कोई सिस्टम सुपरवाइज़र Gateway जीवनचक्र का स्वामी हो तब `OPENCLAW_SERVICE_REPAIR_POLICY=external` सेट करें।

  </Accordion>
  <Accordion title="8b. स्टार्टअप Matrix माइग्रेशन">
    जब किसी Matrix चैनल खाते में लंबित या कार्रवाई-योग्य लीगेसी स्टेट माइग्रेशन होता है, तो doctor (`--fix` / `--repair` मोड में) माइग्रेशन-पूर्व स्नैपशॉट बनाता है और फिर सर्वोत्तम-प्रयास माइग्रेशन चरण चलाता है: लीगेसी Matrix स्टेट माइग्रेशन और लीगेसी एन्क्रिप्टेड-स्टेट तैयारी। दोनों चरण गैर-घातक हैं; त्रुटियाँ लॉग की जाती हैं और स्टार्टअप जारी रहता है। केवल-पठन मोड (`openclaw doctor`, `--fix` के बिना) में यह जाँच पूरी तरह छोड़ दी जाती है।
  </Accordion>
  <Accordion title="8c. डिवाइस पेयरिंग और प्रमाणीकरण विचलन">
    Doctor सामान्य स्वास्थ्य पास के भाग के रूप में डिवाइस-पेयरिंग स्टेट की जाँच करते हुए निम्न की सूचना देता है:

    - पहली बार के लंबित पेयरिंग अनुरोध
    - पहले से पेयर किए गए डिवाइसों के लंबित भूमिका या स्कोप अपग्रेड
    - ऐसे सार्वजनिक-कुंजी बेमेल सुधार जहाँ डिवाइस आईडी अब भी मेल खाती है लेकिन डिवाइस पहचान अब अनुमोदित रिकॉर्ड से मेल नहीं खाती
    - अनुमोदित भूमिका के लिए सक्रिय टोकन से रहित पेयर किए गए रिकॉर्ड
    - ऐसे पेयर किए गए टोकन जिनके स्कोप अनुमोदित पेयरिंग बेसलाइन से बाहर चले गए हैं
    - वर्तमान मशीन की स्थानीय कैश की गई डिवाइस-टोकन प्रविष्टियाँ, जो Gateway-साइड टोकन रोटेशन से पहले की हैं या जिनमें पुराना स्कोप मेटाडेटा है

    Doctor पेयर अनुरोधों को स्वतः अनुमोदित या डिवाइस टोकन को स्वतः रोटेट नहीं करता। यह अगले सटीक चरण प्रिंट करता है:

    - `openclaw devices list` से लंबित अनुरोधों का निरीक्षण करें
    - `openclaw devices approve <requestId>` से सटीक अनुरोध अनुमोदित करें
    - `openclaw devices rotate --device <deviceId> --role <role>` से नया टोकन रोटेट करें
    - `openclaw devices remove <deviceId>` से पुराना रिकॉर्ड हटाकर पुनः अनुमोदित करें

    यह पहली बार की पेयरिंग को लंबित भूमिका/स्कोप अपग्रेड और पुराने टोकन/डिवाइस-पहचान विचलन से अलग करता है, जिससे "पहले से पेयर है लेकिन फिर भी पेयरिंग आवश्यक संदेश मिल रहा है" वाली सामान्य कमी दूर होती है।

  </Accordion>
  <Accordion title="9. सुरक्षा चेतावनियाँ">
    Doctor केवल चेतावनी मिलने पर सुरक्षा नोट देता है, जैसे अनुमति-सूची के बिना सीधे संदेशों के लिए खुला प्रदाता या खतरनाक ढंग से कॉन्फ़िगर की गई नीति। पूरी सुरक्षा सूची के लिए `openclaw security audit` का उपयोग करें।
  </Accordion>
  <Accordion title="10. systemd लिंगर (Linux)">
    systemd उपयोगकर्ता सेवा के रूप में चलने पर doctor सुनिश्चित करता है कि लिंगरिंग सक्षम हो, ताकि लॉगआउट के बाद भी Gateway चलता रहे।
  </Accordion>
  <Accordion title="11. कार्यस्थान स्थिति (Skills, Plugins और TaskFlows)">
    Doctor स्वस्थ-स्थिति सूची के बजाय डिफ़ॉल्ट एजेंट की समस्याएँ और कार्रवाइयाँ प्रिंट करता है:

    - **Skills**: अनुमत लेकिन अनुपयोगी स्किल नाम सूचीबद्ध करता है; आवश्यकता विवरण और पूरी गणना के लिए `openclaw skills check` का उपयोग करें।
    - **Plugins**: केवल त्रुटिपूर्ण Plugin आईडी की सूचना देता है; लोड किए गए, इम्पोर्ट किए गए, अक्षम और बंडल-Plugin की सूची के लिए `openclaw plugins list` का उपयोग करें।
    - **Plugin संगतता चेतावनियाँ**: वर्तमान रनटाइम के साथ संगतता समस्याओं वाले Plugins को चिह्नित करता है।
    - **Plugin निदान**: Plugin रजिस्ट्री द्वारा लोड के समय दी गई सभी चेतावनियाँ या त्रुटियाँ दिखाता है।
    - **TaskFlow पुनर्प्राप्ति**: ऐसे संदिग्ध प्रबंधित TaskFlows दिखाता है जिन्हें मैन्युअल निरीक्षण या रद्द करने की आवश्यकता है।
    - **Claude CLI**: केवल बाइनरी, प्रमाणीकरण, प्रोफ़ाइल, कार्यस्थान या प्रोजेक्ट-डायरेक्टरी समस्याओं की सूचना देता है; स्वस्थ प्रोब विवरण छोड़ दिए जाते हैं।

  </Accordion>
  <Accordion title="11b. बूटस्ट्रैप फ़ाइल आकार">
    Doctor जाँचता है कि कार्यस्थान बूटस्ट्रैप फ़ाइलें (उदाहरण के लिए `AGENTS.md`, `CLAUDE.md`, या अन्य इंजेक्ट की गई संदर्भ फ़ाइलें) कॉन्फ़िगर की गई वर्ण सीमा के निकट या उससे अधिक हैं या नहीं। यह प्रत्येक फ़ाइल के लिए मूल बनाम इंजेक्ट किए गए वर्णों की संख्या, काट-छाँट प्रतिशत, काट-छाँट का कारण (`max/file` या `max/total`), और कुल सीमा के अनुपात के रूप में इंजेक्ट किए गए कुल वर्णों की सूचना देता है। फ़ाइलें काटी गई हों या सीमा के निकट हों, तो doctor `agents.defaults.bootstrapMaxChars` और `agents.defaults.bootstrapTotalMaxChars` को समायोजित करने के सुझाव प्रिंट करता है।
  </Accordion>
  <Accordion title="11c. शेल पूर्णता">
    Doctor जाँचता है कि वर्तमान शेल (zsh, bash, fish या PowerShell) के लिए टैब पूर्णता इंस्टॉल है या नहीं:

    - यदि शेल प्रोफ़ाइल धीमे डायनेमिक पूर्णता पैटर्न (`source <(openclaw completion ...)`) का उपयोग करती है, तो doctor इसे अधिक तेज़ कैश फ़ाइल वैरिएंट में अपग्रेड करता है।
    - यदि प्रोफ़ाइल में पूर्णता कॉन्फ़िगर है लेकिन कैश फ़ाइल अनुपलब्ध है, तो doctor कैश को स्वचालित रूप से फिर से जनरेट करता है।
    - यदि कोई पूर्णता कॉन्फ़िगर नहीं है, तो doctor इसे इंस्टॉल करने का संकेत देता है (केवल इंटरैक्टिव मोड; `--non-interactive` के साथ छोड़ दिया जाता है)।

    कैश को मैन्युअल रूप से फिर से जनरेट करने के लिए `openclaw completion --write-state` चलाएँ।

  </Accordion>
  <Accordion title="11d. पुराने चैनल Plugin की सफ़ाई">
    जब `openclaw doctor --fix` किसी अनुपलब्ध चैनल Plugin को हटाता है, तो यह उस Plugin का संदर्भ देने वाला लटकता हुआ चैनल-स्कोप कॉन्फ़िग भी हटाता है: `channels.<id>` प्रविष्टियाँ, चैनल को नामित करने वाले Heartbeat लक्ष्य और `agents.*.models["<channel>/*"]` ओवरराइड। इससे ऐसे Gateway बूट लूप रुकते हैं जहाँ चैनल रनटाइम हट चुका है लेकिन कॉन्फ़िग अब भी Gateway को उससे बाइंड होने के लिए कहता है।
  </Accordion>
  <Accordion title="12. Gateway प्रमाणीकरण जाँच (स्थानीय टोकन)">
    Doctor स्थानीय Gateway टोकन प्रमाणीकरण की तैयारी जाँचता है।

    - यदि टोकन मोड को टोकन चाहिए और कोई टोकन स्रोत मौजूद नहीं है, तो doctor एक टोकन जनरेट करने की पेशकश करता है।
    - यदि `gateway.auth.token` SecretRef द्वारा प्रबंधित है लेकिन अनुपलब्ध है, तो doctor चेतावनी देता है और उसे प्लेनटेक्स्ट से ओवरराइट नहीं करता।
    - `openclaw doctor --generate-gateway-token` केवल तभी जनरेशन बाध्य करता है जब कोई टोकन SecretRef कॉन्फ़िगर न हो।

  </Accordion>
  <Accordion title="12b. केवल-पठन SecretRef-जागरूक सुधार">
    कुछ सुधार प्रवाहों को रनटाइम के तुरंत-विफल होने वाले व्यवहार को कमज़ोर किए बिना कॉन्फ़िगर किए गए क्रेडेंशियल की जाँच करनी होती है।

    - `openclaw doctor --fix` लक्षित कॉन्फ़िगरेशन सुधारों के लिए स्थिति-श्रेणी कमांड के समान केवल-पढ़ने योग्य SecretRef सारांश मॉडल का उपयोग करता है।
    - उदाहरण: Telegram `allowFrom` / `groupAllowFrom` `@username` सुधार उपलब्ध होने पर कॉन्फ़िगर किए गए बॉट क्रेडेंशियल का उपयोग करने का प्रयास करता है।
    - यदि Telegram बॉट टोकन SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वर्तमान कमांड पथ में उपलब्ध नहीं है, तो doctor रिपोर्ट करता है कि क्रेडेंशियल कॉन्फ़िगर किया गया है पर अनुपलब्ध है और क्रैश होने या टोकन को गुम बताने के बजाय स्वचालित समाधान छोड़ देता है।

  </Accordion>
  <Accordion title="13. Gateway स्वास्थ्य जाँच + पुनरारंभ">
    Doctor स्वास्थ्य जाँच चलाता है और Gateway अस्वस्थ दिखाई देने पर उसे पुनरारंभ करने की पेशकश करता है।
  </Accordion>
  <Accordion title="13b. मेमोरी खोज की तत्परता">
    Doctor जाँचता है कि कॉन्फ़िगर किया गया मेमोरी खोज एम्बेडिंग प्रदाता डिफ़ॉल्ट एजेंट के लिए तैयार है या नहीं। व्यवहार कॉन्फ़िगर किए गए बैकएंड और प्रदाता पर निर्भर करता है:

    - **QMD बैकएंड**: जाँचता है कि `qmd` बाइनरी उपलब्ध है और शुरू की जा सकती है या नहीं। यदि नहीं, तो `npm install -g @tobilu/qmd` (या Bun समकक्ष) और मैन्युअल बाइनरी पथ विकल्प सहित सुधार मार्गदर्शन प्रिंट करता है।
    - **स्पष्ट स्थानीय प्रदाता**: स्थानीय मॉडल फ़ाइल या मान्यता-प्राप्त दूरस्थ/डाउनलोड-योग्य मॉडल URL की जाँच करता है। गुम होने पर, दूरस्थ प्रदाता पर स्विच करने का सुझाव देता है।
    - **स्पष्ट दूरस्थ प्रदाता** (`openai`, `voyage`, आदि): सत्यापित करता है कि परिवेश या प्रमाणीकरण स्टोर में API कुंजी मौजूद है। गुम होने पर कार्रवाई-योग्य सुधार संकेत प्रिंट करता है।
    - **पुराना स्वचालित प्रदाता**: `memorySearch.provider: "auto"` को OpenAI मानता है, OpenAI की तत्परता जाँचता है, और `doctor --fix` उसे `provider: "openai"` में फिर से लिखता है।

    जब कैश किया गया Gateway जाँच परिणाम उपलब्ध होता है (जाँच के समय Gateway स्वस्थ था), तो doctor उसके परिणाम का CLI में दिखाई देने वाले कॉन्फ़िगरेशन से मिलान करता है और किसी भी विसंगति को दर्ज करता है। Doctor डिफ़ॉल्ट पथ पर नई एम्बेडिंग पिंग शुरू नहीं करता; जब आपको प्रदाता की लाइव जाँच चाहिए, तो गहन मेमोरी स्थिति कमांड का उपयोग करें।

    रनटाइम पर एम्बेडिंग की तत्परता सत्यापित करने के लिए `openclaw memory status --deep` का उपयोग करें।

  </Accordion>
  <Accordion title="14. चैनल स्थिति चेतावनियाँ">
    यदि Gateway स्वस्थ है, तो doctor चैनल स्थिति जाँच चलाता है और सुझाए गए सुधारों के साथ चेतावनियाँ रिपोर्ट करता है।
  </Accordion>
  <Accordion title="15. सुपरवाइज़र कॉन्फ़िगरेशन ऑडिट + सुधार">
    Doctor इंस्टॉल किए गए सुपरवाइज़र कॉन्फ़िगरेशन (launchd/systemd/schtasks) में गुम या पुराने डिफ़ॉल्ट की जाँच करता है (उदाहरण के लिए systemd network-online निर्भरताएँ और पुनरारंभ विलंब)। विसंगति मिलने पर, यह अपडेट की अनुशंसा करता है और सेवा फ़ाइल/कार्य को वर्तमान डिफ़ॉल्ट के अनुसार फिर से लिख सकता है।

    टिप्पणियाँ:

    - `openclaw doctor` सुपरवाइज़र कॉन्फ़िगरेशन को फिर से लिखने से पहले संकेत देता है।
    - `openclaw doctor --yes` डिफ़ॉल्ट सुधार संकेतों को स्वीकार करता है।
    - `openclaw doctor --fix` बिना संकेत दिए अनुशंसित सुधार लागू करता है (`--repair` इसका उपनाम है)।
    - `openclaw doctor --fix --force` कस्टम सुपरवाइज़र कॉन्फ़िगरेशन को अधिलेखित करता है।
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` Gateway सेवा जीवनचक्र के लिए doctor को केवल-पढ़ने योग्य रखता है। यह फिर भी सेवा स्वास्थ्य रिपोर्ट करता है और गैर-सेवा सुधार चलाता है, लेकिन सेवा इंस्टॉल/शुरू/पुनरारंभ/बूटस्ट्रैप, सुपरवाइज़र कॉन्फ़िगरेशन का पुनर्लेखन और पुरानी सेवा की सफ़ाई छोड़ देता है, क्योंकि कोई बाहरी सुपरवाइज़र उस जीवनचक्र का स्वामी होता है।
    - Linux पर, संबंधित systemd Gateway यूनिट सक्रिय होने के दौरान doctor कमांड/एंट्रीपॉइंट मेटाडेटा को फिर से नहीं लिखता। यह डुप्लिकेट-सेवा स्कैन के दौरान निष्क्रिय गैर-पुरानी अतिरिक्त Gateway-जैसी यूनिटों को भी अनदेखा करता है, ताकि सहायक सेवा फ़ाइलें सफ़ाई संबंधी अनावश्यक संदेश न बनाएँ।
    - यदि टोकन प्रमाणीकरण के लिए टोकन आवश्यक है और `gateway.auth.token` को SecretRef प्रबंधित करता है, तो doctor सेवा इंस्टॉल/सुधार SecretRef को सत्यापित करता है, लेकिन हल किए गए सादे-पाठ टोकन मान सुपरवाइज़र सेवा परिवेश मेटाडेटा में स्थायी रूप से संग्रहीत नहीं करता।
    - Doctor प्रबंधित `.env`/SecretRef-समर्थित सेवा परिवेश मानों का पता लगाता है, जिन्हें पुराने LaunchAgent, systemd या Windows Scheduled Task इंस्टॉल ने इनलाइन एम्बेड किया था, और सेवा मेटाडेटा को फिर से लिखता है ताकि वे मान सुपरवाइज़र परिभाषा के बजाय रनटाइम स्रोत से लोड हों।
    - Doctor पता लगाता है कि `gateway.port` बदलने के बाद भी सेवा कमांड किसी पुराने `--port` को स्थिर रखता है या नहीं, और सेवा मेटाडेटा को वर्तमान पोर्ट के अनुसार फिर से लिखता है।
    - यदि टोकन प्रमाणीकरण के लिए टोकन आवश्यक है और कॉन्फ़िगर किया गया टोकन SecretRef अनसुलझा है, तो doctor कार्रवाई-योग्य मार्गदर्शन के साथ इंस्टॉल/सुधार पथ को रोक देता है।
    - यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर किए गए हैं और `gateway.auth.mode` सेट नहीं है, तो doctor मोड को स्पष्ट रूप से सेट किए जाने तक इंस्टॉल/सुधार रोक देता है।
    - Linux उपयोगकर्ता-systemd यूनिटों के लिए, सेवा प्रमाणीकरण मेटाडेटा की तुलना करते समय doctor टोकन अंतर जाँच में `Environment=` और `EnvironmentFile=` दोनों स्रोत शामिल होते हैं।
    - जब कॉन्फ़िगरेशन को अंतिम बार किसी नए संस्करण ने लिखा हो, तो Doctor सेवा सुधार किसी पुराने OpenClaw बाइनरी से Gateway सेवा को फिर से लिखने, रोकने या पुनरारंभ करने से इनकार करते हैं। [Gateway समस्या निवारण](/hi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) देखें।
    - आप `openclaw gateway install --force` के माध्यम से कभी भी पूर्ण पुनर्लेखन बाध्य कर सकते हैं।

  </Accordion>
  <Accordion title="16. Gateway रनटाइम + पोर्ट निदान">
    Doctor सेवा रनटाइम (PID, अंतिम निकास स्थिति) का निरीक्षण करता है और सेवा इंस्टॉल होने के बावजूद वास्तव में न चलने पर चेतावनी देता है। यह Gateway पोर्ट (डिफ़ॉल्ट `18789`) पर पोर्ट टकराव की जाँच भी करता है और संभावित कारणों (Gateway पहले से चल रहा है, SSH टनल) की रिपोर्ट करता है।
  </Accordion>
  <Accordion title="17. Gateway रनटाइम की सर्वोत्तम कार्यप्रणालियाँ">
    जब Gateway सेवा Bun या संस्करण-प्रबंधित Node पथ (`nvm`, `fnm`, `volta`, `asdf`, आदि) पर चलती है, तो Doctor चेतावनी देता है। Bun OpenClaw का `node:sqlite` स्थिति स्टोर नहीं खोल सकता, इसलिए सुधार पुरानी Bun सेवाओं को Node पर माइग्रेट करते हैं। संस्करण-प्रबंधक पथ अपग्रेड के बाद टूट सकते हैं, क्योंकि सेवा आपके शेल आरंभिकरण को लोड नहीं करती। उपलब्ध होने पर Doctor सिस्टम Node इंस्टॉल (Homebrew/apt/choco) पर माइग्रेट करने की पेशकश करता है।

    नए इंस्टॉल या सुधारे गए macOS LaunchAgents इंटरैक्टिव शेल PATH की प्रतिलिपि बनाने के बजाय एक मानक सिस्टम PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) का उपयोग करते हैं, ताकि Homebrew-प्रबंधित सिस्टम बाइनरी उपलब्ध रहें, जबकि Volta, asdf, fnm, pnpm और अन्य संस्करण-प्रबंधक डायरेक्टरी यह न बदलें कि Node की चाइल्ड प्रक्रियाएँ किसे रिज़ॉल्व करती हैं। Linux सेवाएँ अब भी स्पष्ट परिवेश रूट (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) और स्थिर उपयोगकर्ता-बिन डायरेक्टरी बनाए रखती हैं, लेकिन अनुमानित संस्करण-प्रबंधक फ़ॉलबैक डायरेक्टरी सेवा PATH में केवल तभी लिखी जाती हैं, जब वे डायरेक्टरी डिस्क पर मौजूद हों।

  </Accordion>
  <Accordion title="18. कॉन्फ़िगरेशन लेखन + विज़ार्ड मेटाडेटा">
    Doctor सभी कॉन्फ़िगरेशन परिवर्तनों को स्थायी करता है और doctor रन को दर्ज करने के लिए विज़ार्ड मेटाडेटा अंकित करता है।
  </Accordion>
  <Accordion title="19. कार्यस्थान सुझाव (बैकअप + मेमोरी सिस्टम)">
    Doctor अनुपस्थित होने पर कार्यस्थान मेमोरी सिस्टम का सुझाव देता है और यदि कार्यस्थान पहले से git के अंतर्गत नहीं है, तो बैकअप सुझाव प्रिंट करता है।

    कार्यस्थान संरचना और git बैकअप (निजी GitHub या GitLab अनुशंसित) की पूरी मार्गदर्शिका के लिए [/concepts/agent-workspace](/hi/concepts/agent-workspace) देखें।

  </Accordion>
</AccordionGroup>

## संबंधित

- [Gateway रनबुक](/hi/gateway)
- [Gateway समस्या निवारण](/hi/gateway/troubleshooting)
