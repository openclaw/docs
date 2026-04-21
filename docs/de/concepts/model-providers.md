---
read_when:
    - Sie benötigen eine anbieterweise Referenz zur Modelleinrichtung
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modellanbieter.
summary: Übersicht über Modellanbieter mit Beispielkonfigurationen + CLI-Abläufen
title: Modellanbieter
x-i18n:
    generated_at: "2026-04-21T13:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modellanbieter

Diese Seite behandelt **LLM-/Modellanbieter** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Zu Regeln für die Modellauswahl siehe [/concepts/models](/de/concepts/models).

## Schnelle Regeln

- Modellreferenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` festlegen, wird es zur Zulassungsliste.
- CLI-Hilfen: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Fallback-Laufzeitregeln, Cooldown-Sondierungen und die Persistenz von Sitzungsüberschreibungen
  sind in [/concepts/model-failover](/de/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten;
  `models.providers.*.models[].contextTokens` ist die effektive Laufzeitobergrenze.
- Anbieter-Plugins können Modellkataloge über `registerProvider({ catalog })` einschleusen;
  OpenClaw führt diese Ausgabe vor dem Schreiben von
  `models.json` in `models.providers` zusammen.
- Anbieter-Manifeste können `providerAuthEnvVars` und
  `providerAuthAliases` deklarieren, sodass generische umgebungsvariablenbasierte Authentifizierungsprüfungen und Anbietervarianten
  die Plugin-Laufzeit nicht laden müssen. Die verbleibende Kern-Zuordnung für Umgebungsvariablen ist jetzt
  nur noch für Nicht-Plugin-/Kern-Anbieter und einige generische Präzedenzfälle gedacht, etwa
  Anthropic-Onboarding mit API-Schlüssel zuerst.
- Anbieter-Plugins können auch das Laufzeitverhalten des Anbieters über
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
  `onModelSelected` besitzen.
- Hinweis: Laufzeit-`capabilities` des Anbieters sind gemeinsame Runner-Metadaten (Anbieterfamilie,
  Eigenheiten bei Transkripten/Tooling, Hinweise zu Transport/Cache). Sie sind nicht
  dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model),
  das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
- Der gebündelte `codex`-Anbieter ist mit dem gebündelten Codex-Agent-Harness gekoppelt.
  Verwenden Sie `codex/gpt-*`, wenn Sie Codex-eigenes Login, Modellerkennung, natives
  Fortsetzen von Threads und Ausführung auf dem App-Server möchten. Einfache Referenzen wie `openai/gpt-*`
  verwenden weiterhin den OpenAI-Anbieter und den normalen OpenClaw-Anbietertransport.
  Rein auf Codex ausgerichtete Deployments können automatischen PI-Fallback mit
  `agents.defaults.embeddedHarness.fallback: "none"` deaktivieren; siehe
  [Codex Harness](/de/plugins/codex-harness).

## Plugin-eigenes Anbieterverhalten

Anbieter-Plugins können jetzt den Großteil der anbieterspezifischen Logik besitzen, während OpenClaw
die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Der Anbieter besitzt Onboarding-/Login-
  Abläufe für `openclaw onboard`, `openclaw models auth` und Headless-Setup
- `wizard.setup` / `wizard.modelPicker`: Der Anbieter besitzt Labels für die Authentifizierungsauswahl,
  Legacy-Aliasse, Hinweise zur Zulassungsliste beim Onboarding und Setup-Einträge in Onboarding-/Modellauswahlen
- `catalog`: Der Anbieter erscheint in `models.providers`
- `normalizeModelId`: Der Anbieter normalisiert Legacy-/Vorschau-Modell-IDs vor
  Nachschlagen oder Kanonisierung
- `normalizeTransport`: Der Anbieter normalisiert die Transportfamilie `api` / `baseUrl`
  vor der generischen Modellzusammenstellung; OpenClaw prüft zuerst den passenden Anbieter,
  dann andere Hook-fähige Anbieter-Plugins, bis eines den
  Transport tatsächlich ändert
- `normalizeConfig`: Der Anbieter normalisiert die Konfiguration `models.providers.<id>` vor
  der Verwendung zur Laufzeit; OpenClaw prüft zuerst den passenden Anbieter, dann andere
  Hook-fähige Anbieter-Plugins, bis eines die Konfiguration tatsächlich ändert. Falls kein
  Anbieter-Hook die Konfiguration umschreibt, normalisieren die gebündelten Helfer der Google-Familie weiterhin
  unterstützte Google-Anbietereinträge.
- `applyNativeStreamingUsageCompat`: Der Anbieter wendet endpointgesteuerte native Streaming-/Nutzungs-Kompatibilitäts-Umschreibungen für Konfigurationsanbieter an
- `resolveConfigApiKey`: Der Anbieter löst Authentifizierung über Umgebungsvariablenmarker für Konfigurationsanbieter auf,
  ohne das vollständige Laden der Laufzeit-Authentifizierung zu erzwingen. `amazon-bedrock` hat hier
  ebenfalls einen eingebauten AWS-Resolver für Umgebungsvariablenmarker, obwohl die Bedrock-Laufzeit-Authentifizierung
  die Standardkette des AWS SDK verwendet.
- `resolveSyntheticAuth`: Der Anbieter kann lokale/selbstgehostete oder andere
  konfigurationsgestützte Authentifizierungsverfügbarkeit offenlegen, ohne Klartext-Geheimnisse zu speichern
- `shouldDeferSyntheticProfileAuth`: Der Anbieter kann gespeicherte synthetische Profil-
  Platzhalter als niedrigere Priorität als umgebungs-/konfigurationsgestützte Authentifizierung markieren
- `resolveDynamicModel`: Der Anbieter akzeptiert Modell-IDs, die im lokalen
  statischen Katalog noch nicht vorhanden sind
- `prepareDynamicModel`: Der Anbieter benötigt eine Metadatenaktualisierung, bevor die
  dynamische Auflösung erneut versucht wird
- `normalizeResolvedModel`: Der Anbieter benötigt Umschreibungen von Transport oder Basis-URL
- `contributeResolvedModelCompat`: Der Anbieter steuert Kompatibilitäts-Flags für seine
  Herstellermodelle bei, auch wenn diese über einen anderen kompatiblen Transport ankommen
- `capabilities`: Der Anbieter veröffentlicht Eigenheiten zu Transkripten/Tooling/Anbieterfamilie
- `normalizeToolSchemas`: Der Anbieter bereinigt Tool-Schemata, bevor der eingebettete
  Runner sie sieht
- `inspectToolSchemas`: Der Anbieter zeigt transportspezifische Schemawarnungen
  nach der Normalisierung an
- `resolveReasoningOutputMode`: Der Anbieter wählt native oder getaggte
  Verträge für die Ausgabebegründung
- `prepareExtraParams`: Der Anbieter setzt Standardwerte oder normalisiert anfragebezogene Parameter pro Modell
- `createStreamFn`: Der Anbieter ersetzt den normalen Streaming-Pfad durch einen vollständig
  benutzerdefinierten Transport
- `wrapStreamFn`: Der Anbieter wendet Wrapper für Anfrage-Header/Body/Modell-Kompatibilität an
- `resolveTransportTurnState`: Der Anbieter liefert native Transport-
  Header oder Metadaten pro Zug
- `resolveWebSocketSessionPolicy`: Der Anbieter liefert native WebSocket-Sitzungs-
  Header oder Cooldown-Richtlinien für Sitzungen
- `createEmbeddingProvider`: Der Anbieter besitzt das Verhalten für Speicher-Embeddings, wenn es
  eher zum Anbieter-Plugin als zum Kern-Switchboard für Embeddings gehört
- `formatApiKey`: Der Anbieter formatiert gespeicherte Authentifizierungsprofile in den zur Laufzeit
  vom Transport erwarteten `apiKey`-String
- `refreshOAuth`: Der Anbieter besitzt die OAuth-Aktualisierung, wenn die gemeinsamen
  `pi-ai`-Aktualisierer nicht ausreichen
- `buildAuthDoctorHint`: Der Anbieter fügt Reparaturhinweise an, wenn die OAuth-Aktualisierung
  fehlschlägt
- `matchesContextOverflowError`: Der Anbieter erkennt anbieterspezifische
  Fehler bei Überschreitung des Kontextfensters, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Der Anbieter ordnet anbieterspezifische rohe Transport-/API-
  Fehler Failover-Gründen wie Ratenbegrenzung oder Überlastung zu
- `isCacheTtlEligible`: Der Anbieter entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Der Anbieter ersetzt den generischen Fehler des Authentifizierungsspeichers
  durch einen anbieterspezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Der Anbieter blendet veraltete Upstream-Zeilen aus und kann bei
  direkten Auflösungsfehlern einen herstellereigenen Fehler zurückgeben
- `augmentModelCatalog`: Der Anbieter fügt nach Erkennung und Konfigurationszusammenführung
  synthetische/finale Katalogzeilen an
- `resolveThinkingProfile`: Der Anbieter besitzt die genaue Menge an `/think`-Stufen,
  optionale Anzeigelabels und die Standardstufe für ein ausgewähltes Modell
- `isBinaryThinking`: Kompatibilitäts-Hook für binäre Denk-UX mit Ein/Aus
- `supportsXHighThinking`: Kompatibilitäts-Hook für ausgewählte `xhigh`-Modelle
- `resolveDefaultThinkingLevel`: Kompatibilitäts-Hook für die Standardrichtlinie von `/think`
- `applyConfigDefaults`: Der Anbieter wendet anbieterspezifische globale Standardwerte
  während der Konfigurationsmaterialisierung basierend auf Authentifizierungsmodus, Umgebung oder Modellfamilie an
- `isModernModelRef`: Der Anbieter besitzt den Abgleich bevorzugter Modelle für Live-/Smoke-Tests
- `prepareRuntimeAuth`: Der Anbieter wandelt ein konfiguriertes Zugangsmittel in ein kurzlebiges
  Laufzeit-Token um
- `resolveUsageAuth`: Der Anbieter löst Zugangsdaten für Nutzung/Kontingent für `/usage`
  und verwandte Status-/Berichtsoberflächen auf
- `fetchUsageSnapshot`: Der Anbieter besitzt das Abrufen/Parsen des Nutzungsendpunkts, während der
  Kern weiterhin die Zusammenfassungs-Shell und Formatierung besitzt
- `onModelSelected`: Der Anbieter führt Nebeneffekte nach der Auswahl aus, etwa
  Telemetrie oder anbietereigene Sitzungsbuchführung

Aktuelle gebündelte Beispiele:

- `anthropic`: Claude-4.6-Vorwärtskompatibilitäts-Fallback, Hinweise zur Authentifizierungsreparatur, Abrufen des Nutzungsendpunkts,
  Cache-TTL-/Anbieterfamilien-Metadaten und auth-bewusste globale
  Konfigurationsstandards
- `amazon-bedrock`: anbieterseitige Erkennung von Kontextüberläufen und Failover-
  Klassifizierung für Bedrock-spezifische Drosselungs-/Nicht-bereit-Fehler, plus
  die gemeinsame Replay-Familie `anthropic-by-model` für Claude-spezifische Replay-Richtlinien-
  Schutzmechanismen für Anthropic-Datenverkehr
- `anthropic-vertex`: Claude-spezifische Replay-Richtlinien-Schutzmechanismen für Anthropic-Message-
  Datenverkehr
- `openrouter`: Durchreichen von Modell-IDs, Anfrage-Wrapper, Hinweise auf Anbieterfähigkeiten,
  Bereinigung von Gemini-Thought-Signaturen bei proxied Gemini-Datenverkehr, Proxy-
  Begründungsinjektion über die Stream-Familie `openrouter-thinking`, Weiterleitung von Routing-
  Metadaten und Cache-TTL-Richtlinie
- `github-copilot`: Onboarding/Geräte-Login, Vorwärtskompatibilitäts-Modell-Fallback,
  Hinweise zu Claude-Thinking-Transkripten, Austausch von Laufzeit-Token und Abrufen des Nutzungsendpunkts
- `openai`: GPT-5.4-Vorwärtskompatibilitäts-Fallback, direkte OpenAI-Transport-
  Normalisierung, Codex-bewusste Hinweise bei fehlender Authentifizierung, Spark-Unterdrückung,
  synthetische OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Modell-Richtlinie, Normalisierung von
  Nutzungs-Token-Aliasen (`input` / `output` und `prompt` / `completion`-Familien), die
  gemeinsame Stream-Familie `openai-responses-defaults` für native OpenAI-/Codex-
  Wrapper, Anbieterfamilien-Metadaten, gebündelte Registrierung des Bildgenerierungsanbieters
  für `gpt-image-1` und gebündelte Registrierung des Videogenerierungsanbieters
  für `sora-2`
- `google` und `google-gemini-cli`: Gemini-3.1-Vorwärtskompatibilitäts-Fallback,
  native Gemini-Replay-Validierung, Bootstrap-Replay-Bereinigung, getaggter
  Begründungsausgabemodus, Abgleich moderner Modelle, gebündelte Registrierung des Bildgenerierungs-
  anbieter für Gemini-Image-Preview-Modelle und gebündelte
  Registrierung des Videogenerierungsanbieters für Veo-Modelle; Gemini-CLI-OAuth
  besitzt außerdem die Formatierung von Authentifizierungsprofil-Token, das Parsen von Nutzungs-Token
  und das Abrufen des Kontingent-Endpunkts für Nutzungsoberflächen
- `moonshot`: gemeinsamer Transport, plugin-eigene Normalisierung von Thinking-Payloads
- `kilocode`: gemeinsamer Transport, plugin-eigene Anfrage-Header, Normalisierung von Reasoning-Payloads,
  Bereinigung von Proxy-Gemini-Thought-Signaturen und Cache-TTL-
  Richtlinie
- `zai`: GLM-5-Vorwärtskompatibilitäts-Fallback, `tool_stream`-Standards, Cache-TTL-
  Richtlinie, binäre Thinking-/Live-Modell-Richtlinie und Nutzungsauthentifizierung + Abruf von Kontingenten;
  unbekannte `glm-5*`-IDs werden aus der gebündelten Vorlage `glm-4.7` synthetisiert
- `xai`: native Responses-Transportnormalisierung, Umschreibungen von `/fast`-Aliasen für
  schnelle Grok-Varianten, Standardwert `tool_stream`, xAI-spezifische Bereinigung von Tool-Schemata /
  Reasoning-Payloads und gebündelte Registrierung des Videogenerierungsanbieters
  für `grok-imagine-video`
- `mistral`: plugin-eigene Fähigkeitsmetadaten
- `opencode` und `opencode-go`: plugin-eigene Fähigkeitsmetadaten plus
  Bereinigung von Proxy-Gemini-Thought-Signaturen
- `alibaba`: plugin-eigener Videogenerierungskatalog für direkte Wan-Modellreferenzen
  wie `alibaba/wan2.6-t2v`
- `byteplus`: plugin-eigene Kataloge plus gebündelte Registrierung des Videogenerierungsanbieters
  für Seedance-Text-zu-Video-/Bild-zu-Video-Modelle
- `fal`: gebündelte Registrierung des Videogenerierungsanbieters für gehostete Drittanbieter-
  Registrierung des Bildgenerierungsanbieters für FLUX-Bildmodelle plus gebündelte
  Registrierung des Videogenerierungsanbieters für gehostete Drittanbieter-Videomodelle
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` und `volcengine`:
  nur plugin-eigene Kataloge
