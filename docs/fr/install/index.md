---
read_when:
    - Vous avez besoin d’une méthode d’installation autre que le guide de démarrage rapide « Getting Started »
    - Vous souhaitez déployer sur une plateforme cloud
    - Vous devez mettre à jour, migrer ou désinstaller
summary: Installer OpenClaw - script d’installation, npm/pnpm/bun, depuis la source, Docker, et plus encore
title: Installer
x-i18n:
    generated_at: "2026-06-27T17:38:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Prérequis système

- **Node 24** (recommandé) ou Node 22.19+ - le script d’installation gère cela automatiquement
- **macOS, Linux ou Windows** - les utilisateurs Windows peuvent commencer avec l’application native Windows Hub, le programme d’installation CLI PowerShell ou un Gateway WSL2. Consultez [Windows](/fr/platforms/windows).
- `pnpm` n’est nécessaire que si vous compilez depuis les sources

## Recommandé : script d’installation

La méthode d’installation la plus rapide. Il détecte votre système d’exploitation, installe Node si nécessaire, installe OpenClaw et lance la configuration initiale.

<Note>
Les utilisateurs du bureau Windows peuvent aussi installer l’application compagnon native [Windows Hub](/fr/platforms/windows#recommended-windows-hub), qui inclut la configuration, l’état dans la zone de notification, le chat, le mode nœud et le mode MCP local.
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

Pour installer sans exécuter la configuration initiale :

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

Pour tous les indicateurs et les options CI/automatisation, consultez [Fonctionnement interne de l’installateur](/fr/install/installer).

## Méthodes d’installation alternatives

### Installateur avec préfixe local (`install-cli.sh`)

Utilisez ceci lorsque vous voulez conserver OpenClaw et Node sous un préfixe local tel que
`~/.openclaw`, sans dépendre d’une installation Node à l’échelle du système :

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Il prend en charge les installations npm par défaut, ainsi que les installations depuis un checkout git dans le même
flux avec préfixe. Référence complète : [Fonctionnement interne de l’installateur](/fr/install/installer#install-clish).

Déjà installé ? Basculez entre les installations par paquet et par git avec
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
    L’installateur hébergé désactive les filtres de fraîcheur npm tels que `min-release-age`
    pour l’installation du paquet OpenClaw. Si vous installez manuellement avec npm, votre propre
    politique npm s’applique toujours.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm exige une approbation explicite pour les paquets comportant des scripts de build. Exécutez `pnpm approve-builds -g` après la première installation.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun est pris en charge pour le chemin d’installation global de la CLI. Pour l’environnement d’exécution du Gateway, Node reste l’environnement d’exécution de démon recommandé.
    </Note>

  </Tab>
</Tabs>

### Depuis les sources

Pour les contributeurs ou toute personne souhaitant exécuter depuis un checkout local :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Vous pouvez aussi ignorer le lien et utiliser `pnpm openclaw ...` depuis l’intérieur du dépôt. Consultez [Configuration](/fr/start/setup) pour les workflows de développement complets.

### Installer depuis le checkout main de GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Conteneurs et gestionnaires de paquets

<CardGroup cols={2}>
  <Card title="Docker" href="/fr/install/docker" icon="container">
    Déploiements conteneurisés ou sans interface graphique.
  </Card>
  <Card title="Podman" href="/fr/install/podman" icon="container">
    Alternative à Docker pour conteneurs sans root.
  </Card>
  <Card title="Nix" href="/fr/install/nix" icon="snowflake">
    Installation déclarative via une flake Nix.
  </Card>
  <Card title="Ansible" href="/fr/install/ansible" icon="server">
    Provisionnement automatisé de parc.
  </Card>
  <Card title="Bun" href="/fr/install/bun" icon="zap">
    Utilisation uniquement CLI via l’environnement d’exécution Bun.
  </Card>
</CardGroup>

## Vérifier l’installation

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Si vous voulez un démarrage géré après l’installation :

- macOS : LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2 : service utilisateur systemd via les mêmes commandes
- Windows natif : tâche planifiée en premier, avec un élément de connexion dans le dossier de démarrage par utilisateur en solution de repli si la création de la tâche est refusée

## Hébergement et déploiement

Déployez OpenClaw sur un serveur cloud ou un VPS :

<CardGroup cols={3}>
  <Card title="VPS" href="/fr/vps">
    N’importe quel VPS Linux.
  </Card>
  <Card title="Docker VM" href="/fr/install/docker-vm-runtime">
    Étapes Docker partagées.
  </Card>
  <Card title="Kubernetes" href="/fr/install/kubernetes">
    Déploiement K8s.
  </Card>
  <Card title="Fly.io" href="/fr/install/fly">
    Déployer sur Fly.io.
  </Card>
  <Card title="Hetzner" href="/fr/install/hetzner">
    Déploiement Hetzner.
  </Card>
  <Card title="GCP" href="/fr/install/gcp">
    Déploiement Google Cloud.
  </Card>
  <Card title="Azure" href="/fr/install/azure">
    Déploiement Azure.
  </Card>
  <Card title="Railway" href="/fr/install/railway">
    Déploiement Railway.
  </Card>
  <Card title="Render" href="/fr/install/render">
    Déploiement Render.
  </Card>
  <Card title="Northflank" href="/fr/install/northflank">
    Déploiement Northflank.
  </Card>
</CardGroup>

## Mettre à jour, migrer ou désinstaller

<CardGroup cols={3}>
  <Card title="Updating" href="/fr/install/updating" icon="refresh-cw">
    Garder OpenClaw à jour.
  </Card>
  <Card title="Migrating" href="/fr/install/migrating" icon="arrow-right">
    Migrer vers une nouvelle machine.
  </Card>
  <Card title="Uninstall" href="/fr/install/uninstall" icon="trash-2">
    Supprimer complètement OpenClaw.
  </Card>
</CardGroup>

## Dépannage : `openclaw` introuvable

Si l’installation a réussi mais que `openclaw` est introuvable dans votre terminal :

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Si `$(npm prefix -g)/bin` n’est pas dans votre `$PATH`, ajoutez-le au fichier de démarrage de votre shell (`~/.zshrc` ou `~/.bashrc`) :

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ouvrez ensuite un nouveau terminal. Consultez [Configuration de Node](/fr/install/node) pour plus de détails.
