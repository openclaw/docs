---
read_when:
    - Intégration d’outils qui utilisent les Chat Completions d’OpenAI
summary: Exposez un point de terminaison HTTP `/v1/chat/completions` compatible avec OpenAI depuis le Gateway
title: Complétions de chat OpenAI
x-i18n:
    generated_at: "2026-07-12T15:21:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Le Gateway peut exposer une petite interface Chat Completions compatible avec OpenAI. Elle est **désactivée par défaut**.

Une fois activée, elle expose tous les points de terminaison suivants sur le même port que le Gateway (multiplexage WS + HTTP) :

| Méthode | Chemin                 |
| ------- | ---------------------- |
| POST    | `/v1/chat/completions` |
| GET     | `/v1/models`           |
| GET     | `/v1/models/{id}`      |
| POST    | `/v1/embeddings`       |
| POST    | `/v1/responses`        |

Les requêtes s’exécutent comme une exécution normale d’un agent du Gateway (même chemin de code que `openclaw agent`) ; le routage, les autorisations et la configuration correspondent donc à ceux de votre Gateway.

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
- Les requêtes empruntent le même chemin d’agent du plan de contrôle que les actions d’un opérateur de confiance. Par conséquent, si la politique de l’agent cible autorise des outils sensibles, ce point de terminaison peut les utiliser.
- Limitez-le à l’interface de bouclage, au tailnet ou à une entrée privée. Ne l’exposez pas à l’Internet public.

Matrice d’authentification :

| Chemin d’authentification                                                                            | Comportement                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`                            | Prouve la possession du secret partagé du Gateway. Ignore tout en-tête `x-openclaw-scopes` et rétablit l’ensemble complet des périmètres opérateur par défaut : `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Traite les tours de conversation comme provenant du propriétaire. |
| HTTP de confiance avec identité (authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur une entrée privée) | Respecte `x-openclaw-scopes` lorsqu’il est présent ; utilise l’ensemble des périmètres opérateur par défaut lorsqu’il est absent. Ne perd la sémantique de propriétaire que lorsque l’appelant restreint explicitement les périmètres et omet `operator.admin`. Nécessite `operator.admin` pour les contrôles de niveau propriétaire tels que `x-openclaw-model`.                        |

Consultez [Périmètres opérateur](/fr/gateway/operator-scopes), [Sécurité](/fr/gateway/security) et [Accès distant](/fr/gateway/remote).

## Authentification

Utilise la configuration d’authentification du Gateway (consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour les détails de ce mode) :

| Mode                                | Méthode d’authentification                                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Défini via `gateway.auth.token` ou `OPENCLAW_GATEWAY_TOKEN`.                                                                                                  |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Défini via `gateway.auth.password` ou `OPENCLAW_GATEWAY_PASSWORD`.                                                                                         |
| `gateway.auth.mode="trusted-proxy"` | Faites transiter la requête par le proxy configuré tenant compte de l’identité ; il injecte les en-têtes d’identité requis. Les proxys de bouclage sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true`. |
| `gateway.auth.mode="none"`          | Aucun en-tête d’authentification requis (entrée privée uniquement).                                                                                                                            |

Remarques :

- Les appelants du même hôte qui contournent le proxy sur un Gateway `trusted-proxy` peuvent utiliser directement `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` comme solution de repli. Toute présence d’un en-tête `Forwarded`, `X-Forwarded-*` ou `X-Real-IP` maintient plutôt la requête sur le chemin du proxy de confiance.
- Si `gateway.auth.rateLimit` est configuré et qu’un trop grand nombre de tentatives d’authentification échouent, le point de terminaison renvoie `429` avec un en-tête `Retry-After`.

## Quand utiliser ce point de terminaison

- Préférez cette solution à l’ajout d’un nouveau canal intégré lorsque votre intégration constitue simplement une autre interface opérateur/client pour le même Gateway.
- Pour les clients mobiles natifs qui se connectent directement à un Gateway distant, préférez [WebChat](/fr/web/webchat) ou le [protocole du Gateway](/fr/gateway/protocol) avec le flux d’amorçage d’appareil appairé/jeton d’appareil, afin que l’appareil n’ait pas besoin d’un jeton ou mot de passe HTTP partagé.
- Créez plutôt un Plugin de canal lorsque vous intégrez un réseau de messagerie externe avec ses propres utilisateurs, salons, livraisons par Webhook ou transports sortants. Consultez [Création de plugins](/fr/plugins/building-plugins).

## Contrat de modèle centré sur l’agent

OpenClaw considère le champ OpenAI `model` comme une **cible d’agent**, et non comme l’identifiant brut d’un modèle de fournisseur.

| Valeur de `model`                           | Routage                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                  | Agent par défaut configuré                                                                                                     |
| `openclaw/default`                          | Agent par défaut configuré (alias stable ; peut être codé en dur sans risque même si l’identifiant réel de l’agent par défaut change selon l’environnement) |
| `openclaw/<agentId>` ou `openclaw:<agentId>` | Agent spécifique                                                                                                               |
| `agent:<agentId>`                           | Agent spécifique (alias de compatibilité)                                                                                      |

En-têtes de requête facultatifs :

| En-tête                                         | Effet                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Remplace le modèle du moteur pour l’agent sélectionné. Les appelants utilisant un secret partagé de type bearer peuvent l’utiliser directement ; les appelants avec identité (proxy de confiance ou entrée privée sans authentification avec `x-openclaw-scopes`) nécessitent `operator.admin`, faute de quoi la réponse est `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Remplacement de compatibilité pour la sélection de l’agent.                                                                                                                                                                                                                |
| `x-openclaw-session-key: <sessionKey>`          | Routage explicite de la session. Rejeté avec `400 invalid_request_error` s’il utilise un espace de noms interne réservé (`subagent:`, `cron:`, `acp:`).                                                                                                                     |
| `x-openclaw-message-channel: <channel>`         | Définit le contexte synthétique du canal d’entrée pour les invites/politiques tenant compte du canal.                                                                                                                                                                     |

