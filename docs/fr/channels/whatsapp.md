---
read_when:
    - Travail sur le comportement des canaux WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T12:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Statut : prêt pour la production via WhatsApp Web (Baileys). Le Gateway gère la ou les sessions associées ; il n’existe pas de canal WhatsApp Twilio distinct.

## Installation

`openclaw onboard` et `openclaw channels add --channel whatsapp` proposent d’installer le plugin lors de sa première sélection ; `openclaw channels login --channel whatsapp` propose le même processus d’installation si le plugin est absent. Les extractions de développement utilisent le chemin local du plugin ; les installations stables/bêta installent d’abord `@openclaw/whatsapp` depuis ClawHub, avec repli sur npm. Le runtime WhatsApp est distribué en dehors du paquet npm principal d’OpenClaw ; ses dépendances d’exécution restent donc avec le plugin externe. Installation manuelle :

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Utilisez le paquet npm seul (`@openclaw/whatsapp`) uniquement pour le repli vers le registre ; épinglez une version exacte uniquement pour une installation reproductible.

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    La politique par défaut des messages privés est l’association pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et procédures de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Configurer la politique d’accès">

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

  <Step title="Associer WhatsApp (code QR)">

```bash
openclaw channels login --channel whatsapp
```

    La connexion s’effectue uniquement par code QR. Sur les hôtes distants ou sans interface graphique, prévoyez un moyen fiable de transmettre le code QR actif au téléphone avant de lancer la connexion ; les codes QR affichés dans le terminal, les captures d’écran ou les pièces jointes de discussion peuvent expirer pendant leur transmission.

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

    Pour rattacher un répertoire d’authentification existant ou personnalisé avant la connexion :

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

  <Step title="Approuver la première demande d’association (mode association)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d’association expirent après 1 heure ; le nombre de demandes en attente est limité à 3 par compte.

  </Step>
</Steps>

