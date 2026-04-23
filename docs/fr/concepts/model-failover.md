---
read_when:
    - Diagnostic de la rotation des profils d’authentification, des délais de récupération ou du comportement de basculement des modèles
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de repli
summary: Comment OpenClaw effectue la rotation des profils d’authentification et bascule entre les modèles en cas de repli
title: Basculement de modèle
x-i18n:
    generated_at: "2026-04-23T07:02:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Basculement de modèle

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Basculement de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les sous-tendent.

## Flux d’exécution

Pour une exécution texte normale, OpenClaw évalue les candidats dans cet ordre :

1. Le modèle de session actuellement sélectionné.
2. Les `agents.defaults.model.fallbacks` configurés, dans l’ordre.
3. Le modèle principal configuré à la fin lorsque l’exécution a commencé à partir d’un remplacement.

À l’intérieur de chaque candidat, OpenClaw essaie le basculement de profil d’authentification avant de passer
au candidat modèle suivant.

Séquence de haut niveau :

1. Résoudre le modèle de session actif et la préférence de profil d’authentification.
2. Construire la chaîne des candidats de modèle.
3. Essayer le fournisseur actuel avec les règles de rotation/délai de récupération des profils d’authentification.
4. Si ce fournisseur est épuisé avec une erreur justifiant un basculement, passer au candidat
   modèle suivant.
5. Persister le remplacement de repli sélectionné avant le début de la nouvelle tentative afin que les autres
   lecteurs de session voient le même fournisseur/modèle que celui que l’exécuteur est sur le point d’utiliser.
6. Si le candidat de repli échoue, annuler uniquement les champs de remplacement de session
   possédés par le repli lorsqu’ils correspondent encore à ce candidat échoué.
7. Si tous les candidats échouent, lever une `FallbackSummaryError` avec le détail
   par tentative et l’expiration de délai de récupération la plus proche lorsqu’elle est connue.

C’est volontairement plus étroit que « enregistrer et restaurer toute la session ». Le
reply runner ne persiste que les champs de sélection de modèle qu’il possède pour le repli :

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela empêche une nouvelle tentative de repli échouée d’écraser des mutations de session plus récentes et sans rapport
telles que des changements manuels `/model` ou des mises à jour de rotation de session
survenus pendant l’exécution de la tentative.

## Stockage de l’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** à la fois pour les clés API et les jetons OAuth.

- Les secrets se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ancien : `~/.openclaw/agent/auth-profiles.json`).
- L’état de routage de l’authentification à l’exécution se trouve dans `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuration `auth.profiles` / `auth.order` contient **uniquement les métadonnées + le routage** (pas de secrets).
- Ancien fichier OAuth destiné uniquement à l’import : `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors de la première utilisation).

Plus de détails : [/concepts/oauth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## ID de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut : `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un fournisseur possède plusieurs profils, OpenClaw choisit un ordre comme suit :

1. **Configuration explicite** : `auth.order[provider]` (si défini).
2. **Profils configurés** : `auth.profiles` filtrés par fournisseur.
3. **Profils stockés** : entrées de `auth-profiles.json` pour le fournisseur.

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round-robin :

- **Clé primaire :** type de profil (**OAuth avant les clés API**).
- **Clé secondaire :** `usageStats.lastUsed` (le plus ancien d’abord, dans chaque type).
- Les profils **en délai de récupération/désactivés** sont déplacés à la fin, ordonnés par expiration la plus proche.

### Persistance de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi par session** pour garder les caches du fournisseur chauds.
Il **ne** fait **pas** de rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de compaction s’incrémente)
- le profil soit en délai de récupération/désactivé

La sélection manuelle via `/model …@<profileId>` définit un **remplacement utilisateur** pour cette session
et n’est pas tournée automatiquement tant qu’une nouvelle session ne démarre pas.

Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** :
ils sont essayés en premier, mais OpenClaw peut tourner vers un autre profil en cas de limites de débit/timeouts.
Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des replis de modèle
sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.

### Pourquoi OAuth peut « sembler perdu »

Si vous avez à la fois un profil OAuth et un profil de clé API pour le même fournisseur, le round-robin peut alterner entre eux d’un message à l’autre sauf s’ils sont épinglés. Pour forcer un profil unique :

- Épinglez avec `auth.order[provider] = ["provider:profileId"]`, ou
- Utilisez un remplacement par session via `/model …` avec un remplacement de profil (lorsqu’il est pris en charge par votre surface UI/discussion).

## Délais de récupération

