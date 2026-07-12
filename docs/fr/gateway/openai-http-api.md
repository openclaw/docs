---
read_when:
    - Intégration d’outils conçus pour OpenAI Chat Completions
summary: Exposer un endpoint HTTP compatible avec OpenAI à l’adresse /v1/chat/completions depuis le Gateway
title: Complétions de chat OpenAI
x-i18n:
    generated_at: "2026-07-12T02:52:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Le Gateway peut fournir une petite interface Chat Completions compatible avec OpenAI. Elle est **désactivée par défaut**.

Une fois activée, elle fournit tous les points de terminaison suivants sur le même port que le Gateway (multiplexage WS + HTTP) :

| Méthode | Chemin                 |
| ------- | ---------------------- |
| POST    | `/v1/chat/completions` |
| GET     | `/v1/models`           |
| GET     | `/v1/models/{id}`      |
| POST    | `/v1/embeddings`       |
| POST    | `/v1/responses`        |

Les requêtes sont exécutées comme une exécution d’agent Gateway normale (même chemin de code que `openclaw agent`) ; le routage, les autorisations et la configuration correspondent donc à ceux de votre Gateway.

## Activation du point de terminaison

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

Définissez `enabled: false` (ou omettez cette option) pour le désactiver.

## Périmètre de sécurité (important)

Considérez ce point de terminaison comme donnant un **accès opérateur complet** à l’instance du Gateway :

- Un jeton ou mot de passe Gateway valide pour ce point de terminaison équivaut à un identifiant de propriétaire/opérateur, et non à un périmètre restreint par utilisateur.
- Les requêtes empruntent le même chemin d’agent du plan de contrôle que les actions d’un opérateur de confiance ; si la politique de l’agent cible autorise des outils sensibles, ce point de terminaison peut donc les utiliser.
- Limitez-le à local loopback, au tailnet ou à une entrée privée. Ne l’exposez pas à l’Internet public.

Matrice d’authentification :

| Chemin d’authentification                                                                             | Comportement                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`                              | Prouve la possession du secret partagé du Gateway. Ignore tout en-tête `x-openclaw-scopes` et rétablit l’ensemble complet des périmètres opérateur par défaut : `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Traite les tours de conversation comme provenant du propriétaire. |
| HTTP de confiance porteur d’identité (authentification trusted-proxy, ou `gateway.auth.mode="none"` sur une entrée privée) | Respecte `x-openclaw-scopes` lorsqu’il est présent ; en son absence, utilise l’ensemble des périmètres opérateur par défaut. Ne perd la sémantique de propriétaire que lorsque l’appelant restreint explicitement les périmètres et omet `operator.admin`. Nécessite `operator.admin` pour les contrôles de niveau propriétaire tels que `x-openclaw-model`. |

Consultez [Périmètres opérateur](/fr/gateway/operator-scopes), [Sécurité](/fr/gateway/security) et [Accès distant](/fr/gateway/remote).

## Authentification

Utilise la configuration d’authentification du Gateway (consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour les détails de ce mode) :

