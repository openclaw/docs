---
read_when:
    - Travailler sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:37:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Statut : prêt pour la production via WhatsApp Web (Baileys). Gateway gère les sessions liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le Plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose également le flux d’installation lorsque
  le Plugin n’est pas encore présent.
- Canal de développement + extraction git : utilise par défaut le chemin local du Plugin.
- Stable/Bêta : installe d’abord le Plugin officiel `@openclaw/whatsapp` depuis ClawHub,
  avec npm comme solution de repli.
- Le runtime WhatsApp est distribué en dehors du paquet npm OpenClaw principal afin que
  les dépendances de runtime propres à WhatsApp restent avec le Plugin externe.

L’installation manuelle reste disponible :

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Utilisez le paquet npm brut (`@openclaw/whatsapp`) uniquement lorsque vous avez besoin de la
solution de repli du registre. Épinglez une version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique DM par défaut est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics et guides de réparation intercanaux.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Exemples et modèles complets de configuration des canaux.
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

    La connexion actuelle repose sur un QR. Dans les environnements distants ou sans interface,
    assurez-vous de disposer d’un moyen fiable pour transmettre le code QR actif au téléphone qui le scannera
    avant de démarrer la connexion.

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour rattacher un répertoire d’authentification WhatsApp Web existant/personnalisé avant la connexion :

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

    Les demandes d’appairage expirent après 1 heure. Les demandes en attente sont limitées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d’exécuter WhatsApp sur un numéro séparé lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

<Warning>
Le flux de configuration WhatsApp actuel utilise uniquement les QR. Les QR affichés dans le terminal, les captures d’écran,
les PDF ou les pièces jointes de discussion peuvent expirer ou devenir illisibles pendant leur relais
depuis une machine distante. Pour les hôtes distants/sans interface, préférez un chemin de remise directe de l’image QR
à une capture manuelle du terminal.
</Warning>

## Appeler le demandeur actuel avec MeowCaller (expérimental)

