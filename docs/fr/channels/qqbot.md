---
read_when:
    - Vous voulez connecter OpenClaw à QQ
    - Vous devez configurer les identifiants de QQ Bot
    - Vous voulez la prise en charge des discussions de groupe ou privées avec QQ Bot
summary: Installation, configuration et utilisation du bot QQ
title: bot QQ
x-i18n:
    generated_at: "2026-06-27T17:11:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot connecte OpenClaw via l’API officielle QQ Bot (Gateway WebSocket). Le
Plugin prend en charge les chats privés C2C, les @messages de groupe et les
messages de canal de guilde avec des médias enrichis (images, voix, vidéo, fichiers).

Statut : Plugin téléchargeable. Les messages directs, les chats de groupe, les
canaux de guilde et les médias sont pris en charge. Les réactions et les fils ne
sont pas pris en charge.

## Installation

Installez QQ Bot avant la configuration :

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuration initiale

1. Accédez à la [QQ Open Platform](https://q.qq.com/) et scannez le code QR avec votre
   téléphone QQ pour vous inscrire / vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Trouvez **AppID** et **AppSecret** sur la page des paramètres du bot et copiez-les.

> AppSecret n’est pas stocké en clair — si vous quittez la page sans l’enregistrer,
> vous devrez en régénérer un nouveau.

4. Ajoutez le canal :

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Redémarrez le Gateway.

Chemins de configuration interactive :

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurer

Configuration minimale :

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variables d’environnement du compte par défaut :

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret adossé à un fichier :

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

AppSecret Env SecretRef :

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Notes :

- Le repli vers l’environnement s’applique uniquement au compte QQ Bot par défaut.
- `openclaw channels add --channel qqbot --token-file ...` fournit uniquement
  l’AppSecret ; l’AppID doit déjà être défini dans la configuration ou dans `QQBOT_APP_ID`.
- `clientSecret` accepte également une entrée SecretRef, pas seulement une chaîne en clair.
- Les anciennes chaînes de marqueur `secretref:/...` ne sont pas des valeurs
  `clientSecret` valides ; utilisez des objets SecretRef structurés comme dans l’exemple ci-dessus.

### Configuration multi-compte

Exécutez plusieurs bots QQ sous une seule instance OpenClaw :

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Chaque compte lance sa propre connexion WebSocket et conserve un cache de jetons
indépendant (isolé par `appId`).

Ajoutez un second bot via la CLI :

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chats de groupe

La prise en charge des chats de groupe QQ Bot utilise les OpenIDs de groupe QQ,
pas les noms d’affichage. Ajoutez le bot à un groupe, puis mentionnez-le ou
configurez le groupe pour s’exécuter sans mention.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` définit les valeurs par défaut pour chaque groupe, et une entrée
`groups.GROUP_OPENID` concrète remplace ces valeurs par défaut pour un groupe. Les
paramètres de groupe comprennent :

- `requireMention` : exiger une @mention avant que le bot ne réponde. Par défaut : `true`.
- `commandLevel` : contrôler quelles commandes slash intégrées peuvent s’exécuter dans les groupes.
  Par défaut : `all`, ce qui préserve le comportement de groupe QQBot préexistant lorsque le
  paramètre est omis.
- `ignoreOtherMentions` : ignorer les messages qui mentionnent quelqu’un d’autre mais pas le bot.
- `historyLimit` : conserver les messages de groupe récents sans mention comme contexte pour le prochain tour mentionné. Définissez `0` pour désactiver.
- `tools` : autoriser/refuser des outils pour l’ensemble du groupe.
- `toolsBySender` : remplacements d’outils de groupe par expéditeur ; consultez [Groupes](/fr/channels/groups#groupchannel-tool-restrictions-optional).
- `name` : libellé convivial utilisé dans les journaux et le contexte de groupe.
- `prompt` : invite de comportement par groupe ajoutée au contexte de l’agent.

`commandLevel` accepte :

- `all` : garder les commandes intégrées reconnues disponibles comme auparavant. Certaines commandes peuvent
  rester masquées dans les menus, mais les utilisateurs autorisés peuvent toujours les exécuter dans le groupe.
- `safety` : autoriser les commandes de collaboration courantes comme `/help`, `/btw` et
  `/stop` ; demander aux utilisateurs d’exécuter les commandes sensibles comme `/config`, `/tools` et
  `/bash` dans un chat privé.
- `strict` : autoriser uniquement les contrôles de session de groupe nécessaires à un fonctionnement
  strict du groupe. `/stop` reste urgent afin qu’un expéditeur autorisé puisse interrompre une
  exécution active.

Les anciennes entrées QQBot `toolPolicy` sont retirées. Exécutez `openclaw doctor --fix` pour les migrer vers `tools`.

Les modes d’activation sont `mention` et `always`. `requireMention: true` correspond à
`mention` ; `requireMention: false` correspond à `always`. Un remplacement d’activation
au niveau de la session, lorsqu’il est présent, prévaut sur la configuration.

La file entrante est par pair. Les pairs de groupe disposent d’un plafond de file plus élevé,
conservent les messages humains avant les bavardages rédigés par le bot lorsque la file est pleine,
et fusionnent les rafales de messages de groupe normaux en un seul tour attribué. Les commandes slash
s’exécutent toujours une par une.

### Voix (STT / TTS)

La prise en charge de STT et TTS utilise une configuration à deux niveaux avec repli prioritaire :

| Paramètre | Spécifique au Plugin                                    | Repli du framework           |
| --------- | ------------------------------------------------------- | ---------------------------- |
| STT       | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS       | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`               |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Définissez `enabled: false` sur l’un ou l’autre pour désactiver.
Les remplacements TTS au niveau du compte utilisent la même forme que `messages.tts` et sont fusionnés
en profondeur par-dessus la configuration TTS du canal/globale.

Les pièces jointes vocales QQ entrantes sont exposées aux agents comme métadonnées de média audio tout en
gardant les fichiers vocaux bruts hors des `MediaPaths` génériques. Les réponses en texte brut
`[[audio_as_voice]]` synthétisent le TTS et envoient un message vocal QQ natif lorsque TTS est
configuré.

Le comportement d’envoi/transcodage audio sortant peut également être ajusté avec
`channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats cibles

| Format                     | Description       |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | Chat privé (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat de groupe    |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde   |

> Chaque bot a son propre ensemble d’OpenIDs utilisateur. Un OpenID reçu par le bot A **ne peut pas**
> être utilisé pour envoyer des messages via le bot B.

## Commandes slash

Commandes intégrées interceptées avant la file d’IA :

| Commande       | Description                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test de latence                                                                                          |
| `/bot-version` | Afficher la version du framework OpenClaw                                                                |
| `/bot-help`    | Lister toutes les commandes                                                                              |
| `/bot-me`      | Afficher l’ID utilisateur QQ de l’expéditeur (openid) pour la configuration `allowFrom`/`groupAllowFrom` |
| `/bot-upgrade` | Afficher le lien du guide de mise à niveau QQBot                                                         |
| `/bot-logs`    | Exporter les journaux Gateway récents sous forme de fichier                                               |
| `/bot-approve` | Approuver une action QQ Bot en attente (par exemple, confirmer un envoi C2C ou de groupe) via le flux natif. |

Ajoutez `?` à n’importe quelle commande pour obtenir l’aide d’utilisation (par exemple `/bot-upgrade ?`).

Les commandes d’administration (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sont réservées aux messages directs et exigent que l’openid de l’expéditeur figure dans une liste `allowFrom` explicite sans joker. Un joker `allowFrom: ["*"]` autorise le chat mais n’accorde pas l’accès aux commandes d’administration. Les messages de groupe sont d’abord comparés à `groupAllowFrom`, puis se replient sur `allowFrom`. L’exécution d’une commande d’administration dans un groupe renvoie une indication au lieu d’être ignorée silencieusement.

Lorsque les approbations exec de QQ Bot utilisent le repli par défaut dans le même chat, les clics sur les
boutons d’approbation natifs suivent la même liste d’autorisation de commandes explicite sans joker. Pour accorder
un accès limité aux approbations sans accès plus large aux commandes, configurez
`channels.qqbot.execApprovals.approvers`.

## Architecture du moteur

QQ Bot est livré comme un moteur autonome à l’intérieur du Plugin :

- Chaque compte possède une pile de ressources isolée (connexion WebSocket, client API, cache de jetons, racine de stockage des médias) indexée par `appId`. Les comptes ne partagent jamais l’état entrant/sortant.
- Le journaliseur multi-compte étiquette les lignes de journal avec le compte propriétaire afin que les diagnostics restent séparables lorsque vous exécutez plusieurs bots sous un seul Gateway.
- Les chemins entrants, sortants et de pont Gateway partagent une seule racine de charge utile média sous `~/.openclaw/media`, de sorte que les envois, téléchargements et caches de transcodage aboutissent dans un répertoire protégé unique au lieu d’un arbre par sous-système.
- La livraison de médias enrichis passe par un seul chemin `sendMedia` pour les cibles C2C et de groupe. Les fichiers locaux et les tampons au-dessus du seuil de fichier volumineux utilisent les points de terminaison d’envoi fragmenté de QQ, tandis que les charges utiles plus petites utilisent l’API média en une seule opération.
- Les identifiants peuvent être sauvegardés et restaurés dans le cadre des instantanés d’identifiants OpenClaw standard ; le moteur rattache la pile de ressources de chaque compte lors de la restauration sans nécessiter une nouvelle paire de codes QR.

## Intégration par code QR

Comme alternative au collage manuel de `AppID:AppSecret`, le moteur prend en charge un flux d’intégration par code QR pour lier un QQ Bot à OpenClaw :

1. Exécutez le chemin de configuration QQ Bot (par exemple `openclaw channels add --channel qqbot`) et choisissez le flux par code QR lorsque vous y êtes invité.
2. Scannez le code QR généré avec l’application téléphone liée au QQ Bot cible.
3. Approuvez l’association sur le téléphone. OpenClaw conserve les identifiants renvoyés dans `credentials/` sous la bonne portée de compte.

Les invites d’approbation générées par le bot lui-même (par exemple, les flux « autoriser cette action ? » exposés par l’API QQ Bot) apparaissent comme des invites OpenClaw natives que vous pouvez accepter avec `/bot-approve` plutôt qu’en répondant via le client QQ brut.

## Dépannage

- **Le bot répond « parti sur Mars » :** les identifiants ne sont pas configurés ou le Gateway n’est pas démarré.
- **Aucun message entrant :** vérifiez que `appId` et `clientSecret` sont corrects, et que le
  bot est activé sur la QQ Open Platform.
- **Auto-réponses répétées :** OpenClaw enregistre les index de référence sortants QQ comme
  rédigés par le bot et ignore les événements entrants dont le `msgIdx` actuel correspond à ce
  même compte de bot. Cela évite les boucles d’écho de la plateforme tout en permettant aux utilisateurs
  de citer ou de répondre aux messages précédents du bot.
- **La configuration avec `--token-file` apparaît toujours comme non configurée :** `--token-file` définit uniquement
  l’AppSecret. Vous avez toujours besoin de `appId` dans la configuration ou de `QQBOT_APP_ID`.
- **Les messages proactifs n’arrivent pas :** QQ peut intercepter les messages initiés par le bot si
  l’utilisateur n’a pas interagi récemment.
- **La voix n’est pas transcrite :** assurez-vous que le STT est configuré et que le fournisseur est joignable.

## Connexe

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Dépannage des canaux](/fr/channels/troubleshooting)