| Mode                                | Méthode d’authentification                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Défini via `gateway.auth.token` ou `OPENCLAW_GATEWAY_TOKEN`.                                                                                                                                               |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Défini via `gateway.auth.password` ou `OPENCLAW_GATEWAY_PASSWORD`.                                                                                                                                      |
| `gateway.auth.mode="trusted-proxy"` | Faites transiter la requête par le proxy configuré prenant en charge l’identité ; il injecte les en-têtes d’identité requis. Les proxys local loopback sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true` explicitement. |
| `gateway.auth.mode="none"`          | Aucun en-tête d’authentification requis (entrée privée uniquement).                                                                                                                                                                        |

Remarques :

- Les appelants sur le même hôte qui contournent le proxy d’un Gateway `trusted-proxy` peuvent utiliser directement `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` comme solution de repli. Toute présence d’un en-tête `Forwarded`, `X-Forwarded-*` ou `X-Real-IP` maintient au contraire la requête sur le chemin trusted-proxy.
- Si `gateway.auth.rateLimit` est configuré et qu’un trop grand nombre de tentatives d’authentification échouent, le point de terminaison renvoie `429` avec un en-tête `Retry-After`.

## Quand utiliser ce point de terminaison

- Préférez-le à l’ajout d’un nouveau canal intégré lorsque votre intégration n’est qu’une autre interface opérateur/client pour le même Gateway.
- Pour les clients mobiles natifs qui se connectent directement à un Gateway distant, préférez [WebChat](/fr/web/webchat) ou le [protocole du Gateway](/fr/gateway/protocol) avec le flux d’amorçage d’appareil appairé/jeton d’appareil, afin que l’appareil n’ait pas besoin d’un jeton ou mot de passe HTTP partagé.
- Créez plutôt un Plugin de canal lorsque vous intégrez un réseau de messagerie externe avec ses propres utilisateurs, salons, livraisons par Webhook ou mécanismes de transport sortant. Consultez [Création de Plugins](/fr/plugins/building-plugins).

## Contrat de modèle centré sur l’agent

OpenClaw traite le champ OpenAI `model` comme une **cible d’agent**, et non comme un identifiant brut de modèle de fournisseur.

| Valeur de `model`                            | Routage                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                   | Agent par défaut configuré                                                                                                            |
| `openclaw/default`                           | Agent par défaut configuré (alias stable, pouvant être codé en dur sans risque même si l’identifiant réel de l’agent par défaut varie selon les environnements) |
| `openclaw/<agentId>` ou `openclaw:<agentId>` | Agent spécifique                                                                                                                      |
| `agent:<agentId>`                            | Agent spécifique (alias de compatibilité)                                                                                             |

En-têtes de requête facultatifs :

| En-tête                                         | Effet                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Remplace le modèle du backend pour l’agent sélectionné. Les appelants utilisant un secret partagé comme jeton porteur peuvent l’employer directement ; les appelants porteurs d’identité (trusted-proxy ou entrée privée sans authentification avec `x-openclaw-scopes`) ont besoin de `operator.admin`, sinon `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Remplacement de compatibilité pour la sélection de l’agent.                                                                                                                                                                                                                                                                        |
| `x-openclaw-session-key: <sessionKey>`          | Routage de session explicite. Refusé avec `400 invalid_request_error` s’il utilise un espace de noms interne réservé (`subagent:`, `cron:`, `acp:`).                                                                                                                                                                                  |
| `x-openclaw-message-channel: <channel>`         | Définit le contexte synthétique du canal d’entrée pour les invites et politiques tenant compte du canal.                                                                                                                                                                                                                           |

`/v1/models` répertorie les cibles d’agent de premier niveau (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), et non les modèles des fournisseurs du backend ni les sous-agents ; les sous-agents restent une topologie d’exécution interne. Si vous omettez `x-openclaw-model`, l’agent sélectionné s’exécute avec son modèle configuré habituel.

`/v1/embeddings` utilise les mêmes identifiants `model` de cibles d’agent. Envoyez `x-openclaw-model` (depuis un appelant utilisant un secret partagé ou un appelant porteur d’identité disposant de `operator.admin`) pour choisir un modèle d’intégration vectorielle spécifique ; sinon, la requête utilise la configuration d’intégration vectorielle habituelle de l’agent sélectionné.

## Comportement des sessions

Par défaut, le point de terminaison est **sans état pour chaque requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête contient une chaîne OpenAI `user`, le Gateway en dérive une clé de session stable afin que les appels répétés puissent partager une session d’agent. Pour les applications personnalisées, réutilisez la même valeur `user` pour chaque fil de conversation ; évitez les identifiants au niveau du compte, sauf si vous souhaitez que plusieurs conversations ou appareils partagent une même session OpenClaw. Utilisez `x-openclaw-session-key` uniquement lorsqu’un contrôle explicite du routage entre plusieurs clients ou fils est nécessaire, avec des clés appartenant à l’application et évitant les espaces de noms réservés ci-dessus.

## Limites des requêtes (configuration)

Les valeurs par défaut peuvent être ajustées sous `gateway.http.endpoints.chatCompletions` :

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Valeurs par défaut en cas d’omission :

