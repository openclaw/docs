---
read_when:
    - Sie benötigen eine Provider-für-Provider-Referenz zur Modelleinrichtung
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
summary: Übersicht über Modell-Provider mit Beispielkonfigurationen + CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-04-06T03:08:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e4b82e07221018a723279d309e245bb4023bc06e64b3c910ef2cae3dfa2599
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modell-Provider

Diese Seite behandelt **LLM-/Modell-Provider** (keine Chat-Kanäle wie WhatsApp/Telegram).
Regeln zur Modellauswahl finden Sie unter [/concepts/models](/de/concepts/models).

## Schnelle Regeln

- Modell-Referenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` festlegen, wird dies zur Allowlist.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Fallback-Laufzeitregeln, Cooldown-Sonden und die Persistenz von Sitzungsüberschreibungen
  sind in [/concepts/model-failover](/de/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten;
  `models.providers.*.models[].contextTokens` ist die effektive Laufzeitobergrenze.
- Provider-Plugins können Modellkataloge über `registerProvider({ catalog })` injizieren;
  OpenClaw führt diese Ausgabe in `models.providers` zusammen, bevor
  `models.json` geschrieben wird.
- Provider-Manifeste können `providerAuthEnvVars` deklarieren, damit generische
  umgebungsvariablenbasierte Auth-Sonden die Plugin-Laufzeit nicht laden müssen. Die verbleibende Kern-Abbildung
  der Umgebungsvariablen ist jetzt nur noch für Nicht-Plugin-/Kern-Provider und einige generische Vorrangfälle
  wie Anthropic-Onboarding mit API-Schlüssel zuerst vorgesehen.
- Provider-Plugins können auch das Laufzeitverhalten des Providers besitzen über
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
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` und
  `onModelSelected`.
- Hinweis: Laufzeit-`capabilities` von Providern sind gemeinsame Runner-Metadaten (Provider-
  Familie, Besonderheiten bei Transkripten/Tooling, Transport-/Cache-Hinweise). Das ist nicht dasselbe
  wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model),
  das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).

## Plugin-eigenes Provider-Verhalten

Provider-Plugins können jetzt den Großteil der provider-spezifischen Logik besitzen, während OpenClaw
die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Der Provider besitzt Onboarding-/Login-
  Abläufe für `openclaw onboard`, `openclaw models auth` und Headless-Setup
- `wizard.setup` / `wizard.modelPicker`: Der Provider besitzt Beschriftungen für Auth-Auswahl,
  veraltete Aliasse, Hinweise zur Onboarding-Allowlist und Setup-Einträge in Onboarding-/Modell-Pickern
- `catalog`: Der Provider erscheint in `models.providers`
- `normalizeModelId`: Der Provider normalisiert veraltete/Vorschau-Modell-IDs vor
  Lookup oder Kanonisierung
- `normalizeTransport`: Der Provider normalisiert Transportfamilien-`api` / `baseUrl`
  vor der generischen Modellassemblierung; OpenClaw prüft zuerst den passenden Provider,
  dann andere Hook-fähige Provider-Plugins, bis eines den
  Transport tatsächlich ändert
- `normalizeConfig`: Der Provider normalisiert die Konfiguration `models.providers.<id>`, bevor
  die Laufzeit sie verwendet; OpenClaw prüft zuerst den passenden Provider, dann andere
  Hook-fähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein
  Provider-Hook die Konfiguration umschreibt, normalisieren gebündelte Hilfen der Google-Familie weiterhin
  unterstützte Google-Provider-Einträge.
- `applyNativeStreamingUsageCompat`: Der Provider wendet endpointgesteuerte native Streaming-Usage-Kompatibilitäts-Umschreibungen für Konfigurations-Provider an
- `resolveConfigApiKey`: Der Provider löst Env-Marker-Auth für Konfigurations-Provider auf,
  ohne das vollständige Laden der Laufzeit-Auth zu erzwingen. `amazon-bedrock` besitzt hier ebenfalls einen
  eingebauten AWS-Env-Marker-Resolver, obwohl die Bedrock-Laufzeit-Auth die Standardkette des AWS SDK verwendet.
