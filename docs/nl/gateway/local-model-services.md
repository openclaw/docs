---
read_when:
    - U wilt dat OpenClaw alleen een lokale modelserver start wanneer het bijbehorende model is geselecteerd
    - Je draait ds4, inferrs, vLLM, llama.cpp, MLX of een andere OpenAI-compatibele lokale server
    - Je moet cold start, gereedheid en afsluiten bij inactiviteit voor lokale providers beheren
summary: Start lokale modelservers op aanvraag vóór modelverzoeken van OpenClaw
title: Lokale modelservices
x-i18n:
    generated_at: "2026-06-27T17:34:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` laat OpenClaw op aanvraag een lokale
modelserver starten die eigendom is van de provider. Het is configuratie op providerniveau: wanneer het geselecteerde model
bij die provider hoort, peilt OpenClaw de service, start het proces als het
endpoint offline is, wacht op gereedheid en verzendt daarna het modelverzoek.

Gebruik dit voor lokale servers die duur zijn om de hele dag actief te houden, of voor
handmatige setups waarbij modelselectie genoeg moet zijn om de backend op te starten.

## Hoe het werkt

1. Een modelverzoek wordt omgezet naar een geconfigureerde provider.
2. Als die provider `localService` heeft, peilt OpenClaw `healthUrl`.
3. Als de peiling slaagt, gebruikt OpenClaw de bestaande server.
4. Als de peiling mislukt, start OpenClaw `command` met `args`.
5. OpenClaw peilt gereedheid totdat `readyTimeoutMs` verloopt.
6. Het modelverzoek wordt verzonden via het normale providertransport.
7. Als OpenClaw het proces heeft gestart en `idleStopMs` positief is, wordt het proces
   gestopt nadat het laatste lopende verzoek zo lang inactief is geweest.

OpenClaw installeert hiervoor geen launchd, systemd, Docker of daemon. De
server is een childproces van het OpenClaw-proces dat deze als eerste nodig had.

## Configuratievorm

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

## Velden

- `command`: absoluut pad naar het uitvoerbare bestand. Shell-lookup wordt niet gebruikt.
- `args`: procesargumenten. Er worden geen shell-expansie, pipes, globbing of regels
  voor aanhalingstekens toegepast.
- `cwd`: optionele werkmap voor het proces.
- `env`: optionele omgevingsvariabelen die over de omgeving van het OpenClaw-proces
  worden samengevoegd.
- `healthUrl`: gereedheids-URL. Als deze wordt weggelaten, voegt OpenClaw `/models` toe aan
  `baseUrl`, zodat `http://127.0.0.1:8000/v1`
  `http://127.0.0.1:8000/v1/models` wordt.
- `readyTimeoutMs`: deadline voor opstartgereedheid. Standaard: `120000`.
- `idleStopMs`: vertraging voor afsluiten bij inactiviteit voor door OpenClaw gestarte processen. `0` of
  weggelaten houdt het proces actief totdat OpenClaw afsluit.

## Inferrs-voorbeeld

Inferrs is een aangepaste OpenAI-compatibele `/v1`-backend, dus dezelfde lokale service-API
werkt met de providervermelding `inferrs`.

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

Vervang `command` door het resultaat van `which inferrs` op de machine waarop
OpenClaw draait.

## ds4-voorbeeld

Zie voor de volledige setup, richtlijnen voor contextgrootte en verificatieopdrachten
[ds4](/nl/providers/ds4).

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

## Operationele opmerkingen

- Eén OpenClaw-proces beheert het childproces dat het heeft gestart. Een ander OpenClaw-proces
  dat dezelfde health-URL al live ziet, hergebruikt deze zonder het proces over te nemen.
- Opstarten wordt per provideropdracht en argumentenset geserialiseerd, zodat gelijktijdige
  verzoeken geen dubbele servers voor dezelfde configuratie starten.
- Actieve streamingantwoorden houden een lease vast; afsluiten bij inactiviteit wacht totdat de afhandeling
  van de antwoordbody is voltooid.
- Gebruik `timeoutSeconds` op trage lokale providers, zodat cold starts en lange generaties
  niet tegen de standaardtime-out voor modelverzoeken aanlopen.
- Gebruik een expliciete `healthUrl` als je server gereedheid ergens anders aanbiedt
  dan `/v1/models`.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Local models" href="/nl/gateway/local-models" icon="server">
    Setup van lokale modellen, providerkeuzes en veiligheidsrichtlijnen.
  </Card>
  <Card title="Inferrs" href="/nl/providers/inferrs" icon="cpu">
    Voer OpenClaw uit via de inferrs OpenAI-compatibele lokale server.
  </Card>
</CardGroup>
