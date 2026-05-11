---
read_when:
    - Intégrer des outils qui attendent OpenAI Chat Completions
summary: Exposer un point de terminaison HTTP /v1/chat/completions compatible avec OpenAI depuis le Gateway
title: Complétions de chat OpenAI
x-i18n:
    generated_at: "2026-05-11T20:37:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway peut servir un petit point de terminaison Chat Completions compatible avec OpenAI.

Ce point de terminaison est **désactivé par défaut**. Activez-le d’abord dans la configuration.

- `POST /v1/chat/completions`
- Même port que le Gateway (multiplex WS + HTTP) : `http://<gateway-host>:<port>/v1/chat/completions`

Lorsque la surface HTTP compatible OpenAI du Gateway est activée, elle sert également :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

En interne, les requêtes sont exécutées comme une exécution d’agent Gateway normale (le même chemin de code que `openclaw agent`), donc le routage, les permissions et la configuration correspondent à votre Gateway.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins d’authentification HTTP courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP avec identité approuvée (`gateway.auth.mode="trusted-proxy"`) :
  routez via le proxy configuré prenant en charge l’identité et laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Remarques :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy approuvée configurée ; les proxys loopback sur le même hôte nécessitent
  `gateway.auth.trustedProxy.allowLoopback = true` de manière explicite.
- Si `gateway.auth.rateLimit` est configuré et qu’un trop grand nombre d’échecs d’authentification se produisent, le point de terminaison renvoie `429` avec `Retry-After`.

## Frontière de sécurité (important)

Traitez ce point de terminaison comme une surface avec **accès opérateur complet** pour l’instance du gateway.

- L’authentification HTTP bearer ici n’est pas un modèle de périmètre étroit par utilisateur.
- Un token/mot de passe Gateway valide pour ce point de terminaison doit être traité comme un identifiant propriétaire/opérateur.
- Les requêtes passent par le même chemin d’agent du plan de contrôle que les actions d’opérateur approuvées.
- Il n’existe pas de frontière d’outils séparée non propriétaire/par utilisateur sur ce point de terminaison ; une fois qu’un appelant passe l’authentification Gateway ici, OpenClaw le traite comme un opérateur approuvé pour ce gateway.
- Pour les modes d’authentification par secret partagé (`token` et `password`), le point de terminaison restaure les paramètres par défaut d’opérateur complet normaux même si l’appelant envoie un en-tête `x-openclaw-scopes` plus restreint.
- Les modes HTTP avec identité approuvée (par exemple l’authentification par proxy approuvé ou `gateway.auth.mode="none"`) respectent `x-openclaw-scopes` lorsqu’il est présent et reviennent sinon à l’ensemble normal de périmètres par défaut de l’opérateur.
- Si la politique de l’agent cible autorise des outils sensibles, ce point de terminaison peut les utiliser.
- Gardez ce point de terminaison uniquement sur loopback/tailnet/ingress privé ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret partagé d’opérateur du gateway
  - ignore les `x-openclaw-scopes` plus restreints
  - restaure l’ensemble complet de périmètres d’opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur ce point de terminaison comme des tours d’expéditeur propriétaire
- modes HTTP avec identité approuvée (par exemple l’authentification par proxy approuvé, ou `gateway.auth.mode="none"` sur ingress privé)
  - authentifient une identité approuvée externe ou une frontière de déploiement
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble normal de périmètres par défaut de l’opérateur lorsque l’en-tête est absent
  - ne perdent les sémantiques de propriétaire que lorsque l’appelant restreint explicitement les périmètres et omet `operator.admin`

Consultez [Sécurité](/fr/gateway/security) et [Accès distant](/fr/gateway/remote).

## Contrat de modèle agent-first

OpenClaw traite le champ OpenAI `model` comme une **cible d’agent**, et non comme un identifiant brut de modèle fournisseur.

- `model: "openclaw"` route vers l’agent par défaut configuré.
- `model: "openclaw/default"` route également vers l’agent par défaut configuré.
- `model: "openclaw/<agentId>"` route vers un agent spécifique.

En-têtes de requête facultatifs :

- `x-openclaw-model: <provider/model-or-bare-id>` remplace le modèle backend pour l’agent sélectionné.
- `x-openclaw-agent-id: <agentId>` reste pris en charge comme remplacement de compatibilité.
- `x-openclaw-session-key: <sessionKey>` contrôle entièrement le routage de session.
- `x-openclaw-message-channel: <channel>` définit le contexte synthétique de canal d’ingress pour les prompts et politiques conscients du canal.

Alias de compatibilité toujours acceptés :

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Activation du point de terminaison

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

## Désactivation du point de terminaison

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

Par défaut, le point de terminaison est **sans état par requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenAI `user`, le Gateway en dérive une clé de session stable, de sorte que les appels répétés peuvent partager une session d’agent.

## Pourquoi cette surface est importante

Il s’agit de l’ensemble de compatibilité offrant le plus fort levier pour les frontends et outils auto-hébergés :

- La plupart des configurations Open WebUI, LobeChat et LibreChat attendent `/v1/models`.
- De nombreux systèmes RAG attendent `/v1/embeddings`.
- Les clients de chat OpenAI existants peuvent généralement commencer avec `/v1/chat/completions`.
- Les clients plus natifs des agents privilégient de plus en plus `/v1/responses`.

## Liste des modèles et routage d’agent

