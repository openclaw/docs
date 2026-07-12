---
read_when:
    - Vous souhaitez utiliser Meta avec OpenClaw
    - Vous devez définir la variable d’environnement MODEL_API_KEY ou choisir l’authentification via la CLI
summary: Configuration de Meta (authentification + sélection du modèle muse-spark-1.1)
title: Meta
x-i18n:
    generated_at: "2026-07-12T15:43:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

L’**API Meta** utilise l’**API Responses** compatible avec OpenAI (`POST /v1/responses`)
pour le modèle de raisonnement `muse-spark-1.1`. Le fournisseur est distribué sous forme de
plugin OpenClaw intégré.

| Propriété               | Valeur                             |
| ----------------------- | ---------------------------------- |
| Identifiant du fournisseur | `meta`                          |
| Plugin                  | fournisseur intégré                |
| Variable d’environnement d’authentification | `MODEL_API_KEY` |
| Option d’intégration    | `--auth-choice meta-api-key`       |
| Option CLI directe      | `--meta-api-key <key>`             |
| API                     | API Responses (`openai-responses`) |
| URL de base             | `https://api.meta.ai/v1`           |
| Modèle par défaut       | `meta/muse-spark-1.1`              |
| Raisonnement par défaut | `high` (`reasoning.effort`)        |

## Bien démarrer

<Steps>
  <Step title="Définir la clé API">
    <CodeGroup>

```bash Intégration
openclaw onboard --auth-choice meta-api-key
```

```bash Option directe
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Environnement uniquement
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider meta
    ```

    Répertorie l’entrée statique `muse-spark-1.1` du catalogue. Si `MODEL_API_KEY` n’est pas résolue,
    `openclaw models status --json` signale l’identifiant d’authentification manquant sous
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuration non interactive

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Catalogue intégré

| Référence du modèle     | Nom            | Raisonnement | Fenêtre de contexte | Sortie maximale |
| ----------------------- | -------------- | ------------ | ------------------- | --------------- |
| `meta/muse-spark-1.1`   | Muse Spark 1.1 | oui          | 1,048,576           | 131,072         |

Fonctionnalités :

- Entrée texte + image
- Appel d’outils et diffusion en continu
- Effort de raisonnement : `minimal`, `low`, `medium`, `high`, `xhigh` (valeur par défaut : `high`)
- Relecture chiffrée sans état du raisonnement (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` n’accepte pas `reasoning.effort: "none"`. OpenClaw associe
`--thinking off` à `minimal` pour ce fournisseur.
</Warning>

## Configuration manuelle

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Si le Gateway s’exécute en tant que démon (launchd, systemd, Docker), assurez-vous que
`MODEL_API_KEY` est accessible à ce processus, par exemple dans
`~/.openclaw/.env` ou via `env.shellEnv`. Une clé exportée uniquement dans un
shell interactif ne sera pas accessible à un service géré, sauf si l’environnement est importé
séparément.
</Note>

## Test rapide

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Les tests en conditions réelles utilisent `muse-spark-1.1` avec `POST /v1/responses`.

## Pages connexes

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement pour muse-spark-1.1.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
</CardGroup>
