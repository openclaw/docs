---
read_when:
    - Exécution de l’hôte de nœud sans interface graphique
    - Associer un nœud non macOS pour system.run
summary: Référence CLI pour `openclaw node` (hôte de nœud headless)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:19:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Exécutez un **hôte de nœud sans interface graphique** qui se connecte au WebSocket du Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte de nœud ?

Utilisez un hôte de nœud lorsque vous voulez que les agents **exécutent des commandes sur d'autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d'utilisation courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de build, machines de laboratoire, NAS).
- Garder l'exécution **sandboxée** sur le Gateway, mais déléguer les exécutions approuvées à d'autres hôtes.
- Fournir une cible d'exécution légère et sans interface graphique pour l'automatisation ou les nœuds CI.

L'exécution reste protégée par les **approbations d'exécution** et les listes d'autorisation par agent sur
l'hôte de nœud, ce qui vous permet de garder l'accès aux commandes limité et explicite.

## Proxy de navigateur (sans configuration)

Les hôtes de nœud annoncent automatiquement un proxy de navigateur si `browser.enabled` n'est pas
désactivé sur le nœud. Cela permet à l'agent d'utiliser l'automatisation de navigateur sur ce nœud
sans configuration supplémentaire.

Par défaut, le proxy expose la surface de profil de navigateur normale du nœud. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils hors liste d'autorisation est rejeté, et les routes de
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

## Exécution (premier plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l'id du nœud (efface le jeton d'appairage)
- `--display-name <name>` : remplacer le nom d'affichage du nœud

## Authentification Gateway pour l'hôte de nœud

`openclaw node run` et `openclaw node install` résolvent l'authentification du Gateway depuis la config/l'environnement (pas d'options `--token`/`--password` sur les commandes de nœud) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Puis le repli vers la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l'hôte de nœud n'hérite volontairement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution de l'authentification du nœud échoue en mode fermé (sans masquage par repli distant).
- Dans `gateway.mode=remote`, les champs client distants (`gateway.remote.token` / `gateway.remote.password`) sont aussi éligibles selon les règles de priorité distantes.
- La résolution de l'authentification de l'hôte de nœud n'honore que les variables d'environnement `OPENCLAW_GATEWAY_*`.

Pour un nœud qui se connecte à un Gateway `ws://` en texte clair, les littéraux
loopback, IP privées, `.local` et les hôtes Tailnet `*.ts.net` sont acceptés. Pour les autres
noms DNS privés de confiance, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ; sans
cela, le démarrage du nœud échoue en mode fermé et vous demande d'utiliser `wss://`, un tunnel SSH ou
Tailscale. Il s'agit d'un choix explicite par environnement de processus, pas d'une clé de configuration
`openclaw.json`.
`openclaw node install` le persiste dans le service de nœud supervisé lorsqu'il est
présent dans l'environnement de la commande d'installation.

## Service (arrière-plan)

Installez un hôte de nœud sans interface graphique comme service utilisateur.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l'id du nœud (efface le jeton d'appairage)
- `--display-name <name>` : remplacer le nom d'affichage du nœud
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

Utilisez `openclaw node run` pour un hôte de nœud au premier plan (sans service).

Les commandes de service acceptent `--json` pour une sortie lisible par machine.

L'hôte de nœud retente les redémarrages du Gateway et les fermetures réseau dans le processus. Si le
Gateway signale une pause terminale d'authentification par jeton/mot de passe/bootstrap, l'hôte de nœud
journalise le détail de fermeture et quitte avec un code non nul afin que launchd/systemd puisse le redémarrer avec une
configuration et des identifiants frais. Les pauses nécessitant un appairage restent dans le flux de
premier plan afin que la requête en attente puisse être approuvée.

## Appairage

La première connexion crée une demande d'appairage d'appareil en attente (`role: node`) sur le Gateway.
Approuvez-la via :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Sur les réseaux de nœuds étroitement contrôlés, l'opérateur du Gateway peut explicitement choisir
d'approuver automatiquement le premier appairage de nœud depuis des CIDR de confiance :

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

C'est désactivé par défaut. Cela s'applique uniquement à un nouvel appairage `role: node` sans
portées demandées. Les clients opérateur/navigateur, Control UI, WebChat, ainsi que les mises à niveau de rôle,
portée, métadonnées ou clé publique nécessitent toujours une approbation manuelle.

Si le nœud retente l'appairage avec des détails d'authentification modifiés (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez de nouveau `openclaw devices list` avant l'approbation.

L'hôte de nœud stocke son id de nœud, son jeton, son nom d'affichage et les informations de connexion au Gateway dans
`~/.openclaw/node.json`.

## Approbations d'exécution

`system.run` est contrôlé par les approbations d'exécution locales :

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` lorsque la variable n'est pas définie
- [Approbations d'exécution](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifier depuis le Gateway)

Pour l'exécution de nœud asynchrone approuvée, OpenClaw prépare un `systemRunPlan` canonique
avant de demander confirmation. Le transfert `system.run` approuvé ensuite réutilise ce plan
stocké, de sorte que les modifications des champs commande/cwd/session après la création de la demande
d'approbation sont rejetées au lieu de changer ce que le nœud exécute.

## Connexe

- [Référence CLI](/fr/cli)
- [Nœuds](/fr/nodes)