Lorsqu’un profil échoue en raison d’erreurs d’authentification/de limite de débit (ou d’un timeout qui
ressemble à une limite de débit), OpenClaw le place en délai de récupération et passe au profil suivant.
Cette catégorie de limite de débit est plus large qu’un simple `429` : elle inclut aussi des messages du fournisseur
tels que `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` et les limites périodiques de fenêtre d’usage telles que
`weekly/monthly limit reached`.
Les erreurs de format/requête invalide (par exemple les échecs de validation
d’ID d’appel d’outil Cloud Code Assist) sont traitées comme justifiant un basculement et utilisent les mêmes délais de récupération.
Les erreurs de raison d’arrêt compatibles OpenAI telles que `Unhandled stop reason: error`,
`stop reason: error` et `reason: error` sont classées comme des signaux
de timeout/basculement.
Le texte générique de serveur au niveau fournisseur peut aussi tomber dans cette catégorie de timeout lorsque
la source correspond à un motif transitoire connu. Par exemple, le texte brut Anthropic
`An unknown error occurred` et les charges utiles JSON `api_error` avec du texte serveur transitoire
tel que `internal server error`, `unknown error, 520`, `upstream error`,
ou `backend error` sont traités comme justifiant un basculement sur timeout. Le texte générique
spécifique à OpenRouter tel que `Provider returned error` est aussi traité comme un
timeout uniquement lorsque le contexte fournisseur est réellement OpenRouter. Le texte de repli interne générique
tel que `LLM request failed with an unknown error.` reste traité de manière
prudente et ne déclenche pas à lui seul un basculement.

Certains SDK de fournisseurs peuvent sinon attendre longtemps une fenêtre `Retry-After` avant de
rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless tels qu’Anthropic et
OpenAI, OpenClaw limite par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60
secondes et expose immédiatement les réponses réessayables plus longues afin que ce chemin
de basculement puisse s’exécuter. Ajustez ou désactivez cette limite avec
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; voir [/concepts/retry](/fr/concepts/retry).

Les délais de récupération pour limite de débit peuvent aussi être limités au modèle :

- OpenClaw enregistre `cooldownModel` pour les échecs dus à une limite de débit lorsque l’id du
  modèle en échec est connu.
- Un modèle frère chez le même fournisseur peut encore être essayé lorsque le délai de récupération est
  limité à un autre modèle.
- Les fenêtres de facturation/désactivation continuent de bloquer tout le profil, quel que soit le modèle.

Les délais de récupération utilisent un backoff exponentiel :

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

Les échecs de facturation/crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont traités comme justifiant un basculement, mais ils ne sont généralement pas transitoires. Au lieu d’un court délai de récupération, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et passe au profil/fournisseur suivant.

Toutes les réponses ressemblant à de la facturation ne sont pas des `402`, et tous les `402` HTTP
ne passent pas ici. OpenClaw conserve les textes explicites de facturation dans la voie de facturation même lorsqu’un
fournisseur retourne à la place `401` ou `403`, mais les correspondances spécifiques au fournisseur restent
limitées au fournisseur qui leur appartient (par exemple OpenRouter `403 Key limit
exceeded`). Pendant ce temps, les erreurs temporaires `402` de fenêtre d’usage et de
limite de dépense d’organisation/espace de travail sont classées comme `rate_limit` lorsque
le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, ou `organization spending limit exceeded`).
Elles restent sur le chemin court de délai de récupération/basculement au lieu du long
chemin de désactivation de facturation.

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

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation et est plafonné à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives en cas de surcharge autorisent **1 rotation de profil chez le même fournisseur** avant le basculement de modèle.
- Les nouvelles tentatives en cas de surcharge utilisent par défaut un backoff de **0 ms**.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans
`agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et
aux timeouts qui ont épuisé la rotation des profils (les autres erreurs ne font pas progresser le repli).

Les erreurs de surcharge et de limite de débit sont gérées plus agressivement que les délais de récupération de facturation. Par défaut, OpenClaw autorise une rotation de profil d’authentification chez le même fournisseur, puis passe au modèle de repli configuré suivant sans attendre.
Les signaux de fournisseur occupé tels que `ModelNotReadyException` tombent dans cette catégorie de surcharge. Ajustez cela avec `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, et
`auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution commence avec un remplacement de modèle (hooks ou CLI), les replis se terminent quand même sur
`agents.defaults.model.primary` après avoir essayé les replis configurés.

### Règles de la chaîne des candidats

OpenClaw construit la liste des candidats à partir du `provider/model`
actuellement demandé plus les replis configurés.

Règles :

- Le modèle demandé est toujours en premier.
- Les replis configurés explicites sont dédupliqués mais ne sont pas filtrés par la liste d’autorisation des
  modèles. Ils sont traités comme une intention explicite de l’opérateur.
- Si l’exécution actuelle est déjà sur un repli configuré dans la même famille de fournisseur,
  OpenClaw continue d’utiliser la chaîne configurée complète.
- Si l’exécution actuelle est sur un fournisseur différent de la configuration et que ce modèle courant
  ne fait pas déjà partie de la chaîne de repli configurée, OpenClaw n’ajoute pas
  de replis configurés sans rapport provenant d’un autre fournisseur.
- Lorsque l’exécution a commencé à partir d’un remplacement, le modèle principal configuré est ajouté à
  la fin afin que la chaîne puisse revenir vers la valeur normale par défaut une fois les
  premiers candidats épuisés.

### Quelles erreurs font progresser le repli

Le repli de modèle continue sur :

- les échecs d’authentification
- les limites de débit et l’épuisement des délais de récupération
- les erreurs de surcharge/fournisseur occupé
- les erreurs de basculement en forme de timeout
- les désactivations de facturation
- `LiveSessionModelSwitchError`, qui est normalisée en chemin de basculement afin qu’un
  modèle persistant obsolète ne crée pas de boucle externe de nouvelle tentative
- les autres erreurs non reconnues lorsqu’il reste encore des candidats

Le repli de modèle ne continue pas sur :

- les abandons explicites qui ne sont pas en forme de timeout/basculement
- les erreurs de débordement de contexte qui doivent rester dans la logique de compaction/nouvelle tentative
  (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, ou `ollama error: context
