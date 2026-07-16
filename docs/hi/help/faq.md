---
read_when:
    - सामान्य सेटअप, इंस्टॉलेशन, ऑनबोर्डिंग या रनटाइम सहायता संबंधी प्रश्नों के उत्तर देना
    - गहन डीबगिंग से पहले उपयोगकर्ताओं द्वारा रिपोर्ट की गई समस्याओं का प्रारंभिक विश्लेषण
summary: OpenClaw सेटअप, कॉन्फ़िगरेशन और उपयोग के बारे में अक्सर पूछे जाने वाले प्रश्न
title: अक्सर पूछे जाने वाले प्रश्न
x-i18n:
    generated_at: "2026-07-16T15:11:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 913757fcc748a15370dc49874b54184d891c954df45b76c8a3212da5bc1da845
    source_path: help/faq.md
    workflow: 16
---

वास्तविक दुनिया के सेटअप (स्थानीय डेवलपमेंट, VPS, मल्टी-एजेंट, OAuth/API कुंजियाँ, मॉडल फ़ेलओवर) के लिए त्वरित उत्तर और गहन समस्या-निवारण। रनटाइम निदान के लिए [समस्या-निवारण](/hi/gateway/troubleshooting) देखें। पूर्ण कॉन्फ़िगरेशन संदर्भ के लिए [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

## कुछ खराब होने पर पहले 60 सेकंड

<Steps>
  <Step title="त्वरित स्थिति">
    ```bash
    openclaw status
    ```
    त्वरित स्थानीय सारांश: OS + अपडेट, Gateway/सेवा की पहुँच, एजेंट/सत्र, प्रदाता कॉन्फ़िगरेशन + रनटाइम समस्याएँ (जब Gateway पहुँच योग्य हो)।
  </Step>
  <Step title="चिपकाने योग्य रिपोर्ट (साझा करना सुरक्षित है)">
    ```bash
    openclaw status --all
    ```
    लॉग के अंतिम भाग सहित केवल-पठन निदान (टोकन संपादित किए गए हैं)।
  </Step>
  <Step title="डेमन + पोर्ट की स्थिति">
    ```bash
    openclaw gateway status
    ```
    सुपरवाइज़र रनटाइम बनाम RPC पहुँच, जाँच का लक्ष्य URL और सेवा ने संभवतः कौन-सा कॉन्फ़िगरेशन उपयोग किया, यह दिखाता है।
  </Step>
  <Step title="गहन जाँच">
    ```bash
    openclaw status --deep
    ```
    लाइव Gateway स्वास्थ्य जाँच, जिसमें समर्थित होने पर चैनल जाँच भी शामिल हैं (इसके लिए पहुँच योग्य Gateway आवश्यक है)। [स्वास्थ्य](/hi/gateway/health) देखें।
  </Step>
  <Step title="नवीनतम लॉग का अंतिम भाग देखें">
    ```bash
    openclaw logs --follow
    ```
    यदि RPC बंद है, तो इसके बजाय उपयोग करें:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    फ़ाइल लॉग सेवा लॉग से अलग होते हैं; [लॉगिंग](/hi/logging) और [समस्या-निवारण](/hi/gateway/troubleshooting) देखें।
  </Step>
  <Step title="डॉक्टर चलाएँ (मरम्मत)">
    ```bash
    openclaw doctor
    ```
    कॉन्फ़िगरेशन और स्थिति की मरम्मत/माइग्रेशन करता है, फिर स्वास्थ्य जाँच चलाता है। [डॉक्टर](/hi/gateway/doctor) देखें।
  </Step>
  <Step title="Gateway स्नैपशॉट (केवल WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # त्रुटियों पर लक्ष्य URL + कॉन्फ़िगरेशन पथ दिखाता है
    ```
    चल रहे Gateway से पूर्ण स्नैपशॉट माँगता है। [स्वास्थ्य](/hi/gateway/health) देखें।
  </Step>
</Steps>

## त्वरित शुरुआत और पहली बार का सेटअप

पहली बार के प्रश्नोत्तर—इंस्टॉल, ऑनबोर्डिंग, प्रमाणीकरण मार्ग, सदस्यताएँ और शुरुआती विफलताएँ—[पहली बार के अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq-first-run) में उपलब्ध हैं।

## OpenClaw क्या है?

<AccordionGroup>
  <Accordion title="एक अनुच्छेद में OpenClaw क्या है?">
    OpenClaw एक व्यक्तिगत AI सहायक है, जिसे आप अपने उपकरणों पर चलाते हैं। यह आपके पहले से उपयोग किए जाने वाले मैसेजिंग माध्यमों (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp और QQ Bot जैसे बंडल किए गए चैनल plugins) पर उत्तर देता है और समर्थित प्लेटफ़ॉर्म पर वॉइस तथा लाइव Canvas भी प्रदान कर सकता है। **Gateway** हमेशा चालू रहने वाला नियंत्रण तल है; सहायक ही उत्पाद है।
  </Accordion>

  <Accordion title="मूल्य प्रस्ताव">
    OpenClaw "सिर्फ़ एक Claude रैपर" नहीं है। यह एक **लोकल-फ़र्स्ट नियंत्रण तल** है, जो **आपके अपने हार्डवेयर** पर एक सक्षम सहायक चलाता है, आपके पहले से उपयोग किए जाने वाले चैट ऐप्स से पहुँच योग्य है और स्टेटफ़ुल सत्र, मेमोरी तथा टूल प्रदान करता है—आपके वर्कफ़्लो किसी होस्टेड SaaS को सौंपे बिना।

    - **आपके उपकरण, आपका डेटा**: Gateway को अपनी पसंद के स्थान (Mac, Linux, VPS) पर चलाएँ और वर्कस्पेस तथा सत्र इतिहास स्थानीय रखें।
    - **वास्तविक चैनल, वेब सैंडबॉक्स नहीं**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/आदि, साथ ही समर्थित प्लेटफ़ॉर्म पर मोबाइल वॉइस और Canvas।
    - **मॉडल-अज्ञेय**: Anthropic, MiniMax, OpenAI, OpenRouter आदि का उपयोग करें, जिसमें प्रत्येक एजेंट के लिए रूटिंग और फ़ेलओवर उपलब्ध हैं।
    - **केवल-स्थानीय विकल्प**: स्थानीय मॉडल चलाएँ, ताकि सारा डेटा आपके उपकरण पर रह सके।
    - **मल्टी-एजेंट रूटिंग**: प्रत्येक चैनल, खाते या कार्य के लिए अलग एजेंट, जिनमें से प्रत्येक का अपना वर्कस्पेस और डिफ़ॉल्ट होता है।
    - **ओपन सोर्स और अनुकूलन योग्य**: वेंडर लॉक-इन के बिना निरीक्षण करें, विस्तार करें और स्वयं होस्ट करें।

    दस्तावेज़: [Gateway](/hi/gateway), [चैनल](/hi/channels), [मल्टी-एजेंट](/hi/concepts/multi-agent), [मेमोरी](/hi/concepts/memory)।

  </Accordion>

  <Accordion title="मैंने अभी इसे सेट अप किया है—मुझे सबसे पहले क्या करना चाहिए?">
    शुरुआत के लिए अच्छे प्रोजेक्ट: एक वेबसाइट बनाएँ (WordPress, Shopify या स्थिर साइट); मोबाइल ऐप का प्रोटोटाइप बनाएँ (रूपरेखा, स्क्रीन, API योजना); फ़ाइलों और फ़ोल्डरों को व्यवस्थित करें; Gmail कनेक्ट करें और सारांश या फ़ॉलो-अप स्वचालित करें।

    यह बड़े कार्य संभाल सकता है, लेकिन समानांतर कार्य के लिए उप-एजेंट का उपयोग करते हुए कार्यों को चरणों में बाँटने पर सबसे अच्छा काम करता है।

  </Accordion>

  <Accordion title="OpenClaw के रोज़मर्रा के पाँच प्रमुख उपयोग क्या हैं?">
    - **व्यक्तिगत ब्रीफ़िंग**: इनबॉक्स, कैलेंडर और आपकी रुचि के समाचारों के सारांश।
    - **शोध और प्रारूपण**: ईमेल या दस्तावेज़ों के लिए त्वरित शोध, सारांश और शुरुआती मसौदे।
    - **रिमाइंडर और फ़ॉलो-अप**: Cron या Heartbeat से संचालित संकेत और चेकलिस्ट।
    - **ब्राउज़र स्वचालन**: फ़ॉर्म भरना, डेटा एकत्र करना और वेब कार्यों को दोहराना।
    - **उपकरणों के बीच समन्वय**: अपने फ़ोन से कोई कार्य भेजें, Gateway को उसे सर्वर पर चलाने दें और परिणाम चैट में वापस पाएँ।

  </Accordion>

  <Accordion title="क्या OpenClaw किसी SaaS के लिए लीड जनरेशन, आउटरीच, विज्ञापनों और ब्लॉग में सहायता कर सकता है?">
    हाँ, **शोध, योग्यता निर्धारण और प्रारूपण** के लिए: साइटों को स्कैन करना, संक्षिप्त सूचियाँ बनाना, संभावित ग्राहकों का सारांश तैयार करना और आउटरीच या विज्ञापन कॉपी के मसौदे लिखना।

    **आउटरीच या विज्ञापन अभियान** के लिए, मानवीय निगरानी बनाए रखें। स्पैम से बचें, स्थानीय कानूनों और प्लेटफ़ॉर्म नीतियों का पालन करें और कुछ भी भेजे जाने से पहले उसकी समीक्षा करें। OpenClaw को मसौदा तैयार करने दें; स्वीकृति आप दें।

    दस्तावेज़: [सुरक्षा](/hi/gateway/security)।

  </Accordion>

  <Accordion title="वेब डेवलपमेंट के लिए Claude Code की तुलना में इसके क्या लाभ हैं?">
    OpenClaw एक **व्यक्तिगत सहायक** और समन्वय परत है, IDE का प्रतिस्थापन नहीं। किसी रेपो के भीतर सबसे तेज़ प्रत्यक्ष कोडिंग चक्र के लिए Claude Code या Codex का उपयोग करें। स्थायी मेमोरी, उपकरणों के बीच पहुँच और टूल ऑर्केस्ट्रेशन के लिए OpenClaw का उपयोग करें।

    - सत्रों के बीच स्थायी मेमोरी और वर्कस्पेस।
    - मल्टी-प्लेटफ़ॉर्म पहुँच (Telegram, WhatsApp, TUI, WebChat)।
    - टूल ऑर्केस्ट्रेशन (ब्राउज़र, फ़ाइलें, शेड्यूलिंग, हुक)।
    - हमेशा चालू Gateway (VPS पर चलाएँ, कहीं से भी सहभागिता करें)।
    - स्थानीय ब्राउज़र/स्क्रीन/कैमरा/निष्पादन के लिए Nodes।

    प्रदर्शन: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)।

  </Accordion>
</AccordionGroup>

## Skills और स्वचालन

<AccordionGroup>
  <Accordion title="रेपो को असंशोधित रखते हुए Skills को कैसे अनुकूलित किया जा सकता है?">
    रेपो की प्रति संपादित करने के बजाय प्रबंधित ओवरराइड का उपयोग करें। परिवर्तन `~/.openclaw/skills/<name>/SKILL.md` में रखें (या `~/.openclaw/openclaw.json` में `skills.load.extraDirs` के माध्यम से कोई फ़ोल्डर जोड़ें)। प्राथमिकता: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> बंडल किए गए -> `skills.load.extraDirs`, इसलिए प्रबंधित ओवरराइड git को छुए बिना बंडल किए गए Skills पर प्राथमिकता पाते हैं। वैश्विक रूप से इंस्टॉल करने लेकिन दृश्यता को कुछ एजेंट तक सीमित रखने के लिए, साझा प्रति को `~/.openclaw/skills` में रखें और `agents.defaults.skills` / `agents.list[].skills` से दृश्यता नियंत्रित करें। केवल वे संपादन, जिन्हें अपस्ट्रीम में शामिल किया जाना उचित हो, रेपो की प्रति के विरुद्ध PR के रूप में भेजे जाने चाहिए।
  </Accordion>

  <Accordion title="क्या किसी कस्टम फ़ोल्डर से Skills लोड किए जा सकते हैं?">
    हाँ: `~/.openclaw/openclaw.json` में `skills.load.extraDirs` के माध्यम से डायरेक्टरी जोड़ें (ऊपर दिए गए क्रम में सबसे कम प्राथमिकता)। `clawhub` डिफ़ॉल्ट रूप से `./skills` में इंस्टॉल करता है, जिसे OpenClaw अगले सत्र में `<workspace>/skills` मानता है। दृश्यता को कुछ एजेंट तक सीमित रखने के लिए इसे `agents.defaults.skills` या `agents.list[].skills` के साथ जोड़ें।
  </Accordion>

  <Accordion title="अलग-अलग कार्यों के लिए अलग मॉडल या सेटिंग्स का उपयोग कैसे किया जा सकता है?">
    समर्थित पैटर्न:

    - **Cron कार्य**: पृथक कार्य प्रत्येक कार्य के लिए `model` ओवरराइड निर्धारित कर सकते हैं।
    - **एजेंट**: कार्यों को अलग-अलग डिफ़ॉल्ट मॉडल, चिंतन स्तर और स्ट्रीम पैरामीटर वाले अलग एजेंट की ओर रूट करें।
    - **माँग पर स्विच**: `/model` किसी भी समय वर्तमान सत्र का मॉडल बदलता है।

    उदाहरण—एक ही मॉडल, प्रत्येक एजेंट के लिए अलग सेटिंग्स:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    प्रत्येक मॉडल के साझा डिफ़ॉल्ट `agents.defaults.models["provider/model"].params` में रखें, फिर एजेंट-विशिष्ट ओवरराइड समतल `agents.list[].params` में रखें। नेस्टेड `agents.list[].models["provider/model"].params` के अंतर्गत उसी मॉडल की नकल न करें; वह पथ प्रत्येक एजेंट के मॉडल कैटलॉग और रनटाइम ओवरराइड के लिए है।

    [Cron कार्य](/hi/automation/cron-jobs), [मल्टी-एजेंट रूटिंग](/hi/concepts/multi-agent), [कॉन्फ़िगरेशन](/hi/gateway/config-agents), [स्लैश कमांड](/hi/tools/slash-commands) देखें।

  </Accordion>

  <Accordion title="भारी कार्य करते समय बॉट रुक जाता है। इसे कहीं और कैसे चलाया जा सकता है?">
    लंबे या समानांतर कार्यों के लिए **उप-एजेंट** का उपयोग करें: वे अपने सत्र में चलते हैं, सारांश लौटाते हैं और आपकी मुख्य चैट को प्रतिक्रियाशील बनाए रखते हैं। बॉट से "इस कार्य के लिए एक उप-एजेंट बनाएँ" कहें या `/subagents` का उपयोग करें। यह देखने के लिए कि Gateway वर्तमान में व्यस्त है या नहीं, `/status` का उपयोग करें।

    लंबे कार्य और उप-एजेंट दोनों टोकन का उपयोग करते हैं; यदि लागत महत्वपूर्ण है, तो `agents.defaults.subagents.model` के माध्यम से उप-एजेंट के लिए सस्ता मॉडल निर्धारित करें।

    दस्तावेज़: [उप-एजेंट](/hi/tools/subagents), [पृष्ठभूमि कार्य](/hi/automation/tasks)।

  </Accordion>

  <Accordion title="Discord पर थ्रेड से जुड़े उप-एजेंट सत्र कैसे काम करते हैं?">
    किसी Discord थ्रेड को उप-एजेंट या सत्र लक्ष्य से जोड़ें, ताकि वहाँ के फ़ॉलो-अप संदेश उसी संबद्ध सत्र पर बने रहें।

    - `thread: true` के साथ `sessions_spawn` का उपयोग करके बनाएँ (स्थायी फ़ॉलो-अप के लिए वैकल्पिक रूप से `mode: "session"`)।
    - या `/focus <target>` से मैन्युअल रूप से जोड़ें।
    - `/agents` संबद्धता की स्थिति का निरीक्षण करता है।
    - `/session idle <duration|off>` और `/session max-age <duration|off>` स्वचालित रूप से फ़ोकस हटाने को नियंत्रित करते हैं।
    - `/unfocus` थ्रेड को अलग करता है।

    कॉन्फ़िगरेशन: `session.threadBindings.enabled` (वैश्विक स्विच), `session.threadBindings.idleHours` (डिफ़ॉल्ट `24`, `0` अक्षम करता है), `session.threadBindings.maxAgeHours` (डिफ़ॉल्ट `0` = कोई कठोर सीमा नहीं) और प्रत्येक चैनल के ओवरराइड `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`। `channels.discord.threadBindings.spawnSessions` निर्माण के समय स्वचालित संबद्धता को नियंत्रित करता है (डिफ़ॉल्ट `true`)।

    दस्तावेज़: [उप-एजेंट](/hi/tools/subagents), [Discord](/hi/channels/discord), [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference), [स्लैश कमांड](/hi/tools/slash-commands)।

  </Accordion>

  <Accordion title="एक उप-एजेंट पूरा हो गया, लेकिन पूर्णता अपडेट गलत स्थान पर गया या कभी पोस्ट नहीं हुआ। क्या जाँचना चाहिए?">
    निर्धारित अनुरोधकर्ता मार्ग जाँचें:

    - पूर्णता-मोड में उप-एजेंट की डिलीवरी किसी संबद्ध थ्रेड या वार्तालाप मार्ग के उपलब्ध होने पर उसे प्राथमिकता देती है।
    - यदि पूर्णता के उद्गम में केवल एक चैनल है, तो OpenClaw अनुरोधकर्ता सत्र के संग्रहीत मार्ग (`lastChannel` / `lastTo` / `lastAccountId`) का उपयोग करता है, ताकि प्रत्यक्ष डिलीवरी फिर भी सफल हो सके।
    - कोई संबद्ध मार्ग और कोई उपयोग योग्य संग्रहीत मार्ग नहीं: प्रत्यक्ष डिलीवरी विफल हो सकती है और परिणाम तुरंत पोस्ट होने के बजाय कतारबद्ध सत्र डिलीवरी पर लौट जाता है।
    - अमान्य या पुराने लक्ष्य भी कतार वाले फ़ॉलबैक या अंतिम डिलीवरी विफलता को बाध्य कर सकते हैं।
    - यदि चाइल्ड का अंतिम दृश्यमान सहायक उत्तर ठीक `NO_REPLY` / `no_reply` या `ANNOUNCE_SKIP` है, तो OpenClaw पुराने पूर्ववर्ती प्रगति संदेश को पोस्ट करने के बजाय जानबूझकर घोषणा रोक देता है।

    डीबग: `openclaw tasks show <lookup>`, जहाँ `<lookup>` एक कार्य ID, रन ID या सत्र कुंजी है।

    दस्तावेज़: [उप-एजेंट](/hi/tools/subagents), [पृष्ठभूमि कार्य](/hi/automation/tasks), [सत्र टूल](/hi/concepts/session-tool)।

  </Accordion>

  <Accordion title="Cron या रिमाइंडर सक्रिय नहीं होते। क्या जाँचना चाहिए?">
    Cron, Gateway प्रक्रिया के भीतर चलता है; यदि Gateway लगातार नहीं चल रहा है, तो यह सक्रिय नहीं होता।

    - पुष्टि करें कि Cron सक्षम है (`cron.enabled`) और `OPENCLAW_SKIP_CRON` सेट नहीं है।
    - पुष्टि करें कि Gateway 24/7 चल रहा है (न स्लीप, न पुनः आरंभ)।
    - कार्य का समय क्षेत्र सत्यापित करें (`--tz` बनाम होस्ट का समय क्षेत्र)।

    डिबग:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    दस्तावेज़: [Cron जॉब](/hi/automation/cron-jobs), [ऑटोमेशन](/hi/automation)।

  </Accordion>

  <Accordion title="Cron चला, लेकिन चैनल पर कुछ भी नहीं भेजा गया। क्यों?">
    डिलीवरी मोड जाँचें:

    - `--no-deliver` / `delivery.mode: "none"`: रनर से फ़ॉलबैक प्रेषण अपेक्षित नहीं है।
    - अनुपलब्ध या अमान्य घोषणा लक्ष्य (`channel` / `to`): रनर ने आउटबाउंड डिलीवरी छोड़ दी।
    - चैनल प्रमाणीकरण विफलताएँ (`unauthorized`, `Forbidden`): रनर ने डिलीवरी का प्रयास किया, लेकिन क्रेडेंशियल ने इसे रोक दिया।
    - एक मौन पृथक परिणाम (केवल `NO_REPLY` / `no_reply`) को जानबूझकर डिलीवरी-योग्य नहीं माना जाता है, इसलिए कतारबद्ध फ़ॉलबैक डिलीवरी भी रोक दी जाती है।

    पृथक Cron जॉब के लिए, चैट रूट उपलब्ध होने पर एजेंट अब भी `message` टूल से सीधे भेज सकता है। `--announce` केवल उस अंतिम टेक्स्ट की रनर फ़ॉलबैक डिलीवरी नियंत्रित करता है जिसे एजेंट ने पहले ही स्वयं नहीं भेजा है।

    डिबग:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    दस्तावेज़: [Cron जॉब](/hi/automation/cron-jobs), [बैकग्राउंड टास्क](/hi/automation/tasks)।

  </Accordion>

  <Accordion title="एक पृथक Cron रन ने मॉडल क्यों बदला या एक बार पुनः प्रयास क्यों किया?">
    यह लाइव मॉडल-स्विच पथ है, डुप्लिकेट शेड्यूलिंग नहीं। सक्रिय रन द्वारा `LiveSessionModelSwitchError` थ्रो किए जाने पर पृथक Cron रनटाइम मॉडल हैंडऑफ़ को बनाए रखता है और पुनः प्रयास करता है; पुनः प्रयास से पहले बदले हुए प्रोवाइडर/मॉडल (और बदला हुआ कोई भी ऑथ-प्रोफ़ाइल ओवरराइड) को बरकरार रखता है।

    मॉडल-चयन प्राथमिकता: पहले Gmail हुक मॉडल ओवरराइड (`hooks.gmail.model`), फिर प्रति-जॉब `model`, फिर कोई भी संग्रहीत Cron-सेशन मॉडल ओवरराइड, और फिर सामान्य एजेंट/डिफ़ॉल्ट मॉडल चयन।

    पुनः प्रयास लूप आरंभिक प्रयास और उसके बाद 2 स्विच पुनः प्रयासों तक सीमित है; इसके बाद Cron अनंत लूप में जाने के बजाय निरस्त हो जाता है।

    डिबग:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    दस्तावेज़: [Cron जॉब](/hi/automation/cron-jobs), [Cron CLI](/hi/cli/cron)।

  </Accordion>

  <Accordion title="मैं Linux पर Skills कैसे इंस्टॉल करूँ?">
    मूल `openclaw skills` कमांड का उपयोग करें या Skills को अपने वर्कस्पेस में रखें; macOS Skills UI Linux पर उपलब्ध नहीं है। Skills को [https://clawhub.ai](https://clawhub.ai) पर ब्राउज़ करें।

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    मूल `openclaw skills install` डिफ़ॉल्ट रूप से सक्रिय वर्कस्पेस की `skills/` डायरेक्टरी में लिखता है। सभी स्थानीय एजेंटों के लिए साझा प्रबंधित Skills डायरेक्टरी में इंस्टॉल करने हेतु `--global` जोड़ें। केवल अपनी Skills प्रकाशित या सिंक करने के लिए अलग `clawhub` CLI इंस्टॉल करें। साझा Skills किन एजेंटों को दिखाई दें, इसे सीमित करने के लिए `agents.defaults.skills` या `agents.list[].skills` का उपयोग करें।

  </Accordion>

  <Accordion title="क्या OpenClaw टास्क को शेड्यूल पर या बैकग्राउंड में लगातार चला सकता है?">
    हाँ, Gateway शेड्यूलर के माध्यम से:

    - शेड्यूल किए गए या आवर्ती टास्क के लिए **Cron जॉब** (रीस्टार्ट के बाद भी बने रहते हैं)।
    - मुख्य सेशन की आवधिक जाँच के लिए **Heartbeat**।
    - सारांश पोस्ट करने या चैट में डिलीवर करने वाले स्वायत्त एजेंटों के लिए **पृथक जॉब**।

    दस्तावेज़: [Cron जॉब](/hi/automation/cron-jobs), [ऑटोमेशन](/hi/automation), [Heartbeat](/hi/gateway/heartbeat)।

  </Accordion>

  <Accordion title="क्या मैं Linux से केवल Apple macOS वाली Skills चला सकता हूँ?">
    सीधे नहीं। macOS Skills को `metadata.openclaw.os` और आवश्यक बाइनरी द्वारा नियंत्रित किया जाता है, और वे केवल **Gateway होस्ट** पर योग्य होने पर लोड होती हैं। Linux पर केवल `darwin` वाली Skills (`apple-notes`, `apple-reminders`, `things-mac`) तब तक लोड नहीं होंगी, जब तक आप इस नियंत्रण को ओवरराइड नहीं करते।

    तीन समर्थित पैटर्न:

    **विकल्प A - Gateway को Mac पर चलाएँ (सबसे सरल)**। Gateway को वहाँ चलाएँ जहाँ macOS बाइनरी मौजूद हैं, फिर Linux से [रिमोट मोड](#gateway-ports-already-running-and-remote-mode) में या Tailscale के माध्यम से कनेक्ट करें। Skills सामान्य रूप से लोड होती हैं क्योंकि Gateway होस्ट macOS है।

    **विकल्प B - macOS Node का उपयोग करें (SSH के बिना)**। Gateway को Linux पर चलाएँ, एक macOS Node (मेनूबार ऐप) पेयर करें, और Mac पर **Node Run Commands** को "Always Ask" या "Always Allow" पर सेट करें। Node पर आवश्यक बाइनरी मौजूद होने पर OpenClaw केवल macOS वाली Skills को योग्य मानता है; एजेंट उन्हें `nodes` टूल के माध्यम से चलाता है। "Always Ask" के साथ, प्रॉम्प्ट में "Always Allow" को स्वीकृत करने पर वह कमांड अनुमति-सूची में जुड़ जाता है।

    **विकल्प C - SSH पर macOS बाइनरी को प्रॉक्सी करें (उन्नत)**। Gateway को Linux पर रखें, लेकिन आवश्यक CLI बाइनरी को ऐसे SSH रैपर के रूप में रिज़ॉल्व कराएँ जो Mac पर चलते हैं, फिर Skill को Linux की अनुमति देने के लिए ओवरराइड करें ताकि वह योग्य बनी रहे।

    1. बाइनरी के लिए एक SSH रैपर बनाएँ (उदाहरण: Apple Notes के लिए `memo`):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. रैपर को Linux होस्ट पर `PATH` में रखें (उदाहरण के लिए `~/bin/memo`)।
    3. Linux की अनुमति देने के लिए Skill मेटाडेटा (वर्कस्पेस या `~/.openclaw/skills`) ओवरराइड करें:
       ```markdown
       ---
       name: apple-notes
       description: macOS पर memo CLI के माध्यम से Apple Notes प्रबंधित करें।
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Skills स्नैपशॉट रीफ़्रेश करने के लिए नया सेशन शुरू करें।

  </Accordion>

  <Accordion title="क्या Notion या HeyGen का कोई इंटीग्रेशन उपलब्ध है?">
    अभी अंतर्निर्मित नहीं है। विकल्प:

    - **कस्टम Skill / Plugin**: विश्वसनीय API एक्सेस के लिए सर्वोत्तम (दोनों के API हैं)।
    - **ब्राउज़र ऑटोमेशन**: बिना कोड के काम करता है, लेकिन धीमा और अधिक नाज़ुक है।

    एजेंसी-शैली के प्रति-क्लाइंट संदर्भ के लिए: प्रत्येक क्लाइंट के लिए एक Notion पेज रखें (संदर्भ + प्राथमिकताएँ + सक्रिय कार्य) और एजेंट से सेशन की शुरुआत में वह पेज प्राप्त करने को कहें।

    मूल इंटीग्रेशन के लिए, फ़ीचर अनुरोध खोलें या उन API के लिए Skill बनाएँ।

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    मूल इंस्टॉल सक्रिय वर्कस्पेस की `skills/` डायरेक्टरी में पहुँचते हैं; सभी स्थानीय एजेंटों के लिए `--global` का उपयोग करें, या दृश्यता सीमित करने के लिए `agents.defaults.skills` / `agents.list[].skills` कॉन्फ़िगर करें। कुछ Skills Homebrew से इंस्टॉल की गई बाइनरी की अपेक्षा करती हैं; Linux पर इसका अर्थ Linuxbrew है।

    [Skills](/hi/tools/skills), [Skills कॉन्फ़िगरेशन](/hi/tools/skills-config), [ClawHub](/hi/clawhub) देखें।

  </Accordion>

  <Accordion title="मैं OpenClaw के साथ अपने मौजूदा साइन-इन किए हुए Chrome का उपयोग कैसे करूँ?">
    अंतर्निर्मित `user` ब्राउज़र प्रोफ़ाइल का उपयोग करें, जो Chrome DevTools MCP के माध्यम से जुड़ती है:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    कस्टम नाम के लिए, स्पष्ट MCP प्रोफ़ाइल बनाएँ:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    यह स्थानीय होस्ट ब्राउज़र या कनेक्ट किए गए ब्राउज़र Node का उपयोग कर सकता है। यदि Gateway कहीं और चलता है, तो ब्राउज़र मशीन पर Node होस्ट चलाएँ या इसके बजाय रिमोट CDP का उपयोग करें।

    प्रबंधित `openclaw` प्रोफ़ाइल की तुलना में `existing-session` / `user` प्रोफ़ाइल की वर्तमान सीमाएँ:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag`, और `select` को CSS चयनकर्ताओं के बजाय स्नैपशॉट संदर्भ चाहिए।
    - अपलोड हुक के लिए `ref` या `inputRef`, एक बार में एक फ़ाइल आवश्यक है; CSS `element` समर्थित नहीं है।
    - `responsebody`, PDF एक्सपोर्ट, डाउनलोड इंटरसेप्शन और बैच कार्रवाइयों के लिए अब भी प्रबंधित ब्राउज़र पथ आवश्यक है।

    पूरी तुलना के लिए [ब्राउज़र](/hi/tools/browser#existing-session-via-chrome-devtools-mcp) देखें।

  </Accordion>
</AccordionGroup>

## सैंडबॉक्सिंग और मेमोरी

<AccordionGroup>
  <Accordion title="क्या सैंडबॉक्सिंग के लिए कोई समर्पित दस्तावेज़ है?">
    हाँ: [सैंडबॉक्सिंग](/hi/gateway/sandboxing)। Docker-विशिष्ट सेटअप (Docker में पूरा Gateway या सैंडबॉक्स इमेज) के लिए, [Docker](/hi/install/docker) देखें।
  </Accordion>

  <Accordion title="Docker सीमित लगता है—मैं पूर्ण सुविधाएँ कैसे सक्षम करूँ?">
    डिफ़ॉल्ट इमेज सुरक्षा-प्रथम है और `node` उपयोगकर्ता के रूप में चलती है, इसलिए इसमें सिस्टम पैकेज, Homebrew और बंडल किए गए ब्राउज़र शामिल नहीं होते। अधिक पूर्ण सेटअप के लिए:

    - कैश बनाए रखने के लिए `OPENCLAW_HOME_VOLUME` के साथ `/home/node` को स्थायी बनाएँ।
    - `OPENCLAW_IMAGE_APT_PACKAGES` के साथ सिस्टम निर्भरताएँ इमेज में बेक करें।
    - बंडल किए गए CLI के माध्यम से Playwright ब्राउज़र इंस्टॉल करें: `node /app/node_modules/playwright-core/cli.js install chromium`।
    - `PLAYWRIGHT_BROWSERS_PATH` सेट करें और उस पथ को स्थायी बनाएँ।

    दस्तावेज़: [Docker](/hi/install/docker), [ब्राउज़र](/hi/tools/browser)।

  </Accordion>

  <Accordion title="क्या मैं एक एजेंट के साथ DM को निजी, लेकिन समूहों को सार्वजनिक/सैंडबॉक्सयुक्त रख सकता हूँ?">
    हाँ, यदि निजी ट्रैफ़िक **DM** है और सार्वजनिक ट्रैफ़िक **समूह** है। `agents.defaults.sandbox.mode: "non-main"` सेट करें ताकि समूह/चैनल सेशन (गैर-मुख्य कुंजियाँ) कॉन्फ़िगर किए गए सैंडबॉक्स बैकएंड में चलें, जबकि मुख्य DM सेशन होस्ट पर ही रहे। सैंडबॉक्सिंग सक्षम होने के बाद Docker डिफ़ॉल्ट बैकएंड होता है। `tools.sandbox.tools` के माध्यम से सैंडबॉक्स किए गए सेशन में उपलब्ध टूल सीमित करें।

    सेटअप मार्गदर्शिका: [समूह: निजी DM + सार्वजनिक समूह](/hi/channels/groups#pattern-personal-dms-public-groups-single-agent)। मुख्य संदर्भ: [Gateway कॉन्फ़िगरेशन](/hi/gateway/config-agents#agentsdefaultssandbox)।

  </Accordion>

  <Accordion title="मैं किसी होस्ट फ़ोल्डर को सैंडबॉक्स में कैसे बाइंड करूँ?">
    `agents.defaults.sandbox.docker.binds` को `["host:container:mode"]` पर सेट करें (उदाहरण के लिए `"/home/user/src:/src:ro"`)। वैश्विक और प्रति-एजेंट बाइंड मर्ज होते हैं; `scope: "shared"` होने पर प्रति-एजेंट बाइंड अनदेखे किए जाते हैं। संवेदनशील किसी भी चीज़ के लिए `:ro` का उपयोग करें; बाइंड सैंडबॉक्स फ़ाइल सिस्टम की सीमाओं को बायपास करते हैं।

    OpenClaw बाइंड स्रोतों को सामान्यीकृत पथ और सबसे गहरे मौजूदा पूर्वज के माध्यम से रिज़ॉल्व किए गए कैनोनिकल पथ, दोनों के विरुद्ध सत्यापित करता है, इसलिए अंतिम पथ खंड के अभी मौजूद न होने पर भी सिमलिंक-पैरेंट एस्केप सुरक्षित रूप से विफल हो जाते हैं।

    [सैंडबॉक्सिंग](/hi/gateway/sandboxing#custom-bind-mounts) और [सैंडबॉक्स बनाम टूल नीति बनाम उन्नत](/hi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) देखें।

  </Accordion>

  <Accordion title="मेमोरी कैसे काम करती है?">
    OpenClaw मेमोरी एजेंट वर्कस्पेस में Markdown फ़ाइलों के रूप में होती है: दैनिक नोट्स `memory/YYYY-MM-DD.md` में और व्यवस्थित दीर्घकालिक नोट्स `MEMORY.md` में (केवल मुख्य/निजी सेशन)।

    OpenClaw, Compaction द्वारा बातचीत का सारांश बनाने से पहले एक मौन **प्री-Compaction मेमोरी फ़्लश** भी चलाता है, जो मॉडल को पहले स्थायी नोट्स लिखने की याद दिलाता है। यह केवल तभी चलता है जब वर्कस्पेस लिखने योग्य हो (केवल-पढ़ने योग्य सैंडबॉक्स इसे छोड़ देते हैं); `agents.defaults.compaction.memoryFlush.enabled: false` से इसे अक्षम करें। [मेमोरी](/hi/concepts/memory) देखें।

  </Accordion>

  <Accordion title="मेमोरी बातें भूलती रहती है। मैं उन्हें स्थायी कैसे बनाऊँ?">
    बॉट से **तथ्य को मेमोरी में लिखने** के लिए कहें: दीर्घकालिक नोट्स `MEMORY.md` में और अल्पकालिक संदर्भ `memory/YYYY-MM-DD.md` में जाते हैं। मॉडल को मेमोरी संग्रहीत करने की याद दिलाने से आमतौर पर समस्या हल हो जाती है। यदि वह भूलता रहता है, तो सत्यापित करें कि Gateway प्रत्येक रन में उसी वर्कस्पेस का उपयोग करता है।

    दस्तावेज़: [मेमोरी](/hi/concepts/memory), [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)।

  </Accordion>

  <Accordion title="क्या मेमोरी हमेशा बनी रहती है? इसकी सीमाएँ क्या हैं?">
    मेमोरी फ़ाइलें डिस्क पर रहती हैं और हटाए जाने तक बनी रहती हैं; सीमा आपके स्टोरेज की है, मॉडल की नहीं। **सेशन कॉन्टेक्स्ट** अभी भी मॉडल की कॉन्टेक्स्ट विंडो द्वारा सीमित होता है, इसलिए लंबी बातचीत Compaction से गुज़र सकती है या काटी जा सकती है - इसी कारण मेमोरी खोज मौजूद है, जो केवल प्रासंगिक भागों को वापस कॉन्टेक्स्ट में लाती है।

    दस्तावेज़: [मेमोरी](/hi/concepts/memory), [कॉन्टेक्स्ट](/hi/concepts/context)।

  </Accordion>

  <Accordion title="क्या सिमैंटिक मेमोरी खोज के लिए OpenAI API कुंजी आवश्यक है?">
    केवल तब, जब आप **OpenAI एम्बेडिंग्स** का उपयोग करते हैं, जो डिफ़ॉल्ट प्रदाता है। Codex OAuth चैट/कम्प्लीशंस को कवर करता है और एम्बेडिंग्स की पहुँच **नहीं** देता, इसलिए Codex से साइन इन करना (OAuth या Codex CLI लॉगिन) सिमैंटिक मेमोरी खोज को सक्षम नहीं करता। OpenAI एम्बेडिंग्स के लिए फिर भी वास्तविक API कुंजी (`OPENAI_API_KEY` या `models.providers.openai.apiKey`) आवश्यक है।

    स्थानीय बने रहने के लिए, `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp) सेट करें। अन्य समर्थित प्रदाता: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` या `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI-संगत और Voyage। सेटअप विवरण के लिए [मेमोरी](/hi/concepts/memory) और [मेमोरी खोज](/hi/concepts/memory-search) देखें।

  </Accordion>
