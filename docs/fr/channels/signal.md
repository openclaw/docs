---
read_when:
    - Configurer la prise en charge de Signal
    - Déboguer l’envoi/la réception sur Signal
summary: Prise en charge de Signal via signal-cli (JSON-RPC + SSE), chemins de configuration et modèle de numéros
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

Statut : intégration CLI externe. Le Gateway communique avec `signal-cli` via HTTP JSON-RPC + SSE.

## Prérequis

- OpenClaw installé sur votre serveur (le flux Linux ci-dessous a été testé sur Ubuntu 24).
- `signal-cli` disponible sur l’hôte où le gateway s’exécute.
- Un numéro de téléphone pouvant recevoir un SMS de vérification (pour le parcours d’enregistrement par SMS).
- Un accès navigateur pour le captcha Signal (`signalcaptchas.org`) pendant l’enregistrement.

## Configuration rapide (débutant)

1. Utilisez un **numéro Signal distinct** pour le bot (recommandé).
2. Installez `signal-cli` (Java est requis si vous utilisez la version JVM).
3. Choisissez un parcours de configuration :
   - **Parcours A (liaison QR) :** `signal-cli link -n "OpenClaw"` puis scannez avec Signal.
   - **Parcours B (enregistrement SMS) :** enregistrez un numéro dédié avec captcha + vérification SMS.
4. Configurez OpenClaw et redémarrez le gateway.
5. Envoyez un premier DM et approuvez l’appairage (`openclaw pairing approve signal <CODE>`).

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

| Champ       | Description                                         |
| ----------- | --------------------------------------------------- |
| `account`   | Numéro de téléphone du bot au format E.164 (`+15551234567`) |
| `cliPath`   | Chemin vers `signal-cli` (`signal-cli` s’il est dans le `PATH`) |
| `dmPolicy`  | Politique d’accès aux DM (`pairing` recommandé)     |
| `allowFrom` | Numéros de téléphone ou valeurs `uuid:<id>` autorisés à envoyer des DM |

## Ce que c’est

- Canal Signal via `signal-cli` (et non via libsignal embarqué).
- Routage déterministe : les réponses retournent toujours à Signal.
- Les DM partagent la session principale de l’agent ; les groupes sont isolés (`agent:<agentId>:signal:group:<groupId>`).

## Écritures de configuration

Par défaut, Signal est autorisé à écrire des mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez avec :

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Le modèle de numéros (important)

- Le gateway se connecte à un **appareil Signal** (le compte `signal-cli`).
- Si vous exécutez le bot sur **votre compte Signal personnel**, il ignorera vos propres messages (protection contre les boucles).
- Pour le scénario « j’envoie un message au bot et il répond », utilisez un **numéro de bot distinct**.

## Parcours de configuration A : lier un compte Signal existant (QR)

1. Installez `signal-cli` (version JVM ou native).
2. Liez un compte bot :
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

Prise en charge de plusieurs comptes : utilisez `channels.signal.accounts` avec une configuration par compte et un `name` facultatif. Voir [`gateway/configuration`](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle partagé.

## Parcours de configuration B : enregistrer un numéro de bot dédié (SMS, Linux)

Utilisez ce parcours lorsque vous voulez un numéro de bot dédié au lieu de lier un compte d’application Signal existant.

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
Gardez `signal-cli` à jour ; le projet upstream indique que les anciennes versions peuvent cesser de fonctionner à mesure que les API serveur de Signal évoluent.

3. Enregistrez et vérifiez le numéro :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si un captcha est requis :

1. Ouvrez `https://signalcaptchas.org/registration/generate.html`.
2. Terminez le captcha, puis copiez la cible du lien `signalcaptcha://...` depuis « Open Signal ».
3. Exécutez la commande depuis la même IP externe que la session navigateur si possible.
4. Relancez immédiatement l’enregistrement (les jetons captcha expirent rapidement) :

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

5. Appairez votre expéditeur DM :
   - Envoyez n’importe quel message au numéro du bot.
   - Approuvez le code sur le serveur : `openclaw pairing approve signal <PAIRING_CODE>`.
   - Enregistrez le numéro du bot comme contact sur votre téléphone pour éviter « Unknown contact ».

Important : enregistrer un compte de numéro de téléphone avec `signal-cli` peut désauthentifier la session principale de l’application Signal pour ce numéro. Préférez un numéro de bot dédié, ou utilisez le mode de liaison QR si vous devez conserver votre configuration actuelle d’application sur téléphone.

Références upstream :

- README `signal-cli` : `https://github.com/AsamK/signal-cli`
- Flux captcha : `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flux de liaison : `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode daemon externe (`httpUrl`)

Si vous souhaitez gérer `signal-cli` vous-même (démarrages JVM à froid lents, initialisation de conteneur ou CPU partagés), exécutez le daemon séparément et pointez OpenClaw vers lui :

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

Cela ignore le démarrage automatique et l’attente au démarrage à l’intérieur d’OpenClaw. Pour les démarrages lents en mode démarrage automatique, définissez `channels.signal.startupTimeoutMs`.

## Contrôle d’accès (DM + groupes)

DM :

- Par défaut : `channels.signal.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuvez via :
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- L’appairage est l’échange de jetons par défaut pour les DM Signal. Détails : [Appairage](/fr/channels/pairing)
- Les expéditeurs UUID uniquement (depuis `sourceUuid`) sont stockés comme `uuid:<id>` dans `channels.signal.allowFrom`.

Groupes :

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.
- `channels.signal.groups["<group-id>" | "*"]` peut remplacer le comportement de groupe avec `requireMention`, `tools` et `toolsBySender`.
- Utilisez `channels.signal.accounts.<id>.groups` pour des remplacements par compte dans les configurations multi-comptes.
- Note d’exécution : si `channels.signal` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

## Fonctionnement (comportement)

- `signal-cli` s’exécute comme daemon ; le gateway lit les événements via SSE.
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée.
- Les réponses sont toujours renvoyées au même numéro ou groupe.

## Médias + limites

- Le texte sortant est découpé selon `channels.signal.textChunkLimit` (4000 par défaut).
- Découpage optionnel sur les sauts de ligne : définissez `channels.signal.chunkMode="newline"` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- Pièces jointes prises en charge (base64 récupéré depuis `signal-cli`).
- Les pièces jointes de note vocale utilisent le nom de fichier `signal-cli` comme repli MIME lorsque `contentType` est absent, afin que la transcription audio puisse toujours classer les mémos vocaux AAC.
- Limite média par défaut : `channels.signal.mediaMaxMb` (8 par défaut).
- Utilisez `channels.signal.ignoreAttachments` pour ignorer le téléchargement des médias.
- Le contexte d’historique de groupe utilise `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), avec repli vers `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (50 par défaut).

## Indicateurs de saisie + accusés de lecture

- **Indicateurs de saisie** : OpenClaw envoie des signaux de saisie via `signal-cli sendTyping` et les rafraîchit pendant qu’une réponse est en cours.
- **Accusés de lecture** : lorsque `channels.signal.sendReadReceipts` vaut true, OpenClaw transmet les accusés de lecture pour les DM autorisés.
- Signal-cli n’expose pas les accusés de lecture pour les groupes.

## Réactions (outil message)

- Utilisez `message action=react` avec `channel=signal`.
- Cibles : E.164 de l’expéditeur ou UUID (utilisez `uuid:<id>` depuis la sortie d’appairage ; un UUID nu fonctionne aussi).
- `messageId` est l’horodatage Signal du message auquel vous réagissez.
- Les réactions de groupe nécessitent `targetAuthor` ou `targetAuthorUuid`.

Exemples :

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuration :

- `channels.signal.actions.reactions` : activer/désactiver les actions de réaction (true par défaut).
- `channels.signal.reactionLevel` : `off | ack | minimal | extensive`.
  - `off`/`ack` désactive les réactions de l’agent (l’outil message `react` renverra une erreur).
  - `minimal`/`extensive` active les réactions de l’agent et définit le niveau de guidage.
- Remplacements par compte : `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Cibles de livraison (CLI/cron)

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