- `resolveSyntheticAuth`: Der Provider kann lokale/self-hosted oder andere
  konfigurationsgestützte Auth-Verfügbarkeit bereitstellen, ohne Klartext-Geheimnisse zu persistieren
- `shouldDeferSyntheticProfileAuth`: Der Provider kann gespeicherte synthetische Profil-
  Platzhalter als niedriger priorisiert als env-/konfigurationsgestützte Auth markieren
- `resolveDynamicModel`: Der Provider akzeptiert Modell-IDs, die im lokalen
  statischen Katalog noch nicht vorhanden sind
- `prepareDynamicModel`: Der Provider benötigt eine Metadatenaktualisierung, bevor die dynamische
  Auflösung erneut versucht wird
- `normalizeResolvedModel`: Der Provider benötigt Umschreibungen für Transport oder Basis-URL
- `contributeResolvedModelCompat`: Der Provider steuert Kompatibilitäts-Flags für seine
  Vendor-Modelle bei, selbst wenn sie über einen anderen kompatiblen Transport ankommen
- `capabilities`: Der Provider veröffentlicht Besonderheiten bei Transkripten/Tooling/Provider-Familie
- `normalizeToolSchemas`: Der Provider bereinigt Tool-Schemas, bevor der eingebettete
  Runner sie sieht
- `inspectToolSchemas`: Der Provider stellt transportspezifische Schemawarnungen
  nach der Normalisierung bereit
- `resolveReasoningOutputMode`: Der Provider wählt native versus getaggte
  Reasoning-Output-Verträge
- `prepareExtraParams`: Der Provider setzt Standardwerte oder normalisiert pro Modell Request-Parameter
- `createStreamFn`: Der Provider ersetzt den normalen Stream-Pfad durch einen vollständig
  benutzerdefinierten Transport
- `wrapStreamFn`: Der Provider wendet Kompatibilitäts-Wrapper für Request-Header/Body/Modell an
- `resolveTransportTurnState`: Der Provider liefert native Transport-
  Header oder Metadaten pro Turn
- `resolveWebSocketSessionPolicy`: Der Provider liefert native WebSocket-Sitzungs-
  Header oder eine Session-Cool-down-Richtlinie
- `createEmbeddingProvider`: Der Provider besitzt das Verhalten für Speicher-Embeddings, wenn es
  besser zum Provider-Plugin als zum Kern-Switchboard für Embeddings gehört
- `formatApiKey`: Der Provider formatiert gespeicherte Auth-Profile in den Laufzeit-
  `apiKey`-String, den der Transport erwartet
- `refreshOAuth`: Der Provider besitzt die OAuth-Aktualisierung, wenn die gemeinsamen `pi-ai`-
  Aktualisierer nicht ausreichen
- `buildAuthDoctorHint`: Der Provider hängt Reparaturhinweise an, wenn das OAuth-Refresh
  fehlschlägt
- `matchesContextOverflowError`: Der Provider erkennt provider-spezifische
  Context-Window-Overflow-Fehler, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Der Provider ordnet provider-spezifische rohe Transport-/API-
  Fehler Failover-Gründen wie Rate Limit oder Überlastung zu
- `isCacheTtlEligible`: Der Provider entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Der Provider ersetzt den generischen Auth-Store-Fehler
  durch einen provider-spezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Der Provider blendet veraltete Upstream-Zeilen aus und kann einen
  vendor-eigenen Fehler für direkte Auflösungsfehler zurückgeben
- `augmentModelCatalog`: Der Provider fügt nach
  Discovery und Konfigurationszusammenführung synthetische/finale Katalogzeilen an
- `isBinaryThinking`: Der Provider besitzt die binäre Ein/Aus-Thinking-UX
- `supportsXHighThinking`: Der Provider aktiviert `xhigh` für ausgewählte Modelle
- `resolveDefaultThinkingLevel`: Der Provider besitzt die Standardrichtlinie für `/think` einer
  Modellfamilie
- `applyConfigDefaults`: Der Provider wendet provider-spezifische globale Standardwerte
  während der Konfigurationsmaterialisierung auf Basis von Auth-Modus, Env oder Modellfamilie an
