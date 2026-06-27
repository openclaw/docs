---
read_when:
    - Configuration de la prise en charge de Signal
    - Déboguer l’envoi/la réception Signal
summary: Prise en charge de Signal via signal-cli (démon natif ou conteneur bbernhard), chemins de configuration et modèle de numéro
title: Signal
x-i18n:
    generated_at: "2026-06-27T17:12:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

Statut : intégration CLI externe. Gateway communique avec `signal-cli` via HTTP — soit le démon natif (JSON-RPC + SSE), soit le conteneur bbernhard/signal-cli-rest-api (REST + WebSocket).

## Prérequis

- OpenClaw installé sur votre serveur (le flux Linux ci-dessous a été testé sur Ubuntu 24).
- L’un des éléments suivants :
  - `signal-cli` disponible sur l’hôte (mode natif), **ou**
  - le conteneur Docker `bbernhard/signal-cli-rest-api` (mode conteneur).
- Un numéro de téléphone pouvant recevoir un SMS de vérification (pour le parcours d’inscription par SMS).
- Un accès navigateur pour le captcha Signal (`signalcaptchas.org`) pendant l’inscription.

## Configuration rapide (débutant)

1. Utilisez un **numéro Signal distinct** pour le bot (recommandé).
2. Installez le Plugin OpenClaw :

```bash
openclaw plugins install @openclaw/signal
```

3. Installez `signal-cli` (Java est requis si vous utilisez la version JVM).
4. Choisissez un parcours de configuration :
   - **Parcours A (lien QR) :** `signal-cli link -n "OpenClaw"` puis scannez avec Signal.
   - **Parcours B (inscription par SMS) :** inscrivez un numéro dédié avec captcha + vérification SMS.
5. Configurez OpenClaw et redémarrez le gateway.
6. Envoyez un premier MP et approuvez l’appairage (`openclaw pairing approve signal <CODE>`).

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

Référence des champs :

| Champ        | Description                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Numéro de téléphone du bot au format E.164 (`+15551234567`) |
| `cliPath`    | Chemin vers `signal-cli` (`signal-cli` si dans le `PATH`)  |
| `configPath` | Répertoire de configuration signal-cli passé comme `--config`        |
| `dmPolicy`   | Politique d’accès aux MP (`pairing` recommandé)          |
| `allowFrom`  | Numéros de téléphone ou valeurs `uuid:<id>` autorisés à envoyer des MP |

## Ce que c’est

- Canal Signal via `signal-cli` (pas libsignal intégré).
- Routage déterministe : les réponses reviennent toujours vers Signal.
- Les MP partagent la session principale de l’agent ; les groupes sont isolés (`agent:<agentId>:signal:group:<groupId>`).

## Écritures de configuration

Par défaut, Signal est autorisé à écrire les mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez avec :

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Le modèle de numéro (important)

- Le gateway se connecte à un **appareil Signal** (le compte `signal-cli`).
- Si vous exécutez le bot sur **votre compte Signal personnel**, il ignorera vos propres messages (protection contre les boucles).
- Pour « j’écris au bot et il répond », utilisez un **numéro de bot distinct**.

## Parcours de configuration A : lier un compte Signal existant (QR)

1. Installez `signal-cli` (version JVM ou native).
2. Liez un compte de bot :
   - `signal-cli link -n "OpenClaw"` puis scannez le QR dans Signal.
3. Configurez Signal et démarrez le gateway.

Exemple :

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

