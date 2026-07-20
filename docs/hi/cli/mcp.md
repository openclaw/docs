---
read_when:
    - Codex, Claude Code या किसी अन्य MCP क्लाइंट को OpenClaw-समर्थित चैनलों से कनेक्ट करना
    - '`openclaw mcp serve` चलाया जा रहा है'
    - OpenClaw द्वारा सहेजी गई MCP सर्वर परिभाषाओं का प्रबंधन
sidebarTitle: MCP
summary: MCP के माध्यम से OpenClaw चैनल वार्तालाप उपलब्ध कराएँ और सहेजी गई MCP सर्वर परिभाषाएँ प्रबंधित करें
title: MCP
x-i18n:
    generated_at: "2026-07-20T16:56:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 07db33cc81d9e307b4bd83e0a3a283aa8a9bb66f9fbedd7f972d59333676b7e9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` के दो कार्य हैं:

- `openclaw mcp serve` के साथ OpenClaw को MCP सर्वर के रूप में चलाना
- `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, और `unset` के साथ OpenClaw द्वारा प्रबंधित आउटबाउंड MCP सर्वर परिभाषाओं को प्रबंधित करना

`serve` में OpenClaw एक MCP सर्वर के रूप में कार्य करता है। अन्य उपकमांड में OpenClaw उन सर्वरों के लिए MCP क्लाइंट-साइड रजिस्ट्री के रूप में कार्य करता है, जिनका उपयोग इसके अपने रनटाइम बाद में कर सकते हैं।

<Note>
  `list`, `show`, `set`, और `unset` केवल OpenClaw कॉन्फ़िगरेशन में OpenClaw द्वारा प्रबंधित `mcp.servers` प्रविष्टियाँ पढ़ते और लिखते हैं। इनमें `config/mcporter.json` के mcporter सर्वर शामिल नहीं होते; उस रजिस्ट्री के लिए `mcporter list` का उपयोग करें।
</Note>

जब OpenClaw को स्वयं किसी कोडिंग हार्नेस सत्र को होस्ट करना हो और उस रनटाइम को ACP के माध्यम से रूट करना हो, तो [`openclaw acp`](/hi/cli/acp) का उपयोग करें।

## सही MCP पथ चुनें

| लक्ष्य                                                                | उपयोग करें                                                                  | कारण                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| किसी बाहरी MCP क्लाइंट को OpenClaw चैनल वार्तालाप पढ़ने/भेजने दें | `openclaw mcp serve`                                                 | OpenClaw MCP सर्वर है और stdio पर Gateway-समर्थित वार्तालाप उपलब्ध कराता है।                                 |
| OpenClaw द्वारा प्रबंधित एजेंट रन के लिए तृतीय-पक्ष MCP सर्वर सहेजें        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw MCP क्लाइंट-साइड रजिस्ट्री है और बाद में उन सर्वरों को योग्य रनटाइम में प्रोजेक्ट करता है।               |
| एजेंट टर्न चलाए बिना सहेजे गए सर्वर की जाँच करें                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` और `doctor` कॉन्फ़िगरेशन का निरीक्षण करते हैं; `probe` एक लाइव MCP कनेक्शन खोलता है और क्षमताएँ सूचीबद्ध करता है।               |
| ब्राउज़र से MCP कॉन्फ़िगरेशन संपादित करें                                      | Control UI `/settings/mcp` (`/mcp` उपनाम)                            | यह पृष्ठ इन्वेंट्री, सक्षमता, OAuth/फ़िल्टर सारांश, कमांड संकेत और एक सीमित-कार्यक्षेत्र वाला `mcp` संपादक दिखाता है।         |
| Codex app-server को सीमित-कार्यक्षेत्र वाला नेटिव MCP सर्वर दें                    | `mcp.servers.<name>.codex`                                           | `codex` ब्लॉक केवल Codex app-server थ्रेड प्रोजेक्शन को प्रभावित करता है और नेटिव कॉन्फ़िगरेशन सौंपने से पहले हटा दिया जाता है। |
| ACP द्वारा होस्ट किए गए हार्नेस सत्र चलाएँ                                     | [`openclaw acp`](/hi/cli/acp) और [ACP एजेंट](/hi/tools/acp-agents-setup) | ACP ब्रिज मोड प्रति-सत्र MCP सर्वर इंजेक्शन स्वीकार नहीं करता; इसके बजाय gateway/plugin ब्रिज कॉन्फ़िगर करें।     |

<Tip>
यदि आप निश्चित नहीं हैं कि आपको कौन-सा पथ चाहिए, तो `openclaw mcp status --verbose` से शुरू करें। यह कोई MCP सर्वर शुरू किए बिना दिखाता है कि OpenClaw ने क्या सहेजा है।
</Tip>

## MCP सर्वर के रूप में OpenClaw

यह `openclaw mcp serve` पथ है।

### serve का उपयोग कब करें

`openclaw mcp serve` का उपयोग तब करें, जब:

- Codex, Claude Code या किसी अन्य MCP क्लाइंट को OpenClaw-समर्थित चैनल वार्तालापों से सीधे संचार करना हो
- आपके पास रूट किए गए सत्रों वाला कोई स्थानीय या दूरस्थ OpenClaw Gateway पहले से मौजूद हो
- आप प्रत्येक चैनल के लिए अलग-अलग ब्रिज चलाने के बजाय ऐसा एक MCP सर्वर चाहते हों जो OpenClaw के सभी चैनल बैकएंड पर काम करे

इसके बजाय [`openclaw acp`](/hi/cli/acp) का उपयोग तब करें, जब OpenClaw को कोडिंग रनटाइम स्वयं होस्ट करना हो और एजेंट सत्र को OpenClaw के भीतर रखना हो।

### यह कैसे काम करता है

`openclaw mcp serve` एक stdio MCP सर्वर शुरू करता है। उस प्रक्रिया का स्वामी MCP क्लाइंट होता है। जब तक क्लाइंट stdio सत्र खुला रखता है, ब्रिज WebSocket के माध्यम से किसी स्थानीय या दूरस्थ OpenClaw Gateway से जुड़ा रहता है और MCP पर रूट किए गए चैनल वार्तालाप उपलब्ध कराता है।

