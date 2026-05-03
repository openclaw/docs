---
read_when:
    - Le centre de dépannage vous a redirigé ici pour un diagnostic plus approfondi
    - Il vous faut des sections de procédures d’exploitation stables, basées sur les symptômes, avec des commandes exactes.
sidebarTitle: Troubleshooting
summary: Runbook de dépannage approfondi pour Gateway, les canaux, l’automatisation, les nœuds et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-05-03T21:33:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Cette page est le guide d’exploitation approfondi. Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous voulez d’abord le flux de triage rapide.

## Séquence de commandes

Exécutez-les d’abord, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus en bon état :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration ou de service.
- `openclaw channels status --probe` affiche l’état de transport en direct par compte et, lorsque c’est pris en charge, des résultats de sonde/audit comme `works` ou `audit ok`.

## Installations divergentes et garde-fou de configuration plus récente

Utilisez ceci lorsqu’un service Gateway s’arrête de façon inattendue après une mise à jour, ou lorsque les journaux indiquent qu’un binaire `openclaw` est plus ancien que la version qui a écrit `openclaw.json` en dernier.

OpenClaw marque les écritures de configuration avec `meta.lastTouchedVersion`. Les commandes en lecture seule peuvent toujours inspecter une configuration écrite par un OpenClaw plus récent, mais les mutations de processus et de service refusent de continuer depuis un binaire plus ancien. Les actions bloquées incluent le démarrage, l’arrêt, le redémarrage et la désinstallation du service Gateway, la réinstallation forcée du service, le démarrage du Gateway en mode service et le nettoyage de port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corriger PATH">
    Corrigez `PATH` afin que `openclaw` pointe vers l’installation la plus récente, puis relancez l’action.
  </Step>
  <Step title="Réinstaller le service Gateway">
    Réinstallez le service Gateway prévu depuis l’installation la plus récente :

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Supprimer les wrappers obsolètes">
    Supprimez les paquets système obsolètes ou les anciennes entrées de wrapper qui pointent encore vers un ancien binaire `openclaw`.
  </Step>
</Steps>

<Warning>
Uniquement pour une rétrogradation intentionnelle ou une récupération d’urgence, définissez `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` pour la commande unique. Laissez-le non défini en fonctionnement normal.
</Warning>

## Utilisation supplémentaire Anthropic 429 requise pour un contexte long

Utilisez ceci lorsque les journaux/erreurs contiennent : `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Recherchez :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation de contexte long.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

<Steps>
  <Step title="Désactiver context1m">
    Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
  </Step>
  <Step title="Utiliser un identifiant éligible">
    Utilisez un identifiant Anthropic éligible aux requêtes de contexte long, ou passez à une clé d’API Anthropic.
  </Step>
  <Step title="Configurer des modèles de repli">
    Configurez des modèles de repli afin que les exécutions continuent lorsque les requêtes de contexte long Anthropic sont rejetées.
  </Step>
</Steps>

Liens connexes :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Pourquoi est-ce que je vois HTTP 429 depuis Anthropic ?](/fr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Le backend local compatible OpenAI réussit les sondes directes, mais les exécutions d’agent échouent

Utilisez ceci lorsque :

- `curl ... /v1/models` fonctionne
- les petits appels directs à `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent uniquement lors de tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Recherchez :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur de plus grands prompts
- des erreurs `model_not_found` ou 404, même si les appels directs à `/v1/chat/completions`
  fonctionnent avec le même id de modèle nu
