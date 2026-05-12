---
read_when:
    - Comprendre les fiches, les versions, les installations, la publication et la modération
summary: Fonctionnement des fiches, versions, installations, publications, analyses et mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-05-12T12:48:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre pour les Skills et les plugins OpenClaw. Il offre aux utilisateurs un
endroit où découvrir des paquets, aux éditeurs un endroit où publier des versions, et
à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces paquets en toute sécurité.

## Enregistrements du registre

Chaque fiche publique est un enregistrement du registre avec :

- un propriétaire et un slug ou nom de paquet
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et l’attribution de la source
- des informations de changelog et d’étiquettes telles que `latest`
- des signaux de téléchargement, d’installation, d’étoile et de commentaire
- l’état de l’analyse de sécurité et de la modération

La page de fiche est l’emplacement canonique où les utilisateurs peuvent examiner ce qu’un Skill ou
un plugin affirme faire avant de l’installer.

## Skills

Un Skill est un paquet de texte versionné centré sur `SKILL.md`. Il peut inclure
des fichiers de prise en charge, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour comprendre le nom du Skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer le Skill et
aident les analyses automatisées à détecter les incohérences entre le comportement déclaré et le comportement observé.

Voir [Format de Skill](/fr/clawhub/skill-format).

## Plugins

Les plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées des paquets,
les informations de compatibilité, les liens source, les artefacts et les enregistrements de versions.

Quand OpenClaw installe un plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de paquet peuvent inclure la compatibilité de l’API,
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

Les commandes d’installation OpenClaw utilisent ClawHub comme source de paquet :

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de source d’installation afin que les mises à jour puissent résoudre le même
paquet du registre ultérieurement. La CLI ClawHub prend également en charge les workflows directs d’installation et
de mise à jour de Skills pour les utilisateurs qui veulent des dossiers de Skills gérés par le registre en dehors d’un
espace de travail OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises à des garde-fous d’envoi,
des vérifications automatisées, des signalements d’utilisateurs et des actions de modération.

Les pages publiques affichent des résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître de la recherche publique et des flux d’installation tout en restant
visible par le propriétaire à des fins de diagnostic.

Voir [Sécurité + modération](/fr/clawhub/security) et
[Utilisation acceptable](/fr/clawhub/acceptable-usage).

## Accès à l’API

ClawHub expose des API de lecture publiques pour la découverte, la recherche, les détails des paquets et
les téléchargements. Les catalogues tiers peuvent utiliser ces API lorsqu’ils renvoient vers la
fiche ClawHub canonique, respectent les limites de débit et évitent de suggérer une approbation.

Voir [API publique](/fr/clawhub/api) et [API HTTP](/fr/clawhub/http-api).
