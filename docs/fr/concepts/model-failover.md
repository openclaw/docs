---
read_when:
    - Diagnostiquer la rotation des profils d’authentification, les périodes de refroidissement ou le comportement de bascule de modèle en cas de repli
    - Mettre à jour les règles de repli pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de repli
sidebarTitle: Model failover
summary: Comment OpenClaw fait tourner les profils d’authentification et bascule entre les modèles en cas de repli
title: Bascule de modèle en cas de repli
x-i18n:
    generated_at: "2026-04-26T11:27:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les sous-tendent.

## Flux d’exécution

Pour une exécution texte normale, OpenClaw évalue les candidats dans cet ordre :

<Steps>
  <Step title="Résoudre l’état de la session">
    Résoudre le modèle de session actif et la préférence de profil d’authentification.
  </Step>
  <Step title="Construire la chaîne de candidats">
    Construire la chaîne de candidats de modèle à partir du modèle de session actuellement sélectionné, puis `agents.defaults.model.fallbacks` dans l’ordre, en se terminant par le primaire configuré lorsque l’exécution a commencé à partir d’un remplacement.
  </Step>
  <Step title="Essayer le fournisseur actuel">
    Essayer le fournisseur actuel avec les règles de rotation/refroidissement des profils d’authentification.
  </Step>
  <Step title="Avancer sur les erreurs justifiant un repli">
    Si ce fournisseur est épuisé avec une erreur justifiant un repli, passer au candidat de modèle suivant.
  </Step>
  <Step title="Persister le remplacement de repli">
    Persister le remplacement de repli sélectionné avant le début de la nouvelle tentative afin que les autres lecteurs de session voient le même fournisseur/modèle que celui que le runner est sur le point d’utiliser.
  </Step>
  <Step title="Annuler de manière ciblée en cas d’échec">
    Si le candidat de repli échoue, n’annuler que les champs de remplacement de session appartenant au repli lorsqu’ils correspondent encore à ce candidat en échec.
  </Step>
  <Step title="Lever FallbackSummaryError si épuisé">
    Si chaque candidat échoue, lever un `FallbackSummaryError` avec le détail par tentative et l’expiration de refroidissement la plus proche lorsqu’elle est connue.
  </Step>
</Steps>

C’est volontairement plus étroit que « sauvegarder et restaurer toute la session ». Le reply runner ne persiste que les champs de sélection de modèle qu’il possède pour le repli :

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela évite qu’une nouvelle tentative de repli en échec n’écrase des mutations de session plus récentes et sans rapport, comme des changements manuels `/model` ou des mises à jour de rotation de session survenus pendant l’exécution de la tentative.

## Stockage d’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** à la fois pour les clés API et les tokens OAuth.

- Les secrets vivent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hérité : `~/.openclaw/agent/auth-profiles.json`).
- L’état d’exécution du routage d’authentification vit dans `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuration `auth.profiles` / `auth.order` est **uniquement des métadonnées + du routage** (pas de secrets).
- Fichier OAuth hérité import-only : `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation).

