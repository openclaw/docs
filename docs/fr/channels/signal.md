---
read_when:
    - Configuration de la prise en charge de Signal
    - Débogage de l’envoi et de la réception avec Signal
summary: Prise en charge de Signal via signal-cli (démon natif ou conteneur bbernhard), procédures de configuration et modèle de numérotation
title: Signal
x-i18n:
    generated_at: "2026-07-12T02:21:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal est un plugin de canal téléchargeable (`@openclaw/signal`). Le Gateway communique avec `signal-cli` via HTTP : soit avec le démon natif (JSON-RPC + SSE), soit avec le conteneur [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw n’intègre pas libsignal.

## Le modèle de numéro (à lire en premier)

- Le Gateway se connecte à un **appareil Signal** : le compte `signal-cli`.
- Exécuter le bot sur **votre compte Signal personnel** lui fait ignorer vos propres messages (protection contre les boucles).
- Pour que « j’envoie un message au bot et il répond », utilisez un **numéro de bot distinct**.

## Installation

```bash
openclaw plugins install @openclaw/signal
```

Les spécifications de plugin sans préfixe essaient d’abord ClawHub, puis utilisent npm comme solution de repli. Forcez une source avec `openclaw plugins install clawhub:@openclaw/signal` ou `npm:@openclaw/signal`. `plugins install` enregistre et active le plugin ; aucune étape `enable` distincte n’est nécessaire. Consultez [Plugins](/fr/tools/plugin) pour connaître les règles générales d’installation.

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
    L’assistant détecte si `signal-cli` se trouve dans `PATH` et, s’il est absent, propose de l’installer : il télécharge la version native GraalVM officielle sous Linux x86-64, ou l’installe via Homebrew sous macOS et sur les autres architectures. Il demande ensuite le numéro du bot et le chemin de `signal-cli`.
  </Step>
  <Step title="Associer ou enregistrer le compte">
    - **Association par code QR (la plus rapide) :** `signal-cli link -n "OpenClaw"`, puis scannez le code avec Signal. Consultez le [parcours A](#setup-path-a-link-existing-signal-account-qr).
    - **Enregistrement par SMS :** numéro dédié avec captcha et vérification par SMS. Consultez le [parcours B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Vérifier et jumeler">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Envoyez un premier message privé et approuvez le jumelage : `openclaw pairing approve signal <CODE>`.
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

| Champ        | Description                                                               |
| ------------ | ------------------------------------------------------------------------- |
| `account`    | Numéro de téléphone du bot au format E.164 (`+15551234567`)               |
| `cliPath`    | Chemin vers `signal-cli` (`signal-cli` s’il se trouve dans `PATH`)        |
| `configPath` | Répertoire de configuration de signal-cli transmis avec `--config`       |
| `dmPolicy`   | Politique d’accès aux messages privés (`pairing` recommandé)              |
| `allowFrom`  | Numéros de téléphone ou valeurs `uuid:<id>` autorisés à envoyer un message privé |

Prise en charge de plusieurs comptes : utilisez `channels.signal.accounts` avec une configuration par compte et un `name` facultatif. Consultez [Canaux multicomptes](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle commun.

## Fonctionnalités

- Routage déterministe : les réponses sont toujours renvoyées vers Signal.
- Les messages privés partagent la session principale de l’agent ; les groupes sont isolés (`agent:<agentId>:signal:group:<groupId>`).
- Par défaut, Signal peut écrire les mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`). Désactivez cette possibilité avec `channels.signal.configWrites: false`.

## Parcours de configuration A : associer un compte Signal existant (code QR)

1. Installez `signal-cli` (version JVM ou native), ou laissez `openclaw channels add` l’installer pour vous.
2. Associez un compte de bot : `signal-cli link -n "OpenClaw"`, puis scannez le code QR dans Signal.
3. Configurez Signal et démarrez le Gateway.

## Parcours de configuration B : enregistrer un numéro de bot dédié (SMS, Linux)

Utilisez cette méthode pour un numéro de bot dédié au lieu d’associer un compte d’application Signal existant. Le processus ci-dessous est testé sous Ubuntu 24.

1. Obtenez un numéro pouvant recevoir des SMS (ou une vérification vocale pour les lignes fixes). Un numéro de bot dédié évite les conflits de compte ou de session.
2. Installez `signal-cli` sur l’hôte du Gateway :

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si vous utilisez la version JVM (`signal-cli-${VERSION}.tar.gz`), installez d’abord un JRE. Maintenez `signal-cli` à jour ; le projet en amont indique que les anciennes versions peuvent cesser de fonctionner lorsque les API des serveurs Signal évoluent.

3. Enregistrez et vérifiez le numéro :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si un captcha est requis (un accès à un navigateur est nécessaire pour effectuer cette étape) :

1. Ouvrez `https://signalcaptchas.org/registration/generate.html`.
2. Effectuez le captcha, puis copiez la cible du lien `signalcaptcha://...` depuis "Open Signal".
3. Exécutez la commande depuis la même adresse IP externe que la session du navigateur lorsque cela est possible (les jetons de captcha expirent rapidement).
4. Enregistrez et vérifiez immédiatement :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configurez OpenClaw, redémarrez le Gateway et vérifiez le canal :

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Jumelez l’expéditeur de vos messages privés :
   - Envoyez n’importe quel message au numéro du bot.
   - Approuvez-le sur le serveur : `openclaw pairing approve signal <PAIRING_CODE>`.
   - Enregistrez le numéro du bot comme contact sur votre téléphone afin d’éviter "Unknown contact".

<Warning>
L’enregistrement d’un compte associé à un numéro de téléphone avec `signal-cli` peut désauthentifier la session principale de l’application Signal pour ce numéro. Préférez un numéro de bot dédié, ou utilisez le mode d’association par code QR pour conserver la configuration existante de l’application sur votre téléphone.
</Warning>

Références en amont :

- README de `signal-cli` : `https://github.com/AsamK/signal-cli`
- Processus de captcha : `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Processus d’association : `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode démon externe (httpUrl)

Pour gérer vous-même `signal-cli` (démarrages à froid lents de la JVM, initialisation du conteneur, processeurs partagés), exécutez le démon séparément et configurez OpenClaw pour l’utiliser :

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

Cela évite le lancement automatique et l’attente d’OpenClaw au démarrage. Pour les démarrages automatiques lents, définissez `channels.signal.startupTimeoutMs`.

## Mode conteneur (bbernhard/signal-cli-rest-api)

Au lieu d’exécuter `signal-cli` nativement, utilisez le conteneur Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), qui fournit une interface REST + WebSocket autour de `signal-cli`.

Exigences :

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` détermine le protocole utilisé par OpenClaw :

| Valeur        | Comportement                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `"auto"`      | (Par défaut) Sonde les deux transports ; la diffusion continue valide la réception WebSocket du conteneur |
| `"native"`    | Force signal-cli natif (JSON-RPC sur `/api/v1/rpc`, SSE sur `/api/v1/events`)                             |
| `"container"` | Force le conteneur bbernhard (REST sur `/v2/send`, WebSocket sur `/v1/receive/{account}`)                 |

Lorsque `apiMode` vaut `"auto"`, OpenClaw met en cache le mode détecté pendant 30 secondes pour chaque URL de démon afin d’éviter les sondes répétées (le mode natif est prioritaire lorsque les deux transports fonctionnent correctement). La réception par conteneur n’est sélectionnée pour la diffusion continue qu’après la mise à niveau de `/v1/receive/{account}` vers WebSocket, ce qui nécessite `MODE=json-rpc`.

Le mode conteneur prend en charge les mêmes opérations Signal que le mode natif lorsque le conteneur expose les API correspondantes : envoi, réception, pièces jointes, indicateurs de saisie, accusés de lecture et de consultation, réactions, groupes et texte stylisé. OpenClaw traduit les appels RPC Signal natifs en charges utiles REST du conteneur, notamment les identifiants de groupe `group.{base64(internal_id)}` et `text_mode: "styled"` pour le texte mis en forme.

Remarques opérationnelles :

- Utilisez `autoStart: false` avec le mode conteneur ; OpenClaw ne doit pas lancer de démon natif lorsque `apiMode: "container"` est sélectionné.
- Utilisez `MODE=json-rpc` pour la réception. `MODE=normal` peut donner l’impression que `/v1/about` fonctionne correctement, mais `/v1/receive/{account}` ne sera pas mis à niveau vers WebSocket ; OpenClaw ne sélectionnera donc pas la réception continue par conteneur en mode `auto`.
- Définissez `apiMode: "container"` lorsque `httpUrl` pointe vers l’API REST bbernhard, `"native"` lorsqu’il pointe vers l’interface JSON-RPC/SSE native de `signal-cli`, et `"auto"` lorsque le déploiement peut varier.
- Les téléchargements de pièces jointes en mode conteneur respectent les mêmes limites de taille en octets que le mode natif. Les réponses trop volumineuses sont rejetées avant leur mise en mémoire tampon complète lorsque le serveur envoie `Content-Length`, et pendant la diffusion continue dans les autres cas.

## Contrôle d’accès (messages privés + groupes)

Messages privés :

- Valeur par défaut : `channels.signal.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code de jumelage ; les messages sont ignorés jusqu’à l’approbation (les codes expirent après 1 heure).
- Approuvez-les avec `openclaw pairing list signal` et `openclaw pairing approve signal <CODE>`.
- Le jumelage est l’échange de jetons par défaut pour les messages privés Signal. Détails : [Jumelage](/fr/channels/pairing)
- Les expéditeurs identifiés uniquement par UUID (depuis `sourceUuid`) sont enregistrés sous la forme `uuid:<id>` dans `channels.signal.allowFrom`.

Groupes :

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` détermine quels groupes ou expéditeurs peuvent déclencher des réponses dans les groupes lorsque `allowlist` est défini ; les entrées peuvent être des identifiants de groupe Signal (bruts, `group:<id>` ou `signal:group:<id>`), des numéros de téléphone d’expéditeurs, des valeurs `uuid:<id>` ou `*`.
- `channels.signal.groups["<group-id>" | "*"]` peut remplacer le comportement des groupes avec `requireMention`, `tools` et `toolsBySender`.
- Utilisez `channels.signal.accounts.<id>.groups` pour définir des remplacements par compte dans les configurations multicomptes.
- Autoriser un groupe via `groupAllowFrom` ne désactive pas à lui seul l’obligation de mention. Une entrée `channels.signal.groups["<group-id>"]` configurée explicitement traite chaque message du groupe, sauf si `requireMention: true` est défini explicitement.
- Remarque sur l’exécution : si `channels.signal` est entièrement absent, l’exécution utilise `groupPolicy="allowlist"` comme solution de repli pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

## Fonctionnement (comportement)

- Mode natif : `signal-cli` s’exécute comme un démon ; le Gateway lit les événements via SSE.
- Mode conteneur : le Gateway envoie les messages via l’API REST et les reçoit via WebSocket.
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée.
- Les réponses sont toujours renvoyées vers le même numéro ou groupe.
- Les réponses aux messages entrants incluent les métadonnées de citation natives de Signal lorsque le système dorsal accepte l’horodatage et l’auteur du message entrant ; si les métadonnées de citation sont absentes ou rejetées, OpenClaw envoie la réponse comme un message normal.
- Configurez l’utilisation des citations natives avec `channels.signal.replyToMode = off | first | all | batched`, ou avec `channels.signal.replyToModeByChatType.direct/group` pour des remplacements selon le type de conversation. Les valeurs définies au niveau du compte sous `channels.signal.accounts.<id>` sont prioritaires.

## Médias + limites

- Le texte sortant est découpé selon `channels.signal.textChunkLimit` (4000 par défaut).
- Découpage facultatif par sauts de ligne : définissez `channels.signal.chunkMode="newline"` pour effectuer d’abord le découpage sur les lignes vides (limites de paragraphes), puis selon la longueur.
- Les pièces jointes sont prises en charge (base64 récupéré depuis `signal-cli`).
- Lorsque `contentType` est absent, les pièces jointes de type note vocale utilisent le nom de fichier `signal-cli` comme valeur MIME de secours, afin que la transcription audio puisse toujours identifier les mémos vocaux AAC.
- Limite par défaut des médias : `channels.signal.mediaMaxMb` (8 par défaut).
- Utilisez `channels.signal.ignoreAttachments` pour ignorer le téléchargement des médias.
- Le contexte de l’historique des groupes utilise `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), avec repli sur `messages.groupChat.historyLimit`. Définissez cette valeur sur `0` pour le désactiver (50 par défaut).

## Indicateurs de saisie et confirmations de lecture

- **Indicateurs de saisie** : OpenClaw envoie des signaux de saisie via `signal-cli sendTyping` et les actualise pendant la génération d’une réponse.
- **Confirmations de lecture** : lorsque `channels.signal.sendReadReceipts` vaut `true`, OpenClaw transmet les confirmations de lecture pour les messages privés autorisés.
- `signal-cli` n’expose pas les confirmations de lecture pour les groupes.

## Réactions d’état du cycle de vie

Définissez `messages.statusReactions.enabled: true` pour permettre à Signal d’afficher le cycle partagé de réactions en attente/réflexion/outil/compaction/terminé/erreur lors des interactions entrantes. Signal utilise l’horodatage du message entrant comme cible de la réaction ; les réactions de groupe sont envoyées avec l’identifiant du groupe Signal et l’expéditeur d’origine comme auteur cible.

Les réactions d’état nécessitent également une réaction d’accusé de réception et une valeur correspondante pour `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` ou `all`). Définissez `channels.signal.reactionLevel: "off"` pour désactiver les réactions d’état de Signal.

