---
read_when:
    - Diagnostic de la rotation des profils d’authentification, des délais de récupération ou du comportement de repli des modèles
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de fallback
sidebarTitle: Model failover
summary: Comment OpenClaw alterne entre les profils d’authentification et bascule entre les modèles
title: Basculement de modèle
x-i18n:
    generated_at: "2026-07-04T15:15:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les prennent en charge.

## Flux d’exécution

Pour une exécution textuelle normale, OpenClaw évalue les candidats dans cet ordre :

<Steps>
  <Step title="Resolve session state">
    Résoudre le modèle de session actif et la préférence de profil d’authentification.
  </Step>
  <Step title="Build candidate chain">
    Construire la chaîne de modèles candidats à partir de la sélection de modèle actuelle et de la politique de repli pour la source de cette sélection. Les valeurs par défaut configurées, les modèles principaux de tâches cron et les modèles de repli sélectionnés automatiquement peuvent utiliser les replis configurés ; les sélections explicites de session utilisateur sont strictes.
  </Step>
  <Step title="Try the current provider">
    Essayer le fournisseur actuel avec les règles de rotation/refroidissement des profils d’authentification.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Si ce fournisseur est épuisé avec une erreur justifiant un basculement, passer au modèle candidat suivant.
  </Step>
  <Step title="Persist fallback override">
    Persister la substitution de repli sélectionnée avant le début de la nouvelle tentative afin que les autres lecteurs de session voient le même fournisseur/modèle que le runner s’apprête à utiliser. La substitution de modèle persistée est marquée `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Si le candidat de repli échoue, annuler uniquement les champs de substitution de session appartenant au repli lorsqu’ils correspondent encore à ce candidat échoué.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Si tous les candidats échouent, lever une `FallbackSummaryError` avec les détails de chaque tentative et la prochaine expiration de refroidissement lorsqu’elle est connue.
  </Step>
</Steps>

C’est volontairement plus étroit que « enregistrer et restaurer toute la session ». Le runner de réponse ne persiste que les champs de sélection de modèle qu’il possède pour le repli :

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela évite qu’une nouvelle tentative de repli échouée écrase des mutations de session plus récentes et sans rapport, comme des changements manuels `/model` ou des mises à jour de rotation de session survenus pendant l’exécution de la tentative.

## Politique de source de sélection

OpenClaw sépare le fournisseur/modèle sélectionné de la raison de cette sélection. Cette source contrôle si la chaîne de repli est autorisée :

- **Valeur par défaut configurée** : `agents.defaults.model.primary` utilise `agents.defaults.model.fallbacks`.
- **Modèle principal de l’agent** : `agents.list[].model` est strict sauf si l’objet de modèle de cet agent inclut ses propres `fallbacks`. Utilisez `fallbacks: []` pour rendre le comportement strict explicite, ou fournissez une liste non vide pour activer le repli de modèle pour cet agent.
- **Substitution de repli automatique** : un repli d’exécution écrit `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` et le modèle d’origine sélectionné avant de réessayer. Cette substitution automatique peut continuer à parcourir la chaîne de repli configurée sans sonder le modèle principal à chaque message, mais OpenClaw sonde périodiquement à nouveau l’origine configurée et efface la substitution automatique lorsqu’elle récupère. `/new`, `/reset` et `sessions.reset` effacent également les substitutions provenant de l’automatisation. Les exécutions Heartbeat sans `heartbeat.model` explicite effacent les substitutions automatiques directes lorsque leur origine ne correspond plus à la valeur par défaut configurée actuelle.
- **Substitution de session utilisateur** : `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` écrivent `modelOverrideSource: "user"`. Il s’agit d’une sélection de session exacte. Si le fournisseur/modèle sélectionné échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre depuis un repli configuré sans rapport.
- **Substitution de session héritée** : d’anciennes entrées de session peuvent avoir `modelOverride` sans `modelOverrideSource`. OpenClaw les traite comme des substitutions utilisateur afin qu’une ancienne sélection explicite ne soit pas silencieusement convertie en comportement de repli.
- **Modèle de payload Cron** : un `payload.model` / `--model` de tâche cron est un modèle principal de tâche, pas une substitution de session utilisateur. Il utilise les replis configurés sauf si la tâche fournit `payload.fallbacks` ; `payload.fallbacks: []` rend l’exécution cron stricte.

L’intervalle de sondage du modèle principal pour le repli automatique est de cinq minutes et n’est pas configurable. OpenClaw mémorise les sondages récents par session et par modèle principal afin qu’un modèle principal défaillant ne soit pas réessayé à chaque tour. OpenClaw envoie un avis visible lorsqu’une session passe sur un repli et un autre avis lorsqu’elle revient au modèle principal sélectionné ; il ne répète pas l’avis à chaque tour de repli persistant.

## Cache d’évitement des échecs d’authentification

Par défaut, chaque nouveau tour conserve le comportement existant de nouvelle tentative de repli : OpenClaw
réessaiera chaque candidat de repli configuré, y compris les candidats non principaux
qui ont récemment échoué avec `auth` ou `auth_permanent`.

Les opérateurs qui préfèrent supprimer ces échecs d’authentification répétés peuvent l’activer avec :

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Lorsqu’il est activé, OpenClaw enregistre en mémoire, à portée de session, un marqueur d’évitement pour un
candidat de repli non principal après un échec de classe auth. Le marqueur est indexé
par identifiant de session, fournisseur et modèle. Les candidats principaux ne sont jamais ignorés, donc une
sélection explicite de modèle utilisateur expose toujours la véritable erreur d’authentification. Le cache est
local au processus et est effacé au redémarrage du Gateway.

La valeur est un TTL en millisecondes. `0` ou une valeur non définie désactive le cache.
Les valeurs positives sont bornées entre 1 seconde et 10 minutes.

## Avis de repli visibles par l’utilisateur

Lorsqu’une session passe à un repli sélectionné automatiquement, OpenClaw envoie un avis d’état dans la même surface de réponse :

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Lorsqu’un sondage ultérieur réussit et que la session revient au modèle principal sélectionné, OpenClaw envoie :

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Ces avis sont des messages opérationnels, pas du contenu d’assistant. Ils sont livrés une fois par changement d’état, y compris pour les tours à effets secondaires uniquement lorsque c’est possible, mais les tours de repli persistants ne les répètent pas. La livraison contourne la suppression normale des réponses sources, l’avis ne consomme pas le premier emplacement de réponse d’assistant pour les canaux avec fils de discussion, et il est exclu de la synthèse vocale et de l’extraction des engagements.

## Stockage d’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** pour les clés API comme pour les jetons OAuth.

- Les secrets et l’état de routage d’authentification à l’exécution résident dans `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuration `auth.profiles` / `auth.order` contient **uniquement des métadonnées + du routage** (pas de secrets).
- Fichier OAuth hérité uniquement importé : `~/.openclaw/credentials/oauth.json` (importé dans le magasin d’authentification par agent lors de la première utilisation).
- Les fichiers hérités `auth-profiles.json`, `auth-state.json` et les fichiers par agent `auth.json` sont importés par `openclaw doctor --fix`.