<Note>
Un numéro WhatsApp distinct est recommandé (la configuration et les métadonnées sont optimisées pour ce cas), mais les configurations avec un numéro personnel ou une conversation avec soi-même sont entièrement prises en charge.
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    - identité WhatsApp distincte pour OpenClaw
    - listes d’autorisation des messages privés et limites de routage plus claires
    - risque réduit de confusion avec les conversations avec soi-même

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

  <Accordion title="Repli sur un numéro personnel">
    L’intégration initiale prend en charge le mode avec numéro personnel et écrit une configuration de référence adaptée aux conversations avec soi-même : `dmPolicy: "allowlist"`, `allowFrom` incluant votre propre numéro, `selfChatMode: true`. Les protections d’exécution pour les conversations avec soi-même reposent sur le numéro personnel associé ainsi que sur `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- Le Gateway gère le socket WhatsApp et la boucle de reconnexion.
- Un processus de surveillance suit indépendamment deux signaux : l’activité brute du transport WhatsApp Web et l’activité des messages applicatifs. Une session silencieuse mais connectée n’est pas redémarrée simplement parce qu’aucun message n’est arrivé récemment ; une reconnexion n’est forcée que lorsque les trames de transport cessent d’arriver pendant une fenêtre interne fixe (non configurable par l’utilisateur) ou lorsque les messages applicatifs restent silencieux au-delà de 4 fois le délai normal des messages. Juste après la reconnexion d’une session récemment active, cette première fenêtre utilise le délai normal des messages, plus court, au lieu de la fenêtre multipliée par 4. OpenClaw peut répondre automatiquement aux messages hors ligne que Baileys transmet au début de cette reconnexion, dans la limite de la durée de vie de la déduplication des identifiants de messages ; le démarrage initial conserve la courte protection contre l’historique obsolète.
- Les délais du socket Baileys sont définis explicitement sous `web.whatsapp.*` : `keepAliveIntervalMs` (intervalle des signaux ping de l’application), `connectTimeoutMs` (délai d’expiration de la négociation initiale), `defaultQueryTimeoutMs` (attentes des requêtes Baileys, ainsi que délais d’expiration d’OpenClaw pour les envois sortants, la présence et les accusés de lecture entrants).
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible ; sinon, ils échouent immédiatement.
- Les envois aux groupes joignent des métadonnées natives de mention pour les jetons `@+<digits>` et `@<digits>` (dans le texte et les légendes des médias) lorsque le jeton correspond aux métadonnées actuelles d’un participant, y compris dans les groupes basés sur un LID.
- Les discussions de statut et de diffusion (`@status`, `@broadcast`) sont ignorées.
- Les discussions directes utilisent les règles de session des messages privés (`session.dmScope` ; la valeur par défaut `main` regroupe les messages privés dans la session principale de l’agent). Les sessions de groupe sont isolées par JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Les canaux et newsletters WhatsApp peuvent être des cibles sortantes explicites par l’intermédiaire de leur JID `@newsletter` natif, en utilisant les métadonnées de session de canal (`agent:<agentId>:whatsapp:channel:<jid>`) plutôt que la sémantique des messages privés.
- Le transport WhatsApp Web respecte les variables d’environnement de proxy standard sur l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, ainsi que leurs variantes en minuscules). Préférez la configuration du proxy au niveau de l’hôte aux paramètres propres à chaque canal.
- Lorsque `messages.removeAckAfterReply` est activé, OpenClaw supprime la réaction d’accusé de réception dès qu’une réponse visible est remise.

## Appeler le demandeur actuel avec MeowCaller (expérimental)

Le plugin peut exposer `whatsapp_call` lors des tours d’agent provenant de WhatsApp. Il utilise [MeowCaller](https://github.com/purpshell/meowcaller) pour passer un appel vocal WhatsApp au demandeur actuellement autorisé et lire un message TTS d’OpenClaw après sa réponse. L’outil ne possède aucun paramètre de numéro de destination ; une invite ne peut donc pas rediriger l’appel. Désactivé par défaut.

<Warning>
MeowCaller est expérimental, ne possède aucune version étiquetée et utilise une session d’appareil associé whatsmeow distincte : il ne peut pas réutiliser les identifiants Baileys du plugin. L’association ajoute un autre appareil associé au même compte WhatsApp ; scannez le code avec l’identité utilisée par OpenClaw. Le mode avec numéro personnel ou conversation avec soi-même ne peut pas s’appeler lui-même ; utilisez un numéro OpenClaw dédié pour appeler votre numéro personnel.
</Warning>

<Steps>
  <Step title="Activer les appels expérimentaux">

    Ajoutez `actions.calls: true` à la configuration du canal WhatsApp et redémarrez le Gateway :

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

    Si ce paramètre est absent ou vaut `false`, OpenClaw n’expose pas l’outil `whatsapp_call`.

  </Step>

  <Step title="Installer la CLI MeowCaller vérifiée">

    L’adaptateur attend un exécutable `meowcaller` dans le `PATH` de l’hôte du Gateway. Jusqu’à la fusion de la [PR MeowCaller nº 7](https://github.com/purpshell/meowcaller/pull/7), compilez la branche vérifiée :

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Vérifiez que `$HOME/.local/bin` figure dans le `PATH` du service Gateway. Cette révision comporte des commandes explicites `pair` et `notify` d’envoi uniquement ; `notify` n’ouvre aucun microphone, haut-parleur, périphérique vidéo ni capture de diagnostic. Ne la remplacez pas par la commande `play` de l’exemple de CLI en amont.

  </Step>

  <Step title="Associer l’appareil MeowCaller">

    Demandez à l’agent WhatsApp de vérifier la configuration des appels (l’action d’état `whatsapp_call` indique le répertoire d’état propre au compte et la commande d’association). Pour le compte par défaut :

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Exécutez cette commande de manière interactive, scannez le code QR depuis **WhatsApp > Linked devices**, puis attendez `MeowCaller linked device ready`. Gardez `wa-voip.db` privé : il s’agit de la session MeowCaller. Les comptes autres que celui par défaut obtiennent leur propre chemin de stockage par l’intermédiaire de l’action d’état ; sous Windows, exécutez sa commande PowerShell.

  </Step>

  <Step title="Configurer le TTS et appeler depuis WhatsApp">

    Configurez un [fournisseur TTS](/fr/tools/tts) compatible avec la téléphonie, redémarrez le Gateway, puis envoyez une demande telle que `Call me and say the build finished.` L’outil détermine l’expéditeur à partir du contexte entrant fiable, synthétise un fichier WAV privé temporaire, exécute MeowCaller pendant une fenêtre d’appel limitée, puis supprime le fichier audio. OpenClaw transmet explicitement le stockage du compte, attend un code de sortie nul après la réponse, la lecture et le raccrochage, et considère une expiration du délai ou un code de sortie non nul comme un échec de l’appel de l’outil.

  </Step>
</Steps>

Limites : appels audio sortants individuels uniquement, aucun numéro de destination arbitraire, aucune authentification partagée avec la connexion de discussion, aucun appel vers soi-même en mode avec numéro personnel ou conversation avec soi-même, audio synthétisé limité à 60 secondes, aucun accusé d’audibilité côté combiné au-delà de l’achèvement de la réponse, de la lecture et du raccrochage par MeowCaller, et OpenClaw arrête le processus compagnon après une fenêtre limitée de 115 à 175 secondes (couvrant les phases de connexion, de réponse, de lecture et d’arrêt de MeowCaller).

## Invites d’approbation

WhatsApp peut afficher les invites d’approbation d’exécution et de plugin sous forme de réactions `👍`/`👎`, contrôlées par la configuration générale de transfert des approbations :

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

`approvals.exec` et `approvals.plugin` sont indépendants ; l’activation de WhatsApp en tant que canal associe uniquement le transport et n’envoie rien, sauf si la famille d’approbations correspondante est activée et routée vers ce canal. Le mode session transmet les approbations natives par emoji uniquement pour les approbations provenant de WhatsApp. Le mode cible utilise le pipeline de transfert partagé pour les cibles explicites et ne crée pas de diffusion distincte vers les messages privés des approbateurs.

Les réactions d’approbation WhatsApp nécessitent des approbateurs explicitement définis dans `allowFrom` (ou `"*"`). `defaultTo` définit les cibles ordinaires par défaut des messages, et non une liste d’approbateurs. Les commandes manuelles `/approve` suivent toujours le processus normal d’autorisation des expéditeurs WhatsApp avant la résolution de l’approbation.

## Hooks de plugin et confidentialité

Les messages WhatsApp entrants peuvent contenir du contenu personnel, des numéros de téléphone, des identifiants de groupe, des noms d’expéditeurs et des champs de corrélation de session. WhatsApp ne diffuse pas aux plugins les charges utiles entrantes du hook `message_received`, sauf si vous les activez explicitement :

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

Limitez l’activation à un seul compte sous `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Activez cette option uniquement pour les plugins auxquels vous faites confiance pour traiter le contenu et les identifiants WhatsApp entrants.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.whatsapp.dmPolicy` :

    | Valeur | Comportement |
    | --- | --- |
    | `pairing` (par défaut) | Les expéditeurs inconnus demandent une association ; le propriétaire l’approuve |
    | `allowlist` | Seuls les expéditeurs `allowFrom` sont admis |
    | `open` | Nécessite que `allowFrom` inclue `"*"` |
    | `disabled` | Bloquer tous les messages privés |

    `allowFrom` accepte les numéros au format E.164 (normalisés en interne). Il s’agit uniquement d’une liste de contrôle d’accès des expéditeurs de messages privés : elle ne bloque pas les envois sortants explicites vers les JID de groupe ou les JID de canal `@newsletter`.

    Remplacement pour les configurations multicomptes : `channels.whatsapp.accounts.<id>.dmPolicy` (ainsi que `.allowFrom`) prévaut sur les valeurs par défaut du canal pour ce compte.

    Remarques sur l’exécution :

    - les associations persistent dans le magasin d’autorisations du canal et fusionnent avec les `allowFrom` configurés
    - l’automatisation planifiée et le destinataire de secours du Heartbeat utilisent des cibles de livraison explicites ou les `allowFrom` configurés ; les approbations d’association par message privé ne deviennent pas implicitement des destinataires Cron/Heartbeat
    - si aucune liste d’autorisations n’est configurée, le numéro personnel associé est autorisé par défaut
    - OpenClaw n’associe jamais automatiquement les messages privés `fromMe` sortants (les messages que vous vous envoyez depuis l’appareil associé)

  </Tab>

  <Tab title="Politique de groupe et listes d’autorisations">
    L’accès aux groupes comporte deux niveaux :

    1. **Liste d’autorisations d’appartenance aux groupes** (`channels.whatsapp.groups`) : si `groups` est omis, tous les groupes sont admissibles ; s’il est présent, il agit comme une liste d’autorisations de groupes (`"*"` les autorise tous).
    2. **Politique relative aux expéditeurs de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`) : `open` contourne la liste d’autorisations des expéditeurs, `allowlist` exige une correspondance avec `groupAllowFrom` (ou `*`), `disabled` bloque tous les messages entrants de groupe.

    Si `groupAllowFrom` n’est pas défini, les vérifications des expéditeurs se rabattent sur `allowFrom` lorsqu’il contient des entrées. Les listes d’autorisations des expéditeurs sont évaluées avant l’activation par mention ou réponse.

    Si aucun bloc `channels.whatsapp` n’existe, l’exécution se rabat sur `groupPolicy: "allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est défini sur une autre valeur.

    <Note>
    La résolution de l’appartenance aux groupes dispose d’un filet de sécurité pour les configurations à compte unique : si un seul compte WhatsApp est configuré et que son `accounts.<id>.groups` est un objet explicitement vide (`{}`), il est considéré comme « non défini » et utilise à la place la table `channels.whatsapp.groups` racine, au lieu de bloquer silencieusement tous les groupes. Lorsque 2 comptes ou plus sont configurés, une table de compte explicitement vide reste vide et ne se rabat pas sur la table racine — cela permet à un compte de désactiver intentionnellement tous les groupes sans affecter les autres.
    </Note>

  </Tab>

  <Tab title="Mentions et /activation">
    Par défaut, les réponses de groupe nécessitent une mention. La détection des mentions comprend :

    - les mentions WhatsApp explicites de l’identité du bot
    - les expressions régulières de mention configurées (`agents.list[].groupChat.mentionPatterns`, avec `messages.groupChat.mentionPatterns` comme solution de repli)
    - les transcriptions des notes vocales entrantes pour les messages de groupe autorisés
    - la détection implicite des réponses au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Sécurité : une citation ou une réponse satisfait uniquement le contrôle de mention — elle **n’accorde pas** d’autorisation à l’expéditeur. Avec `groupPolicy: "allowlist"`, les expéditeurs absents de la liste d’autorisations restent bloqués, même lorsqu’ils répondent au message d’un utilisateur autorisé.

    Commande d’activation au niveau de la session : `/activation mention` ou `/activation always`. Elle met à jour l’état de la session (et non la configuration globale) et son utilisation est réservée au propriétaire.

  </Tab>
</Tabs>

## Liaisons ACP configurées

WhatsApp prend en charge les liaisons ACP persistantes via le niveau supérieur `bindings[]` :

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

Les conversations directes correspondent aux numéros E.164 ; les groupes correspondent aux JID de groupe WhatsApp. Les listes d’autorisations de groupes, la politique relative aux expéditeurs et les contrôles de mention ou d’activation sont appliqués avant qu’OpenClaw ne vérifie l’existence de la session ACP liée. Une liaison correspondante contrôle le routage — les groupes de diffusion ne distribuent pas cette interaction aux sessions WhatsApp ordinaires.

## Comportement du numéro personnel et de la conversation avec soi-même

Lorsque le numéro personnel associé figure également dans `allowFrom`, les protections de conversation avec soi-même s’activent : les accusés de lecture sont ignorés pour ces interactions, le déclenchement automatique par JID de mention qui vous notifierait vous-même est désactivé et les réponses utilisent par défaut `[{identity.name}]` (ou `[openclaw]`) lorsque `messages.responsePrefix` n’est pas défini.

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Enveloppe entrante et contexte de réponse">
    Les messages entrants sont encapsulés dans l’enveloppe entrante partagée. Une réponse citée ajoute le contexte sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les métadonnées de réponse (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 de l’expéditeur) sont renseignées lorsqu’elles sont disponibles. Si la cible citée est un média téléchargeable, OpenClaw l’enregistre dans le magasin habituel des médias entrants et expose `MediaPath`/`MediaType` afin que l’agent puisse l’examiner directement au lieu de voir uniquement `<media:image>`.

  </Accordion>

  <Accordion title="Espaces réservés aux médias et extraction des lieux et contacts">
    Les messages contenant uniquement un média sont normalisés sous forme d’espaces réservés : `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Les notes vocales de groupe autorisées sont transcrites avant le contrôle de mention lorsque le corps contient uniquement `<media:audio>`, de sorte que prononcer la mention du bot dans la note vocale peut déclencher la réponse. Si la transcription ne mentionne toujours pas le bot, elle reste dans l’historique de groupe en attente à la place de l’espace réservé brut.

    Les corps de messages de localisation s’affichent sous forme de coordonnées succinctes. Les libellés et commentaires de localisation, ainsi que les détails de contact ou de vCard, s’affichent comme des métadonnées non fiables dans un bloc délimité, et non comme du texte intégré à l’invite.

  </Accordion>

  <Accordion title="Injection de l’historique de groupe en attente">
    Les messages de groupe non traités sont mis en mémoire tampon, puis injectés comme contexte lorsque le bot est finalement déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`, avec `messages.groupChat.historyLimit` comme solution de repli
    - `0` désactive cette fonctionnalité

    Marqueurs d’injection : `[Chat messages since your last reply - for context]` et `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Accusés de lecture">
    Activés par défaut pour les messages entrants acceptés. Pour les désactiver globalement :

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Remplacement par compte : `channels.whatsapp.accounts.<id>.sendReadReceipts`. Les interactions de conversation avec soi-même ignorent les accusés de lecture, même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, découpage et médias