`messages.removeAckAfterReply: true` efface la réaction d’état finale après le délai de maintien configuré. Sinon, Signal rétablit la réaction initiale d’accusé de réception après l’état final terminé/erreur.

## Réactions (outil de messagerie)

Utilisez `message action=react` avec `channel=signal`.

- Cibles : numéro E.164 ou UUID de l’expéditeur (utilisez `uuid:<id>` depuis la sortie de l’association ; un UUID seul fonctionne également).
- `messageId` correspond à l’horodatage Signal du message auquel vous réagissez.
- Les réactions de groupe nécessitent `targetAuthor` ou `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuration :

- `channels.signal.actions.reactions` : active ou désactive les actions de réaction (`true` par défaut).
- `channels.signal.reactionLevel` : `off | ack | minimal | extensive` (`minimal` par défaut).
  - `off`/`ack` désactive les réactions de l’agent (l’outil de messagerie `react` renvoie une erreur).
  - `minimal`/`extensive` active les réactions de l’agent et définit le niveau de consignes.
- Remplacements par compte : `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Réactions d’approbation

Les demandes d’approbation Signal pour l’exécution et les plugins utilisent les blocs de routage de premier niveau `approvals.exec` et `approvals.plugin`. Signal ne possède pas de bloc `channels.signal.execApprovals`.

