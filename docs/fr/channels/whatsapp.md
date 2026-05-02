---
read_when:
    - Travailler sur le comportement du canal Web WhatsApp ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d'accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Statut : prêt pour la production via WhatsApp Web (Baileys). Le Gateway possède les sessions liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le Plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose aussi le flux d’installation lorsque
  le Plugin n’est pas encore présent.
- Canal dev + checkout git : utilise par défaut le chemin local du Plugin.
- Stable/Beta : utilise le paquet npm `@openclaw/whatsapp` sur le tag de version
  officiel actuel.

L’installation manuelle reste disponible :

```bash
openclaw plugins install @openclaw/whatsapp
```

Utilisez le paquet nu pour suivre le tag de version officiel actuel. Épinglez une version
exacte uniquement lorsque vous avez besoin d’une installation reproductible.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique de DM par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
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

  <Step title="Lier WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour associer un répertoire d’authentification WhatsApp Web existant/personnalisé avant la connexion :

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

  <Step title="Approuver la première demande d’appairage (si vous utilisez le mode appairage)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d’appairage expirent après 1 heure. Les demandes en attente sont plafonnées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d’exécuter WhatsApp sur un numéro séparé lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    C’est le mode opérationnel le plus propre :

    - identité WhatsApp séparée pour OpenClaw
    - listes d’autorisation de DM et limites de routage plus claires
    - risque réduit de confusion avec les messages envoyés à soi-même

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

  <Accordion title="Solution de secours avec numéro personnel">
    L’onboarding prend en charge le mode avec numéro personnel et écrit une base compatible avec les messages à soi-même :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections des messages à soi-même s’appuient sur le numéro lié et `allowFrom`.

  </Accordion>

  <Accordion title="Périmètre du canal uniquement WhatsApp Web">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture de canal actuelle d’OpenClaw.

    Il n’existe pas de canal de messagerie WhatsApp Twilio distinct dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- Le Gateway possède la socket WhatsApp et la boucle de reconnexion.
