---
read_when:
    - Weryfikacja pokrycia poświadczeń SecretRef
    - Audytowanie, czy poświadczenie kwalifikuje się do `secrets configure` lub `secrets apply`
    - Sprawdzanie, dlaczego dane uwierzytelniające znajdują się poza obsługiwanym zakresem
summary: Kanoniczny zakres obsługiwanych i nieobsługiwanych poświadczeń SecretRef
title: Powierzchnia poświadczeń SecretRef
x-i18n:
    generated_at: "2026-05-10T19:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2778ea781f7b6fc4d579892225f9cf29bfb8f9ece5961554620ca8e82123ceff
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Ta strona definiuje kanoniczną powierzchnię poświadczeń SecretRef.

Zakres:

- W zakresie: wyłącznie poświadczenia dostarczane przez użytkownika, których OpenClaw nie tworzy ani nie rotuje.
- Poza zakresem: poświadczenia tworzone lub rotowane w czasie wykonywania, materiały odświeżania OAuth oraz artefakty podobne do sesji.

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
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
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
- `channels.googlechat.serviceAccount` przez sąsiedni `serviceAccountRef` (wyjątek zgodności)
- `channels.googlechat.accounts.*.serviceAccount` przez sąsiedni `serviceAccountRef` (wyjątek zgodności)

### Cele `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Uwagi:

- Cele planu auth-profile wymagają `agentId`.
- Wpisy planu wskazują `profiles.*.key` / `profiles.*.token` i zapisują sąsiednie referencje (`keyRef` / `tokenRef`).
- Referencje auth-profile są uwzględniane w rozwiązywaniu w czasie wykonywania i pokryciu audytu.
- W `openclaw.json` SecretRefs muszą używać obiektów strukturalnych, takich jak `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Starsze ciągi znaczników `secretref-env:<ENV_VAR>` są odrzucane na ścieżkach poświadczeń SecretRef; uruchom `openclaw doctor --fix`, aby zmigrować poprawne znaczniki.
- Strażnik polityki OAuth: `auth.profiles.<id>.mode = "oauth"` nie może być łączone z wejściami SecretRef dla tego profilu. Uruchamianie/ponowne ładowanie oraz rozwiązywanie auth-profile szybko kończą się błędem, gdy ta polityka zostanie naruszona.
- W przypadku dostawców modeli zarządzanych przez SecretRef wygenerowane wpisy `agents/*/agent/models.json` utrwalają niesekretne znaczniki (nie rozwiązane wartości sekretów) dla powierzchni `apiKey`/nagłówków.
- Trwałość znaczników jest autorytatywna względem źródła: OpenClaw zapisuje znaczniki z aktywnego zrzutu konfiguracji źródłowej (przed rozwiązaniem), nie z rozwiązanych wartości sekretów w czasie wykonywania.
- W przypadku wyszukiwania w sieci:
  - W trybie jawnego dostawcy (ustawione `tools.web.search.provider`) aktywny jest tylko klucz wybranego dostawcy.
  - W trybie automatycznym (nieustawione `tools.web.search.provider`) aktywny jest tylko pierwszy klucz dostawcy, który zostanie rozwiązany zgodnie z priorytetem.
  - W trybie automatycznym referencje niewybranych dostawców są traktowane jako nieaktywne do czasu wybrania.
  - Starsze ścieżki dostawców `tools.web.search.*` nadal są rozwiązywane w okresie zgodności, ale kanoniczną powierzchnią SecretRef jest `plugins.entries.<plugin>.config.webSearch.*`.

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

- Te poświadczenia należą do klas tworzonych, rotowanych, przenoszących sesję lub trwałych dla OAuth, które nie pasują do zewnętrznego rozwiązywania SecretRef tylko do odczytu.

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Semantyka poświadczeń uwierzytelniających](/pl/auth-credential-semantics)
