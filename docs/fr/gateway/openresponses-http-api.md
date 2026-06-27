---
read_when:
    - Intégrer des clients qui utilisent l’API OpenResponses
    - Vous voulez des entrées basées sur des éléments, des appels d’outils client ou des événements SSE
summary: Exposer un point de terminaison HTTP /v1/responses compatible OpenResponses depuis le Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-06-27T17:31:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Le Gateway d'OpenClaw peut servir un point de terminaison `POST /v1/responses` compatible OpenResponses.

Ce point de terminaison est **désactivé par défaut**. Activez-le d'abord dans la configuration.

- `POST /v1/responses`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/responses`

En interne, les requêtes sont exécutées comme une exécution d'agent Gateway normale (même chemin de code que
`openclaw agent`), donc le routage, les autorisations et la configuration correspondent à votre Gateway.

## Authentification, sécurité et routage

Le comportement opérationnel correspond à [OpenAI Chat Completions](/fr/gateway/openai-http-api) :

- utilisez le chemin d'authentification HTTP Gateway correspondant :
  - authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) : `Authorization: Bearer <token-or-password>`
  - authentification par proxy de confiance (`gateway.auth.mode="trusted-proxy"`) : en-têtes de proxy sensibles à l'identité provenant d'une source de proxy de confiance configurée ; les proxys local loopback sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true`
  - repli direct local du proxy de confiance : les appelants du même hôte sans en-têtes `Forwarded`, `X-Forwarded-*` ou `X-Real-IP` peuvent utiliser `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - authentification ouverte d'entrée privée (`gateway.auth.mode="none"`) : aucun en-tête d'authentification
- traitez le point de terminaison comme un accès opérateur complet pour l'instance Gateway
- pour les modes d'authentification par secret partagé (`token` et `password`), ignorez les valeurs `x-openclaw-scopes` plus restreintes déclarées par le bearer et restaurez les valeurs par défaut normales d'opérateur complet
- pour les modes HTTP avec identité de confiance (par exemple l'authentification par proxy de confiance ou `gateway.auth.mode="none"`), respectez `x-openclaw-scopes` lorsqu'il est présent et, sinon, revenez à l'ensemble normal de portées opérateur par défaut
- sélectionnez les agents avec `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` ou `x-openclaw-agent-id`
- utilisez `x-openclaw-model` lorsque vous souhaitez remplacer le modèle backend de l'agent sélectionné
- utilisez `x-openclaw-session-key` pour un routage explicite de session
- utilisez `x-openclaw-message-channel` lorsque vous souhaitez un contexte de canal d'entrée synthétique non par défaut

Matrice d'authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du Gateway
  - ignore les `x-openclaw-scopes` plus restreints
  - restaure l'ensemble complet de portées opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur ce point de terminaison comme des tours envoyés par le propriétaire
- modes HTTP avec identité de confiance (par exemple authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur une entrée privée)
  - respectent `x-openclaw-scopes` lorsque l'en-tête est présent
  - reviennent à l'ensemble normal de portées opérateur par défaut lorsque l'en-tête est absent
  - ne perdent la sémantique de propriétaire que lorsque l'appelant restreint explicitement les portées et omet `operator.admin`

Activez ou désactivez ce point de terminaison avec `gateway.http.endpoints.responses.enabled`.

La même surface de compatibilité inclut aussi :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Pour l'explication canonique de la façon dont les modèles ciblant des agents, `openclaw/default`, le relais des embeddings et les remplacements de modèle backend s'articulent, consultez [OpenAI Chat Completions](/fr/gateway/openai-http-api#agent-first-model-contract) et [Liste des modèles et routage des agents](/fr/gateway/openai-http-api#model-list-and-agent-routing).

## Comportement des sessions

Par défaut, le point de terminaison est **sans état par requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenResponses `user`, le Gateway en dérive une clé de session stable,
afin que les appels répétés puissent partager une session d'agent.

## Forme de la requête (prise en charge)

La requête suit l'API OpenResponses avec une entrée basée sur des éléments. Prise en charge actuelle :

- `input` : chaîne ou tableau d'objets élément.
- `instructions` : fusionné dans le prompt système.
- `tools` : définitions d'outils client (outils de fonction).
- `tool_choice` : `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "name": "..." }` pour filtrer ou exiger des outils client.
- `stream` : active le streaming SSE.
- `max_output_tokens` : limite de sortie au mieux (selon le fournisseur).
- `temperature` : température d'échantillonnage au mieux transmise au fournisseur. Ignorée par le backend Codex Responses basé sur ChatGPT, qui utilise un échantillonnage fixe côté serveur.
- `top_p` : échantillonnage par noyau au mieux transmis au fournisseur. Même réserve Codex Responses que pour `temperature`.
- `user` : routage de session stable.

Acceptés mais **actuellement ignorés** :

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Pris en charge :

- `previous_response_id` : OpenClaw réutilise la session de réponse précédente lorsque la requête reste dans la même portée d'agent, d'utilisateur ou de session demandée.

## Éléments (entrée)

### `message`

Rôles : `system`, `developer`, `user`, `assistant`.

- `system` et `developer` sont ajoutés au prompt système.
- L'élément `user` ou `function_call_output` le plus récent devient le « message actuel ».
- Les messages utilisateur/assistant antérieurs sont inclus comme historique pour le contexte.

### `function_call_output` (outils basés sur les tours)

Renvoyez les résultats d'outils au modèle :

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` et `item_reference`

Acceptés pour la compatibilité du schéma, mais ignorés lors de la construction du prompt.

## Outils (outils de fonction côté client)

