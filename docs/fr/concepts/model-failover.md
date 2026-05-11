---
read_when:
    - Diagnostiquer la rotation des profils d’authentification, les délais d’attente ou le comportement de repli du modèle
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de repli
sidebarTitle: Model failover
summary: Comment OpenClaw assure la rotation des profils d’authentification et bascule entre les modèles
title: Basculement de modèle
x-i18n:
    generated_at: "2026-05-11T20:32:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Modèle de repli** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les soutiennent.

## Flux d’exécution

Pour une exécution de texte normale, OpenClaw évalue les candidats dans cet ordre :

<Steps>
  <Step title="Resolve session state">
    Résoudre le modèle de session actif et la préférence de profil d’authentification.
  </Step>
  <Step title="Build candidate chain">
    Construire la chaîne de modèles candidats à partir de la sélection de modèle actuelle et de la politique de repli pour cette source de sélection. Les valeurs par défaut configurées, les modèles principaux des tâches Cron et les modèles de repli sélectionnés automatiquement peuvent utiliser les replis configurés ; les sélections explicites de session utilisateur sont strictes.
  </Step>
  <Step title="Try the current provider">
    Essayer le fournisseur actuel avec les règles de rotation/refroidissement des profils d’authentification.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Si ce fournisseur est épuisé avec une erreur justifiant un basculement, passer au modèle candidat suivant.
  </Step>
  <Step title="Persist fallback override">
    Persister la substitution de repli sélectionnée avant le début de la nouvelle tentative afin que les autres lecteurs de session voient le même fournisseur/modèle que le lanceur est sur le point d’utiliser. La substitution de modèle persistée est marquée `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Roll back narrowly on failure">
    Si le candidat de repli échoue, annuler uniquement les champs de substitution de session appartenant au repli lorsqu’ils correspondent encore à ce candidat échoué.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Si tous les candidats échouent, lever une `FallbackSummaryError` avec le détail par tentative et l’expiration de refroidissement la plus proche lorsqu’elle est connue.
  </Step>
</Steps>

C’est volontairement plus limité que « enregistrer et restaurer toute la session ». Le lanceur de réponse persiste uniquement les champs de sélection de modèle qu’il possède pour le repli :

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela empêche une nouvelle tentative de repli échouée d’écraser des mutations de session plus récentes et sans rapport, comme des changements manuels `/model` ou des mises à jour de rotation de session qui se sont produites pendant l’exécution de la tentative.

## Politique de source de sélection

OpenClaw sépare le fournisseur/modèle sélectionné de la raison pour laquelle il a été sélectionné. Cette source détermine si la chaîne de repli est autorisée :

- **Valeur par défaut configurée** : `agents.defaults.model.primary` utilise `agents.defaults.model.fallbacks`.
- **Modèle principal d’agent** : `agents.list[].model` est strict sauf si cet objet de modèle d’agent inclut ses propres `fallbacks`. Utilisez `fallbacks: []` pour rendre explicite le comportement strict, ou fournissez une liste non vide pour activer le repli de modèle pour cet agent.
- **Substitution de repli automatique** : un repli d’exécution écrit `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` et le modèle d’origine sélectionné avant de réessayer. Cette substitution automatique peut continuer à parcourir la chaîne de repli configurée et est effacée par `/new`, `/reset` et `sessions.reset`. Les exécutions Heartbeat sans `heartbeat.model` explicite effacent aussi une substitution automatique directe lorsque son origine ne correspond plus à la valeur par défaut actuellement configurée.
- **Substitution de session utilisateur** : `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` écrivent `modelOverrideSource: "user"`. C’est une sélection de session exacte. Si le fournisseur/modèle sélectionné échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre à partir d’un repli configuré sans rapport.
- **Substitution de session héritée** : les anciennes entrées de session peuvent avoir `modelOverride` sans `modelOverrideSource`. OpenClaw les traite comme des substitutions utilisateur afin qu’une ancienne sélection explicite ne soit pas convertie silencieusement en comportement de repli.
- **Modèle de charge utile Cron** : un `payload.model` / `--model` de tâche Cron est un modèle principal de tâche, pas une substitution de session utilisateur. Il utilise les replis configurés sauf si la tâche fournit `payload.fallbacks` ; `payload.fallbacks: []` rend l’exécution Cron stricte.

## Stockage d’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** pour les clés API comme pour les jetons OAuth.

- Les secrets résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hérité : `~/.openclaw/agent/auth-profiles.json`).
- L’état de routage d’authentification d’exécution réside dans `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuration `auth.profiles` / `auth.order` correspond uniquement à des **métadonnées + routage** (aucun secret).
- Fichier OAuth hérité uniquement importé : `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation).

Plus de détails : [OAuth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## ID de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut : `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un fournisseur a plusieurs profils, OpenClaw choisit un ordre comme suit :

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (si défini).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` filtré par fournisseur.
  </Step>
  <Step title="Stored profiles">
    Entrées dans `auth-profiles.json` pour le fournisseur.
  </Step>
</Steps>

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round-robin :

- **Clé principale :** type de profil (**OAuth avant les clés API**).
- **Clé secondaire :** `usageStats.lastUsed` (le plus ancien d’abord, dans chaque type).
- Les **profils en refroidissement/désactivés** sont déplacés à la fin, ordonnés par expiration la plus proche.

### Affinité de session (compatible avec le cache)

OpenClaw **épingle le profil d’authentification choisi par session** afin de garder les caches des fournisseurs chauds. Il ne fait **pas** de rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de Compaction augmente)
- le profil soit en refroidissement/désactivé

La sélection manuelle via `/model …@<profileId>` définit une **substitution utilisateur** pour cette session et ne fait pas l’objet d’une rotation automatique jusqu’au démarrage d’une nouvelle session.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** : ils sont essayés en premier, mais OpenClaw peut effectuer une rotation vers un autre profil en cas de limites de débit/délais d’expiration. Lorsque le profil d’origine redevient disponible, les nouvelles exécutions peuvent à nouveau le privilégier sans changer le modèle ou l’exécution sélectionné. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des replis de modèle sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Abonnement OpenAI Codex plus sauvegarde par clé API

Pour les modèles d’agent OpenAI, l’authentification et l’exécution sont séparées. `openai/gpt-*` reste sur
le harnais Codex tandis que l’authentification peut alterner entre un profil d’abonnement Codex et
une sauvegarde par clé API OpenAI.

Utilisez `auth.order.openai` pour l’ordre destiné à l’utilisateur :

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Les profils d’abonnement Codex existants peuvent encore utiliser l’ID de profil hérité
`openai-codex:*`. La sauvegarde par clé API ordonnée peut être un profil de clé API
`openai:*` normal. Lorsque l’abonnement atteint une limite d’utilisation Codex,
OpenClaw enregistre l’heure exacte de réinitialisation lorsque Codex en fournit une, essaie le profil
d’authentification ordonné suivant et conserve l’exécution dans le harnais Codex. Une fois l’heure de réinitialisation
passée, le profil d’abonnement redevient éligible et la prochaine sélection automatique
peut y revenir.

Utilisez un profil épinglé par l’utilisateur uniquement lorsque vous voulez forcer un compte/une clé pour cette
session. Les profils épinglés par l’utilisateur sont volontairement stricts et ne basculent pas silencieusement
vers un autre profil.

## Refroidissements

Lorsqu’un profil échoue à cause d’erreurs d’authentification/de limite de débit (ou d’un délai d’expiration qui ressemble à une limitation de débit), OpenClaw le marque en refroidissement et passe au profil suivant.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Ce compartiment de limite de débit est plus large qu’un simple `429` : il inclut aussi les messages de fournisseurs comme `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` et les limites périodiques de fenêtre d’utilisation comme `weekly/monthly limit reached`.

    Les erreurs de format/requête invalide sont généralement terminales parce qu’une nouvelle tentative avec la même charge utile échouerait de la même manière ; OpenClaw les expose donc au lieu d’effectuer une rotation des profils d’authentification. Les chemins connus de réparation par nouvelle tentative peuvent s’y inscrire explicitement : par exemple, les échecs de validation d’ID d’appel d’outil Cloud Code Assist sont assainis et réessayés une fois via la politique `allowFormatRetry`. Les erreurs de raison d’arrêt compatibles OpenAI, comme `Unhandled stop reason: error`, `stop reason: error` et `reason: error`, sont classées comme signaux de délai d’expiration/basculement.

    Le texte générique de serveur peut aussi entrer dans ce compartiment de délai d’expiration lorsque la source correspond à un motif transitoire connu. Par exemple, le message brut du wrapper de flux pi-ai `An unknown error occurred` est traité comme justifiant un basculement pour chaque fournisseur, car pi-ai l’émet lorsque les flux de fournisseurs se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans détails spécifiques. Les charges utiles JSON `api_error` avec un texte serveur transitoire comme `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` sont aussi traitées comme des délais d’expiration justifiant un basculement.

    Le texte amont générique propre à OpenRouter, comme le simple `Provider returned error`, est traité comme un délai d’expiration uniquement lorsque le contexte fournisseur est effectivement OpenRouter. Le texte générique de repli interne comme `LLM request failed with an unknown error.` reste conservateur et ne déclenche pas de basculement à lui seul.

  </Accordion>
  <Accordion title="SDK retry-after caps">
    Certains SDK de fournisseurs peuvent sinon attendre pendant une longue fenêtre `Retry-After` avant de rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless comme Anthropic et OpenAI, OpenClaw plafonne par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60 secondes et expose immédiatement les réponses réessayables plus longues afin que ce chemin de basculement puisse s’exécuter. Ajustez ou désactivez le plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; consultez [Comportement de nouvelle tentative](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Model-scoped cooldowns">
    Les refroidissements de limite de débit peuvent aussi être limités au modèle :

    - OpenClaw enregistre `cooldownModel` pour les échecs de limite de débit lorsque l’ID du modèle défaillant est connu.
    - Un modèle frère sur le même fournisseur peut encore être essayé lorsque le refroidissement est limité à un autre modèle.
    - Les fenêtres de facturation/désactivation bloquent toujours tout le profil sur tous les modèles.

  </Accordion>
</AccordionGroup>

Les refroidissements utilisent un backoff exponentiel :

- 1 minute
- 5 minutes
- 25 minutes
- 1 heure (plafond)

L’état est stocké dans `auth-state.json` sous `usageStats` :

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

Les échecs de facturation/crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont traités comme justifiant un basculement, mais ils ne sont généralement pas transitoires. Au lieu d’un court refroidissement, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et effectue une rotation vers le profil/fournisseur suivant.

<Note>
Toutes les réponses ayant l’apparence d’une facturation ne sont pas `402`, et tous les HTTP `402` n’arrivent pas ici. OpenClaw conserve le texte de facturation explicite dans la voie de facturation même lorsqu’un fournisseur renvoie plutôt `401` ou `403`, mais les correspondances propres aux fournisseurs restent limitées au fournisseur qui les possède (par exemple OpenRouter `403 Key limit exceeded`).

Pendant ce temps, les erreurs temporaires `402` de fenêtre d’utilisation et de limite de dépenses d’organisation/espace de travail sont classées comme `rate_limit` lorsque le message semble pouvoir être retenté (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Elles restent sur le chemin de court refroidissement/basculement au lieu du long chemin de désactivation de facturation.
</Note>

L’état est stocké dans `auth-state.json` :

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

- Le délai de facturation commence à **5 heures**, double à chaque échec de facturation et est plafonné à **24 heures**.
- Les compteurs de délai sont réinitialisés si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives en cas de surcharge autorisent **1 rotation de profil du même fournisseur** avant le repli de modèle.
- Les nouvelles tentatives en cas de surcharge utilisent par défaut un délai de **0 ms**.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux délais d’expiration qui ont épuisé la rotation de profils (les autres erreurs ne font pas avancer le repli). Les erreurs de fournisseur qui n’exposent pas assez de détails sont tout de même étiquetées précisément dans l’état de repli : `empty_response` signifie que le fournisseur n’a renvoyé aucun message ni statut utilisable, `no_error_details` signifie que le fournisseur a explicitement renvoyé `Unknown error (no error details in response)`, et `unclassified` signifie qu’OpenClaw a conservé l’aperçu brut mais qu’aucun classificateur ne lui correspond encore.

Les erreurs de surcharge et de limite de débit sont traitées plus agressivement que les refroidissements de facturation. Par défaut, OpenClaw autorise une nouvelle tentative avec un profil d’authentification du même fournisseur, puis bascule vers le prochain repli de modèle configuré sans attendre. Les signaux de fournisseur occupé tels que `ModelNotReadyException` tombent dans ce groupe de surcharge. Ajustez ce comportement avec `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` et `auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution démarre depuis le modèle principal par défaut configuré, le modèle principal d’une tâche cron, le modèle principal d’un agent avec replis explicites, ou une substitution de repli sélectionnée automatiquement, OpenClaw peut parcourir la chaîne de repli configurée correspondante. Les modèles principaux d’agents sans replis explicites et les sélections utilisateur explicites (par exemple `/model ollama/qwen3.5:27b`, le sélecteur de modèle, `sessions.patch` ou les substitutions ponctuelles de fournisseur/modèle via la CLI) sont stricts : si ce fournisseur/modèle est inaccessible ou échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre depuis un repli sans rapport.

