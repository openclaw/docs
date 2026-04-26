---
read_when:
    - Vérification de la couverture des identifiants SecretRef
    - Vérifier si un identifiant est éligible à `secrets configure` ou `secrets apply`
    - Vérification de la raison pour laquelle un identifiant est hors de la surface prise en charge
summary: Surface canonique prise en charge vs non prise en charge des identifiants SecretRef
title: Surface des identifiants SecretRef
x-i18n:
    generated_at: "2026-04-26T11:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ffdf545e954f8d73d18adfeb196d9092bf346bd86648f09314bad2a0f40bb6c
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

Cette page définit la surface canonique des identifiants SecretRef.

Intention du périmètre :

- Dans le périmètre : strictement les identifiants fournis par l’utilisateur que OpenClaw ne génère ni ne fait tourner.
- Hors périmètre : les identifiants générés à l’exécution ou en rotation, les éléments de rafraîchissement OAuth, et les artefacts de type session.

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
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
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
- `channels.googlechat.serviceAccount` via le sibling `serviceAccountRef` (exception de compatibilité)
- `channels.googlechat.accounts.*.serviceAccount` via le sibling `serviceAccountRef` (exception de compatibilité)

### Cibles `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"` ; non pris en charge lorsque `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"` ; non pris en charge lorsque `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

Remarques :

- Les cibles de plan auth-profile exigent `agentId`.
- Les entrées de plan ciblent `profiles.*.key` / `profiles.*.token` et écrivent les refs sœurs (`keyRef` / `tokenRef`).
- Les refs auth-profile sont incluses dans la résolution à l’exécution et dans la couverture d’audit.
- Dans `openclaw.json`, les SecretRefs doivent utiliser des objets structurés tels que `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}`. Les chaînes de marqueur héritées `secretref-env:<ENV_VAR>` sont rejetées sur les chemins d’identifiants SecretRef ; exécutez `openclaw doctor --fix` pour migrer les marqueurs valides.
- Garde-fou de politique OAuth : `auth.profiles.<id>.mode = "oauth"` ne peut pas être combiné avec des entrées SecretRef pour ce profil. Le démarrage/rechargement et la résolution auth-profile échouent immédiatement lorsque cette politique est violée.
- Pour les fournisseurs de modèles gérés par SecretRef, les entrées générées `agents/*/agent/models.json` persistent des marqueurs non secrets (et non des valeurs secrètes résolues) pour les surfaces `apiKey`/en-têtes.
- La persistance des marqueurs est source-authoritative : OpenClaw écrit les marqueurs à partir de l’instantané de configuration source actif (pré-résolution), et non à partir des valeurs secrètes résolues à l’exécution.
- Pour la recherche Web :
  - En mode fournisseur explicite (`tools.web.search.provider` défini), seule la clé du fournisseur sélectionné est active.
  - En mode automatique (`tools.web.search.provider` non défini), seule la première clé de fournisseur qui se résout selon la priorité est active.
  - En mode automatique, les refs des fournisseurs non sélectionnés sont traitées comme inactives jusqu’à leur sélection.
  - Les anciens chemins fournisseur `tools.web.search.*` continuent de se résoudre pendant la fenêtre de compatibilité, mais la surface canonique SecretRef est `plugins.entries.<plugin>.config.webSearch.*`.

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

- Ces identifiants sont générés, en rotation, porteurs de session, ou appartiennent à des classes OAuth durables qui ne conviennent pas à la résolution SecretRef externe en lecture seule.

## Lié

- [Gestion des secrets](/fr/gateway/secrets)
- [Sémantique des identifiants d’authentification](/fr/auth-credential-semantics)