Fournissez des outils avec `tools: [{ type: "function", name, description?, parameters? }]`.

Si l'agent décide d'appeler un outil, la réponse renvoie un élément de sortie `function_call`.
Vous envoyez ensuite une requête de suivi avec `function_call_output` pour poursuivre le tour.

Pour `tool_choice: "required"` et `tool_choice` épinglé sur une fonction, le point de terminaison restreint l'ensemble exposé d'outils de fonction client, indique au runtime d'appeler un outil client avant de répondre, et rejette le tour s'il n'inclut pas d'appel structuré correspondant à un outil client. Ce contrat s'applique à la liste HTTP `tools` fournie par l'appelant, et non à tous les outils internes d'agent OpenClaw. Les requêtes sans streaming renvoient `502` avec une `api_error` ; les requêtes en streaming émettent un événement `response.failed`. Cela correspond au contrat `/v1/chat/completions`.

## Images (`input_image`)

Prend en charge les sources base64 ou URL :

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Types MIME autorisés (actuels) : `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Taille maximale (actuelle) : 10MB.

## Fichiers (`input_file`)

Prend en charge les sources base64 ou URL :

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

Types MIME autorisés (actuels) : `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Taille maximale (actuelle) : 5MB.

Comportement actuel :

- Le contenu du fichier est décodé et ajouté au **prompt système**, pas au message utilisateur,
  afin qu'il reste éphémère (non persisté dans l'historique de session).
- Le texte décodé du fichier est enveloppé comme **contenu externe non fiable** avant d'être ajouté,
  afin que les octets du fichier soient traités comme des données, et non comme des instructions de confiance.
- Le bloc injecté utilise des marqueurs de limite explicites comme
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées
  `Source: External`.
- Ce chemin d'entrée de fichier omet intentionnellement la longue bannière `SECURITY NOTICE:` afin de
  préserver le budget de prompt ; les marqueurs de limite et les métadonnées restent tout de même en place.
- Les PDF sont d'abord analysés pour en extraire le texte. Si peu de texte est trouvé, les premières pages sont
  rastérisées en images et transmises au modèle, et le bloc de fichier injecté utilise
  l'espace réservé `[PDF content rendered to images]`.

L'analyse des PDF est fournie par le Plugin intégré `document-extract`, qui utilise
`clawpdf` et son runtime PDFium WebAssembly empaqueté pour l'extraction de texte et le
rendu de pages.

Valeurs par défaut de récupération d'URL :

- `files.allowUrl` : `true`
- `images.allowUrl` : `true`
- `maxUrlParts` : `8` (nombre total de parties `input_file` + `input_image` basées sur des URL par requête)
- Les requêtes sont protégées (résolution DNS, blocage des IP privées, plafonds de redirection, délais d'expiration).
- Des listes d'autorisation de noms d'hôte facultatives sont prises en charge par type d'entrée (`files.urlAllowlist`, `images.urlAllowlist`).
  - Hôte exact : `"cdn.example.com"`
  - Sous-domaines génériques : `"*.assets.example.com"` (ne correspond pas à l'apex)
  - Les listes d'autorisation vides ou omises signifient qu'aucune restriction par liste d'autorisation de nom d'hôte ne s'applique.
- Pour désactiver entièrement les récupérations basées sur URL, définissez `files.allowUrl: false` et/ou `images.allowUrl: false`.

## Limites fichiers + images (configuration)

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
            maxChars: 200000,
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

Valeurs par défaut lorsqu'elles sont omises :

- `maxBodyBytes` : 20MB
- `maxUrlParts` : 8
- `files.maxBytes` : 5MB
- `files.maxChars` : 200k
- `files.maxRedirects` : 3
- `files.timeoutMs` : 10s
- `files.pdf.maxPages` : 4
- `files.pdf.maxPixels` : 4,000,000
- `files.pdf.minTextChars` : 200
- `images.maxBytes` : 10MB
- `images.maxRedirects` : 3
- `images.timeoutMs` : 10s
- Les sources HEIC/HEIF `input_image` sont acceptées lorsqu'un convertisseur système est disponible et sont normalisées en JPEG avant livraison au fournisseur. Les convertisseurs pris en charge sont `sips` sur macOS, ImageMagick, GraphicsMagick ou ffmpeg.

Note de sécurité :

- Les listes d'autorisation d'URL sont appliquées avant la récupération et lors des sauts de redirection.
- L'autorisation d'un nom d'hôte ne contourne pas le blocage des IP privées/internes.
- Pour les gateways exposés à Internet, appliquez des contrôles de sortie réseau en plus des protections au niveau de l'application.
  Consultez [Sécurité](/fr/gateway/security).

## Streaming (SSE)

Définissez `stream: true` pour recevoir des Server-Sent Events (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d'événement est `event: <type>` et `data: <json>`
- Le flux se termine par `data: [DONE]`

Types d'événements actuellement émis :

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (en cas d'erreur)

## Utilisation

`usage` est rempli lorsque le fournisseur sous-jacent signale des décomptes de tokens.
OpenClaw normalise les alias courants de style OpenAI avant que ces compteurs n'atteignent
les surfaces de statut/session en aval, notamment `input_tokens` / `output_tokens`
et `prompt_tokens` / `completion_tokens`.

## Erreurs

Les erreurs utilisent un objet JSON comme :

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Cas courants :

- `401` authentification manquante/invalide
- `400` corps de requête invalide
- `405` méthode incorrecte

## Exemples

Sans streaming :

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

Streaming :

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

## Articles connexes

- [Complétions de chat OpenAI](/fr/gateway/openai-http-api)
- [OpenAI](/fr/providers/openai)