### Règles de chaîne candidate

OpenClaw construit la liste de candidats à partir du `provider/model` actuellement demandé plus les replis configurés.

<AccordionGroup>
  <Accordion title="Règles">
    - Le modèle demandé est toujours en premier.
    - Les replis explicitement configurés sont dédupliqués mais ne sont pas filtrés par la liste d’autorisation des modèles. Ils sont traités comme une intention explicite de l’opérateur.
    - Si l’exécution actuelle est déjà sur un repli configuré dans la même famille de fournisseurs, OpenClaw continue d’utiliser la chaîne configurée complète.
    - Lorsqu’aucune substitution de repli explicite n’est fournie, les replis configurés sont essayés avant le modèle principal configuré, même si le modèle demandé utilise un autre fournisseur.
    - Lorsqu’aucune substitution de repli explicite n’est fournie au lanceur de repli, le modèle principal configuré est ajouté à la fin afin que la chaîne puisse revenir au défaut normal une fois les candidats précédents épuisés.
    - Lorsqu’un appelant fournit `fallbacksOverride`, le lanceur utilise exactement le modèle demandé plus cette liste de substitutions. Une liste vide désactive le repli de modèle et empêche l’ajout du modèle principal configuré comme cible de nouvelle tentative cachée.

  </Accordion>
