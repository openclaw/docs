---
read_when:
    - आप अक्सर Docker के साथ OpenClaw चलाते हैं और रोज़मर्रा के लिए छोटे कमांड चाहते हैं
    - आप डैशबोर्ड, लॉग, टोकन सेटअप और पेयरिंग प्रवाहों के लिए एक सहायक परत चाहते हैं
summary: Docker-आधारित OpenClaw इंस्टॉलेशन के लिए ClawDock शेल सहायक उपकरण
title: ClawDock
x-i18n:
    generated_at: "2026-07-16T15:25:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock, Docker-आधारित OpenClaw इंस्टॉलेशन के लिए एक छोटी शेल-हेल्पर परत है।

यह लंबे `docker compose ...` आह्वानों के बजाय आपको `clawdock-start`, `clawdock-dashboard`, और `clawdock-fix-token` जैसी छोटी कमांड देता है।

यदि आपने अभी तक Docker सेट अप नहीं किया है, तो [Docker](/hi/install/docker) से शुरू करें।

## इंस्टॉल करें

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

यदि आपने पहले `scripts/shell-helpers/clawdock-helpers.sh` से ClawDock इंस्टॉल किया था, तो वर्तमान `scripts/clawdock/clawdock-helpers.sh` पथ से दोबारा इंस्टॉल करें; पुराना अपरिष्कृत GitHub पथ हटा दिया गया है।

पहली बार उपयोग किए जाने पर हेल्पर आपके OpenClaw चेकआउट का स्वतः पता लगाते हैं (`~/openclaw`, `~/projects/openclaw` जैसे सामान्य पथों की जाँच करके) और परिणाम को `~/.clawdock/config` में कैश करते हैं। यदि आपका चेकआउट किसी अन्य स्थान पर है, तो `CLAWDOCK_DIR` स्वयं सेट करें।

## आपको क्या मिलता है

### बुनियादी संचालन

| कमांड            | विवरण            |
| ------------------ | ---------------------- |
| `clawdock-start`   | Gateway शुरू करें      |
| `clawdock-stop`    | Gateway रोकें       |
| `clawdock-restart` | Gateway पुनः शुरू करें    |
| `clawdock-status`  | कंटेनर की स्थिति जाँचें |
| `clawdock-logs`    | Gateway लॉग लगातार देखें    |

### कंटेनर एक्सेस

| कमांड                   | विवरण                                   |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Gateway कंटेनर के भीतर शेल खोलें     |
| `clawdock-cli <command>`  | Docker में OpenClaw CLI कमांड चलाएँ           |
| `clawdock-exec <command>` | कंटेनर में कोई भी कमांड निष्पादित करें |

### वेब UI और पेयरिंग

| कमांड                 | विवरण                  |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | Control UI का URL खोलें      |
| `clawdock-devices`      | लंबित डिवाइस पेयरिंग सूचीबद्ध करें |
| `clawdock-approve <id>` | पेयरिंग अनुरोध स्वीकृत करें    |

### सेटअप और रखरखाव

| कमांड              | विवरण                                       |
| -------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | कंटेनर कॉन्फ़िगरेशन में Gateway टोकन लिखें |
| `clawdock-update`    | पुल करें, फिर से बिल्ड करें और पुनः शुरू करें                        |
| `clawdock-rebuild`   | केवल Docker इमेज फिर से बिल्ड करें                     |
| `clawdock-clean`     | कंटेनर और वॉल्यूम हटाएँ                     |

### उपयोगिताएँ

| कमांड                | विवरण                             |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | Gateway स्वास्थ्य जाँच चलाएँ              |
| `clawdock-token`       | Gateway टोकन प्रिंट करें                 |
| `clawdock-cd`          | OpenClaw प्रोजेक्ट डायरेक्टरी पर जाएँ  |
| `clawdock-config`      | `~/.openclaw` खोलें                      |
| `clawdock-show-config` | संशोधित मानों के साथ कॉन्फ़िगरेशन फ़ाइलें प्रिंट करें |
| `clawdock-workspace`   | वर्कस्पेस डायरेक्टरी खोलें            |
| `clawdock-help`        | सभी ClawDock कमांड सूचीबद्ध करें              |

## पहली बार की प्रक्रिया

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

## कॉन्फ़िगरेशन और सीक्रेट

ClawDock दो अलग-अलग `.env` फ़ाइलें पढ़ता है, जो [Docker](/hi/install/docker) में वर्णित विभाजन से मेल खाती हैं:

- प्रोजेक्ट की `.env`, जो `docker-compose.yml` के बगल में है: Docker-विशिष्ट मान, जैसे इमेज का नाम, पोर्ट और `OPENCLAW_GATEWAY_TOKEN`। `clawdock-token` यहाँ से टोकन पढ़ता है।
- `~/.openclaw/.env` (कंटेनर में माउंट की गई): परिवेश-समर्थित सीक्रेट जिन्हें OpenClaw स्वयं प्रबंधित करता है, साथ ही `openclaw.json` और `agents/<agentId>/agent/auth-profiles.json`।

`clawdock-fix-token` प्रोजेक्ट की `.env` से टोकन को कंटेनर के `gateway.remote.token` और `gateway.auth.token` कॉन्फ़िगरेशन मानों में कॉपी करता है और Gateway को पुनः शुरू करता है।

`openclaw.json` और दोनों `.env` फ़ाइलों की शीघ्र जाँच के लिए `clawdock-show-config` का उपयोग करें; यह अपने प्रिंट किए गए आउटपुट में `.env` मानों को छिपा देता है।

## संबंधित

<CardGroup cols={2}>
  <Card title="Docker" href="/hi/install/docker" icon="docker">
    OpenClaw के लिए मानक Docker इंस्टॉलेशन।
  </Card>
  <Card title="Docker VM रनटाइम" href="/hi/install/docker-vm-runtime" icon="cube">
    सुदृढ़ पृथक्करण के लिए Docker-प्रबंधित VM रनटाइम।
  </Card>
  <Card title="अपडेट करना" href="/hi/install/updating" icon="arrow-up-right-from-square">
    OpenClaw पैकेज और प्रबंधित सेवाओं को अपडेट करना।
  </Card>
</CardGroup>
