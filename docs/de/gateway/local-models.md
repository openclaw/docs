---
read_when:
    - Sie möchten Modelle auf Ihrem eigenen GPU-Rechner bereitstellen
    - Sie binden LM Studio oder einen OpenAI-kompatiblen Proxy ein
    - Sie benötigen die sichersten Empfehlungen für lokale Modelle
summary: OpenClaw auf lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-04-30T09:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Lokal ist machbar, aber OpenClaw erwartet großen Kontext und starke Abwehr gegen Prompt-Injection. Kleinere Karten beschneiden den Kontext und schwächen die Sicherheit. Zielen Sie hoch: **≥2 voll ausgebaute Mac Studios oder ein vergleichbares GPU-Rig (~30.000 $+)**. Eine einzelne **24-GB**-GPU funktioniert nur für leichtere Prompts mit höherer Latenz. Verwenden Sie die **größte / vollwertige Modellvariante, die Sie betreiben können**; stark quantisierte oder „kleine“ Checkpoints erhöhen das Prompt-Injection-Risiko (siehe [Sicherheit](/de/gateway/security)).

Wenn Sie das lokale Setup mit der geringsten Reibung wünschen, beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`. Diese Seite ist der meinungsstarke Leitfaden für höherwertige lokale Stacks und benutzerdefinierte OpenAI-kompatible lokale Server.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-Benutzer:** Der offizielle Ollama-Linux-Installer aktiviert einen systemd-Dienst mit `Restart=always`. Bei WSL2-GPU-Setups kann der Autostart beim Booten das zuletzt verwendete Modell erneut laden und Host-Speicher belegen. Wenn Ihre WSL2-VM nach dem Aktivieren von Ollama wiederholt neu startet, siehe [WSL2-Absturzschleife](/de/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Empfohlen: LM Studio + großes lokales Modell (Responses API)

Der derzeit beste lokale Stack. Laden Sie ein großes Modell in LM Studio (zum Beispiel einen vollwertigen Qwen-, DeepSeek- oder Llama-Build), aktivieren Sie den lokalen Server (Standard `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um Reasoning von finalem Text getrennt zu halten.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Setup-Checkliste**

- Installieren Sie LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Laden Sie in LM Studio den **größten verfügbaren Modell-Build** herunter (vermeiden Sie „kleine“/stark quantisierte Varianten), starten Sie den Server und bestätigen Sie, dass `http://127.0.0.1:1234/v1/models` ihn auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Lassen Sie das Modell geladen; Kaltladen erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, falls Ihr LM-Studio-Build abweicht.
- Bleiben Sie für WhatsApp bei der Responses API, damit nur finaler Text gesendet wird.

Behalten Sie gehostete Modelle auch bei lokaler Ausführung konfiguriert; verwenden Sie `models.mode: "merge"`, damit Fallbacks verfügbar bleiben.

### Hybridkonfiguration: gehostetes Primärmodell, lokaler Fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Lokal zuerst mit gehostetem Sicherheitsnetz

Tauschen Sie die Reihenfolge von Primärmodell und Fallbacks; behalten Sie denselben Provider-Block und `models.mode: "merge"` bei, damit Sie auf Sonnet oder Opus zurückfallen können, wenn die lokale Maschine nicht verfügbar ist.

### Regionales Hosting / Datenrouting

- Gehostete MiniMax-/Kimi-/GLM-Varianten gibt es auch auf OpenRouter mit regional festgelegten Endpunkten (z. B. in den USA gehostet). Wählen Sie dort die regionale Variante aus, um Traffic in Ihrer gewünschten Jurisdiktion zu halten, während Sie weiterhin `models.mode: "merge"` für Anthropic-/OpenAI-Fallbacks verwenden.
- Nur lokal bleibt der stärkste Datenschutzpfad; gehostetes regionales Routing ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber Kontrolle über den Datenfluss wünschen.

## Andere OpenAI-kompatible lokale Proxys

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy oder benutzerdefinierte
Gateways funktionieren, wenn sie einen OpenAI-artigen `/v1/chat/completions`-
Endpunkt bereitstellen. Verwenden Sie den Chat-Completions-Adapter, sofern das Backend nicht ausdrücklich
Unterstützung für `/v1/responses` dokumentiert. Ersetzen Sie den obigen Provider-Block durch Ihren
Endpunkt und Ihre Modell-ID:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Wenn `api` bei einem benutzerdefinierten Provider mit `baseUrl` ausgelassen wird, verwendet OpenClaw standardmäßig
`openai-completions`. Loopback-Endpunkte wie `127.0.0.1` werden
automatisch vertraut; LAN-, Tailnet- und private DNS-Endpunkte benötigen weiterhin
`request.allowPrivateNetwork: true`.

