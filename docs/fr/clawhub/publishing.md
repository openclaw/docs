---
read_when:
    - Publication d’une compétence ou d’un Plugin
    - Débogage des erreurs de portée de propriétaire ou de paquet
    - Ajout d’un comportement de publication pour l’interface utilisateur, la CLI ou le côté serveur
summary: Fonctionnement de la publication ClawHub pour les Skills, les Plugins, les propriétaires, les portées, les versions et la revue.
x-i18n:
    generated_at: "2026-05-11T20:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publication

La publication sur ClawHub est limitée au propriétaire : chaque publication cible un éditeur, et le serveur décide si l’utilisateur connecté est autorisé à y publier.

## Propriétaires

Un propriétaire est un identifiant d’éditeur ClawHub, tel que `@alice` ou `@openclaw`.
Les propriétaires personnels sont créés pour les utilisateurs. Les propriétaires d’organisation peuvent avoir plusieurs membres.

Lorsque vous publiez, vous utilisez soit votre propriétaire personnel, soit vous choisissez un propriétaire d’organisation pour lequel vous disposez d’un accès d’éditeur.

## Skills

Les Skills sont publiées depuis un dossier de Skill. La page publique est :

```text
https://clawhub.ai/<owner>/<slug>
```

Exemple :

```text
https://clawhub.ai/alice/review-helper
```

La demande de publication inclut le propriétaire sélectionné, le slug, la version, le journal des modifications et les fichiers. Le serveur vérifie que l’acteur peut publier en tant que ce propriétaire avant de créer la version.

Pour déplacer une Skill existante vers un autre propriétaire tout en publiant une nouvelle version, choisissez le nouveau propriétaire et confirmez explicitement le déplacement de propriété. Dans la CLI/API, transmettez le propriétaire cible ainsi que l’acceptation explicite de la migration :

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

La migration du propriétaire d’une Skill nécessite un accès administrateur ou propriétaire sur le propriétaire actuel et sur le propriétaire de destination. Elle préserve la Skill, l’historique des versions, les statistiques, les commentaires, les forks, les alias et la piste d’audit ; les anciennes URL de propriétaire continuent de fonctionner via le chemin d’alias/de redirection.

## Plugins

Les plugins utilisent des noms de packages de style npm. Les noms de packages avec portée incluent le propriétaire dans la première partie du nom :

```text
@owner/package-name
```

La portée doit correspondre au propriétaire de publication sélectionné. Si votre package s’appelle `@openclaw/dronzer`, il ne peut être publié qu’en tant que `@openclaw`. Si vous publiez en tant que `@vintageayu`, renommez le package en `@vintageayu/dronzer`.

Cela empêche un package de revendiquer un espace de noms d’organisation que l’éditeur ne contrôle pas.

## Processus de publication

1. L’interface utilisateur, la CLI ou le workflow GitHub rassemble les métadonnées et les fichiers du package.
2. La demande de publication est envoyée à ClawHub avec le propriétaire sélectionné.
3. Le serveur valide les autorisations du propriétaire, la portée du package, le nom du package, la version,
   les limites de fichiers et les métadonnées de source.
4. ClawHub stocke la version et lance des contrôles de sécurité automatisés.
5. Les nouvelles versions sont masquées des surfaces normales d’installation/de téléchargement jusqu’à la fin
   de l’examen et de la vérification.

Si la validation échoue, la version n’est pas créée.

## FAQ

### La portée du package doit correspondre au propriétaire sélectionné

Si la portée du package et le propriétaire sélectionné ne correspondent pas, ClawHub rejette la publication :

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Pour résoudre le problème, choisissez le propriétaire nommé par la portée du package, ou renommez le package afin que la portée corresponde au propriétaire en tant que lequel vous pouvez publier.

Si le nom du package a déjà la bonne portée, mais que le package appartient au mauvais éditeur, transférez plutôt la propriété :

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

N’utilisez le transfert de package ou de Skill que lorsque vous disposez d’un accès administrateur au propriétaire actuel et à l’éditeur de destination. Le transfert de package ne vous permet pas de publier dans une portée que vous ne pouvez pas gérer.

Cela protège les espaces de noms d’organisation. Un package nommé `@openclaw/dronzer` revendique l’espace de noms `@openclaw`, donc seuls les éditeurs ayant accès au propriétaire `@openclaw` peuvent le publier.
