---
read_when:
    - Vous voulez connecter OpenClaw à QQ
    - Vous avez besoin de configurer les identifiants de QQ Bot
    - Vous voulez la prise en charge des discussions de groupe ou privées avec QQ Bot
summary: Configuration, paramètres et utilisation de QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-04-25T13:41:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

Bot QQ se connecte à OpenClaw via l’API officielle QQ Bot (Gateway WebSocket). Le
plugin prend en charge les discussions privées C2C, les @messages de groupe et les messages de canal de guilde avec
des médias enrichis (images, voix, vidéo, fichiers).

Statut : plugin inclus. Les messages directs, les discussions de groupe, les canaux de guilde et
les médias sont pris en charge. Les réactions et les fils de discussion ne sont pas pris en charge.

## Plugin inclus

Les versions actuelles d’OpenClaw incluent QQ Bot, donc les builds packagés normaux n’ont pas besoin
d’une étape `openclaw plugins install` séparée.

## Configuration

1. Rendez-vous sur la [plateforme ouverte QQ](https://q.qq.com/) et scannez le code QR avec votre
   QQ sur téléphone pour vous inscrire / vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Trouvez **AppID** et **AppSecret** sur la page des paramètres du bot et copiez-les.

> AppSecret n’est pas stocké en clair — si vous quittez la page sans l’enregistrer,
> vous devrez en régénérer un nouveau.

4. Ajoutez le canal :

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Redémarrez la Gateway.

Parcours de configuration interactifs :

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurer

Configuration minimale :

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

Variables d’environnement du compte par défaut :

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret via fichier :

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

Remarques :

- Le repli sur les variables d’environnement s’applique uniquement au compte QQ Bot par défaut.
- `openclaw channels add --channel qqbot --token-file ...` fournit
  uniquement AppSecret ; AppID doit déjà être défini dans la configuration ou dans `QQBOT_APP_ID`.
- `clientSecret` accepte aussi une entrée SecretRef, pas seulement une chaîne en clair.

### Configuration multi-comptes

Exécutez plusieurs bots QQ dans une seule instance OpenClaw :

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

Chaque compte lance sa propre connexion WebSocket et maintient un cache de jetons indépendant
(isolé par `appId`).

Ajoutez un second bot via la CLI :

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voix (STT / TTS)

La prise en charge STT et TTS utilise une configuration à deux niveaux avec repli prioritaire :

| Paramètre | Spécifique au plugin  | Repli du framework            |
| --------- | --------------------- | ----------------------------- |
| STT       | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS       | `channels.qqbot.tts`  | `messages.tts`                |

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
    },
  },
}
```

Définissez `enabled: false` sur l’un ou l’autre pour les désactiver.

Les pièces jointes vocales QQ entrantes sont exposées aux agents comme métadonnées de média audio tout en
gardant les fichiers vocaux bruts hors de `MediaPaths` génériques. Les réponses en texte brut `[[audio_as_voice]]`
synthétisent le TTS et envoient un message vocal QQ natif lorsque TTS est
configuré.

Le comportement d’upload/transcodage audio sortant peut aussi être ajusté avec
`channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats cibles

| Format                     | Description           |
| -------------------------- | --------------------- |
| `qqbot:c2c:OPENID`         | Discussion privée (C2C) |
| `qqbot:group:GROUP_OPENID` | Discussion de groupe  |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde       |

> Chaque bot possède son propre ensemble d’OpenID utilisateur. Un OpenID reçu par le Bot A **ne peut pas**
> être utilisé pour envoyer des messages via le Bot B.

## Commandes slash

Commandes intégrées interceptées avant la file d’attente IA :

| Commande       | Description                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test de latence                                                                                          |
| `/bot-version` | Afficher la version du framework OpenClaw                                                                |
| `/bot-help`    | Lister toutes les commandes                                                                              |
| `/bot-upgrade` | Afficher le lien du guide de mise à niveau de QQBot                                                      |
| `/bot-logs`    | Exporter les journaux récents de la gateway dans un fichier                                              |
| `/bot-approve` | Approuver une action QQ Bot en attente (par exemple, confirmer un upload C2C ou de groupe) via le flux natif. |

Ajoutez `?` à n’importe quelle commande pour afficher l’aide d’utilisation (par exemple `/bot-upgrade ?`).

## Architecture du moteur

QQ Bot est fourni comme moteur autonome à l’intérieur du plugin :

- Chaque compte possède une pile de ressources isolée (connexion WebSocket, client API, cache de jetons, racine de stockage média) indexée par `appId`. Les comptes ne partagent jamais l’état entrant/sortant.
- Le logger multi-comptes étiquette les lignes de journal avec le compte propriétaire afin que les diagnostics restent séparables lorsque vous exécutez plusieurs bots sous une seule gateway.
- Les chemins entrants, sortants et de passerelle partagent une racine unique de charge utile média sous `~/.openclaw/media`, afin que les uploads, téléchargements et caches de transcodage aboutissent dans un seul répertoire protégé au lieu d’une arborescence par sous-système.
- Les identifiants peuvent être sauvegardés et restaurés dans le cadre des instantanés standard d’identifiants OpenClaw ; le moteur rattache chaque pile de ressources de compte lors de la restauration sans exiger un nouvel appairage par code QR.

## Onboarding par code QR

Comme alternative au collage manuel de `AppID:AppSecret`, le moteur prend en charge un flux d’onboarding par code QR pour lier un QQ Bot à OpenClaw :

1. Exécutez le parcours de configuration QQ Bot (par exemple `openclaw channels add --channel qqbot`) et choisissez le flux par code QR lorsqu’il est proposé.
2. Scannez le code QR généré avec l’application de téléphone liée au QQ Bot cible.
3. Approuvez l’appairage sur le téléphone. OpenClaw conserve les identifiants retournés dans `credentials/` sous la portée de compte appropriée.

Les invites d’approbation générées par le bot lui-même (par exemple, les flux « autoriser cette action ? » exposés par l’API QQ Bot) apparaissent comme invites OpenClaw natives que vous pouvez accepter avec `/bot-approve` au lieu de répondre via le client QQ brut.

## Dépannage

- **Le bot répond « gone to Mars » :** identifiants non configurés ou Gateway non démarrée.
- **Aucun message entrant :** vérifiez que `appId` et `clientSecret` sont corrects, et que le
  bot est activé sur la plateforme ouverte QQ.
- **La configuration avec `--token-file` apparaît toujours comme non configurée :** `--token-file` définit uniquement
  AppSecret. Vous avez toujours besoin de `appId` dans la configuration ou de `QQBOT_APP_ID`.
- **Les messages proactifs n’arrivent pas :** QQ peut intercepter les messages initiés par le bot si
  l’utilisateur n’a pas interagi récemment.
- **La voix n’est pas transcrite :** assurez-vous que STT est configuré et que le fournisseur est accessible.

## Voir aussi

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Dépannage des canaux](/fr/channels/troubleshooting)
