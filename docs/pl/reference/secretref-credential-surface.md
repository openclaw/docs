---
read_when:
    - Weryfikowanie obsługi poświadczeń SecretRef
    - Sprawdzanie, czy dane uwierzytelniające kwalifikują się do `secrets configure` lub `secrets apply`
    - Weryfikowanie, dlaczego poświadczenie znajduje się poza obsługiwanym zakresem
summary: Kanoniczny zakres obsługiwanych i nieobsługiwanych poświadczeń SecretRef
title: Powierzchnia poświadczeń SecretRef
x-i18n:
    generated_at: "2026-07-12T15:36:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Ta strona definiuje kanoniczny zakres poświadczeń SecretRef: które pola poświadczeń akceptują `SecretRef` (odwołanie oparte na env/pliku/exec) zamiast nieprzetworzonej wartości tajnej.

Zakres:

- W zakresie: wyłącznie poświadczenia dostarczane przez użytkownika, których OpenClaw nie generuje ani nie rotuje.
- Poza zakresem: poświadczenia generowane lub rotowane w czasie działania, dane odświeżania OAuth oraz artefakty podobne do sesji.

Poniższe listy są generowane z rejestru docelowego w kodzie źródłowym i sprawdzane w CI względem `docs/reference/secretref-user-supplied-credentials-matrix.json`; nie edytuj wpisów ręcznie.

## Obsługiwane poświadczenia

### Cele w `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.googlechat.serviceAccount` za pośrednictwem sąsiedniego pola `serviceAccountRef` (wyjątek zgodności)
- `channels.googlechat.accounts.*.serviceAccount` za pośrednictwem sąsiedniego pola `serviceAccountRef` (wyjątek zgodności)

### Cele w `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; nieobsługiwane, gdy `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Uwagi:

- Cele planu profilu uwierzytelniania wymagają `agentId`; wpisy planu wskazują `profiles.*.key` / `profiles.*.token` i zapisują sąsiednie odwołania (`keyRef` / `tokenRef`). Odwołania profili uwierzytelniania są uwzględniane podczas rozwiązywania w czasie działania oraz w zakresie audytu.
- W `openclaw.json` odwołania SecretRef muszą używać obiektów strukturalnych, takich jak `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Starsze ciągi znaczników `secretref-env:<ENV_VAR>` są odrzucane w ścieżkach poświadczeń SecretRef; uruchom `openclaw doctor --fix`, aby zmigrować prawidłowe znaczniki.
- Ograniczenie zasad OAuth: `auth.profiles.<id>.mode = "oauth"` nie może być łączone z danymi wejściowymi SecretRef dla tego profilu. Uruchamianie, ponowne wczytywanie oraz rozwiązywanie profilu uwierzytelniania natychmiast kończą się niepowodzeniem w przypadku naruszenia tej zasady.
- W przypadku dostawców modeli zarządzanych przez SecretRef wygenerowane wpisy `agents/*/agent/models.json` przechowują nietajne znaczniki (a nie rozwiązane wartości tajne) dla pól `apiKey`/nagłówków. Utrwalanie znaczników opiera się autorytatywnie na źródle: OpenClaw zapisuje znaczniki z aktywnej migawki konfiguracji źródłowej (sprzed rozwiązania), a nie z rozwiązanych wartości tajnych używanych w czasie działania.
- W przypadku wyszukiwania internetowego: w trybie jawnego dostawcy (gdy ustawiono `tools.web.search.provider`) aktywny jest tylko klucz wybranego dostawcy. W trybie automatycznym (gdy `tools.web.search.provider` nie jest ustawione) aktywny jest tylko pierwszy klucz dostawcy rozwiązany zgodnie z kolejnością pierwszeństwa, a odwołania do niewybranych dostawców są traktowane jako nieaktywne do momentu ich wybrania. Starsze ścieżki dostawców `tools.web.search.*` są nadal rozwiązywane w okresie zgodności, ale kanonicznym zakresem SecretRef jest `plugins.entries.<plugin>.config.webSearch.*`.

## Nieobsługiwane poświadczenia

Te poświadczenia należą do klas generowanych, rotowanych, zawierających dane sesji lub trwale związanych z OAuth, które nie pasują do zewnętrznego rozwiązywania SecretRef tylko do odczytu:

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

## Powiązane

- [Zarządzanie sekretami](/pl/gateway/secrets)
- [Semantyka poświadczeń uwierzytelniających](/pl/auth-credential-semantics)
