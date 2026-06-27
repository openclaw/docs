---
read_when:
    - Sie möchten Modelle von Ihrer eigenen GPU-Maschine bereitstellen
    - Sie richten LM Studio oder einen OpenAI-kompatiblen Proxy ein
    - Sie benötigen die sicherste Anleitung für lokale Modelle
summary: OpenClaw auf lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-06-27T17:30:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale Modelle sind machbar. Sie erhöhen aber auch die Anforderungen an Hardware, Kontextgröße und Prompt-Injection-Abwehr — kleine oder aggressiv quantisierte Karten kürzen den Kontext und schwächen die Sicherheit. Diese Seite ist der meinungsstarke Leitfaden für höherwertige lokale Stacks und benutzerdefinierte OpenAI-kompatible lokale Server. Für das Onboarding mit möglichst wenig Reibung beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`.

Für lokale Server, die nur starten sollen, wenn ein ausgewähltes Modell sie benötigt, siehe
[Lokale Modelldienste](/de/gateway/local-model-services).

## Hardware-Untergrenze

Zielen Sie hoch: **≥2 voll ausgestattete Mac Studios oder ein gleichwertiges GPU-Rig (~30.000 $+)** für eine komfortable Agent-Schleife. Eine einzelne **24 GB**-GPU funktioniert nur für leichtere Prompts mit höherer Latenz. Führen Sie immer die **größte / vollwertige Variante aus, die Sie hosten können**; kleine oder stark quantisierte Checkpoints erhöhen das Prompt-Injection-Risiko (siehe [Sicherheit](/de/gateway/security)).

## Backend auswählen

| Backend                                              | Verwenden, wenn                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [ds4](/de/providers/ds4)                                | Lokales DeepSeek V4 Flash auf macOS Metal mit OpenAI-kompatiblen Tool-Aufrufen                           |
| [LM Studio](/de/providers/lmstudio)                     | Erste lokale Einrichtung, GUI-Loader, native Responses API                                               |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | Sie eine andere Modell-API vorschalten und OpenClaw sie wie OpenAI behandeln soll                        |
| MLX / vLLM / SGLang                                  | Selbst gehostetes Serving mit hohem Durchsatz und OpenAI-kompatiblem HTTP-Endpunkt                       |
| [Ollama](/de/providers/ollama)                          | CLI-Workflow, Modellbibliothek, systemd-Dienst ohne manuelle Pflege                                      |

Verwenden Sie die Responses API (`api: "openai-responses"`), wenn das Backend sie unterstützt (LM Studio tut das). Andernfalls bleiben Sie bei Chat Completions (`api: "openai-completions"`).

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-Benutzer:** Der offizielle Ollama-Linux-Installer aktiviert einen systemd-Dienst mit `Restart=always`. Bei WSL2-GPU-Setups kann der Autostart während des Bootens das letzte Modell erneut laden und Host-Speicher belegen. Wenn Ihre WSL2-VM nach dem Aktivieren von Ollama wiederholt neu startet, siehe [WSL2-Absturzschleife](/de/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Empfohlen: LM Studio + großes lokales Modell (Responses API)

Der derzeit beste lokale Stack. Laden Sie ein großes Modell in LM Studio (zum Beispiel einen vollwertigen Qwen-, DeepSeek- oder Llama-Build), aktivieren Sie den lokalen Server (Standard `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um Reasoning vom finalen Text getrennt zu halten.

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

**Einrichtungs-Checkliste**

- Installieren Sie LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Laden Sie in LM Studio den **größten verfügbaren Modell-Build** herunter (vermeiden Sie "small"/stark quantisierte Varianten), starten Sie den Server und bestätigen Sie, dass `http://127.0.0.1:1234/v1/models` ihn auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Lassen Sie das Modell geladen; Kaltladen erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, wenn Ihr LM-Studio-Build abweicht.
- Bleiben Sie bei WhatsApp bei der Responses API, damit nur finaler Text gesendet wird.

Lassen Sie gehostete Modelle auch dann konfiguriert, wenn Sie lokal ausführen; verwenden Sie `models.mode: "merge"`, damit Fallbacks verfügbar bleiben.

### Hybrid-Konfiguration: gehostetes Primärmodell, lokaler Fallback

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

Tauschen Sie die Reihenfolge von Primärmodell und Fallbacks; behalten Sie denselben Providers-Block und `models.mode: "merge"` bei, damit Sie auf Sonnet oder Opus zurückfallen können, wenn die lokale Maschine ausgefallen ist.

