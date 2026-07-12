---
read_when:
    - Vous souhaitez connecter OpenClaw à QQ
    - Vous devez configurer les identifiants du bot QQ
    - Vous souhaitez prendre en charge les discussions de groupe ou privées avec QQ Bot
summary: Configuration, paramétrage et utilisation du bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-07-12T02:25:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot connecte OpenClaw via l’API officielle QQ Bot (Gateway WebSocket).
Les conversations privées C2C et les mentions `@` dans les groupes sont les principaux types de conversation, avec prise en charge des contenus multimédias enrichis
(images, messages vocaux, vidéos, fichiers). Les messages des canaux de guilde sont pris en charge uniquement pour
le texte et les images accessibles par URL distante ; les messages vocaux, les vidéos, les téléversements de fichiers et les images
locales/Base64 ne sont pas disponibles dans les canaux de guilde. Les réactions et les fils de discussion ne sont
pris en charge nulle part.

Statut : Plugin officiel téléchargeable.

## Installation

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuration initiale

1. Accédez à la [plateforme ouverte QQ](https://q.qq.com/) et scannez le code QR avec QQ sur votre
   téléphone pour vous inscrire ou vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Recherchez **AppID** et **AppSecret** sur la page des paramètres du bot, puis copiez-les.

<Note>
AppSecret n’est pas stocké en texte brut. Si vous quittez la page sans l’enregistrer, vous devrez en générer un nouveau.
</Note>

4. Ajoutez le canal :

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Redémarrez le Gateway.

Configuration interactive :

```bash
openclaw channels add
```

L’assistant propose également l’association par code QR au lieu de saisir manuellement AppID/AppSecret :
scannez le code avec l’application mobile liée au QQ Bot cible pour terminer
l’association. OpenClaw conserve les identifiants renvoyés dans le périmètre de configuration
du compte.

## Configuration

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

Variables d’environnement du compte par défaut (compte de premier niveau uniquement) :

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret stocké dans un fichier :

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

AppSecret sous forme de SecretRef d’environnement :

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

- `openclaw channels add --channel qqbot --token-file ...` définit uniquement l’AppSecret ;
  `appId` doit déjà être défini dans la configuration ou dans `QQBOT_APP_ID`.
- `clientSecret` accepte une chaîne en texte brut, un chemin de fichier (`clientSecretFile`)
  ou un objet SecretRef structuré.
- Les anciennes chaînes de marqueur `secretref:...` / `secretref-env:...` sont refusées pour
  `clientSecret` ; utilisez plutôt un objet SecretRef structuré.

### Politique d’accès

- `allowFrom` / `groupAllowFrom` déterminent qui peut converser avec le bot dans les contextes C2C /
  de groupe. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  contrôlent le mode d’application. `dmPolicy` prend par défaut la valeur `allowlist` dès que
  `allowFrom` contient une entrée concrète (sans caractère générique), sinon `open`.
  `groupPolicy` prend par défaut la valeur `allowlist` dès que `groupAllowFrom` ou
  `allowFrom` contient une entrée concrète, sinon `open`.
- Les commandes slash avec « Auth : liste d’autorisation » nécessitent une entrée explicite sans caractère générique dans
  `allowFrom` (ou `groupAllowFrom` pour les appels depuis un groupe), indépendamment de
  `dmPolicy` / `groupPolicy` — consultez [Commandes slash](#slash-commands).

### Configuration multicomptes

Exécutez plusieurs bots QQ dans une seule instance OpenClaw :

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

Chaque compte possède une connexion WebSocket, un client d’API et un cache de jetons
isolés, indexés par `appId`. Les lignes de journal portent l’identifiant du compte propriétaire afin que
les diagnostics restent séparables lorsque plusieurs bots s’exécutent sous un même Gateway.

Ajoutez un second bot via la CLI :

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Conversations de groupe

La prise en charge des groupes utilise les OpenID de groupe QQ, et non les noms d’affichage. Ajoutez le bot à un
groupe, puis mentionnez-le ou configurez le groupe pour fonctionner sans mention.

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

`groups["*"]` définit les valeurs par défaut de tous les groupes ; une entrée concrète `groups.GROUP_OPENID`
remplace ces valeurs par défaut pour un groupe. Paramètres des groupes :

| Champ                 | Valeur par défaut | Description                                                                                              |
| --------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`            | Exige une mention `@` avant que le bot ne réponde.                                                       |
| `commandLevel`        | `all`             | Détermine quelles commandes slash intégrées peuvent s’exécuter dans le groupe (voir ci-dessous).         |
| `ignoreOtherMentions` | `false`           | Ignore les messages qui mentionnent quelqu’un d’autre, mais pas le bot.                                  |
| `historyLimit`        | `50`              | Nombre de messages récents sans mention conservés comme contexte pour le prochain tour avec mention. `0` désactive l’historique. |
| `tools`               | —                 | Autorise ou refuse des outils pour l’ensemble du groupe.                                                 |
| `toolsBySender`       | —                 | Remplacements d’outils par expéditeur ; consultez [Groupes](/fr/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | préfixe openid     | Libellé convivial utilisé dans les journaux et le contexte du groupe.                                    |
| `prompt`              | valeur intégrée par défaut | Invite de comportement propre au groupe ajoutée au contexte de l’agent.                         |

`commandLevel` accepte :

| Niveau   | Comportement                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Les commandes intégrées existantes restent disponibles. Certaines restent masquées dans les menus, mais les utilisateurs autorisés peuvent toujours les exécuter dans le groupe. |
| `safety` | `/help`, `/btw`, `/stop` restent visibles dans le groupe ; les commandes sensibles (`/config`, `/tools`, `/bash`, etc.) doivent être exécutées en conversation privée. |
| `strict` | Seules les commandes de session de groupe nécessaires au fonctionnement strict sont autorisées. `/stop` fonctionne toujours afin qu’un expéditeur autorisé puisse interrompre une exécution active. |

Les anciennes entrées `toolPolicy` de QQBot sont supprimées. Exécutez `openclaw doctor --fix` pour les migrer vers `tools`.

Les modes d’activation sont `mention` et `always`. `requireMention: true` correspond à
`mention` ; `requireMention: false` correspond à `always`. Lorsqu’un remplacement d’activation
au niveau de la session est présent, il prévaut sur la configuration.

La file d’attente entrante est propre à chaque pair. Les pairs de groupe disposent d’une capacité de file supérieure (50 contre 20
pour les pairs directs), suppriment en priorité les messages rédigés par le bot avant ceux des humains lorsqu’elle est pleine
et fusionnent les rafales de messages de groupe ordinaires en un seul tour attribué. Les commandes slash
s’exécutent une par une, indépendamment de tout lot fusionné.

### Voix (STT / TTS)

La prise en charge de STT et TTS utilise une configuration à deux niveaux avec repli prioritaire :

| Paramètre | Propre au Plugin                                         | Repli du framework            |
| --------- | -------------------------------------------------------- | ----------------------------- |
| STT       | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS       | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Définissez `enabled: false` sur l’un ou l’autre pour le désactiver. Les remplacements TTS au niveau du compte utilisent la
même structure que `messages.tts` et sont fusionnés récursivement par-dessus la configuration TTS du canal/globale.

Les requêtes STT expirent après 60 secondes par défaut. Le STT propre au Plugin utilise le
remplacement `models.providers.<id>.timeoutSeconds` du modèle sélectionné. Le STT audio du framework
utilise `tools.media.audio.models[0].timeoutSeconds`, puis
`tools.media.audio.timeoutSeconds`, puis le remplacement du fournisseur sélectionné.

Les pièces jointes vocales QQ entrantes sont exposées aux agents sous forme de métadonnées de média audio,
tout en excluant les fichiers vocaux bruts des `MediaPaths` génériques. `[[audio_as_voice]]`
dans une réponse en texte brut synthétise le TTS et envoie un message vocal QQ natif lorsque
le TTS est configuré.

Le comportement de téléversement/transcodage de l’audio sortant peut également être ajusté avec
`channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats cibles

| Format                     | Description                  |
| -------------------------- | ---------------------------- |
| `qqbot:c2c:OPENID`         | Conversation privée (C2C)    |
| `qqbot:group:GROUP_OPENID` | Conversation de groupe       |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde              |

<Note>
Chaque bot possède son propre ensemble d’OpenID d’utilisateurs. Un OpenID reçu par le bot A **ne peut pas** être utilisé pour envoyer des messages via le bot B.
</Note>

## Commandes slash

Commandes intégrées interceptées avant la file d’attente de l’IA :

| Commande             | Auth                  | Portée                   | Description                                                                                       |
| -------------------- | --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —                     | partout                  | Test de latence                                                                                   |
| `/bot-help`          | —                     | partout                  | Répertorie toutes les commandes                                                                   |
| `/bot-me`            | —                     | conversation privée uniquement | Affiche l’identifiant utilisateur QQ (openid) de l’expéditeur pour configurer `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —                     | conversation privée uniquement | Affiche la version du framework OpenClaw et celle du Plugin                                      |
| `/bot-upgrade`       | —                     | conversation privée uniquement | Affiche le lien vers le guide de mise à niveau de QQBot                                          |
| `/bot-approve`       | liste d’autorisation  | conversation privée uniquement | Gère la configuration d’approbation de l’exécution des commandes (on / off / always / reset / status) |
| `/bot-logs`          | liste d’autorisation  | conversation privée uniquement | Exporte les journaux récents du Gateway sous forme de fichier                                    |
| `/bot-clear-storage` | liste d’autorisation  | conversation privée uniquement | Supprime les téléchargements mis en cache dans le répertoire multimédia de QQBot                  |
| `/bot-streaming`     | liste d’autorisation  | conversation privée uniquement | Active ou désactive les réponses en streaming C2C                                                |
| `/bot-group-allways` | liste d’autorisation  | conversation privée uniquement | Bascule le mode d’activation de groupe par défaut (mention obligatoire ou toujours actif)         |

Ajoutez `?` à n’importe quelle commande pour obtenir de l’aide sur son utilisation (par exemple `/bot-upgrade ?`).

Les commandes avec « Auth : liste d’autorisation » exigent également que l’openid de l’expéditeur figure dans une
liste `allowFrom` explicite sans caractère générique (`groupAllowFrom` est prioritaire pour les
commandes émises depuis un groupe, avec repli sur `allowFrom`). Un caractère générique
`allowFrom: ["*"]` autorise la conversation, mais pas ces commandes. L’exécution de l’une d’elles
en dehors d’une conversation privée ou sans autorisation renvoie une indication au lieu
d’ignorer silencieusement le message.

`/bot-me`, `/bot-version` et `/bot-upgrade` sont réservées aux conversations privées, mais ne
nécessitent pas la liste d’autorisation — tout expéditeur C2C peut les exécuter.

Lorsque les approbations d’exécution de QQ Bot utilisent le repli par défaut sur la même conversation, les clics
sur les boutons d’approbation natifs suivent la même liste d’autorisation explicite de commandes sans
caractère générique. Pour accorder un accès limité aux approbations sans accès plus large aux commandes, configurez
`channels.qqbot.execApprovals.approvers`. Les approbations d’exécution natives sont activées par
défaut.

## Médias et stockage

- Les médias entrants, sortants et transmis par le pont du Gateway partagent une même racine de charge utile sous
  `~/.openclaw/media/qqbot` (en respectant `OPENCLAW_HOME` lorsqu’elle est définie), afin que les téléversements,
  téléchargements et caches de transcodage restent dans un même répertoire protégé.
- La livraison de médias enrichis vers les destinataires C2C et de groupe passe par un même chemin `sendMedia`.
  Les fichiers locaux et les tampons en mémoire de 5&nbsp;Mio ou plus utilisent les points de terminaison de
  téléversement fragmenté de QQ ; les charges utiles plus petites et les sources URL distante/Base64 utilisent
  l’API de téléversement en une seule opération.
- Si une mise à niveau à chaud interrompt le Gateway avant la fin de l’écriture de
  `openclaw.json`, le Plugin restaure au prochain démarrage les derniers `appId` / `clientSecret`
  connus de ce compte à partir d’un instantané interne (sans jamais
  écraser une modification volontaire de la configuration), de sorte qu’il n’est pas
  nécessaire de rescanner le code QR.

## Dépannage

- **Le Gateway ne démarre pas / aucun message entrant :** vérifiez que `appId` et
  `clientSecret` sont corrects et que le bot est activé sur la plateforme ouverte QQ.
  Une information d’identification manquante produit le message « QQBot not configured (missing appId or
  clientSecret) ».
- **La configuration avec `--token-file` apparaît toujours comme non configurée :** `--token-file` définit uniquement
  l’AppSecret. `appId` doit toujours être défini dans la configuration ou dans `QQBOT_APP_ID`.
- **Les réponses de groupe en rafale entrent en collision :** lorsque la file d’attente d’un pair est pleine, la file entrante évince
  les messages rédigés par le bot avant ceux des humains et fusionne
  les rafales de messages de groupe normaux (hors commandes) en un seul tour attribué, afin
  qu’un afflux de messages de bots ne prive pas les messages humains de traitement.
- **Les messages proactifs n’arrivent pas :** QQ peut bloquer les messages initiés par le bot si
  l’utilisateur n’a pas interagi récemment.
- **La voix n’est pas transcrite :** assurez-vous que la reconnaissance vocale est configurée et que le fournisseur est
  joignable.

## Voir aussi

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Dépannage des canaux](/fr/channels/troubleshooting)
