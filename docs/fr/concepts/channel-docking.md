---
read_when:
    - Vous voulez que les réponses pour une session active passent de Telegram à Discord, Slack, Mattermost ou un autre canal lié
    - Vous configurez session.identityLinks pour les messages directs entre canaux
    - Une commande /dock indique que l’expéditeur n’est pas lié ou qu’aucune session active n’existe
summary: Déplacer la route de réponse d’une session OpenClaw entre des canaux de chat liés
title: Ancrage des canaux
x-i18n:
    generated_at: "2026-04-30T07:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

Le docking de canal est un renvoi d’appel pour une session OpenClaw.

Il conserve le même contexte de conversation, mais change l’endroit où les futures réponses pour
cette session sont livrées.

## Exemple

Alice peut envoyer des messages à OpenClaw sur Telegram et Discord :

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Si Alice envoie ceci depuis Telegram :

```text
/dock_discord
```

OpenClaw conserve le contexte de session actuel et change la route de réponse :

| Avant le docking             | Après `/dock_discord`       |
| ---------------------------- | --------------------------- |
| Les réponses vont à Telegram `123` | Les réponses vont à Discord `456` |

La session n’est pas recréée. L’historique de transcription reste attaché à la
même session.

## Pourquoi l’utiliser

Utilisez le docking lorsqu’une tâche commence dans une application de chat, mais que les réponses suivantes doivent arriver
ailleurs.

Flux courant :

1. Démarrez une tâche d’agent depuis Telegram.
2. Passez à Discord, où vous coordonnez le travail.
3. Envoyez `/dock_discord` depuis la session Telegram.
4. Conservez la même session OpenClaw, mais recevez les futures réponses dans Discord.

## Configuration requise

Le docking nécessite `session.identityLinks`. L’expéditeur source et le pair cible
doivent se trouver dans le même groupe d’identité :

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Les valeurs sont des identifiants de pairs préfixés par le canal :

| Valeur         | Signification               |
| -------------- | ---------------------------- |
| `telegram:123` | id d’expéditeur Telegram `123` |
| `discord:456`  | id de pair direct Discord `456` |
| `slack:U123`   | id d’utilisateur Slack `U123` |

La clé canonique (`alice` ci-dessus) est uniquement le nom du groupe d’identité partagé. Les commandes de docking utilisent les valeurs préfixées par le canal pour prouver que l’expéditeur source et le pair cible sont la même personne.

## Commandes

Les commandes de docking sont générées à partir des plugins de canal chargés qui prennent en charge les
commandes natives. Commandes intégrées actuelles :

| Canal cible | Commande           | Alias              |
| -------------- | ------------------ | ------------------ |
| Discord        | `/dock-discord`    | `/dock_discord`    |
| Mattermost     | `/dock-mattermost` | `/dock_mattermost` |
| Slack          | `/dock-slack`      | `/dock_slack`      |
| Telegram       | `/dock-telegram`   | `/dock_telegram`   |

Les alias avec tiret bas sont utiles sur les surfaces de commandes natives comme Telegram.

## Ce qui change

Le docking met à jour les champs de livraison de la session active :

| Champ de session | Exemple après `/dock_discord`           |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | le compte du canal cible, ou `default` |

Ces champs sont conservés dans le magasin de sessions et utilisés par la livraison des réponses ultérieures
pour cette session.

## Ce qui ne change pas

Le docking ne fait pas ce qui suit :

- créer des comptes de canal
- connecter un nouveau bot Discord, Telegram, Slack ou Mattermost
- accorder l’accès à un utilisateur
- contourner les listes d’autorisation de canal ou les politiques de messages directs
- déplacer l’historique de transcription vers une autre session
- faire partager une session à des utilisateurs sans rapport

Il change uniquement la route de livraison pour la session actuelle.

## Dépannage

**La commande indique que l’expéditeur n’est pas lié.**

Ajoutez à la fois l’expéditeur actuel et le pair cible au même groupe
`session.identityLinks`. Par exemple, si l’expéditeur Telegram `123` doit docker
vers le pair Discord `456`, incluez à la fois `telegram:123` et `discord:456`.

**La commande indique qu’aucune session active n’existe.**

Dockez depuis une session de chat direct existante. La commande a besoin d’une entrée de session active
afin de pouvoir conserver la nouvelle route.

**Les réponses vont toujours vers l’ancien canal.**

Vérifiez que la commande a répondu avec un message de réussite, puis confirmez que l’id du pair cible
correspond à l’id utilisé par ce canal. Le docking ne change que la route de la session
active ; une autre session peut toujours router ailleurs.

**Je dois revenir en arrière.**

Envoyez la commande correspondante pour le canal d’origine, comme `/dock_telegram` ou
`/dock-telegram`, depuis un expéditeur lié.
