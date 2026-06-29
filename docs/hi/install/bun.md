---
read_when:
    - आप सबसे तेज़ स्थानीय विकास चक्र चाहते हैं (bun + watch)
    - आपको Bun इंस्टॉल/पैच/लाइफसाइकिल स्क्रिप्ट समस्याएँ आईं
summary: 'Bun वर्कफ़्लो (प्रायोगिक): pnpm की तुलना में इंस्टॉल और सावधानियाँ'
title: Bun (प्रायोगिक)
x-i18n:
    generated_at: "2026-06-28T23:19:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun को **gateway रनटाइम के लिए अनुशंसित नहीं किया जाता** (WhatsApp और Telegram के साथ ज्ञात समस्याएँ)। प्रोडक्शन के लिए Node का उपयोग करें।
</Warning>

Bun, TypeScript को सीधे चलाने के लिए एक वैकल्पिक स्थानीय रनटाइम है (`bun run ...`, `bun --watch ...`)। डिफ़ॉल्ट पैकेज मैनेजर `pnpm` ही रहता है, जो पूरी तरह समर्थित है और docs टूलिंग द्वारा उपयोग किया जाता है। Bun `pnpm-lock.yaml` का उपयोग नहीं कर सकता और उसे अनदेखा करेगा।

## इंस्टॉल करें

<Steps>
  <Step title="निर्भरताएँ इंस्टॉल करें">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` gitignored हैं, इसलिए repo churn नहीं होता। lockfile लिखना पूरी तरह छोड़ने के लिए:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="बिल्ड और टेस्ट करें">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## लाइफ़साइकल स्क्रिप्ट

Bun निर्भरता लाइफ़साइकल स्क्रिप्ट को तब तक ब्लॉक करता है जब तक उन पर स्पष्ट रूप से भरोसा न किया जाए। इस repo के लिए, आम तौर पर ब्लॉक होने वाली स्क्रिप्ट आवश्यक नहीं हैं:

- `baileys` `preinstall` -- Node major >= 20 की जाँच करता है (OpenClaw डिफ़ॉल्ट रूप से Node 24 पर है और अभी भी Node 22 LTS का समर्थन करता है, वर्तमान में `22.19+`)
- `protobufjs` `postinstall` -- असंगत संस्करण योजनाओं के बारे में चेतावनियाँ देता है (कोई बिल्ड आर्टिफ़ैक्ट नहीं)

यदि आपको कोई ऐसी रनटाइम समस्या आती है जिसके लिए ये स्क्रिप्ट आवश्यक हैं, तो उन पर स्पष्ट रूप से भरोसा करें:

```sh
bun pm trust baileys protobufjs
```

## सावधानियाँ

कुछ स्क्रिप्ट अभी भी pnpm को हार्डकोड करती हैं (उदाहरण के लिए `check:docs`, `ui:*`, `protocol:check`)। अभी के लिए उन्हें pnpm के माध्यम से चलाएँ।

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install)
- [Node.js](/hi/install/node)
- [अपडेट करना](/hi/install/updating)
