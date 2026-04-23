---
read_when:
    - Mise à jour du comportement ou des valeurs par défaut de nouvelle tentative du fournisseur
    - Débogage des erreurs d’envoi du fournisseur ou des limites de débit
summary: Politique de nouvelle tentative pour les appels sortants au fournisseur
title: Politique de nouvelle tentative
x-i18n:
    generated_at: "2026-04-23T07:02:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Politique de nouvelle tentative

## Objectifs

- Réessayer par requête HTTP, pas par flux multi-étapes.
- Préserver l’ordre en ne réessayant que l’étape en cours.
- Éviter de dupliquer des opérations non idempotentes.

## Valeurs par défaut

- Tentatives : 3
- Plafond maximal de délai : 30000 ms
- Jitter : 0.1 (10 pour cent)
- Valeurs par défaut par fournisseur :
  - délai minimal Telegram : 400 ms
  - délai minimal Discord : 500 ms

## Comportement

### Fournisseurs de modèles

- OpenClaw laisse les SDK fournisseur gérer les nouvelles tentatives courtes normales.
- Pour les SDK basés sur Stainless tels qu’Anthropic et OpenAI, les réponses réessayables
  (`408`, `409`, `429` et `5xx`) peuvent inclure `retry-after-ms` ou
  `retry-after`. Lorsque cette attente dépasse 60 secondes, OpenClaw injecte
  `x-should-retry: false` afin que le SDK fasse remonter immédiatement l’erreur et que le
  basculement de modèle puisse passer à un autre profil d’authentification ou modèle de repli.
- Remplacez ce plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Définissez-le sur `0`, `false`, `off`, `none` ou `disabled` pour laisser les SDK honorer en interne
  les attentes longues `Retry-After`.

### Discord

- Réessaie uniquement sur les erreurs de limite de débit (HTTP 429).
- Utilise `retry_after` de Discord lorsque disponible, sinon un backoff exponentiel.

### Telegram

- Réessaie sur les erreurs transitoires (429, timeout, connect/reset/closed, temporairement indisponible).
- Utilise `retry_after` lorsque disponible, sinon un backoff exponentiel.
- Les erreurs d’analyse Markdown ne sont pas réessayées ; elles basculent en texte brut.

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

## Remarques

- Les nouvelles tentatives s’appliquent par requête (envoi de message, téléversement de média, réaction, sondage, sticker).
- Les flux composites ne réessaient pas les étapes déjà terminées.
