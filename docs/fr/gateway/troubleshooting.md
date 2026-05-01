---
read_when:
    - Le centre de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Il vous faut des sections de guide d’intervention stables, basées sur les symptômes, avec des commandes exactes
sidebarTitle: Troubleshooting
summary: Guide opérationnel de dépannage approfondi pour le Gateway, les canaux, l’automatisation, les nœuds et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-05-01T07:15:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Cette page est le guide d’exploitation détaillé. Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous voulez d’abord le flux de triage rapide.

## Séquence de commandes

Exécutez d’abord ces commandes, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux de bon fonctionnement attendus :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration ou de service.
- `openclaw channels status --probe` affiche l’état de transport actif par compte et, lorsque c’est pris en charge, les résultats de sonde/audit comme `works` ou `audit ok`.

## Installations divergentes et garde-fou de configuration plus récente

Utilisez cette procédure lorsqu’un service Gateway s’arrête de manière inattendue après une mise à jour, ou lorsque les journaux indiquent qu’un binaire `openclaw` est plus ancien que la version qui a écrit `openclaw.json` en dernier.

OpenClaw marque les écritures de configuration avec `meta.lastTouchedVersion`. Les commandes en lecture seule peuvent toujours inspecter une configuration écrite par un OpenClaw plus récent, mais les mutations de processus et de services refusent de continuer depuis un binaire plus ancien. Les actions bloquées incluent le démarrage, l’arrêt, le redémarrage et la désinstallation du service Gateway, la réinstallation forcée du service, le démarrage du Gateway en mode service et le nettoyage de port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Corrigez `PATH` afin que `openclaw` pointe vers l’installation plus récente, puis relancez l’action.
  </Step>
  <Step title="Reinstall the gateway service">
    Réinstallez le service Gateway prévu depuis l’installation plus récente :

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Supprimez les anciens paquets système ou les anciennes entrées d’enveloppe qui pointent encore vers un ancien binaire `openclaw`.
  </Step>
</Steps>

<Warning>
Pour une rétrogradation volontaire ou une récupération d’urgence uniquement, définissez `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` pour la commande unique. Laissez-la non définie en fonctionnement normal.
</Warning>

## Utilisation supplémentaire Anthropic requise pour le contexte long

Utilisez cette procédure lorsque les journaux/erreurs contiennent : `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Recherchez :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation du contexte long.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

<Steps>
  <Step title="Disable context1m">
    Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
  </Step>
  <Step title="Use an eligible credential">
    Utilisez un identifiant Anthropic éligible aux requêtes de contexte long, ou passez à une clé API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Configurez des modèles de secours afin que les exécutions continuent lorsque les requêtes de contexte long Anthropic sont rejetées.
  </Step>
</Steps>

Connexe :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Pourquoi est-ce que je vois HTTP 429 depuis Anthropic ?](/fr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Le backend local compatible OpenAI réussit les sondes directes, mais les exécutions d’agent échouent

Utilisez cette procédure lorsque :

- `curl ... /v1/models` fonctionne
- les petits appels directs à `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent seulement lors des tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Recherchez :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent seulement avec des prompts plus volumineux
- des erreurs `model_not_found` ou 404 alors que l’appel direct à `/v1/chat/completions`
  fonctionne avec le même id de modèle nu
- des erreurs du backend indiquant que `messages[].content` attend une chaîne
- des avertissements intermittents `incomplete turn detected ... stopReason=stop payloads=0` avec un backend local compatible OpenAI
- des plantages du backend qui n’apparaissent qu’avec des nombres de tokens de prompt plus élevés ou des prompts complets d’exécution d’agent

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` avec un serveur local de style MLX/vLLM → vérifiez que `baseUrl` inclut `/v1`, que `api` vaut `"openai-completions"` pour les backends `/v1/chat/completions`, et que `models.providers.<provider>.models[].id` est l’id local au fournisseur nu. Sélectionnez-le une fois avec le préfixe du fournisseur, par exemple `mlx/mlx-community/Qwen3-30B-A3B-6bit` ; conservez l’entrée de catalogue sous la forme `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → le backend rejette les parties de contenu structurées de Chat Completions. Correctif : définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → le backend a terminé la requête Chat Completions, mais n’a renvoyé aucun texte d’assistant visible par l’utilisateur pour ce tour. OpenClaw réessaie une fois les tours vides compatibles OpenAI qui peuvent être rejoués sans risque ; les échecs persistants signifient généralement que le backend émet du contenu vide/non textuel ou supprime le texte de réponse finale.
    - les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages du backend/modèle (par exemple Gemma sur certaines versions d’`inferrs`) → le transport OpenClaw est probablement déjà correct ; le backend échoue sur la forme plus volumineuse du prompt d’exécution d’agent.
    - les échecs diminuent après la désactivation des outils, mais ne disparaissent pas → les schémas d’outils faisaient partie de la pression, mais le problème restant relève toujours de la capacité du modèle/serveur en amont ou d’un bogue du backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que les chaînes.
    2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer de manière fiable la surface de schéma d’outils d’OpenClaw.
    3. Réduisez la pression du prompt lorsque c’est possible : amorçage d’espace de travail plus petit, historique de session plus court, modèle local plus léger ou backend avec une meilleure prise en charge du contexte long.
    4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours dans le backend, traitez cela comme une limitation du serveur/modèle en amont et déposez-y une reproduction avec la forme de charge utile acceptée.
  </Accordion>
