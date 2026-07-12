---
read_when:
    - Diagnostic de la rotation des profils d’authentification, des périodes de temporisation ou du comportement de repli du modèle
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de repli
sidebarTitle: Model failover
summary: Comment OpenClaw alterne les profils d’authentification et bascule vers d’autres modèles en cas d’échec
title: Basculement de modèle
x-i18n:
    generated_at: "2026-07-12T02:30:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

## Flux d’exécution

<Steps>
  <Step title="Resolve session state">
    Résoudre le modèle de la session active et la préférence de profil d’authentification.
  </Step>
  <Step title="Build candidate chain">
    Construire la chaîne de modèles candidats à partir de la sélection de modèle actuelle et de la politique de repli associée à la source de cette sélection. Les valeurs par défaut configurées, les modèles principaux des tâches Cron et les modèles de repli sélectionnés automatiquement peuvent utiliser les replis configurés ; les sélections explicites de session effectuées par l’utilisateur sont strictes.
  </Step>
  <Step title="Try the current provider">
    Essayer le fournisseur actuel en appliquant les règles de rotation et de temporisation des profils d’authentification.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Si les possibilités de ce fournisseur sont épuisées à cause d’une erreur justifiant un basculement, passer au modèle candidat suivant.
  </Step>
  <Step title="Persist fallback override">
    Enregistrer le remplacement par le modèle de repli sélectionné avant le début de la nouvelle tentative, afin que les autres lecteurs de la session voient le même fournisseur et le même modèle que celui que le processus d’exécution s’apprête à utiliser. Le remplacement de modèle enregistré porte le marqueur `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Si le modèle candidat de repli échoue, annuler uniquement les champs de remplacement de session appartenant au mécanisme de repli, à condition qu’ils correspondent encore à ce candidat ayant échoué.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Si tous les candidats échouent, lever une `FallbackSummaryError` contenant le détail de chaque tentative et l’échéance de temporisation la plus proche lorsqu’elle est connue.
  </Step>
</Steps>

Ce comportement est volontairement plus ciblé que « enregistrer et restaurer toute la session ». Le processus d’exécution des réponses n’enregistre que les champs de sélection de modèle dont il est responsable pour le repli : `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Cela empêche une nouvelle tentative de repli ayant échoué d’écraser des modifications de session plus récentes et sans rapport, comme un changement manuel avec `/model` ou une mise à jour de rotation de session survenue pendant la tentative.

## Politique selon la source de sélection

La source de la sélection détermine si la chaîne de repli est autorisée :

- **Valeur par défaut configurée** : `agents.defaults.model.primary` utilise `agents.defaults.model.fallbacks`.
- **Modèle principal de l’agent** : `agents.list[].model` est strict, sauf si l’objet de modèle de cet agent contient ses propres `fallbacks`. Utilisez `fallbacks: []` pour rendre explicitement ce comportement strict, ou une liste non vide pour autoriser le repli de modèle pour cet agent.
- **Remplacement automatique par un modèle de repli** : lors d’un repli à l’exécution, OpenClaw écrit `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` et le modèle d’origine sélectionné avant de réessayer. Ce remplacement continue de parcourir la chaîne de repli configurée sans tester le modèle principal à chaque message, mais OpenClaw teste l’origine configurée toutes les 5 minutes (ce délai n’est pas configurable) et supprime le remplacement dès qu’elle est de nouveau opérationnelle. `/new`, `/reset` et `sessions.reset` suppriment également les remplacements provenant d’une sélection automatique. Les exécutions Heartbeat sans `heartbeat.model` explicite suppriment les remplacements automatiques directs lorsque leur origine ne correspond plus à la valeur par défaut actuellement configurée.
- **Remplacement de session par l’utilisateur** : `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` écrivent `modelOverrideSource: "user"`. Il s’agit d’une sélection exacte pour la session. Si le fournisseur ou le modèle sélectionné échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre à l’aide d’un modèle de repli configuré sans rapport.
- **Ancien remplacement de session** : les anciennes entrées de session peuvent contenir `modelOverride` sans `modelOverrideSource`. OpenClaw les traite comme des remplacements effectués par l’utilisateur afin qu’une ancienne sélection explicite ne soit pas silencieusement convertie en comportement de repli.
- **Modèle de charge utile Cron** : le `payload.model` ou l’option `--model` d’une tâche Cron définit le modèle principal de la tâche, et non un remplacement de session par l’utilisateur. Il utilise les replis configurés, sauf si la tâche fournit `payload.fallbacks` ; `payload.fallbacks: []` rend l’exécution Cron stricte.