Le Plugin WhatsApp peut exposer `whatsapp_call` dans les tours d’agent provenant de WhatsApp. L’outil
utilise [MeowCaller](https://github.com/purpshell/meowcaller) pour passer un appel vocal WhatsApp au
demandeur autorisé actuel et lit un message TTS OpenClaw après qu’il a répondu. L’outil
n’accepte pas de numéro de destination, un prompt ne peut donc pas rediriger l’appel vers un tiers.
Cette capacité expérimentale est désactivée par défaut.

<Warning>
MeowCaller est expérimental, ne dispose d’aucune version balisée et utilise une session d’appareil lié whatsmeow
appairée séparément. Il ne peut pas réutiliser les identifiants Baileys du Plugin WhatsApp. L’appairage ajoute
un autre appareil lié au même compte WhatsApp. Scannez avec l’identité WhatsApp utilisée par
OpenClaw. Le mode numéro personnel/self-chat ne peut pas s’appeler lui-même ; utilisez un numéro OpenClaw dédié
pour appeler votre numéro personnel.
</Warning>

<Steps>
  <Step title="Activer les appels expérimentaux">

    Ajoutez `actions.calls: true` au canal WhatsApp dans `openclaw.json` :

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Fusionnez cela dans votre configuration WhatsApp existante, puis redémarrez le Gateway. Lorsque le
    paramètre est absent ou vaut `false`, OpenClaw n’expose pas l’outil `whatsapp_call` à l’agent.

  </Step>

  <Step title="Installer la CLI MeowCaller révisée">

    L’adaptateur attend un exécutable nommé `meowcaller` sur le `PATH` de l’hôte du Gateway.
    Jusqu’à la fusion de [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7), compilez
    la branche révisée au commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f` :

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Assurez-vous que `$HOME/.local/bin` figure également dans le `PATH` du service Gateway. Cette révision fournit
    des commandes explicites `pair` et `notify` en envoi seul. `notify` n’ouvre aucun micro, haut-parleur,
    périphérique vidéo, récepteur audio entrant ni capture de diagnostic. Ne remplacez pas par la commande
    `play` de la CLI d’exemple.

  </Step>

  <Step title="Appairer l’appareil lié MeowCaller">

    Demandez à l’agent WhatsApp de vérifier la configuration des appels. L’action de statut `whatsapp_call` indique le
    répertoire d’état propre au compte et la commande d’appairage. Pour le compte par défaut :

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Exécutez la commande dans un terminal interactif. Scannez son QR depuis **WhatsApp > Appareils liés**
    et attendez `MeowCaller linked device ready`. La commande se termine ensuite. Gardez `wa-voip.db`
    privé ; il s’agit de la session d’appareil lié MeowCaller. L’action de statut `whatsapp_call`
    renvoie la commande et le shell propres au compte lorsque vous utilisez un compte non par défaut. Sous
    Windows, exécutez sa commande PowerShell ; MeowCaller crée le répertoire de stockage.

  </Step>

  <Step title="Configurer TTS et appeler depuis WhatsApp">

    Configurez un [fournisseur TTS](/fr/tools/tts) compatible avec la téléphonie, redémarrez le Gateway, puis envoyez une
    demande WhatsApp telle que `Call me and say the build finished.` L’outil résout l’expéditeur
    depuis le contexte entrant fiable, synthétise un fichier WAV privé temporaire, exécute MeowCaller pendant une
    fenêtre d’appel bornée, puis supprime le fichier audio. OpenClaw transmet explicitement le stockage du compte,
    attend un code de sortie nul après réponse, lecture et raccrochage, et traite
    un timeout ou un code de sortie non nul comme un appel d’outil échoué.

  </Step>
</Steps>

Limites actuelles :

- appels audio sortants individuels uniquement
- aucun numéro de destination arbitraire
- aucune authentification partagée avec la connexion de discussion
- aucun auto-appel en mode numéro personnel/self-chat
- l’audio synthétisé est limité à 60 secondes
- aucun accusé d’audibilité côté combiné au-delà de la fin réponse/lecture/raccrochage de MeowCaller
- OpenClaw arrête le processus compagnon après une fenêtre bornée de 115 à 175 secondes, incluant
  les phases de connexion, réponse, lecture et arrêt de MeowCaller

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    C’est le mode opérationnel le plus propre :

    - identité WhatsApp séparée pour OpenClaw
    - listes d’autorisation DM et limites de routage plus claires
    - probabilité plus faible de confusion avec le self-chat

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
    L’onboarding prend en charge le mode numéro personnel et écrit une base compatible avec le self-chat :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    Au runtime, les protections self-chat reposent sur le numéro propre lié et `allowFrom`.

  </Accordion>

  <Accordion title="Périmètre du canal WhatsApp Web uniquement">
    Le canal de plateforme de messagerie repose sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie Twilio WhatsApp séparé dans le registre intégré des canaux de discussion.

  </Accordion>
</AccordionGroup>

## Modèle de runtime

- Gateway gère le socket WhatsApp et la boucle de reconnexion.
- Le watchdog de reconnexion utilise l’activité du transport WhatsApp Web, pas seulement le volume de messages d’application entrants, de sorte qu’une session d’appareil lié silencieuse n’est pas redémarrée uniquement parce que personne n’a envoyé de message récemment. Un plafond plus long de silence applicatif force tout de même une reconnexion si des trames de transport continuent d’arriver mais qu’aucun message d’application n’est traité pendant la fenêtre du watchdog ; après une reconnexion transitoire pour une session récemment active, ce contrôle de silence applicatif utilise le timeout normal des messages pour la première fenêtre de récupération.
- Les temporisations du socket Baileys sont explicites sous `web.whatsapp.*` : `keepAliveIntervalMs` contrôle les pings d’application WhatsApp Web, `connectTimeoutMs` contrôle le timeout de la poignée de main d’ouverture, et `defaultQueryTimeoutMs` contrôle les attentes de requête Baileys ainsi que les limites locales OpenClaw pour l’envoi/la présence sortants et les opérations d’accusé de lecture entrants.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les envois de groupe attachent des métadonnées de mention natives pour les jetons `@+<digits>` et `@<digits>` dans le texte et les légendes de médias lorsque le jeton correspond aux métadonnées actuelles des participants WhatsApp, y compris les groupes adossés à LID.
- Les discussions de statut et de diffusion sont ignorées (`@status`, `@broadcast`).
- Le watchdog de reconnexion suit l’activité du transport WhatsApp Web, pas seulement le volume de messages d’application entrants : les sessions d’appareil lié silencieuses restent actives tant que les trames de transport continuent, mais un blocage du transport force une reconnexion bien avant le chemin ultérieur de déconnexion distante.
- Les discussions directes utilisent les règles de session DM (`session.dmScope` ; la valeur par défaut `main` regroupe les DM dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Les Canaux/Newsletters WhatsApp peuvent être des cibles sortantes explicites avec leur JID natif `@newsletter`. Les envois de newsletter sortants utilisent les métadonnées de session de canal (`agent:<agentId>:whatsapp:channel:<jid>`) plutôt que la sémantique des sessions DM.
- Le transport WhatsApp Web respecte les variables d’environnement de proxy standard sur l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez la configuration de proxy au niveau de l’hôte aux paramètres de proxy WhatsApp propres au canal.
- Lorsque `messages.removeAckAfterReply` est activé, OpenClaw efface la réaction d’accusé WhatsApp après la remise d’une réponse visible.

## Prompts d’approbation

WhatsApp peut afficher les prompts d’approbation d’exec et de Plugin avec des réactions `👍` / `👎`. La livraison est
contrôlée par la configuration de transfert d’approbation de premier niveau :

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
le transport ; cela n’envoie pas de prompts d’approbation sauf si la famille d’approbation correspondante est activée
et route vers WhatsApp. Le mode session livre les approbations emoji natives uniquement pour les approbations qui
proviennent de WhatsApp. Le mode cible utilise le pipeline de transfert partagé pour les cibles WhatsApp explicites
et ne crée pas de fanout de DM d’approbateur séparé.

Les réactions d’approbation WhatsApp nécessitent des approbateurs WhatsApp explicites depuis `allowFrom` ou `"*"`.
`defaultTo` contrôle les cibles de messages ordinaires par défaut ; ce n’est pas un approbateur d’approbation. Les commandes
`/approve` manuelles passent toujours par le chemin d’autorisation normal de l’expéditeur WhatsApp avant
la résolution de l’approbation.

## Hooks de Plugin et confidentialité

Les messages entrants WhatsApp peuvent contenir le contenu personnel des messages, des numéros de téléphone,
des identifiants de groupe, des noms d’expéditeur et des champs de corrélation de session. Pour cette raison,
WhatsApp ne diffuse pas les payloads de hook entrants `message_received` aux plugins,
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

N’activez cette option que pour les plugins auxquels vous faites confiance pour recevoir le contenu
et les identifiants des messages entrants WhatsApp.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique de DM">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux discussions directes :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte les numéros au format E.164 (normalisés en interne).

    `allowFrom` est une liste de contrôle d’accès des expéditeurs de DM. Elle ne restreint pas les envois sortants explicites vers les JID de groupes WhatsApp ou les JID de canaux `@newsletter`.

    Remplacement multi-compte : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) prévaut sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les associations sont conservées dans le magasin d’autorisations du canal et fusionnées avec `allowFrom` configuré
    - l’automatisation planifiée et le fallback des destinataires Heartbeat utilisent des cibles de livraison explicites ou `allowFrom` configuré ; les approbations d’association DM ne sont pas des destinataires Cron ou Heartbeat implicites
    - si aucune allowlist n’est configurée, le numéro personnel lié est autorisé par défaut
    - OpenClaw n’associe jamais automatiquement les DM sortants `fromMe` (messages que vous vous envoyez à vous-même depuis l’appareil lié)

  </Tab>

  <Tab title="Politique de groupe + allowlists">
    L’accès aux groupes comporte deux couches :

    1. **Allowlist d’appartenance aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont éligibles
       - si `groups` est présent, il agit comme une allowlist de groupes (`"*"` autorisé)

    2. **Politique des expéditeurs de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : allowlist des expéditeurs contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque tous les messages entrants de groupe

    Fallback de l’allowlist des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution se rabat sur `allowFrom` lorsqu’il est disponible
    - les allowlists d’expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe, le fallback de la politique de groupe à l’exécution est `allowlist` (avec un journal d’avertissement), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe nécessitent une mention par défaut.

    La détection des mentions inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les motifs regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - les transcriptions de notes vocales entrantes pour les messages de groupe autorisés
    - la détection implicite des réponses au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Note de sécurité :

    - une citation/réponse satisfait uniquement le contrôle de mention ; elle n’accorde **pas** l’autorisation de l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs absents de l’allowlist restent bloqués même s’ils répondent au message d’un utilisateur présent dans l’allowlist

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de session (pas la configuration globale). Elle est réservée au propriétaire.

  </Tab>
</Tabs>

## Liaisons ACP configurées

WhatsApp prend en charge les liaisons ACP persistantes avec les entrées de premier niveau `bindings[]` :

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

- Les discussions directes correspondent aux numéros E.164 tels que `+15555550123`.
- Les groupes correspondent aux JID de groupes WhatsApp tels que `120363424282127706@g.us`.
- Les allowlists de groupes, la politique d’expéditeur et les contrôles de mention ou d’activation s’exécutent avant qu’OpenClaw ne garantisse l’existence de la session ACP configurée.
- Une liaison ACP configurée qui correspond possède la route. Les groupes de diffusion WhatsApp ne redistribuent pas ce tour aux sessions WhatsApp ordinaires.

## Comportement du numéro personnel et de l’auto-discussion

Lorsque le numéro personnel lié est également présent dans `allowFrom`, les protections d’auto-discussion WhatsApp s’activent :

- ignorer les accusés de lecture pour les tours d’auto-discussion
- ignorer le comportement de déclenchement automatique par mention-JID qui vous mentionnerait sinon vous-même
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
    Lorsque la cible de la réponse citée est un média téléchargeable, OpenClaw l’enregistre via
    le magasin de médias entrants normal et l’expose comme `MediaPath`/`MediaType` afin que
    l’agent puisse inspecter l’image référencée au lieu de voir uniquement
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholders de médias et extraction de localisation/contact">
    Les messages entrants ne contenant que des médias sont normalisés avec des placeholders tels que :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les notes vocales de groupe autorisées sont transcrites avant le contrôle de mention lorsque le
    corps est uniquement `<media:audio>`, afin que prononcer la mention du bot dans la note vocale puisse
    déclencher la réponse. Si la transcription ne mentionne toujours pas le bot, elle
    est conservée dans l’historique de groupe en attente au lieu du placeholder brut.

    Les corps de localisation utilisent un texte de coordonnées concis. Les libellés/commentaires de localisation et les détails de contact/vCard sont rendus comme des métadonnées non fiables encadrées, et non comme du texte de prompt intégré.

  </Accordion>

  <Accordion title="Injection de l’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est enfin déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - fallback : `messages.groupChat.historyLimit`
    - `0` désactive

    Marqueurs d’injection :

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Accusés de lecture">
    Les accusés de lecture sont activés par défaut pour les messages entrants WhatsApp acceptés.

    Désactivation globale :

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
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis se rabat sur un découpage sûr par longueur

  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les payloads image, vidéo, audio (note vocale PTT) et document
    - les médias audio sont envoyés via le payload `audio` de Baileys avec `ptt: true`, afin que les clients WhatsApp les affichent comme une note vocale push-to-talk
    - les payloads de réponse conservent `audioAsVoice` ; la sortie de note vocale TTS pour WhatsApp reste sur ce chemin PTT même lorsque le fournisseur renvoie du MP3 ou du WebM
    - l’audio Ogg/Opus natif est envoyé comme `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - l’audio non Ogg, y compris la sortie MP3/WebM Microsoft Edge TTS, est transcodé avec `ffmpeg` en Ogg/Opus mono 48 kHz avant la livraison PTT
    - `/tts latest` envoie la dernière réponse de l’assistant comme une seule note vocale et supprime les envois répétés pour la même réponse ; `/tts chat on|off|default` contrôle l’auto-TTS pour la discussion WhatsApp actuelle
    - la lecture des GIF animés est prise en charge via `gifPlayback: true` sur les envois vidéo
    - `forceDocument` / `asDocument` envoie les images, GIF et vidéos sortants via le payload document de Baileys pour éviter la compression des médias WhatsApp tout en conservant le nom de fichier résolu et le type MIME
    - les légendes sont appliquées au premier élément multimédia lors de l’envoi de payloads de réponse multimédias, sauf pour les notes vocales PTT, qui envoient l’audio en premier et le texte visible séparément, car les clients WhatsApp n’affichent pas les légendes de notes vocales de manière cohérente
    - la source du média peut être HTTP(S), `file://` ou des chemins locaux

  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de fallback">
    - plafond d’enregistrement des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - plafond d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement/balayage de qualité) pour respecter les limites, sauf si `forceDocument` / `asDocument` demande une livraison sous forme de document
    - en cas d’échec d’envoi de média, le fallback du premier élément envoie un avertissement textuel au lieu de supprimer silencieusement la réponse

  </Accordion>