<AccordionGroup>
  <Accordion title="Découpage du texte">
    - limite de découpage par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"` ; `newline` privilégie les limites de paragraphes (lignes vides), puis se rabat sur un découpage respectant la limite de longueur

  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles d’image, de vidéo, d’audio (note vocale PTT) et de document
    - l’audio est envoyé comme charge utile Baileys `audio` avec `ptt: true`, ce qui l’affiche comme une note vocale « push-to-talk » ; `audioAsVoice` est conservé dans les charges utiles de réponse afin que les notes vocales produites par synthèse vocale restent sur ce chemin, quel que soit le format source du fournisseur
    - l’audio Ogg/Opus natif est envoyé comme `audio/ogg; codecs=opus` ; tout autre format (y compris les sorties MP3/WebM de la synthèse vocale Microsoft Edge) est transcodé avec `ffmpeg` en Ogg/Opus mono à 48 kHz avant la livraison PTT
    - `/tts latest` envoie la dernière réponse de l’assistant sous forme d’une seule note vocale et empêche les envois répétés de la même réponse ; `/tts chat on|off|default` contrôle la synthèse vocale automatique pour la conversation actuelle
    - l’activation de `gifPlayback: true` sur une vidéo permet la lecture en GIF animé
    - `forceDocument`/`asDocument` achemine les images, GIF et vidéos sortants via la charge utile de document Baileys afin d’éviter la compression des médias par WhatsApp, tout en conservant le nom de fichier résolu et le type MIME
    - les légendes s’appliquent au premier média d’une réponse multimédia, sauf pour les notes vocales PTT : l’audio est envoyé en premier sans légende, puis la légende est envoyée dans un message texte distinct (les clients WhatsApp n’affichent pas les légendes des notes vocales de manière cohérente)
    - la source du média peut être HTTP(S), `file://` ou un chemin local

  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de secours">
    - limite d’enregistrement entrant et limite d’envoi sortant : `channels.whatsapp.mediaMaxMb` (valeur par défaut : `50`)
    - remplacement par compte : `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement et ajustement progressif de la qualité) pour respecter les limites, sauf si `forceDocument`/`asDocument` demande une livraison sous forme de document
    - en cas d’échec d’envoi d’un média, la solution de secours pour le premier élément envoie un avertissement textuel au lieu d’abandonner silencieusement la réponse

  </Accordion>
</AccordionGroup>

## Citation des réponses

`channels.whatsapp.replyToMode` contrôle la citation native des réponses (les réponses sortantes citent visiblement le message entrant) :

| Valeur             | Comportement                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (par défaut) | Ne jamais citer ; envoyer comme un message ordinaire                           |
| `"first"`         | Citer uniquement le premier fragment de réponse sortant                      |
| `"all"`           | Citer chaque fragment de réponse sortant                               |
| `"batched"`       | Citer les réponses groupées en file d’attente ; laisser les réponses immédiates sans citation |

Remplacement par compte : `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Niveau de réaction

