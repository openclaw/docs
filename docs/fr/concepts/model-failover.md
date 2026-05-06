---
read_when:
    - Diagnostiquer la rotation des profils d’authentification, les délais de temporisation ou le comportement de repli du modèle
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les surcharges du modèle de session interagissent avec les nouvelles tentatives de repli
sidebarTitle: Model failover
summary: Comment OpenClaw alterne les profils d’authentification et bascule entre les modèles
title: Basculement de modèle
x-i18n:
    generated_at: "2026-05-06T07:18:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gère les échecs en deux étapes:

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les sous-tendent.

## Flux d’exécution

Pour une exécution de texte normale, OpenClaw évalue les candidats dans cet ordre:

<Steps>
  <Step title="Résoudre l’état de la session">
    Résoudre le modèle de session actif et la préférence de profil d’authentification.
  </Step>
  <Step title="Construire la chaîne de candidats">
    Construire la chaîne de modèles candidats à partir de la sélection de modèle actuelle et de la stratégie de repli pour cette source de sélection. Les valeurs par défaut configurées, les modèles principaux des tâches Cron et les modèles de repli sélectionnés automatiquement peuvent utiliser les replis configurés; les sélections explicites de session utilisateur sont strictes.
  </Step>
  <Step title="Essayer le fournisseur actuel">
    Essayer le fournisseur actuel avec les règles de rotation/refroidissement des profils d’authentification.
  </Step>
  <Step title="Avancer sur les erreurs justifiant un basculement">
    Si ce fournisseur est épuisé avec une erreur justifiant un basculement, passer au modèle candidat suivant.
  </Step>
  <Step title="Persister la substitution de repli">
    Persister la substitution de repli sélectionnée avant le début de la nouvelle tentative afin que les autres lecteurs de session voient le même fournisseur/modèle que l’exécuteur s’apprête à utiliser. La substitution de modèle persistée est marquée `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rétablir précisément en cas d’échec">
    Si le candidat de repli échoue, rétablir uniquement les champs de substitution de session appartenant au repli lorsqu’ils correspondent encore à ce candidat échoué.
  </Step>
  <Step title="Lever FallbackSummaryError si tout est épuisé">
    Si tous les candidats échouent, lever une `FallbackSummaryError` avec le détail par tentative et l’expiration de refroidissement la plus proche lorsqu’elle est connue.
  </Step>
</Steps>

C’est volontairement plus étroit que « enregistrer et restaurer toute la session ». L’exécuteur de réponse ne persiste que les champs de sélection de modèle qu’il possède pour le repli:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela empêche une nouvelle tentative de repli échouée d’écraser des mutations de session plus récentes et sans rapport, comme des changements `/model` manuels ou des mises à jour de rotation de session survenues pendant l’exécution de la tentative.

## Politique de source de sélection

OpenClaw sépare le fournisseur/modèle sélectionné de la raison de cette sélection. Cette source contrôle si la chaîne de repli est autorisée:

- **Valeur par défaut configurée**: `agents.defaults.model.primary` utilise `agents.defaults.model.fallbacks`.
- **Modèle principal de l’agent**: `agents.list[].model` est strict sauf si l’objet de modèle de cet agent inclut ses propres `fallbacks`. Utilisez `fallbacks: []` pour rendre le comportement strict explicite, ou fournissez une liste non vide pour autoriser cet agent à utiliser le repli de modèle.
- **Substitution de repli automatique**: un repli d’exécution écrit `providerOverride`, `modelOverride` et `modelOverrideSource: "auto"` avant de réessayer. Cette substitution automatique peut continuer à parcourir la chaîne de repli configurée et est effacée par `/new`, `/reset` et `sessions.reset`.
- **Substitution de session utilisateur**: `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` écrivent `modelOverrideSource: "user"`. Il s’agit d’une sélection de session exacte. Si le fournisseur/modèle sélectionné échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre depuis un repli configuré sans rapport.
- **Substitution de session héritée**: les anciennes entrées de session peuvent avoir `modelOverride` sans `modelOverrideSource`. OpenClaw les traite comme des substitutions utilisateur afin qu’une ancienne sélection explicite ne soit pas silencieusement convertie en comportement de repli.
- **Modèle de charge utile Cron**: un `payload.model` / `--model` de tâche Cron est le modèle principal de la tâche, pas une substitution de session utilisateur. Il utilise les replis configurés sauf si la tâche fournit `payload.fallbacks`; `payload.fallbacks: []` rend l’exécution Cron stricte.

## Stockage d’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** pour les clés d’API comme pour les jetons OAuth.

- Les secrets résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (héritage: `~/.openclaw/agent/auth-profiles.json`).
- L’état de routage d’authentification à l’exécution réside dans `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuration `auth.profiles` / `auth.order` contient **uniquement des métadonnées + du routage** (pas de secrets).
- Fichier OAuth hérité uniquement pour l’import: `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors de la première utilisation).

Plus de détails: [OAuth](/fr/concepts/oauth)

Types d’identifiants:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## ID de profils

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut: `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail: `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un fournisseur possède plusieurs profils, OpenClaw choisit un ordre comme suit:

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

- **Clé primaire:** type de profil (**OAuth avant les clés d’API**).
- **Clé secondaire:** `usageStats.lastUsed` (du plus ancien au plus récent, au sein de chaque type).
- Les **profils en refroidissement/désactivés** sont déplacés à la fin, triés par expiration la plus proche.

### Affinité de session (compatible avec le cache)

OpenClaw **épingle le profil d’authentification choisi par session** pour garder les caches fournisseur chauds. Il ne fait **pas** de rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que:

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de Compaction augmente)
- le profil soit en refroidissement/désactivé

La sélection manuelle via `/model …@<profileId>` définit une **substitution utilisateur** pour cette session et ne fait pas l’objet d’une rotation automatique jusqu’au démarrage d’une nouvelle session.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence**: ils sont essayés en premier, mais OpenClaw peut effectuer une rotation vers un autre profil en cas de limites de débit/délais d’expiration. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil; s’il échoue et que des replis de modèle sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Pourquoi OAuth peut « sembler perdu »

Si vous avez à la fois un profil OAuth et un profil de clé d’API pour le même fournisseur, le round-robin peut alterner entre eux d’un message à l’autre sauf s’ils sont épinglés. Pour forcer un seul profil:

- Épinglez avec `auth.order[provider] = ["provider:profileId"]`, ou
- Utilisez une substitution par session via `/model …` avec une substitution de profil (lorsque votre UI/surface de chat la prend en charge).

## Refroidissements

Lorsqu’un profil échoue à cause d’erreurs d’authentification/de limite de débit (ou d’un délai d’expiration qui ressemble à une limitation de débit), OpenClaw le marque en refroidissement et passe au profil suivant.

<AccordionGroup>
  <Accordion title="Ce qui arrive dans le compartiment limite de débit / délai d’expiration">
    Ce compartiment de limite de débit est plus large qu’un simple `429`: il inclut aussi des messages fournisseur comme `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` et des limites périodiques de fenêtre d’utilisation comme `weekly/monthly limit reached`.

    Les erreurs de format/requête invalide (par exemple les échecs de validation d’ID d’appel d’outil Cloud Code Assist) sont traitées comme justifiant un basculement et utilisent les mêmes refroidissements. Les erreurs de raison d’arrêt compatibles OpenAI comme `Unhandled stop reason: error`, `stop reason: error` et `reason: error` sont classées comme des signaux de délai d’expiration/basculement.

    Le texte serveur générique peut aussi tomber dans ce compartiment de délai d’expiration lorsque la source correspond à un schéma transitoire connu. Par exemple, le message brut du wrapper de flux pi-ai `An unknown error occurred` est traité comme justifiant un basculement pour chaque fournisseur, car pi-ai l’émet lorsque les flux fournisseur se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans détails précis. Les charges utiles JSON `api_error` avec du texte serveur transitoire comme `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` sont également traitées comme des délais d’expiration justifiant un basculement.

    Le texte amont générique propre à OpenRouter comme le simple `Provider returned error` est traité comme un délai d’expiration uniquement lorsque le contexte fournisseur est réellement OpenRouter. Le texte de repli interne générique comme `LLM request failed with an unknown error.` reste conservateur et ne déclenche pas de basculement à lui seul.

  </Accordion>
  <Accordion title="Plafonds retry-after du SDK">
    Certains SDK de fournisseurs pourraient sinon attendre une longue fenêtre `Retry-After` avant de rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless comme Anthropic et OpenAI, OpenClaw plafonne par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60 secondes et remonte immédiatement les réponses réessayables plus longues afin que ce chemin de basculement puisse s’exécuter. Ajustez ou désactivez le plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; voir [Comportement de nouvelle tentative](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Refroidissements limités au modèle">
    Les refroidissements de limite de débit peuvent aussi être limités au modèle:

    - OpenClaw enregistre `cooldownModel` pour les échecs de limite de débit lorsque l’identifiant du modèle en échec est connu.
    - Un modèle frère sur le même fournisseur peut encore être essayé lorsque le refroidissement est limité à un autre modèle.
    - Les fenêtres de facturation/désactivation bloquent toujours tout le profil sur tous les modèles.

  </Accordion>
</AccordionGroup>

Les refroidissements utilisent un backoff exponentiel:

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

Les échecs de facturation/crédit (par exemple « insufficient credits » / « credit balance too low ») sont traités comme justifiant un basculement, mais ils ne sont généralement pas transitoires. Au lieu d’un court refroidissement, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et effectue une rotation vers le profil/fournisseur suivant.

<Note>
Toutes les réponses à forme de facturation ne sont pas `402`, et tous les HTTP `402` n’arrivent pas ici. OpenClaw conserve le texte de facturation explicite dans la voie de facturation même lorsqu’un fournisseur renvoie plutôt `401` ou `403`, mais les correspondances propres aux fournisseurs restent limitées au fournisseur qui les possède (par exemple OpenRouter `403 Key limit exceeded`).

Pendant ce temps, les erreurs `402` temporaires de fenêtre d’utilisation et de limite de dépenses d’organisation/espace de travail sont classées comme `rate_limit` lorsque le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Elles restent sur le chemin de court refroidissement/basculement au lieu du long chemin de désactivation pour facturation.
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

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation et est plafonné à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives en cas de surcharge autorisent **1 rotation de profil chez le même fournisseur** avant le repli de modèle.
- Les nouvelles tentatives en cas de surcharge utilisent **0 ms de backoff** par défaut.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux délais d’expiration qui ont épuisé la rotation des profils (les autres erreurs ne font pas avancer le repli). Les erreurs fournisseur qui n’exposent pas assez de détails restent étiquetées précisément dans l’état de repli: `empty_response` signifie que le fournisseur n’a renvoyé aucun message ou statut utilisable, `no_error_details` signifie que le fournisseur a explicitement renvoyé `Unknown error (no error details in response)`, et `unclassified` signifie qu’OpenClaw a conservé l’aperçu brut mais qu’aucun classificateur ne lui correspond encore.

Les erreurs de surcharge et de limite de débit sont traitées plus agressivement que les périodes de récupération liées à la facturation. Par défaut, OpenClaw autorise une nouvelle tentative de profil d'authentification chez le même fournisseur, puis bascule sans attendre vers le prochain modèle de repli configuré. Les signaux indiquant qu'un fournisseur est occupé, comme `ModelNotReadyException`, entrent dans cette catégorie de surcharge. Ajustez ce comportement avec `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` et `auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu'une exécution démarre depuis le modèle primaire par défaut configuré, le modèle primaire d'une tâche Cron, le modèle primaire d'un agent avec des modèles de repli explicites, ou une surcharge de repli sélectionnée automatiquement, OpenClaw peut parcourir la chaîne de repli configurée correspondante. Les modèles primaires d'agent sans modèles de repli explicites et les sélections utilisateur explicites (par exemple `/model ollama/qwen3.5:27b`, le sélecteur de modèle, `sessions.patch` ou des surcharges ponctuelles de fournisseur/modèle via CLI) sont stricts : si ce fournisseur/modèle est injoignable ou échoue avant de produire une réponse, OpenClaw signale l'échec au lieu de répondre via un modèle de repli sans rapport.

