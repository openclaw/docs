---
read_when:
    - Vous souhaitez utiliser Cerebras avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Cerebras ou du choix d’authentification CLI
summary: Configuration de Cerebras (authentification + sélection du modèle)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T07:35:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) fournit une inférence haute vitesse compatible avec OpenAI sur du matériel d’inférence personnalisé. OpenClaw inclut un Plugin fournisseur Cerebras intégré avec un catalogue statique de quatre modèles.

| Propriété                  | Valeur                                   |
| -------------------------- | ---------------------------------------- |
| ID du fournisseur          | `cerebras`                               |
| Plugin                     | intégré, `enabledByDefault: true`        |
| Variable d’env. d’auth.    | `CEREBRAS_API_KEY`                       |
| Option d’intégration       | `--auth-choice cerebras-api-key`         |
| Option CLI directe         | `--cerebras-api-key <key>`               |
| API                        | compatible OpenAI (`openai-completions`) |
| URL de base                | `https://api.cerebras.ai/v1`             |
| Modèle par défaut          | `cerebras/zai-glm-4.7`                   |

## Premiers pas

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API dans la [console cloud Cerebras](https://cloud.cerebras.ai).
  </Step>
  <Step title="Lancer l’intégration initiale">
    <CodeGroup>

```bash Intégration initiale
openclaw onboard --auth-choice cerebras-api-key
```

```bash Option directe
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env uniquement
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider cerebras
    ```

    La liste doit inclure les quatre modèles intégrés. Si `CEREBRAS_API_KEY` n’est pas résolu, `openclaw models status --json` signale l’identifiant manquant sous `auth.unusableProfiles`.

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

OpenClaw fournit un catalogue Cerebras statique qui reflète le point de terminaison public compatible avec OpenAI. Les quatre modèles partagent un contexte de 128k et 8 192 tokens de sortie maximum.

| Référence du modèle                      | Nom                  | Raisonnement | Notes                                      |
| ---------------------------------------- | -------------------- | ------------ | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | oui          | Modèle par défaut ; modèle de raisonnement en aperçu |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | oui          | Modèle de raisonnement de production       |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | non          | Modèle sans raisonnement en aperçu         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | non          | Modèle de production axé sur la vitesse    |

<Warning>
  Cerebras marque `zai-glm-4.7` et `qwen-3-235b-a22b-instruct-2507` comme modèles en aperçu, et `llama3.1-8b` ainsi que `qwen-3-235b-a22b-instruct-2507` sont documentés comme devant être dépréciés le 27 mai 2026. Consultez la page des modèles pris en charge par Cerebras avant de vous appuyer sur eux pour des charges de travail de production.
</Warning>

## Configuration manuelle

Le Plugin intégré signifie généralement que vous n’avez besoin que de la clé API. Utilisez une configuration `models.providers.cerebras` explicite lorsque vous voulez remplacer les métadonnées de modèle ou exécuter en `mode: "merge"` avec le catalogue statique :

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
  Si le Gateway s’exécute comme daemon (launchd, systemd, Docker), assurez-vous que `CEREBRAS_API_KEY` est disponible pour ce processus, par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`. Une clé présente uniquement dans `~/.profile` n’aidera pas un service géré, sauf si l’environnement est importé séparément.
</Note>

## Connexe

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des références de modèles et le comportement de basculement.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement pour les deux modèles Cerebras capables de raisonnement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
  <Card title="FAQ sur les modèles" href="/fr/help/faq-models" icon="circle-question">
    Profils d’authentification, changement de modèles et résolution des erreurs « no profile ».
  </Card>
</CardGroup>
