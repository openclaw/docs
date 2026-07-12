---
read_when:
    - Exécution de l’hôte Node sans interface graphique
    - Appairage d’un Node non-macOS pour `system.run`
summary: Référence de la CLI pour `openclaw node` (hôte Node sans interface graphique)
title: Node
x-i18n:
    generated_at: "2026-07-12T02:27:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Exécutez un **hôte Node sans interface graphique** qui se connecte au WebSocket du Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte Node ?

Utilisez un hôte Node lorsque vous souhaitez que des agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’utilisation courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de compilation, machines de laboratoire, NAS).
- Maintenir l’exécution **dans un bac à sable** sur le Gateway, tout en déléguant les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et sans interface graphique pour l’automatisation ou les nœuds d’intégration continue.

L’exécution reste protégée par des **approbations d’exécution** et des listes d’autorisation propres à chaque agent sur
l’hôte Node, afin de conserver un accès aux commandes explicite et limité.

`openclaw node run` peut publier des outils fournis par un Plugin ou MCP après sa connexion.
Par défaut, le Gateway approuve les descripteurs du Node appairé, tout en exigeant
que la commande de chaque descripteur demeure dans la surface de commandes approuvée du Node. L’agent
voit chaque descripteur accepté comme un outil de Plugin normal, mais l’exécution passe toujours
par `node.invoke` ; la déconnexion du Node retire donc l’outil des nouvelles
exécutions d’agents. Les opérateurs du Gateway peuvent désactiver la publication avec
`gateway.nodes.pluginTools.enabled: false`.

