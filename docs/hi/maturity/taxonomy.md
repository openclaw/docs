---
summary: OpenClaw परिपक्वता स्कोरकार्ड के आधारभूत उत्पाद क्षेत्रों और जाँचों का विस्तृत संदर्भ।
title: परिपक्वता वर्गीकरण
x-i18n:
    generated_at: "2026-07-19T08:57:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbed5794f43b230d8c8adb211734d93eb81f02623fe57df078e1dfd5a6d2586c
    source_path: maturity/taxonomy.md
    workflow: 16
---

# परिपक्वता वर्गीकरण

<div className="maturity-hero maturity-hero-compact">
  <p className="maturity-kicker">स्कोरकार्ड के पीछे का मॉडल</p>
  <p className="maturity-hero-title">सतहें &gt; श्रेणियाँ &gt; क्षमताएँ &gt; प्रमाण।</p>
  <p>4 समूहों में विभाजित 50 सतहें, जिनकी प्रत्येक श्रेणी प्रामाणिक दस्तावेज़ों और QA कवरेज ID से जुड़ी है।</p>
  <p className="maturity-jump-links"><a href="#product-areas">उत्पाद क्षेत्र देखें</a> / <a href="#taxonomy-details">विस्तृत वर्गीकरण खोलें</a> / <a href="/hi/maturity/scorecard">स्कोर देखें</a></p>
</div>

## इस पृष्ठ को कैसे पढ़ें

सतह कोई उत्पाद क्षेत्र है, जैसे Gateway रनटाइम, Discord या macOS ऐप। प्रत्येक सतह में श्रेणियाँ होती हैं और प्रत्येक श्रेणी में वे क्षमता-स्तरीय जाँचें होती हैं जिन्हें QA परिदृश्य कवर करते हैं। रिलीज़-स्तरीय आकलन के लिए स्कोरकार्ड का उपयोग करें; उसके आधारभूत मॉडल का निरीक्षण करने के लिए इस पृष्ठ का उपयोग करें।

## परिपक्वता स्तर

<div className="maturity-level-list">
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>नियोजित</span></span></span><span>दिशा ज्ञात है, लेकिन कोई समर्थित उपयोगकर्ता मार्ग मौजूद नहीं है।</span><span className="maturity-level-promotion">पदोन्नति: डिज़ाइन समस्या, स्वामी और लक्षित सतह मौजूद हैं।</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span></span><span>चेतावनियों, फ़्लैग, स्रोत बिल्ड या केवल अनुरक्षकों के लिए उपलब्ध प्रवाहों के पीछे कार्यान्वित।</span><span className="maturity-level-promotion">पदोन्नति: अनुरक्षक वर्तमान main से परिदृश्य चला सकता है।</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span></span><span>वास्तविक उपयोगकर्ता इसे आज़मा सकते हैं, लेकिन असंगत बदलाव और अपूर्ण UX अपेक्षित हैं।</span><span className="maturity-level-promotion">पदोन्नति: दस्तावेज़ीकृत सेटअप, बुनियादी परीक्षण, ज्ञात चेतावनियाँ और वास्तविक परिवेश का कम-से-कम एक प्रमाण।</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span></span><span>सार्वजनिक मार्ग मौजूद है और मुख्य कार्यप्रवाह सीमित चेतावनियों के साथ उपयोग योग्य है।</span><span className="maturity-level-promotion">पदोन्नति: इंस्टॉल/अपडेट दस्तावेज़, प्रतिगमन परीक्षण, सहायता रनबुक और अपेक्षित परिवेश में परिदृश्य का सफल प्रमाण।</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span></span><span>सामान्य उपयोगकर्ताओं के लिए अनुशंसित मार्ग। विफलताओं को प्रतिगमन माना जाता है।</span><span className="maturity-level-promotion">पदोन्नति: रिलीज़ गेट, डॉक्टर/समस्या-निवारण मार्ग, व्यापक दस्तावेज़ और वास्तविक दुनिया के बार-बार प्राप्त प्रमाण।</span></div>
  <div className="maturity-level-row"><span className="maturity-level-title"><span className="maturity-level-pill maturity-level-clawesome"><span className="maturity-level-code">M5</span><span>क्लॉसम</span></span></span><span>परिष्कृत, आनंददायक, सुव्यवस्थित निगरानी वाला और सर्वोत्तम तुलनीय कार्यप्रवाह के साथ प्रतिस्पर्धी।</span><span className="maturity-level-promotion">पदोन्नति: स्थिर स्तर के साथ प्रतिनिधि उपयोगकर्ताओं में उपयोगकर्ता स्कोरकार्ड उत्तीर्ण।</span></div>
</div>

## उत्पाद क्षेत्र

<a id="product-areas" />

<Tabs>
  <Tab title="मूल">

    <a className="maturity-surface-link" href="#cli">
      <span className="maturity-surface-title">CLI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>7 क्षेत्र - 90% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-runtime">
      <span className="maturity-surface-title">Gateway रनटाइम</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>13 क्षेत्र - 89% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#agent-runtime">
      <span className="maturity-surface-title">एजेंट रनटाइम</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#session-memory-and-context-engine">
      <span className="maturity-surface-title">सत्र, मेमोरी और संदर्भ इंजन</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#channel-framework">
      <span className="maturity-surface-title">चैनल फ़्रेमवर्क</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>8 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#observability">
      <span className="maturity-surface-title">प्रेक्षणीयता</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#gateway-web-app">
      <span className="maturity-surface-title">Gateway वेब ऐप</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#plugins">
      <span className="maturity-surface-title">Plugins</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>9 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#security-auth-pairing-and-secrets">
      <span className="maturity-surface-title">सुरक्षा, प्रमाणीकरण, पेयरिंग और सीक्रेट</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#automation-cron-hooks-tasks-polling">
      <span className="maturity-surface-title">स्वचालन: Cron, हुक, कार्य, पोलिंग</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#media-understanding-and-media-generation">
      <span className="maturity-surface-title">मीडिया की समझ और मीडिया निर्माण</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>6 क्षेत्र - 68% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-and-realtime-talk">
      <span className="maturity-surface-title">वॉइस और रीयल-टाइम वार्तालाप</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>6 क्षेत्र - 68% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#tui">
      <span className="maturity-surface-title">TUI</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र - 66% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#clawhub">
      <span className="maturity-surface-title">ClawHub</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>4 क्षेत्र - 62% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#openclaw-app-sdk">
      <span className="maturity-surface-title">OpenClaw ऐप SDK</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>6 क्षेत्र - 53% पूर्ण</span></span>
    </a>

  </Tab>
  <Tab title="प्लेटफ़ॉर्म">

    <a className="maturity-surface-link" href="#linux-gateway-host">
      <span className="maturity-surface-title">Linux Gateway होस्ट</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>5 क्षेत्र - 89% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-gateway-host">
      <span className="maturity-surface-title">macOS Gateway होस्ट</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>7 क्षेत्र - 88% पूर्ण</span></span>
    </a>
    <a className="maturity-surface-link" href="#android-app">
      <span className="maturity-surface-title">Android ऐप</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>7 क्षेत्र - 80% पूर्ण</span></span>
    </a>
    <a className="maturity-surface-link" href="#ios-app">
      <span className="maturity-surface-title">iOS ऐप</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>8 क्षेत्र - 80% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#docker-and-podman-hosting">
      <span className="maturity-surface-title">Docker और Podman होस्टिंग</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#windows-via-wsl2">
      <span className="maturity-surface-title">WSL2 के माध्यम से Windows</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>6 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#raspberry-pi-and-small-linux-devices">
      <span className="maturity-surface-title">Raspberry Pi और छोटे Linux उपकरण</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#macos-companion-app">
      <span className="maturity-surface-title">macOS सहायक ऐप</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>8 क्षेत्र - 78% पूर्ण</span></span>
    </a>


    <a className="maturity-surface-link" href="#native-windows">
      <span className="maturity-surface-title">नेटिव Windows</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>4 क्षेत्र - 66% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#kubernetes-hosting">
      <span className="maturity-surface-title">Kubernetes होस्टिंग</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>4 क्षेत्र - 61% पूर्ण</span></span>
    </a>


    <a className="maturity-surface-link" href="#nix-install-path">
      <span className="maturity-surface-title">Nix इंस्टॉल पथ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र - 44% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#watchos-companion-surfaces">
      <span className="maturity-surface-title">watchOS सहायक सतहें</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र - 44% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#linux-companion-app">
      <span className="maturity-surface-title">Linux सहायक ऐप</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>नियोजित</span></span><span>5 क्षेत्र - 21% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#native-windows-companion-app">
      <span className="maturity-surface-title">नेटिव Windows सहायक ऐप</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M0</span><span>नियोजित</span></span><span>5 क्षेत्र - 21% पूर्ण</span></span>
    </a>

  </Tab>
  <Tab title="चैनल">

    <a className="maturity-surface-link" href="#discord">
      <span className="maturity-surface-title">Discord</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-stable"><span className="maturity-level-code">M4</span><span>स्थिर</span></span><span>6 क्षेत्र - 87% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#telegram">
      <span className="maturity-surface-title">Telegram</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 78% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#slack">
      <span className="maturity-surface-title">Slack</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 78% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#imessage-and-bluebubbles">
      <span className="maturity-surface-title">iMessage और BlueBubbles</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 78% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#whatsapp">
      <span className="maturity-surface-title">WhatsApp</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 78% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#matrix">
      <span className="maturity-surface-title">Matrix</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>6 क्षेत्र - 67% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-chat">
      <span className="maturity-surface-title">Google Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र - 66% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#microsoft-teams">
      <span className="maturity-surface-title">Microsoft Teams</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र - 66% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#signal">
      <span className="maturity-surface-title">Signal</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र - 66% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels">
      <span className="maturity-surface-title">Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, क्षेत्रीय चैनल</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>4 क्षेत्र - 58% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat">
      <span className="maturity-surface-title">Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>4 क्षेत्र - 54% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#voice-call-channel">
      <span className="maturity-surface-title">वॉइस कॉल चैनल</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-experimental"><span className="maturity-level-code">M1</span><span>प्रायोगिक</span></span><span>5 क्षेत्र - 44% पूर्ण</span></span>
    </a>

  </Tab>
  <Tab title="प्रदाता और टूल">

    <a className="maturity-surface-link" href="#browser-automation-exec-and-sandbox-tools">
      <span className="maturity-surface-title">ब्राउज़र स्वचालन, exec और सैंडबॉक्स टूल</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>3 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#openai-and-codex-provider-path">
      <span className="maturity-surface-title">OpenAI और Codex प्रदाता पथ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#web-search-tools">
      <span className="maturity-surface-title">वेब खोज टूल</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र - 79% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#anthropic-provider-path">
      <span className="maturity-surface-title">Anthropic प्रदाता पथ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 78% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#google-provider-path">
      <span className="maturity-surface-title">Google प्रदाता पथ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>5 क्षेत्र - 78% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#openrouter-provider-path">
      <span className="maturity-surface-title">OpenRouter प्रदाता पथ</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-beta"><span className="maturity-level-code">M3</span><span>बीटा</span></span><span>4 क्षेत्र - 78% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#image-video-and-music-generation-tools">
      <span className="maturity-surface-title">छवि, वीडियो और संगीत निर्माण टूल</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र - 68% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#local-model-providers-ollama-vllm-sglang-lm-studio">
      <span className="maturity-surface-title">स्थानीय मॉडल प्रदाता: Ollama, vLLM, SGLang, LM Studio</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>5 क्षेत्र - 68% पूर्ण</span></span>
    </a>

    <a className="maturity-surface-link" href="#long-tail-hosted-providers">
      <span className="maturity-surface-title">लॉन्ग-टेल होस्टेड प्रदाता</span>
      <span className="maturity-surface-meta"><span className="maturity-level-pill maturity-level-alpha"><span className="maturity-level-code">M2</span><span>अल्फ़ा</span></span><span>3 क्षेत्र - 68% पूर्ण</span></span>
    </a>

  </Tab>
</Tabs>

## विवरण

<a id="taxonomy-details" />

### कोर

