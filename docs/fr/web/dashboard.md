---
read_when:
    - Modification des modes d’authentification ou d’exposition du tableau de bord
summary: Accès et authentification au tableau de bord du Gateway (interface de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-07-12T16:02:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Le tableau de bord du Gateway est l’interface de contrôle accessible dans le navigateur, servie à l’emplacement `/` par défaut (modifiable avec `gateway.controlUi.basePath`).

Ouverture rapide (Gateway local) :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))
- Avec `gateway.tls.enabled: true`, utilisez `https://127.0.0.1:18789/` et `wss://127.0.0.1:18789` pour le point de terminaison WebSocket.

Références principales :

- [Interface de contrôle](/fr/web/control-ui) pour son utilisation et ses fonctionnalités.
- [Tailscale](/fr/gateway/tailscale) pour l’automatisation de Serve/Funnel.
- [Surfaces web](/fr/web) pour les modes d’écoute et les remarques de sécurité.

L’authentification est appliquée lors de l’établissement de la connexion WebSocket par le biais du mécanisme d’authentification configuré pour le Gateway :

- `connect.params.auth.token`
- `connect.params.auth.password`
- En-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- En-têtes d’identité du proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Consultez `gateway.auth` dans la [configuration du Gateway](/fr/gateway/configuration).

<Warning>
L’interface de contrôle est une **surface d’administration** (discussion, configuration, approbations d’exécution). Ne l’exposez pas publiquement. L’interface conserve les jetons des URL du tableau de bord dans sessionStorage pour l’onglet actuel du navigateur et l’URL de Gateway sélectionnée, puis les retire de l’URL après le chargement. Préférez localhost, Tailscale Serve ou un tunnel SSH.
</Warning>

## Procédure rapide (recommandée)

- Après l’intégration initiale, la CLI ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton).
- Pour le rouvrir à tout moment : `openclaw dashboard` (copie le lien, ouvre un navigateur si possible et affiche une indication concernant SSH dans un environnement sans interface graphique).
- Si la transmission par le presse-papiers et le navigateur échoue, `openclaw dashboard` affiche tout de même l’URL propre et vous indique d’ajouter votre jeton (depuis `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.token`) sous la forme de la clé de fragment d’URL `token` ; la valeur du jeton n’est jamais affichée dans les journaux.
- Si l’interface demande une authentification par secret partagé, collez le jeton ou le mot de passe configuré dans les paramètres de l’interface de contrôle.

## Principes de base de l’authentification (locale ou distante)