- `qwen`: plugin-eigene Kataloge für Textmodelle plus gemeinsame
  Registrierungen für Medienverständnis- und Videogenerierungsanbieter für seine
  multimodalen Oberflächen; die Qwen-Videogenerierung verwendet die Standard-DashScope-Video-
  Endpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `runway`: plugin-eigene Registrierung des Videogenerierungsanbieters für native
  aufgabenbasierte Runway-Modelle wie `gen4.5`
- `minimax`: plugin-eigene Kataloge, gebündelte Registrierung des Videogenerierungsanbieters
  für Hailuo-Videomodelle, gebündelte Registrierung des Bildgenerierungsanbieters
  für `image-01`, hybride Auswahl von Anthropic-/OpenAI-Replay-Richtlinien
  und Nutzungsauthentifizierung/Snapshot-Logik
- `together`: plugin-eigene Kataloge plus gebündelte Registrierung des Videogenerierungsanbieters
  für Wan-Videomodelle
- `xiaomi`: plugin-eigene Kataloge plus Nutzungsauthentifizierung/Snapshot-Logik

Das gebündelte Plugin `openai` besitzt jetzt beide Anbieter-IDs: `openai` und
`openai-codex`.

Damit sind Anbieter abgedeckt, die noch in die normalen Transporte von OpenClaw passen. Ein Anbieter,
der einen vollständig benutzerdefinierten Anfrage-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

