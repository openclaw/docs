---
read_when:
    - Vous souhaitez une inférence axée sur la confidentialité dans OpenClaw
    - Vous souhaitez des conseils de configuration pour Venice AI
summary: Utiliser les modèles axés sur la confidentialité de Venice AI dans OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-30T07:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI fournit une **inférence IA axée sur la confidentialité**, avec prise en charge de modèles non censurés et accès aux principaux modèles propriétaires via leur proxy anonymisé. Toute l’inférence est privée par défaut — aucun entraînement sur vos données, aucune journalisation.

## Pourquoi Venice dans OpenClaw

- **Inférence privée** pour les modèles open source (aucune journalisation).
- **Modèles non censurés** lorsque vous en avez besoin.
- **Accès anonymisé** aux modèles propriétaires (Opus/GPT/Gemini) lorsque la qualité compte.
- Points de terminaison `/v1` compatibles avec OpenAI.

## Modes de confidentialité

Venice propose deux niveaux de confidentialité — il est essentiel de les comprendre pour choisir votre modèle :

| Mode           | Description                                                                                                                       | Modèles                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privé**      | Entièrement privé. Les prompts/réponses ne sont **jamais stockés ni journalisés**. Éphémère.                                     | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonymisé**  | Transmis par proxy via Venice avec les métadonnées supprimées. Le fournisseur sous-jacent (OpenAI, Anthropic, Google, xAI) voit des requêtes anonymisées. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Les modèles anonymisés ne sont **pas** entièrement privés. Venice supprime les métadonnées avant le transfert, mais le fournisseur sous-jacent (OpenAI, Anthropic, Google, xAI) traite toujours la requête. Choisissez des modèles **privés** lorsqu’une confidentialité complète est requise.
</Warning>

## Fonctionnalités

- **Axé sur la confidentialité** : choisissez entre les modes « privé » (entièrement privé) et « anonymisé » (par proxy)
- **Modèles non censurés** : accès à des modèles sans restrictions de contenu
- **Accès aux grands modèles** : utilisez Claude, GPT, Gemini et Grok via le proxy anonymisé de Venice
- **API compatible OpenAI** : points de terminaison `/v1` standard pour une intégration facile
- **Streaming** : pris en charge sur tous les modèles
- **Appel de fonctions** : pris en charge sur certains modèles (vérifiez les capacités du modèle)
- **Vision** : prise en charge sur les modèles dotés d’une capacité de vision
- **Aucune limite de débit stricte** : une limitation d’usage raisonnable peut s’appliquer en cas d’utilisation extrême

## Bien démarrer

