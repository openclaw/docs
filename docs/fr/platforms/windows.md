---
read_when:
    - Installation d’OpenClaw sur Windows
    - Choisir entre Windows Hub, Windows natif et WSL2
    - Configuration de l’application compagnon Windows ou du mode nœud Windows
summary: 'Prise en charge de Windows : Hub Windows, CLI et Gateway natifs, configuration du Gateway WSL2, mode nœud et dépannage'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:44:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw fournit une application compagnon native **Windows Hub** ainsi que la prise en charge de la CLI Windows.
Utilisez Windows Hub lorsque vous voulez une application de bureau avec configuration, état dans la zone de notification, chat,
diagnostics du Centre de commande et capacités de Node Windows. Utilisez le programme d’installation PowerShell
lorsque vous voulez accéder directement à la CLI/au Gateway. Utilisez WSL2 lorsque vous voulez l’environnement d’exécution
Gateway le plus compatible avec Linux.

## Recommandé : Windows Hub

Windows Hub est l’application compagnon WinUI native pour Windows 10 20H2+ et Windows 11. Elle s’installe sans privilèges administrateur et est publiée avec des programmes d’installation
x64 et ARM64 signés dans les versions OpenClaw.

Téléchargez le dernier programme d’installation stable depuis la [page des versions OpenClaw](https://github.com/openclaw/openclaw/releases) :

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Sommes de contrôle](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Si un lien de téléchargement ci-dessus renvoie une 404, consultez la [page des versions](https://github.com/openclaw/openclaw/releases) et recherchez les ressources `OpenClawCompanion-Setup-*` dans la dernière version.

Après l’installation, lancez **OpenClaw Companion** depuis le menu Démarrer ou la zone de notification
système. Le programme d’installation ajoute également des raccourcis pour la configuration du Gateway, le chat, les paramètres,
la recherche de mises à jour et la désinstallation.

### Ce que Windows Hub inclut

- état dans la zone de notification système et lancement à la connexion
- configuration de premier démarrage pour un Gateway WSL local appartenant à l’application
- paramètres de connexion pour les Gateways locaux, distants et tunnelisés par SSH
- fenêtre de chat native, plus accès à l’interface utilisateur de contrôle dans le navigateur
- diagnostics du Centre de commande pour les sessions, l’utilisation, les canaux, les nodes, l’association et
  les commandes de réparation
- mode Node Windows pour canvas contrôlé par l’agent, écran, caméra, notifications,
  état de l’appareil, synthèse vocale, transcription vocale et `system.run` contrôlé
- mode serveur MCP local pour les clients MCP tels que Claude Desktop, Claude Code et
  Cursor

### Premier lancement

Au premier lancement, Windows Hub ouvre la configuration lorsqu’aucun Gateway enregistré utilisable n’existe.
Le chemin le plus rapide est **Configurer localement**, qui provisionne une distribution WSL
`OpenClawGateway` appartenant à l’application, y installe le Gateway et associe l’application.
Cela n’exporte ni ne modifie votre distribution Ubuntu existante.

Choisissez **Configuration avancée** ou ouvrez l’onglet Connexions si vous disposez déjà d’un
Gateway. Vous pouvez vous connecter à :

- un Gateway local sur ce PC
- un Gateway WSL sur ce PC
- un Gateway distant par URL et jeton ou code de configuration
- un Gateway accessible via un tunnel SSH

Une fois la configuration terminée, l’icône de la zone de notification devient verte. Ouvrez le **Centre de commande** depuis la
zone de notification pour confirmer la connexion, l’association, l’état du Node et la santé des canaux.

## Mode Node Windows

Windows Hub peut s’enregistrer comme Node OpenClaw de premier ordre. L’agent peut alors utiliser
les capacités natives Windows déclarées via le Gateway.

Les commandes courantes incluent :

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` et, avec adhésion explicite, `screen.record`
- `camera.list` et, avec adhésion explicite, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Le mode Node nécessite l’association avec le Gateway. Si l’application affiche une demande d’association, approuvez-la
depuis l’hôte du Gateway :

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Le Gateway ne transmet que les commandes que le Node déclare et que la stratégie du serveur
autorise. Les commandes sensibles pour la confidentialité, telles que `screen.record`, `camera.snap` et
`camera.clip`, nécessitent une adhésion explicite à `gateway.nodes.allowCommands`.

## Mode MCP local

Windows Hub peut exposer le même registre de capacités natives Windows comme serveur
MCP local sur loopback. C’est utile lorsque vous voulez que des clients MCP locaux pilotent
les capacités Windows sans Gateway OpenClaw en cours d’exécution.

Activez-le dans les paramètres de Windows Hub, dans la section développeur/avancée. L’application
affiche le point de terminaison loopback et le jeton porteur une fois le serveur activé.

Matrice des modes :

| Mode Node | Serveur MCP | Comportement                         |
| --------- | ----------- | ------------------------------------ |
| désactivé | désactivé   | Application de bureau opérateur uniquement |
| activé    | désactivé   | Node Windows connecté au Gateway     |
| désactivé | activé      | Serveur MCP local uniquement         |
| activé    | activé      | Node Gateway plus serveur MCP local  |

## CLI et Gateway Windows natifs

Pour une utilisation centrée sur le terminal, installez OpenClaw depuis PowerShell :

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Vérifiez :

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Les flux CLI et Gateway Windows natifs sont pris en charge et continuent de s’améliorer.
Le démarrage géré utilise les tâches planifiées Windows lorsqu’elles sont disponibles. La tâche conserve le
script lisible `gateway.cmd` dans le répertoire d’état OpenClaw, mais le lance via
un wrapper WScript `gateway.vbs` généré afin que le Gateway en arrière-plan n’ouvre pas
de fenêtre de console visible. Si la création de la tâche est refusée, OpenClaw se rabat sur un
élément de connexion dans le dossier de démarrage par utilisateur.

Pour installer le service Gateway :

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si vous voulez seulement utiliser la CLI sans service Gateway géré :

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 reste l’environnement d’exécution Gateway le plus compatible avec Linux sous Windows. Windows Hub
peut configurer pour vous un Gateway WSL appartenant à l’application, ou vous pouvez l’installer manuellement dans
votre propre distribution.

Configuration manuelle :

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Activez systemd dans WSL :

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Redémarrez WSL depuis PowerShell :

```powershell
wsl --shutdown
```

Installez ensuite OpenClaw dans WSL avec le démarrage rapide Linux :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Démarrage automatique du Gateway avant la connexion Windows

Pour les configurations WSL sans interface, assurez-vous que toute la chaîne de démarrage s’exécute même lorsque personne ne se connecte
à Windows.

Dans WSL :

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

Dans PowerShell en tant qu’administrateur :

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Remplacez `Ubuntu` par le nom de votre distribution depuis :

```powershell
wsl --list --verbose
```

> **Remarque :** Deux changements par rapport aux anciennes recettes :
>
> - **`dbus-launch true` au lieu de `/bin/true`** — Sur WSL ≥ 2.6.1.0, une régression ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) entraîne l’arrêt par inactivité de la distribution 15 à 20 secondes après la sortie du dernier client, même avec linger activé. `dbus-launch true` conserve un processus enfant d’init en vie comme solution de contournement ([discussion communautaire, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` au lieu de `/ru SYSTEM`** — Les distributions WSL par utilisateur (la configuration par défaut) ne sont pas visibles pour le compte SYSTEM ; la tâche semble s’exécuter, mais la distribution n’est jamais démarrée. L’exécuter avec votre propre compte évite ce problème. Windows demandera votre mot de passe lors de la création de la tâche.

Après le redémarrage, vérifiez depuis WSL :

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Exposer les services WSL sur le LAN

WSL dispose de son propre réseau virtuel. Si une autre machine doit atteindre un service dans
WSL, transférez un port Windows vers l’IP WSL actuelle. L’IP WSL peut changer après
les redémarrages ; actualisez donc la règle de transfert si nécessaire.

Exemple dans PowerShell en tant qu’administrateur :

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Remarques :

- Depuis une autre machine, SSH cible l’IP de l’hôte Windows, par exemple
  `ssh user@windows-host -p 2222`.
- Les nodes distants doivent pointer vers une URL Gateway joignable, pas vers `127.0.0.1`.
- Utilisez `listenaddress=0.0.0.0` pour l’accès LAN. Utilisez `127.0.0.1` pour un accès
  local uniquement.

## Dépannage

### L’icône de la zone de notification n’apparaît pas

Vérifiez dans le Gestionnaire des tâches la présence de `OpenClaw.Tray.WinUI.exe`. S’il est en cours d’exécution, ouvrez la
zone des icônes masquées de la zone de notification et épinglez-le. S’il n’est pas en cours d’exécution, lancez **OpenClaw
Companion** depuis le menu Démarrer.

### La configuration locale échoue

Ouvrez le journal de configuration depuis Windows Hub ou inspectez :

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Les causes courantes sont WSL désactivé, la virtualisation bloquée, un état WSL
appartenant à l’application périmé ou une défaillance réseau pendant l’installation du package Gateway.

### L’application indique que l’association est requise

Approuvez la demande d’opérateur ou de Node depuis le Gateway :

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Si l’appareil avait déjà un jeton, reconnectez-vous depuis l’onglet Connexions après
approbation.

### Le chat web ne peut pas atteindre un Gateway distant

Le chat web distant nécessite HTTPS ou localhost. Pour les certificats autosignés, approuvez
le certificat dans Windows ou utilisez un tunnel SSH vers une URL localhost.

### `screen.snapshot`, la caméra ou les commandes audio échouent

Confirmez les autorisations Windows pour la caméra, le microphone, la capture d’écran et
les notifications. Les installations empaquetées déclarent les capacités protégées, mais Windows
peut tout de même afficher une invite la première fois qu’une commande les utilise.

### La connectivité Git ou GitHub échoue

Certains réseaux bloquent ou limitent HTTPS vers GitHub. Si `git clone` ou `gh auth
login` échoue, essayez un autre réseau, un VPN ou un proxy HTTP/HTTPS.

Pour l’authentification `gh` par jeton dans la session actuelle :

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Ne validez jamais de jetons et ne les collez jamais dans des issues ou des pull requests.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Configuration de Node.js](/fr/install/node)
- [Nodes](/fr/nodes)
- [Interface de contrôle](/fr/web/control-ui)
- [Configuration du Gateway](/fr/gateway/configuration)
