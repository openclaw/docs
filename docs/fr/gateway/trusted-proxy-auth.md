---
read_when:
    - Exécuter OpenClaw derrière un proxy conscient de l’identité
    - Configurer Pomerium, Caddy ou nginx avec OAuth devant OpenClaw
    - Corriger les erreurs WebSocket 1008 non autorisé dans les configurations avec proxy inverse
    - Décider où définir HSTS et les autres en-têtes de durcissement HTTP
sidebarTitle: Trusted proxy auth
summary: Déléguer l’authentification de la gateway à un proxy inverse de confiance (Pomerium, Caddy, nginx + OAuth)
title: Authentification Trusted Proxy
x-i18n:
    generated_at: "2026-04-26T11:31:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Fonctionnalité sensible du point de vue de la sécurité.** Ce mode délègue entièrement l’authentification à votre proxy inverse. Une mauvaise configuration peut exposer votre Gateway à des accès non autorisés. Lisez attentivement cette page avant de l’activer.
</Warning>

## Quand l’utiliser

Utilisez le mode d’authentification `trusted-proxy` lorsque :

- vous exécutez OpenClaw derrière un **proxy conscient de l’identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth) ;
- votre proxy gère toute l’authentification et transmet l’identité utilisateur via des en-têtes ;
- vous êtes dans un environnement Kubernetes ou conteneur où le proxy est le seul chemin vers la Gateway ;
- vous rencontrez des erreurs WebSocket `1008 unauthorized` parce que les navigateurs ne peuvent pas transmettre de jetons dans les charges utiles WS.

## Quand NE PAS l’utiliser

- Si votre proxy n’authentifie pas les utilisateurs (simple terminaison TLS ou équilibreur de charge).
- S’il existe un chemin vers la Gateway qui contourne le proxy (ouvertures dans le pare-feu, accès réseau interne).
- Si vous n’êtes pas certain que votre proxy retire/remplace correctement les en-têtes forwarded.
- Si vous avez seulement besoin d’un accès personnel à utilisateur unique (envisagez Tailscale Serve + loopback pour une configuration plus simple).

## Fonctionnement

