---
read_when:
    - Moving Canvas होस्ट, टूल, कमांड, दस्तावेज़ या प्रोटोकॉल स्वामित्व
    - यह ऑडिट करना कि Canvas अभी भी कोर-स्वामित्व में है या नहीं
    - प्रयोगात्मक Canvas Plugin PR तैयार करना या उसकी समीक्षा करना
summary: Canvas को core से बाहर निकालकर bundled experimental plugin में ले जाने की योजना और audit checklist.
title: Canvas Plugin रिफैक्टर
x-i18n:
    generated_at: "2026-06-29T00:05:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Canvas Plugin रिफैक्टर

Canvas कम उपयोग वाला और प्रयोगात्मक है। इसे कोर सुविधा नहीं, बल्कि बंडल किए गए Plugin के रूप में मानें। कोर सामान्य Gateway, Node, HTTP, प्रमाणीकरण, कॉन्फिगरेशन, और नेटिव-क्लाइंट प्लंबिंग रख सकता है, लेकिन Canvas-विशिष्ट व्यवहार `extensions/canvas` के अंतर्गत रहना चाहिए।

## लक्ष्य

वर्तमान पेयर्ड-Node व्यवहार को सुरक्षित रखते हुए Canvas स्वामित्व को `extensions/canvas` में ले जाएं:

- एजेंट-उन्मुख `canvas` टूल Canvas Plugin द्वारा पंजीकृत होता है
- Canvas Node कमांड केवल तब अनुमत होते हैं जब Canvas Plugin उन्हें पंजीकृत करता है
- A2UI होस्ट/स्रोत फ़ाइलें Canvas Plugin के अंतर्गत रहती हैं
- Canvas दस्तावेज़ मटेरियलाइज़ेशन Canvas Plugin के अंतर्गत रहता है
- CLI कमांड कार्यान्वयन Canvas Plugin के अंतर्गत रहता है, या Plugin-स्वामित्व वाले रनटाइम बैरल के माध्यम से प्रतिनिधि करता है
- दस्तावेज़ और Plugin इन्वेंटरी Canvas को प्रयोगात्मक और Plugin-समर्थित के रूप में वर्णित करते हैं

## गैर-लक्ष्य

- इस रिफैक्टर में नेटिव ऐप Canvas UI को फिर से डिज़ाइन न करें।
- iOS, Android, या macOS से Canvas प्रोटोकॉल/क्लाइंट समर्थन न हटाएं, जब तक कोई अलग उत्पाद निर्णय यह न कहे कि Canvas हटाया जाना चाहिए।
- केवल Canvas के लिए व्यापक Plugin सेवा फ़्रेमवर्क न बनाएं, जब तक कम से कम एक अन्य बंडल किए गए Plugin को उसी सीम की आवश्यकता न हो।

## वर्तमान ब्रांच स्थिति

पूर्ण:

- `extensions/canvas` में बंडल किया गया Plugin पैकेज जोड़ा।
- `extensions/canvas/openclaw.plugin.json` जोड़ा।
- एजेंट `canvas` टूल को `src/agents/tools/canvas-tool.ts` से `extensions/canvas/src/tool.ts` में ले जाया।
- `src/agents/openclaw-tools.ts` से `createCanvasTool` का कोर पंजीकरण हटाया।
- Canvas होस्ट कार्यान्वयन को `src/canvas-host` से `extensions/canvas/src/host` में ले जाया।
- परीक्षणों, पैकेजिंग, और बाहरी सार्वजनिक Canvas हेल्पर के लिए `extensions/canvas/runtime-api.ts` को Plugin-स्वामित्व वाले संगतता बैरल के रूप में रखा।
- Canvas दस्तावेज़ मटेरियलाइज़ेशन को `src/gateway/canvas-documents.ts` से `extensions/canvas/src/documents.ts` में ले जाया।
- Canvas CLI कार्यान्वयन और A2UI JSONL हेल्पर को `extensions/canvas/src/cli.ts` में ले जाया।
- Canvas होस्ट URL और स्कोप्ड क्षमता हेल्पर को `extensions/canvas/src` में ले जाया।
- Canvas Node कमांड डिफ़ॉल्ट को हार्डकोडेड कोर सूचियों से हटाकर Plugin `nodeInvokePolicies` में ले जाया।
- `plugins.entries.canvas.config.host` पर Plugin-स्वामित्व वाला Canvas होस्ट कॉन्फिगरेशन जोड़ा।
- Canvas और A2UI HTTP सर्विंग को Canvas Plugin HTTP रूट पंजीकरण के पीछे ले जाया।
- Plugin-स्वामित्व वाले HTTP रूट के लिए सामान्य Plugin WebSocket अपग्रेड डिस्पैच जोड़ा।
- Canvas-विशिष्ट Gateway होस्ट URL और Node क्षमता प्रमाणीकरण को सामान्य होस्टेड Plugin सतह और Node क्षमता हेल्पर से बदला।
- Plugin-स्वामित्व वाले होस्टेड मीडिया रिज़ॉल्वर जोड़े, ताकि Canvas दस्तावेज़ URL कोर द्वारा Canvas दस्तावेज़ आंतरिक भागों को इम्पोर्ट करने के बजाय Canvas Plugin के माध्यम से रिज़ॉल्व हों।
- `api.registerNodeCliFeature(...)` जोड़ा, ताकि Canvas पैरेंट कमांड पाथ को मैन्युअल रूप से लिखे बिना `openclaw nodes canvas` को Plugin-स्वामित्व वाली Node सुविधा के रूप में घोषित कर सके।
- `extensions/canvas/runtime-api.js` के उत्पादन `src/**` इम्पोर्ट हटाए।
- A2UI बंडल स्रोत को `apps/shared/OpenClawKit/Tools/CanvasA2UI` से `extensions/canvas/src/host/a2ui-app` में ले जाया।
- A2UI बिल्ड/कॉपी कार्यान्वयन को `extensions/canvas/scripts` के अंतर्गत ले जाया और रूट बिल्ड वायरिंग को सामान्य बंडल किए गए-Plugin एसेट हुक से बदला।
- रनटाइम लेगेसी शीर्ष-स्तरीय `canvasHost` कॉन्फिगरेशन उपनाम हटाया।
- Canvas डॉक्टर माइग्रेशन रखा, ताकि `openclaw doctor --fix` पुराने `canvasHost` कॉन्फिगरेशन को `plugins.entries.canvas.config.host` में फिर से लिखे।
- Gateway प्रोटोकॉल v4 के पीछे पुराने-एजेंट Canvas प्रोटोकॉल संगतता हटाई। नेटिव क्लाइंट और Gateway अब केवल `pluginSurfaceUrls.canvas` तथा `node.pluginSurface.refresh` का उपयोग करते हैं; इस प्रयोगात्मक रिफैक्टर में अप्रचलित `canvasHostUrl`, `canvasCapability`, और `node.canvas.capability.refresh` पाथ जानबूझकर असमर्थित है।
- Canvas शामिल करने के लिए जनरेट की गई Plugin इन्वेंटरी अपडेट की।
- `docs/plugins/reference/canvas.md` पर Plugin संदर्भ दस्तावेज़ जोड़े।

ज्ञात शेष कोर-स्वामित्व वाली Canvas सतहें:

- `apps/` के अंतर्गत नेटिव ऐप Canvas हैंडलर अभी भी जानबूझकर Canvas Plugin सतह का उपयोग करते हैं
- `apps/` के अंतर्गत नेटिव ऐप Canvas प्रोटोकॉल/क्लाइंट हैंडलर
- प्रकाशित आर्टिफैक्ट आउटपुट अभी भी पीछे-संगत रनटाइम लुकअप के लिए `dist/canvas-host/a2ui` का उपयोग करता है, लेकिन कॉपी चरण अब Plugin-स्वामित्व वाला है

## लक्षित आकार

`extensions/canvas` को इनका स्वामी होना चाहिए:

- Plugin मैनिफेस्ट और पैकेज मेटाडेटा
- एजेंट टूल पंजीकरण
- Node invoke कमांड नीति
- Canvas होस्ट और A2UI रनटाइम
- Canvas A2UI बंडल स्रोत और एसेट बिल्ड/कॉपी स्क्रिप्ट
- Canvas दस्तावेज़ निर्माण और एसेट रिज़ॉल्यूशन
- Canvas CLI कार्यान्वयन
- Canvas दस्तावेज़ पेज और Plugin इन्वेंटरी प्रविष्टि

कोर को केवल सामान्य सीम का स्वामी होना चाहिए:

- Plugin खोज और पंजीकरण
- सामान्य एजेंट टूल रजिस्ट्री
- सामान्य Node invoke नीति रजिस्ट्री
- सामान्य Gateway HTTP/प्रमाणीकरण और WebSocket अपग्रेड डिस्पैच
- सामान्य होस्टेड Plugin सतह URL रिज़ॉल्यूशन
- सामान्य होस्टेड मीडिया रिज़ॉल्वर पंजीकरण
- सामान्य Node क्षमता ट्रांसपोर्ट
- सामान्य कॉन्फिगरेशन प्लंबिंग
- सामान्य बंडल किए गए-Plugin एसेट हुक खोज

नेटिव ऐप प्रोटोकॉल के क्लाइंट के रूप में Canvas कमांड हैंडलर रख सकते हैं। वे Plugin रनटाइम स्वामी नहीं हैं।

## माइग्रेशन चरण

1. `plugins.entries.canvas.config.host` को Plugin-स्वामित्व वाली कॉन्फिगरेशन सतह मानें।
2. दस्तावेज़ अपडेट करें, ताकि Canvas को प्रयोगात्मक बंडल किए गए Plugin के रूप में वर्णित किया जाए।
3. केंद्रित Canvas परीक्षण, Plugin इन्वेंटरी जांच, Plugin SDK API जांच, और रनटाइम सीमाओं से प्रभावित बिल्ड/टाइप गेट चलाएं।

## ऑडिट चेकलिस्ट

रिफैक्टर को पूर्ण कहने से पहले:

- `rg "src/canvas-host|../canvas-host"` कोई लाइव स्रोत इम्पोर्ट नहीं लौटाता।
- `rg "canvas-tool|createCanvasTool" src` कोई कोर-स्वामित्व वाला Canvas टूल कार्यान्वयन नहीं पाता।
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` सामान्य Plugin नीति परीक्षणों के बाहर कोई हार्डकोडेड अनुमति-सूची डिफ़ॉल्ट नहीं पाता।
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` खाली है।
- `rg "canvas-documents" src` खाली है।
- `rg "registerNodesCanvasCommands|nodes-canvas" src` खाली है; Canvas Plugin नेस्टेड Plugin CLI मेटाडेटा के माध्यम से `openclaw nodes canvas` पंजीकृत करता है।
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` कोई Gateway रनटाइम स्वामित्व नहीं लौटाता।
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` केवल संगतता रैपर या Plugin-स्वामित्व वाले पाथ पाता है।
- `pnpm plugins:inventory:check` पास होता है।
- `pnpm plugin-sdk:api:check` पास होता है, या जनरेट की गई API बेसलाइन जानबूझकर अपडेट और समीक्षा की गई हैं।
- लक्षित Canvas परीक्षण पास होते हैं।
- Canvas होस्ट/A2UI पाथ के लिए बदली-लेन परीक्षण पास होते हैं।
- PR बॉडी स्पष्ट रूप से कहती है कि Canvas प्रयोगात्मक और Plugin-समर्थित है।

## सत्यापन कमांड

दोहराव के दौरान लक्षित स्थानीय जांचों का उपयोग करें:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

यदि रनटाइम बैरल, लेज़ी इम्पोर्ट, पैकेजिंग, या प्रकाशित Plugin सतहें बदलती हैं, तो पुश से पहले `pnpm build` चलाएं।
