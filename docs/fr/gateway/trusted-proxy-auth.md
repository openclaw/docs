---
read_when:
    - Exécution d’OpenClaw derrière un proxy tenant compte de l’identité
    - Configuration de Pomerium, Caddy ou nginx avec OAuth devant OpenClaw
    - Correction des erreurs WebSocket 1008 non autorisé avec des configurations de proxy inverse
    - Décider où définir HSTS et d’autres en-têtes de durcissement HTTP
summary: Déléguer l’authentification du Gateway à un proxy inverse de confiance (Pomerium, Caddy, nginx + OAuth)
title: Authentification par proxy de confiance
x-i18n:
    generated_at: "2026-04-23T07:04:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Authentification par proxy de confiance

> ⚠️ **Fonctionnalité sensible sur le plan de la sécurité.** Ce mode délègue entièrement l’authentification à votre proxy inverse. Une mauvaise configuration peut exposer votre Gateway à des accès non autorisés. Lisez attentivement cette page avant de l’activer.

## Quand l’utiliser

Utilisez le mode d’authentification `trusted-proxy` lorsque :

- Vous exécutez OpenClaw derrière un **proxy tenant compte de l’identité** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Votre proxy gère toute l’authentification et transmet l’identité utilisateur via des en-têtes
- Vous êtes dans un environnement Kubernetes ou conteneur où le proxy est le seul chemin vers le Gateway
- Vous rencontrez des erreurs WebSocket `1008 unauthorized` parce que les navigateurs ne peuvent pas transmettre de tokens dans les charges utiles WS

## Quand NE PAS l’utiliser

- Si votre proxy n’authentifie pas les utilisateurs (simple terminateur TLS ou équilibreur de charge)
- S’il existe un chemin vers le Gateway qui contourne le proxy (ouvertures dans le pare-feu, accès réseau interne)
- Si vous n’êtes pas certain que votre proxy supprime/remplace correctement les en-têtes transférés
- Si vous avez seulement besoin d’un accès personnel mono-utilisateur (envisagez Tailscale Serve + loopback pour une configuration plus simple)

## Fonctionnement

1. Votre proxy inverse authentifie les utilisateurs (OAuth, OIDC, SAML, etc.)
2. Le proxy ajoute un en-tête contenant l’identité de l’utilisateur authentifié (par ex. `x-forwarded-user: nick@example.com`)
3. OpenClaw vérifie que la requête provient d’une **IP de proxy de confiance** (configurée dans `gateway.trustedProxies`)
4. OpenClaw extrait l’identité utilisateur depuis l’en-tête configuré
5. Si tout est correct, la requête est autorisée

## Comportement du Pairing de l’interface de contrôle

Lorsque `gateway.auth.mode = "trusted-proxy"` est actif et que la requête passe
les vérifications de proxy de confiance, les sessions WebSocket de l’interface de contrôle peuvent se connecter sans
identité de pairing d’appareil.

Implications :

- Le Pairing n’est plus la barrière principale pour l’accès à l’interface de contrôle dans ce mode.
- Votre politique d’authentification du proxy inverse et `allowUsers` deviennent le contrôle d’accès effectif.
- Gardez l’entrée du Gateway verrouillée uniquement aux IP de proxy de confiance (`gateway.trustedProxies` + pare-feu).

## Configuration

```json5
{
  gateway: {
    // L’authentification par proxy de confiance attend des requêtes provenant d’une source proxy de confiance non loopback
    bind: "lan",

    // CRITIQUE : ajoutez uniquement ici les IP de votre proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // En-tête contenant l’identité de l’utilisateur authentifié (obligatoire)
        userHeader: "x-forwarded-user",

        // Facultatif : en-têtes qui DOIVENT être présents (vérification du proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Facultatif : limiter à des utilisateurs spécifiques (vide = tout autoriser)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Règle d’exécution importante :

- L’authentification par proxy de confiance rejette les requêtes provenant d’une source loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Les proxys inverses loopback sur le même hôte ne satisfont **pas** l’authentification par proxy de confiance.
- Pour les configurations de proxy loopback sur le même hôte, utilisez plutôt l’authentification par token/mot de passe, ou routez via une adresse de proxy de confiance non loopback qu’OpenClaw peut vérifier.
- Les déploiements non loopback de l’interface de contrôle nécessitent toujours `gateway.controlUi.allowedOrigins` explicite.
- **La preuve par en-têtes transférés remplace la localité loopback.** Si une requête arrive sur loopback mais transporte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` pointant vers une origine non locale, cette preuve invalide la revendication de localité loopback. La requête est traitée comme distante pour le Pairing, l’authentification par proxy de confiance et le filtrage par identité d’appareil de l’interface de contrôle. Cela empêche un proxy loopback sur le même hôte de blanchir une identité d’en-tête transféré dans l’authentification par proxy de confiance.

