---
read_when:
    - Weryfikujesz zakres obsługi poświadczeń SecretRef
    - Sprawdzasz, czy poświadczenie kwalifikuje się do `secrets configure` lub `secrets apply`
    - Sprawdzasz, dlaczego poświadczenie znajduje się poza obsługiwanym zakresem
summary: 'Kanoniczna powierzchnia poświadczeń SecretRef: obsługiwana i nieobsługiwana'
title: Powierzchnia poświadczeń SecretRef
x-i18n:
    generated_at: "2026-04-05T14:04:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf997389de1dae8c059d8dfbf186eda979f864de632a033177d6cd5e5544675d
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

# Powierzchnia poświadczeń SecretRef

Ta strona definiuje kanoniczną powierzchnię poświadczeń SecretRef.

Zakres:

- W zakresie: wyłącznie poświadczenia dostarczane przez użytkownika, których OpenClaw nie tworzy ani nie rotuje.
- Poza zakresem: poświadczenia tworzone lub rotowane w runtime, materiały do odświeżania OAuth oraz artefakty podobne do sesji.

## Obsługiwane poświadczenia

### Cele `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.firecrawl.config.webFetch.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
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
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
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
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
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
- `channels.googlechat.serviceAccount` przez sąsiedni `serviceAccountRef` (wyjątek zgodności)
- `channels.googlechat.accounts.*.serviceAccount` przez sąsiedni `serviceAccountRef` (wyjątek zgodności)

### Cele `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Uwagi:

- Cele planów profili uwierzytelniania wymagają `agentId`.
- Wpisy planu wskazują na `profiles.*.key` / `profiles.*.token` i zapisują sąsiednie referencje (`keyRef` / `tokenRef`).
- Referencje profili uwierzytelniania są uwzględniane w rozwiązywaniu runtime i w zakresie audytu.
- Ochrona polityki OAuth: `auth.profiles.<id>.mode = "oauth"` nie może być łączone z wejściami SecretRef dla tego profilu. Uruchomienie/przeładowanie oraz rozwiązywanie profilu uwierzytelniania kończą się natychmiastowym błędem, gdy ta polityka zostanie naruszona.
- Dla providerów modeli zarządzanych przez SecretRef wygenerowane wpisy `agents/*/agent/models.json` zachowują znaczniki niebędące sekretami (a nie rozwiązane wartości sekretów) dla powierzchni `apiKey`/nagłówków.
- Trwałość znaczników jest źródłowo autorytatywna: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (przed rozwiązywaniem), a nie z rozwiązanych wartości sekretów runtime.
- Dla wyszukiwania w internecie:
  - W trybie jawnego providera (ustawione `tools.web.search.provider`) aktywny jest tylko klucz wybranego providera.
  - W trybie automatycznym (nieustawione `tools.web.search.provider`) aktywny jest tylko pierwszy klucz providera, który zostanie rozwiązany zgodnie z precedencją.
  - W trybie automatycznym referencje niewybranych providerów są traktowane jako nieaktywne do czasu wybrania.
  - Starsze ścieżki providera `tools.web.search.*` nadal są rozwiązywane w okresie zgodności, ale kanoniczną powierzchnią SecretRef jest `plugins.entries.<plugin>.config.webSearch.*`.

## Nieobsługiwane poświadczenia

Poświadczenia poza zakresem obejmują:

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

Uzasadnienie:

- Te poświadczenia są tworzone, rotowane, zawierają stan sesji albo należą do trwałych klas OAuth, które nie pasują do zewnętrznego rozwiązywania SecretRef tylko do odczytu.
