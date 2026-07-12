---
read_when:
    - Sie möchten Modelle von Ihrem eigenen GPU-Rechner bereitstellen
    - Sie binden LM Studio oder einen OpenAI-kompatiblen Proxy an
    - Sie benötigen eine Anleitung zum sichersten lokalen Modell
summary: OpenClaw mit lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-07-12T15:24:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale Modelle funktionieren, stellen jedoch höhere Anforderungen an Hardware, Kontextgröße und den Schutz vor Prompt-Injection: Kleine oder stark quantisierte Modelle kürzen den Kontext und umgehen providerseitige Sicherheitsfilter. Diese Seite behandelt leistungsfähigere lokale Stacks und benutzerdefinierte OpenAI-kompatible Server. Für den einfachsten Einstieg beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`.

Informationen zu lokalen Servern, die nur gestartet werden sollen, wenn ein ausgewähltes Modell sie benötigt, finden Sie unter [Lokale Modelldienste](/de/gateway/local-model-services).

## Hardware-Mindestanforderungen

Planen Sie für eine komfortable Agent-Schleife **mindestens 2 vollständig ausgestattete Mac Studios oder ein gleichwertiges GPU-System (~$30k+)** ein. Eine einzelne GPU mit **24 GB** bewältigt nur einfachere Prompts bei höherer Latenz. Führen Sie immer die **größte bzw. vollständige Variante aus, die Sie hosten können** – kleine oder stark quantisierte Checkpoints erhöhen das Prompt-Injection-Risiko (siehe [Sicherheit](/de/gateway/security)).

## Backend auswählen

| Backend                                              | Geeignet für                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [ds4](/de/providers/ds4)                                | Lokales DeepSeek V4 Flash unter macOS Metal mit OpenAI-kompatiblen Tool-Aufrufen              |
| [LM Studio](/de/providers/lmstudio)                     | Erstmalige lokale Einrichtung, GUI-Loader, native Responses API                              |
| LiteLLM / OAI-proxy / benutzerdefinierter OpenAI-kompatibler Proxy | Sie schalten eine andere Modell-API vor und möchten, dass OpenClaw sie als OpenAI behandelt |
| MLX / vLLM / SGLang                                  | Selbstgehostete Bereitstellung mit hohem Durchsatz und einem OpenAI-kompatiblen HTTP-Endpunkt |
| [Ollama](/de/providers/ollama)                          | CLI-Workflow, Modellbibliothek, wartungsarmer systemd-Dienst                                  |

Verwenden Sie `api: "openai-responses"`, wenn das Backend dies unterstützt (LM Studio unterstützt es). Verwenden Sie andernfalls `api: "openai-completions"`. Wenn `api` bei einem benutzerdefinierten Provider mit einer `baseUrl` weggelassen wird, verwendet OpenClaw standardmäßig `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** Das offizielle Ollama-Linux-Installationsprogramm aktiviert einen systemd-Dienst mit `Restart=always`. Bei WSL2-GPU-Konfigurationen kann der automatische Start während des Bootvorgangs das zuletzt verwendete Modell erneut laden, den Hostspeicher dauerhaft belegen und wiederholte Neustarts der VM verursachen. Siehe [WSL2-Absturzschleife](/de/providers/ollama#troubleshooting).
</Warning>

## LM Studio + großes lokales Modell (Responses API)

Dies ist derzeit der beste lokale Stack. Laden Sie ein großes Modell in LM Studio (eine vollständige Qwen-, DeepSeek- oder Llama-Version), aktivieren Sie den lokalen Server (Standard: `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um den Reasoning-Prozess vom endgültigen Text zu trennen.

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

Einrichtungscheckliste:

- Installieren Sie LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Laden Sie die **größte verfügbare Modellversion** herunter (vermeiden Sie „kleine“ bzw. stark quantisierte Varianten), starten Sie den Server und prüfen Sie, ob das Modell unter `http://127.0.0.1:1234/v1/models` aufgeführt wird.
- Ersetzen Sie `my-local-model` durch die tatsächliche, in LM Studio angezeigte Modell-ID.
- Lassen Sie das Modell geladen; ein Kaltstart erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, wenn Ihre LM-Studio-Version abweicht.
- Bleiben Sie für WhatsApp bei der Responses API, damit nur der endgültige Text gesendet wird.
- Behalten Sie `models.mode: "merge"` bei, damit gehostete Modelle weiterhin als Fallbacks verfügbar sind.

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

Für eine primär lokale Konfiguration mit einem gehosteten Sicherheitsnetz vertauschen Sie die Reihenfolge von `primary`/`fallbacks` und behalten Sie denselben `providers`-Block sowie `models.mode: "merge"` bei.

### Regionales Hosting / Datenrouting

Gehostete MiniMax-/Kimi-/GLM-Varianten sind auch auf OpenRouter mit regional gebundenen Endpunkten verfügbar (beispielsweise in den USA gehostet). Wählen Sie die regionale Variante, damit der Datenverkehr in der von Ihnen ausgewählten Rechtsordnung verbleibt, und behalten Sie gleichzeitig `models.mode: "merge"` für Anthropic-/OpenAI-Fallbacks bei. Ein ausschließlich lokaler Betrieb bietet weiterhin den stärksten Datenschutz; gehostetes regionales Routing ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber die Kontrolle über den Datenfluss behalten möchten.

## Weitere OpenAI-kompatible lokale Proxys

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy oder ein beliebiges benutzerdefiniertes Gateway funktionieren, wenn sie einen OpenAI-artigen `/v1/chat/completions`-Endpunkt bereitstellen. Verwenden Sie `openai-completions`, sofern das Backend die Unterstützung für `/v1/responses` nicht ausdrücklich dokumentiert.

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

Einträge für benutzerdefinierte/lokale Provider vertrauen für geschützte Modellanfragen exakt dem konfigurierten Ursprung ihrer `baseUrl`, einschließlich Loopback-, LAN-, Tailnet- und privater DNS-Hosts. Metadaten- und Link-Local-Ursprünge werden unabhängig davon immer blockiert. Anfragen an andere private Ursprünge erfordern weiterhin `models.providers.<id>.request.allowPrivateNetwork: true`; setzen Sie das Vertrauensflag auf `false`, um das Vertrauen in den exakten Ursprung zu deaktivieren.

`models.providers.<id>.models[].id` ist providerspezifisch – fügen Sie das Provider-Präfix nicht hinzu. Für einen MLX-Server, der mit `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` gestartet wurde:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Legen Sie bei lokalen oder über einen Proxy bereitgestellten Vision-Modellen `input: ["text", "image"]` fest, damit Bildanhänge in Agent-Durchläufe eingefügt werden. Das interaktive Onboarding benutzerdefinierter Provider erkennt gängige IDs von Vision-Modellen und fragt nur bei unbekannten Namen nach; das nicht interaktive Onboarding verwendet dieselbe Erkennung, die mit `--custom-image-input` / `--custom-text-input` überschrieben werden kann.

Verwenden Sie `models.providers.<id>.timeoutSeconds` für langsame lokale oder entfernte Modellserver, bevor Sie `agents.defaults.timeoutSeconds` erhöhen. Das Provider-Zeitlimit umfasst Verbindungsaufbau, Header, Body-Streaming und den gesamten Abbruch des geschützten Abrufs ausschließlich für Modell-HTTP-Anfragen. Wenn das Zeitlimit des Agents bzw. des Durchlaufs niedriger ist, erhöhen Sie auch dieses, da das Provider-Zeitlimit nicht den gesamten Durchlauf verlängern kann.

<Note>
Bei benutzerdefinierten OpenAI-kompatiblen Providern wird eine nicht geheime lokale Markierung wie `apiKey: "ollama-local"` akzeptiert, wenn `baseUrl` auf Loopback, ein privates LAN, `.local` oder einen einfachen Hostnamen aufgelöst wird – OpenClaw behandelt sie als gültige lokale Zugangsdaten, anstatt einen fehlenden Schlüssel zu melden. Verwenden Sie für jeden Provider, der einen öffentlichen Hostnamen akzeptiert, einen echten Wert.
</Note>

Verhaltenshinweise für lokale bzw. über einen Proxy bereitgestellte `/v1`-Backends:

- OpenClaw behandelt diese als proxyartige OpenAI-kompatible Routen, nicht als native OpenAI-Endpunkte.
- Ausschließlich für natives OpenAI vorgesehene Anfrageanpassungen werden nicht angewendet: kein `service_tier`, kein Responses-`store`, keine OpenAI-kompatible Anpassung der Reasoning-Nutzdaten, keine Hinweise für Prompt-Caches.
- Verborgene OpenClaw-Zuordnungsheader (`originator`, `version`, `User-Agent`) werden bei benutzerdefinierten Proxy-URLs nicht eingefügt.

Kompatibilitätsüberschreibungen für strengere OpenAI-kompatible Backends:

- **Nur Zeichenfolgen als Inhalt**: Einige Server akzeptieren für `messages[].content` nur Zeichenfolgen und keine strukturierten Arrays aus Inhaltsteilen. Legen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true` fest.
- **Strikte Nachrichtenschlüssel**: Wenn der Server Nachrichteneinträge mit mehr als `role`/`content` ablehnt, legen Sie `compat.strictMessageKeys: true` fest.
- **Tool-Text in eckigen Klammern**: Einige lokale Modelle geben eigenständige, in eckige Klammern eingeschlossene Tool-Anfragen als Text aus, etwa `[tool_name]`, gefolgt von JSON und `[END_TOOL_REQUEST]`. OpenClaw wandelt diese nur dann in echte Tool-Aufrufe um, wenn der Name exakt einem für den Durchlauf registrierten Tool entspricht; andernfalls bleibt der Inhalt als verborgener, nicht unterstützter Text erhalten.
- **Unstrukturierter Text, der wie ein Tool-Aufruf aussieht**: Wenn ein Modell JSON-/XML-/ReAct-artigen Text ausgibt, der wie ein Tool-Aufruf aussieht, aber kein strukturierter Aufruf war, belässt OpenClaw ihn als Text und protokolliert eine Warnung mit der Durchlauf-ID, dem Provider/Modell, dem erkannten Muster und, sofern verfügbar, dem Tool-Namen. Dies ist eine Inkompatibilität des Providers/Modells und kein abgeschlossener Tool-Durchlauf.
- **Tool-Nutzung erzwingen**: Wenn Tools als Assistant-Text erscheinen (unverarbeitetes JSON/XML/ReAct oder ein leeres `tool_calls`-Array), prüfen Sie zunächst, ob die Chat-Vorlage bzw. der Parser des Servers Tool-Aufrufe unterstützt. Wenn der Parser nur funktioniert, wenn die Tool-Nutzung erzwungen wird, überschreiben Sie den standardmäßigen Proxy-Wert `tool_choice: "auto"` je Modell:

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

  Verwenden Sie dies nur, wenn jeder normale Durchlauf ein Tool aufrufen soll. Ersetzen Sie `local/my-local-model` durch die exakte Referenz aus `openclaw models list` oder legen Sie sie über die CLI fest:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Zusätzliche Reasoning-Stufen**: Wenn ein benutzerdefiniertes OpenAI-kompatibles Modell über das integrierte Profil hinaus weitere OpenAI-Reasoning-Stufen akzeptiert, deklarieren Sie diese im Kompatibilitätsblock des Modells. Durch das Hinzufügen von `"xhigh"` wird diese Stufe für die betreffende Modellreferenz in `/think xhigh`, Sitzungsauswahlfeldern, der Gateway-Validierung und der `llm-task`-Validierung verfügbar:

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

Wenn das Modell fehlerfrei geladen wird, sich vollständige Agent-Durchläufe jedoch nicht korrekt verhalten, arbeiten Sie sich von oben nach unten vor: Prüfen Sie zuerst den Transport und grenzen Sie dann die betroffene Oberfläche ein.

1. **Prüfen Sie, ob das lokale Modell antwortet** – ohne Tools und ohne Agent-Kontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Antworte exakt mit: pong" --json
   ```

2. **Gateway-Routing bestätigen** – sendet nur den Prompt und überspringt dabei Transkript, AGENTS-Bootstrap, Kontext-Engine-Zusammenstellung, Tools und gebündelte MCP-Server, prüft aber weiterhin Gateway-Routing, Authentifizierung und Provider-Auswahl:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Antworte exakt mit: pong" --json
   ```

3. **Lean-Modus ausprobieren**, wenn beide Prüfungen erfolgreich sind, echte Agent-Durchläufe jedoch aufgrund fehlerhafter Tool-Aufrufe oder übergroßer Prompts scheitern: Setzen Sie `agents.defaults.experimental.localModelLean: true`. Dadurch werden umfangreiche Browser-, Cron-, Nachrichten-, Mediengenerierungs-, Sprach- und PDF-Tools entfernt, sofern sie nicht ausdrücklich erforderlich sind. Größere Tool-Kataloge werden standardmäßig hinter strukturierten Tool-Suchsteuerelementen bereitgestellt, während `exec` direkt sichtbar bleibt. Details und Anweisungen zur Überprüfung, ob der Modus aktiviert ist, finden Sie unter [Experimentelle Funktionen -> Lean-Modus für lokale Modelle](/de/concepts/experimental-features#local-model-lean-mode).

4. **Tools als letzte Möglichkeit vollständig deaktivieren**, indem Sie für dieses Modell `models.providers.<provider>.models[].compat.supportsTools: false` festlegen – der Agent wird dann ohne Tool-Aufrufe ausgeführt.

5. **Darüber hinaus liegt der Engpass im Upstream-System.** Wenn das Backend nach Aktivierung des Lean-Modus und `supportsTools: false` weiterhin nur bei größeren OpenClaw-Durchläufen fehlschlägt, liegt das verbleibende Problem üblicherweise beim Modell oder Server selbst – Kontextfenster, GPU-Speicher, KV-Cache-Verdrängung oder ein Backend-Fehler – und nicht bei der Transportschicht von OpenClaw.

## Fehlerbehebung

- **Kann das Gateway den Proxy nicht erreichen?** `curl http://127.0.0.1:1234/v1/models`.
- **LM-Studio-Modell entladen?** Laden Sie es neu; ein Kaltstart ist eine häufige Ursache für vermeintliches „Hängen“.
- **Meldet der lokale Server `terminated` oder `ECONNRESET` beziehungsweise schließt er den Stream mitten im Durchlauf?** OpenClaw zeichnet in den Diagnosedaten einen niedrig kardinalen Wert für `model.call.error.failureKind` sowie einen RSS-/Heap-Snapshot des OpenClaw-Prozesses auf. Gleichen Sie bei Speicherdruck in LM Studio/Ollama diesen Zeitstempel mit dem Serverprotokoll oder einem macOS-Absturz-/Jetsam-Protokoll ab, um zu bestätigen, ob der Modellserver beendet wurde.
- **Kontextfehler?** OpenClaw leitet die Schwellenwerte für die Kontextfenster-Vorabprüfung aus dem erkannten Modellfenster ab (oder aus dem begrenzten Fenster, wenn `agents.defaults.contextTokens` es verkleinert), warnt bei weniger als 20 % mit einer Untergrenze von **8k** und blockiert bei weniger als 10 % mit einer Untergrenze von **4k** (begrenzt auf das effektive Kontextfenster, damit übergroße Modellmetadaten eine gültige Benutzerbegrenzung nicht ablehnen können). Verringern Sie `contextWindow` oder erhöhen Sie das Kontextlimit des Servers/Modells.
- **`messages[].content ... expected a string`?** Fügen Sie diesem Modelleintrag `compat.requiresStringContent: true` hinzu.
- **`validation.keys` oder „message entries only allow `role` and `content`“?** Fügen Sie diesem Modelleintrag `compat.strictMessageKeys: true` hinzu.
- **Direkte Aufrufe von `/v1/chat/completions` funktionieren, aber `openclaw infer model run --local` schlägt bei Gemma oder einem anderen lokalen Modell fehl?** Prüfen Sie zuerst die Provider-URL, die Modellreferenz, die Authentifizierungsmarkierung und die Serverprotokolle – `model run` überspringt Agent-Tools vollständig. Wenn `model run` erfolgreich ist, größere Agent-Durchläufe jedoch fehlschlagen, reduzieren Sie die Tool-Oberfläche mit `localModelLean` oder `compat.supportsTools: false`.
- **Werden Tool-Aufrufe als unformatierter JSON-/XML-/ReAct-Text angezeigt oder gibt der Provider ein leeres `tool_calls`-Array zurück?** Fügen Sie keinen Proxy hinzu, der Assistententext ungeprüft in Tool-Ausführungen umwandelt – korrigieren Sie zuerst die Chat-Vorlage bzw. den Parser des Servers. Wenn das Modell nur funktioniert, wenn die Tool-Nutzung erzwungen wird, fügen Sie die oben beschriebene Überschreibung `params.extra_body.tool_choice: "required"` hinzu und verwenden Sie diesen Modelleintrag nur für Sitzungen, in denen bei jedem Durchlauf ein Tool-Aufruf erwartet wird.
- **Sicherheit**: Lokale Modelle umgehen Provider-seitige Filter. Halten Sie den Aufgabenbereich der Agenten eng und lassen Sie Compaction aktiviert, um den Wirkungsradius von Prompt-Injection-Angriffen zu begrenzen.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Modell-Failover](/de/concepts/model-failover)
