---
read_when:
    - Sie möchten Modelle von Ihrer eigenen GPU-Box bereitstellen
    - Sie binden LM Studio oder einen OpenAI-kompatiblen Proxy ein
    - Sie benötigen die sichersten Empfehlungen für lokale Modelle
summary: OpenClaw mit lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-05-02T22:18:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale Modelle sind machbar. Sie stellen aber auch höhere Anforderungen an Hardware, Kontextgröße und Prompt-Injection-Abwehr — kleine oder aggressiv quantisierte Modelle kürzen den Kontext und schwächen die Sicherheit. Diese Seite ist der meinungsstarke Leitfaden für höherwertige lokale Stacks und benutzerdefinierte OpenAI-kompatible lokale Server. Für die reibungsärmste Einrichtung beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`.

## Mindesthardware

Zielen Sie hoch: **≥2 maximal ausgestattete Mac Studios oder ein vergleichbares GPU-Rig (~30.000 $+)** für einen komfortablen Agent-Loop. Eine einzelne **24 GB** GPU funktioniert nur für leichtere Prompts mit höherer Latenz. Führen Sie immer die **größte / vollwertige Variante aus, die Sie hosten können**; kleine oder stark quantisierte Checkpoints erhöhen das Prompt-Injection-Risiko (siehe [Sicherheit](/de/gateway/security)).

## Backend auswählen

| Backend                                              | Verwenden, wenn                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/de/providers/lmstudio)                     | Erste lokale Einrichtung, GUI-Loader, native Responses API                  |
| [Ollama](/de/providers/ollama)                          | CLI-Workflow, Modellbibliothek, systemd-Dienst ohne manuellen Eingriff      |
| MLX / vLLM / SGLang                                  | Selbst gehostetes Serving mit hohem Durchsatz und OpenAI-kompatiblem HTTP-Endpunkt |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | Sie eine andere Modell-API vorschalten und OpenClaw sie als OpenAI behandeln soll |

Verwenden Sie die Responses API (`api: "openai-responses"`), wenn das Backend sie unterstützt (LM Studio tut das). Andernfalls bleiben Sie bei Chat Completions (`api: "openai-completions"`).

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA-Benutzer:** Der offizielle Ollama-Linux-Installer aktiviert einen systemd-Dienst mit `Restart=always`. Auf WSL2-GPU-Setups kann der Autostart beim Booten das zuletzt verwendete Modell erneut laden und Host-Speicher belegen. Wenn Ihre WSL2-VM nach dem Aktivieren von Ollama wiederholt neu startet, siehe [WSL2-Absturzschleife](/de/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Empfohlen: LM Studio + großes lokales Modell (Responses API)

Der aktuell beste lokale Stack. Laden Sie ein großes Modell in LM Studio (zum Beispiel ein vollwertiges Qwen-, DeepSeek- oder Llama-Build), aktivieren Sie den lokalen Server (Standard `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um Reasoning von finalem Text getrennt zu halten.

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
- Laden Sie in LM Studio das **größte verfügbare Modell-Build** herunter (vermeiden Sie „small“/stark quantisierte Varianten), starten Sie den Server und bestätigen Sie, dass `http://127.0.0.1:1234/v1/models` es auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Halten Sie das Modell geladen; ein Kaltstart erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, wenn Ihr LM Studio-Build abweicht.
- Bleiben Sie für WhatsApp bei der Responses API, damit nur finaler Text gesendet wird.

Lassen Sie gehostete Modelle auch beim lokalen Betrieb konfiguriert; verwenden Sie `models.mode: "merge"`, damit Fallbacks verfügbar bleiben.

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

Tauschen Sie die Reihenfolge von Primärmodell und Fallback; behalten Sie denselben Provider-Block und `models.mode: "merge"` bei, damit Sie auf Sonnet oder Opus zurückfallen können, wenn die lokale Maschine nicht verfügbar ist.

### Regionales Hosting / Datenrouting