OpenClaw mémorise les tests récents du modèle principal pour chaque session et chaque modèle principal afin de ne pas réessayer un modèle principal défaillant à chaque tour. Il envoie une notification visible lorsqu’une session passe à un modèle de repli, puis une autre lorsqu’elle revient au modèle principal sélectionné ; il ne répète pas cette notification à chaque tour restant sur le même modèle de repli.

## Cache d’exclusion après un échec d’authentification

Par défaut, chaque nouveau tour conserve le comportement existant de nouvelle tentative de repli : OpenClaw réessaie chaque modèle candidat de repli configuré, y compris les candidats non principaux qui ont récemment échoué avec `auth` ou `auth_permanent`.

Pour éviter la répétition des échecs d’authentification, activez cette option avec :

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Lorsqu’elle est activée, OpenClaw enregistre en mémoire un marqueur d’exclusion propre à la session pour un modèle candidat de repli non principal après un échec de la catégorie authentification. Ce marqueur est indexé par identifiant de session, fournisseur et modèle. Les candidats principaux ne sont jamais exclus, afin qu’une sélection explicite de modèle par l’utilisateur continue d’afficher la véritable erreur d’authentification. Le cache est local au processus et est vidé au redémarrage du Gateway.

La valeur est une durée de vie en millisecondes. La valeur `0` ou l’absence de valeur désactive le cache. Les valeurs positives sont limitées à une plage comprise entre 1 seconde et 10 minutes.

## Notifications de repli visibles par l’utilisateur

Lorsqu’une session passe à un modèle de repli sélectionné automatiquement, OpenClaw envoie une notification d’état sur la même surface de réponse :

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Lorsqu’un test ultérieur réussit et que la session revient au modèle principal sélectionné, OpenClaw envoie :

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Ces notifications sont des messages opérationnels, et non du contenu de l’assistant. Elles sont envoyées une fois par changement d’état, y compris lorsque cela est possible pendant les tours produisant uniquement des effets secondaires, mais elles ne sont pas répétées lors des tours restant sur le même modèle de repli. Leur envoi contourne la suppression normale des réponses à la source, n’occupe pas le premier emplacement de réponse de l’assistant dans les canaux à fils de discussion et est exclu de la synthèse vocale ainsi que de l’extraction des engagements.

## Stockage de l’authentification (clés et OAuth)

OpenClaw utilise des **profils d’authentification** pour les clés d’API comme pour les jetons OAuth.

