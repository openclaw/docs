---
read_when:
    - आप channel खाते जोड़ना/हटाना चाहते हैं (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - आप चैनल की स्थिति जाँचना या चैनल लॉग्स को tail करना चाहते हैं
summary: '`openclaw channels` के लिए CLI संदर्भ (खाते, स्थिति, लॉगिन/लॉगआउट, लॉग)'
title: चैनल
x-i18n:
    generated_at: "2026-06-28T22:47:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway पर चैट चैनल खातों और उनकी रनटाइम स्थिति को प्रबंधित करें।

संबंधित दस्तावेज़:

- चैनल मार्गदर्शिकाएँ: [चैनल](/hi/channels)
- Gateway कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

## सामान्य कमांड

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` केवल चैट चैनल दिखाता है: डिफ़ॉल्ट रूप से कॉन्फ़िगर किए गए खाते, हर खाते के लिए `installed`, `configured`, और `enabled` स्थिति टैग के साथ। `--all` पास करें ताकि वे बंडल किए गए चैनल भी दिखें जिनका अभी कोई कॉन्फ़िगर किया गया खाता नहीं है, और वे इंस्टॉल किए जा सकने वाले कैटलॉग चैनल भी दिखें जो अभी डिस्क पर नहीं हैं। Auth providers (OAuth + API keys) और model-provider usage/quota snapshots अब यहाँ प्रिंट नहीं होते; provider auth profiles के लिए `openclaw models auth list` और usage के लिए `openclaw status` या `openclaw models list` का उपयोग करें।

## स्थिति / क्षमताएँ / हल करें / लॉग

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (केवल `--channel` के साथ), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` लाइव पाथ है: पहुँच योग्य gateway पर यह प्रति-खाता
`probeAccount` और वैकल्पिक `auditAccount` जाँच चलाता है, इसलिए आउटपुट में transport
स्थिति के साथ `works`, `probe failed`, `audit ok`, या `audit failed` जैसे probe परिणाम शामिल हो सकते हैं।
अगर gateway पहुँच योग्य नहीं है, तो `channels status` लाइव probe आउटपुट के बजाय केवल-कॉन्फ़िग सारांशों पर वापस चला जाता है।

चैनल socket-health signal के रूप में `openclaw sessions`, Gateway `sessions.list`, या agent
`sessions_list` tool का उपयोग न करें। ये surfaces
stored conversation rows रिपोर्ट करते हैं, provider runtime state नहीं। Discord provider
restart के बाद, connected लेकिन quiet account स्वस्थ हो सकता है, जबकि अगले inbound या outbound conversation event तक कोई Discord session
row दिखाई न दे।

## खाते जोड़ें / हटाएँ

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` प्रति-चैनल flags (token, private key, app token, signal-cli paths, आदि) दिखाता है।
</Tip>

`channels remove` केवल installed/configured channel plugins पर काम करता है। installable catalog channels के लिए पहले `channels add` का उपयोग करें।
runtime-backed channel plugins के लिए, `channels remove` config अपडेट करने से पहले running Gateway से चुने गए खाते को रोकने के लिए भी कहता है, इसलिए किसी खाते को disable या delete करने पर पुराना listener restart तक active नहीं रहता।

सामान्य non-interactive add surfaces में शामिल हैं:

- bot-token channels: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage transport fields: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat fields: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix fields: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr fields: `--private-key`, `--relay-urls`
- Tlon fields: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- supported होने पर default-account env-backed auth के लिए `--use-env`

अगर flag-driven add command के दौरान किसी channel plugin को install करना पड़े, तो OpenClaw interactive plugin install prompt खोले बिना channel के default install source का उपयोग करता है।

जब आप बिना flags के `openclaw channels add` चलाते हैं, तो interactive wizard prompt कर सकता है:

- चुने गए हर channel के लिए account ids
- उन accounts के लिए optional display names
- `Route these channel accounts to agents now?`

अगर आप अभी bind करने की पुष्टि करते हैं, तो wizard पूछता है कि हर configured channel account का मालिक कौन-सा agent होना चाहिए और account-scoped routing bindings लिखता है।

आप बाद में वही routing rules `openclaw agents bindings`, `openclaw agents bind`, और `openclaw agents unbind` से भी प्रबंधित कर सकते हैं ([agents](/hi/cli/agents) देखें)।

जब आप किसी ऐसे channel में non-default account जोड़ते हैं जो अभी भी single-account top-level settings का उपयोग कर रहा है, OpenClaw नया account लिखने से पहले account-scoped top-level values को channel के account map में promote करता है। अधिकांश channels उन values को `channels.<channel>.accounts.default` में रखते हैं, लेकिन bundled channels मौजूदा matching promoted account को भी preserve कर सकते हैं। Matrix वर्तमान उदाहरण है: अगर कोई named account पहले से मौजूद है, या `defaultAccount` किसी existing named account की ओर points करता है, तो promotion नया `accounts.default` बनाने के बजाय उस account को preserve करता है।

Routing behavior consistent रहता है:

- मौजूदा channel-only bindings (बिना `accountId`) default account से match करना जारी रखते हैं।
- `channels add` non-interactive mode में bindings को auto-create या rewrite नहीं करता।
- Interactive setup वैकल्पिक रूप से account-scoped bindings जोड़ सकता है।

अगर आपका config पहले से mixed state में था (named accounts मौजूद और top-level single-account values अभी भी set), तो उस channel के लिए चुने गए promoted account में account-scoped values move करने के लिए `openclaw doctor --fix` चलाएँ। अधिकांश channels `accounts.default` में promote करते हैं; Matrix इसके बजाय existing named/default target को preserve कर सकता है।

## लॉगिन और लॉगआउट (interactive)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` `--verbose` को support करता है।
- `channels login` और `logout` channel infer कर सकते हैं जब केवल एक supported login target configured हो।
- `channels logout` reachable होने पर live Gateway path को prefer करता है, इसलिए logout channel auth state clear करने से पहले किसी भी active listener को रोक देता है। अगर local Gateway reachable नहीं है, तो यह local auth cleanup पर fallback करता है।
- Gateway host पर terminal से `channels login` चलाएँ। Agent `exec` इस interactive login flow को block करता है; chat से उपलब्ध होने पर channel-native agent login tools, जैसे `whatsapp_login`, का उपयोग किया जाना चाहिए।

## समस्या निवारण

- broad probe के लिए `openclaw status --deep` चलाएँ।
- guided fixes के लिए `openclaw doctor` का उपयोग करें।
- `openclaw channels list` अब model provider usage/quota snapshots print नहीं करता। इनके लिए `openclaw status` (overview) या `openclaw models list` (per-provider) का उपयोग करें।
- gateway unreachable होने पर `openclaw channels status` config-only summaries पर fallback करता है। अगर supported channel credential SecretRef के ज़रिए configured है लेकिन current command path में unavailable है, तो यह उस account को not configured दिखाने के बजाय degraded notes के साथ configured के रूप में report करता है।

## क्षमताओं का probe

provider capability hints (जहाँ उपलब्ध हों वहाँ intents/scopes) और static feature support प्राप्त करें:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

नोट्स:

- `--channel` optional है; हर channel (extensions सहित) list करने के लिए इसे omit करें।
- `--account` केवल `--channel` के साथ valid है।
- `--target` `channel:<id>` या raw numeric channel id accept करता है और केवल Discord पर apply होता है। Discord voice channels के लिए, permission check missing `ViewChannel`, `Connect`, `Speak`, `SendMessages`, और `ReadMessageHistory` को flag करता है।
- Probes provider-specific हैं: Discord intents + optional channel permissions; Slack bot + user scopes; Telegram bot flags + webhook; Signal daemon version; Microsoft Teams app token + Graph roles/scopes (जहाँ known हो वहाँ annotated)। बिना probes वाले channels `Probe: unavailable` report करते हैं।

## नामों को IDs में resolve करें

provider directory का उपयोग करके channel/user names को IDs में resolve करें:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

नोट्स:

- target type force करने के लिए `--kind user|group|auto` का उपयोग करें।
- जब कई entries का समान नाम हो, तो resolution active matches को prefer करता है।
- `channels resolve` read-only है। अगर selected account SecretRef के ज़रिए configured है लेकिन वह credential current command path में unavailable है, तो command पूरे run को abort करने के बजाय notes के साथ degraded unresolved results return करता है।
- `channels resolve` channel plugins install नहीं करता। installable catalog channel के लिए names resolve करने से पहले `channels add --channel <name>` का उपयोग करें।

## संबंधित

- [CLI reference](/hi/cli)
- [Channels overview](/hi/channels)
