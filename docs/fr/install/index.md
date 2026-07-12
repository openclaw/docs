---
read_when:
    - Vous avez besoin d’une méthode d’installation autre que celle du guide de démarrage rapide
    - Vous souhaitez effectuer un déploiement sur une plateforme cloud
    - Vous devez mettre à jour, migrer ou désinstaller
summary: Installer OpenClaw — script d’installation, npm/pnpm/bun, depuis les sources, Docker et plus encore
title: Installer
x-i18n:
    generated_at: "2026-07-12T02:45:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Configuration requise

- **Node 22.19+, 23.11+ ou 24+** - Node 24 est la cible par défaut ; le script d’installation s’en charge automatiquement.
- **macOS, Linux ou Windows** - Sous Windows, vous pouvez commencer avec l’application Windows Hub native, le programme d’installation de la CLI pour PowerShell ou un Gateway sous WSL2. Consultez [Windows](/fr/platforms/windows).
- `pnpm` n’est nécessaire que pour compiler à partir des sources.

## Recommandé : script d’installation

Il s’agit de la méthode d’installation la plus rapide. Le script détecte votre système d’exploitation, installe Node si nécessaire, installe OpenClaw et lance la configuration initiale.

<Note>
Les utilisateurs de Windows peuvent également installer l’application compagnon native [Windows Hub](/fr/platforms/windows#recommended-windows-hub), qui comprend la configuration, l’état dans la zone de notification, la messagerie, le mode Node et le mode MCP local.
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Pour effectuer l’installation sans lancer la configuration initiale :

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Pour connaître tous les indicateurs et toutes les options de CI et d’automatisation, consultez [Fonctionnement interne du programme d’installation](/fr/install/installer).

## Autres méthodes d’installation

### Programme d’installation avec préfixe local (`install-cli.sh`)

Utilisez cette méthode si vous souhaitez conserver OpenClaw et Node sous un préfixe local tel que
`~/.openclaw`, sans dépendre d’une installation de Node à l’échelle du système :

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Par défaut, ce programme prend en charge les installations npm, ainsi que les installations à partir d’un dépôt git extrait, selon le même
processus avec préfixe. Référence complète : [Fonctionnement interne du programme d’installation](/fr/install/installer#install-clish).

OpenClaw est déjà installé ? Basculez entre les installations par paquet et par git avec
`openclaw update --channel dev` et `openclaw update --channel stable`. Consultez
[Mise à jour](/fr/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm ou bun

Si vous gérez déjà Node vous-même :

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Le programme d’installation hébergé désactive les filtres de fraîcheur de npm tels que `min-release-age`
    lors de l’installation du paquet OpenClaw. Si vous effectuez une installation manuelle avec npm, votre propre
    politique npm reste applicable.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm exige une approbation explicite pour les paquets comportant des scripts de compilation. Exécutez `pnpm approve-builds -g` après la première installation.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun est pris en charge pour l’installation globale de la CLI. Pour l’exécution du Gateway, Node reste l’environnement d’exécution recommandé pour le daemon.
    </Note>

  </Tab>
</Tabs>

### À partir des sources

Pour les contributeurs ou toute personne souhaitant exécuter OpenClaw à partir d’une copie locale du dépôt :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Vous pouvez également ignorer la création du lien et utiliser `pnpm openclaw ...` depuis le dépôt. Consultez [Configuration](/fr/start/setup) pour connaître l’ensemble des processus de développement.

### Installation depuis la branche principale du dépôt GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Conteneurs et gestionnaires de paquets

<CardGroup cols={2}>
  <Card title="Docker" href="/fr/install/docker" icon="container">
    Déploiements conteneurisés ou sans interface graphique.
  </Card>
  <Card title="Podman" href="/fr/install/podman" icon="container">
    Alternative à Docker pour des conteneurs sans privilèges root.
  </Card>
  <Card title="Nix" href="/fr/install/nix" icon="snowflake">
    Installation déclarative au moyen d’un flake Nix.
  </Card>
  <Card title="Ansible" href="/fr/install/ansible" icon="server">
    Provisionnement automatisé d’un parc de machines.
  </Card>
  <Card title="Bun" href="/fr/install/bun" icon="zap">
    Utilisation limitée à la CLI avec l’environnement d’exécution Bun.
  </Card>
</CardGroup>

## Vérifier l’installation

```bash
openclaw --version      # vérifier que la CLI est disponible
openclaw doctor         # rechercher les problèmes de configuration
openclaw gateway status # vérifier que le Gateway est en cours d’exécution
```

Si vous souhaitez un démarrage géré après l’installation :

- macOS : LaunchAgent au moyen de `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2 : service utilisateur systemd au moyen des mêmes commandes
- Windows natif : tâche planifiée en priorité, avec comme solution de repli un élément de connexion propre à l’utilisateur dans le dossier de démarrage si la création de la tâche est refusée

## Hébergement et déploiement

Déployez OpenClaw sur un serveur cloud ou un VPS. Consultez [Serveur Linux](/fr/vps) pour accéder au sélecteur complet
de fournisseurs (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi, etc.), ou effectuez un déploiement déclaratif sur
[Render](/fr/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/fr/vps">
    Choisissez un fournisseur.
  </Card>
  <Card title="Machine virtuelle Docker" href="/fr/install/docker-vm-runtime">
    Étapes communes pour Docker.
  </Card>
  <Card title="Kubernetes" href="/fr/install/kubernetes">
    Déploiement K8s.
  </Card>
</CardGroup>

## Mettre à jour, migrer ou désinstaller

<CardGroup cols={3}>
  <Card title="Mise à jour" href="/fr/install/updating" icon="refresh-cw">
    Maintenez OpenClaw à jour.
  </Card>
  <Card title="Migration" href="/fr/install/migrating" icon="arrow-right">
    Transférez OpenClaw vers une nouvelle machine.
  </Card>
  <Card title="Désinstallation" href="/fr/install/uninstall" icon="trash-2">
    Supprimez complètement OpenClaw.
  </Card>
</CardGroup>

## Dépannage : commande `openclaw` introuvable

Il s’agit presque toujours d’un problème de PATH : le répertoire global des exécutables npm ne figure pas dans le `PATH` de votre shell. Consultez [Dépannage de Node.js](/fr/install/node#troubleshooting) pour connaître la procédure complète, y compris le chemin sous Windows.

```bash
node -v           # Node est-il installé ?
npm prefix -g     # Où se trouvent les paquets globaux ?
echo "$PATH"      # Le répertoire global des exécutables figure-t-il dans PATH ?
```
