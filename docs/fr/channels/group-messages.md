---
read_when:
    - Modifier les règles des messages de groupe ou les mentions
summary: Comportement et configuration de la gestion des messages de groupe WhatsApp (`mentionPatterns` est partagé entre les surfaces)
title: Messages de groupe
x-i18n:
    generated_at: "2026-04-25T13:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Comportement et configuration de la gestion des messages de groupe WhatsApp (`mentionPatterns` est désormais partagé entre les surfaces)

Objectif : permettre à Clawd de rester dans des groupes WhatsApp, de ne se réveiller que lorsqu’il est mentionné, et de garder ce fil séparé de la session DM personnelle.

Remarque : `agents.list[].groupChat.mentionPatterns` est désormais utilisé aussi par Telegram/Discord/Slack/iMessage ; cette documentation se concentre sur le comportement spécifique à WhatsApp. Pour les configurations multi-agent, définissez `agents.list[].groupChat.mentionPatterns` par agent (ou utilisez `messages.groupChat.mentionPatterns` comme solution de repli globale).

## Implémentation actuelle (2025-12-03)

- Modes d’activation : `mention` (par défaut) ou `always`. `mention` exige une mention (véritables @-mentions WhatsApp via `mentionedJids`, motifs regex sûrs, ou l’E.164 du bot n’importe où dans le texte). `always` réveille l’agent à chaque message, mais il ne doit répondre que lorsqu’il peut apporter une vraie valeur ; sinon, il renvoie le jeton silencieux exact `NO_REPLY` / `no_reply`. Les valeurs par défaut peuvent être définies dans la configuration (`channels.whatsapp.groups`) et remplacées par groupe via `/activation`. Lorsque `channels.whatsapp.groups` est défini, il agit aussi comme liste d’autorisation des groupes (incluez `"*"` pour tous les autoriser).
- Politique de groupe : `channels.whatsapp.groupPolicy` contrôle si les messages de groupe sont acceptés (`open|disabled|allowlist`). `allowlist` utilise `channels.whatsapp.groupAllowFrom` (repli : `channels.whatsapp.allowFrom` explicite). La valeur par défaut est `allowlist` (bloqué tant que vous n’ajoutez pas d’expéditeurs).
- Sessions par groupe : les clés de session ressemblent à `agent:<agentId>:whatsapp:group:<jid>`, de sorte que des commandes telles que `/verbose on`, `/trace on` ou `/think high` (envoyées comme messages autonomes) sont limitées à ce groupe ; l’état du DM personnel reste inchangé. Les Heartbeat sont ignorés pour les fils de groupe.
- Injection de contexte : les messages de groupe **en attente uniquement** (50 par défaut) qui _n’ont pas_ déclenché d’exécution sont préfixés sous `[Chat messages since your last reply - for context]`, avec la ligne déclenchante sous `[Current message - respond to this]`. Les messages déjà présents dans la session ne sont pas réinjectés.
- Affichage de l’expéditeur : chaque lot de groupe se termine désormais par `[from: Sender Name (+E164)]` afin que Pi sache qui parle.
- Éphémères / vue unique : nous les déballons avant d’extraire le texte/les mentions, de sorte que les mentions à l’intérieur les déclenchent toujours.
- Prompt système de groupe : au premier tour d’une session de groupe (et chaque fois que `/activation` change le mode), nous injectons un court texte dans le prompt système comme `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Si les métadonnées ne sont pas disponibles, nous indiquons tout de même à l’agent qu’il s’agit d’une discussion de groupe.

## Exemple de configuration (WhatsApp)

Ajoutez un bloc `groupChat` à `~/.openclaw/openclaw.json` afin que les mentions par nom d’affichage fonctionnent même lorsque WhatsApp supprime le `@` visuel dans le corps du texte :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Remarques :

- Les regex ne tiennent pas compte de la casse et utilisent les mêmes garde-fous de regex sûres que les autres surfaces regex de configuration ; les motifs invalides et les répétitions imbriquées dangereuses sont ignorés.
- WhatsApp envoie toujours des mentions canoniques via `mentionedJids` lorsque quelqu’un touche le contact ; la solution de repli par numéro est donc rarement nécessaire, mais reste un filet de sécurité utile.

### Commande d’activation (réservée au propriétaire)

Utilisez la commande de discussion de groupe :

- `/activation mention`
- `/activation always`

Seul le numéro du propriétaire (depuis `channels.whatsapp.allowFrom`, ou l’E.164 du bot lui-même si non défini) peut modifier cela. Envoyez `/status` comme message autonome dans le groupe pour voir le mode d’activation actuel.

## Utilisation

1. Ajoutez votre compte WhatsApp (celui qui exécute OpenClaw) au groupe.
2. Dites `@openclaw …` (ou incluez le numéro). Seuls les expéditeurs autorisés peuvent le déclencher, sauf si vous définissez `groupPolicy: "open"`.
3. Le prompt de l’agent inclura le contexte récent du groupe ainsi que le marqueur final `[from: …]` afin qu’il puisse s’adresser à la bonne personne.
4. Les directives au niveau de la session (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) s’appliquent uniquement à la session de ce groupe ; envoyez-les comme messages autonomes pour qu’elles soient prises en compte. Votre session DM personnelle reste indépendante.

## Tests / vérification

- Vérification manuelle :
  - Envoyez une mention `@openclaw` dans le groupe et confirmez une réponse qui fait référence au nom de l’expéditeur.
  - Envoyez une seconde mention et vérifiez que le bloc d’historique est inclus puis effacé au tour suivant.
- Vérifiez les journaux du gateway (exécutez avec `--verbose`) pour voir les entrées `inbound web message` affichant `from: <groupJid>` et le suffixe `[from: …]`.

## Points connus

- Les Heartbeat sont intentionnellement ignorés pour les groupes afin d’éviter les diffusions bruyantes.
- La suppression des échos utilise la chaîne combinée du lot ; si vous envoyez deux fois un texte identique sans mentions, seul le premier obtiendra une réponse.
- Les entrées du magasin de sessions apparaîtront comme `agent:<agentId>:whatsapp:group:<jid>` dans le magasin de sessions (`~/.openclaw/agents/<agentId>/sessions/sessions.json` par défaut) ; une entrée absente signifie simplement que le groupe n’a pas encore déclenché d’exécution.
- Les indicateurs de saisie dans les groupes suivent `agents.defaults.typingMode` (par défaut : `message` en l’absence de mention).

## Connexes

- [Groupes](/fr/channels/groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
