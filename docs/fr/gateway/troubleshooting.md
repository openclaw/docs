---
read_when:
    - Le hub de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de runbook stables basées sur les symptômes avec des commandes exactes
summary: Guide de dépannage approfondi pour Gateway, les canaux, l’automatisation, les nœuds et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-04-21T13:35:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Dépannage de Gateway

Cette page est le runbook approfondi.
Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous souhaitez d’abord suivre le flux de triage rapide.

## Échelle de commandes

Exécutez-les d’abord, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus en état sain :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration/service.
- `openclaw channels status --probe` affiche l’état de transport en direct par compte et,
  lorsque c’est pris en charge, des résultats de sonde/audit tels que `works` ou `audit ok`.

## Utilisation supplémentaire Anthropic 429 requise pour un contexte long

Utilisez cette section lorsque les journaux/erreurs incluent :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

À vérifier :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation de contexte long.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

1. Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
2. Utilisez un identifiant Anthropic éligible aux requêtes de contexte long, ou basculez vers une clé API Anthropic.
3. Configurez des modèles de secours afin que les exécutions continuent lorsque les requêtes Anthropic à contexte long sont rejetées.

Voir aussi :

- [/providers/anthropic](/fr/providers/anthropic)
- [/reference/token-use](/fr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/fr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Le backend local compatible OpenAI réussit les sondes directes mais les exécutions d’agent échouent

Utilisez cette section lorsque :

- `curl ... /v1/models` fonctionne
- les petits appels directs à `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent uniquement pendant les tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

À vérifier :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur des prompts plus volumineux
- des erreurs du backend indiquant que `messages[].content` attend une chaîne
- des plantages du backend qui apparaissent uniquement avec un plus grand nombre de tokens de prompt ou avec les prompts complets du runtime d’agent

Signatures courantes :

- `messages[...].content: invalid type: sequence, expected a string` → le backend rejette les parties de contenu structurées de Chat Completions. Correctif : définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages du backend/modèle (par exemple Gemma sur certaines versions de `inferrs`) → le transport OpenClaw est probablement déjà correct ; c’est le backend qui échoue sur la forme de prompt plus volumineuse du runtime d’agent.
- les échecs diminuent après désactivation des outils mais ne disparaissent pas → les schémas d’outils faisaient partie de la pression, mais le problème restant provient toujours d’une limite du modèle/serveur en amont ou d’un bug du backend.

Options de correction :

1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que des chaînes.
2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer de manière fiable la surface de schéma d’outils d’OpenClaw.
3. Réduisez la pression sur le prompt quand c’est possible : initialisation d’espace de travail plus petite, historique de session plus court, modèle local plus léger ou backend avec une meilleure prise en charge du contexte long.
4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours dans le backend, considérez cela comme une limitation du serveur/modèle en amont et ouvrez un rapport de reproduction là-bas avec la forme de payload acceptée.

Voir aussi :

- [/gateway/local-models](/fr/gateway/local-models)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/fr/gateway/configuration-reference#openai-compatible-endpoints)

## Pas de réponses

Si les canaux sont actifs mais que rien ne répond, vérifiez le routage et la stratégie avant de reconnecter quoi que ce soit.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

À vérifier :

- Appairage en attente pour les expéditeurs de messages privés.
- Filtrage des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incohérences de liste d’autorisation de canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → le message de groupe est ignoré jusqu’à une mention.
- `pairing request` → l’expéditeur a besoin d’une approbation.
- `blocked` / `allowlist` → l’expéditeur/canal a été filtré par la stratégie.

Voir aussi :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/pairing](/fr/channels/pairing)
- [/channels/groups](/fr/channels/groups)

## Connectivité de l’interface Dashboard/Control UI

Lorsque Dashboard/Control UI ne parvient pas à se connecter, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

À vérifier :

- URL de sonde et URL Dashboard correctes.
- Incompatibilité de mode d’authentification/token entre le client et Gateway.
- Utilisation de HTTP lorsqu’une identité d’appareil est requise.

Signatures courantes :

- `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
- `origin not allowed` → l’`Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins`
  (ou vous vous connectez depuis une origine de navigateur non loopback sans liste d’autorisation explicite).
- `device nonce required` / `device nonce mismatch` → le client ne termine pas le flux d’authentification d’appareil basé sur challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → le client a signé la mauvaise charge utile (ou avec un horodatage obsolète) pour la négociation actuelle.
- `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une nouvelle tentative approuvée avec le token d’appareil en cache.
- Cette nouvelle tentative avec token en cache réutilise l’ensemble d’étendues en cache stocké avec le token d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent plutôt l’ensemble d’étendues demandé.
- En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord le token/mot de passe partagé explicite, puis `deviceToken` explicite, puis le token d’appareil stocké, puis le token d’amorçage.
- Sur le chemin asynchrone Tailscale Serve Control UI, les tentatives échouées pour le même `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes du même client peuvent donc produire `retry later` sur la seconde tentative au lieu de deux incompatibilités simples.
- `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur → les échecs répétés depuis cette même `Origin` normalisée sont temporairement bloqués ; une autre origine localhost utilise un compartiment distinct.
- `unauthorized` répété après cette nouvelle tentative → dérive du token partagé/token d’appareil ; actualisez la configuration du token et réapprouvez/faites tourner le token d’appareil si nécessaire.
- `gateway connect failed:` → cible d’hôte/port/url incorrecte.

### Correspondance rapide des codes de détail d’authentification

Utilisez `error.details.code` dans la réponse `connect` en échec pour choisir l’action suivante :

| Code de détail               | Signification                                                                                                                                                                                | Action recommandée                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé un token partagé requis.                                                                                                                                           | Collez/définissez le token dans le client puis réessayez. Pour les chemins Dashboard : `openclaw config get gateway.auth.token` puis collez-le dans les paramètres de Control UI.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | Le token partagé ne correspondait pas au token d’authentification Gateway.                                                                                                                  | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative approuvée. Les nouvelles tentatives avec token en cache réutilisent les étendues approuvées stockées ; les appelants avec `deviceToken` / `scopes` explicites conservent les étendues demandées. Si cela échoue encore, exécutez la [checklist de récupération de dérive de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le token par appareil en cache est obsolète ou révoqué.                                                                                                                                     | Faites tourner/réapprouvez le token d’appareil à l’aide de la [CLI devices](/cli/devices), puis reconnectez-vous.                                                                                                                                                                      |
| `PAIRING_REQUIRED`           | L’identité de l’appareil nécessite une approbation. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsque présents. | Approuvez la demande en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`. Les mises à niveau d’étendue/rôle utilisent le même flux après examen de l’accès demandé.                                                                                       |

Vérification de migration vers l’authentification d’appareil v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez qu’il :

1. attend `connect.challenge`
2. signe la charge utile liée au challenge
3. envoie `connect.params.device.nonce` avec le même nonce de challenge

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions avec token d’appareil appairé peuvent gérer uniquement **leur propre** appareil, sauf si l’appelant possède aussi `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des étendues opérateur que la session appelante détient déjà

Voir aussi :

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/fr/gateway/configuration) (modes d’authentification Gateway)
- [/gateway/trusted-proxy-auth](/fr/gateway/trusted-proxy-auth)
- [/gateway/remote](/fr/gateway/remote)
- [/cli/devices](/cli/devices)

## Le service Gateway ne fonctionne pas

Utilisez cette section lorsque le service est installé mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analyse aussi les services au niveau système
```

À vérifier :

- `Runtime: stopped` avec des indices de sortie.
- Incompatibilité de configuration de service (`Config (cli)` vs `Config (service)`).
- Conflits de port/écoute.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indices de nettoyage `Other gateway-like services detected (best effort)`.

Signatures courantes :

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration attendue en mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → liaison hors loopback sans chemin d’authentification Gateway valide (token/mot de passe, ou trusted-proxy lorsque configuré).
- `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
- `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations doivent conserver une seule Gateway par machine ; si vous en avez réellement besoin de plusieurs, isolez les ports + la configuration/l’état/l’espace de travail. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

Voir aussi :

- [/gateway/background-process](/fr/gateway/background-process)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/doctor](/fr/gateway/doctor)

