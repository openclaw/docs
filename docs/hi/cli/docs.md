---
read_when:
    - आप टर्मिनल से लाइव OpenClaw दस्तावेज़ खोजना चाहते हैं
    - आपको जानना होगा कि docs CLI किस hosted search API को कॉल करता है
summary: '`openclaw docs` के लिए CLI संदर्भ (लाइव दस्तावेज़ अनुक्रमणिका खोजें)'
title: दस्तावेज़
x-i18n:
    generated_at: "2026-06-28T22:49:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

टर्मिनल से लाइव OpenClaw docs इंडेक्स खोजें। यह कमांड OpenClaw के Cloudflare-होस्टेड docs search API को कॉल करता है और परिणाम आपके टर्मिनल में रेंडर करता है।

## उपयोग

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

आर्ग्युमेंट:

| आर्ग्युमेंट     | विवरण                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | मुक्त-रूप खोज क्वेरी। कई शब्दों वाली क्वेरी को रिक्त स्थानों से जोड़ा जाता है और एक के रूप में भेजा जाता है। |

## उदाहरण

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

बिना क्वेरी के, `openclaw docs` खोज चलाने के बजाय docs एंट्रीपॉइंट URL और एक नमूना खोज कमांड प्रिंट करता है।

## यह कैसे काम करता है

`openclaw docs` `https://docs.openclaw.ai/api/search` को कॉल करता है और JSON परिणाम रेंडर करता है। खोज कॉल एक निश्चित 30 सेकंड टाइमआउट का उपयोग करता है।

## आउटपुट

रिच (TTY) टर्मिनल में, परिणाम एक शीर्षक के बाद बुलेट सूची के रूप में रेंडर होते हैं। हर बुलेट पेज शीर्षक, लिंक किया हुआ docs URL, और अगली पंक्ति में एक छोटा स्निपेट दिखाता है। खाली परिणाम "No results." प्रिंट करते हैं।

नॉन-रिच आउटपुट (पाइप किया हुआ, `--no-color`, scripts) में, वही डेटा Markdown के रूप में रेंडर होता है:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## एग्ज़िट कोड

| कोड | अर्थ                                                           |
| ---- | ----------------------------------------------------------------- |
| `0`  | खोज सफल रही (शून्य-परिणाम प्रतिक्रियाओं सहित)।               |
| `1`  | होस्टेड docs search API कॉल विफल हुई; stderr इनलाइन प्रिंट होता है। |

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [लाइव docs](https://docs.openclaw.ai)
