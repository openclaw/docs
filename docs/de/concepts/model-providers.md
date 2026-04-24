---
read_when:
    - Sie benötigen eine anbieterweise Referenz zur Model-Einrichtung.
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Model-Provider.
summary: Übersicht über Model-Provider mit Beispielkonfigurationen + CLI-Abläufen
title: Model-Provider
x-i18n:
    generated_at: "2026-04-24T15:21:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79258cb26fae7926c65b6fe0db938c7b5736a540b33bc24c1fad5ad706ac8204
    source_path: concepts/model-providers.md
    workflow: 15
---

Diese Seite behandelt **LLM-/Model-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Für Regeln zur Modellauswahl siehe [/concepts/models](/de/concepts/models).

## Schnellregeln

- Modell-Referenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- `agents.defaults.models` dient als Allowlist, wenn es gesetzt ist.
- CLI-Hilfen: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` sind native Modell-Metadaten; `contextTokens` ist die effektive Laufzeitbegrenzung.
- Fallback-Regeln, Cooldown-Prüfungen und Persistenz von Sitzungs-Overrides: [Model failover](/de/concepts/model-failover).
- Routen der OpenAI-Familie sind präfixspezifisch: `openai/<model>` verwendet den direkten OpenAI-API-Key-Provider in PI, `openai-codex/<model>` verwendet Codex OAuth in PI, und `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` verwendet das native Codex-App-Server-Harness. Siehe [OpenAI](/de/providers/openai) und [Codex harness](/de/plugins/codex-harness).
- Das automatische Aktivieren von Plugins folgt derselben Abgrenzung: `openai-codex/<model>` gehört zum OpenAI-Plugin, während das Codex-Plugin durch `embeddedHarness.runtime: "codex"` oder ältere `codex/<model>`-Referenzen aktiviert wird.
- GPT-5.5 ist derzeit über Abonnement-/OAuth-Routen verfügbar: `openai-codex/gpt-5.5` in PI oder `openai/gpt-5.5` mit dem Codex-App-Server-Harness. Die direkte API-Key-Route für `openai/gpt-5.5` wird unterstützt, sobald OpenAI GPT-5.5 in der öffentlichen API freischaltet; bis dahin verwenden Sie für `OPENAI_API_KEY`-Setups API-fähige Modelle wie `openai/gpt-5.4`.

## Plugin-eigenes Provider-Verhalten

Die meiste providerspezifische Logik lebt in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife beibehält. Plugins übernehmen Onboarding, Modellkataloge, Auth-Umgebungsvariablen-Zuordnung, Transport-/Konfigurationsnormalisierung, Bereinigung von Tool-Schemas, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Thinking-/Reasoning-Profile und mehr.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele für mitgelieferte Plugins finden Sie unter [Provider plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefergehende Erweiterungsoberfläche.

<Note>
Die Provider-Laufzeit-`capabilities` sind gemeinsame Runner-Metadaten (Provider-Familie, Transcript-/Tooling-Besonderheiten, Transport-/Cache-Hinweise). Das ist nicht dasselbe wie das [public capability model](/de/plugins/architecture#public-capability-model), das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
</Note>

## Rotation von API-Schlüsseln

- Unterstützt generische Provider-Rotation für ausgewählte Provider.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Provider ist `GOOGLE_API_KEY` zusätzlich als Fallback enthalten.
- Die Reihenfolge der Schlüsselauswahl behält die Priorität bei und entfernt doppelte Werte.
- Anfragen werden nur bei Antworten mit Rate-Limits mit dem nächsten Schlüssel erneut versucht (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Nutzungslimit-Meldungen).
- Fehler, die keine Rate-Limits sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der letzte Fehler aus dem letzten Versuch zurückgegeben.

## Integrierte Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi-ai-Katalog ausgeliefert. Diese Provider erfordern **keine**
`models.providers`-Konfiguration; setzen Sie einfach die Authentifizierung und wählen Sie ein Modell.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Die direkte API-Unterstützung für GPT-5.5 ist hier bereits vorbereitet, sobald OpenAI GPT-5.5 in der API bereitstellt
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das Warm-up für OpenAI Responses WebSocket ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen `/fast`-Toggles eine explizite Stufe möchten
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) gelten nur für nativen OpenAI-Traffic zu `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und OpenAI-Reasoning-kompatible Payload-Aufbereitung bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil Live-Anfragen an die OpenAI-API es ablehnen und der aktuelle Codex-Katalog es nicht bereitstellt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen den gemeinsamen `/fast`-Toggle und `params.fastMode`, einschließlich per API-Key und OAuth authentifiziertem Traffic an `api.anthropic.com`; OpenClaw ordnet dies Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Anthropic-Hinweis: Anthropic-Mitarbeitende haben uns mitgeteilt, dass Claude-CLI-Nutzung im Stil von OpenClaw wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt, wenn verfügbar, die Wiederverwendung von Claude CLI und `claude -p`.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI-Modell-Referenz: `openai-codex/gpt-5.5`
- Native Codex-App-Server-Harness-Referenz: `openai/gpt-5.5` mit `agents.defaults.embeddedHarness.runtime: "codex"`
- Ältere Modell-Referenzen: `codex/gpt-*`
- Plugin-Abgrenzung: `openai-codex/*` lädt das OpenAI-Plugin; das native Codex-App-Server-Plugin wird nur durch die Codex-Harness-Laufzeit oder ältere `codex/*`-Referenzen ausgewählt.
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Pro PI-Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Anfragen weitergeleitet (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) werden nur an nativen Codex-Traffic zu
  `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Nutzt denselben `/fast`-Toggle und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet das `service_tier=priority` zu
- `openai-codex/gpt-5.5` behält das native `contextWindow = 1000000` und ein Standard-Laufzeit-`contextTokens = 272000`; überschreiben Sie die Laufzeitbegrenzung mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird explizit für externe Tools/Workflows wie OpenClaw unterstützt.
- Der aktuelle Zugriff auf GPT-5.5 nutzt diese OAuth-/Abonnement-Route, bis OpenAI GPT-5.5 in der öffentlichen API freischaltet.

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

- [Qwen Cloud](/de/providers/qwen): Qwen-Cloud-Provider-Oberfläche sowie Alibaba-DashScope- und Coding-Plan-Endpunktzuordnung
- [MiniMax](/de/providers/minimax): Zugriff auf MiniMax Coding Plan per OAuth oder API-Key
- [GLM Models](/de/providers/glm): Z.AI Coding Plan oder allgemeine API-Endpunkte

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Laufzeit-Provider: `opencode`
- Go-Laufzeit-Provider: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` als Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Ältere OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Ausführungen akzeptieren auch `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder das ältere `cached_content`), um einen nativen Provider-Handle
  `cachedContents/...` weiterzuleiten; Gemini-Cache-Treffer erscheinen in OpenClaw als `cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Flow
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Nutzende haben von Einschränkungen ihres Google-Kontos nach der Verwendung von Drittanbieter-Clients berichtet. Prüfen Sie die Google-Bedingungen und verwenden Sie bei Bedarf ein nicht kritisches Konto.
- Gemini CLI OAuth wird als Teil des mitgelieferten `google`-Plugins ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Sie fügen **keine** Client-ID oder kein Secret in `openclaw.json` ein. Der CLI-Login-Flow speichert
    Token in Auth-Profilen auf dem Gateway-Host.
  - Wenn Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; die Nutzung fällt auf
    `stats` zurück, wobei `stats.cached` in OpenClaw zu `cacheRead` normalisiert wird.

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
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog enthält `kilocode/kilo/auto`; die Live-Erkennung über
  `https://api.kilo.ai/api/gateway/models` kann den Laufzeitkatalog weiter
  erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` wird von Kilo Gateway verwaltet,
  nicht in OpenClaw fest kodiert.

Siehe [/providers/kilocode](/de/providers/kilocode) für Einrichtungsdetails.

### Andere mitgelieferte Provider-Plugins

| Provider                | Id                               | Auth-Umgebungsvariable                                      | Beispielmodell                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`                     | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` oder `KIMICODE_API_KEY`                      | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                         |

Wichtige Besonderheiten:

- **OpenRouter** wendet seine App-Attributions-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. Als Proxy-artiger OpenAI-kompatibler Pfad überspringt es native, nur für OpenAI geltende Aufbereitung (`serviceTier`, Responses-`store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-gestützte Referenzen behalten nur die Proxy-Gemini-Bereinigung von Thought-Signaturen bei.
- **Kilo Gateway**: Gemini-gestützte Referenzen folgen demselben Proxy-Gemini-Bereinigungspfad; `kilocode/kilo/auto` und andere Referenzen ohne Proxy-Reasoning-Unterstützung überspringen die Einfügung von Proxy-Reasoning.
- **MiniMax**: API-Key-Onboarding schreibt explizite M2.7-Modell-Definitionen mit `input: ["text", "image"]`; der mitgelieferte Katalog hält Chat-Referenzen als rein textbasiert, bis diese Konfiguration materialisiert wird.
- **xAI** verwendet den xAI-Responses-Pfad. `/fast` oder `params.fastMode: true` schreibt `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` in ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras**-GLM-Modelle verwenden `zai-glm-4.7` / `zai-glm-4.6`; die OpenAI-kompatible Basis-URL ist `https://api.cerebras.ai/v1`.

