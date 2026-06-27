---
read_when:
    - Travail sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:13:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Statut : prêt pour la production via WhatsApp Web (Baileys). Le Gateway possède les session(s) liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le Plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose aussi le flux d’installation lorsque
  le Plugin n’est pas encore présent.
- Canal de développement + checkout git : utilise par défaut le chemin du Plugin local.
- Stable/Bêta : installe d’abord le Plugin officiel `@openclaw/whatsapp` depuis ClawHub,
  avec npm comme solution de repli.
- Le runtime WhatsApp est distribué en dehors du paquet npm principal d’OpenClaw afin que
  les dépendances de runtime propres à WhatsApp restent avec le Plugin externe.

L’installation manuelle reste disponible :

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Utilisez le paquet npm brut (`@openclaw/whatsapp`) uniquement lorsque vous avez besoin de la solution
de repli du registre. Épinglez une version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    La stratégie de DM par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics et guides de réparation inter-canaux.
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

    La connexion actuelle repose sur un QR code. Dans les environnements distants ou sans interface,
    assurez-vous de disposer d’un moyen fiable pour transmettre le QR code actif au téléphone qui le scannera
    avant de démarrer la connexion.

    Pour un compte précis :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour attacher un répertoire d’authentification WhatsApp Web existant/personnalisé avant la connexion :

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
OpenClaw recommande d’exécuter WhatsApp sur un numéro distinct lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont aussi prises en charge.)
</Note>

<Warning>
Le flux de configuration WhatsApp actuel fonctionne uniquement avec QR code. Les QR codes rendus dans le terminal, les captures d’écran,
les PDF ou les pièces jointes de chat peuvent expirer ou devenir illisibles pendant leur relais
depuis une machine distante. Pour les hôtes distants/sans interface, préférez un chemin de transmission directe de l’image QR
à une capture manuelle du terminal.
</Warning>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    C’est le mode opérationnel le plus propre :

    - identité WhatsApp distincte pour OpenClaw
    - listes d’autorisation de DM et limites de routage plus claires
    - risque réduit de confusion avec les conversations avec soi-même

    Modèle de stratégie minimal :

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
    L’onboarding prend en charge le mode avec numéro personnel et écrit une base compatible avec les conversations avec soi-même :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    Au runtime, les protections des conversations avec soi-même reposent sur le numéro propre lié et `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie Twilio WhatsApp distinct dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle de runtime

- Le Gateway possède le socket WhatsApp et la boucle de reconnexion.
- Le watchdog de reconnexion utilise l’activité du transport WhatsApp Web, pas seulement le volume de messages applicatifs entrants, donc une session d’appareil lié silencieuse n’est pas redémarrée uniquement parce que personne n’a envoyé de message récemment. Un plafond plus long de silence applicatif force quand même une reconnexion si des trames de transport continuent d’arriver mais qu’aucun message applicatif n’est traité pendant la fenêtre du watchdog ; après une reconnexion transitoire pour une session récemment active, cette vérification de silence applicatif utilise le délai d’expiration normal des messages pour la première fenêtre de récupération.
- Les temporisations du socket Baileys sont explicites sous `web.whatsapp.*` : `keepAliveIntervalMs` contrôle les pings applicatifs WhatsApp Web, `connectTimeoutMs` contrôle le délai d’expiration de la poignée de main d’ouverture, et `defaultQueryTimeoutMs` contrôle les attentes de requête Baileys ainsi que les bornes des opérations locales d’envoi/présence sortantes et d’accusé de lecture entrant d’OpenClaw.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les envois de groupe attachent des métadonnées natives de mention pour les jetons `@+<digits>` et `@<digits>` dans le texte et les légendes de médias lorsque le jeton correspond aux métadonnées actuelles des participants WhatsApp, y compris les groupes adossés à LID.
- Les chats de statut et de diffusion sont ignorés (`@status`, `@broadcast`).
- Le watchdog de reconnexion suit l’activité du transport WhatsApp Web, pas seulement le volume de messages applicatifs entrants : les sessions d’appareil lié silencieuses restent actives tant que les trames de transport continuent, mais un blocage du transport force une reconnexion bien avant le chemin ultérieur de déconnexion distante.
- Les chats directs utilisent les règles de session DM (`session.dmScope` ; la valeur par défaut `main` regroupe les DM dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Les Canaux/Newsletters WhatsApp peuvent être des cibles sortantes explicites avec leur JID natif `@newsletter`. Les envois sortants de newsletter utilisent les métadonnées de session de canal (`agent:<agentId>:whatsapp:channel:<jid>`) plutôt que la sémantique de session DM.
- Le transport WhatsApp Web respecte les variables d’environnement standard de proxy sur l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez une configuration de proxy au niveau de l’hôte aux paramètres de proxy WhatsApp propres au canal.
- Lorsque `messages.removeAckAfterReply` est activé, OpenClaw efface la réaction d’accusé WhatsApp après la livraison d’une réponse visible.

## Invites d’approbation

WhatsApp peut afficher les invites d’approbation d’exec et de Plugin avec les réactions `👍` / `👎`. La livraison est
contrôlée par la configuration de transfert des approbations de premier niveau :

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` et `approvals.plugin` sont indépendants. Activer WhatsApp comme canal ne fait que lier
le transport ; cela n’envoie pas d’invites d’approbation sauf si la famille d’approbation correspondante est activée
et route vers WhatsApp. Le mode session livre les approbations par emoji natifs uniquement pour les approbations qui
proviennent de WhatsApp. Le mode cible utilise le pipeline de transfert partagé pour les cibles WhatsApp explicites
et ne crée pas de diffusion distincte vers des DM d’approbateurs.

