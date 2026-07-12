---
read_when:
    - Exécution de l’hôte Node sans interface graphique
    - Appairage d’un Node non-macOS pour system.run
summary: Référence de la CLI pour `openclaw node` (hôte Node sans interface graphique)
title: Node
x-i18n:
    generated_at: "2026-07-12T21:38:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c350655e902f36ecf578c98edf0583ee6621dea6b916cc8da08c35673fef8e49
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Exécutez un **hôte Node sans interface graphique** qui se connecte au WebSocket du Gateway et expose
`system.run` / `system.which` sur cette machine.

Sur macOS, l’application de la barre des menus intègre déjà cet environnement d’exécution d’hôte Node dans sa propre
connexion Node et ajoute des fonctionnalités Mac natives. Utilisez `openclaw node run` sur un
Mac uniquement lorsque vous souhaitez volontairement un Node sans interface graphique et sans l’application. L’exécution
des deux crée deux identités Node pour la même machine.

## Pourquoi utiliser un hôte Node ?

Utilisez un hôte Node lorsque vous souhaitez que les agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’utilisation courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de compilation, machines de laboratoire, NAS).
- Maintenir l’exécution **dans un bac à sable** sur le Gateway, tout en déléguant les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et sans interface graphique pour les automatisations ou les Nodes de CI.

L’exécution reste protégée par des **approbations d’exécution** et des listes d’autorisation propres à chaque agent sur
l’hôte Node, afin que vous puissiez maintenir un accès aux commandes limité et explicite.

`openclaw node run` peut publier des outils fournis par un Plugin ou MCP après sa connexion.
Par défaut, le Gateway approuve les descripteurs provenant du Node appairé, tout en exigeant
que la commande de chaque descripteur demeure dans la surface de commandes approuvée du Node. L’agent
voit chaque descripteur accepté comme un outil de Plugin normal, mais l’exécution passe toujours
par `node.invoke` ; la déconnexion du Node supprime donc l’outil des nouvelles
exécutions d’agent. Les opérateurs du Gateway peuvent désactiver la publication avec
`gateway.nodes.pluginTools.enabled: false`.

