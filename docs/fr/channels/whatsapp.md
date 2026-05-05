---
read_when:
    - Travail sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:15:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Statut : prêt pour la production via WhatsApp Web (Baileys). Gateway gère les sessions liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le Plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose aussi le flux d’installation lorsque
  le Plugin n’est pas encore présent.
- Canal de développement + dépôt git extrait : utilise par défaut le chemin du Plugin local.
- Stable/Bêta : utilise le package npm `@openclaw/whatsapp` sur l’étiquette de version
  officielle actuelle.

L’installation manuelle reste disponible :

```bash
openclaw plugins install @openclaw/whatsapp
```

Utilisez le package nu pour suivre l’étiquette de version officielle actuelle. Épinglez une version
exacte uniquement lorsque vous avez besoin d’une installation reproductible.

Sous Windows, le Plugin WhatsApp a besoin de Git sur `PATH` pendant l’installation npm, car
l’une de ses dépendances Baileys/libsignal est récupérée depuis une URL git. Installez
Git for Windows, puis redémarrez le shell et relancez l’installation :

```powershell
winget install --id Git.Git -e
```

Portable Git fonctionne aussi si son répertoire `bin` est sur `PATH`.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    La politique de MP par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et procédures de réparation.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration de canal.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour joindre un répertoire d’authentification WhatsApp Web existant/personnalisé avant la connexion :

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d’appairage expirent après 1 heure. Les demandes en attente sont limitées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d’exécuter WhatsApp sur un numéro séparé lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont aussi prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    C’est le mode opérationnel le plus propre :

    - identité WhatsApp séparée pour OpenClaw
    - listes d’autorisation de MP et limites de routage plus claires
    - risque plus faible de confusion avec les conversations avec soi-même

    Modèle de politique minimal :

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    L’onboarding prend en charge le mode numéro personnel et écrit une base compatible avec les conversations avec soi-même :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections de conversation avec soi-même s’appuient sur le numéro propre lié et sur `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Le canal de la plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie WhatsApp Twilio séparé dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- Gateway gère la socket WhatsApp et la boucle de reconnexion.
- Le chien de garde de reconnexion utilise l’activité de transport WhatsApp Web, pas seulement le volume de messages applicatifs entrants, de sorte qu’une session d’appareil lié silencieuse n’est pas redémarrée uniquement parce que personne n’a envoyé de message récemment. Une limite plus longue de silence applicatif force tout de même une reconnexion si des trames de transport continuent d’arriver, mais qu’aucun message applicatif n’est traité pendant la fenêtre du chien de garde ; après une reconnexion transitoire pour une session récemment active, cette vérification de silence applicatif utilise le délai normal des messages pour la première fenêtre de récupération.
- Les temporisations de socket Baileys sont explicites sous `web.whatsapp.*` : `keepAliveIntervalMs` contrôle les pings applicatifs WhatsApp Web, `connectTimeoutMs` contrôle le délai d’expiration de la poignée de main d’ouverture, et `defaultQueryTimeoutMs` contrôle les délais d’expiration des requêtes Baileys.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les envois de groupe joignent les métadonnées de mention natives pour les jetons `@+<digits>` et `@<digits>` dans le texte et les légendes de médias lorsque le jeton correspond aux métadonnées de participant WhatsApp actuelles, y compris les groupes adossés à LID.
- Les chats de statut et de diffusion sont ignorés (`@status`, `@broadcast`).
- Le chien de garde de reconnexion suit l’activité de transport WhatsApp Web, pas seulement le volume de messages applicatifs entrants : les sessions d’appareil lié silencieuses restent actives tant que les trames de transport continuent, mais un blocage du transport force une reconnexion bien avant le chemin ultérieur de déconnexion distante.
- Les chats directs utilisent les règles de session de MP (`session.dmScope` ; la valeur par défaut `main` regroupe les MP dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Les canaux/newsletters WhatsApp peuvent être des cibles sortantes explicites avec leur JID natif `@newsletter`. Les envois sortants de newsletter utilisent les métadonnées de session de canal (`agent:<agentId>:whatsapp:channel:<jid>`) plutôt que la sémantique de session de MP.
- Le transport WhatsApp Web respecte les variables d’environnement de proxy standard sur l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez la configuration de proxy au niveau de l’hôte aux paramètres de proxy WhatsApp propres au canal.
- Lorsque `messages.removeAckAfterReply` est activé, OpenClaw efface la réaction d’accusé de réception WhatsApp après la remise d’une réponse visible.

## Hooks de Plugin et confidentialité

Les messages entrants WhatsApp peuvent contenir le contenu de messages personnels, des numéros de téléphone,
des identifiants de groupe, des noms d’expéditeurs et des champs de corrélation de session. Pour cette raison,
WhatsApp ne diffuse pas les charges utiles de hook `message_received` entrant aux plugins
sauf si vous l’activez explicitement :

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Vous pouvez limiter l’activation à un seul compte :

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Activez cette option uniquement pour les plugins auxquels vous faites confiance pour recevoir le contenu
et les identifiants des messages WhatsApp entrants.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux chats directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte les numéros au style E.164 (normalisés en interne).

    `allowFrom` est une liste de contrôle d’accès des expéditeurs de MP. Elle ne filtre pas les envois sortants explicites vers des JID de groupe WhatsApp ou des JID de canal `@newsletter`.

    Remplacement multicomptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) prennent le pas sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les appairages sont conservés dans le magasin d’autorisations du canal et fusionnés avec `allowFrom` configuré
    - l’automatisation planifiée et le repli de destinataire Heartbeat utilisent des cibles de livraison explicites ou `allowFrom` configuré ; les approbations d’appairage de MP ne sont pas des destinataires Cron ou Heartbeat implicites
    - si aucune liste d’autorisation n’est configurée, le numéro propre lié est autorisé par défaut
    - OpenClaw n’appaire jamais automatiquement les MP sortants `fromMe` (messages que vous vous envoyez depuis l’appareil lié)

  </Tab>

  <Tab title="Group policy + allowlists">
    L’accès aux groupes comporte deux couches :

    1. **Liste d’autorisation d’appartenance aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont éligibles
       - si `groups` est présent, il agit comme liste d’autorisation de groupes (`"*"` autorisé)

    2. **Politique d’expéditeur de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : liste d’autorisation des expéditeurs contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque tous les entrants de groupe

    Repli de liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution se rabat sur `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation d’expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe, le repli de politique de groupe à l’exécution est `allowlist` (avec un journal d’avertissement), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe nécessitent une mention par défaut.

    La détection de mentions inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - les transcriptions de notes vocales entrantes pour les messages de groupe autorisés
    - la détection implicite de réponse au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Note de sécurité :

    - la citation/réponse ne satisfait que le filtrage par mention ; elle n’accorde **pas** l’autorisation de l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs absents de la liste d’autorisation restent bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de session (pas la configuration globale). Elle est limitée au propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et conversation avec soi-même