Plus de détails : [OAuth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## IDs de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut : `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils vivent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un fournisseur possède plusieurs profils, OpenClaw choisit un ordre comme suit :

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

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round‑robin :

- **Clé primaire :** type de profil (**OAuth avant les clés API**).
- **Clé secondaire :** `usageStats.lastUsed` (le plus ancien en premier, dans chaque type).
- **Les profils en refroidissement/désactivés** sont déplacés à la fin, ordonnés par expiration la plus proche.

### Persistance de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi par session** afin de garder les caches du fournisseur chauds. Il **ne** fait **pas** tourner les profils à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une compaction se termine (le compteur de compaction s’incrémente)
- le profil soit en refroidissement/désactivé

Une sélection manuelle via `/model …@<profileId>` définit un **remplacement utilisateur** pour cette session et n’est pas tournée automatiquement tant qu’une nouvelle session ne commence pas.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** : ils sont essayés en premier, mais OpenClaw peut tourner vers un autre profil en cas de limitation de débit/d’expiration du délai. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des replis de modèle sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Pourquoi OAuth peut « sembler perdu »

Si vous avez à la fois un profil OAuth et un profil de clé API pour le même fournisseur, le round‑robin peut alterner entre eux d’un message à l’autre sauf s’ils sont épinglés. Pour forcer un seul profil :

- Épinglez-le avec `auth.order[provider] = ["provider:profileId"]`, ou
- Utilisez un remplacement par session via `/model …` avec un remplacement de profil (lorsqu’il est pris en charge par votre surface UI/chat).

## Périodes de refroidissement

Lorsqu’un profil échoue en raison d’erreurs d’authentification/de limitation de débit (ou d’un délai d’attente ressemblant à une limitation de débit), OpenClaw le marque en refroidissement et passe au profil suivant.

<AccordionGroup>
  <Accordion title="Ce qui atterrit dans le compartiment limitation de débit / délai d’attente">
    Ce compartiment limitation de débit est plus large qu’un simple `429` : il inclut aussi des messages de fournisseur tels que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, et des limites périodiques de fenêtre d’usage comme `weekly/monthly limit reached`.

    Les erreurs de format/de requête invalide (par exemple les échecs de validation d’ID d’appel d’outil Cloud Code Assist) sont traitées comme justifiant un repli et utilisent les mêmes périodes de refroidissement. Les erreurs de type stop-reason compatibles OpenAI telles que `Unhandled stop reason: error`, `stop reason: error`, et `reason: error` sont classées comme signaux de délai d’attente/repli.

    Un texte serveur générique peut aussi atterrir dans ce compartiment délai d’attente lorsque la source correspond à un motif transitoire connu. Par exemple, le message nu `An unknown error occurred` du stream-wrapper pi-ai est traité comme justifiant un repli pour tous les fournisseurs parce que pi-ai l’émet lorsque les flux fournisseur se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans détails spécifiques. Les payloads JSON `api_error` avec un texte serveur transitoire tel que `internal server error`, `unknown error, 520`, `upstream error`, ou `backend error` sont aussi traités comme des délais d’attente justifiant un repli.

    Le texte générique d’upstream spécifique à OpenRouter tel que `Provider returned error` nu n’est traité comme un délai d’attente que lorsque le contexte fournisseur est effectivement OpenRouter. Un texte de repli interne générique tel que `LLM request failed with an unknown error.` reste conservateur et ne déclenche pas à lui seul un repli.

  </Accordion>
  <Accordion title="Plafonds Retry-After du SDK">
    Certains SDK fournisseur peuvent autrement dormir pendant une longue fenêtre `Retry-After` avant de rendre la main à OpenClaw. Pour les SDK basés sur Stainless comme Anthropic et OpenAI, OpenClaw plafonne par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60 secondes et fait remonter immédiatement les réponses réessayables plus longues afin que ce chemin de repli puisse s’exécuter. Ajustez ou désactivez ce plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; voir [Comportement de nouvelle tentative](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Périodes de refroidissement limitées au modèle">
    Les périodes de refroidissement pour limitation de débit peuvent aussi être limitées au modèle :

    - OpenClaw enregistre `cooldownModel` pour les échecs de limitation de débit lorsque l’id du modèle en échec est connu.
    - Un modèle frère sur le même fournisseur peut toujours être essayé lorsque la période de refroidissement est limitée à un modèle différent.
    - Les fenêtres de facturation/désactivation bloquent toujours l’ensemble du profil sur tous les modèles.

  </Accordion>
</AccordionGroup>

Les périodes de refroidissement utilisent un backoff exponentiel :

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

## Désactivations liées à la facturation

Les échecs de facturation/de crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont traités comme justifiant un repli, mais ils ne sont généralement pas transitoires. Au lieu d’une courte période de refroidissement, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et passe au profil/fournisseur suivant.

<Note>
Toutes les réponses à l’apparence de facturation ne sont pas des `402`, et tous les `402` HTTP n’atterrissent pas ici. OpenClaw conserve le texte explicite de facturation dans la voie facturation même lorsqu’un fournisseur retourne à la place `401` ou `403`, mais les matchers spécifiques au fournisseur restent limités au fournisseur qui les possède (par exemple OpenRouter `403 Key limit exceeded`).

Pendant ce temps, les erreurs temporaires `402` de fenêtre d’usage et de limite de dépense d’organisation/espace de travail sont classées comme `rate_limit` lorsque le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, ou `organization spending limit exceeded`). Celles-ci restent sur le chemin court de refroidissement/repli au lieu du chemin long de désactivation de facturation.
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

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation, et est plafonné à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives sur surcharge autorisent **1 rotation de profil du même fournisseur** avant le repli de modèle.
- Les nouvelles tentatives sur surcharge utilisent un backoff par défaut de **0 ms**.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limitations de débit, et aux délais d’attente qui ont épuisé la rotation des profils (les autres erreurs ne font pas avancer le repli).

Les erreurs de surcharge et de limitation de débit sont gérées plus agressivement que les périodes de refroidissement de facturation. Par défaut, OpenClaw autorise une nouvelle tentative de profil d’authentification sur le même fournisseur, puis passe au modèle de repli configuré suivant sans attendre. Les signaux de fournisseur occupé tels que `ModelNotReadyException` atterrissent dans ce compartiment surcharge. Ajustez cela avec `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, et `auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution commence avec un remplacement de modèle (hooks ou CLI), les replis se terminent quand même à `agents.defaults.model.primary` après avoir essayé les replis configurés éventuels.

### Règles de chaîne de candidats

OpenClaw construit la liste des candidats à partir du `provider/model` actuellement demandé et des replis configurés.

<AccordionGroup>
  <Accordion title="Règles">
    - Le modèle demandé est toujours en premier.
    - Les replis configurés explicites sont dédupliqués mais non filtrés par la liste d’autorisation des modèles. Ils sont traités comme une intention explicite de l’opérateur.
    - Si l’exécution actuelle est déjà sur un repli configuré dans la même famille de fournisseur, OpenClaw continue à utiliser la chaîne configurée complète.
    - Si l’exécution actuelle est sur un fournisseur différent de celui de la configuration et que ce modèle actuel ne fait pas déjà partie de la chaîne de repli configurée, OpenClaw n’ajoute pas de replis configurés non liés provenant d’un autre fournisseur.
    - Lorsque l’exécution a commencé à partir d’un remplacement, le primaire configuré est ajouté à la fin afin que la chaîne puisse se rétablir sur la valeur par défaut normale une fois les candidats précédents épuisés.
  </Accordion>
</AccordionGroup>

### Quelles erreurs font avancer le repli

<Tabs>
  <Tab title="Continue sur">
    - échecs d’authentification
    - limitations de débit et épuisement des périodes de refroidissement
    - erreurs de surcharge/fournisseur occupé
    - erreurs de type délai d’attente justifiant un repli
    - désactivations liées à la facturation
    - `LiveSessionModelSwitchError`, qui est normalisée en chemin de repli afin qu’un modèle persisté obsolète ne crée pas de boucle externe de nouvelle tentative
    - autres erreurs non reconnues lorsqu’il reste encore des candidats
  </Tab>
  <Tab title="Ne continue pas sur">
    - abandons explicites qui ne sont pas de type délai d’attente/repli
    - erreurs de dépassement de contexte qui doivent rester dans la logique de Compaction/nouvelle tentative (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, ou `ollama error: context length exceeded`)
    - une erreur inconnue finale lorsqu’il ne reste plus de candidats
  </Tab>
</Tabs>

### Comportement de saut de période de refroidissement vs sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en période de refroidissement, OpenClaw ne saute pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

<AccordionGroup>
  <Accordion title="Décisions par candidat">
    - Les échecs d’authentification persistants font sauter immédiatement tout le fournisseur.
    - Les désactivations liées à la facturation sont généralement sautées, mais le candidat primaire peut toujours être sondé avec limitation afin qu’une récupération soit possible sans redémarrage.
    - Le candidat primaire peut être sondé à l’approche de l’expiration de la période de refroidissement, avec une limitation par fournisseur.
    - Des modèles frères de repli sur le même fournisseur peuvent être essayés malgré la période de refroidissement lorsque l’échec semble transitoire (`rate_limit`, `overloaded`, ou inconnu). C’est particulièrement pertinent lorsqu’une limitation de débit est limitée au modèle et qu’un modèle frère peut encore récupérer immédiatement.
    - Les sondes de période de refroidissement transitoire sont limitées à une par fournisseur et par exécution de repli afin qu’un seul fournisseur ne bloque pas le repli inter-fournisseurs.
  </Accordion>
</AccordionGroup>

## Remplacements de session et changement de modèle en direct

Les changements de modèle de session sont un état partagé. Le runner actif, la commande `/model`, les mises à jour de Compaction/session, et la réconciliation de session en direct lisent ou écrivent tous des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicites initiés par l’utilisateur marquent un changement en direct en attente. Cela inclut `/model`, `session_status(model=...)`, et `sessions.patch`.
- Les changements de modèle pilotés par le système tels que la rotation de repli, les remplacements Heartbeat, ou la Compaction ne marquent jamais à eux seuls un changement en direct en attente.
- Avant qu’une nouvelle tentative de repli ne commence, le reply runner persiste les champs de remplacement de repli sélectionnés dans l’entrée de session.
- La réconciliation de session en direct préfère les remplacements de session persistés aux champs de modèle d’exécution obsolètes.
- Si la tentative de repli échoue, le runner n’annule que les champs de remplacement qu’il a écrits, et seulement s’ils correspondent encore à ce candidat en échec.

Cela évite la condition de concurrence classique :

<Steps>
  <Step title="Le primaire échoue">
    Le modèle primaire sélectionné échoue.
  </Step>
  <Step title="Repli choisi en mémoire">
    Le candidat de repli est choisi en mémoire.
  </Step>
  <Step title="Le stockage de session indique toujours l’ancien primaire">
    Le stockage de session reflète toujours l’ancien primaire.
  </Step>
  <Step title="La réconciliation en direct lit un état obsolète">
    La réconciliation de session en direct lit l’état de session obsolète.
  </Step>
  <Step title="Nouvelle tentative rétablie sur l’ancien modèle">
    La nouvelle tentative est rétablie sur l’ancien modèle avant le début de la tentative de repli.
  </Step>
</Steps>

Le remplacement de repli persisté ferme cette fenêtre, et l’annulation ciblée conserve intactes les modifications de session manuelles ou d’exécution plus récentes.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre des détails par tentative qui alimentent les journaux et les messages de période de refroidissement visibles par l’utilisateur :

- fournisseur/modèle essayé
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, et raisons de repli similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Lorsque chaque candidat échoue, OpenClaw lève `FallbackSummaryError`. Le reply runner externe peut l’utiliser pour construire un message plus spécifique tel que « tous les modèles sont temporairement limités en débit » et inclure l’expiration de période de refroidissement la plus proche lorsqu’elle est connue.

Ce résumé de période de refroidissement tient compte du modèle :

- les limitations de débit limitées à un modèle non liées sont ignorées pour la chaîne fournisseur/modèle essayée
- si le blocage restant est une limitation de débit limitée au modèle correspondante, OpenClaw rapporte la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Voir [Configuration de la Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routage `agents.defaults.imageModel`

Voir [Modèles](/fr/concepts/models) pour la vue d’ensemble plus large de la sélection de modèle et du repli.
