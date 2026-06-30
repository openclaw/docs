---
read_when:
    - Codex, Claude Code या किसी अन्य MCP क्लाइंट को OpenClaw-समर्थित चैनलों से कनेक्ट करना
    - चल रहा है `openclaw mcp serve`
    - OpenClaw-सहेजी गई MCP सर्वर परिभाषाओं का प्रबंधन
sidebarTitle: MCP
summary: MCP पर OpenClaw चैनल वार्तालाप उपलब्ध कराएँ और सहेजी गई MCP सर्वर परिभाषाओं को प्रबंधित करें
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:17:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` के दो काम हैं:

- `openclaw mcp serve` के साथ OpenClaw को MCP सर्वर के रूप में चलाना
- `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload`, और `unset` के साथ OpenClaw-प्रबंधित आउटबाउंड MCP सर्वर परिभाषाओं का प्रबंधन करना

दूसरे शब्दों में:

- `serve` में OpenClaw MCP सर्वर के रूप में काम करता है
- दूसरे उपकमांड में OpenClaw उन MCP सर्वरों के लिए MCP क्लाइंट-साइड रजिस्ट्री के रूप में काम करता है जिन्हें उसके रनटाइम बाद में उपयोग कर सकते हैं

<Note>
  `list`, `show`, `set`, और `unset` केवल OpenClaw कॉन्फिग में OpenClaw-प्रबंधित `mcp.servers` प्रविष्टियाँ पढ़ते और लिखते हैं। वे `config/mcporter.json` से mcporter सर्वर शामिल नहीं करते; उस रजिस्ट्री के लिए `mcporter list` का उपयोग करें।
</Note>

जब OpenClaw को कोडिंग हार्नेस सत्र स्वयं होस्ट करना हो और उस रनटाइम को ACP के माध्यम से रूट करना हो, तो [`openclaw acp`](/hi/cli/acp) का उपयोग करें।

## सही MCP पथ चुनें

OpenClaw में कई MCP सतहें हैं। वह चुनें जो इस बात से मेल खाती हो कि एजेंट रनटाइम का स्वामी कौन है और टूल्स का स्वामी कौन है।

| लक्ष्य                                                                | उपयोग                                                                  | कारण                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| किसी बाहरी MCP क्लाइंट को OpenClaw चैनल बातचीत पढ़ने/भेजने दें | `openclaw mcp serve`                                                 | OpenClaw MCP सर्वर है और stdio पर Gateway-समर्थित बातचीत उजागर करता है।                                 |
| OpenClaw-प्रबंधित एजेंट रन के लिए तृतीय-पक्ष MCP सर्वर सहेजें        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw MCP क्लाइंट-साइड रजिस्ट्री है और बाद में उन सर्वरों को पात्र रनटाइम में प्रोजेक्ट करता है।               |
| एजेंट टर्न चलाए बिना सहेजे गए सर्वर की जाँच करें                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` और `doctor` कॉन्फिग का निरीक्षण करते हैं; `probe` लाइव MCP कनेक्शन खोलता है और क्षमताएँ सूचीबद्ध करता है।               |
| ब्राउज़र से MCP कॉन्फिग संपादित करें                                      | Control UI `/mcp`                                                    | पेज इन्वेंटरी, सक्षम स्थिति, OAuth/फ़िल्टर सारांश, कमांड संकेत, और स्कोप वाला `mcp` संपादक दिखाता है।         |
| Codex app-server को स्कोप वाला नेटिव MCP सर्वर दें                    | `mcp.servers.<name>.codex`                                           | `codex` ब्लॉक केवल Codex app-server थ्रेड प्रोजेक्शन को प्रभावित करता है और नेटिव कॉन्फिग हैंडऑफ से पहले हटा दिया जाता है। |
| ACP-होस्टेड हार्नेस सत्र चलाएँ                                     | [`openclaw acp`](/hi/cli/acp) और [ACP एजेंट](/hi/tools/acp-agents-setup) | ACP ब्रिज मोड प्रति-सत्र MCP सर्वर इंजेक्शन स्वीकार नहीं करता; इसके बजाय gateway/plugin ब्रिज कॉन्फिगर करें।     |

<Tip>
यदि आप सुनिश्चित नहीं हैं कि आपको कौन सा पथ चाहिए, तो `openclaw mcp status --verbose` से शुरू करें। यह कोई MCP सर्वर शुरू किए बिना दिखाता है कि OpenClaw ने क्या सहेजा है।
</Tip>

## MCP सर्वर के रूप में OpenClaw

यह `openclaw mcp serve` पथ है।

### `serve` कब उपयोग करें

`openclaw mcp serve` का उपयोग तब करें जब:

