---
read_when:
    - आप चाहते हैं कि Codex-mode OpenClaw एजेंट native Codex plugins का उपयोग करें
    - आप स्रोत से इंस्टॉल किए गए OpenAI-क्यूरेटेड Codex Plugin माइग्रेट कर रहे हैं
    - आप codexPlugins, ऐप इन्वेंटरी, विनाशकारी कार्रवाइयों, या Plugin ऐप निदान की समस्या निवारण कर रहे हैं
summary: Codex-मोड OpenClaw एजेंटों के लिए माइग्रेट किए गए नेटिव Codex plugins कॉन्फ़िगर करें
title: नेटिव Codex Plugin
x-i18n:
    generated_at: "2026-06-28T23:34:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

नेटिव Codex Plugin समर्थन किसी Codex-मोड OpenClaw एजेंट को उसी Codex थ्रेड के अंदर Codex
app-server की अपनी ऐप और Plugin क्षमताओं का उपयोग करने देता है, जो
OpenClaw टर्न संभालता है।

OpenClaw Codex Plugin को कृत्रिम `codex_plugin_*`
OpenClaw डायनामिक टूल में अनुवादित नहीं करता। Plugin कॉल नेटिव Codex ट्रांसक्रिप्ट में रहती हैं, और
Codex app-server ऐप-समर्थित MCP निष्पादन का स्वामी होता है।

इस पेज का उपयोग तब करें जब मूल [Codex harness](/hi/plugins/codex-harness) काम कर रहा हो।

## आवश्यकताएँ

- चुना गया OpenClaw एजेंट रनटाइम नेटिव Codex harness होना चाहिए।
- `plugins.entries.codex.enabled` true होना चाहिए।
- `plugins.entries.codex.config.codexPlugins.enabled` true होना चाहिए।
- V1 केवल उन `openai-curated` Plugin का समर्थन करता है जिन्हें माइग्रेशन ने
  स्रोत Codex होम में स्रोत-इंस्टॉल किया हुआ देखा हो।
- लक्ष्य Codex app-server अपेक्षित marketplace,
  Plugin, और ऐप इन्वेंटरी देख पाने में सक्षम होना चाहिए।

`codexPlugins` का OpenClaw रन, सामान्य OpenAI प्रदाता रन, ACP
बातचीत बाइंडिंग, या अन्य harness पर कोई प्रभाव नहीं पड़ता क्योंकि वे पथ
नेटिव `apps` config के साथ Codex app-server थ्रेड नहीं बनाते।

OpenAI-पक्षीय Codex पहुँच, ऐप उपलब्धता, और workspace ऐप/Plugin नियंत्रण
साइन-इन किए गए Codex खाते से आते हैं। OpenAI खाते और admin मॉडल के लिए,
[Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) देखें।

## त्वरित शुरुआत

स्रोत Codex होम से माइग्रेशन का पूर्वावलोकन करें:

```bash
openclaw migrate codex --dry-run
```

जब आप चाहते हों कि माइग्रेशन नेटिव Plugin सक्रियण की योजना बनाने से पहले स्रोत ऐप
पहुँचयोग्यता की जाँच करे, तब कड़ा स्रोत ऐप सत्यापन उपयोग करें:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

जब योजना सही लगे तो माइग्रेशन लागू करें:

```bash
openclaw migrate apply codex --yes
```

माइग्रेशन पात्र Plugin के लिए स्पष्ट `codexPlugins` प्रविष्टियाँ लिखता है और
चुने गए Plugin के लिए Codex app-server `plugin/install` कॉल करता है। एक सामान्य माइग्रेट किया गया
config ऐसा दिखता है:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

`codexPlugins` बदलने के बाद, नई Codex बातचीत अपडेट किए गए ऐप
सेट को अपने आप उठा लेती हैं। मौजूदा बातचीत को रीफ्रेश करने के लिए `/new` या `/reset` उपयोग करें।
Plugin सक्षम या अक्षम करने के बदलावों के लिए gateway पुनः शुरू करना आवश्यक नहीं है।

