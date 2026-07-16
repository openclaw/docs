---
read_when:
    - Configuration de la prise en charge de Signal
    - Débogage de l’envoi et de la réception avec Signal
summary: Prise en charge de Signal via signal-cli (démon natif ou conteneur bbernhard), procédures de configuration et modèle de numérotation
title: Signal
x-i18n:
    generated_at: "2026-07-16T12:58:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal est un plugin de canal téléchargeable (`@openclaw/signal`). Le Gateway communique avec `signal-cli` via HTTP : soit avec le démon natif (JSON-RPC + SSE), soit avec le conteneur [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw n’intègre pas libsignal.

## Le modèle de numéro (à lire en premier)

- Le Gateway se connecte à un **appareil Signal** : le compte `signal-cli`.
- L’exécution du bot sur **votre compte Signal personnel** lui fait ignorer vos propres messages (protection contre les boucles).
- Pour que « j’envoie un message au bot et il répond » fonctionne, utilisez un **numéro de bot distinct**.

## Installation

```bash
openclaw plugins install @openclaw/signal
```

Les spécifications de plugin sans préfixe essaient d’abord ClawHub, puis se rabattent sur npm. Forcez une source avec `openclaw plugins install clawhub:@openclaw/signal` ou `npm:@openclaw/signal`. `plugins install` enregistre et active le plugin ; aucune étape `enable` distincte n’est nécessaire. Consultez [Plugins](/fr/tools/plugin) pour les règles générales d’installation.

## Configuration rapide

