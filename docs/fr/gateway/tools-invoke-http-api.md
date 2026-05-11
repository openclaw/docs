---
read_when:
    - Appeler des outils sans exécuter un tour d’agent complet
    - Créer des automatisations qui nécessitent l’application des politiques d’outils
summary: Appeler un seul outil directement via le point de terminaison HTTP du Gateway
title: API d’invocation des outils
x-i18n:
    generated_at: "2026-05-11T20:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Le Gateway d’OpenClaw expose un endpoint HTTP simple pour invoquer directement un seul outil. Il est toujours activé et utilise l’authentification du Gateway ainsi que la politique des outils. Comme la surface compatible OpenAI `/v1/*`, l’authentification bearer par secret partagé est traitée comme un accès opérateur de confiance pour l’ensemble du gateway.

- `POST /tools/invoke`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/tools/invoke`

La taille maximale de charge utile par défaut est de 2 Mo.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins courants d’authentification HTTP :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP de confiance portant une identité (`gateway.auth.mode="trusted-proxy"`) :
  passer par le proxy configuré avec prise en charge de l’identité et le laisser injecter les
  en-têtes d’identité requis
- authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Remarques :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy de confiance configurée ; les proxies loopback sur le même hôte nécessitent
  `gateway.auth.trustedProxy.allowLoopback = true` explicitement.
- Si `gateway.auth.rateLimit` est configuré et qu’un trop grand nombre d’échecs d’authentification se produit, l’endpoint renvoie `429` avec `Retry-After`.

## Frontière de sécurité (important)

Traitez cet endpoint comme une surface d’**accès opérateur complet** pour l’instance de gateway.

- L’authentification bearer HTTP ici n’est pas un modèle de portée étroite par utilisateur.
- Un token/mot de passe Gateway valide pour cet endpoint doit être traité comme un identifiant propriétaire/opérateur.
- Pour les modes d’authentification par secret partagé (`token` et `password`), l’endpoint restaure les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus étroit.
- L’authentification par secret partagé traite également les invocations directes d’outils sur cet endpoint comme des tours envoyés par le propriétaire.
- Les modes HTTP de confiance portant une identité (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"` sur un ingress privé) respectent `x-openclaw-scopes` lorsqu’il est présent et reviennent sinon à l’ensemble normal de portées opérateur par défaut.
- Gardez cet endpoint uniquement sur loopback/tailnet/ingress privé ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret partagé d’opérateur du gateway
  - ignore les `x-openclaw-scopes` plus étroits
  - restaure l’ensemble complet des portées opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les invocations directes d’outils sur cet endpoint comme des tours envoyés par le propriétaire
- modes HTTP de confiance portant une identité (par exemple l’authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur ingress privé)
  - authentifient une identité externe de confiance ou une frontière de déploiement
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble normal des portées opérateur par défaut lorsque l’en-tête est absent
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

- `tool` (chaîne, requis) : nom de l’outil à invoquer.
- `action` (chaîne, facultatif) : mappé dans les arguments si le schéma de l’outil prend en charge `action` et que la charge utile des arguments l’a omis.
- `args` (objet, facultatif) : arguments propres à l’outil.
- `sessionKey` (chaîne, facultatif) : clé de session cible. Si elle est omise ou vaut `"main"`, le Gateway utilise la clé de session principale configurée (respecte `session.mainKey` et l’agent par défaut, ou `global` dans la portée globale).
- `dryRun` (booléen, facultatif) : réservé à une utilisation future ; actuellement ignoré.

## Comportement de politique et de routage

La disponibilité des outils est filtrée via la même chaîne de politiques que celle utilisée par les agents du Gateway :

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- politiques de groupe (si la clé de session correspond à un groupe ou à un canal)
- politique de sous-agent (lors de l’invocation avec une clé de session de sous-agent)

Si un outil n’est pas autorisé par la politique, l’endpoint renvoie **404**.

Remarques importantes sur les frontières :

- Les approbations exec sont des garde-fous opérateur, pas une frontière d’autorisation distincte pour cet endpoint HTTP. Si un outil est accessible ici via l’authentification du Gateway + la politique d’outils, `/tools/invoke` n’ajoute pas de demande d’approbation supplémentaire par appel.
- Si `exec` est accessible ici, traitez-le comme une surface shell mutative. Refuser `write`, `edit`, `apply_patch` ou des outils HTTP d’écriture dans le système de fichiers ne rend pas l’exécution shell en lecture seule.
- Ne partagez pas les identifiants bearer du Gateway avec des appelants non approuvés. Si vous avez besoin de séparation entre frontières de confiance, exécutez des gateways distincts (et idéalement des utilisateurs/hôtes OS distincts).

HTTP du Gateway applique également une liste de refus stricte par défaut (même si la politique de session autorise l’outil) :

- `exec` - exécution directe de commandes (surface RCE)
- `spawn` - création arbitraire de processus enfants (surface RCE)
- `shell` - exécution de commandes shell (surface RCE)
- `fs_write` - mutation arbitraire de fichiers sur l’hôte
- `fs_delete` - suppression arbitraire de fichiers sur l’hôte
- `fs_move` - déplacement/renommage arbitraire de fichiers sur l’hôte
- `apply_patch` - l’application de patchs peut réécrire des fichiers arbitraires
- `sessions_spawn` - orchestration de sessions ; générer des agents à distance est une RCE
- `sessions_send` - injection de messages entre sessions
- `cron` - plan de contrôle d’automatisation persistante
- `gateway` - plan de contrôle du gateway ; empêche la reconfiguration via HTTP
- `nodes` - le relais de commandes de Node peut atteindre system.run sur les hôtes appairés
- `whatsapp_login` - configuration interactive nécessitant le scan d’un QR code dans le terminal ; bloque sur HTTP

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

Pour aider les politiques de groupe à résoudre le contexte, vous pouvez facultativement définir :

- `x-openclaw-message-channel: <channel>` (exemple : `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (lorsque plusieurs comptes existent)

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