- `isModernModelRef`: Der Provider besitzt die Zuordnung bevorzugter Live-/Smoke-Modelle
- `prepareRuntimeAuth`: Der Provider wandelt eine konfigurierte Anmeldeinformation in ein kurzlebiges
  Laufzeit-Token um
- `resolveUsageAuth`: Der Provider löst Usage-/Quota-Anmeldeinformationen für `/usage`
  und verwandte Status-/Berichtsoberflächen auf
- `fetchUsageSnapshot`: Der Provider besitzt das Abrufen/Parsen des Usage-Endpunkts, während
  der Kern weiterhin die Zusammenfassungshülle und Formatierung besitzt
- `onModelSelected`: Der Provider führt Nebenwirkungen nach der Auswahl aus, etwa
  Telemetrie oder provider-eigenes Sitzungs-Bookkeeping

Aktuelle gebündelte Beispiele:

- `anthropic`: Vorwärtskompatibler Fallback für Claude 4.6, Hinweise zur Auth-Reparatur, Abruf von Usage-
  Endpunkten, Cache-TTL-/Provider-Familien-Metadaten und auth-bewusste globale
  Konfigurationsstandardwerte
- `amazon-bedrock`: Provider-eigenes Matching von Context-Overflow und Klassifizierung von Failover-
  Gründen für Bedrock-spezifische Throttle-/Not-Ready-Fehler sowie
  die gemeinsame Replay-Familie `anthropic-by-model` für Claude-spezifische Replay-Richtlinien-
  Schutzmaßnahmen bei Anthropic-Traffic
- `anthropic-vertex`: Claude-spezifische Replay-Richtlinien-Schutzmaßnahmen für Anthropic-Message-
  Traffic
- `openrouter`: Durchgereichte Modell-IDs, Request-Wrapper, Hinweise auf Provider-Fähigkeiten,
  Bereinigung von Gemini-Thought-Signaturen bei proxied Gemini-Traffic, Proxy-
  Reasoning-Injektion über die Stream-Familie `openrouter-thinking`,
  Weiterleitung von Routing-Metadaten und Cache-TTL-Richtlinie
- `github-copilot`: Onboarding/Geräte-Login, vorwärtskompatibler Modell-Fallback,
  Claude-Thinking-Transkript-Hinweise, Laufzeit-Token-Austausch und Abruf von Usage-Endpunkten
- `openai`: Vorwärtskompatibler Fallback für GPT-5.4, direkte OpenAI-Transport-
  Normalisierung, Codex-bewusste Hinweise bei fehlender Auth, Spark-Unterdrückung, synthetische
  OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Modell-Richtlinie, Alias-Normalisierung für Usage-Tokens
  (`input` / `output` und `prompt` / `completion`-Familien), die
  gemeinsame Stream-Familie `openai-responses-defaults` für native OpenAI-/Codex-
  Wrapper, Provider-Familien-Metadaten, gebündelte Registrierung eines Image-Generation-Providers
  für `gpt-image-1` und gebündelte Registrierung eines Video-Generation-Providers
  für `sora-2`
- `google`: Vorwärtskompatibler Fallback für Gemini 3.1, native Gemini-Replay-
  Validierung, Sanitisierung von Bootstrap-Replay, getaggter Reasoning-Output-Modus,
  modernes Modell-Matching, gebündelte Registrierung eines Image-Generation-Providers für
  Gemini-Image-Preview-Modelle und gebündelte Registrierung eines Video-Generation-Providers
  für Veo-Modelle
- `moonshot`: Gemeinsamer Transport, plugin-eigene Normalisierung von Thinking-Payloads
- `kilocode`: Gemeinsamer Transport, plugin-eigene Request-Header, Normalisierung von Reasoning-Payloads,
  Bereinigung von Proxy-Gemini-Thought-Signaturen und Cache-TTL-
  Richtlinie
- `zai`: Vorwärtskompatibler Fallback für GLM-5, Standardwerte für `tool_stream`, Cache-TTL-
  Richtlinie, Richtlinie für binäres Thinking/Live-Modelle sowie Usage-Auth + Abruf von Quoten;
  unbekannte `glm-5*`-IDs werden aus der gebündelten Vorlage `glm-4.7` synthetisiert