- des erreurs de backend indiquant que `messages[].content` attend une chaîne
- des avertissements intermittents `incomplete turn detected ... stopReason=stop payloads=0` avec un backend local compatible OpenAI
- des plantages du backend qui n’apparaissent qu’avec de plus grands nombres de tokens de prompt ou des prompts complets de runtime d’agent

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `model_not_found` avec un serveur local de style MLX/vLLM → vérifiez que `baseUrl` inclut `/v1`, que `api` vaut `"openai-completions"` pour les backends `/v1/chat/completions`, et que `models.providers.<provider>.models[].id` est l’id local au fournisseur nu. Sélectionnez-le une fois avec le préfixe du fournisseur, par exemple `mlx/mlx-community/Qwen3-30B-A3B-6bit` ; conservez l’entrée de catalogue comme `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → le backend rejette les parties de contenu structurées de Chat Completions. Correctif : définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → le backend a terminé la requête Chat Completions mais n’a renvoyé aucun texte d’assistant visible par l’utilisateur pour ce tour. OpenClaw réessaie une fois les tours vides compatibles OpenAI qui peuvent être rejoués sans risque ; des échecs persistants signifient généralement que le backend émet du contenu vide/non textuel ou supprime le texte de réponse finale.
    - les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages de backend/modèle (par exemple Gemma sur certaines builds `inferrs`) → le transport OpenClaw est probablement déjà correct ; le backend échoue sur la forme plus volumineuse du prompt de runtime d’agent.
    - les échecs diminuent après la désactivation des outils mais ne disparaissent pas → les schémas d’outils faisaient partie de la pression, mais le problème restant est toujours la capacité du modèle/serveur en amont ou un bogue du backend.

  </Accordion>
  <Accordion title="Options de correction">
    1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que des chaînes.
    2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer de manière fiable la surface de schéma d’outils d’OpenClaw.
    3. Réduisez la pression du prompt lorsque c’est possible : amorçage d’espace de travail plus petit, historique de session plus court, modèle local plus léger ou backend avec une meilleure prise en charge du contexte long.
    4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours dans le backend, traitez cela comme une limitation du serveur/modèle en amont et déposez-y une reproduction avec la forme de charge utile acceptée.
  </Accordion>
</AccordionGroup>

Liens connexes :

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

Recherchez :

- Appairage en attente pour les expéditeurs de DM.
- Filtrage des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incompatibilités de liste d’autorisation de canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur doit être approuvé.
- `blocked` / `allowlist` → l’expéditeur/le canal a été filtré par la politique.

Liens connexes :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Groupes](/fr/channels/groups)
- [Appairage](/fr/channels/pairing)

## Connectivité de l’interface utilisateur de contrôle du tableau de bord

Lorsque l’interface utilisateur tableau de bord/contrôle ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Recherchez :

- URL de sonde et URL de tableau de bord correctes.
- Incompatibilité de mode/jeton d’authentification entre le client et le Gateway.
- Utilisation de HTTP là où l’identité de l’appareil est requise.

<AccordionGroup>
  <Accordion title="Signatures de connexion/authentification">
    - `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
    - `origin not allowed` → l’`Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins` (ou vous vous connectez depuis une origine de navigateur non local loopback sans liste d’autorisation explicite).
    - `device nonce required` / `device nonce mismatch` → le client ne termine pas le flux d’authentification d’appareil basé sur un défi (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → le client a signé la mauvaise charge utile (ou un horodatage obsolète) pour la négociation actuelle.
    - `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une tentative approuvée avec le jeton d’appareil en cache.
    - Cette nouvelle tentative avec jeton en cache réutilise l’ensemble de portées en cache stocké avec le jeton d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicite conservent plutôt l’ensemble de portées qu’ils ont demandé.
    - En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
    - Sur le chemin async de l’interface utilisateur de contrôle Tailscale Serve, les tentatives échouées pour le même `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes depuis le même client peuvent donc afficher `retry later` à la deuxième tentative au lieu de deux simples incompatibilités.
    - `too many failed authentication attempts (retry later)` depuis un client local loopback d’origine navigateur → les échecs répétés depuis cette même `Origin` normalisée sont verrouillés temporairement ; une autre origine localhost utilise un compartiment séparé.
    - `unauthorized` répété après cette nouvelle tentative → dérive du jeton partagé/jeton d’appareil ; actualisez la configuration du jeton et réapprouvez/faites tourner le jeton d’appareil si nécessaire.
    - `gateway connect failed:` → mauvaise cible hôte/port/url.

  </Accordion>
</AccordionGroup>

### Carte rapide des codes de détail d’authentification

Utilisez `error.details.code` depuis la réponse `connect` échouée pour choisir l’action suivante :

| Code de détail               | Signification                                                                                                                                                                                       | Action recommandée                                                                                                                                                                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé un jeton partagé requis.                                                                                                                                                   | Collez/définissez le jeton dans le client, puis réessayez. Pour les chemins du tableau de bord : `openclaw config get gateway.auth.token`, puis collez-le dans les paramètres de Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspondait pas au jeton d’authentification du Gateway.                                                                                                                        | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative de confiance. Les nouvelles tentatives avec jeton en cache réutilisent les portées approuvées stockées ; les appelants `deviceToken` / `scopes` explicites conservent les portées demandées. Si l’échec persiste, exécutez la [liste de vérification de récupération en cas de dérive du jeton](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil mis en cache est obsolète ou révoqué.                                                                                                                                         | Faites pivoter/réapprouver le jeton d’appareil avec la [CLI des appareils](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                                                |
| `PAIRING_REQUIRED`           | L’identité de l’appareil doit être approuvée. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list`, puis `openclaw devices approve <requestId>`. Les mises à niveau de portée/rôle utilisent le même flux après examen de l’accès demandé.                                                                                                             |

<Note>
Les RPC backend loopback directs authentifiés avec le jeton/mot de passe partagé du Gateway ne doivent pas dépendre de la base de portée des appareils appairés de la CLI. Si des sous-agents ou d’autres appels internes échouent encore avec `scope-upgrade`, vérifiez que l’appelant utilise `client.id: "gateway-client"` et `client.mode: "backend"` et ne force pas un `deviceIdentity` explicite ni un jeton d’appareil.
</Note>

Vérification de migration de l’authentification des appareils v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client de connexion et vérifiez-le :

<Steps>
  <Step title="Wait for connect.challenge">
    Le client attend le `connect.challenge` émis par le Gateway.
  </Step>
  <Step title="Sign the payload">
    Le client signe la charge utile liée au défi.
  </Step>
  <Step title="Send the device nonce">
    Le client envoie `connect.params.device.nonce` avec le même nonce de défi.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions avec jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil, sauf si l’appelant dispose aussi de `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des portées opérateur déjà détenues par la session appelante

Connexe :

- [Configuration](/fr/gateway/configuration) (modes d’authentification du Gateway)
- [Control UI](/fr/web/control-ui)
- [Appareils](/fr/cli/devices)
- [Accès distant](/fr/gateway/remote)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)

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

- `Runtime: stopped` avec des indications de sortie.
- Incompatibilité de configuration de service (`Config (cli)` vs `Config (service)`).
- Conflits de port/écouteur.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indications de nettoyage `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration de mode local attendue. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification Gateway valide (jeton/mot de passe, ou trusted-proxy si configuré).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
    - `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations doivent conserver un seul Gateway par machine ; si vous en avez besoin de plusieurs, isolez les ports + la configuration/l’état/l’espace de travail. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` depuis doctor → une unité système systemd existe alors que le service de niveau utilisateur est absent. Supprimez ou désactivez le doublon avant d’autoriser doctor à installer un service utilisateur, ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` si l’unité système est le superviseur prévu.
    - `Gateway service port does not match current gateway config` → le superviseur installé fixe encore l’ancien `--port`. Exécutez `openclaw doctor --fix` ou `openclaw gateway install --force`, puis redémarrez le service Gateway.

  </Accordion>
</AccordionGroup>

Connexe :

- [Exécution en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Doctor](/fr/gateway/doctor)

## Gateway a rejeté une configuration invalide

Utilisez ceci lorsque le démarrage du Gateway échoue avec `Invalid config` ou lorsque les journaux de rechargement à chaud indiquent
qu’une modification invalide a été ignorée.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Recherchez :

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Un fichier horodaté `openclaw.json.rejected.*` à côté de la configuration active
- Un fichier horodaté `openclaw.json.clobbered.*` si `doctor --fix` a réparé une modification directe cassée

<AccordionGroup>
  <Accordion title="What happened">
    - La configuration n’a pas été validée pendant le démarrage, le rechargement à chaud ou une écriture détenue par OpenClaw.
    - Le démarrage du Gateway échoue de façon fermée au lieu de réécrire `openclaw.json`.
    - Le rechargement à chaud ignore les modifications externes invalides et conserve la configuration d’exécution actuelle active.
    - Les écritures détenues par OpenClaw rejettent les charges utiles invalides/destructrices avant validation et enregistrent `.rejected.*`.
    - `openclaw doctor --fix` possède la réparation. Il peut supprimer les préfixes non JSON ou restaurer la dernière copie connue comme bonne tout en conservant la charge utile rejetée sous `.clobbered.*`.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` existe → doctor a conservé une modification externe cassée pendant la réparation de la configuration active.
    - `.rejected.*` existe → une écriture de configuration détenue par OpenClaw a échoué aux vérifications de schéma ou d’écrasement avant validation.
    - `Config write rejected:` → l’écriture a tenté de supprimer la forme requise, de réduire fortement le fichier ou de persister une configuration invalide.
    - `config reload skipped (invalid config):` → une modification directe a échoué à la validation et a été ignorée par le Gateway en cours d’exécution.
    - `Invalid config at ...` → le démarrage a échoué avant le lancement des services Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → une écriture détenue par OpenClaw a été rejetée parce qu’elle a perdu des champs ou de la taille par rapport à la dernière sauvegarde connue comme bonne.
    - `Config last-known-good promotion skipped` → le candidat contenait des espaces réservés de secrets masqués tels que `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Exécutez `openclaw doctor --fix` pour laisser doctor réparer une configuration préfixée/écrasée ou restaurer la dernière version connue comme bonne.
    2. Copiez uniquement les clés prévues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
    3. Exécutez `openclaw config validate` avant de redémarrer.
    4. Si vous modifiez à la main, conservez la configuration JSON5 complète, pas seulement l’objet partiel que vous vouliez changer.
  </Accordion>
</AccordionGroup>

Connexe :

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

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a tout de même tenté les cibles directes configurées/loopback.
- `multiple reachable gateways detected` → plusieurs cibles ont répondu. Cela signifie généralement une configuration multi-Gateway intentionnelle ou des écouteurs obsolètes/en double.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a fonctionné, mais la RPC de détail est limitée par la portée ; appairez l’identité de l’appareil ou utilisez des identifiants avec `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connexion a fonctionné, mais l’ensemble complet des RPC de diagnostic a expiré ou échoué. Traitez cela comme un Gateway joignable avec des diagnostics dégradés ; comparez `connect.ok` et `connect.rpcOk` dans la sortie `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → le Gateway a répondu, mais ce client a encore besoin d’appairage/approbation avant l’accès opérateur normal.
- texte d’avertissement SecretRef `gateway.auth.*` / `gateway.remote.*` non résolu → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Connexe :

- [Gateway](/fr/cli/gateway)
- [Plusieurs Gateways sur le même hôte](/fr/gateway#multiple-gateways-same-host)
- [Accès distant](/fr/gateway/remote)

## Canal connecté, messages non transmis

Si l’état du canal est connecté mais que le flux de messages est interrompu, concentrez-vous sur la politique, les autorisations et les règles de livraison propres au canal.

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
- Autorisations/périmètres d’API de canal manquants.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- `pairing` / traces d’approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/autorisations du canal.

Connexe :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Discord](/fr/channels/discord)
- [Telegram](/fr/channels/telegram)
- [WhatsApp](/fr/channels/whatsapp)

## Livraison de Cron et Heartbeat

Si Cron ou Heartbeat ne s’est pas exécuté ou n’a pas livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Recherchez :

- Cron activé et prochain réveil présent.
- État de l’historique d’exécution de la tâche (`ok`, `skipped`, `error`).
- Raisons d’omission de Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
    - `cron: timer tick failed` → échec du tick du planificateur ; vérifiez les erreurs de fichier/journal/runtime.
    - `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la fenêtre d’heures actives.
    - `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes Markdown, donc OpenClaw ignore l’appel au modèle.
    - `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due à ce tick.
    - `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de livraison Heartbeat.
    - `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat se résout en une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou une surcharge par agent) est défini sur `block`.

  </Accordion>
</AccordionGroup>

Connexe :

- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting)

## Node appairé, échec de l’outil

Si un Node est appairé mais que les outils échouent, isolez l’état de premier plan, d’autorisation et d’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Recherchez :

- Node en ligne avec les capacités attendues.
- Autorisations du système d’exploitation pour caméra/micro/localisation/écran.
- Approbations exec et état de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation du système d’exploitation manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation exec en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Connexe :

- [Approbations exec](/fr/tools/exec-approvals)
- [Dépannage des Nodes](/fr/nodes/troubleshooting)
- [Nodes](/fr/nodes/index)

## Échec de l’outil navigateur

Utilisez cette section lorsque les actions de l’outil navigateur échouent alors que le Gateway lui-même est sain.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Recherchez :

- Si `plugins.allow` est défini et inclut `browser`.
- Chemin d’exécutable de navigateur valide.
- Accessibilité du profil CDP.
- Disponibilité de Chrome local pour les profils `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` ou `unknown command 'browser'` → le Plugin de navigateur fourni est exclu par `plugins.allow`.
    - outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le Plugin ne s’est jamais chargé.
    - `Failed to start Chrome CDP on port` → échec du lancement du processus navigateur.
    - `browser.executablePath not found` → le chemin configuré est invalide.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge comme `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port incorrect ou hors plage.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle du Gateway ne dispose pas de la dépendance runtime principale du navigateur ; réinstallez ou mettez à jour OpenClaw, puis redémarrez le Gateway. Les instantanés ARIA et les captures d’écran de page basiques peuvent toujours fonctionner, mais la navigation, les instantanés IA, les captures d’éléments par sélecteur CSS et l’export PDF restent indisponibles.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP `existing-session` n’a pas encore pu s’attacher au répertoire de données du navigateur sélectionné. Ouvrez la page d’inspection du navigateur, activez le débogage à distance, gardez le navigateur ouvert, approuvez la première invite d’attachement, puis réessayez. Si l’état connecté n’est pas requis, préférez le profil `openclaw` géré.
    - `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
    - `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte du Gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil en attachement seul n’a pas de cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → la demande de capture d’écran a combiné `--full-page` avec `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou une `--ref` d’instantané, pas un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des refs d’instantané, pas des sélecteurs CSS.
    - `existing-session file uploads currently support one file at a time.` → envoyez un téléversement par appel sur les profils Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → les hooks de dialogue sur les profils Chrome MCP ne prennent pas en charge les surcharges de délai.
    - `existing-session type does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:type` sur les profils `profile="user"` / Chrome MCP `existing-session`, ou utilisez un profil de navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `existing-session evaluate does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:evaluate` sur les profils `profile="user"` / Chrome MCP `existing-session`, ou utilisez un profil de navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite toujours un navigateur géré ou un profil CDP brut.
    - surcharges obsolètes de viewport / mode sombre / locale / hors ligne sur les profils en attachement seul ou CDP distant → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer tout le Gateway.

  </Accordion>
</AccordionGroup>

Connexe :

- [Navigateur (géré par OpenClaw)](/fr/tools/browser)
- [Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting)

## Si vous avez effectué une mise à niveau et que quelque chose s’est soudainement cassé

La plupart des ruptures après mise à niveau sont dues à une dérive de configuration ou à des valeurs par défaut plus strictes désormais appliquées.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    À vérifier :

    - Si `gateway.mode=remote`, les appels CLI peuvent cibler le distant alors que votre service local fonctionne correctement.
    - Les appels explicites avec `--url` ne se rabattent pas sur les identifiants stockés.

    Signatures courantes :

    - `gateway connect failed:` → mauvaise cible d’URL.
    - `unauthorized` → point de terminaison accessible mais mauvaise authentification.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    À vérifier :

    - Les liaisons non-local loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification Gateway valide : authentification par jeton partagé/mot de passe, ou déploiement `trusted-proxy` non-local loopback correctement configuré.
    - Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

    Signatures courantes :

    - `refusing to bind gateway ... without auth` → liaison non-local loopback sans chemin d’authentification Gateway valide.
    - `Connectivity probe: failed` alors que le runtime est en cours d’exécution → Gateway actif mais inaccessible avec l’authentification/l’URL actuelles.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    À vérifier :

    - Approbations d’appareils en attente pour tableau de bord/Nodes.
    - Approbations d’appairage DM en attente après des changements de politique ou d’identité.

    Signatures courantes :

    - `device identity required` → authentification de l’appareil non satisfaite.
    - `pairing required` → l’expéditeur/appareil doit être approuvé.

  </Accordion>
</AccordionGroup>

Si la configuration du service et le runtime divergent toujours après les vérifications, réinstallez les métadonnées du service depuis le même répertoire de profil/état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Connexe :

- [Authentification](/fr/gateway/authentication)
- [Exec en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Appairage détenu par le Gateway](/fr/gateway/pairing)

## Connexe

- [Doctor](/fr/gateway/doctor)
- [FAQ](/fr/help/faq)
- [Runbook du Gateway](/fr/gateway)
