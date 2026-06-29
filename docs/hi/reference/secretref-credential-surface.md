---
read_when:
    - SecretRef क्रेडेंशियल कवरेज का सत्यापन
    - यह ऑडिट करना कि कोई क्रेडेंशियल `secrets configure` या `secrets apply` के लिए पात्र है या नहीं
    - यह सत्यापित करना कि कोई क्रेडेंशियल समर्थित सतह से बाहर क्यों है
summary: मानक समर्थित बनाम असमर्थित SecretRef क्रेडेंशियल सतह
title: SecretRef क्रेडेंशियल सतह
x-i18n:
    generated_at: "2026-06-29T00:09:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

यह पेज प्रामाणिक SecretRef क्रेडेंशियल सतह को परिभाषित करता है।

दायरे का उद्देश्य:

- दायरे में: केवल उपयोगकर्ता द्वारा दिए गए क्रेडेंशियल, जिन्हें OpenClaw जारी या रोटेट नहीं करता।
- दायरे से बाहर: रनटाइम में जारी या रोटेट होने वाले क्रेडेंशियल, OAuth रिफ्रेश सामग्री, और सेशन-जैसी आर्टिफैक्ट।

## समर्थित क्रेडेंशियल

### `openclaw.json` लक्ष्य (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `talk.realtime.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google-meet.config.realtime.providers.*.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.parallel.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `tools.web.search.*.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.relay.authToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.relay.authToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.sms.authToken`
- `channels.sms.accounts.*.authToken`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.qqbot.clientSecret`
- `channels.qqbot.accounts.*.clientSecret`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` सिबलिंग `serviceAccountRef` के माध्यम से (संगतता अपवाद)
- `channels.googlechat.accounts.*.serviceAccount` सिबलिंग `serviceAccountRef` के माध्यम से (संगतता अपवाद)

### `auth-profiles.json` लक्ष्य (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; `auth.profiles.<id>.mode = "oauth"` होने पर असमर्थित)
- `profiles.*.tokenRef` (`type: "token"`; `auth.profiles.<id>.mode = "oauth"` होने पर असमर्थित)

[//]: # "secretref-supported-list-end"

नोट्स:

- Auth-profile प्लान लक्ष्यों के लिए `agentId` आवश्यक है।
- प्लान एंट्रियां `profiles.*.key` / `profiles.*.token` को लक्ष्य बनाती हैं और सिबलिंग refs (`keyRef` / `tokenRef`) लिखती हैं।
- Auth-profile refs रनटाइम रिज़ॉल्यूशन और ऑडिट कवरेज में शामिल हैं।
- `openclaw.json` में, SecretRefs को `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` जैसे संरचित ऑब्जेक्ट इस्तेमाल करने चाहिए। पुराने `secretref-env:<ENV_VAR>` मार्कर स्ट्रिंग SecretRef क्रेडेंशियल पाथ पर अस्वीकार किए जाते हैं; मान्य मार्कर माइग्रेट करने के लिए `openclaw doctor --fix` चलाएं।
- OAuth नीति गार्ड: `auth.profiles.<id>.mode = "oauth"` को उस प्रोफाइल के SecretRef इनपुट के साथ जोड़ा नहीं जा सकता। इस नीति का उल्लंघन होने पर स्टार्टअप/रीलोड और auth-profile रिज़ॉल्यूशन तुरंत विफल हो जाते हैं।
- SecretRef-प्रबंधित मॉडल प्रोवाइडर के लिए, जनरेट की गई `agents/*/agent/models.json` एंट्रियां `apiKey`/हेडर सतहों के लिए गैर-सीक्रेट मार्कर (रिज़ॉल्व किए गए सीक्रेट मान नहीं) बनाए रखती हैं।
- मार्कर पर्सिस्टेंस स्रोत-प्रामाणिक है: OpenClaw सक्रिय स्रोत कॉन्फ़िग स्नैपशॉट (प्री-रिज़ॉल्यूशन) से मार्कर लिखता है, रिज़ॉल्व किए गए रनटाइम सीक्रेट मानों से नहीं।
- वेब सर्च के लिए:
  - स्पष्ट प्रोवाइडर मोड में (`tools.web.search.provider` सेट), केवल चयनित प्रोवाइडर कुंजी सक्रिय होती है।
  - ऑटो मोड में (`tools.web.search.provider` अनसेट), केवल पहली प्रोवाइडर कुंजी सक्रिय होती है जो प्राथमिकता के अनुसार रिज़ॉल्व होती है।
  - ऑटो मोड में, चयनित न किए गए प्रोवाइडर refs को चयनित होने तक निष्क्रिय माना जाता है।
  - पुराने `tools.web.search.*` प्रोवाइडर पाथ अभी भी संगतता विंडो के दौरान रिज़ॉल्व होते हैं, लेकिन प्रामाणिक SecretRef सतह `plugins.entries.<plugin>.config.webSearch.*` है।

## असमर्थित क्रेडेंशियल

दायरे से बाहर के क्रेडेंशियल में शामिल हैं:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

कारण:

- ये क्रेडेंशियल जारी किए गए, रोटेट किए गए, सेशन-युक्त, या OAuth-टिकाऊ वर्ग हैं जो रीड-ओनली बाहरी SecretRef रिज़ॉल्यूशन में फिट नहीं होते।

## संबंधित

- [सीक्रेट्स प्रबंधन](/hi/gateway/secrets)
- [ऑथ क्रेडेंशियल अर्थविज्ञान](/hi/auth-credential-semantics)
