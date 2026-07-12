---
read_when:
    - Vous souhaitez comprendre `openclaw.ai/install.sh`
    - Vous souhaitez automatiser les installations (CI / sans interface graphique)
    - Vous souhaitez effectuer l’installation à partir d’une copie de travail GitHub
summary: Fonctionnement des scripts d’installation (install.sh, install-cli.sh, install.ps1), options et automatisation
title: Fonctionnement interne du programme d’installation
x-i18n:
    generated_at: "2026-07-12T02:44:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw fournit trois scripts d’installation, servis depuis `openclaw.ai`.

| Script                             | Plateforme             | Fonction                                                                                       |
| ---------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL    | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git et peut lancer la configuration initiale. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL    | Installe Node et OpenClaw dans un préfixe local (`~/.openclaw`) via npm ou git. Aucun accès root requis. |
| [`install.ps1`](#installps1)       | Windows (PowerShell)   | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git et peut lancer la configuration initiale. |

Tous trois prennent en charge Node **22.19+, 23.11+ ou 24+** ; Node 24 est la cible par défaut pour les nouvelles installations.

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
Recommandé pour la plupart des installations interactives sous macOS, Linux et WSL.
</Tip>

### Déroulement (install.sh)

<Steps>
  <Step title="Detect OS">
    Prend en charge macOS et Linux, y compris WSL.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Vérifie la version de Node et installe Node 24 si nécessaire (Homebrew sous macOS, scripts de configuration NodeSource sous Linux avec apt/dnf/yum). Sous macOS, Homebrew n’est installé que si le programme d’installation en a besoin pour Node ou Git. Node 22.19+ et 23.11+ restent pris en charge à des fins de compatibilité.
    Sous Alpine/Linux musl, le programme d’installation utilise les paquets apk au lieu de NodeSource ; les dépôts Alpine configurés doivent fournir une version de Node prise en charge (Alpine 3.21 ou version ultérieure au moment de la rédaction).
  </Step>
  <Step title="Ensure Git">
    Installe Git s’il est absent à l’aide du gestionnaire de paquets détecté, notamment Homebrew sous macOS et apk sous Alpine.
  </Step>
  <Step title="Install OpenClaw">
    - Méthode `npm` (par défaut) : installation globale avec npm
    - Méthode `git` : clone ou met à jour le dépôt, installe les dépendances avec pnpm, effectue la compilation, puis installe le lanceur dans `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Localise le binaire `openclaw` qui vient d’être installé afin d’exécuter les commandes suivantes
    - Pour une installation non configurée, lance la configuration initiale avant les vérifications doctor ou Gateway. Avec `--no-onboard` ou en l’absence de TTY, affiche la commande permettant de terminer ultérieurement la configuration.
    - Pour une installation configurée, actualise et redémarre au mieux un service Gateway chargé, puis exécute doctor. Lors des mises à niveau, met à jour les Plugins lorsque cela est possible ou affiche la commande manuelle lors d’une exécution sans interface permettant les invites.
    - Lorsque `--verify` est exécuté, vérifie la version installée et ne contrôle l’état du Gateway qu’après la création d’une configuration.

  </Step>
</Steps>

### Détection d’une copie de travail des sources

S’il est exécuté dans une copie de travail d’OpenClaw (`package.json` + `pnpm-workspace.yaml`), le script propose :

- d’utiliser la copie de travail (`git`) ; ou
- d’utiliser l’installation globale (`npm`).

Si aucun TTY n’est disponible et qu’aucune méthode d’installation n’est définie, il utilise `npm` par défaut et affiche un avertissement.

Le script se termine avec le code `2` si la méthode sélectionnée ou la valeur de `--install-method` est invalide.

### Exemples (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verify after install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Option                                  | Description                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Choisit la méthode d’installation (par défaut : `npm`)                  |
| `--npm`                                 | Raccourci pour la méthode npm                                           |
| `--git \| --github`                     | Raccourci pour la méthode git                                           |
| `--version <version\|dist-tag\|spec>`   | Version npm, balise de distribution ou spécification de paquet (par défaut : `latest`) |
| `--beta`                                | Utilise la balise de distribution bêta si elle est disponible, sinon revient à `latest` |
| `--git-dir \| --dir <path>`             | Répertoire de la copie de travail (par défaut : `~/openclaw`)           |
| `--no-git-update`                       | Ignore `git pull` pour une copie de travail existante                   |
| `--no-prompt`                           | Désactive les invites                                                   |
| `--no-onboard`                          | Ignore la configuration initiale                                       |
| `--onboard`                             | Active la configuration initiale                                       |
| `--verify`                              | Exécute une vérification rapide après l’installation (`--version`, état du Gateway s’il est chargé) |
| `--dry-run`                             | Affiche les actions sans appliquer les modifications                    |
| `--verbose`                             | Active la sortie de débogage (`set -x`, journaux npm de niveau notice)  |
| `--help \| -h`                          | Affiche l’aide                                                          |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variable                                          | Description                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Méthode d’installation                                             |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Version npm, balise de distribution ou spécification de paquet     |
| `OPENCLAW_BETA=0\|1`                              | Utilise la version bêta si elle est disponible                     |
| `OPENCLAW_HOME=<path>`                            | Répertoire de base pour l’état d’OpenClaw et les chemins git/de configuration initiale par défaut |
| `OPENCLAW_GIT_DIR=<path>`                         | Répertoire de la copie de travail                                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Active ou désactive les mises à jour git                           |
| `OPENCLAW_NO_PROMPT=1`                            | Désactive les invites                                              |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Exécute la vérification rapide après l’installation                |
| `OPENCLAW_NO_ONBOARD=1`                           | Ignore la configuration initiale                                  |
| `OPENCLAW_DRY_RUN=1`                              | Mode de simulation                                                 |
| `OPENCLAW_VERBOSE=1`                              | Mode de débogage                                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Niveau de journalisation npm (par défaut : `error`, masque les messages de dépréciation de npm) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Conçu pour les environnements dans lesquels tout doit être installé sous un préfixe local
(`~/.openclaw` par défaut), sans dépendance à une installation système de Node. Prend en charge par défaut les installations
avec npm, ainsi que les installations à partir d’une copie de travail git sous le même préfixe.
</Info>

### Déroulement (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Télécharge une archive tar épinglée d’une version LTS de Node prise en charge (la version est intégrée au script et mise à jour indépendamment ; valeur par défaut : `22.22.2`) dans `<prefix>/tools/node-v<version>` et vérifie sa somme SHA-256.
    Sous Alpine/Linux musl, où Node ne publie pas d’archives tar compatibles avec la version épinglée, installe `nodejs` et `npm` avec `apk`, puis lie cet environnement d’exécution au chemin du lanceur situé sous le préfixe. Les dépôts Alpine doivent fournir une version de Node prise en charge (22.19+, 23.11+ ou 24+) ; utilisez Alpine 3.21 ou une version ultérieure si les anciens dépôts ne fournissent que Node 20 ou 21.
  </Step>
  <Step title="Ensure Git">
    Si Git est absent, tente de l’installer avec apt/dnf/yum/apk sous Linux ou Homebrew sous macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - Méthode `npm` (par défaut) : installe OpenClaw sous le préfixe avec npm, puis écrit le lanceur dans `<prefix>/bin/openclaw`
    - Méthode `git` : clone ou met à jour une copie de travail (`~/openclaw` par défaut) et écrit également le lanceur dans `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Si un service Gateway est déjà chargé depuis ce même préfixe, le script exécute
    `openclaw gateway install --force`, puis `openclaw gateway restart`, et
    vérifie au mieux l’état du Gateway.
  </Step>
</Steps>

### Exemples (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Option                                  | Description                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Préfixe d’installation (par défaut : `~/.openclaw`)                                                  |
| `--install-method \| --method npm\|git` | Choisir la méthode d’installation (par défaut : `npm`)                                               |
| `--npm`                                 | Raccourci pour la méthode npm                                                                        |
| `--git \| --github`                     | Raccourci pour la méthode git                                                                        |
| `--git-dir \| --dir <path>`             | Répertoire d’extraction Git (par défaut : `~/openclaw`)                                              |
| `--version <ver>`                       | Version ou balise de distribution d’OpenClaw (par défaut : `latest`)                                 |
| `--node-version <ver>`                  | Version de Node (par défaut : `22.22.2`)                                                             |
| `--json`                                | Émettre des événements NDJSON                                                                        |
| `--onboard`                             | Exécuter `openclaw onboard` après l’installation                                                     |
| `--no-onboard`                          | Ignorer la configuration initiale (par défaut)                                                       |
| `--set-npm-prefix`                      | Sous Linux, forcer le préfixe npm à `~/.npm-global` si le préfixe actuel n’est pas accessible en écriture |
| `--help \| -h`                          | Afficher l’aide                                                                                       |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                    | Description                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Préfixe d’installation                                                                       |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Méthode d’installation                                                                       |
| `OPENCLAW_VERSION=<ver>`                    | Version ou balise de distribution d’OpenClaw                                                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | Version de Node                                                                              |
| `OPENCLAW_HOME=<path>`                      | Répertoire de base pour l’état d’OpenClaw et les chemins git/de configuration initiale par défaut |
| `OPENCLAW_GIT_DIR=<path>`                   | Répertoire d’extraction Git pour les installations via git                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activer ou désactiver les mises à jour git des extractions existantes                        |
| `OPENCLAW_NO_ONBOARD=1`                     | Ignorer la configuration initiale                                                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Niveau de journalisation npm (par défaut : `error`)                                           |

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
    Nécessite PowerShell 5 ou version ultérieure.
  </Step>
  <Step title="Vérifier la présence de Node.js 24 par défaut">
    S’il est absent, le script tente de l’installer avec winget, puis Chocolatey, puis Scoop. Si aucun gestionnaire de paquets n’est disponible, le script télécharge l’archive zip Windows officielle de Node.js 24 dans `%LOCALAPPDATA%\OpenClaw\deps\portable-node` et l’ajoute au PATH du processus actuel et de l’utilisateur. Node 22.19+ et 23.11+ restent pris en charge à des fins de compatibilité.
  </Step>
  <Step title="Installer OpenClaw">
    - Méthode `npm` (par défaut) : installation npm globale avec l’option `-Tag` sélectionnée, lancée depuis un répertoire temporaire d’installation accessible en écriture afin que les shells ouverts dans des dossiers protégés tels que `C:\` fonctionnent également
    - Méthode `git` : cloner/mettre à jour le dépôt, installer/compiler avec pnpm et installer le lanceur dans `%USERPROFILE%\.local\bin\openclaw.cmd`. Si Git est absent, le script amorce une installation locale à l’utilisateur de MinGit sous `%LOCALAPPDATA%\OpenClaw\deps\portable-git` et l’ajoute au PATH du processus actuel et de l’utilisateur.

  </Step>
  <Step title="Effectuer les tâches post-installation">
    - Ajouter au PATH de l’utilisateur le répertoire des exécutables requis lorsque cela est possible
    - Actualiser au mieux un service Gateway chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécuter `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)

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
  <Tab title="Installation via Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Extraction de la branche principale de GitHub">
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

