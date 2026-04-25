---
read_when:
    - Sie benötigen eine anbieterbezogene Referenz zur Modelleinrichtung.
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modellanbieter.
summary: Überblick über Modellanbieter mit Beispielkonfigurationen + CLI-Abläufen
title: Modellanbieter
x-i18n:
    generated_at: "2026-04-25T13:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

Referenz für **LLM-/Modellanbieter** (nicht Chat-Channels wie WhatsApp/Telegram). Für Regeln zur Modellauswahl siehe [Models](/de/concepts/models).

## Schnellregeln

- Modellreferenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- `agents.defaults.models` dient als Allowlist, wenn es gesetzt ist.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten; `contextTokens` ist die effektive Laufzeitgrenze.
- Fallback-Regeln, Cooldown-Probes und die Persistenz von Session-Overrides: [Model failover](/de/concepts/model-failover).
- Routen der OpenAI-Familie sind präfixspezifisch: `openai/<model>` verwendet den direkten OpenAI-API-Key-Anbieter in PI, `openai-codex/<model>` verwendet Codex OAuth in PI, und `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` verwendet das native Codex-App-Server-Harness. Siehe [OpenAI](/de/providers/openai) und [Codex harness](/de/plugins/codex-harness). Wenn die Trennung zwischen Anbieter und Laufzeit verwirrend ist, lesen Sie zuerst [Agent runtimes](/de/concepts/agent-runtimes).
- Das automatische Aktivieren von Plugins folgt derselben Grenze: `openai-codex/<model>` gehört zum OpenAI-Plugin, während das Codex-Plugin durch `embeddedHarness.runtime: "codex"` oder Legacy-Referenzen `codex/<model>` aktiviert wird.
- CLI-Laufzeiten verwenden dieselbe Trennung: Wählen Sie kanonische Modellreferenzen wie `anthropic/claude-*`, `google/gemini-*` oder `openai/gpt-*` und setzen Sie dann `agents.defaults.embeddedHarness.runtime` auf `claude-cli`, `google-gemini-cli` oder `codex-cli`, wenn Sie ein lokales CLI-Backend verwenden möchten. Legacy-Referenzen `claude-cli/*`, `google-gemini-cli/*` und `codex-cli/*` werden zurück auf kanonische Anbieterreferenzen migriert, wobei die Laufzeit separat gespeichert wird.
- GPT-5.5 ist verfügbar über `openai-codex/gpt-5.5` in PI, das native Codex-App-Server-Harness und die öffentliche OpenAI-API, wenn der gebündelte PI-Katalog `openai/gpt-5.5` für Ihre Installation bereitstellt.

## Plugin-eigenes Anbieterverhalten

Die meiste anbieterspezifische Logik lebt in Anbieter-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife beibehält. Plugins besitzen Onboarding, Modellkataloge, Auth-Env-Var-Zuordnung, Transport-/Konfigurationsnormalisierung, Bereinigung von Tool-Schemas, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Thinking-/Reasoning-Profile und mehr.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele gebündelter Plugins finden Sie unter [Provider plugins](/de/plugins/sdk-provider-plugins). Ein Anbieter, der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

<Note>
Provider-Laufzeit-`capabilities` sind gemeinsame Runner-Metadaten (Anbieterfamilie, Transcript-/Tooling-Eigenheiten, Transport-/Cache-Hinweise). Das ist nicht dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model), das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
</Note>

## API-Key-Rotation

- Unterstützt generische Anbieterrotation für ausgewählte Anbieter.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Anbieter wird `GOOGLE_API_KEY` außerdem als Fallback einbezogen.
- Die Reihenfolge der Schlüsselauswahl bewahrt die Priorität und dedupliziert Werte.
- Anfragen werden nur bei Rate-Limit-Antworten mit dem nächsten Schlüssel erneut versucht (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder periodische Meldungen über Nutzungslimits).
- Fehler, die keine Rate-Limits sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der endgültige Fehler aus dem letzten Versuch zurückgegeben.

## Integrierte Anbieter (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Anbieter benötigen **keine**
`models.providers`-Konfiguration; setzen Sie einfach die Authentifizierung und wählen Sie ein Modell.

### OpenAI

