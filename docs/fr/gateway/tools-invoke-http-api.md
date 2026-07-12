---
read_when:
    - Appeler des outils sans exécuter un tour d’agent complet
    - Création d’automatisations nécessitant l’application de stratégies d’utilisation des outils
summary: Appelez directement un outil unique via le point de terminaison HTTP du Gateway
title: Les outils appellent l’API
x-i18n:
    generated_at: "2026-07-12T15:24:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Le Gateway d’OpenClaw expose un point de terminaison HTTP permettant d’appeler directement un outil unique. Il est toujours activé et utilise l’authentification du Gateway ainsi que la politique des outils. Comme pour l’interface compatible OpenAI `/v1/*`, l’authentification par porteur avec secret partagé est considérée comme un accès opérateur de confiance à l’ensemble du Gateway.

- `POST /tools/invoke`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/tools/invoke`
- Taille maximale par défaut du corps de la requête : 2 MB

## Authentification

Utilise la configuration d’authentification du Gateway.

Méthodes courantes d’authentification HTTP :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) : `Authorization: Bearer <token-or-password>`
- authentification HTTP de confiance avec identité (`gateway.auth.mode="trusted-proxy"`) : acheminez la requête via le proxy configuré prenant en charge les identités et laissez-le injecter les en-têtes d’identité requis
- authentification ouverte sur une entrée privée (`gateway.auth.mode="none"`) : aucun en-tête d’authentification requis

Remarques :

- `mode="token"` utilise `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` utilise `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` exige que la requête HTTP provienne d’une source proxy de confiance configurée ; les proxys en boucle locale sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true`.
- Les appelants internes sur le même hôte qui contournent le proxy peuvent utiliser `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` comme solution de repli locale directe. Toute présence d’un en-tête `Forwarded`, `X-Forwarded-*` ou `X-Real-IP` maintient plutôt la requête sur le chemin du proxy de confiance.
- Si `gateway.auth.rateLimit` est configuré et qu’un trop grand nombre d’échecs d’authentification se produit, le point de terminaison renvoie `429` avec `Retry-After`.

## Limite de sécurité (important)

Considérez ce point de terminaison comme une interface donnant un **accès opérateur complet** à l’instance du Gateway.

- Ici, l’authentification HTTP par porteur n’est pas un modèle de portée restreinte par utilisateur.
- Un jeton ou mot de passe de Gateway valide pour ce point de terminaison doit être considéré comme un identifiant de propriétaire ou d’opérateur.
- Pour les modes d’authentification par secret partagé (`token` et `password`), le point de terminaison rétablit les portées complètes par défaut de l’opérateur, même si l’appelant envoie un en-tête `x-openclaw-scopes` plus restrictif.
- L’authentification par secret partagé traite également les appels directs d’outils sur ce point de terminaison comme des tours dont l’expéditeur est le propriétaire.
- Les modes HTTP de confiance avec identité (authentification par proxy de confiance ou `gateway.auth.mode="none"` sur une entrée privée) respectent `x-openclaw-scopes` lorsqu’il est présent et utilisent sinon l’ensemble normal de portées par défaut de l’opérateur.
- Conservez ce point de terminaison uniquement sur une boucle locale, un réseau Tailscale ou une entrée privée ; ne l’exposez pas directement à l’Internet public.

Matrice d’authentification :

| Mode d’authentification                                                                | Comportement                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` ou `password` + `Authorization: Bearer ...`                                     | Prouve la possession du secret partagé de l’opérateur du Gateway. Ignore les valeurs plus restrictives de `x-openclaw-scopes`. Rétablit l’ensemble complet des portées par défaut de l’opérateur : `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Traite les appels directs d’outils comme des tours dont l’expéditeur est le propriétaire. |
| HTTP de confiance avec identité (authentification par proxy de confiance ou `mode="none"` sur une entrée privée) | Authentifie une identité externe de confiance ou une limite de déploiement. Respecte `x-openclaw-scopes` lorsqu’il est présent. Utilise l’ensemble normal des portées par défaut de l’opérateur lorsque l’en-tête est absent. Ne perd la sémantique de propriétaire que lorsque l’appelant restreint explicitement les portées et omet `operator.admin`.                                                   |

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

- `tool` / `name` (chaîne, obligatoire) : nom de l’outil à appeler. `name` est prioritaire si les deux sont envoyés.
- `action` (chaîne, facultatif) : fusionné dans `args.action` si le schéma de l’outil prend en charge une propriété `action` et si `args` n’en a pas déjà défini une.
- `args` (objet, facultatif) : arguments propres à l’outil.
- `sessionKey` (chaîne, facultatif) : clé de la session cible. Si elle est omise ou vaut `"main"`, le Gateway utilise la clé de session principale configurée (en respectant `session.mainKey` et l’agent par défaut, ou `global` dans la portée de session globale).
- `agentId` (chaîne, facultatif) : résout la clé de session pour cet agent. Renvoie une erreur `400` en cas de conflit avec une valeur explicite de `sessionKey` qui correspond déjà à un autre agent.
- `idempotencyKey` (chaîne, facultatif) : utilisé pour dériver un identifiant stable d’appel d’outil pour l’invocation.
- `dryRun` (booléen, facultatif) : réservé à une utilisation future ; actuellement ignoré.