- Codex, Claude Code, या किसी अन्य MCP क्लाइंट को OpenClaw-समर्थित चैनल बातचीत से सीधे बात करनी हो
- आपके पास पहले से रूट किए गए सत्रों वाला स्थानीय या रिमोट OpenClaw Gateway हो
- आप अलग-अलग प्रति-चैनल ब्रिज चलाने के बजाय एक ऐसा MCP सर्वर चाहते हों जो OpenClaw के चैनल बैकएंड में काम करे

जब OpenClaw को कोडिंग रनटाइम स्वयं होस्ट करना हो और एजेंट सत्र को OpenClaw के अंदर रखना हो, तो इसके बजाय [`openclaw acp`](/hi/cli/acp) का उपयोग करें।

### यह कैसे काम करता है

`openclaw mcp serve` stdio MCP सर्वर शुरू करता है। MCP क्लाइंट उस प्रक्रिया का स्वामी होता है। जब तक क्लाइंट stdio सत्र खुला रखता है, ब्रिज WebSocket पर स्थानीय या रिमोट OpenClaw Gateway से जुड़ता है और MCP पर रूट की गई चैनल बातचीत उजागर करता है।

<Steps>
  <Step title="Client spawns the bridge">
    MCP क्लाइंट `openclaw mcp serve` शुरू करता है।
  </Step>
  <Step title="Bridge connects to Gateway">
    ब्रिज WebSocket पर OpenClaw Gateway से जुड़ता है।
  </Step>
  <Step title="Sessions become MCP conversations">
    रूट किए गए सत्र MCP बातचीत और ट्रांसक्रिप्ट/इतिहास टूल बन जाते हैं।
  </Step>
  <Step title="Live events queue">
    ब्रिज जुड़े रहने के दौरान लाइव इवेंट मेमरी में कतारबद्ध किए जाते हैं।
  </Step>
  <Step title="Optional Claude push">
    यदि Claude चैनल मोड सक्षम है, तो वही सत्र Claude-विशिष्ट पुश सूचनाएँ भी प्राप्त कर सकता है।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - लाइव कतार स्थिति तब शुरू होती है जब ब्रिज जुड़ता है
    - पुराना ट्रांसक्रिप्ट इतिहास `messages_read` से पढ़ा जाता है
    - Claude पुश सूचनाएँ केवल MCP सत्र जीवित रहने तक मौजूद रहती हैं
    - जब क्लाइंट डिस्कनेक्ट होता है, ब्रिज बंद हो जाता है और लाइव कतार हट जाती है
    - `openclaw agent` और `openclaw infer model run` जैसे one-shot एजेंट एंट्री पॉइंट जवाब पूरा होने पर अपने द्वारा खोले गए किसी भी बंडल MCP रनटाइम को समाप्त कर देते हैं, इसलिए दोहराए गए स्क्रिप्टेड रन stdio MCP चाइल्ड प्रक्रियाएँ जमा नहीं करते
    - OpenClaw द्वारा शुरू किए गए stdio MCP सर्वर (बंडल या उपयोगकर्ता-कॉन्फिगर किए गए) शटडाउन पर प्रक्रिया ट्री के रूप में बंद कर दिए जाते हैं, इसलिए सर्वर द्वारा शुरू की गई चाइल्ड subprocesses पैरेंट stdio क्लाइंट के बाहर निकलने के बाद जीवित नहीं रहतीं
    - किसी सत्र को हटाने या रीसेट करने पर वह सत्र के MCP क्लाइंट को साझा रनटाइम cleanup पथ के माध्यम से dispose करता है, इसलिए हटाए गए सत्र से जुड़ी कोई लंबित stdio कनेक्शन नहीं रहती

  </Accordion>
</AccordionGroup>

### क्लाइंट मोड चुनें

एक ही ब्रिज को दो अलग-अलग तरीकों से उपयोग करें:

<Tabs>
  <Tab title="Generic MCP clients">
    केवल मानक MCP टूल। `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send`, और अनुमोदन टूल्स का उपयोग करें।
  </Tab>
  <Tab title="Claude Code">
    मानक MCP टूल और Claude-विशिष्ट चैनल adapter। `--claude-channel-mode on` सक्षम करें या डिफ़ॉल्ट `auto` छोड़ दें।
  </Tab>
</Tabs>

<Note>
आज, `auto` का व्यवहार `on` जैसा ही है। अभी क्लाइंट क्षमता पहचान नहीं है।
</Note>

### `serve` क्या उजागर करता है

ब्रिज चैनल-समर्थित बातचीत उजागर करने के लिए मौजूदा Gateway सत्र route metadata का उपयोग करता है। बातचीत तब दिखाई देती है जब OpenClaw के पास पहले से किसी ज्ञात route के साथ सत्र स्थिति हो, जैसे:

- `channel`
- प्राप्तकर्ता या गंतव्य metadata
- वैकल्पिक `accountId`
- वैकल्पिक `threadId`