</AccordionGroup>

### Erreurs qui font avancer le repli

<Tabs>
  <Tab title="Continue sur">
    - les échecs d’authentification
    - les limites de débit et l’épuisement des refroidissements
    - les erreurs de surcharge/fournisseur occupé
    - les erreurs de basculement de type délai d’expiration
    - les désactivations de facturation
    - `LiveSessionModelSwitchError`, qui est normalisée en chemin de basculement afin qu’un modèle persistant obsolète ne crée pas une boucle de nouvelle tentative externe
    - les autres erreurs non reconnues lorsqu’il reste encore des candidats

  </Tab>
  <Tab title="Ne continue pas sur">
    - les interruptions explicites qui ne sont pas de type délai d’expiration/basculement
    - les erreurs de dépassement de contexte qui doivent rester dans la logique de Compaction/nouvelle tentative (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - une dernière erreur inconnue lorsqu’il ne reste aucun candidat

  </Tab>
</Tabs>

### Comportement d’évitement du refroidissement et de sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en refroidissement, OpenClaw ne saute pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

<AccordionGroup>
  <Accordion title="Décisions par candidat">
    - Les échecs d’authentification persistants sautent immédiatement tout le fournisseur.
    - Les désactivations de facturation sont généralement sautées, mais le candidat principal peut tout de même être sondé avec une limitation afin qu’une récupération soit possible sans redémarrage.
    - Le candidat principal peut être sondé à l’approche de l’expiration du refroidissement, avec une limitation par fournisseur.
    - Les replis frères du même fournisseur peuvent être tentés malgré le refroidissement lorsque l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). C’est particulièrement pertinent lorsqu’une limite de débit est limitée au modèle et qu’un modèle frère peut encore récupérer immédiatement.
    - Les sondes de refroidissement transitoire sont limitées à une par fournisseur et par exécution de repli, afin qu’un seul fournisseur ne bloque pas le repli inter-fournisseurs.

  </Accordion>
