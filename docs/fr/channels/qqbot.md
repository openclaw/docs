---
read_when:
    - Vous souhaitez connecter OpenClaw à QQ
    - Vous devez configurer les identifiants du bot QQ
    - Vous souhaitez prendre en charge les discussions de groupe ou privées avec QQ Bot
summary: Configuration, paramétrage et utilisation de QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-07-16T12:57:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot se connecte à OpenClaw via l’API officielle QQ Bot (Gateway WebSocket).
Les conversations privées C2C et les mentions `@` dans les groupes sont les principaux types de conversation, avec des
médias enrichis (images, messages vocaux, vidéos, fichiers). Les messages des canaux de guilde prennent uniquement en charge
le texte et les images accessibles par URL distante ; les messages vocaux, les vidéos, les téléversements de fichiers et les images
locales/Base64 ne sont pas disponibles dans les canaux de guilde. Les réactions et les fils de discussion ne sont pris en charge
nulle part.

Statut : plugin officiel téléchargeable.

## Installation

```bash
openclaw plugins install @openclaw/qqbot
```

## Configuration initiale

1. Accédez à la [plateforme ouverte QQ](https://q.qq.com/) et scannez le code QR avec QQ sur votre
   téléphone pour vous inscrire ou vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Repérez **AppID** et **AppSecret** sur la page des paramètres du bot, puis copiez-les.

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

L’assistant propose également l’association par code QR au lieu de saisir manuellement
AppID/AppSecret : scannez le code avec l’application mobile associée au QQ Bot cible pour terminer
l’association. OpenClaw conserve les identifiants renvoyés dans la portée de configuration
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

### Diffusion en continu

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // diffusion par blocs : "partial" (par défaut) ou "off"
        nativeTransport: true, // utiliser l’API C2C stream_messages officielle de QQ pour les messages privés
      },
    },
  },
}
```

- `streaming.mode: "off"` désactive la diffusion par blocs pour le compte.
- `streaming.nativeTransport: true` diffuse les réponses C2C (messages privés) via l’API
  officielle `stream_messages` de QQ ; les cibles de groupe et de canal ne sont pas affectées.
- Les anciennes valeurs scalaires `streaming: true|false` et la clé `streaming.c2cStreamApi`
  sont migrées vers cette structure via `openclaw doctor --fix`.
- `/bot-streaming on|off` active ou désactive la même configuration depuis un message privé.

### Politique d’accès

- `allowFrom` / `groupAllowFrom` déterminent qui peut converser avec le bot dans les contextes C2C /
  de groupe. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  contrôlent le mode d’application. `dmPolicy` prend par défaut la valeur `allowlist` dès que
  `allowFrom` contient une entrée concrète (sans caractère générique), sinon `open`.
  `groupPolicy` prend par défaut la valeur `allowlist` dès que `groupAllowFrom` ou
  `allowFrom` contient une entrée concrète, sinon `open`.
- Les commandes slash « Auth: allowlist » exigent une entrée explicite sans caractère générique dans
  `allowFrom` (ou `groupAllowFrom` pour les appels depuis un groupe), indépendamment de
  `dmPolicy` / `groupPolicy` — consultez [Commandes slash](#slash-commands).

### Configuration multicomptes

Exécutez plusieurs bots QQ dans une même instance OpenClaw :

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

Chaque compte dispose de sa propre connexion WebSocket isolée, de son propre client API et de son propre cache de jetons,
indexés par `appId`. Les lignes de journal portent l’identifiant du compte propriétaire afin que
les diagnostics restent distincts lorsque plusieurs bots s’exécutent sous un même Gateway.

Ajoutez un deuxième bot via la CLI :

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

`groups["*"]` définit les valeurs par défaut de chaque groupe ; une entrée `groups.GROUP_OPENID`
concrète remplace ces valeurs par défaut pour un groupe. Paramètres des groupes :

| Champ                 | Valeur par défaut          | Description                                                                                        |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Exiger une mention `@` avant que le bot ne réponde.                                                     |
| `commandLevel`        | `all`            | Commandes slash intégrées pouvant être exécutées dans le groupe (voir ci-dessous).                                    |
| `ignoreOtherMentions` | `false`          | Ignorer les messages qui mentionnent une autre personne, mais pas le bot.                                           |
| `historyLimit`        | `50`             | Messages récents sans mention conservés comme contexte pour le prochain tour comportant une mention. `0` désactive l’historique.     |
| `tools`               | —                | Autoriser ou refuser des outils pour l’ensemble du groupe.                                                              |
| `toolsBySender`       | —                | Remplacements des outils par expéditeur ; consultez [Groupes](/fr/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | préfixe openid    | Libellé convivial utilisé dans les journaux et le contexte du groupe.                                                     |
| `prompt`              | valeur intégrée par défaut | Invite de comportement propre au groupe ajoutée au contexte de l’agent.                                           |

`commandLevel` accepte :

| Niveau    | Comportement                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Les commandes intégrées existantes restent disponibles. Certaines restent masquées dans les menus, mais les utilisateurs autorisés peuvent toujours les exécuter dans le groupe.                  |
| `safety` | `/help`, `/btw`, `/stop` restent visibles dans le groupe ; les commandes sensibles (`/config`, `/tools`, `/bash`, etc.) doivent être exécutées dans une conversation privée.      |
| `strict` | Seuls les contrôles de session de groupe nécessaires à un fonctionnement strict sont autorisés. `/stop` continue de fonctionner afin qu’un expéditeur autorisé puisse interrompre une exécution active. |

Les anciennes entrées QQBot `toolPolicy` sont retirées. Exécutez `openclaw doctor --fix` pour les migrer vers `tools`.

Les modes d’activation sont `mention` et `always`. `requireMention: true` correspond à
`mention` ; `requireMention: false` correspond à `always`. Lorsqu’un remplacement d’activation
au niveau de la session est présent, il prévaut sur la configuration.

La file d’attente entrante est propre à chaque correspondant. Les correspondants de groupe bénéficient d’une capacité de file supérieure (50 contre 20
pour les correspondants directs) ; lorsqu’elle est pleine, les messages rédigés par le bot sont évincés avant ceux des humains,
et les rafales de messages de groupe ordinaires sont fusionnées en un seul tour attribué. Les commandes slash
s’exécutent l’une après l’autre, indépendamment de tout lot de fusion.

### Voix (STT / TTS)

STT et TTS prennent en charge une configuration à deux niveaux avec repli prioritaire :

| Paramètre | Propre au plugin                                          | Repli du framework            |
| --------- | --------------------------------------------------------- | ----------------------------- |
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
même structure que `messages.tts` et sont fusionnés en profondeur avec la configuration TTS du canal/globale.

Les requêtes STT expirent par défaut après 60 secondes. Le STT propre au plugin utilise le remplacement
`models.providers.<id>.timeoutSeconds` sélectionné. Le STT audio du framework
utilise `tools.media.audio.models[0].timeoutSeconds`, puis
`tools.media.audio.timeoutSeconds`, puis le remplacement du fournisseur sélectionné.

Les pièces jointes vocales QQ entrantes sont présentées aux agents comme des métadonnées de média audio,
tout en excluant les fichiers vocaux bruts de la valeur générique `MediaPaths`. La présence de `[[audio_as_voice]]`
dans une réponse en texte brut déclenche la synthèse TTS et l’envoi d’un message vocal QQ natif lorsque
TTS est configuré.

Le comportement de téléversement/transcodage de l’audio sortant peut également être ajusté avec
`channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats des cibles

