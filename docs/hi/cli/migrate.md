---
read_when:
    - आप Hermes या किसी अन्य एजेंट सिस्टम से OpenClaw पर माइग्रेट करना चाहते हैं
    - आप Plugin के स्वामित्व वाला माइग्रेशन प्रदाता जोड़ रहे हैं
summary: '`openclaw migrate` के लिए CLI संदर्भ (किसी अन्य एजेंट सिस्टम से स्थिति आयात करें)'
title: माइग्रेट करें
x-i18n:
    generated_at: "2026-07-19T08:17:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdedb1bf6c9def52079c021e4e77fe008c9394ee352bec299bf154687f62e514
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin के स्वामित्व वाले माइग्रेशन प्रदाता के माध्यम से किसी अन्य एजेंट सिस्टम से स्थिति आयात करें। बंडल किए गए प्रदाता Claude, Codex CLI और [Hermes](/hi/install/migrating-hermes) को कवर करते हैं; Plugin अतिरिक्त प्रदाता पंजीकृत कर सकते हैं।

<Tip>
उपयोगकर्ता-केंद्रित चरण-दर-चरण निर्देशों के लिए, [Claude से माइग्रेट करना](/hi/install/migrating-claude) और [Hermes से माइग्रेट करना](/hi/install/migrating-hermes) देखें। [माइग्रेशन केंद्र](/hi/install/migrating) में सभी पथ सूचीबद्ध हैं।
</Tip>

## कमांड

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

बिना किसी अन्य फ़्लैग के `openclaw migrate <provider>` चलाने पर लागू करने से पहले योजना बनाई जाती है, पूर्वावलोकन दिखाया जाता है और (TTY में) संकेत दिया जाता है। `openclaw migrate plan <provider>` और `openclaw migrate apply <provider>` समान फ़्लैग के साथ पूर्वावलोकन और लागू करने की प्रक्रिया को अलग-अलग उपकमांड में विभाजित करते हैं।

<ParamField path="<provider>" type="string">
  पंजीकृत माइग्रेशन प्रदाता का नाम, उदाहरण के लिए `hermes`। इंस्टॉल किए गए प्रदाता देखने के लिए `openclaw migrate list` चलाएँ।
</ParamField>
<ParamField path="--dry-run" type="boolean">
  योजना बनाएँ और स्थिति बदले बिना बाहर निकलें।
</ParamField>
<ParamField path="--from <path>" type="string">
  स्रोत स्थिति डायरेक्टरी को ओवरराइड करें। Hermes `$HERMES_HOME` और सक्रिय प्रोफ़ाइल का अनुसरण करता है, फिर प्लेटफ़ॉर्म डिफ़ॉल्ट (`~/.hermes` या `%LOCALAPPDATA%\hermes`) का उपयोग करता है। Codex का डिफ़ॉल्ट `~/.codex` (या `$CODEX_HOME`) है, Claude का डिफ़ॉल्ट `~/.claude` है।
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  संकेत दिए बिना समर्थित क्रेडेंशियल आयात करें। इंटरैक्टिव रूप से लागू करते समय पहचाने गए प्रमाणीकरण क्रेडेंशियल आयात करने से पहले पूछा जाता है और डिफ़ॉल्ट रूप से हाँ चुना होता है; गैर-इंटरैक्टिव `--yes` में उन्हें आयात करने के लिए `--include-secrets` आवश्यक है।
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  इंटरैक्टिव संकेत सहित प्रमाणीकरण क्रेडेंशियल का आयात छोड़ें।
</ParamField>
<ParamField path="--overwrite" type="boolean">
  जब योजना टकराव की सूचना दे, तो लागू करने की प्रक्रिया को मौजूदा लक्ष्यों को बदलने दें।
</ParamField>
<ParamField path="--yes" type="boolean">
  पुष्टि संकेत छोड़ें। गैर-इंटरैक्टिव मोड में आवश्यक है।
