---
read_when:
    - Exécuter OpenClaw derrière un proxy sensible à l’identité
    - Configuration de Pomerium, Caddy ou nginx avec OAuth en amont d’OpenClaw
    - Correction des erreurs WebSocket 1008 « non autorisé » avec des configurations de proxy inverse
    - Déterminer où configurer HSTS et les autres en-têtes de sécurisation HTTP
sidebarTitle: Trusted proxy auth
summary: Déléguer l’authentification du Gateway à un proxy inverse de confiance (Pomerium, Caddy, nginx + OAuth)
title: Authentification par proxy de confiance
x-i18n:
    generated_at: "2026-07-12T02:41:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Fonctionnalité sensible sur le plan de la sécurité.** Ce mode délègue entièrement l’authentification à votre proxy inverse. Une mauvaise configuration peut exposer votre Gateway à des accès non autorisés. Lisez attentivement cette page avant de l’activer.
</Warning>

## Quand l’utiliser

- Vous exécutez OpenClaw derrière un **proxy tenant compte de l’identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + authentification transférée).
- Votre proxy gère toute l’authentification et transmet l’identité de l’utilisateur au moyen d’en-têtes.
- Vous utilisez un environnement Kubernetes ou de conteneurs dans lequel le proxy constitue le seul chemin vers le Gateway.
- Vous rencontrez des erreurs WebSocket `1008 unauthorized`, car les navigateurs ne peuvent pas transmettre de jetons dans les charges utiles WS.

## Quand NE PAS l’utiliser

- Votre proxy n’authentifie pas les utilisateurs (il sert uniquement de terminaison TLS ou d’équilibreur de charge).
- Il existe un chemin vers le Gateway qui contourne le proxy (ouvertures dans le pare-feu, accès au réseau interne).
- Vous ne savez pas si votre proxy supprime ou remplace correctement les en-têtes transférés.
- Vous avez uniquement besoin d’un accès personnel pour un seul utilisateur (envisagez plutôt Tailscale Serve + local loopback).

## Fonctionnement