इससे MCP क्लाइंट को एक जगह मिलती है जहाँ वे:

- हाल की रूट की गई बातचीत सूचीबद्ध कर सकते हैं
- हाल का ट्रांसक्रिप्ट इतिहास पढ़ सकते हैं
- नए इनबाउंड इवेंट की प्रतीक्षा कर सकते हैं
- उसी route से जवाब वापस भेज सकते हैं
- ब्रिज जुड़े रहने के दौरान आने वाले अनुमोदन अनुरोध देख सकते हैं

### उपयोग

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ब्रिज टूल्स

वर्तमान ब्रिज ये MCP टूल उजागर करता है:

<AccordionGroup>
  <Accordion title="conversations_list">
    हाल की सत्र-समर्थित बातचीत सूचीबद्ध करता है जिनमें Gateway सत्र स्थिति में पहले से route metadata है।

    उपयोगी फ़िल्टर:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    प्रत्यक्ष Gateway सत्र lookup का उपयोग करके `session_key` से एक बातचीत लौटाता है।
  </Accordion>
  <Accordion title="messages_read">
    एक सत्र-समर्थित बातचीत के लिए हाल के ट्रांसक्रिप्ट संदेश पढ़ता है।
  </Accordion>
  <Accordion title="attachments_fetch">
    एक ट्रांसक्रिप्ट संदेश से गैर-पाठ संदेश सामग्री ब्लॉक निकालता है। यह ट्रांसक्रिप्ट सामग्री पर metadata दृश्य है, कोई स्वतंत्र टिकाऊ attachment blob store नहीं।
  </Accordion>
  <Accordion title="events_poll">
    संख्यात्मक cursor के बाद से कतारबद्ध लाइव इवेंट पढ़ता है।
  </Accordion>
  <Accordion title="events_wait">
    अगले मेल खाते कतारबद्ध इवेंट के आने या timeout समाप्त होने तक long-poll करता है।

    इसका उपयोग तब करें जब किसी generic MCP क्लाइंट को Claude-विशिष्ट पुश protocol के बिना लगभग real-time डिलीवरी चाहिए।

  </Accordion>
  <Accordion title="messages_send">
    सत्र पर पहले से रिकॉर्ड किए गए उसी route से पाठ वापस भेजता है।

    वर्तमान व्यवहार:

    - मौजूदा बातचीत route आवश्यक है
    - सत्र के चैनल, प्राप्तकर्ता, account id, और thread id का उपयोग करता है
    - केवल पाठ भेजता है

  </Accordion>
  <Accordion title="permissions_list_open">
    ब्रिज के Gateway से जुड़ने के बाद से देखे गए लंबित exec/plugin अनुमोदन अनुरोध सूचीबद्ध करता है।
  </Accordion>
  <Accordion title="permissions_respond">
    एक लंबित exec/plugin अनुमोदन अनुरोध को इनसे हल करता है:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### इवेंट मॉडल

ब्रिज जुड़े रहने के दौरान in-memory इवेंट कतार रखता है।

वर्तमान इवेंट प्रकार:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- कतार केवल लाइव है; यह MCP ब्रिज शुरू होने पर शुरू होती है
- `events_poll` और `events_wait` अपने-आप पुराना Gateway इतिहास replay नहीं करते
- टिकाऊ backlog `messages_read` से पढ़ना चाहिए

</Warning>

### Claude चैनल सूचनाएँ

ब्रिज Claude-विशिष्ट चैनल सूचनाएँ भी उजागर कर सकता है। यह Claude Code चैनल adapter का OpenClaw समकक्ष है: मानक MCP टूल उपलब्ध रहते हैं, लेकिन लाइव इनबाउंड संदेश Claude-विशिष्ट MCP सूचनाओं के रूप में भी आ सकते हैं।

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: केवल मानक MCP टूल।
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude चैनल सूचनाएँ सक्षम करें।
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: वर्तमान डिफ़ॉल्ट; `on` जैसा ही ब्रिज व्यवहार।
  </Tab>
</Tabs>

जब Claude चैनल मोड सक्षम होता है, सर्वर Claude experimental capabilities घोषित करता है और ये emit कर सकता है:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

वर्तमान ब्रिज व्यवहार:

- इनबाउंड `user` ट्रांसक्रिप्ट संदेश `notifications/claude/channel` के रूप में forward किए जाते हैं
- MCP पर प्राप्त Claude अनुमति अनुरोध in-memory tracked रहते हैं
- यदि linked बातचीत में command owner बाद में `yes abcde` या `no abcde` भेजता है, तो ब्रिज उसे `notifications/claude/channel/permission` में बदल देता है
- ये सूचनाएँ केवल live-session हैं; यदि MCP क्लाइंट डिस्कनेक्ट हो जाता है, तो कोई push target नहीं रहता

