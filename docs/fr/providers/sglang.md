---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un serveur SGLang local
    - Vous souhaitez des endpoints `/v1` compatibles OpenAI avec vos propres modèles
summary: Exécuter OpenClaw avec SGLang (serveur auto-hébergé compatible OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-23T07:10:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96f243c6028d9de104c96c8e921e5bec1a685db06b80465617f33fe29d5c472d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang peut servir des modèles open source via une API HTTP **compatible OpenAI**.
OpenClaw peut se connecter à SGLang en utilisant l’API `openai-completions`.

OpenClaw peut aussi **découvrir automatiquement** les modèles disponibles depuis SGLang lorsque vous
optez pour cela avec `SGLANG_API_KEY` (n’importe quelle valeur fonctionne si votre serveur n’impose pas d’authentification)
et que vous ne définissez pas d’entrée explicite `models.providers.sglang`.

OpenClaw traite `sglang` comme un fournisseur local compatible OpenAI qui prend en charge
la comptabilité d’usage en streaming, de sorte que les comptes de jetons d’état/contexte peuvent être mis à jour à partir des
réponses `stream_options.include_usage`.

## Premiers pas

<Steps>
  <Step title="Démarrer SGLang">
    Lancez SGLang avec un serveur compatible OpenAI. Votre URL de base doit exposer
    des endpoints `/v1` (par exemple `/v1/models`, `/v1/chat/completions`). SGLang
    s’exécute généralement sur :

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Définir une clé API">
    N’importe quelle valeur fonctionne si aucune authentification n’est configurée sur votre serveur :

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Exécuter l’onboarding ou définir directement un modèle">
    ```bash
    openclaw onboard
    ```

    Ou configurez manuellement le modèle :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Découverte de modèles (fournisseur implicite)

Lorsque `SGLANG_API_KEY` est défini (ou qu’un profil d’authentification existe) et que vous **ne**
définissez pas `models.providers.sglang`, OpenClaw interroge :

- `GET http://127.0.0.1:30000/v1/models`

et convertit les IDs renvoyés en entrées de modèle.

<Note>
Si vous définissez explicitement `models.providers.sglang`, la découverte automatique est ignorée et
vous devez définir les modèles manuellement.
</Note>

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite lorsque :

- SGLang s’exécute sur un autre hôte/port.
- Vous voulez épingler les valeurs `contextWindow`/`maxTokens`.
- Votre serveur exige une vraie clé API (ou vous voulez contrôler les en-têtes).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modèle SGLang local",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement de type proxy">
    SGLang est traité comme un backend `/v1` compatible OpenAI de type proxy, et non comme un
    endpoint OpenAI natif.

    | Comportement | SGLang |
    |----------|--------|
    | Mise en forme de requête réservée à OpenAI | Non appliquée |
    | `service_tier`, `store` de Responses, indications de cache de prompt | Non envoyés |
    | Mise en forme de charge utile compatible reasoning | Non appliquée |
    | En-têtes d’attribution cachés (`originator`, `version`, `User-Agent`) | Non injectés sur les URL de base SGLang personnalisées |

  </Accordion>

  <Accordion title="Dépannage">
    **Serveur inaccessible**

    Vérifiez que le serveur est en cours d’exécution et répond :

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Erreurs d’authentification**

    Si les requêtes échouent avec des erreurs d’authentification, définissez un vrai `SGLANG_API_KEY` correspondant
    à la configuration de votre serveur, ou configurez explicitement le fournisseur sous
    `models.providers.sglang`.

    <Tip>
    Si vous exécutez SGLang sans authentification, n’importe quelle valeur non vide pour
    `SGLANG_API_KEY` suffit pour activer la découverte de modèles.
    </Tip>

  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de repli.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les entrées de fournisseur.
  </Card>
</CardGroup>
