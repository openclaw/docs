---
read_when:
    - Comprendre les fiches, les versions, les installations, la publication et la modération
summary: Fonctionnement des fiches ClawHub, des versions, des installations, de la publication, des analyses et des mises à jour.
x-i18n:
    generated_at: "2026-05-11T20:23:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre pour les Skills et les plugins OpenClaw. Il offre aux utilisateurs un
endroit pour découvrir des packages, aux éditeurs un endroit pour publier des versions, et
fournit à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces packages en toute sécurité.

## Enregistrements du registre

Chaque fiche publique est un enregistrement du registre avec :

- un propriétaire et un slug ou un nom de package
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et l’attribution de la source
- des informations de changelog et de tags comme `latest`
- des signaux de téléchargement, d’installation, d’étoile et de commentaire
- l’état de l’analyse de sécurité et de la modération

La page de fiche est l’endroit canonique où les utilisateurs peuvent examiner ce qu’un skill ou
plugin affirme faire avant de l’installer.

## Skills

Un skill est un bundle texte versionné centré sur `SKILL.md`. Il peut inclure
des fichiers de support, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour comprendre le nom du skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer le skill et
aident les analyses automatisées à détecter les incohérences entre le comportement déclaré et le comportement observé.

Voir [Format de skill](/fr/clawhub/skill-format).

## Plugins

Les plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées du package,
les informations de compatibilité, les liens source, les artefacts et les enregistrements de version.

Quand OpenClaw installe un plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de package peuvent inclure la compatibilité API,
la version minimale du Gateway, les cibles hôtes, les exigences d’environnement et les condensats
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
affichent ensuite les métadonnées publiées, les fichiers, l’attribution de la source et l’état de l’analyse.

## Installations et mises à jour

Les commandes d’installation OpenClaw utilisent ClawHub comme source de package :

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de source d’installation afin que les mises à jour puissent résoudre le même
package du registre plus tard. La CLI ClawHub prend aussi en charge les workflows directs d’installation et
de mise à jour de skills pour les utilisateurs qui veulent des dossiers de skills gérés par le registre en dehors d’un
workspace OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises aux portes d’envoi,
aux vérifications automatisées, aux signalements des utilisateurs et aux actions des modérateurs.

Les pages publiques affichent les résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître de la recherche publique et des flux d’installation tout en restant
visible pour le propriétaire à des fins de diagnostic ou d’appel.

Voir [Sécurité + modération](/fr/clawhub/security) et
[Usage acceptable](/fr/clawhub/acceptable-usage).

## Accès API

ClawHub expose des API publiques en lecture pour la découverte, la recherche, les détails des packages et
les téléchargements. Les catalogues tiers peuvent utiliser ces API lorsqu’ils renvoient vers la
fiche ClawHub canonique, respectent les limites de débit et évitent de suggérer une approbation.

Voir [API publique](/fr/clawhub/api) et [API HTTP](/fr/clawhub/http-api).