- `👍` approuve une fois.
- `👎` refuse.
- Utilisez `/approve <id> allow-always` lorsqu’une demande propose une approbation permanente.

La résolution des réactions d’approbation nécessite des approbateurs Signal explicitement définis dans `channels.signal.allowFrom`, `channels.signal.defaultTo` ou les champs correspondants au niveau du compte. Les demandes directes d’approbation d’exécution dans la même conversation peuvent néanmoins masquer le repli local `/approve` en double sans approbateurs explicites ; pour les approbations de groupe sans approbateur, le repli local reste visible.

## Cibles de livraison (CLI/Cron)

- Messages privés : `signal:+15551234567` (ou numéro E.164 seul).
- Messages privés par UUID : `uuid:<id>` (ou UUID seul).
- Groupes : `signal:group:<groupId>`.
- Noms d’utilisateur : `username:<name>` (si votre compte Signal les prend en charge).

## Alias

Configurez des alias afin d’utiliser des noms stables pour les cibles Signal récurrentes. Les alias relèvent uniquement de la configuration OpenClaw ; ils ne créent ni ne modifient les contacts Signal.

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

Utilisez les alias partout où les cibles de livraison Signal sont acceptées :

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Les alias propres à chaque compte héritent des alias de premier niveau et peuvent ajouter ou remplacer des noms :

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

