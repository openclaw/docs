---
read_when:
    - Activation des résumés HealthKit sur un nœud iPhone
    - Appel de health.summary ou dépannage des métriques de santé manquantes
    - Examiner quelles données de santé peuvent quitter un iPhone
summary: Activer et invoquer des résumés HealthKit soumis à des contrôles de confidentialité depuis un Node iPhone
title: Résumés HealthKit
x-i18n:
    generated_at: "2026-07-16T13:30:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Résumés HealthKit

OpenClaw peut demander à un Node iPhone connecté un résumé en lecture seule de la journée calendaire en cours. L’iPhone calcule l’agrégat sur l’appareil et renvoie uniquement le nombre de pas, la durée du sommeil, la fréquence cardiaque moyenne au repos, ainsi que le nombre et la durée des entraînements. Les échantillons HealthKit individuels, les sources, les métadonnées, les dossiers cliniques, l’ingestion en arrière-plan et les écritures ne sont pas pris en charge.

Cette fonctionnalité est désactivée par défaut. Elle nécessite un consentement distinct sur l’iPhone et une autorisation sur le Gateway.

## Prérequis

- Un iPhone exécutant l’app iOS OpenClaw sur lequel HealthKit indique que les données de santé sont disponibles.
- Un Node iPhone connecté et approuvé. Consultez [Configuration de l’app iOS](/fr/platforms/ios).
- Un Gateway à jour pouvant joindre le Node iPhone.
- Des données Santé lisibles pour toutes les métriques que vous souhaitez consulter. Une Apple Watch peut fournir des données au stockage Santé de l’iPhone, mais l’app watchOS OpenClaw n’est pas requise pour les résumés HealthKit.

## Activer l’accès

### 1. Autoriser la commande du Gateway

Ajoutez `health.summary` au tableau `gateway.nodes.allowCommands` existant dans `openclaw.json`. Conservez toutes les commandes déjà présentes :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` est classée comme hautement sensible en matière de confidentialité et n’est jamais autorisée par défaut sur la plateforme iOS. Une entrée dans `gateway.nodes.denyCommands` prévaut sur l’entrée d’autorisation. Consultez [Politique des commandes des Nodes](/fr/nodes#command-policy).

### 2. Activer le partage sur l’iPhone

Dans l’app iOS :

1. Ouvrez **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Touchez **Enable & Share Summaries**.
3. Lisez l’avis, puis choisissez les catégories Santé qu’OpenClaw peut lire dans la feuille d’autorisation d’Apple.

Le commutateur enregistre votre choix explicite de partager avec OpenClaw. Il ne signifie pas qu’Apple a accordé l’accès à toutes les catégories demandées.

L’activation des résumés Santé ajoute `health.summary` à la surface de commandes déclarée du Node. Approuvez la mise à jour d’association du Node qui en résulte :

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Vérifiez ensuite que l’iPhone connecté expose une commande `health.summary` effective :

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Demander le résumé du jour

Seul `today` est pris en charge. Il couvre la période allant de minuit, heure locale, jusqu’à l’heure de la demande, selon le calendrier et le fuseau horaire actuels de l’iPhone.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Les agents peuvent appeler la même commande avec l’outil `nodes` :

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

La charge utile du résumé contient :

| Champ                    | Signification                                       |
| ------------------------ | --------------------------------------------------- |
| `period`                 | Toujours `today`                                  |
| `startISO`               | Début local de la journée, encodé comme instant ISO |
| `endISO`                 | Heure de la demande, encodée comme instant ISO      |
| `timeZoneIdentifier`     | Identifiant du fuseau horaire de l’iPhone           |
| `stepCount`              | Nombre cumulé de pas arrondi                        |
| `sleepDurationMinutes`   | Temps de sommeil dédupliqué, limité à aujourd’hui   |
| `restingHeartRateBpm`    | Fréquence cardiaque moyenne au repos                |
| `workoutCount`           | Entraînements commencés aujourd’hui                 |
| `workoutDurationMinutes` | Durée totale de ces entraînements                   |

Les champs de métriques sont facultatifs et sont omis lorsque HealthKit ne renvoie aucune valeur lisible. Les phases de sommeil et les sources qui se chevauchent sont fusionnées avant le calcul de la durée afin qu’une même minute ne soit pas comptée deux fois.

## Comportement relatif à la confidentialité

- L’agrégation s’effectue sur l’iPhone. Les échantillons bruts ne quittent pas l’appareil.
- L’agrégat demandé quitte l’iPhone via votre Gateway. Lorsqu’un agent le demande, l’agrégat parvient au fournisseur d’IA configuré et peut rester dans l’historique de la conversation. Un appel direct depuis la CLI le renvoie à l’opérateur de la CLI.
- OpenClaw demande uniquement un accès en lecture. Il ne peut ni ajouter ni modifier les données Santé.
- OpenClaw lit HealthKit uniquement lorsque `health.summary` est appelée. Aucune ingestion de données de santé ne s’effectue en arrière-plan.
- HealthKit ne révèle délibérément pas si l’accès en lecture a été refusé. Une métrique manquante peut signifier que l’accès a été refusé, qu’aucun échantillon correspondant n’existe ou qu’un type de données est indisponible. OpenClaw ne peut pas distinguer ces situations.
- Le résumé fournit un contexte personnel de santé et de forme physique, et non un diagnostic ou un avis médical.

Pour arrêter le partage, revenez à **Health Summaries** et touchez **Disable**. L’iPhone retire alors la capacité Santé et la commande `health.summary` de la surface de son Node. Vous pouvez également retirer `health.summary` de `gateway.nodes.allowCommands` afin de fermer le contrôle d’accès côté Gateway.

## Résolution des problèmes

### La commande n’est pas déclarée par le Node

Vérifiez que les résumés Santé sont activés dans l’app iOS et que l’iPhone est connecté. Exécutez `openclaw nodes pending` et approuvez toute mise à jour des capacités, puis examinez de nouveau `openclaw nodes describe --node "<iPhone name>"`.

### La commande nécessite une activation explicite

Ajoutez `health.summary` à `gateway.nodes.allowCommands`. Vérifiez également que `gateway.nodes.denyCommands` ne la contient pas ; la liste de refus prévaut.

### `HEALTH_ACCESS_DISABLED`

Le commutateur de partage de l’app est désactivé. Activez **Health Summaries** sous **Privacy & Access** sur l’iPhone.

### Le résumé aboutit, mais des métriques sont manquantes

Ouvrez l’app Santé d’Apple et vérifiez que des données existent pour aujourd’hui. Vérifiez l’accès d’OpenClaw dans les réglages Santé d’Apple, mais ne considérez pas un résultat vide comme la preuve que l’accès a été refusé : HealthKit masque intentionnellement cette distinction.

### Les plages plus anciennes échouent

La commande accepte uniquement `{"period":"today"}`. Les résumés historiques et sur plusieurs jours ne sont pas pris en charge.

## Voir aussi

- [App iOS](/fr/platforms/ios)
- [Nodes](/fr/nodes)
- [Référence de configuration du Gateway](/fr/gateway/configuration-reference#gateway)
- [Audit de sécurité](/fr/gateway/security)