</ParamField>
<ParamField path="--skill <name>" type="string">
  कौशल के नाम या आइटम आईडी के आधार पर कौशल की प्रतिलिपि बनाने वाला एक आइटम चुनें। अनेक कौशल माइग्रेट करने के लिए फ़्लैग को दोहराएँ। इसे छोड़ने पर इंटरैक्टिव Codex माइग्रेशन चेकबॉक्स चयनकर्ता दिखाते हैं और गैर-इंटरैक्टिव माइग्रेशन सभी नियोजित कौशल बनाए रखते हैं।
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin के नाम या आइटम आईडी के आधार पर एक Codex Plugin इंस्टॉल आइटम चुनें। अनेक Codex Plugin माइग्रेट करने के लिए फ़्लैग को दोहराएँ। इसे छोड़ने पर इंटरैक्टिव Codex माइग्रेशन मूल Codex Plugin चेकबॉक्स चयनकर्ता दिखाते हैं और गैर-इंटरैक्टिव माइग्रेशन सभी नियोजित Plugin बनाए रखते हैं। यह केवल Codex ऐप-सर्वर इन्वेंट्री द्वारा खोजे गए स्रोत से इंस्टॉल किए गए `openai-curated` Codex Plugin पर लागू होता है।
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  केवल Codex। मूल Plugin सक्रियण की योजना बनाने से पहले स्रोत Codex ऐप-सर्वर में नया `app/list` ट्रैवर्सल अनिवार्य करता है। माइग्रेशन योजना को तेज़ रखने के लिए डिफ़ॉल्ट रूप से बंद है।
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  माइग्रेशन-पूर्व बैकअप संग्रह का पथ या डायरेक्टरी। इसे `openclaw backup create` को यथावत भेजा जाता है।
</ParamField>
<ParamField path="--no-backup" type="boolean">
  लागू करने से पहले का बैकअप छोड़ें। स्थानीय OpenClaw स्थिति मौजूद होने पर `--force` आवश्यक है।
</ParamField>
<ParamField path="--force" type="boolean">
  जब लागू करने की प्रक्रिया अन्यथा बैकअप छोड़ने से इनकार करे, तब `--no-backup` के साथ आवश्यक है।
</ParamField>
<ParamField path="--json" type="boolean">
  योजना या लागू करने का परिणाम JSON के रूप में प्रिंट करें। `--json` के साथ और `--yes` के बिना, लागू करने की प्रक्रिया योजना प्रिंट करती है और स्थिति में बदलाव नहीं करती।
</ParamField>

## सुरक्षा मॉडल

`openclaw migrate` में पहले पूर्वावलोकन किया जाता है।

<AccordionGroup>
  <Accordion title="लागू करने से पहले पूर्वावलोकन">
    कोई भी बदलाव होने से पहले प्रदाता मदवार योजना लौटाता है, जिसमें टकराव, छोड़े गए आइटम और संवेदनशील आइटम शामिल होते हैं। JSON योजनाएँ, लागू करने का आउटपुट और माइग्रेशन रिपोर्ट API कुंजियों, टोकन, प्राधिकरण हेडर, कुकी और पासवर्ड जैसी गुप्त जानकारी जैसे दिखने वाली नेस्टेड कुंजियों को छिपाते हैं।

    `openclaw migrate apply <provider>` योजना का पूर्वावलोकन दिखाता है और स्थिति बदलने से पहले संकेत देता है, जब तक `--yes` सेट न हो। गैर-इंटरैक्टिव मोड में लागू करने के लिए `--yes` आवश्यक है।

  </Accordion>
  <Accordion title="बैकअप">
    माइग्रेशन लागू करने से पहले OpenClaw बैकअप बनाया और सत्यापित किया जाता है। यदि अभी कोई स्थानीय OpenClaw स्थिति मौजूद नहीं है, तो बैकअप चरण छोड़ दिया जाता है और माइग्रेशन जारी रहता है। स्थिति मौजूद होने पर बैकअप छोड़ने के लिए `--no-backup` और `--force` दोनों पास करें।
  </Accordion>
  <Accordion title="टकराव">
    योजना में टकराव होने पर लागू करने की प्रक्रिया आगे बढ़ने से इनकार करती है। योजना की समीक्षा करें, फिर यदि मौजूदा लक्ष्यों को बदलना जानबूझकर किया जा रहा है, तो `--overwrite` के साथ दोबारा चलाएँ। प्रदाता फिर भी माइग्रेशन रिपोर्ट डायरेक्टरी में ओवरराइट की गई फ़ाइलों के लिए आइटम-स्तरीय बैकअप लिख सकते हैं।
  </Accordion>
  <Accordion title="गोपनीय जानकारियाँ">
    इंटरैक्टिव रूप से लागू करते समय पूछा जाता है कि पहचाने गए प्रमाणीकरण क्रेडेंशियल आयात करने हैं या नहीं, और डिफ़ॉल्ट रूप से हाँ चुना होता है। उन्हें छोड़ने के लिए `--no-auth-credentials`, या `--yes` के साथ अप्रत्यक्ष क्रेडेंशियल आयात के लिए `--include-secrets` का उपयोग करें।
  </Accordion>