Lorsque le numéro propre lié est aussi présent dans `allowFrom`, les protections WhatsApp de conversation avec soi-même s’activent :

- ignorer les accusés de lecture pour les tours de conversation avec soi-même
- ignorer le comportement de déclenchement automatique par JID de mention qui vous notifierait autrement vous-même
- si `messages.responsePrefix` n’est pas défini, les réponses de conversation avec soi-même utilisent par défaut `[{identity.name}]` ou `[openclaw]`

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Les messages WhatsApp entrants sont enveloppés dans l’enveloppe entrante partagée.

    Si une réponse citée existe, le contexte est ajouté sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les champs de métadonnées de réponse sont aussi renseignés lorsqu’ils sont disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 de l’expéditeur).
    Lorsque la cible de la réponse citée est un média téléchargeable, OpenClaw l’enregistre via
    le magasin normal de médias entrants et l’expose comme `MediaPath`/`MediaType` afin que
    l’agent puisse inspecter l’image référencée au lieu de voir uniquement
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Les messages entrants ne contenant que des médias sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les notes vocales de groupe autorisées sont transcrites avant le filtrage par mention lorsque le
    corps est uniquement `<media:audio>`, donc prononcer la mention du bot dans la note vocale peut
    déclencher la réponse. Si la transcription ne mentionne toujours pas le bot, elle est
    conservée dans l’historique de groupe en attente au lieu de l’espace réservé brut.

    Les corps de localisation utilisent un texte de coordonnées concis. Les libellés/commentaires de localisation et les détails de contact/vCard sont rendus comme des métadonnées non fiables clôturées, pas comme du texte d’invite en ligne.

  </Accordion>

  <Accordion title="Pending group history injection">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est enfin déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Marqueurs d’injection :

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Accusés de lecture">
    Les accusés de lecture sont activés par défaut pour les messages WhatsApp entrants acceptés.

    Désactiver globalement :

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Remplacement par compte :

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Les tours en auto-discussion ignorent les accusés de lecture, même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, découpage et médias

