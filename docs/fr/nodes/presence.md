---
read_when:
    - Vous souhaitez qu’OpenClaw identifie le Mac actif
    - Vous déboguez l’activité de la dernière entrée ou la sélection du Node actif
    - Vous souhaitez comprendre le routage des notifications de connexion des nœuds
summary: Détecter le Mac que vous avez utilisé le plus récemment et y acheminer les alertes du Node
title: Présence active sur l’ordinateur
x-i18n:
    generated_at: "2026-07-12T15:35:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

La présence informatique active indique au Gateway quel nœud macOS connecté a reçu
l’entrée physique de souris ou de clavier la plus récente. OpenClaw utilise ce signal pour
marquer un Mac comme `active`, fournir à l’agent une indication stable du nœud actif et acheminer
les alertes de connexion des nœuds vers l’ordinateur où vous êtes le plus probablement présent.

Cela est distinct de la [présence système](/fr/concepts/presence), qui correspond à la liste en temps
réel des clients du Gateway, ainsi que des balises persistantes `node.presence.alive`, qui
enregistrent le dernier réveil d’un nœud mobile sans le considérer comme connecté.

## Prérequis

- L’application OpenClaw pour macOS est appairée et connectée en mode nœud.
- L’autorisation **Accessibility** est accordée à l’application OpenClaw signée.
- Pour les alertes de connexion, l’autorisation **Notifications** est également accordée et le
  nœud Mac expose `system.notify`.

Le signalement de l’activité est actuellement mis en œuvre par le nœud macOS natif. Les hôtes
de nœuds iOS, Android, watchOS et sans interface graphique peuvent signaler leur état de connexion
ou leur dernière activité en arrière-plan, mais ils ne peuvent pas prétendre à la désignation
d’ordinateur actif.

## Vérifier l’ordinateur actif

1. Dans l’application macOS, ouvrez **Settings -> Permissions** et accordez
   **Accessibility** dans les réglages système de macOS.
2. Vérifiez que le nœud Mac est connecté :

   ```bash
   openclaw nodes status --connected
   ```

3. Déplacez la souris ou appuyez sur une touche sur ce Mac, puis exécutez :

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Le Mac éligible dont l’activité est la plus récente est marqué `active`. La sortie d’état affiche
le temps écoulé depuis sa dernière entrée ; `describe` expose `active`, `lastActiveAtMs` et
`presenceUpdatedAtMs`. L’activité est délibérément regroupée ; l’affichage peut donc prendre
jusqu’à environ 15 secondes pour refléter une nouvelle entrée après un signalement récent.

## Conversion de l’activité en présence

Le rapporteur macOS échantillonne l’horloge d’inactivité du système HID toutes les deux secondes. Il
effectue un signalement lorsqu’une connexion de nœud devient prête, puis signale toute nouvelle
activité physique au maximum une fois toutes les 15 secondes. Pendant l’inactivité, il envoie un
signal de maintien toutes les trois minutes. La durée d’inactivité est plafonnée à 30 jours afin
qu’un échantillon très ancien ne puisse pas dériver vers le futur et être considéré à tort comme
celui de l’ordinateur le plus récent.

Le Gateway accepte l’activité uniquement lorsque toutes les conditions suivantes sont remplies :

- l’événement appartient à la connexion actuellement authentifiée pour cet identifiant de nœud ;
- le nœud dispose effectivement de l’autorisation `accessibility: true` ;
- la charge utile contient une valeur entière bornée `idleSeconds`.

Le Gateway soustrait `idleSeconds` de son propre instant d’observation pour calculer
`lastActiveAtMs`. Il ne se fie jamais à un horodatage d’horloge murale fourni par un nœud. Parmi
les Mac éligibles connectés, celui dont la valeur `lastActiveAtMs` est la plus récente l’emporte ;
en cas d’égalité, la mise à jour de présence la plus récente est utilisée.

