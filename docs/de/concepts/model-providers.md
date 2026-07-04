---
read_when:
    - Sie benötigen eine Provider-spezifische Referenz zur Modelleinrichtung
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
sidebarTitle: Model providers
summary: Übersicht über Modell-Provider mit Beispielkonfigurationen und CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-07-04T03:42:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Referenz für **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram). Regeln zur Modellauswahl finden Sie unter [Modelle](/de/concepts/models).

## Kurzregeln

<AccordionGroup>
  <Accordion title="Modell-Refs und CLI-Helfer">
    - Modell-Refs verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` wirkt als Allowlist, wenn es gesetzt ist.
    - CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` legen providerweite Standardwerte fest; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` überschreiben sie pro Modell.
    - Fallback-Regeln, Cooldown-Probes und Persistenz von Sitzungsüberschreibungen: [Modell-Failover](/de/concepts/model-failover).

  </Accordion>
  <Accordion title="Das Hinzufügen von Provider-Authentifizierung ändert Ihr primäres Modell nicht">
    `openclaw configure` behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Sie einen Provider hinzufügen oder erneut authentifizieren. `openclaw models auth login` verhält sich genauso, außer Sie übergeben `--set-default`. Provider-Plugins können in ihrem Auth-Konfigurationspatch weiterhin ein empfohlenes Standardmodell zurückgeben, aber OpenClaw behandelt dies als „dieses Modell verfügbar machen“, wenn bereits ein primäres Modell vorhanden ist, nicht als „das aktuelle primäre Modell ersetzen“.

    Um das Standardmodell bewusst zu wechseln, verwenden Sie `openclaw models set <provider/model>` oder `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI-Provider-/Runtime-Aufteilung">
    Routen der OpenAI-Familie sind präfixspezifisch:

    - `openai/<model>` verwendet standardmäßig den nativen Codex-App-Server-Harness für Agent-Turns. Dies ist die übliche Einrichtung für ChatGPT-/Codex-Abonnements.
    - Legacy-Codex-Modell-Refs sind Legacy-Konfiguration, die doctor zu `openai/<model>` umschreibt.
    - `openai/<model>` plus Provider-/Modell-`agentRuntime.id: "openclaw"` verwendet die integrierte Runtime von OpenClaw für explizite API-Key- oder Kompatibilitätsrouten.

    Siehe [OpenAI](/de/providers/openai) und [Codex-Harness](/de/plugins/codex-harness). Wenn die Provider-/Runtime-Aufteilung verwirrend ist, lesen Sie zuerst [Agent-Runtimes](/de/concepts/agent-runtimes).

    Die automatische Plugin-Aktivierung folgt derselben Grenze: `openai/*`-Agent-Refs aktivieren das Codex-Plugin für die Standardroute, und explizite Provider-/Modell-`agentRuntime.id: "codex"`- oder Legacy-`codex/<model>`-Refs erfordern es ebenfalls.

    GPT-5.5 ist standardmäßig über den nativen Codex-App-Server-Harness unter `openai/gpt-5.5` verfügbar und über die OpenClaw-Runtime, wenn die Provider-/Modell-Runtime-Policy explizit `openclaw` auswählt.

  </Accordion>
  <Accordion title="CLI-Runtimes">
    CLI-Runtimes verwenden dieselbe Aufteilung: Wählen Sie kanonische Modell-Refs wie `anthropic/claude-*` oder `google/gemini-*`, und setzen Sie dann die Provider-/Modell-Runtime-Policy auf `claude-cli` oder `google-gemini-cli`, wenn Sie ein lokales CLI-Backend möchten.

    Legacy-Refs `claude-cli/*` und `google-gemini-cli/*` migrieren zurück zu kanonischen Provider-Refs, wobei die Runtime separat aufgezeichnet wird. Legacy-Refs `codex-cli/*` migrieren zu `openai/*` und verwenden die Codex-App-Server-Route; OpenClaw behält kein gebündeltes Codex-CLI-Backend mehr bei.

  </Accordion>
