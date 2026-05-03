---
read_when:
    - Sie benötigen eine Referenz zur Modelleinrichtung für jeden Provider
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
sidebarTitle: Model providers
summary: Übersicht über Modell-Provider mit Beispielkonfigurationen + CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-05-03T06:36:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfb12090228ec89bc116558fe3e0bf9977c750550ef8efbf55b1af6c873c9825
    source_path: concepts/model-providers.md
    workflow: 16
---

Referenz für **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram). Regeln zur Modellauswahl finden Sie unter [Modelle](/de/concepts/models).

## Schnellregeln

<AccordionGroup>
  <Accordion title="Modellreferenzen und CLI-Hilfen">
    - Modellreferenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` wirkt als Zulassungsliste, wenn es gesetzt ist.
    - CLI-Hilfen: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` setzen Standardwerte auf Provider-Ebene; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` überschreiben sie pro Modell.
    - Fallback-Regeln, Cooldown-Probes und Persistenz von Sitzungsüberschreibungen: [Modell-Failover](/de/concepts/model-failover).

  </Accordion>
  <Accordion title="Das Hinzufügen von Provider-Auth ändert Ihr primäres Modell nicht">
    `openclaw configure` behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Sie einen Provider hinzufügen oder erneut authentifizieren. Provider-Plugins können in ihrem Auth-Konfigurationspatch weiterhin ein empfohlenes Standardmodell zurückgeben, aber configure behandelt dies als „dieses Modell verfügbar machen“, wenn bereits ein primäres Modell vorhanden ist, nicht als „das aktuelle primäre Modell ersetzen“.

    Um das Standardmodell gezielt zu wechseln, verwenden Sie `openclaw models set <provider/model>` oder `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI-Provider-/Runtime-Trennung">
    Routen der OpenAI-Familie sind präfixspezifisch:

    - `openai/<model>` plus `agents.defaults.agentRuntime.id: "codex"` verwendet den nativen Codex-App-Server-Harness. Dies ist die übliche Einrichtung für ein ChatGPT/Codex-Abonnement.
    - `openai-codex/<model>` verwendet Codex OAuth in PI.
    - `openai/<model>` ohne Codex-Runtime-Überschreibung verwendet den direkten OpenAI-API-Key-Provider in PI.

    Siehe [OpenAI](/de/providers/openai) und [Codex-Harness](/de/plugins/codex-harness). Wenn die Provider-/Runtime-Trennung verwirrend ist, lesen Sie zuerst [Agent-Runtimes](/de/concepts/agent-runtimes).

    Die automatische Plugin-Aktivierung folgt derselben Grenze: `openai-codex/<model>` gehört zum OpenAI-Plugin, während das Codex-Plugin durch `agentRuntime.id: "codex"` oder Legacy-Referenzen `codex/<model>` aktiviert wird.

    GPT-5.5 ist über den nativen Codex-App-Server-Harness verfügbar, wenn `agentRuntime.id: "codex"` gesetzt ist, über `openai-codex/gpt-5.5` in PI für Codex OAuth und über `openai/gpt-5.5` in PI für direkten API-Key-Datenverkehr, wenn Ihr Konto es bereitstellt.

  </Accordion>
  <Accordion title="CLI-Runtimes">
    CLI-Runtimes verwenden dieselbe Trennung: Wählen Sie kanonische Modellreferenzen wie `anthropic/claude-*`, `google/gemini-*` oder `openai/gpt-*` und setzen Sie dann `agents.defaults.agentRuntime.id` auf `claude-cli`, `google-gemini-cli` oder `codex-cli`, wenn Sie ein lokales CLI-Backend verwenden möchten.

    Legacy-Referenzen `claude-cli/*`, `google-gemini-cli/*` und `codex-cli/*` werden zurück zu kanonischen Provider-Referenzen migriert, wobei die Runtime separat gespeichert wird.

  </Accordion>
