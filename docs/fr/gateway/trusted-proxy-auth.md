---
read_when:
    - Exécuter OpenClaw derrière un proxy sensible à l’identité
    - Configuration de Pomerium, Caddy ou nginx avec OAuth devant OpenClaw
    - Corriger les erreurs WebSocket 1008 d’accès non autorisé avec des configurations de proxy inverse
    - Déterminer où configurer HSTS et d’autres en-têtes de durcissement HTTP
sidebarTitle: Trusted proxy auth
summary: Déléguer l’authentification du Gateway à un proxy inverse de confiance (Pomerium, Caddy, nginx + OAuth)
title: Authentification par proxy de confiance
x-i18n:
    generated_at: "2026-04-30T07:30:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Fonctionnalité sensible pour la sécurité.** Ce mode délègue entièrement l’authentification à votre proxy inverse. Une mauvaise configuration peut exposer votre Gateway à un accès non autorisé. Lisez attentivement cette page avant de l’activer.
</Warning>

## Quand l’utiliser

Utilisez le mode d’authentification `trusted-proxy` lorsque :

- Vous exécutez OpenClaw derrière un **proxy sensible à l’identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Votre proxy gère toute l’authentification et transmet l’identité de l’utilisateur via des en-têtes.
- Vous êtes dans un environnement Kubernetes ou conteneurisé où le proxy est le seul chemin vers la Gateway.
- Vous rencontrez des erreurs WebSocket `1008 unauthorized` parce que les navigateurs ne peuvent pas transmettre de jetons dans les charges utiles WS.

## Quand NE PAS l’utiliser

- Si votre proxy n’authentifie pas les utilisateurs (simple terminaison TLS ou équilibreur de charge).
- S’il existe un chemin vers la Gateway qui contourne le proxy (ouvertures de pare-feu, accès au réseau interne).
- Si vous n’êtes pas sûr que votre proxy supprime/remplace correctement les en-têtes transférés.
- Si vous avez seulement besoin d’un accès personnel mono-utilisateur (envisagez Tailscale Serve + loopback pour une configuration plus simple).

## Fonctionnement

