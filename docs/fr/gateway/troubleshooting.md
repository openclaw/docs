---
read_when:
    - Le hub de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de runbook stables, basées sur les symptômes, avec des commandes exactes
sidebarTitle: Troubleshooting
summary: Runbook de dépannage approfondi pour la gateway, les canaux, l’automatisation, les nœuds et Browser
title: Dépannage
x-i18n:
    generated_at: "2026-04-26T11:31:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Cette page est le runbook approfondi. Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous voulez d’abord le flux de triage rapide.

## Échelle de commandes

Exécutez d’abord celles-ci, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus d’un état sain :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration/service.
- `openclaw channels status --probe` affiche l’état live du transport par compte et, lorsque pris en charge, des résultats de sonde/audit comme `works` ou `audit ok`.

## Installations split brain et garde de configuration plus récente

Utilisez ceci lorsqu’un service gateway s’arrête de manière inattendue après une mise à jour, ou lorsque les journaux montrent qu’un binaire `openclaw` est plus ancien que la version qui a écrit `openclaw.json` en dernier.

OpenClaw marque les écritures de configuration avec `meta.lastTouchedVersion`. Les commandes en lecture seule peuvent toujours inspecter une configuration écrite par un OpenClaw plus récent, mais les mutations de processus et de service refusent de continuer depuis un binaire plus ancien. Les actions bloquées incluent le démarrage, l’arrêt, le redémarrage et la désinstallation du service gateway, la réinstallation forcée du service, le démarrage gateway en mode service et le nettoyage de port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corriger PATH">
    Corrigez `PATH` pour que `openclaw` se résolve vers l’installation la plus récente, puis relancez l’action.
  </Step>
  <Step title="Réinstaller le service gateway">
    Réinstallez le service gateway voulu depuis l’installation la plus récente :

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Supprimer les wrappers obsolètes">
    Supprimez les anciennes entrées de package système ou de wrapper qui pointent encore vers un ancien binaire `openclaw`.
  </Step>
</Steps>

<Warning>
Pour un rétrogradage intentionnel ou une récupération d’urgence uniquement, définissez `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` pour la commande unique. Laissez-le non défini en fonctionnement normal.
</Warning>

## Anthropic 429 extra usage required for long context

Utilisez ceci lorsque les journaux/erreurs incluent : `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

À rechercher :

- Le modèle Anthropic Opus/Sonnet sélectionné a `params.context1m: true`.
- L’identifiant d’accès Anthropic actuel n’est pas éligible à l’usage long contexte.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin bêta 1M.

Options de correction :

<Steps>
  <Step title="Désactiver context1m">
    Désactivez `context1m` pour ce modèle afin de revenir à la fenêtre de contexte normale.
  </Step>
  <Step title="Utiliser un identifiant d’accès éligible">
    Utilisez un identifiant d’accès Anthropic éligible aux requêtes long contexte, ou basculez vers une clé API Anthropic.
  </Step>
  <Step title="Configurer des modèles de secours">
    Configurez des modèles de secours afin que les exécutions continuent lorsque les requêtes Anthropic long contexte sont rejetées.
  </Step>
</Steps>

Lié :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Pourquoi est-ce que je vois HTTP 429 d’Anthropic ?](/fr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend local compatible OpenAI réussit les sondes directes mais les exécutions d’agent échouent

Utilisez ceci lorsque :

- `curl ... /v1/models` fonctionne
- de petits appels directs à `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent uniquement sur des tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

À rechercher :

- les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur des prompts plus gros
- des erreurs backend indiquant que `messages[].content` attend une chaîne
- des plantages backend n’apparaissant qu’avec de plus grands nombres de tokens de prompt ou des prompts complets de runtime d’agent

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `messages[...].content: invalid type: sequence, expected a string` → le backend rejette les parties structurées de contenu Chat Completions. Correctif : définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages backend/modèle (par exemple Gemma sur certains builds `inferrs`) → le transport OpenClaw est probablement déjà correct ; c’est le backend qui échoue sur la forme de prompt plus large du runtime d’agent.
    - les échecs diminuent après désactivation des outils mais ne disparaissent pas → les schémas d’outils faisaient partie de la pression, mais le problème restant est toujours une capacité amont du modèle/serveur ou un bug backend.

  </Accordion>
  <Accordion title="Options de correction">
    1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions n’acceptant que des chaînes.
    2. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer de manière fiable la surface de schéma d’outils d’OpenClaw.
    3. Réduisez si possible la pression du prompt : bootstrap d’espace de travail plus petit, historique de session plus court, modèle local plus léger ou backend avec un meilleur support du long contexte.
    4. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours dans le backend, traitez cela comme une limitation du serveur/modèle amont et déposez-y une reproduction avec la forme de charge utile acceptée.
  </Accordion>
