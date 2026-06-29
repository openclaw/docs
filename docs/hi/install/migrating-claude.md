---
read_when:
    - आप Claude Code या Claude Desktop से आ रहे हैं और निर्देश, MCP सर्वर, और Skills बनाए रखना चाहते हैं
    - आपको यह समझना होगा कि OpenClaw स्वचालित रूप से क्या आयात करता है और क्या केवल संग्रह तक सीमित रहता है
summary: पूर्वावलोकित आयात के साथ Claude Code और Claude Desktop की स्थानीय स्थिति को OpenClaw में ले जाएँ
title: Claude से माइग्रेट करना
x-i18n:
    generated_at: "2026-06-28T23:22:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw स्थानीय Claude स्थिति को बंडल किए गए Claude माइग्रेशन प्रदाता के माध्यम से आयात करता है। प्रदाता स्थिति बदलने से पहले हर आइटम का पूर्वावलोकन करता है, योजनाओं और रिपोर्टों में सीक्रेट्स को रिडैक्ट करता है, और लागू करने से पहले सत्यापित बैकअप बनाता है।

<Note>
ऑनबोर्डिंग आयातों के लिए नया OpenClaw सेटअप आवश्यक है। अगर आपके पास पहले से स्थानीय OpenClaw स्थिति है, तो पहले कॉन्फ़िग, क्रेडेंशियल्स, सेशन्स, और वर्कस्पेस रीसेट करें, या योजना की समीक्षा करने के बाद `--overwrite` के साथ सीधे `openclaw migrate` का उपयोग करें।
</Note>

## आयात करने के दो तरीके

<Tabs>
  <Tab title="Onboarding wizard">
    विज़ार्ड स्थानीय Claude स्थिति का पता लगने पर Claude की पेशकश करता है।

    ```bash
    openclaw onboard --flow import
    ```

    या किसी विशिष्ट स्रोत की ओर इंगित करें:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    स्क्रिप्टेड या दोहराए जा सकने वाले रन के लिए `openclaw migrate` का उपयोग करें। पूर्ण संदर्भ के लिए [`openclaw migrate`](/hi/cli/migrate) देखें।

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    किसी विशिष्ट Claude Code होम या प्रोजेक्ट रूट को आयात करने के लिए `--from <path>` जोड़ें।

  </Tab>
</Tabs>

## क्या आयात होता है

<AccordionGroup>
  <Accordion title="Instructions and memory">
    - प्रोजेक्ट `CLAUDE.md` और `.claude/CLAUDE.md` सामग्री को OpenClaw एजेंट वर्कस्पेस `AGENTS.md` में कॉपी या अपेंड किया जाता है।
    - उपयोगकर्ता `~/.claude/CLAUDE.md` सामग्री को वर्कस्पेस `USER.md` में अपेंड किया जाता है।

  </Accordion>
  <Accordion title="MCP servers">
    MCP सर्वर परिभाषाएँ मौजूद होने पर प्रोजेक्ट `.mcp.json`, Claude Code `~/.claude.json`, और Claude Desktop `claude_desktop_config.json` से आयात की जाती हैं।
  </Accordion>
  <Accordion title="Skills and commands">
    - `SKILL.md` फ़ाइल वाले Claude skills को OpenClaw वर्कस्पेस Skills डायरेक्टरी में कॉपी किया जाता है।
    - `.claude/commands/` या `~/.claude/commands/` के अंतर्गत Claude कमांड Markdown फ़ाइलों को `disable-model-invocation: true` के साथ OpenClaw Skills में बदला जाता है।

  </Accordion>
</AccordionGroup>

## क्या केवल आर्काइव में रहता है

प्रदाता इन्हें मैन्युअल समीक्षा के लिए माइग्रेशन रिपोर्ट में कॉपी करता है, लेकिन इन्हें लाइव OpenClaw कॉन्फ़िग में लोड **नहीं** करता:

- Claude hooks
- Claude अनुमतियाँ और विस्तृत टूल allowlists
- Claude पर्यावरण डिफ़ॉल्ट्स
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` या `~/.claude/agents/` के अंतर्गत Claude subagents
- Claude Code कैश, योजनाएँ, और प्रोजेक्ट इतिहास डायरेक्टरियाँ
- Claude Desktop एक्सटेंशन्स और OS-संग्रहीत क्रेडेंशियल्स

OpenClaw hooks चलाने, अनुमति allowlists पर भरोसा करने, या अपारदर्शी OAuth और Desktop क्रेडेंशियल स्थिति को स्वचालित रूप से डिकोड करने से इनकार करता है। आर्काइव की समीक्षा करने के बाद जो चाहिए उसे हाथ से स्थानांतरित करें।

## स्रोत चयन

`--from` के बिना, OpenClaw `~/.claude` पर डिफ़ॉल्ट Claude Code होम, सैंपल की गई Claude Code `~/.claude.json` स्थिति फ़ाइल, और macOS पर Claude Desktop MCP कॉन्फ़िग की जाँच करता है।

जब `--from` किसी प्रोजेक्ट रूट की ओर इंगित करता है, तो OpenClaw केवल उस प्रोजेक्ट की Claude फ़ाइलें आयात करता है, जैसे `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/`, और `.mcp.json`। यह प्रोजेक्ट-रूट आयात के दौरान आपके ग्लोबल Claude होम को नहीं पढ़ता।

## अनुशंसित प्रवाह

<Steps>
  <Step title="Preview the plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    योजना उन सभी चीज़ों को सूचीबद्ध करती है जो बदलेंगी, जिनमें conflicts, छोड़े गए आइटम, और नेस्टेड MCP `env` या `headers` फ़ील्ड से रिडैक्ट किए गए संवेदनशील मान शामिल हैं।

  </Step>
  <Step title="Apply with backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw लागू करने से पहले बैकअप बनाता और सत्यापित करता है।

  </Step>
  <Step title="Run doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/hi/gateway/doctor) आयात के बाद कॉन्फ़िग या स्थिति समस्याओं की जाँच करता है।

  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    पुष्टि करें कि Gateway स्वस्थ है और आपके आयातित निर्देश, MCP सर्वर, और skills लोड हैं।

  </Step>
</Steps>

## Conflict प्रबंधन

जब योजना conflicts की रिपोर्ट करती है (लक्ष्य पर फ़ाइल या कॉन्फ़िग मान पहले से मौजूद है), तो लागू करना आगे बढ़ने से इनकार करता है।

<Warning>
`--overwrite` के साथ दोबारा केवल तब चलाएँ जब मौजूदा लक्ष्य को बदलना जानबूझकर हो। प्रदाता अभी भी माइग्रेशन रिपोर्ट डायरेक्टरी में overwrite की गई फ़ाइलों के लिए आइटम-स्तरीय बैकअप लिख सकते हैं।
</Warning>

नए OpenClaw इंस्टॉल के लिए conflicts असामान्य हैं। वे आम तौर पर तब दिखाई देते हैं जब आप ऐसे सेटअप पर आयात दोबारा चलाते हैं जिसमें पहले से उपयोगकर्ता edits मौजूद हैं।

## ऑटोमेशन के लिए JSON आउटपुट

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--json` और बिना `--yes` के, apply योजना प्रिंट करता है और स्थिति को नहीं बदलता। यह CI और साझा scripts के लिए सबसे सुरक्षित मोड है।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Claude state lives outside ~/.claude">
    `--from /actual/path` (CLI) या `--import-source /actual/path` (ऑनबोर्डिंग) पास करें।
  </Accordion>
  <Accordion title="Onboarding refuses to import on an existing setup">
    ऑनबोर्डिंग आयातों के लिए नया सेटअप आवश्यक है। या तो स्थिति रीसेट करें और फिर से ऑनबोर्ड करें, या सीधे `openclaw migrate apply claude` का उपयोग करें, जो `--overwrite` और स्पष्ट बैकअप नियंत्रण का समर्थन करता है।
  </Accordion>
  <Accordion title="MCP servers from Claude Desktop did not import">
    Claude Desktop `claude_desktop_config.json` को प्लेटफ़ॉर्म-विशिष्ट पथ से पढ़ता है। अगर OpenClaw ने इसे स्वचालित रूप से नहीं पहचाना, तो `--from` को उस फ़ाइल की डायरेक्टरी पर इंगित करें।
  </Accordion>
  <Accordion title="Claude commands became skills with model invocation disabled">
    यह डिज़ाइन के अनुसार है। Claude कमांड उपयोगकर्ता-द्वारा-ट्रिगर होते हैं, इसलिए OpenClaw उन्हें `disable-model-invocation: true` के साथ skills के रूप में आयात करता है। अगर आप चाहते हैं कि एजेंट उन्हें स्वचालित रूप से invoke करे, तो प्रत्येक skill का frontmatter संपादित करें।
  </Accordion>
</AccordionGroup>

## संबंधित

- [`openclaw migrate`](/hi/cli/migrate): पूर्ण CLI संदर्भ, Plugin कॉन्ट्रैक्ट, और JSON shapes।
- [माइग्रेशन गाइड](/hi/install/migrating): सभी माइग्रेशन पथ।
- [Hermes से माइग्रेट करना](/hi/install/migrating-hermes): दूसरा cross-system आयात पथ।
- [ऑनबोर्डिंग](/hi/cli/onboard): विज़ार्ड प्रवाह और non-interactive flags।
- [Doctor](/hi/gateway/doctor): माइग्रेशन के बाद स्वास्थ्य जाँच।
- [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace): जहाँ `AGENTS.md`, `USER.md`, और skills रहते हैं।
