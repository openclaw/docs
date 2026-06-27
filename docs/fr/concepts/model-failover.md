---
read_when:
    - Diagnostic de la rotation des profils d’authentification, des périodes de récupération ou du comportement de repli du modèle
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de repli
sidebarTitle: Model failover
summary: Comment OpenClaw alterne les profils d’authentification et bascule entre les modèles
title: Basculement de modèle
x-i18n:
    generated_at: "2026-06-27T17:24:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw gère les échecs en deux étapes:

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les appuient.

## Flux d’exécution

Pour une exécution de texte normale, OpenClaw évalue les candidats dans cet ordre:

<Steps>
  <Step title="Résoudre l’état de session">
    Résoudre le modèle de session actif et la préférence de profil d’authentification.
  </Step>
  <Step title="Construire la chaîne de candidats">
    Construire la chaîne de modèles candidats à partir de la sélection de modèle actuelle et de la politique de repli pour la source de cette sélection. Les valeurs par défaut configurées, les modèles principaux des tâches cron et les modèles de repli sélectionnés automatiquement peuvent utiliser les replis configurés; les sélections explicites de session utilisateur sont strictes.
  </Step>
  <Step title="Essayer le fournisseur actuel">
    Essayer le fournisseur actuel avec les règles de rotation/refroidissement des profils d’authentification.
  </Step>
  <Step title="Avancer sur les erreurs justifiant une bascule">
    Si ce fournisseur est épuisé avec une erreur justifiant une bascule, passer au modèle candidat suivant.
  </Step>
  <Step title="Persister la substitution de repli">
    Persister la substitution de repli sélectionnée avant le début de la nouvelle tentative afin que les autres lecteurs de session voient le même fournisseur/modèle que le runner est sur le point d’utiliser. La substitution de modèle persistée est marquée `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Revenir en arrière de façon ciblée en cas d’échec">
    Si le candidat de repli échoue, annuler uniquement les champs de substitution de session appartenant au repli lorsqu’ils correspondent encore à ce candidat échoué.
  </Step>
  <Step title="Lancer FallbackSummaryError si tout est épuisé">
    Si tous les candidats échouent, lancer une `FallbackSummaryError` avec les détails par tentative et l’expiration de refroidissement la plus proche lorsqu’elle est connue.
  </Step>
</Steps>

C’est volontairement plus ciblé que « enregistrer et restaurer toute la session ». Le runner de réponse ne persiste que les champs de sélection de modèle dont il est propriétaire pour le repli:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela empêche une nouvelle tentative de repli échouée d’écraser des mutations de session plus récentes et sans rapport, comme des changements manuels `/model` ou des mises à jour de rotation de session qui se sont produits pendant l’exécution de la tentative.

## Politique de source de sélection

OpenClaw sépare le fournisseur/modèle sélectionné de la raison de sa sélection. Cette source contrôle si la chaîne de repli est autorisée:

- **Valeur par défaut configurée**: `agents.defaults.model.primary` utilise `agents.defaults.model.fallbacks`.
- **Modèle principal de l’agent**: `agents.list[].model` est strict sauf si cet objet de modèle d’agent inclut ses propres `fallbacks`. Utilisez `fallbacks: []` pour rendre le comportement strict explicite, ou fournissez une liste non vide pour activer le repli de modèle pour cet agent.
- **Substitution de repli automatique**: un repli d’exécution écrit `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` et le modèle d’origine sélectionné avant de réessayer. Cette substitution automatique peut continuer à parcourir la chaîne de repli configurée sans sonder le modèle principal à chaque message, mais OpenClaw sonde périodiquement l’origine configurée à nouveau et efface la substitution automatique lorsqu’elle se rétablit. `/new`, `/reset` et `sessions.reset` effacent aussi les substitutions de source automatique. Les exécutions Heartbeat sans `heartbeat.model` explicite effacent les substitutions automatiques directes lorsque leur origine ne correspond plus à la valeur par défaut configurée actuelle.
- **Substitution de session utilisateur**: `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` écrivent `modelOverrideSource: "user"`. C’est une sélection exacte de session. Si le fournisseur/modèle sélectionné échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre depuis un repli configuré sans rapport.
- **Substitution de session héritée**: les anciennes entrées de session peuvent avoir `modelOverride` sans `modelOverrideSource`. OpenClaw les traite comme des substitutions utilisateur afin qu’une ancienne sélection explicite ne soit pas convertie silencieusement en comportement de repli.
- **Modèle de payload Cron**: un `payload.model` / `--model` de tâche cron est un modèle principal de tâche, pas une substitution de session utilisateur. Il utilise les replis configurés sauf si la tâche fournit `payload.fallbacks`; `payload.fallbacks: []` rend l’exécution cron stricte.

L’intervalle de sondage du modèle principal de repli automatique est de cinq minutes et n’est pas configurable. OpenClaw mémorise les sondages récents par session et modèle principal afin qu’un modèle principal en échec ne soit pas réessayé à chaque tour. OpenClaw envoie un avis visible lorsqu’une session passe sur un repli et un autre avis lorsqu’elle revient au modèle principal sélectionné; il ne répète pas l’avis à chaque tour de repli persistant.

## Cache de saut d’échec d’authentification

Par défaut, chaque nouveau tour conserve le comportement existant de nouvelle tentative de repli: OpenClaw
réessaiera chaque candidat de repli configuré, y compris les candidats non principaux
qui ont récemment échoué avec `auth` ou `auth_permanent`.

Les opérateurs qui préfèrent supprimer ces échecs d’authentification répétés peuvent l’activer avec:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Lorsqu’il est activé, OpenClaw enregistre un marqueur de saut en mémoire, limité à la session, pour un
candidat de repli non principal après un échec de classe auth. Le marqueur est indexé
par identifiant de session, fournisseur et modèle. Les candidats principaux ne sont jamais sautés, de sorte qu’une
sélection explicite de modèle utilisateur expose toujours la véritable erreur d’authentification. Le cache est
local au processus et est effacé au redémarrage du Gateway.

La valeur est un TTL en millisecondes. `0` ou une valeur non définie désactive le cache.
Les valeurs positives sont limitées entre 1 seconde et 10 minutes.

## Avis de repli visibles par l’utilisateur

Lorsqu’une session passe sur un repli sélectionné automatiquement, OpenClaw envoie un avis d’état dans la même surface de réponse:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Lorsqu’un sondage ultérieur réussit et que la session revient au modèle principal sélectionné, OpenClaw envoie:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Ces avis sont des messages opérationnels, pas du contenu d’assistant. Ils sont remis une fois par changement d’état, y compris lors de tours uniquement à effet secondaire lorsque c’est possible, mais les tours de repli persistant ne les répètent pas. La remise contourne la suppression normale de réponse source, l’avis ne consomme pas le premier emplacement de réponse d’assistant pour les canaux avec fils de discussion, et il est exclu de la synthèse vocale et de l’extraction des engagements.

## Stockage d’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** pour les clés API comme pour les jetons OAuth.

- Les secrets et l’état d’acheminement d’authentification d’exécution résident dans `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuration `auth.profiles` / `auth.order` contient **uniquement des métadonnées + de l’acheminement** (aucun secret).
- Fichier OAuth hérité réservé à l’importation: `~/.openclaw/credentials/oauth.json` (importé dans le magasin d’authentification par agent à la première utilisation).
- Les fichiers hérités `auth-profiles.json`, `auth-state.json` et `auth.json` par agent sont importés par `openclaw doctor --fix`.

