---
read_when:
    - Exécuter le Gateway OpenClaw dans WSL2 tandis que Chrome s’exécute sur Windows
    - Voir des erreurs de browser/control-ui qui se recouvrent entre WSL2 et Windows
    - Choisir entre le MCP Chrome local à l’hôte et le CDP distant brut dans les configurations à hôtes séparés
summary: Dépanner le Gateway WSL2 + Chrome Windows distant via CDP par couches
title: Dépannage WSL2 + Windows + Chrome distant via CDP
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T07:35:02Z"
  model: gpt-5.4
  provider: openai
  source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
  source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
  workflow: 15
---

Ce guide couvre la configuration courante à hôtes séparés où :

- le Gateway OpenClaw s’exécute dans WSL2
- Chrome s’exécute sur Windows
- le contrôle du navigateur doit traverser la frontière WSL2/Windows

Il couvre aussi le motif d’échec par couches de [l’issue #39369](https://github.com/openclaw/openclaw/issues/39369) : plusieurs problèmes indépendants peuvent apparaître en même temps, ce qui fait que la mauvaise couche semble cassée en premier.

## Choisissez d’abord le bon mode navigateur

Vous avez deux schémas valides :

### Option 1 : CDP distant brut de WSL2 vers Windows

Utilisez un profil de navigateur distant qui pointe de WSL2 vers un point de terminaison CDP Chrome sous Windows.

Choisissez cette option lorsque :

- le Gateway reste dans WSL2
- Chrome s’exécute sur Windows
- vous avez besoin que le contrôle du navigateur traverse la frontière WSL2/Windows

### Option 2 : Chrome MCP local à l’hôte

Utilisez `existing-session` / `user` uniquement lorsque le Gateway lui-même s’exécute sur le même hôte que Chrome.

Choisissez cette option lorsque :

- OpenClaw et Chrome sont sur la même machine
- vous voulez l’état local connecté du navigateur
- vous n’avez pas besoin de transport navigateur inter-hôtes
- vous n’avez pas besoin de routes avancées limitées à managed/raw-CDP comme `responsebody`, l’export PDF, l’interception de téléchargement, ou les actions par lots

Pour un Gateway WSL2 + Chrome Windows, préférez le CDP distant brut. Chrome MCP est local à l’hôte, pas un pont WSL2-vers-Windows.

## Architecture fonctionnelle

Forme de référence :

- WSL2 exécute le Gateway sur `127.0.0.1:18789`
- Windows ouvre la Control UI dans un navigateur normal à `http://127.0.0.1:18789/`
- Chrome Windows expose un point de terminaison CDP sur le port `9222`
- WSL2 peut atteindre ce point de terminaison CDP Windows
- OpenClaw pointe un profil de navigateur vers l’adresse joignable depuis WSL2

## Pourquoi cette configuration est déroutante

Plusieurs échecs peuvent se recouvrir :

- WSL2 ne peut pas atteindre le point de terminaison CDP Windows
- la Control UI est ouverte depuis une origine non sécurisée
- `gateway.controlUi.allowedOrigins` ne correspond pas à l’origine de la page
- le jeton ou l’appairage est manquant
- le profil de navigateur pointe vers la mauvaise adresse

À cause de cela, corriger une couche peut encore laisser visible une erreur différente.

## Règle critique pour la Control UI

Lorsque l’interface est ouverte depuis Windows, utilisez localhost Windows sauf si vous avez une configuration HTTPS délibérée.

Utilisez :

`http://127.0.0.1:18789/`

N’utilisez pas par défaut une IP LAN pour la Control UI. Un HTTP simple sur une adresse LAN ou tailnet peut déclencher un comportement d’origine non sécurisée / d’authentification d’appareil sans rapport avec le CDP lui-même. Voir [Control UI](/fr/web/control-ui).

## Valider par couches

Travaillez de haut en bas. Ne sautez pas d’étape.

### Couche 1 : vérifier que Chrome sert CDP sur Windows

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

### Couche 2 : vérifier que WSL2 peut atteindre ce point de terminaison Windows

Depuis WSL2, testez l’adresse exacte que vous comptez utiliser dans `cdpUrl` :

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Bon résultat :

- `/json/version` renvoie du JSON avec les métadonnées Browser / Protocol-Version
- `/json/list` renvoie du JSON (un tableau vide convient si aucune page n’est ouverte)

Si cela échoue :

- Windows n’expose pas encore le port à WSL2
- l’adresse est mauvaise du point de vue WSL2
- le pare-feu / le transfert de port / le proxy local manque encore

Corrigez cela avant de toucher à la configuration OpenClaw.

### Couche 3 : configurer le bon profil de navigateur

Pour le CDP distant brut, faites pointer OpenClaw vers l’adresse joignable depuis WSL2 :

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

- utilisez l’adresse joignable depuis WSL2, pas celle qui ne fonctionne que sur Windows
- gardez `attachOnly: true` pour les navigateurs gérés en externe
- `cdpUrl` peut être `http://`, `https://`, `ws://`, ou `wss://`
- utilisez HTTP(S) lorsque vous voulez qu’OpenClaw découvre `/json/version`
- utilisez WS(S) uniquement lorsque le fournisseur de navigateur vous donne une URL directe de socket DevTools
- testez la même URL avec `curl` avant d’attendre qu’OpenClaw réussisse

### Couche 4 : vérifier séparément la couche Control UI

Ouvrez l’interface depuis Windows :

`http://127.0.0.1:18789/`

Puis vérifiez :

- l’origine de la page correspond à ce que `gateway.controlUi.allowedOrigins` attend
- l’authentification par jeton ou l’appairage est correctement configuré
- vous n’êtes pas en train de déboguer un problème d’authentification de la Control UI comme s’il s’agissait d’un problème de navigateur

Page utile :

- [Control UI](/fr/web/control-ui)

### Couche 5 : vérifier le contrôle navigateur de bout en bout

Depuis WSL2 :

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Bon résultat :

- l’onglet s’ouvre dans Chrome Windows
- `openclaw browser tabs` renvoie la cible
- les actions suivantes (`snapshot`, `screenshot`, `navigate`) fonctionnent depuis le même profil

## Erreurs trompeuses courantes

Traitez chaque message comme un indice propre à une couche :

- `control-ui-insecure-auth`
  - problème d’origine d’interface / de contexte sécurisé, pas un problème de transport CDP
- `token_missing`
  - problème de configuration d’authentification
- `pairing required`
  - problème d’approbation d’appareil
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 ne peut pas atteindre le `cdpUrl` configuré
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - le point de terminaison HTTP a répondu, mais le WebSocket DevTools n’a toujours pas pu être ouvert
- remplacements persistants de viewport / mode sombre / locale / hors ligne après une session distante
  - exécutez `openclaw browser stop --browser-profile remote`
  - cela ferme la session de contrôle active et libère l’état d’émulation Playwright/CDP sans redémarrer le gateway ni le navigateur externe
- `gateway timeout after 1500ms`
  - souvent encore un problème de joignabilité CDP ou un point de terminaison distant lent/injoignable
- `No Chrome tabs found for profile="user"`
  - profil Chrome MCP local à l’hôte sélectionné là où aucun onglet local à l’hôte n’est disponible

## Checklist de tri rapide

1. Windows : est-ce que `curl http://127.0.0.1:9222/json/version` fonctionne ?
2. WSL2 : est-ce que `curl http://WINDOWS_HOST_OR_IP:9222/json/version` fonctionne ?
3. Configuration OpenClaw : est-ce que `browser.profiles.<name>.cdpUrl` utilise cette adresse exacte joignable depuis WSL2 ?
4. Control UI : ouvrez-vous `http://127.0.0.1:18789/` au lieu d’une IP LAN ?
5. Essayez-vous d’utiliser `existing-session` entre WSL2 et Windows au lieu du CDP distant brut ?

## Conclusion pratique

La configuration est généralement viable. Le plus difficile est que le transport navigateur, la sécurité d’origine de la Control UI, et le jeton/l’appairage peuvent chacun échouer indépendamment tout en semblant similaires du point de vue de l’utilisateur.

En cas de doute :

- vérifiez d’abord localement le point de terminaison Chrome Windows
- vérifiez ensuite le même point de terminaison depuis WSL2
- seulement après cela, déboguez la configuration OpenClaw ou l’authentification de la Control UI

## Lié

- [Browser](/fr/tools/browser)
- [Connexion Browser](/fr/tools/browser-login)
- [Dépannage Browser Linux](/fr/tools/browser-linux-troubleshooting)
