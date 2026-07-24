---
read_when:
    - Sie möchten Modelle von Ihrem eigenen GPU-Rechner bereitstellen
    - Sie binden LM Studio oder einen OpenAI-kompatiblen Proxy an
    - Sie benötigen Empfehlungen für das sicherste lokale Modell
summary: OpenClaw auf lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-07-24T03:51:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: af76c9e97bd1d3c9665c347944511b4f466f0b620bb8af7b5f95b1e9145aadec
    source_path: gateway/local-models.md
    workflow: 16
---

Lokale Modelle funktionieren, stellen jedoch höhere Anforderungen an Hardware, Kontextgröße und den Schutz vor Prompt-Injection: Kleine oder stark quantisierte Modelle kürzen den Kontext und umgehen Provider-seitige Sicherheitsfilter. Diese Seite behandelt leistungsstärkere lokale Stacks und benutzerdefinierte OpenAI-kompatible Server. Für den unkompliziertesten Einstieg beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`.

Informationen zu lokalen Servern, die nur gestartet werden sollen, wenn ein ausgewähltes Modell sie benötigt, finden Sie unter [Lokale Modelldienste](/de/gateway/local-model-services).

## Hardware-Mindestanforderungen

Planen Sie für einen komfortablen Agentenzyklus **2 oder mehr maximal ausgestattete Mac Studios oder ein gleichwertiges GPU-System (~$30k+)** ein. Eine einzelne GPU mit **24 GB** bewältigt nur einfachere Prompts mit höherer Latenz. Verwenden Sie stets die **größte / vollständige Variante, die Sie betreiben können** – kleine oder stark quantisierte Checkpoints erhöhen das Prompt-Injection-Risiko (siehe [Sicherheit](/de/gateway/security)).

## Backend auswählen

| Backend                                              | Geeignet, wenn                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| [ds4](/de/providers/ds4)                                | Lokales DeepSeek V4 Flash auf macOS Metal mit OpenAI-kompatiblen Tool-Aufrufen  |
| [LM Studio](/de/providers/lmstudio)                     | Erstmalige lokale Einrichtung, GUI-Loader, native Responses API                 |
| LiteLLM / OAI-proxy / benutzerdefinierter OpenAI-kompatibler Proxy | Sie eine andere Modell-API vorschalten und OpenClaw sie als OpenAI behandeln soll |
| MLX / vLLM / SGLang                                  | Selbst gehostete Bereitstellung mit hohem Durchsatz und OpenAI-kompatiblem HTTP-Endpunkt |
| [Ollama](/de/providers/ollama)                          | CLI-Workflow, Modellbibliothek, wartungsarmer systemd-Dienst                    |

Verwenden Sie `api: "openai-responses"`, wenn das Backend dies unterstützt (LM Studio tut dies). Verwenden Sie andernfalls `api: "openai-completions"`. Wenn `api` bei einem benutzerdefinierten Provider mit einer `baseUrl` weggelassen wird, verwendet OpenClaw standardmäßig `openai-completions`.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** Das offizielle Ollama-Linux-Installationsprogramm aktiviert einen systemd-Dienst mit `Restart=always`. Bei WSL2-GPU-Konfigurationen kann der automatische Start während des Bootvorgangs das zuletzt verwendete Modell erneut laden und Hostspeicher dauerhaft belegen, was wiederholte VM-Neustarts verursacht. Siehe [WSL2-Absturzschleife](/de/providers/ollama#troubleshooting).
</Warning>

## LM Studio + großes lokales Modell (Responses API)

Dies ist derzeit der beste lokale Stack. Laden Sie ein großes Modell in LM Studio (eine vollständige Qwen-, DeepSeek- oder Llama-Ausführung), aktivieren Sie den lokalen Server (standardmäßig `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um Reasoning vom endgültigen Text zu trennen.

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
- Laden Sie die **größte verfügbare Modellausführung** herunter (vermeiden Sie „kleine“/stark quantisierte Varianten), starten Sie den Server und bestätigen Sie, dass `http://127.0.0.1:1234/v1/models` sie auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Lassen Sie das Modell geladen; ein Kaltstart erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, falls Ihre LM-Studio-Ausführung abweicht.
- Bleiben Sie bei WhatsApp bei der Responses API, damit nur der endgültige Text gesendet wird.
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

Für eine lokal bevorzugte Konfiguration mit gehostetem Sicherheitsnetz vertauschen Sie die Reihenfolge von `primary`/`fallbacks` und behalten Sie denselben `providers`-Block sowie `models.mode: "merge"` bei.

