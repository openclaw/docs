---
read_when:
    - Intégrer des outils qui attendent OpenAI Chat Completions
summary: Exposer un point de terminaison HTTP /v1/chat/completions compatible avec OpenAI depuis le Gateway
title: Complétions de chat OpenAI
x-i18n:
    generated_at: "2026-04-30T07:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Le Gateway d’OpenClaw peut servir un petit endpoint Chat Completions compatible avec OpenAI.

Cet endpoint est **désactivé par défaut**. Activez-le d’abord dans la configuration.

- `POST /v1/chat/completions`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/chat/completions`

Lorsque la surface HTTP compatible avec OpenAI du Gateway est activée, elle sert aussi :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

En interne, les requêtes sont exécutées comme une exécution d’agent Gateway normale (même chemin de code que `openclaw agent`), donc le routage, les autorisations et la configuration correspondent à votre Gateway.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins d’authentification HTTP courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP portant une identité de confiance (`gateway.auth.mode="trusted-proxy"`) :
  routez via le proxy configuré sensible à l’identité et laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte en entrée privée (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Notes :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy de confiance configurée ; les proxys local loopback sur le même hôte nécessitent explicitement
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification se produisent, l’endpoint renvoie `429` avec `Retry-After`.

## Limite de sécurité (important)

Considérez cet endpoint comme une surface d’**accès opérateur complet** pour l’instance de gateway.

- L’authentification HTTP bearer ici n’est pas un modèle de portée étroite par utilisateur.
- Un jeton/mot de passe Gateway valide pour cet endpoint doit être traité comme un identifiant de propriétaire/opérateur.
- Les requêtes passent par le même chemin d’agent de plan de contrôle que les actions d’opérateur de confiance.
- Il n’existe pas de limite d’outils séparée non propriétaire/par utilisateur sur cet endpoint ; dès qu’un appelant passe l’authentification Gateway ici, OpenClaw le traite comme un opérateur de confiance pour ce gateway.
- Pour les modes d’authentification par secret partagé (`token` et `password`), l’endpoint restaure les paramètres opérateur complets normaux même si l’appelant envoie un en-tête `x-openclaw-scopes` plus restreint.
- Les modes HTTP portant une identité de confiance (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"`) honorent `x-openclaw-scopes` lorsqu’il est présent et, sinon, reviennent à l’ensemble de portées opérateur par défaut normal.
- Si la politique de l’agent cible autorise les outils sensibles, cet endpoint peut les utiliser.
- Gardez cet endpoint uniquement sur loopback/tailnet/entrée privée ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du gateway
  - ignore les `x-openclaw-scopes` plus restreints
  - restaure l’ensemble complet de portées opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur cet endpoint comme des tours d’expéditeur propriétaire
- modes HTTP portant une identité de confiance (par exemple l’authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur une entrée privée)
  - authentifient une identité externe de confiance ou une limite de déploiement
  - honorent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble de portées opérateur par défaut normal lorsque l’en-tête est absent
  - ne perdent la sémantique de propriétaire que lorsque l’appelant restreint explicitement les portées et omet `operator.admin`

Voir [Sécurité](/fr/gateway/security) et [Accès distant](/fr/gateway/remote).

## Contrat de modèle centré sur l’agent

OpenClaw traite le champ OpenAI `model` comme une **cible d’agent**, et non comme un identifiant brut de modèle fournisseur.

- `model: "openclaw"` route vers l’agent par défaut configuré.
- `model: "openclaw/default"` route également vers l’agent par défaut configuré.
- `model: "openclaw/<agentId>"` route vers un agent spécifique.

En-têtes de requête facultatifs :

- `x-openclaw-model: <provider/model-or-bare-id>` remplace le modèle backend pour l’agent sélectionné.
- `x-openclaw-agent-id: <agentId>` reste pris en charge comme remplacement de compatibilité.
- `x-openclaw-session-key: <sessionKey>` contrôle entièrement le routage de session.
- `x-openclaw-message-channel: <channel>` définit le contexte synthétique de canal d’entrée pour les invites et politiques sensibles au canal.

Alias de compatibilité toujours acceptés :

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

## Comportement des sessions

Par défaut, l’endpoint est **sans état par requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenAI `user`, le Gateway en dérive une clé de session stable, afin que les appels répétés puissent partager une session d’agent.

## Pourquoi cette surface est importante

C’est l’ensemble de compatibilité à plus fort effet de levier pour les frontends et l’outillage auto-hébergés :

- La plupart des configurations Open WebUI, LobeChat et LibreChat attendent `/v1/models`.
- De nombreux systèmes RAG attendent `/v1/embeddings`.
- Les clients de chat OpenAI existants peuvent généralement commencer avec `/v1/chat/completions`.
- Les clients plus natifs pour agents préfèrent de plus en plus `/v1/responses`.

## Liste des modèles et routage d’agent

<AccordionGroup>
  <Accordion title="Que renvoie `/v1/models` ?">
    Une liste de cibles d’agent OpenClaw.

    Les identifiants renvoyés sont des entrées `openclaw`, `openclaw/default` et `openclaw/<agentId>`.
    Utilisez-les directement comme valeurs OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` liste-t-il les agents ou les sous-agents ?">
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
    `/v1/embeddings` utilise les mêmes identifiants `model` de cible d’agent.

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

## Configuration rapide d’Open WebUI

Pour une connexion Open WebUI de base :

- URL de base : `http://127.0.0.1:18789/v1`
- URL de base Docker sur macOS : `http://host.docker.internal:18789/v1`
- Clé API : votre jeton bearer Gateway
- Modèle : `openclaw/default`

Comportement attendu :

- `GET /v1/models` doit lister `openclaw/default`
- Open WebUI doit utiliser `openclaw/default` comme identifiant de modèle de chat
- Si vous voulez un fournisseur/modèle backend spécifique pour cet agent, définissez le modèle par défaut normal de l’agent ou envoyez `x-openclaw-model`

Test rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cela renvoie `openclaw/default`, la plupart des configurations Open WebUI peuvent se connecter avec la même URL de base et le même jeton.

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

Avec streaming :

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

- `/v1/models` renvoie des cibles d’agent OpenClaw, pas des catalogues fournisseurs bruts.
- `openclaw/default` est toujours présent afin qu’un identifiant stable fonctionne dans tous les environnements.
- Les remplacements de fournisseur/modèle backend appartiennent à `x-openclaw-model`, pas au champ OpenAI `model`.
- `/v1/embeddings` prend en charge `input` sous forme de chaîne ou de tableau de chaînes.

## Connexe

- [Référence de configuration](/fr/gateway/configuration-reference)
- [OpenAI](/fr/providers/openai)