## API-Schlüsselrotation

- Unterstützt generische Anbieterrotation für ausgewählte Anbieter.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (kommagetrennte oder semikolongetrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Anbieter ist `GOOGLE_API_KEY` zusätzlich als Fallback enthalten.
- Die Reihenfolge der Schlüsselauswahl bewahrt die Priorität und dedupliziert Werte.
- Anfragen werden nur bei Antworten mit Ratenbegrenzung mit dem nächsten Schlüssel wiederholt (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Meldungen über Nutzungslimits).
- Fehler, die keine Ratenbegrenzung sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der letzte Fehler aus dem letzten Versuch zurückgegeben.

## Integrierte Anbieter (pi-ai-Katalog)

OpenClaw wird mit dem pi-ai-Katalog ausgeliefert. Diese Anbieter benötigen **keine**
Konfiguration in `models.providers`; setzen Sie einfach die Authentifizierung und wählen Sie ein Modell.

### OpenAI

- Anbieter: `openai`
- Authentifizierung: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Überschreiben Sie pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das OpenAI-Responses-WebSocket-Warm-up ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- Die OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen auf `api.openai.com` `service_tier=priority` zu
- Verwenden Sie `params.serviceTier`, wenn Sie statt des gemeinsamen `/fast`-Schalters einen expliziten Tier wünschen
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht
  für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem `store` für Responses, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-kompatible Payload-Formung bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil die Live-OpenAI-API es ablehnt; Spark wird als nur für Codex behandelt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Anbieter: `anthropic`
- Authentifizierung: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen auch den gemeinsamen `/fast`-Schalter und `params.fastMode`, einschließlich per API-Schlüssel und OAuth authentifiziertem Datenverkehr an `api.anthropic.com`; OpenClaw ordnet das Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Anthropic-Hinweis: Anthropic-Mitarbeitende haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.

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
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Überschreiben Sie pro Modell über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird ebenfalls bei nativen Codex-Responses-Anfragen weitergeleitet (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) werden nur an nativen Codex-Datenverkehr zu
  `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Nutzt denselben `/fast`-Schalter und dieselbe Konfiguration `params.fastMode` wie direkte `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von Berechtigungen
- `openai-codex/gpt-5.4` behält natives `contextWindow = 1050000` und eine Standard-Laufzeitobergrenze von `contextTokens = 272000`; überschreiben Sie die Laufzeitobergrenze mit `models.providers.openai-codex.models[].contextTokens`
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

- [Qwen Cloud](/de/providers/qwen): Qwen-Cloud-Anbieteroberfläche plus Zuordnung der Alibaba-DashScope- und Coding-Plan-Endpunkte
- [MiniMax](/de/providers/minimax): MiniMax-Coding-Plan-OAuth- oder API-Schlüsselzugriff
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
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, Fallback auf `GOOGLE_API_KEY` und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Legacy-OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Ausführungen akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder das Legacy-`cached_content`), um ein anbieternatives
  Handle `cachedContents/...` weiterzuleiten; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Anbieter: `google-vertex`, `google-gemini-cli`