- Gehostete MiniMax/Kimi/GLM-Varianten gibt es auch auf OpenRouter mit regional fixierten Endpunkten (z. B. in den USA gehostet). Wählen Sie dort die regionale Variante aus, um den Datenverkehr in Ihrer gewählten Rechtsordnung zu halten und dennoch `models.mode: "merge"` für Anthropic/OpenAI-Fallbacks zu verwenden.
- Nur lokal bleibt der stärkste Pfad für Datenschutz; gehostetes regionales Routing ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber Kontrolle über den Datenfluss behalten möchten.

## Andere OpenAI-kompatible lokale Proxys

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy oder benutzerdefinierte
Gateways funktionieren, wenn sie einen OpenAI-artigen `/v1/chat/completions`-
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

Wenn `api` bei einem benutzerdefinierten Provider mit `baseUrl` ausgelassen wird,
verwendet OpenClaw standardmäßig `openai-completions`. Loopback-Endpunkte wie
`127.0.0.1` werden automatisch vertraut; LAN-, Tailnet- und private
DNS-Endpunkte benötigen weiterhin `request.allowPrivateNetwork: true`.

Der Wert `models.providers.<id>.models[].id` ist Provider-lokal. Fügen Sie dort
kein Provider-Präfix ein. Beispielsweise sollte ein MLX-Server, der mit
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` gestartet wurde, diese
Katalog-ID und Modellreferenz verwenden:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Setzen Sie `input: ["text", "image"]` für lokale oder proxied Vision-Modelle,
damit Bildanhänge in Agent-Turns eingefügt werden. Das interaktive Onboarding
für benutzerdefinierte Provider erkennt gängige Vision-Modell-IDs und fragt nur
bei unbekannten Namen nach. Nicht interaktives Onboarding nutzt dieselbe
Erkennung; verwenden Sie `--custom-image-input` für unbekannte Vision-IDs oder
`--custom-text-input`, wenn ein bekannt aussehendes Modell hinter Ihrem Endpunkt
nur Text unterstützt.

Behalten Sie `models.mode: "merge"` bei, damit gehostete Modelle als Fallbacks
verfügbar bleiben. Verwenden Sie `models.providers.<id>.timeoutSeconds` für
langsame lokale oder entfernte Modellserver, bevor Sie
`agents.defaults.timeoutSeconds` erhöhen. Das Provider-Timeout gilt nur für
Modell-HTTP-Anfragen, einschließlich Verbindungsaufbau, Headern, Body-Streaming
und dem gesamten geschützten Fetch-Abbruch.

<Note>
Für benutzerdefinierte OpenAI-kompatible Provider wird das Speichern eines nicht geheimen lokalen Markers wie `apiKey: "ollama-local"` akzeptiert, wenn `baseUrl` auf Loopback, ein privates LAN, `.local` oder einen reinen Hostnamen verweist. OpenClaw behandelt ihn als gültige lokale Anmeldedaten, statt einen fehlenden Schlüssel zu melden. Verwenden Sie einen echten Wert für jeden Provider, der einen öffentlichen Hostnamen akzeptiert.
</Note>

Verhaltenshinweis für lokale/proxied `/v1`-Backends:

- OpenClaw behandelt diese als Proxy-artige OpenAI-kompatible Routen, nicht als native
  OpenAI-Endpunkte
- native nur für OpenAI geltende Anfrageformung wird hier nicht angewendet: kein
  `service_tier`, kein Responses `store`, keine OpenAI-Reasoning-Kompatibilitäts-
  Payload-Formung und keine Prompt-Cache-Hinweise
- versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
  werden auf diesen benutzerdefinierten Proxy-URLs nicht eingefügt

Kompatibilitätshinweise für strengere OpenAI-kompatible Backends:

- Einige Server akzeptieren bei Chat Completions nur stringbasiertes
  `messages[].content`, keine strukturierten Content-Part-Arrays. Setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true` für
  diese Endpunkte.
