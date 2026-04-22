---
read_when:
    - Vous souhaitez connecter OpenClaw à QQ
    - Vous devez configurer les identifiants du bot QQ
    - Vous souhaitez utiliser la prise en charge du bot QQ pour les groupes ou les discussions privées
summary: Configuration, config et utilisation du bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-22T04:20:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# Bot QQ

Le bot QQ se connecte à OpenClaw via l’API officielle QQ Bot (passerelle WebSocket). Le
Plugin prend en charge les discussions privées C2C, les @messages de groupe et les messages de canaux de guilde avec
des médias enrichis (images, voix, vidéo, fichiers).

Statut : Plugin inclus. Les messages directs, les discussions de groupe, les canaux de guilde et les
médias sont pris en charge. Les réactions et les fils ne sont pas pris en charge.

## Plugin inclus

Les versions actuelles d’OpenClaw incluent le bot QQ, donc les builds packagés normaux n’ont pas besoin
d’une étape séparée `openclaw plugins install`.

## Configuration

1. Accédez à la [QQ Open Platform](https://q.qq.com/) et scannez le code QR avec votre
   QQ sur téléphone pour vous inscrire / vous connecter.
2. Cliquez sur **Create Bot** pour créer un nouveau bot QQ.
3. Trouvez **AppID** et **AppSecret** sur la page des paramètres du bot et copiez-les.

> AppSecret n’est pas stocké en clair — si vous quittez la page sans l’enregistrer,
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

Variables d’environnement du compte par défaut :

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret via fichier :

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

- Le repli sur les variables d’environnement s’applique uniquement au compte QQ Bot par défaut.
- `openclaw channels add --channel qqbot --token-file ...` fournit uniquement
  l’AppSecret ; l’AppID doit déjà être défini dans la config ou dans `QQBOT_APP_ID`.
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

| Setting | Spécifique au Plugin | Repli du framework           |
| ------- | -------------------- | ---------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

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

Définissez `enabled: false` sur l’un ou l’autre pour le désactiver.

Le comportement de téléversement/transcodage de l’audio sortant peut aussi être ajusté avec
`channels.qqbot.audioFormatPolicy` :

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formats cibles

| Format                     | Description       |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | Discussion privée (C2C) |
| `qqbot:group:GROUP_OPENID` | Discussion de groupe |
| `qqbot:channel:CHANNEL_ID` | Canal de guilde   |

> Chaque bot possède son propre ensemble d’OpenID utilisateur. Un OpenID reçu par le bot A **ne peut pas**
> être utilisé pour envoyer des messages via le bot B.

## Commandes slash

Commandes intégrées interceptées avant la file d’attente de l’IA :

| Commande       | Description                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test de latence                                                                                                 |
| `/bot-version` | Affiche la version du framework OpenClaw                                                                        |
| `/bot-help`    | Liste toutes les commandes                                                                                      |
| `/bot-upgrade` | Affiche le lien vers le guide de mise à niveau QQBot                                                            |
| `/bot-logs`    | Exporte les journaux récents de la Gateway sous forme de fichier                                                |
| `/bot-approve` | Approuve une action QQ Bot en attente (par exemple, confirmer un téléversement C2C ou de groupe) via le flux natif. |

Ajoutez `?` à n’importe quelle commande pour afficher l’aide d’utilisation (par exemple `/bot-upgrade ?`).

## Architecture du moteur

QQ Bot est fourni comme un moteur autonome à l’intérieur du Plugin :

- Chaque compte possède une pile de ressources isolée (connexion WebSocket, client API, cache de jetons, racine de stockage des médias) indexée par `appId`. Les comptes ne partagent jamais l’état entrant/sortant.
- Le journaliseur multi-comptes balise les lignes de journal avec le compte propriétaire afin que les diagnostics restent séparables lorsque vous exécutez plusieurs bots sous une seule Gateway.
- Les chemins entrants, sortants et de pont de Gateway partagent une racine unique de charge utile de médias sous `~/.openclaw/media`, de sorte que les téléversements, téléchargements et caches de transcodage sont placés dans un répertoire protégé unique au lieu d’une arborescence par sous-système.
- Les identifiants peuvent être sauvegardés et restaurés dans le cadre des instantanés standard d’identifiants OpenClaw ; le moteur rattache de nouveau la pile de ressources de chaque compte lors de la restauration sans nécessiter un nouvel appairage par code QR.

## Intégration par code QR

Comme alternative au collage manuel de `AppID:AppSecret`, le moteur prend en charge un flux d’intégration par code QR pour lier un bot QQ à OpenClaw :

1. Exécutez le chemin de configuration du bot QQ (par exemple `openclaw channels add --channel qqbot`) et choisissez le flux par code QR lorsque cela vous est demandé.
2. Scannez le code QR généré avec l’application téléphone liée au bot QQ cible.
3. Approuvez l’appairage sur le téléphone. OpenClaw conserve les identifiants renvoyés dans `credentials/` sous le bon périmètre de compte.

Les invites d’approbation générées par le bot lui-même (par exemple les flux « autoriser cette action ? » exposés par l’API QQ Bot) apparaissent comme des invites natives OpenClaw que vous pouvez accepter avec `/bot-approve` plutôt qu’en répondant via le client QQ brut.

## Dépannage

- **Le bot répond « gone to Mars » :** les identifiants ne sont pas configurés ou la Gateway n’est pas démarrée.
- **Aucun message entrant :** vérifiez que `appId` et `clientSecret` sont corrects, et que le
  bot est activé sur la QQ Open Platform.
- **La configuration avec `--token-file` apparaît toujours comme non configurée :** `--token-file` définit uniquement
  l’AppSecret. Vous avez toujours besoin de `appId` dans la config ou de `QQBOT_APP_ID`.
- **Les messages proactifs n’arrivent pas :** QQ peut intercepter les messages initiés par le bot si
  l’utilisateur n’a pas interagi récemment.
- **La voix n’est pas transcrite :** assurez-vous que STT est configuré et que le provider est accessible.
