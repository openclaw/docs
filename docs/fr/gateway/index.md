---
read_when:
    - Exécution ou débogage du processus Gateway
summary: Guide d’exploitation du service Gateway, de son cycle de vie et de ses opérations
title: Guide d’exploitation du Gateway
x-i18n:
    generated_at: "2026-07-12T15:20:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Utilisez cette page pour le démarrage initial et l’exploitation courante du service Gateway.

<CardGroup cols={2}>
  <Card title="Dépannage approfondi" icon="siren" href="/fr/gateway/troubleshooting">
    Diagnostics axés sur les symptômes, avec des séquences de commandes exactes et des signatures de journaux.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Guide de configuration axé sur les tâches et référence complète de la configuration.
  </Card>
  <Card title="Gestion des secrets" icon="key-round" href="/fr/gateway/secrets">
    Contrat SecretRef, comportement des instantanés d’exécution et opérations de migration/rechargement.
  </Card>
  <Card title="Contrat du plan de secrets" icon="shield-check" href="/fr/gateway/secrets-plan-contract">
    Règles exactes de cible/chemin de `secrets apply` et comportement des profils d’authentification reposant uniquement sur des références.
  </Card>
</CardGroup>

## Démarrage local en 5 minutes

<Steps>
  <Step title="Démarrer le Gateway">

```bash
openclaw gateway --port 18789
# débogage/traçage répliqué vers les flux d’E/S standard
openclaw gateway --port 18789 --verbose
# arrêter de force le processus à l’écoute sur le port sélectionné, puis démarrer
openclaw gateway --force
```

  </Step>

  <Step title="Vérifier l’état du service">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

État sain de référence : `Runtime: running`, `Connectivity probe: ok` et une ligne `Capability` correspondant à vos attentes. Utilisez `openclaw gateway status --require-rpc` pour vérifier le RPC avec une portée de lecture, et pas seulement l’accessibilité.

  </Step>

  <Step title="Valider la disponibilité des canaux">

```bash
openclaw channels status --probe
```

Lorsque le Gateway est accessible, cette commande exécute des sondes de canal en direct pour chaque compte ainsi que des audits facultatifs. Si le Gateway est inaccessible, la CLI se rabat sur des récapitulatifs des canaux fondés uniquement sur la configuration.

  </Step>
</Steps>

<Note>
Le rechargement de la configuration du Gateway surveille le chemin du fichier de configuration actif (déterminé à partir des valeurs par défaut du profil/de l’état, ou de `OPENCLAW_CONFIG_PATH` lorsque cette variable est définie). Le mode par défaut est `gateway.reload.mode="hybrid"`. Après le premier chargement réussi, le processus en cours d’exécution utilise l’instantané actif de la configuration en mémoire ; un rechargement réussi remplace cet instantané de manière atomique.
</Note>

## Modèle d’exécution

- Un processus toujours actif pour le routage, le plan de contrôle et les connexions aux canaux.
- Un seul port multiplexé pour :
  - le contrôle/RPC WebSocket ;
  - les API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`) ;
  - les routes HTTP des Plugins, comme la route facultative `/api/v1/admin/rpc` ;
  - l’interface de contrôle et les hooks.
- Mode de liaison par défaut : `loopback`. Dans un environnement de conteneur détecté, la valeur par défaut effective est `auto` (résolue en `0.0.0.0` pour la redirection de ports), sauf si le service ou le funnel Tailscale est actif, auquel cas `loopback` est toujours imposé.
- L’authentification est requise par défaut. Les configurations à secret partagé utilisent `gateway.auth.token` / `gateway.auth.password` (ou `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), et les configurations de proxy inverse hors loopback peuvent utiliser `gateway.auth.mode: "trusted-proxy"`.

## Points de terminaison compatibles avec OpenAI

La surface de compatibilité d’OpenClaw offrant le plus d’impact :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Pourquoi cet ensemble est important :

- La plupart des intégrations Open WebUI, LobeChat et LibreChat interrogent d’abord `/v1/models`.
- De nombreux pipelines RAG et de mémoire attendent `/v1/embeddings`.
- Les clients natifs pour agents privilégient de plus en plus `/v1/responses`.

`/v1/models` est centré sur les agents : il renvoie `openclaw`, `openclaw/default` et `openclaw/<agentId>` pour chaque agent configuré. `openclaw/default` est l’alias stable qui correspond toujours à l’agent par défaut configuré. Envoyez `x-openclaw-model` lorsque vous souhaitez remplacer le fournisseur/modèle du backend ; sinon, la configuration normale du modèle et des embeddings de l’agent sélectionné reste utilisée.

Tous ces points de terminaison s’exécutent sur le port principal du Gateway et utilisent la même frontière d’authentification d’opérateur de confiance que le reste de l’API HTTP du Gateway.

Le RPC HTTP d’administration (`POST /api/v1/admin/rpc`) est une route de Plugin distincte, désactivée par défaut, destinée aux outils de l’hôte qui ne peuvent pas utiliser le RPC WebSocket. Consultez [RPC HTTP d’administration](/fr/plugins/admin-http-rpc).

