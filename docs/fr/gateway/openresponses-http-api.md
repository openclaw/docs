---
read_when:
    - Intégration des clients compatibles avec l’API OpenResponses
    - Vous souhaitez des entrées basées sur des éléments, des appels d’outils côté client ou des événements SSE
summary: Exposez un endpoint HTTP `/v1/responses` compatible avec OpenResponses depuis le Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-12T15:25:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Le Gateway peut fournir un point de terminaison `POST /v1/responses` compatible avec OpenResponses. Il est **désactivé par défaut** et partage son port avec le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/responses`.

Les requêtes sont exécutées comme une exécution d’agent Gateway normale (même chemin de code que `openclaw agent`) ; le routage, les autorisations et la configuration correspondent donc à ceux de votre Gateway.

Activez-le ou désactivez-le avec `gateway.http.endpoints.responses.enabled`. Lorsqu’elle est activée, la même surface de compatibilité fournit également `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` et `POST /v1/chat/completions`.

## Authentification, sécurité et routage

Le comportement opérationnel correspond à celui de [OpenAI Chat Completions](/fr/gateway/openai-http-api) :

- Le chemin d’authentification correspond à `gateway.auth.mode` : le secret partagé (`token`/`password`) utilise `Authorization: Bearer <token-or-password>` ; le proxy de confiance utilise les en-têtes d’un proxy tenant compte de l’identité (les proxys en boucle locale sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true`, avec un accès direct de secours sur le même hôte via `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` lorsqu’aucun en-tête `Forwarded`/`X-Forwarded-*`/`X-Real-IP` n’est présent) ; `none` sur un point d’entrée privé ne nécessite aucun en-tête d’authentification. Consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).
- Considérez le point de terminaison comme donnant un accès opérateur complet à l’instance du Gateway.
- Les modes d’authentification par secret partagé ignorent un `x-openclaw-scopes` plus restreint déclaré dans le jeton Bearer et rétablissent l’ensemble complet des portées opérateur par défaut : `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Les tours de conversation sur ce point de terminaison sont traités comme des tours envoyés par le propriétaire.
- Les modes HTTP de confiance porteurs d’identité (proxy de confiance ou `gateway.auth.mode="none"`) respectent `x-openclaw-scopes` lorsqu’il est présent ; sinon, ils utilisent par défaut l’ensemble des portées opérateur. La sémantique de propriétaire n’est perdue que lorsque l’appelant restreint explicitement les portées et omet `operator.admin`.
- Sélectionnez les agents avec `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` ou l’en-tête `x-openclaw-agent-id`.
- Utilisez `x-openclaw-model` pour remplacer le modèle de backend de l’agent sélectionné (nécessite `operator.admin` sur les chemins d’authentification porteurs d’identité).
- Utilisez `x-openclaw-session-key` pour le routage explicite des sessions (rejeté avec `400 invalid_request_error` s’il utilise un espace de noms réservé : `subagent:`, `cron:`, `acp:`).
- Utilisez `x-openclaw-message-channel` pour un contexte de canal d’entrée synthétique différent de celui par défaut.

Pour obtenir l’explication canonique des modèles ciblant des agents, de `openclaw/default`, de la transmission directe des embeddings et des remplacements de modèle de backend, consultez [OpenAI Chat Completions](/fr/gateway/openai-http-api#agent-first-model-contract).

Consultez [Portées opérateur](/fr/gateway/operator-scopes) et [Sécurité](/fr/gateway/security).

## Comportement des sessions

Par défaut, le point de terminaison est **sans état pour chaque requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenResponses `user`, le Gateway en dérive une clé de session stable afin que les appels répétés puissent partager une session d’agent.

`previous_response_id` réutilise la session de la réponse précédente lorsque la requête reste dans la même portée d’agent, d’utilisateur et de session demandée (correspondance établie selon le sujet d’authentification, l’identifiant de l’agent et `x-openclaw-session-key`).

## Structure de la requête

| Champ                                                            | Prise en charge                                                                                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Chaîne ou tableau d’objets d’élément.                                                                                                              |
| `instructions`                                                   | Fusionnées dans le prompt système.                                                                                                                 |
| `tools`                                                          | Définitions des outils du client (outils de fonction).                                                                                             |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "name": "..." }` pour filtrer ou imposer les outils du client.                          |
| `stream`                                                         | Active la diffusion en continu via SSE.                                                                                                            |
| `max_output_tokens`                                              | Limite de sortie appliquée au mieux (selon le fournisseur).                                                                                        |
| `temperature`                                                    | Température d’échantillonnage appliquée au mieux. Ignorée par le backend Codex Responses basé sur ChatGPT, qui utilise un échantillonnage fixe côté serveur. |
| `top_p`                                                          | Échantillonnage par noyau appliqué au mieux. Même réserve concernant Codex Responses que pour `temperature`.                                       |
| `user`                                                           | Routage stable des sessions.                                                                                                                       |
| `previous_response_id`                                           | Continuité de session (voir ci-dessus).                                                                                                            |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Acceptés, mais actuellement ignorés.                                                                                                               |

## Éléments (entrée)

### `message`

Rôles : `system`, `developer`, `user`, `assistant`.

- `system` et `developer` sont ajoutés au prompt système.
- L’élément `user` ou `function_call_output` le plus récent devient le « message actuel ».
- Les messages utilisateur/assistant antérieurs sont inclus dans l’historique pour fournir le contexte.

### `function_call_output` (outils par tour)