`openclaw directory peers list --channel signal` et `openclaw directory groups list --channel signal` répertorient les alias configurés. L’annuaire Signal repose sur la configuration ; il n’interroge pas les contacts Signal en temps réel et ne modifie pas le compte Signal.

## Résolution des problèmes

Exécutez d’abord cette séquence :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Confirmez ensuite l’état de l’association des messages privés si nécessaire :

```bash
openclaw pairing list signal
```

Défaillances courantes :

- Démon accessible, mais aucune réponse : vérifiez les paramètres du compte et du démon (`httpUrl`, `account`), ainsi que le mode de réception.
- Messages privés ignorés : l’approbation de l’association de l’expéditeur est en attente.
- Messages de groupe ignorés : les restrictions relatives à l’expéditeur ou aux mentions du groupe bloquent la livraison.
- Erreurs de validation de la configuration après modification : exécutez `openclaw doctor --fix`.
- Signal absent des diagnostics : vérifiez que `channels.signal.enabled: true`.

Vérifications supplémentaires :

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Pour le processus de diagnostic : [Résolution des problèmes liés aux canaux](/fr/channels/troubleshooting).

## Remarques de sécurité

- `signal-cli` stocke localement les clés du compte (généralement dans `~/.local/share/signal-cli/data/`).
- Sauvegardez l’état du compte Signal avant toute migration ou reconstruction du serveur.
- Conservez `channels.signal.dmPolicy: "pairing"` sauf si vous souhaitez explicitement élargir l’accès aux messages privés.
- La vérification par SMS n’est nécessaire que pour les processus d’inscription ou de récupération, mais la perte de contrôle du numéro ou du compte peut compliquer une nouvelle inscription.