`channels.whatsapp.reactionLevel` contrôle l’étendue de l’utilisation des réactions emoji par l’agent :

| Niveau                 | Réactions d’accusé de réception | Réactions initiées par l’agent  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Non            | Non                         |
| `"ack"`               | Oui           | Non                         |
| `"minimal"` (par défaut) | Oui           | Oui, consignes prudentes |
| `"extensive"`         | Oui           | Oui, consignes favorables   |

Remplacement par compte : `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Réactions d’accusé de réception

`channels.whatsapp.ackReaction` envoie une réaction immédiate à la réception d’un message entrant, sous le contrôle de `reactionLevel` (supprimée lorsque `"off"`) :

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // toujours | mentions | jamais
      },
    },
  },
}
```

Remarques : envoyée immédiatement après l’acceptation du message entrant (avant la réponse) ; si `ackReaction` est présent sans `emoji`, WhatsApp utilise l’emoji d’identité de l’agent destinataire, avec « 👀 » comme valeur de secours (omettez `ackReaction` ou définissez `emoji: ""` pour désactiver l’accusé de réception) ; les échecs sont consignés dans les journaux, mais ne bloquent pas la livraison de la réponse ; le mode de groupe `mentions` ne réagit qu’aux interactions déclenchées par une mention, tandis que l’activation de groupe `always` contourne cette vérification ; WhatsApp utilise uniquement `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` ne s’applique pas ici).

