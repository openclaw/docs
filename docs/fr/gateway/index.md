---
read_when:
    - Exécution ou débogage du processus Gateway
summary: Guide opérationnel du service Gateway, de son cycle de vie et de ses opérations
title: Guide d’exploitation du Gateway
x-i18n:
    generated_at: "2026-04-30T07:27:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Utilisez cette page pour le démarrage du jour 1 et les opérations du jour 2 du service Gateway.

<CardGroup cols={2}>
  <Card title="Dépannage approfondi" icon="siren" href="/fr/gateway/troubleshooting">
    Diagnostics axés sur les symptômes avec des séquences de commandes exactes et des signatures de journaux.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Guide de configuration orienté tâches + référence de configuration complète.
  </Card>
  <Card title="Gestion des secrets" icon="key-round" href="/fr/gateway/secrets">
    Contrat SecretRef, comportement des instantanés d’exécution et opérations de migration/rechargement.
  </Card>
  <Card title="Contrat de plan des secrets" icon="shield-check" href="/fr/gateway/secrets-plan-contract">
    Règles exactes de cible/chemin de `secrets apply` et comportement des profils d’authentification par référence uniquement.
  </Card>
</CardGroup>

## Démarrage local en 5 minutes

<Steps>
  <Step title="Démarrer le Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Vérifier l’état du service">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Référence saine : `Runtime: running`, `Connectivity probe: ok` et `Capability: ...` qui correspond à ce que vous attendez. Utilisez `openclaw gateway status --require-rpc` lorsque vous avez besoin d’une preuve RPC en portée lecture, pas seulement d’une accessibilité.

  </Step>

  <Step title="Valider la disponibilité du canal">

```bash
openclaw channels status --probe
```

Avec un Gateway joignable, cette commande exécute des sondes de canal en direct par compte ainsi que des audits facultatifs.
Si le Gateway est injoignable, la CLI revient à des résumés de canaux basés uniquement sur la configuration au lieu de la sortie des sondes en direct.

  </Step>
</Steps>

<Note>
Le rechargement de la configuration du Gateway surveille le chemin du fichier de configuration actif (résolu à partir des valeurs par défaut du profil/de l’état, ou de `OPENCLAW_CONFIG_PATH` lorsqu’il est défini).
Le mode par défaut est `gateway.reload.mode="hybrid"`.
Après le premier chargement réussi, le processus en cours sert l’instantané actif de configuration en mémoire ; un rechargement réussi remplace cet instantané atomiquement.
</Note>

## Modèle d’exécution

- Un processus toujours actif pour le routage, le plan de contrôle et les connexions de canaux.
- Port multiplexé unique pour :
  - Contrôle/RPC WebSocket
  - API HTTP, compatibles OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Interface de contrôle et hooks
- Mode de liaison par défaut : `loopback`.
- L’authentification est requise par défaut. Les configurations à secret partagé utilisent
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), et les configurations de proxy inverse hors loopback
  peuvent utiliser `gateway.auth.mode: "trusted-proxy"`.

## Points de terminaison compatibles OpenAI

La surface de compatibilité à plus fort impact d’OpenClaw est maintenant :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Pourquoi cet ensemble est important :

- La plupart des intégrations Open WebUI, LobeChat et LibreChat sondent d’abord `/v1/models`.
- De nombreux pipelines RAG et de mémoire attendent `/v1/embeddings`.
- Les clients natifs pour agents préfèrent de plus en plus `/v1/responses`.

Note de planification :

- `/v1/models` est axé agent : il renvoie `openclaw`, `openclaw/default` et `openclaw/<agentId>`.
- `openclaw/default` est l’alias stable qui pointe toujours vers l’agent par défaut configuré.
- Utilisez `x-openclaw-model` lorsque vous voulez remplacer le fournisseur/modèle backend ; sinon, la configuration normale du modèle et des embeddings de l’agent sélectionné reste aux commandes.

Tous ces éléments fonctionnent sur le port principal du Gateway et utilisent la même frontière d’authentification d’opérateur de confiance que le reste de l’API HTTP du Gateway.

### Priorité du port et de la liaison

| Paramètre    | Ordre de résolution                                         |
| ------------ | ----------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode de liaison | CLI/remplacement → `gateway.bind` → `loopback`           |

Les services Gateway installés enregistrent le `--port` résolu dans les métadonnées du superviseur. Après avoir modifié `gateway.port`, exécutez `openclaw doctor --fix` ou `openclaw gateway install --force` afin que launchd/systemd/schtasks démarre le processus sur le nouveau port.

