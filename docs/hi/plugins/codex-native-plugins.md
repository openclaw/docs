---
read_when:
    - आप चाहते हैं कि Codex-mode OpenClaw एजेंट मूल Codex plugins का उपयोग करें
    - आप स्रोत-इंस्टॉल किए गए openai-curated Codex plugins को माइग्रेट कर रहे हैं
    - आप codexPlugins, ऐप सूची, विनाशकारी कार्रवाइयों, या Plugin ऐप निदान की समस्या का निवारण कर रहे हैं
summary: माइग्रेट किए गए नेटिव Codex Plugin को Codex-मोड OpenClaw एजेंटों के लिए कॉन्फ़िगर करें
title: नेटिव Codex Plugin
x-i18n:
    generated_at: "2026-07-02T00:57:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex Plugin समर्थन से Codex-mode OpenClaw agent उसी Codex thread के भीतर Codex ऐप-सर्वर की अपनी ऐप और Plugin क्षमताओं का उपयोग कर सकता है, जो OpenClaw turn को संभालता है।

OpenClaw, Codex Plugins को कृत्रिम `codex_plugin_*` OpenClaw dynamic tools में अनुवादित नहीं करता। Plugin calls native Codex transcript में रहती हैं, और app-backed MCP execution का स्वामित्व Codex ऐप-सर्वर के पास रहता है।

इस पेज का उपयोग तब करें जब बेस [Codex harness](/hi/plugins/codex-harness) काम कर रहा हो।

## आवश्यकताएं

- चुना गया OpenClaw agent runtime native Codex harness होना चाहिए।
- `plugins.entries.codex.enabled` true होना चाहिए।
- `plugins.entries.codex.config.codexPlugins.enabled` true होना चाहिए।
- V1 केवल उन `openai-curated` Plugins का समर्थन करता है जिन्हें migration ने source Codex home में source-installed के रूप में देखा था।
- लक्ष्य Codex ऐप-सर्वर अपेक्षित marketplace, Plugin, और app inventory देख पाने में सक्षम होना चाहिए।

`codexPlugins` का OpenClaw runs, सामान्य OpenAI provider runs, ACP conversation bindings, या अन्य harnesses पर कोई प्रभाव नहीं होता, क्योंकि वे paths native `apps` config के साथ Codex ऐप-सर्वर threads नहीं बनाते।

OpenAI-side Codex access, app availability, और workspace app/Plugin controls signed-in Codex account से आते हैं। OpenAI account और admin model के लिए, [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) देखें।

## त्वरित शुरुआत

source Codex home से migration का preview करें:

```bash
openclaw migrate codex --dry-run
```

जब आप migration से native Plugin activation की योजना बनाने से पहले source app accessibility जांचवाना चाहते हैं, तब strict source app verification का उपयोग करें:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

जब plan सही लगे, migration apply करें:

```bash
openclaw migrate apply codex --yes
```

Migration पात्र Plugins के लिए स्पष्ट `codexPlugins` entries लिखता है और चुने गए Plugins के लिए Codex ऐप-सर्वर `plugin/install` call करता है। एक सामान्य migrated config ऐसा दिखता है:

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

`codexPlugins` बदलने के बाद, नई Codex conversations updated app set को अपने आप अपना लेती हैं। वर्तमान conversation को refresh करने के लिए `/new` या `/reset` का उपयोग करें। Plugin enable या disable changes के लिए gateway restart आवश्यक नहीं है।

## chat से Plugins प्रबंधित करें