<Steps>
  <Step title="Le proxy authentifie l’utilisateur">
    Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.).
  </Step>
  <Step title="Le proxy ajoute un en-tête d’identité">
    Le proxy ajoute un en-tête contenant l’identité de l’utilisateur authentifié (par ex., `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="La Gateway vérifie la source de confiance">
    OpenClaw vérifie que la requête provient d’une **IP de proxy de confiance** (configurée dans `gateway.trustedProxies`).
  </Step>
  <Step title="La Gateway extrait l’identité">
    OpenClaw extrait l’identité utilisateur à partir de l’en-tête configuré.
  </Step>
  <Step title="Autorisation">
    Si tout est correct, la requête est autorisée.
  </Step>
</Steps>

## Comportement d’appairage de la Control UI

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête passe les vérifications trusted-proxy, les sessions WebSocket de la Control UI peuvent se connecter sans identité d’appairage d’appareil.

Implications :

- L’appairage n’est plus la barrière principale pour l’accès à la Control UI dans ce mode.
- Votre politique d’authentification du proxy inverse et `allowUsers` deviennent le contrôle d’accès effectif.
- Gardez l’ingress de la gateway verrouillé uniquement sur les IP de proxy de confiance (`gateway.trustedProxies` + pare-feu).

## Configuration

```json5
{
  gateway: {
    // L’authentification trusted-proxy attend des requêtes provenant d’une source proxy de confiance hors loopback
    bind: "lan",

    // CRITIQUE : n’ajoutez ici que les IP de votre proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // En-tête contenant l’identité de l’utilisateur authentifié (obligatoire)
        userHeader: "x-forwarded-user",

        // Facultatif : en-têtes qui DOIVENT être présents (vérification du proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Facultatif : limiter à des utilisateurs spécifiques (vide = autoriser tous)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Règles d’exécution importantes**

- L’authentification trusted-proxy rejette les requêtes provenant de sources loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Les proxys inverses loopback sur le même hôte ne satisfont **pas** l’authentification trusted-proxy.
- Pour les configurations de proxy loopback sur le même hôte, utilisez plutôt l’authentification par jeton/mot de passe, ou faites transiter par une adresse de proxy de confiance hors loopback qu’OpenClaw peut vérifier.
- Les déploiements Control UI hors loopback nécessitent toujours des `gateway.controlUi.allowedOrigins` explicites.
- **Les preuves d’en-têtes forwarded priment sur la localité loopback.** Si une requête arrive sur loopback mais transporte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` pointant vers une origine non locale, cette preuve invalide la revendication de localité loopback. La requête est traitée comme distante pour l’appairage, l’authentification trusted-proxy et le contrôle d’identité d’appareil de la Control UI. Cela empêche un proxy loopback sur le même hôte de blanchir une identité d’en-tête forwarded en authentification trusted-proxy.

</Warning>

### Référence de configuration

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Tableau des adresses IP de proxy à considérer comme fiables. Les requêtes provenant d’autres IP sont rejetées.
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

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez HSTS à cet endroit.

<Tabs>
  <Tab title="Terminaison TLS au niveau du proxy (recommandé)">
    Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez `Strict-Transport-Security` au niveau du proxy pour ce domaine.

    - Convient bien aux déploiements exposés sur Internet.
    - Garde la politique de certificat + durcissement HTTP au même endroit.
    - OpenClaw peut rester en HTTP loopback derrière le proxy.

    Exemple de valeur d’en-tête :

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminaison TLS au niveau de la Gateway">
    Si OpenClaw lui-même sert directement en HTTPS (sans proxy de terminaison TLS), définissez :

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

    `strictTransportSecurity` accepte une valeur d’en-tête de type chaîne, ou `false` pour le désactiver explicitement.

  </Tab>
</Tabs>

### Conseils de déploiement progressif

- Commencez d’abord avec un max age court (par exemple `max-age=300`) pendant la validation du trafic.
- Augmentez vers des valeurs longue durée (par exemple `max-age=31536000`) uniquement lorsque la confiance est élevée.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- Utilisez preload uniquement si vous respectez intentionnellement les exigences preload pour tout votre ensemble de domaines.
- Le développement local en loopback uniquement ne bénéficie pas de HSTS.

## Exemples de configuration de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium transmet l’identité dans `x-pomerium-claim-email` (ou d’autres en-têtes de claim) et un JWT dans `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP de Pomerium
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
        trustedProxies: ["10.0.0.1"], // IP du proxy Caddy/sidecar
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
  <Accordion title="Traefik avec forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP du conteneur Traefik
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

OpenClaw rejette les configurations ambiguës où `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) et le mode `trusted-proxy` sont actifs en même temps. Les configurations mixtes à jeton peuvent faire en sorte que les requêtes loopback soient silencieusement authentifiées via le mauvais chemin d’authentification.

Si vous voyez une erreur `mixed_trusted_proxy_token` au démarrage :

- Supprimez le jeton partagé lorsque vous utilisez le mode trusted-proxy, ou
- Basculez `gateway.auth.mode` vers `"token"` si vous comptez utiliser une authentification par jeton.

L’authentification trusted-proxy loopback échoue aussi de façon fermée : les appelants sur le même hôte doivent fournir les en-têtes d’identité configurés via un proxy de confiance au lieu d’être authentifiés silencieusement.

## En-tête de portées operator

L’authentification trusted-proxy est un mode HTTP **porteur d’identité**, donc les appelants peuvent facultativement déclarer des portées operator avec `x-openclaw-scopes`.

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l’en-tête est présent, OpenClaw respecte l’ensemble de portées déclaré.
- Lorsque l’en-tête est présent mais vide, la requête ne déclare **aucune** portée operator.
- Lorsque l’en-tête est absent, les API HTTP normales porteuses d’identité reviennent à l’ensemble standard de portées operator par défaut.
- Les **routes HTTP de Plugin** gateway-auth sont plus restreintes par défaut : lorsque `x-openclaw-scopes` est absent, leur portée d’exécution revient à `operator.write`.
- Les requêtes HTTP d’origine navigateur doivent toujours passer `gateway.controlUi.allowedOrigins` (ou le mode de repli délibéré basé sur l’en-tête Host) même après réussite de l’authentification trusted-proxy.

Règle pratique : envoyez explicitement `x-openclaw-scopes` lorsque vous voulez qu’une requête trusted-proxy soit plus étroite que les valeurs par défaut, ou lorsqu’une route de Plugin gateway-auth a besoin de quelque chose de plus fort qu’une portée write.

## Liste de contrôle de sécurité

Avant d’activer l’authentification trusted-proxy, vérifiez :

- [ ] **Le proxy est le seul chemin** : le port de la Gateway est protégé par pare-feu contre tout sauf votre proxy.
- [ ] **trustedProxies est minimal** : uniquement les IP réelles de votre proxy, pas des sous-réseaux entiers.
- [ ] **Aucune source proxy loopback** : l’authentification trusted-proxy échoue de façon fermée pour les requêtes provenant d’une source loopback.
- [ ] **Le proxy retire les en-têtes** : votre proxy remplace (et n’ajoute pas) les en-têtes `x-forwarded-*` provenant des clients.
- [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS.
- [ ] **allowedOrigins est explicite** : la Control UI hors loopback utilise des `gateway.controlUi.allowedOrigins` explicites.
- [ ] **allowUsers est défini** (recommandé) : limitez aux utilisateurs connus au lieu d’autoriser toute personne authentifiée.
- [ ] **Pas de configuration mixte à jeton** : ne définissez pas à la fois `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`.

## Audit de sécurité

`openclaw security audit` signalera l’authentification trusted-proxy avec une gravité **critique**. C’est intentionnel — cela rappelle que vous déléguez la sécurité à votre configuration de proxy.

L’audit vérifie :

- Avertissement/rappel critique de base `gateway.trusted_proxy_auth`
- Configuration `trustedProxies` manquante
- Configuration `userHeader` manquante
- `allowUsers` vide (autorise tout utilisateur authentifié)
- Politique d’origine navigateur générique ou manquante sur les surfaces Control UI exposées

## Dépannage

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La requête ne provenait pas d’une IP figurant dans `gateway.trustedProxies`. Vérifiez :

    - L’IP du proxy est-elle correcte ? (Les IP de conteneur Docker peuvent changer.)
    - Y a-t-il un équilibreur de charge devant votre proxy ?
    - Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les IP réelles.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw a rejeté une requête trusted-proxy provenant d’une source loopback.

    Vérifiez :

    - Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
    - Essayez-vous d’utiliser l’authentification trusted-proxy avec un proxy inverse loopback sur le même hôte ?

    Correctif :

    - Utilisez l’authentification par jeton/mot de passe pour les configurations de proxy loopback sur le même hôte, ou
    - Faites transiter via une adresse de proxy de confiance hors loopback et conservez cette IP dans `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L’en-tête utilisateur était vide ou absent. Vérifiez :

    - Votre proxy est-il configuré pour transmettre des en-têtes d’identité ?
    - Le nom de l’en-tête est-il correct ? (insensible à la casse, mais l’orthographe compte)
    - L’utilisateur est-il réellement authentifié au niveau du proxy ?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un en-tête requis n’était pas présent. Vérifiez :

    - La configuration de votre proxy pour ces en-têtes spécifiques.
    - Si des en-têtes sont supprimés quelque part dans la chaîne.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L’utilisateur est authentifié mais ne figure pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d’autorisation.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L’authentification trusted-proxy a réussi, mais l’en-tête `Origin` du navigateur n’a pas passé les vérifications d’origine de la Control UI.

    Vérifiez :

    - `gateway.controlUi.allowedOrigins` inclut l’origine exacte du navigateur.
    - Vous ne vous appuyez pas sur des origines génériques sauf si vous voulez intentionnellement un comportement autorisant tout.
    - Si vous utilisez intentionnellement le mode de repli basé sur l’en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini volontairement.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Assurez-vous que votre proxy :

    - Prend en charge les mises à niveau WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Transmet les en-têtes d’identité sur les requêtes de mise à niveau WebSocket (pas seulement sur HTTP).
    - N’a pas de chemin d’authentification distinct pour les connexions WebSocket.

  </Accordion>
</AccordionGroup>

## Migration depuis l’authentification par jeton

Si vous passez de l’authentification par jeton à trusted-proxy :

<Steps>
  <Step title="Configurer le proxy">
    Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes.
  </Step>
  <Step title="Tester le proxy indépendamment">
    Testez indépendamment la configuration du proxy (`curl` avec en-têtes).
  </Step>
  <Step title="Mettre à jour la configuration OpenClaw">
    Mettez à jour la configuration OpenClaw avec l’authentification trusted-proxy.
  </Step>
  <Step title="Redémarrer la Gateway">
    Redémarrez la Gateway.
  </Step>
  <Step title="Tester WebSocket">
    Testez les connexions WebSocket depuis la Control UI.
  </Step>
  <Step title="Audit">
    Exécutez `openclaw security audit` et examinez les résultats.
  </Step>
</Steps>

## Connexe

- [Configuration](/fr/gateway/configuration) — référence de configuration
- [Accès distant](/fr/gateway/remote) — autres modèles d’accès distant
- [Sécurité](/fr/gateway/security) — guide complet de sécurité
- [Tailscale](/fr/gateway/tailscale) — alternative plus simple pour un accès limité au tailnet
