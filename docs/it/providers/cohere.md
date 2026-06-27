---
read_when:
    - Vuoi usare Cohere con OpenClaw
    - È necessaria la variabile d'ambiente della chiave API Cohere o la scelta di autenticazione CLI
summary: Configurazione di Cohere (autenticazione + selezione del modello)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:06:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) fornisce inferenza compatibile con OpenAI tramite la sua API di compatibilità. OpenClaw include il provider Cohere durante la sua transizione all’esternalizzazione e lo pubblica anche come Plugin esterno ufficiale con il catalogo modelli Command A.

| Proprietà       | Valore                                               |
| --------------- | ---------------------------------------------------- |
| ID provider     | `cohere`                                             |
| Plugin          | incluso durante la transizione; pacchetto esterno ufficiale |
| Variabile env di autenticazione | `COHERE_API_KEY`                         |
| Flag di onboarding | `--auth-choice cohere-api-key`                    |
| Flag CLI diretto | `--cohere-api-key <key>`                            |
| API             | compatibile con OpenAI (`openai-completions`)        |
| URL base        | `https://api.cohere.ai/compatibility/v1`             |
| Modello predefinito | `cohere/command-a-03-2025`                       |

## Inizia

1. Cohere è incluso nei pacchetti OpenClaw attuali. Se non è disponibile, installa il pacchetto esterno e riavvia il Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Crea una chiave API Cohere.
3. Esegui l’onboarding:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Conferma che il catalogo sia disponibile:

```bash
openclaw models list --provider cohere
```

Il modello predefinito viene impostato solo quando non è già configurato alcun modello principale.

## Configurazione solo tramite ambiente

Rendi `COHERE_API_KEY` disponibile al processo Gateway, quindi seleziona il modello Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Se il Gateway viene eseguito come daemon o in Docker, configura `COHERE_API_KEY` per quel servizio. Esportarla solo in una shell interattiva non la rende disponibile a un Gateway già in esecuzione.
</Note>

## Correlati

- [Provider di modelli](/it/concepts/model-providers)
- [CLI dei modelli](/it/cli/models)
- [Directory dei provider](/it/providers)