Ensuite, confirmez l’état d’appairage DM si nécessaire :

```bash
openclaw pairing list signal
```

Pannes courantes :

- Daemon joignable mais pas de réponses : vérifiez les paramètres du compte/daemon (`httpUrl`, `account`) et le mode de réception.
- DM ignorés : l’expéditeur est en attente d’approbation d’appairage.
- Messages de groupe ignorés : le contrôle d’accès de l’expéditeur/de la mention bloque la livraison.
- Erreurs de validation de configuration après modification : exécutez `openclaw doctor --fix`.
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
- Sauvegardez l’état du compte Signal avant une migration ou une reconstruction du serveur.
- Conservez `channels.signal.dmPolicy: "pairing"` sauf si vous voulez explicitement un accès DM plus large.
- La vérification par SMS n’est nécessaire que pour les flux d’enregistrement ou de récupération, mais perdre le contrôle du numéro/compte peut compliquer le réenregistrement.

## Référence de configuration (Signal)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.signal.enabled` : activer/désactiver le démarrage du canal.
- `channels.signal.account` : E.164 pour le compte du bot.
- `channels.signal.cliPath` : chemin vers `signal-cli`.
- `channels.signal.httpUrl` : URL complète du daemon (remplace host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort` : liaison du daemon (par défaut 127.0.0.1:8080).
- `channels.signal.autoStart` : démarrer automatiquement le daemon (true par défaut si `httpUrl` n’est pas défini).
- `channels.signal.startupTimeoutMs` : délai d’attente de démarrage en ms (maximum 120000).
- `channels.signal.receiveMode` : `on-start | manual`.
- `channels.signal.ignoreAttachments` : ignorer le téléchargement des pièces jointes.
- `channels.signal.ignoreStories` : ignorer les stories du daemon.
- `channels.signal.sendReadReceipts` : transmettre les accusés de lecture.
- `channels.signal.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.signal.allowFrom` : liste d’autorisation DM (E.164 ou `uuid:<id>`). `open` nécessite `"*"`. Signal n’a pas de noms d’utilisateur ; utilisez des identifiants téléphone/UUID.
- `channels.signal.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist).
- `channels.signal.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe.
- `channels.signal.groups` : remplacements par groupe, indexés par identifiant de groupe Signal (ou `"*"`). Champs pris en charge : `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups` : version par compte de `channels.signal.groups` pour les configurations multi-comptes.
- `channels.signal.historyLimit` : nombre maximal de messages de groupe à inclure comme contexte (`0` désactive).
- `channels.signal.dmHistoryLimit` : limite d’historique DM en tours utilisateur. Remplacements par utilisateur : `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit` : taille des segments sortants (caractères).
- `channels.signal.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.signal.mediaMaxMb` : limite des médias entrants/sortants (Mo).

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (Signal ne prend pas en charge les mentions natives).
- `messages.groupChat.mentionPatterns` (solution de repli globale).
- `messages.responsePrefix`.

## Connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
