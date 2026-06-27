---
read_when:
    - Appeler des outils sans exécuter un tour d’agent complet
    - Création d’automatisations nécessitant l’application d’une politique d’outil
summary: Appeler un seul outil directement via le point de terminaison HTTP du Gateway
title: API d’appel des outils
x-i18n:
    generated_at: "2026-06-27T17:34:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway expose un point de terminaison HTTP simple pour invoquer directement un seul outil. Il est toujours activé et utilise l’authentification du Gateway ainsi que la politique d’outils. Comme la surface compatible OpenAI `/v1/*`, l’authentification bearer par secret partagé est traitée comme un accès opérateur de confiance pour l’ensemble du gateway.

- `POST /tools/invoke`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/tools/invoke`

La taille maximale de charge utile par défaut est de 2 Mo.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins d’authentification HTTP courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP avec identité de confiance (`gateway.auth.mode="trusted-proxy"`) :
  passer par le proxy configuré tenant compte de l’identité et le laisser injecter les
  en-têtes d’identité requis
- authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Remarques :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy de confiance configurée ; les proxys loopback sur le même hôte exigent
  `gateway.auth.trustedProxy.allowLoopback = true` explicitement.
- Les appelants internes sur le même hôte qui contournent le proxy peuvent utiliser
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` comme solution de repli directe
  locale. Toute preuve d’en-tête `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`
  maintient plutôt la requête sur le chemin du proxy de confiance.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification se produisent, le point de terminaison renvoie `429` avec `Retry-After`.

## Frontière de sécurité (important)

Traitez ce point de terminaison comme une surface à **accès opérateur complet** pour l’instance de gateway.

- L’authentification bearer HTTP ici n’est pas un modèle de portée étroite par utilisateur.
- Un token/mot de passe Gateway valide pour ce point de terminaison doit être traité comme un identifiant propriétaire/opérateur.
- Pour les modes d’authentification par secret partagé (`token` et `password`), le point de terminaison rétablit les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus étroit.
- L’authentification par secret partagé traite également les invocations directes d’outils sur ce point de terminaison comme des tours d’expéditeur propriétaire.
- Les modes HTTP avec identité de confiance (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"` sur un ingress privé) honorent `x-openclaw-scopes` lorsqu’il est présent et reviennent sinon à l’ensemble de portées par défaut de l’opérateur normal.
- Gardez ce point de terminaison uniquement sur loopback/tailnet/ingress privé ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du gateway
  - ignore les `x-openclaw-scopes` plus étroits
  - rétablit l’ensemble complet des portées opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les invocations directes d’outils sur ce point de terminaison comme des tours d’expéditeur propriétaire
- modes HTTP avec identité de confiance (par exemple l’authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur ingress privé)
  - authentifient une identité externe de confiance ou une frontière de déploiement
  - honorent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble de portées par défaut de l’opérateur normal lorsque l’en-tête est absent
  - ne perdent la sémantique de propriétaire que lorsque l’appelant restreint explicitement les portées et omet `operator.admin`

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
- `action` (chaîne, facultatif) : mappé dans les arguments si le schéma de l’outil prend en charge `action` et que la charge utile des arguments l’a omis.
- `args` (objet, facultatif) : arguments propres à l’outil.
- `sessionKey` (chaîne, facultatif) : clé de session cible. Si elle est omise ou vaut `"main"`, le Gateway utilise la clé de session principale configurée (honore `session.mainKey` et l’agent par défaut, ou `global` dans la portée globale).
- `dryRun` (booléen, facultatif) : réservé à un usage futur ; actuellement ignoré.

## Comportement de politique et de routage

La disponibilité des outils est filtrée via la même chaîne de politiques que celle utilisée par les agents Gateway :

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- politiques de groupe (si la clé de session correspond à un groupe ou à un canal)
- politique de sous-agent (lors d’une invocation avec une clé de session de sous-agent)

Si un outil n’est pas autorisé par la politique, le point de terminaison renvoie **404**.

Remarques importantes sur les frontières :

- Les approbations Exec sont des garde-fous opérateur, pas une frontière d’autorisation séparée pour ce point de terminaison HTTP. Si un outil est accessible ici via l’authentification Gateway + la politique d’outils, `/tools/invoke` n’ajoute pas d’invite d’approbation supplémentaire par appel.
- Si `exec` est accessible ici, traitez-le comme une surface shell mutatrice. Refuser `write`, `edit`, `apply_patch` ou des outils HTTP d’écriture sur le système de fichiers ne rend pas l’exécution shell en lecture seule.
- Ne partagez pas les identifiants bearer Gateway avec des appelants non approuvés. Si vous avez besoin d’une séparation entre frontières de confiance, exécutez des gateways distincts (et idéalement des utilisateurs/hôtes OS distincts).

Le HTTP Gateway applique également une liste de refus stricte par défaut (même si la politique de session autorise l’outil) :

- `exec` - exécution directe de commandes (surface RCE)
- `spawn` - création arbitraire de processus enfants (surface RCE)
- `shell` - exécution de commandes shell (surface RCE)
- `fs_write` - mutation arbitraire de fichiers sur l’hôte
- `fs_delete` - suppression arbitraire de fichiers sur l’hôte
- `fs_move` - déplacement/renommage arbitraire de fichiers sur l’hôte
- `apply_patch` - l’application de correctifs peut réécrire des fichiers arbitraires
- `sessions_spawn` - orchestration de sessions ; générer des agents à distance est une RCE
- `sessions_send` - injection de messages entre sessions
- `cron` - plan de contrôle d’automatisation persistante
- `gateway` - plan de contrôle du gateway ; empêche la reconfiguration via HTTP
- `nodes` - le relais de commandes de nœud peut atteindre system.run sur les hôtes appairés
- `whatsapp_login` - configuration interactive exigeant un scan QR dans le terminal ; se bloque sur HTTP

Vous pouvez personnaliser cette liste de refus via `gateway.tools` :

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` est un remplacement d’exposition, pas une élévation de portée. Dans
les modes HTTP avec identité, `cron`, `gateway` et `nodes` restent indisponibles
pour les appelants qui n’ont pas d’identité propriétaire/admin (`operator.admin`), même
lorsqu’ils sont listés dans `gateway.tools.allow`. L’authentification bearer par secret partagé suit toujours
la règle complète d’opérateur de confiance ci-dessus.

Pour aider les politiques de groupe à résoudre le contexte, vous pouvez facultativement définir :

- `x-openclaw-message-channel: <channel>` (exemple : `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (lorsque plusieurs comptes existent)

## Réponses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (requête invalide ou erreur d’entrée d’outil)
- `401` → non autorisé
- `429` → limitation du débit d’authentification (`Retry-After` défini)
- `404` → outil non disponible (introuvable ou non autorisé)
- `405` → méthode non autorisée
- `500` → `{ ok: false, error: { type, message } }` (erreur inattendue d’exécution d’outil ; message nettoyé)

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

## Associé

- [Protocole Gateway](/fr/gateway/protocol)
- [Outils et plugins](/fr/tools)
