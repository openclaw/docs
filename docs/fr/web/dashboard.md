---
read_when:
    - Modifier les modes d’authentification ou d’exposition du tableau de bord
summary: Accès et authentification au tableau de bord Gateway (Control UI)
title: Tableau de bord
x-i18n:
    generated_at: "2026-04-23T07:13:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Tableau de bord (Control UI)

Le tableau de bord Gateway est la Control UI du navigateur servie à `/` par défaut
(remplaçable avec `gateway.controlUi.basePath`).

Ouverture rapide (Gateway local) :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Références clés :

- [Control UI](/fr/web/control-ui) pour l’utilisation et les capacités de l’interface.
- [Tailscale](/fr/gateway/tailscale) pour l’automatisation Serve/Funnel.
- [Web surfaces](/fr/web) pour les modes de liaison et les remarques de sécurité.

L’authentification est imposée lors du handshake WebSocket via le chemin
d’authentification gateway configuré :

- `connect.params.auth.token`
- `connect.params.auth.password`
- En-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- En-têtes d’identité trusted-proxy lorsque `gateway.auth.mode: "trusted-proxy"`

Consultez `gateway.auth` dans [Gateway configuration](/fr/gateway/configuration).

Remarque de sécurité : la Control UI est une **surface d’administration** (chat, config, approbations exec).
Ne l’exposez pas publiquement. L’interface conserve les jetons d’URL du tableau de bord dans sessionStorage
pour la session d’onglet de navigateur en cours et l’URL gateway sélectionnée, et les supprime de l’URL après chargement.
Préférez localhost, Tailscale Serve ou un tunnel SSH.

## Chemin rapide (recommandé)

- Après l’onboarding, la CLI ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton).
- Pour le rouvrir à tout moment : `openclaw dashboard` (copie le lien, ouvre le navigateur si possible, affiche un indice SSH en mode headless).
- Si l’interface demande une authentification par secret partagé, collez le jeton ou
  le mot de passe configuré dans les paramètres de la Control UI.

## Bases de l’authentification (local vs distant)

- **Localhost** : ouvrez `http://127.0.0.1:18789/`.
- **Source du jeton secret partagé** : `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`) ; `openclaw dashboard` peut le passer via un fragment d’URL
  pour un amorçage ponctuel, et la Control UI le conserve dans sessionStorage pour la
  session d’onglet de navigateur actuelle et l’URL gateway sélectionnée au lieu de localStorage.
- Si `gateway.auth.token` est géré par SecretRef, `openclaw dashboard`
  affiche/copie/ouvre par conception une URL sans jeton. Cela évite d’exposer
  des jetons gérés en externe dans les journaux shell, l’historique du presse-papiers ou les
  arguments de lancement du navigateur.
- Si `gateway.auth.token` est configuré comme SecretRef et n’est pas résolu dans votre
  shell actuel, `openclaw dashboard` affiche tout de même une URL sans jeton ainsi que
  des indications actionnables de configuration de l’authentification.
- **Mot de passe secret partagé** : utilisez `gateway.auth.password` configuré (ou
  `OPENCLAW_GATEWAY_PASSWORD`). Le tableau de bord ne persiste pas les mots de passe après
  rechargement.
- **Modes porteurs d’identité** : Tailscale Serve peut satisfaire l’authentification Control UI/WebSocket
  via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true`, et un
  reverse proxy non-loopback conscient de l’identité peut satisfaire
  `gateway.auth.mode: "trusted-proxy"`. Dans ces modes, le tableau de bord n’a pas
  besoin d’un secret partagé collé pour le WebSocket.
- **Pas localhost** : utilisez Tailscale Serve, une liaison non-loopback avec secret partagé, un
  reverse proxy non-loopback conscient de l’identité avec
  `gateway.auth.mode: "trusted-proxy"`, ou un tunnel SSH. Les API HTTP utilisent toujours
  l’authentification par secret partagé sauf si vous exécutez volontairement
  `gateway.auth.mode: "none"` en entrée privée ou l’authentification HTTP trusted-proxy. Consultez
  [Web surfaces](/fr/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si vous voyez "unauthorized" / 1008

- Assurez-vous que le gateway est joignable (local : `openclaw status` ; distant : tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`).
- Pour `AUTH_TOKEN_MISMATCH`, les clients peuvent effectuer une seule nouvelle tentative de confiance avec un jeton d’appareil mis en cache lorsque le gateway renvoie des indices de nouvelle tentative. Cette nouvelle tentative avec jeton mis en cache réutilise les portées approuvées mises en cache du jeton ; les appelants `deviceToken` explicites / `scopes` explicites conservent leur jeu de portées demandé. Si l’authentification échoue toujours après cette nouvelle tentative, résolvez manuellement la dérive du jeton.
- En dehors de ce chemin de nouvelle tentative, la priorité d’authentification à la connexion est : jeton partagé/mot de passe explicite d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké, puis jeton d’amorçage.
- Sur le chemin asynchrone Tailscale Serve de la Control UI, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur d’authentification échouée ne les enregistre, de sorte que la deuxième mauvaise nouvelle tentative concurrente peut déjà afficher `retry later`.
- Pour les étapes de réparation de dérive de jeton, suivez [Token drift recovery checklist](/fr/cli/devices#token-drift-recovery-checklist).
- Récupérez ou fournissez le secret partagé depuis l’hôte gateway :
  - Jeton : `openclaw config get gateway.auth.token`
  - Mot de passe : résolvez `gateway.auth.password` configuré ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Jeton géré par SecretRef : résolvez le provider de secret externe ou exportez
    `OPENCLAW_GATEWAY_TOKEN` dans ce shell, puis relancez `openclaw dashboard`
  - Aucun secret partagé configuré : `openclaw doctor --generate-gateway-token`
- Dans les paramètres du tableau de bord, collez le jeton ou le mot de passe dans le champ d’authentification,
  puis connectez-vous.
- Le sélecteur de langue de l’interface se trouve dans **Overview -> Gateway Access -> Language**.
  Il fait partie de la carte d’accès, pas de la section Appearance.