- Einige lokale Modelle geben eigenständige eingeklammerte Tool-Anfragen als
  Text aus, etwa `[tool_name]` gefolgt von JSON und `[END_TOOL_REQUEST]`.
  OpenClaw wandelt diese nur dann in echte Tool-Aufrufe um, wenn der Name exakt
  einem für den Turn registrierten Tool entspricht; andernfalls wird der Block
  als nicht unterstützter Text behandelt und vor benutzersichtbaren Antworten
  verborgen.
- Wenn ein Modell JSON, XML oder Text im ReAct-Stil ausgibt, der wie ein Tool-
  Aufruf aussieht, der Provider aber keinen strukturierten Aufruf ausgegeben hat,
  belässt OpenClaw ihn als Text und protokolliert eine Warnung mit Run-ID,
  Provider/Modell, erkanntem Muster und Tool-Namen, sofern verfügbar. Behandeln
  Sie dies als Tool-Call-Inkompatibilität von Provider/Modell, nicht als
  abgeschlossenen Tool-Lauf.
- Wenn Tools als Assistant-Text erscheinen, statt ausgeführt zu werden, zum
  Beispiel rohes JSON, XML, ReAct-Syntax oder ein leeres `tool_calls`-Array in
  der Provider-Antwort, prüfen Sie zuerst, ob der Server ein Chat-Template/einen
  Parser mit Tool-Call-Unterstützung verwendet. Für OpenAI-kompatible
  Chat-Completions-Backends, deren Parser nur funktioniert, wenn Tool-Nutzung
  erzwungen wird, setzen Sie pro Modell eine Anfrageüberschreibung, statt sich
  auf Text-Parsing zu verlassen:

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

  Verwenden Sie dies nur für Modelle/Sitzungen, in denen jeder normale Turn ein
  Tool aufrufen soll. Es überschreibt OpenClaws standardmäßigen Proxy-Wert
  `tool_choice: "auto"`. Ersetzen Sie `local/my-local-model` durch die exakte
  Provider/Modell-Referenz, die von `openclaw models list` angezeigt wird.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Wenn ein benutzerdefiniertes OpenAI-kompatibles Modell OpenAI-Reasoning-
  Aufwände über das integrierte Profil hinaus akzeptiert, deklarieren Sie diese
  im Modell-Compat-Block. Wenn Sie hier `"xhigh"` hinzufügen, stellen
  `/think xhigh`, Sitzungsauswahlen, Gateway-Validierung und `llm-task`-
  Validierung diese Stufe für die konfigurierte Provider/Modell-Referenz bereit:

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

Wenn das Modell sauber lädt, aber vollständige Agent-Turns fehlschlagen, arbeiten Sie von oben nach unten — bestätigen Sie zuerst den Transport und grenzen Sie dann die Oberfläche ein.

