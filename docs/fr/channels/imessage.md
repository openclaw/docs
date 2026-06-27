---
read_when:
    - Configuration de la prise en charge d’iMessage
    - Débogage de l’envoi/réception iMessage
summary: Prise en charge native d’iMessage via imsg (JSON-RPC sur stdio), avec des actions d’API privée pour les réponses, les tapbacks, les effets, les pièces jointes et la gestion des groupes. Recommandé pour les nouvelles configurations iMessage d’OpenClaw lorsque les exigences de l’hôte sont compatibles.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Pour les déploiements iMessage d’OpenClaw, utilisez `imsg` sur un hôte macOS Messages connecté. Si votre Gateway fonctionne sous Linux ou Windows, faites pointer `channels.imessage.cliPath` vers un wrapper SSH qui exécute `imsg` sur le Mac.

**La récupération entrante est automatique.** Après le redémarrage d’un pont ou du Gateway, iMessage rejoue les messages manqués pendant l’arrêt et supprime l’ancien « backlog bomb » qu’Apple peut envoyer après une récupération Push, avec déduplication pour que rien ne soit distribué deux fois. Aucune configuration n’est nécessaire — consultez [Récupération entrante après le redémarrage d’un pont ou du Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
La prise en charge de BlueBubbles a été supprimée. Migrez les configurations `channels.bluebubbles` vers `channels.imessage` ; OpenClaw prend en charge iMessage uniquement via `imsg`. Commencez par [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) pour l’annonce courte, ou [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles) pour le tableau de migration complet.
</Warning>

État : intégration native de CLI externe. Gateway lance `imsg rpc` et communique en JSON-RPC sur stdio (aucun daemon/port séparé). Les actions avancées nécessitent `imsg launch` et une sonde d’API privée réussie.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Réponses, tapbacks, effets, pièces jointes et gestion de groupe.
  </Card>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    Les messages privés iMessage utilisent le mode d’appairage par défaut.
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
    OpenClaw nécessite uniquement un `cliPath` compatible stdio ; vous pouvez donc faire pointer `cliPath` vers un script wrapper qui se connecte par SSH à un Mac distant et exécute `imsg`.

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
    OpenClaw utilise une vérification stricte des clés d’hôte pour SCP ; la clé de l’hôte relais doit donc déjà exister dans `~/.ssh/known_hosts`.
    Les chemins de pièces jointes sont validés par rapport aux racines autorisées (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Tout wrapper `cliPath` ou proxy SSH placé devant `imsg` DOIT se comporter comme un pipe stdio transparent pour un JSON-RPC de longue durée. OpenClaw échange de petits messages JSON-RPC encadrés par des retours à la ligne sur stdin/stdout du wrapper pendant toute la durée de vie du canal :

- Transférez chaque bloc/ligne stdin **dès que des octets sont disponibles** — n’attendez pas EOF.
- Transférez rapidement chaque bloc/ligne stdout dans le sens inverse.
- Préservez les retours à la ligne.
- Évitez les lectures bloquantes de taille fixe (`read(4096)`, `cat | buffer`, `read` shell par défaut) qui peuvent affamer les petites trames.
- Gardez stderr séparé du flux stdout JSON-RPC.

Un wrapper qui met stdin en tampon jusqu’à ce qu’un gros bloc soit rempli produira des symptômes qui ressemblent à une panne iMessage — `imsg rpc timeout (chats.list)` ou redémarrages répétés du canal — même si `imsg rpc` lui-même est sain. `ssh -T host imsg "$@"` (ci-dessus) est sûr, car il transmet les arguments `cliPath` d’OpenClaw tels que `rpc` et `--db`. Les pipelines comme `ssh host imsg | grep -v '^DEBUG'` ne le sont PAS — les outils avec tampon par ligne peuvent tout de même retenir des trames ; utilisez `stdbuf -oL -eL` à chaque étape si vous devez filtrer.
</Warning>

  </Tab>
</Tabs>

## Exigences et autorisations (macOS)

- Messages doit être connecté sur le Mac qui exécute `imsg`.
- L’accès complet au disque est requis pour le contexte de processus qui exécute OpenClaw/`imsg` (accès à la base de données Messages).
- L’autorisation d’automatisation est requise pour envoyer des messages via Messages.app.
- Pour les actions avancées (réagir / modifier / annuler l’envoi / réponse en fil / effets / opérations de groupe), System Integrity Protection doit être désactivée — consultez [Activation de l’API privée imsg](#enabling-the-imsg-private-api) ci-dessous. L’envoi et la réception de texte et de médias de base fonctionnent sans cela.

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

Vérifiez la base de données TCC de l’utilisateur Mac connecté ou Réglages Système > Confidentialité et sécurité > Automatisation. Si l’entrée Automatisation est enregistrée pour `/usr/libexec/sshd-keygen-wrapper` au lieu du processus `imsg` ou du shell local, macOS peut ne pas exposer de bouton Messages utilisable pour ce client côté serveur SSH :

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Dans cet état, répéter `tccutil reset AppleEvents` ou relancer `imsg send` via le même wrapper SSH peut continuer à échouer, car le contexte de processus qui a besoin de l’automatisation Messages est le wrapper SSH, et non une application à laquelle l’interface peut accorder l’autorisation.

Utilisez plutôt l’un des contextes de processus `imsg` pris en charge :

- Exécutez le Gateway, ou au moins le pont `imsg`, dans la session locale de l’utilisateur Messages connecté.
- Démarrez le Gateway avec un LaunchAgent pour cet utilisateur après avoir accordé l’accès complet au disque et l’automatisation depuis la même session.
- Si vous conservez la topologie SSH à deux utilisateurs, vérifiez qu’un véritable `imsg send` sortant réussit via le wrapper exact avant d’activer le canal. Si l’automatisation ne peut pas être accordée, reconfigurez vers une configuration `imsg` à utilisateur unique au lieu de dépendre du wrapper SSH pour les envois.

</Accordion>

## Activation de l’API privée imsg

`imsg` est livré avec deux modes de fonctionnement :

- **Mode de base** (par défaut, aucune modification de SIP nécessaire) : texte et médias sortants via `send`, surveillance/historique entrants, liste des conversations. C’est ce que vous obtenez immédiatement après un nouveau `brew install steipete/tap/imsg` avec les autorisations macOS standard ci-dessus.
- **Mode API privée** : `imsg` injecte une dylib d’assistance dans `Messages.app` pour appeler des fonctions internes `IMCore`. C’est ce qui déverrouille `react`, `edit`, `unsend`, `reply` (en fil), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, ainsi que les indicateurs de saisie et les confirmations de lecture.

Pour accéder à la surface d’actions avancées documentée par cette page de canal, vous avez besoin du mode API privée. Le README de `imsg` est explicite sur cette exigence :

> Les fonctionnalités avancées comme `read`, `typing`, `launch`, l’envoi enrichi adossé au pont, la mutation des messages et la gestion des conversations sont optionnelles. Elles nécessitent la désactivation de SIP et l’injection d’une dylib d’assistance dans `Messages.app`. `imsg launch` refuse d’injecter lorsque SIP est activé.

La technique d’injection d’assistant utilise la propre dylib de `imsg` pour accéder aux API privées de Messages. Il n’y a aucun serveur tiers ni runtime BlueBubbles dans le chemin iMessage d’OpenClaw.

<Warning>
**Désactiver SIP est un véritable compromis de sécurité.** SIP est l’une des protections centrales de macOS contre l’exécution de code système modifié ; sa désactivation à l’échelle du système ouvre une surface d’attaque supplémentaire et peut avoir des effets secondaires. Notamment, **désactiver SIP sur les Mac Apple Silicon désactive aussi la possibilité d’installer et d’exécuter des apps iOS sur votre Mac**.

Traitez cela comme un choix opérationnel délibéré, pas comme une valeur par défaut. Si votre modèle de menace ne tolère pas la désactivation de SIP, iMessage intégré est limité au mode de base — envoi/réception de texte et de médias uniquement, sans réactions / modification / annulation d’envoi / effets / opérations de groupe.
</Warning>

### Configuration

1. **Installez (ou mettez à niveau) `imsg`** sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   La sortie `imsg status --json` indique `bridge_version`, `rpc_methods` et les `selectors` par méthode, afin que vous puissiez voir ce que la version actuelle prend en charge avant de démarrer.

2. **Désactivez System Integrity Protection et, sur les versions modernes de macOS, Library Validation.** L’injection d’une dylib d’assistance non Apple dans le `Messages.app` signé par Apple nécessite la désactivation de SIP **et** l’assouplissement de la validation de bibliothèque. L’étape SIP en mode Recovery dépend de la version de macOS :
   - **macOS 10.13-10.15 (Sierra-Catalina) :** désactivez Library Validation via Terminal, redémarrez en Recovery Mode, exécutez `csrutil disable`, puis redémarrez.
   - **macOS 11+ (Big Sur et versions ultérieures), Intel :** Recovery Mode (ou Internet Recovery), `csrutil disable`, puis redémarrez.
   - **macOS 11+, Apple Silicon :** séquence de démarrage avec le bouton d’alimentation pour entrer en Recovery ; sur les versions récentes de macOS, maintenez la touche **Maj gauche** lorsque vous cliquez sur Continuer, puis `csrutil disable`. Les configurations de machine virtuelle suivent un flux distinct ; prenez donc d’abord un instantané de la VM.

   **Sur macOS 11 et versions ultérieures, `csrutil disable` seul ne suffit généralement pas.** Apple applique toujours Library Validation à `Messages.app` en tant que binaire de plateforme ; un assistant signé adhoc est donc rejeté (`Library Validation failed: ... platform binary, but mapped file is not`) même avec SIP désactivé. Après avoir désactivé SIP, désactivez également Library Validation et redémarrez :

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), vérifié sur 26.5.1 :** SIP désactivé **plus** la commande `DisableLibraryValidation` ci-dessus suffit pour injecter l’assistant de 26.0 à 26.5.x. **Aucun boot-arg n’est requis.** Le plist est le facteur décisif et l’étape manquante la plus fréquente lorsque l’injection échoue sur Tahoe :
   - **Avec le plist :** `imsg launch` injecte et `imsg status` indique `advanced_features: true`.
   - **Sans le plist (même avec SIP désactivé) :** `imsg launch` échoue avec `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rejette l’assistant adhoc au chargement ; le pont ne devient donc jamais prêt et le lancement expire. Ce délai d’expiration est le symptôme que la plupart des personnes rencontrent sur Tahoe, et le correctif est le plist ci-dessus, rien de plus radical.

   Cela a été confirmé par un test contrôlé avant/après sur macOS 26.5.1 (Apple Silicon) : avec le plist, la dylib est mappée dans `Messages.app` et le pont démarre ; supprimez le plist et redémarrez, et `imsg launch` produit l’échec par délai d’expiration ci-dessus, avec la dylib non mappée.

   Si l’injection par `imsg launch` ou des `selectors` spécifiques commencent à renvoyer false après une mise à niveau de macOS, cette protection est généralement la cause. Vérifiez l’état de SIP et de la validation de bibliothèque avant de supposer que l’étape SIP elle-même a échoué. Si ces réglages sont corrects et que le pont ne peut toujours pas injecter, collectez `imsg status --json` ainsi que la sortie de `imsg launch`, puis signalez-le au projet `imsg` au lieu d’affaiblir d’autres contrôles de sécurité à l’échelle du système.

   Suivez le flux d’Apple en mode de récupération pour votre Mac afin de désactiver SIP avant d’exécuter `imsg launch`.

3. **Injecter l’assistant.** Avec SIP désactivé et Messages.app connecté :

   ```bash
   imsg launch
   ```

   `imsg launch` refuse d’injecter tant que SIP est encore activé ; cela sert donc aussi de confirmation que l’étape 2 a bien pris effet.

4. **Vérifier le pont depuis OpenClaw :**

   ```bash
   openclaw channels status --probe
   ```

   L’entrée iMessage doit indiquer `works`, et `imsg status --json | jq '.selectors'` doit afficher `retractMessagePart: true` ainsi que les sélecteurs de modification / saisie / lecture exposés par votre version de macOS. Le filtrage par méthode du Plugin OpenClaw dans `actions.ts` annonce uniquement les actions dont le sélecteur sous-jacent vaut `true` ; la surface d’actions visible dans la liste d’outils de l’agent reflète donc ce que le pont peut réellement faire sur cet hôte.

Si `openclaw channels status --probe` indique que le canal est `works`, mais que des actions spécifiques lèvent l’erreur « iMessage `<action>` requires the imsg private API bridge » au moment de l’envoi, exécutez à nouveau `imsg launch` — l’assistant peut se détacher (redémarrage de Messages.app, mise à jour de l’OS, etc.) et l’état mis en cache `available: true` continuera d’annoncer les actions jusqu’à ce que la prochaine sonde l’actualise.

### Quand vous ne pouvez pas désactiver SIP

Si SIP désactivé n’est pas acceptable pour votre modèle de menace :

- `imsg` revient au mode de base — texte + médias + réception uniquement.
- Le Plugin OpenClaw continue d’annoncer l’envoi de texte/média et la surveillance entrante ; il masque simplement `react`, `edit`, `unsend`, `reply`, `sendWithEffect` et les opérations de groupe de la surface d’actions (selon le filtre de capacité par méthode).
- Vous pouvez exécuter un Mac non Apple Silicon distinct (ou un Mac dédié au bot) avec SIP désactivé pour la charge iMessage, tout en gardant SIP activé sur vos appareils principaux. Voir [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) ci-dessous.

## Contrôle d’accès et routage

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` contrôle les messages directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    Champ de liste d’autorisation : `channels.imessage.allowFrom`.

    Les entrées de liste d’autorisation doivent identifier les expéditeurs : identifiants ou groupes d’accès expéditeur statiques (`accessGroup:<name>`). Utilisez `channels.imessage.groupAllowFrom` pour les cibles de discussion telles que `chat_id:*`, `chat_guid:*` ou `chat_identifier:*` ; utilisez `channels.imessage.groups` pour les clés de registre numériques `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` contrôle la gestion des groupes :

    - `allowlist` (par défaut quand configuré)
    - `open`
    - `disabled`

    Liste d’autorisation des expéditeurs de groupe : `channels.imessage.groupAllowFrom`.

    Les entrées `groupAllowFrom` peuvent aussi référencer des groupes d’accès expéditeur statiques (`accessGroup:<name>`).

    Repli à l’exécution : si `groupAllowFrom` n’est pas défini, les vérifications d’expéditeur de groupe iMessage utilisent `allowFrom` ; définissez `groupAllowFrom` quand l’admission en DM et en groupe doit différer.
    Note d’exécution : si `channels.imessage` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` et journalise un avertissement (même si `channels.defaults.groupPolicy` est défini).

    <Warning>
    Le routage de groupe comporte **deux** protections de liste d’autorisation exécutées l’une après l’autre, et les deux doivent réussir :

    1. **Liste d’autorisation expéditeur / cible de discussion** (`channels.imessage.groupAllowFrom`) — identifiant, `chat_guid`, `chat_identifier` ou `chat_id`.
    2. **Registre de groupes** (`channels.imessage.groups`) — avec `groupPolicy: "allowlist"`, cette protection exige soit une entrée générique `groups: { "*": { ... } }` (définit `allowAll = true`), soit une entrée explicite par `chat_id` sous `groups`.

    Si la protection 2 ne contient rien, chaque message de groupe est abandonné. Le Plugin émet deux signaux de niveau `warn` au niveau de journalisation par défaut :

    - une seule fois par compte au démarrage : `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - une seule fois par `chat_id` à l’exécution : `imessage: dropping group message from chat_id=<id> ...`

    Les DM continuent de fonctionner, car ils empruntent un chemin de code différent.

    Configuration minimale pour maintenir le flux des groupes avec `groupPolicy: "allowlist"` :

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

    Si ces lignes `warn` apparaissent dans le journal Gateway, la protection 2 abandonne les messages — ajoutez le bloc `groups`.
    </Warning>

    Filtrage par mention pour les groupes :

    - iMessage n’a pas de métadonnées de mention natives
    - la détection de mention utilise des motifs regex (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - sans motifs configurés, le filtrage par mention ne peut pas être appliqué

    Les commandes de contrôle provenant d’expéditeurs autorisés peuvent contourner le filtrage par mention dans les groupes.

    `systemPrompt` par groupe :

    Chaque entrée sous `channels.imessage.groups.*` accepte une chaîne `systemPrompt` facultative. La valeur est injectée dans le prompt système de l’agent à chaque tour qui traite un message dans ce groupe. La résolution reflète celle du prompt par groupe utilisée par `channels.whatsapp.groups` :

    1. **Prompt système spécifique au groupe** (`groups["<chat_id>"].systemPrompt`) : utilisé lorsque l’entrée de groupe spécifique existe dans la map **et** que sa clé `systemPrompt` est définie. Si `systemPrompt` est une chaîne vide (`""`), le caractère générique est supprimé et aucun prompt système n’est appliqué à ce groupe.
    2. **Prompt système générique de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée de groupe spécifique est entièrement absente de la map, ou lorsqu’elle existe mais ne définit aucune clé `systemPrompt`.

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
    - Les DM utilisent le routage direct ; les groupes utilisent le routage de groupe.
    - Avec `session.dmScope=main` par défaut, les DM iMessage sont regroupés dans la session principale de l’agent.
    - Les sessions de groupe sont isolées (`agent:<agentId>:imessage:group:<chat_id>`).
    - Les réponses sont routées vers iMessage à l’aide des métadonnées du canal/de la cible d’origine.

    Comportement des fils assimilables à des groupes :

    Certains fils iMessage à plusieurs participants peuvent arriver avec `is_group=false`.
    Si ce `chat_id` est explicitement configuré sous `channels.imessage.groups`, OpenClaw le traite comme du trafic de groupe (filtrage de groupe + isolation de session de groupe).

  </Tab>
</Tabs>

## Liaisons de conversation ACP

Les anciennes conversations iMessage peuvent aussi être liées à des sessions ACP.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le DM ou la discussion de groupe autorisée.
- Les futurs messages dans cette même conversation iMessage sont routés vers la session ACP créée.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont prises en charge via des entrées `bindings[]` de premier niveau avec `type: "acp"` et `match.channel: "imessage"`.

`match.peer.id` peut utiliser :

- un identifiant DM normalisé tel que `+15555550123` ou `user@example.com`
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Utilisez un identifiant Apple et un utilisateur macOS dédiés afin que le trafic du bot soit isolé de votre profil Messages personnel.

    Flux typique :

    1. Créez/connectez un utilisateur macOS dédié.
    2. Connectez-vous à Messages avec l’identifiant Apple du bot dans cet utilisateur.
    3. Installez `imsg` dans cet utilisateur.
    4. Créez un wrapper SSH afin qu’OpenClaw puisse exécuter `imsg` dans le contexte de cet utilisateur.
    5. Faites pointer `channels.imessage.accounts.<id>.cliPath` et `.dbPath` vers ce profil utilisateur.

    La première exécution peut nécessiter des approbations dans l’interface graphique (Automatisation + Accès complet au disque) dans la session utilisateur du bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologie courante :

    - Gateway s’exécute sur Linux/VM
    - iMessage + `imsg` s’exécutent sur un Mac dans votre tailnet
    - le wrapper `cliPath` utilise SSH pour exécuter `imsg`
    - `remoteHost` active les récupérations de pièces jointes par SCP

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
    Assurez-vous d’abord que la clé d’hôte est fiable (par exemple `ssh bot@mac-mini.tailnet-1234.ts.net`) afin que `known_hosts` soit renseigné.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage prend en charge une configuration par compte sous `channels.imessage.accounts`.

    Chaque compte peut remplacer des champs tels que `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, les paramètres d’historique et les listes d’autorisation de racines de pièces jointes.

  </Accordion>

  <Accordion title="Direct-message history">
    Définissez `channels.imessage.dmHistoryLimit` pour initialiser les nouvelles sessions de messages directs avec l’historique `imsg` récent décodé pour cette conversation. Utilisez `channels.imessage.dms["<sender>"].historyLimit` pour des remplacements par expéditeur, y compris `0` pour désactiver l’historique pour un expéditeur.

    L’historique des DM iMessage est récupéré à la demande depuis `imsg`. Laisser `dmHistoryLimit` non défini désactive l’initialisation globale de l’historique DM, mais un `channels.imessage.dms["<sender>"].historyLimit` positif par expéditeur active toujours l’initialisation pour cet expéditeur.

  </Accordion>
</AccordionGroup>

## Médias, découpage et cibles de livraison

<AccordionGroup>
  <Accordion title="Pièces jointes et médias">
    - l’ingestion des pièces jointes entrantes est **désactivée par défaut** — définissez `channels.imessage.includeAttachments: true` pour transférer les photos, mémos vocaux, vidéos et autres pièces jointes à l’agent. Quand elle est désactivée, les iMessages contenant uniquement des pièces jointes sont ignorés avant d’atteindre l’agent et peuvent ne produire aucune ligne de journal `Inbound message`.
    - les chemins de pièces jointes distants peuvent être récupérés via SCP lorsque `remoteHost` est défini
    - les chemins de pièces jointes doivent correspondre aux racines autorisées :
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP distant)
      - motif de racine par défaut : `/Users/*/Library/Messages/Attachments`
    - SCP utilise une vérification stricte de la clé d’hôte (`StrictHostKeyChecking=yes`)
    - la taille des médias sortants utilise `channels.imessage.mediaMaxMb` (16 Mo par défaut)

  </Accordion>

  <Accordion title="Découpage des messages sortants">
    - limite de segment de texte : `channels.imessage.textChunkLimit` (4000 par défaut)
    - mode de découpage : `channels.imessage.chunkMode`
      - `length` (par défaut)
      - `newline` (découpage donnant priorité aux paragraphes)

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

Lorsque `imsg launch` est en cours d’exécution et que `openclaw channels status --probe` indique `privateApi.available: true`, l’outil de message peut utiliser des actions natives iMessage en plus des envois de texte normaux.

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
  <Accordion title="Actions disponibles">
    - **react** : ajouter/supprimer des tapbacks iMessage (`messageId`, `emoji`, `remove`). Les tapbacks pris en charge correspondent à aimer, apprécier, ne pas aimer, rire, souligner et questionner.
    - **reply** : envoyer une réponse dans un fil à un message existant (`messageId`, `text` ou `message`, plus `chatGuid`, `chatId`, `chatIdentifier` ou `to`).
    - **sendWithEffect** : envoyer du texte avec un effet iMessage (`text` ou `message`, `effect` ou `effectId`).
    - **edit** : modifier un message envoyé sur les versions macOS/API privée prises en charge (`messageId`, `text` ou `newText`).
    - **unsend** : retirer un message envoyé sur les versions macOS/API privée prises en charge (`messageId`).
    - **upload-file** : envoyer des médias/fichiers (`buffer` en base64 ou un `media`/`path`/`filePath` hydraté, `filename`, `asVoice` facultatif). Alias historique : `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup** : gérer les discussions de groupe lorsque la cible actuelle est une conversation de groupe.

  </Accordion>

  <Accordion title="ID de message">
    Le contexte iMessage entrant inclut à la fois des valeurs `MessageSid` courtes et des GUID de message complets lorsqu’ils sont disponibles. Les ID courts sont limités au cache de réponses récent basé sur SQLite et sont vérifiés par rapport à la discussion actuelle avant utilisation. Si un ID court a expiré ou appartient à une autre discussion, réessayez avec le `MessageSidFull` complet.

  </Accordion>

  <Accordion title="Détection des capacités">
    OpenClaw masque les actions d’API privée uniquement lorsque l’état de sonde mis en cache indique que le pont est indisponible. Si l’état est inconnu, les actions restent visibles et le dispatch lance les sondes paresseusement afin que la première action puisse réussir après `imsg launch` sans actualisation manuelle distincte de l’état.

  </Accordion>

  <Accordion title="Accusés de lecture et saisie">
    Lorsque le pont d’API privée est actif, les discussions entrantes acceptées sont marquées comme lues et les discussions directes affichent une bulle de saisie dès que le tour est accepté, pendant que l’agent prépare le contexte et génère la réponse. Désactivez le marquage comme lu avec :

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Les anciennes versions de `imsg` antérieures à la liste de capacités par méthode désactiveront silencieusement la saisie/lecture ; OpenClaw journalise un avertissement unique par redémarrage afin que l’absence d’accusé soit identifiable.

  </Accordion>

  <Accordion title="Tapbacks entrants">
    OpenClaw s’abonne aux tapbacks iMessage et route les réactions acceptées comme événements système au lieu d’un texte de message normal, de sorte qu’un tapback utilisateur ne déclenche pas une boucle de réponse ordinaire.

    Le mode de notification est contrôlé par `channels.imessage.reactionNotifications` :

    - `"own"` (par défaut) : notifier uniquement lorsque les utilisateurs réagissent aux messages rédigés par le bot.
    - `"all"` : notifier tous les tapbacks entrants des expéditeurs autorisés.
    - `"off"` : ignorer les tapbacks entrants.

    Les remplacements par compte utilisent `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Réactions d’approbation (👍 / 👎)">
    Lorsque `approvals.exec.enabled` ou `approvals.plugin.enabled` vaut true et que la requête est routée vers iMessage, le Gateway envoie nativement une invite d’approbation et accepte un tapback pour la résoudre :

    - `👍` (tapback J’aime) → `allow-once`
    - `👎` (tapback Je n’aime pas) → `deny`
    - `allow-always` reste un repli manuel : envoyez `/approve <id> allow-always` comme réponse normale.

    Le traitement des réactions exige que l’identifiant de l’utilisateur qui réagit soit un approbateur explicite. La liste des approbateurs est lue depuis `channels.imessage.allowFrom` (ou `channels.imessage.accounts.<id>.allowFrom`) ; ajoutez le numéro de téléphone de l’utilisateur au format E.164 ou son e-mail Apple ID. L’entrée générique `"*"` est honorée, mais permet à n’importe quel expéditeur d’approuver. Le raccourci par réaction contourne intentionnellement `reactionNotifications`, `dmPolicy` et `groupAllowFrom`, car la liste d’autorisation des approbateurs explicites est le seul garde-fou pertinent pour la résolution des approbations.

    **Changement de comportement avec cette version :** lorsque `channels.imessage.allowFrom` n’est pas vide, la commande texte `/approve <id> <decision>` est désormais autorisée selon cette liste d’approbateurs (et non selon la liste d’autorisation DM plus large). Les expéditeurs autorisés par la liste DM mais absents de `allowFrom` recevront un refus explicite. Ajoutez à `allowFrom` chaque opérateur qui doit pouvoir approuver via `/approve` (et via les réactions) afin de préserver le comportement précédent. Lorsque `allowFrom` est vide, l’ancien « repli sur la même discussion » reste en vigueur et `/approve` continue d’autoriser toute personne permise par la liste d’autorisation DM.

    Notes pour les opérateurs :
    - La liaison de réaction est stockée à la fois en mémoire (avec un TTL aligné sur l’expiration de l’approbation) et dans le magasin persistant à clés du Gateway, de sorte qu’un tapback reçu peu après un redémarrage du Gateway résout tout de même l’approbation.
    - Les tapbacks interappareils `is_from_me=true` (la propre réaction de l’opérateur sur un appareil Apple jumelé) sont intentionnellement ignorés afin que le bot ne puisse pas s’auto-approuver.
    - Les tapbacks historiques sous forme de texte (`Liked "…"` en texte brut depuis de très anciens clients Apple) ne peuvent pas résoudre les approbations, car ils ne transportent aucun GUID de message ; la résolution par réaction exige les métadonnées structurées de tapback émises par les clients macOS / iOS actuels.

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

## Fusion des DM à envoi fractionné (commande + URL dans une seule composition)

Lorsqu’un utilisateur saisit une commande et une URL ensemble — par exemple `Dump https://example.com/article` — l’app Messages d’Apple divise l’envoi en **deux lignes `chat.db` distinctes** :

1. Un message texte (`"Dump"`).
2. Une bulle d’aperçu d’URL (`"https://..."`) avec des images d’aperçu OG en pièces jointes.

Les deux lignes arrivent dans OpenClaw à environ 0,8-2,0 s d’intervalle sur la plupart des installations. Sans fusion, l’agent reçoit uniquement la commande au tour 1, répond (souvent « envoyez-moi l’URL »), puis ne voit l’URL qu’au tour 2 — moment où le contexte de commande est déjà perdu. C’est le pipeline d’envoi d’Apple, pas quelque chose introduit par OpenClaw ou `imsg`.

`channels.imessage.coalesceSameSenderDms` active la mise en tampon des lignes consécutives du même expéditeur pour un DM. Lorsque `imsg` expose le marqueur structurel d’aperçu d’URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` sur l’une des lignes sources, OpenClaw fusionne uniquement ce véritable envoi fractionné et conserve toutes les autres lignes mises en tampon comme des tours distincts. Sur les anciennes versions de `imsg` qui n’émettent aucune métadonnée de bulle, OpenClaw ne peut pas distinguer un envoi fractionné d’envois séparés ; il revient donc à la fusion du lot. Cela préserve le comportement antérieur aux métadonnées au lieu de faire régresser les envois fractionnés `Dump <url>` en deux tours. Les discussions de groupe continuent d’être dispatchées message par message afin de préserver la structure de tour multi-utilisateur.

<Tabs>
  <Tab title="Quand l’activer">
    Activez-le lorsque :

    - Vous fournissez des Skills qui attendent `command + payload` dans un seul message (vider, coller, enregistrer, mettre en file, etc.).
    - Vos utilisateurs collent des URL avec des commandes.
    - Vous pouvez accepter la latence de tour DM ajoutée (voir ci-dessous).

    Laissez-le désactivé lorsque :

    - Vous avez besoin d’une latence de commande minimale pour des déclencheurs DM à un seul mot.
    - Tous vos flux sont des commandes ponctuelles sans compléments de charge utile.

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

    Lorsque l’option est activée et qu’aucun `messages.inbound.byChannel.imessage` explicite ni `messages.inbound.debounceMs` global n’est défini, la fenêtre d’anti-rebond s’élargit à **7000 ms** (la valeur historique par défaut est 0 ms — aucun anti-rebond). Cette fenêtre plus large est nécessaire, car la cadence des envois fractionnés d’aperçus d’URL d’Apple peut s’étendre sur plusieurs secondes pendant que Messages.app émet la ligne d’aperçu.

    Pour régler vous-même la fenêtre :

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
    - **Une fusion précise nécessite les métadonnées de charge utile `imsg` actuelles.** Lorsque la ligne d’URL inclut `balloon_bundle_id`, seul ce véritable envoi fractionné est fusionné et les autres lignes mises en tampon restent séparées. Sur les anciennes versions de `imsg` qui n’exposent aucune métadonnée de bulle, OpenClaw revient à la fusion du lot mis en tampon afin que les envois fractionnés `Dump <url>` ne régressent pas en deux tours (compatibilité temporaire, supprimée une fois que `imsg` fusionnera les envois fractionnés en amont).
    - **Latence ajoutée pour les messages DM.** Lorsque l’option est activée, chaque DM (y compris les commandes de contrôle autonomes et les réponses de suivi contenant un seul texte) attend jusqu’à la fin de la fenêtre d’anti-rebond avant dispatch, au cas où une ligne d’aperçu d’URL arriverait. Les messages de discussion de groupe conservent un dispatch instantané.
    - **La sortie fusionnée est bornée.** Le texte fusionné est limité à 4000 caractères avec un marqueur explicite `…[truncated]` ; les pièces jointes sont limitées à 20 ; les entrées sources sont limitées à 10 (la première et les plus récentes sont conservées au-delà). Chaque GUID source est suivi dans `coalescedMessageGuids` pour la télémétrie en aval.
    - **DM uniquement.** Les discussions de groupe passent au dispatch message par message afin que le bot reste réactif lorsque plusieurs personnes écrivent.
    - **Activation explicite, par canal.** Les autres canaux (Telegram, WhatsApp, Slack, …) ne sont pas affectés. Les configurations historiques BlueBubbles qui définissent `channels.bluebubbles.coalesceSameSenderDms` doivent migrer cette valeur vers `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scénarios et ce que voit l’agent

La colonne « Flag on » montre le comportement sur une build `imsg` qui émet `balloon_bundle_id`. Sur les anciennes builds `imsg` qui n’émettent aucune métadonnée de bulle, les lignes ci-dessous marquées « Deux tours » / « N tours » reviennent plutôt à une fusion héritée (un tour) : OpenClaw ne peut pas distinguer structurellement un envoi fractionné de plusieurs envois séparés, donc il préserve la fusion antérieure aux métadonnées. La séparation précise s’active dès que la build émet les métadonnées de bulle.

| L’utilisateur compose                                              | `chat.db` produit                    | Flag off (par défaut)                  | Flag on + fenêtre (`imsg` émet des métadonnées de bulle)                                             |
| ------------------------------------------------------------------ | ------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un envoi)                              | 2 lignes à ~1 s d’intervalle         | Deux tours agent : « Dump » seul, puis URL | Un tour : texte fusionné `Dump https://example.com`                                                  |
| `Save this 📎image.jpg caption` (pièce jointe + texte)             | 2 lignes sans métadonnées de bulle d’URL | Deux tours                          | Deux tours après observation des métadonnées ; un tour fusionné sur les anciennes sessions/pré-verrouillage sans métadonnées |
| `/status` (commande autonome)                                      | 1 ligne                              | Distribution instantanée               | **Attendre jusqu’à la fenêtre, puis distribuer**                                                     |
| URL collée seule                                                   | 1 ligne                              | Distribution instantanée               | Attendre jusqu’à la fenêtre, puis distribuer                                                         |
| Texte + URL envoyés comme deux messages séparés délibérés, à plusieurs minutes d’intervalle | 2 lignes hors fenêtre | Deux tours | Deux tours (la fenêtre expire entre les deux)                                                        |
| Flux rapide (>10 petits DM dans la fenêtre)                        | N lignes sans métadonnées de bulle d’URL | N tours                            | N tours après observation des métadonnées ; un tour fusionné borné sur les anciennes sessions/pré-verrouillage sans métadonnées |
| Deux personnes écrivent dans une discussion de groupe              | N lignes de M expéditeurs            | M+ tours (un par compartiment d’expéditeur) | M+ tours — les discussions de groupe ne sont pas coalescées                                          |

## Récupération entrante après un redémarrage du pont ou du Gateway

iMessage récupère les messages manqués pendant que le Gateway était arrêté et supprime en même temps l’ancienne « bombe de backlog » qu’Apple peut vider après une récupération Push. Le comportement par défaut est toujours activé, construit sur la déduplication entrante.

- **Déduplication de relecture.** Chaque message entrant distribué est enregistré par son GUID Apple dans l’état persistant du plugin (`imessage.inbound-dedupe`), réclamé à l’ingestion et validé après traitement (libéré en cas d’échec transitoire afin qu’il puisse être réessayé). Tout élément déjà traité est abandonné au lieu d’être distribué deux fois. C’est ce qui permet à la récupération de relire agressivement sans suivi message par message.
- **Récupération après interruption.** Au démarrage, le moniteur mémorise le dernier rowid `chat.db` distribué (un curseur persistant par compte) et le transmet à `imsg watch.subscribe` comme `since_rowid`, afin qu’imsg relise les lignes arrivées pendant que le Gateway était arrêté, puis suive le direct. La relecture est bornée aux lignes les plus récentes et aux messages datant d’au plus ~2 heures, et la déduplication abandonne tout ce qui a déjà été traité.
- **Barrière d’âge du backlog obsolète.** Les lignes au-dessus de la limite de démarrage sont réellement en direct ; celle dont la date d’envoi est de plus de ~15 minutes antérieure à son arrivée correspond au backlog vidé par Push et est supprimée. Les lignes relues (à la limite ou en dessous) utilisent plutôt la fenêtre de récupération plus large, afin qu’un message récemment manqué soit livré tandis que l’historique ancien ne l’est pas.

La récupération fonctionne avec les configurations `cliPath` locales et distantes, car la relecture `since_rowid` passe par la même connexion RPC `imsg`. La différence est la fenêtre : lorsque le Gateway peut lire `chat.db` (local), il ancre la limite de rowid de démarrage, plafonne l’étendue de relecture et livre les messages manqués datant d’au plus quelques heures. Avec un `cliPath` SSH distant, il ne peut pas lire la base de données ; la relecture est donc non plafonnée et chaque ligne utilise la barrière d’âge du direct — elle récupère toujours les messages récemment manqués et supprime toujours l’ancien backlog, mais avec la fenêtre de direct plus étroite. Exécutez le Gateway sur le Mac Messages pour obtenir la fenêtre de récupération plus large.

### Signal visible par l’opérateur

Le backlog supprimé est journalisé au niveau par défaut, jamais abandonné silencieusement (le flag `recovery` indique quelle fenêtre a été appliquée) :

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migration

`channels.imessage.catchup.*` est obsolète — la récupération après interruption est désormais automatique et ne nécessite aucune configuration pour les nouvelles installations. Les configurations existantes avec `catchup.enabled: true` restent honorées comme profil de compatibilité pour la fenêtre de relecture de récupération. Les blocs catchup désactivés (`enabled: false` ou sans `enabled: true`) sont retirés ; `openclaw doctor --fix` les supprime.

## Dépannage

<AccordionGroup>
  <Accordion title="imsg introuvable ou RPC non pris en charge">
    Validez le binaire et la prise en charge RPC :

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Si la sonde indique que RPC n’est pas pris en charge, mettez à jour `imsg`. Si les actions d’API privée sont indisponibles, exécutez `imsg launch` dans la session utilisateur macOS connectée et relancez la sonde. Si le Gateway ne s’exécute pas sur macOS, utilisez plutôt la configuration Mac distant via SSH ci-dessus au lieu du chemin `imsg` local par défaut.

  </Accordion>

  <Accordion title="Les messages sont envoyés mais les iMessages entrants n’arrivent pas">
    Commencez par prouver si le message a atteint le Mac local. Si `chat.db` ne change pas, OpenClaw ne peut pas recevoir le message même lorsque `imsg status --json` signale un pont sain.

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

    Envoyez un nouvel iMessage depuis le téléphone et confirmez une nouvelle ligne `chat.db` ou un événement `imsg watch` avant de déboguer les sessions OpenClaw. N’exécutez pas cela comme une boucle périodique de relance du pont ; des `imsg launch` répétés avec des redémarrages du Gateway pendant un travail actif peuvent interrompre les livraisons et laisser en suspens des exécutions de canal en cours.

  </Accordion>

  <Accordion title="Le Gateway ne s’exécute pas sur macOS">
    Le `cliPath: "imsg"` par défaut doit s’exécuter sur le Mac connecté à Messages. Sous Linux ou Windows, définissez `channels.imessage.cliPath` sur un script wrapper qui se connecte à ce Mac via SSH et exécute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Exécutez ensuite :

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Les DM sont ignorés">
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
    - la configuration du modèle de mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Les pièces jointes distantes échouent">
    Vérifiez :

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - l’authentification par clé SSH/SCP depuis l’hôte du Gateway
    - l’existence de la clé d’hôte dans `~/.ssh/known_hosts` sur l’hôte du Gateway
    - la lisibilité du chemin distant sur le Mac exécutant Messages

  </Accordion>

  <Accordion title="Les invites d’autorisation macOS ont été manquées">
    Relancez dans un terminal GUI interactif dans le même contexte utilisateur/session et approuvez les invites :

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirmez que l’accès complet au disque + l’automatisation sont accordés au contexte de processus qui exécute OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Pointeurs de référence de configuration

- [Référence de configuration - iMessage](/fr/gateway/config-channels#imessage)
- [Configuration du Gateway](/fr/gateway/configuration)
- [Appairage](/fr/channels/pairing)

## Liés

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) — annonce et résumé de migration
- [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles) — table de traduction de configuration et bascule étape par étape
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
