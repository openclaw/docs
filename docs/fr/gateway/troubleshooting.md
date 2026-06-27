---
read_when:
    - Le centre de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de procédure d’exploitation stables, basées sur les symptômes, avec les commandes exactes
sidebarTitle: Troubleshooting
summary: Runbook de dépannage approfondi pour Gateway, les canaux, l’automatisation, les nœuds et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-06-27T17:34:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Cette page est le runbook approfondi. Commencez par [/help/troubleshooting](/fr/help/troubleshooting) si vous voulez d’abord le flux de triage rapide.

## Échelle de commandes

Exécutez-les d’abord, dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux attendus en bon état :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration ou de service.
- `openclaw channels status --probe` affiche l’état de transport en direct par compte et, lorsque c’est pris en charge, les résultats de sonde/audit tels que `works` ou `audit ok`.

## Après une mise à jour

Utilisez ceci lorsqu’une mise à jour se termine mais que le Gateway est arrêté, que les canaux sont vides ou que
les appels de modèle commencent à échouer avec des 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Recherchez :

- `Update restart` dans `openclaw status` / `openclaw status --all`. Les transferts en attente ou
  échoués incluent la prochaine commande à exécuter.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  sous Canaux. Cela signifie que la configuration du canal existe toujours, mais que
  l’enregistrement du Plugin a échoué avant que le canal puisse se charger.
- Des 401 de fournisseur après une nouvelle authentification. `openclaw doctor --fix` vérifie les
  anciennes copies d’auth OAuth par agent et les supprime afin que tous les agents résolvent
  le profil partagé actuel.

## Installations split brain et garde de configuration plus récente

Utilisez ceci lorsqu’un service de gateway s’arrête de manière inattendue après une mise à jour, ou lorsque les journaux indiquent qu’un binaire `openclaw` est plus ancien que la version qui a écrit `openclaw.json` en dernier.

OpenClaw marque les écritures de configuration avec `meta.lastTouchedVersion`. Les commandes en lecture seule peuvent toujours inspecter une configuration écrite par un OpenClaw plus récent, mais les mutations de processus et de service refusent de continuer depuis un binaire plus ancien. Les actions bloquées incluent le démarrage, l’arrêt, le redémarrage, la désinstallation du service gateway, la réinstallation forcée du service, le démarrage du gateway en mode service et le nettoyage de port `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Corrigez `PATH` afin que `openclaw` pointe vers l’installation la plus récente, puis relancez l’action.
  </Step>
  <Step title="Reinstall the gateway service">
    Réinstallez le service gateway prévu depuis l’installation la plus récente :

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Supprimez les entrées obsolètes de paquet système ou d’ancien wrapper qui pointent encore vers un ancien binaire `openclaw`.
  </Step>
</Steps>

<Warning>
Pour une rétrogradation intentionnelle ou une récupération d’urgence uniquement, définissez `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` pour la commande unique. Laissez-la non définie pour un fonctionnement normal.
</Warning>

## Incompatibilité de protocole après rollback

Utilisez ceci lorsque les journaux continuent d’afficher `protocol mismatch` après une rétrogradation ou un retour arrière d’OpenClaw. Cela signifie qu’un ancien Gateway est en cours d’exécution, mais qu’un processus client local plus récent tente encore de se reconnecter avec une plage de protocoles que l’ancien Gateway ne sait pas gérer.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Recherchez :

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` dans les journaux du Gateway.
- `Established clients:` dans `openclaw gateway status --deep` ou `Gateway clients` dans `openclaw doctor --deep`. Cela liste les clients TCP actifs connectés au port du Gateway, y compris les PID et les lignes de commande lorsque le système d’exploitation le permet.
- Un processus client dont la ligne de commande pointe vers l’installation ou le wrapper OpenClaw plus récent depuis lequel vous avez effectué le rollback.

Correction :

1. Arrêtez ou redémarrez le processus client OpenClaw obsolète indiqué par `gateway status --deep`.
2. Redémarrez les applications ou wrappers qui intègrent OpenClaw, comme les tableaux de bord locaux, les éditeurs, les assistants de serveur d’application ou les shells `openclaw logs --follow` de longue durée.
3. Relancez `openclaw gateway status --deep` ou `openclaw doctor --deep` et confirmez que le PID client obsolète a disparu.

Ne faites pas accepter à un ancien Gateway un protocole plus récent incompatible. Les montées de version du protocole protègent le contrat filaire ; la récupération après rollback est un problème de nettoyage de processus/version.

## Lien symbolique de Skill ignoré comme échappement de chemin

