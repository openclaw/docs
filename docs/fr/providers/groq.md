---
read_when:
    - Vous souhaitez utiliser Groq avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de Groq (authentification + sélection du modèle)
title: Groq
x-i18n:
    generated_at: "2026-04-30T07:43:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fournit une inférence ultrarapide sur des modèles à code source ouvert
(Llama, Gemma, Mistral et d’autres) à l’aide de matériel LPU personnalisé. OpenClaw se connecte
à Groq via son API compatible avec OpenAI.

| Propriété | Valeur            |
| -------- | ----------------- |
| Fournisseur | `groq`            |
| Auth     | `GROQ_API_KEY`    |
| API      | Compatible avec OpenAI |

## Premiers pas

<Steps>
  <Step title="Get an API key">
    Créez une clé API sur [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Exemple de fichier de configuration

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Catalogue intégré

Le catalogue de modèles de Groq change fréquemment. Exécutez `openclaw models list | grep groq`
pour voir les modèles actuellement disponibles, ou consultez
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modèle                      | Notes                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Usage général, grand contexte      |
| **Llama 3.1 8B Instant**    | Rapide, léger                      |
| **Gemma 2 9B**              | Compact, efficace                  |
| **Mixtral 8x7B**            | Architecture MoE, raisonnement solide |

<Tip>
Utilisez `openclaw models list --provider groq` pour obtenir la liste la plus à jour des
modèles disponibles sur votre compte.
</Tip>

## Modèles de raisonnement

OpenClaw associe ses niveaux `/think` partagés aux valeurs `reasoning_effort`
propres aux modèles de Groq. Pour `qwen/qwen3-32b`, la réflexion désactivée envoie
`none` et la réflexion activée envoie `default`. Pour les modèles de raisonnement Groq GPT-OSS,
OpenClaw envoie `low`, `medium` ou `high` ; la réflexion désactivée omet
`reasoning_effort`, car ces modèles ne prennent pas en charge de valeur désactivée.

## Transcription audio

Groq fournit également une transcription audio rapide fondée sur Whisper. Lorsqu’il est configuré comme
fournisseur de compréhension multimédia, OpenClaw utilise le modèle `whisper-large-v3-turbo`
de Groq pour transcrire les messages vocaux via la surface partagée `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Audio transcription details">
    | Propriété | Valeur |
    |----------|-------|
    | Chemin de configuration partagé | `tools.media.audio` |
    | URL de base par défaut | `https://api.groq.com/openai/v1` |
    | Modèle par défaut | `whisper-large-v3-turbo` |
    | Point de terminaison d’API | `/audio/transcriptions` compatible avec OpenAI |
  </Accordion>

  <Accordion title="Environment note">
    Si le Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `GROQ_API_KEY` est
    disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus
    Gateway gérés par un démon. Utilisez la configuration `~/.openclaw/.env` ou `env.shellEnv` pour
    une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet incluant les paramètres de fournisseur et audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Tableau de bord Groq, documentation API et tarifs.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    Catalogue officiel des modèles Groq.
  </Card>
</CardGroup>
