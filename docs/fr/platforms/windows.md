---
read_when:
    - Installation d’OpenClaw sur Windows
    - Choisir entre Windows natif et WSL2
    - Recherche de l’état de l’application compagnon pour Windows
summary: 'Prise en charge de Windows : parcours d’installation natif et WSL2, démon et limitations actuelles'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:17:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw prend en charge à la fois **Windows natif** et **WSL2**. WSL2 est le chemin le plus
stable et recommandé pour l’expérience complète : la CLI, le Gateway et
l’outillage s’exécutent dans Linux avec une compatibilité totale. Windows natif fonctionne pour
l’utilisation de base de la CLI et du Gateway, avec certaines réserves indiquées ci-dessous.

Les applications compagnon Windows natives sont prévues.

## WSL2 (recommandé)

- [Premiers pas](/fr/start/getting-started) (à utiliser dans WSL)
- [Installation et mises à jour](/fr/install/updating)
- Guide officiel de WSL2 (Microsoft) : [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## État de Windows natif

Les flux CLI Windows natifs s’améliorent, mais WSL2 reste le chemin recommandé.

Ce qui fonctionne bien sur Windows natif aujourd’hui :

- programme d’installation du site web via `install.ps1`
- utilisation locale de la CLI, comme `openclaw --version`, `openclaw doctor` et `openclaw plugins list --json`
- test de validation rapide de l’agent/fournisseur local intégré, comme :

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Réserves actuelles :

- `openclaw onboard --non-interactive` attend toujours un Gateway local accessible, sauf si vous passez `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` et `openclaw gateway install` essaient d’abord les tâches planifiées Windows
- si la création de tâche planifiée est refusée, OpenClaw se rabat sur un élément de connexion par utilisateur dans le dossier de démarrage et démarre immédiatement le Gateway
- si `schtasks` lui-même se bloque ou cesse de répondre, OpenClaw abandonne désormais rapidement ce chemin et se rabat au lieu de rester suspendu indéfiniment
- les tâches planifiées restent privilégiées lorsqu’elles sont disponibles, car elles fournissent un meilleur état de supervision

Si vous voulez uniquement la CLI native, sans installation du service Gateway, utilisez l’une de ces commandes :

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Si vous voulez bien un démarrage géré sur Windows natif :

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si la création de tâche planifiée est bloquée, le mode de service de secours démarre tout de même automatiquement après la connexion via le dossier de démarrage de l’utilisateur actuel.

## Gateway

- [Runbook Gateway](/fr/gateway)
- [Configuration](/fr/gateway/configuration)

## Installation du service Gateway (CLI)

Dans WSL2 :

```
openclaw onboard --install-daemon
```

Ou :

```
openclaw gateway install
```

Ou :

```
openclaw configure
```

Sélectionnez **Service Gateway** lorsque l’invite s’affiche.

Réparer/migrer :

```
openclaw doctor
```

## Démarrage automatique du Gateway avant la connexion Windows

Pour les configurations sans interface, assurez-vous que toute la chaîne de démarrage s’exécute même lorsque personne ne se connecte à
Windows.

### 1) Maintenir les services utilisateur en cours d’exécution sans connexion

Dans WSL :

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Installer le service utilisateur du Gateway OpenClaw

Dans WSL :

```bash
openclaw gateway install
```

### 3) Démarrer WSL automatiquement au démarrage de Windows

Dans PowerShell en tant qu’administrateur :

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Remplacez `Ubuntu` par le nom de votre distribution obtenu avec :

```powershell
wsl --list --verbose
```

### Vérifier la chaîne de démarrage

Après un redémarrage (avant la connexion Windows), vérifiez depuis WSL :

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avancé : exposer les services WSL sur le LAN (portproxy)

WSL possède son propre réseau virtuel. Si une autre machine doit atteindre un service
s’exécutant **dans WSL** (SSH, un serveur TTS local ou le Gateway), vous devez
transférer un port Windows vers l’IP WSL actuelle. L’IP WSL change après les redémarrages,
vous devrez donc peut-être actualiser la règle de transfert.

Exemple (PowerShell **en tant qu’administrateur**) :

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Autorisez le port dans le pare-feu Windows (une seule fois) :

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Actualisez le portproxy après les redémarrages de WSL :

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Notes :

- SSH depuis une autre machine cible l’**IP de l’hôte Windows** (exemple : `ssh user@windows-host -p 2222`).
- Les nœuds distants doivent pointer vers une URL de Gateway **accessible** (pas `127.0.0.1`) ; utilisez
  `openclaw status --all` pour confirmer.
- Utilisez `listenaddress=0.0.0.0` pour l’accès LAN ; `127.0.0.1` le garde uniquement local.
- Si vous voulez que cela soit automatique, enregistrez une tâche planifiée pour exécuter l’étape
  d’actualisation à la connexion.

## Installation WSL2 étape par étape

### 1) Installer WSL2 + Ubuntu

Ouvrez PowerShell (administrateur) :

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Redémarrez si Windows le demande.

### 2) Activer systemd (requis pour l’installation du Gateway)

Dans votre terminal WSL :

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Puis depuis PowerShell :

```powershell
wsl --shutdown
```

Rouvrez Ubuntu, puis vérifiez :

```bash
systemctl --user status
```

### 3) Installer OpenClaw (dans WSL)

Pour une configuration initiale normale dans WSL, suivez le flux Linux Premiers pas :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Si vous développez depuis les sources au lieu d’effectuer une configuration initiale, utilisez la
boucle de développement source de [Configuration](/fr/start/setup) :

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Guide complet : [Premiers pas](/fr/start/getting-started)

## Application compagnon Windows

Nous n’avons pas encore d’application compagnon Windows. Les contributions sont les bienvenues si vous voulez
aider à la concrétiser.

## Connectivité Git et GitHub (contributeurs)

Certains réseaux bloquent ou limitent HTTPS vers GitHub. Si `git clone` échoue avec des délais d’attente
ou des réinitialisations de connexion, essayez un autre réseau, un VPN ou un proxy HTTP/HTTPS fourni par votre
organisation.

Si `gh auth login` échoue pendant le flux d’appareil du navigateur (par exemple avec un délai d’attente
pour atteindre `github.com:443`), authentifiez-vous plutôt avec un jeton d’accès personnel :

1. Créez un jeton avec au moins la portée `repo` (PAT classique) ou un accès
   finement granulaire équivalent.
2. Dans PowerShell pour la session actuelle :

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. Si `gh auth status` avertit que `read:org` est manquant, créez un jeton qui inclut
   cette portée et réaffectez la variable :

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` s’applique uniquement lorsque vous vous êtes authentifié via `gh auth login`
et que vous avez des identifiants stockés à actualiser (pas lorsque vous utilisez `GH_TOKEN`).

Ne commettez jamais de jetons et ne les collez jamais dans des issues ou des pull requests.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Plateformes](/fr/platforms)
