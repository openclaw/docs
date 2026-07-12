---
read_when:
    - Exécuter le Gateway OpenClaw dans WSL2 tandis que Chrome s’exécute sous Windows
    - Constat d’erreurs de navigateur/d’interface de contrôle qui se chevauchent sous WSL2 et Windows
    - Choisir entre Chrome MCP local à l’hôte et CDP distant brut dans les configurations à hôtes séparés
summary: Dépanner par couches le Gateway WSL2 et le CDP distant de Chrome sous Windows
title: Dépannage de WSL2 + Windows + Chrome CDP distant
x-i18n:
    generated_at: "2026-07-12T03:11:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Dans la configuration courante avec hôtes séparés, le Gateway OpenClaw s’exécute dans WSL2, Chrome s’exécute
sous Windows, et le contrôle du navigateur doit franchir la frontière WSL2/Windows. Plusieurs
problèmes indépendants peuvent survenir simultanément (voir
[le problème nº 39369](https://github.com/openclaw/openclaw/issues/39369)) : le transport
CDP, la sécurité de l’origine de la Control UI et le jeton/l’appairage peuvent chacun échouer
indépendamment tout en produisant des erreurs d’apparence similaire. Parcourez les couches
ci-dessous dans l’ordre au lieu de tenter de deviner laquelle est défaillante.

## Choisir d’abord le bon mode de navigateur

### Option 1 : CDP distant brut de WSL2 vers Windows

Utilisez un profil de navigateur distant pointant depuis WSL2 vers un point de terminaison CDP
de Chrome sous Windows. Choisissez cette option lorsque le Gateway reste dans WSL2, que Chrome s’exécute sous
Windows et que le contrôle du navigateur doit franchir la frontière WSL2/Windows.

### Option 2 : MCP Chrome local à l’hôte

Utilisez le pilote `existing-session` (profil `user`) uniquement lorsque le Gateway s’exécute
sur le même hôte que Chrome, que vous souhaitez utiliser l’état local du navigateur connecté, que vous
n’avez pas besoin d’un transport du navigateur entre plusieurs hôtes et que vous n’avez pas besoin de `responsebody`,
de l’exportation PDF, de l’interception des téléchargements ni d’actions par lots (les profils MCP Chrome ne
les prennent pas en charge).

Pour un Gateway sous WSL2 avec Chrome sous Windows, utilisez le CDP distant brut. MCP Chrome est
local à l’hôte et ne constitue pas un pont entre WSL2 et Windows.

## Architecture opérationnelle

- WSL2 exécute le Gateway sur `127.0.0.1:18789`
- Windows ouvre la Control UI dans un navigateur normal à l’adresse `http://127.0.0.1:18789/`
- Chrome sous Windows expose un point de terminaison CDP sur le port `9222`
- WSL2 peut atteindre ce point de terminaison CDP sous Windows
- OpenClaw fait pointer un profil de navigateur vers l’adresse accessible depuis WSL2

## Règle essentielle pour la Control UI

Lorsque l’interface est ouverte depuis Windows, utilisez l’hôte local Windows, sauf si vous disposez d’une
configuration HTTPS intentionnelle :

```text
http://127.0.0.1:18789/
```

N’utilisez pas par défaut une adresse IP du réseau local. Le protocole HTTP non chiffré sur une adresse de réseau local ou de tailnet peut
déclencher un comportement d’origine non sécurisée ou d’authentification de l’appareil sans rapport avec CDP lui-même. Consultez
[Control UI](/fr/web/control-ui).

## Valider couche par couche

Procédez de haut en bas ; ne sautez aucune étape. Corriger une couche peut tout de même laisser
visible une autre erreur provenant d’une couche inférieure.

### Couche 1 : vérifier que Chrome fournit CDP sous Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 et les versions ultérieures ignorent les options de ligne de commande de débogage distant pour le
répertoire de données Chrome par défaut. Utilisez un répertoire de données distinct et non défini par défaut, comme
illustré ci-dessus. Consultez la
[modification de sécurité du débogage distant](https://developer.chrome.com/blog/remote-debugging-port)
de Chrome.
Cela ne rend pas le profil Chrome normal connecté contrôlable à distance.

Depuis Windows, vérifiez d’abord Chrome lui-même :

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Si cette vérification échoue, diagnostiquez les écouteurs Windows ci-dessous. OpenClaw n’est pas encore
en cause.

#### Diagnostiquer IPv4 et IPv6 avant de modifier portproxy

Chromium tente d’abord de lier le débogage distant à `127.0.0.1` et ne se rabat sur
`[::1]` que si la liaison IPv4 échoue. Une règle `v4tov4` persistante qui écoute sur
`127.0.0.1:9222` peut occuper ce point de terminaison avant le démarrage de Chrome. Chrome se
rabat alors sur `[::1]:9222`, tandis que l’ancienne règle redirige le trafic IPv4 vers
son propre écouteur et renvoie une réponse vide.

Vérifiez les écouteurs et les règles de proxy réels depuis Windows au lieu de les déduire
de la version de Chrome :

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Utilisez `tasklist /fi "PID eq <PID>"` pour chaque PID indiqué par `netstat`.

- Si `chrome.exe` répond sur `127.0.0.1`, supprimez toute règle portproxy qui
  écoute également sur `127.0.0.1:9222`. Redirigez uniquement l’adresse de l’adaptateur Windows
  accessible depuis WSL2 vers `127.0.0.1`.
- Si `chrome.exe` répond uniquement sur `[::1]`, faites pointer l’écouteur accessible depuis WSL2 vers
  `::1` avec `v4tov6` au lieu de rediriger vers une adresse IPv4 inutilisée :

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Liez l’écouteur à l’adresse de l’adaptateur dont WSL2 a besoin. N’exposez pas le port
CDP sur `0.0.0.0`, une adresse du réseau local ou une adresse de tailnet : CDP accorde le contrôle de
la session du navigateur.

### Couche 2 : vérifier que WSL2 peut atteindre ce point de terminaison Windows

Depuis WSL2, testez l’adresse exacte que vous prévoyez d’utiliser dans `cdpUrl` :

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Résultat attendu :

- `/json/version` renvoie du JSON avec les métadonnées Browser / Protocol-Version
- `/json/list` renvoie du JSON (un tableau vide convient si aucune page n’est ouverte)

Si cette vérification échoue, Windows n’expose pas encore le port à WSL2, l’adresse est
incorrecte du côté de WSL2, ou le pare-feu, la redirection de port ou le proxy fait défaut. Corrigez
cela avant de modifier la configuration d’OpenClaw.

### Couche 3 : configurer le bon profil de navigateur

Faites pointer OpenClaw vers l’adresse accessible depuis WSL2 :

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Remarques :

- utilisez l’adresse accessible depuis WSL2, et non celle qui fonctionne uniquement sous Windows
- conservez `attachOnly: true` pour les navigateurs gérés de manière externe
- `cdpUrl` peut utiliser `http://`, `https://`, `ws://` ou `wss://`
- utilisez HTTP(S) lorsque vous souhaitez qu’OpenClaw découvre `/json/version`
- utilisez WS(S) uniquement lorsque le fournisseur du navigateur vous donne une URL directe de socket
  DevTools
- testez la même URL avec `curl` avant d’attendre qu’OpenClaw réussisse

### Couche 4 : vérifier séparément la couche de la Control UI

Ouvrez `http://127.0.0.1:18789/` depuis Windows, puis vérifiez :

- que l’origine de la page correspond à ce qu’attend `gateway.controlUi.allowedOrigins`
- que l’authentification par jeton ou l’appairage est correctement configuré
- que vous ne diagnostiquez pas un problème d’authentification de la Control UI comme s’il s’agissait d’un problème de
  navigateur

Page utile : [Control UI](/fr/web/control-ui).

### Couche 5 : vérifier le contrôle du navigateur de bout en bout

Depuis WSL2 :

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Résultat attendu :

- l’onglet s’ouvre dans Chrome sous Windows
- `browser tabs` renvoie la cible
- les actions ultérieures (`snapshot`, `screenshot`, `navigate`) fonctionnent depuis le même
  profil

## Erreurs courantes susceptibles d’induire en erreur

| Message                                                                                 | Signification                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | problème d’origine ou de contexte sécurisé de l’interface, et non problème de transport CDP                                                                                                           |
| `token_missing`                                                                         | problème de configuration de l’authentification                                                                                                                                                       |
| `pairing required`                                                                      | problème d’approbation de l’appareil                                                                                                                                                                  |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 ne peut pas atteindre le `cdpUrl` configuré                                                                                                                                                       |
| réponse CDP vide / `other side closed` via un portproxy                                 | incompatibilité entre les écouteurs Windows ou boucle sur soi-même ; inspectez les deux familles d’adresses de bouclage et `netsh interface portproxy show all`                                       |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | le point de terminaison HTTP a répondu, mais la WebSocket DevTools n’a pas pu être ouverte                                                                                                             |
| paramètres obsolètes de fenêtre d’affichage, de mode sombre, de langue ou de mode hors ligne après une session distante | exécutez `openclaw browser --browser-profile remote stop` pour fermer la session et libérer la connexion Playwright/CDP mise en cache sans redémarrer le Gateway ni le navigateur externe |
| délai d’attente autour de `remoteCdpTimeoutMs` (1500 ms par défaut)                     | il s’agit généralement toujours d’un problème d’accessibilité de CDP ou d’un point de terminaison distant lent ou inaccessible                                                                         |
| `Playwright page enumeration timed out after 3000ms`                                    | la connexion au CDP distant a réussi, mais la lecture persistante de ses onglets s’est bloquée ; le délai est la valeur la plus élevée entre `remoteCdpTimeoutMs` et `remoteCdpHandshakeTimeoutMs`      |
| `No Chrome tabs found for profile="user"`                                               | le profil MCP Chrome local est sélectionné alors qu’aucun onglet local à l’hôte n’est disponible                                                                                                      |

## Liste de contrôle pour un diagnostic rapide

1. Windows : laquelle des adresses `127.0.0.1` ou `[::1]` répond sur `/json/version`, et
   cet écouteur appartient-il à `chrome.exe` ?
2. WSL2 : `curl http://WINDOWS_HOST_OR_IP:9222/json/version` fonctionne-t-il ?
3. Configuration d’OpenClaw : `browser.profiles.<name>.cdpUrl` utilise-t-il exactement cette
   adresse accessible depuis WSL2 ?
4. Control UI : ouvrez-vous `http://127.0.0.1:18789/` plutôt qu’une adresse IP du réseau local ?
5. Essayez-vous d’utiliser `existing-session` entre WSL2 et Windows au lieu du
   CDP distant brut ?

Vérifiez d’abord localement le point de terminaison de Chrome sous Windows, puis vérifiez le même point de terminaison
depuis WSL2, et seulement ensuite diagnostiquez la configuration d’OpenClaw ou l’authentification de la Control UI.

## Voir aussi

- [Navigateur](/fr/tools/browser)
- [Connexion au navigateur](/fr/tools/browser-login)
- [Dépannage du navigateur sous Linux](/fr/tools/browser-linux-troubleshooting)