- Anbieter: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Die direkte API-Unterstützung für GPT-5.5 hängt von der gebündelten PI-Katalogversion Ihrer Installation ab; prüfen Sie dies mit `openclaw models list --provider openai`, bevor Sie `openai/gpt-5.5` ohne die Codex-App-Server-Laufzeit verwenden.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standardtransport ist `auto` (zuerst WebSocket, dann SSE-Fallback)
- Überschreiben Sie dies pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das Warm-up des OpenAI-Responses-WebSocket ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen Schalters `/fast` ein explizites Tier möchten
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`) werden nur auf nativen OpenAI-Traffic an `api.openai.com` angewendet, nicht auf generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und OpenAI-Reasoning-kompatible Payload-Formung bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil Live-Anfragen an die OpenAI-API es ablehnen und der aktuelle Codex-Katalog es nicht bereitstellt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Anbieter: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich API-Key- und OAuth-authentifiziertem Traffic an `api.anthropic.com`; OpenClaw ordnet dies Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Anthropic-Hinweis: Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Wiederverwendung der Claude CLI im Stil von OpenClaw wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Das Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Anbieter: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI-Modellreferenz: `openai-codex/gpt-5.5`
- Referenz für das native Codex-App-Server-Harness: `openai/gpt-5.5` mit `agents.defaults.embeddedHarness.runtime: "codex"`
- Dokumentation zum nativen Codex-App-Server-Harness: [Codex harness](/de/plugins/codex-harness)
- Legacy-Modellreferenzen: `codex/gpt-*`
- Plugin-Grenze: `openai-codex/*` lädt das OpenAI-Plugin; das native Codex-App-Server-Plugin wird nur durch die Codex-Harness-Laufzeit oder Legacy-Referenzen `codex/*` ausgewählt.
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Standardtransport ist `auto` (zuerst WebSocket, dann SSE-Fallback)
- Überschreiben Sie dies pro PI-Modell über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Anfragen weitergereicht (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`) werden nur an nativen Codex-Traffic zu `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Verwendet denselben Schalter `/fast` und dieselbe Konfiguration `params.fastMode` wie direkte `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.5` verwendet das native `contextWindow = 400000` des Codex-Katalogs und das Standard-Laufzeitlimit `contextTokens = 272000`; überschreiben Sie die Laufzeitgrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.
- Verwenden Sie `openai-codex/gpt-5.5`, wenn Sie die Codex-OAuth-/Abonnementroute möchten; verwenden Sie `openai/gpt-5.5`, wenn Ihr API-Key-Setup und Ihr lokaler Katalog die Route über die öffentliche API bereitstellen.

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

- [Qwen Cloud](/de/providers/qwen) — Anbieteroberfläche von Qwen Cloud plus Zuordnung von Alibaba-DashScope- und Coding-Plan-Endpunkten
- [MiniMax](/de/providers/minimax) — MiniMax Coding Plan OAuth oder API-Key-Zugriff
- [GLM models](/de/providers/glm) — Z.AI Coding Plan oder allgemeine API-Endpunkte

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Anbieter der Zen-Laufzeit: `opencode`
- Anbieter der Go-Laufzeit: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Key)

- Anbieter: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, Fallback `GOOGLE_API_KEY` und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Alte OpenClaw-Konfigurationen mit `google/gemini-3.1-flash-preview` werden zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` verwendet das dynamische Thinking von Google. Gemini 3/3.1 lassen ein festes `thinkingLevel` weg; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Läufe akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das ältere `cached_content`), um einen anbieternativen Handle `cachedContents/...` weiterzureichen; Gemini-Cache-Treffer werden als OpenClaw-`cacheRead` angezeigt

### Google Vertex und Gemini CLI

- Anbieter: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen bei Google-Konten gemeldet. Prüfen Sie die Google-Nutzungsbedingungen und verwenden Sie ein unkritisches Konto, wenn Sie sich dafür entscheiden.
- Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Sie fügen **keine** Client-ID oder kein Secret in `openclaw.json` ein. Der CLI-Login-Ablauf speichert Tokens in Auth-Profilen auf dem Gateway-Host.
  - Wenn Anfragen nach dem Login fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - JSON-Antworten der Gemini CLI werden aus `response` geparst; die Nutzung greift auf `stats` zurück, wobei `stats.cached` zu OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Anbieter: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliase: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt automatisch den passenden Z.AI-Endpunkt; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Anbieter: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Anbieter: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog enthält `kilocode/kilo/auto`; die Live-Erkennung über
  `https://api.kilo.ai/api/gateway/models` kann den Laufzeitkatalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` wird von Kilo Gateway verwaltet,
  nicht hart in OpenClaw kodiert.

Siehe [/providers/kilocode](/de/providers/kilocode) für Einrichtungsdetails.

### Weitere gebündelte Anbieter-Plugins

| Anbieter                | ID                               | Auth-Env                                                     | Beispielmodell                                  |
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

Wichtige Besonderheiten:

- **OpenRouter** wendet seine App-Attributions-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Referenzen sind für von OpenRouter verwaltetes Prompt-Caching mit Cache-TTL geeignet, erhalten aber keine Anthropic-Cache-Marker. Als proxyartiger OpenAI-kompatibler Pfad überspringt es nur für natives OpenAI geltende Formung (`serviceTier`, Responses-`store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-gestützte Referenzen behalten nur die Proxy-Gemini-Bereinigung von Thought-Signaturen bei.
- **Kilo Gateway**: Gemini-gestützte Referenzen folgen demselben Proxy-Gemini-Bereinigungspfad; `kilocode/kilo/auto` und andere Referenzen, die Proxy-Reasoning nicht unterstützen, überspringen das Einfügen von Proxy-Reasoning.
- **MiniMax**: Das Onboarding mit API-Key schreibt explizite textbasierte M2.7-Chatmodell-Definitionen; Bildverständnis bleibt beim Plugin-eigenen Medienanbieter `MiniMax-VL-01`.
- **xAI** verwendet den xAI-Responses-Pfad. `/fast` oder `params.fastMode: true` schreibt `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras**: GLM-Modelle verwenden `zai-glm-4.7` / `zai-glm-4.6`; die OpenAI-kompatible Basis-URL ist `https://api.cerebras.ai/v1`.

## Anbieter über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Anbieter oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Anbieter-Plugins veröffentlichen bereits einen Standardkatalog.
Verwenden Sie explizite `models.providers.<id>`-Einträge nur dann, wenn Sie die
Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Anbieter-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Anbieter
und fügen Sie nur dann einen expliziten `models.providers.moonshot`-Eintrag hinzu, wenn Sie
die Basis-URL oder Modellmetadaten überschreiben müssen:

- Anbieter: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Modell-IDs für Kimi K2:

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

Kimi Coding verwendet den mit Anthropic kompatiblen Endpunkt von Moonshot AI:

- Anbieter: `kimi`
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

Volcano Engine (火山引擎) bietet Zugang zu Doubao und anderen Modellen in China.

- Anbieter: `volcengine` (Coding: `volcengine-plan`)
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

Beim Onboarding wird standardmäßig die Coding-Oberfläche verwendet, aber der allgemeine Katalog `volcengine/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen von Onboarding/Configure bevorzugt die Volcengine-Auth-Auswahl sowohl
Zeilen mit `volcengine/*` als auch mit `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind,
greift OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
anbieterbezogene Auswahl anzuzeigen.

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

BytePlus ARK bietet internationalen Nutzern Zugang zu denselben Modellen wie Volcano Engine.

- Anbieter: `byteplus` (Coding: `byteplus-plan`)
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

Beim Onboarding wird standardmäßig die Coding-Oberfläche verwendet, aber der allgemeine Katalog `byteplus/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen von Onboarding/Configure bevorzugt die BytePlus-Auth-Auswahl sowohl
Zeilen mit `byteplus/*` als auch mit `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind,
greift OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
anbieterbezogene Auswahl anzuzeigen.

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

Synthetic stellt über den Anbieter `synthetic` mit Anthropic kompatible Modelle bereit:

- Anbieter: `synthetic`
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

Auf dem mit Anthropic kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig,
sofern Sie es nicht explizit setzen, und `/fast on` schreibt
`MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.

Plugin-eigene Aufteilung der Fähigkeiten:

- Text-/Chat-Standards bleiben auf `minimax/MiniMax-M2.7`
- Bilderzeugung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist das Plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Websuche bleibt auf der Anbieter-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Anbieter-Plugin ausgeliefert und verwendet die native API:

- Anbieter: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der IDs, die von `http://localhost:1234/api/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio
für Erkennung + automatisches Laden und standardmäßig `/v1/chat/completions` für Inferenz.
Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als gebündeltes Anbieter-Plugin ausgeliefert und verwendet die native API von Ollama:

- Anbieter: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama installieren, dann ein Modell ziehen:
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
`OLLAMA_API_KEY` dafür anmelden, und das gebündelte Anbieter-Plugin fügt Ollama direkt zu
`openclaw onboard` und der Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Anbieter-Plugin für lokale/selbstgehostete OpenAI-kompatible
Server ausgeliefert:

- Anbieter: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für die automatische Erkennung anzumelden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Siehe [/providers/vllm](/de/providers/vllm) für Details.

### SGLang

SGLang wird als gebündeltes Anbieter-Plugin für schnelle selbstgehostete
OpenAI-kompatible Server ausgeliefert:

- Anbieter: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für die automatische Erkennung anzumelden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung nicht
erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

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

Hinweise:

- Für benutzerdefinierte Anbieter sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfohlen: Setzen Sie explizite Werte, die zu den Grenzwerten Ihres Proxys/Modells passen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist), erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler für nicht unterstützte `developer`-Rollen zu vermeiden.
- Proxyartige OpenAI-kompatible Routen überspringen außerdem nur für natives OpenAI geltende Request-Formung: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Prompt-Cache-Hinweise, keine OpenAI-Reasoning-kompatible Payload-Formung und keine versteckten OpenClaw-Attributions-Header.
- Für OpenAI-kompatible Completions-Proxys, die anbieterspezifische Felder benötigen, setzen Sie `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`), um zusätzliches JSON in den ausgehenden Request-Body zusammenzuführen.
- Wenn `baseUrl` leer ist oder weggelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
- Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten dennoch überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [Configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Models](/de/concepts/models) — Modellkonfiguration und Aliase
- [Model failover](/de/concepts/model-failover) — Fallback-Ketten und Retry-Verhalten
- [Configuration reference](/de/gateway/config-agents#agent-defaults) — Schlüssel der Modellkonfiguration
- [Providers](/de/providers) — anbieterbezogene Einrichtungsanleitungen
