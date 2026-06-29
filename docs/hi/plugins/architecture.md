---
read_when:
    - मूल OpenClaw plugins बनाना या डीबग करना
    - Plugin क्षमता मॉडल या स्वामित्व सीमाओं को समझना
    - Plugin लोड पाइपलाइन या रजिस्ट्री पर काम करना
    - प्रदाता रनटाइम hooks या चैनल plugins लागू करना
sidebarTitle: Internals
summary: 'Plugin आंतरिक संरचना: क्षमता मॉडल, स्वामित्व, अनुबंध, लोड पाइपलाइन, और रनटाइम हेल्पर'
title: Plugin आंतरिक संरचना
x-i18n:
    generated_at: "2026-06-28T23:32:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

यह OpenClaw Plugin सिस्टम के लिए **गहन आर्किटेक्चर संदर्भ** है। व्यावहारिक गाइड के लिए, नीचे दिए गए केंद्रित पेजों में से किसी एक से शुरू करें।

<CardGroup cols={2}>
  <Card title="Plugin इंस्टॉल और उपयोग करें" icon="plug" href="/hi/tools/plugin">
    Plugin जोड़ने, सक्षम करने और समस्या निवारण के लिए अंतिम-उपयोगकर्ता गाइड।
  </Card>
  <Card title="Plugin बनाना" icon="rocket" href="/hi/plugins/building-plugins">
    सबसे छोटे कार्यशील मैनिफेस्ट के साथ पहला-Plugin ट्यूटोरियल।
  </Card>
  <Card title="Channel Plugin" icon="comments" href="/hi/plugins/sdk-channel-plugins">
    एक मैसेजिंग चैनल Plugin बनाएं।
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/hi/plugins/sdk-provider-plugins">
    एक मॉडल provider Plugin बनाएं।
  </Card>
  <Card title="SDK अवलोकन" icon="book" href="/hi/plugins/sdk-overview">
    इम्पोर्ट मैप और registration API संदर्भ।
  </Card>
</CardGroup>

## सार्वजनिक क्षमता मॉडल

क्षमताएं OpenClaw के भीतर सार्वजनिक **native plugin** मॉडल हैं। हर native OpenClaw Plugin एक या अधिक क्षमता प्रकारों के लिए register करता है:

| क्षमता                 | Registration विधि                                | उदाहरण Plugin                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| टेक्स्ट inference      | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI inference backend  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | Provider-स्वामित्व वाले vector Plugin |
| Speech                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Transcripts source     | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| Image generation       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Music generation       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Video generation       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Web search             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway discovery      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
जो Plugin शून्य क्षमताएं register करता है लेकिन hooks, tools, discovery services, या background services प्रदान करता है, वह **legacy hook-only** Plugin है। यह पैटर्न अभी भी पूरी तरह supported है।
</Note>

### बाहरी compatibility दृष्टिकोण

Capability मॉडल core में landed है और आज bundled/native Plugin द्वारा उपयोग किया जाता है, लेकिन external Plugin compatibility के लिए अभी भी "यह export किया गया है, इसलिए frozen है" से अधिक कड़ी कसौटी चाहिए।

| Plugin स्थिति                                   | मार्गदर्शन                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| मौजूदा external Plugin                           | hook-based integrations को काम करते रहने दें; यही compatibility baseline है।                   |
| नए bundled/native Plugin                         | vendor-specific reach-ins या नए hook-only designs के बजाय explicit capability registration को प्राथमिकता दें। |
| Capability registration अपनाने वाले external Plugin | अनुमति है, लेकिन capability-specific helper surfaces को evolving मानें जब तक docs उन्हें stable न चिह्नित करें। |

Capability registration इच्छित दिशा है। संक्रमण के दौरान external Plugin के लिए Legacy hooks सबसे सुरक्षित no-breakage path बने रहते हैं। Exported helper subpaths सभी समान नहीं हैं — incidental helper exports की तुलना में संकीर्ण documented contracts को प्राथमिकता दें।

