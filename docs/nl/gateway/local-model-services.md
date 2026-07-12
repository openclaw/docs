---
read_when:
    - U wilt dat OpenClaw alleen een lokale modelserver start wanneer de bijbehorende model- of embeddingprovider is geselecteerd
    - Je gebruikt ds4, inferrs, vLLM, llama.cpp, MLX of een andere lokale server die compatibel is met OpenAI
    - Je moet de koude start, gereedheid en uitschakeling bij inactiviteit voor lokale providers beheren
summary: Start lokale modelservers op aanvraag vóór model- en inbeddingsverzoeken van OpenClaw
title: Lokale modelservices
x-i18n:
    generated_at: "2026-07-12T08:50:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` start op aanvraag een lokale modelserver die eigendom is van de provider. Wanneer een model- of embeddingaanvraag die provider selecteert, controleert OpenClaw het statusendpoint, start het proces als het niet actief is, wacht totdat het gereed is en verzendt vervolgens de aanvraag. Gebruik dit om te voorkomen dat kostbare lokale servers de hele dag actief blijven.

## Werking

1. Een model- of embeddingaanvraag wordt toegewezen aan een geconfigureerde provider.
2. Als die provider `localService` heeft, controleert OpenClaw `healthUrl`.
3. Bij een geslaagde controle gebruikt OpenClaw de server die al actief is.
4. Bij een mislukte controle start OpenClaw `command` met `args`.
5. OpenClaw controleert het statusendpoint totdat `readyTimeoutMs` verloopt.
6. De aanvraag verloopt via het normale transport voor modellen of embeddings.
7. Als OpenClaw het proces heeft gestart en `idleStopMs` is ingesteld, stopt het proces nadat er sinds de laatste actieve aanvraag gedurende die tijd geen activiteit is geweest.

OpenClaw installeert hiervoor geen launchd, systemd, Docker of andere daemon. De server is een gewoon onderliggend proces van het OpenClaw-proces dat deze als eerste nodig had.

Het opstarten wordt per geconfigureerde provider en combinatie van opdracht, argumenten en omgevingsvariabelen geserialiseerd, zodat gelijktijdige chat- en embeddingaanvragen voor dezelfde service geen dubbele servers starten. Elke aanvraag behoudt een eigen lease totdat de verwerking van het antwoord is voltooid, zodat bij het afsluiten wegens inactiviteit op alle actieve model- en embeddingaanvragen wordt gewacht. Geconfigureerde provideraliassen blijven afzonderlijk: twee aliassen kunnen naar verschillende GPU-hosts verwijzen zonder te worden samengevoegd onder dezelfde adapter-id voor Ollama, LM Studio of OpenAI-compatibele adapters.

Als een ander OpenClaw-proces al een gezonde server op dezelfde `healthUrl` heeft, hergebruikt dit proces die zonder het beheer ervan over te nemen (elk proces beheert alleen het onderliggende proces dat het zelf heeft gestart). Opstart- en afsluitlogboeken bevatten begrensde, geredigeerde staarten van de uitvoer van het onderliggende proces, plus timing- en afsluitdetails; geconfigureerde omgevingswaarden worden nooit weergegeven.

## Configuratiestructuur

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Stel `timeoutSeconds` in bij de providervermelding (niet bij `localService`), zodat trage koude starts en langdurige generaties niet de standaardtime-out voor modelaanvragen bereiken. Stel altijd expliciet een `healthUrl` in wanneer uw server de gereedheidsstatus ergens anders aanbiedt dan via `/models` op de basis-URL.

## Velden

| Veld             | Vereist | Beschrijving                                                                                                                         |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | ja       | Absoluut pad naar het uitvoerbare bestand. Geen opzoeking via de shell-PATH.                                                         |
| `args`           | nee      | Procesargumenten. Geen shell-expansie, pipes, globbing of aanhalingstekens.                                                          |
| `cwd`            | nee      | Werkmap voor het proces.                                                                                                             |
| `env`            | nee      | Omgevingsvariabelen die over de procesomgeving van OpenClaw heen worden samengevoegd.                                                |
| `healthUrl`      | nee      | Gereedheids-URL. Standaard wordt `/models` aan `baseUrl` toegevoegd (`http://127.0.0.1:8000/v1` wordt `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | nee      | Uiterste termijn voor gereedheid tijdens het opstarten. Standaard: `120000`.                                                         |
| `idleStopMs`     | nee      | Vertraging voor afsluiten wegens inactiviteit van een door OpenClaw gestart proces. Bij `0` of weglaten blijft het actief totdat OpenClaw afsluit. |

## Inferrs-voorbeeld

Inferrs is een aangepaste OpenAI-compatibele `/v1`-backend, zodat dezelfde `localService`-API werkt met een `inferrs`-providervermelding:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Vervang `command` door het resultaat van `which inferrs` op de machine waarop OpenClaw wordt uitgevoerd. Volledige installatie van inferrs: [Inferrs](/nl/providers/inferrs).

## ds4-voorbeeld

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

Volledige installatie, bepaling van de contextgrootte en verificatieopdrachten: [ds4](/nl/providers/ds4).

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Lokale modellen" href="/nl/gateway/local-models" icon="server">
    Installatie van lokale modellen, providerkeuzes en veiligheidsrichtlijnen.
  </Card>
  <Card title="Inferrs" href="/nl/providers/inferrs" icon="cpu">
    Voer OpenClaw uit via de lokale OpenAI-compatibele server van inferrs.
  </Card>
</CardGroup>