## Gateway a restauré la configuration au dernier état valide connu

Utilisez cette section lorsque Gateway démarre, mais que les journaux indiquent qu’il a restauré `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

À vérifier :

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un fichier horodaté `openclaw.json.clobbered.*` à côté de la configuration active
- Un événement système de l’agent principal qui commence par `Config recovery warning`

Ce qui s’est passé :

- La configuration rejetée n’a pas passé la validation au démarrage ou lors du rechargement à chaud.
- OpenClaw a conservé la charge utile rejetée comme `.clobbered.*`.
- La configuration active a été restaurée depuis la dernière copie valide connue validée.
- Le prochain tour de l’agent principal est averti de ne pas réécrire aveuglément la configuration rejetée.

Inspecter et réparer :

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Signatures courantes :

- `.clobbered.*` existe → une modification directe externe ou une lecture au démarrage a été restaurée.
- `.rejected.*` existe → une écriture de configuration gérée par OpenClaw a échoué aux vérifications de schéma ou d’écrasement avant validation.
- `Config write rejected:` → l’écriture a tenté de supprimer une structure requise, de réduire fortement la taille du fichier ou de persister une configuration invalide.
- `Config last-known-good promotion skipped` → le candidat contenait des espaces réservés de secret masqués tels que `***`.

Options de correction :

1. Conservez la configuration active restaurée si elle est correcte.
2. Copiez uniquement les clés voulues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
3. Exécutez `openclaw config validate` avant de redémarrer.
4. Si vous modifiez à la main, conservez la configuration JSON5 complète, pas seulement l’objet partiel que vous vouliez changer.

Voir aussi :

- [/gateway/configuration#strict-validation](/fr/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/fr/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/fr/gateway/doctor)

## Avertissements de sonde Gateway

Utilisez cette section lorsque `openclaw gateway probe` atteint bien une cible, mais affiche quand même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

À vérifier :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne un repli SSH, plusieurs Gateways, des étendues manquantes ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé les cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. En général, cela signifie une configuration multi-Gateway intentionnelle ou des écouteurs obsolètes/dupliqués.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a fonctionné, mais le RPC de détail est limité par les étendues ; appairez l’identité de l’appareil ou utilisez des identifiants avec `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → la Gateway a répondu, mais ce client a encore besoin d’un appairage/une approbation avant l’accès opérateur normal.
- texte d’avertissement SecretRef non résolu pour `gateway.auth.*` / `gateway.remote.*` → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Voir aussi :

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/fr/gateway/remote)