<Steps>
  <Step title="Le proxy authentifie l’utilisateur">
    Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="Le proxy ajoute un en-tête d’identité">
    Le proxy ajoute un en-tête avec l’identité de l’utilisateur authentifié (par exemple, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="La Gateway vérifie la source de confiance">
    OpenClaw vérifie que la requête provient d’une **IP de proxy de confiance** (configurée dans `gateway.trustedProxies`).
  </Step>
  <Step title="La Gateway extrait l’identité">
    OpenClaw extrait l’identité de l’utilisateur depuis l’en-tête configuré.
  </Step>
  <Step title="Autoriser">
    Si toutes les vérifications réussissent, la requête est autorisée.
  </Step>
</Steps>

## Comportement d’appairage de Control UI

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête passe les vérifications trusted-proxy, les sessions WebSocket Control UI peuvent se connecter sans identité d’appairage d’appareil.

Conséquences :

- L’appairage n’est plus la barrière principale pour l’accès à Control UI dans ce mode.
- La politique d’authentification de votre proxy inverse et `allowUsers` deviennent le contrôle d’accès effectif.
- Gardez l’entrée de la Gateway limitée aux seules IP de proxy de confiance (`gateway.trustedProxies` + pare-feu).

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

- L’authentification trusted-proxy rejette par défaut les requêtes provenant de loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Les proxys inverses loopback sur le même hôte ne satisfont **pas** l’authentification trusted-proxy, sauf si vous définissez explicitement `gateway.auth.trustedProxy.allowLoopback = true` et incluez l’adresse loopback dans `gateway.trustedProxies`.
- `allowLoopback` accorde aux processus locaux sur l’hôte de la Gateway le même niveau de confiance qu’au proxy inverse. Activez-le uniquement lorsque la Gateway reste protégée par un pare-feu contre tout accès distant direct et que le proxy local supprime ou remplace les en-têtes d’identité fournis par le client.
- Les clients internes de la Gateway qui ne passent pas par le proxy inverse doivent utiliser `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, et non les en-têtes d’identité trusted-proxy.
- Les déploiements Control UI non loopback nécessitent toujours un `gateway.controlUi.allowedOrigins` explicite.
- **Les preuves issues des en-têtes transférés priment sur la localité loopback pour le repli direct local.** Si une requête arrive sur loopback mais transporte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` pointant vers une origine non locale, ces preuves disqualifient le repli local direct par mot de passe et la barrière par identité d’appareil. Avec `allowLoopback: true`, l’authentification trusted-proxy peut toujours accepter la requête comme requête de proxy sur le même hôte, tandis que `requiredHeaders` et `allowUsers` continuent de s’appliquer.

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
  Prise en charge opt-in des proxys inverses loopback sur le même hôte. Valeur par défaut : `false`.
</ParamField>

<Warning>
N’activez `allowLoopback` que lorsque le proxy inverse local constitue la frontière de confiance prévue. Tout processus local pouvant se connecter à la Gateway peut tenter d’envoyer des en-têtes d’identité de proxy ; gardez donc l’accès direct à la Gateway privé à l’hôte et exigez des en-têtes appartenant au proxy, tels que `x-forwarded-proto`, ou un en-tête d’assertion signé lorsque votre proxy en prend un en charge.
</Warning>

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez-y HSTS.

<Tabs>
  <Tab title="Terminaison TLS du proxy (recommandée)">
    Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez `Strict-Transport-Security` au niveau du proxy pour ce domaine.

    - Convient aux déploiements exposés à Internet.
    - Garde la politique de certificat + durcissement HTTP au même endroit.
    - OpenClaw peut rester en HTTP loopback derrière le proxy.

    Exemple de valeur d’en-tête :

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminaison TLS de la Gateway">
    Si OpenClaw sert lui-même HTTPS directement (sans proxy terminant TLS), définissez :

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

    `strictTransportSecurity` accepte une valeur d’en-tête sous forme de chaîne, ou `false` pour la désactiver explicitement.

  </Tab>
</Tabs>

### Conseils de déploiement

- Commencez par un âge maximal court (par exemple `max-age=300`) pendant la validation du trafic.
- Passez à des valeurs de longue durée (par exemple `max-age=31536000`) uniquement lorsque la confiance est élevée.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- Utilisez preload uniquement si vous respectez intentionnellement les exigences de preload pour l’ensemble de vos domaines.
- Le développement local limité à loopback ne bénéficie pas de HSTS.

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
    Caddy avec le Plugin `caddy-security` peut authentifier les utilisateurs et transmettre des en-têtes d’identité.

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

    Extrait de Caddyfile :

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
  <Accordion title="Traefik avec forward auth">
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

OpenClaw rejette les configurations ambiguës où un `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) et le mode `trusted-proxy` sont actifs en même temps. Les configurations mixtes de jeton peuvent amener les requêtes loopback à s’authentifier silencieusement via le mauvais chemin d’authentification.

Si vous voyez une erreur `mixed_trusted_proxy_token` au démarrage :

- Supprimez le jeton partagé lorsque vous utilisez le mode trusted-proxy, ou
- Basculez `gateway.auth.mode` vers `"token"` si vous souhaitez une authentification basée sur un jeton.

Les en-têtes d’identité trusted-proxy en loopback échouent toujours de façon fermée : les appelants sur le même hôte ne sont pas authentifiés silencieusement comme utilisateurs de proxy. Les appelants internes d’OpenClaw qui contournent le proxy peuvent plutôt s’authentifier avec `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Le repli par jeton reste intentionnellement non pris en charge en mode trusted-proxy.

## En-tête des portées opérateur

L’authentification trusted-proxy est un mode HTTP **porteur d’identité** ; les appelants peuvent donc déclarer facultativement des portées opérateur avec `x-openclaw-scopes`.

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l’en-tête est présent, OpenClaw respecte l’ensemble de portées déclaré.
- Lorsque l’en-tête est présent mais vide, la requête ne déclare **aucune** portée opérateur.
- Lorsque l’en-tête est absent, les API HTTP porteuses d’identité normales reviennent à l’ensemble de portées opérateur par défaut standard.
- Les **routes HTTP de Plugin** avec authentification Gateway sont plus restreintes par défaut : lorsque `x-openclaw-scopes` est absent, leur portée d’exécution revient à `operator.write`.
- Les requêtes HTTP provenant d’un navigateur doivent toujours passer `gateway.controlUi.allowedOrigins` (ou le mode de repli volontaire par en-tête Host), même après la réussite de l’authentification trusted-proxy.

Règle pratique : envoyez `x-openclaw-scopes` explicitement lorsque vous voulez qu’une requête trusted-proxy soit plus restreinte que les valeurs par défaut, ou lorsqu’une route de Plugin avec authentification Gateway nécessite une portée plus forte que l’écriture.

## Liste de contrôle de sécurité

Avant d’activer l’authentification trusted-proxy, vérifiez :

- [ ] **Le proxy est le seul chemin** : le port du Gateway est protégé par pare-feu contre tout accès, sauf depuis votre proxy.
- [ ] **trustedProxies est minimal** : uniquement les adresses IP réelles de votre proxy, pas des sous-réseaux entiers.
- [ ] **La source du proxy en bouclage est délibérée** : l’authentification trusted-proxy échoue fermée pour les requêtes provenant d’une source en bouclage, sauf si `gateway.auth.trustedProxy.allowLoopback` est explicitement activé pour un proxy sur le même hôte.
- [ ] **Le proxy supprime les en-têtes** : votre proxy remplace (n’ajoute pas) les en-têtes `x-forwarded-*` provenant des clients.
- [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS.
- [ ] **allowedOrigins est explicite** : une Control UI hors bouclage utilise `gateway.controlUi.allowedOrigins` explicite.
- [ ] **allowUsers est défini** (recommandé) : limitez l’accès aux utilisateurs connus plutôt que d’autoriser toute personne authentifiée.
- [ ] **Aucune configuration de jeton mixte** : ne définissez pas à la fois `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Le repli par mot de passe local est privé** : si vous configurez `gateway.auth.password` pour les appelants directs internes, gardez le port du Gateway protégé par pare-feu afin que les clients distants hors proxy ne puissent pas l’atteindre directement.

## Audit de sécurité

`openclaw security audit` signalera l’authentification trusted-proxy avec une conclusion de gravité **critique**. C’est intentionnel : c’est un rappel que vous déléguez la sécurité à votre configuration de proxy.

L’audit vérifie :

- Rappel d’avertissement/critique de base `gateway.trusted_proxy_auth`
- Configuration `trustedProxies` manquante
- Configuration `userHeader` manquante
- `allowUsers` vide (autorise tout utilisateur authentifié)
- `allowLoopback` activé pour les sources de proxy sur le même hôte
- Politique d’origine du navigateur avec joker ou manquante sur les surfaces Control UI exposées

## Dépannage

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La requête ne provenait pas d’une adresse IP dans `gateway.trustedProxies`. Vérifiez :

    - L’adresse IP du proxy est-elle correcte ? (Les adresses IP des conteneurs Docker peuvent changer.)
    - Y a-t-il un équilibreur de charge devant votre proxy ?
    - Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les adresses IP réelles.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw a rejeté une requête trusted-proxy provenant d’une source en bouclage.

    Vérifiez :

    - Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
    - Essayez-vous d’utiliser l’authentification trusted-proxy avec un proxy inverse en bouclage sur le même hôte ?

    Correctif :

    - Préférez l’authentification par jeton/mot de passe pour les clients internes sur le même hôte qui ne passent pas par le proxy, ou
    - Faites passer le trafic par une adresse de proxy approuvée hors bouclage et conservez cette IP dans `gateway.trustedProxies`, ou
    - Pour un proxy inverse délibéré sur le même hôte, définissez `gateway.auth.trustedProxy.allowLoopback = true`, conservez l’adresse de bouclage dans `gateway.trustedProxies`, et assurez-vous que le proxy supprime ou remplace les en-têtes d’identité.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L’en-tête utilisateur était vide ou manquant. Vérifiez :

    - Votre proxy est-il configuré pour transmettre les en-têtes d’identité ?
    - Le nom de l’en-tête est-il correct ? (insensible à la casse, mais l’orthographe compte)
    - L’utilisateur est-il réellement authentifié au niveau du proxy ?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un en-tête requis n’était pas présent. Vérifiez :

    - La configuration de votre proxy pour ces en-têtes spécifiques.
    - Si les en-têtes sont supprimés quelque part dans la chaîne.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L’utilisateur est authentifié mais ne figure pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d’autorisation.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L’authentification trusted-proxy a réussi, mais l’en-tête `Origin` du navigateur n’a pas passé les vérifications d’origine de la Control UI.

    Vérifiez :

    - `gateway.controlUi.allowedOrigins` inclut l’origine exacte du navigateur.
    - Vous ne vous appuyez pas sur des origines avec joker, sauf si vous souhaitez intentionnellement un comportement d’autorisation totale.
    - Si vous utilisez intentionnellement le mode de repli par en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini délibérément.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Assurez-vous que votre proxy :

    - Prend en charge les mises à niveau WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Transmet les en-têtes d’identité sur les requêtes de mise à niveau WebSocket (pas seulement HTTP).
    - N’a pas de chemin d’authentification distinct pour les connexions WebSocket.

  </Accordion>
</AccordionGroup>

## Migration depuis l’authentification par jeton

Si vous passez de l’authentification par jeton à trusted-proxy :

<Steps>
  <Step title="Configure the proxy">
    Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes.
  </Step>
  <Step title="Test the proxy independently">
    Testez la configuration du proxy indépendamment (curl avec en-têtes).
  </Step>
  <Step title="Update OpenClaw config">
    Mettez à jour la configuration OpenClaw avec l’authentification trusted-proxy.
  </Step>
  <Step title="Restart the Gateway">
    Redémarrez le Gateway.
  </Step>
  <Step title="Test WebSocket">
    Testez les connexions WebSocket depuis la Control UI.
  </Step>
  <Step title="Audit">
    Exécutez `openclaw security audit` et examinez les conclusions.
  </Step>
</Steps>

## Connexe

- [Configuration](/fr/gateway/configuration) — référence de configuration
- [Accès distant](/fr/gateway/remote) — autres modèles d’accès distant
- [Sécurité](/fr/gateway/security) — guide de sécurité complet
- [Tailscale](/fr/gateway/tailscale) — solution plus simple pour un accès limité au tailnet
