---
read_when:
    - Vous souhaitez utiliser la génération de vidéos Alibaba Wan dans OpenClaw
    - Vous devez configurer une clé API Model Studio ou DashScope pour la génération de vidéos
summary: Génération de vidéos Alibaba Model Studio Wan dans OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T07:34:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw inclut un plugin `alibaba` intégré qui enregistre un fournisseur de génération vidéo pour les modèles Wan sur Alibaba Model Studio (le nom international de DashScope). Le plugin est activé par défaut ; vous devez seulement définir une clé API.

| Propriété        | Valeur                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| ID du fournisseur | `alibaba`                                                                       |
| Plugin           | intégré, `enabledByDefault: true`                                               |
| Variables d’environnement d’auth | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (la première correspondance l’emporte) |
| Indicateur d’onboarding | `--auth-choice alibaba-model-studio-api-key`                                    |
| Indicateur CLI direct | `--alibaba-model-studio-api-key <key>`                                          |
| Modèle par défaut | `alibaba/wan2.6-t2v`                                                            |
| URL de base par défaut | `https://dashscope-intl.aliyuncs.com`                                           |

## Premiers pas

<Steps>
  <Step title="Définir une clé API">
    Utilisez l’onboarding pour stocker la clé pour le fournisseur `alibaba` :

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Ou transmettez la clé directement pendant l’installation/onboarding :

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Ou exportez l’une des variables d’environnement acceptées avant de démarrer le Gateway :

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
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

    La liste doit inclure les cinq modèles Wan intégrés. Si `MODELSTUDIO_API_KEY` n’est pas résolue, `openclaw models status --json` signale l’identifiant manquant sous `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  Le plugin Alibaba et le [plugin Qwen](/fr/providers/qwen) s’authentifient tous deux auprès de DashScope et acceptent des variables d’environnement qui se chevauchent. Utilisez les ID de modèle `alibaba/...` pour piloter la surface vidéo Wan dédiée ; utilisez les ID `qwen/...` lorsque vous voulez la surface de discussion, d’embedding ou de compréhension multimédia de Qwen.
</Note>

## Modèles Wan intégrés

| Référence du modèle        | Mode                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Texte vers vidéo (par défaut) |
| `alibaba/wan2.6-i2v`       | Image vers vidéo          |
| `alibaba/wan2.6-r2v`       | Référence vers vidéo      |
| `alibaba/wan2.6-r2v-flash` | Référence vers vidéo (rapide) |
| `alibaba/wan2.7-r2v`       | Référence vers vidéo      |

## Capacités et limites

Le fournisseur intégré reflète les limites de l’API vidéo Wan de DashScope. Les trois modes partagent le même plafond de nombre de vidéos et de durée par requête ; seule la forme de l’entrée diffère.

| Mode               | Nombre max. de vidéos en sortie | Nombre max. d’images en entrée | Nombre max. de vidéos en entrée | Durée max. | Contrôles pris en charge                                  |
| ------------------ | ----------------- | ---------------- | ---------------- | ------------ | --------------------------------------------------------- |
| Texte vers vidéo   | 1                 | s/o              | s/o              | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Image vers vidéo   | 1                 | 1                | s/o              | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Référence vers vidéo | 1                 | s/o              | 4                | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Lorsqu’une requête omet `durationSeconds`, le fournisseur envoie la valeur par défaut acceptée par DashScope, soit **5 secondes**. Définissez explicitement `durationSeconds` dans l’[outil de génération vidéo](/fr/tools/video-generation) pour l’étendre jusqu’à 10 s.

<Warning>
  Les entrées d’image et de vidéo de référence doivent être des URL `http(s)` distantes. Les chemins de fichiers locaux ne sont pas acceptés par les modes de référence de DashScope ; téléversez d’abord vers un stockage d’objets ou utilisez le flux de l’[outil média](/fr/tools/media-overview), qui produit déjà une URL publique.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Remplacer l’URL de base de DashScope">
    Le fournisseur utilise par défaut le point de terminaison international de DashScope. Pour cibler le point de terminaison de la région Chine, définissez :

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

    Le fournisseur supprime les barres obliques finales avant de construire les URL de tâches AIGC.

  </Accordion>

  <Accordion title="Priorité des variables d’environnement d’auth">
    OpenClaw résout la clé API Alibaba depuis les variables d’environnement dans cet ordre, en prenant la première valeur non vide :

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Les entrées `auth.profiles` configurées (définies via `openclaw models auth login`) remplacent la résolution des variables d’environnement. Consultez les [profils d’auth dans la FAQ des modèles](/fr/help/faq-models#what-is-an-auth-profile) pour la rotation des profils, le cooldown et les mécanismes de remplacement.

  </Accordion>

  <Accordion title="Relation avec le plugin Qwen">
    Les deux plugins intégrés communiquent avec DashScope et acceptent des clés API qui se chevauchent. Utilisez :

    - les ID `alibaba/wan*.*` pour piloter le fournisseur vidéo Wan dédié documenté sur cette page.
    - les ID `qwen/*` pour la discussion, l’embedding et la compréhension multimédia Qwen (voir [Qwen](/fr/providers/qwen)).

    Définir `MODELSTUDIO_API_KEY` une seule fois authentifie les deux plugins, car la liste des variables d’environnement d’auth se chevauche intentionnellement ; vous n’avez pas besoin d’onboarder chaque plugin séparément.

  </Accordion>
</AccordionGroup>

## Associés

<CardGroup cols={2}>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Qwen" href="/fr/providers/qwen" icon="microchip">
    Configuration de la discussion, de l’embedding et de la compréhension multimédia Qwen avec la même authentification DashScope.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
  <Card title="FAQ des modèles" href="/fr/help/faq-models" icon="circle-question">
    Profils d’auth, changement de modèles et résolution des erreurs « no profile ».
  </Card>
</CardGroup>
