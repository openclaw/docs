---
read_when:
    - Vous voulez utiliser Arcee AI avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration d’Arcee AI (authentification + sélection du modèle)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) donne accès à la famille Trinity de modèles à mélange d’experts via une API compatible OpenAI. Tous les modèles Trinity sont sous licence Apache 2.0.

Les modèles Arcee AI sont accessibles directement via la plateforme Arcee ou via [OpenRouter](/fr/providers/openrouter).

| Propriété | Valeur                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| Fournisseur | `arcee`                                                                             |
| Auth      | `ARCEEAI_API_KEY` (direct) ou `OPENROUTER_API_KEY` (via OpenRouter)                   |
| API       | Compatible OpenAI                                                                     |
| URL de base | `https://api.arcee.ai/api/v1` (direct) ou `https://openrouter.ai/api/v1` (OpenRouter) |

## Bien démarrer

<Tabs>
  <Tab title="Direct (plateforme Arcee)">
    <Steps>
      <Step title="Obtenir une clé API">
        Créez une clé API sur [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Exécuter l’onboarding">
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
      <Step title="Exécuter l’onboarding">
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

        Les mêmes refs de modèles fonctionnent pour les configurations directes et OpenRouter (par exemple `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuration non interactive

<Tabs>
  <Tab title="Direct (plateforme Arcee)">
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

OpenClaw inclut actuellement ce catalogue Arcee groupé :

| Ref de modèle                  | Nom                    | Entrée | Contexte | Coût (entrée/sortie par 1 M) | Notes                                      |
| ------------------------------ | ---------------------- | ------ | -------- | ---------------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | texte  | 256K     | $0.25 / $0.90                | Modèle par défaut ; raisonnement activé ; pas d’outils |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | texte  | 128K     | $0.25 / $1.00                | Usage général ; 400B paramètres, 13B actifs |
| `arcee/trinity-mini`           | Trinity Mini 26B       | texte  | 128K     | $0.045 / $0.15               | Rapide et économique ; appel de fonctions  |

<Tip>
Le préréglage d’onboarding définit `arcee/trinity-large-thinking` comme modèle par défaut. Il prend uniquement en charge le raisonnement/texte et ne prend pas en charge l’utilisation d’outils ni l’appel de fonctions.
</Tip>

## Fonctionnalités prises en charge

| Fonctionnalité                               | Pris en charge                              |
| ------------------------------------------- | ------------------------------------------ |
| Streaming                                   | Oui                                        |
| Utilisation d’outils / appel de fonctions   | Dépend du modèle ; pas Trinity Large Thinking |
| Sortie structurée (mode JSON et schéma JSON) | Oui                                       |
| Réflexion étendue                           | Oui (Trinity Large Thinking)               |

<AccordionGroup>
  <Accordion title="Note sur l’environnement">
    Si le Gateway s’exécute comme un daemon (launchd/systemd), assurez-vous que `ARCEEAI_API_KEY`
    (ou `OPENROUTER_API_KEY`) est disponible pour ce processus (par exemple, dans
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>

  <Accordion title="Routage OpenRouter">
    Lorsque vous utilisez des modèles Arcee via OpenRouter, les mêmes refs de modèles `arcee/*` s’appliquent.
    OpenClaw gère le routage de manière transparente selon votre choix d’authentification. Consultez la
    [documentation du fournisseur OpenRouter](/fr/providers/openrouter) pour les détails de configuration propres à OpenRouter.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fr/providers/openrouter" icon="shuffle">
    Accédez aux modèles Arcee et à beaucoup d’autres avec une seule clé API.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les refs de modèles et le comportement de basculement.
  </Card>
</CardGroup>
