---
read_when:
    - Rechercher, installer ou mettre à jour des Skills ou des Plugins
    - Publication de Skills ou de plugins dans le registre
    - Configurer la CLI clawhub ou ses surcharges d’environnement
sidebarTitle: ClawHub
summary: 'ClawHub : registre public pour les Skills et plugins OpenClaw, les flux d’installation natifs et la CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T07:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub est le registre public des **Skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez le CLI séparé `clawhub` pour les workflows d’authentification au registre, de publication, de suppression/restauration et de synchronisation.

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
    le CLI séparé `clawhub` :

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Flux OpenClaw natifs

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

    `plugins search` interroge le catalogue de plugins ClawHub et affiche des noms
    de packages prêts à installer. Les spécifications de plugin npm-safe sans préfixe sont également essayées auprès de ClawHub
    avant npm :

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Utilisez `npm:<package>` lorsque vous souhaitez une résolution npm uniquement, sans
    recherche ClawHub :

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Les installations de plugins valident la compatibilité `pluginApi` et
    `minGatewayVersion` annoncée avant l’installation de l’archive, afin que
    les hôtes incompatibles échouent de façon fermée tôt au lieu d’installer partiellement
    le package. Lorsqu’une version de package publie un artefact ClawPack,
    OpenClaw préfère cet artefact, vérifie l’en-tête de condensat ClawHub et
    les octets téléchargés, puis enregistre les métadonnées de condensat ClawPack pour les mises à jour
    ultérieures. Les anciennes versions de packages sans métadonnées ClawPack utilisent toujours le
    chemin historique de vérification des archives de package.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accepte uniquement les familles de plugins
installables. Si un package ClawHub est en réalité une Skill, OpenClaw s’arrête et
vous indique plutôt `openclaw skills install <slug>`.

Les installations anonymes de plugins ClawHub échouent également de façon fermée pour les packages privés.
Les canaux communautaires ou autres canaux non officiels peuvent toujours être installés, mais OpenClaw
émet un avertissement afin que les opérateurs puissent examiner la source et la vérification avant de les
activer.
</Note>

## Ce qu’est ClawHub

- Un registre public pour les Skills et plugins OpenClaw.
- Un stockage versionné de bundles de Skills et de métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’utilisation.

Une Skill type est un bundle de fichiers versionné qui inclut :

- Un fichier `SKILL.md` avec la description principale et l’utilisation.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par la Skill.
- Des métadonnées telles que les tags, le résumé et les exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer en sécurité les
capacités des Skills. Le registre suit les signaux d’utilisation (étoiles, téléchargements) pour
améliorer le classement et la visibilité. Chaque publication crée une nouvelle version
semver, et le registre conserve l’historique des versions afin que les utilisateurs puissent auditer
les changements.

## Espace de travail et chargement des Skills

Le CLI séparé `clawhub` installe aussi les Skills dans `./skills` sous
votre répertoire de travail courant. Si un espace de travail OpenClaw est configuré,
`clawhub` se rabat sur cet espace de travail sauf si vous remplacez `--workdir`
(ou `CLAWHUB_WORKDIR`). OpenClaw charge les Skills de l’espace de travail depuis
`<workspace>/skills` et les prend en compte lors de la **prochaine** session.

Si vous utilisez déjà `~/.openclaw/skills` ou des Skills intégrées, les Skills
de l’espace de travail ont la priorité. Pour plus de détails sur la manière dont les Skills sont chargées,
partagées et contrôlées, consultez [Skills](/fr/tools/skills).

## Fonctionnalités du service

| Fonctionnalité           | Notes                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Navigation publique      | Les Skills et leur contenu `SKILL.md` sont consultables publiquement. |
| Recherche                | Alimentée par embeddings (recherche vectorielle), pas seulement par mots-clés. |
| Versionnement            | Semver, changelogs et tags (dont `latest`).                         |
| Téléchargements          | Zip par version.                                                    |
| Étoiles et commentaires  | Retours de la communauté.                                           |
| Résumés des analyses de sécurité | Les pages de détail affichent le dernier état d’analyse avant installation ou téléchargement. |
| Pages de détail des scanners | Les résultats VirusTotal, ClawScan et d’analyse statique ont des liens profonds. |
| Tableau de bord de récupération propriétaire | Les éditeurs peuvent voir le contenu leur appartenant retenu par analyse depuis `/dashboard`. |
| Réanalyses demandées par le propriétaire | Les propriétaires peuvent demander des réanalyses limitées pour récupérer après un faux positif. |
| Modération               | Approbations et audits.                                             |
| API adaptée au CLI       | Adaptée à l’automatisation et aux scripts.                          |

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser des Skills, mais un compte GitHub
doit avoir **au moins une semaine d’ancienneté** pour publier. Cela ralentit
les abus sans bloquer les contributeurs légitimes.