यह जानबूझकर client-specific है। Generic MCP क्लाइंट को मानक polling tools पर निर्भर रहना चाहिए।

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

अधिकांश generic MCP क्लाइंट के लिए, मानक tool surface से शुरू करें और Claude mode को अनदेखा करें। Claude mode केवल उन क्लाइंट के लिए चालू करें जो वास्तव में Claude-विशिष्ट notification methods समझते हैं।

### विकल्प

`openclaw mcp serve` समर्थन करता है:

<ParamField path="--url" type="string">
  Gateway WebSocket URL.
</ParamField>
<ParamField path="--token" type="string">
  Gateway टोकन.
</ParamField>
<ParamField path="--token-file" type="string">
  फ़ाइल से टोकन पढ़ें.
</ParamField>
<ParamField path="--password" type="string">
  Gateway पासवर्ड.
</ParamField>
<ParamField path="--password-file" type="string">
  फ़ाइल से पासवर्ड पढ़ें.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude सूचना मोड.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr पर विस्तृत लॉग.
</ParamField>

<Tip>
संभव हो तो इनलाइन सीक्रेट्स की जगह `--token-file` या `--password-file` को प्राथमिकता दें.
</Tip>

### सुरक्षा और विश्वास सीमा

ब्रिज रूटिंग नहीं गढ़ता. यह केवल वे बातचीत उजागर करता है जिन्हें Gateway पहले से रूट करना जानता है.

इसका अर्थ है:

- प्रेषक अनुमत-सूचियां, पेयरिंग, और चैनल-स्तरीय विश्वास अब भी अंतर्निहित OpenClaw चैनल कॉन्फ़िगरेशन से संबंधित हैं
- `messages_send` केवल किसी मौजूदा संग्रहित रूट के माध्यम से उत्तर दे सकता है
- अनुमोदन स्थिति केवल मौजूदा ब्रिज सत्र के लिए लाइव/इन-मेमोरी होती है
- ब्रिज auth को वही Gateway टोकन या पासवर्ड नियंत्रण इस्तेमाल करने चाहिए जिन पर आप किसी भी अन्य दूरस्थ Gateway क्लाइंट के लिए भरोसा करेंगे

अगर कोई बातचीत `conversations_list` से गायब है, तो सामान्य कारण MCP कॉन्फ़िगरेशन नहीं होता. यह अंतर्निहित Gateway सत्र में गायब या अधूरा रूट मेटाडेटा होता है.

### परीक्षण

OpenClaw इस ब्रिज के लिए एक निर्धारक Docker smoke भेजता है:

```bash
pnpm test:docker:mcp-channels
```

वह smoke:

- एक seeded Gateway कंटेनर शुरू करता है
- दूसरा कंटेनर शुरू करता है जो `openclaw mcp serve` चलाता है
- बातचीत खोज, transcript reads, attachment metadata reads, live event queue व्यवहार, और outbound send routing सत्यापित करता है
- वास्तविक stdio MCP ब्रिज पर Claude-शैली चैनल और अनुमति सूचनाओं को मान्य करता है

यह किसी वास्तविक Telegram, Discord, या iMessage खाते को टेस्ट रन में जोड़े बिना ब्रिज के काम करने को सिद्ध करने का सबसे तेज़ तरीका है.

व्यापक परीक्षण संदर्भ के लिए, [परीक्षण](/hi/help/testing) देखें.

### समस्या निवारण

<AccordionGroup>
  <Accordion title="कोई बातचीत वापस नहीं आई">
    आमतौर पर इसका अर्थ है कि Gateway सत्र पहले से routable नहीं है. पुष्टि करें कि अंतर्निहित सत्र में संग्रहित चैनल/provider, प्राप्तकर्ता, और वैकल्पिक account/thread route metadata मौजूद है.
  </Accordion>
  <Accordion title="events_poll या events_wait पुराने संदेश छोड़ देता है">
    अपेक्षित है. लाइव queue ब्रिज के कनेक्ट होने पर शुरू होती है. पुराने transcript इतिहास को `messages_read` से पढ़ें.
  </Accordion>
  <Accordion title="Claude सूचनाएं दिखाई नहीं देतीं">
    इन सभी की जांच करें:

    - क्लाइंट ने stdio MCP सत्र खुला रखा
    - `--claude-channel-mode` `on` या `auto` है
    - क्लाइंट वास्तव में Claude-विशिष्ट सूचना methods को समझता है
    - inbound संदेश ब्रिज कनेक्ट होने के बाद आया

  </Accordion>
  <Accordion title="अनुमोदन गायब हैं">
    `permissions_list_open` केवल वे अनुमोदन अनुरोध दिखाता है जो ब्रिज के कनेक्ट रहने के दौरान देखे गए. यह टिकाऊ अनुमोदन इतिहास API नहीं है.
  </Accordion>