- Les secrets et l’état de routage de l’authentification à l’exécution se trouvent dans `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Les paramètres `auth.profiles` et `auth.order` contiennent **uniquement des métadonnées et des informations de routage** (aucun secret).
- Ancien fichier OAuth réservé à l’importation : `~/.openclaw/credentials/oauth.json` (importé dans le stockage d’authentification propre à l’agent lors de la première utilisation).
- Les anciens fichiers `auth-profiles.json`, `auth-state.json` et les fichiers `auth.json` propres à chaque agent sont importés par `openclaw doctor --fix`.

Plus de détails : [OAuth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)
- `type: "token"` → jeton statique de type porteur, éventuellement assorti d’une expiration ; OpenClaw ne le renouvelle pas (utilisé pour `aws-sdk` et les autres modes d’authentification reposant sur une chaîne d’identifiants)

## Identifiants de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Valeur par défaut : `provider:default` lorsqu’aucune adresse e-mail n’est disponible.
- OAuth avec adresse e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils se trouvent dans le stockage de profils d’authentification `openclaw-agent.sqlite` propre à l’agent.

## Ordre de rotation

Lorsqu’un fournisseur dispose de plusieurs profils, OpenClaw détermine leur ordre comme suit :

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (si défini).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtré par fournisseur.
  </Step>
  <Step title="Stored profiles">
    Entrées de profil d’authentification SQLite propres à l’agent pour le fournisseur.
  </Step>
</Steps>

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre en rotation circulaire :

- **Clé principale :** type de profil (**OAuth, puis jeton statique, puis clé d’API**).
- **Clé secondaire :** `usageStats.lastUsed` (du plus ancien au plus récent au sein de chaque type).
- Les **profils en temporisation ou désactivés** sont placés à la fin, classés selon l’échéance la plus proche.

### Affinité de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi pour chaque session** afin de maintenir les caches du fournisseur actifs. Il ne procède **pas** à une rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de Compaction augmente)
- le profil soit en temporisation ou désactivé

Une sélection manuelle avec `/model …@<profileId>` définit un **remplacement par l’utilisateur** pour cette session et ne fait l’objet d’aucune rotation automatique jusqu’au démarrage d’une nouvelle session.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** : ils sont essayés en premier, mais OpenClaw peut passer à un autre profil en cas de limitation de débit ou d’expiration du délai. Lorsque le profil d’origine redevient disponible, les nouvelles exécutions peuvent de nouveau le privilégier sans modifier le modèle sélectionné ni l’environnement d’exécution. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des modèles de repli sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Abonnement OpenAI Codex avec clé d’API de secours

Pour les modèles d’agent OpenAI, l’authentification et l’environnement d’exécution sont distincts. `openai/gpt-*` reste dans le banc d’exécution Codex, tandis que l’authentification peut alterner entre un profil d’abonnement Codex et une clé d’API OpenAI de secours.

Utilisez `auth.order.openai` pour définir l’ordre présenté à l’utilisateur :

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Utilisez `openai:*` pour les profils OAuth ChatGPT/Codex comme pour les profils de clé d’API OpenAI. Lorsque l’abonnement atteint une limite d’utilisation de Codex, OpenClaw enregistre l’heure exacte de réinitialisation lorsque Codex en fournit une, essaie le profil d’authentification suivant dans l’ordre et maintient l’exécution dans le banc Codex. Une fois l’heure de réinitialisation passée, le profil d’abonnement redevient admissible et la sélection automatique suivante peut y revenir.

Utilisez un profil épinglé par l’utilisateur uniquement si vous souhaitez imposer un compte ou une clé pour cette session. Les profils épinglés par l’utilisateur sont volontairement stricts et ne passent pas silencieusement à un autre profil.

## Temporisations

Lorsqu’un profil échoue à cause d’une erreur d’authentification ou de limitation de débit (ou d’une expiration de délai ressemblant à une limitation de débit), OpenClaw le place en temporisation et passe au profil suivant.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Cette catégorie de limitation de débit est plus large que le simple code `429` : elle comprend également les messages de fournisseurs tels que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, ainsi que les limites périodiques de fenêtre d’utilisation telles que `weekly limit reached` ou `monthly limit exhausted`.

    Les erreurs de format ou de requête non valide sont généralement définitives, car une nouvelle tentative avec la même charge utile échouerait de la même manière ; OpenClaw les affiche donc au lieu de faire tourner les profils d’authentification. Les mécanismes connus de réparation avant nouvelle tentative peuvent être activés explicitement : par exemple, les échecs de validation des identifiants d’appel d’outil de Cloud Code Assist sont assainis, puis réessayés une fois au moyen de la politique `allowFormatRetry`. Les erreurs de motif d’arrêt compatibles avec OpenAI, telles que `Unhandled stop reason: error`, `stop reason: error` et `reason: error`, sont classées comme des signaux d’expiration de délai ou de basculement.

    Un texte générique du serveur peut également relever de cette catégorie d’expiration de délai lorsque la source correspond à un motif transitoire connu. Par exemple, le message brut de l’enveloppe de flux de l’environnement d’exécution du modèle `An unknown error occurred` est considéré comme justifiant un basculement pour tous les fournisseurs, car l’environnement d’exécution partagé des modèles l’émet lorsque les flux du fournisseur se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans fournir de détails précis. Les charges utiles JSON `api_error` contenant un texte de serveur transitoire tel que `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` sont également traitées comme des expirations de délai justifiant un basculement.

    Un texte générique propre à OpenRouter concernant le service en amont, tel que le simple message `Provider returned error`, n’est traité comme une expiration de délai que lorsque le contexte du fournisseur est effectivement OpenRouter. Un texte générique de repli interne tel que `LLM request failed with an unknown error.` reste traité avec prudence et ne déclenche pas à lui seul un basculement.

  </Accordion>
  <Accordion title="Plafonds de Retry-After du SDK">
    Certains SDK de fournisseurs peuvent autrement attendre pendant une longue période `Retry-After` avant de rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless, tels que ceux d’Anthropic et d’OpenAI, OpenClaw limite par défaut à 60 secondes les attentes internes au SDK `retry-after-ms` / `retry-after` et transmet immédiatement les réponses réessayables plus longues afin que ce chemin de basculement puisse s’exécuter. Ajustez ou désactivez ce plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; consultez [Comportement des nouvelles tentatives](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Délais de récupération propres au modèle">
    Les délais de récupération liés aux limites de débit peuvent également être propres au modèle :

    - OpenClaw enregistre `cooldownModel` pour les échecs dus à une limite de débit lorsque l’identifiant du modèle en échec est connu.
    - Un modèle frère chez le même fournisseur peut toujours être essayé lorsque le délai de récupération concerne un autre modèle.
    - Les périodes liées à la facturation ou à la désactivation continuent de bloquer l’ensemble du profil pour tous les modèles.

  </Accordion>
</AccordionGroup>

Les délais de récupération ordinaires (hors facturation et échec d’authentification permanent) augmentent selon le nombre d’erreurs récentes du profil :

- 1er échec : 30 secondes
- 2e échec : 1 minute
- 3e échec et suivants : 5 minutes (plafond)

Les compteurs sont réinitialisés une fois la fenêtre d’échec du profil écoulée (`auth.cooldowns.failureWindowHours`, 24 par défaut).

L’état est stocké dans l’état d’authentification SQLite propre à l’agent, sous `usageStats` :

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Désactivations liées à la facturation

Les échecs de facturation ou de crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont considérés comme justifiant un basculement, mais ils ne sont généralement pas transitoires. Au lieu d’un bref délai de récupération, OpenClaw marque le profil comme **désactivé** (avec une temporisation plus longue), puis passe au profil ou fournisseur suivant.

<Note>
Les réponses évoquant un problème de facturation ne portent pas toutes le code `402`, et les réponses HTTP `402` ne sont pas toutes classées ici. OpenClaw conserve les messages mentionnant explicitement la facturation dans la catégorie correspondante, même lorsqu’un fournisseur renvoie plutôt `401` ou `403`, mais les règles de détection propres à un fournisseur restent limitées au fournisseur qui les définit (par exemple `403 Key limit exceeded` d’OpenRouter).

En revanche, les erreurs temporaires `402` liées à une fenêtre d’utilisation ou à une limite de dépenses d’organisation ou d’espace de travail sont classées comme `rate_limit` lorsque le message semble indiquer qu’une nouvelle tentative est possible (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Elles restent sur le chemin de bref délai de récupération et de basculement, plutôt que de suivre celui de la désactivation prolongée pour facturation.
</Note>

Les échecs d’authentification permanents identifiés avec un degré de confiance élevé (clés révoquées ou désactivées, espaces de travail désactivés) suivent une catégorie de désactivation similaire, mais la récupération est beaucoup plus rapide que pour la facturation, car certains fournisseurs renvoient temporairement des réponses ressemblant à des erreurs d’authentification pendant des incidents.

L’état est stocké dans l’état d’authentification SQLite propre à l’agent :

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Valeurs par défaut (`auth.cooldowns.*`) :

| Clé                           | Valeur par défaut | Rôle                                                                                         |
| ----------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5                 | Temporisation de base pour la facturation, doublée à chaque échec de facturation              |
| `billingMaxHours`             | 24                | Plafond de la temporisation pour la facturation                                               |
| `authPermanentBackoffMinutes` | 10                | Temporisation de base pour les échecs d’authentification permanents à haut degré de confiance |
| `authPermanentMaxMinutes`     | 60                | Plafond de cette temporisation                                                                |
| `failureWindowHours`          | 24                | Réinitialisation des compteurs si aucun échec ne survient pendant cette fenêtre               |
| `overloadedProfileRotations`  | 1                 | Rotations de profil autorisées chez le même fournisseur avant le repli de modèle en surcharge |
| `overloadedBackoffMs`         | 0                 | Délai fixe avant une nouvelle tentative de rotation en cas de surcharge                       |
| `rateLimitedProfileRotations` | 1                 | Rotations de profil autorisées chez le même fournisseur avant le repli de modèle à la limite de débit |

Les erreurs de surcharge et de limite de débit sont gérées plus agressivement que les délais de récupération liés à la facturation : par défaut, OpenClaw autorise une nouvelle tentative avec un autre profil d’authentification du même fournisseur, puis passe au modèle de repli configuré suivant sans attendre.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux expirations de délai ayant épuisé la rotation des profils (les autres erreurs ne déclenchent pas le repli suivant). Les erreurs de fournisseur qui ne fournissent pas assez de détails restent étiquetées précisément dans l’état de repli : `empty_response` signifie que le fournisseur n’a renvoyé aucun message ni état exploitable, `no_error_details` signifie que le fournisseur a explicitement renvoyé `Unknown error (no error details in response)`, et `unclassified` signifie qu’OpenClaw a conservé l’aperçu brut, mais qu’aucun classificateur ne lui correspond encore.

Les signaux indiquant qu’un fournisseur est occupé, tels que `ModelNotReadyException`, sont classés dans la catégorie de surcharge et suivent la même politique consistant en une rotation, puis un repli, que les limites de débit (consultez le tableau des valeurs par défaut ci-dessus).

Lorsqu’une exécution démarre avec le modèle principal configuré par défaut, le modèle principal d’une tâche Cron, le modèle principal d’un agent doté de replis explicites ou un remplacement de repli sélectionné automatiquement, OpenClaw peut parcourir la chaîne de repli configurée correspondante. Les modèles principaux d’agents sans replis explicites et les sélections explicites de l’utilisateur (par exemple `/model ollama/qwen3.5:27b`, le sélecteur de modèle, `sessions.patch` ou les remplacements ponctuels de fournisseur/modèle dans la CLI) sont stricts : si ce fournisseur ou modèle est inaccessible ou échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre depuis un repli sans rapport.

### Règles de la chaîne de candidats

OpenClaw construit la liste des candidats à partir du `provider/model` actuellement demandé et des replis configurés.

<AccordionGroup>
  <Accordion title="Règles">
    - Le modèle demandé est toujours placé en premier.
    - Les replis configurés explicitement sont dédupliqués, mais ne sont pas filtrés par la liste des modèles autorisés. Ils sont considérés comme une intention explicite de l’opérateur.
    - Si l’exécution actuelle utilise déjà un repli configuré de la même famille de fournisseurs, OpenClaw continue d’utiliser l’intégralité de la chaîne configurée.
    - Lorsqu’aucun remplacement explicite des replis n’est fourni, les replis configurés sont essayés avant le modèle principal configuré, même si le modèle demandé utilise un autre fournisseur.
    - Lorsqu’aucun remplacement explicite des replis n’est fourni au moteur de repli, le modèle principal configuré est ajouté à la fin afin que la chaîne puisse revenir au modèle par défaut habituel une fois les candidats précédents épuisés.
    - Lorsqu’un appelant fournit `fallbacksOverride`, le moteur utilise exactement le modèle demandé, suivi de cette liste de remplacement. Une liste vide désactive le repli de modèle et empêche l’ajout du modèle principal configuré comme cible cachée de nouvelle tentative.

  </Accordion>
</AccordionGroup>

### Erreurs qui déclenchent le repli suivant

<Tabs>
  <Tab title="Poursuite en cas de">
    - échecs d’authentification
    - limites de débit et épuisement des délais de récupération
    - erreurs de surcharge ou de fournisseur occupé
    - erreurs de basculement liées à une expiration de délai
    - désactivations liées à la facturation
    - `LiveSessionModelSwitchError`, normalisée en chemin de basculement afin qu’un modèle obsolète conservé dans l’état persistant ne crée pas de boucle externe de nouvelles tentatives
    - autres erreurs non reconnues lorsqu’il reste des candidats

  </Tab>
  <Tab title="Aucune poursuite en cas de">
    - abandons explicites qui ne correspondent pas à une expiration de délai ou à un basculement
    - erreurs de dépassement de contexte qui doivent rester dans la logique de Compaction et de nouvelle tentative (par exemple `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` ou `ollama error: context length exceeded`)
    - dernière erreur inconnue lorsqu’il ne reste aucun candidat
    - refus de sécurité de Claude Fable 5 ; les requêtes directes avec clé d’API les gèrent au niveau du fournisseur au moyen du repli côté serveur d’Anthropic vers `claude-opus-4-8` (consultez [Anthropic](/fr/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Ignorer le délai de récupération ou effectuer une sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en délai de récupération, OpenClaw n’ignore pas automatiquement ce fournisseur indéfiniment. Il prend une décision pour chaque candidat :

<AccordionGroup>
  <Accordion title="Décisions par candidat">
    - Les échecs d’authentification persistants entraînent l’exclusion immédiate de l’ensemble du fournisseur.
    - Les désactivations liées à la facturation entraînent généralement une exclusion, mais le candidat principal peut tout de même faire l’objet de sondes à fréquence limitée afin de permettre une récupération sans redémarrage.
    - Le candidat principal peut faire l’objet d’une sonde à l’approche de l’expiration du délai de récupération, avec une fréquence limitée pour chaque fournisseur.
    - Les modèles de repli frères du même fournisseur peuvent être essayés malgré le délai de récupération lorsque l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). Cela est particulièrement pertinent lorsqu’une limite de débit concerne un modèle précis et qu’un modèle frère peut fonctionner immédiatement.
    - Les sondes pendant les délais de récupération transitoires sont limitées à une par fournisseur et par exécution de repli afin qu’un seul fournisseur ne retarde pas le repli vers un autre fournisseur.

  </Accordion>
</AccordionGroup>

## Remplacements de session et changement de modèle en direct

Les changements de modèle d’une session constituent un état partagé. Le moteur actif, la commande `/model`, les mises à jour de Compaction ou de session et la réconciliation de session en direct lisent ou écrivent tous des parties de la même entrée de session.

Les nouvelles tentatives de repli doivent donc être coordonnées avec le changement de modèle en direct :

- Seuls les changements de modèle explicitement déclenchés par l’utilisateur signalent un changement en direct en attente. Cela comprend `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle déclenchés par le système, tels que la rotation de repli, les remplacements de Heartbeat ou la Compaction, ne signalent jamais à eux seuls un changement en direct en attente.
- Les remplacements de modèle déclenchés par l’utilisateur sont considérés comme des sélections exactes pour la politique de repli. Un fournisseur sélectionné mais inaccessible produit donc une erreur au lieu d’être masqué par `agents.defaults.model.fallbacks`.
- Avant le début d’une nouvelle tentative de repli, le moteur de réponse enregistre les champs de remplacement du repli sélectionné dans l’entrée de session.
- Les remplacements automatiques de repli restent sélectionnés lors des tours suivants afin qu’OpenClaw ne sonde pas un modèle principal connu comme défaillant à chaque message. OpenClaw sonde périodiquement à nouveau l’origine configurée et efface le remplacement automatique lorsqu’elle est rétablie ; `/new`, `/reset` et `sessions.reset` effacent immédiatement les remplacements d’origine automatique.
- Les réponses adressées à l’utilisateur annoncent les transitions vers un repli et la récupération après suppression du repli une seule fois par changement d’état. Les tours qui conservent le même repli ne répètent pas l’avis.
- `/status` affiche le modèle sélectionné et, lorsque l’état de repli diffère, le modèle de repli actif et sa raison.
- La réconciliation de session en direct privilégie les remplacements persistants de la session aux champs obsolètes du modèle d’exécution.
- Si une erreur de changement en direct désigne un candidat ultérieur de la chaîne de repli active, OpenClaw passe directement au modèle sélectionné au lieu de parcourir d’abord des candidats sans rapport.
- Si la tentative de repli échoue, le moteur annule uniquement les champs de remplacement qu’il a écrits, et seulement s’ils correspondent encore à ce candidat en échec.

