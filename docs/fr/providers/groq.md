---
read_when:
    - Vous voulez utiliser Groq avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou de l’option d’authentification CLI
summary: Configuration de Groq (authentification + sélection du modèle)
title: Groq
x-i18n:
    generated_at: "2026-05-02T07:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fournit une inférence ultra-rapide sur des modèles open source
(Llama, Gemma, Mistral, et plus encore) au moyen d’un matériel LPU personnalisé. OpenClaw se connecte
à Groq via son API compatible avec OpenAI.

| Propriété | Valeur           |
| -------- | ----------------- |
| Fournisseur | `groq`            |
| Authentification | `GROQ_API_KEY`    |
| API      | compatible avec OpenAI |

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

OpenClaw fournit un catalogue Groq basé sur un manifeste pour une liste rapide
des modèles filtrée par fournisseur. Exécutez `openclaw models list --all --provider groq` pour voir les lignes
incluses, ou consultez
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modèle                      | Notes                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Polyvalent, grand contexte         |
| **Llama 3.1 8B Instant**    | Rapide, léger                      |
| **Gemma 2 9B**              | Compact, efficace                  |
| **Mixtral 8x7B**            | Architecture MoE, raisonnement solide |

<Tip>
Utilisez `openclaw models list --all --provider groq` pour les lignes Groq
basées sur le manifeste connues de cette version d’OpenClaw.
</Tip>

## Modèles de raisonnement

OpenClaw associe ses niveaux `/think` partagés aux valeurs `reasoning_effort`
propres aux modèles de Groq. Pour `qwen/qwen3-32b`, le raisonnement désactivé envoie
`none` et le raisonnement activé envoie `default`. Pour les modèles de raisonnement Groq GPT-OSS,
OpenClaw envoie `low`, `medium` ou `high` ; lorsque le raisonnement est désactivé, il omet
`reasoning_effort`, car ces modèles ne prennent pas en charge une valeur désactivée.

## Transcription audio

Groq fournit également une transcription audio rapide basée sur Whisper. Lorsqu’il est configuré comme
fournisseur de compréhension des médias, OpenClaw utilise le modèle `whisper-large-v3-turbo`
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
    | Point de terminaison API | `/audio/transcriptions` compatible avec OpenAI |
  </Accordion>

  <Accordion title="Environment note">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `GROQ_API_KEY` est
    disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus
    de gateway gérés par un daemon. Utilisez la configuration `~/.openclaw/.env` ou `env.shellEnv` pour
    une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Configuration reference" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les paramètres de fournisseur et d’audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Tableau de bord Groq, documentation de l’API et tarification.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    Catalogue officiel des modèles Groq.
  </Card>
</CardGroup>