<AccordionGroup>
  <Accordion title="CLI - M4 स्थिर - 7 क्षेत्र">
    <a id="cli" />

    सामान्य सेटअप और सुधार पथ इंस्टॉल, CLI और Gateway दस्तावेज़ों में प्रलेखित हैं। प्लेटफ़ॉर्म-विशिष्ट Windows पथ WSL2 के माध्यम से Windows और नेटिव Windows पंक्तियों में ट्रैक किए जाते हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 4%</span><span>गुणवत्ता स्थिर - 83%</span><span>पूर्णता स्थिर - 90%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI सेटअप</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/install/index), [इंस्टॉलर](/hi/install/installer), [Node](/hi/install/node), [अपडेट करना](/hi/install/updating)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ऑनबोर्डिंग और प्रमाणीकरण सेटअप</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [ऑनबोर्ड करें](/hi/cli/onboard), [कॉन्फ़िगर करें](/hi/cli/configure), [ऑनबोर्डिंग अवलोकन](/hi/start/onboarding-overview)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin और चैनल सेटअप</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [ऑनबोर्ड करें](/hi/cli/onboard), [Plugins](/hi/cli/plugins), [चैनल](/hi/cli/channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway सेवा प्रबंधन</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Gateway](/hi/cli/gateway), [अपडेट करना](/hi/install/updating), [समस्या निवारण](/hi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI अवलोकनीयता</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [स्थिति](/hi/cli/status), [स्वास्थ्य](/hi/cli/health), [लॉग](/hi/cli/logs), [निदान](/hi/gateway/diagnostics)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">डॉक्टर</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [डॉक्टर](/hi/cli/doctor), [डॉक्टर](/hi/gateway/doctor), [गोपनीय जानकारी](/hi/gateway/secrets), [समस्या निवारण](/hi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">अपडेट और अपग्रेड</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अपडेट करना](/hi/install/updating), [अपडेट](/hi/cli/update), [समस्या निवारण](/hi/gateway/troubleshooting)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Gateway रनटाइम - M4 स्थिर - 13 क्षेत्र">
    <a id="gateway-runtime" />

    मुख्य आर्किटेक्चर, प्रमाणीकरण, पेयरिंग, प्रोटोकॉल दस्तावेज़, डेमन दस्तावेज़ और CLI रनबुक व्यापक तथा वर्तमान हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 6%</span><span>गुणवत्ता स्थिर - 81%</span><span>पूर्णता स्थिर - 89%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 12</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्वीकृतियाँ और दूरस्थ निष्पादन</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [अनुक्रमणिका](/hi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">HTTP API</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/gateway/index), [OpenAI HTTP API](/hi/gateway/openai-http-api), [OpenResponses HTTP API](/hi/gateway/openresponses-http-api), [टूल आह्वान HTTP API](/hi/gateway/tools-invoke-http-api), [हुक](/hi/automation/hooks), [अनुक्रमणिका](/hi/web/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">होस्ट किया गया वेब इंटरफ़ेस</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/gateway/index), [आर्किटेक्चर](/hi/concepts/architecture), [नियंत्रण UI](/hi/web/control-ui), [वेबचैट](/hi/web/webchat), [कैनवास](/hi/refactor/canvas)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway RPC API और इवेंट</span>
          <span>20 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>9%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "9%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [अनुक्रमणिका](/hi/gateway/index), [आर्किटेक्चर](/hi/concepts/architecture)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">डिवाइस प्रमाणीकरण और युग्मन</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [युग्मन](/hi/gateway/pairing), [अनुक्रमणिका](/hi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटवर्क अभिगम और खोज</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/gateway/index), [खोज](/hi/gateway/discovery), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Node और दूरस्थ क्षमताएँ</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [आर्किटेक्चर](/hi/concepts/architecture), [अनुक्रमणिका](/hi/nodes/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्वास्थ्य, निदान और सुधार</span>
          <span>7 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/gateway/index), [निदान](/hi/gateway/diagnostics), [डॉक्टर](/hi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रोटोकॉल संगतता</span>
          <span>7 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [आर्किटेक्चर](/hi/concepts/architecture), [TypeBox](/hi/concepts/typebox), [ब्रिज प्रोटोकॉल](/hi/gateway/bridge-protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">भूमिकाएँ और अनुमतियाँ</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [सूची](/hi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway जीवनचक्र</span>
          <span>7 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सूची](/hi/gateway/index), [वास्तुकला](/hi/concepts/architecture)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सुरक्षा नियंत्रण</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सूची](/hi/gateway/security/index), [प्रोटोकॉल](/hi/gateway/protocol), [खोज](/hi/gateway/discovery)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WebSocket कनेक्शन</span>
          <span>8 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>90%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "90%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [वास्तुकला](/hi/concepts/architecture)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="एजेंट रनटाइम - M3 बीटा - 9 क्षेत्र">
    <a id="agent-runtime" />

    मुख्य लूप, मॉडल, प्रदाता रूटिंग और टूल स्ट्रीमिंग प्रथम-श्रेणी के हैं, लेकिन प्रदाता व्यवहार हर सप्ताह बदलता है और प्रत्येक रिलीज़ के लिए परिदृश्य प्रमाण आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रयोगात्मक - 33%</span><span>गुणवत्ता बीटा - 78%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">एजेंट टर्न निष्पादन</span>
          <span>3 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [एजेंट लूप](/hi/concepts/agent-loop), [एजेंट](/hi/cli/agent), [एजेंट रनटाइम](/hi/concepts/agent-runtimes)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">बाहरी रनटाइम और उप-एजेंट</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [एजेंट रनटाइम](/hi/concepts/agent-runtimes), [Anthropic](/hi/providers/anthropic), [Google](/hi/providers/google), [उप-एजेंट](/hi/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">होस्टेड प्रदाता निष्पादन</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/hi/providers/openai), [Anthropic](/hi/providers/anthropic), [Google](/hi/providers/google), [मॉडल](/hi/concepts/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थानीय और स्वयं-होस्टेड प्रदाता</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ollama](/hi/providers/ollama), [मॉडल](/hi/concepts/models), [एजेंट](/hi/cli/agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मॉडल और रनटाइम चयन</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मॉडल](/hi/concepts/models), [मॉडल](/hi/cli/models), [OpenAI](/hi/providers/openai), [एजेंट रनटाइम](/hi/concepts/agent-runtimes)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता प्रमाणीकरण</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>24%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "24%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मॉडल](/hi/concepts/models), [एजेंट](/hi/cli/agent), [मॉडल](/hi/cli/models), [OpenAI](/hi/providers/openai), [Anthropic](/hi/providers/anthropic), [Google](/hi/providers/google), [उप-एजेंट](/hi/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्ट्रीमिंग और प्रगति</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [स्ट्रीमिंग](/hi/concepts/streaming), [एजेंट लूप](/hi/concepts/agent-loop)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">टूल कॉल और प्रतिक्रिया प्रबंधन</span>
          <span>3 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>65%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "65%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [एजेंट लूप](/hi/concepts/agent-loop), [Ollama](/hi/providers/ollama)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">टूल निष्पादन नियंत्रण</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सैंडबॉक्स बनाम टूल नीति बनाम उन्नत](/hi/gateway/sandbox-vs-tool-policy-vs-elevated), [एजेंट लूप](/hi/concepts/agent-loop), [उप-एजेंट](/hi/tools/subagents)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="सेशन, मेमोरी और कॉन्टेक्स्ट इंजन - M3 बीटा - 9 क्षेत्र">
    <a id="session-memory-and-context-engine" />

    सुदृढ़ दस्तावेज़ और सक्रिय कार्यान्वयन। परिपक्वता ट्रांसक्रिप्ट के टिकाऊपन, Compaction की गुणवत्ता और विभिन्न क्लाइंट के बीच समानता पर निर्भर करती है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 30%</span><span>गुणवत्ता बीटा - 77%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 6</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI सेशन और ट्रांसक्रिप्ट प्रबंधन</span>
          <span>2 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सेशन](/hi/concepts/session), [सेशन प्रबंधन Compaction](/hi/reference/session-management-compaction), [सेशन](/hi/cli/sessions)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">टोकन प्रबंधन</span>
          <span>3 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>20%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "20%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Compaction](/hi/concepts/compaction), [कॉन्टेक्स्ट](/hi/concepts/context), [सेशन प्रबंधन Compaction](/hi/reference/session-management-compaction)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कॉन्टेक्स्ट इंजन</span>
          <span>2 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>57%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "57%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [कॉन्टेक्स्ट](/hi/concepts/context), [कॉन्टेक्स्ट इंजन](/hi/concepts/context-engine)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">क्लाइंट-पार इतिहास और सत्र समानता</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वेबचैट](/hi/web/webchat), [Android](/hi/platforms/android), [चैनल रूटिंग](/hi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">निदान, रखरखाव और पुनर्प्राप्ति</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [निदान](/hi/gateway/diagnostics), [सत्र प्रबंधन Compaction](/hi/reference/session-management-compaction), [फ़्लैग](/hi/diagnostics/flags)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मुख्य प्रॉम्प्ट और संदर्भ</span>
          <span>2 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [संदर्भ](/hi/concepts/context), [ट्रांसक्रिप्ट स्वच्छता](/hi/reference/transcript-hygiene), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मेमोरी</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मेमोरी कॉन्फ़िगरेशन](/hi/reference/memory-config), [मेमोरी Qmd](/hi/concepts/memory-qmd), [मेमोरी](/hi/concepts/memory), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सत्र रूटिंग</span>
          <span>2 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सत्र](/hi/concepts/session), [चैनल रूटिंग](/hi/channels/channel-routing), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ट्रांसक्रिप्ट स्थायित्व</span>
          <span>2 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सत्र प्रबंधन Compaction](/hi/reference/session-management-compaction), [ट्रांसक्रिप्ट स्वच्छता](/hi/reference/transcript-hygiene)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="चैनल फ़्रेमवर्क - M3 बीटा - 8 क्षेत्र">
    <a id="channel-framework" />

    कई चैनल Gateway डिलीवरी और रूटिंग अनुबंध साझा करते हैं, लेकिन चैनल का व्यवहार अपस्ट्रीम API और खाता-नीति की बाधाओं के अनुसार अलग-अलग होता है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 13%</span><span>गुणवत्ता बीटा - 76%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल कार्रवाइयाँ, कमांड और अनुमोदन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [समूह](/hi/channels/groups), [Discord](/hi/channels/discord), [Google Chat](/hi/channels/googlechat), [Signal](/hi/channels/signal), [Matrix](/hi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/channels/index), [पेयरिंग](/hi/channels/pairing), [समस्या निवारण](/hi/channels/troubleshooting), [SDK चैनल Plugins](/hi/plugins/sdk-channel-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">समूह थ्रेड और परिवेशी कक्ष व्यवहार</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>36%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "36%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [समूह](/hi/channels/groups), [समूह संदेश](/hi/channels/group-messages), [परिवेशी कक्ष घटनाएँ](/hi/channels/ambient-room-events), [प्रसारण समूह](/hi/channels/broadcast-groups), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">आवक पहुँच और पहचान द्वार</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [पहुँच समूह](/hi/channels/access-groups), [समूह](/hi/channels/groups), [Discord](/hi/channels/discord), [LINE](/hi/channels/line)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया अनुलग्नक और समृद्ध चैनल डेटा</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [LINE](/hi/channels/line), [Signal](/hi/channels/signal), [Google Chat](/hi/channels/googlechat), [Matrix](/hi/channels/matrix), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">जावक वितरण और उत्तर पाइपलाइन</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [समूह](/hi/channels/groups), [परिवेशी कक्ष घटनाएँ](/hi/channels/ambient-room-events), [Discord](/hi/channels/discord), [Matrix](/hi/channels/matrix), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और वितरण</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [चैनल रूटिंग](/hi/channels/channel-routing), [समूह](/hi/channels/groups), [Discord](/hi/channels/discord), [Matrix](/hi/channels/matrix), [समस्या निवारण](/hi/channels/troubleshooting), [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थिति स्वास्थ्य और ऑपरेटर नियंत्रण</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [स्वास्थ्य](/hi/gateway/health), [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference), [समस्या निवारण](/hi/channels/troubleshooting), [Discord](/hi/channels/discord)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="अवलोकनीयता - M3 बीटा - 5 क्षेत्र">
    <a id="observability" />

    OTel, Prometheus, लॉगिंग और निदान के दस्तावेज़ उपलब्ध हैं। सार्वजनिक रूप से "ऑपरेटरों को सबसे पहले क्या देखना चाहिए" परिपक्वता समीक्षा की आवश्यकता है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 18%</span><span>गुणवत्ता बीटा - 75%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्वास्थ्य और सुधार</span>
          <span>12 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>28%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "28%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [स्वास्थ्य](/hi/gateway/health), [Telegram](/hi/channels/telegram), [डॉक्टर](/hi/cli/doctor), [डॉक्टर](/hi/gateway/doctor), [SDK उपपथ](/hi/plugins/sdk-subpaths), [स्वास्थ्य](/hi/cli/health), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">लॉगिंग</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [लॉगिंग](/hi/logging), [लॉगिंग](/hi/gateway/logging), [लॉग](/hi/cli/logs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नैदानिक संग्रह</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>30%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "30%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [निदान](/hi/gateway/diagnostics), [स्वास्थ्य](/hi/gateway/health), [Codex हार्नेस](/hi/plugins/codex-harness), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">टेलीमेट्री निर्यात</span>
          <span>13 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>33%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "33%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [हुक](/hi/plugins/hooks), [ओपनटेलीमेट्री](/hi/gateway/opentelemetry), [लॉगिंग](/hi/logging), [SDK उप-पथ](/hi/plugins/sdk-subpaths), [निदान ओटेल](/hi/plugins/reference/diagnostics-otel), [प्रोमेथियस](/hi/gateway/prometheus), [निदान प्रोमेथियस](/hi/plugins/reference/diagnostics-prometheus)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सत्र निदान</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [ओपनटेलीमेट्री](/hi/gateway/opentelemetry), [प्रोमेथियस](/hi/gateway/prometheus), [निदान](/hi/gateway/diagnostics), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Gateway वेब ऐप - M3 बीटा - 6 क्षेत्र">
    <a id="gateway-web-app" />

    वेब UI का दस्तावेज़ीकरण पेयरिंग, चैट, PWA, टॉक, पुश और रिमोट Gateway प्रवाहों के साथ किया गया है। क्रॉस-ब्राउज़र और मोबाइल-PWA स्कोरकार्ड के बाद इसे उन्नत करें।

    <div className="maturity-surface-rollup"><span>कवरेज प्रयोगात्मक - 4%</span><span>गुणवत्ता बीटा - 74%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ब्राउज़र रीयलटाइम वार्तालाप</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [नियंत्रण UI](/hi/web/control-ui), [प्रोटोकॉल](/hi/gateway/protocol), [वार्तालाप](/hi/nodes/talk)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ब्राउज़र पहुँच और विश्वास</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [नियंत्रण UI](/hi/web/control-ui), [डैशबोर्ड](/hi/web/dashboard), [Tailscale](/hi/gateway/tailscale), [रिमोट](/hi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कॉन्फ़िगरेशन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [नियंत्रण UI](/hi/web/control-ui), [कॉन्फ़िगरेशन](/hi/gateway/configuration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ब्राउज़र UI</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [नियंत्रण UI](/hi/web/control-ui), [सूचकांक](/hi/web/index), [डैशबोर्ड](/hi/web/dashboard), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WebChat वार्तालाप</span>
          <span>15 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>10%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "10%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [नियंत्रण UI](/hi/web/control-ui), [Webchat](/hi/web/webchat), [आरंभ करना](/hi/start/getting-started), [चैनल रूटिंग](/hi/channels/channel-routing), [सुरक्षित फ़ाइल संचालन](/hi/gateway/security/secure-file-operations)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ऑपरेटर कंसोल</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>8%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "8%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [नियंत्रण UI](/hi/web/control-ui), [स्वास्थ्य](/hi/gateway/health), [प्रोटोकॉल](/hi/gateway/protocol), [डैशबोर्ड](/hi/web/dashboard)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Plugins - M3 बीटा - 9 क्षेत्र">
    <a id="plugins" />

    मैनिफ़ेस्ट, खोज, लोडिंग, प्रदाता/टूल आर्किटेक्चर और अनुमोदन सीमाओं के लिए व्यापक दस्तावेज़ और सुदृढ़ आंतरिक रनटाइम प्रमाण उपलब्ध हैं। सार्वजनिक SDK API/उपपथों और बाहरी वितरण के प्रमाण अधिक सुदृढ़ होने तक इस पंक्ति को बीटा पर रखें।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 12%</span><span>गुणवत्ता बीटा - 72%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 7</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins का निर्माण और पैकेजिंग</span>
          <span>8 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugins बनाना](/hi/plugins/building-plugins), [SDK अवलोकन](/hi/plugins/sdk-overview), [SDK प्रवेश-बिंदु](/hi/plugins/sdk-entrypoints), [SDK उपपथ](/hi/plugins/sdk-subpaths), [मैनिफ़ेस्ट](/hi/plugins/manifest), [संदर्भ](/hi/plugins/reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">बंडल किए गए Plugins</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin सूची](/hi/plugins/plugin-inventory), [Plugins](/hi/cli/plugins), [आर्किटेक्चर के आंतरिक भाग](/hi/plugins/architecture-internals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Canvas Plugin</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Canvas](/hi/plugins/reference/canvas), [Canvas](/hi/refactor/canvas), [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins इंस्टॉल करना और चलाना</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>35%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "35%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [आर्किटेक्चर](/hi/plugins/architecture), [आर्किटेक्चर के आंतरिक भाग](/hi/plugins/architecture-internals), [Plugins](/hi/cli/plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल Plugins</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK चैनल Plugins](/hi/plugins/sdk-channel-plugins), [SDK चैनल इनबाउंड](/hi/plugins/sdk-channel-inbound), [SDK चैनल आउटबाउंड](/hi/plugins/sdk-channel-outbound)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता और टूल Plugins</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>43%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "43%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK प्रदाता Plugins](/hi/plugins/sdk-provider-plugins), [टूल Plugins](/hi/plugins/tool-plugins), [क्षमताएँ जोड़ना](/hi/plugins/adding-capabilities)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin अनुमोदन</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin अनुमति अनुरोध](/hi/plugins/plugin-permission-requests), [निष्पादन अनुमोदन](/hi/tools/exec-approvals), [SDK चैनल Plugins](/hi/plugins/sdk-channel-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins प्रकाशित करना</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugins](/hi/cli/plugins), [संगतता](/hi/plugins/compatibility), [प्रकाशन](/hi/clawhub/publishing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugins का परीक्षण</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>27%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "27%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [SDK परीक्षण](/hi/plugins/sdk-testing), [SDK सेटअप](/hi/plugins/sdk-setup), [Codex हार्नेस](/hi/plugins/codex-harness)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="सुरक्षा, प्रमाणीकरण, पेयरिंग और सीक्रेट्स - M3 बीटा - 6 क्षेत्र">
    <a id="security-auth-pairing-and-secrets" />

    अच्छे दस्तावेज़ और सुदृढ़ीकरण सतहें उपलब्ध हैं। नियमित अपग्रेड/सुरक्षा परिदृश्य रन द्वारा यह सिद्ध होने के बाद प्रचारित करें कि सेटअप में कोई रिग्रेशन नहीं है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 16%</span><span>गुणवत्ता बीटा - 72%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">अनुमोदन नीति और टूल सुरक्षा उपाय</span>
          <span>2 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [निष्पादन अनुमोदन](/hi/tools/exec-approvals), [अनुमोदन](/hi/cli/approvals), [Plugin अनुमति अनुरोध](/hi/plugins/plugin-permission-requests), [ऑडिट जाँच](/hi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway प्रमाणीकरण और रिमोट एक्सेस</span>
          <span>9 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/gateway/security/index), [एक्सपोज़र रनबुक](/hi/gateway/security/exposure-runbook), [विश्वसनीय प्रॉक्सी प्रमाणीकरण](/hi/gateway/trusted-proxy-auth), [Tailscale](/hi/gateway/tailscale), [रिमोट](/hi/gateway/remote), [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference), [Gateway](/hi/cli/gateway), [डॉक्टर](/hi/cli/doctor), [कंट्रोल UI](/hi/web/control-ui), [ब्राउज़र नियंत्रण](/hi/tools/browser-control), [ऑडिट जाँच](/hi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल एक्सेस नियंत्रण</span>
          <span>3 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [पेयरिंग](/hi/channels/pairing), [Telegram](/hi/channels/telegram), [एक्सेस समूह](/hi/channels/access-groups), [ऑडिट जाँच](/hi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">डिवाइस और Node पेयरिंग</span>
          <span>11 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रोटोकॉल](/hi/gateway/protocol), [डिवाइस](/hi/cli/devices), [पेयरिंग](/hi/channels/pairing), [पेयरिंग](/hi/gateway/pairing), [ऑपरेटर स्कोप](/hi/gateway/operator-scopes), [कंट्रोल UI](/hi/web/control-ui), [वेबचैट](/hi/web/webchat), [अनुमोदन](/hi/cli/approvals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin विश्वसनीयता</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मैनिफ़ेस्ट](/hi/plugins/manifest), [Plugin अनुमति अनुरोध](/hi/plugins/plugin-permission-requests), [Plugins प्रबंधित करें](/hi/plugins/manage-plugins), [ऑडिट जाँच](/hi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">क्रेडेंशियल और सीक्रेट की स्वच्छता</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>46%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "46%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रमाणीकरण](/hi/gateway/authentication), [मॉडल](/hi/cli/models), [OpenAI](/hi/providers/openai), [OAuth](/hi/concepts/oauth), [सीक्रेट](/hi/gateway/secrets), [सीक्रेट](/hi/cli/secrets), [Secretref क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface), [ऑडिट जाँच](/hi/gateway/security/audit-checks)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ऑटोमेशन: Cron, हुक, टास्क, पोलिंग - M3 बीटा - 6 क्षेत्र">
    <a id="automation-cron-hooks-tasks-polling" />

    प्रलेखित और उपयोग योग्य है, लेकिन परिदृश्य प्रमाण में बिना निगरानी की डिलीवरी, पुनः प्रयास और विफलता की दृश्यता शामिल होनी चाहिए।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 2%</span><span>गुणवत्ता बीटा - 72%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Cron जॉब</span>
          <span>15 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Cron जॉब](/hi/automation/cron-jobs), [Cron](/hi/cli/cron), [प्रोटोकॉल](/hi/gateway/protocol), [टास्क](/hi/automation/tasks), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">इवेंट इनग्रेस</span>
          <span>15 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/hi/channels/telegram), [Zalo](/hi/channels/zalo), [समस्या निवारण](/hi/channels/troubleshooting), [BlueBubbles से iMessage](/hi/channels/imessage-from-bluebubbles), [Gmail Pubsub एकीकरण](/hi/automation/cron-jobs#gmail-pubsub-integration), [Gmail Pubsub](/hi/automation/cron-jobs), [Webhook](/hi/cli/webhooks), [Webhook](/hi/automation/cron-jobs#webhooks), [Webhook](/hi/automation/cron-jobs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ऑटोमेशन हुक</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [हुक](/hi/automation/hooks), [हुक](/hi/cli/hooks), [हुक](/hi/plugins/hooks), [Plugin अनुमति अनुरोध](/hi/plugins/plugin-permission-requests), [SDK उपपथ](/hi/plugins/sdk-subpaths)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">बैकग्राउंड टास्क और प्रवाह</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [टास्क](/hi/automation/tasks), [अनुक्रमणिका](/hi/automation/index), [टास्क](/hi/cli/tasks), [TaskFlow](/hi/automation/taskflow), [SDK रनटाइम](/hi/plugins/sdk-runtime)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Heartbeat</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>14%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "14%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/automation/index), [Heartbeat](/hi/gateway/heartbeat), [प्रतिबद्धताएँ](/hi/concepts/commitments)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पोलिंग नियंत्रण</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [पोल](/hi/cli/message), [संदेश](/hi/cli/message), [Telegram](/hi/channels/telegram), [Microsoft Teams](/hi/channels/msteams), [बैकग्राउंड प्रक्रिया](/hi/gateway/background-process)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="मीडिया की समझ और मीडिया निर्माण - M2 अल्फ़ा - 6 क्षेत्र">
    <a id="media-understanding-and-media-generation" />

    क्षमताओं का व्यापक दायरा मौजूद है, लेकिन प्रदाताओं के बीच भिन्नता, फ़ाइल सीमाएँ और Node/ऐप समानता के कारण यह अभी स्थिर नहीं है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 2%</span><span>गुणवत्ता अल्फ़ा - 64%</span><span>पूर्णता अल्फ़ा - 68%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया ग्रहण और पहुँच</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मीडिया अवलोकन](/hi/tools/media-overview), [मीडिया समझ](/hi/nodes/media-understanding), [सुरक्षित फ़ाइल संचालन](/hi/gateway/security/secure-file-operations), [PDF](/hi/tools/pdf), [छवि निर्माण](/hi/tools/image-generation), [QR](/hi/cli/qr), [LINE](/hi/channels/line), [WhatsApp](/hi/channels/whatsapp)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल मीडिया प्रबंधन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [छवियाँ](/hi/nodes/images), [मीडिया अवलोकन](/hi/tools/media-overview), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया कॉन्फ़िगरेशन</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मीडिया अवलोकन](/hi/tools/media-overview), [छवि निर्माण](/hi/tools/image-generation), [मैनिफ़ेस्ट](/hi/plugins/manifest), [Codex हार्नेस](/hi/plugins/codex-harness)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">टेक्स्ट-टू-स्पीच वितरण</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TTS](/hi/tools/tts), [मीडिया अवलोकन](/hi/tools/media-overview), [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया समझ</span>
          <span>12 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>7%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "7%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [ऑडियो](/hi/nodes/audio), [मीडिया समझ](/hi/nodes/media-understanding), [मीडिया अवलोकन](/hi/tools/media-overview), [WhatsApp](/hi/channels/whatsapp), [छवियाँ](/hi/nodes/images), [अनुमान](/hi/cli/infer), [PDF](/hi/tools/pdf)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया निर्माण</span>
          <span>17 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>5%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "5%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>69%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "69%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [छवि निर्माण](/hi/tools/image-generation), [मीडिया अवलोकन](/hi/tools/media-overview), [Skills](/hi/tools/skills), [संगीत निर्माण](/hi/tools/music-generation), [वीडियो निर्माण](/hi/tools/video-generation)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="वॉइस और रीयल-टाइम वार्ता - M2 अल्फ़ा - 6 क्षेत्र">
    <a id="voice-and-realtime-talk" />

    Control UI, ऐप्स और प्रदाताओं में कई कार्यान्वयन मौजूद हैं। बीटा से पहले विलंबता, विफलता-मोड और सेटअप स्कोरकार्ड आवश्यक हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 61%</span><span>पूर्णता अल्फ़ा - 68%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्ता प्रदाता</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/hi/providers/openai), [Google](/hi/providers/google), [SDK प्रदाता Plugins](/hi/plugins/sdk-provider-plugins), [वार्ता](/hi/nodes/talk), [Control UI](/hi/web/control-ui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रीयलटाइम वार्ता सत्र</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वार्ता](/hi/nodes/talk), [नियंत्रण UI](/hi/web/control-ui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वाक् और लिप्यंतरण</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वार्ता](/hi/nodes/talk), [OpenAI](/hi/providers/openai), [Google](/hi/providers/google)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटिव ऐप वार्ता</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वार्ता](/hi/nodes/talk), [वॉइसवेक](/hi/platforms/mac/voicewake)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वॉइस वेक और रूटिंग</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वॉइसवेक](/hi/nodes/voicewake), [वॉइसवेक](/hi/platforms/mac/voicewake), [वॉइस ओवरले](/hi/platforms/mac/voice-overlay)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्ता प्रेक्षणीयता</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [नियंत्रण UI](/hi/web/control-ui), [वॉइस ओवरले](/hi/platforms/mac/voice-overlay), [वार्ता](/hi/nodes/talk)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="TUI - M2 अल्फ़ा - 5 क्षेत्र">
    <a id="tui" />

    दस्तावेज़ों और स्रोत में मौजूद है, लेकिन प्राथमिक उपयोगकर्ता कार्यप्रवाह के रूप में कम दिखाई देता है। स्पष्ट परिदृश्य परिभाषा आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 59%</span><span>पूर्णता अल्फ़ा - 66%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रनटाइम मोड</span>
          <span>14 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/hi/cli/tui), [TUI](/hi/web/tui), [अनुक्रमणिका](/hi/cli/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">इनपुट और कमांड</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/hi/web/tui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सत्र प्रबंधन</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/hi/web/tui), [सत्र](/hi/cli/sessions)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थानीय शेल निष्पादन</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/hi/web/tui), [TUI](/hi/cli/tui)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रेंडरिंग और आउटपुट सुरक्षा</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [TUI](/hi/web/tui), [QR](/hi/cli/qr), [लॉग](/hi/cli/logs), [पूर्णता](/hi/cli/completion)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="ClawHub - M2 अल्फ़ा - 4 क्षेत्र">
    <a id="clawhub" />

    सार्वजनिक दस्तावेज़ और इकोसिस्टम की अवधारणा मौजूद हैं। इंस्टॉलेशन, विश्वसनीयता, अपडेट, रोलबैक और संगतता स्कोरकार्ड की आवश्यकता है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 58%</span><span>पूर्णता अल्फ़ा - 62%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रकाशन</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रकाशन](/hi/clawhub/publishing), [Skills बनाना](/hi/tools/creating-skills), [समुदाय](/hi/plugins/community)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कैटलॉग खोज</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/hi/tools/plugin), [Plugins](/hi/cli/plugins), [Skills](/hi/cli/skills), [Skills](/hi/tools/skills), [समुदाय](/hi/plugins/community)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">संगतता और विश्वसनीयता</span>
          <span>12 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>56%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "56%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/hi/tools/plugin), [Plugins](/hi/cli/plugins), [संगतता](/hi/plugins/compatibility), [Plugin सूची](/hi/plugins/plugin-inventory), [प्रकाशन](/hi/clawhub/publishing), [Skills](/hi/tools/skills), [Skills कॉन्फ़िगरेशन](/hi/tools/skills-config)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin जीवनचक्र और स्वास्थ्य</span>
          <span>26 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugin](/hi/tools/plugin), [Plugins](/hi/cli/plugins), [Skills](/hi/cli/skills), [Skills](/hi/tools/skills), [प्रोटोकॉल](/hi/gateway/protocol), [बंडल](/hi/plugins/bundles), [निर्भरता समाधान](/hi/plugins/dependency-resolution)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="OpenClaw ऐप SDK - M2 अल्फ़ा - 6 क्षेत्र">
    <a id="openclaw-app-sdk" />

    OpenClaw ऐप SDK, Gateway रनटाइम और Plugin SDK से अलग एक विशिष्ट बाहरी ऐप अनुबंध है। वर्तमान स्कोरिंग सार्वजनिक पैकेजिंग, स्वतः-खोज, अनुमोदन, सहायक सुविधाओं और संगतता से जुड़ी कमियों के साथ एक वास्तविक `@openclaw/sdk` पथ दिखाती है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 3%</span><span>गुणवत्ता अल्फ़ा - 54%</span><span>पूर्णता अल्फ़ा - 53%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">क्लाइंट API</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>51%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "51%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenClaw SDK](/hi/gateway/external-apps), [OpenClaw SDK API डिज़ाइन](/hi/gateway/external-apps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway पहुँच</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenClaw SDK](/hi/gateway/external-apps), [OpenClaw SDK API डिज़ाइन](/hi/gateway/external-apps), [प्रोटोकॉल](/hi/gateway/protocol), [अनुक्रमणिका](/hi/gateway/security/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">एजेंट वार्तालाप</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenClaw SDK](/hi/gateway/external-apps), [OpenClaw SDK API डिज़ाइन](/hi/gateway/external-apps), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">इवेंट और अनुमोदन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>52%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "52%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenClaw SDK](/hi/gateway/external-apps), [OpenClaw SDK API डिज़ाइन](/hi/gateway/external-apps), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">संसाधन सहायक</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>17%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "17%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>62%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "62%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenClaw SDK](/hi/gateway/external-apps), [OpenClaw SDK API डिज़ाइन](/hi/gateway/external-apps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">संगतता</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenClaw SDK API डिज़ाइन](/hi/gateway/external-apps), [Typebox](/hi/concepts/typebox), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### प्लेटफ़ॉर्म

<AccordionGroup>
  <Accordion title="Linux Gateway होस्ट - M4 स्थिर - 5 क्षेत्र">
    <a id="linux-gateway-host" />

    Node रनटाइम की अनुशंसा की जाती है, systemd उपयोगकर्ता सेवा का दस्तावेज़ीकरण उपलब्ध है, और VPS/कंटेनर मार्गदर्शन व्यापक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रयोगात्मक - 0%</span><span>गुणवत्ता बीटा - 75%</span><span>पूर्णता स्थिर - 89%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">होस्ट सेटअप और अपडेट</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सूची](/hi/install/index), [अपडेट करना](/hi/install/updating), [Linux](/hi/platforms/linux), [सूची](/hi/platforms/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway रनटाइम और सेवा नियंत्रण</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सूची](/hi/gateway/index), [Gateway](/hi/cli/gateway), [Linux](/hi/platforms/linux), [VPS](/hi/vps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">दूरस्थ पहुँच और सुरक्षा</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [दूरस्थ](/hi/gateway/remote), [Tailscale](/hi/gateway/tailscale), [एक्सपोज़र रनबुक](/hi/gateway/security/exposure-runbook), [प्रमाणीकरण](/hi/gateway/authentication), [गोपनीय मान](/hi/gateway/secrets)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">निदान और मरम्मत</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [स्थिति](/hi/cli/status), [लॉग](/hi/cli/logs), [डॉक्टर](/hi/cli/doctor), [निदान](/hi/gateway/diagnostics), [अनुक्रमणिका](/hi/gateway/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">परिनियोजन लक्ष्य</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>75%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "75%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>89%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "89%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Vps](/hi/vps), [Docker](/hi/install/docker), [Hetzner](/hi/install/hetzner), [Digitalocean](/hi/install/digitalocean), [Kubernetes](/hi/install/kubernetes), [Podman](/hi/install/podman)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="macOS Gateway होस्ट - M4 स्थिर - 7 क्षेत्र">
    <a id="macos-gateway-host" />

    LaunchAgent सेवा पथ, स्थानीय/दूरस्थ Gateway मोड, CLI इंस्टॉलेशन और ऐप एकीकरण प्रलेखित हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता बीटा - 74%</span><span>पूर्णता स्थिर - 88%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI सेटअप</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/hi/platforms/macos), [बंडल किया गया Gateway](/hi/platforms/mac/bundled-gateway), [इंस्टॉलर](/hi/install/installer), [Node](/hi/install/node)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थानीय Gateway एकीकरण</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/hi/platforms/macos), [बंडल किया गया Gateway](/hi/platforms/mac/bundled-gateway), [रिमोट](/hi/platforms/mac/remote), [सूची](/hi/gateway/index), [Gateway](/hi/cli/gateway), [Bonjour](/hi/gateway/bonjour)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रिमोट Gateway मोड</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [रिमोट](/hi/platforms/mac/remote), [रिमोट](/hi/gateway/remote), [Tailscale](/hi/gateway/tailscale)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway सेवा जीवनचक्र</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/hi/platforms/macos), [बंडल किया गया Gateway](/hi/platforms/mac/bundled-gateway), [Gateway](/hi/cli/gateway), [सूची](/hi/gateway/index), [अपडेट](/hi/cli/update), [अपडेट करना](/hi/install/updating), [अनइंस्टॉल](/hi/install/uninstall), [समस्या निवारण](/hi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">निदान और प्रेक्षणीयता</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [बंडल किया गया Gateway](/hi/platforms/mac/bundled-gateway), [Macos](/hi/platforms/macos), [Gateway](/hi/cli/gateway), [डॉक्टर](/hi/gateway/doctor), [समस्या निवारण](/hi/gateway/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">अनुमतियाँ और नेटिव क्षमताएँ</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/hi/platforms/macos), [रिमोट](/hi/platforms/mac/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रोफ़ाइल और पृथक्करण</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>74%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "74%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>88%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "88%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [एकाधिक Gateway](/hi/gateway/multiple-gateways), [अनुक्रमणिका](/hi/gateway/index), [Gateway](/hi/cli/gateway)

    </div>
      </div>
    </div>

  </Accordion>
  <Accordion title="Android ऐप - M4 स्थिर - 7 क्षेत्र">
    <a id="android-app" />

    आधिकारिक Google Play वितरण उपलब्ध है, स्रोत से बिल्ड करने और चलाने के दस्तावेज़ों का रखरखाव किया जाता है, और Android ऐप को उपयोगकर्ताओं के लिए एक सामान्य सहायक नोड के रूप में प्रलेखित किया गया है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता स्थिर - 80%</span><span>पूर्णता स्थिर - 80%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया कैप्चर</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/hi/platforms/android), [कैमरा](/hi/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मोबाइल चैट</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/hi/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कनेक्शन सेटअप</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/hi/platforms/android), [Bonjour](/hi/gateway/bonjour), [युग्मन](/hi/gateway/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वितरण</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/hi/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सेटिंग्स</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/hi/platforms/android)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वॉइस</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/hi/platforms/android), [बातचीत](/hi/nodes/talk)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">डिवाइस रनटाइम</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Android](/hi/platforms/android), [समस्या निवारण](/hi/nodes/troubleshooting), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
    </div>

  </Accordion>
  <Accordion title="iOS ऐप - M4 स्थिर - 8 क्षेत्र">
    <a id="ios-app" />

    आधिकारिक App Store वितरण उपलब्ध है, रिले-समर्थित पुश का दस्तावेज़ीकरण किया गया है, और iOS ऐप को उपयोगकर्ताओं के लिए एक सामान्य सहयोगी Node के रूप में दस्तावेज़ीकृत किया गया है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता स्थिर - 80%</span><span>पूर्णता स्थिर - 80%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और साझाकरण</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios), [कैमरा](/hi/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कैनवास और स्क्रीन</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios), [कैनवास](/hi/plugins/reference/canvas)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैट और सत्र</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios), [वेबचैट](/hi/web/webchat), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway सेटअप और निदान</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios), [पेयरिंग](/hi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वितरण</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">डिवाइस कमांड</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सूचनाएँ और पृष्ठभूमि</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios), [कॉन्फ़िगरेशन](/hi/gateway/configuration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">आवाज़</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>80%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "80%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ios](/hi/platforms/ios), [वार्ता](/hi/nodes/talk)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Docker और Podman होस्टिंग - M3 बीटा - 4 क्षेत्र">
    <a id="docker-and-podman-hosting" />

    इंस्टॉलेशन दस्तावेज़ उपलब्ध हैं और ये सामान्य परिनियोजन पथ हैं। बार-बार होने वाले रिलीज़ स्मोक परीक्षणों में अपग्रेड और वॉल्यूम व्यवहार कैप्चर होने के बाद इसे उन्नत करें।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 7%</span><span>गुणवत्ता बीटा - 71%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कंटेनर सेटअप</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/hi/install/docker), [Podman](/hi/install/podman)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कंटेनर संचालन</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Podman](/hi/install/podman), [Docker VM रनटाइम](/hi/install/docker-vm-runtime), [Docker](/hi/install/docker), [Hetzner](/hi/install/hetzner), [Hostinger](/hi/install/hostinger)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">इमेज रिलीज़ और सत्यापन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>29%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "29%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/hi/install/docker), [Docker VM रनटाइम](/hi/install/docker-vm-runtime), [पूर्ण रिलीज़ सत्यापन](/hi/reference/full-release-validation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">एजेंट सैंडबॉक्स और टूलिंग</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Docker](/hi/install/docker), [Docker VM रनटाइम](/hi/install/docker-vm-runtime)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="WSL2 के माध्यम से Windows - M3 Beta - 6 क्षेत्र">
    <a id="windows-via-wsl2" />

    systemd/उपयोगकर्ता-सेवा मार्गदर्शन और बूट-श्रृंखला दस्तावेज़ों के साथ अनुशंसित Windows पथ। बार-बार इंस्टॉल/अपडेट स्कोरकार्ड मिलने के बाद इसे आगे बढ़ाएँ।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 6%</span><span>गुणवत्ता अल्फ़ा - 69%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WSL सेटअप</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [आरंभ करना](/hi/start/getting-started)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>8 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [आरंभ करना](/hi/start/getting-started), [अपडेट करना](/hi/install/updating), [ऑनबोर्ड](/hi/cli/onboard), [डॉक्टर](/hi/cli/doctor), [स्थिति](/hi/cli/status), [लॉग](/hi/cli/logs)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway सेवा जीवनचक्र</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [अनुक्रमणिका](/hi/gateway/index), [डॉक्टर](/hi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway पहुँच और एक्सपोज़र</span>
          <span>11 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रमाणीकरण](/hi/gateway/authentication), [गोपनीय जानकारियाँ](/hi/gateway/secrets), [रिमोट](/hi/gateway/remote), [एक्सपोज़र रनबुक](/hi/gateway/security/exposure-runbook), [Windows](/hi/platforms/windows)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">निदान और मरम्मत</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>38%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "38%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [स्थिति](/hi/cli/status), [लॉग](/hi/cli/logs), [डॉक्टर](/hi/cli/doctor), [डॉक्टर](/hi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ब्राउज़र और नियंत्रण UI</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [ब्राउज़र Wsl2 Windows रिमोट Cdp समस्या निवारण](/hi/tools/browser-wsl2-windows-remote-cdp-troubleshooting), [ब्राउज़र](/hi/tools/browser), [नियंत्रण UI](/hi/web/control-ui)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Raspberry Pi और छोटे Linux उपकरण - M3 बीटा - 4 क्षेत्र">
    <a id="raspberry-pi-and-small-linux-devices" />

    प्लेटफ़ॉर्म दस्तावेज़ उपलब्ध हैं और Gateway पथ Linux-आधारित है। उच्चतर स्तर पर जाने के लिए हार्डवेयर-विशिष्ट रिलीज़ स्मोक प्रमाण आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 67%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सेटअप और संगतता</span>
          <span>12 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/hi/install/raspberry-pi), [अनुक्रमणिका](/hi/install/index), [पहली बार चलाने के अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq-first-run), [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq), [Linux](/hi/platforms/linux), [इंस्टॉलर](/hi/install/installer)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रिमोट पहुँच और प्रमाणीकरण</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/hi/install/raspberry-pi), [प्रमाणीकरण](/hi/gateway/authentication), [गोपनीय जानकारियाँ](/hi/gateway/secrets), [पेयरिंग](/hi/gateway/pairing), [उपकरण](/hi/cli/devices), [रिमोट](/hi/gateway/remote), [Tailscale](/hi/gateway/tailscale)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway रनटाइम</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/gateway/index), [Gateway](/hi/cli/gateway), [Raspberry Pi](/hi/install/raspberry-pi), [Linux](/hi/platforms/linux), [Vps](/hi/vps)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदर्शन और निदान</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Raspberry Pi](/hi/install/raspberry-pi), [Linux](/hi/platforms/linux), [स्वास्थ्य](/hi/gateway/health), [निदान](/hi/gateway/diagnostics)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="macOS सहायक ऐप - M3 बीटा - 8 क्षेत्र">
    <a id="macos-companion-app" />

    सुविधाओं से समृद्ध मेनू बार ऐप, अनुमतियाँ, Node मोड, Canvas, वॉइस वेक, WebChat और रिमोट मोड उपलब्ध हैं। यह अभी भी इतनी तेज़ी से विकसित हो रहा है कि इसे स्थिर स्तर पर नहीं रखा जा सकता।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 66%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कैनवास</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [कैनवास](/hi/platforms/mac/canvas), [Macos](/hi/platforms/macos), [वेबचैट](/hi/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थानीय सेटअप</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [बंडल किया गया Gateway](/hi/platforms/mac/bundled-gateway), [Macos](/hi/platforms/macos), [चाइल्ड प्रोसेस](/hi/platforms/mac/child-process), [डेवलपमेंट सेटअप](/hi/platforms/mac/dev-setup)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थिति और सेटिंग</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मेन्यू बार](/hi/platforms/mac/menu-bar), [आइकन](/hi/platforms/mac/icon), [Macos](/hi/platforms/macos), [स्वास्थ्य](/hi/platforms/mac/health), [लॉगिंग](/hi/platforms/mac/logging), [रिमोट](/hi/platforms/mac/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मूल क्षमताएँ</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Macos](/hi/platforms/macos), [Xpc](/hi/platforms/mac/xpc), [अनुमतियाँ](/hi/platforms/mac/permissions), [हस्ताक्षरण](/hi/platforms/mac/signing), [Peekaboo](/hi/platforms/mac/peekaboo)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रिमोट कनेक्शन</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [रिमोट](/hi/platforms/mac/remote), [Macos](/hi/platforms/macos), [रिमोट](/hi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">आवाज़ और बातचीत</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वॉइस वेक](/hi/platforms/mac/voicewake), [वॉइस ओवरले](/hi/platforms/mac/voice-overlay), [बातचीत](/hi/nodes/talk), [Macos](/hi/platforms/macos)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">WebChat</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वेबचैट](/hi/platforms/mac/webchat), [MacOS](/hi/platforms/macos), [वेबचैट](/hi/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रिमोट WebChat</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वेबचैट](/hi/platforms/mac/webchat), [रिमोट](/hi/gateway/remote), [रिमोट](/hi/platforms/mac/remote)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="नेटिव Windows - M2 अल्फ़ा - 4 क्षेत्र">
    <a id="native-windows" />

    मुख्य CLI/Gateway प्रवाह काम करते हैं, लेकिन पूर्ण अनुभव के लिए दस्तावेज़ अब भी WSL2 की अनुशंसा करते हैं और नेटिव सीमाओं को सूचीबद्ध करते हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 58%</span><span>पूर्णता अल्फ़ा - 66%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 1</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">CLI</span>
          <span>9 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>64%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "64%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सूची](/hi/install/index), [इंस्टॉलर](/hi/install/installer), [Windows](/hi/platforms/windows), [आरंभ करना](/hi/start/getting-started), [ऑनबोर्ड](/hi/cli/onboard)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway प्रबंधन</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [अनुक्रमणिका](/hi/gateway/index), [Gateway](/hi/cli/gateway), [डॉक्टर](/hi/cli/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटवर्किंग</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [अनुक्रमणिका](/hi/gateway/index), [Gateway](/hi/cli/gateway)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">अपडेट</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अपडेट करना](/hi/install/updating), [CI](/hi/ci)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Kubernetes होस्टिंग - M2 अल्फ़ा - 4 क्षेत्र">
    <a id="kubernetes-hosting" />

    Kubernetes होस्टिंग, Kustomize पर आधारित एक अलग क्लस्टर परिनियोजन पथ है। वर्तमान स्कोरिंग एक वास्तविक न्यूनतम परिनियोजन पथ दिखाती है, जिसमें Kubernetes-विशिष्ट CI, ingress/TLS/NetworkPolicy पैकेजिंग, बैकअप/पुनर्स्थापना और प्रोडक्शन एक्सपोज़र को सुदृढ़ करने से संबंधित कमियाँ हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 55%</span><span>पूर्णता अल्फ़ा - 61%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">परिनियोजन सेटअप</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/hi/install/kubernetes), [अनुक्रमणिका](/hi/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कॉन्फ़िगरेशन और सीक्रेट</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/hi/install/kubernetes), [सीक्रेट](/hi/gateway/secrets), [परिवेश](/hi/help/environment)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और एक्सपोज़र</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/hi/install/kubernetes), [प्रमाणीकरण](/hi/gateway/authentication), [रिमोट](/hi/gateway/remote), [एक्सपोज़र रनबुक](/hi/gateway/security/exposure-runbook)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">क्लस्टर जीवनचक्र</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>55%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "55%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Kubernetes](/hi/install/kubernetes), [अनुक्रमणिका](/hi/gateway/index)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Nix इंस्टॉल पथ - M1 प्रायोगिक - 5 क्षेत्र">
    <a id="nix-install-path" />

    वैकल्पिक इंस्टॉल प्रवाह। अल्फ़ा/बीटा में पदोन्नति से पहले समर्थन संबंधी आश्वासन अधिक स्पष्ट होना आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता प्रायोगिक - 41%</span><span>पूर्णता प्रायोगिक - 44%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">इंस्टॉलेशन हस्तांतरण</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/hi/install/nix), [अनुक्रमणिका](/hi/install/index), [दस्तावेज़ निर्देशिका](/hi/start/docs-directory)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Plugin जीवनचक्र</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Plugins प्रबंधित करें](/hi/plugins/manage-plugins), [Plugin](/hi/tools/plugin), [Nix](/hi/install/nix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सक्रियण और ऐप उपयोगकर्ता अनुभव</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/hi/install/nix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कॉन्फ़िगरेशन और स्थिति</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/hi/install/nix), [सेटअप](/hi/cli/setup), [परिवेश](/hi/help/environment)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सेवा रनटाइम और सुरक्षा जाँच</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Nix](/hi/install/nix), [सेटअप](/hi/cli/setup), [निदान](/hi/cli/doctor), [अपडेट](/hi/cli/update)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="watchOS सहायक सतहें - M1 प्रयोगात्मक - 5 क्षेत्र">
    <a id="watchos-companion-surfaces" />

    स्रोत में Watch ऐप/एक्सटेंशन सतहें हैं; सार्वजनिक दस्तावेज़ अभी तक इसे उपयोगकर्ता सुविधा के रूप में प्रस्तुत नहीं करते हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रयोगात्मक - 0%</span><span>गुणवत्ता प्रयोगात्मक - 41%</span><span>पूर्णता प्रयोगात्मक - 44%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वितरण और पुनर्प्राप्ति</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/hi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">निष्पादन अनुमोदन</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [निष्पादन अनुमोदन](/hi/tools/exec-approvals), [iOS](/hi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वितरण और सहायता</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/hi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सूचनाएँ और उत्तर</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/hi/platforms/ios)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वॉच ऐप UI</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iOS](/hi/platforms/ios)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Linux सहायक ऐप - M0 नियोजित - 5 क्षेत्र">
    <a id="linux-companion-app" />

    दस्तावेज़ों के अनुसार मूल Linux सहायक ऐप नियोजित हैं; वर्तमान में Gateway समर्थित Linux मार्ग है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता प्रायोगिक - 19%</span><span>पूर्णता प्रायोगिक - 21%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ऐप वितरण</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/hi/platforms/linux), [अनुक्रमणिका](/hi/platforms/index), [अनुक्रमणिका](/hi/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway कनेक्टिविटी</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/hi/platforms/linux), [अनुक्रमणिका](/hi/gateway/index), [पेयरिंग](/hi/gateway/pairing), [रिमोट](/hi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैट और सत्र</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/hi/platforms/linux), [प्रोटोकॉल](/hi/gateway/protocol), [वेबचैट](/hi/web/webchat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">डेस्कटॉप क्षमताएँ</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/hi/platforms/linux), [निष्पादन अनुमोदन](/hi/tools/exec-approvals), [गोपनीय मान](/hi/gateway/secrets), [अनुक्रमणिका](/hi/nodes/index), [निष्पादन](/hi/tools/exec), [बातचीत](/hi/nodes/talk), [कैमरा](/hi/nodes/camera)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थिति और निदान</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Linux](/hi/platforms/linux), [OpenClaw](/hi/start/openclaw), [डॉक्टर](/hi/gateway/doctor)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="मूल Windows सहायक ऐप - M0 नियोजित - 5 क्षेत्र">
    <a id="native-windows-companion-app" />

    केवल नियोजित।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता प्रायोगिक - 19%</span><span>पूर्णता प्रायोगिक - 21%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">इंस्टॉलेशन और अपडेट</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [अनुक्रमणिका](/hi/install/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">Gateway कनेक्शन</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [अनुक्रमणिका](/hi/gateway/index), [पेयरिंग](/hi/gateway/pairing), [रिमोट](/hi/gateway/remote)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैट सत्र</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थिति और सुधार</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [डॉक्टर](/hi/gateway/doctor), [अनुक्रमणिका](/hi/gateway/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">डेस्कटॉप टूल और अनुमतियाँ</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>19%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "19%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>21%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "21%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Windows](/hi/platforms/windows), [अनुक्रमणिका](/hi/nodes/index), [Exec](/hi/tools/exec), [Exec अनुमोदन](/hi/tools/exec-approvals), [अनुक्रमणिका](/hi/gateway/security/index)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### चैनल

<AccordionGroup>
  <Accordion title="Discord - M4 स्थिर - 6 क्षेत्र">
    <a id="discord" />

    विस्तृत दस्तावेज़ और व्यापक सुविधा कवरेज। वॉइस/प्रतिनिधायन पथों को बीटा/अल्फ़ा के रूप में अलग-अलग स्कोर किया जाना चाहिए।

    <div className="maturity-surface-rollup"><span>कवरेज प्रयोगात्मक - 0%</span><span>गुणवत्ता बीटा - 73%</span><span>पूर्णता स्थिर - 87%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 4</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/hi/channels/discord), [Discord](/hi/plugins/reference/discord), [Fly](/hi/install/fly), [स्लैश कमांड](/hi/tools/slash-commands), [स्वास्थ्य](/hi/gateway/health), [चैनल](/hi/cli/channels), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/hi/channels/discord), [पेयरिंग](/hi/channels/pairing), [पहुँच समूह](/hi/channels/access-groups), [समूह](/hi/channels/groups)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और वितरण</span>
          <span>12 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/hi/channels/discord), [चैनल रूटिंग](/hi/channels/channel-routing), [समूह](/hi/channels/groups), [एक्सेस समूह](/hi/channels/access-groups), [ACP एजेंट](/hi/tools/acp-agents), [उप-एजेंट](/hi/tools/subagents)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>1 क्षमता / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/hi/channels/discord)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटिव नियंत्रण और अनुमोदन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/hi/channels/discord), [स्लैश कमांड](/hi/tools/slash-commands)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रीयल-टाइम वॉइस और कॉल</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>73%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "73%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-stable"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-stable">स्थिर</span><span>87%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "87%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Discord](/hi/channels/discord), [OpenAI](/hi/providers/openai), [Elevenlabs](/hi/providers/elevenlabs), [QA E2E स्वचालन](/hi/concepts/qa-e2e-automation), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Telegram - M3 बीटा - 5 क्षेत्र">
    <a id="telegram" />

    मुख्य चैनल नियमित उपयोग के लिए पर्याप्त परिपक्व है, लेकिन अत्यधिक परिवर्तनशील उपयोगकर्ता अनुभव और मीडिया के सीमांत मामलों के लिए बार-बार परिदृश्य प्रमाण आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 68%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-full">पूर्ण - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/hi/channels/telegram), [कॉन्फ़िगरेशन चैनल](/hi/gateway/config-channels), [चैनल](/hi/cli/channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/hi/channels/telegram), [पेयरिंग](/hi/channels/pairing), [पहुँच समूह](/hi/channels/access-groups), [समूह](/hi/channels/groups), [मल्टी एजेंट](/hi/concepts/multi-agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और वितरण</span>
          <span>1 क्षमता / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/hi/channels/telegram), [समूह](/hi/channels/groups), [मल्टी एजेंट](/hi/concepts/multi-agent)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>1 क्षमता / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/hi/channels/telegram), [स्थान](/hi/channels/location)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटिव नियंत्रण और अनुमोदन</span>
          <span>9 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Telegram](/hi/channels/telegram), [निष्पादन अनुमोदन](/hi/tools/exec-approvals), [प्रतिक्रियाएँ](/hi/tools/reactions)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Slack - M3 बीटा - 5 क्षेत्र">
    <a id="slack" />

    प्रथम-श्रेणी के चैनल दस्तावेज़ और रूटिंग सतह। वर्कस्पेस इंस्टॉलेशन/एडमिन परिदृश्य के स्कोरकार्ड आवश्यक हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 66%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-full">पूर्ण - 5</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>10 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/hi/channels/slack), [Slack](/hi/plugins/reference/slack), [सीक्रेट](/hi/gateway/secrets), [QA E2E स्वचालन](/hi/concepts/qa-e2e-automation), [समस्या निवारण](/hi/channels/troubleshooting)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>1 क्षमता / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/hi/channels/slack), [पेयरिंग](/hi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span>5 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/hi/channels/slack), [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection), [पेयरिंग](/hi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>1 क्षमता / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/hi/channels/slack), [QA E2E स्वचालन](/hi/concepts/qa-e2e-automation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटिव नियंत्रण और अनुमोदन</span>
          <span>8 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Slack](/hi/channels/slack), [स्लैश कमांड](/hi/tools/slash-commands), [निष्पादन अनुमोदन](/hi/tools/exec-approvals)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="iMessage और BlueBubbles - M3 बीटा - 5 क्षेत्र">
    <a id="imessage-and-bluebubbles" />

    समर्थित iMessage, साइन-इन किए हुए macOS Messages होस्ट पर imsg के माध्यम से चलता है; पुराने BlueBubbles कॉन्फ़िगरेशन के लिए माइग्रेशन आवश्यक है। macOS अनुमतियों, SSH रैपर, SIP/निजी API और माइग्रेशन संबंधी सावधानियों को स्पष्ट रूप से प्रदर्शित रखें।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 66%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [BlueBubbles iMessage](/hi/announcements/bluebubbles-imessage), [BlueBubbles से iMessage](/hi/channels/imessage-from-bluebubbles), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels), [iMessage](/hi/channels/imessage)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/hi/channels/imessage), [BlueBubbles से iMessage](/hi/channels/imessage-from-bluebubbles), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/hi/channels/imessage)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/hi/channels/imessage), [BlueBubbles से iMessage](/hi/channels/imessage-from-bluebubbles), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटिव नियंत्रण और अनुमोदन</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [iMessage](/hi/channels/imessage)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="WhatsApp - M3 बीटा - 5 क्षेत्र">
    <a id="whatsapp" />

    मुख्य पथ महत्वपूर्ण और दस्तावेज़ीकृत है; अपस्ट्रीम Baileys/सत्र की अस्थिरता इसे स्थिर स्तर से नीचे रखती है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 66%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/hi/channels/whatsapp), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels), [WhatsApp](/hi/plugins/reference/whatsapp), [QA E2E स्वचालन](/hi/concepts/qa-e2e-automation), [डॉक्टर](/hi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/hi/channels/whatsapp), [कॉन्फ़िगरेशन चैनल](/hi/gateway/config-channels), [QA E2E स्वचालन](/hi/concepts/qa-e2e-automation), [पेयरिंग](/hi/channels/pairing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/hi/channels/whatsapp), [समूह संदेश](/hi/channels/group-messages)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/hi/channels/whatsapp)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मूल नियंत्रण और अनुमोदन</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [WhatsApp](/hi/channels/whatsapp)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Matrix - M2 अल्फ़ा - 6 क्षेत्र">
    <a id="matrix" />

    बंडल किए गए plugin के माध्यम से समर्थित। ब्रिज, प्रमाणीकरण और रूम जीवनचक्र स्कोरकार्ड आवश्यक हैं।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 60%</span><span>पूर्णता अल्फ़ा - 67%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/hi/channels/matrix), [Matrix माइग्रेशन](/hi/channels/matrix-migration)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/hi/channels/matrix), [समूह](/hi/channels/groups), [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/hi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/hi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मूल नियंत्रण और अनुमोदन</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/hi/channels/matrix)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">एन्क्रिप्शन और सत्यापन</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>60%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "60%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Matrix](/hi/channels/matrix), [Matrix माइग्रेशन](/hi/channels/matrix-migration)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Google Chat - M2 अल्फ़ा - 5 क्षेत्र">
    <a id="google-chat" />

    प्रलेखित चैनल, लेकिन एंटरप्राइज़/एडमिन सेटअप परिपक्वता का जोखिम बढ़ाता है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 59%</span><span>पूर्णता अल्फ़ा - 66%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>16 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/hi/channels/googlechat), [Google Chat](/hi/plugins/reference/googlechat), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels), [विज़ार्ड CLI संदर्भ](/hi/start/wizard-cli-reference), [गोपनीय मान](/hi/gateway/secrets), [Secretref क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface), [स्वास्थ्य](/hi/gateway/health), [Plugin इन्वेंटरी](/hi/plugins/plugin-inventory), [अनुक्रमणिका](/hi/channels/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/hi/channels/googlechat), [पेयरिंग](/hi/channels/pairing), [पहुँच समूह](/hi/channels/access-groups), [चैनल कॉन्फ़िगरेशन](/hi/gateway/config-channels), [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection), [चैनल रूटिंग](/hi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span>1 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/hi/channels/googlechat), [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection), [एक्सेस समूह](/hi/channels/access-groups), [चैनल रूटिंग](/hi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>1 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/hi/channels/googlechat), [संदेश](/hi/cli/message), [मीडिया की समझ](/hi/nodes/media-understanding), [Secretref क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मूल नियंत्रण और अनुमोदन</span>
          <span>16 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google Chat](/hi/channels/googlechat), [संदेश](/hi/cli/message), [मीडिया की समझ](/hi/nodes/media-understanding), [Secretref क्रेडेंशियल सतह](/hi/reference/secretref-credential-surface), [प्रतिक्रियाएँ](/hi/tools/reactions), [स्लैश कमांड](/hi/tools/slash-commands), [एजेंट कॉन्फ़िगरेशन](/hi/gateway/config-agents), [संदेश जीवनचक्र रीफ़ैक्टर](/hi/concepts/message-lifecycle-refactor)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Microsoft Teams - M2 अल्फ़ा - 5 क्षेत्र">
    <a id="microsoft-teams" />

    एंटरप्राइज़ प्रमाणीकरण/व्यवस्थापक प्रवाहों के लिए स्पष्ट परिदृश्य प्रमाण आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 59%</span><span>पूर्णता अल्फ़ा - 66%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/hi/channels/msteams), [Microsoft Teams](/hi/plugins/reference/msteams), [कॉन्फ़िगरेशन चैनल](/hi/gateway/config-channels), [स्वास्थ्य](/hi/gateway/health)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/hi/channels/msteams), [पेयरिंग](/hi/channels/pairing), [पहुँच समूह](/hi/channels/access-groups)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/hi/channels/msteams), [समूह](/hi/channels/groups), [चैनल रूटिंग](/hi/channels/channel-routing)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/hi/channels/msteams)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मूल नियंत्रण और अनुमोदन</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Microsoft Teams](/hi/channels/msteams), [उन्नत निष्पादन अनुमोदन](/hi/tools/exec-approvals-advanced)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Signal - M2 अल्फ़ा - 5 क्षेत्र">
    <a id="signal" />

    समर्थित चैनल के दस्तावेज़ उपलब्ध हैं; इंस्टॉलेशन और पुनः कनेक्ट होने के अधिक ठोस प्रमाण की आवश्यकता है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 59%</span><span>पूर्णता अल्फ़ा - 66%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/hi/channels/signal), [Signal](/hi/plugins/reference/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/hi/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और वितरण</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/hi/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/hi/channels/signal)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मूल नियंत्रण और अनुमोदन</span>
          <span>3 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>59%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "59%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Signal](/hi/channels/signal)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Feishu, QQ Bot, WeChat, Yuanbao, Zalo, Zalo Personal, क्षेत्रीय चैनल - M2 अल्फ़ा - 4 क्षेत्र">
    <a id="feishu-qq-bot-wechat-yuanbao-zalo-zalo-personal-regional-channels" />

    महत्वपूर्ण क्षेत्रीय कवरेज, लेकिन सार्वजनिक समर्थन स्तर को खाता प्रकार, अपस्ट्रीम अनुमोदन और अनुरक्षक प्रमाण के अनुसार निर्धारित किया जाना चाहिए।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 55%</span><span>पूर्णता अल्फ़ा - 58%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/channels/index), [पेयरिंग](/hi/channels/pairing), [Feishu](/hi/plugins/reference/feishu), [आर्किटेक्चर के आंतरिक भाग](/hi/plugins/architecture-internals)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    कोई लिंक किया गया दस्तावेज़ नहीं

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और वितरण</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    कोई लिंक किया गया दस्तावेज़ नहीं

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    कोई लिंक किया गया दस्तावेज़ नहीं

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Mattermost, LINE, IRC, Nextcloud Talk, Nostr, Twitch, Tlon, Synology Chat - M2 अल्फ़ा - 4 क्षेत्र">
    <a id="mattermost-line-irc-nextcloud-talk-nostr-twitch-tlon-synology-chat" />

    समर्थित सतहें उपलब्ध हैं, लेकिन परिपक्वता संभवतः अपस्ट्रीम और अनुरक्षक कवरेज के अनुसार भिन्न होती है। बाद में प्रत्येक का अलग-अलग मूल्यांकन करें।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 53%</span><span>पूर्णता अल्फ़ा - 54%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    कोई लिंक किया गया दस्तावेज़ नहीं

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    कोई लिंक किया गया दस्तावेज़ नहीं

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और वितरण</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    कोई लिंक किया गया दस्तावेज़ नहीं

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>53%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "53%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>54%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "54%" }} /></span></span></div>
        <div className="maturity-category-docs">

    कोई लिंक किया गया दस्तावेज़ नहीं

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="वॉइस कॉल चैनल - M1 प्रायोगिक - 5 क्षेत्र">
    <a id="voice-call-channel" />

    जटिल रीयल-टाइम व्यवहार वाला वैकल्पिक/Plugin पथ। सार्वजनिक बीटा से पहले परिदृश्य स्कोरकार्ड आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता प्रायोगिक - 41%</span><span>पूर्णता प्रायोगिक - 44%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैनल सेटअप और संचालन</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वॉइसकॉल](/hi/cli/voicecall), [वॉइस कॉल](/hi/plugins/voice-call), [प्रोटोकॉल](/hi/gateway/protocol)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">पहुँच और पहचान</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वॉइस कॉल](/hi/plugins/voice-call), [वॉइसकॉल](/hi/cli/voicecall)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वार्तालाप रूटिंग और डिलीवरी</span>
          <span>1 क्षमता</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वॉइस कॉल](/hi/plugins/voice-call)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया और समृद्ध सामग्री</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वॉइस कॉल](/hi/plugins/voice-call), [Plugin सूची](/hi/plugins/plugin-inventory)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">रीयल-टाइम वॉइस और कॉल</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>41%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "41%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वॉइस कॉल](/hi/plugins/voice-call)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>