La présence est locale au processus et liée à la connexion. La déconnexion de la session actuelle,
son remplacement par une autre session utilisant le même identifiant de nœud ou la révocation de
l’autorisation Accessibility efface l’état d’activité de ce nœud et recalcule le Mac actif.

## Confidentialité et contexte du modèle

OpenClaw envoie la durée d’inactivité, et non le contenu des entrées. Il n’envoie ni les valeurs
des touches, ni les coordonnées de la souris, ni les noms des applications, ni les titres des
fenêtres, ni les événements d’entrée bruts. Le rapporteur macOS lit l’état matériel HID ; les
événements synthétiques de contrôle informatique ne font donc pas apparaître un Mac automatisé
comme l’ordinateur que vous avez utilisé physiquement.

Une activité continue ne crée pas d’événements système visibles par le modèle. La ligne dynamique
de l’environnement d’exécution contient uniquement l’identifiant de nœud authentifié :

```text
active_node=<node-id>
```

Les horodatages exacts et les noms d’affichage contrôlés par les nœuds restent exclus du prompt
afin d’éviter l’injection de prompt et les modifications répétées du cache. Lorsque l’agent a
besoin d’informations actuelles, l’outil `nodes` peut lire `node.list` ou `node.describe`.

## Acheminement des alertes de connexion

Une fois qu’un nœud a terminé sa négociation avec le Gateway, OpenClaw attend 750 millisecondes afin
que le Mac en cours de connexion puisse envoyer son premier échantillon d’activité. Il tente ensuite
d’utiliser le Mac connecté capable d’afficher des notifications dont l’activité est la plus récente.

- Si la distribution principale réussit, aucun autre Mac ne reçoit l’alerte.
- Si aucun Mac actif n’est disponible ou si la distribution principale échoue, OpenClaw attend cinq
  secondes, puis essaie chaque autre Mac connecté qui expose `system.notify`.
- Une alerte de reconnexion pour le même nœud est supprimée pendant cinq minutes après une tentative
  réelle de distribution, ce qui empêche les reconnexions répétées de produire une avalanche de
  notifications.

Les alertes sont liées à des connexions de nœuds précises. Une session source déconnectée ou
remplacée ne peut pas mener à terme une ancienne alerte planifiée, tandis qu’une connexion de
destination de remplacement peut toujours participer à la distribution de secours.

## Résolution des problèmes

| Symptôme                                  | Vérification                                                                                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aucune ligne n’est marquée `active`       | Vérifiez qu’un nœud macOS natif est connecté et que `openclaw nodes describe --node <id>` affiche `permissions.accessibility: true`.                                           |
| Le mauvais Mac reste actif                | Utilisez physiquement le Mac concerné, attendez la fin de la fenêtre de regroupement, puis réexécutez `openclaw nodes status`. Les actions synthétiques de contrôle ne comptent pas. |
| Les données de dernière entrée disparaissent | Vérifiez si le Mac s’est déconnecté, si sa session de nœud a été remplacée ou si l’autorisation Accessibility a été révoquée. Chacune de ces conditions efface volontairement l’activité. |
| L’alerte apparaît sur plusieurs Mac       | La distribution principale était indisponible ou a échoué ; la procédure de secours différée a donc été exécutée. Vérifiez que le Mac actif est connecté, autorise les notifications et expose `system.notify`. |
| L’agent ne mentionne pas le Mac actif     | Commencez un nouveau tour après un changement d’activité. L’indication d’environnement d’exécution est stable et compacte ; utilisez l’outil `nodes` pour obtenir les métadonnées actuelles exactes. |

Pour restaurer les autorisations TCC, consultez les [autorisations macOS](/fr/platforms/mac/permissions).
Pour les échecs de connexion et de commande des nœuds, consultez la [résolution des problèmes liés aux nœuds](/fr/nodes/troubleshooting).

## Pages associées

- [Nœuds](/fr/nodes)
- [CLI des nœuds](/fr/cli/nodes)
- [Présence système](/fr/concepts/presence)
- [Protocole du Gateway](/fr/gateway/protocol#presence)
- [Application macOS](/fr/platforms/macos)
