---
read_when:
    - Le centre de dépannage vous a orienté ici pour un diagnostic plus approfondi
    - Vous avez besoin de sections de guide opérationnel stables, organisées par symptôme, avec des commandes exactes
sidebarTitle: Troubleshooting
summary: Guide de dépannage approfondi pour le Gateway, les canaux, l’automatisation, les Nodes et le navigateur
title: Dépannage
x-i18n:
    generated_at: "2026-07-12T15:28:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Ceci est le guide opérationnel approfondi. Commencez d’abord par [/help/troubleshooting](/fr/help/troubleshooting) pour suivre le processus de triage rapide.

## Séquence de commandes

Exécutez-les dans cet ordre :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Signaux de bon fonctionnement :

- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability: ...`.
- `openclaw doctor` ne signale aucun problème bloquant de configuration ou de service.
- `openclaw channels status --probe` affiche l’état en direct du transport pour chaque compte et, lorsque cette fonction est prise en charge, `works` ou `audit ok`.

## Après une mise à jour

Utilisez cette procédure lorsqu’une mise à jour est terminée, mais que le Gateway est arrêté, que les canaux sont vides ou que les appels aux modèles échouent avec des erreurs 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Recherchez :

- `Update restart` dans `openclaw status` / `openclaw status --all`. Les transferts en attente ou ayant échoué indiquent la prochaine commande à exécuter.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` sous Channels : la configuration du canal existe toujours, mais l’enregistrement du Plugin a échoué avant le chargement du canal.
- Des erreurs 401 du fournisseur après une nouvelle authentification : `openclaw doctor --fix` recherche les copies obsolètes des données d’authentification OAuth propres à chaque agent et les supprime afin que tous les agents utilisent le profil partagé actuel.

## Installations incohérentes et protection contre une configuration plus récente

Utilisez cette procédure lorsqu’un service Gateway s’arrête de manière inattendue après une mise à jour, ou lorsque les journaux indiquent qu’un binaire `openclaw` est plus ancien que la version ayant écrit `openclaw.json` pour la dernière fois.

OpenClaw marque les écritures de configuration avec `meta.lastTouchedVersion`. Les commandes en lecture seule peuvent examiner une configuration écrite par une version plus récente d’OpenClaw, mais les mutations de processus et de services refusent de s’exécuter depuis un binaire plus ancien. Actions bloquées : démarrage, arrêt, redémarrage et désinstallation du service Gateway, réinstallation forcée du service, démarrage du Gateway en mode service et nettoyage du port avec `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corriger PATH">
    Corrigez `PATH` afin que `openclaw` corresponde à l’installation la plus récente, puis réexécutez l’action.
  </Step>
  <Step title="Réinstaller le service Gateway">
    Réinstallez le service Gateway voulu depuis l’installation la plus récente :

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Supprimer les wrappers obsolètes">
    Supprimez les entrées obsolètes du paquet système ou des anciens wrappers qui pointent encore vers un ancien binaire `openclaw`.
  </Step>
</Steps>

<Warning>
Pour une rétrogradation intentionnelle ou une récupération d’urgence uniquement, définissez `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` pour cette seule commande. Laissez cette variable non définie en fonctionnement normal.
</Warning>

## Incompatibilité de protocole après une restauration

Utilisez cette procédure lorsque les journaux continuent d’afficher `protocol mismatch` après une rétrogradation ou une restauration. Un ancien Gateway est en cours d’exécution, mais un processus client local plus récent continue de se reconnecter avec une plage de protocoles que l’ancien Gateway ne prend pas en charge.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Recherchez :

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` dans les journaux du Gateway.
- `Established clients:` dans `openclaw gateway status --deep` ou `Gateway clients` dans `openclaw doctor --deep` : les clients TCP actifs connectés au port du Gateway, avec leur PID et leur ligne de commande lorsque le système d’exploitation le permet.
- Un processus client dont la ligne de commande pointe vers l’installation ou le wrapper OpenClaw plus récent depuis lequel vous avez effectué la rétrogradation.

Correction :

1. Arrêtez ou redémarrez le processus client OpenClaw obsolète affiché par `gateway status --deep`.
2. Redémarrez les applications ou wrappers qui intègrent OpenClaw : tableaux de bord locaux, éditeurs, utilitaires de serveur d’application ou shells `openclaw logs --follow` de longue durée.
3. Réexécutez `openclaw gateway status --deep` ou `openclaw doctor --deep` et vérifiez que le PID du client obsolète a disparu.

Ne faites pas en sorte qu’un ancien Gateway accepte un protocole plus récent et incompatible. Les changements de version du protocole protègent le contrat de communication ; la récupération après restauration consiste à nettoyer les processus et les versions.

## Lien symbolique de Skill ignoré pour sortie du chemin autorisé

Utilisez cette procédure lorsque les journaux contiennent :

```text
Chemin de Skill ignoré car il sort de sa racine configurée : ... reason=symlink-escape
```

Chaque racine de Skill constitue une limite de confinement. Un lien symbolique sous `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` ou `~/.openclaw/skills` est ignoré lorsque sa cible réelle se trouve hors de cette racine, sauf si cette cible est explicitement approuvée.

Examinez le lien :

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Si la cible est intentionnelle, configurez à la fois la racine directe de Skill et la cible de lien symbolique autorisée :

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

Démarrez ensuite une nouvelle session ou attendez que l’observateur de Skills actualise son état. Redémarrez le Gateway si le processus en cours d’exécution est antérieur à la modification de la configuration.

N’utilisez pas de cibles trop larges telles que `~`, `/` ou l’intégralité d’un dossier de projet synchronisé. Limitez `allowSymlinkTargets` à la véritable racine de Skill contenant les répertoires `SKILL.md` approuvés.

Si l’application des modifications depuis Skill Workshop doit également écrire via ces chemins de Skills d’espace de travail liés symboliquement et approuvés, activez `skills.workshop.allowSymlinkTargetWrites`. Laissez cette option désactivée pour les racines de Skills partagées en lecture seule.

Voir aussi :