## Réactions d’état du cycle de vie

Définissez `messages.statusReactions.enabled: true` pour permettre à WhatsApp de remplacer la réaction d’accusé de réception au cours d’une interaction, au lieu de conserver un emoji de réception statique, en parcourant des états tels que mise en file d’attente, réflexion, activité des outils, Compaction, terminé et erreur :

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

Remarques : `channels.whatsapp.ackReaction` contrôle toujours l’admissibilité pour les messages privés et les groupes ; l’état de mise en file d’attente utilise le même emoji effectif que les réactions ordinaires d’accusé de réception ; WhatsApp dispose d’un seul emplacement de réaction du bot par message, les mises à jour du cycle de vie remplacent donc la réaction actuelle sur place ; `messages.removeAckAfterReply: true` efface la réaction d’état finale après la durée de maintien configurée pour la réussite ou l’erreur ; les catégories d’emoji d’outils comprennent `tool`, `coding`, `web`, `deploy`, `build` et `concierge`.

## Comptes multiples et identifiants

<AccordionGroup>
  <Accordion title="Sélection des comptes et valeurs par défaut">
    Les identifiants de compte proviennent de `channels.whatsapp.accounts`. Le compte sélectionné par défaut est `default` s’il est présent, sinon le premier identifiant de compte configuré (trié par ordre alphabétique). Les identifiants de compte sont normalisés en interne pour la recherche.
  </Accordion>

  <Accordion title="Chemins des identifiants d’authentification et compatibilité avec les anciennes versions">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (sauvegarde : `creds.json.bak`)
    - l’ancienne authentification par défaut dans `~/.openclaw/credentials/` est toujours reconnue et migrée pour les flux du compte par défaut

  </Accordion>

  <Accordion title="Comportement lors de la déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp de ce compte. Lorsqu’un Gateway est joignable, la déconnexion arrête d’abord l’écouteur actif de ce compte, afin que la session liée cesse de recevoir des messages avant le prochain redémarrage. `openclaw channels remove --channel whatsapp` arrête également l’écouteur actif avant de désactiver ou de supprimer la configuration du compte.

    Dans les anciens répertoires d’authentification, `oauth.json` est conservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils de l’agent inclut l’action de réaction WhatsApp (`react`).