| Clé                   | Valeur par défaut                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20 Mo                                                                                                         |
| `maxImageParts`       | 8 (nombre maximal de parties `image_url` lues dans le dernier message de l’utilisateur)                       |
| `maxTotalImageBytes`  | 20 Mo (octets décodés cumulés pour toutes les parties `image_url` d’une requête)                              |
| `images.allowUrl`     | `false` (les parties `image_url` provenant d’une URL sont refusées, sauf activation)                          |
| `images.maxBytes`     | 10 Mo par image                                                                                               |
| `images.maxRedirects` | 3                                                                                                             |
| `images.timeoutMs`    | 10 s                                                                                                          |

Les sources `image_url` HEIC/HEIF sont acceptées et normalisées au format JPEG avant leur transmission au fournisseur par le processeur d’images partagé d’OpenClaw (Rastermill), qui utilise en solution de repli un convertisseur système (`sips`, ImageMagick, GraphicsMagick ou ffmpeg) pour les formats nécessitant la prise en charge d’un codec externe.

Note de sécurité : l’ajout d’un nom d’hôte à la liste d’autorisation ne contourne pas le blocage des adresses IP privées/internes. Pour les Gateway exposés à Internet, appliquez des contrôles des flux réseau sortants en plus des protections au niveau de l’application. Consultez [Sécurité](/fr/gateway/security).

## Contrat de l’outil de chat

`/v1/chat/completions` prend en charge un sous-ensemble d’outils de fonction compatible avec les clients de chat OpenAI courants.

### Champs de requête pris en charge

| Champ                      | Remarques                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Tableau de `{ "type": "function", "function": { ... } }`                                                                                                       |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "function": { "name": "..." } }`                                                                    |
| `messages[*].role: "tool"` | Tours de suivi                                                                                                                                                |
| `messages[*].tool_call_id` | Associe le résultat d’un outil à un appel d’outil antérieur                                                                                                    |
| `max_completion_tokens`    | Nombre ; limite par appel du nombre total de jetons de complétion (jetons de raisonnement inclus). Nom de champ actuel ; utilisé lorsque celui-ci et `max_tokens` sont envoyés. |
| `max_tokens`               | Nombre ; alias historique, ignoré lorsque `max_completion_tokens` est également présent.                                                                       |
| `temperature`              | Nombre de 0 à 2 ; appliqué dans la mesure du possible et transmis au fournisseur en amont. `400 invalid_request_error` si la valeur est hors limites.           |
| `top_p`                    | Nombre de 0 à 1 ; appliqué dans la mesure du possible. `400 invalid_request_error` si la valeur est hors limites.                                               |
| `frequency_penalty`        | Nombre de -2,0 à 2,0 ; appliqué dans la mesure du possible. `400 invalid_request_error` si la valeur est hors limites.                                          |
| `presence_penalty`         | Nombre de -2,0 à 2,0 ; appliqué dans la mesure du possible. `400 invalid_request_error` si la valeur est hors limites.                                          |
| `seed`                     | Entier ; appliqué dans la mesure du possible. `400 invalid_request_error` pour les valeurs non entières.                                                       |
| `stop`                     | Chaîne ou tableau comprenant jusqu’à 4 chaînes ; appliqué dans la mesure du possible. `400 invalid_request_error` pour plus de 4 séquences ou pour des entrées qui ne sont pas des chaînes ou qui sont vides. |

Tous les champs d’échantillonnage et de limite de jetons empruntent le même canal de paramètres de flux de l’agent et sont transmis dans la mesure du possible :

- Limite de jetons : le nom du champ transmis est choisi selon le transport du fournisseur : `max_completion_tokens` pour les points de terminaison de la famille OpenAI, `max_tokens` pour les fournisseurs qui n’acceptent que le nom historique (Mistral, Chutes).
- `stop` est associé au champ d’arrêt du transport : `stop` pour les systèmes dorsaux Chat Completions, `stop_sequences` pour Anthropic. L’API OpenAI Responses ne possède aucun paramètre d’arrêt ; `stop` n’est donc pas appliqué aux modèles reposant sur Responses.
- Le système dorsal Codex Responses basé sur ChatGPT utilise un échantillonnage fixe côté serveur et retire `temperature`/`top_p` (ainsi que `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) avant que la requête ne lui parvienne.

