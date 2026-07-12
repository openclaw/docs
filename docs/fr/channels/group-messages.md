---
read_when:
    - Configuration spécifique des groupes WhatsApp
    - Modification des modes d’activation de WhatsApp (`mention` ou `always`)
    - Ajustement des clés de session des groupes WhatsApp ou du contexte des messages en attente
sidebarTitle: WhatsApp groups
summary: Gestion des messages de groupe WhatsApp — activation, listes d’autorisation, sessions et injection de contexte
title: Messages de groupe WhatsApp
x-i18n:
    generated_at: "2026-07-12T15:02:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

Pour le modèle de groupes multicanaux (Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo), consultez [Groupes](/fr/channels/groups). Cette page décrit le comportement propre à WhatsApp qui s’ajoute à ce modèle : activation, listes d’autorisation des groupes, clés de session propres à chaque groupe et injection du contexte des messages en attente.

Objectif : permettre à OpenClaw de rester dans les groupes WhatsApp, de s’activer uniquement lorsqu’il est interpellé et de conserver ce fil séparé de la session personnelle de messages directs.

<Note>
`agents.list[].groupChat.mentionPatterns` est partagé avec le filtrage des mentions des autres canaux. Pour les configurations multi-agents, définissez-le pour chaque agent, ou utilisez `messages.groupChat.mentionPatterns` comme solution de repli globale. Si aucun des deux n’est défini, les motifs sont dérivés du nom et de l’émoji de l’identité de l’agent.
</Note>

## Comportement

- Modes d’activation : `mention` (par défaut) ou `always`. `mention` nécessite une sollicitation : une véritable @mention WhatsApp (`mentionedJids`), un motif d’expression régulière configuré, les chiffres E.164 du bot n’importe où dans le texte ou une réponse citant l’un des messages du bot (sauf dans les configurations de conversation avec soi-même utilisant un numéro partagé). `always` réveille l’agent à chaque message, mais l’invite de groupe injectée lui indique de répondre uniquement lorsqu’il apporte une valeur ajoutée et, dans le cas contraire, de renvoyer exactement le jeton silencieux `NO_REPLY` (sans distinction entre majuscules et minuscules). Les valeurs par défaut proviennent de la configuration (`channels.whatsapp.groups` `requireMention`) et peuvent être remplacées pour chaque groupe via `/activation`.
- Liste d’autorisation des groupes : lorsque `channels.whatsapp.groups` est défini, seuls les JID de groupe répertoriés sont admis (incluez `"*"` pour tous les autoriser) ; les messages provenant de groupes non répertoriés sont ignorés avec une indication dans le journal.
- Politique de groupe : `channels.whatsapp.groupPolicy` détermine si les messages de groupe sont acceptés (`open|disabled|allowlist`). `allowlist` utilise `channels.whatsapp.groupAllowFrom` (solution de repli : `channels.whatsapp.allowFrom` explicite). La valeur par défaut est `allowlist` (bloqué jusqu’à ce que vous ajoutiez des expéditeurs).
- Sessions par groupe : les clés de session ressemblent à `agent:<agentId>:whatsapp:group:<jid>` (les comptes autres que celui par défaut ajoutent `:thread:whatsapp-account-<accountId>`) ; les directives telles que `/verbose on`, `/trace on` ou `/think high` (envoyées sous forme de messages autonomes) sont donc limitées à ce groupe, sans modifier l’état des messages privés personnels.
- Injection du contexte : les messages de groupe **en attente uniquement** (50 par défaut) qui _n’ont pas_ déclenché d’exécution sont préfixés sous `[Chat messages since your last reply - for context]`, tandis que la ligne déclencheuse figure sous `[Current message - respond to this]`. La fenêtre des messages en attente est effacée après l’exécution ; les messages déjà présents dans la session ne sont pas réinjectés.
- Attribution de l’expéditeur : chaque ligne de groupe contient le libellé de l’expéditeur dans l’enveloppe du message, par exemple `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`, et l’identité de l’expéditeur ainsi que l’objet et les membres du groupe sont transmis dans le bloc non fiable de métadonnées de conversation.
- Messages éphémères/à affichage unique : les enveloppes sont retirées avant l’extraction du texte et des mentions, de sorte que les sollicitations qu’elles contiennent déclenchent toujours l’agent.
- Invite système de groupe : le premier tour d’une session de groupe (ainsi que tout tour suivant une modification du mode par `/activation`) injecte des instructions d’activation dans l’invite système (`Activation: trigger-only ...` ou `Activation: always-on ...`, ainsi que « s’adresser à l’expéditeur concerné »). Les instructions persistantes relatives à l’envoi dans les conversations de groupe (« Vous participez à une conversation de groupe WhatsApp… ») sont toujours incluses.

