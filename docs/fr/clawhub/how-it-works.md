---
read_when:
    - Comprendre les listes, les versions, les installations, la publication et la modération
summary: Fonctionnement des listings, versions, installations, publications, analyses et mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-06-28T05:06:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre pour les Skills et Plugins OpenClaw. Il offre aux utilisateurs un
espace pour découvrir des packages, aux éditeurs un espace pour publier des versions, et
fournit à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces packages en toute sécurité.

## Enregistrements du registre

Chaque fiche publique est un enregistrement du registre avec :

- un propriétaire et un slug ou un nom de package
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et l’attribution de la source
- des informations de changelog et de tags telles que `latest`
- des signaux de téléchargement, d’installation et d’étoiles
- l’état de l’analyse de sécurité et de la modération

La page de fiche est l’endroit canonique où les utilisateurs peuvent examiner ce qu’un Skill ou
Plugin affirme faire avant de l’installer.

## Skills

Un Skill est un bundle de texte versionné centré sur `SKILL.md`. Il peut inclure
des fichiers de support, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour comprendre le nom du Skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer le Skill et
aident les analyses automatisées à détecter les incohérences entre le comportement déclaré et observé.

Voir [Format des Skills](/fr/clawhub/skill-format).

## Plugins

Les Plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées de package,
les informations de compatibilité, les liens vers les sources, les artefacts et les enregistrements de version.

Quand OpenClaw installe un Plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de package peuvent inclure la compatibilité d’API,
la version minimale du Gateway, les cibles hôtes, les exigences d’environnement et les
empreintes d’artefacts.

Utilisez une source d’installation ClawHub explicite lorsque vous voulez que le registre soit la
source de vérité :

```bash
openclaw plugins install clawhub:<package>
```

## Publication

La publication crée un nouvel enregistrement de version immuable. Les éditeurs utilisent la CLI `clawhub`
pour les workflows de registre authentifiés :

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez les essais à blanc pour prévisualiser le payload résolu avant l’envoi. Les pages publiques
affichent ensuite les métadonnées publiées, les fichiers, l’attribution de la source et l’état de l’analyse.

## Installations et mises à jour

Les commandes d’installation OpenClaw utilisent ClawHub comme source de packages :

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de source d’installation afin que les mises à jour puissent résoudre le même
package de registre ultérieurement. La CLI ClawHub prend aussi en charge les workflows directs d’installation et
de mise à jour de Skills pour les utilisateurs qui veulent des dossiers de Skills gérés par le registre hors d’un
workspace OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises à des garde-fous d’envoi,
des vérifications automatisées, des signalements d’utilisateurs et des actions de modération.

Les pages publiques affichent les résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître des flux publics de recherche et d’installation tout en restant
visible pour le propriétaire à des fins de diagnostic.

Voir [Sécurité](/fr/clawhub/security), [Audits de sécurité](/fr/clawhub/security-audits),
[Modération et sécurité des comptes](/fr/clawhub/moderation), et
[Utilisation acceptable](/fr/clawhub/acceptable-usage).

## Accès API

ClawHub expose des API publiques en lecture pour la découverte, la recherche, les détails de packages et les
téléchargements. Les catalogues tiers peuvent utiliser ces API lorsqu’ils renvoient vers la
fiche ClawHub canonique, respectent les limites de débit et évitent de laisser entendre une approbation.

Voir [API publique](/fr/clawhub/api) et [API HTTP](/fr/clawhub/http-api).