</AccordionGroup>

Connexe :

- [Configuration](/fr/gateway/configuration)
- [Modèles locaux](/fr/gateway/local-models)
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

Recherchez :

- Appairage en attente pour les expéditeurs de messages directs.
- Filtrage des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incohérences de liste d’autorisation de canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à une mention.
- `pairing request` → l’expéditeur nécessite une approbation.
- `blocked` / `allowlist` → l’expéditeur/le canal a été filtré par la politique.

Connexe :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Groupes](/fr/channels/groups)
- [Appairage](/fr/channels/pairing)

## Connectivité de l’interface utilisateur de contrôle du tableau de bord

Lorsque l’interface utilisateur de contrôle/tableau de bord ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Recherchez :

- URL de sonde et URL de tableau de bord correctes.
- Incohérence de mode d’authentification/jeton entre le client et le Gateway.
- Utilisation de HTTP là où l’identité de l’appareil est requise.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
    - `origin not allowed` → l’`Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins` (ou vous vous connectez depuis une origine de navigateur non loopback sans liste d’autorisation explicite).
    - `device nonce required` / `device nonce mismatch` → le client ne termine pas le flux d’authentification d’appareil basé sur défi (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → le client a signé la mauvaise charge utile (ou un horodatage obsolète) pour la négociation actuelle.
    - `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une nouvelle tentative de confiance avec le jeton d’appareil mis en cache.
    - Cette nouvelle tentative avec jeton mis en cache réutilise l’ensemble de portées mis en cache stocké avec le jeton d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent plutôt leur ensemble de portées demandé.
    - En dehors de ce chemin de nouvelle tentative, la précédence de l’authentification de connexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
    - Sur le chemin asynchrone de l’interface utilisateur de contrôle Tailscale Serve, les tentatives échouées pour le même `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives simultanées depuis le même client peuvent donc faire apparaître `retry later` à la deuxième tentative au lieu de deux simples incohérences.
    - `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur → les échecs répétés depuis cette même `Origin` normalisée sont verrouillés temporairement ; une autre origine localhost utilise un compartiment distinct.
    - `unauthorized` répété après cette nouvelle tentative → dérive du jeton partagé/jeton d’appareil ; actualisez la configuration du jeton et réapprouvez/faites tourner le jeton d’appareil si nécessaire.
    - `gateway connect failed:` → cible d’hôte/port/url incorrecte.

  </Accordion>
</AccordionGroup>

### Carte rapide des codes de détail d’authentification

Utilisez `error.details.code` de la réponse `connect` échouée pour choisir l’action suivante :

| Code de détail               | Signification                                                                                                                                                                                | Action recommandée                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé un jeton partagé requis.                                                                                                                                            | Collez/définissez le jeton dans le client, puis réessayez. Pour les chemins du tableau de bord : `openclaw config get gateway.auth.token`, puis collez-le dans les paramètres de Control UI.                                                                                                                        |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspondait pas au jeton d’authentification du Gateway.                                                                                                                 | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative approuvée. Les nouvelles tentatives avec jeton en cache réutilisent les portées approuvées stockées ; les appelants `deviceToken` / `scopes` explicites conservent les portées demandées. Si l’échec persiste, exécutez la [liste de contrôle de récupération de dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil mis en cache est obsolète ou révoqué.                                                                                                                                  | Faites une rotation/réapprouvez le jeton d’appareil avec la [CLI des appareils](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                                               |
| `PAIRING_REQUIRED`           | L’identité de l’appareil nécessite une approbation. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list`, puis `openclaw devices approve <requestId>`. Les montées de portée/rôle utilisent le même flux après examen de l’accès demandé.                                                                                                                         |

<Note>
Les RPC backend en loopback direct authentifiés avec le jeton/mot de passe partagé du Gateway ne doivent pas dépendre de la référence de portée d’appareil appairé de la CLI. Si les sous-agents ou d’autres appels internes échouent encore avec `scope-upgrade`, vérifiez que l’appelant utilise `client.id: "gateway-client"` et `client.mode: "backend"` et qu’il ne force pas explicitement `deviceIdentity` ni un jeton d’appareil.
</Note>

Vérification de migration de l’authentification d’appareil v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client connecté et vérifiez-le :

<Steps>
  <Step title="Attendre connect.challenge">
    Le client attend le `connect.challenge` émis par le Gateway.
  </Step>
  <Step title="Signer la charge utile">
    Le client signe la charge utile liée au défi.
  </Step>
  <Step title="Envoyer le nonce de l’appareil">
    Le client envoie `connect.params.device.nonce` avec le même nonce de défi.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de façon inattendue :

- les sessions avec jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil, sauf si l’appelant dispose aussi de `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que les portées opérateur que la session appelante possède déjà

Liens associés :

- [Configuration](/fr/gateway/configuration) (modes d’authentification du Gateway)
- [Control UI](/fr/web/control-ui)
- [Appareils](/fr/cli/devices)
- [Accès distant](/fr/gateway/remote)
- [Authentification de proxy de confiance](/fr/gateway/trusted-proxy-auth)

## Service Gateway non démarré

Utilisez ceci lorsque le service est installé, mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Recherchez :

- `Runtime: stopped` avec des indications de code de sortie.
- Incohérence de configuration de service (`Config (cli)` contre `Config (service)`).
- Conflits de port/écouteur.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indications de nettoyage `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou réexécutez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration de mode local attendue. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → liaison hors loopback sans chemin d’authentification Gateway valide (jeton/mot de passe, ou proxy de confiance lorsque configuré).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
    - `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations doivent garder un seul Gateway par machine ; si vous en avez besoin de plusieurs, isolez les ports + la configuration/l’état/l’espace de travail. Consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` depuis doctor → une unité système systemd existe alors que le service au niveau utilisateur est absent. Supprimez ou désactivez le doublon avant d’autoriser doctor à installer un service utilisateur, ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` si l’unité système est le superviseur prévu.
    - `Gateway service port does not match current gateway config` → le superviseur installé fixe encore l’ancien `--port`. Exécutez `openclaw doctor --fix` ou `openclaw gateway install --force`, puis redémarrez le service Gateway.

  </Accordion>
</AccordionGroup>

Liens associés :

- [Exécution en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Doctor](/fr/gateway/doctor)

## Le Gateway a restauré la dernière bonne configuration connue

Utilisez ceci lorsque le Gateway démarre, mais que les journaux indiquent qu’il a restauré `openclaw.json`.

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
- Un événement système de l’agent principal commençant par `Config recovery warning`

<AccordionGroup>
  <Accordion title="Ce qui s’est passé">
    - La configuration rejetée n’a pas été validée au démarrage ou lors du rechargement à chaud.
    - OpenClaw a conservé la charge utile rejetée sous `.clobbered.*`.
    - La configuration active a été restaurée depuis la dernière copie validée connue comme bonne.
    - Le prochain tour de l’agent principal reçoit un avertissement lui demandant de ne pas réécrire aveuglément la configuration rejetée.
    - Si tous les problèmes de validation se trouvaient sous `plugins.entries.<id>...`, OpenClaw n’aurait pas restauré tout le fichier. Les échecs locaux au Plugin restent visibles tandis que les paramètres utilisateur sans rapport demeurent dans la configuration active.

  </Accordion>
  <Accordion title="Inspecter et réparer">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Signatures courantes">
    - `.clobbered.*` existe → une modification directe externe ou une lecture au démarrage a été restaurée.
    - `.rejected.*` existe → une écriture de configuration appartenant à OpenClaw a échoué aux vérifications de schéma ou d’écrasement avant validation.
    - `Config write rejected:` → l’écriture a tenté de supprimer une structure requise, de réduire fortement le fichier ou de persister une configuration invalide.
    - `Rejected validation details:` → le journal de récupération ou l’avis de l’agent principal inclut le chemin de schéma ayant causé la restauration, comme `agents.defaults.execution` ou `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → le démarrage a traité le fichier actuel comme écrasé parce qu’il avait perdu des champs ou de la taille par rapport à la dernière sauvegarde connue comme bonne.
    - `Config last-known-good promotion skipped` → le candidat contenait des espaces réservés de secrets masqués tels que `***`.

  </Accordion>
  <Accordion title="Options de correction">
    1. Conservez la configuration active restaurée si elle est correcte.
    2. Copiez uniquement les clés prévues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
    3. Exécutez `openclaw config validate` avant de redémarrer.
    4. Si vous modifiez à la main, conservez la configuration JSON5 complète, pas seulement l’objet partiel que vous vouliez modifier.
  </Accordion>
</AccordionGroup>

Liens associés :

- [Config](/fr/cli/config)
- [Configuration : rechargement à chaud](/fr/gateway/configuration#config-hot-reload)
- [Configuration : validation stricte](/fr/gateway/configuration#strict-validation)
- [Doctor](/fr/gateway/doctor)

## Avertissements de sonde Gateway

Utilisez ceci lorsque `openclaw gateway probe` atteint quelque chose, mais affiche tout de même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Recherchez :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs Gateways, des portées manquantes ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé les cibles configurées/directes/loopback.
- `multiple reachable gateways detected` → plus d’une cible a répondu. Cela indique généralement une configuration multi-Gateway intentionnelle ou des écouteurs obsolètes/dupliqués.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a fonctionné, mais le RPC de détail est limité par la portée ; appairez l’identité de l’appareil ou utilisez des identifiants avec `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connexion a fonctionné, mais l’ensemble complet des RPC de diagnostic a expiré ou échoué. Traitez cela comme un Gateway joignable avec des diagnostics dégradés ; comparez `connect.ok` et `connect.rpcOk` dans la sortie `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → le Gateway a répondu, mais ce client nécessite encore un appairage/une approbation avant l’accès opérateur normal.
- texte d’avertissement SecretRef `gateway.auth.*` / `gateway.remote.*` non résolu → le matériel d’authentification était indisponible dans ce chemin de commande pour la cible en échec.

Liens associés :

- [Gateway](/fr/cli/gateway)
- [Plusieurs Gateways sur le même hôte](/fr/gateway#multiple-gateways-same-host)
- [Accès distant](/fr/gateway/remote)

## Canal connecté, messages non transmis

Si l’état du canal est connecté mais que le flux de messages est arrêté, concentrez-vous sur la politique, les autorisations et les règles de livraison propres au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Recherchez :

- Politique de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Liste d’autorisation de groupe et exigences de mention.
- Permissions/scopes d’API de canal manquants.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- `pairing` / traces d’approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/permissions du canal.

Connexe :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Discord](/fr/channels/discord)
- [Telegram](/fr/channels/telegram)
- [WhatsApp](/fr/channels/whatsapp)

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

- Cron activé et prochain réveil présent.
- État de l’historique d’exécution de la tâche (`ok`, `skipped`, `error`).
- Raisons de saut Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
    - `cron: timer tick failed` → le tick du planificateur a échoué ; vérifiez les erreurs de fichier/journal/runtime.
    - `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la plage d’heures actives.
    - `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes markdown, donc OpenClaw ignore l’appel au modèle.
    - `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due lors de ce tick.
    - `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de livraison Heartbeat.
    - `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat a été résolue vers une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou une surcharge par agent) est défini sur `block`.

  </Accordion>
</AccordionGroup>

Connexe :

- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting)

## Node appairé, échec de l’outil

Si un Node est appairé mais que les outils échouent, isolez l’état de premier plan, de permission et d’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Recherchez :

- Node en ligne avec les capacités attendues.
- Autorisations du système d’exploitation pour caméra/micro/localisation/écran.
- Approbations d’exécution et état de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permission du système d’exploitation manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation d’exécution en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Connexe :

- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Dépannage des Node](/fr/nodes/troubleshooting)
- [Nodes](/fr/nodes/index)

## Échec de l’outil navigateur

Utilisez ceci lorsque les actions de l’outil navigateur échouent alors que le Gateway lui-même est sain.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Recherchez :

- Si `plugins.allow` est défini et inclut `browser`.
- Chemin valide vers l’exécutable du navigateur.
- Accessibilité du profil CDP.
- Disponibilité locale de Chrome pour les profils `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Signatures de Plugin / exécutable">
    - `unknown command "browser"` ou `unknown command 'browser'` → le Plugin navigateur inclus est exclu par `plugins.allow`.
    - outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le Plugin n’a jamais été chargé.
    - `Failed to start Chrome CDP on port` → le processus du navigateur n’a pas pu démarrer.
    - `browser.executablePath not found` → le chemin configuré est invalide.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge comme `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port incorrect ou hors plage.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle du Gateway ne dispose pas de la dépendance runtime `playwright-core` du Plugin navigateur inclus ; exécutez `openclaw doctor --fix`, puis redémarrez le Gateway. Les instantanés ARIA et les captures d’écran de page de base peuvent encore fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’export PDF restent indisponibles.

  </Accordion>
  <Accordion title="Signatures Chrome MCP / session existante">
    - `Could not find DevToolsActivePort for chrome` → la session existante Chrome MCP n’a pas encore pu s’attacher au répertoire de données du navigateur sélectionné. Ouvrez la page d’inspection du navigateur, activez le débogage à distance, gardez le navigateur ouvert, approuvez la première invite d’attachement, puis réessayez. Si l’état connecté n’est pas requis, préférez le profil `openclaw` géré.
    - `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
    - `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte du Gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil en attachement uniquement n’a aucune cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.

  </Accordion>
  <Accordion title="Signatures d’élément / capture d’écran / téléversement">
    - `fullPage is not supported for element screenshots` → la demande de capture d’écran a mélangé `--full-page` avec `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou une `--ref` d’instantané, pas un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP ont besoin de références d’instantané, pas de sélecteurs CSS.
    - `existing-session file uploads currently support one file at a time.` → envoyez un téléversement par appel sur les profils Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → les hooks de boîte de dialogue sur les profils Chrome MCP ne prennent pas en charge les surcharges de délai d’expiration.
    - `existing-session type does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:type` sur les profils `profile="user"` / session existante Chrome MCP, ou utilisez un profil de navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `existing-session evaluate does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:evaluate` sur les profils `profile="user"` / session existante Chrome MCP, ou utilisez un profil de navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite toujours un navigateur géré ou un profil CDP brut.
    - surcharges obsolètes de viewport / mode sombre / locale / hors ligne sur des profils en attachement uniquement ou CDP distant → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer tout le Gateway.

  </Accordion>
</AccordionGroup>

Connexe :

- [Navigateur (géré par OpenClaw)](/fr/tools/browser)
- [Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting)

## Si vous avez effectué une mise à niveau et que quelque chose s’est soudainement cassé

La plupart des ruptures après mise à niveau proviennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

<AccordionGroup>
  <Accordion title="1. Le comportement des surcharges d’authentification et d’URL a changé">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Ce qu’il faut vérifier :

    - Si `gateway.mode=remote`, les appels CLI peuvent cibler le distant alors que votre service local fonctionne correctement.
    - Les appels explicites `--url` ne se rabattent pas sur les identifiants stockés.

    Signatures courantes :

    - `gateway connect failed:` → mauvaise cible d’URL.
    - `unauthorized` → point de terminaison accessible mais mauvaise authentification.

  </Accordion>
  <Accordion title="2. Les garde-fous de liaison et d’authentification sont plus stricts">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Ce qu’il faut vérifier :

    - Les liaisons non local loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification Gateway valide : authentification par jeton/mot de passe partagé, ou déploiement `trusted-proxy` non local loopback correctement configuré.
    - Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

    Signatures courantes :

    - `refusing to bind gateway ... without auth` → liaison non local loopback sans chemin d’authentification Gateway valide.
    - `Connectivity probe: failed` alors que le runtime fonctionne → Gateway actif mais inaccessible avec l’authentification/l’URL actuelle.

  </Accordion>
  <Accordion title="3. L’état d’appairage et d’identité de l’appareil a changé">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Ce qu’il faut vérifier :

    - Approbations d’appareils en attente pour le tableau de bord/les Nodes.
    - Approbations d’appairage DM en attente après des changements de politique ou d’identité.

    Signatures courantes :

    - `device identity required` → authentification de l’appareil non satisfaite.
    - `pairing required` → l’expéditeur/l’appareil doit être approuvé.

  </Accordion>
</AccordionGroup>

Si la configuration du service et le runtime divergent encore après les vérifications, réinstallez les métadonnées du service depuis le même répertoire de profil/état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Connexe :

- [Authentification](/fr/gateway/authentication)
- [Exécution en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Appairage détenu par le Gateway](/fr/gateway/pairing)

## Connexe

- [Doctor](/fr/gateway/doctor)
- [FAQ](/fr/help/faq)
- [Runbook du Gateway](/fr/gateway)