### Regionales Hosting / Datenrouting

Gehostete MiniMax-/Kimi-/GLM-Varianten sind auch auf OpenRouter mit regional gebundenen Endpunkten verfügbar (beispielsweise in den USA gehostet). Wählen Sie die regionale Variante, um den Datenverkehr in der gewünschten Rechtsordnung zu halten, und behalten Sie gleichzeitig `models.mode: "merge"` für Anthropic-/OpenAI-Fallbacks bei. Ein ausschließlich lokaler Betrieb bietet weiterhin den stärksten Datenschutz; gehostetes regionales Routing ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber die Kontrolle über den Datenfluss behalten möchten.

## Andere OpenAI-kompatible lokale Proxys

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy oder ein beliebiges benutzerdefiniertes Gateway funktionieren, wenn sie einen Endpunkt im OpenAI-Stil unter `/v1/chat/completions` bereitstellen. Verwenden Sie `openai-completions`, sofern das Backend nicht ausdrücklich die Unterstützung von `/v1/responses` dokumentiert.

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

Einträge für benutzerdefinierte/lokale Provider vertrauen für geschützte Modellanfragen exakt dem konfigurierten `baseUrl`-Ursprung, einschließlich Loopback-, LAN-, Tailnet- und privater DNS-Hosts. Metadaten-/Link-Local-Ursprünge werden unabhängig davon immer blockiert. Anfragen an andere private Ursprünge benötigen weiterhin `models.providers.<id>.request.allowPrivateNetwork: true`; setzen Sie das Vertrauens-Flag auf `false`, um das Vertrauen in den exakten Ursprung zu deaktivieren.

`models.providers.<id>.models[].id` gilt lokal für den Provider – geben Sie das Provider-Präfix nicht an. Für einen mit `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` gestarteten MLX-Server:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Setzen Sie `input: ["text", "image"]` bei lokalen oder über einen Proxy bereitgestellten Vision-Modellen, damit Bildanhänge in Agenten-Turns eingefügt werden. Das interaktive Onboarding benutzerdefinierter Provider erkennt gängige IDs von Vision-Modellen und fragt nur bei unbekannten Namen nach; das nicht interaktive Onboarding verwendet dieselbe Erkennung, wobei `--custom-image-input` / `--custom-text-input` diese überschreiben können.

Verwenden Sie `models.providers.<id>.timeoutSeconds` für langsame lokale/entfernte Modellserver, bevor Sie `agents.defaults.timeoutSeconds` erhöhen. Das Provider-Timeout umfasst Verbindungsaufbau, Header, Body-Streaming und den vollständigen Abbruch des geschützten Abrufs ausschließlich für Modell-HTTP-Anfragen – wenn das Agenten-/Ausführungs-Timeout niedriger ist, erhöhen Sie auch dieses, da das Provider-Timeout nicht die gesamte Ausführung verlängern kann.

<Note>
Bei benutzerdefinierten OpenAI-kompatiblen Providern wird eine nicht geheime lokale Markierung wie `apiKey: "ollama-local"` akzeptiert, wenn `baseUrl` auf Loopback, ein privates LAN, `.local` oder einen einfachen Hostnamen aufgelöst wird – OpenClaw behandelt sie als gültige lokale Zugangsdaten, statt einen fehlenden Schlüssel zu melden. Verwenden Sie für jeden Provider, der einen öffentlichen Hostnamen akzeptiert, einen echten Wert.
</Note>

Hinweise zum Verhalten lokaler/über Proxy bereitgestellter `/v1`-Backends:

- OpenClaw behandelt diese als OpenAI-kompatible Routen im Proxy-Stil, nicht als native OpenAI-Endpunkte.
- Die ausschließlich für natives OpenAI vorgesehene Anfrageformung wird nicht angewendet: kein `service_tier`, kein Responses-`store`, keine OpenAI-kompatible Reasoning-Payload-Formung, keine Prompt-Cache-Hinweise.
- Verborgene OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) werden bei benutzerdefinierten Proxy-URLs nicht eingefügt.

