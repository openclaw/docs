---
read_when:
    - OpenClaw-समर्थित चैनलों से Codex, Claude Code, या किसी अन्य MCP क्लाइंट को कनेक्ट करना
    - '`openclaw mcp serve` चल रहा है'
    - OpenClaw द्वारा सहेजी गई MCP सर्वर परिभाषाओं का प्रबंधन
sidebarTitle: MCP
summary: MCP पर OpenClaw चैनल वार्तालाप उजागर करें और सहेजी गई MCP सर्वर परिभाषाएँ प्रबंधित करें
title: MCP
x-i18n:
    generated_at: "2026-06-28T22:50:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` के दो काम हैं:

- `openclaw mcp serve` के साथ OpenClaw को MCP सर्वर के रूप में चलाना
- `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, और `unset` के साथ OpenClaw-प्रबंधित आउटबाउंड MCP सर्वर परिभाषाओं को प्रबंधित करना

दूसरे शब्दों में:

- `serve` OpenClaw का MCP सर्वर के रूप में काम करना है
- अन्य सबकमांड OpenClaw का MCP सर्वरों के लिए MCP क्लाइंट-साइड रजिस्ट्री के रूप में काम करना है, जिन्हें इसके रनटाइम बाद में उपयोग कर सकते हैं

<Note>
  `list`, `show`, `set`, और `unset` केवल OpenClaw कॉन्फिग में OpenClaw-प्रबंधित `mcp.servers` प्रविष्टियों को पढ़ते और लिखते हैं। वे `config/mcporter.json` से mcporter सर्वर शामिल नहीं करते; उस रजिस्ट्री के लिए `mcporter list` का उपयोग करें।
</Note>

जब OpenClaw को खुद एक कोडिंग हार्नेस सत्र होस्ट करना हो और उस रनटाइम को ACP के माध्यम से रूट करना हो, तो [`openclaw acp`](/hi/cli/acp) का उपयोग करें।

## सही MCP पथ चुनें

OpenClaw में कई MCP सतहें हैं। वह चुनें जो इस बात से मेल खाती हो कि एजेंट रनटाइम का स्वामी कौन है और टूल्स का स्वामी कौन है।

| लक्ष्य                                                                | उपयोग                                                                  | क्यों                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| किसी बाहरी MCP क्लाइंट को OpenClaw चैनल वार्तालाप पढ़ने/भेजने दें | `openclaw mcp serve`                                                 | OpenClaw MCP सर्वर है और stdio पर Gateway-समर्थित वार्तालाप उजागर करता है।                                 |
| OpenClaw-प्रबंधित एजेंट रन के लिए तृतीय-पक्ष MCP सर्वर सहेजें        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw MCP क्लाइंट-साइड रजिस्ट्री है और बाद में उन सर्वरों को पात्र रनटाइम में प्रोजेक्ट करता है।               |
| एजेंट टर्न चलाए बिना सहेजे गए सर्वर की जांच करें                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` और `doctor` कॉन्फिग की जांच करते हैं; `probe` लाइव MCP कनेक्शन खोलता है और क्षमताएं सूचीबद्ध करता है।               |
| ब्राउज़र से MCP कॉन्फिग संपादित करें                                      | Control UI `/mcp`                                                    | पेज इन्वेंट्री, सक्षमकरण, OAuth/फिल्टर सारांश, कमांड संकेत, और स्कोप्ड `mcp` एडिटर दिखाता है।         |
| Codex ऐप-सर्वर को स्कोप्ड नेटिव MCP सर्वर दें                    | `mcp.servers.<name>.codex`                                           | `codex` ब्लॉक केवल Codex ऐप-सर्वर थ्रेड प्रोजेक्शन को प्रभावित करता है और नेटिव कॉन्फिग हैंडऑफ से पहले हटा दिया जाता है। |
| ACP-होस्टेड हार्नेस सत्र चलाएं                                     | [`openclaw acp`](/hi/cli/acp) और [ACP एजेंट](/hi/tools/acp-agents-setup) | ACP ब्रिज मोड प्रति-सत्र MCP सर्वर इंजेक्शन स्वीकार नहीं करता; इसके बजाय gateway/plugin ब्रिज कॉन्फिगर करें।     |

<Tip>
अगर आप सुनिश्चित नहीं हैं कि आपको कौन सा पथ चाहिए, तो `openclaw mcp status --verbose` से शुरू करें। यह कोई MCP सर्वर शुरू किए बिना दिखाता है कि OpenClaw ने क्या सहेजा है।
</Tip>

## MCP सर्वर के रूप में OpenClaw

यह `openclaw mcp serve` पथ है।

### `serve` कब उपयोग करें

`openclaw mcp serve` का उपयोग करें जब:

- Codex, Claude Code, या किसी अन्य MCP क्लाइंट को OpenClaw-समर्थित चैनल वार्तालापों से सीधे बात करनी चाहिए
- आपके पास पहले से रूटेड सत्रों वाला स्थानीय या दूरस्थ OpenClaw Gateway है
- आप अलग-अलग प्रति-चैनल ब्रिज चलाने के बजाय एक MCP सर्वर चाहते हैं जो OpenClaw के चैनल बैकएंड्स पर काम करे

जब OpenClaw को खुद कोडिंग रनटाइम होस्ट करना हो और एजेंट सत्र को OpenClaw के अंदर रखना हो, तो इसके बजाय [`openclaw acp`](/hi/cli/acp) का उपयोग करें।

### यह कैसे काम करता है

`openclaw mcp serve` एक stdio MCP सर्वर शुरू करता है। MCP क्लाइंट उस प्रक्रिया का स्वामी होता है। जब तक क्लाइंट stdio सत्र खुला रखता है, ब्रिज WebSocket पर स्थानीय या दूरस्थ OpenClaw Gateway से जुड़ता है और रूटेड चैनल वार्तालापों को MCP पर उजागर करता है।

<Steps>
  <Step title="क्लाइंट ब्रिज स्पॉन करता है">
    MCP क्लाइंट `openclaw mcp serve` स्पॉन करता है।
  </Step>
  <Step title="ब्रिज Gateway से जुड़ता है">
    ब्रिज WebSocket पर OpenClaw Gateway से जुड़ता है।
  </Step>
  <Step title="सत्र MCP वार्तालाप बन जाते हैं">
    रूटेड सत्र MCP वार्तालाप और ट्रांसक्रिप्ट/इतिहास टूल बन जाते हैं।
  </Step>
  <Step title="लाइव इवेंट कतार">
    जब ब्रिज कनेक्टेड होता है, तब लाइव इवेंट मेमोरी में कतारबद्ध होते हैं।
  </Step>
  <Step title="वैकल्पिक Claude पुश">
    यदि Claude चैनल मोड सक्षम है, तो वही सत्र Claude-विशिष्ट पुश सूचनाएं भी प्राप्त कर सकता है।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="महत्वपूर्ण व्यवहार">
    - लाइव कतार स्थिति तब शुरू होती है जब ब्रिज कनेक्ट होता है
    - पुराना ट्रांसक्रिप्ट इतिहास `messages_read` के साथ पढ़ा जाता है
    - Claude पुश सूचनाएं केवल MCP सत्र के जीवित रहने तक मौजूद होती हैं
    - जब क्लाइंट डिस्कनेक्ट होता है, तो ब्रिज बाहर निकलता है और लाइव कतार चली जाती है
    - `openclaw agent` और `openclaw infer model run` जैसे वन-शॉट एजेंट एंट्री पॉइंट अपने खोले गए किसी भी बंडल किए गए MCP रनटाइम को उत्तर पूरा होने पर रिटायर कर देते हैं, इसलिए दोहराए गए स्क्रिप्टेड रन stdio MCP चाइल्ड प्रक्रियाएं जमा नहीं करते
    - OpenClaw द्वारा लॉन्च किए गए stdio MCP सर्वर (बंडल किए गए या उपयोगकर्ता-कॉन्फिगर किए गए) शटडाउन पर प्रक्रिया ट्री के रूप में बंद कर दिए जाते हैं, इसलिए सर्वर द्वारा शुरू की गई चाइल्ड सबप्रोसेस पैरेंट stdio क्लाइंट के बाहर निकलने के बाद जीवित नहीं रहतीं
    - किसी सत्र को हटाने या रीसेट करने पर वह सत्र के MCP क्लाइंट्स को साझा रनटाइम क्लीनअप पथ के माध्यम से डिस्पोज करता है, इसलिए हटाए गए सत्र से जुड़े कोई lingering stdio कनेक्शन नहीं रहते

  </Accordion>
</AccordionGroup>

### क्लाइंट मोड चुनें

एक ही ब्रिज को दो अलग-अलग तरीकों से उपयोग करें:

<Tabs>
  <Tab title="सामान्य MCP क्लाइंट">
    केवल मानक MCP टूल्स। `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, और अनुमोदन टूल्स का उपयोग करें।
  </Tab>
  <Tab title="Claude Code">
    मानक MCP टूल्स के साथ Claude-विशिष्ट चैनल एडाप्टर। `--claude-channel-mode on` सक्षम करें या डिफॉल्ट `auto` रहने दें।
  </Tab>
</Tabs>

<Note>
आज, `auto` का व्यवहार `on` जैसा ही है। अभी कोई क्लाइंट क्षमता पहचान नहीं है।
</Note>

### `serve` क्या उजागर करता है

ब्रिज मौजूदा Gateway सत्र रूट मेटाडेटा का उपयोग करके चैनल-समर्थित वार्तालाप उजागर करता है। वार्तालाप तब दिखाई देता है जब OpenClaw के पास पहले से ज्ञात रूट के साथ सत्र स्थिति हो, जैसे:

- `channel`
- प्राप्तकर्ता या गंतव्य मेटाडेटा
- वैकल्पिक `accountId`
- वैकल्पिक `threadId`

यह MCP क्लाइंट्स को एक जगह देता है जहां वे:

- हाल के रूटेड वार्तालाप सूचीबद्ध कर सकते हैं
- हाल का ट्रांसक्रिप्ट इतिहास पढ़ सकते हैं
- नए इनबाउंड इवेंट्स की प्रतीक्षा कर सकते हैं
- उसी रूट से उत्तर वापस भेज सकते हैं
- ब्रिज के कनेक्टेड रहने के दौरान आने वाले अनुमोदन अनुरोध देख सकते हैं

### उपयोग

<Tabs>
  <Tab title="स्थानीय Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="दूरस्थ Gateway (टोकन)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="दूरस्थ Gateway (पासवर्ड)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="वर्बोस / Claude बंद">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ब्रिज टूल्स

वर्तमान ब्रिज ये MCP टूल्स उजागर करता है:

<AccordionGroup>
  <Accordion title="conversations_list">
    हाल के सत्र-समर्थित वार्तालापों को सूचीबद्ध करता है जिनके पास Gateway सत्र स्थिति में पहले से रूट मेटाडेटा है।

    उपयोगी फिल्टर:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    सीधे Gateway सत्र लुकअप का उपयोग करके `session_key` द्वारा एक वार्तालाप लौटाता है।
  </Accordion>
  <Accordion title="messages_read">
    एक सत्र-समर्थित वार्तालाप के लिए हाल के ट्रांसक्रिप्ट संदेश पढ़ता है।
  </Accordion>
  <Accordion title="attachments_fetch">
    एक ट्रांसक्रिप्ट संदेश से गैर-टेक्स्ट संदेश सामग्री ब्लॉक निकालता है। यह ट्रांसक्रिप्ट सामग्री पर मेटाडेटा दृश्य है, स्वतंत्र टिकाऊ अटैचमेंट ब्लॉब स्टोर नहीं।
  </Accordion>
  <Accordion title="events_poll">
    संख्यात्मक कर्सर के बाद से कतारबद्ध लाइव इवेंट्स पढ़ता है।
  </Accordion>
  <Accordion title="events_wait">
    अगले मेल खाते कतारबद्ध इवेंट के आने या टाइमआउट समाप्त होने तक long-poll करता है।

    इसका उपयोग तब करें जब किसी सामान्य MCP क्लाइंट को Claude-विशिष्ट पुश प्रोटोकॉल के बिना लगभग रियल-टाइम डिलीवरी चाहिए।

  </Accordion>
  <Accordion title="messages_send">
    सत्र पर पहले से रिकॉर्ड किए गए उसी रूट से टेक्स्ट वापस भेजता है।

    वर्तमान व्यवहार:

    - मौजूदा वार्तालाप रूट की आवश्यकता होती है
    - सत्र के चैनल, प्राप्तकर्ता, अकाउंट id, और थ्रेड id का उपयोग करता है
    - केवल टेक्स्ट भेजता है

  </Accordion>
  <Accordion title="permissions_list_open">
    ब्रिज के Gateway से जुड़ने के बाद से देखे गए लंबित exec/plugin अनुमोदन अनुरोधों को सूचीबद्ध करता है।
  </Accordion>
  <Accordion title="permissions_respond">
    एक लंबित exec/plugin अनुमोदन अनुरोध को इनके साथ हल करता है:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### इवेंट मॉडल

ब्रिज कनेक्टेड रहने के दौरान इन-मेमोरी इवेंट कतार रखता है।

वर्तमान इवेंट प्रकार:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- कतार केवल लाइव है; यह MCP ब्रिज शुरू होने पर शुरू होती है
- `events_poll` और `events_wait` अपने आप पुराना Gateway इतिहास रीप्ले नहीं करते
- टिकाऊ बैकलॉग `messages_read` के साथ पढ़ा जाना चाहिए

</Warning>

### Claude चैनल सूचनाएं

ब्रिज Claude-विशिष्ट चैनल सूचनाएं भी उजागर कर सकता है। यह Claude Code चैनल एडाप्टर का OpenClaw समकक्ष है: मानक MCP टूल्स उपलब्ध रहते हैं, लेकिन लाइव इनबाउंड संदेश Claude-विशिष्ट MCP सूचनाओं के रूप में भी आ सकते हैं।

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: केवल मानक MCP टूल्स।
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude चैनल सूचनाएं सक्षम करें।
  </Tab>
  <Tab title="auto (डिफॉल्ट)">
    `--claude-channel-mode auto`: वर्तमान डिफॉल्ट; `on` जैसा ही ब्रिज व्यवहार।
  </Tab>
</Tabs>

जब Claude चैनल मोड सक्षम होता है, तो सर्वर Claude प्रयोगात्मक क्षमताओं का विज्ञापन करता है और ये उत्सर्जित कर सकता है:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

वर्तमान ब्रिज व्यवहार:

- इनबाउंड `user` ट्रांसक्रिप्ट संदेश `notifications/claude/channel` के रूप में आगे भेजे जाते हैं
- MCP पर प्राप्त Claude अनुमति अनुरोध इन-मेमोरी ट्रैक किए जाते हैं
- यदि लिंक किया गया वार्तालाप बाद में `yes abcde` या `no abcde` भेजता है, तो ब्रिज उसे `notifications/claude/channel/permission` में बदल देता है
- ये सूचनाएं केवल लाइव-सत्र हैं; यदि MCP क्लाइंट डिस्कनेक्ट हो जाता है, तो कोई पुश लक्ष्य नहीं होता

यह जानबूझकर क्लाइंट-विशिष्ट है। सामान्य MCP क्लाइंट्स को मानक पोलिंग टूल्स पर निर्भर रहना चाहिए।

### MCP क्लाइंट कॉन्फिग

उदाहरण stdio क्लाइंट कॉन्फिग:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

अधिकांश सामान्य MCP क्लाइंट्स के लिए, मानक टूल सतह से शुरू करें और Claude मोड को अनदेखा करें। Claude मोड केवल उन क्लाइंट्स के लिए चालू करें जो वास्तव में Claude-विशिष्ट सूचना मेथड्स समझते हैं।

### विकल्प

`openclaw mcp serve` समर्थन करता है:

<ParamField path="--url" type="string">
  Gateway WebSocket URL।
</ParamField>
<ParamField path="--token" type="string">
  Gateway टोकन।
</ParamField>
<ParamField path="--token-file" type="string">
  फ़ाइल से टोकन पढ़ें।
</ParamField>
<ParamField path="--password" type="string">
  Gateway पासवर्ड।
</ParamField>
<ParamField path="--password-file" type="string">
  फ़ाइल से पासवर्ड पढ़ें।
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude सूचना मोड।
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr पर विस्तृत लॉग।
</ParamField>

<Tip>
संभव होने पर inline secrets के बजाय `--token-file` या `--password-file` को प्राथमिकता दें।
</Tip>

### सुरक्षा और भरोसे की सीमा

ब्रिज रूटिंग नहीं गढ़ता। यह केवल उन वार्तालापों को उजागर करता है जिन्हें Gateway पहले से रूट करना जानता है।

इसका अर्थ है:

- प्रेषक allowlists, pairing, और चैनल-स्तरीय भरोसा अभी भी अंतर्निहित OpenClaw चैनल कॉन्फ़िगरेशन के अधीन हैं
- `messages_send` केवल किसी मौजूदा संग्रहीत रूट के माध्यम से जवाब दे सकता है
- approval स्थिति केवल मौजूदा ब्रिज सत्र के लिए live/in-memory होती है
- ब्रिज auth में वही Gateway टोकन या पासवर्ड नियंत्रण उपयोग होने चाहिए जिन पर आप किसी अन्य remote Gateway क्लाइंट के लिए भरोसा करेंगे

यदि कोई वार्तालाप `conversations_list` में नहीं है, तो सामान्य कारण MCP कॉन्फ़िगरेशन नहीं होता। यह अंतर्निहित Gateway सत्र में अनुपस्थित या अधूरी रूट metadata होती है।

### परीक्षण

OpenClaw इस ब्रिज के लिए एक deterministic Docker smoke शामिल करता है:

```bash
pnpm test:docker:mcp-channels
```

वह smoke:

- एक seeded Gateway container शुरू करता है
- दूसरा container शुरू करता है जो `openclaw mcp serve` spawn करता है
- वार्तालाप खोज, transcript reads, attachment metadata reads, live event queue behavior, और outbound send routing को सत्यापित करता है
- वास्तविक stdio MCP ब्रिज पर Claude-style चैनल और permission notifications को validate करता है

यह किसी वास्तविक Telegram, Discord, या iMessage account को test run में जोड़े बिना ब्रिज के काम करने का प्रमाण पाने का सबसे तेज़ तरीका है।

व्यापक परीक्षण संदर्भ के लिए, [परीक्षण](/hi/help/testing) देखें।

### समस्या निवारण

<AccordionGroup>
  <Accordion title="No conversations returned">
    आम तौर पर इसका अर्थ है कि Gateway सत्र पहले से routable नहीं है। पुष्टि करें कि अंतर्निहित सत्र में संग्रहीत channel/provider, recipient, और वैकल्पिक account/thread route metadata मौजूद है।
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    अपेक्षित है। live queue तब शुरू होती है जब ब्रिज connect होता है। पुराने transcript history को `messages_read` से पढ़ें।
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    इन सभी की जाँच करें:

    - client ने stdio MCP सत्र खुला रखा
    - `--claude-channel-mode` `on` या `auto` है
    - client वास्तव में Claude-specific notification methods समझता है
    - inbound message ब्रिज connect होने के बाद हुआ

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` केवल उन approval requests को दिखाता है जिन्हें ब्रिज connected होने के दौरान देखा गया था। यह durable approval history API नहीं है।
  </Accordion>
