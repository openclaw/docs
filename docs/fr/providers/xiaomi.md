---
read_when:
    - Vous souhaitez utiliser les modèles Xiaomi MiMo dans OpenClaw
    - Vous devez configurer l’authentification Xiaomi MiMo ou le forfait de jetons
summary: Utilisez les modèles de paiement à l’utilisation et de forfait de jetons de Xiaomi MiMo avec OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-07-12T15:46:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6b91ead3e4a32a93bca7e02476b8de11137e8a5b5fa434bad8187bc1b204856
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo est la plateforme d’API pour les modèles **MiMo**. Le plugin `xiaomi`
intégré (`enabledByDefault: true`, aucune étape d’installation) enregistre deux
fournisseurs de texte ainsi qu’un fournisseur vocal (TTS) :

- `xiaomi` - clés avec paiement à l’utilisation (`sk-...`)
- `xiaomi-token-plan` - clés Token Plan (`tp-...`) avec des préréglages de points de terminaison régionaux

| Propriété                  | Valeur                                                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identifiants de fournisseur | `xiaomi` (paiement à l’utilisation), `xiaomi-token-plan` (Token Plan)                                                                               |
| Variables d’environnement d’authentification | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                                      |
| Indicateurs d’intégration  | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Indicateurs CLI directs    | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                      |
| API                        | Complétions de chat compatibles avec OpenAI (`openai-completions`)                                                                                 |
| Contrat vocal              | `speechProviders: ["xiaomi"]`                                                                                                                      |
| URL de base                | Paiement à l’utilisation : `https://api.xiaomimimo.com/v1` ; Token Plan : `token-plan-{cn,sgp,ams}.xiaomimimo.com/v1`                              |
| Modèles par défaut         | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                          |
| TTS par défaut             | `mimo-v2.5-tts`, voix `mimo_default` ; modèle de conception vocale `mimo-v2.5-tts-voicedesign`                                                      |

## Prise en main

<Steps>
  <Step title="Obtenir la clé appropriée">
    Créez une clé avec paiement à l’utilisation dans la [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), ou ouvrez la page de votre abonnement Token Plan et copiez l’URL de base régionale compatible avec OpenAI ainsi que la clé `tp-...` correspondante.
  </Step>

  <Step title="Exécuter l’intégration">
    Paiement à l’utilisation :

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan :

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Vous pouvez également transmettre directement les clés :

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    openclaw onboard --auth-choice xiaomi-token-plan-sgp --xiaomi-token-plan-api-key "$XIAOMI_TOKEN_PLAN_API_KEY"
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider xiaomi
    openclaw models list --provider xiaomi-token-plan
    ```
  </Step>
</Steps>

<Tip>
L’intégration valide le format de la clé et affiche un avertissement lorsqu’une clé `tp-...` est saisie dans le parcours avec paiement à l’utilisation, ou lorsqu’une clé `sk-...` est saisie dans le parcours Token Plan.
</Tip>

## Catalogue avec paiement à l’utilisation

| Référence du modèle       | Entrée      | Contexte  | Sortie maximale | Raisonnement | Remarques         |
| ------------------------- | ----------- | --------- | ---------------- | ------------ | ----------------- |
| `xiaomi/mimo-v2-flash`    | texte       | 262,144   | 8,192            | Non          | Modèle par défaut |
| `xiaomi/mimo-v2-pro`      | texte       | 1,048,576 | 32,000           | Oui          | Contexte étendu   |
| `xiaomi/mimo-v2-omni`     | texte, image | 262,144  | 32,000           | Oui          | Multimodal        |

## Catalogue Token Plan

Choisissez l’option d’authentification Token Plan correspondant à l’URL de base régionale affichée dans l’interface d’abonnement de Xiaomi :

| Option d’authentification | URL de base                                |
| ------------------------- | ------------------------------------------ |
| `xiaomi-token-plan-cn`    | `https://token-plan-cn.xiaomimimo.com/v1`  |
| `xiaomi-token-plan-sgp`   | `https://token-plan-sgp.xiaomimimo.com/v1` |
| `xiaomi-token-plan-ams`   | `https://token-plan-ams.xiaomimimo.com/v1` |

| Référence du modèle                | Entrée       | Contexte  | Sortie maximale | Raisonnement | Remarques         |
| ---------------------------------- | ------------ | --------- | ---------------- | ------------ | ----------------- |
| `xiaomi-token-plan/mimo-v2.5-pro`  | texte        | 1,048,576 | 131,072          | Oui          | Modèle par défaut |
| `xiaomi-token-plan/mimo-v2.5`      | texte, image | 1,048,576 | 131,072          | Oui          | Multimodal        |

`xiaomi-token-plan` nécessite une URL de base régionale pour être résolu. Le
parcours pris en charge consiste à utiliser une option d’intégration Token Plan
intégrée ou un bloc de configuration `models.providers.xiaomi-token-plan`
explicite avec `baseUrl` défini ; le fournisseur n’est pas proposé sans l’un
de ces éléments.

## Modèles de raisonnement

`mimo-v2-pro`, `mimo-v2-omni`, `mimo-v2.5` et `mimo-v2.5-pro` prennent en charge
la [directive `/think` d’OpenClaw](/fr/tools/thinking) avec les niveaux `off`,
`minimal`, `low`, `medium`, `high`, `xhigh` et `max` (`high` par défaut).
`mimo-v2-flash` ne prend pas en charge le raisonnement.

