---
read_when:
    - Vous souhaitez utiliser les modèles Xiaomi MiMo dans OpenClaw
    - Vous devez configurer XIAOMI_API_KEY
summary: Utiliser les modèles Xiaomi MiMo avec OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-05-06T07:37:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7bb33bf107cb44414b0f3a6140d60fdfecb3b7154c3197e7cbed982d9a6450b
    source_path: providers/xiaomi.md
    workflow: 16
---

Xiaomi MiMo est la plateforme d’API pour les modèles **MiMo**. OpenClaw inclut un plugin `xiaomi` intégré qui enregistre à la fois un fournisseur de chat compatible OpenAI et un fournisseur de synthèse vocale (TTS) avec le même `XIAOMI_API_KEY`.

| Propriété       | Valeur                                   |
| --------------- | ---------------------------------------- |
| ID du fournisseur | `xiaomi`                               |
| Plugin          | intégré, `enabledByDefault: true`        |
| Variable d’env. d’authentification | `XIAOMI_API_KEY`       |
| Option d’onboarding | `--auth-choice xiaomi-api-key`       |
| Option CLI directe | `--xiaomi-api-key <key>`              |
| Contrats        | complétions de chat + `speechProviders`  |
| API             | compatible OpenAI (`openai-completions`) |
| URL de base     | `https://api.xiaomimimo.com/v1`          |
| Modèle par défaut | `xiaomi/mimo-v2-flash`                |
| TTS par défaut  | `mimo-v2.5-tts`, voix `mimo_default`     |

## Premiers pas

<Steps>
  <Step title="Get an API key">
    Créez une clé d’API dans la [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Ou transmettez directement la clé :

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Catalogue intégré

| Réf. de modèle         | Entrée      | Contexte  | Sortie max. | Raisonnement | Notes              |
| ---------------------- | ----------- | --------- | ----------- | ------------ | ------------------ |
| `xiaomi/mimo-v2-flash` | texte       | 262,144   | 8,192       | Non          | Modèle par défaut  |
| `xiaomi/mimo-v2-pro`   | texte       | 1,048,576 | 32,000      | Oui          | Grand contexte     |
| `xiaomi/mimo-v2-omni`  | texte, image | 262,144  | 32,000      | Oui          | Multimodal         |

<Tip>
La référence de modèle par défaut est `xiaomi/mimo-v2-flash`. Le fournisseur est injecté automatiquement lorsque `XIAOMI_API_KEY` est défini ou lorsqu’un profil d’authentification existe.
</Tip>

## Synthèse vocale

Le plugin `xiaomi` intégré enregistre également Xiaomi MiMo comme fournisseur de synthèse vocale pour
`messages.tts`. Il appelle le contrat TTS de complétions de chat de Xiaomi avec le texte comme
message `assistant` et des indications de style facultatives comme message `user`.

| Propriété | Valeur                                   |
| --------- | ---------------------------------------- |
| ID TTS    | `xiaomi` (alias `mimo`)                  |
| Authentification | `XIAOMI_API_KEY`                  |
| API       | `POST /v1/chat/completions` avec `audio` |
| Par défaut | `mimo-v2.5-tts`, voix `mimo_default`   |
| Sortie    | MP3 par défaut ; WAV si configuré        |

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
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Les voix intégrées prises en charge incluent `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` et `Dean`. `mimo-v2-tts` est pris en charge pour les anciens comptes MiMo
TTS ; la valeur par défaut utilise le modèle TTS MiMo-V2.5 actuel. Pour les cibles de notes vocales
comme Feishu et Telegram, OpenClaw transcode la sortie Xiaomi en Opus 48 kHz
avec `ffmpeg` avant la livraison.

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
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Auto-injection behavior">
    Le fournisseur `xiaomi` est injecté automatiquement lorsque `XIAOMI_API_KEY` est défini dans votre environnement ou lorsqu’un profil d’authentification existe. Vous n’avez pas besoin de configurer manuellement le fournisseur, sauf si vous voulez remplacer les métadonnées du modèle ou l’URL de base.
  </Accordion>

  <Accordion title="Model details">
    - **mimo-v2-flash** — léger et rapide, idéal pour les tâches textuelles généralistes. Pas de prise en charge du raisonnement.
    - **mimo-v2-pro** — prend en charge le raisonnement avec une fenêtre de contexte de 1M de tokens pour les charges de travail sur de longs documents.
    - **mimo-v2-omni** — modèle multimodal avec raisonnement qui accepte à la fois les entrées texte et image.

    <Note>
    Tous les modèles utilisent le préfixe `xiaomi/` (par exemple `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Si les modèles n’apparaissent pas, vérifiez que `XIAOMI_API_KEY` est défini et valide.
    - Lorsque le Gateway s’exécute comme daemon, assurez-vous que la clé est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus Gateway gérés par daemon. Utilisez `~/.openclaw/.env` ou la configuration `env.shellEnv` pour une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de bascule.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration OpenClaw.
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Tableau de bord Xiaomi MiMo et gestion des clés d’API.
  </Card>
</CardGroup>
