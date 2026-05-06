---
read_when:
    - Recherche, installation ou mise à jour de Skills ou de plugins
    - Publication de Skills ou de Plugins dans le registre
    - Configuration de la CLI clawhub ou de ses surcharges d’environnement
sidebarTitle: ClawHub
summary: 'ClawHub : registre public pour les Skills et plugins OpenClaw, les flux d’installation natifs et la CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T07:40:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub est le registre public des **Skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez la CLI `clawhub` séparée pour les workflows d’authentification au registre, de publication, de suppression/restauration et de synchronisation.

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
    Démarrez une nouvelle session OpenClaw : elle prend en compte la nouvelle Skill.
  </Step>
  <Step title="Publier (facultatif)">
    Pour les workflows authentifiés auprès du registre (publier, synchroniser, gérer), installez
    la CLI `clawhub` séparée :

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Flows OpenClaw natifs

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les commandes natives `openclaw` installent dans votre espace de travail actif et
    conservent les métadonnées de source afin que les appels ultérieurs à `update` puissent rester sur ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` interroge le catalogue de plugins ClawHub et affiche des noms de
    packages prêts à installer. Utilisez `clawhub:<package>` lorsque vous voulez la résolution ClawHub.
    Les spécifications de plugins npm valides sans préfixe s’installent depuis npm pendant la transition de lancement :

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` est également limité à npm et s’avère utile lorsqu’une spécification pourrait autrement
    être ambiguë :

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Les installations de plugins valident la compatibilité annoncée de `pluginApi` et
    `minGatewayVersion` avant l’installation de l’archive, afin que les hôtes incompatibles échouent de manière fermée tôt, au lieu d’installer partiellement
    le package. Lorsqu’une version de package publie un artefact ClawPack,
    OpenClaw privilégie le `.tgz` npm-pack exact téléversé, vérifie l’en-tête de condensat ClawHub
    et les octets téléchargés, puis enregistre le type d’artefact, l’intégrité npm,
    le shasum npm, le nom du tarball et les métadonnées de condensat ClawPack pour les mises à jour ultérieures.
    Les anciennes versions de packages sans métadonnées ClawPack utilisent toujours le
    chemin hérité de vérification d’archive de package.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accepte uniquement les familles de plugins
installables. Si un package ClawHub est en réalité une Skill, OpenClaw s’arrête et
vous indique plutôt `openclaw skills install <slug>`.

Les installations anonymes de plugins ClawHub échouent également de manière fermée pour les packages privés.
Les canaux communautaires ou autres canaux non officiels peuvent toujours s’installer, mais OpenClaw
émet un avertissement afin que les opérateurs puissent examiner la source et la vérification avant de les activer.
</Note>

## Ce qu’est ClawHub

- Un registre public pour les Skills et plugins OpenClaw.
- Un magasin versionné de bundles de Skills et de métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’utilisation.

Une Skill typique est un bundle versionné de fichiers qui comprend :

- Un fichier `SKILL.md` avec la description principale et l’utilisation.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par la Skill.
- Des métadonnées telles que les tags, le résumé et les exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer en toute sécurité les
capacités des Skills. Le registre suit les signaux d’utilisation (étoiles, téléchargements) pour
améliorer le classement et la visibilité. Chaque publication crée une nouvelle version
semver, et le registre conserve l’historique des versions afin que les utilisateurs puissent auditer
les changements.

## Espace de travail et chargement des Skills

La CLI `clawhub` séparée installe également les Skills dans `./skills` sous
votre répertoire de travail actuel. Si un espace de travail OpenClaw est configuré,
`clawhub` utilise cet espace de travail par défaut sauf si vous remplacez `--workdir`
(ou `CLAWHUB_WORKDIR`). OpenClaw charge les Skills d’espace de travail depuis
`<workspace>/skills` et les prend en compte dans la session **suivante**.

Si vous utilisez déjà `~/.openclaw/skills` ou des Skills groupées, les Skills
d’espace de travail ont la priorité. Pour plus de détails sur la façon dont les Skills sont chargées,
partagées et soumises à des garde-fous, consultez [Skills](/fr/tools/skills).

## Fonctionnalités du service

