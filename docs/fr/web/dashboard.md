---
read_when:
    - Modification des modes d’authentification ou d’exposition du tableau de bord
summary: Accès et authentification au tableau de bord Gateway (interface de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-05-05T01:51:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Le tableau de bord Gateway est l’interface de contrôle dans le navigateur servie sur `/` par défaut
(à remplacer avec `gateway.controlUi.basePath`).

Ouverture rapide (Gateway local) :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))
- Avec `gateway.tls.enabled: true`, utilisez `https://127.0.0.1:18789/` et
  `wss://127.0.0.1:18789` pour le point de terminaison WebSocket.

Références clés :

- [Interface de contrôle](/fr/web/control-ui) pour l’utilisation et les capacités de l’interface.
- [Tailscale](/fr/gateway/tailscale) pour l’automatisation Serve/Funnel.
- [Surfaces Web](/fr/web) pour les modes de liaison et les notes de sécurité.

L’authentification est appliquée lors de l’établissement de la connexion WebSocket via le chemin
d’authentification gateway configuré :

- `connect.params.auth.token`
- `connect.params.auth.password`
- En-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- en-têtes d’identité de proxy approuvé lorsque `gateway.auth.mode: "trusted-proxy"`

Consultez `gateway.auth` dans [Configuration de Gateway](/fr/gateway/configuration).

Note de sécurité : l’interface de contrôle est une **surface d’administration** (chat, configuration, approbations d’exécution).
Ne l’exposez pas publiquement. L’interface conserve les jetons d’URL du tableau de bord dans sessionStorage
pour la session de l’onglet de navigateur actuel et l’URL gateway sélectionnée, et les retire de l’URL après le chargement.
Privilégiez localhost, Tailscale Serve ou un tunnel SSH.

## Parcours rapide (recommandé)

- Après l’onboarding, la CLI ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton).
- Rouvrir à tout moment : `openclaw dashboard` (copie le lien, ouvre le navigateur si possible, affiche une indication SSH si l’environnement est sans interface graphique).
- Si la remise via le presse-papiers et le navigateur échoue, `openclaw dashboard` affiche quand même
  l’URL propre et vous indique d’utiliser le jeton provenant de `OPENCLAW_GATEWAY_TOKEN` ou
  `gateway.auth.token` comme clé de fragment d’URL `token` ; il n’affiche pas les valeurs de jeton
  dans les journaux.
- Si l’interface demande une authentification par secret partagé, collez le jeton ou
  le mot de passe configuré dans les paramètres de l’interface de contrôle.

## Bases de l’authentification (local vs distant)

- **Localhost** : ouvrez `http://127.0.0.1:18789/`.
- **TLS Gateway** : lorsque `gateway.tls.enabled: true`, les liens du tableau de bord/statut utilisent
  `https://` et les liens WebSocket de l’interface de contrôle utilisent `wss://`.
- **Source du jeton de secret partagé** : `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`) ; `openclaw dashboard` peut le transmettre via un fragment d’URL
  pour un amorçage ponctuel, et l’interface de contrôle le conserve dans sessionStorage pour
  la session de l’onglet de navigateur actuel et l’URL gateway sélectionnée au lieu de localStorage.
- Si `gateway.auth.token` est géré par SecretRef, `openclaw dashboard`
  affiche/copie/ouvre volontairement une URL sans jeton. Cela évite d’exposer
  les jetons gérés en externe dans les journaux du shell, l’historique du presse-papiers ou les
  arguments de lancement du navigateur.
- Si `gateway.auth.token` est configuré comme SecretRef et n’est pas résolu dans votre
  shell actuel, `openclaw dashboard` affiche quand même une URL sans jeton ainsi que
  des instructions exploitables de configuration de l’authentification.
- **Mot de passe de secret partagé** : utilisez le `gateway.auth.password` configuré (ou
  `OPENCLAW_GATEWAY_PASSWORD`). Le tableau de bord ne conserve pas les mots de passe entre
  les rechargements.
- **Modes porteurs d’identité** : Tailscale Serve peut satisfaire l’authentification de l’interface de contrôle/WebSocket
  via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true`, et un
  proxy inverse non-loopback conscient de l’identité peut satisfaire
  `gateway.auth.mode: "trusted-proxy"`. Dans ces modes, le tableau de bord n’a pas
  besoin d’un secret partagé collé pour le WebSocket.
- **Pas localhost** : utilisez Tailscale Serve, une liaison non-loopback avec secret partagé, un
  proxy inverse non-loopback conscient de l’identité avec
  `gateway.auth.mode: "trusted-proxy"`, ou un tunnel SSH. Les API HTTP utilisent toujours
  l’authentification par secret partagé, sauf si vous exécutez intentionnellement une entrée privée
  `gateway.auth.mode: "none"` ou une authentification HTTP par proxy approuvé. Consultez
  [Surfaces Web](/fr/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si vous voyez "unauthorized" / 1008

- Assurez-vous que gateway est joignable (local : `openclaw status` ; distant : tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, puis ouvrez `http://127.0.0.1:18789/`).
- Pour `AUTH_TOKEN_MISMATCH`, les clients peuvent effectuer une nouvelle tentative approuvée avec un jeton d’appareil mis en cache lorsque gateway renvoie des indications de nouvelle tentative. Cette nouvelle tentative avec jeton mis en cache réutilise les périmètres approuvés mis en cache du jeton ; les appelants avec `deviceToken` explicite / `scopes` explicites conservent l’ensemble de périmètres demandé. Si l’authentification échoue toujours après cette nouvelle tentative, résolvez manuellement la dérive du jeton.
- En dehors de ce chemin de nouvelle tentative, l’ordre de priorité de l’authentification de connexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- Sur le chemin asynchrone de l’interface de contrôle Tailscale Serve, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur d’authentification échouée ne les enregistre, de sorte que
  la deuxième mauvaise nouvelle tentative concurrente peut déjà afficher `retry later`.
- Pour les étapes de réparation de dérive du jeton, suivez la [Liste de vérification de récupération en cas de dérive du jeton](/fr/cli/devices#token-drift-recovery-checklist).
- Récupérez ou fournissez le secret partagé depuis l’hôte gateway :
  - Jeton : `openclaw config get gateway.auth.token`
  - Mot de passe : résolvez le `gateway.auth.password` configuré ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Jeton géré par SecretRef : résolvez le fournisseur de secret externe ou exportez
    `OPENCLAW_GATEWAY_TOKEN` dans ce shell, puis réexécutez `openclaw dashboard`
  - Aucun secret partagé configuré : `openclaw doctor --generate-gateway-token`
- Dans les paramètres du tableau de bord, collez le jeton ou le mot de passe dans le champ d’authentification,
  puis connectez-vous.
- Le sélecteur de langue de l’interface se trouve dans **Vue d’ensemble -> Accès Gateway -> Langue**.
  Il fait partie de la carte d’accès, pas de la section Apparence.

## Connexe

- [Interface de contrôle](/fr/web/control-ui)
- [WebChat](/fr/web/webchat)