- **Localhost** : ouvrez `http://127.0.0.1:18789/`.
- **TLS du Gateway** : lorsque `gateway.tls.enabled: true`, les liens du tableau de bord et d’état utilisent `https://`, tandis que les liens WebSocket de l’interface de contrôle utilisent `wss://`.
- **Source du jeton de secret partagé** : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` peut le transmettre dans le fragment d’URL pour une initialisation unique ; l’interface de contrôle le conserve dans sessionStorage pour l’onglet actuel et l’URL de Gateway sélectionnée, et non dans localStorage.
- Si `gateway.auth.token` est géré par SecretRef, `openclaw dashboard` affiche, copie et ouvre volontairement une URL sans jeton afin d’éviter d’exposer les jetons gérés en externe dans les journaux du shell, l’historique du presse-papiers ou les arguments de lancement du navigateur. Si la référence n’est pas résolue dans votre shell actuel, la commande affiche tout de même l’URL sans jeton ainsi que des instructions pratiques pour configurer l’authentification.
- **Mot de passe de secret partagé** : utilisez la valeur configurée de `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`). Le tableau de bord ne conserve pas les mots de passe entre les rechargements.
- **Modes fondés sur l’identité** : Tailscale Serve satisfait l’authentification de l’interface de contrôle et du WebSocket au moyen d’en-têtes d’identité lorsque `gateway.auth.allowTailscale: true` ; un proxy inverse sensible à l’identité et n’utilisant pas l’interface de bouclage satisfait `gateway.auth.mode: "trusted-proxy"`. Aucun de ces modes ne nécessite de coller un secret partagé pour le WebSocket.
- **Hors localhost** : utilisez Tailscale Serve, une écoute avec secret partagé hors interface de bouclage, un proxy inverse sensible à l’identité hors interface de bouclage avec `gateway.auth.mode: "trusted-proxy"`, ou un tunnel SSH. Les API HTTP utilisent toujours l’authentification par secret partagé, sauf si vous exécutez volontairement une entrée privée avec `gateway.auth.mode: "none"` ou une authentification HTTP par proxy de confiance. Consultez [Surfaces web](/fr/web).

## Ouvrir dans Telegram

Les bots Telegram peuvent ouvrir le tableau de bord sous forme de Mini App Telegram avec `/dashboard`.

Prérequis :

- `gateway.tailscale.mode: "serve"` ou `"funnel"` afin que Telegram reçoive une URL HTTPS de Mini App.
- L’expéditeur Telegram doit être le propriétaire du bot : un identifiant utilisateur Telegram numérique dans `commands.ownerAllowFrom` ou dans la valeur effective de `channels.telegram.allowFrom` pour le compte sélectionné.
- Exécutez `/dashboard` dans un message privé avec le bot. Les exécutions dans un groupe indiquent seulement d’ouvrir la commande dans un message privé et n’incluent aucun bouton.
- Installations Docker : les modes Serve/Funnel nécessitent que le Gateway écoute sur l’interface de bouclage à côté de `tailscaled`, ce que la mise en réseau par pont avec des ports publiés ne permet pas. Exécutez le conteneur du Gateway avec `network_mode: host` et montez dans le conteneur le socket `tailscaled` de l’hôte (`/var/run/tailscale`) ainsi que la CLI `tailscale`.

La Mini App effectue un transfert unique au propriétaire et redirige vers l’interface de contrôle avec un jeton d’initialisation de courte durée. Elle n’expose pas de jeton partagé du Gateway dans l’URL.

Éléments hors périmètre pour la v1 :

- L’iframe Telegram Web n’est pas prise en charge.
- Tailscale Serve/Funnel est le seul chemin d’URL publiée pris en charge.

<a id="if-you-see-unauthorized-1008"></a>

## Si « unauthorized » / 1008 s’affiche

- Vérifiez que le Gateway est accessible : en local, `openclaw status` ; à distance, créez un tunnel SSH avec `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, puis ouvrez `http://127.0.0.1:18789/`.
- Pour `AUTH_TOKEN_MISMATCH`, les clients peuvent effectuer une nouvelle tentative de confiance avec un jeton d’appareil mis en cache lorsque le Gateway renvoie des indications de nouvelle tentative ; cette tentative réutilise les portées approuvées mises en cache du jeton (les appelants qui spécifient explicitement `deviceToken`/`scopes` conservent l’ensemble de portées demandé). Si l’authentification échoue encore après cette nouvelle tentative, corrigez manuellement la divergence du jeton.
- Pour `AUTH_SCOPE_MISMATCH`, le jeton d’appareil a été reconnu, mais ne possède pas les portées demandées ; réassociez l’appareil ou approuvez le nouvel ensemble de portées au lieu de renouveler le jeton partagé du Gateway.
- En dehors de ce chemin de nouvelle tentative, l’ordre de priorité pour l’authentification de la connexion est le suivant : jeton ou mot de passe partagé explicite, puis `deviceToken` explicite, puis jeton d’appareil enregistré, puis jeton d’initialisation.
- Sur le chemin asynchrone Tailscale Serve, les tentatives ayant échoué pour la même paire `{scope, ip}` sont sérialisées avant leur enregistrement par le limiteur d’échecs d’authentification ; une deuxième nouvelle tentative incorrecte exécutée simultanément peut donc déjà afficher `retry later`.
- Pour connaître les étapes de correction d’une divergence de jeton, consultez la [liste de contrôle de récupération après une divergence de jeton](/fr/cli/devices#token-drift-recovery-checklist).
- Récupérez ou fournissez le secret partagé depuis l’hôte du Gateway :
  - Jeton : `openclaw config get gateway.auth.token`
  - Mot de passe : résolvez la valeur configurée de `gateway.auth.password` ou `OPENCLAW_GATEWAY_PASSWORD`
  - Jeton géré par SecretRef : résolvez le fournisseur de secrets externe, ou exportez `OPENCLAW_GATEWAY_TOKEN` dans ce shell et réexécutez `openclaw dashboard`
  - Aucun secret partagé configuré : `openclaw doctor --generate-gateway-token`
- Dans les paramètres du tableau de bord, collez le jeton ou le mot de passe dans le champ d’authentification, puis connectez-vous.
- Le sélecteur de langue de l’interface se trouve dans **Settings -> General -> Language**, et non sous Appearance.

## Pages connexes

- [Interface de contrôle](/fr/web/control-ui)
- [WebChat](/fr/web/webchat)