</AccordionGroup>

## Citation de réponse

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez-la avec `channels.whatsapp.replyToMode`.

| Valeur      | Comportement                                                          |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ne cite jamais ; envoie comme message simple                          |
| `"first"`   | Cite uniquement le premier segment de réponse sortante                |
| `"all"`     | Cite chaque segment de réponse sortante                               |
| `"batched"` | Cite les réponses groupées en file d’attente tout en laissant les réponses immédiates non citées |

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

| Niveau        | Réactions d’accusé | Réactions initiées par l’agent | Description                                               |
| ------------- | ------------------ | ------------------------------ | --------------------------------------------------------- |
| `"off"`       | Non                | Non                            | Aucune réaction                                           |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (reçu avant réponse)        |
| `"minimal"`   | Oui                | Oui (conservateur)             | Accusé + réactions de l’agent avec consignes conservatrices |
| `"extensive"` | Oui                | Oui (encouragé)                | Accusé + réactions de l’agent avec consignes encourageantes |

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
Les réactions d’accusé sont contrôlées par `reactionLevel` — elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

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

- envoyé immédiatement après l’acceptation de l’entrée entrante (avant la réponse)
- si `ackReaction` est présent sans `emoji`, WhatsApp utilise l’emoji d’identité de l’agent routé, avec repli sur "👀" ; omettez `ackReaction` ou définissez `emoji: ""` pour n’envoyer aucune réaction d’accusé de réception
- les échecs sont journalisés mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit aux tours déclenchés par une mention ; l’activation de groupe `always` sert de contournement pour cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Réactions d’état du cycle de vie