</AccordionGroup>

## MCP client registry के रूप में OpenClaw

यह `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload`, और `unset` path है।

ये commands OpenClaw को MCP पर expose नहीं करते। ये OpenClaw config में `mcp.servers` के अंतर्गत OpenClaw-managed MCP server definitions को manage करते हैं। ये `config/mcporter.json` से mcporter servers नहीं पढ़ते।

वे saved definitions उन runtimes के लिए हैं जिन्हें OpenClaw बाद में launch या configure करता है, जैसे embedded OpenClaw और अन्य runtime adapters। OpenClaw definitions को centrally store करता है ताकि उन runtimes को अपनी duplicate MCP server lists रखने की आवश्यकता न हो।

<AccordionGroup>
  <Accordion title="Important behavior">
    - ये commands केवल OpenClaw config पढ़ते या लिखते हैं
    - `status`, `list`, `show`, `doctor` बिना `--probe`, `set`, `configure`, `tools`, `logout`, `reload`, और `unset` target MCP server से connect नहीं करते
    - `login` configured HTTP server के लिए MCP OAuth network flow चलाता है और resulting local credentials save करता है
    - `status --verbose` connect किए बिना resolved transport, auth, timeout, filter, और parallel-tool-call hints print करता है
    - `doctor` saved definitions में local setup problems की जाँच करता है, जैसे missing stdio commands, invalid working directories, missing TLS files, disabled servers, literal sensitive header/env values, और incomplete OAuth authorization
    - `doctor --probe` static checks pass होने के बाद `probe` जैसा live connection proof जोड़ता है
    - `probe` selected server या सभी configured servers से connect करता है, tools list करता है, और capabilities/diagnostics report करता है
    - `add` flags से definition बनाता है और saving से पहले probes करता है, जब तक `--no-probe` set न हो या OAuth authorization पहले आवश्यक न हो
    - runtime adapters execution time पर तय करते हैं कि वे वास्तव में कौन-सी transport shapes support करते हैं
    - `enabled: false` server को saved रखता है, लेकिन उसे embedded runtime discovery से exclude करता है
    - `timeout` और `connectTimeout` per-server request और connection timeouts seconds में set करते हैं
    - `supportsParallelToolCalls: true` उन servers को mark करता है जिन्हें adapters concurrently call कर सकते हैं
    - HTTP servers static headers, OAuth login, TLS verification control, और mTLS certificate/key paths का उपयोग कर सकते हैं
    - embedded OpenClaw normal `coding` और `messaging` tool profiles में configured MCP tools expose करता है; `minimal` अभी भी उन्हें hide करता है, और `tools.deny: ["bundle-mcp"]` उन्हें explicitly disable करता है
    - per-server `toolFilter.include` और `toolFilter.exclude` discovered MCP tools को OpenClaw tools बनने से पहले filter करते हैं
    - जो servers resources या prompts advertise करते हैं वे resources list/read करने और prompts list/fetch करने के utility tools भी expose करते हैं; उन generated utility names (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) पर वही include/exclude filter लागू होता है
    - dynamic MCP tool-list changes उस session के cached catalog को invalidate करते हैं; अगली discovery/use server से refresh करती है
    - repeated MCP tool request/protocol failures उस server को थोड़े समय के लिए pause करते हैं ताकि एक broken server पूरा turn consume न करे
    - session-scoped bundled MCP runtimes `mcp.sessionIdleTtlMs` milliseconds के idle time के बाद reap किए जाते हैं (default 10 minutes; disable करने के लिए `0` set करें) और one-shot embedded runs run end पर उन्हें clean up करते हैं

  </Accordion>