</AccordionGroup>

Lié :

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

À rechercher :

- Appairage en attente pour les expéditeurs DM.
- Filtrage des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incohérences d’allowlist de canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur doit être approuvé.
- `blocked` / `allowlist` → l’expéditeur/canal a été filtré par la politique.

Lié :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Groupes](/fr/channels/groups)
- [Appairage](/fr/channels/pairing)

## Connectivité de l’interface Dashboard Control UI

Lorsque le dashboard/control UI ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

À rechercher :

- URL de sonde correcte et URL de dashboard correcte.
- Incohérence du mode/token d’authentification entre le client et la gateway.
- Utilisation HTTP là où une identité d’appareil est requise.

<AccordionGroup>
  <Accordion title="Signatures de connexion / authentification">
    - `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
    - `origin not allowed` → l’`Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins` (ou vous vous connectez depuis une origine navigateur non loopback sans allowlist explicite).
    - `device nonce required` / `device nonce mismatch` → le client n’achève pas le flux d’authentification d’appareil basé sur challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → le client a signé la mauvaise charge utile (ou un horodatage obsolète) pour la poignée de main actuelle.
    - `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut faire une tentative fiable avec le token d’appareil en cache.
    - Cette tentative avec token en cache réutilise l’ensemble de périmètres stocké avec le token d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent à la place leur ensemble de périmètres demandé.
    - En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est d’abord le token/mot de passe partagé explicite, puis `deviceToken` explicite, puis le token d’appareil stocké, puis le token bootstrap.
    - Sur le chemin async Tailscale Serve Control UI, les tentatives échouées pour le même `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes depuis le même client peuvent donc afficher `retry later` à la deuxième tentative au lieu de deux simples incohérences.
    - `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur → des échecs répétés depuis cette même `Origin` normalisée sont temporairement verrouillés ; une autre origine localhost utilise un compartiment distinct.
    - `unauthorized` répété après cette tentative → dérive du token partagé/token d’appareil ; rafraîchissez la configuration du token et réapprouvez/faites tourner le token d’appareil si nécessaire.
    - `gateway connect failed:` → mauvaise cible hôte/port/url.

  </Accordion>
</AccordionGroup>

### Carte rapide des codes détaillés d’authentification

Utilisez `error.details.code` depuis la réponse `connect` échouée pour choisir l’action suivante :

| Code détaillé               | Signification                                                                                                                                                                                 | Action recommandée                                                                                                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Le client n’a pas envoyé le token partagé requis.                                                                                                                                             | Collez/définissez le token dans le client et réessayez. Pour les chemins dashboard : `openclaw config get gateway.auth.token` puis collez-le dans les paramètres de Control UI.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`       | Le token partagé ne correspond pas au token d’authentification de la gateway.                                                                                                                 | Si `canRetryWithDeviceToken=true`, autorisez une tentative fiable. Les tentatives avec token en cache réutilisent les périmètres approuvés stockés ; les appelants avec `deviceToken` / `scopes` explicites conservent les périmètres demandés. En cas d’échec persistant, exécutez la [checklist de récupération de dérive de token](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le token par appareil en cache est obsolète ou révoqué.                                                                                                                                      | Faites tourner/réapprouvez le token d’appareil en utilisant le [CLI devices](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                     |
| `PAIRING_REQUIRED`          | L’identité de l’appareil doit être approuvée. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` quand présents. | Approuvez la demande en attente : `openclaw devices list` puis `openclaw devices approve <requestId>`. Les mises à niveau de périmètre/rôle utilisent le même flux après examen de l’accès demandé.                                                                                 |