Définissez `messages.statusReactions.enabled: true` pour permettre à WhatsApp de remplacer la réaction d’accusé de réception pendant un tour au lieu de laisser un emoji de reçu statique. Lorsque cette option est activée, OpenClaw utilise le même emplacement de réaction au message entrant pour les états du cycle de vie comme en file d’attente, réflexion, activité d’outil, Compaction, terminé et erreur.

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
- La réaction d’état en file d’attente utilise le même emoji d’accusé de réception effectif que les réactions d’accusé de réception simples.
- WhatsApp dispose d’un seul emplacement de réaction de bot par message, donc les mises à jour du cycle de vie remplacent la réaction actuelle sur place.
- `messages.removeAckAfterReply: true` efface la réaction d’état finale après le délai configuré pour terminé/erreur.
- Les catégories d’emoji d’outil incluent `tool`, `coding`, `web`, `deploy`, `build` et `concierge`.

## Comptes multiples et identifiants

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon le premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la recherche

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’ancienne authentification par défaut dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux de compte par défaut

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Lorsqu’un Gateway est joignable, la déconnexion arrête d’abord l’écouteur WhatsApp actif pour le compte sélectionné afin que la session liée ne continue pas à recevoir des messages jusqu’au prochain redémarrage. `openclaw channels remove --channel whatsapp` arrête aussi l’écouteur actif avant de désactiver ou de supprimer la configuration du compte.

    Dans les répertoires d’authentification hérités, `oauth.json` est conservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils d’agent inclut l’action de réaction WhatsApp (`react`).