Utilisez ceci lorsque les journaux incluent :

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw traite chaque racine de skill comme une frontière de confinement. Un lien symbolique sous
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` ou
`~/.openclaw/skills` est ignoré lorsque sa cible réelle se résout en dehors de cette racine,
sauf si la cible est explicitement approuvée.

Inspectez le lien :

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Si la cible est intentionnelle, configurez à la fois la racine directe du skill et la
cible de lien symbolique autorisée :

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Démarrez ensuite une nouvelle session ou attendez que l’observateur de Skills se rafraîchisse. Redémarrez le
gateway si le processus en cours est antérieur au changement de configuration.

N’utilisez pas de cibles larges comme `~`, `/` ou un dossier de projet synchronisé entier.
Gardez `allowSymlinkTargets` limité à la racine réelle de skills qui contient les répertoires
`SKILL.md` approuvés.

Si Skill Workshop apply doit aussi écrire via ces chemins de skills d’espace de travail liés symboliquement
et approuvés, activez `skills.workshop.allowSymlinkTargetWrites`. Gardez-le
désactivé pour les racines de skills partagées en lecture seule.

Liens connexes :

- [Configuration des Skills](/fr/tools/skills-config#symlinked-skill-roots)
- [Exemples de configuration](/fr/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Utilisation supplémentaire Anthropic 429 requise pour un contexte long

Utilisez ceci lorsque les journaux/erreurs incluent : `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Recherchez :

- Le modèle Anthropic sélectionné est un modèle Claude 4.x 1M compatible GA, ou le modèle a l’ancien `params.context1m: true`.
- L’identifiant Anthropic actuel n’est pas éligible à l’utilisation de contexte long.
- Les requêtes échouent uniquement sur les longues sessions/exécutions de modèle qui nécessitent le chemin de contexte 1M.

Options de correction :

<Steps>
  <Step title="Use a standard context window">
    Passez à un modèle avec fenêtre de contexte standard, ou supprimez l’ancien `context1m` de l’ancienne
    configuration de modèle qui n’est pas compatible GA pour le contexte 1M.
  </Step>
  <Step title="Use an eligible credential">
    Utilisez un identifiant Anthropic éligible aux requêtes de contexte long, ou passez à une clé API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Configurez des modèles de secours afin que les exécutions continuent lorsque les requêtes Anthropic à contexte long sont rejetées.
  </Step>
</Steps>

