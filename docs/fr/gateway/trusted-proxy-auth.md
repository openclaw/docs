---
read_when:
    - Exécution d’OpenClaw derrière un proxy sensible à l’identité
    - Configuration de Pomerium, Caddy ou nginx avec OAuth devant OpenClaw
    - Correction des erreurs WebSocket 1008 « non autorisé » avec des configurations de proxy inverse
    - Déterminer où définir HSTS et les autres en-têtes de renforcement HTTP
sidebarTitle: Trusted proxy auth
summary: Déléguer l’authentification du Gateway à un proxy inverse de confiance (Pomerium, Caddy, nginx + OAuth)
title: Authentification par proxy de confiance
x-i18n:
    generated_at: "2026-07-12T15:30:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Fonctionnalité sensible sur le plan de la sécurité.** Ce mode délègue entièrement l'authentification à votre proxy inverse. Une configuration incorrecte peut exposer votre Gateway à des accès non autorisés. Lisez attentivement cette page avant de l'activer.
</Warning>

## Quand l'utiliser

- Vous exécutez OpenClaw derrière un **proxy tenant compte de l'identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + authentification transférée).
- Votre proxy gère toute l'authentification et transmet l'identité de l'utilisateur via des en-têtes.
- Vous utilisez un environnement Kubernetes ou de conteneurs dans lequel le proxy constitue le seul chemin vers le Gateway.
- Vous rencontrez des erreurs WebSocket `1008 unauthorized`, car les navigateurs ne peuvent pas transmettre de jetons dans les charges utiles WS.

## Quand NE PAS l'utiliser

- Votre proxy n'authentifie pas les utilisateurs (il sert uniquement de point de terminaison TLS ou d'équilibreur de charge).
- Il existe un chemin vers le Gateway qui contourne le proxy (ouvertures dans le pare-feu, accès au réseau interne).
- Vous ne savez pas si votre proxy supprime ou remplace correctement les en-têtes transférés.
- Vous avez uniquement besoin d'un accès personnel pour un seul utilisateur (envisagez plutôt Tailscale Serve + l'interface de bouclage).

## Fonctionnement

