---
read_when:
    - Vous utilisiez l’ancien canal BlueBubbles et devez migrer vers iMessage
    - Vous choisissez la configuration iMessage prise en charge par OpenClaw
    - Vous avez besoin d’une brève explication sur la suppression de BlueBubbles
summary: La prise en charge de BlueBubbles a été supprimée d’OpenClaw. Utilisez le plugin iMessage intégré avec imsg pour les nouvelles configurations iMessage et celles ayant fait l’objet d’une migration.
title: Suppression de BlueBubbles et parcours iMessage avec imsg
x-i18n:
    generated_at: "2026-07-12T02:19:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Suppression de BlueBubbles et utilisation d’iMessage via imsg

OpenClaw n’intègre plus le canal BlueBubbles. La prise en charge d’iMessage passe par le Plugin `imessage` inclus : le Gateway lance [`imsg`](https://github.com/steipete/imsg) en tant que processus enfant, localement ou par l’intermédiaire d’un wrapper SSH, et communique en JSON-RPC via stdin/stdout. Aucun serveur, aucun Webhook, aucun port.

Si votre configuration contient encore `channels.bluebubbles`, migrez-la vers `channels.imessage`. L’ancienne URL de documentation `/channels/bluebubbles` redirige vers [Migration depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles), qui contient la table complète de conversion de la configuration et la liste de vérification pour la transition.

## Modifications apportées

- Le parcours iMessage pris en charge ne comporte aucun serveur HTTP BlueBubbles, aucune route Webhook, aucun mot de passe REST ni aucun environnement d’exécution du Plugin BlueBubbles.
- OpenClaw lit et surveille Messages au moyen d’`imsg` sur le Mac où la session Messages.app est ouverte.
- Les fonctions de base d’envoi, de réception, d’historique et de gestion des médias utilisent les interfaces `imsg` habituelles et les autorisations macOS.
- Les actions avancées (réponses dans un fil, réactions Tapback, modification, annulation de l’envoi, effets, accusés de lecture, indicateurs de saisie et gestion des groupes) nécessitent le pont d’API privée : exécutez `imsg launch`, ce qui exige la désactivation de SIP.
- Les Gateway Linux et Windows peuvent toujours utiliser iMessage en faisant pointer `channels.imessage.cliPath` vers un wrapper SSH qui exécute `imsg` sur le Mac connecté.

## Procédure à suivre

1. Installez et vérifiez `imsg` sur le Mac exécutant Messages :

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Accordez les autorisations d’accès complet au disque et d’automatisation au contexte de processus qui exécute `imsg` et OpenClaw.

3. Convertissez l’ancienne configuration :

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Redémarrez le Gateway et vérifiez son état :

   ```bash
   openclaw channels status --probe
   ```

5. Testez les messages privés, les groupes, les pièces jointes et toutes les actions d’API privée dont vous dépendez avant de supprimer votre ancien serveur BlueBubbles.

## Notes de migration

- `channels.bluebubbles.serverUrl` et `channels.bluebubbles.password` n’ont aucun équivalent pour iMessage : aucun serveur ne doit être contacté ni authentifié.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` et `actions.*` conservent leur signification sous `channels.imessage`.
- `channels.imessage.includeAttachments` reste désactivé par défaut. Activez-le explicitement si vous souhaitez que les photos, mémos vocaux, vidéos ou fichiers entrants parviennent à l’agent.
- Avec `groupPolicy: "allowlist"`, copiez l’ancien bloc `groups`, y compris toute entrée générique `"*"`. Les listes d’autorisation des expéditeurs de groupe et le registre des groupes constituent des contrôles distincts : un bloc `groups` contenant des entrées, mais sans `chat_id` correspondant (ni entrée `"*"`), entraîne l’abandon du message lors de l’exécution, tandis qu’un bloc `groups` vide consigne un avertissement au démarrage, même si le filtrage des expéditeurs laisse toujours passer les messages.
- Les liaisons ACP comportant `match.channel: "bluebubbles"` doivent être remplacées par `"imessage"`.
- Les anciennes clés de session BlueBubbles ne deviennent pas des clés de session iMessage. Les approbations d’association reposent sur les identifiants des expéditeurs ; les entrées `allowFrom` copiées continuent donc de fonctionner, mais l’historique des conversations associé aux clés de session BlueBubbles n’est pas transféré.

## Voir aussi

- [Migration depuis BlueBubbles](/fr/channels/imessage-from-bluebubbles)
- [iMessage](/fr/channels/imessage)
- [Référence de configuration – iMessage](/fr/gateway/config-channels#imessage)
