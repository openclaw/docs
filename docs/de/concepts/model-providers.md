---
read_when:
    - Sie benötigen eine Referenz zur Modelleinrichtung nach Anbieter
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modellanbieter
summary: Übersicht der Modellanbieter mit Beispielkonfigurationen + CLI-Abläufen
title: Modellanbieter
x-i18n:
    generated_at: "2026-04-22T04:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modellanbieter

Diese Seite behandelt **LLM-/Modellanbieter** (nicht Chat-Channels wie WhatsApp/Telegram).
Zu Regeln für die Modellauswahl siehe [/concepts/models](/de/concepts/models).

## Schnellregeln

- Modell-Refs verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` setzen, wird es zur Allowlist.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Fallback-Laufzeitregeln, Cooldown-Prüfungen und Persistenz von Sitzungsüberschreibungen sind
  in [/concepts/model-failover](/de/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten;
  `models.providers.*.models[].contextTokens` ist die effektive Laufzeitobergrenze.
- Anbieter-Plugins können Modellkataloge über `registerProvider({ catalog })` injizieren;
  OpenClaw führt diese Ausgabe vor dem Schreiben von
  `models.json` in `models.providers` zusammen.
- Anbieter-Manifeste können `providerAuthEnvVars` und
  `providerAuthAliases` deklarieren, sodass generische env-basierte Auth-Prüfungen und Anbietervarianten
  keine Plugin-Laufzeit laden müssen. Die verbleibende env-Variablen-Zuordnung im Core ist jetzt
  nur noch für Nicht-Plugin-/Core-Anbieter und einige generische Vorrangfälle wie
  Anthropic-Onboarding mit API-Schlüssel zuerst vorgesehen.
- Anbieter-Plugins können auch das Laufzeitverhalten des Anbieters übernehmen über
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` und
  `onModelSelected`.
- Hinweis: Laufzeit-`capabilities` des Anbieters sind Metadaten des gemeinsamen Runners (Anbieterfamilie, Besonderheiten bei Transkripten/Tools, Transport-/Cache-Hinweise). Das ist nicht dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model),
  das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
- Der gebündelte Anbieter `codex` ist mit dem gebündelten Codex-Agent-Harness gekoppelt.
  Verwenden Sie `codex/gpt-*`, wenn Sie Codex-eigenes Login, Modellerkennung, natives
  Fortsetzen von Threads und App-Server-Ausführung möchten. Reine `openai/gpt-*`-Refs
  verwenden weiterhin den OpenAI-Anbieter und den normalen OpenClaw-Anbietertransport.
  Reine Codex-Bereitstellungen können das automatische PI-Fallback mit
  `agents.defaults.embeddedHarness.fallback: "none"` deaktivieren; siehe
  [Codex Harness](/de/plugins/codex-harness).

## Plugin-eigenes Anbieterverhalten

Anbieter-Plugins können jetzt den Großteil der anbieterspezifischen Logik übernehmen, während OpenClaw
die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Der Anbieter verwaltet Onboarding-/Login-
  Abläufe für `openclaw onboard`, `openclaw models auth` und Headless-Setup
- `wizard.setup` / `wizard.modelPicker`: Der Anbieter verwaltet Beschriftungen für Auth-Auswahl,
  Legacy-Aliase, Hinweise für Onboarding-Allowlists und Setup-Einträge in Onboarding-/Modellauswahlen
- `catalog`: Der Anbieter erscheint in `models.providers`
- `normalizeModelId`: Der Anbieter normalisiert Legacy-/Preview-Modell-IDs vor
  Lookup oder Kanonisierung
- `normalizeTransport`: Der Anbieter normalisiert `api` / `baseUrl` der Transportfamilie
  vor der generischen Modellassemblierung; OpenClaw prüft zuerst den passenden Anbieter,
  dann andere hook-fähige Anbieter-Plugins, bis eines den
  Transport tatsächlich verändert
