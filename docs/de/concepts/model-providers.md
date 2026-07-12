---
read_when:
    - Sie benötigen eine Referenz zur Modelleinrichtung für jeden einzelnen Provider
    - Sie benötigen Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
sidebarTitle: Model providers
summary: Übersicht über Modell-Provider mit Beispielkonfigurationen und CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-07-12T15:15:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

Referenz für **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram). Regeln zur Modellauswahl finden Sie unter [Modelle](/de/concepts/models).

## Kurzregeln

<AccordionGroup>
  <Accordion title="Modellreferenzen und CLI-Hilfsbefehle">
    - Modellreferenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` fungiert, sofern festgelegt, als Zulassungsliste.
    - CLI-Hilfsbefehle: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` legen Standardwerte auf Provider-Ebene fest; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` überschreiben sie pro Modell.
    - Fallback-Regeln, Cooldown-Prüfungen und Persistenz von Sitzungsüberschreibungen: [Modell-Failover](/de/concepts/model-failover).

  </Accordion>
  <Accordion title="Das Hinzufügen einer Provider-Authentifizierung ändert Ihr primäres Modell nicht">
    `openclaw configure` behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Sie einen Provider hinzufügen oder erneut authentifizieren. `openclaw models auth login` verhält sich ebenso, sofern Sie nicht `--set-default` übergeben. Provider-Plugins können in ihrem Authentifizierungskonfigurations-Patch weiterhin ein empfohlenes Standardmodell zurückgeben, OpenClaw behandelt dies bei bereits vorhandenem primärem Modell jedoch als „dieses Modell verfügbar machen“ und nicht als „das aktuelle primäre Modell ersetzen“.

    Um das Standardmodell absichtlich zu wechseln, verwenden Sie `openclaw models set <provider/model>` oder `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Trennung von OpenAI-Provider und -Runtime">
    OpenAI-Modellreferenzen und Agent-Runtimes sind getrennt:

    - `openai/<model>` wählt den kanonischen OpenAI-Provider und das Modell aus. Das Präfix allein wählt niemals Codex aus.
    - Wenn die Provider-/Modell-Runtime-Richtlinie nicht festgelegt ist oder `auto` lautet, darf OpenAI Codex nur für eine exakt offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne explizite Anfrageüberschreibung implizit auswählen.
    - Explizit konfigurierte Completions-Adapter, benutzerdefinierte Endpunkte und Routen mit explizit konfiguriertem Anfrageverhalten verbleiben bei OpenClaw. Offizielle HTTP-Endpunkte im Klartext werden abgelehnt.
    - Veraltete Codex-Modellreferenzen sind veraltete Konfigurationen, die Doctor in `openai/<model>` umschreibt.
    - `agentRuntime.id: "openclaw"` für Provider/Modell sorgt ausdrücklich dafür, dass eine ansonsten geeignete Route bei OpenClaw verbleibt. `agentRuntime.id: "codex"` setzt Codex voraus und schlägt sicher fehl, wenn die effektive Route nicht mit Codex kompatibel ist.

    Siehe [Implizite OpenAI-Agent-Runtime](/de/providers/openai#implicit-agent-runtime) und [Codex-Harness](/de/plugins/codex-harness). Falls die Trennung von Provider und Runtime unklar ist, lesen Sie zuerst [Agent-Runtimes](/de/concepts/agent-runtimes).

    Die automatische Plugin-Aktivierung folgt derselben Grenze: Eine implizit Codex-kompatible effektive Route kann das Codex-Plugin aktivieren, während eine explizite Provider-/Modellkonfiguration mit `agentRuntime.id: "codex"` oder veraltete `codex/<model>`-Referenzen es voraussetzen. Ein `openai/*`-Präfix allein tut dies nicht.

    Eine neue OpenAI-Einrichtung verwendet eine routenspezifische GPT-5.6-Referenz: Die Einrichtung per API-Schlüssel wählt
    `openai/gpt-5.6` (die reine Direkt-API-ID wird zu Sol aufgelöst), während
    ChatGPT/Codex OAuth für den nativen Codex-Katalog exakt `openai/gpt-5.6-sol`
    auswählt. Vorhandene explizite primäre Modelle, einschließlich `openai/gpt-5.5`,
    bleiben erhalten, wenn die OpenAI-Authentifizierung hinzugefügt oder aktualisiert wird.
    GPT-5.5 bleibt über beide Runtimes als explizite Wiederherstellungsoption für Konten
    ohne Zugriff auf GPT-5.6 verfügbar.

  </Accordion>
  <Accordion title="CLI-Runtimes">
    CLI-Runtimes verwenden dieselbe Trennung: Wählen Sie kanonische Modellreferenzen wie `anthropic/claude-*` oder `google/gemini-*` und setzen Sie anschließend die Provider-/Modell-Runtime-Richtlinie auf `claude-cli` oder `google-gemini-cli`, wenn Sie ein lokales CLI-Backend verwenden möchten.

    Veraltete `claude-cli/*`- und `google-gemini-cli/*`-Referenzen werden zurück zu kanonischen Provider-Referenzen migriert, wobei die Runtime separat erfasst wird. Veraltete `codex-cli/*`-Referenzen werden zu `openai/*` migriert und verwenden die Codex-App-Server-Route; OpenClaw enthält kein gebündeltes Codex-CLI-Backend mehr.

  </Accordion>
</AccordionGroup>

## Provider-Verhalten im Besitz von Plugins

Der Großteil der providerspezifischen Logik befindet sich in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife verwaltet. Plugins sind für Onboarding, Modellkataloge, die Zuordnung von Authentifizierungs-Umgebungsvariablen, Transport-/Konfigurationsnormalisierung, Bereinigung von Werkzeugschemas, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Denk-/Schlussfolgerungsprofile und mehr zuständig.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele gebündelter Plugins finden Sie unter [Provider-Plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig benutzerdefinierten Anfrage-Executor benötigt, verwendet eine separate, tiefergehende Erweiterungsschnittstelle.

<Note>
Provider-spezifisches Runner-Verhalten befindet sich in expliziten Provider-Hooks wie Wiedergaberichtlinien, Werkzeugschema-Normalisierung, Stream-Kapselung und Transport-/Anfrage-Hilfsfunktionen. Die veraltete statische Sammlung `ProviderPlugin.capabilities` dient ausschließlich der Kompatibilität und wird von der gemeinsamen Runner-Logik nicht mehr gelesen.
</Note>

## Rotation von API-Schlüsseln

<AccordionGroup>
  <Accordion title="Schlüsselquellen und Priorität">
    Konfigurieren Sie mehrere Schlüssel über:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
    - `<PROVIDER>_API_KEYS` (durch Kommas oder Semikolons getrennte Liste)
    - `<PROVIDER>_API_KEY` (primärer Schlüssel)
    - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)

    Bei Google-Providern wird `GOOGLE_API_KEY` ebenfalls als Fallback einbezogen. Die Reihenfolge der Schlüsselauswahl wahrt die Priorität und entfernt doppelte Werte.

  </Accordion>
  <Accordion title="Wann die Rotation einsetzt">
    - Anfragen werden nur bei Antworten aufgrund von Ratenbegrenzungen mit dem nächsten Schlüssel erneut versucht (beispielsweise `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder regelmäßige Meldungen zu Nutzungsgrenzen).
    - Fehler, die nicht auf Ratenbegrenzungen zurückzuführen sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
    - Wenn alle möglichen Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

  </Accordion>
</AccordionGroup>

## Offizielle Provider-Plugins

Offizielle Provider-Plugins veröffentlichen ihre eigenen Modellkatalogeinträge. Diese Provider benötigen **keine** Modelleinträge unter `models.providers`; aktivieren Sie das Provider-Plugin, richten Sie die Authentifizierung ein und wählen Sie ein Modell. Verwenden Sie `models.providers` nur für explizite benutzerdefinierte Provider oder eng begrenzte Anfrageeinstellungen wie Zeitüberschreitungen.

### OpenAI

- Provider: `openai`
- Authentifizierung: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Standard bei neuer Einrichtung: `openai/gpt-5.6`; bei der direkten API wird die reine ID zu Sol aufgelöst.
- Beispielmodelle: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Überprüfen Sie die Konto-/Modellverfügbarkeit mit `openclaw models list --provider openai`, falls sich eine bestimmte Installation oder ein API-Schlüssel anders verhält.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto`; OpenClaw übergibt die Transportauswahl an die gemeinsame Modell-Runtime.
- Überschreiben Sie ihn pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Die priorisierte Verarbeitung von OpenAI kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen an `api.openai.com` `service_tier=priority` zu
- Verwenden Sie `params.serviceTier`, wenn Sie anstelle des gemeinsamen `/fast`-Schalters eine explizite Stufe wünschen
- Verborgene OpenClaw-Zuordnungsheader (`originator`, `version`, `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Hinweise zum Prompt-Cache und die OpenAI-kompatible Formung der Reasoning-Nutzlast bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` ist nur über ChatGPT/Codex OAuth verfügbar; direkte Routen mit OpenAI-API-Schlüssel und Azure-API-Schlüssel lehnen es ab

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Falls die API-Organisation GPT-5.6 nicht bereitstellt, legen Sie
`openai/gpt-5.5` explizit fest. Normales Onboarding und erneute Authentifizierung behalten ein
vorhandenes explizites primäres Modell bei; `models auth login --set-default` und
`models set` sind die vorgesehenen Wege zum Ersetzen.

### Anthropic

- Provider: `anthropic`
- Authentifizierung: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen den gemeinsamen `/fast`-Schalter und `params.fastMode`, einschließlich per API-Schlüssel und OAuth authentifiziertem Datenverkehr an `api.anthropic.com`; OpenClaw ordnet dies dem Anthropic-`service_tier` zu (`auto` gegenüber `standard_only`)
- Die bevorzugte Claude-CLI-Konfiguration behält die kanonische Modellreferenz bei und wählt das CLI-
  Backend separat aus: `anthropic/claude-opus-4-8` mit
  modellspezifischem `agentRuntime.id: "claude-cli"`. Veraltete
  `claude-cli/claude-opus-4-7`-Referenzen funktionieren aus Kompatibilitätsgründen weiterhin.

<Note>
Die Wiederverwendung der Claude CLI (`claude -p`) ist ein offiziell unterstützter OpenClaw-Integrationsweg. Die Authentifizierung mit einem Anthropic-Einrichtungstoken wird weiterhin unterstützt, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI, wenn diese verfügbar ist.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Provider: `openai`
- Authentifizierung: OAuth (ChatGPT)
- Neue native Referenz für das Codex-App-Server-Harness: `openai/gpt-5.6-sol`
- Dokumentation zum nativen Codex-App-Server-Harness: [Codex-Harness](/de/plugins/codex-harness)
- Veraltete Modellreferenzen: `codex/gpt-*`
- Plugin-Grenze: `openai/*` lädt das OpenAI-Plugin; die explizite Runtime-Richtlinie oder die vom Provider verwaltete effektive Route bestimmt, ob das native Codex-App-Server-Plugin ausgewählt wird.
- CLI: `openclaw onboard --auth-choice openai` oder `openclaw models auth login --provider openai`
- Der eingebettete ChatGPT-Responses-Transport von OpenClaw verwendet standardmäßig `auto` (zuerst WebSocket, SSE als Fallback).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` und `params.fastMode` sind explizit konfigurierte Einstellungen für eingebettete Anfragen. Sie sorgen dafür, dass die implizite Runtime-Auswahl bei OpenClaw verbleibt; natives Codex verwaltet seinen App-Server-Transport und seine Dienststufe selbst.
- Verborgene OpenClaw-Zuordnungsheader (`originator`, `version`, `User-Agent`) werden nur bei nativem Codex-Datenverkehr zu `chatgpt.com/backend-api` angehängt, nicht bei generischen OpenAI-kompatiblen Proxys
- Der gemeinsame `/fast`-Schalter bleibt als Runtime-Steuerung verfügbar; er unterscheidet sich von explizit konfigurierten Modellparametern.
- Der native Codex-Katalog kann abhängig vom Kontozugriff die exakten Referenzen `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` und `openai/gpt-5.6-luna` bereitstellen. Er wendet den Alias `gpt-5.6` der direkten API nicht clientseitig an.
- `openai/gpt-5.5` verwendet das native `contextWindow = 400000` des Codex-Katalogs und standardmäßig zur Laufzeit `contextTokens = 272000`; überschreiben Sie die Runtime-Grenze mit `models.providers.openai.models[].contextTokens`
- Melden Sie sich für eine neue abonnementgestützte Einrichtung mit der `openai`-Authentifizierung an und verwenden Sie `openai/gpt-5.6-sol`. Wählen Sie explizit `openai/gpt-5.5`, wenn dieser Codex-Arbeitsbereich GPT-5.6 nicht bereitstellt.
- Verwenden Sie für Provider/Modell `agentRuntime.id: "openclaw"`, damit eine ansonsten geeignete Route auf der integrierten Runtime verbleibt. Wenn die Runtime nicht festgelegt ist oder `auto` lautet, darf nur eine exakt offizielle HTTPS-Route, die mit Responses/ChatGPT kompatibel ist und keine explizite Anfrageüberschreibung aufweist, Codex implizit auswählen.
- Veraltete Codex-GPT-Referenzen sind veralteter Zustand und keine aktive Provider-Route. Verwenden Sie für neue Agent-Konfigurationen kanonische `openai/*`-Referenzen und führen Sie `openclaw doctor --fix` aus, um alte veraltete Codex-Modellreferenzen zu migrieren, ohne eine vorhandene explizite Auswahl von `openai/gpt-5.5` zu aktualisieren.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Weitere gehostete Optionen im Abonnementstil

<CardGroup cols={3}>
  <Card title="MiniMax" href="/de/providers/minimax">
    Zugriff über MiniMax Coding Plan OAuth oder API-Schlüssel.
  </Card>
  <Card title="Qwen Cloud" href="/de/providers/qwen">
    Qwen-Cloud-Provider-Oberfläche sowie Endpunktzuordnung für Alibaba DashScope und Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/de/providers/zai">
    Z.AI-Coding-Plan- oder allgemeine API-Endpunkte.
  </Card>
</CardGroup>

### OpenCode

- Authentifizierung: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Laufzeit-Provider: `opencode`
- Go-Laufzeit-Provider: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Schlüssel)

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, Rückgriff auf `GOOGLE_API_KEY` und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Kompatibilität: Eine ältere OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- Alias: `google/gemini-3.1-pro` wird akzeptiert und zur aktiven Gemini-API-ID von Google, `google/gemini-3.1-pro-preview`, normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Denkmodus: `/think adaptive` verwendet das dynamische Denken von Google. Gemini 3/3.1 lassen ein festes `thinkingLevel` weg; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das ältere `cached_content`), um ein Provider-natives `cachedContents/...`-Handle weiterzuleiten; Gemini-Cachetreffer werden als OpenClaw-`cacheRead` angezeigt

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Authentifizierung: Vertex verwendet gcloud ADC; Gemini CLI verwendet den eigenen OAuth-Ablauf

<Warning>
Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen ihres Google-Kontos gemeldet. Prüfen Sie die Google-Nutzungsbedingungen und verwenden Sie ein unkritisches Konto, wenn Sie fortfahren möchten.
</Warning>

Gemini-CLI-OAuth wird als Bestandteil des gebündelten `google`-Plugins ausgeliefert.

<Steps>
  <Step title="Gemini CLI installieren">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Plugin aktivieren">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Anmelden">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Standardmodell: `google-gemini-cli/gemini-3-flash-preview`. Sie fügen **keine** Client-ID und kein Client-Geheimnis in `openclaw.json` ein. Der CLI-Anmeldeablauf speichert Token in Authentifizierungsprofilen auf dem Gateway-Host.

  </Step>
  <Step title="Projekt festlegen (falls erforderlich)">
    Wenn Anfragen nach der Anmeldung fehlschlagen, legen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host fest.
  </Step>
</Steps>

Gemini CLI verwendet standardmäßig `stream-json`. OpenClaw liest die Stream-Nachrichten
des Assistenten und normalisiert `stats.cached` zu `cacheRead`; ältere
Überschreibungen mit `--output-format json` lesen den Antworttext weiterhin aus `response`.

### Z.AI (GLM)

- Provider: `zai`
- Authentifizierung: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Modellreferenzen verwenden die kanonische Provider-ID `zai/*`.
  - `zai-api-key` erkennt automatisch den passenden Z.AI-Endpunkt; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Authentifizierung: `AI_GATEWAY_API_KEY`
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Weitere gebündelte Provider-Plugins

| Provider                                | ID                               | Authentifizierungs-Umgebungsvariable                  | Beispielmodell                                             |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` oder `OPENROUTER_API_KEY`          | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` oder `CHUTES_OAUTH_TOKEN`           | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                            |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                               |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                         |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                             |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`              | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/de/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth oder `OPENROUTER_API_KEY`           | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [Qwen OAuth](/de/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth oder `XAI_API_KEY`         | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Wissenswerte Besonderheiten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Wendet seine App-Attributionsheader und Anthropic-`cache_control`-Markierungen nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Referenzen kommen für die Cache-TTL des von OpenRouter verwalteten Prompt-Cachings infrage, erhalten jedoch keine Anthropic-Cache-Markierungen. Als Proxy-artiger OpenAI-kompatibler Pfad überspringt er ausschließlich für natives OpenAI vorgesehene Anpassungen (`serviceTier`, Responses-`store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-basierte Referenzen behalten nur die Bereinigung der Thought-Signaturen für Proxy-Gemini bei.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-basierte Referenzen folgen demselben Bereinigungspfad für Proxy-Gemini; `kilocode/kilo/auto` und andere Referenzen ohne Unterstützung für Proxy-Reasoning überspringen die Proxy-Reasoning-Injektion.
  </Accordion>
  <Accordion title="MiniMax">
    Das Onboarding mit API-Schlüssel schreibt explizite Chatmodelldefinitionen für M3 und M2.7; das Bildverständnis verbleibt beim Plugin-eigenen Medien-Provider `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Modell-IDs verwenden einen Namensraum im Format `nvidia/<vendor>/<model>` (zum Beispiel `nvidia/nvidia/nemotron-...` neben `nvidia/moonshotai/kimi-k2.5`); Auswahlmenüs bewahren die wörtliche Zusammensetzung `<provider>/<model-id>`, während der an die API gesendete kanonische Schlüssel nur ein Präfix behält.
  </Accordion>
  <Accordion title="xAI">
    Verwendet den xAI-Responses-Pfad. Der empfohlene Pfad ist SuperGrok/X Premium OAuth; API-Schlüssel funktionieren weiterhin über `XAI_API_KEY` oder die Plugin-Konfiguration, und Grok-`web_search` verwendet dasselbe Authentifizierungsprofil erneut, bevor auf den API-Schlüssel zurückgegriffen wird. Grok 4.5 kann, sofern verfügbar, für Chat-, Programmier- und agentische Aufgaben ausgewählt werden; `grok-4.3` bleibt der regionssichere mitgelieferte Standard. Ältere Konfigurationen mit `/fast` und `params.fastMode: true` werden weiterhin über die Kompatibilitätsweiterleitungen von xAI für Grok 4.3 aufgelöst, neue Konfigurationen sollten jedoch direkt ein aktuelles Modell auswählen. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provider über `models.providers` (benutzerdefinierte/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten mitgelieferten Provider-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite Einträge unter `models.providers.<id>` nur, wenn Sie die standardmäßige Basis-URL, die Header oder die Modellliste überschreiben möchten.

Die Modellfähigkeitsprüfungen des Gateway lesen auch explizite Metadaten unter `models.providers.<id>.models[]`. Wenn ein benutzerdefiniertes oder Proxy-Modell Bilder akzeptiert, legen Sie für dieses Modell `input: ["text", "image"]` fest, damit WebChat und von Nodes stammende Anhangspfade Bilder als native Modelleingaben statt als reine Text-Medienreferenzen übergeben.

`agents.defaults.models["provider/model"]` steuert nur die Sichtbarkeit, Aliasse und modellspezifischen Metadaten für Agenten. Dadurch wird allein kein neues Laufzeitmodell registriert. Fügen Sie für Modelle benutzerdefinierter Provider außerdem `models.providers.<provider>.models[]` mit mindestens der passenden `id` hinzu.

### Moonshot AI (Kimi)

Installieren Sie vor dem Onboarding `@openclaw/moonshot-provider`. Fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

- Provider: `moonshot`
- Authentifizierung: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi-K2-Modell-IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

Die vollständige Einrichtungsanleitung finden Sie unter [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot).

### Kimi Coding

Kimi Coding verwendet den Anthropic-kompatiblen Endpunkt von Moonshot AI:

- Provider: `kimi`
- Authentifizierung: `KIMI_API_KEY`
- Beispielmodell: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Die älteren Modell-IDs `kimi/kimi-code` und `kimi/k2p5` werden aus Kompatibilitätsgründen weiterhin akzeptiert und auf die stabile API-Modell-ID von Kimi normalisiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet in China Zugriff auf Doubao und weitere Modelle.

- Provider: `volcengine` (Programmierung: `volcengine-plan`)
- Authentifizierung: `VOLCANO_ENGINE_API_KEY`
- Beispielmodell: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Beim Onboarding wird standardmäßig die Programmieroberfläche verwendet, gleichzeitig wird jedoch auch der allgemeine Katalog `volcengine/*` registriert.

In den Modellauswahlmenüs für Onboarding und Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl Zeilen mit `volcengine/*` als auch mit `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind, greift OpenClaw auf den ungefilterten Katalog zurück, statt ein leeres, auf den Provider beschränktes Auswahlmenü anzuzeigen.

<Tabs>
  <Tab title="Standardmodelle">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Programmiermodelle (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (International)

BytePlus ARK bietet internationalen Benutzern Zugriff auf dieselben Modelle wie Volcano Engine.

- Provider: `byteplus` (Programmierung: `byteplus-plan`)
- Authentifizierung: `BYTEPLUS_API_KEY`
- Beispielmodell: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Beim Onboarding wird standardmäßig die Programmieroberfläche verwendet, gleichzeitig wird jedoch auch der allgemeine Katalog `byteplus/*` registriert.

In den Modellauswahlmenüs für Onboarding und Konfiguration bevorzugt die BytePlus-Authentifizierungsoption sowohl Zeilen mit `byteplus/*` als auch mit `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind, greift OpenClaw auf den ungefilterten Katalog zurück, statt ein leeres, auf den Provider beschränktes Auswahlmenü anzuzeigen.

<Tabs>
  <Tab title="Standardmodelle">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Programmiermodelle (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic stellt hinter dem Provider `synthetic` Anthropic-kompatible Modelle bereit:

- Provider: `synthetic`
- Authentifizierung: `SYNTHETIC_API_KEY`
- Beispielmodell: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax wird über `models.providers` konfiguriert, da es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax-API-Schlüssel (Global): `--auth-choice minimax-global-api`
- MiniMax-API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Authentifizierung: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`

Einrichtungsdetails, Modelloptionen und Konfigurationsausschnitte finden Sie unter [/providers/minimax](/de/providers/minimax).

<Note>
Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig für die M2.x-Familie, sofern Sie es nicht explizit festlegen; MiniMax-M3 (und M3.x) verbleibt standardmäßig auf dem ausgelassenen/adaptiven Thinking-Pfad des Providers. `/fast on` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
</Note>

Aufteilung der Plugin-eigenen Fähigkeiten:

- Die Standardwerte für Text/Chat verbleiben bei `minimax/MiniMax-M3`
- Die Bilderzeugung erfolgt über `minimax/image-01` oder `minimax-portal/image-01`
- Das Bildverständnis erfolgt auf beiden MiniMax-Authentifizierungspfaden über das Plugin-eigene `MiniMax-VL-01`
- Die Websuche verbleibt bei der Provider-ID `minimax`

### LM Studio

LM Studio wird als mitgeliefertes Provider-Plugin ausgeliefert, das die native API verwendet:

- Provider: `lmstudio`
- Authentifizierung: `LM_API_TOKEN`
- Standardmäßige Basis-URL für Inferenz: `http://localhost:1234/v1`

Legen Sie anschließend ein Modell fest (ersetzen Sie es durch eine der von `http://localhost:1234/api/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio für die Erkennung und das automatische Laden sowie standardmäßig `/v1/chat/completions` für die Inferenz. Wenn LM Studio das JIT-Laden, die TTL und das automatische Entfernen selbst über den Modelllebenszyklus verwalten soll, legen Sie `models.providers.lmstudio.params.preload: false` fest. Informationen zur Einrichtung und Fehlerbehebung finden Sie unter [/providers/lmstudio](/de/providers/lmstudio).

### Ollama

Ollama wird als mitgeliefertes Provider-Plugin ausgeliefert und verwendet die native Ollama-API:

- Provider: `ollama`
- Authentifizierung: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Installieren Sie Ollama und laden Sie anschließend ein Modell herunter:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie es mit `OLLAMA_API_KEY` aktivieren. Das mitgelieferte Provider-Plugin fügt Ollama direkt zu `openclaw onboard` und dem Modellauswahlmenü hinzu. Informationen zu Onboarding, Cloud-/lokalem Modus und benutzerdefinierter Konfiguration finden Sie unter [/providers/ollama](/de/providers/ollama).

### vLLM

vLLM wird als mitgeliefertes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `vllm`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standardmäßige Basis-URL: `http://127.0.0.1:8000/v1`

So aktivieren Sie die automatische lokale Erkennung (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Legen Sie anschließend ein Modell fest (ersetzen Sie es durch eine der von `/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Weitere Informationen finden Sie unter [/providers/vllm](/de/providers/vllm).

### SGLang

SGLang wird als mitgeliefertes Provider-Plugin für schnelle, selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standardmäßige Basis-URL: `http://127.0.0.1:30000/v1`

So aktivieren Sie die automatische lokale Erkennung (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Legen Sie anschließend ein Modell fest (ersetzen Sie es durch eine der von `/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Weitere Informationen finden Sie unter [/providers/sglang](/de/providers/sglang).

### Lokale Proxys (LM Studio, vLLM, LiteLLM usw.)

Beispiel (OpenAI-kompatibel):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Optionale Standardfelder">
    Bei benutzerdefinierten Providern sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional. Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Empfehlung: Legen Sie explizite Werte fest, die den Limits Ihres Proxys/Modells entsprechen.

  </Accordion>
  <Accordion title="Regeln zur Gestaltung von Proxy-Routen">
    - Bei `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um 400-Fehler des Providers aufgrund nicht unterstützter `developer`-Rollen zu vermeiden.
    - Proxy-artige OpenAI-kompatible Routen überspringen außerdem die ausschließlich für natives OpenAI vorgesehene Anfragegestaltung: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Hinweise für den Prompt-Cache, keine Gestaltung der Payload für OpenAI-Reasoning-Kompatibilität und keine verborgenen OpenClaw-Attributionsheader.
    - Legen Sie für OpenAI-kompatible Completions-Proxys, die anbieterspezifische Felder benötigen, `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`) fest, um zusätzliches JSON mit dem Textkörper der ausgehenden Anfrage zusammenzuführen.
    - Legen Sie für die Chat-Template-Steuerung von vLLM `agents.defaults.models["provider/model"].params.chat_template_kwargs` fest. Das mitgelieferte vLLM-Plugin sendet für `vllm/nemotron-3-*` automatisch `enable_thinking: false` und `force_nonempty_content: true`, wenn die Thinking-Stufe der Sitzung deaktiviert ist.
    - Legen Sie für langsame lokale Modelle oder entfernte LAN-/Tailnet-Hosts `models.providers.<id>.timeoutSeconds` fest. Dadurch wird die Verarbeitung von HTTP-Anfragen an das Provider-Modell verlängert, einschließlich Verbindungsaufbau, Headern, Body-Streaming und Abbruch des gesamten geschützten Abrufs, ohne das Zeitlimit der gesamten Agent-Laufzeit zu erhöhen. Wenn `agents.defaults.timeoutSeconds` oder ein laufzeitspezifisches Zeitlimit niedriger ist, erhöhen Sie auch diese Obergrenze; Provider-Zeitlimits können die Gesamtlaufzeit nicht verlängern.
    - HTTP-Aufrufe an Modell-Provider erlauben Fake-IP-DNS-Antworten von Surge, Clash und sing-box in `198.18.0.0/15` und `fc00::/7` ausschließlich für den Hostnamen der konfigurierten Provider-`baseUrl`. Benutzerdefinierte/lokale Provider-Endpunkte vertrauen für geschützte Modellanfragen außerdem genau dem konfigurierten Ursprung `scheme://host:port`, einschließlich Loopback-, LAN- und Tailnet-Hosts. Dies ist keine neue Konfigurationsoption; die von Ihnen konfigurierte `baseUrl` erweitert die Anfragerichtlinie nur für diesen Ursprung. Die Zulassung von Fake-IP-Hostnamen und das Vertrauen in den exakten Ursprung sind voneinander unabhängige Mechanismen. Andere private, Loopback-, Link-Local- und Metadatenziele sowie abweichende Ports erfordern weiterhin eine explizite Aktivierung über `models.providers.<id>.request.allowPrivateNetwork: true`. Legen Sie `models.providers.<id>.request.allowPrivateNetwork: false` fest, um das Vertrauen in den exakten Ursprung zu deaktivieren.
    - Wenn `baseUrl` leer ist oder weggelassen wird, behält OpenClaw das standardmäßige OpenAI-Verhalten bei (das zu `api.openai.com` aufgelöst wird).
    - Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.
    - Bei `api: "anthropic-messages"` auf nicht direkten Endpunkten (jeder andere Provider als der kanonische `anthropic` oder eine benutzerdefinierte `models.providers.anthropic.baseUrl`, deren Host kein öffentlicher `api.anthropic.com`-Endpunkt ist) unterdrückt OpenClaw implizite Anthropic-Beta-Header wie `claude-code-20250219`, `interleaved-thinking-2025-05-14` und OAuth-Markierungen, damit benutzerdefinierte Anthropic-kompatible Proxys nicht unterstützte Beta-Flags nicht ablehnen. Legen Sie `models.providers.<id>.headers["anthropic-beta"]` explizit fest, wenn Ihr Proxy bestimmte Beta-Funktionen benötigt.

  </Accordion>
</AccordionGroup>

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [Konfiguration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - Schlüssel für die Modellkonfiguration
- [Modell-Failover](/de/concepts/model-failover) - Fallback-Ketten und Wiederholungsverhalten
- [Modelle](/de/concepts/models) - Modellkonfiguration und Aliasse
- [Provider](/de/providers) - Einrichtungsanleitungen für einzelne Provider
