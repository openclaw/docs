---
read_when:
    - Vous voulez utiliser Cerebras avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé d’API Cerebras ou du choix d’authentification CLI
summary: Configuration de Cerebras (authentification + sélection du modèle)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:03:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fournit une inférence à haut débit compatible avec OpenAI sur du matériel d’inférence personnalisé. Le plugin de fournisseur Cerebras inclut un catalogue statique de quatre modèles.

| Propriété       | Valeur                                   |
| --------------- | ---------------------------------------- |
| ID du fournisseur | `cerebras`                             |
| Plugin          | package externe officiel                 |
| Variable d’environnement d’authentification | `CEREBRAS_API_KEY` |
| Indicateur d’onboarding | `--auth-choice cerebras-api-key` |
| Indicateur CLI direct | `--cerebras-api-key <key>`        |
| API             | compatible OpenAI (`openai-completions`) |
| URL de base     | `https://api.cerebras.ai/v1`             |
| Modèle par défaut | `cerebras/zai-glm-4.7`                 |

## Installer le plugin

Installez le plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## Premiers pas

<Steps>
  <Step title="Get an API key">
    Créez une clé API dans la [console Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```

    La liste doit inclure les quatre modèles statiques. Si `CEREBRAS_API_KEY` n’est pas résolu, `openclaw models status --json` signale l’identifiant manquant sous `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuration non interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Catalogue intégré

OpenClaw fournit un catalogue Cerebras statique qui reflète le point de terminaison public compatible OpenAI. Les quatre modèles partagent un contexte de 128k et 8 192 jetons de sortie maximum.

| Référence du modèle                       | Nom                  | Raisonnement | Notes                                  |
| ----------------------------------------- | -------------------- | ------------ | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | oui          | Modèle par défaut ; modèle de raisonnement en préversion |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | oui          | Modèle de raisonnement de production   |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | non          | Modèle sans raisonnement en préversion |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | non          | Modèle de production axé sur la vitesse |

<Warning>
  Cerebras marque `zai-glm-4.7` et `qwen-3-235b-a22b-instruct-2507` comme modèles en préversion, et `llama3.1-8b` ainsi que `qwen-3-235b-a22b-instruct-2507` sont documentés comme devant être dépréciés le 27 mai 2026. Consultez la page des modèles pris en charge de Cerebras avant de vous y fier pour des charges de travail de production.
</Warning>

## Configuration manuelle

Avec le plugin, vous n’avez généralement besoin que de la clé API. Utilisez une configuration explicite `models.providers.cerebras` lorsque vous souhaitez remplacer les métadonnées de modèle ou exécuter en `mode: "merge"` avec le catalogue statique :

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
  Si Gateway s’exécute comme un démon (launchd, systemd, Docker), assurez-vous que `CEREBRAS_API_KEY` est disponible pour ce processus — par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`. Une clé exportée uniquement dans un shell interactif n’aidera pas un service géré, sauf si l’environnement est importé séparément.
</Note>

## Associés

<CardGroup cols={2}>
  <Card title="Model providers" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Thinking modes" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement pour les deux modèles Cerebras capables de raisonnement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
  <Card title="Models FAQ" href="/fr/help/faq-models" icon="circle-question">
    Profils d’authentification, changement de modèles et résolution des erreurs « no profile ».
  </Card>
</CardGroup>