Pour les outils MCP déclaratifs, ajoutez la structure habituelle du serveur MCP sous
`nodeHost.mcp.servers` dans le fichier `openclaw.json` de la machine Node, puis redémarrez
l’hôte Node. Le Node déclare la famille de commandes `mcp.tools.call.v1`, soumise à approbation,
et publie les outils répertoriés après la connexion ; une modification ultérieure de la liste des serveurs
ne nécessite pas de nouvel appairage. Consultez
[Serveurs MCP hébergés par un Node](/fr/nodes#node-hosted-mcp-servers).

## Proxy de navigateur (sans configuration)

Les hôtes Node annoncent automatiquement un proxy de navigateur si `browser.enabled` n’est pas
désactivé sur le Node. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce Node
sans configuration supplémentaire.

Par défaut, le proxy expose la surface habituelle des profils de navigateur du Node. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage des profils absents de la liste d’autorisation est refusé, et les routes de création/suppression
de profils persistants sont bloquées par le proxy.

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

## Exécution (premier plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (valeur par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (valeur par défaut : `18789`)
- `--context-path <path>` : chemin de contexte WebSocket du Gateway (par exemple, `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--no-tls` : forcer une connexion au Gateway en texte clair même lorsque la configuration locale du Gateway active TLS
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’identifiant d’instance client historique stocké dans `node.json` (ne réinitialise pas l’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node

## Authentification au Gateway pour l’hôte Node

`openclaw node run` et `openclaw node install` résolvent l’authentification au Gateway depuis la configuration ou les variables d’environnement (les commandes Node ne comportent aucun indicateur `--token`/`--password`) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Ensuite, repli sur la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node n’hérite volontairement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré au moyen de SecretRef et n’est pas résolu, la résolution de l’authentification du Node échoue de façon sécurisée (aucun repli distant ne masque l’échec).
- Avec `gateway.mode=remote`, les champs du client distant (`gateway.remote.token` / `gateway.remote.password`) sont également admissibles conformément aux règles de priorité distantes.
- La résolution de l’authentification de l’hôte Node ne prend en compte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un Node se connectant à un Gateway `ws://` en texte clair, les hôtes local loopback, les
adresses IP privées littérales, `.local` et les hôtes Tailnet `*.ts.net` sont acceptés. Pour les autres
noms DNS privés de confiance, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ; sans
cette variable, le démarrage du Node échoue de façon sécurisée et vous invite à utiliser `wss://`, un tunnel SSH ou
Tailscale. Il s’agit d’une activation explicite dans l’environnement du processus, et non d’une clé de configuration
`openclaw.json`.
`openclaw node install` la conserve dans le service Node supervisé lorsqu’elle est
présente dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte Node sans interface graphique comme service utilisateur (launchd sur macOS, systemd sous
Linux, Planificateur de tâches Windows sous Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (valeur par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (valeur par défaut : `18789`)
- `--context-path <path>` : chemin de contexte WebSocket du Gateway (par exemple, `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’identifiant d’instance client historique stocké dans `node.json` (ne réinitialise pas l’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node
- `--runtime <runtime>` : environnement d’exécution du service (`node` ou `bun`)
- `--force` : réinstaller/remplacer si le service est déjà installé

Gérez le service :

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour exécuter un hôte Node au premier plan (sans service).

Les commandes du service acceptent `--json` pour produire une sortie lisible par une machine.

L’hôte Node réessaie la connexion en cas de redémarrage du Gateway ou de fermeture réseau au sein du processus. Si le
Gateway signale une suspension terminale de l’authentification par jeton, mot de passe ou amorçage, l’hôte Node
journalise les détails de la fermeture et se termine avec un code différent de zéro afin que launchd/systemd/Planificateur de tâches
puisse le redémarrer avec une configuration et des identifiants d’authentification actualisés. Les suspensions nécessitant un appairage restent dans
le flux de premier plan afin que la demande en attente puisse être approuvée.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur le Gateway.

Lorsque l’hôte du Gateway peut se connecter en SSH à l’hôte Node sans interaction (même utilisateur,
clé d’hôte approuvée), la demande en attente est approuvée automatiquement : le Gateway
exécute `openclaw node identity --json` sur l’hôte Node via SSH et accorde son approbation
si la clé de l’appareil correspond exactement. Ce comportement est activé par défaut ; consultez
[Approbation automatique des appareils vérifiés par SSH](/fr/gateway/pairing#ssh-verified-device-auto-approval-default)
pour connaître les exigences et savoir comment le désactiver (`gateway.nodes.pairing.sshVerify: false`).

Sinon, approuvez-la manuellement avec :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspectez l’identité locale du Node que le Gateway vérifie :

```bash
openclaw node identity --json
```

Cette commande affiche l’identifiant de l’appareil et la clé publique provenant de `identity/device.json`, sans jamais
créer ni modifier les fichiers d’identité.

Sur les réseaux de Nodes étroitement contrôlés, l’opérateur du Gateway peut explicitement choisir
d’approuver automatiquement le premier appairage d’un Node provenant de plages CIDR de confiance :

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

Cette fonctionnalité est désactivée par défaut (`autoApproveCidrs` n’est pas défini). Elle s’applique uniquement à
un nouvel appairage `role: node` sans portée demandée, provenant d’une adresse IP cliente que le
Gateway considère comme fiable. Les clients opérateur/navigateur, l’interface de contrôle, WebChat, ainsi que les mises à niveau
du rôle, de la portée, des métadonnées ou de la clé publique nécessitent toujours une approbation manuelle.

Si le Node réessaie l’appairage avec des informations d’authentification modifiées (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

### État de l’identité et de l’appairage

Le Node sans interface graphique sépare son identifiant historique d’instance client de l’identité signée de l’appareil
que le Gateway utilise pour l’appairage et le routage. Ces fichiers se trouvent dans le
répertoire d’état d’OpenClaw (`~/.openclaw` par défaut, ou `$OPENCLAW_STATE_DIR`
lorsqu’il est défini) :

| Fichier                     | Fonction                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | Identifiant d’instance client sous la clé historique `nodeId`, nom d’affichage et métadonnées de connexion au Gateway. Le client envoie cette valeur comme `instanceId`. |
| `identity/device.json`      | Paire de clés Ed25519 signée et identifiant d’appareil dérivé. Pour les connexions signées, cet identifiant d’appareil sert d’identifiant de Node routé et d’identité d’appairage. |
| `identity/device-auth.json` | Jetons d’appareil appairé, indexés par identifiant cryptographique de l’appareil et par rôle.                                                  |

`--node-id` modifie uniquement l’identifiant d’instance client dans `node.json`. Il ne
modifie pas l’identifiant cryptographique de l’appareil et n’efface pas l’authentification de l’appairage. De même, supprimer uniquement
`node.json` ne réinitialise pas l’appairage. Pour révoquer et réappairer un Node :

1. Sur le Gateway, exécutez `openclaw nodes remove --node <id|name|ip>`.
2. Sur le Node, redémarrez le service installé avec `openclaw node restart`, ou
   arrêtez puis relancez au premier plan la commande `openclaw node run`. Cela démarre le
   processus d’appairage de l’appareil. Si `openclaw devices list` n’affiche aucune demande
   et que le Node signale `AUTH_DEVICE_TOKEN_MISMATCH`, redémarrez-le ou relancez-le une fois
   de plus. La tentative rejetée efface le jeton local désormais révoqué ; la tentative
   suivante peut demander l’appairage.
3. Sur le Gateway, exécutez `openclaw devices list`, puis
   `openclaw devices approve <deviceRequestId>`.
4. Redémarrez ou relancez à nouveau le Node. Un client suspendu dans l’attente de l’appairage ne reprend pas
   automatiquement après l’approbation ; cette reconnexion crée la demande distincte
   de surface de commandes.
5. Sur le Gateway, exécutez `openclaw nodes pending`, puis
   `openclaw nodes approve <nodeRequestId>`.

Les deux identifiants de demande sont distincts. Une politique applicable fondée sur des plages CIDR de confiance peut
approuver automatiquement la première étape d’appairage de l’appareil ; l’approbation de la surface de commandes reste
une vérification distincte.

Les anciennes versions d’OpenClaw pouvaient laisser un champ historique `token` dans `node.json`.
La version actuelle d’OpenClaw n’utilise pas ce champ et le supprime lors du prochain enregistrement du fichier par l’hôte
Node. Gardez privés les deux fichiers du répertoire `identity/` ; ils contiennent la
paire de clés de l’appareil et les jetons d’authentification.

## Approbations d’exécution

`system.run` est soumis aux approbations d’exécution locales :

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` lorsque la variable n’est pas définie
- [Approbations d’exécution](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modification depuis le Gateway)

Pour l’exécution asynchrone approuvée sur un Node, OpenClaw prépare un `systemRunPlan` canonique
avant de demander l’approbation. La transmission approuvée ultérieure de `system.run` réutilise ce plan
enregistré ; toute modification des champs de commande, de répertoire de travail ou de session après la création de la demande
d’approbation est donc rejetée au lieu de modifier ce que le Node exécute.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)