Liens connexes :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Pourquoi vois-je HTTP 429 depuis Anthropic ?](/fr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Réponses 403 bloquées en amont

Utilisez ceci lorsqu’un fournisseur LLM en amont renvoie un `403` générique tel que
`Your request was blocked`.

Ne supposez pas qu’il s’agit toujours d’un problème de configuration OpenClaw. La réponse peut
provenir d’une couche de sécurité en amont comme un CDN, un WAF, une règle de gestion des bots ou
un proxy inverse devant un endpoint compatible OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Recherchez :

- plusieurs modèles sous le même fournisseur échouant de la même manière
- du HTML ou un texte de sécurité générique au lieu d’une erreur normale d’API fournisseur
- des événements de sécurité côté fournisseur au même moment que la requête
- une minuscule sonde directe `curl` qui réussit alors que les requêtes normales de forme SDK échouent

Corrigez d’abord le filtrage côté fournisseur lorsque les éléments indiquent un blocage
WAF/CDN. Préférez une règle d’autorisation ou d’exclusion à portée étroite pour le chemin d’API qu’OpenClaw
utilise, et évitez de désactiver la protection pour tout le site.

<Warning>
Un `curl` minimal réussi ne garantit pas que de vraies requêtes de style SDK
traverseront la même couche de sécurité en amont.
</Warning>

Liens connexes :

- [Endpoints compatibles OpenAI](/fr/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuration des fournisseurs](/fr/providers)
- [Journaux](/fr/logging)

## Le backend local compatible OpenAI réussit les sondes directes mais les exécutions d’agent échouent

Utilisez ceci lorsque :

- `curl ... /v1/models` fonctionne
- de minuscules appels directs `/v1/chat/completions` fonctionnent
- les exécutions de modèle OpenClaw échouent uniquement lors de tours d’agent normaux

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Recherchez :

- les minuscules appels directs réussissent, mais les exécutions OpenClaw échouent uniquement sur des prompts plus grands
- des erreurs `model_not_found` ou 404 alors que l’appel direct `/v1/chat/completions`
  fonctionne avec le même identifiant de modèle nu
- des erreurs backend indiquant que `messages[].content` attend une chaîne
- des avertissements intermittents `incomplete turn detected ... stopReason=stop payloads=0` avec un backend local compatible OpenAI
- des plantages backend qui apparaissent uniquement avec des nombres de tokens de prompt plus élevés ou des prompts complets du runtime d’agent

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` avec un serveur local de style MLX/vLLM → vérifiez que `baseUrl` inclut `/v1`, que `api` vaut `"openai-completions"` pour les backends `/v1/chat/completions`, et que `models.providers.<provider>.models[].id` est l’identifiant local nu du fournisseur. Sélectionnez-le avec le préfixe fournisseur une seule fois, par exemple `mlx/mlx-community/Qwen3-30B-A3B-6bit` ; gardez l’entrée de catalogue comme `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → le backend rejette les parties de contenu Chat Completions structurées. Correction : définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` ou des clés de message autorisées comme `["role","content"]` → le backend rejette les métadonnées de relecture de style OpenAI sur les messages Chat Completions. Correction : définissez `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → le backend a terminé la requête Chat Completions mais n’a renvoyé aucun texte assistant visible par l’utilisateur pour ce tour. OpenClaw réessaie une fois les tours vides compatibles OpenAI sûrs à rejouer ; les échecs persistants signifient généralement que le backend émet du contenu vide/non textuel ou supprime le texte de réponse finale.
    - les minuscules requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent avec des plantages backend/modèle (par exemple Gemma sur certaines versions `inferrs`) → le transport OpenClaw est probablement déjà correct ; le backend échoue sur la forme plus grande du prompt de runtime d’agent.
    - les échecs diminuent après la désactivation des outils mais ne disparaissent pas → les schémas d’outils faisaient partie de la pression, mais le problème restant reste une capacité de modèle/serveur en amont ou un bogue backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions n’acceptant que les chaînes.
    2. Définissez `compat.strictMessageKeys: true` pour les backends Chat Completions stricts qui n’acceptent que `role` et `content` sur chaque message.
    3. Définissez `compat.supportsTools: false` pour les modèles/backends qui ne peuvent pas gérer de manière fiable la surface de schéma d’outils d’OpenClaw.
    4. Réduisez la pression du prompt lorsque c’est possible : amorçage d’espace de travail plus petit, historique de session plus court, modèle local plus léger ou backend avec une meilleure prise en charge du contexte long.
    5. Si les minuscules requêtes directes continuent de réussir alors que les tours d’agent OpenClaw plantent toujours dans le backend, traitez cela comme une limitation du serveur/modèle en amont et ouvrez-y une reproduction avec la forme de payload acceptée.
  </Accordion>
</AccordionGroup>

Liens connexes :

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

- Appairage en attente pour les expéditeurs de messages privés.
- Filtrage des mentions de groupe (`requireMention`, `mentionPatterns`).
- Incompatibilités de liste d’autorisation de canal/groupe.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à mention.
- `pairing request` → l’expéditeur doit être approuvé.
- `blocked` / `allowlist` → l’expéditeur/le canal a été filtré par la politique.

Connexe :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Groupes](/fr/channels/groups)
- [Appairage](/fr/channels/pairing)

## Connectivité de l’interface de contrôle du tableau de bord

Lorsque le tableau de bord/l’interface de contrôle ne se connecte pas, validez l’URL, le mode d’authentification et les hypothèses de contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Recherchez :

- URL de sonde et URL du tableau de bord correctes.
- Incompatibilité de mode d’authentification/jeton entre le client et le Gateway.
- Utilisation de HTTP quand l’identité de l’appareil est requise.

