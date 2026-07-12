---
read_when:
    - Diagnostic de la rotation des profils d’authentification, des délais de récupération ou du comportement de repli des modèles
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les substitutions de modèle de session interagissent avec les nouvelles tentatives de repli
sidebarTitle: Model failover
summary: Comment OpenClaw alterne les profils d’authentification et bascule vers des modèles de secours
title: Basculement de modèle
x-i18n:
    generated_at: "2026-07-12T15:13:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Modèle de secours** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

## Flux d’exécution

<Steps>
  <Step title="Résoudre l’état de la session">
    Résolvez le modèle actif de la session et la préférence de profil d’authentification.
  </Step>
  <Step title="Construire la chaîne de candidats">
    Construisez la chaîne de modèles candidats à partir de la sélection de modèle actuelle et de la politique de secours correspondant à la source de cette sélection. Les valeurs par défaut configurées, les modèles principaux des tâches cron et les modèles de secours sélectionnés automatiquement peuvent utiliser les modèles de secours configurés ; les sélections explicites de session effectuées par l’utilisateur sont strictes.
  </Step>
  <Step title="Essayer le fournisseur actuel">
    Essayez le fournisseur actuel en appliquant les règles de rotation et de temporisation des profils d’authentification.
  </Step>
  <Step title="Passer au suivant en cas d’erreurs justifiant un basculement">
    Si les possibilités de ce fournisseur sont épuisées à cause d’une erreur justifiant un basculement, passez au modèle candidat suivant.
  </Step>
  <Step title="Conserver le remplacement de secours">
    Conservez le remplacement de secours sélectionné avant le début de la nouvelle tentative afin que les autres lecteurs de la session voient le même fournisseur et le même modèle que ceux que l’exécuteur est sur le point d’utiliser. Le remplacement de modèle conservé est marqué `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Annuler uniquement les changements concernés en cas d’échec">
    Si le candidat de secours échoue, annulez uniquement les champs de remplacement de session appartenant au mécanisme de secours lorsqu’ils correspondent encore à ce candidat en échec.
  </Step>
  <Step title="Lever FallbackSummaryError si tous les candidats sont épuisés">
    Si tous les candidats échouent, levez une `FallbackSummaryError` contenant les détails de chaque tentative et l’expiration de temporisation la plus proche lorsqu’elle est connue.
  </Step>
</Steps>

Cette approche est volontairement plus restreinte que « enregistrer et restaurer toute la session ». L’exécuteur de réponse ne conserve que les champs de sélection de modèle dont il est responsable pour le mécanisme de secours : `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Cela empêche une nouvelle tentative de secours ayant échoué d’écraser des modifications de session plus récentes et sans rapport, telles qu’un changement manuel via `/model` ou une mise à jour de rotation de session survenue pendant l’exécution de la tentative.

## Politique relative à la source de sélection

La source de sélection détermine si la chaîne de secours est autorisée :

- **Valeur par défaut configurée** : `agents.defaults.model.primary` utilise `agents.defaults.model.fallbacks`.
- **Modèle principal de l’agent** : `agents.list[].model` est strict, sauf si l’objet de modèle de cet agent inclut ses propres `fallbacks`. Utilisez `fallbacks: []` pour rendre explicite le comportement strict, ou une liste non vide pour autoriser le recours à des modèles de secours pour cet agent.
- **Remplacement de secours automatique** : un mécanisme de secours à l’exécution écrit `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` et le modèle d’origine sélectionné avant de réessayer. Ce remplacement continue de parcourir la chaîne de secours configurée sans tester le modèle principal à chaque message, mais OpenClaw teste l’origine configurée toutes les 5 minutes (non configurable) et efface le remplacement dès qu’elle est de nouveau disponible. `/new`, `/reset` et `sessions.reset` effacent également les remplacements provenant d’une sélection automatique. Les exécutions Heartbeat sans `heartbeat.model` explicite effacent les remplacements automatiques directs lorsque leur origine ne correspond plus à la valeur par défaut actuellement configurée.
- **Remplacement de session par l’utilisateur** : `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` écrivent `modelOverrideSource: "user"`. Il s’agit d’une sélection de session exacte. Si le fournisseur ou le modèle sélectionné échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre à l’aide d’un modèle de secours configuré sans rapport.
- **Ancien remplacement de session** : les anciennes entrées de session peuvent comporter `modelOverride` sans `modelOverrideSource`. OpenClaw les traite comme des remplacements effectués par l’utilisateur afin qu’une ancienne sélection explicite ne soit pas silencieusement convertie en comportement de secours.
- **Modèle de charge utile Cron** : le `payload.model` / `--model` d’une tâche cron est le modèle principal de la tâche, et non un remplacement de session effectué par l’utilisateur. Il utilise les modèles de secours configurés, sauf si la tâche fournit `payload.fallbacks` ; `payload.fallbacks: []` rend l’exécution cron stricte.

