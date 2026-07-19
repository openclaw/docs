---
read_when:
    - Canvas होस्ट, टूल, कमांड, दस्तावेज़ या प्रोटोकॉल का स्वामित्व स्थानांतरित करना
    - यह ऑडिट करना कि Canvas अब भी कोर के स्वामित्व में है या नहीं
    - प्रायोगिक Canvas Plugin PR तैयार करना या उसकी समीक्षा करना
summary: Canvas को कोर से निकालकर एक बंडल किए गए प्रायोगिक Plugin में स्थानांतरित करने के लिए योजना और ऑडिट चेकलिस्ट।
title: Canvas Plugin का पुनर्गठन
x-i18n:
    generated_at: "2026-07-19T09:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ead3f865ea80acb1e47f45a5ab07acf19a6470035c00c81006b2b1230bedd71e
    source_path: refactor/canvas.md
    workflow: 16
---

# Canvas plugin रीफ़ैक्टर

Canvas का उपयोग कम है और यह प्रायोगिक है। इसे मुख्य सुविधा नहीं, बल्कि बंडल किए गए plugin के रूप में मानें। कोर सामान्य Gateway, Node, HTTP, प्रमाणीकरण, कॉन्फ़िगरेशन और नेटिव-क्लाइंट प्लंबिंग रख सकता है, लेकिन Canvas-विशिष्ट व्यवहार `extensions/canvas` के अंतर्गत होना चाहिए।

## लक्ष्य

वर्तमान युग्मित-Node व्यवहार को बनाए रखते हुए Canvas का स्वामित्व `extensions/canvas` में ले जाएँ:

- एजेंट के लिए उपलब्ध `canvas` टूल Canvas plugin द्वारा पंजीकृत किया जाता है
- Canvas Node कमांड केवल तभी अनुमत होते हैं, जब Canvas plugin उन्हें पंजीकृत करता है
- A2UI होस्ट/स्रोत फ़ाइलें Canvas plugin के अंतर्गत रहती हैं
- Canvas दस्तावेज़ मटेरियलाइज़ेशन Canvas plugin के अंतर्गत रहता है
- CLI कमांड कार्यान्वयन Canvas plugin के अंतर्गत रहता है या plugin-स्वामित्व वाले रनटाइम बैरल के माध्यम से प्रत्यायोजित होता है
- दस्तावेज़ और plugin इन्वेंट्री Canvas को प्रायोगिक और plugin-समर्थित बताते हैं

## गैर-लक्ष्य

- इस रीफ़ैक्टर में नेटिव ऐप के Canvas UI को पुनः डिज़ाइन न करें।
- iOS, Android या macOS से Canvas प्रोटोकॉल/क्लाइंट समर्थन तब तक न हटाएँ, जब तक किसी अलग उत्पाद निर्णय में Canvas को हटाने के लिए न कहा गया हो।
- केवल Canvas के लिए व्यापक plugin सेवा फ़्रेमवर्क न बनाएँ, जब तक कम-से-कम एक अन्य बंडल किए गए plugin को भी उसी सीम की आवश्यकता न हो।

## वर्तमान ब्रांच की स्थिति

पूर्ण:

