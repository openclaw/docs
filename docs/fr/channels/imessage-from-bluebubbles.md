---
read_when:
    - Planifier une migration de BlueBubbles vers le Plugin iMessage inclus
    - Traduction des clés de configuration BlueBubbles en équivalents iMessage
    - Vérifier imsg avant d’activer le Plugin iMessage
summary: Migrez les anciennes configurations BlueBubbles vers le Plugin iMessage intégré sans perdre l’appairage, les listes d’autorisation ni les liaisons de groupes.
title: Si vous venez de BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Le Plugin `imessage` intégré accède désormais à la même surface d’API privée que BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gestion des groupes, pièces jointes) en pilotant [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC. Si vous utilisez déjà un Mac avec `imsg` installé, vous pouvez supprimer le serveur BlueBubbles et laisser le Plugin communiquer directement avec Messages.app.

La prise en charge de BlueBubbles a été supprimée. OpenClaw prend en charge iMessage uniquement via `imsg`. Ce guide explique comment migrer les anciennes configurations `channels.bluebubbles` vers `channels.imessage` ; aucun autre chemin de migration n’est pris en charge.

## Quand cette migration est pertinente

- Vous exécutez déjà `imsg` sur le même Mac (ou sur un Mac accessible via SSH) où Messages.app est connecté.
- Vous voulez un composant en moins — pas de serveur BlueBubbles séparé, pas de point de terminaison REST à authentifier, pas de câblage Webhook. Un seul binaire CLI au lieu d’un serveur + une application cliente + un assistant.
- Vous utilisez une [version macOS / `imsg` prise en charge](/fr/channels/imessage#requirements-and-permissions-macos) où la sonde d’API privée indique `available: true`.

## Ce que fait imsg

`imsg` est une CLI macOS locale pour Messages. OpenClaw démarre `imsg rpc` comme processus enfant et communique en JSON-RPC via stdin/stdout. Il n’y a pas de serveur HTTP, d’URL Webhook, de démon en arrière-plan, d’agent de lancement ni de port à exposer.

- Les lectures proviennent de `~/Library/Messages/chat.db` au moyen d’un descripteur SQLite en lecture seule.
- Les messages entrants en direct proviennent de `imsg watch` / `watch.subscribe`, qui suit les événements du système de fichiers de `chat.db` avec un repli par interrogation.
- Les envois utilisent l’automatisation de Messages.app pour le texte normal et les fichiers.
- Les actions avancées utilisent `imsg launch` pour injecter l’assistant `imsg` dans Messages.app. C’est ce qui débloque les accusés de lecture, les indicateurs de saisie, les envois enrichis, la modification, l’annulation d’envoi, la réponse en fil, les tapbacks et la gestion des groupes.
- Les versions Linux peuvent inspecter un `chat.db` copié, mais ne peuvent pas envoyer de messages, surveiller la base de données Mac en direct ni piloter Messages.app. Pour OpenClaw iMessage, exécutez `imsg` sur le Mac connecté ou via un wrapper SSH vers ce Mac.

## Avant de commencer

1. Installez `imsg` sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Si `imsg chats` échoue avec `unable to open database file`, une sortie vide ou `authorization denied`, accordez l’Accès complet au disque au terminal, à l’éditeur, au processus Node, au service Gateway ou au processus parent SSH qui lance `imsg`, puis rouvrez ce processus parent.

2. Vérifiez les surfaces de lecture, de surveillance, d’envoi et RPC avant de modifier la configuration OpenClaw :

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Remplacez `42` par un véritable identifiant de discussion provenant de `imsg chats`. L’envoi nécessite l’autorisation d’automatisation pour Messages.app. Si OpenClaw s’exécute via SSH, exécutez ces commandes avec le même wrapper SSH ou le même contexte utilisateur que celui qu’OpenClaw utilisera.

3. Activez le pont d’API privée lorsque vous avez besoin d’actions avancées :

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` exige que SIP soit désactivé. L’envoi de base, l’historique et la surveillance fonctionnent sans `imsg launch` ; les actions avancées ne fonctionnent pas.

4. Vérifiez le pont via OpenClaw :

   ```bash
   openclaw channels status --probe
   ```

   Vous voulez `imessage.privateApi.available: true`. S’il indique `false`, corrigez d’abord cela — consultez [Détection des capacités](/fr/channels/imessage#private-api-actions).

5. Créez un instantané de votre configuration :

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traduction de la configuration

iMessage et BlueBubbles partagent une grande partie de la configuration au niveau du canal. Les clés qui changent concernent surtout le transport (serveur REST contre CLI locale). Les clés de comportement (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) conservent la même signification.

| BlueBubbles                                                | iMessage intégré                          | Remarques                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Même sémantique.                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.serverUrl`                           | _(supprimé)_                              | Aucun serveur REST — le plugin lance `imsg rpc` via stdio.                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.password`                            | _(supprimé)_                              | Aucune authentification webhook nécessaire.                                                                                                                                                                                                                                                                                                  |
| _(implicite)_                                              | `channels.imessage.cliPath`               | Chemin vers `imsg` (par défaut `imsg`) ; utilisez un script wrapper pour SSH.                                                                                                                                                                                                                                                                 |
| _(implicite)_                                              | `channels.imessage.dbPath`                | Remplacement facultatif de `chat.db` de Messages.app ; détecté automatiquement si omis.                                                                                                                                                                                                                                                       |
| _(implicite)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` — nécessaire uniquement lorsque `cliPath` est un wrapper SSH et que vous voulez récupérer des pièces jointes par SCP.                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mêmes valeurs (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Les approbations d’appairage sont conservées par identifiant, pas par jeton.                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mêmes valeurs (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Identique.                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copiez ceci textuellement, y compris toute entrée générique `groups: { "*": { ... } }`.** Les paramètres par groupe `requireMention`, `tools`, `toolsBySender` sont conservés. Avec `groupPolicy: "allowlist"`, un bloc `groups` vide ou manquant ignore silencieusement chaque message de groupe — voir « Piège du registre de groupes » ci-dessous. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Par défaut `true`. Avec le plugin intégré, cela ne se déclenche que lorsque la sonde d’API privée est active.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Même forme, **même désactivation par défaut**. Si des pièces jointes circulaient avec BlueBubbles, vous devez redéfinir explicitement ce paramètre sur le bloc iMessage — il n’est pas transféré implicitement, et les photos/médias entrants seront ignorés silencieusement sans ligne de journal `Inbound message` tant que vous ne le faites pas. |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Racines locales ; mêmes règles de caractères génériques.                                                                                                                                                                                                                                                                                      |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Utilisé uniquement lorsque `remoteHost` est défini pour les récupérations SCP.                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Par défaut 16 Mo sur iMessage (la valeur par défaut de BlueBubbles était 8 Mo). Définissez-le explicitement si vous voulez conserver la limite inférieure.                                                                                                                                                                                      |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Par défaut 4000 sur les deux.                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Même option à activer explicitement. DM uniquement — les discussions de groupe conservent l’envoi instantané message par message sur les deux canaux. Élargit le délai anti-rebond entrant par défaut à 2500 ms lorsqu’il est activé sans `messages.inbound.byChannel.imessage` explicite. Voir [documentation iMessage § Regroupement des DM envoyés en plusieurs parties](/fr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage lit déjà les noms d’affichage des expéditeurs depuis `chat.db`.                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Options par action : `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                          |

Les configurations multi-comptes (`channels.bluebubbles.accounts.*`) se traduisent une pour une en `channels.imessage.accounts.*`.

## Piège du registre de groupes

Le plugin iMessage intégré exécute **deux** contrôles distincts de liste d’autorisation de groupe l’un après l’autre. Les deux doivent réussir pour qu’un message de groupe atteigne l’agent :

1. **Liste d’autorisation expéditeur / cible de discussion** (`channels.imessage.groupAllowFrom`) — vérifiée par `isAllowedIMessageSender`. Correspond aux messages entrants par identifiant d’expéditeur, `chat_guid`, `chat_identifier` ou `chat_id`. Même forme que BlueBubbles.
2. **Registre de groupes** (`channels.imessage.groups`) — vérifié par `resolveChannelGroupPolicy` depuis `inbound-processing.ts:199`. Avec `groupPolicy: "allowlist"`, ce contrôle exige soit :
   - une entrée générique `groups: { "*": { ... } }` (définit `allowAll = true`), soit
   - une entrée explicite par `chat_id` sous `groups`.

Si le contrôle 1 réussit mais que le contrôle 2 échoue, le message est ignoré. Le plugin émet deux signaux de niveau `warn` afin que ce comportement ne soit plus silencieux au niveau de journalisation par défaut :

- Un `warn` de démarrage unique par compte lorsque `groupPolicy: "allowlist"` est défini mais que `channels.imessage.groups` est vide (aucun caractère générique `"*"`, aucune entrée par `chat_id`) — déclenché avant l’arrivée de tout message.
- Un `warn` unique par `chat_id` la première fois qu’un groupe spécifique est ignoré à l’exécution, en nommant le chat_id et la clé exacte à ajouter à `groups` pour l’autoriser.

Les DM continuent de fonctionner parce qu’ils empruntent un chemin de code différent.

C’est le mode d’échec le plus courant lors d’une migration BlueBubbles → iMessage intégré : les opérateurs copient `groupAllowFrom` et `groupPolicy`, mais omettent le bloc `groups`, parce que `groups: { "*": { "requireMention": true } }` de BlueBubbles ressemble à un paramètre de mention sans rapport. Il est en réalité essentiel pour le contrôle du registre.

La configuration minimale pour que les messages de groupe continuent de circuler après `groupPolicy: "allowlist"` :

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` sous `*` est inoffensif lorsqu’aucun motif de mention n’est configuré : le runtime définit `canDetectMention = false` et court-circuite l’abandon de mention à `inbound-processing.ts:512`. Avec des motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`), cela fonctionne comme prévu.

Si les journaux du Gateway affichent `imessage: dropping group message from chat_id=<id>` ou la ligne de démarrage `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, la porte 2 abandonne le message — ajoutez le bloc `groups`.

## Étape par étape

1. Ajoutez un bloc iMessage à côté du bloc BlueBubbles existant. Conservez l’ancien bloc uniquement comme source de copie jusqu’à ce que le nouveau chemin soit vérifié :

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Sonde d’essai à blanc** — démarrez le Gateway et confirmez qu’iMessage indique un état sain :

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Comme `imessage.enabled` vaut encore `false`, aucun trafic iMessage entrant n’est encore routé — mais `--probe` exerce le pont, ce qui vous permet de détecter les problèmes d’autorisation ou d’installation avant le basculement.

3. **Basculez.** Supprimez la configuration BlueBubbles et activez iMessage en une seule modification de configuration :

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Redémarrez le Gateway. Le trafic iMessage entrant passe maintenant par le Plugin intégré.

4. **Vérifiez les DM.** Envoyez un message direct à l’agent ; confirmez que la réponse arrive.

5. **Vérifiez les groupes séparément.** Les DM et les groupes empruntent des chemins de code différents — la réussite des DM ne prouve pas que les groupes sont routés. Envoyez un message à l’agent dans une conversation de groupe appairée et confirmez que la réponse arrive. Si le groupe devient silencieux (aucune réponse de l’agent, aucune erreur), vérifiez dans le journal du Gateway la présence de `imessage: dropping group message from chat_id=<id>` ou de la ligne de démarrage `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — toutes deux se déclenchent au niveau de journalisation par défaut. Si l’une ou l’autre apparaît, votre bloc `groups` est manquant ou vide — consultez « Piège du registre de groupes » ci-dessus.

6. **Vérifiez la surface d’action** — depuis un DM appairé, demandez à l’agent de réagir, modifier, annuler l’envoi, répondre, envoyer une photo et (dans un groupe) renommer le groupe / ajouter ou supprimer un participant. Chaque action doit arriver nativement dans Messages.app. Si l’une d’elles renvoie « iMessage `<action>` requires the imsg private API bridge », exécutez à nouveau `imsg launch` et actualisez `channels status --probe`.

7. **Supprimez le serveur et la configuration BlueBubbles** une fois que les DM, groupes et actions iMessage sont vérifiés. OpenClaw n’utilisera pas `channels.bluebubbles`.

## Parité des actions en bref

| Action                                                     | BlueBubbles hérité                 | iMessage intégré                                                                                                       |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Envoyer du texte / repli SMS                               | ✅                                  | ✅                                                                                                                      |
| Envoyer des médias (photo, vidéo, fichier, voix)           | ✅                                  | ✅                                                                                                                      |
| Réponse en fil (`reply_to_guid`)                           | ✅                                  | ✅ (clôt [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                   |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Modifier / annuler l’envoi (destinataires macOS 13+)       | ✅                                  | ✅                                                                                                                      |
| Envoyer avec un effet d’écran                              | ✅                                  | ✅ (clôt une partie de [#9394](https://github.com/openclaw/openclaw/issues/9394))                                       |
| Texte enrichi gras / italique / souligné / barré           | ✅                                  | ✅ (mise en forme par segments typés via attributedBody)                                                                |
| Renommer le groupe / définir l’icône du groupe             | ✅                                  | ✅                                                                                                                      |
| Ajouter / supprimer un participant, quitter le groupe      | ✅                                  | ✅                                                                                                                      |
| Accusés de lecture et indicateur de saisie                 | ✅                                  | ✅ (conditionné par la sonde d’API privée)                                                                              |
| Coalescence des DM du même expéditeur                      | ✅                                  | ✅ (DM uniquement ; optionnel via `channels.imessage.coalesceSameSenderDms`)                                            |
| Rattrapage des messages entrants reçus pendant l’arrêt du Gateway | ✅ (relecture Webhook + récupération de l’historique) | ✅ (optionnel via `channels.imessage.catchup.enabled` ; clôt [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Le rattrapage iMessage est désormais disponible comme fonctionnalité optionnelle sur le Plugin intégré. Au démarrage du Gateway, si `channels.imessage.catchup.enabled` vaut `true`, le Gateway exécute une passe `chats.list` + `messages.history` par conversation sur le même client JSON-RPC que celui utilisé par `imsg watch`, relit chaque ligne entrante manquée via le chemin de dispatch en direct (listes d’autorisation, stratégie de groupe, anti-rebond, cache d’écho) et persiste un curseur par compte afin que les démarrages suivants reprennent là où ils s’étaient arrêtés. Consultez [Rattraper après une indisponibilité du Gateway](/fr/channels/imessage#catching-up-after-gateway-downtime) pour le réglage.

## Appairage, sessions et liaisons ACP

- **Les approbations d’appairage** sont conservées par identifiant. Vous n’avez pas besoin de réapprouver les expéditeurs connus — `channels.imessage.allowFrom` reconnaît les mêmes chaînes `+15555550123` / `user@example.com` qu’utilisait BlueBubbles.
- **Les sessions** restent limitées par agent + conversation. Les DM se replient dans la session principale de l’agent avec le `session.dmScope=main` par défaut ; les sessions de groupe restent isolées par `chat_id`. Les clés de session diffèrent (`agent:<id>:imessage:group:<chat_id>` par rapport à l’équivalent BlueBubbles) — l’ancien historique de conversation sous les clés de session BlueBubbles n’est pas transféré dans les sessions iMessage.
- **Les liaisons ACP** qui référencent `match.channel: "bluebubbles"` doivent être mises à jour vers `"imessage"`. Les formes de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identifiant nu) sont identiques.

## Aucun canal de rollback

Il n’existe aucun runtime BlueBubbles pris en charge vers lequel revenir. Si la vérification iMessage échoue, définissez `channels.imessage.enabled: false`, redémarrez le Gateway, corrigez le blocage `imsg`, puis retentez le basculement.

Le cache de réponses se trouve à `~/.openclaw/state/imessage/reply-cache.jsonl` (mode `0600`, répertoire parent `0700`). Vous pouvez le supprimer sans risque si vous voulez repartir de zéro.

## Connexe

- [iMessage](/fr/channels/imessage) — référence complète du canal iMessage, y compris la configuration `imsg launch` et la détection des capacités.
- `/channels/bluebubbles` — URL héritée qui redirige vers ce guide de migration.
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage.
- [Routage des canaux](/fr/channels/channel-routing) — comment le Gateway choisit un canal pour les réponses sortantes.
