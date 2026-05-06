---
read_when:
    - Appeler des outils sans exécuter un tour d’agent complet
    - Créer des automatisations qui nécessitent l’application de politiques relatives aux outils
summary: Invoquer un outil unique directement via le point de terminaison HTTP du Gateway
title: API d’invocation des outils
x-i18n:
    generated_at: "2026-05-06T07:25:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw's Gateway expose un point de terminaison HTTP simple pour invoquer directement un seul outil. Il est toujours activé et utilise l’authentification du Gateway ainsi que la politique des outils. Comme la surface compatible OpenAI `/v1/*`, l’authentification bearer par secret partagé est traitée comme un accès opérateur de confiance pour l’ensemble du gateway.

- `POST /tools/invoke`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/tools/invoke`

La taille maximale par défaut de la charge utile est de 2 Mo.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins courants d’authentification HTTP :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP de confiance portant une identité (`gateway.auth.mode="trusted-proxy"`) :
  routez via le proxy configuré et conscient de l’identité, puis laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte par ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Notes :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy de confiance configurée ; les proxys local loopback sur le même hôte nécessitent explicitement
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification se produisent, le point de terminaison renvoie `429` avec `Retry-After`.

## Limite de sécurité (important)

Traitez ce point de terminaison comme une surface d’**accès opérateur complet** pour l’instance de gateway.

- L’authentification bearer HTTP ici n’est pas un modèle de portée étroite par utilisateur.
- Un jeton/mot de passe Gateway valide pour ce point de terminaison doit être traité comme un identifiant propriétaire/opérateur.
- Pour les modes d’authentification par secret partagé (`token` et `password`), le point de terminaison restaure les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus restreint.
- L’authentification par secret partagé traite aussi les invocations directes d’outils sur ce point de terminaison comme des tours envoyés par le propriétaire.
- Les modes HTTP de confiance portant une identité (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"` sur un ingress privé) honorent `x-openclaw-scopes` lorsqu’il est présent et se replient sinon sur l’ensemble de portées opérateur par défaut normal.
- Gardez ce point de terminaison uniquement sur local loopback/Tailscale/ingress privé ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du gateway
  - ignore les `x-openclaw-scopes` plus restreints
  - restaure l’ensemble complet de portées opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les invocations directes d’outils sur ce point de terminaison comme des tours envoyés par le propriétaire
- modes HTTP de confiance portant une identité (par exemple l’authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur un ingress privé)
  - authentifient une identité externe de confiance ou une limite de déploiement
  - honorent `x-openclaw-scopes` lorsque l’en-tête est présent
  - se replient sur l’ensemble de portées opérateur par défaut normal lorsque l’en-tête est absent
  - ne perdent la sémantique propriétaire que lorsque l’appelant restreint explicitement les portées et omet `operator.admin`

## Corps de requête

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
- `sessionKey` (chaîne, facultatif) : clé de session cible. Si elle est omise ou vaut `"main"`, le Gateway utilise la clé de session principale configurée (honore `session.mainKey` et l’agent par défaut, ou `global` dans la portée globale).
- `dryRun` (booléen, facultatif) : réservé pour une utilisation future ; actuellement ignoré.

## Comportement de politique + routage

La disponibilité des outils est filtrée via la même chaîne de politiques que celle utilisée par les agents Gateway :

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- politiques de groupe (si la clé de session correspond à un groupe ou à un canal)
- politique de sous-agent (lors de l’invocation avec une clé de session de sous-agent)

Si un outil n’est pas autorisé par la politique, le point de terminaison renvoie **404**.

Notes importantes sur les limites :

- Les approbations d’exécution sont des garde-fous opérateur, pas une limite d’autorisation distincte pour ce point de terminaison HTTP. Si un outil est accessible ici via l’authentification Gateway + la politique des outils, `/tools/invoke` n’ajoute pas de demande d’approbation supplémentaire par appel.
- Ne partagez pas les identifiants bearer du Gateway avec des appelants non fiables. Si vous avez besoin d’une séparation entre limites de confiance, exécutez des gateways distincts (et idéalement des utilisateurs/hôtes OS distincts).

Le HTTP du Gateway applique aussi par défaut une liste de refus stricte (même si la politique de session autorise l’outil) :

- `exec` - exécution directe de commandes (surface RCE)
- `spawn` - création arbitraire de processus enfants (surface RCE)
- `shell` - exécution de commandes shell (surface RCE)
- `fs_write` - mutation arbitraire de fichiers sur l’hôte
- `fs_delete` - suppression arbitraire de fichiers sur l’hôte
- `fs_move` - déplacement/renommage arbitraire de fichiers sur l’hôte
- `apply_patch` - l’application de patchs peut réécrire des fichiers arbitraires
- `sessions_spawn` - orchestration de sessions ; faire apparaître des agents à distance est une RCE
- `sessions_send` - injection de messages entre sessions
- `cron` - plan de contrôle d’automatisation persistante
- `gateway` - plan de contrôle du gateway ; empêche la reconfiguration via HTTP
- `nodes` - le relais de commande de node peut atteindre system.run sur les hôtes appairés
- `whatsapp_login` - configuration interactive nécessitant un scan QR dans le terminal ; bloque en HTTP

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

Pour aider les politiques de groupe à résoudre le contexte, vous pouvez définir facultativement :

- `x-openclaw-message-channel: <channel>` (exemple : `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (lorsque plusieurs comptes existent)

## Réponses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (requête invalide ou erreur d’entrée de l’outil)
- `401` → non autorisé
- `429` → authentification limitée par débit (`Retry-After` défini)
- `404` → outil non disponible (introuvable ou non autorisé)
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

- [Protocole Gateway](/fr/gateway/protocol)
- [Outils et plugins](/fr/tools)