</AccordionGroup>

Runtime adapters इस shared registry को उस shape में normalize कर सकते हैं जिसकी उनके downstream client को अपेक्षा है। उदाहरण के लिए, embedded OpenClaw OpenClaw `transport` values को सीधे consume करता है, जबकि Claude Code और Gemini को CLI-native `type` values जैसे `http`, `sse`, या `stdio` मिलते हैं।

Codex app-server प्रत्येक server पर वैकल्पिक `codex` block का भी सम्मान करता है। यह केवल Codex app-server threads के लिए
OpenClaw projection metadata है; यह ACP sessions, generic Codex harness config, या अन्य runtime adapters को
नहीं बदलता।
किसी server को केवल specific OpenClaw
agent ids में project करने के लिए non-empty `codex.agents` का उपयोग करें। Empty, blank, या invalid agent lists config
validation द्वारा reject की जाती हैं और global बनने के बजाय runtime projection path द्वारा omit की जाती हैं।
trusted server के लिए Codex का native `default_tools_approval_mode` emit करने हेतु `codex.defaultToolsApprovalMode` (`auto`, `prompt`, या `approve`) का उपयोग करें।
OpenClaw native `mcp_servers`
config Codex को सौंपने से पहले `codex` metadata को strip करता है।

### Saved MCP server definitions

