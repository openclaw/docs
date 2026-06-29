---
read_when:
    - आपको एजेंट कार्यक्षेत्र या उसके फ़ाइल लेआउट को समझाना है
    - आप एजेंट वर्कस्पेस का बैकअप लेना या माइग्रेट करना चाहते हैं
sidebarTitle: Agent workspace
summary: 'एजेंट वर्कस्पेस: स्थान, लेआउट, और बैकअप रणनीति'
title: एजेंट कार्यक्षेत्र
x-i18n:
    generated_at: "2026-06-28T22:55:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

कार्यक्षेत्र एजेंट का घर है। यह फ़ाइल टूल्स और कार्यक्षेत्र संदर्भ के लिए उपयोग की जाने वाली एकमात्र कार्यशील डायरेक्टरी है। इसे निजी रखें और इसे मेमोरी की तरह मानें।

यह `~/.openclaw/` से अलग है, जहाँ config, credentials, और sessions संग्रहीत होते हैं।

<Warning>
कार्यक्षेत्र **डिफ़ॉल्ट cwd** है, कोई कठोर sandbox नहीं। टूल्स सापेक्ष पाथ को कार्यक्षेत्र के विरुद्ध resolve करते हैं, लेकिन यदि sandboxing सक्षम नहीं है तो absolute paths अभी भी host पर कहीं और पहुँच सकते हैं। यदि आपको isolation चाहिए, तो [`agents.defaults.sandbox`](/hi/gateway/sandboxing) (और/या प्रति-एजेंट sandbox config) का उपयोग करें।

जब sandboxing सक्षम हो और `workspaceAccess` `"rw"` नहीं हो, तो टूल्स आपके host कार्यक्षेत्र में नहीं, बल्कि `~/.openclaw/sandboxes` के अंतर्गत sandbox कार्यक्षेत्र के अंदर काम करते हैं।
</Warning>

## डिफ़ॉल्ट स्थान