<Steps>
  <Step title="क्लाइंट ब्रिज शुरू करता है">
    MCP क्लाइंट `openclaw mcp serve` शुरू करता है।
  </Step>
  <Step title="ब्रिज Gateway से जुड़ता है">
    ब्रिज WebSocket के माध्यम से OpenClaw Gateway से जुड़ता है।
  </Step>
  <Step title="सत्र MCP वार्तालाप बन जाते हैं">
    रूट किए गए सत्र MCP वार्तालाप और ट्रांस्क्रिप्ट/इतिहास टूल बन जाते हैं।
  </Step>
  <Step title="लाइव इवेंट कतारबद्ध होते हैं">
    ब्रिज के जुड़े रहने के दौरान लाइव इवेंट मेमोरी में कतारबद्ध होते हैं।
  </Step>
  <Step title="वैकल्पिक Claude पुश">
    यदि Claude चैनल मोड सक्षम है, तो वही सत्र Claude-विशिष्ट पुश सूचनाएँ भी प्राप्त कर सकता है।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="महत्वपूर्ण व्यवहार">
    - ब्रिज के जुड़ने पर लाइव कतार की स्थिति शुरू होती है
    - पुराना ट्रांस्क्रिप्ट इतिहास `messages_read` से पढ़ा जाता है
    - Claude पुश सूचनाएँ केवल MCP सत्र के सक्रिय रहने तक मौजूद रहती हैं
    - क्लाइंट के डिस्कनेक्ट होने पर ब्रिज बंद हो जाता है और लाइव कतार समाप्त हो जाती है
    - `openclaw agent` और `openclaw infer model run` जैसे एकल-प्रयोग एजेंट प्रवेश-बिंदु, उत्तर पूरा होने पर उनके द्वारा खोले गए किसी भी बंडल किए गए MCP रनटाइम को बंद कर देते हैं, इसलिए बार-बार चलाए गए स्क्रिप्टेड रन में stdio MCP चाइल्ड प्रक्रियाएँ जमा नहीं होतीं
    - OpenClaw द्वारा शुरू किए गए stdio MCP सर्वर (बंडल किए गए या उपयोगकर्ता द्वारा कॉन्फ़िगर किए गए) शटडाउन के समय पूरी प्रोसेस ट्री सहित बंद कर दिए जाते हैं, इसलिए सर्वर द्वारा शुरू की गई चाइल्ड उपप्रक्रियाएँ पैरेंट stdio क्लाइंट के बंद होने के बाद सक्रिय नहीं रहतीं
    - किसी सत्र को हटाने या रीसेट करने पर साझा रनटाइम क्लीनअप पथ के माध्यम से उस सत्र के MCP क्लाइंट समाप्त कर दिए जाते हैं, इसलिए हटाए गए सत्र से जुड़े कोई stdio कनेक्शन शेष नहीं रहते

  </Accordion>
</AccordionGroup>

### क्लाइंट मोड चुनें

<Tabs>
  <Tab title="सामान्य MCP क्लाइंट">
    केवल मानक MCP टूल। `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` और अनुमोदन टूल का उपयोग करें।
  </Tab>
  <Tab title="Claude Code">
    मानक MCP टूल के साथ Claude-विशिष्ट चैनल एडाप्टर। `--claude-channel-mode on` सक्षम करें या डिफ़ॉल्ट `auto` रहने दें।
  </Tab>
</Tabs>

<Note>
वर्तमान में, `auto` का व्यवहार `on` जैसा ही है। अभी तक क्लाइंट क्षमता पहचान उपलब्ध नहीं है।
</Note>

### serve क्या उपलब्ध कराता है

ब्रिज चैनल-समर्थित वार्तालाप उपलब्ध कराने के लिए मौजूदा Gateway सत्र रूट मेटाडेटा का उपयोग करता है। कोई वार्तालाप तब दिखाई देता है, जब OpenClaw के पास पहले से ज्ञात रूट वाली सत्र स्थिति हो, जैसे:

- `channel`
- प्राप्तकर्ता या गंतव्य मेटाडेटा
- वैकल्पिक `accountId`
- वैकल्पिक `threadId`

इससे MCP क्लाइंट एक ही स्थान पर ये कार्य कर सकते हैं:

- हाल के रूट किए गए वार्तालाप सूचीबद्ध करना
- हाल का ट्रांस्क्रिप्ट इतिहास पढ़ना
- नए इनबाउंड इवेंट की प्रतीक्षा करना
- उसी रूट से वापस उत्तर भेजना
- ब्रिज के जुड़े रहने के दौरान आने वाले अनुमोदन अनुरोध देखना

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
  <Tab title="विस्तृत / Claude बंद">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ब्रिज टूल

