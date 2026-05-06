---
read_when:
    - Exécution de l’hôte Node sans interface
    - Associer un nœud non macOS pour system.run
summary: Référence CLI pour `openclaw node` (hôte Node sans interface)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Exécutez un **hôte Node sans interface graphique** qui se connecte au WebSocket du Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte Node ?

Utilisez un hôte Node lorsque vous souhaitez que les agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’utilisation courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de build, machines de laboratoire, NAS).
- Garder l’exécution **sandboxée** sur le Gateway, tout en déléguant les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère, sans interface graphique, pour l’automatisation ou les nœuds CI.

L’exécution reste protégée par les **approbations exec** et les listes d’autorisation par agent sur
l’hôte Node, ce qui vous permet de garder l’accès aux commandes limité et explicite.

## Proxy de navigateur (zéro configuration)

Les hôtes Node annoncent automatiquement un proxy de navigateur si `browser.enabled` n’est pas
désactivé sur le Node. Cela permet à l’agent d’utiliser l’automatisation de navigateur sur ce Node
sans configuration supplémentaire.

Par défaut, le proxy expose la surface de profil de navigateur normale du Node. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils non autorisés est rejeté, et les routes de création/suppression de profils
persistants sont bloquées via le proxy.

Désactivez-le sur le Node si nécessaire :

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

- `--host <host>` : hôte WebSocket du Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’id du Node (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node

## Authentification Gateway pour l’hôte Node

`openclaw node run` et `openclaw node install` résolvent l’authentification Gateway depuis la config/l’environnement (pas d’options `--token`/`--password` sur les commandes Node) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiées en premier.
- Puis repli sur la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node n’hérite intentionnellement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et n’est pas résolu, la résolution de l’authentification Node échoue de manière fermée (aucun repli distant masquant).
- Dans `gateway.mode=remote`, les champs du client distant (`gateway.remote.token` / `gateway.remote.password`) sont aussi admissibles selon les règles de priorité distantes.
- La résolution de l’authentification de l’hôte Node respecte uniquement les variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un Node se connectant à un Gateway `ws://` non local loopback sur un réseau privé
fiable, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sans cela, le démarrage du Node
échoue de manière fermée et vous demande d’utiliser `wss://`, un tunnel SSH ou Tailscale.
Il s’agit d’une option d’activation par environnement de processus, pas d’une clé de configuration `openclaw.json`.
`openclaw node install` la persiste dans le service Node supervisé lorsqu’elle est
présente dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte Node sans interface graphique comme service utilisateur.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’id du Node (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node
- `--runtime <runtime>` : runtime de service (`node` ou `bun`)
- `--force` : réinstaller/remplacer si déjà installé

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

L’hôte Node réessaie le redémarrage du Gateway et les fermetures réseau dans le processus. Si le
Gateway signale une pause terminale d’authentification par jeton/mot de passe/bootstrap, l’hôte Node
journalise le détail de fermeture et quitte avec un code non nul afin que launchd/systemd puisse le redémarrer avec
une configuration et des identifiants frais. Les pauses nécessitant un appairage restent dans le flux
au premier plan afin que la demande en attente puisse être approuvée.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur le Gateway.
Approuvez-la via :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sur les réseaux Node strictement contrôlés, l’opérateur du Gateway peut explicitement choisir
d’approuver automatiquement le premier appairage Node depuis des CIDR de confiance :

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

C’est désactivé par défaut. Cela s’applique uniquement à un nouvel appairage `role: node` avec
aucun périmètre demandé. Les clients opérateur/navigateur, Control UI, WebChat, ainsi que les mises à niveau de rôle,
périmètre, métadonnées ou clé publique nécessitent toujours une approbation manuelle.

Si le Node réessaie l’appairage avec des détails d’authentification modifiés (rôle/périmètres/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

L’hôte Node stocke son id de Node, son jeton, son nom d’affichage et les informations de connexion au Gateway dans
`~/.openclaw/node.json`.

## Approbations exec

`system.run` est contrôlé par les approbations exec locales :

- `~/.openclaw/exec-approvals.json`
- [Approbations exec](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifier depuis le Gateway)

Pour l’exécution Node asynchrone approuvée, OpenClaw prépare un `systemRunPlan` canonique
avant de demander confirmation. Le transfert `system.run` approuvé ultérieur réutilise ce
plan stocké, de sorte que les modifications des champs commande/cwd/session après la création de la demande
d’approbation sont rejetées au lieu de changer ce que le Node exécute.

## Connexe

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)
