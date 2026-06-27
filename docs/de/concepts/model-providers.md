---
read_when:
    - Sie benötigen eine Provider-spezifische Referenz zur Modelleinstellung
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
sidebarTitle: Model providers
summary: Übersicht über Modell-Provider mit Beispielkonfigurationen + CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-06-27T17:24:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

Referenz für **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram). Regeln zur Modellauswahl finden Sie unter [Modelle](/de/concepts/models).

## Schnellregeln

<AccordionGroup>
  <Accordion title="Modell-Refs und CLI-Helfer">
    - Modell-Refs verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` wirkt als Allowlist, wenn es gesetzt ist.
    - CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` setzen Defaults auf Provider-Ebene; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` überschreiben sie pro Modell.
    - Fallback-Regeln, Cooldown-Probes und Persistenz von Sitzungsüberschreibungen: [Modell-Failover](/de/concepts/model-failover).

  </Accordion>
  <Accordion title="Das Hinzufügen von Provider-Auth ändert Ihr primäres Modell nicht">
    `openclaw configure` behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Sie einen Provider hinzufügen oder erneut authentifizieren. `openclaw models auth login` macht dasselbe, sofern Sie nicht `--set-default` übergeben. Provider-Plugins können in ihrem Auth-Konfigurationspatch weiterhin ein empfohlenes Default-Modell zurückgeben, aber OpenClaw behandelt dies als „dieses Modell verfügbar machen“, wenn bereits ein primäres Modell existiert, nicht als „das aktuelle primäre Modell ersetzen“.

    Um das Default-Modell absichtlich zu wechseln, verwenden Sie `openclaw models set <provider/model>` oder `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI-Provider-/Runtime-Aufteilung">
    Routen der OpenAI-Familie sind präfixspezifisch:

    - `openai/<model>` verwendet standardmäßig das native Codex-App-Server-Harness für Agent-Turns. Dies ist die übliche ChatGPT-/Codex-Abonnement-Konfiguration.
    - Legacy-Codex-Modell-Refs sind Legacy-Konfiguration, die doctor zu `openai/<model>` umschreibt.
    - `openai/<model>` plus Provider-/Modell-`agentRuntime.id: "openclaw"` verwendet die integrierte Runtime von OpenClaw für explizite API-Key- oder Kompatibilitätsrouten.

    Siehe [OpenAI](/de/providers/openai) und [Codex-Harness](/de/plugins/codex-harness). Wenn die Provider-/Runtime-Aufteilung unklar ist, lesen Sie zuerst [Agent-Runtimes](/de/concepts/agent-runtimes).

    Das automatische Aktivieren von Plugins folgt derselben Grenze: `openai/*`-Agent-Refs aktivieren das Codex-Plugin für die Default-Route, und explizite Provider-/Modell-`agentRuntime.id: "codex"`- oder Legacy-`codex/<model>`-Refs erfordern es ebenfalls.

    GPT-5.5 ist standardmäßig über das native Codex-App-Server-Harness unter `openai/gpt-5.5` verfügbar und über die OpenClaw-Runtime, wenn die Provider-/Modell-Runtime-Policy explizit `openclaw` auswählt.

  </Accordion>
  <Accordion title="CLI-Runtimes">
    CLI-Runtimes verwenden dieselbe Aufteilung: Wählen Sie kanonische Modell-Refs wie `anthropic/claude-*` oder `google/gemini-*`, und setzen Sie dann die Provider-/Modell-Runtime-Policy auf `claude-cli` oder `google-gemini-cli`, wenn Sie ein lokales CLI-Backend verwenden möchten.

    Legacy-Refs `claude-cli/*` und `google-gemini-cli/*` migrieren zurück zu kanonischen Provider-Refs, wobei die Runtime separat gespeichert wird. Legacy-Refs `codex-cli/*` migrieren zu `openai/*` und verwenden die Codex-App-Server-Route; OpenClaw behält kein gebündeltes Codex-CLI-Backend mehr bei.

  </Accordion>