- `normalizeConfig`: Der Anbieter normalisiert die Konfiguration `models.providers.<id>`, bevor die
  Laufzeit sie verwendet; OpenClaw prüft zuerst den passenden Anbieter, dann andere
  hook-fähige Anbieter-Plugins, bis eines die Konfiguration tatsächlich verändert. Wenn kein
  Anbieter-Hook die Konfiguration umschreibt, normalisieren gebündelte Google-Familien-Helfer weiterhin
  unterstützte Google-Anbietereinträge.
- `applyNativeStreamingUsageCompat`: Der Anbieter wendet endpoint-gesteuerte native Streaming-Usage-Kompatibilitäts-Umschreibungen für Konfigurationsanbieter an
- `resolveConfigApiKey`: Der Anbieter löst env-Marker-Authentifizierung für Konfigurationsanbieter auf,
  ohne das vollständige Laufzeit-Auth-Laden zu erzwingen. `amazon-bedrock` hat hier auch einen
  eingebauten AWS-env-Marker-Resolver, obwohl Bedrock-Laufzeit-Auth die
  AWS-SDK-Standardkette verwendet.
- `resolveSyntheticAuth`: Der Anbieter kann Verfügbarkeit lokaler/selbstgehosteter oder anderer
  konfigurationsgestützter Auth anzeigen, ohne Klartext-Geheimnisse zu persistieren
- `shouldDeferSyntheticProfileAuth`: Der Anbieter kann gespeicherte synthetische Profil-
  Platzhalter als weniger vorrangig als env-/konfigurationsgestützte Auth markieren
- `resolveDynamicModel`: Der Anbieter akzeptiert Modell-IDs, die im lokalen
  statischen Katalog noch nicht vorhanden sind
- `prepareDynamicModel`: Der Anbieter benötigt eine Metadatenaktualisierung, bevor die
  dynamische Auflösung erneut versucht wird
- `normalizeResolvedModel`: Der Anbieter benötigt Umschreibungen von Transport oder Basis-URL
- `contributeResolvedModelCompat`: Der Anbieter steuert Kompatibilitäts-Flags für seine
  Vendor-Modelle bei, selbst wenn sie über einen anderen kompatiblen Transport ankommen
- `capabilities`: Der Anbieter veröffentlicht Besonderheiten bei Transkripten/Tools/Anbieterfamilie
- `normalizeToolSchemas`: Der Anbieter bereinigt Tool-Schemas, bevor der eingebettete
  Runner sie sieht
- `inspectToolSchemas`: Der Anbieter zeigt transportspezifische Schema-Warnungen
  nach der Normalisierung an
- `resolveReasoningOutputMode`: Der Anbieter wählt native oder getaggte
  Reasoning-Output-Verträge
- `prepareExtraParams`: Der Anbieter setzt Standardwerte oder normalisiert anfragebezogene Parameter pro Modell
- `createStreamFn`: Der Anbieter ersetzt den normalen Stream-Pfad durch einen vollständig
  benutzerdefinierten Transport
- `wrapStreamFn`: Der Anbieter wendet Wrapper für Anfrage-Header/Body/Modell-Kompatibilität an
- `resolveTransportTurnState`: Der Anbieter liefert native Transport-
  Header oder Metadaten pro Zug
- `resolveWebSocketSessionPolicy`: Der Anbieter liefert native WebSocket-Sitzungs-
  Header oder eine Sitzungs-Cooldown-Richtlinie
- `createEmbeddingProvider`: Der Anbieter verwaltet das Memory-Embedding-Verhalten, wenn es
  besser zum Anbieter-Plugin als zum Core-Embedding-Switchboard gehört
- `formatApiKey`: Der Anbieter formatiert gespeicherte Auth-Profile in den zur Laufzeit
  vom Transport erwarteten `apiKey`-String
- `refreshOAuth`: Der Anbieter verwaltet OAuth-Refresh, wenn die gemeinsamen `pi-ai`-
  Refresher nicht ausreichen
