---
doc-schema-version: 1
read_when:
    - Vous voulez trouver des plugins OpenClaw tiers
    - Vous souhaitez publier ou référencer votre propre plugin sur ClawHub
summary: Rechercher et publier des plugins OpenClaw maintenus par la communauté
title: Plugins communautaires
x-i18n:
    generated_at: "2026-06-27T17:46:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Les plugins communautaires sont des packages tiers qui étendent OpenClaw avec des canaux,
outils, fournisseurs, hooks ou d'autres capacités. Utilisez [ClawHub](/fr/clawhub) comme
surface principale de découverte des plugins communautaires publics.

## Trouver des plugins

Recherchez ClawHub depuis la CLI :

```bash
openclaw plugins search "calendar"
```

Installez un plugin ClawHub avec un préfixe de source explicite :

```bash
openclaw plugins install clawhub:<package-name>
```

npm reste un chemin d'installation directe pris en charge pendant la bascule de lancement :

```bash
openclaw plugins install npm:<package-name>
```

Utilisez [Gérer les plugins](/fr/plugins/manage-plugins) pour les exemples courants d'installation, de mise à jour,
d'inspection et de désinstallation. Utilisez [`openclaw plugins`](/fr/cli/plugins) pour la
référence complète des commandes et les règles de sélection de source.

## Publier des plugins

Publiez les plugins communautaires publics sur ClawHub lorsque vous voulez que les utilisateurs d'OpenClaw puissent
les découvrir et les installer. ClawHub possède la liste de packages active, l'historique des versions,
l'état d'analyse et les indications d'installation ; la documentation ne maintient pas de catalogue statique
de plugins tiers.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Avant de publier, assurez-vous que le plugin dispose de métadonnées de package, d'un manifeste de plugin,
d'une documentation de configuration et d'un propriétaire de maintenance clairement identifié. ClawHub valide le périmètre du propriétaire,
le nom du package, la version, les limites de fichiers et les métadonnées de source avant de créer une
version, puis garde les nouvelles versions masquées des surfaces normales d'installation et de téléchargement
jusqu'à la fin de la revue et de la vérification.

Utilisez cette liste de contrôle avant de publier :

| Exigence            | Pourquoi                                                |
| ------------------- | ------------------------------------------------------- |
| Publié sur ClawHub  | Les utilisateurs ont besoin que les indications `openclaw plugins install` fonctionnent |
| Dépôt GitHub public | Revue du code source, suivi des problèmes, transparence |
| Documentation de configuration et d'utilisation | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active  | Mises à jour récentes ou traitement réactif des problèmes |

Utilisez ces pages pour le contrat de publication complet :

- [Publication ClawHub](/fr/clawhub/publishing) explique les propriétaires, les périmètres, les versions,
  la revue, la validation des packages et le transfert de package.
- [Créer des plugins](/fr/plugins/building-plugins) montre la forme du package de plugin
  et le premier workflow de publication.
- [Manifeste de plugin](/fr/plugins/manifest) définit les champs natifs du manifeste de plugin.

## Connexe

- [Plugins](/fr/tools/plugin) - installer, configurer, redémarrer et dépanner
- [Gérer les plugins](/fr/plugins/manage-plugins) - exemples de commandes
- [Publication ClawHub](/fr/clawhub/publishing) - règles de publication et de version
