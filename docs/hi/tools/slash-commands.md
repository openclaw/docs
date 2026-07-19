---
read_when:
    - चैट कमांड का उपयोग या कॉन्फ़िगरेशन
    - कमांड रूटिंग या अनुमतियों की डीबगिंग
    - Skills कमांड कैसे पंजीकृत किए जाते हैं, इसे समझना
sidebarTitle: Slash commands
summary: सभी उपलब्ध स्लैश कमांड, निर्देश और इनलाइन शॉर्टकट — कॉन्फ़िगरेशन, रूटिंग और प्रत्येक सरफ़ेस का व्यवहार।
title: स्लैश कमांड्स
x-i18n:
    generated_at: "2026-07-19T10:19:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b30bc91f438175018be882f5eb93780f99a3f99335a7200092049bfd68e2ff8
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway उन स्टैंडअलोन संदेशों के रूप में भेजे गए कमांड संभालता है जो `/` से शुरू होते हैं।
केवल होस्ट के bash कमांड `! <cmd>` का उपयोग करते हैं (`/bash <cmd>` उपनाम के साथ)।

जब कोई वार्तालाप ACP सत्र से बंधा होता है, तो सामान्य टेक्स्ट ACP
हार्नेस को रूट होता है। Gateway प्रबंधन कमांड स्थानीय बने रहते हैं: `/acp ...` हमेशा
OpenClaw कमांड हैंडलर तक पहुँचता है, और जब भी उस सतह के लिए कमांड
हैंडलिंग सक्षम होती है, `/status` तथा `/unfocus` स्थानीय बने रहते हैं।

## कमांड के तीन प्रकार

