---
read_when:
    - Sie benötigen eine anbieterweise Referenz für die Modelleinrichtung.
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modellanbieter.
summary: Übersicht der Modellanbieter mit Beispielkonfigurationen + CLI-Abläufen
title: Modellanbieter
x-i18n:
    generated_at: "2026-04-11T02:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 910ea7895e74c03910757d9d3e02825754b779b204eca7275b28422647ed0151
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modellanbieter

Diese Seite behandelt **LLM-/Modellanbieter** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Regeln zur Modellauswahl finden Sie unter [/concepts/models](/de/concepts/models).

## Schnelle Regeln

- Modell-Referenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` festlegen, wird daraus die Allowlist.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Fallback-Laufzeitregeln, Cooldown-Sondierungen und Sitzungsüberschreibungs-Persistenz sind in [/concepts/model-failover](/de/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten;
  `models.providers.*.models[].contextTokens` ist die effektive Laufzeitobergrenze.
- Anbieter-Plugins können Modellkataloge über `registerProvider({ catalog })` einfügen;
  OpenClaw führt diese Ausgabe in `models.providers` zusammen, bevor
  `models.json` geschrieben wird.
- Anbieter-Manifeste können `providerAuthEnvVars` und
  `providerAuthAliases` deklarieren, damit generische umgebungsvariablenbasierte Auth-Sondierungen und Anbietervarianten
  die Plugin-Laufzeit nicht laden müssen. Die verbleibende Core-Zuordnung von Umgebungsvariablen dient jetzt
  nur noch Nicht-Plugin-/Core-Anbietern und einigen generischen Vorrangfällen wie
  Anthropic-Onboarding mit API-Schlüssel zuerst.
- Anbieter-Plugins können auch das Laufzeitverhalten des Anbieters besitzen über
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, und
  `onModelSelected`.
- Hinweis: Laufzeit-`capabilities` des Anbieters sind gemeinsame Runner-Metadaten (Anbieterfamilie, Eigenheiten bei Transkripten/Tools, Transport-/Cache-Hinweise). Sie sind nicht dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model),
  das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
- Der gebündelte `codex`-Anbieter ist mit dem gebündelten Codex-Agent-Harness gekoppelt.
  Verwenden Sie `codex/gpt-*`, wenn Sie Codex-eigenes Login, Modellerkennung, native
  Thread-Fortsetzung und App-Server-Ausführung möchten. Normale `openai/gpt-*`-Referenzen verwenden weiterhin
  den OpenAI-Anbieter und den normalen OpenClaw-Anbietertransport.
  Reine Codex-Bereitstellungen können den automatischen PI-Fallback deaktivieren mit
  `agents.defaults.embeddedHarness.fallback: "none"`; siehe
  [Codex Harness](/de/plugins/codex-harness).

## Plugin-eigenes Anbieterverhalten

Anbieter-Plugins können jetzt den Großteil der anbieterspezifischen Logik besitzen, während OpenClaw
die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Anbieter besitzt Onboarding-/Login-Abläufe
  für `openclaw onboard`, `openclaw models auth` und die Headless-Einrichtung
- `wizard.setup` / `wizard.modelPicker`: Anbieter besitzt Beschriftungen für Auth-Auswahlen,
  Legacy-Aliasse, Hinweise zur Onboarding-Allowlist und Einrichtungseinträge in Onboarding-/Modellauswahlen
- `catalog`: Anbieter erscheint in `models.providers`
- `normalizeModelId`: Anbieter normalisiert Legacy-/Vorschau-Modell-IDs vor
  Lookup oder Kanonisierung
- `normalizeTransport`: Anbieter normalisiert `api` / `baseUrl` der Transportfamilie
  vor dem generischen Modellaufbau; OpenClaw prüft zuerst den passenden Anbieter,
  dann andere Hook-fähige Anbieter-Plugins, bis eines den
  Transport tatsächlich ändert
- `normalizeConfig`: Anbieter normalisiert die Konfiguration `models.providers.<id>` vor
  der Nutzung durch die Laufzeit; OpenClaw prüft zuerst den passenden Anbieter, dann andere
  Hook-fähige Anbieter-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein
  Anbieter-Hook die Konfiguration umschreibt, normalisieren gebündelte Helfer der Google-Familie weiterhin
  unterstützte Google-Anbietereinträge.
- `applyNativeStreamingUsageCompat`: Anbieter wendet endpointgesteuerte native Streaming-Nutzungs-Kompatibilitäts-Umschreibungen für Konfigurationsanbieter an
- `resolveConfigApiKey`: Anbieter löst env-marker-Authentifizierung für Konfigurationsanbieter auf,
  ohne das vollständige Laden der Laufzeit-Authentifizierung zu erzwingen. `amazon-bedrock` hat hier auch einen
  integrierten AWS-env-marker-Resolver, obwohl die Bedrock-Laufzeit-Authentifizierung
  die Standardkette des AWS SDK verwendet.
- `resolveSyntheticAuth`: Anbieter kann lokale/selbstgehostete oder andere
  konfigurationsgestützte Authentifizierungsverfügbarkeit offenlegen, ohne Klartextgeheimnisse zu speichern
- `shouldDeferSyntheticProfileAuth`: Anbieter kann gespeicherte synthetische Profil-
  Platzhalter als niedriger priorisiert als env-/konfigurationsgestützte Authentifizierung kennzeichnen
- `resolveDynamicModel`: Anbieter akzeptiert Modell-IDs, die noch nicht im lokalen
  statischen Katalog vorhanden sind
- `prepareDynamicModel`: Anbieter benötigt vor einem erneuten Versuch der
  dynamischen Auflösung eine Metadatenaktualisierung
- `normalizeResolvedModel`: Anbieter benötigt Umschreibungen von Transport oder Basis-URL
- `contributeResolvedModelCompat`: Anbieter trägt Kompatibilitätskennzeichen für seine
  Herstellermodelle bei, selbst wenn sie über einen anderen kompatiblen Transport ankommen
- `capabilities`: Anbieter veröffentlicht Eigenheiten bei Transkripten/Tools/Anbieterfamilien
- `normalizeToolSchemas`: Anbieter bereinigt Toolschemata, bevor der eingebettete
  Runner sie sieht
- `inspectToolSchemas`: Anbieter zeigt transportspezifische Schemawarnungen
  nach der Normalisierung an
- `resolveReasoningOutputMode`: Anbieter wählt native oder getaggte
  Verträge für Reasoning-Ausgaben
- `prepareExtraParams`: Anbieter setzt Standardwerte oder normalisiert anfragespezifische Parameter pro Modell
- `createStreamFn`: Anbieter ersetzt den normalen Stream-Pfad durch einen vollständig
  benutzerdefinierten Transport
- `wrapStreamFn`: Anbieter wendet Kompatibilitäts-Wrapper für Anfrage-Header/Body/Modell an
- `resolveTransportTurnState`: Anbieter liefert native
  transportbezogene Header oder Metadaten pro Turn
- `resolveWebSocketSessionPolicy`: Anbieter liefert native WebSocket-Sitzungs-
  Header oder eine Sitzungs-Cooldown-Richtlinie
- `createEmbeddingProvider`: Anbieter besitzt das Verhalten für Memory-Embeddings, wenn es
  beim Anbieter-Plugin statt beim Core-Embedding-Switchboard liegen soll
- `formatApiKey`: Anbieter formatiert gespeicherte Auth-Profile in den zur Laufzeit
  vom Transport erwarteten `apiKey`-String
- `refreshOAuth`: Anbieter besitzt die OAuth-Aktualisierung, wenn die gemeinsamen `pi-ai`-
  Aktualisierer nicht ausreichen
- `buildAuthDoctorHint`: Anbieter fügt Reparaturhinweise an, wenn die OAuth-Aktualisierung
  fehlschlägt
- `matchesContextOverflowError`: Anbieter erkennt anbieterspezifische
  Fehler bei Überschreitung des Kontextfensters, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Anbieter ordnet anbieterspezifische rohe Transport-/API-
  Fehler Failover-Gründen wie Ratenbegrenzung oder Überlastung zu
- `isCacheTtlEligible`: Anbieter entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Anbieter ersetzt den generischen Fehler des Auth-Speichers
  durch einen anbieterspezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Anbieter blendet veraltete Upstream-Zeilen aus und kann einen
  herstellereigenen Fehler für direkte Auflösungsfehler zurückgeben
- `augmentModelCatalog`: Anbieter hängt synthetische/finale Katalogzeilen nach
  Erkennung und Konfigurationszusammenführung an
- `isBinaryThinking`: Anbieter besitzt die UX für binäres Ein-/Aus-Denken
- `supportsXHighThinking`: Anbieter aktiviert `xhigh` für ausgewählte Modelle
- `resolveDefaultThinkingLevel`: Anbieter besitzt die standardmäßige `/think`-Richtlinie für eine
  Modellfamilie
- `applyConfigDefaults`: Anbieter wendet anbieterspezifische globale Standardwerte
  während der Konfigurationsmaterialisierung basierend auf Auth-Modus, Umgebung oder Modellfamilie an
- `isModernModelRef`: Anbieter besitzt die Zuordnung bevorzugter Modelle für Live-/Smoke-Tests
- `prepareRuntimeAuth`: Anbieter wandelt konfigurierte Anmeldedaten in ein kurzlebiges
  Laufzeit-Token um
- `resolveUsageAuth`: Anbieter löst Nutzungs-/Kontingent-Anmeldedaten für `/usage`
  und verwandte Status-/Berichtsoberflächen auf
- `fetchUsageSnapshot`: Anbieter besitzt das Abrufen/Parsen des Nutzungsendpunkts, während
  der Core weiterhin die Zusammenfassungs-Hülle und Formatierung besitzt
- `onModelSelected`: Anbieter führt Nebenwirkungen nach der Modellauswahl aus, z. B.
  Telemetrie oder anbietereigene Sitzungsbuchführung

Aktuelle gebündelte Beispiele:

- `anthropic`: Claude-4.6-Vorwärtskompatibilitäts-Fallback, Hinweise zur Auth-Reparatur, Abrufen des Nutzungsendpunkts, Cache-TTL-/Anbieterfamilien-Metadaten und authentifizierungsabhängige globale Konfigurationsstandardwerte
- `amazon-bedrock`: anbietereigene Erkennung von Kontextüberläufen und Klassifizierung von Failover-Gründen für Bedrock-spezifische Throttle-/Nicht-bereit-Fehler sowie die gemeinsame `anthropic-by-model`-Replay-Familie für Replay-Richtlinienschutz nur für Claude bei Anthropic-Datenverkehr
- `anthropic-vertex`: Replay-Richtlinienschutz nur für Claude bei Anthropic-Message-Datenverkehr
- `openrouter`: Durchreichung von Modell-IDs, Anfrage-Wrapper, Hinweise zu Anbieterfähigkeiten, Bereinigung von Gemini-Thought-Signatures bei proxied Gemini-Datenverkehr, Proxy-Reasoning-Injektion über die Stream-Familie `openrouter-thinking`, Weiterleitung von Routing-Metadaten und Cache-TTL-Richtlinie
- `github-copilot`: Onboarding/Geräte-Login, Vorwärtskompatibilitäts-Fallback für Modelle, Hinweise zu Claude-Thinking-Transkripten, Laufzeit-Token-Austausch und Abrufen des Nutzungsendpunkts
- `openai`: GPT-5.4-Vorwärtskompatibilitäts-Fallback, direkte OpenAI-Transport-Normalisierung, Codex-bewusste Hinweise bei fehlender Authentifizierung, Spark-Unterdrückung, synthetische OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Modell-Richtlinie, Normalisierung von Nutzungs-Token-Aliassen (`input` / `output` und `prompt` / `completion`-Familien), die gemeinsame Stream-Familie `openai-responses-defaults` für native OpenAI-/Codex-Wrapper, Anbieterfamilien-Metadaten, gebündelte Registrierung des Bildgenerierungsanbieters für `gpt-image-1` und gebündelte Registrierung des Videogenerierungsanbieters für `sora-2`
- `google` und `google-gemini-cli`: Gemini-3.1-Vorwärtskompatibilitäts-Fallback, native Gemini-Replay-Validierung, Bereinigung von Bootstrap-Replays, getaggter Reasoning-Ausgabemodus, modernes Modell-Matching, gebündelte Registrierung des Bildgenerierungsanbieters für Gemini-Image-Preview-Modelle und gebündelte Registrierung des Videogenerierungsanbieters für Veo-Modelle; Gemini CLI OAuth besitzt außerdem Tokenformatierung für Auth-Profile, Parsing von Nutzungs-Token und Abrufen des Kontingentendpunkts für Nutzungsoberflächen
- `moonshot`: gemeinsamer Transport, plugin-eigene Normalisierung der Thinking-Payload
- `kilocode`: gemeinsamer Transport, plugin-eigene Anfrage-Header, Normalisierung von Reasoning-Payloads, Bereinigung von Proxy-Gemini-Thought-Signatures und Cache-TTL-Richtlinie
- `zai`: GLM-5-Vorwärtskompatibilitäts-Fallback, Standardwerte für `tool_stream`, Cache-TTL-Richtlinie, Richtlinie für binäres Thinking-/Live-Modell sowie Nutzungs-Auth + Abruf von Kontingenten; unbekannte `glm-5*`-IDs werden aus der gebündelten Vorlage `glm-4.7` synthetisiert
- `xai`: native Responses-Transport-Normalisierung, Umschreibungen des Alias `/fast` für Grok-Fast-Varianten, Standardwert `tool_stream`, xAI-spezifische Bereinigung von Tool-Schemata / Reasoning-Payloads und gebündelte Registrierung des Videogenerierungsanbieters für `grok-imagine-video`
- `mistral`: plugin-eigene Fähigkeitsmetadaten
- `opencode` und `opencode-go`: plugin-eigene Fähigkeitsmetadaten plus Bereinigung von Proxy-Gemini-Thought-Signatures
- `alibaba`: plugin-eigener Videogenerierungskatalog für direkte Wan-Modell-Referenzen wie `alibaba/wan2.6-t2v`
- `byteplus`: plugin-eigene Kataloge plus gebündelte Registrierung des Videogenerierungsanbieters für Seedance-Text-zu-Video-/Bild-zu-Video-Modelle
- `fal`: gebündelte Registrierung des Videogenerierungsanbieters für gehostete Drittanbieter-Registrierung des Bildgenerierungsanbieters für FLUX-Bildmodelle plus gebündelte Registrierung des Videogenerierungsanbieters für gehostete Drittanbieter-Videomodelle
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`, `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` und `volcengine`: nur plugin-eigene Kataloge
- `qwen`: plugin-eigene Kataloge für Textmodelle plus gemeinsame Registrierungen von Media-Understanding- und Videogenerierungsanbietern für seine multimodalen Oberflächen; die Qwen-Videogenerierung verwendet die Standard-DashScope-Videoendpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `runway`: plugin-eigene Registrierung des Videogenerierungsanbieters für native aufgabenbasierte Runway-Modelle wie `gen4.5`
- `minimax`: plugin-eigene Kataloge, gebündelte Registrierung des Videogenerierungsanbieters für Hailuo-Videomodelle, gebündelte Registrierung des Bildgenerierungsanbieters für `image-01`, hybride Auswahl der Anthropic-/OpenAI-Replay-Richtlinie und Logik für Nutzungs-Auth/Snapshots
- `together`: plugin-eigene Kataloge plus gebündelte Registrierung des Videogenerierungsanbieters für Wan-Videomodelle
- `xiaomi`: plugin-eigene Kataloge plus Logik für Nutzungs-Auth/Snapshots

