---
read_when:
    - Sie benötigen eine Referenz zur Modell-Einrichtung für jeden Provider
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
sidebarTitle: Model providers
summary: Überblick über Modell-Provider mit Beispielkonfigurationen + CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-04-30T06:49:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

Referenz für **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram). Regeln zur Modellauswahl finden Sie unter [Modelle](/de/concepts/models).

## Kurzregeln

<AccordionGroup>
  <Accordion title="Modellreferenzen und CLI-Hilfen">
    - Modellreferenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` fungiert als Allowlist, wenn es gesetzt ist.
    - CLI-Hilfen: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` legen Standardwerte auf Provider-Ebene fest; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` überschreiben sie pro Modell.
    - Fallback-Regeln, Cooldown-Probes und Persistenz von Sitzungsüberschreibungen: [Modell-Failover](/de/concepts/model-failover).

  </Accordion>
  <Accordion title="Aufteilung von OpenAI-Provider und -Runtime">
    Routen der OpenAI-Familie sind präfixspezifisch:

    - `openai/<model>` verwendet den direkten OpenAI-API-Key-Provider in PI.
    - `openai-codex/<model>` verwendet Codex OAuth in PI.
    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` verwendet das native Codex-App-Server-Harness.

    Siehe [OpenAI](/de/providers/openai) und [Codex-Harness](/de/plugins/codex-harness). Wenn die Aufteilung von Provider und Runtime unklar ist, lesen Sie zuerst [Agent-Runtimes](/de/concepts/agent-runtimes).

    Die automatische Plugin-Aktivierung folgt derselben Grenze: `openai-codex/<model>` gehört zum OpenAI-Plugin, während das Codex-Plugin durch `agentRuntime.id: "codex"` oder Legacy-Referenzen `codex/<model>` aktiviert wird.

    GPT-5.5 ist über `openai/gpt-5.5` für direkten API-Key-Traffic, `openai-codex/gpt-5.5` in PI für Codex OAuth und das native Codex-App-Server-Harness verfügbar, wenn `agentRuntime.id: "codex"` gesetzt ist.

  </Accordion>
  <Accordion title="CLI-Runtimes">
    CLI-Runtimes verwenden dieselbe Aufteilung: Wählen Sie kanonische Modellreferenzen wie `anthropic/claude-*`, `google/gemini-*` oder `openai/gpt-*` und setzen Sie dann `agents.defaults.agentRuntime.id` auf `claude-cli`, `google-gemini-cli` oder `codex-cli`, wenn Sie ein lokales CLI-Backend verwenden möchten.

    Legacy-Referenzen `claude-cli/*`, `google-gemini-cli/*` und `codex-cli/*` werden zurück zu kanonischen Provider-Referenzen migriert, wobei die Runtime separat gespeichert wird.

  </Accordion>
</AccordionGroup>

## Plugin-eigenes Provider-Verhalten

Die meiste providerspezifische Logik befindet sich in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife beibehält. Plugins verantworten Onboarding, Modellkataloge, Auth-Env-Var-Zuordnung, Transport-/Konfigurationsnormalisierung, Tool-Schema-Bereinigung, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Denk-/Reasoning-Profile und mehr.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele gebündelter Plugins finden Sie unter [Provider-Plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefergehende Erweiterungsoberfläche.

<Note>
Provider-eigenes Runner-Verhalten liegt auf expliziten Provider-Hooks wie Replay-Policy, Tool-Schema-Normalisierung, Stream-Wrapping und Transport-/Request-Hilfen. Die statische Legacy-Sammlung `ProviderPlugin.capabilities` dient nur der Kompatibilität und wird von der gemeinsamen Runner-Logik nicht mehr gelesen.
</Note>

## API-Key-Rotation

<AccordionGroup>
  <Accordion title="Key-Quellen und Priorität">
    Konfigurieren Sie mehrere Keys über:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
    - `<PROVIDER>_API_KEYS` (durch Kommas oder Semikolons getrennte Liste)
    - `<PROVIDER>_API_KEY` (primärer Key)
    - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)

    Für Google-Provider wird `GOOGLE_API_KEY` auch als Fallback einbezogen. Die Key-Auswahlreihenfolge bewahrt die Priorität und entfernt doppelte Werte.

  </Accordion>
  <Accordion title="Wann die Rotation greift">
    - Requests werden nur bei Rate-Limit-Antworten mit dem nächsten Key wiederholt (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder periodische Nutzungslimit-Meldungen).
    - Fehler, die keine Rate-Limits sind, schlagen sofort fehl; es wird keine Key-Rotation versucht.
    - Wenn alle Kandidaten-Keys fehlschlagen, wird der endgültige Fehler vom letzten Versuch zurückgegeben.

  </Accordion>
</AccordionGroup>