<AccordionGroup>
  <Accordion title="Analyses de sécurité">
    ClawHub exécute des contrôles de sécurité automatisés sur les Skills et les versions de plugins
    publiées. Les pages de détail publiques résument le résultat actuel, et les lignes de scanners
    pointent vers des pages de détail dédiées pour VirusTotal, ClawScan et l’analyse
    statique.

    Les versions retenues par analyse ou bloquées peuvent être indisponibles sur le catalogue public et
    les surfaces d’installation tout en restant visibles par leur propriétaire dans `/dashboard`.

  </Accordion>
  <Accordion title="Signalement">
    - Tout utilisateur connecté peut signaler une Skill.
    - Les motifs de signalement sont obligatoires et enregistrés.
    - Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
    - Les Skills ayant plus de 3 signalements uniques sont masquées automatiquement par défaut.

  </Accordion>
  <Accordion title="Modération">
    - Les modérateurs peuvent consulter les Skills masquées, les réafficher, les supprimer ou bannir des utilisateurs.
    - L’abus de la fonctionnalité de signalement peut entraîner des bannissements de compte.
    - Vous souhaitez devenir modérateur ? Demandez dans le Discord OpenClaw et contactez un modérateur ou mainteneur.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Vous n’en avez besoin que pour les workflows authentifiés auprès du registre, comme
la publication/synchronisation.

### Options globales

<ParamField path="--workdir <dir>" type="string">
  Répertoire de travail. Par défaut : répertoire courant ; se rabat sur l’espace de travail OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Répertoire des Skills, relatif à workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL de base du site (connexion navigateur).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL de base de l’API du registre.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Désactive les invites (non interactif).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Affiche la version du CLI.
</ParamField>

### Commandes

<AccordionGroup>
  <Accordion title="Authentification (connexion / déconnexion / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Options de connexion :

    - `--token <token>` — coller un jeton d’API.
    - `--label <label>` — libellé stocké pour les jetons de connexion navigateur (par défaut : `CLI token`).
    - `--no-browser` — ne pas ouvrir de navigateur (nécessite `--token`).

  </Accordion>
  <Accordion title="Recherche">
    ```bash
    clawhub search "query"
    ```

    Recherche des Skills. Pour la découverte de plugins/packages, utilisez `clawhub package explore`.

    - `--limit <n>` — résultats maximum.

  </Accordion>
  <Accordion title="Parcourir / inspecter les plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` et `package inspect` sont les surfaces du CLI ClawHub pour la découverte de plugins/packages et l’inspection des métadonnées. Les installations natives OpenClaw utilisent toujours `openclaw plugins install clawhub:<package>`.

    Options :

    - `--family skill|code-plugin|bundle-plugin` — filtrer la famille de package.
    - `--official` — afficher uniquement les packages officiels.
    - `--executes-code` — afficher uniquement les packages qui exécutent du code.
    - `--version <version>` / `--tag <tag>` — inspecter une version de package spécifique.
    - `--versions`, `--files`, `--file <path>` — inspecter l’historique et les fichiers du package.
    - `--json` — sortie lisible par machine.

  </Accordion>
  <Accordion title="Installer / mettre à jour / lister">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Options :

    - `--version <version>` — installer ou mettre à jour vers une version spécifique (slug unique seulement sur `update`).
    - `--force` — écraser si le dossier existe déjà, ou lorsque les fichiers locaux ne correspondent à aucune version publiée.
    - `clawhub list` lit `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publier des Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Options :

    - `--slug <slug>` — slug de Skill.
    - `--name <name>` — nom d’affichage.
    - `--version <version>` — version semver.
    - `--changelog <text>` — texte du changelog (peut être vide).
    - `--tags <tags>` — tags séparés par des virgules (par défaut : `latest`).

  </Accordion>
  <Accordion title="Publier des plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` peut être un dossier local, `owner/repo`, `owner/repo@ref` ou une
    URL GitHub.

    Options :

    - `--dry-run` — construire le plan de publication exact sans rien téléverser.
    - `--json` — émettre une sortie lisible par machine pour CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — remplacements facultatifs lorsque l’auto-détection ne suffit pas.

  </Accordion>
  <Accordion title="Demander des réanalyses">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Les commandes de réanalyse nécessitent un jeton propriétaire connecté et ciblent la dernière
    version de Skill ou release de plugin publiée. Dans les exécutions non interactives, passez
    `--yes`.

    Les réponses JSON incluent le type de cible, le nom, la version, l’état de réanalyse et
    les nombres de requêtes restantes/max pour cette version ou release.

  </Accordion>
  <Accordion title="Supprimer / restaurer (propriétaire ou administrateur)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchroniser (analyser localement + publier les nouveautés ou mises à jour)">
    ```bash
    clawhub sync
    ```

    Options :

    - `--root <dir...>` — racines d’analyse supplémentaires.
    - `--all` — tout téléverser sans invites.
    - `--dry-run` — afficher ce qui serait téléversé.
    - `--bump <type>` — `patch|minor|major` pour les mises à jour (par défaut : `patch`).
    - `--changelog <text>` — changelog pour les mises à jour non interactives.
    - `--tags <tags>` — tags séparés par des virgules (par défaut : `latest`).
    - `--concurrency <n>` — vérifications du registre (par défaut : `4`).

  </Accordion>