Si un navigateur local ne peut pas se connecter à `127.0.0.1:18789` après une mise à jour, commencez par
rétablir le service Gateway local et confirmez qu’il sert le tableau de bord :

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Si `curl` renvoie du HTML OpenClaw, le Gateway fonctionne et le problème restant
est probablement le cache du navigateur, un ancien lien profond ou un état d’onglet obsolète. Ouvrez
`http://127.0.0.1:18789` directement et naviguez depuis le tableau de bord. Si le redémarrage
ne laisse pas le service en cours d’exécution, exécutez `openclaw gateway start` et revérifiez
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → contexte non sécurisé ou authentification d’appareil manquante.
    - `origin not allowed` → l’`Origin` du navigateur n’est pas dans `gateway.controlUi.allowedOrigins` (ou vous vous connectez depuis une origine de navigateur non loopback sans liste d’autorisation explicite).
    - `device nonce required` / `device nonce mismatch` → le client ne termine pas le flux d’authentification d’appareil basé sur le défi (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → le client a signé la mauvaise charge utile (ou un horodatage obsolète) pour la négociation actuelle.
    - `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une nouvelle tentative de confiance avec le jeton d’appareil mis en cache.
    - Cette nouvelle tentative avec jeton mis en cache réutilise l’ensemble des portées mises en cache stocké avec le jeton d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent plutôt leur ensemble de portées demandé.
    - `AUTH_SCOPE_MISMATCH` → le jeton d’appareil a été reconnu, mais ses portées approuvées ne couvrent pas cette demande de connexion ; réappairez ou approuvez le contrat de portée demandé au lieu de faire tourner un jeton Gateway partagé.
    - En dehors de ce chemin de nouvelle tentative, la priorité de l’authentification de connexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
    - Sur le chemin asynchrone de l’interface de contrôle Tailscale Serve, les tentatives échouées pour le même `{scope, ip}` sont sérialisées avant que le limiteur enregistre l’échec. Deux mauvaises nouvelles tentatives concurrentes depuis le même client peuvent donc afficher `retry later` à la deuxième tentative au lieu de deux simples incompatibilités.
    - `too many failed authentication attempts (retry later)` depuis un client loopback d’origine navigateur → des échecs répétés depuis cette même `Origin` normalisée sont temporairement verrouillés ; une autre origine localhost utilise un compartiment distinct.
    - `unauthorized` répété après cette nouvelle tentative → dérive du jeton partagé/jeton d’appareil ; actualisez la configuration du jeton et réapprouvez/faites tourner le jeton d’appareil si nécessaire.
    - `gateway connect failed:` → cible hôte/port/url incorrecte.

  </Accordion>
</AccordionGroup>

### Carte rapide des codes de détail d’authentification

Utilisez `error.details.code` de la réponse `connect` échouée pour choisir l’action suivante :

| Code de détail               | Signification                                                                                                                                                                               | Action recommandée                                                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé un jeton partagé requis.                                                                                                                                           | Collez/définissez le jeton dans le client et réessayez. Pour les chemins du tableau de bord : `openclaw config get gateway.auth.token`, puis collez-le dans les paramètres de l’interface de contrôle.                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspondait pas au jeton d’authentification du Gateway.                                                                                                                | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative de confiance. Les nouvelles tentatives avec jeton mis en cache réutilisent les portées approuvées stockées ; les appelants avec `deviceToken` / `scopes` explicites conservent les portées demandées. En cas d’échec persistant, exécutez la [liste de contrôle de récupération de dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton par appareil mis en cache est obsolète ou révoqué.                                                                                                                                  | Faites tourner/réapprouvez le jeton d’appareil avec la [CLI des appareils](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                         |
| `AUTH_SCOPE_MISMATCH`        | Le jeton d’appareil est valide, mais son rôle/ses portées approuvés ne couvrent pas cette demande de connexion.                                                                              | Réappairez l’appareil ou approuvez le contrat de portée demandé ; ne traitez pas cela comme une dérive du jeton partagé.                                                                                                                                                                  |
| `PAIRING_REQUIRED`           | L’identité de l’appareil doit être approuvée. Vérifiez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list`, puis `openclaw devices approve <requestId>`. Les mises à niveau de portée/rôle utilisent le même flux après examen de l’accès demandé.                                                                                       |

<Note>
Les RPC serveur loopback directs authentifiés avec le jeton/mot de passe Gateway partagé ne doivent pas dépendre de la référence de portée d’appareil appairé de la CLI. Si des sous-agents ou d’autres appels internes échouent encore avec `scope-upgrade`, vérifiez que l’appelant utilise `client.id: "gateway-client"` et `client.mode: "backend"` et ne force pas un `deviceIdentity` explicite ni un jeton d’appareil.
</Note>

Vérification de migration de l’authentification d’appareil v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez-le :

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

- les sessions de jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil, sauf si l’appelant dispose aussi de `operator.admin`
- `openclaw devices rotate --scope ...` ne peut demander que les portées d’opérateur que la session appelante possède déjà

Connexe :

- [Configuration](/fr/gateway/configuration) (modes d’authentification Gateway)
- [Interface de contrôle](/fr/web/control-ui)
- [Appareils](/fr/cli/devices)
- [Accès à distance](/fr/gateway/remote)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)

## Service Gateway non exécuté

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
- Incompatibilité de configuration du service (`Config (cli)` contre `Config (service)`).
- Conflits de port/écouteur.
- Installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Indices de nettoyage `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correctif : définissez `gateway.mode="local"` dans votre configuration, ou réexécutez `openclaw onboard --mode local` / `openclaw setup` pour réestampiller la configuration attendue en mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → liaison non loopback sans chemin d’authentification Gateway valide (jeton/mot de passe, ou proxy de confiance lorsque configuré).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
    - `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations doivent conserver un Gateway par machine ; si vous en avez besoin de plusieurs, isolez les ports + la configuration/l’état/l’espace de travail. Consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` depuis doctor → une unité système systemd existe alors que le service de niveau utilisateur est manquant. Supprimez ou désactivez le doublon avant d’autoriser doctor à installer un service utilisateur, ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` si l’unité système est le superviseur prévu.
    - `Gateway service port does not match current gateway config` → le superviseur installé fixe encore l’ancien `--port`. Exécutez `openclaw doctor --fix` ou `openclaw gateway install --force`, puis redémarrez le service Gateway.

  </Accordion>