<Steps>
  <Step title="Choisir un numéro">
    Utilisez un **numéro Signal distinct** pour le bot (recommandé).
  </Step>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Exécuter la configuration guidée">
    ```bash
    openclaw channels add
    ```
    L’assistant détecte si `signal-cli` se trouve dans `PATH` et, s’il est absent, propose de l’installer : il télécharge la version native GraalVM officielle sous Linux x86-64, ou l’installe via Homebrew sous macOS et sur les autres architectures. Il demande ensuite le numéro du bot et le chemin `signal-cli`.

    Pour une configuration non interactive, `openclaw channels add --channel signal` accepte également `--signal-number <e164>` pour le numéro de téléphone du bot, ainsi que `--http-host <host>` et `--http-port <port>` pour le point de terminaison du démon Signal (valeur par défaut : `127.0.0.1:8080`).

  </Step>
  <Step title="Associer ou enregistrer le compte">
    - **Association par code QR (la plus rapide) :** `signal-cli link -n "OpenClaw"`, puis scannez-le avec Signal. Consultez le [parcours A](#setup-path-a-link-existing-signal-account-qr).
    - **Enregistrement par SMS :** numéro dédié avec captcha + vérification par SMS. Consultez le [parcours B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Vérifier et appairer">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Envoyez un premier message privé et approuvez l’appairage : `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

Configuration minimale :

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| Champ        | Description                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Numéro de téléphone du bot au format E.164 (`+15551234567`) |
| `cliPath`    | Chemin vers `signal-cli` (`signal-cli` s’il se trouve dans `PATH`)  |
| `configPath` | Répertoire de configuration de signal-cli transmis sous la forme `--config`        |
| `dmPolicy`   | Politique d’accès aux messages privés (`pairing` recommandé)          |
| `allowFrom`  | Numéros de téléphone ou valeurs `uuid:<id>` autorisés à envoyer des messages privés |

Prise en charge de plusieurs comptes : utilisez `channels.signal.accounts` avec une configuration propre à chaque compte et un `name` facultatif. Consultez [Canaux multicomptes](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle commun.

## Fonctionnement

- Routage déterministe : les réponses sont toujours renvoyées à Signal.
- Les messages privés partagent la session principale de l’agent ; les groupes sont isolés (`agent:<agentId>:signal:group:<groupId>`).
- Par défaut, Signal peut écrire les mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`). Désactivez cette fonctionnalité avec `channels.signal.configWrites: false`.

## Parcours de configuration A : associer un compte Signal existant (code QR)

1. Installez `signal-cli` (version JVM ou native), ou laissez `openclaw channels add` l’installer pour vous.
2. Associez un compte de bot : `signal-cli link -n "OpenClaw"`, puis scannez le code QR dans Signal.
3. Configurez Signal et démarrez le Gateway.

## Parcours de configuration B : enregistrer un numéro de bot dédié (SMS, Linux)

Utilisez cette méthode pour un numéro de bot dédié plutôt que d’associer un compte d’application Signal existant. Le processus ci-dessous est testé sur Ubuntu 24.

1. Obtenez un numéro pouvant recevoir des SMS (ou une vérification vocale pour les lignes fixes). Un numéro de bot dédié évite les conflits de compte ou de session.
2. Installez `signal-cli` sur l’hôte du Gateway :

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si vous utilisez la version JVM (`signal-cli-${VERSION}.tar.gz`), installez d’abord un JRE. Maintenez `signal-cli` à jour ; la documentation en amont indique que les anciennes versions peuvent cesser de fonctionner lorsque les API des serveurs Signal évoluent.

3. Enregistrez et vérifiez le numéro :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si un captcha est requis (un accès au navigateur est nécessaire pour effectuer cette étape) :

1. Ouvrez `https://signalcaptchas.org/registration/generate.html`.
2. Effectuez le captcha, puis copiez la cible du lien `signalcaptcha://...` depuis « Open Signal ».
3. Dans la mesure du possible, exécutez la commande depuis la même adresse IP externe que la session du navigateur (les jetons de captcha expirent rapidement).
4. Enregistrez et vérifiez immédiatement :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configurez OpenClaw, redémarrez le Gateway et vérifiez le canal :

```bash
# Si vous exécutez le Gateway comme service systemd utilisateur :
systemctl --user restart openclaw-gateway.service

# Puis vérifiez :
openclaw doctor
openclaw channels status --probe
```

5. Appairez l’expéditeur de vos messages privés :
   - Envoyez n’importe quel message au numéro du bot.
   - Approuvez-le sur le serveur : `openclaw pairing approve signal <PAIRING_CODE>`.
   - Enregistrez le numéro du bot comme contact sur votre téléphone pour éviter « Unknown contact ».

<Warning>
L’enregistrement d’un compte associé à un numéro de téléphone avec `signal-cli` peut désauthentifier la session principale de l’application Signal pour ce numéro. Préférez un numéro de bot dédié ou utilisez le mode d’association par code QR pour conserver la configuration actuelle de votre application téléphonique.
</Warning>

Références en amont :

- README de `signal-cli` : `https://github.com/AsamK/signal-cli`
- Processus de captcha : `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Processus d’association : `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode démon externe (httpUrl)

Pour gérer vous-même `signal-cli` (démarrages à froid lents de la JVM, initialisation du conteneur, processeurs partagés), exécutez le démon séparément et faites pointer OpenClaw vers celui-ci :

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Cela évite le lancement automatique et l’attente d’OpenClaw au démarrage. Pour les démarrages lents avec lancement automatique, définissez `channels.signal.startupTimeoutMs`.

## Mode conteneur (bbernhard/signal-cli-rest-api)

Au lieu d’exécuter `signal-cli` en mode natif, utilisez le conteneur Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), qui encapsule `signal-cli` derrière une interface REST + WebSocket.

Prérequis :

- Le conteneur **doit** s’exécuter avec `MODE=json-rpc` pour recevoir les messages en temps réel.
- Enregistrez ou associez votre compte Signal dans le conteneur avant de connecter OpenClaw.

Exemple de service `docker-compose.yml` :

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Configuration d’OpenClaw :

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // ou "auto" pour une détection automatique
    },
  },
}
```

`apiMode` détermine le protocole utilisé par OpenClaw :

| Valeur         | Comportement                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Par défaut) Sonde les deux transports ; le flux continu valide la réception WebSocket du conteneur    |
| `"native"`    | Force signal-cli natif (JSON-RPC sur `/api/v1/rpc`, SSE sur `/api/v1/events`)         |
| `"container"` | Force le conteneur bbernhard (REST sur `/v2/send`, WebSocket sur `/v1/receive/{account}`) |

Lorsque `apiMode` vaut `"auto"`, OpenClaw met en cache le mode détecté pendant 30 secondes pour chaque URL de démon afin d’éviter les sondages répétés (le mode natif est prioritaire lorsque les deux transports sont opérationnels). La réception par conteneur n’est sélectionnée pour le flux continu qu’après la mise à niveau de `/v1/receive/{account}` vers WebSocket, qui nécessite `MODE=json-rpc`.

Le mode conteneur prend en charge les mêmes opérations Signal que le mode natif lorsque le conteneur expose des API correspondantes : envois, réceptions, pièces jointes, indicateurs de saisie, accusés de lecture et de consultation, réactions, groupes et texte mis en forme. OpenClaw traduit les appels RPC Signal natifs en charges utiles REST du conteneur, y compris les identifiants de groupe `group.{base64(internal_id)}` et `text_mode: "styled"` pour le texte mis en forme.

Remarques opérationnelles :

- Utilisez `autoStart: false` avec le mode conteneur ; OpenClaw ne doit pas lancer de démon natif lorsque `apiMode: "container"` est sélectionné.
- Utilisez `MODE=json-rpc` pour la réception. `MODE=normal` peut donner l’impression que `/v1/about` est opérationnel, mais `/v1/receive/{account}` ne passera pas à WebSocket ; OpenClaw ne sélectionnera donc pas le flux continu de réception du conteneur en mode `auto`.
- Définissez `apiMode: "container"` lorsque `httpUrl` pointe vers l’API REST de bbernhard, `"native"` lorsqu’il pointe vers le service JSON-RPC/SSE natif `signal-cli`, et `"auto"` lorsque le déploiement peut varier.
- Les téléchargements de pièces jointes en mode conteneur respectent les mêmes limites de taille en octets que le mode natif. Les réponses trop volumineuses sont rejetées avant d’être entièrement mises en mémoire tampon lorsque le serveur envoie `Content-Length`, et pendant le flux continu dans les autres cas.

## Contrôle d’accès (messages privés + groupes)

Messages privés :

- Valeur par défaut : `channels.signal.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à leur approbation (les codes expirent après 1 heure).
- Approuvez-les via `openclaw pairing list signal` et `openclaw pairing approve signal <CODE>`.
- L’appairage est l’échange de jetons par défaut pour les messages privés Signal. Détails : [Appairage](/fr/channels/pairing)
- Les expéditeurs identifiés uniquement par UUID (provenant de `sourceUuid`) sont stockés sous la forme `uuid:<id>` dans `channels.signal.allowFrom`.