### Priorité du port et de la liaison

| Paramètre       | Ordre de résolution                                                       |
| --------------- | ------------------------------------------------------------------------- |
| Port du Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`             |
| Mode de liaison | CLI/remplacement → `gateway.bind` → `loopback` (ou `auto` en conteneur)   |

Les services Gateway installés enregistrent la valeur résolue de `--port` dans les métadonnées du superviseur. Après avoir modifié `gateway.port`, exécutez `openclaw doctor --fix` ou `openclaw gateway install --force` afin que launchd/systemd/schtasks démarre le processus sur le nouveau port.

Au démarrage, le Gateway utilise le même port et le même mode de liaison effectifs lorsqu’il initialise les origines locales de l’interface de contrôle pour les liaisons hors loopback. Par exemple, `--bind lan --port 3000` initialise `http://localhost:3000` et `http://127.0.0.1:3000` avant l’exécution de la validation. Ajoutez explicitement toute origine de navigateur distant, comme les URL de proxy HTTPS, à `gateway.controlUi.allowedOrigins`.

### Modes de rechargement à chaud

| `gateway.reload.mode` | Comportement                                                        |
| --------------------- | ------------------------------------------------------------------- |
| `off`                 | Aucun rechargement de la configuration                              |
| `hot`                 | Appliquer uniquement les modifications compatibles à chaud          |
| `restart`             | Redémarrer en cas de modifications nécessitant un redémarrage       |
| `hybrid` (par défaut) | Appliquer à chaud si possible, redémarrer lorsque cela est nécessaire |

## Ensemble de commandes pour l’opérateur

```bash
openclaw gateway status
openclaw gateway status --deep   # ajoute une analyse du service au niveau système
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` sert à effectuer une détection supplémentaire des services (LaunchDaemons/unités système systemd/schtasks), et non une vérification plus approfondie de l’état du RPC.

## Plusieurs Gateways (sur le même hôte)

La plupart des installations doivent exécuter un seul Gateway par machine. Un seul Gateway peut héberger plusieurs agents et canaux. Vous n’avez besoin de plusieurs Gateways que si vous souhaitez délibérément les isoler ou disposer d’un bot de secours.

Vérifications utiles :

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Résultats attendus :

- `gateway status --deep` peut signaler `Other gateway-like services detected (best effort)` et afficher des indications de nettoyage lorsque d’anciennes installations launchd/systemd/schtasks sont toujours présentes.
- `gateway probe` peut avertir de la présence de `multiple reachable gateway identities` lorsque plusieurs Gateways distincts répondent, ou lorsqu’OpenClaw ne peut pas prouver que les cibles accessibles correspondent au même Gateway. Un tunnel SSH, une URL de proxy ou une URL distante configurée vers le même Gateway correspond à un seul Gateway utilisant plusieurs transports, même lorsque les ports de transport diffèrent.
- Si cela est intentionnel, isolez les ports, la configuration/l’état et les racines des espaces de travail pour chaque Gateway.

Liste de contrôle par instance :

- Valeur `gateway.port` unique
- Valeur `OPENCLAW_CONFIG_PATH` unique
- Valeur `OPENCLAW_STATE_DIR` unique
- Valeur `agents.defaults.workspace` unique

Exemple :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configuration détaillée : [/gateway/multiple-gateways](/fr/gateway/multiple-gateways).

## Accès distant

Option recommandée : Tailscale/VPN.
Solution de repli : tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Connectez ensuite localement les clients à `ws://127.0.0.1:18789`.

<Warning>
Les tunnels SSH ne contournent pas l’authentification du Gateway. Pour l’authentification à secret partagé, les clients doivent toujours
envoyer `token`/`password`, même via le tunnel. Pour les modes porteurs d’identité,
la requête doit toujours satisfaire ce parcours d’authentification.
</Warning>

Consultez : [Gateway distant](/fr/gateway/remote), [Authentification](/fr/gateway/authentication), [Tailscale](/fr/gateway/tailscale).

## Supervision et cycle de vie du service

Utilisez des exécutions supervisées pour obtenir une fiabilité proche de celle d’un environnement de production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Utilisez `openclaw gateway restart` pour les redémarrages. N’enchaînez pas `openclaw gateway stop` et `openclaw gateway start` pour remplacer un redémarrage.

Sous macOS, `gateway stop` utilise `launchctl bootout` par défaut. Cela supprime le LaunchAgent de la session de démarrage actuelle sans conserver un état désactivé, de sorte que la récupération automatique KeepAlive continue de fonctionner après les arrêts inattendus et que `gateway start` le réactive correctement. Pour empêcher durablement le redémarrage automatique après les redémarrages du système, transmettez `--disable` : `openclaw gateway stop --disable`.

Les libellés LaunchAgent sont `ai.openclaw.gateway` (par défaut) ou `ai.openclaw.<profile>` (profil nommé). `openclaw doctor` audite et corrige les dérives de la configuration du service.

  </Tab>

  <Tab title="Linux (systemd utilisateur)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Pour assurer la persistance après la déconnexion, activez le maintien en arrière-plan :