`/v1/models` répertorie les cibles d’agents de premier niveau (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), et non les modèles des fournisseurs sous-jacents ni les sous-agents ; les sous-agents restent une topologie d’exécution interne. Si vous omettez `x-openclaw-model`, l’agent sélectionné s’exécute avec son modèle normalement configuré.

`/v1/embeddings` utilise les mêmes identifiants `model` de cible d’agent. Envoyez `x-openclaw-model` (depuis un appelant utilisant un secret partagé, ou un appelant avec identité disposant de `operator.admin`) pour sélectionner un modèle d’intégration vectorielle précis ; sinon, la requête utilise la configuration d’intégration vectorielle habituelle de l’agent sélectionné.

## Comportement des sessions

Par défaut, le point de terminaison est **sans état pour chaque requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête contient une chaîne OpenAI `user`, le Gateway en dérive une clé de session stable afin que les appels répétés puissent partager une session d’agent. Pour les applications personnalisées, réutilisez la même valeur `user` pour chaque fil de conversation ; évitez les identifiants au niveau du compte, sauf si vous souhaitez que plusieurs conversations/appareils partagent une même session OpenClaw. Utilisez `x-openclaw-session-key` uniquement lorsque vous avez besoin d’un contrôle explicite du routage entre plusieurs clients/fils, avec des clés appartenant à l’application qui évitent les espaces de noms réservés ci-dessus.

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

| Clé                   | Valeur par défaut                                                               |
| --------------------- | ------------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                            |
| `maxImageParts`       | 8 (nombre maximal de parties `image_url` lues dans le dernier message utilisateur) |
| `maxTotalImageBytes`  | 20MB (octets décodés cumulés pour toutes les parties `image_url` d’une requête) |
| `images.allowUrl`     | `false` (les parties `image_url` provenant d’une URL sont rejetées sauf activation) |
| `images.maxBytes`     | 10MB par image                                                                  |
| `images.maxRedirects` | 3                                                                               |
| `images.timeoutMs`    | 10s                                                                             |

Les sources `image_url` HEIC/HEIF sont acceptées et normalisées en JPEG avant leur transmission au fournisseur par le processeur d’images partagé d’OpenClaw (Rastermill), qui utilise comme solution de repli un convertisseur système (`sips`, ImageMagick, GraphicsMagick ou ffmpeg) pour les formats nécessitant la prise en charge d’un codec externe.

Note de sécurité : l’ajout d’un nom d’hôte à une liste d’autorisation ne contourne pas le blocage des adresses IP privées/internes. Pour les Gateway exposés à Internet, appliquez des contrôles de sortie réseau en plus des protections au niveau de l’application. Consultez [Sécurité](/fr/gateway/security).

## Contrat de l’outil de chat

`/v1/chat/completions` prend en charge un sous-ensemble d’outils de fonction compatible avec les clients OpenAI Chat courants.

### Champs de requête pris en charge