</AccordionGroup>

## Plugin-eigenes Provider-Verhalten

Die meiste providerspezifische Logik liegt in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife behält. Plugins besitzen Onboarding, Modellkataloge, Auth-Env-Var-Zuordnung, Transport-/Konfigurationsnormalisierung, Bereinigung von Tool-Schemas, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Denk-/Reasoning-Profile und mehr.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele gebündelter Plugins finden Sie unter [Provider-Plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig eigenen Request-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

<Note>
Provider-eigenes Runner-Verhalten liegt auf expliziten Provider-Hooks wie Replay-Policy, Tool-Schema-Normalisierung, Stream-Wrapping und Transport-/Request-Hilfen. Die statische Legacy-Sammlung `ProviderPlugin.capabilities` dient nur der Kompatibilität und wird von gemeinsamer Runner-Logik nicht mehr gelesen.
</Note>

## API-Key-Rotation

<AccordionGroup>
  <Accordion title="Key-Quellen und Priorität">
    Konfigurieren Sie mehrere Keys über:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
    - `<PROVIDER>_API_KEYS` (komma- oder semikolongetrennte Liste)
    - `<PROVIDER>_API_KEY` (primärer Key)
    - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)

    Bei Google-Providern wird `GOOGLE_API_KEY` ebenfalls als Fallback einbezogen. Die Key-Auswahlreihenfolge erhält die Priorität und dedupliziert Werte.

  </Accordion>
  <Accordion title="Wann Rotation greift">
    - Requests werden nur bei Rate-Limit-Antworten mit dem nächsten Key wiederholt (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder periodische Usage-Limit-Meldungen).
    - Fehler ohne Rate-Limit schlagen sofort fehl; es wird keine Key-Rotation versucht.
    - Wenn alle Kandidaten-Keys fehlschlagen, wird der endgültige Fehler aus dem letzten Versuch zurückgegeben.

  </Accordion>
</AccordionGroup>

