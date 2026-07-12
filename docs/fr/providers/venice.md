---
read_when:
    - Vous souhaitez une inférence axée sur la confidentialité dans OpenClaw
    - Vous souhaitez obtenir des instructions pour configurer Venice AI
summary: Utiliser les modèles de Venice AI axés sur la confidentialité dans OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T03:04:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) fournit une inférence axée sur la confidentialité : des modèles ouverts s’exécutent
sans aucune journalisation, avec en plus un accès par proxy anonymisé à Claude, GPT, Gemini et Grok.
Tous les points de terminaison sont compatibles avec OpenAI (`/v1`).

## Modes de confidentialité

| Mode           | Comportement                                                         | Modèles                                                        |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Privé**      | Les requêtes et réponses ne sont jamais stockées ni journalisées. Éphémère. | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonymisé**  | Transmis par proxy via Venice après suppression des métadonnées.     | Claude, GPT, Gemini, Grok                                     |

<Warning>
Les modèles anonymisés ne sont pas entièrement privés. Venice supprime les métadonnées avant la transmission, mais le fournisseur sous-jacent (OpenAI, Anthropic, Google, xAI) traite toujours la requête. Utilisez des modèles privés lorsqu’une confidentialité totale est requise.
</Warning>

## Prise en main

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Obtenir votre clé API">
    1. Inscrivez-vous sur [venice.ai](https://venice.ai)
    2. Accédez à **Settings > API Keys > Create new key**
    3. Copiez votre clé API (format : `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configurer OpenClaw">
    <Tabs>
      <Tab title="Interactif (recommandé)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Demande la clé API (ou réutilise une variable `VENICE_API_KEY` existante), répertorie les modèles Venice disponibles et définit votre modèle par défaut.
      </Tab>
      <Tab title="Variable d’environnement">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non interactif">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Vérifier la configuration">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Bonjour, fonctionnez-vous ?"
    ```
  </Step>
</Steps>

## Sélection du modèle

- **Par défaut** : `venice/kimi-k2-5` (privé, raisonnement, vision).
- **Option anonymisée la plus performante** : `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Vous pouvez également exécuter `openclaw configure` et sélectionner **Fournisseur de modèle/d’authentification > Venice AI**.

<Tip>
| Cas d’utilisation                  | Modèle                             | Pourquoi                                      |
| ---------------------------------- | ---------------------------------- | --------------------------------------------- |
| Discussion générale (par défaut)   | `kimi-k2-5`                        | Raisonnement privé performant avec vision     |
| Meilleure qualité globale          | `claude-opus-4-6`                  | Option Venice anonymisée la plus performante  |
| Confidentialité et programmation   | `qwen3-coder-480b-a35b-instruct`   | Modèle de programmation privé à grand contexte |
| Rapide et économique               | `qwen3-4b`                         | Modèle de raisonnement léger                   |
| Tâches privées complexes           | `deepseek-v3.2`                    | Raisonnement performant ; appels d’outils désactivés |
| Non censuré                        | `venice-uncensored`                | Aucune restriction de contenu                 |
</Tip>

## Catalogue intégré (38 modèles)

<AccordionGroup>
  <Accordion title="Modèles privés (26) — entièrement privés, sans journalisation">
    | ID du modèle                           | Nom                                   | Contexte | Remarques                            |
    | -------------------------------------- | ------------------------------------- | -------- | ------------------------------------ |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k     | Par défaut, raisonnement, vision     |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k     | Raisonnement                         |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k     | Général                              |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k     | Général                              |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k     | Général, outils désactivés           |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k     | Raisonnement                         |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k     | Général                              |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k     | Programmation                        |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k     | Programmation                        |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k     | Raisonnement, vision                 |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k     | Général                              |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)                | 256k     | Vision                               |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k      | Rapide, raisonnement                 |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k     | Raisonnement, outils désactivés      |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k      | Non censuré, outils désactivés       |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k     | Vision                               |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k     | Vision                               |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k     | Général                              |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k     | Général                              |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k     | Raisonnement                         |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k     | Général                              |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k     | Raisonnement                         |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k     | Raisonnement                         |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k     | Raisonnement                         |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k     | Raisonnement                         |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k     | Raisonnement                         |
  </Accordion>

  <Accordion title="Modèles anonymisés (12) — via le proxy Venice">
    | ID du modèle                    | Nom                              | Contexte | Remarques                        |
    | -------------------------------- | -------------------------------- | -------- | -------------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)     | 1M       | Raisonnement, vision             |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice)   | 1M       | Raisonnement, vision             |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)             | 1M       | Raisonnement, vision             |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)       | 400k     | Raisonnement, vision, programmation |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)             | 256k     | Raisonnement                     |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)       | 256k     | Raisonnement, vision, programmation |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)              | 128k     | Vision                           |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)         | 128k     | Vision                           |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)      | 1M       | Raisonnement, vision             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)        | 198k     | Raisonnement, vision             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)      | 256k     | Raisonnement, vision             |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)       | 1M       | Raisonnement, vision             |
  </Accordion>
</AccordionGroup>

Les modèles Venice reposant sur Grok (`grok-41-fast` et modèles similaires) reçoivent le même correctif de compatibilité
du schéma d’outils que le fournisseur xAI natif, car ils partagent le même format amont
d’appel d’outils.

## Découverte des modèles

Le catalogue intégré ci-dessus est une liste initiale adossée à un manifeste. À l’exécution, OpenClaw
l’actualise depuis l’API `/models` de Venice et revient à la liste initiale si
l’API est inaccessible. Le point de terminaison `/models` est public (aucune authentification requise pour
la consultation), mais l’inférence nécessite une clé API valide.

## Comportement de relecture de DeepSeek V4

Si Venice expose des modèles DeepSeek V4 tels que `deepseek-v4-pro` ou
`deepseek-v4-flash`, OpenClaw renseigne le champ de relecture `reasoning_content`
requis dans les messages de l’assistant lorsque Venice l’omet, et supprime `thinking`/
`reasoning`/`reasoning_effort` de la charge utile de la requête (Venice refuse
le contrôle `thinking` natif de DeepSeek pour ces modèles). Ce correctif de relecture est
distinct des propres contrôles de réflexion du fournisseur DeepSeek natif.

## Prise en charge du streaming et des outils

| Fonctionnalité       | Prise en charge                                              |
| -------------------- | ------------------------------------------------------------ |
| Streaming            | Tous les modèles                                             |
| Appel de fonctions   | La plupart des modèles ; désactivé par modèle lorsque précisé ci-dessus |
| Vision/Images        | Modèles indiqués comme « Vision » ci-dessus                  |
| Mode JSON            | Via `response_format`                                        |

## Tarification

Venice utilise un système fondé sur des crédits. Les modèles anonymisés coûtent approximativement autant que
la tarification directe de l’API, plus de faibles frais Venice. Consultez
[venice.ai/pricing](https://venice.ai/pricing) pour connaître les tarifs actuels.

## Exemples d’utilisation

```bash
# Modèle privé par défaut
openclaw agent --model venice/kimi-k2-5 --message "Vérification rapide de l’état"

# Claude Opus via Venice (anonymisé)
openclaw agent --model venice/claude-opus-4-6 --message "Résumez cette tâche"

# Modèle non censuré
openclaw agent --model venice/venice-uncensored --message "Proposez plusieurs options"

# Modèle de vision avec image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Examinez l’image jointe"

# Modèle de programmation
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactorisez cette fonction"
```

## Dépannage

<AccordionGroup>
  <Accordion title="Clé API non reconnue">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Vérifiez que la clé commence par `vapi_`.

  </Accordion>

  <Accordion title="Modèle indisponible">
    Exécutez `openclaw models list --all --provider venice` pour afficher les modèles
    actuellement disponibles ; le catalogue évolue à mesure que Venice ajoute ou retire des modèles.
  </Accordion>

  <Accordion title="Problèmes de connexion">
    L’API Venice se trouve à l’adresse `https://api.venice.ai/api/v1`. Vérifiez que votre réseau autorise les connexions HTTPS vers cet hôte.
  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Exemple de fichier de configuration">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
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
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Page d’accueil de Venice AI et création d’un compte.
  </Card>
  <Card title="Documentation de l’API" href="https://docs.venice.ai" icon="book">
    Référence de l’API Venice et documentation pour les développeurs.
  </Card>
  <Card title="Tarification" href="https://venice.ai/pricing" icon="credit-card">
    Tarifs de crédit et offres actuels de Venice.
  </Card>
</CardGroup>