| Champ                      | Remarques                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Tableau de `{ "type": "function", "function": { ... } }`                                                                                                      |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "function": { "name": "..." } }`                                                                   |
| `messages[*].role: "tool"` | Tours de suivi                                                                                                                                                 |
| `messages[*].tool_call_id` | Associe le résultat d’un outil à un appel d’outil antérieur                                                                                                   |
| `max_completion_tokens`    | Nombre ; plafond par appel du nombre total de jetons de complétion (jetons de raisonnement inclus). Nom de champ actuel ; utilisé lorsque lui et `max_tokens` sont envoyés. |
| `max_tokens`               | Nombre ; ancien alias, ignoré lorsque `max_completion_tokens` est également présent.                                                                          |
| `temperature`              | Nombre de 0 à 2 ; transmis au fournisseur en amont dans la mesure du possible. `400 invalid_request_error` si hors limites.                                   |
| `top_p`                    | Nombre de 0 à 1 ; appliqué dans la mesure du possible. `400 invalid_request_error` si hors limites.                                                           |
| `frequency_penalty`        | Nombre de -2.0 à 2.0 ; appliqué dans la mesure du possible. `400 invalid_request_error` si hors limites.                                                      |
| `presence_penalty`         | Nombre de -2.0 à 2.0 ; appliqué dans la mesure du possible. `400 invalid_request_error` si hors limites.                                                      |
| `seed`                     | Entier ; appliqué dans la mesure du possible. `400 invalid_request_error` pour les valeurs non entières.                                                      |
| `stop`                     | Chaîne ou tableau comportant jusqu’à 4 chaînes ; appliqué dans la mesure du possible. `400 invalid_request_error` pour plus de 4 séquences ou des entrées qui ne sont pas des chaînes ou sont vides. |

Tous les champs d’échantillonnage et de plafonnement des jetons empruntent le même canal de paramètres de flux de l’agent et sont transmis dans la mesure du possible :

- Plafond de jetons : le nom du champ sur le protocole est choisi par le transport du fournisseur : `max_completion_tokens` pour les points de terminaison de la famille OpenAI, `max_tokens` pour les fournisseurs qui n’acceptent que l’ancien nom (Mistral, Chutes).
- `stop` correspond au champ d’arrêt du transport : `stop` pour les backends Chat Completions, `stop_sequences` pour Anthropic. L’API OpenAI Responses ne possède aucun paramètre d’arrêt ; `stop` n’est donc pas appliqué aux modèles reposant sur Responses.
- Le backend Codex Responses basé sur ChatGPT utilise un échantillonnage fixe côté serveur et supprime `temperature`/`top_p` (ainsi que `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) avant que la requête n’atteigne ce backend.

### Variantes non prises en charge

Renvoie `400 invalid_request_error` pour :

- `tools` qui n’est pas un tableau, les entrées d’outil qui ne sont pas des fonctions ou l’absence de `tool.function.name`
- les variantes de `tool_choice` telles que `allowed_tools` et `custom`
- les valeurs de `tool_choice.function.name` qui ne correspondent pas à un outil fourni

Pour `tool_choice: "required"` et un `tool_choice` fixé à une fonction, le point de terminaison restreint l’ensemble exposé des outils de fonction du client, demande au runtime d’appeler un outil client avant de répondre et renvoie une erreur si la réponse de l’agent ne contient aucun appel structuré correspondant à un outil client. Cela s’applique à la liste HTTP `tools` fournie par l’appelant, et non à tous les outils internes de l’agent OpenClaw.

### Structure d’une réponse d’outil sans diffusion en continu

Lorsque l’agent appelle des outils, la réponse utilise :

- des entrées `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` avec `id`, `type: "function"`, `function.name`, `function.arguments` (chaîne JSON)
- les commentaires de l’assistant précédant l’appel d’outil dans `choices[0].message.content` (éventuellement vide)

### Structure d’une réponse d’outil diffusée en continu

Lorsque `stream: true`, les appels d’outils arrivent sous forme de fragments SSE incrémentiels : un delta initial de rôle assistant, des deltas facultatifs de commentaires de l’assistant, un ou plusieurs fragments `delta.tool_calls` contenant l’identité de l’outil et des fragments d’arguments, puis un fragment final avec `finish_reason: "tool_calls"` et `data: [DONE]`.

Si `stream_options.include_usage=true`, un fragment final d’utilisation est émis avant `[DONE]`.

### Boucle de suivi des outils

Après réception de `tool_calls`, exécutez la ou les fonctions demandées et envoyez une requête de suivi comprenant le message antérieur d’appel d’outil de l’assistant ainsi qu’un ou plusieurs messages `role: "tool"` avec un `tool_call_id` correspondant. Cela poursuit la même boucle de raisonnement de l’agent afin de produire la réponse finale.

## Diffusion en continu (SSE)

Définissez `stream: true` pour recevoir des événements envoyés par le serveur :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `data: <json>`
- Le flux se termine par `data: [DONE]`

## Configuration rapide d’Open WebUI

- URL de base : `http://127.0.0.1:18789/v1`
- URL de base de Docker sur macOS : `http://host.docker.internal:18789/v1`
- Clé d’API : votre jeton porteur du Gateway
- Modèle : `openclaw/default`

Comportement attendu : `GET /v1/models` répertorie `openclaw/default`, et Open WebUI l’utilise comme identifiant du modèle de chat. Pour un fournisseur/modèle de backend précis, définissez le modèle par défaut normal de l’agent ou envoyez `x-openclaw-model` (appelant avec secret partagé ou appelant porteur d’une identité avec `operator.admin`).

Test de vérification rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cette commande renvoie `openclaw/default`, la plupart des configurations Open WebUI peuvent se connecter avec la même URL de base et le même jeton.

## Exemples

Session stable pour une conversation d’application :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Résume mes tâches pour aujourd’hui"}]
  }'
```

Réutilisez la même valeur `user` lors des appels ultérieurs pour cette conversation afin de poursuivre la même session d’agent.

Sans diffusion en continu :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"bonjour"}]
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
    "messages": [{"role":"user","content":"bonjour"}]
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

Créer des plongements vectoriels :

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "bêta"]
  }'
```

`/v1/embeddings` prend en charge `input` sous forme de chaîne ou de tableau de chaînes.

## Pages connexes

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Portées de l’opérateur](/fr/gateway/operator-scopes)
- [OpenAI](/fr/providers/openai)