</AccordionGroup>

Connexe :

- [Exécution en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Doctor](/fr/gateway/doctor)

## Le Gateway macOS cesse silencieusement de répondre, puis reprend lorsque vous touchez le tableau de bord

Utilisez ceci lorsque les canaux (Telegram, WhatsApp, etc.) sur un hôte macOS deviennent silencieux pendant des minutes ou des heures à la fois, et que le Gateway semble revenir au moment où vous ouvrez l’interface de contrôle, vous connectez en SSH ou interagissez autrement avec l’hôte. Il n’y a généralement aucun symptôme évident dans `openclaw status`, car au moment où vous regardez, le Gateway est de nouveau actif.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Recherchez :

- Un ou plusieurs bundles `*-uncaught_exception.json` dans `~/.openclaw/logs/stability/` avec `error.code` défini sur un code réseau transitoire comme `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` ou `ECONNREFUSED`.
- Des lignes `pmset -g log` comme `Entering Sleep state due to 'Maintenance Sleep'` ou `en0 driver is slow (msg: WillChangeState to 0)` alignées avec les horodatages des plantages. Power Nap / Maintenance Sleep place brièvement le pilote Wi-Fi dans l’état 0 ; tout `connect()` sortant qui tombe dans cette fenêtre peut échouer avec `ENETDOWN`, même sur un hôte qui dispose par ailleurs d’une connectivité réseau complète.
- Une sortie `launchctl print` affichant `state = not running` avec plusieurs `runs` récents et un code de sortie, surtout lorsque l’écart entre le plantage et le lancement suivant est de l’ordre d’une heure plutôt que de quelques secondes. Sur macOS, launchd applique une barrière non documentée de protection contre les redémarrages après une rafale de plantages, qui peut cesser d’honorer `KeepAlive=true` jusqu’à ce qu’un déclencheur externe comme une connexion interactive, une connexion au tableau de bord ou `launchctl kickstart` la réarme.

Signatures courantes :

- Un bundle de stabilité dont `error.code` est `ENETDOWN` ou un code apparenté, avec une pile d’appels pointant vers Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` et les versions plus récentes classent ces erreurs comme des erreurs réseau transitoires bénignes, afin qu’elles ne se propagent plus jusqu’au gestionnaire global d’exceptions non interceptées ; si vous utilisez une version plus ancienne, mettez d’abord à niveau.
- De longues périodes silencieuses qui prennent fin à l’instant où vous vous connectez à l’interface de contrôle ou en SSH à l’hôte : l’activité visible par l’utilisateur est ce qui réarme la barrière de redémarrage de launchd, pas une action du tableau de bord sur le Gateway.
- Le compteur `runs` augmente au cours de la journée sans ligne correspondante `received SIG*; shutting down` dans `~/Library/Logs/openclaw/gateway.log` : les arrêts propres journalisent un signal ; les plantages transitoires ne le font pas.

Que faire :

1. **Mettez à niveau le Gateway** si vous exécutez une version antérieure à `2026.5.26`. Après la mise à niveau, les futures erreurs `ENETDOWN` seront journalisées comme des avertissements au lieu de terminer le processus.
2. **Réduisez l’activité de veille de maintenance** sur les hôtes Mac mini / de bureau destinés à fonctionner comme serveurs toujours actifs :

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Cela réduit fortement, sans l’éliminer entièrement, l’instabilité sous-jacente du pilote. Le système peut toujours effectuer certaines veilles de maintenance pour l’entretien TCP keepalive et mDNS, indépendamment de ces options.

3. **Ajoutez un watchdog de disponibilité** afin qu’une future rafale de plantages immobilisée par launchd soit détectée rapidement :

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   L’objectif est de réarmer de l’extérieur la barrière de redémarrage ; `KeepAlive=true` seul ne suffit pas sur macOS après une rafale de plantages.

Associé :

- [Notes de plateforme macOS](/fr/platforms/macos)
- [Journalisation](/fr/logging)
- [Doctor](/fr/gateway/doctor)

## Le Gateway se ferme lors d’une forte utilisation mémoire

Utilisez ceci lorsque le Gateway disparaît sous charge, que le superviseur signale un redémarrage de type OOM, ou que les journaux mentionnent `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Recherchez :

