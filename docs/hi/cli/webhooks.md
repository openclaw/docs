---
read_when:
    - आप Gmail Pub/Sub इवेंट को OpenClaw से जोड़ना चाहते हैं
    - आपको सभी फ़्लैग की सूची और डिफ़ॉल्ट मान चाहिए
summary: '`openclaw webhooks` (Gmail Pub/Sub सेटअप और रनर) के लिए CLI संदर्भ'
title: Webhooks
x-i18n:
    generated_at: "2026-07-16T14:08:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Webhook सहायक और एकीकरण। वर्तमान में यह सतह बंडल किए गए `gog` वॉचर पर निर्मित Gmail Pub/Sub प्रवाहों तक सीमित है।

## उपकमांड

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| उपकमांड    | विवरण                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| `gmail setup` | एक-बार चलने वाला विज़ार्ड: Gmail वॉच, Pub/Sub टॉपिक/सब्सक्रिप्शन और OpenClaw हुक डिलीवरी। |
| `gmail run`   | `gog watch serve` और वॉच के स्वतः-नवीनीकरण लूप को अग्रभूमि में चलाएँ।               |

<Note>
`hooks.enabled=true` और `hooks.gmail.account` सेट होने पर Gateway बूट के दौरान `gog gmail watch serve` को भी स्वतः आरंभ करता है (इन्हें `gmail setup` द्वारा सेट किया जाता है)। `gmail run` अग्रभूमि में वही लॉजिक है, जो डीबगिंग के लिए या Gateway वॉचर अक्षम होने पर उपयोगी है। स्वतः-आरंभ के विवरण और `OPENCLAW_SKIP_GMAIL_WATCHER` ऑप्ट-आउट के लिए [Gmail Pub/Sub एकीकरण](/hi/automation/cron-jobs#gmail-pubsub-integration) देखें।
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

यदि `gcloud` और `gog` मौजूद नहीं हैं, तो उन्हें इंस्टॉल करता है, `gcloud` को प्रमाणित करता है, Pub/Sub टॉपिक और सब्सक्रिप्शन बनाता है, Gmail वॉच आरंभ करता है और `hooks.enabled=true` के साथ `hooks.gmail` कॉन्फ़िग लिखता है। `Next: openclaw webhooks gmail run` प्रिंट करता है।

### आवश्यक

| फ़्लैग                | विवरण             |
| ------------------- | ----------------------- |
| `--account <email>` | मॉनिटर किया जाने वाला Gmail खाता। |

### Pub/Sub विकल्प

| फ़्लैग                    | डिफ़ॉल्ट                | विवरण                                                                                                                             |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (कोई नहीं)                 | GCP प्रोजेक्ट आईडी (OAuth क्लाइंट का स्वामी)। उपलब्ध न होने पर पहले टॉपिक की अपनी प्रोजेक्ट आईडी और फिर `gog` क्रेडेंशियल से निर्धारित प्रोजेक्ट का उपयोग करता है। |
| `--topic <name>`        | `gog-gmail-watch`      | Pub/Sub टॉपिक का नाम।                                                                                                                     |
| `--subscription <name>` | `gog-gmail-watch-push` | Pub/Sub सब्सक्रिप्शन का नाम।                                                                                                              |
| `--label <label>`       | `INBOX`                | मॉनिटर किया जाने वाला Gmail लेबल।                                                                                                                   |
| `--push-endpoint <url>` | (कोई नहीं)                 | स्पष्ट Pub/Sub पुश एंडपॉइंट। Tailscale को ओवरराइड करता है।                                                                                    |

### OpenClaw डिलीवरी विकल्प

| फ़्लैग                   | डिफ़ॉल्ट                                      | विवरण                                |
| ---------------------- | -------------------------------------------- | ------------------------------------------ |
| `--hook-url <url>`     | `hooks.path` और Gateway पोर्ट से निर्मित | OpenClaw Webhook URL।                      |
| `--hook-token <token>` | `hooks.token`, या जनरेट किया गया टोकन          | OpenClaw Webhook टोकन।                    |
| `--push-token <token>` | जनरेट किया गया टोकन                              | `gog watch serve` को अग्रेषित किया जाने वाला पुश टोकन। |

### `gog watch serve` विकल्प

| फ़्लैग                  | डिफ़ॉल्ट         | विवरण                                                                                                                                  |
| --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | `gog watch serve` बाइंड होस्ट।                                                                                                                 |
| `--port <port>`       | `8788`          | `gog watch serve` पोर्ट।                                                                                                                      |
| `--path <path>`       | `/gmail-pubsub` | `gog watch serve` पथ। किसी स्पष्ट लक्ष्य के बिना Tailscale सक्षम होने पर इसे अनिवार्य रूप से `/` किया जाता है, क्योंकि Tailscale प्रॉक्सी करने से पहले पथ हटा देता है। |
| `--include-body`      | `true`          | ईमेल बॉडी स्निपेट शामिल करें। इसे बंद करने के लिए कोई CLI फ़्लैग नहीं है; इसके बजाय कॉन्फ़िग में `hooks.gmail.includeBody: false` सेट करें।                  |
| `--max-bytes <n>`     | `20000`         | प्रति बॉडी स्निपेट अधिकतम बाइट।                                                                                                                  |
| `--renew-minutes <n>` | `720` (12h)     | प्रत्येक N मिनट में Gmail वॉच का नवीनीकरण करें।                                                                                                           |

### Tailscale एक्सपोज़र

| फ़्लैग                      | डिफ़ॉल्ट  | विवरण                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | tailscale के माध्यम से पुश एंडपॉइंट एक्सपोज़ करें: `funnel`, `serve`, या `off`। |
| `--tailscale-path <path>` | (कोई नहीं)   | tailscale serve/funnel के लिए पथ।                                 |
| `--tailscale-target <t>`  | (कोई नहीं)   | Tailscale serve/funnel लक्ष्य (पोर्ट, `host:port`, या URL)।       |

### आउटपुट

| फ़्लैग     | विवरण                                       |
| -------- | ------------------------------------------------- |
| `--json` | टेक्स्ट के बजाय मशीन-पठनीय सारांश प्रिंट करें। |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

`gog watch serve` और वॉच के स्वतः-नवीनीकरण लूप को अग्रभूमि में चलाता है और यदि `gog watch serve` अप्रत्याशित रूप से बंद हो जाए, तो 2s की देरी के बाद उसे पुनः आरंभ करता है।

`run`, `setup` के समान Pub/Sub, OpenClaw डिलीवरी, `gog watch serve` और Tailscale फ़्लैग स्वीकार करता है, सिवाय इसके कि:

- `--account`, `run` पर **वैकल्पिक** है; उपलब्ध न होने पर यह `hooks.gmail.account` का उपयोग करता है।
- `run`, `--project`, `--push-endpoint`, या `--json` स्वीकार **नहीं** करता है।
- प्रत्येक फ़्लैग पहले संबंधित `hooks.gmail.*` कॉन्फ़िग मान (जिसे `setup` लिखता है) और फिर उसी बिल्ट-इन डिफ़ॉल्ट का उपयोग करता है जिसका उपयोग `setup` करता है, एक अपवाद के साथ: जब न तो फ़्लैग और न ही `hooks.gmail.tailscale.mode` सेट हो, तो `run` पर `--tailscale` का डिफ़ॉल्ट `off` होता है (`funnel` नहीं)।

| श्रेणी          | फ़्लैग                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| Pub/Sub           | `--account`, `--topic`, `--subscription`, `--label`                              |
| OpenClaw डिलीवरी | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve` | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale         | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
`run` के लिए, `--topic` मान पूरा Pub/Sub टॉपिक पथ (`projects/.../topics/...`) है, केवल संक्षिप्त टॉपिक नाम नहीं।
</Note>

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Webhook स्वचालन](/hi/automation/cron-jobs)
- [Gmail Pub/Sub एकीकरण](/hi/automation/cron-jobs#gmail-pubsub-integration)
