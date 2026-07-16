---
read_when:
    - IPC अनुबंधों या मेनू बार ऐप IPC का संपादन
summary: OpenClaw ऐप, Gateway Node ट्रांसपोर्ट और PeekabooBridge के लिए macOS IPC आर्किटेक्चर
title: macOS IPC
x-i18n:
    generated_at: "2026-07-16T15:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC आर्किटेक्चर

एक स्थानीय Unix सॉकेट, exec अनुमोदनों और `system.run` के लिए Node होस्ट सेवा को macOS ऐप से जोड़ता है। खोज/कनेक्शन जाँच के लिए एक `openclaw-mac` डीबग CLI (`apps/macos/Sources/OpenClawMacCLI`) उपलब्ध है; एजेंट क्रियाएँ अब भी Gateway WebSocket और `node.invoke` के माध्यम से प्रवाहित होती हैं। Node-समर्थित `computer.act` पथ, एम्बेडेड Peekaboo ऑटोमेशन को उसी प्रोसेस में चलाता है; स्वतंत्र Peekaboo क्लाइंट PeekabooBridge का उपयोग करते हैं।

## लक्ष्य

- एकल GUI ऐप इंस्टेंस, जो TCC से संबंधित सभी कार्यों (सूचनाएँ, स्क्रीन रिकॉर्डिंग, माइक, वाक्, AppleScript) का स्वामी हो।
- ऑटोमेशन के लिए एक छोटा इंटरफ़ेस: Gateway + Node कमांड, इन-प्रोसेस `computer.act`, और स्वतंत्र UI ऑटोमेशन क्लाइंट के लिए PeekabooBridge।
- पूर्वानुमेय अनुमतियाँ: हमेशा वही हस्ताक्षरित बंडल ID, जिसे launchd द्वारा लॉन्च किया जाए, ताकि TCC अनुदान बने रहें।

## यह कैसे काम करता है

### Gateway + Node ट्रांसपोर्ट

- ऐप Gateway (स्थानीय मोड) चलाता है और उससे Node के रूप में कनेक्ट होता है।
- एजेंट क्रियाएँ `node.invoke` के माध्यम से की जाती हैं (उदाहरण के लिए `system.run`, `system.notify`, `canvas.*`)।
- Node कमांड में `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run`, और `system.notify` शामिल हैं।
- Node एक `permissions` मैप रिपोर्ट करता है, ताकि एजेंट देख सकें कि स्क्रीन, कैमरा, माइक्रोफ़ोन, वाक्, ऑटोमेशन या एक्सेसिबिलिटी एक्सेस उपलब्ध है या नहीं।

### Node सेवा + ऐप IPC

- एक हेडलेस Node होस्ट सेवा Gateway WebSocket से कनेक्ट होती है।
- `system.run` अनुरोधों को स्थानीय Unix सॉकेट (`ExecApprovalsSocket.swift`) पर macOS ऐप को अग्रेषित किया जाता है।
- ऐप UI संदर्भ में exec करता है, आवश्यकता होने पर संकेत देता है, और आउटपुट लौटाता है।

आरेख (SCI):

```text
एजेंट -> Gateway -> Node सेवा (WS)
                      |  IPC (UDS + टोकन + HMAC + TTL)
                      v
                  Mac ऐप (UI + TCC + system.run)
```

### PeekabooBridge (UI ऑटोमेशन)

- अंतर्निहित एजेंट `computer` टूल इस सॉकेट का उपयोग **नहीं** करता। युग्मित macOS Node, एम्बेडेड Peekaboo सेवाओं के साथ ऐप प्रोसेस में `computer.act` को पूरा करता है।
- UI ऑटोमेशन एक अलग UNIX सॉकेट (`~/Library/Application Support/OpenClaw/<socket>`) और PeekabooBridge JSON प्रोटोकॉल का उपयोग करता है।
- होस्ट वरीयता क्रम (क्लाइंट-साइड): Peekaboo.app -> Claude.app -> OpenClaw.app -> स्थानीय निष्पादन।
- सुरक्षा: ब्रिज होस्ट के लिए अनुमत-सूची में शामिल TeamID आवश्यक है (बंडल किया गया `PeekabooBridgeHostCoordinator` एक निश्चित टीम और ऐप की अपनी हस्ताक्षर टीम को अनुमत-सूची में रखता है); केवल DEBUG में उपलब्ध समान-UID अपवाद को `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (Peekaboo परंपरा) द्वारा सुरक्षित किया जाता है।
- विवरण के लिए देखें: [PeekabooBridge का उपयोग](/hi/platforms/mac/peekaboo)।

## संचालन प्रवाह

- पुनः आरंभ/पुनर्निर्माण: `scripts/restart-mac.sh` मौजूदा इंस्टेंस बंद करता है, Swift के माध्यम से पुनर्निर्माण करता है, फिर से पैकेज करता है और पुनः लॉन्च करता है। यह उपलब्ध हस्ताक्षर पहचान का स्वतः पता लगाता है और कोई पहचान न मिलने पर `--no-sign` पर वापस लौटता है; हस्ताक्षर अनिवार्य करने के लिए `--sign` पास करें (कोई कुंजी उपलब्ध न होने पर विफल होता है), या अहस्ताक्षरित पथ को बाध्य करने के लिए `--no-sign` पास करें। वातावरण में सेट `SIGN_IDENTITY` को हस्ताक्षरित पथ पर अनसेट कर दिया जाता है, ताकि `scripts/codesign-mac-app.sh` की अपनी पहचान स्वतः-पहचान प्रमाणपत्र चुन सके।
- एकल इंस्टेंस: ऐप डुप्लिकेट बंडल ID के लिए `NSWorkspace.runningApplications` की जाँच करता है और एक से अधिक इंस्टेंस मिलने पर बाहर निकल जाता है (`MenuBar.swift` में `isDuplicateInstance()`)।

## सुरक्षा-सुदृढ़ीकरण संबंधी टिप्पणियाँ

- सभी विशेषाधिकार-प्राप्त इंटरफ़ेस के लिए TeamID मिलान अनिवार्य करना बेहतर है।
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (केवल DEBUG) स्थानीय विकास के लिए समान-UID कॉलर की अनुमति दे सकता है।
- सभी संचार केवल स्थानीय बने रहते हैं; कोई नेटवर्क सॉकेट उजागर नहीं किया जाता।
- TCC संकेत केवल GUI ऐप बंडल से उत्पन्न होते हैं; पुनर्निर्माणों के दौरान हस्ताक्षरित बंडल ID को स्थिर रखें।
- Exec अनुमोदन सॉकेट का सुरक्षा-सुदृढ़ीकरण: फ़ाइल मोड `0600`, साझा टोकन, पीयर-UID जाँच (`getpeereid`), HMAC-SHA256 चुनौती/प्रतिक्रिया, और अनुरोधों पर छोटी TTL।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [macOS IPC प्रवाह (Exec अनुमोदन)](/hi/tools/exec-approvals-advanced#macos-ipc-flow)
