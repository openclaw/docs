---
read_when:
    - Vous voulez comprendre `openclaw.ai/install.sh`
    - Vous souhaitez automatiser les installations (CI / sans interface graphique)
    - Vous souhaitez installer à partir d’une copie de travail GitHub
summary: Fonctionnement des scripts d’installation (install.sh, install-cli.sh, install.ps1), options et automatisation
title: Fonctionnement interne de l’installateur
x-i18n:
    generated_at: "2026-04-30T07:33:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw fournit trois scripts d’installation, servis depuis `openclaw.ai`.

| Script                             | Plateforme           | Ce qu’il fait                                                                                                  |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git, et peut lancer l’onboarding.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installe Node + OpenClaw dans un préfixe local (`~/.openclaw`) avec les modes npm ou checkout git. Aucun accès root requis. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git, et peut lancer l’onboarding.       |

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
Si l’installation réussit mais que `openclaw` est introuvable dans un nouveau terminal, consultez [Dépannage de Node.js](/fr/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recommandé pour la plupart des installations interactives sur macOS/Linux/WSL.
</Tip>

### Flux (install.sh)

<Steps>
  <Step title="Détecter l’OS">
    Prend en charge macOS et Linux (y compris WSL). Si macOS est détecté, installe Homebrew s’il est absent.
  </Step>
  <Step title="Garantir Node.js 24 par défaut">
    Vérifie la version de Node et installe Node 24 si nécessaire (Homebrew sur macOS, scripts de configuration NodeSource sur Linux apt/dnf/yum). OpenClaw prend toujours en charge Node 22 LTS, actuellement `22.14+`, pour la compatibilité.
  </Step>
  <Step title="Garantir Git">
    Installe Git s’il est absent.
  </Step>
  <Step title="Installer OpenClaw">
    - Méthode `npm` (par défaut) : installation npm globale
    - Méthode `git` : clone/met à jour le dépôt, installe les dépendances avec pnpm, compile, puis installe le wrapper dans `~/.local/bin/openclaw`

  </Step>
  <Step title="Tâches post-installation">
    - Actualise au mieux un service Gateway chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécute `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)
    - Tente l’onboarding lorsque c’est approprié (TTY disponible, onboarding non désactivé, et vérifications bootstrap/config réussies)
    - Définit par défaut `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Détection du checkout source

S’il est exécuté dans un checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), le script propose :

- utiliser le checkout (`git`), ou
- utiliser l’installation globale (`npm`)

Si aucun TTY n’est disponible et qu’aucune méthode d’installation n’est définie, il utilise `npm` par défaut et émet un avertissement.

Le script se termine avec le code `2` en cas de sélection de méthode invalide ou de valeurs `--install-method` invalides.

### Exemples (install.sh)

<Tabs>
  <Tab title="Par défaut">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Ignorer l’onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Installation git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="main GitHub via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Simulation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des options">