| Fonctionnalité           | Notes                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Navigation publique      | Les Skills et leur contenu `SKILL.md` sont publiquement consultables. |
| Recherche                | Basée sur les embeddings (recherche vectorielle), pas seulement sur des mots-clés. |
| Versionnement            | Semver, changelogs et tags (y compris `latest`).                    |
| Téléchargements          | Zip par version.                                                    |
| Étoiles et commentaires  | Retours de la communauté.                                           |
| Résumés des analyses de sécurité | Les pages de détail affichent le dernier état d’analyse avant l’installation ou le téléchargement. |
| Pages de détail des scanners | Les résultats VirusTotal, ClawScan et d’analyse statique ont des liens profonds. |
| Tableau de bord de récupération propriétaire | Les éditeurs peuvent voir le contenu leur appartenant retenu par analyse depuis `/dashboard`. |
| Réanalyses demandées par le propriétaire | Les propriétaires peuvent demander des réanalyses limitées pour la récupération de faux positifs. |
| Modération               | Approbations et audits.                                             |
| API adaptée à la CLI     | Adaptée à l’automatisation et aux scripts.                          |

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser des Skills, mais un compte GitHub
doit avoir **au moins une semaine** pour publier. Cela ralentit
les abus sans bloquer les contributeurs légitimes.

<AccordionGroup>
  <Accordion title="Analyses de sécurité">
    ClawHub exécute des contrôles de sécurité automatisés sur les Skills et les releases de plugins
    publiées. Les pages de détail publiques résument le résultat actuel, et les lignes de scanners
    renvoient vers des pages de détail dédiées pour VirusTotal, ClawScan et l’analyse
    statique.

    Les releases retenues par analyse ou bloquées peuvent être indisponibles dans le catalogue public et
    les surfaces d’installation tout en restant visibles par leur propriétaire dans `/dashboard`.

  </Accordion>
  <Accordion title="Signalement">
    - Tout utilisateur connecté peut signaler une Skill.
    - Les motifs de signalement sont obligatoires et enregistrés.
    - Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
    - Les Skills avec plus de 3 signalements uniques sont masquées automatiquement par défaut.

  </Accordion>
  <Accordion title="Modération">
    - Les modérateurs peuvent voir les Skills masquées, les réafficher, les supprimer ou bannir des utilisateurs.
    - L’abus de la fonctionnalité de signalement peut entraîner des bannissements de compte.
    - Vous souhaitez devenir modérateur ? Demandez dans le Discord OpenClaw et contactez un modérateur ou un mainteneur.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Vous n’en avez besoin que pour les workflows authentifiés auprès du registre, tels que
la publication/synchronisation.

### Options globales

<ParamField path="--workdir <dir>" type="string">
  Répertoire de travail. Par défaut : répertoire actuel ; utilise l’espace de travail OpenClaw en repli.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Répertoire des Skills, relatif au répertoire de travail.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL de base du site (connexion navigateur).
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

    - `--token <token>` - coller un jeton d’API.
    - `--label <label>` - libellé stocké pour les jetons de connexion navigateur (par défaut : `CLI token`).
    - `--no-browser` - ne pas ouvrir de navigateur (nécessite `--token`).

  </Accordion>
  <Accordion title="Rechercher">
    ```bash
    clawhub search "query"
    ```

    Recherche des Skills. Pour la découverte de plugins/packages, utilisez `clawhub package explore`.

    - `--limit <n>` - nombre maximal de résultats.

  </Accordion>
  <Accordion title="Parcourir / inspecter les plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` et `package inspect` sont les surfaces de la CLI ClawHub pour la découverte de plugins/packages et l’inspection des métadonnées. Les installations OpenClaw natives utilisent toujours `openclaw plugins install clawhub:<package>`.

    Options :

    - `--family skill|code-plugin|bundle-plugin` - filtrer la famille de package.
    - `--official` - afficher uniquement les packages officiels.
    - `--executes-code` - afficher uniquement les packages qui exécutent du code.
    - `--version <version>` / `--tag <tag>` - inspecter une version de package spécifique.
    - `--versions`, `--files`, `--file <path>` - inspecter l’historique et les fichiers du package.
    - `--json` - sortie lisible par machine.

  </Accordion>
  <Accordion title="Installer / mettre à jour / lister">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Options :

    - `--version <version>` - installer ou mettre à jour vers une version spécifique (slug unique uniquement avec `update`).
    - `--force` - écraser si le dossier existe déjà, ou lorsque les fichiers locaux ne correspondent à aucune version publiée.
    - `clawhub list` lit `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publier des Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Options :

    - `--slug <slug>` - slug de Skill.
    - `--name <name>` - nom d’affichage.
    - `--version <version>` - version semver.
    - `--changelog <text>` - texte du changelog (peut être vide).
    - `--tags <tags>` - tags séparés par des virgules (par défaut : `latest`).

  </Accordion>
  <Accordion title="Publier des plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` peut être un dossier local, `owner/repo`, `owner/repo@ref` ou une
    URL GitHub.

    Options :

    - `--dry-run` - construire le plan de publication exact sans rien téléverser.
    - `--json` - émettre une sortie lisible par machine pour la CI.
    - `--source-repo`, `--source-commit`, `--source-ref` - remplacements facultatifs lorsque l’auto-détection ne suffit pas.

  </Accordion>
  <Accordion title="Demander des réanalyses">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Les commandes de réanalyse nécessitent un jeton propriétaire connecté et ciblent la dernière
    version de Skill publiée ou release de plugin. Dans les exécutions non interactives, passez
    `--yes`.

    Les réponses JSON incluent le type de cible, le nom, la version, l’état de réanalyse, ainsi que
    les nombres de demandes restantes/maximales pour cette version ou cette release.

  </Accordion>
  <Accordion title="Supprimer / restaurer (propriétaire ou administrateur)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchroniser (analyser localement + publier les nouveaux ou mis à jour)">
    ```bash
    clawhub sync
    ```

    Options :

    - `--root <dir...>` - racines d’analyse supplémentaires.
    - `--all` - téléverser tout sans invites.
    - `--dry-run` - afficher ce qui serait téléversé.
    - `--bump <type>` - `patch|minor|major` pour les mises à jour (par défaut : `patch`).
    - `--changelog <text>` - changelog pour les mises à jour non interactives.
    - `--tags <tags>` - tags séparés par des virgules (par défaut : `latest`).
    - `--concurrency <n>` - contrôles de registre (par défaut : `4`).

  </Accordion>