- Le watchdog de reconnexion utilise l’activité du transport WhatsApp Web, pas seulement le volume des messages applicatifs entrants, donc une session d’appareil lié silencieuse n’est pas redémarrée uniquement parce que personne n’a envoyé de message récemment. Un plafond plus long de silence applicatif force tout de même une reconnexion si les trames de transport continuent d’arriver mais qu’aucun message applicatif n’est traité pendant la fenêtre du watchdog ; après une reconnexion transitoire pour une session récemment active, cette vérification du silence applicatif utilise le délai d’expiration normal des messages pour la première fenêtre de récupération.
- Les délais de socket Baileys sont explicites sous `web.whatsapp.*` : `keepAliveIntervalMs` contrôle les pings applicatifs WhatsApp Web, `connectTimeoutMs` contrôle le délai d’expiration de la poignée de main d’ouverture, et `defaultQueryTimeoutMs` contrôle les délais d’expiration des requêtes Baileys.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les statuts et discussions de diffusion sont ignorés (`@status`, `@broadcast`).
- Le watchdog de reconnexion suit l’activité du transport WhatsApp Web, pas seulement le volume des messages applicatifs entrants : les sessions d’appareil lié silencieuses restent actives tant que les trames de transport continuent, mais un blocage du transport force une reconnexion bien avant le chemin de déconnexion distante ultérieur.
- Les discussions directes utilisent les règles de session DM (`session.dmScope` ; la valeur par défaut `main` regroupe les DM dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Les canaux/newsletters WhatsApp peuvent être des cibles sortantes explicites avec leur JID natif `@newsletter`. Les envois sortants de newsletter utilisent les métadonnées de session de canal (`agent:<agentId>:whatsapp:channel:<jid>`) plutôt que la sémantique de session DM.
- Le transport WhatsApp Web respecte les variables d’environnement de proxy standard sur l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez la configuration de proxy au niveau de l’hôte aux paramètres de proxy WhatsApp propres au canal.
- Lorsque `messages.removeAckAfterReply` est activé, OpenClaw efface la réaction d’accusé de réception WhatsApp après la livraison d’une réponse visible.

## Hooks de Plugin et confidentialité

Les messages WhatsApp entrants peuvent contenir le contenu de messages personnels, des numéros de téléphone,
des identifiants de groupe, des noms d’expéditeurs et des champs de corrélation de session. Pour cette raison,
WhatsApp ne diffuse pas les charges utiles du hook `message_received` entrant aux plugins
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

Activez cela uniquement pour les plugins auxquels vous faites confiance pour recevoir le contenu et les identifiants des messages WhatsApp entrants.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique DM">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux discussions directes :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte les numéros de style E.164 (normalisés en interne).

    `allowFrom` est une liste de contrôle d’accès des expéditeurs DM. Elle ne bloque pas les envois sortants explicites vers des JID de groupes WhatsApp ou des JID de canaux `@newsletter`.

    Remplacement multi-compte : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) ont priorité sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les appairages sont conservés dans le magasin d’autorisations du canal et fusionnés avec `allowFrom` configuré
    - l’automatisation planifiée et le repli des destinataires Heartbeat utilisent des cibles de livraison explicites ou `allowFrom` configuré ; les approbations d’appairage DM ne sont pas des destinataires Cron ou Heartbeat implicites
    - si aucune liste d’autorisation n’est configurée, le numéro lié de l’utilisateur lui-même est autorisé par défaut
    - OpenClaw n’appaire jamais automatiquement les DM sortants `fromMe` (messages que vous vous envoyez depuis l’appareil lié)

  </Tab>

  <Tab title="Politique de groupe + listes d’autorisation">
    L’accès aux groupes comporte deux couches :

    1. **Liste d’autorisation d’appartenance aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont éligibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupes (`"*"` autorisé)

    2. **Politique d’expéditeur de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : liste d’autorisation des expéditeurs contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque toutes les entrées de groupe

    Repli de la liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution se rabat sur `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation des expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe, le repli de la politique de groupe à l’exécution est `allowlist` (avec un journal d’avertissement), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe nécessitent une mention par défaut.

    La détection des mentions inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - les transcriptions de notes vocales entrantes pour les messages de groupe autorisés
    - la détection implicite de réponse au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Note de sécurité :

    - citer/répondre satisfait uniquement le filtrage par mention ; cela n’accorde **pas** l’autorisation à l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs absents de la liste d’autorisation restent bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de session (pas la configuration globale). Elle est réservée au propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et messages à soi-même

Lorsque le numéro lié de l’utilisateur lui-même est également présent dans `allowFrom`, les protections WhatsApp des messages à soi-même s’activent :

- ignorer les accusés de lecture pour les tours de messages à soi-même
- ignorer le comportement de déclenchement automatique par JID de mention qui vous mentionnerait autrement vous-même
- si `messages.responsePrefix` n’est pas défini, les réponses aux messages à soi-même utilisent par défaut `[{identity.name}]` ou `[openclaw]`

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
    Lorsque la cible de la réponse citée est un média téléchargeable, OpenClaw l’enregistre via
    le magasin de médias entrants normal et l’expose comme `MediaPath`/`MediaType` afin que
    l’agent puisse inspecter l’image référencée au lieu de voir uniquement
    `<media:image>`.

  </Accordion>

  <Accordion title="Espaces réservés de médias et extraction de localisation/contact">
    Les messages entrants contenant uniquement des médias sont normalisés avec des espaces réservés tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les notes vocales de groupe autorisées sont transcrites avant le filtrage par mention lorsque le
    corps est uniquement `<media:audio>`, donc prononcer la mention du bot dans la note vocale peut
    déclencher la réponse. Si la transcription ne mentionne toujours pas le bot, la
    transcription est conservée dans l’historique de groupe en attente au lieu de l’espace réservé brut.

    Les corps de localisation utilisent un texte de coordonnées concis. Les libellés/commentaires de localisation et les détails de contact/vCard sont rendus comme des métadonnées non fiables clôturées, pas comme du texte de prompt en ligne.

  </Accordion>

  <Accordion title="Injection de l’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est finalement déclenché.

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

    Les conversations avec soi-même ignorent les confirmations de lecture même lorsqu'elles sont activées globalement.

  </Accordion>
</AccordionGroup>

## Livraison, découpage et médias

<AccordionGroup>
  <Accordion title="Découpage du texte">
    - limite de découpage par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis revient à un découpage sûr selon la longueur

  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles d'image, de vidéo, d'audio (note vocale PTT) et de document
    - les médias audio sont envoyés via la charge utile `audio` de Baileys avec `ptt: true`, afin que les clients WhatsApp les affichent comme une note vocale push-to-talk
    - les charges utiles de réponse préservent `audioAsVoice` ; la sortie de note vocale TTS pour WhatsApp reste sur ce chemin PTT même lorsque le fournisseur renvoie du MP3 ou du WebM
    - l'audio Ogg/Opus natif est envoyé comme `audio/ogg; codecs=opus` pour la compatibilité des notes vocales
    - l'audio non Ogg, y compris la sortie TTS MP3/WebM de Microsoft Edge, est transcodé avec `ffmpeg` en Ogg/Opus mono 48 kHz avant la livraison PTT
    - `/tts latest` envoie la dernière réponse de l'assistant comme une seule note vocale et supprime les envois répétés pour la même réponse ; `/tts chat on|off|default` contrôle le TTS automatique pour la conversation WhatsApp actuelle
    - la lecture des GIF animés est prise en charge via `gifPlayback: true` sur les envois vidéo
    - les légendes sont appliquées au premier élément multimédia lors de l'envoi de charges utiles de réponse multimédia, sauf pour les notes vocales PTT, qui envoient d'abord l'audio puis le texte visible séparément, car les clients WhatsApp n'affichent pas les légendes de notes vocales de façon cohérente
    - la source multimédia peut être HTTP(S), `file://` ou des chemins locaux

  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - plafond d'enregistrement des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - plafond d'envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont optimisées automatiquement (redimensionnement/balayage de qualité) pour respecter les limites
    - en cas d'échec d'envoi d'un média, le repli du premier élément envoie un avertissement textuel au lieu d'abandonner silencieusement la réponse

  </Accordion>