## Référence de configuration (Signal)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.signal.enabled` : active ou désactive le démarrage du canal.
- `channels.signal.apiMode` : `auto | native | container` (valeur par défaut : `auto`). Consultez [Mode conteneur](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account` : numéro E.164 du compte du bot.
- `channels.signal.cliPath` : chemin vers `signal-cli`.
- `channels.signal.configPath` : répertoire facultatif pour `signal-cli --config`.
- `channels.signal.httpUrl` : URL complète du démon (remplace l’hôte et le port).
- `channels.signal.httpHost`, `channels.signal.httpPort` : adresse d’écoute du démon (`127.0.0.1:8080` par défaut).
- `channels.signal.autoStart` : lance automatiquement le démon (`true` par défaut si `httpUrl` n’est pas défini).
- `channels.signal.startupTimeoutMs` : délai maximal d’attente du démarrage en ms (minimum 1000, maximum 120000 ; 30000 par défaut).
- `channels.signal.receiveMode` : `on-start | manual`.
- `channels.signal.ignoreAttachments` : ignore le téléchargement des pièces jointes.
- `channels.signal.ignoreStories` : ignore les stories provenant du démon.
- `channels.signal.sendReadReceipts` : transmet les confirmations de lecture.
- `channels.signal.dmPolicy` : `pairing | allowlist | open | disabled` (valeur par défaut : `pairing`).
- `channels.signal.allowFrom` : liste d’autorisation des messages privés (E.164 ou `uuid:<id>`). `open` nécessite `"*"`. Signal ne possède pas de noms d’utilisateur ; utilisez les identifiants de téléphone ou UUID.
- `channels.signal.aliases` : alias gérés par OpenClaw pour les cibles de livraison de messages privés ou de groupe.
- `channels.signal.groupPolicy` : `open | allowlist | disabled` (valeur par défaut : `allowlist`).
- `channels.signal.groupAllowFrom` : liste d’autorisation des groupes ; accepte les identifiants de groupe Signal (bruts, `group:<id>` ou `signal:group:<id>`), les numéros E.164 des expéditeurs ou les valeurs `uuid:<id>`.
- `channels.signal.groups` : remplacements par groupe, indexés par identifiant de groupe Signal (ou `"*"`). Champs pris en charge : `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups` : version par compte de `channels.signal.groups` pour les configurations à plusieurs comptes.
- `channels.signal.accounts.<id>.aliases` : alias par compte, fusionnés avec ceux de premier niveau.
- `channels.signal.replyToMode` : mode de citation native des réponses, `off | first | all | batched` (`all` par défaut).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group` : remplacements du mode de citation native des réponses selon le type de conversation.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group` : remplacements du mode de citation des réponses par compte.
- `channels.signal.historyLimit` : nombre maximal de messages de groupe à inclure comme contexte (`0` désactive cette fonctionnalité).
- `channels.signal.dmHistoryLimit` : limite de l’historique des messages privés exprimée en interactions utilisateur. Remplacements par utilisateur : `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit` : taille des segments sortants en caractères (4000 par défaut).
- `channels.signal.chunkMode` : `length` (valeur par défaut) ou `newline` pour effectuer d’abord le découpage sur les lignes vides (limites de paragraphes), puis selon la longueur.
- `channels.signal.mediaMaxMb` : limite des médias entrants et sortants en Mo (8 par défaut).
- `channels.signal.reactionLevel` : `off | ack | minimal | extensive` (`minimal` par défaut). Consultez [Réactions](#reactions-message-tool).
- `channels.signal.reactionNotifications` : `off | own | all | allowlist` (`own` par défaut) — détermine quand l’agent est informé des réactions entrantes d’autres personnes.
- `channels.signal.reactionAllowlist` : expéditeurs dont les réactions notifient l’agent lorsque `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce` : paramètres de contrôle de la diffusion en continu par blocs, partagés entre les canaux. Consultez [Diffusion en continu](/fr/concepts/streaming).

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (Signal ne prend pas en charge les mentions natives).
- `messages.groupChat.mentionPatterns` (repli global).
- `messages.responsePrefix`.

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification des messages privés et processus d’association
- [Groupes](/fr/channels/groups) — comportement des conversations de groupe et restrictions relatives aux mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