## चैट से Plugin प्रबंधित करें

जब आप उसी चैट से configured नेटिव Codex
Plugin देखना या बदलना चाहें जहाँ आप Codex harness चला रहे हैं, तब `/codex plugins` उपयोग करें:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` `/codex plugins list` का alias है। सूची आउटपुट
configured Plugin keys, on/off स्थिति, Codex Plugin नाम, और
`plugins.entries.codex.config.codexPlugins.plugins` से marketplace दिखाता है।

`enable` और `disable` केवल
`~/.openclaw/openclaw.json` पर OpenClaw config में लिखते हैं; वे `~/.codex/config.toml` संपादित नहीं करते या
नए Codex Plugin इंस्टॉल नहीं करते। केवल owner या
`operator.admin` scope वाला gateway client Plugin स्थिति बदल सकता है।

किसी configured Plugin को सक्षम करना वैश्विक
`codexPlugins.enabled` switch भी चालू कर देता है। यदि Plugin disabled लिखा गया था क्योंकि
माइग्रेशन ने `auth_required` लौटाया था, तो OpenClaw में उसे सक्षम करने से पहले
Codex में ऐप को फिर से authorize करें।

## नेटिव Plugin सेटअप कैसे काम करता है

integration की तीन अलग-अलग स्थितियाँ हैं:

- Installed: Codex के पास लक्ष्य app-server रनटाइम में स्थानीय Plugin bundle है।
- Enabled: OpenClaw config Plugin को Codex
  harness टर्न के लिए उपलब्ध कराने को तैयार है।
- Accessible: Codex app-server पुष्टि करता है कि Plugin की ऐप प्रविष्टियाँ
  सक्रिय खाते के लिए उपलब्ध हैं और माइग्रेट की गई Plugin पहचान से मैप की जा सकती हैं।

माइग्रेशन स्थायी install/eligibility चरण है। planning के दौरान, OpenClaw
स्रोत Codex `plugin/read` विवरण पढ़ता है और जाँचता है कि स्रोत Codex
app-server account response ChatGPT subscription account है। Non-ChatGPT या
missing account responses ऐप-समर्थित Plugin को
`codex_subscription_required` के साथ skip करते हैं। डिफ़ॉल्ट रूप से, माइग्रेशन स्रोत
`app/list` कॉल नहीं करता; account gate पास करने वाले ऐप-समर्थित स्रोत Plugin
स्रोत ऐप पहुँचयोग्यता सत्यापन के बिना planned होते हैं, और account lookup transport
failures `codex_account_unavailable` के साथ skip होते हैं। `--verify-plugin-apps` के साथ,
माइग्रेशन ताज़ा स्रोत `app/list` snapshot लेता है और नेटिव activation plan करने से पहले हर owned app
का present, enabled, और accessible होना आवश्यक करता है। उस
mode में, account lookup transport failures स्रोत
app-inventory gate तक fall through करते हैं। Runtime app inventory माइग्रेशन के बाद target-session accessibility
check है। फिर Codex harness session setup enabled और accessible Plugin apps के लिए restrictive
thread app config compute करता है।

Thread app config तब compute होता है जब OpenClaw कोई Codex harness session स्थापित करता है
या stale Codex thread binding बदलता है। इसे हर turn पर recompute नहीं किया जाता, इसलिए
`/codex plugins enable` और `/codex plugins disable` नई Codex
बातचीतों को प्रभावित करते हैं। जब मौजूदा बातचीत को updated app set उठाना चाहिए, तब
`/new` या `/reset` उपयोग करें।

## V1 समर्थन सीमा

V1 जानबूझकर संकीर्ण है:

- केवल वे `openai-curated` Plugin migration-eligible हैं जो स्रोत Codex
  app-server inventory में पहले से installed थे।
- ऐप-समर्थित स्रोत Plugin को migration-time subscription gate पास करना होगा।
  `--verify-plugin-apps` स्रोत app-inventory gate जोड़ता है। Subscription-gated
  accounts और, verification mode में, inaccessible, disabled, missing source
  apps या source app-inventory refresh failures को enabled config entries के बजाय skipped manual
  items के रूप में report किया जाता है। अपठनीय Plugin details को
  source app-inventory gate से पहले skip किया जाता है।
- माइग्रेशन `marketplaceName` और
  `pluginName` के साथ स्पष्ट Plugin identities लिखता है; यह स्थानीय `marketplacePath` cache paths नहीं लिखता।
- `codexPlugins.enabled` वैश्विक enablement switch है।
- कोई `plugins["*"]` wildcard नहीं है और कोई config key नहीं है जो arbitrary
  install authority देती हो।
- Unsupported marketplaces, cached Plugin bundles, hooks, और Codex config files
  manual review के लिए migration report में preserve किए जाते हैं।

## ऐप इन्वेंटरी और ownership

OpenClaw app-server `app/list` के माध्यम से Codex app inventory पढ़ता है, उसे
एक घंटे के लिए cache करता है, और stale या missing entries को asynchronously refresh करता है। cache
केवल memory में होता है; CLI या gateway restart करने पर यह हट जाता है, और OpenClaw इसे
अगले `app/list` read से rebuild करता है।

Migration और runtime अलग cache keys उपयोग करते हैं:

- Source migration verification स्रोत Codex home और source app-server
  start options उपयोग करता है। यह केवल तब चलता है जब `--verify-plugin-apps` set हो, और यह
  उस planning run के लिए fresh source `app/list` traversal force करता है।
- Target runtime setup लक्ष्य एजेंट की Codex app-server identity उपयोग करता है जब वह
  Codex thread app config बनाता है। Plugin activation उस target
  cache key को invalidate करता है और फिर `plugin/install` के बाद उसे force-refresh करता है।

Plugin app केवल तब expose किया जाता है जब OpenClaw stable ownership के माध्यम से उसे migrated
Plugin से वापस map कर सके:

- Plugin detail से exact app id
- ज्ञात MCP server name
- unique stable metadata

Display-name-only या ambiguous ownership अगले inventory
refresh द्वारा ownership प्रमाणित होने तक exclude रहती है।

## Thread app config

OpenClaw Codex thread के लिए restrictive `config.apps` patch inject करता है:
`_default` disabled होता है और केवल enabled migrated Plugin के owned apps
enabled होते हैं।

OpenClaw effective global या
per-Plugin `allow_destructive_actions` policy से app-level `destructive_enabled` set करता है और Codex को
उसके native app tool annotations से destructive tool metadata enforce करने देता है। `true`,
`"auto"`, और `"always"` `destructive_enabled: true` set करते हैं; `false` इसे
false set करता है। `_default` app config `open_world_enabled: false` के साथ disabled होता है।
Enabled Plugin apps `open_world_enabled: true` के साथ emitted होते हैं; OpenClaw
अलग Plugin open-world policy knob expose नहीं करता और
per-Plugin destructive tool-name deny lists maintain नहीं करता।

Plugin apps के लिए tool approval mode डिफ़ॉल्ट रूप से automatic होता है ताकि non-destructive
read tools same-thread approval UI के बिना चल सकें। Destructive tools
हर ऐप की `destructive_enabled` policy से controlled रहते हैं।

## Destructive action policy

Migrated Codex Plugin के लिए destructive Plugin elicitations डिफ़ॉल्ट रूप से allowed हैं,
जबकि unsafe schemas और ambiguous ownership अभी भी fail closed होते हैं:

- Global `allow_destructive_actions` डिफ़ॉल्ट रूप से `true` है।
- Per-Plugin `allow_destructive_actions` उस
  Plugin के लिए global policy को override करता है।
- जब policy `false` होती है, OpenClaw deterministic decline लौटाता है।
- जब policy `true` होती है, OpenClaw केवल safe schemas को auto-accept करता है जिन्हें वह
  approval response से map कर सकता है, जैसे boolean approve field।
- जब policy `"auto"` होती है, OpenClaw destructive Plugin actions को
  Codex के सामने expose करता है लेकिन ownership-proven MCP approval elicitations को Codex approval response लौटाने से पहले OpenClaw
  Plugin approvals में बदल देता है।
- जब policy `"always"` होती है, OpenClaw `"auto"` जैसी ही Codex write/destructive
  gating उपयोग करता है, thread शुरू होने से पहले ऐप के लिए durable Codex per-tool approval overrides clear करता है, और केवल one-shot approval या denial offer करता है ताकि
  durable approvals बाद के write-action prompts को suppress न कर सकें।
- Missing Plugin identity, ambiguous ownership, missing turn id, wrong turn
  id, या unsafe elicitation schema prompt करने के बजाय decline करता है।

## समस्या निवारण

**`auth_required`:** माइग्रेशन ने Plugin install किया, लेकिन इसके apps में से एक को अभी भी
authentication चाहिए। स्पष्ट Plugin entry तब तक disabled लिखी जाती है जब तक आप
reauthorize करके उसे enable नहीं करते।

**`app_inaccessible`, `app_disabled`, या `app_missing`:**
माइग्रेशन ने Plugin install नहीं किया क्योंकि स्रोत Codex app inventory ने
`--verify-plugin-apps` set होने के दौरान सभी owned apps को present, enabled, और accessible
नहीं दिखाया। Codex में app को reauthorize या enable करें, फिर
`--verify-plugin-apps` के साथ migration फिर से चलाएँ।

**`app_inventory_unavailable`:** माइग्रेशन ने Plugin install नहीं किया क्योंकि
strict source app verification request किया गया था और source Codex app inventory
refresh fail हो गया। Source Codex app-server access ठीक करें या यदि आप तेज account-gated plan स्वीकार करते हैं तो
`--verify-plugin-apps` के बिना retry करें।

**`codex_subscription_required`:** माइग्रेशन ने app-backed
Plugin install नहीं किया क्योंकि source Codex app-server account
ChatGPT subscription account से logged in नहीं था। Subscription auth के साथ Codex app में log in करें,
फिर migration फिर से चलाएँ।

**`codex_account_unavailable`:** माइग्रेशन ने app-backed Plugin install नहीं किया
क्योंकि source Codex app-server account पढ़ा नहीं जा सका। Source Codex
app-server auth ठीक करें या यदि आप चाहते हैं कि account lookup fail होने पर source app
inventory eligibility तय करे, तो `--verify-plugin-apps` के साथ rerun करें।

**`marketplace_missing` या `plugin_missing`:** target Codex app-server
expected `openai-curated` marketplace या Plugin नहीं देख सकता। Target runtime के विरुद्ध migration
फिर से चलाएँ या Codex app-server Plugin status inspect करें।

**`app_inventory_missing` या `app_inventory_stale`:** app readiness
empty या stale cache से आई। OpenClaw async refresh schedule करता है और ownership तथा readiness known होने तक Plugin
apps को exclude करता है।

**`app_ownership_ambiguous`:** app inventory केवल display name से match हुई, इसलिए
app Codex thread को expose नहीं की जाती।

**Config बदल गया लेकिन एजेंट Plugin नहीं देख सकता:** configured state confirm करने के लिए `/codex plugins
list` उपयोग करें, फिर `/new` या `/reset` उपयोग करें। मौजूदा
Codex thread bindings वही app config रखते हैं जिसके साथ वे शुरू हुए थे, जब तक OpenClaw
नई harness session स्थापित नहीं करता या stale binding replace नहीं करता।

**विनाशकारी कार्रवाई अस्वीकृत है:** वैश्विक और प्रति-Plugin
`allow_destructive_actions` मानों की जांच करें। नीति `true`, `"auto"`, या
`"always"` होने पर भी, असुरक्षित elicitation schemas और अस्पष्ट Plugin पहचान अब भी
fail closed होती हैं।

## संबंधित

- [Codex हार्नेस](/hi/plugins/codex-harness)
- [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference)
- [Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI माइग्रेट करें](/hi/cli/migrate)
