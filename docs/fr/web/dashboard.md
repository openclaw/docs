---
read_when:
    - Modification des modes d’authentification ou d’exposition du tableau de bord
summary: Accès et authentification du tableau de bord Gateway (interface de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-05-11T21:01:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
---

Le tableau de bord du Gateway est l’interface de contrôle dans le navigateur servie sur `/` par défaut
(remplacez avec `gateway.controlUi.basePath`).

Ouverture rapide (Gateway local) :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))
- Avec `gateway.tls.enabled: true`, utilisez `https://127.0.0.1:18789/` et
  `wss://127.0.0.1:18789` pour le point de terminaison WebSocket.

Références clés :

- [Interface de contrôle](/fr/web/control-ui) pour l’utilisation et les capacités de l’interface.
- [Tailscale](/fr/gateway/tailscale) pour l’automatisation Serve/Funnel.
- [Surfaces Web](/fr/web) pour les modes de liaison et les notes de sécurité.

L’authentification est appliquée lors de la négociation WebSocket via le chemin
d’authentification du Gateway configuré :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Voir `gateway.auth` dans [Configuration du Gateway](/fr/gateway/configuration).

Note de sécurité : l’interface de contrôle est une **surface d’administration** (chat, configuration, approbations d’exécution).
Ne l’exposez pas publiquement. L’interface conserve les jetons d’URL du tableau de bord dans sessionStorage
pour la session de l’onglet de navigateur actuel et l’URL de Gateway sélectionnée, puis les supprime de l’URL après le chargement.
Préférez localhost, Tailscale Serve ou un tunnel SSH.

## Parcours rapide (recommandé)

- Après l’intégration, la CLI ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton).
- Rouvrez-le à tout moment : `openclaw dashboard` (copie le lien, ouvre le navigateur si possible, affiche une indication SSH en environnement sans interface graphique).
- Si le presse-papiers et l’ouverture du navigateur échouent, `openclaw dashboard` affiche quand même
  l’URL propre et vous indique d’utiliser le jeton depuis `OPENCLAW_GATEWAY_TOKEN` ou
  `gateway.auth.token` comme clé de fragment d’URL `token`; il n’affiche pas les valeurs de jeton
  dans les journaux.
- Si l’interface vous demande une authentification par secret partagé, collez le jeton ou
  le mot de passe configuré dans les paramètres de l’interface de contrôle.

## Bases de l’authentification (local ou distant)

- **Localhost** : ouvrez `http://127.0.0.1:18789/`.
- **TLS du Gateway** : lorsque `gateway.tls.enabled: true`, les liens de tableau de bord/statut utilisent
  `https://` et les liens WebSocket de l’interface de contrôle utilisent `wss://`.
- **Source du jeton de secret partagé** : `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` peut le transmettre via un fragment d’URL
  pour un amorçage unique, et l’interface de contrôle le conserve dans sessionStorage pour la
  session de l’onglet de navigateur actuel et l’URL de Gateway sélectionnée au lieu de localStorage.
- Si `gateway.auth.token` est géré par SecretRef, `openclaw dashboard`
  affiche/copie/ouvre volontairement une URL sans jeton. Cela évite d’exposer
  les jetons gérés en externe dans les journaux du shell, l’historique du presse-papiers ou les
  arguments de lancement du navigateur.
- Si `gateway.auth.token` est configuré comme SecretRef et n’est pas résolu dans votre
  shell actuel, `openclaw dashboard` affiche quand même une URL sans jeton ainsi que
  des conseils pratiques de configuration de l’authentification.
- **Mot de passe de secret partagé** : utilisez le `gateway.auth.password` configuré (ou
  `OPENCLAW_GATEWAY_PASSWORD`). Le tableau de bord ne conserve pas les mots de passe entre les
  rechargements.
- **Modes avec identité** : Tailscale Serve peut satisfaire l’authentification de l’interface de contrôle/WebSocket
  via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true`, et un
  proxy inverse non local loopback tenant compte de l’identité peut satisfaire
  `gateway.auth.mode: "trusted-proxy"`. Dans ces modes, le tableau de bord n’a pas
  besoin d’un secret partagé collé pour le WebSocket.
- **Pas localhost** : utilisez Tailscale Serve, une liaison non local loopback avec secret partagé, un
  proxy inverse non local loopback tenant compte de l’identité avec
  `gateway.auth.mode: "trusted-proxy"`, ou un tunnel SSH. Les API HTTP utilisent toujours
  l’authentification par secret partagé sauf si vous exécutez intentionnellement
  `gateway.auth.mode: "none"` en entrée privée ou l’authentification HTTP trusted-proxy. Voir
  [Surfaces Web](/fr/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si vous voyez "unauthorized" / 1008

- Assurez-vous que le Gateway est joignable (local : `openclaw status`; distant : tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host`, puis ouvrez `http://127.0.0.1:18789/`).
- Pour `AUTH_TOKEN_MISMATCH`, les clients peuvent effectuer une nouvelle tentative de confiance avec un jeton d’appareil mis en cache lorsque le Gateway renvoie des indications de nouvelle tentative. Cette nouvelle tentative avec jeton mis en cache réutilise les portées approuvées mises en cache du jeton; les appelants avec `deviceToken` explicite / `scopes` explicites conservent l’ensemble de portées demandé. Si l’authentification échoue encore après cette tentative, corrigez manuellement la dérive de jeton.
- Pour `AUTH_SCOPE_MISMATCH`, le jeton d’appareil a été reconnu mais ne porte pas les portées demandées par le tableau de bord; réassociez l’appareil ou approuvez le contrat de portée demandé au lieu de faire tourner le jeton partagé du Gateway.
- En dehors de ce chemin de nouvelle tentative, la priorité de l’authentification de connexion est d’abord le jeton/mot de passe partagé explicite, puis le `deviceToken` explicite, puis le jeton d’appareil stocké, puis le jeton d’amorçage.
- Sur le chemin asynchrone de l’interface de contrôle Tailscale Serve, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur d’authentification échouée les enregistre, de sorte que
  la deuxième mauvaise tentative concurrente peut déjà afficher `retry later`.
- Pour les étapes de correction de dérive de jeton, suivez la [Liste de contrôle de récupération après dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist).
- Récupérez ou fournissez le secret partagé depuis l’hôte du Gateway :
  - Jeton : `openclaw config get gateway.auth.token`
  - Mot de passe : résolvez le `gateway.auth.password` configuré ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Jeton géré par SecretRef : résolvez le fournisseur de secret externe ou exportez
    `OPENCLAW_GATEWAY_TOKEN` dans ce shell, puis relancez `openclaw dashboard`
  - Aucun secret partagé configuré : `openclaw doctor --generate-gateway-token`
- Dans les paramètres du tableau de bord, collez le jeton ou le mot de passe dans le champ d’authentification,
  puis connectez-vous.
- Le sélecteur de langue de l’interface se trouve dans **Vue d’ensemble -> Accès au Gateway -> Langue**.
  Il fait partie de la carte d’accès, pas de la section Apparence.

## Connexe

- [Interface de contrôle](/fr/web/control-ui)
- [WebChat](/fr/web/webchat)