</AccordionGroup>

## Plugin-eigenes Provider-Verhalten

Die meiste providerspezifische Logik befindet sich in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife beibehält. Plugins besitzen Onboarding, Modellkataloge, Zuordnung von Auth-Umgebungsvariablen, Transport-/Konfigurationsnormalisierung, Tool-Schema-Bereinigung, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Thinking-/Reasoning-Profile und mehr.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele für gebündelte Plugins finden Sie unter [Provider-Plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefere Erweiterungsfläche.

<Note>
Provider-eigenes Runner-Verhalten befindet sich in expliziten Provider-Hooks wie Replay-Policy, Tool-Schema-Normalisierung, Stream-Wrapping und Transport-/Request-Helfern. Die statische Legacy-Bag `ProviderPlugin.capabilities` dient nur der Kompatibilität und wird von der gemeinsamen Runner-Logik nicht mehr gelesen.
</Note>

## API-Key-Rotation

<AccordionGroup>
  <Accordion title="Key-Quellen und Priorität">
    Konfigurieren Sie mehrere Keys über:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
    - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
    - `<PROVIDER>_API_KEY` (primärer Key)
    - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)

    Für Google-Provider wird `GOOGLE_API_KEY` ebenfalls als Fallback einbezogen. Die Key-Auswahlreihenfolge behält die Priorität bei und dedupliziert Werte.

  </Accordion>
  <Accordion title="Wann Rotation greift">
    - Requests werden nur bei Rate-Limit-Antworten mit dem nächsten Key erneut versucht (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder regelmäßige Nutzungslimit-Meldungen).
    - Fehler, die keine Rate-Limits sind, schlagen sofort fehl; es wird keine Key-Rotation versucht.
    - Wenn alle Kandidaten-Keys fehlschlagen, wird der endgültige Fehler aus dem letzten Versuch zurückgegeben.

  </Accordion>
</AccordionGroup>

## Offizielle Provider-Plugins

Offizielle Provider-Plugins veröffentlichen eigene Modellkatalogzeilen. Diese Provider benötigen **keine** `models.providers`-Modelleinträge; aktivieren Sie das Provider-Plugin, legen Sie Auth fest und wählen Sie ein Modell. Verwenden Sie `models.providers` nur für explizite benutzerdefinierte Provider oder enge Request-Einstellungen wie Timeouts.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Prüfen Sie die Konto-/Modellverfügbarkeit mit `openclaw models list --provider openai`, wenn sich eine bestimmte Installation oder ein API-Key anders verhält.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Default-Transport ist `auto`; OpenClaw übergibt die Transportauswahl an die gemeinsame Modell-Runtime.
- Überschreiben Sie pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Requests `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen `/fast`-Toggles eine explizite Stufe wünschen
- Verborgene OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) gelten nur für nativen OpenAI-Traffic an `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping bei; Proxy-Routen tun dies nicht
- `openai/gpt-5.3-codex-spark` ist über ChatGPT-/Codex-OAuth-Abonnement-Auth verfügbar, wenn Ihr angemeldetes Konto es bereitstellt; OpenClaw unterdrückt für dieses Modell weiterhin direkte OpenAI-API-Key- und Azure-API-Key-Routen, weil diese Transporte es ablehnen

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Requests unterstützen den gemeinsamen `/fast`-Toggle und `params.fastMode`, einschließlich API-Key- und OAuth-authentifiziertem Traffic an `api.anthropic.com`; OpenClaw ordnet dies Anthropic-`service_tier` (`auto` vs. `standard_only`) zu
- Die bevorzugte Claude-CLI-Konfiguration behält die Modell-Ref kanonisch und wählt das CLI-
  Backend separat aus: `anthropic/claude-opus-4-8` mit
  modellbezogenem `agentRuntime.id: "claude-cli"`. Legacy-
  Refs `claude-cli/claude-opus-4-7` funktionieren weiterhin aus Kompatibilitätsgründen.

