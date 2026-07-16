---
read_when:
    - Exécution de l’hôte Node sans interface graphique
    - Appairage d’un Node non-macOS pour `system.run`
summary: Référence de la CLI pour `openclaw node` (hôte Node sans interface graphique)
title: Node
x-i18n:
    generated_at: "2026-07-16T13:08:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Exécutez un **hôte Node sans interface graphique** qui se connecte au WebSocket du Gateway et expose
`system.run` / `system.which` sur cette machine.

Sous macOS, l’application de la barre des menus intègre déjà cet environnement d’exécution d’hôte Node à sa propre
connexion Node et ajoute des fonctionnalités Mac natives. Utilisez `openclaw node run` sur un
Mac uniquement si vous souhaitez délibérément un Node sans interface graphique et sans l’application. L’exécution
des deux crée deux identités Node pour la même machine.

## Pourquoi utiliser un hôte Node ?

Utilisez un hôte Node lorsque vous souhaitez que les agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’utilisation courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de compilation, machines de laboratoire, NAS).
- Maintenir l’exécution **dans un bac à sable** sur le Gateway, tout en déléguant les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et sans interface graphique pour les automatisations ou les nœuds de CI.

L’exécution reste protégée par les **approbations d’exécution** et les listes d’autorisation propres à chaque agent sur
l’hôte Node, ce qui permet de conserver un accès aux commandes restreint et explicite.

`openclaw node run` peut publier des outils de Plugin ou adossés à MCP après sa connexion.
Par défaut, le Gateway fait confiance aux descripteurs du Node appairé, tout en exigeant
que la commande de chaque descripteur reste dans la surface de commandes approuvée du Node. L’
agent voit chaque descripteur accepté comme un outil de Plugin normal, mais l’exécution passe toujours
par `node.invoke` ; la déconnexion du Node supprime donc l’outil des nouvelles
exécutions d’agents. Les opérateurs du Gateway peuvent désactiver la publication avec
`gateway.nodes.pluginTools.enabled: false`.

