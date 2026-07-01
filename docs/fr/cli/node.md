---
read_when:
    - Exécuter l’hôte Node sans interface graphique
    - Appairer un nœud non-macOS pour system.run
summary: Référence CLI pour `openclaw node` (hôte Node sans interface graphique)
title: Node
x-i18n:
    generated_at: "2026-07-01T12:59:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Exécutez un **hôte Node sans interface graphique** qui se connecte au WebSocket Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte Node ?

Utilisez un hôte Node lorsque vous voulez que les agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer l’application compagnon macOS complète.

Cas d’utilisation courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de build, machines de laboratoire, NAS).
- Garder l’exécution **isolée en sandbox** sur le Gateway, tout en déléguant les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et sans interface graphique pour l’automatisation ou les nœuds CI.

L’exécution reste protégée par les **approbations d’exécution** et les listes d’autorisation par agent sur
l’hôte Node, ce qui vous permet de garder l’accès aux commandes limité et explicite.

## Proxy de navigateur (zéro configuration)

Les hôtes Node annoncent automatiquement un proxy de navigateur si `browser.enabled` n’est pas
désactivé sur le nœud. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce nœud
sans configuration supplémentaire.

Par défaut, le proxy expose la surface de profil de navigateur normale du nœud. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils non présents dans la liste d’autorisation est rejeté, et les routes de
création/suppression de profils persistants sont bloquées via le proxy.

Désactivez-le sur le nœud si nécessaire :

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Exécuter (premier plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket Gateway (par défaut : `18789`)
- `--context-path <path>` : chemin de contexte WebSocket Gateway (par ex. `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’id du nœud (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du nœud

## Authentification Gateway pour l’hôte Node

`openclaw node run` et `openclaw node install` résolvent l’authentification Gateway depuis la config/l’environnement (pas de drapeaux `--token`/`--password` sur les commandes node) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Puis le repli sur la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node n’hérite intentionnellement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est configuré explicitement via SecretRef et n’est pas résolu, la résolution d’authentification du nœud échoue fermée (sans repli distant masquant).
- Dans `gateway.mode=remote`, les champs client distants (`gateway.remote.token` / `gateway.remote.password`) sont également éligibles selon les règles de précédence distante.
- La résolution d’authentification de l’hôte Node respecte uniquement les variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un nœud qui se connecte à un Gateway en clair `ws://`, les hôtes loopback, les littéraux d’IP privées,
`.local` et les hôtes Tailnet `*.ts.net` sont acceptés. Pour les autres noms
DNS privés de confiance, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ; sans
cela, le démarrage du nœud échoue fermé et vous demande d’utiliser `wss://`, un tunnel SSH ou
Tailscale. Il s’agit d’un opt-in par environnement de processus, pas d’une clé de configuration
`openclaw.json`.
`openclaw node install` le persiste dans le service Node supervisé lorsqu’il est
présent dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte Node sans interface graphique comme service utilisateur.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket Gateway (par défaut : `18789`)
- `--context-path <path>` : chemin de contexte WebSocket Gateway (par ex. `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’id du nœud (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du nœud
- `--runtime <runtime>` : runtime du service (`node` ou `bun`)
- `--force` : réinstaller/écraser si déjà installé

Gérer le service :

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour un hôte Node au premier plan (sans service).

Les commandes de service acceptent `--json` pour une sortie lisible par machine.

L’hôte Node retente les redémarrages de Gateway et les fermetures réseau dans le processus. Si le
Gateway signale une pause terminale d’authentification jeton/mot de passe/bootstrap, l’hôte Node
journalise le détail de fermeture et quitte avec un code non nul afin que launchd/systemd puisse le redémarrer avec
une configuration et des identifiants frais. Les pauses nécessitant un appairage restent dans le flux
au premier plan afin que la demande en attente puisse être approuvée.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur le Gateway.
Approuvez-la avec :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sur les réseaux de nœuds strictement contrôlés, l’opérateur du Gateway peut explicitement activer
l’approbation automatique du premier appairage de nœud depuis des CIDR de confiance :

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Cette option est désactivée par défaut. Elle s’applique uniquement à un nouvel appairage `role: node`
sans périmètres demandés. Les clients opérateur/navigateur, Control UI, WebChat, ainsi que les mises à niveau de rôle,
périmètre, métadonnées ou clé publique nécessitent toujours une approbation manuelle.

Si le nœud retente l’appairage avec des détails d’authentification modifiés (rôle/périmètres/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

L’hôte Node stocke son id de nœud, son jeton, son nom d’affichage et les informations de connexion au gateway dans
`~/.openclaw/node.json`.

## Approbations d’exécution

`system.run` est contrôlé par les approbations d’exécution locales :

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` lorsque la variable n’est pas définie
- [Approbations d’exécution](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifier depuis le Gateway)

Pour l’exécution Node asynchrone approuvée, OpenClaw prépare un `systemRunPlan` canonique
avant l’invite. Le transfert `system.run` approuvé ultérieurement réutilise ce plan
stocké, de sorte que les modifications des champs command/cwd/session après la création de la demande
d’approbation sont rejetées au lieu de changer ce que le nœud exécute.

## Connexe

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)
