---
read_when:
    - Sie möchten Modelle von Ihrem eigenen GPU-System bereitstellen
    - Sie binden LM Studio oder einen OpenAI-kompatiblen Proxy an
    - Sie benötigen eine Anleitung für das sicherste lokale Modell
summary: OpenClaw mit lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-07-12T01:40:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale Modelle funktionieren, stellen jedoch höhere Anforderungen an Hardware, Kontextgröße und den Schutz vor Prompt-Injection: Kleine oder stark quantisierte Modelle kürzen den Kontext und umgehen Provider-seitige Sicherheitsfilter. Diese Seite behandelt leistungsfähigere lokale Stacks und benutzerdefinierte OpenAI-kompatible Server. Für den unkompliziertesten Einstieg beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`.

Informationen zu lokalen Servern, die nur gestartet werden sollen, wenn ein ausgewähltes Modell sie benötigt, finden Sie unter [Lokale Modelldienste](/de/gateway/local-model-services).

## Hardware-Mindestanforderungen

Planen Sie für einen komfortablen Agenten-Loop **mindestens zwei vollständig ausgestattete Mac Studios oder ein gleichwertiges GPU-System (~30.000 USD oder mehr)** ein. Eine einzelne GPU mit **24 GB** bewältigt nur leichtere Prompts und weist dabei eine höhere Latenz auf. Führen Sie stets die **größte bzw. vollständige Variante aus, die Sie hosten können** – kleine oder stark quantisierte Checkpoints erhöhen das Prompt-Injection-Risiko (siehe [Sicherheit](/de/gateway/security)).

## Backend auswählen

| Backend                                              | Geeignet für                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [ds4](/de/providers/ds4)                                | Lokales DeepSeek V4 Flash unter macOS Metal mit OpenAI-kompatiblen Tool-Aufrufen                            |
| [LM Studio](/de/providers/lmstudio)                     | Erstmalige lokale Einrichtung, GUI-Lader, native Responses API                                             |
| LiteLLM / OAI-proxy / benutzerdefinierter OpenAI-kompatibler Proxy | Sie schalten einen Proxy vor eine andere Modell-API und OpenClaw soll sie als OpenAI behandeln |
| MLX / vLLM / SGLang                                  | Selbst gehostete Bereitstellung mit hohem Durchsatz und einem OpenAI-kompatiblen HTTP-Endpunkt              |
| [Ollama](/de/providers/ollama)                          | CLI-Arbeitsablauf, Modellbibliothek, wartungsarmer systemd-Dienst                                           |

Verwenden Sie `api: "openai-responses"`, wenn das Backend dies unterstützt (LM Studio unterstützt es). Verwenden Sie andernfalls `api: "openai-completions"`. Wird `api` bei einem benutzerdefinierten Provider mit einer `baseUrl` weggelassen, verwendet OpenClaw standardmäßig `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** Das offizielle Ollama-Installationsprogramm für Linux aktiviert einen systemd-Dienst mit `Restart=always`. Bei WSL2-GPU-Konfigurationen kann der automatische Start das zuletzt verwendete Modell während des Bootvorgangs erneut laden und den Hostspeicher dauerhaft belegen, wodurch die VM wiederholt neu gestartet wird. Siehe [WSL2-Absturzschleife](/de/providers/ollama#troubleshooting).
</Warning>

## LM Studio + großes lokales Modell (Responses API)

Dies ist derzeit der beste lokale Stack. Laden Sie ein großes Modell in LM Studio (eine vollständige Qwen-, DeepSeek- oder Llama-Ausführung), aktivieren Sie den lokalen Server (standardmäßig `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um Schlussfolgerungen vom endgültigen Text getrennt zu halten.

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

Checkliste für die Einrichtung:

- Installieren Sie LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Laden Sie die **größte verfügbare Modellausführung** herunter (vermeiden Sie „kleine“ bzw. stark quantisierte Varianten), starten Sie den Server und prüfen Sie, ob das Modell unter `http://127.0.0.1:1234/v1/models` aufgeführt wird.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Lassen Sie das Modell geladen; ein Kaltstart erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, falls Ihre LM-Studio-Ausführung abweicht.
- Bleiben Sie für WhatsApp bei der Responses API, damit nur der endgültige Text gesendet wird.
- Behalten Sie `models.mode: "merge"` bei, damit gehostete Modelle als Rückfalloptionen verfügbar bleiben.

### Hybride Konfiguration: gehostetes Primärmodell, lokales Rückfallmodell

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

Wenn Sie das lokale Modell zuerst und ein gehostetes Modell als Sicherheitsnetz verwenden möchten, vertauschen Sie die Reihenfolge von `primary` und `fallbacks` und behalten Sie denselben `providers`-Block sowie `models.mode: "merge"` bei.

### Regionales Hosting/Datenrouting

Gehostete MiniMax-/Kimi-/GLM-Varianten sind auch über OpenRouter mit regional gebundenen Endpunkten verfügbar, beispielsweise mit Hosting in den USA. Wählen Sie die regionale Variante, um den Datenverkehr in Ihrem gewählten Rechtsraum zu halten, und behalten Sie zugleich `models.mode: "merge"` für Anthropic-/OpenAI-Rückfallmodelle bei. Eine ausschließlich lokale Ausführung bietet weiterhin den stärksten Datenschutz. Regionales Hosting ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber die Kontrolle über den Datenfluss behalten möchten.

## Weitere OpenAI-kompatible lokale Proxys

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy oder ein beliebiger benutzerdefinierter Gateway funktionieren, sofern ein OpenAI-artiger Endpunkt unter `/v1/chat/completions` bereitgestellt wird. Verwenden Sie `openai-completions`, sofern das Backend die Unterstützung für `/v1/responses` nicht ausdrücklich dokumentiert.

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

Einträge für benutzerdefinierte/lokale Provider vertrauen für geschützte Modellanfragen exakt dem konfigurierten Ursprung ihrer `baseUrl`, einschließlich loopback, LAN, Tailnet und privaten DNS-Hosts. Metadaten- und Link-Local-Ursprünge werden unabhängig davon immer blockiert. Anfragen an andere private Ursprünge erfordern weiterhin `models.providers.<id>.request.allowPrivateNetwork: true`; setzen Sie das Vertrauensflag auf `false`, um das Vertrauen in den exakten Ursprung zu deaktivieren.

`models.providers.<id>.models[].id` ist Provider-lokal – geben Sie das Provider-Präfix nicht mit an. Für einen MLX-Server, der mit `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` gestartet wurde:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Legen Sie bei lokalen oder über einen Proxy bereitgestellten Vision-Modellen `input: ["text", "image"]` fest, damit Bildanhänge in Agenten-Turns eingefügt werden. Das interaktive Onboarding für benutzerdefinierte Provider erkennt gängige IDs von Vision-Modellen und fragt nur bei unbekannten Namen nach. Das nicht interaktive Onboarding verwendet dieselbe Erkennung, die Sie mit `--custom-image-input`/`--custom-text-input` überschreiben können.

Verwenden Sie bei langsamen lokalen oder entfernten Modellservern zunächst `models.providers.<id>.timeoutSeconds`, bevor Sie `agents.defaults.timeoutSeconds` erhöhen. Das Provider-Zeitlimit umfasst Verbindungsaufbau, Header, Body-Streaming und den gesamten Abbruch des geschützten Abrufs ausschließlich für Modell-HTTP-Anfragen. Ist das Zeitlimit des Agenten bzw. Laufs niedriger, erhöhen Sie auch dieses, da das Provider-Zeitlimit nicht den gesamten Lauf verlängern kann.

<Note>
Bei benutzerdefinierten OpenAI-kompatiblen Providern wird eine nicht geheime lokale Markierung wie `apiKey: "ollama-local"` akzeptiert, wenn `baseUrl` zu local loopback, einem privaten LAN, `.local` oder einem einfachen Hostnamen aufgelöst wird. OpenClaw behandelt sie als gültige lokale Anmeldedaten, statt einen fehlenden Schlüssel zu melden. Verwenden Sie für jeden Provider, der einen öffentlichen Hostnamen akzeptiert, einen echten Wert.
</Note>

Verhaltenshinweise für lokale oder über einen Proxy bereitgestellte `/v1`-Backends:

- OpenClaw behandelt diese als Proxy-artige OpenAI-kompatible Routen, nicht als native OpenAI-Endpunkte.
- Die ausschließlich für natives OpenAI vorgesehene Anfragegestaltung wird nicht angewendet: kein `service_tier`, kein Responses-`store`, keine OpenAI-Kompatibilitätsanpassung für Schlussfolgerungs-Payloads und keine Prompt-Cache-Hinweise.
- Verborgene OpenClaw-Zuordnungsheader (`originator`, `version`, `User-Agent`) werden bei benutzerdefinierten Proxy-URLs nicht eingefügt.

Kompatibilitätsüberschreibungen für strengere OpenAI-kompatible Backends:

- **Nur Zeichenfolgen als Inhalt**: Einige Server akzeptieren in `messages[].content` nur Zeichenfolgen, keine strukturierten Arrays aus Inhaltsteilen. Legen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true` fest.
- **Strikte Nachrichtenschlüssel**: Wenn der Server Nachrichteneinträge mit mehr als `role`/`content` ablehnt, legen Sie `compat.strictMessageKeys: true` fest.
- **Tool-Text in Klammern**: Einige lokale Modelle geben eigenständige Tool-Anfragen als Text in Klammern aus, beispielsweise `[tool_name]`, gefolgt von JSON und `[END_TOOL_REQUEST]`. OpenClaw wandelt diese nur dann in echte Tool-Aufrufe um, wenn der Name exakt mit einem für den Turn registrierten Tool übereinstimmt. Andernfalls bleibt der Inhalt als verborgener, nicht unterstützter Text bestehen.
- **Unstrukturierter Text, der wie ein Tool-Aufruf aussieht**: Wenn ein Modell Text im JSON-, XML- oder ReAct-Stil ausgibt, der wie ein Tool-Aufruf aussieht, aber keine strukturierte Ausführung war, belässt OpenClaw ihn als Text und protokolliert eine Warnung mit der Lauf-ID, dem Provider/Modell, dem erkannten Muster und, sofern verfügbar, dem Tool-Namen. Dies ist eine Inkompatibilität des Providers bzw. Modells und kein abgeschlossener Tool-Lauf.
- **Tool-Nutzung erzwingen**: Wenn Tools als Assistententext erscheinen (unverarbeitetes JSON/XML/ReAct oder ein leeres `tool_calls`-Array), prüfen Sie zunächst, ob die Chat-Vorlage bzw. der Parser des Servers Tool-Aufrufe unterstützt. Wenn der Parser nur funktioniert, wenn die Tool-Nutzung erzwungen wird, überschreiben Sie den standardmäßigen Proxy-Wert `tool_choice: "auto"` für das jeweilige Modell:

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

  Verwenden Sie dies nur, wenn jeder normale Turn ein Tool aufrufen soll. Ersetzen Sie `local/my-local-model` durch die exakte Referenz aus `openclaw models list` oder legen Sie sie über die CLI fest:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Zusätzliche Schlussfolgerungsstufen**: Wenn ein benutzerdefiniertes OpenAI-kompatibles Modell über das integrierte Profil hinaus weitere OpenAI-Schlussfolgerungsstufen akzeptiert, deklarieren Sie diese im Kompatibilitätsblock des Modells. Durch das Hinzufügen von `"xhigh"` wird diese Stufe für die betreffende Modellreferenz in `/think xhigh`, Sitzungsauswahlen, der Gateway-Validierung und der `llm-task`-Validierung verfügbar:

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

Wenn das Modell problemlos geladen wird, sich vollständige Agenten-Turns jedoch fehlerhaft verhalten, gehen Sie von oben nach unten vor: Prüfen Sie zuerst den Transport und grenzen Sie anschließend die Oberfläche ein.

1. **Prüfen Sie, ob das lokale Modell antwortet** – ohne Tools und ohne Agentenkontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway-Routing bestätigen** – sendet nur den Prompt und überspringt dabei Transkript, AGENTS-Bootstrap, Zusammenstellung der Kontext-Engine, Tools und gebündelte MCP-Server, prüft aber weiterhin Gateway-Routing, Authentifizierung und Provider-Auswahl:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Lean-Modus ausprobieren**, wenn beide Prüfungen erfolgreich sind, reale Agent-Durchläufe jedoch wegen fehlerhafter Tool-Aufrufe oder zu großer Prompts fehlschlagen: Legen Sie `agents.defaults.experimental.localModelLean: true` fest. Dadurch entfallen umfangreiche Browser-, Cron-, Nachrichten-, Mediengenerierungs-, Sprach- und PDF-Tools, sofern sie nicht ausdrücklich erforderlich sind. Größere Tool-Kataloge werden standardmäßig hinter strukturierten Tool-Search-Steuerelementen bereitgestellt, während `exec` direkt sichtbar bleibt. Einzelheiten und Informationen zur Überprüfung, ob der Modus aktiviert ist, finden Sie unter [Experimentelle Funktionen -> Lean-Modus für lokale Modelle](/de/concepts/experimental-features#local-model-lean-mode).

4. **Tools als letzten Ausweg vollständig deaktivieren**, indem Sie für dieses Modell `models.providers.<provider>.models[].compat.supportsTools: false` festlegen – der Agent wird dann ohne Tool-Aufrufe ausgeführt.

5. **Darüber hinaus liegt der Engpass im Upstream-System.** Wenn das Backend nach Aktivierung des Lean-Modus und Festlegung von `supportsTools: false` weiterhin nur bei größeren OpenClaw-Durchläufen fehlschlägt, liegt das verbleibende Problem normalerweise beim Modell oder Server selbst – Kontextfenster, GPU-Speicher, Verdrängung aus dem KV-Cache oder ein Backend-Fehler – und nicht bei der Transportschicht von OpenClaw.

## Fehlerbehebung

- **Kann das Gateway den Proxy nicht erreichen?** `curl http://127.0.0.1:1234/v1/models`.
- **LM-Studio-Modell entladen?** Laden Sie es neu; ein Kaltstart ist eine häufige Ursache für ein scheinbares „Hängen“.
- **Meldet der lokale Server `terminated` oder `ECONNRESET` oder schließt er den Stream während eines Durchlaufs?** OpenClaw zeichnet in den Diagnosedaten einen niedrig-kardinalen Wert für `model.call.error.failureKind` sowie einen Snapshot des RSS- und Heap-Speichers des OpenClaw-Prozesses auf. Gleichen Sie bei Speicherdruck in LM Studio oder Ollama diesen Zeitstempel mit dem Serverprotokoll oder einem macOS-Absturz-/Jetsam-Protokoll ab, um zu bestätigen, ob der Modellserver beendet wurde.
- **Kontextfehler?** OpenClaw leitet die Schwellenwerte für die Vorabprüfung des Kontextfensters aus dem erkannten Modellfenster ab (oder aus dem begrenzten Fenster, wenn `agents.defaults.contextTokens` es verkleinert). Unter 20 % wird mit einer Untergrenze von **8k** gewarnt, und unter 10 % erfolgt mit einer Untergrenze von **4k** eine harte Blockierung. Die Werte werden auf das effektive Kontextfenster begrenzt, damit überdimensionierte Modellmetadaten eine gültige benutzerdefinierte Begrenzung nicht ablehnen können. Verringern Sie `contextWindow` oder erhöhen Sie das Kontextlimit des Servers beziehungsweise Modells.
- **`messages[].content ... expected a string`?** Fügen Sie diesem Modelleintrag `compat.requiresStringContent: true` hinzu.
- **`validation.keys` oder „message entries only allow `role` and `content`“?** Fügen Sie diesem Modelleintrag `compat.strictMessageKeys: true` hinzu.
- **Direkte Aufrufe von `/v1/chat/completions` funktionieren, aber `openclaw infer model run --local` schlägt bei Gemma oder einem anderen lokalen Modell fehl?** Prüfen Sie zuerst die Provider-URL, die Modellreferenz, die Authentifizierungsmarkierung und die Serverprotokolle – `model run` überspringt die Agent-Tools vollständig. Wenn `model run` erfolgreich ist, größere Agent-Durchläufe jedoch fehlschlagen, reduzieren Sie den Tool-Umfang mit `localModelLean` oder `compat.supportsTools: false`.
- **Werden Tool-Aufrufe als unformatierter JSON-/XML-/ReAct-Text angezeigt oder gibt der Provider ein leeres `tool_calls`-Array zurück?** Fügen Sie keinen Proxy hinzu, der Assistententext ohne weitere Prüfung in Tool-Ausführungen umwandelt – korrigieren Sie zuerst das Chat-Template beziehungsweise den Parser des Servers. Wenn das Modell nur funktioniert, wenn die Tool-Nutzung erzwungen wird, fügen Sie die oben beschriebene Überschreibung `params.extra_body.tool_choice: "required"` hinzu und verwenden Sie diesen Modelleintrag nur für Sitzungen, in denen bei jedem Durchlauf ein Tool-Aufruf erwartet wird.
- **Sicherheit**: Lokale Modelle umgehen Provider-seitige Filter. Halten Sie den Aufgabenbereich der Agenten eng und lassen Sie Compaction aktiviert, um die Auswirkungen von Prompt-Injection-Angriffen zu begrenzen.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Modell-Failover](/de/concepts/model-failover)
