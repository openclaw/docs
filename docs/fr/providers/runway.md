---
read_when:
    - Vous souhaitez utiliser la génération de vidéos Runway dans OpenClaw
    - Vous devez configurer la clé API et la variable d’environnement de Runway.
    - Vous souhaitez faire de Runway le fournisseur vidéo par défaut
summary: Configuration de la génération de vidéos Runway dans OpenClaw
title: Piste de décollage
x-i18n:
    generated_at: "2026-07-12T03:01:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw fournit un fournisseur `runway` intégré pour la génération de vidéos hébergée, activé par défaut et enregistré selon le contrat `videoGenerationProviders`.

| Propriété                         | Valeur                                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| Identifiant du fournisseur        | `runway`                                                                |
| Plugin                            | intégré, `enabledByDefault: true`                                       |
| Variables d’environnement d’auth. | `RUNWAYML_API_SECRET` (canonique) ou `RUNWAY_API_KEY`                    |
| Option d’intégration              | `--auth-choice runway-api-key`                                          |
| Option CLI directe                | `--runway-api-key <key>`                                                 |
| API                               | Génération de vidéos par tâches de Runway (interrogation de `GET /v1/tasks/{id}`) |
| Modèle par défaut                 | `runway/gen4.5`                                                         |

## Prise en main

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

Le fournisseur expose sept modèles Runway répartis entre trois modes. Un même identifiant de modèle peut servir dans plusieurs modes (par exemple, `gen4.5` fonctionne à la fois pour la génération de texte en vidéo et d’image en vidéo).

| Mode                    | Modèles                                                                | Entrée de référence            |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| Texte en vidéo          | `gen4.5` (par défaut), `veo3.1`, `veo3.1_fast`, `veo3`                 | Aucune                         |
| Image en vidéo          | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 image locale ou distante     |
| Vidéo en vidéo          | `gen4_aleph`                                                           | 1 vidéo locale ou distante     |

Les références locales d’images et de vidéos sont prises en charge au moyen d’URI de données.

| Formats d’image                         | Valeurs autorisées                          |
| --------------------------------------- | ------------------------------------------- |
| Texte en vidéo                          | `16:9`, `9:16`                              |
| Modifications d’images et de vidéos     | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  La génération de vidéo en vidéo nécessite actuellement `runway/gen4_aleph`. Les autres identifiants de modèles Runway refusent les entrées de référence vidéo.
</Warning>

<Note>
  La sélection d’un identifiant de modèle Runway dans la mauvaise colonne produit une erreur explicite avant que la requête API ne quitte OpenClaw. Le fournisseur valide `model` par rapport à la liste d’autorisation du mode (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) dans `extensions/runway/video-generation-provider.ts`.
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
  <Accordion title="Alias des variables d’environnement">
    OpenClaw reconnaît à la fois `RUNWAYML_API_SECRET` (canonique) et `RUNWAY_API_KEY`.
    Chacune de ces variables permet d’authentifier le fournisseur Runway.
  </Accordion>

  <Accordion title="Interrogation des tâches">
    Runway utilise une API basée sur des tâches. Après l’envoi d’une demande de génération, OpenClaw
    interroge `GET /v1/tasks/{id}` jusqu’à ce que la vidéo soit prête. Aucune
    configuration supplémentaire n’est nécessaire pour ce mécanisme d’interrogation.
  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres d’outil partagés, sélection du fournisseur et comportement asynchrone.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Paramètres par défaut de l’agent, notamment le modèle de génération de vidéos.
  </Card>
</CardGroup>
