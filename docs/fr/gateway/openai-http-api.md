---
read_when:
    - Intégrer des outils qui attendent OpenAI Chat Completions
summary: Exposer un point de terminaison HTTP /v1/chat/completions compatible avec OpenAI depuis le Gateway
title: Complétions de chat OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway peut servir un petit endpoint Chat Completions compatible OpenAI.

Cet endpoint est **désactivé par défaut**. Activez-le d’abord dans la configuration.

- `POST /v1/chat/completions`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/chat/completions`

Lorsque la surface HTTP compatible OpenAI du Gateway est activée, elle sert aussi :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

En interne, les requêtes sont exécutées comme une exécution d’agent Gateway normale (même chemin de code que `openclaw agent`), donc le routage, les permissions et la configuration correspondent à votre Gateway.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins d’authentification HTTP courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP de confiance portant une identité (`gateway.auth.mode="trusted-proxy"`) :
  routez via le proxy configuré sensible à l’identité et laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Notes :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy de confiance configurée ; les proxys loopback sur le même hôte nécessitent explicitement
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification se produisent, l’endpoint renvoie `429` avec `Retry-After`.

## Limite de sécurité (important)

Traitez cet endpoint comme une surface à **accès opérateur complet** pour l’instance de gateway.

- L’authentification HTTP bearer ici n’est pas un modèle à périmètre étroit par utilisateur.
- Un token/mot de passe Gateway valide pour cet endpoint doit être traité comme un identifiant propriétaire/opérateur.
- Les requêtes passent par le même chemin d’agent du plan de contrôle que les actions d’opérateur de confiance.
- Il n’existe pas de limite d’outils séparée non-propriétaire/par utilisateur sur cet endpoint ; dès qu’un appelant réussit l’authentification Gateway ici, OpenClaw le traite comme un opérateur de confiance pour ce gateway.
- Pour les modes d’authentification par secret partagé (`token` et `password`), l’endpoint restaure les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus étroit.
- Les modes HTTP de confiance portant une identité (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"`) honorent `x-openclaw-scopes` lorsqu’il est présent et se replient sinon sur l’ensemble de périmètres opérateur par défaut normal.
- Si la stratégie de l’agent cible autorise des outils sensibles, cet endpoint peut les utiliser.
- Gardez cet endpoint uniquement sur loopback/tailnet/ingress privé ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du gateway
  - ignore un `x-openclaw-scopes` plus étroit
  - restaure l’ensemble complet des périmètres opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur cet endpoint comme des tours envoyés par le propriétaire
- modes HTTP de confiance portant une identité (par exemple l’authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur ingress privé)
  - authentifient une identité externe de confiance ou une limite de déploiement
  - honorent `x-openclaw-scopes` lorsque l’en-tête est présent
  - se replient sur l’ensemble de périmètres opérateur par défaut normal lorsque l’en-tête est absent
  - ne perdent la sémantique de propriétaire que lorsque l’appelant réduit explicitement les périmètres et omet `operator.admin`

Voir [Sécurité](/fr/gateway/security) et [Accès distant](/fr/gateway/remote).

## Contrat de modèle axé agent

OpenClaw traite le champ OpenAI `model` comme une **cible d’agent**, pas comme un identifiant brut de modèle fournisseur.

- `model: "openclaw"` route vers l’agent par défaut configuré.
- `model: "openclaw/default"` route aussi vers l’agent par défaut configuré.
- `model: "openclaw/<agentId>"` route vers un agent spécifique.

En-têtes de requête facultatifs :

- `x-openclaw-model: <provider/model-or-bare-id>` remplace le modèle backend pour l’agent sélectionné.
- `x-openclaw-agent-id: <agentId>` reste pris en charge comme remplacement de compatibilité.
- `x-openclaw-session-key: <sessionKey>` contrôle entièrement le routage de session.
- `x-openclaw-message-channel: <channel>` définit le contexte synthétique du canal d’ingress pour les prompts et stratégies sensibles aux canaux.

Alias de compatibilité encore acceptés :

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Activation de l’endpoint

Définissez `gateway.http.endpoints.chatCompletions.enabled` sur `true` :

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

## Désactivation de l’endpoint

Définissez `gateway.http.endpoints.chatCompletions.enabled` sur `false` :

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Comportement de session

Par défaut, l’endpoint est **sans état par requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenAI `user`, le Gateway en dérive une clé de session stable, ce qui permet aux appels répétés de partager une session d’agent.

## Pourquoi cette surface est importante

C’est l’ensemble de compatibilité le plus efficace pour les frontends et outils auto-hébergés :

- La plupart des configurations Open WebUI, LobeChat et LibreChat s’attendent à `/v1/models`.
- De nombreux systèmes RAG s’attendent à `/v1/embeddings`.
- Les clients de chat OpenAI existants peuvent généralement commencer avec `/v1/chat/completions`.
- Les clients plus natifs pour agents préfèrent de plus en plus `/v1/responses`.

## Liste de modèles et routage d’agent

