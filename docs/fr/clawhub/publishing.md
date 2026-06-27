---
read_when:
    - Publication d’une skill ou d’un plugin
    - Débogage des erreurs de propriétaire ou de périmètre de package
    - Ajouter une interface de publication, un comportement CLI ou un comportement backend
summary: Fonctionnement de la publication ClawHub pour les Skills, les plugins, les propriétaires, les portées, les versions et la revue.
x-i18n:
    generated_at: "2026-06-27T17:16:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publication

La publication envoie un dossier de skill ou un package de plugin vers ClawHub sous le propriétaire que vous
choisissez. ClawHub vérifie que votre jeton peut publier pour ce propriétaire, valide les
métadonnées, le nom, la version, les fichiers et les informations de source, puis stocke la version
et lance des contrôles de sécurité automatisés.

Si la validation échoue, rien n'est publié. Les nouvelles versions peuvent aussi rester en dehors des
surfaces normales d'installation et de téléchargement jusqu'à la fin de l'examen.

## Skills

Le chemin de publication le plus simple est la CLI. Connectez-vous, puis publiez un dossier de skill
local :

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Utilisez `--owner <handle>` lors de la publication vers un propriétaire d'organisation. Omettez-le pour publier en tant
qu'utilisateur authentifié. La publication ignore le contenu inchangé. Un nouveau skill commence
à `1.0.0`, et les changements ultérieurs publient automatiquement la version de correctif suivante. Passez
`--version` uniquement lorsque vous avez besoin d'une version explicite.

Pour les dépôts de catalogue, utilisez le workflow réutilisable
[`skill-publish.yml` de ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Il appelle `skill publish` pour chaque dossier de skill immédiat sous `root` (par défaut :
`skills`), ou uniquement le dossier fourni comme `skill_path`.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Utilisez `dry_run: true` pour prévisualiser les skills nouveaux et modifiés sans publier.

## Plugins

Les plugins utilisent des noms de package de style npm. Les noms de package avec portée incluent le propriétaire dans
la première partie du nom :

```text
@owner/package-name
```

La portée doit correspondre au propriétaire de publication sélectionné. Si votre package s'appelle
`@openclaw/dronzer`, il ne peut être publié qu'en tant que `@openclaw`. Si vous publiez en tant que
`@vintageayu`, renommez le package en `@vintageayu/dronzer`.

Cela empêche un package de revendiquer un espace de noms d'organisation que l'éditeur ne
contrôle pas.

Si vous êtes le propriétaire légitime d'une organisation, d'une marque, d'une portée de package, d'un identifiant de propriétaire ou d'un
espace de noms déjà revendiqué ou réservé sur ClawHub, ouvrez une
[demande de revendication d'organisation / d'espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
avec une preuve publique non sensible. Consultez
[Revendications d'organisation et d'espace de noms](/fr/clawhub/namespace-claims) pour savoir quoi inclure et quoi
exclure des issues publiques.

### Avant de publier un Plugin

- Choisissez un propriétaire qui correspond à la portée du package.
- Incluez `openclaw.plugin.json`. Les plugins de code ont également besoin de `package.json` avec
  `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.
- Pour afficher une icône de carte de plugin personnalisée, ajoutez `icon` à `openclaw.plugin.json` avec
  n'importe quelle URL d'image HTTPS.
- Incluez le dépôt source et les métadonnées exactes du commit, ou utilisez la CLI depuis un
  checkout adossé à GitHub afin qu'elle puisse les détecter.
- Exécutez `clawhub package validate <source>` avant de publier. Pour les constats liés au package,
  au manifeste, aux imports SDK ou aux artefacts, consultez
  [Corrections de validation de Plugin](/fr/clawhub/plugin-validation-fixes).
- Exécutez `clawhub package publish <source> --dry-run` avant de créer une version.
- Attendez-vous à ce que les nouvelles versions restent en dehors des surfaces d'installation publiques jusqu'à la fin des
  contrôles de sécurité automatisés et de la vérification.

### Publication de confiance pour les packages

La publication de confiance des packages se configure en deux étapes :

1. Publiez le package une première fois via `clawhub package publish` normal, manuel ou authentifié par jeton.
   Cela crée la ligne du package et établit les
   gestionnaires du package qui peuvent modifier sa configuration d'éditeur de confiance.
2. Un gestionnaire du package définit la configuration d'éditeur de confiance GitHub Actions :

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Une fois la configuration définie, les futures publications GitHub Actions prises en charge peuvent utiliser
OIDC/la publication de confiance sans stocker de jeton ClawHub de longue durée dans le
dépôt. Le dépôt configuré et le nom du fichier de workflow doivent correspondre à la
revendication OIDC GitHub Actions. Si vous passez aussi `--environment <name>`, la revendication d'environnement GitHub
Actions doit correspondre exactement à ce nom.

ClawHub vérifie le dépôt GitHub configuré lorsque la configuration d'éditeur de confiance
est définie. Les dépôts publics peuvent être vérifiés via les métadonnées publiques de GitHub.
Les dépôts privés exigent que ClawHub ait accès à ce dépôt GitHub,
par exemple via une future installation de GitHub App ClawHub ou une autre
intégration GitHub autorisée.

Le workflow réutilisable actuel de publication de package prend en charge la publication de confiance sans secret
pour les publications `workflow_dispatch` lorsque `id-token: write` est
disponible. Les vraies publications déclenchées par poussée de tag nécessitent toujours `clawhub_token`, donc gardez
`CLAWHUB_TOKEN` disponible pour les versions par tag, les premières publications, les packages non fiables
ou les publications d'urgence.

Inspectez ou supprimez la configuration avec :

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

La suppression de la configuration d'éditeur de confiance est le chemin de retour arrière. Elle désactive la future
création de jetons de publication de confiance jusqu'à ce qu'un gestionnaire du package redéfinisse la configuration.

## FAQ

### La portée du package doit correspondre au propriétaire sélectionné

Si la portée du package et le propriétaire sélectionné ne correspondent pas, ClawHub rejette la
publication :

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Pour corriger cela, choisissez soit le propriétaire nommé par la portée du package, soit renommez le
package afin que la portée corresponde au propriétaire sous lequel vous pouvez publier.

Si le nom du package a déjà la bonne portée mais que le package appartient au
mauvais éditeur, transférez plutôt la propriété :

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Utilisez le transfert de package ou de skill uniquement lorsque vous disposez d'un accès administrateur à la fois au
propriétaire actuel et à l'éditeur de destination. Le transfert de package ne vous permet pas de
publier dans une portée que vous ne pouvez pas gérer.

Si vous n'avez pas accès au propriétaire actuel mais pensez que votre organisation, projet ou
marque est le propriétaire légitime de l'espace de noms, ouvrez une
[demande de revendication d'organisation / d'espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
avec une preuve publique non sensible pour examen par l'équipe. Consultez
[Revendications d'organisation et d'espace de noms](/fr/clawhub/namespace-claims) avant de déposer la demande.

Cela protège les espaces de noms des organisations. Un package nommé `@openclaw/dronzer` revendique
l'espace de noms `@openclaw`, donc seuls les éditeurs ayant accès au propriétaire `@openclaw`
peuvent le publier.
