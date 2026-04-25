---
read_when:
    - Exécution ou débogage du processus Gateway
summary: Runbook pour le service Gateway, son cycle de vie et ses opérations
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Utilisez cette page pour le démarrage du jour 1 et les opérations du jour 2 du service Gateway.

<CardGroup cols={2}>
  <Card title="Dépannage approfondi" icon="siren" href="/fr/gateway/troubleshooting">
    Diagnostics orientés symptômes avec suites de commandes exactes et signatures de journaux.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Guide de configuration orienté tâches + référence de configuration complète.
  </Card>
  <Card title="Gestion des secrets" icon="key-round" href="/fr/gateway/secrets">
    Contrat SecretRef, comportement des instantanés de runtime, et opérations de migration/rechargement.
  </Card>
  <Card title="Contrat du plan secrets" icon="shield-check" href="/fr/gateway/secrets-plan-contract">
    Règles exactes de cible/chemin pour `secrets apply` et comportement des profils d’authentification uniquement par référence.
  </Card>
</CardGroup>

## Démarrage local en 5 minutes

<Steps>
  <Step title="Démarrer la Gateway">

```bash
openclaw gateway --port 18789
# debug/trace reflétés vers stdio
openclaw gateway --port 18789 --verbose
# force l’arrêt du listener sur le port sélectionné, puis démarre
openclaw gateway --force
```

  </Step>

  <Step title="Vérifier l’état du service">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Base saine : `Runtime: running`, `Connectivity probe: ok` et `Capability: ...` correspondant à ce que vous attendez. Utilisez `openclaw gateway status --require-rpc` lorsque vous avez besoin d’une preuve RPC de portée lecture, pas seulement de joignabilité.

  </Step>

  <Step title="Valider la disponibilité des canaux">

```bash
openclaw channels status --probe
```

Avec une Gateway joignable, cela exécute des sondes live de canal par compte ainsi que des audits facultatifs.
Si la Gateway est injoignable, la CLI revient à des résumés de canaux basés uniquement sur la configuration au lieu de la sortie de sondes live.

  </Step>
</Steps>

<Note>
Le rechargement de configuration de la Gateway surveille le chemin du fichier de configuration actif (résolu à partir des valeurs par défaut du profil/de l’état, ou `OPENCLAW_CONFIG_PATH` lorsqu’il est défini).
Le mode par défaut est `gateway.reload.mode="hybrid"`.
Après le premier chargement réussi, le processus en cours sert l’instantané de configuration actif en mémoire ; un rechargement réussi remplace cet instantané de manière atomique.
</Note>

## Modèle de runtime

- Un processus toujours actif pour le routage, le plan de contrôle et les connexions de canal.
- Un seul port multiplexé pour :
  - le contrôle/RPC WebSocket
  - les API HTTP, compatibles OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - le Control UI et les hooks
- Mode de bind par défaut : `loopback`.
- L’authentification est requise par défaut. Les configurations à secret partagé utilisent
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), et les configurations
  de reverse proxy non-loopback peuvent utiliser `gateway.auth.mode: "trusted-proxy"`.

## Points de terminaison compatibles OpenAI

La surface de compatibilité à plus fort levier d’OpenClaw est désormais :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Pourquoi cet ensemble est important :

- La plupart des intégrations Open WebUI, LobeChat et LibreChat sondent d’abord `/v1/models`.
- De nombreux pipelines RAG et de mémoire attendent `/v1/embeddings`.
- Les clients natifs d’agent préfèrent de plus en plus `/v1/responses`.

Remarque de planification :

- `/v1/models` est orienté agent : il renvoie `openclaw`, `openclaw/default` et `openclaw/<agentId>`.
- `openclaw/default` est l’alias stable qui pointe toujours vers l’agent par défaut configuré.
- Utilisez `x-openclaw-model` lorsque vous souhaitez un remplacement du backend fournisseur/modèle ; sinon la configuration normale du modèle et des embeddings de l’agent sélectionné garde le contrôle.

Tous ces points de terminaison s’exécutent sur le port principal de la Gateway et utilisent la même frontière d’authentification d’opérateur de confiance que le reste de l’API HTTP Gateway.

### Priorité du port et du bind

| Paramètre      | Ordre de résolution                                            |
| -------------- | -------------------------------------------------------------- |
| Port Gateway   | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode de bind   | CLI/remplacement → `gateway.bind` → `loopback`                |

### Modes de rechargement à chaud

| `gateway.reload.mode` | Comportement                                 |
| --------------------- | -------------------------------------------- |
| `off`                 | Pas de rechargement de configuration         |
| `hot`                 | N’applique que les changements hot-safe      |
| `restart`             | Redémarre lors des changements exigeant un rechargement |
| `hybrid` (par défaut) | Applique à chaud quand c’est sûr, redémarre quand nécessaire |

## Ensemble de commandes opérateur

```bash
openclaw gateway status
openclaw gateway status --deep   # ajoute une analyse de service au niveau système
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` sert à une découverte de service supplémentaire (LaunchDaemons/unités système systemd/
schtasks), pas à une sonde d’état RPC plus approfondie.

## Plusieurs Gateways (même hôte)

La plupart des installations devraient exécuter une seule Gateway par machine. Une Gateway unique peut héberger plusieurs
agents et canaux.

Vous n’avez besoin de plusieurs Gateways que lorsque vous voulez intentionnellement une isolation ou un bot de secours.

Vérifications utiles :

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Ce à quoi s’attendre :

- `gateway status --deep` peut signaler `Other gateway-like services detected (best effort)`
  et afficher des indications de nettoyage lorsque d’anciennes installations launchd/systemd/schtasks sont toujours présentes.
