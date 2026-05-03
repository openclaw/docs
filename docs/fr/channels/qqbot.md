---
read_when:
    - Vous souhaitez connecter OpenClaw à QQ
    - Vous devez configurer les identifiants du bot QQ
    - Vous voulez la prise en charge de QQ Bot pour les discussions de groupe ou privées
summary: Installation, configuration et utilisation du bot QQ
title: Robot QQ
x-i18n:
    generated_at: "2026-05-03T21:27:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se connecte à OpenClaw via l’API officielle QQ Bot (Gateway WebSocket). Le
Plugin prend en charge les discussions privées C2C, les @messages de groupe et les
messages de canaux de guilde avec des médias riches (images, voix, vidéos, fichiers).

État : Plugin téléchargeable. Les messages directs, discussions de groupe, canaux
de guilde et médias sont pris en charge. Les réactions et les fils ne sont pas pris en charge.

## Installer

Installez QQ Bot avant la configuration :

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuration

1. Accédez à la [plateforme ouverte QQ](https://q.qq.com/) et scannez le code QR avec votre
   QQ sur téléphone pour vous inscrire / vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Trouvez **AppID** et **AppSecret** sur la page des paramètres du bot, puis copiez-les.

> AppSecret n’est pas stocké en texte brut — si vous quittez la page sans l’enregistrer,
> vous devrez en régénérer un nouveau.

4. Ajoutez le canal :

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Redémarrez le Gateway.

Chemins de configuration interactifs :

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

AppSecret SecretRef d’environnement :

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

Remarques :

- Le repli sur l’environnement s’applique uniquement au compte QQ Bot par défaut.
- `openclaw channels add --channel qqbot --token-file ...` fournit uniquement
  l’AppSecret ; l’AppID doit déjà être défini dans la configuration ou `QQBOT_APP_ID`.
- `clientSecret` accepte aussi une entrée SecretRef, pas seulement une chaîne en texte brut.
- Les anciennes chaînes de marqueur `secretref:/...` ne sont pas des valeurs `clientSecret` valides ;
  utilisez des objets SecretRef structurés comme dans l’exemple ci-dessus.

### Configuration multi-comptes

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

### Discussions de groupe

La prise en charge des discussions de groupe QQ Bot utilise les OpenID de groupes QQ,
pas les noms d’affichage. Ajoutez le bot à un groupe, puis mentionnez-le ou configurez
le groupe pour s’exécuter sans mention.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
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
paramètres de groupe incluent :

- `requireMention` : exige une @mention avant que le bot réponde. Par défaut : `true`.
- `ignoreOtherMentions` : ignore les messages qui mentionnent quelqu’un d’autre mais pas le bot.
- `historyLimit` : conserve les messages de groupe récents sans mention comme contexte pour le prochain tour mentionné. Définissez `0` pour désactiver.
- `toolPolicy` : `full`, `restricted` ou `none` pour les outils limités au groupe.
- `name` : libellé lisible utilisé dans les journaux et le contexte de groupe.
- `prompt` : invite de comportement propre au groupe ajoutée au contexte de l’agent.

Les modes d’activation sont `mention` et `always`. `requireMention: true` correspond à
`mention` ; `requireMention: false` correspond à `always`. Une substitution d’activation
au niveau de la session, lorsqu’elle est présente, l’emporte sur la configuration.

La file d’entrée est propre à chaque pair. Les pairs de groupe disposent d’une limite
de file plus élevée, gardent les messages humains devant les échanges rédigés par le
bot lorsque la file est pleine, et fusionnent les rafales de messages de groupe
ordinaires en un seul tour attribué. Les commandes slash s’exécutent toujours une par une.

### Voix (STT / TTS)

La prise en charge STT et TTS utilise une configuration à deux niveaux avec repli prioritaire :

| Paramètre | Spécifique au Plugin                                      | Repli du framework           |
| --------- | --------------------------------------------------------- | ---------------------------- |
| STT       | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS       | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`               |

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
        qq-main: {
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

Définissez `enabled: false` sur l’un ou l’autre pour le désactiver.
Les substitutions TTS au niveau du compte utilisent la même forme que `messages.tts`
et se fusionnent en profondeur par-dessus la configuration TTS du canal / globale.

Les pièces jointes vocales QQ entrantes sont exposées aux agents comme métadonnées
de média audio tout en excluant les fichiers vocaux bruts des `MediaPaths` génériques.
Les réponses en texte brut `[[audio_as_voice]]` synthétisent du TTS et envoient un
message vocal QQ natif lorsque le TTS est configuré.

Le comportement de téléversement / transcodage audio sortant peut aussi être ajusté avec
`channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats cibles

| Format                     | Description              |
| -------------------------- | ------------------------ |
| `qqbot:c2c:OPENID`         | Discussion privée (C2C)  |
| `qqbot:group:GROUP_OPENID` | Discussion de groupe     |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde          |

> Chaque bot possède son propre ensemble d’OpenID utilisateur. Un OpenID reçu par le bot A **ne peut pas**
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
| `/bot-logs`    | Exporter les journaux récents du Gateway sous forme de fichier                                           |
| `/bot-approve` | Approuver une action QQ Bot en attente (par exemple, confirmer un téléversement C2C ou de groupe) via le flux natif. |

Ajoutez `?` à n’importe quelle commande pour obtenir l’aide d’utilisation (par exemple `/bot-upgrade ?`).

Les commandes d’administration (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sont réservées aux messages directs et exigent que l’openid de l’expéditeur figure dans une liste `allowFrom` explicite sans joker. Un joker `allowFrom: ["*"]` autorise la discussion mais n’accorde pas l’accès aux commandes d’administration. Les messages de groupe sont d’abord comparés à `groupAllowFrom`, puis se replient sur `allowFrom`. L’exécution d’une commande d’administration dans un groupe renvoie une indication plutôt que de l’ignorer silencieusement.

## Architecture du moteur

QQ Bot est livré comme moteur autonome à l’intérieur du Plugin :

- Chaque compte possède une pile de ressources isolée (connexion WebSocket, client API, cache de jetons, racine de stockage des médias) indexée par `appId`. Les comptes ne partagent jamais d’état entrant / sortant.
- Le journaliseur multi-comptes marque les lignes de journal avec le compte propriétaire afin que les diagnostics restent séparables lorsque vous exécutez plusieurs bots sous un même Gateway.
- Les chemins entrants, sortants et de pont Gateway partagent une racine unique de charges utiles média sous `~/.openclaw/media`, afin que les téléversements, téléchargements et caches de transcodage arrivent dans un seul répertoire protégé plutôt que dans une arborescence par sous-système.
- La livraison de médias riches passe par un unique chemin `sendMedia` pour les cibles C2C et de groupe. Les fichiers locaux et tampons au-dessus du seuil de fichier volumineux utilisent les points de terminaison de téléversement segmenté de QQ, tandis que les charges utiles plus petites utilisent l’API média en une seule requête.
- Les identifiants peuvent être sauvegardés et restaurés dans le cadre des instantanés d’identifiants OpenClaw standard ; le moteur rattache la pile de ressources de chaque compte lors de la restauration sans nécessiter une nouvelle association par code QR.

## Intégration par code QR

Comme alternative au collage manuel de `AppID:AppSecret`, le moteur prend en charge un flux d’intégration par code QR pour lier un QQ Bot à OpenClaw :

1. Exécutez le chemin de configuration QQ Bot (par exemple `openclaw channels add --channel qqbot`) et choisissez le flux de code QR lorsqu’il est proposé.
2. Scannez le code QR généré avec l’application téléphone liée au QQ Bot cible.
3. Approuvez l’association sur le téléphone. OpenClaw conserve les identifiants renvoyés dans `credentials/` sous la bonne portée de compte.

Les invites d’approbation générées par le bot lui-même (par exemple, les flux « autoriser cette action ? » exposés par l’API QQ Bot) apparaissent comme des invites OpenClaw natives que vous pouvez accepter avec `/bot-approve` plutôt qu’en répondant via le client QQ brut.

## Dépannage

- **Le bot répond "gone to Mars" :** les identifiants ne sont pas configurés ou le Gateway n’est pas démarré.
- **Aucun message entrant :** vérifiez que `appId` et `clientSecret` sont corrects, et que le
  bot est activé sur la plateforme ouverte QQ.
- **Auto-réponses répétées :** OpenClaw enregistre les index de référence sortants QQ comme
  rédigés par le bot et ignore les événements entrants dont le `msgIdx` actuel correspond à ce
  même compte de bot. Cela empêche les boucles d’écho de plateforme tout en permettant toujours aux utilisateurs
  de citer ou de répondre à des messages précédents du bot.
- **La configuration avec `--token-file` s’affiche toujours comme non configurée :** `--token-file` définit uniquement
  l’AppSecret. Vous avez toujours besoin de `appId` dans la configuration ou de `QQBOT_APP_ID`.
- **Les messages proactifs n’arrivent pas :** QQ peut intercepter les messages initiés par le bot si
  l’utilisateur n’a pas interagi récemment.
- **La voix n’est pas transcrite :** assurez-vous que STT est configuré et que le fournisseur est joignable.

## Connexe

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Dépannage des canaux](/fr/channels/troubleshooting)
