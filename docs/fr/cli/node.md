---
read_when:
    - Exécution de l’hôte Node sans interface
    - Appairage d’un Node non macOS pour `system.run`
summary: Référence CLI pour `openclaw node` (hôte Node sans interface)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Exécute un **hôte Node sans interface** qui se connecte au WebSocket Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte node ?

Utilisez un hôte node lorsque vous voulez que des agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’usage courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de build, machines de labo, NAS).
- Garder exec **sandboxed** sur la passerelle, mais déléguer les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et sans interface pour l’automatisation ou les nœuds CI.

L’exécution reste protégée par les **approbations exec** et les listes d’autorisation par agent sur l’hôte
node, afin de garder l’accès aux commandes limité et explicite.

## Proxy navigateur (zéro configuration)

Les hôtes node annoncent automatiquement un proxy navigateur si `browser.enabled` n’est pas
désactivé sur le node. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce node
sans configuration supplémentaire.

Par défaut, le proxy expose la surface normale des profils de navigateur du node. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils hors liste d’autorisation est rejeté, et les routes persistantes de
création/suppression de profil sont bloquées via le proxy.

Désactivez-le sur le node si nécessaire :

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
- `--tls` : utiliser TLS pour la connexion à la passerelle
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’ID du node (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du node

## Auth Gateway pour l’hôte node

`openclaw node run` et `openclaw node install` résolvent l’auth Gateway depuis la config/l’env (pas de drapeaux `--token`/`--password` sur les commandes node) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Puis solution de repli sur la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte node n’hérite intentionnellement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution d’auth du node échoue en mode fermé (pas de masquage par solution de repli distante).
- En `gateway.mode=remote`, les champs du client distant (`gateway.remote.token` / `gateway.remote.password`) sont également éligibles selon les règles de priorité du mode distant.
- La résolution d’auth de l’hôte node respecte uniquement les variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un node qui se connecte à une Gateway `ws://` non loopback sur un
réseau privé de confiance, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sans cela,
le démarrage du node échoue en mode fermé et vous demande d’utiliser `wss://`, un tunnel SSH,
ou Tailscale.
Il s’agit d’un opt-in via environnement de processus, pas d’une clé de config `openclaw.json`.
`openclaw node install` le persiste dans le service node supervisé lorsqu’il est
présent dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte node sans interface comme service utilisateur.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion à la passerelle
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’ID du node (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du node
- `--runtime <runtime>` : runtime du service (`node` ou `bun`)
- `--force` : réinstaller/écraser si déjà installé

Gérer le service :

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour un hôte node au premier plan (sans service).

Les commandes de service acceptent `--json` pour une sortie lisible par machine.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur la Gateway.
Approuvez-la via :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sur des réseaux de nodes étroitement contrôlés, l’opérateur Gateway peut explicitement choisir
d’approuver automatiquement le premier appairage de node depuis des CIDR de confiance :

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

Cela est désactivé par défaut. Cela s’applique uniquement à l’appairage initial `role: node` avec
aucune portée demandée. Les clients opérateur/navigateur, Control UI, WebChat, ainsi que les mises à niveau de rôle,
de portée, de métadonnées ou de clé publique nécessitent toujours une approbation manuelle.

Si le node réessaie l’appairage avec des détails d’auth modifiés (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

L’hôte node stocke son ID de node, son jeton, son nom d’affichage et les informations de connexion Gateway dans
`~/.openclaw/node.json`.

## Approbations exec

`system.run` est protégé par les approbations exec locales :

- `~/.openclaw/exec-approvals.json`
- [Approbations exec](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifier depuis la Gateway)

Pour une exécution async approuvée sur node, OpenClaw prépare un `systemRunPlan`
canonique avant la demande d’approbation. Le transfert `system.run` approuvé ultérieur réutilise ce plan stocké,
de sorte que les modifications des champs commande/cwd/session après la création de la demande d’approbation sont rejetées au lieu de modifier ce que le node exécute.

## Lié

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)
