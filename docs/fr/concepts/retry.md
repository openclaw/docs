---
read_when:
    - Mise à jour du comportement ou des valeurs par défaut des nouvelles tentatives du fournisseur
    - Débogage des erreurs d’envoi du fournisseur ou des limitations de débit
summary: Politique de nouvelle tentative pour les appels sortants aux fournisseurs
title: Politique de nouvelle tentative
x-i18n:
    generated_at: "2026-07-12T02:36:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be2bcb5af829b90042bfcbc5c0e5f5cc5a3cb03dd5472737c80fa0f15803361
    source_path: concepts/retry.md
    workflow: 16
---

## Objectifs

- Réessayer chaque requête HTTP, et non chaque flux à plusieurs étapes.
- Préserver l’ordre en ne réessayant que l’étape en cours.
- Éviter de dupliquer les opérations non idempotentes.

## Valeurs par défaut

| Paramètre               | Valeur par défaut |
| ----------------------- | ----------------- |
| Tentatives              | 3                 |
| Délai maximal           | 30000 ms          |
| Gigue                   | 0.1 (10 %)        |
| Délai minimal Telegram  | 400 ms            |
| Délai minimal Discord   | 500 ms            |

## Comportement

### Fournisseurs de modèles

- OpenClaw laisse les SDK des fournisseurs gérer les nouvelles tentatives courtes habituelles.
- Pour les SDK fondés sur Stainless, tels que ceux d’Anthropic et d’OpenAI, les réponses pouvant faire l’objet d’une nouvelle tentative (`408`, `409`, `429` et `5xx`) peuvent inclure `retry-after-ms` ou `retry-after`. Lorsque ce délai dépasse 60 secondes, OpenClaw injecte `x-should-retry: false` afin que le SDK signale immédiatement l’erreur et que le basculement de modèle puisse passer à un autre profil d’authentification ou modèle de secours.
- Modifiez cette limite avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`. Définissez-la sur `0`, `false`, `off`, `none` ou `disabled` pour permettre aux SDK de respecter en interne les longues attentes indiquées par `Retry-After`.

### Discord

- Effectue de nouvelles tentatives en cas d’erreur de limitation du débit (HTTP 429), d’expiration de requête, de réponse HTTP 5xx et de défaillance transitoire du transport, comme les échecs de résolution DNS, les réinitialisations de connexion, les fermetures de socket et les échecs de récupération.
- Utilise la valeur Discord `retry_after` lorsqu’elle est disponible, sinon un délai exponentiel.

### Telegram

- Effectue de nouvelles tentatives en cas d’erreur transitoire (429, expiration, connexion/réinitialisation/fermeture, indisponibilité temporaire).
- Utilise `retry_after` lorsqu’il est disponible, sinon un délai exponentiel.
- Les erreurs d’analyse HTML/Markdown ne font pas l’objet d’une nouvelle tentative ; le système utilise du texte brut dès la première tentative.

## Configuration

Définissez la politique de nouvelles tentatives pour chaque fournisseur dans `~/.openclaw/openclaw.json` :

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Remarques

- Les nouvelles tentatives s’appliquent à chaque requête (envoi de message, téléversement de média, réaction, sondage, autocollant).
- Les flux composites ne réessaient pas les étapes terminées.

## Voir aussi

- [Basculement de modèle](/fr/concepts/model-failover)
- [File d’attente des commandes](/fr/concepts/queue)
