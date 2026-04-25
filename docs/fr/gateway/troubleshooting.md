---
read_when:
    - Le hub de dépannage vous a dirigé ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de runbook stables basées sur les symptômes avec des commandes exactes
summary: Runbook approfondi de dépannage pour la Gateway, les canaux, l’automatisation, les nœuds et le browser
title: Dépannage
x-i18n:
    generated_at: "2026-04-25T13:49:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Dépannage de la Gateway

Cette page est le runbook approfondi.
Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous souhaitez d’abord le flux de triage rapide.

## Échelle de commandes

Exécutez d’abord ces commandes, dans cet ordre :

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
- `openclaw channels status --probe` affiche l’état de transport en direct par compte et,
  lorsque c’est pris en charge, les résultats de sonde/audit comme `works` ou `audit ok`.

## Anthropic 429 extra usage required for long context

Utilisez cette section lorsque les journaux/erreurs incluent :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

À rechercher :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’usage long contexte.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

1. Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
2. Utilisez un identifiant Anthropic éligible aux requêtes long contexte, ou basculez vers une clé API Anthropic.
3. Configurez des modèles de repli afin que les exécutions continuent lorsque les requêtes Anthropic long contexte sont rejetées.

Liens associés :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Pourquoi est-ce que je vois HTTP 429 depuis Anthropic ?](/fr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Le backend local compatible OpenAI réussit les sondes directes mais les exécutions d’agent échouent

Utilisez cette section lorsque :

- `curl ... /v1/models` fonctionne
- les petits appels directs `/v1/chat/completions` fonctionnent
- les exécutions de modèles OpenClaw échouent uniquement sur les tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

À rechercher :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur les prompts plus volumineux
- des erreurs backend indiquant que `messages[].content` attend une chaîne
- des plantages backend qui n’apparaissent qu’avec des comptes de jetons de prompt plus élevés ou des prompts runtime d’agent complets

Signatures courantes :

- `messages[...].content: invalid type: sequence, expected a string` → le backend
  rejette les parties de contenu structurées de Chat Completions. Correctif : définir
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages backend/modèle
  (par exemple Gemma sur certains builds `inferrs`) → le transport OpenClaw est
  probablement déjà correct ; le backend échoue sur la forme plus volumineuse du prompt runtime d’agent.
- les échecs diminuent après désactivation des outils mais ne disparaissent pas → les schémas d’outils faisaient
  partie de la pression, mais le problème restant vient toujours en amont de la capacité du serveur/modèle
  ou d’un bug backend.

Options de correction :

1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que des chaînes.
2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer
   de manière fiable la surface de schéma d’outils d’OpenClaw.
3. Réduisez la pression sur le prompt lorsque possible : bootstrap workspace plus petit, historique
   de session plus court, modèle local plus léger, ou backend avec un meilleur support long contexte.
4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours
   dans le backend, traitez cela comme une limitation du serveur/modèle en amont et ouvrez un repro là-bas avec la forme de charge utile acceptée.

Liens associés :

- [Modèles locaux](/fr/gateway/local-models)
- [Configuration](/fr/gateway/configuration)
- [Points de terminaison compatibles OpenAI](/fr/gateway/configuration-reference#openai-compatible-endpoints)

## Aucune réponse

Si les canaux sont actifs mais que rien ne répond, vérifiez le routage et la politique avant de reconnecter quoi que ce soit.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

À rechercher :

- Appairage en attente pour les expéditeurs de messages privés.
- Contrôle par mention de groupe (`requireMention`, `mentionPatterns`).
- Incohérences de listes d’autorisation canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur a besoin d’une approbation.
- `blocked` / `allowlist` → l’expéditeur/le canal a été filtré par la politique.

Liens associés :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)

## Connectivité de la dashboard Control UI

Lorsque la dashboard/Control UI ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

À rechercher :

- URL de sonde et URL de dashboard correctes.
- Incohérence de mode d’authentification/jeton entre client et gateway.
- Utilisation HTTP là où une identité d’appareil est requise.

Signatures courantes :

- `device identity required` → contexte non sécurisé ou authentification appareil manquante.
- `origin not allowed` → `Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins`
  (ou vous vous connectez depuis une origine navigateur non-loopback sans liste d’autorisation explicite).
- `device nonce required` / `device nonce mismatch` → le client ne termine pas le
  flux d’authentification appareil basé sur challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → le client a signé la mauvaise
  charge utile (ou un horodatage périmé) pour la poignée de main en cours.
- `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une nouvelle tentative de confiance avec le jeton appareil en cache.
- Cette nouvelle tentative avec jeton en cache réutilise l’ensemble de scopes mis en cache stocké avec le jeton appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent à la place leur ensemble de scopes demandé.
- En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord
  jeton partagé/mot de passe explicite, puis `deviceToken` explicite, puis jeton appareil stocké,
  puis jeton bootstrap.
- Sur le chemin async Tailscale Serve Control UI, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes depuis le même client peuvent donc faire apparaître `retry later`
  sur la deuxième tentative au lieu de deux simples incohérences.
- `too many failed authentication attempts (retry later)` depuis un client loopback
  d’origine navigateur → les échecs répétés depuis cette même `Origin` normalisée sont temporairement bloqués ; une autre origine localhost utilise un compartiment distinct.
- répétition de `unauthorized` après cette nouvelle tentative → dérive du jeton partagé/jeton appareil ; actualisez la configuration du jeton et réapprouvez/faites tourner le jeton appareil si nécessaire.
- `gateway connect failed:` → mauvaise cible hôte/port/url.

### Correspondance rapide des codes de détail d’authentification

Utilisez `error.details.code` de la réponse `connect` en échec pour choisir l’action suivante :

| Code de détail               | Signification                                                                                                                                                                                | Action recommandée                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé de jeton partagé requis.                                                                                                                                            | Collez/définissez le jeton dans le client et réessayez. Pour les chemins dashboard : `openclaw config get gateway.auth.token` puis collez-le dans les paramètres de Control UI.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspond pas au jeton d’authentification de la gateway.                                                                                                               | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative de confiance. Les nouvelles tentatives avec jeton en cache réutilisent les scopes approuvés stockés ; les appelants avec `deviceToken` / `scopes` explicites conservent les scopes demandés. Si l’échec persiste, exécutez la [checklist de récupération de dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil mis en cache est périmé ou révoqué.                                                                                                                                    | Faites tourner/réapprouvez le jeton appareil avec la [CLI devices](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                               |
| `PAIRING_REQUIRED`           | L’identité de l’appareil nécessite une approbation. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`. Les montées de scope/rôle utilisent le même flux après examen de l’accès demandé.                                                                                               |

Vérification de migration device auth v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client connecté et vérifiez qu’il :

1. attend `connect.challenge`
2. signe la charge utile liée au challenge
3. envoie `connect.params.device.nonce` avec le même nonce de challenge

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions de jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil sauf si
  l’appelant possède aussi `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des scopes operator que
  la session appelante détient déjà

Liens associés :

- [Control UI](/fr/web/control-ui)
- [Configuration](/fr/gateway/configuration) (modes d’authentification de gateway)
- [Authentification de proxy approuvé](/fr/gateway/trusted-proxy-auth)
- [Accès distant](/fr/gateway/remote)
- [Devices](/fr/cli/devices)

## Service Gateway non en cours d’exécution

Utilisez cette section lorsque le service est installé mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analyse aussi les services au niveau système
```

À rechercher :

- `Runtime: stopped` avec indications de sortie.
- Incohérence de configuration du service (`Config (cli)` vs `Config (service)`).
- Conflits de port/listener.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indications de nettoyage `Other gateway-like services detected (best effort)`.

Signatures courantes :

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration attendue en mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification Gateway valide (jeton/mot de passe, ou trusted-proxy lorsque configuré).
- `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
- `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations devraient conserver une seule Gateway par machine ; si vous avez réellement besoin de plusieurs, isolez ports + configuration/état/workspace. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

Liens associés :

- [Exécution en arrière-plan et outil process](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Doctor](/fr/gateway/doctor)

## La Gateway a restauré la dernière configuration valide connue

Utilisez cette section lorsque la Gateway démarre, mais que les journaux indiquent qu’elle a restauré `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

À rechercher :

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un fichier horodaté `openclaw.json.clobbered.*` à côté de la configuration active
- Un événement système de l’agent principal qui commence par `Config recovery warning`

Ce qui s’est passé :

- La configuration rejetée n’a pas passé la validation au démarrage ou lors du rechargement à chaud.
- OpenClaw a préservé la charge utile rejetée sous `.clobbered.*`.
- La configuration active a été restaurée depuis la dernière copie valide connue.
- Le prochain tour de l’agent principal reçoit un avertissement pour ne pas réécrire aveuglément la configuration rejetée.
- Si tous les problèmes de validation se trouvaient sous `plugins.entries.<id>...`, OpenClaw
  n’aurait pas restauré tout le fichier. Les échecs locaux au plugin restent visibles tandis que les paramètres utilisateur non liés restent dans la configuration active.

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
- `.rejected.*` existe → une écriture de configuration gérée par OpenClaw a échoué aux vérifications de schéma ou d’écrasement avant validation finale.
- `Config write rejected:` → l’écriture a tenté de supprimer une structure requise, de réduire fortement la taille du fichier, ou de persister une configuration invalide.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, ou `size-drop-vs-last-good:*` → au démarrage, le fichier courant a été considéré comme écrasé car il avait perdu des champs ou de la taille par rapport à la dernière sauvegarde valide connue.
- `Config last-known-good promotion skipped` → le candidat contenait des espaces réservés de secret expurgés tels que `***`.

Options de correction :

1. Conservez la configuration active restaurée si elle est correcte.
2. Copiez uniquement les clés voulues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
3. Exécutez `openclaw config validate` avant de redémarrer.
4. Si vous modifiez à la main, conservez la configuration JSON5 complète, pas seulement l’objet partiel que vous vouliez modifier.

Liens associés :

- [Configuration : validation stricte](/fr/gateway/configuration#strict-validation)
- [Configuration : rechargement à chaud](/fr/gateway/configuration#config-hot-reload)
- [Config](/fr/cli/config)
- [Doctor](/fr/gateway/doctor)

## Avertissements de sonde Gateway

Utilisez cette section lorsque `openclaw gateway probe` atteint bien quelque chose, mais affiche quand même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

À rechercher :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs Gateways, des scopes manquants ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé les cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. Cela signifie généralement une configuration multi-Gateway intentionnelle ou des listeners obsolètes/en double.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a réussi, mais le RPC de détail est limité par les scopes ; appairez l’identité de l’appareil ou utilisez des identifiants avec `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → la Gateway a répondu, mais ce client a toujours besoin d’un appairage/d’une approbation avant un accès operator normal.
- texte d’avertissement SecretRef `gateway.auth.*` / `gateway.remote.*` non résolu → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Liens associés :

- [Gateway](/fr/cli/gateway)
- [Gateways multiples sur le même hôte](/fr/gateway#multiple-gateways-same-host)
- [Accès distant](/fr/gateway/remote)

## Canal connecté mais messages non transmis

Si l’état du canal est connecté mais que le flux de messages est mort, concentrez-vous sur la politique, les autorisations et les règles de livraison spécifiques au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

À rechercher :

- Politique de messages privés (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation de groupe et exigences de mention.
- Autorisations/scopes API du canal manquants.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- `pairing` / traces d’approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/autorisations du canal.

Liens associés :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [WhatsApp](/fr/channels/whatsapp)
- [Telegram](/fr/channels/telegram)
- [Discord](/fr/channels/discord)

## Livraison Cron et Heartbeat

Si Cron ou Heartbeat ne s’est pas exécuté ou n’a pas été livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

À rechercher :

- Cron activé et prochain réveil présent.
- État de l’historique d’exécution des tâches (`ok`, `skipped`, `error`).
- Raisons de saut Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Signatures courantes :

- `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
- `cron: timer tick failed` → échec du tick du planificateur ; vérifiez les erreurs de fichier/journal/runtime.
- `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la fenêtre d’heures actives.
- `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes Markdown, donc OpenClaw ignore l’appel au modèle.
- `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due à ce tick.
- `heartbeat: unknown accountId` → ID de compte invalide pour la cible de livraison Heartbeat.
- `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat a été résolue vers une destination de type message privé alors que `agents.defaults.heartbeat.directPolicy` (ou le remplacement par agent) est défini sur `block`.

Liens associés :

- [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [Heartbeat](/fr/gateway/heartbeat)

## Échec d’outil sur nœud appairé

Si un nœud est appairé mais que les outils échouent, isolez l’état du premier plan, des autorisations et des approbations.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

À rechercher :

- Nœud en ligne avec les capacités attendues.
- Autorisations OS pour caméra/micro/localisation/écran.
- Approbations exec et état de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application du nœud doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation OS manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation exec en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Liens associés :

- [Dépannage des nœuds](/fr/nodes/troubleshooting)
- [Nœuds](/fr/nodes/index)
- [Approbations Exec](/fr/tools/exec-approvals)

## Échec de l’outil browser

Utilisez cette section lorsque les actions de l’outil browser échouent alors que la Gateway elle-même est saine.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

À rechercher :

- Si `plugins.allow` est défini et inclut `browser`.
- Chemin exécutable browser valide.
- Accessibilité du profil CDP.
- Disponibilité de Chrome local pour les profils `existing-session` / `user`.

Signatures courantes :

- `unknown command "browser"` ou `unknown command 'browser'` → le Plugin browser bundled est exclu par `plugins.allow`.
- outil browser manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le Plugin n’a jamais été chargé.
- `Failed to start Chrome CDP on port` → le processus browser n’a pas pu démarrer.
- `browser.executablePath not found` → le chemin configuré est invalide.
- `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge tel que `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port invalide ou hors plage.
- `Could not find DevToolsActivePort for chrome` → la session existante Chrome MCP n’a pas encore pu s’attacher au répertoire de données browser sélectionné. Ouvrez la page d’inspection du browser, activez le débogage distant, laissez le browser ouvert, approuvez la première invite d’attachement, puis réessayez. Si l’état connecté n’est pas requis, préférez le profil géré `openclaw`.
- `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
- `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte de la gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a aucune cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle de la gateway ne dispose pas de la dépendance runtime `playwright-core` du Plugin browser bundled ; exécutez `openclaw doctor --fix`, puis redémarrez la gateway. Les instantanés ARIA et les captures d’écran de page basiques peuvent toujours fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’export PDF restent indisponibles.
- `fullPage is not supported for element screenshots` → la requête de capture d’écran mélange `--full-page` avec `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou un `--ref` d’instantané, pas un `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks d’envoi de fichiers Chrome MCP nécessitent des refs d’instantané, pas des sélecteurs CSS.
- `existing-session file uploads currently support one file at a time.` → envoyez un seul téléversement par appel sur les profils Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → les hooks de dialogue sur les profils Chrome MCP ne prennent pas en charge les remplacements de délai.
- `existing-session type does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:type` sur les profils `profile="user"` / Chrome MCP existing-session, ou utilisez un profil browser géré/CDP lorsqu’un délai personnalisé est requis.
- `existing-session evaluate does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:evaluate` sur les profils `profile="user"` / Chrome MCP existing-session, ou utilisez un profil browser géré/CDP lorsqu’un délai personnalisé est requis.
- `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un browser géré ou un profil CDP brut.
- overrides persistants de viewport / mode sombre / locale / hors ligne sur des profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer toute la gateway.

Liens associés :

- [Dépannage du browser](/fr/tools/browser-linux-troubleshooting)
- [Browser (géré par OpenClaw)](/fr/tools/browser)

## Si vous avez mis à niveau et que quelque chose s’est soudainement cassé

La plupart des régressions après mise à niveau proviennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

### 1) Le comportement d’authentification et de remplacement d’URL a changé

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Ce qu’il faut vérifier :

- Si `gateway.mode=remote`, les appels CLI peuvent cibler le distant alors que votre service local fonctionne bien.
- Les appels explicites avec `--url` ne reviennent pas aux identifiants stockés.

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

Ce qu’il faut vérifier :

- Les liaisons non-loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification gateway valide : authentification par jeton partagé/mot de passe, ou déploiement `trusted-proxy` non-loopback correctement configuré.
- Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

Signatures courantes :

- `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification gateway valide.
- `Connectivity probe: failed` alors que le runtime est en cours d’exécution → gateway active mais inaccessible avec l’authentification/l’URL actuelles.

### 3) L’état d’appairage et d’identité d’appareil a changé

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Ce qu’il faut vérifier :

- Approbations d’appareils en attente pour dashboard/nodes.
- Approbations d’appairage de messages privés en attente après modification de politique ou d’identité.

Signatures courantes :

- `device identity required` → authentification appareil non satisfaite.
- `pairing required` → expéditeur/appareil doit être approuvé.

Si la configuration du service et le runtime sont toujours en désaccord après vérifications, réinstallez les métadonnées du service depuis le même répertoire profile/state :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Liens associés :

- [Appairage géré par la Gateway](/fr/gateway/pairing)
- [Authentification](/fr/gateway/authentication)
- [Exécution en arrière-plan et outil process](/fr/gateway/background-process)

## Liens associés

- [Runbook de la Gateway](/fr/gateway)
- [Doctor](/fr/gateway/doctor)
- [FAQ](/fr/help/faq)