OpenClaw उन surfaces के लिए config में lightweight MCP server registry भी store करता है जिन्हें OpenClaw-managed MCP definitions चाहिए।

Commands:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Notes:

- `list` server names को sort करता है।
- `show` बिना name के full configured MCP server object print करता है।
- `status` connect किए बिना configured transports को classify करता है। `--verbose` में resolved launch, timeout, OAuth, filter, और parallel-call details शामिल होते हैं।
- `doctor` connect किए बिना static checks करता है। जब command को enabled servers के connect होने की भी verification करनी हो, तो `--probe` जोड़ें।
- `probe` connect करता है और tool counts, resources/prompts support, list-change support, और diagnostics report करता है।
- `add` stdio flags जैसे `--command`, `--arg`, `--env`, और `--cwd`, या HTTP flags जैसे `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout, और tool-selection flags accept करता है।
- `set` command line पर एक JSON object value expect करता है।
- `configure` पूरी server definition replace किए बिना enablement, tool filters, timeouts, OAuth, TLS, और parallel-tool-call hints update करता है।
- `tools` per-server tool filters update करता है। Include/exclude entries MCP tool names और simple `*` globs होते हैं।
- `login` `auth: "oauth"` के साथ configured HTTP servers के लिए OAuth flow चलाता है। पहला run authorization URL print करता है; approval के बाद `--code` के साथ rerun करें।
- `logout` named server के stored OAuth credentials clear करता है, saved server definition को remove किए बिना।
- `reload` cached in-process MCP runtimes dispose करता है। दूसरे process में Gateway या agent processes को अभी भी अपना reload या restart path चाहिए।
- Streamable HTTP MCP servers के लिए `transport: "streamable-http"` का उपयोग करें। `openclaw mcp set` compatibility के लिए CLI-native `type: "http"` को भी उसी canonical config shape में normalize करता है।
- `unset` fail होता है यदि named server मौजूद नहीं है।

Examples:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### सामान्य server recipes

ये examples केवल server definitions save करते हैं। यह prove करने के लिए कि server start होता है और tools expose करता है, बाद में `openclaw mcp doctor --probe` चलाएँ।

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    filesystem servers को सबसे छोटे directory tree तक scope करें जिसे agent को पढ़ना या edit करना चाहिए।

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    यदि server ऐसे write tools expose करता है जो normal agents के लिए available नहीं होने चाहिए, तो tool filter का उपयोग करें।

  </Tab>
  <Tab title="Local script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` जाँचता है कि `cwd` मौजूद है और command configured environment से resolve होता है।

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    जब रिमोट सर्वर इसका समर्थन करता हो, तब OAuth का उपयोग करें। यदि सर्वर को स्थिर हेडर चाहिए, तो शाब्दिक bearer tokens कमिट करने से बचें।

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    सीधे डेस्कटॉप-नियंत्रण सर्वर उस प्रक्रिया की अनुमतियां विरासत में लेते हैं जिसे वे लॉन्च करते हैं। संकीर्ण टूल फिल्टर और OS-स्तरीय अनुमति प्रॉम्प्ट का उपयोग करें।

  </Tab>
</Tabs>

### JSON आउटपुट आकार

