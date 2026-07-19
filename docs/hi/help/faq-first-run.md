---
read_when:
    - नया इंस्टॉलेशन, ऑनबोर्डिंग अटकी हुई, या पहली बार चलाने पर त्रुटियाँ
    - प्रमाणीकरण और प्रदाता सदस्यताओं का चयन करना
    - docs.openclaw.ai तक पहुँच नहीं हो रही, डैशबोर्ड नहीं खुल रहा, इंस्टॉलेशन अटका हुआ है
sidebarTitle: First-run FAQ
summary: 'FAQ: त्वरित शुरुआत और पहली बार चलाने की सेटअप प्रक्रिया — इंस्टॉल करना, ऑनबोर्डिंग, प्रमाणीकरण, सदस्यताएँ, शुरुआती विफलताएँ'
title: 'अक्सर पूछे जाने वाले प्रश्न: पहली बार का सेटअप'
x-i18n:
    generated_at: "2026-07-19T08:42:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

त्वरित शुरुआत और पहली बार चलाने से जुड़े प्रश्नोत्तर। रोज़मर्रा के संचालन, मॉडल, प्रमाणीकरण, सत्रों
और समस्या निवारण के लिए मुख्य [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq) देखें।

## त्वरित शुरुआत और पहली बार का सेटअप