### Regionales Hosting / Datenrouting

- Gehostete MiniMax/Kimi/GLM-Varianten gibt es auch auf OpenRouter mit regional gebundenen Endpunkten (z. B. in den USA gehostet). Wählen Sie dort die regionale Variante, um den Datenverkehr in Ihrer gewählten Jurisdiktion zu halten und zugleich `models.mode: "merge"` für Anthropic/OpenAI-Fallbacks zu verwenden.
- Nur lokal bleibt der stärkste Datenschutzpfad; gehostetes regionales Routing ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber Kontrolle über den Datenfluss wünschen.

## Andere OpenAI-kompatible lokale Proxys

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy oder benutzerdefinierte
Gateways funktionieren, wenn sie einen OpenAI-ähnlichen `/v1/chat/completions`-
Endpunkt bereitstellen. Verwenden Sie den Chat-Completions-Adapter, sofern das
Backend nicht ausdrücklich Unterstützung für `/v1/responses` dokumentiert.
Ersetzen Sie den obigen Provider-Block durch Ihren Endpunkt und Ihre Modell-ID:

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

Wenn `api` bei einem benutzerdefinierten Provider mit `baseUrl` weggelassen wird,
verwendet OpenClaw standardmäßig `openai-completions`. Benutzerdefinierte/lokale
Provider-Einträge vertrauen ihrem exakt konfigurierten `baseUrl`-Ursprung für
geschützte Modellanforderungen, einschließlich Loopback, LAN, Tailnet und
privaten DNS-Hosts. Anforderungen an andere private Ursprünge benötigen weiterhin
`request.allowPrivateNetwork: true`; Metadata-/Link-local-Ursprünge bleiben ohne
ausdrückliches Opt-in blockiert. Setzen Sie es auf `false`, um das Vertrauen in
den exakten Ursprung zu deaktivieren.

Der Wert `models.providers.<id>.models[].id` ist Provider-lokal. Fügen Sie dort
nicht das Provider-Präfix hinzu. Ein MLX-Server, der beispielsweise mit
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` gestartet wurde, sollte
diese Katalog-ID und Modellreferenz verwenden:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Setzen Sie `input: ["text", "image"]` bei lokalen oder proxied Vision-Modellen,
damit Bildanhänge in Agent-Turns eingefügt werden. Interaktives Onboarding für
benutzerdefinierte Provider erkennt gängige Vision-Modell-IDs und fragt nur bei
unbekannten Namen nach. Nicht interaktives Onboarding verwendet dieselbe
Erkennung; verwenden Sie `--custom-image-input` für unbekannte Vision-IDs oder
`--custom-text-input`, wenn ein bekannt wirkendes Modell hinter Ihrem Endpunkt
nur Text unterstützt.

Behalten Sie `models.mode: "merge"` bei, damit gehostete Modelle als Fallbacks
verfügbar bleiben. Verwenden Sie `models.providers.<id>.timeoutSeconds` für
langsame lokale oder entfernte Modellserver, bevor Sie
`agents.defaults.timeoutSeconds` erhöhen. Das Provider-Timeout gilt nur für
Modell-HTTP-Anforderungen, einschließlich Verbindungsaufbau, Headern,
Body-Streaming und dem gesamten geschützten Fetch-Abbruch. Wenn das Agent- oder
Run-Timeout niedriger ist, erhöhen Sie auch diese Obergrenze, weil
Provider-Timeouts den gesamten Agent-Run nicht verlängern können.

<Note>
Für benutzerdefinierte OpenAI-kompatible Provider wird das Speichern einer nicht geheimen lokalen Markierung wie `apiKey: "ollama-local"` akzeptiert, wenn `baseUrl` auf Loopback, ein privates LAN, `.local` oder einen bloßen Hostnamen auflöst. OpenClaw behandelt sie als gültige lokale Anmeldeinformation, anstatt einen fehlenden Schlüssel zu melden. Verwenden Sie einen echten Wert für jeden Provider, der einen öffentlichen Hostnamen akzeptiert.
</Note>

Verhaltenshinweis für lokale/proxied `/v1`-Backends:

- OpenClaw behandelt diese als proxyartige OpenAI-kompatible Routen, nicht als native
  OpenAI-Endpunkte
- native reine OpenAI-Anforderungsformung gilt hier nicht: kein
  `service_tier`, kein Responses `store`, keine OpenAI-Reasoning-Kompatibilitäts-Payload-
  Formung und keine Prompt-Cache-Hinweise
- verborgene OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`)
  werden bei diesen benutzerdefinierten Proxy-URLs nicht eingefügt