Groupes :

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` détermine quels groupes ou expéditeurs peuvent déclencher des réponses de groupe lorsque `allowlist` est défini ; les entrées peuvent être des identifiants de groupe Signal (bruts, `group:<id>` ou `signal:group:<id>`), des numéros de téléphone d’expéditeur, des valeurs `uuid:<id>` ou `*`.
- `channels.signal.groups["<group-id>" | "*"]` peut remplacer le comportement des groupes avec `requireMention`, `tools` et `toolsBySender`.
- Utilisez `channels.signal.accounts.<id>.groups` pour les remplacements propres à chaque compte dans les configurations multicomptes.
- L’ajout d’un groupe Signal à la liste d’autorisation via `groupAllowFrom` ne désactive pas à lui seul le filtrage par mention. Une entrée `channels.signal.groups["<group-id>"]` configurée explicitement traite chaque message du groupe, sauf si `requireMention=true` est défini.
- Avec `requireMention=true`, les @mentions Signal natives sont comparées à partir des métadonnées structurées de mention avec le numéro de téléphone ou le `accountUuid` du compte du bot. Les `mentionPatterns` configurés restent une solution de secours en texte brut.
- Remarque sur l’exécution : si `channels.signal` est totalement absent, l’exécution se rabat sur `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Groupe soumis à une mention avec contexte limité :

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Les messages de groupe autorisés qui ne mentionnent pas le bot restent sans réponse et sont conservés uniquement dans la fenêtre bornée de l’historique en attente. Lorsqu’une mention native @mention ou une mention textuelle de secours déclenche ultérieurement le bot, OpenClaw inclut ce contexte récent et répond dans le même groupe. Le contenu des pièces jointes ignorées n’est pas téléchargé ; celles-ci peuvent apparaître uniquement sous forme d’indicateurs compacts de médias dans le contexte en attente.