</AccordionGroup>

## Citation des réponses

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez-la avec `channels.whatsapp.replyToMode`.

| Valeur      | Comportement                                                         |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ne jamais citer ; envoyer comme un message simple                     |
| `"first"`   | Citer uniquement le premier fragment de réponse sortante              |
| `"all"`     | Citer chaque fragment de réponse sortante                             |
| `"batched"` | Citer les réponses groupées en file d'attente tout en laissant les réponses immédiates sans citation |

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

`channels.whatsapp.reactionLevel` contrôle dans quelle mesure l'agent utilise les réactions emoji sur WhatsApp :

| Niveau        | Réactions d'accusé de réception | Réactions lancées par l'agent | Description                                                |
| ------------- | -------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| `"off"`       | Non                              | Non                           | Aucune réaction                                            |
| `"ack"`       | Oui                              | Non                           | Réactions d'accusé de réception uniquement (reçu avant réponse) |
| `"minimal"`   | Oui                              | Oui (conservateur)            | Accusé de réception + réactions de l'agent avec consignes conservatrices |
| `"extensive"` | Oui                              | Oui (encouragé)               | Accusé de réception + réactions de l'agent avec consignes encourageantes |

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

## Réactions d'accusé de réception

WhatsApp prend en charge les réactions d'accusé de réception immédiates lors de la réception entrante via `channels.whatsapp.ackReaction`.
Les réactions d'accusé de réception sont contrôlées par `reactionLevel` : elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

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

- envoyées immédiatement après l'acceptation de l'entrée (avant la réponse)
- les échecs sont consignés, mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit aux tours déclenchés par une mention ; l'activation de groupe `always` agit comme contournement pour cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l'ancien `messages.ackReaction` n'est pas utilisé ici)

## Comptes multiples et identifiants

<AccordionGroup>
  <Accordion title="Sélection de compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s'il est présent, sinon le premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche

  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité héritée">
    - chemin d'authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l'authentification par défaut héritée dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux de compte par défaut

  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l'état d'authentification WhatsApp pour ce compte.

    Lorsqu'un Gateway est joignable, la déconnexion arrête d'abord l'écouteur WhatsApp actif pour le compte sélectionné afin que la session liée ne continue pas à recevoir des messages jusqu'au prochain redémarrage. `openclaw channels remove --channel whatsapp` arrête aussi l'écouteur actif avant de désactiver ou de supprimer la configuration du compte.

    Dans les répertoires d'authentification hérités, `oauth.json` est conservé tandis que les fichiers d'authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils d'agent inclut l'action de réaction WhatsApp (`react`).
- Verrous d'action :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivez via `channels.whatsapp.configWrites=false`).