Les réactions d’approbation WhatsApp nécessitent des approbateurs WhatsApp explicites depuis `allowFrom` ou `"*"`.
`defaultTo` contrôle les cibles de message par défaut ordinaires ; ce n’est pas un approbateur d’approbation. Les commandes
`/approve` manuelles passent toujours par le chemin normal d’autorisation de l’expéditeur WhatsApp avant la
résolution de l’approbation.

## Hooks de Plugin et confidentialité

Les messages entrants WhatsApp peuvent contenir du contenu de message personnel, des numéros de téléphone,
des identifiants de groupe, des noms d’expéditeur et des champs de corrélation de session. Pour cette raison,
WhatsApp ne diffuse pas les charges utiles de hook `message_received` entrant aux Plugins
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

N’activez cela que pour les Plugins auxquels vous faites confiance pour recevoir le contenu
et les identifiants des messages WhatsApp entrants.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux chats directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte les numéros de style E.164 (normalisés en interne).

    `allowFrom` est une liste de contrôle d’accès pour les expéditeurs de DM. Elle ne filtre pas les envois sortants explicites vers les JID de groupe WhatsApp ni les JID de canal `@newsletter`.

    Remplacement multi-compte : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) ont priorité sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement au runtime :

    - les appairages sont persistés dans le magasin d’autorisations du canal et fusionnés avec `allowFrom` configuré
    - l’automatisation planifiée et le repli des destinataires de Heartbeat utilisent des cibles de livraison explicites ou `allowFrom` configuré ; les approbations d’appairage DM ne sont pas des destinataires implicites de Cron ou Heartbeat
    - si aucune liste d’autorisation n’est configurée, le numéro propre lié est autorisé par défaut
    - OpenClaw n’appaire jamais automatiquement les DM sortants `fromMe` (messages que vous vous envoyez à vous-même depuis l’appareil lié)

  </Tab>

  <Tab title="Group policy + allowlists">
    L’accès aux groupes comporte deux couches :

    1. **Liste d’autorisation d’appartenance aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont éligibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupes (`"*"` autorisé)

    2. **Stratégie d’expéditeur de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : liste d’autorisation des expéditeurs contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque toutes les entrées de groupe

    Repli de liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, le runtime se replie sur `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation d’expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe, le repli de stratégie de groupe au runtime est `allowlist` (avec un journal d’avertissement), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe nécessitent une mention par défaut.

    La détection de mention inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les modèles regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - les transcriptions de notes vocales entrantes pour les messages de groupe autorisés
    - la détection implicite de réponse au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Note de sécurité :

    - la citation/réponse satisfait uniquement le filtrage par mention ; elle **n’accorde pas** l’autorisation de l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs non autorisés restent bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de session (pas la configuration globale). Elle est contrôlée par le propriétaire.

  </Tab>
</Tabs>

## Liaisons ACP configurées

WhatsApp prend en charge les liaisons ACP persistantes avec des entrées `bindings[]` de premier niveau :

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Les discussions directes correspondent à des numéros E.164 tels que `+15555550123`.
- Les groupes correspondent à des JID de groupe WhatsApp tels que `120363424282127706@g.us`.
- Les listes d’autorisation de groupes, la politique d’expéditeur et le verrouillage par mention ou activation s’exécutent avant qu’OpenClaw vérifie que la session ACP configurée existe.
- Une liaison ACP configurée correspondante possède la route. Les groupes de diffusion WhatsApp ne diffusent pas ce tour aux sessions WhatsApp ordinaires.

## Comportement des numéros personnels et des auto-discussions

Lorsque le numéro personnel lié est aussi présent dans `allowFrom`, les protections d’auto-discussion WhatsApp s’activent :

- ignorer les accusés de lecture pour les tours d’auto-discussion
- ignorer le comportement de déclenchement automatique par JID de mention qui vous notifierait autrement vous-même
- si `messages.responsePrefix` n’est pas défini, les réponses d’auto-discussion utilisent par défaut `[{identity.name}]` ou `[openclaw]`

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
    Lorsque la cible de réponse citée est un média téléchargeable, OpenClaw l’enregistre via
    le stockage média entrant normal et l’expose comme `MediaPath`/`MediaType` afin que
    l’agent puisse inspecter l’image référencée au lieu de voir uniquement
    `<media:image>`.

  </Accordion>

  <Accordion title="Espaces réservés de média et extraction de lieu/contact">
    Les messages entrants contenant uniquement des médias sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les notes vocales de groupe autorisées sont transcrites avant le verrouillage par mention lorsque le
    corps contient seulement `<media:audio>`, de sorte que dire la mention du bot dans la note vocale peut
    déclencher la réponse. Si la transcription ne mentionne toujours pas le bot, la
    transcription est conservée dans l’historique de groupe en attente au lieu de l’espace réservé brut.

    Les corps de lieu utilisent un texte de coordonnées concis. Les étiquettes/commentaires de lieu et les détails de contact/vCard sont rendus comme des métadonnées non fiables clôturées, et non comme du texte de prompt en ligne.

  </Accordion>

  <Accordion title="Injection d’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est finalement déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - solution de repli : `messages.groupChat.historyLimit`
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

    Les tours d’auto-discussion ignorent les accusés de lecture même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, découpage et médias

<AccordionGroup>
  <Accordion title="Découpage du texte">
    - limite de segment par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis revient à un découpage sûr selon la longueur

  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles image, vidéo, audio (note vocale PTT) et document
    - le média audio est envoyé via la charge utile Baileys `audio` avec `ptt: true`, afin que les clients WhatsApp l’affichent comme une note vocale push-to-talk
    - les charges utiles de réponse préservent `audioAsVoice` ; la sortie de note vocale TTS pour WhatsApp reste sur ce chemin PTT même lorsque le fournisseur renvoie du MP3 ou du WebM
    - l’audio Ogg/Opus natif est envoyé comme `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - l’audio non Ogg, y compris la sortie MP3/WebM de Microsoft Edge TTS, est transcodé avec `ffmpeg` en Ogg/Opus mono 48 kHz avant la livraison PTT
    - `/tts latest` envoie la dernière réponse de l’assistant comme une seule note vocale et supprime les envois répétés pour la même réponse ; `/tts chat on|off|default` contrôle le TTS automatique pour la discussion WhatsApp actuelle
    - la lecture des GIF animés est prise en charge via `gifPlayback: true` sur les envois vidéo
    - `forceDocument` / `asDocument` envoie les images, GIF et vidéos sortants via la charge utile document Baileys pour éviter la compression média de WhatsApp tout en préservant le nom de fichier résolu et le type MIME
    - les légendes sont appliquées au premier élément média lors de l’envoi de charges utiles de réponse multimédia, sauf que les notes vocales PTT envoient l’audio d’abord et le texte visible séparément, car les clients WhatsApp n’affichent pas systématiquement les légendes de notes vocales
    - la source média peut être HTTP(S), `file://` ou des chemins locaux

  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - plafond d’enregistrement des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - plafond d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont auto-optimisées (balayage redimensionnement/qualité) pour respecter les limites, sauf si `forceDocument` / `asDocument` demande une livraison comme document
    - en cas d’échec d’envoi de média, le repli du premier élément envoie un avertissement texte au lieu de supprimer silencieusement la réponse

  </Accordion>