Plus de détails: [OAuth](/fr/concepts/oauth)

Types d’identifiants:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## Identifiants de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut: `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail: `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils résident dans le magasin de profils d’authentification `openclaw-agent.sqlite` par agent.

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
    Entrées de profil d’authentification SQLite par agent pour le fournisseur.
  </Step>
</Steps>

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round-robin:

- **Clé primaire:** type de profil (**OAuth avant les clés API**).
- **Clé secondaire:** `usageStats.lastUsed` (le plus ancien d’abord, au sein de chaque type).
- **Profils en refroidissement/désactivés** sont déplacés à la fin, ordonnés par expiration la plus proche.

### Persistance de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi par session** pour garder les caches fournisseur chauds. Il ne le fait **pas** tourner à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que:

- la session soit réinitialisée (`/new` / `/reset`)
- une Compaction se termine (le compteur de Compaction augmente)
- le profil soit en refroidissement/désactivé

La sélection manuelle via `/model …@<profileId>` définit une **substitution utilisateur** pour cette session et n’est pas automatiquement tournée avant le démarrage d’une nouvelle session.

<Note>
Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence**: ils sont essayés en premier, mais OpenClaw peut tourner vers un autre profil en cas de limites de débit/délais d’attente. Lorsque le profil d’origine redevient disponible, les nouvelles exécutions peuvent le préférer à nouveau sans changer le modèle sélectionné ni l’exécution. Les profils épinglés par l’utilisateur restent verrouillés sur ce profil; s’il échoue et que des replis de modèle sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.
</Note>

