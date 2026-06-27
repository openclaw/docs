---
read_when:
    - Vous souhaitez Gradium pour la synthèse vocale
    - Vous devez configurer une clé API, une voix ou un jeton de directive Gradium
summary: Utiliser la synthèse vocale Gradium dans OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:04:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) est un fournisseur de synthèse vocale pour OpenClaw. Le plugin peut produire des réponses audio normales (WAV), une sortie Opus compatible avec les notes vocales, et de l’audio u-law à 8 kHz pour les surfaces de téléphonie.

| Propriété      | Valeur                               |
| -------------- | ------------------------------------ |
| ID du fournisseur | `gradium`                         |
| Authentification | `GRADIUM_API_KEY` ou config `apiKey` |
| URL de base    | `https://api.gradium.ai` (par défaut) |
| Voix par défaut | `Emma` (`YTpq7expH9539ERJ`)         |

## Installer le plugin

Installez le plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configuration

Créez une clé d’API Gradium, puis exposez-la à OpenClaw avec une variable d’environnement ou la clé de configuration.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Le plugin vérifie d’abord l’`apiKey` résolue et se rabat sur la variable d’environnement `GRADIUM_API_KEY`.

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Clé                                             | Type   | Description                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Clé d’API résolue. Prend en charge `${ENV}` et les références de secrets.                     |
| `messages.tts.providers.gradium.baseUrl`        | string | Remplace l’origine de l’API. Les barres obliques finales sont supprimées. Par défaut : `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID de voix par défaut utilisé quand aucune directive de remplacement n’est présente.          |

Le format audio de sortie est sélectionné automatiquement par le runtime en fonction de la surface cible et n’est pas configurable depuis `openclaw.json`. Voir [Sortie](#output) ci-dessous.

## Voix

| Nom       | ID de voix          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Voix par défaut : Emma.

### Remplacement de la voix par message

Quand la politique de synthèse vocale active autorise les remplacements de voix, vous pouvez changer de voix en ligne avec un jeton de directive. Utilisez `speakerVoiceId` pour les ID de voix natifs du fournisseur.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Si la politique de synthèse vocale désactive les remplacements de voix, la directive est consommée mais ignorée.

## Sortie

Le runtime choisit le format de sortie à partir de la surface cible. Le fournisseur ne synthétise pas d’autres formats aujourd’hui.

| Cible          | Format      | Extension de fichier | Fréquence d’échantillonnage | Indicateur compatible voix |
| -------------- | ----------- | -------------------- | --------------------------- | -------------------------- |
| Audio standard | `wav`       | `.wav`               | fournisseur                 | non                        |
| Note vocale    | `opus`      | `.opus`              | fournisseur                 | oui                        |
| Téléphonie     | `ulaw_8000` | n/a                  | 8 kHz                       | n/a                        |

## Ordre de sélection automatique

Parmi les fournisseurs TTS configurés, l’ordre de sélection automatique de Gradium est `30`. Voir [Synthèse vocale](/fr/tools/tts) pour savoir comment OpenClaw choisit le fournisseur actif lorsque `messages.tts.provider` n’est pas défini explicitement.

## Associés

- [Synthèse vocale](/fr/tools/tts)
- [Vue d’ensemble des médias](/fr/tools/media-overview)