</AccordionGroup>

## Citation de réponse

WhatsApp prend en charge la citation native de réponse, où les réponses sortantes citent visiblement le message entrant. Contrôlez-la avec `channels.whatsapp.replyToMode`.

| Valeur      | Comportement                                                          |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ne jamais citer ; envoyer comme message simple                        |
| `"first"`   | Citer uniquement le premier segment de réponse sortante               |
| `"all"`     | Citer chaque segment de réponse sortante                              |
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

`channels.whatsapp.reactionLevel` contrôle l’étendue avec laquelle l’agent utilise les réactions emoji sur WhatsApp :

| Niveau        | Réactions d’accusé | Réactions initiées par l’agent | Description                                      |
| ------------- | ------------------ | ------------------------------ | ------------------------------------------------ |
| `"off"`       | Non                | Non                            | Aucune réaction                                  |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (réception avant réponse) |
| `"minimal"`   | Oui                | Oui (conservateur)             | Accusé + réactions de l’agent avec consignes conservatrices |
| `"extensive"` | Oui                | Oui (encouragé)                | Accusé + réactions de l’agent avec consignes encouragées |

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

WhatsApp prend en charge les réactions d’accusé immédiates à la réception entrante via `channels.whatsapp.ackReaction`.
Les réactions d’accusé sont verrouillées par `reactionLevel` — elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

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