Plus de détails : [OAuth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## Identifiants de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut : `provider:default` lorsqu’aucune adresse e-mail n’est disponible.
- OAuth avec e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils résident dans le magasin de profils d’authentification `openclaw-agent.sqlite` par agent.

## Ordre de rotation

Lorsqu’un fournisseur possède plusieurs profils, OpenClaw choisit un ordre comme suit :

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (si défini).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtrés par fournisseur.
  </Step>
  <Step title="Stored profiles">
    Entrées de profils d’authentification SQLite par agent pour le fournisseur.
  </Step>
</Steps>

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre en tourniquet :

- **Clé principale :** type de profil (**OAuth avant les clés API**).
- **Clé secondaire :** `usageStats.lastUsed` (le plus ancien d’abord, au sein de chaque type).
- Les **profils en refroidissement/désactivés** sont déplacés à la fin, ordonnés par expiration la plus proche.

### Persistance de session (compatible avec le cache)

OpenClaw **épingle le profil d’authentification choisi par session** afin de garder les caches du fournisseur chauds. Il ne le fait **pas** tourner à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de Compaction augmente)
- le profil soit en refroidissement/désactivé

La sélection manuelle via `/model …@<profileId>` définit une **substitution utilisateur** pour cette session et n’est pas automatiquement remplacée tant qu’une nouvelle session ne démarre pas.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** : ils sont essayés en premier, mais OpenClaw peut passer à un autre profil en cas de limites de débit/délais d’attente. Lorsque le profil d’origine redevient disponible, les nouvelles exécutions peuvent le préférer à nouveau sans changer le modèle sélectionné ni l’exécution. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des replis de modèle sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Abonnement OpenAI Codex plus secours par clé API

