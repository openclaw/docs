---
read_when:
    - Installation d’OpenClaw sous Windows
    - Choisir entre Windows Hub, Windows natif et WSL2
    - Configuration de l’application compagnon Windows ou du mode Node Windows
summary: 'Prise en charge de Windows : Hub Windows, CLI et Gateway natifs, configuration du Gateway sous WSL2, mode Node et dépannage'
title: Windows
x-i18n:
    generated_at: "2026-07-12T15:38:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw fournit une application compagnon native **Windows Hub** ainsi qu’une prise en charge de la CLI sous Windows.
Utilisez Windows Hub pour disposer d’une application de bureau avec configuration, état dans la zone de notification, chat, diagnostics du centre de commandes et fonctionnalités de Node Windows. Utilisez le programme d’installation PowerShell pour installer directement la CLI et le Gateway. Utilisez WSL2 pour bénéficier de l’environnement d’exécution Gateway le plus compatible avec Linux.

## Recommandé : Windows Hub

Windows Hub est l’application compagnon WinUI native pour Windows 10 20H2+ et Windows 11. Elle s’installe sans privilèges d’administrateur et propose des programmes d’installation x64 et ARM64 signés sur sa propre page de versions.

Windows Hub est publié indépendamment de la CLI et du Gateway OpenClaw. Téléchargez le dernier programme d’installation stable du Hub depuis la [page des versions de Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest) ou directement via `releases/latest/download` :

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Si l’un des liens ci-dessus renvoie une erreur 404, consultez la [page des versions de Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases) et ouvrez la version stable la plus récente de Windows Hub. Les versions stables habituelles d’OpenClaw proposent également un miroir d’une version de Windows Hub épinglée et validée pour la publication ; ce miroir peut être en retard par rapport à une version autonome plus récente du Hub.

Après l’installation, lancez **OpenClaw Companion** depuis le menu Start ou la zone de notification. Le programme d’installation ajoute également des raccourcis pour Gateway Setup, Chat, Settings, Check for Updates et la désinstallation.

### Contenu de Windows Hub

- État dans la zone de notification et lancement à la connexion.
- Configuration initiale d’un Gateway WSL local géré par l’application.
- Paramètres de connexion pour les Gateways locaux, distants et accessibles par tunnel SSH.
- Fenêtre de chat native et accès à l’interface de contrôle dans le navigateur.
- Diagnostics du centre de commandes pour les sessions, l’utilisation, les canaux, les Nodes, l’association et les commandes de réparation.
- Mode Node Windows pour le canevas, l’écran, la caméra, les notifications, l’état de l’appareil, la conversation et l’exécution contrôlée de `system.run` par l’agent.
- Mode serveur MCP local pour les clients MCP tels que Claude Desktop, Claude Code et Cursor.

### Premier lancement

Au premier lancement, Windows Hub ouvre la configuration lorsqu’aucun Gateway enregistré et utilisable n’est disponible. Le chemin le plus rapide consiste à utiliser **Set up locally**, qui provisionne une distribution WSL `OpenClawGateway` gérée par l’application, y installe le Gateway et associe l’application. Cette opération n’exporte ni ne modifie votre distribution Ubuntu existante.

Choisissez **Advanced setup** ou ouvrez l’onglet Connections si vous disposez déjà d’un Gateway. Vous pouvez vous connecter à :

- un Gateway local sur ce PC
- un Gateway WSL sur ce PC
- un Gateway distant à l’aide d’une URL et d’un jeton ou d’un code de configuration
- un Gateway accessible par un tunnel SSH

Une fois la configuration terminée, l’icône de la zone de notification devient verte. Ouvrez **Command Center** depuis la zone de notification pour vérifier la connexion, l’association, l’état du Node et le bon fonctionnement des canaux.

## Mode Node Windows