### Abonnement OpenAI Codex plus sauvegarde par clé API

Pour les modèles d’agent OpenAI, l’authentification et l’exécution sont séparées. `openai/gpt-*` reste sur
le harnais Codex tandis que l’authentification peut tourner entre un profil d’abonnement Codex et
une sauvegarde par clé API OpenAI.

Utilisez `auth.order.openai` pour l’ordre visible par l’utilisateur:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Utilisez `openai:*` pour les profils OAuth ChatGPT/Codex et les profils de clé API
OpenAI. Lorsque l’abonnement atteint une limite d’utilisation Codex,
OpenClaw enregistre l’heure exacte de réinitialisation lorsque Codex en fournit une, essaie le profil
d’authentification ordonné suivant et maintient l’exécution dans le harnais Codex. Une fois l’heure de
réinitialisation passée, le profil d’abonnement est à nouveau éligible et la prochaine sélection
automatique peut y revenir.

Utilisez un profil épinglé par l’utilisateur uniquement lorsque vous voulez forcer un compte/une clé pour cette
session. Les profils épinglés par l’utilisateur sont volontairement stricts et ne basculent pas silencieusement
vers un autre profil.

## Refroidissements

Lorsqu’un profil échoue en raison d’erreurs d’authentification/de limite de débit (ou d’un délai d’attente qui ressemble à une limitation de débit), OpenClaw le marque en refroidissement et passe au profil suivant.

<AccordionGroup>
  <Accordion title="Ce qui tombe dans le compartiment limite de débit / délai d’attente">
    Ce compartiment de limite de débit est plus large qu’un simple `429`: il inclut aussi des messages fournisseur tels que `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` et des limites périodiques de fenêtre d’utilisation telles que `weekly/monthly limit reached`.

    Les erreurs de format/requête invalide sont généralement terminales, car réessayer le même payload échouerait de la même façon; OpenClaw les expose donc au lieu de faire tourner les profils d’authentification. Les chemins connus de réparation par nouvelle tentative peuvent s’inscrire explicitement: par exemple, les échecs de validation d’identifiant d’appel d’outil Cloud Code Assist sont assainis et réessayés une fois via la politique `allowFormatRetry`. Les erreurs de raison d’arrêt compatibles OpenAI telles que `Unhandled stop reason: error`, `stop reason: error` et `reason: error` sont classées comme signaux de délai d’attente/bascule.

    Le texte serveur générique peut aussi tomber dans ce compartiment de délai d’attente lorsque la source correspond à un motif transitoire connu. Par exemple, le message nu du wrapper de flux d’exécution de modèle `An unknown error occurred` est traité comme justifiant une bascule pour chaque fournisseur, car l’exécution de modèle partagée l’émet lorsque les flux fournisseur se terminent avec `stopReason: "aborted"` ou `stopReason: "error"` sans détails précis. Les payloads JSON `api_error` avec du texte serveur transitoire tel que `internal server error`, `unknown error, 520`, `upstream error` ou `backend error` sont aussi traités comme des délais d’attente justifiant une bascule.

    Le texte amont générique propre à OpenRouter, comme le simple `Provider returned error`, est traité comme un délai d’attente uniquement lorsque le contexte fournisseur est réellement OpenRouter. Le texte générique de repli interne tel que `LLM request failed with an unknown error.` reste conservateur et ne déclenche pas une bascule à lui seul.

  </Accordion>
  <Accordion title="Limites SDK retry-after">
    Certains SDK de fournisseurs peuvent sinon attendre pendant une longue fenêtre `Retry-After` avant de rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless comme Anthropic et OpenAI, OpenClaw limite par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60 secondes et expose immédiatement les réponses réessayables plus longues afin que ce chemin de basculement puisse s’exécuter. Ajustez ou désactivez cette limite avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; consultez [Comportement de nouvelle tentative](/fr/concepts/retry).
  </Accordion>
  <Accordion title="Temps de recharge par modèle">
    Les temps de recharge liés aux limites de débit peuvent aussi être propres à un modèle :

    - OpenClaw enregistre `cooldownModel` pour les échecs de limite de débit lorsque l’identifiant du modèle en échec est connu.
    - Un modèle frère chez le même fournisseur peut encore être essayé lorsque le temps de recharge concerne un autre modèle.
    - Les fenêtres de facturation/désactivation bloquent toujours tout le profil sur l’ensemble des modèles.

  </Accordion>
