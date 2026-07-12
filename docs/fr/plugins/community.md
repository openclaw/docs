---
doc-schema-version: 1
read_when:
    - Vous souhaitez trouver des plugins OpenClaw tiers
    - Vous souhaitez publier ou répertorier votre propre plugin sur ClawHub
summary: Rechercher et publier des plugins OpenClaw maintenus par la communauté
title: Plugins communautaires
x-i18n:
    generated_at: "2026-07-12T15:42:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Les plugins communautaires sont des paquets tiers qui étendent OpenClaw avec
des canaux, des outils, des fournisseurs, des hooks ou d’autres fonctionnalités. Utilisez
[ClawHub](/fr/clawhub) comme interface principale de découverte des plugins
communautaires publics.

## Rechercher des plugins

Recherchez dans ClawHub depuis la CLI :

```bash
openclaw plugins search "calendar"
```

Installez un plugin ClawHub avec un préfixe de source explicite :

```bash
openclaw plugins install clawhub:<package-name>
```

npm reste une méthode d’installation directe prise en charge pendant la transition du lancement :

```bash
openclaw plugins install npm:<package-name>
```

Consultez [Gérer les plugins](/fr/plugins/manage-plugins) pour obtenir des exemples courants d’installation, de mise à jour,
d’inspection et de désinstallation. Consultez [`openclaw plugins`](/fr/cli/plugins) pour
la référence complète des commandes et les règles de sélection de la source.

## Publier des plugins

Publiez les plugins communautaires publics sur ClawHub afin que les utilisateurs d’OpenClaw puissent les découvrir
et les installer. ClawHub gère la liste active des paquets, l’historique des versions,
l’état de l’analyse et les indications d’installation ; la documentation ne tient pas à jour de catalogue
statique des plugins tiers.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Avant la publication, assurez-vous que le plugin dispose de métadonnées de paquet, d’un
manifeste de plugin, d’une documentation de configuration et d’un responsable de maintenance clairement identifié. ClawHub valide le périmètre
du propriétaire, le nom du paquet, la version, les limites de fichiers et les métadonnées de la source avant
de créer une version, puis masque les nouvelles versions des interfaces habituelles d’installation et
de téléchargement jusqu’à la fin de l’examen et de la vérification.

Liste de contrôle avant la publication :

| Exigence             | Raison                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Publié sur ClawHub   | Les indications de `openclaw plugins install` doivent fonctionner pour les utilisateurs |
| Dépôt GitHub public  | Examen du code source, suivi des problèmes, transparence                |
| Documentation de configuration et d’utilisation | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active   | Mises à jour récentes ou traitement réactif des problèmes               |

Contrat de publication complet :

- [Publication sur ClawHub](/fr/clawhub/publishing) - propriétaires, périmètres, versions,
  examen, validation des paquets et transfert de paquet
- [Créer des plugins](/fr/plugins/building-plugins) - la structure du paquet de plugin
  et le processus de première publication
- [Manifeste de plugin](/fr/plugins/manifest) - champs du manifeste de plugin natif

## Voir aussi

- [Plugins](/fr/tools/plugin) - installer, configurer, redémarrer et résoudre les problèmes
- [Gérer les plugins](/fr/plugins/manage-plugins) - exemples de commandes
- [Publication sur ClawHub](/fr/clawhub/publishing) - règles de publication et de mise à disposition