## Le canal est connecté mais les messages ne circulent pas

Si l’état du canal est connecté mais que le flux de messages est inactif, concentrez-vous sur la stratégie, les permissions et les règles de remise propres au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

À vérifier :

- Stratégie DM (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation de groupe et exigences de mention.
- Permissions/étendues API du canal manquantes.

Signatures courantes :

- `mention required` → message ignoré par la stratégie de mention de groupe.
- traces `pairing` / d’approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/permissions du canal.

Voir aussi :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/whatsapp](/fr/channels/whatsapp)
- [/channels/telegram](/fr/channels/telegram)
- [/channels/discord](/fr/channels/discord)

## Remise Cron et Heartbeat

Si Cron ou Heartbeat ne s’est pas exécuté ou n’a pas été remis, vérifiez d’abord l’état du planificateur, puis la cible de remise.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

À vérifier :

- Cron activé et prochaine activation présente.
- État de l’historique d’exécution de la tâche (`ok`, `skipped`, `error`).
- Raisons d’omission de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signatures courantes :

- `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
- `cron: timer tick failed` → échec du tick du planificateur ; vérifiez les erreurs de fichier/journal/runtime.
- `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la fenêtre d’heures actives.
- `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / des en-têtes Markdown, donc OpenClaw ignore l’appel au modèle.
- `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due à ce tick.
- `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de remise Heartbeat.
- `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat a été résolue vers une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou la surcharge par agent) est défini sur `block`.

Voir aussi :

