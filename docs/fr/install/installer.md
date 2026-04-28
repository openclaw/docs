---
read_when:
    - Vous voulez comprendre `openclaw.ai/install.sh`
    - Vous voulez automatiser les installations (CI / sans interface)
    - Vous voulez installer depuis un checkout GitHub
summary: Fonctionnement des scripts d’installation (`install.sh`, `install-cli.sh`, `install.ps1`), indicateurs et automatisation
title: Fonctionnement interne de l’installateur
x-i18n:
    generated_at: "2026-04-26T11:32:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw fournit trois scripts d’installation, servis depuis `openclaw.ai`.

| Script                             | Plateforme           | Ce qu’il fait                                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git, et peut exécuter l’onboarding.      |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installe Node + OpenClaw dans un préfixe local (`~/.openclaw`) avec les modes npm ou checkout git. Pas de root requis. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git, et peut exécuter l’onboarding.      |

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
Si l’installation réussit mais que `openclaw` est introuvable dans un nouveau terminal, voir [Dépannage Node.js](/fr/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recommandé pour la plupart des installations interactives sur macOS/Linux/WSL.
</Tip>

### Flux (install.sh)

<Steps>
  <Step title="Détecter le système d’exploitation">
    Prend en charge macOS et Linux (y compris WSL). Si macOS est détecté, installe Homebrew s’il est absent.
  </Step>
  <Step title="Garantir Node.js 24 par défaut">
    Vérifie la version de Node et installe Node 24 si nécessaire (Homebrew sur macOS, scripts d’installation NodeSource sur Linux apt/dnf/yum). OpenClaw prend toujours en charge Node 22 LTS, actuellement `22.14+`, pour compatibilité.
  </Step>
  <Step title="Garantir Git">
    Installe Git s’il est absent.
  </Step>
  <Step title="Installer OpenClaw">
    - méthode `npm` (par défaut) : installation npm globale
    - méthode `git` : clone/met à jour le dépôt, installe les dépendances avec pnpm, compile, puis installe le wrapper dans `~/.local/bin/openclaw`

  </Step>
  <Step title="Tâches post-installation">
    - Rafraîchit au mieux un service gateway déjà chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécute `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)
    - Tente l’onboarding lorsque c’est approprié (TTY disponible, onboarding non désactivé, et vérifications bootstrap/configuration réussies)
    - Définit par défaut `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Détection de checkout source

S’il est exécuté dans un checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), le script propose :

- utiliser le checkout (`git`), ou
- utiliser l’installation globale (`npm`)

Si aucun TTY n’est disponible et qu’aucune méthode d’installation n’est définie, il choisit `npm` par défaut et affiche un avertissement.

Le script se termine avec le code `2` pour une sélection de méthode invalide ou des valeurs `--install-method` invalides.

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
  <Tab title="GitHub main via npm">
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
  <Accordion title="Référence des indicateurs">

