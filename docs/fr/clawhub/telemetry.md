---
read_when:
    - Travail sur les contrôles de télémétrie et de confidentialité
    - Questions sur les données collectées
summary: Télémétrie d’installation collectée via `clawhub sync` + option de désactivation.
x-i18n:
    generated_at: "2026-05-11T20:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Télémétrie

ClawHub utilise une **télémétrie minimale** pour calculer les **nombres d’installations** (ce qui est réellement utilisé) et améliorer le tri/filtrage.
Cela repose sur la commande CLI `clawhub sync`.

## Quand la télémétrie est collectée

La télémétrie n’est envoyée que lorsque :

- Vous êtes **connecté** dans la CLI (nous exigeons déjà l’authentification pour les flux de synchronisation/publication).
- Vous exécutez `clawhub sync`.
- La télémétrie n’est **pas désactivée** (voir « Comment désactiver » ci-dessous).

Si vous n’êtes pas connecté, rien n’est signalé.

## Ce que nous collectons

À chaque `clawhub sync`, la CLI signale un **instantané complet** de ce qu’elle a trouvé, regroupé par racine d’analyse (« dossier/racine »).

Pour chaque racine, nous stockons :

- `rootId` : un **hachage SHA-256** du chemin racine canonique (le serveur ne voit jamais le chemin brut).
- `label` : un libellé lisible par l’humain dérivé des deux derniers segments du chemin (les chemins du dossier personnel sont affichés avec `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` facultatif.

Pour chaque skill trouvée sous une racine, nous stockons :

- `skillId` (résolue par slug ; seules les skills qui existent dans le registre sont suivies).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (au mieux ; actuellement la version correspondant au registre si elle est connue).
- `removedAt` facultatif lorsqu’une installation précédemment signalée disparaît d’une racine.

### Ce que nous ne collectons _pas_

- Aucun chemin de dossier absolu brut (uniquement un `rootId` haché + un court libellé d’affichage).
- Aucun contenu de fichier.
- Aucun journal par exécution, prompt ou autre sortie de la CLI.
- Aucun suivi pour les skills qui ne sont pas téléversées dans le registre (les slugs inconnus sont ignorés).

## Nombres d’installations

Nous conservons deux compteurs par skill :

- `installsCurrent` : utilisateurs uniques qui ont actuellement la skill installée dans au moins une racine active.
- `installsAllTime` : utilisateurs uniques qui ont déjà signalé la skill comme installée.

### Racines multiples

Si vous synchronisez depuis plusieurs dossiers, nous traitons chaque racine d’analyse indépendamment. Une skill est « actuellement installée » si elle existe dans **n’importe quelle** racine active.

### Détection de désinstallation

Comme `sync` signale l’ensemble complet par racine :

- Si une skill disparaît d’une racine lors de la synchronisation suivante, nous la marquons comme supprimée pour cette racine.
- Si la skill est supprimée de toutes vos racines, elle n’est plus comptabilisée dans `installsCurrent`.
- `installsAllTime` ne diminue jamais, sauf si vous supprimez la télémétrie (voir ci-dessous).

### Obsolescence (120 jours)

Les racines qui ne signalent aucune télémétrie pendant **120 jours** sont marquées comme obsolètes, et leurs installations cessent de compter dans `installsCurrent`.
Cette évaluation est faite paresseusement (lors du prochain rapport de télémétrie) afin d’éviter les tâches en arrière-plan.

## Transparence + contrôles utilisateur

ClawHub fournit un onglet privé « Installé » sur votre propre profil :

- Affiche les racines exactes + les skills installées que nous stockons.
- Inclut une vue d’**export JSON**.
- Inclut une action **Supprimer la télémétrie** pour supprimer toute la télémétrie stockée pour votre compte.

Tout le monde ne voit que les **compteurs d’installations agrégés** ; personne d’autre ne peut voir vos racines/dossiers.

La suppression de votre compte supprime également vos données de télémétrie.

## Comment désactiver la télémétrie

Définissez la variable d’environnement :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Avec ce réglage, la CLI n’enverra pas de télémétrie pendant `clawhub sync`.
