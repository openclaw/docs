---
read_when:
    - Recherche, installation ou mise à jour de Skills ou de Plugins
    - Publication de Skills ou de plugins dans le registre
    - Configuration de la CLI clawhub ou de ses surcharges d’environnement
sidebarTitle: ClawHub
summary: 'ClawHub : registre public des Skills et plugins OpenClaw, des flux d’installation natifs et de la CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T07:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub est le registre public des **Skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour les Skills, ainsi que pour installer des plugins depuis ClawHub.
- Utilisez le CLI `clawhub` distinct pour les workflows d’authentification au registre, de publication, de suppression/restauration et de synchronisation.

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
    Démarrez une nouvelle session OpenClaw — elle prend en compte le nouveau Skill.
  </Step>
  <Step title="Publier (facultatif)">
    Pour les workflows authentifiés auprès du registre (publier, synchroniser, gérer), installez
    le CLI `clawhub` distinct :

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
    conservent les métadonnées de source afin que les appels `update` ultérieurs puissent rester sur ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Les spécifications de plugins compatibles npm sans préfixe sont également essayées sur ClawHub avant npm :

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Utilisez `npm:<package>` lorsque vous voulez une résolution limitée à npm sans
    recherche ClawHub :

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Les installations de plugins valident la compatibilité `pluginApi` et
    `minGatewayVersion` annoncée avant l’installation de l’archive, afin que
    les hôtes incompatibles échouent fermement tôt au lieu d’installer partiellement
    le package.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` accepte uniquement les familles de plugins
installables. Si un package ClawHub est en réalité un Skill, OpenClaw s’arrête et
vous oriente plutôt vers `openclaw skills install <slug>`.

Les installations anonymes de plugins ClawHub échouent également fermement pour les packages privés.
Les canaux communautaires ou autres canaux non officiels peuvent toujours être installés, mais OpenClaw
émet un avertissement afin que les opérateurs puissent examiner la source et la vérification avant de
les activer.
</Note>

## Ce qu’est ClawHub

- Un registre public pour les Skills et plugins OpenClaw.
- Un magasin versionné de bundles de Skills et de métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’usage.

Un Skill typique est un bundle de fichiers versionné qui comprend :

- Un fichier `SKILL.md` avec la description principale et l’utilisation.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par le Skill.
- Des métadonnées telles que les tags, le résumé et les exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer en toute sécurité les
capacités des Skills. Le registre suit les signaux d’usage (étoiles, téléchargements) pour
améliorer le classement et la visibilité. Chaque publication crée une nouvelle version semver,
et le registre conserve l’historique des versions afin que les utilisateurs puissent auditer
les changements.

## Espace de travail et chargement des Skills

Le CLI `clawhub` distinct installe également les Skills dans `./skills` sous
votre répertoire de travail actuel. Si un espace de travail OpenClaw est configuré,
`clawhub` se rabat sur cet espace de travail sauf si vous remplacez `--workdir`
(ou `CLAWHUB_WORKDIR`). OpenClaw charge les Skills de l’espace de travail depuis
`<workspace>/skills` et les prend en compte lors de la **prochaine** session.

Si vous utilisez déjà `~/.openclaw/skills` ou des Skills intégrés, les Skills
de l’espace de travail ont priorité. Pour plus de détails sur la façon dont les Skills sont chargés,
partagés et soumis à des garde-fous, consultez [Skills](/fr/tools/skills).

## Fonctionnalités du service

| Fonctionnalité           | Notes                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Navigation publique      | Les Skills et leur contenu `SKILL.md` sont consultables publiquement. |
| Recherche                | Propulsée par des embeddings (recherche vectorielle), pas seulement par mots-clés. |
| Versionnement            | Semver, journaux des modifications et tags (y compris `latest`). |
| Téléchargements          | Zip par version. |
| Étoiles et commentaires  | Retours de la communauté. |
| Résumés d’analyses de sécurité | Les pages de détail affichent le dernier état d’analyse avant installation ou téléchargement. |
| Pages de détail des scanners | Les résultats VirusTotal, ClawScan et d’analyse statique disposent de liens profonds. |
| Tableau de bord de récupération propriétaire | Les éditeurs peuvent voir depuis `/dashboard` le contenu qu’ils possèdent et qui est retenu par l’analyse. |
| Nouvelles analyses demandées par le propriétaire | Les propriétaires peuvent demander des nouvelles analyses limitées pour récupérer après un faux positif. |
| Modération               | Approbations et audits. |
| API adaptée au CLI       | Convient à l’automatisation et aux scripts. |

## Sécurité et modération

ClawHub est ouvert par défaut — tout le monde peut téléverser des Skills, mais un compte GitHub
doit avoir **au moins une semaine** pour publier. Cela ralentit les abus
sans bloquer les contributeurs légitimes.

<AccordionGroup>
  <Accordion title="Analyses de sécurité">
    ClawHub exécute des contrôles de sécurité automatisés sur les Skills et les releases de plugins
    publiés. Les pages de détail publiques résument le résultat actuel, et les lignes des scanners
    renvoient vers des pages de détail dédiées pour VirusTotal, ClawScan et l’analyse statique.

    Les releases retenues par l’analyse ou bloquées peuvent être indisponibles dans le catalogue public et
    les surfaces d’installation, tout en restant visibles par leur propriétaire dans `/dashboard`.

  </Accordion>
  <Accordion title="Signalement">
    - Tout utilisateur connecté peut signaler un Skill.
    - Les motifs de signalement sont obligatoires et enregistrés.
    - Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
    - Les Skills avec plus de 3 signalements uniques sont masqués automatiquement par défaut.

  </Accordion>
  <Accordion title="Modération">
    - Les modérateurs peuvent voir les Skills masqués, les réafficher, les supprimer ou bannir des utilisateurs.
    - L’abus de la fonctionnalité de signalement peut entraîner un bannissement de compte.
    - Vous souhaitez devenir modérateur ? Demandez dans le Discord OpenClaw et contactez un modérateur ou un mainteneur.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Vous n’en avez besoin que pour les workflows authentifiés auprès du registre, comme
publish/sync.

### Options globales

<ParamField path="--workdir <dir>" type="string">
  Répertoire de travail. Par défaut : répertoire actuel ; se rabat sur l’espace de travail OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Répertoire des Skills, relatif au répertoire de travail.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL de base du site (connexion par navigateur).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL de base de l’API du registre.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Désactiver les invites (non interactif).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Afficher la version du CLI.
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
    - `--label <label>` — libellé stocké pour les jetons de connexion par navigateur (par défaut : `CLI token`).
    - `--no-browser` — ne pas ouvrir de navigateur (nécessite `--token`).

  </Accordion>
  <Accordion title="Rechercher">
    ```bash
    clawhub search "query"
    ```

    Recherche des Skills. Pour découvrir des plugins/packages, utilisez `clawhub package explore`.

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

    - `--dry-run` — construire le plan de publication exact sans rien téléverser.
    - `--json` — émettre une sortie lisible par machine pour la CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — remplacements facultatifs lorsque la détection automatique ne suffit pas.

  </Accordion>
  <Accordion title="Demander de nouvelles analyses">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Les commandes de nouvelle analyse nécessitent un jeton de propriétaire connecté et ciblent la dernière
    version de Skill publiée ou release de plugin. Dans les exécutions non interactives, passez
    `--yes`.

    Les réponses JSON incluent le type de cible, le nom, la version, l’état de nouvelle analyse et
    les nombres de demandes restantes/maximales pour cette version ou release.

  </Accordion>
  <Accordion title="Supprimer / restaurer (propriétaire ou administrateur)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchroniser (analyser localement + publier nouveau ou mis à jour)">
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
  <Tab title="Publier une seule skill">
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

### Métadonnées du package de Plugin

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

Les packages publiés doivent fournir du **JavaScript compilé** et faire pointer
`runtimeExtensions` vers cette sortie. Les installations depuis un checkout Git
peuvent toujours se rabattre sur la source TypeScript lorsqu’aucun fichier compilé
n’existe, mais les entrées d’exécution compilées évitent la compilation TypeScript
à l’exécution dans les chemins de démarrage, de doctor et de chargement des Plugins.

## Versionnement, lockfile et télémétrie

<AccordionGroup>
  <Accordion title="Versionnement et tags">
    - Chaque publication crée une nouvelle `SkillVersion` **semver**.
    - Les tags (comme `latest`) pointent vers une version ; déplacer les tags vous permet de revenir en arrière.
    - Les journaux des modifications sont attachés par version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

  </Accordion>
  <Accordion title="Modifications locales et versions du registre">
    Les mises à jour comparent le contenu local de la skill aux versions du registre à l’aide d’un
    hachage de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, la
    CLI demande confirmation avant d’écraser (ou exige `--force` dans les
    exécutions non interactives).
  </Accordion>
  <Accordion title="Analyse de synchronisation et racines de secours">
    `clawhub sync` analyse d’abord votre répertoire de travail actuel. Si aucune skill n’est
    trouvée, il se rabat sur les emplacements hérités connus (par exemple
    `~/openclaw/skills` et `~/.openclaw/skills`). Ce comportement est conçu pour
    trouver les anciennes installations de skills sans flags supplémentaires.
  </Accordion>
  <Accordion title="Stockage et lockfile">
    - Les skills installées sont enregistrées dans `.clawhub/lock.json` sous votre répertoire de travail.
    - Les jetons d’authentification sont stockés dans le fichier de configuration de la CLI ClawHub (surcharge via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Télémétrie (compteurs d’installation)">
    Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané minimal
    pour calculer les compteurs d’installation. Vous pouvez désactiver entièrement ce comportement :

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
| `CLAWHUB_WORKDIR`             | Remplace le répertoire de travail par défaut.   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactive la télémétrie lors de `sync`.         |

## Connexe

- [Plugins communautaires](/fr/plugins/community)
- [Plugins](/fr/tools/plugin)
- [Skills](/fr/tools/skills)