| Option                      | Description                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `-InstallMethod npm\|git`   | Méthode d’installation (par défaut : `npm`)                                          |
| `-Tag <tag\|version\|spec>` | Balise de distribution npm, version ou spécification de paquet (par défaut : `latest`) |
| `-GitDir <path>`            | Répertoire d’extraction (par défaut : `%USERPROFILE%\openclaw`)                      |
| `-NoOnboard`                | Ignorer la configuration initiale                                                    |
| `-NoGitUpdate`              | Ignorer `git pull`                                                                   |
| `-DryRun`                   | Afficher uniquement les actions                                                      |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                           | Description                         |
| ---------------------------------- | ----------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Méthode d’installation              |
| `OPENCLAW_GIT_DIR=<path>`          | Répertoire d’extraction             |
| `OPENCLAW_NO_ONBOARD=1`            | Ignorer la configuration initiale   |
| `OPENCLAW_GIT_UPDATE=0`            | Désactiver `git pull`               |
| `OPENCLAW_DRY_RUN=1`               | Mode simulation                     |

  </Accordion>
</AccordionGroup>

<Note>
Si `-InstallMethod git` est utilisé et que Git est absent, le script tente d’abord d’amorcer une installation de MinGit locale à l’utilisateur avant d’afficher le lien vers Git for Windows.
</Note>

