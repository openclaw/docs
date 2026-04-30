---
read_when:
    - Configurer la prise en charge de Signal
    - Débogage de l’envoi et de la réception avec Signal
summary: Prise en charge de Signal via signal-cli (JSON-RPC + SSE), chemins de configuration et modèle de numéros
title: Signal
x-i18n:
    generated_at: "2026-04-30T07:14:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

Statut : intégration CLI externe. Le Gateway communique avec `signal-cli` via HTTP JSON-RPC + SSE.

## Prérequis

- OpenClaw installé sur votre serveur (le flux Linux ci-dessous a été testé sur Ubuntu 24).
- `signal-cli` disponible sur l’hôte où le Gateway s’exécute.
- Un numéro de téléphone pouvant recevoir un SMS de vérification (pour le parcours d’inscription par SMS).
- Accès navigateur pour le captcha Signal (`signalcaptchas.org`) pendant l’inscription.

## Configuration rapide (débutant)

1. Utilisez un **numéro Signal distinct** pour le bot (recommandé).
2. Installez `signal-cli` (Java est requis si vous utilisez la build JVM).
3. Choisissez un parcours de configuration :
   - **Parcours A (lien QR) :** `signal-cli link -n "OpenClaw"` puis scannez avec Signal.
   - **Parcours B (inscription SMS) :** inscrivez un numéro dédié avec captcha + vérification SMS.
4. Configurez OpenClaw et redémarrez le Gateway.
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

| Champ       | Description                                                    |
| ----------- | -------------------------------------------------------------- |
| `account`   | Numéro de téléphone du bot au format E.164 (`+15551234567`)    |
| `cliPath`   | Chemin vers `signal-cli` (`signal-cli` si présent dans `PATH`) |
| `dmPolicy`  | Politique d’accès aux DM (`pairing` recommandé)                |
| `allowFrom` | Numéros de téléphone ou valeurs `uuid:<id>` autorisés à envoyer des DM |

## De quoi il s’agit

- Canal Signal via `signal-cli` (pas libsignal intégré).
- Routage déterministe : les réponses reviennent toujours vers Signal.
- Les DM partagent la session principale de l’agent ; les groupes sont isolés (`agent:<agentId>:signal:group:<groupId>`).

## Écritures de configuration

Par défaut, Signal est autorisé à écrire les mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez avec :

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Le modèle de numéro (important)

- Le Gateway se connecte à un **appareil Signal** (le compte `signal-cli`).
- Si vous exécutez le bot sur **votre compte Signal personnel**, il ignorera vos propres messages (protection contre les boucles).
- Pour « j’envoie un message au bot et il répond », utilisez un **numéro de bot distinct**.

## Parcours de configuration A : lier un compte Signal existant (QR)

1. Installez `signal-cli` (build JVM ou native).
2. Liez un compte de bot :
   - `signal-cli link -n "OpenClaw"` puis scannez le QR dans Signal.
3. Configurez Signal et démarrez le Gateway.

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

Utilisez ce parcours lorsque vous voulez un numéro de bot dédié au lieu de lier un compte d’application Signal existant.

1. Obtenez un numéro pouvant recevoir des SMS (ou une vérification vocale pour les lignes fixes).
   - Utilisez un numéro de bot dédié pour éviter les conflits de compte/session.
2. Installez `signal-cli` sur l’hôte du Gateway :

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si vous utilisez la build JVM (`signal-cli-${VERSION}.tar.gz`), installez d’abord JRE 25+.
Maintenez `signal-cli` à jour ; le projet amont indique que les anciennes versions peuvent cesser de fonctionner lorsque les API serveur de Signal changent.

3. Inscrivez et vérifiez le numéro :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si un captcha est requis :

1. Ouvrez `https://signalcaptchas.org/registration/generate.html`.
2. Terminez le captcha, copiez la cible du lien `signalcaptcha://...` depuis « Open Signal ».
3. Exécutez depuis la même IP externe que la session navigateur lorsque c’est possible.
4. Relancez immédiatement l’inscription (les jetons captcha expirent rapidement) :

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configurez OpenClaw, redémarrez le Gateway, vérifiez le canal :

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Appairez votre expéditeur de DM :
   - Envoyez n’importe quel message au numéro du bot.
   - Approuvez le code sur le serveur : `openclaw pairing approve signal <PAIRING_CODE>`.
   - Enregistrez le numéro du bot comme contact sur votre téléphone pour éviter « Contact inconnu ».

<Warning>
L’inscription d’un compte avec numéro de téléphone via `signal-cli` peut désauthentifier la session principale de l’application Signal pour ce numéro. Préférez un numéro de bot dédié, ou utilisez le mode de lien QR si vous devez conserver la configuration de votre application téléphone existante.
</Warning>

Références amont :

- README `signal-cli` : `https://github.com/AsamK/signal-cli`
- Flux captcha : `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flux de liaison : `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Mode démon externe (httpUrl)

Si vous voulez gérer `signal-cli` vous-même (démarrages à froid JVM lents, initialisation de conteneur ou CPU partagés), exécutez le démon séparément et pointez OpenClaw vers celui-ci :

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

Cela évite le lancement automatique et l’attente au démarrage dans OpenClaw. Pour les démarrages lents lors du lancement automatique, définissez `channels.signal.startupTimeoutMs`.

## Contrôle d’accès (DM + groupes)

DM :

- Par défaut : `channels.signal.dmPolicy = "pairing"`.
- Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuver via :
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- L’appairage est l’échange de jeton par défaut pour les DM Signal. Détails : [Appairage](/fr/channels/pairing)
- Les expéditeurs uniquement UUID (depuis `sourceUuid`) sont stockés sous forme de `uuid:<id>` dans `channels.signal.allowFrom`.