</AccordionGroup>

## Claude प्रदाता

बंडल किया गया Claude प्रदाता डिफ़ॉल्ट रूप से `~/.claude` पर Claude Code स्थिति का पता लगाता है। किसी विशिष्ट Claude Code होम या प्रोजेक्ट रूट को आयात करने के लिए `--from <path>` का उपयोग करें।

<Tip>
उपयोगकर्ता-केंद्रित चरण-दर-चरण निर्देशों के लिए, [Claude से माइग्रेट करना](/hi/install/migrating-claude) देखें।
</Tip>

### Claude क्या आयात करता है

- `~/.claude/projects/*/memory` से Claude Code ऑटो-मेमोरी Markdown और उपयोगकर्ता द्वारा कॉन्फ़िगर किया गया
  `autoMemoryDirectory`, जिन्हें अनुक्रमित पुनःस्मरण के लिए
  `memory/imports/claude-code/` के अंतर्गत कॉपी किया जाता है।
- प्रोजेक्ट `CLAUDE.md` और `.claude/CLAUDE.md` को OpenClaw एजेंट वर्कस्पेस (`AGENTS.md`) में।
- उपयोगकर्ता `~/.claude/CLAUDE.md` को वर्कस्पेस `USER.md` में जोड़ा जाता है।
- प्रोजेक्ट `.mcp.json`, Claude Code `~/.claude.json` (इसकी प्रति-प्रोजेक्ट प्रविष्टियों सहित) और Claude Desktop `claude_desktop_config.json` से MCP सर्वर परिभाषाएँ।
- Claude कौशल डायरेक्टरी जिनमें `SKILL.md` शामिल है (उपयोगकर्ता `~/.claude/skills` और प्रोजेक्ट `.claude/skills`)।
- Claude कमांड Markdown फ़ाइलें (उपयोगकर्ता `~/.claude/commands` और प्रोजेक्ट `.claude/commands`), जिन्हें केवल मैन्युअल आह्वान वाले OpenClaw कौशल में बदला जाता है।

### संग्रह और मैन्युअल-समीक्षा स्थिति

Claude हुक, अनुमतियाँ, परिवेश डिफ़ॉल्ट, प्रोजेक्ट `CLAUDE.local.md`, `.claude/rules`, उपयोगकर्ता और प्रोजेक्ट `agents/` डायरेक्टरी तथा प्रोजेक्ट इतिहास (`~/.claude` के अंतर्गत `projects`, `cache`, `plans`) माइग्रेशन रिपोर्ट में सुरक्षित रखे जाते हैं या मैन्युअल-समीक्षा आइटम के रूप में रिपोर्ट किए जाते हैं। OpenClaw हुक निष्पादित नहीं करता, व्यापक अनुमति-सूचियाँ कॉपी नहीं करता या OAuth/Desktop क्रेडेंशियल स्थिति स्वचालित रूप से आयात नहीं करता।

## Codex प्रदाता

बंडल किया गया Codex प्रदाता डिफ़ॉल्ट रूप से `~/.codex` पर Codex CLI स्थिति का पता लगाता है, या उस परिवेश चर के सेट होने पर `CODEX_HOME` पर। किसी विशिष्ट Codex होम की इन्वेंट्री बनाने के लिए `--from <path>` का उपयोग करें।