Le démarrage du Gateway utilise le même port et la même liaison effectifs lorsqu’il initialise les origines locales
de l’interface de contrôle pour les liaisons hors loopback. Par exemple, `--bind lan --port 3000`
initialise `http://localhost:3000` et `http://127.0.0.1:3000` avant l’exécution de la
validation à l’exécution. Ajoutez explicitement toute origine de navigateur distante, comme des URL de proxy HTTPS, à
`gateway.controlUi.allowedOrigins`.

### Modes de rechargement à chaud

| `gateway.reload.mode` | Comportement                              |
| --------------------- | ----------------------------------------- |
| `off`                 | Aucun rechargement de configuration       |
| `hot`                 | Applique uniquement les changements sûrs à chaud |
| `restart`             | Redémarre en cas de changements nécessitant un rechargement |
| `hybrid` (par défaut) | Applique à chaud quand c’est sûr, redémarre quand c’est requis |

## Ensemble de commandes opérateur

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` sert à la découverte supplémentaire de services (LaunchDaemons/unités système systemd/schtasks), pas à une sonde de santé RPC plus approfondie.

## Plusieurs gateways (même hôte)

La plupart des installations doivent exécuter un Gateway par machine. Un seul Gateway peut héberger plusieurs
agents et canaux.

Vous n’avez besoin de plusieurs gateways que si vous souhaitez intentionnellement une isolation ou un bot de secours.

Vérifications utiles :

```bash
openclaw gateway status --deep
openclaw gateway probe
```

À quoi s’attendre :

- `gateway status --deep` peut signaler `Other gateway-like services detected (best effort)`
  et afficher des conseils de nettoyage lorsque d’anciennes installations launchd/systemd/schtasks sont encore présentes.
- `gateway probe` peut avertir de `multiple reachable gateways` lorsque plus d’une cible
  répond.
- Si c’est intentionnel, isolez les ports, la configuration/l’état et les racines d’espace de travail par Gateway.

Liste de contrôle par instance :

- `gateway.port` unique
- `OPENCLAW_CONFIG_PATH` unique
- `OPENCLAW_STATE_DIR` unique
- `agents.defaults.workspace` unique

Exemple :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configuration détaillée : [/gateway/multiple-gateways](/fr/gateway/multiple-gateways).

## Point de terminaison de cerveau temps réel VoiceClaw

OpenClaw expose un point de terminaison WebSocket temps réel compatible VoiceClaw à
`/voiceclaw/realtime`. Utilisez-le lorsqu’un client de bureau VoiceClaw doit parler
directement à un cerveau OpenClaw temps réel au lieu de passer par un processus relais
séparé.

Le point de terminaison utilise Gemini Live pour l’audio temps réel et appelle OpenClaw comme
cerveau en exposant directement les outils OpenClaw à Gemini Live. Les appels d’outils renvoient un
résultat `working` immédiat pour préserver la réactivité du tour vocal, puis OpenClaw
exécute l’outil réel de façon asynchrone et réinjecte le résultat dans la
session en direct. Définissez `GEMINI_API_KEY` dans l’environnement du processus Gateway. Si
l’authentification Gateway est activée, le client de bureau envoie le jeton ou le mot de passe du Gateway
dans son premier message `session.config`.

L’accès au cerveau temps réel exécute des commandes d’agent OpenClaw autorisées par le propriétaire. Limitez
`gateway.auth.mode: "none"` aux instances de test loopback uniquement. Les connexions
non locales au cerveau temps réel nécessitent l’authentification Gateway.

Pour un Gateway de test isolé, exécutez une instance séparée avec son propre port, sa configuration
et son état :

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Configurez ensuite VoiceClaw pour utiliser :

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Accès distant

Préféré : Tailscale/VPN.
Solution de repli : tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Connectez ensuite les clients localement à `ws://127.0.0.1:18789`.

<Warning>
Les tunnels SSH ne contournent pas l’authentification Gateway. Pour l’authentification à secret partagé, les clients doivent toujours
envoyer `token`/`password`, même via le tunnel. Pour les modes porteurs d’identité,
la requête doit toujours satisfaire ce chemin d’authentification.
</Warning>

Voir : [Gateway distant](/fr/gateway/remote), [Authentification](/fr/gateway/authentication), [Tailscale](/fr/gateway/tailscale).