- `Reason: diagnostic.memory.pressure.critical` dans le dernier bundle de stabilité.
- `Memory pressure:` avec `critical/rss_threshold`, `critical/heap_threshold` ou `critical/rss_growth`.
- Des valeurs `V8 heap:` proches de la limite du tas.
- Des entrées `Largest session files:` comme `agents/<agent>/sessions/<session>.jsonl` ou `sessions/<session>.jsonl`.
- Des compteurs mémoire cgroup Linux lorsque le Gateway s’exécute dans un conteneur ou un service à mémoire limitée.

Signatures courantes :

- `critical memory pressure bundle written` apparaît peu avant le redémarrage → OpenClaw a capturé un bundle de stabilité pré-OOM. Inspectez-le avec `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` apparaît dans les journaux du Gateway → OpenClaw a détecté une pression mémoire critique, mais l’instantané de stabilité pré-OOM est désactivé.
- `Largest session files:` pointe vers un très grand chemin de transcription expurgée → réduisez l’historique de session conservé, inspectez la croissance de la session, ou déplacez les anciennes transcriptions hors du magasin actif avant de redémarrer.
- Les octets utilisés `V8 heap:` sont proches de la limite du tas → réduisez la pression des prompts/sessions, réduisez le travail concurrent, ou augmentez la limite du tas Node seulement après avoir confirmé que la charge de travail est attendue.
- `Memory pressure: critical/rss_growth` → la mémoire a augmenté rapidement dans une même fenêtre d’échantillonnage. Vérifiez les derniers journaux pour une importation volumineuse, une sortie d’outil incontrôlée, des tentatives répétées, ou un lot de travaux d’agent en file d’attente.
- Une pression mémoire critique apparaît dans les journaux mais aucun bundle n’existe → c’est le comportement par défaut. Définissez `diagnostics.memoryPressureSnapshot: true` pour capturer le bundle de stabilité pré-OOM lors des futurs événements de pression mémoire critique.

Le bundle de stabilité ne contient aucune charge utile. Il inclut des preuves opérationnelles de mémoire et des chemins de fichiers relatifs expurgés, pas le texte des messages, les corps de webhook, les identifiants, les jetons, les cookies ni les identifiants de session bruts. Joignez l’export de diagnostics aux rapports de bug au lieu de copier les journaux bruts.

Associé :

- [Santé du Gateway](/fr/gateway/health)
- [Export de diagnostics](/fr/gateway/diagnostics)
- [Sessions](/fr/cli/sessions)

## Le Gateway a rejeté une config invalide

Utilisez ceci lorsque le démarrage du Gateway échoue avec `Invalid config` ou que les journaux de rechargement à chaud indiquent
qu’il a ignoré une modification invalide.

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
- Un fichier horodaté `openclaw.json.rejected.*` à côté de la config active
- Un fichier horodaté `openclaw.json.clobbered.*` si `doctor --fix` a réparé une modification directe cassée
- OpenClaw conserve les 32 derniers fichiers `.clobbered.*` pour chaque chemin de config et applique une rotation aux plus anciens

<AccordionGroup>
  <Accordion title="Ce qui s’est passé">
    - La config n’a pas été validée au démarrage, lors du rechargement à chaud, ou lors d’une écriture appartenant à OpenClaw.
    - Le démarrage du Gateway échoue de manière fermée au lieu de réécrire `openclaw.json`.
    - Le rechargement à chaud ignore les modifications externes invalides et conserve la config d’exécution actuelle active.
    - Les écritures appartenant à OpenClaw rejettent les charges utiles invalides/destructrices avant validation et enregistrent `.rejected.*`.
    - `openclaw doctor --fix` possède la réparation. Il peut supprimer les préfixes non JSON ou restaurer la dernière copie connue valide tout en préservant la charge utile rejetée sous forme de `.clobbered.*`.
    - Lorsque de nombreuses réparations ont lieu pour un même chemin de config, OpenClaw applique une rotation aux anciens fichiers `.clobbered.*` afin que la charge utile réparée la plus récente reste disponible.

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
    - `.clobbered.*` existe → doctor a préservé une modification externe cassée pendant la réparation de la config active.
    - `.rejected.*` existe → une écriture de config appartenant à OpenClaw a échoué aux contrôles de schéma ou d’écrasement avant validation.
    - `Config write rejected:` → l’écriture a tenté de supprimer une forme requise, de réduire fortement le fichier, ou de persister une config invalide.
    - `config reload skipped (invalid config):` → une modification directe a échoué à la validation et a été ignorée par le Gateway en cours d’exécution.
    - `Invalid config at ...` → le démarrage a échoué avant l’amorçage des services du Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → une écriture appartenant à OpenClaw a été rejetée parce qu’elle a perdu des champs ou de la taille par rapport à la dernière sauvegarde connue valide.
    - `Config last-known-good promotion skipped` → le candidat contenait des placeholders de secrets expurgés comme `***`.

  </Accordion>
  <Accordion title="Options de correction">
    1. Exécutez `openclaw doctor --fix` pour laisser doctor réparer une config préfixée/écrasée ou restaurer la dernière version connue valide.
    2. Copiez uniquement les clés prévues depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
    3. Exécutez `openclaw config validate` avant de redémarrer.
    4. Si vous modifiez à la main, conservez la config JSON5 complète, pas seulement l’objet partiel que vous vouliez changer.
  </Accordion>