<Note>
Les RPC backend directs loopback authentifiés avec le token/mot de passe partagé de la gateway ne doivent pas dépendre de la base de périmètre de l’appareil appairé du CLI. Si des sous-agents ou d’autres appels internes échouent encore avec `scope-upgrade`, vérifiez que l’appelant utilise `client.id: "gateway-client"` et `client.mode: "backend"` et ne force pas un `deviceIdentity` explicite ni un token d’appareil.
</Note>

Vérification de migration device auth v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux montrent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez-le :

<Steps>
  <Step title="Attendre connect.challenge">
    Le client attend le `connect.challenge` émis par la gateway.
  </Step>
  <Step title="Signer la charge utile">
    Le client signe la charge utile liée au challenge.
  </Step>
  <Step title="Envoyer le nonce d’appareil">
    Le client envoie `connect.params.device.nonce` avec le même nonce de challenge.
  </Step>
</Steps>

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- les sessions avec token d’appareil appairé ne peuvent gérer **que leur propre** appareil à moins que l’appelant possède aussi `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que des périmètres opérateur que la session appelante possède déjà

Lié :

- [Configuration](/fr/gateway/configuration) (modes d’authentification gateway)
- [Control UI](/fr/web/control-ui)
- [Devices](/fr/cli/devices)
- [Accès distant](/fr/gateway/remote)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)

## Service Gateway non en cours d’exécution

Utilisez ceci lorsque le service est installé mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analyse aussi les services au niveau système
```

À rechercher :