Groupes :

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` contrôle qui peut déclencher dans les groupes lorsque `allowlist` est défini.
- `channels.signal.groups["<group-id>" | "*"]` peut remplacer le comportement de groupe avec `requireMention`, `tools` et `toolsBySender`.
- Utilisez `channels.signal.accounts.<id>.groups` pour les remplacements par compte dans les configurations multi-compte.
- Note d’exécution : si `channels.signal` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

## Fonctionnement (comportement)

- `signal-cli` s’exécute comme démon ; le Gateway lit les événements via SSE.
- Les messages entrants sont normalisés dans l’enveloppe de canal partagée.
- Les réponses sont toujours routées vers le même numéro ou groupe.

## Médias + limites

- Le texte sortant est découpé selon `channels.signal.textChunkLimit` (4000 par défaut).
- Découpage facultatif aux sauts de ligne : définissez `channels.signal.chunkMode="newline"` pour découper sur les lignes vides (frontières de paragraphes) avant le découpage par longueur.
- Pièces jointes prises en charge (base64 récupéré depuis `signal-cli`).
- Les pièces jointes de notes vocales utilisent le nom de fichier `signal-cli` comme solution de repli MIME lorsque `contentType` est manquant, afin que la transcription audio puisse toujours classer les mémos vocaux AAC.
- Limite média par défaut : `channels.signal.mediaMaxMb` (8 par défaut).
- Utilisez `channels.signal.ignoreAttachments` pour ignorer le téléchargement des médias.
- Le contexte d’historique de groupe utilise `channels.signal.historyLimit` (ou `channels.signal.accounts.*.historyLimit`), avec repli vers `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (50 par défaut).

## Saisie + accusés de lecture

- **Indicateurs de saisie** : OpenClaw envoie des signaux de saisie via `signal-cli sendTyping` et les actualise pendant qu’une réponse est en cours.
- **Accusés de lecture** : lorsque `channels.signal.sendReadReceipts` vaut true, OpenClaw transfère les accusés de lecture pour les DM autorisés.
- Signal-cli n’expose pas les accusés de lecture pour les groupes.

## Réactions (outil de message)

- Utilisez `message action=react` avec `channel=signal`.
- Cibles : expéditeur E.164 ou UUID (utilisez `uuid:<id>` depuis la sortie d’appairage ; un UUID nu fonctionne aussi).
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
  - `off`/`ack` désactive les réactions de l’agent (l’outil de message `react` produira une erreur).
  - `minimal`/`extensive` active les réactions de l’agent et définit le niveau d’orientation.
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

Puis confirmez l’état d’appairage des DM si nécessaire :

```bash
openclaw pairing list signal
```

Échecs courants :

- Démon joignable mais aucune réponse : vérifiez les paramètres de compte/démon (`httpUrl`, `account`) et le mode de réception.
- DM ignorés : l’expéditeur attend l’approbation de l’appairage.
- Messages de groupe ignorés : le filtrage par expéditeur/mention de groupe bloque la livraison.
- Erreurs de validation de configuration après modifications : exécutez `openclaw doctor --fix`.
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
- Sauvegardez l’état du compte Signal avant une migration ou reconstruction du serveur.
- Conservez `channels.signal.dmPolicy: "pairing"` sauf si vous voulez explicitement un accès DM plus large.
- La vérification SMS n’est nécessaire que pour les flux d’inscription ou de récupération, mais perdre le contrôle du numéro/compte peut compliquer une réinscription.

## Référence de configuration (Signal)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options de fournisseur :

- `channels.signal.enabled` : active/désactive le démarrage du canal.
- `channels.signal.account` : E.164 pour le compte du bot.
- `channels.signal.cliPath` : chemin vers `signal-cli`.
- `channels.signal.httpUrl` : URL complète du daemon (remplace l’hôte/le port).
- `channels.signal.httpHost`, `channels.signal.httpPort` : liaison du daemon (par défaut 127.0.0.1:8080).
- `channels.signal.autoStart` : lance automatiquement le daemon (true par défaut si `httpUrl` n’est pas défini).
- `channels.signal.startupTimeoutMs` : délai d’attente du démarrage en ms (limite 120000).
- `channels.signal.receiveMode` : `on-start | manual`.
- `channels.signal.ignoreAttachments` : ignore les téléchargements de pièces jointes.
- `channels.signal.ignoreStories` : ignore les stories du daemon.
- `channels.signal.sendReadReceipts` : transfère les accusés de lecture.
- `channels.signal.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.signal.allowFrom` : liste d’autorisation des DM (E.164 ou `uuid:<id>`). `open` nécessite `"*"`. Signal n’a pas de noms d’utilisateur ; utilisez les identifiants téléphone/UUID.
- `channels.signal.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist).
- `channels.signal.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe.
- `channels.signal.groups` : remplacements par groupe, indexés par id de groupe Signal (ou `"*"`). Champs pris en charge : `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups` : version par compte de `channels.signal.groups` pour les configurations multicomptes.
- `channels.signal.historyLimit` : nombre maximal de messages de groupe à inclure comme contexte (0 désactive).
- `channels.signal.dmHistoryLimit` : limite d’historique des DM en tours utilisateur. Remplacements par utilisateur : `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit` : taille des blocs sortants (caractères).
- `channels.signal.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.signal.mediaMaxMb` : limite des médias entrants/sortants (Mo).

Options globales associées :

- `agents.list[].groupChat.mentionPatterns` (Signal ne prend pas en charge les mentions natives).
- `messages.groupChat.mentionPatterns` (solution de repli globale).
- `messages.responsePrefix`.

## Liens connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
