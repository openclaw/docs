---
read_when:
    - Comprendre les listes, les versions, les installations, la publication et la modération
summary: Fonctionnement des annonces, versions, installations, publications, analyses et mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-07-04T15:14:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre pour les skills et Plugins OpenClaw. Elle offre aux utilisateurs un
endroit où découvrir des packages, aux éditeurs un endroit où publier des versions, et
fournit à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces packages en toute sécurité.

## Enregistrements du registre

Chaque fiche publique est un enregistrement du registre avec :

- un propriétaire et un slug ou nom de package
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et une attribution de source
- des informations de journal des modifications et de balise telles que `latest`
- des signaux de téléchargement, d’installation et d’étoile
- un état d’analyse de sécurité et de modération

La page de fiche est l’endroit canonique où les utilisateurs peuvent examiner ce qu’une skill ou un
Plugin affirme faire avant de l’installer.

## Skills

Une skill est un bundle de texte versionné centré sur `SKILL.md`. Elle peut inclure
des fichiers de support, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour comprendre le nom de la skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer la skill et
aident les analyses automatisées à détecter les divergences entre le comportement déclaré et le comportement observé.

Voir [Format des skills](/fr/clawhub/skill-format).

## Plugins

Les Plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées des packages,
les informations de compatibilité, les liens sources, les artefacts et les enregistrements de version.

Quand OpenClaw installe un Plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de package peuvent inclure la compatibilité d’API,
la version minimale de Gateway, les cibles hôtes, les exigences d’environnement et les empreintes
d’artefacts.

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

Utilisez les exécutions à blanc pour prévisualiser la charge utile résolue avant l’envoi. Les pages publiques
affichent ensuite les métadonnées publiées, les fichiers, l’attribution de source et l’état d’analyse.

## Installations et mises à jour

Les commandes d’installation OpenClaw utilisent ClawHub comme source de package :

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de source d’installation afin que les mises à jour puissent résoudre le même
package de registre ultérieurement. La CLI ClawHub prend également en charge les workflows d’installation directe et de
mise à jour de skills pour les utilisateurs qui veulent des dossiers de skills gérés par le registre en dehors d’un
workspace OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises à des contrôles d’envoi,
des vérifications automatisées, des signalements d’utilisateurs et des actions de modération.

Les pages publiques affichent les résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître de la recherche publique et des flux d’installation tout en restant
visible par le propriétaire à des fins de diagnostic.

Voir [Sécurité](/clawhub/security), [Audits de sécurité](/clawhub/security-audits),
[Modération et sécurité des comptes](/fr/clawhub/moderation), et
[Utilisation acceptable](/clawhub/acceptable-usage).

## Accès API

ClawHub expose des API publiques en lecture pour la découverte, la recherche, les détails de packages et
les téléchargements. Les catalogues tiers peuvent utiliser ces API lorsqu’ils renvoient vers la
fiche canonique ClawHub, respectent les limites de débit et évitent de suggérer une approbation.

Voir [API publique](/fr/clawhub/api) et [API HTTP](/clawhub/http-api).
