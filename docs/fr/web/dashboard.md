---
read_when:
    - Modifier les modes d’authentification ou d’exposition du tableau de bord
summary: Accès et authentification du tableau de bord Gateway (UI de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-04-25T14:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

Le tableau de bord Gateway est l’UI de contrôle du navigateur servie à `/` par défaut
(remplaçable avec `gateway.controlUi.basePath`).

Ouverture rapide (Gateway locale) :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))
- Avec `gateway.tls.enabled: true`, utilisez `https://127.0.0.1:18789/` et
  `wss://127.0.0.1:18789` pour le point de terminaison WebSocket.

Références principales :

- [UI de contrôle](/fr/web/control-ui) pour l’utilisation et les capacités de l’UI.
- [Tailscale](/fr/gateway/tailscale) pour l’automatisation Serve/Funnel.
- [Surfaces web](/fr/web) pour les modes de liaison et les notes de sécurité.

L’authentification est appliquée lors de la négociation WebSocket via le chemin
d’authentification Gateway configuré :

- `connect.params.auth.token`
- `connect.params.auth.password`
- en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- en-têtes d’identité de proxy approuvé lorsque `gateway.auth.mode: "trusted-proxy"`

Voir `gateway.auth` dans [Configuration Gateway](/fr/gateway/configuration).

Note de sécurité : l’UI de contrôle est une **surface d’administration** (chat, config, approbations d’exécution).
Ne l’exposez pas publiquement. L’UI conserve les jetons d’URL du tableau de bord dans sessionStorage
pour la session d’onglet actuelle du navigateur et l’URL Gateway sélectionnée, puis les retire de l’URL après chargement.
Préférez localhost, Tailscale Serve ou un tunnel SSH.

## Chemin rapide (recommandé)

- Après l’onboarding, le CLI ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton).
- Pour le rouvrir à tout moment : `openclaw dashboard` (copie le lien, ouvre le navigateur si possible, affiche une indication SSH si headless).
- Si l’UI demande une authentification par secret partagé, collez le jeton ou le
  mot de passe configuré dans les paramètres de l’UI de contrôle.

## Bases de l’authentification (local vs distant)

- **Localhost** : ouvrez `http://127.0.0.1:18789/`.
- **TLS Gateway** : lorsque `gateway.tls.enabled: true`, les liens de tableau de bord/statut utilisent
  `https://` et les liens WebSocket de l’UI de contrôle utilisent `wss://`.
- **Source du jeton de secret partagé** : `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`) ; `openclaw dashboard` peut le transmettre via un fragment d’URL
  pour un amorçage ponctuel, et l’UI de contrôle le conserve dans sessionStorage pour la
  session d’onglet actuelle du navigateur et l’URL Gateway sélectionnée au lieu de localStorage.
- Si `gateway.auth.token` est géré par SecretRef, `openclaw dashboard`
  affiche/cop ie/ouvre par conception une URL sans jeton. Cela évite d’exposer
  des jetons gérés à l’extérieur dans les journaux shell, l’historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est configuré comme SecretRef et n’est pas résolu dans votre
  shell actuel, `openclaw dashboard` affiche quand même une URL sans jeton ainsi que des
  indications exploitables de configuration d’authentification.
- **Mot de passe de secret partagé** : utilisez le `gateway.auth.password` configuré (ou
  `OPENCLAW_GATEWAY_PASSWORD`). Le tableau de bord ne conserve pas les mots de passe lors des
  rechargements.
- **Modes avec identité** : Tailscale Serve peut satisfaire l’authentification de l’UI de contrôle/WebSocket
  via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true`, et un proxy inverse
  non-loopback sensible à l’identité peut satisfaire
  `gateway.auth.mode: "trusted-proxy"`. Dans ces modes, le tableau de bord n’a pas
  besoin d’un secret partagé collé pour le WebSocket.
- **Pas localhost** : utilisez Tailscale Serve, une liaison non-loopback à secret partagé, un
  proxy inverse non-loopback sensible à l’identité avec
  `gateway.auth.mode: "trusted-proxy"`, ou un tunnel SSH. Les API HTTP utilisent toujours
  l’authentification par secret partagé sauf si vous exécutez intentionnellement une ingress privée avec
  `gateway.auth.mode: "none"` ou une authentification HTTP via proxy approuvé. Voir
  [Surfaces web](/fr/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si vous voyez « unauthorized » / 1008

- Assurez-vous que la Gateway est joignable (local : `openclaw status` ; distant : tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`).
- Pour `AUTH_TOKEN_MISMATCH`, les clients peuvent effectuer une nouvelle tentative approuvée unique avec un jeton d’appareil mis en cache lorsque la Gateway renvoie des indications de nouvelle tentative. Cette nouvelle tentative avec jeton mis en cache réutilise les portées approuvées mises en cache du jeton ; les appelants `deviceToken` explicites / `scopes` explicites conservent leur ensemble de portées demandé. Si l’authentification échoue encore après cette nouvelle tentative, résolvez manuellement la dérive du jeton.
- En dehors de ce chemin de nouvelle tentative, la priorité d’authentification de connexion est : jeton/mot de passe partagé explicite d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké, puis jeton d’amorçage.
- Sur le chemin asynchrone de l’UI de contrôle Tailscale Serve, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur d’authentification échouée ne les enregistre, de sorte que la deuxième mauvaise nouvelle tentative simultanée peut déjà afficher `retry later`.
- Pour les étapes de réparation de dérive de jeton, suivez [Checklist de récupération de dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist).
- Récupérez ou fournissez le secret partagé depuis l’hôte Gateway :
  - Jeton : `openclaw config get gateway.auth.token`
  - Mot de passe : résolvez le `gateway.auth.password` configuré ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Jeton géré par SecretRef : résolvez le fournisseur de secrets externe ou exportez
    `OPENCLAW_GATEWAY_TOKEN` dans ce shell, puis relancez `openclaw dashboard`
  - Aucun secret partagé configuré : `openclaw doctor --generate-gateway-token`
- Dans les paramètres du tableau de bord, collez le jeton ou le mot de passe dans le champ d’authentification,
  puis connectez-vous.
- Le sélecteur de langue de l’UI se trouve dans **Vue d’ensemble -> Accès Gateway -> Langue**.
  Il fait partie de la carte d’accès, pas de la section Apparence.

## Lié

- [UI de contrôle](/fr/web/control-ui)
- [WebChat](/fr/web/webchat)
