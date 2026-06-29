---
read_when:
    - उन्नत मोड के डिफ़ॉल्ट, अनुमति-सूचियाँ, या स्लैश कमांड व्यवहार समायोजित करना
    - यह समझना कि सैंडबॉक्स किए गए एजेंट host तक कैसे पहुंच सकते हैं
summary: 'उन्नत exec मोड: sandboxed agent से sandbox के बाहर commands चलाएँ'
title: उन्नत मोड
x-i18n:
    generated_at: "2026-06-29T00:18:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
---

जब कोई agent sandbox के अंदर चलता है, तो उसके `exec` commands sandbox environment तक सीमित रहते हैं। **एलिवेटेड मोड** agent को इससे बाहर निकलकर sandbox के बाहर commands चलाने देता है, configurable approval gates के साथ।

<Info>
  एलिवेटेड मोड behavior केवल तब बदलता है जब agent **sandboxed** हो। Unsandboxed agents के लिए, exec पहले से ही host पर चलता है।
</Info>

## Directives

Slash commands से प्रति-session एलिवेटेड मोड नियंत्रित करें:

| Directive        | यह क्या करता है |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | configured host path पर sandbox के बाहर चलाएं, approvals बनाए रखें |
| `/elevated ask`  | `on` जैसा ही (alias) |
| `/elevated full` | configured host path पर sandbox के बाहर चलाएं और approvals छोड़ दें |
| `/elevated off`  | sandbox-confined execution पर वापस जाएं |

यह `/elev on|off|ask|full` के रूप में भी उपलब्ध है।

वर्तमान level देखने के लिए बिना argument के `/elevated` भेजें।

## यह कैसे काम करता है

<Steps>
  <Step title="उपलब्धता जांचें">
    Elevated को config में enabled होना चाहिए और sender allowlist पर होना चाहिए:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Level सेट करें">
    session default सेट करने के लिए directive-only message भेजें:

    ```
    /elevated full
    ```

    या इसे inline उपयोग करें (केवल उस message पर लागू होता है):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commands sandbox के बाहर चलते हैं">
    Elevated active होने पर, `exec` calls sandbox छोड़ देती हैं। Effective host default रूप से `gateway` होता है, या `node` जब configured/session exec target `node` हो। `full` mode में, exec approvals छोड़ दिए जाते हैं। `on`/`ask` mode में, configured approval rules फिर भी लागू होते हैं।
  </Step>
</Steps>

## Resolution order

1. message पर **Inline directive** (केवल उस message पर लागू होता है)
2. **Session override** (directive-only message भेजकर सेट किया गया)
3. **Global default** (config में `agents.defaults.elevatedDefault`)

## उपलब्धता और allowlists

- **Global gate**: `tools.elevated.enabled` (`true` होना चाहिए)
- **Sender allowlist**: per-channel lists के साथ `tools.elevated.allowFrom`
- **Per-agent gate**: `agents.list[].tools.elevated.enabled` (केवल और restrict कर सकता है)
- **Per-agent allowlist**: `agents.list[].tools.elevated.allowFrom` (sender को global + per-agent दोनों से match करना होगा)
- **Discord fallback**: यदि `tools.elevated.allowFrom.discord` omit किया गया है, तो `channels.discord.allowFrom` fallback के रूप में उपयोग होता है
- **सभी gates pass होने चाहिए**; अन्यथा elevated को unavailable माना जाता है

Allowlist entry formats:

| Prefix                  | Matches                         |
| ----------------------- | ------------------------------- |
| (none)                  | Sender ID, E.164, या From field |
| `name:`                 | Sender display name             |
| `username:`             | Sender username                 |
| `tag:`                  | Sender tag                      |
| `id:`, `from:`, `e164:` | Explicit identity targeting     |

## Elevated क्या नियंत्रित नहीं करता

- **Tool policy**: यदि `exec` tool policy द्वारा denied है, तो elevated इसे override नहीं कर सकता।
- **Host selection policy**: elevated `auto` को free cross-host override में नहीं बदलता। यह configured/session exec target rules का उपयोग करता है, और `node` केवल तब चुनता है जब target पहले से ही `node` हो।
- **`/exec` से अलग**: `/exec` directive authorized senders के लिए per-session exec defaults adjust करता है और इसके लिए elevated mode की आवश्यकता नहीं होती।

<Note>
  bash chat command (`!` prefix; `/bash` alias) एक अलग gate है जिसके लिए अपने `tools.bash.enabled` flag के अलावा `tools.elevated` enabled होना आवश्यक है। elevated disable करने से `!` shell commands भी lock out हो जाते हैं।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="Exec tool" href="/hi/tools/exec" icon="terminal">
    agent से shell command execution।
  </Card>
  <Card title="Exec approvals" href="/hi/tools/exec-approvals" icon="shield">
    `exec` के लिए approval और allowlist system।
  </Card>
  <Card title="Sandboxing" href="/hi/gateway/sandboxing" icon="box">
    Gateway-level sandbox configuration।
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/hi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    tool call के दौरान तीनों gates कैसे compose होते हैं।
  </Card>
</CardGroup>
