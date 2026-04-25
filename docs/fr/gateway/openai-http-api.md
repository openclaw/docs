---
read_when:
    - Intégrer des outils qui attendent OpenAI Chat Completions
summary: Exposer un endpoint HTTP `/v1/chat/completions` compatible OpenAI depuis le Gateway
title: Chat completions OpenAI
x-i18n:
    generated_at: "2026-04-25T13:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

Le Gateway d’OpenClaw peut servir un petit endpoint Chat Completions compatible OpenAI.

Cet endpoint est **désactivé par défaut**. Activez-le d’abord dans la configuration.

- `POST /v1/chat/completions`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/chat/completions`

Lorsque la surface HTTP compatible OpenAI du Gateway est activée, elle sert aussi :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

En interne, les requêtes sont exécutées comme une exécution normale d’agent Gateway (même chemin de code que `openclaw agent`), donc le routage/les permissions/la configuration correspondent à votre Gateway.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins HTTP d’authentification courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP fiable portant l’identité (`gateway.auth.mode="trusted-proxy"`) :
  faites passer la requête par le proxy sensible à l’identité configuré et laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Remarques :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source proxy de confiance configurée hors loopback ; les proxys loopback sur le même hôte ne
  satisfont pas ce mode.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification se produisent, l’endpoint renvoie `429` avec `Retry-After`.

## Limite de sécurité (important)

Traitez cet endpoint comme une surface d’**accès opérateur complet** à l’instance Gateway.

- L’authentification HTTP bearer ici n’est pas un modèle de portée étroite par utilisateur.
- Un token/mot de passe Gateway valide pour cet endpoint doit être traité comme un identifiant de propriétaire/opérateur.
- Les requêtes passent par le même chemin d’agent de plan de contrôle que les actions d’opérateur de confiance.
- Il n’existe pas de limite d’outil distincte non-propriétaire/par utilisateur sur cet endpoint ; une fois l’authentification Gateway passée, OpenClaw traite cet appelant comme un opérateur de confiance pour ce gateway.
- Pour les modes d’authentification à secret partagé (`token` et `password`), l’endpoint rétablit les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus étroit.
- Les modes HTTP fiables portant l’identité (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"`) respectent `x-openclaw-scopes` lorsqu’il est présent et reviennent sinon à l’ensemble normal des portées par défaut de l’opérateur.
- Si la politique de l’agent cible autorise les outils sensibles, cet endpoint peut les utiliser.
- Gardez cet endpoint uniquement sur loopback/tailnet/ingress privé ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret partagé d’opérateur du gateway
  - ignore les `x-openclaw-scopes` plus étroits
  - rétablit l’ensemble complet des portées par défaut de l’opérateur :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur cet endpoint comme des tours d’expéditeur propriétaire
- modes HTTP fiables portant l’identité (par exemple auth trusted proxy, ou `gateway.auth.mode="none"` sur ingress privé)
  - authentifient une identité externe de confiance ou une limite de déploiement
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble normal des portées par défaut de l’opérateur lorsque l’en-tête est absent
  - ne perdent la sémantique propriétaire que si l’appelant restreint explicitement les portées et omet `operator.admin`

Voir [Sécurité](/fr/gateway/security) et [Accès distant](/fr/gateway/remote).

## Contrat de modèle orienté agent

OpenClaw traite le champ OpenAI `model` comme une **cible d’agent**, et non comme un identifiant brut de modèle fournisseur.

- `model: "openclaw"` route vers l’agent par défaut configuré.
- `model: "openclaw/default"` route aussi vers l’agent par défaut configuré.
- `model: "openclaw/<agentId>"` route vers un agent spécifique.

En-têtes de requête facultatifs :

- `x-openclaw-model: <provider/model-or-bare-id>` remplace le modèle backend pour l’agent sélectionné.
- `x-openclaw-agent-id: <agentId>` reste pris en charge comme remplacement de compatibilité.
- `x-openclaw-session-key: <sessionKey>` contrôle entièrement le routage de session.
- `x-openclaw-message-channel: <channel>` définit le contexte synthétique de canal entrant pour les prompts et politiques sensibles au canal.

Alias de compatibilité toujours acceptés :

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Activer l’endpoint

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

## Désactiver l’endpoint

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

Si la requête inclut une chaîne OpenAI `user`, le Gateway dérive une clé de session stable à partir de celle-ci, de sorte que des appels répétés peuvent partager une session d’agent.

## Pourquoi cette surface est importante

C’est l’ensemble de compatibilité à plus fort levier pour les frontends et outils auto-hébergés :

- La plupart des configurations Open WebUI, LobeChat et LibreChat attendent `/v1/models`.
- De nombreux systèmes RAG attendent `/v1/embeddings`.
- Les clients de chat OpenAI existants peuvent généralement démarrer avec `/v1/chat/completions`.
- Les clients plus orientés agent préfèrent de plus en plus `/v1/responses`.

## Liste des modèles et routage des agents

<AccordionGroup>
  <Accordion title="Que renvoie `/v1/models` ?">
    Une liste de cibles d’agent OpenClaw.

    Les identifiants renvoyés sont `openclaw`, `openclaw/default` et les entrées `openclaw/<agentId>`.
    Utilisez-les directement comme valeurs OpenAI `model`.

  </Accordion>
  <Accordion title="Est-ce que `/v1/models` liste les agents ou les sous-agents ?">
    Il liste les cibles d’agent de premier niveau, pas les modèles fournisseurs backend ni les sous-agents.

    Les sous-agents restent une topologie d’exécution interne. Ils n’apparaissent pas comme pseudo-modèles.

  </Accordion>
  <Accordion title="Pourquoi `openclaw/default` est-il inclus ?">
    `openclaw/default` est l’alias stable de l’agent par défaut configuré.

    Cela signifie que les clients peuvent continuer à utiliser un identifiant prévisible unique même si l’identifiant réel de l’agent par défaut change selon les environnements.

  </Accordion>
  <Accordion title="Comment remplacer le modèle backend ?">
    Utilisez `x-openclaw-model`.

    Exemples :
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Si vous l’omettez, l’agent sélectionné s’exécute avec son choix de modèle configuré normal.

  </Accordion>
  <Accordion title="Comment les embeddings s’intègrent-ils dans ce contrat ?">
    `/v1/embeddings` utilise les mêmes identifiants `model` de cible d’agent.

    Utilisez `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Lorsque vous avez besoin d’un modèle d’embedding spécifique, envoyez-le dans `x-openclaw-model`.
    Sans cet en-tête, la requête est transmise à la configuration normale d’embedding de l’agent sélectionné.

  </Accordion>
</AccordionGroup>

## Diffusion (SSE)

Définissez `stream: true` pour recevoir des événements Server-Sent Events (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `data: <json>`
- Le flux se termine par `data: [DONE]`

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

Vérification rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cela renvoie `openclaw/default`, la plupart des configurations Open WebUI peuvent se connecter avec la même URL de base et le même token.

## Exemples

Sans diffusion :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Avec diffusion :

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
- `openclaw/default` est toujours présent afin qu’un identifiant stable unique fonctionne dans tous les environnements.
- Les remplacements de fournisseur/modèle backend vont dans `x-openclaw-model`, pas dans le champ OpenAI `model`.
- `/v1/embeddings` prend en charge `input` comme chaîne ou tableau de chaînes.

## Connexes

- [Référence de configuration](/fr/gateway/configuration-reference)
- [OpenAI](/fr/providers/openai)
