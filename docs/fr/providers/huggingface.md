---
read_when:
    - Vous souhaitez utiliser Hugging Face Inference avec OpenClaw
    - Vous devez fournir la variable d’environnement du jeton HF ou choisir l’authentification via la CLI
summary: Configuration de Hugging Face Inference (authentification + sélection du modèle)
title: Hugging Face (inférence)
x-i18n:
    generated_at: "2026-07-12T15:44:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) fournit un routeur de complétions de chat compatible avec OpenAI devant de nombreux modèles hébergés (DeepSeek, Llama, entre autres), accessibles avec un seul jeton. OpenClaw communique **uniquement avec le point de terminaison des complétions de chat** ; pour la génération de texte en image, les plongements ou la parole, utilisez directement les [clients d’inférence HF](https://huggingface.co/docs/api-inference/quicktour).

| Propriété                     | Valeur                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identifiant du fournisseur    | `huggingface`                                                                                                                                          |
| Plugin                        | intégré (activé par défaut, aucune étape d’installation)                                                                                               |
| Variable d’environnement d’authentification | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (jeton à granularité fine)                                                                         |
| API                           | compatible avec OpenAI (`https://router.huggingface.co/v1`)                                                                                            |
| Facturation                   | Un seul jeton HF ; la [tarification](https://huggingface.co/docs/inference-providers/pricing) suit les tarifs des fournisseurs, avec une offre gratuite |

## Prise en main

<Steps>
  <Step title="Créer un jeton à granularité fine">
    Accédez à [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) et créez un jeton à granularité fine.

    <Warning>
    L’autorisation **Make calls to Inference Providers** doit être activée pour le jeton, sinon les requêtes API seront rejetées.
    </Warning>

  </Step>
  <Step title="Exécuter l’intégration initiale">
    Choisissez **Hugging Face** dans la liste déroulante des fournisseurs, puis saisissez votre clé API lorsque vous y êtes invité :

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Sélectionner un modèle par défaut">
    Dans la liste déroulante **Default Hugging Face model**, choisissez un modèle. La liste est chargée depuis l’API Inference lorsque votre jeton est valide ; sinon, OpenClaw affiche le catalogue intégré ci-dessous. Votre choix est enregistré dans `agents.defaults.model.primary` :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Configuration non interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Définit `huggingface/deepseek-ai/DeepSeek-R1` comme modèle par défaut.

## Identifiants de modèle

Les références de modèle utilisent la forme `huggingface/<org>/<model>` (identifiants de style Hub). Catalogue intégré d’OpenClaw :

| Modèle                       | Référence (préfixée par `huggingface/`)    |
| ---------------------------- | ------------------------------------------ |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                  |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                      |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`  |

<Tip>
Lorsque votre jeton est valide, OpenClaw découvre également tout autre modèle à partir de **GET** `https://router.huggingface.co/v1/models` lors de l’intégration initiale et du démarrage du Gateway. Votre catalogue peut donc contenir bien plus que les quatre modèles ci-dessus. Vous pouvez ajouter `:fastest` ou `:cheapest` à n’importe quel identifiant de modèle ; le routeur de HF dirige alors la requête vers le fournisseur d’inférence correspondant. Définissez l’ordre par défaut de vos fournisseurs dans les [paramètres des fournisseurs d’inférence](https://hf.co/settings/inference-providers).
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Découverte des modèles et liste déroulante de l’intégration initiale">
    OpenClaw découvre les modèles avec :

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # ou $HF_TOKEN
    ```

    La réponse suit le format OpenAI : `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Lorsqu’une clé est configurée (intégration initiale, `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`), la liste déroulante **Default Hugging Face model** de la configuration interactive est alimentée à partir de ce point de terminaison. Le démarrage du Gateway répète le même appel pour actualiser le catalogue. Les modèles découverts sont fusionnés avec le catalogue intégré ci-dessus, utilisé pour les métadonnées telles que la fenêtre de contexte et le coût lorsqu’un identifiant correspond. Si la requête échoue, ne renvoie aucune donnée ou qu’aucune clé n’est définie, OpenClaw utilise uniquement le catalogue intégré.

    Désactivez la découverte sans supprimer le fournisseur :

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Noms de modèles, alias et suffixes de stratégie">
    - **Nom provenant de l’API :** les modèles découverts utilisent la valeur `name`, `title` ou `display_name` de l’API lorsqu’elle est présente ; sinon, OpenClaw dérive un nom de l’identifiant du modèle (par exemple, `deepseek-ai/DeepSeek-R1` devient « DeepSeek R1 »).
    - **Remplacer le nom d’affichage :** définissez une étiquette personnalisée pour chaque modèle dans la configuration :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Suffixes de stratégie :** `:fastest` et `:cheapest` sont des conventions du routeur HF, et non des éléments réécrits par OpenClaw : le suffixe est envoyé tel quel dans l’identifiant du modèle, et le routeur HF sélectionne le fournisseur d’inférence correspondant. Ajoutez chaque variante comme une entrée distincte sous `models.providers.huggingface.models` (ou dans `model.primary`) si vous souhaitez un alias distinct pour chaque suffixe.
    - **Fusion de la configuration :** les entrées existantes dans `models.providers.huggingface.models` (par exemple dans `models.json`) sont conservées lors de la fusion de la configuration. Ainsi, tout `name`, `alias` ou toute option de modèle personnalisée que vous y définissez persiste après les redémarrages.

  </Accordion>

  <Accordion title="Configuration de l’environnement et du démon">
    Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

    <Note>
    OpenClaw accepte `HUGGINGFACE_HUB_TOKEN` et `HF_TOKEN`. Si les deux sont définis, `HUGGINGFACE_HUB_TOKEN` est prioritaire.
    </Note>

  </Accordion>

  <Accordion title="Configuration : DeepSeek R1 avec modèle de secours">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuration : DeepSeek avec les variantes la moins chère et la plus rapide">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuration : DeepSeek + Llama + GPT-OSS avec des alias">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Contenu associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Présentation de tous les fournisseurs, des références de modèle et du comportement de basculement.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Documentation d’Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentation officielle de Hugging Face Inference Providers.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
</CardGroup>