Renvoyez les résultats des outils au modèle :

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` et `item_reference`

Acceptés à des fins de compatibilité du schéma, mais ignorés lors de la construction du prompt.

## Outils (outils de fonction côté client)

Fournissez des outils avec `tools: [{ type: "function", name, description?, parameters? }]`.

Si l’agent appelle un outil, la réponse renvoie un élément de sortie `function_call`. Envoyez une requête de suivi avec `function_call_output` pour poursuivre le tour.

Pour `tool_choice: "required"` et un `tool_choice` fixé à une fonction, le point de terminaison restreint l’ensemble des outils de fonction client exposés, demande au runtime d’appeler un outil client avant de répondre et rejette le tour s’il ne comprend pas un appel structuré correspondant à un outil client, conformément au contrat de `/v1/chat/completions`. Les requêtes sans streaming renvoient `502` avec une `api_error` ; les requêtes avec streaming émettent un événement `response.failed`.

## Images (`input_image`)

Prend en charge les sources en base64 ou par URL :

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Types MIME autorisés (par défaut) : `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Taille maximale (par défaut) : 10MB.

## Fichiers (`input_file`)

Prend en charge les sources en base64 ou par URL :

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Types MIME autorisés (par défaut) : `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Taille maximale (par défaut) : 5MB.

Comportement actuel :

- Le contenu du fichier est décodé et ajouté au **prompt système**, et non au message utilisateur ; il reste donc éphémère (il n’est pas conservé dans l’historique de session).
- Le texte décodé du fichier est encapsulé en tant que **contenu externe non fiable** avant d’être ajouté, afin que les octets du fichier soient traités comme des données et non comme des instructions fiables. Le bloc injecté utilise des marqueurs de délimitation explicites (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) et une ligne de métadonnées `Source: External`. Il omet volontairement la longue bannière `SECURITY NOTICE:` afin de préserver le budget du prompt ; les marqueurs de délimitation et les métadonnées restent applicables.
- Le texte des PDF est d’abord extrait. Si peu de texte est trouvé, les premières pages sont rastérisées en images et transmises au modèle, et le bloc de fichier injecté utilise l’espace réservé `[PDF content rendered to images]`.

L’analyse des PDF est assurée par le plugin `document-extract` inclus, qui utilise `clawpdf` et son runtime PDFium WebAssembly intégré pour l’extraction du texte et le rendu des pages.

Paramètres par défaut de récupération des URL :

- `files.allowUrl` : `true`
- `images.allowUrl` : `true`
- `maxUrlParts` : `8` (nombre total de parties `input_file` + `input_image` basées sur une URL par requête)
- Les requêtes sont protégées (résolution DNS, blocage des adresses IP privées, limites de redirections, délais d’expiration).
- Des listes facultatives d’hôtes autorisés sont prises en charge pour chaque type d’entrée (`files.urlAllowlist`, `images.urlAllowlist`) : hôte exact (`"cdn.example.com"`) ou sous-domaines génériques (`"*.assets.example.com"`, ne correspond pas au domaine racine). Une liste vide ou omise signifie qu’aucune restriction par liste d’hôtes autorisés ne s’applique.
- Pour désactiver complètement les récupérations basées sur des URL, définissez `files.allowUrl: false` et/ou `images.allowUrl: false`.

## Limites des fichiers et des images (configuration)

Les valeurs par défaut peuvent être ajustées sous `gateway.http.endpoints.responses` :

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 60000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

| Clé                      | Valeur par défaut |
| ------------------------ | ----------------- |
| `maxBodyBytes`           | 20MB              |
| `maxUrlParts`            | 8                 |
| `files.maxBytes`         | 5MB               |
| `files.maxChars`         | 60k               |
| `files.maxRedirects`     | 3                 |
| `files.timeoutMs`        | 10s               |
| `files.pdf.maxPages`     | 4                 |
| `files.pdf.maxPixels`    | 4,000,000         |
| `files.pdf.minTextChars` | 200               |
| `images.maxBytes`        | 10MB              |
| `images.maxRedirects`    | 3                 |
| `images.timeoutMs`       | 10s               |

Les sources `input_image` HEIC/HEIF sont normalisées en JPEG avant leur transmission au fournisseur par le processeur d’images partagé d’OpenClaw (Rastermill), qui utilise en solution de repli un convertisseur système (`sips`, ImageMagick, GraphicsMagick ou ffmpeg) pour les formats nécessitant la prise en charge d’un codec externe.

Note de sécurité : les listes d’URL autorisées sont appliquées avant la récupération et à chaque redirection. L’autorisation d’un nom d’hôte ne contourne pas le blocage des adresses IP privées ou internes. Pour les Gateways exposés à Internet, appliquez des contrôles de sortie réseau en plus des protections au niveau de l’application. Consultez la section [Sécurité](/fr/gateway/security).

## Streaming (SSE)

Définissez `stream: true` pour recevoir des événements envoyés par le serveur :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est au format `event: <type>` et `data: <json>`
- Le flux se termine par `data: [DONE]`

Types d’événements actuellement émis : `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (en cas d’erreur).

## Utilisation

`usage` est renseigné lorsque le fournisseur sous-jacent indique le nombre de jetons. OpenClaw normalise les alias courants de style OpenAI avant que ces compteurs n’atteignent les surfaces d’état et de session en aval, notamment `input_tokens` / `output_tokens` et `prompt_tokens` / `completion_tokens`.

## Erreurs

Les erreurs utilisent un objet JSON comme celui-ci :

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Cas courants : `400` corps de requête non valide, `401` authentification absente ou non valide, `403` portée d’opérateur absente, `405` méthode incorrecte, `429` trop de tentatives d’authentification échouées (avec `Retry-After`).

## Exemples

Sans diffusion en continu :

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Avec diffusion en continu :

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Voir aussi

- [Complétions de chat OpenAI](/fr/gateway/openai-http-api)
- [Portées d’opérateur](/fr/gateway/operator-scopes)
- [OpenAI](/fr/providers/openai)