स्क्रिप्ट और डैशबोर्ड के लिए `--json` का उपयोग करें। फील्ड सेट समय के साथ बढ़ सकते हैं, इसलिए उपभोक्ताओं को अज्ञात कुंजियों को अनदेखा करना चाहिए।

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    जब किसी भी सक्षम जांचे गए सर्वर में त्रुटि होती है, तो `doctor --json` गैर-शून्य निकास करता है। चेतावनियां रिपोर्ट की जाती हैं, लेकिन वे अपने आप कमांड को विफल नहीं बनातीं।

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` एक लाइव MCP क्लाइंट सेशन खोलता है। इसका उपयोग पहुंच-योग्यता और क्षमता प्रमाण के लिए करें, स्थिर कॉन्फिग ऑडिट के लिए नहीं।

  </Accordion>
</AccordionGroup>

उदाहरण कॉन्फिग आकार:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio ट्रांसपोर्ट

एक स्थानीय चाइल्ड प्रक्रिया लॉन्च करता है और stdin/stdout पर संचार करता है।

| फील्ड                     | विवरण                            |
| -------------------------- | --------------------------------- |
| `command`                  | स्पॉन करने के लिए executable (आवश्यक) |
| `args`                     | कमांड-लाइन आर्गुमेंट की array    |
| `env`                      | अतिरिक्त environment variables   |
| `cwd` / `workingDirectory` | प्रक्रिया के लिए working directory |

<Warning>
**Stdio env सुरक्षा फिल्टर**

OpenClaw उन interpreter-startup env कुंजियों को अस्वीकार करता है जो पहले RPC से पहले stdio MCP सर्वर के शुरू होने के तरीके को बदल सकती हैं, भले ही वे किसी सर्वर के `env` ब्लॉक में दिखाई दें। अवरुद्ध कुंजियों में `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`, और समान runtime-control variables शामिल हैं। स्टार्टअप इन्हें कॉन्फिगरेशन त्रुटि के साथ अस्वीकार करता है ताकि वे stdio प्रक्रिया के विरुद्ध कोई अंतर्निहित prelude इंजेक्ट न कर सकें, interpreter को बदल न सकें, debugger सक्षम न कर सकें, या runtime आउटपुट को redirect न कर सकें। सामान्य credential, proxy, और server-specific env vars (`GITHUB_TOKEN`, `HTTP_PROXY`, custom `*_API_KEY`, आदि) प्रभावित नहीं होते।

यदि आपके MCP सर्वर को वास्तव में अवरुद्ध variables में से किसी एक की जरूरत है, तो उसे stdio सर्वर के `env` के अंतर्गत रखने के बजाय gateway host process पर सेट करें।
</Warning>

### SSE / HTTP ट्रांसपोर्ट

HTTP Server-Sent Events पर रिमोट MCP सर्वर से कनेक्ट करता है।

| फील्ड                          | विवरण                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | रिमोट सर्वर का HTTP या HTTPS URL (आवश्यक)                |
| `headers`                      | HTTP headers का वैकल्पिक key-value map (उदाहरण के लिए auth tokens) |
| `connectionTimeoutMs`          | प्रति-सर्वर connection timeout ms में (वैकल्पिक)                   |
| `connectTimeout`               | प्रति-सर्वर connection timeout सेकंड में (वैकल्पिक)              |
| `timeout` / `requestTimeoutMs` | प्रति-सर्वर MCP request timeout सेकंड या ms में                  |
| `auth: "oauth"`                | MCP OAuth token storage और `openclaw mcp login` का उपयोग करें             |
| `sslVerify`                    | केवल स्पष्ट रूप से भरोसेमंद निजी HTTPS endpoints के लिए false सेट करें    |
| `clientCert` / `clientKey`     | mTLS client certificate और key paths                            |
| `supportsParallelToolCalls`    | संकेत कि इस सर्वर के लिए concurrent calls सुरक्षित हैं              |

उदाहरण:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` (userinfo) और `headers` में संवेदनशील मान logs और status output में redacted होते हैं। जब संवेदनशील दिखने वाली `headers` या `env` entries में शाब्दिक मान होते हैं, तो `openclaw mcp doctor` चेतावनी देता है, ताकि operators उन मानों को committed config से बाहर ले जा सकें।

### OAuth वर्कफ्लो

OAuth उन HTTP MCP सर्वरों के लिए है जो MCP OAuth flow advertise करते हैं। जब किसी सर्वर के लिए `auth: "oauth"` सक्षम हो, तो static `Authorization` headers अनदेखे किए जाते हैं।

<Steps>
  <Step title="Save the server">
    सर्वर को `auth: "oauth"` और किसी भी वैकल्पिक OAuth metadata के साथ जोड़ें या अपडेट करें।

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    authorization request बनाने के लिए login चलाएं।

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw authorization URL प्रिंट करता है और OpenClaw state directory के अंतर्गत अस्थायी OAuth verifier state संग्रहीत करता है।

  </Step>
  <Step title="Finish with the code">
    ब्राउज़र में approval के बाद, लौटाया गया code OpenClaw को वापस पास करें।

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    यह पुष्टि करने के लिए status या doctor का उपयोग करें कि tokens मौजूद हैं।

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    Logout संग्रहीत OAuth credentials हटाता है, लेकिन saved server definition बनाए रखता है।

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

यदि provider tokens rotate करता है या authorization state अटक जाती है, तो `openclaw mcp logout <name>` चलाएं, फिर `login` दोहराएं। `logout` किसी saved HTTP सर्वर के लिए credentials साफ कर सकता है, भले ही `auth: "oauth"` config से हटा दिया गया हो, जब तक server name और URL अब भी credential store entry की पहचान करते हों।

### Streamable HTTP ट्रांसपोर्ट

