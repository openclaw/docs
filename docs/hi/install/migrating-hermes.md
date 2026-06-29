---
read_when:
    - आप Hermes से आ रहे हैं और अपनी मॉडल कॉन्फ़िग, प्रॉम्प्ट, मेमोरी, और skills बनाए रखना चाहते हैं
    - आप जानना चाहते हैं कि OpenClaw अपने-आप क्या आयात करता है और क्या केवल आर्काइव में रहता है
    - आपको एक साफ़, स्क्रिप्टेड माइग्रेशन पथ चाहिए (CI, नया लैपटॉप, ऑटोमेशन)
summary: पूर्वावलोकित, प्रत्यावर्ती आयात के साथ Hermes से OpenClaw पर जाएँ
title: Hermes से माइग्रेट करना
x-i18n:
    generated_at: "2026-06-28T23:22:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw Hermes स्थिति को बंडल किए गए माइग्रेशन प्रदाता के माध्यम से आयात करता है। प्रदाता स्थिति बदलने से पहले हर चीज का पूर्वावलोकन करता है, योजनाओं और रिपोर्टों में सीक्रेट्स को रिडैक्ट करता है, और लागू करने से पहले सत्यापित बैकअप बनाता है।

<Note>
आयात के लिए नया OpenClaw सेटअप आवश्यक है। यदि आपके पास पहले से स्थानीय OpenClaw स्थिति है, तो पहले config, credentials, sessions, और workspace रीसेट करें, या योजना की समीक्षा करने के बाद `--overwrite` के साथ सीधे `openclaw migrate` का उपयोग करें।
</Note>

## आयात करने के दो तरीके

<Tabs>
  <Tab title="ऑनबोर्डिंग विज़ार्ड">
    सबसे तेज़ तरीका। विज़ार्ड `~/.hermes` पर Hermes का पता लगाता है और लागू करने से पहले पूर्वावलोकन दिखाता है।

    ```bash
    openclaw onboard --flow import
    ```

    या किसी विशिष्ट स्रोत की ओर इंगित करें:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    स्क्रिप्टेड या दोहराने योग्य रन के लिए `openclaw migrate` का उपयोग करें। पूर्ण संदर्भ के लिए [`openclaw migrate`](/hi/cli/migrate) देखें।

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    जब Hermes `~/.hermes` के बाहर हो, तो `--from <path>` जोड़ें।

  </Tab>
</Tabs>

## क्या आयात होता है