<AccordionGroup>
  <Accordion title="conversations_list">
    हाल के उन सत्र-समर्थित वार्तालापों को सूचीबद्ध करता है, जिनके लिए Gateway सत्र स्थिति में पहले से रूट मेटाडेटा मौजूद है।

    फ़िल्टर: `limit` (अधिकतम 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`।

  </Accordion>
  <Accordion title="conversation_get">
    सीधे Gateway सत्र लुकअप का उपयोग करके `session_key` के आधार पर एक वार्तालाप लौटाता है।
  </Accordion>
  <Accordion title="messages_read">
    एक सत्र-समर्थित वार्तालाप के हाल के ट्रांस्क्रिप्ट संदेश पढ़ता है। `limit` का डिफ़ॉल्ट 20 है, अधिकतम 200।
  </Accordion>
  <Accordion title="attachments_fetch">
    किसी एक ट्रांस्क्रिप्ट संदेश से गैर-पाठ संदेश सामग्री ब्लॉक निकालता है। यह ट्रांस्क्रिप्ट सामग्री का मेटाडेटा दृश्य है, कोई स्वतंत्र स्थायी अटैचमेंट ब्लॉब स्टोर नहीं।
  </Accordion>
  <Accordion title="events_poll">
    संख्यात्मक कर्सर के बाद से कतारबद्ध लाइव इवेंट पढ़ता है। `limit` अधिकतम 200।
  </Accordion>
  <Accordion title="events_wait">
    अगला मेल खाता कतारबद्ध इवेंट आने या टाइमआउट समाप्त होने तक लॉन्ग-पोल करता है (डिफ़ॉल्ट 30s, अधिकतम 300s)।

    जब किसी सामान्य MCP क्लाइंट को Claude-विशिष्ट पुश प्रोटोकॉल के बिना लगभग रियल-टाइम डिलीवरी चाहिए, तब इसका उपयोग करें।

  </Accordion>
  <Accordion title="messages_send">
    सत्र पर पहले से दर्ज उसी रूट के माध्यम से पाठ वापस भेजता है।

    वर्तमान व्यवहार:

    - एक मौजूदा वार्तालाप रूट आवश्यक है
    - सत्र के चैनल, प्राप्तकर्ता, खाता आईडी और थ्रेड आईडी का उपयोग करता है
    - केवल पाठ भेजता है

  </Accordion>
  <Accordion title="permissions_list_open">
    ब्रिज के Gateway से जुड़ने के बाद से उसके द्वारा देखे गए लंबित exec/plugin अनुमोदन अनुरोधों को सूचीबद्ध करता है।
  </Accordion>
  <Accordion title="permissions_respond">
    एक लंबित exec/plugin अनुमोदन अनुरोध को इनमें से किसी एक के साथ हल करता है:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### इवेंट मॉडल

ब्रिज के जुड़े रहने के दौरान यह मेमोरी में इवेंट कतार बनाए रखता है।

वर्तमान इवेंट प्रकार:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- कतार केवल लाइव है; यह MCP ब्रिज शुरू होने पर आरंभ होती है
- `events_poll` और `events_wait` स्वयं पुराने Gateway इतिहास को फिर से नहीं चलाते
- स्थायी बैकलॉग को `messages_read` से पढ़ा जाना चाहिए

</Warning>

### Claude चैनल सूचनाएँ

ब्रिज Claude-विशिष्ट चैनल सूचनाएँ भी उपलब्ध करा सकता है। यह Claude Code चैनल एडाप्टर का OpenClaw समकक्ष है: मानक MCP टूल उपलब्ध रहते हैं, लेकिन लाइव इनबाउंड संदेश Claude-विशिष्ट MCP सूचनाओं के रूप में भी आ सकते हैं।

<Tabs>
  <Tab title="बंद">
    `--claude-channel-mode off`: केवल मानक MCP टूल।
  </Tab>
  <Tab title="चालू">
    `--claude-channel-mode on`: Claude चैनल सूचनाएँ सक्षम करें।
  </Tab>
  <Tab title="स्वतः (डिफ़ॉल्ट)">
    `--claude-channel-mode auto`: वर्तमान डिफ़ॉल्ट; ब्रिज का व्यवहार `on` जैसा ही है।
  </Tab>
</Tabs>

Claude चैनल मोड सक्षम होने पर, सर्वर Claude की प्रयोगात्मक क्षमताओं की घोषणा करता है और ये उत्सर्जित कर सकता है:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

वर्तमान ब्रिज व्यवहार:

- इनबाउंड `user` ट्रांस्क्रिप्ट संदेशों को `notifications/claude/channel` के रूप में अग्रेषित किया जाता है
- MCP पर प्राप्त Claude अनुमति अनुरोध मेमोरी में ट्रैक किए जाते हैं
- यदि लिंक किए गए वार्तालाप का कमांड स्वामी बाद में `yes <id>` या `no <id>` भेजता है (`<id>`, `l` को छोड़कर, 5-अक्षर का अनुरोध आईडी है), तो ब्रिज उसे `notifications/claude/channel/permission` में बदल देता है
- ये सूचनाएँ केवल लाइव सत्र के लिए हैं; MCP क्लाइंट के डिस्कनेक्ट होने पर कोई पुश लक्ष्य नहीं रहता

यह जानबूझकर क्लाइंट-विशिष्ट है। सामान्य MCP क्लाइंट को मानक पोलिंग टूल पर निर्भर रहना चाहिए।

### MCP क्लाइंट कॉन्फ़िगरेशन

stdio क्लाइंट कॉन्फ़िगरेशन का उदाहरण:

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

अधिकांश सामान्य MCP क्लाइंट के लिए, मानक टूल सतह से शुरू करें और Claude मोड को अनदेखा करें। Claude मोड केवल उन क्लाइंट के लिए चालू करें जो वास्तव में Claude-विशिष्ट सूचना विधियों को समझते हैं।

### विकल्प

`openclaw mcp serve` निम्न का समर्थन करता है:

<ParamField path="--url" type="string">
  Gateway WebSocket URL। कॉन्फ़िगर होने पर डिफ़ॉल्ट रूप से `gateway.remote.url`।
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
  Claude सूचना मोड। डिफ़ॉल्ट `auto`।
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr पर विस्तृत लॉग।
</ParamField>

<Tip>
जहाँ संभव हो, इनलाइन गोपनीय मानों के बजाय `--token-file` या `--password-file` को प्राथमिकता दें।
</Tip>

### सुरक्षा और विश्वास सीमा

ब्रिज रूटिंग स्वयं नहीं बनाता। यह केवल उन वार्तालापों को उपलब्ध कराता है जिन्हें रूट करना Gateway पहले से जानता है।

इसका अर्थ है:

- प्रेषक अनुमति-सूचियाँ, पेयरिंग और चैनल-स्तरीय विश्वास अब भी अंतर्निहित OpenClaw चैनल कॉन्फ़िगरेशन के अंतर्गत आते हैं
- `messages_send` केवल किसी मौजूदा संग्रहित रूट के माध्यम से उत्तर दे सकता है
- अनुमोदन स्थिति केवल वर्तमान ब्रिज सत्र के लिए लाइव/इन-मेमोरी होती है
- ब्रिज प्रमाणीकरण में उन्हीं Gateway टोकन या पासवर्ड नियंत्रणों का उपयोग होना चाहिए जिन पर आप किसी अन्य रिमोट Gateway क्लाइंट के लिए भरोसा करेंगे

यदि कोई वार्तालाप `conversations_list` से अनुपस्थित है, तो सामान्यतः इसका कारण MCP कॉन्फ़िगरेशन नहीं होता। इसका कारण अंतर्निहित Gateway सत्र में रूट मेटाडेटा का अनुपस्थित या अधूरा होना होता है।

### परीक्षण

OpenClaw इस ब्रिज के लिए एक नियतात्मक Docker स्मोक परीक्षण के साथ आता है:

```bash
pnpm test:docker:mcp-channels
```

यह स्मोक परीक्षण एक कंटेनर चलाता है: यह वार्तालाप स्थिति को सीड करता है, Gateway शुरू करता है, फिर `openclaw mcp serve` को stdio चाइल्ड प्रक्रिया के रूप में स्पॉन करता है और उसे MCP क्लाइंट के रूप में संचालित करता है। यह वास्तविक stdio MCP ब्रिज पर वार्तालाप खोज, ट्रांसक्रिप्ट रीड, अटैचमेंट मेटाडेटा रीड, लाइव इवेंट कतार व्यवहार और Claude-शैली की चैनल एवं अनुमति सूचनाओं को सत्यापित करता है। आउटबाउंड प्रेषण रूटिंग (`messages_send` द्वारा संग्रहित वार्तालाप रूट का पुनः उपयोग) को `src/mcp/channel-server.test.ts` में यूनिट परीक्षणों द्वारा अलग से कवर किया गया है।

परीक्षण रन में वास्तविक Telegram, Discord या iMessage खाते को जोड़े बिना ब्रिज के काम करने को प्रमाणित करने का यह सबसे तेज़ तरीका है।

व्यापक परीक्षण संदर्भ के लिए, [परीक्षण](/hi/help/testing) देखें।

### समस्या निवारण

<AccordionGroup>
  <Accordion title="कोई वार्तालाप नहीं मिला">
    सामान्यतः इसका अर्थ है कि Gateway सत्र पहले से रूट करने योग्य नहीं है। पुष्टि करें कि अंतर्निहित सत्र में संग्रहित चैनल/प्रदाता, प्राप्तकर्ता और वैकल्पिक खाता/थ्रेड रूट मेटाडेटा मौजूद है।
  </Accordion>
  <Accordion title="events_poll या events_wait से पुराने संदेश छूट जाते हैं">
    यह अपेक्षित है। ब्रिज के कनेक्ट होने पर लाइव कतार शुरू होती है। पुराना ट्रांसक्रिप्ट इतिहास `messages_read` से पढ़ें।
  </Accordion>
  <Accordion title="Claude सूचनाएँ दिखाई नहीं देतीं">
    इन सभी की जाँच करें:

    - क्लाइंट ने stdio MCP सत्र खुला रखा
    - `--claude-channel-mode`, `on` या `auto` है
    - क्लाइंट वास्तव में Claude-विशिष्ट सूचना विधियों को समझता है
    - इनबाउंड संदेश ब्रिज के कनेक्ट होने के बाद आया

  </Accordion>
  <Accordion title="अनुमोदन अनुपस्थित हैं">
    `permissions_list_open` केवल ब्रिज के कनेक्ट रहने के दौरान देखे गए अनुमोदन अनुरोध दिखाता है। यह स्थायी अनुमोदन इतिहास API नहीं है।
  </Accordion>
</AccordionGroup>

## MCP क्लाइंट रजिस्ट्री के रूप में OpenClaw

यह `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` और `unset` पथ है।

ये कमांड MCP पर OpenClaw को उपलब्ध नहीं कराते। ये OpenClaw कॉन्फ़िगरेशन में `mcp.servers` के अंतर्गत OpenClaw द्वारा प्रबंधित MCP सर्वर परिभाषाओं को प्रबंधित करते हैं। ये `config/mcporter.json` से mcporter सर्वर नहीं पढ़ते।

वे सहेजी गई परिभाषाएँ उन रनटाइम के लिए हैं जिन्हें OpenClaw बाद में लॉन्च या कॉन्फ़िगर करता है, जैसे एम्बेडेड OpenClaw और अन्य रनटाइम अडैप्टर। OpenClaw परिभाषाओं को केंद्रीय रूप से संग्रहीत करता है ताकि उन रनटाइम को अपनी अलग डुप्लिकेट MCP सर्वर सूचियाँ न रखनी पड़ें।

<AccordionGroup>
  <Accordion title="महत्वपूर्ण व्यवहार">
    - ये कमांड केवल OpenClaw कॉन्फ़िगरेशन पढ़ते या लिखते हैं
    - `status`, `list`, `show`, `doctor`, यदि `--probe`, `set`, `configure`, `tools`, `logout`, `reload` और `unset` के बिना उपयोग किए जाएँ, तो लक्ष्य MCP सर्वर से कनेक्ट नहीं होते
    - `login` कॉन्फ़िगर किए गए HTTP सर्वर के लिए MCP OAuth नेटवर्क प्रवाह चलाता है और प्राप्त स्थानीय क्रेडेंशियल सहेजता है
    - `status --verbose` कनेक्ट किए बिना समाधान किया गया ट्रांसपोर्ट, प्रमाणीकरण, टाइमआउट, फ़िल्टर और समानांतर टूल-कॉल संकेत प्रिंट करता है
    - `doctor` सहेजी गई परिभाषाओं में स्थानीय सेटअप समस्याओं की जाँच करता है, जैसे अनुपस्थित stdio कमांड, अमान्य कार्यशील डायरेक्टरी, अनुपस्थित TLS फ़ाइलें, अक्षम सर्वर, शाब्दिक संवेदनशील हेडर/env मान और अधूरा OAuth प्राधिकरण
    - `doctor --probe` स्थिर जाँच सफल होने के बाद `probe` जैसा ही लाइव कनेक्शन प्रमाण जोड़ता है
    - `probe` चयनित सर्वर या सभी कॉन्फ़िगर किए गए सर्वरों से कनेक्ट होता है, टूल सूचीबद्ध करता है और क्षमताओं/निदान की रिपोर्ट देता है
    - `add` फ़्लैग से परिभाषा बनाता है और सहेजने से पहले उसकी जाँच करता है, जब तक कि `--no-probe` सेट न हो या पहले OAuth प्राधिकरण आवश्यक न हो
    - रनटाइम अडैप्टर निष्पादन के समय तय करते हैं कि वे वास्तव में किन ट्रांसपोर्ट संरचनाओं का समर्थन करते हैं
    - `enabled: false` सर्वर को सहेजा रखता है, लेकिन उसे एम्बेडेड रनटाइम खोज से बाहर रखता है
    - `requestTimeoutMs` और `connectionTimeoutMs` प्रत्येक सर्वर के अनुरोध और कनेक्शन टाइमआउट मिलीसेकंड में सेट करते हैं
    - `supportsParallelToolCalls: true` उन सर्वरों को चिह्नित करता है जिन्हें अडैप्टर समवर्ती रूप से कॉल कर सकते हैं
    - HTTP सर्वर स्थिर हेडर, OAuth लॉगिन, TLS सत्यापन नियंत्रण और mTLS प्रमाणपत्र/कुंजी पथों का उपयोग कर सकते हैं
    - एम्बेडेड OpenClaw कॉन्फ़िगर किए गए MCP टूल को सामान्य `coding` और `messaging` टूल प्रोफ़ाइल में उपलब्ध कराता है; `minimal` अब भी उन्हें छिपाता है और `tools.deny: ["bundle-mcp"]` उन्हें स्पष्ट रूप से अक्षम करता है
    - प्रत्येक सर्वर के `toolFilter.include` और `toolFilter.exclude`, खोजे गए MCP टूल के OpenClaw टूल बनने से पहले उन्हें फ़िल्टर करते हैं
    - संसाधनों या प्रॉम्प्ट का विज्ञापन करने वाले सर्वर संसाधनों को सूचीबद्ध/पढ़ने और प्रॉम्प्ट को सूचीबद्ध/प्राप्त करने के लिए उपयोगिता टूल भी उपलब्ध कराते हैं; जनरेट किए गए उन उपयोगिता नामों (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) पर भी वही शामिल/बहिष्कृत फ़िल्टर लागू होता है
    - गतिशील MCP टूल-सूची परिवर्तन उस सत्र के कैश किए गए कैटलॉग को अमान्य कर देते हैं; अगली खोज/उपयोग पर सर्वर से सूची रीफ़्रेश होती है
    - बार-बार होने वाली MCP टूल अनुरोध/प्रोटोकॉल विफलताएँ उस सर्वर को थोड़ी देर के लिए रोक देती हैं, ताकि एक खराब सर्वर पूरा टर्न खर्च न कर दे
    - सत्र-स्कोप वाले बंडल MCP रनटाइम 10 मिनट निष्क्रिय रहने के बाद हटा दिए जाते हैं और एकबारगी एम्बेडेड रन पूरा होने पर उन्हें साफ़ कर देता है

  </Accordion>
</AccordionGroup>

रनटाइम अडैप्टर इस साझा रजिस्ट्री को अपने डाउनस्ट्रीम क्लाइंट द्वारा अपेक्षित संरचना में सामान्यीकृत कर सकते हैं। उदाहरण के लिए, एम्बेडेड OpenClaw सीधे OpenClaw `transport` मानों का उपयोग करता है, जबकि Claude Code और Gemini को CLI-मूल `type` मान मिलते हैं, जैसे `http`, `sse` या `stdio`।

Codex ऐप-सर्वर प्रत्येक सर्वर पर वैकल्पिक `codex` ब्लॉक का भी पालन करता है। यह केवल Codex ऐप-सर्वर थ्रेड के लिए
OpenClaw प्रोजेक्शन मेटाडेटा है; यह ACP सत्र, सामान्य Codex हार्नेस कॉन्फ़िगरेशन या अन्य रनटाइम अडैप्टर को
नहीं बदलता।
सर्वर को केवल विशिष्ट OpenClaw
एजेंट आईडी में प्रोजेक्ट करने के लिए गैर-रिक्त `codex.agents` का उपयोग करें। रिक्त, खाली या अमान्य एजेंट सूचियाँ कॉन्फ़िगरेशन
सत्यापन द्वारा अस्वीकार कर दी जाती हैं और वैश्विक बनने के बजाय रनटाइम प्रोजेक्शन पथ से
हटा दी जाती हैं। किसी विश्वसनीय सर्वर के लिए Codex का मूल `default_tools_approval_mode` उत्सर्जित करने हेतु `codex.defaultToolsApprovalMode` (`auto`, `prompt` या `approve`)
का उपयोग करें।
OpenClaw, Codex को मूल `mcp_servers`
कॉन्फ़िगरेशन सौंपने से पहले `codex` मेटाडेटा हटा देता है।

### सहेजी गई MCP सर्वर परिभाषाएँ

कमांड:

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

टिप्पणियाँ:

- `list` सर्वर नामों को क्रमबद्ध करता है।
- नाम के बिना `show` पूरा कॉन्फ़िगर किया गया MCP सर्वर ऑब्जेक्ट प्रिंट करता है।
- `status` कनेक्ट किए बिना कॉन्फ़िगर किए गए ट्रांसपोर्ट को वर्गीकृत करता है। `--verbose` में समाधान किए गए लॉन्च, टाइमआउट, OAuth, फ़िल्टर और समानांतर कॉल विवरण शामिल होते हैं, जिसमें यह जानकारी भी होती है कि संग्रहित OAuth टोकन को अतिरिक्त प्राधिकरण कब चाहिए। क्रेडेंशियल वाले stdio आर्ग्युमेंट टेक्स्ट और JSON आउटपुट में संपादित कर दिए जाते हैं।
- `doctor` कनेक्ट किए बिना स्थिर जाँच करता है। यदि कमांड को यह भी सत्यापित करना हो कि सक्षम सर्वर कनेक्ट होते हैं, तो `--probe` जोड़ें।
- `probe` कनेक्ट होता है और टूल की संख्या, संसाधन/प्रॉम्प्ट समर्थन, सूची-परिवर्तन समर्थन और निदान की रिपोर्ट देता है।
- `add`, `--command`, `--arg`, `--env` और `--cwd` जैसे stdio फ़्लैग, या `--url`, `--transport`, `--header`, `--auth oauth`, TLS, टाइमआउट और टूल-चयन फ़्लैग जैसे HTTP फ़्लैग स्वीकार करता है।
- `set` कमांड लाइन पर एक JSON ऑब्जेक्ट मान की अपेक्षा करता है।
- `configure` पूरी सर्वर परिभाषा को बदले बिना सक्षमता, टूल फ़िल्टर, टाइमआउट, OAuth, TLS और समानांतर टूल-कॉल संकेत अपडेट करता है। अपडेट किए गए सर्वर को सहेजने से पहले सत्यापित करने के लिए `--probe` जोड़ें।
- `tools` प्रत्येक सर्वर के टूल फ़िल्टर अपडेट करता है। शामिल/बहिष्कृत प्रविष्टियाँ MCP टूल नाम और सरल `*` ग्लॉब होती हैं।
- `login`, `auth: "oauth"` के साथ कॉन्फ़िगर किए गए HTTP सर्वर के लिए OAuth प्रवाह चलाता है। पहला रन एक प्राधिकरण URL प्रिंट करता है; अनुमोदन के बाद `--code` के साथ दोबारा चलाएँ।
- `logout` सहेजी गई सर्वर परिभाषा को हटाए बिना नामित सर्वर के संग्रहित OAuth क्रेडेंशियल साफ़ करता है।
- `reload` केवल वर्तमान CLI प्रक्रिया के कैश किए गए इन-प्रोसेस MCP रनटाइम को हटाता है। किसी दूसरी प्रक्रिया में मौजूद Gateway या एजेंट प्रक्रियाओं को अब भी अपने री-लोड या री-स्टार्ट पथ की आवश्यकता होती है।
- Streamable HTTP MCP सर्वर के लिए `transport: "streamable-http"` का उपयोग करें। संगतता के लिए `openclaw mcp set`, CLI-मूल `type: "http"` को भी उसी कैनोनिकल कॉन्फ़िगरेशन संरचना में सामान्यीकृत करता है।
- यदि नामित सर्वर मौजूद नहीं है, तो `unset` विफल हो जाता है।

उदाहरण:

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

### सामान्य सर्वर विधियाँ

ये उदाहरण केवल सर्वर परिभाषाएँ सहेजते हैं। यह प्रमाणित करने के लिए कि सर्वर शुरू होता है और टूल उपलब्ध कराता है, बाद में `openclaw mcp doctor --probe` चलाएँ।

<Tabs>
  <Tab title="फ़ाइल सिस्टम">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    फ़ाइल सिस्टम सर्वरों का दायरा उस न्यूनतम डायरेक्टरी ट्री तक सीमित रखें जिसे एजेंट को पढ़ना या संपादित करना चाहिए।

  </Tab>
  <Tab title="मेमोरी">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    यदि सर्वर ऐसे लेखन टूल उपलब्ध कराता है जो सामान्य एजेंटों को उपलब्ध नहीं होने चाहिए, तो टूल फ़िल्टर का उपयोग करें।

  </Tab>
  <Tab title="स्थानीय स्क्रिप्ट">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` जाँचता है कि `cwd` मौजूद है और कमांड कॉन्फ़िगर किए गए परिवेश से रिज़ॉल्व होती है।

  </Tab>
  <Tab title="दूरस्थ HTTP">
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

    जब दूरस्थ सर्वर इसका समर्थन करता हो, तो OAuth का उपयोग करें। यदि सर्वर को स्थिर हेडर की आवश्यकता हो, तो शाब्दिक बेयरर टोकन कमिट करने से बचें।

  </Tab>
  <Tab title="डेस्कटॉप/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    प्रत्यक्ष डेस्कटॉप-नियंत्रण सर्वर अपने द्वारा लॉन्च की गई प्रक्रिया की अनुमतियाँ प्राप्त करते हैं। सीमित टूल फ़िल्टर और OS-स्तरीय अनुमति संकेतों का उपयोग करें।

  </Tab>
</Tabs>

### JSON आउटपुट संरचनाएँ

स्क्रिप्ट और डैशबोर्ड के लिए `--json` का उपयोग करें। फ़ील्ड समूह समय के साथ बढ़ सकते हैं, इसलिए उपभोक्ताओं को अज्ञात कुंजियों को अनदेखा करना चाहिए।

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
            "requiresAuthorization": false,
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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth क्रेडेंशियल अधिकृत नहीं हैं; openclaw mcp login docs चलाएँ"
            }
          ]
        }
      ]
    }
    ```

    किसी भी सक्षम और जाँचे गए सर्वर में `error`-स्तरीय समस्या होने पर `doctor --json` गैर-शून्य मान के साथ बाहर निकलता है। `warning` और `info` समस्याएँ रिपोर्ट की जाती हैं, लेकिन वे स्वयं कमांड को विफल नहीं करतीं।

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` एक लाइव MCP क्लाइंट सत्र खोलता है और उसका परिणाम सीधे प्रिंट करता है; `status`/`doctor` के विपरीत, आउटपुट में शीर्ष-स्तरीय `path` फ़ील्ड नहीं होता। `resources` और `prompts` कुंजियाँ केवल तभी मौजूद होती हैं जब सर्वर वास्तव में उस क्षमता की घोषणा करता है (प्रॉम्प्ट के बिना कोई सर्वर `false` रिपोर्ट करने के बजाय `prompts` कुंजी छोड़ देता है)। पहुँच और क्षमता प्रमाण के लिए `probe` का उपयोग करें, स्थिर कॉन्फ़िगरेशन ऑडिट के लिए नहीं।

  </Accordion>