</AccordionGroup>

Associé :

- [Config](/fr/cli/config)
- [Configuration : rechargement à chaud](/fr/gateway/configuration#config-hot-reload)
- [Configuration : validation stricte](/fr/gateway/configuration#strict-validation)
- [Doctor](/fr/gateway/doctor)

## Avertissements de sonde du Gateway

Utilisez ceci lorsque `openclaw gateway probe` atteint quelque chose, mais affiche tout de même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Recherchez :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs gateways, des portées manquantes, ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a tout de même essayé les cibles directes configurées/local loopback.
- `multiple reachable gateway identities detected` → des gateways distincts ont répondu, ou OpenClaw n’a pas pu prouver que les cibles atteignables sont le même gateway. Un tunnel SSH, une URL proxy, ou une URL distante configurée vers le même gateway est traité comme un gateway unique avec plusieurs transports, même lorsque les ports de transport diffèrent.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a fonctionné, mais le RPC de détail est limité par la portée ; associez l’identité de l’appareil ou utilisez des identifiants avec `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connexion a fonctionné, mais l’ensemble complet de RPC de diagnostic a expiré ou échoué. Traitez cela comme un Gateway atteignable avec des diagnostics dégradés ; comparez `connect.ok` et `connect.rpcOk` dans la sortie `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → le gateway a répondu, mais ce client nécessite encore un appairage/une approbation avant l’accès opérateur normal.
- Texte d’avertissement SecretRef `gateway.auth.*` / `gateway.remote.*` non résolu → le matériel d’authentification n’était pas disponible dans ce chemin de commande pour la cible en échec.

Associé :

- [Gateway](/fr/cli/gateway)
- [Plusieurs gateways sur le même hôte](/fr/gateway#multiple-gateways-same-host)
- [Accès distant](/fr/gateway/remote)

## Canal connecté, messages bloqués

Si l’état du canal est connecté mais que le flux de messages est interrompu, concentrez-vous sur la politique, les permissions et les règles de livraison propres au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Recherchez :

- La politique de messages privés (`pairing`, `allowlist`, `open`, `disabled`).
- La liste d’autorisation de groupe et les exigences de mention.
- Les permissions/portées d’API de canal manquantes.

Signatures courantes :

- `mention required` → message ignoré par la politique de mention de groupe.
- Traces `pairing` / d’approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification/permissions du canal.

Associé :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Discord](/fr/channels/discord)
- [Telegram](/fr/channels/telegram)
- [WhatsApp](/fr/channels/whatsapp)

## Livraison Cron et Heartbeat

Si cron ou heartbeat ne s’est pas exécuté ou n’a pas livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Recherchez :

- Cron activé et prochain réveil présent.
- État de l’historique d’exécution des tâches (`ok`, `skipped`, `error`).
- Raisons de saut du Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron désactivé.
    - `cron: timer tick failed` → échec du tick du planificateur ; vérifiez les erreurs de fichier, de journal ou d’exécution.
    - `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la fenêtre d’heures actives.
    - `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mais ne contient que des éléments vides, commentaires, en-têtes, clôtures ou échafaudage de liste de contrôle vide ; OpenClaw ignore donc l’appel au modèle.
    - `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est due sur ce tick.
    - `heartbeat: unknown accountId` → identifiant de compte invalide pour la cible de livraison du Heartbeat.
    - `heartbeat skipped` avec `reason=dm-blocked` → la cible de Heartbeat a été résolue vers une destination de type DM alors que `agents.defaults.heartbeat.directPolicy` (ou une surcharge par agent) est défini sur `block`.

  </Accordion>
</AccordionGroup>

Associé :

- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting)

## Node appairé, échec de l’outil

Si un Node est appairé mais que les outils échouent, isolez l’état de premier plan, des autorisations et des approbations.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Recherchez :

- Node en ligne avec les capacités attendues.
- Autorisations du système d’exploitation pour la caméra, le micro, la localisation et l’écran.
- Approbations d’exécution et état de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application du Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation du système d’exploitation manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation d’exécution en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Associé :

- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Dépannage des Node](/fr/nodes/troubleshooting)
- [Node](/fr/nodes/index)

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
- Disponibilité de Chrome local pour les profils `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Signatures de Plugin / exécutable">
    - `unknown command "browser"` ou `unknown command 'browser'` → le plugin de navigateur intégré est exclu par `plugins.allow`.
    - outil navigateur manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, donc le plugin n’a jamais été chargé.
    - `Failed to start Chrome CDP on port` → échec du lancement du processus navigateur.
    - `browser.executablePath not found` → le chemin configuré est invalide.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge comme `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port invalide ou hors plage.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle du Gateway ne dispose pas de la dépendance d’exécution de navigateur principale ; réinstallez ou mettez à jour OpenClaw, puis redémarrez le Gateway. Les instantanés ARIA et les captures d’écran de page de base peuvent toujours fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’export PDF restent indisponibles.

  </Accordion>
  <Accordion title="Signatures Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session n’a pas encore pu s’attacher au répertoire de données de navigateur sélectionné. Ouvrez la page d’inspection du navigateur, activez le débogage distant, gardez le navigateur ouvert, approuvez la première invite d’attachement, puis réessayez. Si l’état connecté n’est pas requis, préférez le profil géré `openclaw`.
    - `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
    - `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte du Gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil en attachement seul n’a aucune cible accessible, ou le point de terminaison HTTP a répondu, mais le WebSocket CDP n’a toujours pas pu être ouvert.

  </Accordion>
  <Accordion title="Signatures d’élément / capture d’écran / téléversement">
    - `fullPage is not supported for element screenshots` → la demande de capture d’écran a combiné `--full-page` avec `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser la capture de page ou une `--ref` d’instantané, pas un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des refs d’instantané, pas des sélecteurs CSS.
    - `existing-session file uploads currently support one file at a time.` → envoyez un téléversement par appel sur les profils Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → les hooks de dialogue sur les profils Chrome MCP ne prennent pas en charge les surcharges de délai d’expiration.
    - `existing-session type does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:type` sur les profils `profile="user"` / Chrome MCP existing-session, ou utilisez un profil de navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `existing-session evaluate does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:evaluate` sur les profils `profile="user"` / Chrome MCP existing-session, ou utilisez un profil de navigateur géré/CDP lorsqu’un délai personnalisé est requis.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite toujours un navigateur géré ou un profil CDP brut.
    - remplacements obsolètes de fenêtre d’affichage / mode sombre / locale / hors ligne sur les profils en attachement seul ou CDP distant → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer tout le Gateway.

  </Accordion>
</AccordionGroup>

Associé :

- [Navigateur (géré par OpenClaw)](/fr/tools/browser)
- [Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting)

## Si vous avez effectué une mise à niveau et que quelque chose s’est soudainement cassé

La plupart des pannes après mise à niveau proviennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

<AccordionGroup>
  <Accordion title="1. Le comportement d’authentification et de surcharge d’URL a changé">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Ce qu’il faut vérifier :

    - Si `gateway.mode=remote`, les appels CLI peuvent cibler le distant alors que votre service local fonctionne correctement.
    - Les appels explicites avec `--url` ne se rabattent pas sur les identifiants stockés.

    Signatures courantes :

    - `gateway connect failed:` → mauvaise URL cible.
    - `unauthorized` → point de terminaison accessible, mais mauvaise authentification.

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

    - Les liaisons non-local loopback (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification Gateway valide : authentification par jeton partagé/mot de passe, ou déploiement `trusted-proxy` non-local loopback correctement configuré.
    - Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

    Signatures courantes :

    - `refusing to bind gateway ... without auth` → liaison non-local loopback sans chemin d’authentification Gateway valide.
    - `Connectivity probe: failed` alors que l’exécution est en cours → Gateway actif, mais inaccessible avec l’authentification/URL actuelle.

  </Accordion>
  <Accordion title="3. L’appairage et l’état d’identité de l’appareil ont changé">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Ce qu’il faut vérifier :

    - Approbations d’appareils en attente pour le tableau de bord/les Node.
    - Approbations d’appairage DM en attente après des changements de politique ou d’identité.

    Signatures courantes :

    - `device identity required` → authentification de l’appareil non satisfaite.
    - `pairing required` → l’expéditeur/l’appareil doit être approuvé.

  </Accordion>
</AccordionGroup>

Si la configuration du service et l’exécution divergent encore après les vérifications, réinstallez les métadonnées de service depuis le même répertoire de profil/état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Associé :

- [Authentification](/fr/gateway/authentication)
- [Exécution en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Appairage détenu par le Gateway](/fr/gateway/pairing)

## Associé

- [Doctor](/fr/gateway/doctor)
- [FAQ](/fr/help/faq)
- [Runbook du Gateway](/fr/gateway)