<Steps>
  <Step title="Le proxy authentifie l'utilisateur">
    Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="Le proxy ajoute un en-tête d'identité">
    Le proxy ajoute un en-tête contenant l'identité de l'utilisateur authentifié (par exemple, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Le Gateway vérifie la source approuvée">
    OpenClaw vérifie que la requête provient d'une **adresse IP de proxy approuvée** (`gateway.trustedProxies`) et qu'il ne s'agit pas de l'adresse de bouclage ou d'une adresse d'interface locale du Gateway.
  </Step>
  <Step title="Le Gateway extrait l'identité">
    OpenClaw lit les en-têtes requis, puis l'identité de l'utilisateur dans l'en-tête configuré.
  </Step>
  <Step title="Autorisation">
    Si toutes les vérifications réussissent et que l'utilisateur satisfait à `allowUsers` (lorsque cette option est définie), la requête est autorisée.
  </Step>
</Steps>

## Configuration

```json5
{
  gateway: {
    // Par défaut, l'authentification par proxy approuvé exige que l'adresse IP source du proxy ne soit pas une adresse de bouclage
    bind: "lan",

    // CRITIQUE : ajoutez uniquement ici les adresses IP de votre proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // En-tête contenant l'identité de l'utilisateur authentifié (requis)
        userHeader: "x-forwarded-user",

        // Facultatif : en-têtes qui DOIVENT être présents (vérification du proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Facultatif : limiter l'accès à certains utilisateurs (vide = tous les autoriser)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Facultatif : autoriser un proxy de bouclage sur le même hôte après acceptation explicite
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Règles d'exécution, dans l'ordre d'évaluation**

1. L'adresse IP source de la requête doit correspondre à `gateway.trustedProxies` (avec prise en charge des CIDR), sinon elle est rejetée (`trusted_proxy_untrusted_source`).
2. Les requêtes provenant d'une adresse de bouclage (`127.0.0.1`, `::1`) sont rejetées, sauf si `gateway.auth.trustedProxy.allowLoopback = true` et que l'adresse de bouclage figure également dans `trustedProxies` (`trusted_proxy_loopback_source`). Cette vérification précède celle des en-têtes ; une source de bouclage échoue donc de cette manière même si des en-têtes requis sont également absents.
3. Les sources hors bouclage qui correspondent à l'une des adresses d'interface réseau locale de l'hôte du Gateway sont rejetées afin d'empêcher l'usurpation (`trusted_proxy_local_interface_source`). Si la découverte des interfaces échoue, la requête est également rejetée (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` et `userHeader` doivent être présents et non vides.
5. Si `allowUsers` n'est pas vide, il doit inclure l'utilisateur extrait.

**Les indices fournis par les en-têtes transférés l'emportent sur le caractère local du bouclage pour le mécanisme de secours local direct.** Si une requête arrive sur l'interface de bouclage, mais contient un en-tête `Forwarded`, n'importe quel en-tête `X-Forwarded-*` ou un en-tête `X-Real-IP`, ces indices l'excluent du mécanisme de secours local direct par mot de passe et du contrôle par identité d'appareil, même si l'authentification par proxy approuvé échoue toujours en raison de la source de bouclage.

`allowLoopback` accorde aux processus locaux sur l'hôte du Gateway le même niveau de confiance qu'au proxy inverse. Activez cette option uniquement si le Gateway reste protégé par un pare-feu contre les accès distants directs et si le proxy local supprime ou remplace les en-têtes d'identité fournis par le client.

Les clients internes du Gateway qui ne passent pas par le proxy inverse doivent utiliser `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, et non les en-têtes d'identité de proxy approuvé. Les déploiements de l'interface de contrôle hors bouclage nécessitent toujours une configuration explicite de `gateway.controlUi.allowedOrigins`.
</Warning>

### Référence de configuration

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Tableau d'adresses IP de proxy (ou de CIDR) à approuver. Les requêtes provenant d'autres adresses IP sont rejetées.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Doit être `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nom de l'en-tête contenant l'identité de l'utilisateur authentifié.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  En-têtes supplémentaires qui doivent être présents pour que la requête soit considérée comme fiable.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Liste d'autorisation des identités utilisateur. Une liste vide autorise tous les utilisateurs authentifiés.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Prise en charge facultative des proxys inverses utilisant le bouclage sur le même hôte.
</ParamField>

<Warning>
N'activez `allowLoopback` que lorsque le proxy inverse local constitue la limite de confiance prévue. Tout processus local pouvant se connecter au Gateway peut tenter d'envoyer des en-têtes d'identité de proxy ; maintenez donc l'accès direct au Gateway privé sur l'hôte et exigez des en-têtes contrôlés par le proxy, comme `x-forwarded-proto`, ou un en-tête d'assertion signé si votre proxy le prend en charge.
</Warning>

## Comportement d'association de l'interface de contrôle

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête réussit les vérifications du proxy approuvé, les sessions WebSocket de l'interface de contrôle peuvent se connecter sans identité d'appareil associée.

Conséquences sur les portées :

- Les sessions WebSocket de l'interface de contrôle sans appareil se connectent, mais ne reçoivent par défaut aucune portée d'opérateur. OpenClaw réinitialise la liste des portées demandées à `[]` afin qu'une session non liée à un appareil ou jeton associé et approuvé ne puisse pas se déclarer elle-même des autorisations.
- Si des méthodes échouent avec `missing scope` après une connexion WebSocket réussie, utilisez HTTPS afin que le navigateur puisse générer une identité d'appareil et terminer l'association. Consultez [HTTP non sécurisé de l'interface de contrôle](/fr/web/control-ui#insecure-http).
- Uniquement en cas d'urgence : `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserve les portées demandées même sans identité d'appareil. Il s'agit d'une réduction importante de la sécurité ; annulez-la rapidement. Consultez [HTTP non sécurisé de l'interface de contrôle](/fr/web/control-ui#insecure-http).

Plafonnement des portées par le proxy inverse : si votre proxy envoie `x-openclaw-scopes` dans la requête de mise à niveau WebSocket de l'interface de contrôle, OpenClaw limite les portées de la session à l'intersection des portées demandées et des portées déclarées. Cet en-tête n'accorde aucune portée ; il restreint uniquement celles que la session peut détenir.

Conséquences :

- Dans ce mode, l'association n'est plus le principal contrôle d'accès à l'interface de contrôle.
- La stratégie d'authentification de votre proxy inverse et `allowUsers` deviennent le contrôle d'accès effectif.
- Limitez strictement l'accès entrant au Gateway aux seules adresses IP des proxys approuvés (`gateway.trustedProxies` + pare-feu).

Les clients WebSocket personnalisés ne sont pas des sessions de l'interface de contrôle. `gateway.controlUi.dangerouslyDisableDeviceAuth` n'accorde aucune portée aux clients arbitraires ayant la forme `client.mode: "backend"` ou CLI. Les automatisations personnalisées doivent utiliser l'identité d'appareil et l'association, le chemin d'assistance backend réservé aux connexions locales directes `client.id: "gateway-client"`, ou le [Plugin RPC HTTP d'administration](/fr/plugins/admin-http-rpc) lorsqu'une interface HTTP de requête/réponse est plus appropriée.

## En-tête des portées d'opérateur

L'authentification par proxy approuvé est un mode HTTP **porteur d'identité** ; les appelants peuvent donc éventuellement déclarer des portées d'opérateur avec `x-openclaw-scopes` dans les requêtes d'API HTTP.

Remarque : les portées WebSocket sont déterminées par la négociation du protocole Gateway et la liaison à l'identité de l'appareil. Dans les requêtes de mise à niveau WebSocket de l'interface de contrôle, `x-openclaw-scopes` ne fait que plafonner les portées négociées de la session, sans en accorder. Consultez [Comportement d'association de l'interface de contrôle](#control-ui-pairing-behavior).

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l'en-tête est présent, OpenClaw respecte l'ensemble de portées déclaré.
- Lorsque l'en-tête est présent, mais vide, la requête ne déclare **aucune** portée d'opérateur.
- Lorsque l'en-tête est absent, les API HTTP ordinaires porteuses d'identité utilisent l'ensemble standard de portées d'opérateur par défaut (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Les **routes HTTP de Plugin** authentifiées par le Gateway sont plus restreintes par défaut : lorsque `x-openclaw-scopes` est absent, leur portée d'exécution se limite à `operator.write`.
- Les requêtes HTTP provenant d'un navigateur doivent toujours satisfaire à `gateway.controlUi.allowedOrigins` (ou utiliser délibérément le mode de secours fondé sur l'en-tête Host), même après la réussite de l'authentification par proxy approuvé.

Règle pratique : envoyez explicitement `x-openclaw-scopes` lorsque vous souhaitez qu'une requête via un proxy approuvé dispose de portées plus restreintes que celles par défaut, ou lorsqu'une route de Plugin authentifiée par le Gateway nécessite une portée plus élevée que la portée d'écriture.

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez-y HSTS.

<Tabs>
  <Tab title="Terminaison TLS par le proxy (recommandée)">
    Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez `Strict-Transport-Security` sur le proxy pour ce domaine.

    - Convient aux déploiements accessibles depuis Internet.
    - Centralise le certificat et la stratégie de renforcement HTTP.
    - OpenClaw peut continuer à utiliser HTTP sur l'interface de bouclage derrière le proxy.

    Exemple de valeur d'en-tête :

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminaison TLS par le Gateway">
    Si OpenClaw sert directement HTTPS (sans proxy assurant la terminaison TLS), définissez :

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` accepte une valeur d'en-tête sous forme de chaîne, ou `false` pour la désactiver explicitement.

  </Tab>
</Tabs>

### Recommandations de déploiement

- Commencez par une durée maximale courte (par exemple `max-age=300`) pendant la validation du trafic.
- Ne passez à des valeurs de longue durée (par exemple `max-age=31536000`) qu'une fois le niveau de confiance élevé.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- N'utilisez le préchargement que si vous respectez délibérément ses exigences pour l'ensemble complet de vos domaines.
- Le développement local limité à l'interface de bouclage ne bénéficie pas de HSTS.

## Exemples de configuration de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium transmet l'identité dans `x-pomerium-claim-email` (ou d'autres en-têtes de revendication) et un JWT dans `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Adresse IP de Pomerium
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Extrait de configuration Pomerium :

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy avec OAuth">
    Caddy avec le Plugin `caddy-security` peut authentifier les utilisateurs et transmettre des en-têtes d'identité.

    ```json5
    {
      gateway: {
        bind: "lan",
    ```
    ```json5
        trustedProxies: ["10.0.0.1"], // Adresse IP du proxy Caddy/sidecar
    ```
    ```json5
        auth: {
    ```
    ```json5
          mode: "trusted-proxy",
    ```
    ```json5
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
    Extrait de Caddyfile :

    ```caddy
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy authentifie les utilisateurs et transmet leur identité dans `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP de nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Extrait de configuration nginx :

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik avec authentification transférée">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Adresse IP du conteneur Traefik
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Configuration mixte avec jeton

Le démarrage du Gateway rejette l’authentification par proxy de confiance si un jeton partagé est également configuré (`gateway.auth.token` ou `OPENCLAW_GATEWAY_TOKEN`). Les deux sont mutuellement exclusifs, car un jeton partagé permettrait aux appelants du même hôte de s’authentifier par un chemin complètement différent de l’identité vérifiée par le proxy que ce mode est destiné à imposer.

Si le démarrage échoue avec une erreur telle que `gateway auth mode is trusted-proxy, but a shared token is also configured` :

- Supprimez le jeton partagé lorsque vous utilisez le mode proxy de confiance, ou
- Définissez `gateway.auth.mode` sur `"token"` si vous souhaitez utiliser une authentification par jeton.

Les en-têtes d’identité du proxy de confiance sur l’interface de bouclage continuent d’échouer de manière sécurisée : les appelants du même hôte ne sont pas silencieusement authentifiés en tant qu’utilisateurs du proxy. Les appelants internes d’OpenClaw qui contournent le proxy peuvent s’authentifier avec `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` à la place. Le repli sur un jeton reste intentionnellement non pris en charge en mode proxy de confiance.

  ## Liste de vérification de sécurité

  Avant d’activer l’authentification par proxy de confiance, vérifiez les points suivants :

  - [ ] **Le proxy est le seul chemin d’accès** : le port du Gateway est protégé par un pare-feu qui n’autorise que votre proxy.
  - [ ] **trustedProxies est minimal** : uniquement les adresses IP réelles de vos proxys, et non des sous-réseaux entiers.
  - [ ] **La source de proxy en boucle locale est intentionnelle** : l’authentification par proxy de confiance refuse par défaut les requêtes provenant de la boucle locale, sauf si `gateway.auth.trustedProxy.allowLoopback` est explicitement activé pour un proxy sur le même hôte.
  - [ ] **Le proxy supprime les en-têtes** : votre proxy remplace (sans les ajouter à la suite) les en-têtes `x-forwarded-*` provenant des clients.
  - [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS.
  - [ ] **allowedOrigins est explicite** : l’interface de contrôle hors boucle locale utilise une valeur `gateway.controlUi.allowedOrigins` explicite.
  - [ ] **allowUsers est défini** (recommandé) : limitez l’accès aux utilisateurs connus plutôt que d’autoriser toute personne authentifiée.
  - [ ] **Aucune configuration mixte de jetons** : ne définissez pas à la fois `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`.
  - [ ] **Le mécanisme de secours par mot de passe local reste privé** : si vous configurez `gateway.auth.password` pour les appelants internes directs, protégez le port du Gateway par un pare-feu afin que les clients distants ne passant pas par le proxy ne puissent pas y accéder directement.

  ## Audit de sécurité

  `openclaw security audit` signale l’authentification par proxy de confiance avec un constat de gravité **critique**. C’est intentionnel : cela vous rappelle que vous déléguez la sécurité à la configuration de votre proxy.

  L’audit vérifie les éléments suivants :

  - Avertissement ou rappel critique de base `gateway.trusted_proxy_auth`.
  - Configuration `trustedProxies` manquante.
  - Configuration `userHeader` manquante.
  - `allowUsers` vide (autorise tout utilisateur authentifié).
  - `allowLoopback` activé pour les sources de proxy sur le même hôte.

  Des constats distincts, non spécifiques au proxy de confiance, s’appliquent également chaque fois que l’interface de contrôle est exposée : valeur générique ou absence de `gateway.controlUi.allowedOrigins`, et mécanisme de secours fondé sur l’origine de l’en-tête Host.

  ## Résolution des problèmes

  <AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La requête ne provenait pas d’une adresse IP figurant dans `gateway.trustedProxies`. Vérifiez les points suivants :

    - L’adresse IP du proxy est-elle correcte ? (Les adresses IP des conteneurs Docker peuvent changer.)
    - Un équilibreur de charge se trouve-t-il devant votre proxy ?
    - Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les adresses IP réelles.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw a rejeté une requête de proxy de confiance provenant de la boucle locale.

    Vérifiez les points suivants :

    - Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
    - Essayez-vous d’utiliser l’authentification par proxy de confiance avec un proxy inverse en boucle locale sur le même hôte ?

    Correctif :

    - Privilégiez l’authentification par jeton/mot de passe pour les clients internes sur le même hôte qui ne passent pas par le proxy, ou
    - Acheminez le trafic via une adresse de proxy de confiance hors boucle locale et conservez cette adresse IP dans `gateway.trustedProxies`, ou
    - Pour un proxy inverse volontairement installé sur le même hôte, définissez `gateway.auth.trustedProxy.allowLoopback = true`, conservez l’adresse de boucle locale dans `gateway.trustedProxies` et assurez-vous que le proxy supprime ou remplace les en-têtes d’identité.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    L’adresse IP source de la requête correspondait à l’une des adresses des interfaces réseau hors boucle locale de l’hôte du Gateway (et non à celle du proxy) ; cette protection empêche l’usurpation de trafic provenant du même hôte sur les tailnets ou les réseaux de pont Docker. `..._check_failed` signifie que la détection des interfaces elle-même a échoué ; OpenClaw adopte donc un comportement de refus sécurisé.

    Vérifications :

    - Un processus sur l’hôte du Gateway envoie-t-il directement des en-têtes d’identité en contournant le proxy ?
    - Le proxy s’exécute-t-il dans le même espace de noms réseau que le Gateway, avec une adresse IP qui apparaît également comme interface locale ?

    Correctif : acheminez le trafic du proxy via une adresse qui n’est pas également liée localement par l’hôte du Gateway, ou utilisez `allowLoopback` uniquement pour une véritable configuration de proxy sur le même hôte.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L’en-tête utilisateur était vide ou absent. Vérifications :

    - Votre proxy est-il configuré pour transmettre les en-têtes d’identité ?
    - Le nom de l’en-tête est-il correct ? (la casse est ignorée, mais l’orthographe est importante)
    - L’utilisateur est-il réellement authentifié auprès du proxy ?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un en-tête requis était absent. Vérifications :

    - Vérifiez la configuration de votre proxy pour ces en-têtes précis.
    - Vérifiez si des en-têtes sont supprimés quelque part dans la chaîne.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L’utilisateur est authentifié, mais ne figure pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d’autorisation.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` vaut `"trusted-proxy"`, mais `gateway.trustedProxies` est vide, ou `gateway.auth.trustedProxy` lui-même est absent. Toutes les requêtes sont rejetées tant que ces deux éléments ne sont pas définis.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L’authentification par proxy de confiance a réussi, mais l’en-tête `Origin` du navigateur n’a pas satisfait aux contrôles d’origine de l’interface de contrôle.

    Vérifications :

    - `gateway.controlUi.allowedOrigins` inclut l’origine exacte du navigateur.
    - Vous ne vous appuyez pas sur des origines génériques, sauf si vous souhaitez délibérément tout autoriser.
    - Si vous utilisez délibérément le mode de repli sur l’en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini intentionnellement.

  </Accordion>
  <Accordion title="La connexion réussit, mais les méthodes signalent une portée manquante">
    La connexion WebSocket est établie, mais `chat.history`, `sessions.list` ou
    `models.list` échoue avec `missing scope: operator.read`.

    Causes courantes :

    - Session de l’interface de contrôle sans appareil : l’authentification par proxy de confiance peut autoriser la connexion WebSocket sans identité d’appareil, mais OpenClaw supprime volontairement les portées des sessions sans appareil.
    - Client principal personnalisé : `gateway.controlUi.dangerouslyDisableDeviceAuth` est limité à l’interface de contrôle et n’accorde aucune portée aux clients WebSocket arbitraires de type principal ou CLI.
    - `x-openclaw-scopes` trop restrictif : si votre proxy injecte cet en-tête dans la requête de mise à niveau WebSocket de l’interface de contrôle, les portées de la session sont limitées à cet ensemble. Une valeur d’en-tête vide ne produit aucune portée.

    Correctif :

    - Pour l’interface de contrôle, utilisez HTTPS afin que le navigateur puisse générer une identité d’appareil et terminer l’association.
    - Pour une automatisation personnalisée, utilisez une identité d’appareil et l’association, le chemin d’assistance principal direct local réservé `gateway-client`, ou le [RPC HTTP d’administration](/fr/plugins/admin-http-rpc).
    - Utilisez `gateway.controlUi.dangerouslyDisableDeviceAuth: true` uniquement comme solution temporaire d’urgence pour l’interface de contrôle.

  </Accordion>
  <Accordion title="WebSocket échoue toujours">
    Assurez-vous que votre proxy :

    - Prend en charge les mises à niveau WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Transmet les en-têtes d’identité lors des requêtes de mise à niveau WebSocket (et pas uniquement via HTTP).
    - Ne dispose pas d’un chemin d’authentification distinct pour les connexions WebSocket.

  </Accordion>
</AccordionGroup>

## Migration depuis l’authentification par jeton

<Steps>
  <Step title="Configurer le proxy">
    Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes.
  </Step>
  <Step title="Tester le proxy indépendamment">
    Testez indépendamment la configuration du proxy (curl avec des en-têtes).
  </Step>
  <Step title="Mettre à jour la configuration d’OpenClaw">
    Mettez à jour la configuration d’OpenClaw avec l’authentification par proxy de confiance.
  </Step>
  <Step title="Redémarrer le Gateway">
    Redémarrez le Gateway.
  </Step>
  <Step title="Tester WebSocket">
    Testez les connexions WebSocket depuis l’interface de contrôle.
  </Step>
  <Step title="Effectuer un audit">
    Exécutez `openclaw security audit` et examinez les résultats.
  </Step>
</Steps>

## Rubriques connexes

- [Configuration](/fr/gateway/configuration) — référence de configuration
- [Portées de l’opérateur](/fr/gateway/operator-scopes) — rôles, portées et contrôles d’approbation
- [Accès à distance](/fr/gateway/remote) — autres modèles d’accès à distance
- [Sécurité](/fr/gateway/security) — guide de sécurité complet
- [Tailscale](/fr/gateway/tailscale) — solution plus simple pour un accès limité au tailnet
