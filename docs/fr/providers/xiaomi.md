---
read_when:
    - Vous voulez les modèles Xiaomi MiMo dans OpenClaw
    - Vous devez configurer l’authentification Xiaomi MiMo ou le Token Plan
summary: Utiliser les modèles Xiaomi MiMo avec paiement à l’utilisation et Token Plan avec OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-06-27T18:08:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 171c4b95c6ff12d4b8d75747d35fcad19c6173d670a3af65fe0a286e04199751
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo est la plateforme d’API pour les modèles **MiMo**. OpenClaw inclut un plugin Xiaomi intégré avec deux préréglages de fournisseurs de texte :

- `xiaomi` pour les clés de paiement à l’usage (`sk-...`)
- `xiaomi-token-plan` pour les clés Token Plan (`tp-...`) avec des préréglages de points de terminaison régionaux

Le même plugin enregistre aussi le fournisseur de parole (TTS) `xiaomi`.

| Propriété         | Valeur                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID de fournisseurs | `xiaomi` (paiement à l’usage), `xiaomi-token-plan` (Token Plan)                                                                                  |
| Plugin           | intégré, `enabledByDefault: true`                                                                                                                  |
| Variables d’environnement d’authentification | `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_API_KEY`                                                                                |
| Indicateurs d’onboarding | `--auth-choice xiaomi-api-key`, `--auth-choice xiaomi-token-plan-cn`, `--auth-choice xiaomi-token-plan-sgp`, `--auth-choice xiaomi-token-plan-ams` |
| Indicateurs CLI directs | `--xiaomi-api-key <key>`, `--xiaomi-token-plan-api-key <key>`                                                                                |
| Contrats        | complétions de chat + `speechProviders`                                                                                                             |
| API              | compatible OpenAI (`openai-completions`)                                                                                                           |
| URL de base      | Paiement à l’usage : `https://api.xiaomimimo.com/v1` ; préréglages Token Plan : `token-plan-{cn,sgp,ams}...`                                      |
| Modèles par défaut | `xiaomi/mimo-v2-flash`, `xiaomi-token-plan/mimo-v2.5-pro`                                                                                        |
| TTS par défaut   | `mimo-v2.5-tts`, voix `mimo_default` ; modèle voicedesign `mimo-v2.5-tts-voicedesign`                                                              |

## Bien démarrer

<Steps>
  <Step title="Obtenir la bonne clé">
    Créez une clé de paiement à l’usage dans la [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), ou ouvrez votre page d’abonnement Token Plan et copiez l’URL de base régionale compatible OpenAI ainsi que la clé `tp-...` correspondante.
  </Step>

  <Step title="Exécuter l’onboarding">
    Paiement à l’usage :

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Token Plan :

    ```bash
    openclaw onboard --auth-choice xiaomi-token-plan-sgp
    ```

    Ou passez les clés directement :

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

## Catalogue en paiement à l’usage

| Référence de modèle    | Entrée      | Contexte  | Sortie max. | Raisonnement | Notes             |
| ---------------------- | ----------- | --------- | ----------- | ------------ | ----------------- |
| `xiaomi/mimo-v2-flash` | texte       | 262,144   | 8,192       | Non          | Modèle par défaut |
| `xiaomi/mimo-v2-pro`   | texte       | 1,048,576 | 32,000      | Oui          | Grand contexte    |
| `xiaomi/mimo-v2-omni`  | texte, image | 262,144  | 32,000      | Oui          | Multimodal        |

<Tip>
La référence de modèle par défaut est `xiaomi/mimo-v2-flash`. Le fournisseur est injecté automatiquement lorsque `XIAOMI_API_KEY` est défini ou qu’un profil d’authentification existe.
</Tip>

## Catalogue Token Plan

Choisissez l’option d’authentification Token Plan qui correspond à l’URL de base régionale affichée dans l’interface d’abonnement de Xiaomi :

- `xiaomi-token-plan-cn` -> `https://token-plan-cn.xiaomimimo.com/v1`
- `xiaomi-token-plan-sgp` -> `https://token-plan-sgp.xiaomimimo.com/v1`
- `xiaomi-token-plan-ams` -> `https://token-plan-ams.xiaomimimo.com/v1`

| Référence de modèle              | Entrée      | Contexte  | Sortie max. | Raisonnement | Notes             |
| -------------------------------- | ----------- | --------- | ----------- | ------------ | ----------------- |
| `xiaomi-token-plan/mimo-v2.5-pro` | texte      | 1,048,576 | 131,072     | Oui          | Modèle par défaut |
| `xiaomi-token-plan/mimo-v2.5`     | texte, image | 1,048,576 | 131,072   | Oui          | Multimodal        |