OpenClaw Codex हार्नेस पर जाते समय और उपयोगी व्यक्तिगत Codex CLI संसाधनों को सोच-समझकर बढ़ावा देने के लिए इस प्रदाता का उपयोग करें। स्थानीय Codex ऐप-सर्वर लॉन्च प्रति-एजेंट `CODEX_HOME` का उपयोग करते हैं, इसलिए वे डिफ़ॉल्ट रूप से आपके व्यक्तिगत `~/.codex` को नहीं पढ़ते। सामान्य प्रक्रिया `HOME` फिर भी इनहेरिट होती है, इसलिए Codex साझा `$HOME/.agents/*` कौशल/Plugin मार्केटप्लेस प्रविष्टियाँ देख सकता है और उपप्रक्रियाएँ उपयोगकर्ता-होम कॉन्फ़िगरेशन तथा टोकन खोज सकती हैं।

इंटरैक्टिव टर्मिनल में `openclaw migrate codex` चलाने पर पूरी योजना का पूर्वावलोकन दिखता है, फिर अंतिम लागू करने की पुष्टि से पहले चेकबॉक्स चयनकर्ता खुलते हैं। कौशल की प्रतिलिपि वाले आइटम के लिए पहले संकेत दिया जाता है। सामूहिक चयन के लिए `Toggle all on` या `Toggle all off` का उपयोग करें। पंक्तियाँ टॉगल करने के लिए Space दबाएँ, या हाइलाइट की गई पंक्ति को सक्रिय करके आगे बढ़ने के लिए Enter दबाएँ। नियोजित कौशल चिह्नित अवस्था में शुरू होते हैं, टकराव वाले कौशल अचिह्नित अवस्था में शुरू होते हैं और `Skip for now` इस रन के लिए कौशल प्रतिलिपियाँ छोड़ते हुए भी Plugin चयन जारी रखता है। जब स्रोत से इंस्टॉल किए गए क्यूरेटेड Codex Plugin माइग्रेट किए जा सकते हों और `--plugin` नहीं दिया गया हो, तब माइग्रेशन Plugin के नाम के आधार पर मूल Codex Plugin सक्रियण के लिए संकेत देता है। Plugin आइटम चिह्नित अवस्था में शुरू होते हैं, जब तक लक्ष्य OpenClaw Codex Plugin कॉन्फ़िगरेशन में वह Plugin पहले से मौजूद न हो। मौजूदा लक्ष्य Plugin अचिह्नित अवस्था में शुरू होते हैं और `conflict: plugin exists` जैसा टकराव संकेत दिखाते हैं; उस रन में कोई मूल Codex Plugin माइग्रेट न करने के लिए `Toggle all off`, या लागू करने से पहले रुकने के लिए `Skip for now` चुनें।

स्क्रिप्ट किए गए या सटीक रन के लिए, एक या अधिक कौशल या Plugin स्पष्ट रूप से चुनें:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex क्या आयात करता है

- `$CODEX_HOME/memories` से समेकित Codex `MEMORY.md` और `memory_summary.md`,
  जिन्हें अनुक्रमित पुनःस्मरण के लिए `memory/imports/codex/` के अंतर्गत कॉपी किया जाता है।
  अपरिष्कृत रोलआउट मेमोरी आयात नहीं की जाती।
- `$CODEX_HOME/skills` के अंतर्गत Codex CLI कौशल डायरेक्टरी, Codex के `.system` कैश को छोड़कर।
- `$HOME/.agents/skills` के अंतर्गत व्यक्तिगत AgentSkills, जिन्हें प्रति-एजेंट स्वामित्व के लिए वर्तमान OpenClaw एजेंट वर्कस्पेस में कॉपी किया जाता है।
- Codex ऐप-सर्वर `plugin/list` के माध्यम से खोजे गए स्रोत से इंस्टॉल किए गए `openai-curated` Codex Plugin। योजना प्रत्येक सक्षम इंस्टॉल किए गए Plugin के लिए `plugin/read` पढ़ती है।

ऐप-समर्थित Plugin माइग्रेशन में अतिरिक्त प्रतिबंध हैं:

- ऐप-समर्थित Plugin के लिए स्रोत Codex ऐप-सर्वर खाता ChatGPT सदस्यता खाता होना आवश्यक है। गैर-ChatGPT या अनुपस्थित खाता प्रतिक्रियाएँ `codex_subscription_required` के साथ छोड़ दी जाती हैं।
- डिफ़ॉल्ट रूप से माइग्रेशन स्रोत `app/list` को कॉल नहीं करता, इसलिए खाता प्रतिबंध पार करने वाले ऐप-समर्थित Plugin की योजना स्रोत ऐप अभिगम्यता सत्यापन के बिना बनाई जाती है और खाता-लुकअप परिवहन विफलताएँ `codex_account_unavailable` के साथ छोड़ दी जाती हैं।
- नया स्रोत `app/list` स्नैपशॉट अनिवार्य करने और मूल सक्रियण की योजना बनाने से पहले प्रत्येक स्वामित्व वाले ऐप का मौजूद, सक्षम और पहुँच योग्य होना आवश्यक करने के लिए `--verify-plugin-apps` पास करें। उस मोड में खाता-लुकअप परिवहन विफलताओं के बाद स्रोत ऐप-इन्वेंट्री सत्यापन किया जाता है। स्नैपशॉट केवल वर्तमान प्रक्रिया के लिए मेमोरी में रखा जाता है; इसे कभी भी माइग्रेशन आउटपुट या लक्ष्य कॉन्फ़िगरेशन में नहीं लिखा जाता।

अक्षम Plugin, न पढ़े जा सकने वाले Plugin विवरण, सदस्यता-प्रतिबंधित स्रोत खाते और (`--verify-plugin-apps` सेट होने पर) अनुपस्थित, अक्षम या अप्राप्य ऐप लक्ष्य कॉन्फ़िगरेशन प्रविष्टियों के बजाय प्रकारयुक्त कारणों वाले मैन्युअल रूप से छोड़े गए आइटम बन जाते हैं। लागू करने की प्रक्रिया प्रत्येक चयनित पात्र Plugin के लिए ऐप-सर्वर `plugin/install` को कॉल करती है, भले ही लक्ष्य ऐप-सर्वर पहले से उस Plugin को इंस्टॉल और सक्षम बताए। माइग्रेट किए गए Codex Plugin केवल उन सत्रों में उपयोग योग्य हैं जो मूल Codex हार्नेस चुनते हैं; वे OpenClaw प्रदाता रन, ACP वार्तालाप बाइंडिंग या अन्य हार्नेस में उपलब्ध नहीं कराए जाते।

### मैन्युअल-समीक्षा वाली Codex स्थिति

Codex `config.toml`, नेटिव `hooks/hooks.json`, गैर-क्यूरेटेड मार्केटप्लेस, कैश किए गए Plugin बंडल जो स्रोत से इंस्टॉल किए गए क्यूरेटेड Plugin नहीं हैं, और स्रोत से इंस्टॉल किए गए वे Plugin जो स्रोत सदस्यता गेट में विफल होते हैं, स्वचालित रूप से सक्रिय नहीं किए जाते। जब `--verify-plugin-apps` सेट होता है, तो स्रोत ऐप-इन्वेंट्री गेट में विफल होने वाले Plugin भी छोड़ दिए जाते हैं। मैन्युअल समीक्षा के लिए इन सभी को कॉपी किया जाता है या माइग्रेशन रिपोर्ट में दर्ज किया जाता है।

माइग्रेट किए गए स्रोत से इंस्टॉल किए गए क्यूरेटेड Plugin के लिए, ये लेखन लागू करें:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- प्रत्येक चयनित Plugin के लिए `marketplaceName: "openai-curated"` और `pluginName` वाली एक स्पष्ट Plugin प्रविष्टि

माइग्रेशन कभी भी `plugins["*"]` नहीं लिखता और स्थानीय मार्केटप्लेस कैश पथ कभी संग्रहीत नहीं करता।