## Eingebaute Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Provider benötigen **keine** `models.providers`-Konfiguration; setzen Sie einfach Auth und wählen Sie ein Modell aus.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Prüfen Sie Konto-/Modellverfügbarkeit mit `openclaw models list --provider openai`, wenn sich eine bestimmte Installation oder ein API-Key anders verhält.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Überschreiben Sie pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- OpenAI Responses WebSocket-Warm-up ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Requests auf `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen `/fast`-Toggles eine explizite Stufe möchten
- Versteckte OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses `store`, Prompt-Cache-Hinweise und OpenAI-Reasoning-kompatible Payload-Formung bei; Proxy-Routen tun dies nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil Live-OpenAI-API-Requests es ablehnen und der aktuelle Codex-Katalog es nicht bereitstellt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Requests unterstützen den gemeinsamen `/fast`-Toggle und `params.fastMode`, einschließlich API-Key- und OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`; OpenClaw ordnet dies Anthropic `service_tier` zu (`auto` gegenüber `standard_only`)
- Die bevorzugte Claude CLI-Konfiguration hält die Modellreferenz kanonisch und wählt das CLI-
  Backend separat: `anthropic/claude-opus-4-7` mit
  `agents.defaults.agentRuntime.id: "claude-cli"`. Legacy-
  Referenzen `claude-cli/claude-opus-4-7` funktionieren aus Kompatibilitätsgründen weiterhin.

<Note>
Anthropic-Mitarbeiter haben uns mitgeteilt, dass OpenClaw-artige Claude CLI-Nutzung wieder erlaubt ist; daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht. Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI-Modellreferenz: `openai-codex/gpt-5.5`
- Referenz für den nativen Codex-App-Server-Harness: `openai/gpt-5.5` mit `agents.defaults.agentRuntime.id: "codex"`
- Dokumentation zum nativen Codex-App-Server-Harness: [Codex-Harness](/de/plugins/codex-harness)
- Legacy-Modellreferenzen: `codex/gpt-*`
- Plugin-Grenze: `openai-codex/*` lädt das OpenAI-Plugin; das native Codex-App-Server-Plugin wird nur durch die Codex-Harness-Runtime oder Legacy-Referenzen `codex/*` ausgewählt.
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Der Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Überschreiben Sie pro PI-Modell über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Requests (`chatgpt.com/backend-api`) weitergeleitet
- Versteckte OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) werden nur an nativen Codex-Datenverkehr zu `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Teilt denselben `/fast`-Toggle und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.5` verwendet den nativen `contextWindow = 400000` des Codex-Katalogs und standardmäßig Runtime-`contextTokens = 272000`; überschreiben Sie die Runtime-Grenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.
- Für die übliche Route mit Abonnement plus nativer Codex-Runtime melden Sie sich mit `openai-codex`-Auth an, konfigurieren aber `openai/gpt-5.5` plus `agents.defaults.agentRuntime.id: "codex"`.
- Verwenden Sie `openai-codex/gpt-5.5` nur, wenn Sie die Codex OAuth-/Abonnementroute über PI möchten; verwenden Sie `openai/gpt-5.5` ohne Codex-Runtime-Überschreibung, wenn Ihre API-Key-Einrichtung und Ihr lokaler Katalog die öffentliche API-Route bereitstellen.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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
  <Card title="GLM-Modelle" href="/de/providers/glm">
    Z.AI Coding Plan oder allgemeine API-Endpunkte.
  </Card>
  <Card title="MiniMax" href="/de/providers/minimax">
    MiniMax Coding Plan OAuth oder API-Key-Zugriff.
  </Card>
  <Card title="Qwen Cloud" href="/de/providers/qwen">
    Qwen Cloud-Provider-Oberfläche plus Alibaba DashScope und Endpunktzuordnung für den Coding Plan.
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
- Kompatibilität: Ältere OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- Alias: `google/gemini-3.1-pro` wird akzeptiert und zu Googles Live-Gemini-API-ID `google/gemini-3.1-pro-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` verwendet Googles dynamisches Thinking. Gemini 3/3.1 lassen ein festes `thinkingLevel` weg; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das ältere `cached_content`), um ein provider-natives `cachedContents/...`-Handle weiterzuleiten; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Authentifizierung: Vertex verwendet gcloud ADC; Gemini CLI verwendet den eigenen OAuth-Ablauf

<Warning>
Gemini CLI OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen für Google-Konten gemeldet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein nicht kritisches Konto, wenn Sie fortfahren möchten.
</Warning>

Gemini CLI OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.

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

    Standardmodell: `google-gemini-cli/gemini-3-flash-preview`. Sie fügen **keine** Client-ID oder kein Secret in `openclaw.json` ein. Der CLI-Anmeldeablauf speichert Token in Auth-Profilen auf dem Gateway-Host.

  </Step>
  <Step title="Projekt festlegen (falls erforderlich)">
    Wenn Anfragen nach der Anmeldung fehlschlagen, legen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host fest.
  </Step>
</Steps>

Gemini CLI-JSON-Antworten werden aus `response` geparst; die Nutzung fällt auf `stats` zurück, wobei `stats.cached` in OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Provider: `zai`
- Authentifizierung: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Authentifizierung: `AI_GATEWAY_API_KEY`
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Authentifizierung: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog liefert `kilocode/kilo/auto`; die Live-Erkennung über `https://api.kilo.ai/api/gateway/models` kann den Laufzeitkatalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` gehört Kilo Gateway und ist nicht fest in OpenClaw kodiert.

Einrichtungsdetails finden Sie unter [/providers/kilocode](/de/providers/kilocode).

### Weitere gebündelte Provider-Plugins

| Provider                | ID                               | Auth-Umgebungsvariable                                       | Beispielmodell                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` oder `KIMICODE_API_KEY`                       | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Wissenswerte Besonderheiten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Wendet seine App-Zuordnungs-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Referenzen sind für OpenRouter-verwaltetes Prompt-Caching mit Cache-TTL berechtigt, erhalten aber keine Anthropic-Cache-Marker. Als proxyartiger OpenAI-kompatibler Pfad überspringt er native, nur für OpenAI geltende Anpassungen (`serviceTier`, Responses `store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-gestützte Referenzen behalten nur die proxy-Gemini-Bereinigung von Thought-Signaturen bei.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-gestützte Referenzen folgen demselben proxy-Gemini-Bereinigungspfad; `kilocode/kilo/auto` und andere Referenzen ohne Unterstützung für Proxy-Reasoning überspringen die Proxy-Reasoning-Injektion.
  </Accordion>
  <Accordion title="MiniMax">
    Das Onboarding per API-Schlüssel schreibt explizite, rein textbasierte M2.7-Chatmodelldefinitionen; Bildverständnis bleibt beim Plugin-eigenen `MiniMax-VL-01`-Medien-Provider.
  </Accordion>
  <Accordion title="NVIDIA">
    Modell-IDs verwenden einen `nvidia/<vendor>/<model>`-Namensraum (zum Beispiel `nvidia/nvidia/nemotron-...` neben `nvidia/moonshotai/kimi-k2.5`); Auswahlelemente behalten die wörtliche Zusammensetzung `<provider>/<model-id>` bei, während der an die API gesendete kanonische Schlüssel einfach präfixiert bleibt.
  </Accordion>
  <Accordion title="xAI">
    Verwendet den xAI-Responses-Pfad. `grok-4.3` ist das gebündelte Standard-Chatmodell. `/fast` oder `params.fastMode: true` schreibt `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` in ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Wird als gebündeltes `cerebras`-Provider-Plugin ausgeliefert. GLM verwendet `zai-glm-4.7`; die OpenAI-kompatible Basis-URL ist `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provider über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite `models.providers.<id>`-Einträge nur, wenn Sie die Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

Gateway-Modellfähigkeitsprüfungen lesen auch explizite `models.providers.<id>.models[]`-Metadaten. Wenn ein benutzerdefiniertes oder Proxy-Modell Bilder akzeptiert, setzen Sie für dieses Modell `input: ["text", "image"]`, damit WebChat und Node-basierte Anhangspfade Bilder als native Modelleingaben statt als rein textbasierte Medienreferenzen übergeben.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Provider-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Provider und fügen Sie nur dann einen expliziten `models.providers.moonshot`-Eintrag hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

- Provider: `moonshot`
- Authentifizierung: `MOONSHOT_API_KEY`
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

Legacy `kimi/k2p5` wird weiterhin als Kompatibilitätsmodell-ID akzeptiert.

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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `volcengine/*`-Katalog wird gleichzeitig registriert.

In den Modellauswahlen für Onboarding/Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl `volcengine/*`- als auch `volcengine-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine leere, auf den Provider beschränkte Auswahl anzuzeigen.

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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `byteplus/*`-Katalog wird gleichzeitig registriert.

In den Modellauswahlen für Onboarding/Konfiguration bevorzugt die BytePlus-Authentifizierungsoption sowohl `byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine leere, auf den Provider beschränkte Auswahl anzuzeigen.

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
- MiniMax API-Schlüssel (Global): `--auth-choice minimax-global-api`
- MiniMax API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Authentifizierung: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`

Einrichtungsdetails, Modelloptionen und Konfigurationsausschnitte finden Sie unter [/providers/minimax](/de/providers/minimax).

<Note>
Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig, sofern Sie es nicht ausdrücklich festlegen, und `/fast on` schreibt `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
</Note>

Capability-Aufteilung im Besitz des Plugins:

- Text-/Chat-Defaults bleiben auf `minimax/MiniMax-M2.7`
- Bilderzeugung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist das Plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt auf der Provider-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Provider-Plugin ausgeliefert, das die native API verwendet:

- Provider: `lmstudio`
- Authentifizierung: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Legen Sie dann ein Modell fest (ersetzen Sie es durch eine der IDs, die von `http://localhost:1234/api/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio für Erkennung und automatisches Laden, standardmäßig mit `/v1/chat/completions` für Inferenz. Wenn Sie möchten, dass LM Studio JIT-Laden, TTL und automatisches Entfernen aus dem Cache für den Modelllebenszyklus übernimmt, setzen Sie `models.providers.lmstudio.params.preload: false`. Einrichtung und Fehlerbehebung finden Sie unter [/providers/lmstudio](/de/providers/lmstudio).

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet die native API von Ollama:

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

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit `OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Provider-Plugin fügt Ollama direkt zu `openclaw onboard` und zur Modellauswahl hinzu. Onboarding, Cloud-/lokalen Modus und benutzerdefinierte Konfiguration finden Sie unter [/providers/ollama](/de/providers/ollama).

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `vllm`
- Authentifizierung: Optional (hängt von Ihrem Server ab)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für die automatische Erkennung zu entscheiden (beliebiger Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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

Details finden Sie unter [/providers/vllm](/de/providers/vllm).

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Authentifizierung: Optional (hängt von Ihrem Server ab)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für die automatische Erkennung zu entscheiden (beliebiger Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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
  <Accordion title="Default optional fields">
    Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional. Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Empfohlen: Legen Sie explizite Werte fest, die zu den Limits Ihres Proxys/Modells passen.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler wegen nicht unterstützter `developer`-Rollen zu vermeiden.
    - Proxy-artige OpenAI-kompatible Routen überspringen außerdem natives, nur für OpenAI vorgesehenes Request-Shaping: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Prompt-Cache-Hinweise, kein OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping und keine versteckten OpenClaw-Attributions-Header.
    - Für OpenAI-kompatible Completions-Proxys, die anbieterspezifische Felder benötigen, setzen Sie `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`), um zusätzliches JSON in den ausgehenden Request-Body zusammenzuführen.
    - Für vLLM-Chat-Template-Steuerungen setzen Sie `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Das gebündelte vLLM-Plugin sendet automatisch `enable_thinking: false` und `force_nonempty_content: true` für `vllm/nemotron-3-*`, wenn das Thinking-Level der Sitzung ausgeschaltet ist.
    - Für langsame lokale Modelle oder entfernte LAN-/tailnet-Hosts setzen Sie `models.providers.<id>.timeoutSeconds`. Dies erweitert die HTTP-Request-Verarbeitung des Provider-Modells, einschließlich Verbindung, Headern, Body-Streaming und dem gesamten überwachten Fetch-Abbruch, ohne das gesamte Agent-Laufzeit-Timeout zu erhöhen.
    - Wenn `baseUrl` leer ist oder weggelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` auflöst).
    - Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.
    - Für `api: "anthropic-messages"` auf nicht direkten Endpunkten (jeder Provider außer dem kanonischen `anthropic` oder eine benutzerdefinierte `models.providers.anthropic.baseUrl`, deren Host kein öffentlicher `api.anthropic.com`-Endpunkt ist) unterdrückt OpenClaw implizite Anthropic-Beta-Header wie `claude-code-20250219`, `interleaved-thinking-2025-05-14` und OAuth-Marker, damit benutzerdefinierte Anthropic-kompatible Proxys nicht unterstützte Beta-Flags nicht ablehnen. Setzen Sie `models.providers.<id>.headers["anthropic-beta"]` explizit, wenn Ihr Proxy bestimmte Beta-Funktionen benötigt.

  </Accordion>
</AccordionGroup>

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [Konfiguration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Modellkonfigurationsschlüssel
- [Modell-Failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Modelle](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Provider](/de/providers) — Einrichtungsleitfäden je Provider
