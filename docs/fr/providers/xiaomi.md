---
read_when:
    - Vous souhaitez des modèles Xiaomi MiMo dans OpenClaw
    - Vous devez configurer `XIAOMI_API_KEY`
summary: Utiliser les modèles Xiaomi MiMo avec OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo est la plateforme API pour les modèles **MiMo**. OpenClaw utilise le point de terminaison compatible OpenAI de Xiaomi avec une authentification par clé API.

| Propriété | Valeur                          |
| --------- | ------------------------------- |
| Fournisseur | `xiaomi`                      |
| Auth     | `XIAOMI_API_KEY`                |
| API      | Compatible OpenAI               |
| URL de base | `https://api.xiaomimimo.com/v1` |

## Prise en main

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API dans la [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Ou transmettez directement la clé :

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Catalogue intégré

| Référence du modèle    | Entrée      | Contexte  | Sortie max | Raisonnement | Notes          |
| ---------------------- | ----------- | --------- | ---------- | ------------ | -------------- |
| `xiaomi/mimo-v2-flash` | texte       | 262,144   | 8,192      | Non          | Modèle par défaut |
| `xiaomi/mimo-v2-pro`   | texte       | 1,048,576 | 32,000     | Oui          | Grand contexte |
| `xiaomi/mimo-v2-omni`  | texte, image | 262,144  | 32,000     | Oui          | Multimodal     |

<Tip>
La référence de modèle par défaut est `xiaomi/mimo-v2-flash`. Le fournisseur est injecté automatiquement lorsque `XIAOMI_API_KEY` est défini ou qu’un profil d’authentification existe.
</Tip>

## Synthèse vocale

Le Plugin `xiaomi` inclus enregistre également Xiaomi MiMo comme fournisseur vocal pour
`messages.tts`. Il appelle le contrat TTS de chat-completions de Xiaomi avec le texte comme
message `assistant` et des indications de style facultatives comme message `user`.

| Propriété | Valeur                                   |
| --------- | ---------------------------------------- |
| ID TTS    | `xiaomi` (alias `mimo`)                  |
| Auth      | `XIAOMI_API_KEY`                         |
| API       | `POST /v1/chat/completions` avec `audio` |
| Par défaut | `mimo-v2.5-tts`, voix `mimo_default`    |
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
`Mia`, `Chloe`, `Milo` et `Dean`. `mimo-v2-tts` est pris en charge pour les anciens comptes TTS MiMo ;
la configuration par défaut utilise le modèle TTS MiMo-V2.5 actuel. Pour les cibles de notes vocales
telles que Feishu et Telegram, OpenClaw transcode la sortie Xiaomi en Opus 48 kHz
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
  <Accordion title="Comportement d’injection automatique">
    Le fournisseur `xiaomi` est injecté automatiquement lorsque `XIAOMI_API_KEY` est défini dans votre environnement ou qu’un profil d’authentification existe. Vous n’avez pas besoin de configurer manuellement le fournisseur, sauf si vous souhaitez remplacer les métadonnées du modèle ou l’URL de base.
  </Accordion>

  <Accordion title="Détails du modèle">
    - **mimo-v2-flash** — léger et rapide, idéal pour les tâches de texte générales. Pas de prise en charge du raisonnement.
    - **mimo-v2-pro** — prend en charge le raisonnement avec une fenêtre de contexte de 1M de tokens pour les charges de travail sur de longs documents.
    - **mimo-v2-omni** — modèle multimodal avec raisonnement activé qui accepte à la fois les entrées texte et image.

    <Note>
    Tous les modèles utilisent le préfixe `xiaomi/` (par exemple `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Dépannage">
    - Si les modèles n’apparaissent pas, confirmez que `XIAOMI_API_KEY` est défini et valide.
    - Lorsque le Gateway s’exécute comme daemon, assurez-vous que la clé est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus Gateway gérés comme daemon. Utilisez `~/.openclaw/.env` ou la configuration `env.shellEnv` pour une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Tableau de bord Xiaomi MiMo et gestion des clés API.
  </Card>
</CardGroup>
