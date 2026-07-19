---
read_when:
    - आप पुनरुत्पाद्य और वापस लौटाए जा सकने वाले इंस्टॉलेशन चाहते हैं
    - आप पहले से ही Nix/NixOS/Home Manager का उपयोग कर रहे हैं
    - आप चाहते हैं कि सब कुछ निश्चित संस्करण पर पिन किया जाए और घोषणात्मक रूप से प्रबंधित हो
summary: Nix के साथ OpenClaw को घोषणात्मक रूप से इंस्टॉल करें
title: Nix
x-i18n:
    generated_at: "2026-07-19T08:56:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

OpenClaw को **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** के साथ घोषणात्मक रूप से इंस्टॉल करें, जो प्रथम-पक्षीय, सभी आवश्यक सुविधाओं वाला Home Manager मॉड्यूल है।

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) रिपॉज़िटरी Nix इंस्टॉलेशन के लिए प्रामाणिक स्रोत है। यह पृष्ठ एक संक्षिप्त अवलोकन है।
</Info>

## आपको क्या मिलता है

- Gateway + macOS ऐप + टूल (whisper, spotify, कैमरे), सभी निश्चित संस्करणों पर पिन किए हुए
- रीबूट के बाद भी चलने वाली Launchd सेवा
- घोषणात्मक कॉन्फ़िगरेशन वाली Plugin प्रणाली
- तत्काल रोलबैक: `home-manager switch --rollback`

## त्वरित शुरुआत

<Steps>
  <Step title="Determinate Nix इंस्टॉल करें">
    यदि Nix पहले से इंस्टॉल नहीं है, तो [Determinate Nix इंस्टॉलर](https://github.com/DeterminateSystems/nix-installer) के निर्देशों का पालन करें।
  </Step>
  <Step title="स्थानीय flake बनाएँ">
    nix-openclaw रिपॉज़िटरी से एजेंट-प्रथम टेम्पलेट का उपयोग करें:
    ```bash
    mkdir -p ~/code/openclaw-local
    # nix-openclaw रिपॉज़िटरी से templates/agent-first/flake.nix कॉपी करें
    ```
  </Step>
  <Step title="सीक्रेट कॉन्फ़िगर करें">
    अपना मैसेजिंग बॉट टोकन और मॉडल प्रदाता API कुंजी सेट करें। `~/.secrets/` पर साधारण फ़ाइलें ठीक काम करती हैं।
  </Step>
  <Step title="टेम्पलेट प्लेसहोल्डर भरें और स्विच करें">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="सत्यापित करें">
    पुष्टि करें कि launchd सेवा चल रही है और आपका बॉट संदेशों का उत्तर देता है।
  </Step>
</Steps>

मॉड्यूल के सभी विकल्पों और उदाहरणों के लिए [nix-openclaw README](https://github.com/openclaw/nix-openclaw) देखें।

## Nix-मोड का रनटाइम व्यवहार

जब `OPENCLAW_NIX_MODE=1` सेट होता है (nix-openclaw के साथ स्वचालित रूप से), तो OpenClaw Nix-प्रबंधित इंस्टॉलेशन के लिए निर्धारक मोड में प्रवेश करता है। अन्य Nix पैकेज भी यही मोड सेट कर सकते हैं; nix-openclaw प्रथम-पक्षीय संदर्भ है।

इसे मैन्युअल रूप से भी सेट किया जा सकता है:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS पर GUI ऐप शेल एनवायरनमेंट वेरिएबल इनहेरिट नहीं करता। इसके बजाय `defaults` के माध्यम से Nix मोड सक्षम करें:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix मोड में क्या बदलता है

- स्वतः इंस्टॉलेशन और स्वयं-परिवर्तन प्रवाह अक्षम हो जाते हैं।
- `openclaw.json` को अपरिवर्तनीय माना जाता है। स्टार्टअप से प्राप्त डिफ़ॉल्ट केवल रनटाइम तक सीमित रहते हैं और कॉन्फ़िगरेशन लेखक (सेटअप, ऑनबोर्डिंग, परिवर्तनकारी `openclaw update`, Plugin इंस्टॉल/अपडेट/अनइंस्टॉल/सक्षम करना, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) फ़ाइल को संपादित करने से मना कर देते हैं।
- इसके बजाय Nix स्रोत संपादित करें। nix-openclaw के लिए, एजेंट-प्रथम [त्वरित शुरुआत](https://github.com/openclaw/nix-openclaw#quick-start) का उपयोग करें और `programs.openclaw.config` या `instances.<name>.config` के अंतर्गत कॉन्फ़िगरेशन सेट करें।
- अनुपलब्ध निर्भरताओं के लिए Nix-विशिष्ट सुधार संदेश दिखाई देते हैं।
- UI केवल-पढ़ने योग्य Nix मोड बैनर दिखाता है।

### कॉन्फ़िगरेशन और स्थिति पथ

OpenClaw `OPENCLAW_CONFIG_PATH` से JSON5 कॉन्फ़िगरेशन पढ़ता है और परिवर्तनशील डेटा को `OPENCLAW_STATE_DIR` में संग्रहीत करता है। Nix के अंतर्गत, इन्हें स्पष्ट रूप से Nix-प्रबंधित स्थानों पर सेट करें, ताकि रनटाइम स्थिति और कॉन्फ़िगरेशन अपरिवर्तनीय स्टोर से बाहर रहें।

| वेरिएबल               | डिफ़ॉल्ट                                 |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### सेवा PATH खोज

launchd/systemd Gateway सेवा Nix-प्रोफ़ाइल बाइनरी को स्वतः खोजती है, ताकि `nix` द्वारा इंस्टॉल किए गए एक्ज़ीक्यूटेबल को शेल के माध्यम से चलाने वाले Plugin और टूल मैन्युअल PATH सेटअप के बिना काम करें:

- जब `NIX_PROFILES` सेट होता है, तो प्रत्येक प्रविष्टि को दाएँ-से-बाएँ प्राथमिकता क्रम में सेवा PATH में जोड़ा जाता है (Nix शेल प्राथमिकता से मेल खाता है: सबसे दाईं प्रविष्टि प्रभावी होती है)।
- जब `NIX_PROFILES` सेट नहीं होता, तो `~/.nix-profile/bin` को फ़ॉलबैक के रूप में जोड़ा जाता है।

यह macOS launchd और Linux systemd, दोनों के सेवा एनवायरनमेंट पर लागू होता है।

## संबंधित

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    प्रामाणिक स्रोत वाला Home Manager मॉड्यूल और संपूर्ण सेटअप मार्गदर्शिका।
  </Card>
  <Card title="सेटअप विज़ार्ड" href="/hi/start/wizard" icon="wand-magic-sparkles">
    गैर-Nix CLI सेटअप का चरण-दर-चरण विवरण।
  </Card>
  <Card title="Docker" href="/hi/install/docker" icon="docker">
    गैर-Nix विकल्प के रूप में कंटेनरीकृत सेटअप।
  </Card>
  <Card title="अपडेट करना" href="/hi/install/updating" icon="arrow-up-right-from-square">
    पैकेज के साथ Home Manager-प्रबंधित इंस्टॉलेशन को अपडेट करना।
  </Card>
</CardGroup>