## Fonctionnement (comportement)

- Mode natif : `signal-cli` s’exécute comme un démon ; le Gateway lit les événements via SSE.
- Mode conteneur : le Gateway envoie via l’API REST et reçoit via WebSocket.
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée.
- Les réponses sont toujours renvoyées au même numéro ou groupe.
- Les réponses aux messages entrants incluent les métadonnées de citation natives de Signal lorsque le backend accepte l’horodatage et l’auteur du message entrant ; si les métadonnées de citation sont absentes ou rejetées, OpenClaw envoie la réponse comme un message normal.
- Configurez l’utilisation des citations natives avec `channels.signal.replyToMode = off | first | all | batched`, ou `channels.signal.replyToModeByChatType.direct/group` pour les remplacements par type de discussion. Les valeurs au niveau du compte sous `channels.signal.accounts.<id>` sont prioritaires.

## Médias et limites

- Le texte sortant est découpé selon `channels.signal.textChunkLimit` (4000 par défaut).
- Découpage facultatif aux sauts de ligne : définissez `channels.signal.streaming.chunkMode="newline"` pour découper d’abord aux lignes vides (limites de paragraphes), puis selon la longueur.
- Les pièces jointes sont prises en charge (base64 récupéré depuis `signal-cli`).
- Les pièces jointes de type note vocale utilisent le nom de fichier `signal-cli` comme solution de secours pour le type MIME lorsque `contentType` est absent, afin que la transcription audio puisse toujours classer les mémos vocaux AAC.
- Limite de médias par défaut : `channels.signal.mediaMaxMb` (8 par défaut).
- Utilisez `channels.signal.ignoreAttachments` pour ignorer le téléchargement des médias.
- Le contexte de l’historique de groupe utilise `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), avec `messages.groupChat.historyLimit` comme valeur de secours. Définissez `0` pour le désactiver (50 par défaut).

## Indicateurs de saisie et confirmations de lecture

- **Indicateurs de saisie** : OpenClaw envoie des signaux de saisie via `signal-cli sendTyping` et les actualise pendant la génération d’une réponse.
- **Confirmations de lecture** : lorsque `channels.signal.sendReadReceipts` vaut true, OpenClaw transmet les confirmations de lecture pour les messages privés autorisés.
- `signal-cli` n’expose pas les confirmations de lecture pour les groupes.

## Réactions d’état du cycle de vie

Définissez `messages.statusReactions.enabled: true` pour permettre à Signal d’afficher le cycle de réactions partagé mis en file d’attente/réflexion/outil/compaction/terminé/erreur lors des échanges entrants. Signal utilise l’horodatage du message entrant comme cible de la réaction ; les réactions de groupe sont envoyées avec l’ID de groupe Signal et l’expéditeur d’origine comme auteur cible.

Les réactions d’état nécessitent également une réaction d’accusé de réception et un `messages.ackReactionScope` correspondant (`direct`, `group-all`, `group-mentions` ou `all`). Définissez `channels.signal.reactionLevel: "off"` pour désactiver les réactions d’état de Signal.

`messages.removeAckAfterReply: true` efface la réaction d’état finale après la durée de maintien configurée. Sinon, Signal restaure la réaction d’accusé de réception initiale après l’état final terminé/erreur.

## Réactions (outil de message)

Utilisez `message action=react` avec `channel=signal`.

- Cibles : numéro E.164 ou UUID de l’expéditeur (utilisez `uuid:<id>` provenant de la sortie d’association ; un UUID seul fonctionne également).
- `messageId` est l’horodatage Signal du message auquel vous réagissez.
- Les réactions de groupe nécessitent `targetAuthor` ou `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuration :

- `channels.signal.actions.reactions` : active/désactive les actions de réaction (true par défaut).
- `channels.signal.reactionLevel` : `off | ack | minimal | extensive` (`minimal` par défaut).
  - `off`/`ack` désactive les réactions de l’agent (l’outil de message `react` renvoie une erreur).
  - `minimal`/`extensive` active les réactions de l’agent et définit le niveau d’orientation.
- Remplacements par compte : `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Réactions d’approbation

Les invites d’approbation d’exécution et de Plugin Signal utilisent les blocs de routage de premier niveau `approvals.exec` et `approvals.plugin`. Signal ne possède aucun bloc `channels.signal.execApprovals`.

- `👍` approuve une fois.
- `👎` refuse.
- Utilisez `/approve <id> allow-always` lorsqu’une demande propose une approbation persistante.

La résolution des réactions d’approbation nécessite des approbateurs Signal explicites provenant de `channels.signal.allowFrom`, de `channels.signal.defaultTo` ou des champs correspondants au niveau du compte. Les invites d’approbation d’exécution directe dans la même discussion peuvent toujours masquer la solution de secours locale `/approve` en double sans approbateurs explicites ; les approbations de groupe sans approbateur conservent la solution de secours locale visible.

## Cibles de distribution (CLI/Cron)

- Messages privés : `signal:+15551234567` (ou E.164 seul).
- Messages privés par UUID : `uuid:<id>` (ou UUID seul).
- Groupes : `signal:group:<groupId>`.
- Noms d’utilisateur : `username:<name>` (si votre compte Signal les prend en charge).

## Alias

Configurez des alias pour attribuer des noms stables aux cibles Signal récurrentes. Les alias sont uniquement une configuration côté OpenClaw ; ils ne créent ni ne modifient les contacts Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Utilisez les alias partout où les cibles de distribution Signal sont acceptées :

```bash
openclaw message send --channel signal --target signal:ops --message "Le déploiement est terminé"
```

Les alias par compte héritent des alias de premier niveau et peuvent ajouter ou remplacer des noms :

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` et `openclaw directory groups list --channel signal` répertorient les alias configurés. Le répertoire Signal repose sur la configuration ; il n’interroge pas les contacts Signal en direct et ne modifie pas le compte Signal.

## Dépannage

Exécutez d’abord cette séquence :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Vérifiez ensuite l’état d’association des messages privés si nécessaire :

```bash
openclaw pairing list signal
```

Échecs courants :

- Démon accessible, mais aucune réponse : vérifiez les paramètres du compte/démon (`httpUrl`, `account`) et le mode de réception.
- Messages privés ignorés : l’approbation d’association de l’expéditeur est en attente.
- Messages de groupe ignorés : les restrictions liées à l’expéditeur ou aux mentions du groupe bloquent la distribution.
- Erreurs de validation de la configuration après des modifications : exécutez `openclaw doctor --fix`.
- Signal absent des diagnostics : vérifiez `channels.signal.enabled: true`.

Vérifications supplémentaires :

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Pour le processus de diagnostic : [Dépannage des canaux](/fr/channels/troubleshooting).

## Notes de sécurité

- `signal-cli` stocke les clés du compte localement (généralement dans `~/.local/share/signal-cli/data/`).
- Sauvegardez l’état du compte Signal avant une migration ou une reconstruction du serveur.
- Conservez `channels.signal.dmPolicy: "pairing"`, sauf si vous souhaitez explicitement un accès plus large aux messages privés.
- La vérification par SMS est uniquement nécessaire pour les processus d’inscription ou de récupération, mais la perte de contrôle du numéro/compte peut compliquer une nouvelle inscription.