---

## CI et automatisation

Utilisez les options et variables d’environnement non interactives pour obtenir des exécutions prévisibles.

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
  <Tab title="install.ps1 (ignorer la configuration initiale)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Dépannage

<AccordionGroup>
  <Accordion title="Pourquoi Git est-il requis ?">
    Git est requis pour la méthode d’installation `git`. Pour les installations `npm`, Git est tout de même vérifié/installé afin d’éviter les échecs `spawn git ENOENT` lorsque des dépendances utilisent des URL git.
  </Accordion>

  <Accordion title="Pourquoi npm rencontre-t-il une erreur EACCES sous Linux ?">
    Certaines configurations Linux font pointer le préfixe global de npm vers des chemins appartenant à l’utilisateur root. `install.sh` peut remplacer le préfixe par `~/.npm-global` et ajouter les exportations PATH aux fichiers de configuration du shell (lorsque ces fichiers existent).
  </Accordion>

  <Accordion title='Windows : "npm error spawn git / ENOENT"'>
    Relancez le programme d’installation afin qu’il puisse amorcer une installation de MinGit locale à l’utilisateur, ou installez Git for Windows et rouvrez PowerShell.
  </Accordion>

  <Accordion title='Windows : "openclaw is not recognized"'>
    Exécutez `npm config get prefix` et ajoutez ce répertoire au PATH de votre utilisateur (aucun suffixe `\bin` n’est nécessaire sous Windows), puis rouvrez PowerShell.
  </Accordion>

  <Accordion title="Windows : comment obtenir une sortie détaillée du programme d’installation">
    `install.ps1` ne propose pas d’option `-Verbose`.
    Utilisez le traçage PowerShell pour les diagnostics au niveau du script :

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw introuvable après l’installation">
    Il s’agit généralement d’un problème de PATH. Consultez [le dépannage de Node.js](/fr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Mise à jour](/fr/install/updating)
- [Désinstallation](/fr/install/uninstall)
