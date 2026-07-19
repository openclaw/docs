---
read_when:
    - iMessage समर्थन सेट अप करना
    - iMessage भेजने/प्राप्त करने की डीबगिंग
summary: stdio पर JSON-RPC के माध्यम से imsg द्वारा मूल iMessage समर्थन, जिसमें उत्तरों, tapbacks, effects, polls, attachments और समूह प्रबंधन के लिए निजी API क्रियाएँ शामिल हैं। जब होस्ट आवश्यकताएँ उपयुक्त हों, तो नए OpenClaw iMessage सेटअप के लिए इसे प्राथमिकता दी जाती है।
title: iMessage
x-i18n:
    generated_at: "2026-07-19T08:00:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 215364b4a0424db3fccb27e29815f2a94c55ebe66d1eec21ed85e4b7947ea1ab
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
सामान्य OpenClaw iMessage परिनियोजन के लिए, Gateway और `imsg` को उसी साइन-इन किए हुए macOS Messages होस्ट पर चलाएँ। यदि आपका Gateway कहीं और चलता है, तो `channels.imessage.cliPath` को ऐसे पारदर्शी SSH रैपर पर इंगित करें जो Mac पर `imsg` चलाता हो।

**इनबाउंड पुनर्प्राप्ति स्वचालित है।** ब्रिज या Gateway के पुनरारंभ होने के बाद, iMessage उसके बंद रहने के दौरान छूटे संदेशों को फिर से चलाता है और Push पुनर्प्राप्ति के बाद Apple द्वारा भेजे जा सकने वाले पुराने "बैकलॉग बम" को रोकता है तथा डुप्लिकेट हटाता है, ताकि कोई भी संदेश दो बार प्रेषित न हो। इसे सक्षम करने के लिए कोई कॉन्फ़िगरेशन नहीं है — [ब्रिज या Gateway के पुनरारंभ के बाद इनबाउंड पुनर्प्राप्ति](#inbound-recovery-after-a-bridge-or-gateway-restart) देखें।
</Note>

<Warning>
BlueBubbles समर्थन हटा दिया गया है। `channels.bluebubbles` कॉन्फ़िगरेशन को `channels.imessage` में माइग्रेट करें; OpenClaw केवल `imsg` के माध्यम से iMessage का समर्थन करता है। संक्षिप्त घोषणा के लिए [BlueBubbles को हटाना और imsg iMessage पथ](/hi/announcements/bluebubbles-imessage) से शुरू करें, या पूरी माइग्रेशन तालिका के लिए [BlueBubbles से आना](/hi/channels/imessage-from-bluebubbles) देखें।
</Warning>

स्थिति: मूल बाहरी CLI एकीकरण। Gateway `imsg rpc` को आरंभ करता है और stdio पर JSON-RPC के माध्यम से संचार करता है — कोई अलग डेमन या पोर्ट नहीं। पूर्ण iMessage चैनल के लिए Private API मोड की पुरज़ोर अनुशंसा की जाती है; जवाबों, टैपबैक, प्रभावों, पोल, अटैचमेंट जवाबों और समूह कार्रवाइयों के लिए `imsg launch` और सफल Private API जाँच आवश्यक है।

सामान्य स्थानीय सेटअप के लिए, OpenClaw सेटअप साइन-इन किए हुए Messages Mac पर `imsg` को उपयोगकर्ता की पुष्टि के बाद Homebrew के माध्यम से इंस्टॉल या अपडेट करने का विकल्प दे सकता है। मैन्युअल सेटअप और SSH-रैपर टोपोलॉजी का प्रबंधन ऑपरेटर द्वारा ही किया जाता है: `imsg` को उसी उपयोगकर्ता संदर्भ में इंस्टॉल या अपडेट करें जिसमें Gateway या रैपर चलेगा।

<CardGroup cols={3}>
  <Card title="Private API कार्रवाइयाँ" icon="wand-sparkles" href="#private-api-actions">
    जवाब, टैपबैक, प्रभाव, पोल, अटैचमेंट और समूह प्रबंधन।
  </Card>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    iMessage DM डिफ़ॉल्ट रूप से पेयरिंग मोड का उपयोग करते हैं।
  </Card>
  <Card title="रिमोट Mac" icon="terminal" href="#remote-mac-over-ssh">
    जब Gateway Messages Mac पर नहीं चल रहा हो, तब SSH रैपर का उपयोग करें।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" icon="settings" href="/hi/gateway/config-channels#imessage">
    iMessage फ़ील्ड का पूर्ण संदर्भ।
  </Card>
</CardGroup>

## त्वरित सेटअप

<Tabs>
  <Tab title="स्थानीय Mac (तेज़ पथ)">
    <Steps>
      <Step title="imsg इंस्टॉल और सत्यापित करें">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        जब स्थानीय सेटअप विज़ार्ड को डिफ़ॉल्ट `imsg` कमांड अनुपलब्ध मिलता है, तो वह Homebrew के माध्यम से `steipete/tap/imsg` इंस्टॉल करने के लिए संकेत दे सकता है। यदि उसे Homebrew द्वारा प्रबंधित `imsg` मिलता है, तो वह उसे फिर से इंस्टॉल या अपडेट करने के लिए संकेत दे सकता है। कस्टम `cliPath` रैपर संशोधित नहीं किए जाते।

      </Step>

      <Step title="OpenClaw कॉन्फ़िगर करें">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway शुरू करें">

```bash
openclaw gateway
```

      </Step>

      <Step title="पहली DM पेयरिंग स्वीकृत करें (डिफ़ॉल्ट dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        पेयरिंग अनुरोध 1 घंटे बाद समाप्त हो जाते हैं।
      </Step>
    </Steps>

  </Tab>

  <Tab title="SSH पर रिमोट Mac">
    अधिकांश सेटअप को SSH की आवश्यकता नहीं होती। इस टोपोलॉजी का उपयोग केवल तब करें जब Gateway साइन-इन किए हुए Messages Mac पर नहीं चल सकता। OpenClaw को केवल stdio-संगत `cliPath` की आवश्यकता होती है, इसलिए आप `cliPath` को ऐसे रैपर स्क्रिप्ट पर इंगित कर सकते हैं जो रिमोट Mac पर SSH करके `imsg` चलाती हो।
    `imsg` को Gateway होस्ट पर नहीं, बल्कि उस रिमोट Mac पर इंस्टॉल और अपडेट करें:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    अटैचमेंट सक्षम होने पर अनुशंसित कॉन्फ़िगरेशन:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // SCP अटैचमेंट प्राप्त करने के लिए उपयोग किया जाता है
      includeAttachments: true,
      // वैकल्पिक: अतिरिक्त अनुमत अटैचमेंट रूट (डिफ़ॉल्ट
      // /Users/*/Library/Messages/Attachments के साथ मर्ज किए जाते हैं)।
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    यदि `remoteHost` सेट नहीं है, तो OpenClaw SSH रैपर स्क्रिप्ट को पार्स करके इसका स्वतः पता लगाने का प्रयास करता है।
    `remoteHost` को `host` या `user@host` होना चाहिए (कोई स्पेस या SSH विकल्प नहीं); असुरक्षित मानों को अनदेखा किया जाता है।
    OpenClaw SCP के लिए सख़्त होस्ट-कुंजी जाँच का उपयोग करता है, इसलिए रिले होस्ट कुंजी पहले से `~/.ssh/known_hosts` में मौजूद होनी चाहिए।
    अटैचमेंट पथों को अनुमत रूट (`attachmentRoots` / `remoteAttachmentRoots`) के विरुद्ध सत्यापित किया जाता है।

<Warning>
`imsg` के आगे रखा गया कोई भी `cliPath` रैपर या SSH प्रॉक्सी लंबे समय तक चलने वाले JSON-RPC के लिए पारदर्शी stdio पाइप की तरह व्यवहार करना **अनिवार्य** है। OpenClaw चैनल के पूरे जीवनकाल में रैपर के stdin/stdout पर नई पंक्ति से फ़्रेम किए गए छोटे JSON-RPC संदेशों का आदान-प्रदान करता है:

- प्रत्येक stdin खंड/पंक्ति को **बाइट उपलब्ध होते ही** अग्रेषित करें — EOF की प्रतीक्षा न करें।
- प्रत्येक stdout खंड/पंक्ति को विपरीत दिशा में तुरंत अग्रेषित करें।
- नई पंक्तियाँ सुरक्षित रखें।
- निश्चित आकार की ब्लॉकिंग रीड (`read(4096)`, `cat | buffer`, डिफ़ॉल्ट शेल `read`) से बचें, जो छोटे फ़्रेमों को रोक सकती हैं।
- stderr को JSON-RPC stdout स्ट्रीम से अलग रखें।

stdin को बड़ा ब्लॉक भरने तक बफ़र करने वाला रैपर ऐसे लक्षण उत्पन्न करेगा जो iMessage सेवा बंद होने जैसे दिखेंगे — `imsg rpc timeout (chats.list)` या चैनल का बार-बार पुनरारंभ होना — भले ही `imsg rpc` स्वयं ठीक हो। `ssh -T host imsg "$@"` (ऊपर) सुरक्षित है क्योंकि यह OpenClaw के `cliPath` तर्क, जैसे `rpc` और `--db`, अग्रेषित करता है। `ssh host imsg | grep -v '^DEBUG'` जैसी पाइपलाइन सुरक्षित **नहीं** हैं — पंक्ति-बफ़र वाले टूल फिर भी फ़्रेम रोक सकते हैं; यदि फ़िल्टर करना आवश्यक हो, तो प्रत्येक चरण में `stdbuf -oL -eL` का उपयोग करें।
</Warning>

  </Tab>
</Tabs>

## आवश्यकताएँ और अनुमतियाँ (macOS)

- जिस Mac पर `imsg` चल रहा है, उस पर Messages में साइन इन होना आवश्यक है।
- OpenClaw/`imsg` चलाने वाले प्रक्रिया संदर्भ के लिए Full Disk Access आवश्यक है (Messages DB एक्सेस)।
- Messages.app के माध्यम से संदेश भेजने के लिए Automation अनुमति आवश्यक है।
- उन्नत कार्रवाइयों (प्रतिक्रिया / संपादन / भेजना रद्द करना / थ्रेडेड जवाब / प्रभाव / पोल / समूह संचालन) के लिए System Integrity Protection अक्षम होना चाहिए — [imsg Private API सक्षम करना](#enabling-the-imsg-private-api) देखें। इसके बिना भी सामान्य टेक्स्ट और मीडिया भेजना/प्राप्त करना काम करता है।

<Tip>
अनुमतियाँ प्रत्येक प्रक्रिया संदर्भ के अनुसार दी जाती हैं। यदि Gateway हेडलेस (LaunchAgent/SSH) चलता है, तो संकेत ट्रिगर करने के लिए उसी संदर्भ में एक बार इंटरैक्टिव कमांड चलाएँ:

```bash
imsg chats --limit 1
# या
imsg send <handle> "परीक्षण"
```

</Tip>

<Accordion title="SSH रैपर से भेजना AppleEvents -1743 के साथ विफल होता है">
  रिमोट-SSH सेटअप चैट पढ़ सकता है, `channels status --probe` पास कर सकता है और इनबाउंड संदेश संसाधित कर सकता है, जबकि आउटबाउंड संदेश भेजना फिर भी AppleEvents प्राधिकरण त्रुटि के साथ विफल हो सकता है:

```text
Messages को Apple events भेजने के लिए अधिकृत नहीं है। (-1743)
```

साइन-इन किए हुए Mac उपयोगकर्ता का TCC डेटाबेस या System Settings > Privacy & Security > Automation जाँचें। यदि Automation प्रविष्टि `imsg` या स्थानीय शेल प्रक्रिया के बजाय `/usr/libexec/sshd-keygen-wrapper` के लिए दर्ज है, तो macOS उस SSH सर्वर-साइड क्लाइंट के लिए उपयोग योग्य Messages टॉगल प्रदर्शित नहीं कर सकता:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

उस स्थिति में, उसी SSH रैपर के माध्यम से `tccutil reset AppleEvents` दोहराना या `imsg send` फिर से चलाना लगातार विफल हो सकता है, क्योंकि जिस प्रक्रिया संदर्भ को Messages Automation की आवश्यकता है वह SSH रैपर है, न कि कोई ऐसा ऐप जिसे UI अनुमति दे सके।

इसके बजाय समर्थित `imsg` प्रक्रिया संदर्भों में से किसी एक का उपयोग करें:

- Gateway या कम-से-कम `imsg` ब्रिज को लॉग-इन किए हुए Messages उपयोगकर्ता के स्थानीय सत्र में चलाएँ।
- उसी सत्र से Full Disk Access और Automation प्रदान करने के बाद उस उपयोगकर्ता के LaunchAgent के साथ Gateway शुरू करें।
- यदि आप दो-उपयोगकर्ता SSH टोपोलॉजी बनाए रखते हैं, तो चैनल सक्षम करने से पहले सत्यापित करें कि वास्तविक आउटबाउंड `imsg send` ठीक उसी रैपर से सफल होता है। यदि उसे Automation अनुमति नहीं दी जा सकती, तो संदेश भेजने के लिए SSH रैपर पर निर्भर रहने के बजाय एकल-उपयोगकर्ता `imsg` सेटअप में पुनः कॉन्फ़िगर करें।

</Accordion>

## imsg Private API सक्षम करना

`imsg` दो परिचालन मोड में उपलब्ध होता है। OpenClaw के लिए Private API मोड अनुशंसित सेटअप है, क्योंकि यह चैनल को वे मूल iMessage कार्रवाइयाँ प्रदान करता है जिनकी उपयोगकर्ता अपेक्षा करते हैं। सामान्य मोड कम-जोखिम वाले इंस्टॉलेशन, प्रारंभिक सत्यापन या ऐसे होस्ट के लिए उपयोगी रहता है जहाँ SIP अक्षम नहीं किया जा सकता।

- **सामान्य मोड** (डिफ़ॉल्ट, SIP में कोई बदलाव आवश्यक नहीं): `send` के माध्यम से आउटबाउंड टेक्स्ट और मीडिया, इनबाउंड निगरानी/इतिहास और चैट सूची। नया `brew install steipete/tap/imsg` इंस्टॉल करने और ऊपर दी गई मानक macOS अनुमतियाँ प्रदान करने पर यह बिना अतिरिक्त कॉन्फ़िगरेशन के मिलता है।
- **Private API मोड**: आंतरिक `IMCore` फ़ंक्शन कॉल करने के लिए `imsg`, `Messages.app` में सहायक dylib इंजेक्ट करता है। इससे `react`, `edit`, `unsend`, `reply` (थ्रेडेड), `sendWithEffect`, `poll` और `poll-vote` (मूल Messages पोल), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, साथ ही टाइपिंग संकेतक और पढ़े जाने की रसीदें उपलब्ध हो जाती हैं।

इस पृष्ठ पर अनुशंसित कार्रवाई सतह के लिए Private API मोड आवश्यक है। `imsg` README इस आवश्यकता के बारे में स्पष्ट है:

> `read`, `typing`, `launch`, ब्रिज-समर्थित समृद्ध प्रेषण, संदेश परिवर्तन और चैट प्रबंधन जैसी उन्नत सुविधाएँ वैकल्पिक हैं। इनके लिए SIP अक्षम होना और `Messages.app` में एक सहायक dylib इंजेक्ट होना आवश्यक है। SIP सक्षम होने पर `imsg launch` इंजेक्ट करने से इनकार करता है।

सहायक-इंजेक्शन तकनीक Messages के Private API तक पहुँचने के लिए `imsg` के अपने dylib का उपयोग करती है। OpenClaw iMessage पथ में कोई तृतीय-पक्ष सर्वर या BlueBubbles रनटाइम नहीं है।

<Warning>
**SIP अक्षम करना सुरक्षा से जुड़ा वास्तविक समझौता है।** SIP संशोधित सिस्टम कोड चलने से रोकने वाली macOS की मुख्य सुरक्षाओं में से एक है; इसे पूरे सिस्टम में बंद करने से अतिरिक्त आक्रमण सतह और दुष्प्रभाव उत्पन्न होते हैं। विशेष रूप से, **Apple Silicon Mac पर SIP अक्षम करने से आपके Mac पर iOS ऐप इंस्टॉल और चलाने की क्षमता भी अक्षम हो जाती है**।

इसे सोच-समझकर लिया गया परिचालन निर्णय मानें, विशेष रूप से अपने मुख्य व्यक्तिगत Mac पर। उत्पादन-गुणवत्ता वाले OpenClaw iMessage के लिए, ऐसे समर्पित Mac या बॉट macOS उपयोगकर्ता को प्राथमिकता दें जहाँ ब्रिज सक्षम करना स्वीकार्य हो। यदि आपका ख़तरा मॉडल कहीं भी SIP बंद होना सहन नहीं कर सकता, तो अंतर्निहित iMessage केवल सामान्य मोड तक सीमित रहेगा — केवल टेक्स्ट और मीडिया भेजना/प्राप्त करना; कोई प्रतिक्रिया / संपादन / भेजना रद्द करना / प्रभाव / समूह संचालन नहीं।
</Warning>

### सेटअप

1. Messages.app चलाने वाले Mac पर **`imsg` इंस्टॉल (या अपग्रेड) करें**:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` आउटपुट `bridge_version`, `rpc_methods` और प्रत्येक विधि के `selectors` की रिपोर्ट करता है, ताकि शुरू करने से पहले यह देखा जा सके कि वर्तमान बिल्ड किन सुविधाओं का समर्थन करता है।

2. **System Integrity Protection और (आधुनिक macOS पर) Library Validation अक्षम करें।** Apple द्वारा हस्ताक्षरित `Messages.app` में गैर-Apple सहायक dylib इंजेक्ट करने के लिए SIP बंद करना **और** Library Validation में ढील देना आवश्यक है। Recovery Mode में SIP अक्षम करने का चरण macOS संस्करण के अनुसार अलग होता है:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Terminal के माध्यम से Library Validation अक्षम करें, Recovery Mode में रीबूट करें, `csrutil disable` चलाएँ, फिर रीस्टार्ट करें।
   - **macOS 11+ (Big Sur और बाद के संस्करण), Intel:** Recovery Mode (या Internet Recovery), `csrutil disable`, फिर रीस्टार्ट करें।
   - **macOS 11+, Apple Silicon:** Recovery में प्रवेश करने के लिए पावर-बटन स्टार्टअप क्रम का उपयोग करें; हाल के macOS संस्करणों पर Continue पर क्लिक करते समय **Left Shift** कुंजी दबाए रखें, फिर `csrutil disable`। वर्चुअल-मशीन सेटअप के लिए अलग प्रवाह होता है, इसलिए पहले VM स्नैपशॉट लें।

   **macOS 11 और बाद के संस्करणों पर, केवल `csrutil disable` आम तौर पर पर्याप्त नहीं होता।** Apple अब भी प्लेटफ़ॉर्म बाइनरी के रूप में `Messages.app` पर Library Validation लागू करता है, इसलिए SIP बंद होने पर भी adhoc-हस्ताक्षरित सहायक अस्वीकार कर दिया जाता है (`Library Validation failed: ... platform binary, but mapped file is not`)। SIP अक्षम करने के बाद Library Validation भी अक्षम करें और रीबूट करें:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), 26.5.1 पर सत्यापित:** SIP बंद होना **और** ऊपर दिया गया `DisableLibraryValidation` कमांड 26.0 से 26.5.x तक सहायक को इंजेक्ट करने के लिए पर्याप्त है। **किसी boot-args की आवश्यकता नहीं है।** plist निर्णायक कारक है और Tahoe पर इंजेक्शन विफल होने पर सबसे अधिक छूटने वाला चरण भी यही है:
   - **plist के साथ:** `imsg launch` इंजेक्ट करता है और `imsg status`, `advanced_features: true` रिपोर्ट करता है।
   - **plist के बिना (SIP बंद होने पर भी):** `imsg launch`, `Failed to launch: Timeout waiting for Messages.app to initialize` के साथ विफल होता है। AMFI लोड के समय adhoc सहायक को अस्वीकार कर देता है, इसलिए ब्रिज कभी तैयार नहीं होता और लॉन्च का समय समाप्त हो जाता है। Tahoe पर अधिकांश लोगों को यही समय-समाप्ति दिखाई देती है; समाधान ऊपर दिया गया plist है, कोई अधिक कठोर उपाय नहीं।

   यदि macOS अपग्रेड के बाद `imsg launch` इंजेक्शन या विशिष्ट `selectors` false लौटाने लगें, तो आम तौर पर यह गेट इसका कारण होता है। यह मानने से पहले कि SIP चरण स्वयं विफल हुआ है, अपनी SIP और Library Validation स्थिति जाँचें। यदि वे सेटिंग सही हैं और ब्रिज फिर भी इंजेक्ट नहीं हो पा रहा है, तो अतिरिक्त सिस्टम-व्यापी सुरक्षा नियंत्रणों को कमज़ोर करने के बजाय `imsg status --json` और `imsg launch` आउटपुट एकत्र करके `imsg` प्रोजेक्ट को रिपोर्ट करें।

3. **सहायक इंजेक्ट करें।** SIP अक्षम और Messages.app में साइन इन होने पर:

   ```bash
   imsg launch
   ```

   SIP अब भी सक्षम होने पर `imsg launch` इंजेक्ट करने से इनकार करता है, इसलिए यह इस बात की पुष्टि भी करता है कि चरण 2 प्रभावी हुआ।

4. **OpenClaw से ब्रिज सत्यापित करें:**

   ```bash
   openclaw channels status --probe
   ```

   iMessage प्रविष्टि को `works` रिपोर्ट करना चाहिए और `imsg status --json | jq '{rpc_methods, selectors}'` को आपके macOS बिल्ड द्वारा उपलब्ध कराई गई क्षमताएँ दिखानी चाहिए। पोल बनाने के लिए `selectors.pollPayloadMessage` आवश्यक है; मतदान के लिए `selectors.pollVoteMessage` और `poll.vote` RPC विधि, दोनों आवश्यक हैं। OpenClaw Plugin केवल कैश किए गए प्रोब द्वारा समर्थित कार्रवाइयों का विज्ञापन करता है, जबकि खाली कैश आशावादी रहता है और पहले डिस्पैच पर प्रोब करता है।

यदि `openclaw channels status --probe` चैनल को `works` के रूप में रिपोर्ट करता है, लेकिन विशिष्ट कार्रवाइयाँ डिस्पैच के समय "iMessage `<action>` requires the imsg private API bridge" त्रुटि देती हैं, तो `imsg launch` फिर से चलाएँ — सहायक अलग हो सकता है (Messages.app रीस्टार्ट, OS अपडेट आदि) और कैश की गई `available: true` स्थिति अगले प्रोब द्वारा रीफ़्रेश होने तक कार्रवाइयों का विज्ञापन करती रहेगी।

### जब SIP सक्षम रहता है

यदि आपके थ्रेट मॉडल के लिए SIP अक्षम करना स्वीकार्य नहीं है:

- `imsg` बेसिक मोड पर वापस आ जाता है — केवल टेक्स्ट + मीडिया + प्राप्ति।
- OpenClaw Plugin अब भी टेक्स्ट/मीडिया भेजने और इनबाउंड निगरानी का विज्ञापन करता है; यह कार्रवाई सतह से `react`, `edit`, `unsend`, `reply`, `sendWithEffect` और समूह कार्रवाइयाँ छिपाता है (प्रति-विधि क्षमता गेट के अनुसार)।
- आप iMessage कार्यभार के लिए SIP बंद रखते हुए एक अलग गैर-Apple-Silicon Mac (या समर्पित बॉट Mac) चला सकते हैं और अपने प्राथमिक डिवाइसों पर SIP सक्षम रख सकते हैं। नीचे [समर्पित बॉट macOS उपयोगकर्ता (अलग iMessage पहचान)](#deployment-patterns) देखें।

## अभिगम नियंत्रण और रूटिंग

<Tabs>
  <Tab title="DM नीति">
    `channels.imessage.dmPolicy` प्रत्यक्ष संदेशों को नियंत्रित करता है:

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist` (कम-से-कम एक `allowFrom` प्रविष्टि आवश्यक है)
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    अनुमति-सूची फ़ील्ड: `channels.imessage.allowFrom`।

    अनुमति-सूची प्रविष्टियों को प्रेषकों की पहचान करनी चाहिए: हैंडल या स्थिर प्रेषक अभिगम समूह (`accessGroup:<name>`)। `chat_id:*`, `chat_guid:*` या `chat_identifier:*` जैसे चैट लक्ष्यों के लिए `channels.imessage.groupAllowFrom` का उपयोग करें; संख्यात्मक `chat_id` रजिस्ट्री कुंजियों के लिए `channels.imessage.groups` का उपयोग करें।

  </Tab>

  <Tab title="समूह नीति + उल्लेख">
    `channels.imessage.groupPolicy` समूह संचालन नियंत्रित करता है:

    - `allowlist` (डिफ़ॉल्ट)
    - `open`
    - `disabled`

    समूह प्रेषक अनुमति-सूची: `channels.imessage.groupAllowFrom`।

    `groupAllowFrom` प्रविष्टियाँ स्थिर प्रेषक अभिगम समूहों (`accessGroup:<name>`) का संदर्भ भी दे सकती हैं।

    रनटाइम फ़ॉलबैक: यदि `groupAllowFrom` सेट नहीं है, तो iMessage समूह प्रेषक जाँच `allowFrom` का उपयोग करती है; जब DM और समूह प्रवेश अलग होने चाहिए, तब `groupAllowFrom` सेट करें। स्पष्ट रूप से खाली `groupAllowFrom: []` फ़ॉलबैक नहीं करता — यह `allowlist` के अंतर्गत सभी समूह प्रेषकों को ब्लॉक करता है।
    रनटाइम टिप्पणी: यदि `channels.imessage` पूरी तरह अनुपस्थित है, तो रनटाइम `groupPolicy="allowlist"` पर फ़ॉलबैक करता है और चेतावनी लॉग करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

    <Warning>
    `groupPolicy: "allowlist"` के अंतर्गत समूह रूटिंग लगातार **दो** गेट चलाती है:

    1. **प्रेषक अनुमति-सूची** (`channels.imessage.groupAllowFrom`) — हैंडल, `accessGroup:<name>`, `chat_guid`, `chat_identifier` या `chat_id`। खाली प्रभावी सूची (न `groupAllowFrom`, न `allowFrom` फ़ॉलबैक) प्रत्येक समूह प्रेषक को ब्लॉक करती है।
    2. **समूह रजिस्ट्री** (`channels.imessage.groups`) — मैप में प्रविष्टियाँ होते ही लागू होती है: चैट को स्पष्ट प्रति-`chat_id` प्रविष्टि या `groups: { "*": { ... } }` वाइल्डकार्ड से मेल खाना चाहिए। जब `groups` खाली या अनुपस्थित हो, तो केवल प्रेषक अनुमति-सूची प्रवेश तय करती है।

    यदि कोई प्रभावी समूह प्रेषक अनुमति-सूची कॉन्फ़िगर नहीं है, तो प्रत्येक समूह संदेश रजिस्ट्री गेट से पहले हटा दिया जाता है। प्रत्येक गेट का डिफ़ॉल्ट लॉग स्तर पर अपना `warn`-स्तरीय संकेत होता है और प्रत्येक अलग समाधान बताता है:

    - स्टार्टअप पर प्रति अकाउंट एक बार, जब प्रभावी समूह प्रेषक अनुमति-सूची खाली हो: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — `channels.imessage.groupAllowFrom` (या `allowFrom`) सेट करके ठीक करें; केवल `groups` प्रविष्टियाँ जोड़ने पर गेट 1 प्रत्येक प्रेषक को ब्लॉक करता रहेगा।
    - रनटाइम पर प्रति `chat_id` एक बार, जब प्रेषक गेट 1 पार कर चुका हो लेकिन चैट भरी हुई `groups` रजिस्ट्री में अनुपस्थित हो: `imessage: dropping group message from chat_id=<id> ...` — `channels.imessage.groups` के अंतर्गत वह `chat_id` (या `"*"`) जोड़कर ठीक करें।

    DM अप्रभावित रहते हैं — वे अलग कोड पथ अपनाते हैं।

    `groupPolicy: "allowlist"` के अंतर्गत समूह प्रवाह के लिए अनुशंसित कॉन्फ़िगरेशन:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    केवल `groupAllowFrom` उन प्रेषकों को किसी भी समूह में प्रवेश देता है; किन चैटों को अनुमति है इसका दायरा निर्धारित करने के लिए (और `requireMention` जैसे प्रति-चैट विकल्प सेट करने के लिए) `groups` ब्लॉक जोड़ें।
    </Warning>

    समूहों के लिए उल्लेख गेटिंग:

    - iMessage में मूल उल्लेख मेटाडेटा नहीं होता
    - उल्लेख पहचान regex पैटर्न (`agents.list[].groupChat.mentionPatterns`, फ़ॉलबैक `messages.groupChat.mentionPatterns`) का उपयोग करती है
    - बिना कॉन्फ़िगर किए गए पैटर्न के उल्लेख गेटिंग लागू नहीं की जा सकती
    - अधिकृत प्रेषकों के नियंत्रण कमांड उल्लेख गेटिंग को बायपास करते हैं

    प्रति-समूह `systemPrompt`:

    `channels.imessage.groups.*` के अंतर्गत प्रत्येक प्रविष्टि एक वैकल्पिक `systemPrompt` स्ट्रिंग स्वीकार करती है, जिसे उस समूह में किसी संदेश को संभालने वाले प्रत्येक टर्न पर एजेंट के सिस्टम प्रॉम्प्ट में इंजेक्ट किया जाता है। रिज़ॉल्यूशन `channels.whatsapp.groups` के अनुरूप है:

    1. **समूह-विशिष्ट सिस्टम प्रॉम्प्ट** (`groups["<chat_id>"].systemPrompt`): इसका उपयोग तब होता है जब विशिष्ट समूह प्रविष्टि मैप में मौजूद हो **और** उसकी `systemPrompt` कुंजी परिभाषित हो। यदि `systemPrompt` एक खाली स्ट्रिंग (`""`) है, तो वाइल्डकार्ड दबा दिया जाता है और उस समूह पर कोई सिस्टम प्रॉम्प्ट लागू नहीं होता।
    2. **समूह वाइल्डकार्ड सिस्टम प्रॉम्प्ट** (`groups["*"].systemPrompt`): इसका उपयोग तब होता है जब विशिष्ट समूह प्रविष्टि मैप में पूरी तरह अनुपस्थित हो या वह मौजूद हो लेकिन कोई `systemPrompt` कुंजी परिभाषित न करती हो।

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "ब्रिटिश वर्तनी का उपयोग करें।" },
            "8421": {
              requireMention: true,
              systemPrompt: "यह ऑन-कॉल रोटेशन चैट है। उत्तर 3 वाक्यों से कम रखें।",
            },
            "9907": {
              // स्पष्ट दमन: वाइल्डकार्ड "ब्रिटिश वर्तनी का उपयोग करें।" यहाँ लागू नहीं होता
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    प्रति-समूह प्रॉम्प्ट केवल समूह संदेशों पर लागू होते हैं — प्रत्यक्ष संदेश अप्रभावित रहते हैं।

  </Tab>

  <Tab title="सत्र और निर्धारक उत्तर">
    - DM प्रत्यक्ष रूटिंग का उपयोग करते हैं; समूह, समूह रूटिंग का उपयोग करते हैं।
    - डिफ़ॉल्ट `session.dmScope=main` के साथ iMessage DM एजेंट के मुख्य सत्र में समाहित हो जाते हैं।
    - समूह सत्र पृथक होते हैं (`agent:<agentId>:imessage:group:<chat_id>`)।
    - उत्तर मूल चैनल/लक्ष्य मेटाडेटा का उपयोग करके वापस iMessage पर रूट होते हैं।

    समूह-जैसा थ्रेड व्यवहार:

    कुछ बहु-प्रतिभागी iMessage थ्रेड `is_group=false` के साथ आ सकते हैं।
    यदि वह `chat_id`, `channels.imessage.groups` के अंतर्गत स्पष्ट रूप से कॉन्फ़िगर किया गया है, तो OpenClaw उसे समूह ट्रैफ़िक मानता है (समूह गेटिंग + समूह सत्र पृथक्करण)।

  </Tab>
</Tabs>

## ACP वार्तालाप बाइंडिंग

iMessage चैट को ACP सत्रों से बाइंड किया जा सकता है।

त्वरित ऑपरेटर प्रवाह:

- DM या अनुमत समूह चैट के भीतर `/acp spawn codex --bind here` चलाएँ।
- उसी iMessage वार्तालाप के भावी संदेश बनाए गए ACP सत्र पर रूट होते हैं।
- `/new` और `/reset` उसी बाइंड किए गए ACP सत्र को उसी स्थान पर रीसेट करते हैं।
- `/acp close` ACP सत्र बंद करता है और बाइंडिंग हटाता है।

कॉन्फ़िगर की गई स्थायी बाइंडिंग शीर्ष-स्तरीय `bindings[]` प्रविष्टियों का उपयोग करती हैं, जिनमें `type: "acp"` और `match.channel: "imessage"` होते हैं।

`match.peer.id` इनमें से किसी का उपयोग कर सकता है:

- सामान्यीकृत DM हैंडल, जैसे `+15555550123` या `user@example.com`
- `chat_id:<id>` (स्थिर समूह बाइंडिंग के लिए अनुशंसित)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

उदाहरण:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

साझा ACP बाइंडिंग व्यवहार के लिए [ACP एजेंट](/hi/tools/acp-agents) देखें।

## परिनियोजन पैटर्न

<AccordionGroup>
  <Accordion title="समर्पित बॉट macOS उपयोगकर्ता (अलग iMessage पहचान)">
    समर्पित Apple ID और macOS उपयोगकर्ता का प्रयोग करें, ताकि बॉट ट्रैफ़िक आपकी निजी Messages प्रोफ़ाइल से पृथक रहे।

    सामान्य प्रवाह:

    1. एक समर्पित macOS उपयोगकर्ता बनाएँ/उसमें साइन इन करें।
    2. उस उपयोगकर्ता में बॉट Apple ID से Messages में साइन इन करें।
    3. उस उपयोगकर्ता में `imsg` इंस्टॉल करें।
    4. एक SSH रैपर बनाएँ, ताकि OpenClaw उस उपयोगकर्ता संदर्भ में `imsg` चला सके।
    5. `channels.imessage.accounts.<id>.cliPath` और `.dbPath` को उस उपयोगकर्ता प्रोफ़ाइल की ओर इंगित करें।

    पहली बार चलाने पर उस बॉट उपयोगकर्ता सत्र में GUI अनुमोदनों (Automation + Full Disk Access) की आवश्यकता हो सकती है।

  </Accordion>

  <Accordion title="Tailscale पर रिमोट Mac (उदाहरण)">
    सामान्य टोपोलॉजी:

    - gateway Linux/VM पर चलता है
    - iMessage + `imsg` आपके tailnet में मौजूद Mac पर चलता है
    - `cliPath` रैपर `imsg` चलाने के लिए SSH का उपयोग करता है
    - `remoteHost` SCP अटैचमेंट फ़ेच सक्षम करता है

    उदाहरण:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    SSH कुंजियों का उपयोग करें, ताकि SSH और SCP दोनों गैर-इंटरैक्टिव हों।
    पहले सुनिश्चित करें कि होस्ट कुंजी विश्वसनीय है (उदाहरण के लिए `ssh bot@mac-mini.tailnet-1234.ts.net`), ताकि `known_hosts` भरा हुआ हो।

  </Accordion>

  <Accordion title="बहु-खाता पैटर्न">
    iMessage `channels.imessage.accounts` के अंतर्गत प्रति-खाता कॉन्फ़िगरेशन का समर्थन करता है।

    प्रत्येक खाता `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, इतिहास सेटिंग और अटैचमेंट रूट अनुमति-सूचियों जैसे फ़ील्ड को ओवरराइड कर सकता है।

  </Accordion>

  <Accordion title="प्रत्यक्ष-संदेश इतिहास">
    नई प्रत्यक्ष-संदेश सत्रों को उस वार्तालाप के हाल के डिकोड किए गए `imsg` इतिहास से आरंभ करने के लिए `channels.imessage.dmHistoryLimit` सेट करें। प्रति-प्रेषक ओवरराइड के लिए `channels.imessage.dms["<sender>"].historyLimit` का उपयोग करें, जिसमें किसी प्रेषक के लिए इतिहास अक्षम करने हेतु `0` शामिल है।

    iMessage DM इतिहास माँग पर `imsg` से फ़ेच किया जाता है। `dmHistoryLimit` को सेट न करने पर वैश्विक DM इतिहास सीडिंग अक्षम रहती है, लेकिन प्रति-प्रेषक सकारात्मक `channels.imessage.dms["<sender>"].historyLimit` फिर भी उस प्रेषक के लिए सीडिंग सक्षम करता है।

  </Accordion>
</AccordionGroup>

## मीडिया, खंडन और डिलीवरी लक्ष्य

<AccordionGroup>
  <Accordion title="अटैचमेंट और मीडिया">
    - इनबाउंड अटैचमेंट अंतर्ग्रहण **डिफ़ॉल्ट रूप से बंद** है — फ़ोटो, वॉइस मेमो, वीडियो और अन्य अटैचमेंट एजेंट को अग्रेषित करने के लिए `channels.imessage.includeAttachments: true` सेट करें। इसके अक्षम होने पर केवल-अटैचमेंट वाले iMessages एजेंट तक पहुँचने से पहले हटा दिए जाते हैं और हो सकता है कि कोई `Inbound message` लॉग पंक्ति बिल्कुल न बने।
    - `remoteHost` सेट होने पर रिमोट अटैचमेंट पथों को SCP के माध्यम से फ़ेच किया जा सकता है
    - अटैचमेंट पथों का अनुमत रूट से मेल खाना आवश्यक है:
      - `channels.imessage.attachmentRoots` (स्थानीय)
      - `channels.imessage.remoteAttachmentRoots` (रिमोट SCP मोड)
      - कॉन्फ़िगर किए गए रूट डिफ़ॉल्ट रूट पैटर्न `/Users/*/Library/Messages/Attachments` का विस्तार करते हैं (मर्ज किए जाते हैं, प्रतिस्थापित नहीं)
    - SCP सख़्त होस्ट-कुंजी जाँच (`StrictHostKeyChecking=yes`) का उपयोग करता है
    - आउटबाउंड मीडिया आकार `channels.imessage.mediaMaxMb` का उपयोग करता है (डिफ़ॉल्ट 16 MB)

  </Accordion>

  <Accordion title="आउटबाउंड टेक्स्ट और खंडन">
    - टेक्स्ट खंड सीमा: `channels.imessage.textChunkLimit` (डिफ़ॉल्ट 4000)
    - खंड मोड: `channels.imessage.streaming.chunkMode`
      - `length` (डिफ़ॉल्ट)
      - `newline` (पहले अनुच्छेद के आधार पर विभाजन)
    - आउटबाउंड markdown बोल्ड/इटैलिक/अंडरलाइन/स्ट्राइकथ्रू को मूल शैलीयुक्त टेक्स्ट में बदला जाता है (macOS 15+ प्राप्तकर्ताओं को शैली दिखाई देती है; पुराने प्राप्तकर्ताओं को मार्कर के बिना सादा टेक्स्ट दिखाई देता है); markdown तालिकाएँ चैनल के markdown तालिका मोड के अनुसार बदली जाती हैं
    - `channels.imessage.sendTransport` (`auto` डिफ़ॉल्ट, `bridge`, `applescript`) यह चुनता है कि `imsg` भेजे जाने वाले संदेशों को कैसे डिलीवर करता है

  </Accordion>

  <Accordion title="एड्रेसिंग प्रारूप">
    पसंदीदा स्पष्ट लक्ष्य:

    - `chat_id:123` (स्थिर रूटिंग के लिए अनुशंसित)
    - `chat_guid:...`
    - `chat_identifier:...`

    हैंडल लक्ष्य भी समर्थित हैं:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## निजी API क्रियाएँ

जब `imsg launch` चल रहा हो और `openclaw channels status --probe`, `privateApi.available: true` रिपोर्ट करे, तब संदेश टूल सामान्य टेक्स्ट भेजने के अतिरिक्त iMessage-मूल क्रियाओं का उपयोग कर सकता है।

सभी क्रियाएँ डिफ़ॉल्ट रूप से सक्षम हैं; अलग-अलग क्रियाएँ बंद करने के लिए `channels.imessage.actions` का उपयोग करें:

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="उपलब्ध क्रियाएँ">
    - **react**: iMessage टैपबैक जोड़ें/हटाएँ (`messageId`, `emoji`, `remove`)। समर्थित टैपबैक love, like, dislike, laugh, emphasize और question से मैप होते हैं। इमोजी के बिना हटाने पर सेट किया गया कोई भी टैपबैक साफ़ हो जाता है।
    - **reply**: किसी मौजूदा संदेश का थ्रेडेड उत्तर भेजें (`messageId`, `text` या `message`, साथ में `chatGuid`, `chatId`, `chatIdentifier`, या `to`)। अटैचमेंट सहित उत्तर के लिए अतिरिक्त रूप से ऐसा `imsg` बिल्ड आवश्यक है, जिसका `send-rich`, `--file` का समर्थन करता हो।
    - **sendWithEffect**: iMessage प्रभाव के साथ टेक्स्ट भेजें (`text` या `message`, `effect` या `effectId`)। संक्षिप्त नाम: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight।
    - **edit**: समर्थित macOS/निजी API संस्करणों पर भेजे गए संदेश को संपादित करें (`messageId`, `text` या `newText`)। केवल gateway द्वारा स्वयं भेजे गए संदेशों को संपादित किया जा सकता है।
    - **unsend**: समर्थित macOS/निजी API संस्करणों पर भेजे गए संदेश को वापस लें (`messageId`)। केवल gateway द्वारा स्वयं भेजे गए संदेशों को वापस लिया जा सकता है।
    - **upload-file**: मीडिया/फ़ाइलें भेजें (`buffer` को base64 के रूप में या हाइड्रेट किया हुआ `media`/`path`/`filePath`, `filename`, वैकल्पिक `asVoice`)। लीगेसी उपनाम: `sendAttachment`।
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: जब वर्तमान लक्ष्य कोई समूह वार्तालाप हो, तब समूह चैट प्रबंधित करें। ये होस्ट की Messages पहचान में बदलाव करते हैं, इसलिए इनके लिए स्वामी प्रेषक या `operator.admin` Gateway क्लाइंट आवश्यक है।
    - **poll**: मूल Apple Messages पोल बनाएँ (`pollQuestion`, `pollOption` को 2 से 12 बार दोहराया गया, साथ में `chatGuid`, `chatId`, `chatIdentifier`, या `to`)। iOS/iPadOS/macOS 26+ वाले प्राप्तकर्ता इसे मूल रूप से देखते हैं और इस पर मतदान करते हैं; पुराने OS संस्करणों को "पोल भेजा गया" टेक्स्ट फ़ॉलबैक मिलता है। `selectors.pollPayloadMessage` आवश्यक है।
    - **poll-vote**: किसी मौजूदा पोल पर मतदान करें (`pollId` या `messageId`, साथ में `pollOptionIndex`, `pollOptionId`, या `pollOptionText` में से ठीक एक)। `selectors.pollVoteMessage` और `poll.vote` RPC विधि आवश्यक हैं।

    स्वीकार किए गए इनबाउंड पोल एजेंट के लिए प्रश्न, क्रमांकित विकल्प लेबल, मत संख्या और `poll-vote` के लिए आवश्यक पोल संदेश ID सहित रेंडर किए जाते हैं।

  </Accordion>

  <Accordion title="संदेश ID">
    इनबाउंड iMessage संदर्भ में उपलब्ध होने पर संक्षिप्त `MessageSid` मान और पूर्ण संदेश GUID (`MessageSidFull`) दोनों शामिल होते हैं। संक्षिप्त ID हाल के SQLite-समर्थित उत्तर कैश तक सीमित होते हैं और उपयोग से पहले वर्तमान चैट के विरुद्ध जाँचे जाते हैं। यदि कोई संक्षिप्त ID समाप्त हो जाए, तो उसे प्रदान करने वाले वार्तालाप को लक्ष्य बनाते हुए उसके `MessageSidFull` से पुनः प्रयास करें। पूर्ण ID वार्तालाप या खाता बाइंडिंग को बायपास नहीं करते, इसलिए किसी अन्य चैट के ID को वर्तमान लक्ष्य के ID से बदलें। वर्तमान वार्तालाप का प्रमाण उपलब्ध न होने पर रिमोट प्रत्यायोजित कॉल पुराने पूर्ण ID अस्वीकार कर सकते हैं।

  </Accordion>

  <Accordion title="क्षमता पहचान">
    OpenClaw निजी API क्रियाओं को केवल तभी छिपाता है, जब कैश की गई जाँच स्थिति बताती है कि ब्रिज अनुपलब्ध है। यदि स्थिति अज्ञात है, तो क्रियाएँ दृश्यमान रहती हैं और डिस्पैच आवश्यकतानुसार जाँच करता है, ताकि `imsg launch` के बाद पहली क्रिया अलग मैन्युअल स्थिति रीफ़्रेश के बिना सफल हो सके।

  </Accordion>

  <Accordion title="पठन रसीदें और टाइपिंग">
    जब निजी API ब्रिज सक्रिय हो, तब स्वीकार की गई इनबाउंड चैट को पढ़ा हुआ चिह्नित किया जाता है और टर्न स्वीकार होते ही प्रत्यक्ष चैट में टाइपिंग बबल दिखाई देता है, जबकि एजेंट संदर्भ तैयार करता और जनरेट करता है। पठन-चिह्नन अक्षम करने के लिए:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    प्रति-विधि क्षमता सूची से पहले के पुराने `imsg` बिल्ड टाइपिंग/पठन को चुपचाप गेट ऑफ़ कर देते हैं; OpenClaw प्रत्येक पुनरारंभ पर एक बार चेतावनी लॉग करता है, ताकि अनुपस्थित रसीद का कारण निर्धारित किया जा सके।

  </Accordion>

  <Accordion title="इनबाउंड टैपबैक">
    OpenClaw iMessage टैपबैक की सदस्यता लेता है और स्वीकार की गई प्रतिक्रियाओं को सामान्य संदेश टेक्स्ट के बजाय सिस्टम इवेंट के रूप में रूट करता है, इसलिए उपयोगकर्ता टैपबैक सामान्य उत्तर लूप ट्रिगर नहीं करता।

    सूचना मोड `channels.imessage.reactionNotifications` द्वारा नियंत्रित होता है:

    - `"own"` (डिफ़ॉल्ट): केवल तभी सूचित करें, जब उपयोगकर्ता बॉट द्वारा लिखे गए संदेशों पर प्रतिक्रिया दें।
    - `"all"`: अधिकृत प्रेषकों से आने वाले सभी इनबाउंड टैपबैक की सूचना दें।
    - `"off"`: इनबाउंड टैपबैक अनदेखा करें।

    प्रति-खाता ओवरराइड `channels.imessage.accounts.<id>.reactionNotifications` का उपयोग करते हैं।

  </Accordion>

  <Accordion title="अनुमोदन प्रतिक्रियाएँ (👍 / 👎)">
    जब `approvals.exec.enabled` या `approvals.plugin.enabled` सत्य हो और अनुरोध iMessage पर रूट हो, तब gateway अनुमोदन प्रॉम्प्ट को मूल रूप से डिलीवर करता है और उसे हल करने के लिए टैपबैक स्वीकार करता है:

    - `👍` (Like टैपबैक) → `allow-once`
    - `👎` (Dislike टैपबैक) → `deny`
    - `allow-always` मैन्युअल फ़ॉलबैक बना रहता है: `/approve <id> allow-always` को सामान्य उत्तर के रूप में भेजें।

    प्रतिक्रिया प्रबंधन के लिए प्रतिक्रिया देने वाले उपयोगकर्ता का हैंडल स्पष्ट अनुमोदक होना आवश्यक है। अनुमोदक सूची `channels.imessage.allowFrom` (या `channels.imessage.accounts.<id>.allowFrom`) से पढ़ी जाती है; उपयोगकर्ता का फ़ोन नंबर E.164 प्रारूप में या उसका Apple ID ईमेल जोड़ें (`chat_id:*` जैसे चैट लक्ष्य मान्य अनुमोदक प्रविष्टियाँ नहीं हैं)। वाइल्डकार्ड प्रविष्टि `"*"` स्वीकार की जाती है, लेकिन यह किसी भी प्रेषक को अनुमोदन की अनुमति देती है; खाली अनुमोदक सूची प्रतिक्रिया शॉर्टकट को पूरी तरह अक्षम कर देती है। प्रतिक्रिया शॉर्टकट जानबूझकर `reactionNotifications`, `dmPolicy`, और `groupAllowFrom` को बायपास करता है, क्योंकि स्पष्ट-अनुमोदक अनुमति-सूची ही अनुमोदन समाधान के लिए महत्त्वपूर्ण एकमात्र गेट है।

    `/approve` टेक्स्ट कमांड प्राधिकरण भी इसी सूची का अनुसरण करता है: जब `channels.imessage.allowFrom` खाली न हो, तब `/approve <id> <decision>` को उसी अनुमोदक सूची के विरुद्ध अधिकृत किया जाता है (व्यापक DM अनुमति-सूची के विरुद्ध नहीं), और DM अनुमति-सूची में अनुमत लेकिन `allowFrom` में अनुपस्थित प्रेषकों को स्पष्ट अस्वीकृति मिलती है। जब `allowFrom` खाली हो, तब समान-चैट फ़ॉलबैक प्रभावी रहता है और `/approve`, DM अनुमति-सूची द्वारा अनुमत किसी भी व्यक्ति को अधिकृत करता है। प्रत्येक ऐसे ऑपरेटर को, जिसे `/approve` या प्रतिक्रियाओं के माध्यम से अनुमोदन करना चाहिए, `allowFrom` में जोड़ें।

    ऑपरेटर नोट्स:
    - प्रतिक्रिया बाइंडिंग मेमोरी और Gateway के स्थायी कुंजीबद्ध स्टोर—दोनों में संग्रहीत होती है (TTL को अनुमोदन की समाप्ति अवधि से मिलाया जाता है), और Gateway टैपबैक के लिए लंबित प्रॉम्प्ट को भी पोल करता है, इसलिए Gateway के पुनः आरंभ होने के कुछ ही समय बाद आने वाला टैपबैक भी अनुमोदन का समाधान कर देता है।
    - ऑपरेटर का अपना `is_from_me=true` टैपबैक (उदाहरण के लिए, किसी युग्मित Apple डिवाइस से) अनुमोदन का समाधान करता है, जब वह हैंडल स्पष्ट अनुमोदक हो।
    - अनुमोदन प्रॉम्प्ट किसी समूह वार्तालाप में केवल तभी भेजे जाते हैं, जब स्पष्ट अनुमोदक कॉन्फ़िगर किए गए हों; अन्यथा समूह का कोई भी सदस्य अनुमोदन कर सकता है।
    - पुरानी टेक्स्ट-शैली की टैपबैक प्रतिक्रियाएँ (`Liked "…"` बहुत पुराने Apple क्लाइंट से आया सादा टेक्स्ट) अनुमोदनों का समाधान नहीं कर सकतीं, क्योंकि उनमें कोई संदेश GUID नहीं होता; प्रतिक्रिया के समाधान के लिए वर्तमान macOS / iOS क्लाइंट द्वारा उत्सर्जित संरचित टैपबैक मेटाडेटा आवश्यक है।

  </Accordion>

  <Accordion title="प्रश्न प्रतिक्रियाएँ (1️⃣ / 2️⃣ / 3️⃣ / 4️⃣)">
    एक गैर-गोपनीय, एकल-चयन प्रश्न और एक से चार विकल्पों वाले `ask_user` प्रॉम्प्ट के लिए, OpenClaw क्रमांकित इमोजी विकल्प जोड़ता है। उत्तर देने के लिए वितरित प्रॉम्प्ट पर संबंधित संख्या से प्रतिक्रिया दें। प्रतिक्रिया में बॉट द्वारा लिखे गए संदेश का स्थिर GUID होना आवश्यक है; इसके बाद OpenClaw Gateway के माध्यम से संख्या को कैनोनिकल विकल्प से मैप करता है। पुराने या डुप्लिकेट टैप अनदेखे किए जाते हैं।

    एकाधिक-प्रश्न, बहु-चयन और मुक्त-पाठ प्रॉम्प्ट केवल टेक्स्ट-उत्तर वाले बने रहते हैं। प्रश्न प्रतिक्रियाएँ सामान्य iMessage DM/समूह प्रवेश नियमों का पालन करती हैं। सामान्य `reactionNotifications` के `"off"` होने पर भी उन्हें पहचाना जाता है, और असंबंधित प्रतिक्रियाओं को एजेंट इवेंट में नहीं बदला जाता।

  </Accordion>
</AccordionGroup>

## कॉन्फ़िग लेखन

iMessage डिफ़ॉल्ट रूप से चैनल द्वारा आरंभ किए गए कॉन्फ़िग लेखन की अनुमति देता है (`commands.config: true` होने पर `/config set|unset` के लिए)।

अक्षम करें:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## विभाजित-प्रेषण DM को संयोजित करना (एक ही रचना में कमांड + URL)

जब कोई उपयोगकर्ता एक कमांड और URL साथ टाइप करता है—उदाहरण के लिए `Dump https://example.com/article`—तो Apple का Messages ऐप प्रेषण को **दो अलग-अलग `chat.db` पंक्तियों** में विभाजित कर देता है:

1. एक टेक्स्ट संदेश (`"Dump"`)।
2. अटैचमेंट के रूप में OG-पूर्वावलोकन छवियों वाला एक URL-पूर्वावलोकन बैलून (`"https://..."`)।

अधिकांश सेटअप पर दोनों पंक्तियाँ OpenClaw में लगभग 0.8-2.0 सेकंड के अंतर से पहुँचती हैं। संयोजन के बिना, एजेंट को पहले टर्न में केवल कमांड मिलता है (और वह अक्सर "मुझे URL भेजें" का उत्तर देता है), जबकि URL दूसरे टर्न में पहुँचता है। यह Apple की प्रेषण पाइपलाइन है, OpenClaw या `imsg` द्वारा प्रस्तुत कोई व्यवहार नहीं।

`channels.imessage.coalesceSameSenderDms` किसी DM में एक ही प्रेषक की लगातार पंक्तियों की बफ़रिंग सक्षम करता है। जब `imsg` किसी स्रोत पंक्ति पर संरचनात्मक URL-पूर्वावलोकन मार्कर `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` उपलब्ध कराता है, तो OpenClaw केवल उसी वास्तविक विभाजित-प्रेषण को मर्ज करता है और अन्य सभी बफ़र की गई पंक्तियों को अलग-अलग टर्न के रूप में रखता है। पुराने `imsg` बिल्ड, जो कोई बैलून मेटाडेटा उत्सर्जित नहीं करते, उनमें OpenClaw विभाजित-प्रेषण और अलग-अलग प्रेषणों के बीच अंतर नहीं कर सकता, इसलिए वह बकेट को मर्ज करने की फ़ॉलबैक प्रक्रिया अपनाता है। इससे `Dump <url>` विभाजित-प्रेषणों को दो टर्न में बदलने की प्रतिगति के बजाय मेटाडेटा से पहले वाला व्यवहार सुरक्षित रहता है। बहु-उपयोगकर्ता टर्न संरचना सुरक्षित रखने के लिए समूह चैट प्रत्येक संदेश को अलग-अलग डिस्पैच करना जारी रखती हैं।

<Tabs>
  <Tab title="कब सक्षम करें">
    इसे तब सक्षम करें, जब:

    - आप ऐसे Skills वितरित करते हैं, जो एक ही संदेश में `command + payload` की अपेक्षा करते हैं (डंप, पेस्ट, सहेजना, कतारबद्ध करना आदि)।
    - आपके उपयोगकर्ता कमांड के साथ URL पेस्ट करते हैं।
    - आप अतिरिक्त DM टर्न विलंबता स्वीकार कर सकते हैं (नीचे देखें)।

    इसे तब अक्षम रखें, जब:

    - एक-शब्द वाले DM ट्रिगर के लिए आपको न्यूनतम कमांड विलंबता चाहिए।
    - आपके सभी प्रवाह ऐसे एकमुश्त कमांड हैं, जिनमें बाद में पेलोड नहीं भेजा जाता।

  </Tab>
  <Tab title="सक्षम करना">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    फ़्लैग चालू होने और कोई स्पष्ट `messages.inbound.byChannel.imessage` या वैश्विक `messages.inbound.debounceMs` न होने पर, डीबाउंस विंडो बढ़कर **7000 ms** हो जाती है (पुराना डिफ़ॉल्ट 0 ms है—कोई डीबाउंसिंग नहीं)। बड़ी विंडो आवश्यक है, क्योंकि Messages.app द्वारा पूर्वावलोकन पंक्ति उत्सर्जित करते समय Apple के URL-पूर्वावलोकन विभाजित-प्रेषण का अंतराल कई सेकंड तक बढ़ सकता है।

    विंडो को स्वयं समायोजित करने के लिए:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="समझौते">
    - **सटीक मर्जिंग के लिए वर्तमान `imsg` पेलोड मेटाडेटा आवश्यक है।** `balloon_bundle_id` मौजूद होने पर केवल वास्तविक विभाजित-प्रेषण मर्ज होता है; ऊपर वर्णित मेटाडेटा-रहित फ़ॉलबैक मर्ज अंतरिम पश्च-संगतता है, जिसे `imsg` द्वारा अपस्ट्रीम में विभाजित-प्रेषण संयोजित किए जाने के बाद हटा दिया जाएगा।
    - **DM संदेशों के लिए अतिरिक्त विलंबता।** फ़्लैग चालू होने पर प्रत्येक DM (अलग नियंत्रण कमांड और एकल-टेक्स्ट अनुवर्ती संदेश सहित) डिस्पैच होने से पहले डीबाउंस विंडो तक प्रतीक्षा करता है, ताकि आने वाली संभावित URL-पूर्वावलोकन पंक्ति को शामिल किया जा सके। समूह चैट संदेश तुरंत डिस्पैच होते रहते हैं।
    - **मर्ज किया गया आउटपुट सीमित है।** मर्ज किए गए टेक्स्ट की सीमा स्पष्ट `…[truncated]` मार्कर सहित 4000 वर्ण है; अटैचमेंट की सीमा 20 है; स्रोत प्रविष्टियों की सीमा 10 है (इससे अधिक होने पर पहली और नवीनतम प्रविष्टियाँ रखी जाती हैं)। डाउनस्ट्रीम टेलीमेट्री के लिए प्रत्येक स्रोत GUID को `coalescedMessageGuids` में ट्रैक किया जाता है।
    - **केवल DM।** समूह चैट में प्रत्येक संदेश अलग-अलग डिस्पैच होता है, ताकि कई लोगों के टाइप करने पर बॉट प्रतिक्रियाशील बना रहे।
    - **ऑप्ट-इन, प्रति चैनल।** अन्य चैनल (Discord, Slack, Telegram, WhatsApp, …) अप्रभावित रहते हैं। `channels.bluebubbles.coalesceSameSenderDms` सेट करने वाले पुराने BlueBubbles कॉन्फ़िग को उस मान को `channels.imessage.coalesceSameSenderDms` में माइग्रेट करना चाहिए।

  </Tab>
</Tabs>

### परिदृश्य और एजेंट को क्या दिखाई देता है

"फ़्लैग चालू" कॉलम ऐसे `imsg` बिल्ड का व्यवहार दिखाता है, जो `balloon_bundle_id` उत्सर्जित करता है। पुराने `imsg` बिल्ड, जो कोई बैलून मेटाडेटा उत्सर्जित नहीं करते, उनमें नीचे "दो टर्न" / "N टर्न" के रूप में चिह्नित पंक्तियाँ इसके बजाय पुराने मर्ज (एक टर्न) पर फ़ॉलबैक करती हैं: OpenClaw संरचनात्मक रूप से विभाजित-प्रेषण और अलग-अलग प्रेषणों के बीच अंतर नहीं कर सकता, इसलिए वह मेटाडेटा से पहले वाला मर्ज सुरक्षित रखता है। बिल्ड द्वारा बैलून मेटाडेटा उत्सर्जित करते ही सटीक पृथक्करण सक्रिय हो जाता है।

| उपयोगकर्ता की रचना                                                 | `chat.db` का आउटपुट                | फ़्लैग बंद (डिफ़ॉल्ट)                   | फ़्लैग चालू + विंडो (imsg बैलून मेटाडेटा उत्सर्जित करता है)                                        |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (एक प्रेषण)                              | लगभग 1 सेकंड के अंतर वाली 2 पंक्तियाँ       | एजेंट के दो टर्न: केवल "Dump", फिर URL | एक टर्न: मर्ज किया गया टेक्स्ट `Dump https://example.com`                                          |
| `Save this 📎image.jpg caption` (अटैचमेंट + टेक्स्ट)                | URL बैलून मेटाडेटा के बिना 2 पंक्तियाँ | दो टर्न                                 | मेटाडेटा मिलने के बाद दो टर्न; पुराने/प्री-लैच मेटाडेटा-रहित सत्रों में एक मर्ज किया गया टर्न        |
| `/status` (अलग कमांड)                                      | 1 पंक्ति                             | तुरंत डिस्पैच                           | **विंडो तक प्रतीक्षा, फिर डिस्पैच**                                                               |
| केवल URL पेस्ट किया गया                                            | 1 पंक्ति                             | तुरंत डिस्पैच                           | विंडो तक प्रतीक्षा, फिर डिस्पैच                                                                    |
| टेक्स्ट + URL को जानबूझकर दो अलग संदेशों के रूप में, कई मिनट के अंतर से भेजा गया | विंडो के बाहर 2 पंक्तियाँ            | दो टर्न                                 | दो टर्न (उनके बीच विंडो समाप्त हो जाती है)                                                        |
| तीव्र बाढ़ (विंडो के भीतर >10 छोटे DM)                             | URL बैलून मेटाडेटा के बिना N पंक्तियाँ | N टर्न                                  | मेटाडेटा मिलने के बाद N टर्न; पुराने/प्री-लैच मेटाडेटा-रहित सत्रों में एक सीमित मर्ज किया गया टर्न |
| समूह चैट में दो लोग टाइप कर रहे हैं                                | M प्रेषकों से N पंक्तियाँ            | M+ टर्न (प्रति प्रेषक बकेट एक)          | M+ टर्न—समूह चैट संयोजित नहीं की जातीं                                                           |

## ब्रिज या Gateway के पुनः आरंभ होने के बाद इनबाउंड पुनर्प्राप्ति

Gateway के बंद रहने के दौरान छूटे संदेशों को iMessage पुनर्प्राप्त करता है और साथ ही उस पुराने "बैकलॉग बम" को दबाता है, जिसे Apple Push पुनर्प्राप्ति के बाद एक साथ भेज सकता है। टिकाऊ इनग्रेस और आयु-सीमा पर आधारित यह डिफ़ॉल्ट व्यवहार हमेशा चालू रहता है।

- **टिकाऊ रीप्ले सुरक्षा।** पुनर्प्राप्ति कर्सर को आगे बढ़ाने से पहले, OpenClaw प्रत्येक कच्ची पंक्ति को साझा SQLite इनग्रेस कतार में जर्नल करता है और उसके Apple GUID को इवेंट ID के रूप में उपयोग करता है। पूर्ण हुई पंक्ति लगभग 4 घंटे तक टूम्बस्टोन छोड़ती है, जिसकी सीमा 10,000 प्रविष्टियाँ है, इसलिए समान GUID वाला रीप्ले पुनः आरंभ होने के बाद भी हटा दिया जाता है। लंबित पंक्ति तब तक पुनर्प्राप्त करने योग्य रहती है, जब तक डिस्पैच उसे अपना नहीं लेता।
- **डाउनटाइम पुनर्प्राप्ति।** स्टार्टअप पर मॉनिटर अंतिम टिकाऊ रूप से स्वीकार की गई `chat.db` rowid (प्रति खाते का एक स्थायी कर्सर) याद रखता है और उसे `imsg watch.subscribe` में `since_rowid` के रूप में भेजता है, ताकि imsg उन पंक्तियों को रीप्ले करे जिन्हें अभी जर्नल नहीं किया गया था और फिर लाइव पंक्तियों का अनुसरण करे। क्रैश से पहले जर्नल की गई पंक्तियाँ SQLite से पुनः आरंभ होती हैं। रीप्ले नवीनतम 500 पंक्तियों और लगभग 2 घंटे तक पुराने संदेशों तक सीमित है, और GUID टूम्बस्टोन पहले से संसाधित सभी सामग्री को हटा देते हैं।
- **पुराने बैकलॉग की आयु-सीमा।** स्टार्टअप सीमा से ऊपर की पंक्तियाँ वास्तव में लाइव होती हैं; जिस पंक्ति की प्रेषण तिथि उसके आगमन से लगभग 15 मिनट से अधिक पुरानी होती है, वह Push द्वारा एक साथ भेजा गया बैकलॉग होती है और उसे दबा दिया जाता है। रीप्ले की गई पंक्तियाँ (सीमा पर या उससे नीचे) इसके बजाय व्यापक पुनर्प्राप्ति विंडो का उपयोग करती हैं, ताकि हाल में छूटा संदेश वितरित हो, लेकिन बहुत पुराना इतिहास नहीं।

पुनर्प्राप्ति स्थानीय और रिमोट `cliPath`—दोनों सेटअप पर काम करती है, क्योंकि `since_rowid` रीप्ले उसी `imsg` RPC कनेक्शन पर चलता है। अंतर विंडो का है: जब Gateway `chat.db` पढ़ सकता है (स्थानीय), तो वह स्टार्टअप rowid सीमा को आधार बनाता है, रीप्ले अवधि सीमित करता है और लगभग दो घंटे तक पुराने छूटे संदेश वितरित करता है। रिमोट SSH `cliPath` पर वह डेटाबेस नहीं पढ़ सकता, इसलिए रीप्ले असीमित होता है और प्रत्येक पंक्ति लाइव आयु-सीमा का उपयोग करती है—यह फिर भी हाल में छूटे संदेशों को पुनर्प्राप्त करता और पुराने बैकलॉग को दबाता है, लेकिन अधिक संकीर्ण लाइव विंडो के साथ। व्यापक पुनर्प्राप्ति विंडो के लिए Gateway को Messages वाले Mac पर चलाएँ।

### ऑपरेटर को दिखाई देने वाला संकेत

दबाए गए बैकलॉग को डिफ़ॉल्ट स्तर पर लॉग किया जाता है, उसे कभी चुपचाप नहीं हटाया जाता (`recovery` फ़्लैग दिखाता है कि कौन-सी विंडो लागू हुई):

```text
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### माइग्रेशन

`channels.imessage.catchup.*` अप्रचलित है—डाउनटाइम पुनर्प्राप्ति स्वचालित है और नए सेटअप के लिए किसी कॉन्फ़िग की आवश्यकता नहीं है। `catchup.enabled: true` वाले मौजूदा कॉन्फ़िग को पुनर्प्राप्ति रीप्ले विंडो की संगतता प्रोफ़ाइल के रूप में स्वीकार करना जारी रखा जाता है। अक्षम कैचअप ब्लॉक (`enabled: false` या कोई `enabled: true` नहीं) सेवानिवृत्त हो चुके हैं; `openclaw doctor --fix` उन्हें हटा देता है।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="imsg नहीं मिला या RPC असमर्थित है">
    बाइनरी और RPC समर्थन की पुष्टि करें:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    यदि प्रोब RPC के असमर्थित होने की रिपोर्ट करता है, तो `imsg` को अपडेट करें। यदि निजी API क्रियाएँ उपलब्ध नहीं हैं, तो लॉग-इन किए हुए macOS उपयोगकर्ता सत्र में `imsg launch` चलाएँ और फिर से प्रोब करें। यदि Gateway macOS पर नहीं चल रहा है, तो डिफ़ॉल्ट स्थानीय `imsg` पथ के बजाय ऊपर दिए गए SSH के माध्यम से Remote Mac सेटअप का उपयोग करें।

  </Accordion>

  <Accordion title="संदेश भेजे जाते हैं, लेकिन आने वाले iMessages प्राप्त नहीं होते">
    पहले सुनिश्चित करें कि संदेश स्थानीय Mac तक पहुँचा था या नहीं। यदि `chat.db` नहीं बदलता है, तो `imsg status --json` द्वारा ब्रिज के स्वस्थ होने की रिपोर्ट दिए जाने पर भी OpenClaw संदेश प्राप्त नहीं कर सकता।

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    यदि फ़ोन से भेजे गए संदेश कोई नई पंक्तियाँ नहीं बनाते हैं, तो OpenClaw कॉन्फ़िगरेशन बदलने से पहले macOS Messages और Apple Push परत को ठीक करें। सेवा को एक बार रीफ़्रेश करना अक्सर पर्याप्त होता है:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    OpenClaw सत्रों की डीबगिंग से पहले फ़ोन से एक नया iMessage भेजें और नई `chat.db` पंक्ति या `imsg watch` इवेंट की पुष्टि करें। इसे आवधिक ब्रिज-पुनःप्रारंभ लूप के रूप में न चलाएँ; सक्रिय कार्य के दौरान बार-बार `imsg launch` और Gateway पुनःप्रारंभ करने से डिलीवरी बाधित हो सकती हैं और जारी चैनल रन बीच में अटक सकते हैं।

  </Accordion>

  <Accordion title="Gateway macOS पर नहीं चल रहा है">
    डिफ़ॉल्ट `cliPath: "imsg"` को Messages में साइन इन किए हुए Mac पर चलना आवश्यक है। Linux या Windows पर, `channels.imessage.cliPath` को ऐसे रैपर स्क्रिप्ट पर सेट करें जो उस Mac से SSH के माध्यम से जुड़कर `imsg "$@"` चलाती हो।

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    फिर चलाएँ:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM अनदेखे किए जाते हैं">
    जाँचें:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - पेयरिंग अनुमोदन (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="समूह संदेश अनदेखे किए जाते हैं">
    जाँचें:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` अनुमति-सूची व्यवहार
    - उल्लेख पैटर्न कॉन्फ़िगरेशन (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="दूरस्थ अटैचमेंट विफल होते हैं">
    जाँचें:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - Gateway होस्ट से SSH/SCP कुंजी प्रमाणीकरण
    - Gateway होस्ट पर `~/.ssh/known_hosts` में होस्ट कुंजी मौजूद है
    - Messages चलाने वाले Mac पर दूरस्थ पथ की पठनीयता

  </Accordion>

  <Accordion title="macOS अनुमति संकेत छूट गए थे">
    समान उपयोगकर्ता/सत्र संदर्भ में किसी इंटरैक्टिव GUI टर्मिनल में फिर से चलाएँ और संकेतों को स्वीकृति दें:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    पुष्टि करें कि OpenClaw/`imsg` चलाने वाले प्रक्रिया संदर्भ को Full Disk Access + Automation प्रदान किए गए हैं।

  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन संदर्भ संकेतक

- [कॉन्फ़िगरेशन संदर्भ - iMessage](/hi/gateway/config-channels#imessage)
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [पेयरिंग](/hi/channels/pairing)

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [BlueBubbles को हटाना और imsg iMessage पथ](/hi/announcements/bluebubbles-imessage) — घोषणा और माइग्रेशन सारांश
- [BlueBubbles से स्थानांतरण](/hi/channels/imessage-from-bluebubbles) — कॉन्फ़िगरेशन अनुवाद तालिका और चरण-दर-चरण बदलाव
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) — अभिगम मॉडल और सुदृढ़ीकरण