<Tip>
L’onboarding Token Plan valide le format de la clé et avertit lorsqu’une clé `tp-...` est saisie dans le parcours de paiement à l’usage, ou lorsqu’une clé `sk-...` est saisie dans le parcours Token Plan.
</Tip>

## Synthèse vocale

Le plugin `xiaomi` intégré enregistre aussi Xiaomi MiMo comme fournisseur de parole pour
`messages.tts`. Il appelle le contrat TTS de complétions de chat de Xiaomi avec le texte comme
message `assistant` et des indications de style facultatives comme message `user`.

| Propriété | Valeur                                  |
| -------- | ---------------------------------------- |
| ID TTS   | `xiaomi` (alias `mimo`)                  |
| Authentification | `XIAOMI_API_KEY`                 |
| API      | `POST /v1/chat/completions` avec `audio` |
| Par défaut | `mimo-v2.5-tts`, voix `mimo_default`   |
| Sortie   | MP3 par défaut ; WAV lorsque configuré   |

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
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Les voix intégrées prises en charge incluent `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` et `Dean`. Les modèles à voix prédéfinie utilisent `audio.voice`, donc
OpenClaw envoie `speakerVoice` pour `mimo-v2.5-tts` et `mimo-v2-tts`.

Le modèle voicedesign de Xiaomi, `mimo-v2.5-tts-voicedesign`, génère la voix
à partir d’une invite de style en langage naturel plutôt que d’un ID de voix prédéfini. Configurez
`style` avec la description vocale souhaitée ; OpenClaw l’envoie comme message `user`,
envoie le texte à prononcer comme message `assistant` et omet
`audio.voice` pour ce modèle.

```json5
{
  messages: {
    tts: {
      provider: "xiaomi",
      providers: {
        xiaomi: {
          model: "mimo-v2.5-tts-voicedesign",
          format: "wav",
          style: "Warm, natural female voice with clear pronunciation.",
        },
      },
    },
  },
}
```

Pour les cibles de notes vocales telles que Feishu et Telegram, OpenClaw transcode la sortie
Xiaomi en Opus 48 kHz avec `ffmpeg` avant la livraison.

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

Les tarifs et indicateurs de compatibilité proviennent du manifeste du plugin intégré ; l’exemple de configuration omet donc `cost` et `compat` pour éviter de diverger du comportement d’exécution.

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

Les tarifs proviennent du manifeste intégré (les modèles Token Plan incluent une tarification échelonnée des lectures de cache) ; l’exemple de configuration omet donc `cost`.

<AccordionGroup>
  <Accordion title="Comportement d’auto-injection">
    Le fournisseur `xiaomi` est injecté automatiquement lorsque `XIAOMI_API_KEY` est défini dans votre environnement ou qu’un profil d’authentification existe. `xiaomi-token-plan` nécessite une URL de base régionale ; le parcours pris en charge est donc le choix d’onboarding Token Plan intégré ou un bloc de configuration explicite `models.providers.xiaomi-token-plan`.
  </Accordion>

  <Accordion title="Détails des modèles">
    - **mimo-v2-flash** — léger et rapide, idéal pour les tâches de texte généralistes. Pas de prise en charge du raisonnement.
    - **mimo-v2-pro** — prend en charge le raisonnement avec une fenêtre de contexte de 1M de jetons pour les charges de travail sur documents longs.
    - **mimo-v2-omni** — modèle multimodal avec raisonnement activé, qui accepte les entrées texte et image.
    - **mimo-v2.5-pro** — modèle Token Plan par défaut avec la pile de raisonnement V2.5 actuelle de Xiaomi.
    - **mimo-v2.5** — route multimodale V2.5 de Token Plan.

    <Note>
    Les modèles en paiement à l’usage utilisent le préfixe `xiaomi/`. Les modèles Token Plan utilisent le préfixe `xiaomi-token-plan/`.
    </Note>

  </Accordion>

  <Accordion title="Dépannage">
    - Si les modèles n’apparaissent pas, confirmez que la variable d’environnement de clé pertinente ou le profil d’authentification est présent et valide.
    - Pour Token Plan, confirmez que la région d’onboarding choisie correspond à l’URL de base de la page d’abonnement et que la clé commence par `tp-`.
    - Lorsque le Gateway s’exécute comme démon, assurez-vous que la clé est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus Gateway gérés par démon. Utilisez `~/.openclaw/.env` ou la configuration `env.shellEnv` pour une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Tableau de bord Xiaomi MiMo et gestion des clés d’API.
  </Card>
</CardGroup>
