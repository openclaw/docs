---
read_when:
    - Comprendre les listes, les versions, les installations, la publication et la modération
summary: Fonctionnement des listings, versions, installations, publications, analyses et mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-06-30T13:57:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre pour les Skills et Plugins OpenClaw. Elle donne aux utilisateurs un
emplacement où découvrir des paquets, aux éditeurs un emplacement où publier des versions, et
à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces paquets en toute sécurité.

## Enregistrements du registre

Chaque fiche publique est un enregistrement du registre avec :

- un propriétaire et un slug ou un nom de paquet
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et l’attribution de la source
- un journal des modifications et des informations de balise telles que `latest`
- des signaux de téléchargement, d’installation et d’étoile
- l’état de l’analyse de sécurité et de la modération

La page de la fiche est l’emplacement canonique où les utilisateurs peuvent examiner ce qu’une skill ou un
plugin affirme faire avant de l’installer.

## Skills

Une skill est un ensemble de texte versionné centré sur `SKILL.md`. Elle peut inclure
des fichiers de prise en charge, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour comprendre le nom de la skill,
sa description, ses prérequis, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer la skill et
aident les analyses automatisées à détecter les incohérences entre le comportement déclaré et le comportement observé.

Voir [Format des skills](/fr/clawhub/skill-format).

## Plugins

Les Plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées des paquets,
les informations de compatibilité, les liens vers les sources, les artefacts et les enregistrements de version.

Quand OpenClaw installe un plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de paquet peuvent inclure la compatibilité d’API,
la version minimale du Gateway, les cibles d’hôte, les prérequis d’environnement et les condensés
d’artefact.

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

Les commandes d’installation OpenClaw utilisent ClawHub comme source de paquets :

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de source d’installation afin que les mises à jour puissent résoudre le même
paquet du registre ultérieurement. La CLI ClawHub prend également en charge des workflows d’installation et
de mise à jour directs des skills pour les utilisateurs qui veulent des dossiers de skills gérés par le registre en dehors d’un
espace de travail OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises à des contrôles d’envoi,
des vérifications automatisées, des signalements d’utilisateurs et des actions de modération.

Les pages publiques affichent des résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître des flux de recherche et d’installation publics tout en restant
visible par le propriétaire à des fins de diagnostic.

Voir [Sécurité](/clawhub/security), [Audits de sécurité](/clawhub/security-audits),
[Modération et sécurité du compte](/fr/clawhub/moderation), et
[Utilisation acceptable](/clawhub/acceptable-usage).

## Accès API

ClawHub expose des API de lecture publiques pour la découverte, la recherche, les détails des paquets et les
téléchargements. Les catalogues tiers peuvent utiliser ces API lorsqu’ils renvoient vers la fiche
ClawHub canonique, respectent les limites de débit et évitent de sous-entendre une approbation.

Voir [API publique](/clawhub/api) et [API HTTP](/clawhub/http-api).