- Contrôles des actions : `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (les actions existantes utilisent par défaut `true`), `channels.whatsapp.actions.calls` (valeur par défaut : `false`, voir MeowCaller ci-dessus).
- Les écritures de configuration initiées par le canal sont activées par défaut ; désactivez-les via `channels.whatsapp.configWrites: false`.

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (code QR requis)">
    Symptôme : l’état du canal indique qu’il n’est pas lié.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Lié, mais déconnecté ou en boucle de reconnexion">
    Symptôme : le compte lié subit des déconnexions ou des tentatives de reconnexion répétées.

    Les comptes silencieux peuvent rester connectés au-delà du délai d’expiration normal des messages ; le mécanisme de surveillance ne redémarre que lorsque l’activité du transport WhatsApp Web s’arrête, que le socket se ferme ou que l’activité au niveau de l’application reste silencieuse au-delà de la fenêtre de sécurité plus longue (voir le modèle d’exécution ci-dessus).

    Si les journaux affichent `status=408 Request Time-out Connection was lost` de manière répétée, ajustez les délais du socket Baileys sous `web.whatsapp`. Commencez par réduire `keepAliveIntervalMs` en dessous du délai d’inactivité de votre réseau et par augmenter `connectTimeoutMs` sur les connexions lentes ou sujettes aux pertes :

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

    Si la boucle persiste après la correction de la connectivité de l’hôte et des délais, sauvegardez le répertoire d’authentification du compte et rétablissez la liaison :

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Si `~/.openclaw/logs/whatsapp-health.log` indique `Gateway inactive`, mais que `openclaw gateway status` et `openclaw channels status --probe` indiquent tous deux un état sain, exécutez `openclaw doctor`. Sous Linux, doctor avertit de la présence d’anciennes entrées crontab qui appellent le script retiré `~/.openclaw/bin/ensure-whatsapp.sh` ; supprimez ces entrées avec `crontab -e` — Cron peut ne pas disposer de l’environnement du bus utilisateur systemd, ce qui amène cet ancien script à signaler incorrectement l’état du Gateway.

  </Accordion>

  <Accordion title="Expiration de la connexion par code QR derrière un proxy">
    Symptôme : `openclaw channels login --channel whatsapp` échoue avant d’afficher un code QR utilisable, avec `status=408 Request Time-out` ou une déconnexion du socket TLS.

    La connexion à WhatsApp Web utilise l’environnement de proxy standard de l’hôte du Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, variantes en minuscules, `NO_PROXY`). Vérifiez que le processus du Gateway hérite de l’environnement du proxy et que `NO_PROXY` ne correspond pas à `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l’envoi">
    Les envois sortants échouent immédiatement lorsqu’aucun écouteur actif du Gateway n’existe pour le compte cible. Vérifiez que le Gateway est en cours d’exécution et que le compte est lié.
  </Accordion>

  <Accordion title="La réponse apparaît dans la transcription, mais pas dans WhatsApp">
    Les lignes de la transcription enregistrent ce que l’agent a généré ; la livraison WhatsApp est vérifiée séparément. OpenClaw considère une réponse automatique comme envoyée uniquement après que Baileys a renvoyé un identifiant de message sortant pour au moins un envoi visible de texte ou de média.

    Les réactions d’accusé de réception sont des reçus indépendants envoyés avant la réponse — une réaction réussie ne prouve pas que la réponse ultérieure contenant du texte ou un média a été acceptée. Recherchez `auto-reply delivery failed` ou `auto-reply was not accepted by WhatsApp provider` dans les journaux du Gateway.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre : `groupPolicy`, `groupAllowFrom`/`allowFrom`, les entrées de la liste d’autorisation `groups`, le contrôle des mentions (`requireMention` + motifs de mention) et les clés en double dans `openclaw.json` (les entrées JSON5 ultérieures remplacent les précédentes — conservez un seul `groupPolicy` par portée).

    Si `channels.whatsapp.groups` est présent, WhatsApp peut toujours observer les messages d’autres groupes, mais OpenClaw les ignore avant le routage de session. Ajoutez le JID du groupe à `channels.whatsapp.groups`, ou ajoutez `groups["*"]` pour autoriser tous les groupes tout en conservant l’autorisation des expéditeurs sous `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Avertissement relatif à l’environnement d’exécution Bun">
    Les Gateway OpenClaw nécessitent Node. Bun ne fournit pas l’API `node:sqlite` utilisée par le magasin d’état canonique, et doctor migre les anciens services Bun vers Node.
  </Accordion>
</AccordionGroup>

## Invites système

WhatsApp prend en charge les invites système de type Telegram pour les groupes et les discussions directes via les tables `groups` et `direct`.

Résolution pour les messages de groupe : la table `groups` effective est d’abord déterminée — si le compte définit sa propre clé `groups`, elle remplace entièrement la table racine `groups` (sans fusion profonde). La recherche de l’invite s’effectue ensuite sur cette unique table résultante :

1. **Invite propre au groupe** (`groups["<groupId>"].systemPrompt`) : utilisée lorsque l’entrée du groupe existe **et** que sa clé `systemPrompt` est définie. Une chaîne vide (`""`) désactive le caractère générique et n’applique aucune invite.
2. **Invite générique des groupes** (`groups["*"].systemPrompt`) : utilisée lorsque l’entrée du groupe concerné est absente ou existe sans clé `systemPrompt`.

La résolution des messages directs suit le même modèle pour la table `direct` et `direct["*"]`.

<Note>
`dms` reste le conteneur léger de remplacement de l’historique propre à chaque message direct (`dms.<id>.historyLimit`). Les remplacements d’invite se trouvent sous `direct`.
</Note>

<Note>
Ce comportement où le compte remplace la racine pour la résolution des invites est un simple remplacement superficiel : toute clé de compte `groups`/`direct`, y compris un objet vide explicite, remplace la table racine. Il diffère de la vérification de la liste d’autorisation d’appartenance aux groupes décrite ci-dessus, qui dispose d’un filet de sécurité pour les configurations à compte unique lorsqu’un `groups: {}` est accidentellement vide.
</Note>

**Différence avec Telegram :** Telegram ignore la valeur racine `groups` pour chaque compte d’une configuration multicomptes (même pour les comptes qui ne possèdent aucun `groups`) afin d’empêcher un bot de recevoir des messages provenant de groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection — les valeurs racines `groups`/`direct` sont héritées par tout compte sans remplacement propre, quel que soit le nombre de comptes. Dans une configuration WhatsApp multicomptes, définissez explicitement la table complète sous chaque compte si vous souhaitez des invites propres à chaque compte.

Comportements importants :

- `channels.whatsapp.groups` est à la fois une table de configuration propre à chaque groupe et la liste d’autorisation des groupes au niveau de la discussion. À la portée racine ou à celle du compte, `groups["*"]` signifie « tous les groupes sont autorisés » pour cette portée.
- N’ajoutez un caractère générique `systemPrompt` que si vous souhaitez déjà autoriser tous les groupes pour cette portée. Pour limiter l’admissibilité à un ensemble fixe d’identifiants de groupe, répétez l’invite dans chaque entrée explicitement autorisée au lieu d’utiliser `groups["*"]`.
- L’admission des groupes et l’autorisation des expéditeurs sont deux vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes qui atteignent le traitement des groupes ; il n’autorise pas tous les expéditeurs de ces groupes — cela reste contrôlé par `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` n’a aucun effet secondaire équivalent pour les messages directs : `direct["*"]` fournit uniquement une configuration par défaut après qu’un message direct a déjà été admis par `dmPolicy` ainsi que par `allowFrom` ou les règles du magasin de liaisons.

Exemple :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // À utiliser uniquement si tous les groupes doivent être autorisés à la portée racine.
        // S’applique à tous les comptes qui ne définissent pas leur propre table de groupes.
        "*": { systemPrompt: "Invite par défaut pour tous les groupes." },
      },
      direct: {
        // S’applique à tous les comptes qui ne définissent pas leur propre table de discussions directes.
        "*": { systemPrompt: "Invite par défaut pour toutes les discussions directes." },
      },
      accounts: {
        work: {
          groups: {
            // Ce compte définit ses propres groupes ; les groupes racines sont donc entièrement
            // remplacés. Pour conserver un caractère générique, définissez aussi explicitement "*" ici.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Se concentrer sur la gestion de projet.",
            },
            // À utiliser uniquement si tous les groupes doivent être autorisés pour ce compte.
            "*": { systemPrompt: "Invite par défaut pour les groupes professionnels." },
          },
          direct: {
            // Ce compte définit sa propre table de discussions directes ; les entrées directes racines sont donc
            // entièrement remplacées. Pour conserver un caractère générique, définissez aussi explicitement "*" ici.
            "+15551234567": { systemPrompt: "Invite pour une discussion professionnelle directe spécifique." },
            "*": { systemPrompt: "Invite par défaut pour les discussions professionnelles directes." },
          },
        },
      },
    },
  },
}
```

## Renvois vers la référence de configuration

Référence principale : [Référence de configuration - WhatsApp](/fr/gateway/config-channels#whatsapp)

| Domaine                  | Champs                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Accès                    | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Livraison                | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Multicomptes             | `accounts.<id>.enabled`, `accounts.<id>.authDir` et autres remplacements propres à chaque compte                              |
| Opérations               | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportement des sessions | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Invites                  | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Pages connexes

- [Liaison](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
