---
read_when:
    - Travailler sur le comportement du canal WhatsApp/web ou sur le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d'accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

Statut : prêt pour la production via WhatsApp Web (Baileys). La Gateway gère la ou les sessions liées.

## Installation (à la demande)

- L'onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d'installer le Plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose aussi le flux d'installation lorsque
  le Plugin n'est pas encore présent.
- Canal de développement + dépôt git extrait : utilise par défaut le chemin local du Plugin.
- Stable/Beta : utilise par défaut le package npm `@openclaw/whatsapp`.

L'installation manuelle reste possible :

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    La politique DM par défaut est l'association pour les expéditeurs inconnus.
  </Card>
  <Card title="Résolution des problèmes des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration de la Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Configurer la politique d'accès WhatsApp">

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

  <Step title="Lier WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour rattacher un répertoire d'authentification WhatsApp Web existant/personnalisé avant la connexion :

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Démarrer la gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approuver la première demande d'association (si vous utilisez le mode d'association)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d'association expirent après 1 heure. Les demandes en attente sont limitées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d'utiliser WhatsApp avec un numéro distinct lorsque c'est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    C'est le mode opérationnel le plus propre :

    - identité WhatsApp distincte pour OpenClaw
    - limites plus claires pour les listes d'autorisation DM et le routage
    - risque plus faible de confusion avec le chat personnel

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
    L'onboarding prend en charge le mode numéro personnel et écrit une base compatible avec le chat personnel :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    Au moment de l'exécution, les protections de chat personnel s'appuient sur le numéro personnel lié et `allowFrom`.

  </Accordion>

  <Accordion title="Portée du canal WhatsApp Web uniquement">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l'architecture actuelle des canaux OpenClaw.

    Il n'existe pas de canal de messagerie WhatsApp Twilio distinct dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d'exécution