## Référence de configuration (Signal)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.signal.enabled` : active/désactive le démarrage du canal.
- `channels.signal.apiMode` : `auto | native | container` (valeur par défaut : auto). Consultez [Mode conteneur](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account` : numéro E.164 du compte du bot.
- `channels.signal.accountUuid` : UUID facultatif du compte du bot pour la détection native des @mentions et la protection contre les boucles.
- `channels.signal.cliPath` : chemin vers `signal-cli`.
- `channels.signal.configPath` : répertoire `signal-cli --config` facultatif.
- `channels.signal.httpUrl` : URL complète du démon (remplace l’hôte/le port).
- `channels.signal.httpHost`, `channels.signal.httpPort` : adresse d’écoute du démon (`127.0.0.1:8080` par défaut).
- `channels.signal.autoStart` : lancement automatique du démon (true par défaut si `httpUrl` n’est pas défini).
- `channels.signal.startupTimeoutMs` : délai maximal d’attente au démarrage en ms (min. 1000, limite 120000 ; 30000 par défaut).
- `channels.signal.receiveMode` : `on-start | manual`.
- `channels.signal.ignoreAttachments` : ignore le téléchargement des pièces jointes.
- `channels.signal.ignoreStories` : ignore les stories provenant du démon.
- `channels.signal.sendReadReceipts` : transmet les confirmations de lecture.
- `channels.signal.dmPolicy` : `pairing | allowlist | open | disabled` (valeur par défaut : association).
- `channels.signal.allowFrom` : liste d’autorisation des messages privés (E.164 ou `uuid:<id>`). `open` nécessite `"*"`. Signal ne possède pas de noms d’utilisateur ; utilisez des identifiants de téléphone/UUID.
- `channels.signal.aliases` : alias côté OpenClaw pour les cibles de distribution de messages privés ou de groupe.
- `channels.signal.groupPolicy` : `open | allowlist | disabled` (valeur par défaut : liste d’autorisation).
- `channels.signal.groupAllowFrom` : liste d’autorisation des groupes ; accepte les ID de groupe Signal (bruts, `group:<id>` ou `signal:group:<id>`), les numéros E.164 des expéditeurs ou les valeurs `uuid:<id>`.
- `channels.signal.groups` : remplacements par groupe indexés par ID de groupe Signal (ou `"*"`). Champs pris en charge : `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups` : version par compte de `channels.signal.groups` pour les configurations multicomptes.
- `channels.signal.accounts.<id>.aliases` : alias par compte, fusionnés avec les alias de premier niveau.
- `channels.signal.replyToMode` : mode de citation native des réponses, `off | first | all | batched` (valeur par défaut : `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group` : remplacements de citation native des réponses par type de discussion.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group` : remplacements de citation des réponses par compte.
- `channels.signal.historyLimit` : nombre maximal de messages de groupe à inclure comme contexte (0 désactive cette fonction).
- `channels.signal.dmHistoryLimit` : limite de l’historique des messages privés en tours utilisateur. Remplacements par utilisateur : `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit` : taille des segments sortants en caractères (4000 par défaut).
- `channels.signal.streaming.chunkMode` : `length` (par défaut) ou `newline` pour découper d’abord aux lignes vides (limites de paragraphes), puis selon la longueur.
- `channels.signal.mediaMaxMb` : limite des médias entrants/sortants en Mo (8 par défaut).
- `channels.signal.reactionLevel` : `off | ack | minimal | extensive` (`minimal` par défaut). Consultez [Réactions](#reactions-message-tool).
- `channels.signal.reactionNotifications` : `off | own | all | allowlist` (`own` par défaut) — moment où l’agent est informé des réactions entrantes d’autres personnes.
- `channels.signal.reactionAllowlist` : expéditeurs dont les réactions informent l’agent lorsque `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce` : contrôles de diffusion en continu par blocs partagés entre les canaux. Consultez [Diffusion en continu](/fr/concepts/streaming).

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (solution de repli en texte brut ; les @mentions natives de Signal sont détectées à partir des métadonnées structurées lorsque l’identité du compte du bot est configurée).
- `messages.groupChat.mentionPatterns` (solution de repli globale).
- `messages.responsePrefix`.

## Pages connexes

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Association](/fr/channels/pairing) - authentification par message privé et processus d’association
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et durcissement