Windows Hub peut s’enregistrer comme Node OpenClaw afin que l’agent puisse utiliser, via le Gateway, les fonctionnalités Windows natives déclarées. Les commandes du Node doivent être déclarées par celui-ci et autorisées par la politique du Gateway avant de pouvoir être exécutées ; consultez [Nodes](/fr/nodes#command-policy) pour connaître le modèle complet d’autorisation et de refus.

Commandes courantes :

| Famille | Commandes                                                                            |
| ------ | ------------------------------------------------------------------------------------ |
| Canevas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Écran | `screen.snapshot` ; `screen.record` nécessite une activation explicite                |
| Caméra | `camera.list` ; `camera.snap`, `camera.clip` nécessitent une activation explicite     |
| Système | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Appareil | `location.get`, `device.info`, `device.status`                                      |
| Conversation | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak` |

Le mode Node nécessite une association avec le Gateway. Si l’application affiche une demande d’association, approuvez-la depuis l’hôte du Gateway :

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Le Gateway ne transmet que les commandes déclarées par le Node et autorisées par la politique du serveur. Les commandes sensibles pour la confidentialité, telles que `screen.record`, `camera.snap` et `camera.clip`, nécessitent une activation explicite dans `gateway.nodes.allowCommands`.

## Mode MCP local

Windows Hub peut exposer le même registre de fonctionnalités Windows natives sous forme de serveur MCP local sur l’interface de bouclage, afin que les clients MCP locaux puissent piloter les fonctionnalités Windows sans Gateway OpenClaw en cours d’exécution.

Activez-le dans les Settings de Windows Hub, dans la section destinée aux développeurs et aux options avancées. L’application affiche le point de terminaison de bouclage et le jeton porteur une fois le serveur activé.

Matrice des modes :

| Mode Node | Serveur MCP | Comportement                       |
| --------- | ---------- | ---------------------------------- |
| désactivé | désactivé  | Application de bureau réservée à l’opérateur |
| activé    | désactivé  | Node Windows connecté au Gateway   |
| désactivé | activé     | Serveur MCP local uniquement       |
| activé    | activé     | Node Gateway et serveur MCP local  |

## CLI et Gateway Windows natifs

Pour une utilisation axée sur le terminal, installez OpenClaw depuis PowerShell :

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Vérifiez l’installation :

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Le démarrage géré utilise les tâches planifiées Windows lorsqu’elles sont disponibles. La tâche conserve le script lisible `gateway.cmd` dans le répertoire d’état d’OpenClaw, mais le lance par l’intermédiaire d’un wrapper WScript `gateway.vbs` généré, afin que le Gateway en arrière-plan n’ouvre pas de fenêtre de console visible. Si la création de la tâche est refusée, OpenClaw utilise à la place un élément de connexion propre à l’utilisateur dans le dossier Startup.

Installez le service Gateway :

```powershell
openclaw gateway install
openclaw gateway status --json
```

Pour utiliser uniquement la CLI sans service Gateway géré :

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 reste l’environnement d’exécution Gateway le plus compatible avec Linux sous Windows. Windows Hub peut configurer pour vous un Gateway WSL géré par l’application, ou vous pouvez l’installer manuellement dans votre propre distribution.

Configuration manuelle :

```powershell
wsl --install
# Ou choisissez explicitement une distribution :
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

Installez ensuite OpenClaw dans WSL à l’aide du guide de démarrage rapide Linux :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Démarrage automatique du Gateway avant la connexion à Windows

Pour les configurations WSL sans interface graphique, assurez-vous que toute la chaîne de démarrage s’exécute même si personne ne se connecte à Windows.

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

Remplacez `Ubuntu` par le nom de votre distribution obtenu avec :

```powershell
wsl --list --verbose
```

<Note>
Deux modifications par rapport aux anciennes procédures :

- **`dbus-launch true` au lieu de `/bin/true`** : sous WSL >= 2.6.1.0, une régression ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) arrête la distribution pour cause d’inactivité 15-20 secondes après la fermeture du dernier client, même lorsque la persistance est activée. `dbus-launch true` maintient en vie un processus enfant d’init comme solution de contournement (discussion de la communauté, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` au lieu de `/ru SYSTEM`** : les distributions WSL propres à l’utilisateur, qui constituent la configuration par défaut, ne sont pas visibles par le compte SYSTEM. La tâche semble donc s’exécuter, mais la distribution ne démarre jamais. L’exécution sous votre propre compte évite ce problème ; Windows vous demande votre mot de passe lors de la création de la tâche.

</Note>

Après le redémarrage, vérifiez depuis WSL :

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Exposer les services WSL sur le réseau local

WSL possède son propre réseau virtuel. Si une autre machine doit accéder à un service dans WSL, redirigez un port Windows vers l’adresse IP WSL actuelle. L’adresse IP WSL peut changer après les redémarrages ; actualisez donc la règle de redirection si nécessaire.

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

- Une connexion SSH depuis une autre machine cible l’adresse IP de l’hôte Windows, par exemple `ssh user@windows-host -p 2222`.
- Les Nodes distants doivent pointer vers une URL de Gateway accessible, et non vers `127.0.0.1`.
- Utilisez `listenaddress=0.0.0.0` pour l’accès au réseau local et `127.0.0.1` pour un accès local uniquement.

## Résolution des problèmes

### L’icône de la zone de notification n’apparaît pas

Recherchez `OpenClaw.Tray.WinUI.exe` dans Task Manager. S’il est en cours d’exécution, ouvrez la zone des icônes masquées de la zone de notification et épinglez-le. Sinon, lancez **OpenClaw Companion** depuis le menu Start.

### La configuration locale échoue

Ouvrez le journal de configuration depuis Windows Hub ou examinez :

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Causes courantes : WSL désactivé, virtualisation bloquée, état WSL obsolète géré par l’application ou panne réseau pendant l’installation du paquet Gateway.

### L’application indique qu’une association est requise

Approuvez la demande de l’opérateur ou du Node depuis le Gateway :

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Si l’appareil disposait déjà d’un jeton, reconnectez-vous depuis l’onglet Connections après l’approbation.

### Le chat Web ne peut pas accéder à un Gateway distant

Le chat Web distant nécessite HTTPS ou localhost. Pour les certificats autosignés, approuvez le certificat dans Windows ou utilisez un tunnel SSH vers une URL localhost.

### Les commandes `screen.snapshot`, de caméra ou audio échouent

Vérifiez les autorisations Windows relatives à la caméra, au microphone, à la capture d’écran et aux notifications. Les installations empaquetées déclarent les fonctionnalités protégées, mais Windows peut tout de même afficher une demande d’autorisation lors de la première utilisation par une commande.

### La connectivité Git ou GitHub échoue

Certains réseaux bloquent ou limitent le trafic HTTPS vers GitHub. Si `git clone` ou `gh auth login` échoue, essayez un autre réseau, un VPN ou un proxy HTTP/HTTPS.

Pour une authentification `gh` par jeton dans la session actuelle :

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Ne validez jamais de jetons dans le dépôt et ne les collez jamais dans des issues ou des pull requests.

## Pages associées

- [Présentation de l’installation](/fr/install)
- [Configuration de Node.js](/fr/install/node)
- [Nodes](/fr/nodes)
- [Interface de contrôle](/fr/web/control-ui)
- [Configuration du Gateway](/fr/gateway/configuration)
