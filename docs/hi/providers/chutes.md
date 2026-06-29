---
read_when:
    - आप OpenClaw के साथ Chutes का उपयोग करना चाहते हैं
    - आपको OAuth या API कुंजी सेटअप पथ चाहिए
    - आप डिफ़ॉल्ट मॉडल, उपनाम या खोज व्यवहार चाहते हैं
summary: Chutes सेटअप (OAuth या API कुंजी, मॉडल खोज, aliases)
title: Chutes
x-i18n:
    generated_at: "2026-06-28T23:57:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) एक
OpenAI-संगत API के माध्यम से ओपन-सोर्स मॉडल कैटलॉग उपलब्ध कराता है। OpenClaw `chutes` provider के लिए ब्राउज़र OAuth और प्रत्यक्ष API-key
auth, दोनों का समर्थन करता है।

| गुण | मान                        |
| -------- | ---------------------------- |
| Provider | `chutes`                     |
| API      | OpenAI-संगत            |
| Base URL | `https://llm.chutes.ai/v1`   |
| Auth     | OAuth या API key (नीचे देखें) |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway फिर से शुरू करें:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## शुरू करना

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth ऑनबोर्डिंग फ़्लो चलाएँ">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw ब्राउज़र फ़्लो को स्थानीय रूप से शुरू करता है, या रिमोट/हेडलेस होस्ट पर URL + redirect-paste
        फ़्लो दिखाता है। OAuth टोकन OpenClaw auth
        profiles के माध्यम से अपने आप रीफ़्रेश होते हैं।
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सत्यापित करें">
        ऑनबोर्डिंग के बाद, डिफ़ॉल्ट मॉडल
        `chutes/zai-org/GLM-4.7-TEE` पर सेट होता है और Chutes स्थिर कैटलॉग
        पंजीकृत हो जाता है।
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="API key प्राप्त करें">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) पर key बनाएँ।
      </Step>
      <Step title="API key ऑनबोर्डिंग फ़्लो चलाएँ">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल सत्यापित करें">
        ऑनबोर्डिंग के बाद, डिफ़ॉल्ट मॉडल
        `chutes/zai-org/GLM-4.7-TEE` पर सेट होता है और Chutes स्थिर कैटलॉग
        पंजीकृत हो जाता है।
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
दोनों auth paths Chutes स्थिर कैटलॉग पंजीकृत करते हैं और डिफ़ॉल्ट मॉडल को
`chutes/zai-org/GLM-4.7-TEE` पर सेट करते हैं। Runtime environment variables: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## खोज व्यवहार

जब Chutes auth उपलब्ध हो, OpenClaw उस
credential के साथ Chutes कैटलॉग को क्वेरी करता है और खोजे गए मॉडलों का उपयोग करता है। यदि discovery विफल हो जाए, तो OpenClaw
स्थिर कैटलॉग पर fallback करता है ताकि ऑनबोर्डिंग और startup फिर भी काम करें।

## डिफ़ॉल्ट aliases

OpenClaw Chutes स्थिर कैटलॉग के लिए तीन सुविधा aliases पंजीकृत करता है:

| Alias           | लक्षित मॉडल                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## बिल्ट-इन starter catalog

स्थिर fallback catalog में वर्तमान Chutes refs शामिल हैं:

| Model ref                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Config उदाहरण

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth overrides">
    आप वैकल्पिक environment variables के साथ OAuth फ़्लो को कस्टमाइज़ कर सकते हैं:

    | Variable | उद्देश्य |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | कस्टम OAuth client ID |
    | `CHUTES_CLIENT_SECRET` | कस्टम OAuth client secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | कस्टम redirect URI |
    | `CHUTES_OAUTH_SCOPES` | कस्टम OAuth scopes |

    redirect-app आवश्यकताओं और सहायता के लिए [Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview)
    देखें।

  </Accordion>

  <Accordion title="नोट्स">
    - API-key और OAuth discovery, दोनों समान `chutes` provider id का उपयोग करते हैं।
    - Chutes मॉडल `chutes/<model-id>` के रूप में पंजीकृत होते हैं।
    - यदि startup पर discovery विफल हो जाए, तो स्थिर कैटलॉग अपने आप उपयोग किया जाता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    Provider नियम, मॉडल refs, और failover व्यवहार।
  </Card>
  <Card title="Configuration संदर्भ" href="/hi/gateway/configuration-reference" icon="gear">
    provider settings सहित पूरा config schema।
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes डैशबोर्ड और API docs।
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API keys बनाएँ और प्रबंधित करें।
  </Card>
</CardGroup>