Cela évite la situation de concurrence classique :

<Steps>
  <Step title="Échec du modèle principal">
    Le modèle principal sélectionné échoue.
  </Step>
  <Step title="Repli choisi en mémoire">
    Le candidat de repli est choisi en mémoire.
  </Step>
  <Step title="Le stockage de session indique encore l’ancien modèle principal">
    Le stockage de session reflète encore l’ancien modèle principal.
  </Step>
  <Step title="La réconciliation en direct lit un état obsolète">
    La réconciliation de session en direct lit l’état obsolète de la session.
  </Step>
  <Step title="La nouvelle tentative revient à l’ancien modèle">
    La nouvelle tentative revient à l’ancien modèle avant le début de la tentative de repli.
  </Step>
</Steps>

Le remplacement de repli enregistré dans l’état persistant referme cette fenêtre, tandis que l’annulation ciblée préserve les modifications manuelles ou d’exécution plus récentes de la session.

## Observabilité et résumés des échecs

`runWithModelFallback(...)` enregistre les détails de chaque tentative qui alimentent les journaux et les messages de délai de récupération destinés aux utilisateurs :

- fournisseur/modèle essayé
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` et raisons similaires de basculement)
- statut/code facultatif
- résumé de l’erreur lisible par un humain

Les journaux structurés `model_fallback_decision` incluent également des champs plats `fallbackStep*` lorsqu’un candidat échoue, est ignoré ou qu’un basculement ultérieur réussit. Ces champs rendent explicite la transition tentée (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), afin que les exportateurs de journaux et de diagnostics puissent reconstituer l’échec initial même lorsque le dernier modèle de secours échoue également.

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. Le gestionnaire externe des réponses peut l’utiliser pour générer un message plus précis, tel que « tous les modèles sont temporairement soumis à une limitation de débit », et indiquer la prochaine expiration du délai de récupération lorsqu’elle est connue.

Ce résumé des délais de récupération tient compte du modèle :

- les limitations de débit limitées à des modèles sans rapport sont ignorées pour la chaîne fournisseur/modèle essayée
- si le blocage restant correspond à une limitation de débit limitée au modèle concerné, OpenClaw indique la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Consultez [Configuration du Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- le routage de `agents.defaults.imageModel`

Consultez [Modèles](/fr/concepts/models) pour une présentation générale de la sélection des modèles et du basculement.