</AccordionGroup>

Les temps de recharge utilisent un backoff exponentiel :

- 1 minute
- 5 minutes
- 25 minutes
- 1 heure (limite)

L’état est stocké dans l’état d’authentification SQLite propre à l’agent sous `usageStats` :

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

Les échecs de facturation/crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont traités comme justifiant un basculement, mais ils ne sont généralement pas transitoires. Au lieu d’un court temps de recharge, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et passe au profil/fournisseur suivant.

<Note>
Toutes les réponses qui ressemblent à de la facturation ne sont pas des `402`, et tous les `402` HTTP n’arrivent pas ici. OpenClaw conserve le texte de facturation explicite dans la voie de facturation même lorsqu’un fournisseur renvoie plutôt `401` ou `403`, mais les correspondances propres au fournisseur restent limitées au fournisseur qui les possède (par exemple OpenRouter `403 Key limit exceeded`).

Pendant ce temps, les erreurs temporaires `402` de fenêtre d’utilisation et de limite de dépense d’organisation/espace de travail sont classées comme `rate_limit` lorsque le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` ou `organization spending limit exceeded`). Elles restent sur le chemin de court temps de recharge/basculement au lieu du long chemin de désactivation de facturation.
</Note>

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

Valeurs par défaut :

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation et est limité à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives en cas de surcharge autorisent **1 rotation de profil chez le même fournisseur** avant le repli de modèle.
- Les nouvelles tentatives en cas de surcharge utilisent **0 ms de backoff** par défaut.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans `agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux expirations de délai qui ont épuisé la rotation des profils (les autres erreurs ne font pas avancer le repli). Les erreurs de fournisseur qui n’exposent pas assez de détails restent étiquetées précisément dans l’état de repli : `empty_response` signifie que le fournisseur n’a renvoyé aucun message ou statut exploitable, `no_error_details` signifie que le fournisseur a explicitement renvoyé `Unknown error (no error details in response)`, et `unclassified` signifie qu’OpenClaw a conservé l’aperçu brut, mais qu’aucun classificateur ne l’a encore reconnu.