</AccordionGroup>

## MCP क्लाइंट registry के रूप में OpenClaw

यह `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload`, और `unset` path है.

ये commands OpenClaw को MCP पर expose नहीं करते. ये OpenClaw config में `mcp.servers` के अंतर्गत OpenClaw-प्रबंधित MCP server definitions को manage करते हैं. ये `config/mcporter.json` से mcporter servers नहीं पढ़ते.

वे saved definitions उन runtimes के लिए हैं जिन्हें OpenClaw बाद में launch या configure करता है, जैसे embedded OpenClaw और अन्य runtime adapters. OpenClaw definitions को centrally store करता है ताकि उन runtimes को अपनी duplicate MCP server lists रखने की जरूरत न हो.

<AccordionGroup>
  <Accordion title="महत्वपूर्ण व्यवहार">
    - ये commands केवल OpenClaw config पढ़ते या लिखते हैं
    - `status`, `list`, `show`, `doctor` बिना `--probe`, `set`, `configure`, `tools`, `logout`, `reload`, और `unset` target MCP server से connect नहीं करते
    - `login` configured HTTP server के लिए MCP OAuth network flow करता है और resulting local credentials save करता है
    - `status --verbose` connect किए बिना resolved transport, auth, timeout, filter, और parallel-tool-call hints print करता है
    - `doctor` saved definitions को local setup problems के लिए check करता है, जैसे missing stdio commands, invalid working directories, missing TLS files, disabled servers, literal sensitive header/env values, और incomplete OAuth authorization
    - `doctor --probe` static checks pass होने के बाद `probe` जैसा live connection proof जोड़ता है
    - `probe` selected server या सभी configured servers से connect करता है, tools list करता है, और capabilities/diagnostics report करता है
    - `add` flags से definition बनाता है और save करने से पहले probes करता है, जब तक `--no-probe` set न हो या पहले OAuth authorization की जरूरत न हो
    - runtime adapters तय करते हैं कि execution time पर वे वास्तव में कौन से transport shapes support करते हैं
    - `enabled: false` server को saved रखता है लेकिन उसे embedded runtime discovery से exclude करता है
    - `timeout` और `connectTimeout` per-server request और connection timeouts seconds में set करते हैं
    - `supportsParallelToolCalls: true` उन servers को mark करता है जिन्हें adapters concurrently call कर सकते हैं
    - HTTP servers static headers, OAuth login, TLS verification control, और mTLS certificate/key paths इस्तेमाल कर सकते हैं
    - embedded OpenClaw configured MCP tools को सामान्य `coding` और `messaging` tool profiles में expose करता है; `minimal` अब भी उन्हें छिपाता है, और `tools.deny: ["bundle-mcp"]` उन्हें स्पष्ट रूप से disable करता है
    - per-server `toolFilter.include` और `toolFilter.exclude` discovered MCP tools को OpenClaw tools बनने से पहले filter करते हैं
    - जो servers resources या prompts advertise करते हैं, वे resources list/read करने और prompts list/fetch करने के लिए utility tools भी expose करते हैं; वे generated utility names (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) वही include/exclude filter इस्तेमाल करते हैं
    - dynamic MCP tool-list changes उस session के लिए cached catalog को invalidate करते हैं; अगली discovery/use server से refresh करती है
    - repeated MCP tool request/protocol failures उस server को थोड़ी देर के लिए pause करते हैं ताकि एक broken server पूरा turn consume न करे
    - session-scoped bundled MCP runtimes को `mcp.sessionIdleTtlMs` milliseconds idle time के बाद reap किया जाता है (default 10 minutes; disable करने के लिए `0` set करें) और one-shot embedded runs run end पर उन्हें clean up करते हैं

  </Accordion>
</AccordionGroup>

Runtime adapters इस shared registry को उस shape में normalize कर सकते हैं जिसकी उनके downstream client को अपेक्षा है. उदाहरण के लिए, embedded OpenClaw OpenClaw `transport` values को सीधे consume करता है, जबकि Claude Code और Gemini को CLI-native `type` values मिलती हैं, जैसे `http`, `sse`, या `stdio`.

Codex app-server भी हर server पर optional `codex` block का सम्मान करता है. यह केवल Codex app-server threads के लिए
OpenClaw projection metadata है; यह ACP sessions, generic Codex harness config, या अन्य runtime adapters को
नहीं बदलता.
किसी server को केवल specific OpenClaw agent ids में project करने के लिए non-empty `codex.agents` इस्तेमाल करें.
Empty, blank, या invalid agent lists को config validation द्वारा reject किया जाता है और runtime projection path द्वारा global बनने के बजाय omit किया जाता है.
Trusted server के लिए Codex का native `default_tools_approval_mode` emit करने के लिए `codex.defaultToolsApprovalMode` (`auto`, `prompt`, या `approve`) इस्तेमाल करें.
OpenClaw native `mcp_servers` config Codex को सौंपने से पहले `codex` metadata हटा देता है.