Prise en charge multi-compte : utilisez `channels.signal.accounts` avec une configuration par compte et un `name` facultatif. Consultez [`gateway/configuration`](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle partagé.

## Parcours de configuration B : inscrire un numéro de bot dédié (SMS, Linux)

Utilisez ceci lorsque vous voulez un numéro de bot dédié au lieu de lier un compte d’application Signal existant.

1. Obtenez un numéro pouvant recevoir des SMS (ou une vérification vocale pour les lignes fixes).
   - Utilisez un numéro de bot dédié pour éviter les conflits de compte/session.
2. Installez `signal-cli` sur l’hôte du gateway :

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si vous utilisez la version JVM (`signal-cli-${VERSION}.tar.gz`), installez d’abord JRE 25+.
Gardez `signal-cli` à jour ; le projet amont indique que les anciennes versions peuvent cesser de fonctionner lorsque les API serveur Signal changent.

3. Inscrivez et vérifiez le numéro :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si le captcha est requis :

1. Ouvrez `https://signalcaptchas.org/registration/generate.html`.
2. Complétez le captcha, copiez la cible du lien `signalcaptcha://...` depuis « Open Signal ».
3. Exécutez depuis la même IP externe que la session du navigateur lorsque c’est possible.
4. Relancez immédiatement l’inscription (les jetons captcha expirent rapidement) :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configurez OpenClaw, redémarrez le gateway, vérifiez le canal :

```bash
# Si vous exécutez le gateway comme service systemd utilisateur :
systemctl --user restart openclaw-gateway.service

# Puis vérifiez :
openclaw doctor
openclaw channels status --probe
```

5. Appairez l’expéditeur de vos MP :
   - Envoyez n’importe quel message au numéro du bot.
   - Approuvez le code sur le serveur : `openclaw pairing approve signal <PAIRING_CODE>`.
   - Enregistrez le numéro du bot comme contact sur votre téléphone pour éviter « Contact inconnu ».

<Warning>
L’inscription d’un compte avec numéro de téléphone via `signal-cli` peut désauthentifier la session principale de l’application Signal pour ce numéro. Préférez un numéro de bot dédié, ou utilisez le mode lien QR si vous devez conserver votre configuration actuelle de l’application mobile.
</Warning>

Références amont :

- README de `signal-cli` : `https://github.com/AsamK/signal-cli`
- Flux captcha : `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flux de liaison : `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode démon externe (httpUrl)

Si vous voulez gérer `signal-cli` vous-même (démarrages à froid JVM lents, initialisation de conteneur ou CPU partagés), exécutez le démon séparément et pointez OpenClaw vers lui :

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

Cela évite le lancement automatique et l’attente de démarrage dans OpenClaw. Pour les démarrages lents lors du lancement automatique, définissez `channels.signal.startupTimeoutMs`.

## Mode conteneur (bbernhard/signal-cli-rest-api)

Au lieu d’exécuter `signal-cli` nativement, vous pouvez utiliser le conteneur Docker [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Il encapsule `signal-cli` derrière une API REST et une interface WebSocket.

Exigences :

- Le conteneur **doit** s’exécuter avec `MODE=json-rpc` pour la réception de messages en temps réel.
- Inscrivez ou liez votre compte Signal dans le conteneur avant de connecter OpenClaw.

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

Configuration OpenClaw :

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

Le champ `apiMode` contrôle le protocole qu’OpenClaw utilise :

| Valeur         | Comportement                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Par défaut) Sonde les deux transports ; le streaming valide la réception WebSocket du conteneur    |
| `"native"`    | Force signal-cli natif (JSON-RPC sur `/api/v1/rpc`, SSE sur `/api/v1/events`)         |
| `"container"` | Force le conteneur bbernhard (REST sur `/v2/send`, WebSocket sur `/v1/receive/{account}`) |

Quand `apiMode` vaut `"auto"`, OpenClaw met en cache le mode détecté pendant 30 secondes pour éviter les sondes répétées. La réception conteneur n’est sélectionnée pour le streaming qu’après que `/v1/receive/{account}` passe en WebSocket, ce qui nécessite `MODE=json-rpc`.

Le mode conteneur prend en charge les mêmes opérations de canal Signal que le mode natif lorsque le conteneur expose les API correspondantes : envois, réceptions, pièces jointes, indicateurs de saisie, accusés de lecture/vue, réactions, groupes et texte stylisé. OpenClaw traduit ses appels RPC Signal natifs en charges utiles REST du conteneur, notamment les ID de groupe `group.{base64(internal_id)}` et `text_mode: "styled"` pour le texte formaté.

Notes opérationnelles :

- Utilisez `autoStart: false` avec le mode conteneur. OpenClaw ne doit pas lancer de démon natif lorsque `apiMode: "container"` est sélectionné.
- Utilisez `MODE=json-rpc` pour la réception. `MODE=normal` peut faire apparaître `/v1/about` comme sain, mais `/v1/receive/{account}` ne passe pas en WebSocket ; OpenClaw ne sélectionnera donc pas le streaming de réception conteneur en mode `auto`.
- Définissez `apiMode: "container"` lorsque vous savez que `httpUrl` pointe vers l’API REST de bbernhard. Définissez `apiMode: "native"` lorsque vous savez qu’il pointe vers le JSON-RPC/SSE natif de `signal-cli`. Utilisez `"auto"` lorsque le déploiement peut varier.
- Les téléchargements de pièces jointes en mode conteneur respectent les mêmes limites d’octets média que le mode natif. Les réponses trop volumineuses sont rejetées avant d’être entièrement mises en mémoire tampon lorsque le serveur envoie `Content-Length`, et pendant le streaming sinon.

## Contrôle d’accès (MP + groupes)

MP :

- Par défaut : `channels.signal.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuvez via :
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- L’appairage est l’échange de jeton par défaut pour les MP Signal. Détails : [Appairage](/fr/channels/pairing)
- Les expéditeurs uniquement UUID (depuis `sourceUuid`) sont stockés comme `uuid:<id>` dans `channels.signal.allowFrom`.

Groupes :

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` contrôle quels groupes ou expéditeurs peuvent déclencher des réponses de groupe lorsque `allowlist` est défini ; les entrées peuvent être des ID de groupe Signal (bruts, `group:<id>` ou `signal:group:<id>`), des numéros de téléphone d’expéditeur, des valeurs `uuid:<id>` ou `*`.
- `channels.signal.groups["<group-id>" | "*"]` peut remplacer le comportement de groupe avec `requireMention`, `tools` et `toolsBySender`.
- Utilisez `channels.signal.accounts.<id>.groups` pour les remplacements par compte dans les configurations multi-compte.
- L’ajout d’un groupe Signal à la liste d’autorisation via `groupAllowFrom` ne désactive pas à lui seul le filtrage par mention. Une entrée `channels.signal.groups["<group-id>"]` configurée explicitement traite chaque message de groupe sauf si `requireMention=true` est défini.
- Note d’exécution : si `channels.signal` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

## Fonctionnement (comportement)

- Mode natif : `signal-cli` s’exécute comme démon ; le gateway lit les événements via SSE.
- Mode conteneur : le gateway envoie via l’API REST et reçoit via WebSocket.
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée.
- Les réponses sont toujours routées vers le même numéro ou groupe.

## Médias + limites

- Le texte sortant est découpé selon `channels.signal.textChunkLimit` (4000 par défaut).
- Découpage facultatif par saut de ligne : définissez `channels.signal.chunkMode="newline"` pour découper sur les lignes vides (limites de paragraphes) avant le découpage par longueur.
- Pièces jointes prises en charge (base64 récupéré depuis `signal-cli`).
- Les pièces jointes de note vocale utilisent le nom de fichier `signal-cli` comme solution de repli MIME lorsque `contentType` est absent, afin que la transcription audio puisse toujours classer les mémos vocaux AAC.
- Limite média par défaut : `channels.signal.mediaMaxMb` (8 par défaut).
- Utilisez `channels.signal.ignoreAttachments` pour ignorer le téléchargement des médias.
- Le contexte d’historique de groupe utilise `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), avec repli sur `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (50 par défaut).

## Saisie + accusés de lecture

- **Indicateurs de saisie** : OpenClaw envoie des signaux de saisie via `signal-cli sendTyping` et les actualise pendant qu’une réponse est en cours.
- **Accusés de lecture** : lorsque `channels.signal.sendReadReceipts` vaut true, OpenClaw transmet les accusés de lecture pour les DM autorisés.
- Signal-cli n’expose pas les accusés de lecture pour les groupes.

## Réactions (outil de message)

- Utilisez `message action=react` avec `channel=signal`.
- Cibles : expéditeur E.164 ou UUID (utilisez `uuid:<id>` depuis la sortie d’association ; un UUID nu fonctionne aussi).
- `messageId` est l’horodatage Signal du message auquel vous réagissez.
- Les réactions de groupe nécessitent `targetAuthor` ou `targetAuthorUuid`.

Exemples :

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuration :

- `channels.signal.actions.reactions` : active/désactive les actions de réaction (true par défaut).
- `channels.signal.reactionLevel` : `off | ack | minimal | extensive`.
  - `off`/`ack` désactive les réactions de l’agent (l’outil de message `react` renverra une erreur).
  - `minimal`/`extensive` active les réactions de l’agent et définit le niveau de guidage.
- Remplacements par compte : `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Réactions d’approbation

Les invites d’approbation d’exécution Signal et de Plugin utilisent les blocs de routage de premier niveau `approvals.exec` et
`approvals.plugin`. Signal n’a pas de bloc
`channels.signal.execApprovals`.

- `👍` approuve une seule fois.
- `👎` refuse.
- Utilisez `/approve <id> allow-always` lorsqu’une demande propose une approbation persistante.

La résolution des réactions d’approbation nécessite des approbateurs Signal explicites depuis
`channels.signal.allowFrom`, `channels.signal.defaultTo` ou les champs correspondants au niveau du compte.
Les invites d’approbation d’exécution directes dans la même conversation peuvent toujours supprimer le doublon local de repli `/approve`
sans approbateurs explicites ; les approbations de groupe sans approbateur gardent le repli local visible.

## Cibles de livraison (CLI/Cron)

- DM : `signal:+15551234567` (ou E.164 simple).
- DM UUID : `uuid:<id>` (ou UUID nu).
- Groupes : `signal:group:<groupId>`.
- Noms d’utilisateur : `username:<name>` (si pris en charge par votre compte Signal).

## Dépannage

Exécutez d’abord cette séquence :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Confirmez ensuite l’état d’association des DM si nécessaire :

```bash
openclaw pairing list signal
```

Échecs courants :

- Démon joignable mais aucune réponse : vérifiez les paramètres de compte/démon (`httpUrl`, `account`) et le mode de réception.
- DM ignorés : l’expéditeur attend l’approbation d’association.
- Messages de groupe ignorés : le filtrage par expéditeur/mention de groupe bloque la livraison.
- Erreurs de validation de configuration après des modifications : exécutez `openclaw doctor --fix`.
- Signal absent des diagnostics : confirmez `channels.signal.enabled: true`.

Vérifications supplémentaires :

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Pour le flux de triage : [/channels/troubleshooting](/fr/channels/troubleshooting).

## Notes de sécurité

- `signal-cli` stocke les clés de compte localement (généralement `~/.local/share/signal-cli/data/`).
- Sauvegardez l’état du compte Signal avant une migration ou une reconstruction de serveur.
- Conservez `channels.signal.dmPolicy: "pairing"` sauf si vous voulez explicitement un accès DM plus large.
- La vérification par SMS n’est nécessaire que pour les flux d’inscription ou de récupération, mais perdre le contrôle du numéro/compte peut compliquer la réinscription.

## Référence de configuration (Signal)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.signal.enabled` : active/désactive le démarrage du canal.
- `channels.signal.apiMode` : `auto | native | container` (par défaut : auto). Voir [Mode conteneur](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account` : E.164 pour le compte du bot.
- `channels.signal.cliPath` : chemin vers `signal-cli`.
- `channels.signal.configPath` : répertoire optionnel `signal-cli --config`.
- `channels.signal.httpUrl` : URL complète du démon (remplace host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort` : liaison du démon (par défaut 127.0.0.1:8080).
- `channels.signal.autoStart` : lance automatiquement le démon (true par défaut si `httpUrl` n’est pas défini).
- `channels.signal.startupTimeoutMs` : délai d’attente de démarrage en ms (plafond 120000).
- `channels.signal.receiveMode` : `on-start | manual`.
- `channels.signal.ignoreAttachments` : ignore les téléchargements de pièces jointes.
- `channels.signal.ignoreStories` : ignore les stories du démon.
- `channels.signal.sendReadReceipts` : transmet les accusés de lecture.
- `channels.signal.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.signal.allowFrom` : liste d’autorisation DM (E.164 ou `uuid:<id>`). `open` nécessite `"*"`. Signal n’a pas de noms d’utilisateur ; utilisez des identifiants téléphone/UUID.
- `channels.signal.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist).
- `channels.signal.groupAllowFrom` : liste d’autorisation de groupe ; accepte les identifiants de groupe Signal (bruts, `group:<id>` ou `signal:group:<id>`), les numéros E.164 des expéditeurs, ou les valeurs `uuid:<id>`.
- `channels.signal.groups` : remplacements par groupe indexés par l’identifiant de groupe Signal (ou `"*"`). Champs pris en charge : `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups` : version par compte de `channels.signal.groups` pour les configurations multicomptes.
- `channels.signal.historyLimit` : nombre maximal de messages de groupe à inclure comme contexte (0 désactive).
- `channels.signal.dmHistoryLimit` : limite d’historique des DM en tours utilisateur. Remplacements par utilisateur : `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit` : taille des fragments sortants (caractères).
- `channels.signal.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphes) avant le découpage par longueur.
- `channels.signal.mediaMaxMb` : plafond des médias entrants/sortants (Mo).

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (Signal ne prend pas en charge les mentions natives).
- `messages.groupChat.mentionPatterns` (repli global).
- `messages.responsePrefix`.

## Associés

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification DM et flux d’association
- [Groupes](/fr/channels/groups) — comportement des conversations de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
