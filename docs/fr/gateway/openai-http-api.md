---
read_when:
    - Intégrer des outils qui attendent les Chat Completions d’OpenAI
summary: Expose un point de terminaison HTTP `/v1/chat/completions` compatible avec OpenAI depuis le Gateway
title: Complétions de chat OpenAI
x-i18n:
    generated_at: "2026-06-27T17:31:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Le Gateway d'OpenClaw peut servir un petit point de terminaison Chat Completions compatible OpenAI.

Ce point de terminaison est **désactivé par défaut**. Activez-le d'abord dans la configuration.

- `POST /v1/chat/completions`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/chat/completions`

Lorsque la surface HTTP compatible OpenAI du Gateway est activée, elle sert aussi :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

En interne, les requêtes sont exécutées comme une exécution d'agent Gateway normale (même chemin de code que `openclaw agent`), donc le routage, les autorisations et la configuration correspondent à votre Gateway.

## Authentification

Utilise la configuration d'authentification du Gateway.

Chemins d'authentification HTTP courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP portant une identité approuvée (`gateway.auth.mode="trusted-proxy"`) :
  acheminez via le proxy configuré tenant compte de l'identité et laissez-le injecter les
  en-têtes d'identité requis
- authentification ouverte en accès privé (`gateway.auth.mode="none"`) :
  aucun en-tête d'authentification requis

Notes :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d'une
  source de proxy approuvée configurée ; les proxys en boucle locale sur le même hôte exigent explicitement
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Les appelants internes sur le même hôte qui contournent le proxy peuvent utiliser
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` comme solution de secours directe locale.
  Toute preuve d'en-tête `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`
  maintient plutôt la requête sur le chemin trusted-proxy.
- Si `gateway.auth.rateLimit` est configuré et que trop d'échecs d'authentification surviennent, le point de terminaison renvoie `429` avec `Retry-After`.

## Limite de sécurité (important)

Traitez ce point de terminaison comme une surface à **accès opérateur complet** pour l'instance Gateway.

