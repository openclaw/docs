---
read_when:
    - Travailler sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T07:15:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Statut : prêt pour la production via WhatsApp Web (Baileys). Le Gateway possède les sessions associées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le Plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose aussi le flux d’installation lorsque
  le Plugin n’est pas encore présent.
- Canal de développement + checkout git : utilise par défaut le chemin du Plugin local.
- Stable/Beta : utilise le package npm `@openclaw/whatsapp` lorsqu’un package actuel
  est publié.

L’installation manuelle reste disponible :

```bash
openclaw plugins install @openclaw/whatsapp
```

Si npm signale que le package détenu par OpenClaw est obsolète ou manquant, utilisez une
build OpenClaw packagée actuelle ou un checkout local jusqu’à ce que le train de packages npm
soit à jour.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de DM par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et guides de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration de canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Configurer la politique d’accès WhatsApp">

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

  <Step title="Associer WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour attacher un répertoire d’authentification WhatsApp Web existant/personnalisé avant la connexion :

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Démarrer le Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approuver la première demande d’appairage (si le mode d’appairage est utilisé)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d’appairage expirent après 1 heure. Les demandes en attente sont limitées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d’exécuter WhatsApp sur un numéro distinct lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    C’est le mode opérationnel le plus propre :

    - identité WhatsApp distincte pour OpenClaw
    - listes d’autorisation de DM et limites de routage plus claires
    - risque réduit de confusion avec les conversations à soi-même

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

  <Accordion title="Solution de repli avec numéro personnel">
    L’onboarding prend en charge le mode avec numéro personnel et écrit une base compatible avec les conversations à soi-même :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections de conversation à soi-même s’appuient sur le numéro associé et `allowFrom`.

  </Accordion>

  <Accordion title="Portée du canal WhatsApp Web uniquement">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie WhatsApp Twilio séparé dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- Le Gateway possède le socket WhatsApp et la boucle de reconnexion.
