---
read_when:
    - Sie benötigen eine modellanbieterspezifische Einrichtungsreferenz
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
sidebarTitle: Model providers
summary: Überblick über Modell-Provider mit Beispielkonfigurationen und CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-04-26T11:27:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

Referenz für **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram). Regeln zur Modellauswahl finden Sie unter [Models](/de/concepts/models).

## Schnellregeln

<AccordionGroup>
  <Accordion title="Modell-Refs und CLI-Helfer">
    - Modell-Refs verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` fungiert als Allowlist, wenn es gesetzt ist.
    - CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.models[].contextWindow` sind native Modellmetadaten; `contextTokens` ist die effektive Laufzeitobergrenze.
    - Fallback-Regeln, Cooldown-Probes und Persistenz von Sitzungsüberschreibungen: [Model failover](/de/concepts/model-failover).
  </Accordion>
  <Accordion title="OpenAI-Provider-/Laufzeit-Split">
    OpenAI-Familien-Routen sind präfixspezifisch:

    - `openai/<model>` verwendet den direkten OpenAI-API-Key-Provider in Pi.
    - `openai-codex/<model>` verwendet Codex OAuth in Pi.
    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` verwendet das native Codex-App-Server-Harness.

    Siehe [OpenAI](/de/providers/openai) und [Codex harness](/de/plugins/codex-harness). Wenn der Split zwischen Provider und Laufzeit verwirrend ist, lesen Sie zuerst [Agent runtimes](/de/concepts/agent-runtimes).

    Das automatische Aktivieren von Plugins folgt derselben Grenze: `openai-codex/<model>` gehört zum OpenAI-Plugin, während das Codex-Plugin durch `agentRuntime.id: "codex"` oder veraltete `codex/<model>`-Refs aktiviert wird.

    GPT-5.5 ist verfügbar über `openai/gpt-5.5` für direkten API-Key-Datenverkehr, `openai-codex/gpt-5.5` in Pi für Codex OAuth und das native Codex-App-Server-Harness, wenn `agentRuntime.id: "codex"` gesetzt ist.

  </Accordion>
  <Accordion title="CLI-Laufzeiten">
    CLI-Laufzeiten verwenden denselben Split: Wählen Sie kanonische Modell-Refs wie `anthropic/claude-*`, `google/gemini-*` oder `openai/gpt-*` und setzen Sie dann `agents.defaults.agentRuntime.id` auf `claude-cli`, `google-gemini-cli` oder `codex-cli`, wenn Sie ein lokales CLI-Backend verwenden möchten.

    Veraltete Refs wie `claude-cli/*`, `google-gemini-cli/*` und `codex-cli/*` werden zurück auf kanonische Provider-Refs migriert, wobei die Laufzeit separat erfasst wird.

  </Accordion>
</AccordionGroup>

## Plugin-eigenes Provider-Verhalten

Die meiste provider-spezifische Logik liegt in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife beibehält. Plugins besitzen Onboarding, Modellkataloge, Auth-Env-Variablenzuordnung, Transport-/Konfigurationsnormalisierung, Tool-Schema-Bereinigung, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Thinking-/Reasoning-Profile und mehr.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele für gebündelte Plugins finden Sie unter [Provider plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

<Note>
Provider-Laufzeit-`capabilities` sind gemeinsame Runner-Metadaten (Provider-Familie, Transkript-/Tooling-Eigenheiten, Transport-/Cache-Hinweise). Das ist nicht dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model), das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
</Note>

## API-Key-Rotation

<AccordionGroup>
  <Accordion title="Schlüsselquellen und Priorität">
    Konfigurieren Sie mehrere Schlüssel über:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
    - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
    - `<PROVIDER>_API_KEY` (primärer Schlüssel)
    - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)

    Bei Google-Providern wird `GOOGLE_API_KEY` zusätzlich als Fallback einbezogen. Die Reihenfolge der Schlüsselauswahl behält die Priorität bei und entfernt doppelte Werte.

  </Accordion>
  <Accordion title="Wann die Rotation greift">
    - Requests werden nur bei Antworten mit Rate-Limits mit dem nächsten Schlüssel erneut versucht (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder periodische Meldungen zu Nutzungslimits).
    - Fehler, die keine Rate-Limits sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
    - Wenn alle Kandidatenschlüssel fehlschlagen, wird der endgültige Fehler vom letzten Versuch zurückgegeben.
  </Accordion>
</AccordionGroup>

## Integrierte Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi-ai-Katalog ausgeliefert. Diese Provider benötigen **keine** `models.providers`-Konfiguration; setzen Sie einfach die Authentifizierung und wählen Sie ein Modell.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifizieren Sie Konto-/Modellverfügbarkeit mit `openclaw models list --provider openai`, falls sich eine bestimmte Installation oder ein API-Key anders verhält.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- OpenAI-Responses-WebSocket-Warm-up ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Requests `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie einen expliziten Tier statt des gemeinsamen Schalters `/fast` möchten
- Versteckte OpenClaw-Attribution-Header (`originator`, `version`, `User-Agent`) werden nur auf nativem OpenAI-Datenverkehr zu `api.openai.com` angewendet, nicht auf generischen OpenAI-kompatiblen Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und OpenAI-Reasoning-kompatible Payload-Formung bei; Proxy-Routen tun das nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil Live-OpenAI-API-Requests es ablehnen und der aktuelle Codex-Katalog es nicht bereitstellt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Requests unterstützen den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich API-Key- und OAuth-authentifiziertem Datenverkehr zu `api.anthropic.com`; OpenClaw ordnet dies dem Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Die bevorzugte Claude-CLI-Konfiguration behält den Modell-Ref kanonisch und wählt das CLI-Backend separat: `anthropic/claude-opus-4-7` mit `agents.defaults.agentRuntime.id: "claude-cli"`. Veraltete Refs wie `claude-cli/claude-opus-4-7` funktionieren aus Kompatibilitätsgründen weiterhin.

<Note>
Anthropic-Mitarbeiter haben uns mitgeteilt, dass Claude-CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht. Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt nun die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Pi-Modell-Ref: `openai-codex/gpt-5.5`
- Native Codex-App-Server-Harness-Ref: `openai/gpt-5.5` mit `agents.defaults.agentRuntime.id: "codex"`
- Doku zum nativen Codex-App-Server-Harness: [Codex harness](/de/plugins/codex-harness)
- Veraltete Modell-Refs: `codex/gpt-*`
- Plugin-Grenze: `openai-codex/*` lädt das OpenAI-Plugin; das native Codex-App-Server-Plugin wird nur durch die Codex-Harness-Laufzeit oder veraltete `codex/*`-Refs ausgewählt.
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Pi-Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Requests (`chatgpt.com/backend-api`) weitergeleitet
- Versteckte OpenClaw-Attribution-Header (`originator`, `version`, `User-Agent`) werden nur bei nativem Codex-Datenverkehr zu `chatgpt.com/backend-api` angehängt, nicht bei generischen OpenAI-kompatiblen Proxys
- Teilt denselben Schalter `/fast` und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.5` verwendet das native `contextWindow = 400000` des Codex-Katalogs und das Standard-Laufzeitlimit `contextTokens = 272000`; überschreiben Sie die Laufzeitobergrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.
- Verwenden Sie `openai-codex/gpt-5.5`, wenn Sie die Codex-OAuth-/Abonnementroute möchten; verwenden Sie `openai/gpt-5.5`, wenn Ihre API-Key-Einrichtung und Ihr lokaler Katalog die öffentliche API-Route bereitstellen.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Andere gehostete Optionen im Abonnementstil

<CardGroup cols={3}>
  <Card title="GLM-Modelle" href="/de/providers/glm">
    Z.AI Coding Plan oder allgemeine API-Endpunkte.
  </Card>
  <Card title="MiniMax" href="/de/providers/minimax">
    MiniMax Coding Plan OAuth oder API-Key-Zugriff.
  </Card>
  <Card title="Qwen Cloud" href="/de/providers/qwen">
    Qwen-Cloud-Provider-Oberfläche plus Alibaba-DashScope- und Coding-Plan-Endpunktzuordnung.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Laufzeit-Provider: `opencode`
- Go-Laufzeit-Provider: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, Fallback `GOOGLE_API_KEY` und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Veraltete OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` verwendet dynamisches Thinking von Google. Gemini 3/3.1 lassen ein festes `thinkingLevel` weg; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Läufe akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder veraltet `cached_content`), um ein provider-natives Handle `cachedContents/...` weiterzugeben; Gemini-Cache-Treffer erscheinen in OpenClaw als `cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Flow

<Warning>
Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben von Einschränkungen ihres Google-Kontos nach der Nutzung von Drittanbieter-Clients berichtet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein unkritisches Konto, wenn Sie sich dafür entscheiden.
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

    Standardmodell: `google-gemini-cli/gemini-3-flash-preview`. Sie fügen **keine** Client-ID oder kein Secret in `openclaw.json` ein. Der CLI-Anmeldefluss speichert Tokens in Auth-Profilen auf dem Gateway-Host.

  </Step>
  <Step title="Projekt festlegen (falls erforderlich)">
    Wenn Requests nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  </Step>
</Steps>

Gemini-CLI-JSON-Antworten werden aus `response` geparst; Nutzungsdaten fallen auf `stats` zurück, wobei `stats.cached` in OpenClaw zu `cacheRead` normalisiert wird.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog enthält `kilocode/kilo/auto`; die Live-Erkennung über `https://api.kilo.ai/api/gateway/models` kann den Laufzeitkatalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` wird von Kilo Gateway verwaltet und ist nicht in OpenClaw fest codiert.

Details zur Einrichtung finden Sie unter [/providers/kilocode](/de/providers/kilocode).

### Weitere gebündelte Provider-Plugins

| Provider                | ID                               | Auth-Env                                                     | Beispielmodell                                  |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` oder `KIMICODE_API_KEY`                       | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

#### Wissenswerte Besonderheiten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Wendet seine App-Attribution-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Refs sind für prompt-caching mit TTL unter OpenRouter geeignet, erhalten aber keine Anthropic-Cache-Marker. Als proxyartiger OpenAI-kompatibler Pfad überspringt er natives, nur für OpenAI vorgesehenes Shaping (`serviceTier`, Responses-`store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Auf Gemini basierende Refs behalten nur die proxy-Gemini-Bereinigung von Thought-Signaturen bei.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Auf Gemini basierende Refs folgen demselben Pfad für proxy-Gemini-Bereinigung; `kilocode/kilo/auto` und andere Refs ohne Unterstützung für Proxy-Reasoning überspringen die Injektion von Proxy-Reasoning.
  </Accordion>
  <Accordion title="MiniMax">
    API-Key-Onboarding schreibt explizite rein textbasierte M2.7-Chatmodell-Definitionen; Bilderkennung verbleibt beim plugin-eigenen Medien-Provider `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="xAI">
    Verwendet den xAI-Responses-Pfad. `/fast` oder `params.fastMode: true` schreibt `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiv; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    GLM-Modelle verwenden `zai-glm-4.7` / `zai-glm-4.6`; die OpenAI-kompatible Basis-URL ist `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provider über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite Einträge unter `models.providers.<id>` nur dann, wenn Sie die Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Provider-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Provider und fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi-K2-Modell-IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
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

### Kimi Coding

Kimi Coding verwendet den Anthropic-kompatiblen Endpunkt von Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Beispielmodell: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Das veraltete `kimi/k2p5` wird weiterhin als kompatible Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet Zugriff auf Doubao und andere Modelle in China.

- Provider: `volcengine` (Coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Beispielmodell: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `volcengine/*` wird gleichzeitig registriert.

In Modell-Auswahlfeldern von Onboarding/Konfiguration bevorzugt die Volcengine-Auth-Auswahl sowohl Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine leere providerbezogene Auswahl anzuzeigen.

<Tabs>
  <Tab title="Standardmodelle">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)
  </Tab>
  <Tab title="Coding-Modelle (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`
  </Tab>
</Tabs>

### BytePlus (international)

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

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `byteplus/*` wird gleichzeitig registriert.

In Modell-Auswahlfeldern von Onboarding/Konfiguration bevorzugt die BytePlus-Auth-Auswahl sowohl Zeilen `byteplus/*` als auch `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine leere providerbezogene Auswahl anzuzeigen.

<Tabs>
  <Tab title="Standardmodelle">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)
  </Tab>
  <Tab title="Coding-Modelle (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`
  </Tab>
</Tabs>

### Synthetic

Synthetic stellt Anthropic-kompatible Modelle über den Provider `synthetic` bereit:

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

- MiniMax OAuth (global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Key (global): `--auth-choice minimax-global-api`
- MiniMax API-Key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`

Einrichtungsdetails, Modelloptionen und Konfigurations-Snippets finden Sie unter [/providers/minimax](/de/providers/minimax).

<Note>
Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig, sofern Sie es nicht explizit setzen, und `/fast on` schreibt `MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.
</Note>

Plugin-eigener Fähigkeits-Split:

- Text-/Chat-Standards bleiben auf `minimax/MiniMax-M2.7`
- Bilderzeugung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bilderkennung ist das plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt auf der Provider-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Provider-Plugin ausgeliefert und verwendet die native API:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `http://localhost:1234/api/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio für Erkennung und automatisches Laden sowie standardmäßig `/v1/chat/completions` für Inferenz. Einrichtung und Fehlerbehebung finden Sie unter [/providers/lmstudio](/de/providers/lmstudio).

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet die native API von Ollama:

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

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit `OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Provider-Plugin fügt Ollama direkt zu `openclaw onboard` und der Modellauswahl hinzu. Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration finden Sie unter [/providers/ollama](/de/providers/ollama).

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/self-hosted OpenAI-kompatible Server ausgeliefert:

- Provider: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um die automatische lokale Erkennung zu aktivieren (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Details finden Sie unter [/providers/vllm](/de/providers/vllm).

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle self-hosted OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um die automatische lokale Erkennung zu aktivieren (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Details finden Sie unter [/providers/sglang](/de/providers/sglang).

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
    Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional. Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Empfehlung: Setzen Sie explizite Werte, die zu den Grenzen Ihres Proxys/Modells passen.

  </Accordion>
  <Accordion title="Regeln für Proxy-Routen-Shaping">
    - Bei `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler wegen nicht unterstützter `developer`-Rollen zu vermeiden.
    - Proxyartige OpenAI-kompatible Routen überspringen außerdem natives, nur für OpenAI vorgesehenes Request-Shaping: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Prompt-Cache-Hinweise, kein OpenAI-Reasoning-kompatibles Payload-Shaping und keine versteckten OpenClaw-Attribution-Header.
    - Für OpenAI-kompatible Completions-Proxys, die herstellerspezifische Felder benötigen, setzen Sie `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`), um zusätzliches JSON in den ausgehenden Request-Body zusammenzuführen.
    - Für vLLM-Chat-Template-Steuerungen setzen Sie `agents.defaults.models["provider/model"].params.chat_template_kwargs`. OpenClaw sendet automatisch `enable_thinking: false` und `force_nonempty_content: true` für `vllm/nemotron-3-*`, wenn die Thinking-Stufe der Sitzung deaktiviert ist.
    - Wenn `baseUrl` leer ist oder weggelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
    - Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.
  </Accordion>
</AccordionGroup>

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [Configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Configuration reference](/de/gateway/config-agents#agent-defaults) — Modell-Konfigurationsschlüssel
- [Model failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Models](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Providers](/de/providers) — Einrichtungsanleitungen pro Provider
