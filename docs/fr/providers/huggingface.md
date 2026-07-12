---
read_when:
    - Vous souhaitez utiliser Hugging Face Inference avec OpenClaw
    - Vous devez utiliser la variable d’environnement du jeton HF ou choisir l’authentification via la CLI.
summary: Configuration de Hugging Face Inference (authentification et sélection du modèle)
title: Hugging Face (inférence)
x-i18n:
    generated_at: "2026-07-12T03:02:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) expose un routeur de complétions de chat compatible avec OpenAI, donnant accès à de nombreux modèles hébergés (DeepSeek, Llama et d’autres) avec un seul jeton. OpenClaw communique uniquement avec le **point de terminaison des complétions de chat** ; pour la génération d’images à partir de texte, les embeddings ou la parole, utilisez directement les [clients d’inférence HF](https://huggingface.co/docs/api-inference/quicktour).

| Propriété                  | Valeur                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Identifiant du fournisseur | `huggingface`                                                                                                                             |
| Plugin                     | intégré (activé par défaut, aucune étape d’installation)                                                                                  |
| Variable d’environnement d’authentification | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (jeton à granularité fine)                                                        |
| API                        | compatible avec OpenAI (`https://router.huggingface.co/v1`)                                                                               |
| Facturation                | Un seul jeton HF ; la [tarification](https://huggingface.co/docs/inference-providers/pricing) suit les tarifs du fournisseur avec un niveau gratuit |

## Prise en main

<Steps>
  <Step title="Create a fine-grained token">
    Accédez à [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) et créez un nouveau jeton à granularité fine.

    <Warning>
    L’autorisation **Make calls to Inference Providers** doit être activée pour le jeton, sinon les requêtes API seront rejetées.
    </Warning>

  </Step>
  <Step title="Run onboarding">
    Choisissez **Hugging Face** dans la liste déroulante des fournisseurs, puis saisissez votre clé API lorsque vous y êtes invité :

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    Dans la liste déroulante **Modèle Hugging Face par défaut**, choisissez un modèle. La liste est chargée depuis l’API d’inférence lorsque votre jeton est valide ; sinon, OpenClaw affiche le catalogue intégré ci-dessous. Votre choix est enregistré dans `agents.defaults.model.primary` :

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
  <Step title="Verify the model is available">
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

## Identifiants de modèles

Les références de modèles utilisent la forme `huggingface/<org>/<model>` (identifiants au format Hub). Catalogue intégré d’OpenClaw :

| Modèle                       | Référence (préfixée par `huggingface/`)   |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
Lorsque votre jeton est valide, OpenClaw découvre également tout autre modèle fourni par **GET** `https://router.huggingface.co/v1/models` lors de l’intégration et du démarrage du Gateway. Votre catalogue peut donc contenir bien plus que les quatre modèles ci-dessus. Vous pouvez ajouter `:fastest` ou `:cheapest` à n’importe quel identifiant de modèle ; le routeur de HF achemine alors la requête vers le fournisseur d’inférence correspondant. Définissez l’ordre par défaut de vos fournisseurs dans les [paramètres des fournisseurs d’inférence](https://hf.co/settings/inference-providers).
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw découvre les modèles avec :

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    La réponse suit le format d’OpenAI : `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Lorsqu’une clé est configurée (pendant l’intégration, via `HUGGINGFACE_HUB_TOKEN` ou via `HF_TOKEN`), la liste déroulante **Modèle Hugging Face par défaut** de la configuration interactive est alimentée à partir de ce point de terminaison. Au démarrage, le Gateway répète le même appel pour actualiser le catalogue. Les modèles découverts sont fusionnés avec le catalogue intégré ci-dessus, qui fournit notamment les métadonnées telles que la fenêtre de contexte et le coût lorsqu’un identifiant correspond. Si la requête échoue, ne renvoie aucune donnée ou qu’aucune clé n’est définie, OpenClaw utilise uniquement le catalogue intégré.

    Désactivez la découverte sans supprimer le fournisseur :

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **Nom provenant de l’API :** les modèles découverts utilisent la valeur `name`, `title` ou `display_name` de l’API lorsqu’elle est présente ; sinon, OpenClaw déduit un nom de l’identifiant du modèle (par exemple, `deepseek-ai/DeepSeek-R1` devient « DeepSeek R1 »).
    - **Remplacement du nom d’affichage :** définissez un libellé personnalisé pour chaque modèle dans la configuration :

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

    - **Suffixes de stratégie :** `:fastest` et `:cheapest` sont des conventions du routeur de HF, et non des valeurs réécrites par OpenClaw : le suffixe est envoyé tel quel dans l’identifiant du modèle, puis le routeur de HF sélectionne le fournisseur d’inférence correspondant. Ajoutez chaque variante comme entrée distincte sous `models.providers.huggingface.models` (ou dans `model.primary`) si vous souhaitez un alias différent pour chaque suffixe.
    - **Fusion de la configuration :** les entrées existantes dans `models.providers.huggingface.models` (par exemple dans `models.json`) sont conservées lors de la fusion de la configuration. Tout `name`, `alias` ou toute option de modèle personnalisée que vous y définissez persiste donc après les redémarrages.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Si le Gateway s’exécute comme un démon (launchd/systemd), assurez-vous que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` est accessible à ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

    <Note>
    OpenClaw accepte à la fois `HUGGINGFACE_HUB_TOKEN` et `HF_TOKEN`. Si les deux sont définis, `HUGGINGFACE_HUB_TOKEN` est prioritaire.
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 with fallback">
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

  <Accordion title="Config: DeepSeek with cheapest and fastest variants">
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

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS with aliases">
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
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Model selection" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer des modèles.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentation officielle de Hugging Face Inference Providers.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de la configuration.
  </Card>
</CardGroup>
