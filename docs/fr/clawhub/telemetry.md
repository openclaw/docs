---
read_when:
    - Travail sur les contrôles de télémétrie et de confidentialité
    - Questions sur les données collectées
summary: Télémétrie d’installation collectée par la CLI ClawHub et procédure de désactivation.
x-i18n:
    generated_at: "2026-07-12T02:28:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Télémétrie

ClawHub utilise une télémétrie CLI minimale pour calculer le nombre agrégé d’installations.

## Quand la télémétrie est collectée

La télémétrie est envoyée uniquement lorsque :

- Vous êtes connecté dans la CLI.
- Vous exécutez `clawhub install <slug>`.
- La télémétrie n’est **pas désactivée** (voir « Comment la désactiver » ci-dessous).

Si vous n’êtes pas connecté, aucune donnée n’est transmise.

## Ce que nous collectons

Pour chaque commande `clawhub install` signalée, la CLI envoie, dans la mesure du possible, un événement d’installation.

L’événement comprend :

- `slug` : le slug de la Skill installée.
- `version` : la version installée, lorsqu’elle est connue.

### Ce que nous ne collectons _pas_

- Aucun chemin de dossier ni identifiant dérivé d’un dossier.
- Aucun contenu de fichier.
- Aucun journal d’exécution, prompt ou autre résultat de la CLI.

## Nombre d’installations

ClawHub conserve des compteurs agrégés pour chaque Skill :

- `installsAllTime` : nombre d’utilisateurs uniques ayant signalé au moins une installation de la Skill via la CLI.
- `installsCurrent` : nombre d’utilisateurs uniques ayant signalé une installation et n’ayant pas supprimé leurs
  données de télémétrie.

## Transparence et contrôles utilisateur

Seuls les **compteurs d’installations agrégés** sont visibles par tous.

La suppression de votre compte entraîne également celle de vos données de télémétrie.

## Comment désactiver la télémétrie

Définissez la variable d’environnement :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Une fois cette variable définie, la CLI n’enverra aucune donnée de télémétrie relative aux installations.
