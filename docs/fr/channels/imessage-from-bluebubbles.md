---
read_when:
    - Planifier une migration de BlueBubbles vers le plugin iMessage intégré
    - Traduction des clés de configuration BlueBubbles en équivalents iMessage
    - Vérification d’`imsg` avant l’activation du plugin iMessage
summary: 'Migrez les anciennes configurations BlueBubbles vers le plugin iMessage intégré : mappage des clés, contrôles des listes d’autorisation de groupes et vérification de la transition.'
title: En provenance de BlueBubbles
x-i18n:
    generated_at: "2026-07-12T15:02:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

La prise en charge de BlueBubbles a été supprimée. OpenClaw prend en charge iMessage uniquement par l’intermédiaire du plugin `imessage` inclus, qui pilote [`steipete/imsg`](https://github.com/steipete/imsg) via JSON-RPC et accède à la même surface d’API privée que BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, sondages natifs, gestion des groupes, pièces jointes). Un seul binaire CLI remplace le serveur BlueBubbles, l’application cliente et l’infrastructure de Webhook : aucun point de terminaison REST, aucune authentification de Webhook.

Ce guide explique comment migrer les anciennes configurations `channels.bluebubbles` vers `channels.imessage`. Il n’existe aucune autre voie de migration prise en charge. Dans la version actuelle d’OpenClaw, un bloc `channels.bluebubbles` résiduel est inerte : aucun composant d’exécution ne le lit.

<Note>
Pour consulter l’annonce courte et le résumé destiné aux opérateurs, voir [Suppression de BlueBubbles et utilisation d’imsg pour iMessage](/fr/announcements/bluebubbles-imessage).
</Note>

## Liste de contrôle de la migration

La procédure sûre la plus courte lorsque vous connaissez déjà votre ancienne configuration BlueBubbles :

1. Vérifiez directement `imsg` sur le Mac qui exécute Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Copiez les clés de comportement de `channels.bluebubbles` vers `channels.imessage` : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` et `actions`.
3. Supprimez les clés de transport qui n’existent plus : `serverUrl`, `password`, les URL de Webhook et la configuration du serveur BlueBubbles.
4. Si le Gateway ne s’exécute pas sur le Mac hébergeant Messages, définissez `channels.imessage.cliPath` sur un wrapper SSH et définissez `remoteHost` pour la récupération à distance des pièces jointes.
5. Activez `channels.imessage`, redémarrez le Gateway, puis exécutez `openclaw channels status --probe --channel imessage`.
6. Testez un message privé, un groupe autorisé, les pièces jointes si elles sont activées et chaque action d’API privée que l’agent doit pouvoir utiliser.
7. Supprimez le serveur BlueBubbles et l’ancienne configuration `channels.bluebubbles` après avoir vérifié le fonctionnement du chemin iMessage.

## Fonctionnement d’imsg

`imsg` est une CLI macOS locale pour Messages. OpenClaw démarre `imsg rpc` en tant que processus enfant et communique en JSON-RPC via stdin/stdout. Il n’y a aucun serveur HTTP, aucune URL de Webhook, aucun démon en arrière-plan, aucun agent de lancement ni aucun port à exposer.

- Les lectures proviennent de `~/Library/Messages/chat.db` au moyen d’un accès SQLite en lecture seule.
- Les messages entrants en direct proviennent de `imsg watch` / `watch.subscribe`, qui suit les événements du système de fichiers de `chat.db` avec une interrogation périodique de secours.
- Les envois utilisent l’automatisation de Messages.app pour les envois ordinaires de texte et de fichiers.
- Les actions avancées utilisent `imsg launch` pour injecter l’assistant `imsg` dans Messages.app. Cela permet d’activer les accusés de lecture, les indicateurs de saisie, les envois enrichis, la modification, l’annulation d’envoi, les réponses dans un fil, les réactions, les sondages et la gestion des groupes.
- Les versions Linux peuvent examiner une copie de `chat.db`, mais ne peuvent ni envoyer de messages, ni surveiller la base de données active du Mac, ni piloter Messages.app. Pour iMessage avec OpenClaw, exécutez `imsg` sur le Mac connecté ou par l’intermédiaire d’un wrapper SSH vers ce Mac.

## Avant de commencer

1. Installez `imsg` sur le Mac qui exécute Messages.app :

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Pour la configuration locale habituelle, l’assistant de configuration d’OpenClaw peut proposer, après confirmation de l’utilisateur, d’installer ou de mettre à jour `imsg` avec Homebrew sur le Mac connecté à Messages. Les configurations manuelles et les topologies avec wrapper SSH restent gérées par l’opérateur : répétez la mise à jour Homebrew dans le même contexte utilisateur local ou distant que celui qui exécutera `imsg`. Si `imsg chats` échoue avec `unable to open database file`, ne produit aucune sortie ou renvoie `authorization denied`, accordez l’accès complet au disque au terminal, à l’éditeur, au processus Node, au service Gateway ou au processus parent SSH qui lance `imsg`, puis rouvrez ce processus parent.

2. Vérifiez les surfaces de lecture, de surveillance, d’envoi et de RPC avant de modifier la configuration d’OpenClaw :

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "Test OpenClaw imsg"
   imsg rpc --help
   ```

   Remplacez `42` par un identifiant de conversation réel fourni par `imsg chats`. L’envoi nécessite l’autorisation d’automatisation pour Messages.app. Si OpenClaw doit s’exécuter via SSH, exécutez ces commandes par l’intermédiaire du même wrapper SSH ou dans le même contexte utilisateur qu’OpenClaw. Si les lectures fonctionnent, mais que les envois échouent avec l’erreur AppleEvents `-1743`, vérifiez si l’autorisation d’automatisation a été accordée à `/usr/libexec/sshd-keygen-wrapper` ; voir [Échec des envois via un wrapper SSH avec l’erreur AppleEvents -1743](/fr/channels/imessage#requirements-and-permissions-macos).

3. Activez le pont d’API privée. Son utilisation est vivement recommandée pour iMessage avec OpenClaw, car les réponses, les réactions, les effets, les sondages, les réponses aux pièces jointes et les actions de groupe en dépendent :

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` nécessite la désactivation de SIP (et, sur les versions modernes de macOS, l’assouplissement de la validation des bibliothèques — voir [Activation de l’API privée d’imsg](/fr/channels/imessage#enabling-the-imsg-private-api)). L’envoi de base, l’historique et la surveillance fonctionnent sans `imsg launch`, mais pas l’ensemble complet des actions iMessage d’OpenClaw.

4. Après avoir activé `channels.imessage` et démarré le Gateway, vérifiez le pont par l’intermédiaire d’OpenClaw :

   ```bash
   openclaw channels status --probe
   ```

   Le compte iMessage doit indiquer `works` ; avec `--json`, la charge utile de la sonde comprend `privateApi.available: true`. Si elle indique `false`, corrigez d’abord ce problème — voir [Détection des fonctionnalités](/fr/channels/imessage#private-api-actions). La vérification nécessite un Gateway accessible (sinon la CLI se rabat sur une sortie fondée uniquement sur la configuration) et porte uniquement sur les comptes configurés et activés.

5. Créez un instantané de votre configuration :

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Traduction de la configuration

iMessage et BlueBubbles partagent la plupart des clés de comportement au niveau du canal. Les différences concernent le transport (serveur REST ou CLI locale) et le format des clés du registre des groupes.

| BlueBubbles                                                | iMessage intégré                          | Remarques                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Même sémantique (valeur par défaut `true` dès que le bloc existe).                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.serverUrl`                           | _(supprimé)_                              | Aucun serveur REST — le plugin lance `imsg rpc` via stdio.                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(supprimé)_                              | Aucune authentification de Webhook nécessaire.                                                                                                                                                                                                                                                                        |
| _(implicite)_                                              | `channels.imessage.cliPath`               | Chemin vers `imsg` (valeur par défaut `imsg`) ; utilisez un script enveloppe pour SSH.                                                                                                                                                                                                                                 |
| _(implicite)_                                              | `channels.imessage.dbPath`                | Remplacement facultatif du chemin de `chat.db` de Messages.app ; détecté automatiquement s'il est omis.                                                                                                                                                                                                                |
| _(implicite)_                                              | `channels.imessage.remoteHost`            | `host` ou `user@host` — nécessaire uniquement lorsque `cliPath` est un script enveloppe SSH et que vous souhaitez récupérer les pièces jointes par SCP.                                                                                                                                                                |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Mêmes valeurs (`pairing` / `allowlist` / `open` / `disabled`) ; valeur par défaut `pairing`.                                                                                                                                                                                                                           |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Mêmes formats d'identifiant (`+15555550123`, `user@example.com`). Les approbations du magasin d'association ne sont pas transférées — voir ci-dessous.                                                                                                                                                                  |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Mêmes valeurs (`allowlist` / `open` / `disabled`) ; valeur par défaut `allowlist`.                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Identique. Lorsque cette option n'est pas définie, iMessage utilise `allowFrom` comme solution de repli ; un `groupAllowFrom: []` explicitement vide bloque tous les groupes avec `groupPolicy: "allowlist"`.                                                                                                             |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Copiez littéralement l'entrée générique `"*"` ; remplacez les clés des entrées propres à chaque groupe par le `chat_id` iMessage numérique — voir « Piège du registre de groupes ». `requireMention`, `tools`, `toolsBySender` et `systemPrompt` sont conservés.                                                          |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Valeur par défaut `true`. Avec le plugin intégré, cette action ne se déclenche que lorsque la sonde de l'API privée est opérationnelle.                                                                                                                                                                                 |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Même structure, également désactivée par défaut. Si les pièces jointes étaient transmises avec BlueBubbles, définissez cette option explicitement — les photos et médias entrants sont ignorés silencieusement (sans ligne de journal `Inbound message`) jusqu'à ce que vous le fassiez.                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Racines locales ; mêmes règles de caractères génériques.                                                                                                                                                                                                                                                              |
| _(S/O)_                                                    | `channels.imessage.remoteAttachmentRoots` | Utilisé uniquement lorsque `remoteHost` est défini pour les récupérations par SCP.                                                                                                                                                                                                                                     |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Valeur par défaut de 16 MB sur iMessage (celle de BlueBubbles était de 8 MB). Définissez-la explicitement pour conserver la limite inférieure.                                                                                                                                                                         |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Valeur par défaut de 4000 pour les deux.                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Même activation explicite. Uniquement pour les messages privés — les groupes conservent une distribution par message. Étend la temporisation antirebond entrante par défaut à 7000 ms, sauf si `messages.inbound.byChannel.imessage` ou une valeur globale `messages.inbound.debounceMs` est définie. Voir [Regroupement des messages privés envoyés séparément](/fr/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(S/O)_                                   | `imsg` expose déjà les noms d'affichage des expéditeurs depuis `chat.db`.                                                                                                                                                                                                                                              |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Mêmes bascules par action (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`), avec la nouvelle action `polls`. Toutes sont activées par défaut ; les actions de l'API privée nécessitent toujours le pont. |

Les configurations multicomptes (`channels.bluebubbles.accounts.*`) se transposent directement en `channels.imessage.accounts.*`.

## Piège du registre de groupes

Le plugin iMessage intégré applique successivement deux contrôles aux groupes. Pour atteindre l'agent, un message de groupe doit franchir les deux :

1. **Liste d'autorisation des expéditeurs / cibles de discussion** (`channels.imessage.groupAllowFrom`) — correspond à l'identifiant de l'expéditeur ou à la cible de la discussion (entrées `chat_id:`, `chat_guid:`, `chat_identifier:`). Lorsque `groupAllowFrom` n'est pas défini, ce contrôle utilise `allowFrom` comme solution de repli ; un `groupAllowFrom: []` explicite désactive cette solution de repli et rejette tous les messages de groupe avec `groupPolicy: "allowlist"`.
2. **Registre de groupes** (`channels.imessage.groups`) — indexé par le `chat_id` iMessage numérique :
   - Aucun bloc `groups` (ou bloc vide) : les groupes franchissent ce contrôle tant que le contrôle 1 dispose d'une liste d'autorisation effective non vide pour les expéditeurs ; le filtrage des expéditeurs régit l'accès et aucun avertissement de rejet global n'est émis au démarrage.
   - `groups` contient des entrées, mais pas `"*"` : seules les clés `chat_id` répertoriées sont autorisées. Le fait de répertorier un groupe transforme le registre en liste d'autorisation, même avec `groupPolicy: "open"`.
   - `groups: { "*": { ... } }` : tous les groupes franchissent ce contrôle.

Le piège de la migration : BlueBubbles indexait les entrées `groups` par GUID ou identifiant de discussion, tandis que le registre iMessage utilise le `chat_id` numérique. La copie littérale des entrées propres aux groupes crée un registre non vide dont les clés ne correspondent jamais ; tous les messages de groupe sont donc rejetés au contrôle 2. Copiez littéralement l'entrée générique `"*"` ; remplacez les clés des entrées propres à un groupe par les valeurs `chat_id` obtenues avec `imsg chats`.

Les deux chemins de rejet sont visibles au niveau de journalisation par défaut dans des lignes `warn` :

- Une fois par compte au démarrage, lorsque `groupPolicy: "allowlist"` est défini et que la liste d'autorisation effective des expéditeurs de groupes est vide : `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Définissez `groupAllowFrom` (ou `allowFrom`) pour autoriser des expéditeurs ; l'ajout de `groups` seul ne satisfait pas le contrôle des expéditeurs.
- Une fois par `chat_id` à l'exécution, lorsque le registre rejette un groupe : `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, en indiquant la clé exacte à ajouter.

Les messages privés continuent de fonctionner dans les deux cas — ils suivent un chemin de code différent ; leur bon fonctionnement ne prouve donc pas que le routage des groupes fonctionne.

Configuration minimale limitée aux expéditeurs avec `groupPolicy: "allowlist"` :

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Cette configuration autorise les expéditeurs configurés dans tous les groupes. Ajoutez des entrées `groups` pour limiter les discussions autorisées ou définir des options propres à chaque discussion, comme `requireMention` ; copiez littéralement l'entrée `"*"` de BlueBubbles, mais remplacez les clés des entrées spécifiques par des valeurs `chat_id` iMessage numériques.

## Étape par étape

1. Traduisez la configuration. Laissez le nouveau bloc désactivé pendant vos modifications ; le bloc `channels.bluebubbles` existant est ignoré par la version actuelle d’OpenClaw et peut rester à côté à titre de référence :

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // passez à true lorsque vous êtes prêt à effectuer la migration
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copiez depuis bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copiez depuis bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // le caractère générique est copié tel quel ; remplacez la clé des entrées propres à chaque conversation par chat_id
         // les actions sont activées par défaut ; définissez individuellement les options sur false pour les désactiver
       },
     },
   }
   ```

2. **Effectuez la migration et lancez une sonde.** Définissez `channels.imessage.enabled: true`, redémarrez le Gateway et vérifiez que le canal est signalé comme opérationnel :

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # « works » est attendu ; --json affiche privateApi.available: true
   ```

   La sonde nécessite un Gateway accessible et ne teste que les comptes configurés et activés. Utilisez les commandes `imsg` directes de la section [Avant de commencer](#before-you-start) pour valider le Mac lui-même.

3. **Vérifiez les messages privés.** Envoyez un message privé à l’agent et vérifiez que la réponse arrive.

4. **Vérifiez les groupes séparément.** Les messages privés et les groupes empruntent des chemins de code différents : le bon fonctionnement des messages privés ne prouve pas que le routage des groupes fonctionne. Envoyez un message dans une conversation de groupe autorisée et vérifiez que la réponse arrive. Si le groupe reste silencieux (aucune réponse de l’agent, aucune erreur), recherchez dans le journal du Gateway les deux lignes `warn` de la section « Piège du registre de groupes » ci-dessus. L’avertissement au démarrage signifie que la liste d’expéditeurs effectivement autorisés est vide ; un avertissement propre à un `chat_id` signifie qu’un registre `groups` renseigné ne contient pas cette conversation.

5. **Vérifiez la surface d’actions.** Depuis un message privé appairé, demandez à l’agent d’ajouter une réaction, de modifier ou d’annuler l’envoi d’un message, de répondre, d’envoyer une photo et, dans un groupe, de renommer le groupe ou d’ajouter ou supprimer un participant. Chaque action doit être exécutée nativement dans Messages.app. Si une action génère l’erreur `iMessage <action> requires the imsg private API bridge`, exécutez de nouveau `imsg launch`, puis actualisez l’état avec `openclaw channels status --probe`.

6. **Supprimez le serveur BlueBubbles et le bloc `channels.bluebubbles`** une fois les messages privés, les groupes et les actions iMessage vérifiés. OpenClaw ne lit pas `channels.bluebubbles`.

## Comparaison rapide des actions

| Action                                                    | BlueBubbles historique | iMessage intégré                                                                 |
| --------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Envoyer du texte / repli vers les SMS                     | ✅                     | ✅                                                                               |
| Envoyer des médias (photo, vidéo, fichier, message vocal) | ✅                     | ✅                                                                               |
| Réponse dans un fil (`reply_to_guid`)                     | ✅                     | ✅ (résout [#51892](https://github.com/openclaw/openclaw/issues/51892))          |
| Tapback (`react`)                                         | ✅                     | ✅                                                                               |
| Modifier / annuler l’envoi (destinataires sous macOS 13+) | ✅                     | ✅                                                                               |
| Envoyer avec un effet d’écran                             | ✅                     | ✅ (résout une partie de [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Texte enrichi en gras / italique / souligné / barré       | ✅                     | ✅ (mise en forme par plages typées via attributedBody)                          |
| Sondages Messages natifs (création et vote)               | ❌                     | ✅ (`actions.polls` ; les destinataires ont besoin d’iOS/macOS 26+ pour un rendu natif) |
| Renommer le groupe / définir son icône                    | ✅                     | ✅                                                                               |
| Ajouter / supprimer un participant, quitter le groupe     | ✅                     | ✅                                                                               |
| Accusés de lecture et indicateur de saisie                | ✅                     | ✅ (conditionné par la sonde de l’API privée)                                    |
| Regroupement des messages privés d’un même expéditeur     | ✅                     | ✅ (messages privés uniquement ; activation via `channels.imessage.coalesceSameSenderDms`) |
| Récupération des messages entrants après un redémarrage   | ✅                     | ✅ (automatique : relecture `since_rowid` + déduplication par GUID ; fenêtre plus large en local) |

iMessage récupère les messages manqués pendant l’arrêt du Gateway : au démarrage, il reprend à partir du dernier rowid distribué au moyen de `since_rowid` avec `imsg watch.subscribe`, déduplique selon le GUID et utilise une limite d’âge pour les anciens messages en attente afin d’empêcher la « bombe de messages en attente » lors du vidage Push. Cette opération passe par la connexion RPC `imsg` ; elle fonctionne donc également avec les configurations `cliPath` utilisant SSH à distance. Les configurations locales bénéficient d’une fenêtre de récupération plus large, car elles peuvent lire `chat.db`. Consultez [Récupération des messages entrants après le redémarrage d’un pont ou du Gateway](/fr/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Appairage, sessions et liaisons ACP

- **Les listes d’autorisation sont conservées selon l’identifiant.** `channels.imessage.allowFrom` reconnaît les mêmes chaînes `+15555550123` / `user@example.com` que celles utilisées par BlueBubbles : copiez-les telles quelles.
- **Les approbations du magasin d’appairage ne sont pas transférées.** Le magasin d’appairage est propre à chaque canal et rien ne migre l’ancien magasin BlueBubbles. Les expéditeurs qui n’étaient approuvés que par appairage doivent s’appairer une nouvelle fois sous iMessage, à moins que vous n’ajoutiez leurs identifiants à `allowFrom`.
- **Les sessions** restent limitées à chaque combinaison d’agent et de conversation. Avec la valeur par défaut `session.dmScope=main`, les messages privés sont regroupés dans la session principale de l’agent ; les sessions de groupe restent isolées par `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). L’ancien historique des conversations associé aux clés de session BlueBubbles n’est pas transféré vers les sessions iMessage.
- **Les liaisons ACP** faisant référence à `match.channel: "bluebubbles"` doivent être remplacées par `"imessage"`. Les formats de `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, identifiant seul) sont identiques.

## Aucun canal de retour arrière

Il n’existe aucun environnement d’exécution BlueBubbles pris en charge vers lequel revenir. Si la vérification d’iMessage échoue, définissez `channels.imessage.enabled: false`, redémarrez le Gateway, corrigez le blocage lié à `imsg`, puis recommencez la migration.

Le cache des réponses réside dans l’état SQLite du Plugin. `openclaw doctor --fix` importe et archive l’ancien fichier annexe `imessage/reply-cache.jsonl` lorsqu’il est présent.

## Ressources connexes

- [Suppression de BlueBubbles et parcours iMessage avec imsg](/fr/announcements/bluebubbles-imessage) — brève annonce et résumé destiné aux opérateurs.
- [iMessage](/fr/channels/imessage) — référence complète du canal iMessage, notamment la configuration avec `imsg launch` et la détection des fonctionnalités.
- `/channels/bluebubbles` — ancienne URL qui redirige vers ce guide de migration.
- [Appairage](/fr/channels/pairing) — authentification des messages privés et processus d’appairage.
- [Routage des canaux](/fr/channels/channel-routing) — manière dont le Gateway sélectionne un canal pour les réponses sortantes.