length exceeded`)
- une erreur inconnue finale lorsqu’il ne reste plus de candidats

### Comportement d’ignorance de délai de récupération vs sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en délai de récupération, OpenClaw
ne saute pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

- Les échecs d’authentification persistants sautent immédiatement tout le fournisseur.
- Les désactivations de facturation sont généralement sautées, mais le candidat principal peut tout de même être sondé
  avec limitation afin de permettre une récupération sans redémarrage.
- Le candidat principal peut être sondé près de l’expiration du délai de récupération, avec une limitation
  par fournisseur.
- Les modèles frères de repli chez le même fournisseur peuvent être essayés malgré le délai de récupération lorsque
  l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). Cela est
  particulièrement pertinent lorsqu’une limite de débit est limitée au modèle et qu’un modèle frère peut
  encore récupérer immédiatement.
- Les sondes transitoires de délai de récupération sont limitées à une par fournisseur et par exécution de repli afin
  qu’un seul fournisseur ne bloque pas le repli inter-fournisseurs.

## Remplacements de session et changement de modèle en direct

Les changements de modèle de session constituent un état partagé. L’exécuteur actif, la commande `/model`,
les mises à jour de compaction/session et la réconciliation de session en direct lisent ou écrivent tous
des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicites initiés par l’utilisateur marquent un changement en direct en attente. Cela
  inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle pilotés par le système tels que la rotation de repli, les remplacements de Heartbeat
  ou la compaction ne marquent jamais à eux seuls un changement en direct en attente.
- Avant le début d’une nouvelle tentative de repli, le reply runner persiste les champs de remplacement
  de repli sélectionnés dans l’entrée de session.
- La réconciliation de session en direct privilégie les remplacements de session persistés sur les champs
  de modèle runtime obsolètes.
- Si la tentative de repli échoue, l’exécuteur annule uniquement les champs de remplacement
  qu’il a écrits, et seulement s’ils correspondent encore à ce candidat échoué.

Cela évite la condition de concurrence classique :

1. Le modèle principal échoue.
2. Un candidat de repli est choisi en mémoire.
3. Le magasin de session indique encore l’ancien modèle principal.
4. La réconciliation de session en direct lit l’état de session obsolète.
5. La nouvelle tentative est ramenée à l’ancien modèle avant le début de la tentative de repli.

Le remplacement de repli persisté ferme cette fenêtre, et l’annulation ciblée
préserve les changements de session manuels ou runtime plus récents.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre les détails par tentative qui alimentent les journaux et
les messages de délai de récupération visibles par l’utilisateur :

- fournisseur/modèle tenté
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, et
  raisons de basculement similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. L’exécuteur
de réponse externe peut l’utiliser pour construire un message plus précis tel que « tous les modèles
sont temporairement limités en débit » et inclure l’expiration de délai de récupération la plus proche lorsqu’elle
est connue.

Ce résumé de délai de récupération tient compte du modèle :

- les limites de débit limitées à un modèle sans rapport sont ignorées pour la chaîne
  fournisseur/modèle tentée
- si le blocage restant est une limite de débit limitée à un modèle correspondant, OpenClaw
  signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Voir [Configuration de la Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routage `agents.defaults.imageModel`

Voir [Modèles](/fr/concepts/models) pour une vue d’ensemble plus large de la sélection et du repli de modèle.