- `buildAuthDoctorHint`: Der Anbieter hängt Reparaturhinweise an, wenn das OAuth-Refresh
  fehlschlägt
- `matchesContextOverflowError`: Der Anbieter erkennt anbieterspezifische
  Fehler bei Überschreitung des Kontextfensters, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Der Anbieter ordnet anbieterspezifische rohe Transport-/API-
  Fehler Failover-Gründen wie Rate Limit oder Überlastung zu
- `isCacheTtlEligible`: Der Anbieter entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Der Anbieter ersetzt den generischen Auth-Store-Fehler
  durch einen anbieterspezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Der Anbieter blendet veraltete Upstream-Zeilen aus und kann einen
  vendor-eigenen Fehler für direkte Auflösungsfehler zurückgeben
- `augmentModelCatalog`: Der Anbieter fügt nach Erkennung und Konfigurationszusammenführung
  synthetische/finale Katalogzeilen an
- `resolveThinkingProfile`: Der Anbieter verwaltet die genaue `/think`-Stufenmenge,
  optionale Anzeigebeschriftungen und die Standardstufe für ein ausgewähltes Modell
- `isBinaryThinking`: Kompatibilitäts-Hook für binäre Ein/Aus-Thinking-UX
- `supportsXHighThinking`: Kompatibilitäts-Hook für ausgewählte `xhigh`-Modelle
- `resolveDefaultThinkingLevel`: Kompatibilitäts-Hook für die Standardrichtlinie von `/think`
- `applyConfigDefaults`: Der Anbieter wendet anbieterspezifische globale Standardwerte
  bei der Materialisierung der Konfiguration basierend auf Auth-Modus, env oder Modellfamilie an
- `isModernModelRef`: Der Anbieter verwaltet die Abgleichung bevorzugter Modelle für Live-/Smoke-Tests
- `prepareRuntimeAuth`: Der Anbieter wandelt eine konfigurierte Anmeldedatenquelle in ein kurzlebiges
  Laufzeit-Token um
- `resolveUsageAuth`: Der Anbieter löst Nutzungs-/Quota-Anmeldedaten für `/usage`
  und verwandte Status-/Reporting-Oberflächen auf
- `fetchUsageSnapshot`: Der Anbieter verwaltet das Abrufen/Parsen des Usage-Endpunkts, während
  der Core weiterhin die Zusammenfassungs-Shell und Formatierung übernimmt
- `onModelSelected`: Der Anbieter führt Nebeneffekte nach der Modellauswahl aus, etwa
  Telemetrie oder anbietereigene Sitzungsbuchführung

Aktuelle gebündelte Beispiele:

- `anthropic`: Forward-Compat-Fallback für Claude 4.6, Hinweise zur Auth-Reparatur, Abruf des Usage-
  Endpunkts, Cache-TTL-/Anbieterfamilien-Metadaten und auth-bewusste globale
  Konfigurationsstandardwerte
- `amazon-bedrock`: anbietereigene Erkennung von Kontextüberlauf und Klassifizierung von Failover-
  Gründen für Bedrock-spezifische Drosselungs-/Not-Ready-Fehler sowie
  die gemeinsame Replay-Familie `anthropic-by-model` für Replay-Richtlinien-
  Schutzmechanismen nur für Claude auf Anthropic-Traffic
- `anthropic-vertex`: Replay-Richtlinien-Schutzmechanismen nur für Claude auf Anthropic-Message-
  Traffic
- `openrouter`: Durchreichen von Modell-IDs, Anfrage-Wrapper, Hinweise zu Anbieterfähigkeiten,
  Bereinigung von Gemini-Thought-Signatures auf proxybasiertem Gemini-Traffic, Proxy-
  Reasoning-Injektion über die Stream-Familie `openrouter-thinking`,
  Weiterleitung von Routing-Metadaten und Cache-TTL-Richtlinie
