---
read_when:
    - आपको किसी Plugin से कोर हेल्पर्स को कॉल करना है (TTS, STT, इमेज जनरेशन, वेब खोज, Gateway, सबएजेंट, नोड्स)
    - आप समझना चाहते हैं कि api.runtime क्या उजागर करता है
    - आप Plugin कोड से कॉन्फ़िगरेशन, एजेंट या मीडिया सहायकों को एक्सेस कर रहे हैं
sidebarTitle: Runtime helpers
summary: api.runtime -- plugins के लिए उपलब्ध इंजेक्ट किए गए runtime सहायक साधन
title: Plugin रनटाइम सहायक फ़ंक्शन
x-i18n:
    generated_at: "2026-07-20T07:16:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 197ccf047ccefddbd515ace9f1ce195e998f3fbafcb65ee80282bf67f0c6ab8d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

हर plugin में पंजीकरण के दौरान इंजेक्ट किए गए `api.runtime` ऑब्जेक्ट का संदर्भ। होस्ट के आंतरिक घटकों को सीधे इम्पोर्ट करने के बजाय इन सहायकों का उपयोग करें।

<CardGroup cols={2}>
  <Card title="चैनल plugins" href="/hi/plugins/sdk-channel-plugins">
    चरण-दर-चरण मार्गदर्शिका, जो चैनल plugins के संदर्भ में इन सहायकों का उपयोग करती है।
  </Card>
  <Card title="प्रोवाइडर plugins" href="/hi/plugins/sdk-provider-plugins">
    चरण-दर-चरण मार्गदर्शिका, जो प्रोवाइडर plugins के संदर्भ में इन सहायकों का उपयोग करती है।
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` वर्तमान OpenClaw उत्पाद संस्करण है, जिसे साझा संस्करण रिज़ॉल्वर से प्राप्त किया जाता है, ताकि plugins को वही मान दिखे जिसकी रिपोर्ट CLI करता है।

## कॉन्फ़िग लोड करना और लिखना

उस कॉन्फ़िग को प्राथमिकता दें जो सक्रिय कॉल पथ में पहले ही पास किया जा चुका है, उदाहरण के लिए पंजीकरण के दौरान `api.config` या चैनल/प्रोवाइडर कॉलबैक पर `cfg` आर्ग्युमेंट। इससे हॉट पथों पर कॉन्फ़िग को दोबारा पार्स करने के बजाय एक ही प्रोसेस स्नैपशॉट पूरे कार्य में प्रवाहित होता रहता है।

`api.runtime.config.current()` का उपयोग केवल तब करें जब किसी दीर्घकालिक हैंडलर को वर्तमान प्रोसेस स्नैपशॉट चाहिए और उस फ़ंक्शन को कोई कॉन्फ़िग पास नहीं किया गया हो। लौटाया गया मान केवल-पढ़ने योग्य है; संपादन से पहले उसे क्लोन करें या किसी म्यूटेशन सहायक का उपयोग करें।

टूल फ़ैक्टरियों को `ctx.runtimeConfig` के साथ `ctx.getRuntimeConfig()` मिलता है। यदि टूल की परिभाषा बनने के बाद कॉन्फ़िग बदल सकता है, तो दीर्घकालिक टूल के `execute` कॉलबैक के भीतर गेटर का उपयोग करें।

परिवर्तनों को `api.runtime.config.mutateConfigFile(...)` या `api.runtime.config.replaceConfigFile(...)` से स्थायी बनाएँ। प्रत्येक लेखन के लिए स्पष्ट `afterWrite` नीति चुनना आवश्यक है:

- `afterWrite: { mode: "auto" }` Gateway के रीलोड प्लानर को निर्णय लेने देता है।
- `afterWrite: { mode: "restart", reason: "..." }` तब स्वच्छ रीस्टार्ट बाध्य करता है, जब राइटर जानता हो कि हॉट रीलोड असुरक्षित है।
- `afterWrite: { mode: "none", reason: "..." }` स्वचालित रीलोड/रीस्टार्ट को केवल तभी रोकता है, जब कॉलर अनुवर्ती कार्रवाई का स्वामी हो।

म्यूटेशन सहायक `afterWrite` के साथ टाइप किया हुआ `followUp` सारांश लौटाते हैं, ताकि कॉलर लॉग कर सकें या जाँच सकें कि उन्होंने रीस्टार्ट का अनुरोध किया था या नहीं। वह रीस्टार्ट वास्तव में कब होता है, इसका स्वामित्व फिर भी Gateway के पास रहता है।

रनटाइम कॉन्फ़िग एक्सेस और लेखन के लिए `current()`, पास किया गया `cfg`, `mutateConfigFile(...)`, या
`replaceConfigFile(...)` उपयोग करें।

प्रत्यक्ष SDK इम्पोर्ट के लिए व्यापक `openclaw/plugin-sdk/config-runtime` संगतता बैरल के बजाय केंद्रित कॉन्फ़िग उपपथों को प्राथमिकता दें: टाइप्स के लिए `config-contracts`, वर्तमान प्रोसेस स्नैपशॉट के लिए `runtime-config-snapshot`, और लेखन के लिए `config-mutation`। एंट्री-स्कोप वाले मान `api.pluginConfig` से पढ़ें; दिए गए टूल संदर्भ का उपयोग केवल उसके रनटाइम-व्यापी कॉन्फ़िग स्नैपशॉट के लिए करें, और plugin-विशिष्ट मर्जिंग को उसी सीमा पर रखें। बंडल किए गए plugin परीक्षणों को व्यापक संगतता बैरल को मॉक करने के बजाय इन केंद्रित उपपथों को सीधे मॉक करना चाहिए।

OpenClaw का आंतरिक रनटाइम कोड भी इसी दिशा का पालन करता है: CLI, Gateway, या प्रोसेस सीमा पर कॉन्फ़िग को एक बार लोड करें, फिर उस मान को आगे पास करें। सफल म्यूटेशन लेखन प्रोसेस रनटाइम स्नैपशॉट को रीफ़्रेश करते हैं और उसके आंतरिक रिविज़न को आगे बढ़ाते हैं; दीर्घकालिक कैशों को कॉन्फ़िग को स्थानीय रूप से सीरियलाइज़ करने के बजाय रनटाइम-स्वामित्व वाली कैश कुंजी पर आधारित होना चाहिए। दीर्घकालिक रनटाइम मॉड्यूल में परिवेशी `loadConfig()` कॉल के लिए शून्य-सहनशीलता स्कैनर होता है; पास किया गया `cfg`, अनुरोध का `context.getRuntimeConfig()`, या स्पष्ट प्रोसेस सीमा पर `getRuntimeConfig()` उपयोग करें।

प्रोवाइडर और चैनल निष्पादन पथों को सक्रिय रनटाइम कॉन्फ़िग स्नैपशॉट का उपयोग करना आवश्यक है, न कि कॉन्फ़िग रीडबैक या संपादन के लिए लौटाए गए फ़ाइल स्नैपशॉट का। फ़ाइल स्नैपशॉट UI और लेखन के लिए SecretRef मार्कर जैसे स्रोत मानों को सुरक्षित रखते हैं; प्रोवाइडर कॉलबैक को रिज़ॉल्व किया हुआ रनटाइम दृश्य चाहिए। जब किसी सहायक को सक्रिय स्रोत स्नैपशॉट या सक्रिय रनटाइम स्नैपशॉट, दोनों में से किसी के साथ कॉल किया जा सकता हो, तो क्रेडेंशियल पढ़ने से पहले `selectApplicableRuntimeConfig()` के माध्यम से रूट करें।

## पुनः उपयोग योग्य रनटाइम उपयोगिताएँ

बॉट द्वारा लिखे गए इनबाउंड संदेशों के लिए इनबाउंड `botLoopProtection` तथ्यों का उपयोग करें। कोर सत्र रिकॉर्ड और डिस्पैच से पहले साझा इन-मेमोरी स्लाइडिंग-विंडो गार्ड लागू करता है, बिना नीति को किसी एक चैनल से बाँधे। गार्ड `(scopeId, conversationId, participant pair)` कुंजियों को ट्रैक करता है, किसी जोड़ी की दोनों दिशाओं को एक साथ गिनता है, विंडो बजट पार होने पर कूलडाउन लागू करता है, और निष्क्रिय प्रविष्टियों को अवसरानुसार हटाता है।

इस व्यवहार को ऑपरेटरों के लिए उपलब्ध कराने वाले चैनल plugins को आधारभूत बजट के लिए साझा `channels.defaults.botLoopProtection` आकार को प्राथमिकता देनी चाहिए, फिर उसके ऊपर चैनल/प्रोवाइडर-विशिष्ट ओवरराइड जोड़ने चाहिए। साझा कॉन्फ़िग सेकंड का उपयोग करता है क्योंकि यह उपयोगकर्ता-दृश्य है:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

रिज़ॉल्व किए गए टर्न के साथ सामान्यीकृत बॉट-जोड़ी तथ्य पास करें। कोर डिफ़ॉल्ट, इकाई रूपांतरण, और `enabled` सिमैंटिक्स रिज़ॉल्व करता है:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

`openclaw/plugin-sdk/pair-loop-guard-runtime` का सीधे उपयोग केवल उन कस्टम
दो-पक्षीय इवेंट लूप के लिए करें जो साझा इनबाउंड उत्तर रनर से नहीं गुजरते।

## रनटाइम नेमस्पेस

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    एजेंट पहचान, डायरेक्टरियाँ, और सत्र प्रबंधन।

    ```typescript
    // एजेंट की कार्यशील डायरेक्टरी रिज़ॉल्व करें (agentId आवश्यक है)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // एजेंट वर्कस्पेस रिज़ॉल्व करें
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // एजेंट पहचान प्राप्त करें
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // डिफ़ॉल्ट चिंतन स्तर प्राप्त करें
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // उपयोगकर्ता द्वारा दिए गए चिंतन स्तर को सक्रिय प्रोवाइडर प्रोफ़ाइल के विरुद्ध सत्यापित करें
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // स्तर को एम्बेडेड रन में पास करें
    }

    // एजेंट टाइमआउट प्राप्त करें
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // सुनिश्चित करें कि वर्कस्पेस मौजूद है
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // एम्बेडेड एजेंट टर्न चलाएँ
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "नवीनतम परिवर्तनों का सारांश दें",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` plugin कोड से सामान्य OpenClaw एजेंट टर्न शुरू करने का तटस्थ सहायक है। यह चैनल द्वारा ट्रिगर किए गए उत्तरों के समान प्रोवाइडर/मॉडल रिज़ॉल्यूशन और एजेंट-हार्नेस चयन का उपयोग करता है।

    `runEmbeddedPiAgent(...)` मौजूदा plugins के लिए बहिष्कृत संगतता उपनाम के रूप में बना हुआ है। नए कोड को `runEmbeddedAgent(...)` उपयोग करना चाहिए।

    `resolveCliBackendDispatchEligibility({ provider, model, agentId, authProfileId, config, agentDir, workspaceDir })` एम्बेडेड रनर का CLI-बैकएंड डिस्पैच निर्णय (रूट, बैकएंड की घोषित `subscriptionAuthDispatch` क्षमता, संग्रहित क्रेडेंशियल मोड—स्पष्ट रूप से पिन किए गए `authProfileId` का सम्मान करते हुए) उन कॉलर के साथ साझा करता है जो एम्बेडेड रन को `cliBackendDispatch: "subscription-auth"` में शामिल करते हैं। जब रन CLI बैकएंड के माध्यम से निष्पादित होगा, तब यह `{ provider }` लौटाता है, और जब वह प्रत्यक्ष पासथ्रू पर रहता है, तब `undefined` लौटाता है, ताकि कॉलर वास्तव में निष्पादित होने वाले रन के लिए टाइमआउट बजट निर्धारित कर सकें।

    `resolveThinkingPolicy(...)` प्रोवाइडर/मॉडल के समर्थित चिंतन स्तर और वैकल्पिक डिफ़ॉल्ट लौटाता है। प्रोवाइडर plugins अपने चिंतन हुक के माध्यम से मॉडल-विशिष्ट प्रोफ़ाइल के स्वामी होते हैं, इसलिए टूल plugins को प्रोवाइडर सूचियाँ इम्पोर्ट या डुप्लिकेट करने के बजाय इस रनटाइम सहायक को कॉल करना चाहिए।

    `normalizeThinkingLevel(...)` उपयोगकर्ता टेक्स्ट, जैसे `on`, `x-high`, या `extra high`, को रिज़ॉल्व की गई नीति के विरुद्ध जाँचने से पहले कैनॉनिकल संग्रहित स्तर में बदलता है।

    **सत्र स्टोर सहायक** `api.runtime.agent.session` के अंतर्गत हैं:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // पुराने sessions.json आकार पर निर्भर हुए बिना सत्र पंक्तियों पर पुनरावृत्ति करें।
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // सत्र बनाएँ या अपडेट करें, फिर स्वीकृत एजेंट रन को signal पास करें।
      },
    );
    ```

    सत्र कार्यप्रवाहों के लिए `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)`, या `upsertSessionEntry(...)` को प्राथमिकता दें। ये सहायक एजेंट/सत्र पहचान द्वारा सत्रों को संबोधित करते हैं, ताकि plugins पुराने `sessions.json` स्टोरेज आकार पर निर्भर न हों। केवल-मेटाडेटा पैच, जिन्हें सत्र गतिविधि रीफ़्रेश नहीं करनी चाहिए, उनके लिए `preserveActivity: true` उपयोग करें, और `replaceEntry: true` केवल तभी उपयोग करें जब कॉलबैक पूर्ण प्रविष्टि लौटाता हो और हटाए गए फ़ील्ड हटे ही रहने चाहिए। डॉक्टर और माइग्रेशन पथ एक परमाण्विक कैनॉनिकल-स्टोर सुधार के लिए `fallbackEntry`, `skipMaintenance`, और `requireWriteSuccess` को संयोजित कर सकते हैं।

    `createSessionEntry(...)` नई कैनॉनिकल सत्र पंक्ति और ट्रांसक्रिप्ट बनाता है। इसकी विश्वसनीय `initialEntry` सतह जानबूझकर सीमित है: गैर-रिक्त `agentHarnessId`, वैकल्पिक `modelSelectionLocked: true`, और वैकल्पिक `pluginExtensions`। इंजेक्ट किया गया रनटाइम केवल `registerAgentHarness(...)` के माध्यम से कॉल करने वाले plugin के स्वामित्व वाली हार्नेस आईडी स्वीकार करता है; यह स्वामित्व संबंधी अपरिवर्तनीय नियम है, इन-प्रोसेस plugins के बीच सैंडबॉक्स नहीं। यह मौजूदा पंक्ति को अस्वीकार करता है; `label` और `spawnedCwd` विश्वसनीय-प्रविष्टि पैच के बजाय अलग निर्माण फ़ील्ड हैं।

    निर्माण `afterCreate` के माध्यम से सत्र जीवनचक्र म्यूटेशन फ़ेंस को थामे रखता है, इसलिए नया कार्य plugin-स्वामित्व वाली आरंभिक प्रक्रिया पूरी होने की प्रतीक्षा करता है और पहले से स्वीकृत कार्य निर्माण को विफल कर देता है। कॉलबैक को बनाई गई स्थिति का क्लोन मिलता है। यदि वह पैच लौटाता है, तो उस पैच में केवल `pluginExtensions` हो सकता है, और उसका मान पूर्ण अंतिम `pluginExtensions` फ़ील्ड होता है। कॉलबैक या अंतिम स्थायित्व विफलता अपरिवर्तित नई पंक्ति और ट्रांसक्रिप्ट को रोल बैक करती है; संरक्षित रोलबैक समवर्ती रूप से बदली या अधिगृहीत पंक्ति को सुरक्षित रखता है। `recoverMatchingInitialEntry: true` केवल बाधित आरंभिक प्रक्रिया को दोबारा आज़माने के लिए है, जब स्थायी विश्वसनीय फ़ील्ड बिल्कुल मेल खाते हों, और रिकवरी के लिए `afterCreate` का अंतिम पैच लौटाना आवश्यक है।

    जब कोई plugin स्थायी सत्र पर कार्य शुरू करता है, तब `runWithWorkAdmission(...)` उपयोग करें। कॉलबैक आर्काइव किए गए या समवर्ती रूप से बदले गए सत्रों को अस्वीकार करता है, आर्काइव/रीसेट/डिलीट म्यूटेशन को पूर्णता तक समन्वित रखता है, और उसे एक `AbortSignal` मिलता है जिसे एजेंट रन को अग्रेषित करना आवश्यक है। कोई हार्नेस अपने प्रायोगिक `delegatedExecutionPluginIds` पंजीकरण फ़ील्ड के माध्यम से विश्वसनीय निष्पादन प्रतिनिधियों को स्पष्ट रूप से नामित कर सकता है। प्रतिनिधि केवल हूबहू मौजूदा मॉडल-लॉक सत्र को स्वीकार और चला सकते हैं; सभी सत्र म्यूटेशन हार्नेस स्वामी तक ही सीमित रहते हैं। [एजेंट हार्नेस plugins](/hi/plugins/sdk-agent-harness#delegated-execution) देखें।

    रखरखाव और मरम्मत Plugin एक सीमित-सत्र प्रविष्टि के लिए `deleteSessionEntry(...)`, जीवनचक्र-स्वामित्व वाले अस्थायी सत्रों के लिए `cleanupSessionLifecycleArtifacts(...)`, और किसी स्टोर में बदलाव करने से पहले `resolveSessionStoreBackupPaths(...)` का उपयोग कर सकते हैं। जब विलोपन की किसी समवर्ती सत्र अपडेट से रेस नहीं होनी चाहिए, तब `expectedSessionId` और `expectedUpdatedAt` पास करें; जब पहले के स्नैपशॉट में कोई सत्र आईडी नहीं थी, तब `expectedSessionId: null` का उपयोग करें। ये हेल्पर सीमित मरम्मत/जीवनचक्र सतहें हैं, कोई सामान्य स्टोर विलोपन API नहीं।

    `resolveStorePath(...)` और `updateSessionStoreEntry(...)` सत्र हेल्परों को पूर्ण करते हैं: `resolveStorePath` दिए गए स्कोप के लिए सत्र स्टोर पथ का समाधान करता है, और जब कॉलर उसे पहले से जानता हो, तब `updateSessionStoreEntry({ storePath, sessionKey, update })` स्टोर पथ के आधार पर सीधे एक प्रविष्टि को पैच करता है।

    `loadTranscriptEventsSync(...)` उन समकालिक डॉक्टर और मरम्मत पथों के लिए उपलब्ध है जो एसिंक ट्रांसक्रिप्ट रनटाइम का उपयोग नहीं कर सकते। यह कच्चे `SessionStoreTranscriptEvent` रिकॉर्ड लौटाता है। सामान्य Plugin रनटाइम कोड में `openclaw/plugin-sdk/session-transcript-runtime` को प्राथमिकता देनी चाहिए।

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)`, और `sqliteSessionFileMarkerMatchesSession(...)` उस कोड के लिए संक्रमणकालीन हेल्पर हैं जिसे अभी भी `sessionFile` नाम का पुराना फ़ील्ड प्राप्त होता है। पार्स किया गया SQLite मार्कर किसी सक्रिय SQLite ट्रांसक्रिप्ट लक्ष्य की पहचान करता है; यह फ़ाइल सिस्टम पथ नहीं है। नई API को मार्कर स्ट्रिंग के बजाय टाइप की गई सत्र पहचान रखनी चाहिए।

    ट्रांसक्रिप्ट पढ़ने और लिखने के लिए, `openclaw/plugin-sdk/session-transcript-runtime` आयात करें और `{ agentId, sessionKey, sessionId }` के साथ `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readSessionTranscriptRawDelta(...)`, `readSessionTranscriptVisibleMessageDelta(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)`, या `withSessionTranscriptWriteLock(...)` का उपयोग करें। ये API Plugin को सक्रिय ट्रांसक्रिप्ट फ़ाइल पथों पर निर्भर हुए बिना किसी ट्रांसक्रिप्ट की पहचान करने, कच्चे ईवेंट या दृश्य शाखा-सुरक्षित संदेश प्रविष्टियाँ पढ़ने, संदेश जोड़ने, अपडेट प्रकाशित करने, और उसी ट्रांसक्रिप्ट लेखन लॉक के अंतर्गत संबंधित संचालन चलाने देती हैं। `readVisibleSessionTranscriptMessageEntries(...)` क्रमबद्ध पठन मेटाडेटा लौटाता है; उसका `seq` फ़ील्ड पुनः आरंभ करने योग्य कर्सर नहीं है।

    `readSessionTranscriptRawDelta(...)` एक सीमित `page`, `reset`, या `missing` परिणाम लौटाता है। अपारदर्शी `page.cursor` को अगली कॉल में पास करें। केवल जोड़ने वाले संचालन कर्सर को बनाए रखते हैं, जबकि ट्रांसक्रिप्ट प्रतिस्थापन नए बूटस्ट्रैप कर्सर के साथ `reset` लौटाता है। पेज डिफ़ॉल्ट रूप से 1,000 ईवेंट और 1,000,000 क्रमबद्ध बाइट तक सीमित होते हैं; कॉलर अधिकतम 10,000 ईवेंट और 64 MiB का अनुरोध कर सकते हैं। जब केवल अगला ईवेंट ही `maxBytes` से बड़ा हो, तो पेज खाली होता है और `requiredBytes` की सूचना देता है; यदि वह बाइट सीमा 64 MiB से अधिक न हो, तो कम-से-कम उसी सीमा के साथ दोबारा प्रयास करें। इससे बड़े अलग-अलग ईवेंट के लिए पूर्ण-पठन API आवश्यक है। कर्सर केवल स्थिति की पहचान करता है और कभी भी दूसरे सत्र तक पहुँच प्रदान नहीं करता।

    `readSessionTranscriptVisibleMessageDelta(...)` होस्ट-स्वामित्व वाले सक्रिय संदेश प्रक्षेपण पर वही सीमित बूटस्ट्रैप-और-पुनरारंभ संरचना प्रदान करता है। यह संदेशों को सबसे पुराने से नवीनतम क्रम में लौटाता है, ताकि संदर्भ इंजन आरंभिक इतिहास को पूरी तरह ग्रहण कर सकें और अपारदर्शी कर्सर को अपने वॉटरमार्क के रूप में बनाए रख सकें। कर्सर को बिना बदले संग्रहित और वापस करें; यह निरंतरता संकेत है, प्राधिकरण क्रेडेंशियल नहीं। रैखिक जोड़ अंतिम लौटाए गए संदेश के बाद से पुनः आरंभ होते हैं। ट्रांसक्रिप्ट प्रतिस्थापन, ऐसा कर्सर जिसका एंकर सक्रिय शाखा से बाहर हो गया या उसके भीतर स्थानांतरित हो गया, विकृत कर्सर, और क्रॉस-सत्र कर्सर नए बूटस्ट्रैप कर्सर के साथ `reset` लौटाते हैं। संख्या और बाइट के डिफ़ॉल्ट तथा अधिकतम सीमाएँ कच्चे डेल्टा API के समान हैं। शाखा परिवर्तन के बाद सक्रिय प्रक्षेपण के पुनर्निर्माण के दौरान, परिणाम कारण `projection_rebuilding` के साथ `unavailable` होता है; सक्रिय ट्रांसक्रिप्ट फ़ाइल का फ़ॉलबैक उपयोग करने के बजाय बाद में पुनः प्रयास करें।

    पुराने संपूर्ण-स्टोर और सक्रिय ट्रांसक्रिप्ट फ़ाइल हेल्पर अब Plugin SDK से निर्यात नहीं किए जाते। सत्र मेटाडेटा के लिए सीमित प्रविष्टि हेल्परों और सक्रिय ट्रांसक्रिप्ट संचालन के लिए ट्रांसक्रिप्ट पहचान हेल्परों का उपयोग करें। जिन अभिलेख/सहायता कार्यप्रवाहों को फ़ाइल आर्टिफ़ैक्ट चाहिए, उन्हें सक्रिय सत्र रनटाइम API के बजाय अपनी समर्पित अभिलेख सतहों का उपयोग करना चाहिए।

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    डिफ़ॉल्ट मॉडल और प्रदाता स्थिरांक:

    ```typescript
    const model = api.runtime.agent.defaults.model; // उदाहरण: "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // उदाहरण: "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    प्रदाता के आंतरिक भागों को आयात किए बिना या OpenClaw के मॉडल/प्रमाणीकरण/आधार URL की तैयारी की नकल किए बिना होस्ट-स्वामित्व वाली टेक्स्ट पूर्णता चलाएँ।

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "इस ट्रांसक्रिप्ट का सारांश दें।" }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
      reasoning: "high",
    });
    ```

    प्रदाता ऑर्केस्ट्रेशन HTTP अनुरोध जारी करने से पहले कॉन्फ़िगर की गई स्थानीय-सेवा का जीवनचक्र भी प्राप्त कर सकता है:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // प्रदाता अनुरोध भेजें और उसका पूर्ण उपभोग करें।
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` एक स्थिर, सामान्य प्रदाता-सेवा SDK अनुबंध है। होस्ट `models.providers.<providerId>.localService` से प्रक्रिया कॉन्फ़िगरेशन का समाधान करता है; कॉलर कोई कमांड, आर्ग्युमेंट, परिवेश या जीवनचक्र नीति प्रदान नहीं कर सकते। प्रक्रिया आरंभ करना, तत्परता, निदान और निष्क्रियता पर रोकने की नीति होस्ट के आंतरिक भाग बने रहते हैं।

    सटीक कॉन्फ़िगर की गई प्रदाता आईडी और समाधान किया गया अनुरोध आधार URL पास करें। उपनामों को अडैप्टर आईडी से न बदलें: अलग-अलग उपनाम अलग-अलग स्थानीय GPU होस्ट की ओर संकेत कर सकते हैं। Ollama और LM Studio अडैप्टर द्वारा उपयोग किए जाने वाले `/v1` सामान्यीकरण को छोड़कर, होस्ट उन एंडपॉइंट को अस्वीकार करता है जो कॉन्फ़िगर किए गए प्रदाता आधार URL से मेल नहीं खाते। आरंभ क्रमबद्धता, तत्परता जाँच, अनुरोध लीज़, निरस्तीकरण प्रबंधन और निष्क्रिय शटडाउन का स्वामित्व होस्ट के पास है।

    यह हेल्पर OpenClaw के अंतर्निहित रनटाइम के समान सरल-पूर्णता तैयारी पथ और होस्ट-स्वामित्व वाले रनटाइम कॉन्फ़िग स्नैपशॉट का उपयोग करता है। संदर्भ इंजनों को सत्र-बद्ध `llm.complete` क्षमता मिलती है, इसलिए मॉडल कॉल सक्रिय सत्र के एजेंट का उपयोग करती हैं और चुपचाप डिफ़ॉल्ट एजेंट पर फ़ॉलबैक नहीं करतीं। उपलब्ध होने पर परिणाम में प्रदाता/मॉडल/एजेंट अभिसूचना के साथ सामान्यीकृत टोकन, कैश और अनुमानित लागत उपयोग शामिल होता है।

    चयनित मॉडल के लिए रीजनिंग प्रयास का अनुरोध करने हेतु `reasoning` सेट करें। पूर्णता भेजने से पहले होस्ट चयनित प्रदाता और मॉडल के लिए मानक थिंकिंग स्तरों (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max`, और `ultra`) को सामान्यीकृत करता है। `adaptive`, `medium` बन जाता है; समर्थित होने पर `max` और `ultra`, `max` बन जाते हैं, अन्यथा `xhigh`।

    <Warning>
    मॉडल ओवरराइड के लिए कॉन्फ़िग में `plugins.entries.<id>.llm.allowModelOverride: true` के माध्यम से ऑपरेटर की स्पष्ट सहमति आवश्यक है। विश्वसनीय Plugin को विशिष्ट मानक `provider/model` लक्ष्यों तक सीमित करने के लिए `plugins.entries.<id>.llm.allowedModels` का उपयोग करें। क्रॉस-एजेंट पूर्णताओं के लिए `plugins.entries.<id>.llm.allowAgentIdOverride: true` आवश्यक है।
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    वर्तमान Plugin की विश्वसनीय रनटाइम पहचान बनाए रखते हुए प्रक्रिया के भीतर किसी अन्य Gateway विधि को कॉल करें। यह उन बंडल किए गए या विश्वसनीय आधिकारिक Plugin के लिए है जो लूपबैक WebSocket कनेक्शन खोले बिना Plugin-स्वामित्व वाली Gateway क्षमताओं को संयोजित करते हैं।

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    अनुरोध `operator.write` स्कोप का उपयोग करते हैं और एडमिन स्कोप प्रदान नहीं करते। मनमाने बाहरी Plugin से आने वाली कॉल अस्वीकार कर दी जाती हैं। विफल विधियाँ एक `GatewayClientRequestError` थ्रो करती हैं, जिससे संरचित `details`, पुनः प्रयास मेटाडेटा और पुनर्प्राप्ति प्रवाहों के लिए Gateway त्रुटि कोड सुरक्षित रहते हैं। ऐसे टूल से यह पथ चुनने से पहले `isAvailable()` का उपयोग करें जो स्टैंडअलोन एजेंट प्रक्रियाओं में भी चल सकते हैं।

  </Accordion>
  <Accordion title="api.runtime.subagent">
    पृष्ठभूमि सबएजेंट रन आरंभ और प्रबंधित करें।

    ```typescript
    // एक सबएजेंट रन आरंभ करें
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "इस क्वेरी को केंद्रित अनुवर्ती खोजों में विस्तारित करें।",
      toolsAlsoAllow: ["my_plugin_progress"],
      provider: "openai", // वैकल्पिक ओवरराइड
      model: "gpt-5.6-sol", // वैकल्पिक ओवरराइड
      deliver: false,
    });

    // पूर्ण होने की प्रतीक्षा करें
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // सत्र संदेश पढ़ें
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // सत्र हटाएँ
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    मॉडल ओवरराइड (`provider`/`model`) के लिए कॉन्फ़िग में `plugins.entries.<id>.subagent.allowModelOverride: true` के माध्यम से ऑपरेटर की स्पष्ट सहमति आवश्यक है। अविश्वसनीय Plugin फिर भी सबएजेंट चला सकते हैं, लेकिन ओवरराइड अनुरोध अस्वीकार कर दिए जाते हैं।
    </Warning>

    `toolsAlsoAllow` कॉल करने वाले Plugin द्वारा पंजीकृत सटीक, विशिष्ट स्वामित्व वाले टूल को वर्कर की सामान्य टूल सतह में जोड़ता है। रनटाइम मुख्य टूल और किसी अन्य Plugin के साथ साझा नामों को अस्वीकार करता है। स्पष्ट अनुमतिसूचियों और निषेधों सहित प्रोफ़ाइल और ऑपरेटर टूल नीतियाँ फिर भी लागू होती हैं।

    `deleteSession(...)`, उसी Plugin द्वारा `api.runtime.subagent.run(...)` के माध्यम से बनाए गए सत्रों को हटा सकता है। मनमाने उपयोगकर्ता या ऑपरेटर सत्रों को हटाने के लिए अब भी एडमिन-स्कोप वाले Gateway अनुरोध की आवश्यकता होती है।

  </Accordion>
  <Accordion title="api.runtime.sandbox">
    किसी एजेंट सत्र के लिए प्रभावी सैंडबॉक्स कार्यस्थान प्राधिकार का निरीक्षण करें।

    ```typescript
    const authority = api.runtime.sandbox.resolveWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
    });

    const liveAuthority = await api.runtime.sandbox.prepareWorkspaceAuthority({
      config: cfg,
      agentId,
      sessionKey,
      workspaceDir,
      confinedToolNames: ["my_plugin_safe_tool"],
    });
    ```

    परिणाम बताता है कि क्या यह सत्र सैंडबॉक्स में है, क्या इसका कार्यस्थान अनुपलब्ध, केवल-पढ़ने योग्य या लिखने योग्य है, और जब प्रभावी Docker, टूल, सत्र, ब्राउज़र या उन्नत नीति उस कार्यस्थान से बाहर निकल सकती हो, तब एक वैकल्पिक `confinementError` देता है। इसका उपयोग उन होस्ट-स्वामित्व वाले प्रत्यायोजन निर्णयों के लिए करें जिनमें किसी वर्कर को उसके कॉलर से अधिक प्राधिकार नहीं दिया जाना चाहिए। यह एक सत्यापन हेल्पर है, कॉलर के अपने प्राधिकरण की जाँच का प्रतिस्थापन नहीं।

    `prepareWorkspaceAuthority(...)` वही नीति जाँच करता है और `workspaceDir` के लिए Docker सैंडबॉक्स भी तैयार करता है। यह ऐसे सक्रिय कंटेनर को अस्वीकार करता है जिसका लाइव कॉन्फ़िग हैश अनुरोधित माउंट या नीति से मेल नहीं खाता। केवल उन्हीं सटीक टूल नामों को पास करें जिनके पंजीकृत कार्यान्वयन को कॉल करने वाला Plugin सीमित करता है; वाइल्डकार्ड प्रीफ़िक्स टूल स्वामित्व सिद्ध नहीं करते।

  </Accordion>
  <Accordion title="api.runtime.nodes">
    कनेक्टेड Node सूचीबद्ध करें और Gateway द्वारा लोड किए गए Plugin कोड या Plugin CLI कमांड से किसी Node-होस्ट कमांड को लागू करें। इसका उपयोग तब करें जब कोई Plugin किसी युग्मित डिवाइस पर स्थानीय कार्य का स्वामी हो, उदाहरण के लिए किसी अन्य Mac पर ब्राउज़र या ऑडियो ब्रिज।

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    जब कोई कनेक्टेड Node एजेंट के लिए Plugin या MCP-समर्थित टूल उपलब्ध कराता है, तब `nodes.list(...)` में उस Node के विज्ञापित `nodePluginTools` विवरणक शामिल होते हैं। वे विवरणक लाइव कनेक्शन स्थिति हैं: Node के डिस्कनेक्ट होने पर Gateway उन्हें हटा देता है, और स्थानीय Plugin/MCP इन्वेंट्री में परिवर्तन के बाद कोई Node उन्हें `node.pluginTools.update` से बदल सकता है।

    Gateway के भीतर यह रनटाइम इन-प्रोसेस होता है। Plugin CLI कमांड में यह कॉन्फ़िगर किए गए Gateway को RPC के माध्यम से कॉल करता है, इसलिए `openclaw googlemeet recover-tab` जैसे कमांड टर्मिनल से पेयर किए गए नोड का निरीक्षण कर सकते हैं। नोड कमांड अब भी सामान्य Gateway नोड पेयरिंग, कमांड अनुमति-सूचियों, Plugin नोड-इनवोक नीतियों और नोड-स्थानीय कमांड प्रबंधन से होकर गुजरते हैं।

    नोड-होस्टेड एजेंट टूल उपलब्ध कराने वाले Plugins, ऐसे गैर-खतरनाक कमांड के लिए `agentTool.defaultPlatforms` सेट कर सकते हैं जिन्हें डिफ़ॉल्ट रूप से अनुमति-सूची में होना चाहिए। जब ऑपरेटरों के लिए `gateway.nodes.allowCommands` के माध्यम से स्पष्ट रूप से अनुमति देना आवश्यक हो, तो इसे छोड़ दें। खतरनाक नोड-होस्ट कमांड को `api.registerNodeInvokePolicy(...)` के साथ नोड-इनवोक नीति पंजीकृत करनी चाहिए; यह नीति कमांड अनुमति-सूची जाँच के बाद और कमांड को नोड पर अग्रेषित किए जाने से पहले Gateway में चलती है, इसलिए सीधे `node.invoke` कॉल, नोड-होस्टेड Plugin टूल और उच्च-स्तरीय Plugin टूल एक ही प्रवर्तन पथ साझा करते हैं।

    <Warning>
    वैकल्पिक `scopes` फ़ील्ड इनवोकेशन के लिए Gateway ऑपरेटर स्कोप का अनुरोध करता है। OpenClaw इसे केवल बंडल किए गए Plugins और विश्वसनीय आधिकारिक Plugin इंस्टॉलेशन के लिए स्वीकार करता है; अन्य Plugins के अनुरोध कॉल के विशेषाधिकार नहीं बढ़ाते। इसका उपयोग केवल तब करें जब किसी विश्वसनीय Plugin को `operator.admin` जैसे अधिक सख्त Gateway स्कोप वाले नोड कमांड को इनवोक करना आवश्यक हो।
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Task Flow और Task Run स्थिति को किसी मौजूदा OpenClaw सेशन कुंजी या विश्वसनीय टूल संदर्भ से बाँधें।

    - `api.runtime.tasks.managedFlows` परिवर्तन करने में सक्षम है: Task Flows बनाएँ, आगे बढ़ाएँ और रद्द करें।
    - `api.runtime.tasks.flows` और `api.runtime.tasks.runs` सूचीकरण और स्थिति लुकअप के लिए केवल-पढ़ने योग्य DTO दृश्य हैं; दोनों `bindSession(...)` / `fromToolContext(...)` के साथ-साथ `get`, `list`, `findLatest` और `resolve` उपलब्ध कराते हैं।

    Task Flow टिकाऊ बहु-चरणीय वर्कफ़्लो स्थिति को ट्रैक करता है। यह शेड्यूलर नहीं है:
    भविष्य में सक्रिय करने के लिए Cron या `api.session.workflow.scheduleSessionTurn(...)` का उपयोग करें,
    फिर शेड्यूल किए गए टर्न से `managedFlows` का उपयोग तब करें जब उस कार्य
    के लिए फ़्लो स्थिति, चाइल्ड टास्क, प्रतीक्षा या रद्दीकरण आवश्यक हो।

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "नए पुल रिक्वेस्ट की समीक्षा करें",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "PR #123 की समीक्षा करें",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    जब आपकी अपनी बाइंडिंग परत से पहले से कोई विश्वसनीय OpenClaw सेशन कुंजी उपलब्ध हो, तब `bindSession({ sessionKey, requesterOrigin })` का उपयोग करें। अपरिष्कृत उपयोगकर्ता इनपुट से बाइंड न करें।

  </Accordion>
  <Accordion title="api.runtime.tts">
    टेक्स्ट-टू-स्पीच संश्लेषण।

    ```typescript
    // मानक TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "OpenClaw की ओर से नमस्ते",
      cfg: api.config,
    });

    // टेलीफ़ोनी-अनुकूलित TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "OpenClaw की ओर से नमस्ते",
      cfg: api.config,
    });

    // उपलब्ध आवाज़ों की सूची बनाएँ
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    मुख्य `messages.tts` कॉन्फ़िगरेशन और प्रदाता चयन का उपयोग करता है। PCM ऑडियो बफ़र + सैंपल दर लौटाता है। स्ट्रीमिंग संश्लेषण के लिए `textToSpeechStream` भी उपलब्ध है।

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    छवि, ऑडियो और वीडियो विश्लेषण।

    ```typescript
    // किसी छवि का वर्णन करें
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // ऑडियो का प्रतिलेखन करें
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // वैकल्पिक, जब MIME का अनुमान नहीं लगाया जा सकता
    });

    // किसी वीडियो का वर्णन करें
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // सामान्य फ़ाइल विश्लेषण
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // किसी विशिष्ट प्रदाता/मॉडल के माध्यम से संरचित छवि निष्कर्षण।
    // कम-से-कम एक छवि शामिल करें; टेक्स्ट इनपुट पूरक संदर्भ हैं।
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "हस्तलिखित नोट के बजाय मुद्रित कुल राशि को प्राथमिकता दें।" },
      ],
      instructions: "विक्रेता, कुल राशि और खोजने योग्य टैग निकालें।",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    कोई आउटपुट उत्पन्न न होने पर `{ text: undefined }` लौटाता है (उदाहरण के लिए, छोड़ा गया इनपुट)।

    `describeImageFileWithModel(...)` किसी विशिष्ट प्रदाता/मॉडल के माध्यम से पहले से ज्ञात छवि का वर्णन करता है और `describeImageFile(...)` द्वारा उपयोग किए जाने वाले डिफ़ॉल्ट सक्रिय-मॉडल रिज़ॉल्यूशन को बायपास करता है।

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    छवि निर्माण।

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "सूर्यास्त को चित्रित करता हुआ एक रोबोट",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    छवि निर्माण के स्वरूप के अनुरूप वीडियो निर्माण।

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "सूर्योदय के समय समुद्रतट के ऊपर उड़ता हुआ ड्रोन शॉट",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    छवि निर्माण के स्वरूप के अनुरूप संगीत निर्माण।

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "कोडिंग सत्र के लिए एक उत्साहपूर्ण लो-फ़ाई ट्रैक",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    वेब खोज।

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    निम्न-स्तरीय मीडिया उपयोगिताएँ।

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    वर्तमान रनटाइम कॉन्फ़िगरेशन स्नैपशॉट और ट्रांज़ैक्शनल कॉन्फ़िगरेशन लेखन। सक्रिय कॉल पथ में
    पहले से पास किए गए कॉन्फ़िगरेशन को प्राथमिकता दें; `current()` का उपयोग
    केवल तब करें जब हैंडलर को सीधे प्रोसेस स्नैपशॉट की आवश्यकता हो।

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` और `replaceConfigFile(...)` एक `followUp`
    मान लौटाते हैं, उदाहरण के लिए `{ mode: "restart", requiresRestart: true, reason }`,
    जो Gateway से पुनः आरंभ नियंत्रण लिए बिना लेखक के आशय को दर्ज करता है।

  </Accordion>
  <Accordion title="api.runtime.system">
    सिस्टम-स्तरीय उपयोगिताएँ।

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // बहिष्कृत संगतता उपनाम।
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` सामान्य संयोजन टाइमर को बायपास करते हुए एक Heartbeat चक्र तुरंत चलाता है। डिफ़ॉल्ट `target: "none"` दमन के बजाय अंतिम सक्रिय चैनल पर डिलीवरी बाध्य करने के लिए `{ heartbeat: { target: "last" } }` पास करें।

    `runCommandWithTimeout(...)` कैप्चर किए गए `stdout` और `stderr`, वैकल्पिक
    ट्रंकेशन गणनाएँ, `code`, `signal`, `killed`, `termination` और
    `noOutputTimedOut` लौटाता है। जब चाइल्ड प्रोसेस गैर-शून्य एग्ज़िट कोड प्रदान नहीं करता, तब टाइमआउट और नो-आउटपुट-टाइमआउट परिणाम `code: 124`
    रिपोर्ट करते हैं। गैर-टाइमआउट
    सिग्नल एग्ज़िट अब भी `code: null` लौटा सकते हैं, इसलिए टाइमआउट कारणों में अंतर करने के लिए `termination` और
    `noOutputTimedOut` का उपयोग करें।

  </Accordion>
  <Accordion title="api.runtime.events">
    इवेंट सदस्यताएँ।

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    लॉगिंग।

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    मॉडल और प्रदाता प्रमाणीकरण रिज़ॉल्यूशन।

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // अनुरोध के लिए तैयार प्रमाणीकरण, जिसमें प्रदाता रनटाइम एक्सचेंज शामिल हैं (उदाहरण के लिए OAuth रीफ़्रेश)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    स्थिति डायरेक्टरी रिज़ॉल्यूशन और SQLite-समर्थित कुंजीबद्ध भंडारण।

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.deleteIf?.("key-1", (current) => current.value === "hello");
    await store.consume("key-1");
    await store.clear();

    const blobs = api.runtime.state.openBlobStore<MyBlobMetadata>({
      namespace: "rendered-artifacts",
      maxEntries: 100,
      maxBytesPerEntry: 4 * 1024 * 1024,
      maxBytesPerNamespace: 64 * 1024 * 1024,
      defaultTtlMs: 15 * 60_000,
    });
    await blobs.register(
      "artifact-1",
      new TextEncoder().encode("binary or text payload"),
      { contentType: "text/plain" },
    );
    const blob = await blobs.lookup("artifact-1");

    await api.runtime.state.withLease(
      {
        namespace: "my-feature",
        key: "writer",
        database: { scope: "agent", agentId },
        leaseMs: 5 * 60_000,
        waitMs: 30_000,
      },
      async ({ signal, assertOwned }) => {
        await runExternalWriter({ signal });
        assertOwned();
      },
    );
    ```

    कुंजीयुक्त स्टोर पुनः प्रारंभ होने के बाद भी बने रहते हैं और रनटाइम-बाउंड Plugin आईडी के अनुसार पृथक होते हैं। परमाणु डीडुप दावों के लिए `registerIfAbsent(...)` का उपयोग करें: कुंजी अनुपस्थित या समाप्त होकर पंजीकृत होने पर यह `true` लौटाता है, या कोई सक्रिय मान पहले से मौजूद होने पर उसके मान, निर्माण समय या TTL को अधिलेखित किए बिना `false` लौटाता है। जब क्लीनअप को केवल पहले देखे गए मान को हटाना हो, तब `deleteIf(...)` का उपयोग करें; इसका समकालिक प्रेडिकेट और विलोपन एक SQLite ट्रांज़ैक्शन में चलते हैं। सीमाएँ: प्रति नेमस्पेस `maxEntries`, प्रति Plugin 50,000 सक्रिय पंक्तियाँ, 64KB से छोटे JSON मान और वैकल्पिक TTL समाप्ति। डिफ़ॉल्ट रूप से, किसी भी पंक्ति सीमा पर लेखन उस नेमस्पेस की सबसे पुरानी सक्रिय पंक्तियाँ हटाता है जिसमें लिखा जा रहा है; उस लेखन के लिए सहोदर नेमस्पेस से पंक्तियाँ नहीं हटाई जातीं, और यदि नेमस्पेस पर्याप्त पंक्तियाँ खाली नहीं कर पाता, तो लेखन फिर भी विफल होता है। टिकाऊ स्वामित्व रिकॉर्ड के लिए `overflowPolicy: "reject-new"` सेट करें जिन्हें कभी हटाया नहीं जाना चाहिए: किसी भी सीमा पर नई कुंजियाँ विफल होती हैं, जबकि मौजूदा कुंजियाँ अपडेट की जा सकती हैं।

    `openSyncKeyedStore<T>(...)` उन कॉलर के लिए समकालिक विधियों (`register`, `registerIfAbsent`, `deleteIf`, `lookup`, `consume`, `clear` सभी प्रॉमिस के बजाय सीधे मान लौटाते हैं) वाला समान स्टोर स्वरूप लौटाता है जो प्रतीक्षा नहीं कर सकते।

    `openBlobStore<TMetadata>(...)` सीमाबद्ध बाइनरी पेलोड को base64 या फ़ाइल साइडकार के बिना साझा SQLite में संग्रहीत करता है। इसके लिए प्रति-प्रविष्टि बाइट, प्रति-नेमस्पेस बाइट और पंक्ति सीमाएँ आवश्यक हैं; यह API सीमा पर बाइट ऐरे की प्रतिलिपि बनाता है; और प्रत्येक BLOB को लोड किए बिना मेटाडेटा सूचीबद्ध करता है। `register(...)` एक स्पष्ट अपसर्ट है, जिसमें समाप्त कुंजियाँ भी शामिल हैं। `registerIfAbsent(...)` टकराव-सुरक्षित निर्माण प्रदान करता है: समाप्त कुंजी तब तक अधिकृत रहती है जब तक उसका स्वामी `deleteExpiredKey(key)` या `deleteExpired()` से उस पर दावा नहीं करता, जिससे SQLite कमिट के बाद संबंधित नामित आर्टिफ़ैक्ट हटाने के लिए आवश्यक मेटाडेटा सुरक्षित रहता है। TTL वाली कोई भी पंक्ति अस्थायी होती है और समाप्त होने से पहले भी बैकअप/पुनर्स्थापना से बाहर रखी जाती है; टिकाऊ, पुनर्स्थापनीय स्थिति के लिए TTL छोड़ दें। होस्ट फ़्यूज़ प्रत्येक BLOB को 100 MiB, प्रत्येक Plugin को भौतिक रूप से संग्रहीत BLOB के 512 MiB और प्रत्येक Plugin को भौतिक रूप से संग्रहीत 50,000 पंक्तियों तक सीमित करते हैं, जिनमें स्वामी के क्लीनअप की प्रतीक्षा कर रही समाप्त पंक्तियाँ भी शामिल हैं। जब बाहरी मटेरियलाइज़ेशन को प्रतिस्थापन या निष्कासन द्वारा चुपचाप अनाथ नहीं छोड़ा जाना चाहिए, तब `overflowPolicy: "reject-new"` के साथ `registerIfAbsent(...)` का उपयोग करें।

    `openChannelIngressQueue<TPayload>(...)` कॉल करने वाले Plugin के दायरे में एक स्थायी इनग्रेस कतार खोलता है, ताकि पुनः प्रारंभ होने के दौरान कम-से-कम-एक-बार प्रसंस्करण आवश्यक इनबाउंड इवेंट बफ़र किए जा सकें। जब पुराने दावे की पुनर्प्राप्ति `shouldRecover` का उपयोग करती है, तब यदि दूषित दावा किए गए पेलोड को क्वारंटीन किया जाना हो तो `shouldRecoverCorrupt` भी प्रदान करें: इसकी पेलोड-स्वतंत्र दावा पहचान Plugin को कतार द्वारा पंक्ति को टूमस्टोन करने से पहले सक्रिय स्वामी और लेन नीति सुरक्षित रखने देती है।

    `withLease(...)` OpenClaw प्रक्रियाओं में सहकारी Plugin कार्य को क्रमबद्ध करता है। एक वैश्विक स्वामी के लिए `database: { scope: "shared" }` या स्वतंत्र प्रति-एजेंट स्वामित्व के लिए `{ scope: "agent", agentId }` चुनें। कॉलबैक के `AbortSignal` को प्रत्येक विफल हो सकने वाले ऑपरेशन में अग्रेषित करें। `assertOwned()` कोई अन्य महत्वपूर्ण चरण शुरू करने से पहले समय-बिंदु चेकपॉइंट है; होस्ट कॉलबैक के बाद भी स्वामित्व सत्यापित करता है। लीज़ खोने या कॉलर द्वारा रद्द करने पर सिग्नल निरस्त हो जाता है। अधिग्रहण की प्रतीक्षा और Heartbeat छोटे समकालिक SQLite ट्रांज़ैक्शन के बाहर होते हैं; Plugin को कभी डेटाबेस पथ या हैंडल प्राप्त नहीं होते। यह सहकारी रद्दीकरण है, फ़ेंसिंग टोकन या बिना फ़ेंस वाले बाहरी लेखन का प्राधिकरण नहीं।

    `openChannelIngressDrain(...)` उस कतार पर कोर चैनल-अज्ञेय वर्कर खोलता है (या कोई कतार न दिए जाने पर एक कतार बनाता है)। ड्रेन पुराने दावे की पुनर्प्राप्ति, प्रति-लेन दावा क्रमबद्धता, अपनाने पर पूर्णता या डिस्पैच-वापसी पर पूर्णता, पुनः प्रयास/डेड-लेटर निपटान, वैकल्पिक पूर्व-अपनाव सुपरसीड और दावा→अपनाव स्टॉल टाइमआउट का स्वामी है। `plugin-sdk/channel-outbound` से `bindIngressLifecycleToReplyOptions` के माध्यम से `turnAdoptionLifecycle` का उपयोग करके दावा स्वामित्व को उत्तर निर्माण से जोड़ें। चैनल Plugin स्वीकार-पक्ष एनक्यू, लेन व्युत्पत्ति, पुनः प्रयास न किए जा सकने वाले वर्गीकरण और किसी भी सुपरसीड प्राधिकरण नीति को बनाए रखते हैं।

    <Warning>
    इस रिलीज़ में `openBlobStore`, `openKeyedStore`, `openSyncKeyedStore`, `withLease`, `openChannelIngressQueue` और `openChannelIngressDrain` केवल बंडल किए गए Plugin और विश्वसनीय आधिकारिक Plugin इंस्टॉलेशन के लिए उपलब्ध हैं।
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    चैनल-विशिष्ट रनटाइम सहायक (चैनल Plugin लोड होने पर उपलब्ध)। विषय के अनुसार समूहीकृत:

    | समूह | उद्देश्य |
    | --- | --- |
    | `text` | खंडन (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), नियंत्रण-कमांड पहचान, Markdown तालिका रूपांतरण। |
    | `reply` | बफ़र-ब्लॉक उत्तर डिस्पैच, एनवलप स्वरूपण, प्रभावी संदेश/मानव-विलंब कॉन्फ़िग रिज़ॉल्यूशन। |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`। |
    | `pairing` | `buildPairingReply`, अनुमति-सूची पढ़ना/हटाना, पेयरिंग-अनुरोध अपसर्ट और अनुरोध से प्राप्त अनुमोदन प्रविष्टियाँ। |
    | `media` | रिमोट मीडिया डाउनलोड/सहेजना (नीचे देखें)। |
    | `activity` | अंतिम चैनल गतिविधि रिकॉर्ड करना/पढ़ना। |
    | `session` | इनबाउंड इवेंट से सत्र मेटाडेटा, अंतिम-रूट अपडेट। |
    | `mentions` | उल्लेख-नीति सहायक (नीचे देखें)। |
    | `reactions` | प्रगति पर प्रसंस्करण संकेतकों के लिए पावती-प्रतिक्रिया हैंडल। |
    | `groups` | समूह नीति और उल्लेख-आवश्यकता रिज़ॉल्यूशन। |
    | `debounce` | इनबाउंड संदेश डीबाउंसिंग। |
    | `commands` | कमांड प्राधिकरण और टेक्स्ट-कमांड गेटिंग। |
    | `outbound` | चैनल का आउटबाउंड अडैप्टर लोड करना। |
    | `inbound` | इनबाउंड इवेंट संदर्भ बनाना और साझा इनबाउंड-इवेंट/उत्तर कर्नेल चलाना। |
    | `threadBindings` | बाउंड सत्र थ्रेड के लिए निष्क्रिय-टाइमआउट/अधिकतम-आयु समायोजित करना। |
    | `runtimeContexts` | प्रक्रिया-स्थानीय प्रति-चैनल/खाता/क्षमता संदर्भ पंजीकृत करना, पढ़ना और देखना। |

    चैनल मीडिया डाउनलोड और संग्रहण के लिए `api.runtime.channel.media` पसंदीदा सतह है:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    जब किसी रिमोट URL को OpenClaw मीडिया बनना हो, तब `saveRemoteMedia(...)` का उपयोग करें। जब Plugin ने Plugin-स्वामित्व वाले प्रमाणीकरण, रीडायरेक्ट या अनुमति-सूची प्रबंधन के साथ पहले ही `Response` फ़ेच कर लिया हो, तब `saveResponseMedia(...)` का उपयोग करें। `readRemoteMediaBuffer(...)` का उपयोग केवल तभी करें जब Plugin को निरीक्षण, रूपांतरण, डिक्रिप्शन या पुनः अपलोड के लिए अपरिष्कृत बाइट की आवश्यकता हो। `fetchRemoteMedia(...)`, `readRemoteMediaBuffer(...)` का बहिष्कृत संगतता उपनाम बना हुआ है।

    `api.runtime.channel.mentions` रनटाइम इंजेक्शन का उपयोग करने वाले बंडल किए गए चैनल Plugin के लिए साझा इनबाउंड उल्लेख-नीति सतह है:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    उपलब्ध उल्लेख सहायक:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    उल्लेख निर्णयों के लिए सामान्यीकृत `{ facts, policy }` पथ का उपयोग करें।

    `reply`, `session` और `inbound` के अंतर्गत कई फ़ील्ड में वर्तमान चैनल-टर्न कर्नेल या चैनल-आउटबाउंड अडैप्टर की ओर संकेत करने वाली प्रति-फ़ील्ड `@deprecated` टिप्पणियाँ होती हैं; उस पर नया कोड बनाने से पहले विशिष्ट सहायक पर इनलाइन JSDoc जाँचें।

  </Accordion>