छोड़े गए Plugin लक्ष्य कॉन्फ़िगरेशन में नहीं लिखे जाते। स्रोत-पक्ष की सदस्यता विफलताओं को टाइप किए गए कारणों के साथ मैन्युअल आइटम में दर्ज किया जाता है: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled`, या `plugin_read_unavailable`। `--verify-plugin-apps` के साथ, स्रोत ऐप-इन्वेंट्री विफलताएँ `app_inaccessible`, `app_disabled`, `app_missing`, या `app_inventory_unavailable` के रूप में भी दिखाई दे सकती हैं। लक्ष्य-पक्ष के प्रमाणीकरण-आवश्यक इंस्टॉल प्रभावित Plugin आइटम पर `status: "skipped"`, `reason: "auth_required"`, और सैनिटाइज़ किए गए ऐप आइडेंटिफ़ायर के साथ दर्ज किए जाते हैं; उनकी स्पष्ट कॉन्फ़िगरेशन प्रविष्टियाँ तब तक अक्षम लिखी जाती हैं, जब तक आप उन्हें फिर से अधिकृत और सक्षम नहीं करते। अन्य इंस्टॉल विफलताएँ आइटम-स्कोप वाले `error` परिणाम होती हैं।

यदि योजना बनाते समय Codex ऐप-सर्वर Plugin इन्वेंट्री उपलब्ध नहीं है, तो पूरे माइग्रेशन को विफल करने के बजाय माइग्रेशन कैश किए गए बंडल के परामर्शी आइटम का उपयोग करता है।

## Hermes प्रदाता

बंडल किया गया Hermes प्रदाता `$HERMES_HOME` और सक्रिय प्रोफ़ाइल का अनुसरण करता है, फिर प्लेटफ़ॉर्म डिफ़ॉल्ट (`~/.hermes` या `%LOCALAPPDATA%\hermes`) का उपयोग करता है। खोज को ओवरराइड करने के लिए `--from <path>` का उपयोग करें।

### Hermes क्या इंपोर्ट करता है

- `config.yaml` से डिफ़ॉल्ट मॉडल कॉन्फ़िगरेशन।
- `model`, `providers`, और `custom_providers` से कॉन्फ़िगर किए गए मॉडल प्रदाता और कस्टम OpenAI-संगत एंडपॉइंट।
- `mcp_servers` या `mcp.servers` से MCP सर्वर परिभाषाएँ। सटीक OpenClaw मैपिंग में डिफ़ॉल्ट Streamable HTTP रूटिंग, OAuth स्कोप, बूलियन TLS सत्यापन, अलग क्लाइंट प्रमाणपत्र/कुंजी पथ, और Hermes नेटिव/संसाधन/प्रॉम्प्ट टूल नीति शामिल हैं। असमर्थित केवल-Hermes रनटाइम या क्रेडेंशियल फ़ील्ड मैन्युअल समीक्षा के लिए दर्ज किए जाते हैं।
- `SOUL.md` और `AGENTS.md` को OpenClaw एजेंट वर्कस्पेस में।
- `memories/MEMORY.md` और `memories/USER.md` को वर्कस्पेस मेमोरी फ़ाइलों में जोड़ा जाता है।
  इसके बजाय केवल-मेमोरी सतहें (ऑनबोर्डिंग मेमोरी पृष्ठ और Control UI Memory
  इंपोर्ट पृष्ठ) मौजूदा वर्कस्पेस मेमोरी को छुए बिना इंडेक्स किए गए पुनर्स्मरण के
  लिए इन फ़ाइलों को `memory/imports/hermes/` के अंतर्गत कॉपी करती हैं।
- OpenClaw फ़ाइल मेमोरी के लिए मेमोरी कॉन्फ़िगरेशन डिफ़ॉल्ट, साथ ही Honcho जैसे बाहरी मेमोरी प्रदाताओं के लिए आर्काइव या मैन्युअल-समीक्षा आइटम।
- वे Skills जिनमें `skills/` के अंतर्गत कहीं भी `SKILL.md` फ़ाइल शामिल है; नेस्टेड Skills को वर्कस्पेस स्किल डायरेक्टरी में समतल किया जाता है।
- `skills.config` से प्रति-Skill कॉन्फ़िगरेशन मान।
- इंटरैक्टिव क्रेडेंशियल माइग्रेशन स्वीकार किए जाने पर, या `--include-secrets` सेट होने पर, वर्तमान Hermes OpenAI Codex OAuth क्रेडेंशियल और OpenCode OpenAI OAuth क्रेडेंशियल। Hermes और OpenClaw को एक ही इंपोर्ट किए गए रीफ़्रेश ग्रांट का उपयोग करते न रहने दें।
- इंटरैक्टिव क्रेडेंशियल माइग्रेशन स्वीकार किए जाने पर, या `--include-secrets` सेट होने पर, Hermes `.env` और OpenCode `auth.json` से समर्थित API कुंजियाँ और टोकन।

### समर्थित `.env` कुंजियाँ

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `KIMI_CODING_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`।

### केवल-आर्काइव स्थिति

जिस Hermes स्थिति की OpenClaw सुरक्षित रूप से व्याख्या नहीं कर सकता, उसे मैन्युअल समीक्षा के लिए माइग्रेशन रिपोर्ट में कॉपी किया जाता है, लेकिन उसे सक्रिय OpenClaw कॉन्फ़िगरेशन या क्रेडेंशियल में लोड नहीं किया जाता। इसमें `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `plans/`, `workspace/`, `skins/`, `kanban/`, पेयरिंग/प्लेटफ़ॉर्म स्थिति, Gateway रूटिंग/प्रक्रिया स्थिति, और पहचाने गए Hermes SQLite डेटाबेस शामिल हैं।