</AccordionGroup>

## डिस्क पर चीज़ें कहाँ रहती हैं

<AccordionGroup>
  <Accordion title="क्या OpenClaw के साथ उपयोग किया गया सारा डेटा स्थानीय रूप से सहेजा जाता है?">
    नहीं: **OpenClaw की अपनी स्थिति स्थानीय होती है**, लेकिन **बाहरी सेवाएँ फिर भी वह देखती हैं जो आप उन्हें भेजते हैं**।

    - **डिफ़ॉल्ट रूप से स्थानीय**: सेशन, मेमोरी फ़ाइलें, कॉन्फ़िगरेशन और वर्कस्पेस Gateway होस्ट पर रहते हैं (`~/.openclaw` और आपकी वर्कस्पेस डायरेक्टरी)।
    - **आवश्यक रूप से रिमोट**: मॉडल प्रदाताओं (Anthropic/OpenAI/आदि) को भेजे गए संदेश उनके API पर जाते हैं, और चैट प्लेटफ़ॉर्म (Slack/Telegram/WhatsApp/आदि) संदेश डेटा को अपने सर्वरों पर संग्रहीत करते हैं।
    - **फ़ुटप्रिंट आपके नियंत्रण में है**: स्थानीय मॉडल प्रॉम्प्ट को आपकी मशीन पर रखते हैं, लेकिन चैनल ट्रैफ़िक फिर भी चैनल के सर्वरों से होकर जाता है।

    संबंधित: [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace), [मेमोरी](/hi/concepts/memory)।

  </Accordion>

  <Accordion title="OpenClaw अपना डेटा कहाँ संग्रहीत करता है?">
    सब कुछ `$OPENCLAW_STATE_DIR` के अंतर्गत रहता है (डिफ़ॉल्ट: `~/.openclaw`):

    | पथ                                                               | उद्देश्य                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | मुख्य कॉन्फ़िगरेशन (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | लेगेसी OAuth आयात (पहले उपयोग पर प्रमाणीकरण प्रोफ़ाइलों में कॉपी किया जाता है)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | प्रमाणीकरण प्रोफ़ाइलें (OAuth, API कुंजियाँ, वैकल्पिक `keyRef`/`tokenRef`)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef प्रदाताओं के लिए वैकल्पिक फ़ाइल-समर्थित सीक्रेट पेलोड   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | लेगेसी संगतता फ़ाइल (स्थिर `api_key` प्रविष्टियाँ हटाई गईं)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | प्रदाता स्थिति (उदाहरण के लिए `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | प्रति-एजेंट स्थिति (agentDir + लेगेसी/आर्काइव सेशन आर्टिफ़ैक्ट)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | प्रति-एजेंट SQLite स्थिति, जिसमें सेशन पंक्तियाँ और ट्रांसक्रिप्ट शामिल हैं      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | लेगेसी सेशन माइग्रेशन स्रोत और आर्काइव/सहायता आर्टिफ़ैक्ट      |

    लेगेसी एकल-एजेंट पथ `~/.openclaw/agent/*` को `openclaw doctor` द्वारा माइग्रेट किया जाता है।

    आपका **वर्कस्पेस** (AGENTS.md, मेमोरी फ़ाइलें, Skills आदि) अलग है और `agents.defaults.workspace` के माध्यम से कॉन्फ़िगर किया जाता है (डिफ़ॉल्ट: `~/.openclaw/workspace`)।

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md कहाँ होने चाहिए?">
    ये **एजेंट वर्कस्पेस** में रहते हैं, `~/.openclaw` में नहीं।

    - **वर्कस्पेस (प्रति एजेंट)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, वैकल्पिक `HEARTBEAT.md`। लोअरकेस रूट `memory.md` केवल लेगेसी मरम्मत इनपुट है; दोनों के मौजूद होने पर `openclaw doctor --fix` इसे `MEMORY.md` में मर्ज कर सकता है।
    - **स्टेट डायरेक्टरी (`~/.openclaw`)**: कॉन्फ़िगरेशन, चैनल/प्रदाता स्थिति, प्रमाणीकरण प्रोफ़ाइलें, सेशन, लॉग, साझा Skills (`~/.openclaw/skills`)।

    डिफ़ॉल्ट वर्कस्पेस `~/.openclaw/workspace` है, जिसे कॉन्फ़िगर किया जा सकता है:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    यदि रीस्टार्ट के बाद बॉट "भूल जाता है", तो पुष्टि करें कि Gateway हर लॉन्च पर उसी वर्कस्पेस का उपयोग करता है (रिमोट मोड **Gateway होस्ट के** वर्कस्पेस का उपयोग करता है, आपके स्थानीय लैपटॉप का नहीं)।

    सुझाव: स्थायी व्यवहार या प्राथमिकता के लिए, चैट इतिहास पर निर्भर रहने के बजाय बॉट से उसे **AGENTS.md या MEMORY.md में लिखने** के लिए कहें।

    [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace) और [मेमोरी](/hi/concepts/memory) देखें।

  </Accordion>

  <Accordion title="क्या मैं SOUL.md को बड़ा बना सकता हूँ?">
    हाँ। `SOUL.md` एजेंट कॉन्टेक्स्ट में इंजेक्ट की जाने वाली वर्कस्पेस बूटस्ट्रैप फ़ाइलों में से एक है। डिफ़ॉल्ट प्रति-फ़ाइल इंजेक्शन सीमा `20000` वर्ण है; सभी फ़ाइलों का कुल बूटस्ट्रैप बजट `60000` वर्ण है।

    साझा डिफ़ॉल्ट बदलें:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    या `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` के अंतर्गत किसी एक एजेंट के लिए इसे ओवरराइड करें।

    मूल और इंजेक्ट किए गए आकार जाँचने तथा यह जानने के लिए कि सामग्री काटी गई थी या नहीं, `/context` का उपयोग करें। `SOUL.md` को आवाज़, दृष्टिकोण और व्यक्तित्व पर केंद्रित रखें; संचालन नियम `AGENTS.md` में और स्थायी तथ्य मेमोरी में रखें।

    [कॉन्टेक्स्ट](/hi/concepts/context) और [एजेंट कॉन्फ़िगरेशन](/hi/gateway/config-agents) देखें।

  </Accordion>

  <Accordion title="अनुशंसित बैकअप रणनीति">
    अपने **एजेंट वर्कस्पेस** को एक **निजी** git रेपो में रखें और उसका बैकअप किसी निजी स्थान पर लें (उदाहरण के लिए GitHub private)। यह AGENTS/SOUL/USER फ़ाइलों सहित मेमोरी को सुरक्षित करता है और बाद में आपको सहायक का "मन" पुनर्स्थापित करने देता है।

    `~/.openclaw` के अंतर्गत कुछ भी कमिट **न करें** (क्रेडेंशियल, सेशन, टोकन, एन्क्रिप्टेड सीक्रेट पेलोड)। पूर्ण पुनर्स्थापना के लिए, वर्कस्पेस और स्टेट डायरेक्टरी का अलग-अलग बैकअप लें।

    दस्तावेज़: [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)।

  </Accordion>

  <Accordion title="मैं OpenClaw को पूरी तरह अनइंस्टॉल कैसे करूँ?">
    [अनइंस्टॉल](/hi/install/uninstall) देखें।
  </Accordion>

  <Accordion title="क्या एजेंट वर्कस्पेस के बाहर काम कर सकते हैं?">
    हाँ। वर्कस्पेस **डिफ़ॉल्ट cwd** और मेमोरी एंकर है, कोई कठोर सैंडबॉक्स नहीं। सापेक्ष पथ वर्कस्पेस के भीतर रिज़ॉल्व होते हैं; सैंडबॉक्सिंग सक्षम न होने पर निरपेक्ष पथ अन्य होस्ट स्थानों तक पहुँच सकते हैं। पृथक्करण के लिए, [`agents.defaults.sandbox`](/hi/gateway/sandboxing) या प्रति-एजेंट सैंडबॉक्स सेटिंग्स का उपयोग करें। किसी रेपो को डिफ़ॉल्ट कार्यशील डायरेक्टरी बनाने के लिए, उस एजेंट के `workspace` को रेपो रूट पर इंगित करें - OpenClaw रेपो स्वयं केवल स्रोत कोड है, इसलिए वर्कस्पेस को अलग रखें, जब तक कि आप जानबूझकर एजेंट से उसके भीतर काम नहीं कराना चाहते।

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="रिमोट मोड: सेशन स्टोर कहाँ है?">
    सेशन स्थिति का स्वामी **Gateway होस्ट** है। रिमोट मोड में, आपके लिए प्रासंगिक सेशन स्टोर रिमोट मशीन पर होता है, आपके स्थानीय लैपटॉप पर नहीं। [सेशन प्रबंधन](/hi/concepts/session) देखें।
  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन की मूल बातें

<AccordionGroup>
  <Accordion title="कॉन्फ़िगरेशन का प्रारूप क्या है? यह कहाँ है?">
    OpenClaw `$OPENCLAW_CONFIG_PATH` से एक वैकल्पिक **JSON5** कॉन्फ़िगरेशन पढ़ता है (डिफ़ॉल्ट: `~/.openclaw/openclaw.json`)। यदि फ़ाइल मौजूद नहीं है, तो यह अपेक्षाकृत सुरक्षित डिफ़ॉल्ट का उपयोग करता है, जिसमें `~/.openclaw/workspace` का डिफ़ॉल्ट वर्कस्पेस शामिल है।
  </Accordion>

  <Accordion title='मैंने gateway.bind: "lan" (या "tailnet") सेट किया और अब कहीं भी लिसनिंग नहीं हो रही / UI अनधिकृत बता रहा है'>
    नॉन-लूपबैक बाइंड के लिए **एक मान्य Gateway प्रमाणीकरण पथ आवश्यक है**: साझा-सीक्रेट प्रमाणीकरण (टोकन या पासवर्ड), या सही ढंग से कॉन्फ़िगर किए गए पहचान-जागरूक रिवर्स प्रॉक्सी के पीछे `gateway.auth.mode: "trusted-proxy"`।

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    - `gateway.remote.token` / `.password` अपने आप स्थानीय Gateway प्रमाणीकरण सक्षम **नहीं** करते; स्थानीय कॉल पथ `gateway.remote.*` को फ़ॉलबैक के रूप में केवल तब उपयोग कर सकते हैं, जब `gateway.auth.*` सेट न हो।
    - पासवर्ड प्रमाणीकरण के लिए, `gateway.auth.mode: "password"` के साथ `gateway.auth.password` (या `OPENCLAW_GATEWAY_PASSWORD`) सेट करें।
    - यदि `gateway.auth.token` / `.password` को SecretRef के माध्यम से स्पष्ट रूप से कॉन्फ़िगर किया गया है और वह रिज़ॉल्व नहीं होता, तो रिज़ॉल्यूशन बंद स्थिति में विफल होता है (कोई रिमोट फ़ॉलबैक इसे छिपाता नहीं है)।
    - साझा-सीक्रेट Control UI सेटअप `connect.params.auth.token` या `connect.params.auth.password` के माध्यम से प्रमाणीकरण करते हैं (ऐप/UI सेटिंग्स में संग्रहीत)। Tailscale Serve या `trusted-proxy` जैसे पहचान-युक्त मोड इसके बजाय अनुरोध हेडर का उपयोग करते हैं - साझा सीक्रेट को URL में डालने से बचें।
    - `gateway.auth.mode: "trusted-proxy"` के साथ, समान-होस्ट लूपबैक रिवर्स प्रॉक्सी के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` और `gateway.trustedProxies` में एक लूपबैक प्रविष्टि आवश्यक है।

  </Accordion>

  <Accordion title="अब मुझे localhost पर टोकन की आवश्यकता क्यों है?">
    OpenClaw डिफ़ॉल्ट रूप से Gateway प्रमाणीकरण लागू करता है, जिसमें लूपबैक भी शामिल है। यदि कोई स्पष्ट प्रमाणीकरण पथ कॉन्फ़िगर नहीं है, तो स्टार्टअप टोकन मोड चुनता है और उस स्टार्टअप के लिए केवल रनटाइम वाला टोकन जनरेट करता है, इसलिए स्थानीय WS क्लाइंट को प्रमाणीकरण करना आवश्यक है। यह अन्य स्थानीय प्रक्रियाओं को Gateway कॉल करने से रोकता है।

    जब क्लाइंट को रीस्टार्ट के बाद भी स्थिर सीक्रेट चाहिए, तो `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, या `OPENCLAW_GATEWAY_PASSWORD` को स्पष्ट रूप से कॉन्फ़िगर करें। आप पासवर्ड मोड या पहचान-जागरूक रिवर्स प्रॉक्सी के लिए `trusted-proxy` भी चुन सकते हैं। खुले लूपबैक के लिए, `gateway.auth.mode: "none"` स्पष्ट रूप से सेट करें। `openclaw doctor --generate-gateway-token` किसी भी समय टोकन जनरेट करता है।

  </Accordion>

  <Accordion title="क्या कॉन्फ़िगरेशन बदलने के बाद मुझे रीस्टार्ट करना होगा?">
    Gateway कॉन्फ़िगरेशन पर नज़र रखता है और हॉट-रीलोड का समर्थन करता है: `gateway.reload.mode: "hybrid"` (डिफ़ॉल्ट) सुरक्षित परिवर्तनों को तुरंत लागू करता है और महत्वपूर्ण परिवर्तनों के लिए रीस्टार्ट करता है। `hot`, `restart`, और `off` भी समर्थित हैं। अधिकांश `tools.*`, `agents.*` नीति, `session.*`, और `messages.*` परिवर्तन बिना किसी रीलोड कार्रवाई के तुरंत लागू होते हैं; `gateway.*` बाइंडिंग/पोर्ट परिवर्तनों के लिए रीस्टार्ट आवश्यक है।
  </Accordion>

  <Accordion title="मैं मज़ेदार CLI टैगलाइन कैसे अक्षम करूँ?">
    `cli.banner.taglineMode` सेट करें:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: टैगलाइन टेक्स्ट छिपाता है, लेकिन बैनर शीर्षक/संस्करण पंक्ति बनाए रखता है।
    - `default`: हमेशा `All your chats, one OpenClaw.` का उपयोग करता है।
    - `random`: बदलती हुई मज़ेदार/मौसमी टैगलाइन (डिफ़ॉल्ट व्यवहार)।
    - बैनर को पूरी तरह हटाने के लिए, env `OPENCLAW_HIDE_BANNER=1` सेट करें।

  </Accordion>

  <Accordion title="मैं वेब खोज (और वेब फ़ेच) कैसे सक्षम करूँ?">
    `web_fetch` API कुंजी के बिना काम करता है। `web_search` आपके चुने हुए प्रदाता पर निर्भर करता है:

    | प्रदाता | कुंजी-मुक्त | परिवेश चर |
    | --- | --- | --- |
    | Brave | नहीं | `BRAVE_API_KEY` |
    | DuckDuckGo | हाँ (अनौपचारिक HTML-आधारित) | - |
    | Exa | नहीं | `EXA_API_KEY` |
    | Firecrawl | नहीं | `FIRECRAWL_API_KEY` |
    | Gemini | नहीं | `GEMINI_API_KEY` |
    | Grok | नहीं (xAI OAuth या कुंजी) | `XAI_API_KEY` |
    | Kimi | नहीं | `KIMI_API_KEY` या `MOONSHOT_API_KEY` |
    | MiniMax Search | नहीं | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, या `MINIMAX_API_KEY` |
    | Ollama Web Search | हाँ (`ollama signin` आवश्यक है) | - |
    | Perplexity | नहीं | `PERPLEXITY_API_KEY` या `OPENROUTER_API_KEY` |
    | SearXNG | हाँ (स्वयं होस्ट किया गया) | `SEARXNG_BASE_URL` |
    | Tavily | नहीं | `TAVILY_API_KEY` |

    Grok मॉडल प्रमाणीकरण से xAI OAuth का पुनः उपयोग भी कर सकता है (`openclaw onboard --auth-choice xai-oauth`)।

    **अनुशंसित**: `openclaw configure --section web` और एक प्रदाता चुनें।

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
            enabled: true,
            provider: "firecrawl", // वैकल्पिक; स्वतः-पहचान के लिए इसे छोड़ दें
          },
        },
      },
    }
    ```

    प्रदाता-विशिष्ट वेब-खोज कॉन्फ़िगरेशन `plugins.entries.<plugin>.config.webSearch.*` के अंतर्गत रहता है। पुराने `tools.web.search.*` प्रदाता पथ संगतता के लिए अभी भी लोड होते हैं, लेकिन नए कॉन्फ़िगरेशन में उनका उपयोग नहीं किया जाना चाहिए। Firecrawl वेब-फ़ेच फ़ॉलबैक कॉन्फ़िगरेशन `plugins.entries.firecrawl.config.webFetch.*` के अंतर्गत रहता है।

    - अनुमति-सूचियाँ: `web_search`/`web_fetch`/`x_search`, या तीनों के लिए `group:web` जोड़ें।
    - `web_fetch` डिफ़ॉल्ट रूप से सक्षम है।
    - यदि `tools.web.fetch.provider` छोड़ा गया है, तो OpenClaw उपलब्ध क्रेडेंशियल से पहले तैयार फ़ेच फ़ॉलबैक प्रदाता का स्वतः पता लगाता है; आधिकारिक Firecrawl Plugin वह फ़ॉलबैक प्रदान करता है।
    - डेमन `~/.openclaw/.env` (या सेवा परिवेश) से परिवेश चर पढ़ते हैं।

    दस्तावेज़: [वेब टूल](/hi/tools/web)।

  </Accordion>

  <Accordion title="config.apply ने मेरा कॉन्फ़िगरेशन मिटा दिया। मैं इसे कैसे पुनर्प्राप्त करूँ और इससे कैसे बचूँ?">
    `config.apply` **पूरे कॉन्फ़िगरेशन** को प्रतिस्थापित करता है; आंशिक ऑब्जेक्ट बाकी सब कुछ हटा देता है।

    वर्तमान OpenClaw अधिकांश आकस्मिक ओवरराइट से सुरक्षा करता है:

    - OpenClaw के स्वामित्व वाले कॉन्फ़िगरेशन लेखन, लिखने से पहले परिवर्तन के बाद के पूरे कॉन्फ़िगरेशन को सत्यापित करते हैं।
    - OpenClaw के स्वामित्व वाले अमान्य या विनाशकारी लेखन अस्वीकार कर दिए जाते हैं और `openclaw.json.rejected.*` के रूप में सहेजे जाते हैं।
    - स्टार्टअप या हॉट रीलोड को बाधित करने वाला प्रत्यक्ष संपादन Gateway को बंद अवस्था में विफल होने या रीलोड छोड़ने के लिए बाध्य करता है; यह `openclaw.json` को दोबारा नहीं लिखता।
    - मरम्मत का स्वामित्व `openclaw doctor --fix` के पास है, यह अंतिम ज्ञात अच्छे संस्करण को पुनर्स्थापित कर सकता है और अस्वीकृत फ़ाइल को `openclaw.json.clobbered.*` के रूप में सहेजता है।

    पुनर्प्राप्ति:

    - `openclaw logs --follow` में `Invalid config at`, `Config write rejected:`, या `config reload skipped (invalid config)` देखें।
    - सक्रिय कॉन्फ़िगरेशन के पास नवीनतम `openclaw.json.clobbered.*` या `openclaw.json.rejected.*` का निरीक्षण करें।
    - `openclaw config validate` और `openclaw doctor --fix` चलाएँ।
    - `openclaw config set` या `config.patch` के साथ केवल इच्छित कुंजियाँ वापस कॉपी करें।
    - कोई अंतिम ज्ञात अच्छा या अस्वीकृत पेलोड नहीं है: बैकअप से पुनर्स्थापित करें, या `openclaw doctor` दोबारा चलाएँ और चैनल/मॉडल फिर से कॉन्फ़िगर करें।
    - अप्रत्याशित हानि: अपने अंतिम ज्ञात कॉन्फ़िगरेशन या बैकअप के साथ बग दर्ज करें। कोई स्थानीय कोडिंग एजेंट अक्सर लॉग या इतिहास से कार्यशील कॉन्फ़िगरेशन पुनर्निर्मित कर सकता है।

    इससे बचने के लिए: छोटे परिवर्तनों हेतु `openclaw config set`, इंटरैक्टिव संपादन हेतु `openclaw configure`, किसी अपरिचित पथ का निरीक्षण करने हेतु `config.schema.lookup` (यह एक उथला स्कीमा नोड और उसके निकटवर्ती चाइल्ड सारांश लौटाता है), और आंशिक RPC संपादन हेतु `config.patch` का उपयोग करें—`config.apply` को पूर्ण कॉन्फ़िगरेशन प्रतिस्थापन के लिए आरक्षित रखें। एजेंट के लिए उपलब्ध `gateway` रनटाइम टूल, पुराने `tools.bash.*` उपनामों के माध्यम से भी `tools.exec.ask` / `tools.exec.security` को दोबारा लिखने से मना करता है।

    दस्तावेज़: [कॉन्फ़िगरेशन](/hi/cli/config), [कॉन्फ़िगर करना](/hi/cli/configure), [Gateway समस्या निवारण](/hi/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/hi/gateway/doctor)।

  </Accordion>

  <Accordion title="मैं विभिन्न डिवाइसों पर विशिष्ट वर्कर के साथ एक केंद्रीय Gateway कैसे चलाऊँ?">
    सामान्य पैटर्न: **एक Gateway** (उदाहरण के लिए Raspberry Pi) के साथ **Node** और **एजेंट**।

    - **Gateway (केंद्रीय)**: चैनलों (Signal/WhatsApp), रूटिंग और सत्रों का स्वामी होता है।
    - **Node (डिवाइस)**: Mac/iOS/Android पेरिफ़ेरल के रूप में कनेक्ट होते हैं और स्थानीय टूल (`system.run`, `canvas`, `camera`) उपलब्ध कराते हैं।
    - **एजेंट (वर्कर)**: विशेष भूमिकाओं (उदाहरण के लिए संचालन बनाम व्यक्तिगत डेटा) के लिए अलग मस्तिष्क/वर्कस्पेस।
    - **उप-एजेंट**: समानांतरता के लिए मुख्य एजेंट से पृष्ठभूमि कार्य शुरू करते हैं।
    - **TUI**: Gateway से कनेक्ट करें और एजेंट/सत्र बदलें।

    दस्तावेज़: [Node](/hi/nodes), [दूरस्थ पहुँच](/hi/gateway/remote), [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent), [उप-एजेंट](/hi/tools/subagents), [TUI](/hi/web/tui)।

  </Accordion>

  <Accordion title="क्या OpenClaw ब्राउज़र हेडलेस चल सकता है?">
    हाँ:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    डिफ़ॉल्ट `false` (हेडफुल) है। हेडलेस के कारण कुछ साइटों पर एंटी-बॉट जाँच सक्रिय होने की संभावना अधिक होती है (X/Twitter अक्सर हेडलेस सत्रों को ब्लॉक करता है)। यह उसी Chromium इंजन का उपयोग करता है और अधिकांश स्वचालन के लिए काम करता है; मुख्य अंतर यह है कि कोई दृश्यमान ब्राउज़र विंडो नहीं होती (दृश्य सामग्री के लिए स्क्रीनशॉट का उपयोग करें)। [ब्राउज़र](/hi/tools/browser) देखें।

  </Accordion>

  <Accordion title="मैं ब्राउज़र नियंत्रण के लिए Brave का उपयोग कैसे करूँ?">
    `browser.executablePath` को अपने Brave बाइनरी (या किसी भी Chromium-आधारित ब्राउज़र) पर सेट करें और Gateway को पुनः आरंभ करें। [ब्राउज़र](/hi/tools/browser#use-brave-or-another-chromium-based-browser) देखें।
  </Accordion>
</AccordionGroup>

## दूरस्थ Gateway और Node

<AccordionGroup>
  <Accordion title="Telegram, Gateway और Node के बीच कमांड कैसे प्रसारित होते हैं?">
    Telegram संदेशों को **Gateway** संभालता है, जो एजेंट चलाता है और उसके बाद ही, जब किसी Node टूल की आवश्यकता होती है, **Gateway WebSocket** पर Node को कॉल करता है:

    Telegram -> Gateway -> एजेंट -> `node.*` -> Node -> Gateway -> Telegram

    Node इनबाउंड प्रदाता ट्रैफ़िक नहीं देखते; उन्हें केवल Node RPC कॉल प्राप्त होते हैं।

  </Accordion>

  <Accordion title="यदि Gateway दूरस्थ रूप से होस्ट किया गया है, तो मेरा एजेंट मेरे कंप्यूटर तक कैसे पहुँच सकता है?">
    अपने कंप्यूटर को **Node** के रूप में पेयर करें। Gateway कहीं और चलता है, लेकिन Gateway WebSocket पर आपकी स्थानीय मशीन के `node.*` टूल (स्क्रीन, कैमरा, सिस्टम) को कॉल कर सकता है।

    1. Gateway को हमेशा चालू रहने वाले होस्ट (VPS/होम सर्वर) पर चलाएँ।
    2. Gateway होस्ट और अपने कंप्यूटर को एक ही टेलनेट पर रखें।
    3. सुनिश्चित करें कि Gateway WS पहुँच योग्य है (टेलनेट बाइंड या SSH टनल)।
    4. macOS ऐप को स्थानीय रूप से खोलें और **Remote over SSH** मोड (या प्रत्यक्ष टेलनेट) में कनेक्ट करें, ताकि यह Node के रूप में पंजीकृत हो।
    5. Node को अनुमोदित करें:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    किसी अलग TCP ब्रिज की आवश्यकता नहीं है; Node Gateway WebSocket पर कनेक्ट होते हैं।

    सुरक्षा स्मरण: macOS Node को पेयर करने से उस मशीन पर `system.run` की अनुमति मिलती है। केवल विश्वसनीय डिवाइस पेयर करें; [सुरक्षा](/hi/gateway/security) की समीक्षा करें।

    दस्तावेज़: [Node](/hi/nodes), [Gateway प्रोटोकॉल](/hi/gateway/protocol), [macOS दूरस्थ मोड](/hi/platforms/mac/remote), [सुरक्षा](/hi/gateway/security)।

  </Accordion>

  <Accordion title="Tailscale कनेक्ट है, लेकिन मुझे कोई उत्तर नहीं मिलता। अब क्या करूँ?">
    बुनियादी चीज़ों की जाँच करें:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    फिर प्रमाणीकरण और रूटिंग सत्यापित करें: यदि आप Tailscale Serve का उपयोग करते हैं, तो पुष्टि करें कि `gateway.auth.allowTailscale` सही ढंग से सेट है; यदि आप SSH टनल के माध्यम से कनेक्ट करते हैं, तो पुष्टि करें कि टनल चालू है और सही पोर्ट को इंगित करती है; पुष्टि करें कि आपकी DM/समूह अनुमति-सूचियों में आपका खाता शामिल है।

    दस्तावेज़: [Tailscale](/hi/gateway/tailscale), [दूरस्थ पहुँच](/hi/gateway/remote), [चैनल](/hi/channels)।

  </Accordion>

  <Accordion title="क्या दो OpenClaw इंस्टेंस एक-दूसरे से संवाद कर सकते हैं (स्थानीय + VPS)?">
    हाँ, हालाँकि कोई अंतर्निहित बॉट-टू-बॉट ब्रिज नहीं है।

    **सबसे सरल**: किसी सामान्य चैट चैनल का उपयोग करें, जिसे दोनों बॉट एक्सेस कर सकें (Slack/Telegram/WhatsApp)। बॉट A से बॉट B को संदेश भेजवाएँ, फिर बॉट B को सामान्य रूप से उत्तर देने दें।

    **CLI ब्रिज (सामान्य)**: एक स्क्रिप्ट चलाएँ जो `openclaw agent --message ... --deliver` के साथ दूसरे Gateway को कॉल करती है और ऐसी चैट को लक्षित करती है जहाँ दूसरा बॉट सुनता है। यदि कोई बॉट दूरस्थ VPS पर है, तो अपने CLI को SSH/Tailscale के माध्यम से उस दूरस्थ Gateway की ओर इंगित करें ([दूरस्थ पहुँच](/hi/gateway/remote) देखें):

    ```bash
    openclaw agent --message "स्थानीय बॉट की ओर से नमस्ते" --deliver --channel telegram --reply-to <chat-id>
    ```

    एक सुरक्षा-नियम जोड़ें, ताकि दोनों बॉट अंतहीन लूप में न फँसें (केवल उल्लेख, चैनल अनुमति-सूचियाँ, या "बॉट संदेशों का उत्तर न दें" नियम)।

    दस्तावेज़: [दूरस्थ पहुँच](/hi/gateway/remote), [एजेंट CLI](/hi/cli/agent), [एजेंट प्रेषण](/hi/tools/agent-send)।

  </Accordion>

  <Accordion title="क्या मुझे कई एजेंटों के लिए अलग-अलग VPS की आवश्यकता है?">
    नहीं। एक Gateway कई एजेंट होस्ट करता है, जिनमें प्रत्येक का अपना वर्कस्पेस, मॉडल डिफ़ॉल्ट और रूटिंग होती है—यह सामान्य सेटअप है और प्रति एजेंट एक VPS रखने से कहीं सस्ता/सरल है। अलग-अलग VPS का उपयोग केवल कठोर पृथक्करण (सुरक्षा सीमाओं) या बहुत भिन्न ऐसे कॉन्फ़िगरेशन के लिए करें, जिन्हें आप साझा नहीं करना चाहते।
  </Accordion>

  <Accordion title="क्या VPS से SSH का उपयोग करने के बजाय अपने निजी लैपटॉप पर Node का उपयोग करने का कोई लाभ है?">
    हाँ: दूरस्थ Gateway से आपके लैपटॉप तक पहुँचने का प्रथम-श्रेणी तरीका Node हैं और ये केवल शेल पहुँच से अधिक क्षमताएँ उपलब्ध कराते हैं। Gateway macOS/Linux (WSL2 के माध्यम से Windows) पर चलता है और हल्का है (एक छोटा VPS या Raspberry Pi-श्रेणी का बॉक्स पर्याप्त है; 4 GB RAM भरपूर है), इसलिए एक सामान्य सेटअप में हमेशा चालू रहने वाला होस्ट और Node के रूप में आपका लैपटॉप शामिल होता है।

    - **इनबाउंड SSH आवश्यक नहीं**—Node डिवाइस पेयरिंग के माध्यम से Gateway WebSocket से आउटबाउंड कनेक्ट होते हैं।
    - **अधिक सुरक्षित निष्पादन नियंत्रण**—`system.run` उस लैपटॉप पर Node अनुमति-सूचियों/अनुमोदनों द्वारा नियंत्रित है।
    - **अधिक डिवाइस टूल**—Node, `system.run` के अतिरिक्त `canvas`, `camera`, और `screen` उपलब्ध कराते हैं।
    - **स्थानीय ब्राउज़र स्वचालन**—Gateway को VPS पर रखें, लेकिन Node होस्ट के माध्यम से Chrome को स्थानीय रूप से चलाएँ, या Chrome MCP के माध्यम से स्थानीय Chrome से जुड़ें।

    तदर्थ शेल पहुँच के लिए SSH ठीक है; निरंतर एजेंट वर्कफ़्लो और डिवाइस स्वचालन के लिए Node अधिक सरल हैं।

    दस्तावेज़: [Node](/hi/nodes), [Node CLI](/hi/cli/nodes), [ब्राउज़र](/hi/tools/browser)।

  </Accordion>

  <Accordion title="क्या Node कोई Gateway सेवा चलाते हैं?">
    नहीं। जब तक आप जानबूझकर पृथक प्रोफ़ाइल नहीं चलाते, तब तक प्रति होस्ट केवल **एक Gateway** चलना चाहिए ([एकाधिक Gateway](/hi/gateway/multiple-gateways) देखें)। Node वे पेरिफ़ेरल हैं जो Gateway से कनेक्ट होते हैं (iOS/Android Node, या मेनूबार ऐप में macOS "node mode")। हेडलेस Node होस्ट और CLI नियंत्रण के लिए [Node होस्ट CLI](/hi/cli/node) देखें।

    `gateway`, `discovery`, और होस्ट किए गए Plugin सरफ़ेस परिवर्तनों के लिए पूर्ण पुनरारंभ आवश्यक है।

  </Accordion>

  <Accordion title="क्या कॉन्फ़िगरेशन लागू करने का कोई API / RPC तरीका है?">
    हाँ:

    - `config.schema.lookup`: लिखने से पहले किसी एक कॉन्फ़िगरेशन उप-वृक्ष का उसके उथले स्कीमा नोड, मेल खाने वाले UI संकेत और निकटतम चाइल्ड सारांशों सहित निरीक्षण करें।
    - `config.get`: वर्तमान स्नैपशॉट और हैश प्राप्त करें।
    - `config.patch`: सुरक्षित आंशिक अपडेट (अधिकांश RPC संपादनों के लिए पसंदीदा); जहाँ संभव हो हॉट-रीलोड करता है और आवश्यकता होने पर पुनः आरंभ करता है।
    - `config.apply`: पूर्ण कॉन्फ़िगरेशन को सत्यापित करके बदलें; जहाँ संभव हो हॉट-रीलोड करता है और आवश्यकता होने पर पुनः आरंभ करता है।
    - एजेंट के लिए उपलब्ध `gateway` रनटाइम टूल अब भी `tools.exec.ask` / `tools.exec.security` को फिर से लिखने से मना करता है; पुराने `tools.bash.*` उपनाम उन्हीं संरक्षित पथों में सामान्यीकृत होते हैं।

  </Accordion>

  <Accordion title="पहले इंस्टॉल के लिए न्यूनतम समझदारीपूर्ण कॉन्फ़िगरेशन">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    आपका कार्यस्थान सेट करता है और यह सीमित करता है कि बॉट को कौन ट्रिगर कर सकता है।

  </Accordion>

  <Accordion title="मैं VPS पर Tailscale कैसे सेट अप करूँ और अपने Mac से कैसे कनेक्ट करूँ?">
    1. **VPS पर इंस्टॉल करें और लॉग इन करें**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. समान tailnet का उपयोग करके Tailscale ऐप से **अपने Mac पर इंस्टॉल करें और लॉग इन करें**।
    3. Tailscale एडमिन कंसोल में **MagicDNS सक्षम करें**, ताकि VPS का नाम स्थिर रहे।
    4. **tailnet होस्टनेम का उपयोग करें**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; Gateway WS `ws://your-vps.tailnet-xxxx.ts.net:18789`।

    SSH के बिना Control UI के लिए, VPS पर Tailscale Serve का उपयोग करें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    इससे Gateway लूपबैक से बंधा रहता है और Tailscale के माध्यम से HTTPS उपलब्ध होता है। [Tailscale](/hi/gateway/tailscale) देखें।

  </Accordion>

  <Accordion title="मैं Mac Node को रिमोट Gateway (Tailscale Serve) से कैसे कनेक्ट करूँ?">
    Serve **Gateway Control UI + WS** उपलब्ध कराता है; Node उसी Gateway WS एंडपॉइंट से कनेक्ट होते हैं।

    1. सुनिश्चित करें कि VPS और Mac एक ही tailnet पर हैं।
    2. macOS ऐप को Remote मोड में उपयोग करें (SSH लक्ष्य tailnet होस्टनेम हो सकता है) - यह Gateway पोर्ट की टनल बनाता है और Node के रूप में कनेक्ट होता है।
    3. Node को स्वीकृत करें:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    दस्तावेज़: [Gateway प्रोटोकॉल](/hi/gateway/protocol), [डिस्कवरी](/hi/gateway/discovery), [macOS रिमोट मोड](/hi/platforms/mac/remote)।

  </Accordion>

  <Accordion title="क्या मुझे दूसरे लैपटॉप पर इंस्टॉल करना चाहिए या केवल एक Node जोड़ना चाहिए?">
    दूसरे लैपटॉप पर केवल **स्थानीय टूल** (स्क्रीन/कैमरा/exec) के लिए, उसे **Node** के रूप में जोड़ें - एक Gateway, कोई डुप्लिकेट कॉन्फ़िगरेशन नहीं। स्थानीय Node टूल अभी केवल macOS पर उपलब्ध हैं। दूसरा Gateway केवल **कड़े पृथक्करण** या पूरी तरह अलग दो बॉट के लिए इंस्टॉल करें।

    दस्तावेज़: [Node](/hi/nodes), [Node CLI](/hi/cli/nodes), [एकाधिक Gateway](/hi/gateway/multiple-gateways)।

  </Accordion>
</AccordionGroup>

## पर्यावरण चर और .env लोडिंग

<AccordionGroup>
  <Accordion title="OpenClaw पर्यावरण चर कैसे लोड करता है?">
    OpenClaw पैरेंट प्रक्रिया (shell, launchd/systemd, CI आदि) से पर्यावरण चर पढ़ता है और इसके अतिरिक्त इन्हें लोड करता है:

    - वर्तमान कार्यशील डायरेक्टरी से `.env`।
    - `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`) से वैश्विक फ़ॉलबैक `.env`।

    कोई भी `.env` फ़ाइल मौजूदा पर्यावरण चरों को ओवरराइड नहीं करती। कार्यस्थान `.env` के लिए प्रदाता क्रेडेंशियल और एंडपॉइंट-रूटिंग कुंजियाँ इसका अपवाद हैं: `GEMINI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY` जैसी कुंजियाँ या `_ENDPOINT` पर समाप्त होने वाली कोई भी कुंजी (और अन्य बंडल किए गए प्रदाताओं के प्रमाणीकरण या एंडपॉइंट पर्यावरण चर) कार्यस्थान `.env` से अनदेखी की जाती हैं और उन्हें प्रक्रिया के पर्यावरण, `~/.openclaw/.env` या कॉन्फ़िगरेशन `env` में रखना चाहिए।

    कॉन्फ़िगरेशन में इनलाइन पर्यावरण चर केवल तभी लागू होते हैं, जब वे प्रक्रिया के पर्यावरण में मौजूद न हों:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    पूर्ण प्राथमिकता क्रम और स्रोतों के लिए [/environment](/hi/help/environment) देखें।

  </Accordion>

  <Accordion title="मैंने सेवा के माध्यम से Gateway शुरू किया और मेरे पर्यावरण चर गायब हो गए। अब क्या करूँ?">
    दो समाधान हैं:

    1. गायब कुंजियाँ `~/.openclaw/.env` में रखें, ताकि सेवा को आपके shell का पर्यावरण विरासत में न मिलने पर भी वे लोड हों।
    2. shell आयात सक्षम करें (वैकल्पिक सुविधा):
       ```json5
       {
         env: {
           shellEnv: {
             enabled: true,
             timeoutMs: 15000,
           },
         },
       }
       ```
       यह आपका लॉगिन shell चलाता है और केवल गायब अपेक्षित कुंजियाँ आयात करता है (कभी ओवरराइड नहीं करता)। समकक्ष पर्यावरण चर: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`।

  </Accordion>

  <Accordion title='मैंने COPILOT_GITHUB_TOKEN सेट किया है, लेकिन मॉडल स्थिति में "Shell env: off." क्यों दिखाई देता है?'>
    `openclaw models status` बताता है कि **shell पर्यावरण आयात** सक्षम है या नहीं। "Shell env: off" का अर्थ यह **नहीं** है कि आपके पर्यावरण चर गायब हैं - इसका केवल यह अर्थ है कि OpenClaw आपके लॉगिन shell को स्वचालित रूप से लोड नहीं करेगा।

    यदि Gateway किसी सेवा (launchd/systemd) के रूप में चलता है, तो उसे आपके shell का पर्यावरण विरासत में नहीं मिलेगा। इसे ठीक करने के लिए टोकन को `~/.openclaw/.env` में रखें, `env.shellEnv.enabled: true` सक्षम करें या उसे कॉन्फ़िगरेशन `env` में जोड़ें (केवल गायब होने पर लागू होता है), फिर Gateway को पुनः आरंभ करके दोबारा जाँचें:

    ```bash
    openclaw models status
    ```

    Copilot टोकन इस क्रम में रिज़ॉल्व होते हैं: `OPENCLAW_GITHUB_TOKEN`, फिर `COPILOT_GITHUB_TOKEN`, फिर `GH_TOKEN`, फिर `GITHUB_TOKEN`।

    [/concepts/model-providers](/hi/concepts/model-providers) और [/environment](/hi/help/environment) देखें।

  </Accordion>
</AccordionGroup>

## सत्र और एकाधिक चैट

<AccordionGroup>
  <Accordion title="मैं नई बातचीत कैसे शुरू करूँ?">
    `/new` या `/reset` को अलग संदेश के रूप में भेजें। [सत्र प्रबंधन](/hi/concepts/session) देखें।
  </Accordion>

  <Accordion title="यदि मैं कभी /new न भेजूँ, तो क्या सत्र अपने आप रीसेट होते हैं?">
    हाँ। डिफ़ॉल्ट रीसेट नीति **दैनिक** है: वर्तमान सत्र कब शुरू हुआ था, इसके आधार पर Gateway होस्ट पर कॉन्फ़िगर किए गए स्थानीय घंटे (`session.reset.atHour`, डिफ़ॉल्ट `4`, 0-23) पर सत्र बदल जाता है। इसके बजाय `mode: "idle"` और `session.reset.idleMinutes` के साथ निष्क्रियता-आधारित रीसेट अपनाएँ, जो निष्क्रियता की अवधि के बाद सत्र समाप्त करता है (अंतिम वास्तविक इंटरैक्शन के आधार पर, Heartbeat/Cron/exec सिस्टम इवेंट के आधार पर नहीं)।

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType`, `direct` (पुराना उपनाम `dm`), `group` और `thread` का समर्थन करता है। यदि कोई `session.reset`/`resetByType` ब्लॉक सेट नहीं है, तो पुराना शीर्ष-स्तरीय `session.idleMinutes` अब भी निष्क्रियता-मोड डिफ़ॉल्ट के संगतता उपनाम के रूप में काम करता है। सक्रिय प्रदाता-स्वामित्व वाले CLI सत्र वाले सत्रों को अंतर्निहित दैनिक डिफ़ॉल्ट समाप्त नहीं करता। पूर्ण जीवनचक्र के लिए [सत्र प्रबंधन](/hi/concepts/session) देखें।

  </Accordion>

  <Accordion title="क्या OpenClaw इंस्टेंस की टीम बनाने का कोई तरीका है (एक CEO और कई एजेंट)?">
    हाँ, **बहु-एजेंट रूटिंग** और **उप-एजेंट** के माध्यम से: एक समन्वयक एजेंट और अपने कार्यस्थानों तथा मॉडलों वाले कई वर्कर एजेंट।

    इसे एक मनोरंजक प्रयोग के रूप में देखना बेहतर है - इसमें बहुत अधिक टोकन लगते हैं और यह अक्सर अलग-अलग सत्रों वाले एक बॉट की तुलना में कम कुशल होता है। सामान्य मॉडल एक ऐसा बॉट है जिससे आप बात करते हैं, समानांतर कार्य के लिए अलग-अलग सत्र होते हैं और आवश्यकता पड़ने पर उप-एजेंट बनाए जाते हैं।

    दस्तावेज़: [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent), [उप-एजेंट](/hi/tools/subagents), [एजेंट CLI](/hi/cli/agents)।

  </Accordion>

  <Accordion title="कार्य के बीच में संदर्भ क्यों काट दिया गया? मैं इसे कैसे रोकूँ?">
    सत्र संदर्भ मॉडल विंडो से सीमित होता है। लंबी चैट, बड़े टूल आउटपुट या बहुत-सी फ़ाइलें Compaction या काटे जाने का कारण बन सकती हैं।

    - बॉट से वर्तमान स्थिति का सारांश बनाने और उसे किसी फ़ाइल में लिखने को कहें।
    - लंबे कार्यों से पहले `/compact` और विषय बदलते समय `/new` का उपयोग करें।
    - महत्वपूर्ण संदर्भ कार्यस्थान में रखें और बॉट से उसे दोबारा पढ़ने को कहें।
    - लंबे या समानांतर कार्य के लिए उप-एजेंट का उपयोग करें, ताकि मुख्य चैट छोटी रहे।
    - यदि ऐसा अक्सर होता है, तो बड़ी संदर्भ विंडो वाला मॉडल चुनें।

  </Accordion>

  <Accordion title="मैं OpenClaw को इंस्टॉल रखते हुए पूरी तरह रीसेट कैसे करूँ?">
    ```bash
    openclaw reset
    ```

    गैर-इंटरैक्टिव पूर्ण रीसेट:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    फिर सेटअप दोबारा चलाएँ:

    ```bash
    openclaw onboard --install-daemon
    ```

    मौजूदा कॉन्फ़िगरेशन मिलने पर ऑनबोर्डिंग **रीसेट** का विकल्प भी देती है; [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें। यदि आपने प्रोफ़ाइल (`--profile` / `OPENCLAW_PROFILE`) का उपयोग किया है, तो प्रत्येक स्टेट डायरेक्टरी रीसेट करें (डिफ़ॉल्ट `~/.openclaw-<profile>`)। केवल विकास के लिए रीसेट: `openclaw gateway --dev --reset` विकास कॉन्फ़िगरेशन, क्रेडेंशियल, सत्र और कार्यस्थान मिटा देता है।

  </Accordion>

  <Accordion title='मुझे "context too large" त्रुटियाँ मिल रही हैं - मैं रीसेट या Compaction कैसे करूँ?'>
    - **Compaction** (बातचीत बनाए रखता है, पुराने टर्न का सारांश बनाता है): सारांश का मार्गदर्शन करने के लिए `/compact` या `/compact <instructions>`।
    - **रीसेट** (उसी चैट कुंजी के लिए नया सत्र ID): `/new` या `/reset`।

    यदि ऐसा बार-बार होता है, तो पुराने टूल आउटपुट को छोटा करने के लिए **सत्र प्रूनिंग** (`agents.defaults.contextPruning`) समायोजित करें या बड़ी संदर्भ विंडो वाला मॉडल उपयोग करें।

    दस्तावेज़: [Compaction](/hi/concepts/compaction), [सत्र प्रूनिंग](/hi/concepts/session-pruning), [सत्र प्रबंधन](/hi/concepts/session)।

  </Accordion>

  <Accordion title='मुझे "LLM request rejected: messages.content.tool_use.input field required" क्यों दिखाई दे रहा है?'>
    प्रदाता सत्यापन त्रुटि: मॉडल ने आवश्यक `input` के बिना एक `tool_use` ब्लॉक उत्सर्जित किया। सामान्यतः इसका अर्थ है कि सत्र इतिहास पुराना या दूषित है (अक्सर लंबे थ्रेड या टूल/स्कीमा परिवर्तन के बाद)।

    समाधान: `/new` (अलग संदेश) के साथ नया सत्र शुरू करें।

  </Accordion>

  <Accordion title="मुझे प्रत्येक 30 मिनट में Heartbeat संदेश क्यों मिल रहे हैं?">
    Heartbeat डिफ़ॉल्ट रूप से प्रत्येक **30m** पर चलते हैं, या जब रिज़ॉल्व किया गया प्रमाणीकरण मोड Anthropic OAuth/token प्रमाणीकरण हो (Claude CLI के पुनः उपयोग सहित) और `heartbeat.every` सेट न हो, तब प्रत्येक **1h** पर। समायोजित या अक्षम करें:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // या अक्षम करने के लिए "0m"
          },
        },
      },
    }
    ```

    यदि `HEARTBEAT.md` मौजूद है, लेकिन प्रभावी रूप से खाली है (केवल रिक्त पंक्तियाँ, Markdown/HTML टिप्पणियाँ, ATX शीर्षक, फ़ेंस मार्कर या खाली सूची-आइटम स्टब), तो OpenClaw API कॉल बचाने के लिए Heartbeat रन छोड़ देता है। यदि फ़ाइल मौजूद नहीं है, तो Heartbeat फिर भी चलता है और मॉडल तय करता है कि क्या करना है।

    प्रति-एजेंट ओवरराइड `agents.list[].heartbeat` का उपयोग करते हैं। दस्तावेज़: [Heartbeat](/hi/gateway/heartbeat)।

  </Accordion>

  <Accordion title='क्या मुझे WhatsApp समूह में एक "बॉट अकाउंट" जोड़ना होगा?'>
    नहीं। OpenClaw **आपके अपने अकाउंट** पर चलता है - यदि आप समूह में हैं, तो OpenClaw उसे देख सकता है। डिफ़ॉल्ट रूप से, जब तक आप प्रेषकों को अनुमति नहीं देते (`groupPolicy: "allowlist"`), समूह में उत्तर अवरुद्ध रहते हैं।

    समूह में उत्तर केवल अपने लिए सीमित करने हेतु:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="मैं WhatsApp समूह का JID कैसे प्राप्त करूँ?">
    सबसे तेज़ तरीका: लॉग का लगातार आउटपुट देखें और समूह में एक परीक्षण संदेश भेजें।

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` पर समाप्त होने वाला `chatId` (या `from`) खोजें, जैसे `1234567890-1234567890@g.us`।

    यदि पहले से कॉन्फ़िगर/अनुमति-सूचीबद्ध है, तो कॉन्फ़िगरेशन से समूहों की सूची देखें:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    दस्तावेज़: [WhatsApp](/hi/channels/whatsapp), [डायरेक्टरी](/hi/cli/directory), [लॉग](/hi/cli/logs)।

  </Accordion>

  <Accordion title="OpenClaw किसी समूह में उत्तर क्यों नहीं देता?">
    दो सामान्य कारण हैं: उल्लेख गेटिंग डिफ़ॉल्ट रूप से चालू है (आपको बॉट को @mention करना होगा, या `mentionPatterns` से मिलान करना होगा), या आपने `"*"` के बिना `channels.whatsapp.groups` कॉन्फ़िगर किया है और समूह अनुमति-सूची में नहीं है।

    [समूह](/hi/channels/groups) और [समूह संदेश](/hi/channels/group-messages) देखें।

  </Accordion>

  <Accordion title="क्या समूह/थ्रेड DM के साथ संदर्भ साझा करते हैं?">
    प्रत्यक्ष चैट डिफ़ॉल्ट रूप से मुख्य सत्र में समाहित हो जाती हैं। समूहों/चैनलों की अपनी सत्र कुंजियाँ होती हैं, और Telegram विषय / Discord थ्रेड अलग सत्र होते हैं। [समूह](/hi/channels/groups) और [समूह संदेश](/hi/channels/group-messages) देखें।
  </Accordion>

  <Accordion title="मैं कितने कार्यस्थान और एजेंट बना सकता हूँ?">
    कोई कठोर सीमा नहीं है—दर्जनों या सैकड़ों भी ठीक हैं, लेकिन इन पर ध्यान दें:

    - **डिस्क की बढ़ोतरी**: सक्रिय सत्र और ट्रांसक्रिप्ट प्रत्येक एजेंट के SQLite डेटाबेस में रहते हैं; पुराने/संग्रहित आर्टिफ़ैक्ट अब भी `~/.openclaw/agents/<agentId>/sessions/` के अंतर्गत जमा हो सकते हैं।
    - **टोकन लागत**: अधिक एजेंट का अर्थ है मॉडल का अधिक समवर्ती उपयोग।
    - **संचालन संबंधी अतिरिक्त भार**: प्रत्येक एजेंट के प्रमाणीकरण प्रोफ़ाइल, कार्यस्थान और चैनल रूटिंग।

    प्रत्येक एजेंट के लिए एक **सक्रिय** कार्यस्थान (`agents.defaults.workspace`) रखें, डिस्क बढ़ने पर पुराने सत्रों को `openclaw sessions cleanup` से हटाएँ (सक्रिय SQLite स्थिति को हाथ से संपादित न करें), और अनावश्यक कार्यस्थानों तथा प्रोफ़ाइल विसंगतियों का पता लगाने के लिए `openclaw doctor` का उपयोग करें।

  </Accordion>

  <Accordion title="क्या मैं एक ही समय में कई बॉट या चैट चला सकता हूँ (Slack), और मुझे इसे कैसे सेट अप करना चाहिए?">
    हाँ, **मल्टी-एजेंट रूटिंग** के माध्यम से: कई पृथक एजेंट चलाएँ और आने वाले संदेशों को चैनल/खाता/पीयर के आधार पर रूट करें। Slack एक चैनल के रूप में समर्थित है और इसे विशिष्ट एजेंटों से जोड़ा जा सकता है।

    ब्राउज़र एक्सेस शक्तिशाली है, लेकिन यह "वह सब कुछ करना जो कोई इंसान कर सकता है" नहीं है—एंटी-बॉट उपाय, CAPTCHA और MFA अब भी स्वचालन को रोक सकते हैं। सबसे विश्वसनीय नियंत्रण के लिए होस्ट पर स्थानीय Chrome MCP या वास्तव में ब्राउज़र चलाने वाली मशीन पर CDP का उपयोग करें।

    सर्वोत्तम-प्रथा वाला सेटअप: हमेशा चालू रहने वाला Gateway होस्ट (VPS/Mac mini), प्रत्येक भूमिका के लिए एक एजेंट (बाइंडिंग), उन एजेंटों से जुड़े Slack चैनल, और आवश्यकता होने पर Chrome MCP या किसी Node के माध्यम से स्थानीय ब्राउज़र।

    दस्तावेज़: [मल्टी-एजेंट रूटिंग](/hi/concepts/multi-agent), [Slack](/hi/channels/slack), [ब्राउज़र](/hi/tools/browser), [Nodes](/hi/nodes)।

  </Accordion>
</AccordionGroup>

## मॉडल, फ़ेलओवर और प्रमाणीकरण प्रोफ़ाइल

मॉडल संबंधी प्रश्नोत्तर—डिफ़ॉल्ट, चयन, उपनाम, स्विचिंग, फ़ेलओवर और प्रमाणीकरण प्रोफ़ाइल—[मॉडल FAQ](/hi/help/faq-models) में उपलब्ध हैं।

## Gateway: पोर्ट, "पहले से चल रहा है" और रिमोट मोड

<AccordionGroup>
  <Accordion title="Gateway किस पोर्ट का उपयोग करता है?">
    `gateway.port` WebSocket + HTTP (Control UI, हुक आदि) के लिए एकल मल्टीप्लेक्स पोर्ट को नियंत्रित करता है। प्राथमिकता क्रम:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > डिफ़ॉल्ट 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status में "Runtime: running" लेकिन "Connectivity probe: failed" क्यों दिखाई देता है?'>
    "Running" **सुपरवाइज़र का** दृष्टिकोण है (launchd/systemd/schtasks); कनेक्टिविटी जाँच में CLI वास्तव में Gateway WebSocket से कनेक्ट होता है। `openclaw gateway status` की इन पंक्तियों पर भरोसा करें: `Probe target:` (जाँच द्वारा उपयोग किया गया URL), `Listening:` (पोर्ट पर वास्तव में क्या बाइंड है), `Last gateway error:` (जब प्रक्रिया जीवित हो लेकिन पोर्ट सुन न रहा हो, तब सामान्य मूल कारण)।
  </Accordion>

  <Accordion title='openclaw gateway status में "Config (cli)" और "Config (service)" अलग-अलग क्यों दिखाई देते हैं?'>
    आप एक कॉन्फ़िगरेशन फ़ाइल संपादित कर रहे हैं, जबकि सेवा दूसरी फ़ाइल से चल रही है (अक्सर `--profile` / `OPENCLAW_STATE_DIR` की विसंगति)।

    इसे ठीक करने के लिए, उसी `--profile` / परिवेश से चलाएँ जिसका उपयोग आप सेवा से करवाना चाहते हैं:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='"another gateway instance is already listening" का क्या अर्थ है?'>
    OpenClaw स्टार्टअप पर तुरंत WebSocket लिसनर को बाइंड करके रनटाइम लॉक लागू करता है (डिफ़ॉल्ट `ws://127.0.0.1:18789`)। यदि बाइंड `EADDRINUSE` के साथ विफल होता है, तो यह `GatewayLockError` ("another gateway instance is already listening") त्रुटि देता है।

    समाधान: दूसरे इंस्टेंस को रोकें, पोर्ट खाली करें, या `openclaw gateway --port <port>` के साथ चलाएँ।

  </Accordion>

  <Accordion title="मैं OpenClaw को रिमोट मोड में कैसे चलाऊँ (क्लाइंट किसी अन्य स्थान के Gateway से कनेक्ट होता है)?">
    `gateway.mode: "remote"` सेट करें और किसी रिमोट WebSocket URL की ओर इंगित करें, वैकल्पिक रूप से साझा-सीक्रेट रिमोट क्रेडेंशियल के साथ:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    - `openclaw gateway` केवल तभी शुरू होता है जब `gateway.mode`, `local` हो (या आप कोई ओवरराइड फ़्लैग दें)।
    - macOS ऐप कॉन्फ़िगरेशन फ़ाइल पर नज़र रखता है और इन मानों के बदलने पर तुरंत मोड बदल देता है।
    - `gateway.remote.token` / `.password` केवल क्लाइंट-साइड रिमोट क्रेडेंशियल हैं; वे स्वयं स्थानीय Gateway प्रमाणीकरण सक्षम नहीं करते।

  </Accordion>

  <Accordion title='Control UI में "unauthorized" दिखाई देता है (या वह बार-बार पुनः कनेक्ट होता है)। अब क्या करें?'>
    आपके Gateway का प्रमाणीकरण पथ और UI की प्रमाणीकरण विधि मेल नहीं खाते।

    तथ्य (कोड से):

    - Control UI टोकन को `sessionStorage` में रखता है, जिसकी सीमा वर्तमान ब्राउज़र टैब और चयनित Gateway URL तक होती है, इसलिए उसी टैब में रीफ़्रेश लंबे समय तक localStorage में टोकन बनाए रखे बिना काम करते रहते हैं।
    - `AUTH_TOKEN_MISMATCH` पर, जब Gateway पुनः प्रयास के संकेत (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) देता है, तो विश्वसनीय क्लाइंट कैश किए गए डिवाइस टोकन के साथ एक सीमित पुनः प्रयास कर सकते हैं।
    - कैश किए गए टोकन वाला वह पुनः प्रयास डिवाइस टोकन के साथ संग्रहीत कैश किए गए स्वीकृत स्कोप का पुनः उपयोग करता है; स्पष्ट `deviceToken` / स्पष्ट `scopes` कॉलर कैश किए गए स्कोप प्राप्त करने के बजाय अपने अनुरोधित स्कोप समूह को बनाए रखते हैं।
    - उस पुनः प्रयास पथ के बाहर, कनेक्शन प्रमाणीकरण की प्राथमिकता पहले स्पष्ट साझा टोकन/पासवर्ड, फिर स्पष्ट `deviceToken`, फिर संग्रहीत डिवाइस टोकन और अंत में बूटस्ट्रैप टोकन है।
    - अंतर्निहित सेटअप-कोड बूटस्ट्रैप `scopes: []` वाला Node डिवाइस टोकन और विश्वसनीय मोबाइल ऑनबोर्डिंग के लिए सीमित ऑपरेटर हैंडऑफ़ टोकन लौटाता है। ऑपरेटर हैंडऑफ़ सेटअप के समय का नेटिव कॉन्फ़िगरेशन पढ़ सकता है, लेकिन पेयरिंग परिवर्तन स्कोप या `operator.admin` प्रदान नहीं करता।

    समाधान:

    - सबसे तेज़: `openclaw dashboard` (डैशबोर्ड URL प्रिंट और कॉपी करता है, उसे खोलने का प्रयास करता है; हेडलेस होने पर SSH संकेत दिखाता है)।
    - अभी तक कोई टोकन नहीं: `openclaw doctor --generate-gateway-token`।
    - रिमोट: पहले `ssh -N -L 18789:127.0.0.1:18789 user@host` से टनल बनाएँ, फिर `http://127.0.0.1:18789/` खोलें।
    - साझा-सीक्रेट मोड: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` सेट करें, फिर Control UI सेटिंग में मेल खाता सीक्रेट पेस्ट करें।
    - Tailscale Serve मोड: पुष्टि करें कि `gateway.auth.allowTailscale` सक्षम है और आप Serve URL खोल रहे हैं, ऐसा रॉ लूपबैक/टेलनेट URL नहीं जो Tailscale पहचान हेडर को बायपास करता हो।
    - विश्वसनीय-प्रॉक्सी मोड: पुष्टि करें कि आप कॉन्फ़िगर किए गए पहचान-जागरूक प्रॉक्सी के माध्यम से आ रहे हैं। समान-होस्ट लूपबैक प्रॉक्सी को भी `gateway.auth.trustedProxy.allowLoopback = true` की आवश्यकता होती है।
    - एक पुनः प्रयास के बाद भी विसंगति बनी रहती है: पेयर किए गए डिवाइस टोकन को रोटेट/पुनः स्वीकृत करें:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - रोटेशन अस्वीकृत: पेयर-डिवाइस सत्र केवल अपने **स्वयं के** डिवाइस को रोटेट कर सकते हैं, जब तक उनके पास `operator.admin` भी न हो, और स्पष्ट `--scope` मान कॉलर के वर्तमान ऑपरेटर स्कोप से अधिक नहीं हो सकते।
    - अब भी समस्या बनी हुई है: `openclaw status --all` और [समस्या निवारण](/hi/gateway/troubleshooting) देखें। प्रमाणीकरण विवरण के लिए [डैशबोर्ड](/hi/web/dashboard) देखें।

  </Accordion>

  <Accordion title="मैंने gateway.bind tailnet सेट किया है, लेकिन वह केवल लूपबैक पर सुनता है">
    `tailnet` बाइंड आपके नेटवर्क इंटरफ़ेस (100.64.0.0/10) से एक Tailscale IP चुनता है। यदि मशीन Tailscale पर नहीं है (या इंटरफ़ेस बंद है), तो Gateway किसी अन्य नेटवर्क इंटरफ़ेस को उजागर करने के बजाय वापस लूपबैक का उपयोग करता है।

    समाधान: उस होस्ट पर Tailscale शुरू करें और Gateway पुनः आरंभ करें, या स्पष्ट रूप से `gateway.bind: "loopback"` / `"lan"` पर स्विच करें।

    `tailnet` स्पष्ट है; `auto` लूपबैक को प्राथमिकता देता है। आवश्यक समान-होस्ट `127.0.0.1` लिसनर बनाए रखते हुए गैर-लूपबैक एक्सपोज़र को Tailnet तक सीमित करने के लिए `gateway.bind: "tailnet"` का उपयोग करें।

  </Accordion>

  <Accordion title="क्या मैं एक ही होस्ट पर कई Gateway चला सकता हूँ?">
    सामान्यतः नहीं—एक Gateway कई मैसेजिंग चैनल और एजेंट चला सकता है। कई Gateway केवल अतिरिक्त उपलब्धता (उदाहरण के लिए, एक बचाव बॉट) या पूर्ण पृथक्करण के लिए उपयोग करें, और प्रत्येक को उसके अपने `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` और अद्वितीय `gateway.port` से पृथक करें।

    अनुशंसित: प्रत्येक इंस्टेंस के लिए `openclaw --profile <name> ...` (स्वचालित रूप से `~/.openclaw-<name>` बनाता है), प्रत्येक प्रोफ़ाइल कॉन्फ़िगरेशन के लिए एक अद्वितीय `gateway.port` (या मैन्युअल रन के लिए `--port`), और `openclaw --profile <name> gateway install` वाली प्रत्येक-प्रोफ़ाइल सेवा।

    प्रोफ़ाइल सेवा नामों में भी प्रत्यय जोड़ते हैं: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`। अयोग्य `openclaw-gateway` systemd यूनिट केवल डिफ़ॉल्ट प्रोफ़ाइल के लिए मौजूद होती है; नाम बदलने से पहले का पुराना systemd यूनिट नाम `clawdbot-gateway` स्वचालित रूप से माइग्रेट हो जाता है।

    पूरी मार्गदर्शिका: [एकाधिक Gateway](/hi/gateway/multiple-gateways)।

  </Accordion>

  <Accordion title='"invalid handshake" / कोड 1008 का क्या अर्थ है?'>
    Gateway एक **WebSocket सर्वर** है और पहले संदेश के रूप में `connect` फ़्रेम की अपेक्षा करता है। कोई भी अन्य संदेश कनेक्शन को **कोड 1008** (नीति उल्लंघन) के साथ बंद कर देता है।

    सामान्य कारण: आपने WS क्लाइंट के बजाय ब्राउज़र में **HTTP** URL खोला, गलत पोर्ट/पथ का उपयोग किया, या किसी प्रॉक्सी/टनल ने प्रमाणीकरण हेडर हटा दिए अथवा गैर-Gateway अनुरोध भेजा।

    समाधान: WS URL (`ws://<host>:18789`, या HTTPS पर `wss://...`) का उपयोग करें, WS पोर्ट को सामान्य ब्राउज़र टैब में न खोलें, और प्रमाणीकरण चालू होने पर `connect` फ़्रेम में टोकन/पासवर्ड शामिल करें। CLI/TUI उदाहरण:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    प्रोटोकॉल विवरण: [Gateway प्रोटोकॉल](/hi/gateway/protocol)।

  </Accordion>
</AccordionGroup>

## लॉगिंग और डीबगिंग

<AccordionGroup>
  <Accordion title="लॉग कहाँ हैं?">
    फ़ाइल लॉग (संरचित): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`। `logging.file` के माध्यम से एक स्थिर पथ सेट करें; फ़ाइल लॉग स्तर के लिए `logging.level`; कंसोल विवरण स्तर के लिए `--verbose` और `logging.consoleLevel`।

    तुरंत लॉग देखते रहने का तरीका:

    ```bash
    openclaw logs --follow
    ```

    सेवा/सुपरवाइज़र लॉग (जब Gateway launchd/systemd के माध्यम से चलता है):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (प्रोफ़ाइल `gateway-<profile>.log` का उपयोग करती हैं; stderr दबा दिया जाता है)।
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`।
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`।

    अधिक जानकारी के लिए [समस्या निवारण](/hi/gateway/troubleshooting) देखें।

  </Accordion>

  <Accordion title="मैं Gateway सेवा को कैसे शुरू/बंद/पुनः आरंभ करूँ?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    यदि आप Gateway को मैन्युअल रूप से चलाते हैं, तो `openclaw gateway --force` पोर्ट को पुनः प्राप्त कर सकता है। [Gateway](/hi/gateway) देखें।

  </Accordion>

  <Accordion title="मैंने Windows पर अपना टर्मिनल बंद कर दिया—मैं OpenClaw को पुनः कैसे शुरू करूँ?">
    Windows पर इंस्टॉल करने के तीन मोड हैं:

    **1) Windows Hub स्थानीय सेटअप**: नेटिव ऐप स्थानीय, ऐप-स्वामित्व वाले WSL Gateway का प्रबंधन करता है। Start मेन्यू या ट्रे से **OpenClaw Companion** खोलें, फिर **Gateway Setup** या Connections टैब का उपयोग करें।

    **2) मैन्युअल WSL2 Gateway**: Gateway Linux के भीतर चलता है।
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    यदि आपने सेवा कभी इंस्टॉल नहीं की है, तो इसे फ़ोरग्राउंड में शुरू करें: `openclaw gateway run`।

    **3) नेटिव Windows CLI/Gateway**: सीधे Windows में चलता है।
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    यदि आप इसे मैन्युअल रूप से चलाते हैं (कोई सेवा नहीं): `openclaw gateway run`।

    दस्तावेज़: [Windows](/hi/platforms/windows), [Gateway सेवा रनबुक](/hi/gateway)।

  </Accordion>

  <Accordion title="Gateway चालू है लेकिन उत्तर कभी नहीं पहुँचते। मुझे क्या जाँचना चाहिए?">
    त्वरित स्वास्थ्य जाँच:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    सामान्य कारण: **gateway होस्ट** पर मॉडल प्रमाणीकरण लोड नहीं हुआ है (`models status` जाँचें), चैनल पेयरिंग/अनुमति-सूची उत्तरों को रोक रही है (चैनल कॉन्फ़िगरेशन और लॉग जाँचें), या सही टोकन के बिना WebChat/Dashboard खुला है। यदि रिमोट है, तो पुष्टि करें कि टनल/Tailscale कनेक्शन चालू है और Gateway WebSocket पहुँच योग्य है।

    दस्तावेज़: [चैनल](/hi/channels), [समस्या निवारण](/hi/gateway/troubleshooting), [रिमोट एक्सेस](/hi/gateway/remote)।

  </Accordion>

  <Accordion title='"Gateway से डिस्कनेक्ट हो गया: कोई कारण नहीं" - अब क्या करें?'>
    आम तौर पर इसका अर्थ है कि UI का WebSocket कनेक्शन टूट गया है। जाँचें: क्या Gateway चल रहा है (`openclaw gateway status`)? क्या यह स्वस्थ है (`openclaw status`)? क्या UI में सही टोकन है (`openclaw dashboard`)? यदि रिमोट है, तो क्या टनल/Tailscale लिंक चालू है?

    फिर लॉग लगातार देखें:

    ```bash
    openclaw logs --follow
    ```

    दस्तावेज़: [Dashboard](/hi/web/dashboard), [रिमोट एक्सेस](/hi/gateway/remote), [समस्या निवारण](/hi/gateway/troubleshooting)।

  </Accordion>

  <Accordion title="Telegram setMyCommands विफल होता है। मुझे क्या जाँचना चाहिए?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    फिर त्रुटि का मिलान करें:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram मेन्यू में बहुत अधिक प्रविष्टियाँ हैं। OpenClaw पहले ही सूची को Telegram की सीमा तक छोटा करता है और कम कमांड के साथ फिर प्रयास करता है, लेकिन कुछ मेन्यू प्रविष्टियाँ फिर भी हट सकती हैं। Plugin/skill/कस्टम कमांड कम करें, या यदि आपको मेन्यू की आवश्यकता नहीं है तो `channels.telegram.commands.native` अक्षम करें।
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, या इसी तरह की नेटवर्क त्रुटियाँ: VPS पर या प्रॉक्सी के पीछे होने पर पुष्टि करें कि आउटबाउंड HTTPS की अनुमति है और `api.telegram.org` के लिए DNS काम करता है।

    यदि Gateway रिमोट है, तो Gateway होस्ट पर लॉग जाँचें।

    दस्तावेज़: [Telegram](/hi/channels/telegram), [चैनल समस्या निवारण](/hi/channels/troubleshooting)।

  </Accordion>

  <Accordion title="TUI कोई आउटपुट नहीं दिखाता। मुझे क्या जाँचना चाहिए?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI में वर्तमान स्थिति देखने के लिए `/status` का उपयोग करें। यदि आप किसी चैट चैनल में उत्तरों की अपेक्षा करते हैं, तो पुष्टि करें कि डिलीवरी सक्षम है (`/deliver on`)।

    दस्तावेज़: [TUI](/hi/web/tui), [स्लैश कमांड](/hi/tools/slash-commands)।

  </Accordion>

  <Accordion title="मैं Gateway को पूरी तरह रोककर फिर कैसे शुरू करूँ?">
    यदि आपने सेवा इंस्टॉल की है (macOS पर launchd, Linux पर systemd):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    फ़ोरग्राउंड में Ctrl-C से रोकें, फिर `openclaw gateway run`।

    दस्तावेज़: [Gateway सेवा रनबुक](/hi/gateway)।

  </Accordion>

  <Accordion title="सरल शब्दों में: openclaw gateway restart बनाम openclaw gateway">
    `openclaw gateway restart` **बैकग्राउंड सेवा** (launchd/systemd) को पुनः आरंभ करता है। `openclaw gateway` इस टर्मिनल सत्र के लिए gateway को **फ़ोरग्राउंड में** चलाता है। यदि आपने सेवा इंस्टॉल की है तो gateway उपकमांड का उपयोग करें; एक बार चलाने के लिए केवल फ़ोरग्राउंड रन का उपयोग करें।
  </Accordion>

  <Accordion title="कुछ विफल होने पर अधिक विवरण पाने का सबसे तेज़ तरीका">
    अधिक कंसोल विवरण के लिए Gateway को `--verbose` के साथ शुरू करें, फिर चैनल प्रमाणीकरण, मॉडल रूटिंग और RPC त्रुटियों के लिए लॉग फ़ाइल देखें।
  </Accordion>
</AccordionGroup>

## मीडिया और अटैचमेंट

<AccordionGroup>
  <Accordion title="मेरी skill ने एक इमेज/PDF बनाया, लेकिन कुछ भी नहीं भेजा गया">
    एजेंट से भेजे जाने वाले अटैचमेंट में `media`, `mediaUrl`, `path`, या `filePath` जैसे संरचित मीडिया फ़ील्ड का उपयोग होना आवश्यक है। [OpenClaw सहायक सेटअप](/hi/start/openclaw) और [एजेंट सेंड](/hi/tools/agent-send) देखें।

    ```bash
    openclaw message send --target +15555550123 --message "यह रहा" --media /path/to/file.png
    ```

    यह भी जाँचें: लक्षित चैनल आउटबाउंड मीडिया का समर्थन करता है और अनुमति-सूचियों द्वारा अवरुद्ध नहीं है; फ़ाइल प्रदाता की आकार सीमाओं के भीतर है (इमेज का अधिकतम किनारा 2048px तक री-साइज़ होता है); `tools.fs.workspaceOnly=true` स्थानीय-पथ से भेजने को वर्कस्पेस, अस्थायी/मीडिया-स्टोर और सैंडबॉक्स-सत्यापित फ़ाइलों तक सीमित करता है; `tools.fs.workspaceOnly=false` (डिफ़ॉल्ट) संरचित स्थानीय मीडिया प्रेषण को ऐसी होस्ट-स्थानीय फ़ाइलों का उपयोग करने देता है जिन्हें एजेंट पहले से पढ़ सकता है—मीडिया और सुरक्षित दस्तावेज़ प्रकारों के लिए (इमेज, ऑडियो, वीडियो, PDF, Office दस्तावेज़ और सत्यापित टेक्स्ट दस्तावेज़ जैसे Markdown/MD, TXT, JSON, YAML/YML)। यह कोई सीक्रेट स्कैनर नहीं है—यदि एक्सटेंशन और सामग्री सत्यापन मेल खाते हैं, तो एजेंट द्वारा पढ़ने योग्य `secret.txt` या `config.json` अटैच किया जा सकता है। संवेदनशील फ़ाइलों को एजेंट द्वारा पढ़े जा सकने वाले पथों से बाहर रखें, या स्थानीय-पथ से अधिक सख्त प्रेषण के लिए `tools.fs.workspaceOnly=true` बनाए रखें।

    [इमेज](/hi/nodes/images) देखें।

  </Accordion>
</AccordionGroup>

## सुरक्षा और अभिगम नियंत्रण

<AccordionGroup>
  <Accordion title="क्या OpenClaw को इनबाउंड DM के लिए उपलब्ध कराना सुरक्षित है?">
    इनबाउंड DM को अविश्वसनीय इनपुट मानें। डिफ़ॉल्ट जोखिम कम करते हैं:

    - DM-सक्षम चैनलों पर डिफ़ॉल्ट व्यवहार **पेयरिंग** है: अज्ञात प्रेषकों को पेयरिंग कोड मिलता है और उनका संदेश संसाधित नहीं किया जाता। `openclaw pairing approve --channel <channel> [--account <id>] <code>` से स्वीकृति दें। लंबित अनुरोधों की सीमा **प्रति चैनल 3** है; यदि कोड नहीं आया तो `openclaw pairing list --channel <channel> [--account <id>]` जाँचें।
    - DM को सार्वजनिक रूप से खोलने के लिए स्पष्ट ऑप्ट-इन आवश्यक है (`dmPolicy: "open"` और अनुमति-सूची `"*"`)।

    जोखिमपूर्ण DM नीतियाँ सामने लाने के लिए `openclaw doctor` चलाएँ।

  </Accordion>

  <Accordion title="क्या प्रॉम्प्ट इंजेक्शन केवल सार्वजनिक बॉट के लिए चिंता का विषय है?">
    नहीं। प्रॉम्प्ट इंजेक्शन का संबंध **अविश्वसनीय सामग्री** से है, केवल इस बात से नहीं कि बॉट को कौन DM कर सकता है। यदि आपका सहायक बाहरी सामग्री पढ़ता है (वेब खोज/फ़ेच, ब्राउज़र पेज, ईमेल, दस्तावेज़, अटैचमेंट, पेस्ट किए गए लॉग), तो उस सामग्री में मॉडल को अपने नियंत्रण में लेने का प्रयास करने वाले निर्देश हो सकते हैं—भले ही आप एकमात्र प्रेषक हों।

    सबसे बड़ा जोखिम तब होता है जब टूल सक्षम हों: मॉडल को संदर्भ बाहर भेजने या आपकी ओर से टूल कॉल करने के लिए छलपूर्वक प्रेरित किया जा सकता है। प्रभाव का दायरा कम करें:

    - अविश्वसनीय सामग्री का सारांश बनाने के लिए केवल-पढ़ने योग्य या टूल-अक्षम "रीडर" एजेंट का उपयोग करें
    - टूल-सक्षम एजेंट के लिए `web_search` / `web_fetch` / `browser` बंद रखें
    - डिकोड किए गए फ़ाइल/दस्तावेज़ टेक्स्ट को भी अविश्वसनीय मानें: OpenResponses `input_file` और मीडिया-अटैचमेंट निष्कर्षण, दोनों कच्चा फ़ाइल टेक्स्ट भेजने के बजाय निकाले गए टेक्स्ट को स्पष्ट बाहरी-सामग्री सीमा मार्कर में लपेटते हैं
    - सैंडबॉक्स का उपयोग करें और टूल की सख्त अनुमति-सूचियाँ रखें

    विवरण: [सुरक्षा](/hi/gateway/security)।

  </Accordion>

  <Accordion title="क्या Rust/WASM के बजाय TypeScript/Node का उपयोग करने के कारण OpenClaw कम सुरक्षित है?">
    भाषा और रनटाइम मायने रखते हैं, लेकिन व्यक्तिगत एजेंट के लिए वे मुख्य जोखिम नहीं हैं। व्यावहारिक जोखिम हैं: gateway को उपलब्ध कराना, बॉट को कौन संदेश भेज सकता है, प्रॉम्प्ट इंजेक्शन, टूल का दायरा, क्रेडेंशियल प्रबंधन, ब्राउज़र एक्सेस, exec एक्सेस और तृतीय-पक्ष skill/Plugin पर भरोसा।

    Rust और WASM कुछ कोड वर्गों के लिए अधिक मजबूत पृथक्करण प्रदान कर सकते हैं, लेकिन वे प्रॉम्प्ट इंजेक्शन, खराब अनुमति-सूचियाँ, सार्वजनिक gateway एक्सपोज़र, अत्यधिक व्यापक टूल, या संवेदनशील खातों में पहले से लॉग इन ब्राउज़र प्रोफ़ाइल की समस्या हल नहीं करते। इन्हें प्राथमिक नियंत्रण मानें: Gateway को निजी या प्रमाणित रखें, DM/समूहों के लिए पेयरिंग और अनुमति-सूचियों का उपयोग करें, अविश्वसनीय इनपुट के लिए जोखिमपूर्ण टूल अस्वीकार करें या उन्हें सैंडबॉक्स करें, केवल विश्वसनीय Plugin और skill इंस्टॉल करें, और कॉन्फ़िगरेशन परिवर्तन के बाद `openclaw security audit --deep` चलाएँ।

    विवरण: [सुरक्षा](/hi/gateway/security), [सैंडबॉक्सिंग](/hi/gateway/sandboxing)।

  </Accordion>

  <Accordion title="मैंने सार्वजनिक रूप से उपलब्ध OpenClaw इंस्टेंस की रिपोर्ट देखी हैं। मुझे क्या जाँचना चाहिए?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    अधिक सुरक्षित आधाररेखा: Gateway को `loopback` से बाँधा गया हो, या केवल प्रमाणित निजी एक्सेस (tailnet, SSH टनल, टोकन/पासवर्ड प्रमाणीकरण, या सही ढंग से कॉन्फ़िगर किया गया विश्वसनीय प्रॉक्सी) के माध्यम से उपलब्ध हो; DM `pairing` या `allowlist` मोड में हों; समूह अनुमति-सूची में हों और मेंशन-गेटेड हों, जब तक कि हर सदस्य विश्वसनीय न हो; अविश्वसनीय सामग्री पढ़ने वाले एजेंटों के लिए उच्च-जोखिम टूल (`exec`, `browser`, `gateway`, `cron`) अस्वीकृत या कड़े दायरे में हों; जहाँ टूल निष्पादन के प्रभाव का दायरा छोटा करना आवश्यक हो, वहाँ सैंडबॉक्सिंग सक्षम हो।

    बिना प्रमाणीकरण के सार्वजनिक बाइंड, टूल वाले खुले DM/समूह और सार्वजनिक रूप से उपलब्ध ब्राउज़र नियंत्रण वे समस्याएँ हैं जिन्हें पहले ठीक करना चाहिए। विवरण: [openclaw security audit](/hi/gateway/security#openclaw-security-audit)।

  </Accordion>

  <Accordion title="क्या ClawHub skills और तृतीय-पक्ष Plugin इंस्टॉल करना सुरक्षित है?">
    तृतीय-पक्ष skill और Plugin को ऐसा कोड मानें जिस पर आप भरोसा करने का निर्णय ले रहे हैं। ClawHub के skill पेज इंस्टॉल करने से पहले स्कैन की स्थिति दिखाते हैं, लेकिन स्कैन अपने आप में पूर्ण सुरक्षा सीमा नहीं हैं। OpenClaw Plugin/skill को इंस्टॉल या अपडेट करते समय अंतर्निहित स्थानीय खतरनाक-कोड अवरोधन नहीं चलाता; स्थानीय अनुमति/अवरोध निर्णयों के लिए ऑपरेटर के स्वामित्व वाला `security.installPolicy` उपयोग करें।

    अधिक सुरक्षित तरीका: विश्वसनीय लेखकों और निश्चित संस्करणों को प्राथमिकता दें, skill/Plugin को सक्षम करने से पहले पढ़ें, Plugin/skill की अनुमति-सूचियाँ सीमित रखें, अविश्वसनीय-इनपुट वर्कफ़्लो को न्यूनतम टूल वाले सैंडबॉक्स में चलाएँ, और तृतीय-पक्ष कोड को व्यापक फ़ाइल सिस्टम, exec, ब्राउज़र या सीक्रेट एक्सेस देने से बचें।

    विवरण: [Skills](/hi/tools/skills), [Plugin](/hi/tools/plugin), [सुरक्षा](/hi/gateway/security)।

  </Accordion>

  <Accordion title="क्या मेरे बॉट का अपना ईमेल, GitHub खाता या फ़ोन नंबर होना चाहिए?">
    अधिकांश सेटअप के लिए, हाँ। बॉट को अलग खातों और फ़ोन नंबरों से पृथक रखने पर कुछ गलत होने की स्थिति में प्रभाव का दायरा कम हो जाता है, और आपके व्यक्तिगत खातों को प्रभावित किए बिना क्रेडेंशियल बदलना या एक्सेस रद्द करना आसान होता है।

    छोटे स्तर से शुरू करें: केवल उन्हीं टूल और खातों का एक्सेस दें जिनकी वास्तव में आवश्यकता है, और आवश्यकता पड़ने पर बाद में विस्तार करें।

    दस्तावेज़: [सुरक्षा](/hi/gateway/security), [पेयरिंग](/hi/channels/pairing)।

  </Accordion>

  <Accordion title="क्या मैं इसे अपने टेक्स्ट संदेशों पर स्वायत्तता दे सकता हूँ और क्या यह सुरक्षित है?">
    हम आपके व्यक्तिगत संदेशों पर पूर्ण स्वायत्तता की अनुशंसा **नहीं** करते। सबसे सुरक्षित तरीका: DM को **पेयरिंग मोड** या सीमित अनुमति-सूची में रखें, यदि इसे आपकी ओर से संदेश भेजने हैं तो **अलग नंबर या खाते** का उपयोग करें, और इसे मसौदा तैयार करने दें जबकि आप **भेजने से पहले स्वीकृति दें**।

    प्रयोग करने के लिए इसे समर्पित, पृथक खाते पर करें। [सुरक्षा](/hi/gateway/security) देखें।

  </Accordion>

  <Accordion title="क्या मैं व्यक्तिगत सहायक कार्यों के लिए सस्ते मॉडल का उपयोग कर सकता हूँ?">
    हाँ, **यदि** एजेंट केवल चैट करता है और इनपुट विश्वसनीय है। छोटे स्तर निर्देशों द्वारा नियंत्रण हड़पे जाने के प्रति अधिक संवेदनशील होते हैं, इसलिए टूल-सक्षम एजेंट के लिए या अविश्वसनीय सामग्री पढ़ते समय उनका उपयोग न करें। यदि छोटे मॉडल का उपयोग आवश्यक है, तो टूल को कड़े दायरे में रखें और सैंडबॉक्स के अंदर चलाएँ। [सुरक्षा](/hi/gateway/security) देखें।
  </Accordion>

  <Accordion title="मैंने Telegram में /start चलाया लेकिन पेयरिंग कोड नहीं मिला">
    पेयरिंग कोड **केवल** तब भेजे जाते हैं जब कोई अज्ञात प्रेषक बॉट को संदेश भेजता है और `dmPolicy: "pairing"` सक्षम होता है; केवल `/start` कोड उत्पन्न नहीं करता।

    लंबित अनुरोध जाँचें:

    ```bash
    openclaw pairing list telegram
    ```

    तुरंत एक्सेस के लिए अपने प्रेषक आईडी को अनुमति-सूची में जोड़ें या उस खाते के लिए `dmPolicy: "open"` सेट करें।

  </Accordion>

  <Accordion title="WhatsApp: क्या यह मेरे संपर्कों को संदेश भेजेगा? पेयरिंग कैसे काम करती है?">
    नहीं। WhatsApp की डिफ़ॉल्ट DM नीति **पेयरिंग** है। अज्ञात प्रेषकों को केवल पेयरिंग कोड मिलता है; उनका संदेश **संसाधित नहीं किया जाता**। OpenClaw केवल प्राप्त चैट का उत्तर देता है या आपके द्वारा स्पष्ट रूप से शुरू किए गए संदेश भेजता है।

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    विज़ार्ड का फ़ोन नंबर प्रॉम्प्ट आपकी **अनुमति-सूची/स्वामी** सेट करता है, ताकि आपके अपने DM की अनुमति हो - इसका उपयोग स्वतः भेजने के लिए नहीं किया जाता। अपने व्यक्तिगत WhatsApp नंबर के लिए, उसी नंबर का उपयोग करें और `channels.whatsapp.selfChatMode` सक्षम करें।

  </Accordion>
</AccordionGroup>

## चैट कमांड, कार्यों को निरस्त करना, और "यह रुकता नहीं है"

<AccordionGroup>
  <Accordion title="मैं आंतरिक सिस्टम संदेशों को चैट में दिखाई देने से कैसे रोकूँ?">
    अधिकांश आंतरिक/टूल संदेश केवल तब दिखाई देते हैं, जब उस सत्र के लिए **वर्बोज़**, **ट्रेस**, या **रीज़निंग** सक्षम हो।

    जिस चैट में ये दिखाई देते हैं, वहाँ इसे ठीक करें:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    यदि अब भी बहुत अधिक संदेश आ रहे हैं: Control UI में सत्र सेटिंग जाँचें और वर्बोज़ को **इनहेरिट** पर सेट करें; पुष्टि करें कि आप ऐसे बॉट प्रोफ़ाइल का उपयोग नहीं कर रहे हैं, जिसके कॉन्फ़िगरेशन में `verboseDefault: "on"` हो।

    दस्तावेज़: [सोच और वर्बोज़ आउटपुट](/hi/tools/thinking), [सुरक्षा](/hi/gateway/security/index#reasoning-and-verbose-output-in-groups)।

  </Accordion>

  <Accordion title="मैं चल रहे कार्य को कैसे रोकूँ/रद्द करूँ?">
    निरस्तीकरण ट्रिगर करने के लिए इनमें से कोई भी **एक स्वतंत्र संदेश के रूप में** (स्लैश के बिना) भेजें: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`। सामान्य गैर-अंग्रेज़ी ट्रिगर (फ़्रेंच, जर्मन, स्पेनिश, चीनी, जापानी, हिंदी, अरबी, रूसी) भी काम करते हैं।

    exec टूल द्वारा शुरू की गई बैकग्राउंड प्रक्रियाओं के लिए, एजेंट से यह चलाने को कहें:

    ```text
    process action:kill sessionId:XXX
    ```

    अधिकांश स्लैश कमांड `/` से शुरू होने वाले **स्वतंत्र** संदेश के रूप में भेजने आवश्यक हैं, लेकिन कुछ शॉर्टकट (जैसे `/status`) अनुमति-सूची में शामिल प्रेषकों के लिए इनलाइन भी काम करते हैं। [स्लैश कमांड](/hi/tools/slash-commands) देखें।

  </Accordion>

  <Accordion title='मैं Telegram से Discord संदेश कैसे भेजूँ? ("अलग संदर्भ में संदेश भेजने की अनुमति नहीं है")'>
    OpenClaw डिफ़ॉल्ट रूप से **अलग-अलग प्रदाताओं के बीच** संदेश भेजना अवरुद्ध करता है। यदि कोई टूल कॉल Telegram से संबद्ध है, तो वह Discord पर संदेश नहीं भेजेगा, जब तक आप इसकी स्पष्ट रूप से अनुमति न दें - और यह तुरंत प्रभावी होता है, Gateway को पुनः शुरू करने की आवश्यकता नहीं होती:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title='ऐसा क्यों लगता है कि बॉट लगातार तेज़ी से भेजे गए संदेशों को "अनदेखा" करता है?'>
    डिफ़ॉल्ट रूप से, रन के बीच मिलने वाले प्रॉम्प्ट सक्रिय रन की दिशा तय करने के लिए उसमें भेजे जाते हैं। सक्रिय रन का व्यवहार चुनने के लिए `/queue` का उपयोग करें:

    - `steer` (डिफ़ॉल्ट) - अगले मॉडल सीमा-बिंदु पर सक्रिय रन का मार्गदर्शन करें।
    - `followup` - संदेशों को कतार में रखें और वर्तमान रन समाप्त होने के बाद उन्हें एक-एक करके चलाएँ।
    - `collect` - संगत संदेशों को कतार में रखें और वर्तमान रन समाप्त होने के बाद एक बार उत्तर दें।
    - `interrupt` - वर्तमान रन निरस्त करें और नए सिरे से शुरू करें।

    कतारबद्ध मोड में `debounce:0.5s cap:25 drop:summarize` जैसे विकल्प जोड़ें। [कमांड कतार](/hi/concepts/queue) और [दिशा-निर्देशन कतार](/hi/concepts/queue-steering) देखें।

  </Accordion>
</AccordionGroup>

## विविध

<AccordionGroup>
  <Accordion title='API कुंजी के साथ Anthropic का डिफ़ॉल्ट मॉडल क्या है?'>
    क्रेडेंशियल और मॉडल चयन अलग-अलग हैं। `ANTHROPIC_API_KEY` सेट करने (या प्रमाणीकरण प्रोफ़ाइल में Anthropic API कुंजी संग्रहीत करने) से प्रमाणीकरण सक्षम होता है, लेकिन वास्तविक डिफ़ॉल्ट मॉडल वही है, जिसे आप `agents.defaults.model.primary` में कॉन्फ़िगर करते हैं (उदाहरण के लिए `anthropic/claude-sonnet-4-6` या `anthropic/claude-opus-4-6`)। `No credentials found for profile "anthropic:default"` का अर्थ है कि Gateway को चल रहे एजेंट के अपेक्षित `auth-profiles.json` में Anthropic क्रेडेंशियल नहीं मिले।
  </Accordion>
</AccordionGroup>

---

अब भी समस्या बनी हुई है? [Discord](https://discord.com/invite/clawd) में पूछें या [GitHub चर्चा](https://github.com/openclaw/openclaw/discussions) खोलें।

## संबंधित

- [पहले रन के अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq-first-run) - इंस्टॉलेशन, ऑनबोर्डिंग, प्रमाणीकरण, सदस्यताएँ, शुरुआती विफलताएँ
- [मॉडल के अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq-models) - मॉडल चयन, फ़ेलओवर, प्रमाणीकरण प्रोफ़ाइल
- [समस्या निवारण](/hi/help/troubleshooting) - लक्षण-आधारित प्रारंभिक जाँच
