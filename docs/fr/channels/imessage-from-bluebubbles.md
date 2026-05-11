---
read_when:
    - Planifier une migration de BlueBubbles vers le Plugin iMessage intégré
    - Traduction des clés de configuration BlueBubbles en équivalents iMessage
    - Vérification d’imsg avant l’activation du plugin iMessage
summary: Migrez les anciennes configurations BlueBubbles vers le Plugin iMessage intégré sans perdre l’appairage, les listes d’autorisation ni les liaisons de groupes.
title: Migrer depuis BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Le Plugin `imessage` fourni accède désormais à la même surface d’API privée que BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, gestion des groupes, pièces jointes) en pilotant [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC. Si vous exécutez déjà un Mac avec `imsg` installé, vous pouvez supprimer le serveur BlueBubbles et laisser le Plugin communiquer directement avec Messages.app.

La prise en charge de BlueBubbles a été supprimée. OpenClaw prend en charge iMessage uniquement via `imsg`. Ce guide sert à migrer les anciennes configurations `channels.bluebubbles` vers `channels.imessage`; aucun autre chemin de migration n’est pris en charge.

<Note>
Pour l’annonce courte et le résumé opérateur, consultez [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage).
</Note>

## Liste de contrôle de migration

Utilisez cette liste de contrôle lorsque vous connaissez déjà votre ancienne configuration BlueBubbles et souhaitez le chemin sûr le plus court :

1. Vérifiez `imsg` directement sur le Mac qui exécute Messages.app (`imsg chats`, `imsg history`, `imsg send` et `imsg rpc --help`).
2. Copiez les clés de comportement de `channels.bluebubbles` vers `channels.imessage` : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` et `actions`.
3. Supprimez les clés de transport qui n’existent plus : `serverUrl`, `password`, les URL de Webhook et la configuration du serveur BlueBubbles.
4. Si le Gateway ne s’exécute pas sur le Mac Messages, définissez `channels.imessage.cliPath` sur un wrapper SSH et définissez `remoteHost` pour les récupérations de pièces jointes distantes.
5. Avec le Gateway arrêté, activez `channels.imessage`, puis exécutez `openclaw channels status --probe --channel imessage`.
6. Testez un DM, un groupe autorisé, les pièces jointes si elles sont activées, et chaque action d’API privée que vous attendez de l’agent.
7. Supprimez le serveur BlueBubbles et l’ancienne configuration `channels.bluebubbles` après vérification du chemin iMessage.

## Quand cette migration est pertinente

- Vous exécutez déjà `imsg` sur le même Mac (ou un Mac accessible via SSH) où Messages.app est connecté.
- Vous voulez un composant en moins — pas de serveur BlueBubbles distinct, pas de point de terminaison REST à authentifier, pas de câblage de Webhook. Un seul binaire CLI au lieu d’un serveur + application cliente + assistant.
- Vous utilisez une [version macOS / `imsg` prise en charge](/fr/channels/imessage#requirements-and-permissions-macos) où la sonde d’API privée indique `available: true`.

## Ce que fait imsg

`imsg` est une CLI macOS locale pour Messages. OpenClaw lance `imsg rpc` comme processus enfant et communique en JSON-RPC via stdin/stdout. Il n’y a aucun serveur HTTP, URL de Webhook, démon en arrière-plan, agent launchd ni port à exposer.

- Les lectures proviennent de `~/Library/Messages/chat.db` avec un handle SQLite en lecture seule.
- Les messages entrants en direct proviennent de `imsg watch` / `watch.subscribe`, qui suit les événements du système de fichiers de `chat.db` avec une solution de repli par interrogation.
- Les envois utilisent l’automatisation de Messages.app pour les envois normaux de texte et de fichiers.
- Les actions avancées utilisent `imsg launch` pour injecter l’assistant `imsg` dans Messages.app. C’est ce qui débloque les accusés de lecture, les indicateurs de saisie, les envois enrichis, la modification, l’annulation d’envoi, les réponses en fil, les tapbacks et la gestion des groupes.
- Les builds Linux peuvent inspecter un `chat.db` copié, mais ne peuvent pas envoyer, surveiller la base de données Mac en direct ni piloter Messages.app. Pour OpenClaw iMessage, exécutez `imsg` sur le Mac connecté ou via un wrapper SSH vers ce Mac.

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

   Remplacez `42` par un véritable identifiant de discussion issu de `imsg chats`. L’envoi nécessite l’autorisation d’automatisation pour Messages.app. Si OpenClaw doit s’exécuter via SSH, lancez ces commandes via le même wrapper SSH ou le même contexte utilisateur qu’OpenClaw utilisera.

3. Activez le pont d’API privée lorsque vous avez besoin d’actions avancées :

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` nécessite la désactivation de SIP. L’envoi de base, l’historique et la surveillance fonctionnent sans `imsg launch`; les actions avancées non.

4. Après avoir ajouté une configuration `channels.imessage` activée, vérifiez le pont via OpenClaw :

   ```bash
   openclaw channels status --probe
   ```

   Vous voulez `imessage.privateApi.available: true`. S’il indique `false`, corrigez cela d’abord — consultez [Détection des capacités](/fr/channels/imessage#private-api-actions). `channels status --probe` ne sonde que les comptes configurés et activés.

5. Prenez un instantané de votre configuration :

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Traduction de configuration

iMessage et BlueBubbles partagent beaucoup de configuration au niveau du canal. Les clés qui changent concernent surtout le transport (serveur REST vs CLI locale). Les clés de comportement (`dmPolicy`, `groupPolicy`, `allowFrom`, etc.) conservent la même signification.

| BlueBubbles                                                | iMessage groupé                           | Notes                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Même sémantique.                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(supprimé)_                              | Pas de serveur REST : le plugin lance `imsg rpc` via stdio.                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.password`                            | _(supprimé)_                              | Aucune authentification Webhook nécessaire.                                                                                                                                                                                                                                                                                                         |
| _(implicite)_                                              | `channels.imessage.cliPath`               | Chemin vers `imsg` (par défaut `imsg`) ; utilisez un script wrapper pour SSH.                                                                                                                                                                                                                                                                       |
| _(implicite)_                                              | `channels.imessage.dbPath`                | Remplacement facultatif de `chat.db` de Messages.app ; détecté automatiquement s’il est omis.                                                                                                                                                                                                                                                       |
| _(implicite)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` : nécessaire uniquement lorsque `cliPath` est un wrapper SSH et que vous voulez récupérer les pièces jointes par SCP.                                                                                                                                                                                                          |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mêmes valeurs (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Les approbations d’appairage sont reprises par identifiant, pas par jeton.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mêmes valeurs (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Identique.                                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Copiez ceci tel quel, y compris toute entrée générique `groups: { "*": { ... } }`.** Les paramètres par groupe `requireMention`, `tools`, `toolsBySender` sont repris. Avec `groupPolicy: "allowlist"`, un bloc `groups` vide ou manquant ignore silencieusement tous les messages de groupe — voir « Piège du registre des groupes » ci-dessous. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Par défaut `true`. Avec le plugin groupé, cela ne se déclenche que lorsque la sonde d’API privée est active.                                                                                                                                                                                                                                        |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Même forme, **toujours désactivé par défaut**. Si les pièces jointes circulaient sur BlueBubbles, vous devez le redéfinir explicitement dans le bloc iMessage : il n’est pas repris implicitement, et les photos/médias entrants seront ignorés silencieusement sans ligne de journal `Inbound message` jusqu’à ce que vous le fassiez.               |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Racines locales ; mêmes règles de caractères génériques.                                                                                                                                                                                                                                                                                            |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Utilisé uniquement lorsque `remoteHost` est défini pour les récupérations SCP.                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Par défaut 16 Mo sur iMessage (la valeur par défaut de BlueBubbles était 8 Mo). Définissez-la explicitement si vous voulez conserver la limite plus basse.                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Par défaut 4000 sur les deux.                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Même option d’activation. DM uniquement : les discussions de groupe conservent l’envoi instantané message par message sur les deux canaux. Élargit le debounce entrant par défaut à 2500 ms lorsqu’il est activé sans `messages.inbound.byChannel.imessage` explicite. Voir [docs iMessage § Coalescing split-send DMs](/fr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage lit déjà les noms d’affichage des expéditeurs depuis `chat.db`.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Options par action : `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                               |

Les configurations multi-comptes (`channels.bluebubbles.accounts.*`) se traduisent une pour une vers `channels.imessage.accounts.*`.

## Piège du registre des groupes

Le plugin iMessage groupé exécute **deux** contrôles de liste d’autorisation de groupe distincts l’un après l’autre. Les deux doivent réussir pour qu’un message de groupe atteigne l’agent :

1. **Liste d’autorisation de l’expéditeur / cible de discussion** (`channels.imessage.groupAllowFrom`) — vérifiée par `isAllowedIMessageSender`. Correspond aux messages entrants par identifiant d’expéditeur, `chat_guid`, `chat_identifier` ou `chat_id`. Même forme que BlueBubbles.
2. **Registre des groupes** (`channels.imessage.groups`) — vérifié par `resolveChannelGroupPolicy` depuis `inbound-processing.ts:199`. Avec `groupPolicy: "allowlist"`, ce contrôle exige soit :
   - une entrée générique `groups: { "*": { ... } }` (définit `allowAll = true`), soit
   - une entrée explicite par `chat_id` sous `groups`.

Si le contrôle 1 réussit mais que le contrôle 2 échoue, le message est ignoré. Le plugin émet deux signaux de niveau `warn`, ce qui fait que ce n’est plus silencieux au niveau de journalisation par défaut :

- Un `warn` unique au démarrage par compte lorsque `groupPolicy: "allowlist"` est défini mais que `channels.imessage.groups` est vide (pas de caractère générique `"*"`, pas d’entrées par `chat_id`) — déclenché avant l’arrivée du moindre message.
- Un `warn` unique par `chat_id` la première fois qu’un groupe précis est ignoré à l’exécution, indiquant le chat_id et la clé exacte à ajouter à `groups` pour l’autoriser.

Les DM continuent de fonctionner, car ils empruntent un chemin de code différent.

C’est le mode d’échec le plus courant lors d’une migration BlueBubbles → iMessage groupé : les opérateurs copient `groupAllowFrom` et `groupPolicy`, mais omettent le bloc `groups`, parce que `groups: { "*": { "requireMention": true } }` de BlueBubbles ressemble à un paramètre de mention sans rapport. Il est en réalité indispensable au contrôle du registre.

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

`requireMention: true` sous `*` est sans effet néfaste lorsqu’aucun motif de mention n’est configuré : le runtime définit `canDetectMention = false` et court-circuite l’abandon de mention à `inbound-processing.ts:512`. Avec des motifs de mention configurés (`agents.list[].groupChat.mentionPatterns`), cela fonctionne comme prévu.

Si les journaux du Gateway indiquent `imessage: dropping group message from chat_id=<id>` ou la ligne de démarrage `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, le filtre 2 bloque le message — ajoutez le bloc `groups`.

## Étape par étape

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

2. **Sondez avant que le trafic ne compte** — arrêtez le Gateway, activez temporairement le bloc iMessage et confirmez qu’iMessage est signalé comme sain depuis la CLI :

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` ne sonde que les comptes configurés et activés. Ne redémarrez pas le Gateway avec BlueBubbles et iMessage activés en même temps, sauf si vous voulez intentionnellement faire fonctionner les deux moniteurs de canal. Si vous ne basculez pas immédiatement, remettez `channels.imessage.enabled` à `false` avant de redémarrer le Gateway. Utilisez les commandes `imsg` directes dans [Avant de commencer](#before-you-start) pour valider le Mac avant d’activer le trafic OpenClaw.

3. **Basculez.** Une fois que le compte iMessage activé est signalé comme sain, supprimez la configuration BlueBubbles et gardez iMessage activé :

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Redémarrez le Gateway. Le trafic iMessage entrant passe désormais par le Plugin groupé.

4. **Vérifiez les messages directs.** Envoyez un message direct à l’agent ; confirmez que la réponse arrive.

5. **Vérifiez les groupes séparément.** Les messages directs et les groupes empruntent des chemins de code différents — la réussite d’un message direct ne prouve pas que les groupes sont routés. Envoyez un message à l’agent dans une conversation de groupe associée et confirmez que la réponse arrive. Si le groupe devient silencieux (aucune réponse de l’agent, aucune erreur), vérifiez dans le journal du Gateway la présence de `imessage: dropping group message from chat_id=<id>` ou de la ligne de démarrage `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — les deux se déclenchent au niveau de journalisation par défaut. Si l’une des deux apparaît, votre bloc `groups` est manquant ou vide — consultez « Piège du registre de groupes » ci-dessus.

6. **Vérifiez la surface d’actions** — depuis un message direct associé, demandez à l’agent de réagir, modifier, annuler l’envoi, répondre, envoyer une photo et (dans un groupe) renommer le groupe / ajouter ou supprimer un participant. Chaque action doit arriver nativement dans Messages.app. Si l’une d’elles génère « iMessage `<action>` requires the imsg private API bridge », exécutez de nouveau `imsg launch` et actualisez `channels status --probe`.

7. **Supprimez le serveur et la configuration BlueBubbles** une fois les messages directs, les groupes et les actions iMessage vérifiés. OpenClaw n’utilisera pas `channels.bluebubbles`.

## Parité des actions en un coup d’œil

| Action                                                     | BlueBubbles hérité                  | iMessage groupé                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Envoyer du texte / repli SMS                               | ✅                                  | ✅                                                                                                                      |
| Envoyer des médias (photo, vidéo, fichier, voix)           | ✅                                  | ✅                                                                                                                      |
| Réponse en fil (`reply_to_guid`)                           | ✅                                  | ✅ (ferme [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Modifier / annuler l’envoi (destinataires macOS 13+)       | ✅                                  | ✅                                                                                                                      |
| Envoyer avec effet d’écran                                 | ✅                                  | ✅ (ferme une partie de [#9394](https://github.com/openclaw/openclaw/issues/9394))                                     |
| Texte enrichi gras / italique / souligné / barré           | ✅                                  | ✅ (formatage par séries typées via attributedBody)                                                                     |
| Renommer le groupe / définir l’icône du groupe             | ✅                                  | ✅                                                                                                                      |
| Ajouter / supprimer un participant, quitter le groupe      | ✅                                  | ✅                                                                                                                      |
| Confirmations de lecture et indicateur de saisie           | ✅                                  | ✅ (conditionné par la sonde d’API privée)                                                                              |
| Coalescence des messages directs du même expéditeur        | ✅                                  | ✅ (messages directs uniquement ; optionnel via `channels.imessage.coalesceSameSenderDms`)                              |
| Rattrapage des messages entrants reçus lorsque le Gateway est arrêté | ✅ (relecture Webhook + récupération d’historique) | ✅ (optionnel via `channels.imessage.catchup.enabled` ; ferme [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Le rattrapage iMessage est désormais disponible comme fonctionnalité optionnelle dans le Plugin groupé. Au démarrage du Gateway, si `channels.imessage.catchup.enabled` vaut `true`, le Gateway exécute un passage `chats.list` + `messages.history` par conversation sur le même client JSON-RPC que celui utilisé par `imsg watch`, rejoue chaque ligne entrante manquée via le chemin de dispatch actif (listes d’autorisation, politique de groupe, anti-rebond, cache d’écho) et persiste un curseur par compte afin que les démarrages suivants reprennent là où ils s’étaient arrêtés. Consultez [Rattraper après une indisponibilité du Gateway](/fr/channels/imessage#catching-up-after-gateway-downtime) pour les réglages.

## Association, sessions et liaisons ACP

- **Les approbations d’association** sont conservées par identifiant. Vous n’avez pas besoin de réapprouver les expéditeurs connus — `channels.imessage.allowFrom` reconnaît les mêmes chaînes `+15555550123` / `user@example.com` que BlueBubbles utilisait.
- **Les sessions** restent limitées par agent + conversation. Les messages directs se replient dans la session principale de l’agent avec `session.dmScope=main` par défaut ; les sessions de groupe restent isolées par `chat_id`. Les clés de session diffèrent (`agent:<id>:imessage:group:<chat_id>` par rapport à l’équivalent BlueBubbles) — l’ancien historique de conversation sous les clés de session BlueBubbles n’est pas transféré vers les sessions iMessage.
- **Les liaisons ACP** référençant `match.channel: "bluebubbles"` doivent être mises à jour vers `"imessage"`. Les formes de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identifiant nu) sont identiques.

## Aucun canal de retour arrière

Il n’existe aucun runtime BlueBubbles pris en charge vers lequel revenir. Si la vérification iMessage échoue, définissez `channels.imessage.enabled: false`, redémarrez le Gateway, corrigez le blocage `imsg`, puis réessayez la bascule.

Le cache de réponse se trouve dans `~/.openclaw/state/imessage/reply-cache.jsonl` (mode `0600`, répertoire parent `0700`). Vous pouvez le supprimer sans risque si vous voulez repartir de zéro.

## Liens associés

- [Suppression de BlueBubbles et chemin iMessage imsg](/fr/announcements/bluebubbles-imessage) — annonce courte et résumé opérateur.
- [iMessage](/fr/channels/imessage) — référence complète du canal iMessage, y compris la configuration `imsg launch` et la détection des capacités.
- `/channels/bluebubbles` — ancienne URL qui redirige vers ce guide de migration.
- [Association](/fr/channels/pairing) — authentification des messages directs et flux d’association.
- [Routage des canaux](/fr/channels/channel-routing) — comment le Gateway choisit un canal pour les réponses sortantes.