### प्रदाता और टूल

<AccordionGroup>
  <Accordion title="ब्राउज़र स्वचालन, निष्पादन और सैंडबॉक्स टूल - M3 बीटा - 3 क्षेत्र">
    <a id="browser-automation-exec-and-sandbox-tools" />

    मुख्य टूल प्रलेखित हैं, लेकिन होस्ट सुरक्षा और अनुमति उपयोगकर्ता अनुभव को सक्रिय स्कोरकार्ड समीक्षा के अंतर्गत रहना चाहिए।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 21%</span><span>गुणवत्ता बीटा - 75%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 2</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">ब्राउज़र स्वचालन</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>13%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "13%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [ब्राउज़र नियंत्रण](/hi/tools/browser-control), [परीक्षण](/hi/help/testing), [ब्राउज़र](/hi/tools/browser), [सूचकांक](/hi/gateway/security/index), [ऑडिट जाँच](/hi/gateway/security/audit-checks)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">टूल आह्वान और निष्पादन</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>50%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "50%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Exec](/hi/tools/exec), [पृष्ठभूमि प्रक्रिया](/hi/gateway/background-process), [टूल द्वारा HTTP API आह्वान](/hi/gateway/tools-invoke-http-api), [ऑपरेटर स्कोप](/hi/gateway/operator-scopes), [प्रोटोकॉल](/hi/gateway/protocol), [Exec अनुमोदन](/hi/tools/exec-approvals), [उन्नत Exec अनुमोदन](/hi/tools/exec-approvals-advanced), [उन्नत](/hi/tools/elevated)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सैंडबॉक्स और टूल नीति</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [सैंडबॉक्सिंग](/hi/gateway/sandboxing), [सैंडबॉक्स बनाम टूल नीति बनाम उन्नत](/hi/gateway/sandbox-vs-tool-policy-vs-elevated), [मल्टी-एजेंट सैंडबॉक्स टूल](/hi/tools/multi-agent-sandbox-tools), [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference), [कॉन्फ़िगरेशन टूल](/hi/gateway/config-tools)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="OpenAI और Codex प्रदाता पथ - M3 बीटा - 5 क्षेत्र">
    <a id="openai-and-codex-provider-path" />

    विस्तृत दस्तावेज़, OAuth/सदस्यता पथ, रीयलटाइम वॉइस, इमेज और संगतता व्यवहार। प्रदाता में लगातार बदलाव के कारण रिलीज़-स्कोरकार्ड प्रमाण के बिना यह स्थिर स्तर तक नहीं पहुँच पाता।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 26%</span><span>गुणवत्ता बीटा - 74%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-partial">आंशिक - 3</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मॉडल और प्रमाणीकरण</span>
          <span>6 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/hi/providers/openai), [Codex हार्नेस](/hi/plugins/codex-harness), [मॉडल](/hi/concepts/models), [OAuth](/hi/concepts/oauth), [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference), [प्रमाणीकरण निगरानी](/hi/gateway/authentication)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रतिक्रियाएँ और टूल संगतता</span>
          <span>4 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>40%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "40%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/hi/providers/openai), [OpenResponses HTTP API](/hi/gateway/openresponses-http-api), [OpenAI HTTP API](/hi/gateway/openai-http-api), [Codex नेटिव Plugin](/hi/plugins/codex-native-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटिव Codex हार्नेस</span>
          <span>2 क्षमताएँ / LTS-समर्थित</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>44%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "44%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Codex हार्नेस](/hi/plugins/codex-harness), [Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime), [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference), [Codex नेटिव Plugins](/hi/plugins/codex-native-plugins)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">छवि और मल्टीमोडल इनपुट</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/hi/providers/openai), [छवि निर्माण](/hi/tools/image-generation), [छवियाँ](/hi/nodes/images)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वॉइस और रीयलटाइम ऑडियो</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>67%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "67%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [OpenAI](/hi/providers/openai), [Discord](/hi/channels/discord), [वॉइस कॉल](/hi/plugins/voice-call)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="वेब खोज टूल - M3 बीटा - 4 क्षेत्र">
    <a id="web-search-tools" />

    कई प्रदाता और दस्तावेज़ उपलब्ध हैं। प्रत्येक प्रदाता परिवार के लिए कोटा/त्रुटि/SSRF प्रमाण आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 9%</span><span>गुणवत्ता बीटा - 74%</span><span>पूर्णता बीटा - 79%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">खोज प्रदाता</span>
          <span>19 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>11%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "11%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वेब](/hi/tools/web), [Brave खोज](/hi/tools/brave-search), [Tavily](/hi/tools/tavily), [Exa खोज](/hi/tools/exa-search), [Firecrawl](/hi/tools/firecrawl), [Perplexity खोज](/hi/tools/perplexity-search), [Duckduckgo खोज](/hi/tools/duckduckgo-search), [Searxng खोज](/hi/tools/searxng-search), [Gemini खोज](/hi/tools/gemini-search), [Grok खोज](/hi/tools/grok-search), [Kimi खोज](/hi/tools/kimi-search), [Minimax खोज](/hi/tools/minimax-search), [Ollama खोज](/hi/tools/ollama-search), [SDK उपपथ](/hi/plugins/sdk-subpaths), [SDK अवलोकन](/hi/plugins/sdk-overview), [मैनिफ़ेस्ट](/hi/plugins/manifest)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">सेटअप और निदान</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वेब](/hi/tools/web), [वेब फ़ेच](/hi/tools/web-fetch), [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq), [API उपयोग की लागत](/hi/reference/api-usage-costs), [Brave खोज](/hi/tools/brave-search), [Perplexity खोज](/hi/tools/perplexity-search), [Tavily](/hi/tools/tavily), [Firecrawl](/hi/tools/firecrawl)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटवर्क सुरक्षा</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वेब](/hi/tools/web), [वेब फ़ेच](/hi/tools/web-fetch), [Firecrawl](/hi/tools/firecrawl), [Searxng खोज](/hi/tools/searxng-search)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">टूल की उपलब्धता और फ़ेच</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>25%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "25%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [कॉन्फ़िग टूल](/hi/gateway/config-tools), [वेब फ़ेच](/hi/tools/web-fetch), [वेब](/hi/tools/web), [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Anthropic प्रदाता पथ - M3 बीटा - 5 क्षेत्र">
    <a id="anthropic-provider-path" />

    प्रथम-श्रेणी मॉडल प्रदाता। आवर्ती प्रमाणीकरण/कैटलॉग/टूल-कॉल परिदृश्य प्रमाण आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता बीटा - 71%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता प्रमाणीकरण और पुनर्प्राप्ति</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/hi/providers/anthropic), [Doctor](/hi/gateway/doctor), [कॉन्फ़िगरेशन उदाहरण](/hi/gateway/configuration-examples), [समस्या निवारण](/hi/gateway/troubleshooting), [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मॉडल और रनटाइम चयन</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/hi/providers/anthropic), [एजेंट कॉन्फ़िगरेशन](/hi/gateway/config-agents), [मॉडल](/hi/concepts/models), [CLI बैकएंड](/hi/gateway/cli-backends)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">अनुरोध परिवहन और टर्न सिमेंटिक्स</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>77%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "77%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>79%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "79%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/hi/providers/anthropic), [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching), [समस्या निवारण](/hi/gateway/troubleshooting), [CLI बैकएंड](/hi/gateway/cli-backends), [मॉडल प्रदाता](/hi/concepts/model-providers)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रॉम्प्ट कैश और संदर्भ</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/hi/providers/anthropic), [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching), [समस्या निवारण](/hi/gateway/troubleshooting), [Heartbeat](/hi/gateway/heartbeat)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया इनपुट</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Anthropic](/hi/providers/anthropic), [एजेंट कॉन्फ़िगरेशन](/hi/gateway/config-agents)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="Google प्रदाता पथ - M3 बीटा - 5 क्षेत्र">
    <a id="google-provider-path" />

    मॉडल और रियलटाइम सतहों वाला प्रथम-श्रेणी प्रदाता। अलग Live/Talk स्कोरिंग आवश्यक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रयोगात्मक - 0%</span><span>गुणवत्ता अल्फ़ा - 66%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता सेटअप और क्रेडेंशियल</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/hi/providers/google), [मॉडल प्रदाता](/hi/concepts/model-providers)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मॉडल रूटिंग और एंडपॉइंट</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/hi/providers/google), [मॉडल प्रदाता](/hi/concepts/model-providers), [Google](/hi/plugins/reference/google), [Gemini खोज](/hi/tools/gemini-search)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रत्यक्ष Gemini रनटाइम</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/hi/providers/google), [मॉडल प्रदाता](/hi/concepts/model-providers), [मॉडल संबंधी अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq-models), [लाइव परीक्षण](/hi/help/testing-live)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया, खोज और रीयलटाइम</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Google](/hi/plugins/reference/google), [Google](/hi/providers/google)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रॉम्प्ट कैशिंग</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching), [Google](/hi/providers/google), [मॉडल प्रदाता](/hi/concepts/model-providers), [टोकन उपयोग](/hi/reference/token-use)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="OpenRouter प्रदाता पथ - M3 बीटा - 4 क्षेत्र">
    <a id="openrouter-provider-path" />

    एकीकृत प्रदाता पथ प्रलेखित और उपयोगी है, लेकिन मॉडल-विशिष्ट व्यवहार अलग-अलग होता है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 66%</span><span>पूर्णता बीटा - 78%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता सेटअप और प्रमाणीकरण</span>
          <span>14 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/hi/providers/openrouter), [मॉडल प्रदाता](/hi/concepts/model-providers), [कॉन्फ़िगर करें](/hi/cli/configure), [प्रमाणीकरण](/hi/gateway/authentication), [परिवेश](/hi/help/environment), [मॉडल](/hi/cli/models), [मॉडल](/hi/concepts/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">चैट रनटाइम और सामान्यीकरण</span>
          <span>15 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/hi/providers/openrouter), [मॉडल प्रदाता](/hi/concepts/model-providers), [प्रॉम्प्ट कैशिंग](/hi/reference/prompt-caching)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता पुनर्प्राप्ति और निदान</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मॉडल फ़ेलओवर](/hi/concepts/model-failover), [Openrouter](/hi/providers/openrouter), [मॉडल](/hi/cli/models)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया निर्माण और वाक्</span>
          <span>7 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>66%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "66%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-beta"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-beta">बीटा</span><span>78%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "78%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Openrouter](/hi/providers/openrouter), [छवि निर्माण](/hi/tools/image-generation), [संगीत निर्माण](/hi/tools/music-generation), [मीडिया अवलोकन](/hi/tools/media-overview), [वीडियो निर्माण](/hi/tools/video-generation), [Tts](/hi/tools/tts)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="छवि, वीडियो और संगीत निर्माण उपकरण - M2 अल्फ़ा - 5 क्षेत्र">
    <a id="image-video-and-music-generation-tools" />

    यह क्षमता सभी प्रदाताओं में उपलब्ध है, लेकिन प्रति-प्रदाता प्रमाण के बिना बीटा स्तर के लिए गुणवत्ता, विलंबता और पैरामीटर संगतता में बहुत अधिक भिन्नता है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 61%</span><span>पूर्णता अल्फ़ा - 68%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">मीडिया रूटिंग और खोज</span>
          <span>4 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [एजेंट कॉन्फ़िगरेशन](/hi/gateway/config-agents), [छवि निर्माण](/hi/tools/image-generation), [वीडियो निर्माण](/hi/tools/video-generation), [संगीत निर्माण](/hi/tools/music-generation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">कार्य जीवनचक्र और वितरण</span>
          <span>12 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मीडिया का अवलोकन](/hi/tools/media-overview), [छवि निर्माण](/hi/tools/image-generation), [वीडियो निर्माण](/hi/tools/video-generation), [संगीत निर्माण](/hi/tools/music-generation)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">छवि निर्माण</span>
          <span>9 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [छवि निर्माण](/hi/tools/image-generation), [अनुमान](/hi/cli/infer), [मीडिया का अवलोकन](/hi/tools/media-overview)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">वीडियो निर्माण</span>
          <span>11 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [वीडियो निर्माण](/hi/tools/video-generation), [Runway](/hi/providers/runway), [Pixverse](/hi/providers/pixverse), [Fal](/hi/providers/fal), [Openrouter](/hi/providers/openrouter)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">संगीत निर्माण</span>
          <span>6 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [संगीत निर्माण](/hi/tools/music-generation)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="स्थानीय मॉडल प्रदाता: Ollama, vLLM, SGLang, LM Studio - M2 अल्फ़ा - 5 क्षेत्र">
    <a id="local-model-providers-ollama-vllm-sglang-lm-studio" />

    उपयोगी और प्रलेखित, लेकिन परिवेश में भिन्नता अधिक है।

    <div className="maturity-surface-rollup"><span>कवरेज प्रयोगात्मक - 0%</span><span>गुणवत्ता अल्फ़ा - 61%</span><span>पूर्णता अल्फ़ा - 68%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता सेटअप, जीवनचक्र और निदान</span>
          <span>12 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [स्थानीय मॉडल](/hi/gateway/local-models), [Lmstudio](/hi/providers/lmstudio), [Ollama](/hi/providers/ollama), [Vllm](/hi/providers/vllm), [स्थानीय मॉडल सेवाएँ](/hi/gateway/local-model-services), [एजेंट कॉन्फ़िगरेशन](/hi/gateway/config-agents), [समस्या निवारण](/hi/gateway/troubleshooting), [डॉक्टर](/hi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटिव प्रदाता Plugins</span>
          <span>10 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Ollama](/hi/providers/ollama), [Lmstudio](/hi/providers/lmstudio)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">OpenAI-संगत रनटाइम अनुकूलता</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [Vllm](/hi/providers/vllm), [Sglang](/hi/providers/sglang), [स्थानीय मॉडल](/hi/gateway/local-models), [Lmstudio](/hi/providers/lmstudio)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">स्थानीय मेमोरी और एम्बेडिंग</span>
          <span>5 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रयोगात्मक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मेमोरी](/hi/concepts/memory), [डॉक्टर](/hi/gateway/doctor)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">नेटवर्क सुरक्षा और प्रॉम्प्ट नियंत्रण</span>
          <span>2 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/gateway/security/index), [कॉन्फ़िगरेशन टूल](/hi/gateway/config-tools), [स्थानीय मॉडल](/hi/gateway/local-models)

    </div>
      </div>
    </div>

  </Accordion>

  <Accordion title="कम प्रचलित होस्टेड प्रदाता - M2 अल्फ़ा - 3 क्षेत्र">
    <a id="long-tail-hosted-providers" />

    कई दस्तावेज़/संदर्भ पृष्ठ मौजूद हैं; स्कोर प्रदाता मेटाडेटा और लाइव स्मोक कवरेज से तैयार किया जाना चाहिए।

    <div className="maturity-surface-rollup"><span>कवरेज प्रायोगिक - 0%</span><span>गुणवत्ता अल्फ़ा - 61%</span><span>पूर्णता अल्फ़ा - 68%</span><span><span className="maturity-lts maturity-lts-none">कोई नहीं</span></span></div>

    <div className="maturity-category-list">
      <div className="maturity-category-row maturity-category-row-header"><span>क्षेत्र</span><span>कवरेज</span><span>गुणवत्ता</span><span>पूर्णता</span><span>दस्तावेज़</span></div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">होस्टेड LLM प्रदाता</span>
          <span>12 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/providers/index), [मॉडल प्रदाता](/hi/concepts/model-providers), [लाइव परीक्षण](/hi/help/testing-live), [ऑनबोर्डिंग](/hi/cli/onboard)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">होस्टेड मीडिया प्रदाता</span>
          <span>8 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [मैनिफ़ेस्ट](/hi/plugins/manifest), [लाइव परीक्षण](/hi/help/testing-live), [अनुक्रमणिका](/hi/providers/index)

    </div>
      </div>
      <div className="maturity-category-row">
        <div className="maturity-category-area">
          <span className="maturity-category-title">प्रदाता संचालन</span>
          <span>12 क्षमताएँ</span>
        </div>
        <div><span className="maturity-score maturity-score-experimental"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-experimental">प्रायोगिक</span><span>0%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "0%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>61%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "61%" }} /></span></span></div>
        <div><span className="maturity-score maturity-score-alpha"><span className="maturity-score-label"><span className="maturity-level-pill maturity-level-alpha">अल्फ़ा</span><span>68%</span></span><span className="maturity-meter" aria-hidden="true"><span style={{ width: "68%" }} /></span></span></div>
        <div className="maturity-category-docs">

    [अनुक्रमणिका](/hi/providers/index), [मॉडल प्रदाता](/hi/concepts/model-providers), [मैनिफ़ेस्ट](/hi/plugins/manifest), [लाइव परीक्षण](/hi/help/testing-live), [मॉडल](/hi/cli/models)

    </div>
      </div>
    </div>

  </Accordion>

</AccordionGroup>