```bash
sudo loginctl enable-linger $(whoami)
```

Sur un serveur sans interface graphique ni session de bureau, vérifiez également que `XDG_RUNTIME_DIR` est défini (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) avant de réessayer les commandes `systemctl --user`.

Exemple d’unité utilisateur manuelle lorsqu’un chemin d’installation personnalisé est nécessaire :

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (natif)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Sous Windows natif, le démarrage géré utilise une tâche planifiée nommée `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` pour les profils nommés). Si la création de la tâche planifiée
est refusée, OpenClaw se rabat sur un lanceur placé dans le dossier de démarrage de l’utilisateur
et pointant vers `gateway.cmd` dans le répertoire d’état.

  </Tab>

  <Tab title="Linux (service système)">

Utilisez une unité système pour les hôtes multi-utilisateurs/toujours actifs.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Utilisez le même contenu de service que pour l’unité utilisateur, mais installez-le sous
`/etc/systemd/system/openclaw-gateway[-<profile>].service` et ajustez
`ExecStart=` si votre binaire `openclaw` se trouve ailleurs.

Ne laissez pas également `openclaw doctor --fix` installer un service Gateway au niveau utilisateur pour le même profil/port. Doctor refuse cette installation automatique lorsqu’il détecte un service Gateway OpenClaw au niveau système ; utilisez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsque l’unité système gère le cycle de vie.

  </Tab>
</Tabs>

Les erreurs de configuration non valide entraînent une sortie avec le code `78`. Les unités systemd Linux utilisent `RestartPreventExitStatus=78` pour interrompre les relancements jusqu’à ce que la configuration soit corrigée. launchd et le Planificateur de tâches Windows ne disposent pas d’une règle équivalente d’arrêt selon le code de sortie ; le Gateway conserve donc également l’historique des démarrages incorrects rapprochés et désactive le démarrage automatique des comptes de canaux/fournisseurs après des échecs de démarrage répétés. Dans ce mode sécurisé, le plan de contrôle démarre toujours afin de permettre l’inspection et la réparation, les rechargements à chaud de la configuration et `secrets.reload` refusent les redémarrages automatiques des canaux, et une requête explicite `channels.start` de l’opérateur peut remplacer cette désactivation.

## Parcours rapide avec le profil de développement

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Les valeurs par défaut comprennent une configuration et un état isolés, ainsi que le port Gateway de base `19001`.

## Référence rapide du protocole (vue de l’opérateur)

- La première trame du client doit être `connect`.
- Le Gateway renvoie une trame `hello-ok` avec un `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`), ainsi que les limites de `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` constituent une liste de découverte prudente, et non
  une liste générée de toutes les routes auxiliaires pouvant être appelées.
- Requêtes : `req(method, params)` → `res(ok/payload|error)`.
- Les événements courants comprennent `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, l’événement facultatif
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, les événements du cycle de vie de l’appairage/de l’approbation et `shutdown`.

Les exécutions d’agent se déroulent en deux étapes :

1. Accusé de réception immédiat (`status:"accepted"`)
2. Réponse finale d’achèvement (`status:"ok"|"error"`), avec des événements `agent` diffusés entre les deux.

Consultez la documentation complète du protocole : [Protocole du Gateway](/fr/gateway/protocol).

## Vérifications opérationnelles

### Disponibilité

- Ouvrez une connexion WS et envoyez `connect`.
- Attendez une réponse `hello-ok` avec un instantané.

### État de préparation

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Récupération après une interruption

Les événements ne sont pas rejoués. En cas d’écart dans la séquence, actualisez l’état (`health`, `system-presence`) avant de continuer.

## Signatures d’échec courantes

| Signature                                                      | Problème probable                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Liaison hors boucle locale sans chemin d’authentification valide pour le Gateway     |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflit de port                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | Configuration définie en mode distant, ou `gateway.mode` absent d’une configuration endommagée |
| `unauthorized` during connect                                  | Incompatibilité d’authentification entre le client et le Gateway                     |

Pour consulter les procédures de diagnostic complètes, utilisez [Dépannage du Gateway](/fr/gateway/troubleshooting).

## Garanties de sécurité

- Les clients du protocole Gateway échouent immédiatement lorsque le Gateway est indisponible (aucun repli implicite vers un canal direct).
- Les premières trames non valides ou autres que des trames de connexion sont rejetées, puis la connexion est fermée.
- L’arrêt progressif émet l’événement `shutdown` avant la fermeture du socket.

## Voir aussi

- [Configuration](/fr/gateway/configuration)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
- [Processus en arrière-plan](/fr/gateway/background-process)
- [État de santé](/fr/gateway/health)
- [Doctor](/fr/gateway/doctor)
- [Authentification](/fr/gateway/authentication)
- [Accès distant](/fr/gateway/remote)
- [Gestion des secrets](/fr/gateway/secrets)