- `gateway probe` peut avertir `multiple reachable gateways` lorsque plus d’une cible
  répond.
- Si c’est intentionnel, isolez les ports, la configuration/l’état et les racines d’espace de travail pour chaque Gateway.

Checklist par instance :

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

## Point de terminaison brain temps réel VoiceClaw

OpenClaw expose un point de terminaison WebSocket temps réel compatible VoiceClaw à
`/voiceclaw/realtime`. Utilisez-le lorsqu’un client desktop VoiceClaw doit parler
directement à un brain OpenClaw temps réel au lieu de passer par un processus relais
séparé.

Le point de terminaison utilise Gemini Live pour l’audio temps réel et appelle OpenClaw comme
brain en exposant directement les outils OpenClaw à Gemini Live. Les appels d’outils renvoient un
résultat immédiat `working` pour garder le tour vocal réactif, puis OpenClaw
exécute l’outil réel de façon asynchrone et réinjecte le résultat dans la
session live. Définissez `GEMINI_API_KEY` dans l’environnement du processus Gateway. Si
l’authentification Gateway est activée, le client desktop envoie le jeton ou le mot de passe Gateway
dans son premier message `session.config`.

L’accès au brain temps réel exécute des commandes d’agent OpenClaw autorisées par le propriétaire. Limitez
`gateway.auth.mode: "none"` aux seules instances de test loopback. Les connexions non locales
au brain temps réel nécessitent l’authentification Gateway.

Pour une Gateway de test isolée, exécutez une instance séparée avec son propre port, sa propre configuration
et son propre état :

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
Repli : tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Connectez ensuite les clients localement à `ws://127.0.0.1:18789`.

<Warning>
Les tunnels SSH ne contournent pas l’authentification Gateway. Pour l’authentification à secret partagé, les clients
doivent toujours envoyer `token`/`password`, même via le tunnel. Pour les modes porteurs d’identité,
la requête doit toujours satisfaire à ce chemin d’authentification.
</Warning>

Voir : [Gateway distante](/fr/gateway/remote), [Authentification](/fr/gateway/authentication), [Tailscale](/fr/gateway/tailscale).

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

Les labels LaunchAgent sont `ai.openclaw.gateway` (par défaut) ou `ai.openclaw.<profile>` (profil nommé). `openclaw doctor` audite et répare la dérive de configuration du service.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Pour la persistance après déconnexion, activez lingering :

```bash
sudo loginctl enable-linger <user>
```

Exemple manuel d’unité utilisateur lorsque vous avez besoin d’un chemin d’installation personnalisé :

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

Le démarrage géré natif sous Windows utilise une tâche planifiée nommée `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` pour les profils nommés). Si la création de la tâche planifiée
est refusée, OpenClaw revient à un lanceur par utilisateur dans le dossier Startup
pointant vers `gateway.cmd` dans le répertoire d’état.

  </Tab>

  <Tab title="Linux (service système)">

Utilisez une unité système pour les hôtes multi-utilisateurs/toujours actifs.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Utilisez le même corps de service que pour l’unité utilisateur, mais installez-le sous
`/etc/systemd/system/openclaw-gateway[-<profile>].service` et ajustez
`ExecStart=` si votre binaire `openclaw` se trouve ailleurs.

  </Tab>
</Tabs>

## Chemin rapide du profil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Les valeurs par défaut incluent un état/une configuration isolés et un port Gateway de base `19001`.

## Référence rapide du protocole (vue opérateur)

- La première trame client doit être `connect`.
- La Gateway renvoie un instantané `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/politique).
- `hello-ok.features.methods` / `events` est une liste de découverte conservatrice, pas
  un dump généré de chaque route utilitaire appelable.
- Requêtes : `req(method, params)` → `res(ok/payload|error)`.
- Les événements courants incluent `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, les événements de cycle de vie d’appairage/d’approbation, et `shutdown`.

Les exécutions d’agent se font en deux étapes :

1. Accusé de réception immédiat accepté (`status:"accepted"`)
2. Réponse finale d’achèvement (`status:"ok"|"error"`), avec des événements `agent` streamés entre les deux.

Voir la documentation complète du protocole : [Protocole Gateway](/fr/gateway/protocol).

## Vérifications opérationnelles

### Vivacité

- Ouvrez un WS et envoyez `connect`.
- Attendez une réponse `hello-ok` avec instantané.

### Disponibilité

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Récupération après trou

Les événements ne sont pas rejoués. En cas de trous de séquence, actualisez l’état (`health`, `system-presence`) avant de continuer.

## Signatures d’échec courantes

| Signature                                                      | Problème probable                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non-loopback sans chemin d’authentification Gateway valide                  |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflit de port                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Configuration définie sur le mode distant, ou tampon de mode local manquant dans une configuration endommagée |
| `unauthorized` during connect                                  | Incohérence d’authentification entre le client et la Gateway                     |

Pour les suites complètes de diagnostic, utilisez [Dépannage Gateway](/fr/gateway/troubleshooting).

## Garanties de sécurité

- Les clients du protocole Gateway échouent rapidement lorsque la Gateway est indisponible (aucun repli implicite direct-channel).
- Les premières trames invalides/non `connect` sont rejetées et la connexion est fermée.
- Un arrêt gracieux émet l’événement `shutdown` avant la fermeture du socket.

---

Associé :

- [Dépannage](/fr/gateway/troubleshooting)
- [Processus d’arrière-plan](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Health](/fr/gateway/health)
- [Doctor](/fr/gateway/doctor)
- [Authentification](/fr/gateway/authentication)

## Associé

- [Configuration](/fr/gateway/configuration)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
- [Accès distant](/fr/gateway/remote)
- [Gestion des secrets](/fr/gateway/secrets)
