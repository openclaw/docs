---
read_when:
    - Sie möchten, dass OpenClaw einen lokalen Modellserver nur dann startet, wenn dessen Modell ausgewählt ist.
    - Sie betreiben ds4, inferrs, vLLM, llama.cpp, MLX oder einen anderen OpenAI-kompatiblen lokalen Server
    - Sie müssen Kaltstart, Bereitschaft und Leerlaufabschaltung für lokale Provider steuern
summary: Lokale Modellserver bei Bedarf vor OpenClaw-Modellanfragen starten
title: Lokale Modelldienste
x-i18n:
    generated_at: "2026-05-10T19:36:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` ermöglicht OpenClaw, bei Bedarf einen Provider-eigenen lokalen
Modellserver zu starten. Es handelt sich um eine Konfiguration auf Provider-Ebene: Wenn das ausgewählte Modell
zu diesem Provider gehört, prüft OpenClaw den Dienst, startet den Prozess, falls der
Endpoint nicht erreichbar ist, wartet auf die Bereitschaft und sendet dann die Modellanfrage.

Verwenden Sie dies für lokale Server, deren dauerhafter Betrieb den ganzen Tag über teuer ist, oder für
manuelle Setups, bei denen die Modellauswahl ausreichen soll, um das Backend zu starten.

## Funktionsweise

1. Eine Modellanfrage wird einem konfigurierten Provider zugeordnet.
2. Wenn dieser Provider `localService` hat, prüft OpenClaw `healthUrl`.
3. Wenn die Prüfung erfolgreich ist, verwendet OpenClaw den vorhandenen Server.
4. Wenn die Prüfung fehlschlägt, startet OpenClaw `command` mit `args`.
5. OpenClaw fragt die Bereitschaft ab, bis `readyTimeoutMs` abläuft.
6. Die Modellanfrage wird über den normalen Provider-Transport gesendet.
7. Wenn OpenClaw den Prozess gestartet hat und `idleStopMs` positiv ist, wird der Prozess
   beendet, nachdem die letzte laufende Anfrage für diesen Zeitraum inaktiv war.

OpenClaw installiert hierfür kein launchd, systemd, Docker oder einen Daemon. Der
Server ist ein Kindprozess des OpenClaw-Prozesses, der ihn zuerst benötigt hat.

## Konfigurationsstruktur

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

## Felder

- `command`: absoluter Pfad zur ausführbaren Datei. Shell-Suche wird nicht verwendet.
- `args`: Prozessargumente. Es werden keine Shell-Erweiterung, Pipes, Globbing- oder Quoting-
  Regeln angewendet.
- `cwd`: optionales Arbeitsverzeichnis für den Prozess.
- `env`: optionale Umgebungsvariablen, die über die Umgebung des OpenClaw-Prozesses
  gelegt werden.
- `healthUrl`: Bereitschafts-URL. Wenn weggelassen, hängt OpenClaw `/models` an
  `baseUrl` an, sodass aus `http://127.0.0.1:8000/v1`
  `http://127.0.0.1:8000/v1/models` wird.
- `readyTimeoutMs`: Frist für die Startbereitschaft. Standard: `120000`.
- `idleStopMs`: Verzögerung für das Herunterfahren bei Inaktivität für von OpenClaw gestartete Prozesse. `0` oder
  Weglassen hält den Prozess am Leben, bis OpenClaw beendet wird.

## Inferrs-Beispiel

Inferrs ist ein benutzerdefiniertes OpenAI-kompatibles `/v1`-Backend, daher funktioniert dieselbe lokale Dienst-
API mit dem `inferrs`-Provider-Eintrag.

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

Ersetzen Sie `command` durch das Ergebnis von `which inferrs` auf der Maschine, auf der
OpenClaw ausgeführt wird.

## ds4-Beispiel

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

## Betriebshinweise

- Ein OpenClaw-Prozess verwaltet den von ihm gestarteten Kindprozess. Ein anderer OpenClaw-Prozess,
  der dieselbe Health-URL bereits aktiv sieht, verwendet sie wieder, ohne sie zu übernehmen.
- Der Start wird pro Provider-Befehl und Argumentgruppe serialisiert, sodass gleichzeitige
  Anfragen keine doppelten Server für dieselbe Konfiguration erzeugen.
- Aktive Streaming-Antworten halten eine Lease; das Herunterfahren bei Inaktivität wartet, bis die Verarbeitung des
  Antwort-Bodys abgeschlossen ist.
- Verwenden Sie `timeoutSeconds` bei langsamen lokalen Providern, damit Kaltstarts und lange Generierungen
  nicht das Standard-Timeout für Modellanfragen erreichen.
- Verwenden Sie eine explizite `healthUrl`, wenn Ihr Server die Bereitschaft an einer anderen Stelle als
  `/v1/models` bereitstellt.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Lokale Modelle" href="/de/gateway/local-models" icon="server">
    Einrichtung lokaler Modelle, Provider-Auswahl und Sicherheitsleitfaden.
  </Card>
  <Card title="Inferrs" href="/de/providers/inferrs" icon="cpu">
    Führen Sie OpenClaw über den inferrs OpenAI-kompatiblen lokalen Server aus.
  </Card>
</CardGroup>