<AccordionGroup>
  <Accordion title="Que renvoie `/v1/models` ?">
    Une liste de cibles d’agent OpenClaw.

    Les ids renvoyés sont les entrées `openclaw`, `openclaw/default` et `openclaw/<agentId>`.
    Utilisez-les directement comme valeurs OpenAI `model`.

  </Accordion>
  <Accordion title="Est-ce que `/v1/models` liste les agents ou les sous-agents ?">
    Il liste les cibles d’agent de premier niveau, pas les modèles fournisseurs backend ni les sous-agents.

    Les sous-agents restent une topologie d’exécution interne. Ils n’apparaissent pas comme pseudo-modèles.

  </Accordion>
  <Accordion title="Pourquoi `openclaw/default` est-il inclus ?">
    `openclaw/default` est l’alias stable de l’agent par défaut configuré.

    Cela signifie que les clients peuvent continuer à utiliser un identifiant prévisible même si l’identifiant réel de l’agent par défaut change entre les environnements.

  </Accordion>
  <Accordion title="Comment remplacer le modèle backend ?">
    Utilisez `x-openclaw-model`.

    Exemples :
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Si vous l’omettez, l’agent sélectionné s’exécute avec son choix de modèle configuré normal.

  </Accordion>
  <Accordion title="Comment les embeddings s’intègrent-ils à ce contrat ?">
    `/v1/embeddings` utilise les mêmes ids `model` de cible d’agent.

    Utilisez `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Lorsque vous avez besoin d’un modèle d’embedding spécifique, envoyez-le dans `x-openclaw-model`.
    Sans cet en-tête, la requête est transmise à la configuration d’embedding normale de l’agent sélectionné.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Définissez `stream: true` pour recevoir des Server-Sent Events (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `data: <json>`
- Le flux se termine par `data: [DONE]`

## Contrat d’outils de chat

`/v1/chat/completions` prend en charge un sous-ensemble d’outils de fonction compatible avec les clients OpenAI Chat courants.

### Champs de requête pris en charge

- `tools` : tableau de `{ "type": "function", "function": { ... } }`
- `tool_choice` : `"auto"`, `"none"`
- tours de suivi `messages[*].role: "tool"`
- `messages[*].tool_call_id` pour rattacher les résultats d’outil à un appel d’outil antérieur
- `max_completion_tokens` : nombre ; plafond par appel pour le total des tokens de complétion (tokens de raisonnement inclus). Nom de champ actuel d’OpenAI Chat Completions ; préféré lorsque `max_completion_tokens` et `max_tokens` sont tous deux envoyés.
- `max_tokens` : nombre ; alias historique accepté pour rétrocompatibilité. Ignoré lorsque `max_completion_tokens` est aussi présent.

Lorsque l’un ou l’autre champ est défini, la valeur est transmise au fournisseur amont via le canal de paramètres de flux de l’agent. Le nom de champ filaire réel envoyé au fournisseur amont est choisi par le transport du fournisseur : `max_completion_tokens` pour les endpoints de la famille OpenAI, et `max_tokens` pour les fournisseurs qui n’acceptent que le nom historique (comme Mistral et Chutes).

### Variantes non prises en charge

L’endpoint renvoie `400 invalid_request_error` pour les variantes d’outils non prises en charge, notamment :

- `tools` qui n’est pas un tableau
- entrées d’outil qui ne sont pas des fonctions
- `tool.function.name` manquant
- variantes de `tool_choice` comme `allowed_tools` et `custom`
- `tool_choice: "required"` (pas encore appliqué à l’exécution ; sera pris en charge une fois l’application stricte implémentée)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (même justification que `required`)
- valeurs `tool_choice.function.name` qui ne correspondent pas aux `tools` fournis

### Forme de réponse d’outil sans streaming

Lorsque l’agent décide d’appeler des outils, la réponse utilise :

- `choices[0].finish_reason = "tool_calls"`
- entrées `choices[0].message.tool_calls[]` avec :
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (chaîne JSON)

Le commentaire de l’assistant avant l’appel d’outil est renvoyé dans `choices[0].message.content` (éventuellement vide).

### Forme de réponse d’outil en streaming

Lorsque `stream: true`, les appels d’outil sont émis comme des fragments SSE incrémentiels :

- delta initial du rôle assistant
- deltas facultatifs de commentaire de l’assistant
- un ou plusieurs fragments `delta.tool_calls` portant l’identité de l’outil et des fragments d’arguments
- fragment final avec `finish_reason: "tool_calls"`
- `data: [DONE]`

Si `stream_options.include_usage=true`, un fragment d’utilisation final est émis avant `[DONE]`.

### Boucle de suivi d’outil

Après avoir reçu `tool_calls`, le client doit exécuter la ou les fonctions demandées et envoyer une requête de suivi qui inclut :

- le message assistant précédent d’appel d’outil
- un ou plusieurs messages `role: "tool"` avec un `tool_call_id` correspondant

Cela permet à l’exécution de l’agent gateway de continuer la même boucle de raisonnement et de produire la réponse finale de l’assistant.

## Configuration rapide Open WebUI

Pour une connexion Open WebUI de base :

- URL de base : `http://127.0.0.1:18789/v1`
- URL de base Docker sur macOS : `http://host.docker.internal:18789/v1`
- Clé API : votre token bearer Gateway
- Modèle : `openclaw/default`

Comportement attendu :

- `GET /v1/models` doit lister `openclaw/default`
- Open WebUI doit utiliser `openclaw/default` comme identifiant de modèle de chat
- Si vous voulez un fournisseur/modèle backend spécifique pour cet agent, définissez le modèle par défaut normal de l’agent ou envoyez `x-openclaw-model`

Smoke rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cela renvoie `openclaw/default`, la plupart des configurations Open WebUI peuvent se connecter avec la même URL de base et le même token.

## Exemples

Sans streaming :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming :

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

Lister les modèles :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Récupérer un modèle :

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Créer des embeddings :

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

Notes :

- `/v1/models` renvoie les cibles d’agent OpenClaw, et non les catalogues bruts des fournisseurs.
- `openclaw/default` est toujours présent afin qu’un identifiant stable fonctionne dans tous les environnements.
- Les substitutions de fournisseur/modèle backend doivent être placées dans `x-openclaw-model`, et non dans le champ `model` d’OpenAI.
- `/v1/embeddings` prend en charge `input` sous forme de chaîne ou de tableau de chaînes.

## Voir aussi

- [Référence de configuration](/fr/gateway/configuration-reference)
- [OpenAI](/fr/providers/openai)