</AccordionGroup>

## Workflows courants

<Tabs>
  <Tab title="Recherche">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Trouver un Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
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
  <Tab title="Publier un seul skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Synchroniser plusieurs skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publier un Plugin depuis GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Métadonnées du package Plugin

Les Plugins de code doivent inclure les métadonnées OpenClaw requises dans
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

Les packages publiés doivent inclure du **JavaScript compilé** et faire pointer
`runtimeExtensions` vers cette sortie. Les installations par checkout Git peuvent toujours se
replier sur la source TypeScript lorsqu’aucun fichier compilé n’existe, mais les entrées d’exécution
compilées évitent la compilation TypeScript à l’exécution dans les chemins de démarrage, de diagnostic et
de chargement des Plugins.

## Versionnement, lockfile et télémétrie

<AccordionGroup>
  <Accordion title="Versionnement et tags">
    - Chaque publication crée une nouvelle `SkillVersion` **semver**.
    - Les tags (comme `latest`) pointent vers une version ; déplacer les tags vous permet de revenir en arrière.
    - Les journaux des modifications sont associés à chaque version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

  </Accordion>
  <Accordion title="Modifications locales et versions du registre">
    Les mises à jour comparent le contenu du skill local aux versions du registre à l’aide d’un
    hash de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, la
    CLI demande confirmation avant d’écraser (ou exige `--force` lors des
    exécutions non interactives).
  </Accordion>
  <Accordion title="Analyse de synchronisation et racines de secours">
    `clawhub sync` analyse d’abord votre répertoire de travail actuel. Si aucun skill n’est
    trouvé, il se replie sur les emplacements hérités connus (par exemple
    `~/openclaw/skills` et `~/.openclaw/skills`). Cette logique est conçue pour
    retrouver les anciennes installations de skills sans indicateurs supplémentaires.
  </Accordion>
  <Accordion title="Stockage et lockfile">
    - Les skills installés sont enregistrés dans `.clawhub/lock.json` sous votre répertoire de travail.
    - Les jetons d’authentification sont stockés dans le fichier de configuration de la CLI ClawHub (remplacement possible via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Télémétrie (nombre d’installations)">
    Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané
    minimal pour calculer le nombre d’installations. Vous pouvez désactiver entièrement cette option :

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variables d’environnement

| Variable                      | Effet                                                   |
| ----------------------------- | ------------------------------------------------------- |
| `CLAWHUB_SITE`                | Remplace l’URL du site.                                 |
| `CLAWHUB_REGISTRY`            | Remplace l’URL de l’API du registre.                    |
| `CLAWHUB_CONFIG_PATH`         | Remplace l’emplacement où la CLI stocke le jeton/config. |
| `CLAWHUB_WORKDIR`             | Remplace le répertoire de travail par défaut.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactive la télémétrie sur `sync`.                     |

## Associé

- [Plugins communautaires](/fr/plugins/community)
- [Plugins](/fr/tools/plugin)
- [Skills](/fr/tools/skills)