- `extensions/canvas` में बंडल किया गया plugin पैकेज जोड़ा गया।
- `extensions/canvas/openclaw.plugin.json` जोड़ा गया।
- एजेंट `canvas` टूल को `src/agents/tools/canvas-tool.ts` से `extensions/canvas/src/tool.ts` में स्थानांतरित किया गया।
- `src/agents/openclaw-tools.ts` से `createCanvasTool` का कोर पंजीकरण हटाया गया।
- Canvas होस्ट कार्यान्वयन को `src/canvas-host` से `extensions/canvas/src/host` में स्थानांतरित किया गया।
- परीक्षणों, पैकेजिंग और बाहरी सार्वजनिक Canvas सहायकों के लिए `extensions/canvas/runtime-api.ts` को plugin-स्वामित्व वाले संगतता बैरल के रूप में बनाए रखा गया।
- Canvas दस्तावेज़ मटेरियलाइज़ेशन को `src/gateway/canvas-documents.ts` से `extensions/canvas/src/documents.ts` में स्थानांतरित किया गया।
- Canvas CLI कार्यान्वयन और A2UI JSONL सहायकों को `extensions/canvas/src/cli.ts` में स्थानांतरित किया गया।
- Canvas होस्ट URL और सीमित दायरे वाले क्षमता सहायकों को `extensions/canvas/src` में स्थानांतरित किया गया।
- Canvas Node कमांड डिफ़ॉल्ट को हार्डकोड की गई कोर सूचियों से निकालकर plugin `nodeInvokePolicies` में स्थानांतरित किया गया।
- `plugins.entries.canvas.config.host` में plugin-स्वामित्व वाला Canvas होस्ट कॉन्फ़िगरेशन जोड़ा गया।
- Canvas और A2UI HTTP सर्विंग को Canvas plugin के HTTP रूट पंजीकरण के पीछे स्थानांतरित किया गया।
- plugin-स्वामित्व वाले HTTP रूट के लिए सामान्य plugin WebSocket अपग्रेड डिस्पैच जोड़ा गया।
- Canvas-विशिष्ट Gateway होस्ट URL और Node क्षमता प्रमाणीकरण को सामान्य होस्ट की गई plugin सतह और Node क्षमता सहायकों से बदला गया।
- plugin-स्वामित्व वाले होस्टेड मीडिया रिज़ॉल्वर जोड़े गए, ताकि Canvas दस्तावेज़ URL का समाधान कोर द्वारा Canvas दस्तावेज़ के आंतरिक घटकों को इंपोर्ट करने के बजाय Canvas plugin के माध्यम से हो।
- `api.registerNodeCliFeature(...)` जोड़ा गया, ताकि Canvas पैरेंट कमांड पथ को मैन्युअल रूप से लिखे बिना `openclaw nodes canvas` को plugin-स्वामित्व वाली Node सुविधा घोषित कर सके।
- `extensions/canvas/runtime-api.js` के उत्पादन `src/**` इंपोर्ट हटाए गए।
- A2UI बंडल स्रोत को `apps/shared/OpenClawKit/Tools/CanvasA2UI` से `extensions/canvas/src/host/a2ui-app` में स्थानांतरित किया गया।
- A2UI बिल्ड/कॉपी कार्यान्वयन को `extensions/canvas/scripts` के अंतर्गत स्थानांतरित किया गया और रूट बिल्ड वायरिंग को सामान्य बंडल किए गए plugin एसेट हुक से बदला गया।
- रनटाइम का पुराना शीर्ष-स्तरीय `canvasHost` कॉन्फ़िगरेशन उपनाम हटाया गया।
- Canvas डॉक्टर माइग्रेशन बनाए रखा गया, ताकि `openclaw doctor --fix` पुराने `canvasHost` कॉन्फ़िगरेशन को `plugins.entries.canvas.config.host` में पुनः लिखे।
- Gateway प्रोटोकॉल v4 के पीछे पुराने एजेंट की Canvas प्रोटोकॉल संगतता हटाई गई। नेटिव क्लाइंट और Gateway अब केवल `pluginSurfaceUrls.canvas` तथा `node.pluginSurface.refresh` का उपयोग करते हैं; इस प्रायोगिक रीफ़ैक्टर में अप्रचलित `canvasHostUrl`, `canvasCapability` और `node.canvas.capability.refresh` पथ जानबूझकर असमर्थित हैं।
- Canvas को शामिल करने के लिए जनरेट की गई plugin इन्वेंट्री अपडेट की गई।
- `docs/plugins/reference/canvas.md` में plugin संदर्भ दस्तावेज़ जोड़े गए।

ज्ञात शेष कोर-स्वामित्व वाली Canvas सतहें:

- `apps/` के अंतर्गत नेटिव ऐप Canvas हैंडलर अभी भी जानबूझकर Canvas plugin सतह का उपयोग करते हैं
- `apps/` के अंतर्गत नेटिव ऐप Canvas प्रोटोकॉल/क्लाइंट हैंडलर
- प्रकाशित आर्टिफ़ैक्ट आउटपुट अभी भी पश्चगामी-संगत रनटाइम लुकअप के लिए `dist/canvas-host/a2ui` का उपयोग करता है, लेकिन कॉपी चरण अब plugin-स्वामित्व वाला है