- Garde-fous d’action :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivez via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    Symptôme : l’état du canal indique qu’il n’est pas lié.

    Correctif :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    Symptôme : compte lié avec des déconnexions répétées ou des tentatives de reconnexion.

    Les comptes silencieux peuvent rester connectés au-delà du délai normal des messages ; le watchdog
    redémarre lorsque l’activité du transport WhatsApp Web s’arrête, que le socket se ferme ou que
    l’activité au niveau de l’application reste silencieuse au-delà de la fenêtre de sécurité plus longue.

    Si les journaux affichent plusieurs fois `status=408 Request Time-out Connection was lost`, ajustez
    les délais de socket Baileys sous `web.whatsapp`. Commencez par raccourcir
    `keepAliveIntervalMs` en dessous du délai d’inactivité de votre réseau et par augmenter
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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Si la boucle persiste après correction de la connectivité de l’hôte et des délais, sauvegardez
    le répertoire d’authentification du compte et reliez ce compte :

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` indique `Gateway inactive` mais que
    `openclaw gateway status` et `openclaw channels status --probe` montrent que le
    Gateway et WhatsApp sont sains, exécutez `openclaw doctor`. Sous Linux, doctor
    avertit au sujet des anciennes entrées crontab qui invoquent encore
    `~/.openclaw/bin/ensure-whatsapp.sh` ; supprimez ces entrées obsolètes avec
    `crontab -e`, car cron peut ne pas disposer de l’environnement du bus utilisateur systemd et
    faire en sorte que cet ancien script signale à tort l’état de santé du Gateway.

    Si nécessaire, reliez avec `channels login`.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    Symptôme : `openclaw channels login --channel whatsapp` échoue avant d’afficher un code QR utilisable avec `status=408 Request Time-out` ou une déconnexion du socket TLS.

    La connexion à WhatsApp Web utilise l’environnement de proxy standard de l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minuscules et `NO_PROXY`). Vérifiez que le processus du Gateway hérite de l’environnement de proxy et que `NO_PROXY` ne correspond pas à `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Les envois sortants échouent rapidement lorsqu’aucun écouteur de Gateway actif n’existe pour le compte cible.

    Assurez-vous que le Gateway est en cours d’exécution et que le compte est lié.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Les lignes de transcription enregistrent ce que l’agent a généré. La livraison WhatsApp est vérifiée séparément : OpenClaw ne considère une réponse automatique comme envoyée qu’après que Baileys a renvoyé un identifiant de message sortant pour au moins un envoi de texte ou de média visible.

    Les réactions d’accusé de réception sont des reçus pré-réponse indépendants. Une réaction réussie ne prouve pas que la réponse texte ou média ultérieure a été acceptée par WhatsApp.

    Vérifiez les journaux du Gateway pour `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d’autorisation `groups`
    - contrôle par mention (`requireMention` + modèles de mention)
    - clés dupliquées dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, donc conservez un seul `groupPolicy` par portée

    Si `channels.whatsapp.groups` est présent, WhatsApp peut toujours observer les messages d’autres groupes, mais OpenClaw les abandonne avant le routage de session. Ajoutez le JID du groupe à `channels.whatsapp.groups` ou ajoutez `groups["*"]` pour admettre tous les groupes tout en conservant l’autorisation de l’expéditeur sous `groupPolicy` et `groupAllowFrom`.

  </Accordion>

  <Accordion title="Bun runtime warning">
    Le runtime Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible avec un fonctionnement stable du Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge les prompts système de style Telegram pour les groupes et les discussions directes via les cartes `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La carte `groups` effective est déterminée en premier : si le compte définit ses propres `groups`, elle remplace entièrement la carte `groups` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la carte unique résultante :

