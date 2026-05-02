---
read_when:
    - Recherche, installation ou mise à jour de Skills ou de Plugins
    - Publication de Skills ou de plugins dans le registre
    - Configuration de la CLI clawhub ou de ses surcharges d’environnement
sidebarTitle: ClawHub
summary: 'ClawHub : registre public pour les Skills et plugins OpenClaw, les flux d’installation natifs et la CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:03:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub est le registre public des **Skills et plugins OpenClaw**.

- Utilisez les commandes natives `openclaw` pour rechercher, installer et mettre à jour des skills, ainsi que pour installer des plugins depuis ClawHub.
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
    Démarrez une nouvelle session OpenClaw : elle prendra en compte le nouveau skill.
  </Step>
  <Step title="Publier (facultatif)">
    Pour les workflows authentifiés auprès du registre (publication, synchronisation, gestion), installez
    la CLI `clawhub` séparée :

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
    conservent les métadonnées de source afin que les appels `update` ultérieurs puissent rester sur ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` interroge le catalogue de plugins ClawHub et affiche des
    noms de paquets prêts à installer. Utilisez `clawhub:<package>` lorsque vous voulez une résolution ClawHub.
    Les spécifications de plugins compatibles npm sans préfixe s’installent depuis npm pendant la transition de lancement :

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` utilise également npm uniquement et est utile lorsqu’une spécification pourrait autrement
    être ambiguë :

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Les installations de plugins valident la compatibilité `pluginApi` et
    `minGatewayVersion` annoncée avant l’installation de l’archive, afin que
    les hôtes incompatibles échouent de manière fermée tôt au lieu d’installer
    partiellement le paquet. Lorsqu’une version de paquet publie un artefact ClawPack,
    OpenClaw préfère le `.tgz` npm-pack exact téléversé, vérifie l’en-tête de condensat ClawHub
    et les octets téléchargés, et enregistre le type d’artefact, l’intégrité npm,
    la somme shasum npm, le nom de l’archive tar et les métadonnées de condensat ClawPack pour les
    mises à jour ultérieures. Les anciennes versions de paquet sans métadonnées ClawPack utilisent toujours le
    chemin hérité de vérification d’archive de paquet.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` n’accepte que les familles de plugins
installables. Si un paquet ClawHub est en réalité un skill, OpenClaw s’arrête et
vous indique d’utiliser `openclaw skills install <slug>` à la place.

Les installations anonymes de plugins ClawHub échouent également de manière fermée pour les paquets privés.
Les canaux communautaires ou autres canaux non officiels peuvent toujours s’installer, mais OpenClaw
émet un avertissement afin que les opérateurs puissent vérifier la source et la vérification avant de les
activer.
</Note>

## Ce qu’est ClawHub

- Un registre public pour les skills et plugins OpenClaw.
- Un magasin versionné de lots de skills et de métadonnées.
- Une surface de découverte pour la recherche, les tags et les signaux d’utilisation.

Un skill typique est un lot versionné de fichiers qui comprend :

- Un fichier `SKILL.md` avec la description principale et l’utilisation.
- Des configurations, scripts ou fichiers de support facultatifs utilisés par le skill.
- Des métadonnées comme les tags, le résumé et les exigences d’installation.

ClawHub utilise les métadonnées pour alimenter la découverte et exposer en toute sécurité les
capacités des skills. Le registre suit les signaux d’utilisation (étoiles, téléchargements) pour
améliorer le classement et la visibilité. Chaque publication crée une nouvelle version
semver, et le registre conserve l’historique des versions afin que les utilisateurs puissent auditer
les changements.

## Espace de travail et chargement des skills

La CLI `clawhub` séparée installe également les skills dans `./skills` sous
votre répertoire de travail actuel. Si un espace de travail OpenClaw est configuré,
`clawhub` utilise cet espace de travail en solution de repli, sauf si vous remplacez `--workdir`
(ou `CLAWHUB_WORKDIR`). OpenClaw charge les skills d’espace de travail depuis
`<workspace>/skills` et les prend en compte dans la session **suivante**.

Si vous utilisez déjà `~/.openclaw/skills` ou des skills fournis, les skills
d’espace de travail sont prioritaires. Pour plus de détails sur la façon dont les skills sont chargés,
partagés et soumis à des garde-fous, consultez [Skills](/fr/tools/skills).

## Fonctionnalités du service

| Fonctionnalité           | Notes                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| Navigation publique      | Les skills et leur contenu `SKILL.md` sont consultables publiquement. |
| Recherche                | Basée sur des embeddings (recherche vectorielle), pas seulement des mots-clés. |
| Versionnement            | Semver, journaux des modifications et tags (y compris `latest`).      |
| Téléchargements          | Zip par version.                                                      |
| Étoiles et commentaires  | Retours de la communauté.                                             |
| Résumés des scans de sécurité | Les pages de détail affichent le dernier état du scan avant installation ou téléchargement. |
| Pages de détail des scanners | Les résultats VirusTotal, ClawScan et d’analyse statique ont des liens profonds. |
| Tableau de bord de récupération propriétaire | Les éditeurs peuvent voir le contenu qu’ils possèdent et qui est retenu par scan depuis `/dashboard`. |
| Rescans demandés par le propriétaire | Les propriétaires peuvent demander des rescans limités pour la récupération de faux positifs. |
| Modération               | Approbations et audits.                                               |
| API adaptée à la CLI     | Convient à l’automatisation et aux scripts.                           |

## Sécurité et modération

ClawHub est ouvert par défaut : tout le monde peut téléverser des skills, mais un compte GitHub
doit avoir **au moins une semaine** pour publier. Cela ralentit les
abus sans bloquer les contributeurs légitimes.

<AccordionGroup>
  <Accordion title="Scans de sécurité">
    ClawHub exécute des contrôles de sécurité automatisés sur les skills publiés et les
    versions de plugins. Les pages de détail publiques résument le résultat actuel, et les lignes de
    scanners renvoient vers des pages de détail dédiées pour VirusTotal, ClawScan et l’analyse
    statique.

    Les versions retenues par scan ou bloquées peuvent être indisponibles sur le catalogue public et
    les surfaces d’installation tout en restant visibles par leur propriétaire dans `/dashboard`.

  </Accordion>
  <Accordion title="Signalement">
    - Tout utilisateur connecté peut signaler un skill.
    - Les motifs de signalement sont obligatoires et enregistrés.
    - Chaque utilisateur peut avoir jusqu’à 20 signalements actifs à la fois.
    - Les skills avec plus de 3 signalements uniques sont masqués automatiquement par défaut.

  </Accordion>
  <Accordion title="Modération">
    - Les modérateurs peuvent voir les skills masqués, les réafficher, les supprimer ou bannir des utilisateurs.
    - L’abus de la fonctionnalité de signalement peut entraîner des bannissements de compte.
    - Vous souhaitez devenir modérateur ? Demandez dans le Discord OpenClaw et contactez un modérateur ou un mainteneur.

  </Accordion>
</AccordionGroup>

## CLI ClawHub

Vous n’en avez besoin que pour les workflows authentifiés auprès du registre, comme
la publication/synchronisation.

### Options globales

<ParamField path="--workdir <dir>" type="string">
  Répertoire de travail. Par défaut : répertoire actuel ; bascule vers l’espace de travail OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Répertoire des skills, relatif au répertoire de travail.
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
  Affiche la version de la CLI.
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
    - `--label <label>` — libellé stocké pour les jetons de connexion navigateur (par défaut : `CLI token`).
    - `--no-browser` — ne pas ouvrir de navigateur (nécessite `--token`).

  </Accordion>
  <Accordion title="Rechercher">
    ```bash
    clawhub search "query"
    ```

    Recherche des skills. Pour la découverte de plugins/paquets, utilisez `clawhub package explore`.

    - `--limit <n>` — résultats maximum.

  </Accordion>
  <Accordion title="Parcourir / inspecter les plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` et `package inspect` sont les surfaces de la CLI ClawHub pour la découverte de plugins/paquets et l’inspection des métadonnées. Les installations natives OpenClaw utilisent toujours `openclaw plugins install clawhub:<package>`.

    Options :

    - `--family skill|code-plugin|bundle-plugin` — filtrer la famille de paquet.
    - `--official` — afficher uniquement les paquets officiels.
    - `--executes-code` — afficher uniquement les paquets qui exécutent du code.
    - `--version <version>` / `--tag <tag>` — inspecter une version de paquet spécifique.
    - `--versions`, `--files`, `--file <path>` — inspecter l’historique et les fichiers du paquet.
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

    - `--version <version>` — installer ou mettre à jour vers une version spécifique (slug unique uniquement sur `update`).
    - `--force` — écraser si le dossier existe déjà, ou lorsque les fichiers locaux ne correspondent à aucune version publiée.
    - `clawhub list` lit `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publier des skills">
    ```bash
    clawhub skill publish <path>
    ```

    Options :

    - `--slug <slug>` — slug du skill.
    - `--name <name>` — nom d’affichage.
    - `--version <version>` — version semver.
    - `--changelog <text>` — texte du journal des modifications (peut être vide).
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
    - `--json` — émettre une sortie lisible par machine pour la CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — remplacements facultatifs lorsque l’auto-détection ne suffit pas.

  </Accordion>
  <Accordion title="Demander des rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Les commandes de rescan nécessitent un jeton propriétaire connecté et ciblent la dernière
    version de skill publiée ou la dernière version de plugin. Dans les exécutions non interactives, passez
    `--yes`.

    Les réponses JSON incluent le type de cible, le nom, la version, l’état du rescan et
    les nombres de demandes restantes/maximales pour cette version ou publication.

  </Accordion>
  <Accordion title="Supprimer / restaurer (propriétaire ou administrateur)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchroniser (scanner localement + publier les nouveaux ou mis à jour)">
    ```bash
    clawhub sync
    ```

    Options :

    - `--root <dir...>` — racines de scan supplémentaires.
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

### Métadonnées de package Plugin

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

Les packages publiés doivent inclure du **JavaScript compilé** et faire pointer
`runtimeExtensions` vers cette sortie. Les installations depuis un checkout Git
peuvent toujours se rabattre sur la source TypeScript lorsqu’aucun fichier
compilé n’existe, mais les entrées runtime compilées évitent la compilation
TypeScript au runtime dans les chemins de démarrage, de diagnostic et de
chargement de plugin.

## Versionnement, fichier de verrouillage et télémétrie

<AccordionGroup>
  <Accordion title="Versionnement et tags">
    - Chaque publication crée une nouvelle `SkillVersion` **semver**.
    - Les tags (comme `latest`) pointent vers une version ; déplacer les tags permet de revenir en arrière.
    - Les journaux de modifications sont attachés par version et peuvent être vides lors de la synchronisation ou de la publication de mises à jour.

  </Accordion>
  <Accordion title="Modifications locales et versions du registre">
    Les mises à jour comparent le contenu local de la skill aux versions du registre à l’aide d’un
    hachage de contenu. Si les fichiers locaux ne correspondent à aucune version publiée, la
    CLI demande confirmation avant d’écraser (ou exige `--force` dans les
    exécutions non interactives).
  </Accordion>
  <Accordion title="Analyse de synchronisation et racines de repli">
    `clawhub sync` analyse d’abord votre répertoire de travail actuel. Si aucune skill n’est
    trouvée, il se rabat sur les emplacements hérités connus (par exemple
    `~/openclaw/skills` et `~/.openclaw/skills`). Cela est conçu pour
    trouver les anciennes installations de skills sans indicateurs supplémentaires.
  </Accordion>
  <Accordion title="Stockage et fichier de verrouillage">
    - Les skills installées sont enregistrées dans `.clawhub/lock.json` sous votre répertoire de travail.
    - Les jetons d’authentification sont stockés dans le fichier de configuration de la CLI ClawHub (surcharge via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Télémétrie (compteurs d’installation)">
    Lorsque vous exécutez `clawhub sync` en étant connecté, la CLI envoie un instantané
    minimal pour calculer les compteurs d’installation. Vous pouvez désactiver cela entièrement :

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variables d’environnement

| Variable                      | Effet                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | Remplacer l’URL du site.                        |
| `CLAWHUB_REGISTRY`            | Remplacer l’URL de l’API du registre.           |
| `CLAWHUB_CONFIG_PATH`         | Remplacer l’emplacement où la CLI stocke le jeton/la configuration. |
| `CLAWHUB_WORKDIR`             | Remplacer le répertoire de travail par défaut.  |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Désactiver la télémétrie sur `sync`.            |

## Connexe

- [Plugins communautaires](/fr/plugins/community)
- [Plugins](/fr/tools/plugin)
- [Skills](/fr/tools/skills)
