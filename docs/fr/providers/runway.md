---
read_when:
    - Vous souhaitez utiliser la génération de vidéos Runway dans OpenClaw
    - Vous devez configurer la clé API et les variables d’environnement de Runway
    - Vous souhaitez définir Runway comme fournisseur vidéo par défaut
summary: Configuration de la génération vidéo Runway dans OpenClaw
title: Piste
x-i18n:
    generated_at: "2026-05-06T07:36:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw inclut un fournisseur `runway` groupé pour la génération de vidéos hébergée. Le Plugin est activé par défaut et enregistre le fournisseur `runway` avec le contrat `videoGenerationProviders`.

| Propriété                 | Valeur                                                            |
| ------------------------- | ----------------------------------------------------------------- |
| ID du fournisseur         | `runway`                                                          |
| Plugin                    | groupé, `enabledByDefault: true`                                  |
| Variables d’environnement d’authentification | `RUNWAYML_API_SECRET` (canonique) ou `RUNWAY_API_KEY` |
| Option d’intégration      | `--auth-choice runway-api-key`                                    |
| Option CLI directe        | `--runway-api-key <key>`                                          |
| API                       | Génération de vidéos Runway basée sur des tâches (interrogation `GET /v1/tasks/{id}`) |
| Modèle par défaut         | `runway/gen4.5`                                                   |

## Démarrage

<Steps>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Définir Runway comme fournisseur vidéo par défaut">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Générer une vidéo">
    Demandez à l’agent de générer une vidéo. Runway sera utilisé automatiquement.
  </Step>
</Steps>

## Modes et modèles pris en charge

Le fournisseur expose sept modèles Runway répartis entre trois modes. Le même ID de modèle peut servir plusieurs modes (par exemple, `gen4.5` fonctionne à la fois pour le texte-vers-vidéo et l’image-vers-vidéo).

| Mode           | Modèles                                                               | Entrée de référence     |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| Texte-vers-vidéo | `gen4.5` (par défaut), `veo3.1`, `veo3.1_fast`, `veo3`              | Aucune                  |
| Image-vers-vidéo | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 image locale ou distante |
| Vidéo-vers-vidéo | `gen4_aleph`                                                        | 1 vidéo locale ou distante |

Les références locales à des images et vidéos sont prises en charge via des URI de données.

| Rapports d’aspect       | Valeurs autorisées                          |
| ----------------------- | ------------------------------------------- |
| Texte-vers-vidéo        | `16:9`, `9:16`                              |
| Modifications d’images et de vidéos | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  La vidéo-vers-vidéo nécessite actuellement `runway/gen4_aleph`. Les autres ID de modèles Runway rejettent les entrées de référence vidéo.
</Warning>

<Note>
  Choisir un ID de modèle Runway dans la mauvaise colonne produit une erreur explicite avant que la requête API ne quitte OpenClaw. Le fournisseur valide `model` par rapport à la liste autorisée du mode (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) dans `extensions/runway/video-generation-provider.ts`.
</Note>

## Configuration

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Alias de variables d’environnement">
    OpenClaw reconnaît à la fois `RUNWAYML_API_SECRET` (canonique) et `RUNWAY_API_KEY`.
    L’une ou l’autre variable authentifiera le fournisseur Runway.
  </Accordion>

  <Accordion title="Interrogation des tâches">
    Runway utilise une API basée sur des tâches. Après l’envoi d’une demande de génération, OpenClaw
    interroge `GET /v1/tasks/{id}` jusqu’à ce que la vidéo soit prête. Aucune configuration
    supplémentaire n’est nécessaire pour le comportement d’interrogation.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil partagés, sélection du fournisseur et comportement asynchrone.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Paramètres par défaut de l’agent, y compris le modèle de génération vidéo.
  </Card>
</CardGroup>