### Règles de la chaîne de candidats

OpenClaw construit la liste de candidats à partir du `provider/model` actuellement demandé, plus les modèles de repli configurés.

<AccordionGroup>
  <Accordion title="Règles">
    - Le modèle demandé est toujours en premier.
    - Les modèles de repli explicitement configurés sont dédupliqués, mais ne sont pas filtrés par la liste d'autorisation des modèles. Ils sont traités comme une intention explicite de l'opérateur.
    - Si l'exécution actuelle utilise déjà un modèle de repli configuré dans la même famille de fournisseurs, OpenClaw continue d'utiliser la chaîne configurée complète.
    - Si l'exécution actuelle utilise un fournisseur différent de celui de la configuration et que le modèle actuel ne fait pas déjà partie de la chaîne de repli configurée, OpenClaw n'ajoute pas de modèles de repli configurés sans rapport provenant d'un autre fournisseur.
    - Lorsqu'aucune surcharge de repli explicite n'est fournie à l'exécuteur de repli, le modèle primaire configuré est ajouté à la fin afin que la chaîne puisse revenir au comportement par défaut normal une fois les candidats précédents épuisés.
    - Lorsqu'un appelant fournit `fallbacksOverride`, l'exécuteur utilise exactement le modèle demandé plus cette liste de surcharge. Une liste vide désactive le repli de modèle et empêche le modèle primaire configuré d'être ajouté comme cible de nouvelle tentative cachée.

  </Accordion>