<CardGroup cols={3}>
  <Card title="कमांड" icon="terminal">
    Gateway द्वारा संभाले जाने वाले स्टैंडअलोन `/...` संदेश। इन्हें संदेश की
    एकमात्र सामग्री के रूप में भेजना अनिवार्य है।
  </Card>
  <Card title="निर्देश" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — मॉडल के देखने से पहले संदेश से
    हटा दिए जाते हैं। अकेले भेजे जाने पर सत्र सेटिंग बनाए रखते हैं; अन्य टेक्स्ट
    के साथ भेजे जाने पर इनलाइन संकेतों की तरह काम करते हैं।
  </Card>
  <Card title="इनलाइन शॉर्टकट" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — तुरंत चलते हैं और
    मॉडल के शेष टेक्स्ट देखने से पहले हटा दिए जाते हैं। केवल अधिकृत प्रेषक।
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="निर्देशों के व्यवहार का विवरण">
    - मॉडल के देखने से पहले निर्देशों को संदेश से हटा दिया जाता है।
    - **केवल-निर्देश** संदेशों में (संदेश में केवल निर्देश होते हैं), वे
      सत्र में बने रहते हैं और अभिस्वीकृति के साथ उत्तर देते हैं।
    - अन्य टेक्स्ट वाले **सामान्य चैट** संदेशों में, वे इनलाइन संकेतों की तरह काम करते हैं और
      सत्र सेटिंग **नहीं** बनाए रखते।
    - निर्देश केवल **अधिकृत प्रेषकों** पर लागू होते हैं। यदि `commands.allowFrom`
      सेट है, तो केवल उसी अनुमति-सूची का उपयोग होता है; अन्यथा प्राधिकरण
      चैनल अनुमति-सूचियों/पेयरिंग और `commands.useAccessGroups` से आता है। अनधिकृत
      प्रेषकों के निर्देशों को साधारण टेक्स्ट माना जाता है।
  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  चैट संदेशों में `/...` की पार्सिंग सक्षम करता है। नेटिव कमांड रहित सतहों
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams) पर, `false`
  पर सेट होने के बावजूद टेक्स्ट कमांड काम करते हैं।
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  नेटिव कमांड पंजीकृत करता है। ऑटो: Discord/Telegram के लिए चालू; Slack के लिए बंद;
  नेटिव समर्थन रहित प्रदाताओं के लिए अनदेखा। प्रत्येक चैनल के लिए
  `channels.<provider>.commands.native` से ओवरराइड करें। Discord पर, `false` स्लैश-कमांड
  पंजीकरण छोड़ देता है; पहले पंजीकृत कमांड हटाए जाने तक दिखाई दे सकते हैं।
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  समर्थित होने पर Skills कमांड को नेटिव रूप से पंजीकृत करता है। ऑटो:
  Discord/Telegram के लिए चालू; Slack के लिए बंद। `channels.<provider>.commands.nativeSkills`
  से ओवरराइड करें।
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  होस्ट शेल कमांड चलाने के लिए `! <cmd>` को सक्षम करता है (`/bash <cmd>` उपनाम)। इसके लिए
  `tools.elevated` अनुमति-सूचियाँ आवश्यक हैं।
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  बैकग्राउंड मोड पर स्विच करने से पहले bash कितनी देर प्रतीक्षा करता है (`0` तुरंत
  बैकग्राउंड में भेजता है)।
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config` को सक्षम करता है (`openclaw.json` को पढ़ता/लिखता है)। केवल स्वामी।
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp` को सक्षम करता है (`mcp.servers` के अंतर्गत OpenClaw-प्रबंधित MCP कॉन्फ़िगरेशन को पढ़ता/लिखता है)। केवल स्वामी।
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins` को सक्षम करता है (Plugin खोज/स्थिति तथा इंस्टॉल + सक्षम/अक्षम करना)। लिखने के लिए केवल स्वामी।
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug` को सक्षम करता है (केवल रनटाइम कॉन्फ़िगरेशन ओवरराइड)। केवल स्वामी।
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` और बाहरी `SIGUSR1` पुनः आरंभ अनुरोधों को सक्षम करता है।
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  केवल-स्वामी कमांड सतहों के लिए स्पष्ट स्वामी अनुमति-सूची। यह
  `commands.allowFrom` और DM पेयरिंग पहुँच से अलग है।
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  प्रत्येक चैनल के लिए: केवल-स्वामी कमांड के लिए स्वामी पहचान आवश्यक बनाता है। जब `true` हो,
  प्रेषक का `commands.ownerAllowFrom` से मेल खाना या उसके पास आंतरिक `operator.admin`
  स्कोप होना आवश्यक है। वाइल्डकार्ड `allowFrom` प्रविष्टि **पर्याप्त नहीं** है।
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  नियंत्रित करता है कि सिस्टम प्रॉम्प्ट में स्वामी आईडी कैसे दिखाई दें।
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"` होने पर उपयोग किया जाने वाला HMAC सीक्रेट।
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  कमांड प्राधिकरण के लिए प्रत्येक प्रदाता की अनुमति-सूची। कॉन्फ़िगर होने पर, यही
  कमांड और निर्देशों के प्राधिकरण का **एकमात्र** स्रोत होता है। वैश्विक
  डिफ़ॉल्ट के लिए `"*"` का उपयोग करें; प्रदाता-विशिष्ट कुंजियाँ इसे ओवरराइड करती हैं।
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom` सेट न होने पर कमांड के लिए अनुमति-सूचियाँ/नीतियाँ लागू करता है।
</ParamField>

## कमांड सूची

कमांड तीन स्रोतों से आते हैं:

- **मुख्य अंतर्निहित कमांड:** `src/auto-reply/commands-registry.shared.ts`
- **जनरेट किए गए डॉक कमांड:** `src/auto-reply/commands-registry.data.ts`
- **Plugin कमांड:** Plugin `registerCommand()` कॉल

उपलब्धता कॉन्फ़िगरेशन फ़्लैग, चैनल सतह और इंस्टॉल/सक्षम किए गए
Plugins पर निर्भर करती है।

### मुख्य कमांड

<AccordionGroup>
  <Accordion title="सत्र और रन">
    | कमांड | विवरण |
    | --- | --- |
    | `/new [model]` | वर्तमान सत्र को आर्काइव करें और नया सत्र शुरू करें |
    | `/reset [soft [message]]` | वर्तमान सत्र को उसी स्थान पर रीसेट करें। `soft` ट्रांसक्रिप्ट रखता है, पुनः उपयोग किए गए CLI बैकएंड सत्र आईडी हटाता है और स्टार्टअप फिर चलाता है |
    | `/name <title>` | वर्तमान सत्र को नाम दें या उसका नाम बदलें। वर्तमान नाम और सुझाव देखने के लिए शीर्षक छोड़ दें |
    | `/compact [instructions]` | सत्र संदर्भ को संक्षिप्त करें। [Compaction](/hi/concepts/compaction) देखें |
    | `/stop` | वर्तमान रन निरस्त करें |
    | `/session idle <duration\|off>` | थ्रेड-बाइंडिंग की निष्क्रियता समाप्ति प्रबंधित करें |
    | `/session max-age <duration\|off>` | थ्रेड-बाइंडिंग की अधिकतम आयु समाप्ति प्रबंधित करें |
    | `/export-session [path]` | केवल स्वामी। वर्तमान सत्र को कार्यक्षेत्र के भीतर HTML में निर्यात करें। उपनाम: `/export` |
    | `/export-trajectory [path]` | वर्तमान सत्र के लिए JSONL ट्रैजेक्टरी बंडल निर्यात करें। उपनाम: `/trajectory` |

    स्पष्ट `/export-session` पथ कार्यक्षेत्र के भीतर मौजूदा फ़ाइलों को
    बदल देते हैं। टकराव-सुरक्षित फ़ाइल नाम जनरेट करने के लिए पथ छोड़ दें।

    <Note>
      Control UI टाइप किए गए `/new` को इंटरसेप्ट करके नया
      डैशबोर्ड सत्र बनाता है और उस पर स्विच करता है, सिवाय तब जब `session.dmScope: "main"` कॉन्फ़िगर हो
      और वर्तमान पैरेंट एजेंट का मुख्य सत्र हो — उस स्थिति में `/new`
      मुख्य सत्र को उसी स्थान पर रीसेट करता है। टाइप किया गया `/reset` फिर भी Gateway का
      उसी स्थान पर रीसेट चलाता है। पिन किए गए सत्र मॉडल चयन को साफ़ करने के लिए
      `/model default` का उपयोग करें।
    </Note>

  </Accordion>

  <Accordion title="मॉडल और रन नियंत्रण">
    | कमांड | विवरण |
    | --- | --- |
    | `/think <level\|default>` | सोच का स्तर सेट करें या सत्र ओवरराइड साफ़ करें। उपनाम: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | विस्तृत आउटपुट टॉगल करें। उपनाम: `/v` |
    | `/trace on\|off` | वर्तमान सत्र के लिए Plugin ट्रेस आउटपुट टॉगल करें |
    | `/fast [status\|auto\|on\|off\|default]` | तेज़ मोड दिखाएँ, सेट करें या साफ़ करें |
    | `/reasoning [on\|off\|stream]` | तर्क की दृश्यता टॉगल करें। उपनाम: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | उन्नत मोड टॉगल करें। उपनाम: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec डिफ़ॉल्ट दिखाएँ या सेट करें |
    | `/login [codex\|openai\|openai-codex]` | निजी चैट या Web UI सत्र से Codex/OpenAI लॉगिन पेयर करें। केवल स्वामी/व्यवस्थापक |
    | `/model [name\|#\|status]` | मॉडल दिखाएँ या सेट करें |
    | `/models [provider] [page] [limit=<n>\|all]` | कॉन्फ़िगर किए गए/प्रमाणीकरण-उपलब्ध प्रदाताओं या मॉडलों की सूची दिखाएँ |
    | `/queue <mode>` | सक्रिय-रन कतार का व्यवहार प्रबंधित करें। [कतार](/hi/concepts/queue) और [कतार निर्देशन](/hi/concepts/queue-steering) देखें |
    | `/steer <message>` | सक्रिय रन में मार्गदर्शन डालें। उपनाम: `/tell`। [निर्देशन](/hi/tools/steer) देखें |

    <AccordionGroup>
      <Accordion title="विस्तृत / ट्रेस / तेज़ / तर्क सुरक्षा">
        - `/verbose` डीबगिंग के लिए है — सामान्य उपयोग में इसे **बंद** रखें।
        - `/trace` केवल Plugin-स्वामित्व वाली ट्रेस/डीबग पंक्तियाँ दिखाता है; सामान्य विस्तृत बातचीत बंद रहती है।
        - `/fast auto|on|off` सत्र ओवरराइड बनाए रखता है; इसे साफ़ करने के लिए Sessions UI के `inherit` विकल्प का उपयोग करें।
        - `/fast` प्रदाता-विशिष्ट है: OpenAI/Codex इसे `service_tier=priority` से मैप करते हैं; सीधे Anthropic अनुरोध इसे `service_tier=auto` या `standard_only` से मैप करते हैं।
        - `/reasoning`, `/verbose`, और `/trace` समूह सेटिंग में जोखिमपूर्ण हैं — वे आंतरिक तर्क या Plugin निदान प्रकट कर सकते हैं। समूह चैट में इन्हें बंद रखें।

      </Accordion>
      <Accordion title="मॉडल बदलने का विवरण">
        - `/model` नए मॉडल को तुरंत सत्र में बनाए रखता है।
        - यदि एजेंट निष्क्रिय है, तो अगला रन इसका तुरंत उपयोग करता है।
        - यदि कोई रन सक्रिय है, तो बदलाव को लंबित चिह्नित किया जाता है और अगले साफ़ पुनः प्रयास बिंदु पर लागू किया जाता है।

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="खोज और स्थिति">
    | कमांड | विवरण |
    | --- | --- |
    | `/help` | संक्षिप्त सहायता सारांश दिखाएँ |
    | `/commands` | जनरेट किया गया कमांड कैटलॉग दिखाएँ |
    | `/tools [compact\|verbose]` | दिखाएँ कि वर्तमान एजेंट अभी क्या उपयोग कर सकता है |
    | `/status` | निष्पादन/रनटाइम स्थिति, Gateway और सिस्टम अपटाइम, Plugin स्वास्थ्य तथा प्रदाता उपयोग/कोटा दिखाएँ |
    | `/status plugins` | Plugin स्वास्थ्य का विस्तृत विवरण दिखाएँ: लोड त्रुटियाँ, क्वारंटीन, चैनल Plugin विफलताएँ, निर्भरता समस्याएँ, संगतता सूचनाएँ। `commands.plugins: true` आवश्यक है |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | वर्तमान सत्र का स्थायी [लक्ष्य](/hi/tools/goal) प्रबंधित करें |
    | `/diagnostics [note]` | केवल-स्वामी समर्थन-रिपोर्ट प्रवाह। हर बार exec स्वीकृति माँगता है |
    | `/openclaw <request>` | स्वामी के DM से OpenClaw सेटअप और सुधार सहायक चलाएँ |
    | `/tasks` | वर्तमान सत्र के लिए सक्रिय/हाल के बैकग्राउंड कार्य सूचीबद्ध करें |
    | `/context [list\|detail\|map\|json]` | समझाएँ कि संदर्भ कैसे संयोजित किया जाता है |
    | `/whoami` | अपना प्रेषक आईडी दिखाएँ। उपनाम: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | प्रत्येक-प्रतिक्रिया उपयोग फुटर को नियंत्रित करें (`reset`/`inherit`/`clear`/`default` कॉन्फ़िगर किए गए डिफ़ॉल्ट को फिर से इनहेरिट करने के लिए सत्र ओवरराइड साफ़ करता है) या स्थानीय लागत सारांश प्रिंट करें |
  </Accordion>

  <Accordion title="Skills, अनुमति-सूचियाँ, अनुमोदन">
    | कमांड | विवरण |
    | --- | --- |
    | `/skill <name> [input]` | नाम से कोई skill चलाएँ |
    | `/learn [request]` | वर्तमान बातचीत या नामित स्रोतों से [Skill Workshop](/hi/tools/skill-workshop) के माध्यम से एक समीक्षायोग्य skill का प्रारूप बनाएँ |
    | `/allowlist [list\|add\|remove] ...` | अनुमति-सूची प्रविष्टियाँ प्रबंधित करें। केवल टेक्स्ट |
    | `/approve <id> <decision>` | exec या plugin अनुमोदन प्रॉम्प्ट का समाधान करें |
    | `/btw <question>` | सत्र संदर्भ बदले बिना एक अतिरिक्त प्रश्न पूछें। उपनाम: `/side`। [BTW](/hi/tools/btw) देखें |
  </Accordion>

  <Accordion title="उप-एजेंट और ACP">
    | कमांड | विवरण |
    | --- | --- |
    | `/subagents list\|log\|info` | वर्तमान सत्र के उप-एजेंट रन का निरीक्षण करें |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP सत्र और रनटाइम विकल्प प्रबंधित करें। रनटाइम नियंत्रणों के लिए बाहरी स्वामी या आंतरिक Gateway व्यवस्थापक पहचान आवश्यक है |
    | `/focus <target>` | वर्तमान Discord थ्रेड या Telegram विषय को किसी सत्र लक्ष्य से बाँधें |
    | `/unfocus` | वर्तमान थ्रेड बाइंडिंग हटाएँ |
    | `/agents` | वर्तमान सत्र के लिए थ्रेड से बँधे एजेंट सूचीबद्ध करें |
  </Accordion>

  <Accordion title="केवल-स्वामी लेखन और प्रशासन">
    | कमांड | आवश्यकता | विवरण |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json` पढ़ें या लिखें। केवल स्वामी |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw द्वारा प्रबंधित MCP सर्वर कॉन्फ़िगरेशन पढ़ें या लिखें। केवल स्वामी |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | plugin स्थिति का निरीक्षण करें या उसे बदलें। लेखन केवल स्वामी के लिए। उपनाम: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | केवल-रनटाइम कॉन्फ़िगरेशन ओवरराइड। केवल स्वामी |
    | `/restart` | `commands.restart: true` (डिफ़ॉल्ट) | OpenClaw पुनः आरंभ करें |
    | `/send on\|off\|inherit` | स्वामी | प्रेषण नीति सेट करें |
  </Accordion>

  <Accordion title="वॉइस, TTS, चैनल नियंत्रण">
    | कमांड | विवरण |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS नियंत्रित करें। [TTS](/hi/tools/tts) देखें |
    | `/activation mention\|always` | समूह सक्रियण मोड सेट करें |
    | `/bash <command>` | होस्ट शेल कमांड चलाएँ। उपनाम: `! <command>`। `commands.bash: true` आवश्यक है |
    | `!poll [sessionId]` | पृष्ठभूमि bash जॉब जाँचें |
    | `!stop [sessionId]` | पृष्ठभूमि bash जॉब रोकें |
  </Accordion>
</AccordionGroup>

### डॉक कमांड

डॉक कमांड सक्रिय सत्र के उत्तर मार्ग को किसी अन्य लिंक किए गए चैनल पर स्विच करते हैं।
सेटअप और समस्या निवारण के लिए [चैनल डॉकिंग](/hi/concepts/channel-docking) देखें।

नेटिव-कमांड समर्थन वाले चैनल plugins से जनरेट किए गए:

- `/dock-discord` (उपनाम: `/dock_discord`)
- `/dock-mattermost` (उपनाम: `/dock_mattermost`)
- `/dock-slack` (उपनाम: `/dock_slack`)
- `/dock-telegram` (उपनाम: `/dock_telegram`)

डॉक कमांड के लिए `session.identityLinks` आवश्यक है। स्रोत प्रेषक और लक्षित पीयर
एक ही पहचान समूह में होने चाहिए।

### बंडल किए गए plugin कमांड

| कमांड                                                 | विवरण                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | मेमोरी Dreaming टॉगल करें (स्वामी या Gateway व्यवस्थापक)। [Dreaming](/hi/concepts/dreaming) देखें                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | डिवाइस पेयरिंग प्रबंधित करें। [पेयरिंग](/hi/channels/pairing) देखें                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | उच्च-जोखिम वाले node कमांड (कैमरा/स्क्रीन/कंप्यूटर/लेखन) अस्थायी रूप से सक्षम करें। [कंप्यूटर उपयोग](/hi/nodes/computer-use) देखें                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Talk वॉइस कॉन्फ़िगरेशन प्रबंधित करें। Discord नेटिव नाम: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | LINE रिच कार्ड प्रीसेट भेजें। [LINE](/hi/channels/line) देखें                                                                                                                                        |
| `/codex <action> ...`                                   | Codex ऐप-सर्वर हार्नेस को बाँधें, निर्देशित करें और उसका निरीक्षण करें (स्थिति, थ्रेड, फिर से शुरू करना, मॉडल, तेज़ मोड, अनुमतियाँ, संक्षिप्तीकरण, समीक्षा, mcp, skills आदि)। [Codex हार्नेस](/hi/plugins/codex-harness) देखें |

केवल QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill कमांड

उपयोगकर्ता द्वारा चलाए जा सकने वाले skills स्लैश कमांड के रूप में उपलब्ध कराए जाते हैं:

- `/skill <name> [input]` सामान्य प्रवेश-बिंदु के रूप में हमेशा काम करता है।
- Skills प्रत्यक्ष कमांड के रूप में पंजीकृत हो सकते हैं (उदा. OpenProse के लिए `/prose`)।
- नेटिव skill-कमांड पंजीकरण `commands.nativeSkills` और
  `channels.<provider>.commands.nativeSkills` द्वारा नियंत्रित होता है।
- नामों को `a-z0-9_` में स्वच्छ किया जाता है (अधिकतम 32 वर्ण); टकराव होने पर संख्यात्मक प्रत्यय जोड़े जाते हैं।

<AccordionGroup>
  <Accordion title="Skill कमांड प्रेषण">
    डिफ़ॉल्ट रूप से, skill कमांड सामान्य अनुरोध के रूप में मॉडल तक भेजे जाते हैं।

    Skills किसी टूल तक सीधे भेजने के लिए `command-dispatch: tool` घोषित कर सकते हैं
    (नियतात्मक, मॉडल की भागीदारी नहीं)। उदाहरण: `/prose` (OpenProse plugin)
    — [OpenProse](/hi/prose) देखें।

  </Accordion>
  <Accordion title="नेटिव कमांड आर्ग्युमेंट">
    आवश्यक आर्ग्युमेंट छोड़े जाने पर Discord डायनेमिक विकल्पों के लिए स्वतः-पूर्णता और बटन मेनू का उपयोग करता है।
    Telegram और Slack विकल्पों वाले कमांड के लिए बटन मेनू दिखाते हैं।
    डायनेमिक विकल्प लक्षित सत्र मॉडल के अनुसार निर्धारित होते हैं, इसलिए `/think` स्तर जैसे मॉडल-
    विशिष्ट विकल्प सत्र के `/model` ओवरराइड का पालन करते हैं।
  </Accordion>
</AccordionGroup>

## `/tools`: एजेंट अभी क्या उपयोग कर सकता है

`/tools` रनटाइम संबंधी प्रश्न का उत्तर देता है: **इस बातचीत में यह एजेंट अभी
क्या उपयोग कर सकता है** — यह कोई स्थिर कॉन्फ़िगरेशन कैटलॉग नहीं है।

```text
/tools         # संक्षिप्त दृश्य
/tools verbose # छोटे विवरणों सहित
```

परिणाम सत्र-सीमित होते हैं। एजेंट, चैनल, थ्रेड, प्रेषक
प्राधिकरण या मॉडल बदलने से आउटपुट बदल सकता है। प्रोफ़ाइल और ओवरराइड संपादित करने के लिए,
Control UI Tools पैनल या कॉन्फ़िगरेशन सतहों का उपयोग करें।

## `/model`: मॉडल चयन

```text
/model             # मॉडल चयनकर्ता दिखाएँ
/model list        # समान
/model 3           # चयनकर्ता की संख्या से चुनें
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # सत्र मॉडल चयन साफ़ करें
/model status      # एंडपॉइंट और API मोड सहित विस्तृत दृश्य
```

Discord पर, `/model` और `/models` प्रदाता और
मॉडल ड्रॉपडाउन वाला इंटरैक्टिव चयनकर्ता खोलते हैं। चयनकर्ता `agents.defaults.modelPolicy.allow` का पालन करता है,
जिसमें `provider/*` प्रविष्टियाँ शामिल हैं। स्पष्ट अनुमति-सूची के बिना, मॉडल प्रविष्टियाँ और
उपनाम चयन को प्रतिबंधित नहीं करते।

## `/config`: डिस्क पर कॉन्फ़िगरेशन लेखन

<Note>
  केवल स्वामी। डिफ़ॉल्ट रूप से अक्षम — `commands.config: true` से सक्षम करें।
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

लिखने से पहले कॉन्फ़िगरेशन सत्यापित किया जाता है। अमान्य परिवर्तन अस्वीकार किए जाते हैं। `/config`
के अपडेट पुनः आरंभ के बाद भी बने रहते हैं।

## `/mcp`: MCP सर्वर कॉन्फ़िगरेशन

<Note>
  केवल स्वामी। डिफ़ॉल्ट रूप से अक्षम — `commands.mcp: true` से सक्षम करें।
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` कॉन्फ़िगरेशन को OpenClaw कॉन्फ़िगरेशन में संग्रहीत करता है, एम्बेडेड-एजेंट प्रोजेक्ट सेटिंग में नहीं।
`/mcp show` क्रेडेंशियल वाले फ़ील्ड, पहचाने गए क्रेडेंशियल फ़्लैग
मान और ज्ञात सीक्रेट-सदृश आर्ग्युमेंट छिपाता है। समूह से चलाए जाने पर,
कॉन्फ़िगरेशन स्वामी को निजी रूप से भेजा जाता है; यदि स्वामी के लिए कोई निजी मार्ग
उपलब्ध नहीं है, तो कमांड सुरक्षित रूप से विफल होता है और स्वामी से प्रत्यक्ष
चैट में फिर से प्रयास करने को कहता है।

## `/debug`: केवल-रनटाइम ओवरराइड

<Note>
  केवल स्वामी। डिफ़ॉल्ट रूप से अक्षम — `commands.debug: true` से सक्षम करें।
  ओवरराइड नए कॉन्फ़िगरेशन पठन पर तुरंत लागू होते हैं, लेकिन डिस्क पर **नहीं** लिखते।
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: plugin प्रबंधन

<Note>
  लेखन केवल स्वामी के लिए। डिफ़ॉल्ट रूप से अक्षम — `commands.plugins: true` से सक्षम करें।
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` plugin कॉन्फ़िगरेशन अपडेट करता है और नए एजेंट टर्न के लिए Gateway
plugin रनटाइम को हॉट-रीलोड करता है। `/plugins install` प्रबंधित
Gateways को स्वचालित रूप से पुनः आरंभ करता है क्योंकि plugin स्रोत मॉड्यूल बदल गए हैं। विश्वसनीय ClawHub
और आधिकारिक-कैटलॉग इंस्टॉल के लिए अतिरिक्त अभिस्वीकृति आवश्यक नहीं है। मनमाने npm,
git, आर्काइव, `npm-pack:` और स्थानीय पथ स्रोत उद्गम चेतावनी दिखाते हैं और
स्रोत की समीक्षा के बाद अंत में `--force` जोड़ना आवश्यक बनाते हैं। यह फ़्लैग स्रोत को
स्वीकार करता है और मौजूदा इंस्टॉल को बदलने की अनुमति देता है; यह
`security.installPolicy` या इंस्टॉलर सुरक्षा जाँच को बायपास नहीं करता। जोखिम चेतावनियों वाले ClawHub रिलीज़ के लिए
अलग, केवल-शेल
`--acknowledge-clawhub-risk` फ़्लैग अब भी आवश्यक है। मार्केटप्लेस, लिंक किए गए और पिन किए गए इंस्टॉल भी
केवल-शेल बने रहते हैं।

## `/trace`: plugin ट्रेस आउटपुट

```text
/trace          # वर्तमान ट्रेस स्थिति दिखाएँ
/trace on
/trace off
```

`/trace` पूर्ण वर्बोज़ मोड के बिना सत्र-सीमित plugin ट्रेस/डीबग पंक्तियाँ दिखाता है।
यह `/debug` (रनटाइम ओवरराइड) या `/verbose` (सामान्य
टूल आउटपुट) का स्थान नहीं लेता।

## `/btw`: अतिरिक्त प्रश्न

`/btw` वर्तमान सत्र संदर्भ के बारे में एक त्वरित अतिरिक्त प्रश्न है। उपनाम: `/side`।

```text
/btw अभी हम क्या कर रहे हैं?
/side मुख्य रन जारी रहने के दौरान क्या बदला?
```

सामान्य संदेश के विपरीत:

- वर्तमान सत्र को पृष्ठभूमि संदर्भ के रूप में उपयोग करता है।
- Codex हार्नेस सत्रों में, अस्थायी Codex अतिरिक्त थ्रेड के रूप में चलता है।
- भविष्य के सत्र संदर्भ को **नहीं** बदलता।
- ट्रांसक्रिप्ट इतिहास में नहीं लिखा जाता।

पूर्ण व्यवहार के लिए [BTW अतिरिक्त प्रश्न](/hi/tools/btw) देखें।

## सतह संबंधी टिप्पणियाँ

<AccordionGroup>
  <Accordion title="प्रति सतह सत्र का दायरा">
    - **टेक्स्ट कमांड:** सामान्य चैट सत्र में चलते हैं (DM, `main` साझा करते हैं; समूहों का अपना सत्र होता है)।
    - **नेटिव Discord कमांड:** `agent:<agentId>:discord:slash:<userId>`
    - **नेटिव Slack कमांड:** `agent:<agentId>:slack:slash:<userId>` (उपसर्ग `channels.slack.slashCommand.sessionPrefix` के माध्यम से कॉन्फ़िगर किया जा सकता है)
    - **नेटिव Telegram कमांड:** `telegram:slash:<userId>` (`CommandTargetSessionKey` के माध्यम से चैट सत्र को लक्षित करता है)
    - **`/login codex`** डिवाइस पेयरिंग कोड केवल निजी चैट या Web UI प्रतिक्रिया मार्गों से भेजता है। Telegram समूह/विषय आह्वान स्वामी से इसके बजाय बॉट को DM करने को कहते हैं।
    - **`/stop`** वर्तमान रन को निरस्त करने के लिए सक्रिय चैट सत्र को लक्षित करता है।

  </Accordion>
  <Accordion title="Slack की विशिष्टताएँ">
    `channels.slack.slashCommand` एकल `/openclaw`-शैली की कमांड का समर्थन करता है।
    `commands.native: true` के साथ, प्रत्येक अंतर्निहित कमांड के लिए एक Slack स्लैश कमांड बनाएँ।
    `/agentstatus` पंजीकृत करें (`/status` नहीं), क्योंकि Slack ने
    `/status` आरक्षित किया है। Slack संदेशों में टेक्स्ट `/status` अब भी काम करता है।
  </Accordion>
  <Accordion title="त्वरित पथ और इनलाइन शॉर्टकट">
    - अनुमति-सूची में शामिल प्रेषकों के केवल-कमांड वाले संदेशों को तुरंत प्रबंधित किया जाता है (कतार + मॉडल को बायपास करके)।
    - इनलाइन शॉर्टकट (`/help`, `/commands`, `/status`, `/whoami`) सामान्य संदेशों में अंतर्निहित होने पर भी काम करते हैं और मॉडल के शेष टेक्स्ट देखने से पहले हटा दिए जाते हैं।
    - अनधिकृत केवल-कमांड वाले संदेशों को बिना सूचना के अनदेखा कर दिया जाता है; इनलाइन `/...` टोकन को सामान्य टेक्स्ट माना जाता है।

  </Accordion>
  <Accordion title="आर्ग्युमेंट संबंधी टिप्पणियाँ">
    - कमांड, कमांड और आर्ग्युमेंट के बीच वैकल्पिक `:` स्वीकार करती हैं (`/think: high`, `/send: on`)।
    - `/new <model>` मॉडल उपनाम, `provider/model`, या प्रदाता का नाम (अनुमानित मिलान) स्वीकार करता है; कोई मिलान न मिलने पर टेक्स्ट को संदेश का मुख्य भाग माना जाता है।
    - `/allowlist add|remove` के लिए `commands.config: true` आवश्यक है और यह चैनल के `configWrites` का पालन करता है।

  </Accordion>
</AccordionGroup>

## प्रदाता उपयोग और स्थिति

- **प्रदाता उपयोग/कोटा** (उदा., "Claude 80% शेष") उपयोग ट्रैकिंग सक्षम होने पर वर्तमान मॉडल प्रदाता के लिए `/status` में दिखाई देता है।
- `/status` में **टोकन/कैश पंक्तियाँ**, लाइव सत्र स्नैपशॉट में पर्याप्त जानकारी न होने पर नवीनतम ट्रांसक्रिप्ट उपयोग प्रविष्टि का उपयोग कर सकती हैं।
- **निष्पादन बनाम रनटाइम:** `/status` प्रभावी सैंडबॉक्स पथ के लिए `Execution` और सत्र कौन चला रहा है, इसके लिए `Runtime` की रिपोर्ट करता है: `OpenClaw Default`, `OpenAI Codex`, कोई CLI बैकएंड, या कोई ACP बैकएंड।
- **प्रति-प्रतिक्रिया टोकन/लागत:** `/usage off|tokens|full` द्वारा नियंत्रित।
- `/model status` मॉडल/प्रमाणीकरण/एंडपॉइंट से संबंधित है, उपयोग से नहीं।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills" href="/hi/tools/skills" icon="puzzle-piece">
    स्किल स्लैश कमांड कैसे पंजीकृत और नियंत्रित की जाती हैं।
  </Card>
  <Card title="स्किल बनाना" href="/hi/tools/creating-skills" icon="hammer">
    ऐसी स्किल बनाएँ जो अपनी स्लैश कमांड पंजीकृत करती हो।
  </Card>
  <Card title="BTW" href="/hi/tools/btw" icon="comments">
    सत्र का संदर्भ बदले बिना सहायक प्रश्न।
  </Card>
  <Card title="मार्गदर्शन" href="/hi/tools/steer" icon="compass">
    `/steer` से एजेंट को रन के बीच में मार्गदर्शन दें।
  </Card>
</CardGroup>