`streamable-http` `sse` और `stdio` के साथ एक अतिरिक्त transport option है। यह रिमोट MCP सर्वरों के साथ द्विदिश संचार के लिए HTTP streaming का उपयोग करता है।

| फील्ड                          | विवरण                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | रिमोट सर्वर का HTTP या HTTPS URL (आवश्यक)                                      |
| `transport`                    | इस transport को चुनने के लिए `"streamable-http"` पर सेट करें; छोड़े जाने पर, OpenClaw `sse` का उपयोग करता है |
| `headers`                      | HTTP headers का वैकल्पिक key-value map (उदाहरण के लिए auth tokens)                       |
| `connectionTimeoutMs`          | प्रति-सर्वर connection timeout ms में (वैकल्पिक)                                         |
| `connectTimeout`               | प्रति-सर्वर connection timeout सेकंड में (वैकल्पिक)                                    |
| `timeout` / `requestTimeoutMs` | प्रति-सर्वर MCP request timeout सेकंड या ms में                                        |
| `auth: "oauth"`                | MCP OAuth token storage और `openclaw mcp login` का उपयोग करें                                   |
| `sslVerify`                    | केवल स्पष्ट रूप से भरोसेमंद निजी HTTPS endpoints के लिए false सेट करें                          |
| `clientCert` / `clientKey`     | mTLS client certificate और key paths                                                  |
| `supportsParallelToolCalls`    | संकेत कि इस सर्वर के लिए concurrent calls सुरक्षित हैं                                    |

OpenClaw config canonical spelling के रूप में `transport: "streamable-http"` का उपयोग करता है। CLI-native MCP `type: "http"` मान `openclaw mcp set` के माध्यम से save किए जाने पर स्वीकार किए जाते हैं और मौजूदा config में `openclaw doctor --fix` द्वारा repaired किए जाते हैं, लेकिन embedded OpenClaw सीधे `transport` का उपभोग करता है।

उदाहरण:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Registry commands channel bridge शुरू नहीं करते। केवल `probe` और `doctor --probe` target server के reachable होने का प्रमाण देने के लिए live MCP client session खोलते हैं।
</Note>

## Control UI

ब्राउज़र Control UI में `/mcp` पर एक समर्पित MCP settings page शामिल है। यह configured server counts, enabled/OAuth/filter summaries, per-server transport rows, enable/disable controls, common CLI commands, और `mcp` config section के लिए scoped editor दिखाता है।

operator edits और quick inventory के लिए इस पेज का उपयोग करें। जब आपको live server proof चाहिए, तो `openclaw mcp doctor --probe` या `openclaw mcp probe` का उपयोग करें।

Operator workflow:

1. Control UI खोलें और **MCP** चुनें।
2. कुल, सक्षम, OAuth, और फ़िल्टर किए गए सर्वरों के लिए सारांश कार्डों की समीक्षा करें।
3. transport, auth, filter, timeout, और command संकेतों के लिए प्रत्येक सर्वर पंक्ति का उपयोग करें।
4. जब आप किसी परिभाषा को रखना चाहते हैं लेकिन उसे runtime discovery से बाहर करना चाहते हैं, तो enablement टॉगल करें।
5. नए सर्वर, headers, TLS, OAuth metadata, या tool filters जैसे संरचनात्मक बदलावों के लिए scoped `mcp` config section संपादित करें।
6. केवल config बनाए रखने के लिए **Save** चुनें, या Gateway config path के माध्यम से लागू करने के लिए **Save & Publish** चुनें।
7. जब आपको live proof चाहिए कि संपादित सर्वर शुरू होता है और tools सूचीबद्ध करता है, तो `openclaw mcp doctor --probe` चलाएँ।

नोट्स:

- command snippets सर्वर नामों को quote करते हैं ताकि असामान्य नाम shell में copyable रहें
- प्रदर्शित URL-जैसे मान rendering से पहले redacted किए जाते हैं जब उनमें embedded credentials होते हैं
- पृष्ठ अपने आप MCP transports शुरू नहीं करता
- active runtimes को MCP clients का स्वामी कौन-सी process है, इस पर निर्भर करते हुए `openclaw mcp reload`, Gateway config publish, या process restart की आवश्यकता हो सकती है

## वर्तमान सीमाएँ

यह पृष्ठ bridge को वैसा ही दस्तावेज़ित करता है जैसा वह आज shipped है।

वर्तमान सीमाएँ:

- conversation discovery मौजूदा Gateway session route metadata पर निर्भर करती है
- Claude-specific adapter से आगे कोई generic push protocol नहीं है
- अभी तक कोई message edit या react tools नहीं हैं
- HTTP/SSE/streamable-http transport एक single remote server से जुड़ता है; अभी कोई multiplexed upstream नहीं है
- `permissions_list_open` में केवल वे approvals शामिल हैं जो bridge के connected रहने के दौरान देखे गए हैं

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Plugins](/hi/cli/plugins)