- Authentifizierung: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Nutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen bei Google-Konten gemeldet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein unkritisches Konto, wenn Sie fortfahren möchten.
- Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Sie fügen **keine** Client-ID und kein Secret in `openclaw.json` ein. Der CLI-Anmeldeablauf speichert
    Token in Authentifizierungsprofilen auf dem Gateway-Host.
  - Wenn Anfragen nach der Anmeldung fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; die Nutzung greift auf
    `stats` zurück, wobei `stats.cached` in OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Anbieter: `zai`
- Authentifizierung: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

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
- Der statische Fallback-Katalog liefert `kilocode/kilo/auto`; die Live-
  Erkennung unter `https://api.kilo.ai/api/gateway/models` kann den Laufzeit-
  Katalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` gehört zu Kilo Gateway
  und ist nicht in OpenClaw fest kodiert.

Siehe [/providers/kilocode](/de/providers/kilocode) für Einrichtungsdetails.

### Andere gebündelte Anbieter-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodell: `openrouter/auto`
- OpenClaw wendet die dokumentierten App-Attributions-Header von OpenRouter nur an, wenn
  die Anfrage tatsächlich an `openrouter.ai` geht
- OpenRouter-spezifische Anthropic-`cache_control`-Marker sind ebenso auf
  verifizierte OpenRouter-Routen beschränkt, nicht auf beliebige Proxy-URLs
- OpenRouter bleibt auf dem Proxy-artigen OpenAI-kompatiblen Pfad, daher wird die native,
  nur für OpenAI geltende Anfrageformung (`serviceTier`, Responses-`store`,
  Prompt-Cache-Hinweise, OpenAI-Reasoning-kompatible Payloads) nicht weitergeleitet
- Auf Gemini basierende OpenRouter-Referenzen behalten nur die Bereinigung von Proxy-Gemini-Thought-Signaturen
  bei; native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Auf Gemini basierende Kilo-Referenzen behalten denselben Pfad zur Bereinigung von Proxy-Gemini-Thought-Signaturen;
  `kilocode/kilo/auto` und andere Hinweise ohne Unterstützung für Proxy-Reasoning
  überspringen die Injektion von Proxy-Reasoning
- MiniMax: `minimax` (API-Schlüssel) und `minimax-portal` (OAuth)
- Authentifizierung: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- MiniMax-Onboarding/API-Schlüssel-Einrichtung schreibt explizite M2.7-Modelldefinitionen mit
  `input: ["text", "image"]`; der gebündelte Anbieter-Katalog belässt die Chat-Referenzen
  als nur Text, bis diese Anbieterkonfiguration materialisiert wird
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
Verwenden Sie explizite Einträge in `models.providers.<id>` nur dann, wenn Sie die
Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Anbieter-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Anbieter
und fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie die Basis-URL oder Modellmetadaten
überschreiben müssen:

- Anbieter: `moonshot`
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

Legacy-`kimi/k2p5` bleibt als Kompatibilitäts-Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet Zugriff auf Doubao und andere Modelle in China.

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

Standardmäßig verwendet Onboarding die Coding-Oberfläche, aber der allgemeine Katalog `volcengine/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen für Onboarding/Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl
Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine leere
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

