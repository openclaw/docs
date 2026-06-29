---
read_when:
    - आप अक्सर Docker के साथ OpenClaw चलाते हैं और रोज़मर्रा के छोटे कमांड चाहते हैं
    - आप डैशबोर्ड, लॉग, टोकन सेटअप और पेयरिंग प्रवाहों के लिए एक सहायक परत चाहते हैं
summary: Docker-आधारित OpenClaw इंस्टॉल के लिए ClawDock शेल हेल्पर
title: ClawDock
x-i18n:
    generated_at: "2026-06-28T23:19:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock Docker-आधारित OpenClaw इंस्टॉल के लिए एक छोटी शेल-हेल्पर लेयर है।

यह आपको लंबे `docker compose ...` इनवोकेशन के बजाय `clawdock-start`, `clawdock-dashboard`, और `clawdock-fix-token` जैसे छोटे कमांड देता है।

यदि आपने अभी तक Docker सेट अप नहीं किया है, तो [Docker](/hi/install/docker) से शुरू करें।

## इंस्टॉल करें

कैनॉनिकल हेल्पर पथ का उपयोग करें:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

यदि आपने पहले ClawDock को `scripts/shell-helpers/clawdock-helpers.sh` से इंस्टॉल किया था, तो नए `scripts/clawdock/clawdock-helpers.sh` पथ से फिर से इंस्टॉल करें। पुराना raw GitHub पथ हटा दिया गया था।

## आपको क्या मिलता है

### बुनियादी ऑपरेशन

| कमांड             | विवरण                   |
| ------------------ | ---------------------- |
| `clawdock-start`   | Gateway शुरू करें      |
| `clawdock-stop`    | Gateway रोकें          |
| `clawdock-restart` | Gateway फिर शुरू करें  |
| `clawdock-status`  | कंटेनर स्थिति जांचें   |
| `clawdock-logs`    | Gateway लॉग फॉलो करें  |

### कंटेनर एक्सेस

| कमांड                    | विवरण                                      |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Gateway कंटेनर के अंदर शेल खोलें             |
| `clawdock-cli <command>`  | Docker में OpenClaw CLI कमांड चलाएं           |
| `clawdock-exec <command>` | कंटेनर में कोई भी कमांड निष्पादित करें        |

### वेब UI और पेयरिंग

| कमांड                  | विवरण                         |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | Control UI URL खोलें         |
| `clawdock-devices`      | लंबित डिवाइस पेयरिंग सूचीबद्ध करें |
| `clawdock-approve <id>` | पेयरिंग अनुरोध स्वीकृत करें  |

### सेटअप और रखरखाव

| कमांड               | विवरण                                           |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | कंटेनर के अंदर Gateway टोकन कॉन्फ़िगर करें       |
| `clawdock-update`    | पुल करें, फिर से बिल्ड करें, और फिर शुरू करें    |
| `clawdock-rebuild`   | केवल Docker इमेज फिर से बिल्ड करें              |
| `clawdock-clean`     | कंटेनर और वॉल्यूम हटाएं                          |

### उपयोगिताएं

| कमांड                 | विवरण                                      |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | Gateway हेल्थ चेक चलाएं                 |
| `clawdock-token`       | Gateway टोकन प्रिंट करें                |
| `clawdock-cd`          | OpenClaw प्रोजेक्ट डायरेक्टरी पर जाएं   |
| `clawdock-config`      | `~/.openclaw` खोलें                     |
| `clawdock-show-config` | रीडैक्ट किए गए मानों के साथ कॉन्फ़िग फ़ाइलें प्रिंट करें |
| `clawdock-workspace`   | वर्कस्पेस डायरेक्टरी खोलें              |

## पहली बार का फ्लो

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

यदि ब्राउज़र कहता है कि पेयरिंग आवश्यक है:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## कॉन्फ़िग और सीक्रेट

ClawDock [Docker](/hi/install/docker) में वर्णित उसी Docker कॉन्फ़िग विभाजन के साथ काम करता है:

- Docker-विशिष्ट मानों, जैसे इमेज नाम, पोर्ट, और Gateway टोकन के लिए `<project>/.env`
- env-आधारित प्रोवाइडर कुंजियों और bot टोकन के लिए `~/.openclaw/.env`
- संग्रहित प्रोवाइडर OAuth/API-key auth के लिए `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- व्यवहार कॉन्फ़िग के लिए `~/.openclaw/openclaw.json`

जब आप `.env` फ़ाइलों और `openclaw.json` को जल्दी से जांचना चाहते हैं, तो `clawdock-show-config` का उपयोग करें। यह अपने प्रिंट किए गए आउटपुट में `.env` मानों को रीडैक्ट करता है।

## संबंधित

<CardGroup cols={2}>
  <Card title="Docker" href="/hi/install/docker" icon="docker">
    OpenClaw के लिए कैनॉनिकल Docker इंस्टॉल।
  </Card>
  <Card title="Docker VM रनटाइम" href="/hi/install/docker-vm-runtime" icon="cube">
    कड़े आइसोलेशन के लिए Docker-प्रबंधित VM रनटाइम।
  </Card>
  <Card title="अपडेट करना" href="/hi/install/updating" icon="arrow-up-right-from-square">
    OpenClaw पैकेज और प्रबंधित सेवाओं को अपडेट करना।
  </Card>
</CardGroup>
