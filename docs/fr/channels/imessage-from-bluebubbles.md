---
read_when:
    - Planifier une migration de BlueBubbles vers le plugin iMessage intégré
    - Traduction des clés de configuration BlueBubbles en équivalents iMessage
    - Vérification d’imsg avant d’activer le plugin iMessage
summary: Migrer les anciennes configurations BlueBubbles vers le Plugin iMessage intégré sans perdre le jumelage, les listes d’autorisation ni les liaisons de groupe.
title: Venir de BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Le plugin `imessage` intégré atteint désormais la même surface d’API privée que BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gestion des groupes, pièces jointes) en pilotant [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC. Si vous utilisez déjà un Mac avec `imsg` installé, vous pouvez supprimer le serveur BlueBubbles et laisser le plugin communiquer directement avec Messages.app.

La prise en charge de BlueBubbles a été supprimée. OpenClaw prend en charge iMessage uniquement via `imsg`. Ce guide sert à migrer les anciennes configurations `channels.bluebubbles` vers `channels.imessage` ; il n’existe aucun autre chemin de migration pris en charge.

<Note>
Pour l’annonce courte et le résumé opérateur, consultez [Suppression de BlueBubbles et chemin iMessage avec imsg](/fr/announcements/bluebubbles-imessage).
</Note>

## Liste de contrôle de migration

Utilisez cette liste de contrôle lorsque vous connaissez déjà votre ancienne configuration BlueBubbles et que vous voulez le chemin sûr le plus court :

1. Vérifiez `imsg` directement sur le Mac qui exécute Messages.app (`imsg chats`, `imsg history`, `imsg send` et `imsg rpc --help`).
2. Copiez les clés de comportement de `channels.bluebubbles` vers `channels.imessage` : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` et `actions`.
3. Supprimez les clés de transport qui n’existent plus : `serverUrl`, `password`, les URL de webhook et la configuration du serveur BlueBubbles.
4. Si le Gateway ne s’exécute pas sur le Mac Messages, définissez `channels.imessage.cliPath` sur un wrapper SSH et définissez `remoteHost` pour les récupérations distantes de pièces jointes.
5. Gateway arrêté, activez `channels.imessage`, puis exécutez `openclaw channels status --probe --channel imessage`.
6. Testez un DM, un groupe autorisé, les pièces jointes si elles sont activées, et chaque action d’API privée que vous attendez que l’agent utilise.
7. Supprimez le serveur BlueBubbles et l’ancienne configuration `channels.bluebubbles` une fois le chemin iMessage vérifié.

## Quand cette migration est pertinente

- Vous exécutez déjà `imsg` sur le même Mac (ou sur un Mac joignable via SSH) où Messages.app est connecté.
- Vous voulez un composant de moins — pas de serveur BlueBubbles séparé, pas de point de terminaison REST à authentifier, pas de plomberie de webhook. Un seul binaire CLI au lieu d’un serveur + une application cliente + un assistant.
- Vous utilisez une [version macOS / `imsg` prise en charge](/fr/channels/imessage#requirements-and-permissions-macos) où la sonde d’API privée indique `available: true`.

## Ce que fait imsg

`imsg` est une CLI macOS locale pour Messages. OpenClaw démarre `imsg rpc` comme processus enfant et communique en JSON-RPC via stdin/stdout. Il n’y a pas de serveur HTTP, d’URL de webhook, de démon en arrière-plan, d’agent de lancement ni de port à exposer.

- Les lectures proviennent de `~/Library/Messages/chat.db` avec un handle SQLite en lecture seule.
- Les messages entrants en direct proviennent de `imsg watch` / `watch.subscribe`, qui suit les événements du système de fichiers de `chat.db` avec un repli par interrogation.
- Les envois utilisent l’automatisation de Messages.app pour les textes normaux et les envois de fichiers.
- Les actions avancées utilisent `imsg launch` pour injecter l’assistant `imsg` dans Messages.app. C’est ce qui débloque les accusés de lecture, les indicateurs de saisie, les envois enrichis, la modification, l’annulation d’envoi, la réponse en fil, les tapbacks et la gestion des groupes.
- Les builds Linux peuvent inspecter un `chat.db` copié, mais ne peuvent pas envoyer, surveiller la base de données Mac en direct ni piloter Messages.app. Pour iMessage dans OpenClaw, exécutez `imsg` sur le Mac connecté ou via un wrapper SSH vers ce Mac.

## Avant de commencer

1. Installez `imsg` sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Si `imsg chats` échoue avec `unable to open database file`, une sortie vide ou `authorization denied`, accordez l’accès complet au disque au terminal, à l’éditeur, au processus Node, au service Gateway ou au processus parent SSH qui lance `imsg`, puis rouvrez ce processus parent.

2. Vérifiez les surfaces de lecture, de surveillance, d’envoi et RPC avant de modifier la configuration OpenClaw :

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Remplacez `42` par un vrai id de chat obtenu depuis `imsg chats`. L’envoi nécessite l’autorisation Automation pour Messages.app. Si OpenClaw s’exécutera via SSH, exécutez ces commandes via le même wrapper SSH ou le même contexte utilisateur qu’OpenClaw utilisera. Si les lectures/sondes fonctionnent mais que les envois échouent avec AppleEvents `-1743`, vérifiez si Automation a été accordée à `/usr/libexec/sshd-keygen-wrapper` ; consultez [Les envois via wrapper SSH échouent avec AppleEvents -1743](/fr/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Activez le pont d’API privée lorsque vous avez besoin d’actions avancées :

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` nécessite la désactivation de SIP. L’envoi de base, l’historique et la surveillance fonctionnent sans `imsg launch` ; les actions avancées ne fonctionnent pas.

4. Après avoir ajouté une configuration `channels.imessage` activée, vérifiez le pont via OpenClaw :

   ```bash
   openclaw channels status --probe
   ```

   Vous voulez `imessage.privateApi.available: true`. Si la valeur indiquée est `false`, corrigez cela d’abord — consultez [Détection des capacités](/fr/channels/imessage#private-api-actions). `channels status --probe` ne sonde que les comptes configurés et activés.

5. Faites une copie instantanée de votre configuration :

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traduction de la configuration

iMessage et BlueBubbles partagent une grande partie de la configuration au niveau du canal. Les clés qui changent sont principalement liées au transport (serveur REST ou CLI locale). Les clés de comportement (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) gardent le même sens.

| BlueBubbles                                                | iMessage intégré                         | Notes                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Même sémantique.                                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(supprimé)_                              | Aucun serveur REST : le Plugin lance `imsg rpc` via stdio.                                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(supprimé)_                              | Aucune authentification de Webhook nécessaire.                                                                                                                                                                                                                                                                                                                                                        |
| _(implicite)_                                              | `channels.imessage.cliPath`               | Chemin vers `imsg` (`imsg` par défaut) ; utilisez un script enveloppe pour SSH.                                                                                                                                                                                                                                                                                                                       |
| _(implicite)_                                              | `channels.imessage.dbPath`                | Remplacement facultatif de `chat.db` de Messages.app ; détecté automatiquement lorsqu’il est omis.                                                                                                                                                                                                                                                                                                    |
| _(implicite)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` : nécessaire uniquement lorsque `cliPath` est une enveloppe SSH et que vous voulez récupérer les pièces jointes par SCP.                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mêmes valeurs (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Les approbations d’appairage sont conservées par identifiant, pas par jeton.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mêmes valeurs (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Identique.                                                                                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copiez ceci textuellement, y compris toute entrée joker `groups: { "*": { ... } }`.** Les valeurs par groupe `requireMention`, `tools`, `toolsBySender` sont conservées. Avec `groupPolicy: "allowlist"`, un bloc `groups` vide ou manquant supprime silencieusement tous les messages de groupe ; consultez « Piège du registre de groupes » ci-dessous.                                           |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Valeur par défaut : `true`. Avec le Plugin intégré, cela ne se déclenche que lorsque la sonde d’API privée est active.                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Même forme, **même désactivation par défaut**. Si des pièces jointes transitaient avec BlueBubbles, vous devez redéfinir ceci explicitement dans le bloc iMessage : la valeur n’est pas transférée implicitement, et les photos/médias entrants seront supprimés silencieusement sans ligne de journal `Inbound message` tant que vous ne l’aurez pas fait.                                           |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Racines locales ; mêmes règles de joker.                                                                                                                                                                                                                                                                                                                                                              |
| _(S.O.)_                                                   | `channels.imessage.remoteAttachmentRoots` | Utilisé uniquement lorsque `remoteHost` est défini pour les récupérations SCP.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Valeur par défaut : 16 Mo sur iMessage (la valeur par défaut de BlueBubbles était 8 Mo). Définissez-la explicitement si vous voulez conserver la limite inférieure.                                                                                                                                                                                                                                   |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Valeur par défaut : 4000 sur les deux.                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Même option d’activation explicite. MP uniquement : les discussions de groupe conservent l’envoi instantané par message sur les deux canaux. Élargit le délai anti-rebond entrant par défaut à 7000 ms lorsque l’option est activée sans `messages.inbound.byChannel.imessage` explicite ni `messages.inbound.debounceMs` global. Consultez [la documentation iMessage § Coalescence des MP envoyés en plusieurs fragments](/fr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(S.O.)_                                  | iMessage lit déjà les noms d’affichage des expéditeurs depuis `chat.db`.                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Bascules par action : `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                                                |

Les configurations multicomptes (`channels.bluebubbles.accounts.*`) se traduisent une pour une en `channels.imessage.accounts.*`.

## Piège du registre de groupes

Le Plugin iMessage intégré exécute **deux** portes de liste d’autorisation de groupe distinctes l’une après l’autre. Les deux doivent réussir pour qu’un message de groupe atteigne l’agent :

1. **Liste d’autorisation de l’expéditeur / de la cible de chat** (`channels.imessage.groupAllowFrom`) : vérifiée par `isAllowedIMessageSender`. Met en correspondance les messages entrants par identifiant d’expéditeur, `chat_guid`, `chat_identifier` ou `chat_id`. Même forme que BlueBubbles.
2. **Registre de groupes** (`channels.imessage.groups`) : vérifié par `resolveChannelGroupPolicy` depuis `inbound-processing.ts:199`. Avec `groupPolicy: "allowlist"`, cette porte exige soit :
   - une entrée joker `groups: { "*": { ... } }` (définit `allowAll = true`), soit
   - une entrée explicite par `chat_id` sous `groups`.

Si la porte 1 réussit mais que la porte 2 échoue, le message est supprimé. Le Plugin émet deux signaux de niveau `warn`, ce qui n’est donc plus silencieux au niveau de journalisation par défaut :

- Un `warn` unique au démarrage par compte lorsque `groupPolicy: "allowlist"` est défini mais que `channels.imessage.groups` est vide (aucun joker `"*"`, aucune entrée par `chat_id`) : déclenché avant l’arrivée du moindre message.
- Un `warn` unique par `chat_id` la première fois qu’un groupe précis est supprimé à l’exécution, en indiquant le chat_id et la clé exacte à ajouter à `groups` pour l’autoriser.

Les DM continuent de fonctionner parce qu’ils empruntent un chemin de code différent.

C’est le mode de défaillance le plus courant lors de la migration BlueBubbles → iMessage intégré : les opérateurs copient `groupAllowFrom` et `groupPolicy`, mais omettent le bloc `groups`, parce que le `groups: { "*": { "requireMention": true } }` de BlueBubbles ressemble à un réglage de mention sans rapport. En réalité, il est essentiel pour la barrière du registre.

La configuration minimale pour continuer à faire passer les messages de groupe après `groupPolicy: "allowlist"` :

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

`requireMention: true` sous `*` est sans effet nocif lorsqu’aucun motif de mention n’est configuré : le runtime définit `canDetectMention = false` et court-circuite l’abandon sur absence de mention à `inbound-processing.ts:512`. Avec des motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`), il fonctionne comme prévu.

Si les journaux du Gateway affichent `imessage: dropping group message from chat_id=<id>` ou la ligne de démarrage `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, la barrière 2 rejette le message — ajoutez le bloc `groups`.

## Pas à pas

1. Ajoutez un bloc iMessage à côté du bloc BlueBubbles existant. Gardez-le désactivé tant que le Gateway route encore le trafic BlueBubbles :

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
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

2. **Sondez avant que le trafic ne compte** — arrêtez le Gateway, activez temporairement le bloc iMessage, puis confirmez qu’iMessage est sain depuis la CLI :

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` sonde uniquement les comptes configurés et activés. Ne redémarrez pas le Gateway avec BlueBubbles et iMessage activés tous les deux, sauf si vous voulez intentionnellement que les deux moniteurs de canal s’exécutent. Si vous ne basculez pas immédiatement, remettez `channels.imessage.enabled` à `false` avant de redémarrer le Gateway. Utilisez les commandes `imsg` directes dans [Avant de commencer](#before-you-start) pour valider le Mac avant d’activer le trafic OpenClaw.

3. **Basculez.** Une fois que le compte iMessage activé est signalé sain, supprimez la configuration BlueBubbles et gardez iMessage activé :

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Redémarrez le Gateway. Le trafic iMessage entrant passe désormais par le Plugin intégré.

4. **Vérifiez les DM.** Envoyez un message direct à l’agent ; confirmez que la réponse arrive.

5. **Vérifiez les groupes séparément.** Les DM et les groupes empruntent des chemins de code différents — le succès des DM ne prouve pas que les groupes sont routés. Envoyez un message à l’agent dans une discussion de groupe appairée et confirmez que la réponse arrive. Si le groupe devient silencieux (pas de réponse de l’agent, pas d’erreur), consultez le journal du Gateway pour `imessage: dropping group message from chat_id=<id>` ou la ligne de démarrage `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — les deux apparaissent au niveau de journalisation par défaut. Si l’une des deux apparaît, votre bloc `groups` est manquant ou vide — voir « Piège du registre des groupes » ci-dessus.

6. **Vérifiez la surface d’action** — depuis un DM appairé, demandez à l’agent de réagir, modifier, annuler l’envoi, répondre, envoyer une photo et (dans un groupe) renommer le groupe / ajouter ou retirer un participant. Chaque action doit arriver nativement dans Messages.app. Si l’une d’elles renvoie « iMessage `<action>` requires the imsg private API bridge », exécutez de nouveau `imsg launch` et actualisez `channels status --probe`.

7. **Supprimez le serveur et la configuration BlueBubbles** une fois les DM, groupes et actions iMessage vérifiés. OpenClaw n’utilisera pas `channels.bluebubbles`.

## Parité des actions en un coup d’œil

| Action                                              | ancien BlueBubbles                  | iMessage intégré                                                              |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Envoyer du texte / repli SMS                        | ✅                                  | ✅                                                                            |
| Envoyer un média (photo, vidéo, fichier, voix)      | ✅                                  | ✅                                                                            |
| Réponse en fil (`reply_to_guid`)                    | ✅                                  | ✅ (ferme [#51892](https://github.com/openclaw/openclaw/issues/51892))        |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Modifier / annuler l’envoi (destinataires macOS 13+) | ✅                                  | ✅                                                                            |
| Envoyer avec effet d’écran                          | ✅                                  | ✅ (ferme une partie de [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Texte enrichi gras / italique / souligné / barré    | ✅                                  | ✅ (formatage par séries typées via attributedBody)                           |
| Renommer un groupe / définir l’icône du groupe      | ✅                                  | ✅                                                                            |
| Ajouter / retirer un participant, quitter le groupe | ✅                                  | ✅                                                                            |
| Accusés de lecture et indicateur de saisie          | ✅                                  | ✅ (conditionné par la sonde d’API privée)                                    |
| Coalescence des DM du même expéditeur               | ✅                                  | ✅ (DM uniquement ; option via `channels.imessage.coalesceSameSenderDms`)      |
| Récupération entrante après un redémarrage          | ✅ (relecture Webhook + récupération d’historique) | ✅ (automatique : relecture des manqués via since_rowid + déduplication ; fenêtre plus large en local) |

iMessage récupère les messages manqués pendant l’arrêt du Gateway : au démarrage, il relit depuis le dernier rowid distribué via `imsg watch.subscribe` `since_rowid` et déduplique par GUID, tandis qu’une barrière d’âge pour ancien backlog supprime la « bombe de backlog » du vidage Push. Cela passe par la connexion RPC `imsg`, donc cela fonctionne aussi pour les configurations `cliPath` en SSH distant ; les configurations locales disposent d’une fenêtre de récupération plus large parce qu’elles peuvent lire `chat.db`. Voir [Récupération entrante après un redémarrage du pont ou du Gateway](/fr/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Appairage, sessions et liaisons ACP

- **Les approbations d’appairage** sont conservées par handle. Vous n’avez pas besoin de réapprouver les expéditeurs connus — `channels.imessage.allowFrom` reconnaît les mêmes chaînes `+15555550123` / `user@example.com` que BlueBubbles utilisait.
- **Les sessions** restent limitées par agent + discussion. Les DM se replient dans la session principale de l’agent avec `session.dmScope=main` par défaut ; les sessions de groupe restent isolées par `chat_id`. Les clés de session diffèrent (`agent:<id>:imessage:group:<chat_id>` par rapport à l’équivalent BlueBubbles) — l’ancien historique de conversation sous les clés de session BlueBubbles n’est pas transféré dans les sessions iMessage.
- **Les liaisons ACP** qui référencent `match.channel: "bluebubbles"` doivent être mises à jour vers `"imessage"`. Les formes de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle nu) sont identiques.

## Aucun canal de retour arrière

Il n’existe aucun runtime BlueBubbles pris en charge vers lequel revenir. Si la vérification iMessage échoue, définissez `channels.imessage.enabled: false`, redémarrez le Gateway, corrigez le blocage `imsg`, puis réessayez la bascule.

Le cache de réponses vit dans l’état Plugin SQLite. `openclaw doctor --fix` importe et archive l’ancien sidecar `imessage/reply-cache.jsonl` lorsqu’il est présent.

## Liens associés

- [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) — annonce courte et résumé pour opérateurs.
- [iMessage](/fr/channels/imessage) — référence complète du canal iMessage, y compris la configuration `imsg launch` et la détection des capacités.
- `/channels/bluebubbles` — URL héritée qui redirige vers ce guide de migration.
- [Appairage](/fr/channels/pairing) — authentification des DM et flux d’appairage.
- [Routage des canaux](/fr/channels/channel-routing) — comment le Gateway choisit un canal pour les réponses sortantes.