- `Runtime: stopped` avec des indices de sortie.
- Incohérence de configuration de service (`Config (cli)` vs `Config (service)`).
- Conflits de port/écoute.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Conseils de nettoyage `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou relancez `openclaw onboard --mode local` / `openclaw setup` pour réappliquer la configuration attendue en mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → liaison non loopback sans chemin d’authentification gateway valide (token/mot de passe, ou proxy de confiance lorsqu’il est configuré).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
    - `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations doivent garder une seule gateway par machine ; si vous avez besoin de plus d’une, isolez ports + config/état/espace de travail. Voir [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

Lié :

- [Exec en arrière-plan et outil process](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Doctor](/fr/gateway/doctor)

## La Gateway a restauré la dernière configuration valide

Utilisez ceci lorsque la Gateway démarre, mais que les journaux indiquent qu’elle a restauré `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

À rechercher :

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un fichier horodaté `openclaw.json.clobbered.*` à côté de la configuration active
- Un événement système de l’agent principal qui commence par `Config recovery warning`

<AccordionGroup>
  <Accordion title="Ce qui s’est passé">
    - La configuration rejetée n’a pas passé la validation au démarrage ou au hot reload.
    - OpenClaw a conservé la charge utile rejetée sous forme de `.clobbered.*`.
    - La configuration active a été restaurée depuis la dernière copie validée connue comme bonne.
    - Le prochain tour de l’agent principal reçoit un avertissement de ne pas réécrire aveuglément la configuration rejetée.
    - Si tous les problèmes de validation étaient sous `plugins.entries.<id>...`, OpenClaw ne restaurerait pas tout le fichier. Les échecs locaux au plugin restent visibles tandis que les paramètres utilisateur non liés restent dans la configuration active.

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
    - `.rejected.*` existe → une écriture de configuration appartenant à OpenClaw a échoué aux vérifications de schéma ou de clobber avant validation.
    - `Config write rejected:` → l’écriture a tenté de supprimer une forme requise, de réduire brutalement la taille du fichier ou de persister une configuration invalide.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → le démarrage a considéré le fichier courant comme clobbered car il a perdu des champs ou de la taille par rapport à la dernière sauvegarde connue comme bonne.
    - `Config last-known-good promotion skipped` → le candidat contenait des placeholders de secret expurgés tels que `***`.

  </Accordion>
  <Accordion title="Options de correction">
    1. Gardez la configuration active restaurée si elle est correcte.
    2. Copiez uniquement les clés voulues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
    3. Exécutez `openclaw config validate` avant de redémarrer.
    4. Si vous modifiez à la main, conservez toute la configuration JSON5, et pas seulement l’objet partiel que vous vouliez changer.
  </Accordion>
</AccordionGroup>

Lié :

- [Config](/fr/cli/config)
- [Configuration : hot reload](/fr/gateway/configuration#config-hot-reload)
- [Configuration : validation stricte](/fr/gateway/configuration#strict-validation)
- [Doctor](/fr/gateway/doctor)

## Avertissements de sonde Gateway

Utilisez ceci lorsque `openclaw gateway probe` atteint quelque chose, mais affiche quand même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

À rechercher :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne un secours SSH, plusieurs gateways, des périmètres manquants ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a quand même essayé les cibles configurées/loopback directes.
- `multiple reachable gateways detected` → plus d’une cible a répondu. Cela indique généralement une configuration multi-gateway intentionnelle ou des écouteurs obsolètes/dupliqués.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a réussi, mais le RPC de détail est limité par les périmètres ; appairez l’identité de l’appareil ou utilisez des identifiants d’accès avec `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → la gateway a répondu, mais ce client nécessite encore un appairage/une approbation avant un accès opérateur normal.
- texte d’avertissement SecretRef non résolu `gateway.auth.*` / `gateway.remote.*` → le matériel d’authentification était indisponible dans ce chemin de commande pour la cible en échec.

Lié :

- [Gateway](/fr/cli/gateway)
- [Plusieurs gateways sur le même hôte](/fr/gateway#multiple-gateways-same-host)
- [Accès distant](/fr/gateway/remote)

## Canal connecté, mais les messages ne circulent pas

Si l’état du canal est connecté mais que le flux de messages est mort, concentrez-vous sur la politique, les permissions et les règles de livraison propres au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

À rechercher :

- Politique DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist de groupe et exigences de mention.
- Permissions/périmètres API de canal manquants.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- traces `pairing` / approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/permissions du canal.

Lié :

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

À rechercher :

- Cron activé et prochaine activation présente.
- État de l’historique d’exécution de tâche (`ok`, `skipped`, `error`).
- Raisons de saut Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
    - `cron: timer tick failed` → l’impulsion du planificateur a échoué ; vérifiez les erreurs de fichier/journal/runtime.
    - `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la fenêtre d’heures actives.
    - `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient que des lignes vides / en-têtes markdown, donc OpenClaw ignore l’appel au modèle.
    - `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due à cette impulsion.
    - `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de livraison Heartbeat.
    - `heartbeat skipped` avec `reason=dm-blocked` → la cible Heartbeat s’est résolue vers une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou le remplacement par agent) est défini sur `block`.

  </Accordion>
</AccordionGroup>

Lié :

- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting)

## Nœud appairé, l’outil échoue

Si un nœud est appairé mais que les outils échouent, isolez l’état de premier plan, des permissions et de l’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

À rechercher :

- Nœud en ligne avec les capacités attendues.
- Permissions OS accordées pour caméra/micro/localisation/écran.
- Approbations exec et état de l’allowlist.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application nœud doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permission OS manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation exec en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par l’allowlist.

Lié :

- [Approbations exec](/fr/tools/exec-approvals)
- [Dépannage des nœuds](/fr/nodes/troubleshooting)
- [Nodes](/fr/nodes/index)

## L’outil Browser échoue

Utilisez ceci lorsque les actions de l’outil Browser échouent alors même que la gateway est saine.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

À rechercher :