- [Configuration des Skills](/fr/tools/skills-config#symlinked-skill-roots)
- [Exemples de configuration](/fr/gateway/configuration-examples#symlinked-sibling-skill-repo)

## L’utilisation supplémentaire d’Anthropic est requise pour le contexte long en cas d’erreur 429

Utilisez cette procédure lorsque les journaux ou les erreurs contiennent : `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Recherchez :

- Le modèle Anthropic sélectionné est un modèle Claude 4.x à disponibilité générale prenant en charge 1M (Opus 4.6/4.7/4.8, Sonnet 4.6), ou la configuration du modèle contient encore l’ancien paramètre `params.context1m: true`.
- Les identifiants Anthropic actuels ne sont pas éligibles à l’utilisation du contexte long.
- Les requêtes échouent uniquement pendant les longues sessions ou exécutions de modèle nécessitant le chemin de contexte 1M.

Options de correction :

<Steps>
  <Step title="Utiliser une fenêtre de contexte standard">
    Passez à un modèle doté d’une fenêtre standard ou supprimez l’ancien paramètre `context1m` de la configuration
    d’un modèle plus ancien qui ne prend pas en charge le contexte 1M en disponibilité générale.
  </Step>
  <Step title="Utiliser des identifiants éligibles">
    Utilisez des identifiants Anthropic éligibles aux requêtes à contexte long, ou passez à une clé d’API Anthropic.
  </Step>
  <Step title="Configurer des modèles de repli">
    Configurez des modèles de repli afin que les exécutions se poursuivent lorsque les requêtes Anthropic à contexte long sont rejetées.
  </Step>
</Steps>

Voir aussi :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Pourquoi une erreur HTTP 429 d’Anthropic s’affiche-t-elle ?](/fr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Réponses 403 bloquées en amont

Utilisez cette procédure lorsqu’un fournisseur de LLM en amont renvoie une erreur `403` générique telle que `Your request was blocked`.

Ne supposez pas qu’il s’agit toujours d’un problème de configuration d’OpenClaw. La réponse peut provenir d’une couche de sécurité en amont, telle qu’un CDN, un WAF, une règle de gestion des robots ou un proxy inverse placé devant un point de terminaison compatible avec OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Recherchez :

- Plusieurs modèles du même fournisseur échouent de la même manière.
- Du HTML ou un texte de sécurité générique à la place d’une erreur normale de l’API du fournisseur.
- Des événements de sécurité côté fournisseur correspondant à l’heure de la requête.
- Une minuscule requête de vérification directe avec `curl` réussit, alors que les requêtes normales structurées comme celles du SDK échouent.

Corrigez d’abord le filtrage côté fournisseur lorsque les éléments indiquent un blocage par un WAF/CDN. Privilégiez une règle d’autorisation ou d’exclusion limitée au chemin d’API utilisé par OpenClaw et évitez de désactiver la protection pour l’ensemble du site.

<Warning>
La réussite d’une requête `curl` minimale ne garantit pas que les véritables requêtes de type SDK traverseront la même couche de sécurité en amont.
</Warning>

Voir aussi :

- [Points de terminaison compatibles avec OpenAI](/fr/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuration des fournisseurs](/fr/providers)
- [Journaux](/fr/logging)

## Le backend local compatible avec OpenAI réussit les vérifications directes, mais les exécutions d’agent échouent

Utilisez cette procédure lorsque :

- `curl ... /v1/models` fonctionne.
- Les petits appels directs à `/v1/chat/completions` fonctionnent.
- Les exécutions de modèles OpenClaw échouent uniquement lors des tours d’agent normaux.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Recherchez :

- Les petits appels directs réussissent, mais les exécutions OpenClaw échouent uniquement avec des prompts plus volumineux.
- Des erreurs `model_not_found` ou 404, même si l’appel direct à `/v1/chat/completions` fonctionne avec le même identifiant de modèle sans préfixe.
- Des erreurs du backend indiquant que `messages[].content` doit être une chaîne.
- Des avertissements intermittents `incomplete turn detected ... stopReason=stop payloads=0` avec un backend local compatible avec OpenAI.
- Des plantages du backend qui apparaissent uniquement avec un plus grand nombre de jetons dans le prompt ou avec les prompts complets de l’environnement d’exécution de l’agent.

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `model_not_found` avec un serveur local de type MLX/vLLM : vérifiez que `baseUrl` inclut `/v1`, que `api` vaut `"openai-completions"` pour les backends `/v1/chat/completions` et que `models.providers.<provider>.models[].id` correspond à l’identifiant local au fournisseur sans préfixe. Sélectionnez-le une seule fois avec le préfixe du fournisseur, par exemple `mlx/mlx-community/Qwen3-30B-A3B-6bit` ; conservez `mlx-community/Qwen3-30B-A3B-6bit` dans l’entrée du catalogue.
    - `messages[...].content: invalid type: sequence, expected a string` : le backend rejette les parties de contenu structurées de Chat Completions. Correction : définissez `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` ou des clés de message autorisées telles que `["role","content"]` : le backend rejette les métadonnées de relecture de style OpenAI dans les messages Chat Completions. Correction : définissez `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` : le backend a terminé la requête Chat Completions, mais n’a renvoyé aucun texte d’assistant visible par l’utilisateur pour ce tour. OpenClaw réessaie une fois les tours vides compatibles avec OpenAI dont la relecture est sûre ; les échecs persistants signifient généralement que le backend produit un contenu vide ou non textuel, ou supprime le texte de la réponse finale.
    - Les petites requêtes directes réussissent, mais les exécutions d’agent OpenClaw échouent à cause de plantages du backend ou du modèle (par exemple Gemma avec certaines versions d’`inferrs`) : le transport OpenClaw est probablement déjà correct ; le backend échoue avec la forme plus volumineuse du prompt de l’environnement d’exécution de l’agent.
    - Les échecs diminuent après la désactivation des outils, mais ne disparaissent pas : les schémas des outils contribuaient à la charge, mais le problème restant concerne toujours la capacité du modèle ou du serveur en amont, ou un bogue du backend.

  </Accordion>
  <Accordion title="Options de correction">
    1. Définissez `compat.requiresStringContent: true` pour les backends Chat Completions qui n’acceptent que des chaînes.
    2. Définissez `compat.strictMessageKeys: true` pour les backends Chat Completions stricts qui n’acceptent que `role` et `content` dans chaque message.
    3. Définissez `compat.supportsTools: false` pour les modèles ou backends qui ne peuvent pas gérer de façon fiable l’ensemble des schémas d’outils d’OpenClaw.
    4. Réduisez la charge du prompt lorsque cela est possible : amorçage plus léger de l’espace de travail, historique de session plus court, modèle local plus léger ou backend offrant une meilleure prise en charge du contexte long.
    5. Si les petites requêtes directes continuent de réussir alors que les tours d’agent OpenClaw provoquent toujours un plantage dans le backend, considérez le problème comme une limitation du serveur ou du modèle en amont et signalez-y un cas reproductible avec la structure de charge utile acceptée.
  </Accordion>
</AccordionGroup>

Voir aussi :

- [Configuration](/fr/gateway/configuration)
- [Modèles locaux](/fr/gateway/local-models)
- [Points de terminaison compatibles avec OpenAI](/fr/gateway/configuration-reference#openai-compatible-endpoints)

## Aucune réponse

Si les canaux sont opérationnels, mais que rien ne répond, vérifiez le routage et la politique avant de reconnecter quoi que ce soit.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Recherchez :

- Un appairage en attente pour les expéditeurs de messages privés.
- Le filtrage des mentions de groupe (`requireMention`, `mentionPatterns`).
- Des incohérences dans les listes d’autorisation de canaux/groupes.

Signatures courantes :

- `drop guild message (mention required` → message de groupe ignoré jusqu’à ce qu’une mention soit effectuée.
- `pairing request` → l’expéditeur doit être approuvé.
- `blocked` / `allowlist` → l’expéditeur/le canal a été filtré par la politique.

Voir aussi :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Groupes](/fr/channels/groups)
- [Appairage](/fr/channels/pairing)

## Connectivité de l’interface de contrôle du tableau de bord

Lorsque le tableau de bord ou l’interface de contrôle ne parvient pas à se connecter, vérifiez l’URL, le mode d’authentification et les hypothèses relatives au contexte sécurisé.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Recherchez :

- L’URL de sonde et l’URL du tableau de bord correctes.
- Une incohérence de mode d’authentification ou de jeton entre le client et le Gateway.
- L’utilisation de HTTP lorsqu’une identité d’appareil est requise.

Si un navigateur local ne parvient pas à se connecter à `127.0.0.1:18789` après une mise à jour, rétablissez d’abord le service Gateway local et vérifiez qu’il fournit le tableau de bord :

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Si `curl` renvoie du HTML OpenClaw, le Gateway fonctionne et le problème restant est probablement dû au cache du navigateur, à un ancien lien profond ou à l’état obsolète d’un onglet. Ouvrez directement `http://127.0.0.1:18789` et naviguez depuis le tableau de bord. Si le redémarrage ne laisse pas le service en cours d’exécution, exécutez `openclaw gateway start`, puis vérifiez à nouveau `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Signatures de connexion/d’authentification">
    - `device identity required` → contexte non sécurisé ou authentification de l’appareil manquante.
    - `origin not allowed` → l’`Origin` du navigateur ne figure pas dans `gateway.controlUi.allowedOrigins` (ou vous vous connectez depuis une origine de navigateur hors boucle locale sans liste d’autorisation explicite).
    - `device nonce required` / `device nonce mismatch` → le client ne termine pas le flux d’authentification d’appareil basé sur un défi (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → le client a signé une charge utile incorrecte (ou avec un horodatage obsolète) pour la négociation actuelle.
    - `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → le client peut effectuer une nouvelle tentative approuvée avec le jeton d’appareil mis en cache.
    - Cette nouvelle tentative avec le jeton mis en cache réutilise l’ensemble des portées mises en cache avec le jeton de l’appareil appairé. Les appelants qui fournissent explicitement `deviceToken` / `scopes` conservent plutôt l’ensemble de portées demandé.
    - `AUTH_SCOPE_MISMATCH` → le jeton d’appareil a été reconnu, mais ses portées approuvées ne couvrent pas cette demande de connexion ; réappairez l’appareil ou approuvez le contrat de portées demandé au lieu de renouveler un jeton Gateway partagé.
    - En dehors de cette voie de nouvelle tentative, l’ordre de priorité de l’authentification à la connexion est le suivant : jeton partagé/mot de passe explicite en premier, puis `deviceToken` explicite, puis jeton d’appareil enregistré, puis jeton d’amorçage.
    - Sur la voie asynchrone de l’interface de contrôle Tailscale Serve, les tentatives ayant échoué pour la même paire `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec. Deux nouvelles tentatives incorrectes et simultanées provenant du même client peuvent donc produire `retry later` lors de la deuxième tentative au lieu de deux simples incohérences.
    - `too many failed authentication attempts (retry later)` provenant d’un client en boucle locale avec une origine de navigateur → les échecs répétés provenant de cette même `Origin` normalisée sont temporairement bloqués ; une autre origine localhost utilise un compartiment distinct.
    - Répétitions de `unauthorized` après cette nouvelle tentative → dérive entre le jeton partagé et le jeton d’appareil ; actualisez la configuration du jeton et réapprouvez/renouvelez le jeton d’appareil si nécessaire.
    - `gateway connect failed:` → hôte/port/cible d’URL incorrect.

  </Accordion>
</AccordionGroup>

### Aperçu des codes de détail d’authentification

Utilisez `error.details.code` dans la réponse `connect` ayant échoué pour choisir l’action suivante :

| Code de détail               | Signification                                                                                                                                                                                 | Action recommandée                                                                                                                                                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Le client n’a pas envoyé un jeton partagé requis.                                                                                                                                             | Collez/définissez le jeton dans le client et réessayez. Pour les voies du tableau de bord : `openclaw config get gateway.auth.token`, puis collez-le dans les paramètres de l’interface de contrôle.                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | Le jeton partagé ne correspondait pas au jeton d’authentification du Gateway.                                                                                                                 | Si `canRetryWithDeviceToken=true`, autorisez une nouvelle tentative approuvée. Les nouvelles tentatives avec le jeton mis en cache réutilisent les portées approuvées enregistrées ; les appelants qui fournissent explicitement `deviceToken` / `scopes` conservent les portées demandées. Si l’échec persiste, suivez la [liste de contrôle de récupération après une dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Le jeton mis en cache propre à l’appareil est obsolète ou révoqué.                                                                                                                            | Renouvelez/réapprouvez le jeton d’appareil à l’aide de la [CLI des appareils](/fr/cli/devices), puis reconnectez-vous.                                                                                                                                                                      |
| `AUTH_SCOPE_MISMATCH`        | Le jeton d’appareil est valide, mais son rôle/ses portées approuvés ne couvrent pas cette demande de connexion.                                                                                | Réappairez l’appareil ou approuvez le contrat de portées demandé ; ne considérez pas ce cas comme une dérive du jeton partagé.                                                                                                                                                            |
| `PAIRING_REQUIRED`           | L’identité de l’appareil doit être approuvée. Consultez `error.details.reason` pour `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, et utilisez `requestId` / `remediationHint` lorsqu’ils sont présents. | Approuvez la demande en attente : `openclaw devices list`, puis `openclaw devices approve <requestId>`. Les mises à niveau de portée/rôle utilisent le même flux après vérification de l’accès demandé.                                                                                  |

<Note>
Les RPC directs vers le backend en boucle locale authentifiés avec le jeton/mot de passe partagé du Gateway ne doivent pas dépendre de la base de référence des portées d’appareil appairé de la CLI. Si des sous-agents ou d’autres appels internes échouent encore avec `scope-upgrade`, vérifiez que l’appelant utilise `client.id: "gateway-client"` et `client.mode: "backend"` et qu’il n’impose pas explicitement une `deviceIdentity` ou un jeton d’appareil.
</Note>

Vérification de la migration de l’authentification des appareils v2 :

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si les journaux affichent des erreurs de nonce/signature, mettez à jour le client qui se connecte et vérifiez-le :

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

Si `openclaw devices rotate` / `revoke` / `remove` est refusé de manière inattendue :

- Les sessions utilisant un jeton d’appareil appairé ne peuvent gérer que **leur propre** appareil, sauf si l’appelant dispose également de `operator.admin`.
- `openclaw devices rotate --scope ...` ne peut demander que les portées d’opérateur que la session de l’appelant possède déjà.

Voir aussi :

- [Configuration](/fr/gateway/configuration) (modes d’authentification du Gateway)
- [Interface de contrôle](/fr/web/control-ui)
- [Appareils](/fr/cli/devices)
- [Accès à distance](/fr/gateway/remote)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)

## Service Gateway non démarré

À utiliser lorsque le service est installé, mais que le processus ne reste pas actif.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analyse également les services au niveau système
```

Recherchez :

- `Runtime: stopped` accompagné d’indications sur la sortie.
- Une incohérence de configuration du service (`Config (cli)` par rapport à `Config (service)`).
- Des conflits de port/d’écouteur.
- Des installations launchd/systemd/schtasks supplémentaires lorsque `--deep` est utilisé.
- Des indications de nettoyage `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode Gateway local n’est pas activé, ou le fichier de configuration a été écrasé et a perdu `gateway.mode`. Correction : définissez `gateway.mode="local"` dans votre configuration, ou réexécutez `openclaw onboard --mode local` / `openclaw setup` afin de rétablir la configuration attendue du mode local. Si vous exécutez OpenClaw via Podman, le chemin de configuration par défaut est `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → liaison hors boucle locale sans voie d’authentification Gateway valide (jeton/mot de passe, ou proxy de confiance lorsqu’il est configuré).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflit de port.
    - `Other gateway-like services detected (best effort)` → des unités launchd/systemd/schtasks obsolètes ou parallèles existent. La plupart des configurations doivent conserver un seul Gateway par machine ; si vous en avez besoin de plusieurs, isolez les ports ainsi que la configuration/l’état/l’espace de travail. Consultez [/gateway#multiple-gateways-same-host](/fr/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` signalé par doctor → une unité système systemd existe alors que le service au niveau utilisateur est absent. Supprimez ou désactivez le doublon avant d’autoriser doctor à installer un service utilisateur, ou définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` si l’unité système est le superviseur prévu.
    - `Gateway service port does not match current gateway config` → le superviseur installé impose encore l’ancien `--port`. Exécutez `openclaw doctor --fix` ou `openclaw gateway install --force`, puis redémarrez le service Gateway.

  </Accordion>
</AccordionGroup>

Voir aussi :

- [Exécution en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Doctor](/fr/gateway/doctor)

## Sous macOS, le Gateway cesse silencieusement de répondre, puis reprend lorsque vous interagissez avec le tableau de bord

À utiliser lorsque les canaux (Telegram, WhatsApp, etc.) d’un hôte macOS restent silencieux pendant plusieurs minutes, voire plusieurs heures, et que le Gateway semble se réactiver dès que vous ouvrez l’interface de contrôle, établissez une connexion SSH ou interagissez d’une autre manière avec l’hôte. `openclaw status` n’affiche généralement aucun symptôme évident, car au moment où vous consultez l’état, le Gateway fonctionne de nouveau.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Recherchez :

- Un ou plusieurs ensembles `*-uncaught_exception.json` dans `~/.openclaw/logs/stability/`, avec `error.code` défini sur un code réseau transitoire tel que `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` ou `ECONNREFUSED`.
- Des lignes de `pmset -g log` telles que `Entering Sleep state due to 'Maintenance Sleep'` ou `en0 driver is slow (msg: WillChangeState to 0)` correspondant aux horodatages des plantages. Power Nap / Maintenance Sleep place brièvement le pilote Wi-Fi dans l’état 0 ; tout appel `connect()` sortant effectué pendant cet intervalle peut échouer avec `ENETDOWN`, même sur un hôte disposant par ailleurs d’une connectivité réseau complète.
- Une sortie de `launchctl print` affichant `state = not running`, avec plusieurs `runs` récents et un code de sortie, en particulier lorsque l’intervalle entre le plantage et le lancement suivant est de l’ordre d’une heure plutôt que de quelques secondes. Après une série de plantages, launchd de macOS applique un mécanisme non documenté de protection contre les relances qui peut cesser de respecter `KeepAlive=true` jusqu’à ce qu’un déclencheur externe, tel qu’une connexion interactive, une connexion au tableau de bord ou `launchctl kickstart`, le réarme.

Signatures courantes :

- Un ensemble de stabilité dont `error.code` vaut `ENETDOWN` ou un code apparenté, avec une pile d’appels pointant vers `lookupAndConnect` / `Socket.connect` du module `net` de Node. OpenClaw `2026.5.26` et les versions ultérieures classent ces erreurs comme des erreurs réseau transitoires bénignes, afin qu’elles ne se propagent plus jusqu’au gestionnaire global des exceptions non interceptées ; si vous utilisez une version antérieure, commencez par effectuer une mise à niveau.
- De longues périodes d’inactivité qui prennent fin dès que vous vous connectez à l’interface de contrôle ou à l’hôte par SSH : c’est l’activité visible par l’utilisateur qui réarme le mécanisme de relance de launchd, et non une action du tableau de bord sur le Gateway.
- Un compteur `runs` qui augmente au fil de la journée sans ligne `received SIG*; shutting down` correspondante dans `~/Library/Logs/openclaw/gateway.log` : les arrêts propres consignent un signal dans les journaux, contrairement aux plantages transitoires.

Procédure à suivre :

1. **Mettez à niveau le Gateway** si vous utilisez une version antérieure à `2026.5.26`. Après la mise à niveau, les futures erreurs `ENETDOWN` sont consignées comme avertissements au lieu d’arrêter le processus.
2. **Réduisez l’activité de veille de maintenance** sur les Mac mini / hôtes de bureau destinés à fonctionner comme des serveurs toujours actifs :

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Cela réduit considérablement, sans toutefois l’éliminer complètement, l’instabilité sous-jacente du pilote. Le système peut toujours effectuer certaines veilles de maintenance pour maintenir les connexions TCP et entretenir mDNS, indépendamment de ces indicateurs.

3. **Ajoutez un mécanisme de surveillance de disponibilité** afin qu’une future série de plantages bloquée par launchd soit rapidement détectée :

   ```bash
   # Exemple de contrôle de disponibilité tenant compte de launchd, adapté à une tâche Cron ou à un LaunchAgent exécuté toutes les 5 minutes
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   L’objectif est de réarmer extérieurement le mécanisme de relance ; `KeepAlive=true` seul ne suffit pas sous macOS après une série de plantages.

Voir aussi :

- [Notes sur la plateforme macOS](/fr/platforms/macos)
- [Journalisation](/fr/logging)
- [Doctor](/fr/gateway/doctor)

## Boucle de supervision launchd sous macOS avec des LaunchAgents Gateway/Node en double

Utilisez cette procédure lorsqu’une installation macOS redémarre sans cesse toutes les quelques secondes, que les contrôles d’intégrité d’`openclaw`
oscillent entre un état sain et une indisponibilité, et que l’acheminement vers les canaux se bloque,
même si le service semble fonctionner.

Ce problème a été observé sur d’anciennes installations où les LaunchAgents `ai.openclaw.gateway` et
`ai.openclaw.node` étaient tous deux actifs et injectaient chacun
`OPENCLAW_LAUNCHD_LABEL`. Dans cet état, OpenClaw peut détecter la
supervision par launchd, tenter de lui déléguer le redémarrage, puis tomber dans une boucle rapide
`EADDRINUSE`/relance au lieu de conserver un seul processus Gateway stable.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Éléments à rechercher :

- Plusieurs PID de Gateway dans l’échantillon de 30 secondes au lieu d’un seul
  processus stable.
- `EADDRINUSE`, `another gateway instance is already listening` ou des lignes répétées
  de redémarrage/transfert dans `gateway.log`.
- `~/Library/LaunchAgents/ai.openclaw.gateway.plist` et
  `~/Library/LaunchAgents/ai.openclaw.node.plist` chargés simultanément sur un
  hôte qui ne devrait exécuter qu’un seul service Gateway géré.

Procédure à suivre :

1. Si cet hôte ne doit exécuter que le service Gateway, supprimez le service
   Node géré au moyen d’OpenClaw. **Ignorez cette étape** si vous dépendez activement du service Node
   pour les fonctionnalités de Node distant ; sa désinstallation arrête ces fonctionnalités sur
   cet hôte :

   ```bash
   openclaw node uninstall
   ```

2. Installez un wrapper Gateway persistant qui efface les marqueurs launchd
   hérités avant de démarrer OpenClaw. Utilisez l’option prise en charge `--wrapper` ; ne
   modifiez pas le fichier généré sous `~/.openclaw/service-env/`, car la
   réinstallation du service, la mise à jour et la réparation par Doctor régénèrent ce fichier :

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` conserve le chemin du wrapper lors des réinstallations forcées,
   des mises à jour et des réparations par Doctor.

3. Vérifiez que le Gateway est stable et fournit le service RPC, et qu’il ne se contente pas d’écouter :

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   L’échantillon de PID doit afficher un seul processus stable au lieu d’un ensemble
   de PID en rotation, et l’acheminement entrant vers les canaux doit reprendre.

4. Après la mise à niveau vers une version dans laquelle la boucle sous-jacente des deux LaunchAgents est
   corrigée, supprimez la solution de contournement et réinstallez le service géré normal :

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Voir aussi :

- [Notes sur la plateforme macOS](/fr/platforms/mac/bundled-gateway)
- [Doctor](/fr/gateway/doctor)
- [CLI du Gateway](/fr/cli/gateway)

## Le Gateway s’arrête lors d’une utilisation élevée de la mémoire

Utilisez cette procédure lorsque le Gateway disparaît sous charge, que le superviseur signale un redémarrage de type mémoire insuffisante ou que les journaux mentionnent `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Éléments à rechercher :

- `Reason: diagnostic.memory.pressure.critical` dans le dernier ensemble de stabilité.
- `Memory pressure:` avec `critical/rss_threshold`, `critical/heap_threshold` ou `critical/rss_growth`.
- Des valeurs `V8 heap:` proches de la limite du tas.
- Des entrées `Largest session files:` telles que `agents/<agent>/sessions/<session>.jsonl` ou `sessions/<session>.jsonl`.
- Les compteurs de mémoire des cgroups Linux lorsque le Gateway s’exécute dans un conteneur ou un service à mémoire limitée.

Signatures courantes :

- `critical memory pressure bundle written` apparaît peu avant le redémarrage → OpenClaw a capturé un ensemble de stabilité avant l’épuisement de la mémoire. Examinez-le avec `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` apparaît dans les journaux du Gateway → OpenClaw a détecté une pression mémoire critique, mais l’instantané de stabilité précédant l’épuisement de la mémoire est désactivé.
- `Largest session files:` pointe vers un très grand chemin de transcription expurgé → réduisez l’historique de session conservé, examinez la croissance de la session ou déplacez les anciennes transcriptions hors du stockage actif avant de redémarrer.
- Le nombre d’octets utilisés indiqué par `V8 heap:` est proche de la limite du tas → réduisez la pression exercée par les prompts/sessions, diminuez le nombre de tâches simultanées ou augmentez la limite du tas de Node uniquement après avoir confirmé que la charge de travail est attendue.
- `Memory pressure: critical/rss_growth` → la mémoire a augmenté rapidement au cours d’une seule fenêtre d’échantillonnage. Consultez les derniers journaux pour détecter une importation volumineuse, une sortie d’outil incontrôlée, des tentatives répétées ou un lot de tâches d’agent mises en file d’attente.
- Une pression mémoire critique apparaît dans les journaux, mais aucun ensemble n’existe → il s’agit du comportement par défaut. Définissez `diagnostics.memoryPressureSnapshot: true` pour capturer l’ensemble de stabilité précédant l’épuisement de la mémoire lors des futurs événements de pression mémoire critique.

L’ensemble de stabilité ne contient aucune charge utile. Il inclut des données opérationnelles sur la mémoire et des chemins de fichiers relatifs expurgés, mais aucun texte de message, corps de Webhook, identifiant, jeton, cookie ou identifiant de session brut. Joignez l’exportation des diagnostics aux rapports de bogue plutôt que de copier les journaux bruts.

Voir aussi :

- [Intégrité du Gateway](/fr/gateway/health)
- [Exportation des diagnostics](/fr/gateway/diagnostics)
- [Sessions](/fr/cli/sessions)

## Le Gateway a rejeté une configuration non valide

Utilisez cette procédure lorsque le démarrage du Gateway échoue avec `Invalid config` ou que les journaux de rechargement à chaud indiquent qu’une modification non valide a été ignorée.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Éléments à rechercher :

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Un fichier horodaté `openclaw.json.rejected.*` à côté de la configuration active.
- Un fichier horodaté `openclaw.json.clobbered.*` si `doctor --fix` a réparé une modification directe défectueuse.
- OpenClaw conserve les 32 derniers fichiers `.clobbered.*` pour chaque chemin de configuration et effectue une rotation des plus anciens.

<AccordionGroup>
  <Accordion title="Ce qui s’est passé">
    - La configuration n’a pas été validée lors du démarrage, du rechargement à chaud ou d’une écriture effectuée par OpenClaw.
    - Le démarrage du Gateway échoue de manière sécurisée au lieu de réécrire `openclaw.json`.
    - Le rechargement à chaud ignore les modifications externes non valides et maintient la configuration d’exécution actuelle active.
    - Les écritures effectuées par OpenClaw rejettent les charges utiles non valides/destructrices avant la validation et les enregistrent dans `.rejected.*`.
    - `openclaw doctor --fix` prend en charge la réparation. Il peut supprimer les préfixes non JSON ou restaurer la dernière copie valide connue tout en conservant la charge utile rejetée dans `.clobbered.*`.
    - Lorsque de nombreuses réparations sont effectuées pour un même chemin de configuration, OpenClaw effectue une rotation des anciens fichiers `.clobbered.*` afin que la charge utile réparée la plus récente reste disponible.

  </Accordion>
  <Accordion title="Examiner et réparer">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Signatures courantes">
    - `.clobbered.*` existe → Doctor a conservé une modification externe défectueuse tout en réparant la configuration active.
    - `.rejected.*` existe → une écriture de configuration effectuée par OpenClaw a échoué aux contrôles de schéma ou d’écrasement avant la validation.
    - `Config write rejected:` → l’écriture a tenté de supprimer une structure requise, de réduire fortement la taille du fichier ou d’enregistrer une configuration non valide.
    - `config reload skipped (invalid config):` → une modification directe a échoué à la validation et a été ignorée par le Gateway en cours d’exécution.
    - `Invalid config at ...` → le démarrage a échoué avant l’initialisation des services du Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → une écriture effectuée par OpenClaw a été rejetée, car elle avait perdu des champs ou de la taille par rapport à la dernière sauvegarde valide connue.
    - `Config last-known-good promotion skipped` → la configuration candidate contenait des espaces réservés de secrets expurgés tels que `***`.

  </Accordion>
  <Accordion title="Options de correction">
    1. Exécutez `openclaw doctor --fix` pour permettre à Doctor de réparer une configuration préfixée/écrasée ou de restaurer la dernière version valide connue.
    2. Copiez uniquement les clés souhaitées depuis `.clobbered.*` ou `.rejected.*`, puis appliquez-les avec `openclaw config set` ou `config.patch`.
    3. Exécutez `openclaw config validate` avant de redémarrer.
    4. Si vous effectuez une modification manuelle, conservez la configuration JSON5 complète, et pas uniquement l’objet partiel que vous souhaitiez modifier.
  </Accordion>
</AccordionGroup>

Voir aussi :

- [Configuration](/fr/cli/config)
- [Configuration : rechargement à chaud](/fr/gateway/configuration#config-hot-reload)
- [Configuration : validation stricte](/fr/gateway/configuration#strict-validation)
- [Doctor](/fr/gateway/doctor)

## Avertissements de la sonde du Gateway

À utiliser lorsque `openclaw gateway probe` atteint une cible, mais affiche tout de même un bloc d’avertissement.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Recherchez :

- `warnings[].code` et `primaryTargetId` dans la sortie JSON.
- Si l’avertissement concerne le repli SSH, plusieurs gateways, des portées manquantes ou des références d’authentification non résolues.

Signatures courantes :

- `SSH tunnel failed to start; falling back to direct probes.` → la configuration SSH a échoué, mais la commande a tout de même tenté d’interroger directement les cibles configurées ou de bouclage.
- `multiple reachable gateway identities detected` → des gateways distincts ont répondu, ou OpenClaw n’a pas pu prouver que les cibles accessibles correspondent au même gateway. Un tunnel SSH, une URL de proxy ou une URL distante configurée vers le même gateway sont considérés comme un seul gateway utilisant plusieurs transports, même si les ports de transport diffèrent.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connexion a réussi, mais les RPC détaillés sont limités par les portées ; associez l’identité de l’appareil ou utilisez des identifiants disposant de `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connexion a réussi, mais l’ensemble complet des RPC de diagnostic a expiré ou échoué. Considérez ce Gateway comme accessible avec des diagnostics dégradés ; comparez `connect.ok` et `connect.rpcOk` dans la sortie de `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → le gateway a répondu, mais ce client doit encore être associé ou approuvé avant de disposer d’un accès opérateur normal.
- Texte d’avertissement de SecretRef `gateway.auth.*` / `gateway.remote.*` non résolue → les données d’authentification n’étaient pas disponibles dans ce chemin de commande pour la cible en échec.

Voir aussi :

- [Gateway](/fr/cli/gateway)
- [Plusieurs gateways sur le même hôte](/fr/gateway#multiple-gateways-same-host)
- [Accès distant](/fr/gateway/remote)

## Canal connecté, mais les messages ne circulent pas

Si l’état du canal indique qu’il est connecté, mais que le flux de messages est interrompu, concentrez-vous sur la stratégie, les autorisations et les règles de livraison propres au canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Recherchez :

- La stratégie de messages privés (`pairing`, `allowlist`, `open`, `disabled`).
- La liste d’autorisation des groupes et les exigences de mention.
- Les autorisations ou portées d’API du canal manquantes.

Signatures courantes :

- `mention required` → message ignoré par la stratégie de mention du groupe.
- Traces `pairing` / d’approbation en attente → l’expéditeur n’est pas approuvé.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problème d’authentification ou d’autorisations du canal.

Voir aussi :

- [Dépannage des canaux](/fr/channels/troubleshooting)
- [Discord](/fr/channels/discord)
- [Telegram](/fr/channels/telegram)
- [WhatsApp](/fr/channels/whatsapp)

## Livraison Cron et Heartbeat

Si Cron ou Heartbeat ne s’est pas exécuté ou n’a rien livré, vérifiez d’abord l’état du planificateur, puis la cible de livraison.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Recherchez :

- Si Cron est activé et si le prochain réveil est indiqué.
- L’état de l’historique d’exécution de la tâche (`ok`, `skipped`, `error`).
- Les motifs d’omission de Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Signatures courantes">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron est désactivé.
    - `cron: timer tick failed` → l’impulsion du planificateur a échoué ; vérifiez les erreurs de fichier, de journal ou d’environnement d’exécution.
    - `heartbeat skipped` avec `reason=quiet-hours` → en dehors de la plage des heures actives.
    - `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mais ne contient que des éléments de structure vides, des commentaires, un en-tête, un bloc délimité ou une liste de contrôle vide ; OpenClaw ignore donc l’appel au modèle.
    - `heartbeat skipped` avec `reason=no-tasks-due` → `HEARTBEAT.md` contient un bloc `tasks:`, mais aucune tâche n’est arrivée à échéance lors de cette impulsion.
    - `heartbeat: unknown accountId` → identifiant de compte non valide pour la cible de livraison de Heartbeat.
    - `heartbeat skipped` avec `reason=dm-blocked` → la cible de Heartbeat a été résolue vers une destination de type message privé alors que `agents.defaults.heartbeat.directPolicy` (ou le remplacement propre à l’agent) est défini sur `block`.

  </Accordion>
</AccordionGroup>

Voir aussi :

- [Heartbeat](/fr/gateway/heartbeat)
- [Tâches planifiées](/fr/automation/cron-jobs)
- [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting)

## Node associé, échec de l’outil

Si un Node est associé, mais que les outils échouent, isolez l’état de premier plan, des autorisations et de l’approbation.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Recherchez :

- Si le Node est en ligne avec les capacités attendues.
- Les autorisations du système d’exploitation pour la caméra, le microphone, la localisation et l’écran.
- L’état des approbations d’exécution et de la liste d’autorisation.

Signatures courantes :

- `NODE_BACKGROUND_UNAVAILABLE` → l’application du Node doit être au premier plan.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorisation du système d’exploitation manquante.
- `SYSTEM_RUN_DENIED: approval required` → approbation d’exécution en attente.
- `SYSTEM_RUN_DENIED: allowlist miss` → commande bloquée par la liste d’autorisation.

Voir aussi :

- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Dépannage des Nodes](/fr/nodes/troubleshooting)
- [Nodes](/fr/nodes/index)

## Échec de l’outil de navigation

À utiliser lorsque les actions de l’outil de navigation échouent alors que le gateway lui-même fonctionne correctement.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Recherchez :

- Si `plugins.allow` est défini et inclut `browser`.
- Un chemin valide vers l’exécutable du navigateur.
- L’accessibilité du profil CDP.
- La disponibilité locale de Chrome pour les profils `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Signatures du Plugin / de l’exécutable">
    - `unknown command "browser"` ou `unknown command 'browser'` → le Plugin de navigation intégré est exclu par `plugins.allow`.
    - Outil de navigation manquant / indisponible alors que `browser.enabled=true` → `plugins.allow` exclut `browser`, le Plugin n’a donc jamais été chargé.
    - `Failed to start Chrome CDP on port` → le processus du navigateur n’a pas pu démarrer.
    - `browser.executablePath not found` → le chemin configuré n’est pas valide.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge, tel que `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurée comporte un port incorrect ou hors plage.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installation actuelle du gateway ne contient pas la dépendance principale de l’environnement d’exécution du navigateur ; réinstallez ou mettez à jour OpenClaw, puis redémarrez le gateway. Les instantanés ARIA et les captures d’écran simples de pages peuvent encore fonctionner, mais la navigation, les instantanés IA, les captures d’écran d’éléments par sélecteur CSS et l’exportation PDF restent indisponibles.

  </Accordion>
  <Accordion title="Signatures de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP en mode existing-session n’a pas encore pu se connecter au répertoire de données du navigateur sélectionné. Ouvrez la page d’inspection du navigateur, activez le débogage distant, laissez le navigateur ouvert, approuvez la première demande de connexion, puis réessayez. Si l’état connecté n’est pas nécessaire, privilégiez le profil `openclaw` géré.
    - `No browser tabs found for profile="user"` → le profil de connexion Chrome MCP ne comporte aucun onglet Chrome local ouvert.
    - `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis l’hôte du gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil en mode connexion uniquement ne dispose d’aucune cible accessible, ou le point de terminaison HTTP a répondu, mais le WebSocket CDP n’a toujours pas pu être ouvert.

  </Accordion>
  <Accordion title="Signatures d’élément / de capture d’écran / de téléversement">
    - `fullPage is not supported for element screenshots` → la requête de capture d’écran a combiné `--full-page` avec `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → les appels de capture d’écran Chrome MCP / `existing-session` doivent utiliser la capture de page ou une `--ref` d’instantané, et non un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → les hooks de téléversement Chrome MCP nécessitent des références d’instantané, et non des sélecteurs CSS.
    - `existing-session file uploads currently support one file at a time.` → envoyez un téléversement par appel sur les profils Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → les hooks de boîte de dialogue des profils Chrome MCP ne prennent pas en charge les remplacements de délai d’expiration.
    - `existing-session type does not support timeoutMs overrides.` → omettez `timeoutMs` pour `act:type` sur les profils `profile="user"` / Chrome MCP existing-session, ou utilisez un profil de navigateur géré/CDP lorsqu’un délai d’expiration personnalisé est requis.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` nécessite toujours un navigateur géré ou un profil CDP brut.
    - Remplacements obsolètes de fenêtre d’affichage / mode sombre / paramètres régionaux / mode hors ligne sur les profils en mode connexion uniquement ou CDP distant → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation Playwright/CDP sans redémarrer l’ensemble du gateway.

  </Accordion>
</AccordionGroup>

Voir aussi :

- [Navigateur (géré par OpenClaw)](/fr/tools/browser)
- [Dépannage du navigateur](/fr/tools/browser-linux-troubleshooting)

## Si vous avez effectué une mise à niveau et qu’un élément a soudainement cessé de fonctionner

La plupart des dysfonctionnements après une mise à niveau proviennent d’une dérive de configuration ou de valeurs par défaut plus strictes désormais appliquées.

<AccordionGroup>
  <Accordion title="1. Le comportement du remplacement de l’authentification et de l’URL a changé">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Éléments à vérifier :

    - Si `gateway.mode=remote`, les appels de la CLI peuvent cibler le service distant alors que votre service local fonctionne correctement.
    - Les appels comportant explicitement `--url` ne se replient pas sur les identifiants enregistrés.

    Signatures courantes :

    - `gateway connect failed:` → mauvaise URL cible.
    - `unauthorized` → point de terminaison accessible, mais authentification incorrecte.

  </Accordion>
  <Accordion title="2. Les garde-fous de liaison et d’authentification sont plus stricts">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Éléments à vérifier :

    - Les liaisons hors bouclage (`lan`, `tailnet`, `custom`) nécessitent un chemin d’authentification valide du gateway : authentification par jeton/mot de passe partagé, ou déploiement `trusted-proxy` hors bouclage correctement configuré.
    - Les anciennes clés comme `gateway.token` ne remplacent pas `gateway.auth.token`.

    Signatures courantes :

    - `refusing to bind gateway ... without auth` → liaison hors bouclage sans chemin d’authentification valide du gateway.
    - `Connectivity probe: failed` alors que l’environnement d’exécution fonctionne → gateway actif, mais inaccessible avec l’authentification ou l’URL actuelle.

  </Accordion>
  <Accordion title="3. L’état d’association et d’identité de l’appareil a changé">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Éléments à vérifier :

    - Les approbations d’appareils en attente pour le tableau de bord et les Nodes.
    - Les approbations d’association de messages privés en attente après des modifications de stratégie ou d’identité.

    Signatures courantes :

    - `device identity required` → authentification de l’appareil non satisfaite.
    - `pairing required` → l’expéditeur ou l’appareil doit être approuvé.

  </Accordion>
</AccordionGroup>

Si la configuration du service et l’environnement d’exécution divergent encore après ces vérifications, réinstallez les métadonnées du service depuis le même répertoire de profil/d’état :

```bash
openclaw gateway install --force
openclaw gateway restart
```

Voir aussi :

- [Authentification](/fr/gateway/authentication)
- [Exécution en arrière-plan et outil de processus](/fr/gateway/background-process)
- [Association des Nodes](/fr/gateway/pairing)

## Voir aussi

- [Doctor](/fr/gateway/doctor)
- [FAQ](/fr/help/faq)
- [Guide opérationnel du Gateway](/fr/gateway)
