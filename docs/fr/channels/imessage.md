---
read_when:
    - Configuration de la prise en charge d’iMessage
    - Débogage de l’envoi/réception iMessage
summary: Prise en charge native d’iMessage via imsg (JSON-RPC sur stdio), avec des actions d’API privée pour les réponses, les tapbacks, les effets, les sondages, les pièces jointes et la gestion de groupe. Recommandé pour les nouvelles configurations OpenClaw iMessage lorsque les exigences de l’hôte conviennent.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T12:58:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Pour les déploiements OpenClaw iMessage, utilisez `imsg` sur un hôte macOS Messages connecté. Si votre Gateway fonctionne sous Linux ou Windows, faites pointer `channels.imessage.cliPath` vers un wrapper SSH qui exécute `imsg` sur le Mac.

**La récupération entrante est automatique.** Après un redémarrage du pont ou du Gateway, iMessage rejoue les messages manqués pendant l’arrêt et supprime l’ancien « bombardement d’arriéré » qu’Apple peut vider après une récupération Push, avec déduplication afin que rien ne soit distribué deux fois. Aucune configuration n’est nécessaire pour l’activer — voir [Récupération entrante après un redémarrage du pont ou du Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
La prise en charge de BlueBubbles a été supprimée. Migrez les configurations `channels.bluebubbles` vers `channels.imessage` ; OpenClaw prend en charge iMessage uniquement via `imsg`. Commencez par [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) pour l’annonce courte, ou [Migrer depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles) pour le tableau complet de migration.
</Warning>

Statut : intégration CLI externe native. Le Gateway lance `imsg rpc` et communique en JSON-RPC sur stdio (sans daemon/port séparé). Les actions avancées nécessitent `imsg launch` et une sonde d’API privée réussie.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Réponses, tapbacks, effets, sondages, pièces jointes et gestion des groupes.
  </Card>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Les DM iMessage utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Utilisez un wrapper SSH lorsque le Gateway ne s’exécute pas sur le Mac Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/fr/gateway/config-channels#imessage">
    Référence complète des champs iMessage.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Les demandes d’appairage expirent après 1 heure.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw nécessite seulement un `cliPath` compatible stdio ; vous pouvez donc faire pointer `cliPath` vers un script wrapper qui se connecte en SSH à un Mac distant et exécute `imsg`.

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
    OpenClaw utilise une vérification stricte de la clé d’hôte pour SCP ; la clé d’hôte du relais doit donc déjà exister dans `~/.ssh/known_hosts`.
    Les chemins de pièces jointes sont validés par rapport aux racines autorisées (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Tout wrapper `cliPath` ou proxy SSH placé devant `imsg` DOIT se comporter comme un tuyau stdio transparent pour JSON-RPC de longue durée. OpenClaw échange de petits messages JSON-RPC délimités par des sauts de ligne via stdin/stdout du wrapper pendant toute la durée de vie du canal :

- Transmettez chaque bloc/ligne stdin **dès que des octets sont disponibles** — n’attendez pas EOF.
- Transmettez rapidement chaque bloc/ligne stdout dans la direction inverse.
- Préservez les sauts de ligne.
- Évitez les lectures bloquantes de taille fixe (`read(4096)`, `cat | buffer`, `read` shell par défaut) qui peuvent affamer les petites trames.
- Gardez stderr séparé du flux stdout JSON-RPC.

Un wrapper qui met stdin en mémoire tampon jusqu’à remplir un gros bloc produira des symptômes ressemblant à une panne iMessage — `imsg rpc timeout (chats.list)` ou redémarrages répétés du canal — même si `imsg rpc` lui-même est sain. `ssh -T host imsg "$@"` (ci-dessus) est sûr, car il transmet les arguments `cliPath` d’OpenClaw tels que `rpc` et `--db`. Les pipelines comme `ssh host imsg | grep -v '^DEBUG'` ne le sont PAS — les outils à tampon ligne peuvent quand même retenir des trames ; utilisez `stdbuf -oL -eL` à chaque étape si vous devez filtrer.
</Warning>

  </Tab>
</Tabs>

## Exigences et autorisations (macOS)

- Messages doit être connecté sur le Mac qui exécute `imsg`.
- L’accès complet au disque est requis pour le contexte de processus exécutant OpenClaw/`imsg` (accès à la base de données Messages).
- L’autorisation Automation est requise pour envoyer des messages via Messages.app.
- Pour les actions avancées (réagir / modifier / annuler l’envoi / réponse en fil / effets / sondages / opérations de groupe), System Integrity Protection doit être désactivé — voir [Activation de l’API privée imsg](#enabling-the-imsg-private-api) ci-dessous. L’envoi/réception de texte et de médias de base fonctionne sans cela.

<Tip>
Les autorisations sont accordées par contexte de processus. Si le Gateway s’exécute sans interface (LaunchAgent/SSH), exécutez une commande interactive unique dans ce même contexte pour déclencher les invites :

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  Une configuration SSH distante peut lire les conversations, réussir `channels status --probe` et traiter les messages entrants, tandis que les envois sortants échouent encore avec une erreur d’autorisation AppleEvents :

```text
Not authorized to send Apple events to Messages. (-1743)
```

Vérifiez la base de données TCC de l’utilisateur Mac connecté ou Réglages Système > Confidentialité et sécurité > Automation. Si l’entrée Automation est enregistrée pour `/usr/libexec/sshd-keygen-wrapper` au lieu du processus `imsg` ou du shell local, macOS peut ne pas exposer de bascule Messages utilisable pour ce client côté serveur SSH :

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dans cet état, répéter `tccutil reset AppleEvents` ou relancer `imsg send` via le même wrapper SSH peut continuer à échouer, car le contexte de processus qui a besoin de l’Automation Messages est le wrapper SSH, pas une application à laquelle l’interface peut accorder l’autorisation.

Utilisez plutôt l’un des contextes de processus `imsg` pris en charge :

- Exécutez le Gateway, ou au moins le pont `imsg`, dans la session locale de l’utilisateur Messages connecté.
- Démarrez le Gateway avec un LaunchAgent pour cet utilisateur après avoir accordé l’accès complet au disque et l’Automation depuis la même session.
- Si vous conservez la topologie SSH à deux utilisateurs, vérifiez qu’un véritable envoi sortant `imsg send` réussit via le wrapper exact avant d’activer le canal. S’il est impossible de lui accorder l’Automation, reconfigurez en une configuration `imsg` à utilisateur unique au lieu de dépendre du wrapper SSH pour les envois.

</Accordion>

## Activation de l’API privée imsg

`imsg` est livré avec deux modes opérationnels :

- **Mode de base** (par défaut, aucun changement SIP nécessaire) : texte et médias sortants via `send`, surveillance/historique entrants, liste des conversations. C’est ce que vous obtenez directement après une nouvelle installation `brew install steipete/tap/imsg` et les autorisations macOS standard ci-dessus.
- **Mode API privée** : `imsg` injecte une dylib d’assistance dans `Messages.app` pour appeler des fonctions internes `IMCore`. C’est ce qui débloque `react`, `edit`, `unsend`, `reply` (en fil), `sendWithEffect`, `poll` et `poll-vote` (sondages Messages natifs), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ainsi que les indicateurs de saisie et les accusés de lecture.

Pour atteindre la surface d’actions avancées documentée sur cette page de canal, vous avez besoin du mode API privée. Le README de `imsg` est explicite sur l’exigence :

> Les fonctionnalités avancées telles que `read`, `typing`, `launch`, l’envoi riche adossé au pont, la mutation de messages et la gestion des conversations sont optionnelles. Elles exigent que SIP soit désactivé et qu’une dylib d’assistance soit injectée dans `Messages.app`. `imsg launch` refuse l’injection lorsque SIP est activé.

La technique d’injection de l’assistant utilise la propre dylib de `imsg` pour atteindre les API privées de Messages. Il n’y a aucun serveur tiers ni runtime BlueBubbles dans le chemin OpenClaw iMessage.

<Warning>
**La désactivation de SIP est un vrai compromis de sécurité.** SIP est l’une des protections centrales de macOS contre l’exécution de code système modifié ; le désactiver à l’échelle du système ouvre une surface d’attaque supplémentaire et peut avoir des effets secondaires. En particulier, **désactiver SIP sur les Mac Apple Silicon désactive aussi la possibilité d’installer et d’exécuter des apps iOS sur votre Mac**.

Considérez cela comme un choix opérationnel délibéré, pas comme un réglage par défaut. Si votre modèle de menace ne peut pas tolérer la désactivation de SIP, l’iMessage intégré est limité au mode de base — envoi/réception de texte et de médias uniquement, sans réactions / modification / annulation d’envoi / effets / opérations de groupe.
</Warning>

### Configuration

1. **Installez (ou mettez à niveau) `imsg`** sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La sortie de `imsg status --json` indique `bridge_version`, `rpc_methods` et les `selectors` par méthode, afin que vous puissiez voir ce que la version actuelle prend en charge avant de démarrer.

2. **Désactivez System Integrity Protection et (sur macOS moderne) Library Validation.** Injecter une dylib d’assistance non Apple dans `Messages.app` signé par Apple nécessite que SIP soit désactivé **et** que la validation de bibliothèque soit assouplie. L’étape SIP en mode Récupération dépend de la version de macOS :
   - **macOS 10.13-10.15 (Sierra-Catalina) :** désactivez Library Validation via Terminal, redémarrez en mode Récupération, exécutez `csrutil disable`, redémarrez.
   - **macOS 11+ (Big Sur et versions ultérieures), Intel :** mode Récupération (ou Récupération Internet), `csrutil disable`, redémarrez.
   - **macOS 11+, Apple Silicon :** séquence de démarrage au bouton d’alimentation pour entrer en Récupération ; sur les versions récentes de macOS, maintenez la touche **Maj gauche** lorsque vous cliquez sur Continuer, puis `csrutil disable`. Les configurations de machine virtuelle suivent un flux distinct ; prenez donc d’abord un instantané de la VM.

   **Sur macOS 11 et versions ultérieures, `csrutil disable` seul ne suffit généralement pas.** Apple applique encore la validation de bibliothèque à `Messages.app` en tant que binaire de plateforme ; un assistant signé ad hoc est donc rejeté (`Library Validation failed: ... platform binary, but mapped file is not`) même avec SIP désactivé. Après avoir désactivé SIP, désactivez aussi la validation de bibliothèque et redémarrez :

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), vérifié sur 26.5.1 :** SIP désactivé **plus** la commande `DisableLibraryValidation` ci-dessus suffit à injecter l’assistant de 26.0 à 26.5.x. **Aucun boot-arg n’est requis.** Le plist est le facteur décisif et l’étape manquante la plus fréquente lorsque l’injection échoue sur Tahoe :
   - **Avec le plist :** `imsg launch` injecte et `imsg status` indique `advanced_features: true`.
   - **Sans le plist (même avec SIP désactivé) :** `imsg launch` échoue avec `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rejette l’assistant ad hoc au chargement ; le pont ne devient donc jamais prêt et le lancement expire. Ce délai d’expiration est le symptôme le plus courant sur Tahoe, et le correctif est le plist ci-dessus, pas une mesure plus radicale.

   Cela a été confirmé par un avant/après contrôlé sur macOS 26.5.1 (Apple Silicon) : avec le plist, la dylib est mappée dans `Messages.app` et le pont démarre ; supprimez le plist et redémarrez, et `imsg launch` produit l’échec par délai d’expiration ci-dessus, sans que la dylib ne soit mappée.

   Si l’injection par `imsg launch` ou des `selectors` spécifiques commencent à renvoyer false après une mise à niveau de macOS, cette barrière en est généralement la cause. Vérifiez l’état de SIP et de la validation des bibliothèques avant de supposer que l’étape SIP elle-même a échoué. Si ces réglages sont corrects et que la passerelle ne parvient toujours pas à injecter, collectez `imsg status --json` ainsi que la sortie de `imsg launch` et signalez-le au projet `imsg` au lieu d’affaiblir d’autres contrôles de sécurité à l’échelle du système.

   Suivez le flux en mode de récupération d’Apple pour votre Mac afin de désactiver SIP avant d’exécuter `imsg launch`.

3. **Injecter l’assistant.** Avec SIP désactivé et Messages.app connecté :

   ```bash
   imsg launch
   ```

   `imsg launch` refuse d’injecter lorsque SIP est encore activé ; cela sert donc aussi à confirmer que l’étape 2 a bien pris effet.

4. **Vérifier la passerelle depuis OpenClaw :**

   ```bash
   openclaw channels status --probe
   ```

   L’entrée iMessage doit signaler `works`, et `imsg status --json | jq '{rpc_methods, selectors}'` doit afficher les capacités exposées par votre build macOS. La création de sondages nécessite `selectors.pollPayloadMessage` ; le vote nécessite à la fois `selectors.pollVoteMessage` et la méthode RPC `poll.vote`. Le Plugin OpenClaw annonce uniquement les actions prises en charge par la sonde mise en cache, tandis qu’un cache vide reste optimiste et effectue une sonde lors du premier envoi.

Si `openclaw channels status --probe` signale que le canal est `works` mais que des actions spécifiques lèvent "iMessage `<action>` requires the imsg private API bridge" au moment de l’envoi, exécutez de nouveau `imsg launch` — l’assistant peut se détacher (redémarrage de Messages.app, mise à jour de l’OS, etc.) et l’état mis en cache `available: true` continuera d’annoncer les actions jusqu’à ce que la prochaine sonde l’actualise.

### Lorsque vous ne pouvez pas désactiver SIP

Si SIP désactivé n’est pas acceptable pour votre modèle de menace :

- `imsg` revient au mode de base — texte + médias + réception uniquement.
- Le Plugin OpenClaw annonce toujours l’envoi de texte/médias et la surveillance entrante ; il masque simplement `react`, `edit`, `unsend`, `reply`, `sendWithEffect` et les opérations de groupe de la surface d’action (selon la barrière de capacité par méthode).
- Vous pouvez exécuter un Mac non Apple Silicon séparé (ou un Mac dédié au bot) avec SIP désactivé pour la charge de travail iMessage, tout en conservant SIP activé sur vos appareils principaux. Voir [Utilisateur macOS dédié au bot (identité iMessage séparée)](#deployment-patterns) ci-dessous.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des DM">
    `channels.imessage.dmPolicy` contrôle les messages directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    Champ de liste d’autorisation : `channels.imessage.allowFrom`.

    Les entrées de liste d’autorisation doivent identifier les expéditeurs : identifiants ou groupes d’accès expéditeur statiques (`accessGroup:<name>`). Utilisez `channels.imessage.groupAllowFrom` pour les cibles de discussion telles que `chat_id:*`, `chat_guid:*` ou `chat_identifier:*` ; utilisez `channels.imessage.groups` pour les clés de registre numériques `chat_id`.

  </Tab>

  <Tab title="Politique de groupe + mentions">
    `channels.imessage.groupPolicy` contrôle la gestion des groupes :

    - `allowlist` (par défaut lorsque configuré)
    - `open`
    - `disabled`

    Liste d’autorisation des expéditeurs de groupe : `channels.imessage.groupAllowFrom`.

    Les entrées `groupAllowFrom` peuvent également référencer des groupes d’accès expéditeur statiques (`accessGroup:<name>`).

    Repli à l’exécution : si `groupAllowFrom` n’est pas défini, les vérifications des expéditeurs de groupe iMessage utilisent `allowFrom` ; définissez `groupAllowFrom` lorsque l’admission des DM et des groupes doit différer.
    Note d’exécution : si `channels.imessage` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    <Warning>
    Le routage de groupe comporte **deux** barrières de liste d’autorisation exécutées l’une après l’autre, et les deux doivent réussir :

    1. **Liste d’autorisation expéditeur / cible de discussion** (`channels.imessage.groupAllowFrom`) — identifiant, `chat_guid`, `chat_identifier` ou `chat_id`.
    2. **Registre de groupe** (`channels.imessage.groups`) — avec `groupPolicy: "allowlist"`, cette barrière nécessite soit une entrée générique `groups: { "*": { ... } }` (définit `allowAll = true`), soit une entrée explicite par `chat_id` sous `groups`.

    Si la barrière 2 ne contient rien, chaque message de groupe est supprimé. Le Plugin émet deux signaux de niveau `warn` au niveau de journalisation par défaut :

    - une seule fois par compte au démarrage : `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - une seule fois par `chat_id` à l’exécution : `imessage: dropping group message from chat_id=<id> ...`

    Les DM continuent de fonctionner, car ils empruntent un chemin de code différent.

    Configuration minimale pour maintenir les groupes actifs sous `groupPolicy: "allowlist"` :

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

    Si ces lignes `warn` apparaissent dans le journal du Gateway, la barrière 2 supprime les messages — ajoutez le bloc `groups`.
    </Warning>

    Barrière de mentions pour les groupes :

    - iMessage n’a pas de métadonnées de mention natives
    - la détection des mentions utilise des motifs regex (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - sans motifs configurés, la barrière de mentions ne peut pas être appliquée

    Les commandes de contrôle provenant d’expéditeurs autorisés peuvent contourner la barrière de mentions dans les groupes.

    `systemPrompt` par groupe :

    Chaque entrée sous `channels.imessage.groups.*` accepte une chaîne `systemPrompt` facultative. La valeur est injectée dans l’invite système de l’agent à chaque tour qui traite un message dans ce groupe. La résolution reflète la résolution d’invite par groupe utilisée par `channels.whatsapp.groups` :

    1. **Invite système propre au groupe** (`groups["<chat_id>"].systemPrompt`) : utilisée lorsque l’entrée de groupe spécifique existe dans la carte **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucune invite système n’est appliquée à ce groupe.
    2. **Invite système générique de groupe** (`groups["*"].systemPrompt`) : utilisée lorsque l’entrée de groupe spécifique est entièrement absente de la carte, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

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

    Les invites par groupe ne s’appliquent qu’aux messages de groupe — les messages directs dans ce canal ne sont pas affectés.

  </Tab>

  <Tab title="Sessions et réponses déterministes">
    - Les DM utilisent le routage direct ; les groupes utilisent le routage de groupe.
    - Avec `session.dmScope=main` par défaut, les DM iMessage convergent vers la session principale de l’agent.
    - Les sessions de groupe sont isolées (`agent:<agentId>:imessage:group:<chat_id>`).
    - Les réponses sont routées vers iMessage en utilisant les métadonnées d’origine du canal/de la cible.

    Comportement des fils de type groupe :

    Certains fils iMessage à plusieurs participants peuvent arriver avec `is_group=false`.
    Si ce `chat_id` est explicitement configuré sous `channels.imessage.groups`, OpenClaw le traite comme du trafic de groupe (barrière de groupe + isolation de session de groupe).

  </Tab>
</Tabs>

## Liaisons de conversation ACP

Les anciennes discussions iMessage peuvent également être liées à des sessions ACP.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le DM ou la discussion de groupe autorisée.
- Les futurs messages dans cette même conversation iMessage sont routés vers la session ACP créée.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont prises en charge via des entrées de premier niveau `bindings[]` avec `type: "acp"` et `match.channel: "imessage"`.

`match.peer.id` peut utiliser :

- un identifiant de DM normalisé tel que `+15555550123` ou `user@example.com`
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

Voir [Agents ACP](/fr/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Utilisateur macOS dédié au bot (identité iMessage séparée)">
    Utilisez un identifiant Apple dédié et un utilisateur macOS afin que le trafic du bot soit isolé de votre profil Messages personnel.

    Flux typique :

    1. Créez/connectez un utilisateur macOS dédié.
    2. Connectez-vous à Messages avec l’identifiant Apple du bot dans cet utilisateur.
    3. Installez `imsg` dans cet utilisateur.
    4. Créez un wrapper SSH afin qu’OpenClaw puisse exécuter `imsg` dans ce contexte utilisateur.
    5. Faites pointer `channels.imessage.accounts.<id>.cliPath` et `.dbPath` vers ce profil utilisateur.

    La première exécution peut nécessiter des approbations GUI (Automation + Full Disk Access) dans cette session utilisateur du bot.

  </Accordion>

  <Accordion title="Mac distant via Tailscale (exemple)">
    Topologie courante :

    - le Gateway s’exécute sur Linux/VM
    - iMessage + `imsg` s’exécute sur un Mac dans votre tailnet
    - le wrapper `cliPath` utilise SSH pour exécuter `imsg`
    - `remoteHost` active la récupération des pièces jointes par SCP

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

  <Accordion title="Modèle multi-compte">
    iMessage prend en charge la configuration par compte sous `channels.imessage.accounts`.

    Chaque compte peut remplacer des champs tels que `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, les réglages d’historique et les listes d’autorisation de racines de pièces jointes.

  </Accordion>

  <Accordion title="Historique des messages directs">
    Définissez `channels.imessage.dmHistoryLimit` pour amorcer les nouvelles sessions de messages directs avec l’historique `imsg` récemment décodé pour cette conversation. Utilisez `channels.imessage.dms["<sender>"].historyLimit` pour des remplacements par expéditeur, y compris `0` pour désactiver l’historique pour un expéditeur.

    L’historique des DM iMessage est récupéré à la demande depuis `imsg`. Laisser `dmHistoryLimit` non défini désactive l’amorçage global de l’historique des DM, mais une valeur positive de `channels.imessage.dms["<sender>"].historyLimit` par expéditeur active toujours l’amorçage pour cet expéditeur.

  </Accordion>
</AccordionGroup>

## Médias, découpage en fragments et cibles de livraison

<AccordionGroup>
  <Accordion title="Pièces jointes et médias">
    - l’ingestion des pièces jointes entrantes est **désactivée par défaut** — définissez `channels.imessage.includeAttachments: true` pour transférer les photos, mémos vocaux, vidéos et autres pièces jointes à l’agent. Lorsqu’elle est désactivée, les iMessages contenant uniquement une pièce jointe sont ignorés avant d’atteindre l’agent et peuvent ne produire aucune ligne de journal `Inbound message`.
    - les chemins de pièces jointes distants peuvent être récupérés via SCP lorsque `remoteHost` est défini
    - les chemins de pièces jointes doivent correspondre aux racines autorisées :
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP distant)
      - motif de racine par défaut : `/Users/*/Library/Messages/Attachments`
    - SCP utilise une vérification stricte des clés d’hôte (`StrictHostKeyChecking=yes`)
    - la taille des médias sortants utilise `channels.imessage.mediaMaxMb` (16 Mo par défaut)

  </Accordion>

  <Accordion title="Découpage des messages sortants">
    - limite de découpage du texte : `channels.imessage.textChunkLimit` (4000 par défaut)
    - mode de découpage : `channels.imessage.chunkMode`
      - `length` (par défaut)
      - `newline` (découpage en privilégiant les paragraphes)

  </Accordion>

  <Accordion title="Formats d’adressage">
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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Actions disponibles">
    - **react** : Ajouter/supprimer des tapbacks iMessage (`messageId`, `emoji`, `remove`). Les tapbacks pris en charge correspondent à love, like, dislike, laugh, emphasize et question.
    - **reply** : Envoyer une réponse en fil à un message existant (`messageId`, `text` ou `message`, plus `chatGuid`, `chatId`, `chatIdentifier` ou `to`).
    - **sendWithEffect** : Envoyer du texte avec un effet iMessage (`text` ou `message`, `effect` ou `effectId`).
    - **edit** : Modifier un message envoyé sur les versions macOS/API privée prises en charge (`messageId`, `text` ou `newText`).
    - **unsend** : Rétracter un message envoyé sur les versions macOS/API privée prises en charge (`messageId`).
    - **upload-file** : Envoyer des médias/fichiers (`buffer` en base64 ou un `media`/`path`/`filePath` hydraté, `filename`, `asVoice` facultatif). Alias hérité : `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup** : Gérer les discussions de groupe lorsque la cible actuelle est une conversation de groupe.
    - **poll** : Créer un sondage Apple Messages natif (`pollQuestion`, `pollOption` répété 2 à 12 fois, plus `chatGuid`, `chatId`, `chatIdentifier` ou `to`). Les destinataires sous iOS/iPadOS/macOS 26+ le voient et votent nativement ; les anciennes versions de système d’exploitation reçoivent un texte de repli « Sondage envoyé ». Nécessite `selectors.pollPayloadMessage`.
    - **poll-vote** : Voter dans un sondage existant (`pollId` ou `messageId`, plus exactement l’un de `pollOptionIndex`, `pollOptionId` ou `pollOptionText`). Nécessite `selectors.pollVoteMessage` et la méthode RPC `poll.vote`.

    Les sondages entrants acceptés sont rendus pour l’agent avec la question, les libellés d’options numérotés, les décomptes de votes et l’ID du message de sondage requis par `poll-vote`.

  </Accordion>

  <Accordion title="ID de message">
    Le contexte iMessage entrant inclut à la fois des valeurs `MessageSid` courtes et des GUID de message complets lorsqu’ils sont disponibles. Les ID courts sont limités au cache récent de réponses adossé à SQLite et sont vérifiés par rapport à la discussion actuelle avant utilisation. Si un ID court a expiré ou appartient à une autre discussion, réessayez avec le `MessageSidFull` complet.

  </Accordion>

  <Accordion title="Détection des capacités">
    OpenClaw masque les actions d’API privée uniquement lorsque l’état de sonde mis en cache indique que le pont est indisponible. Si l’état est inconnu, les actions restent visibles et déclenchent les sondes à la demande afin que la première action puisse réussir après `imsg launch` sans actualisation manuelle distincte de l’état.

  </Accordion>

  <Accordion title="Accusés de lecture et saisie">
    Lorsque le pont d’API privée est actif, les discussions entrantes acceptées sont marquées comme lues et les discussions directes affichent une bulle de saisie dès que le tour est accepté, pendant que l’agent prépare le contexte et génère. Désactivez le marquage de lecture avec :

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Les anciennes versions de `imsg` antérieures à la liste de capacités par méthode désactiveront silencieusement la saisie/lecture ; OpenClaw journalise un avertissement unique par redémarrage afin que l’accusé manquant soit identifiable.

  </Accordion>

  <Accordion title="Tapbacks entrants">
    OpenClaw s’abonne aux tapbacks iMessage et route les réactions acceptées comme événements système au lieu de texte de message normal, de sorte qu’un tapback utilisateur ne déclenche pas une boucle de réponse ordinaire.

    Le mode de notification est contrôlé par `channels.imessage.reactionNotifications` :

    - `"own"` (par défaut) : notifier uniquement lorsque des utilisateurs réagissent aux messages rédigés par le bot.
    - `"all"` : notifier pour tous les tapbacks entrants provenant d’expéditeurs autorisés.
    - `"off"` : ignorer les tapbacks entrants.

    Les remplacements par compte utilisent `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Réactions d’approbation (👍 / 👎)">
    Lorsque `approvals.exec.enabled` ou `approvals.plugin.enabled` vaut true et que la requête est routée vers iMessage, le Gateway livre une invite d’approbation nativement et accepte un tapback pour la résoudre :

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` reste un repli manuel : envoyez `/approve <id> allow-always` comme réponse ordinaire.

    Le traitement des réactions exige que l’identifiant de l’utilisateur qui réagit soit un approbateur explicite. La liste des approbateurs est lue depuis `channels.imessage.allowFrom` (ou `channels.imessage.accounts.<id>.allowFrom`) ; ajoutez le numéro de téléphone de l’utilisateur au format E.164 ou son e-mail Apple ID. L’entrée générique `"*"` est respectée, mais elle permet à n’importe quel expéditeur d’approuver. Le raccourci par réaction contourne intentionnellement `reactionNotifications`, `dmPolicy` et `groupAllowFrom`, car la liste d’autorisation des approbateurs explicites est le seul garde-fou pertinent pour la résolution des approbations.

    **Changement de comportement avec cette version :** Lorsque `channels.imessage.allowFrom` n’est pas vide, la commande texte `/approve <id> <decision>` est maintenant autorisée par rapport à cette liste d’approbateurs (et non à la liste d’autorisation DM plus large). Les expéditeurs autorisés dans la liste d’autorisation DM mais absents de `allowFrom` recevront un refus explicite. Ajoutez à `allowFrom` chaque opérateur qui doit pouvoir approuver via `/approve` (et via les réactions) pour préserver le comportement précédent. Lorsque `allowFrom` est vide, l’ancien « repli même discussion » reste en vigueur et `/approve` continue d’autoriser toute personne permise par la liste d’autorisation DM.

    Notes pour les opérateurs :
    - La liaison de réaction est stockée à la fois en mémoire (avec un TTL correspondant à l’expiration de l’approbation) et dans le stockage clé persistant du Gateway ; ainsi, un tapback qui arrive peu après un redémarrage du Gateway résout toujours l’approbation.
    - Les tapbacks interappareils `is_from_me=true` (la propre réaction de l’opérateur sur un appareil Apple appairé) sont intentionnellement ignorés afin que le bot ne puisse pas s’auto-approuver.
    - Les anciens tapbacks de style texte (`Liked "…"` en texte brut depuis de très anciens clients Apple) ne peuvent pas résoudre les approbations, car ils ne portent aucun GUID de message ; la résolution par réaction exige les métadonnées de tapback structurées émises par les clients macOS / iOS actuels.

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

## Fusion des DM à envoi fractionné (commande + URL dans une même composition)

Lorsqu’un utilisateur saisit ensemble une commande et une URL — par exemple `Dump https://example.com/article` — l’application Messages d’Apple fractionne l’envoi en **deux lignes `chat.db` distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec des images d’aperçu OG en pièces jointes.

Les deux lignes arrivent dans OpenClaw à environ 0,8 à 2,0 s d’intervalle sur la plupart des configurations. Sans fusion, l’agent reçoit seulement la commande au tour 1, répond (souvent « envoyez-moi l’URL »), puis ne voit l’URL qu’au tour 2 — moment où le contexte de commande est déjà perdu. Il s’agit du pipeline d’envoi d’Apple, et non d’un comportement introduit par OpenClaw ou `imsg`.

`channels.imessage.coalesceSameSenderDms` inscrit un DM à la mise en mémoire tampon des lignes consécutives d’un même expéditeur. Lorsque `imsg` expose le marqueur structurel d’aperçu d’URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` sur l’une des lignes sources, OpenClaw fusionne uniquement ce véritable envoi fractionné et conserve toutes les autres lignes en mémoire tampon comme des tours séparés. Sur les anciennes versions de `imsg` qui n’émettent aucune métadonnée de bulle, OpenClaw ne peut pas distinguer un envoi fractionné d’envois séparés ; il se rabat donc sur la fusion du lot. Cela préserve le comportement antérieur aux métadonnées au lieu de faire régresser les envois fractionnés `Dump <url>` en deux tours. Les discussions de groupe continuent d’être distribuées message par message afin de préserver la structure des tours multi-utilisateurs.

<Tabs>
  <Tab title="Quand l’activer">
    Activez lorsque :

    - Vous publiez des skills qui attendent `command + payload` dans un même message (dump, paste, save, queue, etc.).
    - Vos utilisateurs collent des URL avec des commandes.
    - Vous pouvez accepter la latence supplémentaire des tours DM (voir ci-dessous).

    Laissez désactivé lorsque :

    - Vous avez besoin d’une latence de commande minimale pour les déclencheurs DM d’un seul mot.
    - Tous vos flux sont des commandes ponctuelles sans charges utiles de suivi.

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

    Lorsque l’option est activée et qu’aucun `messages.inbound.byChannel.imessage` explicite ni `messages.inbound.debounceMs` global n’est défini, la fenêtre d’anti-rebond passe à **7000 ms** (la valeur par défaut héritée est 0 ms — pas d’anti-rebond). Cette fenêtre plus large est nécessaire, car la cadence d’envoi fractionné des aperçus d’URL d’Apple peut s’étendre sur plusieurs secondes pendant que Messages.app émet la ligne d’aperçu.

    Pour ajuster vous-même la fenêtre :

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromis">
    - **La fusion précise nécessite les métadonnées actuelles de charge utile `imsg`.** Lorsque la ligne d’URL inclut `balloon_bundle_id`, seul ce véritable envoi fractionné est fusionné et les autres lignes en tampon restent séparées. Sur les anciennes versions de `imsg` qui n’exposent aucune métadonnée de bulle, OpenClaw se rabat sur la fusion du lot en tampon afin que les envois fractionnés `Dump <url>` ne régressent pas en deux tours (rétrocompatibilité temporaire, supprimée une fois que `imsg` regroupe les envois fractionnés en amont).
    - **Latence ajoutée pour les messages MP.** Lorsque l’indicateur est activé, chaque MP (y compris les commandes de contrôle autonomes et les suivis à texte unique) attend jusqu’à la fenêtre d’anti-rebond avant l’envoi, au cas où une ligne d’aperçu d’URL arriverait. Les messages de discussion de groupe conservent un envoi instantané.
    - **La sortie fusionnée est bornée.** Le texte fusionné est plafonné à 4000 caractères avec un marqueur explicite `…[truncated]` ; les pièces jointes sont plafonnées à 20 ; les entrées sources sont plafonnées à 10 (la première et les plus récentes sont conservées au-delà). Chaque GUID source est suivi dans `coalescedMessageGuids` pour la télémétrie en aval.
    - **MP uniquement.** Les discussions de groupe passent par l’envoi par message afin que le bot reste réactif lorsque plusieurs personnes écrivent.
    - **Activation explicite, par canal.** Les autres canaux (Telegram, WhatsApp, Slack, …) ne sont pas affectés. Les anciennes configurations BlueBubbles qui définissent `channels.bluebubbles.coalesceSameSenderDms` doivent migrer cette valeur vers `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scénarios et ce que voit l’agent

La colonne « Indicateur activé » montre le comportement sur une version de `imsg` qui émet `balloon_bundle_id`. Sur les anciennes versions de `imsg` qui n’émettent aucune métadonnée de bulle, les lignes ci-dessous marquées « Deux tours » / « N tours » se rabattent plutôt sur une fusion héritée (un tour) : OpenClaw ne peut pas distinguer structurellement un envoi fractionné d’envois séparés, il préserve donc la fusion antérieure aux métadonnées. La séparation précise s’active une fois que la version émet les métadonnées de bulle.

| L’utilisateur compose                                              | `chat.db` produit                    | Indicateur désactivé (par défaut)            | Indicateur activé + fenêtre (imsg émet les métadonnées de bulle)                                      |
| ------------------------------------------------------------------ | ------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envoi)                              | 2 lignes à ~1 s d’intervalle         | Deux tours d’agent : « Dump » seul, puis URL | Un tour : texte fusionné `Dump https://example.com`                                                   |
| `Save this 📎image.jpg caption` (pièce jointe + texte)             | 2 lignes sans métadonnées de bulle d’URL | Deux tours                                | Deux tours après l’observation des métadonnées ; un tour fusionné sur les anciennes sessions/sessions pré-verrouillage sans métadonnées |
| `/status` (commande autonome)                                      | 1 ligne                              | Envoi instantané                             | **Attend jusqu’à la fenêtre, puis envoie**                                                            |
| URL collée seule                                                   | 1 ligne                              | Envoi instantané                             | Attend jusqu’à la fenêtre, puis envoie                                                               |
| Texte + URL envoyés comme deux messages séparés délibérés, à plusieurs minutes d’intervalle | 2 lignes hors fenêtre | Deux tours | Deux tours (la fenêtre expire entre eux)                                                              |
| Flux rapide (>10 petits MP dans la fenêtre)                        | N lignes sans métadonnées de bulle d’URL | N tours                                  | N tours après l’observation des métadonnées ; un tour fusionné borné sur les anciennes sessions/sessions pré-verrouillage sans métadonnées |
| Deux personnes écrivent dans une discussion de groupe              | N lignes de M expéditeurs            | M+ tours (un par lot d’expéditeur)           | M+ tours — les discussions de groupe ne sont pas regroupées                                           |

## Récupération entrante après un redémarrage du pont ou du Gateway

iMessage récupère les messages manqués pendant que le Gateway était arrêté et, en même temps, supprime la vieille « bombe d’arriéré » qu’Apple peut vider après une récupération Push. Le comportement par défaut est toujours activé et repose sur la déduplication entrante.

- **Déduplication de rejeu.** Chaque message entrant envoyé est enregistré par son GUID Apple dans l’état persistant du Plugin (`imessage.inbound-dedupe`), revendiqué à l’ingestion et validé après traitement (libéré en cas d’échec transitoire afin de pouvoir réessayer). Tout ce qui a déjà été traité est ignoré au lieu d’être envoyé deux fois. C’est ce qui permet à la récupération de rejouer agressivement sans suivi par message.
- **Récupération après indisponibilité.** Au démarrage, le moniteur mémorise le dernier rowid `chat.db` envoyé (un curseur persistant par compte) et le transmet à `imsg watch.subscribe` comme `since_rowid`, afin que imsg rejoue les lignes arrivées pendant que le Gateway était arrêté, puis suive le flux en direct. Le rejeu est limité aux lignes les plus récentes et aux messages vieux d’environ 2 heures au maximum, et la déduplication ignore tout ce qui a déjà été traité.
- **Barrière d’âge pour l’arriéré obsolète.** Les lignes au-dessus de la limite de démarrage sont réellement en direct ; une ligne dont la date d’envoi est plus ancienne d’environ 15 minutes que son arrivée correspond à l’arriéré vidé par Push et est supprimée. Les lignes rejouées (à la limite ou en dessous) utilisent plutôt la fenêtre de récupération plus large, afin qu’un message récemment manqué soit livré tandis que l’historique ancien ne l’est pas.

La récupération fonctionne avec les configurations `cliPath` locales comme distantes, car le rejeu `since_rowid` s’exécute sur la même connexion RPC `imsg`. La différence est la fenêtre : lorsque le Gateway peut lire `chat.db` (local), il ancre la limite rowid de démarrage, plafonne l’étendue du rejeu et livre les messages manqués vieux de quelques heures au maximum. Avec un `cliPath` SSH distant, il ne peut pas lire la base de données ; le rejeu n’est donc pas plafonné et chaque ligne utilise la barrière d’âge en direct — il récupère toujours les messages récemment manqués et supprime toujours les anciens arriérés, mais avec la fenêtre en direct plus étroite. Exécutez le Gateway sur le Mac Messages pour bénéficier de la fenêtre de récupération plus large.

### Signal visible par l’opérateur

L’arriéré supprimé est journalisé au niveau par défaut, jamais ignoré silencieusement (l’indicateur `recovery` montre quelle fenêtre s’est appliquée) :

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migration

`channels.imessage.catchup.*` est obsolète — la récupération après indisponibilité est désormais automatique et ne nécessite aucune configuration pour les nouvelles installations. Les configurations existantes avec `catchup.enabled: true` restent honorées comme profil de compatibilité pour la fenêtre de rejeu de récupération. Les blocs catchup désactivés (`enabled: false` ou sans `enabled: true`) sont retirés ; `openclaw doctor --fix` les supprime.

## Dépannage

<AccordionGroup>
  <Accordion title="imsg introuvable ou RPC non pris en charge">
    Validez le binaire et la prise en charge RPC :

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonde indique que RPC n’est pas pris en charge, mettez à jour `imsg`. Si les actions d’API privées ne sont pas disponibles, exécutez `imsg launch` dans la session utilisateur macOS connectée et relancez la sonde. Si le Gateway ne s’exécute pas sur macOS, utilisez plutôt la configuration Mac distant via SSH ci-dessus au lieu du chemin local `imsg` par défaut.

  </Accordion>

  <Accordion title="Les messages s’envoient, mais les iMessages entrants n’arrivent pas">
    Vérifiez d’abord si le message a atteint le Mac local. Si `chat.db` ne change pas, OpenClaw ne peut pas recevoir le message même lorsque `imsg status --json` indique un pont sain.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si les messages envoyés depuis le téléphone ne créent aucune nouvelle ligne, réparez la couche Messages macOS et Apple Push avant de modifier la configuration OpenClaw. Un rafraîchissement ponctuel du service suffit souvent :

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envoyez un nouvel iMessage depuis le téléphone et confirmez une nouvelle ligne `chat.db` ou un événement `imsg watch` avant de déboguer les sessions OpenClaw. N’exécutez pas cela comme une boucle périodique de relance du pont ; des `imsg launch` répétés plus des redémarrages du Gateway pendant un travail actif peuvent interrompre les livraisons et bloquer des exécutions de canal en cours.

  </Accordion>

  <Accordion title="Le Gateway ne s’exécute pas sur macOS">
    Le `cliPath: "imsg"` par défaut doit s’exécuter sur le Mac connecté à Messages. Sur Linux ou Windows, définissez `channels.imessage.cliPath` sur un script enveloppe qui se connecte en SSH à ce Mac et exécute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Puis exécutez :

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Les MP sont ignorés">
    Vérifiez :

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - les approbations d’association (`openclaw pairing list imessage`)

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
    - la présence de la clé d’hôte dans `~/.ssh/known_hosts` sur l’hôte du Gateway
    - la lisibilité du chemin distant sur le Mac exécutant Messages

  </Accordion>

  <Accordion title="Les invites d’autorisation macOS ont été manquées">
    Relancez dans un terminal GUI interactif dans le même contexte utilisateur/session et approuvez les invites :

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirmez que l’accès complet au disque et l’automatisation sont accordés pour le contexte de processus qui exécute OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Pointeurs de référence de configuration

- [Référence de configuration - iMessage](/fr/gateway/config-channels#imessage)
- [Configuration du Gateway](/fr/gateway/configuration)
- [Association](/fr/channels/pairing)

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) — annonce et résumé de migration
- [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles) — tableau de traduction de configuration et bascule étape par étape
- [Association](/fr/channels/pairing) — authentification MP et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