- La Gateway gère le socket WhatsApp et la boucle de reconnexion.
- Les envois sortants nécessitent un listener WhatsApp actif pour le compte cible.
- Les chats de statut et de diffusion sont ignorés (`@status`, `@broadcast`).
- Les chats directs utilisent les règles de session DM (`session.dmScope` ; par défaut `main` regroupe les DM dans la session principale de l'agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Le transport WhatsApp Web respecte les variables d'environnement proxy standard sur l'hôte de la gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez une configuration proxy au niveau de l'hôte plutôt que des paramètres proxy WhatsApp spécifiques au canal.
- Lorsque `messages.removeAckAfterReply` est activé, OpenClaw supprime la réaction d'accusé de réception WhatsApp après la livraison d'une réponse visible.

## Hooks du Plugin et confidentialité

Les messages WhatsApp entrants peuvent contenir du contenu de message personnel, des numéros de téléphone,
des identifiants de groupe, des noms d'expéditeur et des champs de corrélation de session. Pour cette raison,
WhatsApp ne diffuse pas les charges utiles de hook `message_received` entrantes aux Plugins
à moins que vous ne l'activiez explicitement :

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

Vous pouvez limiter cette activation à un seul compte :

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

Activez cela uniquement pour les Plugins auxquels vous faites confiance pour recevoir le contenu
et les identifiants des messages WhatsApp entrants.

## Contrôle d'accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.whatsapp.dmPolicy` contrôle l'accès au chat direct :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte les numéros au format E.164 (normalisés en interne).

    Surcharge multi-comptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) prennent le pas sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement d'exécution :

    - les associations sont conservées dans le magasin d'autorisations du canal et fusionnées avec `allowFrom` configuré
    - si aucune liste d'autorisation n'est configurée, le numéro personnel lié est autorisé par défaut
    - OpenClaw n'associe jamais automatiquement les DM sortants `fromMe` (messages que vous vous envoyez à vous-même depuis l'appareil lié)

  </Tab>

  <Tab title="Politique de groupe + listes d'autorisation">
    L'accès aux groupes comporte deux couches :

    1. **Liste d'autorisation d'appartenance au groupe** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont admissibles
       - si `groups` est présent, il agit comme une liste d'autorisation de groupes (`"*"` autorisé)

    2. **Politique d'expéditeur de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : la liste d'autorisation des expéditeurs est contournée
       - `allowlist` : l'expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque tous les messages entrants de groupe

    Repli de liste d'autorisation des expéditeurs :

    - si `groupAllowFrom` n'est pas défini, l'exécution se replie sur `allowFrom` lorsqu'il est disponible
    - les listes d'autorisation des expéditeurs sont évaluées avant l'activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n'existe du tout, le repli de politique de groupe à l'exécution est `allowlist` (avec un journal d'avertissement), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses dans les groupes nécessitent une mention par défaut.

    La détection des mentions inclut :

    - mentions WhatsApp explicites de l'identité du bot
    - motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - transcriptions de notes vocales entrantes pour les messages de groupe autorisés
    - détection implicite de réponse au bot (l'expéditeur de la réponse correspond à l'identité du bot)

    Remarque de sécurité :

    - la citation/réponse ne satisfait qu'au filtrage par mention ; elle **n'accorde pas** l'autorisation à l'expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs hors liste d'autorisation restent bloqués même s'ils répondent au message d'un utilisateur autorisé

    Commande d'activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l'état de la session (pas la configuration globale). Elle est protégée par contrôle propriétaire.

  </Tab>
</Tabs>

## Numéro personnel et comportement de chat personnel

Lorsque le numéro personnel lié est aussi présent dans `allowFrom`, les protections de chat personnel WhatsApp s'activent :

- ignorer les accusés de lecture pour les tours de chat personnel
- ignorer le comportement de déclenchement automatique par mention-JID qui vous interpellerait sinon vous-même
- si `messages.responsePrefix` n'est pas défini, les réponses de chat personnel utilisent par défaut `[{identity.name}]` ou `[openclaw]`

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Enveloppe entrante + contexte de réponse">
    Les messages WhatsApp entrants sont encapsulés dans l'enveloppe entrante partagée.

    Si une réponse citée existe, le contexte est ajouté sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les champs de métadonnées de réponse sont aussi renseignés lorsqu'ils sont disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, expéditeur JID/E.164).

  </Accordion>

  <Accordion title="Espaces réservés média et extraction emplacement/contact">
    Les messages entrants contenant uniquement un média sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les notes vocales de groupe autorisées sont transcrites avant le filtrage par mention lorsque le
    corps est uniquement `<media:audio>`, afin qu'une mention du bot dans la note vocale puisse
    déclencher la réponse. Si la transcription ne mentionne toujours pas le bot, la
    transcription est conservée dans l'historique de groupe en attente au lieu de l'espace réservé brut.

    Les corps de message de localisation utilisent un texte de coordonnées concis. Les libellés/commentaires d'emplacement et les détails de contact/vCard sont rendus comme métadonnées non fiables encadrées, et non comme texte d'invite en ligne.

  </Accordion>

  <Accordion title="Injection de l'historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est finalement déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Marqueurs d'injection :

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

    Surcharge par compte :

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

    Les tours de chat personnel ignorent les accusés de lecture même lorsqu'ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, segmentation et médias

<AccordionGroup>
  <Accordion title="Segmentation du texte">
    - limite de segment par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis se replie sur une segmentation sûre par longueur
  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles image, vidéo, audio (note vocale PTT) et document
    - le média audio est envoyé via la charge utile Baileys `audio` avec `ptt: true`, afin que les clients WhatsApp l'affichent comme une note vocale push-to-talk
    - les charges utiles de réponse conservent `audioAsVoice` ; la sortie de note vocale TTS pour WhatsApp reste sur ce chemin PTT même lorsque le fournisseur renvoie du MP3 ou du WebM
    - l'audio Ogg/Opus natif est envoyé comme `audio/ogg; codecs=opus` pour la compatibilité des notes vocales
    - l'audio non Ogg, y compris la sortie MP3/WebM du TTS Microsoft Edge, est transcodé avec `ffmpeg` en Ogg/Opus mono 48 kHz avant la livraison PTT
    - `/tts latest` envoie la dernière réponse de l'assistant comme une seule note vocale et supprime les envois répétés pour cette même réponse ; `/tts chat on|off|default` contrôle le TTS automatique pour le chat WhatsApp actuel
    - la lecture GIF animée est prise en charge via `gifPlayback: true` sur les envois vidéo
    - les légendes sont appliquées au premier élément média lors de l'envoi de charges utiles de réponse multimédia, sauf que les notes vocales PTT envoient l'audio d'abord et le texte visible séparément, car les clients WhatsApp n'affichent pas les légendes de note vocale de manière cohérente
    - la source du média peut être HTTP(S), `file://` ou des chemins locaux
  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - limite de sauvegarde des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - limite d'envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les surcharges par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont optimisées automatiquement (balayage redimensionnement/qualité) pour respecter les limites
    - en cas d'échec d'envoi d'un média, le repli sur le premier élément envoie un avertissement texte au lieu d'ignorer silencieusement la réponse
  </Accordion>
</AccordionGroup>

## Citation des réponses

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez ce comportement avec `channels.whatsapp.replyToMode`.

| Valeur      | Comportement                                                         |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Ne jamais citer ; envoyer comme message simple                       |
| `"first"`   | Citer uniquement le premier segment de réponse sortante              |
| `"all"`     | Citer chaque segment de réponse sortante                             |
| `"batched"` | Citer les réponses en file d'attente par lot tout en laissant les réponses immédiates sans citation |

La valeur par défaut est `"off"`. Les surcharges par compte utilisent `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` contrôle l'étendue avec laquelle l'agent utilise les réactions emoji sur WhatsApp :

| Niveau        | Réactions d'accusé de réception | Réactions initiées par l'agent | Description                                      |
| ------------- | ------------------------------- | ------------------------------ | ------------------------------------------------ |
| `"off"`       | Non                             | Non                            | Aucune réaction                                  |
| `"ack"`       | Oui                             | Non                            | Réactions d'accusé de réception uniquement (accusé avant réponse) |
| `"minimal"`   | Oui                             | Oui (conservatrices)           | Accusés + réactions de l'agent avec directives conservatrices |
| `"extensive"` | Oui                             | Oui (encouragées)              | Accusés + réactions de l'agent avec directives encouragées   |

Par défaut : `"minimal"`.

Les surcharges par compte utilisent `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Réactions d'accusé de réception

WhatsApp prend en charge les réactions d'accusé de réception immédiates à la réception entrante via `channels.whatsapp.ackReaction`.
Les réactions d'accusé de réception sont régies par `reactionLevel` — elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

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

Remarques sur le comportement :

- envoyées immédiatement après l'acceptation du message entrant (avant la réponse)
- les échecs sont consignés dans les journaux mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit pour les tours déclenchés par mention ; l'activation de groupe `always` agit comme contournement de cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l'ancien `messages.ackReaction` n'est pas utilisé ici)

## Multi-comptes et identifiants

<AccordionGroup>
  <Accordion title="Sélection de compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s'il est présent, sinon premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche
  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité héritée">
    - chemin d'authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l'ancienne authentification par défaut dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux de compte par défaut
  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l'état d'authentification WhatsApp pour ce compte.

    Dans les anciens répertoires d'authentification, `oauth.json` est conservé tandis que les fichiers d'authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils d'agent inclut l'action de réaction WhatsApp (`react`).
- Garde-fous des actions :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivez-les via `channels.whatsapp.configWrites=false`).

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : l'état du canal indique qu'il n'est pas lié.

    Correctif :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Lié mais déconnecté / boucle de reconnexion">
    Symptôme : compte lié avec déconnexions répétées ou tentatives de reconnexion.

    Correctif :

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si nécessaire, reliez-le avec `channels login`.

  </Accordion>

  <Accordion title="Aucun listener actif lors de l'envoi">
    Les envois sortants échouent immédiatement lorsqu'aucun listener gateway actif n'existe pour le compte cible.

    Assurez-vous que la gateway est en cours d'exécution et que le compte est lié.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d'autorisation `groups`
    - filtrage par mention (`requireMention` + motifs de mention)
    - clés dupliquées dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, donc conservez une seule valeur `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d'exécution Bun">
    L'exécution de la gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible pour un fonctionnement stable de la gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge des prompts système de style Telegram pour les groupes et les discussions directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map `groups` effective est d'abord déterminée : si le compte définit son propre `groups`, il remplace entièrement la map `groups` racine (pas de fusion profonde). La recherche du prompt s'effectue ensuite sur l'unique map résultante :

1. **Prompt système spécifique au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé lorsque l'entrée du groupe spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucun prompt système n'est appliqué.
2. **Prompt système joker du groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l'entrée spécifique au groupe est totalement absente de la map, ou lorsqu'elle existe mais ne définit pas de clé `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map `direct` effective est d'abord déterminée : si le compte définit son propre `direct`, il remplace entièrement la map `direct` racine (pas de fusion profonde). La recherche du prompt s'effectue ensuite sur l'unique map résultante :

1. **Prompt système spécifique au direct** (`direct["<peerId>"].systemPrompt`) : utilisé lorsque l'entrée du pair spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucun prompt système n'est appliqué.
2. **Prompt système joker du direct** (`direct["*"].systemPrompt`) : utilisé lorsque l'entrée spécifique au pair est totalement absente de la map, ou lorsqu'elle existe mais ne définit pas de clé `systemPrompt`.

Remarque : `dms` reste le compartiment léger de surcharge d'historique par DM (`dms.<id>.historyLimit`) ; les surcharges de prompt se trouvent sous `direct`.

**Différence par rapport au comportement multi-comptes de Telegram :** Dans Telegram, `groups` racine est volontairement supprimé pour tous les comptes dans une configuration multi-comptes — même pour les comptes qui ne définissent pas leur propre `groups` — afin d'empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n'appartient pas. WhatsApp n'applique pas cette protection : `groups` racine et `direct` racine sont toujours hérités par les comptes qui ne définissent aucune surcharge au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-comptes, si vous voulez des prompts de groupe ou directs par compte, définissez explicitement la map complète sous chaque compte au lieu de vous appuyer sur des valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une map de configuration par groupe et la liste d'autorisation des groupes au niveau du chat. À la racine comme au niveau du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- Ajoutez un `systemPrompt` de groupe joker uniquement si vous voulez déjà que cette portée admette tous les groupes. Si vous voulez encore que seul un ensemble fixe d'identifiants de groupe soit admissible, n'utilisez pas `groups["*"]` comme prompt par défaut. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L'admission au groupe et l'autorisation de l'expéditeur sont des vérifications distinctes. `groups["*"]` élargit l'ensemble des groupes pouvant atteindre le traitement de groupe, mais n'autorise pas à lui seul tous les expéditeurs de ces groupes. L'accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n'a pas le même effet secondaire pour les DM. `direct["*"]` fournit seulement une configuration de discussion directe par défaut après qu'un DM a déjà été admis par `dmPolicy` plus les règles `allowFrom` ou du magasin d'association.

Exemple :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // À utiliser uniquement si tous les groupes doivent être admis à la portée racine.
        // S'applique à tous les comptes qui ne définissent pas leur propre map groups.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // S'applique à tous les comptes qui ne définissent pas leur propre map direct.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Ce compte définit son propre groups, donc groups racine est entièrement
            // remplacé. Pour conserver un joker, définissez explicitement "*" ici aussi.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // À utiliser uniquement si tous les groupes doivent être admis dans ce compte.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Ce compte définit sa propre map direct, donc les entrées direct racine sont
            // entièrement remplacées. Pour conserver un joker, définissez explicitement "*" ici aussi.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Pointeurs vers la référence de configuration

Référence principale :

- [Référence de configuration - WhatsApp](/fr/gateway/config-channels#whatsapp)

Champs WhatsApp à fort signal :

- accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-comptes : `accounts.<id>.enabled`, `accounts.<id>.authDir`, surcharges au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Liens associés

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Résolution des problèmes](/fr/channels/troubleshooting)
