---
read_when:
    - Diagnostiquer la rotation des profils d’authentification, les périodes de récupération ou le comportement de basculement de modèle
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les surcharges de modèle de session interagissent avec les tentatives de repli
sidebarTitle: Model failover
summary: Comment OpenClaw alterne les profils d’authentification et effectue un repli entre les modèles
title: Basculement de modèle
x-i18n:
    generated_at: "2026-04-30T07:22:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gère les échecs en deux étapes:

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Fallback de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les soutiennent.

## Flux d’exécution

Pour une exécution de texte normale, OpenClaw évalue les candidats dans cet ordre:

<Steps>
  <Step title="Résoudre l’état de session">
    Résoudre le modèle de session actif et la préférence de profil d’authentification.
  </Step>
  <Step title="Construire la chaîne de candidats">
    Construire la chaîne de modèles candidats à partir de la sélection de modèle actuelle et de la politique de fallback pour cette source de sélection. Les valeurs par défaut configurées, les modèles principaux des tâches Cron et les modèles de fallback sélectionnés automatiquement peuvent utiliser les fallbacks configurés; les sélections explicites de session utilisateur sont strictes.
  </Step>
  <Step title="Essayer le fournisseur actuel">
    Essayer le fournisseur actuel avec les règles de rotation/cooldown des profils d’authentification.
  </Step>
  <Step title="Avancer sur les erreurs justifiant une bascule">
    Si ce fournisseur est épuisé avec une erreur justifiant une bascule, passer au modèle candidat suivant.
  </Step>
  <Step title="Persister le remplacement de fallback">
    Persister le remplacement de fallback sélectionné avant le début de la nouvelle tentative afin que les autres lecteurs de session voient le même fournisseur/modèle que celui que le runner est sur le point d’utiliser. Le remplacement de modèle persisté est marqué `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Revenir en arrière de façon ciblée en cas d’échec">
    Si le candidat de fallback échoue, revenir en arrière uniquement sur les champs de remplacement de session appartenant au fallback lorsqu’ils correspondent encore à ce candidat en échec.
  </Step>
  <Step title="Lever FallbackSummaryError si tout est épuisé">
    Si chaque candidat échoue, lever une `FallbackSummaryError` avec le détail par tentative et l’expiration de cooldown la plus proche lorsqu’elle est connue.
  </Step>
</Steps>

C’est volontairement plus ciblé que « enregistrer et restaurer toute la session ». Le runner de réponse ne persiste que les champs de sélection de modèle dont il est propriétaire pour le fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela empêche une nouvelle tentative de fallback échouée d’écraser des mutations de session plus récentes et sans rapport, comme des changements manuels via `/model` ou des mises à jour de rotation de session survenues pendant l’exécution de la tentative.

## Politique de source de sélection

OpenClaw sépare le fournisseur/modèle sélectionné de la raison pour laquelle il a été sélectionné. Cette source détermine si la chaîne de fallback est autorisée:

- **Valeur par défaut configurée**: `agents.defaults.model.primary` utilise `agents.defaults.model.fallbacks`.
- **Modèle principal de l’agent**: `agents.list[].model` est strict sauf si cet objet de modèle d’agent inclut ses propres `fallbacks`. Utilisez `fallbacks: []` pour rendre le comportement strict explicite, ou fournissez une liste non vide pour activer le fallback de modèle pour cet agent.
- **Remplacement de fallback automatique**: un fallback d’exécution écrit `providerOverride`, `modelOverride` et `modelOverrideSource: "auto"` avant de réessayer. Ce remplacement automatique peut continuer à parcourir la chaîne de fallback configurée et est effacé par `/new`, `/reset` et `sessions.reset`.
- **Remplacement de session utilisateur**: `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` écrivent `modelOverrideSource: "user"`. Il s’agit d’une sélection de session exacte. Si le fournisseur/modèle sélectionné échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre à partir d’un fallback configuré sans rapport.
- **Remplacement de session hérité**: les anciennes entrées de session peuvent avoir `modelOverride` sans `modelOverrideSource`. OpenClaw les traite comme des remplacements utilisateur afin qu’une ancienne sélection explicite ne soit pas silencieusement convertie en comportement de fallback.
- **Modèle de payload Cron**: le `payload.model` / `--model` d’une tâche Cron est un modèle principal de tâche, pas un remplacement de session utilisateur. Il utilise les fallbacks configurés sauf si la tâche fournit `payload.fallbacks`; `payload.fallbacks: []` rend l’exécution Cron stricte.

## Stockage d’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** pour les clés API et les jetons OAuth.

- Les secrets résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hérité: `~/.openclaw/agent/auth-profiles.json`).
- L’état de routage d’authentification à l’exécution réside dans `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuration `auth.profiles` / `auth.order` correspond uniquement à des **métadonnées + routage** (aucun secret).
- Fichier OAuth hérité utilisé uniquement pour l’import: `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation).

Plus de détails: [OAuth](/fr/concepts/oauth)

Types d’identifiants:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## ID de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut: `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail: `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un fournisseur a plusieurs profils, OpenClaw choisit un ordre comme suit:

<Steps>
  <Step title="Configuration explicite">
    `auth.order[provider]` (si défini).
  </Step>
  <Step title="Profils configurés">
    `auth.profiles` filtré par fournisseur.
  </Step>
  <Step title="Profils stockés">
    Entrées dans `auth-profiles.json` pour le fournisseur.
  </Step>
</Steps>

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round-robin:

- **Clé principale:** type de profil (**OAuth avant les clés API**).
- **Clé secondaire:** `usageStats.lastUsed` (les plus anciens d’abord, au sein de chaque type).
- Les **profils en cooldown/désactivés** sont déplacés à la fin, ordonnés par expiration la plus proche.

### Affinité de session (adaptée au cache)

OpenClaw **épingle le profil d’authentification choisi par session** afin de garder les caches fournisseur chauds. Il ne fait **pas** de rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que:

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de compaction s’incrémente)
- le profil soit en cooldown/désactivé

La sélection manuelle via `/model …@<profileId>` définit un **remplacement utilisateur** pour cette session et ne fait pas l’objet d’une rotation automatique avant le démarrage d’une nouvelle session.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence**: ils sont essayés en premier, mais OpenClaw peut effectuer une rotation vers un autre profil en cas de limites de débit/délais d’expiration. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil; s’il échoue et que des fallbacks de modèle sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Pourquoi OAuth peut « sembler perdu »

Si vous avez à la fois un profil OAuth et un profil de clé API pour le même fournisseur, le round-robin peut passer de l’un à l’autre d’un message à l’autre sauf s’ils sont épinglés. Pour forcer un seul profil:

- Épinglez avec `auth.order[provider] = ["provider:profileId"]`, ou
- Utilisez un remplacement par session via `/model …` avec un remplacement de profil (lorsque votre interface UI/chat le prend en charge).

## Cooldowns

Lorsqu’un profil échoue à cause d’erreurs d’authentification/de limite de débit (ou d’un délai d’expiration qui ressemble à une limitation de débit), OpenClaw le marque en cooldown et passe au profil suivant.

<AccordionGroup>
  <Accordion title="Ce qui arrive dans le compartiment limite de débit / délai d’expiration">
    Ce compartiment de limite de débit est plus large qu’un simple `429`: il inclut aussi des messages de fournisseur comme `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, ainsi que des limites périodiques de fenêtre d’utilisation comme `weekly/monthly limit reached`.

    Les erreurs de format/requête invalide (par exemple les échecs de validation d’ID d’appel d’outil Cloud Code Assist) sont traitées comme justifiant une bascule et utilisent les mêmes cooldowns. Les erreurs de raison d’arrêt compatibles OpenAI comme `Unhandled stop reason: error`, `stop reason: error` et `reason: error` sont classées comme des signaux de délai d’expiration/bascule.

    Le texte serveur générique peut aussi arriver dans ce compartiment de délai d’expiration lorsque la source correspond à un motif transitoire connu. Par exemple, le message nu du wrapper de flux pi-ai `An unknown error occurred` est traité comme justifiant une bascule pour chaque fournisseur, car pi-ai l’émet lorsque les flux fournisseur se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans détails spécifiques. Les payloads JSON `api_error` avec du texte serveur transitoire comme `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` sont aussi traités comme des délais d’expiration justifiant une bascule.

    Le texte upstream générique propre à OpenRouter, comme le simple `Provider returned error`, est traité comme un délai d’expiration uniquement lorsque le contexte fournisseur est réellement OpenRouter. Le texte de fallback interne générique comme `LLM request failed with an unknown error.` reste conservateur et ne déclenche pas de bascule à lui seul.

  </Accordion>
  <Accordion title="Plafonds retry-after des SDK">
    Certains SDK de fournisseurs peuvent sinon attendre pendant une longue fenêtre `Retry-After` avant de rendre la main à OpenClaw. Pour les SDK basés sur Stainless comme Anthropic et OpenAI, OpenClaw plafonne par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60 secondes et expose immédiatement les réponses réessayables plus longues afin que ce chemin de bascule puisse s’exécuter. Ajustez ou désactivez le plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consultez [Comportement de nouvelle tentative](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Cooldowns limités au modèle">
    Les cooldowns de limite de débit peuvent aussi être limités au modèle:

    - OpenClaw enregistre `cooldownModel` pour les échecs de limite de débit lorsque l’ID du modèle en échec est connu.
    - Un modèle frère sur le même fournisseur peut toujours être essayé lorsque le cooldown est limité à un autre modèle.
    - Les fenêtres de facturation/désactivation bloquent toujours tout le profil sur l’ensemble des modèles.

  </Accordion>
</AccordionGroup>

Les cooldowns utilisent un backoff exponentiel:

- 1 minute
- 5 minutes
- 25 minutes
- 1 heure (plafond)

L’état est stocké dans `auth-state.json` sous `usageStats`:

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

Les échecs de facturation/crédit (par exemple « insufficient credits » / « credit balance too low ») sont traités comme justifiant une bascule, mais ils ne sont généralement pas transitoires. Au lieu d’un court cooldown, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et effectue une rotation vers le profil/fournisseur suivant.

<Note>
Toutes les réponses à forme de facturation ne sont pas `402`, et tous les HTTP `402` n’arrivent pas ici. OpenClaw conserve le texte de facturation explicite dans la voie de facturation même lorsqu’un fournisseur renvoie plutôt `401` ou `403`, mais les correspondances propres aux fournisseurs restent limitées au fournisseur qui les possède (par exemple OpenRouter `403 Key limit exceeded`).

Pendant ce temps, les erreurs temporaires `402` de fenêtre d’utilisation et de limite de dépense d’organisation/espace de travail sont classées comme `rate_limit` lorsque le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Elles restent sur le chemin de cooldown court/bascule au lieu du chemin long de désactivation de facturation.
</Note>

L’état est stocké dans `auth-state.json`:

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

Valeurs par défaut:

- Le backoff de facturation démarre à **5 heures**, double à chaque échec de facturation et plafonne à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives en surcharge autorisent **1 rotation de profil du même fournisseur** avant le fallback de modèle.
- Les nouvelles tentatives en surcharge utilisent par défaut un **backoff de 0 ms**.

## Fallback de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux délais d’expiration qui ont épuisé la rotation des profils (les autres erreurs ne déclenchent pas le fallback). Les erreurs fournisseur qui n’exposent pas assez de détails restent libellées précisément dans l’état de fallback: `empty_response` signifie que le fournisseur n’a renvoyé aucun message ou statut exploitable, `no_error_details` signifie que le fournisseur a explicitement renvoyé `Unknown error (no error details in response)`, et `unclassified` signifie qu’OpenClaw a conservé l’aperçu brut, mais qu’aucun classificateur ne lui correspond encore.

Les erreurs de surcharge et de limite de débit sont gérées plus agressivement que les refroidissements de facturation. Par défaut, OpenClaw autorise une nouvelle tentative avec un profil d’authentification du même fournisseur, puis bascule vers le prochain modèle de repli configuré sans attendre. Les signaux de fournisseur occupé comme `ModelNotReadyException` entrent dans cette catégorie de surcharge. Ajustez ce comportement avec `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` et `auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution démarre depuis le modèle principal par défaut configuré, le modèle principal d’une tâche cron, le modèle principal d’un agent avec des replis explicites, ou une substitution de repli sélectionnée automatiquement, OpenClaw peut parcourir la chaîne de replis configurée correspondante. Les modèles principaux d’agent sans replis explicites et les sélections utilisateur explicites (par exemple `/model ollama/qwen3.5:27b`, le sélecteur de modèle, `sessions.patch` ou des substitutions ponctuelles de fournisseur/modèle via la CLI) sont stricts : si ce fournisseur/modèle est inaccessible ou échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre avec un repli sans rapport.

### Règles de chaîne de candidats

OpenClaw construit la liste de candidats à partir du `provider/model` actuellement demandé, plus les replis configurés.

<AccordionGroup>
  <Accordion title="Rules">
    - Le modèle demandé est toujours en premier.
    - Les replis explicites configurés sont dédupliqués, mais ne sont pas filtrés par la liste d’autorisation des modèles. Ils sont traités comme une intention explicite de l’opérateur.
    - Si l’exécution actuelle est déjà sur un repli configuré dans la même famille de fournisseurs, OpenClaw continue d’utiliser toute la chaîne configurée.
    - Si l’exécution actuelle utilise un fournisseur différent de celui de la configuration et que ce modèle actuel ne fait pas déjà partie de la chaîne de replis configurée, OpenClaw n’ajoute pas de replis configurés sans rapport provenant d’un autre fournisseur.
    - Lorsqu’aucune substitution de repli explicite n’est fournie au lanceur de repli, le modèle principal configuré est ajouté à la fin afin que la chaîne puisse revenir au modèle par défaut normal une fois les candidats précédents épuisés.
    - Lorsqu’un appelant fournit `fallbacksOverride`, le lanceur utilise exactement le modèle demandé plus cette liste de substitutions. Une liste vide désactive le repli de modèle et empêche l’ajout du modèle principal configuré comme cible cachée de nouvelle tentative.

  </Accordion>
</AccordionGroup>

### Quelles erreurs font avancer le repli

<Tabs>
  <Tab title="Continues on">
    - échecs d’authentification
    - limites de débit et épuisement des refroidissements
    - erreurs de surcharge/fournisseur occupé
    - erreurs de bascule ayant la forme d’un délai d’expiration
    - désactivations de facturation
    - `LiveSessionModelSwitchError`, qui est normalisée en chemin de bascule afin qu’un modèle persistant obsolète ne crée pas de boucle de nouvelle tentative externe
    - autres erreurs non reconnues lorsqu’il reste encore des candidats

  </Tab>
  <Tab title="Does not continue on">
    - abandons explicites qui n’ont pas la forme d’un délai d’expiration ou d’une bascule
    - erreurs de dépassement de contexte qui doivent rester dans la logique de compaction/nouvelle tentative (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - une dernière erreur inconnue lorsqu’il ne reste plus de candidats

  </Tab>
</Tabs>

### Comportement de saut de refroidissement et de sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en refroidissement, OpenClaw ne saute pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Les échecs d’authentification persistants sautent immédiatement tout le fournisseur.
    - Les désactivations de facturation sautent généralement le fournisseur, mais le candidat principal peut encore être sondé avec une limitation afin de permettre la récupération sans redémarrage.
    - Le candidat principal peut être sondé près de l’expiration du refroidissement, avec une limitation par fournisseur.
    - Les replis frères du même fournisseur peuvent être tentés malgré le refroidissement lorsque l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). C’est particulièrement pertinent lorsqu’une limite de débit est propre à un modèle et qu’un modèle frère peut encore récupérer immédiatement.
    - Les sondes de refroidissement transitoires sont limitées à une par fournisseur et par exécution de repli, afin qu’un seul fournisseur ne bloque pas le repli vers d’autres fournisseurs.

  </Accordion>
</AccordionGroup>

## Substitutions de session et changement de modèle en direct

Les changements de modèle de session sont un état partagé. Le lanceur actif, la commande `/model`, les mises à jour de compaction/session et la réconciliation de session en direct lisent ou écrivent tous des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicites déclenchés par l’utilisateur marquent un changement en direct en attente. Cela inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle déclenchés par le système, comme la rotation de repli, les substitutions de Heartbeat ou la compaction, ne marquent jamais à eux seuls un changement en direct en attente.
- Les substitutions de modèle déclenchées par l’utilisateur sont traitées comme des sélections exactes pour la politique de repli ; ainsi, un fournisseur sélectionné inaccessible remonte comme un échec au lieu d’être masqué par `agents.defaults.model.fallbacks`.
- Avant qu’une nouvelle tentative de repli ne commence, le lanceur de réponse persiste les champs de substitution de repli sélectionnés dans l’entrée de session.
- Les substitutions de repli automatiques restent sélectionnées lors des tours suivants, afin qu’OpenClaw ne sonde pas un modèle principal connu comme défaillant à chaque message. `/new`, `/reset` et `sessions.reset` effacent les substitutions d’origine automatique et ramènent la session au modèle par défaut configuré.
- `/status` affiche le modèle sélectionné et, lorsque l’état de repli diffère, le modèle de repli actif et la raison.
- La réconciliation de session en direct préfère les substitutions de session persistées aux champs de modèle d’exécution obsolètes.
- Si une erreur de changement en direct pointe vers un candidat ultérieur dans la chaîne de replis active, OpenClaw passe directement à ce modèle sélectionné au lieu de parcourir d’abord des candidats sans rapport.
- Si la tentative de repli échoue, le lanceur annule uniquement les champs de substitution qu’il a écrits, et seulement s’ils correspondent encore à ce candidat échoué.

Cela évite la course classique :

<Steps>
  <Step title="Primary fails">
    Le modèle principal sélectionné échoue.
  </Step>
  <Step title="Fallback chosen in memory">
    Le candidat de repli est choisi en mémoire.
  </Step>
  <Step title="Session store still says old primary">
    Le magasin de session reflète encore l’ancien modèle principal.
  </Step>
  <Step title="Live reconciliation reads stale state">
    La réconciliation de session en direct lit l’état de session obsolète.
  </Step>
  <Step title="Retry snapped back">
    La nouvelle tentative est ramenée à l’ancien modèle avant le démarrage de la tentative de repli.
  </Step>
</Steps>

La substitution de repli persistée ferme cette fenêtre, et l’annulation ciblée préserve les changements de session manuels ou d’exécution plus récents.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre les détails de chaque tentative, qui alimentent les journaux et les messages de refroidissement destinés à l’utilisateur :

- fournisseur/modèle tenté
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` et raisons de bascule similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Les journaux structurés `model_fallback_decision` incluent également des champs plats `fallbackStep*` lorsqu’un candidat échoue, est sauté, ou qu’un repli ultérieur réussit. Ces champs rendent la transition tentée explicite (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) afin que les exportateurs de journaux et de diagnostics puissent reconstruire l’échec du modèle principal même lorsque le repli terminal échoue aussi.

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. Le lanceur de réponse externe peut l’utiliser pour construire un message plus précis, comme « tous les modèles sont temporairement limités en débit », et inclure l’expiration de refroidissement la plus proche lorsqu’elle est connue.

Ce résumé de refroidissement tient compte du modèle :

- les limites de débit propres à des modèles sans rapport sont ignorées pour la chaîne fournisseur/modèle tentée
- si le blocage restant est une limite de débit propre au modèle correspondant, OpenClaw signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Voir [Configuration du Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routage `agents.defaults.imageModel`

Voir [Modèles](/fr/concepts/models) pour une vue d’ensemble plus large de la sélection de modèle et des replis.
