---
read_when:
    - Vous souhaitez que les réponses d’une session active soient transférées de Telegram vers Discord, Slack, Mattermost ou un autre canal associé
    - Vous configurez `session.identityLinks` pour les messages directs intercanaux
    - Une commande /dock indique que l’expéditeur n’est pas associé ou qu’aucune session active n’existe
summary: Déplacer la route de réponse d’une session OpenClaw entre des canaux de discussion liés
title: Ancrage des canaux
x-i18n:
    generated_at: "2026-07-12T02:33:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

L’amarrage de canal est un transfert d’appel pour une session OpenClaw. Il conserve le même
contexte de conversation, mais modifie la destination des prochaines réponses de cette session.
L’amarrage fonctionne uniquement depuis une discussion directe ; il ne fonctionne pas depuis une
discussion de groupe.

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

Si Alice envoie ceci depuis une discussion directe Telegram :

```text
/dock_discord
```

OpenClaw conserve le contexte de la session actuelle et modifie l’itinéraire des réponses :

| Avant l’amarrage                  | Après `/dock_discord`             |
| --------------------------------- | --------------------------------- |
| Les réponses vont à Telegram `123` | Les réponses vont à Discord `456` |

La session n’est pas recréée. L’historique de la transcription reste associé à la
même session.

## Pourquoi l’utiliser

Utilisez l’amarrage lorsqu’une tâche commence dans une application de discussion, mais que les réponses suivantes doivent arriver
ailleurs.

Déroulement courant :

1. Démarrez une tâche d’agent depuis Telegram.
2. Passez à Discord, où vous coordonnez le travail.
3. Envoyez `/dock_discord` depuis la discussion directe Telegram.
4. Conservez la même session OpenClaw, mais recevez les prochaines réponses dans Discord.

## Configuration requise

L’amarrage nécessite `session.identityLinks`. L’expéditeur source et le pair cible
doivent appartenir au même groupe d’identité :

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

| Valeur         | Signification                         |
| -------------- | ------------------------------------- |
| `telegram:123` | identifiant d’expéditeur Telegram `123` |
| `discord:456`  | identifiant de pair direct Discord `456` |
| `slack:U123`   | identifiant d’utilisateur Slack `U123` |

La clé canonique (`alice` ci-dessus) est uniquement le nom du groupe d’identité partagé. Les commandes
d’amarrage utilisent les valeurs préfixées par le canal pour prouver que l’expéditeur source et le
pair cible sont la même personne.

## Commandes

OpenClaw génère une commande `/dock-<channel>` pour chaque Plugin de canal chargé
qui prend en charge les commandes natives ; la liste s’allonge donc à mesure que des Plugins sont ajoutés. Les
Plugins intégrés qui la prennent actuellement en charge sont les suivants :

| Canal cible | Commande           | Alias              |
| ----------- | ------------------ | ------------------ |
| Discord     | `/dock-discord`    | `/dock_discord`    |
| Mattermost  | `/dock-mattermost` | `/dock_mattermost` |
| Slack       | `/dock-slack`      | `/dock_slack`      |
| Telegram    | `/dock-telegram`   | `/dock_telegram`   |

La forme avec un trait de soulignement est également le nom de la commande native sur les interfaces comme Telegram
qui exposent directement les commandes à barre oblique.

## Ce qui change

L’amarrage met à jour les champs de livraison de la session active :

| Champ de session | Exemple après `/dock_discord`              |
| ---------------- | ------------------------------------------ |
| `lastChannel`    | `discord`                                  |
| `lastTo`         | `456`                                      |
| `lastAccountId`  | le compte du canal cible, ou `default`     |

Ces champs sont conservés dans le stockage des sessions et utilisés pour la livraison des
réponses ultérieures de cette session.

## Ce qui ne change pas

L’amarrage ne permet pas de :

- créer des comptes de canal
- connecter un nouveau bot Discord, Telegram, Slack ou Mattermost
- accorder un accès à un utilisateur
- contourner les listes d’autorisation des canaux ou les politiques de messages directs
- déplacer l’historique de la transcription vers une autre session
- faire partager une session à des utilisateurs sans lien entre eux

Il modifie uniquement l’itinéraire de livraison de la session actuelle.

## Dépannage

**La commande indique que l’expéditeur n’est pas lié.**

Ajoutez l’expéditeur actuel et le pair cible au même groupe
`session.identityLinks`. Par exemple, si l’expéditeur Telegram `123` doit être amarré
au pair Discord `456`, incluez `telegram:123` et `discord:456`.

**La commande indique que l’amarrage est uniquement disponible depuis les discussions directes.**

Envoyez la commande d’amarrage depuis une discussion directe avec OpenClaw, et non depuis une discussion de groupe.

**La commande indique qu’aucune session active n’existe.**

Effectuez l’amarrage depuis une session de discussion directe existante. La commande nécessite une entrée de session
active afin de pouvoir conserver le nouvel itinéraire.

**Les réponses sont toujours envoyées vers l’ancien canal.**

Vérifiez que la commande a répondu par un message de réussite et confirmez que l’identifiant du
pair cible correspond à celui utilisé par ce canal. L’amarrage modifie uniquement l’itinéraire de la session
active ; une autre session peut toujours acheminer ses réponses ailleurs.

**Je dois revenir au canal précédent.**

Envoyez la commande correspondante pour le canal d’origine, telle que `/dock_telegram` ou
`/dock-telegram`, depuis un expéditeur lié.