Pour les outils MCP déclaratifs, ajoutez la structure habituelle de serveur MCP sous
`nodeHost.mcp.servers` dans `openclaw.json` sur la machine Node, puis redémarrez l’
hôte Node. Le Node déclare la famille de commandes `mcp.tools.call.v1`, soumise à approbation,
et publie les outils répertoriés après sa connexion ; une modification ultérieure de la liste des serveurs
ne nécessite pas de nouvel appairage. Consultez
[Serveurs MCP hébergés par un Node](/fr/nodes#node-hosted-mcp-servers).

## Proxy de navigateur (sans configuration)

Les hôtes Node annoncent automatiquement un proxy de navigateur si `browser.enabled` n’est pas
désactivé sur le Node. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce Node
sans configuration supplémentaire.

Par défaut, le proxy expose la surface normale des profils de navigateur du Node. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils ne figurant pas dans la liste d’autorisation est rejeté, et les routes de création/suppression
de profils persistants sont bloquées via le proxy.

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
- `--context-path <path>` : chemin de contexte WebSocket du Gateway (par ex. `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--no-tls` : forcer une connexion au Gateway en texte clair même lorsque la configuration locale du Gateway active TLS
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’ID d’instance client stocké dans l’état SQLite partagé (ne réinitialise pas l’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node

## Authentification du Gateway pour l’hôte Node

`openclaw node run` et `openclaw node install` déterminent l’authentification du Gateway à partir de la configuration/de l’environnement (aucune option `--token`/`--password` dans les commandes Node) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Puis recours à la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node n’hérite volontairement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et n’est pas résolu, la résolution de l’authentification du Node échoue de manière fermée (aucun recours distant ne masque l’échec).
- Dans `gateway.mode=remote`, les champs du client distant (`gateway.remote.token` / `gateway.remote.password`) sont également admissibles selon les règles de priorité distantes.
- La résolution de l’authentification de l’hôte Node ne prend en compte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un Node se connectant à un Gateway `ws://` en texte clair, les adresses de bouclage, les littéraux d’IP
privées, `.local` et les hôtes `*.ts.net` du Tailnet sont acceptés. Pour les autres
noms DNS privés de confiance, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ; sans
cela, le démarrage du Node échoue de manière fermée et vous demande d’utiliser `wss://`, un tunnel SSH ou
Tailscale. Il s’agit d’une activation explicite via l’environnement du processus, et non d’une clé de configuration
`openclaw.json`.
`openclaw node install` la conserve dans le service Node supervisé lorsqu’elle est
présente dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte Node sans interface graphique comme service utilisateur (launchd sous macOS, systemd sous
Linux, Planificateur de tâches Windows sous Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (valeur par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (valeur par défaut : `18789`)
- `--context-path <path>` : chemin de contexte WebSocket du Gateway (par ex. `/openclaw-gw`). Ajouté à l’URL WebSocket.
- `--tls` : utiliser TLS pour la connexion au Gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’ID d’instance client stocké dans l’état SQLite partagé (ne réinitialise pas l’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node
- `--runtime <runtime>` : environnement d’exécution du service (`node`)
- `--force` : réinstaller/écraser si le service est déjà installé

Gérez le service :

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour un hôte Node au premier plan (sans service).

Les commandes de service acceptent `--json` pour produire une sortie lisible par une machine.

L’hôte Node retente en interne la connexion après un redémarrage du Gateway ou une fermeture du réseau. Si le
Gateway signale une pause terminale d’authentification liée au jeton, au mot de passe ou à l’amorçage, l’hôte Node
journalise les détails de la fermeture et se termine avec un code différent de zéro afin que launchd/systemd/Planificateur de tâches
puisse le redémarrer avec une configuration et des identifiants actualisés. Les pauses nécessitant un appairage restent dans
le flux de premier plan afin que la demande en attente puisse être approuvée.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur le Gateway.

Lorsque l’hôte du Gateway peut se connecter à l’hôte Node par SSH de manière non interactive (même utilisateur,
clé d’hôte approuvée), la demande en attente est approuvée automatiquement : le Gateway
exécute `openclaw node identity --json` sur l’hôte Node via SSH et l’approuve lors
d’une correspondance exacte de la clé d’appareil. Cette fonctionnalité est activée par défaut ; consultez
[Approbation automatique des appareils vérifiée par SSH](/fr/gateway/pairing#ssh-verified-device-auto-approval-default)
pour connaître les exigences et savoir comment la désactiver (`gateway.nodes.pairing.sshVerify: false`).

Sinon, approuvez-la manuellement avec :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Inspectez l’identité locale du Node que le Gateway vérifie :

```bash
openclaw node identity --json
```

Cette commande affiche l’ID de l’appareil et la clé publique depuis `identity/device.json`, et ne
crée ni ne modifie jamais les fichiers d’identité.

Sur les réseaux de Nodes strictement contrôlés, l’opérateur du Gateway peut explicitement choisir
d’approuver automatiquement le premier appairage des Nodes provenant de CIDR de confiance :

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
un nouvel appairage `role: node` sans portée demandée, provenant d’une adresse IP cliente à laquelle le
Gateway fait confiance. Les clients opérateur/navigateur, l’interface de contrôle, WebChat, ainsi que les mises à niveau de rôle,
de portée, de métadonnées ou de clé publique nécessitent toujours une approbation manuelle.

Si le Node retente l’appairage avec des informations d’authentification modifiées (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouvel `requestId` est créé.
Exécutez de nouveau `openclaw devices list` avant l’approbation.

### État de l’identité et de l’appairage

Le Node sans interface graphique sépare son ID d’instance client de l’identité d’appareil
signée que le Gateway utilise pour l’appairage et le routage. Cet état se trouve dans le
répertoire d’état d’OpenClaw (`~/.openclaw` par défaut, ou `$OPENCLAW_STATE_DIR`
lorsqu’il est défini) :

| État                                         | Fonction                                                                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | ID d’instance client, nom d’affichage et métadonnées de connexion au Gateway. Le client envoie cet ID sous la forme `instanceId`. |
| `identity/device.json`                       | Paire de clés Ed25519 signée et ID d’appareil dérivé. Pour les connexions signées, cet ID d’appareil est l’ID du Node routé et l’identité d’appairage. |
| `identity/device-auth.json`                  | Jetons des appareils appairés, indexés par ID cryptographique de l’appareil et par rôle.                                         |

`--node-id` modifie uniquement l’ID d’instance client dans l’état SQLite partagé. Il ne
modifie pas l’ID cryptographique de l’appareil et n’efface pas l’authentification d’appairage. La migration d’un ancien
`node.json` avec `openclaw doctor --fix` ne réinitialise pas non plus l’appairage. Pour
révoquer et réappairer un Node :

1. Sur le Gateway, exécutez `openclaw nodes remove --node <id|name|ip>`.
2. Sur le Node, redémarrez le service installé avec `openclaw node restart`, ou
   arrêtez puis relancez la commande de premier plan `openclaw node run`. Cela démarre le
   flux d’appairage de l’appareil. Si `openclaw devices list` n’affiche aucune demande
   et que le Node signale `AUTH_DEVICE_TOKEN_MISMATCH`, redémarrez-le ou relancez-le une fois
   de plus. La tentative rejetée efface le jeton local désormais révoqué ; la tentative
   suivante peut demander l’appairage.
3. Sur le Gateway, exécutez `openclaw devices list`, puis
   `openclaw devices approve <deviceRequestId>`.
4. Redémarrez ou relancez de nouveau le Node. Un client suspendu en attente d’appairage ne reprend pas
   automatiquement après l’approbation ; cette reconnexion crée la demande distincte
   de surface de commandes.
5. Sur le Gateway, exécutez `openclaw nodes pending`, puis
   `openclaw nodes approve <nodeRequestId>`.

Les deux ID de demande sont distincts. Une politique CIDR de confiance applicable peut
approuver automatiquement l’étape initiale d’appairage de l’appareil ; l’approbation de la surface de commandes reste
une vérification distincte.

Les anciennes versions d’OpenClaw stockaient l’état de l’hôte Node dans `node.json` et pouvaient y laisser un
champ `token` obsolète. Arrêtez l’hôte Node et exécutez `openclaw doctor --fix`
une fois ; Doctor importe dans SQLite les champs d’identité et de connexion pris en charge,
supprime le champ de jeton inutilisé, vérifie la ligne et supprime le fichier obsolète.
Les commandes Node normales échouent de manière fermée avec cette instruction de réparation tant que le fichier ou
une revendication Doctor interrompue subsiste. Gardez les deux fichiers sous `identity/` privés ;
ils contiennent la paire de clés de l’appareil et les jetons d’authentification.

## Approbations d’exécution

`system.run` est soumis aux approbations d’exécution locales :

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` lorsque la variable n’est pas définie
- [Approbations d’exécution](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (à modifier depuis le Gateway)

Pour une exécution asynchrone approuvée sur un Node, OpenClaw prépare un `systemRunPlan`
canonique avant de demander l’approbation. Le transfert `system.run` approuvé ultérieurement réutilise ce plan
stocké ; les modifications des champs de commande/répertoire de travail/session effectuées après la création de la demande
d’approbation sont donc rejetées au lieu de modifier ce que le Node exécute.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Nodes](/fr/nodes)