Der Wert `models.providers.<id>.models[].id` ist Provider-lokal. Fügen Sie dort
nicht das Provider-Präfix ein. Zum Beispiel sollte ein MLX-Server, der mit
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` gestartet wurde, diese
Katalog-ID und Modellreferenz verwenden:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Setzen Sie `input: ["text", "image"]` bei lokalen oder proxied Vision-Modellen, damit Bildanhänge
in Agent-Turns eingefügt werden. Interaktives Onboarding für benutzerdefinierte Provider
erkennt häufige Vision-Modell-IDs und fragt nur nach unbekannten Namen.
Nicht interaktives Onboarding verwendet dieselbe Erkennung; verwenden Sie `--custom-image-input`
für unbekannte Vision-IDs oder `--custom-text-input`, wenn ein bekannt wirkendes Modell hinter
Ihrem Endpunkt nur Text unterstützt.

Behalten Sie `models.mode: "merge"` bei, damit gehostete Modelle als Fallbacks verfügbar bleiben.
Verwenden Sie `models.providers.<id>.timeoutSeconds` für langsame lokale oder Remote-Modellserver,
bevor Sie `agents.defaults.timeoutSeconds` erhöhen. Das Provider-Timeout
gilt nur für Modell-HTTP-Anfragen, einschließlich Verbindungsaufbau, Header, Body-Streaming
und dem gesamten guarded-fetch-Abbruch.

<Note>
Für benutzerdefinierte OpenAI-kompatible Provider wird das Speichern einer nicht geheimen lokalen Markierung wie `apiKey: "ollama-local"` akzeptiert, wenn `baseUrl` zu Loopback, einem privaten LAN, `.local` oder einem bloßen Hostnamen aufgelöst wird. OpenClaw behandelt sie als gültige lokale Anmeldedaten, statt einen fehlenden Schlüssel zu melden. Verwenden Sie einen echten Wert für jeden Provider, der einen öffentlichen Hostnamen akzeptiert.
</Note>

Verhaltenshinweis für lokale/proxied `/v1`-Backends:

- OpenClaw behandelt diese als proxyartige OpenAI-kompatible Routen, nicht als native
  OpenAI-Endpunkte
- native rein OpenAI-spezifische Anfrageformung gilt hier nicht: kein
  `service_tier`, kein Responses-`store`, keine OpenAI-Reasoning-Kompatibilitäts-Payload-
  Formung und keine Prompt-Cache-Hinweise
- versteckte OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`)
  werden bei diesen benutzerdefinierten Proxy-URLs nicht eingefügt

Kompatibilitätshinweise für strengere OpenAI-kompatible Backends:

- Einige Server akzeptieren bei Chat Completions nur Zeichenketten in `messages[].content`, keine
  strukturierten Content-Part-Arrays. Setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true` für
  diese Endpunkte.
- Einige lokale Modelle geben eigenständige geklammerte Tool-Anfragen als Text aus, etwa
  `[tool_name]` gefolgt von JSON und `[END_TOOL_REQUEST]`. OpenClaw wandelt
  diese nur dann in echte Tool-Aufrufe um, wenn der Name exakt mit einem registrierten
  Tool für den Turn übereinstimmt; andernfalls wird der Block als nicht unterstützter Text behandelt und vor
  benutzersichtbaren Antworten verborgen.
- Wenn ein Modell JSON, XML oder Text im ReAct-Stil ausgibt, der wie ein Tool-Aufruf aussieht,
  der Provider aber keine strukturierte Invocation ausgegeben hat, belässt OpenClaw ihn als
  Text und protokolliert eine Warnung mit Run-ID, Provider/Modell, erkanntem Muster und
  Tool-Namen, sofern verfügbar. Behandeln Sie das als Tool-Call-Inkompatibilität des
  Providers/Modells, nicht als abgeschlossenen Tool-Lauf.
- Wenn Tools als Assistant-Text erscheinen, statt ausgeführt zu werden, zum Beispiel rohes JSON,
  XML, ReAct-Syntax oder ein leeres `tool_calls`-Array in der Provider-Antwort,
  prüfen Sie zuerst, ob der Server ein chat template/einen Parser verwendet, der Tool-Aufrufe unterstützt. Für
  OpenAI-kompatible Chat-Completions-Backends, deren Parser nur funktioniert, wenn Tool-Nutzung
  erzwungen wird, setzen Sie eine Anfrageüberschreibung pro Modell, statt sich auf Text-
  Parsing zu verlassen:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Verwenden Sie dies nur für Modelle/Sitzungen, bei denen jeder normale Turn ein Tool aufrufen soll.
  Es überschreibt OpenClaws Standard-Proxywert `tool_choice: "auto"`.
  Ersetzen Sie `local/my-local-model` durch die exakte Provider/Modell-Referenz, die von
  `openclaw models list` angezeigt wird.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Wenn ein benutzerdefiniertes OpenAI-kompatibles Modell OpenAI-Reasoning-Efforts über
  das integrierte Profil hinaus akzeptiert, deklarieren Sie diese im Modell-Compat-Block. Das Hinzufügen von `"xhigh"`
  hier sorgt dafür, dass `/think xhigh`, Sitzungsauswahlen, Gateway-Validierung und `llm-task`-
  Validierung die Stufe für diese konfigurierte Provider/Modell-Referenz verfügbar machen:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Einige kleinere oder strengere lokale Backends sind mit OpenClaws vollständiger
  Agent-Runtime-Promptform instabil, insbesondere wenn Tool-Schemas enthalten sind. Prüfen Sie zuerst
  den Provider-Pfad mit dem schlanken lokalen Testlauf:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Um die Gateway-Route ohne die vollständige Agent-Promptform zu prüfen, verwenden Sie stattdessen
  den Gateway-Modelltest:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Sowohl lokale als auch Gateway-Modelltests senden nur den angegebenen Prompt. Der
  Gateway-Test validiert weiterhin Gateway-Routing, Authentifizierung und Provider-Auswahl,
  überspringt jedoch absichtlich vorheriges Sitzungstranskript, AGENTS/Bootstrap-Kontext,
  Context-Engine-Assembly, Tools und gebündelte MCP-Server.

  Wenn dies erfolgreich ist, normale OpenClaw-Agent-Runden aber fehlschlagen, versuchen Sie zuerst
  `agents.defaults.experimental.localModelLean: true`, um umfangreiche
  Standard-Tools wie `browser`, `cron` und `message` wegzulassen; dies ist ein experimentelles
  Flag, keine stabile Einstellung für einen Standardmodus. Siehe
  [Experimentelle Funktionen](/de/concepts/experimental-features). Falls dies weiterhin fehlschlägt, versuchen Sie
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Wenn das Backend weiterhin nur bei größeren OpenClaw-Läufen fehlschlägt, ist das verbleibende Problem
  in der Regel die Kapazität des Upstream-Modells bzw. -Servers oder ein Backend-Fehler, nicht OpenClaws
  Transportschicht.

## Problembehebung

- Kann der Gateway den Proxy erreichen? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-Modell entladen? Neu laden; ein Kaltstart ist eine häufige Ursache für „Hängenbleiben“.
- Der lokale Server meldet `terminated`, `ECONNRESET` oder schließt den Stream mitten in der Runde?
  OpenClaw zeichnet in der Diagnose ein `model.call.error.failureKind` mit niedriger Kardinalität sowie einen
  RSS-/Heap-Snapshot des OpenClaw-Prozesses auf. Bei Speicherdruck durch LM Studio/Ollama
  gleichen Sie diesen Zeitstempel mit dem Serverprotokoll oder dem macOS-Absturz-/
  Jetsam-Protokoll ab, um zu bestätigen, ob der Modellserver beendet wurde.
- OpenClaw leitet Schwellenwerte für die Vorabprüfung des Kontextfensters aus dem erkannten Modellfenster ab, oder aus dem unbegrenzten Modellfenster, wenn `agents.defaults.contextTokens` das effektive Fenster verringert. Unter 20 % wird mit einer Untergrenze von **8k** gewarnt. Harte Sperren verwenden den Schwellenwert von 10 % mit einer Untergrenze von **4k**, begrenzt auf das effektive Kontextfenster, sodass übergroße Modellmetadaten eine ansonsten gültige Benutzerbegrenzung nicht ablehnen können. Wenn Sie diese Vorabprüfung auslösen, erhöhen Sie das Kontextlimit des Servers/Modells oder wählen Sie ein größeres Modell.
- Kontextfehler? Verringern Sie `contextWindow` oder erhöhen Sie Ihr Serverlimit.
- OpenAI-kompatibler Server gibt `messages[].content ... expected a string` zurück?
  Fügen Sie `compat.requiresStringContent: true` zu diesem Modelleintag hinzu.
- Direkte kleine `/v1/chat/completions`-Aufrufe funktionieren, aber `openclaw infer model run --local`
  schlägt bei Gemma oder einem anderen lokalen Modell fehl? Prüfen Sie zuerst die Provider-URL, Modellreferenz, Authentifizierungs-
  Markierung und Serverprotokolle; lokales `model run` enthält keine Agent-Tools.
  Wenn lokales `model run` erfolgreich ist, größere Agent-Runden aber fehlschlagen, reduzieren Sie die
  Tool-Oberfläche des Agenten mit `localModelLean` oder `compat.supportsTools: false`.
- Tool-Aufrufe erscheinen als roher JSON-/XML-/ReAct-Text, oder der Provider gibt ein
  leeres `tool_calls`-Array zurück? Fügen Sie keinen Proxy hinzu, der Assistant-
  Text blind in Tool-Ausführung umwandelt. Korrigieren Sie zuerst das Chat-Template/den Parser des Servers. Wenn das
  Modell nur funktioniert, wenn Tool-Nutzung erzwungen wird, fügen Sie die obige modellbezogene
  Überschreibung `params.extra_body.tool_choice: "required"` hinzu und verwenden Sie diesen Modelleintag
  nur für Sitzungen, in denen in jeder Runde ein Tool-Aufruf erwartet wird.
- Sicherheit: Lokale Modelle überspringen Provider-seitige Filter; halten Sie Agenten eng begrenzt und Compaction aktiviert, um den Wirkungsbereich von Prompt Injection zu begrenzen.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Modell-Failover](/de/concepts/model-failover)