</AccordionGroup>

## Substitutions de session et changement de modèle en direct

Les changements de modèle de session sont un état partagé. Le lanceur actif, la commande `/model`, les mises à jour de Compaction/session et la réconciliation de session en direct lisent ou écrivent tous des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicitement déclenchés par l’utilisateur marquent un changement en direct en attente. Cela inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle pilotés par le système, tels que la rotation de repli, les substitutions de Heartbeat ou la Compaction, ne marquent jamais à eux seuls un changement en direct en attente.
- Les substitutions de modèle déclenchées par l’utilisateur sont traitées comme des sélections exactes pour la politique de repli, de sorte qu’un fournisseur sélectionné inaccessible apparaît comme un échec au lieu d’être masqué par `agents.defaults.model.fallbacks`.
- Avant le démarrage d’une nouvelle tentative de repli, le lanceur de réponse persiste les champs de substitution de repli sélectionnés dans l’entrée de session.
- Les substitutions de repli automatiques restent sélectionnées lors des tours suivants afin qu’OpenClaw ne sonde pas un modèle principal connu comme défaillant à chaque message. `/new`, `/reset` et `sessions.reset` effacent les substitutions de source automatique et ramènent la session au défaut configuré.
- `/status` affiche le modèle sélectionné et, lorsque l’état de repli diffère, le modèle de repli actif et la raison.
- La réconciliation de session en direct préfère les substitutions de session persistées aux champs de modèle d’exécution obsolètes.
- Si une erreur de changement en direct pointe vers un candidat ultérieur dans la chaîne de repli active, OpenClaw saute directement vers ce modèle sélectionné au lieu de parcourir d’abord des candidats sans rapport.
- Si la tentative de repli échoue, le lanceur annule uniquement les champs de substitution qu’il a écrits, et seulement s’ils correspondent encore à ce candidat échoué.