Les erreurs de surcharge et de limite de débit sont traitées plus agressivement que les temps de recharge de facturation. Par défaut, OpenClaw autorise une nouvelle tentative de profil d’authentification chez le même fournisseur, puis passe au prochain repli de modèle configuré sans attendre. Les signaux de fournisseur occupé comme `ModelNotReadyException` entrent dans ce groupe de surcharge. Ajustez cela avec `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` et `auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution démarre depuis le modèle principal par défaut configuré, un modèle principal de tâche Cron, un modèle principal d’agent avec replis explicites ou une dérogation de repli sélectionnée automatiquement, OpenClaw peut parcourir la chaîne de replis configurée correspondante. Les modèles principaux d’agent sans replis explicites et les sélections utilisateur explicites (par exemple `/model ollama/qwen3.5:27b`, le sélecteur de modèle, `sessions.patch` ou les dérogations ponctuelles CLI de fournisseur/modèle) sont stricts : si ce fournisseur/modèle est injoignable ou échoue avant de produire une réponse, OpenClaw signale l’échec au lieu de répondre depuis un repli sans rapport.

### Règles de chaîne de candidats

OpenClaw construit la liste des candidats à partir du `provider/model` actuellement demandé, plus les replis configurés.

<AccordionGroup>
  <Accordion title="Règles">
    - Le modèle demandé est toujours en premier.
    - Les replis configurés explicites sont dédupliqués, mais pas filtrés par la liste d’autorisation des modèles. Ils sont traités comme une intention explicite de l’opérateur.
    - Si l’exécution actuelle est déjà sur un repli configuré dans la même famille de fournisseurs, OpenClaw continue à utiliser toute la chaîne configurée.
    - Lorsqu’aucune dérogation de repli explicite n’est fournie, les replis configurés sont essayés avant le modèle principal configuré, même si le modèle demandé utilise un autre fournisseur.
    - Lorsqu’aucune dérogation de repli explicite n’est fournie au runner de repli, le modèle principal configuré est ajouté à la fin afin que la chaîne puisse revenir à la valeur par défaut normale une fois les candidats précédents épuisés.
    - Lorsqu’un appelant fournit `fallbacksOverride`, le runner utilise exactement le modèle demandé plus cette liste de dérogation. Une liste vide désactive le repli de modèle et empêche l’ajout du modèle principal configuré comme cible de nouvelle tentative masquée.

  </Accordion>
</AccordionGroup>

### Quelles erreurs font avancer le repli

<Tabs>
  <Tab title="Continue sur">
    - échecs d’authentification
    - limites de débit et épuisement du temps de recharge
    - erreurs de surcharge/fournisseur occupé
    - erreurs de basculement sous forme d’expiration de délai
    - désactivations de facturation
    - `LiveSessionModelSwitchError`, qui est normalisée en chemin de basculement afin qu’un modèle persistant obsolète ne crée pas de boucle de nouvelle tentative externe
    - autres erreurs non reconnues lorsqu’il reste encore des candidats

  </Tab>
  <Tab title="Ne continue pas sur">
    - interruptions explicites qui ne sont pas sous forme d’expiration de délai/basculement
    - erreurs de dépassement de contexte qui doivent rester dans la logique de Compaction/nouvelle tentative (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` ou `ollama error: context length exceeded`)
    - une dernière erreur inconnue lorsqu’il ne reste plus aucun candidat

  </Tab>
</Tabs>

### Comportement de saut de temps de recharge ou de sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en temps de recharge, OpenClaw ne saute pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

<AccordionGroup>
  <Accordion title="Décisions par candidat">
    - Les échecs d’authentification persistants sautent immédiatement tout le fournisseur.
    - Les désactivations de facturation sautent généralement, mais le candidat principal peut encore être sondé avec limitation afin que la récupération soit possible sans redémarrage.
    - Le candidat principal peut être sondé près de l’expiration du temps de recharge, avec une limitation par fournisseur.
    - Les replis frères chez le même fournisseur peuvent être tentés malgré le temps de recharge lorsque l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). C’est particulièrement pertinent lorsqu’une limite de débit est propre à un modèle et qu’un modèle frère peut encore récupérer immédiatement.
    - Les sondes de temps de recharge transitoires sont limitées à une par fournisseur et par exécution de repli afin qu’un seul fournisseur ne bloque pas le repli inter-fournisseurs.

  </Accordion>
</AccordionGroup>

## Dérogations de session et changement de modèle en direct

Les changements de modèle de session sont un état partagé. Le runner actif, la commande `/model`, les mises à jour de Compaction/session et la réconciliation de session en direct lisent ou écrivent toutes des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en direct :

