---
read_when:
    - Mise à jour du comportement de nouvelle tentative ou des valeurs par défaut du fournisseur
    - Débogage des erreurs d’envoi du fournisseur ou des limites de débit
summary: Politique de nouvelle tentative pour les appels sortants vers les fournisseurs
title: Politique de nouvelle tentative
x-i18n:
    generated_at: "2026-05-02T07:05:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7720092499effdfa011fc0a0310adb2ecddca9e94f57f749794eab1c9ab4c922
    source_path: concepts/retry.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Objectifs

- Réessayer par requête HTTP, et non par flux en plusieurs étapes.
- Préserver l’ordre en réessayant uniquement l’étape en cours.
- Éviter de dupliquer les opérations non idempotentes.

## Valeurs par défaut

- Tentatives : 3
- Plafond du délai maximal : 30000 ms
- Gigue : 0,1 (10 pour cent)
- Valeurs par défaut des fournisseurs :
  - Délai minimal Telegram : 400 ms
  - Délai minimal Discord : 500 ms

## Comportement

### Fournisseurs de modèles

- OpenClaw laisse les SDK des fournisseurs gérer les nouvelles tentatives courtes normales.
- Pour les SDK basés sur Stainless, tels qu’Anthropic et OpenAI, les réponses réessayables
  (`408`, `409`, `429` et `5xx`) peuvent inclure `retry-after-ms` ou
  `retry-after`. Lorsque cette attente dépasse 60 secondes, OpenClaw injecte
  `x-should-retry: false` afin que le SDK remonte immédiatement l’erreur et que le basculement
  de modèle puisse passer à un autre profil d’authentification ou modèle de secours.
- Remplacez le plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Définissez-le sur `0`, `false`, `off`, `none` ou `disabled` pour laisser les SDK respecter en interne les longues
  pauses `Retry-After`.

### Discord

- Réessaie en cas d’erreurs de limite de débit (HTTP 429), d’expirations de requête, de réponses HTTP 5xx
  et d’échecs de transport transitoires tels que les échecs de résolution DNS, les réinitialisations de
  connexion, les fermetures de socket et les échecs de récupération.
- Utilise le `retry_after` de Discord lorsqu’il est disponible, sinon un backoff exponentiel.

### Telegram

- Réessaie en cas d’erreurs transitoires (429, expiration, connexion/réinitialisation/fermeture, indisponibilité temporaire).
- Utilise `retry_after` lorsqu’il est disponible, sinon un backoff exponentiel.
- Les erreurs d’analyse Markdown ne sont pas réessayées ; elles basculent vers du texte brut.

## Configuration

Définissez la politique de nouvelle tentative par fournisseur dans `~/.openclaw/openclaw.json` :

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

## Notes

- Les nouvelles tentatives s’appliquent par requête (envoi de message, téléversement de média, réaction, sondage, sticker).
- Les flux composites ne réessaient pas les étapes terminées.

## Connexe

- [Basculement de modèle](/fr/concepts/model-failover)
- [File d’attente des commandes](/fr/concepts/queue)