| Format                     | Description             |
| -------------------------- | ----------------------- |
| `qqbot:c2c:OPENID`         | Conversation privée (C2C) |
| `qqbot:group:GROUP_OPENID` | Conversation de groupe  |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde          |

<Note>
Chaque bot possède son propre ensemble d’OpenID utilisateur. Un OpenID reçu par le bot A **ne peut pas** être utilisé pour envoyer des messages via le bot B.
</Note>

## Commandes slash

Commandes intégrées interceptées avant la file d’attente de l’IA :

| Commande              | Authentification      | Portée        | Description                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | toute          | Test de latence                                                                   |
| `/bot-help`          | —         | toute          | Répertorier toutes les commandes                                                              |
| `/bot-me`            | —         | privé uniquement | Afficher l’identifiant utilisateur QQ (openid) de l’expéditeur pour la configuration de `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | privé uniquement | Afficher la version du framework OpenClaw et celle du Plugin                         |
| `/bot-upgrade`       | —         | privé uniquement | Afficher le lien vers le guide de mise à niveau de QQBot                                              |
| `/bot-approve`       | liste d’autorisation | privé uniquement | Gérer la configuration d’approbation de l’exécution des commandes (activée / désactivée / toujours / réinitialiser / état)  |
| `/bot-logs`          | liste d’autorisation | privé uniquement | Exporter les journaux récents du Gateway sous forme de fichier                                           |
| `/bot-clear-storage` | liste d’autorisation | privé uniquement | Supprimer les téléchargements mis en cache dans le répertoire multimédia de QQBot                        |
| `/bot-streaming`     | liste d’autorisation | privé uniquement | Activer ou désactiver les réponses diffusées en continu en C2C                                                   |
| `/bot-group-allways` | liste d’autorisation | privé uniquement | Basculer le mode d’activation par défaut des groupes (mention obligatoire ou toujours actif)      |

Ajoutez `?` à toute commande pour obtenir de l’aide sur son utilisation (par exemple `/bot-upgrade ?`).

Les commandes avec « Authentification : liste d’autorisation » exigent également que l’openid de l’expéditeur figure dans une
liste `allowFrom` explicite sans caractère générique (`groupAllowFrom` est prioritaire pour les
commandes émises depuis un groupe, avec repli sur `allowFrom`). Le caractère générique
`allowFrom: ["*"]` autorise la discussion, mais pas ces commandes. L’exécution de l’une d’elles
hors d’une discussion privée ou sans autorisation renvoie une indication au lieu
d’ignorer silencieusement le message.

`/bot-me`, `/bot-version` et `/bot-upgrade` sont réservées aux discussions privées, mais ne
nécessitent pas la liste d’autorisation : tout expéditeur C2C peut les exécuter.

Lorsque les approbations d’exécution de QQ Bot utilisent le repli par défaut vers la même discussion, les clics sur les boutons
d’approbation natifs suivent la même liste d’autorisation explicite sans caractère générique pour les commandes. Pour
accorder uniquement l’accès aux approbations sans élargir l’accès aux commandes, configurez
`channels.qqbot.execApprovals.approvers`. Les approbations d’exécution natives sont activées par
défaut.

## Médias et stockage

- Les médias entrants, sortants et transmis par le pont du Gateway partagent une même racine de charge utile sous
  `~/.openclaw/media/qqbot` (en respectant `OPENCLAW_HOME` lorsqu’elle est définie), afin que les téléversements,
  téléchargements et caches de transcodage restent dans un même répertoire protégé.
- La livraison de médias enrichis vers les cibles C2C et de groupe passe par un même chemin `sendMedia`.
  Les fichiers locaux et les tampons en mémoire de 5&nbsp;MiB ou plus utilisent les
  points de terminaison de téléversement segmenté de QQ ; les charges utiles plus petites et les sources par URL distante/Base64 utilisent
  l’API de téléversement en une seule opération.
- Si une mise à niveau à chaud interrompt le Gateway avant la fin de l’écriture de
  `openclaw.json`, le Plugin restaure les dernières valeurs connues de `appId` / `clientSecret`
  pour ce compte à partir d’un instantané interne au prochain démarrage (sans jamais
  écraser une modification intentionnelle de la configuration), de sorte qu’il n’est pas
  nécessaire de rescanner le code QR.

## Dépannage

- **Le Gateway ne démarre pas / aucun message entrant :** vérifiez que `appId` et
  `clientSecret` sont corrects et que le bot est activé sur QQ Open Platform.
  L’absence d’un identifiant d’authentification produit le message « QQBot non configuré (appId ou
  clientSecret manquant) ».
- **La configuration avec `--token-file` apparaît toujours comme non configurée :** `--token-file` définit uniquement
  l’AppSecret. `appId` doit toujours être défini dans la configuration ou dans `QQBOT_APP_ID`.
- **Les réponses groupées en rafale entrent en collision :** lorsque la file d’attente d’un pair est pleine, la file entrante évince
  les messages rédigés par des bots avant ceux des humains, et fusionne
  les rafales de messages de groupe normaux (hors commandes) en un seul tour attribué, afin
  qu’un flot de bavardages de bots ne prive pas les messages humains de traitement.
- **Les messages proactifs n’arrivent pas :** QQ peut bloquer les messages initiés par le bot si
  l’utilisateur n’a pas interagi récemment.
- **La voix n’est pas transcrite :** assurez-vous que la STT est configurée et que le fournisseur est
  accessible.

## Pages connexes

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Dépannage des canaux](/fr/channels/troubleshooting)