Pour les outils MCP déclaratifs, ajoutez la structure habituelle du serveur MCP sous
`nodeHost.mcp.servers` dans `openclaw.json` sur la machine du Node, puis redémarrez
l’hôte Node. Le Node déclare la famille de commandes `mcp.tools.call.v1`, soumise à approbation,
et publie les outils répertoriés après la connexion ; toute modification ultérieure de la liste des serveurs
ne nécessite pas de nouvel appairage. Consultez
[Serveurs MCP hébergés par un Node](/fr/nodes#node-hosted-mcp-servers).

## Proxy de navigateur (sans configuration)

Les hôtes Node annoncent automatiquement un proxy de navigateur si `browser.enabled` n’est pas
désactivé sur le Node. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce Node
sans configuration supplémentaire.

Par défaut, le proxy expose la surface normale des profils de navigateur du Node. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage des profils absents de la liste d’autorisation est rejeté et les routes de
création/suppression de profils persistants sont bloquées par le proxy.

Désactivez-le sur le Node si nécessaire :

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

Options :

- `--host <host>` : hôte WebSocket du Gateway (valeur par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (valeur par défaut : `18789`)
- `--context-path <path>` : chemin de contexte WebSocket du Gateway (par ex. `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--no-tls` : forcer une connexion au Gateway en texte clair, même lorsque la configuration locale du Gateway active TLS
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’identifiant d’instance client hérité stocké dans `node.json` (ne réinitialise pas l’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node

## Authentification au Gateway pour l’hôte Node

`openclaw node run` et `openclaw node install` déterminent l’authentification au Gateway depuis la configuration ou l’environnement (les commandes Node n’ont pas d’options `--token`/`--password`) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiées en premier.
- Puis vient la solution de repli de la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node n’hérite volontairement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef sans être résolu, la résolution de l’authentification du Node échoue de manière fermée (aucune solution de repli distante ne masque l’échec).
- En mode `gateway.mode=remote`, les champs du client distant (`gateway.remote.token` / `gateway.remote.password`) sont également admissibles selon les règles de priorité distante.
- La résolution de l’authentification de l’hôte Node ne tient compte que des variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un Node se connectant à un Gateway `ws://` en texte clair, les adresses de bouclage, les littéraux d’IP
privées, les hôtes `.local` et les hôtes Tailnet `*.ts.net` sont acceptés. Pour les autres
noms DNS privés de confiance, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ; sans
cette variable, le démarrage du Node échoue de manière fermée et vous invite à utiliser `wss://`, un tunnel SSH ou
Tailscale. Il s’agit d’une activation volontaire dans l’environnement du processus, et non d’une clé de configuration
`openclaw.json`.
`openclaw node install` la conserve dans le service supervisé du Node lorsqu’elle est
présente dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte Node sans interface graphique en tant que service utilisateur (launchd sur macOS, systemd sous
Linux, Planificateur de tâches Windows sous Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (valeur par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (valeur par défaut : `18789`)
- `--context-path <path>` : chemin de contexte WebSocket du Gateway (par ex. `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’identifiant d’instance client hérité stocké dans `node.json` (ne réinitialise pas l’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node
- `--runtime <runtime>` : environnement d’exécution du service (`node` ou `bun`)
- `--force` : réinstaller/remplacer si le service est déjà installé

Gérez le service :

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour un hôte Node au premier plan (sans service).

Les commandes du service acceptent `--json` pour produire une sortie lisible par une machine.

L’hôte Node retente la connexion après les redémarrages du Gateway et les fermetures réseau au sein du processus. Si le
Gateway signale une interruption définitive de l’authentification par jeton, mot de passe ou amorçage, l’hôte Node
journalise les détails de la fermeture et se termine avec un code différent de zéro afin que launchd/systemd/Planificateur de tâches
puisse le redémarrer avec une configuration et des identifiants actualisés. Les interruptions nécessitant un appairage restent dans
le flux au premier plan afin que la requête en attente puisse être approuvée.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur le Gateway.

Lorsque l’hôte du Gateway peut se connecter à l’hôte Node par SSH sans interaction (même utilisateur,
clé d’hôte de confiance), la demande en attente est approuvée automatiquement : le Gateway
exécute `openclaw node identity --json` sur l’hôte Node via SSH et approuve en cas de
correspondance exacte de la clé d’appareil. Ce comportement est activé par défaut ; consultez
[Approbation automatique des appareils vérifiée par SSH](/fr/gateway/pairing#ssh-verified-device-auto-approval-default)
pour connaître les exigences et la procédure de désactivation (`gateway.nodes.pairing.sshVerify: false`).

Sinon, approuvez-la manuellement avec :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspectez l’identité locale du Node par rapport à laquelle le Gateway effectue la vérification :

```bash
openclaw node identity --json
```

Cette commande affiche l’identifiant de l’appareil et la clé publique provenant de `identity/device.json`, sans jamais
créer ni modifier de fichiers d’identité.

Sur les réseaux de Nodes strictement contrôlés, l’opérateur du Gateway peut explicitement choisir
d’approuver automatiquement le premier appairage des Nodes provenant de CIDR de confiance :

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

Ce comportement est désactivé par défaut (`autoApproveCidrs` n’est pas défini). Il s’applique uniquement à
un nouvel appairage `role: node` sans portée demandée, provenant d’une adresse IP cliente à laquelle le
Gateway fait confiance. Les clients opérateur/navigateur, Control UI, WebChat, ainsi que les mises à niveau de rôle,
de portée, de métadonnées ou de clé publique nécessitent toujours une approbation manuelle.

Si le Node retente l’appairage avec des informations d’authentification modifiées (rôle/portées/clé publique),
la demande précédente en attente est remplacée et un nouveau `requestId` est créé.
Exécutez de nouveau `openclaw devices list` avant l’approbation.

### État de l’identité et de l’appairage

Le Node sans interface graphique sépare son identifiant d’instance client hérité de l’identité d’appareil
signée que le Gateway utilise pour l’appairage et le routage. Ces fichiers se trouvent dans le
répertoire d’état d’OpenClaw (`~/.openclaw` par défaut, ou `$OPENCLAW_STATE_DIR`
lorsque cette variable est définie) :

| Fichier                     | Fonction                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | Identifiant d’instance client sous la clé héritée `nodeId`, nom d’affichage et métadonnées de connexion au Gateway. Le client envoie cette valeur en tant que `instanceId`.                     |
| `identity/device.json`      | Paire de clés Ed25519 signée et identifiant d’appareil dérivé. Pour les connexions signées, cet identifiant d’appareil est l’identifiant du Node utilisé pour le routage et l’identité d’appairage. |
| `identity/device-auth.json` | Jetons des appareils appairés, indexés par identifiant cryptographique de l’appareil et par rôle.                                                                                             |

`--node-id` modifie uniquement l’identifiant d’instance client dans `node.json`. Il ne
modifie pas l’identifiant cryptographique de l’appareil et n’efface pas l’authentification d’appairage. La suppression du seul
fichier `node.json` ne réinitialise pas non plus l’appairage. Pour révoquer et réappairer un Node :

1. Sur le Gateway, exécutez `openclaw nodes remove --node <id|name|ip>`.
2. Sur le Node, redémarrez le service installé avec `openclaw node restart`, ou
   arrêtez puis relancez la commande au premier plan `openclaw node run`. Cela démarre le
   flux d’appairage de l’appareil. Si `openclaw devices list` n’affiche aucune demande
   et que le Node signale `AUTH_DEVICE_TOKEN_MISMATCH`, redémarrez-le ou relancez-le encore
   une fois. La tentative rejetée efface le jeton local désormais révoqué ; la tentative
   suivante peut demander l’appairage.
3. Sur le Gateway, exécutez `openclaw devices list`, puis
   `openclaw devices approve <deviceRequestId>`.
4. Redémarrez ou relancez de nouveau le Node. Un client interrompu pour appairage ne reprend pas
   automatiquement après l’approbation ; cette reconnexion crée la demande distincte
   de surface de commandes.
5. Sur le Gateway, exécutez `openclaw nodes pending`, puis
   `openclaw nodes approve <nodeRequestId>`.

Les deux identifiants de demande sont distincts. Une politique applicable de CIDR de confiance peut
approuver automatiquement l’étape du premier appairage de l’appareil ; l’approbation de la surface de commandes reste
une vérification distincte.

Les anciennes versions d’OpenClaw pouvaient laisser un champ `token` hérité dans `node.json`.
La version actuelle d’OpenClaw n’utilise pas ce champ et le supprime la prochaine fois que l’hôte Node
enregistre le fichier. Conservez les deux fichiers sous `identity/` privés ; ils contiennent la
paire de clés de l’appareil et les jetons d’authentification.

## Approbations d’exécution

`system.run` est soumis aux approbations d’exécution locales :

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` lorsque la variable n’est pas définie
- [Approbations d’exécution](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modification depuis le Gateway)

Pour l’exécution asynchrone approuvée sur un Node, OpenClaw prépare un `systemRunPlan` canonique
avant de demander l’approbation. Le transfert ultérieur de la commande approuvée `system.run` réutilise ce plan
stocké ; les modifications des champs de commande/répertoire de travail/session après la création de la demande d’approbation
sont donc rejetées au lieu de modifier ce que le Node exécute.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)