</AccordionGroup>

## Workflows courants

<Tabs>
  <Tab title="Recherche">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Trouver un plugin">
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
  <Tab title="Publier une seule skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Synchroniser de nombreuses skills">
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

### Métadonnées du package Plugin

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

Les packages publiés doivent fournir du **JavaScript compilé** et faire pointer
`runtimeExtensions` vers cette sortie. Les installations depuis un checkout Git
peuvent toujours se rabattre sur le code source TypeScript lorsqu’aucun fichier
compilé n’existe, mais les entrées d’exécution compilées évitent la compilation
TypeScript à l’exécution dans les chemins de démarrage, de doctor et de
chargement des plugins.

## Gestion des versions, lockfile et télémétrie

<AccordionGroup>
  <Accordion title="Versions et tags">
    - Chaque publication crée une nouvelle `SkillVersion` **semver**.
    - Les tags (comme `latest`) pointent vers une version ; déplacer les tags vous permet de revenir en arrière.
    - Les journaux des modifications sont associés à chaque version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

  </Accordion>
  <Accordion title="Modifications locales et versions du registre">
    Les mises à jour comparent le contenu local de la skill aux versions du registre à l’aide d’un
    hachage de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, la
    CLI demande confirmation avant d’écraser (ou exige `--force` dans les
    exécutions non interactives).
  </Accordion>
  <Accordion title="Analyse de synchronisation et racines de repli">
    `clawhub sync` analyse d’abord votre répertoire de travail actuel. Si aucune skill n’est
    trouvée, il se rabat sur des emplacements hérités connus (par exemple
    `~/openclaw/skills` et `~/.openclaw/skills`). Cela est conçu pour
    trouver les anciennes installations de skills sans options supplémentaires.
  </Accordion>
  <Accordion title="Stockage et lockfile">
    - Les skills installées sont enregistrées dans `.clawhub/lock.json` sous votre répertoire de travail.
    - Les jetons d’authentification sont stockés dans le fichier de configuration de la CLI ClawHub (surcharge via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Télémétrie (décomptes d’installations)">
    Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané
    minimal pour calculer les décomptes d’installations. Vous pouvez désactiver cela entièrement :

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variables d’environnement

| Variable                      | Effet                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Surcharger l’URL du site.                       |
| `CLAWHUB_REGISTRY`            | Surcharger l’URL de l’API du registre.          |
| `CLAWHUB_CONFIG_PATH`         | Surcharger l’emplacement où la CLI stocke le jeton/la configuration. |
| `CLAWHUB_WORKDIR`             | Surcharger le répertoire de travail par défaut. |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactiver la télémétrie sur `sync`.            |

## Connexe

- [Plugins communautaires](/fr/plugins/community)
- [Plugins](/fr/tools/plugin)
- [Skills](/fr/tools/skills)
