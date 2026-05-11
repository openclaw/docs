---
read_when:
    - Configurer la prise en charge d’iMessage
    - Débogage de l’envoi/réception iMessage
summary: Prise en charge native d’iMessage via imsg (JSON-RPC sur stdio), avec des actions d’API privée pour les réponses, les tapbacks, les effets, les pièces jointes et la gestion des groupes. Recommandé pour les nouvelles configurations OpenClaw iMessage lorsque les exigences de l’hôte sont satisfaites.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Pour les déploiements OpenClaw iMessage, utilisez `imsg` sur un hôte macOS Messages connecté. Si votre Gateway s’exécute sous Linux ou Windows, faites pointer `channels.imessage.cliPath` vers un wrapper SSH qui exécute `imsg` sur le Mac.

**Le rattrapage après indisponibilité du Gateway est facultatif.** Lorsqu’il est activé (`channels.imessage.catchup.enabled: true`), le Gateway relit au démarrage suivant les messages entrants arrivés dans `chat.db` pendant qu’il était hors ligne (crash, redémarrage, mise en veille du Mac). Désactivé par défaut — voir [Rattrapage après indisponibilité du Gateway](#catching-up-after-gateway-downtime). Clôt [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
La prise en charge de BlueBubbles a été supprimée. Migrez les configurations `channels.bluebubbles` vers `channels.imessage` ; OpenClaw prend en charge iMessage uniquement via `imsg`. Commencez par [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) pour la courte annonce, ou [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles) pour le tableau de migration complet.
</Warning>

Statut : intégration CLI externe native. Le Gateway lance `imsg rpc` et communique en JSON-RPC sur stdio (pas de démon/port séparé). Les actions avancées nécessitent `imsg launch` et une sonde d’API privée réussie.

<CardGroup cols={3}>
  <Card title="Actions d’API privée" icon="wand-sparkles" href="#private-api-actions">
    Réponses, tapbacks, effets, pièces jointes et gestion de groupes.
  </Card>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les MP iMessage utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Mac distant" icon="terminal" href="#remote-mac-over-ssh">
    Utilisez un wrapper SSH lorsque le Gateway ne s’exécute pas sur le Mac Messages.
  </Card>
  <Card title="Référence de configuration" icon="settings" href="/fr/gateway/config-channels#imessage">
    Référence complète des champs iMessage.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Mac local (chemin rapide)">
    <Steps>
      <Step title="Installer et vérifier imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configurer OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Démarrer le Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approuver le premier appairage de MP (dmPolicy par défaut)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Les demandes d’appairage expirent après 1 heure.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac distant via SSH">
    OpenClaw ne nécessite qu’un `cliPath` compatible stdio ; vous pouvez donc faire pointer `cliPath` vers un script wrapper qui se connecte en SSH à un Mac distant et exécute `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuration recommandée lorsque les pièces jointes sont activées :

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` n’est pas défini, OpenClaw tente de le détecter automatiquement en analysant le script wrapper SSH.
    `remoteHost` doit être `host` ou `user@host` (sans espaces ni options SSH).
    OpenClaw utilise une vérification stricte des clés d’hôte pour SCP ; la clé d’hôte du relais doit donc déjà exister dans `~/.ssh/known_hosts`.
    Les chemins des pièces jointes sont validés par rapport aux racines autorisées (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Exigences et autorisations (macOS)

- Messages doit être connecté sur le Mac exécutant `imsg`.
- L’accès complet au disque est requis pour le contexte de processus exécutant OpenClaw/`imsg` (accès à la base de données Messages).
- L’autorisation d’automatisation est requise pour envoyer des messages via Messages.app.
- Pour les actions avancées (réagir / modifier / annuler l’envoi / réponse en fil / effets / opérations de groupe), la protection de l’intégrité du système doit être désactivée — voir [Activation de l’API privée imsg](#enabling-the-imsg-private-api) ci-dessous. L’envoi/réception de texte et de médias de base fonctionne sans cela.

<Tip>
Les autorisations sont accordées par contexte de processus. Si le Gateway s’exécute sans interface (LaunchAgent/SSH), exécutez une commande interactive unique dans ce même contexte pour déclencher les invites :

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Activation de l’API privée imsg

`imsg` est fourni avec deux modes opérationnels :

- **Mode de base** (par défaut, aucune modification de SIP requise) : texte et médias sortants via `send`, surveillance/historique entrants, liste des discussions. C’est ce que vous obtenez immédiatement avec une nouvelle installation `brew install steipete/tap/imsg` plus les autorisations macOS standard ci-dessus.
- **Mode API privée** : `imsg` injecte une dylib d’assistance dans `Messages.app` pour appeler les fonctions internes `IMCore`. C’est ce qui déverrouille `react`, `edit`, `unsend`, `reply` (en fil), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ainsi que les indicateurs de saisie et les accusés de lecture.

Pour accéder à la surface d’actions avancées documentée par cette page de canal, vous avez besoin du mode API privée. Le README de `imsg` est explicite sur l’exigence :

> Les fonctionnalités avancées telles que `read`, `typing`, `launch`, l’envoi enrichi adossé au pont, la mutation de messages et la gestion des discussions sont facultatives. Elles nécessitent que SIP soit désactivé et qu’une dylib d’assistance soit injectée dans `Messages.app`. `imsg launch` refuse d’injecter lorsque SIP est activé.

La technique d’injection de l’assistant utilise la propre dylib de `imsg` pour accéder aux API privées de Messages. Il n’y a pas de serveur tiers ni de runtime BlueBubbles dans le chemin OpenClaw iMessage.

<Warning>
**Désactiver SIP est un véritable compromis de sécurité.** SIP est l’une des protections centrales de macOS contre l’exécution de code système modifié ; le désactiver à l’échelle du système ouvre une surface d’attaque supplémentaire et peut avoir des effets de bord. Notamment, **désactiver SIP sur les Mac Apple Silicon désactive aussi la possibilité d’installer et d’exécuter des apps iOS sur votre Mac**.

Traitez cela comme un choix opérationnel délibéré, et non comme un choix par défaut. Si votre modèle de menace ne peut pas tolérer que SIP soit désactivé, l’iMessage intégré est limité au mode de base — envoi/réception de texte et de médias uniquement, sans réactions / modification / annulation d’envoi / effets / opérations de groupe.
</Warning>

### Configuration

1. **Installez (ou mettez à niveau) `imsg`** sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La sortie de `imsg status --json` indique `bridge_version`, `rpc_methods` et les `selectors` par méthode afin que vous puissiez voir ce que la version actuelle prend en charge avant de commencer.

2. **Désactivez la protection de l’intégrité du système.** Cela dépend de la version de macOS, car l’exigence Apple sous-jacente varie selon le système d’exploitation et le matériel :
   - **macOS 10.13–10.15 (Sierra–Catalina) :** désactivez Library Validation via Terminal, redémarrez en mode de récupération, exécutez `csrutil disable`, puis redémarrez.
   - **macOS 11+ (Big Sur et versions ultérieures), Intel :** mode de récupération (ou récupération par Internet), `csrutil disable`, puis redémarrage.
   - **macOS 11+, Apple Silicon :** séquence de démarrage avec le bouton d’alimentation pour entrer en récupération ; sur les versions récentes de macOS, maintenez la touche **Maj gauche** lorsque vous cliquez sur Continuer, puis `csrutil disable`. Les configurations de machine virtuelle suivent un flux distinct — prenez d’abord un instantané de VM.
   - **macOS 26 / Tahoe :** les politiques de validation des bibliothèques et les vérifications d’autorisations privées `imagent` se sont encore renforcées ; `imsg` peut nécessiter une version mise à jour pour suivre. Si l’injection `imsg launch` ou certains `selectors` commencent à retourner false après une mise à niveau majeure de macOS, consultez les notes de version de `imsg` avant de supposer que l’étape SIP a réussi.

   Suivez le flux Apple du mode de récupération pour votre Mac afin de désactiver SIP avant d’exécuter `imsg launch`.

3. **Injectez l’assistant.** Avec SIP désactivé et Messages.app connecté :

   ```bash
   imsg launch
   ```

   `imsg launch` refuse d’injecter lorsque SIP est encore activé ; cela sert donc aussi de confirmation que l’étape 2 a bien pris effet.

4. **Vérifiez le pont depuis OpenClaw :**

   ```bash
   openclaw channels status --probe
   ```

   L’entrée iMessage devrait indiquer `works`, et `imsg status --json | jq '.selectors'` devrait afficher `retractMessagePart: true` ainsi que les sélecteurs de modification / saisie / lecture exposés par votre build macOS. Le filtrage par méthode du Plugin OpenClaw dans `actions.ts` n’annonce que les actions dont le sélecteur sous-jacent vaut `true` ; la surface d’actions visible dans la liste d’outils de l’agent reflète donc ce que le pont peut réellement faire sur cet hôte.

Si `openclaw channels status --probe` signale le canal comme `works` mais que des actions spécifiques lèvent "iMessage `<action>` requires the imsg private API bridge" au moment de la distribution, exécutez à nouveau `imsg launch` — l’assistant peut disparaître (redémarrage de Messages.app, mise à jour de l’OS, etc.) et le statut mis en cache `available: true` continuera d’annoncer les actions jusqu’à ce que la sonde suivante le rafraîchisse.

### Lorsque vous ne pouvez pas désactiver SIP

Si la désactivation de SIP n’est pas acceptable pour votre modèle de menace :

- `imsg` revient au mode de base — texte + médias + réception uniquement.
- Le Plugin OpenClaw annonce toujours l’envoi texte/média et la surveillance entrante ; il masque simplement `react`, `edit`, `unsend`, `reply`, `sendWithEffect` et les opérations de groupe dans la surface d’actions (conformément au filtre de capacité par méthode).
- Vous pouvez exécuter un Mac non Apple Silicon séparé (ou un Mac de bot dédié) avec SIP désactivé pour la charge de travail iMessage, tout en gardant SIP activé sur vos appareils principaux. Voir [Utilisateur macOS de bot dédié (identité iMessage séparée)](#deployment-patterns) ci-dessous.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des MP">
    `channels.imessage.dmPolicy` contrôle les messages directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    Champ de liste d’autorisation : `channels.imessage.allowFrom`.

    Les entrées de liste d’autorisation peuvent être des handles, des groupes d’accès d’expéditeur statiques (`accessGroup:<name>`) ou des cibles de discussion (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Politique de groupe + mentions">
    `channels.imessage.groupPolicy` contrôle la gestion des groupes :

    - `allowlist` (par défaut lorsqu’elle est configurée)
    - `open`
    - `disabled`

    Liste d’autorisation des expéditeurs de groupe : `channels.imessage.groupAllowFrom`.

    Les entrées `groupAllowFrom` peuvent également référencer des groupes d’accès d’expéditeur statiques (`accessGroup:<name>`).

    Repli à l’exécution : si `groupAllowFrom` n’est pas défini, les vérifications des expéditeurs de groupe iMessage se replient sur `allowFrom` lorsqu’il est disponible.
    Note d’exécution : si `channels.imessage` est complètement absent, le runtime se replie sur `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    <Warning>
    Le routage de groupe comporte **deux** barrières de liste d’autorisation exécutées l’une après l’autre, et les deux doivent réussir :

    1. **Liste d’autorisation d’expéditeur / cible de discussion** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` ou `chat_id`.
    2. **Registre de groupes** (`channels.imessage.groups`) — avec `groupPolicy: "allowlist"`, cette barrière nécessite soit une entrée générique `groups: { "*": { ... } }` (définit `allowAll = true`), soit une entrée explicite par `chat_id` sous `groups`.

    Si la barrière 2 ne contient rien, chaque message de groupe est ignoré. Le Plugin émet deux signaux de niveau `warn` au niveau de journalisation par défaut :

    - une fois par compte au démarrage : `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - une fois par `chat_id` à l’exécution : `imessage: dropping group message from chat_id=<id> ...`

    Les MP continuent de fonctionner, car ils empruntent un chemin de code différent.

    Configuration minimale pour que les groupes continuent de circuler avec `groupPolicy: "allowlist"` :

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Si ces lignes `warn` apparaissent dans le journal du Gateway, la porte 2 rejette — ajoutez le bloc `groups`.
    </Warning>

    Mentionnez le filtrage pour les groupes :

    - iMessage n’a pas de métadonnées de mention natives
    - la détection des mentions utilise des motifs regex (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - sans motifs configurés, le filtrage par mention ne peut pas être appliqué

    Les commandes de contrôle provenant d’expéditeurs autorisés peuvent contourner le filtrage par mention dans les groupes.

    `systemPrompt` par groupe :

    Chaque entrée sous `channels.imessage.groups.*` accepte une chaîne `systemPrompt` facultative. La valeur est injectée dans le prompt système de l’agent à chaque tour qui traite un message dans ce groupe. La résolution reprend celle utilisée pour les prompts par groupe de `channels.whatsapp.groups` :

    1. **Prompt système propre au groupe** (`groups["<chat_id>"].systemPrompt`) : utilisé lorsque l’entrée du groupe concerné existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le joker est supprimé et aucun prompt système n’est appliqué à ce groupe.
    2. **Prompt système joker de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe concerné est totalement absente de la map, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Les prompts par groupe s’appliquent uniquement aux messages de groupe — les messages directs dans ce canal ne sont pas affectés.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Les MP utilisent le routage direct ; les groupes utilisent le routage de groupe.
    - Avec `session.dmScope=main` par défaut, les MP iMessage sont regroupés dans la session principale de l’agent.
    - Les sessions de groupe sont isolées (`agent:<agentId>:imessage:group:<chat_id>`).
    - Les réponses sont routées vers iMessage à l’aide des métadonnées de canal/cible d’origine.

    Comportement des fils proches d’un groupe :

    Certains fils iMessage à plusieurs participants peuvent arriver avec `is_group=false`.
    Si ce `chat_id` est explicitement configuré sous `channels.imessage.groups`, OpenClaw le traite comme du trafic de groupe (filtrage de groupe + isolation de session de groupe).

  </Tab>
</Tabs>

## Liaisons de conversation ACP

Les discussions iMessage héritées peuvent aussi être liées à des sessions ACP.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le MP ou la discussion de groupe autorisée.
- Les futurs messages de cette même conversation iMessage sont routés vers la session ACP créée.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont prises en charge via des entrées `bindings[]` de premier niveau avec `type: "acp"` et `match.channel: "imessage"`.

`match.peer.id` peut utiliser :

- un identifiant de MP normalisé tel que `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recommandé pour des liaisons de groupe stables)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Exemple :

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Consultez [Agents ACP](/fr/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Utilisez un identifiant Apple ID dédié et un utilisateur macOS dédié afin que le trafic du bot soit isolé de votre profil Messages personnel.

    Flux type :

    1. Créez/ouvrez une session avec un utilisateur macOS dédié.
    2. Connectez-vous à Messages avec l’identifiant Apple ID du bot dans cet utilisateur.
    3. Installez `imsg` dans cet utilisateur.
    4. Créez un wrapper SSH afin qu’OpenClaw puisse exécuter `imsg` dans le contexte de cet utilisateur.
    5. Faites pointer `channels.imessage.accounts.<id>.cliPath` et `.dbPath` vers ce profil utilisateur.

    La première exécution peut nécessiter des approbations dans l’interface graphique (Automation + Full Disk Access) dans la session utilisateur du bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologie courante :

    - le Gateway s’exécute sur Linux/VM
    - iMessage + `imsg` s’exécutent sur un Mac dans votre tailnet
    - le wrapper `cliPath` utilise SSH pour exécuter `imsg`
    - `remoteHost` active les récupérations de pièces jointes via SCP

    Exemple :

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Utilisez des clés SSH afin que SSH et SCP soient tous deux non interactifs.
    Assurez-vous d’abord que la clé de l’hôte est approuvée (par exemple `ssh bot@mac-mini.tailnet-1234.ts.net`) afin que `known_hosts` soit renseigné.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage prend en charge la configuration par compte sous `channels.imessage.accounts`.

    Chaque compte peut remplacer des champs tels que `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, les paramètres d’historique et les allowlists de racines de pièces jointes.

  </Accordion>
</AccordionGroup>

## Médias, découpage et cibles de livraison

<AccordionGroup>
  <Accordion title="Attachments and media">
    - l’ingestion des pièces jointes entrantes est **désactivée par défaut** — définissez `channels.imessage.includeAttachments: true` pour transférer les photos, mémos vocaux, vidéos et autres pièces jointes à l’agent. Lorsqu’elle est désactivée, les iMessages contenant uniquement une pièce jointe sont ignorés avant d’atteindre l’agent et peuvent ne produire aucune ligne de journal `Inbound message`.
    - les chemins de pièces jointes distantes peuvent être récupérés via SCP lorsque `remoteHost` est défini
    - les chemins de pièces jointes doivent correspondre aux racines autorisées :
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP distant)
      - motif de racine par défaut : `/Users/*/Library/Messages/Attachments`
    - SCP utilise une vérification stricte de la clé d’hôte (`StrictHostKeyChecking=yes`)
    - la taille des médias sortants utilise `channels.imessage.mediaMaxMb` (16 Mo par défaut)

  </Accordion>

  <Accordion title="Outbound chunking">
    - limite de segment de texte : `channels.imessage.textChunkLimit` (4000 par défaut)
    - mode de découpage : `channels.imessage.chunkMode`
      - `length` (par défaut)
      - `newline` (découpage en donnant la priorité aux paragraphes)

  </Accordion>

  <Accordion title="Addressing formats">
    Cibles explicites recommandées :

    - `chat_id:123` (recommandé pour un routage stable)
    - `chat_guid:...`
    - `chat_identifier:...`

    Les cibles par identifiant sont également prises en charge :

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Actions d’API privée

Lorsque `imsg launch` est en cours d’exécution et que `openclaw channels status --probe` signale `privateApi.available: true`, l’outil de messagerie peut utiliser des actions natives iMessage en plus des envois de texte normaux.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react** : ajoute/supprime des tapbacks iMessage (`messageId`, `emoji`, `remove`). Les tapbacks pris en charge correspondent à love, like, dislike, laugh, emphasize et question.
    - **reply** : envoie une réponse en fil à un message existant (`messageId`, `text` ou `message`, plus `chatGuid`, `chatId`, `chatIdentifier` ou `to`).
    - **sendWithEffect** : envoie du texte avec un effet iMessage (`text` ou `message`, `effect` ou `effectId`).
    - **edit** : modifie un message envoyé sur les versions macOS/API privée prises en charge (`messageId`, `text` ou `newText`).
    - **unsend** : rétracte un message envoyé sur les versions macOS/API privée prises en charge (`messageId`).
    - **upload-file** : envoie des médias/fichiers (`buffer` en base64 ou un `media`/`path`/`filePath` hydraté, `filename`, `asVoice` facultatif). Alias hérité : `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup** : gère les discussions de groupe lorsque la cible actuelle est une conversation de groupe.

  </Accordion>

  <Accordion title="Message IDs">
    Le contexte iMessage entrant inclut à la fois des valeurs `MessageSid` courtes et des GUID de message complets lorsqu’ils sont disponibles. Les ID courts sont limités au cache de réponses récent en mémoire et sont vérifiés par rapport à la discussion actuelle avant utilisation. Si un ID court a expiré ou appartient à une autre discussion, réessayez avec le `MessageSidFull` complet.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw masque les actions d’API privée uniquement lorsque l’état de sonde en cache indique que le bridge est indisponible. Si l’état est inconnu, les actions restent visibles et le dispatch lance les sondes à la demande, afin que la première action puisse réussir après `imsg launch` sans actualisation manuelle séparée de l’état.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Lorsque le bridge d’API privée est actif, les discussions entrantes acceptées sont marquées comme lues avant le dispatch et une bulle de saisie est affichée à l’expéditeur pendant que l’agent génère la réponse. Désactivez le marquage comme lu avec :

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Les anciennes versions de `imsg` antérieures à la liste de capacités par méthode désactiveront silencieusement la saisie/la lecture ; OpenClaw consigne un avertissement unique par redémarrage afin que le reçu manquant soit attribuable.

  </Accordion>
</AccordionGroup>

## Écritures de configuration

iMessage autorise par défaut les écritures de configuration initiées par le canal (pour `/config set|unset` lorsque `commands.config: true`).

Désactiver :

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Fusion des MP envoyés en plusieurs parties (commande + URL dans une seule composition)

Lorsqu’un utilisateur saisit ensemble une commande et une URL — par exemple `Dump https://example.com/article` — l’app Messages d’Apple divise l’envoi en **deux lignes `chat.db` séparées** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec les images d’aperçu OG en pièces jointes.

Les deux lignes arrivent dans OpenClaw à environ 0,8 à 2,0 s d’intervalle sur la plupart des configurations. Sans fusion, l’agent reçoit uniquement la commande au tour 1, répond (souvent « envoyez-moi l’URL »), et ne voit l’URL qu’au tour 2 — moment auquel le contexte de la commande est déjà perdu. Il s’agit du pipeline d’envoi d’Apple, pas de quelque chose qu’OpenClaw ou `imsg` introduit.

`channels.imessage.coalesceSameSenderDms` active pour un MP la fusion de lignes consécutives du même expéditeur en un seul tour d’agent. Les discussions de groupe continuent à être dispatchées message par message afin de préserver la structure des tours multi-utilisateur.

<Tabs>
  <Tab title="When to enable">
    Activez lorsque :

    - Vous fournissez des Skills qui attendent `command + payload` dans un seul message (dump, paste, save, queue, etc.).
    - Vos utilisateurs collent des URL, des images ou du contenu long avec des commandes.
    - Vous pouvez accepter la latence ajoutée aux tours de MP (voir ci-dessous).

    Laissez désactivé lorsque :

    - Vous avez besoin d’une latence minimale des commandes pour les déclencheurs de MP d’un seul mot.
    - Tous vos flux sont des commandes en une seule étape sans payload de suivi.

  </Tab>
  <Tab title="Activation">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Avec l’indicateur activé et sans `messages.inbound.byChannel.imessage` explicite, la fenêtre d’anti-rebond passe à **2500 ms** (la valeur par défaut historique est 0 ms — aucun anti-rebond). Cette fenêtre plus large est nécessaire, car la cadence d’envoi fractionné d’Apple, de 0,8 à 2,0 s, ne tient pas dans une valeur par défaut plus stricte.

    Pour ajuster vous-même la fenêtre :

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromis">
    - **Latence ajoutée pour les messages privés.** Avec l’indicateur activé, chaque message privé (y compris les commandes de contrôle autonomes et les suivis contenant un seul texte) attend jusqu’à la fenêtre d’anti-rebond avant d’être distribué, au cas où une ligne de charge utile arriverait. Les messages de discussion de groupe conservent une distribution instantanée.
    - **La sortie fusionnée est bornée.** Le texte fusionné est limité à 4000 caractères avec un marqueur explicite `…[truncated]` ; les pièces jointes sont limitées à 20 ; les entrées source sont limitées à 10 (la première et les plus récentes sont conservées au-delà). Chaque GUID source est suivi dans `coalescedMessageGuids` pour la télémétrie en aval.
    - **Messages privés uniquement.** Les discussions de groupe passent à la distribution par message afin que le bot reste réactif lorsque plusieurs personnes écrivent.
    - **Activation explicite, par canal.** Les autres canaux (Telegram, WhatsApp, Slack, …) ne sont pas affectés. Les anciennes configurations BlueBubbles qui définissent `channels.bluebubbles.coalesceSameSenderDms` doivent migrer cette valeur vers `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scénarios et ce que voit l’agent

| L’utilisateur compose                                             | `chat.db` produit     | Indicateur désactivé (par défaut)             | Indicateur activé + fenêtre de 2500 ms                                  |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un envoi)                              | 2 lignes à ~1 s d’écart | Deux tours d’agent : "Dump" seul, puis l’URL | Un tour : texte fusionné `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (pièce jointe + texte)             | 2 lignes              | Deux tours (pièce jointe supprimée à la fusion) | Un tour : texte + image conservés                                       |
| `/status` (commande autonome)                                      | 1 ligne               | Distribution instantanée                      | **Attend jusqu’à la fenêtre, puis distribue**                           |
| URL collée seule                                                   | 1 ligne               | Distribution instantanée                      | Distribution instantanée (une seule entrée dans le lot)                 |
| Texte + URL envoyés comme deux messages séparés délibérés, à plusieurs minutes d’écart | 2 lignes hors fenêtre | Deux tours                                    | Deux tours (la fenêtre expire entre les deux)                           |
| Flux rapide (>10 petits messages privés dans la fenêtre)           | N lignes              | N tours                                       | Un tour, sortie bornée (première + dernières, limites texte/pièces jointes appliquées) |
| Deux personnes écrivent dans une discussion de groupe              | N lignes de M expéditeurs | M+ tours (un par lot d’expéditeur)         | M+ tours — les discussions de groupe ne sont pas coalescées             |

## Rattrapage après une indisponibilité du Gateway

Lorsque le Gateway est hors ligne (plantage, redémarrage, veille du Mac, machine éteinte), `imsg watch` reprend à partir de l’état actuel de `chat.db` une fois le Gateway rétabli — tout ce qui est arrivé pendant l’interruption n’est, par défaut, jamais vu. Le rattrapage rejoue ces messages au démarrage suivant afin que l’agent ne manque pas silencieusement le trafic entrant.

Le rattrapage est **désactivé par défaut**. Activez-le par canal :

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Fonctionnement

Un passage par démarrage de `monitorIMessageProvider`, séquencé comme suit : `imsg launch` prêt → `watch.subscribe` → `performIMessageCatchup` → boucle de distribution en direct. Le rattrapage lui-même utilise `chats.list` + `messages.history` par discussion avec le même client JSON-RPC que celui utilisé par `imsg watch`. Tout ce qui arrive pendant le passage de rattrapage transite normalement par la distribution en direct ; le cache de déduplication entrant existant absorbe tout chevauchement avec les lignes rejouées.

Chaque ligne rejouée est injectée dans le chemin de distribution en direct (`evaluateIMessageInbound` + `dispatchInboundMessage`), de sorte que les listes d’autorisation, la politique de groupe, l’anti-rebond, le cache d’écho et les accusés de lecture se comportent de façon identique pour les messages rejoués et en direct.

### Sémantique du curseur et des nouvelles tentatives

Le rattrapage conserve un curseur par compte à `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (le répertoire d’état OpenClaw vaut par défaut `~/.openclaw`, modifiable avec `OPENCLAW_STATE_DIR`) :

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Le curseur avance à chaque distribution réussie et reste en place lorsque la distribution d’une ligne lève une exception — le démarrage suivant réessaie la même ligne depuis le curseur conservé.
- Après `maxFailureRetries` exceptions consécutives sur le même `guid`, le rattrapage journalise un `warn` et force l’avancement du curseur au-delà du message bloqué afin que les démarrages suivants puissent progresser.
- Les GUID déjà abandonnés sont ignorés dès qu’ils sont vus (aucune tentative de distribution) lors des exécutions ultérieures et comptés sous `skippedGivenUp` dans le résumé d’exécution.

### Signaux visibles par l’opérateur

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Une ligne `WARN ... capped to perRunLimit` signifie qu’un seul démarrage n’a pas vidé tout l’arriéré. Augmentez `perRunLimit` (max 500) si vos interruptions dépassent régulièrement le passage par défaut de 50 lignes.

### Quand le laisser désactivé

- Le Gateway fonctionne en continu avec redémarrage automatique par watchdog et les interruptions durent toujours moins de quelques secondes — la valeur par défaut désactivée convient.
- Le volume de messages privés est faible et les messages manqués ne changeraient pas le comportement de l’agent — la fenêtre initiale `firstRunLookbackMinutes` peut distribuer un ancien contexte surprenant lors de la première activation.

Lorsque vous activez le rattrapage, le premier démarrage sans curseur ne remonte que jusqu’à `firstRunLookbackMinutes` (30 min par défaut), pas toute la fenêtre `maxAgeMinutes` — cela évite de rejouer un long historique de messages antérieurs à l’activation.

## Dépannage

<AccordionGroup>
  <Accordion title="imsg introuvable ou RPC non pris en charge">
    Validez le binaire et la prise en charge RPC :

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonde indique que RPC n’est pas pris en charge, mettez à jour `imsg`. Si les actions d’API privée ne sont pas disponibles, exécutez `imsg launch` dans la session de l’utilisateur macOS connecté, puis relancez la sonde. Si le Gateway ne fonctionne pas sur macOS, utilisez plutôt la configuration Mac distant via SSH ci-dessus au lieu du chemin `imsg` local par défaut.

  </Accordion>

  <Accordion title="Le Gateway ne fonctionne pas sur macOS">
    Le `cliPath: "imsg"` par défaut doit s’exécuter sur le Mac connecté à Messages. Sous Linux ou Windows, définissez `channels.imessage.cliPath` sur un script d’enveloppe qui se connecte à ce Mac via SSH et exécute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Exécutez ensuite :

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Les messages privés sont ignorés">
    Vérifiez :

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - les approbations d’appairage (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Les messages de groupe sont ignorés">
    Vérifiez :

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - le comportement de liste d’autorisation de `channels.imessage.groups`
    - la configuration des motifs de mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Les pièces jointes distantes échouent">
    Vérifiez :

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - l’authentification par clé SSH/SCP depuis l’hôte du Gateway
    - la clé d’hôte existe dans `~/.ssh/known_hosts` sur l’hôte du Gateway
    - la lisibilité du chemin distant sur le Mac exécutant Messages

  </Accordion>

  <Accordion title="Les invites d’autorisation macOS ont été manquées">
    Relancez dans un terminal GUI interactif dans le même contexte utilisateur/session et approuvez les invites :

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirmez que l’accès complet au disque + l’automatisation sont accordés pour le contexte de processus qui exécute OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Pointeurs de référence de configuration

- [Référence de configuration - iMessage](/fr/gateway/config-channels#imessage)
- [Configuration du Gateway](/fr/gateway/configuration)
- [Appairage](/fr/channels/pairing)

## Associés

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Suppression de BlueBubbles et chemin iMessage avec imsg](/fr/announcements/bluebubbles-imessage) — annonce et résumé de migration
- [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles) — tableau de traduction de configuration et bascule étape par étape
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