- `xai`: Native Normalisierung des Responses-Transports, Umschreibungen von `/fast`-Aliasen für
  Grok-Fast-Varianten, standardmäßiges `tool_stream`, xAI-spezifische Bereinigung von Tool-Schemas /
  Reasoning-Payloads und gebündelte Registrierung eines Video-Generation-Providers
  für `grok-imagine-video`
- `mistral`: plugin-eigene Fähigkeitsmetadaten
- `opencode` und `opencode-go`: plugin-eigene Fähigkeitsmetadaten plus
  Bereinigung von Proxy-Gemini-Thought-Signaturen
- `alibaba`: plugin-eigener Video-Generation-Katalog für direkte Wan-Modell-Refs
  wie `alibaba/wan2.6-t2v`
- `byteplus`: plugin-eigene Kataloge plus gebündelte Registrierung eines Video-Generation-Providers
  für Seedance-Text-zu-Video-/Bild-zu-Video-Modelle
- `fal`: gebündelte Registrierung eines Video-Generation-Providers für gehostete Drittanbieter-
  Registrierung eines Image-Generation-Providers für FLUX-Bildmodelle plus gebündelte
  Registrierung eines Video-Generation-Providers für gehostete Drittanbieter-Videomodelle
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` und `volcengine`:
  nur plugin-eigene Kataloge
- `qwen`: plugin-eigene Kataloge für Textmodelle plus gemeinsame
  Registrierungen von Media-Understanding- und Video-Generation-Providern für seine
  multimodalen Oberflächen; die Qwen-Videoerzeugung nutzt die Standard-DashScope-Video-
  Endpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `runway`: plugin-eigene Registrierung eines Video-Generation-Providers für native
  aufgabenbasierte Runway-Modelle wie `gen4.5`
- `minimax`: plugin-eigene Kataloge, gebündelte Registrierung eines Video-Generation-Providers
  für Hailuo-Videomodelle, gebündelte Registrierung eines Image-Generation-Providers
  für `image-01`, hybride Auswahl von Anthropic/OpenAI-Replay-Richtlinien sowie
  Usage-Auth-/Snapshot-Logik
- `together`: plugin-eigene Kataloge plus gebündelte Registrierung eines Video-Generation-Providers
  für Wan-Videomodelle
- `xiaomi`: plugin-eigene Kataloge plus Usage-Auth-/Snapshot-Logik

Das gebündelte `openai`-Plugin besitzt jetzt beide Provider-IDs: `openai` und
`openai-codex`.

Das deckt Provider ab, die noch in die normalen Transporte von OpenClaw passen. Ein Provider,
der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefergehende
Erweiterungsoberfläche.

## Rotation von API-Schlüsseln

- Unterstützt generische Provider-Rotation für ausgewählte Provider.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Provider wird `GOOGLE_API_KEY` zusätzlich als Fallback einbezogen.
- Die Reihenfolge der Schlüsselauswahl wahrt die Priorität und dedupliziert Werte.
- Requests werden nur bei Antworten mit Rate-Limit mit dem nächsten Schlüssel erneut versucht (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Usage-Limit-Meldungen).
- Fehler ohne Rate-Limit schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der finale Fehler aus dem letzten Versuch zurückgegeben.

## Eingebaute Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Provider erfordern **keine**
`models.providers`-Konfiguration; setzen Sie einfach Auth + wählen Sie ein Modell.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das Warm-up für OpenAI Responses WebSocket ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Requests `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie eine explizite Stufe statt des gemeinsamen `/fast`-Toggles möchten
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) gelten nur für nativen OpenAI-Traffic zu `api.openai.com`, nicht
  für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-Kompatibilitäts-Payload-Formung bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil die Live-OpenAI-API es ablehnt; Spark wird als nur für Codex behandelt

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
- Direkte öffentliche Anthropic-Requests unterstützen auch den gemeinsamen `/fast`-Toggle und `params.fastMode`, einschließlich per API-Schlüssel und OAuth authentifiziertem Traffic an `api.anthropic.com`; OpenClaw ordnet dies Anthropic-`service_tier` zu (`auto` vs. `standard_only`)
- Hinweis zur Abrechnung: Für Anthropic in OpenClaw ist die praktische Aufteilung **API key** oder **Claude subscription with Extra Usage**. Anthropic informierte OpenClaw-Benutzer am **4. April 2026 um 12:00 PM PT / 8:00 PM BST**, dass der **OpenClaw**-Claude-Login-Pfad als Nutzung eines Drittanbieter-Harness gilt und **Extra Usage** erfordert, die getrennt vom Abonnement abgerechnet wird. Unsere lokalen Reproduktionen zeigen außerdem, dass sich die OpenClaw-identifizierende Prompt-Zeichenfolge auf dem Anthropic-SDK- + API-key-Pfad nicht reproduzieren lässt.
- Anthropic-Setup-Token ist wieder als veralteter/manueller OpenClaw-Pfad verfügbar. Verwenden Sie ihn mit der Erwartung, dass Anthropic OpenClaw-Benutzern mitgeteilt hat, dass dieser Pfad **Extra Usage** erfordert.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Beispielmodell: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Der Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Requests weitergeleitet (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) werden nur bei nativem Codex-Traffic an
  `chatgpt.com/backend-api` angehängt, nicht bei generischen OpenAI-kompatiblen Proxys
