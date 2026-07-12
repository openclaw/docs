---
read_when:
    - Vous souhaitez utiliser Gradium pour la synthèse vocale
    - Vous devez configurer une clé API Gradium, une voix ou un jeton de directive
summary: Utiliser la synthèse vocale de Gradium dans OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-12T15:52:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) est un fournisseur de synthèse vocale pour OpenClaw. Il produit des réponses audio standard (WAV), une sortie Opus compatible avec les messages vocaux et un flux audio u-law à 8 kHz pour les interfaces de téléphonie.

| Propriété            | Valeur                               |
| -------------------- | ------------------------------------ |
| Identifiant du fournisseur | `gradium`                      |
| Authentification     | `GRADIUM_API_KEY` ou configuration `apiKey` |
| URL de base          | `https://api.gradium.ai` (par défaut) |
| Voix par défaut      | `Emma` (`YTpq7expH9539ERJ`)          |

## Installer le plugin

Gradium est un plugin externe officiel. Installez-le, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configuration initiale

Créez une clé API Gradium, puis exposez-la au moyen d’une variable d’environnement ou de la clé de configuration. La configuration est prioritaire sur la variable d’environnement.

<Tabs>
  <Tab title="Variable d’environnement">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Clé de configuration">
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

## Configuration

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

| Clé                                             | Type   | Description                                                                                                            |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | chaîne | Clé API résolue. Prend en charge `${ENV}` et les références de secrets.                                                |
| `messages.tts.providers.gradium.baseUrl`        | chaîne | URL HTTPS de l’API Gradium sur `api.gradium.ai`. Les barres obliques finales sont supprimées. Valeur par défaut : `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | chaîne | Identifiant de voix par défaut utilisé lorsqu’aucune directive de remplacement n’est présente.                         |

Le format de sortie est choisi automatiquement selon l’interface cible (voir [Sortie](#output)) et n’est pas configurable dans `openclaw.json`.

## Voix

| Nom                | Identifiant de voix |
| ------------------ | ------------------- |
| Arthur             | `3jUdJyOi9pgbxBTK`  |
| Christina          | `2H4HY2CBNyJHBCrP`  |
| Emma **(par défaut)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR`  |
| Kent               | `LFZvm12tW_z0xfGo`  |
| Sydney             | `jtEKaLYNn6iif5PR`  |
| Tiffany            | `Eu9iL_CYe8N-Gkx_`  |

### Remplacement de la voix par message

Lorsque la politique de synthèse vocale active autorise le remplacement de la voix, changez de voix directement dans le message à l’aide d’un jeton de directive (toutes les formes suivantes sont équivalentes et acceptent un identifiant de voix natif du fournisseur) :

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Si la politique de synthèse vocale désactive le remplacement de la voix, la directive est consommée, mais ignorée.

## Sortie

Le format de sortie est sélectionné selon l’interface cible ; le fournisseur ne synthétise pas d’autres formats.

| Cible          | Format      | Extension de fichier | Fréquence d’échantillonnage | Indicateur de compatibilité vocale |
| -------------- | ----------- | -------------------- | --------------------------- | ---------------------------------- |
| Audio standard | `wav`       | `.wav`               | fournisseur                 | non                                |
| Message vocal  | `opus`      | `.opus`              | fournisseur                 | oui                                |
| Téléphonie     | `ulaw_8000` | s.o.                 | 8 kHz                       | s.o.                               |

## Ordre de sélection automatique

Parmi les fournisseurs de synthèse vocale configurés, l’ordre de sélection automatique de Gradium est `30`. Consultez [Synthèse vocale](/fr/tools/tts) pour savoir comment OpenClaw choisit le fournisseur actif lorsque `messages.tts.provider` n’est pas défini explicitement.

## Pages connexes

- [Synthèse vocale](/fr/tools/tts)
- [Présentation des médias](/fr/tools/media-overview)