<AccordionGroup>
  <Accordion title="Découpage du texte">
    - limite de découpage par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis revient à un découpage sûr par longueur

  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles d’image, de vidéo, d’audio (note vocale PTT) et de document
    - les médias audio sont envoyés via la charge utile `audio` de Baileys avec `ptt: true`, afin que les clients WhatsApp les affichent comme une note vocale en mode pression pour parler
    - les charges utiles de réponse préservent `audioAsVoice` ; la sortie de note vocale TTS pour WhatsApp reste sur ce chemin PTT, même lorsque le fournisseur renvoie du MP3 ou du WebM
    - l’audio Ogg/Opus natif est envoyé sous la forme `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - l’audio non Ogg, y compris la sortie MP3/WebM de Microsoft Edge TTS, est transcodé avec `ffmpeg` en Ogg/Opus mono 48 kHz avant la livraison PTT
    - `/tts latest` envoie la dernière réponse de l’assistant comme une seule note vocale et supprime les envois répétés pour la même réponse ; `/tts chat on|off|default` contrôle le TTS automatique pour la discussion WhatsApp actuelle
    - la lecture des GIF animés est prise en charge via `gifPlayback: true` lors des envois vidéo
    - les légendes sont appliquées au premier élément multimédia lors de l’envoi de charges utiles de réponse multimédias, sauf pour les notes vocales PTT, qui envoient d’abord l’audio puis le texte visible séparément, car les clients WhatsApp n’affichent pas toujours les légendes de notes vocales
    - la source du média peut être HTTP(S), `file://` ou des chemins locaux

  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - plafond d’enregistrement des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - plafond d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont optimisées automatiquement (redimensionnement/balayage de qualité) pour respecter les limites
    - en cas d’échec d’envoi de média, le repli du premier élément envoie un avertissement textuel au lieu de supprimer silencieusement la réponse

  </Accordion>
</AccordionGroup>

## Citation des réponses

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez-la avec `channels.whatsapp.replyToMode`.

| Valeur      | Comportement                                                         |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Ne jamais citer ; envoyer comme un message simple                    |
| `"first"`   | Citer uniquement le premier fragment de réponse sortante             |
| `"all"`     | Citer chaque fragment de réponse sortante                            |
| `"batched"` | Citer les réponses groupées en file d’attente tout en laissant les réponses immédiates sans citation |

La valeur par défaut est `"off"`. Les remplacements par compte utilisent `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Niveau de réaction

`channels.whatsapp.reactionLevel` contrôle l’étendue de l’utilisation des réactions emoji par l’agent sur WhatsApp :

| Niveau        | Réactions d’accusé de réception | Réactions initiées par l’agent | Description                                                                 |
| ------------- | ------------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `"off"`       | Non                             | Non                            | Aucune réaction                                                             |
| `"ack"`       | Oui                             | Non                            | Réactions d’accusé de réception uniquement (accusé avant réponse)           |
| `"minimal"`   | Oui                             | Oui (conservateur)             | Accusé de réception + réactions de l’agent avec consignes conservatrices    |
| `"extensive"` | Oui                             | Oui (encouragé)                | Accusé de réception + réactions de l’agent avec consignes encourageantes    |

Par défaut : `"minimal"`.

Les remplacements par compte utilisent `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Réactions d’accusé de réception

WhatsApp prend en charge les réactions d’accusé de réception immédiates à la réception entrante via `channels.whatsapp.ackReaction`.
Les réactions d’accusé de réception sont contrôlées par `reactionLevel` — elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Notes de comportement :

- envoyées immédiatement après l’acceptation du message entrant (avant la réponse)
- les échecs sont journalisés, mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit sur les tours déclenchés par une mention ; l’activation de groupe `always` agit comme contournement pour cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Comptes multiples et identifiants

<AccordionGroup>
  <Accordion title="Sélection du compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon le premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche

  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité héritée">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’authentification par défaut héritée dans `~/.openclaw/credentials/` est encore reconnue/migrée pour les flux de compte par défaut

  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Lorsqu’un Gateway est joignable, la déconnexion arrête d’abord l’écouteur WhatsApp actif pour le compte sélectionné afin que la session liée ne continue pas à recevoir des messages jusqu’au prochain redémarrage. `openclaw channels remove --channel whatsapp` arrête également l’écouteur actif avant de désactiver ou de supprimer la configuration du compte.

    Dans les répertoires d’authentification hérités, `oauth.json` est préservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils d’agent inclut l’action de réaction WhatsApp (`react`).