<AccordionGroup>
  <Accordion title="मैं अटक गया हूँ, इससे निकलने का सबसे तेज़ तरीका">
    किसी ऐसे स्थानीय AI एजेंट का उपयोग करें जो **आपकी मशीन देख सके**। "मैं अटक गया हूँ" वाले अधिकतर मामले
    **स्थानीय कॉन्फ़िगरेशन या परिवेश की समस्याएँ** होते हैं, जिनकी कोई दूरस्थ सहायक जाँच नहीं कर सकता, इसलिए यह
    Discord पर पूछने से बेहतर है।

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    एजेंट को संशोधन-योग्य (git) इंस्टॉल के माध्यम से पूरा स्रोत चेकआउट दें, ताकि वह
    कोड + दस्तावेज़ पढ़ सके और आपके द्वारा चलाए जा रहे सटीक संस्करण का विश्लेषण कर सके:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    एजेंट से सुधार की चरण-दर-चरण योजना बनाने और उसकी निगरानी करने को कहें, फिर केवल
    आवश्यक कमांड चलाएँ—छोटे अंतर का ऑडिट करना आसान होता है।

    सहायता माँगते समय ये आउटपुट साझा करें (Discord या GitHub इश्यू में):

    | कमांड | क्या दिखाता है |
    | --- | --- |
    | `openclaw status` | Gateway/एजेंट की स्थिति + मूल कॉन्फ़िगरेशन स्नैपशॉट |
    | `openclaw status --all` | पूर्ण केवल-पढ़ने योग्य निदान, जिसे पेस्ट किया जा सकता है |
    | `openclaw models status` | प्रदाता प्रमाणीकरण + मॉडल उपलब्धता |
    | `openclaw doctor` | सामान्य कॉन्फ़िगरेशन/स्थिति समस्याओं की पुष्टि और मरम्मत करता है |
    | `openclaw logs --follow` | लाइव लॉग टेल |
    | `openclaw gateway status --deep` | Gateway/कॉन्फ़िगरेशन/Plugin की गहन स्थिति जाँच |
    | `openclaw health --verbose` | विस्तृत स्थिति रिपोर्ट |

    कोई वास्तविक बग या सुधार मिला? इश्यू दर्ज करें या PR भेजें:
    [इश्यू](https://github.com/openclaw/openclaw/issues) /
    [पुल रिक्वेस्ट](https://github.com/openclaw/openclaw/pulls)।

    त्वरित डीबग चक्र: [अगर कुछ खराब है, तो पहले 60 सेकंड](/hi/help/faq#first-60-seconds-if-something-is-broken)।
    इंस्टॉल दस्तावेज़: [इंस्टॉल](/hi/install), [इंस्टॉलर फ़्लैग](/hi/install/installer), [अपडेट करना](/hi/install/updating)।

  </Accordion>

  <Accordion title="Heartbeat बार-बार छोड़ दिया जाता है। छोड़ने के कारणों का क्या अर्थ है?">
    | छोड़ने का कारण | अर्थ |
    | --- | --- |
    | `quiet-hours` | कॉन्फ़िगर की गई सक्रिय-घंटों की अवधि से बाहर |
    | `empty-heartbeat-file` | `HEARTBEAT.md` मौजूद है, लेकिन उसमें केवल रिक्त, टिप्पणी, हेडर, फ़ेंस या खाली-चेकलिस्ट की आधार संरचना है |
    | `no-tasks-due` | कार्य मोड सक्रिय है, लेकिन अभी किसी कार्य का अंतराल पूरा नहीं हुआ है |
    | `alerts-disabled` | Heartbeat की पूरी दृश्यता बंद है (`showOk`, `showAlerts`, और `useIndicator` सभी अक्षम हैं) |

    कार्य मोड में, नियत टाइमस्टैम्प केवल वास्तविक Heartbeat रन पूरा होने के बाद आगे बढ़ते हैं।
    छोड़े गए रन कार्यों को पूर्ण चिह्नित नहीं करते।

    दस्तावेज़: [Heartbeat](/hi/gateway/heartbeat), [स्वचालन](/hi/automation)।

  </Accordion>

  <Accordion title="OpenClaw को इंस्टॉल और सेट अप करने का अनुशंसित तरीका">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    स्रोत से (योगदानकर्ता/डेवलपर):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    अभी तक वैश्विक इंस्टॉल नहीं है? इसके बजाय `pnpm openclaw onboard` चलाएँ। यदि Control UI एसेट
    अनुपलब्ध हैं, तो ऑनबोर्डिंग स्वयं उन्हें बनाने का प्रयास करती है और विफल होने पर `pnpm ui:build` का उपयोग करती है।

  </Accordion>

  <Accordion title="ऑनबोर्डिंग के बाद मैं डैशबोर्ड कैसे खोलूँ?">
    सेटअप के तुरंत बाद ऑनबोर्डिंग आपके ब्राउज़र में एक साफ़ (बिना टोकन वाला) डैशबोर्ड URL खोलती है
    और सारांश में लिंक प्रिंट करती है। उस टैब को खुला रखें; यदि वह नहीं खुला,
    तो उसी मशीन पर प्रिंट किया गया URL कॉपी/पेस्ट करें।
  </Accordion>

  <Accordion title="मैं localhost और रिमोट पर डैशबोर्ड को कैसे प्रमाणित करूँ?">
    **Localhost (वही मशीन):**

    - `http://127.0.0.1:18789/` खोलें।
    - यदि वह साझा-गुप्त प्रमाणीकरण माँगे, तो कॉन्फ़िगर किया गया टोकन या पासवर्ड Control UI सेटिंग में पेस्ट करें।
    - टोकन स्रोत: `gateway.auth.token` (या `OPENCLAW_GATEWAY_TOKEN`)।
    - पासवर्ड स्रोत: `gateway.auth.password` (या `OPENCLAW_GATEWAY_PASSWORD`)।
    - अभी तक कोई साझा गुप्त कॉन्फ़िगर नहीं है? `openclaw doctor --generate-gateway-token` (या `openclaw doctor --fix --generate-gateway-token`) चलाएँ।

    **Localhost पर नहीं:**

    - **Tailscale Serve** (अनुशंसित): बाइंड को लूपबैक पर रखें, `openclaw gateway --tailscale serve` चलाएँ, `https://<magicdns>/` खोलें। `gateway.auth.allowTailscale: true` के साथ, पहचान हेडर Control UI/WebSocket प्रमाणीकरण को पूरा करते हैं (साझा गुप्त पेस्ट करने की आवश्यकता नहीं, एक विश्वसनीय Gateway होस्ट मानकर); HTTP API को तब भी साझा-गुप्त प्रमाणीकरण चाहिए, जब तक आप जानबूझकर निजी-इनग्रेस `none` या विश्वसनीय-प्रॉक्सी HTTP प्रमाणीकरण का उपयोग न करें।
      एक ही क्लाइंट से एक साथ होने वाले गलत-प्रमाणीकरण Serve प्रयासों को विफल-प्रमाणीकरण लिमिटर द्वारा दर्ज किए जाने से पहले क्रमबद्ध किया जाता है, इसलिए दूसरा गलत पुनः प्रयास पहले ही `retry later` दिखा सकता है।
    - **Tailnet बाइंड**: `openclaw gateway --bind tailnet --token "<token>"` चलाएँ (या पासवर्ड प्रमाणीकरण कॉन्फ़िगर करें), `http://<tailscale-ip>:18789/` खोलें, डैशबोर्ड सेटिंग में मेल खाता साझा गुप्त पेस्ट करें।
    - **पहचान-सचेत रिवर्स प्रॉक्सी**: Gateway को किसी विश्वसनीय प्रॉक्सी के पीछे रखें, `gateway.auth.mode: "trusted-proxy"` सेट करें, प्रॉक्सी URL खोलें। समान-होस्ट लूपबैक प्रॉक्सी के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback: true` आवश्यक है।
    - **SSH टनल**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, फिर `http://127.0.0.1:18789/` खोलें। टनल पर भी साझा-गुप्त प्रमाणीकरण लागू रहता है; संकेत मिलने पर कॉन्फ़िगर किया गया टोकन या पासवर्ड पेस्ट करें।

    बाइंड मोड और प्रमाणीकरण विवरण के लिए [डैशबोर्ड](/hi/web/dashboard) और [वेब सतहें](/hi/web) देखें।

  </Accordion>

  <Accordion title="चैट अनुमोदनों के लिए दो exec अनुमोदन कॉन्फ़िगरेशन क्यों हैं?">
    वे अलग-अलग परतों को नियंत्रित करते हैं:

    - `approvals.exec` - अनुमोदन प्रॉम्प्ट को चैट गंतव्यों पर अग्रेषित करता है।
    - `channels.<channel>.execApprovals` - उस चैनल को exec अनुमोदनों का मूल अनुमोदन क्लाइंट बनाता है।

    होस्ट की exec नीति ही वास्तविक अनुमोदन द्वार बनी रहती है; चैट कॉन्फ़िगरेशन केवल यह नियंत्रित करता है कि
    प्रॉम्प्ट कहाँ दिखाई दें और लोग उनका उत्तर कैसे दें।

    आपको दोनों की आवश्यकता बहुत कम होती है:

    - यदि चैट पहले से कमांड और उत्तरों का समर्थन करती है, तो उसी चैट का `/approve` साझा पथ के माध्यम से काम करता है।
    - जब कोई समर्थित मूल चैनल अनुमोदकों का सुरक्षित रूप से अनुमान लगा सकता है, तो `channels.<channel>.execApprovals.enabled` अनसेट या `"auto"` होने पर OpenClaw पहले-DM वाले मूल अनुमोदन स्वतः सक्षम करता है।
    - जब मूल अनुमोदन कार्ड/बटन उपलब्ध हों, तो वही UI प्राथमिक होता है; मैन्युअल `/approve` कमांड का उल्लेख केवल तभी करें, जब टूल परिणाम बताए कि चैट अनुमोदन अनुपलब्ध हैं।
    - `approvals.exec` का उपयोग केवल तभी करें, जब प्रॉम्प्ट को अन्य चैट या स्पष्ट संचालन कक्षों तक भी पहुँचना हो।
    - `channels.<channel>.execApprovals.target: "channel"` या `"both"` का उपयोग केवल तभी करें, जब आप अनुमोदन प्रॉम्प्ट को मूल कक्ष/विषय में वापस पोस्ट करना चाहते हों।
    - Plugin अनुमोदन अलग हैं: डिफ़ॉल्ट रूप से उसी चैट में `/approve`, वैकल्पिक `approvals.plugin` अग्रेषण, और केवल कुछ मूल चैनल इनके लिए भी मूल प्रबंधन बनाए रखते हैं।

    संक्षेप में: अग्रेषण रूटिंग के लिए है, मूल क्लाइंट कॉन्फ़िगरेशन अधिक समृद्ध चैनल-विशिष्ट UX के लिए है।
    [Exec अनुमोदन](/hi/tools/exec-approvals) देखें।

  </Accordion>

  <Accordion title="मुझे किस रनटाइम की आवश्यकता है?">
    Node **22.22.3+**, **24.15+**, या **25.9+** आवश्यक है (Node 24 अनुशंसित)। `pnpm` रिपॉज़िटरी का पैकेज मैनेजर है।
    Bun निर्भरताएँ इंस्टॉल कर सकता है और पैकेज स्क्रिप्ट चला सकता है, लेकिन वह OpenClaw CLI या Gateway नहीं चला सकता क्योंकि उसमें `node:sqlite` नहीं है।
  </Accordion>

  <Accordion title="क्या यह Raspberry Pi पर चलता है?">
    हाँ, लेकिन पहले RAM जाँचें: Pi 5 और Pi 4 (2 GB+) सबसे उपयुक्त हैं; Pi 3B+ (1 GB) काम करता है लेकिन धीमा है; Pi Zero 2 W (512 MB) अनुशंसित नहीं है।

    | मॉडल | RAM | उपयुक्तता |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | सर्वोत्तम |
    | Pi 4 | 4 GB | अच्छा |
    | Pi 4 | 2 GB | ठीक है, स्वैप जोड़ें |
    | Pi 4 | 1 GB | सीमित |
    | Pi 3B+ | 1 GB | धीमा |
    | Pi Zero 2 W | 512 MB | अनुशंसित नहीं |

    पूर्ण न्यूनतम: 1 GB RAM, 1 कोर, 500 MB खाली डिस्क, 64-बिट OS। चूँकि Pi केवल
    Gateway चलाता है (मॉडल क्लाउड API को कॉल करते हैं), इसलिए सामान्य क्षमता वाला Pi भी लोड संभाल लेता है।

    एक छोटा Pi/VPS केवल Gateway को भी होस्ट कर सकता है, जबकि आप स्थानीय स्क्रीन/कैमरा/कैनवास
    या कमांड निष्पादन के लिए अपने लैपटॉप/फ़ोन पर **Node** युग्मित कर सकते हैं। [Node](/hi/nodes) देखें।

    पूर्ण सेटअप पूर्वाभ्यास: [Raspberry Pi](/hi/install/raspberry-pi)।

  </Accordion>

  <Accordion title="Raspberry Pi इंस्टॉल के लिए कोई सुझाव?">
    - **64-बिट** OS का उपयोग करें; 32-बिट Raspberry Pi OS का उपयोग न करें।
    - 2 GB या उससे छोटे बोर्ड पर स्वैप जोड़ें।
    - प्रदर्शन और लंबे जीवनकाल के लिए SD कार्ड के बजाय **USB SSD** को प्राथमिकता दें।
    - संशोधन-योग्य (git) इंस्टॉल को प्राथमिकता दें, ताकि आप लॉग देख सकें और तेज़ी से अपडेट कर सकें।
    - चैनल/Skills के बिना शुरुआत करें, फिर उन्हें एक-एक करके जोड़ें।
    - असामान्य बाइनरी विफलताएँ ("exec format error") आमतौर पर किसी वैकल्पिक Skills टूल के लिए ARM64 बिल्ड उपलब्ध न होने के कारण होती हैं।

    पूर्ण मार्गदर्शिका: [Raspberry Pi](/hi/install/raspberry-pi)। [Linux](/hi/platforms/linux) भी देखें।

  </Accordion>

  <Accordion title="यह wake up my friend पर अटका है / ऑनबोर्डिंग पूरी नहीं हो रही। अब क्या करूँ?">
    यह स्क्रीन Gateway की पहुँच और प्रमाणीकरण पर निर्भर करती है। मॉडल प्रदाता कॉन्फ़िगर होने पर TUI पहली शुरुआत में
    "जागो, मेरे मित्र!" भी अपने-आप भेजता है। यदि आपने मॉडल/प्रमाणीकरण सेटअप छोड़ दिया है, तो ऑनबोर्डिंग
    "मॉडल प्रमाणीकरण अनुपलब्ध" टिप्पणी दिखाती है और कुछ भी भेजे बिना TUI खोलती है—`openclaw configure --section model` से
    प्रदाता जोड़ें।
    यदि आपको जगाने वाली पंक्ति दिखती है, लेकिन **कोई उत्तर नहीं** आता और टोकन 0 पर रहते हैं, तो एजेंट कभी चला ही नहीं।

    1. Gateway पुनः आरंभ करें:

    ```bash
    openclaw gateway restart
    ```

    2. स्थिति + प्रमाणीकरण जाँचें:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. अभी भी अटका है? चलाएँ:

    ```bash
    openclaw doctor
    ```

    यदि Gateway रिमोट है, तो पुष्टि करें कि टनल/Tailscale कनेक्शन सक्रिय है और UI
    सही Gateway की ओर इंगित करता है। [रिमोट पहुँच](/hi/gateway/remote) देखें।

  </Accordion>

  <Accordion title="क्या मैं ऑनबोर्डिंग दोबारा किए बिना अपना सेटअप नई मशीन पर स्थानांतरित कर सकता हूँ?">
    हाँ। **स्थिति डायरेक्टरी** और **वर्कस्पेस** कॉपी करें, फिर Doctor एक बार चलाएँ:

    1. नई मशीन पर OpenClaw इंस्टॉल करें।
    2. पुरानी मशीन से `$OPENCLAW_STATE_DIR` (डिफ़ॉल्ट: `~/.openclaw`) कॉपी करें।
    3. अपना वर्कस्पेस कॉपी करें (डिफ़ॉल्ट: `~/.openclaw/workspace`)।
    4. `openclaw doctor` चलाएँ और Gateway सेवा पुनः आरंभ करें।

    इससे कॉन्फ़िगरेशन, प्रमाणीकरण प्रोफ़ाइल, WhatsApp क्रेडेंशियल, सत्र और मेमोरी सुरक्षित रहते हैं—यदि आप
    **दोनों** स्थान कॉपी करते हैं, तो आपका बॉट बिल्कुल वैसा ही रहता है। रिमोट मोड में,
    Gateway होस्ट सत्र स्टोर और वर्कस्पेस का स्वामी होता है।

    **महत्वपूर्ण:** यदि आप केवल अपना वर्कस्पेस GitHub पर कमिट/पुश करते हैं, तो आप
    **मेमोरी + बूटस्ट्रैप फ़ाइलों** का बैकअप लेते हैं, लेकिन सत्र इतिहास या प्रमाणीकरण का नहीं। वे
    `~/.openclaw/` के अंतर्गत रहते हैं (उदाहरण के लिए `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`)।

    संबंधित: [स्थानांतरण](/hi/install/migrating), [डिस्क पर चीज़ें कहाँ रहती हैं](/hi/help/faq#where-things-live-on-disk),
    [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace), [Doctor](/hi/gateway/doctor),
    [रिमोट मोड](/hi/gateway/remote)।

  </Accordion>

  <Accordion title="नवीनतम संस्करण में नया क्या है, यह मैं कहाँ देखूँ?">
    GitHub बदलाव-सूची देखें:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    नवीनतम प्रविष्टियाँ सबसे ऊपर होती हैं। यदि सबसे ऊपर का अनुभाग **अप्रकाशित** है, तो अगला दिनांकित
    अनुभाग नवीनतम जारी किया गया संस्करण है। प्रविष्टियाँ **मुख्य विशेषताएँ**, **परिवर्तन**,
    और **सुधार** के अंतर्गत समूहित होती हैं (साथ ही आवश्यकता होने पर दस्तावेज़/अन्य अनुभागों में)।

  </Accordion>

  <Accordion title="docs.openclaw.ai तक पहुँच नहीं हो रही (SSL त्रुटि)">
    कुछ Comcast/Xfinity कनेक्शन Xfinity Advanced Security के माध्यम से `docs.openclaw.ai` को
    ग़लत तरीके से अवरुद्ध करते हैं। इसे अक्षम करें या `docs.openclaw.ai` को अनुमति-सूची में जोड़ें, फिर दोबारा प्रयास करें।
    इसे अवरोध-मुक्त कराने में हमारी सहायता करें: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)।

    अभी भी अवरुद्ध हैं? दस्तावेज़ GitHub पर मिरर किए गए हैं:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="स्थिर और बीटा के बीच अंतर">
    **स्थिर** और **बीटा** अलग कोड लाइनें नहीं, बल्कि **npm dist-tags** हैं:

    - `latest` = स्थिर
    - `beta` = परीक्षण के लिए आरंभिक बिल्ड (बीटा अनुपलब्ध होने या वर्तमान स्थिर रिलीज़ से पुराना होने पर `latest` पर वापस चला जाता है)

    कोई स्थिर रिलीज़ आम तौर पर पहले **बीटा** पर आती है, फिर एक स्पष्ट प्रोमोशन चरण
    संस्करण संख्या बदले बिना उसी संस्करण को `latest` पर ले जाता है। अनुरक्षक
    सीधे `latest` पर भी प्रकाशित कर सकते हैं। इसीलिए प्रोमोशन के बाद बीटा और स्थिर
    **एक ही संस्करण** की ओर संकेत कर सकते हैं।

    बदलाव देखें: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)।

    इंस्टॉल करने के एक-पंक्ति वाले कमांड और बीटा तथा डेव के अंतर के लिए अगला अकॉर्डियन देखें।

  </Accordion>

  <Accordion title="मैं बीटा संस्करण कैसे इंस्टॉल करूँ और बीटा तथा डेव में क्या अंतर है?">
    **बीटा** npm dist-tag `beta` है (प्रोमोशन के बाद `latest` से मेल खा सकता है)।
    **डेव** `main` (git) का बदलता हुआ नवीनतम सिरा है; npm पर प्रकाशित होने पर यह dist-tag `dev` का उपयोग करता है।

    एक-पंक्ति वाले कमांड (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows इंस्टॉलर (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    अधिक विवरण: [डेवलपमेंट चैनल](/hi/install/development-channels) और [इंस्टॉलर फ़्लैग](/hi/install/installer)।

  </Accordion>

  <Accordion title="मैं नवीनतम बदलाव कैसे आज़माऊँ?">
    दो विकल्प:

    1. **डेव चैनल (मौजूदा इंस्टॉलेशन):**

    ```bash
    openclaw update --channel dev
    ```

    यह `main` के git checkout पर स्विच करता है, upstream पर rebase करता है, बिल्ड करता है और
    उस checkout से CLI इंस्टॉल करता है।

    2. **परिवर्तन-योग्य (git) इंस्टॉलेशन (नई मशीन):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    मैन्युअल clone को प्राथमिकता दें:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    दस्तावेज़: [अपडेट](/hi/cli/update), [डेवलपमेंट चैनल](/hi/install/development-channels), [इंस्टॉल](/hi/install)।

  </Accordion>

  <Accordion title="इंस्टॉलेशन और ऑनबोर्डिंग में आम तौर पर कितना समय लगता है?">
    मोटा अनुमान:

    - **इंस्टॉलेशन:** 2-5 मिनट।
    - **QuickStart ऑनबोर्डिंग:** कुछ मिनट (लूपबैक gateway, स्वचालित टोकन, डिफ़ॉल्ट वर्कस्पेस)।
    - **उन्नत/पूर्ण ऑनबोर्डिंग:** जब प्रदाता साइन-इन, चैनल पेयरिंग, डेमन इंस्टॉलेशन, नेटवर्क डाउनलोड या skills के लिए अतिरिक्त सेटअप आवश्यक हो, तो अधिक समय लगता है।

    विज़ार्ड शुरुआत में ही यह समयरेखा दिखाता है। वैकल्पिक चरण छोड़ें और बाद में
    `openclaw configure` के साथ लौटें।

    प्रक्रिया अटकी हुई है? ऊपर [मैं अटका हुआ हूँ](#quick-start-and-first-run-setup) देखें।

  </Accordion>

  <Accordion title="इंस्टॉलर अटक गया है? अधिक जानकारी कैसे प्राप्त करूँ?">
    `--verbose` के साथ दोबारा चलाएँ:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` में कोई समर्पित verbose स्विच नहीं है; इसके बजाय इसे `Set-PSDebug -Trace 1` /
    `-Trace 0` में लपेटें। सभी फ़्लैग का संदर्भ: [इंस्टॉलर फ़्लैग](/hi/install/installer)।

  </Accordion>

  <Accordion title="Windows इंस्टॉलेशन में git नहीं मिला या openclaw पहचाना नहीं गया दिखाई देता है">
    Windows की दो सामान्य समस्याएँ:

    **1) npm त्रुटि spawn git / git नहीं मिला**

    - **Git for Windows** इंस्टॉल करें, सुनिश्चित करें कि `git` PATH में है।
    - PowerShell को बंद करके दोबारा खोलें, फिर इंस्टॉलर फिर से चलाएँ।

    **2) इंस्टॉलेशन के बाद openclaw पहचाना नहीं गया**

    - आपका npm वैश्विक bin फ़ोल्डर PATH में नहीं है।
    - इसे जाँचें: `npm config get prefix`।
    - उस डायरेक्टरी को अपने उपयोगकर्ता PATH में जोड़ें (`\bin` प्रत्यय आवश्यक नहीं है; अधिकांश सिस्टम पर यह `%AppData%\npm` होता है)।
    - PowerShell को बंद करके दोबारा खोलें।

    डेस्कटॉप ऐप पसंद है? **Windows Hub** का उपयोग करें। केवल टर्मिनल वाला सेटअप: PowerShell
    इंस्टॉलर और WSL2 Gateway पथ, दोनों समर्थित हैं। दस्तावेज़: [Windows](/hi/platforms/windows)।

  </Accordion>

  <Accordion title="Windows exec आउटपुट में चीनी पाठ विकृत दिखाई देता है—मुझे क्या करना चाहिए?">
    आम तौर पर इसका कारण मूल Windows शेल में कंसोल कोड पेज का मेल न खाना होता है।

    लक्षण: `system.run`/`exec` का आउटपुट चीनी पाठ को विकृत अक्षरों के रूप में दिखाता है; वही कमांड
    किसी अन्य टर्मिनल प्रोफ़ाइल में सही दिखाई देता है।

    PowerShell में समाधान:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    फिर Gateway को पुनः आरंभ करके दोबारा प्रयास करें:

    ```powershell
    openclaw gateway restart
    ```

    नवीनतम OpenClaw पर भी यह समस्या हो रही है? इसे ट्रैक/रिपोर्ट करें: [समस्या #30640](https://github.com/openclaw/openclaw/issues/30640)।

  </Accordion>

  <Accordion title="दस्तावेज़ों से मेरे प्रश्न का उत्तर नहीं मिला—मैं बेहतर उत्तर कैसे प्राप्त करूँ?">
    परिवर्तन-योग्य (git) इंस्टॉलेशन का उपयोग करें, ताकि पूरा स्रोत और दस्तावेज़ स्थानीय रूप से उपलब्ध हों, फिर
    अपने बॉट (या Claude/Codex) से **उसी फ़ोल्डर के भीतर से** पूछें, ताकि वह रेपो पढ़ सके और सटीक उत्तर दे सके।

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    अधिक विवरण: [इंस्टॉल](/hi/install) और [इंस्टॉलर फ़्लैग](/hi/install/installer)।

  </Accordion>

  <Accordion title="मैं Linux पर OpenClaw कैसे इंस्टॉल करूँ?">
    - Linux का त्वरित तरीका + सेवा इंस्टॉलेशन: [Linux](/hi/platforms/linux)।
    - पूरा चरण-दर-चरण विवरण: [आरंभ करना](/hi/start/getting-started)।
    - इंस्टॉलर + अपडेट: [इंस्टॉलेशन और अपडेट](/hi/install/updating)।

  </Accordion>

  <Accordion title="मैं VPS पर OpenClaw कैसे इंस्टॉल करूँ?">
    कोई भी Linux VPS काम करता है। सर्वर पर इंस्टॉल करें, फिर SSH/Tailscale के माध्यम से Gateway तक पहुँचें।

    मार्गदर्शिकाएँ: [exe.dev](/hi/install/exe-dev), [Hetzner](/hi/install/hetzner), [Fly.io](/hi/install/fly)।
    रिमोट पहुँच: [Gateway रिमोट](/hi/gateway/remote)।

  </Accordion>

  <Accordion title="क्लाउड/VPS इंस्टॉलेशन मार्गदर्शिकाएँ कहाँ हैं?">
    सामान्य प्रदाताओं वाला होस्टिंग केंद्र:

    - [VPS होस्टिंग](/hi/vps) (सभी प्रदाता एक ही स्थान पर)
    - [Fly.io](/hi/install/fly)
    - [Hetzner](/hi/install/hetzner)
    - [exe.dev](/hi/install/exe-dev)

    क्लाउड में **Gateway सर्वर पर चलता है** और आप अपने लैपटॉप/फ़ोन से
    Control UI (या Tailscale/SSH) के माध्यम से उस तक पहुँचते हैं। आपकी स्थिति + वर्कस्पेस सर्वर पर रहते हैं, इसलिए
    होस्ट को प्रामाणिक स्रोत मानें और उसका बैकअप लें।

    उस क्लाउड Gateway के साथ **nodes** (Mac/iOS/Android/headless) को पेयर करें, ताकि Gateway के
    क्लाउड में रहते हुए आपके लैपटॉप पर स्थानीय स्क्रीन/कैमरा/कैनवस या कमांड निष्पादन उपलब्ध हो।

    केंद्र: [प्लेटफ़ॉर्म](/hi/platforms)। रिमोट पहुँच: [Gateway रिमोट](/hi/gateway/remote)।
    Nodes: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes)।

  </Accordion>

  <Accordion title="क्या मैं OpenClaw से स्वयं को अपडेट करने के लिए कह सकता हूँ?">
    संभव है, लेकिन अनुशंसित नहीं है। अपडेट प्रवाह Gateway को पुनः आरंभ कर सकता है (जिससे
    सक्रिय सत्र टूट जाएगा), इसके लिए साफ़ git checkout की आवश्यकता हो सकती है और यह पुष्टि के लिए संकेत दे सकता है।
    ऑपरेटर के रूप में शेल से अपडेट चलाना अधिक सुरक्षित है।

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    किसी एजेंट से स्वचालित करना:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    दस्तावेज़: [अपडेट](/hi/cli/update), [अपडेट करना](/hi/install/updating)।

  </Accordion>

  <Accordion title="ऑनबोर्डिंग वास्तव में क्या करती है?">
    `openclaw onboard` अनुशंसित सेटअप पथ है। **स्थानीय मोड** में यह निम्न चरणों से ले जाता है:

    1. **मॉडल/प्रमाणीकरण** - प्रदाता OAuth, API कुंजियाँ या मैन्युअल प्रमाणीकरण (LM Studio जैसे स्थानीय विकल्पों सहित); डिफ़ॉल्ट मॉडल चुनें।
    2. **वर्कस्पेस** - स्थान + बूटस्ट्रैप फ़ाइलें।
    3. **Gateway** - पोर्ट, बाइंड पता, प्रमाणीकरण मोड, Tailscale एक्सपोज़र।
    4. **चैनल** - अंतर्निहित और आधिकारिक plugin चैट चैनल: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp और अन्य।
    5. **डेमन** - LaunchAgent (macOS), systemd उपयोगकर्ता यूनिट (Linux/WSL2) या मूल Windows Scheduled Task।
    6. **स्वास्थ्य जाँच** - Gateway आरंभ करता है और सत्यापित करता है कि वह चल रहा है।
    7. **Skills** - अनुशंसित skills और वैकल्पिक निर्भरताएँ इंस्टॉल करता है।

    यह शुरुआत में ही अवधि संबंधी अपेक्षाएँ निर्धारित करता है और यदि आपका कॉन्फ़िगर किया हुआ मॉडल अज्ञात है
    या उसका प्रमाणीकरण अनुपलब्ध है, तो चेतावनी देता है। पूरा विवरण: [ऑनबोर्डिंग (CLI)](/hi/start/wizard)।

  </Accordion>

  <Accordion title="क्या इसे चलाने के लिए मुझे Claude या OpenAI सदस्यता चाहिए?">
    नहीं। OpenClaw को **API कुंजियों** (Anthropic/OpenAI/अन्य) या **केवल स्थानीय मॉडल**
    के साथ चलाएँ, ताकि आपका डेटा आपके डिवाइस पर रहे। सदस्यताएँ (Claude Pro/Max, ChatGPT/Codex)
    उन प्रदाताओं के साथ प्रमाणीकरण करने के वैकल्पिक तरीके हैं।

    Anthropic के लिए: **API कुंजी** मानक उपयोग-के-अनुसार-भुगतान बिलिंग देती है; **Claude CLI**
    उसी होस्ट पर मौजूदा Claude Code लॉगिन का पुनः उपयोग करती है। Anthropic वर्तमान में
    Claude CLI के गैर-इंटरैक्टिव `claude -p` पथ को Agent SDK/प्रोग्रामेटिक उपयोग मानता है, जो
    फिर भी आपकी सदस्यता की योजना सीमाओं से उपयोग करता है—सदस्यता व्यवहार पर निर्भर होने से पहले
    Anthropic के वर्तमान बिलिंग दस्तावेज़ जाँचें। लंबे समय तक चलने वाले gateway होस्ट और साझा
    स्वचालन के लिए Anthropic API कुंजी अधिक पूर्वानुमेय विकल्प है।

    OpenAI Codex OAuth (ChatGPT/Codex सदस्यता) एजेंट मॉडल के लिए पूरी तरह समर्थित है।
    OpenClaw होस्ट किए गए सदस्यता-शैली के विकल्पों का भी समर्थन करता है, जिनमें **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** और **Z.AI / GLM Coding Plan** शामिल हैं।

    दस्तावेज़: [Anthropic](/hi/providers/anthropic), [OpenAI](/hi/providers/openai),
    [Qwen Cloud](/hi/providers/qwen), [MiniMax](/hi/providers/minimax), [Z.AI (GLM)](/hi/providers/zai),
    [स्थानीय मॉडल](/hi/gateway/local-models), [मॉडल](/hi/concepts/models)।

  </Accordion>

  <Accordion title="क्या मैं API कुंजी के बिना Claude Max सदस्यता का उपयोग कर सकता हूँ?">
    हाँ। OpenClaw Pro/Max/Team/Enterprise योजनाओं के लिए Claude CLI के पुनः उपयोग का समर्थन करता है। Anthropic
    वर्तमान में OpenClaw द्वारा उपयोग किए जाने वाले `claude -p` पथ को आपकी योजना की सीमाओं के अधीन
    सदस्यता-योजना उपयोग मानता है, अलग मुफ़्त भत्ता नहीं—वर्तमान बिलिंग विवरण और
    Anthropic के अपने सहायता लेखों के लिंक के लिए [Anthropic](/hi/providers/anthropic) देखें।
    सर्वर-पक्ष के सबसे पूर्वानुमेय सेटअप के लिए इसके बजाय Anthropic API कुंजी का उपयोग करें।
  </Accordion>

  <Accordion title="क्या Claude सदस्यता प्रमाणीकरण (Claude Pro या Max) समर्थित है?">
    हाँ, Claude CLI के पुनः उपयोग के माध्यम से। `claude -p`/Agent SDK उपयोग के प्रति Anthropic का बिलिंग व्यवहार
    समय के साथ बदला है; विशिष्ट बिलिंग व्यवहार पर निर्भर होने से पहले वर्तमान स्थिति और
    Anthropic के सहायता लेखों के दिनांकित लिंक के लिए [Anthropic](/hi/providers/anthropic) देखें।

    Anthropic setup-token प्रमाणीकरण भी अभी समर्थित टोकन पथ है, लेकिन उपलब्ध होने पर OpenClaw
    Claude CLI के पुनः उपयोग और `claude -p` को प्राथमिकता देता है। प्रोडक्शन या बहु-उपयोगकर्ता
    वर्कलोड के लिए, Anthropic API कुंजी अधिक सुरक्षित और पूर्वानुमेय विकल्प बनी हुई है। अन्य
    सदस्यता-शैली के होस्टेड विकल्प: [OpenAI](/hi/providers/openai), [Qwen Cloud](/hi/providers/qwen),
    [MiniMax](/hi/providers/minimax), [Z.AI (GLM)](/hi/providers/zai)।

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="मुझे Anthropic से HTTP 429 rate_limit_error क्यों दिखाई दे रहा है?">
    वर्तमान अवधि के लिए आपका **Anthropic कोटा/दर सीमा** समाप्त हो गई है। **Claude
    CLI** पर, अवधि रीसेट होने की प्रतीक्षा करें या अपना प्लान अपग्रेड करें। **Anthropic API कुंजी** पर,
    Anthropic Console में उपयोग/बिलिंग जाँचें और आवश्यकतानुसार सीमाएँ बढ़ाएँ।

    यदि संदेश विशेष रूप से `Extra usage is required for long context requests` है,
    तो अनुरोध Anthropic की 1M कॉन्टेक्स्ट विंडो (GA-सक्षम 1M Claude 4.x
    मॉडल, या पुराना `params.context1m: true` कॉन्फ़िगरेशन) उपयोग करने का प्रयास कर रहा है, और आपका वर्तमान क्रेडेंशियल
    लंबे कॉन्टेक्स्ट की बिलिंग के लिए पात्र नहीं है।

    एक **फ़ॉलबैक मॉडल** सेट करें ताकि किसी प्रदाता पर दर सीमा लगने के दौरान भी OpenClaw उत्तर देता रहे।
    [मॉडल](/hi/cli/models), [OAuth](/hi/concepts/oauth), और
    [लंबे कॉन्टेक्स्ट के लिए Anthropic 429 अतिरिक्त उपयोग आवश्यक](/hi/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) देखें।

  </Accordion>

  <Accordion title="क्या AWS Bedrock समर्थित है?">
    हाँ। OpenClaw में बंडल किया हुआ **Amazon Bedrock (Converse)** प्रदाता है। AWS env
    मार्कर (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`) मौजूद होने पर,
    OpenClaw मॉडल खोज के लिए अंतर्निहित Bedrock प्रदाता को स्वतः सक्षम करता है; अन्यथा
    `plugins.entries.amazon-bedrock.config.discovery.enabled: true` सेट करें या मैन्युअल
    प्रदाता प्रविष्टि जोड़ें। [Amazon Bedrock](/hi/providers/bedrock) और [मॉडल प्रदाता](/hi/providers/models) देखें।
    यदि आप प्रबंधित कुंजी प्रवाह पसंद करते हैं, तो Bedrock के सामने OpenAI-संगत प्रॉक्सी भी एक वैध विकल्प है।
  </Accordion>

  <Accordion title="Codex प्रमाणीकरण कैसे काम करता है?">
    OpenClaw OAuth (ChatGPT साइन-इन) के माध्यम से **OpenAI Codex** का समर्थन करता है। प्राथमिक मॉडल के बिना नया
    सेटअप ChatGPT/Codex सदस्यता प्रमाणीकरण और नेटिव Codex app-server निष्पादन के लिए ठीक
    `openai/gpt-5.6-sol` का उपयोग करता है।
    पुनः प्रमाणीकरण मौजूदा स्पष्ट मॉडल को बनाए रखता है, जिसमें
    `openai/gpt-5.5` भी शामिल है। यदि Codex कार्यक्षेत्र GPT-5.6 उपलब्ध नहीं कराता, तो
    स्पष्ट रूप से `openai/gpt-5.5` चुनें; OpenClaw चुपचाप डाउनग्रेड नहीं करता। पुराने
    Codex-उपसर्ग वाले मॉडल संदर्भ पुराने कॉन्फ़िगरेशन हैं जिन्हें `openclaw doctor
    --fix` सुधारता है। गैर-एजेंट OpenAI
    API सतहों के लिए प्रत्यक्ष OpenAI API-कुंजी पहुँच उपलब्ध रहती है और क्रमबद्ध `openai` API-कुंजी प्रोफ़ाइल के माध्यम से एजेंट
    मॉडल के लिए भी उपलब्ध है। [मॉडल प्रदाता](/hi/concepts/model-providers) और
    [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।
  </Accordion>

  <Accordion title="OpenClaw अब भी पुराने OpenAI Codex उपसर्ग का उल्लेख क्यों करता है?">
    `openai` OpenAI API कुंजियों और ChatGPT/Codex OAuth दोनों के लिए वर्तमान प्रदाता और प्रमाणीकरण-प्रोफ़ाइल आईडी है -
    OpenAI Codex इसी में समाहित है। पुराने कॉन्फ़िगरेशन और माइग्रेशन चेतावनियों में आपको अब भी पुराना
    `openai-codex` उपसर्ग दिखाई दे सकता है:

    - `openai/gpt-5.6-sol` = एजेंट टर्न के लिए नेटिव Codex रनटाइम वाला नया ChatGPT/Codex सदस्यता सेटअप।
    - `openai/gpt-5.5` = मौजूदा कॉन्फ़िगरेशन या GPT-5.6 पहुँच के बिना खातों के लिए स्पष्ट समर्थित चयन।
    - पुराने `openai-codex/*` मॉडल संदर्भ = पुराना रूट, जिसे `openclaw doctor --fix` सुधारता है।
    - `openai/gpt-5.5` और क्रमबद्ध `openai` API-कुंजी प्रोफ़ाइल = OpenAI एजेंट मॉडल के लिए API-कुंजी प्रमाणीकरण।
    - पुराने `openai-codex` प्रमाणीकरण प्रोफ़ाइल आईडी = पुराने आईडी, जिन्हें `openclaw doctor --fix` माइग्रेट करता है।

    प्रत्यक्ष OpenAI Platform बिलिंग चाहिए? `OPENAI_API_KEY` सेट करें। ChatGPT/Codex
    सदस्यता प्रमाणीकरण चाहिए? `openclaw models auth login --provider openai` चलाएँ। मॉडल संदर्भों को
    प्रामाणिक `openai/*` प्रदाता के अंतर्गत रखें। नया सदस्यता
    सेटअप ठीक `openai/gpt-5.6-sol` का उपयोग करता है; doctor स्पष्ट `openai/gpt-5.5` चयन को अपग्रेड किए बिना पुराने Codex-उपसर्ग वाले
    संदर्भों को सुधारता है।

  </Accordion>

  <Accordion title="Codex OAuth की सीमाएँ ChatGPT वेब से अलग क्यों हो सकती हैं?">
    Codex OAuth, OpenAI द्वारा प्रबंधित प्लान-निर्भर कोटा अवधियों का उपयोग करता है, जो समान खाते पर भी
    ChatGPT वेबसाइट/ऐप के अनुभव से भिन्न हो सकती हैं।

    `openclaw models status` वर्तमान में दिखाई देने वाली प्रदाता उपयोग/कोटा अवधियाँ दिखाता है, लेकिन
    ChatGPT-वेब पात्रताओं को प्रत्यक्ष API पहुँच में गढ़ता या सामान्यीकृत नहीं करता। प्रत्यक्ष
    OpenAI Platform बिलिंग/सीमा पथ के लिए API कुंजी के साथ `openai/*` का उपयोग करें।

  </Accordion>

  <Accordion title="क्या आप OpenAI सदस्यता प्रमाणीकरण (Codex OAuth) का समर्थन करते हैं?">
    हाँ, पूरी तरह। OpenAI, OpenClaw जैसे बाहरी
    टूल/वर्कफ़्लो में सदस्यता OAuth के उपयोग की स्पष्ट अनुमति देता है। ऑनबोर्डिंग आपके लिए OAuth प्रवाह चला सकती है।

    [OAuth](/hi/concepts/oauth), [मॉडल प्रदाता](/hi/concepts/model-providers), और [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।

  </Accordion>

  <Accordion title="मैं Gemini CLI OAuth कैसे सेट अप करूँ?">
    Gemini CLI एक **Plugin प्रमाणीकरण प्रवाह** का उपयोग करता है, `openclaw.json` में क्लाइंट आईडी या सीक्रेट का नहीं।

    1. Gemini CLI को स्थानीय रूप से इंस्टॉल करें ताकि `gemini`, `PATH` पर उपलब्ध हो:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin सक्षम करें: `openclaw plugins enable google`
    3. लॉगिन करें: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. लॉगिन के बाद डिफ़ॉल्ट मॉडल: `google/gemini-3.1-pro-preview` (रनटाइम `google-gemini-cli`)
    5. लॉगिन के बाद अनुरोध विफल हो रहे हैं? Gateway होस्ट पर `GOOGLE_CLOUD_PROJECT` या `GOOGLE_CLOUD_PROJECT_ID` सेट करें और पुनः प्रयास करें।

    OAuth टोकन Gateway होस्ट पर प्रमाणीकरण प्रोफ़ाइल में संग्रहीत होते हैं। विवरण: [Google](/hi/providers/google), [मॉडल प्रदाता](/hi/concepts/model-providers)।

  </Accordion>

  <Accordion title="क्या सामान्य बातचीत के लिए स्थानीय मॉडल ठीक है?">
    आम तौर पर नहीं। OpenClaw को बड़ा कॉन्टेक्स्ट + मज़बूत सुरक्षा चाहिए; छोटे कार्ड कॉन्टेक्स्ट को काट देते हैं
    और प्रदाता-पक्ष के सुरक्षा फ़िल्टर छोड़ देते हैं। यदि आवश्यक हो, तो स्थानीय रूप से चला सकने वाला **सबसे बड़ा** मॉडल बिल्ड
    चलाएँ (LM Studio) - [स्थानीय मॉडल](/hi/gateway/local-models) देखें। छोटे/क्वांटाइज़्ड
    मॉडल प्रॉम्प्ट-इंजेक्शन का जोखिम बढ़ाते हैं - [सुरक्षा](/hi/gateway/security) देखें।
  </Accordion>

  <Accordion title="मैं होस्टेड मॉडल ट्रैफ़िक को किसी विशिष्ट क्षेत्र में कैसे रखूँ?">
    क्षेत्र से बँधे एंडपॉइंट चुनें। OpenRouter, MiniMax, Kimi,
    और GLM के लिए US में होस्ट किए गए विकल्प उपलब्ध कराता है; डेटा को क्षेत्र के भीतर रखने के लिए US में होस्ट किया गया वैरिएंट चुनें। आप `models.mode: "merge"` के साथ
    इनके अतिरिक्त Anthropic/OpenAI को भी सूचीबद्ध कर सकते हैं, ताकि आपके चुने हुए क्षेत्रीय प्रदाता का सम्मान करते हुए फ़ॉलबैक
    उपलब्ध रहें।
  </Accordion>

  <Accordion title="क्या इसे इंस्टॉल करने के लिए मुझे Mac Mini खरीदना होगा?">
    नहीं। OpenClaw macOS या Linux (WSL2 के माध्यम से Windows) पर चलता है। Mac mini एक लोकप्रिय
    हमेशा चालू रहने वाला होस्ट विकल्प है, लेकिन छोटा VPS, होम सर्वर या Raspberry Pi-श्रेणी का बॉक्स भी काम करता है।

    आपको Mac की आवश्यकता केवल **macOS-विशिष्ट टूल** के लिए है। iMessage के लिए, Messages में साइन-इन किए हुए किसी भी Mac पर
    `imsg` के साथ [iMessage](/hi/channels/imessage) का उपयोग करें - यदि Gateway Linux या कहीं और चलता है,
    तो `channels.imessage.cliPath` को ऐसे SSH रैपर पर सेट करें जो उस Mac पर `imsg` चलाता हो। अन्य
    macOS-विशिष्ट टूल के लिए Gateway को Mac पर चलाएँ या macOS Node को पेयर करें।

    दस्तावेज़: [iMessage](/hi/channels/imessage), [Nodes](/hi/nodes), [Mac रिमोट मोड](/hi/platforms/mac/remote)।

  </Accordion>

  <Accordion title="क्या iMessage समर्थन के लिए मुझे Mac mini चाहिए?">
    आपको Messages में साइन-इन किया हुआ **कोई macOS डिवाइस** चाहिए - आवश्यक नहीं कि वह Mac mini हो,
    कोई भी Mac काम करेगा। `imsg` के साथ [iMessage](/hi/channels/imessage) का उपयोग करें; Gateway उस
    Mac पर या कहीं और SSH रैपर `cliPath` के साथ चल सकता है।

    सामान्य सेटअप:

    - Linux/VPS पर Gateway, `channels.imessage.cliPath` को ऐसे SSH रैपर पर सेट किया गया हो जो Messages में साइन-इन किए हुए Mac पर `imsg` चलाता है।
    - सबसे सरल एकल-मशीन सेटअप के लिए सब कुछ एक Mac पर।

    दस्तावेज़: [iMessage](/hi/channels/imessage), [Nodes](/hi/nodes), [Mac रिमोट मोड](/hi/platforms/mac/remote)।

  </Accordion>

  <Accordion title="यदि मैं OpenClaw चलाने के लिए Mac mini खरीदूँ, तो क्या उसे अपने MacBook Pro से जोड़ सकता हूँ?">
    हाँ। **Mac mini Gateway चला सकता है**, और आपका MacBook Pro एक **Node**
    (सहायक डिवाइस) के रूप में जुड़ता है। Nodes Gateway नहीं चलाते - वे उस डिवाइस पर
    स्क्रीन/कैमरा/कैनवास और `system.run` जैसी क्षमताएँ जोड़ते हैं।

    सामान्य पैटर्न: हमेशा चालू रहने वाले Mac mini पर Gateway; MacBook Pro macOS ऐप या
    Node होस्ट चलाता है और Gateway से पेयर होता है। `openclaw nodes status` / `openclaw nodes list` से जाँचें।

    दस्तावेज़: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes)।

  </Accordion>

  <Accordion title="क्या मैं Bun का उपयोग कर सकता हूँ?">
    आप निर्भरताएँ इंस्टॉल करने या पैकेज स्क्रिप्ट चलाने के लिए Bun का उपयोग कर सकते हैं। OpenClaw CLI और
    Gateway को **Node** की आवश्यकता है क्योंकि प्रामाणिक स्टेट स्टोर `node:sqlite` का उपयोग करता है; Bun
    वह API प्रदान नहीं करता।
  </Accordion>

  <Accordion title="Telegram: allowFrom में क्या देना चाहिए?">
    `channels.telegram.allowFrom` **मानव प्रेषक की Telegram उपयोगकर्ता आईडी** (संख्यात्मक) है,
    बॉट का उपयोगकर्ता नाम नहीं। सेटअप केवल संख्यात्मक उपयोगकर्ता आईडी माँगता है; `openclaw doctor --fix`
    पुराने `@username` प्रविष्टियों को हल करने का प्रयास कर सकता है।

    अधिक सुरक्षित (कोई तृतीय-पक्ष बॉट नहीं): अपने बॉट को DM करें, `openclaw logs --follow` चलाएँ, `from.id` पढ़ें।

    आधिकारिक Bot API: अपने बॉट को DM करें, `https://api.telegram.org/bot<bot_token>/getUpdates` कॉल करें, `message.from.id` पढ़ें।

    तृतीय-पक्ष (कम निजी): `@userinfobot` या `@getidsbot` को DM करें।

    [Telegram पहुँच नियंत्रण](/hi/channels/telegram#access-control-and-activation) देखें।

  </Accordion>

  <Accordion title="क्या कई लोग अलग-अलग OpenClaw इंस्टेंस के साथ एक WhatsApp नंबर का उपयोग कर सकते हैं?">
    हाँ, **बहु-एजेंट रूटिंग** के माध्यम से। प्रत्येक प्रेषक के WhatsApp DM (`peer: { kind: "direct", id: "+15551234567" }`) को अलग `agentId` से बाँधें, जिससे प्रत्येक व्यक्ति को अपना कार्यक्षेत्र और सत्र स्टोर मिलता है। उत्तर अब भी **उसी WhatsApp खाते** से आते हैं; DM पहुँच नियंत्रण (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) प्रत्येक खाते के लिए वैश्विक है। [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent) और [WhatsApp](/hi/channels/whatsapp) देखें।
  </Accordion>

  <Accordion title='क्या मैं एक "तेज़ चैट" एजेंट और एक "कोडिंग के लिए Opus" एजेंट चला सकता हूँ?'>
    हाँ। बहु-एजेंट रूटिंग का उपयोग करें: प्रत्येक एजेंट को अपना डिफ़ॉल्ट मॉडल दें, फिर इनबाउंड
    रूट (प्रदाता खाता या विशिष्ट पीयर) प्रत्येक एजेंट से बाँधें। उदाहरण कॉन्फ़िगरेशन:
    [बहु-एजेंट रूटिंग](/hi/concepts/multi-agent)। [मॉडल](/hi/concepts/models) और
    [कॉन्फ़िगरेशन](/hi/gateway/configuration) भी देखें।
  </Accordion>

  <Accordion title="क्या Homebrew Linux पर काम करता है?">
    हाँ, Linuxbrew के माध्यम से:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    systemd के माध्यम से OpenClaw चलाते समय: सुनिश्चित करें कि सेवा PATH में
    `/home/linuxbrew/.linuxbrew/bin` (या आपका brew उपसर्ग) शामिल हो, ताकि `brew` से इंस्टॉल किए गए टूल
    गैर-लॉगिन शेल में मिल सकें। हाल के बिल्ड Linux
    systemd सेवाओं में सामान्य उपयोगकर्ता bin निर्देशिकाएँ (उदाहरण के लिए `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) भी आगे जोड़ते हैं और सेट होने पर `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, और `FNM_DIR` का सम्मान करते हैं।

  </Accordion>

  <Accordion title="संशोधनीय git इंस्टॉल और npm इंस्टॉल में अंतर">
    - **संशोधनीय (git) इंस्टॉल:** पूर्ण स्रोत चेकआउट, संपादन योग्य, योगदानकर्ताओं के लिए सर्वोत्तम। आप स्थानीय रूप से बिल्ड करते हैं और कोड/दस्तावेज़ में पैच कर सकते हैं।
    - **npm इंस्टॉल:** वैश्विक CLI इंस्टॉल, कोई रेपो नहीं, "बस इसे चलाएँ" के लिए सर्वोत्तम। अपडेट npm dist-tags से आते हैं।

    दस्तावेज़: [आरंभ करना](/hi/start/getting-started), [अपडेट करना](/hi/install/updating)।

  </Accordion>

  <Accordion title="क्या मैं बाद में npm और git इंस्टॉल के बीच स्विच कर सकता हूँ?">
    हाँ, मौजूदा इंस्टॉल पर `openclaw update --channel ...` के साथ। इससे **आपका डेटा
    नहीं मिटता**—केवल OpenClaw कोड इंस्टॉल बदलता है। स्थिति (`~/.openclaw`) और
    वर्कस्पेस (`~/.openclaw/workspace`) अपरिवर्तित रहते हैं।

    npm से git:

    ```bash
    openclaw update --channel dev
    ```

    git से npm:

    ```bash
    openclaw update --channel stable
    ```

    नियोजित मोड स्विच का पहले पूर्वावलोकन करने के लिए `--dry-run` जोड़ें। अपडेटर Doctor
    की अनुवर्ती कार्रवाइयाँ चलाता है, लक्ष्य चैनल के लिए Plugin स्रोतों को रीफ़्रेश करता है और Gateway को
    पुनः आरंभ करता है, जब तक कि आप `--no-restart` न दें।

    इंस्टॉलर किसी भी मोड को बाध्य भी कर सकता है:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    बैकअप सुझाव: [डिस्क पर चीज़ें कहाँ रहती हैं](/hi/help/faq#where-things-live-on-disk)।

  </Accordion>

  <Accordion title="क्या मुझे Gateway अपने लैपटॉप पर चलाना चाहिए या VPS पर?">
    24/7 विश्वसनीयता चाहिए? **VPS** का उपयोग करें। न्यूनतम झंझट चाहते हैं और
    स्लीप/पुनः आरंभ से कोई समस्या नहीं है? इसे स्थानीय रूप से चलाएँ।

    **लैपटॉप (स्थानीय Gateway)**

    - **लाभ:** सर्वर की कोई लागत नहीं, स्थानीय फ़ाइलों तक सीधी पहुँच, लाइव ब्राउज़र विंडो।
    - **हानियाँ:** स्लीप/नेटवर्क बाधाएँ इसे डिस्कनेक्ट कर देती हैं, OS अपडेट/रीबूट इसे बाधित करते हैं, मशीन को सक्रिय रखना आवश्यक है।

    **VPS / क्लाउड**

    - **लाभ:** हमेशा चालू, स्थिर नेटवर्क, लैपटॉप स्लीप की कोई समस्या नहीं, चालू रखना आसान।
    - **हानियाँ:** अक्सर हेडलेस (स्क्रीनशॉट का उपयोग करें), केवल दूरस्थ फ़ाइल पहुँच, अपडेट के लिए SSH आवश्यक।

    WhatsApp/Telegram/Slack/Mattermost/Discord सभी VPS से ठीक काम करते हैं—वास्तविक
    समझौता हेडलेस ब्राउज़र बनाम दृश्यमान विंडो का है। [ब्राउज़र](/hi/tools/browser) देखें।

    डिफ़ॉल्ट अनुशंसा: यदि पहले Gateway डिस्कनेक्ट हुए हैं, तो VPS; जब आप Mac का सक्रिय रूप से
    उपयोग कर रहे हों और स्थानीय फ़ाइल पहुँच या दृश्यमान-ब्राउज़र UI ऑटोमेशन चाहते हों, तो स्थानीय सेटअप
    बेहतरीन है।

  </Accordion>

  <Accordion title="OpenClaw को समर्पित मशीन पर चलाना कितना महत्वपूर्ण है?">
    आवश्यक नहीं है, लेकिन विश्वसनीयता और पृथक्करण के लिए अनुशंसित है।

    - **समर्पित होस्ट (VPS/Mac mini/Raspberry Pi):** हमेशा चालू, स्लीप/रीबूट से कम बाधाएँ, अधिक सुव्यवस्थित अनुमतियाँ, चालू रखना आसान।
    - **साझा लैपटॉप/डेस्कटॉप:** परीक्षण और सक्रिय उपयोग के लिए ठीक है, लेकिन मशीन के स्लीप या अपडेट होने पर रुकावटों की अपेक्षा करें।

    दोनों विकल्पों का सर्वोत्तम लाभ पाने के लिए: Gateway को समर्पित होस्ट पर रखें और स्थानीय
    स्क्रीन/कैमरा/एक्ज़ेक्यूशन टूल के लिए अपने लैपटॉप को **Node** के रूप में पेयर करें। [Nodes](/hi/nodes) और [सुरक्षा](/hi/gateway/security) देखें।

  </Accordion>

  <Accordion title="न्यूनतम VPS आवश्यकताएँ और अनुशंसित OS क्या हैं?">
    - **पूर्ण न्यूनतम:** 1 vCPU, 1 GB RAM, ~500 MB डिस्क।
    - **अनुशंसित:** अतिरिक्त क्षमता (लॉग, मीडिया, एकाधिक चैनल) के लिए 1-2 vCPU, 2 GB+ RAM। Node टूल और ब्राउज़र ऑटोमेशन बहुत संसाधन उपयोग कर सकते हैं।

    OS: **Ubuntu LTS** (या कोई आधुनिक Debian/Ubuntu)—सबसे अच्छी तरह परीक्षित Linux इंस्टॉल पथ।

    दस्तावेज़: [Linux](/hi/platforms/linux), [VPS होस्टिंग](/hi/vps)।

  </Accordion>

  <Accordion title="क्या मैं OpenClaw को VM में चला सकता हूँ और इसकी आवश्यकताएँ क्या हैं?">
    हाँ। VM को VPS की तरह मानें: इसे हमेशा चालू और पहुँच योग्य होना चाहिए तथा इसमें Gateway
    और आपके द्वारा सक्षम किए गए सभी चैनलों के लिए पर्याप्त RAM होनी चाहिए।

    - **पूर्ण न्यूनतम:** 1 vCPU, 1 GB RAM।
    - **अनुशंसित:** एकाधिक चैनलों, ब्राउज़र ऑटोमेशन या मीडिया टूल के लिए 2 GB+ RAM।
    - **OS:** Ubuntu LTS या कोई अन्य आधुनिक Debian/Ubuntu।

    Windows पर, डेस्कटॉप सेटअप के लिए **Windows Hub** या व्यापक टूलिंग संगतता वाली Linux-शैली की Gateway VM
    के लिए WSL2 का उपयोग करें। [Windows](/hi/platforms/windows), [VPS होस्टिंग](/hi/vps) देखें।
    VM में macOS चलाने के लिए: [macOS VM](/hi/install/macos-vm) देखें।

  </Accordion>
</AccordionGroup>

## संबंधित

- [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)—मुख्य FAQ (मॉडल, सत्र, Gateway, सुरक्षा और अधिक)
- [इंस्टॉल का अवलोकन](/hi/install)
- [आरंभ करना](/hi/start/getting-started)
- [समस्या निवारण](/hi/help/troubleshooting)
