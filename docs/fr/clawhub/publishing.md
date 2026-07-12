---
read_when:
    - Publication d’une Skill ou d’un Plugin
    - Débogage des erreurs de propriétaire ou de portée de package
    - Ajout d’un comportement de publication dans l’interface utilisateur, la CLI ou le backend
summary: Fonctionnement de la publication sur ClawHub pour les Skills, les plugins, les propriétaires, les portées, les versions et la validation.
x-i18n:
    generated_at: "2026-07-12T02:40:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publication

La publication envoie un dossier de skill ou un paquet de Plugin à ClawHub sous le propriétaire que vous choisissez. ClawHub vérifie que votre jeton autorise la publication pour ce propriétaire, valide les métadonnées, le nom, la version, les fichiers et les informations sur la source, puis stocke la version publiée et lance des contrôles de sécurité automatisés.

Si la validation échoue, rien n'est publié. Les nouvelles versions peuvent également rester absentes des interfaces habituelles d'installation et de téléchargement jusqu'à la fin de la vérification.

## Skills

La méthode de publication la plus simple utilise la CLI. Connectez-vous, puis publiez un dossier de skill local :

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Utilisez `--owner <handle>` pour publier sous le propriétaire d'une organisation. Omettez cette option pour publier en tant qu'utilisateur authentifié. La publication ignore le contenu inchangé. Un nouveau skill commence à la version `1.0.0`, et les modifications ultérieures publient automatiquement la version corrective suivante. N'utilisez `--version` que lorsqu'une version explicite est nécessaire.

Pour les dépôts de catalogues, utilisez le
[workflow réutilisable `skill-publish.yml` de ClawHub](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml).
Il appelle `skill publish` pour chaque dossier de skill directement situé sous `root` (par défaut :
`skills`), ou uniquement pour le dossier fourni dans `skill_path`.

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

Utilisez `dry_run: true` pour prévisualiser les Skills nouveaux et modifiés sans les publier.

## Plugins

Les Plugins utilisent des noms de paquets au format npm. Les noms de paquets avec portée incluent le propriétaire dans la première partie du nom :

```text
@owner/package-name
```

La portée doit correspondre au propriétaire sélectionné pour la publication. Si votre paquet s'appelle `@openclaw/dronzer`, il ne peut être publié que sous `@openclaw`. Si vous publiez sous `@vintageayu`, renommez le paquet en `@vintageayu/dronzer`.

Cela empêche un paquet de revendiquer l'espace de noms d'une organisation que l'éditeur ne contrôle pas.

Si vous êtes le propriétaire légitime d'une organisation, d'une marque, d'une portée de paquet, d'un identifiant de propriétaire ou d'un espace de noms déjà revendiqué ou réservé sur ClawHub, ouvrez un
[ticket de revendication d'organisation ou d'espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
avec des preuves publiques et non sensibles. Consultez
[Revendications d'organisations et d'espaces de noms](/clawhub/namespace-claims) pour savoir quels éléments inclure et lesquels ne pas publier dans les tickets publics.

### Avant de publier un Plugin

- Choisissez un propriétaire correspondant à la portée du paquet.
- Incluez `openclaw.plugin.json`. Les Plugins comportant du code nécessitent également un fichier `package.json` avec
  `openclaw.compat.pluginApi` et `openclaw.build.openclawVersion`.
- Pour afficher une icône personnalisée sur la fiche du Plugin, ajoutez `icon` à `openclaw.plugin.json` avec
  n'importe quelle URL d'image HTTPS.
- Incluez le dépôt source et les métadonnées exactes du commit, ou utilisez la CLI depuis une copie de travail provenant de GitHub afin qu'elle puisse les détecter.
- Exécutez `clawhub package validate <source>` avant la publication. Pour les problèmes concernant le paquet, le manifeste, les imports du SDK ou l'artefact, consultez
  [Corrections des erreurs de validation des Plugins](/clawhub/plugin-validation-fixes).
- Exécutez `clawhub package publish <source> --dry-run` avant de créer une version.
- Attendez-vous à ce que les nouvelles versions restent absentes des interfaces publiques d'installation jusqu'à la fin des contrôles de sécurité automatisés et de la vérification.

### Publication approuvée pour les paquets

La configuration de la publication approuvée des paquets s'effectue en deux étapes :

1. Publiez une première fois le paquet par la méthode manuelle habituelle ou avec la commande authentifiée par jeton
   `clawhub package publish`. Cela crée l'entrée du paquet et désigne les gestionnaires du paquet autorisés à modifier la configuration de son éditeur approuvé.
2. Un gestionnaire du paquet définit la configuration de l'éditeur approuvé pour GitHub Actions :

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Une fois la configuration définie, les futures publications compatibles depuis GitHub Actions peuvent utiliser OIDC et la publication approuvée sans stocker de jeton ClawHub à longue durée de vie dans le dépôt. Le dépôt et le nom du fichier de workflow configurés doivent correspondre à la revendication OIDC de GitHub Actions. Si vous transmettez également `--environment <name>`, la revendication d'environnement de GitHub Actions doit correspondre exactement à ce nom.

ClawHub vérifie le dépôt GitHub configuré lors de la définition de la configuration de l'éditeur approuvé. Les dépôts publics peuvent être vérifiés à l'aide des métadonnées GitHub publiques. Pour les dépôts privés, ClawHub doit disposer d'un accès GitHub au dépôt, par exemple au moyen d'une future installation de l'application GitHub ClawHub ou d'une autre intégration GitHub autorisée.

Le workflow réutilisable actuel de publication des paquets prend en charge la publication approuvée sans secret pour les publications déclenchées par `workflow_dispatch` lorsque `id-token: write` est disponible. Les publications réelles déclenchées par l'envoi d'une étiquette nécessitent toujours `clawhub_token` ; conservez donc `CLAWHUB_TOKEN` à disposition pour les versions publiées par étiquette, les premières publications, les paquets non approuvés ou les publications d'urgence.

Consultez ou supprimez la configuration avec :

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

La suppression de la configuration de l'éditeur approuvé constitue la procédure de retour en arrière. Elle désactive la génération future de jetons de publication approuvée jusqu'à ce qu'un gestionnaire du paquet redéfinisse la configuration.

## FAQ

### La portée du paquet doit correspondre au propriétaire sélectionné

Si la portée du paquet et le propriétaire sélectionné ne correspondent pas, ClawHub refuse la publication :

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Pour résoudre le problème, choisissez le propriétaire indiqué par la portée du paquet ou renommez le paquet afin que sa portée corresponde au propriétaire sous lequel vous pouvez publier.

Si le nom du paquet possède déjà la bonne portée, mais que le paquet appartient au mauvais éditeur, transférez plutôt sa propriété :

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

N'utilisez le transfert d'un paquet ou d'un skill que si vous disposez d'un accès administrateur à la fois au propriétaire actuel et à l'éditeur de destination. Le transfert d'un paquet ne vous permet pas de publier dans une portée que vous ne pouvez pas gérer.

Si vous n'avez pas accès au propriétaire actuel, mais estimez que votre organisation, votre projet ou votre marque est le propriétaire légitime de l'espace de noms, ouvrez un
[ticket de revendication d'organisation ou d'espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
avec des preuves publiques et non sensibles afin que l'équipe l'examine. Consultez
[Revendications d'organisations et d'espaces de noms](/clawhub/namespace-claims) avant de créer le ticket.

Cela protège les espaces de noms des organisations. Un paquet nommé `@openclaw/dronzer` revendique l'espace de noms
`@openclaw` ; seuls les éditeurs ayant accès au propriétaire `@openclaw` peuvent donc le publier.