OpenClaw mémorise les tests récents du modèle principal pour chaque session et modèle principal afin qu’un modèle principal défaillant ne soit pas réessayé à chaque tour. Il envoie une notification visible lorsqu’une session passe sur un modèle de secours, puis une autre lorsqu’elle revient au modèle principal sélectionné ; il ne répète pas la notification à chaque tour restant sur le même modèle de secours.

## Cache d’exclusion après un échec d’authentification

Par défaut, chaque nouveau tour conserve le comportement existant de nouvelle tentative avec les modèles de secours : OpenClaw réessaie chaque candidat de secours configuré, y compris les candidats non principaux ayant récemment échoué avec `auth` ou `auth_permanent`.

Pour éviter la répétition des échecs d’authentification, activez cette option avec :

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Lorsque cette option est activée, OpenClaw enregistre en mémoire un marqueur d’exclusion propre à la session pour un candidat de secours non principal après un échec relevant de l’authentification, indexé par identifiant de session, fournisseur et modèle. Les candidats principaux ne sont jamais exclus, de sorte qu’une sélection explicite de modèle par l’utilisateur affiche toujours la véritable erreur d’authentification. Le cache est local au processus et est effacé au redémarrage du Gateway.

La valeur est une durée de vie en millisecondes. `0` ou une valeur non définie désactive le cache. Les valeurs positives sont limitées entre 1 seconde et 10 minutes.

## Notifications de recours à un modèle de secours visibles par l’utilisateur

Lorsqu’une session passe sur un modèle de secours sélectionné automatiquement, OpenClaw envoie une notification d’état dans la même surface de réponse :

```text
↪️ Modèle de secours : <fallback> (<primary> sélectionné ; <reason>)
```

Lorsqu’un test ultérieur réussit et que la session revient au modèle principal sélectionné, OpenClaw envoie :

```text
↪️ Modèle de secours désactivé : <primary> (précédemment <fallback>)
```

Ces notifications sont des messages opérationnels, et non du contenu de l’assistant. Elles sont envoyées une fois par changement d’état, y compris, lorsque cela est possible, pendant les tours produisant uniquement des effets secondaires, mais elles ne sont pas répétées lors des tours restant sur le même modèle de secours. Leur envoi contourne la suppression normale des réponses à la source, ne consomme pas le premier emplacement de réponse de l’assistant pour les canaux organisés en fils de discussion et est exclu de la synthèse vocale et de l’extraction des engagements.

## Stockage de l’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** pour les clés d’API comme pour les jetons OAuth.