Das gebündelte Plugin `openai` besitzt jetzt beide Anbieter-IDs: `openai` und
`openai-codex`.

Das deckt Anbieter ab, die noch in die normalen Transporte von OpenClaw passen. Ein Anbieter,
der einen vollständig benutzerdefinierten Anfrage-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

## API-Schlüsselrotation

- Unterstützt generische Anbieterrotation für ausgewählte Anbieter.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Anbieter wird `GOOGLE_API_KEY` ebenfalls als Fallback einbezogen.
- Die Reihenfolge der Schlüsselauswahl bewahrt die Priorität und entfernt Duplikate.
- Anfragen werden nur bei Antworten mit Ratenbegrenzung mit dem nächsten Schlüssel erneut versucht (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Meldungen zu Nutzungslimits).
- Fehler, die keine Ratenbegrenzung sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

## Integrierte Anbieter (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Anbieter benötigen **keine**
Konfiguration unter `models.providers`; setzen Sie einfach die Authentifizierung und wählen Sie ein Modell.

### OpenAI

- Anbieter: `openai`
- Authentifizierung: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standardtransport ist `auto` (zuerst WebSocket, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das OpenAI-Responses-WebSocket-Warm-up ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie eine explizite Stufe statt des gemeinsamen Schalters `/fast` möchten
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht
  für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-kompatible Payload-Formung bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil die Live-OpenAI-API es ablehnt; Spark wird als nur Codex behandelt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Anbieter: `anthropic`
- Authentifizierung: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen ebenfalls den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich mit API-Schlüssel und OAuth authentifiziertem Datenverkehr, der an `api.anthropic.com` gesendet wird; OpenClaw ordnet dies Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Anthropic-Hinweis: Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist; daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Das Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Anbieter: `openai-codex`
- Authentifizierung: OAuth (ChatGPT)
- Beispielmodell: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Standardtransport ist `auto` (zuerst WebSocket, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Anfragen weitergereicht (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) werden nur bei nativem Codex-Datenverkehr zu
  `chatgpt.com/backend-api` angehängt, nicht bei generischen OpenAI-kompatiblen Proxys
- Nutzt denselben Schalter `/fast` und dieselbe Konfiguration `params.fastMode` wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von der Berechtigung
- `openai-codex/gpt-5.4` behält das native `contextWindow = 1050000` und eine standardmäßige Laufzeit-`contextTokens = 272000`; überschreiben Sie die Laufzeitobergrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird explizit für externe Tools/Workflows wie OpenClaw unterstützt.

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

- [Qwen Cloud](/de/providers/qwen): Qwen-Cloud-Anbieteroberfläche plus Zuordnung von Alibaba-DashScope- und Coding-Plan-Endpunkten
- [MiniMax](/de/providers/minimax): OAuth oder API-Schlüsselzugriff für MiniMax Coding Plan
- [GLM Models](/de/providers/glm): Z.AI Coding Plan oder allgemeine API-Endpunkte

### OpenCode

- Authentifizierung: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
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
- Authentifizierung: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, Fallback `GOOGLE_API_KEY` und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Legacy-OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Läufe akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder das Legacy-`cached_content`), um einen anbieterinternen
  Handle `cachedContents/...` weiterzureichen; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Anbieter: `google-vertex`, `google-gemini-cli`
- Authentifizierung: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf
- Achtung: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Nutzer haben nach der Verwendung von Drittanbieter-Clients über Einschränkungen bei Google-Konten berichtet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein unkritisches Konto, wenn Sie sich dafür entscheiden.
- Gemini-CLI-OAuth wird als Teil des gebündelten Plugins `google` ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Sie fügen **keine** Client-ID oder kein Secret in `openclaw.json` ein. Der CLI-Login-Ablauf speichert
    Tokens in Auth-Profilen auf dem Gateway-Host.
  - Wenn Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; die Nutzung fällt auf
    `stats` zurück, wobei `stats.cached` in OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Anbieter: `zai`
- Authentifizierung: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt automatisch den passenden Z.AI-Endpunkt; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Anbieter: `vercel-ai-gateway`
- Authentifizierung: `AI_GATEWAY_API_KEY`
- Beispielmodell: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Anbieter: `kilocode`
- Authentifizierung: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog enthält `kilocode/kilo/auto`; die Live-Erkennung unter
  `https://api.kilo.ai/api/gateway/models` kann den Laufzeitkatalog
  weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` liegt bei Kilo Gateway
  und ist nicht fest in OpenClaw kodiert.

Details zur Einrichtung finden Sie unter [/providers/kilocode](/de/providers/kilocode).

### Andere gebündelte Anbieter-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodell: `openrouter/auto`
- OpenClaw wendet die dokumentierten App-Attributions-Header von OpenRouter nur an, wenn
  die Anfrage tatsächlich auf `openrouter.ai` zielt
- OpenRouter-spezifische Anthropic-`cache_control`-Marker werden ebenso nur auf
  verifizierten OpenRouter-Routen aktiviert, nicht auf beliebigen Proxy-URLs
- OpenRouter bleibt auf dem Proxy-Stil-OpenAI-kompatiblen Pfad, daher werden native,
  nur für OpenAI bestimmte Anfrageformungen (`serviceTier`, Responses-`store`,
  Prompt-Cache-Hinweise, OpenAI-Reasoning-kompatible Payloads) nicht weitergeleitet
- Gemini-gestützte OpenRouter-Referenzen behalten nur die Bereinigung von Proxy-Gemini-Thought-Signatures
  bei; native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Gemini-gestützte Kilo-Referenzen behalten denselben Pfad zur Bereinigung von Proxy-Gemini-Thought-Signatures
  bei; `kilocode/kilo/auto` und andere Hinweise ohne Unterstützung für Proxy-Reasoning
  überspringen die Proxy-Reasoning-Injektion
- MiniMax: `minimax` (API-Schlüssel) und `minimax-portal` (OAuth)
- Authentifizierung: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- Das MiniMax-Onboarding bzw. die API-Schlüssel-Einrichtung schreibt explizite M2.7-Modelldefinitionen mit
  `input: ["text", "image"]`; der gebündelte Anbieterkatalog hält die Chat-Referenzen
  als nur-Text, bis diese Anbieterkonfiguration materialisiert wird
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
  - Native gebündelte xAI-Anfragen verwenden den xAI-Responses-Pfad
  - `/fast` oder `params.fastMode: true` schreiben `grok-3`, `grok-3-mini`,
    `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um
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
Verwenden Sie explizite Einträge unter `models.providers.<id>` nur dann, wenn Sie die
Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Anbieter-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Anbieter
und fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

- Anbieter: `moonshot`
- Authentifizierung: `MOONSHOT_API_KEY`
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

- Anbieter: `kimi`
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

Legacy-`kimi/k2p5` bleibt als kompatible Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet Zugang zu Doubao und anderen Modellen in China.

- Anbieter: `volcengine` (Coding: `volcengine-plan`)
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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `volcengine/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen für Onboarding/Configure bevorzugt die Volcengine-Auth-Auswahl sowohl
Zeilen für `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw stattdessen auf den ungefilterten Katalog zurück, anstatt eine leere
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

Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `byteplus/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen für Onboarding/Configure bevorzugt die BytePlus-Auth-Auswahl sowohl
Zeilen für `byteplus/*` als auch `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw stattdessen auf den ungefilterten Katalog zurück, anstatt eine leere
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

Synthetic stellt Anthropic-kompatible Modelle hinter dem Anbieter `synthetic` bereit:

- Anbieter: `synthetic`
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

MiniMax wird über `models.providers` konfiguriert, weil es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Schlüssel (Global): `--auth-choice minimax-global-api`
- MiniMax API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Authentifizierung: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Details zur Einrichtung, Modelloptionen und Konfigurations-Snippets finden Sie unter [/providers/minimax](/de/providers/minimax).

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking
standardmäßig, sofern Sie es nicht explizit festlegen, und `/fast on` schreibt
`MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.

Plugin-eigene Aufteilung der Fähigkeiten:

- Text-/Chat-Standardwerte bleiben bei `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist plugin-eigenes `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt auf der Anbieter-ID `minimax`

### Ollama

Ollama wird als gebündeltes Anbieter-Plugin ausgeliefert und verwendet die native API von Ollama:

- Anbieter: `ollama`
- Authentifizierung: Nicht erforderlich (lokaler Server)
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
`OLLAMA_API_KEY` dafür anmelden, und das gebündelte Anbieter-Plugin fügt Ollama direkt zu
`openclaw onboard` und der Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Anbieter-Plugin für lokale/selbstgehostete OpenAI-kompatible
Server ausgeliefert:

- Anbieter: `vllm`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für die automatische Erkennung anzumelden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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

SGLang wird als gebündeltes Anbieter-Plugin für schnelle selbstgehostete
OpenAI-kompatible Server ausgeliefert:

- Anbieter: `sglang`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für die automatische Erkennung anzumelden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung
erzwingt):

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

- Für benutzerdefinierte Anbieter sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfohlen: Legen Sie explizite Werte fest, die den Grenzen Ihres Proxys/Modells entsprechen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist), erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um 400-Fehler des Anbieters für nicht unterstützte `developer`-Rollen zu vermeiden.
- Proxy-artige OpenAI-kompatible Routen überspringen außerdem native, nur für OpenAI bestimmte Anfrageformung:
  kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, keine
  OpenAI-Reasoning-kompatible Payload-Formung und keine versteckten OpenClaw-Attributions-
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
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Modellkonfigurationsschlüssel
- [Providers](/de/providers) — anbieterbezogene Einrichtungsanleitungen
