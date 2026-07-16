---
read_when:
    - Configuration de la prise en charge d’iMessage
    - Débogage de l’envoi et de la réception avec iMessage
summary: Prise en charge native d’iMessage via imsg (JSON-RPC sur stdio), avec des actions d’API privée pour les réponses, les réactions Tapback, les effets, les sondages, les pièces jointes et la gestion des groupes. Solution privilégiée pour les nouvelles configurations iMessage d’OpenClaw lorsque les exigences de l’hôte sont satisfaites.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T12:52:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Pour le déploiement OpenClaw iMessage habituel, exécutez le Gateway et `imsg` sur le même hôte macOS connecté à Messages. Si votre Gateway s’exécute ailleurs, faites pointer `channels.imessage.cliPath` vers un wrapper SSH transparent qui exécute `imsg` sur le Mac.

**La récupération des messages entrants est automatique.** Après le redémarrage d’un pont ou du Gateway, iMessage rejoue les messages manqués pendant son indisponibilité et élimine l’ancienne « avalanche de messages en attente » qu’Apple peut envoyer après une récupération Push, avec déduplication afin qu’aucun élément ne soit transmis deux fois. Aucune configuration n’est nécessaire pour l’activer — consultez [Récupération des messages entrants après le redémarrage d’un pont ou du Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
La prise en charge de BlueBubbles a été supprimée. Migrez les configurations `channels.bluebubbles` vers `channels.imessage` ; OpenClaw prend uniquement en charge iMessage via `imsg`. Commencez par [Suppression de BlueBubbles et chemin iMessage avec imsg](/fr/announcements/bluebubbles-imessage) pour consulter l’annonce courte, ou par [Migration depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles) pour consulter le tableau de migration complet.
</Warning>

État : intégration à une CLI externe native. Le Gateway lance `imsg rpc` et communique en JSON-RPC sur les flux d’entrée/sortie standard — aucun démon ni port distinct. Le mode API privée est fortement recommandé pour disposer d’un canal iMessage complet ; les réponses, les tapbacks, les effets, les sondages, les réponses aux pièces jointes et les actions de groupe nécessitent `imsg launch` ainsi qu’une vérification réussie de l’API privée.

Pour la configuration locale courante, l’assistant de configuration d’OpenClaw peut proposer, après confirmation de l’utilisateur, d’installer ou de mettre à jour `imsg` avec Homebrew sur le Mac connecté à Messages. La configuration manuelle et les topologies utilisant un wrapper SSH restent gérées par l’opérateur : installez ou mettez à jour `imsg` dans le même contexte utilisateur que celui qui exécutera le Gateway ou le wrapper.

<CardGroup cols={3}>
  <Card title="Actions de l’API privée" icon="wand-sparkles" href="#private-api-actions">
    Réponses, tapbacks, effets, sondages, pièces jointes et gestion des groupes.
  </Card>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés iMessage utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Mac distant" icon="terminal" href="#remote-mac-over-ssh">
    Utilisez un wrapper SSH lorsque le Gateway ne s’exécute pas sur le Mac hébergeant Messages.
  </Card>
  <Card title="Référence de configuration" icon="settings" href="/fr/gateway/config-channels#imessage">
    Référence complète des champs iMessage.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Mac local (méthode rapide)">
    <Steps>
      <Step title="Installer et vérifier imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Lorsque l’assistant de configuration locale détecte l’absence de la commande `imsg` par défaut, il peut proposer d’installer `steipete/tap/imsg` avec Homebrew. S’il détecte une installation `imsg` gérée par Homebrew, il peut proposer de la réinstaller ou de la mettre à jour. Les wrappers `cliPath` personnalisés ne sont pas modifiés.

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

      <Step title="Approuver l’appairage du premier message privé (dmPolicy par défaut)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Les demandes d’appairage expirent après 1 heure.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac distant via SSH">
    La plupart des configurations ne nécessitent pas SSH. Utilisez cette topologie uniquement lorsque le Gateway ne peut pas s’exécuter sur le Mac connecté à Messages. OpenClaw nécessite seulement un `cliPath` compatible avec les flux d’entrée/sortie standard ; vous pouvez donc faire pointer `cliPath` vers un script wrapper qui se connecte par SSH à un Mac distant et y exécute `imsg`.
    Installez et mettez à jour `imsg` sur ce Mac distant, et non sur l’hôte du Gateway :

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
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
      // Optional: extra allowed attachment roots (merged with the default
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` n’est pas défini, OpenClaw tente de le détecter automatiquement en analysant le script wrapper SSH.
    `remoteHost` doit être `host` ou `user@host` (sans espaces ni options SSH) ; les valeurs non sûres sont ignorées.
    OpenClaw applique une vérification stricte de la clé d’hôte pour SCP ; la clé de l’hôte relais doit donc déjà figurer dans `~/.ssh/known_hosts`.
    Les chemins des pièces jointes sont validés par rapport aux racines autorisées (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Tout wrapper `cliPath` ou proxy SSH placé devant `imsg` DOIT se comporter comme un tube transparent sur les flux d’entrée/sortie standard pour une connexion JSON-RPC de longue durée. OpenClaw échange de petits messages JSON-RPC délimités par des sauts de ligne sur les flux stdin/stdout du wrapper pendant toute la durée de vie du canal :

- Transmettez chaque bloc ou ligne reçu sur stdin **dès que des octets sont disponibles** — n’attendez pas EOF.
- Transmettez rapidement chaque bloc ou ligne reçu sur stdout dans la direction inverse.
- Préservez les sauts de ligne.
- Évitez les lectures bloquantes de taille fixe (`read(4096)`, `cat | buffer`, `read` par défaut du shell), qui peuvent priver les petites trames de traitement.
- Gardez stderr séparé du flux stdout JSON-RPC.

Un wrapper qui met stdin en mémoire tampon jusqu’à ce qu’un grand bloc soit rempli produit des symptômes semblables à une panne d’iMessage — `imsg rpc timeout (chats.list)` ou des redémarrages répétés du canal — même si `imsg rpc` fonctionne correctement. `ssh -T host imsg "$@"` (ci-dessus) est sûr, car il transmet les arguments `cliPath` d’OpenClaw, tels que `rpc` et `--db`. Les pipelines tels que `ssh host imsg | grep -v '^DEBUG'` ne le sont PAS — les outils utilisant une mémoire tampon par ligne peuvent malgré tout retenir les trames ; utilisez `stdbuf -oL -eL` à chaque étape si vous devez appliquer un filtre.
</Warning>

  </Tab>
</Tabs>

## Prérequis et autorisations (macOS)

- Messages doit être connecté sur le Mac qui exécute `imsg`.
- L’accès complet au disque est requis pour le contexte de processus qui exécute OpenClaw/`imsg` (accès à la base de données de Messages).
- L’autorisation Automatisation est requise pour envoyer des messages via Messages.app.
- Pour les actions avancées (réaction / modification / annulation de l’envoi / réponse dans un fil / effets / sondages / opérations de groupe), la protection de l’intégrité du système doit être désactivée — consultez [Activation de l’API privée d’imsg](#enabling-the-imsg-private-api). L’envoi et la réception de texte et de contenus multimédias de base fonctionnent sans la désactiver.

<Tip>
Les autorisations sont accordées par contexte de processus. Si le Gateway s’exécute sans interface utilisateur (LaunchAgent/SSH), exécutez une fois une commande interactive dans ce même contexte afin de déclencher les demandes d’autorisation :

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Échec des envois du wrapper SSH avec AppleEvents -1743">
  Une configuration SSH distante peut lire les conversations, réussir `channels status --probe` et traiter les messages entrants, tandis que les envois sortants continuent d’échouer avec une erreur d’autorisation AppleEvents :

```text
Non autorisé à envoyer des événements Apple à Messages. (-1743)
```

Vérifiez la base de données TCC de l’utilisateur connecté sur le Mac ou System Settings > Privacy & Security > Automation. Si l’entrée Automatisation est enregistrée pour `/usr/libexec/sshd-keygen-wrapper` plutôt que pour le processus `imsg` ou le shell local, macOS peut ne pas afficher de commutateur Messages utilisable pour ce client SSH côté serveur :

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dans cet état, répéter `tccutil reset AppleEvents` ou réexécuter `imsg send` via le même wrapper SSH peut continuer d’échouer, car le contexte de processus qui nécessite l’autorisation Automatisation de Messages est le wrapper SSH, et non une application à laquelle l’interface peut l’accorder.

Utilisez plutôt l’un des contextes de processus `imsg` pris en charge :

- Exécutez le Gateway, ou au moins le pont `imsg`, dans la session locale de l’utilisateur connecté à Messages.
- Démarrez le Gateway avec un LaunchAgent pour cet utilisateur après avoir accordé l’accès complet au disque et l’autorisation Automatisation depuis la même session.
- Si vous conservez la topologie SSH à deux utilisateurs, vérifiez qu’un véritable envoi sortant `imsg send` réussit via le wrapper exact avant d’activer le canal. S’il est impossible de lui accorder l’autorisation Automatisation, reconfigurez l’installation avec un seul utilisateur `imsg` au lieu de dépendre du wrapper SSH pour les envois.

</Accordion>

## Activation de l’API privée d’imsg

`imsg` propose deux modes de fonctionnement. Pour OpenClaw, le mode API privée est la configuration recommandée, car il fournit au canal les actions iMessage natives attendues par les utilisateurs. Le mode de base reste utile pour les installations à faible risque, la vérification initiale ou les hôtes sur lesquels la protection de l’intégrité du système ne peut pas être désactivée.

- **Mode de base** (par défaut, aucune modification de la protection de l’intégrité du système requise) : texte et contenus multimédias sortants via `send`, surveillance et historique entrants, liste des conversations. C’est ce qui est disponible immédiatement avec une nouvelle installation de `brew install steipete/tap/imsg` et les autorisations macOS standard indiquées ci-dessus.
- **Mode API privée** : `imsg` injecte une bibliothèque dynamique auxiliaire dans `Messages.app` afin d’appeler des fonctions internes `IMCore`. Cela débloque `react`, `edit`, `unsend`, `reply` (dans un fil), `sendWithEffect`, `poll` et `poll-vote` (sondages Messages natifs), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ainsi que les indicateurs de saisie et les accusés de lecture.

La surface d’actions recommandée sur cette page nécessite le mode API privée. Le README de `imsg` indique explicitement ce prérequis :

> Les fonctionnalités avancées telles que `read`, `typing`, `launch`, l’envoi enrichi fourni par le pont, la modification des messages et la gestion des conversations sont facultatives. Elles nécessitent la désactivation de la protection de l’intégrité du système et l’injection d’une bibliothèque dynamique auxiliaire dans `Messages.app`. `imsg launch` refuse de procéder à l’injection lorsque la protection de l’intégrité du système est activée.

La technique d’injection de l’auxiliaire utilise la propre bibliothèque dynamique de `imsg` pour accéder aux API privées de Messages. Le chemin iMessage d’OpenClaw ne comporte aucun serveur tiers ni environnement d’exécution BlueBubbles.

<Warning>
**La désactivation de la protection de l’intégrité du système constitue un véritable compromis en matière de sécurité.** Cette protection est l’un des principaux mécanismes de macOS contre l’exécution de code système modifié ; sa désactivation à l’échelle du système augmente la surface d’attaque et peut entraîner des effets secondaires. Notamment, **la désactivation de cette protection sur les Mac Apple Silicon désactive également la possibilité d’installer et d’exécuter des applications iOS sur votre Mac**.

Considérez cette opération comme un choix délibéré, en particulier sur un Mac personnel principal. Pour une intégration OpenClaw iMessage de qualité production, privilégiez un Mac dédié ou un utilisateur macOS réservé au bot sur lequel vous acceptez d’activer le pont. Si votre modèle de menace ne tolère nulle part la désactivation de cette protection, l’intégration iMessage fournie est limitée au mode de base — envoi et réception de texte et de contenus multimédias uniquement, sans réactions, modification, annulation de l’envoi, effets ni opérations de groupe.
</Warning>

### Configuration

1. **Installez (ou mettez à niveau) `imsg`** sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   La sortie de `imsg status --json` indique `bridge_version`, `rpc_methods` et `selectors` pour chaque méthode, afin que vous puissiez voir ce que la version actuelle prend en charge avant de commencer.

2. **Désactivez la protection de l’intégrité du système ainsi que, sur les versions récentes de macOS, la validation des bibliothèques.** L’injection d’une dylib auxiliaire non-Apple dans `Messages.app`, signé par Apple, nécessite de désactiver SIP **et** d’assouplir la validation des bibliothèques. L’étape de désactivation de SIP en mode de récupération dépend de la version de macOS :
   - **macOS 10.13-10.15 (Sierra-Catalina) :** désactivez la validation des bibliothèques via Terminal, redémarrez en mode de récupération, exécutez `csrutil disable`, puis redémarrez.
   - **macOS 11+ (Big Sur et versions ultérieures), Intel :** passez en mode de récupération (ou récupération par Internet), exécutez `csrutil disable`, puis redémarrez.
   - **macOS 11+, Apple Silicon :** utilisez la séquence de démarrage avec le bouton d’alimentation pour accéder au mode de récupération ; sur les versions récentes de macOS, maintenez la touche **Left Shift** enfoncée lorsque vous cliquez sur Continue, puis exécutez `csrutil disable`. Les configurations de machine virtuelle suivent une procédure distincte ; créez donc d’abord un instantané de la VM.

   **Sur macOS 11 et les versions ultérieures, `csrutil disable` seul ne suffit généralement pas.** Apple applique toujours la validation des bibliothèques à `Messages.app` en tant que binaire de plateforme ; un auxiliaire signé ad hoc est donc rejeté (`Library Validation failed: ... platform binary, but mapped file is not`), même lorsque SIP est désactivé. Après avoir désactivé SIP, désactivez également la validation des bibliothèques et redémarrez :

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), vérifié sur 26.5.1 :** la désactivation de SIP **associée** à la commande `DisableLibraryValidation` ci-dessus suffit pour injecter l’auxiliaire sur les versions 26.0 à 26.5.x. **Aucun argument de démarrage n’est requis.** Le fichier plist est le facteur déterminant et l’étape manquante la plus courante lorsque l’injection échoue sur Tahoe :
   - **Avec le fichier plist :** `imsg launch` effectue l’injection et `imsg status` indique `advanced_features: true`.
   - **Sans le fichier plist (même avec SIP désactivé) :** `imsg launch` échoue avec `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rejette l’auxiliaire ad hoc lors du chargement ; le bridge n’est donc jamais prêt et le lancement expire. Cette expiration est le symptôme le plus fréquemment rencontré sur Tahoe ; la solution consiste à utiliser le fichier plist ci-dessus, et non à prendre des mesures plus radicales.

   Si l’injection de `imsg launch` ou certaines opérations de `selectors` commencent à renvoyer false après une mise à niveau de macOS, ce contrôle en est généralement la cause. Vérifiez l’état de SIP et de la validation des bibliothèques avant de supposer que l’étape de désactivation de SIP elle-même a échoué. Si ces réglages sont corrects et que le bridge ne parvient toujours pas à effectuer l’injection, collectez `imsg status --json` ainsi que la sortie de `imsg launch`, puis signalez le problème au projet `imsg` au lieu d’affaiblir d’autres contrôles de sécurité à l’échelle du système.

3. **Injectez l’auxiliaire.** Avec SIP désactivé et Messages.app connecté :

   ```bash
   imsg launch
   ```

   `imsg launch` refuse d’effectuer l’injection tant que SIP est activé ; cette commande permet donc aussi de confirmer que l’étape 2 a bien été effectuée.

4. **Vérifiez le bridge depuis OpenClaw :**

   ```bash
   openclaw channels status --probe
   ```

   L’entrée iMessage doit indiquer `works`, et `imsg status --json | jq '{rpc_methods, selectors}'` doit afficher les fonctionnalités exposées par votre build de macOS. La création de sondages nécessite `selectors.pollPayloadMessage` ; le vote nécessite à la fois `selectors.pollVoteMessage` et la méthode RPC `poll.vote`. Le plugin OpenClaw n’annonce que les actions prises en charge par la sonde mise en cache ; si le cache est vide, il reste optimiste et effectue une sonde lors du premier envoi.

Si `openclaw channels status --probe` indique que le canal est `works`, mais que certaines actions génèrent l’erreur « iMessage `<action>` requires the imsg private API bridge » lors de l’envoi, exécutez à nouveau `imsg launch` : l’auxiliaire peut se détacher (redémarrage de Messages.app, mise à jour du système d’exploitation, etc.) et l’état `available: true` mis en cache continuera d’annoncer les actions jusqu’à ce que la prochaine sonde l’actualise.

### Lorsque SIP reste activé

Si la désactivation de SIP n’est pas acceptable pour votre modèle de menace :

- `imsg` repasse en mode de base : texte, médias et réception uniquement.
- Le plugin OpenClaw continue d’annoncer l’envoi de texte et de médias ainsi que la surveillance des messages entrants ; il masque `react`, `edit`, `unsend`, `reply`, `sendWithEffect` et les opérations de groupe de la surface d’actions, conformément au contrôle des fonctionnalités propre à chaque méthode.
- Vous pouvez utiliser un autre Mac sans Apple Silicon (ou un Mac dédié au bot) avec SIP désactivé pour la charge de travail iMessage, tout en conservant SIP activé sur vos appareils principaux. Consultez la section [Utilisateur macOS dédié au bot (identité iMessage distincte)](#deployment-patterns) ci-dessous.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.imessage.dmPolicy` contrôle les messages privés :

    - `pairing` (valeur par défaut)
    - `allowlist` (nécessite au moins une entrée `allowFrom`)
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    Champ de la liste d’autorisation : `channels.imessage.allowFrom`.

    Les entrées de la liste d’autorisation doivent identifier les expéditeurs : identifiants ou groupes d’accès statiques d’expéditeurs (`accessGroup:<name>`). Utilisez `channels.imessage.groupAllowFrom` pour les cibles de discussion telles que `chat_id:*`, `chat_guid:*` ou `chat_identifier:*` ; utilisez `channels.imessage.groups` pour les clés numériques du registre `chat_id`.

  </Tab>

  <Tab title="Politique de groupe et mentions">
    `channels.imessage.groupPolicy` contrôle la gestion des groupes :

    - `allowlist` (valeur par défaut)
    - `open`
    - `disabled`

    Liste d’autorisation des expéditeurs de groupe : `channels.imessage.groupAllowFrom`.

    Les entrées `groupAllowFrom` peuvent également faire référence à des groupes d’accès statiques d’expéditeurs (`accessGroup:<name>`).

    Repli à l’exécution : si `groupAllowFrom` n’est pas défini, les vérifications des expéditeurs de groupe iMessage utilisent `allowFrom` ; définissez `groupAllowFrom` si les critères d’admission doivent différer entre les messages privés et les groupes. Un `groupAllowFrom: []` explicitement vide n’utilise aucun repli : il bloque tous les expéditeurs de groupe avec `allowlist`.
    Remarque sur l’exécution : si `channels.imessage` est entièrement absent, l’exécution utilise `groupPolicy="allowlist"` comme valeur de repli et consigne un avertissement, même si `channels.defaults.groupPolicy` est défini.

    <Warning>
    Le routage des groupes avec `groupPolicy: "allowlist"` applique **deux** contrôles successifs :

    1. **Liste d’autorisation des expéditeurs** (`channels.imessage.groupAllowFrom`) : identifiant, `accessGroup:<name>`, `chat_guid`, `chat_identifier` ou `chat_id`. Une liste effective vide (aucun `groupAllowFrom` et aucun repli vers `allowFrom`) bloque tous les expéditeurs de groupe.
    2. **Registre des groupes** (`channels.imessage.groups`) : appliqué dès que la table contient des entrées ; la discussion doit correspondre à une entrée explicite pour chaque `chat_id` ou au caractère générique `groups: { "*": { ... } }`. Lorsque `groups` est vide ou absent, seule la liste d’autorisation des expéditeurs détermine l’admission.

    Si aucune liste d’autorisation effective des expéditeurs de groupe n’est configurée, chaque message de groupe est ignoré avant le contrôle du registre. Chaque contrôle possède son propre signal de niveau `warn` au niveau de journalisation par défaut, et chacun indique une correction différente :

    - une fois par compte au démarrage, lorsque la liste d’autorisation effective des expéditeurs de groupe est vide : `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — corrigez le problème en définissant `channels.imessage.groupAllowFrom` (ou `allowFrom`) ; l’ajout d’entrées `groups` uniquement laisse le contrôle 1 bloquer tous les expéditeurs.
    - une fois par `chat_id` à l’exécution, lorsqu’un expéditeur a passé le contrôle 1, mais que la discussion est absente d’un registre `groups` non vide : `imessage: dropping group message from chat_id=<id> ...` — corrigez le problème en ajoutant ce `chat_id` (ou `"*"`) sous `channels.imessage.groups`.

    Les messages privés ne sont pas affectés : ils suivent un chemin de code différent.

    Configuration recommandée pour le flux de groupe avec `groupPolicy: "allowlist"` :

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

    `groupAllowFrom` seul autorise ces expéditeurs dans n’importe quel groupe ; ajoutez le bloc `groups` pour limiter les discussions autorisées et définir des options propres à chaque discussion, telles que `requireMention`.
    </Warning>

    Contrôle des mentions pour les groupes :

    - iMessage ne fournit aucune métadonnée native de mention
    - la détection des mentions utilise des expressions régulières (`agents.list[].groupChat.mentionPatterns`, avec `messages.groupChat.mentionPatterns` comme valeur de repli)
    - sans motif configuré, le contrôle des mentions ne peut pas être appliqué
    - les commandes de contrôle provenant d’expéditeurs autorisés contournent le contrôle des mentions

    `systemPrompt` propre à chaque groupe :

    Chaque entrée sous `channels.imessage.groups.*` accepte une chaîne `systemPrompt` facultative, injectée dans le prompt système de l’agent à chaque tour traitant un message de ce groupe. La résolution suit celle de `channels.whatsapp.groups` :

    1. **Prompt système propre au groupe** (`groups["<chat_id>"].systemPrompt`) : utilisé lorsque l’entrée du groupe concerné existe dans la table **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est neutralisé et aucun prompt système n’est appliqué à ce groupe.
    2. **Prompt système générique des groupes** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe concerné est entièrement absente de la table, ou lorsqu’elle existe, mais ne définit aucune clé `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Utilisez l’orthographe britannique." },
            "8421": {
              requireMention: true,
              systemPrompt: "Il s’agit de la discussion de rotation des permanences. Limitez les réponses à moins de 3 phrases.",
            },
            "9907": {
              // neutralisation explicite : le caractère générique « Utilisez l’orthographe britannique. » ne s’applique pas ici
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Les prompts propres aux groupes s’appliquent uniquement aux messages de groupe ; les messages privés ne sont pas affectés.

  </Tab>

  <Tab title="Sessions et réponses déterministes">
    - Les messages privés utilisent le routage direct ; les groupes utilisent le routage de groupe.
    - Avec la valeur par défaut de `session.dmScope=main`, les messages privés iMessage sont regroupés dans la session principale de l’agent.
    - Les sessions de groupe sont isolées (`agent:<agentId>:imessage:group:<chat_id>`).
    - Les réponses sont renvoyées vers iMessage à l’aide des métadonnées du canal et de la cible d’origine.

    Comportement des fils assimilables à des groupes :

    Certains fils iMessage comptant plusieurs participants peuvent arriver avec `is_group=false`.
    Si ce `chat_id` est explicitement configuré sous `channels.imessage.groups`, OpenClaw le traite comme du trafic de groupe (contrôles de groupe et isolation de la session de groupe).

  </Tab>
</Tabs>

## Liaisons de conversations ACP

Les discussions iMessage peuvent être liées à des sessions ACP.

Procédure rapide pour l’opérateur :

- Exécutez `/acp spawn codex --bind here` dans le message privé ou la discussion de groupe autorisée.
- Les messages ultérieurs de cette même conversation iMessage sont acheminés vers la session ACP créée.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées utilisent des entrées `bindings[]` de premier niveau avec `type: "acp"` et `match.channel: "imessage"`.

`match.peer.id` peut utiliser :

- un identifiant de message privé normalisé tel que `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recommandé pour les liaisons de groupe stables)
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

Consultez [Agents ACP](/fr/tools/acp-agents) pour connaître le comportement commun des liaisons ACP.

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Utilisateur macOS dédié au bot (identité iMessage distincte)">
    Utilisez un identifiant Apple et un utilisateur macOS dédiés afin d’isoler le trafic du bot de votre profil Messages personnel.

    Procédure habituelle :

    1. Créez/connectez-vous à un utilisateur macOS dédié.
    2. Connectez-vous à Messages avec l’identifiant Apple du bot pour cet utilisateur.
    3. Installez `imsg` pour cet utilisateur.
    4. Créez un wrapper SSH afin qu’OpenClaw puisse exécuter `imsg` dans le contexte de cet utilisateur.
    5. Faites pointer `channels.imessage.accounts.<id>.cliPath` et `.dbPath` vers le profil de cet utilisateur.

    La première exécution peut nécessiter des autorisations dans l’interface graphique (Automatisation + Accès complet au disque) au sein de la session de cet utilisateur bot.

  </Accordion>

  <Accordion title="Mac distant via Tailscale (exemple)">
    Topologie courante :

    - Le Gateway s’exécute sur Linux/une VM
    - iMessage + `imsg` s’exécutent sur un Mac de votre réseau Tailscale
    - Le wrapper `cliPath` utilise SSH pour exécuter `imsg`
    - `remoteHost` permet la récupération des pièces jointes par SCP

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

    Utilisez des clés SSH afin que SSH et SCP fonctionnent sans interaction.
    Vérifiez d’abord que la clé de l’hôte est approuvée (par exemple `ssh bot@mac-mini.tailnet-1234.ts.net`) afin que `known_hosts` soit renseigné.

  </Accordion>

  <Accordion title="Configuration multicompte">
    iMessage prend en charge une configuration par compte sous `channels.imessage.accounts`.

    Chaque compte peut remplacer des champs tels que `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, les paramètres d’historique et les listes d’autorisation des racines de pièces jointes.

  </Accordion>

  <Accordion title="Historique des messages directs">
    Définissez `channels.imessage.dmHistoryLimit` pour initialiser les nouvelles sessions de messages directs avec l’historique récent décodé de `imsg` pour cette conversation. Utilisez `channels.imessage.dms["<sender>"].historyLimit` pour les remplacements par expéditeur, notamment `0` afin de désactiver l’historique pour un expéditeur.

    L’historique des messages directs iMessage est récupéré à la demande depuis `imsg`. Si `dmHistoryLimit` n’est pas défini, l’initialisation globale de l’historique des messages directs est désactivée, mais une valeur positive de `channels.imessage.dms["<sender>"].historyLimit` propre à un expéditeur active tout de même l’initialisation pour celui-ci.

  </Accordion>
</AccordionGroup>

## Médias, découpage et cibles de livraison

<AccordionGroup>
  <Accordion title="Pièces jointes et médias">
    - L’ingestion des pièces jointes entrantes est **désactivée par défaut** — définissez `channels.imessage.includeAttachments: true` pour transmettre les photos, mémos vocaux, vidéos et autres pièces jointes à l’agent. Lorsqu’elle est désactivée, les iMessages contenant uniquement une pièce jointe sont supprimés avant d’atteindre l’agent et peuvent ne produire aucune ligne de journal `Inbound message`.
    - Les chemins distants des pièces jointes peuvent être récupérés par SCP lorsque `remoteHost` est défini
    - Les chemins des pièces jointes doivent correspondre aux racines autorisées :
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP distant)
      - Les racines configurées étendent le modèle de racine par défaut `/Users/*/Library/Messages/Attachments` (elles sont fusionnées, et non remplacées)
    - SCP utilise une vérification stricte de la clé d’hôte (`StrictHostKeyChecking=yes`)
    - La taille des médias sortants utilise `channels.imessage.mediaMaxMb` (16 Mo par défaut)

  </Accordion>

  <Accordion title="Texte sortant et découpage">
    - Limite de taille des segments de texte : `channels.imessage.textChunkLimit` (4000 par défaut)
    - Mode de découpage : `channels.imessage.streaming.chunkMode`
      - `length` (par défaut)
      - `newline` (découpage prioritaire par paragraphes)
    - Le gras, l’italique, le soulignement et le barré Markdown sortants sont convertis en texte stylisé natif (les destinataires sous macOS 15+ voient la mise en forme ; les destinataires sous des versions antérieures voient du texte brut sans les marqueurs) ; les tableaux Markdown sont convertis selon le mode de tableaux Markdown du canal
    - `channels.imessage.sendTransport` (`auto` par défaut, `bridge`, `applescript`) détermine comment `imsg` effectue les envois

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

## Actions de l’API privée

Lorsque `imsg launch` est en cours d’exécution et que `openclaw channels status --probe` indique `privateApi.available: true`, l’outil de messagerie peut utiliser des actions natives d’iMessage en plus des envois de texte ordinaires.

Toutes les actions sont activées par défaut ; utilisez `channels.imessage.actions` pour désactiver des actions individuellement :

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
    - **react** : Ajoute/supprime des réactions Tapback iMessage (`messageId`, `emoji`, `remove`). Les Tapbacks pris en charge correspondent à l’amour, l’approbation, la désapprobation, le rire, l’emphase et l’interrogation. Une suppression sans emoji efface le Tapback défini, quel qu’il soit.
    - **reply** : Envoie une réponse dans un fil à un message existant (`messageId`, `text` ou `message`, ainsi que `chatGuid`, `chatId`, `chatIdentifier` ou `to`). Une réponse avec pièce jointe nécessite en outre une version de `imsg` dont `send-rich` prend en charge `--file`.
    - **sendWithEffect** : Envoie du texte avec un effet iMessage (`text` ou `message`, `effect` ou `effectId`). Noms courts : slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit** : Modifie un message envoyé sur les versions de macOS/de l’API privée prises en charge (`messageId`, `text` ou `newText`). Seuls les messages envoyés par le Gateway lui-même peuvent être modifiés.
    - **unsend** : Retire un message envoyé sur les versions de macOS/de l’API privée prises en charge (`messageId`). Seuls les messages envoyés par le Gateway lui-même peuvent être retirés.
    - **upload-file** : Envoie des médias/fichiers (`buffer` en base64 ou un élément `media`/`path`/`filePath` hydraté, `filename`, avec `asVoice` facultatif). Ancien alias : `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup** : Gèrent les discussions de groupe lorsque la cible actuelle est une conversation de groupe. Ces actions modifient l’identité Messages de l’hôte ; elles nécessitent donc un expéditeur propriétaire ou un client Gateway `operator.admin`.
    - **poll** : Crée un sondage natif dans Apple Messages (`pollQuestion`, `pollOption` répété de 2 à 12 fois, ainsi que `chatGuid`, `chatId`, `chatIdentifier` ou `to`). Les destinataires sous iOS/iPadOS/macOS 26+ le voient et votent de manière native ; les versions antérieures des systèmes d’exploitation reçoivent le texte de repli « Sondage envoyé ». Nécessite `selectors.pollPayloadMessage`.
    - **poll-vote** : Vote dans un sondage existant (`pollId` ou `messageId`, ainsi qu’exactement un élément parmi `pollOptionIndex`, `pollOptionId` ou `pollOptionText`). Nécessite `selectors.pollVoteMessage` et la méthode RPC `poll.vote`.

    Les sondages entrants acceptés sont présentés à l’agent avec la question, les libellés numérotés des options, le nombre de votes et l’identifiant du message de sondage requis par `poll-vote`.

  </Accordion>

  <Accordion title="Identifiants de message">
    Le contexte iMessage entrant inclut à la fois des valeurs `MessageSid` courtes et les GUID complets des messages (`MessageSidFull`) lorsqu’ils sont disponibles. Les identifiants courts sont limités au cache récent de réponses fondé sur SQLite et sont vérifiés par rapport à la discussion actuelle avant utilisation. Si un identifiant court expire, réessayez avec son `MessageSidFull` en ciblant la conversation qui l’a fourni. Les identifiants complets ne contournent pas la liaison à la conversation ou au compte ; remplacez donc un identifiant provenant d’une autre discussion par un identifiant de la cible actuelle. Les appels distants délégués peuvent rejeter des identifiants complets obsolètes lorsque la conversation actuelle ne fournit aucun élément permettant de les valider.

  </Accordion>

  <Accordion title="Détection des capacités">
    OpenClaw masque les actions de l’API privée uniquement lorsque l’état de détection mis en cache indique que le pont est indisponible. Si l’état est inconnu, les actions restent visibles et leur exécution lance la détection à la demande, afin que la première action puisse réussir après `imsg launch` sans actualisation manuelle distincte de l’état.

  </Accordion>

  <Accordion title="Accusés de lecture et saisie">
    Lorsque le pont de l’API privée est actif, les discussions entrantes acceptées sont marquées comme lues et les discussions directes affichent une bulle de saisie dès que le tour est accepté, pendant que l’agent prépare le contexte et génère la réponse. Désactivez le marquage comme lu avec :

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Les anciennes versions de `imsg`, antérieures à la liste des capacités par méthode, désactivent silencieusement la saisie/lecture ; OpenClaw consigne un avertissement unique à chaque redémarrage afin de permettre d’attribuer l’absence d’accusé.

  </Accordion>

  <Accordion title="Tapbacks entrants">
    OpenClaw s’abonne aux Tapbacks iMessage et achemine les réactions acceptées comme des événements système plutôt que comme du texte de message normal ; ainsi, le Tapback d’un utilisateur ne déclenche pas une boucle de réponse ordinaire.

    Le mode de notification est contrôlé par `channels.imessage.reactionNotifications` :

    - `"own"` (par défaut) : notifier uniquement lorsque les utilisateurs réagissent aux messages rédigés par le bot.
    - `"all"` : notifier pour tous les Tapbacks entrants provenant d’expéditeurs autorisés.
    - `"off"` : ignorer les Tapbacks entrants.

    Les remplacements par compte utilisent `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Réactions d’approbation (👍 / 👎)">
    Lorsque `approvals.exec.enabled` ou `approvals.plugin.enabled` vaut true et que la demande est acheminée vers iMessage, le Gateway transmet nativement une invite d’approbation et accepte un Tapback pour la traiter :

    - `👍` (Tapback d’approbation) → `allow-once`
    - `👎` (Tapback de désapprobation) → `deny`
    - `allow-always` reste une solution de repli manuelle : envoyez `/approve <id> allow-always` comme réponse ordinaire.

    Le traitement des réactions exige que l’identifiant de l’utilisateur qui réagit figure explicitement parmi les approbateurs. La liste des approbateurs est lue depuis `channels.imessage.allowFrom` (ou `channels.imessage.accounts.<id>.allowFrom`) ; ajoutez le numéro de téléphone de l’utilisateur au format E.164 ou l’adresse e-mail de son identifiant Apple (les cibles de discussion telles que `chat_id:*` ne sont pas des entrées d’approbateur valides). L’entrée générique `"*"` est prise en compte, mais permet à n’importe quel expéditeur d’approuver ; une liste d’approbateurs vide désactive entièrement le raccourci par réaction. Le raccourci par réaction contourne intentionnellement `reactionNotifications`, `dmPolicy` et `groupAllowFrom`, car la liste d’autorisation explicite des approbateurs est le seul contrôle pertinent pour traiter l’approbation.

    L’autorisation de la commande textuelle `/approve` suit la même liste : lorsque `channels.imessage.allowFrom` n’est pas vide, `/approve <id> <decision>` est autorisé selon cette liste d’approbateurs (et non selon la liste d’autorisation plus large des messages directs), et les expéditeurs autorisés par la liste des messages directs mais absents de `allowFrom` reçoivent un refus explicite. Lorsque `allowFrom` est vide, la solution de repli limitée à la même discussion reste active et `/approve` autorise toute personne admise par la liste d’autorisation des messages directs. Ajoutez chaque opérateur devant pouvoir approuver — via `/approve` ou par des réactions — à `allowFrom`.

    Notes pour l’opérateur :
    - La liaison de réaction est stockée à la fois en mémoire et dans le stockage persistant indexé du Gateway (avec une durée de vie correspondant à l’expiration de l’approbation), et le Gateway interroge également les invites en attente pour détecter les tapbacks ; ainsi, un tapback reçu peu après le redémarrage d’un Gateway résout tout de même l’approbation.
    - Le tapback `is_from_me=true` de l’opérateur lui-même (par exemple depuis un appareil Apple jumelé) résout l’approbation lorsque cet identifiant est explicitement désigné comme approbateur.
    - Les invites d’approbation ne sont acheminées vers une conversation de groupe que lorsque des approbateurs explicites sont configurés ; sinon, n’importe quel membre du groupe pourrait approuver.
    - Les anciens tapbacks au format texte (`Liked "…"` en texte brut provenant de très anciens clients Apple) ne peuvent pas résoudre les approbations, car ils ne contiennent aucun GUID de message ; la résolution par réaction nécessite les métadonnées structurées de tapback émises par les clients macOS / iOS actuels.

  </Accordion>
</AccordionGroup>

## Écriture de la configuration

iMessage autorise par défaut les écritures de configuration initiées par le canal (pour `/config set|unset` lorsque `commands.config: true`).

Pour désactiver cette fonctionnalité :

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

## Regroupement des messages privés envoyés séparément (commande + URL dans une même composition)

Lorsqu’un utilisateur saisit ensemble une commande et une URL — par exemple `Dump https://example.com/article` — l’application Messages d’Apple divise l’envoi en **deux lignes `chat.db` distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec les images de l’aperçu OG en pièces jointes.

Sur la plupart des configurations, les deux lignes parviennent à OpenClaw à environ 0.8-2.0 s d’intervalle. Sans regroupement, l’agent reçoit uniquement la commande au tour 1 (et répond souvent « envoyez-moi l’URL ») avant que l’URL n’arrive au tour 2. Cela provient du pipeline d’envoi d’Apple, et non d’OpenClaw ou de `imsg`.

`channels.imessage.coalesceSameSenderDms` active pour un message privé la mise en mémoire tampon des lignes consécutives provenant du même expéditeur. Lorsque `imsg` expose le marqueur structurel d’aperçu d’URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` sur l’une des lignes sources, OpenClaw fusionne uniquement cet envoi réellement divisé et conserve les autres lignes mises en mémoire tampon sous forme de tours distincts. Sur les anciennes versions de `imsg` qui n’émettent aucune métadonnée de bulle, OpenClaw ne peut pas distinguer un envoi divisé de plusieurs envois distincts ; il fusionne donc le lot par défaut. Cela préserve le comportement antérieur aux métadonnées au lieu de faire régresser les envois divisés de `Dump <url>` en deux tours. Les conversations de groupe continuent à distribuer chaque message séparément afin de préserver la structure des tours impliquant plusieurs utilisateurs.

<Tabs>
  <Tab title="Quand l’activer">
    Activez cette option dans les cas suivants :

    - Vous distribuez des Skills qui attendent `command + payload` dans un même message (vider, coller, enregistrer, mettre en file d’attente, etc.).
    - Vos utilisateurs collent des URL avec leurs commandes.
    - Vous pouvez accepter la latence supplémentaire des tours de messages privés (voir ci-dessous).

    Laissez-la désactivée dans les cas suivants :

    - Vous avez besoin d’une latence de commande minimale pour les déclencheurs de messages privés constitués d’un seul mot.
    - Tous vos flux sont des commandes ponctuelles sans charge utile envoyée ultérieurement.

  </Tab>
  <Tab title="Activation">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // activation explicite (valeur par défaut : false)
        },
      },
    }
    ```

    Lorsque l’option est activée et qu’aucun `messages.inbound.byChannel.imessage` explicite ni `messages.inbound.debounceMs` global n’est défini, la fenêtre d’anti-rebond passe à **7000 ms** (la valeur par défaut historique est de 0 ms — aucun anti-rebond). Cette fenêtre élargie est nécessaire, car le rythme des envois divisés d’aperçus d’URL d’Apple peut s’étendre sur plusieurs secondes pendant que Messages.app émet la ligne d’aperçu.

    Pour régler vous-même la fenêtre :

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms couvrent les délais d’aperçu d’URL observés dans Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromis">
    - **Une fusion précise nécessite les métadonnées de charge utile actuelles de `imsg`.** Lorsque `balloon_bundle_id` est présent, seul l’envoi réellement divisé est fusionné ; la fusion de secours sans métadonnées décrite précédemment assure une rétrocompatibilité temporaire et sera supprimée une fois que `imsg` regroupera les envois divisés en amont.
    - **Latence supplémentaire pour les messages privés.** Lorsque l’option est activée, chaque message privé (y compris les commandes de contrôle autonomes et les messages de suivi contenant uniquement du texte) attend jusqu’à la fin de la fenêtre d’anti-rebond avant d’être distribué, au cas où une ligne d’aperçu d’URL arriverait. Les messages des conversations de groupe restent distribués instantanément.
    - **La sortie fusionnée est limitée.** Le texte fusionné est limité à 4000 caractères avec un marqueur `…[truncated]` explicite ; les pièces jointes sont limitées à 20 ; les entrées sources sont limitées à 10 (au-delà, la première et les plus récentes sont conservées). Chaque GUID source est enregistré dans `coalescedMessageGuids` pour la télémétrie en aval.
    - **Messages privés uniquement.** Les conversations de groupe continuent à distribuer chaque message séparément afin que le bot reste réactif lorsque plusieurs personnes saisissent du texte.
    - **Activation explicite, par canal.** Les autres canaux (Discord, Slack, Telegram, WhatsApp, …) ne sont pas affectés. Les anciennes configurations BlueBubbles qui définissent `channels.bluebubbles.coalesceSameSenderDms` doivent migrer cette valeur vers `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scénarios et contenu reçu par l’agent

La colonne « Option activée » présente le comportement sur une version de `imsg` qui émet `balloon_bundle_id`. Sur les anciennes versions de `imsg` qui n’émettent aucune métadonnée de bulle, les lignes ci-dessous indiquées comme « Deux tours » / « N tours » reviennent plutôt à une fusion historique (un tour) : OpenClaw ne peut pas distinguer structurellement un envoi divisé de plusieurs envois distincts et préserve donc la fusion antérieure aux métadonnées. La séparation précise s’active dès que la version émet des métadonnées de bulle.

| Composition de l’utilisateur                                      | Résultat produit par `chat.db`       | Option désactivée (par défaut)                    | Option activée + fenêtre (imsg émet des métadonnées de bulle)                                           |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envoi)                              | 2 lignes à environ 1 s d’intervalle | Deux tours d’agent : « Dump » seul, puis l’URL   | Un tour : texte fusionné `Dump https://example.com`                                                           |
| `Save this 📎image.jpg caption` (pièce jointe + texte)                | 2 lignes sans métadonnées de bulle d’URL | Deux tours                                    | Deux tours après détection des métadonnées ; un tour fusionné dans les anciennes sessions sans métadonnées ou antérieures au verrouillage |
| `/status` (commande autonome)                                     | 1 ligne                               | Distribution instantanée                        | **Attente jusqu’à la fin de la fenêtre, puis distribution**                                           |
| URL collée seule                                                   | 1 ligne                               | Distribution instantanée                        | Attente jusqu’à la fin de la fenêtre, puis distribution                                                |
| Texte + URL envoyés volontairement sous forme de deux messages distincts à plusieurs minutes d’intervalle | 2 lignes hors fenêtre               | Deux tours                                      | Deux tours (la fenêtre expire entre les deux)                                                           |
| Afflux rapide (>10 petits messages privés dans la fenêtre)         | N lignes sans métadonnées de bulle d’URL | N tours                                      | N tours après détection des métadonnées ; un tour fusionné et limité dans les anciennes sessions sans métadonnées ou antérieures au verrouillage |
| Deux personnes saisissent du texte dans une conversation de groupe | N lignes provenant de M expéditeurs  | M+ tours (un par lot d’expéditeur)               | M+ tours — les conversations de groupe ne sont pas regroupées                                          |

## Récupération des messages entrants après le redémarrage d’un pont ou du Gateway

iMessage récupère les messages manqués pendant l’arrêt du Gateway, tout en supprimant l’ancienne « avalanche de messages en attente » qu’Apple peut libérer après une récupération Push. Le comportement par défaut est toujours actif et repose sur la déduplication des messages entrants.

- **Déduplication des réexécutions.** Chaque message entrant distribué est enregistré à l’aide de son GUID Apple dans l’état persistant du Plugin (`imessage.inbound-dedupe`), réservé lors de l’ingestion et validé après le traitement (puis libéré en cas d’échec temporaire afin de permettre une nouvelle tentative). Tout élément déjà traité est supprimé au lieu d’être distribué deux fois. Cela permet à la récupération de réexécuter les messages de manière intensive sans suivi individuel.
- **Récupération après une interruption.** Au démarrage, le moniteur mémorise le dernier rowid de `chat.db` distribué (un curseur persistant par compte) et le transmet à `imsg watch.subscribe` sous la forme `since_rowid`, afin qu’imsg réexécute les lignes reçues pendant l’arrêt du Gateway, puis suive les messages en direct. La réexécution est limitée aux 500 lignes les plus récentes et aux messages datant d’au plus ~2 heures ; la déduplication supprime tout élément déjà traité.
- **Limite d’âge des anciens messages en attente.** Les lignes situées au-dessus de la limite de démarrage sont réellement reçues en direct ; toute ligne dont la date d’envoi précède son arrivée de plus de ~15 minutes appartient aux messages en attente libérés par Push et est supprimée. Les lignes réexécutées (au niveau ou en dessous de la limite) utilisent plutôt la fenêtre de récupération élargie, afin qu’un message récemment manqué soit distribué sans inclure l’historique ancien.

La récupération fonctionne avec les configurations `cliPath` locales et distantes, car la réexécution de `since_rowid` utilise la même connexion RPC `imsg`. La différence réside dans la fenêtre : lorsque le Gateway peut lire `chat.db` (en local), il ancre la limite de rowid au démarrage, plafonne la plage de réexécution et distribue les messages manqués datant de quelques heures au maximum. Avec un `cliPath` distant via SSH, il ne peut pas lire la base de données ; la réexécution n’est donc pas plafonnée et chaque ligne utilise la limite d’âge des messages en direct. Les messages récemment manqués sont tout de même récupérés et les anciens messages en attente sont toujours supprimés, mais avec la fenêtre plus étroite des messages en direct. Exécutez le Gateway sur le Mac hébergeant Messages pour bénéficier de la fenêtre de récupération élargie.

### Signal visible par l’opérateur

La suppression des messages en attente est consignée au niveau de journalisation par défaut et n’est jamais effectuée silencieusement (l’indicateur `recovery` précise la fenêtre appliquée) :

```text
imessage: anciens messages entrants en attente supprimés account=<id> sent=<iso> recovery=<bool> (<N> supprimés depuis le démarrage)
```

### Migration

`channels.imessage.catchup.*` est obsolète — la récupération après une interruption est automatique et ne nécessite aucune configuration pour les nouvelles installations. Les configurations existantes avec `catchup.enabled: true` restent prises en charge comme profil de compatibilité pour la fenêtre de réexécution de récupération. Les blocs de rattrapage désactivés (`enabled: false` ou absence de `enabled: true`) sont retirés ; `openclaw doctor --fix` les supprime.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="imsg introuvable ou RPC non pris en charge">
    Vérifiez le binaire et la prise en charge de RPC :

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonde indique que RPC n’est pas pris en charge, mettez à jour `imsg`. Si les actions de l’API privée ne sont pas disponibles, exécutez `imsg launch` dans la session de l’utilisateur macOS connecté, puis relancez la sonde. Si le Gateway ne s’exécute pas sous macOS, utilisez plutôt la configuration Mac distant via SSH décrite précédemment au lieu du chemin `imsg` local par défaut.

  </Accordion>

  <Accordion title="Les messages sont envoyés, mais les iMessages entrants n’arrivent pas">
    Vérifiez d’abord si le message a atteint le Mac local. Si `chat.db` ne change pas, OpenClaw ne peut pas recevoir le message, même lorsque `imsg status --json` indique que le pont fonctionne correctement.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si les messages envoyés depuis le téléphone ne créent aucune nouvelle ligne, réparez la couche Messages de macOS et Apple Push avant de modifier la configuration d’OpenClaw. Une actualisation ponctuelle du service suffit souvent :

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envoyez un nouvel iMessage depuis le téléphone et confirmez l’apparition d’une nouvelle ligne `chat.db` ou d’un nouvel événement `imsg watch` avant de déboguer les sessions OpenClaw. N’exécutez pas cette procédure comme une boucle périodique de relance du pont ; des `imsg launch` répétés ainsi que des redémarrages du Gateway pendant une activité en cours peuvent interrompre les livraisons et bloquer les exécutions de canal en cours.

  </Accordion>

  <Accordion title="Le Gateway ne fonctionne pas sur macOS">
    Le `cliPath: "imsg"` par défaut doit s’exécuter sur le Mac connecté à Messages. Sous Linux ou Windows, définissez `channels.imessage.cliPath` sur un script enveloppe qui se connecte à ce Mac via SSH et exécute `imsg "$@"`.

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
    - approbations d’association (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Les messages de groupe sont ignorés">
    Vérifiez :

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` comportement de la liste d’autorisation
    - configuration du motif de mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Échec des pièces jointes distantes">
    Vérifiez :

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - authentification par clé SSH/SCP depuis l’hôte du Gateway
    - la clé de l’hôte existe dans `~/.ssh/known_hosts` sur l’hôte du Gateway
    - la lisibilité du chemin distant sur le Mac exécutant Messages

  </Accordion>

  <Accordion title="Les demandes d’autorisation de macOS ont été ignorées">
    Réexécutez la commande dans un terminal graphique interactif, avec le même contexte d’utilisateur et de session, puis approuvez les demandes :

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirmez que l’accès complet au disque et l’automatisation sont accordés au contexte de processus qui exécute OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Liens vers la référence de configuration

- [Référence de configuration — iMessage](/fr/gateway/config-channels#imessage)
- [Configuration du Gateway](/fr/gateway/configuration)
- [Appairage](/fr/channels/pairing)

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Suppression de BlueBubbles et chemin iMessage avec imsg](/fr/announcements/bluebubbles-imessage) — annonce et résumé de la migration
- [Migration depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles) — tableau de transposition de la configuration et basculement étape par étape
- [Appairage](/fr/channels/pairing) — authentification des messages privés et processus d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