जब आप उसी chat से configured native Codex Plugins inspect या change करना चाहते हैं जहां आप Codex harness operate करते हैं, तो `/codex plugins` का उपयोग करें:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins`, `/codex plugins list` का alias है। list output में configured Plugin keys, on/off state, Codex Plugin name, और `plugins.entries.codex.config.codexPlugins.plugins` से marketplace दिखते हैं।

`enable` और `disable` केवल `~/.openclaw/openclaw.json` पर OpenClaw config लिखते हैं; वे `~/.codex/config.toml` edit नहीं करते या नए Codex Plugins install नहीं करते। केवल owner या `operator.admin` scope वाला gateway client Plugin state बदल सकता है।

Configured Plugin enable करने से global `codexPlugins.enabled` switch भी on हो जाता है। यदि Plugin इसलिए disabled लिखा गया था क्योंकि migration ने `auth_required` लौटाया था, तो उसे OpenClaw में enable करने से पहले Codex में app को reauthorize करें।

## Native Plugin setup कैसे काम करता है

Integration की तीन अलग-अलग states हैं:

- Installed: Codex के पास target app-server runtime में local Plugin bundle है।
- Enabled: OpenClaw config, Plugin को Codex harness turns के लिए उपलब्ध कराने को तैयार है।
- Accessible: Codex ऐप-सर्वर पुष्टि करता है कि Plugin की app entries active account के लिए उपलब्ध हैं और migrated Plugin identity से map की जा सकती हैं।

Migration durable install/eligibility step है। Planning के दौरान, OpenClaw source Codex `plugin/read` details पढ़ता है और जांचता है कि source Codex ऐप-सर्वर account response एक ChatGPT subscription account है। Non-ChatGPT या missing account responses app-backed Plugins को `codex_subscription_required` के साथ skip करते हैं। Default रूप से, migration source `app/list` call नहीं करता; account gate pass करने वाले app-backed source Plugins को source app accessibility verification के बिना plan किया जाता है, और account lookup transport failures `codex_account_unavailable` के साथ skip होते हैं। `--verify-plugin-apps` के साथ, migration ताजा source `app/list` snapshot लेता है और native activation plan करने से पहले हर owned app का present, enabled, और accessible होना आवश्यक करता है। उस mode में, account lookup transport failures source app-inventory gate तक fall through करते हैं। Runtime app inventory migration के बाद target-session accessibility check है। फिर Codex harness session setup enabled और accessible Plugin apps के लिए restrictive thread app config compute करता है।

Thread app config तब compute होता है जब OpenClaw Codex harness session स्थापित करता है या stale Codex thread binding replace करता है। यह हर turn पर recompute नहीं होता, इसलिए `/codex plugins enable` और `/codex plugins disable` नई Codex conversations को प्रभावित करते हैं। जब current conversation को updated app set लेना चाहिए, तो `/new` या `/reset` का उपयोग करें।

## V1 support boundary

V1 जानबूझकर सीमित है:

- केवल वे `openai-curated` Plugins migration-eligible हैं जो source Codex ऐप-सर्वर inventory में पहले से installed थे।
- App-backed source Plugins को migration-time subscription gate pass करना होगा। `--verify-plugin-apps` source app-inventory gate जोड़ता है। Subscription-gated accounts और, verification mode में, inaccessible, disabled, missing source apps या source app-inventory refresh failures को enabled config entries के बजाय skipped manual items के रूप में report किया जाता है। Unreadable Plugin details source app-inventory gate से पहले skip हो जाती हैं।
- Migration `marketplaceName` और `pluginName` के साथ स्पष्ट Plugin identities लिखता है; यह local `marketplacePath` cache paths नहीं लिखता।
- `codexPlugins.enabled` global enablement switch है।
- कोई `plugins["*"]` wildcard नहीं है और कोई config key नहीं है जो arbitrary install authority देती हो।
- Unsupported marketplaces, cached Plugin bundles, hooks, और Codex config files manual review के लिए migration report में preserve किए जाते हैं।

## App inventory और ownership

OpenClaw app-server `app/list` के माध्यम से Codex app inventory पढ़ता है, उसे एक घंटे के लिए cache करता है, और stale या missing entries को asynchronously refresh करता है। Cache केवल memory में होता है; CLI या gateway restart करने से यह drop हो जाता है, और OpenClaw अगले `app/list` read से इसे फिर बनाता है।

Migration और runtime अलग cache keys का उपयोग करते हैं:

- Source migration verification source Codex home और source app-server start options का उपयोग करता है। यह केवल तब चलता है जब `--verify-plugin-apps` set हो, और उस planning run के लिए fresh source `app/list` traversal force करता है।
- Target runtime setup target agent की Codex ऐप-सर्वर identity का उपयोग करता है जब वह Codex thread app config बनाता है। Plugin activation उस target cache key को invalidate करता है और फिर `plugin/install` के बाद उसे force-refresh करता है।

Plugin app केवल तब expose होता है जब OpenClaw उसे stable ownership के माध्यम से migrated Plugin से वापस map कर सके:

- Plugin detail से exact app id
- known MCP server name
- unique stable metadata

Display-name-only या ambiguous ownership अगले inventory refresh द्वारा ownership साबित होने तक exclude रहती है।

## Thread app config

OpenClaw Codex thread के लिए restrictive `config.apps` patch inject करता है: `_default` disabled होता है और केवल enabled migrated Plugins के owned apps enabled होते हैं।

OpenClaw effective global या per-Plugin `allow_destructive_actions` policy से app-level `destructive_enabled` set करता है और Codex को उसके native app tool annotations से destructive tool metadata enforce करने देता है। `true`, `"auto"`, और `"ask"` `destructive_enabled: true` set करते हैं; `false` इसे false set करता है। `_default` app config `open_world_enabled: false` के साथ disabled होता है। Enabled Plugin apps `open_world_enabled: true` के साथ emitted होते हैं; OpenClaw अलग Plugin open-world policy knob expose नहीं करता और per-Plugin destructive tool-name deny lists maintain नहीं करता।

Tool approval mode Plugin apps के लिए default रूप से automatic है ताकि non-destructive read tools same-thread approval UI के बिना चल सकें। Destructive tools प्रत्येक app की `destructive_enabled` policy द्वारा controlled रहते हैं।

## Destructive action policy

Migrated Codex Plugins के लिए destructive Plugin elicitations default रूप से allowed हैं, जबकि unsafe schemas और ambiguous ownership अब भी fail closed होते हैं:

- Global `allow_destructive_actions` default रूप से `true` है।
- Per-Plugin `allow_destructive_actions` उस Plugin के लिए global policy override करता है।
- जब policy `false` होती है, OpenClaw deterministic decline लौटाता है।
- जब policy `true` होती है, OpenClaw केवल safe schemas को auto-accept करता है जिन्हें वह approval response से map कर सकता है, जैसे boolean approve field।
- जब policy `"auto"` होती है, OpenClaw destructive Plugin actions को Codex के सामने expose करता है लेकिन ownership-proven MCP approval elicitations को Codex approval response लौटाने से पहले OpenClaw Plugin approvals में बदल देता है।
- जब policy `"ask"` होती है, OpenClaw `"auto"` जैसी ही Codex write/destructive gating का उपयोग करता है, thread शुरू होने से पहले app के लिए durable Codex per-tool approval overrides clear करता है, और केवल one-shot approval या denial offer करता है ताकि durable approvals बाद के write-action prompts suppress न कर सकें।
- `"ask"` का उपयोग करने वाले प्रत्येक admitted app के लिए, OpenClaw उस app के लिए Codex का human approvals reviewer चुनता है ताकि Codex अपनी approval elicitations OpenClaw को भेजे। Other apps और non-app thread approvals अपने configured reviewer और policy रखते हैं।
- Missing Plugin identity, ambiguous ownership, missing turn id, wrong turn id, या unsafe elicitation schema prompting के बजाय decline करता है।

## समस्या निवारण

**`auth_required`:** migration ने Plugin install किया, लेकिन इसकी किसी app को अब भी authentication चाहिए। जब तक आप reauthorize और enable नहीं करते, explicit Plugin entry disabled लिखी जाती है।

**`app_inaccessible`, `app_disabled`, या `app_missing`:**
migration ने Plugin install नहीं किया क्योंकि `--verify-plugin-apps` set होने पर source Codex app inventory ने सभी owned apps को present, enabled, और accessible के रूप में नहीं दिखाया। Codex में app को reauthorize या enable करें, फिर `--verify-plugin-apps` के साथ migration फिर चलाएं।

**`app_inventory_unavailable`:** migration ने Plugin install नहीं किया क्योंकि strict source app verification requested था और source Codex app inventory refresh failed हुआ। Source Codex ऐप-सर्वर access ठीक करें या यदि आप faster account-gated plan स्वीकार करते हैं तो `--verify-plugin-apps` के बिना retry करें।

**`codex_subscription_required`:** migration ने app-backed Plugin install नहीं किया क्योंकि source Codex ऐप-सर्वर account ChatGPT subscription account से logged in नहीं था। Subscription auth के साथ Codex app में log in करें, फिर migration फिर चलाएं।

**`codex_account_unavailable`:** migration ने app-backed Plugin install नहीं किया क्योंकि source Codex ऐप-सर्वर account read नहीं किया जा सका। Source Codex ऐप-सर्वर auth ठीक करें या यदि आप account lookup fail होने पर eligibility तय करने के लिए source app inventory चाहते हैं तो `--verify-plugin-apps` के साथ rerun करें।

**`marketplace_missing` या `plugin_missing`:** target Codex ऐप-सर्वर अपेक्षित `openai-curated` marketplace या Plugin नहीं देख सकता। Target runtime के विरुद्ध migration फिर चलाएं या Codex ऐप-सर्वर Plugin status inspect करें।

**`app_inventory_missing` या `app_inventory_stale`:** app readiness empty या stale cache से आई। OpenClaw async refresh schedule करता है और ownership और readiness ज्ञात होने तक Plugin apps exclude करता है।

**`app_ownership_ambiguous`:** app inventory केवल display name से match हुई, इसलिए app Codex thread के सामने expose नहीं होती।

**कॉन्फ़िगरेशन बदल गया है, लेकिन एजेंट Plugin नहीं देख पा रहा है:** कॉन्फ़िगर की गई स्थिति की पुष्टि करने के लिए `/codex plugins
list` का उपयोग करें, फिर `/new` या `/reset` का उपयोग करें। मौजूदा
Codex थ्रेड बाइंडिंग वही ऐप कॉन्फ़िगरेशन रखती हैं जिसके साथ वे शुरू हुई थीं, जब तक OpenClaw
नई हार्नेस सेशन स्थापित नहीं करता या पुरानी बाइंडिंग को बदल नहीं देता।

**विनाशकारी कार्रवाई अस्वीकार कर दी गई है:** वैश्विक और प्रति-Plugin
`allow_destructive_actions` मान जांचें। नीति `true`, `"auto"`, या
`"ask"` होने पर भी, असुरक्षित एलिसिटेशन स्कीमा और अस्पष्ट Plugin पहचान फिर भी
fail closed होती है।

## संबंधित

- [Codex हार्नेस](/hi/plugins/codex-harness)
- [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference)
- [Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI माइग्रेट करें](/hi/cli/migrate)