</AccordionGroup>

## Provider-eigenes Verhalten von Plugins

Die meiste providerspezifische Logik befindet sich in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife beibehält. Plugins besitzen Onboarding, Modellkataloge, Auth-Env-Var-Mapping, Transport-/Konfigurationsnormalisierung, Tool-Schema-Bereinigung, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Thinking-/Reasoning-Profile und mehr.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele für gebündelte Plugins finden Sie unter [Provider-Plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig eigenen Request-Executor benötigt, ist eine separate, tiefergehende Erweiterungsfläche.

<Note>
Provider-eigenes Runner-Verhalten befindet sich auf expliziten Provider-Hooks wie Replay-Policy, Tool-Schema-Normalisierung, Stream-Wrapping und Transport-/Request-Helfern. Der Legacy-Static-Bag `ProviderPlugin.capabilities` dient nur der Kompatibilität und wird von der gemeinsamen Runner-Logik nicht mehr gelesen.
</Note>

## API-Key-Rotation

<AccordionGroup>
  <Accordion title="Key-Quellen und Priorität">
    Konfigurieren Sie mehrere Keys über:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
    - `<PROVIDER>_API_KEYS` (durch Kommas oder Semikolons getrennte Liste)
    - `<PROVIDER>_API_KEY` (primärer Key)
    - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)

    Für Google-Provider wird `GOOGLE_API_KEY` ebenfalls als Fallback einbezogen. Die Reihenfolge der Key-Auswahl bewahrt die Priorität und dedupliziert Werte.

  </Accordion>
  <Accordion title="Wann Rotation greift">
    - Requests werden nur bei Rate-Limit-Antworten mit dem nächsten Key erneut versucht (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder periodische Usage-Limit-Meldungen).
    - Fehler, die keine Rate Limits sind, schlagen sofort fehl; es wird keine Key-Rotation versucht.
    - Wenn alle Kandidaten-Keys fehlschlagen, wird der finale Fehler aus dem letzten Versuch zurückgegeben.

  </Accordion>
</AccordionGroup>

## Offizielle Provider-Plugins

Offizielle Provider-Plugins veröffentlichen ihre eigenen Modellkatalogzeilen. Diese Provider benötigen **keine** `models.providers`-Modelleinträge; aktivieren Sie das Provider-Plugin, richten Sie Auth ein und wählen Sie ein Modell. Verwenden Sie `models.providers` nur für explizite Custom-Provider oder enge Request-Einstellungen wie Timeouts.

### OpenAI