- [/automation/cron-jobs#troubleshooting](/fr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/fr/automation/cron-jobs)
- [/gateway/heartbeat](/fr/gateway/heartbeat)

## L’outil d’un Node appairé échoue

Si un Node est appairé mais que les outils échouent, isolez l’état de premier plan, les permissions et l’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

À vérifier :

- Node en ligne avec les capacités attendues.
- Permissions OS accordées pour caméra/micro/localisation/écran.
- État des approbations d’exécution et de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permission OS manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation d’exécution en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Voir aussi :

- [/nodes/troubleshooting](/fr/nodes/troubleshooting)
- [/nodes/index](/fr/nodes/index)
- [/tools/exec-approvals](/fr/tools/exec-approvals)

## L’outil navigateur échoue

Utilisez cette section lorsque les actions de l’outil navigateur échouent même si Gateway lui-même est sain.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

À vérifier :

- Si `plugins.allow` est défini et inclut `browser`.
- Chemin d’exécutable du navigateur valide.
- Accessibilité du profil CDP.
- Disponibilité de Chrome local pour les profils `existing-session` / `user`.

Signatures courantes :

- `unknown command "browser"` ou `unknown command 'browser'` → le Plugin navigateur intégré est exclu par `plugins.allow`.
- outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le Plugin ne s’est jamais chargé.
- `Failed to start Chrome CDP on port` → le processus du navigateur n’a pas pu démarrer.
- `browser.executablePath not found` → le chemin configuré est invalide.
- `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge tel que `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port incorrect ou hors plage.
- `Could not find DevToolsActivePort for chrome` → la session existante Chrome MCP n’a pas encore pu se rattacher au répertoire de données du navigateur sélectionné. Ouvrez la page d’inspection du navigateur, activez le débogage à distance, laissez le navigateur ouvert, approuvez la première invite de rattachement, puis réessayez. Si l’état connecté n’est pas requis, préférez le profil géré `openclaw`.
- `No Chrome tabs found for profile="user"` → le profil de rattachement Chrome MCP n’a aucun onglet Chrome local ouvert.
- `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte Gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil en rattachement seul n’a pas de cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation Gateway actuelle ne contient pas le paquet Playwright complet ; les instantanés ARIA et les captures d’écran de page de base peuvent encore fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’élément par sélecteur CSS et l’export PDF restent indisponibles.
- `fullPage is not supported for element screenshots` → la requête de capture d’écran mélange `--full-page` avec `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser la capture de page ou un `--ref` d’instantané, pas un `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks d’envoi de fichier Chrome MCP nécessitent des références d’instantané, pas des sélecteurs CSS.
- `existing-session file uploads currently support one file at a time.` → envoyez un seul téléversement par appel sur les profils Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → les hooks de boîte de dialogue sur les profils Chrome MCP ne prennent pas en charge les surcharges de délai.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un navigateur géré ou un profil CDP brut.
- remplacements obsolètes de viewport / mode sombre / locale / hors ligne sur des profils en rattachement seul ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer toute la Gateway.

Voir aussi :

- [/tools/browser-linux-troubleshooting](/fr/tools/browser-linux-troubleshooting)
- [/tools/browser](/fr/tools/browser)

## Si vous avez mis à niveau et que quelque chose s’est soudainement cassé

La plupart des pannes après mise à niveau sont dues à une dérive de configuration ou à des valeurs par défaut plus strictes désormais appliquées.

### 1) Le comportement d’authentification et de surcharge d’URL a changé

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

À vérifier :

- Si `gateway.mode=remote`, les appels CLI peuvent cibler le remote alors que votre service local fonctionne très bien.
- Les appels explicites avec `--url` ne retombent pas sur les identifiants stockés.

Signatures courantes :

- `gateway connect failed:` → mauvaise URL cible.
- `unauthorized` → point de terminaison accessible mais mauvaise authentification.

### 2) Les garde-fous de liaison et d’authentification sont plus stricts

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

À vérifier :

- Les liaisons hors loopback (`lan`, `tailnet`, `custom`) ont besoin d’un chemin d’authentification Gateway valide : authentification par token/mot de passe partagé, ou déploiement `trusted-proxy` hors loopback correctement configuré.
- Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

Signatures courantes :

- `refusing to bind gateway ... without auth` → liaison hors loopback sans chemin d’authentification Gateway valide.
- `Connectivity probe: failed` alors que le runtime fonctionne → Gateway est actif mais inaccessible avec l’authentification/l’URL actuelles.

### 3) L’état d’appairage et d’identité d’appareil a changé

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

À vérifier :

- Approbations d’appareil en attente pour Dashboard/nodes.
- Approbations d’appairage DM en attente après des changements de stratégie ou d’identité.

Signatures courantes :

- `device identity required` → l’authentification d’appareil n’est pas satisfaite.
- `pairing required` → l’expéditeur/l’appareil doit être approuvé.

Si la configuration du service et le runtime ne concordent toujours pas après ces vérifications, réinstallez les métadonnées du service depuis le même répertoire de profil/d’état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Voir aussi :

- [/gateway/pairing](/fr/gateway/pairing)
- [/gateway/authentication](/fr/gateway/authentication)
- [/gateway/background-process](/fr/gateway/background-process)
