---
read_when:
    - Vérification de la couverture des identifiants SecretRef
    - Vérifier si un identifiant est éligible à `secrets configure` ou `secrets apply`
    - Vérification de la raison pour laquelle un identifiant se trouve en dehors de la surface prise en charge
summary: Surface canonique des identifiants SecretRef pris en charge et non pris en charge
title: Surface d’identifiants SecretRef
x-i18n:
    generated_at: "2026-04-30T07:47:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04902427e9851cc36c1dfd07ed44b46b55450c251075e9955af6696f08bc334
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

Cette page définit la surface canonique des identifiants SecretRef.

Objectif du périmètre :

- Inclus dans le périmètre : les identifiants strictement fournis par l’utilisateur qu’OpenClaw n’émet ni ne renouvelle.
- Hors périmètre : les identifiants émis ou renouvelés à l’exécution, les éléments de rafraîchissement OAuth et les artefacts assimilables à une session.

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
- `channels.googlechat.serviceAccount` via le champ frère `serviceAccountRef` (exception de compatibilité)
- `channels.googlechat.accounts.*.serviceAccount` via le champ frère `serviceAccountRef` (exception de compatibilité)

### Cibles `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"` ; non pris en charge lorsque `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"` ; non pris en charge lorsque `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Remarques :

- Les cibles de plan de profil d’authentification nécessitent `agentId`.
- Les entrées de plan ciblent `profiles.*.key` / `profiles.*.token` et écrivent les refs frères (`keyRef` / `tokenRef`).
- Les refs de profil d’authentification sont incluses dans la résolution à l’exécution et dans la couverture d’audit.
- Dans `openclaw.json`, les SecretRefs doivent utiliser des objets structurés tels que `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Les chaînes de marqueur héritées `secretref-env:<ENV_VAR>` sont rejetées sur les chemins d’identifiants SecretRef ; exécutez `openclaw doctor --fix` pour migrer les marqueurs valides.
- Garde de politique OAuth : `auth.profiles.<id>.mode = "oauth"` ne peut pas être combiné avec des entrées SecretRef pour ce profil. Le démarrage/rechargement et la résolution du profil d’authentification échouent rapidement lorsque cette politique est enfreinte.
- Pour les fournisseurs de modèles gérés par SecretRef, les entrées `agents/*/agent/models.json` générées conservent des marqueurs non secrets (et non les valeurs secrètes résolues) pour les surfaces `apiKey`/d’en-têtes.
- La persistance des marqueurs est fondée sur la source faisant autorité : OpenClaw écrit les marqueurs depuis l’instantané actif de la configuration source (avant résolution), et non depuis les valeurs secrètes résolues à l’exécution.
- Pour la recherche web :
  - En mode fournisseur explicite (`tools.web.search.provider` défini), seule la clé du fournisseur sélectionné est active.
  - En mode automatique (`tools.web.search.provider` non défini), seule la première clé de fournisseur résolue par ordre de précédence est active.
  - En mode automatique, les refs des fournisseurs non sélectionnés sont considérées comme inactives jusqu’à leur sélection.
  - Les chemins de fournisseurs hérités `tools.web.search.*` sont encore résolus pendant la fenêtre de compatibilité, mais la surface SecretRef canonique est `plugins.entries.<plugin>.config.webSearch.*`.

## Identifiants non pris en charge

Les identifiants hors périmètre incluent :

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

Justification :

- Ces identifiants appartiennent à des classes émises, renouvelées, porteuses de session ou durables OAuth qui ne correspondent pas à une résolution SecretRef externe en lecture seule.

## Associé

- [Gestion des secrets](/fr/gateway/secrets)
- [Sémantique des identifiants d’authentification](/fr/auth-credential-semantics)