- Le chien de garde de reconnexion utilise l’activité du transport WhatsApp Web, et pas seulement le volume des messages applicatifs entrants ; une session d’appareil associé silencieuse n’est donc pas redémarrée uniquement parce que personne n’a envoyé de message récemment. Un plafond plus long de silence applicatif force toujours une reconnexion si les trames de transport continuent d’arriver mais qu’aucun message applicatif n’est traité pendant la fenêtre du chien de garde ; après une reconnexion transitoire pour une session récemment active, cette vérification de silence applicatif utilise le délai d’expiration normal des messages pour la première fenêtre de récupération.
- Les temporisations du socket Baileys sont explicites sous `web.whatsapp.*` : `keepAliveIntervalMs` contrôle les pings applicatifs WhatsApp Web, `connectTimeoutMs` contrôle le délai d’expiration de la poignée de main d’ouverture, et `defaultQueryTimeoutMs` contrôle les délais d’expiration des requêtes Baileys.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les chats de statut et de diffusion sont ignorés (`@status`, `@broadcast`).
- Le chien de garde de reconnexion suit l’activité du transport WhatsApp Web, et pas seulement le volume des messages applicatifs entrants : les sessions d’appareils associés silencieuses restent actives tant que les trames de transport continuent, mais un blocage du transport force une reconnexion bien avant le chemin ultérieur de déconnexion distante.
- Les chats directs utilisent les règles de session DM (`session.dmScope` ; la valeur par défaut `main` regroupe les DM dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Le transport WhatsApp Web respecte les variables d’environnement de proxy standard sur l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez la configuration de proxy au niveau de l’hôte aux paramètres de proxy WhatsApp propres au canal.
- Lorsque `messages.removeAckAfterReply` est activé, OpenClaw efface la réaction d’accusé de réception WhatsApp après la livraison d’une réponse visible.

## Hooks de Plugin et confidentialité

Les messages entrants WhatsApp peuvent contenir du contenu de messages personnels, des numéros de téléphone,
des identifiants de groupe, des noms d’expéditeurs et des champs de corrélation de session. Pour cette raison,
WhatsApp ne diffuse pas les charges utiles du hook entrant `message_received` aux plugins
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

Vous pouvez limiter l’activation à un compte :

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

Activez ceci uniquement pour les plugins auxquels vous faites confiance pour recevoir le contenu
et les identifiants des messages entrants WhatsApp.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux chats directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte les numéros de style E.164 (normalisés en interne).

    Remplacement multicomptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) prend le pas sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les appairages sont persistés dans le magasin d’autorisations du canal et fusionnés avec `allowFrom` configuré
    - si aucune liste d’autorisation n’est configurée, le numéro associé est autorisé par défaut
    - OpenClaw n’appaire jamais automatiquement les DM sortants `fromMe` (messages que vous vous envoyez depuis l’appareil associé)

  </Tab>

  <Tab title="Politique de groupe + listes d’autorisation">
    L’accès aux groupes comporte deux couches :

    1. **Liste d’autorisation d’appartenance au groupe** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont éligibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupes (`"*"` autorisé)

    2. **Politique des expéditeurs de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : liste d’autorisation des expéditeurs contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque toutes les entrées de groupe

    Repli de la liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution se rabat sur `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation d’expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe, le repli de politique de groupe à l’exécution est `allowlist` (avec un journal d’avertissement), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe nécessitent une mention par défaut.

    La détection des mentions inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - les transcriptions de notes vocales entrantes pour les messages de groupe autorisés
    - la détection implicite de réponse au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Note de sécurité :

    - la citation/réponse satisfait uniquement le filtrage par mention ; elle n’accorde **pas** d’autorisation à l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs absents de la liste d’autorisation restent bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de la session (pas la configuration globale). Elle est soumise au contrôle du propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et conversation à soi-même

Lorsque le numéro associé est également présent dans `allowFrom`, les protections WhatsApp de conversation à soi-même s’activent :

- ignorer les accusés de lecture pour les tours de conversation à soi-même
- ignorer le comportement de déclenchement automatique par JID de mention qui vous pinguerait autrement
- si `messages.responsePrefix` n’est pas défini, les réponses de conversation à soi-même utilisent par défaut `[{identity.name}]` ou `[openclaw]`

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Enveloppe entrante + contexte de réponse">
    Les messages WhatsApp entrants sont encapsulés dans l’enveloppe entrante partagée.

    Si une réponse citée existe, le contexte est ajouté sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les champs de métadonnées de réponse sont également renseignés lorsqu’ils sont disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 de l’expéditeur).

  </Accordion>

  <Accordion title="Espaces réservés de médias et extraction de localisation/contact">
    Les messages entrants contenant uniquement des médias sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les notes vocales de groupe autorisées sont transcrites avant le filtrage par mention lorsque le
    corps est seulement `<media:audio>`, de sorte que prononcer la mention du bot dans la note vocale peut
    déclencher la réponse. Si la transcription ne mentionne toujours pas le bot, la
    transcription est conservée dans l’historique de groupe en attente plutôt que l’espace réservé brut.

    Les corps de localisation utilisent un texte de coordonnées concis. Les libellés/commentaires de localisation et les détails de contact/vCard sont rendus comme des métadonnées non fiables encadrées, et non comme du texte de prompt en ligne.

  </Accordion>

  <Accordion title="Injection de l’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en tampon et injectés comme contexte lorsque le bot est finalement déclenché.

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

    Les tours de conversation à soi-même ignorent les accusés de lecture même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, découpage et médias

<AccordionGroup>
  <Accordion title="Découpage du texte">
    - limite de segment par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphes (lignes vides), puis se rabat sur un découpage sûr en longueur

  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles image, vidéo, audio (note vocale PTT) et document
    - le média audio est envoyé via la charge utile `audio` de Baileys avec `ptt: true`, de sorte que les clients WhatsApp l’affichent comme une note vocale push-to-talk
    - les charges utiles de réponse préservent `audioAsVoice` ; la sortie de note vocale TTS pour WhatsApp reste sur ce chemin PTT même lorsque le fournisseur renvoie du MP3 ou du WebM
    - l’audio Ogg/Opus natif est envoyé en tant que `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - l’audio non Ogg, y compris la sortie MP3/WebM du TTS Microsoft Edge, est transcodé avec `ffmpeg` en Ogg/Opus mono 48 kHz avant la livraison PTT
    - `/tts latest` envoie la dernière réponse de l’assistant sous forme d’une note vocale et supprime les envois répétés pour la même réponse ; `/tts chat on|off|default` contrôle le TTS automatique pour la discussion WhatsApp actuelle
    - la lecture des GIF animés est prise en charge via `gifPlayback: true` sur les envois vidéo
    - les légendes sont appliquées au premier média lors de l’envoi de charges utiles de réponse multimédia, sauf que les notes vocales PTT envoient l’audio d’abord et le texte visible séparément, car les clients WhatsApp n’affichent pas les légendes de notes vocales de manière cohérente
    - la source du média peut être HTTP(S), `file://` ou des chemins locaux

  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - limite d’enregistrement des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - limite d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement/balayage de qualité) pour respecter les limites
    - en cas d’échec d’envoi de média, le repli du premier élément envoie un avertissement textuel au lieu d’abandonner silencieusement la réponse

  </Accordion>