- `github-copilot`: Onboarding/Gerätelogin, Forward-Compat-Modell-Fallback,
  Claude-Thinking-Transkript-Hinweise, Laufzeit-Token-Austausch und Abruf des Usage-Endpunkts
- `openai`: Forward-Compat-Fallback für GPT-5.4, direkte OpenAI-Transport-
  Normalisierung, Codex-bewusste Hinweise bei fehlender Auth, Spark-Unterdrückung, synthetische
  OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Modell-Richtlinie, Alias-Normalisierung für Usage-Tokens
  (`input` / `output` und `prompt` / `completion`-Familien), die
  gemeinsame Stream-Familie `openai-responses-defaults` für native OpenAI-/Codex-
  Wrapper, Metadaten der Anbieterfamilie, gebündelte Registrierung des Bildgenerierungsanbieters
  für `gpt-image-2` und gebündelte Registrierung des Videogenerierungsanbieters
  für `sora-2`
- `google` und `google-gemini-cli`: Forward-Compat-Fallback für Gemini 3.1,
  native Gemini-Replay-Validierung, Bereinigung von Bootstrap-Replay, getaggter
  Reasoning-Output-Modus, Modern-Model-Abgleich, gebündelte Registrierung des Bildgenerierungs-
  anbieters für Gemini-Image-Preview-Modelle und gebündelte
  Registrierung des Videogenerierungsanbieters für Veo-Modelle; Gemini-CLI-OAuth verwaltet außerdem
  die Tokenformatierung von Auth-Profilen, das Parsing von Usage-Tokens und das Abrufen des Quota-Endpunkts
  für Usage-Oberflächen
- `moonshot`: gemeinsamer Transport, anbietereigene Normalisierung von Thinking-Payloads
- `kilocode`: gemeinsamer Transport, anbietereigene Anfrage-Header, Normalisierung von Reasoning-Payloads,
  Bereinigung von Proxy-Gemini-Thought-Signatures und Cache-TTL-
  Richtlinie
- `zai`: Forward-Compat-Fallback für GLM-5, Standardwerte für `tool_stream`, Cache-TTL-
  Richtlinie, Richtlinie für binäres Thinking/Live-Modelle sowie Usage-Auth + Abruf von Quotas;
  unbekannte `glm-5*`-IDs werden aus der gebündelten Vorlage `glm-4.7` synthetisiert
- `xai`: native Responses-Transport-Normalisierung, Umschreibungen von `/fast`-Aliasen für
  schnelle Grok-Varianten, Standard `tool_stream`, xAI-spezifische Bereinigung von Tool-Schemas /
  Reasoning-Payloads und gebündelte Registrierung des Videogenerierungsanbieters
  für `grok-imagine-video`
- `mistral`: anbietereigene Fähigkeitsmetadaten
- `opencode` und `opencode-go`: anbietereigene Fähigkeitsmetadaten plus
  Bereinigung von Proxy-Gemini-Thought-Signatures
- `alibaba`: anbietereigener Videogenerierungskatalog für direkte Wan-Modell-Refs
  wie `alibaba/wan2.6-t2v`
- `byteplus`: anbietereigene Kataloge plus gebündelte Registrierung des Videogenerierungsanbieters
  für Seedance-Text-zu-Video-/Bild-zu-Video-Modelle