1. **Prompt système propre au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique existe dans la carte **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système générique de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est totalement absente de la carte, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La carte `direct` effective est déterminée en premier : si le compte définit son propre `direct`, il remplace entièrement la carte `direct` racine (pas de fusion profonde). La recherche de prompt s’exécute ensuite sur la carte unique résultante :

1. **Prompt système propre au direct** (`direct["<peerId>"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique existe dans la carte **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué.
2. **Prompt système générique de direct** (`direct["*"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique est totalement absente de la carte, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

<Note>
`dms` reste le compartiment léger de remplacement d’historique par DM (`dms.<id>.historyLimit`). Les remplacements de prompt résident sous `direct`.
</Note>

**Différence avec le comportement multi-compte de Telegram :** Dans Telegram, la racine `groups` est volontairement supprimée pour tous les comptes dans une configuration multi-compte, même les comptes qui ne définissent pas leurs propres `groups`, afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : les `groups` racine et `direct` racine sont toujours hérités par les comptes qui ne définissent pas de remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-compte, si vous voulez des prompts de groupe ou directs par compte, définissez explicitement la carte complète sous chaque compte plutôt que de vous appuyer sur des valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une carte de configuration par groupe et la liste d’autorisation des groupes au niveau de la discussion. À la portée racine ou compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- N’ajoutez un `systemPrompt` de groupe générique que lorsque vous voulez déjà que cette portée admette tous les groupes. Si vous voulez toujours que seul un ensemble fixe d’identifiants de groupe soit éligible, n’utilisez pas `groups["*"]` pour la valeur de prompt par défaut. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L’admission du groupe et l’autorisation de l’expéditeur sont des vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes qui peuvent atteindre le traitement de groupe, mais n’autorise pas à lui seul chaque expéditeur dans ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet secondaire pour les DM. `direct["*"]` fournit seulement une configuration par défaut de discussion directe après qu’un DM a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du magasin d’appairage.

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

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