| Option                                | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Choisir la méthode d’installation (par défaut : `npm`). Alias : `--method` |
| `--npm`                               | Raccourci pour la méthode npm                              |
| `--git`                               | Raccourci pour la méthode git. Alias : `--github`          |
| `--version <version\|dist-tag\|spec>` | Version npm, dist-tag ou spécification de package (par défaut : `latest`) |
| `--beta`                              | Utiliser le dist-tag beta si disponible, sinon revenir à `latest` |
| `--git-dir <path>`                    | Répertoire de checkout (par défaut : `~/openclaw`). Alias : `--dir` |
| `--no-git-update`                     | Ignorer `git pull` pour un checkout existant               |
| `--no-prompt`                         | Désactiver les invites                                     |
| `--no-onboard`                        | Ignorer l’onboarding                                       |
| `--onboard`                           | Activer l’onboarding                                       |
| `--dry-run`                           | Afficher les actions sans appliquer les changements        |
| `--verbose`                           | Activer la sortie de débogage (`set -x`, journaux npm de niveau notice) |
| `--help`                              | Afficher l’utilisation (`-h`)                              |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                                | Description                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Méthode d’installation                        |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Version npm, dist-tag ou spécification de package |
| `OPENCLAW_BETA=0\|1`                                    | Utiliser beta si disponible                   |
| `OPENCLAW_GIT_DIR=<path>`                               | Répertoire de checkout                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Activer/désactiver les mises à jour git       |
| `OPENCLAW_NO_PROMPT=1`                                  | Désactiver les invites                        |
| `OPENCLAW_NO_ONBOARD=1`                                 | Ignorer l’onboarding                          |
| `OPENCLAW_DRY_RUN=1`                                    | Mode simulation                               |
| `OPENCLAW_VERBOSE=1`                                    | Mode débogage                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Niveau de journalisation npm                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Contrôler le comportement sharp/libvips (par défaut : `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Conçu pour les environnements où vous voulez tout placer sous un préfixe local
(par défaut `~/.openclaw`) et sans dépendance Node système. Prend en charge les installations npm
par défaut, ainsi que les installations par checkout git sous le même flux de préfixe.
</Info>

### Flux (install-cli.sh)

<Steps>
  <Step title="Installer le runtime Node local">
    Télécharge une archive tarball Node LTS prise en charge et épinglée (la version est intégrée au script et mise à jour indépendamment) vers `<prefix>/tools/node-v<version>` et vérifie le SHA-256.
  </Step>
  <Step title="Garantir Git">
    Si Git est absent, tente l’installation via apt/dnf/yum sur Linux ou Homebrew sur macOS.
  </Step>
  <Step title="Installer OpenClaw sous le préfixe">
    - Méthode `npm` (par défaut) : installe sous le préfixe avec npm, puis écrit le wrapper dans `<prefix>/bin/openclaw`
    - Méthode `git` : clone/met à jour un checkout (par défaut `~/openclaw`) et écrit quand même le wrapper dans `<prefix>/bin/openclaw`

  </Step>
  <Step title="Actualiser le service Gateway chargé">
    Si un service Gateway est déjà chargé depuis ce même préfixe, le script exécute
    `openclaw gateway install --force`, puis `openclaw gateway restart`, et
    sonde au mieux l’état de santé du Gateway.
  </Step>
</Steps>

### Exemples (install-cli.sh)

<Tabs>
  <Tab title="Par défaut">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Préfixe + version personnalisés">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Installation git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Sortie JSON d’automatisation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Lancer l’onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des options">

| Option                      | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Préfixe d’installation (par défaut : `~/.openclaw`)                             |
| `--install-method npm\|git` | Choisir la méthode d’installation (par défaut : `npm`). Alias : `--method`      |
| `--npm`                     | Raccourci pour la méthode npm                                                   |
| `--git`, `--github`         | Raccourci pour la méthode git                                                   |
| `--git-dir <path>`          | Répertoire de checkout Git (par défaut : `~/openclaw`). Alias : `--dir`         |
| `--version <ver>`           | Version OpenClaw ou dist-tag (par défaut : `latest`)                            |
| `--node-version <ver>`      | Version de Node (par défaut : `22.22.0`)                                        |
| `--json`                    | Émettre des événements NDJSON                                                   |
| `--onboard`                 | Exécuter `openclaw onboard` après l’installation                                |
| `--no-onboard`              | Ignorer l’onboarding (par défaut)                                               |
| `--set-npm-prefix`          | Sur Linux, forcer le préfixe npm à `~/.npm-global` si le préfixe actuel n’est pas accessible en écriture |
| `--help`                    | Afficher l’utilisation (`-h`)                                                   |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                    | Description                                             |
| ------------------------------------------- | ------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Préfixe d’installation                                  |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Méthode d’installation                                  |
| `OPENCLAW_VERSION=<ver>`                    | Version OpenClaw ou dist-tag                            |
| `OPENCLAW_NODE_VERSION=<ver>`               | Version Node                                            |
| `OPENCLAW_GIT_DIR=<path>`                   | Répertoire de checkout Git pour les installations git   |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activer/désactiver les mises à jour git des checkouts existants |
| `OPENCLAW_NO_ONBOARD=1`                     | Ignorer l’intégration                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Niveau de journalisation npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Contrôler le comportement de sharp/libvips (par défaut : `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flux (install.ps1)

<Steps>
  <Step title="Vérifier l’environnement PowerShell + Windows">
    Nécessite PowerShell 5+.
  </Step>
  <Step title="Vérifier Node.js 24 par défaut">
    S’il est absent, tente l’installation via winget, puis Chocolatey, puis Scoop. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour la compatibilité.
  </Step>
  <Step title="Installer OpenClaw">
    - Méthode `npm` (par défaut) : installation npm globale avec le `-Tag` sélectionné
    - Méthode `git` : cloner/mettre à jour le dépôt, installer/compiler avec pnpm, et installer le wrapper dans `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tâches post-installation">
    - Ajoute le répertoire bin nécessaire au PATH utilisateur lorsque c’est possible
    - Actualise au mieux un service Gateway chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécute `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)

  </Step>
  <Step title="Gérer les échecs">
    `iwr ... | iex` et les installations par bloc de script signalent une erreur terminale sans fermer la session PowerShell actuelle. Les installations directes avec `powershell -File` / `pwsh -File` quittent toujours avec un code non nul pour l’automatisation.
  </Step>
