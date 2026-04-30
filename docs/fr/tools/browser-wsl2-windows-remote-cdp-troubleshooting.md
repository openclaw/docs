---
read_when:
    - Exécuter OpenClaw Gateway dans WSL2 alors que Chrome est sur Windows
    - Voir des erreurs de navigateur/interface utilisateur de contrôle qui se chevauchent entre WSL2 et Windows
    - Choisir entre Chrome MCP local à l’hôte et CDP distant brut dans les configurations à hôtes séparés
summary: Dépanner par couches le Gateway WSL2 + le CDP distant de Chrome sous Windows
title: Dépannage de WSL2 + Windows + CDP Chrome distant
x-i18n:
    generated_at: "2026-04-30T07:50:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

Dans la configuration courante à hôtes séparés, le Gateway OpenClaw s’exécute dans WSL2, Chrome s’exécute sur Windows, et le contrôle du navigateur doit traverser la frontière entre WSL2 et Windows. Le schéma de défaillance en couches décrit dans [l’issue #39369](https://github.com/openclaw/openclaw/issues/39369) signifie que plusieurs problèmes indépendants peuvent apparaître en même temps, ce qui peut donner l’impression que la mauvaise couche est cassée en premier.

## Choisir d’abord le bon mode de navigateur

Vous avez deux modèles valides :

### Option 1 : CDP distant brut de WSL2 vers Windows

Utilisez un profil de navigateur distant qui pointe depuis WSL2 vers un endpoint CDP Chrome Windows.

Choisissez cette option lorsque :

- le Gateway reste dans WSL2
- Chrome s’exécute sur Windows
- vous avez besoin que le contrôle du navigateur traverse la frontière WSL2/Windows

### Option 2 : MCP Chrome local à l’hôte

Utilisez `existing-session` / `user` uniquement lorsque le Gateway lui-même s’exécute sur le même hôte que Chrome.

Choisissez cette option lorsque :

- OpenClaw et Chrome sont sur la même machine
- vous voulez l’état local du navigateur connecté
- vous n’avez pas besoin d’un transport de navigateur entre hôtes
- vous n’avez pas besoin de routes avancées gérées ou réservées au CDP brut comme `responsebody`, l’export
  PDF, l’interception de téléchargements ou les actions par lot

Pour Gateway WSL2 + Chrome Windows, préférez le CDP distant brut. Chrome MCP est local à l’hôte, ce n’est pas un pont de WSL2 vers Windows.

## Architecture fonctionnelle

Forme de référence :

- WSL2 exécute le Gateway sur `127.0.0.1:18789`
- Windows ouvre l’interface de contrôle dans un navigateur normal à l’adresse `http://127.0.0.1:18789/`
- Chrome Windows expose un endpoint CDP sur le port `9222`
- WSL2 peut atteindre cet endpoint CDP Windows
- OpenClaw pointe un profil de navigateur vers l’adresse accessible depuis WSL2

## Pourquoi cette configuration prête à confusion

Plusieurs défaillances peuvent se chevaucher :

- WSL2 ne peut pas atteindre l’endpoint CDP Windows
- l’interface de contrôle est ouverte depuis une origine non sécurisée
- `gateway.controlUi.allowedOrigins` ne correspond pas à l’origine de la page
- le jeton ou l’association est manquant
- le profil de navigateur pointe vers la mauvaise adresse

Pour cette raison, corriger une couche peut toujours laisser une autre erreur visible.

## Règle critique pour l’interface de contrôle

Lorsque l’UI est ouverte depuis Windows, utilisez localhost Windows, sauf si vous disposez d’une configuration HTTPS volontaire.

Utilisez :

`http://127.0.0.1:18789/`

N’utilisez pas par défaut une IP LAN pour l’interface de contrôle. Le HTTP simple sur une adresse LAN ou tailnet peut déclencher un comportement d’origine non sécurisée ou d’authentification d’appareil sans rapport avec CDP lui-même. Consultez [l’interface de contrôle](/fr/web/control-ui).

## Valider par couches

Travaillez de haut en bas. Ne sautez pas d’étape.

### Couche 1 : Vérifier que Chrome sert CDP sur Windows

Démarrez Chrome sur Windows avec le débogage distant activé :

```powershell
chrome.exe --remote-debugging-port=9222
```

Depuis Windows, vérifiez d’abord Chrome lui-même :

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Si cela échoue sur Windows, OpenClaw n’est pas encore le problème.

### Couche 2 : Vérifier que WSL2 peut atteindre cet endpoint Windows

Depuis WSL2, testez l’adresse exacte que vous prévoyez d’utiliser dans `cdpUrl` :

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Bon résultat :

- `/json/version` renvoie du JSON avec les métadonnées Browser / Protocol-Version
- `/json/list` renvoie du JSON (un tableau vide convient si aucune page n’est ouverte)

Si cela échoue :

- Windows n’expose pas encore le port à WSL2
- l’adresse est incorrecte côté WSL2
- le pare-feu, la redirection de port ou le proxy local manque encore

Corrigez cela avant de toucher à la configuration OpenClaw.

### Couche 3 : Configurer le bon profil de navigateur

Pour le CDP distant brut, faites pointer OpenClaw vers l’adresse accessible depuis WSL2 :

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

- utilisez l’adresse accessible depuis WSL2, pas celle qui fonctionne uniquement sur Windows
- gardez `attachOnly: true` pour les navigateurs gérés en externe
- `cdpUrl` peut être `http://`, `https://`, `ws://` ou `wss://`
- utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version`
- utilisez WS(S) uniquement lorsque le fournisseur de navigateur vous donne une URL de socket DevTools directe
- testez la même URL avec `curl` avant de vous attendre à ce qu’OpenClaw réussisse

### Couche 4 : Vérifier séparément la couche de l’interface de contrôle

Ouvrez l’UI depuis Windows :

`http://127.0.0.1:18789/`

Puis vérifiez :

- l’origine de la page correspond à ce que `gateway.controlUi.allowedOrigins` attend
- l’authentification par jeton ou l’association est configurée correctement
- vous ne déboguez pas un problème d’authentification de l’interface de contrôle comme s’il s’agissait d’un problème de navigateur

Page utile :

- [Interface de contrôle](/fr/web/control-ui)

### Couche 5 : Vérifier le contrôle du navigateur de bout en bout

Depuis WSL2 :

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Bon résultat :

- l’onglet s’ouvre dans Chrome Windows
- `openclaw browser tabs` renvoie la cible
- les actions ultérieures (`snapshot`, `screenshot`, `navigate`) fonctionnent depuis le même profil

## Erreurs courantes trompeuses

Traitez chaque message comme un indice propre à une couche :

- `control-ui-insecure-auth`
  - problème d’origine de l’UI ou de contexte sécurisé, pas un problème de transport CDP
- `token_missing`
  - problème de configuration d’authentification
- `pairing required`
  - problème d’approbation de l’appareil
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 ne peut pas atteindre le `cdpUrl` configuré
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - l’endpoint HTTP a répondu, mais le WebSocket DevTools n’a toujours pas pu être ouvert
- remplacements obsolètes de viewport / dark-mode / paramètres régionaux / mode hors ligne après une session distante
  - exécutez `openclaw browser stop --browser-profile remote`
  - cela ferme la session de contrôle active et libère l’état d’émulation Playwright/CDP sans redémarrer le Gateway ni le navigateur externe
- `gateway timeout after 1500ms`
  - souvent encore un problème d’accessibilité CDP ou un endpoint distant lent/inaccessible
- `No Chrome tabs found for profile="user"`
  - profil MCP Chrome local sélectionné alors qu’aucun onglet local à l’hôte n’est disponible

## Liste de triage rapide

1. Windows : `curl http://127.0.0.1:9222/json/version` fonctionne-t-il ?
2. WSL2 : `curl http://WINDOWS_HOST_OR_IP:9222/json/version` fonctionne-t-il ?
3. Configuration OpenClaw : `browser.profiles.<name>.cdpUrl` utilise-t-il exactement cette adresse accessible depuis WSL2 ?
4. Interface de contrôle : ouvrez-vous `http://127.0.0.1:18789/` au lieu d’une IP LAN ?
5. Essayez-vous d’utiliser `existing-session` entre WSL2 et Windows au lieu du CDP distant brut ?

## À retenir en pratique

Cette configuration est généralement viable. La difficulté est que le transport du navigateur, la sécurité d’origine de l’interface de contrôle, et le jeton ou l’association peuvent chacun échouer indépendamment tout en semblant similaires côté utilisateur.

En cas de doute :

- vérifiez d’abord localement l’endpoint Chrome Windows
- vérifiez ensuite le même endpoint depuis WSL2
- déboguez seulement ensuite la configuration OpenClaw ou l’authentification de l’interface de contrôle

## Connexe

- [Navigateur](/fr/tools/browser)
- [Connexion au navigateur](/fr/tools/browser-login)
- [Dépannage du navigateur sous Linux](/fr/tools/browser-linux-troubleshooting)