### Référence de configuration

| Champ                                       | Obligatoire | Description                                                                 |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Oui         | Tableau d’adresses IP de proxy de confiance. Les requêtes provenant d’autres IP sont rejetées. |
| `gateway.auth.mode`                         | Oui         | Doit être `"trusted-proxy"`                                                 |
| `gateway.auth.trustedProxy.userHeader`      | Oui         | Nom de l’en-tête contenant l’identité de l’utilisateur authentifié          |
| `gateway.auth.trustedProxy.requiredHeaders` | Non         | En-têtes supplémentaires qui doivent être présents pour que la requête soit de confiance |
| `gateway.auth.trustedProxy.allowUsers`      | Non         | Liste d’autorisation des identités utilisateur. Vide signifie autoriser tous les utilisateurs authentifiés. |

## Terminaison TLS et HSTS

Utilisez un seul point de terminaison TLS et appliquez HSTS à cet endroit.

### Modèle recommandé : terminaison TLS du proxy

Lorsque votre proxy inverse gère HTTPS pour `https://control.example.com`, définissez
`Strict-Transport-Security` au niveau du proxy pour ce domaine.

- Bon choix pour les déploiements exposés à internet.
- Conserve le certificat + la politique de durcissement HTTP au même endroit.
- OpenClaw peut rester en HTTP loopback derrière le proxy.

Exemple de valeur d’en-tête :

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminaison TLS du Gateway

Si OpenClaw lui-même sert directement en HTTPS (sans proxy terminateur TLS), définissez :

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

`strictTransportSecurity` accepte une valeur d’en-tête chaîne de caractères, ou `false` pour désactiver explicitement.

### Conseils de déploiement

- Commencez d’abord avec une durée max courte (par exemple `max-age=300`) pendant la validation du trafic.
- Augmentez vers des valeurs de longue durée (par exemple `max-age=31536000`) uniquement une fois la confiance établie.
- Ajoutez `includeSubDomains` uniquement si chaque sous-domaine est prêt pour HTTPS.
- Utilisez preload uniquement si vous respectez volontairement les exigences preload pour l’ensemble complet de vos domaines.
- Le développement local en loopback uniquement ne bénéficie pas de HSTS.

## Exemples de configuration de proxy

### Pomerium

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

### Caddy avec OAuth

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

### nginx + oauth2-proxy

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

### Traefik avec Forward Auth

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

## Configuration mixte avec token

OpenClaw rejette les configurations ambiguës où un `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) et le mode `trusted-proxy` sont actifs en même temps. Les configurations mixtes avec token peuvent faire en sorte que des requêtes loopback s’authentifient silencieusement via le mauvais chemin d’authentification.

Si vous voyez une erreur `mixed_trusted_proxy_token` au démarrage :

- Supprimez le token partagé lorsque vous utilisez le mode trusted-proxy, ou
- Basculez `gateway.auth.mode` sur `"token"` si vous souhaitez une authentification par token.

L’authentification loopback par proxy de confiance échoue aussi en mode fail-closed : les appelants sur le même hôte doivent fournir les en-têtes d’identité configurés via un proxy de confiance au lieu d’être authentifiés silencieusement.

## En-tête de scopes opérateur

L’authentification par proxy de confiance est un mode HTTP **porteur d’identité**, donc les appelants peuvent
éventuellement déclarer des scopes opérateur avec `x-openclaw-scopes`.

Exemples :

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportement :

- Lorsque l’en-tête est présent, OpenClaw respecte l’ensemble de scopes déclaré.
- Lorsque l’en-tête est présent mais vide, la requête ne déclare **aucun** scope opérateur.
- Lorsque l’en-tête est absent, les API HTTP normales porteuses d’identité reviennent à l’ensemble de scopes opérateur par défaut standard.
- Les **routes HTTP de Plugin** authentifiées par Gateway sont plus étroites par défaut : lorsque `x-openclaw-scopes` est absent, leur scope d’exécution revient à `operator.write`.
- Les requêtes HTTP d’origine navigateur doivent toujours passer `gateway.controlUi.allowedOrigins` (ou le mode délibéré de repli d’en-tête Host) même après succès de l’authentification par proxy de confiance.

Règle pratique :

- Envoyez `x-openclaw-scopes` explicitement lorsque vous voulez qu’une requête trusted-proxy
  soit plus étroite que les valeurs par défaut, ou lorsqu’une route de Plugin authentifiée par Gateway a besoin
  de quelque chose de plus fort que le scope write.

## Checklist de sécurité

Avant d’activer l’authentification par proxy de confiance, vérifiez :

- [ ] **Le proxy est le seul chemin** : le port Gateway est protégé par pare-feu contre tout sauf votre proxy
- [ ] **trustedProxies est minimal** : uniquement les véritables IP de votre proxy, pas des sous-réseaux entiers
- [ ] **Aucune source proxy loopback** : l’authentification par proxy de confiance échoue en mode fail-closed pour les requêtes provenant d’une source loopback
- [ ] **Le proxy supprime les en-têtes** : votre proxy remplace (et n’ajoute pas) les en-têtes `x-forwarded-*` provenant des clients
- [ ] **Terminaison TLS** : votre proxy gère TLS ; les utilisateurs se connectent via HTTPS
- [ ] **allowedOrigins est explicite** : l’interface de contrôle non loopback utilise `gateway.controlUi.allowedOrigins` explicite
- [ ] **allowUsers est défini** (recommandé) : limitez aux utilisateurs connus plutôt que d’autoriser toute personne authentifiée
- [ ] **Pas de configuration mixte avec token** : ne définissez pas à la fois `gateway.auth.token` et `gateway.auth.mode: "trusted-proxy"`

## Audit de sécurité

`openclaw security audit` signalera l’authentification par proxy de confiance avec un constat de sévérité **critique**. C’est intentionnel — cela vous rappelle que vous déléguez la sécurité à votre configuration de proxy.

L’audit vérifie :

- Avertissement/rappel critique de base `gateway.trusted_proxy_auth`
- Absence de configuration `trustedProxies`
- Absence de configuration `userHeader`
- `allowUsers` vide (autorise tout utilisateur authentifié)
- Politique d’origine navigateur générique ou absente sur les surfaces exposées de l’interface de contrôle

## Dépannage

### "trusted_proxy_untrusted_source"

La requête ne provenait pas d’une IP présente dans `gateway.trustedProxies`. Vérifiez :

- L’IP du proxy est-elle correcte ? (les IP de conteneur Docker peuvent changer)
- Y a-t-il un équilibreur de charge devant votre proxy ?
- Utilisez `docker inspect` ou `kubectl get pods -o wide` pour trouver les IP réelles

### "trusted_proxy_loopback_source"

OpenClaw a rejeté une requête trusted-proxy provenant d’une source loopback.

Vérifiez :

- Le proxy se connecte-t-il depuis `127.0.0.1` / `::1` ?
- Essayez-vous d’utiliser l’authentification par proxy de confiance avec un proxy inverse loopback sur le même hôte ?

Correctif :

- Utilisez l’authentification par token/mot de passe pour les configurations de proxy loopback sur le même hôte, ou
- Routez via une adresse de proxy de confiance non loopback et conservez cette IP dans `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