## Comportement de la politique et du routage

La disponibilité des outils est filtrée par la même chaîne de politiques que celle utilisée par les agents du Gateway :

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- politiques de groupe (si la clé de session correspond à un groupe ou à un canal)
- politique des sous-agents (lors de l’appel avec une clé de session de sous-agent)

Si un outil n’est pas autorisé par la politique, le point de terminaison renvoie **404**.

Remarques importantes sur les limites :

- Les approbations d’exécution sont des garde-fous pour les opérateurs, et non une limite d’autorisation distincte pour ce point de terminaison HTTP. Si un outil est accessible ici au moyen de l’authentification du Gateway et de la politique des outils, `/tools/invoke` n’ajoute aucune demande d’approbation supplémentaire par appel.
- Si `exec` est accessible ici, considérez-le comme une interface d’interpréteur de commandes permettant des modifications. Refuser `write`, `edit`, `apply_patch` ou les outils HTTP d’écriture dans le système de fichiers ne rend pas l’exécution de commandes accessible en lecture seule.
- Ne partagez pas les identifiants de porteur du Gateway avec des appelants non fiables. Si vous devez séparer plusieurs limites de confiance, exécutez des Gateways distincts (idéalement sous des utilisateurs ou sur des hôtes de système d’exploitation distincts).

Par défaut, le HTTP du Gateway applique également une liste stricte d’interdiction (même si la politique de session autorise l’outil) :

| Outil            | Motif                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `exec`           | Exécution directe de commandes (surface RCE)                          |
| `spawn`          | Création arbitraire de processus enfants (surface RCE)                |
| `shell`          | Exécution de commandes d’interpréteur (surface RCE)                   |
| `fs_write`       | Modification arbitraire de fichiers sur l’hôte                        |
| `fs_delete`      | Suppression arbitraire de fichiers sur l’hôte                         |
| `fs_move`        | Déplacement ou renommage arbitraire de fichiers sur l’hôte            |
| `apply_patch`    | L’application de correctifs peut réécrire des fichiers arbitraires    |
| `sessions_spawn` | Orchestration de sessions ; lancer des agents à distance constitue une RCE |
| `sessions_send`  | Injection de messages entre sessions                                  |
| `cron`           | Plan de contrôle de l’automatisation persistante                      |
| `gateway`        | Plan de contrôle du Gateway ; empêche sa reconfiguration via HTTP     |
| `nodes`          | Le relais de commandes Node peut atteindre `system.run` sur les hôtes appairés |

`cron`, `gateway` et `nodes` sont également réservés au propriétaire : même en dehors de cette liste d’interdiction par défaut, les appelants qui ne sont pas propriétaires ne peuvent pas les appeler sur cette interface.

Personnalisez la liste générale d’interdiction via `gateway.tools` :

```json5
{
  gateway: {
    tools: {
      // Outils supplémentaires à bloquer via HTTP /tools/invoke
      deny: ["browser"],
      // Retirer des outils de la liste d’interdiction par défaut pour les appelants propriétaires/administrateurs
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` est une dérogation d’exposition, pas une élévation de portée. Dans les modes HTTP avec identité, `cron`, `gateway` et `nodes` restent indisponibles pour les appelants ne disposant pas d’une identité de propriétaire ou d’administrateur (`operator.admin`), même lorsqu’ils figurent dans `gateway.tools.allow`. L’authentification par porteur avec secret partagé continue de suivre la règle d’opérateur de confiance complète décrite ci-dessus.

Pour aider les politiques de groupe à déterminer le contexte, vous pouvez éventuellement définir :

- `x-openclaw-message-channel: <channel>` (exemple : `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (lorsqu’il existe plusieurs comptes)
- `x-openclaw-message-to: <target>` (cible de livraison pour la politique de l’outil de messagerie)
- `x-openclaw-thread-id: <threadId>` (contexte du fil de discussion pour la politique de l’outil de messagerie)

## Réponses

| Statut | Signification                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| `200`  | `{ ok: true, result }`                                                                                             |
| `400`  | `{ ok: false, error: { type, message } }` (requête non valide ou erreur d’entrée de l’outil)                       |
| `401`  | Non autorisé                                                                                                       |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }` (appel d’outil bloqué par la politique)               |
| `404`  | Outil indisponible (introuvable ou absent de la liste d’autorisation)                                              |
| `405`  | Méthode non autorisée                                                                                              |
| `408`  | Expiration du délai de lecture du corps de la requête                                                              |
| `413`  | Le corps de la requête a dépassé la taille maximale de la charge utile                                             |
| `429`  | Limitation du débit d’authentification (`Retry-After` défini)                                                      |
| `500`  | `{ ok: false, error: { type, message } }` (erreur inattendue d’exécution de l’outil ; message assaini)             |

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

## Voir aussi

- [Protocole du Gateway](/fr/gateway/protocol)
- [Outils et plugins](/fr/tools)
