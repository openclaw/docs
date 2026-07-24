---
read_when:
    - Sie benötigen eine Provider-spezifische Referenz zur Modelleinrichtung
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider.
sidebarTitle: Model providers
summary: Übersicht der Modell-Provider mit Beispielkonfigurationen und CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-07-24T03:46:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7c26d908d134f678acb3d62ae73700e7aa019d5d48a8ffdbb6c8f09182f1e09d
    source_path: concepts/model-providers.md
    workflow: 16
---

Referenz für **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram). Regeln zur Modellauswahl finden Sie unter [Modelle](/de/concepts/models).

## Kurzregeln

<AccordionGroup>
  <Accordion title="Modellreferenzen und CLI-Hilfsbefehle">
    - Modellreferenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` speichert Aliasse und modellspezifische Einstellungen; `agents.defaults.modelPolicy.allow` ist die optionale explizite Zulassungsliste für Überschreibungen.
    - CLI-Hilfsbefehle: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` legen Standardwerte auf Provider-Ebene fest; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` überschreiben sie pro Modell.
    - Fallback-Regeln, Cooldown-Prüfungen und Persistenz von Sitzungsüberschreibungen: [Modell-Failover](/de/concepts/model-failover).

  </Accordion>
  <Accordion title="Das Hinzufügen einer Provider-Authentifizierung ändert Ihr primäres Modell nicht">
    `openclaw configure` behält ein vorhandenes `agents.defaults.model.primary` bei, wenn Sie einen Provider hinzufügen oder erneut authentifizieren. `openclaw models auth login` verhält sich ebenso, sofern Sie nicht `--set-default` übergeben. Provider-Plugins können in ihrem Authentifizierungskonfigurations-Patch weiterhin ein empfohlenes Standardmodell zurückgeben, OpenClaw behandelt dies bei bereits vorhandenem primären Modell jedoch als „dieses Modell verfügbar machen“ und nicht als „das aktuelle primäre Modell ersetzen“.

    Um das Standardmodell bewusst zu wechseln, verwenden Sie `openclaw models set <provider/model>` oder `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Trennung von OpenAI-Provider und -Runtime">
    OpenAI-Modellreferenzen und Agent-Runtimes sind getrennt:

    - `openai/<model>` wählt den kanonischen OpenAI-Provider und das Modell aus. Das Präfix allein wählt niemals Codex aus.
    - Wenn die Provider-/Modell-Runtime-Richtlinie nicht festgelegt oder auf `auto` gesetzt ist, darf OpenAI Codex nur für eine exakt übereinstimmende offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne ausdrücklich definierte Anfrageüberschreibung implizit auswählen.
    - Explizit definierte Completions-Adapter, benutzerdefinierte Endpunkte und Routen mit ausdrücklich definiertem Anfrageverhalten verbleiben bei OpenClaw. Offizielle Klartext-HTTP-Endpunkte werden abgelehnt.
    - Veraltete Codex-Modellreferenzen sind Legacy-Konfigurationen, die Doctor in `openai/<model>` umschreibt.
    - Provider-/Modell-`agentRuntime.id: "openclaw"` belässt eine ansonsten geeignete Route ausdrücklich bei OpenClaw. `agentRuntime.id: "codex"` erfordert Codex und schlägt restriktiv fehl, wenn die effektive Route nicht Codex-kompatibel ist.

    Siehe [Implizite OpenAI-Agent-Runtime](/de/providers/openai#implicit-agent-runtime) und [Codex-Harness](/de/plugins/codex-harness). Falls die Trennung zwischen Provider und Runtime unklar ist, lesen Sie zuerst [Agent-Runtimes](/de/concepts/agent-runtimes).

    Die automatische Plugin-Aktivierung folgt derselben Grenze: Eine implizit Codex-kompatible effektive Route kann das Codex-Plugin aktivieren, während explizites Provider-/Modell-`agentRuntime.id: "codex"` oder Legacy-Referenzen vom Typ `codex/<model>` es erfordern. Ein `openai/*`-Präfix allein bewirkt dies nicht.

    Eine neue OpenAI-Einrichtung verwendet eine routenspezifische GPT-5.6-Referenz: Bei der Einrichtung mit API-Schlüssel wird
    `openai/gpt-5.6` ausgewählt (die reine direkte API-ID wird zu Sol aufgelöst), während
    ChatGPT-/Codex-OAuth für den nativen Codex-
    Katalog exakt `openai/gpt-5.6-sol` auswählt. Vorhandene explizite primäre Modelle, einschließlich `openai/gpt-5.5`, bleiben
    erhalten, wenn die OpenAI-Authentifizierung hinzugefügt oder aktualisiert wird. GPT-5.5 bleibt
    über beide Runtimes als explizite Wiederherstellungsoption für Konten ohne
    GPT-5.6-Zugriff verfügbar.

  </Accordion>
  <Accordion title="CLI-Runtimes">
    CLI-Runtimes verwenden dieselbe Trennung: Wählen Sie kanonische Modellreferenzen wie `anthropic/claude-*` oder `google/gemini-*` und setzen Sie anschließend die Provider-/Modell-Runtime-Richtlinie auf `claude-cli` oder `google-gemini-cli`, wenn Sie ein lokales CLI-Backend verwenden möchten.

    Veraltete Referenzen vom Typ `claude-cli/*` und `google-gemini-cli/*` werden zurück zu kanonischen Provider-Referenzen migriert, wobei die Runtime separat erfasst wird. Veraltete Referenzen vom Typ `codex-cli/*` werden zu `openai/*` migriert und verwenden die Codex-App-Server-Route; OpenClaw enthält kein gebündeltes Codex-CLI-Backend mehr.

  </Accordion>
</AccordionGroup>

## Provider in der Control UI konfigurieren

Öffnen Sie **Settings → Model Providers** in der Control UI, um in `models.providers.<id>.apiKey` gespeicherte Provider-API-Schlüssel hinzuzufügen, zu ersetzen oder zu entfernen. Die Seite zeigt an, ob der jeweilige API-Schlüssel aus der OpenClaw-Konfiguration oder einer Umgebungsvariable stammt, ohne die Anmeldedaten anzuzeigen. Über die Umgebung bereitgestellte Schlüssel werden weiterhin über die Prozessumgebung des Gateway verwaltet.

Verwenden Sie **Test connection**, um eine Live-Prüfung des Providers auszuführen und die Latenz oder einen kategorisierten Authentifizierungs-, Ratenbegrenzungs-, Abrechnungs-, Zeitüberschreitungs- oder Antwortfehler anzuzeigen. Eine Prüfung sendet eine echte Provider-Anfrage und kann eine kleine Anzahl von Tokens verbrauchen. OAuth- und Token-Profile können außerdem über die Provider-Karte abgemeldet werden.

Die Karte **Default models** verwaltet das primäre Modell, geordnete Fallbacks und das Hilfsmodell aus dem konfigurierten Modellkatalog. Wählen Sie die Modelle aus und speichern Sie sie anschließend gemeinsam in den vorhandenen Einstellungen `agents.defaults.model` und `agents.defaults.utilityModel`. Beim Hilfsmodell lässt **Automatic** die Einstellung ungesetzt, während **Disabled** eine leere Zeichenfolge speichert, um das Hilfsmodell-Routing zu deaktivieren.

## Provider-Verhalten im Besitz von Plugins

Der Großteil der providerspezifischen Logik befindet sich in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife bereitstellt. Plugins sind für Onboarding, Modellkataloge, die Zuordnung von Authentifizierungs-Umgebungsvariablen, Transport-/Konfigurationsnormalisierung, Bereinigung von Tool-Schemas, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Denk-/Schlussfolgerungsprofile und mehr zuständig.

Die vollständige Liste der Provider-SDK-Hooks und Beispiele für gebündelte Plugins finden Sie unter [Provider-Plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig benutzerdefinierten Anfrage-Executor benötigt, verwendet eine separate, tiefergehende Erweiterungsschnittstelle.

<Note>
Provider-spezifisches Runner-Verhalten befindet sich in expliziten Provider-Hooks wie Wiederholungsrichtlinie, Tool-Schema-Normalisierung, Stream-Wrapping und Transport-/Anfragehilfen. Die veraltete statische Sammlung `ProviderPlugin.capabilities` dient ausschließlich der Kompatibilität und wird von der gemeinsamen Runner-Logik nicht mehr gelesen.
</Note>

## Rotation von API-Schlüsseln

<AccordionGroup>
  <Accordion title="Schlüsselquellen und Priorität">
    Konfigurieren Sie mehrere Schlüssel über:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
    - `<PROVIDER>_API_KEYS` (durch Kommas oder Semikolons getrennte Liste)
    - `<PROVIDER>_API_KEY` (primärer Schlüssel)
    - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)

    Für Google-Provider wird `GOOGLE_API_KEY` ebenfalls als Fallback berücksichtigt. Die Reihenfolge der Schlüsselauswahl wahrt die Priorität und entfernt doppelte Werte.

  </Accordion>
  <Accordion title="Wann die Rotation einsetzt">
    - Anfragen werden nur bei Antworten aufgrund einer Ratenbegrenzung mit dem nächsten Schlüssel wiederholt (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder regelmäßige Meldungen über Nutzungslimits).
    - Fehler, die nicht auf Ratenbegrenzungen zurückzuführen sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
    - Wenn alle infrage kommenden Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

  </Accordion>
</AccordionGroup>

## Offizielle Provider-Plugins

Offizielle Provider-Plugins veröffentlichen ihre eigenen Modellkatalogzeilen. Diese Provider benötigen **keine** `models.providers`-Modelleinträge; aktivieren Sie das Provider-Plugin, legen Sie die Authentifizierung fest und wählen Sie ein Modell aus. Verwenden Sie `models.providers` nur für explizite benutzerdefinierte Provider oder eng begrenzte Anfrageeinstellungen wie Zeitüberschreitungen.

### OpenAI

- Provider: `openai`
- Authentifizierung: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Standard bei neuer Einrichtung: `openai/gpt-5.6`; bei der direkten API wird die reine ID zu Sol aufgelöst.
- Beispielmodelle: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Prüfen Sie die Verfügbarkeit für Konto und Modell mit `openclaw models list --provider openai`, falls sich eine bestimmte Installation oder ein bestimmter API-Schlüssel anders verhält.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto`; OpenClaw übergibt die Transportauswahl an die gemeinsame Modell-Runtime.
- Überschreibung pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Die priorisierte Verarbeitung von OpenAI kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie anstelle des gemeinsamen Schalters `/fast` eine explizite Stufe wünschen
- Verborgene OpenClaw-Zuordnungsheader (`originator`, `version`, `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Hinweise für den Prompt-Cache und OpenAI-kompatible Payload-Anpassungen für Schlussfolgerungen bei; Proxy-Routen tun dies nicht
- `openai/gpt-5.3-codex-spark` ist nur über ChatGPT-/Codex-OAuth verfügbar; direkte OpenAI-API-Schlüssel- und Azure-API-Schlüssel-Routen lehnen es ab

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Wenn die API-Organisation GPT-5.6 nicht bereitstellt, legen Sie
`openai/gpt-5.5` explizit fest. Beim normalen Onboarding und bei der erneuten Authentifizierung bleibt ein
vorhandenes explizites primäres Modell erhalten; `models auth login --set-default` und
`models set` sind die vorgesehenen Wege zum Ersetzen.

### Anthropic

- Provider: `anthropic`
- Authentifizierung: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich mit API-Schlüssel und OAuth authentifiziertem Datenverkehr, der an `api.anthropic.com` gesendet wird; OpenClaw ordnet dies Anthropic-`service_tier` zu (`auto` gegenüber `standard_only`)
- Die bevorzugte Claude-CLI-Konfiguration behält die Modellreferenz kanonisch bei und wählt das CLI-
  Backend separat aus: `anthropic/claude-opus-4-8` mit
  modellspezifischem `agentRuntime.id: "claude-cli"`. Veraltete
  Referenzen vom Typ `claude-cli/claude-opus-4-7` funktionieren aus Kompatibilitätsgründen weiterhin.

<Note>
Die Wiederverwendung der Claude CLI (`claude -p`) ist ein offiziell unterstützter OpenClaw-Integrationsweg. Die Anthropic-Authentifizierung per Setup-Token wird weiterhin unterstützt, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI, sofern verfügbar.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT-/Codex-OAuth

- Provider: `openai`
- Authentifizierung: OAuth (ChatGPT)
- Referenz für eine neue native Codex-App-Server-Testumgebung: `openai/gpt-5.6-sol`
- Dokumentation der nativen Codex-App-Server-Testumgebung: [Codex-Testumgebung](/de/plugins/codex-harness)
- Veraltete Modellreferenzen: `codex/gpt-*`, `openai-codex/gpt-*`
- Plugin-Grenze: `openai/*` lädt das OpenAI-Plugin; explizite Laufzeitrichtlinien oder die effektive, dem Provider zugeordnete Route bestimmen, ob das native Codex-App-Server-Plugin ausgewählt wird.
- CLI: `openclaw onboard --auth-choice openai` oder `openclaw models auth login --provider openai`
- Der eingebettete ChatGPT-Responses-Transport von OpenClaw verwendet standardmäßig `auto` (primär WebSocket, SSE als Fallback).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` und `params.fastMode` sind explizit festgelegte Einstellungen für eingebettete Anfragen. Damit verbleibt die implizite Laufzeitauswahl bei OpenClaw; natives Codex verwaltet seinen App-Server-Transport und seine Dienststufe selbst.
- Verborgene OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) werden nur bei nativem Codex-Datenverkehr zu `chatgpt.com/backend-api` angefügt, nicht bei generischen OpenAI-kompatiblen Proxys
- Der gemeinsame Umschalter `/fast` bleibt als Laufzeitsteuerung verfügbar; er unterscheidet sich von explizit festgelegten Modellparametern.
- Der native Codex-Katalog kann abhängig vom Kontozugriff die exakten Referenzen `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` und `openai/gpt-5.6-luna` bereitstellen. Er wendet den einfachen Alias `gpt-5.6` der direkten API nicht clientseitig an.
- `openai/gpt-5.5` verwendet die katalogeigene Codex-Einstellung `contextWindow = 400000` und die Standardlaufzeit `contextTokens = 272000`; überschreiben Sie die Laufzeitbegrenzung mit `models.providers.openai.models[].contextTokens`
- Melden Sie sich mit der Authentifizierung `openai` an und verwenden Sie `openai/gpt-5.6-sol` für eine neue, abonnementgestützte Einrichtung. Wählen Sie `openai/gpt-5.5` ausdrücklich aus, falls dieser Codex-Arbeitsbereich GPT-5.6 nicht bereitstellt.
- Verwenden Sie Provider/Modell `agentRuntime.id: "openclaw"`, damit eine ansonsten geeignete Route die integrierte Laufzeit verwendet. Wenn die Laufzeit nicht festgelegt oder auf `auto` gesetzt ist, kann Codex nur bei einer exakt offiziellen HTTPS-Responses-/ChatGPT-kompatiblen Route ohne explizit festgelegte Anfrageüberschreibung implizit ausgewählt werden.
- Veraltete Codex-GPT-Referenzen sind Altzustände und keine aktive Provider-Route. Verwenden Sie für neue Agentenkonfigurationen kanonische `openai/*`-Referenzen und führen Sie `openclaw doctor --fix` aus, um `codex/*`- und `openai-codex/*`-Referenzen zu migrieren und dabei deren native Codex-Semantik über das modellspezifische `agentRuntime.id: "codex"` beizubehalten. Bestehende explizite Auswahlen kanonischer `openai/gpt-5.5`-Referenzen werden nicht aktualisiert.

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

### Weitere gehostete Optionen mit Abonnementmodell

<CardGroup cols={3}>
  <Card title="MiniMax" href="/de/providers/minimax">
    Zugriff über MiniMax Coding Plan OAuth oder API-Schlüssel.
  </Card>
  <Card title="Qwen Cloud" href="/de/providers/qwen">
    Qwen-Cloud-Provider-Oberfläche sowie Endpunktzuordnung für Alibaba DashScope und Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/de/providers/zai">
    Z.AI Coding Plan oder allgemeine API-Endpunkte.
  </Card>
</CardGroup>

### OpenCode

- Authentifizierung: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Provider der Zen-Laufzeit: `opencode`
- Provider der Go-Laufzeit: `opencode-go`
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
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Kompatibilität: Eine veraltete OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- Alias: `google/gemini-3.1-pro` wird akzeptiert und zur aktiven Gemini-API-ID von Google, `google/gemini-3.1-pro-preview`, normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Denkmodus: `/think adaptive` verwendet Googles dynamischen Denkmodus. Gemini 3/3.1 lassen ein festes `thinkingLevel` aus; Gemini 2.5 sendet `thinkingBudget: -1`.
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das veraltete `cached_content`), um ein Provider-natives `cachedContents/...`-Handle weiterzuleiten; Gemini-Cache-Treffer werden als OpenClaw-`cacheRead` angezeigt

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Authentifizierung: Vertex verwendet gcloud ADC; Gemini CLI verwendet den eigenen OAuth-Ablauf

<Warning>
Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen ihrer Google-Konten gemeldet. Prüfen Sie die Google-Nutzungsbedingungen und verwenden Sie ein unkritisches Konto, wenn Sie fortfahren möchten.
</Warning>

Gemini-CLI-OAuth wird als Teil des gebündelten Plugins `google` ausgeliefert.

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

    Standardmodell: `google-gemini-cli/gemini-3-flash-preview`. Sie fügen **keine** Client-ID und kein Geheimnis in `openclaw.json` ein. Der CLI-Anmeldeablauf speichert Token in Authentifizierungsprofilen auf dem Gateway-Host.

  </Step>
  <Step title="Projekt festlegen (falls erforderlich)">
    Falls Anfragen nach der Anmeldung fehlschlagen, legen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host fest.
  </Step>
</Steps>

Gemini CLI verwendet standardmäßig `stream-json`. OpenClaw liest Assistenten-Stream-
Nachrichten und normalisiert `stats.cached` zu `cacheRead`; veraltete
`--output-format json`-Überschreibungen lesen den Antworttext weiterhin aus `response`.

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

### Weitere gebündelte Provider-Plugins

| Provider                                | ID                               | Authentifizierungs-Umgebungsvariable                 | Beispielmodell                                         |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` oder `OPENROUTER_API_KEY`           | `arcee/trinity-large-thinking`                         |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                        |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                 |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` oder `CHUTES_OAUTH_TOKEN`            | `chutes/zai-org/GLM-5-TEE`                             |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`               |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                        |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`              |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                           |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                           |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                      |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                     |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`               | `huggingface/deepseek-ai/DeepSeek-R1`                  |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                   |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                         |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                   |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`             |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                     |
| [Ollama Cloud](/de/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                               |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth oder `OPENROUTER_API_KEY`            | `openrouter/auto`                                      |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                         |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`     |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                      |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`          |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                      |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth oder `XAI_API_KEY`          | `xai/grok-4.3`                                         |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2.5` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Wissenswerte Besonderheiten

<AccordionGroup>
  <Accordion title="OpenRouter">
    Wendet seine Header zur App-Zuordnung und die Anthropic-`cache_control`-Markierungen nur auf verifizierten `openrouter.ai`-Routen an. DeepSeek-, Moonshot- und ZAI-Referenzen sind für das von OpenRouter verwaltete Prompt-Caching mit Cache-TTL geeignet, erhalten jedoch keine Anthropic-Cache-Markierungen. Als Proxy-artiger, OpenAI-kompatibler Pfad überspringt er die ausschließlich für natives OpenAI vorgesehene Aufbereitung (`serviceTier`, Responses `store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-basierte Referenzen behalten nur die Bereinigung von Gemini-Gedankensignaturen für Proxys bei.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini-basierte Referenzen durchlaufen denselben Proxy-Gemini-Bereinigungspfad; `kilocode/kilo-auto/balanced` und andere Referenzen ohne Unterstützung für Proxy-Reasoning überspringen die Proxy-Reasoning-Injektion.
  </Accordion>
  <Accordion title="MiniMax">
    Das Onboarding mit API-Schlüssel schreibt explizite Chatmodelldefinitionen für M3 und M2.7; die Bilderkennung verbleibt beim Plugin-eigenen Medien-Provider `MiniMax-VL-01`.
  </Accordion>
  <Accordion title="NVIDIA">
    Modell-IDs verwenden einen `nvidia/<vendor>/<model>`-Namensraum (zum Beispiel `nvidia/nvidia/nemotron-...`); Auswahlfelder behalten die wörtliche `<provider>/<model-id>`-Zusammensetzung bei, während der an die API gesendete kanonische Schlüssel nur ein Präfix enthält.
  </Accordion>
  <Accordion title="xAI">
    Verwendet den Responses-Pfad von xAI. Empfohlen wird SuperGrok/X Premium OAuth; API-Schlüssel funktionieren weiterhin über `XAI_API_KEY` oder die Plugin-Konfiguration, und Grok `web_search` verwendet vor dem Rückgriff auf einen API-Schlüssel dasselbe Authentifizierungsprofil. Grok 4.5 kann, sofern verfügbar, für Chat-, Programmier- und agentische Aufgaben ausgewählt werden; `grok-4.3` bleibt die gebündelte regionssichere Standardeinstellung. Ältere Konfigurationen mit `/fast` und `params.fastMode: true` werden weiterhin über die Grok-4.3-Kompatibilitätsweiterleitungen von xAI aufgelöst, neue Konfigurationen sollten jedoch direkt ein aktuelles Modell auswählen. `tool_stream` ist standardmäßig aktiviert; die Deaktivierung erfolgt über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provider über `models.providers` (benutzerdefinierte/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite `models.providers.<id>`-Einträge nur, wenn Sie die Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

Gebündelte und im Katalog bekannte Routen beziehen ihre `compat`-Fähigkeiten aus dem zuständigen Provider-Plugin. Ein `compat`-Block in der Konfiguration ist für einen benutzerdefinierten Provider bzw. ein benutzerdefiniertes Modell oder eine abweichende `api`-/`baseUrl`-Route vorgesehen, deren Endpunktvertrag Sie überprüft haben; siehe den [Leitfaden zu Fähigkeitsdeklarationen für benutzerdefinierte Provider](/de/gateway/config-tools#custom-provider-capability-declarations). Doctor entfernt veraltete Werte, die lediglich den Katalog wiederholen, und lässt abweichende Werte für die Überprüfung durch den Betreiber sichtbar.

Die Modellfähigkeitsprüfungen des Gateways lesen außerdem explizite `models.providers.<id>.models[]`-Metadaten. Wenn ein benutzerdefiniertes oder Proxy-Modell Bilder akzeptiert, legen Sie für dieses Modell `input: ["text", "image"]` fest, damit WebChat und von Nodes stammende Anhangspfade Bilder als native Modelleingaben statt als reine Text-Medienreferenzen übergeben.

`agents.defaults.models["provider/model"]` steuert Aliasse und modellspezifische Metadaten für Agenten. Es beschränkt weder Überschreibungen noch registriert es allein ein neues Laufzeitmodell. Fügen Sie für benutzerdefinierte Provider-Modelle außerdem `models.providers.<provider>.models[]` mit mindestens dem passenden `id` hinzu; verwenden Sie `agents.defaults.modelPolicy.allow` separat, wenn Sie Überschreibungen einschränken möchten.

### Moonshot AI (Kimi)

Installieren Sie vor dem Onboarding `@openclaw/moonshot-provider`. Fügen Sie einen expliziten `models.providers.moonshot`-Eintrag nur hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

- Provider: `moonshot`
- Authentifizierung: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k3`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi-Modell-IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k3`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.7-code-highspeed`
- `moonshot/kimi-k2.5`

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
- Kimi K3: `kimi/k3` (256K) oder `kimi/k3[1m]` (1M-Tarif)
- Kimi Code: `kimi/kimi-for-coding`
- Kimi Code HighSpeed: `kimi/kimi-for-coding-highspeed`

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

Volcano Engine (火山引擎) bietet in China Zugriff auf Doubao und andere Modelle.

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

Beim Onboarding wird standardmäßig die Programmieroberfläche verwendet, gleichzeitig wird jedoch auch der allgemeine `volcengine/*`-Katalog registriert.

In den Modellauswahlfeldern für Onboarding und Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl `volcengine/*`- als auch `volcengine-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen wurden, greift OpenClaw auf den ungefilterten Katalog zurück, anstatt ein leeres Provider-spezifisches Auswahlfeld anzuzeigen.

<Tabs>
  <Tab title="Standardmodelle">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Coding-Modelle (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`

  </Tab>
</Tabs>

### BytePlus (international)

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

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, gleichzeitig wird jedoch der allgemeine `byteplus/*`-Katalog registriert.

In den Modellauswahlen für Onboarding und Konfiguration bevorzugt die BytePlus-Authentifizierungsoption sowohl `byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind, greift OpenClaw auf den ungefilterten Katalog zurück, statt eine leere, auf den Provider beschränkte Auswahl anzuzeigen.

<Tabs>
  <Tab title="Standardmodelle">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding-Modelle (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic stellt hinter dem Provider `synthetic` Anthropic-kompatible Modelle bereit:

- Provider: `synthetic`
- Authentifizierung: `SYNTHETIC_API_KEY`
- Beispielmodell: `synthetic/hf:MiniMaxAI/MiniMax-M3`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M3", name: "MiniMax M3" }],
      },
    },
  },
}
```

### MiniMax

MiniMax wird über `models.providers` konfiguriert, da es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax-API-Schlüssel (global): `--auth-choice minimax-global-api`
- MiniMax-API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Authentifizierung: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`

Einrichtungsdetails, Modelloptionen und Konfigurationsausschnitte finden Sie unter [/providers/minimax](/de/providers/minimax).

<Note>
Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking für die M2.x-Familie standardmäßig, sofern Sie es nicht ausdrücklich festlegen; MiniMax-M3 (und M3.x) verwendet standardmäßig weiterhin den ausgelassenen/adaptiven Thinking-Pfad des Providers. `/fast on` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
</Note>

Aufteilung der Plugin-eigenen Fähigkeiten:

- Die Standardwerte für Text/Chat verbleiben bei `minimax/MiniMax-M3`
- Die Bilderzeugung erfolgt über `minimax/image-01` oder `minimax-portal/image-01`
- Das Bildverständnis erfolgt auf beiden MiniMax-Authentifizierungspfaden über das Plugin-eigene `MiniMax-VL-01`
- Die Websuche verbleibt bei der Provider-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Provider-Plugin ausgeliefert, das die native API verwendet:

- Provider: `lmstudio`
- Authentifizierung: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Legen Sie anschließend ein Modell fest (ersetzen Sie es durch eine der von `http://localhost:1234/api/v1/models` zurückgegebenen IDs):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet die nativen `/api/v1/models` und `/api/v1/models/load` von LM Studio für Erkennung und automatisches Laden sowie standardmäßig `/v1/chat/completions` für die Inferenz. Wenn JIT-Laden, TTL und automatisches Entfernen von LM Studio den Modelllebenszyklus steuern sollen, legen Sie `models.providers.lmstudio.params.preload: false` fest. Informationen zur Einrichtung und Fehlerbehebung finden Sie unter [/providers/lmstudio](/de/providers/lmstudio).

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet die native API von Ollama:

- Provider: `ollama`
- Authentifizierung: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama installieren und anschließend ein Modell abrufen:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit `OLLAMA_API_KEY` dafür entscheiden. Das gebündelte Provider-Plugin fügt Ollama direkt zu `openclaw onboard` und zur Modellauswahl hinzu. Informationen zu Onboarding, Cloud-/lokalem Modus und benutzerdefinierter Konfiguration finden Sie unter [/providers/ollama](/de/providers/ollama).

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale bzw. selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `vllm`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

So aktivieren Sie lokal die automatische Erkennung (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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

SGLang wird als gebündeltes Provider-Plugin für schnelle, selbst gehostete OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

So aktivieren Sie lokal die automatische Erkennung (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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
    Bei benutzerdefinierten Providern sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional. Wenn sie ausgelassen werden, verwendet OpenClaw folgende Standardwerte:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Empfehlung: Legen Sie explizite Werte fest, die den Beschränkungen Ihres Proxys bzw. Modells entsprechen.

  </Accordion>
  <Accordion title="Regeln für die Gestaltung von Proxy-Routen">
    - Für `api: "openai-completions"` an nicht nativen Endpunkten (jedes nicht leere `baseUrl`, dessen Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler aufgrund nicht unterstützter `developer`-Rollen zu vermeiden.
    - Proxyartige OpenAI-kompatible Routen überspringen außerdem die ausschließlich für natives OpenAI vorgesehene Anfragegestaltung: kein `service_tier`, kein Responses-`store`, kein Completions-`store`, keine Prompt-Cache-Hinweise, keine OpenAI-Reasoning-Kompatibilitätsgestaltung der Nutzlast und keine verborgenen OpenClaw-Zuordnungsheader.
    - Legen Sie für OpenAI-kompatible Completions-Proxys, die anbieterspezifische Felder benötigen, `agents.defaults.models["provider/model"].params.extra_body` (oder `extraBody`) fest, um zusätzliches JSON in den ausgehenden Anfragetext einzufügen.
    - Legen Sie für die Chat-Template-Steuerung von vLLM `agents.defaults.models["provider/model"].params.chat_template_kwargs` fest. Das gebündelte vLLM-Plugin sendet für `vllm/nemotron-3-*` automatisch `enable_thinking: false` und `force_nonempty_content: true`, wenn die Thinking-Stufe der Sitzung deaktiviert ist.
    - Legen Sie für langsame lokale Modelle oder entfernte LAN-/Tailnet-Hosts `models.providers.<id>.timeoutSeconds` fest. Dadurch wird die Verarbeitung von HTTP-Anfragen an Provider-Modelle verlängert, einschließlich Verbindung, Headern, Body-Streaming und dem gesamten Abbruch des geschützten Abrufs, ohne das Zeitlimit der gesamten Agent-Laufzeit zu erhöhen. Wenn `agents.defaults.timeoutSeconds` oder ein laufzeitspezifisches Zeitlimit niedriger ist, erhöhen Sie auch diese Obergrenze; Provider-Zeitlimits können nicht die gesamte Ausführung verlängern.
    - HTTP-Aufrufe an Modell-Provider erlauben Fake-IP-DNS-Antworten von Surge, Clash und sing-box in `198.18.0.0/15` und `fc00::/7` ausschließlich für den konfigurierten Hostnamen `baseUrl` des Providers. Benutzerdefinierte/lokale Provider-Endpunkte vertrauen für geschützte Modellanfragen außerdem exakt dem konfigurierten Ursprung `scheme://host:port`, einschließlich Loopback-, LAN- und Tailnet-Hosts. Dies ist keine neue Konfigurationsoption; das von Ihnen konfigurierte `baseUrl` erweitert die Anfragerichtlinie ausschließlich für diesen Ursprung. Die Zulassung von Fake-IP-Hostnamen und das Vertrauen in den exakten Ursprung sind voneinander unabhängige Mechanismen. Andere private, Loopback-, Link-Local- und Metadatenziele sowie andere Ports erfordern weiterhin eine ausdrückliche Aktivierung über `models.providers.<id>.request.allowPrivateNetwork: true`. Legen Sie `models.providers.<id>.request.allowPrivateNetwork: false` fest, um das Vertrauen in den exakten Ursprung zu deaktivieren.
    - Wenn `baseUrl` leer ist oder ausgelassen wird, behält OpenClaw das standardmäßige OpenAI-Verhalten bei (das zu `api.openai.com` aufgelöst wird).
    - Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` an nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.
    - Für `api: "anthropic-messages"` an nicht direkten Endpunkten (jeder andere Provider als das kanonische `anthropic` oder ein benutzerdefiniertes `models.providers.anthropic.baseUrl`, dessen Host kein öffentlicher `api.anthropic.com`-Endpunkt ist) unterdrückt OpenClaw implizite Anthropic-Beta-Header wie `claude-code-20250219`, `interleaved-thinking-2025-05-14` und OAuth-Markierungen, damit benutzerdefinierte Anthropic-kompatible Proxys nicht unterstützte Beta-Flags nicht ablehnen. Legen Sie `models.providers.<id>.headers["anthropic-beta"]` explizit fest, wenn Ihr Proxy bestimmte Beta-Funktionen benötigt.

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

- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) – Modellkonfigurationsschlüssel
- [Modell-Failover](/de/concepts/model-failover) – Fallback-Ketten und Wiederholungsverhalten
- [Modelle](/de/concepts/models) – Modellkonfiguration und Aliasse
- [Provider](/de/providers) – Einrichtungsanleitungen für einzelne Provider