## Supervision et cycle de vie du service

Utilisez des exécutions supervisées pour une fiabilité proche de la production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Utilisez `openclaw gateway restart` pour les redémarrages. N’enchaînez pas `openclaw gateway stop` et `openclaw gateway start` ; sur macOS, `gateway stop` désactive intentionnellement le LaunchAgent avant de l’arrêter.

Les libellés LaunchAgent sont `ai.openclaw.gateway` (par défaut) ou `ai.openclaw.<profile>` (profil nommé). `openclaw doctor` audite et répare les dérives de configuration du service.

  </Tab>

  <Tab title="Linux (utilisateur systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Pour la persistance après déconnexion, activez le lingering :

```bash
sudo loginctl enable-linger <user>
```

Exemple d’unité utilisateur manuelle lorsque vous avez besoin d’un chemin d’installation personnalisé :

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
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

Le démarrage géré natif de Windows utilise une tâche planifiée nommée `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` pour les profils nommés). Si la création de la tâche planifiée
est refusée, OpenClaw revient à un lanceur par utilisateur dans le dossier de démarrage
qui pointe vers `gateway.cmd` dans le répertoire d’état.

  </Tab>

  <Tab title="Linux (service système)">

Utilisez une unité système pour les hôtes multi-utilisateurs/toujours actifs.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Utilisez le même corps de service que l’unité utilisateur, mais installez-le sous
`/etc/systemd/system/openclaw-gateway[-<profile>].service` et ajustez
`ExecStart=` si votre binaire `openclaw` se trouve ailleurs.

Ne laissez pas également `openclaw doctor --fix` installer un service Gateway au niveau utilisateur pour le même profil/port. Doctor refuse cette installation automatique lorsqu’il trouve un service Gateway OpenClaw au niveau système ; utilisez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsque l’unité système possède le cycle de vie.

  </Tab>
</Tabs>

## Chemin rapide du profil de développement

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Les valeurs par défaut incluent un état/une configuration isolés et le port Gateway de base `19001`.

## Référence rapide du protocole (vue opérateur)

- La première trame client doit être `connect`.
- Le Gateway renvoie un instantané `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/politique).
- `hello-ok.features.methods` / `events` sont une liste de découverte prudente, pas
  un vidage généré de chaque route d’assistance appelable.
- Requêtes : `req(method, params)` → `res(ok/payload|error)`.
- Les événements courants incluent `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, les événements du cycle de vie d’appairage/approbation, et `shutdown`.

Les exécutions d’agent se déroulent en deux étapes :

1. Accusé de réception accepté immédiat (`status:"accepted"`)
2. Réponse finale d’achèvement (`status:"ok"|"error"`), avec des événements `agent` diffusés entre les deux.

Voir la documentation complète du protocole : [Protocole Gateway](/fr/gateway/protocol).

## Vérifications opérationnelles

### Vivacité

- Ouvrez WS et envoyez `connect`.
- Attendez une réponse `hello-ok` avec un instantané.

### État de préparation

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Récupération des écarts

Les événements ne sont pas rejoués. En cas d’écarts de séquence, actualisez l’état (`health`, `system-presence`) avant de continuer.

## Signatures de défaillance courantes

| Signature                                                      | Problème probable                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Liaison hors local loopback sans chemin d’authentification Gateway valide     |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflit de port                                                               |
| `Gateway start blocked: set gateway.mode=local`                | Configuration définie en mode distant, ou marqueur de mode local manquant dans une configuration endommagée |
| `unauthorized` during connect                                  | Incompatibilité d’authentification entre le client et le Gateway              |

Pour les procédures de diagnostic complètes, utilisez [Dépannage Gateway](/fr/gateway/troubleshooting).

## Garanties de sécurité

- Les clients du protocole Gateway échouent rapidement lorsque le Gateway est indisponible (pas de repli implicite vers un canal direct).
- Les premières trames invalides ou non-connect sont rejetées et fermées.
- L’arrêt gracieux émet l’événement `shutdown` avant la fermeture du socket.

---

Connexe :

- [Dépannage](/fr/gateway/troubleshooting)
- [Processus en arrière-plan](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Santé](/fr/gateway/health)
- [Doctor](/fr/gateway/doctor)
- [Authentification](/fr/gateway/authentication)

## Connexe

- [Configuration](/fr/gateway/configuration)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
- [Accès distant](/fr/gateway/remote)
- [Gestion des secrets](/fr/gateway/secrets)
