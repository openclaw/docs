---
read_when:
    - Vous avez besoin d’une méthode d’installation autre que le démarrage rapide de la prise en main
    - Vous souhaitez déployer sur une plateforme cloud
    - Vous devez effectuer une mise à jour, une migration ou une désinstallation
summary: Installer OpenClaw — script d’installation, npm/pnpm/bun, depuis les sources, Docker et plus encore
title: Installer
x-i18n:
    generated_at: "2026-07-16T13:27:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Configuration requise

- **Node 22.22.3+, 24.15+ ou 25.9+** - Node 24 est la cible par défaut ; le script d’installation s’en charge automatiquement.
- **macOS, Linux ou Windows** - Sous Windows, vous pouvez commencer avec l’application Windows Hub native, le programme d’installation de la CLI PowerShell ou un Gateway WSL2. Consultez [Windows](/fr/platforms/windows).
- `pnpm` n’est nécessaire que pour compiler depuis les sources.

## Recommandé : script d’installation

La méthode d’installation la plus rapide. Il détecte votre système d’exploitation, installe Node si nécessaire, installe OpenClaw et lance la configuration initiale.

<Note>
Sous Windows, vous pouvez également installer l’application compagnon native [Windows Hub](/fr/platforms/windows#recommended-windows-hub), qui comprend la configuration, l’état dans la zone de notification, le chat, le mode Node et le mode MCP local.
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

Pour connaître tous les indicateurs et les options de CI et d’automatisation, consultez [Fonctionnement interne du programme d’installation](/fr/install/installer).

## Autres méthodes d’installation

### Programme d’installation avec préfixe local (`install-cli.sh`)

Utilisez cette méthode pour conserver OpenClaw et Node sous un préfixe local tel que
`~/.openclaw`, sans dépendre d’une installation système de Node :

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Elle prend en charge les installations npm par défaut, ainsi que les installations depuis une copie de travail git avec le même
flux de préfixe. Référence complète : [Fonctionnement interne du programme d’installation](/fr/install/installer#install-clish).

Déjà installé ? Basculez entre les installations depuis un paquet et depuis git avec
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
    Le programme d’installation hébergé efface les filtres d’actualisation npm tels que `min-release-age`
    pour l’installation du paquet OpenClaw. Si vous effectuez l’installation manuellement avec npm, votre propre
    politique npm continue de s’appliquer.
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
    Bun peut installer le paquet global, mais l’exécutable `openclaw` obtenu nécessite un environnement d’exécution Node pris en charge, car l’état d’OpenClaw utilise `node:sqlite`.
    </Note>

  </Tab>
</Tabs>

### Depuis les sources

Pour les contributeurs ou toute personne souhaitant exécuter OpenClaw depuis une copie de travail locale :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Vous pouvez également ignorer la liaison et utiliser `pnpm openclaw ...` depuis le dépôt. Consultez [Configuration](/fr/start/setup) pour connaître l’ensemble des flux de développement.

### Installation depuis la branche principale de GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Conteneurs et gestionnaires de paquets

<CardGroup cols={2}>
  <Card title="Docker" href="/fr/install/docker" icon="container">
    Déploiements conteneurisés ou sans interface graphique.
  </Card>
  <Card title="Podman" href="/fr/install/podman" icon="container">
    Alternative sans privilèges root à Docker.
  </Card>
  <Card title="Nix" href="/fr/install/nix" icon="snowflake">
    Installation déclarative au moyen d’un flake Nix.
  </Card>
  <Card title="Ansible" href="/fr/install/ansible" icon="server">
    Provisionnement automatisé d’un parc de machines.
  </Card>
  <Card title="Bun" href="/fr/install/bun" icon="zap">
    Programme facultatif d’installation des dépendances et d’exécution des scripts de paquet.
  </Card>
</CardGroup>

## Vérifier l’installation

```bash
openclaw --version      # vérifier que la CLI est disponible
openclaw doctor         # rechercher les problèmes de configuration
openclaw gateway status # vérifier que le Gateway est en cours d’exécution
```

Pour bénéficier d’un démarrage géré après l’installation :

- macOS : LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2 : service utilisateur systemd via les mêmes commandes
- Windows natif : d’abord une tâche planifiée, avec comme solution de repli un élément de connexion par utilisateur dans le dossier Startup si la création de la tâche est refusée

## Hébergement et déploiement

Déployez OpenClaw sur un serveur cloud ou un VPS. Consultez [Serveur Linux](/fr/vps) pour accéder au
sélecteur complet de fournisseurs (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi et plus encore), ou effectuez un déploiement déclaratif sur
[Render](/fr/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/fr/vps">
    Choisissez un fournisseur.
  </Card>
  <Card title="VM Docker" href="/fr/install/docker-vm-runtime">
    Étapes Docker partagées.
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
    Migrez vers une nouvelle machine.
  </Card>
  <Card title="Désinstallation" href="/fr/install/uninstall" icon="trash-2">
    Supprimez complètement OpenClaw.
  </Card>
</CardGroup>

## Dépannage : `openclaw` introuvable

Il s’agit presque toujours d’un problème de PATH : le répertoire global des exécutables npm ne figure pas dans la variable `PATH` de votre shell. Consultez [Dépannage de Node.js](/fr/install/node#troubleshooting) pour connaître la solution complète, notamment le chemin sous Windows.

```bash
node -v           # Node est-il installé ?
npm prefix -g     # Où se trouvent les paquets globaux ?
echo "$PATH"      # Le répertoire global des exécutables figure-t-il dans PATH ?
```