### Variantes non prises en charge

Renvoie `400 invalid_request_error` dans les cas suivants :

- `tools` n’est pas un tableau, contient des entrées qui ne sont pas des outils de fonction, ou `tool.function.name` est absent
- variantes de `tool_choice` telles que `allowed_tools` et `custom`
- valeurs de `tool_choice.function.name` ne correspondant à aucun outil fourni

Pour `tool_choice: "required"` et un `tool_choice` épinglé à une fonction, le point de terminaison restreint l’ensemble exposé des outils de fonction du client, demande à l’environnement d’exécution d’appeler un outil client avant de répondre et renvoie une erreur si la réponse de l’agent ne contient aucun appel structuré correspondant à un outil client. Cela s’applique à la liste HTTP `tools` fournie par l’appelant, et non à tous les outils internes de l’agent OpenClaw.

### Structure d’une réponse d’outil sans diffusion en continu

Lorsque l’agent appelle des outils, la réponse utilise :

- `choices[0].finish_reason = "tool_calls"`
- des entrées `choices[0].message.tool_calls[]` avec `id`, `type: "function"`, `function.name`, `function.arguments` (chaîne JSON)
- le commentaire de l’assistant précédant l’appel d’outil dans `choices[0].message.content` (éventuellement vide)

### Structure d’une réponse d’outil diffusée en continu

Lorsque `stream: true`, les appels d’outils arrivent sous forme de fragments SSE incrémentiels : un delta initial pour le rôle de l’assistant, des deltas facultatifs pour les commentaires de l’assistant, un ou plusieurs fragments `delta.tool_calls` contenant l’identité de l’outil et des fragments d’arguments, puis un fragment final avec `finish_reason: "tool_calls"` et `data: [DONE]`.

Si `stream_options.include_usage=true`, un fragment final d’utilisation est émis avant `[DONE]`.

### Boucle de suivi des outils

Après réception de `tool_calls`, exécutez les fonctions demandées et envoyez une requête de suivi comprenant le message précédent de l’assistant contenant les appels d’outils, ainsi qu’un ou plusieurs messages `role: "tool"` avec le `tool_call_id` correspondant. Cela poursuit la même boucle de raisonnement de l’agent afin de produire la réponse finale.

## Diffusion en continu (SSE)

Définissez `stream: true` pour recevoir des événements envoyés par le serveur :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est au format `data: <json>`
- Le flux se termine par `data: [DONE]`

## Configuration rapide d’Open WebUI

- URL de base : `http://127.0.0.1:18789/v1`
- URL de base de Docker sous macOS : `http://host.docker.internal:18789/v1`
- Clé d’API : votre jeton porteur du Gateway
- Modèle : `openclaw/default`

Comportement attendu : `GET /v1/models` répertorie `openclaw/default`, et Open WebUI l’utilise comme identifiant du modèle de chat. Pour un fournisseur/modèle dorsal spécifique, définissez le modèle par défaut normal de l’agent ou envoyez `x-openclaw-model` (appelant utilisant un secret partagé ou appelant doté d’une identité et de `operator.admin`).

Test de fonctionnement rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cette commande renvoie `openclaw/default`, la plupart des configurations d’Open WebUI peuvent se connecter avec la même URL de base et le même jeton.

## Exemples

Session stable pour une conversation d’application :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Réutilisez la même valeur `user` lors des appels ultérieurs de cette conversation afin de poursuivre la même session d’agent.

Sans diffusion en continu :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Avec diffusion en continu :

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Répertorier les modèles :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Récupérer un modèle :

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Créer des plongements :

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` accepte `input` sous la forme d’une chaîne ou d’un tableau de chaînes.

## Pages associées

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Portées de l’opérateur](/fr/gateway/operator-scopes)
- [OpenAI](/fr/providers/openai)