## Integrierte Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Provider benötigen **keine** `models.providers`-Konfiguration; setzen Sie einfach die Authentifizierung und wählen Sie ein Modell.

### OpenAI

- Provider: `openai`
- Authentifizierung: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Prüfen Sie die Konto-/Modellverfügbarkeit mit `openclaw models list --provider openai`, wenn sich eine bestimmte Installation oder ein API-Schlüssel anders verhält.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Überschreiben Sie ihn pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das WebSocket-Warm-up für OpenAI Responses ist standardmäßig über `params.openaiWsWarmup` (`true`/`false`) aktiviert
- Die OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen auf `api.openai.com` `service_tier=priority` zu
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen `/fast`-Schalters eine explizite Stufe festlegen möchten
- Verborgene OpenClaw-Zuordnungsheader (`originator`, `version`, `User-Agent`) gelten nur für nativen OpenAI-Traffic an `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und die OpenAI-kompatible Payload-Formung für Reasoning bei; Proxy-Routen tun dies nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil Live-OpenAI-API-Anfragen es ablehnen und der aktuelle Codex-Katalog es nicht bereitstellt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Authentifizierung: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen den gemeinsamen `/fast`-Schalter und `params.fastMode`, einschließlich API-Schlüssel- und OAuth-authentifiziertem Traffic an `api.anthropic.com`; OpenClaw ordnet dies Anthropic `service_tier` zu (`auto` gegenüber `standard_only`)
- Die bevorzugte Claude-CLI-Konfiguration hält die Modellreferenz kanonisch und wählt das CLI-Backend separat aus: `anthropic/claude-opus-4-7` mit `agents.defaults.agentRuntime.id: "claude-cli"`. Ältere Referenzen wie `claude-cli/claude-opus-4-7` funktionieren aus Kompatibilitätsgründen weiterhin.

<Note>
Anthropic-Mitarbeiter haben uns mitgeteilt, dass die OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht. Das Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Authentifizierung: OAuth (ChatGPT)
- PI-Modellreferenz: `openai-codex/gpt-5.5`
- Referenz für das native Codex-App-Server-Harness: `openai/gpt-5.5` mit `agents.defaults.agentRuntime.id: "codex"`
- Dokumentation zum nativen Codex-App-Server-Harness: [Codex-Harness](/de/plugins/codex-harness)
- Ältere Modellreferenzen: `codex/gpt-*`
- Plugin-Grenze: `openai-codex/*` lädt das OpenAI-Plugin; das native Codex-App-Server-Plugin wird nur durch die Codex-Harness-Laufzeit oder ältere `codex/*`-Referenzen ausgewählt.
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Überschreiben Sie ihn pro PI-Modell über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Anfragen (`chatgpt.com/backend-api`) weitergeleitet
- Verborgene OpenClaw-Zuordnungsheader (`originator`, `version`, `User-Agent`) werden nur bei nativem Codex-Traffic an `chatgpt.com/backend-api` angehängt, nicht bei generischen OpenAI-kompatiblen Proxys
- Teilt denselben `/fast`-Schalter und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.5` verwendet den nativen `contextWindow = 400000` aus dem Codex-Katalog und die Standardlaufzeit `contextTokens = 272000`; überschreiben Sie die Laufzeitobergrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.
- Verwenden Sie `openai-codex/gpt-5.5`, wenn Sie die Codex-OAuth-/Abonnementroute nutzen möchten; verwenden Sie `openai/gpt-5.5`, wenn Ihre API-Schlüsselkonfiguration und Ihr lokaler Katalog die öffentliche API-Route bereitstellen.

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

### Weitere gehostete Optionen im Abonnementstil

<CardGroup cols={3}>
  <Card title="GLM models" href="/de/providers/glm">
    Z.AI Coding Plan oder allgemeine API-Endpunkte.
  </Card>
  <Card title="MiniMax" href="/de/providers/minimax">
    MiniMax Coding Plan OAuth oder Zugriff per API-Schlüssel.
  </Card>
  <Card title="Qwen Cloud" href="/de/providers/qwen">
    Qwen-Cloud-Provider-Oberfläche plus Alibaba DashScope und Endpunktzuordnung für den Coding Plan.
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
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` als Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Ältere OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- Alias: `google/gemini-3.1-pro` wird akzeptiert und zu Googles Live-Gemini-API-ID `google/gemini-3.1-pro-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` verwendet dynamisches Thinking von Google. Gemini 3/3.1 lassen ein festes `thinkingLevel` weg; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das ältere `cached_content`), um ein Provider-natives `cachedContents/...`-Handle weiterzuleiten; Gemini-Cachetreffer erscheinen als OpenClaw `cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Authentifizierung: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf

<Warning>
Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen für ihr Google-Konto gemeldet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein unkritisches Konto, wenn Sie fortfahren möchten.
</Warning>

Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.

<Steps>
  <Step title="Install Gemini CLI">
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
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Standardmodell: `google-gemini-cli/gemini-3-flash-preview`. Sie fügen **keine** Client-ID und kein Secret in `openclaw.json` ein. Der CLI-Anmeldefluss speichert Tokens in Auth-Profilen auf dem Gateway-Host.

  </Step>
  <Step title="Projekt festlegen (falls erforderlich)">
    Wenn Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  </Step>
</Steps>

Gemini CLI-JSON-Antworten werden aus `response` geparst; die Nutzung fällt auf `stats` zurück, wobei `stats.cached` in OpenClaw `cacheRead` normalisiert wird.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt automatisch den passenden Z.AI-Endpunkt; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

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
- Der statische Fallback-Katalog liefert `kilocode/kilo/auto` mit; die Live-Erkennung über `https://api.kilo.ai/api/gateway/models` kann den Laufzeitkatalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` gehört Kilo Gateway und ist nicht fest in OpenClaw kodiert.

Einrichtungsdetails finden Sie unter [/providers/kilocode](/de/providers/kilocode).

### Andere gebündelte Provider-Plugins

| Provider                | ID                               | Auth-Env                                                     | Beispielmodell                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`             |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                      |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                           |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`       |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                           |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                           |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`       |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                        |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` oder `KIMICODE_API_KEY`                       | `kimi/kimi-code`                            |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                      |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`              |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                        |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`  |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                           |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                     |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                         |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                    |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`             |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                           |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`           |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                      |

#### Wissenswerte Besonderheiten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Wendet seine App-Attributions-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Referenzen sind für von OpenRouter verwaltetes Prompt-Caching mit Cache-TTL berechtigt, erhalten aber keine Anthropic-Cache-Marker. Als proxyartiger OpenAI-kompatibler Pfad überspringt er ausschließlich natives OpenAI-Shaping (`serviceTier`, Responses `store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-gestützte Referenzen behalten nur die Proxy-Gemini-Bereinigung von Thought-Signatures bei.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-gestützte Referenzen folgen demselben Proxy-Gemini-Bereinigungspfad; `kilocode/kilo/auto` und andere Referenzen ohne Proxy-Reasoning-Unterstützung überspringen die Proxy-Reasoning-Injektion.
  </Accordion>
  <Accordion title="MiniMax">
    API-Key-Onboarding schreibt explizite reine Text-M2.7-Chatmodell-Definitionen; Bildverständnis bleibt beim Plugin-eigenen `MiniMax-VL-01`-Medien-Provider.
  </Accordion>
  <Accordion title="NVIDIA">
    Modell-IDs verwenden einen `nvidia/<vendor>/<model>`-Namespace (zum Beispiel `nvidia/nvidia/nemotron-...` neben `nvidia/moonshotai/kimi-k2.5`); Auswahllisten behalten die wörtliche Zusammensetzung `<provider>/<model-id>` bei, während der an die API gesendete kanonische Schlüssel einfach präfigiert bleibt.
  </Accordion>
  <Accordion title="xAI">
    Verwendet den xAI-Responses-Pfad. `/fast` oder `params.fastMode: true` schreibt `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Wird als gebündeltes `cerebras`-Provider-Plugin ausgeliefert. GLM verwendet `zai-glm-4.7`; die OpenAI-kompatible Basis-URL lautet `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provider über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite `models.providers.<id>`-Einträge nur, wenn Sie die Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

Gateway-Modellfähigkeitsprüfungen lesen auch explizite Metadaten aus `models.providers.<id>.models[]`. Wenn ein benutzerdefiniertes oder Proxy-Modell Bilder akzeptiert, setzen Sie für dieses Modell `input: ["text", "image"]`, damit WebChat und Node-originierte Anhangspfade Bilder als native Modelleingaben statt als reine Text-Medienreferenzen übergeben.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Provider-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Provider und fügen Sie nur dann einen expliziten `models.providers.moonshot`-Eintrag hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

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
- Authentifizierung: `KIMI_API_KEY`
- Beispielmodell: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Das ältere `kimi/k2p5` wird weiterhin als Kompatibilitäts-Modell-ID akzeptiert.

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

Beim Onboarding wird standardmäßig die Coding-Oberfläche verwendet, aber der allgemeine Katalog `volcengine/*` wird gleichzeitig registriert.

In den Modellauswahlen für Onboarding/Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl Zeilen für `volcengine/*` als auch für `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw stattdessen auf den ungefilterten Katalog zurück, anstatt eine leere Provider-bezogene Auswahl anzuzeigen.

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

### BytePlus (International)

BytePlus ARK bietet internationalen Benutzern Zugriff auf dieselben Modelle wie Volcano Engine.

- Provider: `byteplus` (Coding: `byteplus-plan`)
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

Beim Onboarding wird standardmäßig die Coding-Oberfläche verwendet, aber der allgemeine Katalog `byteplus/*` wird gleichzeitig registriert.

In Onboarding-/Konfigurations-Modellauswahlen bevorzugt die BytePlus-Authentifizierungsauswahl sowohl `byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine leere Provider-bezogene Auswahl anzuzeigen.

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

Synthetic stellt Anthropic-kompatible Modelle hinter dem `synthetic`-Provider bereit:

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

Einrichtungsdetails, Modelloptionen und Konfigurations-Snippets finden Sie unter [/providers/minimax](/de/providers/minimax).

<Note>
Auf MiniMaxs Anthropic-kompatiblem Streaming-Pfad deaktiviert OpenClaw Thinking standardmäßig, sofern Sie es nicht ausdrücklich festlegen, und `/fast on` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
</Note>

Plugin-eigene Aufteilung der Funktionen:

- Text-/Chat-Standards bleiben bei `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist Plugin-eigenes `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt bei Provider-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Provider-Plugin ausgeliefert, das die native API verwendet:

- Provider: `lmstudio`
- Authentifizierung: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der von `http://localhost:1234/api/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet LM Studios native `/api/v1/models` und `/api/v1/models/load` für Discovery + Auto-Load, standardmäßig mit `/v1/chat/completions` für Inferenz. Einrichtung und Fehlerbehebung finden Sie unter [/providers/lmstudio](/de/providers/lmstudio).

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet Ollamas native API:

- Provider: `ollama`
- Authentifizierung: Nicht erforderlich (lokaler Server)
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

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie es mit `OLLAMA_API_KEY` aktivieren, und das gebündelte Provider-Plugin fügt Ollama direkt zu `openclaw onboard` und zur Modellauswahl hinzu. Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration finden Sie unter [/providers/ollama](/de/providers/ollama).

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `vllm`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

So aktivieren Sie lokale Auto-Discovery (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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

Details finden Sie unter [/providers/vllm](/de/providers/vllm).

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

So aktivieren Sie lokale Auto-Discovery (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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
    Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional. Wenn sie ausgelassen werden, verwendet OpenClaw standardmäßig:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Empfehlung: Legen Sie explizite Werte fest, die zu den Grenzwerten Ihres Proxys/Modells passen.

  </Accordion>
  <Accordion title="Regeln für die Gestaltung von Proxy-Routen">
    - Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler wegen nicht unterstützter `developer`-Rollen zu vermeiden.
    - Proxy-artige OpenAI-kompatible Routen überspringen auch natives OpenAI-spezifisches Request-Shaping: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Prompt-Cache-Hinweise, kein OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping und keine versteckten OpenClaw-Attributions-Header.
    - Für OpenAI-kompatible Completions-Proxys, die anbieterspezifische Felder benötigen, legen Sie `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`) fest, um zusätzliches JSON in den ausgehenden Request-Body zusammenzuführen.
    - Für vLLM-Chat-Template-Steuerelemente legen Sie `agents.defaults.models["provider/model"].params.chat_template_kwargs` fest. Das gebündelte vLLM-Plugin sendet automatisch `enable_thinking: false` und `force_nonempty_content: true` für `vllm/nemotron-3-*`, wenn das Session-Thinking-Level ausgeschaltet ist.
    - Für langsame lokale Modelle oder entfernte LAN-/Tailnet-Hosts legen Sie `models.providers.<id>.timeoutSeconds` fest. Dadurch wird die HTTP-Request-Verarbeitung des Provider-Modells erweitert, einschließlich Verbindung, Header, Body-Streaming und des gesamten abgesicherten Fetch-Abbruchs, ohne das gesamte Agent-Laufzeit-Timeout zu erhöhen.
    - Wenn `baseUrl` leer ist oder ausgelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
    - Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.
    - Für `api: "anthropic-messages"` auf nicht direkten Endpunkten (jeder Provider außer dem kanonischen `anthropic`, oder ein benutzerdefiniertes `models.providers.anthropic.baseUrl`, dessen Host kein öffentlicher `api.anthropic.com`-Endpunkt ist) unterdrückt OpenClaw implizite Anthropic-Beta-Header wie `claude-code-20250219`, `interleaved-thinking-2025-05-14` und OAuth-Markierungen, damit benutzerdefinierte Anthropic-kompatible Proxys nicht unterstützte Beta-Flags nicht ablehnen. Legen Sie `models.providers.<id>.headers["anthropic-beta"]` explizit fest, wenn Ihr Proxy bestimmte Beta-Funktionen benötigt.

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

- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modell-Konfigurationsschlüssel
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Modelle](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Provider](/de/providers) — Einrichtungshandbücher pro Provider