<Steps>
  <Step title="Le proxy authentifie l’utilisateur">
    Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="Le proxy ajoute un en-tête d’identité">
    Le proxy ajoute un en-tête contenant l’identité de l’utilisateur authentifié (par exemple, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Le Gateway vérifie la source approuvée">
    OpenClaw vérifie que la requête provient d’une **adresse IP de proxy approuvée** (`gateway.trustedProxies`) et non de l’adresse local loopback ou de l’adresse d’une interface locale du Gateway.
  </Step>
  <Step title="Le Gateway extrait l’identité">
    OpenClaw lit les en-têtes requis, puis l’identité de l’utilisateur dans l’en-tête configuré.
  </Step>
  <Step title="Autorisation">
    Si toutes les vérifications réussissent et que l’utilisateur respecte `allowUsers` (lorsque cette option est définie), la requête est autorisée.
  </Step>
</Steps>

## Configuration

```json5
{
  gateway: {
    // L’authentification par proxy approuvé exige par défaut que l’adresse IP source du proxy ne soit pas une adresse de bouclage
    bind: "lan",

    // CRITIQUE : ajoutez uniquement ici les adresses IP de votre proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // En-tête contenant l’identité de l’utilisateur authentifié (obligatoire)
        userHeader: "x-forwarded-user",

        // Facultatif : en-têtes qui DOIVENT être présents (vérification du proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Facultatif : limiter l’accès à certains utilisateurs (vide = tous les autoriser)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Facultatif : autoriser un proxy local loopback sur le même hôte après une activation explicite
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Règles d’exécution, dans l’ordre d’évaluation**

1. L’adresse IP source de la requête doit correspondre à `gateway.trustedProxies` (avec prise en charge des CIDR), sinon elle est rejetée (`trusted_proxy_untrusted_source`).
2. Les requêtes provenant d’une adresse de bouclage (`127.0.0.1`, `::1`) sont rejetées, sauf si `gateway.auth.trustedProxy.allowLoopback = true` et que l’adresse de bouclage figure également dans `trustedProxies` (`trusted_proxy_loopback_source`). Cette vérification précède celle des en-têtes ; une source de bouclage échoue donc de cette manière même si des en-têtes requis sont également absents.
3. Les sources hors bouclage qui correspondent à l’une des adresses des interfaces réseau locales de l’hôte du Gateway sont rejetées afin d’empêcher l’usurpation (`trusted_proxy_local_interface_source`). Si la découverte des interfaces elle-même échoue, la requête est également rejetée (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` et `userHeader` doivent être présents et non vides.
5. Si `allowUsers` n’est pas vide, il doit contenir l’utilisateur extrait.

**La présence d’en-têtes transférés prévaut sur le caractère local du bouclage pour le repli local direct.** Si une requête arrive par bouclage, mais contient un en-tête `Forwarded`, un en-tête `X-Forwarded-*` quelconque ou un en-tête `X-Real-IP`, cet élément l’exclut du repli local direct par mot de passe et du contrôle par identité de l’appareil, même si l’authentification par proxy approuvé échoue toujours en raison de la source de bouclage.

`allowLoopback` accorde aux processus locaux sur l’hôte du Gateway le même niveau de confiance qu’au proxy inverse. Activez cette option uniquement si le Gateway reste protégé par un pare-feu contre les accès distants directs et si le proxy local supprime ou remplace les en-têtes d’identité fournis par le client.

Les clients internes du Gateway qui ne passent pas par le proxy inverse doivent utiliser `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, et non les en-têtes d’identité du proxy approuvé. Les déploiements de l’interface de contrôle hors bouclage nécessitent toujours une configuration explicite de `gateway.controlUi.allowedOrigins`.
</Warning>

### Référence de configuration

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Tableau d’adresses IP de proxy (ou de CIDR) à approuver. Les requêtes provenant d’autres adresses IP sont rejetées.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Doit être `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nom de l’en-tête contenant l’identité de l’utilisateur authentifié.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  En-têtes supplémentaires qui doivent être présents pour que la requête soit considérée comme fiable.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Liste d’autorisation des identités utilisateur. Une liste vide autorise tous les utilisateurs authentifiés.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Prise en charge facultative des proxys inverses local loopback sur le même hôte.
</ParamField>

<Warning>
Activez `allowLoopback` uniquement lorsque le proxy inverse local constitue la limite de confiance prévue. Tout processus local capable de se connecter au Gateway peut tenter d’envoyer des en-têtes d’identité de proxy ; limitez donc l’accès direct au Gateway à l’hôte et exigez des en-têtes contrôlés par le proxy, tels que `x-forwarded-proto`, ou un en-tête d’assertion signé si votre proxy en prend un en charge.
</Warning>

## Comportement d’association de l’interface de contrôle

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête réussit les vérifications du proxy approuvé, les sessions WebSocket de l’interface de contrôle peuvent se connecter sans identité d’association d’appareil.

Conséquences sur les portées :

- Les sessions WebSocket de l’interface de contrôle sans appareil se connectent, mais ne reçoivent par défaut aucune portée d’opérateur. OpenClaw vide la liste des portées demandées en la définissant sur `[]`, afin qu’une session non liée à un appareil ou jeton associé et approuvé ne puisse pas déclarer elle-même des autorisations.
- Si des méthodes échouent avec `missing scope` après une connexion WebSocket réussie, utilisez HTTPS afin que le navigateur puisse générer une identité d’appareil et terminer l’association. Consultez [HTTP non sécurisé de l’interface de contrôle](/fr/web/control-ui#insecure-http).
- Uniquement en cas d’urgence : `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserve les portées demandées même sans identité d’appareil. Cela réduit fortement la sécurité ; annulez rapidement ce réglage. Consultez [HTTP non sécurisé de l’interface de contrôle](/fr/web/control-ui#insecure-http).

Limitation des portées par le proxy inverse : si votre proxy envoie `x-openclaw-scopes` dans la requête de mise à niveau WebSocket de l’interface de contrôle, OpenClaw limite les portées de la session à l’intersection des portées demandées et des portées déclarées. Cet en-tête n’accorde aucune portée ; il réduit uniquement celles que la session peut détenir.

Conséquences :

- L’association n’est plus le principal mécanisme de contrôle de l’accès à l’interface de contrôle dans ce mode.
- La politique d’authentification de votre proxy inverse et `allowUsers` deviennent le contrôle d’accès effectif.
- Limitez strictement l’entrée du Gateway aux seules adresses IP de proxy approuvées (`gateway.trustedProxies` + pare-feu).

Les clients WebSocket personnalisés ne sont pas des sessions de l’interface de contrôle. `gateway.controlUi.dangerouslyDisableDeviceAuth` n’accorde aucune portée aux clients arbitraires ayant la forme `client.mode: "backend"` ou CLI. Les automatisations personnalisées doivent utiliser l’identité et l’association d’appareil, le chemin d’assistance backend local direct réservé `client.id: "gateway-client"` ou le [Plugin RPC HTTP d’administration](/fr/plugins/admin-http-rpc) lorsqu’une interface de requête-réponse HTTP convient mieux.

## En-tête des portées d’opérateur

L’authentification par proxy approuvé est un mode HTTP **porteur d’identité** ; les appelants peuvent donc éventuellement déclarer des portées d’opérateur avec `x-openclaw-scopes` dans les requêtes d’API HTTP.

Remarque : les portées WebSocket sont déterminées par l’établissement de liaison du protocole Gateway et la liaison à l’identité de l’appareil. Dans les requêtes de mise à niveau WebSocket de l’interface de contrôle, `x-openclaw-scopes` ne fait que limiter les portées négociées de la session ; il ne les accorde pas. Consultez [Comportement d’association de l’interface de contrôle](#control-ui-pairing-behavior).

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l’en-tête est présent, OpenClaw respecte l’ensemble des portées déclarées.
- Lorsque l’en-tête est présent, mais vide, la requête ne déclare **aucune** portée d’opérateur.
- Lorsque l’en-tête est absent, les API HTTP ordinaires porteuses d’identité utilisent par repli l’ensemble standard de portées d’opérateur par défaut (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Les **routes HTTP de Plugin** authentifiées par le Gateway sont plus restrictives par défaut : lorsque `x-openclaw-scopes` est absent, leur portée d’exécution se limite par repli à `operator.write`.
- Les requêtes HTTP provenant d’un navigateur doivent toujours respecter `gateway.controlUi.allowedOrigins` (ou le mode de repli délibéré basé sur l’en-tête Host), même après la réussite de l’authentification par proxy approuvé.

Règle pratique : envoyez explicitement `x-openclaw-scopes` lorsque vous souhaitez qu’une requête par proxy approuvé soit plus restrictive que les valeurs par défaut, ou lorsqu’une route de Plugin authentifiée par le Gateway nécessite une portée supérieure à celle d’écriture.

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez-y HSTS.

<Tabs>
  <Tab title="Terminaison TLS par le proxy (recommandée)">
    Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez `Strict-Transport-Security` sur le proxy pour ce domaine.

    - Convient bien aux déploiements exposés à Internet.
    - Regroupe la politique de certificat et de renforcement HTTP au même endroit.
    - OpenClaw peut rester en HTTP sur local loopback derrière le proxy.

    Exemple de valeur d’en-tête :

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminaison TLS par le Gateway">
    Si OpenClaw fournit lui-même directement HTTPS (sans proxy assurant la terminaison TLS), définissez :

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

    `strictTransportSecurity` accepte une chaîne comme valeur d’en-tête, ou `false` pour le désactiver explicitement.

  </Tab>
</Tabs>

### Conseils de déploiement

- Commencez par une durée maximale courte (par exemple `max-age=300`) pendant la validation du trafic.
- Passez à des valeurs de longue durée (par exemple `max-age=31536000`) uniquement lorsque votre niveau de confiance est élevé.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- Utilisez le préchargement uniquement si vous respectez volontairement ses exigences pour l’ensemble de vos domaines.
- Le développement local limité à local loopback ne bénéficie pas de HSTS.

## Exemples de configuration de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium transmet l’identité dans `x-pomerium-claim-email` (ou dans d’autres en-têtes de revendication) et un JWT dans `x-pomerium-jwt-assertion`.

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
    Caddy avec le Plugin `caddy-security` peut authentifier les utilisateurs et transmettre les en-têtes d’identité.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Adresse IP du proxy Caddy/sidecar
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Extrait du Caddyfile :

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
        trustedProxies: ["10.0.0.1"], // Adresse IP de nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Extrait de la configuration nginx :

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

Le démarrage du Gateway refuse l'authentification par proxy de confiance si un jeton partagé est également configuré (`gateway.auth.token` ou `OPENCLAW_GATEWAY_TOKEN`). Ces deux méthodes s'excluent mutuellement, car un jeton partagé permettrait aux appelants du même hôte de s'authentifier par une voie totalement différente de l'identité vérifiée par le proxy que ce mode est censé imposer.

Si le démarrage échoue avec une erreur telle que `gateway auth mode is trusted-proxy, but a shared token is also configured` :

- Supprimez le jeton partagé lorsque vous utilisez le mode proxy de confiance, ou
- Définissez `gateway.auth.mode` sur `"token"` si vous souhaitez une authentification par jeton.

Les en-têtes d'identité du proxy de confiance provenant de l'interface de bouclage continuent d'être refusés par défaut : les appelants du même hôte ne sont pas silencieusement authentifiés comme utilisateurs du proxy. Les appelants internes d'OpenClaw qui contournent le proxy peuvent s'authentifier avec `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` à la place. Le recours de secours à un jeton reste intentionnellement non pris en charge en mode proxy de confiance.

## Liste de contrôle de sécurité

Avant d'activer l'authentification par proxy de confiance, vérifiez les points suivants :

- [ ] **Le proxy est le seul chemin d'accès** : le port du Gateway est protégé par un pare-feu contre tout accès autre que celui de votre proxy.
- [ ] **trustedProxies est minimal** : uniquement les adresses IP réelles de vos proxys, et non des sous-réseaux entiers.
- [ ] **La source du proxy sur l'interface de bouclage est intentionnelle** : l'authentification par proxy de confiance refuse par défaut les requêtes provenant de l'interface de bouclage, sauf si `gateway.auth.trustedProxy.allowLoopback` est explicitement activé pour un proxy situé sur le même hôte.
- [ ] **Le proxy supprime les en-têtes** : votre proxy remplace, sans les compléter, les en-têtes `x-forwarded-*` provenant des clients.
- [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS.
- [ ] **allowedOrigins est explicite** : l'interface de contrôle utilisée hors de l'interface de bouclage emploie une valeur explicite pour `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers est défini** (recommandé) : limitez l'accès aux utilisateurs connus plutôt que de l'autoriser à toute personne authentifiée.
- [ ] **Aucune configuration mixte avec jeton** : ne définissez pas simultanément `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Le mot de passe local de secours reste privé** : si vous configurez `gateway.auth.password` pour des appelants internes directs, protégez le port du Gateway par un pare-feu afin que les clients distants ne passant pas par le proxy ne puissent pas y accéder directement.

## Audit de sécurité

`openclaw security audit` signale l'authentification par proxy de confiance avec un constat de gravité **critique**. Ce comportement est intentionnel ; il rappelle que vous déléguez la sécurité à la configuration de votre proxy.

L'audit vérifie les éléments suivants :

- Avertissement ou rappel critique de base `gateway.trusted_proxy_auth`.
- Configuration `trustedProxies` manquante.
- Configuration `userHeader` manquante.
- `allowUsers` vide, ce qui autorise tout utilisateur authentifié.
- `allowLoopback` activé pour les sources de proxy situées sur le même hôte.

Des constats distincts, qui ne sont pas propres au proxy de confiance, s'appliquent également chaque fois que l'interface de contrôle est exposée : valeur générique ou absence de `gateway.controlUi.allowedOrigins`, ainsi que recours à l'origine fondée sur l'en-tête Host.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La requête ne provenait pas d'une adresse IP figurant dans `gateway.trustedProxies`. Vérifiez les points suivants :

    - L'adresse IP du proxy est-elle correcte ? Les adresses IP des conteneurs Docker peuvent changer.
    - Un équilibreur de charge se trouve-t-il devant votre proxy ?
    - Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les adresses IP réelles.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw a refusé une requête de proxy de confiance provenant de l'interface de bouclage.

    Vérifiez les points suivants :

    - Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
    - Essayez-vous d'utiliser l'authentification par proxy de confiance avec un proxy inverse sur l'interface de bouclage du même hôte ?

    Solution :

    - Privilégiez l'authentification par jeton ou mot de passe pour les clients internes du même hôte qui ne passent pas par le proxy, ou
    - Faites transiter la requête par une adresse de proxy de confiance qui n'est pas une adresse de bouclage et conservez cette adresse IP dans `gateway.trustedProxies`, ou
    - Pour un proxy inverse intentionnellement situé sur le même hôte, définissez `gateway.auth.trustedProxy.allowLoopback = true`, conservez l'adresse de bouclage dans `gateway.trustedProxies` et assurez-vous que le proxy supprime ou remplace les en-têtes d'identité.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    L'adresse IP source de la requête correspondait à l'une des adresses d'interface réseau de l'hôte du Gateway qui n'est pas une adresse de bouclage, et non à celle du proxy. Cette protection empêche l'usurpation de trafic provenant du même hôte sur les réseaux privés Tailscale ou les réseaux de pont Docker. `..._check_failed` signifie que la détection des interfaces elle-même a échoué ; OpenClaw refuse donc la requête par défaut.

    Vérifiez les points suivants :

    - Un processus exécuté directement sur l'hôte du Gateway envoie-t-il des en-têtes d'identité en contournant le proxy ?
    - Le proxy s'exécute-t-il dans le même espace de noms réseau que le Gateway, avec une adresse IP qui apparaît également comme interface locale ?

    Solution : faites transiter le trafic du proxy par une adresse qui n'est pas également liée localement par l'hôte du Gateway, ou utilisez `allowLoopback` uniquement pour une véritable configuration de proxy sur le même hôte.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L'en-tête utilisateur était vide ou absent. Vérifiez les points suivants :

    - Votre proxy est-il configuré pour transmettre les en-têtes d'identité ?
    - Le nom de l'en-tête est-il correct ? La casse est indifférente, mais l'orthographe compte.
    - L'utilisateur est-il réellement authentifié auprès du proxy ?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un en-tête obligatoire était absent. Vérifiez les points suivants :

    - La configuration de votre proxy pour ces en-têtes précis.
    - Si les en-têtes sont supprimés quelque part dans la chaîne.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L'utilisateur est authentifié, mais ne figure pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d'autorisation.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` vaut `"trusted-proxy"`, mais `gateway.trustedProxies` est vide ou `gateway.auth.trustedProxy` lui-même est absent. Toutes les requêtes sont refusées jusqu'à ce que les deux soient définis.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L'authentification par proxy de confiance a réussi, mais l'en-tête `Origin` du navigateur n'a pas satisfait aux contrôles d'origine de l'interface de contrôle.

    Vérifiez les points suivants :

    - `gateway.controlUi.allowedOrigins` inclut l'origine exacte du navigateur.
    - Vous ne vous appuyez pas sur des origines génériques, sauf si vous souhaitez intentionnellement tout autoriser.
    - Si vous utilisez intentionnellement le mode de recours fondé sur l'en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini délibérément.

  </Accordion>
  <Accordion title="La connexion réussit, mais les méthodes signalent une portée manquante">
    La connexion WebSocket est établie, mais `chat.history`, `sessions.list` ou
    `models.list` échoue avec `missing scope: operator.read`.

    Causes courantes :

    - Session de l'interface de contrôle sans appareil : l'authentification par proxy de confiance peut autoriser la connexion WebSocket sans identité d'appareil, mais OpenClaw efface par conception les portées des sessions sans appareil.
    - Client de serveur personnalisé : `gateway.controlUi.dangerouslyDisableDeviceAuth` est limité à l'interface de contrôle et n'accorde aucune portée aux clients WebSocket arbitraires de type serveur ou CLI.
    - `x-openclaw-scopes` trop restrictif : si votre proxy injecte cet en-tête dans la requête de mise à niveau WebSocket de l'interface de contrôle, les portées de la session sont limitées à cet ensemble. Une valeur d'en-tête vide n'accorde aucune portée.

    Solution :

    - Pour l'interface de contrôle, utilisez HTTPS afin que le navigateur puisse générer une identité d'appareil et effectuer l'association.
    - Pour une automatisation personnalisée, utilisez une identité d'appareil et l'association, le chemin d'assistance serveur `gateway-client` réservé aux connexions locales directes, ou le [RPC HTTP d'administration](/fr/plugins/admin-http-rpc).
    - Utilisez `gateway.controlUi.dangerouslyDisableDeviceAuth: true` uniquement comme solution temporaire d'urgence pour l'interface de contrôle.

  </Accordion>
  <Accordion title="WebSocket échoue toujours">
    Assurez-vous que votre proxy :

    - Prend en charge les mises à niveau WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Transmet les en-têtes d'identité lors des requêtes de mise à niveau WebSocket, et pas uniquement pour HTTP.
    - Ne dispose pas d'un chemin d'authentification distinct pour les connexions WebSocket.

  </Accordion>
</AccordionGroup>

## Migration depuis l'authentification par jeton

<Steps>
  <Step title="Configurer le proxy">
    Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes.
  </Step>
  <Step title="Tester le proxy indépendamment">
    Testez indépendamment la configuration du proxy avec curl et des en-têtes.
  </Step>
  <Step title="Mettre à jour la configuration d'OpenClaw">
    Mettez à jour la configuration d'OpenClaw avec l'authentification par proxy de confiance.
  </Step>
  <Step title="Redémarrer le Gateway">
    Redémarrez le Gateway.
  </Step>
  <Step title="Tester WebSocket">
    Testez les connexions WebSocket depuis l'interface de contrôle.
  </Step>
  <Step title="Effectuer l'audit">
    Exécutez `openclaw security audit` et examinez les constats.
  </Step>
</Steps>

## Pages connexes

- [Configuration](/fr/gateway/configuration) — référence de configuration
- [Portées de l'opérateur](/fr/gateway/operator-scopes) — rôles, portées et contrôles d'approbation
- [Accès distant](/fr/gateway/remote) — autres modèles d'accès distant
- [Sécurité](/fr/gateway/security) — guide de sécurité complet
- [Tailscale](/fr/gateway/tailscale) — solution plus simple pour un accès limité au réseau privé Tailscale
