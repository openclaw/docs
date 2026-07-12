---
read_when:
    - Vous souhaitez utiliser la génération de vidéos Alibaba Wan dans OpenClaw
    - Vous devez configurer une clé API Model Studio ou DashScope pour la génération de vidéos
summary: Génération de vidéos avec Alibaba Model Studio Wan dans OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T03:13:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Le Plugin `alibaba` intégré enregistre un fournisseur de génération vidéo pour les modèles Wan sur Alibaba Model Studio (nom international de DashScope). Il est activé par défaut ; seule une clé d’API est nécessaire.

| Propriété                    | Valeur                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Identifiant du fournisseur   | `alibaba`                                                                       |
| Plugin                       | intégré, `enabledByDefault: true`                                                |
| Variables d’environnement d’authentification | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (la première correspondance l’emporte) |
| Option d’intégration         | `--auth-choice alibaba-model-studio-api-key`                                    |
| Option CLI directe           | `--alibaba-model-studio-api-key <key>`                                          |
| Modèle par défaut            | `alibaba/wan2.6-t2v`                                                            |
| URL de base par défaut       | `https://dashscope-intl.aliyuncs.com`                                           |

## Prise en main

<Steps>
  <Step title="Définir une clé d’API">
    Enregistrez la clé pour le fournisseur `alibaba` lors de l’intégration :

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Vous pouvez également transmettre directement la clé :

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Ou exportez l’une des variables d’environnement acceptées avant de démarrer le Gateway :

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # ou DASHSCOPE_API_KEY=...
    # ou QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Définir un modèle vidéo par défaut">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Vérifier que le fournisseur est configuré">
    ```bash
    openclaw models list --provider alibaba
    ```

    La liste comprend les cinq modèles Wan intégrés. Si `MODELSTUDIO_API_KEY` ne peut pas être résolue, `openclaw models status --json` signale l’identifiant d’authentification manquant sous `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Le Plugin Alibaba et le [Plugin Qwen](/fr/providers/qwen) s’authentifient tous deux auprès de DashScope et acceptent des variables d’environnement communes. Utilisez les identifiants de modèle `alibaba/...` pour l’interface vidéo Wan dédiée ; utilisez les identifiants `qwen/...` pour la discussion, les plongements ou la compréhension multimédia de Qwen.
</Note>

## Modèles Wan intégrés

| Référence du modèle          | Mode                              |
| ---------------------------- | --------------------------------- |
| `alibaba/wan2.6-t2v`         | Texte vers vidéo (par défaut)     |
| `alibaba/wan2.6-i2v`         | Image vers vidéo                  |
| `alibaba/wan2.6-r2v`         | Référence vers vidéo              |
| `alibaba/wan2.6-r2v-flash`   | Référence vers vidéo (rapide)     |
| `alibaba/wan2.7-r2v`         | Référence vers vidéo              |

## Fonctionnalités et limites

Les trois modes partagent la même limite de nombre de vidéos et de durée par requête ; seule la structure des entrées diffère.

| Mode                    | Nombre maximal de vidéos en sortie | Nombre maximal d’images en entrée | Nombre maximal de vidéos en entrée | Durée maximale | Paramètres pris en charge                                  |
| ----------------------- | ---------------------------------- | --------------------------------- | --------------------------------- | --------------- | ---------------------------------------------------------- |
| Texte vers vidéo        | 1                                  | s.o.                              | s.o.                              | 10 s            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`  |
| Image vers vidéo        | 1                                  | 1                                 | s.o.                              | 10 s            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`  |
| Référence vers vidéo    | 1                                  | s.o.                              | 4                                 | 10 s            | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`  |

Une requête qui omet `durationSeconds` utilise la valeur par défaut acceptée par DashScope, soit **5 secondes**. Définissez explicitement `durationSeconds` dans l’[outil de génération vidéo](/fr/tools/video-generation) pour prolonger la durée jusqu’à 10 s.

<Warning>
  Les images et vidéos de référence doivent être des URL `http(s)` distantes ; les modes de référence de DashScope rejettent les chemins de fichiers locaux. Téléversez-les d’abord vers un stockage d’objets, ou utilisez le processus de l’[outil multimédia](/fr/tools/media-overview), qui génère déjà une URL publique.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Remplacer l’URL de base de DashScope">
    Le fournisseur utilise par défaut le point de terminaison international de DashScope. Pour cibler le point de terminaison de la région Chine :

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Le fournisseur supprime les barres obliques finales avant de construire les URL des tâches AIGC.

  </Accordion>

  <Accordion title="Priorité des variables d’environnement d’authentification">
    OpenClaw résout la clé d’API Alibaba à partir des variables d’environnement dans l’ordre suivant, en utilisant la première valeur non vide :

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Les entrées `auth.profiles` configurées (définies avec `openclaw models auth login`) remplacent la résolution des variables d’environnement. Consultez les [profils d’authentification dans la FAQ sur les modèles](/fr/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) pour en savoir plus sur la rotation des profils, les délais de récupération et les mécanismes de remplacement.

  </Accordion>

  <Accordion title="Relation avec le Plugin Qwen">
    Les deux Plugins intégrés communiquent avec DashScope et acceptent des clés d’API communes. Utilisez :

    - les identifiants `alibaba/wan*.*` pour le fournisseur vidéo Wan dédié décrit sur cette page ;
    - les identifiants `qwen/*` pour la discussion, les plongements et la compréhension multimédia de Qwen (voir [Qwen](/fr/providers/qwen)).

    La définition unique de `MODELSTUDIO_API_KEY` authentifie les deux Plugins, car la liste des variables d’environnement d’authentification se chevauche intentionnellement ; il n’est pas nécessaire d’intégrer chaque Plugin séparément.

  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres communs de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Qwen" href="/fr/providers/qwen" icon="microchip">
    Configuration de la discussion, des plongements et de la compréhension multimédia de Qwen avec la même authentification DashScope.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
  <Card title="FAQ sur les modèles" href="/fr/help/faq-models" icon="circle-question">
    Profils d’authentification, changement de modèle et résolution des erreurs « aucun profil ».
  </Card>
</CardGroup>