- envoyée immédiatement après l’acceptation de l’entrée (avant réponse)
- si `ackReaction` est présent sans `emoji`, WhatsApp utilise l’emoji d’identité de l’agent routé, avec repli sur "👀" ; omettez `ackReaction` ou définissez `emoji: ""` pour n’envoyer aucune réaction d’accusé
- les échecs sont journalisés mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit sur les tours déclenchés par mention ; l’activation de groupe `always` sert de contournement pour cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Réactions d’état du cycle de vie

Définissez `messages.statusReactions.enabled: true` pour permettre à WhatsApp de remplacer la réaction d’accusé pendant un tour au lieu de laisser un emoji de réception statique. Lorsqu’elles sont activées, OpenClaw utilise le même emplacement de réaction du message entrant pour les états du cycle de vie tels que mis en file d’attente, réflexion, activité d’outil, Compaction, terminé et erreur.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Notes de comportement :

- `channels.whatsapp.ackReaction` contrôle toujours si les réactions d’état sont éligibles pour les messages directs et les groupes.
- La réaction d’état en file d’attente utilise le même emoji d’accusé effectif que les réactions d’accusé simples.
- WhatsApp dispose d’un seul emplacement de réaction de bot par message, donc les mises à jour du cycle de vie remplacent la réaction actuelle sur place.
- `messages.removeAckAfterReply: true` efface la réaction d’état finale après la durée de conservation done/error configurée.
- Les catégories d’emoji d’outil incluent `tool`, `coding`, `web`, `deploy`, `build` et `concierge`.

## Comptes multiples et identifiants

<AccordionGroup>
  <Accordion title="Sélection de compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection de compte par défaut : `default` si présent, sinon le premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche

  </Accordion>

  <Accordion title="Chemins d’identifiants et compatibilité héritée">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’authentification par défaut héritée dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux de compte par défaut

  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Lorsqu’un Gateway est joignable, la déconnexion arrête d’abord l’écouteur WhatsApp actif pour le compte sélectionné afin que la session liée ne continue pas à recevoir des messages jusqu’au prochain redémarrage. `openclaw channels remove --channel whatsapp` arrête aussi l’écouteur actif avant de désactiver ou de supprimer la configuration du compte.

    Dans les répertoires d’authentification hérités, `oauth.json` est préservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils de l’agent inclut l’action de réaction WhatsApp (`react`).
