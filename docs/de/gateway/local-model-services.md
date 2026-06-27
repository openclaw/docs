---
read_when:
    - Sie möchten, dass OpenClaw einen lokalen Modellserver nur dann startet, wenn das zugehörige Modell ausgewählt ist.
    - Sie betreiben ds4, inferrs, vLLM, llama.cpp, MLX oder einen anderen OpenAI-kompatiblen lokalen Server
    - Sie müssen Kaltstart, Bereitschaft und Leerlaufabschaltung für lokale Provider steuern
summary: Lokale Modellserver bei Bedarf vor OpenClaw-Modellanfragen starten
title: Lokale Modelldienste
x-i18n:
    generated_at: "2026-06-27T17:30:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` ermöglicht OpenClaw, bei Bedarf einen provider-eigenen lokalen
Modellserver zu starten. Es handelt sich um Konfiguration auf Provider-Ebene: Wenn das ausgewählte Modell
zu diesem Provider gehört, prüft OpenClaw den Dienst, startet den Prozess, falls der
Endpunkt nicht erreichbar ist, wartet auf Betriebsbereitschaft und sendet dann die Modellanfrage.

Verwenden Sie dies für lokale Server, deren dauerhafter Betrieb den ganzen Tag über zu aufwendig wäre, oder für
manuelle Setups, bei denen die Modellauswahl ausreichen soll, um das Backend zu starten.

## Funktionsweise

1. Eine Modellanfrage wird einem konfigurierten Provider zugeordnet.
2. Wenn dieser Provider `localService` hat, prüft OpenClaw `healthUrl`.
3. Wenn die Prüfung erfolgreich ist, verwendet OpenClaw den vorhandenen Server.
4. Wenn die Prüfung fehlschlägt, startet OpenClaw `command` mit `args`.
5. OpenClaw fragt die Betriebsbereitschaft ab, bis `readyTimeoutMs` abläuft.
6. Die Modellanfrage wird über den normalen Provider-Transport gesendet.
7. Wenn OpenClaw den Prozess gestartet hat und `idleStopMs` positiv ist, wird der Prozess
   gestoppt, nachdem die letzte laufende Anfrage so lange inaktiv war.

OpenClaw installiert dafür kein launchd, systemd, Docker oder einen Daemon. Der
Server ist ein Kindprozess des OpenClaw-Prozesses, der ihn zuerst benötigt hat.

## Konfigurationsform

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
- `args`: Prozessargumente. Es werden keine Shell-Erweiterung, Pipes, Globbing oder
  Maskierungsregeln angewendet.
- `cwd`: optionales Arbeitsverzeichnis für den Prozess.
- `env`: optionale Umgebungsvariablen, die über die Umgebung des OpenClaw-Prozesses
  gelegt werden.
- `healthUrl`: URL für die Betriebsbereitschaft. Wenn ausgelassen, hängt OpenClaw `/models` an
  `baseUrl` an, sodass aus `http://127.0.0.1:8000/v1`
  `http://127.0.0.1:8000/v1/models` wird.
- `readyTimeoutMs`: Frist für die Betriebsbereitschaft beim Start. Standard: `120000`.
- `idleStopMs`: Verzögerung für das Beenden von durch OpenClaw gestarteten Prozessen im Leerlauf. `0` oder
  Auslassen hält den Prozess am Leben, bis OpenClaw beendet wird.

## Inferrs-Beispiel

Inferrs ist ein benutzerdefiniertes OpenAI-kompatibles `/v1`-Backend, daher funktioniert dieselbe lokale Dienst-API
mit dem Provider-Eintrag `inferrs`.

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

Ersetzen Sie `command` durch das Ergebnis von `which inferrs` auf dem Rechner, auf dem
OpenClaw ausgeführt wird.

## ds4-Beispiel

Das vollständige Setup, Hinweise zur Kontextgröße und Prüfungsbefehle finden Sie unter
[ds4](/de/providers/ds4).

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

## Betriebshinweise

- Ein OpenClaw-Prozess verwaltet den Kindprozess, den er gestartet hat. Ein anderer OpenClaw-Prozess,
  der dieselbe Health-URL bereits aktiv sieht, verwendet sie wieder, ohne sie zu übernehmen.
- Der Start wird pro Provider-Befehl und Argumentmenge serialisiert, sodass gleichzeitige
  Anfragen keine doppelten Server für dieselbe Konfiguration erzeugen.
- Aktive Streaming-Antworten halten eine Lease; das Beenden im Leerlauf wartet, bis die Verarbeitung
  des Antworttexts abgeschlossen ist.
- Verwenden Sie `timeoutSeconds` bei langsamen lokalen Providern, damit Kaltstarts und lange Generierungen
  nicht in das standardmäßige Zeitlimit für Modellanfragen laufen.
- Verwenden Sie eine explizite `healthUrl`, wenn Ihr Server die Betriebsbereitschaft an einer anderen Stelle
  als `/v1/models` bereitstellt.

## Verwandt

<CardGroup cols={2}>
  <Card title="Local models" href="/de/gateway/local-models" icon="server">
    Einrichtung lokaler Modelle, Provider-Auswahl und Sicherheitshinweise.
  </Card>
  <Card title="Inferrs" href="/de/providers/inferrs" icon="cpu">
    Führen Sie OpenClaw über den inferrs OpenAI-kompatiblen lokalen Server aus.
  </Card>
</CardGroup>