- Provider: `openai`
- Authentifizierung: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Prüfen Sie die Konto-/Modellverfügbarkeit mit `openclaw models list --provider openai`, wenn sich eine bestimmte Installation oder ein API-Key anders verhält.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standard-Transport ist `auto`; OpenClaw übergibt die Transportauswahl an die gemeinsame Modell-Runtime.
- Überschreibung pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` mappen direkte `openai/*`-Responses-Requests auf `service_tier=priority` auf `api.openai.com`
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen `/fast`-Toggles eine explizite Stufe möchten
- Versteckte OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) gelten nur für nativen OpenAI-Traffic zu `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses `store`, Prompt-Cache-Hinweise und OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping bei; Proxy-Routen tun dies nicht
- `openai/gpt-5.3-codex-spark` ist über ChatGPT-/Codex-OAuth-Abonnementauthentifizierung verfügbar, wenn Ihr angemeldetes Konto es bereitstellt; OpenClaw unterdrückt weiterhin direkte OpenAI-API-Key- und Azure-API-Key-Routen für dieses Modell, weil diese Transporte es ablehnen

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Authentifizierung: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Requests unterstützen den gemeinsamen `/fast`-Toggle und `params.fastMode`, einschließlich API-Key- und OAuth-authentifiziertem Traffic, der an `api.anthropic.com` gesendet wird; OpenClaw mappt dies auf Anthropic `service_tier` (`auto` vs. `standard_only`)
- Die bevorzugte Claude-CLI-Konfiguration hält die Modell-Ref kanonisch und wählt das CLI-Backend separat aus: `anthropic/claude-opus-4-8` mit modellbezogenem `agentRuntime.id: "claude-cli"`. Legacy-Refs `claude-cli/claude-opus-4-7` funktionieren weiterhin aus Kompatibilitätsgründen.

<Note>
Anthropic-Mitarbeitende haben uns mitgeteilt, dass Claude-CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Policy veröffentlicht. Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt nun die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Provider: `openai`
- Authentifizierung: OAuth (ChatGPT)
- Legacy-OpenAI-Codex-Modell-Ref: `openai/gpt-5.5`
- Native Codex-App-Server-Harness-Ref: `openai/gpt-5.5`
- Dokumentation zum nativen Codex-App-Server-Harness: [Codex-Harness](/de/plugins/codex-harness)
- Legacy-Modell-Refs: `codex/gpt-*`
- Plugin-Grenze: `openai/*` lädt das OpenAI-Plugin; das native Codex-App-Server-Plugin wird von der Codex-Harness-Runtime ausgewählt.
- CLI: `openclaw onboard --auth-choice openai` oder `openclaw models auth login --provider openai`
- Der Standard-Transport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Überschreibung pro OpenAI-Codex-Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Requests weitergeleitet (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) werden nur bei nativem Codex-Traffic zu `chatgpt.com/backend-api` angehängt, nicht bei generischen OpenAI-kompatiblen Proxys
- Teilt dieselbe `/fast`-Toggle- und `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw mappt dies auf `service_tier=priority`
- `openai/gpt-5.5` verwendet das native `contextWindow = 400000` des Codex-Katalogs und die Standard-Runtime `contextTokens = 272000`; überschreiben Sie die Runtime-Obergrenze mit `models.providers.openai.models[].contextTokens`
- Policy-Hinweis: OpenAI Codex OAuth wird explizit für externe Tools/Workflows wie OpenClaw unterstützt.
- Für die gängige Route mit Abonnement plus nativer Codex-Runtime melden Sie sich mit `openai`-Auth an und konfigurieren `openai/gpt-5.5`; OpenAI-Agent-Turns wählen standardmäßig Codex aus.
- Verwenden Sie Provider-/Modell-`agentRuntime.id: "openclaw"` nur, wenn Sie die integrierte OpenClaw-Route möchten; lassen Sie `openai/gpt-5.5` andernfalls auf dem Standard-Codex-Harness.
- Legacy-Codex-GPT-Refs sind Legacy-Zustand, keine Live-Provider-Route. Verwenden Sie `openai/gpt-5.5` auf der nativen Codex-Runtime für neue Agent-Konfiguration und führen Sie `openclaw doctor --fix` aus, um alte Legacy-Codex-Modell-Refs zu kanonischen `openai/*`-Refs zu migrieren.

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

### Andere gehostete Optionen im Abonnement-Stil

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/de/providers/zai">
    Z.AI Coding Plan oder allgemeine API-Endpunkte.
  </Card>
  <Card title="MiniMax" href="/de/providers/minimax">
    MiniMax Coding Plan OAuth oder Zugriff per API-Key.
  </Card>
  <Card title="Qwen Cloud" href="/de/providers/qwen">
    Qwen-Cloud-Provider-Oberfläche plus Alibaba DashScope und Endpoint-Mapping für den Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Authentifizierung: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
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
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY`-Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelnes Override)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Alte OpenClaw-Konfigurationen mit `google/gemini-3.1-flash-preview` werden zu `google/gemini-3-flash-preview` normalisiert
- Alias: `google/gemini-3.1-pro` wird akzeptiert und zu Googles Live-Gemini-API-ID `google/gemini-3.1-pro-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Denken: `/think adaptive` verwendet Googles dynamisches Denken. Gemini 3/3.1 lassen ein festes `thinkingLevel` weg; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Läufe akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das alte `cached_content`), um ein Provider-natives `cachedContents/...`-Handle weiterzuleiten; Gemini-Cache-Treffer werden als OpenClaw-`cacheRead` angezeigt

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet den eigenen OAuth-Ablauf

<Warning>
Gemini CLI OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen ihres Google-Kontos gemeldet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein nicht kritisches Konto, wenn Sie fortfahren möchten.
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

    Standardmodell: `google-gemini-cli/gemini-3-flash-preview`. Sie fügen **keine** Client-ID und kein Secret in `openclaw.json` ein. Der CLI-Anmeldeablauf speichert Token in Auth-Profilen auf dem Gateway-Host.

  </Step>
  <Step title="Projekt festlegen (falls nötig)">
    Wenn Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  </Step>
</Steps>

Gemini CLI verwendet standardmäßig `stream-json`. OpenClaw liest Assistant-Stream-Nachrichten und normalisiert `stats.cached` zu `cacheRead`; alte `--output-format json`-Overrides lesen Antworttext weiterhin aus `response`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Modellreferenzen verwenden die kanonische Provider-ID `zai/*`.
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Weitere gebündelte Provider-Plugins

| Provider                                | ID                               | Auth-Umgebungsvariable                              | Beispielmodell                                            |
| --------------------------------------- | -------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                  | `byteplus-plan/ark-code-latest`                           |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                | `clawrouter/anthropic/claude-sonnet-4-6`                  |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                    | `cohere/command-a-03-2025`                                |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`             | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`           | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                   | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                  | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                    | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                    | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/de/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                    | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth oder `OPENROUTER_API_KEY`          | `openrouter/auto`                                         |
| [Qwen OAuth](/de/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                      | `qwen-oauth/qwen3.5-plus`                                 |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                  | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                    | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                            | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth oder `XAI_API_KEY`        | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`      | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Wissenswerte Besonderheiten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Wendet seine App-Attributions-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Referenzen sind für OpenRouter-verwaltetes Prompt-Caching mit Cache-TTL geeignet, erhalten aber keine Anthropic-Cache-Marker. Als proxyartiger OpenAI-kompatibler Pfad überspringt er die nur für natives OpenAI geltende Formung (`serviceTier`, Responses `store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-gestützte Referenzen behalten nur die Proxy-Gemini-Bereinigung von Thought-Signatures bei.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-gestützte Referenzen folgen demselben Proxy-Gemini-Bereinigungspfad; `kilocode/kilo/auto` und andere Referenzen ohne Unterstützung für Proxy-Reasoning überspringen die Proxy-Reasoning-Injektion.
  </Accordion>
  <Accordion title="MiniMax">
    API-Key-Onboarding schreibt explizite M3- und M2.7-Chatmodelldefinitionen; Bildverständnis bleibt beim Plugin-eigenen Medien-Provider `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Modell-IDs verwenden einen `nvidia/<vendor>/<model>`-Namespace (zum Beispiel `nvidia/nvidia/nemotron-...` neben `nvidia/moonshotai/kimi-k2.5`); Auswahllisten behalten die wörtliche Zusammensetzung `<provider>/<model-id>` bei, während der an die API gesendete kanonische Schlüssel einfach präfigiert bleibt.
  </Accordion>
  <Accordion title="xAI">
    Verwendet den xAI-Responses-Pfad. Der empfohlene Pfad ist SuperGrok/X Premium OAuth; API-Keys funktionieren weiterhin über `XAI_API_KEY` oder die Plugin-Konfiguration, und Grok `web_search` verwendet dasselbe Auth-Profil erneut, bevor auf den API-Key zurückgefallen wird. `grok-4.3` ist das gebündelte Standard-Chatmodell, und `grok-build-0.1` ist für build-/codingfokussierte Arbeit auswählbar. `/fast` oder `params.fastMode: true` schreibt `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` in ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provider über `models.providers` (benutzerdefinierte/base URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite `models.providers.<id>`-Einträge nur, wenn Sie die standardmäßige Basis-URL, Header oder Modellliste überschreiben möchten.

Gateway-Modellfähigkeitsprüfungen lesen auch explizite `models.providers.<id>.models[]`-Metadaten. Wenn ein benutzerdefiniertes oder Proxy-Modell Bilder akzeptiert, setzen Sie `input: ["text", "image"]` für dieses Modell, damit WebChat und Attachment-Pfade mit Node-Ursprung Bilder als native Modelleingaben statt als reine Text-Medienreferenzen übergeben.

`agents.defaults.models["provider/model"]` steuert nur die Modellsichtbarkeit, Aliasse und modellbezogene Metadaten für Agenten. Es registriert für sich allein kein neues Laufzeitmodell. Fügen Sie für benutzerdefinierte Provider-Modelle außerdem `models.providers.<provider>.models[]` mit mindestens der passenden `id` hinzu.

### Moonshot AI (Kimi)

Installieren Sie `@openclaw/moonshot-provider` vor dem Onboarding. Fügen Sie einen expliziten `models.providers.moonshot`-Eintrag nur hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

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

Die älteren Modell-IDs `kimi/kimi-code` und `kimi/k2p5` werden weiterhin aus Kompatibilitätsgründen akzeptiert und auf Kimis stabile API-Modell-ID normalisiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet in China Zugriff auf Doubao und andere Modelle.

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

In den Modellauswahlen für Onboarding/Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl `volcengine/*`- als auch `volcengine-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere Provider-spezifische Auswahl anzuzeigen.

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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `byteplus/*`-Katalog wird gleichzeitig registriert.

In den Modellauswahlen für Onboarding/Konfiguration bevorzugt die BytePlus-Authentifizierungsoption sowohl `byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere Provider-spezifische Auswahl anzuzeigen.

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

Synthetic stellt Anthropic-kompatible Modelle hinter dem Provider `synthetic` bereit:

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

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurationsausschnitte.

<Note>
Auf MiniMaxs Anthropic-kompatiblem Streaming-Pfad deaktiviert OpenClaw Thinking standardmäßig für die M2.x-Familie, sofern Sie es nicht explizit festlegen; MiniMax-M3 (und M3.x) bleibt standardmäßig auf dem vom Provider ausgelassenen/adaptiven Thinking-Pfad. `/fast on` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
</Note>

Plugin-eigene Aufteilung der Fähigkeiten:

- Text-/Chat-Standards bleiben auf `minimax/MiniMax-M3`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist Plugin-eigenes `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt auf der Provider-ID `minimax`

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

OpenClaw verwendet LM Studios natives `/api/v1/models` und `/api/v1/models/load` für Erkennung und automatisches Laden, standardmäßig mit `/v1/chat/completions` für die Inferenz. Wenn LM Studio JIT-Laden, TTL und automatische Entfernung den Modelllebenszyklus übernehmen sollen, setzen Sie `models.providers.lmstudio.params.preload: false`. Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet Ollamas native API:

- Provider: `ollama`
- Authentifizierung: Keine erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama installieren, dann ein Modell abrufen:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit `OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Provider-Plugin fügt Ollama direkt zu `openclaw onboard` und der Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama) für Onboarding, Cloud-/lokalen Modus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `vllm`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um die automatische Erkennung lokal zu aktivieren (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um die automatische Erkennung lokal zu aktivieren (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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
  <Accordion title="Optionale Standardfelder">
    Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional. Wenn sie ausgelassen werden, verwendet OpenClaw standardmäßig:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Empfehlung: Legen Sie explizite Werte fest, die zu den Grenzwerten Ihres Proxys/Modells passen.

  </Accordion>
  <Accordion title="Regeln zur Proxy-Routenformung">
    - Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler wegen nicht unterstützter `developer`-Rollen zu vermeiden.
    - Proxy-artige OpenAI-kompatible Routen überspringen außerdem natives, nur für OpenAI geltendes Request-Shaping: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Prompt-Cache-Hinweise, kein OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping und keine versteckten OpenClaw-Zuordnungsheader.
    - Für OpenAI-kompatible Completions-Proxys, die anbieterspezifische Felder benötigen, setzen Sie `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`), um zusätzliches JSON in den ausgehenden Request-Body zusammenzuführen.
    - Für vLLM-Chat-Template-Steuerungen setzen Sie `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Das gebündelte vLLM-Plugin sendet automatisch `enable_thinking: false` und `force_nonempty_content: true` für `vllm/nemotron-3-*`, wenn die Thinking-Stufe der Sitzung ausgeschaltet ist.
    - Für langsame lokale Modelle oder entfernte LAN-/Tailnet-Hosts setzen Sie `models.providers.<id>.timeoutSeconds`. Dadurch wird die Verarbeitung von HTTP-Anfragen an Provider-Modelle erweitert, einschließlich Verbindungsaufbau, Header, Body-Streaming und Gesamtabbruch des geschützten Abrufs, ohne das gesamte Agent-Laufzeit-Timeout zu erhöhen. Wenn `agents.defaults.timeoutSeconds` oder ein laufbezogenes Timeout niedriger ist, erhöhen Sie auch diese Obergrenze; Provider-Timeouts können den gesamten Lauf nicht verlängern.
    - HTTP-Aufrufe an Modell-Provider erlauben Fake-IP-DNS-Antworten von Surge, Clash und sing-box in `198.18.0.0/15` und `fc00::/7` nur für den konfigurierten Provider-`baseUrl`-Hostnamen. Benutzerdefinierte/lokale Provider-Endpunkte vertrauen für geschützte Modellanfragen außerdem genau diesem konfigurierten `scheme://host:port`-Ursprung, einschließlich local loopback, LAN- und Tailnet-Hosts. Dies ist keine neue Konfigurationsoption; die von Ihnen konfigurierte `baseUrl` erweitert die Request-Richtlinie nur für diesen Ursprung. Fake-IP-Hostnamenzulassung und Vertrauen in den exakten Ursprung sind unabhängige Mechanismen. Andere private, local-loopback-, link-local-, metadata-Ziele und andere Ports erfordern weiterhin ein explizites Opt-in mit `models.providers.<id>.request.allowPrivateNetwork: true`. Setzen Sie `models.providers.<id>.request.allowPrivateNetwork: false`, um dem Vertrauen in den exakten Ursprung zu widersprechen.
    - Wenn `baseUrl` leer/ausgelassen ist, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` auflöst).
    - Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.
    - Für `api: "anthropic-messages"` auf nicht direkten Endpunkten (jeder Provider außer dem kanonischen `anthropic` oder eine benutzerdefinierte `models.providers.anthropic.baseUrl`, deren Host kein öffentlicher `api.anthropic.com`-Endpunkt ist) unterdrückt OpenClaw implizite Anthropic-Beta-Header wie `claude-code-20250219`, `interleaved-thinking-2025-05-14` und OAuth-Markierungen, damit benutzerdefinierte Anthropic-kompatible Proxys nicht unterstützte Beta-Flags nicht ablehnen. Setzen Sie `models.providers.<id>.headers["anthropic-beta"]` explizit, wenn Ihr Proxy bestimmte Beta-Funktionen benötigt.

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

- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - Modellkonfigurationsschlüssel
- [Modell-Failover](/de/concepts/model-failover) - Fallback-Ketten und Wiederholungsverhalten
- [Modelle](/de/concepts/models) - Modellkonfiguration und Aliase
- [Provider](/de/providers) - Einrichtungshandbücher pro Provider
