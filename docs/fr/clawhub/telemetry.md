---
read_when:
    - Travail sur la télémétrie / les contrôles de confidentialité
    - Questions sur les données collectées
summary: Télémétrie d’installation collectée par la CLI ClawHub et comment s’y opposer.
x-i18n:
    generated_at: "2026-06-28T20:42:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Télémétrie

ClawHub utilise une télémétrie CLI minimale pour calculer les nombres agrégés d’installations.

## Quand la télémétrie est collectée

La télémétrie n’est envoyée que lorsque :

- Vous êtes connecté dans la CLI.
- Vous exécutez `clawhub install <slug>`.
- La télémétrie n’est **pas désactivée** (voir « Comment désactiver » ci-dessous).

Si vous n’êtes pas connecté, rien n’est signalé.

## Ce que nous collectons

À chaque `clawhub install` signalé, la CLI envoie un événement d’installation au mieux.

L’événement inclut :

- `slug` : le slug de la compétence installée.
- `version` : la version installée, lorsqu’elle est connue.

### Ce que nous ne collectons _pas_

- Aucun chemin de dossier ni identifiant dérivé d’un dossier.
- Aucun contenu de fichier.
- Aucun journal par exécution, prompt ou autre sortie de CLI.

## Nombre d’installations

ClawHub conserve des compteurs agrégés par compétence :

- `installsAllTime` : utilisateurs uniques ayant signalé au moins une installation CLI de la compétence.
- `installsCurrent` : utilisateurs uniques ayant signalé une installation et n’ayant pas supprimé leur
  télémétrie.

## Transparence + contrôles utilisateur

Tout le monde ne voit que des **compteurs d’installations agrégés**.

La suppression de votre compte supprime également vos données de télémétrie.

## Comment désactiver la télémétrie

Définissez la variable d’environnement :

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Lorsque cette variable est définie, la CLI n’envoie pas de télémétrie d’installation.