- Garde-fous d’action :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivation via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : l’état du canal indique qu’il n’est pas lié.

    Correction :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Lié mais déconnecté / boucle de reconnexion">
    Symptôme : compte lié avec déconnexions répétées ou tentatives de reconnexion.

    Les comptes peu actifs peuvent rester connectés au-delà du délai normal des messages ; le chien de garde redémarre lorsque l’activité du transport WhatsApp Web s’arrête, que le socket se ferme ou que l’activité au niveau de l’application reste silencieuse au-delà de la fenêtre de sécurité plus longue.

    Si les journaux affichent des occurrences répétées de `status=408 Request Time-out Connection was lost`, ajustez les temporisations de socket Baileys sous `web.whatsapp`. Commencez par raccourcir `keepAliveIntervalMs` sous le délai d’inactivité de votre réseau et par augmenter `connectTimeoutMs` sur les liens lents ou avec pertes :

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Correction :

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` indique `Gateway inactive`, mais que `openclaw gateway status` et `openclaw channels status --probe` montrent que le Gateway et WhatsApp sont sains, exécutez `openclaw doctor`. Sous Linux, le diagnostic avertit au sujet d’entrées crontab héritées qui invoquent encore `~/.openclaw/bin/ensure-whatsapp.sh` ; supprimez ces entrées obsolètes avec `crontab -e`, car cron peut ne pas disposer de l’environnement du bus utilisateur systemd et faire en sorte que cet ancien script signale à tort l’état du Gateway.

    Si nécessaire, reliez avec `channels login`.

  </Accordion>

  <Accordion title="La connexion QR expire derrière un proxy">
    Symptôme : `openclaw channels login --channel whatsapp` échoue avant d’afficher un code QR utilisable avec `status=408 Request Time-out` ou une déconnexion de socket TLS.

    La connexion WhatsApp Web utilise l’environnement proxy standard de l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minuscules et `NO_PROXY`). Vérifiez que le processus Gateway hérite de l’environnement proxy et que `NO_PROXY` ne correspond pas à `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l’envoi">
    Les envois sortants échouent rapidement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que le Gateway est en cours d’exécution et que le compte est lié.

  </Accordion>

  <Accordion title="La réponse apparaît dans la transcription mais pas dans WhatsApp">
    Les lignes de transcription enregistrent ce que l’agent a généré. La livraison WhatsApp est vérifiée séparément : OpenClaw ne considère une réponse automatique comme envoyée qu’après que Baileys a renvoyé un identifiant de message sortant pour au moins un envoi de texte visible ou de média.

    Les réactions d’accusé de réception sont des accusés indépendants avant réponse. Une réaction réussie ne prouve pas que la réponse texte ou média ultérieure a été acceptée par WhatsApp.

    Consultez les journaux du Gateway pour `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d’autorisation `groups`
    - filtrage par mention (`requireMention` + modèles de mention)
    - clés en double dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, conservez donc un seul `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d’exécution Bun">
    L’environnement d’exécution du Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible avec un fonctionnement stable du Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge les prompts système de style Telegram pour les groupes et les discussions directes via les cartes `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La carte effective `groups` est déterminée en premier : si le compte définit ses propres `groups`, elle remplace entièrement la carte racine `groups` (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la carte unique résultante :

1. **Prompt système propre au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique existe dans la carte **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système générique de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est entièrement absente de la carte, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La carte effective `direct` est déterminée en premier : si le compte définit sa propre carte `direct`, elle remplace entièrement la carte racine `direct` (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la carte unique résultante :

1. **Invite système spécifique au direct** (`direct["<peerId>"].systemPrompt`) : utilisée lorsque l’entrée du pair spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucune invite système n’est appliquée.
2. **Invite système joker du direct** (`direct["*"].systemPrompt`) : utilisée lorsque l’entrée du pair spécifique est totalement absente de la map, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

<Note>
`dms` reste le bucket léger de remplacement d’historique par DM (`dms.<id>.historyLimit`). Les remplacements d’invites se trouvent sous `direct`.
</Note>

**Différence avec le comportement multi-compte de Telegram :** Dans Telegram, `groups` à la racine est volontairement supprimé pour tous les comptes dans une configuration multi-compte, même les comptes qui ne définissent pas leurs propres `groups`, afin d’empêcher un bot de recevoir des messages de groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : `groups` et `direct` à la racine sont toujours hérités par les comptes qui ne définissent aucun remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-compte, si vous voulez des invites de groupe ou de direct par compte, définissez explicitement la map complète sous chaque compte plutôt que de vous appuyer sur les valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une map de configuration par groupe et la liste d’autorisation des groupes au niveau du chat. À la racine comme au niveau du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- N’ajoutez un `systemPrompt` de groupe joker que si vous voulez déjà que cette portée admette tous les groupes. Si vous voulez toujours que seul un ensemble fixe d’ID de groupes soit éligible, n’utilisez pas `groups["*"]` comme valeur par défaut de l’invite. Répétez plutôt l’invite sur chaque entrée de groupe explicitement autorisée.
- L’admission des groupes et l’autorisation des expéditeurs sont deux vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes pouvant atteindre le traitement des groupes, mais n’autorise pas à lui seul chaque expéditeur dans ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet secondaire pour les DM. `direct["*"]` fournit seulement une configuration de chat direct par défaut après qu’un DM a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du stockage d’appairage.

Exemple :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Pointeurs de référence de configuration

Référence principale :

- [Référence de configuration - WhatsApp](/fr/gateway/config-channels#whatsapp)

Champs WhatsApp à fort signal :

- accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-compte : `accounts.<id>.enabled`, `accounts.<id>.authDir`, remplacements au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- invites : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Connexe

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
