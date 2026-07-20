---
read_when:
    - डॉक्टर माइग्रेशन जोड़ना या संशोधित करना
    - ब्रेकिंग कॉन्फ़िगरेशन बदलाव प्रस्तुत करना
sidebarTitle: Doctor
summary: 'Doctor कमांड: स्वास्थ्य जाँच, कॉन्फ़िगरेशन माइग्रेशन और सुधार चरण'
title: डॉक्टर
x-i18n:
    generated_at: "2026-07-20T07:11:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b33c4ae538f8aa8b8049012a788261f3b9051b006f84b17c0e10fe94dc0fdc
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` OpenClaw के लिए मरम्मत और माइग्रेशन टूल है। यह पुराने config/state को ठीक करता है, स्वास्थ्य की जाँच करता है और मरम्मत के लिए कार्रवाई योग्य चरण प्रदान करता है।

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

    संकेत दिए बिना डिफ़ॉल्ट स्वीकार करें (लागू होने पर पुनरारंभ/सेवा/सैंडबॉक्स मरम्मत चरणों सहित)।

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
    संकेत, मरम्मत, माइग्रेशन, पुनरारंभ या state लेखन नहीं।

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
    ऑन-डिस्क state स्थानांतरण)। मानवीय पुष्टि की आवश्यकता वाली पुनरारंभ/सेवा/सैंडबॉक्स
    कार्रवाइयाँ छोड़ देता है। पता चलने पर पुराने state माइग्रेशन फिर भी अपने-आप चलते हैं।

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

`openclaw doctor --lint`, `openclaw doctor --fix` का ऑटोमेशन-अनुकूल सहचर है।
दोनों समान Doctor नियम रजिस्ट्री साझा करते हैं, लेकिन नियमों को समान तरीके से
चुनते या उन पर कार्रवाई नहीं करते:

| मोड                     | संकेत   | config/state लिखता है     | आउटपुट                 | इसका उपयोग                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | हाँ       | नहीं                      | अनुकूल स्वास्थ्य रिपोर्ट | किसी व्यक्ति द्वारा स्थिति जाँचने के लिए         |
| `openclaw doctor --fix`  | कभी-कभी | हाँ, मरम्मत नीति के साथ | अनुकूल मरम्मत लॉग    | स्वीकृत मरम्मत लागू करने के लिए       |
| `openclaw doctor --lint` | नहीं        | नहीं                      | संरचित निष्कर्ष    | CI, प्रीफ़्लाइट और समीक्षा गेट |

डिफ़ॉल्ट `doctor --lint` व्यापक-सुरक्षित ऑटोमेशन प्रोफ़ाइल चलाता है: ऐसी जाँचें जो
स्थिर, स्थानीय और CI या प्रीफ़्लाइट आउटपुट में उपयोगी हैं। यह ऑप्ट-इन जाँचों को
छोड़ देता है जो परामर्शात्मक, पर्यावरण-संवेदी, लाइव-सेवा पर निर्भर, खाता/वर्कस्पेस
इन्वेंटरी या ऐतिहासिक सफ़ाई से संबंधित हैं। जब पूर्ण पंजीकृत lint ऑडिट चाहिए,
जिसमें ये ऑप्ट-इन जाँचें भी शामिल हों, तब `doctor --lint --all` का उपयोग करें; या
लक्षित जाँच के लिए `--only <id>` का उपयोग करें।

`doctor --fix` lint की डिफ़ॉल्ट प्रोफ़ाइल का उपयोग नहीं करता और
`--all` स्वीकार नहीं करता। यह Doctor का क्रमबद्ध मरम्मत पथ चलाता है: आधुनिक
स्वास्थ्य जाँचें वैकल्पिक `repair()` कार्यान्वयन प्रदान कर सकती हैं और पुराने क्षेत्र
अब भी अपने पुराने Doctor मरम्मत प्रवाह का उपयोग करते हैं। कुछ lint निष्कर्ष जानबूझकर
केवल निदानात्मक होते हैं, इसलिए `--lint --all` में किसी जाँच का दिखाई देना यह नहीं दर्शाता
कि `--fix` उस क्षेत्र को परिवर्तित करेगा। यह अनुबंध `detect()` (निष्कर्षों
की रिपोर्ट करता है) को `repair()` (परिवर्तनों/diffs/दुष्प्रभावों की रिपोर्ट करता है)
से अलग करता है, जिससे lint जाँचों को परिवर्तन नियोजक बनाए बिना भविष्य के
`doctor --fix --dry-run` के लिए मार्ग खुला रहता है।

कुछ अंतर्निहित जाँचें आंतरिक रूप से डिफ़ॉल्ट-अक्षम हैं, ताकि वे डिफ़ॉल्ट
`doctor --lint` ऑटोमेशन प्रोफ़ाइल का भाग बने बिना `--all`,
`--only` और Doctor मरम्मत प्रवाहों के लिए उपलब्ध रहें। निष्कर्ष की गंभीरता
फिर भी प्रत्येक निष्कर्ष के लिए उत्सर्जित होती है (`info`,
`warning` या `error`); डिफ़ॉल्ट चयन कोई गंभीरता स्तर नहीं है।

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON आउटपुट फ़ील्ड:

- `ok`: क्या कोई निष्कर्ष चयनित गंभीरता सीमा तक पहुँचा
- `checksRun` / `checksSkipped`: गणनाएँ (प्रोफ़ाइल, `--only` या `--skip` द्वारा छोड़ी गईं)
- `findings`: `checkId`, `severity`, `message` और वैकल्पिक `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint` सहित संरचित निदान

निकास कोड:

| कोड | अर्थ                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | चयनित सीमा पर या उससे ऊपर कोई निष्कर्ष नहीं           |
| `1`  | एक या अधिक निष्कर्ष चयनित सीमा तक पहुँचे          |
| `2`  | निष्कर्ष उत्सर्जित होने से पहले कमांड/रनटाइम विफलता |

फ़्लैग:

- `--severity-min info|warning|error` (डिफ़ॉल्ट `warning`): क्या प्रिंट होता है और किससे गैर-शून्य निकास होता है, दोनों को नियंत्रित करता है।
- `--all`: डिफ़ॉल्ट ऑटोमेशन समूह से बाहर रखी गई ऑप्ट-इन जाँचों सहित प्रत्येक पंजीकृत lint जाँच चलाता है।
- `--only <id>` (दोहराने योग्य): केवल नामित जाँच id चलाएँ; अज्ञात id को त्रुटि निष्कर्ष के रूप में रिपोर्ट किया जाता है।
- `--skip <id>` (दोहराने योग्य): शेष रन को सक्रिय रखते हुए किसी जाँच को बाहर रखें।
- `--json`, `--severity-min`, `--all`, `--only` और `--skip` के लिए `--lint` आवश्यक है; सामान्य `openclaw doctor` और `--fix` रन इन्हें अस्वीकार करते हैं।

## यह क्या करता है (सारांश)

<AccordionGroup>
  <Accordion title="स्वास्थ्य, UI और अपडेट">
    - git इंस्टॉल के लिए वैकल्पिक प्रीफ़्लाइट अपडेट (केवल इंटरैक्टिव)।
    - UI प्रोटोकॉल नवीनता जाँच (प्रोटोकॉल स्कीमा अधिक नया होने पर Control UI को फिर से बनाता है)।
    - स्वास्थ्य जाँच + पुनरारंभ संकेत।
    - केवल समस्या-संबंधी skill और plugin टिप्पणियाँ; स्वस्थ इन्वेंटरी `openclaw skills check` और `openclaw plugins list` में रहती है।

  </Accordion>
  <Accordion title="Config और माइग्रेशन">
    - पुराने मान आकारों के लिए config सामान्यीकरण।
    - पुराने समतल `talk.*` फ़ील्ड से `talk.provider` + `talk.providers.<provider>` में Talk config माइग्रेशन।
    - पुराने Chrome extension config और Chrome MCP तत्परता के लिए ब्राउज़र माइग्रेशन जाँचें।
    - OpenCode प्रदाता ओवरराइड चेतावनियाँ (`models.providers.opencode` / `opencode-zen` / `opencode-go`)।
    - पुराना OpenAI Codex प्रदाता/प्रोफ़ाइल माइग्रेशन (`openai-codex` → `openai`) और पुराने `models.providers.openai-codex` के लिए शैडोइंग चेतावनियाँ।
    - OpenAI Codex OAuth प्रोफ़ाइलों के लिए OAuth TLS पूर्वापेक्षा जाँच।
    - जब `plugins.allow` प्रतिबंधात्मक हो, लेकिन टूल नीति अब भी वाइल्डकार्ड या plugin-स्वामित्व वाले टूल माँगती हो, तब plugin/tool अनुमति-सूची चेतावनियाँ।
    - पुराना ऑन-डिस्क state माइग्रेशन (sessions/agent dir/WhatsApp auth)।
    - पुराने plugin manifest अनुबंध कुंजी का माइग्रेशन (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)।
    - पुराना cron स्टोर माइग्रेशन (`jobId`, `schedule.cron`, शीर्ष-स्तरीय delivery/payload फ़ील्ड, payload `provider`, `notify: true` webhook फ़ॉलबैक जॉब)।
    - Codex CLI रनटाइम पिन मरम्मत (`agentRuntime.id: "codex-cli"` → `"codex"`) `agents.defaults`, `agents.list[]` और `models.providers.*` में (प्रति-मॉडल प्रविष्टियों सहित)।
    - plugin सक्षम होने पर पुराने plugin config की सफ़ाई; `plugins.enabled=false` होने पर पुराने plugin संदर्भ निष्क्रिय नियंत्रण config के रूप में संरक्षित रहते हैं।

  </Accordion>
  <Accordion title="State और अखंडता">
    - session लॉक फ़ाइल निरीक्षण और पुराने लॉक की सफ़ाई।
    - प्रभावित 2026.4.24 बिल्ड द्वारा बनाई गई डुप्लिकेट prompt-rewrite शाखाओं के लिए session transcript मरम्मत।
    - अटके हुए मुख्य-session और subagent पुनरारंभ-पुनर्प्राप्ति tombstone का पता लगाना। Doctor अवरुद्ध sessions की रिपोर्ट करता है और केवल उन पुराने aborted flags की मरम्मत करता है जो किसी मौजूदा tombstone से टकराते हैं; यह स्वचालित पुनर्प्राप्ति को फिर से सक्षम नहीं करता।
    - state अखंडता और अनुमति जाँचें (sessions, transcripts, state dir)।
    - स्थानीय रूप से चलते समय config फ़ाइल अनुमति जाँच (chmod 600)।
    - मॉडल auth स्वास्थ्य: OAuth समाप्ति की जाँच करता है, समाप्त होने वाले tokens को रीफ़्रेश कर सकता है और auth-profile कूलडाउन/अक्षम स्थितियों की रिपोर्ट करता है।

  </Accordion>
  <Accordion title="Gateway, सेवाएँ और सुपरवाइज़र">
    - सैंडबॉक्सिंग सक्षम होने पर सैंडबॉक्स इमेज की मरम्मत।
    - पुरानी सेवा का माइग्रेशन और अतिरिक्त gateway का पता लगाना।
    - Matrix चैनल पुराने state का माइग्रेशन (`--fix` / `--repair` मोड में)।
    - Gateway रनटाइम जाँचें (सेवा इंस्टॉल है लेकिन चल नहीं रही; कैश किया गया launchd लेबल)।
    - चैनल स्थिति चेतावनियाँ (चल रहे gateway से जाँची गईं)।
    - चैनल-विशिष्ट अनुमति जाँचें `openclaw channels capabilities` के अंतर्गत रहती हैं; उदाहरण के लिए, Discord वॉइस चैनल अनुमतियों का ऑडिट `openclaw channels capabilities --channel discord --target channel:<channel-id>` से किया जाता है।
    - स्थानीय TUI क्लाइंट के अब भी चलने पर खराब Gateway event-loop स्वास्थ्य के लिए WhatsApp प्रतिक्रियाशीलता जाँचें; `--fix` केवल सत्यापित स्थानीय TUI क्लाइंट को रोकता है।
    - प्राथमिक मॉडल, फ़ॉलबैक, इमेज/वीडियो जनरेशन मॉडल, heartbeat/subagent/compaction ओवरराइड, hooks, चैनल मॉडल ओवरराइड और session route pins में पुराने `openai-codex/*` मॉडल refs के लिए Codex route मरम्मत; `--fix` उन्हें `openai/*` में फिर से लिखता है, `openai-codex:*` auth profiles/order को `openai:*` में माइग्रेट करता है, पुराने session/संपूर्ण-agent runtime pins हटाता है और मरम्मत किए गए प्रभावी route को यह निर्धारित करने देता है कि Codex संगत है या नहीं।
    - वैकल्पिक मरम्मत के साथ सुपरवाइज़र config ऑडिट (launchd/systemd/schtasks)।
    - इंस्टॉल या अपडेट के दौरान shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` मान कैप्चर करने वाली gateway सेवाओं के लिए एम्बेडेड proxy environment की सफ़ाई।
    - Gateway रनटाइम जाँचें (असमर्थित पुराने Bun सेवाएँ, version-manager पथ)।
    - Gateway पोर्ट टकराव निदान (डिफ़ॉल्ट `18789`)।

  </Accordion>
  <Accordion title="Auth, सुरक्षा और पेयरिंग">
    - खुली DM नीतियों के लिए सुरक्षा चेतावनियाँ।
    - स्थानीय token मोड के लिए Gateway auth जाँचें (कोई token स्रोत मौजूद न होने पर token जनरेशन की पेशकश करता है; token SecretRef config को अधिलेखित नहीं करता)।
    - डिवाइस पेयरिंग समस्या का पता लगाना (लंबित पहली बार के pair अनुरोध, लंबित role/scope अपग्रेड, पुराने स्थानीय device-token cache विचलन और paired-record auth विचलन)।

  </Accordion>
  <Accordion title="वर्कस्पेस और shell">
    - Linux पर systemd linger जाँच।
    - वर्कस्पेस bootstrap फ़ाइल आकार जाँच (context फ़ाइलों के लिए truncation/सीमा-समीप चेतावनियाँ)।
    - डिफ़ॉल्ट agent के लिए Skills तत्परता जाँच; अनुपलब्ध bins, env, config या OS आवश्यकताओं वाले अनुमत skills की रिपोर्ट करती है और `--fix`, `skills.entries` में अनुपलब्ध skills को अक्षम कर सकता है।
    - shell completion स्थिति जाँच और स्वतः इंस्टॉल/अपग्रेड।
    - मेमोरी खोज embedding प्रदाता तत्परता जाँच (स्थानीय मॉडल, दूरस्थ API key या QMD binary)।
    - स्रोत इंस्टॉल जाँचें (pnpm workspace बेमेल, अनुपलब्ध UI assets, अनुपलब्ध tsx binary)।
    - अपडेट किया गया config + wizard metadata लिखता है।

  </Accordion>
</AccordionGroup>

## Dreams UI बैकफ़िल और रीसेट

  Control UI के Dreams दृश्य में grounded dreaming कार्यप्रवाह के लिए **Backfill**, **Reset**, और **Clear Grounded** कार्रवाइयाँ शामिल हैं। ये Gateway की doctor-शैली वाली RPC विधियों का उपयोग करती हैं, लेकिन `openclaw doctor` CLI मरम्मत/माइग्रेशन का भाग **नहीं** हैं।

  | कार्रवाई         | यह क्या करती है                                                                                                                                                      |
  | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Backfill       | सक्रिय कार्यस्थान में ऐतिहासिक `memory/YYYY-MM-DD.md` फ़ाइलों को स्कैन करती है, grounded REM डायरी पास चलाती है, और `DREAMS.md` में वापस की जा सकने वाली बैकफ़िल प्रविष्टियाँ लिखती है। |
  | Reset          | `DREAMS.md` से केवल चिह्नित बैकफ़िल डायरी प्रविष्टियाँ हटाती है।                                                                                                  |
  | Clear Grounded | ऐतिहासिक रीप्ले से केवल चरणबद्ध की गई grounded-मात्र अल्पकालिक प्रविष्टियाँ हटाती है, जिनमें अभी तक लाइव रिकॉल या दैनिक समर्थन संचित नहीं हुआ है।                           |

  इनमें से कोई भी `MEMORY.md` को संपादित नहीं करती, पूर्ण doctor माइग्रेशन नहीं चलाती, या स्वयं grounded उम्मीदवारों को लाइव अल्पकालिक प्रमोशन स्टोर में चरणबद्ध नहीं करती। grounded ऐतिहासिक रीप्ले को सामान्य डीप प्रमोशन लेन में भेजने के लिए इसके बजाय CLI प्रवाह का उपयोग करें:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  यह grounded स्थायी उम्मीदवारों को अल्पकालिक dreaming स्टोर में चरणबद्ध करता है, जबकि `DREAMS.md` समीक्षा सतह बनी रहती है।

  ## विस्तृत व्यवहार और तर्क

  <AccordionGroup>
  <Accordion title="0. वैकल्पिक अपडेट (git इंस्टॉल)">
    यदि यह git चेकआउट है और doctor इंटरैक्टिव रूप से चल रहा है, तो वह doctor चलाने से पहले अपडेट (fetch/rebase/build) करने का प्रस्ताव देता है।
  </Accordion>
  <Accordion title="1. कॉन्फ़िग सामान्यीकरण">
    Doctor पुराने मान आकारों को वर्तमान स्कीमा में सामान्यीकृत करता है। वर्तमान Talk स्पीच कॉन्फ़िग `talk.provider` + `talk.providers.<provider>` है, और रीयलटाइम वॉइस कॉन्फ़िग `talk.realtime.*` के अंतर्गत है। Doctor पुराने `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` आकारों को प्रोवाइडर मैप में फिर से लिखता है, और पुराने शीर्ष-स्तरीय रीयलटाइम चयनकर्ताओं (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) को `talk.realtime` में फिर से लिखता है।

    जब `plugins.allow` खाली नहीं होता और टूल नीति वाइल्डकार्ड या Plugin-स्वामित्व वाली टूल प्रविष्टियों का उपयोग करती है, तब Doctor चेतावनी भी देता है। `tools.allow: ["*"]` केवल उन Plugins के टूल से मेल खाता है जो वास्तव में लोड होते हैं; यह विशिष्ट Plugin अनुमति-सूची को बायपास नहीं करता।

  </Accordion>
  <Accordion title="2. पुराने कॉन्फ़िग कुंजी माइग्रेशन">
    जब कॉन्फ़िग में सक्रिय माइग्रेशन वाली कोई अप्रचलित कुंजी होती है, तो अन्य कमांड चलने से मना कर देते हैं और आपसे `openclaw doctor` चलाने को कहते हैं। Doctor बताता है कि कौन-सी पुरानी कुंजियाँ मिलीं, लागू किया गया माइग्रेशन दिखाता है, और अपडेट किए गए स्कीमा के साथ `~/.openclaw/openclaw.json` को फिर से लिखता है। Gateway स्टार्टअप पुराने कॉन्फ़िग प्रारूपों को अस्वीकार करता है और आपसे `openclaw doctor --fix` चलाने को कहता है; वह स्टार्टअप पर `openclaw.json` को फिर से नहीं लिखता। Cron जॉब स्टोर माइग्रेशन भी `openclaw doctor --fix` द्वारा संभाले जाते हैं।

    <Note>
      किसी कुंजी को हटाए जाने के बाद Doctor केवल लगभग दो महीनों तक
      स्वचालित माइग्रेशन बनाए रखता है। अधिक पुरानी विरासती कुंजियों (उदाहरण के लिए मूल
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, शीर्ष-स्तरीय `agent.*`, या शीर्ष-स्तरीय `identity`
      जो मल्टी-एजेंट से पहले के कॉन्फ़िग आकार से हैं) के लिए अब माइग्रेशन पथ नहीं है;
      उनका उपयोग करने वाला कॉन्फ़िग अब फिर से लिखे जाने के बजाय सत्यापन में विफल हो जाता है। Doctor के
      आगे बढ़ने से पहले वर्तमान कॉन्फ़िग संदर्भ के अनुसार
      उन कुंजियों को मैन्युअल रूप से ठीक करें।
    </Note>

    सक्रिय माइग्रेशन:

    | पुरानी कुंजी                                                                                    | वर्तमान कुंजी                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | हटाया गया (WebChat सेवानिवृत्त है)                                                 |
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
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (Gateway स्टार्टअप उन प्रोवाइडरों को भी छोड़ देता है जिनका `api` विफल होकर बंद होने के बजाय भविष्य का/अज्ञात enum मान है) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | हटाया गया (पुरानी Chrome एक्सटेंशन रिले सेटिंग)                             |
    | `mcp.servers.*.type` (CLI-मूल उपनाम)                                                        | `mcp.servers.*.transport`                                                    |
    | MCP टाइमआउट उपनाम `connectTimeout`/`connect_timeout`/`timeout`                                 | `connectionTimeoutMs`/`requestTimeoutMs`                                    |
    | शीर्ष-स्तरीय `defaultModel`                                                                         | `agents.defaults.model`                                                      |
    | `messages.messagePrefix`                                                                         | `channels.whatsapp.messagePrefix`                                            |
    | `session.maintenance.pruneDays`, `session.resetByType.dm`                                        | `session.maintenance.pruneAfter`, `session.resetByType.direct`               |
    | शीर्ष-स्तरीय `tui`                                                                                  | हटाया गया (TUI फ़ुटर संक्षिप्त डिफ़ॉल्ट का उपयोग करता है)                            |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | हटाया गया (Codex ऐप-सर्वर हमेशा Codex-मूल कार्यस्थान टूल को मूल रूप में रखता है) |
    | `commands.modelsWrite`                                                                           | हटाया गया (`/models add` अप्रचलित है)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | हटाया गया (सटीक `NO_REPLY` को अब दृश्यमान फ़ॉलबैक टेक्स्ट में फिर से नहीं लिखा जाता)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | हटाया गया (OpenClaw जनरेट किए गए सिस्टम प्रॉम्प्ट का स्वामी है)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | हटाया गया (धीमे मॉडल/प्रोवाइडर टाइमआउट के लिए `models.providers.<id>.timeoutSeconds` का उपयोग करें, जिसे एजेंट/रन टाइमआउट सीमा से नीचे रखा जाता है) |
    | शीर्ष-स्तरीय `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (कोई भी स्तर)                                                            | हटाया गया (मेमोरी इंडेक्स प्रत्येक एजेंट डेटाबेस में रहते हैं)                       |
    | शीर्ष-स्तरीय `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` नीति आईडी                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | हटाया गया (अप्रचलित)                                                        |
    | 2026.7 में सेवानिवृत्त किए गए रनटाइम और चैनल ट्यूनिंग नॉब                                               | हटाया गया (अंतर्निहित प्रोडक्शन डिफ़ॉल्ट लागू होते हैं)                               |

    <Note>
      ऊपर दी गई `plugins.entries.voice-call.config.*` पंक्तियों को हर कॉन्फ़िगरेशन लोड पर
      Voice Call Plugin स्वयं सामान्यीकृत करता है, `openclaw
      doctor` नहीं। Plugin स्टार्टअप पर `openclaw
      doctor --fix` की ओर संकेत करने वाली चेतावनी भी लॉग करता है, लेकिन doctor फ़िलहाल इन कुंजियों के लिए
      `openclaw.json` को दोबारा नहीं लिखता; Plugin का अपना सामान्यीकरण ही
      रनटाइम पर परिवर्तन लागू करता है।
    </Note>

    एकाधिक खातों वाले चैनलों के लिए खाता-डिफ़ॉल्ट मार्गदर्शन:

    - यदि दो या अधिक `channels.<channel>.accounts` प्रविष्टियाँ `channels.<channel>.defaultAccount` या `accounts.default` के बिना कॉन्फ़िगर की गई हैं, तो doctor चेतावनी देता है कि फ़ॉलबैक रूटिंग किसी अनपेक्षित खाते को चुन सकती है।
    - यदि `channels.<channel>.defaultAccount` को किसी अज्ञात खाता ID पर सेट किया गया है, तो doctor चेतावनी देता है और कॉन्फ़िगर किए गए खाता ID सूचीबद्ध करता है।

  </Accordion>
  <Accordion title="2b. OpenCode प्रदाता ओवरराइड">
    यदि आपने `models.providers.opencode`, `opencode-zen`, या `opencode-go` को मैन्युअल रूप से जोड़ा है, तो यह `openclaw/plugin-sdk/llm` के अंतर्निहित OpenCode कैटलॉग को ओवरराइड करता है। इससे मॉडल गलत API का उपयोग करने के लिए बाध्य हो सकते हैं या लागत शून्य हो सकती है। Doctor चेतावनी देता है, ताकि आप ओवरराइड हटाकर प्रति-मॉडल API रूटिंग और लागत पुनर्स्थापित कर सकें।
  </Accordion>
  <Accordion title="2c. ब्राउज़र माइग्रेशन और Chrome MCP की तत्परता">
    यदि आपका ब्राउज़र कॉन्फ़िगरेशन अब भी हटाए गए Chrome एक्सटेंशन पथ की ओर संकेत करता है, तो doctor उसे वर्तमान होस्ट-लोकल Chrome MCP अटैच मॉडल में सामान्यीकृत करता है (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` हटाया गया)।

    जब आप `defaultProfile: "user"` या कॉन्फ़िगर की गई `existing-session` प्रोफ़ाइल का उपयोग करते हैं, तो doctor होस्ट-लोकल Chrome MCP पथ का ऑडिट भी करता है:

    - डिफ़ॉल्ट ऑटो-कनेक्ट प्रोफ़ाइलों के लिए जाँचता है कि Google Chrome उसी होस्ट पर इंस्टॉल है या नहीं
    - पहचाने गए Chrome संस्करण की जाँच करता है और उसके Chrome 144 से कम होने पर चेतावनी देता है
    - आपको ब्राउज़र निरीक्षण पृष्ठ में रिमोट डीबगिंग सक्षम करने की याद दिलाता है (उदाहरण के लिए `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, या `edge://inspect/#remote-debugging`)

    Doctor आपके लिए Chrome की सेटिंग सक्षम नहीं कर सकता। होस्ट-लोकल Chrome MCP के लिए अब भी gateway/node होस्ट पर स्थानीय रूप से चलने वाला Chromium-आधारित ब्राउज़र 144+, सक्षम रिमोट डीबगिंग और ब्राउज़र में पहले अटैच सहमति संकेत की स्वीकृति आवश्यक है।

    यहाँ तत्परता केवल स्थानीय अटैच की पूर्वापेक्षाओं को कवर करती है। मौजूदा-सत्र वर्तमान Chrome MCP रूट सीमाएँ बनाए रखता है; `responsebody`, PDF निर्यात, डाउनलोड इंटरसेप्शन और बैच कार्रवाइयों जैसे उन्नत रूटों के लिए अब भी प्रबंधित ब्राउज़र या रॉ CDP प्रोफ़ाइल आवश्यक है। यह जाँच Docker, सैंडबॉक्स, रिमोट-ब्राउज़र या अन्य हेडलेस प्रवाहों पर लागू नहीं होती, जो रॉ CDP का उपयोग जारी रखते हैं।

  </Accordion>
  <Accordion title="2d. OAuth TLS की पूर्वापेक्षाएँ">
    जब OpenAI Codex OAuth प्रोफ़ाइल कॉन्फ़िगर की जाती है, तो doctor OpenAI प्राधिकरण एंडपॉइंट की जाँच करके सत्यापित करता है कि स्थानीय Node/OpenSSL TLS स्टैक प्रमाणपत्र शृंखला को मान्य कर सकता है। यदि जाँच प्रमाणपत्र त्रुटि के साथ विफल होती है (उदाहरण के लिए `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, समय-सीमा समाप्त प्रमाणपत्र या स्व-हस्ताक्षरित प्रमाणपत्र), तो doctor प्लेटफ़ॉर्म-विशिष्ट सुधार मार्गदर्शन प्रिंट करता है। Homebrew Node वाले macOS पर सुधार सामान्यतः `brew postinstall ca-certificates` होता है। `--deep` के साथ, gateway के स्वस्थ होने पर भी जाँच चलती है।
  </Accordion>
  <Accordion title="2e. Codex OAuth प्रदाता ओवरराइड">
    यदि आपने पहले `models.providers.openai-codex` के अंतर्गत पुराने OpenAI ट्रांसपोर्ट सेटिंग जोड़े थे, तो वे अंतर्निहित Codex OAuth प्रदाता पथ को ओझल कर सकते हैं। Codex OAuth के साथ उन पुराने ट्रांसपोर्ट सेटिंग को देखने पर doctor चेतावनी देता है, ताकि आप बासी ट्रांसपोर्ट ओवरराइड को हटा या दोबारा लिख सकें और वर्तमान रूटिंग व्यवहार पुनर्स्थापित कर सकें। कस्टम प्रॉक्सी और केवल-हेडर ओवरराइड समर्थित रहते हैं और यह चेतावनी ट्रिगर नहीं करते, लेकिन उपयोगकर्ता द्वारा बनाए गए वे अनुरोध रूट अंतर्निहित Codex चयन के पात्र नहीं हैं।
  </Accordion>
  <Accordion title="2f. Codex रूट की मरम्मत">
    Doctor पुराने `openai-codex/*` मॉडल संदर्भों की जाँच करता है। नेटिव Codex हार्नेस रूटिंग कैनोनिकल `openai/*` मॉडल संदर्भों का उपयोग करती है, लेकिन केवल प्रीफ़िक्स कभी Codex का चयन नहीं करता। रनटाइम नीति सेट न होने या `auto` होने पर, केवल ऐसा सटीक आधिकारिक HTTPS Platform Responses या ChatGPT Responses रूट पात्र होता है जिसमें उपयोगकर्ता द्वारा बनाया गया कोई अनुरोध ओवरराइड न हो। [OpenAI अंतर्निहित एजेंट रनटाइम](/hi/providers/openai#implicit-agent-runtime) देखें।

    `--fix` / `--repair` मोड में, doctor प्रभावित डिफ़ॉल्ट-एजेंट और प्रति-एजेंट संदर्भों को दोबारा लिखता है, जिनमें प्राथमिक मॉडल, फ़ॉलबैक, छवि/वीडियो जनरेशन मॉडल, Heartbeat/सबएजेंट/Compaction ओवरराइड, हुक, चैनल मॉडल ओवरराइड और बासी स्थायी सत्र रूट स्थिति शामिल हैं:

    - `openai-codex/gpt-*`, `openai/gpt-*` बन जाता है।
    - सुधारे गए एजेंट मॉडल संदर्भों के लिए Codex अभिप्राय प्रदाता/मॉडल-स्कोप वाली `agentRuntime.id: "codex"` प्रविष्टियों में चला जाता है।
    - पूरे एजेंट का बासी रनटाइम कॉन्फ़िगरेशन और स्थायी सत्र रनटाइम पिन हटा दिए जाते हैं, क्योंकि रनटाइम चयन प्रदाता/मॉडल-स्कोप वाला है।
    - मौजूदा प्रदाता/मॉडल रनटाइम नीति तब तक संरक्षित रहती है, जब तक सुधारे गए पुराने मॉडल संदर्भ को पुराना प्रमाणीकरण पथ बनाए रखने के लिए Codex रूटिंग की आवश्यकता न हो।
    - मौजूदा मॉडल फ़ॉलबैक सूचियाँ उनकी पुरानी प्रविष्टियों को दोबारा लिखकर संरक्षित रखी जाती हैं; कॉपी की गई प्रति-मॉडल सेटिंग पुरानी कुंजी से कैनोनिकल `openai/*` कुंजी में चली जाती हैं।
    - सभी खोजे गए एजेंट सत्र स्टोरों में स्थायी सत्र `modelProvider`/`providerOverride`, `model`/`modelOverride`, फ़ॉलबैक सूचनाएँ और प्रमाणीकरण-प्रोफ़ाइल पिन सुधारे जाते हैं।
    - Doctor बासी `agentRuntime.id: "codex-cli"` पिनों (एक अलग पुरानी रनटाइम ID) को अलग से सुधारकर `agents.defaults`, `agents.list[]`, और `models.providers.*` मॉडल प्रविष्टियों में `"codex"` बनाता है।
    - `/codex ...` का अर्थ है "चैट से किसी नेटिव Codex वार्तालाप को नियंत्रित या बाइंड करना।"
    - `/acp ...` या `runtime: "acp"` का अर्थ है "बाहरी ACP/acpx अडैप्टर का उपयोग करना।"

  </Accordion>
  <Accordion title="2g. सत्र रूट की सफ़ाई">
    कॉन्फ़िगर किए गए मॉडल या रनटाइम को Codex जैसे Plugin-स्वामित्व वाले रूट से हटाने के बाद, doctor बासी स्वतः-निर्मित रूट स्थिति के लिए खोजे गए एजेंट सत्र स्टोरों को भी स्कैन करता है।

    `openclaw doctor --fix` स्वतः-निर्मित बासी स्थिति को साफ़ कर सकता है, जैसे `modelOverrideSource: "auto"` मॉडल पिन, रनटाइम मॉडल मेटाडेटा, पिन किए गए हार्नेस ID, CLI सत्र बाइंडिंग और स्वचालित प्रमाणीकरण-प्रोफ़ाइल ओवरराइड, जब उनका स्वामी रूट अब कॉन्फ़िगर नहीं है। स्पष्ट उपयोगकर्ता या पुराने सत्र मॉडल विकल्पों को मैन्युअल समीक्षा के लिए रिपोर्ट किया जाता है और बिना बदले छोड़ दिया जाता है; जब वह रूट अब अपेक्षित न हो, तो उन्हें `/model ...`, `/new` से बदलें या सत्र रीसेट करें।

  </Accordion>
  <Accordion title="3. पुरानी स्थिति के माइग्रेशन (डिस्क लेआउट)">
    Doctor पुराने ऑन-डिस्क लेआउट को वर्तमान संरचना में माइग्रेट कर सकता है:

    - सत्र स्टोर और ट्रांसक्रिप्ट: `~/.openclaw/sessions/` से `~/.openclaw/agents/<agentId>/sessions/` में
    - एजेंट डायरेक्टरी: `~/.openclaw/agent/` से `~/.openclaw/agents/<agentId>/agent/` में
    - WhatsApp प्रमाणीकरण स्थिति (Baileys): पुराने `~/.openclaw/credentials/*.json` से (`oauth.json` को छोड़कर) `~/.openclaw/credentials/whatsapp/<accountId>/...` में (डिफ़ॉल्ट खाता ID: `default`)
    - हस्ताक्षरित डिवाइस पहचान: `~/.openclaw/identity/device.json` से `state/openclaw.sqlite` की `primary` `device_identities` पंक्ति में; अलग डिवाइस-प्रमाणीकरण फ़ाइल को अपरिवर्तित छोड़ दिया जाता है

    ये माइग्रेशन यथासंभव प्रयास वाले और आइडेम्पोटेंट हैं; बैकअप के रूप में कोई पुराना फ़ोल्डर छोड़ने पर doctor चेतावनी देता है। Gateway/CLI स्टार्टअप पर पुराने सत्र और एजेंट डायरेक्टरी को भी स्वतः माइग्रेट करता है, ताकि इतिहास/प्रमाणीकरण/मॉडल मैन्युअल doctor चलाए बिना प्रति-एजेंट पथ में पहुँच जाएँ। WhatsApp प्रमाणीकरण को जानबूझकर केवल `openclaw doctor` के माध्यम से माइग्रेट किया जाता है। Talk प्रदाता/प्रदाता-मैप सामान्यीकरण संरचनात्मक समानता के आधार पर तुलना करता है, इसलिए केवल कुंजी-क्रम के अंतर अब बार-बार निष्प्रभावी `doctor --fix` परिवर्तन ट्रिगर नहीं करते।

  </Accordion>
  <Accordion title="3a. पुराने Plugin मैनिफ़ेस्ट के माइग्रेशन">
    Doctor सभी इंस्टॉल किए गए Plugin मैनिफ़ेस्ट में अप्रचलित शीर्ष-स्तरीय क्षमता कुंजियों (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) को स्कैन करता है। मिलने पर, यह उन्हें `contracts` ऑब्जेक्ट में ले जाने और मैनिफ़ेस्ट फ़ाइल को उसी स्थान पर दोबारा लिखने की पेशकश करता है। यह माइग्रेशन आइडेम्पोटेंट है; यदि `contracts` में पहले से समान मान हैं, तो डेटा की प्रतिलिपि बनाए बिना पुरानी कुंजी हटा दी जाती है।
  </Accordion>
  <Accordion title="3b. पुराने Cron स्टोर के माइग्रेशन">
    Doctor Cron जॉब स्टोर (डिफ़ॉल्ट रूप से `~/.openclaw/cron/jobs.json`, या ओवरराइड किए जाने पर `cron.store`) में पुराने जॉब आकारों की भी जाँच करता है, जिन्हें शेड्यूलर अब भी संगतता के लिए स्वीकार करता है।

    वर्तमान Cron सफ़ाई में शामिल हैं:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - शीर्ष-स्तरीय पेलोड फ़ील्ड (`message`, `model`, `thinking`, ...) → `payload`
    - शीर्ष-स्तरीय डिलीवरी फ़ील्ड (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - पेलोड `provider` डिलीवरी उपनाम → स्पष्ट `delivery.channel`
    - पुराने `notify: true` Webhook फ़ॉलबैक जॉब → मान्य होने पर सेवानिवृत्त रॉ `cron.webhook` मान से स्पष्ट Webhook डिलीवरी; घोषणा जॉब अपनी चैट डिलीवरी बनाए रखते हैं और उन्हें `delivery.completionDestination` मिलता है। इसके बाद doctor पुरानी कॉन्फ़िगरेशन कुंजी हटा देता है। उपयोग योग्य पुराने Webhook के बिना, लक्ष्य-विहीन जॉब के लिए निष्क्रिय शीर्ष-स्तरीय `notify` मार्कर हटा दिया जाता है (घोषणा सहित मौजूदा डिलीवरी संरक्षित रहती है), क्योंकि रनटाइम डिलीवरी उसे कभी नहीं पढ़ती।

    Gateway लोड के समय विकृत Cron पंक्तियों को भी साफ़ करता है, ताकि मान्य जॉब चलते रहें। रॉ विकृत पंक्तियों को `jobs.json` से हटाने से पहले सक्रिय स्टोर के बगल में `jobs-quarantine.json` में कॉपी किया जाता है; doctor क्वारंटीन की गई पंक्तियों की रिपोर्ट करता है, ताकि आप उनकी मैन्युअल समीक्षा या मरम्मत कर सकें।

    Gateway स्टार्टअप रनटाइम प्रोजेक्शन को सामान्यीकृत करता है और शीर्ष-स्तरीय `notify` मार्कर को अनदेखा करता है, लेकिन स्थायी Cron स्थिति को doctor द्वारा मरम्मत के लिए छोड़ देता है। Doctor बिना माइग्रेशन लक्ष्य वाले जॉब (`delivery.mode` नहीं/अनुपस्थित, अनुपयोगी पुराना Webhook लक्ष्य, या मौजूदा घोषणा/चैट डिलीवरी) के निष्क्रिय मार्कर हटा देता है और मौजूदा डिलीवरी को अपरिवर्तित रखता है, इसलिए बार-बार `doctor --fix` चलाने पर अब उसी जॉब के बारे में दोबारा चेतावनी नहीं मिलती।

    Linux पर doctor तब भी चेतावनी देता है, जब उपयोगकर्ता का crontab अब भी पुराने `~/.openclaw/bin/ensure-whatsapp.sh` को चलाता है। वर्तमान OpenClaw उस होस्ट-लोकल स्क्रिप्ट का रखरखाव नहीं करता और जब Cron systemd उपयोगकर्ता बस तक नहीं पहुँच पाता, तो वह `~/.openclaw/logs/whatsapp-health.log` में गलत `Gateway inactive` संदेश लिख सकती है। बासी crontab प्रविष्टि को `crontab -e` से हटाएँ; वर्तमान स्वास्थ्य जाँच के लिए `openclaw channels status --probe`, `openclaw doctor`, और `openclaw gateway status` का उपयोग करें।

  </Accordion>
  <Accordion title="3c. सत्र लॉक की सफ़ाई">
    Doctor प्रत्येक एजेंट सत्र डायरेक्टरी में उन पुराने राइट-लॉक फ़ाइलों को स्कैन करता है जो किसी सत्र के असामान्य रूप से बंद होने पर पीछे रह गई थीं। मिली प्रत्येक लॉक फ़ाइल के लिए यह रिपोर्ट करता है: पथ, PID, PID अभी सक्रिय है या नहीं, लॉक की आयु, और क्या उसे पुराना माना गया है (निष्क्रिय PID, विकृत स्वामी मेटाडेटा, 30 मिनट से अधिक पुराना, या ऐसा सक्रिय PID जिसके गैर-OpenClaw प्रक्रिया से संबंधित होने की पुष्टि हो चुकी है)। `--fix` / `--repair` मोड में यह निष्क्रिय, अनाथ, पुनः उपयोग किए गए, विकृत-पुराने या गैर-OpenClaw स्वामियों वाले लॉक अपने-आप हटा देता है। किसी सक्रिय OpenClaw प्रक्रिया के स्वामित्व वाले पुराने लॉक की रिपोर्ट की जाती है, लेकिन उन्हें यथास्थान छोड़ा जाता है, ताकि Doctor किसी सक्रिय ट्रांसक्रिप्ट राइटर को बाधित न करे।
  </Accordion>
  <Accordion title="3d. सत्र ट्रांसक्रिप्ट शाखा की मरम्मत">
    Doctor एजेंट सत्र की JSONL फ़ाइलों में 2026.4.24 के प्रॉम्प्ट ट्रांसक्रिप्ट रीराइट बग से बनी डुप्लिकेट शाखा संरचना को स्कैन करता है: OpenClaw के आंतरिक रनटाइम संदर्भ वाला एक छोड़ा गया उपयोगकर्ता टर्न और उसी दृश्यमान उपयोगकर्ता प्रॉम्प्ट वाला एक सक्रिय सहोदर। `--fix` / `--repair` मोड में Doctor प्रत्येक प्रभावित फ़ाइल का मूल फ़ाइल के पास बैकअप बनाता है और ट्रांसक्रिप्ट को सक्रिय शाखा के अनुसार फिर से लिखता है, ताकि Gateway इतिहास और मेमोरी रीडर अब डुप्लिकेट टर्न न देखें।
  </Accordion>
  <Accordion title="4. स्थिति की अखंडता की जाँच (सत्र स्थायित्व, रूटिंग और सुरक्षा)">
    स्थिति डायरेक्टरी संचालन का मस्तिष्क-तना है। यदि यह गायब हो जाती है, तो अन्यत्र बैकअप न होने पर आपके सत्र, क्रेडेंशियल, लॉग और कॉन्फ़िगरेशन खो जाएँगे।

    Doctor जाँचता है:

    - **स्थिति डायरेक्टरी अनुपस्थित**: विनाशकारी स्थिति हानि की चेतावनी देता है, डायरेक्टरी फिर से बनाने का संकेत देता है और याद दिलाता है कि यह अनुपस्थित डेटा पुनर्प्राप्त नहीं कर सकता।
    - **स्थिति डायरेक्टरी की अनुमतियाँ**: लिखने की क्षमता सत्यापित करता है; अनुमतियाँ सुधारने का विकल्प देता है (और स्वामी/समूह बेमेल मिलने पर `chown` संकेत देता है)।
    - **macOS की क्लाउड-सिंक स्थिति डायरेक्टरी**: स्थिति के iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) या `~/Library/CloudStorage/...` के अंतर्गत पाए जाने पर चेतावनी देता है, क्योंकि सिंक-समर्थित पथ धीमे I/O और लॉक/सिंक रेस का कारण बन सकते हैं।
    - **Linux की SD या eMMC स्थिति डायरेक्टरी**: स्थिति के किसी `mmcblk*` माउंट स्रोत पर पाए जाने पर चेतावनी देता है, क्योंकि SD/eMMC-समर्थित रैंडम I/O धीमा हो सकता है और सत्र तथा क्रेडेंशियल लिखे जाने के दौरान अधिक तेज़ी से घिस सकता है।
    - **Linux की अस्थायी स्थिति डायरेक्टरी**: स्थिति के `tmpfs` या `ramfs` पर पाए जाने पर चेतावनी देता है, क्योंकि रीबूट होने पर सत्र, क्रेडेंशियल, कॉन्फ़िगरेशन और SQLite स्थिति (WAL/जर्नल साइडकार सहित) गायब हो जाते हैं। Docker के `overlay` माउंट को जानबूझकर चिह्नित नहीं किया जाता, क्योंकि कंटेनर के बने रहने तक उनकी लिखने योग्य परतें होस्ट रीबूट के बाद भी बनी रहती हैं।
    - **सत्र डायरेक्टरियाँ अनुपस्थित**: इतिहास बनाए रखने और `ENOENT` क्रैश से बचने के लिए `sessions/` और सत्र स्टोर डायरेक्टरी आवश्यक हैं।
    - **ट्रांसक्रिप्ट बेमेल**: हाल की सत्र प्रविष्टियों की ट्रांसक्रिप्ट फ़ाइलें अनुपस्थित होने पर चेतावनी देता है।
    - **मुख्य सत्र की "1-पंक्ति JSONL"**: मुख्य ट्रांसक्रिप्ट में केवल एक पंक्ति होने पर चिह्नित करता है (इतिहास संचित नहीं हो रहा है)।
    - **एकाधिक स्थिति डायरेक्टरियाँ**: होम डायरेक्टरियों में एकाधिक `~/.openclaw` फ़ोल्डर मौजूद होने पर या `OPENCLAW_STATE_DIR` के किसी अन्य स्थान की ओर संकेत करने पर चेतावनी देता है (इतिहास अलग-अलग इंस्टॉलेशन में विभाजित हो सकता है)।
    - **रिमोट मोड अनुस्मारक**: यदि `gateway.mode=remote`, तो Doctor इसे रिमोट होस्ट पर चलाने की याद दिलाता है (स्थिति वहीं रहती है)।
    - **कॉन्फ़िगरेशन फ़ाइल की अनुमतियाँ**: यदि `~/.openclaw/openclaw.json` समूह/सभी के लिए पढ़ने योग्य है, तो चेतावनी देता है और इसे `600` तक सीमित करने का विकल्प देता है।

  </Accordion>
  <Accordion title="5. मॉडल प्रमाणीकरण की स्थिति (OAuth समाप्ति)">
    Doctor प्रमाणीकरण स्टोर में OAuth प्रोफ़ाइलों की जाँच करता है, टोकन शीघ्र समाप्त होने वाले या समाप्त हो चुके होने पर चेतावनी देता है और सुरक्षित होने पर उन्हें रीफ़्रेश कर सकता है। यदि Anthropic OAuth/टोकन प्रोफ़ाइल पुरानी है, तो यह Anthropic API कुंजी या Anthropic सेटअप-टोकन पथ सुझाता है। रीफ़्रेश प्रॉम्प्ट केवल इंटरैक्टिव रूप से (TTY) चलाते समय दिखाई देते हैं; `--non-interactive` रीफ़्रेश प्रयासों को छोड़ देता है।

    जब OAuth रीफ़्रेश स्थायी रूप से विफल हो जाता है (उदाहरण के लिए `refresh_token_reused`, `invalid_grant`, या प्रदाता आपसे फिर से साइन इन करने को कहे), तो Doctor रिपोर्ट करता है कि पुनः प्रमाणीकरण आवश्यक है और चलाने के लिए सटीक `openclaw models auth login --provider ...` कमांड दिखाता है।

    Doctor उन प्रमाणीकरण प्रोफ़ाइलों की भी रिपोर्ट करता है जो छोटे कूलडाउन (दर सीमाएँ/टाइमआउट/प्रमाणीकरण विफलताएँ) या अधिक समय तक निष्क्रिय किए जाने (बिलिंग/क्रेडिट विफलताएँ) के कारण अस्थायी रूप से अनुपयोगी हैं।

    वे पुराने Codex OAuth प्रोफ़ाइल, जिनके टोकन macOS Keychain में रहते हैं (फ़ाइल-आधारित साइडकार संरचना से पहले की पुरानी ऑनबोर्डिंग), केवल Doctor द्वारा सुधारे जाते हैं। Keychain-समर्थित पुराने टोकन को इनलाइन `auth-profiles.json` में माइग्रेट करने के लिए किसी इंटरैक्टिव टर्मिनल से `openclaw doctor --fix` एक बार चलाएँ; इसके बाद एम्बेड किए गए टर्न (Telegram, cron, सब-एजेंट डिस्पैच) उन्हें कैनोनिकल OpenAI OAuth प्रोफ़ाइलों के रूप में हल करते हैं।

  </Accordion>
  <Accordion title="6. हुक्स मॉडल सत्यापन">
    यदि `hooks.gmail.model` सेट है, तो Doctor कैटलॉग और अनुमत सूची के विरुद्ध मॉडल संदर्भ को सत्यापित करता है और जब वह हल नहीं होगा या अनुमत नहीं है, तब चेतावनी देता है।
  </Accordion>
  <Accordion title="7. सैंडबॉक्स इमेज की मरम्मत">
    सैंडबॉक्सिंग सक्षम होने पर Doctor Docker इमेज की जाँच करता है और वर्तमान इमेज अनुपस्थित होने पर उसे बनाने या पुराने नामों पर स्विच करने का विकल्प देता है।
  </Accordion>
  <Accordion title="7b. Plugin इंस्टॉलेशन की सफ़ाई">
    Doctor `openclaw doctor --fix` / `openclaw doctor --repair` मोड में OpenClaw द्वारा जनरेट की गई पुरानी Plugin निर्भरता स्टेजिंग स्थिति हटाता है: पुराने जनरेट किए गए निर्भरता रूट, पुरानी इंस्टॉल-स्टेज डायरेक्टरियाँ, पहले के बंडल किए गए Plugin निर्भरता मरम्मत कोड से आया पैकेज-स्थानीय मलबा, और बंडल किए गए `@openclaw/*` Plugin की अनाथ या पुनर्प्राप्त प्रबंधित npm प्रतियाँ, जो वर्तमान बंडल किए गए मैनिफ़ेस्ट को ओवरराइड कर सकती हैं। Doctor होस्ट के `openclaw` पैकेज को उन प्रबंधित npm Plugin में फिर से लिंक भी करता है जो `peerDependencies.openclaw` घोषित करते हैं, ताकि `openclaw/plugin-sdk/*` जैसे पैकेज-स्थानीय रनटाइम इम्पोर्ट अपडेट या npm मरम्मत के बाद भी हल होते रहें।

    कॉन्फ़िगरेशन में संदर्भित डाउनलोड योग्य Plugin अनुपस्थित होने और स्थानीय Plugin रजिस्ट्री द्वारा उन्हें न खोज पाने पर Doctor उन्हें फिर से इंस्टॉल भी कर सकता है (महत्त्वपूर्ण `plugins.entries`, कॉन्फ़िगर की गई चैनल/प्रदाता/खोज सेटिंग, कॉन्फ़िगर किए गए एजेंट रनटाइम)। पैकेज अपडेट के दौरान, कोर पैकेज बदले जाते समय Doctor Plugin पैकेज को फिर से इंस्टॉल करने से बचता है; यदि किसी कॉन्फ़िगर किए गए Plugin को अब भी पुनर्प्राप्ति की आवश्यकता है, तो अपडेट के बाद `openclaw doctor --fix` फिर से चलाएँ। नीचे दिए गए कंटेनर इमेज स्टार्टअप अपवाद के अतिरिक्त, Gateway स्टार्टअप और कॉन्फ़िगरेशन रीलोड पैकेज मरम्मत नहीं चलाते; Plugin इंस्टॉलेशन स्पष्ट Doctor/इंस्टॉल/अपडेट कार्य बने रहते हैं।

    कंटेनरीकृत Gateway स्टार्टअप में एक सीमित अपग्रेड अपवाद है: जब `openclaw gateway run` किसी नए OpenClaw संस्करण पर शुरू होता है, तो यह तैयार होने से पहले सुरक्षित स्थिति माइग्रेशन और मौजूदा पोस्ट-कोर Plugin अभिसरण चलाता है, फिर प्रति-संस्करण चेकपॉइंट दर्ज करता है। यह स्टार्टअप पास पुराने बंडल किए गए Plugin रिकॉर्ड साफ़ कर सकता है, स्थानीय Plugin लिंक सुधार सकता है, अभिसरण पथ द्वारा आवश्यक होने पर कॉन्फ़िगर किए गए Plugin पैकेज फिर से इंस्टॉल कर सकता है और सक्रिय Plugin पेलोड की जाँच कर सकता है। यदि स्टार्टअप सुरक्षित रूप से मरम्मत नहीं कर सकता, तो कंटेनर को सामान्य रूप से फिर से शुरू करने से पहले समान माउंट की गई स्थिति/कॉन्फ़िगरेशन के विरुद्ध उसी इमेज को `openclaw doctor --fix` के साथ एक बार चलाएँ।

  </Accordion>
  <Accordion title="8. Gateway सेवा माइग्रेशन और सफ़ाई के संकेत">
    Doctor पुरानी Gateway सेवाओं (launchd/systemd/schtasks) का पता लगाता है और उन्हें हटाने तथा वर्तमान Gateway पोर्ट का उपयोग करके OpenClaw सेवा इंस्टॉल करने का विकल्प देता है। यह अतिरिक्त Gateway-जैसी सेवाओं के लिए भी स्कैन कर सकता है और सफ़ाई के संकेत दिखा सकता है। प्रोफ़ाइल-नाम वाली OpenClaw Gateway सेवाएँ प्रथम-श्रेणी मानी जाती हैं और उन्हें "अतिरिक्त" के रूप में चिह्नित नहीं किया जाता।

    Linux पर, यदि उपयोगकर्ता-स्तरीय Gateway सेवा अनुपस्थित है लेकिन सिस्टम-स्तरीय OpenClaw Gateway सेवा मौजूद है, तो Doctor अपने-आप दूसरी उपयोगकर्ता-स्तरीय सेवा इंस्टॉल नहीं करता। `openclaw gateway status --deep` या `openclaw doctor --deep` से निरीक्षण करें, फिर डुप्लिकेट हटाएँ या जब कोई सिस्टम सुपरवाइज़र Gateway जीवनचक्र का स्वामी हो, तब `OPENCLAW_SERVICE_REPAIR_POLICY=external` सेट करें।

  </Accordion>
  <Accordion title="8b. स्टार्टअप Matrix माइग्रेशन">
    जब किसी Matrix चैनल खाते का कोई लंबित या कार्रवाई योग्य पुरानी स्थिति का माइग्रेशन हो, तो Doctor (`--fix` / `--repair` मोड में) माइग्रेशन-पूर्व स्नैपशॉट बनाता है और फिर सर्वोत्तम-प्रयास माइग्रेशन चरण चलाता है: पुरानी Matrix स्थिति का माइग्रेशन और पुरानी एन्क्रिप्टेड-स्थिति की तैयारी। दोनों चरण गैर-घातक हैं; त्रुटियाँ लॉग की जाती हैं और स्टार्टअप जारी रहता है। केवल-पढ़ने योग्य मोड (`openclaw doctor`, `--fix` के बिना) में यह जाँच पूरी तरह छोड़ दी जाती है।
  </Accordion>
  <Accordion title="8c. डिवाइस पेयरिंग और प्रमाणीकरण विचलन">
    Doctor सामान्य स्वास्थ्य जाँच के भाग के रूप में डिवाइस-पेयरिंग स्थिति का निरीक्षण करते हुए रिपोर्ट करता है:

    - पहली बार पेयरिंग के लंबित अनुरोध
    - पहले से पेयर किए गए डिवाइसों के लंबित भूमिका या स्कोप अपग्रेड
    - पब्लिक-की बेमेल की मरम्मत, जहाँ डिवाइस आईडी अब भी मेल खाती है लेकिन डिवाइस पहचान अब स्वीकृत रिकॉर्ड से मेल नहीं खाती
    - स्वीकृत भूमिका के लिए सक्रिय टोकन से रहित पेयर किए गए रिकॉर्ड
    - ऐसे पेयर किए गए टोकन जिनके स्कोप स्वीकृत पेयरिंग आधाररेखा से बाहर चले गए हैं
    - वर्तमान मशीन की स्थानीय रूप से कैश की गई डिवाइस-टोकन प्रविष्टियाँ, जो Gateway-पक्ष के टोकन रोटेशन से पहले की हैं या जिनमें पुराना स्कोप मेटाडेटा है

    Doctor पेयरिंग अनुरोधों को अपने-आप स्वीकृत नहीं करता या डिवाइस टोकन को अपने-आप रोटेट नहीं करता। यह सटीक अगले चरण दिखाता है:

    - लंबित अनुरोधों का `openclaw devices list` से निरीक्षण करें
    - सटीक अनुरोध को `openclaw devices approve <requestId>` से स्वीकृत करें
    - `openclaw devices rotate --device <deviceId> --role <role>` से नया टोकन रोटेट करें
    - पुराने रिकॉर्ड को `openclaw devices remove <deviceId>` से हटाकर फिर से स्वीकृत करें

    यह पहली बार की पेयरिंग को लंबित भूमिका/स्कोप अपग्रेड और पुराने टोकन/डिवाइस-पहचान विचलन से अलग करता है, जिससे "पहले से पेयर किया गया है, लेकिन अभी भी पेयरिंग आवश्यक संदेश मिल रहा है" वाली सामान्य कमी दूर होती है।

  </Accordion>
  <Accordion title="9. सुरक्षा चेतावनियाँ">
    Doctor केवल चेतावनी मिलने पर सुरक्षा नोट देता है, जैसे अनुमत सूची के बिना सीधे संदेशों के लिए खुला कोई प्रदाता या खतरनाक ढंग से कॉन्फ़िगर की गई नीति। संपूर्ण सुरक्षा सूची के लिए `openclaw security audit` का उपयोग करें।
  </Accordion>
  <Accordion title="10. systemd लिंगर (Linux)">
    systemd उपयोगकर्ता सेवा के रूप में चलने पर Doctor सुनिश्चित करता है कि लिंगरिंग सक्षम हो, ताकि लॉगआउट के बाद भी Gateway सक्रिय रहे।
  </Accordion>
  <Accordion title="11. कार्यस्थान की स्थिति (Skills, Plugin और TaskFlow)">
    Doctor डिफ़ॉल्ट एजेंट के लिए समस्याएँ और कार्रवाइयाँ दिखाता है, न कि स्वस्थ स्थिति की सूची:

    - **Skills**: अनुमत लेकिन अनुपयोगी स्किल नाम सूचीबद्ध करता है; आवश्यकता विवरण और पूरी गणना के लिए `openclaw skills check` का उपयोग करें।
    - **Plugin**: केवल त्रुटिपूर्ण Plugin आईडी की रिपोर्ट करता है; लोड किए गए, आयातित, निष्क्रिय और बंडल-Plugin की सूची के लिए `openclaw plugins list` का उपयोग करें।
    - **Plugin संगतता चेतावनियाँ**: वर्तमान रनटाइम के साथ संगतता समस्याओं वाले Plugin को चिह्नित करता है।
    - **Plugin निदान**: Plugin रजिस्ट्री द्वारा लोड होने के समय दी गई किसी भी चेतावनी या त्रुटि को सामने लाता है।
    - **TaskFlow पुनर्प्राप्ति**: ऐसे संदिग्ध प्रबंधित TaskFlow सामने लाता है जिन्हें मैन्युअल निरीक्षण या रद्द करने की आवश्यकता है।
    - **Claude CLI**: केवल बाइनरी, प्रमाणीकरण, प्रोफ़ाइल, कार्यस्थान या प्रोजेक्ट-डायरेक्टरी की समस्याओं की रिपोर्ट करता है; स्वस्थ जाँच का विवरण छोड़ दिया जाता है।

  </Accordion>
  <Accordion title="11b. बूटस्ट्रैप फ़ाइल का आकार">
    Doctor जाँचता है कि कार्यस्थान की बूटस्ट्रैप फ़ाइलें (उदाहरण के लिए `AGENTS.md`, `CLAUDE.md` या अन्य इंजेक्ट की गई संदर्भ फ़ाइलें) कॉन्फ़िगर की गई वर्ण सीमा के पास या उससे अधिक तो नहीं हैं। यह प्रत्येक फ़ाइल के लिए मूल बनाम इंजेक्ट किए गए वर्णों की संख्या, काटे जाने का प्रतिशत, काटे जाने का कारण (`max/file` या `max/total`) और कुल सीमा के अंश के रूप में कुल इंजेक्ट किए गए वर्णों की रिपोर्ट करता है। फ़ाइलें काटे जाने या सीमा के पास होने पर Doctor `agents.defaults.bootstrapMaxChars` और `agents.defaults.bootstrapTotalMaxChars` को समायोजित करने के सुझाव दिखाता है।
  </Accordion>
  <Accordion title="11c. शेल पूर्णता">
    Doctor जाँचता है कि वर्तमान शेल (zsh, bash, fish या PowerShell) के लिए टैब पूर्णता इंस्टॉल है या नहीं:

    - यदि शेल प्रोफ़ाइल धीमे डायनेमिक कम्प्लीशन पैटर्न (`source <(openclaw completion ...)`) का उपयोग करती है, तो doctor उसे अधिक तेज़ कैश की गई फ़ाइल वाले वैरिएंट में अपग्रेड करता है।
    - यदि प्रोफ़ाइल में कम्प्लीशन कॉन्फ़िगर किया गया है, लेकिन कैश फ़ाइल मौजूद नहीं है, तो doctor कैश को अपने-आप फिर से जनरेट करता है।
    - यदि कोई कम्प्लीशन बिल्कुल भी कॉन्फ़िगर नहीं किया गया है, तो doctor उसे इंस्टॉल करने का संकेत देता है (केवल इंटरैक्टिव मोड; `--non-interactive` के साथ छोड़ दिया जाता है)।

    कैश को मैन्युअल रूप से फिर से जनरेट करने के लिए `openclaw completion --write-state` चलाएँ।

  </Accordion>
  <Accordion title="11d. पुराने चैनल Plugin की सफ़ाई">
    जब `openclaw doctor --fix` किसी अनुपलब्ध चैनल Plugin को हटाता है, तो वह उस Plugin को संदर्भित करने वाले लटके हुए चैनल-स्कोप्ड कॉन्फ़िगरेशन को भी हटा देता है: `channels.<id>` प्रविष्टियाँ, चैनल का नाम देने वाले Heartbeat लक्ष्य और `agents.*.models["<channel>/*"]` ओवरराइड। इससे ऐसे Gateway बूट लूप रोके जाते हैं जिनमें चैनल रनटाइम हट चुका होता है, लेकिन कॉन्फ़िगरेशन अब भी Gateway से उससे बाइंड होने को कहता है।
  </Accordion>
  <Accordion title="12. Gateway प्रमाणीकरण जाँच (स्थानीय टोकन)">
    Doctor स्थानीय Gateway टोकन प्रमाणीकरण की तत्परता जाँचता है।

    - यदि टोकन मोड को टोकन की आवश्यकता है और कोई टोकन स्रोत मौजूद नहीं है, तो doctor एक टोकन जनरेट करने का प्रस्ताव देता है।
    - यदि `gateway.auth.token` SecretRef द्वारा प्रबंधित है, लेकिन उपलब्ध नहीं है, तो doctor चेतावनी देता है और उसे प्लेनटेक्स्ट से ओवरराइट नहीं करता।
    - `openclaw doctor --generate-gateway-token` केवल तभी जनरेशन को बाध्य करता है, जब कोई टोकन SecretRef कॉन्फ़िगर नहीं किया गया हो।

  </Accordion>
  <Accordion title="12b. केवल-पढ़ने योग्य SecretRef-जागरूक मरम्मत">
    कुछ मरम्मत प्रवाहों को रनटाइम के तुरंत विफल होने के व्यवहार को कमज़ोर किए बिना कॉन्फ़िगर किए गए क्रेडेंशियल्स की जाँच करनी होती है।

    - `openclaw doctor --fix` लक्षित कॉन्फ़िगरेशन मरम्मत के लिए स्थिति-परिवार कमांड के समान केवल-पढ़ने योग्य SecretRef सारांश मॉडल का उपयोग करता है।
    - उदाहरण: Telegram `allowFrom` / `groupAllowFrom` `@username` मरम्मत, उपलब्ध होने पर कॉन्फ़िगर किए गए बॉट क्रेडेंशियल्स का उपयोग करने का प्रयास करती है।
    - यदि Telegram बॉट टोकन SecretRef के माध्यम से कॉन्फ़िगर किया गया है, लेकिन वर्तमान कमांड पथ में उपलब्ध नहीं है, तो doctor बताता है कि क्रेडेंशियल कॉन्फ़िगर है लेकिन उपलब्ध नहीं है और क्रैश होने या टोकन को अनुपलब्ध बताने के बजाय स्वचालित समाधान छोड़ देता है।

  </Accordion>
  <Accordion title="13. Gateway स्वास्थ्य जाँच + पुनः प्रारंभ">
    Doctor स्वास्थ्य जाँच चलाता है और Gateway के अस्वस्थ दिखने पर उसे पुनः प्रारंभ करने का प्रस्ताव देता है।
  </Accordion>
  <Accordion title="13b. मेमोरी खोज की तत्परता">
    Doctor जाँचता है कि कॉन्फ़िगर किया गया मेमोरी खोज एम्बेडिंग प्रदाता डिफ़ॉल्ट एजेंट के लिए तैयार है या नहीं। व्यवहार कॉन्फ़िगर किए गए बैकएंड और प्रदाता पर निर्भर करता है:

    - **QMD बैकएंड**: जाँचता है कि `qmd` बाइनरी उपलब्ध है और प्रारंभ की जा सकती है या नहीं। यदि नहीं, तो `npm install -g @tobilu/qmd` (या Bun समकक्ष) और मैन्युअल बाइनरी पथ विकल्प सहित सुधार मार्गदर्शन प्रिंट करता है।
    - **स्पष्ट स्थानीय प्रदाता**: स्थानीय मॉडल फ़ाइल या किसी मान्यताप्राप्त रिमोट/डाउनलोड-योग्य मॉडल URL की जाँच करता है। अनुपलब्ध होने पर रिमोट प्रदाता पर स्विच करने का सुझाव देता है।
    - **स्पष्ट रिमोट प्रदाता** (`openai`, `voyage`, आदि): सत्यापित करता है कि पर्यावरण या प्रमाणीकरण स्टोर में API कुंजी मौजूद है। अनुपलब्ध होने पर कार्रवाई योग्य सुधार संकेत प्रिंट करता है।
    - **पुराना स्वचालित प्रदाता**: `memorySearch.provider: "auto"` को OpenAI मानता है, OpenAI की तत्परता जाँचता है और `doctor --fix` उसे `provider: "openai"` में फिर से लिखता है।

    जब कैश किया हुआ Gateway जाँच परिणाम उपलब्ध होता है (जाँच के समय Gateway स्वस्थ था), तो doctor उसके परिणाम को CLI में दिखाई देने वाले कॉन्फ़िगरेशन के साथ मिलान करता है और किसी भी विसंगति का उल्लेख करता है। Doctor डिफ़ॉल्ट पथ पर नई एम्बेडिंग पिंग प्रारंभ नहीं करता; लाइव प्रदाता जाँच के लिए विस्तृत मेमोरी स्थिति कमांड का उपयोग करें।

    रनटाइम पर एम्बेडिंग की तत्परता सत्यापित करने के लिए `openclaw memory status --deep` का उपयोग करें।

  </Accordion>
  <Accordion title="14. चैनल स्थिति चेतावनियाँ">
    यदि Gateway स्वस्थ है, तो doctor चैनल स्थिति जाँच चलाता है और सुझाए गए सुधारों के साथ चेतावनियाँ रिपोर्ट करता है।
  </Accordion>
  <Accordion title="15. सुपरवाइज़र कॉन्फ़िगरेशन ऑडिट + मरम्मत">
    Doctor इंस्टॉल किए गए सुपरवाइज़र कॉन्फ़िगरेशन (launchd/systemd/schtasks) में अनुपलब्ध या पुराने डिफ़ॉल्ट की जाँच करता है (उदाहरण के लिए, systemd network-online निर्भरताएँ और पुनः प्रारंभ विलंब)। विसंगति मिलने पर, वह अपडेट की अनुशंसा करता है और सेवा फ़ाइल/टास्क को वर्तमान डिफ़ॉल्ट के अनुसार फिर से लिख सकता है।

    टिप्पणियाँ:

    - `openclaw doctor` सुपरवाइज़र कॉन्फ़िगरेशन को फिर से लिखने से पहले पुष्टि माँगता है।
    - `openclaw doctor --yes` डिफ़ॉल्ट मरम्मत संकेतों को स्वीकार करता है।
    - `openclaw doctor --fix` बिना संकेत दिए अनुशंसित सुधार लागू करता है (`--repair` एक उपनाम है)।
    - `openclaw doctor --fix --force` कस्टम सुपरवाइज़र कॉन्फ़िगरेशन को ओवरराइट करता है।
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` Gateway सेवा जीवनचक्र के लिए doctor को केवल-पढ़ने योग्य बनाए रखता है। यह अब भी सेवा स्वास्थ्य रिपोर्ट करता है और गैर-सेवा मरम्मत चलाता है, लेकिन सेवा इंस्टॉल/प्रारंभ/पुनः प्रारंभ/बूटस्ट्रैप, सुपरवाइज़र कॉन्फ़िगरेशन पुनर्लेखन और पुरानी सेवा की सफ़ाई छोड़ देता है, क्योंकि उस जीवनचक्र का स्वामित्व किसी बाहरी सुपरवाइज़र के पास होता है।
    - Linux पर, संबंधित systemd Gateway यूनिट सक्रिय होने के दौरान doctor कमांड/एंट्रीपॉइंट मेटाडेटा को फिर से नहीं लिखता। यह डुप्लिकेट-सेवा स्कैन के दौरान निष्क्रिय गैर-पुरानी अतिरिक्त Gateway-जैसी यूनिटों को भी अनदेखा करता है, ताकि सहयोगी सेवा फ़ाइलें अनावश्यक सफ़ाई संदेश उत्पन्न न करें।
    - यदि टोकन प्रमाणीकरण को टोकन की आवश्यकता है और `gateway.auth.token` SecretRef द्वारा प्रबंधित है, तो doctor सेवा इंस्टॉल/मरम्मत SecretRef को सत्यापित करती है, लेकिन समाधान किए गए प्लेनटेक्स्ट टोकन मानों को सुपरवाइज़र सेवा पर्यावरण मेटाडेटा में स्थायी नहीं करती।
    - Doctor प्रबंधित `.env`/SecretRef-समर्थित सेवा पर्यावरण मानों का पता लगाता है, जिन्हें पुराने LaunchAgent, systemd या Windows Scheduled Task इंस्टॉल ने इनलाइन एम्बेड किया था, और सेवा मेटाडेटा को फिर से लिखता है ताकि वे मान सुपरवाइज़र परिभाषा के बजाय रनटाइम स्रोत से लोड हों।
    - Doctor पता लगाता है कि `gateway.port` में बदलाव के बाद भी सेवा कमांड किसी पुराने `--port` पर स्थिर है या नहीं, और सेवा मेटाडेटा को वर्तमान पोर्ट के अनुसार फिर से लिखता है।
    - यदि टोकन प्रमाणीकरण को टोकन की आवश्यकता है और कॉन्फ़िगर किया गया टोकन SecretRef अनसुलझा है, तो doctor कार्रवाई योग्य मार्गदर्शन के साथ इंस्टॉल/मरम्मत पथ को अवरुद्ध करता है।
    - यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर किए गए हैं और `gateway.auth.mode` सेट नहीं है, तो doctor मोड को स्पष्ट रूप से सेट किए जाने तक इंस्टॉल/मरम्मत को अवरुद्ध करता है।
    - Linux उपयोगकर्ता-systemd यूनिटों के लिए, सेवा प्रमाणीकरण मेटाडेटा की तुलना करते समय doctor की टोकन विचलन जाँच में `Environment=` और `EnvironmentFile=` दोनों स्रोत शामिल होते हैं।
    - जब कॉन्फ़िगरेशन को पिछली बार किसी नए संस्करण ने लिखा हो, तो doctor सेवा मरम्मत किसी पुराने OpenClaw बाइनरी से Gateway सेवा को फिर से लिखने, रोकने या पुनः प्रारंभ करने से इनकार करती है। [Gateway समस्या निवारण](/hi/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) देखें।
    - आप `openclaw gateway install --force` के माध्यम से हमेशा पूर्ण पुनर्लेखन को बाध्य कर सकते हैं।

  </Accordion>
  <Accordion title="16. Gateway रनटाइम + पोर्ट निदान">
    Doctor सेवा रनटाइम (PID, अंतिम निकास स्थिति) की जाँच करता है और सेवा इंस्टॉल होने के बावजूद वास्तव में नहीं चलने पर चेतावनी देता है। यह Gateway पोर्ट (डिफ़ॉल्ट `18789`) पर पोर्ट टकरावों की भी जाँच करता है और संभावित कारण रिपोर्ट करता है (Gateway पहले से चल रहा है, SSH टनल)।
  </Accordion>
  <Accordion title="17. Gateway रनटाइम की सर्वोत्तम प्रथाएँ">
    जब Gateway सेवा Bun या संस्करण-प्रबंधित Node पथ (`nvm`, `fnm`, `volta`, `asdf`, आदि) पर चलती है, तो doctor चेतावनी देता है। Bun, OpenClaw का `node:sqlite` स्टेट स्टोर नहीं खोल सकता, इसलिए मरम्मत पुरानी Bun सेवाओं को Node पर माइग्रेट करती है। संस्करण-प्रबंधक पथ अपग्रेड के बाद टूट सकते हैं, क्योंकि सेवा आपका शेल इनिशियलाइज़ेशन लोड नहीं करती। उपलब्ध होने पर doctor सिस्टम Node इंस्टॉल (Homebrew/apt/choco) पर माइग्रेट करने का प्रस्ताव देता है।

    नए इंस्टॉल या मरम्मत किए गए macOS LaunchAgents, इंटरैक्टिव शेल PATH की प्रतिलिपि बनाने के बजाय प्रामाणिक सिस्टम PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) का उपयोग करते हैं, ताकि Homebrew द्वारा प्रबंधित सिस्टम बाइनरी उपलब्ध रहें, जबकि Volta, asdf, fnm, pnpm और अन्य संस्करण-प्रबंधक डायरेक्टरियाँ यह न बदलें कि चाइल्ड प्रोसेस किस Node को रिज़ॉल्व करते हैं। Linux सेवाएँ अब भी स्पष्ट पर्यावरण रूट (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) और स्थिर उपयोगकर्ता-बाइन डायरेक्टरियाँ बनाए रखती हैं, लेकिन अनुमानित संस्करण-प्रबंधक फ़ॉलबैक डायरेक्टरियाँ सेवा PATH में केवल तभी लिखी जाती हैं, जब वे डायरेक्टरियाँ डिस्क पर मौजूद हों।

  </Accordion>
  <Accordion title="18. कॉन्फ़िगरेशन लेखन + विज़ार्ड मेटाडेटा">
    Doctor किसी भी कॉन्फ़िगरेशन बदलाव को स्थायी करता है और doctor रन को रिकॉर्ड करने के लिए विज़ार्ड मेटाडेटा अंकित करता है।
  </Accordion>
  <Accordion title="19. कार्यक्षेत्र सुझाव (बैकअप + मेमोरी सिस्टम)">
    Doctor अनुपलब्ध होने पर कार्यक्षेत्र मेमोरी सिस्टम का सुझाव देता है और यदि कार्यक्षेत्र पहले से git के अंतर्गत नहीं है, तो बैकअप सुझाव प्रिंट करता है।

    कार्यक्षेत्र संरचना और git बैकअप (निजी GitHub या GitLab अनुशंसित) की पूरी मार्गदर्शिका के लिए [/concepts/agent-workspace](/hi/concepts/agent-workspace) देखें।

  </Accordion>
</AccordionGroup>

## संबंधित

- [Gateway संचालन पुस्तिका](/hi/gateway)
- [Gateway समस्या निवारण](/hi/gateway/troubleshooting)
