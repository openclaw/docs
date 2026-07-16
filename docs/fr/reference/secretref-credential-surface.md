---
read_when:
    - Vérification de la couverture des identifiants SecretRef
    - Vérification de l’éligibilité d’un identifiant à `secrets configure` ou `secrets apply`
    - Vérification de la raison pour laquelle un identifiant se trouve en dehors du périmètre pris en charge
summary: Surface canonique prise en charge ou non pour les identifiants SecretRef
title: Surface d’identifiants SecretRef
x-i18n:
    generated_at: "2026-07-16T13:48:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c7d8d5baf082f5524b93608584600856e48f9076df915c4db301a4ecd814c9
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Cette page définit la surface d’identifiants SecretRef canonique : les champs d’identifiants qui acceptent une `SecretRef` (référence basée sur env/file/exec) au lieu d’une valeur secrète brute.

Périmètre :

- Dans le périmètre : uniquement les identifiants fournis par l’utilisateur qu’OpenClaw ne génère ni ne renouvelle.
- Hors périmètre : les identifiants générés ou renouvelés à l’exécution, les données d’actualisation OAuth et les artefacts assimilables à des sessions.

Les listes ci-dessous sont générées à partir du registre des cibles source et vérifiées par rapport à `docs/reference/secretref-user-supplied-credentials-matrix.json` dans la CI ; ne modifiez pas les entrées manuellement.

## Identifiants pris en charge

### Cibles `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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
- `channels.clickclack.token`
- `channels.clickclack.accounts.*.token`
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
- `channels.googlechat.serviceAccount` via l’élément frère `serviceAccountRef` (exception de compatibilité)
- `channels.googlechat.accounts.*.serviceAccount` via l’élément frère `serviceAccountRef` (exception de compatibilité)

### Cibles `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"` ; non pris en charge lorsque `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"` ; non pris en charge lorsque `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Remarques :

- Les cibles de plan de profil d’authentification nécessitent `agentId` ; les entrées de plan ciblent `profiles.*.key` / `profiles.*.token` et écrivent les références sœurs (`keyRef` / `tokenRef`). Les références de profil d’authentification sont incluses dans la résolution à l’exécution et la couverture d’audit.
- Dans `openclaw.json`, les SecretRefs doivent utiliser des objets structurés tels que `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Les anciennes chaînes de marqueur `secretref-env:<ENV_VAR>` sont rejetées sur les chemins d’identifiants SecretRef ; exécutez `openclaw doctor --fix` pour migrer les marqueurs valides.
- Garde de politique OAuth : `auth.profiles.<id>.mode = "oauth"` ne peut pas être combiné avec des entrées SecretRef pour ce profil. Le démarrage/rechargement et la résolution du profil d’authentification échouent immédiatement lorsque cette politique est enfreinte.
- Pour les fournisseurs de modèles gérés par SecretRef, les entrées `agents/*/agent/models.json` générées conservent des marqueurs non secrets (et non les valeurs secrètes résolues) pour les surfaces `apiKey`/d’en-têtes. La persistance des marqueurs fait autorité depuis la source : OpenClaw écrit les marqueurs à partir de l’instantané actif de la configuration source (avant résolution), et non à partir des valeurs secrètes résolues à l’exécution.
- Pour la recherche Web : en mode fournisseur explicite (`tools.web.search.provider` défini), seule la clé du fournisseur sélectionné est active. En mode automatique (`tools.web.search.provider` non défini), seule la première clé de fournisseur résolue selon l’ordre de priorité est active, et les références des fournisseurs non sélectionnés sont considérées comme inactives jusqu’à leur sélection. Les anciens chemins de fournisseur `tools.web.search.*` sont toujours résolus pendant la période de compatibilité, mais la surface SecretRef canonique est `plugins.entries.<plugin>.config.webSearch.*`.

## Identifiants non pris en charge

Ces identifiants appartiennent à des classes générées, renouvelées, porteuses de session ou durables pour OAuth, qui ne sont pas adaptées à la résolution externe SecretRef en lecture seule :

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

## Pages connexes

- [Gestion des secrets](/fr/gateway/secrets)
- [Sémantique des identifiants d’authentification](/fr/auth-credential-semantics)
