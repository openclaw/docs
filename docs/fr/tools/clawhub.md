---
read_when:
    - Rechercher, installer ou mettre à jour des Skills ou des plugins
    - Publier des Skills ou des plugins dans le registre
    - Configurer la CLI ClawHub ou ses substitutions d’environnement
sidebarTitle: ClawHub
summary: 'ClawHub : registre public pour les Skills et Plugins OpenClaw, flux d’installation natifs et CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:39:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub est le registre public pour les **Skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez la CLI `clawhub` distincte pour l’authentification au registre, la publication, la suppression/restauration et les workflows de synchronisation.

Site : [clawhub.ai](https://clawhub.ai)

## Démarrage rapide

<Steps>
  <Step title="Rechercher">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Installer">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Utiliser">
    Démarrez une nouvelle session OpenClaw — elle prendra en compte le nouveau Skill.
  </Step>
  <Step title="Publier (facultatif)">
    Pour les workflows authentifiés auprès du registre (publication, synchronisation, gestion), installez
    la CLI `clawhub` distincte :

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Flux natifs OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les commandes natives `openclaw` installent dans votre espace de travail actif et
    conservent les métadonnées de la source afin que les appels ultérieurs à `update` puissent rester sur ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Les spécifications de plugin simples compatibles npm sont aussi essayées sur ClawHub avant npm :

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Les installations de plugins valident la compatibilité annoncée de `pluginApi` et
    `minGatewayVersion` avant l’installation de l’archive, de sorte que
    les hôtes incompatibles échouent de manière sûre dès le départ au lieu d’installer partiellement
    le paquet.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` n’accepte que les familles de plugins
installables. Si un paquet ClawHub est en réalité un Skill, OpenClaw s’arrête et
vous redirige à la place vers `openclaw skills install <slug>`.

Les installations anonymes de plugins ClawHub échouent aussi de manière sûre pour les paquets privés.
Les canaux communautaires ou autres canaux non officiels peuvent toujours être installés, mais OpenClaw
affiche un avertissement afin que les opérateurs puissent vérifier la source et la validation avant
de les activer.
</Note>

## Ce qu’est ClawHub

- Un registre public pour les Skills et plugins OpenClaw.
- Un stockage versionné des bundles de Skills et des métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’usage.

Un Skill typique est un bundle versionné de fichiers qui inclut :

- Un fichier `SKILL.md` avec la description principale et l’utilisation.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par le Skill.
- Des métadonnées comme les tags, le résumé et les exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer en toute sécurité les
capacités des Skills. Le registre suit les signaux d’usage (étoiles, téléchargements) pour
améliorer le classement et la visibilité. Chaque publication crée une nouvelle version
semver, et le registre conserve l’historique des versions afin que les utilisateurs puissent auditer
les changements.

## Espace de travail et chargement des Skills

La CLI `clawhub` distincte installe aussi les Skills dans `./skills` sous
votre répertoire de travail actuel. Si un espace de travail OpenClaw est configuré,
`clawhub` bascule vers cet espace de travail sauf si vous remplacez `--workdir`
(ou `CLAWHUB_WORKDIR`). OpenClaw charge les Skills d’espace de travail depuis
`<workspace>/skills` et les prend en compte lors de la session **suivante**.

Si vous utilisez déjà `~/.openclaw/skills` ou des Skills intégrés,
les Skills d’espace de travail ont priorité. Pour plus de détails sur la manière dont les Skills sont chargés,
partagés et contrôlés, consultez [Skills](/fr/tools/skills).

## Fonctionnalités du service

| Fonctionnalité     | Notes                                                        |
| ------------------ | ------------------------------------------------------------ |
| Navigation publique | Les Skills et leur contenu `SKILL.md` sont visibles publiquement. |
| Recherche          | Basée sur les embeddings (recherche vectorielle), pas seulement sur des mots-clés. |
| Gestion des versions | Semver, journaux des modifications et tags (y compris `latest`). |
| Téléchargements    | Zip par version.                                             |
| Étoiles et commentaires | Retour de la communauté.                                  |
| Modération         | Approbations et audits.                                      |
| API adaptée à la CLI | Convient à l’automatisation et aux scripts.                |

## Sécurité et modération

ClawHub est ouvert par défaut — n’importe qui peut téléverser des Skills, mais un compte GitHub
doit dater d’**au moins une semaine** pour publier. Cela ralentit les abus
sans bloquer les contributeurs légitimes.

<AccordionGroup>
  <Accordion title="Signalement">
    - Tout utilisateur connecté peut signaler un Skill.
    - Les motifs de signalement sont obligatoires et enregistrés.
    - Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
    - Les Skills avec plus de 3 signalements uniques sont automatiquement masqués par défaut.

  </Accordion>
  <Accordion title="Modération">
    - Les modérateurs peuvent voir les Skills masqués, les réafficher, les supprimer ou bannir des utilisateurs.
    - L’abus de la fonctionnalité de signalement peut entraîner un bannissement du compte.
    - Vous souhaitez devenir modérateur ? Demandez sur le Discord OpenClaw et contactez un modérateur ou un mainteneur.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Vous n’en avez besoin que pour les workflows authentifiés auprès du registre, tels que
publish/sync.

### Options globales

<ParamField path="--workdir <dir>" type="string">
  Répertoire de travail. Par défaut : répertoire actuel ; bascule vers l’espace de travail OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Répertoire des Skills, relatif au workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL de base du site (connexion via navigateur).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL de base de l’API du registre.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Désactiver les invites (non interactif).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Afficher la version de la CLI.
</ParamField>

### Commandes

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Options de connexion :

    - `--token <token>` — coller un jeton d’API.
    - `--label <label>` — étiquette stockée pour les jetons de connexion via navigateur (par défaut : `CLI token`).
    - `--no-browser` — ne pas ouvrir de navigateur (nécessite `--token`).

  </Accordion>
  <Accordion title="Rechercher">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — nombre maximal de résultats.

  </Accordion>
  <Accordion title="Installer / mettre à jour / lister">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Options :

    - `--version <version>` — installer ou mettre à jour vers une version spécifique (un seul slug uniquement sur `update`).
    - `--force` — écraser si le dossier existe déjà, ou lorsque les fichiers locaux ne correspondent à aucune version publiée.
    - `clawhub list` lit `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publier des Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Options :

    - `--slug <slug>` — slug du Skill.
    - `--name <name>` — nom d’affichage.
    - `--version <version>` — version semver.
    - `--changelog <text>` — texte du journal des modifications (peut être vide).
    - `--tags <tags>` — tags séparés par des virgules (par défaut : `latest`).

  </Accordion>
  <Accordion title="Publier des plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` peut être un dossier local, `owner/repo`, `owner/repo@ref`, ou une
    URL GitHub.

    Options :

    - `--dry-run` — générer le plan de publication exact sans rien téléverser.
    - `--json` — produire une sortie lisible par machine pour la CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — remplacements facultatifs lorsque l’auto-détection ne suffit pas.

  </Accordion>
  <Accordion title="Supprimer / restaurer (propriétaire ou admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchroniser (analyser le local + publier les nouveautés ou mises à jour)">
    ```bash
    clawhub sync
    ```

    Options :

    - `--root <dir...>` — racines d’analyse supplémentaires.
    - `--all` — tout téléverser sans invites.
    - `--dry-run` — afficher ce qui serait téléversé.
    - `--bump <type>` — `patch|minor|major` pour les mises à jour (par défaut : `patch`).
    - `--changelog <text>` — journal des modifications pour les mises à jour non interactives.
    - `--tags <tags>` — tags séparés par des virgules (par défaut : `latest`).
    - `--concurrency <n>` — vérifications du registre (par défaut : `4`).

  </Accordion>
</AccordionGroup>

## Workflows courants

<Tabs>
  <Tab title="Rechercher">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Installer">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Tout mettre à jour">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publier un seul Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Synchroniser de nombreux Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publier un plugin depuis GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Métadonnées de paquet de plugin

Les plugins de code doivent inclure les métadonnées OpenClaw requises dans
`package.json` :

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Les paquets publiés doivent fournir du **JavaScript compilé** et faire pointer
`runtimeExtensions` vers cette sortie. Les installations depuis une extraction Git peuvent toujours
revenir au code source TypeScript lorsqu’aucun fichier compilé n’existe, mais les entrées d’exécution
compilées évitent la compilation TypeScript à l’exécution au démarrage, dans doctor et
dans les chemins de chargement des plugins.

## Gestion des versions, fichier de verrouillage et télémétrie

<AccordionGroup>
  <Accordion title="Gestion des versions et tags">
    - Chaque publication crée une nouvelle `SkillVersion` **semver**.
    - Les tags (comme `latest`) pointent vers une version ; déplacer des tags permet de revenir en arrière.
    - Les journaux des modifications sont attachés par version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

  </Accordion>
  <Accordion title="Changements locaux vs versions du registre">
    Les mises à jour comparent le contenu local du Skill aux versions du registre à l’aide d’un
    hash de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, la
    CLI demande confirmation avant d’écraser (ou exige `--force` dans les
    exécutions non interactives).
  </Accordion>
  <Accordion title="Analyse de sync et racines de secours">
    `clawhub sync` analyse d’abord votre workdir actuel. Si aucun Skill n’est
    trouvé, elle bascule vers des emplacements hérités connus (par exemple
    `~/openclaw/skills` et `~/.openclaw/skills`). Cela est conçu pour
    retrouver les anciennes installations de Skills sans options supplémentaires.
  </Accordion>
  <Accordion title="Stockage et fichier de verrouillage">
    - Les Skills installés sont enregistrés dans `.clawhub/lock.json` sous votre workdir.
    - Les jetons d’authentification sont stockés dans le fichier de configuration de la CLI ClawHub (remplacement via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Télémétrie (comptes d’installation)">
    Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané minimal
    pour calculer les comptes d’installation. Vous pouvez désactiver cela complètement :

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variables d’environnement

| Variable                      | Effet                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Remplace l’URL du site.                         |
| `CLAWHUB_REGISTRY`            | Remplace l’URL de l’API du registre.            |
| `CLAWHUB_CONFIG_PATH`         | Remplace l’emplacement où la CLI stocke le jeton/la configuration. |
| `CLAWHUB_WORKDIR`             | Remplace le workdir par défaut.                 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactive la télémétrie sur `sync`.             |

## Liens associés

- [Plugins communautaires](/fr/plugins/community)
- [Plugins](/fr/tools/plugin)
- [Skills](/fr/tools/skills)