- `fal`: gebündelte Registrierung des Videogenerierungsanbieters für gehostete Drittanbieter-
  Registrierung des Bildgenerierungsanbieters für FLUX-Bildmodelle plus gebündelte
  Registrierung des Videogenerierungsanbieters für gehostete Drittanbieter-Videomodelle
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` und `volcengine`:
  nur anbietereigene Kataloge
- `qwen`: anbietereigene Kataloge für Textmodelle plus gemeinsame
  Registrierungen für Media-Understanding- und Videogenerierungsanbieter für die
  multimodalen Oberflächen; die Qwen-Videogenerierung verwendet die Standard-DashScope-Video-
  Endpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `runway`: anbietereigene Registrierung des Videogenerierungsanbieters für native,
  auf Tasks basierende Runway-Modelle wie `gen4.5`
- `minimax`: anbietereigene Kataloge, gebündelte Registrierung des Videogenerierungsanbieters
  für Hailuo-Videomodelle, gebündelte Registrierung des Bildgenerierungsanbieters
  für `image-01`, hybride Auswahl von Anthropic-/OpenAI-Replay-Richtlinien
  sowie Usage-Auth-/Snapshot-Logik
- `together`: anbietereigene Kataloge plus gebündelte Registrierung des Videogenerierungsanbieters
  für Wan-Videomodelle
- `xiaomi`: anbietereigene Kataloge plus Usage-Auth-/Snapshot-Logik

Das gebündelte `openai`-Plugin verwaltet jetzt beide Anbieter-IDs: `openai` und
`openai-codex`.

Das deckt Anbieter ab, die noch in die normalen Transporte von OpenClaw passen. Ein Anbieter,
der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

## Rotation von API-Schlüsseln

- Unterstützt generische Rotation von Anbietern für ausgewählte Anbieter.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Kommas oder Semikolons getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Anbieter ist `GOOGLE_API_KEY` zusätzlich als Fallback enthalten.
- Die Auswahlreihenfolge für Schlüssel bewahrt die Priorität und entfernt doppelte Werte.
- Anfragen werden nur bei Antworten mit Rate Limit mit dem nächsten Schlüssel erneut versucht (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Usage-Limit-Meldungen).
- Fehler, die kein Rate Limit betreffen, schlagen sofort fehl; es wird keine Rotation von Schlüsseln versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der finale Fehler vom letzten Versuch zurückgegeben.

## Integrierte Anbieter (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Anbieter benötigen **keine**
Konfiguration unter `models.providers`; setzen Sie einfach Authentifizierung + wählen Sie ein Modell aus.

### OpenAI

- Anbieter: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- OpenAI-Responses-WebSocket-Warm-up ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Priority-Processing kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` bilden direkte `openai/*`-Responses-Anfragen auf `service_tier=priority` auf `api.openai.com` ab
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen Schalters `/fast` einen expliziten Tier möchten
- Versteckte OpenClaw-Attribution-Header (`originator`, `version`,
  `User-Agent`) werden nur auf nativem OpenAI-Traffic zu `api.openai.com` angewendet, nicht auf
  generischen OpenAI-kompatiblen Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-Kompatibilitäts-Formung der Payload bei; Proxy-Routen tun das nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil die Live-OpenAI-API es ablehnt; Spark wird als nur Codex behandelt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Anbieter: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen auch den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich per API-Schlüssel und OAuth authentifiziertem Traffic, der an `api.anthropic.com` gesendet wird; OpenClaw bildet dies auf Anthropic-`service_tier` (`auto` vs `standard_only`) ab