</AccordionGroup>

## Citation des réponses

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez-la avec `channels.whatsapp.replyToMode`.

| Valeur      | Comportement                                                         |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Ne jamais citer ; envoyer comme message simple                       |
| `"first"`   | Citer uniquement le premier fragment de réponse sortante             |
| `"all"`     | Citer chaque fragment de réponse sortante                            |
| `"batched"` | Citer les réponses groupées en file d’attente tout en laissant les réponses immédiates non citées |

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

| Niveau        | Réactions d’accusé | Réactions initiées par l’agent | Description                                                |
| ------------- | ------------------ | ------------------------------ | ---------------------------------------------------------- |
| `"off"`       | Non                | Non                            | Aucune réaction                                            |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (réception avant réponse)    |
| `"minimal"`   | Oui                | Oui (conservateur)             | Accusé + réactions de l’agent avec consignes conservatrices |
| `"extensive"` | Oui                | Oui (encouragé)                | Accusé + réactions de l’agent avec consignes encouragées   |

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

## Réactions d’accusé

WhatsApp prend en charge les réactions d’accusé immédiates à la réception entrante via `channels.whatsapp.ackReaction`.
Les réactions d’accusé sont contrôlées par `reactionLevel` : elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

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

- envoyées immédiatement après l’acceptation de l’entrant (avant réponse)
- les échecs sont journalisés mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit aux tours déclenchés par une mention ; l’activation de groupe `always` agit comme contournement pour cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Comptes multiples et identifiants

<AccordionGroup>
  <Accordion title="Sélection du compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon le premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche

  </Accordion>

  <Accordion title="Chemins d’identifiants et compatibilité héritée">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’authentification par défaut héritée dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux de compte par défaut

  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Dans les répertoires d’authentification hérités, `oauth.json` est conservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils de l’agent inclut l’action de réaction WhatsApp (`react`).