## Exemple de configuration (WhatsApp)

Permettez aux mentions par nom d’affichage de fonctionner même lorsque WhatsApp supprime le `@` visible du corps du texte :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // fenêtre de contexte de groupe en attente (50 par défaut)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Remarques :

- Les expressions régulières sont insensibles à la casse et utilisent les mêmes protections contre les expressions régulières dangereuses que les autres surfaces de configuration acceptant des expressions régulières ; les motifs non valides et les répétitions imbriquées dangereuses sont ignorés.
- WhatsApp envoie toujours les mentions canoniques via `mentionedJids` lorsqu’une personne touche le contact ; le recours au numéro est donc rarement nécessaire, mais constitue un filet de sécurité utile.
- La fenêtre de contexte en attente est déterminée dans l’ordre suivant : `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50.

### Commande d’activation (réservée au propriétaire)

Utilisez la commande de discussion de groupe :

- `/activation mention`
- `/activation always`

Seuls les numéros des propriétaires (provenant de `channels.whatsapp.allowFrom`, ou le propre numéro E.164 du bot lorsque ce paramètre n’est pas défini) peuvent modifier ce réglage ; la commande `/activation` envoyée par toute autre personne est ignorée et stockée uniquement comme contexte. Envoyez `/status` sous forme de message autonome dans le groupe pour afficher le mode d’activation actuel.

## Utilisation

1. Ajoutez votre compte WhatsApp (celui qui exécute OpenClaw) au groupe.
2. Écrivez `@openclaw ...` (ou incluez le numéro). Seuls les expéditeurs figurant dans la liste d’autorisation peuvent le déclencher, sauf si vous définissez `groupPolicy: "open"`.
3. L’invite de l’agent inclut le contexte de groupe en attente ainsi que des lignes identifiant les expéditeurs, afin qu’il puisse s’adresser à la bonne personne.
4. Les directives de session (`/verbose on`, `/trace on`, `/think high`, `/new` ou `/reset`, `/compact`) s’appliquent uniquement à la session de ce groupe ; envoyez-les sous forme de messages autonomes afin qu’elles soient prises en compte. Votre session personnelle par message privé reste indépendante.

## Tests / vérification

- Test rapide manuel :
  - Envoyez une mention `@openclaw` dans le groupe et vérifiez qu’une réponse fait référence au nom de l’expéditeur.
  - Envoyez une deuxième mention et vérifiez que le bloc d’historique est inclus, puis qu’il est effacé au tour suivant.
- Consultez les journaux du Gateway (exécuté avec `--verbose`) pour rechercher des entrées `inbound web message` affichant `from: <groupJid>` et le corps identifié par expéditeur.

## Points à prendre en compte

- Les Heartbeats s’exécutent dans la session principale de l’agent ; les sessions de groupe ne reçoivent jamais d’exécutions de Heartbeat.
- La suppression des échos mémorise l’invite combinée (historique + message actuel) pour chaque session, afin que les messages envoyés par le bot lui-même ne le déclenchent pas de nouveau ; un lot identique répété peut être ignoré en tant qu’écho.
- Les entrées du stockage de sessions apparaissent sous la forme `agent:<agentId>:whatsapp:group:<jid>` dans le stockage de sessions SQLite propre à chaque agent ; une entrée manquante signifie simplement que le groupe n’a pas encore déclenché d’exécution.
- Les indicateurs de saisie suivent `session.typingMode` / `agents.defaults.typingMode`. Lorsque les réponses visibles sont configurées pour utiliser uniquement l’outil de messagerie, la saisie commence immédiatement par défaut afin que les membres du groupe puissent voir que l’agent travaille, même si aucune réponse finale automatique n’est publiée. Une configuration explicite du mode de saisie reste prioritaire.

## Pages connexes

- [Groupes](/fr/channels/groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Groupes de diffusion](/fr/channels/broadcast-groups)