<AccordionGroup>
  <Accordion title="मॉडल कॉन्फ़िगरेशन">
    - Hermes `config.yaml` से डिफ़ॉल्ट मॉडल चयन।
    - `providers` और `custom_providers` से कॉन्फ़िगर किए गए मॉडल प्रदाता और कस्टम OpenAI-संगत एंडपॉइंट।

  </Accordion>
  <Accordion title="MCP सर्वर">
    `mcp_servers` या `mcp.servers` से MCP सर्वर परिभाषाएँ।
  </Accordion>
  <Accordion title="Workspace फ़ाइलें">
    - `SOUL.md` और `AGENTS.md` को OpenClaw एजेंट workspace में कॉपी किया जाता है।
    - `memories/MEMORY.md` और `memories/USER.md` को ओवरराइट करने के बजाय मिलती-जुलती OpenClaw मेमोरी फ़ाइलों में **जोड़ा** जाता है।

  </Accordion>
  <Accordion title="मेमोरी कॉन्फ़िगरेशन">
    OpenClaw फ़ाइल मेमोरी के लिए मेमोरी config डिफ़ॉल्ट। Honcho जैसे बाहरी मेमोरी प्रदाताओं को आर्काइव या मैन्युअल-समीक्षा आइटम के रूप में दर्ज किया जाता है ताकि आप उन्हें सोच-समझकर स्थानांतरित कर सकें।
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` के अंतर्गत `SKILL.md` फ़ाइल वाली Skills को `skills.config` से प्रति-Skill config मानों के साथ कॉपी किया जाता है।
  </Accordion>
  <Accordion title="प्रमाणीकरण credentials">
    इंटरैक्टिव `openclaw migrate` auth credentials आयात करने से पहले पूछता है, जिसमें डिफ़ॉल्ट रूप से yes चयनित होता है। स्वीकार किए गए आयातों में OpenCode `auth.json` से OpenCode OpenAI OAuth credentials, OpenCode `auth.json` से OpenCode और GitHub Copilot entries, और [समर्थित `.env` keys](/hi/cli/migrate#supported-env-keys) शामिल हैं। Hermes `auth.json` OAuth entries legacy स्थिति हैं और उन्हें लाइव auth में आयात करने के बजाय मैन्युअल reauth/doctor कार्य के रूप में दिखाया जाता है। non-interactive `openclaw migrate` credential आयात के लिए `--include-secrets`, इसे छोड़ने के लिए `--no-auth-credentials`, या onboarding wizard से आयात करते समय onboarding `--import-secrets` का उपयोग करें।
  </Accordion>
</AccordionGroup>

## क्या केवल आर्काइव में रहता है

प्रदाता इन्हें मैन्युअल समीक्षा के लिए माइग्रेशन रिपोर्ट डायरेक्टरी में कॉपी करता है, लेकिन इन्हें लाइव OpenClaw config या credentials में लोड **नहीं** करता:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw इस स्थिति को अपने-आप निष्पादित करने या उस पर भरोसा करने से इनकार करता है क्योंकि formats और trust assumptions सिस्टमों के बीच बदल सकते हैं। आर्काइव की समीक्षा करने के बाद आवश्यक चीजें हाथ से स्थानांतरित करें।

## अनुशंसित प्रवाह

<Steps>
  <Step title="योजना का पूर्वावलोकन करें">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    योजना उन सभी चीजों को सूचीबद्ध करती है जो बदलेंगी, जिनमें conflicts, छोड़े गए आइटम, और कोई भी संवेदनशील आइटम शामिल हैं। योजना आउटपुट nested secret-जैसी keys को रिडैक्ट करता है।

  </Step>
  <Step title="बैकअप के साथ लागू करें">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw लागू करने से पहले बैकअप बनाता और सत्यापित करता है। यह non-interactive उदाहरण non-secret स्थिति आयात करता है। credential prompt का उत्तर देने के लिए `--yes` के बिना चलाएँ, या unattended runs में समर्थित credentials शामिल करने के लिए `--include-secrets` जोड़ें।

  </Step>
  <Step title="doctor चलाएँ">
    ```bash
    openclaw doctor
    ```

    [Doctor](/hi/gateway/doctor) किसी भी लंबित config migrations को फिर से लागू करता है और आयात के दौरान आई समस्याओं की जाँच करता है।

  </Step>
  <Step title="रीस्टार्ट करें और सत्यापित करें">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    पुष्टि करें कि Gateway स्वस्थ है और आपका आयात किया गया मॉडल, मेमोरी, और Skills लोड हैं।

  </Step>
</Steps>

## Conflict handling

जब योजना conflicts रिपोर्ट करती है तो apply आगे बढ़ने से इनकार कर देता है (target पर कोई फ़ाइल या config value पहले से मौजूद है)।

<Warning>
`--overwrite` के साथ दोबारा केवल तब चलाएँ जब मौजूदा target को बदलना जानबूझकर किया जा रहा हो। प्रदाता फिर भी migration report directory में overwritten फ़ाइलों के लिए item-level backups लिख सकते हैं।
</Warning>

नए OpenClaw install के लिए conflicts असामान्य हैं। वे आमतौर पर तब दिखाई देते हैं जब आप ऐसे setup पर import फिर से चलाते हैं जिसमें पहले से user edits हैं।

यदि mid-apply कोई conflict सामने आता है (उदाहरण के लिए, config file पर unexpected race), तो Hermes remaining dependent config items को आंशिक रूप से लिखने के बजाय reason `blocked by earlier apply conflict` के साथ `skipped` के रूप में mark करता है। migration report प्रत्येक blocked item को record करती है ताकि आप original conflict हल करके import फिर से चला सकें।

## Secrets

इंटरैक्टिव `openclaw migrate` पूछता है कि detected auth credentials आयात करने हैं या नहीं, जिसमें डिफ़ॉल्ट रूप से yes चयनित होता है।

- prompt स्वीकार करने पर OpenCode `auth.json` से OpenCode OpenAI OAuth credentials, OpenCode `auth.json` से OpenCode और GitHub Copilot entries, और [समर्थित `.env` keys](/hi/cli/migrate#supported-env-keys) आयात होते हैं। Hermes `auth.json` OAuth entries को manual OpenAI reauth या doctor repair के लिए report किया जाता है।
- केवल non-secret state आयात करने के लिए `--no-auth-credentials` का उपयोग करें या prompt पर no चुनें।
- `--yes` के साथ unattended चलाते समय `--include-secrets` का उपयोग करें।
- onboarding wizard से credentials आयात करते समय onboarding `--import-secrets` का उपयोग करें।
- SecretRef-managed credentials के लिए, import पूरा होने के बाद SecretRef source configure करें।

## automation के लिए JSON output

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` और बिना `--yes` के, apply योजना print करता है और state mutate नहीं करता। यह CI और shared scripts के लिए सबसे सुरक्षित mode है।

## Troubleshooting

<AccordionGroup>
  <Accordion title="Apply conflicts के साथ इनकार करता है">
    plan output inspect करें। हर conflict source path और existing target की पहचान करता है। प्रति item तय करें कि skip करना है, target edit करना है, या `--overwrite` के साथ दोबारा चलाना है।
  </Accordion>
  <Accordion title="Hermes ~/.hermes के बाहर है">
    `--from /actual/path` (CLI) या `--import-source /actual/path` (onboarding) pass करें।
  </Accordion>
  <Accordion title="Onboarding मौजूदा setup पर import से इनकार करता है">
    Onboarding imports के लिए fresh setup आवश्यक है। या तो state reset करके re-onboard करें, या सीधे `openclaw migrate apply hermes` का उपयोग करें, जो `--overwrite` और explicit backup control support करता है।
  </Accordion>
  <Accordion title="API keys import नहीं हुईं">
    इंटरैक्टिव `openclaw migrate` API keys केवल तब import करता है जब आप credential prompt accept करते हैं। Non-interactive `--yes` runs के लिए `--include-secrets` आवश्यक है; onboarding imports के लिए `--import-secrets` आवश्यक है। केवल [समर्थित `.env` keys](/hi/cli/migrate#supported-env-keys) पहचानी जाती हैं; `.env` में अन्य variables ignore किए जाते हैं।
  </Accordion>
</AccordionGroup>

## संबंधित

- [`openclaw migrate`](/hi/cli/migrate): पूर्ण CLI संदर्भ, Plugin contract, और JSON shapes।
- [Onboarding](/hi/cli/onboard): wizard flow और non-interactive flags।
- [Migrating](/hi/install/migrating): OpenClaw install को machines के बीच move करें।
- [Doctor](/hi/gateway/doctor): post-migration health check।
- [Agent workspace](/hi/concepts/agent-workspace): जहाँ `SOUL.md`, `AGENTS.md`, और memory files रहती हैं।