## लक्षित संरचना

`extensions/canvas` के स्वामित्व में ये होने चाहिए:

- plugin मैनिफ़ेस्ट और पैकेज मेटाडेटा
- एजेंट टूल पंजीकरण
- Node इनवोक कमांड नीति
- Canvas होस्ट और A2UI रनटाइम
- Canvas A2UI बंडल स्रोत और एसेट बिल्ड/कॉपी स्क्रिप्ट
- Canvas दस्तावेज़ निर्माण और एसेट समाधान
- Canvas CLI कार्यान्वयन
- Canvas दस्तावेज़ पृष्ठ और plugin इन्वेंट्री प्रविष्टि

कोर के स्वामित्व में केवल सामान्य सीम होने चाहिए:

- plugin खोज और पंजीकरण
- सामान्य एजेंट टूल रजिस्ट्री
- सामान्य Node इनवोक नीति रजिस्ट्री
- सामान्य Gateway HTTP/प्रमाणीकरण और WebSocket अपग्रेड डिस्पैच
- सामान्य होस्ट की गई plugin सतह का URL समाधान
- सामान्य होस्टेड मीडिया रिज़ॉल्वर पंजीकरण
- सामान्य Node क्षमता ट्रांसपोर्ट
- सामान्य कॉन्फ़िगरेशन प्लंबिंग
- सामान्य बंडल किए गए plugin एसेट हुक की खोज

नेटिव ऐप प्रोटोकॉल के क्लाइंट के रूप में Canvas कमांड हैंडलर रख सकते हैं। वे plugin रनटाइम के स्वामी नहीं हैं।

## माइग्रेशन चरण

1. `plugins.entries.canvas.config.host` को plugin-स्वामित्व वाली कॉन्फ़िगरेशन सतह के रूप में मानें।
2. दस्तावेज़ अपडेट करें, ताकि Canvas को प्रायोगिक बंडल किए गए plugin के रूप में वर्णित किया जाए।
3. Canvas के केंद्रित परीक्षण, plugin इन्वेंट्री जाँच, plugin SDK API जाँच और रनटाइम सीमाओं से प्रभावित बिल्ड/टाइप गेट चलाएँ।

## ऑडिट चेकलिस्ट

रीफ़ैक्टर को पूर्ण घोषित करने से पहले:

- `rg "src/canvas-host|../canvas-host"` कोई सक्रिय स्रोत इंपोर्ट नहीं लौटाता।
- `rg "canvas-tool|createCanvasTool" src` कोर-स्वामित्व वाला कोई Canvas टूल कार्यान्वयन नहीं खोजता।
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` सामान्य plugin नीति परीक्षणों के बाहर हार्डकोड किए गए किसी अनुमति-सूची डिफ़ॉल्ट को नहीं खोजता।
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` खाली है।
- `rg "canvas-documents" src` खाली है।
- `rg "registerNodesCanvasCommands|nodes-canvas" src` खाली है; Canvas plugin नेस्टेड plugin CLI मेटाडेटा के माध्यम से `openclaw nodes canvas` को पंजीकृत करता है।
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` कोई Gateway रनटाइम स्वामित्व नहीं लौटाता।
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` केवल संगतता रैपर या plugin-स्वामित्व वाले पथ खोजता है।
- `pnpm plugins:inventory:check` सफल होता है।
- `pnpm plugin-sdk:api:check` सफल होता है, या जनरेट किए गए API अनुबंध रिकॉर्ड जानबूझकर अपडेट और समीक्षित किए गए हैं।
- लक्षित Canvas परीक्षण सफल होते हैं।
- Canvas होस्ट/A2UI पथों के लिए परिवर्तित-लेन परीक्षण सफल होते हैं।
- PR विवरण स्पष्ट रूप से बताता है कि Canvas प्रायोगिक और plugin-समर्थित है।

## सत्यापन कमांड

पुनरावृत्ति के दौरान लक्षित स्थानीय जाँच का उपयोग करें:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

यदि रनटाइम बैरल, लेज़ी इंपोर्ट, पैकेजिंग या प्रकाशित plugin सतहें बदलती हैं, तो पुश से पहले `pnpm build` चलाएँ।