Cela évite la course classique :

<Steps>
  <Step title="Le modèle principal échoue">
    Le modèle principal sélectionné échoue.
  </Step>
  <Step title="Repli choisi en mémoire">
    Le candidat de repli est choisi en mémoire.
  </Step>
  <Step title="Le magasin de session indique encore l’ancien modèle principal">
    Le magasin de session reflète encore l’ancien modèle principal.
  </Step>
  <Step title="La réconciliation en direct lit un état obsolète">
    La réconciliation de session en direct lit l’état de session obsolète.
  </Step>
  <Step title="La nouvelle tentative revient en arrière">
    La nouvelle tentative est ramenée à l’ancien modèle avant le démarrage de la tentative de repli.
  </Step>
</Steps>

La substitution de repli persistée ferme cette fenêtre, et l’annulation étroite préserve les changements de session manuels ou d’exécution plus récents.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre des détails par tentative qui alimentent les journaux et les messages de refroidissement visibles par l’utilisateur :

- fournisseur/modèle tenté
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` et raisons de basculement similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Les journaux structurés `model_fallback_decision` incluent aussi des champs plats `fallbackStep*` lorsqu’un candidat échoue, est sauté ou qu’un repli ultérieur réussit. Ces champs rendent la transition tentée explicite (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) afin que les exportateurs de journaux et de diagnostics puissent reconstruire l’échec principal même lorsque le repli terminal échoue également.

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. Le lanceur de réponse externe peut l’utiliser pour construire un message plus spécifique, tel que « tous les modèles sont temporairement limités en débit », et inclure la prochaine expiration de refroidissement lorsqu’elle est connue.

Ce résumé de refroidissement tient compte du modèle :

- les limites de débit limitées à des modèles sans rapport sont ignorées pour la chaîne fournisseur/modèle tentée
- si le blocage restant est une limite de débit limitée au modèle correspondant, OpenClaw signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Consultez [Configuration du Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- le routage `agents.defaults.imageModel`

Consultez [Modèles](/fr/concepts/models) pour une vue d’ensemble plus large de la sélection de modèle et du repli.
