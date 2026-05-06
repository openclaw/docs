---
read_when:
    - Configurer spécifiquement les groupes WhatsApp
    - Modifier les modes d’activation WhatsApp (`mention` ou `always`)
    - Ajuster les clés de session de groupe WhatsApp ou le contexte des messages en attente
sidebarTitle: WhatsApp groups
summary: Gestion des messages de groupe WhatsApp — activation, listes d’autorisation, sessions et injection de contexte
title: Messages de groupe WhatsApp
x-i18n:
    generated_at: "2026-05-06T07:14:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

Pour le modèle de groupes multicanal (Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo), consultez [Groupes](/fr/channels/groups). Cette page couvre le comportement propre à WhatsApp au-dessus de ce modèle : activation, listes d’autorisation de groupes, clés de session par groupe et injection de contexte des messages en attente.

Objectif : permettre à OpenClaw d’être présent dans des groupes WhatsApp, de ne se réveiller que lorsqu’il est mentionné, et de garder ce fil séparé de la session de message direct personnelle.

<Note>
`agents.list[].groupChat.mentionPatterns` est également utilisé par Telegram, Discord, Slack et iMessage. Pour les configurations multi-agents, définissez-le par agent, ou utilisez `messages.groupChat.mentionPatterns` comme solution de repli globale.
</Note>

## Comportement

- Modes d’activation : `mention` (par défaut) ou `always`. `mention` nécessite une mention (vraies @-mentions WhatsApp via `mentionedJids`, motifs d’expression régulière sûrs, ou l’E.164 du bot n’importe où dans le texte). `always` réveille l’agent à chaque message, mais il ne doit répondre que lorsqu’il peut apporter une valeur significative ; sinon, il renvoie le jeton silencieux exact `NO_REPLY` / `no_reply`. Les valeurs par défaut peuvent être définies dans la configuration (`channels.whatsapp.groups`) et remplacées par groupe via `/activation`. Lorsque `channels.whatsapp.groups` est défini, il sert aussi de liste d’autorisation de groupes (incluez `"*"` pour tout autoriser).
- Politique de groupe : `channels.whatsapp.groupPolicy` contrôle si les messages de groupe sont acceptés (`open|disabled|allowlist`). `allowlist` utilise `channels.whatsapp.groupAllowFrom` (solution de repli : `channels.whatsapp.allowFrom` explicite). La valeur par défaut est `allowlist` (bloqué jusqu’à ce que vous ajoutiez des expéditeurs).
- Sessions par groupe : les clés de session ressemblent à `agent:<agentId>:whatsapp:group:<jid>`, donc les commandes comme `/verbose on`, `/trace on` ou `/think high` (envoyées comme messages autonomes) sont limitées à ce groupe ; l’état des messages directs personnels reste intact. Les Heartbeat sont ignorés pour les fils de groupe.
- Injection de contexte : les messages de groupe **uniquement en attente** (50 par défaut) qui _n’ont pas_ déclenché d’exécution sont préfixés sous `[Chat messages since your last reply - for context]`, avec la ligne déclenchante sous `[Current message - respond to this]`. Les messages déjà présents dans la session ne sont pas réinjectés.
- Exposition de l’expéditeur : chaque lot de groupe se termine désormais par `[from: Sender Name (+E164)]` afin que Pi sache qui parle.
- Éphémère/vue unique : nous les déballons avant d’extraire le texte/les mentions, de sorte que les mentions qu’ils contiennent déclenchent toujours.
- Invite système de groupe : au premier tour d’une session de groupe (et chaque fois que `/activation` modifie le mode), nous injectons un court texte dans l’invite système, comme `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` Si les métadonnées ne sont pas disponibles, nous indiquons tout de même à l’agent qu’il s’agit d’une discussion de groupe.

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

Notes :

- Les expressions régulières sont insensibles à la casse et utilisent les mêmes garde-fous d’expressions régulières sûres que les autres surfaces de configuration utilisant des expressions régulières ; les motifs invalides et les répétitions imbriquées dangereuses sont ignorés.
- WhatsApp envoie toujours les mentions canoniques via `mentionedJids` lorsque quelqu’un touche le contact ; la solution de repli par numéro est donc rarement nécessaire, mais elle constitue un filet de sécurité utile.

### Commande d’activation (propriétaire uniquement)

Utilisez la commande de discussion de groupe :

- `/activation mention`
- `/activation always`

Seul le numéro du propriétaire (provenant de `channels.whatsapp.allowFrom`, ou l’E.164 propre au bot si non défini) peut modifier cela. Envoyez `/status` comme message autonome dans le groupe pour voir le mode d’activation actuel.

## Utilisation

1. Ajoutez votre compte WhatsApp (celui qui exécute OpenClaw) au groupe.
2. Dites `@openclaw …` (ou incluez le numéro). Seuls les expéditeurs figurant dans la liste d’autorisation peuvent le déclencher, sauf si vous définissez `groupPolicy: "open"`.
3. L’invite de l’agent inclura le contexte récent du groupe ainsi que le marqueur final `[from: …]`, afin qu’il puisse s’adresser à la bonne personne.
4. Les directives de niveau session (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) s’appliquent uniquement à la session de ce groupe ; envoyez-les comme messages autonomes afin qu’elles soient enregistrées. Votre session de message direct personnelle reste indépendante.

## Tests / vérification

- Test manuel rapide :
  - Envoyez une mention `@openclaw` dans le groupe et confirmez qu’une réponse fait référence au nom de l’expéditeur.
  - Envoyez une deuxième mention et vérifiez que le bloc d’historique est inclus puis effacé au tour suivant.
- Consultez les journaux Gateway (exécutez avec `--verbose`) pour voir les entrées `inbound web message` affichant `from: <groupJid>` et le suffixe `[from: …]`.

## Considérations connues

- Les Heartbeat sont intentionnellement ignorés pour les groupes afin d’éviter les diffusions bruyantes.
- La suppression d’écho utilise la chaîne de lot combinée ; si vous envoyez deux fois un texte identique sans mention, seul le premier recevra une réponse.
- Les entrées du magasin de sessions apparaîtront sous la forme `agent:<agentId>:whatsapp:group:<jid>` dans le magasin de sessions (`~/.openclaw/agents/<agentId>/sessions/sessions.json` par défaut) ; une entrée manquante signifie simplement que le groupe n’a pas encore déclenché d’exécution.
- Les indicateurs de saisie dans les groupes suivent `agents.defaults.typingMode`. Lorsque les réponses visibles utilisent le mode par défaut limité à l’outil de message, la saisie commence immédiatement par défaut afin que les membres du groupe puissent voir que l’agent travaille, même si aucune réponse finale automatique n’est publiée. La configuration explicite du mode de saisie reste prioritaire.

## Connexe

- [Groupes](/fr/channels/groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