- L'authentification HTTP bearer ici n'est pas un modèle de portée étroite par utilisateur.
- Un token/mot de passe Gateway valide pour ce point de terminaison doit être traité comme un identifiant propriétaire/opérateur.
- Les requêtes passent par le même chemin d'agent du plan de contrôle que les actions d'opérateur approuvées.
- Il n'existe pas de limite d'outils séparée non-propriétaire/par utilisateur sur ce point de terminaison ; dès qu'un appelant réussit l'authentification Gateway ici, OpenClaw le traite comme un opérateur approuvé pour ce Gateway.
- Pour les modes d'authentification par secret partagé (`token` et `password`), le point de terminaison rétablit les valeurs par défaut normales d'opérateur complet même si l'appelant envoie un en-tête `x-openclaw-scopes` plus étroit.
- Les modes HTTP portant une identité approuvée (par exemple l'authentification par proxy approuvé ou `gateway.auth.mode="none"`) respectent `x-openclaw-scopes` lorsqu'il est présent et, sinon, reviennent à l'ensemble normal de portées par défaut de l'opérateur.
- Si la politique de l'agent cible autorise les outils sensibles, ce point de terminaison peut les utiliser.
- Gardez ce point de terminaison uniquement sur une boucle locale, un tailnet ou un accès privé ; ne l'exposez pas directement à l'internet public.

Matrice d'authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du Gateway
  - ignore les `x-openclaw-scopes` plus étroits
  - rétablit l'ensemble complet de portées opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur ce point de terminaison comme des tours envoyés par le propriétaire
- modes HTTP portant une identité approuvée (par exemple l'authentification par proxy approuvé, ou `gateway.auth.mode="none"` sur un accès privé)
  - authentifient une identité externe approuvée ou une limite de déploiement
  - respectent `x-openclaw-scopes` lorsque l'en-tête est présent
  - reviennent à l'ensemble normal de portées par défaut de l'opérateur lorsque l'en-tête est absent
  - ne perdent la sémantique de propriétaire que lorsque l'appelant restreint explicitement les portées et omet `operator.admin`
  - exigent `operator.admin` pour les contrôles de requête de niveau propriétaire tels que `x-openclaw-model`

Voir [Sécurité](/fr/gateway/security) et [Accès à distance](/fr/gateway/remote).

## Quand utiliser ce point de terminaison

Utilisez `/v1/chat/completions` lorsque vous intégrez des outils ou un backend applicatif approuvé avec un Gateway existant et que vous pouvez conserver en toute sécurité les identifiants d'opérateur du Gateway.

- Préférez cela à l'ajout d'un nouveau canal intégré lorsque votre intégration n'est qu'une autre surface opérateur/client pour le même Gateway.
- Pour les clients mobiles natifs qui se connectent directement à un Gateway distant, préférez [WebChat](/fr/web/webchat) ou le [protocole Gateway](/fr/gateway/protocol) et implémentez le flux d'amorçage d'appareil appairé/token d'appareil afin que l'appareil n'ait pas besoin d'un token/mot de passe HTTP partagé.
- Créez plutôt un Plugin de canal lorsque vous intégrez un réseau de messagerie externe avec ses propres utilisateurs, salons, livraison Webhook ou transport sortant. Voir [Créer des plugins](/fr/plugins/building-plugins).

## Contrat de modèle centré sur l'agent

OpenClaw traite le champ OpenAI `model` comme une **cible d'agent**, et non comme un identifiant brut de modèle fournisseur.

- `model: "openclaw"` est routé vers l'agent par défaut configuré.
- `model: "openclaw/default"` est également routé vers l'agent par défaut configuré.
- `model: "openclaw/<agentId>"` est routé vers un agent spécifique.

En-têtes de requête facultatifs :

- `x-openclaw-model: <provider/model-or-bare-id>` remplace le modèle backend pour l'agent sélectionné. Les appelants bearer à secret partagé peuvent utiliser cet en-tête. Les appelants portant une identité, comme les requêtes trusted-proxy ou les requêtes d'accès privé sans authentification avec `x-openclaw-scopes`, ont besoin de `operator.admin` ; les appelants en écriture seule obtiennent `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` reste pris en charge comme remplacement de compatibilité.
- `x-openclaw-session-key: <sessionKey>` contrôle explicitement le routage de session. La valeur ne doit pas utiliser d'espaces de noms de session internes réservés tels que `subagent:`, `cron:` ou `acp:` ; ces requêtes sont rejetées avec `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` définit le contexte de canal d'entrée synthétique pour les prompts et les politiques tenant compte du canal.

Alias de compatibilité encore acceptés :

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

Si la requête inclut une chaîne OpenAI `user`, le Gateway en dérive une clé de session stable, ce qui permet aux appels répétés de partager une session d’agent.

Pour les applications personnalisées, le comportement par défaut le plus sûr consiste à réutiliser la même valeur `user` par fil de conversation. Évitez les identifiants au niveau du compte, sauf si vous voulez explicitement que plusieurs conversations ou appareils partagent une même session OpenClaw. Utilisez `x-openclaw-session-key` uniquement lorsque vous avez besoin d’un contrôle explicite du routage entre plusieurs clients ou fils, et choisissez des clés appartenant à l’application qui ne commencent pas par des espaces de noms internes réservés tels que `subagent:`, `cron:` ou `acp:`.

## Pourquoi cette surface est importante

Il s’agit de l’ensemble de compatibilité le plus déterminant pour les interfaces frontend et les outils auto-hébergés :

- La plupart des configurations Open WebUI, LobeChat et LibreChat s’attendent à `/v1/models`.
- De nombreux systèmes RAG s’attendent à `/v1/embeddings`.
- Les clients de chat OpenAI existants peuvent généralement commencer avec `/v1/chat/completions`.
- Les clients plus natifs des agents privilégient de plus en plus `/v1/responses`.

## Liste des modèles et routage des agents

<AccordionGroup>
  <Accordion title="Que renvoie `/v1/models` ?">
    Une liste de cibles d’agents OpenClaw.

    Les identifiants renvoyés sont `openclaw`, `openclaw/default` et les entrées `openclaw/<agentId>`.
    Utilisez-les directement comme valeurs OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` liste-t-il les agents ou les sous-agents ?">
    Il liste les cibles d’agents de premier niveau, pas les modèles de fournisseurs backend ni les sous-agents.

    Les sous-agents restent une topologie d’exécution interne. Ils n’apparaissent pas comme pseudo-modèles.

  </Accordion>
  <Accordion title="Pourquoi `openclaw/default` est-il inclus ?">
    `openclaw/default` est l’alias stable de l’agent par défaut configuré.

    Cela signifie que les clients peuvent continuer à utiliser un identifiant prévisible même si l’identifiant réel de l’agent par défaut change selon les environnements.

  </Accordion>
  <Accordion title="Comment remplacer le modèle backend ?">
    Utilisez `x-openclaw-model`. Il s’agit d’une substitution au niveau du propriétaire : elle fonctionne avec le chemin de jeton porteur/mot de passe à secret partagé du Gateway, et elle exige `operator.admin` sur les chemins HTTP porteurs d’identité, comme l’authentification par proxy de confiance.

    Exemples :
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Si vous l’omettez, l’agent sélectionné s’exécute avec son choix de modèle configuré normal.

  </Accordion>
  <Accordion title="Comment les embeddings s’intègrent-ils à ce contrat ?">
    `/v1/embeddings` utilise les mêmes identifiants `model` de cible d’agent.

    Utilisez `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Lorsque vous avez besoin d’un modèle d’embedding spécifique, envoyez-le dans `x-openclaw-model` depuis un appelant à secret partagé ou depuis un appelant porteur d’identité avec `operator.admin`.
    Sans cet en-tête, la requête est transmise à la configuration d’embedding normale de l’agent sélectionné.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Définissez `stream: true` pour recevoir des événements envoyés par le serveur (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `data: <json>`
- Le flux se termine par `data: [DONE]`

## Contrat des outils de chat

`/v1/chat/completions` prend en charge un sous-ensemble d’outils de fonction compatible avec les clients OpenAI Chat courants.

### Champs de requête pris en charge

- `tools` : tableau de `{ "type": "function", "function": { ... } }`
- `tool_choice` : `"auto"`, `"none"`, `"required"` ou `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` tours de suivi
- `messages[*].tool_call_id` pour associer les résultats d’outil à un appel d’outil antérieur
- `max_completion_tokens` : nombre ; plafond par appel pour le total de jetons de complétion (jetons de raisonnement inclus). Nom de champ actuel d’OpenAI Chat Completions ; préféré lorsque `max_completion_tokens` et `max_tokens` sont tous deux envoyés.
- `max_tokens` : nombre ; alias hérité accepté pour la rétrocompatibilité. Ignoré lorsque `max_completion_tokens` est également présent.
- `temperature` : nombre ; température d’échantillonnage au mieux transmise au fournisseur amont via le canal de paramètres de flux de l’agent.
- `top_p` : nombre ; échantillonnage nucleus au mieux transmis au fournisseur amont via le canal de paramètres de flux de l’agent.
- `frequency_penalty` : nombre ; pénalité de fréquence au mieux transmise au fournisseur amont via le canal de paramètres de flux de l’agent. Plage validée : -2.0 à 2.0. Renvoie `400 invalid_request_error` pour les valeurs hors plage.
- `presence_penalty` : nombre ; pénalité de présence au mieux transmise au fournisseur amont via le canal de paramètres de flux de l’agent. Plage validée : -2.0 à 2.0. Renvoie `400 invalid_request_error` pour les valeurs hors plage.
- `seed` : nombre (entier) ; graine au mieux transmise au fournisseur amont via le canal de paramètres de flux de l’agent. Renvoie `400 invalid_request_error` pour les valeurs non entières.
- `stop` : chaîne ou tableau contenant jusqu’à 4 chaînes ; séquences d’arrêt au mieux transmises au fournisseur amont via le canal de paramètres de flux de l’agent. Renvoie `400 invalid_request_error` pour plus de 4 séquences ou pour des entrées non textuelles/vides.

Lorsque l’un des champs de plafond de jetons est défini, la valeur est transmise au fournisseur amont via le canal stream-param de l’agent. Le nom réel du champ transmis sur le fil au fournisseur amont est choisi par le transport du fournisseur : `max_completion_tokens` pour les points de terminaison de la famille OpenAI, et `max_tokens` pour les fournisseurs qui n’acceptent que le nom hérité (comme Mistral et Chutes). Les champs d’échantillonnage (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) suivent le même canal stream-param ; le backend Codex Responses basé sur ChatGPT les supprime côté serveur puisqu’il utilise un échantillonnage fixe. `stop` passe également par le canal stream-param et correspond au champ d’arrêt du transport (`stop` pour les backends Chat Completions, `stop_sequences` pour Anthropic) ; l’API OpenAI Responses n’a pas de paramètre d’arrêt, donc `stop` n’est pas appliqué aux modèles adossés à Responses.

### Variantes non prises en charge

Le point de terminaison renvoie `400 invalid_request_error` pour les variantes d’outils non prises en charge, notamment :

- `tools` qui n’est pas un tableau
- entrées d’outil qui ne sont pas des fonctions
- `tool.function.name` manquant
- variantes de `tool_choice` telles que `allowed_tools` et `custom`
- valeurs de `tool_choice.function.name` qui ne correspondent pas aux `tools` fournis

Pour `tool_choice: "required"` et `tool_choice` épinglé sur une fonction, le point de terminaison restreint l’ensemble exposé d’outils de fonction client, demande au runtime d’appeler un outil client avant de répondre, et renvoie une erreur si la réponse de l’agent n’inclut pas d’appel structuré d’outil client correspondant. Ce contrat s’applique à la liste HTTP `tools` fournie par l’appelant, et non à tous les outils internes de l’agent OpenClaw.

### Forme de réponse d’outil non diffusée en continu

Lorsque l’agent décide d’appeler des outils, la réponse utilise :

- entrées `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` avec :
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (chaîne JSON)

Le commentaire de l’assistant avant l’appel d’outil est renvoyé dans `choices[0].message.content` (éventuellement vide).

### Forme de réponse d’outil diffusée en continu

Lorsque `stream: true`, les appels d’outils sont émis sous forme de fragments SSE incrémentaux :

- delta initial du rôle assistant
- deltas facultatifs de commentaire de l’assistant
- un ou plusieurs fragments `delta.tool_calls` transportant l’identité de l’outil et des fragments d’arguments
- fragment final avec `finish_reason: "tool_calls"`
- `data: [DONE]`

Si `stream_options.include_usage=true`, un fragment d’utilisation final est émis avant `[DONE]`.

### Boucle de suivi des outils

Après réception de `tool_calls`, le client doit exécuter la ou les fonctions demandées et envoyer une requête de suivi qui inclut :

- message précédent de l’assistant avec appel d’outil
- un ou plusieurs messages `role: "tool"` avec le `tool_call_id` correspondant

Cela permet à l’exécution de l’agent Gateway de poursuivre la même boucle de raisonnement et de produire la réponse finale de l’assistant.

## Configuration rapide d’Open WebUI

Pour une connexion Open WebUI de base :

- URL de base : `http://127.0.0.1:18789/v1`
- URL de base Docker sur macOS : `http://host.docker.internal:18789/v1`
- Clé API : votre jeton porteur Gateway
- Modèle : `openclaw/default`

Comportement attendu :

- `GET /v1/models` doit lister `openclaw/default`
- Open WebUI doit utiliser `openclaw/default` comme identifiant de modèle de chat
- Si vous voulez un fournisseur/modèle backend spécifique pour cet agent, définissez le modèle par défaut normal de l’agent ou envoyez `x-openclaw-model` depuis un appelant à secret partagé ou un appelant porteur d’identité avec `operator.admin`

Test rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cela renvoie `openclaw/default`, la plupart des configurations Open WebUI peuvent se connecter avec la même URL de base et le même jeton.

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

Réutilisez la même valeur `user` lors des appels ultérieurs pour cette conversation afin de poursuivre la même session d’agent.

Non diffusé en continu :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Diffusé en continu :

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

- `/v1/models` renvoie les cibles d’agent OpenClaw, pas les catalogues bruts des fournisseurs.
- `openclaw/default` est toujours présent afin qu’un identifiant stable fonctionne dans tous les environnements.
- Les remplacements de fournisseur/modèle backend appartiennent à `x-openclaw-model`, pas au champ OpenAI `model`. Sur les chemins d’authentification HTTP porteurs d’identité, cet en-tête nécessite `operator.admin`.
- `/v1/embeddings` prend en charge `input` sous forme de chaîne ou de tableau de chaînes.

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [OpenAI](/fr/providers/openai)
