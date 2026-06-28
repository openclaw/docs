---
read_when:
    - Vous utilisiez l’ancien canal BlueBubbles et devez passer à iMessage
    - Vous choisissez la configuration iMessage OpenClaw prise en charge
    - Vous avez besoin d’une brève explication de la suppression de BlueBubbles
summary: La prise en charge de BlueBubbles a été supprimée d’OpenClaw. Utilisez le plugin iMessage fourni avec imsg pour les configurations iMessage nouvelles et migrées.
title: Suppression de BlueBubbles et chemin imsg pour iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Suppression de BlueBubbles et chemin iMessage imsg

OpenClaw n’embarque plus le canal BlueBubbles. La prise en charge d’iMessage passe désormais par le Plugin `imessage` inclus, qui lance [`imsg`](https://github.com/steipete/imsg) localement ou via un wrapper SSH, et communique en JSON-RPC sur stdin/stdout.

Si votre configuration contient encore `channels.bluebubbles`, migrez-la vers `channels.imessage`. L’ancienne URL de documentation `/channels/bluebubbles` redirige vers [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles), qui contient la table complète de traduction de configuration et la liste de contrôle de bascule.

## Ce qui a changé

- Il n’y a plus de serveur HTTP BlueBubbles, de route Webhook, de mot de passe REST ni d’environnement d’exécution Plugin BlueBubbles dans le chemin iMessage pris en charge par OpenClaw.
- OpenClaw lit et surveille Messages via `imsg` sur le Mac où Messages.app est connecté.
- L’envoi, la réception, l’historique et les médias de base utilisent les surfaces `imsg` normales et les autorisations macOS.
- Les actions avancées comme les réponses en fil, les tapbacks, la modification, l’annulation d’envoi, les effets, les accusés de lecture, les indicateurs de saisie et la gestion de groupe nécessitent `imsg launch` avec le pont d’API privée disponible.
- Les gateways Linux et Windows peuvent toujours utiliser iMessage en définissant `channels.imessage.cliPath` sur un wrapper SSH qui exécute `imsg` sur le Mac connecté.

## Que faire

1. Installez et vérifiez `imsg` sur le Mac Messages :

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Accordez les autorisations Accès complet au disque et Automation au contexte de processus qui exécute `imsg` et OpenClaw.

3. Traduisez l’ancienne configuration :

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

4. Redémarrez le gateway et vérifiez :

   ```bash
   openclaw channels status --probe
   ```

5. Testez les messages privés, les groupes, les pièces jointes et toutes les actions d’API privée dont vous dépendez avant de supprimer votre ancien serveur BlueBubbles.

## Notes de migration

- `channels.bluebubbles.serverUrl` et `channels.bluebubbles.password` n’ont pas d’équivalent iMessage.
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, les racines de pièces jointes, les limites de taille des médias, le découpage en morceaux et les bascules d’action ont des équivalents iMessage.
- `channels.imessage.includeAttachments` reste désactivé par défaut. Définissez-le explicitement si vous attendez que les photos, mémos vocaux, vidéos ou fichiers entrants parviennent à l’agent.
- Avec `groupPolicy: "allowlist"`, copiez l’ancien bloc `groups`, y compris toute entrée joker `"*"`. Les listes d’autorisation d’expéditeurs de groupe et le registre des groupes sont des barrières séparées.
- Les liaisons ACP qui correspondaient à `channel: "bluebubbles"` doivent être remplacées par `channel: "imessage"`.
- Les anciennes clés de session BlueBubbles ne deviennent pas des clés de session iMessage. Les approbations d’appairage sont conservées par identifiant, mais l’historique des conversations sous les clés de session BlueBubbles ne l’est pas.

## Voir aussi

- [Venir de BlueBubbles](/fr/channels/imessage-from-bluebubbles)
- [iMessage](/fr/channels/imessage)
- [Référence de configuration - iMessage](/fr/gateway/config-channels#imessage)
