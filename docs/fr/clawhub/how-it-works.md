---
read_when:
    - Comprendre les listes, les versions, les installations, la publication et la modération
summary: Fonctionnement des fiches, des versions, des installations, de la publication, des analyses et des mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-06-28T22:31:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre pour les Skills et Plugins OpenClaw. Il donne aux utilisateurs un
endroit où découvrir des paquets, aux éditeurs un endroit où publier des versions, et
à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces paquets en toute sécurité.

## Enregistrements de registre

Chaque fiche publique est un enregistrement de registre avec :

- un propriétaire et un slug ou un nom de paquet
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et une attribution de source
- des informations de journal des modifications et de balise comme `latest`
- des signaux de téléchargement, d’installation et d’étoiles
- un état d’analyse de sécurité et de modération

La page de fiche est l’endroit canonique où les utilisateurs peuvent examiner ce qu’une Skill ou un
Plugin prétend faire avant de l’installer.

## Skills

Une Skill est un ensemble de texte versionné centré sur `SKILL.md`. Elle peut inclure
des fichiers de support, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour comprendre le nom de la Skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer la Skill et
aident les analyses automatisées à détecter les incohérences entre le comportement déclaré et le comportement observé.

Voir [Format des Skills](/fr/clawhub/skill-format).

## Plugins

Les Plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées de paquet,
les informations de compatibilité, les liens source, les artefacts et les enregistrements de version.

Lorsque OpenClaw installe un Plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de paquet peuvent inclure la compatibilité d’API,
la version minimale du Gateway, les cibles hôtes, les exigences d’environnement et les empreintes
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

Les commandes d’installation OpenClaw utilisent ClawHub comme source de paquet :

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de source d’installation afin que les mises à jour puissent résoudre le même
paquet de registre ultérieurement. La CLI ClawHub prend aussi en charge les workflows d’installation et de
mise à jour directes des Skills pour les utilisateurs qui veulent des dossiers de Skills gérés par le registre en dehors d’un
espace de travail OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises à des barrières d’envoi,
des vérifications automatisées, des signalements d’utilisateurs et des actions de modération.

Les pages publiques affichent des résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître des flux publics de recherche et d’installation tout en restant
visible pour le propriétaire à des fins de diagnostic.

Voir [Sécurité](/fr/clawhub/security), [Audits de sécurité](/fr/clawhub/security-audits),
[Modération et sécurité du compte](/fr/clawhub/moderation), et
[Utilisation acceptable](/fr/clawhub/acceptable-usage).

## Accès API

ClawHub expose des API de lecture publiques pour la découverte, la recherche, les détails des paquets et les
téléchargements. Les catalogues tiers peuvent utiliser ces API lorsqu’ils créent un lien vers la
fiche canonique ClawHub, respectent les limites de débit et évitent de suggérer une approbation.

Voir [API publique](/fr/clawhub/api) et [API HTTP](/fr/clawhub/http-api).