- Barrières d’action :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivez via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : l’état du canal indique qu’il n’est pas lié.

    Correctif :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Lié mais déconnecté / boucle de reconnexion">
    Symptôme : compte lié avec déconnexions répétées ou tentatives de reconnexion.

    Les comptes silencieux peuvent rester connectés au-delà du délai normal des messages ; le watchdog
    redémarre lorsque l’activité du transport WhatsApp Web s’arrête, que le socket se ferme ou que
    l’activité au niveau application reste silencieuse au-delà de la fenêtre de sécurité plus longue.

    Si les journaux affichent à plusieurs reprises `status=408 Request Time-out Connection was lost`, ajustez
    les temporisations du socket Baileys sous `web.whatsapp`. Commencez par raccourcir
    `keepAliveIntervalMs` sous le délai d’inactivité de votre réseau et par augmenter
    `connectTimeoutMs` sur les liens lents ou avec pertes :

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

    Correctif :

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si nécessaire, reliez avec `channels login`.

  </Accordion>

  <Accordion title="La connexion QR expire derrière un proxy">
    Symptôme : `openclaw channels login --channel whatsapp` échoue avant d’afficher un code QR utilisable avec `status=408 Request Time-out` ou une déconnexion du socket TLS.

    La connexion WhatsApp Web utilise l’environnement de proxy standard de l’hôte Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minuscules et `NO_PROXY`). Vérifiez que le processus Gateway hérite de l’environnement de proxy et que `NO_PROXY` ne correspond pas à `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l’envoi">
    Les envois sortants échouent rapidement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que Gateway est en cours d’exécution et que le compte est lié.

  </Accordion>

  <Accordion title="La réponse apparaît dans la transcription mais pas dans WhatsApp">
    Les lignes de transcription enregistrent ce que l’agent a généré. La livraison WhatsApp est vérifiée séparément : OpenClaw ne considère une réponse automatique comme envoyée qu’après que Baileys renvoie un identifiant de message sortant pour au moins un envoi de texte visible ou de média.

    Les réactions d’accusé sont des réceptions indépendantes avant réponse. Une réaction réussie ne prouve pas que la réponse textuelle ou média ultérieure a été acceptée par WhatsApp.

    Vérifiez les journaux Gateway pour `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d’autorisation `groups`
    - contrôle par mention (`requireMention` + motifs de mention)
    - clés dupliquées dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, donc conservez un seul `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d’exécution Bun">
    Le runtime Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible avec le fonctionnement stable de Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge les prompts système de style Telegram pour les groupes et les discussions directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map `groups` effective est déterminée en premier : si le compte définit ses propres `groups`, elle remplace entièrement la map `groups` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système générique de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est entièrement absente de la map, ou lorsqu’elle existe mais ne définit pas de clé `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map `direct` effective est déterminée en premier : si le compte définit son propre `direct`, elle remplace entièrement la map `direct` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au direct** (`direct["<peerId>"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système générique direct** (`direct["*"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique est entièrement absente de la map, ou lorsqu’elle existe mais ne définit pas de clé `systemPrompt`.

<Note>
`dms` reste le compartiment léger de remplacement de l’historique par DM (`dms.<id>.historyLimit`). Les remplacements de prompt se trouvent sous `direct`.
</Note>

**Différence par rapport au comportement multi-compte de Telegram :** Dans Telegram, `groups` racine est intentionnellement supprimé pour tous les comptes dans une configuration multi-compte — même les comptes qui ne définissent pas leurs propres `groups` — afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : `groups` racine et `direct` racine sont toujours hérités par les comptes qui ne définissent pas de remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-compte, si vous voulez des prompts de groupe ou directs par compte, définissez explicitement la map complète sous chaque compte au lieu de vous appuyer sur les valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une carte de configuration par groupe et la liste d’autorisation des groupes au niveau de la conversation. Au niveau racine ou au niveau du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- N’ajoutez un groupe générique `systemPrompt` que lorsque vous voulez déjà que cette portée admette tous les groupes. Si vous voulez toujours que seul un ensemble fixe d’ID de groupe soit éligible, n’utilisez pas `groups["*"]` pour la valeur par défaut du prompt. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L’admission des groupes et l’autorisation des expéditeurs sont des vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes qui peuvent atteindre la gestion des groupes, mais n’autorise pas à lui seul chaque expéditeur dans ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet de bord pour les messages directs. `direct["*"]` fournit uniquement une configuration de conversation directe par défaut après qu’un message direct a déjà été admis par `dmPolicy` plus `allowFrom` ou par les règles du stockage d’association.

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

Champs WhatsApp à signal fort :

- accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- comptes multiples : `accounts.<id>.enabled`, `accounts.<id>.authDir`, substitutions au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Associé

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