### Plugin shapes

OpenClaw हर loaded Plugin को उसके actual registration behavior के आधार पर shape में वर्गीकृत करता है (सिर्फ static metadata के आधार पर नहीं):

<AccordionGroup>
  <Accordion title="plain-capability">
    ठीक एक capability type register करता है (उदाहरण के लिए `mistral` जैसा provider-only Plugin)।
  </Accordion>
  <Accordion title="hybrid-capability">
    कई capability types register करता है (उदाहरण के लिए `openai` text inference, speech, media understanding, और image generation का स्वामी है)।
  </Accordion>
  <Accordion title="hook-only">
    केवल hooks (typed या custom) register करता है, कोई capabilities, tools, commands, या services नहीं।
  </Accordion>
  <Accordion title="non-capability">
    tools, commands, services, या routes register करता है लेकिन कोई capabilities नहीं।
  </Accordion>
</AccordionGroup>

किसी Plugin की shape और capability breakdown देखने के लिए `openclaw plugins inspect <id>` का उपयोग करें। विवरण के लिए [CLI संदर्भ](/hi/cli/plugins#inspect) देखें।

### Legacy hooks

`before_agent_start` hook hook-only Plugin के लिए compatibility path के रूप में supported रहता है। Legacy real-world Plugin अभी भी इस पर निर्भर हैं।

दिशा:

- इसे काम करते रहने दें
- इसे legacy के रूप में document करें
- model/provider override work के लिए `before_model_resolve` को प्राथमिकता दें
- prompt mutation work के लिए `before_prompt_build` को प्राथमिकता दें
- केवल तब हटाएं जब वास्तविक उपयोग घट जाए और fixture coverage migration safety साबित करे

### Compatibility signals

जब आप `openclaw doctor` या `openclaw plugins inspect <id>` चलाते हैं, तो आपको इनमें से कोई label दिख सकता है:

| Signal                     | अर्थ                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config ठीक से parse होता है और Plugin resolve होते हैं       |
| **compatibility advisory** | Plugin supported-but-older pattern का उपयोग करता है (जैसे `hook-only`) |
| **legacy warning**         | Plugin `before_agent_start` का उपयोग करता है, जो deprecated है |
| **hard error**             | Config invalid है या Plugin load होने में विफल रहा           |

न तो `hook-only` और न ही `before_agent_start` आज आपके Plugin को तोड़ेगा: `hook-only` advisory है, और `before_agent_start` केवल warning trigger करता है। ये signals `openclaw status --all` और `openclaw plugins doctor` में भी दिखाई देते हैं।

## Architecture अवलोकन

OpenClaw के Plugin सिस्टम में चार layers हैं:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw configured paths, workspace roots, global Plugin roots, और bundled Plugin से candidate Plugin खोजता है। Discovery पहले native `openclaw.plugin.json` manifests और supported bundle manifests पढ़ता है।
  </Step>
  <Step title="Enablement + validation">
    Core तय करता है कि discovered Plugin enabled, disabled, blocked है या memory जैसे exclusive slot के लिए selected है।
  </Step>
  <Step title="Runtime loading">
    Native OpenClaw Plugin in-process load होते हैं और capabilities को central registry में register करते हैं। Packaged JavaScript native `require` के माध्यम से load होता है; third-party local source TypeScript emergency Jiti fallback है। Compatible bundles runtime code import किए बिना registry records में normalized होते हैं।
  </Step>
  <Step title="Surface consumption">
    OpenClaw का बाकी हिस्सा tools, channels, provider setup, hooks, HTTP routes, CLI commands, और services expose करने के लिए registry पढ़ता है।
  </Step>
</Steps>

विशेष रूप से Plugin CLI के लिए, root command discovery दो phases में split है:

- parse-time metadata `registerCli(..., { descriptors: [...] })` से आता है
- वास्तविक Plugin CLI module lazy रह सकता है और first invocation पर register कर सकता है

इससे Plugin-owned CLI code Plugin के भीतर रहता है, जबकि OpenClaw parsing से पहले भी root command names reserve कर सकता है।

महत्वपूर्ण design boundary:

- manifest/config validation को Plugin code execute किए बिना **manifest/schema metadata** से काम करना चाहिए
- native capability discovery trusted Plugin entry code load करके non-activating registry snapshot बना सकता है
- native runtime behavior Plugin module के `register(api)` path से आता है, जहां `api.registrationMode === "full"`

यह split OpenClaw को full runtime active होने से पहले config validate करने, missing/disabled Plugin समझाने, और UI/schema hints बनाने देता है।

### Plugin metadata snapshot और lookup table

Gateway startup मौजूदा config snapshot के लिए एक `PluginMetadataSnapshot` बनाता है। Snapshot metadata-only है: यह installed Plugin index, manifest registry, manifest diagnostics, owner maps, Plugin id normalizer, और manifest records store करता है। यह loaded Plugin modules, provider SDKs, package contents, या runtime exports नहीं रखता।

Plugin-aware config validation, startup auto-enable, और Gateway Plugin bootstrap उस snapshot को consume करते हैं, बजाय manifest/index metadata को independently rebuild करने के। `PluginLookUpTable` उसी snapshot से derive होता है और मौजूदा runtime config के लिए startup Plugin plan जोड़ता है।

Startup के बाद, Gateway मौजूदा metadata snapshot को replaceable runtime product के रूप में रखता है। Repeated runtime provider discovery हर provider-catalog pass के लिए installed index और manifest registry reconstruct करने के बजाय वह snapshot borrow कर सकता है। Gateway shutdown, config/Plugin inventory changes, और installed index writes पर snapshot cleared या replaced होता है; compatible current snapshot मौजूद न होने पर callers cold manifest/index path पर fall back करते हैं। Compatibility checks में `plugins.load.paths` और default agent workspace जैसे Plugin discovery roots शामिल होने चाहिए, क्योंकि workspace Plugin metadata scope का हिस्सा हैं।

Snapshot और lookup table repeated startup decisions को fast path पर रखते हैं:

- channel ownership
- deferred channel startup
- startup Plugin ids
- provider और CLI backend ownership
- setup provider, command alias, model catalog provider, और manifest contract ownership
- Plugin config schema और channel config schema validation
- startup auto-enable decisions

Safety boundary snapshot replacement है, mutation नहीं। Config, Plugin inventory, install records, या persisted index policy बदलने पर snapshot rebuild करें। इसे broad mutable global registry के रूप में न मानें, और unbounded historical snapshots न रखें। Runtime Plugin loading metadata snapshots से अलग रहता है ताकि stale runtime state metadata cache के पीछे hidden न हो सके।

Cache rule [Plugin architecture internals](/hi/plugins/architecture-internals#plugin-cache-boundary) में documented है: manifest और discovery metadata fresh होते हैं जब तक कोई caller मौजूदा flow के लिए explicit snapshot, lookup table, या manifest registry न रखता हो। Hidden metadata caches और wall-clock TTLs Plugin loading का हिस्सा नहीं हैं। केवल runtime loader, module, और dependency-artifact caches code या installed artifacts वास्तव में loaded होने के बाद persist रह सकते हैं।

कुछ cold-path callers अभी भी Gateway `PluginLookUpTable` पाने के बजाय persisted installed Plugin index से सीधे manifest registries reconstruct करते हैं। अब वह path registry को demand पर reconstruct करता है; जब caller के पास पहले से current lookup table या explicit manifest registry हो, तो runtime flows में उसे pass करना prefer करें।

### Activation planning

Activation planning control plane का हिस्सा है। Callers broad runtime registries load करने से पहले पूछ सकते हैं कि किसी concrete command, provider, channel, route, agent harness, या capability के लिए कौन से Plugin relevant हैं।

Planner मौजूदा manifest behavior को compatible रखता है:

- `activation.*` फ़ील्ड स्पष्ट प्लानर संकेत हैं
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, और hooks मैनिफ़ेस्ट स्वामित्व फ़ॉलबैक बने रहते हैं
- केवल-ids प्लानर API मौजूदा कॉलरों के लिए उपलब्ध रहती है
- प्लान API कारण लेबल रिपोर्ट करता है ताकि डायग्नॉस्टिक्स स्पष्ट संकेतों को स्वामित्व फ़ॉलबैक से अलग कर सकें

<Warning>
`activation` को lifecycle hook या `register(...)` के प्रतिस्थापन के रूप में न मानें। यह लोडिंग को सीमित करने के लिए उपयोग किया जाने वाला मेटाडेटा है। जब स्वामित्व फ़ील्ड पहले से संबंध का वर्णन करते हों, तो उन्हें प्राथमिकता दें; अतिरिक्त प्लानर संकेतों के लिए ही `activation` का उपयोग करें।
</Warning>

### चैनल Plugin और साझा message टूल

चैनल Plugin को सामान्य चैट कार्रवाइयों के लिए अलग send/edit/react टूल रजिस्टर करने की आवश्यकता नहीं है। OpenClaw core में एक साझा `message` टूल रखता है, और चैनल Plugin उसके पीछे चैनल-विशिष्ट खोज और निष्पादन के स्वामी होते हैं।

वर्तमान सीमा यह है:

- core साझा `message` टूल होस्ट, prompt wiring, session/thread bookkeeping, और execution dispatch का स्वामी है
- चैनल Plugin scoped action discovery, capability discovery, और किसी भी चैनल-विशिष्ट schema fragments के स्वामी हैं
- चैनल Plugin प्रदाता-विशिष्ट session conversation grammar के स्वामी हैं, जैसे conversation ids thread ids को कैसे encode करते हैं या parent conversations से कैसे inherit करते हैं
- चैनल Plugin अपने action adapter के माध्यम से अंतिम कार्रवाई निष्पादित करते हैं

चैनल Plugin के लिए, SDK surface `ChannelMessageActionAdapter.describeMessageTool(...)` है। वह एकीकृत discovery call Plugin को अपनी visible actions, capabilities, और schema contributions साथ में लौटाने देता है ताकि वे हिस्से अलग-अलग दिशा में न जाएं।

जब कोई चैनल-विशिष्ट message-tool param किसी स्थानीय path या remote media URL जैसे media source को रखता है, तो Plugin को `describeMessageTool(...)` से `mediaSourceParams` भी लौटाना चाहिए। Core उस स्पष्ट सूची का उपयोग sandbox path normalization और outbound media-access hints लागू करने के लिए करता है, बिना Plugin-owned param नामों को hardcode किए। वहां action-scoped maps को प्राथमिकता दें, न कि एक channel-wide flat list, ताकि profile-only media param असंबंधित actions जैसे `send` पर normalize न हो।

Core उस discovery step में runtime scope पास करता है। महत्वपूर्ण फ़ील्ड में शामिल हैं:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- विश्वसनीय inbound `requesterSenderId`

यह context-sensitive Plugin के लिए महत्वपूर्ण है। कोई चैनल active account, current room/thread/message, या trusted requester identity के आधार पर message actions छिपा या दिखा सकता है, बिना core `message` टूल में चैनल-विशिष्ट branches को hardcode किए।

इसीलिए embedded-runner routing बदलाव अभी भी Plugin कार्य हैं: runner की ज़िम्मेदारी है कि वह current chat/session identity को Plugin discovery boundary में forward करे ताकि साझा `message` टूल वर्तमान turn के लिए सही channel-owned surface expose करे।

Channel-owned execution helpers के लिए, bundled Plugin को execution runtime अपने extension modules के अंदर ही रखना चाहिए। Core अब `src/agents/tools` के अंतर्गत Discord, Slack, Telegram, या WhatsApp message-action runtimes का स्वामी नहीं है। हम अलग `plugin-sdk/*-action-runtime` subpaths publish नहीं करते, और bundled Plugin को अपने extension-owned modules से अपना local runtime code सीधे import करना चाहिए।

यही सीमा सामान्य रूप से provider-named SDK seams पर लागू होती है: core को Slack, Discord, Signal, WhatsApp, या समान extensions के लिए channel-specific convenience barrels import नहीं करने चाहिए। यदि core को किसी behavior की आवश्यकता है, तो या तो bundled Plugin के अपने `api.ts` / `runtime-api.ts` barrel का उपयोग करें या आवश्यकता को shared SDK में एक संकीर्ण generic capability में promote करें।

Bundled Plugin भी यही नियम अपनाते हैं। किसी bundled Plugin के `runtime-api.ts` को अपने ही branded `openclaw/plugin-sdk/<plugin-id>` facade को re-export नहीं करना चाहिए। वे branded facades external Plugin और पुराने consumers के लिए compatibility shims बने रहते हैं, लेकिन bundled Plugin को local exports और `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, या `openclaw/plugin-sdk/webhook-ingress` जैसे संकीर्ण generic SDK subpaths का उपयोग करना चाहिए। नया code plugin-id-specific SDK facades नहीं जोड़ना चाहिए, जब तक किसी मौजूदा external ecosystem की compatibility boundary इसकी मांग न करे।

Polls के लिए विशेष रूप से, दो execution paths हैं:

- `outbound.sendPoll` उन चैनलों के लिए साझा baseline है जो common poll model में फिट होते हैं
- `actions.handleAction("poll")` channel-specific poll semantics या अतिरिक्त poll parameters के लिए preferred path है

Core अब shared poll parsing को तब तक defer करता है जब तक Plugin poll dispatch कार्रवाई को decline नहीं कर देता, ताकि Plugin-owned poll handlers generic poll parser से पहले blocked हुए बिना channel-specific poll fields स्वीकार कर सकें।

पूरा startup sequence देखने के लिए [Plugin architecture internals](/hi/plugins/architecture-internals) देखें।

## क्षमता स्वामित्व मॉडल

OpenClaw native Plugin को किसी **कंपनी** या **feature** के लिए ownership boundary मानता है, असंबंधित integrations का संग्रह नहीं।

इसका मतलब है:

- company Plugin को आमतौर पर उस कंपनी के सभी OpenClaw-facing surfaces का स्वामी होना चाहिए
- feature Plugin को आमतौर पर अपने द्वारा पेश किए गए पूरे feature surface का स्वामी होना चाहिए
- channels को provider behavior को ad hoc फिर से लागू करने के बजाय shared core capabilities का उपयोग करना चाहिए

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` text inference, speech, realtime voice, media understanding, और image generation का स्वामी है। `google` text inference के साथ media understanding, image generation, और web search का स्वामी है। `qwen` text inference के साथ media understanding और video generation का स्वामी है।
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` और `microsoft` speech के स्वामी हैं; `firecrawl` web-fetch का स्वामी है; `minimax` / `mistral` / `moonshot` / `zai` media-understanding backends के स्वामी हैं।
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` call transport, tools, CLI, routes, और Twilio media-stream bridging का स्वामी है, लेकिन vendor Plugin को सीधे import करने के बजाय shared speech, realtime transcription, और realtime voice capabilities का उपयोग करता है।
  </Accordion>
</AccordionGroup>

इच्छित अंतिम स्थिति यह है:

- OpenAI एक ही Plugin में रहता है, भले ही वह text models, speech, images, और future video तक फैला हो
- दूसरा vendor अपने surface area के लिए ऐसा ही कर सकता है
- channels को इस बात की परवाह नहीं होती कि provider का स्वामी कौन-सा vendor Plugin है; वे core द्वारा expose किए गए shared capability contract का उपयोग करते हैं

मुख्य अंतर यह है:

- **Plugin** = ownership boundary
- **capability** = core contract जिसे कई Plugin implement या consume कर सकते हैं

इसलिए यदि OpenClaw video जैसा नया domain जोड़ता है, तो पहला प्रश्न यह नहीं है कि "किस provider को video handling hardcode करनी चाहिए?" पहला प्रश्न यह है कि "core video capability contract क्या है?" जब वह contract मौजूद हो जाता है, vendor Plugin उसके विरुद्ध register कर सकते हैं और channel/feature Plugin उसका उपयोग कर सकते हैं।

यदि capability अभी मौजूद नहीं है, तो सही कदम आमतौर पर यह है:

<Steps>
  <Step title="क्षमता परिभाषित करें">
    गायब capability को core में define करें।
  </Step>
  <Step title="SDK के माध्यम से expose करें">
    इसे plugin API/runtime के माध्यम से typed तरीके से expose करें।
  </Step>
  <Step title="Consumers wire करें">
    channels/features को उस capability के विरुद्ध wire करें।
  </Step>
  <Step title="Vendor implementations">
    vendor Plugin को implementations register करने दें।
  </Step>
</Steps>

यह स्वामित्व को स्पष्ट रखता है और ऐसे core behavior से बचाता है जो किसी एक vendor या one-off plugin-specific code path पर निर्भर हो।

### क्षमता layering

Code कहां होना चाहिए, यह तय करते समय इस mental model का उपयोग करें:

<Tabs>
  <Tab title="Core capability layer">
    साझा orchestration, policy, fallback, config merge rules, delivery semantics, और typed contracts।
  </Tab>
  <Tab title="Vendor plugin layer">
    Vendor-specific APIs, auth, model catalogs, speech synthesis, image generation, future video backends, usage endpoints।
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Slack/Discord/voice-call/etc. integration जो core capabilities का उपयोग करता है और उन्हें किसी surface पर प्रस्तुत करता है।
  </Tab>
</Tabs>

उदाहरण के लिए, TTS यह shape अपनाता है:

- core reply-time TTS policy, fallback order, prefs, और channel delivery का स्वामी है
- `openai`, `elevenlabs`, और `microsoft` synthesis implementations के स्वामी हैं
- `voice-call` telephony TTS runtime helper का उपयोग करता है

Future capabilities के लिए भी इसी pattern को प्राथमिकता दी जानी चाहिए।

### Multi-capability company Plugin उदाहरण

Company Plugin को बाहर से cohesive महसूस होना चाहिए। यदि OpenClaw के पास models, speech, realtime transcription, realtime voice, media understanding, image generation, video generation, web fetch, और web search के लिए shared contracts हैं, तो कोई vendor अपने सभी surfaces का स्वामी एक ही जगह हो सकता है:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

महत्व exact helper names का नहीं है। Shape मायने रखता है:

- एक Plugin vendor surface का स्वामी है
- core फिर भी capability contracts का स्वामी है
- channels और feature Plugin `api.runtime.*` helpers का उपयोग करते हैं, vendor code का नहीं
- contract tests assert कर सकते हैं कि Plugin ने वे capabilities register की हैं जिनका वह स्वामी होने का दावा करता है

### क्षमता उदाहरण: video understanding

OpenClaw पहले से image/audio/video understanding को एक साझा capability मानता है। वही ownership model वहां लागू होता है:

<Steps>
  <Step title="Core contract define करता है">
    Core media-understanding contract define करता है।
  </Step>
  <Step title="Vendor Plugin register करते हैं">
    Vendor Plugin लागू होने पर `describeImage`, `transcribeAudio`, और `describeVideo` register करते हैं।
  </Step>
  <Step title="Consumers shared behavior का उपयोग करते हैं">
    Channels और feature Plugin vendor code से सीधे wire करने के बजाय shared core behavior का उपयोग करते हैं।
  </Step>
</Steps>

यह core में किसी एक provider की video assumptions bake करने से बचाता है। Plugin vendor surface का स्वामी है; core capability contract और fallback behavior का स्वामी है।

Video generation पहले से इसी sequence का उपयोग करता है: core typed capability contract और runtime helper का स्वामी है, और vendor Plugin उसके विरुद्ध `api.registerVideoGenerationProvider(...)` implementations register करते हैं।

Concrete rollout checklist चाहिए? [Capability Cookbook](/hi/plugins/adding-capabilities) देखें।

## Contracts और enforcement

Plugin API surface जानबूझकर `OpenClawPluginApi` में typed और centralized है। वह contract supported registration points और runtime helpers define करता है जिन पर कोई Plugin भरोसा कर सकता है।

यह क्यों महत्वपूर्ण है:

- Plugin authors को एक stable internal standard मिलता है
- core duplicate ownership को reject कर सकता है, जैसे दो Plugin का same provider id register करना
- startup malformed registration के लिए actionable diagnostics surface कर सकता है
- contract tests bundled-plugin ownership enforce कर सकते हैं और silent drift रोक सकते हैं

Enforcement की दो layers हैं:

<AccordionGroup>
  <Accordion title="रनटाइम पंजीकरण प्रवर्तन">
    Plugin रजिस्ट्री Plugins लोड होते समय पंजीकरणों को सत्यापित करती है। उदाहरण: डुप्लीकेट प्रोवाइडर ids, डुप्लीकेट स्पीच प्रोवाइडर ids, और विकृत पंजीकरण अनिर्धारित व्यवहार के बजाय Plugin डायग्नॉस्टिक्स उत्पन्न करते हैं।
  </Accordion>
  <Accordion title="अनुबंध परीक्षण">
    परीक्षण रन के दौरान बंडल किए गए Plugins को अनुबंध रजिस्ट्रियों में कैप्चर किया जाता है ताकि OpenClaw स्वामित्व को स्पष्ट रूप से सत्यापित कर सके। आज इसका उपयोग मॉडल प्रोवाइडर्स, स्पीच प्रोवाइडर्स, वेब सर्च प्रोवाइडर्स, और बंडल किए गए पंजीकरण स्वामित्व के लिए किया जाता है।
  </Accordion>
</AccordionGroup>

व्यावहारिक प्रभाव यह है कि OpenClaw पहले से जानता है कि कौन सा Plugin किस सतह का स्वामी है। इससे कोर और चैनल सहजता से संयोजित हो पाते हैं, क्योंकि स्वामित्व अंतर्निहित होने के बजाय घोषित, टाइप किया हुआ, और परीक्षण योग्य होता है।

### अनुबंध में क्या होना चाहिए

<Tabs>
  <Tab title="अच्छे अनुबंध">
    - टाइप किए हुए
    - छोटे
    - क्षमता-विशिष्ट
    - कोर के स्वामित्व वाले
    - कई Plugins द्वारा पुन: उपयोग योग्य
    - चैनल/फीचर द्वारा वेंडर जानकारी के बिना उपयोग योग्य

  </Tab>
  <Tab title="खराब अनुबंध">
    - कोर में छिपी वेंडर-विशिष्ट नीति
    - एकबारगी Plugin एस्केप हैच जो रजिस्ट्री को बायपास करते हैं
    - चैनल कोड का सीधे किसी वेंडर इम्प्लीमेंटेशन में पहुंचना
    - तदर्थ रनटाइम ऑब्जेक्ट जो `OpenClawPluginApi` या `api.runtime` का हिस्सा नहीं हैं

  </Tab>
</Tabs>

संदेह होने पर, अमूर्तन स्तर बढ़ाएँ: पहले क्षमता परिभाषित करें, फिर Plugins को उसमें प्लग इन करने दें।

## निष्पादन मॉडल

नेटिव OpenClaw Plugins Gateway के साथ **इन-प्रोसेस** चलते हैं। वे सैंडबॉक्स्ड नहीं होते। लोड किए गए नेटिव Plugin की प्रक्रिया-स्तरीय विश्वास सीमा कोर कोड जैसी ही होती है।

<Warning>
नेटिव Plugin के निहितार्थ: कोई Plugin टूल्स, नेटवर्क हैंडलर्स, हुक्स, और सेवाएँ पंजीकृत कर सकता है; Plugin बग gateway को क्रैश या अस्थिर कर सकता है; और दुर्भावनापूर्ण नेटिव Plugin OpenClaw प्रक्रिया के अंदर मनमाने कोड निष्पादन के बराबर है।
</Warning>

संगत बंडल डिफॉल्ट रूप से अधिक सुरक्षित होते हैं, क्योंकि OpenClaw वर्तमान में उन्हें मेटाडेटा/कंटेंट पैक मानता है। मौजूदा रिलीज में, इसका अर्थ मुख्य रूप से बंडल किए गए Skills है।

बंडल में शामिल नहीं किए गए Plugins के लिए अनुमति-सूचियों और स्पष्ट install/load पथों का उपयोग करें। वर्कस्पेस Plugins को विकास-समय का कोड मानें, उत्पादन डिफॉल्ट नहीं।

बंडल किए गए वर्कस्पेस पैकेज नामों के लिए, Plugin id को npm नाम में एंकर रखें: डिफॉल्ट रूप से `@openclaw/<id>`, या स्वीकृत टाइप किया हुआ suffix जैसे `-provider`, `-plugin`, `-speech`, `-sandbox`, या `-media-understanding` जब पैकेज जानबूझकर संकीर्ण Plugin भूमिका उजागर करता है।

<Note>
**विश्वास नोट:** `plugins.allow` **Plugin ids** पर भरोसा करता है, स्रोत provenance पर नहीं। जब उसी id वाला वर्कस्पेस Plugin सक्षम/अनुमति-सूचीबद्ध होता है, तो वह जानबूझकर उसी id वाले बंडल किए गए Plugin की कॉपी को shadow करता है। यह स्थानीय विकास, पैच परीक्षण, और hotfixes के लिए सामान्य और उपयोगी है। बंडल किए गए Plugin का विश्वास स्रोत snapshot से तय होता है — लोड समय पर डिस्क पर मौजूद manifest और कोड से — install metadata से नहीं। दूषित या प्रतिस्थापित install record, वास्तविक स्रोत के दावे से आगे किसी बंडल किए गए Plugin की trust surface को चुपचाप विस्तृत नहीं कर सकता।
</Note>

## निर्यात सीमा

OpenClaw क्षमताएँ निर्यात करता है, इम्प्लीमेंटेशन सुविधा नहीं।

क्षमता पंजीकरण को सार्वजनिक रखें। गैर-अनुबंध helper exports को कम करें:

- बंडल किए गए Plugin-विशिष्ट helper subpaths
- रनटाइम plumbing subpaths जो सार्वजनिक API के रूप में अभिप्रेत नहीं हैं
- वेंडर-विशिष्ट सुविधा helpers
- setup/onboarding helpers जो इम्प्लीमेंटेशन विवरण हैं

आरक्षित बंडल किए गए Plugin helper subpaths को जनरेट किए गए SDK export map से हटा दिया गया है। स्वामी-विशिष्ट helpers को स्वामी Plugin package के अंदर रखें; केवल पुन: उपयोग योग्य host व्यवहार को generic SDK अनुबंधों जैसे `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, और `plugin-sdk/plugin-config-runtime` में promote करें।

## आंतरिक विवरण और संदर्भ

लोड pipeline, रजिस्ट्री मॉडल, प्रोवाइडर रनटाइम hooks, Gateway HTTP routes, message tool schemas, channel target resolution, provider catalogs, context engine plugins, और नई क्षमता जोड़ने की गाइड के लिए, [Plugin architecture internals](/hi/plugins/architecture-internals) देखें।

## संबंधित

- [Plugins बनाना](/hi/plugins/building-plugins)
- [Plugin manifest](/hi/plugins/manifest)
- [Plugin SDK setup](/hi/plugins/sdk-setup)