## Synthèse vocale

Le plugin `xiaomi` intégré enregistre également Xiaomi MiMo comme fournisseur
vocal pour `messages.tts`. Il appelle le contrat TTS de complétion de chat de
Xiaomi avec le texte sous forme de message `assistant` et les éventuelles
instructions de style sous forme de message `user`.

| Propriété | Valeur                                   |
| --------- | ---------------------------------------- |
| Identifiant TTS | `xiaomi` (alias `mimo`)            |
| Authentification | `XIAOMI_API_KEY`                   |
| API       | `POST /v1/chat/completions` avec `audio` |
| Par défaut | `mimo-v2.5-tts`, voix `mimo_default`    |
| Sortie    | MP3 par défaut ; WAV si configuré         |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          speakerVoice: "mimo_default",
          format: "mp3",
          style: "Ton lumineux, naturel et conversationnel.",
        },
      },
    },
  },
}
```

Voix intégrées : `mimo_default`, `default_zh`, `default_en`, `Mia`, `Chloe`,
`Milo`, `Dean`. Les modèles à voix prédéfinie (`mimo-v2.5-tts`, `mimo-v2-tts`)
utilisent `audio.voice` ; OpenClaw envoie donc `speakerVoice` pour ces modèles.

Le modèle de conception vocale `mimo-v2.5-tts-voicedesign` génère la voix à
partir d’une instruction de style en langage naturel plutôt qu’à partir d’un
identifiant de voix prédéfinie. Définissez `style` sur la description vocale
souhaitée ; OpenClaw l’envoie comme message `user`, envoie le texte à prononcer
comme message `assistant` et omet `audio.voice` pour ce modèle.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Voix féminine chaleureuse et naturelle, avec une prononciation claire.",
        },
      },
    },
  },
}
```

Pour les canaux qui demandent une cible de synthèse sous forme de message vocal
(Discord, Feishu, Matrix, Telegram et WhatsApp), OpenClaw transcode la sortie
Xiaomi en Opus mono à 48kHz avec `ffmpeg` avant la livraison.

## Exemple de configuration

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

Les tarifs et les indicateurs de compatibilité proviennent du manifeste du plugin intégré ; l’exemple de configuration omet donc `cost` et `compat` afin d’éviter toute divergence avec le comportement d’exécution.

Token Plan :

```json5
{
  env: { XIAOMI_TOKEN_PLAN_API_KEY: "tp-your-key" },
  agents: { defaults: { model: { primary: "xiaomi-token-plan/mimo-v2.5-pro" } } },
  models: {
    mode: "merge",
    providers: {
      "xiaomi-token-plan": {
        baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_TOKEN_PLAN_API_KEY",
        models: [
          {
            id: "mimo-v2.5-pro",
            name: "Xiaomi MiMo V2.5 Pro",
            reasoning: true,
            input: ["text"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
          {
            id: "mimo-v2.5",
            name: "Xiaomi MiMo V2.5",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048576,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Les tarifs proviennent du manifeste intégré (les modèles Token Plan incluent une tarification de lecture du cache par paliers) ; l’exemple de configuration omet donc `cost`.

<AccordionGroup>
  <Accordion title="Comportement de l’injection automatique">
    Le fournisseur `xiaomi` est activé automatiquement lorsque `XIAOMI_API_KEY` est défini dans votre environnement ou qu’un profil d’authentification existe. `xiaomi-token-plan` nécessite une URL de base régionale ; le parcours pris en charge consiste donc à utiliser l’option d’intégration Token Plan intégrée ou un bloc de configuration `models.providers.xiaomi-token-plan` explicite.
  </Accordion>

  <Accordion title="Détails des modèles">
    - **mimo-v2-flash** - léger et rapide, idéal pour les tâches textuelles générales. Ne prend pas en charge le raisonnement.
    - **mimo-v2-pro** - prend en charge le raisonnement avec une fenêtre de contexte de 1M de tokens pour le traitement de documents longs.
    - **mimo-v2-omni** - modèle multimodal avec raisonnement qui accepte des entrées textuelles et des images.
    - **mimo-v2.5-pro** - modèle Token Plan par défaut avec la pile de raisonnement V2.5 actuelle de Xiaomi.
    - **mimo-v2.5** - route multimodale V2.5 de Token Plan.

    <Note>
    Les modèles avec paiement à l’utilisation utilisent le préfixe `xiaomi/`. Les modèles Token Plan utilisent le préfixe `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Dépannage">
    - Si les modèles n’apparaissent pas, vérifiez que la variable d’environnement de clé ou le profil d’authentification correspondant est présent et valide.
    - Pour Token Plan, vérifiez que la région d’intégration choisie correspond à l’URL de base de la page d’abonnement et que la clé commence par `tp-`.
    - Lorsque le Gateway s’exécute comme démon, assurez-vous que la clé est accessible à ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus Gateway gérés comme des démons. Utilisez `~/.openclaw/.env` ou la configuration `env.shellEnv` pour assurer une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Pages connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèle et du comportement de basculement.
  </Card>
  <Card title="Niveaux de réflexion" href="/fr/tools/thinking" icon="brain">
    Syntaxe de la directive `/think` et correspondance des niveaux.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration d’OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Tableau de bord Xiaomi MiMo et gestion des clés d’API.
  </Card>
</CardGroup>