</AccordionGroup>

उदाहरण कॉन्फ़िगरेशन संरचना:

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
        "requestTimeoutMs": 20000,
        "connectionTimeoutMs": 5000,
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

स्थानीय चाइल्ड प्रक्रिया लॉन्च करता है और stdin/stdout पर संचार करता है।

| फ़ील्ड                      | विवरण                       |
| -------------------------- | --------------------------------- |
| `command`                  | लॉन्च की जाने वाली निष्पादन योग्य फ़ाइल (आवश्यक)    |
| `args`                     | कमांड-लाइन आर्ग्युमेंट की सरणी   |
| `env`                      | अतिरिक्त परिवेश वेरिएबल       |
| `cwd` / `workingDirectory` | प्रक्रिया की कार्यशील डायरेक्टरी |

<Warning>
**Stdio परिवेश सुरक्षा फ़िल्टर**

OpenClaw किसी stdio MCP सर्वर को लॉन्च करने से पहले इंटरप्रेटर-स्टार्टअप, लोडर-हाइजैक और शेल-इनिशियलाइज़ेशन परिवेश कुंजियों को अस्वीकार करता है, भले ही वे सर्वर के `env` ब्लॉक में मौजूद हों। यह अन्य OpenClaw द्वारा लॉन्च की गई प्रक्रियाओं वाली समान होस्ट परिवेश सुरक्षा नीति का उपयोग करता है: यह ज्ञात इंटरप्रेटर स्टार्टअप हुक (उदाहरण के लिए `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), साझा-लाइब्रेरी और फ़ंक्शन-इंजेक्शन उपसर्ग (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) और समान रनटाइम-नियंत्रण वेरिएबल को ब्लॉक करता है। स्टार्टअप इन्हें चुपचाप हटा देता है और चेतावनी लॉग करता है, ताकि वे कोई अंतर्निहित प्रील्यूड इंजेक्ट न कर सकें, इंटरप्रेटर न बदल सकें, डीबगर सक्षम न कर सकें या stdio प्रक्रिया के विरुद्ध डायनेमिक लिंकर को हाइजैक न कर सकें। एक स्पष्ट अनुमति-सूची सामान्य MCP क्रेडेंशियल परिवेश वेरिएबल को उपयोग योग्य रखती है (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), साथ ही सामान्य प्रॉक्सी और सर्वर-विशिष्ट परिवेश वेरिएबल (`HTTP_PROXY`, कस्टम `*_API_KEY`, आदि)। `AWS_CONFIG_FILE` और `AWS_SHARED_CREDENTIALS_FILE` जैसी अन्य `AWS_*` कुंजियाँ ब्लॉक रहती हैं, क्योंकि वे क्रेडेंशियल मान को सीधे रखने के बजाय क्रेडेंशियल फ़ाइलों की ओर संकेत करती हैं।

यदि आपके MCP सर्वर को वास्तव में ब्लॉक किए गए वेरिएबल में से किसी एक की आवश्यकता है, तो उसे stdio सर्वर के `env` के अंतर्गत रखने के बजाय Gateway होस्ट प्रक्रिया पर सेट करें।
</Warning>

### SSE / HTTP ट्रांसपोर्ट

HTTP Server-Sent Events पर दूरस्थ MCP सर्वर से कनेक्ट करता है।

| फ़ील्ड                       | विवरण                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `url`                       | दूरस्थ सर्वर का HTTP या HTTPS URL (आवश्यक)                |
| `headers`                   | HTTP हेडर का वैकल्पिक कुंजी-मान मैप (उदाहरण के लिए प्रमाणीकरण टोकन) |
| `connectionTimeoutMs`       | प्रति-सर्वर कनेक्शन टाइमआउट, ms में (वैकल्पिक)                   |
| `requestTimeoutMs`          | प्रति-सर्वर MCP अनुरोध टाइमआउट, मिलीसेकंड में                   |
| `auth: "oauth"`             | `openclaw mcp login` द्वारा सहेजे गए MCP OAuth क्रेडेंशियल का उपयोग करें          |
| `sslVerify`                 | केवल स्पष्ट रूप से विश्वसनीय निजी HTTPS एंडपॉइंट के लिए false सेट करें    |
| `clientCert` / `clientKey`  | mTLS क्लाइंट प्रमाणपत्र और कुंजी पथ                            |
| `supportsParallelToolCalls` | संकेत कि इस सर्वर के लिए समवर्ती कॉल सुरक्षित हैं              |

उदाहरण:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "requestTimeoutMs": 20000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` (उपयोगकर्ता जानकारी) और `headers` में संवेदनशील मान लॉग और स्थिति आउटपुट में छिपा दिए जाते हैं। जब संवेदनशील प्रतीत होने वाली `headers` या `env` प्रविष्टियों में शाब्दिक मान होते हैं, तो `openclaw mcp doctor` चेतावनी देता है, ताकि ऑपरेटर उन मानों को कमिट किए गए कॉन्फ़िगरेशन से बाहर ले जा सकें।

### OAuth कार्यप्रवाह

OAuth उन HTTP MCP सर्वरों के लिए है जो MCP OAuth प्रवाह की घोषणा करते हैं। `auth: "oauth"` सक्षम होने पर सर्वर के लिए स्थिर `Authorization` हेडर अनदेखे कर दिए जाते हैं। `openclaw mcp login` द्वारा सहेजे गए क्रेडेंशियल एम्बेडेड MCP, CLI रनर और स्थानीय Codex ऐप-सर्वर के साथ काम करते हैं।

मूल MCP OAuth सत्र `<state-dir>/state/openclaw.sqlite` (`mcp_oauth_stores`) पर केवल स्वामी के लिए उपलब्ध साझा SQLite डेटाबेस में रहते हैं। पंक्ति में ऐक्सेस और रीफ़्रेश टोकन, डायनेमिक क्लाइंट पंजीकरण सीक्रेट, डिस्कवरी मेटाडेटा और अस्थायी PKCE वेरिफ़ायर हो सकते हैं। रीफ़्रेश, लॉगिन और लॉगआउट समान SQLite लीज़ का उपयोग करते हैं, इसलिए समानांतर OpenClaw प्रक्रियाएँ एक रीफ़्रेश टोकन का उपयोग नहीं कर सकतीं या लॉग-आउट सत्र को पुनर्जीवित नहीं कर सकतीं।

हटाए जा चुके `<state-dir>/mcp-oauth/*.json` स्टोर से अपग्रेड केवल `openclaw doctor --fix` द्वारा सँभाले जाते हैं। रनटाइम कोड उन फ़ाइलों को कभी पढ़ता, लिखता या फ़ॉलबैक के रूप में उपयोग नहीं करता।

क्रेडेंशियल उपलब्ध होने तक, OpenClaw एजेंट टर्न को विफल करने के बजाय एजेंट रनटाइम से केवल उस MCP सर्वर को छोड़ देता है। इसके बाद ऑपरेटर, या शेल ऐक्सेस वाला एजेंट, `openclaw mcp login <name>` चला सकता है और बाद के टर्न में सर्वर का उपयोग कर सकता है।

यदि कोई सर्वर `insufficient_scope` के साथ टोकन अस्वीकार करता है, तो OpenClaw अनुरोधित स्कोप सुरक्षित रखता है और ऐसा रीफ़्रेश दोहराने के बजाय `openclaw mcp login <name>` माँगता है जो नया स्कोप प्रदान नहीं कर सकता। यह लॉगिन पिछले टोकन को तब तक बनाए रखते हुए नया प्राधिकरण अनुरोध शुरू करता है, जब तक प्रतिस्थापन क्रेडेंशियल सहेजे नहीं जाते।

जब कोई दूरस्थ MCP सेवा पहले से अलग OpenClaw रीफ़्रेश-सक्षम प्रमाणीकरण प्रोफ़ाइल द्वारा समर्थित हो, तो आप वैकल्पिक रूप से `oauth.authProfileId` सेट कर सकते हैं। OpenClaw रनटाइम प्रोजेक्शन से पहले किसी भी क्रेडेंशियल स्रोत को रीफ़्रेश करता है और डाउनस्ट्रीम MCP क्लाइंट को केवल वर्तमान ऐक्सेस टोकन भेजता है।

<Steps>
  <Step title="सर्वर सहेजें">
    `auth: "oauth"` और किसी भी वैकल्पिक OAuth मेटाडेटा के साथ सर्वर जोड़ें या अपडेट करें।

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    auth-profile-समर्थित bearer के लिए, प्रोफ़ाइल बाइंडिंग सहेजें:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="लॉगिन शुरू करें">
    प्राधिकरण अनुरोध बनाने के लिए लॉगिन चलाएँ।

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw प्राधिकरण URL प्रिंट करता है और अस्थायी OAuth verifier स्थिति को साझा SQLite में संग्रहीत करता है।

  </Step>
  <Step title="कोड के साथ पूरा करें">
    ब्राउज़र में स्वीकृति देने के बाद, लौटाया गया कोड वापस OpenClaw को दें।

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="प्राधिकरण जाँचें">
    यह पुष्टि करने के लिए status या doctor का उपयोग करें कि टोकन मौजूद हैं और अतिरिक्त प्राधिकरण की आवश्यकता नहीं है। यदि status `authorization-required` की रिपोर्ट करता है या doctor अतिरिक्त प्राधिकरण माँगता है, तो `openclaw mcp login <name>` फिर से चलाएँ।

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="क्रेडेंशियल हटाएँ">
    लॉगआउट संग्रहीत OAuth क्रेडेंशियल हटा देता है, लेकिन सहेजी गई सर्वर परिभाषा बनाए रखता है।

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

यदि प्रदाता टोकन रोटेट करता है या प्राधिकरण स्थिति अटक जाती है, तो `openclaw mcp logout <name>` चलाएँ, फिर `login` दोहराएँ। `logout` किसी सहेजे गए HTTP सर्वर के क्रेडेंशियल तब भी हटा सकता है जब `auth: "oauth"` को कॉन्फ़िगरेशन से हटा दिया गया हो, बशर्ते सर्वर का नाम और URL अभी भी क्रेडेंशियल स्टोर प्रविष्टि की पहचान करते हों।

### स्ट्रीम करने योग्य HTTP ट्रांसपोर्ट

`streamable-http`, `sse` और `stdio` के साथ एक अतिरिक्त ट्रांसपोर्ट विकल्प है। यह दूरस्थ MCP सर्वरों के साथ द्विदिश संचार के लिए HTTP स्ट्रीमिंग का उपयोग करता है।

| फ़ील्ड                       | विवरण                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | दूरस्थ सर्वर का HTTP या HTTPS URL (आवश्यक)                                      |
| `transport`                 | इस ट्रांसपोर्ट को चुनने के लिए `"streamable-http"` पर सेट करें; छोड़े जाने पर OpenClaw `sse` का उपयोग करता है |
| `headers`                   | HTTP हेडर का वैकल्पिक कुंजी-मान मैप (उदाहरण के लिए auth टोकन)                       |
| `connectionTimeoutMs`       | प्रति-सर्वर कनेक्शन टाइमआउट, ms में (वैकल्पिक)                                         |
| `requestTimeoutMs`          | प्रति-सर्वर MCP अनुरोध टाइमआउट, मिलीसेकंड में                                         |
| `auth: "oauth"`             | `openclaw mcp login` द्वारा सहेजे गए MCP OAuth क्रेडेंशियल का उपयोग करें                                |
| `sslVerify`                 | केवल स्पष्ट रूप से विश्वसनीय निजी HTTPS एंडपॉइंट के लिए false सेट करें                          |
| `clientCert` / `clientKey`  | mTLS क्लाइंट प्रमाणपत्र और कुंजी पथ                                                  |
| `supportsParallelToolCalls` | संकेत कि इस सर्वर के लिए समवर्ती कॉल सुरक्षित हैं                                    |

OpenClaw कॉन्फ़िगरेशन प्रामाणिक वर्तनी के रूप में `transport: "streamable-http"` का उपयोग करता है। CLI-मूल MCP `type: "http"` मान `openclaw mcp set` के माध्यम से सहेजे जाने पर स्वीकार किए जाते हैं और मौजूदा कॉन्फ़िगरेशन में `openclaw doctor --fix` द्वारा सुधारे जाते हैं, लेकिन एम्बेडेड OpenClaw सीधे `transport` का उपयोग करता है।

उदाहरण:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "requestTimeoutMs": 30000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
रजिस्ट्री कमांड चैनल ब्रिज शुरू नहीं करते हैं। लक्ष्य सर्वर तक पहुँचा जा सकता है, यह सिद्ध करने के लिए केवल `probe` और `doctor --probe` लाइव MCP क्लाइंट सत्र खोलते हैं।
</Note>

## कंट्रोल UI

ब्राउज़र कंट्रोल UI में `/settings/mcp` पर एक समर्पित MCP सेटिंग पेज शामिल है; पिछला `/mcp` पथ उपनाम बना रहता है। पेज कॉन्फ़िगर किए गए सर्वरों की संख्या, सक्षम/OAuth/फ़िल्टर सारांश, प्रति-सर्वर ट्रांसपोर्ट पंक्तियाँ, सक्षम/अक्षम नियंत्रण, सामान्य CLI कमांड और `mcp` कॉन्फ़िगरेशन अनुभाग के लिए एक सीमित संपादक दिखाता है।

ऑपरेटर संपादन और त्वरित सूची के लिए पेज का उपयोग करें। जब लाइव सर्वर प्रमाण की आवश्यकता हो, तब `openclaw mcp doctor --probe` या `openclaw mcp probe` का उपयोग करें।

ऑपरेटर कार्यप्रवाह:

1. कंट्रोल UI खोलें और **MCP** चुनें।
2. कुल, सक्षम, OAuth और फ़िल्टर किए गए सर्वरों के लिए सारांश कार्ड की समीक्षा करें।
3. ट्रांसपोर्ट, auth, फ़िल्टर, टाइमआउट और कमांड संकेतों के लिए प्रत्येक सर्वर पंक्ति का उपयोग करें।
4. जब किसी परिभाषा को बनाए रखना हो लेकिन उसे रनटाइम खोज से बाहर रखना हो, तब सक्षमता टॉगल करें।
5. नए सर्वर, हेडर, TLS, OAuth मेटाडेटा या टूल फ़िल्टर जैसे संरचनात्मक परिवर्तनों के लिए सीमित `mcp` कॉन्फ़िगरेशन अनुभाग संपादित करें।
6. केवल कॉन्फ़िगरेशन बनाए रखने के लिए **Save** चुनें, या Gateway कॉन्फ़िगरेशन पथ के माध्यम से लागू करने के लिए **Save & Publish** चुनें।
7. जब लाइव प्रमाण चाहिए कि संपादित सर्वर शुरू होता है और टूल सूचीबद्ध करता है, तब `openclaw mcp doctor --probe` चलाएँ।

टिप्पणियाँ:

- कमांड स्निपेट सर्वर नामों को उद्धरण चिह्नों में रखते हैं, ताकि असामान्य नाम भी शेल में कॉपी किए जा सकें
- एम्बेडेड क्रेडेंशियल होने पर प्रदर्शित URL-जैसे मानों को रेंडरिंग से पहले छिपा दिया जाता है
- पेज स्वयं MCP ट्रांसपोर्ट शुरू नहीं करता है
- MCP क्लाइंट किस प्रक्रिया के स्वामित्व में हैं, इसके आधार पर सक्रिय रनटाइम को `openclaw mcp reload`, Gateway कॉन्फ़िगरेशन प्रकाशन या प्रक्रिया पुनरारंभ की आवश्यकता हो सकती है

## MCP ऐप्स

OpenClaw स्थिर [MCP ऐप्स एक्सटेंशन](https://modelcontextprotocol.io/extensions/apps) लागू करने वाले टूल रेंडर कर सकता है। ऐप्स वैकल्पिक हैं, क्योंकि उनका HTML कॉन्फ़िगर किए गए MCP सर्वर से आता है और उसी सर्वर से ऐप-दृश्यमान टूल या संसाधनों का अनुरोध कर सकता है।

होस्ट ब्रिज सक्षम करें:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

इस सेटिंग को बदलने के बाद Gateway पुनरारंभ करें। सक्षम होने पर, OpenClaw Gateway पोर्ट से एक अधिक वाले पोर्ट पर केवल-सैंडबॉक्स HTTP(S) लिसनर शुरू करता है (डिफ़ॉल्ट Gateway के लिए, `18790`)। कंट्रोल UI उस अलग ओरिजिन से ऐप्स लोड करता है; लिसनर कभी भी कंट्रोल UI, प्रमाणीकृत Gateway रूट या उपयोगकर्ता डेटा प्रस्तुत नहीं करता है।

सीधे Gateway कनेक्शन के लिए दोनों पोर्ट तक पहुँच आवश्यक है। यदि कोई रिवर्स प्रॉक्सी या TLS टर्मिनेटर कंट्रोल UI को उजागर करता है, तो ऐप्स को एक समर्पित सार्वजनिक ओरिजिन दें और केवल उस ओरिजिन को सैंडबॉक्स लिसनर पर प्रॉक्सी करें:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

सैंडबॉक्स ओरिजिन कंट्रोल UI ओरिजिन से अलग होना चाहिए। उस पर अन्य प्रमाणीकृत या संवेदनशील सामग्री होस्ट न करें।

उदाहरण के लिए, आधिकारिक मूल React डेमो को इस प्रकार कॉन्फ़िगर किया जा सकता है:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

व्यवहार और सुरक्षा सीमाएँ:

- OpenClaw केवल ऐप्स सक्षम होने पर `io.modelcontextprotocol/ui` एक्सटेंशन का विज्ञापन करता है।
- केवल ठीक `text/html;profile=mcp-app` MIME प्रकार वाले `ui://` संसाधन रेंडर होते हैं।
- UI संसाधन 2 MiB तक सीमित हैं, एक समर्पित बाहरी ओरिजिन पर डबल-iframe प्रॉक्सी के पीछे रखे जाते हैं, एक अपारदर्शी आंतरिक ऐप ओरिजिन में लोड होते हैं और संसाधन मेटाडेटा से प्राप्त CSP द्वारा सीमित होते हैं।
- केवल-ऐप टूल (`_meta.ui.visibility: ["app"]`) मॉडल टूल सूचियों से बाहर रहते हैं। ऐप्स अपने स्वामी सर्वर पर केवल उन ऐप-दृश्यमान टूल को कॉल कर सकते हैं जो व्यू बनाने वाले रन के लिए प्रभावी OpenClaw टूल नीति को भी पार करते हैं।
- कैमरा, माइक्रोफ़ोन और जियोलोकेशन जैसी ओरिजिन-बद्ध ऐप अनुमतियाँ तब प्रदान नहीं की जातीं, जब आंतरिक ऐप दस्तावेज़ क्रॉस-ऐप पृथक्करण के लिए अपारदर्शी ओरिजिन का उपयोग करते हैं।
- ऐप HTML, संपूर्ण टूल तर्क और अपरिष्कृत परिणाम एक सीमित दस-मिनट की इन-मेमोरी व्यू लीज़ में रहते हैं और डिस्क पर नहीं लिखे जाते या ट्रांस्क्रिप्ट पूर्वावलोकन मेटाडेटा में कॉपी नहीं किए जाते। ट्रांस्क्रिप्ट केवल मूल टूल-कॉल ID से जुड़ा एक सीमित सर्वर/टूल/संसाधन वर्णनकर्ता संग्रहीत करता है। Gateway पुनरारंभ होने के बाद, कंट्रोल UI उस वर्णनकर्ता को प्रमाणीकृत सत्र ट्रांस्क्रिप्ट के विरुद्ध सत्यापित कर सकता है और `ui://` संसाधन फिर से प्राप्त कर सकता है; पुनर्निर्मित व्यू तब तक केवल-पढ़ने योग्य रहते हैं, जब तक कोई नया रन वर्तमान टूल अनुमतियाँ स्थापित नहीं करता।
- चैनल वार्तालापों में, किसी टर्न का नवीनतम सफल ऐप व्यू अंतिम सहायक उत्तर में एक **Open App**-शैली की क्रिया जोड़ता है। Telegram DM एक मूल Mini App बटन का उपयोग करते हैं; Slack और Discord उसी पोर्टेबल क्रिया को लिंक के रूप में रेंडर करते हैं। अन्य चैनल मूल उत्तर पाठ बनाए रखते हैं और एक समझने योग्य HTTPS लिंक जोड़ते हैं।
- चैनल लॉन्च लिंक केवल तब उपलब्ध होते हैं, जब Gateway Tailscale एक्सपोज़र ने एक प्रकाशित HTTPS ओरिजिन तैयार किया हो। `gateway.tailscale.mode: "serve"` तक केवल tailnet से पहुँचा जा सकता है; `"funnel"` तक सार्वजनिक इंटरनेट से पहुँचा जा सकता है। `gateway.tailscale.preserveFunnel` द्वारा संरक्षित बाहरी रूप से प्रबंधित Funnel को भी इंटरनेट-पहुँच योग्य माना जाता है। [Tailscale](/hi/gateway/tailscale) देखें।
- लॉन्च टिकट अपारदर्शी होते हैं, केवल अंतिम चैनल उत्तर बनाते समय जारी किए जाते हैं और अधिकतम दो मिनट बाद या अंतर्निहित व्यू लीज़ समाप्त होने पर—जो भी पहले हो—समाप्त हो जाते हैं। URL में Gateway bearer क्रेडेंशियल, सत्र कुंजियाँ, व्यू मेटाडेटा, ऐप HTML, टूल इनपुट या टूल परिणाम नहीं होते हैं।
- यदि कोई प्रकाशित ओरिजिन या टिकट क्षमता उपलब्ध नहीं है, व्यू या टिकट समाप्त हो गया है, या ट्रांसपोर्ट मूल नियंत्रण रेंडर नहीं कर सकता है, तो मूल सहायक पाठ उपलब्ध रहता है। कंट्रोल UI अपना मौजूदा इनलाइन ऐप कैनवास बनाए रखता है और उसे डुप्लिकेट लॉन्च क्रिया नहीं मिलती।
- `openclaw security audit` ब्रिज सक्षम होने पर चेतावनी देता है। आवश्यकता न होने पर इसे `openclaw config set mcp.apps.enabled false --strict-json` से अक्षम करें।

## वर्तमान सीमाएँ

यह पेज ब्रिज को आज उपलब्ध रूप में दस्तावेज़ित करता है।

वर्तमान सीमाएँ:

- वार्तालाप खोज मौजूदा Gateway सत्र रूट मेटाडेटा पर निर्भर करती है
- Claude-विशिष्ट अडैप्टर से परे कोई सामान्य पुश प्रोटोकॉल नहीं है
- अभी तक कोई संदेश संपादन या प्रतिक्रिया टूल नहीं हैं
- HTTP/SSE/streamable-http ट्रांसपोर्ट एकल दूरस्थ सर्वर से जुड़ता है; अभी तक कोई मल्टीप्लेक्स्ड अपस्ट्रीम नहीं है
- `permissions_list_open` में केवल ब्रिज के कनेक्ट रहने के दौरान देखी गई स्वीकृतियाँ शामिल होती हैं

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Plugins](/hi/cli/plugins)