Pour les modèles d’agent OpenAI, l’authentification et l’exécution sont séparées. `openai/gpt-*` reste sur
le harnais Codex tandis que l’authentification peut tourner entre un profil d’abonnement Codex et
une clé API OpenAI de secours.

Utilisez `auth.order.openai` pour l’ordre visible par l’utilisateur :

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Utilisez `openai:*` pour les profils OAuth ChatGPT/Codex comme pour les profils
à clé API OpenAI. Lorsque l’abonnement atteint une limite d’utilisation Codex,
OpenClaw enregistre l’heure exacte de réinitialisation lorsque Codex en fournit une, essaie le profil
d’authentification ordonné suivant et conserve l’exécution dans le harnais Codex. Une fois l’heure de réinitialisation
passée, le profil d’abonnement redevient éligible et la prochaine sélection automatique
peut y revenir.

Utilisez un profil épinglé par l’utilisateur uniquement lorsque vous voulez forcer un compte/une clé pour cette
session. Les profils épinglés par l’utilisateur sont volontairement stricts et ne basculent pas silencieusement
vers un autre profil.

## Refroidissements

Lorsqu’un profil échoue en raison d’erreurs d’authentification/de limite de débit (ou d’un délai d’attente qui ressemble à une limitation de débit), OpenClaw le marque en refroidissement et passe au profil suivant.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Ce compartiment de limite de débit est plus large qu’un simple `429` : il inclut aussi des messages de fournisseurs tels que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, et les limites périodiques de fenêtre d’utilisation telles que `weekly/monthly limit reached`.

    Les erreurs de format/requête invalide sont généralement terminales, car réessayer le même payload échouerait de la même manière ; OpenClaw les expose donc au lieu de faire tourner les profils d’authentification. Les chemins connus de réparation par nouvelle tentative peuvent l’activer explicitement : par exemple, les échecs de validation d’identifiant d’appel d’outil Cloud Code Assist sont assainis et réessayés une fois via la politique `allowFormatRetry`. Les erreurs de raison d’arrêt compatibles OpenAI telles que `Unhandled stop reason: error`, `stop reason: error` et `reason: error` sont classées comme signaux de délai d’attente/basculement.

    Du texte serveur générique peut également tomber dans ce compartiment de délai d’attente lorsque la source correspond à un modèle transitoire connu. Par exemple, le message nu du wrapper de flux d’exécution de modèle `An unknown error occurred` est traité comme justifiant un basculement pour chaque fournisseur, car l’exécution de modèle partagée l’émet lorsque les flux du fournisseur se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans détails spécifiques. Les payloads JSON `api_error` avec du texte serveur transitoire tel que `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` sont également traités comme des délais d’attente justifiant un basculement.

    Le texte amont générique propre à OpenRouter, comme `Provider returned error` seul, est traité comme un délai d’attente uniquement lorsque le contexte du fournisseur est réellement OpenRouter. Le texte de repli interne générique tel que `LLM request failed with an unknown error.` reste conservateur et ne déclenche pas le basculement à lui seul.

  </Accordion>
  <Accordion title="Plafonds retry-after du SDK">
    Certains SDK de fournisseurs peuvent sinon attendre pendant une longue fenêtre `Retry-After` avant de rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless comme Anthropic et OpenAI, OpenClaw plafonne par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60 secondes et expose immédiatement les réponses plus longues pouvant faire l’objet d’une nouvelle tentative afin que ce chemin de basculement puisse s’exécuter. Ajustez ou désactivez le plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consultez [Comportement de nouvelle tentative](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Temporisations limitées au modèle">
    Les temporisations de limite de débit peuvent aussi être limitées au modèle :

    - OpenClaw enregistre `cooldownModel` pour les échecs de limite de débit lorsque l’identifiant du modèle en échec est connu.
    - Un modèle frère chez le même fournisseur peut tout de même être essayé lorsque la temporisation est limitée à un autre modèle.
    - Les fenêtres de facturation/désactivation bloquent toujours l’ensemble du profil pour tous les modèles.

  </Accordion>
</AccordionGroup>

Les temporisations utilisent un backoff exponentiel :

- 1 minute
- 5 minutes
- 25 minutes
- 1 heure (plafond)

L’état est stocké dans l’état d’authentification SQLite par agent sous `usageStats` :

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

## Désactivations de facturation

Les échecs de facturation/crédit (par exemple "insufficient credits" / "credit balance too low") sont traités comme justifiant un basculement, mais ils ne sont généralement pas transitoires. Au lieu d’une courte temporisation, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et passe au profil/fournisseur suivant.

<Note>
Toutes les réponses ayant la forme d’un problème de facturation ne sont pas `402`, et tous les HTTP `402` n’arrivent pas ici. OpenClaw conserve le texte de facturation explicite dans la voie de facturation même lorsqu’un fournisseur renvoie plutôt `401` ou `403`, mais les correspondances propres à un fournisseur restent limitées au fournisseur qui les possède (par exemple OpenRouter `403 Key limit exceeded`).

Pendant ce temps, les erreurs temporaires `402` liées à une fenêtre d’utilisation et aux limites de dépenses d’organisation/espace de travail sont classées comme `rate_limit` lorsque le message semble pouvoir faire l’objet d’une nouvelle tentative (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Elles restent sur le chemin court de temporisation/basculement plutôt que sur le chemin long de désactivation de facturation.
</Note>

L’état est stocké dans l’état d’authentification SQLite par agent :

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

Valeurs par défaut :

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation et est plafonné à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives en cas de surcharge autorisent **1 rotation de profil chez le même fournisseur** avant le repli de modèle.
- Les nouvelles tentatives en cas de surcharge utilisent par défaut un backoff de **0 ms**.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux délais d’expiration qui ont épuisé la rotation des profils (les autres erreurs ne font pas avancer le repli). Les erreurs de fournisseur qui n’exposent pas assez de détails restent étiquetées avec précision dans l’état de repli : `empty_response` signifie que le fournisseur n’a renvoyé aucun message ou statut utilisable, `no_error_details` signifie que le fournisseur a explicitement renvoyé `Unknown error (no error details in response)`, et `unclassified` signifie qu’OpenClaw a conservé l’aperçu brut mais qu’aucun classificateur ne lui correspond encore.

Les erreurs de surcharge et de limite de débit sont gérées plus agressivement que les temporisations de facturation. Par défaut, OpenClaw autorise une nouvelle tentative avec un profil d’authentification du même fournisseur, puis passe au repli de modèle configuré suivant sans attendre. Les signaux d’occupation du fournisseur tels que `ModelNotReadyException` arrivent dans ce compartiment de surcharge. Ajustez cela avec `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` et `auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution démarre depuis le primaire par défaut configuré, le primaire d’une tâche Cron, le primaire d’un agent avec des replis explicites ou une substitution de repli sélectionnée automatiquement, OpenClaw peut parcourir la chaîne de repli configurée correspondante. Les primaires d’agent sans replis explicites et les sélections utilisateur explicites (par exemple `/model ollama/qwen3.5:27b`, le sélecteur de modèle, `sessions.patch` ou des substitutions ponctuelles de fournisseur/modèle via la CLI) sont stricts : si ce fournisseur/modèle est inaccessible ou échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre depuis un repli sans rapport.

### Règles de chaîne de candidats

OpenClaw construit la liste de candidats à partir du `provider/model` actuellement demandé, plus les replis configurés.

<AccordionGroup>
  <Accordion title="Règles">
    - Le modèle demandé est toujours en premier.
    - Les replis configurés explicitement sont dédupliqués, mais pas filtrés par la liste d’autorisation des modèles. Ils sont traités comme une intention explicite de l’opérateur.
    - Si l’exécution en cours utilise déjà un repli configuré dans la même famille de fournisseurs, OpenClaw continue d’utiliser toute la chaîne configurée.
    - Lorsqu’aucune substitution de repli explicite n’est fournie, les replis configurés sont essayés avant le primaire configuré même si le modèle demandé utilise un autre fournisseur.
    - Lorsqu’aucune substitution de repli explicite n’est fournie à l’exécuteur de repli, le primaire configuré est ajouté à la fin afin que la chaîne puisse revenir à la valeur par défaut normale une fois les candidats précédents épuisés.
    - Lorsqu’un appelant fournit `fallbacksOverride`, l’exécuteur utilise exactement le modèle demandé plus cette liste de substitutions. Une liste vide désactive le repli de modèle et empêche l’ajout du primaire configuré comme cible de nouvelle tentative masquée.

  </Accordion>
</AccordionGroup>

### Quelles erreurs font avancer le repli

<Tabs>
  <Tab title="Continue sur">
    - les échecs d’authentification
    - les limites de débit et l’épuisement des temporisations
    - les erreurs de surcharge/fournisseur occupé
    - les erreurs de basculement ayant la forme d’un délai d’expiration
    - les désactivations de facturation
    - `LiveSessionModelSwitchError`, normalisée en chemin de basculement afin qu’un modèle persistant obsolète ne crée pas de boucle de nouvelle tentative externe
    - les autres erreurs non reconnues lorsqu’il reste encore des candidats

  </Tab>
  <Tab title="Ne continue pas sur">
    - les abandons explicites qui n’ont pas la forme d’un délai d’expiration/basculement
    - les erreurs de dépassement de contexte qui doivent rester dans la logique de compaction/nouvelle tentative (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - une erreur inconnue finale lorsqu’il ne reste aucun candidat
    - les refus de sécurité de Claude Fable 5 ; les requêtes directes avec clé API les gèrent plutôt au niveau du fournisseur via le repli côté serveur d’Anthropic vers `claude-opus-4-8` (voir [Anthropic](/fr/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Comportement de saut de temporisation ou de sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en temporisation, OpenClaw ne saute pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

<AccordionGroup>
  <Accordion title="Décisions par candidat">
    - Les échecs d’authentification persistants sautent immédiatement l’ensemble du fournisseur.
    - Les désactivations de facturation sautent généralement le fournisseur, mais le candidat primaire peut encore être sondé avec une limitation afin qu’une récupération soit possible sans redémarrage.
    - Le candidat primaire peut être sondé près de l’expiration de la temporisation, avec une limitation par fournisseur.
    - Les replis frères chez le même fournisseur peuvent être tentés malgré la temporisation lorsque l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). C’est particulièrement pertinent lorsqu’une limite de débit est limitée au modèle et qu’un modèle frère peut encore récupérer immédiatement.
    - Les sondes de temporisation transitoire sont limitées à une par fournisseur et par exécution de repli afin qu’un seul fournisseur ne bloque pas le repli entre fournisseurs.

  </Accordion>
</AccordionGroup>

## Substitutions de session et changement de modèle en direct

Les changements de modèle de session sont un état partagé. L’exécuteur actif, la commande `/model`, les mises à jour de compaction/session et la réconciliation de session en direct lisent ou écrivent tous des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicitement déclenchés par l’utilisateur marquent un changement en direct en attente. Cela inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle déclenchés par le système, comme la rotation de repli, les substitutions de Heartbeat ou la Compaction, ne marquent jamais d’eux-mêmes un changement en direct en attente.
- Les substitutions de modèle déclenchées par l’utilisateur sont traitées comme des sélections exactes pour la politique de repli, de sorte qu’un fournisseur sélectionné inaccessible apparaît comme un échec au lieu d’être masqué par `agents.defaults.model.fallbacks`.
- Avant le démarrage d’une nouvelle tentative de repli, l’exécuteur de réponse persiste les champs de substitution de repli sélectionnés dans l’entrée de session.
- Les substitutions de repli automatiques restent sélectionnées lors des tours suivants afin qu’OpenClaw ne sonde pas un primaire connu comme défaillant à chaque message. OpenClaw sonde périodiquement à nouveau l’origine configurée et efface la substitution automatique lorsqu’elle récupère ; `/new`, `/reset` et `sessions.reset` effacent immédiatement les substitutions d’origine automatique.
- Les réponses utilisateur annoncent les transitions de repli et la récupération avec repli effacé une fois par changement d’état. Les tours de repli persistants ne répètent pas l’avis.
- `/status` affiche le modèle sélectionné et, lorsque l’état de repli diffère, le modèle de repli actif et la raison.
- La réconciliation de session en direct préfère les substitutions de session persistées aux champs de modèle d’exécution obsolètes.
- Si une erreur de changement en direct pointe vers un candidat ultérieur dans la chaîne de repli active, OpenClaw saute directement à ce modèle sélectionné au lieu de parcourir d’abord des candidats sans rapport.
- Si la tentative de repli échoue, l’exécuteur annule uniquement les champs de substitution qu’il a écrits, et seulement s’ils correspondent encore à ce candidat échoué.

Cela empêche la course classique :

<Steps>
  <Step title="Le primaire échoue">
    Le modèle primaire sélectionné échoue.
  </Step>
  <Step title="Repli choisi en mémoire">
    Le candidat de repli est choisi en mémoire.
  </Step>
  <Step title="Le magasin de session indique encore l’ancien primaire">
    Le magasin de session reflète encore l’ancien primaire.
  </Step>
  <Step title="La réconciliation en direct lit un état obsolète">
    La réconciliation de session en direct lit l’état de session obsolète.
  </Step>
  <Step title="La nouvelle tentative revient en arrière">
    La nouvelle tentative est ramenée à l’ancien modèle avant le début de la tentative de repli.
  </Step>
</Steps>

La substitution de repli persistée ferme cette fenêtre, et l’annulation étroite conserve intactes les modifications de session manuelles ou d’exécution plus récentes.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre les détails par tentative qui alimentent les journaux et les messages de temporisation visibles par l’utilisateur :

- fournisseur/modèle tenté
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` et raisons de basculement similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Les journaux structurés `model_fallback_decision` incluent aussi des champs plats `fallbackStep*` lorsqu’un candidat échoue, est sauté ou qu’un repli ultérieur réussit. Ces champs rendent la transition tentée explicite (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) afin que les exportateurs de journaux et de diagnostics puissent reconstruire l’échec primaire même lorsque le repli terminal échoue aussi.

Lorsque tous les candidats échouent, OpenClaw lance `FallbackSummaryError`. L’exécuteur de réponse externe peut l’utiliser pour construire un message plus spécifique tel que "all models are temporarily rate-limited" et inclure l’expiration de temporisation la plus proche lorsqu’elle est connue.

Ce résumé de temporisation tient compte du modèle :

- les limites de débit limitées à des modèles sans rapport sont ignorées pour la chaîne fournisseur/modèle tentée
- si le blocage restant est une limite de débit limitée au modèle correspondant, OpenClaw signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Voir [Configuration du Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routage `agents.defaults.imageModel`

Consultez [Modèles](/fr/concepts/models) pour une vue d’ensemble plus large de la sélection de modèles et des fallbacks.