- Les secrets et l’état de routage de l’authentification à l’exécution se trouvent dans `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Les paramètres `auth.profiles` / `auth.order` sont réservés aux **métadonnées et au routage** (aucun secret).
- Ancien fichier OAuth réservé à l’importation : `~/.openclaw/credentials/oauth.json` (importé dans le magasin d’authentification propre à l’agent lors de la première utilisation).
- Les anciens fichiers `auth-profiles.json`, `auth-state.json` et les fichiers `auth.json` propres à chaque agent sont importés par `openclaw doctor --fix`.

Plus de détails : [OAuth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)
- `type: "token"` → jeton statique de type porteur, avec expiration facultative ; OpenClaw ne l’actualise pas (utilisé pour `aws-sdk` et d’autres modes d’authentification fondés sur une chaîne d’identifiants)

## Identifiants de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Valeur par défaut : `provider:default` lorsqu’aucune adresse e-mail n’est disponible.
- OAuth avec adresse e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils se trouvent dans le magasin de profils d’authentification `openclaw-agent.sqlite` propre à l’agent.

## Ordre de rotation

Lorsqu’un fournisseur dispose de plusieurs profils, OpenClaw détermine leur ordre comme suit :

<Steps>
  <Step title="Configuration explicite">
    `auth.order[provider]` (si défini).
  </Step>
  <Step title="Profils configurés">
    `auth.profiles` filtrés par fournisseur.
  </Step>
  <Step title="Profils stockés">
    Entrées de profils d’authentification SQLite propres à l’agent pour le fournisseur.
  </Step>
</Steps>

Si aucun ordre explicite n’est configuré, OpenClaw utilise une rotation circulaire :

- **Clé principale :** type de profil (**OAuth, puis jeton statique, puis clé d’API**).
- **Clé secondaire :** `usageStats.lastUsed` (les plus anciens en premier, au sein de chaque type).
- Les **profils en temporisation ou désactivés** sont déplacés à la fin, classés selon l’expiration la plus proche.

### Affinité de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi pour chaque session** afin de garder les caches du fournisseur actifs. Il n’effectue **pas** de rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de Compaction est incrémenté)
- le profil soit en temporisation ou désactivé

La sélection manuelle via `/model …@<profileId>` définit un **remplacement utilisateur** pour cette session et n’est pas soumise à une rotation automatique jusqu’au début d’une nouvelle session.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** : ils sont essayés en premier, mais OpenClaw peut passer à un autre profil en cas de limitation de débit ou d’expiration du délai. Lorsque le profil d’origine redevient disponible, les nouvelles exécutions peuvent de nouveau le privilégier sans changer le modèle sélectionné ni l’environnement d’exécution. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des modèles de secours sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Abonnement OpenAI Codex avec clé d’API de secours

Pour les modèles d’agent OpenAI, l’authentification et l’environnement d’exécution sont distincts. `openai/gpt-*` reste dans le harnais Codex, tandis que l’authentification peut alterner entre un profil d’abonnement Codex et une clé d’API OpenAI de secours.

Utilisez `auth.order.openai` pour définir l’ordre visible par l’utilisateur :

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Utilisez `openai:*` à la fois pour les profils OAuth ChatGPT/Codex et pour les profils de clé d’API OpenAI. Lorsque l’abonnement atteint une limite d’utilisation Codex, OpenClaw enregistre l’heure exacte de réinitialisation lorsque Codex en fournit une, essaie le profil d’authentification suivant dans l’ordre et maintient l’exécution dans le harnais Codex. Une fois l’heure de réinitialisation passée, le profil d’abonnement redevient admissible et la sélection automatique suivante peut y revenir.

Utilisez un profil épinglé par l’utilisateur uniquement lorsque vous souhaitez imposer un compte ou une clé pour cette session. Les profils épinglés par l’utilisateur sont volontairement stricts et ne passent pas silencieusement à un autre profil.

## Temporisations

Lorsqu’un profil échoue en raison d’erreurs d’authentification ou de limitation de débit (ou d’une expiration de délai ressemblant à une limitation de débit), OpenClaw le place en temporisation et passe au profil suivant.

<AccordionGroup>
  <Accordion title="Éléments classés dans la catégorie des limitations de débit et expirations de délai">
    Cette catégorie de limitation de débit est plus large que le simple code `429` : elle inclut également des messages de fournisseurs tels que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, ainsi que les limites périodiques de fenêtres d’utilisation telles que `weekly limit reached` ou `monthly limit exhausted`.

    Les erreurs de format ou de requête non valide sont généralement définitives, car une nouvelle tentative avec la même charge utile échouerait de la même manière ; OpenClaw les affiche donc au lieu d’effectuer une rotation des profils d’authentification. Les mécanismes connus de réparation et de nouvelle tentative peuvent être activés explicitement : par exemple, les échecs de validation des identifiants d’appel d’outil Cloud Code Assist sont assainis puis réessayés une fois conformément à la politique `allowFormatRetry`. Les erreurs de motif d’arrêt compatibles avec OpenAI, telles que `Unhandled stop reason: error`, `stop reason: error` et `reason: error`, sont classées comme des signaux d’expiration de délai ou de basculement.

    Un texte de serveur générique peut également être classé dans cette catégorie d’expiration de délai lorsque la source correspond à un motif transitoire connu. Par exemple, le message brut de l’enveloppe de flux de l’environnement d’exécution du modèle `An unknown error occurred` est considéré comme justifiant un basculement pour tous les fournisseurs, car l’environnement d’exécution partagé du modèle l’émet lorsque les flux du fournisseur se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans détails précis. Les charges utiles JSON `api_error` contenant un texte de serveur transitoire tel que `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` sont également traitées comme des expirations de délai justifiant un basculement.

    Le texte générique propre à OpenRouter et provenant de l’amont, tel que le simple `Provider returned error`, est traité comme une expiration de délai uniquement lorsque le contexte du fournisseur est effectivement OpenRouter. Un texte générique de secours interne tel que `LLM request failed with an unknown error.` reste traité de manière prudente et ne déclenche pas de basculement à lui seul.

  </Accordion>
  <Accordion title="Plafonds de retry-after du SDK">
    Certains SDK de fournisseurs peuvent autrement rester en attente pendant une longue période `Retry-After` avant de rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless, comme ceux d’Anthropic et d’OpenAI, OpenClaw plafonne par défaut à 60 secondes les attentes internes au SDK liées à `retry-after-ms` / `retry-after` et remonte immédiatement les réponses réessayables nécessitant une attente plus longue afin que ce chemin de basculement puisse s’exécuter. Ajustez ou désactivez ce plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; consultez [Comportement des nouvelles tentatives](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Délais de récupération propres au modèle">
    Les délais de récupération liés aux limites de débit peuvent également être propres au modèle :

    - OpenClaw enregistre `cooldownModel` pour les échecs liés aux limites de débit lorsque l’identifiant du modèle en échec est connu.
    - Un modèle frère du même fournisseur peut toujours être essayé lorsque le délai de récupération concerne un autre modèle.
    - Les périodes de facturation/désactivation continuent de bloquer l’ensemble du profil pour tous les modèles.

  </Accordion>
</AccordionGroup>

Les délais de récupération ordinaires (hors facturation et échec d’authentification permanent) augmentent en fonction du nombre d’erreurs récentes du profil :

- 1er échec : 30 secondes
- 2e échec : 1 minute
- 3e échec et suivants : 5 minutes (plafond)

Les compteurs sont réinitialisés une fois la fenêtre d’échec du profil écoulée (`auth.cooldowns.failureWindowHours`, valeur par défaut : 24).

L’état est stocké dans l’état d’authentification SQLite propre à chaque agent, sous `usageStats` :

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

Les échecs de facturation ou de crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont considérés comme justifiant un basculement, mais ils ne sont généralement pas transitoires. Au lieu d’appliquer un court délai de récupération, OpenClaw marque le profil comme **désactivé** (avec une temporisation plus longue), puis passe au profil ou fournisseur suivant.

<Note>
Toutes les réponses évoquant un problème de facturation ne portent pas le code `402`, et toutes les réponses HTTP `402` ne sont pas traitées ici. OpenClaw conserve les textes explicitement liés à la facturation dans la catégorie correspondante, même lorsqu’un fournisseur renvoie plutôt `401` ou `403`, mais les règles de correspondance propres à un fournisseur restent limitées au fournisseur qui les définit (par exemple, OpenRouter `403 Key limit exceeded`).

En revanche, les erreurs temporaires `402` liées à une fenêtre d’utilisation ou à une limite de dépenses d’organisation ou d’espace de travail sont classées comme `rate_limit` lorsque le message semble indiquer qu’une nouvelle tentative est possible (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Elles restent sur le chemin de délai de récupération court et de basculement, plutôt que sur celui de la désactivation prolongée liée à la facturation.
</Note>

Les échecs d’authentification permanente à haut niveau de confiance (clés révoquées ou désactivées, espaces de travail désactivés) suivent une catégorie de désactivation similaire, mais la récupération intervient bien plus tôt que pour la facturation, car certains fournisseurs peuvent renvoyer temporairement des charges utiles ressemblant à des erreurs d’authentification lors d’incidents.

L’état est stocké dans l’état d’authentification SQLite propre à chaque agent :

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

| Clé                           | Valeur par défaut | Objectif                                                                     |
| ----------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5                 | Temporisation de facturation de base, doublée à chaque échec de facturation |
| `billingMaxHours`             | 24                | Plafond de la temporisation de facturation                                  |
| `authPermanentBackoffMinutes` | 10                | Temporisation de base pour les échecs d’authentification permanente à haut niveau de confiance |
| `authPermanentMaxMinutes`     | 60                | Plafond de cette temporisation                                               |
| `failureWindowHours`          | 24                | Réinitialisation des compteurs d’échecs si aucun échec ne survient pendant cette fenêtre |
| `overloadedProfileRotations`  | 1                 | Nombre de rotations de profil autorisées chez le même fournisseur avant le basculement de modèle en cas de surcharge |
| `overloadedBackoffMs`         | 0                 | Délai fixe avant une nouvelle tentative de rotation après une surcharge     |
| `rateLimitedProfileRotations` | 1                 | Nombre de rotations de profil autorisées chez le même fournisseur avant le basculement de modèle en cas de limite de débit |

Les erreurs de surcharge et de limite de débit sont gérées plus agressivement que les délais de récupération liés à la facturation : par défaut, OpenClaw autorise une nouvelle tentative avec un autre profil d’authentification du même fournisseur, puis passe au modèle de secours configuré suivant sans attendre.

## Basculement de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux expirations de délai ayant épuisé la rotation des profils (les autres erreurs ne déclenchent pas le basculement suivant). Les erreurs de fournisseur qui ne fournissent pas suffisamment de détails restent étiquetées précisément dans l’état de basculement : `empty_response` signifie que le fournisseur n’a renvoyé aucun message ni statut exploitable, `no_error_details` signifie que le fournisseur a explicitement renvoyé `Unknown error (no error details in response)`, et `unclassified` signifie qu’OpenClaw a conservé l’aperçu brut, mais qu’aucun classificateur ne lui correspond encore.

Les signaux indiquant qu’un fournisseur est occupé, comme `ModelNotReadyException`, sont classés dans la catégorie des surcharges et suivent la même politique d’une rotation, puis d’un basculement que les limites de débit (voir le tableau des valeurs par défaut ci-dessus).

Lorsqu’une exécution démarre à partir du modèle principal configuré par défaut, du modèle principal d’une tâche cron, du modèle principal d’un agent doté de modèles de secours explicites ou d’un remplacement de secours sélectionné automatiquement, OpenClaw peut parcourir la chaîne de secours configurée correspondante. Les modèles principaux d’agents sans modèles de secours explicites et les sélections explicites de l’utilisateur (par exemple `/model ollama/qwen3.5:27b`, le sélecteur de modèle, `sessions.patch` ou des remplacements ponctuels du fournisseur/modèle via la CLI) sont stricts : si ce fournisseur/modèle est inaccessible ou échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre à l’aide d’un modèle de secours sans rapport.

### Règles de la chaîne de candidats

OpenClaw construit la liste des candidats à partir du `provider/model` actuellement demandé et des modèles de secours configurés.

<AccordionGroup>
  <Accordion title="Règles">
    - Le modèle demandé est toujours placé en premier.
    - Les modèles de secours explicitement configurés sont dédupliqués, mais ne sont pas filtrés par la liste des modèles autorisés. Ils sont considérés comme une intention explicite de l’opérateur.
    - Si l’exécution actuelle utilise déjà un modèle de secours configuré appartenant à la même famille de fournisseurs, OpenClaw continue d’utiliser l’intégralité de la chaîne configurée.
    - Lorsqu’aucun remplacement explicite des modèles de secours n’est fourni, les modèles de secours configurés sont essayés avant le modèle principal configuré, même si le modèle demandé utilise un autre fournisseur.
    - Lorsqu’aucun remplacement explicite des modèles de secours n’est fourni au gestionnaire de basculement, le modèle principal configuré est ajouté à la fin afin que la chaîne puisse revenir à la valeur par défaut normale une fois les candidats précédents épuisés.
    - Lorsqu’un appelant fournit `fallbacksOverride`, le gestionnaire utilise exactement le modèle demandé et cette liste de remplacement. Une liste vide désactive le basculement de modèle et empêche l’ajout du modèle principal configuré comme cible cachée de nouvelle tentative.

  </Accordion>
</AccordionGroup>

### Erreurs qui font avancer le basculement

<Tabs>
  <Tab title="Continue pour">
    - les échecs d’authentification
    - les limites de débit et l’épuisement des délais de récupération
    - les erreurs de surcharge ou de fournisseur occupé
    - les erreurs de basculement prenant la forme d’une expiration de délai
    - les désactivations liées à la facturation
    - `LiveSessionModelSwitchError`, qui est normalisée en chemin de basculement afin qu’un modèle obsolète conservé dans l’état persistant ne crée pas de boucle externe de nouvelles tentatives
    - les autres erreurs non reconnues lorsqu’il reste des candidats

  </Tab>
  <Tab title="Ne continue pas pour">
    - les interruptions explicites qui ne prennent pas la forme d’une expiration de délai ou d’un basculement
    - les erreurs de dépassement de contexte qui doivent rester dans la logique de Compaction et de nouvelle tentative (par exemple `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` ou `ollama error: context length exceeded`)
    - une dernière erreur inconnue lorsqu’il ne reste aucun candidat
    - les refus de sécurité de Claude Fable 5 ; les requêtes directes avec clé d’API les gèrent au niveau du fournisseur au moyen du basculement côté serveur d’Anthropic vers `claude-opus-4-8` (voir [Anthropic](/fr/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Comportement entre saut du délai de récupération et sondage

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en délai de récupération, OpenClaw ne l’ignore pas automatiquement et indéfiniment. Il prend une décision pour chaque candidat :

<AccordionGroup>
  <Accordion title="Décisions par candidat">
    - Les échecs d’authentification persistants entraînent immédiatement l’exclusion de l’ensemble du fournisseur.
    - Les désactivations liées à la facturation entraînent généralement une exclusion, mais le candidat principal peut tout de même être sondé à une fréquence limitée afin de permettre une récupération sans redémarrage.
    - Le candidat principal peut être sondé à l’approche de l’expiration du délai de récupération, avec une limitation propre à chaque fournisseur.
    - Les modèles de secours frères du même fournisseur peuvent être essayés malgré le délai de récupération lorsque l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). Cela est particulièrement pertinent lorsqu’une limite de débit est propre à un modèle et qu’un modèle frère peut fonctionner immédiatement.
    - Les sondages pendant un délai de récupération transitoire sont limités à un par fournisseur et par exécution de basculement afin qu’un seul fournisseur ne bloque pas le basculement entre fournisseurs.

  </Accordion>
</AccordionGroup>

## Remplacements de session et changement de modèle en direct

Les changements de modèle de session constituent un état partagé. Le gestionnaire actif, la commande `/model`, les mises à jour de Compaction/session et la réconciliation de session en direct lisent ou écrivent tous des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de basculement doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicitement déclenchés par l’utilisateur marquent un changement en direct comme étant en attente. Cela inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle déclenchés par le système, comme la rotation de secours, les remplacements de Heartbeat ou la Compaction, ne marquent jamais eux-mêmes un changement en direct comme étant en attente.
- Les remplacements de modèle déclenchés par l’utilisateur sont traités comme des sélections exactes dans la politique de basculement ; un fournisseur sélectionné mais inaccessible est donc signalé comme un échec au lieu d’être masqué par `agents.defaults.model.fallbacks`.
- Avant le démarrage d’une nouvelle tentative de basculement, le gestionnaire de réponse enregistre de façon persistante dans l’entrée de session les champs de remplacement correspondant au modèle de secours sélectionné.
- Les remplacements automatiques de secours restent sélectionnés lors des tours suivants afin qu’OpenClaw ne sonde pas un modèle principal connu comme défaillant à chaque message. OpenClaw sonde périodiquement de nouveau l’origine configurée et efface le remplacement automatique lorsqu’elle fonctionne à nouveau ; `/new`, `/reset` et `sessions.reset` effacent immédiatement les remplacements d’origine automatique.
- Les réponses aux utilisateurs annoncent les transitions vers un modèle de secours et la récupération après l’effacement du basculement une fois par changement d’état. Les tours qui conservent le même modèle de secours ne répètent pas la notification.
- `/status` affiche le modèle sélectionné et, lorsque l’état de basculement diffère, le modèle de secours actif ainsi que la raison.
- La réconciliation de session en direct privilégie les remplacements persistants de la session par rapport aux champs de modèle obsolètes de l’exécution.
- Si une erreur de changement en direct désigne un candidat ultérieur dans la chaîne de secours active, OpenClaw passe directement au modèle sélectionné au lieu de parcourir d’abord des candidats sans rapport.
- Si la tentative de basculement échoue, le gestionnaire annule uniquement les champs de remplacement qu’il a écrits, et seulement s’ils correspondent encore au candidat ayant échoué.

Cela évite la situation de concurrence classique :

<Steps>
  <Step title="Échec du modèle principal">
    Le modèle principal sélectionné échoue.
  </Step>
  <Step title="Modèle de secours choisi en mémoire">
    Le modèle de secours candidat est choisi en mémoire.
  </Step>
  <Step title="Le stockage de session indique toujours l’ancien modèle principal">
    Le stockage de session reflète toujours l’ancien modèle principal.
  </Step>
  <Step title="La réconciliation en direct lit un état obsolète">
    La réconciliation de session en direct lit l’état de session obsolète.
  </Step>
  <Step title="Retour de la nouvelle tentative à l’ancien modèle">
    La nouvelle tentative revient à l’ancien modèle avant le début de la tentative de basculement.
  </Step>
</Steps>

Le remplacement persistant du modèle de secours élimine cette fenêtre, tandis que l’annulation ciblée préserve les changements manuels ou d’exécution plus récents apportés à la session.

## Observabilité et résumés des échecs

`runWithModelFallback(...)` enregistre les détails de chaque tentative qui alimentent les journaux et les messages destinés aux utilisateurs concernant les délais de récupération :

- fournisseur/modèle essayé
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` et raisons similaires de basculement)
- statut/code facultatif
- résumé lisible de l’erreur

Les journaux structurés `model_fallback_decision` incluent également des champs plats `fallbackStep*` lorsqu’un candidat échoue, est ignoré ou qu’un basculement ultérieur réussit. Ces champs rendent explicite la transition tentée (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`), afin que les exportateurs de journaux et de diagnostics puissent reconstituer l’échec principal même lorsque le dernier basculement échoue également.

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. Le gestionnaire de réponse externe peut l’utiliser pour produire un message plus précis, tel que « tous les modèles sont temporairement soumis à une limitation de débit », et inclure la prochaine expiration du délai de récupération lorsqu’elle est connue.

Ce résumé du délai de récupération tient compte du modèle :

- les limitations de débit propres à des modèles sans rapport sont ignorées pour la chaîne fournisseur/modèle tentée
- si le blocage restant est une limitation de débit propre au modèle correspondant, OpenClaw indique la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Consultez la [configuration du Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- le routage de `agents.defaults.imageModel`

Consultez [Modèles](/fr/concepts/models) pour une présentation plus générale de la sélection des modèles et du basculement.
