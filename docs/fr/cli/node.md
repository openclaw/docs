---
read_when:
    - Exécution de l’hôte Node sans interface
    - Appairage d’un Node non macOS pour system.run
summary: Référence CLI pour `openclaw node` (hôte Node sans interface)
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Exécute un **hôte Node sans interface** qui se connecte au WebSocket Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte Node ?

Utilisez un hôte Node lorsque vous voulez que des agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’usage courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de build, machines de labo, NAS).
- Garder exec **isolé** sur la Gateway, mais déléguer les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et sans interface pour l’automatisation ou les nœuds de CI.

L’exécution reste protégée par les **approbations exec** et les listes d’autorisations par agent sur l’hôte
Node, ce qui vous permet de conserver un accès aux commandes limité et explicite.

## Proxy navigateur (zéro configuration)

Les hôtes Node annoncent automatiquement un proxy navigateur si `browser.enabled` n’est pas
désactivé sur le nœud. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce nœud
sans configuration supplémentaire.

Par défaut, le proxy expose la surface normale des profils de navigateur du nœud. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils non autorisés est rejeté, et les routes persistantes de
création/suppression de profil sont bloquées via le proxy.

Désactivez-le sur le nœud si nécessaire :

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

Options :

- `--host <host>` : hôte WebSocket Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplace l’identifiant du nœud (efface le jeton d’appairage)
- `--display-name <name>` : remplace le nom d’affichage du nœud

## Authentification Gateway pour l’hôte Node

`openclaw node run` et `openclaw node install` résolvent l’authentification Gateway depuis la configuration/l’environnement (pas d’options `--token`/`--password` sur les commandes node) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Puis repli sur la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node n’hérite volontairement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution d’authentification node échoue de manière fermée (pas de masque par repli distant).
- En `gateway.mode=remote`, les champs client distant (`gateway.remote.token` / `gateway.remote.password`) sont également éligibles selon les règles de priorité distante.
- La résolution d’authentification de l’hôte Node ne respecte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un nœud se connectant à une Gateway `ws://` non loopback sur un réseau privé de confiance,
définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sans cela, le démarrage du nœud
échoue de manière fermée et vous demande d’utiliser `wss://`, un tunnel SSH ou Tailscale.
Il s’agit d’une activation explicite via l’environnement du processus, et non d’une clé de configuration `openclaw.json`.
`openclaw node install` la persiste dans le service de nœud supervisé lorsqu’elle est
présente dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte Node sans interface comme service utilisateur.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplace l’identifiant du nœud (efface le jeton d’appairage)
- `--display-name <name>` : remplace le nom d’affichage du nœud
- `--runtime <runtime>` : runtime du service (`node` ou `bun`)
- `--force` : réinstaller/écraser si déjà installé

Gérez le service :

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour un hôte Node au premier plan (sans service).

Les commandes de service acceptent `--json` pour une sortie lisible par machine.

L’hôte Node retente en interne les redémarrages de Gateway et les fermetures réseau. Si la
Gateway signale une pause terminale d’authentification token/mot de passe/bootstrap, l’hôte Node
journalise le détail de fermeture et quitte avec une valeur non nulle afin que launchd/systemd puisse le redémarrer avec
une configuration et des identifiants à jour. Les pauses nécessitant un appairage restent dans le flux
du premier plan afin que la demande en attente puisse être approuvée.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur la Gateway.
Approuvez-la via :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sur des réseaux de nœuds étroitement contrôlés, l’opérateur Gateway peut explicitement choisir
d’approuver automatiquement le premier appairage des nœuds depuis des CIDR de confiance :

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

Cela est désactivé par défaut. Cela s’applique uniquement au nouvel appairage `role: node` avec
aucune portée demandée. Les clients opérateur/navigateur, l’interface de contrôle, WebChat, ainsi que les
mises à niveau de rôle, portée, métadonnées ou clé publique nécessitent toujours une approbation manuelle.

Si le nœud retente l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique),
la précédente demande en attente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

L’hôte Node stocke son identifiant de nœud, son jeton, son nom d’affichage et les informations de connexion Gateway dans
`~/.openclaw/node.json`.

## Approbations exec

`system.run` est protégé par des approbations exec locales :

- `~/.openclaw/exec-approvals.json`
- [Approbations Exec](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifier depuis la Gateway)

Pour une exécution async de nœud approuvée, OpenClaw prépare un `systemRunPlan` canonique avant
de demander l’approbation. Le transfert `system.run` approuvé ultérieurement réutilise ce plan stocké,
donc les modifications des champs commande/cwd/session après la création de la demande d’approbation sont rejetées au lieu de modifier ce que le nœud exécute.

## Liens connexes

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)
