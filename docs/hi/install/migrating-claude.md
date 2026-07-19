---
read_when:
    - आप Claude Code या Claude Desktop से आ रहे हैं और निर्देशों, MCP सर्वरों तथा कौशलों को बनाए रखना चाहते हैं
    - आपको यह समझना होगा कि OpenClaw क्या स्वचालित रूप से आयात करता है और क्या केवल संग्रह में रहता है
summary: पूर्वावलोकन किए गए आयात के साथ Claude Code और Claude Desktop की स्थानीय स्थिति को OpenClaw में स्थानांतरित करें
title: Claude से माइग्रेट करना
x-i18n:
    generated_at: "2026-07-19T08:47:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw बंडल किए गए Claude माइग्रेशन प्रोवाइडर के माध्यम से स्थानीय Claude स्थिति आयात करता है। प्रोवाइडर स्थिति बदलने से पहले प्रत्येक आइटम का पूर्वावलोकन करता है, योजनाओं और रिपोर्टों में सीक्रेट्स छिपाता है, और लागू करने से पहले एक सत्यापित बैकअप बनाता है।

<Note>
ऑनबोर्डिंग आयात के लिए नया OpenClaw सेटअप आवश्यक है। यदि आपके पास पहले से स्थानीय OpenClaw स्थिति है, तो पहले कॉन्फ़िगरेशन, क्रेडेंशियल्स, सेशन और वर्कस्पेस रीसेट करें, या योजना की समीक्षा करने के बाद `--overwrite` के साथ सीधे `openclaw migrate` का उपयोग करें।
</Note>

## आयात करने के दो तरीके

<Tabs>
  <Tab title="ऑनबोर्डिंग विज़ार्ड">
    स्थानीय Claude स्थिति का पता चलने पर विज़ार्ड Claude का विकल्प देता है।

    ```bash
    openclaw onboard --flow import
    ```

    या किसी विशिष्ट स्रोत को इंगित करें:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    स्क्रिप्ट किए गए या दोहराए जा सकने वाले रन के लिए `openclaw migrate` का उपयोग करें। पूर्ण संदर्भ के लिए [`openclaw migrate`](/hi/cli/migrate) देखें।

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    किसी विशिष्ट Claude Code होम या प्रोजेक्ट रूट को आयात करने के लिए `--from <path>` जोड़ें।

  </Tab>
</Tabs>

## क्या आयात होता है

<AccordionGroup>
  <Accordion title="निर्देश और मेमोरी">
    - प्रोजेक्ट की `CLAUDE.md` और `.claude/CLAUDE.md` सामग्री को OpenClaw एजेंट वर्कस्पेस की `AGENTS.md` में कॉपी या संलग्न किया जाता है।
    - उपयोगकर्ता की `~/.claude/CLAUDE.md` सामग्री को वर्कस्पेस की `USER.md` में संलग्न किया जाता है।

  </Accordion>
  <Accordion title="MCP सर्वर">
    उपलब्ध होने पर MCP सर्वर परिभाषाएँ प्रोजेक्ट की `.mcp.json`, Claude Code की `~/.claude.json`, और Claude Desktop की `claude_desktop_config.json` से आयात की जाती हैं।
  </Accordion>
  <Accordion title="Skills और कमांड">
    - `SKILL.md` फ़ाइल वाली Claude Skills को OpenClaw वर्कस्पेस की Skills डायरेक्टरी में कॉपी किया जाता है।
    - `.claude/commands/` या `~/.claude/commands/` के अंतर्गत Claude कमांड की Markdown फ़ाइलों को `disable-model-invocation: true` वाली OpenClaw Skills में बदला जाता है।

  </Accordion>
</AccordionGroup>

## क्या केवल आर्काइव में रहता है

प्रोवाइडर मैन्युअल समीक्षा के लिए इन्हें माइग्रेशन रिपोर्ट में कॉपी करता है, लेकिन इन्हें सक्रिय OpenClaw कॉन्फ़िगरेशन में लोड **नहीं** करता:

- Claude हुक
- Claude अनुमतियाँ और व्यापक टूल अनुमति-सूचियाँ
- Claude परिवेश के डिफ़ॉल्ट
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` या `~/.claude/agents/` के अंतर्गत Claude सबएजेंट
- Claude Code कैश, योजनाएँ और प्रोजेक्ट इतिहास डायरेक्टरियाँ
- Claude Desktop एक्सटेंशन और OS में संग्रहीत क्रेडेंशियल्स

OpenClaw हुक निष्पादित करने, अनुमति-सूचियों पर भरोसा करने, या अपारदर्शी OAuth और Desktop क्रेडेंशियल स्थिति को स्वचालित रूप से डिकोड करने से इनकार करता है। आर्काइव की समीक्षा करने के बाद आवश्यक सामग्री को मैन्युअल रूप से स्थानांतरित करें।

## स्रोत चयन

`--from` के बिना, OpenClaw `~/.claude` पर डिफ़ॉल्ट Claude Code होम, नमूने के रूप में ली गई Claude Code `~/.claude.json` स्थिति फ़ाइल, और macOS पर Claude Desktop MCP कॉन्फ़िगरेशन की जाँच करता है।

जब `--from` किसी प्रोजेक्ट रूट को इंगित करता है, तो OpenClaw केवल उस प्रोजेक्ट की Claude फ़ाइलें आयात करता है, जैसे `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/`, और `.mcp.json`। प्रोजेक्ट-रूट आयात के दौरान यह आपके वैश्विक Claude होम को नहीं पढ़ता।

## अनुशंसित प्रवाह

<Steps>
  <Step title="योजना का पूर्वावलोकन करें">
    ```bash
    openclaw migrate claude --dry-run
    ```

    योजना में बदलने वाली सभी चीज़ें सूचीबद्ध होती हैं, जिनमें विरोध, छोड़े गए आइटम, और नेस्ट किए गए MCP `env` या `headers` फ़ील्ड से छिपाए गए संवेदनशील मान शामिल हैं।

  </Step>
  <Step title="बैकअप के साथ लागू करें">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw लागू करने से पहले बैकअप बनाकर उसे सत्यापित करता है।

  </Step>
  <Step title="Doctor चलाएँ">
    ```bash
    openclaw doctor
    ```

    आयात के बाद [Doctor](/hi/gateway/doctor) कॉन्फ़िगरेशन या स्थिति संबंधी समस्याओं की जाँच करता है।

  </Step>
  <Step title="पुनः आरंभ करके सत्यापित करें">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    पुष्टि करें कि Gateway स्वस्थ है और आपके आयातित निर्देश, MCP सर्वर और Skills लोड हो गए हैं।

  </Step>
</Steps>

## विरोध प्रबंधन

जब योजना विरोधों की रिपोर्ट करती है—अर्थात लक्ष्य पर कोई फ़ाइल या कॉन्फ़िगरेशन मान पहले से मौजूद है—तो लागू करने की प्रक्रिया आगे बढ़ने से इनकार कर देती है।

<Warning>
`--overwrite` के साथ दोबारा तभी चलाएँ जब मौजूदा लक्ष्य को बदलना जानबूझकर किया जा रहा हो। प्रोवाइडर माइग्रेशन रिपोर्ट डायरेक्टरी में ओवरराइट की गई फ़ाइलों के लिए फिर भी आइटम-स्तरीय बैकअप लिख सकते हैं।
</Warning>

नए OpenClaw इंस्टॉलेशन में विरोध असामान्य होते हैं। वे सामान्यतः तब दिखाई देते हैं जब आप ऐसे सेटअप पर आयात दोबारा चलाते हैं जिसमें पहले से उपयोगकर्ता के संपादन मौजूद हैं।

## स्वचालन के लिए JSON आउटपुट

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

इंटरैक्टिव टर्मिनल के बाहर `migrate apply` के लिए `--yes` आवश्यक है; इसके बिना OpenClaw लागू करने के बजाय त्रुटि देता है, इसलिए स्क्रिप्ट और CI को स्पष्ट रूप से `--yes` देना होगा। पहले `--dry-run --json` के साथ पूर्वावलोकन करें, फिर योजना सही दिखने पर `--json --yes` के साथ लागू करें।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Claude स्थिति ~/.claude के बाहर मौजूद है">
    `--from /actual/path` (CLI) या `--import-source /actual/path` (ऑनबोर्डिंग) दें।
  </Accordion>
  <Accordion title="ऑनबोर्डिंग मौजूदा सेटअप पर आयात करने से इनकार करती है">
    ऑनबोर्डिंग आयात के लिए नया सेटअप आवश्यक है। स्थिति रीसेट करके फिर से ऑनबोर्ड करें, या सीधे `openclaw migrate apply claude` का उपयोग करें, जो `--overwrite` और स्पष्ट बैकअप नियंत्रण का समर्थन करता है।
  </Accordion>
  <Accordion title="Claude Desktop के MCP सर्वर आयात नहीं हुए">
    Claude Desktop प्लेटफ़ॉर्म-विशिष्ट पथ से `claude_desktop_config.json` पढ़ता है। यदि OpenClaw ने इसका स्वतः पता नहीं लगाया, तो `--from` को उस फ़ाइल की डायरेक्टरी पर इंगित करें।
  </Accordion>
  <Accordion title="Claude कमांड ऐसी Skills बन गईं जिनमें मॉडल इनवोकेशन अक्षम है">
    यह अभिकल्पना के अनुसार है। Claude कमांड उपयोगकर्ता द्वारा ट्रिगर किए जाते हैं, इसलिए OpenClaw उन्हें `disable-model-invocation: true` वाली Skills के रूप में आयात करता है। यदि आप चाहते हैं कि एजेंट उन्हें स्वचालित रूप से इनवोक करे, तो प्रत्येक Skill का फ्रंटमैटर संपादित करें।
  </Accordion>
</AccordionGroup>

## संबंधित

- [`openclaw migrate`](/hi/cli/migrate): पूर्ण CLI संदर्भ, Plugin अनुबंध और JSON संरचनाएँ।
- [माइग्रेशन मार्गदर्शिका](/hi/install/migrating): सभी माइग्रेशन पथ।
- [Hermes से माइग्रेट करना](/hi/install/migrating-hermes): दूसरी क्रॉस-सिस्टम आयात प्रक्रिया।
- [ऑनबोर्डिंग](/hi/cli/onboard): विज़ार्ड प्रवाह और गैर-इंटरैक्टिव फ़्लैग।
- [Doctor](/hi/gateway/doctor): माइग्रेशन के बाद की स्वास्थ्य जाँच।
- [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace): वह स्थान जहाँ `AGENTS.md`, `USER.md`, और Skills मौजूद हैं।