### लागू करने के बाद

```bash
openclaw doctor
```

## Plugin अनुबंध

माइग्रेशन स्रोत Plugin होते हैं। कोई Plugin अपने प्रदाता आईडी `openclaw.plugin.json` में घोषित करता है:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

रनटाइम पर Plugin `api.registerMigrationProvider(...)` को कॉल करता है। प्रदाता `detect`, `plan`, और `apply` लागू करता है। कोर CLI ऑर्केस्ट्रेशन, बैकअप नीति, प्रॉम्प्ट, JSON आउटपुट, और विरोध प्रीफ़्लाइट का स्वामी है। कोर समीक्षा की गई योजना को `apply(ctx, plan)` में पास करता है, और संगतता के लिए प्रदाता केवल तभी योजना का पुनर्निर्माण कर सकते हैं जब वह आर्ग्युमेंट अनुपस्थित हो।

प्रदाता Plugin आइटम निर्माण और सारांश गणना के लिए `openclaw/plugin-sdk/migration`, तथा विरोध-जागरूक फ़ाइल कॉपी, केवल-आर्काइव रिपोर्ट कॉपी, कैश किए गए कॉन्फ़िगरेशन-रनटाइम रैपर, और माइग्रेशन रिपोर्ट के लिए `openclaw/plugin-sdk/migration-runtime` का उपयोग कर सकते हैं।

## ऑनबोर्डिंग एकीकरण

जब कोई प्रदाता किसी ज्ञात स्रोत का पता लगाता है, तो ऑनबोर्डिंग माइग्रेशन की पेशकश कर सकती है। `openclaw onboard --flow import` और `openclaw setup --wizard --import-from hermes` दोनों एक ही Plugin माइग्रेशन प्रदाता का उपयोग करते हैं और लागू करने से पहले अब भी पूर्वावलोकन दिखाते हैं।

<Note>
ऑनबोर्डिंग इंपोर्ट के लिए नया OpenClaw सेटअप आवश्यक है। यदि आपके पास पहले से स्थानीय स्थिति है, तो पहले कॉन्फ़िगरेशन, क्रेडेंशियल, सत्र, और वर्कस्पेस रीसेट करें। मौजूदा सेटअप के लिए बैकअप-सहित-ओवरराइट या मर्ज इंपोर्ट सुविधा-गेटेड हैं।
</Note>

## संबंधित

- [Hermes से माइग्रेट करना](/hi/install/migrating-hermes): उपयोगकर्ता-केंद्रित चरण-दर-चरण मार्गदर्शिका।
- [Claude से माइग्रेट करना](/hi/install/migrating-claude): उपयोगकर्ता-केंद्रित चरण-दर-चरण मार्गदर्शिका।
- [माइग्रेट करना](/hi/install/migrating): OpenClaw को नई मशीन पर ले जाएँ।
- [Doctor](/hi/gateway/doctor): माइग्रेशन लागू करने के बाद स्वास्थ्य जाँच।
- [Plugin](/hi/tools/plugin): Plugin इंस्टॉल और पंजीकरण।