- Si `plugins.allow` est défini et inclut `browser`.
- Chemin exécutable navigateur valide.
- Accessibilité du profil CDP.
- Disponibilité de Chrome local pour les profils `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Signatures plugin / exécutable">
    - `unknown command "browser"` ou `unknown command 'browser'` → le plugin navigateur intégré est exclu par `plugins.allow`.
    - outil Browser manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le plugin n’a jamais été chargé.
    - `Failed to start Chrome CDP on port` → le processus navigateur n’a pas pu démarrer.
    - `browser.executablePath not found` → le chemin configuré est invalide.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge tel que `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port invalide ou hors plage.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle de la gateway n’a pas la dépendance d’exécution `playwright-core` du plugin navigateur intégré ; exécutez `openclaw doctor --fix`, puis redémarrez la gateway. Les instantanés ARIA et les captures d’écran de page basiques peuvent toujours fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments via sélecteur CSS et l’export PDF restent indisponibles.

  </Accordion>
  <Accordion title="Signatures Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session n’a pas encore pu s’attacher au répertoire de données navigateur sélectionné. Ouvrez la page inspect du navigateur, activez le débogage à distance, gardez le navigateur ouvert, approuvez la première invite d’attachement, puis réessayez. Si l’état connecté n’est pas nécessaire, préférez le profil géré `openclaw`.
    - `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
    - `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a pas de cible accessible, ou le point de terminaison HTTP a répondu mais le WebSocket CDP n’a toujours pas pu être ouvert.

  </Accordion>
  <Accordion title="Signatures élément / capture d’écran / téléversement">
    - `fullPage is not supported for element screenshots` → la demande de capture d’écran mélangeait `--full-page` avec `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser une capture de page ou un `--ref` d’instantané, pas un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des refs d’instantané, pas des sélecteurs CSS.
    - `existing-session file uploads currently support one file at a time.` → envoyez un téléversement par appel sur les profils Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → les hooks de boîte de dialogue sur les profils Chrome MCP ne prennent pas en charge les remplacements de délai.
    - `existing-session type does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:type` sur `profile="user"` / les profils Chrome MCP existing-session, ou utilisez un profil navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `existing-session evaluate does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:evaluate` sur `profile="user"` / les profils Chrome MCP existing-session, ou utilisez un profil navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite encore un navigateur géré ou un profil CDP brut.
    - remplacements obsolètes de viewport / dark-mode / locale / offline sur des profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer toute la gateway.

  </Accordion>
</AccordionGroup>

Lié :

- [Browser (géré par OpenClaw)](/fr/tools/browser)
- [Dépannage Browser](/fr/tools/browser-linux-troubleshooting)

## Si vous avez mis à niveau et que quelque chose s’est soudainement cassé

La plupart des casses après mise à niveau viennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

<AccordionGroup>
  <Accordion title="1. Le comportement de remplacement d’authentification et d’URL a changé">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Ce qu’il faut vérifier :

    - Si `gateway.mode=remote`, les appels CLI peuvent viser le distant alors que votre service local fonctionne très bien.
    - Les appels explicites `--url` ne se rabattent pas sur les identifiants d’accès enregistrés.

    Signatures courantes :

    - `gateway connect failed:` → mauvaise cible URL.
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

    Ce qu’il faut vérifier :

    - Les liaisons non loopback (`lan`, `tailnet`, `custom`) ont besoin d’un chemin d’authentification gateway valide : authentification par token/mot de passe partagé, ou déploiement `trusted-proxy` non loopback correctement configuré.
    - Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

    Signatures courantes :

    - `refusing to bind gateway ... without auth` → liaison non loopback sans chemin d’authentification gateway valide.
    - `Connectivity probe: failed` alors que le runtime est actif → gateway vivante mais inaccessible avec l’authentification/l’URL actuelles.

  </Accordion>
  <Accordion title="3. L’état d’appairage et d’identité d’appareil a changé">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Ce qu’il faut vérifier :

    - Approbations d’appareil en attente pour dashboard/nodes.
    - Approbations d’appairage DM en attente après changement de politique ou d’identité.

    Signatures courantes :

    - `device identity required` → authentification d’appareil non satisfaite.
    - `pairing required` → l’expéditeur/l’appareil doit être approuvé.

  </Accordion>
</AccordionGroup>

Si la configuration du service et le runtime ne concordent toujours pas après les vérifications, réinstallez les métadonnées du service depuis le même répertoire de profil/d’état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Lié :

- [Authentification](/fr/gateway/authentication)
- [Exec en arrière-plan et outil process](/fr/gateway/background-process)
- [Appairage géré par Gateway](/fr/gateway/pairing)

## Lié

- [Doctor](/fr/gateway/doctor)
- [FAQ](/fr/help/faq)
- [Runbook Gateway](/fr/gateway)