Kompatibilitätsdeklarationen gelten ausschließlich für den benutzerdefinierten Endpunkt, der durch diese Provider-Zeile beschrieben wird. Im Katalog bekannte Routen verwenden stattdessen Provider-eigene Funktionen; siehe den [Leitfaden zu Funktionen benutzerdefinierter Provider](/de/gateway/config-tools#custom-provider-capability-declarations).

Kompatibilitätsüberschreibungen für strengere OpenAI-kompatible Backends:

- **Nur String-Inhalte**: Einige Server akzeptieren für `messages[].content` ausschließlich Strings und keine strukturierten Arrays aus Inhaltsteilen. Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Strikte Nachrichtenschlüssel**: Wenn der Server Nachrichteneinträge mit mehr als `role`/`content` ablehnt, setzen Sie `compat.strictMessageKeys: true`.
- **Tool-Text in Klammern**: Einige lokale Modelle geben eigenständige Tool-Anfragen in Klammern als Text aus, etwa `[tool_name]`, gefolgt von JSON und `[END_TOOL_REQUEST]`. OpenClaw wandelt diese nur dann in echte Tool-Aufrufe um, wenn der Name exakt mit einem für den Turn registrierten Tool übereinstimmt; andernfalls bleiben sie als verborgener, nicht unterstützter Text erhalten.
- **Unstrukturierter Text, der wie ein Tool-Aufruf aussieht**: Wenn ein Modell Text im JSON-/XML-/ReAct-Stil ausgibt, der wie ein Tool-Aufruf aussieht, aber kein strukturierter Aufruf war, belässt OpenClaw ihn als Text und protokolliert eine Warnung mit Ausführungs-ID, Provider/Modell, erkanntem Muster und – sofern verfügbar – Tool-Namen. Dies ist eine Inkompatibilität des Providers/Modells und keine abgeschlossene Tool-Ausführung.
- **Tool-Nutzung erzwingen**: Wenn Tools als Assistententext erscheinen (unverarbeitetes JSON/XML/ReAct oder ein leeres `tool_calls`-Array), bestätigen Sie zunächst, dass die Chat-Vorlage bzw. der Parser des Servers Tool-Aufrufe unterstützt. Falls der Parser nur funktioniert, wenn die Tool-Nutzung erzwungen wird, überschreiben Sie den standardmäßigen Proxy-Wert von `tool_choice: "auto"` je Modell:

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

  Verwenden Sie dies nur, wenn jeder normale Turn ein Tool aufrufen soll. Ersetzen Sie `local/my-local-model` durch die exakte Referenz aus `openclaw models list` oder setzen Sie sie über die CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Zusätzliche Reasoning-Stufen**: Wenn ein benutzerdefiniertes OpenAI-kompatibles Modell über das integrierte Profil hinausgehende OpenAI-Reasoning-Stufen akzeptiert, deklarieren Sie diese im Kompatibilitätsblock des Modells. Durch Hinzufügen von `"xhigh"` wird sie für diese Modellreferenz in `/think xhigh`, Sitzungsauswahlen, der Gateway-Validierung und der `llm-task`-Validierung verfügbar:

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
              name: "GPT 5.4 über lokalen Proxy",
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

Wenn das Modell problemlos geladen wird, sich vollständige Agentendurchläufe jedoch fehlerhaft verhalten, gehen Sie von oben nach unten vor: Bestätigen Sie zuerst den Transport und grenzen Sie dann die Oberfläche ein.

1. **Bestätigen Sie, dass das lokale Modell antwortet** – ohne Tools und ohne Agentenkontext:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Antworte exakt mit: pong" --json
   ```

2. **Bestätigen Sie das Gateway-Routing** – sendet nur den Prompt und überspringt Transkript, AGENTS-Bootstrap, Zusammenstellung der Kontext-Engine, Tools und gebündelte MCP-Server, prüft aber weiterhin Gateway-Routing, Authentifizierung und Provider-Auswahl:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Antworte exakt mit: pong" --json
   ```

3. **Probieren Sie den schlanken Modus aus**, wenn beide Prüfungen erfolgreich sind, echte Agentendurchläufe jedoch aufgrund fehlerhafter Tool-Aufrufe oder übergroßer Prompts scheitern: Setzen Sie `agents.defaults.experimental.localModelLean: true`. Dadurch werden umfangreiche Browser-, Cron-, Nachrichten-, Mediengenerierungs-, Sprach- und PDF-Tools entfernt, sofern sie nicht ausdrücklich erforderlich sind. Größere Tool-Kataloge werden standardmäßig hinter strukturierten Tool-Search-Steuerelementen bereitgestellt, während `exec` direkt sichtbar bleibt. Einzelheiten und eine Anleitung zur Überprüfung, ob der Modus aktiviert ist, finden Sie unter [Experimentelle Funktionen -> Schlanker Modus für lokale Modelle](/de/concepts/experimental-features#local-model-lean-mode).

4. **Deaktivieren Sie als letzte Möglichkeit sämtliche Tools**, indem Sie für dieses Modell `models.providers.<provider>.models[].compat.supportsTools: false` festlegen – der Agent wird dann ohne Tool-Aufrufe ausgeführt.

5. **Darüber hinaus liegt der Engpass beim Upstream-System.** Wenn das Backend nach dem schlanken Modus und `supportsTools: false` weiterhin nur bei größeren OpenClaw-Durchläufen ausfällt, liegt das verbleibende Problem normalerweise am Modell oder Server selbst – Kontextfenster, GPU-Speicher, Verdrängung aus dem KV-Cache oder ein Backend-Fehler – und nicht an der Transportschicht von OpenClaw.

## Fehlerbehebung

- **Kann das Gateway den Proxy nicht erreichen?** `curl http://127.0.0.1:1234/v1/models`.
- **Wurde das LM-Studio-Modell entladen?** Laden Sie es erneut; ein Kaltstart ist eine häufige Ursache für scheinbares „Hängen“.
- **Meldet der lokale Server `terminated` oder `ECONNRESET` oder schließt er den Stream mitten im Durchlauf?** OpenClaw zeichnet in der Diagnose einen niedrig-kardinalen `model.call.error.failureKind` sowie eine Momentaufnahme des RSS-/Heap-Speichers des OpenClaw-Prozesses auf. Gleichen Sie bei Speicherdruck in LM Studio/Ollama diesen Zeitstempel mit dem Serverprotokoll oder einem macOS-Absturz-/Jetsam-Protokoll ab, um festzustellen, ob der Modellserver beendet wurde.
- **Kontextfehler?** OpenClaw leitet die Schwellenwerte für die Vorabprüfung des Kontextfensters aus dem erkannten Modellfenster ab (oder aus dem begrenzten Fenster, wenn `agents.defaults.contextTokens` es verkleinert). Unter 20 % wird mit einer Untergrenze von **8k** gewarnt, und unter 10 % wird mit einer Untergrenze von **4k** hart blockiert (begrenzt auf das effektive Kontextfenster, damit übergroße Modellmetadaten eine gültige Benutzerbegrenzung nicht ablehnen können). Verringern Sie `contextWindow` oder erhöhen Sie das Kontextlimit des Servers/Modells.
- **`messages[].content ... expected a string`?** Fügen Sie diesem Modelleintrag `compat.requiresStringContent: true` hinzu.
- **`validation.keys` oder „Nachrichteneinträge erlauben nur `role` und `content`“?** Fügen Sie diesem Modelleintrag `compat.strictMessageKeys: true` hinzu.
- **Funktionieren direkte `/v1/chat/completions`-Aufrufe, während `openclaw infer model run --local` bei Gemma oder einem anderen lokalen Modell fehlschlägt?** Prüfen Sie zuerst die Provider-URL, die Modellreferenz, die Authentifizierungsmarkierung und die Serverprotokolle – `model run` überspringt Agenten-Tools vollständig. Wenn `model run` erfolgreich ist, größere Agentendurchläufe jedoch scheitern, reduzieren Sie die Tool-Oberfläche mit `localModelLean` oder `compat.supportsTools: false`.
- **Werden Tool-Aufrufe als unformatierter JSON-/XML-/ReAct-Text angezeigt oder gibt der Provider ein leeres `tool_calls`-Array zurück?** Fügen Sie keinen Proxy hinzu, der Assistententext blind in Tool-Ausführungen umwandelt – korrigieren Sie zuerst die Chat-Vorlage bzw. den Parser des Servers. Wenn das Modell nur funktioniert, wenn die Tool-Nutzung erzwungen wird, fügen Sie die oben beschriebene `params.extra_body.tool_choice: "required"`-Überschreibung hinzu und verwenden Sie diesen Modelleintrag nur für Sitzungen, in denen bei jedem Durchlauf ein Tool-Aufruf erwartet wird.
- **Sicherheit**: Lokale Modelle überspringen providerseitige Filter. Halten Sie den Aufgabenbereich der Agenten eng und lassen Sie Compaction aktiviert, um den Wirkungsradius von Prompt-Injection-Angriffen zu begrenzen.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Modell-Failover](/de/concepts/model-failover)