Kompatibilitätshinweise für strengere OpenAI-kompatible Backends:

- Einige Server akzeptieren bei Chat Completions nur String-`messages[].content`,
  keine strukturierten Content-Part-Arrays. Setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true` für
  diese Endpunkte.
- Einige lokale Modelle geben eigenständige geklammerte Tool-Anforderungen als Text aus, etwa
  `[tool_name]`, gefolgt von JSON und `[END_TOOL_REQUEST]`. OpenClaw wandelt
  diese nur dann in echte Tool-Aufrufe um, wenn der Name exakt mit einem für
  den Turn registrierten Tool übereinstimmt; andernfalls wird der Block als nicht unterstützter Text behandelt und aus
  benutzersichtbaren Antworten ausgeblendet.
- Wenn ein Modell JSON, XML oder ReAct-artigen Text ausgibt, der wie ein Tool-Aufruf
  aussieht, der Provider aber keinen strukturierten Aufruf ausgegeben hat, belässt OpenClaw ihn als
  Text und protokolliert eine Warnung mit Run-ID, Provider/Modell, erkanntem Muster und
  Tool-Namen, wenn verfügbar. Behandeln Sie das als Tool-Call-Inkompatibilität von Provider/Modell,
  nicht als abgeschlossenen Tool-Run.
- Wenn Tools als Assistententext erscheinen, statt ausgeführt zu werden, zum Beispiel rohes JSON,
  XML, ReAct-Syntax oder ein leeres `tool_calls`-Array in der Provider-Antwort,
  prüfen Sie zuerst, ob der Server ein chat template/einen Parser verwendet, der Tool-Aufrufe unterstützt. Für
  OpenAI-kompatible Chat-Completions-Backends, deren Parser nur funktioniert, wenn Tool-
  Nutzung erzwungen wird, setzen Sie eine anforderungsbezogene Überschreibung pro Modell, anstatt sich auf Text-
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
  Es überschreibt OpenClaws Standard-Proxy-Wert von `tool_choice: "auto"`.
  Ersetzen Sie `local/my-local-model` durch die exakte Provider/Modell-Referenz, die von
  `openclaw models list` angezeigt wird.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Wenn ein benutzerdefiniertes OpenAI-kompatibles Modell OpenAI-Reasoning-Aufwände über
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

## Kleinere oder strengere Backends

Wenn das Modell sauber lädt, aber vollständige Agent-Durchläufe fehlerhaft sind, arbeiten Sie von oben nach unten — bestätigen Sie zuerst den Transport und grenzen Sie dann die Oberfläche ein.

1. **Bestätigen Sie, dass das lokale Modell selbst antwortet.** Keine Tools, kein Agent-Kontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Bestätigen Sie das Gateway-Routing.** Sendet nur den angegebenen Prompt — überspringt Transcript, AGENTS-Bootstrap, Context-Engine-Zusammenstellung, Tools und gebündelte MCP-Server, prüft aber weiterhin Gateway-Routing, Authentifizierung und Provider-Auswahl:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probieren Sie den schlanken Modus aus.** Wenn beide Prüfungen erfolgreich sind, echte Agent-Durchläufe aber mit fehlerhaften Tool-Aufrufen oder übergroßen Prompts scheitern, aktivieren Sie `agents.defaults.experimental.localModelLean: true`. Dadurch werden die drei schwergewichtigsten Standard-Tools (`browser`, `cron`, `message`) entfernt, und größere Tool-Kataloge werden standardmäßig hinter strukturierte Tool Search-Steuerungen gelegt, außer bei Durchläufen, die direkte `message`-Zustellsemantik beibehalten müssen. Siehe [Experimentelle Funktionen → Schlanker Modus für lokale Modelle](/de/concepts/experimental-features#local-model-lean-mode) für die vollständige Erklärung, wann Sie ihn verwenden sollten und wie Sie bestätigen, dass er aktiviert ist.

4. **Deaktivieren Sie Tools als letzten Ausweg vollständig.** Wenn der schlanke Modus nicht ausreicht, setzen Sie `models.providers.<provider>.models[].compat.supportsTools: false` für diesen Modelleintrag. Der Agent arbeitet dann auf diesem Modell ohne Tool-Aufrufe.

5. **Darüber hinaus liegt der Engpass upstream.** Wenn das Backend nach schlankem Modus und `supportsTools: false` weiterhin nur bei größeren OpenClaw-Durchläufen fehlschlägt, liegt das verbleibende Problem in der Regel bei der upstream Modell- oder Serverkapazität — Kontextfenster, GPU-Speicher, kv-cache eviction oder ein Backend-Fehler. An diesem Punkt ist es nicht die Transportschicht von OpenClaw.

## Fehlerbehebung

- Kann Gateway den Proxy erreichen? `curl http://127.0.0.1:1234/v1/models`.
- LM Studio-Modell entladen? Neu laden; Kaltstart ist eine häufige Ursache für „Hängenbleiben“.
- Lokaler Server meldet `terminated`, `ECONNRESET` oder schließt den Stream mitten im Durchlauf?
  OpenClaw zeichnet in den Diagnosen ein niedrig kardinales `model.call.error.failureKind` plus den
  RSS-/Heap-Snapshot des OpenClaw-Prozesses auf. Bei Speicherdruck in LM Studio/Ollama
  gleichen Sie diesen Zeitstempel mit dem Serverlog oder dem macOS-Crash-/
  jetsam-Log ab, um zu bestätigen, ob der Modellserver beendet wurde.