- डिफ़ॉल्ट: `~/.openclaw/workspace`
- यदि `OPENCLAW_PROFILE` सेट है और `"default"` नहीं है, तो डिफ़ॉल्ट `~/.openclaw/workspace-<profile>` बन जाता है।
- `~/.openclaw/openclaw.json` में override करें:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure`, या `openclaw setup` कार्यक्षेत्र बनाएँगे और यदि bootstrap फ़ाइलें अनुपस्थित हैं तो उन्हें seed करेंगे।

<Note>
Sandbox seed copies केवल नियमित in-workspace फ़ाइलें स्वीकार करती हैं; source workspace के बाहर resolve होने वाले symlink/hardlink aliases अनदेखा कर दिए जाते हैं।
</Note>

यदि आप पहले से ही कार्यक्षेत्र फ़ाइलें स्वयं manage करते हैं, तो आप bootstrap फ़ाइल निर्माण अक्षम कर सकते हैं:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## अतिरिक्त कार्यक्षेत्र फ़ोल्डर

पुराने installs ने `~/openclaw` बनाया हो सकता है। कई कार्यक्षेत्र डायरेक्टरी रखना भ्रमित करने वाला auth या state drift पैदा कर सकता है, क्योंकि एक समय में केवल एक कार्यक्षेत्र active होता है।

<Note>
**सिफ़ारिश:** एक ही active कार्यक्षेत्र रखें। यदि अब आप अतिरिक्त फ़ोल्डर उपयोग नहीं करते, तो उन्हें archive करें या Trash में ले जाएँ (उदाहरण के लिए `trash ~/openclaw`)। यदि आप जानबूझकर कई कार्यक्षेत्र रखते हैं, तो सुनिश्चित करें कि `agents.defaults.workspace` active वाले की ओर point करता है।

`openclaw doctor` अतिरिक्त कार्यक्षेत्र डायरेक्टरी detect करने पर चेतावनी देता है।
</Note>

## कार्यक्षेत्र फ़ाइल मानचित्र

ये वे मानक फ़ाइलें हैं जिनकी OpenClaw कार्यक्षेत्र के अंदर अपेक्षा करता है:

<AccordionGroup>
  <Accordion title="AGENTS.md - संचालन निर्देश">
    एजेंट के लिए संचालन निर्देश और उसे मेमोरी का उपयोग कैसे करना चाहिए। हर session की शुरुआत में loaded होता है। नियमों, प्राथमिकताओं, और "कैसे व्यवहार करें" विवरणों के लिए अच्छी जगह।
  </Accordion>
  <Accordion title="SOUL.md - persona और tone">
    Persona, tone, और boundaries। हर session में loaded होता है। Guide: [SOUL.md personality guide](/hi/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - user कौन है">
    User कौन है और उन्हें कैसे address करना है। हर session में loaded होता है।
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    एजेंट का name, vibe, और emoji। bootstrap ritual के दौरान बनाया/अपडेट किया जाता है।
  </Accordion>
  <Accordion title="TOOLS.md - स्थानीय tool conventions">
    आपके स्थानीय tools और conventions के बारे में notes। यह tool availability नियंत्रित नहीं करता; यह केवल guidance है।
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat checklist">
    Heartbeat runs के लिए वैकल्पिक छोटी checklist। token burn से बचने के लिए इसे छोटा रखें।
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    वैकल्पिक startup checklist जो gateway restart पर automatic चलती है (जब [internal hooks](/hi/automation/hooks) सक्षम हों)। इसे छोटा रखें; outbound sends के लिए message tool का उपयोग करें।
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    एक बार चलने वाला first-run ritual। केवल बिल्कुल नए कार्यक्षेत्र के लिए बनाया जाता है। ritual पूरा होने के बाद इसे delete कर दें।
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - दैनिक मेमोरी log">
    दैनिक मेमोरी log (प्रति दिन एक फ़ाइल)। session start पर today + yesterday पढ़ने की सिफ़ारिश की जाती है।
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (वैकल्पिक)">
    Curated long-term memory: durable facts, preferences, decisions, और short summaries। विस्तृत logs `memory/YYYY-MM-DD.md` में रखें ताकि memory tools उन्हें हर prompt में inject किए बिना on demand retrieve कर सकें। `MEMORY.md` को केवल main, private session में load करें (shared/group contexts में नहीं)। workflow और automatic memory flush के लिए [Memory](/hi/concepts/memory) देखें।
  </Accordion>
  <Accordion title="skills/ - कार्यक्षेत्र Skills (वैकल्पिक)">
    कार्यक्षेत्र-विशिष्ट Skills। उस कार्यक्षेत्र के लिए सबसे उच्च-precedence skill location। names collide होने पर project agent skills, personal agent skills, managed skills, bundled skills, और `skills.load.extraDirs` को override करता है।
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (वैकल्पिक)">
    node displays के लिए Canvas UI files (उदाहरण के लिए `canvas/index.html`)।
  </Accordion>
</AccordionGroup>

<Note>
यदि कोई bootstrap फ़ाइल अनुपस्थित है, तो OpenClaw session में "missing file" marker inject करता है और जारी रखता है। बड़ी bootstrap फ़ाइलें inject करते समय truncate की जाती हैं; limits को `agents.defaults.bootstrapMaxChars` (डिफ़ॉल्ट: 20000) और `agents.defaults.bootstrapTotalMaxChars` (डिफ़ॉल्ट: 60000) से adjust करें। `openclaw setup` मौजूदा फ़ाइलों को overwrite किए बिना missing defaults फिर से बना सकता है।
</Note>

## कार्यक्षेत्र में क्या नहीं है

ये `~/.openclaw/` के अंतर्गत रहते हैं और कार्यक्षेत्र repo में commit नहीं किए जाने चाहिए:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model auth profiles: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (per-agent Codex runtime account, config, skills, plugins, और native thread state)
- `~/.openclaw/credentials/` (channel/provider state plus legacy OAuth import data)
- `~/.openclaw/agents/<agentId>/sessions/` (session transcripts + metadata)
- `~/.openclaw/skills/` (managed skills)

यदि आपको sessions या config migrate करने हैं, तो उन्हें अलग से copy करें और version control से बाहर रखें।

## Git backup (सिफ़ारिश की गई, निजी)

कार्यक्षेत्र को निजी मेमोरी की तरह मानें। इसे **private** git repo में रखें ताकि इसका backup हो और यह recoverable रहे।

इन steps को उस machine पर run करें जहाँ Gateway चलता है (वही जगह है जहाँ कार्यक्षेत्र रहता है)।

<Steps>
  <Step title="Repo initialize करें">
    यदि git installed है, तो बिल्कुल नए कार्यक्षेत्र automatic initialize होते हैं। यदि यह कार्यक्षेत्र पहले से repo नहीं है, तो run करें:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Private remote जोड़ें">
    <Tabs>
      <Tab title="GitHub web UI">
        1. GitHub पर एक नया **private** repository बनाएँ।
        2. README से initialize न करें (merge conflicts से बचता है)।
        3. HTTPS remote URL copy करें।
        4. remote add करें और push करें:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. GitLab पर एक नया **private** repository बनाएँ।
        2. README से initialize न करें (merge conflicts से बचता है)।
        3. HTTPS remote URL copy करें।
        4. remote add करें और push करें:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="लगातार updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Secrets commit न करें

<Warning>
Private repo में भी, कार्यक्षेत्र में secrets store करने से बचें:

- API keys, OAuth tokens, passwords, या private credentials.
- `~/.openclaw/` के अंतर्गत कुछ भी।
- chats या sensitive attachments के raw dumps।

यदि आपको sensitive references store करने ही हों, तो placeholders का उपयोग करें और real secret कहीं और रखें (password manager, environment variables, या `~/.openclaw/`)।
</Warning>

Suggested `.gitignore` starter:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## कार्यक्षेत्र को नई machine पर ले जाना

<Steps>
  <Step title="Repo clone करें">
    Repo को desired path पर clone करें (डिफ़ॉल्ट `~/.openclaw/workspace`)।
  </Step>
  <Step title="Config update करें">
    `~/.openclaw/openclaw.json` में `agents.defaults.workspace` को उस path पर set करें।
  </Step>
  <Step title="Missing files seed करें">
    किसी भी missing files को seed करने के लिए `openclaw setup --workspace <path>` run करें।
  </Step>
  <Step title="Sessions copy करें (वैकल्पिक)">
    यदि आपको sessions चाहिए, तो old machine से `~/.openclaw/agents/<agentId>/sessions/` अलग से copy करें।
  </Step>
</Steps>

## Advanced notes

- Multi-agent routing प्रति एजेंट अलग-अलग कार्यक्षेत्रों का उपयोग कर सकती है। routing configuration के लिए [Channel routing](/hi/channels/channel-routing) देखें।
- यदि `agents.defaults.sandbox` सक्षम है, तो non-main sessions `agents.defaults.sandbox.workspaceRoot` के अंतर्गत per-session sandbox workspaces का उपयोग कर सकते हैं।

## Related

- [Heartbeat](/hi/gateway/heartbeat) - HEARTBEAT.md कार्यक्षेत्र फ़ाइल
- [Sandboxing](/hi/gateway/sandboxing) - sandboxed environments में कार्यक्षेत्र access
- [Session](/hi/concepts/session) - session storage paths
- [Standing orders](/hi/automation/standing-orders) - कार्यक्षेत्र फ़ाइलों में persistent instructions