L’en-tête utilisateur était vide ou absent. Vérifiez :

- Votre proxy est-il configuré pour transmettre les en-têtes d’identité ?
- Le nom de l’en-tête est-il correct ? (insensible à la casse, mais l’orthographe compte)
- L’utilisateur est-il réellement authentifié au niveau du proxy ?

### "trusted*proxy_missing_header*\*"

Un en-tête requis n’était pas présent. Vérifiez :

- La configuration de votre proxy pour ces en-têtes spécifiques
- Si des en-têtes sont supprimés quelque part dans la chaîne

### "trusted_proxy_user_not_allowed"

L’utilisateur est authentifié mais n’est pas dans `allowUsers`. Ajoutez-le ou supprimez la liste d’autorisation.

### "trusted_proxy_origin_not_allowed"

L’authentification par proxy de confiance a réussi, mais l’en-tête `Origin` du navigateur n’a pas passé les vérifications d’origine de l’interface de contrôle.

Vérifiez :

- `gateway.controlUi.allowedOrigins` inclut l’origine exacte du navigateur
- Vous ne vous appuyez pas sur des origines génériques sauf si vous voulez intentionnellement un comportement autoriser-tout
- Si vous utilisez intentionnellement le mode de repli d’en-tête Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` est défini délibérément

### WebSocket échoue toujours

Assurez-vous que votre proxy :

- Prend en charge les mises à niveau WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Transmet les en-têtes d’identité lors des requêtes de mise à niveau WebSocket (pas seulement HTTP)
- N’a pas un chemin d’authentification séparé pour les connexions WebSocket

## Migration depuis l’authentification par token

Si vous passez de l’authentification par token à trusted-proxy :

1. Configurez votre proxy pour authentifier les utilisateurs et transmettre les en-têtes
2. Testez la configuration du proxy indépendamment (curl avec en-têtes)
3. Mettez à jour la configuration OpenClaw avec l’authentification par proxy de confiance
4. Redémarrez le Gateway
5. Testez les connexions WebSocket depuis l’interface de contrôle
6. Exécutez `openclaw security audit` et examinez les constats

## Liens associés

- [Sécurité](/fr/gateway/security) — guide complet de sécurité
- [Configuration](/fr/gateway/configuration) — référence de configuration
- [Accès distant](/fr/gateway/remote) — autres modèles d’accès distant
- [Tailscale](/fr/gateway/tailscale) — alternative plus simple pour un accès limité au tailnet