- OpenClaw leitet die Preflight-Schwellenwerte für das Kontextfenster aus dem erkannten Modellfenster ab, oder aus dem nicht gekappten Modellfenster, wenn `agents.defaults.contextTokens` das effektive Fenster verkleinert. Unter 20 % wird mit einem **8k**-Minimum gewarnt. Harte Blockierungen verwenden den 10-%-Schwellenwert mit einem **4k**-Minimum, gekappt auf das effektive Kontextfenster, damit übergroße Modellmetadaten kein ansonsten gültiges Benutzerlimit ablehnen können. Wenn Sie diese Preflight-Prüfung auslösen, erhöhen Sie das Kontextlimit des Servers/Modells oder wählen Sie ein größeres Modell.
- Kontextfehler? Senken Sie `contextWindow` oder erhöhen Sie Ihr Serverlimit.
- OpenAI-kompatibler Server gibt `messages[].content ... expected a string` zurück?
  Fügen Sie `compat.requiresStringContent: true` zu diesem Modelleintrag hinzu.
- OpenAI-kompatibler Server gibt `validation.keys` zurück oder sagt, dass Nachrichteneinträge nur `role` und `content` erlauben?
  Fügen Sie `compat.strictMessageKeys: true` zu diesem Modelleintrag hinzu.
- Direkte kleine `/v1/chat/completions`-Aufrufe funktionieren, aber `openclaw infer model run --local`
  schlägt bei Gemma oder einem anderen lokalen Modell fehl? Prüfen Sie zuerst die Provider-URL, die Modellreferenz, die Authentifizierungsmarkierung
  und die Serverlogs; lokales `model run` enthält keine Agent-Tools.
  Wenn lokales `model run` erfolgreich ist, größere Agent-Durchläufe aber fehlschlagen, reduzieren Sie die
  Tool-Oberfläche des Agent mit `localModelLean` oder `compat.supportsTools: false`.
- Tool-Aufrufe erscheinen als roher JSON-/XML-/ReAct-Text, oder der Provider gibt ein
  leeres `tool_calls`-Array zurück? Fügen Sie keinen Proxy hinzu, der Assistant-Text blind
  in Tool-Ausführung umwandelt. Beheben Sie zuerst das Chat-Template/den Parser des Servers. Wenn das
  Modell nur funktioniert, wenn Tool-Nutzung erzwungen wird, fügen Sie oben die modellbezogene
  `params.extra_body.tool_choice: "required"`-Überschreibung hinzu und verwenden Sie diesen Modelleintrag
  nur für Sitzungen, in denen in jedem Durchlauf ein Tool-Aufruf erwartet wird.
- Sicherheit: Lokale Modelle überspringen Provider-seitige Filter; halten Sie Agents eng begrenzt und Compaction aktiviert, um den Wirkungsbereich von Prompt Injection zu begrenzen.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Modell-Failover](/de/concepts/model-failover)