### BytePlus (International)

BytePlus ARK bietet internationalen Nutzern Zugriff auf dieselben Modelle wie Volcano Engine.

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

Standardmäßig verwendet Onboarding die Coding-Oberfläche, aber der allgemeine Katalog `byteplus/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen für Onboarding/Konfiguration bevorzugt die BytePlus-Authentifizierungsoption sowohl
Zeilen `byteplus/*` als auch `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine leere
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

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurationsbeispiele.

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking
standardmäßig, sofern Sie es nicht explizit setzen, und `/fast on` schreibt
`MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

Plugin-eigene Fähigkeitsaufteilung:

- Standards für Text/Chat bleiben auf `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist plugin-eigenes `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt auf Anbieter-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Anbieter-Plugin ausgeliefert, das die native API verwendet:

- Anbieter: `lmstudio`
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

OpenClaw verwendet die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio
für Erkennung + automatisches Laden und standardmäßig `/v1/chat/completions` für Inferenz.
Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als gebündeltes Anbieter-Plugin ausgeliefert und verwendet die native API von Ollama:

- Anbieter: `ollama`
- Authentifizierung: Keine erforderlich (lokaler Server)
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

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie mit
`OLLAMA_API_KEY` zustimmen, und das gebündelte Anbieter-Plugin fügt Ollama direkt zu
`openclaw onboard` und der Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Anbieter-Plugin für lokale/selbstgehostete OpenAI-kompatible
Server ausgeliefert:

- Anbieter: `vllm`
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

So stimmen Sie der automatischen lokalen Erkennung zu (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

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
- Authentifizierung: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

So stimmen Sie der automatischen lokalen Erkennung zu (jeder Wert funktioniert, wenn Ihr Server keine
Authentifizierung erzwingt):

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
  Wenn sie ausgelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfohlen: Setzen Sie explizite Werte, die zu Ihren Proxy-/Modellgrenzen passen.
- Für `api: "openai-completions"` auf nicht-nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist), erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um 400-Fehler des Anbieters bei nicht unterstützten `developer`-Rollen zu vermeiden.
- Proxy-artige OpenAI-kompatible Routen überspringen auch die native, nur für OpenAI geltende Anfrageformung:
  kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, keine
  OpenAI-Reasoning-kompatible Payload-Formung und keine versteckten OpenClaw-Attributions-
  Header.
- Wenn `baseUrl` leer ist oder ausgelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
- Zur Sicherheit wird ein explizites `compat.supportsDeveloperRole: true` auf nicht-nativen `openai-completions`-Endpunkten weiterhin überschrieben.

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
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Schlüssel der Modellkonfiguration
- [Providers](/de/providers) — Einrichtungsanleitungen pro Anbieter