## Dépannage

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

    Les comptes peu actifs peuvent rester connectés au-delà du délai normal de message ; le watchdog
    redémarre lorsque l'activité du transport WhatsApp Web s'arrête, que le socket se ferme ou que
    l'activité au niveau de l'application reste silencieuse au-delà de la fenêtre de sécurité plus longue.

    Si les journaux affichent des `status=408 Request Time-out Connection was lost` répétés, ajustez
    les temporisations de socket Baileys sous `web.whatsapp`. Commencez par raccourcir
    `keepAliveIntervalMs` sous le délai d'inactivité de votre réseau et par augmenter
    `connectTimeoutMs` sur les liaisons lentes ou avec pertes :

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

    Si `~/.openclaw/logs/whatsapp-health.log` indique `Gateway inactive`, mais que
    `openclaw gateway status` et `openclaw channels status --probe` montrent que le
    gateway et WhatsApp sont sains, exécutez `openclaw doctor`. Sous Linux, doctor
    avertit au sujet des entrées crontab héritées qui invoquent encore
    `~/.openclaw/bin/ensure-whatsapp.sh` ; supprimez ces entrées obsolètes avec
    `crontab -e`, car cron peut ne pas disposer de l'environnement de bus utilisateur systemd et
    faire signaler à tort l'état de santé du gateway par cet ancien script.

    Si nécessaire, associez à nouveau avec `channels login`.

  </Accordion>

  <Accordion title="La connexion QR expire derrière un proxy">
    Symptôme : `openclaw channels login --channel whatsapp` échoue avant d'afficher un code QR utilisable avec `status=408 Request Time-out` ou une déconnexion de socket TLS.

    La connexion WhatsApp Web utilise l'environnement proxy standard de l'hôte gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minuscules et `NO_PROXY`). Vérifiez que le processus gateway hérite de l'environnement proxy et que `NO_PROXY` ne correspond pas à `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l'envoi">
    Les envois sortants échouent rapidement lorsqu'aucun écouteur gateway actif n'existe pour le compte cible.

    Assurez-vous que le gateway est en cours d'exécution et que le compte est lié.

  </Accordion>

  <Accordion title="La réponse apparaît dans la transcription mais pas dans WhatsApp">
    Les lignes de transcription enregistrent ce que l'agent a généré. La livraison WhatsApp est vérifiée séparément : OpenClaw ne considère une réponse automatique comme envoyée qu'après que Baileys a renvoyé un identifiant de message sortant pour au moins un envoi de texte visible ou de média.

    Les réactions d'accusé de réception sont des reçus indépendants avant réponse. Une réaction réussie ne prouve pas que la réponse textuelle ou multimédia ultérieure a été acceptée par WhatsApp.

    Consultez les journaux du gateway pour `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de façon inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d'autorisation `groups`
    - contrôle par mention (`requireMention` + motifs de mention)
    - clés en double dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, donc conservez un seul `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d'exécution Bun">
    Le runtime gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible avec un fonctionnement stable du gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Invites système

WhatsApp prend en charge les invites système de style Telegram pour les groupes et les conversations directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map effective `groups` est déterminée en premier : si le compte définit son propre `groups`, il remplace entièrement la map `groups` racine (pas de fusion profonde). La recherche d'invite s'exécute ensuite sur la map unique obtenue :

1. **Invite système propre au groupe** (`groups["<groupId>"].systemPrompt`) : utilisée lorsque l'entrée du groupe spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucune invite système n'est appliquée.
2. **Invite système joker de groupe** (`groups["*"].systemPrompt`) : utilisée lorsque l'entrée du groupe spécifique est entièrement absente de la map, ou lorsqu'elle existe mais ne définit pas de clé `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map effective `direct` est déterminée en premier : si le compte définit son propre `direct`, il remplace entièrement la map `direct` racine (pas de fusion profonde). La recherche d'invite s'exécute ensuite sur la map unique obtenue :

1. **Invite système propre au direct** (`direct["<peerId>"].systemPrompt`) : utilisée lorsque l'entrée du pair spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucune invite système n'est appliquée.
2. **Invite système joker de direct** (`direct["*"].systemPrompt`) : utilisée lorsque l'entrée du pair spécifique est entièrement absente de la map, ou lorsqu'elle existe mais ne définit pas de clé `systemPrompt`.

<Note>
`dms` reste le compartiment léger de remplacement d'historique par DM (`dms.<id>.historyLimit`). Les remplacements d'invite se trouvent sous `direct`.
</Note>

**Différence par rapport au comportement multi-compte de Telegram :** Dans Telegram, `groups` à la racine est volontairement supprimé pour tous les comptes dans une configuration multi-compte, même les comptes qui ne définissent pas leurs propres `groups`, afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : `groups` et `direct` à la racine sont toujours hérités par les comptes qui ne définissent aucune surcharge au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-compte, si vous voulez des invites de groupe ou directes par compte, définissez explicitement la carte complète sous chaque compte au lieu de vous appuyer sur les valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une carte de configuration par groupe et la liste d’autorisation de groupes au niveau du chat. Au niveau racine ou du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- N’ajoutez un `systemPrompt` de groupe générique que lorsque vous voulez déjà que cette portée admette tous les groupes. Si vous voulez toujours que seul un ensemble fixe d’ID de groupe soit éligible, n’utilisez pas `groups["*"]` comme invite par défaut. Répétez plutôt l’invite sur chaque entrée de groupe explicitement autorisée.
- L’admission des groupes et l’autorisation des expéditeurs sont des vérifications séparées. `groups["*"]` élargit l’ensemble des groupes qui peuvent atteindre le traitement des groupes, mais il n’autorise pas à lui seul chaque expéditeur dans ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet de bord pour les MP. `direct["*"]` fournit seulement une configuration directe de chat par défaut après qu’un MP a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du stockage d’appairage.

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
- distribution : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-compte : `accounts.<id>.enabled`, `accounts.<id>.authDir`, surcharges au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- invites : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Associés

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
