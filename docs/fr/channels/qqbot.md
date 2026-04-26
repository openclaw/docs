---
read_when:
    - Vous souhaitez connecter OpenClaw à QQ
    - Vous avez besoin de configurer les identifiants QQ Bot
    - Vous souhaitez la prise en charge des groupes QQ Bot ou des discussions privées
summary: Configuration, paramètres et utilisation de QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-04-26T11:24:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot se connecte à OpenClaw via l'API officielle QQ Bot (passerelle WebSocket). Le
Plugin prend en charge les discussions privées C2C, les `@messages` de groupe et les messages de canal de guilde avec
médias enrichis (images, voix, vidéo, fichiers).

Statut : Plugin inclus. Les messages directs, discussions de groupe, canaux de guilde et
médias sont pris en charge. Les réactions et fils de discussion ne sont pas pris en charge.

## Plugin inclus

Les versions actuelles d'OpenClaw incluent QQ Bot, donc les builds packagés normaux n'ont pas besoin
d'une étape distincte `openclaw plugins install`.

## Configuration

1. Accédez à la [QQ Open Platform](https://q.qq.com/) et scannez le code QR avec votre
   QQ téléphone pour vous inscrire / vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Trouvez **AppID** et **AppSecret** sur la page des paramètres du bot et copiez-les.

> AppSecret n'est pas stocké en clair — si vous quittez la page sans l'enregistrer,
> vous devrez en régénérer un nouveau.

4. Ajoutez le canal :

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Redémarrez la Gateway.

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

Variables d'environnement du compte par défaut :

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret basé sur un fichier :

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

Remarques :

- Le repli vers les variables d'environnement s'applique uniquement au compte QQ Bot par défaut.
- `openclaw channels add --channel qqbot --token-file ...` fournit uniquement
  AppSecret ; AppID doit déjà être défini dans la configuration ou dans `QQBOT_APP_ID`.
- `clientSecret` accepte aussi une entrée SecretRef, pas seulement une chaîne en clair.

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

Chaque compte lance sa propre connexion WebSocket et maintient un cache de jetons indépendant
(isolé par `appId`).

Ajoutez un second bot via la CLI :

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voix (STT / TTS)

La prise en charge STT et TTS utilise une configuration à deux niveaux avec repli par priorité :

| Setting | Plugin-specific                                          | Framework fallback            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Définissez `enabled: false` sur l'un ou l'autre pour le désactiver.
Les surcharges TTS au niveau du compte utilisent la même structure que `messages.tts` et sont fusionnées en profondeur
par-dessus la configuration TTS globale/du canal.

Les pièces jointes vocales QQ entrantes sont exposées aux agents comme métadonnées de média audio tout en
gardant les fichiers vocaux bruts hors de `MediaPaths` générique. Les réponses en texte brut `[[audio_as_voice]]`
synthétisent du TTS et envoient un message vocal QQ natif lorsque le TTS est
configuré.

Le comportement de téléversement/transcodage audio sortant peut aussi être ajusté avec
`channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats de cible

| Format                     | Description             |
| -------------------------- | ----------------------- |
| `qqbot:c2c:OPENID`         | Discussion privée (C2C) |
| `qqbot:group:GROUP_OPENID` | Discussion de groupe    |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde         |

> Chaque bot a son propre ensemble d'OpenID utilisateur. Un OpenID reçu par le bot A **ne peut pas**
> être utilisé pour envoyer des messages via le bot B.

## Commandes slash

Commandes intégrées interceptées avant la file d'attente de l'IA :

| Command | Description |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test de latence                                                                                             |
| `/bot-version` | Afficher la version du framework OpenClaw                                                                      |
| `/bot-help`    | Lister toutes les commandes                                                                                        |
| `/bot-upgrade` | Afficher le lien vers le guide de mise à niveau de QQBot                                                                        |
| `/bot-logs`    | Exporter les journaux récents de la gateway comme fichier                                                                     |
| `/bot-approve` | Approuver une action QQ Bot en attente (par exemple, confirmer un téléversement C2C ou de groupe) via le flux natif. |

Ajoutez `?` à n'importe quelle commande pour obtenir l'aide d'utilisation (par exemple `/bot-upgrade ?`).

## Architecture du moteur

QQ Bot est livré avec un moteur autonome à l'intérieur du Plugin :

- Chaque compte possède une pile de ressources isolée (connexion WebSocket, client API, cache de jetons, racine de stockage des médias) indexée par `appId`. Les comptes ne partagent jamais l'état entrant/sortant.
- Le logger multi-comptes balise les lignes de journal avec le compte propriétaire afin que les diagnostics restent séparables lorsque vous exécutez plusieurs bots sous une même gateway.
- Les chemins entrants, sortants et de pont gateway partagent une racine unique de charge utile média sous `~/.openclaw/media`, afin que les téléversements, téléchargements et caches de transcodage soient placés dans un seul répertoire protégé au lieu d'une arborescence par sous-système.
- Les identifiants peuvent être sauvegardés et restaurés dans le cadre des instantanés d'identifiants OpenClaw standard ; le moteur rattache la pile de ressources de chaque compte lors de la restauration sans nécessiter une nouvelle association par code QR.

## Onboarding par code QR

Comme alternative au collage manuel de `AppID:AppSecret`, le moteur prend en charge un flux d'onboarding par code QR pour lier un QQ Bot à OpenClaw :

1. Exécutez le parcours de configuration QQ Bot (par exemple `openclaw channels add --channel qqbot`) et choisissez le flux par code QR lorsque vous y êtes invité.
2. Scannez le code QR généré avec l'application téléphone liée au QQ Bot cible.
3. Approuvez l'association sur le téléphone. OpenClaw conserve les identifiants renvoyés dans `credentials/` sous le bon périmètre de compte.

Les invites d'approbation générées par le bot lui-même (par exemple les flux « autoriser cette action ? » exposés par l'API QQ Bot) apparaissent comme des invites OpenClaw natives que vous pouvez accepter avec `/bot-approve` au lieu de répondre via le client QQ brut.

## Résolution des problèmes

- **Le bot répond "gone to Mars" :** identifiants non configurés ou Gateway non démarrée.
- **Aucun message entrant :** vérifiez que `appId` et `clientSecret` sont corrects et que le
  bot est activé sur la QQ Open Platform.
- **Réponses à soi-même répétées :** OpenClaw enregistre les index de référence sortants QQ comme
  rédigés par le bot et ignore les événements entrants dont le `msgIdx` actuel correspond à ce
  même compte bot. Cela évite les boucles d'écho de la plateforme tout en permettant toujours aux utilisateurs
  de citer ou répondre à d'anciens messages du bot.
- **La configuration avec `--token-file` apparaît toujours comme non configurée :** `--token-file` définit seulement
  AppSecret. Vous avez toujours besoin de `appId` dans la configuration ou de `QQBOT_APP_ID`.
- **Les messages proactifs n'arrivent pas :** QQ peut intercepter les messages initiés par le bot si
  l'utilisateur n'a pas interagi récemment.
- **La voix n'est pas transcrite :** assurez-vous que STT est configuré et que le fournisseur est joignable.

## Liens associés

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Résolution des problèmes des canaux](/fr/channels/troubleshooting)
