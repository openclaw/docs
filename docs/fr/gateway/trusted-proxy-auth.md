---
read_when:
    - Exécuter OpenClaw derrière un proxy sensible à l’identité
    - Configuration de Pomerium, Caddy ou nginx avec OAuth devant OpenClaw
    - Correction des erreurs WebSocket 1008 non autorisées avec les configurations de proxy inverse
    - Décider où définir HSTS et les autres en-têtes de durcissement HTTP
sidebarTitle: Trusted proxy auth
summary: Déléguer l’authentification du Gateway à un proxy inverse de confiance (Pomerium, Caddy, nginx + OAuth)
title: Authentification par proxy de confiance
x-i18n:
    generated_at: "2026-06-27T17:34:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Fonctionnalité sensible pour la sécurité.** Ce mode délègue entièrement l’authentification à votre proxy inverse. Une mauvaise configuration peut exposer votre Gateway à des accès non autorisés. Lisez attentivement cette page avant de l’activer.
</Warning>

## Quand l’utiliser

Utilisez le mode d’authentification `trusted-proxy` lorsque :

- Vous exécutez OpenClaw derrière un **proxy sensible à l’identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + authentification transférée).
- Votre proxy gère toute l’authentification et transmet l’identité utilisateur via des en-têtes.
- Vous êtes dans un environnement Kubernetes ou conteneurisé où le proxy est le seul chemin vers le Gateway.
- Vous rencontrez des erreurs WebSocket `1008 unauthorized` parce que les navigateurs ne peuvent pas transmettre de jetons dans les charges utiles WS.

## Quand NE PAS l’utiliser

- Si votre proxy n’authentifie pas les utilisateurs (simple terminaison TLS ou équilibreur de charge).
- S’il existe un chemin vers le Gateway qui contourne le proxy (ouvertures de pare-feu, accès au réseau interne).
- Si vous n’êtes pas sûr que votre proxy supprime/remplace correctement les en-têtes transférés.
- Si vous avez seulement besoin d’un accès personnel pour un seul utilisateur (envisagez Tailscale Serve + loopback pour une configuration plus simple).

## Fonctionnement