- Seuls les changements de modèle explicitement pilotés par l’utilisateur marquent un changement en direct en attente. Cela inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle pilotés par le système, comme la rotation de repli, les dérogations Heartbeat ou la Compaction, ne marquent jamais eux-mêmes un changement en direct en attente.
- Les dérogations de modèle pilotées par l’utilisateur sont traitées comme des sélections exactes pour la politique de repli ; un fournisseur sélectionné injoignable est donc signalé comme un échec au lieu d’être masqué par `agents.defaults.model.fallbacks`.
- Avant qu’une nouvelle tentative de repli démarre, le runner de réponse persiste les champs de dérogation de repli sélectionnés dans l’entrée de session.
- Les dérogations de repli automatique restent sélectionnées lors des tours suivants afin qu’OpenClaw ne sonde pas un modèle principal connu comme défaillant à chaque message. OpenClaw sonde périodiquement à nouveau l’origine configurée et efface la dérogation automatique lorsqu’elle récupère ; `/new`, `/reset` et `sessions.reset` effacent immédiatement les dérogations issues de l’automatisation.
- Les réponses utilisateur annoncent les transitions de repli et la récupération après effacement du repli une fois par changement d’état. Les tours de repli persistants ne répètent pas l’avis.
- `/status` affiche le modèle sélectionné et, lorsque l’état de repli diffère, le modèle de repli actif et la raison.
- La réconciliation de session en direct préfère les dérogations de session persistées aux champs de modèle d’exécution obsolètes.
- Si une erreur de changement en direct pointe vers un candidat ultérieur dans la chaîne de repli active, OpenClaw saute directement vers ce modèle sélectionné au lieu de parcourir d’abord des candidats sans rapport.
- Si la tentative de repli échoue, le runner annule uniquement les champs de dérogation qu’il a écrits, et seulement s’ils correspondent encore à ce candidat échoué.

Cela empêche la course classique :

<Steps>
  <Step title="Le modèle principal échoue">
    Le modèle principal sélectionné échoue.
  </Step>
  <Step title="Le repli est choisi en mémoire">
    Le candidat de repli est choisi en mémoire.
  </Step>
  <Step title="Le magasin de session indique encore l’ancien modèle principal">
    Le magasin de session reflète encore l’ancien modèle principal.
  </Step>
  <Step title="La réconciliation en direct lit un état obsolète">
    La réconciliation de session en direct lit l’état de session obsolète.
  </Step>
  <Step title="La nouvelle tentative revient en arrière">
    La nouvelle tentative est ramenée à l’ancien modèle avant le début de la tentative de repli.
  </Step>
</Steps>

La dérogation de repli persistée ferme cette fenêtre, et l’annulation limitée conserve intactes les modifications de session manuelles ou d’exécution plus récentes.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre les détails par tentative qui alimentent les journaux et les messages de temps de recharge destinés à l’utilisateur :

- fournisseur/modèle tenté
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` et raisons de basculement similaires)
- statut/code facultatif
- résumé d’erreur lisible par l’humain

Les journaux structurés `model_fallback_decision` incluent aussi des champs plats `fallbackStep*` lorsqu’un candidat échoue, est sauté ou qu’un repli ultérieur réussit. Ces champs rendent explicite la transition tentée (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) afin que les exportateurs de journaux et de diagnostics puissent reconstruire l’échec du modèle principal même lorsque le repli terminal échoue aussi.

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. Le runner de réponse externe peut l’utiliser pour construire un message plus spécifique comme « tous les modèles sont temporairement limités en débit » et inclure l’expiration de temps de recharge la plus proche lorsqu’elle est connue.

Ce résumé de temps de recharge tient compte des modèles :

- les limites de débit propres à des modèles sans rapport sont ignorées pour la chaîne fournisseur/modèle tentée
- si le blocage restant est une limite de débit propre à un modèle correspondant, OpenClaw signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Consultez [Configuration Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- routage `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routage `agents.defaults.imageModel`

Consultez [Modèles](/fr/concepts/models) pour une vue d’ensemble plus large de la sélection des modèles et du fallback.
