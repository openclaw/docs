---
read_when:
    - Vous souhaitez utiliser Gradium pour la synthèse vocale
    - Vous avez besoin d’une clé API Gradium ou d’une configuration de voix
summary: Utilisez la synthèse vocale Gradium dans OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium est un fournisseur de synthèse vocale intégré pour OpenClaw. Il peut générer des réponses audio normales, une sortie Opus compatible avec les notes vocales, et de l’audio u-law 8 kHz pour les surfaces de téléphonie.

## Configuration

Créez une clé API Gradium, puis exposez-la à OpenClaw :

```bash
export GRADIUM_API_KEY="gsk_..."
```

Vous pouvez également stocker la clé dans la config sous `messages.tts.providers.gradium.apiKey`.

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## Voix

| Nom       | ID de voix         |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Voix par défaut : Emma.

## Sortie

- Les réponses sous forme de fichier audio utilisent WAV.
- Les réponses sous forme de note vocale utilisent Opus et sont marquées comme compatibles note vocale.
- La synthèse pour la téléphonie utilise `ulaw_8000` à 8 kHz.

## Liens connexes

- [Synthèse vocale](/fr/tools/tts)
- [Vue d’ensemble des médias](/fr/tools/media-overview)