- Verrous d’action :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactiver via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : l’état du canal indique non lié.

    Correction :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Lié mais déconnecté / boucle de reconnexion">
    Symptôme : compte lié avec déconnexions répétées ou tentatives de reconnexion.

    Les comptes silencieux peuvent rester connectés au-delà du délai normal des messages ; le chien de garde
    redémarre lorsque l’activité de transport de WhatsApp Web s’arrête, que le socket se ferme ou que
    l’activité au niveau applicatif reste silencieuse au-delà de la fenêtre de sécurité plus longue.

    Si les journaux affichent de façon répétée `status=408 Request Time-out Connection was lost`, ajustez
    les délais de socket Baileys sous `web.whatsapp`. Commencez par réduire
    `keepAliveIntervalMs` sous le délai d’inactivité de votre réseau et par augmenter
    `connectTimeoutMs` sur les liens lents ou avec perte :

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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Si la boucle persiste après la correction de la connectivité de l’hôte et des délais, sauvegardez
    le répertoire d’authentification du compte et associez de nouveau ce compte :

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` indique `Gateway inactive`, mais que
    `openclaw gateway status` et `openclaw channels status --probe` indiquent que le
    Gateway et WhatsApp sont sains, exécutez `openclaw doctor`. Sous Linux, doctor
    avertit de la présence d’anciennes entrées crontab qui invoquent encore
    `~/.openclaw/bin/ensure-whatsapp.sh`; supprimez ces entrées obsolètes avec
    `crontab -e`, car cron peut ne pas disposer de l’environnement du bus utilisateur systemd et
    faire en sorte que cet ancien script signale à tort l’état du Gateway.

    Si nécessaire, associez de nouveau avec `channels login`.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    Symptôme : `openclaw channels login --channel whatsapp` échoue avant d’afficher un QR code utilisable avec `status=408 Request Time-out` ou une déconnexion de socket TLS.

    La connexion à WhatsApp Web utilise l’environnement proxy standard de l’hôte Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minuscules, et `NO_PROXY`). Vérifiez que le processus Gateway hérite de l’environnement proxy et que `NO_PROXY` ne correspond pas à `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Les envois sortants échouent rapidement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que le Gateway est en cours d’exécution et que le compte est associé.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Les lignes de transcription enregistrent ce que l’agent a généré. La livraison WhatsApp est vérifiée séparément : OpenClaw considère une réponse automatique comme envoyée uniquement après que Baileys a renvoyé un identifiant de message sortant pour au moins un envoi visible de texte ou de média.

    Les réactions d’accusé de réception sont des reçus indépendants préalables à la réponse. Une réaction réussie ne prouve pas que la réponse ultérieure en texte ou média a été acceptée par WhatsApp.

    Vérifiez les journaux du Gateway pour `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d’autorisation `groups`
    - filtrage par mention (`requireMention` + motifs de mention)
    - clés en double dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, conservez donc un seul `groupPolicy` par portée

    Si `channels.whatsapp.groups` est présent, WhatsApp peut toujours observer les messages d’autres groupes, mais OpenClaw les abandonne avant le routage de session. Ajoutez le JID du groupe à `channels.whatsapp.groups` ou ajoutez `groups["*"]` pour admettre tous les groupes tout en conservant l’autorisation des expéditeurs sous `groupPolicy` et `groupAllowFrom`.

  </Accordion>

  <Accordion title="Bun runtime warning">
    Le runtime Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible avec un fonctionnement stable du Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge les prompts système de style Telegram pour les groupes et les discussions directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map `groups` effective est déterminée d’abord : si le compte définit ses propres `groups`, elle remplace entièrement la map `groups` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système propre au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système générique de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est entièrement absente de la map, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map `direct` effective est déterminée d’abord : si le compte définit son propre `direct`, elle remplace entièrement la map `direct` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système propre au message direct** (`direct["<peerId>"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système générique direct** (`direct["*"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique est entièrement absente de la map, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

<Note>
`dms` reste le conteneur léger de remplacement d’historique par DM (`dms.<id>.historyLimit`). Les remplacements de prompt se trouvent sous `direct`.
</Note>

**Différence avec le comportement multi-compte de Telegram :** Dans Telegram, `groups` racine est intentionnellement supprimé pour tous les comptes dans une configuration multi-compte, même les comptes qui ne définissent aucun `groups` propre, afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : `groups` racine et `direct` racine sont toujours hérités par les comptes qui ne définissent aucun remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-compte, si vous voulez des prompts de groupe ou directs par compte, définissez explicitement la map complète sous chaque compte au lieu de vous appuyer sur les valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une map de configuration par groupe et la liste d’autorisation des groupes au niveau discussion. À la portée racine ou compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- N’ajoutez un `systemPrompt` de groupe générique que lorsque vous voulez déjà que cette portée admette tous les groupes. Si vous voulez toujours que seul un ensemble fixe d’identifiants de groupe soit éligible, n’utilisez pas `groups["*"]` comme valeur par défaut du prompt. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L’admission de groupe et l’autorisation des expéditeurs sont des vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes pouvant atteindre le traitement de groupe, mais n’autorise pas à lui seul tous les expéditeurs de ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet secondaire pour les DM. `direct["*"]` fournit uniquement une configuration directe par défaut après qu’un DM a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du magasin d’association.

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
- prompts : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Connexe

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
