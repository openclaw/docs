---
read_when:
    - Sie möchten Modelle von Ihrer eigenen GPU-Maschine bereitstellen.
    - Sie richten LM Studio oder einen OpenAI-kompatiblen Proxy ein.
    - Sie benötigen die sicherste Anleitung für lokale Modelle.
summary: Führen Sie OpenClaw mit lokalen LLMs aus (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-04-14T06:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1544c522357ba4b18dfa6d05ea8d60c7c6262281b53863d9aee7002464703ca7
    source_path: gateway/local-models.md
    workflow: 15
---

# Lokale Modelle

Lokal ist machbar, aber OpenClaw erwartet einen großen Kontext sowie starke Abwehrmaßnahmen gegen Prompt Injection. Kleine Karten kürzen den Kontext und schwächen die Sicherheit. Zielen Sie hoch: **≥2 voll ausgestattete Mac Studios oder eine gleichwertige GPU-Maschine (~30.000 $+)**. Eine einzelne **24-GB**-GPU funktioniert nur für leichtere Prompts mit höherer Latenz. Verwenden Sie die **größte bzw. vollwertige Modellvariante, die Sie ausführen können**; aggressiv quantisierte oder „kleine“ Checkpoints erhöhen das Risiko von Prompt Injection (siehe [Sicherheit](/de/gateway/security)).

Wenn Sie die lokale Einrichtung mit dem geringsten Aufwand möchten, beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`. Diese Seite ist die meinungsstarke Anleitung für leistungsstärkere lokale Setups und benutzerdefinierte OpenAI-kompatible lokale Server.

## Empfohlen: LM Studio + großes lokales Modell (Responses API)

Der derzeit beste lokale Stack. Laden Sie ein großes Modell in LM Studio (zum Beispiel einen vollwertigen Qwen-, DeepSeek- oder Llama-Build), aktivieren Sie den lokalen Server (Standard `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um Reasoning vom finalen Text getrennt zu halten.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
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

**Checkliste zur Einrichtung**

- Installieren Sie LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Laden Sie in LM Studio den **größten verfügbaren Modell-Build** herunter (vermeiden Sie „small“- bzw. stark quantisierte Varianten), starten Sie den Server und bestätigen Sie, dass `http://127.0.0.1:1234/v1/models` das Modell auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Halten Sie das Modell geladen; ein Kaltstart erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, wenn Ihr LM Studio-Build davon abweicht.
- Für WhatsApp sollten Sie bei der Responses API bleiben, damit nur finaler Text gesendet wird.

Lassen Sie gehostete Modelle auch dann konfiguriert, wenn Sie lokal ausführen; verwenden Sie `models.mode: "merge"`, damit Fallbacks verfügbar bleiben.

### Hybride Konfiguration: gehostet als primär, lokal als Fallback

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

Tauschen Sie die Reihenfolge von primärem Modell und Fallback aus; behalten Sie denselben Providers-Block und `models.mode: "merge"` bei, damit Sie auf Sonnet oder Opus zurückfallen können, wenn die lokale Maschine nicht verfügbar ist.

### Regionales Hosting / Datenweiterleitung

- Gehostete MiniMax-/Kimi-/GLM-Varianten gibt es auch auf OpenRouter mit regional festgelegten Endpunkten (z. B. in den USA gehostet). Wählen Sie dort die regionale Variante, um den Datenverkehr in Ihrer gewünschten Gerichtsbarkeit zu halten, und verwenden Sie dennoch `models.mode: "merge"` für Anthropic-/OpenAI-Fallbacks.
- Rein lokal bleibt der stärkste Datenschutzpfad; regionales gehostetes Routing ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber die Kontrolle über den Datenfluss behalten möchten.

## Andere OpenAI-kompatible lokale Proxys

vLLM, LiteLLM, OAI-proxy oder benutzerdefinierte Gateways funktionieren, wenn sie einen OpenAI-ähnlichen `/v1`-Endpunkt bereitstellen. Ersetzen Sie den obigen Providers-Block durch Ihren Endpunkt und Ihre Modell-ID:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
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

Behalten Sie `models.mode: "merge"` bei, damit gehostete Modelle als Fallbacks verfügbar bleiben.

Hinweis zum Verhalten lokaler/proxied `/v1`-Backends:

- OpenClaw behandelt diese als proxyartige OpenAI-kompatible Routen, nicht als native OpenAI-Endpunkte
- natives nur für OpenAI geltendes Request-Shaping greift hier nicht: kein `service_tier`, kein Responses-`store`, kein OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping und keine Prompt-Cache-Hinweise
- versteckte OpenClaw-Attribution-Header (`originator`, `version`, `User-Agent`) werden auf diesen benutzerdefinierten Proxy-URLs nicht eingefügt

Kompatibilitätshinweise für strengere OpenAI-kompatible Backends:

- Einige Server akzeptieren bei Chat Completions nur `messages[].content` als String, nicht strukturierte Content-Part-Arrays. Setzen Sie für diese Endpunkte `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Einige kleinere oder strengere lokale Backends sind mit der vollständigen Prompt-Form der OpenClaw-Agent-Laufzeit instabil, insbesondere wenn Tool-Schemas enthalten sind. Wenn das Backend für kleine direkte `/v1/chat/completions`-Aufrufe funktioniert, aber bei normalen OpenClaw-Agent-Turns fehlschlägt, versuchen Sie zuerst `models.providers.<provider>.models[].compat.supportsTools: false`.
- Wenn das Backend weiterhin nur bei größeren OpenClaw-Läufen fehlschlägt, liegt das verbleibende Problem in der Regel an der Kapazität des vorgelagerten Modells/Servers oder an einem Backend-Fehler, nicht an der Transportebene von OpenClaw.

## Fehlerbehebung

- Kann Gateway den Proxy erreichen? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-Modell entladen? Laden Sie es erneut; ein Kaltstart ist eine häufige Ursache für „Hängenbleiben“.
- OpenClaw warnt, wenn das erkannte Kontextfenster unter **32k** liegt, und blockiert unter **16k**. Wenn Sie auf diese Vorabprüfung stoßen, erhöhen Sie das Kontextlimit des Servers/Modells oder wählen Sie ein größeres Modell.
- Kontextfehler? Verringern Sie `contextWindow` oder erhöhen Sie Ihr Serverlimit.
- OpenAI-kompatibler Server gibt `messages[].content ... expected a string` zurück? Fügen Sie bei diesem Modelleintrag `compat.requiresStringContent: true` hinzu.
- Direkte kleine `/v1/chat/completions`-Aufrufe funktionieren, aber `openclaw infer model run` schlägt bei Gemma oder einem anderen lokalen Modell fehl? Deaktivieren Sie zuerst Tool-Schemas mit `compat.supportsTools: false` und testen Sie dann erneut. Wenn der Server weiterhin nur bei größeren OpenClaw-Prompts abstürzt, behandeln Sie dies als Einschränkung des vorgelagerten Servers/Modells.
- Sicherheit: Lokale Modelle überspringen providerseitige Filter; halten Sie Agents eng gefasst und lassen Sie Compaction aktiviert, um den Wirkungsbereich von Prompt Injection zu begrenzen.
