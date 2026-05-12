---
read_when:
    - Comprendre les fiches, les versions, les installations, la publication et la modération
summary: Fonctionnement des fiches, versions, installations, publications, analyses et mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:43:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre pour les Skills et plugins OpenClaw. Il donne aux utilisateurs un
endroit pour découvrir des paquets, aux éditeurs un endroit pour publier des versions, et
à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces paquets en toute sécurité.

## Enregistrements du registre

Chaque fiche publique est un enregistrement du registre avec :

- un propriétaire et un slug ou un nom de paquet
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et l’attribution de la source
- des informations de journal des modifications et d’étiquettes comme `latest`
- des signaux de téléchargement, d’installation, d’étoile et de commentaire
- l’état d’analyse de sécurité et de modération

La page de fiche est l’endroit canonique où les utilisateurs peuvent examiner ce qu’une skill ou un
plugin affirme faire avant de l’installer.

## Skills

Une skill est un ensemble de texte versionné centré sur `SKILL.md`. Elle peut inclure
des fichiers de prise en charge, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour comprendre le nom de la skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer la skill et
aident les analyses automatisées à détecter les incohérences entre le comportement déclaré et le comportement observé.

Consultez [Format de skill](/fr/clawhub/skill-format).

## Plugins

Les plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées du paquet,
les informations de compatibilité, les liens source, les artefacts et les enregistrements de version.

Quand OpenClaw installe un plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de paquet peuvent inclure la compatibilité API,
la version minimale du gateway, les cibles hôtes, les exigences d’environnement et les condensés
d’artefacts.

Utilisez une source d’installation ClawHub explicite lorsque vous voulez que le registre soit la
source de vérité :

```bash
openclaw plugins install clawhub:<package>
```

## Publication

La publication crée un nouvel enregistrement de version immuable. Les éditeurs utilisent le CLI `clawhub`
pour les workflows de registre authentifiés :

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez des essais à blanc pour prévisualiser la charge utile résolue avant l’envoi. Les pages publiques
exposent ensuite les métadonnées publiées, les fichiers, l’attribution de la source et l’état de l’analyse.

## Installations et mises à jour

Les commandes d’installation OpenClaw utilisent ClawHub comme source de paquet :

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de source d’installation afin que les mises à jour puissent résoudre le même
paquet du registre ultérieurement. Le CLI ClawHub prend également en charge les workflows directs d’installation et
de mise à jour de skills pour les utilisateurs qui veulent des dossiers de skills gérés par le registre en dehors d’un
espace de travail OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises aux barrières d’envoi,
aux vérifications automatisées, aux signalements des utilisateurs et aux actions de modération.

Les pages publiques affichent des résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître des flux de recherche et d’installation publics tout en restant
visible par le propriétaire pour le diagnostic.

Consultez [Sécurité + modération](/fr/clawhub/security) et
[Utilisation acceptable](/fr/clawhub/acceptable-usage).

## Accès API

ClawHub expose des API publiques en lecture pour la découverte, la recherche, les détails des paquets et
les téléchargements. Les catalogues tiers peuvent utiliser ces API lorsqu’ils renvoient vers la
fiche ClawHub canonique, respectent les limites de débit et évitent de suggérer une approbation.

Consultez [API publique](/fr/clawhub/api) et [API HTTP](/fr/clawhub/http-api).