1. **Bestätigen Sie, dass das lokale Modell selbst antwortet.** Keine Tools, kein Agent-Kontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Bestätigen Sie das Gateway-Routing.** Sendet nur den bereitgestellten Prompt — überspringt Transkript, AGENTS-Bootstrap, Context-Engine-Zusammenstellung, Tools und gebündelte MCP-Server, prüft aber weiterhin Gateway-Routing, Authentifizierung und Provider-Auswahl:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Probieren Sie den schlanken Modus aus.** Wenn beide Prüfungen bestehen, echte Agent-Runden aber mit fehlerhaften Tool-Aufrufen oder übergroßen Prompts fehlschlagen, aktivieren Sie `agents.defaults.experimental.localModelLean: true`. Dadurch werden die drei umfangreichsten Standard-Tools (`browser`, `cron`, `message`) weggelassen, sodass die Prompt-Form kleiner und weniger fragil ist. Siehe [Experimentelle Funktionen → Schlanker Modus für lokale Modelle](/de/concepts/experimental-features#local-model-lean-mode) für die vollständige Erklärung, wann Sie ihn verwenden sollten und wie Sie bestätigen, dass er aktiviert ist.

4. **Deaktivieren Sie Tools als letzte Option vollständig.** Wenn der schlanke Modus nicht ausreicht, setzen Sie `models.providers.<provider>.models[].compat.supportsTools: false` für diesen Modelleintrag. Der Agent arbeitet dann auf diesem Modell ohne Tool-Aufrufe.

5. **Darüber hinaus liegt der Engpass upstream.** Wenn das Backend nach schlankem Modus und `supportsTools: false` weiterhin nur bei größeren OpenClaw-Läufen fehlschlägt, ist das verbleibende Problem normalerweise die Kapazität des upstream-Modells oder -Servers — Kontextfenster, GPU-Speicher, KV-Cache-Verdrängung oder ein Backend-Fehler. An diesem Punkt liegt es nicht an der Transportschicht von OpenClaw.

## Fehlerbehebung

- Kann Gateway den Proxy erreichen? `curl http://127.0.0.1:1234/v1/models`.
- LM-Studio-Modell entladen? Laden Sie es neu; ein Kaltstart ist eine häufige Ursache für „Hängenbleiben“.
- Lokaler Server meldet `terminated`, `ECONNRESET` oder schließt den Stream mitten in der Runde?
  OpenClaw erfasst in den Diagnosen ein niedrig kardinales `model.call.error.failureKind` sowie einen RSS-/Heap-Snapshot des OpenClaw-Prozesses. Gleichen Sie bei Speicherdruck in LM Studio/Ollama diesen Zeitstempel mit dem Serverprotokoll oder dem macOS-Absturz-/
  Jetsam-Protokoll ab, um zu bestätigen, ob der Modellserver beendet wurde.
- OpenClaw leitet die Preflight-Schwellenwerte für das Kontextfenster aus dem erkannten Modellfenster ab oder aus dem unbeschränkten Modellfenster, wenn `agents.defaults.contextTokens` das effektive Fenster verkleinert. Unter 20 % wird mit einer Untergrenze von **8k** gewarnt. Harte Blockierungen verwenden den 10-%-Schwellenwert mit einer Untergrenze von **4k**, begrenzt auf das effektive Kontextfenster, damit übergroße Modellmetadaten eine ansonsten gültige Benutzerobergrenze nicht ablehnen können. Wenn Sie diese Preflight-Prüfung erreichen, erhöhen Sie das Server-/Modell-Kontextlimit oder wählen Sie ein größeres Modell.
- Kontextfehler? Senken Sie `contextWindow` oder erhöhen Sie Ihr Serverlimit.
- OpenAI-kompatibler Server gibt `messages[].content ... expected a string` zurück?
  Fügen Sie `compat.requiresStringContent: true` zu diesem Modelleintrag hinzu.
- Direkte kleine `/v1/chat/completions`-Aufrufe funktionieren, aber `openclaw infer model run --local`
  schlägt bei Gemma oder einem anderen lokalen Modell fehl? Prüfen Sie zuerst die Provider-URL, Modellreferenz, Auth-Markierung und Serverprotokolle; lokales `model run` enthält keine Agent-Tools.
  Wenn lokales `model run` erfolgreich ist, größere Agent-Runden aber fehlschlagen, reduzieren Sie die Tool-Oberfläche des Agents mit `localModelLean` oder `compat.supportsTools: false`.
- Tool-Aufrufe erscheinen als roher JSON-/XML-/ReAct-Text, oder der Provider gibt ein
  leeres `tool_calls`-Array zurück? Fügen Sie keinen Proxy hinzu, der Assistententext blind in Tool-Ausführung umwandelt. Beheben Sie zuerst die Chat-Vorlage/den Parser des Servers. Wenn das
  Modell nur funktioniert, wenn Tool-Nutzung erzwungen wird, fügen Sie die obige modellbezogene
  Überschreibung `params.extra_body.tool_choice: "required"` hinzu und verwenden Sie diesen Modelleintrag nur für Sitzungen, in denen in jeder Runde ein Tool-Aufruf erwartet wird.
- Sicherheit: Lokale Modelle überspringen Provider-seitige Filter; halten Sie Agents eng begrenzt und Compaction aktiviert, um den Wirkungsbereich von Prompt Injection zu begrenzen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Modell-Failover](/de/concepts/model-failover)
