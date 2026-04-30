---
read_when:
    - Appeler des outils sans exécuter un tour d’agent complet
    - Création d’automatisations nécessitant l’application de politiques relatives aux outils
summary: Appeler un outil unique directement via le point de terminaison HTTP du Gateway
title: API d’invocation des outils
x-i18n:
    generated_at: "2026-04-30T07:30:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# Invocation des outils (HTTP)

Le Gateway d’OpenClaw expose un endpoint HTTP simple pour invoquer directement un seul outil. Il est toujours activé et utilise l’authentification du Gateway ainsi que la politique des outils. Comme la surface compatible OpenAI `/v1/*`, l’authentification par porteur avec secret partagé est traitée comme un accès opérateur fiable pour l’ensemble du Gateway.

- `POST /tools/invoke`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/tools/invoke`

La taille maximale de payload par défaut est de 2 Mo.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins d’authentification HTTP courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP fiable avec identité (`gateway.auth.mode="trusted-proxy"`) :
  routez via le proxy configuré tenant compte de l’identité et laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Notes :

- Quand `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Quand `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Quand `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy fiable configurée ; les proxys de bouclage sur le même hôte nécessitent
  explicitement `gateway.auth.trustedProxy.allowLoopback = true`.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification se produisent, l’endpoint renvoie `429` avec `Retry-After`.

## Frontière de sécurité (important)

Traitez cet endpoint comme une surface d’**accès opérateur complet** pour l’instance Gateway.

- L’authentification HTTP par porteur ici n’est pas un modèle de périmètre étroit par utilisateur.
- Un token/mot de passe Gateway valide pour cet endpoint doit être traité comme un identifiant propriétaire/opérateur.
- Pour les modes d’authentification par secret partagé (`token` et `password`), l’endpoint rétablit les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus restreint.
- L’authentification par secret partagé traite aussi les invocations directes d’outils sur cet endpoint comme des tours envoyés par le propriétaire.
- Les modes HTTP fiables avec identité (par exemple l’authentification par proxy fiable ou `gateway.auth.mode="none"` sur un ingress privé) respectent `x-openclaw-scopes` lorsqu’il est présent et se rabattent sinon sur l’ensemble de périmètres par défaut de l’opérateur normal.
- Gardez cet endpoint uniquement sur loopback/tailnet/ingress privé ; ne l’exposez pas directement à l’Internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du Gateway
  - ignore les `x-openclaw-scopes` plus restreints
  - rétablit l’ensemble complet de périmètres opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les invocations directes d’outils sur cet endpoint comme des tours envoyés par le propriétaire
- modes HTTP fiables avec identité (par exemple l’authentification par proxy fiable, ou `gateway.auth.mode="none"` sur ingress privé)
  - authentifient une identité fiable externe ou une frontière de déploiement
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - se rabattent sur l’ensemble de périmètres par défaut de l’opérateur normal lorsque l’en-tête est absent
  - ne perdent la sémantique de propriétaire que lorsque l’appelant restreint explicitement les périmètres et omet `operator.admin`

## Corps de la requête

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Champs :

- `tool` (chaîne, obligatoire) : nom de l’outil à invoquer.
- `action` (chaîne, facultatif) : mappé dans les arguments si le schéma de l’outil prend en charge `action` et que le payload `args` l’a omis.
- `args` (objet, facultatif) : arguments propres à l’outil.
- `sessionKey` (chaîne, facultatif) : clé de session cible. Si omise ou `"main"`, le Gateway utilise la clé de session principale configurée (respecte `session.mainKey` et l’agent par défaut, ou `global` dans le périmètre global).
- `dryRun` (booléen, facultatif) : réservé à une utilisation future ; actuellement ignoré.

## Politique + comportement de routage

La disponibilité des outils est filtrée via la même chaîne de politiques que celle utilisée par les agents du Gateway :

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- politiques de groupe (si la clé de session correspond à un groupe ou à un canal)
- politique de sous-agent (lors d’une invocation avec une clé de session de sous-agent)

Si un outil n’est pas autorisé par la politique, l’endpoint renvoie **404**.

Notes importantes sur les frontières :

- Les approbations Exec sont des garde-fous opérateur, pas une frontière d’autorisation distincte pour cet endpoint HTTP. Si un outil est accessible ici via l’authentification du Gateway + la politique des outils, `/tools/invoke` n’ajoute pas d’invite d’approbation supplémentaire par appel.
- Ne partagez pas les identifiants porteurs du Gateway avec des appelants non fiables. Si vous avez besoin d’une séparation entre frontières de confiance, exécutez des gateways séparés (et idéalement des utilisateurs/hôtes OS séparés).

Le HTTP du Gateway applique aussi par défaut une liste de refus stricte (même si la politique de session autorise l’outil) :

- `exec` — exécution directe de commandes (surface RCE)
- `spawn` — création arbitraire de processus enfants (surface RCE)
- `shell` — exécution de commandes shell (surface RCE)
- `fs_write` — mutation arbitraire de fichiers sur l’hôte
- `fs_delete` — suppression arbitraire de fichiers sur l’hôte
- `fs_move` — déplacement/renommage arbitraire de fichiers sur l’hôte
- `apply_patch` — l’application de correctifs peut réécrire des fichiers arbitraires
- `sessions_spawn` — orchestration de sessions ; créer des agents à distance relève de la RCE
- `sessions_send` — injection de messages entre sessions
- `cron` — plan de contrôle d’automatisation persistante
- `gateway` — plan de contrôle du gateway ; empêche la reconfiguration via HTTP
- `nodes` — le relais de commandes de nœud peut atteindre system.run sur des hôtes appairés
- `whatsapp_login` — configuration interactive nécessitant une analyse QR dans le terminal ; bloque sur HTTP

Vous pouvez personnaliser cette liste de refus via `gateway.tools` :

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Pour aider les politiques de groupe à résoudre le contexte, vous pouvez éventuellement définir :

- `x-openclaw-message-channel: <channel>` (exemple : `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (lorsqu’il existe plusieurs comptes)

## Réponses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (requête non valide ou erreur d’entrée de l’outil)
- `401` → non autorisé
- `429` → authentification limitée par débit (`Retry-After` défini)
- `404` → outil non disponible (introuvable ou non présent dans la liste d’autorisation)
- `405` → méthode non autorisée
- `500` → `{ ok: false, error: { type, message } }` (erreur inattendue d’exécution de l’outil ; message assaini)

## Exemple

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Connexe

- [Protocole du Gateway](/fr/gateway/protocol)
- [Outils et plugins](/fr/tools)