<Steps>
  <Step title="Obtenir votre clé API">
    1. Inscrivez-vous sur [venice.ai](https://venice.ai)
    2. Accédez à **Settings > API Keys > Create new key**
    3. Copiez votre clé API (format : `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configurer OpenClaw">
    Choisissez votre méthode de configuration préférée :

    <Tabs>
      <Tab title="Interactif (recommandé)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Cela va :
        1. Demander votre clé API (ou utiliser `VENICE_API_KEY` existant)
        2. Afficher tous les modèles Venice disponibles
        3. Vous permettre de choisir votre modèle par défaut
        4. Configurer automatiquement le fournisseur
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
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Sélection du modèle

Après la configuration, OpenClaw affiche tous les modèles Venice disponibles. Choisissez en fonction de vos besoins :

- **Modèle par défaut** : `venice/kimi-k2-5` pour un raisonnement privé solide avec vision.
- **Option à haute capacité** : `venice/claude-opus-4-6` pour le chemin Venice anonymisé le plus performant.
- **Confidentialité** : choisissez des modèles « privés » pour une inférence entièrement privée.
- **Capacité** : choisissez des modèles « anonymisés » pour accéder à Claude, GPT, Gemini via le proxy de Venice.

Changez votre modèle par défaut à tout moment :

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Listez tous les modèles disponibles :

```bash
openclaw models list | grep venice
```

Vous pouvez aussi exécuter `openclaw configure`, sélectionner **Model/auth**, puis choisir **Venice AI**.

<Tip>
Utilisez le tableau ci-dessous pour choisir le modèle adapté à votre cas d’utilisation.

| Cas d’utilisation             | Modèle recommandé                | Pourquoi                                      |
| ----------------------------- | -------------------------------- | -------------------------------------------- |
| **Chat général (par défaut)** | `kimi-k2-5`                      | Raisonnement privé solide avec vision        |
| **Meilleure qualité globale** | `claude-opus-4-6`                | Option Venice anonymisée la plus performante |
| **Confidentialité + codage**  | `qwen3-coder-480b-a35b-instruct` | Modèle de codage privé avec grand contexte   |
| **Vision privée**             | `kimi-k2-5`                      | Prise en charge de la vision sans quitter le mode privé |
| **Rapide + économique**       | `qwen3-4b`                       | Modèle de raisonnement léger                 |
| **Tâches privées complexes**  | `deepseek-v3.2`                  | Raisonnement solide, mais sans prise en charge des outils Venice |
| **Non censuré**               | `venice-uncensored`              | Aucune restriction de contenu                |

</Tip>

## Comportement de relecture DeepSeek V4

Si Venice expose des modèles DeepSeek V4 tels que `venice/deepseek-v4-pro` ou
`venice/deepseek-v4-flash`, OpenClaw remplit l’espace réservé de relecture
`reasoning_content` requis par DeepSeek V4 sur les messages assistant lorsque le proxy
l’omet. Venice rejette le contrôle `thinking` natif de premier niveau de DeepSeek, donc
OpenClaw garde cette correction de relecture propre à ce fournisseur séparée des contrôles
de réflexion du fournisseur DeepSeek natif.

## Catalogue intégré (41 au total)

<AccordionGroup>
  <Accordion title="Modèles privés (26) — entièrement privés, aucune journalisation">
    | ID du modèle                          | Nom                                 | Contexte | Fonctionnalités           |
    | -------------------------------------- | ----------------------------------- | -------- | ------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Par défaut, raisonnement, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Raisonnement              |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Général                   |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Général                   |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k     | Général, outils désactivés |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Raisonnement              |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Général                   |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k     | Codage                    |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k     | Codage                    |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k     | Raisonnement, vision      |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k     | Général                   |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k     | Vision                    |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k      | Rapide, raisonnement      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k     | Raisonnement, outils désactivés |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Non censuré, outils désactivés |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k     | Vision                    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k     | Vision                    |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                | 128k     | Général                   |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k     | Général                   |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k     | Raisonnement              |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k     | Général                   |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k     | Raisonnement              |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k     | Raisonnement              |
    | `zai-org-glm-5`                        | GLM 5                              | 198k     | Raisonnement              |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k     | Raisonnement              |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k     | Raisonnement              |
  </Accordion>

  <Accordion title="Modèles anonymisés (15) — via le proxy Venice">
    | ID du modèle                   | Nom                            | Contexte | Fonctionnalités           |
    | ------------------------------ | ------------------------------ | -------- | ------------------------- |
    | `claude-opus-4-6`              | Claude Opus 4.6 (via Venice)   | 1M       | Raisonnement, vision      |
    | `claude-opus-4-5`              | Claude Opus 4.5 (via Venice)   | 198k     | Raisonnement, vision      |
    | `claude-sonnet-4-6`            | Claude Sonnet 4.6 (via Venice) | 1M       | Raisonnement, vision      |
    | `claude-sonnet-4-5`            | Claude Sonnet 4.5 (via Venice) | 198k     | Raisonnement, vision      |
    | `openai-gpt-54`                | GPT-5.4 (via Venice)           | 1M       | Raisonnement, vision      |
    | `openai-gpt-53-codex`          | GPT-5.3 Codex (via Venice)     | 400k     | Raisonnement, vision, codage |
    | `openai-gpt-52`                | GPT-5.2 (via Venice)           | 256k     | Raisonnement              |
    | `openai-gpt-52-codex`          | GPT-5.2 Codex (via Venice)     | 256k     | Raisonnement, vision, codage |
    | `openai-gpt-4o-2024-11-20`     | GPT-4o (via Venice)            | 128k     | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)      | 128k     | Vision                    |
    | `gemini-3-1-pro-preview`       | Gemini 3.1 Pro (via Venice)    | 1M       | Raisonnement, vision      |
    | `gemini-3-pro-preview`         | Gemini 3 Pro (via Venice)      | 198k     | Raisonnement, vision      |
    | `gemini-3-flash-preview`       | Gemini 3 Flash (via Venice)    | 256k     | Raisonnement, vision      |
    | `grok-41-fast`                 | Grok 4.1 Fast (via Venice)     | 1M       | Raisonnement, vision      |
    | `grok-code-fast-1`             | Grok Code Fast 1 (via Venice)  | 256k     | Raisonnement, codage      |
  </Accordion>
</AccordionGroup>

## Découverte des modèles

OpenClaw découvre automatiquement les modèles depuis l’API Venice lorsque `VENICE_API_KEY` est défini. Si l’API est inaccessible, il se replie sur un catalogue statique.

Le point de terminaison `/models` est public (aucune authentification requise pour la liste), mais l’inférence nécessite une clé API valide.

## Streaming et prise en charge des outils

| Fonctionnalité       | Prise en charge                                      |
| -------------------- | ---------------------------------------------------- |
| **Diffusion en continu** | Tous les modèles                                 |
| **Appel de fonctions** | La plupart des modèles (vérifiez `supportsFunctionCalling` dans l’API) |
| **Vision/Images**    | Modèles marqués avec la fonctionnalité « Vision »    |
| **Mode JSON**        | Pris en charge via `response_format`                 |

## Tarifs

Venice utilise un système basé sur des crédits. Consultez [venice.ai/pricing](https://venice.ai/pricing) pour connaître les tarifs actuels :

- **Modèles privés** : coût généralement inférieur
- **Modèles anonymisés** : similaire à la tarification de l’API directe + de faibles frais Venice

### Venice (anonymisé) vs API directe

| Aspect       | Venice (anonymisé)                 | API directe              |
| ------------ | ---------------------------------- | ------------------------ |
| **Confidentialité** | Métadonnées supprimées, anonymisé | Votre compte est associé |
| **Latence**  | +10-50 ms (proxy)                  | Directe                  |
| **Fonctionnalités** | La plupart des fonctionnalités sont prises en charge | Toutes les fonctionnalités |
| **Facturation** | Crédits Venice                  | Facturation du fournisseur |

## Exemples d’utilisation

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Dépannage

<AccordionGroup>
  <Accordion title="Clé API non reconnue">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Assurez-vous que la clé commence par `vapi_`.

  </Accordion>

  <Accordion title="Modèle non disponible">
    Le catalogue de modèles Venice se met à jour dynamiquement. Exécutez `openclaw models list` pour voir les modèles actuellement disponibles. Certains modèles peuvent être temporairement hors ligne.
  </Accordion>

  <Accordion title="Problèmes de connexion">
    L’API Venice se trouve à `https://api.venice.ai/api/v1`. Assurez-vous que votre réseau autorise les connexions HTTPS.
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

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèle et comportement de basculement.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Page d’accueil Venice AI et création de compte.
  </Card>
  <Card title="Documentation de l’API" href="https://docs.venice.ai" icon="book">
    Référence de l’API Venice et documentation pour développeurs.
  </Card>
  <Card title="Tarifs" href="https://venice.ai/pricing" icon="credit-card">
    Tarifs et offres actuels des crédits Venice.
  </Card>
</CardGroup>