### Saved MCP server definitions

OpenClaw उन surfaces के लिए config में एक lightweight MCP server registry भी store करता है जिन्हें OpenClaw-managed MCP definitions चाहिए.

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

- `list` server names को sort करता है.
- `show` बिना name के full configured MCP server object print करता है.
- `status` connect किए बिना configured transports को classify करता है. `--verbose` में resolved launch, timeout, OAuth, filter, और parallel-call details शामिल होते हैं.
- `doctor` connect किए बिना static checks करता है. जब command को enabled servers के connect होने को भी verify करना हो, तो `--probe` जोड़ें.
- `probe` connect करता है और tool counts, resources/prompts support, list-change support, और diagnostics report करता है.
- `add` stdio flags स्वीकार करता है जैसे `--command`, `--arg`, `--env`, और `--cwd`, या HTTP flags जैसे `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout, और tool-selection flags.
- `set` command line पर एक JSON object value की अपेक्षा करता है.
- `configure` पूरी server definition बदले बिना enablement, tool filters, timeouts, OAuth, TLS, और parallel-tool-call hints update करता है.
- `tools` per-server tool filters update करता है. Include/exclude entries MCP tool names और simple `*` globs होते हैं.
- `login` `auth: "oauth"` के साथ configured HTTP servers के लिए OAuth flow चलाता है. पहला run authorization URL print करता है; approval के बाद `--code` के साथ फिर चलाएं.
- `logout` saved server definition हटाए बिना named server के stored OAuth credentials clear करता है.
- `reload` cached in-process MCP runtimes dispose करता है. किसी अन्य process में Gateway या agent processes को अब भी अपने reload या restart path की जरूरत होती है.
- Streamable HTTP MCP servers के लिए `transport: "streamable-http"` इस्तेमाल करें. `openclaw mcp set` compatibility के लिए CLI-native `type: "http"` को भी उसी canonical config shape में normalize करता है.
- अगर named server मौजूद नहीं है तो `unset` fail होता है.

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

ये examples केवल server definitions save करते हैं. बाद में `openclaw mcp doctor --probe` चलाकर सिद्ध करें कि server start होता है और tools expose करता है.

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

    Filesystem servers को सबसे छोटे directory tree तक scope करें जिसे agent को पढ़ना या edit करना चाहिए.

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    अगर server ऐसे write tools expose करता है जो normal agents के लिए available नहीं होने चाहिए, तो tool filter इस्तेमाल करें.

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

    `doctor` जांचता है कि `cwd` मौजूद है और command configured environment से resolve होता है.

  </Tab>
  <Tab title="रिमोट HTTP">
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

    जब रिमोट सर्वर इसे समर्थित करता हो, तब OAuth का उपयोग करें। अगर सर्वर को स्थिर हेडर चाहिए, तो शाब्दिक bearer token कमिट करने से बचें।

  </Tab>
  <Tab title="डेस्कटॉप/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    सीधे डेस्कटॉप-नियंत्रण सर्वर उस प्रक्रिया की अनुमतियां विरासत में लेते हैं जिसे वे लॉन्च करते हैं। संकरे टूल फ़िल्टर और OS-स्तरीय अनुमति प्रॉम्प्ट का उपयोग करें।

  </Tab>
</Tabs>

### JSON आउटपुट आकार

स्क्रिप्ट और डैशबोर्ड के लिए `--json` का उपयोग करें। फ़ील्ड सेट समय के साथ बढ़ सकते हैं, इसलिए उपभोक्ताओं को अज्ञात कुंजियों को अनदेखा करना चाहिए।

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

    जब किसी भी सक्षम जांचे गए सर्वर में कोई त्रुटि हो, तो `doctor --json` गैर-शून्य निकास करता है। चेतावनियां रिपोर्ट की जाती हैं, लेकिन वे अपने-आप कमांड को विफल नहीं बनातीं।

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

    `probe` एक लाइव MCP क्लाइंट सत्र खोलता है। इसका उपयोग पहुंच-योग्यता और क्षमता प्रमाण के लिए करें, स्थिर कॉन्फ़िग ऑडिट के लिए नहीं।

  </Accordion>
</AccordionGroup>

उदाहरण कॉन्फ़िग आकार:

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

एक स्थानीय चाइल्ड प्रोसेस लॉन्च करता है और stdin/stdout पर संचार करता है।

| फ़ील्ड                      | विवरण                       |
| -------------------------- | --------------------------------- |
| `command`                  | स्पॉन करने के लिए executable (आवश्यक)    |
| `args`                     | कमांड-लाइन arguments की array   |
| `env`                      | अतिरिक्त environment variables       |
| `cwd` / `workingDirectory` | प्रक्रिया के लिए working directory |

<Warning>
**Stdio env सुरक्षा फ़िल्टर**

OpenClaw उन interpreter-startup env कुंजियों को अस्वीकार करता है जो पहले RPC से पहले किसी stdio MCP सर्वर के शुरू होने का तरीका बदल सकती हैं, भले ही वे सर्वर के `env` ब्लॉक में दिखाई दें। अवरुद्ध कुंजियों में `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`, और समान runtime-control variables शामिल हैं। Startup इन्हें कॉन्फ़िगरेशन त्रुटि के साथ अस्वीकार करता है ताकि वे implicit prelude इंजेक्ट न कर सकें, interpreter बदल न सकें, debugger सक्षम न कर सकें, या stdio प्रक्रिया के विरुद्ध runtime output को redirect न कर सकें। सामान्य credential, proxy, और server-specific env vars (`GITHUB_TOKEN`, `HTTP_PROXY`, custom `*_API_KEY`, आदि) अप्रभावित रहते हैं।

अगर आपके MCP सर्वर को सच में अवरुद्ध variables में से किसी एक की आवश्यकता है, तो इसे stdio सर्वर के `env` के अंतर्गत रखने के बजाय Gateway host process पर सेट करें।
</Warning>

### SSE / HTTP ट्रांसपोर्ट

HTTP Server-Sent Events पर रिमोट MCP सर्वर से कनेक्ट करता है।

| फ़ील्ड                          | विवरण                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | रिमोट सर्वर का HTTP या HTTPS URL (आवश्यक)                |
| `headers`                      | HTTP headers का वैकल्पिक key-value map (उदाहरण के लिए auth tokens) |
| `connectionTimeoutMs`          | प्रति-सर्वर connection timeout ms में (वैकल्पिक)                   |
| `connectTimeout`               | प्रति-सर्वर connection timeout सेकंड में (वैकल्पिक)              |
| `timeout` / `requestTimeoutMs` | प्रति-सर्वर MCP request timeout सेकंड या ms में                  |
| `auth: "oauth"`                | MCP OAuth token storage और `openclaw mcp login` का उपयोग करें             |
| `sslVerify`                    | केवल स्पष्ट रूप से विश्वसनीय private HTTPS endpoints के लिए false सेट करें    |
| `clientCert` / `clientKey`     | mTLS client certificate और key paths                            |
| `supportsParallelToolCalls`    | संकेत कि concurrent calls इस सर्वर के लिए सुरक्षित हैं              |

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

`url` (userinfo) और `headers` में संवेदनशील मान logs और status output में redact किए जाते हैं। जब sensitive-looking `headers` या `env` entries में शाब्दिक मान होते हैं, तो `openclaw mcp doctor` चेतावनी देता है, ताकि ऑपरेटर उन मानों को committed config से बाहर ले जा सकें।

### OAuth workflow

OAuth उन HTTP MCP सर्वरों के लिए है जो MCP OAuth flow का विज्ञापन करते हैं। जब किसी सर्वर के लिए `auth: "oauth"` सक्षम हो, तो स्थिर `Authorization` headers अनदेखे किए जाते हैं।

<Steps>
  <Step title="सर्वर सहेजें">
    सर्वर को `auth: "oauth"` और किसी भी वैकल्पिक OAuth metadata के साथ जोड़ें या अपडेट करें।

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="लॉगिन शुरू करें">
    authorization request बनाने के लिए login चलाएं।

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw authorization URL प्रिंट करता है और OpenClaw state directory के अंतर्गत अस्थायी OAuth verifier state संग्रहीत करता है।

  </Step>
  <Step title="कोड के साथ पूरा करें">
    ब्राउज़र में स्वीकृति देने के बाद, लौटाया गया code OpenClaw को वापस पास करें।

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="authorization जांचें">
    tokens मौजूद हैं इसकी पुष्टि करने के लिए status या doctor का उपयोग करें।

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="credentials साफ़ करें">
    Logout संग्रहीत OAuth credentials हटाता है लेकिन सहेजी गई server definition रखता है।

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

अगर provider tokens rotate करता है या authorization state अटक जाती है, तो `openclaw mcp logout <name>` चलाएं, फिर `login` दोहराएं। `logout` सहेजे गए HTTP सर्वर के लिए credentials साफ़ कर सकता है, भले ही `auth: "oauth"` कॉन्फ़िग से हटा दिया गया हो, बशर्ते server name और URL अभी भी credential store entry की पहचान करते हों।

### Streamable HTTP ट्रांसपोर्ट

`streamable-http` `sse` और `stdio` के साथ एक अतिरिक्त transport option है। यह रिमोट MCP सर्वरों के साथ द्विदिश संचार के लिए HTTP streaming का उपयोग करता है।

| फ़ील्ड                          | विवरण                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | रिमोट सर्वर का HTTP या HTTPS URL (आवश्यक)                                      |
| `transport`                    | इस transport को चुनने के लिए `"streamable-http"` पर सेट करें; छोड़े जाने पर, OpenClaw `sse` का उपयोग करता है |
| `headers`                      | HTTP headers का वैकल्पिक key-value map (उदाहरण के लिए auth tokens)                       |
| `connectionTimeoutMs`          | प्रति-सर्वर connection timeout ms में (वैकल्पिक)                                         |
| `connectTimeout`               | प्रति-सर्वर connection timeout सेकंड में (वैकल्पिक)                                    |
| `timeout` / `requestTimeoutMs` | प्रति-सर्वर MCP request timeout सेकंड या ms में                                        |
| `auth: "oauth"`                | MCP OAuth token storage और `openclaw mcp login` का उपयोग करें                                   |
| `sslVerify`                    | केवल स्पष्ट रूप से विश्वसनीय private HTTPS endpoints के लिए false सेट करें                          |
| `clientCert` / `clientKey`     | mTLS client certificate और key paths                                                  |
| `supportsParallelToolCalls`    | संकेत कि concurrent calls इस सर्वर के लिए सुरक्षित हैं                                    |

OpenClaw config canonical spelling के रूप में `transport: "streamable-http"` का उपयोग करता है। CLI-native MCP `type: "http"` मान `openclaw mcp set` के माध्यम से सहेजे जाने पर स्वीकार किए जाते हैं और मौजूदा config में `openclaw doctor --fix` द्वारा सुधारे जाते हैं, लेकिन embedded OpenClaw सीधे `transport` का उपभोग करता है।

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
Registry commands channel bridge शुरू नहीं करते। केवल `probe` और `doctor --probe` target server की पहुंच-योग्यता सिद्ध करने के लिए लाइव MCP client session खोलते हैं।
</Note>

## Control UI

ब्राउज़र Control UI में `/mcp` पर एक समर्पित MCP settings page शामिल है। यह configured server counts, enabled/OAuth/filter summaries, प्रति-सर्वर transport rows, enable/disable controls, सामान्य CLI commands, और `mcp` config section के लिए scoped editor दिखाता है।

operator edits और quick inventory के लिए page का उपयोग करें। जब आपको live server proof चाहिए, तो `openclaw mcp doctor --probe` या `openclaw mcp probe` का उपयोग करें।

Operator workflow:

1. Control UI खोलें और **MCP** चुनें.
2. कुल, सक्षम, OAuth, और फ़िल्टर किए गए सर्वरों के लिए सारांश कार्ड की समीक्षा करें.
3. ट्रांसपोर्ट, auth, फ़िल्टर, timeout, और command संकेतों के लिए प्रत्येक सर्वर पंक्ति का उपयोग करें.
4. जब आप किसी परिभाषा को रखना चाहते हों लेकिन उसे runtime discovery से बाहर करना चाहते हों, तो enablement टॉगल करें.
5. नए सर्वर, headers, TLS, OAuth metadata, या tool filters जैसे संरचनात्मक बदलावों के लिए scoped `mcp` config section संपादित करें.
6. केवल config को स्थायी रखने के लिए **सहेजें** चुनें, या Gateway config path के ज़रिए लागू करने के लिए **सहेजें और प्रकाशित करें** चुनें.
7. जब आपको live proof चाहिए कि संपादित सर्वर शुरू होता है और tools सूचीबद्ध करता है, तो `openclaw mcp doctor --probe` चलाएँ.

नोट्स:

- command snippets सर्वर नामों को quote करते हैं ताकि असामान्य नाम भी shell में copy किए जा सकें
- displayed URL-like values में embedded credentials होने पर rendering से पहले उन्हें redact किया जाता है
- पेज अपने-आप MCP transports शुरू नहीं करता
- active runtimes को MCP clients का स्वामी कौन-सी process है, इसके आधार पर `openclaw mcp reload`, Gateway config publish, या process restart की आवश्यकता हो सकती है

## वर्तमान सीमाएँ

यह पेज bridge को आज shipped रूप में document करता है.

वर्तमान सीमाएँ:

- conversation discovery मौजूदा Gateway session route metadata पर निर्भर करती है
- Claude-specific adapter से आगे कोई generic push protocol नहीं है
- अभी तक कोई message edit या react tools नहीं हैं
- HTTP/SSE/streamable-http transport एक single remote server से connect करता है; अभी कोई multiplexed upstream नहीं है
- `permissions_list_open` में केवल वे approvals शामिल हैं जो bridge connected रहने के दौरान observe किए गए थे

## संबंधित

- [CLI reference](/hi/cli)
- [Plugins](/hi/cli/plugins)