- Verwendet denselben `/fast`-Toggle und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von der Berechtigung
- `openai-codex/gpt-5.4` behält natives `contextWindow = 1050000` und ein standardmäßiges Laufzeit-`contextTokens = 272000`; überschreiben Sie die Laufzeitobergrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.

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

- [Qwen Cloud](/de/providers/qwen): Qwen-Cloud-Provider-Oberfläche plus Alibaba-DashScope- und Coding-Plan-Endpunktzuordnung
- [MiniMax](/de/providers/minimax): OAuth- oder API-key-Zugriff für MiniMax Coding Plan
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

### Google Gemini (API-Schlüssel)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` als Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Veraltete OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder das veraltete `cached_content`), um ein provider-natives
  Handle `cachedContents/...` weiterzuleiten; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex

- Provider: `google-vertex`
- Auth: gcloud ADC
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; Usage fällt auf
    `stats` zurück, wobei `stats.cached` in OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Beispielmodell: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog liefert `kilocode/kilo/auto`; die Live-
  Discovery unter `https://api.kilo.ai/api/gateway/models` kann den Laufzeit-
  Katalog weiter erweitern.
- Das exakte Upstream-Routing hinter `kilocode/kilo/auto` liegt bei Kilo Gateway
  und ist nicht fest in OpenClaw codiert.

Einrichtungsdetails finden Sie unter [/providers/kilocode](/de/providers/kilocode).

### Andere gebündelte Provider-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodell: `openrouter/auto`
- OpenClaw wendet die dokumentierten App-Attributions-Header von OpenRouter nur an, wenn
  sich die Anfrage tatsächlich an `openrouter.ai` richtet
- OpenRouter-spezifische Anthropic-`cache_control`-Marker sind ebenfalls auf
  verifizierte OpenRouter-Routen beschränkt, nicht auf beliebige Proxy-URLs
- OpenRouter verbleibt auf dem proxyartigen OpenAI-kompatiblen Pfad, daher werden native
  nur-OpenAI-Request-Formungen (`serviceTier`, Responses-`store`,
  Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilitäts-Payloads) nicht weitergeleitet
- Gemini-gestützte OpenRouter-Refs behalten nur die Bereinigung von Proxy-Gemini-Thought-Signaturen;
  native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Gemini-gestützte Kilo-Refs behalten denselben Bereinigungspfad für Proxy-Gemini-Thought-Signaturen; `kilocode/kilo/auto` und andere Hinweise auf nicht unterstütztes Proxy-Reasoning überspringen die Injektion von Proxy-Reasoning
