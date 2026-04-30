---
read_when:
    - Modifier les règles des messages de groupe ou les mentions
summary: Comportement et configuration de la gestion des messages de groupe WhatsApp (mentionPatterns est partagé entre les surfaces)
title: Messages de groupe
x-i18n:
    generated_at: "2026-04-30T07:12:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Objectif : permettre à Clawd de rester dans les groupes WhatsApp, de se réveiller uniquement lorsqu’il est interpellé, et de conserver ce fil séparé de la session personnelle en DM.

<Note>
`agents.list[].groupChat.mentionPatterns` est aussi utilisé par Telegram, Discord, Slack et iMessage. Cette documentation se concentre sur le comportement propre à WhatsApp. Pour les configurations multi-agents, définissez `agents.list[].groupChat.mentionPatterns` par agent, ou utilisez `messages.groupChat.mentionPatterns` comme solution de repli globale.
</Note>

## Implémentation actuelle (2025-12-03)

- Modes d’activation : `mention` (par défaut) ou `always`. `mention` nécessite une interpellation (vraies @-mentions WhatsApp via `mentionedJids`, motifs regex sûrs, ou l’E.164 du bot n’importe où dans le texte). `always` réveille l’agent à chaque message, mais il ne doit répondre que lorsqu’il peut apporter une valeur utile ; sinon, il renvoie le jeton silencieux exact `NO_REPLY` / `no_reply`. Les valeurs par défaut peuvent être définies dans la configuration (`channels.whatsapp.groups`) et remplacées par groupe via `/activation`. Quand `channels.whatsapp.groups` est défini, il sert aussi de liste d’autorisation de groupes (incluez `"*"` pour tout autoriser).
- Politique de groupe : `channels.whatsapp.groupPolicy` contrôle si les messages de groupe sont acceptés (`open|disabled|allowlist`). `allowlist` utilise `channels.whatsapp.groupAllowFrom` (solution de repli : `channels.whatsapp.allowFrom` explicite). La valeur par défaut est `allowlist` (bloqué jusqu’à l’ajout d’expéditeurs).
- Sessions par groupe : les clés de session ressemblent à `agent:<agentId>:whatsapp:group:<jid>`, donc les commandes comme `/verbose on`, `/trace on` ou `/think high` (envoyées comme messages autonomes) sont limitées à ce groupe ; l’état du DM personnel reste intact. Les Heartbeats sont ignorés pour les fils de groupe.
- Injection de contexte : les messages de groupe **en attente uniquement** (50 par défaut) qui _n’ont pas_ déclenché d’exécution sont préfixés sous `[Messages du chat depuis votre dernière réponse - pour contexte]`, avec la ligne déclencheuse sous `[Message actuel - répondez à celui-ci]`. Les messages déjà présents dans la session ne sont pas réinjectés.
- Mise en évidence de l’expéditeur : chaque lot de groupe se termine maintenant par `[de : Nom de l’expéditeur (+E164)]`, afin que Pi sache qui parle.
- Éphémère/vue unique : nous les déballons avant d’extraire le texte et les mentions, donc les interpellations qu’ils contiennent déclenchent toujours.
- Invite système de groupe : au premier tour d’une session de groupe (et chaque fois que `/activation` change le mode), nous injectons une courte note dans l’invite système, comme `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Si les métadonnées ne sont pas disponibles, nous indiquons tout de même à l’agent qu’il s’agit d’un chat de groupe.

## Exemple de configuration (WhatsApp)

Ajoutez un bloc `groupChat` à `~/.openclaw/openclaw.json` afin que les interpellations par nom d’affichage fonctionnent même lorsque WhatsApp supprime le `@` visuel dans le corps du texte :

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

- Les regex ne tiennent pas compte de la casse et utilisent les mêmes garde-fous de regex sûres que les autres surfaces de configuration par regex ; les motifs invalides et les répétitions imbriquées non sûres sont ignorés.
- WhatsApp envoie toujours les mentions canoniques via `mentionedJids` lorsque quelqu’un touche le contact, donc la solution de repli par numéro est rarement nécessaire, mais elle constitue un filet de sécurité utile.

### Commande d’activation (propriétaire uniquement)

Utilisez la commande de chat de groupe :

- `/activation mention`
- `/activation always`

Seul le numéro du propriétaire (depuis `channels.whatsapp.allowFrom`, ou l’E.164 propre du bot lorsqu’il n’est pas défini) peut modifier cela. Envoyez `/status` comme message autonome dans le groupe pour voir le mode d’activation actuel.

## Mode d’emploi

1. Ajoutez votre compte WhatsApp (celui qui exécute OpenClaw) au groupe.
2. Dites `@openclaw …` (ou incluez le numéro). Seuls les expéditeurs autorisés peuvent le déclencher, sauf si vous définissez `groupPolicy: "open"`.
3. L’invite de l’agent inclura le contexte récent du groupe ainsi que le marqueur final `[de : …]`, afin qu’il puisse s’adresser à la bonne personne.
4. Les directives au niveau de la session (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) s’appliquent uniquement à la session de ce groupe ; envoyez-les comme messages autonomes afin qu’elles soient prises en compte. Votre session personnelle en DM reste indépendante.

## Tests / vérification

- Test rapide manuel :
  - Envoyez une interpellation `@openclaw` dans le groupe et confirmez une réponse qui fait référence au nom de l’expéditeur.
  - Envoyez une deuxième interpellation et vérifiez que le bloc d’historique est inclus, puis effacé au tour suivant.
- Consultez les journaux du Gateway (exécuter avec `--verbose`) pour voir les entrées `inbound web message` affichant `from: <groupJid>` et le suffixe `[de : …]`.

## Points connus

- Les Heartbeats sont volontairement ignorés pour les groupes afin d’éviter les diffusions bruyantes.
- La suppression d’écho utilise la chaîne combinée du lot ; si vous envoyez deux fois un texte identique sans mentions, seul le premier recevra une réponse.
- Les entrées du magasin de sessions apparaîtront sous la forme `agent:<agentId>:whatsapp:group:<jid>` dans le magasin de sessions (`~/.openclaw/agents/<agentId>/sessions/sessions.json` par défaut) ; une entrée manquante signifie simplement que le groupe n’a pas encore déclenché d’exécution.
- Les indicateurs de saisie dans les groupes suivent `agents.defaults.typingMode`. Lorsque les réponses visibles utilisent le mode message-tool-only par défaut, la saisie démarre immédiatement par défaut afin que les membres du groupe puissent voir que l’agent travaille, même si aucune réponse finale automatique n’est publiée. Une configuration explicite du mode de saisie reste prioritaire.

## Liens associés

- [Groupes](/fr/channels/groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
