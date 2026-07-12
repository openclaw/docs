---
read_when:
    - Configuration de la prise en charge d’iMessage
    - Débogage de l’envoi et de la réception avec iMessage
summary: Prise en charge native d’iMessage via imsg (JSON-RPC sur stdio), avec des actions d’API privée pour les réponses, les réactions Tapback, les effets, les sondages, les pièces jointes et la gestion des groupes. Solution recommandée pour les nouvelles configurations OpenClaw avec iMessage lorsque les exigences de l’hôte sont satisfaites.
title: iMessage
x-i18n:
    generated_at: "2026-07-12T15:03:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 81819aad1a9199791c3c02eb0c9cc72059c663710140b33ba31f79b4bc59d8e2
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Pour le déploiement iMessage OpenClaw habituel, exécutez le Gateway et `imsg` sur le même hôte macOS connecté à Messages. Si votre Gateway s’exécute ailleurs, définissez `channels.imessage.cliPath` sur un wrapper SSH transparent qui exécute `imsg` sur le Mac.

**La récupération des messages entrants est automatique.** Après le redémarrage d’un pont ou du Gateway, iMessage rejoue les messages manqués pendant son indisponibilité et supprime l’ancienne « avalanche de messages en attente » qu’Apple peut envoyer après une récupération Push, avec déduplication afin qu’aucun message ne soit distribué deux fois. Aucune configuration n’est nécessaire pour l’activer — consultez [Récupération des messages entrants après le redémarrage d’un pont ou du Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
La prise en charge de BlueBubbles a été supprimée. Migrez les configurations `channels.bluebubbles` vers `channels.imessage` ; OpenClaw prend uniquement en charge iMessage via `imsg`. Commencez par [Suppression de BlueBubbles et chemin iMessage via imsg](/fr/announcements/bluebubbles-imessage) pour l’annonce courte, ou par [Migration depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles) pour le tableau de migration complet.
</Warning>

État : intégration CLI externe native. Le Gateway lance `imsg rpc` et communique en JSON-RPC via les flux d’entrée/sortie standard — aucun démon ni port séparé. Le mode API privée est vivement recommandé pour disposer d’un canal iMessage complet ; les réponses, réactions tapback, effets, sondages, réponses aux pièces jointes et actions de groupe nécessitent `imsg launch` et une vérification réussie de l’API privée.

Pour la configuration locale courante, l’assistant de configuration d’OpenClaw peut proposer, après confirmation de l’utilisateur, d’installer ou de mettre à jour `imsg` avec Homebrew sur le Mac connecté à Messages. La configuration manuelle et les topologies utilisant un wrapper SSH restent gérées par l’opérateur : installez ou mettez à jour `imsg` dans le même contexte utilisateur que celui qui exécutera le Gateway ou le wrapper.

<CardGroup cols={3}>
  <Card title="Actions de l’API privée" icon="wand-sparkles" href="#private-api-actions">
    Réponses, réactions tapback, effets, sondages, pièces jointes et gestion des groupes.
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

        Lorsque l’assistant de configuration locale détecte que la commande `imsg` par défaut est absente, il peut proposer d’installer `steipete/tap/imsg` via Homebrew. S’il détecte une installation de `imsg` gérée par Homebrew, il peut proposer de la réinstaller ou de la mettre à jour. Les wrappers `cliPath` personnalisés ne sont pas modifiés.

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
    La plupart des configurations ne nécessitent pas SSH. Utilisez cette topologie uniquement lorsque le Gateway ne peut pas s’exécuter sur le Mac connecté à Messages. OpenClaw nécessite seulement un `cliPath` compatible avec les flux d’entrée/sortie standard ; vous pouvez donc définir `cliPath` sur un script wrapper qui se connecte par SSH à un Mac distant et y exécute `imsg`.
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
      remoteHost: "user@gateway-host", // utilisé pour récupérer les pièces jointes via SCP
      includeAttachments: true,
      // Facultatif : racines de pièces jointes autorisées supplémentaires (fusionnées avec la valeur par défaut
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` n’est pas défini, OpenClaw tente de le détecter automatiquement en analysant le script wrapper SSH.
    `remoteHost` doit être au format `host` ou `user@host` (sans espaces ni options SSH) ; les valeurs non sûres sont ignorées.
    OpenClaw utilise une vérification stricte de la clé d’hôte pour SCP ; la clé de l’hôte relais doit donc déjà figurer dans `~/.ssh/known_hosts`.
    Les chemins des pièces jointes sont validés par rapport aux racines autorisées (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Tout wrapper `cliPath` ou proxy SSH placé devant `imsg` DOIT se comporter comme un tube transparent d’entrée/sortie standard pour une connexion JSON-RPC persistante. OpenClaw échange de petits messages JSON-RPC délimités par des sauts de ligne via l’entrée et la sortie standard du wrapper pendant toute la durée de vie du canal :

- Transmettez chaque bloc ou ligne reçu sur l’entrée standard **dès que des octets sont disponibles** — n’attendez pas la fin du flux.
- Transmettez rapidement chaque bloc ou ligne de la sortie standard dans le sens inverse.
- Préservez les sauts de ligne.
- Évitez les lectures bloquantes de taille fixe (`read(4096)`, `cat | buffer`, commande shell `read` par défaut), qui peuvent priver les petites trames de traitement.
- Gardez le flux d’erreur standard séparé du flux de sortie standard JSON-RPC.

Un wrapper qui met en mémoire tampon l’entrée standard jusqu’à ce qu’un bloc volumineux soit rempli produit des symptômes semblables à une panne d’iMessage — `imsg rpc timeout (chats.list)` ou redémarrages répétés du canal — même si `imsg rpc` fonctionne correctement. `ssh -T host imsg "$@"` (ci-dessus) est sûr, car il transmet les arguments `cliPath` d’OpenClaw tels que `rpc` et `--db`. Les pipelines comme `ssh host imsg | grep -v '^DEBUG'` ne le sont PAS — les outils utilisant une mise en mémoire tampon par ligne peuvent encore retenir les trames ; utilisez `stdbuf -oL -eL` à chaque étape si vous devez effectuer un filtrage.
</Warning>

  </Tab>
</Tabs>

## Prérequis et autorisations (macOS)

- Messages doit être connecté sur le Mac exécutant `imsg`.
- L’accès complet au disque est requis pour le contexte de processus exécutant OpenClaw/`imsg` (accès à la base de données de Messages).
- L’autorisation d’automatisation est requise pour envoyer des messages via Messages.app.
- Pour les actions avancées (réagir / modifier / annuler l’envoi / réponse dans un fil / effets / sondages / opérations de groupe), la protection de l’intégrité du système doit être désactivée — consultez [Activation de l’API privée de imsg](#enabling-the-imsg-private-api). L’envoi et la réception de texte et de contenus multimédias de base fonctionnent sans cela.

<Tip>
Les autorisations sont accordées par contexte de processus. Si le Gateway s’exécute sans interface graphique (LaunchAgent/SSH), exécutez une seule fois une commande interactive dans ce même contexte afin de déclencher les demandes d’autorisation :

```bash
imsg chats --limit 1
# ou
imsg send <handle> "test"
```

</Tip>

<Accordion title="Échec des envois du wrapper SSH avec AppleEvents -1743">
  Une configuration SSH distante peut lire les conversations, réussir `channels status --probe` et traiter les messages entrants, tandis que les envois sortants échouent toujours avec une erreur d’autorisation AppleEvents :

```text
Non autorisé à envoyer des événements Apple à Messages. (-1743)
```

Vérifiez la base de données TCC de l’utilisateur connecté au Mac ou System Settings > Privacy & Security > Automation. Si l’entrée Automation est enregistrée pour `/usr/libexec/sshd-keygen-wrapper` au lieu du processus `imsg` ou du shell local, macOS peut ne pas afficher de commutateur Messages utilisable pour ce client SSH côté serveur :

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dans cet état, répéter `tccutil reset AppleEvents` ou réexécuter `imsg send` via le même wrapper SSH peut continuer d’échouer, car le contexte de processus qui nécessite l’automatisation de Messages est le wrapper SSH, et non une application à laquelle l’interface peut accorder l’autorisation.

Utilisez plutôt l’un des contextes de processus `imsg` pris en charge :

- Exécutez le Gateway, ou au moins le pont `imsg`, dans la session locale de l’utilisateur connecté à Messages.
- Démarrez le Gateway avec un LaunchAgent pour cet utilisateur après avoir accordé l’accès complet au disque et l’automatisation depuis la même session.
- Si vous conservez la topologie SSH à deux utilisateurs, vérifiez qu’un véritable envoi sortant avec `imsg send` réussit via le wrapper exact avant d’activer le canal. S’il est impossible d’accorder l’autorisation d’automatisation, reconfigurez l’installation pour utiliser `imsg` avec un seul utilisateur au lieu de dépendre du wrapper SSH pour les envois.

</Accordion>

## Activation de l’API privée de imsg

`imsg` propose deux modes de fonctionnement. Pour OpenClaw, le mode API privée est la configuration recommandée, car il fournit au canal les actions iMessage natives attendues par les utilisateurs. Le mode de base reste utile pour les installations à faible risque, la vérification initiale ou les hôtes sur lesquels SIP ne peut pas être désactivé.

- **Mode de base** (par défaut, aucune modification de SIP nécessaire) : texte et contenus multimédias sortants via `send`, surveillance/historique des messages entrants, liste des conversations. C’est ce que fournit directement une nouvelle installation avec `brew install steipete/tap/imsg`, associée aux autorisations macOS standard indiquées ci-dessus.
- **Mode API privée** : `imsg` injecte une dylib auxiliaire dans `Messages.app` afin d’appeler des fonctions internes de `IMCore`. Cela active `react`, `edit`, `unsend`, `reply` (dans un fil), `sendWithEffect`, `poll` et `poll-vote` (sondages natifs de Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ainsi que les indicateurs de saisie et les accusés de lecture.

La surface d’actions recommandée sur cette page nécessite le mode API privée. Le README de `imsg` énonce explicitement ce prérequis :

> Les fonctionnalités avancées telles que `read`, `typing`, `launch`, l’envoi enrichi reposant sur le pont, la modification des messages et la gestion des conversations sont facultatives. Elles nécessitent la désactivation de SIP et l’injection d’une dylib auxiliaire dans `Messages.app`. `imsg launch` refuse d’effectuer l’injection lorsque SIP est activé.

La technique d’injection du composant auxiliaire utilise la propre dylib de `imsg` pour accéder aux API privées de Messages. Aucun serveur tiers ni environnement d’exécution BlueBubbles n’intervient dans le chemin iMessage d’OpenClaw.

<Warning>
**La désactivation de SIP constitue un véritable compromis en matière de sécurité.** SIP est l’une des protections fondamentales de macOS contre l’exécution de code système modifié ; sa désactivation à l’échelle du système augmente la surface d’attaque et peut entraîner des effets secondaires. En particulier, **la désactivation de SIP sur les Mac Apple Silicon désactive également la possibilité d’installer et d’exécuter des applications iOS sur votre Mac**.

Considérez cela comme un choix opérationnel délibéré, surtout sur un Mac personnel principal. Pour une intégration iMessage OpenClaw de qualité production, privilégiez un Mac dédié ou un utilisateur bot macOS sur lequel vous acceptez d’activer le pont. Si votre modèle de menace ne peut tolérer la désactivation de SIP sur aucun système, l’intégration iMessage fournie est limitée au mode de base — uniquement l’envoi et la réception de texte et de contenus multimédias, sans réactions / modification / annulation de l’envoi / effets / opérations de groupe.
</Warning>

### Configuration

1. **Installez (ou mettez à niveau) `imsg`** sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   La sortie de `imsg status --json` indique `bridge_version`, `rpc_methods` et les `selectors` propres à chaque méthode, afin que vous puissiez vérifier les fonctionnalités prises en charge par la version actuelle avant de commencer.

2. **Désactivez la protection de l’intégrité du système et, sur les versions modernes de macOS, la validation des bibliothèques.** L’injection d’une dylib auxiliaire non signée par Apple dans l’application `Messages.app` signée par Apple nécessite la désactivation de SIP **et** l’assouplissement de la validation des bibliothèques. L’étape relative à SIP en mode de récupération dépend de la version de macOS :
   - **macOS 10.13-10.15 (Sierra-Catalina) :** désactivez la validation des bibliothèques via Terminal, redémarrez en mode de récupération, exécutez `csrutil disable`, puis redémarrez.
   - **macOS 11+ (Big Sur et versions ultérieures), Intel :** accédez au mode de récupération (ou à la récupération par Internet), exécutez `csrutil disable`, puis redémarrez.
   - **macOS 11+, Apple Silicon :** utilisez la séquence de démarrage avec le bouton d’alimentation pour accéder au mode de récupération ; sur les versions récentes de macOS, maintenez la touche **Left Shift** enfoncée lorsque vous cliquez sur Continue, puis exécutez `csrutil disable`. Les configurations de machines virtuelles suivent une procédure distincte ; créez donc d’abord un instantané de la machine virtuelle.

   **Sur macOS 11 et versions ultérieures, `csrutil disable` seul ne suffit généralement pas.** Apple applique toujours la validation des bibliothèques à `Messages.app` en tant que binaire de plateforme ; un assistant signé ad hoc est donc rejeté (`Library Validation failed: ... platform binary, but mapped file is not`) même lorsque SIP est désactivé. Après avoir désactivé SIP, désactivez également la validation des bibliothèques, puis redémarrez :

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), vérifié sur la version 26.5.1 :** la désactivation de SIP **ainsi que** la commande `DisableLibraryValidation` ci-dessus suffisent pour injecter l’assistant sur les versions 26.0 à 26.5.x. **Aucun argument de démarrage n’est requis.** Le fichier plist est le facteur décisif et l’étape manquante la plus courante lorsque l’injection échoue sur Tahoe :
   - **Avec le fichier plist :** `imsg launch` effectue l’injection et `imsg status` indique `advanced_features: true`.
   - **Sans le fichier plist (même avec SIP désactivé) :** `imsg launch` échoue avec `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rejette l’assistant ad hoc lors du chargement ; le pont n’est donc jamais prêt et le lancement expire. Cette expiration est le symptôme que la plupart des utilisateurs rencontrent sur Tahoe ; la solution est le fichier plist ci-dessus, et non une mesure plus radicale.

   Si l’injection par `imsg launch` ou certains `selectors` commencent à renvoyer false après une mise à niveau de macOS, cette barrière en est généralement la cause. Vérifiez l’état de SIP et de la validation des bibliothèques avant de supposer que l’étape relative à SIP a elle-même échoué. Si ces réglages sont corrects et que le pont ne parvient toujours pas à effectuer l’injection, recueillez la sortie de `imsg status --json` ainsi que celle de `imsg launch`, puis signalez le problème au projet `imsg` au lieu d’affaiblir d’autres contrôles de sécurité à l’échelle du système.

3. **Injectez l’assistant.** Avec SIP désactivé et une session ouverte dans Messages.app :

   ```bash
   imsg launch
   ```

   `imsg launch` refuse d’effectuer l’injection lorsque SIP est encore activé ; cela confirme donc également que l’étape 2 a bien été appliquée.

4. **Vérifiez le pont depuis OpenClaw :**

   ```bash
   openclaw channels status --probe
   ```

   L’entrée iMessage doit indiquer `works`, et `imsg status --json | jq '{rpc_methods, selectors}'` doit afficher les capacités exposées par votre version de macOS. La création de sondages nécessite `selectors.pollPayloadMessage` ; le vote nécessite à la fois `selectors.pollVoteMessage` et la méthode RPC `poll.vote`. Le plugin OpenClaw n’annonce que les actions prises en charge par la sonde mise en cache, tandis qu’un cache vide reste optimiste et exécute une sonde lors du premier envoi.

Si `openclaw channels status --probe` indique que le canal `works`, mais que certaines actions génèrent l’erreur « iMessage `<action>` requires the imsg private API bridge » lors de l’envoi, exécutez à nouveau `imsg launch` : l’assistant peut se déconnecter (redémarrage de Messages.app, mise à jour du système d’exploitation, etc.) et l’état `available: true` mis en cache continuera d’annoncer les actions jusqu’à ce que la prochaine sonde l’actualise.

### Lorsque SIP reste activé

Si la désactivation de SIP n’est pas acceptable pour votre modèle de menace :

- `imsg` revient au mode de base : texte + médias + réception uniquement.
- Le plugin OpenClaw continue d’annoncer l’envoi de texte et de médias ainsi que la surveillance des messages entrants ; il masque `react`, `edit`, `unsend`, `reply`, `sendWithEffect` et les opérations de groupe dans la surface d’actions (selon la barrière de capacités propre à chaque méthode).
- Vous pouvez utiliser un Mac distinct sans Apple Silicon (ou un Mac dédié au bot) avec SIP désactivé pour la charge de travail iMessage, tout en conservant SIP activé sur vos appareils principaux. Consultez la section [Utilisateur macOS dédié au bot (identité iMessage distincte)](#deployment-patterns) ci-dessous.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.imessage.dmPolicy` contrôle les messages directs :

    - `pairing` (par défaut)
    - `allowlist` (nécessite au moins une entrée `allowFrom`)
    - `open` (nécessite que `allowFrom` contienne `"*"`)
    - `disabled`

    Champ de liste d’autorisation : `channels.imessage.allowFrom`.

    Les entrées de la liste d’autorisation doivent identifier les expéditeurs : identifiants ou groupes statiques d’accès des expéditeurs (`accessGroup:<name>`). Utilisez `channels.imessage.groupAllowFrom` pour les cibles de discussion telles que `chat_id:*`, `chat_guid:*` ou `chat_identifier:*` ; utilisez `channels.imessage.groups` pour les clés numériques `chat_id` du registre.

  </Tab>

  <Tab title="Politique des groupes + mentions">
    `channels.imessage.groupPolicy` contrôle la gestion des groupes :

    - `allowlist` (par défaut)
    - `open`
    - `disabled`

    Liste d’autorisation des expéditeurs de groupe : `channels.imessage.groupAllowFrom`.

    Les entrées de `groupAllowFrom` peuvent également faire référence à des groupes statiques d’accès des expéditeurs (`accessGroup:<name>`).

    Repli à l’exécution : si `groupAllowFrom` n’est pas défini, les vérifications des expéditeurs de groupe iMessage utilisent `allowFrom` ; définissez `groupAllowFrom` lorsque l’admission des messages privés et des groupes doit différer. Un `groupAllowFrom: []` explicitement vide n’utilise pas le repli : il bloque tous les expéditeurs de groupe avec `allowlist`.
    Remarque sur l’exécution : si `channels.imessage` est entièrement absent, l’exécution revient à `groupPolicy="allowlist"` et consigne un avertissement (même si `channels.defaults.groupPolicy` est défini).

    <Warning>
    Le routage des groupes avec `groupPolicy: "allowlist"` applique **deux** barrières successives :

    1. **Liste d’autorisation des expéditeurs** (`channels.imessage.groupAllowFrom`) — identifiant, `accessGroup:<name>`, `chat_guid`, `chat_identifier` ou `chat_id`. Une liste effective vide (aucun `groupAllowFrom` et aucun repli sur `allowFrom`) bloque tous les expéditeurs de groupe.
    2. **Registre des groupes** (`channels.imessage.groups`) — appliqué dès que la table contient des entrées : la discussion doit correspondre à une entrée explicite par `chat_id` ou au caractère générique `groups: { "*": { ... } }`. Lorsque `groups` est vide ou absent, seule la liste d’autorisation des expéditeurs détermine l’admission.

    Si aucune liste d’autorisation effective des expéditeurs de groupe n’est configurée, chaque message de groupe est ignoré avant la barrière du registre. Chaque barrière possède son propre signal de niveau `warn` au niveau de journalisation par défaut et indique une solution différente :

    - une fois par compte au démarrage, lorsque la liste d’autorisation effective des expéditeurs de groupe est vide : `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — corrigez le problème en définissant `channels.imessage.groupAllowFrom` (ou `allowFrom`) ; l’ajout d’entrées `groups` uniquement laisse la barrière 1 bloquer tous les expéditeurs.
    - une fois par `chat_id` à l’exécution, lorsqu’un expéditeur a franchi la barrière 1 mais que la discussion est absente d’un registre `groups` non vide : `imessage: dropping group message from chat_id=<id> ...` — corrigez le problème en ajoutant ce `chat_id` (ou `"*"`) sous `channels.imessage.groups`.

    Les messages privés ne sont pas affectés : ils empruntent un chemin de code différent.

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

    `groupAllowFrom` seul autorise ces expéditeurs dans n’importe quel groupe ; ajoutez le bloc `groups` pour limiter les discussions autorisées (et définir des options propres à chaque discussion, comme `requireMention`).
    </Warning>

    Filtrage par mention pour les groupes :

    - iMessage ne fournit aucune métadonnée native de mention
    - la détection des mentions utilise des expressions régulières (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - si aucun motif n’est configuré, le filtrage par mention ne peut pas être appliqué
    - les commandes de contrôle provenant d’expéditeurs autorisés contournent le filtrage par mention

    `systemPrompt` par groupe :

    Chaque entrée sous `channels.imessage.groups.*` accepte une chaîne `systemPrompt` facultative, injectée dans le prompt système de l’agent à chaque tour traitant un message dans ce groupe. La résolution suit celle de `channels.whatsapp.groups` :

    1. **Invite système propre au groupe** (`groups["<chat_id>"].systemPrompt`) : utilisée lorsque l’entrée du groupe concerné existe dans la table **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est ignoré et aucune invite système n’est appliquée à ce groupe.
    2. **Invite système générique pour les groupes** (`groups["*"].systemPrompt`) : utilisée lorsque l’entrée du groupe concerné est totalement absente de la table, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
    ```
    ```json5
          groups: {
    ```
    ```json5
            "*": { systemPrompt: "Utilisez l’orthographe britannique." },
    ```
    ```json5
            "8421": {
    ```
    ```json5
              requireMention: true,
    ```
    ```json5
              systemPrompt: "Ceci est la discussion de rotation d’astreinte. Limitez les réponses à moins de 3 phrases.",
    ```
    ```json5
            },
            "9907": {
    ```
    ```json5
              // suppression explicite : le caractère générique « Use British spelling. » ne s’applique pas ici
    ```
    ```json5
              systemPrompt: "",
            },
    ```
    ```json5
          },
        },
      },
    }
    ```
    Les invites propres à chaque groupe s’appliquent uniquement aux messages de groupe — les messages directs ne sont pas concernés.

  </Tab>

  <Tab title="Sessions et réponses déterministes">
    - Les messages privés utilisent le routage direct ; les groupes utilisent le routage de groupe.
    - Avec la valeur par défaut `session.dmScope=main`, les messages privés iMessage sont regroupés dans la session principale de l’agent.
    - Les sessions de groupe sont isolées (`agent:<agentId>:imessage:group:<chat_id>`).
    - Les réponses sont renvoyées vers iMessage à l’aide des métadonnées du canal et de la cible d’origine.

    Comportement des fils de discussion assimilables à des groupes :

    Certains fils de discussion iMessage à plusieurs participants peuvent arriver avec `is_group=false`.
    Si ce `chat_id` est explicitement configuré sous `channels.imessage.groups`, OpenClaw le traite comme du trafic de groupe (contrôle d’accès au groupe + isolation de la session de groupe).

  </Tab>
</Tabs>

## Liaisons de conversations ACP

Les conversations iMessage peuvent être liées à des sessions ACP.

Procédure rapide pour l’opérateur :

- Exécutez `/acp spawn codex --bind here` dans le message privé ou la conversation de groupe autorisée.
- Les messages suivants de cette même conversation iMessage sont acheminés vers la session ACP créée.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées utilisent des entrées `bindings[]` de niveau supérieur avec `type: "acp"` et `match.channel: "imessage"`.

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

Consultez [Agents ACP](/fr/tools/acp-agents) pour connaître le comportement partagé des liaisons ACP.

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Utilisateur macOS dédié au bot (identité iMessage distincte)">
    Utilisez un identifiant Apple et un utilisateur macOS dédiés afin d’isoler le trafic du bot de votre profil Messages personnel.

    Déroulement type :

    1. Créez un utilisateur macOS dédié et connectez-vous à son compte.
    2. Dans la session de cet utilisateur, connectez-vous à Messages avec l’identifiant Apple du bot.
    3. Installez `imsg` pour cet utilisateur.
    4. Créez un script d’encapsulation SSH afin qu’OpenClaw puisse exécuter `imsg` dans le contexte de cet utilisateur.
    5. Faites pointer `channels.imessage.accounts.<id>.cliPath` et `.dbPath` vers le profil de cet utilisateur.

    La première exécution peut nécessiter des autorisations dans l’interface graphique (Automatisation + Accès complet au disque) au sein de la session de cet utilisateur dédié au bot.

  </Accordion>

  <Accordion title="Mac distant via Tailscale (exemple)">
    Topologie courante :

    - le Gateway s’exécute sous Linux ou dans une VM
    - iMessage et `imsg` s’exécutent sur un Mac de votre réseau Tailscale
    - le script d’encapsulation `cliPath` utilise SSH pour exécuter `imsg`
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

    Utilisez des clés SSH afin que SSH et SCP soient tous deux non interactifs.
    Assurez-vous d’abord que la clé de l’hôte est approuvée (par exemple `ssh bot@mac-mini.tailnet-1234.ts.net`) afin que `known_hosts` soit renseigné.

  </Accordion>

  <Accordion title="Configuration multi-compte">
    iMessage prend en charge une configuration par compte sous `channels.imessage.accounts`.

    Chaque compte peut remplacer des champs tels que `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, les paramètres d’historique et les listes d’autorisation des racines de pièces jointes.

  </Accordion>

  <Accordion title="Historique des messages directs">
    Définissez `channels.imessage.dmHistoryLimit` pour initialiser les nouvelles sessions de messages directs avec l’historique récent de `imsg` décodé pour cette conversation. Utilisez `channels.imessage.dms["<sender>"].historyLimit` pour les remplacements propres à chaque expéditeur, notamment `0` pour désactiver l’historique pour un expéditeur.

    L’historique des messages directs iMessage est récupéré à la demande depuis `imsg`. Ne pas définir `dmHistoryLimit` désactive l’initialisation globale de l’historique des messages directs, mais une valeur positive de `channels.imessage.dms["<sender>"].historyLimit` active tout de même l’initialisation pour cet expéditeur.

  </Accordion>
</AccordionGroup>

## Médias, découpage et cibles de livraison

<AccordionGroup>
  <Accordion title="Pièces jointes et médias">
    - l’ingestion des pièces jointes entrantes est **désactivée par défaut** — définissez `channels.imessage.includeAttachments: true` pour transmettre à l’agent les photos, mémos vocaux, vidéos et autres pièces jointes. Lorsqu’elle est désactivée, les iMessages contenant uniquement des pièces jointes sont ignorés avant d’atteindre l’agent et peuvent ne produire aucune ligne de journal `Inbound message`.
    - les chemins de pièces jointes distantes peuvent être récupérés via SCP lorsque `remoteHost` est défini
    - les chemins de pièces jointes doivent correspondre aux racines autorisées :
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP distant)
      - les racines configurées étendent le modèle de racine par défaut `/Users/*/Library/Messages/Attachments` (elles sont fusionnées, et non remplacées)
    - SCP utilise une vérification stricte de la clé d’hôte (`StrictHostKeyChecking=yes`)
    - la taille des médias sortants utilise `channels.imessage.mediaMaxMb` (16 MB par défaut)

  </Accordion>

  <Accordion title="Texte sortant et découpage">
    - limite de taille des segments de texte : `channels.imessage.textChunkLimit` (4000 par défaut)
    - mode de découpage : `channels.imessage.streaming.chunkMode`
      - `length` (par défaut)
      - `newline` (découpage donnant la priorité aux paragraphes)
    - le gras, l’italique, le soulignement et le barré Markdown sortants sont convertis en texte mis en forme natif (les destinataires sous macOS 15+ voient la mise en forme ; les destinataires utilisant une version antérieure voient du texte brut sans les marqueurs) ; les tableaux Markdown sont convertis selon le mode de tableau Markdown du canal
    - `channels.imessage.sendTransport` (`auto` par défaut, `bridge`, `applescript`) détermine comment `imsg` effectue les envois

  </Accordion>

  <Accordion title="Formats d’adressage">
    Cibles explicites recommandées :

    - `chat_id:123` (recommandé pour un routage stable)
    - `chat_guid:...`
    - `chat_identifier:...`

    Les cibles sous forme d’identifiant sont également prises en charge :

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Actions de l’API privée

Lorsque `imsg launch` est en cours d’exécution et que `openclaw channels status --probe` indique `privateApi.available: true`, l’outil de messagerie peut utiliser des actions iMessage natives en plus des envois de texte normaux.

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
    - **react** : ajoutez ou supprimez des réactions rapides iMessage (`messageId`, `emoji`, `remove`). Les réactions rapides prises en charge correspondent à l’amour, l’approbation, la désapprobation, le rire, l’accentuation et l’interrogation. Une suppression sans émoji efface la réaction rapide définie, quelle qu’elle soit.
    - **reply** : envoyez une réponse dans un fil à un message existant (`messageId`, `text` ou `message`, ainsi que `chatGuid`, `chatId`, `chatIdentifier` ou `to`). Une réponse avec pièce jointe nécessite en outre une version de `imsg` dont `send-rich` prend en charge `--file`.
    - **sendWithEffect** : envoyez du texte avec un effet iMessage (`text` ou `message`, `effect` ou `effectId`). Noms courts : slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit** : modifiez un message envoyé sur les versions de macOS et de l’API privée prises en charge (`messageId`, `text` ou `newText`). Seuls les messages envoyés par le Gateway lui-même peuvent être modifiés.
    - **unsend** : retirez un message envoyé sur les versions de macOS et de l’API privée prises en charge (`messageId`). Seuls les messages envoyés par le Gateway lui-même peuvent être retirés.
    - **upload-file** : envoyez des médias ou des fichiers (`buffer` en base64 ou une valeur `media`/`path`/`filePath` préparée, `filename`, et éventuellement `asVoice`). Ancien alias : `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup** : gérez les conversations de groupe lorsque la cible actuelle est une conversation de groupe. Ces actions modifient l’identité Messages de l’hôte ; elles nécessitent donc un expéditeur propriétaire ou un client Gateway `operator.admin`.
    - **poll** : créez un sondage Apple Messages natif (`pollQuestion`, `pollOption` répété de 2 à 12 fois, ainsi que `chatGuid`, `chatId`, `chatIdentifier` ou `to`). Les destinataires sous iOS/iPadOS/macOS 26+ peuvent le consulter et voter nativement ; les versions antérieures du système d’exploitation reçoivent le texte de remplacement « Sondage envoyé ». Nécessite `selectors.pollPayloadMessage`.
    - **poll-vote** : votez dans un sondage existant (`pollId` ou `messageId`, ainsi qu’exactement l’un des éléments suivants : `pollOptionIndex`, `pollOptionId` ou `pollOptionText`). Nécessite `selectors.pollVoteMessage` et la méthode RPC `poll.vote`.

    Les sondages entrants acceptés sont présentés à l’agent avec la question, les libellés d’options numérotés, le nombre de votes et l’identifiant du message de sondage requis par `poll-vote`.

  </Accordion>

  <Accordion title="Identifiants de message">
    Le contexte iMessage entrant inclut à la fois les valeurs courtes `MessageSid` et les GUID complets des messages (`MessageSidFull`) lorsqu’ils sont disponibles. Les identifiants courts sont limités au cache récent de réponses basé sur SQLite et sont vérifiés par rapport à la conversation actuelle avant utilisation. Si un identifiant court a expiré ou appartient à une autre conversation, réessayez avec le `MessageSidFull` complet.

  </Accordion>

  <Accordion title="Détection des capacités">
    OpenClaw masque les actions de l’API privée uniquement lorsque l’état de la vérification en cache indique que le pont est indisponible. Si l’état est inconnu, les actions restent visibles et leur exécution déclenche les vérifications à la demande, afin que la première action puisse réussir après `imsg launch` sans actualisation manuelle distincte de l’état.

  </Accordion>

  <Accordion title="Confirmations de lecture et indicateur de saisie">
    Lorsque le pont de l’API privée est opérationnel, les conversations entrantes acceptées sont marquées comme lues et les conversations directes affichent une bulle de saisie dès que le tour est accepté, pendant que l’agent prépare le contexte et génère la réponse. Désactivez le marquage comme lu avec :

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Les anciennes versions de `imsg`, antérieures à la liste de capacités par méthode, désactivent silencieusement l’indicateur de saisie et les confirmations de lecture ; OpenClaw consigne un avertissement unique à chaque redémarrage afin que l’absence de confirmation puisse être attribuée.

  </Accordion>

  <Accordion title="Réactions rapides entrantes">
    OpenClaw s’abonne aux réactions rapides iMessage et achemine les réactions acceptées sous forme d’événements système plutôt que de texte de message normal, afin qu’une réaction rapide d’un utilisateur ne déclenche pas une boucle de réponse ordinaire.

    Le mode de notification est contrôlé par `channels.imessage.reactionNotifications` :

    - `"own"` (par défaut) : notifier uniquement lorsque des utilisateurs réagissent à des messages rédigés par le bot.
    - `"all"` : notifier pour toutes les réactions rapides entrantes provenant d’expéditeurs autorisés.
    - `"off"` : ignorer les réactions rapides entrantes.

    Les remplacements propres à chaque compte utilisent `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Réactions d’approbation (👍 / 👎)">
    Lorsque `approvals.exec.enabled` ou `approvals.plugin.enabled` vaut true et que la requête est acheminée vers iMessage, le Gateway transmet nativement une demande d’approbation et accepte une réaction rapide pour la résoudre :

    - `👍` (réaction rapide Like) → `allow-once`
    - `👎` (réaction rapide Dislike) → `deny`
    - `allow-always` reste une solution de repli manuelle : envoyez `/approve <id> allow-always` comme réponse normale.

    Le traitement des réactions exige que l’identifiant de l’utilisateur qui réagit soit explicitement autorisé à approuver. La liste des approbateurs est lue depuis `channels.imessage.allowFrom` (ou `channels.imessage.accounts.<id>.allowFrom`) ; ajoutez le numéro de téléphone de l’utilisateur au format E.164 ou l’adresse e-mail de son identifiant Apple (les cibles de conversation telles que `chat_id:*` ne sont pas des entrées d’approbateur valides). L’entrée générique `"*"` est prise en compte, mais autorise n’importe quel expéditeur à approuver ; une liste d’approbateurs vide désactive entièrement le raccourci par réaction. Le raccourci par réaction contourne intentionnellement `reactionNotifications`, `dmPolicy` et `groupAllowFrom`, car la liste d’autorisation explicite des approbateurs est le seul contrôle pertinent pour résoudre une approbation.

    L’autorisation de la commande textuelle `/approve` suit la même liste : lorsque `channels.imessage.allowFrom` n’est pas vide, `/approve <id> <decision>` est autorisée en fonction de cette liste d’approbateurs (et non de la liste d’autorisation plus large des messages directs), et les expéditeurs autorisés dans la liste des messages directs, mais absents de `allowFrom`, reçoivent un refus explicite. Lorsque `allowFrom` est vide, la solution de repli limitée à la même conversation reste active et `/approve` autorise toute personne permise par la liste d’autorisation des messages directs. Ajoutez à `allowFrom` chaque opérateur qui doit pouvoir approuver, que ce soit via `/approve` ou via des réactions.

    Remarques pour les opérateurs :
    - L’association de la réaction est stockée à la fois en mémoire et dans le magasin persistant clé-valeur du Gateway (avec une durée de vie correspondant à l’expiration de l’approbation), et le Gateway recherche également les réactions rapides dans les demandes en attente ; ainsi, une réaction rapide reçue peu après le redémarrage d’un Gateway résout tout de même l’approbation.
    - La propre réaction rapide `is_from_me=true` de l’opérateur (par exemple depuis un appareil Apple jumelé) résout l’approbation lorsque cet identifiant est explicitement autorisé à approuver.
    - Les demandes d’approbation ne sont acheminées vers une conversation de groupe que si des approbateurs explicites sont configurés ; sinon, n’importe quel membre du groupe pourrait approuver.
    - Les anciennes réactions rapides sous forme de texte (`Liked "…"` en texte brut provenant de très anciens clients Apple) ne peuvent pas résoudre les approbations, car elles ne comportent aucun GUID de message ; la résolution par réaction nécessite les métadonnées structurées de réaction rapide émises par les clients macOS / iOS actuels.

  </Accordion>
</AccordionGroup>

## Écritures de configuration

iMessage autorise par défaut les écritures de configuration initiées par le canal (pour `/config set|unset` lorsque `commands.config: true`).

Pour les désactiver :

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

## Regroupement des messages directs envoyés séparément (commande + URL dans une même composition)

Lorsqu’un utilisateur saisit ensemble une commande et une URL — par exemple `Dump https://example.com/article` — l’application Messages d’Apple scinde l’envoi en **deux lignes `chat.db` distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec des images d’aperçu OG comme pièces jointes.

Les deux lignes arrivent dans OpenClaw à environ 0.8-2.0 s d’intervalle dans la plupart des configurations. Sans regroupement, l’agent reçoit uniquement la commande au tour 1 (et répond souvent « envoyez-moi l’URL ») avant que l’URL n’arrive au tour 2. Cela relève du pipeline d’envoi d’Apple, et non d’un comportement introduit par OpenClaw ou `imsg`.

`channels.imessage.coalesceSameSenderDms` permet à un message privé de mettre en mémoire tampon les lignes consécutives provenant du même expéditeur. Lorsque `imsg` expose le marqueur structurel d’aperçu d’URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` sur l’une des lignes sources, OpenClaw fusionne uniquement cet envoi réellement scindé et conserve toutes les autres lignes mises en mémoire tampon sous forme de tours distincts. Sur les anciennes versions d’`imsg` qui n’émettent aucune métadonnée de bulle, OpenClaw ne peut pas distinguer un envoi scindé d’envois séparés ; il revient donc à la fusion du lot. Cela préserve le comportement antérieur aux métadonnées au lieu de faire régresser les envois scindés `Dump <url>` en deux tours. Les discussions de groupe continuent à être distribuées message par message afin de préserver la structure des tours entre plusieurs utilisateurs.

<Tabs>
  <Tab title="Quand l’activer">
    Activez cette option lorsque :

    - Vous fournissez des Skills qui attendent `command + payload` dans un même message (vidage, collage, enregistrement, mise en file d’attente, etc.).
    - Vos utilisateurs collent des URL avec des commandes.
    - Vous pouvez accepter la latence supplémentaire des tours de messages privés (voir ci-dessous).

    Laissez-la désactivée lorsque :

    - Vous avez besoin d’une latence de commande minimale pour les déclencheurs d’un seul mot en message privé.
    - Tous vos flux sont des commandes ponctuelles sans charge utile envoyée ensuite.

  </Tab>
  <Tab title="Activation">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // activer explicitement (valeur par défaut : false)
        },
      },
    }
    ```

    Lorsque l’option est activée et qu’aucune valeur explicite n’est définie dans `messages.inbound.byChannel.imessage` ni dans la valeur globale `messages.inbound.debounceMs`, la fenêtre d’anti-rebond passe à **7000 ms** (la valeur par défaut historique est de 0 ms — aucun anti-rebond). Cette fenêtre élargie est nécessaire, car la cadence des envois scindés pour l’aperçu d’URL d’Apple peut s’étendre sur plusieurs secondes pendant que Messages.app émet la ligne d’aperçu.

    Pour ajuster vous-même la fenêtre :

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
    - **Une fusion précise nécessite les métadonnées de charge utile des versions actuelles d’`imsg`.** Lorsque `balloon_bundle_id` est présent, seul l’envoi réellement scindé est fusionné ; la fusion de repli sans métadonnées décrite ci-dessus assure temporairement la rétrocompatibilité et sera supprimée une fois qu’`imsg` fusionnera les envois scindés en amont.
    - **Latence supplémentaire pour les messages privés.** Lorsque l’option est activée, chaque message privé (y compris les commandes de contrôle autonomes et les réponses constituées d’un seul texte) attend jusqu’à la fin de la fenêtre d’anti-rebond avant d’être distribué, au cas où une ligne d’aperçu d’URL arriverait. Les messages de groupe restent distribués instantanément.
    - **La sortie fusionnée est limitée.** Le texte fusionné est limité à 4000 caractères avec un marqueur explicite `…[truncated]` ; le nombre de pièces jointes est limité à 20 ; le nombre d’entrées sources est limité à 10 (au-delà, la première et les plus récentes sont conservées). Chaque GUID source est suivi dans `coalescedMessageGuids` pour la télémétrie en aval.
    - **Messages privés uniquement.** Les discussions de groupe utilisent la distribution message par message afin que le bot reste réactif lorsque plusieurs personnes saisissent du texte.
    - **Activation explicite, par canal.** Les autres canaux (Discord, Slack, Telegram, WhatsApp, …) ne sont pas affectés. Les anciennes configurations BlueBubbles qui définissent `channels.bluebubbles.coalesceSameSenderDms` doivent migrer cette valeur vers `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scénarios et données reçues par l’agent

La colonne « Option activée » présente le comportement sur une version d’`imsg` qui émet `balloon_bundle_id`. Sur les anciennes versions d’`imsg` qui n’émettent aucune métadonnée de bulle, les lignes ci-dessous marquées « Deux tours » ou « N tours » reviennent plutôt à la fusion historique (un seul tour) : OpenClaw ne peut pas distinguer structurellement un envoi scindé d’envois séparés ; il préserve donc la fusion antérieure aux métadonnées. La séparation précise s’active dès que la version émet les métadonnées de bulle.

| Composition de l’utilisateur                                        | Résultat produit par `chat.db`                      | Option désactivée (par défaut)                                | Option activée + fenêtre (imsg émet les métadonnées de bulle)                                                   |
| ------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un seul envoi)                          | 2 lignes espacées d’environ 1 s                     | Deux tours d’agent : « Dump » seul, puis l’URL                | Un tour : texte fusionné `Dump https://example.com`                                                             |
| `Save this 📎image.jpg caption` (pièce jointe + texte)              | 2 lignes sans métadonnées de bulle d’URL             | Deux tours                                                    | Deux tours après observation des métadonnées ; un tour fusionné dans les anciennes sessions sans métadonnées ou antérieures au verrouillage |
| `/status` (commande autonome)                                       | 1 ligne                                             | Distribution instantanée                                     | **Attente jusqu’à la fin de la fenêtre, puis distribution**                                                     |
| URL collée seule                                                    | 1 ligne                                             | Distribution instantanée                                     | Attente jusqu’à la fin de la fenêtre, puis distribution                                                         |
| Texte + URL envoyés délibérément comme deux messages séparés, à plusieurs minutes d’intervalle | 2 lignes hors de la fenêtre                         | Deux tours                                                    | Deux tours (la fenêtre expire entre les deux)                                                                   |
| Afflux rapide (>10 petits messages privés dans la fenêtre)          | N lignes sans métadonnées de bulle d’URL             | N tours                                                       | N tours après observation des métadonnées ; un tour fusionné et limité dans les anciennes sessions sans métadonnées ou antérieures au verrouillage |
| Deux personnes saisissent du texte dans une discussion de groupe    | N lignes provenant de M expéditeurs                 | M+ tours (un par lot d’expéditeur)                            | M+ tours — les discussions de groupe ne sont pas fusionnées                                                     |

## Récupération des messages entrants après le redémarrage d’un pont ou du Gateway

iMessage récupère les messages manqués pendant l’arrêt du Gateway et supprime en même temps l’ancienne « avalanche de messages en attente » qu’Apple peut envoyer après une récupération Push. Le comportement par défaut est toujours actif et repose sur la déduplication des messages entrants.

- **Déduplication de la relecture.** Chaque message entrant distribué est enregistré à l’aide de son GUID Apple dans l’état persistant du Plugin (`imessage.inbound-dedupe`), réservé lors de l’ingestion et validé après le traitement (puis libéré en cas d’échec temporaire afin de permettre une nouvelle tentative). Tout élément déjà traité est ignoré au lieu d’être distribué deux fois. Cela permet à la récupération de relire les messages de manière intensive sans suivi individuel.
- **Récupération après une interruption.** Au démarrage, le moniteur mémorise le dernier identifiant de ligne `chat.db` distribué (un curseur persistant par compte) et le transmet à `imsg watch.subscribe` sous la forme `since_rowid`, afin qu’imsg relise les lignes reçues pendant l’arrêt du Gateway, puis suive les nouvelles lignes en direct. La relecture est limitée aux 500 lignes les plus récentes et aux messages datant d’au plus ~2 heures, tandis que la déduplication élimine tout élément déjà traité.
- **Barrière d’âge pour les anciens messages en attente.** Les lignes situées au-dessus de la limite de démarrage sont réellement reçues en direct ; toute ligne dont la date d’envoi précède son arrivée de plus de ~15 minutes appartient aux anciens messages en attente vidés par Push et est supprimée. Les lignes relues (situées au niveau ou en dessous de la limite) utilisent plutôt la fenêtre de récupération élargie, afin qu’un message récemment manqué soit distribué sans inclure l’historique ancien.

La récupération fonctionne avec les configurations `cliPath` locales et distantes, car la relecture `since_rowid` utilise la même connexion RPC `imsg`. La différence concerne la fenêtre : lorsque le Gateway peut lire `chat.db` (en local), il ancre la limite d’identifiant de ligne au démarrage, plafonne la plage de relecture et distribue les messages manqués datant d’au plus quelques heures. Avec un `cliPath` SSH distant, il ne peut pas lire la base de données ; la relecture n’est donc pas plafonnée et chaque ligne utilise la barrière d’âge des messages en direct. Il récupère toujours les messages récemment manqués et supprime toujours les anciens messages en attente, mais avec la fenêtre plus étroite des messages en direct. Exécutez le Gateway sur le Mac hébergeant Messages pour bénéficier de la fenêtre de récupération élargie.

### Signal visible par l’opérateur

Les anciens messages en attente supprimés sont consignés au niveau par défaut et ne sont jamais ignorés silencieusement (l’indicateur `recovery` précise la fenêtre appliquée) :

```text
imessage: ancien lot entrant supprimé account=<id> sent=<iso> recovery=<bool> (<N> supprimés depuis le démarrage)
```

### Migration

`channels.imessage.catchup.*` est obsolète — la récupération après une interruption est automatique et ne nécessite aucune configuration pour les nouvelles installations. Les configurations existantes avec `catchup.enabled: true` restent prises en charge comme profil de compatibilité pour la fenêtre de relecture de récupération. Les blocs de rattrapage désactivés (`enabled: false` ou sans `enabled: true`) sont retirés ; `openclaw doctor --fix` les supprime.

## Dépannage

<AccordionGroup>
  <Accordion title="imsg introuvable ou RPC non pris en charge">
    Validez le binaire et la prise en charge de RPC :

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonde indique que RPC n’est pas pris en charge, mettez à jour `imsg`. Si les actions de l’API privée ne sont pas disponibles, exécutez `imsg launch` dans la session de l’utilisateur macOS connecté, puis relancez la sonde. Si le Gateway ne s’exécute pas sous macOS, utilisez plutôt la configuration Mac distant via SSH décrite ci-dessus au lieu du chemin `imsg` local par défaut.

  </Accordion>

  <Accordion title="Les messages sont envoyés, mais les iMessages entrants n’arrivent pas">
    Vérifiez d’abord si le message a atteint le Mac local. Si `chat.db` ne change pas, OpenClaw ne peut pas recevoir le message, même lorsque `imsg status --json` indique que la passerelle est opérationnelle.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Si les messages envoyés depuis le téléphone ne créent aucune nouvelle ligne, réparez la couche Messages de macOS et Apple Push avant de modifier la configuration d’OpenClaw. Une actualisation ponctuelle des services suffit souvent :

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envoyez un nouvel iMessage depuis le téléphone et confirmez la création d’une nouvelle ligne dans `chat.db` ou d’un événement `imsg watch` avant de déboguer les sessions OpenClaw. N’exécutez pas cette procédure sous forme de boucle périodique de relance de la passerelle ; des exécutions répétées de `imsg launch` accompagnées de redémarrages du Gateway pendant une activité en cours peuvent interrompre les livraisons et bloquer des exécutions de canal en cours.

  </Accordion>

  <Accordion title="Le Gateway ne s’exécute pas sous macOS">
    La commande `cliPath: "imsg"` par défaut doit s’exécuter sur le Mac connecté à Messages. Sous Linux ou Windows, définissez `channels.imessage.cliPath` sur un script enveloppe qui se connecte à ce Mac par SSH et exécute `imsg "$@"`.

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
    - le comportement de la liste d’autorisation `channels.imessage.groups`
    - la configuration des modèles de mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Les pièces jointes distantes échouent">
    Vérifiez :

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - l’authentification par clé SSH/SCP depuis l’hôte du Gateway
    - la présence de la clé d’hôte dans `~/.ssh/known_hosts` sur l’hôte du Gateway
    - la lisibilité du chemin distant sur le Mac exécutant Messages

  </Accordion>

  <Accordion title="Les demandes d’autorisation macOS ont été ignorées">
    Réexécutez les commandes dans un terminal graphique interactif, dans le même contexte d’utilisateur et de session, puis approuvez les demandes :

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Vérifiez que l’accès complet au disque et l’automatisation sont accordés au contexte de processus qui exécute OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Liens vers la référence de configuration

- [Référence de configuration — iMessage](/fr/gateway/config-channels#imessage)
- [Configuration du Gateway](/fr/gateway/configuration)
- [Appairage](/fr/channels/pairing)

## Pages connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Suppression de BlueBubbles et parcours iMessage avec imsg](/fr/announcements/bluebubbles-imessage) — annonce et résumé de la migration
- [Migration depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles) — tableau de correspondance de la configuration et procédure de basculement détaillée
- [Appairage](/fr/channels/pairing) — authentification des messages privés et processus d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