</AccordionGroup>

## रनटाइम संदर्भ संग्रहीत करना

`register` कॉलबैक के बाहर उपयोग के लिए रनटाइम संदर्भ संग्रहीत करने हेतु `createPluginRuntimeStore` का उपयोग करें:

<Steps>
  <Step title="स्टोर बनाएँ">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="प्रवेश बिंदु से जोड़ें">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="अन्य फ़ाइलों से एक्सेस करें">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
रनटाइम-स्टोर पहचान के लिए `pluginId` को प्राथमिकता दें। निम्न-स्तरीय `key` स्वरूप उन असामान्य मामलों के लिए है जहाँ एक Plugin को जानबूझकर एक से अधिक रनटाइम स्लॉट की आवश्यकता होती है।
</Note>

## अन्य शीर्ष-स्तरीय `api` फ़ील्ड

`api.runtime` के अतिरिक्त, API ऑब्जेक्ट यह भी प्रदान करता है:

<ParamField path="api.id" type="string">
  Plugin आईडी।
</ParamField>
<ParamField path="api.name" type="string">
  Plugin प्रदर्शन नाम।
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  वर्तमान कॉन्फ़िग स्नैपशॉट (उपलब्ध होने पर सक्रिय इन-मेमोरी रनटाइम स्नैपशॉट)।
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` से Plugin-विशिष्ट कॉन्फ़िग।
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  दायरा-बद्ध लॉगर (`debug`, `info`, `warn`, `error`)।
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  वर्तमान लोड मोड: `"full"` (लाइव सक्रियण), `"discovery"` / `"tool-discovery"` (केवल-पढ़ने योग्य क्षमता खोज), `"setup-only"` (हल्का सेटअप प्रवेश), `"setup-runtime"` (सेटअप प्रवाह जिसे रनटाइम चैनल प्रविष्टि की भी आवश्यकता है), या `"cli-metadata"` (CLI कमांड मेटाडेटा संग्रह)।
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin रूट के सापेक्ष पथ का समाधान करें।
</ParamField>

## संबंधित

- [Plugin की आंतरिक संरचना](/hi/plugins/architecture) — क्षमता मॉडल और रजिस्ट्री
- [SDK प्रवेश बिंदु](/hi/plugins/sdk-entrypoints) — `definePluginEntry` विकल्प
- [SDK अवलोकन](/hi/plugins/sdk-overview) — उपपथ संदर्भ
