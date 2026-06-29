---
read_when:
    - आप code_execution को सक्षम या कॉन्फ़िगर करना चाहते हैं
    - आप स्थानीय shell एक्सेस के बिना रिमोट विश्लेषण चाहते हैं
    - आप x_search या web_search को रिमोट Python विश्लेषण के साथ जोड़ना चाहते हैं
summary: 'code_execution: xAI के साथ सैंडबॉक्स किए गए रिमोट Python विश्लेषण चलाएँ'
title: कोड निष्पादन
x-i18n:
    generated_at: "2026-06-29T00:17:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` xAI के Responses API पर सैंडबॉक्स किए गए रिमोट Python विश्लेषण चलाता है। इसे बंडल किए गए `xai` Plugin द्वारा (`tools` अनुबंध के अंतर्गत) पंजीकृत किया जाता है और यह उसी `https://api.x.ai/v1/responses` एंडपॉइंट पर भेजता है जिसका उपयोग `x_search` करता है।

| गुण                | मान                                                                               |
| ------------------ | --------------------------------------------------------------------------------- |
| टूल नाम            | `code_execution`                                                                  |
| Provider Plugin    | `xai` (बंडल किया गया, `enabledByDefault: true`)                                   |
| Auth               | xAI auth प्रोफ़ाइल, `XAI_API_KEY`, या `plugins.entries.xai.config.webSearch.apiKey` |
| डिफ़ॉल्ट मॉडल      | `grok-4-1-fast`                                                                   |
| डिफ़ॉल्ट टाइमआउट   | 30 सेकंड                                                                          |
| डिफ़ॉल्ट `maxTurns` | सेट नहीं (xAI अपनी आंतरिक सीमा लागू करता है)                                      |

यह स्थानीय [`exec`](/hi/tools/exec) से अलग है:

- `exec` आपकी मशीन या paired node पर shell कमांड चलाता है।
- `code_execution` xAI के रिमोट सैंडबॉक्स में Python चलाता है।

`code_execution` का उपयोग इनके लिए करें:

- गणनाएं।
- सारणीकरण।
- त्वरित सांख्यिकी।
- चार्ट-शैली विश्लेषण।
- `x_search` या `web_search` द्वारा लौटाए गए डेटा का विश्लेषण।

जब आपको स्थानीय फ़ाइलों, अपने shell, अपने repo, या paired devices की आवश्यकता हो, तो इसका उपयोग **न करें**। उसके लिए [`exec`](/hi/tools/exec) का उपयोग करें।

## सेटअप

<Steps>
  <Step title="xAI credentials प्रदान करें">
    पात्र SuperGrok या X Premium सदस्यता का उपयोग करके Grok OAuth से साइन इन करें,
    या API key संग्रहीत करें। xAI OAuth device-code verification का उपयोग करता है, इसलिए यह
    localhost callback के बिना रिमोट hosts से काम करता है। OAuth
    `code_execution` और `x_search` के लिए काम करता है; `XAI_API_KEY` या Plugin web-search config
    Grok `web_search` को भी चला सकते हैं।

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    नए install के दौरान, वही auth विकल्प onboarding के अंदर उपलब्ध होते हैं:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    या API key का उपयोग करें:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    या config के माध्यम से:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="code_execution सक्षम और ट्यून करें">
    xAI credentials उपलब्ध होने पर `code_execution` उपलब्ध होता है। इसे अक्षम करने के लिए
    `plugins.entries.xai.config.codeExecution.enabled` को `false` पर सेट करें,
    या model और timeout को ट्यून करने के लिए उसी block का उपयोग करें।

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Gateway को restart करें">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin के `enabled: true` के साथ फिर से register होने के बाद `code_execution` agent की tool list में दिखाई देता है।

  </Step>
</Steps>

## इसका उपयोग कैसे करें

स्वाभाविक रूप से पूछें और विश्लेषण का उद्देश्य स्पष्ट करें:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

टूल आंतरिक रूप से एक ही `task` parameter लेता है, इसलिए agent को पूरा analysis request और कोई भी inline data एक prompt में भेजना चाहिए।

## त्रुटियां

जब टूल auth के बिना चलता है, तो यह auth-profile, env var, और config विकल्पों की ओर संकेत करने वाली संरचित `missing_xai_api_key` error लौटाता है। error JSON है, thrown exception नहीं, इसलिए agent स्वयं सुधार कर सकता है:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## सीमाएं

- यह रिमोट xAI execution है, स्थानीय process execution नहीं।
- परिणामों को ephemeral analysis मानें, persistent notebook session नहीं।
- स्थानीय फ़ाइलों या अपने workspace तक access मानकर न चलें।
- ताज़ा X data के लिए, पहले [`x_search`](/hi/tools/web#x_search) का उपयोग करें और परिणाम को `code_execution` में pipe करें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Exec tool" href="/hi/tools/exec" icon="terminal">
    आपकी मशीन या paired node पर स्थानीय shell execution।
  </Card>
  <Card title="Exec approvals" href="/hi/tools/exec-approvals" icon="shield">
    shell execution के लिए allow/deny policy।
  </Card>
  <Card title="Web tools" href="/hi/tools/web" icon="globe">
    `web_search`, `x_search`, और `web_fetch`।
  </Card>
  <Card title="xAI provider" href="/hi/providers/xai" icon="microchip">
    Grok models, web/x search, और code execution config।
  </Card>
</CardGroup>
