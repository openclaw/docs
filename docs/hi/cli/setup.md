---
read_when:
    - आप CLI ऑनबोर्डिंग विज़ार्ड के साथ पहली बार सेटअप कर रहे हैं
    - आप डिफ़ॉल्ट कार्यस्थान पथ सेट करना चाहते हैं
    - आपको scripts के लिए केवल-बेसलाइन सेटअप फ़्लैग चाहिए
summary: '`openclaw setup` के लिए CLI संदर्भ (ऑनबोर्डिंग का उपनाम, फ़्लैग के ज़रिए बेसलाइन सेटअप उपलब्ध)'
title: सेटअप
x-i18n:
    generated_at: "2026-06-30T22:18:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

पूरा CLI ऑनबोर्डिंग प्रवाह चलाएँ। `openclaw setup`, `openclaw onboard` का उपनाम है; जब आपको विज़ार्ड के बिना केवल config/workspace फ़ोल्डर शुरू करने हों, तब `--baseline` का उपयोग करें।

<Note>
`openclaw setup` परिवर्तनशील config इंस्टॉल के लिए है। Nix मोड (`OPENCLAW_NIX_MODE=1`) में OpenClaw setup writes से इनकार करता है क्योंकि config फ़ाइल Nix द्वारा प्रबंधित होती है। प्रथम-पक्ष [nix-openclaw त्वरित शुरुआत](https://github.com/openclaw/nix-openclaw#quick-start) या किसी अन्य Nix पैकेज के लिए समतुल्य स्रोत config का उपयोग करें।
</Note>

## विकल्प

| Flag                       | विवरण                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | एजेंट workspace डायरेक्टरी (डिफ़ॉल्ट `~/.openclaw/workspace`; `agents.defaults.workspace` के रूप में संग्रहीत)। |
| `--baseline`               | ऑनबोर्डिंग के बिना baseline config/workspace/session फ़ोल्डर बनाएँ।                                |
| `--wizard`                 | compatibility के लिए स्वीकार किया जाता है; setup डिफ़ॉल्ट रूप से ऑनबोर्डिंग चलाता है।                                       |
| `--non-interactive`        | prompts के बिना ऑनबोर्डिंग चलाएँ।                                                                     |
| `--accept-risk`            | पूर्ण-सिस्टम एजेंट एक्सेस जोखिम स्वीकार करें; `--non-interactive` के साथ आवश्यक।                       |
| `--mode <mode>`            | ऑनबोर्डिंग मोड: `local` या `remote`।                                                               |
| `--import-from <provider>` | ऑनबोर्डिंग के दौरान चलाने के लिए migration provider।                                                        |
| `--import-source <path>`   | `--import-from` के लिए source agent home।                                                              |
| `--import-secrets`         | ऑनबोर्डिंग migration के दौरान समर्थित secrets import करें।                                               |
| `--remote-url <url>`       | Remote Gateway WebSocket URL।                                                                       |
| `--remote-token <token>`   | Remote Gateway token (वैकल्पिक)।                                                                    |

### Baseline मोड

`openclaw setup --baseline` पुराने baseline-only व्यवहार को सुरक्षित रखता है: यह config, workspace, और session डायरेक्टरी बनाता है, फिर ऑनबोर्डिंग चलाए बिना बाहर निकल जाता है।

## उदाहरण

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## नोट्स

- सादा `openclaw setup`, `openclaw onboard` जैसी ही निर्देशित यात्रा चलाता है।
- baseline setup के बाद, पूरी निर्देशित यात्रा के लिए `openclaw setup` या `openclaw onboard` चलाएँ, लक्षित बदलावों के लिए `openclaw configure`, या channel खातों को जोड़ने के लिए `openclaw channels add` चलाएँ।
- यदि Hermes state पहचानी जाती है, तो interactive ऑनबोर्डिंग अपने आप migration की पेशकश कर सकती है। Import ऑनबोर्डिंग के लिए fresh setup आवश्यक है; ऑनबोर्डिंग के बाहर dry-run plans, backups, और overwrite mode के लिए [Migrate](/hi/cli/migrate) का उपयोग करें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [ऑनबोर्डिंग (CLI)](/hi/start/wizard)
- [शुरू करना](/hi/start/getting-started)
- [इंस्टॉल अवलोकन](/hi/install)