<Note>
Anthropic-Mitarbeitende haben uns mitgeteilt, dass die OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Policy veröffentlicht. Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Provider: `openai`
- Auth: OAuth (ChatGPT)
- Legacy-OpenAI-Codex-Modell-Ref: `openai/gpt-5.5`
- Native Codex-App-Server-Harness-Ref: `openai/gpt-5.5`
- Native Codex-App-Server-Harness-Dokumentation: [Codex-Harness](/de/plugins/codex-harness)
- Legacy-Modell-Refs: `codex/gpt-*`
- Plugin-Grenze: `openai/*` lädt das OpenAI-Plugin; das native Codex-App-Server-Plugin wird von der Codex-Harness-Runtime ausgewählt.
- CLI: `openclaw onboard --auth-choice openai` oder `openclaw models auth login --provider openai`
- Der Default-Transport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Überschreiben Sie pro OpenAI-Codex-Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Requests (`chatgpt.com/backend-api`) weitergeleitet
- Verborgene OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) werden nur bei nativem Codex-Traffic an `chatgpt.com/backend-api` angehängt, nicht bei generischen OpenAI-kompatiblen Proxys
- Teilt denselben `/fast`-Toggle und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai/gpt-5.5` verwendet das native `contextWindow = 400000` des Codex-Katalogs und die Default-Runtime `contextTokens = 272000`; überschreiben Sie die Runtime-Obergrenze mit `models.providers.openai.models[].contextTokens`
- Policy-Hinweis: OpenAI Codex OAuth wird explizit für externe Tools/Workflows wie OpenClaw unterstützt.
- Für die gängige Route mit Abonnement plus nativer Codex-Runtime melden Sie sich mit `openai`-Auth an und konfigurieren Sie `openai/gpt-5.5`; OpenAI-Agent-Turns wählen standardmäßig Codex aus.
- Verwenden Sie Provider-/Modell-`agentRuntime.id: "openclaw"` nur, wenn Sie die integrierte OpenClaw-Route wünschen; andernfalls behalten Sie `openai/gpt-5.5` auf dem Default-Codex-Harness.
- Legacy-Codex-GPT-Refs sind Legacy-Zustand, keine Live-Provider-Route. Verwenden Sie `openai/gpt-5.5` auf der nativen Codex-Runtime für neue Agent-Konfiguration, und führen Sie `openclaw doctor --fix` aus, um alte Legacy-Codex-Modell-Refs zu kanonischen `openai/*`-Refs zu migrieren.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
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

### Andere gehostete Optionen im Abonnementstil

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/de/providers/zai">
    Z.AI Coding Plan oder allgemeine API-Endpunkte.
  </Card>
  <Card title="MiniMax" href="/de/providers/minimax">
    MiniMax Coding Plan OAuth oder API-Key-Zugriff.
  </Card>
  <Card title="Qwen Cloud" href="/de/providers/qwen">
    Qwen Cloud-Provider-Oberfläche plus Alibaba-DashScope- und Coding-Plan-Endpunktzuordnung.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Runtime-Provider: `opencode`
- Go-Runtime-Provider: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Key)

- Provider: `google`
- Authentifizierung: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY`-Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: ältere OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- Alias: `google/gemini-3.1-pro` wird akzeptiert und auf Googles Live-Gemini-API-ID `google/gemini-3.1-pro-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` verwendet Googles dynamisches Thinking. Gemini 3/3.1 lassen ein festes `thinkingLevel` weg; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das ältere `cached_content`), um einen provider-nativen `cachedContents/...`-Handle weiterzureichen; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Authentifizierung: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf

<Warning>
Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen bei Google-Konten gemeldet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein nicht kritisches Konto, wenn Sie fortfahren möchten.
</Warning>

Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.

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

    Standardmodell: `google-gemini-cli/gemini-3-flash-preview`. Sie fügen **keine** Client-ID und kein Secret in `openclaw.json` ein. Der CLI-Anmeldeablauf speichert Tokens in Authentifizierungsprofilen auf dem Gateway-Host.

  </Step>
  <Step title="Projekt festlegen (falls erforderlich)">
    Wenn Anfragen nach der Anmeldung fehlschlagen, legen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host fest.
  </Step>
</Steps>

Gemini CLI verwendet standardmäßig `stream-json`. OpenClaw liest Assistant-Stream-Nachrichten und normalisiert `stats.cached` zu `cacheRead`; ältere Überschreibungen mit `--output-format json` lesen Antworttext weiterhin aus `response`.

### Z.AI (GLM)

- Provider: `zai`
- Authentifizierung: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Modellreferenzen verwenden die kanonische Provider-ID `zai/*`.
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Authentifizierung: `AI_GATEWAY_API_KEY`
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Andere gebündelte Provider-Plugins

| Provider                                | ID                               | Authentifizierungs-Env                            | Beispielmodell                                            |
| --------------------------------------- | -------------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                | `byteplus-plan/ark-code-latest`                           |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                  | `cohere/command-a-03-2025`                                |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                      |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`           | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`         | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                 | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                  | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                  | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/de/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                  | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OpenRouter-OAuth oder `OPENROUTER_API_KEY`        | `openrouter/auto`                                         |
| [Qwen OAuth](/de/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                    | `qwen-oauth/qwen3.5-plus`                                 |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                  | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                              | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                          | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | SuperGrok-/X-Premium-OAuth oder `XAI_API_KEY`     | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`    | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Wissenswerte Besonderheiten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Wendet seine App-Attributions-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Referenzen sind für OpenRouter-verwaltetes Prompt-Caching mit Cache-TTL geeignet, erhalten aber keine Anthropic-Cache-Marker. Als proxyartiger OpenAI-kompatibler Pfad überspringt er nur native OpenAI-Formung (`serviceTier`, Responses-`store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-gestützte Referenzen behalten nur die Proxy-Gemini-Bereinigung von Thought-Signaturen bei.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-gestützte Referenzen folgen demselben Proxy-Gemini-Bereinigungspfad; `kilocode/kilo/auto` und andere Referenzen ohne Proxy-Reasoning-Unterstützung überspringen die Proxy-Reasoning-Injektion.
  </Accordion>
  <Accordion title="MiniMax">
    API-Key-Onboarding schreibt explizite Chatmodelldefinitionen für M3 und M2.7; Bildverständnis bleibt beim plugin-eigenen Medien-Provider `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Modell-IDs verwenden einen Namespace `nvidia/<vendor>/<model>` (zum Beispiel `nvidia/nvidia/nemotron-...` neben `nvidia/moonshotai/kimi-k2.5`); Auswahllisten behalten die wörtliche Zusammensetzung `<provider>/<model-id>` bei, während der an die API gesendete kanonische Schlüssel einfach präfixiert bleibt.
  </Accordion>
  <Accordion title="xAI">
    Verwendet den xAI-Responses-Pfad. Der empfohlene Pfad ist SuperGrok-/X-Premium-OAuth; API-Keys funktionieren weiterhin über `XAI_API_KEY` oder die Plugin-Konfiguration, und Grok-`web_search` verwendet dasselbe Authentifizierungsprofil wieder, bevor auf API-Key zurückgefallen wird. `grok-4.3` ist das gebündelte Standard-Chatmodell, und `grok-build-0.1` ist für build-/coding-fokussierte Arbeit auswählbar. `/fast` oder `params.fastMode: true` schreibt `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provider über `models.providers` (benutzerdefinierte/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite `models.providers.<id>`-Einträge nur, wenn Sie die Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

Gateway-Modellfähigkeitsprüfungen lesen auch explizite `models.providers.<id>.models[]`-Metadaten. Wenn ein benutzerdefiniertes Modell oder Proxy-Modell Bilder akzeptiert, setzen Sie für dieses Modell `input: ["text", "image"]`, damit WebChat und von Node ausgehende Anhangspfade Bilder als native Modelleingaben statt als reine Text-Medienreferenzen übergeben.

`agents.defaults.models["provider/model"]` steuert nur die Modellsichtbarkeit, Aliasse und Metadaten pro Modell für Agents. Es registriert nicht von selbst ein neues Runtime-Modell. Fügen Sie für benutzerdefinierte Provider-Modelle außerdem `models.providers.<provider>.models[]` mit mindestens der passenden `id` hinzu.

### Moonshot AI (Kimi)

Installieren Sie `@openclaw/moonshot-provider` vor dem Onboarding. Fügen Sie nur dann einen expliziten `models.providers.moonshot`-Eintrag hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

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

### Kimi-Coding

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

Die veralteten `kimi/kimi-code` und `kimi/k2p5` werden weiterhin als Kompatibilitätsmodell-IDs akzeptiert und auf die stabile API-Modell-ID von Kimi normalisiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet Zugriff auf Doubao und andere Modelle in China.

- Provider: `volcengine` (Coding: `volcengine-plan`)
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

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `volcengine/*`-Katalog wird gleichzeitig registriert.

In Onboarding-/Konfigurations-Modellauswahlen bevorzugt die Volcengine-Auth-Auswahl sowohl `volcengine/*`- als auch `volcengine-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere Provider-begrenzte Auswahl anzuzeigen.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (International)

BytePlus ARK bietet internationalen Benutzern Zugriff auf dieselben Modelle wie Volcano Engine.

- Provider: `byteplus` (Coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Beispielmodell: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `byteplus/*`-Katalog wird gleichzeitig registriert.

In Onboarding-/Konfigurations-Modellauswahlen bevorzugt die BytePlus-Auth-Auswahl sowohl `byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere Provider-begrenzte Auswahl anzuzeigen.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic stellt Anthropic-kompatible Modelle hinter dem `synthetic`-Provider bereit:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
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
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurationsausschnitte.

<Note>
Auf MiniMaxs Anthropic-kompatiblem Streaming-Pfad deaktiviert OpenClaw Thinking standardmäßig für die M2.x-Familie, sofern Sie es nicht ausdrücklich festlegen; MiniMax-M3 (und M3.x) bleibt standardmäßig auf dem ausgelassenen/adaptiven Thinking-Pfad des Providers. `/fast on` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
</Note>

Plugin-eigene Capability-Aufteilung:

- Text-/Chat-Standards bleiben auf `minimax/MiniMax-M3`
- Bilderzeugung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist das Plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Websuche bleibt auf der Provider-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Provider-Plugin ausgeliefert, das die native API verwendet:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der von `http://localhost:1234/api/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet LM Studios native `/api/v1/models` und `/api/v1/models/load` für Discovery und automatisches Laden, standardmäßig mit `/v1/chat/completions` für Inferenz. Wenn LM Studio JIT-Laden, TTL und automatisches Entfernen den Modelllebenszyklus besitzen sollen, setzen Sie `models.providers.lmstudio.params.preload: false`. Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet Ollamas native API:

- Provider: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit `OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Provider-Plugin fügt Ollama direkt zu `openclaw onboard` und zur Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama) für Onboarding, Cloud-/lokalen Modus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

So aktivieren Sie lokale automatische Discovery (jeder Wert funktioniert, wenn Ihr Server keine Auth erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der von `/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Siehe [/providers/vllm](/de/providers/vllm) für Details.

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

So aktivieren Sie lokale automatische Discovery (jeder Wert funktioniert, wenn Ihr Server keine Auth erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der von `/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Siehe [/providers/sglang](/de/providers/sglang) für Details.

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
  <Accordion title="Default optional fields">
    Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional. Wenn sie ausgelassen werden, verwendet OpenClaw standardmäßig:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Empfohlen: Legen Sie explizite Werte fest, die zu den Limits Ihres Proxys/Modells passen.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler wegen nicht unterstützter `developer`-Rollen zu vermeiden.
    - Proxy-artige OpenAI-kompatible Routen überspringen außerdem natives, nur für OpenAI bestimmtes Request-Shaping: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Prompt-Cache-Hinweise, kein OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping und keine versteckten OpenClaw-Attributionsheader.
    - Für OpenAI-kompatible Completions-Proxys, die anbieterspezifische Felder benötigen, setzen Sie `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`), um zusätzliches JSON in den ausgehenden Request-Body zusammenzuführen.
    - Für vLLM-Chat-Template-Steuerungen setzen Sie `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Das gebündelte vLLM-Plugin sendet automatisch `enable_thinking: false` und `force_nonempty_content: true` für `vllm/nemotron-3-*`, wenn das Session-Thinking-Level ausgeschaltet ist.
    - Für langsame lokale Modelle oder entfernte LAN-/Tailnet-Hosts setzen Sie `models.providers.<id>.timeoutSeconds`. Dies erweitert die HTTP-Request-Verarbeitung des Provider-Modells, einschließlich Verbindung, Header, Body-Streaming und des gesamten abgesicherten Fetch-Abbruchs, ohne das Timeout der gesamten Agent-Laufzeit zu erhöhen. Wenn `agents.defaults.timeoutSeconds` oder ein laufbezogenes Timeout niedriger ist, erhöhen Sie auch diese Obergrenze; Provider-Timeouts können den gesamten Lauf nicht verlängern.
    - HTTP-Aufrufe von Modell-Providern erlauben Surge-, Clash- und sing-box-Fake-IP-DNS-Antworten in `198.18.0.0/15` und `fc00::/7` nur für den konfigurierten Provider-`baseUrl`-Hostnamen. Benutzerdefinierte/lokale Provider-Endpunkte vertrauen für abgesicherte Modell-Requests auch genau dem konfigurierten `scheme://host:port`-Ursprung, einschließlich Loopback-, LAN- und Tailnet-Hosts. Dies ist keine neue Konfigurationsoption; die von Ihnen konfigurierte `baseUrl` erweitert die Request-Richtlinie nur für diesen Ursprung. Fake-IP-Hostname-Erlaubnis und Vertrauen in den exakten Ursprung sind unabhängige Mechanismen. Andere private Ziele, Loopback-, Link-Local- und Metadata-Ziele sowie andere Ports erfordern weiterhin eine explizite Zustimmung mit `models.providers.<id>.request.allowPrivateNetwork: true`. Setzen Sie `models.providers.<id>.request.allowPrivateNetwork: false`, um das Vertrauen in den exakten Ursprung zu deaktivieren.
    - Wenn `baseUrl` leer ist/ausgelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` auflöst).
    - Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.
    - Für `api: "anthropic-messages"` auf nicht direkten Endpunkten (jeder Provider außer dem kanonischen `anthropic` oder eine benutzerdefinierte `models.providers.anthropic.baseUrl`, deren Host kein öffentlicher `api.anthropic.com`-Endpunkt ist) unterdrückt OpenClaw implizite Anthropic-Beta-Header wie `claude-code-20250219`, `interleaved-thinking-2025-05-14` und OAuth-Marker, damit benutzerdefinierte Anthropic-kompatible Proxys nicht unterstützte Beta-Flags nicht ablehnen. Setzen Sie `models.providers.<id>.headers["anthropic-beta"]` ausdrücklich, wenn Ihr Proxy bestimmte Beta-Funktionen benötigt.

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

- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - Modellkonfigurationsschlüssel
- [Modell-Failover](/de/concepts/model-failover) - Fallback-Ketten und Wiederholungsverhalten
- [Modelle](/de/concepts/models) - Modellkonfiguration und Aliasse
- [Provider](/de/providers) - Einrichtungsleitfäden pro Provider