## Provider über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten mitgelieferten Provider-Plugins veröffentlichen bereits einen Standardkatalog.
Verwenden Sie explizite `models.providers.<id>`-Einträge nur, wenn Sie die
standardmäßige Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als mitgeliefertes Provider-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Provider
und fügen Sie nur dann einen expliziten `models.providers.moonshot`-Eintrag hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben
müssen:

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

Das ältere `kimi/k2p5` wird weiterhin als kompatible Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet in China Zugriff auf Doubao und andere Modelle.

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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `volcengine/*`-
Katalog wird gleichzeitig registriert.

In Modellwählern für Onboarding/Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl
`volcengine/*`- als auch `volcengine-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw stattdessen auf den ungefilterten Katalog zurück, statt einen leeren
providerspezifischen Wähler anzuzeigen.

Verfügbare Modelle:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding-Modelle (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK bietet internationalen Nutzenden Zugriff auf dieselben Modelle wie Volcano Engine.

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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `byteplus/*`-
Katalog wird gleichzeitig registriert.

In Modellwählern für Onboarding/Konfiguration bevorzugt die BytePlus-Authentifizierungsoption sowohl
`byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw stattdessen auf den ungefilterten Katalog zurück, statt einen leeren
providerspezifischen Wähler anzuzeigen.

Verfügbare Modelle:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding-Modelle (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic stellt Anthropic-kompatible Modelle hinter dem Provider `synthetic` bereit:

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

MiniMax wird über `models.providers` konfiguriert, weil es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Key (Global): `--auth-choice minimax-global-api`
- MiniMax API-Key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurationsbeispiele.

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig,
sofern Sie es nicht explizit setzen, und `/fast on` schreibt
`MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

Plugin-eigene Aufteilung der Capabilities:

- Text-/Chat-Standards bleiben bei `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist das Plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt auf der Provider-ID `minimax`

### LM Studio

LM Studio wird als mitgeliefertes Provider-Plugin ausgeliefert, das die native API verwendet:

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

OpenClaw verwendet standardmäßig die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio für Erkennung und automatisches Laden sowie `/v1/chat/completions` für Inferenz.
Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als mitgeliefertes Provider-Plugin ausgeliefert und verwendet die native API von Ollama:

- Provider: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Installieren Sie Ollama und laden Sie dann ein Modell:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit
`OLLAMA_API_KEY` dafür entscheiden, und das mitgelieferte Provider-Plugin fügt Ollama direkt zu
`openclaw onboard` und dem Modellwähler hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als mitgeliefertes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible
Server ausgeliefert:

- Provider: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für die automatische Erkennung zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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

Siehe [/providers/vllm](/de/providers/vllm) für Details.

### SGLang

SGLang wird als mitgeliefertes Provider-Plugin für schnelle selbst gehostete
OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für die automatische Erkennung zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung
erzwingt):

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

Siehe [/providers/sglang](/de/providers/sglang) für Details.

### Lokale Proxys (LM Studio, vLLM, LiteLLM usw.)

Beispiel (OpenAI-kompatibel):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Lokal" } },
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
            name: "Lokales Modell",
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

Hinweise:

- Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfehlung: Setzen Sie explizite Werte, die zu den Grenzen Ihres Proxys/Modells passen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler für nicht unterstützte `developer`-Rollen zu vermeiden.
- Proxy-artige OpenAI-kompatible Routen überspringen außerdem native, nur für OpenAI geltende Request-Aufbereitung:
  kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, keine
  OpenAI-Reasoning-kompatible Payload-Aufbereitung und keine versteckten OpenClaw-Attributions-
  Header.
- Wenn `baseUrl` leer ist oder weggelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
- Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [/gateway/configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Models](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Configuration Reference](/de/gateway/config-agents#agent-defaults) — Schlüssel der Modellkonfiguration
- [Providers](/de/providers) — provider-spezifische Einrichtungsanleitungen