| Indicateur                            | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Choisir la méthode d’installation (par défaut : `npm`). Alias : `--method` |
| `--npm`                               | Raccourci pour la méthode npm                              |
| `--git`                               | Raccourci pour la méthode git. Alias : `--github`          |
| `--version <version\|dist-tag\|spec>` | Version npm, dist-tag ou spécification de paquet (par défaut : `latest`) |
| `--beta`                              | Utiliser le dist-tag beta s’il est disponible, sinon revenir à `latest` |
| `--git-dir <path>`                    | Répertoire de checkout (par défaut : `~/openclaw`). Alias : `--dir` |
| `--no-git-update`                     | Ignorer `git pull` pour un checkout existant               |
| `--no-prompt`                         | Désactiver les invites                                     |
| `--no-onboard`                        | Ignorer l’onboarding                                       |
| `--onboard`                           | Activer l’onboarding                                       |
| `--dry-run`                           | Afficher les actions sans appliquer les modifications      |
| `--verbose`                           | Activer la sortie de débogage (`set -x`, journaux npm au niveau notice) |
| `--help`                              | Afficher l’aide (`-h`)                                     |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                                | Description                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Méthode d’installation                        |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Version npm, dist-tag ou spécification de paquet |
| `OPENCLAW_BETA=0\|1`                                    | Utiliser beta si disponible                   |
| `OPENCLAW_GIT_DIR=<path>`                               | Répertoire de checkout                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Activer/désactiver les mises à jour git       |
| `OPENCLAW_NO_PROMPT=1`                                  | Désactiver les invites                        |
| `OPENCLAW_NO_ONBOARD=1`                                 | Ignorer l’onboarding                          |
| `OPENCLAW_DRY_RUN=1`                                    | Mode simulation                               |
| `OPENCLAW_VERBOSE=1`                                    | Mode débogage                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Niveau de journalisation npm                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Contrôler le comportement de sharp/libvips (par défaut : `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Conçu pour les environnements où vous voulez tout sous un préfixe local
(par défaut `~/.openclaw`) et sans dépendance à un Node système. Prend en charge par défaut les installations npm,
ainsi que les installations depuis checkout git dans le même flux à préfixe.
</Info>

### Flux (install-cli.sh)

<Steps>
  <Step title="Installer un runtime Node local">
    Télécharge une archive tarball Node LTS prise en charge et épinglée (la version est intégrée au script et mise à jour indépendamment) dans `<prefix>/tools/node-v<version>` et vérifie le SHA-256.
  </Step>
  <Step title="Garantir Git">
    Si Git est absent, tente de l’installer via apt/dnf/yum sur Linux ou Homebrew sur macOS.
  </Step>
  <Step title="Installer OpenClaw sous le préfixe">
    - méthode `npm` (par défaut) : installe sous le préfixe avec npm, puis écrit le wrapper dans `<prefix>/bin/openclaw`
    - méthode `git` : clone/met à jour un checkout (par défaut `~/openclaw`) et écrit quand même le wrapper dans `<prefix>/bin/openclaw`

  </Step>
  <Step title="Rafraîchir le service gateway chargé">
    Si un service gateway est déjà chargé depuis ce même préfixe, le script exécute
    `openclaw gateway install --force`, puis `openclaw gateway restart`, et
    vérifie l’état de santé de la gateway au mieux.
  </Step>
</Steps>

### Exemples (install-cli.sh)

<Tabs>
  <Tab title="Par défaut">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Préfixe personnalisé + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Installation git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Sortie JSON pour automatisation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Exécuter l’onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des indicateurs">

| Indicateur                | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`         | Préfixe d’installation (par défaut : `~/.openclaw`)                             |
| `--install-method npm\|git` | Choisir la méthode d’installation (par défaut : `npm`). Alias : `--method`   |
| `--npm`                   | Raccourci pour la méthode npm                                                   |
| `--git`, `--github`       | Raccourci pour la méthode git                                                   |
| `--git-dir <path>`        | Répertoire de checkout git (par défaut : `~/openclaw`). Alias : `--dir`        |
| `--version <ver>`         | Version OpenClaw ou dist-tag (par défaut : `latest`)                            |
| `--node-version <ver>`    | Version de Node (par défaut : `22.22.0`)                                        |
| `--json`                  | Émettre des événements NDJSON                                                   |
| `--onboard`               | Exécuter `openclaw onboard` après l’installation                                |
| `--no-onboard`            | Ignorer l’onboarding (par défaut)                                               |
| `--set-npm-prefix`        | Sur Linux, forcer le préfixe npm à `~/.npm-global` si le préfixe actuel n’est pas accessible en écriture |
| `--help`                  | Afficher l’aide (`-h`)                                                          |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                    | Description                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Préfixe d’installation                        |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Méthode d’installation                        |
| `OPENCLAW_VERSION=<ver>`                    | Version OpenClaw ou dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | Version de Node                               |
| `OPENCLAW_GIT_DIR=<path>`                   | Répertoire de checkout git pour les installations git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activer/désactiver les mises à jour git pour les checkouts existants |
| `OPENCLAW_NO_ONBOARD=1`                     | Ignorer l’onboarding                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Niveau de journalisation npm                  |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Contrôler le comportement de sharp/libvips (par défaut : `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flux (install.ps1)

<Steps>
  <Step title="Garantir PowerShell + environnement Windows">
    Nécessite PowerShell 5+.
  </Step>
  <Step title="Garantir Node.js 24 par défaut">
    S’il est absent, tente l’installation via winget, puis Chocolatey, puis Scoop. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour compatibilité.
  </Step>
  <Step title="Installer OpenClaw">
    - méthode `npm` (par défaut) : installation npm globale en utilisant le `-Tag` sélectionné
    - méthode `git` : clone/met à jour le dépôt, installe/compile avec pnpm, et installe le wrapper dans `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tâches post-installation">
    - Ajoute le répertoire bin nécessaire au PATH utilisateur lorsque c’est possible
    - Rafraîchit au mieux un service gateway déjà chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécute `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)

  </Step>
  <Step title="Gérer les échecs">
    Les installations `iwr ... | iex` et scriptblock signalent une erreur terminale sans fermer la session PowerShell en cours. Les installations directes `powershell -File` / `pwsh -File` se terminent quand même avec un code non nul pour l’automatisation.
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
  <Tab title="GitHub main via npm">
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
    # install.ps1 n’a pas encore d’indicateur -Verbose dédié.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des indicateurs">

| Indicateur                 | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`  | Méthode d’installation (par défaut : `npm`)               |
| `-Tag <tag\|version\|spec>` | Dist-tag npm, version ou spécification de paquet (par défaut : `latest`) |
| `-GitDir <path>`           | Répertoire de checkout (par défaut : `%USERPROFILE%\openclaw`) |
| `-NoOnboard`               | Ignorer l’onboarding                                       |
| `-NoGitUpdate`             | Ignorer `git pull`                                         |
| `-DryRun`                  | Afficher les actions uniquement                            |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                           | Description              |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Méthode d’installation   |
| `OPENCLAW_GIT_DIR=<path>`          | Répertoire de checkout   |
| `OPENCLAW_NO_ONBOARD=1`            | Ignorer l’onboarding     |
| `OPENCLAW_GIT_UPDATE=0`            | Désactiver git pull      |
| `OPENCLAW_DRY_RUN=1`               | Mode simulation          |

  </Accordion>
</AccordionGroup>

<Note>
Si `-InstallMethod git` est utilisé et que Git est absent, le script s’arrête et affiche le lien vers Git for Windows.
</Note>

---

## CI et automatisation

Utilisez des indicateurs/variables d’environnement non interactifs pour des exécutions prévisibles.

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
  <Tab title="install.ps1 (ignorer l’onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Dépannage

<AccordionGroup>
  <Accordion title="Pourquoi Git est-il requis ?">
    Git est requis pour la méthode d’installation `git`. Pour les installations `npm`, Git est quand même vérifié/installé afin d’éviter les échecs `spawn git ENOENT` lorsque des dépendances utilisent des URL git.
  </Accordion>

  <Accordion title="Pourquoi npm rencontre-t-il EACCES sur Linux ?">
    Certaines configurations Linux pointent le préfixe global npm vers des chemins appartenant à root. `install.sh` peut basculer le préfixe vers `~/.npm-global` et ajouter des exports PATH aux fichiers rc du shell (lorsque ces fichiers existent).
  </Accordion>

  <Accordion title="Problèmes sharp/libvips">
    Les scripts définissent par défaut `SHARP_IGNORE_GLOBAL_LIBVIPS=1` afin d’éviter que sharp compile contre libvips système. Pour remplacer ce comportement :

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows : "npm error spawn git / ENOENT"'>
    Installez Git for Windows, rouvrez PowerShell, puis relancez l’installateur.
  </Accordion>

  <Accordion title='Windows : "openclaw is not recognized"'>
    Exécutez `npm config get prefix` et ajoutez ce répertoire à votre PATH utilisateur (pas besoin du suffixe `\bin` sur Windows), puis rouvrez PowerShell.
  </Accordion>

  <Accordion title="Windows : comment obtenir une sortie d’installation verbeuse">
    `install.ps1` n’expose pas actuellement d’option `-Verbose`.
    Utilisez le traçage PowerShell pour les diagnostics au niveau du script :

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw introuvable après installation">
    Il s’agit généralement d’un problème de PATH. Voir [Dépannage Node.js](/fr/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Mise à jour](/fr/install/updating)
- [Désinstallation](/fr/install/uninstall)