- MiniMax: `minimax` (API-Schlüssel) und `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- MiniMax-Onboarding/API-key-Setup schreibt explizite M2.7-Modelldefinitionen mit
  `input: ["text", "image"]`; der gebündelte Provider-Katalog hält die Chat-Refs
  text-only, bis diese Provider-Konfiguration materialisiert ist
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Beispielmodell: `moonshot/kimi-k2.5`
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
  - Native gebündelte xAI-Requests verwenden den xAI-Responses-Pfad
  - `/fast` oder `params.fastMode: true` schreiben `grok-3`, `grok-3-mini`,
    `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um
  - `tool_stream` ist standardmäßig aktiviert; setzen Sie
    `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
    es zu deaktivieren
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Beispielmodell: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - GLM-Modelle auf Cerebras verwenden die IDs `zai-glm-4.7` und `zai-glm-4.6`.
  - OpenAI-kompatible Basis-URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Beispielmodell für Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Siehe [Hugging Face (Inference)](/de/providers/huggingface).

## Provider über `models.providers` (benutzerdefinierte/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog.
Verwenden Sie explizite Einträge `models.providers.<id>` nur dann, wenn Sie die
Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Provider-Plugin ausgeliefert. Verwenden Sie standardmäßig den eingebauten Provider
und fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie
die Basis-URL oder Modellmetadaten überschreiben müssen:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi-K2-Modell-IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
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

Volcano Engine (火山引擎) bietet Zugang zu Doubao und anderen Modellen in China.

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

In den Pickern für Onboarding-/Modellkonfiguration bevorzugt die Volcengine-Auth-Auswahl sowohl
`volcengine/*`- als auch `volcengine-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, statt einen leeren
provider-bezogenen Picker anzuzeigen.

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

BytePlus ARK bietet internationalen Benutzern Zugang zu denselben Modellen wie Volcano Engine.

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

In den Pickern für Onboarding-/Modellkonfiguration bevorzugt die BytePlus-Auth-Auswahl sowohl
`byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, statt einen leeren
provider-bezogenen Picker anzuzeigen.

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
- MiniMax API-Schlüssel (Global): `--auth-choice minimax-global-api`
- MiniMax API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Einrichtungsdetails, Modelloptionen und Konfigurations-Snippets finden Sie unter [/providers/minimax](/de/providers/minimax).

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig,
sofern Sie es nicht explizit setzen, und `/fast on` schreibt
`MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.

Aufteilung plugin-eigener Fähigkeiten:

- Standards für Text/Chat bleiben auf `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist plugin-eigenes `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Websuche bleibt auf Provider-ID `minimax`

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und nutzt die native API von Ollama:

- Provider: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama installieren, dann ein Modell herunterladen:
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
`OLLAMA_API_KEY` anmelden, und das gebündelte Provider-Plugin fügt Ollama direkt zu
`openclaw onboard` und dem Modell-Picker hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/self-hosted OpenAI-kompatible
Server ausgeliefert:

- Provider: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für Auto-Discovery anzumelden (jeder Wert funktioniert, wenn Ihr Server keine Auth erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie dies durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Einzelheiten finden Sie unter [/providers/vllm](/de/providers/vllm).

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle self-hosted
OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für Auto-Discovery anzumelden (jeder Wert funktioniert, wenn Ihr Server keine
Auth erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie dies durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Einzelheiten finden Sie unter [/providers/sglang](/de/providers/sglang).

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
        apiKey: "LMSTUDIO_KEY",
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

- Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfehlung: Setzen Sie explizite Werte, die Ihren Proxy-/Modellgrenzen entsprechen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist), erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler für nicht unterstützte `developer`-Rollen zu vermeiden.
- Proxyartige OpenAI-kompatible Routen überspringen ebenfalls native nur-OpenAI-Request-
  Formung: kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, keine
  OpenAI-Reasoning-Kompatibilitäts-Payload-Formung und keine versteckten OpenClaw-
  Attributions-Header.
- Wenn `baseUrl` leer ist/fehlt, behält OpenClaw das Standard-OpenAI-Verhalten bei (das zu `api.openai.com` aufgelöst wird).
- Zur Sicherheit wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten trotzdem überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [/gateway/configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Models](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten und Retry-Verhalten
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Konfigurationsschlüssel für Modelle
- [Providers](/de/providers) — Einrichtungsanleitungen pro Provider
