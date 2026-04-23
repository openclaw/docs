---
read_when:
    - Le hub de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de runbook stables basées sur les symptômes avec des commandes exactes
summary: Runbook de dépannage approfondi pour la Gateway, les canaux, l’automatisation, les Node et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-04-23T07:03:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Dépannage de la Gateway

Cette page est le runbook approfondi.
Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous voulez d’abord le flux de tri rapide.

## Échelle de commandes

Exécutez-les d’abord, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus en bonne santé :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration/service.
- `openclaw channels status --probe` affiche l’état de transport live par compte et,
  lorsque pris en charge, des résultats de sonde/audit comme `works` ou `audit ok`.

## Anthropic 429 usage supplémentaire requis pour un contexte long

Utilisez ceci lorsque les journaux/erreurs incluent :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Recherchez :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation de contexte long.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

1. Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
2. Utilisez un identifiant Anthropic éligible aux requêtes de contexte long, ou basculez vers une clé API Anthropic.
3. Configurez des modèles de repli afin que les exécutions continuent lorsque les requêtes Anthropic de contexte long sont rejetées.

Voir aussi :

- [/providers/anthropic](/fr/providers/anthropic)
- [/reference/token-use](/fr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/fr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend local compatible OpenAI réussit les sondes directes mais les exécutions agent échouent

Utilisez ceci lorsque :

- `curl ... /v1/models` fonctionne
- de petits appels directs à `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent uniquement sur des tours agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Recherchez :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur les prompts plus grands
- des erreurs du backend indiquant que `messages[].content` attend une chaîne
- des crashs du backend qui n’apparaissent qu’avec de plus grands nombres de jetons de prompt ou avec les prompts complets du runtime agent

Signatures courantes :

- `messages[...].content: invalid type: sequence, expected a string` → le backend
  rejette les parties de contenu structurées de Chat Completions. Correctif : définissez
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- les petites requêtes directes réussissent, mais les exécutions agent OpenClaw échouent avec des crashs du backend/modèle
  (par exemple Gemma sur certains builds `inferrs`) → le transport OpenClaw est
  probablement déjà correct ; le backend échoue sur la forme du prompt plus large du runtime agent.
- les échecs diminuent après désactivation des outils mais ne disparaissent pas → les schémas d’outils faisaient
  partie de la pression, mais le problème restant est toujours une capacité insuffisante du modèle/serveur en amont ou un bug du backend.

Options de correction :

1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que des chaînes.
2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer
   de manière fiable la surface de schéma d’outils d’OpenClaw.
3. Réduisez la pression du prompt lorsque c’est possible : amorçage d’espace de travail plus petit, historique de session plus court, modèle local plus léger ou backend avec une meilleure prise en charge du contexte long.
4. Si les petites requêtes directes continuent de réussir alors que les tours agent OpenClaw plantent toujours dans le backend, traitez cela comme une limitation du serveur/modèle en amont et déposez-y un repro avec la forme de charge utile acceptée.

Voir aussi :

- [/gateway/local-models](/fr/gateway/local-models)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/fr/gateway/configuration-reference#openai-compatible-endpoints)

## Pas de réponses

Si les canaux sont actifs mais que rien ne répond, vérifiez le routage et la politique avant de reconnecter quoi que ce soit.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Recherchez :

- Un appairage en attente pour les expéditeurs DM.
- Le filtrage par mention de groupe (`requireMention`, `mentionPatterns`).
- Des incohérences de liste d’autorisation canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur doit être approuvé.
- `blocked` / `allowlist` → l’expéditeur/canal a été filtré par la politique.

Voir aussi :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/pairing](/fr/channels/pairing)
- [/channels/groups](/fr/channels/groups)

## Connectivité de l’interface Dashboard control ui

Lorsque l’interface Dashboard/control UI ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Recherchez :

- L’URL de sonde et l’URL du dashboard correctes.
- Une incompatibilité de mode d’authentification/jeton entre le client et la Gateway.
- Une utilisation HTTP là où une identité d’appareil est requise.

Signatures courantes :

- `device identity required` → contexte non sécurisé ou authentification appareil manquante.
- `origin not allowed` → l’`Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins`
  (ou vous vous connectez depuis une origine navigateur non-loopback sans liste d’autorisation explicite).
- `device nonce required` / `device nonce mismatch` → le client ne termine pas le flux
  d’authentification d’appareil basé sur défi (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → le client a signé la mauvaise
  charge utile (ou un horodatage périmé) pour l’échange courant.
- `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut faire une nouvelle tentative fiable avec un jeton appareil en cache.
- Cette nouvelle tentative avec jeton en cache réutilise l’ensemble de portées en cache stocké avec le jeton appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent à la place l’ensemble de portées demandé.
- En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord jeton/mot de passe partagé explicite, puis `deviceToken` explicite, puis jeton appareil stocké, puis jeton d’amorçage.
- Sur le chemin asynchrone Tailscale Serve Control UI, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes du même client peuvent donc produire `retry later` lors de la seconde tentative au lieu de deux simples incompatibilités.
- `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur → des échecs répétés depuis cette même `Origin` normalisée sont temporairement verrouillés ; une autre origine localhost utilise un compartiment séparé.
- `unauthorized` répété après cette nouvelle tentative → dérive du jeton partagé/jeton appareil ; actualisez la configuration du jeton et réapprouvez/faites pivoter le jeton appareil si nécessaire.
- `gateway connect failed:` → mauvaise cible d’hôte/port/url.

### Cartographie rapide des codes de détail d’authentification

Utilisez `error.details.code` depuis la réponse `connect` échouée pour choisir l’action suivante :

| Code de détail              | Signification                                                                                                                                                                               | Action recommandée                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Le client n’a pas envoyé de jeton partagé requis.                                                                                                                                            | Collez/définissez le jeton dans le client et réessayez. Pour les chemins dashboard : `openclaw config get gateway.auth.token` puis collez-le dans les paramètres de Control UI.                                                                                                        |
| `AUTH_TOKEN_MISMATCH`       | Le jeton partagé ne correspond pas au jeton d’authentification de la Gateway.                                                                                                               | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative fiable. Les nouvelles tentatives avec jeton en cache réutilisent les portées approuvées stockées ; les appelants avec `deviceToken` / `scopes` explicites conservent les portées demandées. Si cela échoue toujours, exécutez la [liste de vérification de récupération de dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil en cache est obsolète ou révoqué.                                                                                                                                     | Faites pivoter/réapprouvez le jeton appareil à l’aide de la [CLI devices](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                         |
| `PAIRING_REQUIRED`          | L’identité de l’appareil a besoin d’une approbation. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`. Les mises à niveau de portée/rôle utilisent le même flux après examen de l’accès demandé.                                                                                         |

Vérification de migration de l’authentification appareil v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux montrent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez qu’il :

1. attend `connect.challenge`
2. signe la charge utile liée au défi
3. envoie `connect.params.device.nonce` avec le même nonce du défi

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions de jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil, à moins que
  l’appelant n’ait aussi `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des portées opérateur que
  la session appelante possède déjà

Voir aussi :

- [/web/control-ui](/fr/web/control-ui)
- [/gateway/configuration](/fr/gateway/configuration) (modes d’authentification de la Gateway)
- [/gateway/trusted-proxy-auth](/fr/gateway/trusted-proxy-auth)
- [/gateway/remote](/fr/gateway/remote)
- [/cli/devices](/fr/cli/devices)

## Service Gateway non démarré

Utilisez ceci lorsque le service est installé mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Recherchez :

- `Runtime: stopped` avec des indices de sortie.
- Une incompatibilité de configuration de service (`Config (cli)` vs `Config (service)`).
- Des conflits de port/écoute.
- Des installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Des indices de nettoyage `Other gateway-like services detected (best effort)`.

Signatures courantes :

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration attendue en mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification Gateway valide (jeton/mot de passe, ou proxy de confiance lorsqu’il est configuré).
- `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
- `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations devraient conserver une seule Gateway par machine ; si vous en avez réellement besoin de plusieurs, isolez les ports + config/état/espace de travail. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

Voir aussi :

- [/gateway/background-process](/fr/gateway/background-process)
- [/gateway/configuration](/fr/gateway/configuration)
- [/gateway/doctor](/fr/gateway/doctor)

## La Gateway a restauré la configuration last-known-good

Utilisez ceci lorsque la Gateway démarre, mais que les journaux indiquent qu’elle a restauré `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Recherchez :

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un fichier horodaté `openclaw.json.clobbered.*` à côté de la configuration active
- Un événement système de l’agent principal qui commence par `Config recovery warning`

Ce qui s’est passé :

- La configuration rejetée n’a pas passé la validation au démarrage ou lors du rechargement à chaud.
- OpenClaw a conservé la charge utile rejetée sous forme de `.clobbered.*`.
- La configuration active a été restaurée à partir de la dernière copie validée last-known-good.
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
- `.rejected.*` existe → une écriture de configuration détenue par OpenClaw a échoué aux vérifications de schéma ou d’écrasement avant validation.
- `Config write rejected:` → l’écriture a tenté de supprimer une structure requise, de réduire fortement la taille du fichier ou de conserver une configuration invalide.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → au démarrage, le fichier courant a été traité comme écrasé car il avait perdu des champs ou de la taille par rapport à la sauvegarde last-known-good.
- `Config last-known-good promotion skipped` → le candidat contenait des espaces réservés secrets masqués tels que `***`.

Options de correction :

1. Conservez la configuration active restaurée si elle est correcte.
2. Copiez uniquement les clés voulues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
3. Exécutez `openclaw config validate` avant de redémarrer.
4. Si vous modifiez à la main, conservez la configuration JSON5 complète, pas seulement l’objet partiel que vous vouliez changer.

Voir aussi :

- [/gateway/configuration#strict-validation](/fr/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/fr/gateway/configuration#config-hot-reload)
- [/cli/config](/fr/cli/config)
- [/gateway/doctor](/fr/gateway/doctor)

## Avertissements de sonde Gateway

Utilisez ceci lorsque `openclaw gateway probe` atteint bien une cible, mais affiche quand même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Recherchez :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs Gateways, des portées manquantes ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé les cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. Cela signifie généralement une configuration multi-Gateway intentionnelle ou des écouteurs obsolètes/en double.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a fonctionné, mais le RPC de détail est limité par les portées ; appairez l’identité de l’appareil ou utilisez des identifiants avec `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → la Gateway a répondu, mais ce client a encore besoin d’un appairage/approbation avant un accès opérateur normal.
- texte d’avertissement SecretRef non résolu `gateway.auth.*` / `gateway.remote.*` → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Voir aussi :

- [/cli/gateway](/fr/cli/gateway)
- [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/fr/gateway/remote)

## Canal connecté mais messages non transmis

Si l’état du canal est connecté mais que le flux de messages est interrompu, concentrez-vous sur la politique, les autorisations et les règles de livraison spécifiques au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Recherchez :

- Politique DM (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation de groupe et exigences de mention.
- Permissions/portées d’API du canal manquantes.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- traces `pairing` / approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/autorisations du canal.

Voir aussi :

- [/channels/troubleshooting](/fr/channels/troubleshooting)
- [/channels/whatsapp](/fr/channels/whatsapp)
- [/channels/telegram](/fr/channels/telegram)
- [/channels/discord](/fr/channels/discord)

## Livraison Cron et Heartbeat

Si Cron ou Heartbeat ne s’est pas exécuté ou n’a pas livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Recherchez :

- Cron activé et prochaine activation présente.
- État de l’historique d’exécution de la tâche (`ok`, `skipped`, `error`).
- Raisons de saut de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signatures courantes :

- `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
- `cron: timer tick failed` → l’impulsion du planificateur a échoué ; vérifiez les erreurs de fichier/journal/runtime.
- `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la fenêtre d’heures actives.
- `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes markdown, donc OpenClaw saute l’appel du modèle.
- `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due à cette impulsion.
- `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de livraison Heartbeat.
- `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat s’est résolue vers une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou le remplacement par agent) est défini sur `block`.

Voir aussi :

- [/automation/cron-jobs#troubleshooting](/fr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/fr/automation/cron-jobs)
- [/gateway/heartbeat](/fr/gateway/heartbeat)

## Échec d’outil Node appairé

Si un Node est appairé mais que les outils échouent, isolez l’état premier plan, permission et approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Recherchez :

- Node en ligne avec les capacités attendues.
- Autorisations OS pour caméra/micro/localisation/écran.
- Approbations Exec et état de liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation OS manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation Exec en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Voir aussi :

- [/nodes/troubleshooting](/fr/nodes/troubleshooting)
- [/nodes/index](/fr/nodes/index)
- [/tools/exec-approvals](/fr/tools/exec-approvals)

## Échec de l’outil navigateur

Utilisez ceci lorsque les actions de l’outil navigateur échouent même si la Gateway elle-même est saine.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Recherchez :

- Si `plugins.allow` est défini et inclut `browser`.
- Un chemin d’exécutable de navigateur valide.
- La joignabilité du profil CDP.
- La disponibilité de Chrome local pour les profils `existing-session` / `user`.

Signatures courantes :

- `unknown command "browser"` ou `unknown command 'browser'` → le plugin navigateur inclus est exclu par `plugins.allow`.
- outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le plugin ne s’est jamais chargé.
- `Failed to start Chrome CDP on port` → le processus navigateur n’a pas pu être lancé.
- `browser.executablePath not found` → le chemin configuré est invalide.
- `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge tel que `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port incorrect ou hors plage.
- `Could not find DevToolsActivePort for chrome` → la session existante Chrome MCP n’a pas encore pu s’attacher au répertoire de données navigateur sélectionné. Ouvrez la page d’inspection du navigateur, activez le débogage distant, gardez le navigateur ouvert, approuvez la première invite d’attachement, puis réessayez. Si l’état de connexion n’est pas requis, préférez le profil géré `openclaw`.
- `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
- `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas joignable depuis l’hôte Gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a pas de cible joignable, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle de la Gateway n’a pas la dépendance runtime `playwright-core` du plugin navigateur inclus ; exécutez `openclaw doctor --fix`, puis redémarrez la Gateway. Les instantanés ARIA et les captures d’écran de page de base peuvent toujours fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’export PDF restent indisponibles.
- `fullPage is not supported for element screenshots` → la requête de capture d’écran mélange `--full-page` avec `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou un `--ref` d’instantané, pas un CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des refs d’instantané, pas des sélecteurs CSS.
- `existing-session file uploads currently support one file at a time.` → envoyez un seul téléversement par appel sur les profils Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → les hooks de boîte de dialogue sur les profils Chrome MCP ne prennent pas en charge les remplacements de délai.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un navigateur géré ou un profil CDP brut.
- remplacements obsolètes de viewport / mode sombre / langue / hors ligne sur les profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer toute la Gateway.

Voir aussi :

- [/tools/browser-linux-troubleshooting](/fr/tools/browser-linux-troubleshooting)
- [/tools/browser](/fr/tools/browser)

## Si vous avez mis à niveau et que quelque chose s’est soudainement cassé

La plupart des pannes après mise à niveau proviennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

### 1) Le comportement d’authentification et de remplacement d’URL a changé

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Ce qu’il faut vérifier :

- Si `gateway.mode=remote`, les appels CLI peuvent viser le distant alors que votre service local fonctionne bien.
- Les appels explicites `--url` ne reviennent pas aux identifiants stockés.

Signatures courantes :

- `gateway connect failed:` → mauvaise cible d’URL.
- `unauthorized` → point de terminaison joignable mais mauvaise authentification.

### 2) Les garde-fous de liaison et d’authentification sont plus stricts

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Ce qu’il faut vérifier :

- Les liaisons non-loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification Gateway valide : authentification par jeton partagé/mot de passe, ou déploiement `trusted-proxy` non-loopback correctement configuré.
- Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

Signatures courantes :

- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification Gateway valide.
- `Connectivity probe: failed` alors que le runtime est en cours d’exécution → Gateway active mais inaccessible avec l’authentification/l’URL actuelles.

### 3) L’état d’appairage et d’identité d’appareil a changé

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Ce qu’il faut vérifier :

- Approbations d’appareil en attente pour dashboard/nodes.
- Approbations d’appairage DM en attente après des changements de politique ou d’identité.

Signatures courantes :

- `device identity required` → authentification appareil non satisfaite.
- `pairing required` → l’expéditeur/l’appareil doit être approuvé.

Si la configuration du service et le runtime ne concordent toujours pas après les vérifications, réinstallez les métadonnées du service depuis le même répertoire profil/état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Voir aussi :

- [/gateway/pairing](/fr/gateway/pairing)
- [/gateway/authentication](/fr/gateway/authentication)
- [/gateway/background-process](/fr/gateway/background-process)
