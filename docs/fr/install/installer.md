---
read_when:
    - Vous souhaitez comprendre `openclaw.ai/install.sh`
    - Vous souhaitez automatiser les installations (CI / sans interface graphique)
    - Vous souhaitez effectuer l’installation à partir d’un dépôt GitHub extrait localement
summary: Fonctionnement des scripts d’installation (install.sh, install-cli.sh, install.ps1), options et automatisation
title: Fonctionnement interne du programme d’installation
x-i18n:
    generated_at: "2026-07-16T13:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw fournit trois scripts d’installation, servis depuis `openclaw.ai`.

| Script                             | Plateforme           | Fonction                                                                                       |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git et peut lancer la configuration initiale. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installe Node + OpenClaw dans un préfixe local (`~/.openclaw`) via npm ou git. Aucun accès root requis. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git et peut lancer la configuration initiale. |

Tous trois prennent en charge Node **22.22.3+, 24.15+ ou 25.9+** ; Node 24 est la cible par défaut pour les nouvelles installations.

## Commandes rapides

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Si l’installation réussit, mais que `openclaw` est introuvable dans un nouveau terminal, consultez la section [Dépannage de Node.js](/fr/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recommandé pour la plupart des installations interactives sur macOS/Linux/WSL.
</Tip>

### Déroulement (install.sh)

<Steps>
  <Step title="Détecter le système d’exploitation">
    Prend en charge macOS et Linux (y compris WSL).
  </Step>
  <Step title="Garantir Node.js 24 par défaut">
    Vérifie la version de Node et installe Node 24 si nécessaire (Homebrew sur macOS, scripts de configuration NodeSource sur Linux avec apt/dnf/yum). Sur macOS, Homebrew n’est installé que lorsque le programme d’installation en a besoin pour Node ou Git. Node 22.22.3+, Node 24.15+ et Node 25.9+ sont pris en charge ; Node 23 ne l’est pas.
    Sur Linux Alpine/musl, le programme d’installation utilise les paquets apk au lieu de NodeSource et vérifie la version réelle de SQLite liée. Les flux de paquets Alpine stables actuels peuvent fournir une version suffisamment récente de Node avec une version vulnérable de SQLite système ; dans ce cas, utilisez plutôt un conteneur `node:24-alpine` officiel ou un hôte basé sur glibc.
  </Step>
  <Step title="Garantir la présence de Git">
    Installe Git s’il est absent à l’aide du gestionnaire de paquets détecté, notamment Homebrew sur macOS et apk sur Alpine.
  </Step>
  <Step title="Installer OpenClaw">
    - Méthode `npm` (par défaut) : installation npm globale
    - Méthode `git` : clone ou met à jour le dépôt, installe les dépendances avec pnpm, effectue la compilation, puis installe le script enveloppe dans `~/.local/bin/openclaw`

  </Step>
  <Step title="Tâches après l’installation">
    - Résout le binaire `openclaw` qui vient d’être installé pour les commandes suivantes
    - Pour une installation non configurée, lance la configuration initiale avant les sondes doctor ou Gateway. Avec `--no-onboard` ou sans TTY, affiche la commande permettant de terminer la configuration ultérieurement.
    - Pour une installation configurée, actualise et redémarre au mieux un service Gateway chargé, puis exécute doctor. Les mises à niveau mettent à jour les plugins lorsque cela est possible ou affichent la commande manuelle lors d’une exécution sans interface avec les invites activées.
    - Lorsque `--verify` s’exécute, vérifie la version installée et ne contrôle l’état du Gateway qu’une fois la configuration présente.

  </Step>
</Steps>

### Détection d’une copie de travail des sources

S’il est exécuté dans une copie de travail d’OpenClaw (`package.json` + `pnpm-workspace.yaml`), le script propose :

- utiliser la copie de travail (`git`), ou
- utiliser l’installation globale (`npm`)

Si aucun TTY n’est disponible et qu’aucune méthode d’installation n’est définie, il utilise par défaut `npm` et affiche un avertissement.

Le script se termine avec le code `2` en cas de sélection d’une méthode non valide ou de valeurs `--install-method` non valides.

### Exemples (install.sh)

<Tabs>
  <Tab title="Par défaut">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Ignorer la configuration initiale">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Installation Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Copie de travail de la branche principale GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Simulation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Vérifier après l’installation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des options">

| Option                                  | Description                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Choisit la méthode d’installation (par défaut : `npm`)                 |
| `--npm`                                 | Raccourci pour la méthode npm                                           |
| `--git \| --github`                     | Raccourci pour la méthode git                                           |
| `--version <version\|dist-tag\|spec>`   | Version npm, balise de distribution ou spécification de paquet (par défaut : `latest`) |
| `--beta`                                | Utilise la balise de distribution beta si elle est disponible, sinon revient à `latest` |
| `--git-dir \| --dir <path>`             | Répertoire de la copie de travail (par défaut : `~/openclaw`)          |
| `--no-git-update`                       | Ignore `git pull` pour une copie de travail existante                   |
| `--no-prompt`                           | Désactive les invites                                                  |
| `--no-onboard`                          | Ignore la configuration initiale                                       |
| `--onboard`                             | Active la configuration initiale                                       |
| `--verify`                              | Exécute une vérification rapide après l’installation (`--version`, état du Gateway s’il est chargé) |
| `--dry-run`                             | Affiche les actions sans appliquer les modifications                    |
| `--verbose`                             | Active la sortie de débogage (`set -x`, journaux npm de niveau notice) |
| `--help \| -h`                          | Affiche l’aide                                                         |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                          | Description                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Méthode d’installation                                             |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Version npm, balise de distribution ou spécification de paquet    |
| `OPENCLAW_BETA=0\|1`                              | Utilise la version beta si elle est disponible                     |
| `OPENCLAW_HOME=<path>`                            | Répertoire de base pour l’état d’OpenClaw et les chemins git/de configuration initiale par défaut |
| `OPENCLAW_GIT_DIR=<path>`                         | Répertoire de la copie de travail                                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Active ou désactive les mises à jour git                           |
| `OPENCLAW_NO_PROMPT=1`                            | Désactive les invites                                              |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Exécute la vérification rapide après l’installation                |
| `OPENCLAW_NO_ONBOARD=1`                           | Ignore la configuration initiale                                  |
| `OPENCLAW_DRY_RUN=1`                              | Mode simulation                                                    |
| `OPENCLAW_VERBOSE=1`                              | Mode débogage                                                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Niveau de journalisation npm (par défaut : `error`, masque les messages d’obsolescence npm) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Conçu pour les environnements dans lesquels tout doit se trouver sous un préfixe local
(par défaut `~/.openclaw`) sans dépendance système à Node. Prend en charge par défaut les installations npm,
ainsi que les installations depuis une copie de travail git selon le même processus avec préfixe.
</Info>

### Déroulement (install-cli.sh)

<Steps>
  <Step title="Installer l’environnement d’exécution Node local">
    Télécharge une archive tar d’une version LTS de Node prise en charge et épinglée (la version est intégrée au script et mise à jour indépendamment, par défaut `24.15.0`) dans `<prefix>/tools/node-v<version>`, puis vérifie son SHA-256.
    Linux ARMv7 utilise Node `22.22.3`, car les binaires ARMv7 officiels de Node 24+ ne sont pas disponibles.
    Sur Linux Alpine/musl, où Node ne publie pas d’archives tar compatibles avec l’environnement d’exécution épinglé, installe `nodejs` et `npm` avec `apk`, puis vérifie Node ainsi que la bibliothèque SQLite réellement liée. Les flux de paquets Alpine stables actuels peuvent encore lier une version vulnérable de SQLite même avec une version suffisamment récente de Node ; utilisez un conteneur `node:24-alpine` officiel ou un hôte basé sur glibc lorsque le contrôle de sécurité rejette le paquet.
  </Step>
  <Step title="Garantir la présence de Git">
    Si Git est absent, tente de l’installer via apt/dnf/yum/apk sur Linux ou Homebrew sur macOS.
  </Step>
  <Step title="Installer OpenClaw sous le préfixe">
    - Méthode `npm` (par défaut) : installe sous le préfixe avec npm, puis écrit le script enveloppe dans `<prefix>/bin/openclaw`
    - Méthode `git` : clone ou met à jour une copie de travail (par défaut `~/openclaw`) et écrit également le script enveloppe dans `<prefix>/bin/openclaw`

  </Step>
  <Step title="Actualiser le service Gateway chargé">
    Si un service Gateway est déjà chargé depuis ce même préfixe, le script exécute
    `openclaw gateway install --force`, qui active le service de remplacement,
    puis sonde au mieux l’état du Gateway.
  </Step>
</Steps>

### Exemples (install-cli.sh)

<Tabs>
  <Tab title="Par défaut">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Préfixe et version personnalisés">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Installation Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Sortie JSON pour l’automatisation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Exécuter la configuration initiale">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des options">

| Option                                  | Description                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Préfixe d’installation (par défaut : `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Choisir la méthode d’installation (par défaut : `npm`)                                          |
| `--npm`                                 | Raccourci pour la méthode npm                                                         |
| `--git \| --github`                     | Raccourci pour la méthode git                                                         |
| `--git-dir \| --dir <path>`             | Répertoire d’extraction Git (par défaut : `~/openclaw`)                                  |
| `--version <ver>`                       | Version ou dist-tag d’OpenClaw (par défaut : `latest`)                                |
| `--node-version <ver>`                  | Version de Node (par défaut : `24.15.0` ; `22.22.3` sur Linux ARMv7)                     |
| `--json`                                | Émettre des événements NDJSON                                                              |
| `--onboard`                             | Exécuter `openclaw onboard` après l’installation                                            |
| `--no-onboard`                          | Ignorer l’intégration initiale (par défaut)                                                       |
| `--set-npm-prefix`                      | Sous Linux, forcer le préfixe npm à `~/.npm-global` si le préfixe actuel n’est pas accessible en écriture |
| `--help \| -h`                          | Afficher l’aide                                                                      |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                    | Description                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Préfixe d’installation                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Méthode d’installation                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Version ou dist-tag d’OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Version de Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Répertoire de base pour l’état d’OpenClaw et les chemins git/d’intégration initiale par défaut |
| `OPENCLAW_GIT_DIR=<path>`                   | Répertoire d’extraction Git pour les installations git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activer ou désactiver les mises à jour git des extractions existantes                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Ignorer l’intégration initiale                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Niveau de journalisation npm (par défaut : `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` et les autres spécifications de source GitHub ne sont pas des cibles `--version` valides pour les installations npm. Utilisez plutôt `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Déroulement (install.ps1)

<Steps>
  <Step title="Vérifier l’environnement PowerShell et Windows">
    Nécessite PowerShell 5+.
  </Step>
  <Step title="Vérifier Node.js 24 par défaut">
    S’il est absent, tente de l’installer avec winget, puis Chocolatey, puis Scoop. Si aucun gestionnaire de paquets n’est disponible, le script télécharge l’archive zip Windows officielle de Node.js 24 dans `%LOCALAPPDATA%\OpenClaw\deps\portable-node` et l’ajoute au PATH du processus actuel et de l’utilisateur. Node 22.22.3+, Node 24.15+ et Node 25.9+ sont pris en charge ; Node 23 ne l’est pas.
  </Step>
  <Step title="Installer OpenClaw">
    - Méthode `npm` (par défaut) : installation npm globale à l’aide de la valeur `-Tag` sélectionnée, lancée depuis un répertoire temporaire d’installation accessible en écriture afin que les shells ouverts dans des dossiers protégés comme `C:\` fonctionnent tout de même
    - Méthode `git` : clone/met à jour le dépôt, effectue l’installation et la compilation avec pnpm, puis installe le wrapper dans `%USERPROFILE%\.local\bin\openclaw.cmd`. Si Git est absent, le script amorce une version MinGit locale à l’utilisateur sous `%LOCALAPPDATA%\OpenClaw\deps\portable-git` et l’ajoute au PATH du processus actuel et de l’utilisateur.

  </Step>
  <Step title="Effectuer les tâches après l’installation">
    - Ajoute le répertoire de binaires requis au PATH de l’utilisateur lorsque cela est possible
    - Actualise au mieux un service Gateway chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécute `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)

  </Step>
  <Step title="Gérer les échecs">
    Les installations via `iwr ... | iex` et bloc de script signalent une erreur bloquante sans fermer la session PowerShell actuelle. Les installations directes via `powershell -File` / `pwsh -File` se terminent toujours avec un code différent de zéro pour l’automatisation.
  </Step>
</Steps>

### Exemples (install.ps1)

<Tabs>
  <Tab title="Par défaut">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Installation Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Extraction de la branche principale GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Répertoire git personnalisé">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Simulation">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des options">

| Option                      | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Méthode d’installation (par défaut : `npm`)                            |
| `-Tag <tag\|version\|spec>` | Dist-tag, version ou spécification de paquet npm (par défaut : `latest`) |
| `-GitDir <path>`            | Répertoire d’extraction (par défaut : `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Ignorer l’intégration initiale                                            |
| `-NoGitUpdate`              | Ignorer `git pull`                                            |
| `-DryRun`                   | Afficher uniquement les actions                                         |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                           | Description                  |
| ---------------------------------- | ---------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Méthode d’installation       |
| `OPENCLAW_GIT_DIR=<path>`          | Répertoire d’extraction      |
| `OPENCLAW_NO_ONBOARD=1`            | Ignorer l’intégration initiale |
| `OPENCLAW_GIT_UPDATE=0`            | Désactiver git pull          |
| `OPENCLAW_DRY_RUN=1`               | Mode simulation              |

  </Accordion>
</AccordionGroup>

<Note>
Si `-InstallMethod git` est utilisé et que Git est absent, le script tente d’abord d’amorcer une version MinGit locale à l’utilisateur avant d’afficher le lien vers Git for Windows.
</Note>

---

## CI et automatisation

Utilisez des options ou variables d’environnement non interactives pour obtenir des exécutions prévisibles.

<Tabs>
  <Tab title="install.sh (npm non interactif)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git non interactif)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (ignorer l’intégration initiale)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Pourquoi Git est-il requis ?">
    Git est requis pour la méthode d’installation `git`. Pour les installations `npm`, Git est tout de même vérifié/installé afin d’éviter les échecs de `spawn git ENOENT` lorsque des dépendances utilisent des URL git.
  </Accordion>

  <Accordion title="Pourquoi npm rencontre-t-il une erreur EACCES sous Linux ?">
    Dans certaines configurations Linux, le préfixe global de npm pointe vers des chemins appartenant à root. `install.sh` peut remplacer le préfixe par `~/.npm-global` et ajouter des exportations PATH aux fichiers rc du shell (lorsque ces fichiers existent).
  </Accordion>

  <Accordion title='Windows : "npm error spawn git / ENOENT"'>
    Relancez le programme d’installation afin qu’il puisse amorcer une version MinGit locale à l’utilisateur, ou installez Git for Windows et rouvrez PowerShell.
  </Accordion>

  <Accordion title='Windows : "openclaw is not recognized"'>
    Exécutez `npm config get prefix` et ajoutez ce répertoire au PATH de votre utilisateur (aucun suffixe `\bin` n’est nécessaire sous Windows), puis rouvrez PowerShell.
  </Accordion>

  <Accordion title="Windows : comment obtenir une sortie détaillée du programme d’installation">
    `install.ps1` ne fournit pas d’option `-Verbose`.
    Utilisez le traçage PowerShell pour les diagnostics au niveau du script :

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw introuvable après l’installation">
    Il s’agit généralement d’un problème de PATH. Consultez la [résolution des problèmes de Node.js](/fr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Pages associées

- [Présentation de l’installation](/fr/install)
- [Mise à jour](/fr/install/updating)
- [Désinstallation](/fr/install/uninstall)
