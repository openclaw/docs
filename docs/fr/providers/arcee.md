---
read_when:
    - Vous souhaitez utiliser Arcee AI avec OpenClaw
    - Vous devez fournir la variable d’environnement de la clé API ou choisir l’authentification via la CLI
summary: Configuration d’Arcee AI (authentification + sélection du modèle)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T15:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) fournit la famille Trinity de modèles à mélange d’experts par l’intermédiaire d’une API compatible avec OpenAI. Tous les modèles Trinity sont sous licence Apache 2.0. Arcee est un Plugin OpenClaw officiel qui n’est pas inclus dans le cœur du produit ; il faut donc l’installer avant la configuration initiale.

Accédez directement aux modèles Arcee par l’intermédiaire de la plateforme Arcee ou via [OpenRouter](/fr/providers/openrouter).

| Propriété    | Valeur                                                                                |
| ------------ | ------------------------------------------------------------------------------------- |
| Fournisseur  | `arcee`                                                                               |
| Authentification | `ARCEEAI_API_KEY` (directe) ou `OPENROUTER_API_KEY` (via OpenRouter)              |
| API          | Compatible avec OpenAI                                                               |
| URL de base  | `https://api.arcee.ai/api/v1` (directe) ou `https://openrouter.ai/api/v1` (OpenRouter) |

## Installer le Plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Prise en main

<Tabs>
  <Tab title="Directement (plateforme Arcee)">
    <Steps>
      <Step title="Obtenir une clé API">
        Créez une clé API sur [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Exécuter la configuration initiale">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Obtenir une clé API">
        Créez une clé API sur [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Exécuter la configuration initiale">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Les mêmes références de modèles fonctionnent pour les configurations directes et celles utilisant OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuration non interactive

<Tabs>
  <Tab title="Directement (plateforme Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Catalogue intégré

| Référence du modèle            | Nom                    | Entrée | Contexte | Sortie maximale | Coût (entrée/sortie par million) | Outils | Remarques                                       |
| ------------------------------ | ---------------------- | ------ | -------- | --------------- | -------------------------------- | ------ | ----------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | texte  | 256K     | 80K             | $0.25 / $0.90                    | Non    | Modèle par défaut ; raisonnement étendu         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | texte  | 128K     | 16K             | $0.25 / $1.00                    | Oui    | Polyvalent ; 400B paramètres, 13B actifs        |
| `arcee/trinity-mini`           | Trinity Mini 26B       | texte  | 128K     | 80K             | $0.045 / $0.15                   | Oui    | Rapide et économique ; appel de fonctions       |

<Tip>
Le préréglage de configuration initiale définit `arcee/trinity-large-thinking` comme modèle par défaut.
</Tip>

## Fonctionnalités prises en charge

| Fonctionnalité                                      | Prise en charge                                      |
| --------------------------------------------------- | ---------------------------------------------------- |
| Diffusion en continu                                | Oui                                                  |
| Utilisation d’outils / appel de fonctions           | Oui (Trinity Mini, Trinity Large Preview)            |
| Sortie structurée (mode JSON et schéma JSON)        | Oui                                                  |
| Raisonnement étendu                                 | Oui (Trinity Large Thinking ; outils désactivés)     |

<AccordionGroup>
  <Accordion title="Remarque sur l’environnement">
    Si le Gateway s’exécute en tant que démon (launchd/systemd), vérifiez que `ARCEEAI_API_KEY`
    (ou `OPENROUTER_API_KEY`) est accessible à ce processus, par exemple dans
    `~/.openclaw/.env` ou via `env.shellEnv`.
  </Accordion>

  <Accordion title="Routage OpenRouter">
    Lorsque vous utilisez les modèles Arcee via OpenRouter, les mêmes références de modèles `arcee/*` s’appliquent.
    OpenClaw effectue le routage de manière transparente en fonction de votre choix d’authentification. Consultez la
    [documentation du fournisseur OpenRouter](/fr/providers/openrouter) pour obtenir les détails de configuration
    propres à OpenRouter.
  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fr/providers/openrouter" icon="shuffle">
    Accédez aux modèles Arcee et à de nombreux autres modèles avec une seule clé API.
  </Card>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
</CardGroup>