<Steps>
  <Step title="Le proxy authentifie l’utilisateur">
    Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="Le proxy ajoute un en-tête d’identité">
    Le proxy ajoute un en-tête contenant l’identité de l’utilisateur authentifié (par exemple, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Le Gateway vérifie la source de confiance">
    OpenClaw vérifie que la requête provient d’une **IP de proxy de confiance** (configurée dans `gateway.trustedProxies`).
  </Step>
  <Step title="Le Gateway extrait l’identité">
    OpenClaw extrait l’identité utilisateur depuis l’en-tête configuré.
  </Step>
  <Step title="Autoriser">
    Si toutes les vérifications réussissent, la requête est autorisée.
  </Step>
</Steps>

## Comportement d’appairage de Control UI

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête passe les vérifications trusted-proxy, les sessions WebSocket de Control UI peuvent se connecter sans identité d’appairage d’appareil.

Implications de portée :

- Les sessions WebSocket de Control UI sans appareil se connectent, mais ne reçoivent par défaut aucune portée opérateur. OpenClaw vide la liste des portées demandées en `[]` afin qu’une session qui n’est pas liée à un appareil/jeton appairé approuvé ne puisse pas déclarer elle-même des autorisations.
- Si des méthodes échouent avec `missing scope` après une connexion WebSocket réussie, utilisez HTTPS afin que le navigateur puisse générer une identité d’appareil et terminer l’appairage. Consultez [HTTP non sécurisé de Control UI](/fr/web/control-ui#insecure-http).
- Bris de glace uniquement : `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserve les portées demandées même sans identité d’appareil. Il s’agit d’un affaiblissement grave de la sécurité ; rétablissez rapidement la configuration. Consultez [HTTP non sécurisé de Control UI](/fr/web/control-ui#insecure-http).

Plafonnement des portées par le proxy inverse :

- Si votre proxy envoie `x-openclaw-scopes` sur la requête de mise à niveau WebSocket de Control UI, OpenClaw limite les portées de session à l’intersection des portées demandées et des portées déclarées. Cet en-tête n’accorde pas de portées ; il réduit uniquement ce que la session peut détenir.

Implications :

- L’appairage n’est plus la barrière principale pour l’accès à Control UI dans ce mode.
- La politique d’authentification de votre proxy inverse et `allowUsers` deviennent le contrôle d’accès effectif.
- Gardez l’entrée du Gateway limitée aux seules IP de proxy de confiance (`gateway.trustedProxies` + pare-feu).

Les clients WebSocket personnalisés ne sont pas des sessions Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` n’accorde pas de portées aux clients arbitraires `client.mode: "backend"` ou de forme CLI. Les automatisations personnalisées doivent utiliser l’identité/l’appairage d’appareil, le chemin d’aide backend local direct réservé `client.id: "gateway-client"`, ou le [plugin RPC HTTP admin](/fr/plugins/admin-http-rpc) lorsqu’une surface de requête/réponse HTTP convient mieux.

## Configuration

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Règles d’exécution importantes**

- L’authentification trusted-proxy rejette par défaut les requêtes dont la source est loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Les proxys inverses loopback sur le même hôte ne satisfont **pas** l’authentification trusted-proxy, sauf si vous définissez explicitement `gateway.auth.trustedProxy.allowLoopback = true` et incluez l’adresse loopback dans `gateway.trustedProxies`.
- `allowLoopback` fait confiance aux processus locaux sur l’hôte du Gateway au même degré qu’au proxy inverse. Activez-le uniquement lorsque le Gateway reste protégé par pare-feu contre l’accès distant direct et que le proxy local supprime ou remplace les en-têtes d’identité fournis par le client.
- Les clients internes du Gateway qui ne passent pas par le proxy inverse doivent utiliser `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, et non des en-têtes d’identité trusted-proxy.
- Les déploiements Control UI non-loopback nécessitent toujours `gateway.controlUi.allowedOrigins` explicite.
- **Les preuves d’en-tête transféré remplacent la localité loopback pour le repli direct local.** Si une requête arrive sur loopback mais transporte des preuves d’en-tête `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`, ces preuves disqualifient le repli local direct par mot de passe et la barrière d’identité d’appareil. Avec `allowLoopback: true`, l’authentification trusted-proxy peut toujours accepter la requête comme une requête de proxy sur le même hôte, tandis que `requiredHeaders` et `allowUsers` continuent de s’appliquer.

</Warning>

### Référence de configuration

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Tableau d’adresses IP de proxy à approuver. Les requêtes provenant d’autres IP sont rejetées.
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
  Liste d’autorisation des identités utilisateur. Vide signifie autoriser tous les utilisateurs authentifiés.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Prise en charge opt-in des proxys inverses loopback sur le même hôte. Par défaut : `false`.
</ParamField>

<Warning>
N’activez `allowLoopback` que lorsque le proxy inverse local est la frontière de confiance prévue. Tout processus local pouvant se connecter au Gateway peut tenter d’envoyer des en-têtes d’identité de proxy ; gardez donc l’accès direct au Gateway privé à l’hôte et exigez des en-têtes détenus par le proxy tels que `x-forwarded-proto` ou un en-tête d’assertion signé lorsque votre proxy en prend un en charge.
</Warning>

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez HSTS à cet endroit.

<Tabs>
  <Tab title="Terminaison TLS du proxy (recommandé)">
    Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez `Strict-Transport-Security` au niveau du proxy pour ce domaine.

    - Bon choix pour les déploiements exposés à Internet.
    - Conserve le certificat et la politique de renforcement HTTP au même endroit.
    - OpenClaw peut rester en HTTP loopback derrière le proxy.

    Exemple de valeur d’en-tête :

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminaison TLS du Gateway">
    Si OpenClaw sert lui-même HTTPS directement (sans proxy de terminaison TLS), définissez :

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

    `strictTransportSecurity` accepte une valeur d’en-tête sous forme de chaîne, ou `false` pour désactiver explicitement.

  </Tab>
</Tabs>

### Conseils de déploiement

- Commencez d’abord avec une durée maximale courte (par exemple `max-age=300`) pendant que vous validez le trafic.
- Augmentez vers des valeurs longue durée (par exemple `max-age=31536000`) uniquement lorsque la confiance est élevée.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- Utilisez le préchargement uniquement si vous respectez intentionnellement les exigences de préchargement pour l’ensemble complet de vos domaines.
- Le développement local limité au loopback ne bénéficie pas de HSTS.

## Exemples de configuration de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium transmet l’identité dans `x-pomerium-claim-email` (ou d’autres en-têtes de revendication) et un JWT dans `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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
    Caddy avec le plugin `caddy-security` peut authentifier les utilisateurs et transmettre des en-têtes d’identité.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Extrait Caddyfile :

    ```
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
    oauth2-proxy authentifie les utilisateurs et transmet l’identité dans `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
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
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

## Configuration mixte de jeton

OpenClaw rejette les configurations ambiguës où un `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) et le mode `trusted-proxy` sont actifs en même temps. Les configurations mixtes de jeton peuvent provoquer l’authentification silencieuse des requêtes loopback sur le mauvais chemin d’authentification.

Si vous voyez une erreur `mixed_trusted_proxy_token` au démarrage :

- Supprimez le jeton partagé lorsque vous utilisez le mode trusted-proxy, ou
- Basculez `gateway.auth.mode` vers `"token"` si vous souhaitez une authentification basée sur jeton.

Les en-têtes d’identité de proxy de confiance local loopback continuent d’échouer de manière fermée : les appelants du même hôte ne sont pas authentifiés silencieusement comme utilisateurs du proxy. Les appelants OpenClaw internes qui contournent le proxy peuvent s’authentifier avec `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` à la place. Le repli sur jeton reste volontairement non pris en charge en mode proxy de confiance.

## En-tête des portées opérateur

L’authentification par proxy de confiance est un mode HTTP **porteur d’identité** ; les appelants peuvent donc déclarer facultativement des portées opérateur avec `x-openclaw-scopes` sur les requêtes d’API HTTP.

Remarque : les portées WebSocket sont déterminées par la négociation du protocole Gateway et la liaison d’identité de l’appareil. Sur les requêtes de mise à niveau WebSocket de la Control UI, `x-openclaw-scopes` ne fait que plafonner les portées de session négociées ; ce n’est pas une attribution. Pour le comportement des portées WebSocket avec un proxy de confiance, consultez [Comportement d’appairage de la Control UI](#control-ui-pairing-behavior).

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l’en-tête est présent, OpenClaw respecte l’ensemble de portées déclaré.
- Lorsque l’en-tête est présent mais vide, la requête ne déclare **aucune** portée opérateur.
- Lorsque l’en-tête est absent, les API HTTP normales porteuses d’identité se replient sur l’ensemble standard de portées opérateur par défaut.
- Les **routes HTTP de Plugin** avec authentification Gateway sont plus restreintes par défaut : lorsque `x-openclaw-scopes` est absent, leur portée d’exécution se replie sur `operator.write`.
- Les requêtes HTTP d’origine navigateur doivent toujours passer `gateway.controlUi.allowedOrigins` (ou le mode de repli délibéré sur l’en-tête Host), même après la réussite de l’authentification par proxy de confiance.
- Pour les sessions WebSocket de la Control UI, `x-openclaw-scopes` plafonne les portées lorsqu’il est présent sur la requête de mise à niveau. Une valeur vide ne produit aucune portée.

Règle pratique : envoyez `x-openclaw-scopes` explicitement lorsque vous voulez qu’une requête par proxy de confiance soit plus restreinte que les valeurs par défaut, ou lorsqu’une route de Plugin avec authentification Gateway a besoin de quelque chose de plus fort que la portée d’écriture.

## Liste de contrôle de sécurité

Avant d’activer l’authentification par proxy de confiance, vérifiez :

- [ ] **Le proxy est le seul chemin** : le port Gateway est protégé par pare-feu contre tout sauf votre proxy.
- [ ] **trustedProxies est minimal** : uniquement les IP réelles de votre proxy, pas des sous-réseaux entiers.
- [ ] **La source de proxy loopback est délibérée** : l’authentification par proxy de confiance échoue de manière fermée pour les requêtes provenant d’une source loopback, sauf si `gateway.auth.trustedProxy.allowLoopback` est explicitement activé pour un proxy sur le même hôte.
- [ ] **Le proxy supprime les en-têtes** : votre proxy remplace (et n’ajoute pas à) les en-têtes `x-forwarded-*` des clients.
- [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS.
- [ ] **allowedOrigins est explicite** : une Control UI non loopback utilise `gateway.controlUi.allowedOrigins` explicite.
- [ ] **allowUsers est défini** (recommandé) : restreignez aux utilisateurs connus plutôt que d’autoriser toute personne authentifiée.
- [ ] **Aucune configuration mixte de jeton** : ne définissez pas à la fois `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Le repli sur mot de passe local est privé** : si vous configurez `gateway.auth.password` pour des appelants directs internes, gardez le port Gateway derrière un pare-feu afin que les clients distants hors proxy ne puissent pas l’atteindre directement.

## Audit de sécurité

`openclaw security audit` signalera l’authentification par proxy de confiance avec une sévérité **critique**. C’est intentionnel : c’est un rappel que vous déléguez la sécurité à votre configuration de proxy.

L’audit vérifie :

- Rappel/avertissement critique de base `gateway.trusted_proxy_auth`
- Configuration `trustedProxies` manquante
- Configuration `userHeader` manquante
- `allowUsers` vide (autorise tout utilisateur authentifié)
- `allowLoopback` activé pour des sources proxy sur le même hôte
- Politique d’origine navigateur générique ou manquante sur les surfaces exposées de la Control UI

## Dépannage

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La requête ne provenait pas d’une IP dans `gateway.trustedProxies`. Vérifiez :

    - L’IP du proxy est-elle correcte ? (Les IP de conteneurs Docker peuvent changer.)
    - Y a-t-il un équilibreur de charge devant votre proxy ?
    - Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les IP réelles.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw a rejeté une requête de proxy de confiance provenant d’une source loopback.

    Vérifiez :

    - Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
    - Essayez-vous d’utiliser l’authentification par proxy de confiance avec un proxy inverse loopback sur le même hôte ?

    Correctif :

    - Préférez l’authentification par jeton/mot de passe pour les clients internes sur le même hôte qui ne passent pas par le proxy, ou
    - Acheminez via une adresse de proxy de confiance non loopback et conservez cette IP dans `gateway.trustedProxies`, ou
    - Pour un proxy inverse délibéré sur le même hôte, définissez `gateway.auth.trustedProxy.allowLoopback = true`, conservez l’adresse loopback dans `gateway.trustedProxies` et assurez-vous que le proxy supprime ou remplace les en-têtes d’identité.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L’en-tête utilisateur était vide ou manquant. Vérifiez :

    - Votre proxy est-il configuré pour transmettre les en-têtes d’identité ?
    - Le nom de l’en-tête est-il correct ? (insensible à la casse, mais l’orthographe compte)
    - L’utilisateur est-il réellement authentifié au niveau du proxy ?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un en-tête requis était absent. Vérifiez :

    - Votre configuration de proxy pour ces en-têtes spécifiques.
    - Si les en-têtes sont supprimés quelque part dans la chaîne.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L’utilisateur est authentifié mais n’est pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d’autorisation.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L’authentification par proxy de confiance a réussi, mais l’en-tête navigateur `Origin` n’a pas passé les contrôles d’origine de la Control UI.

    Vérifiez :

    - `gateway.controlUi.allowedOrigins` inclut l’origine navigateur exacte.
    - Vous ne vous appuyez pas sur des origines génériques, sauf si vous voulez intentionnellement un comportement qui autorise tout.
    - Si vous utilisez intentionnellement le mode de repli sur l’en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini délibérément.

  </Accordion>
  <Accordion title="La connexion réussit mais les méthodes signalent une portée manquante">
    Le WebSocket se connecte, mais `chat.history`, `sessions.list` ou
    `models.list` échoue avec `missing scope: operator.read`.

    Causes courantes :

    - Session Control UI sans appareil : l’authentification par proxy de confiance peut admettre la connexion WebSocket sans identité d’appareil, mais OpenClaw efface les portées des sessions sans appareil par conception.
    - Client backend personnalisé : `gateway.controlUi.dangerouslyDisableDeviceAuth` est limité à la Control UI et n’accorde pas de portées à des clients WebSocket arbitraires de type backend ou CLI.
    - `x-openclaw-scopes` trop restreint : si votre proxy injecte cet en-tête sur la requête de mise à niveau WebSocket de la Control UI, les portées de session sont plafonnées à cet ensemble. Une valeur d’en-tête vide ne produit aucune portée.

    Correctif :

    - Pour la Control UI, utilisez HTTPS afin que le navigateur puisse générer l’identité d’appareil et terminer l’appairage.
    - Pour une automatisation personnalisée, utilisez l’identité/l’appairage d’appareil, le chemin d’assistance backend direct-local réservé `gateway-client`, ou [RPC HTTP d’administration](/fr/plugins/admin-http-rpc).
    - Utilisez `gateway.controlUi.dangerouslyDisableDeviceAuth: true` uniquement comme chemin temporaire de secours de la Control UI.

  </Accordion>
  <Accordion title="WebSocket échoue toujours">
    Assurez-vous que votre proxy :

    - Prend en charge les mises à niveau WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Transmet les en-têtes d’identité sur les requêtes de mise à niveau WebSocket (pas seulement HTTP).
    - N’a pas de chemin d’authentification séparé pour les connexions WebSocket.

  </Accordion>
</AccordionGroup>

## Migration depuis l’authentification par jeton

Si vous passez de l’authentification par jeton au proxy de confiance :

<Steps>
  <Step title="Configurer le proxy">
    Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes.
  </Step>
  <Step title="Tester le proxy indépendamment">
    Testez la configuration du proxy indépendamment (curl avec en-têtes).
  </Step>
  <Step title="Mettre à jour la configuration OpenClaw">
    Mettez à jour la configuration OpenClaw avec l’authentification par proxy de confiance.
  </Step>
  <Step title="Redémarrer le Gateway">
    Redémarrez le Gateway.
  </Step>
  <Step title="Tester WebSocket">
    Testez les connexions WebSocket depuis la Control UI.
  </Step>
  <Step title="Auditer">
    Exécutez `openclaw security audit` et examinez les résultats.
  </Step>
</Steps>

## Connexe

- [Configuration](/fr/gateway/configuration) — référence de configuration
- [Accès distant](/fr/gateway/remote) — autres modèles d’accès distant
- [Sécurité](/fr/gateway/security) — guide de sécurité complet
- [Tailscale](/fr/gateway/tailscale) — alternative plus simple pour un accès limité au tailnet