</AccordionGroup>

### Erreurs qui font passer au repli suivant

<Tabs>
  <Tab title="Continue en cas de">
    - échecs d'authentification
    - limites de débit et épuisement des périodes de récupération
    - erreurs de surcharge/fournisseur occupé
    - erreurs de basculement de type délai d'attente
    - désactivations liées à la facturation
    - `LiveSessionModelSwitchError`, qui est normalisée dans un chemin de basculement afin qu'un modèle persistant obsolète ne crée pas une boucle externe de nouvelles tentatives
    - autres erreurs non reconnues lorsqu'il reste encore des candidats

  </Tab>
  <Tab title="Ne continue pas en cas de">
    - abandons explicites qui ne sont pas de type délai d'attente/basculement
    - erreurs de dépassement de contexte qui doivent rester dans la logique de Compaction/nouvelle tentative (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - une erreur inconnue finale lorsqu'il ne reste plus de candidats

  </Tab>
</Tabs>

### Saut ou sondage pendant les périodes de récupération

Quand tous les profils d'authentification d'un fournisseur sont déjà en période de récupération, OpenClaw n'ignore pas automatiquement ce fournisseur indéfiniment. Il prend une décision par candidat :

<AccordionGroup>
  <Accordion title="Décisions par candidat">
    - Les échecs d'authentification persistants font ignorer immédiatement tout le fournisseur.
    - Les désactivations liées à la facturation entraînent généralement un saut, mais le candidat primaire peut tout de même être sondé avec limitation afin de permettre une récupération sans redémarrage.
    - Le candidat primaire peut être sondé à l'approche de l'expiration de la période de récupération, avec une limitation par fournisseur.
    - Les modèles de repli apparentés du même fournisseur peuvent être tentés malgré la période de récupération lorsque l'échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). C'est particulièrement pertinent lorsqu'une limite de débit est limitée au modèle et qu'un modèle apparenté peut tout de même récupérer immédiatement.
    - Les sondes de récupération transitoire sont limitées à une par fournisseur et par exécution de repli, afin qu'un seul fournisseur ne bloque pas le repli entre fournisseurs.

  </Accordion>
</AccordionGroup>

## Surcharges de session et changement de modèle en direct

Les changements de modèle de session sont un état partagé. L'exécuteur actif, la commande `/model`, les mises à jour de Compaction/session et la réconciliation de session en direct lisent ou écrivent tous des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicitement déclenchés par l'utilisateur marquent un changement en direct en attente. Cela inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle pilotés par le système, comme la rotation de repli, les surcharges de Heartbeat ou la Compaction, ne marquent jamais à eux seuls un changement en direct en attente.
- Les surcharges de modèle déclenchées par l'utilisateur sont traitées comme des sélections exactes pour la stratégie de repli, de sorte qu'un fournisseur sélectionné injoignable est signalé comme un échec au lieu d'être masqué par `agents.defaults.model.fallbacks`.
- Avant le démarrage d'une nouvelle tentative de repli, l'exécuteur de réponse persiste les champs de surcharge de repli sélectionnés dans l'entrée de session.
- Les surcharges de repli automatiques restent sélectionnées lors des tours suivants afin qu'OpenClaw ne sonde pas un primaire connu comme défaillant à chaque message. `/new`, `/reset` et `sessions.reset` effacent les surcharges d'origine automatique et ramènent la session au comportement par défaut configuré.
- `/status` affiche le modèle sélectionné et, lorsque l'état de repli diffère, le modèle de repli actif et la raison.
- La réconciliation de session en direct préfère les surcharges de session persistées aux champs de modèle d'exécution obsolètes.
- Si une erreur de changement en direct pointe vers un candidat ultérieur de la chaîne de repli active, OpenClaw passe directement à ce modèle sélectionné au lieu de parcourir d'abord des candidats sans rapport.
- Si la tentative de repli échoue, l'exécuteur annule uniquement les champs de surcharge qu'il a écrits, et seulement s'ils correspondent encore à ce candidat en échec.

Cela évite la condition de concurrence classique :

<Steps>
  <Step title="Le modèle primaire échoue">
    Le modèle primaire sélectionné échoue.
  </Step>
  <Step title="Repli choisi en mémoire">
    Le candidat de repli est choisi en mémoire.
  </Step>
  <Step title="Le stockage de session indique toujours l'ancien primaire">
    Le stockage de session reflète encore l'ancien primaire.
  </Step>
  <Step title="La réconciliation en direct lit un état obsolète">
    La réconciliation de session en direct lit l'état de session obsolète.
  </Step>
  <Step title="La nouvelle tentative revient en arrière">
    La nouvelle tentative est ramenée à l'ancien modèle avant que la tentative de repli commence.
  </Step>
</Steps>

La surcharge de repli persistée ferme cette fenêtre, et l'annulation ciblée conserve intactes les modifications de session manuelles ou d'exécution plus récentes.

## Observabilité et résumés d'échec

`runWithModelFallback(...)` enregistre des détails par tentative qui alimentent les journaux et les messages de période de récupération destinés à l'utilisateur :

- fournisseur/modèle tenté
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` et raisons de basculement similaires)
- statut/code facultatif
- résumé d'erreur lisible par un humain

Les journaux structurés `model_fallback_decision` incluent également des champs `fallbackStep*` plats lorsqu'un candidat échoue, est ignoré ou qu'un repli ultérieur réussit. Ces champs rendent explicite la transition tentée (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) afin que les exportateurs de journaux et de diagnostics puissent reconstruire l'échec primaire même lorsque le repli terminal échoue également.

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. L'exécuteur de réponse externe peut l'utiliser pour construire un message plus précis, par exemple "tous les modèles sont temporairement limités par le débit", et inclure l'expiration de période de récupération la plus proche lorsqu'elle est connue.

Ce résumé de récupération tient compte du modèle :

- les limites de débit à portée de modèle sans rapport sont ignorées pour la chaîne fournisseur/modèle tentée
- si le blocage restant est une limite de débit à portée de modèle correspondante, OpenClaw signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration connexe

Consultez [Configuration de Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routage de `agents.defaults.imageModel`

Consultez [Modèles](/fr/concepts/models) pour une vue d'ensemble plus large de la sélection de modèles et du repli.
