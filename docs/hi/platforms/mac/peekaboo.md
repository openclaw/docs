---
read_when:
    - OpenClaw.app में PeekabooBridge होस्ट करना
    - Swift Package Manager के माध्यम से Peekaboo एकीकृत करना
    - PeekabooBridge प्रोटोकॉल/पाथ बदलना
    - PeekabooBridge, Codex Computer Use, और cua-driver MCP के बीच निर्णय लेना
summary: macOS UI स्वचालन के लिए PeekabooBridge एकीकरण
title: छुपन-छुपाई सेतु
x-i18n:
    generated_at: "2026-06-28T23:29:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw **PeekabooBridge** को एक स्थानीय, अनुमति-जागरूक UI ऑटोमेशन
ब्रोकर के रूप में होस्ट कर सकता है। इससे `peekaboo` CLI UI ऑटोमेशन चला सकता है,
साथ ही macOS ऐप की TCC अनुमतियों का पुनः उपयोग कर सकता है।

## यह क्या है (और क्या नहीं है)

- **होस्ट**: OpenClaw.app PeekabooBridge होस्ट के रूप में काम कर सकता है।
- **क्लाइंट**: `peekaboo` CLI का उपयोग करें (कोई अलग `openclaw ui ...` सतह नहीं)।
- **UI**: दृश्य ओवरले Peekaboo.app में रहते हैं; OpenClaw एक पतला ब्रोकर होस्ट है।

## Computer Use से संबंध

OpenClaw में तीन डेस्कटॉप-नियंत्रण पथ हैं, और उन्हें जानबूझकर अलग रखा गया है:

- **PeekabooBridge होस्ट**: OpenClaw.app स्थानीय PeekabooBridge सॉकेट को होस्ट कर सकता है।
  `peekaboo` CLI क्लाइंट बना रहता है और स्क्रीनशॉट, क्लिक,
  मेनू, डायलॉग, Dock कार्रवाइयों और विंडो प्रबंधन जैसे Peekaboo ऑटोमेशन प्रिमिटिव्स के लिए OpenClaw.app की macOS
  अनुमतियों का उपयोग करता है।
- **Codex Computer Use**: बंडल किया गया `codex` Plugin Codex app-server तैयार करता है,
  सत्यापित करता है कि Codex का `computer-use` MCP सर्वर उपलब्ध है, और फिर
  Codex-mode टर्न के दौरान Codex को नेटिव डेस्कटॉप-नियंत्रण टूल कॉल्स का स्वामित्व देता है। OpenClaw
  उन कार्रवाइयों को PeekabooBridge के माध्यम से प्रॉक्सी नहीं करता।
- **प्रत्यक्ष `cua-driver` MCP**: OpenClaw TryCua के अपस्ट्रीम
  `cua-driver mcp` सर्वर को सामान्य MCP सर्वर के रूप में रजिस्टर कर सकता है। इससे एजेंटों को Codex marketplace या PeekabooBridge सॉकेट के माध्यम से रूट किए बिना CUA
  ड्राइवर के अपने स्कीमा और pid/window/element-index वर्कफ़्लो मिलते हैं।

जब आप व्यापक macOS ऑटोमेशन सतह और OpenClaw.app का
अनुमति-जागरूक ब्रिज होस्ट चाहते हों, तब Peekaboo का उपयोग करें। जब Codex-mode एजेंट को
Codex के नेटिव computer-use Plugin पर निर्भर होना चाहिए, तब Codex Computer Use का उपयोग करें। जब आप CUA ड्राइवर को किसी भी OpenClaw-प्रबंधित runtime के सामने सामान्य
MCP सर्वर के रूप में प्रस्तुत करना चाहते हों, तब प्रत्यक्ष `cua-driver mcp` का उपयोग करें।

## ब्रिज सक्षम करें

macOS ऐप में:

- Settings → **Peekaboo Bridge सक्षम करें**

सक्षम होने पर, OpenClaw एक स्थानीय UNIX सॉकेट सर्वर शुरू करता है। अक्षम होने पर, होस्ट
बंद कर दिया जाता है और `peekaboo` अन्य उपलब्ध होस्ट पर वापस चला जाएगा।

## क्लाइंट खोज क्रम

Peekaboo क्लाइंट सामान्यतः इस क्रम में होस्ट आजमाते हैं:

1. Peekaboo.app (पूर्ण UX)
2. Claude.app (यदि इंस्टॉल हो)
3. OpenClaw.app (पतला ब्रोकर)

कौन सा होस्ट सक्रिय है और कौन सा सॉकेट पथ उपयोग में है, यह देखने के लिए `peekaboo bridge status --verbose` का उपयोग करें। आप इसके साथ ओवरराइड कर सकते हैं:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## सुरक्षा और अनुमतियां

- ब्रिज **कॉलर कोड हस्ताक्षरों** को सत्यापित करता है; TeamIDs की allowlist
  लागू की जाती है (Peekaboo होस्ट TeamID + OpenClaw ऐप TeamID)।
- Accessibility के लिए सामान्य `node` runtime के बजाय हस्ताक्षरित ब्रिज/ऐप पहचान को
  प्राथमिकता दें। `node` को Accessibility देने से उस Node executable द्वारा लॉन्च किया गया
  कोई भी पैकेज GUI ऑटोमेशन पहुंच विरासत में ले सकता है; देखें
  [macOS अनुमतियां](/hi/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)।
- अनुरोध लगभग 10 सेकंड के बाद टाइम आउट हो जाते हैं।
- यदि आवश्यक अनुमतियां अनुपस्थित हैं, तो ब्रिज System Settings लॉन्च करने के बजाय
  एक स्पष्ट त्रुटि संदेश लौटाता है।

## स्नैपशॉट व्यवहार (ऑटोमेशन)

स्नैपशॉट मेमोरी में संग्रहीत होते हैं और छोटी अवधि के बाद स्वतः समाप्त हो जाते हैं।
यदि आपको लंबी अवधि तक रखना है, तो क्लाइंट से फिर से कैप्चर करें।

## समस्या निवारण

- यदि `peekaboo` "bridge client is not authorized" रिपोर्ट करता है, तो सुनिश्चित करें कि क्लाइंट
  ठीक से हस्ताक्षरित है या होस्ट को केवल **debug** मोड में `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  के साथ चलाएं।
- यदि कोई होस्ट नहीं मिलता है, तो किसी एक होस्ट ऐप (Peekaboo.app या OpenClaw.app)
  को खोलें और पुष्टि करें कि अनुमतियां दी गई हैं।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [macOS अनुमतियां](/hi/platforms/mac/permissions)