- Anthropic-Hinweis: Anthropic-Mitarbeitende haben uns mitgeteilt, dass die Nutzung im Stil der Claude CLI mit OpenClaw wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und `claude -p` als für diese Integration genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Anbieter: `openai-codex`
- Auth: OAuth (ChatGPT)
- Beispielmodell: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch auf nativen Codex-Responses-Anfragen (`chatgpt.com/backend-api`) weitergeleitet
- Versteckte OpenClaw-Attribution-Header (`originator`, `version`,
  `User-Agent`) werden nur an nativen Codex-Traffic zu
  `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Nutzt denselben Schalter `/fast` und dieselbe Konfiguration `params.fastMode` wie direktes `openai/*`; OpenClaw bildet dies auf `service_tier=priority` ab
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von Berechtigungen
- `openai-codex/gpt-5.4` behält natives `contextWindow = 1050000` und eine Standard-Laufzeitgrenze von `contextTokens = 272000`; überschreiben Sie die Laufzeitgrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI-Codex-OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Andere gehostete Optionen im Abonnementstil

- [Qwen Cloud](/de/providers/qwen): Oberfläche des Qwen-Cloud-Anbieters plus Alibaba-DashScope- und Coding-Plan-Endpunktzuordnung
- [MiniMax](/de/providers/minimax): MiniMax-Coding-Plan-OAuth oder Zugriff per API-Schlüssel
- [GLM Models](/de/providers/glm): Z.AI Coding Plan oder allgemeine API-Endpunkte

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Laufzeitanbieter: `opencode`
- Go-Laufzeitanbieter: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Schlüssel)

- Anbieter: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` als Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Legacy-OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder Legacy-`cached_content`), um einen nativen
  `cachedContents/...`-Handle des Anbieters weiterzuleiten; Gemini-Cache-Treffer erscheinen in OpenClaw als `cacheRead`

### Google Vertex und Gemini CLI

- Anbieter: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Nutzer haben von Einschränkungen ihres Google-Kontos nach der Verwendung von Drittanbieter-Clients berichtet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein unkritisches Konto, wenn Sie sich dafür entscheiden.
- Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Sie fügen **keine** Client-ID und kein Secret in `openclaw.json` ein. Der CLI-Login-Ablauf speichert
    Tokens in Auth-Profilen auf dem Gateway-Host.
  - Wenn Anfragen nach dem Login fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; Usage greift auf
    `stats` zurück, wobei `stats.cached` in OpenClaw zu `cacheRead` normalisiert wird.

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
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Anbieter: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog wird mit `kilocode/kilo/auto` ausgeliefert; die Live-
  Erkennung über `https://api.kilo.ai/api/gateway/models` kann den Laufzeit-
  Katalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` wird von Kilo Gateway verwaltet,
  nicht in OpenClaw fest codiert.

Siehe [/providers/kilocode](/de/providers/kilocode) für Details zur Einrichtung.

### Andere gebündelte Anbieter-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodelle: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- OpenClaw wendet die dokumentierten App-Attribution-Header von OpenRouter nur an, wenn
  die Anfrage tatsächlich `openrouter.ai` als Ziel hat
- OpenRouter-spezifische Anthropic-`cache_control`-Marker werden ebenfalls nur für
  verifizierte OpenRouter-Routen gesetzt, nicht für beliebige Proxy-URLs
- OpenRouter bleibt auf dem proxyartigen OpenAI-kompatiblen Pfad, daher wird
  native nur-OpenAI-Anfrageformung (`serviceTier`, Responses-`store`,
  Prompt-Cache-Hinweise, OpenAI-Reasoning-kompatible Payloads) nicht weitergeleitet
- Auf Gemini basierende OpenRouter-Refs behalten nur die Bereinigung von Proxy-Gemini-Thought-Signatures;
  native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Auf Gemini basierende Kilo-Refs behalten denselben Pfad zur Bereinigung von Proxy-Gemini-Thought-Signatures;
  `kilocode/kilo/auto` und andere Hinweise, die Proxy-Reasoning nicht unterstützen,
  überspringen die Injektion von Proxy-Reasoning
- MiniMax: `minimax` (API-Schlüssel) und `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- Das Onboarding/API-Schlüssel-Setup von MiniMax schreibt explizite M2.7-Modell-Definitionen mit
  `input: ["text", "image"]`; der gebündelte Anbieterkatalog hält die Chat-Refs
  text-only, bis diese Anbieterkonfiguration materialisiert wird
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Beispielmodell: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` oder `KIMICODE_API_KEY`)
- Beispielmodell: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Beispielmodell: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` oder `DASHSCOPE_API_KEY`)
- Beispielmodell: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Beispielmodell: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Beispielmodelle: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Beispielmodell: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Beispielmodell: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Beispielmodell: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Beispielmodell: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Native gebündelte xAI-Anfragen verwenden den xAI-Responses-Pfad
  - `/fast` oder `params.fastMode: true` schreiben `grok-3`, `grok-3-mini`,
    `grok-4` und `grok-4-0709` zu ihren `*-fast`-Varianten um
  - `tool_stream` ist standardmäßig aktiviert; setzen Sie
    `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
    dies zu deaktivieren
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Beispielmodell: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - GLM-Modelle auf Cerebras verwenden die IDs `zai-glm-4.7` und `zai-glm-4.6`.
  - OpenAI-kompatible Basis-URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Beispielmodell für Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Siehe [Hugging Face (Inference)](/de/providers/huggingface).

## Anbieter über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Anbieter oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Anbieter-Plugins veröffentlichen bereits einen Standardkatalog.
Verwenden Sie explizite Einträge `models.providers.<id>` nur, wenn Sie die
Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Anbieter-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Anbieter
und fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie
die Basis-URL oder Modellmetadaten überschreiben müssen:

- Anbieter: `moonshot`
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

Legacy-`kimi/k2p5` wird weiterhin als kompatible Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet Zugriff auf Doubao und andere Modelle in China.

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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `volcengine/*`
wird gleichzeitig registriert.

In Modellauswahlen für Onboarding/Konfiguration bevorzugt die Volcengine-Auth-Auswahl sowohl
Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind,
greift OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
anbieterspezifische Auswahl anzuzeigen.

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

### BytePlus (international)

BytePlus ARK bietet internationalen Nutzern Zugriff auf dieselben Modelle wie Volcano Engine.

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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `byteplus/*`
wird gleichzeitig registriert.

In Modellauswahlen für Onboarding/Konfiguration bevorzugt die BytePlus-Auth-Auswahl sowohl
Zeilen `byteplus/*` als auch `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind,
greift OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
anbieterspezifische Auswahl anzuzeigen.

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

Synthetic stellt Anthropic-kompatible Modelle hinter dem Anbieter `synthetic` bereit:

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
- MiniMax API-Schlüssel (Global): `--auth-choice minimax-global-api`
- MiniMax API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurations-Snippets.

Auf MiniMax' Anthropic-kompatiblem Streaming-Pfad deaktiviert OpenClaw Thinking standardmäßig,
es sei denn, Sie setzen es explizit, und `/fast on` schreibt
`MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.

Aufteilung der anbietereigenen Fähigkeiten:

- Standardwerte für Text/Chat bleiben auf `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist anbietereigenes `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Websuche bleibt auf Anbieter-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Anbieter-Plugin ausgeliefert und verwendet die native API:

- Anbieter: `lmstudio`
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

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit
`OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Anbieter-Plugin fügt Ollama direkt zu
`openclaw onboard` und der Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/lokalen Modus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Anbieter-Plugin für lokale/selbstgehostete OpenAI-kompatible
Server ausgeliefert:

- Anbieter: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für die Auto-Erkennung anzumelden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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

SGLang wird als gebündeltes Anbieter-Plugin für schnelle selbstgehostete
OpenAI-kompatible Server ausgeliefert:

- Anbieter: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für die Auto-Erkennung anzumelden (jeder Wert funktioniert, wenn Ihr Server keine
Authentifizierung erzwingt):

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
- Empfohlen: Setzen Sie explizite Werte, die zu Ihren Proxy-/Modellgrenzen passen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) setzt OpenClaw `compat.supportsDeveloperRole: false` zwangsweise, um Provider-400-Fehler für nicht unterstützte `developer`-Rollen zu vermeiden.
- Proxyartige OpenAI-kompatible Routen überspringen außerdem native nur-OpenAI-Anfrageformung:
  kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, keine
  OpenAI-Reasoning-kompatible Payload-Formung und keine versteckten OpenClaw-Attribution-
  Header.
- Wenn `baseUrl` leer ist/weggelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
- Zur Sicherheit wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten trotzdem überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [/gateway/configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Models](/de/concepts/models) — Modellkonfiguration und Aliase
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Modellkonfigurationsschlüssel
- [Providers](/de/providers) — Einrichtungsanleitungen pro Anbieter