</Steps>

### Exemples (install.ps1)

<Tabs>
  <Tab title="Par défaut">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Installation git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="main GitHub via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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
  <Tab title="Trace de débogage">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des flags">

| Flag                        | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Méthode d’installation (par défaut : `npm`)                |
| `-Tag <tag\|version\|spec>` | dist-tag npm, version ou spécification de paquet (par défaut : `latest`) |
| `-GitDir <path>`            | Répertoire de checkout (par défaut : `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Ignorer l’intégration                                      |
| `-NoGitUpdate`              | Ignorer `git pull`                                         |
| `-DryRun`                   | Afficher uniquement les actions                            |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                           | Description             |
| ---------------------------------- | ----------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Méthode d’installation  |
| `OPENCLAW_GIT_DIR=<path>`          | Répertoire de checkout  |
| `OPENCLAW_NO_ONBOARD=1`            | Ignorer l’intégration   |
| `OPENCLAW_GIT_UPDATE=0`            | Désactiver git pull     |
| `OPENCLAW_DRY_RUN=1`               | Mode simulation         |

  </Accordion>
</AccordionGroup>

<Note>
Si `-InstallMethod git` est utilisé et que Git est absent, le script quitte et affiche le lien Git for Windows.
</Note>

---

## CI et automatisation

Utilisez des flags/variables d’environnement non interactifs pour des exécutions prévisibles.

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
  <Tab title="install.ps1 (ignorer l’intégration)">
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

  <Accordion title="Pourquoi npm rencontre-t-il EACCES sous Linux ?">
    Certaines configurations Linux pointent le préfixe global npm vers des chemins appartenant à root. `install.sh` peut basculer le préfixe vers `~/.npm-global` et ajouter les exports PATH aux fichiers rc du shell (lorsque ces fichiers existent).
  </Accordion>

  <Accordion title="Problèmes sharp/libvips">
    Les scripts définissent par défaut `SHARP_IGNORE_GLOBAL_LIBVIPS=1` pour éviter que sharp soit compilé avec le libvips système. Pour remplacer ce réglage :

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows : "npm error spawn git / ENOENT"'>
    Installez Git for Windows, rouvrez PowerShell, puis relancez l’installateur.
  </Accordion>

  <Accordion title='Windows : "openclaw is not recognized"'>
    Exécutez `npm config get prefix` et ajoutez ce répertoire à votre PATH utilisateur (aucun suffixe `\bin` n’est nécessaire sous Windows), puis rouvrez PowerShell.
  </Accordion>

  <Accordion title="Windows : comment obtenir une sortie d’installateur détaillée">
    `install.ps1` n’expose actuellement pas de commutateur `-Verbose`.
    Utilisez le traçage PowerShell pour les diagnostics au niveau du script :

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw introuvable après l’installation">
    Il s’agit généralement d’un problème de PATH. Consultez le [dépannage Node.js](/fr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Mise à jour](/fr/install/updating)
- [Désinstallation](/fr/install/uninstall)