<AccordionGroup>
  <Accordion title="Que renvoie `/v1/models` ?">
    Une liste de cibles d’agent OpenClaw.

    Les identifiants renvoyés sont des entrées `openclaw`, `openclaw/default` et `openclaw/<agentId>`.
    Utilisez-les directement comme valeurs OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` liste-t-il des agents ou des sous-agents ?">
    Il liste les cibles d’agent de premier niveau, pas les modèles de fournisseurs backend ni les sous-agents.

    Les sous-agents restent une topologie d’exécution interne. Ils n’apparaissent pas comme des pseudo-modèles.

  </Accordion>
  <Accordion title="Pourquoi `openclaw/default` est-il inclus ?">
    `openclaw/default` est l’alias stable de l’agent par défaut configuré.

    Cela signifie que les clients peuvent continuer à utiliser un identifiant prévisible même si l’identifiant réel de l’agent par défaut change d’un environnement à l’autre.

  </Accordion>
  <Accordion title="Comment remplacer le modèle backend ?">
    Utilisez `x-openclaw-model`.

    Exemples :
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Si vous l’omettez, l’agent sélectionné s’exécute avec son choix de modèle configuré normal.

  </Accordion>
  <Accordion title="Comment les embeddings s’insèrent-ils dans ce contrat ?">
    `/v1/embeddings` utilise les mêmes identifiants `model` de cible d’agent.

    Utilisez `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Lorsque vous avez besoin d’un modèle d’embedding spécifique, envoyez-le dans `x-openclaw-model`.
    Sans cet en-tête, la requête passe par la configuration d’embedding normale de l’agent sélectionné.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Définissez `stream: true` pour recevoir des Server-Sent Events (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `data: <json>`
- Le flux se termine par `data: [DONE]`

## Contrat des outils de chat

`/v1/chat/completions` prend en charge un sous-ensemble d’outils de fonction compatible avec les clients OpenAI Chat courants.

### Champs de requête pris en charge

- `tools` : tableau de `{ "type": "function", "function": { ... } }`
- `tool_choice` : `"auto"`, `"none"`
- tours de suivi `messages[*].role: "tool"`
- `messages[*].tool_call_id` pour lier les résultats d’outil à un appel d’outil antérieur

### Variantes non prises en charge

Le point de terminaison renvoie `400 invalid_request_error` pour les variantes d’outil non prises en charge, notamment :

- `tools` qui n’est pas un tableau
- entrées d’outil qui ne sont pas des fonctions
- `tool.function.name` manquant
- variantes `tool_choice` telles que `allowed_tools` et `custom`
- `tool_choice: "required"` (pas encore imposé à l’exécution ; sera pris en charge une fois l’application stricte implémentée)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (même justification que `required`)
- valeurs `tool_choice.function.name` qui ne correspondent pas aux `tools` fournis

### Forme de réponse d’outil non streaming

Lorsque l’agent décide d’appeler des outils, la réponse utilise :

- `choices[0].finish_reason = "tool_calls"`
- entrées `choices[0].message.tool_calls[]` avec :
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (chaîne JSON)

Le commentaire de l’assistant avant l’appel d’outil est renvoyé dans `choices[0].message.content` (éventuellement vide).

### Forme de réponse d’outil streaming

Lorsque `stream: true`, les appels d’outils sont émis sous forme de fragments SSE incrémentiels :

- delta initial du rôle assistant
- deltas de commentaire assistant facultatifs
- un ou plusieurs fragments `delta.tool_calls` portant l’identité de l’outil et des fragments d’arguments
- fragment final avec `finish_reason: "tool_calls"`
- `data: [DONE]`

Si `stream_options.include_usage=true`, un fragment d’utilisation final est émis avant `[DONE]`.

### Boucle de suivi d’outil

Après avoir reçu `tool_calls`, le client doit exécuter la ou les fonctions demandées et envoyer une requête de suivi qui inclut :

- message assistant d’appel d’outil précédent
- un ou plusieurs messages `role: "tool"` avec un `tool_call_id` correspondant

Cela permet à l’exécution de l’agent gateway de poursuivre la même boucle de raisonnement et de produire la réponse assistant finale.

## Configuration rapide d’Open WebUI

Pour une connexion Open WebUI de base :

- URL de base : `http://127.0.0.1:18789/v1`
- URL de base Docker sur macOS : `http://host.docker.internal:18789/v1`
- Clé API : votre token bearer Gateway
- Modèle : `openclaw/default`

Comportement attendu :

- `GET /v1/models` doit lister `openclaw/default`
- Open WebUI doit utiliser `openclaw/default` comme identifiant de modèle de chat
- Si vous voulez un fournisseur/modèle backend spécifique pour cet agent, définissez le modèle par défaut normal de l’agent ou envoyez `x-openclaw-model`

Smoke test rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cela renvoie `openclaw/default`, la plupart des configurations Open WebUI peuvent se connecter avec la même URL de base et le même token.

## Exemples

Non streaming :

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

Remarques :

- `/v1/models` renvoie des cibles d’agent OpenClaw, pas des catalogues bruts de fournisseurs.
- `openclaw/default` est toujours présent afin qu’un identifiant stable fonctionne dans tous les environnements.
- Les remplacements de fournisseur/modèle backend doivent être placés dans `x-openclaw-model`, pas dans le champ OpenAI `model`.
- `/v1/embeddings` prend en charge `input` sous forme de chaîne ou de tableau de chaînes.

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [OpenAI](/fr/providers/openai)
