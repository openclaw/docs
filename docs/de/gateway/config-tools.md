---
read_when:
    - Konfigurieren der `tools.*`-Richtlinie, von Zulassungslisten oder experimentellen Funktionen
    - Benutzerdefinierte Provider registrieren oder Basis-URLs überschreiben
    - OpenAI-kompatible selbst gehostete Endpunkte einrichten
sidebarTitle: Tools and custom providers
summary: Tools-Konfiguration (Richtlinie, experimentelle Umschalter, Provider-gestützte Tools) und Einrichtung eines benutzerdefinierten Providers/einer Basis-URL
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-04-30T06:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-Konfigurationsschlüssel und benutzerdefinierte Provider- / Basis-URL-Einrichtung. Für Agenten, Kanäle und andere Konfigurationsschlüssel der obersten Ebene siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Werkzeuge

### Tool-Profile

`tools.profile` legt eine Basis-Zulassungsliste vor `tools.allow`/`tools.deny` fest:

<Note>
Das lokale Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn kein Wert festgelegt ist (vorhandene explizite Profile bleiben erhalten).
</Note>

| Profil      | Enthält                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Nur `session_status`                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Keine Einschränkung (entspricht nicht festgelegt)                                                                               |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Alle integrierten Tools (schließt Provider-Plugins aus)                                                                 |

### `tools.allow` / `tools.deny`

Globale Richtlinie zum Zulassen/Ablehnen von Tools (Ablehnen gewinnt). Groß-/Kleinschreibung wird ignoriert, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Tools für bestimmte Provider oder Modelle weiter einschränken. Reihenfolge: Basisprofil → Provider-Profil → Zulassen/Ablehnen.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Steuert erhöhten `exec`-Zugriff außerhalb der Sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Die Überschreibung pro Agent (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Zustand pro Sitzung; Inline-Direktiven gelten für eine einzelne Nachricht.
- Erhöhtes `exec` umgeht die Sandbox und verwendet den konfigurierten Escape-Pfad (standardmäßig `gateway` oder `node`, wenn das `exec`-Ziel `node` ist).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Sicherheitsprüfungen für Tool-Schleifen sind **standardmäßig deaktiviert**. Setzen Sie `enabled: true`, um die Erkennung zu aktivieren. Einstellungen können global in `tools.loopDetection` definiert und pro Agent unter `agents.list[].tools.loopDetection` überschrieben werden.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Maximaler Tool-Aufrufverlauf, der für die Schleifenanalyse aufbewahrt wird.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Schwellenwert für wiederkehrende Muster ohne Fortschritt, ab dem Warnungen ausgegeben werden.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Höherer Wiederholungsschwellenwert zum Blockieren kritischer Schleifen.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Harte Stoppgrenze für jeden Durchlauf ohne Fortschritt.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Bei wiederholten Aufrufen desselben Tools mit denselben Argumenten warnen.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Bei bekannten Abfrage-Tools (`process.poll`, `command_status` usw.) warnen/blockieren.
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Bei alternierenden Paarmustern ohne Fortschritt warnen/blockieren.
</ParamField>

<Warning>
Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold` gilt, schlägt die Validierung fehl.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Konfiguriert das Verständnis eingehender Medien (Bild/Audio/Video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Felder für Medienmodelleinträge">
    **Provider-Eintrag** (`type: "provider"` oder weggelassen):

    - `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
    - `model`: Überschreibung der Modell-ID
    - `profile` / `preferredProfile`: Profilauswahl in `auth-profiles.json`

    **CLI-Eintrag** (`type: "cli"`):

    - `command`: auszuführbare Datei
    - `args`: vorlagenbasierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.; `openclaw doctor --fix` migriert veraltete `{input}`-Platzhalter zu `{{MediaPath}}`)

    **Gemeinsame Felder:**

    - `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → Bild, `google` → Bild+Audio+Video, `groq` → Audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
    - `tools.media.image.timeoutSeconds` und passende Einträge `timeoutSeconds` für Bildmodelle gelten auch, wenn der Agent das explizite Tool `image` aufruft.
    - Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

    Die Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Umgebungsvariablen → `models.providers.*.apiKey`.

    **Felder für asynchrone Abschlüsse:**

    - `asyncCompletion.directSend`: Wenn `true`, versuchen abgeschlossene asynchrone `music_generate`- und `video_generate`-Aufgaben zuerst die direkte Zustellung an den Channel. Standard: `false` (Legacy-Pfad mit Aktivierung der anfordernden Sitzung/Modellzustellung).

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Steuert, welche Sitzungen von den Sitzungstools (`sessions_list`, `sessions_history`, `sessions_send`) adressiert werden können.

Standard: `tree` (aktuelle Sitzung + von ihr erzeugte Sitzungen, etwa Subagents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Sichtbarkeitsbereiche">
    - `self`: nur der aktuelle Sitzungsschlüssel.
    - `tree`: aktuelle Sitzung + von der aktuellen Sitzung erzeugte Sitzungen (Subagents).
    - `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn Sie sitzungsbezogene Per-Sender-Sitzungen unter derselben Agent-ID ausführen).
    - `all`: jede Sitzung. Agent-übergreifende Adressierung erfordert weiterhin `tools.agentToAgent`.
    - Sandbox-Begrenzung: Wenn die aktuelle Sitzung in einer Sandbox ausgeführt wird und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gesetzt ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge für `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Hinweise zu Anhängen">
    - Anhänge werden nur für `runtime: "subagent"` unterstützt. Die ACP-Laufzeit weist sie zurück.
    - Dateien werden im untergeordneten Arbeitsbereich unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
    - Anhangsinhalte werden automatisch aus der Transkriptpersistenz entfernt.
    - Base64-Eingaben werden mit strikten Alphabet-/Padding-Prüfungen und einer Größenbegrenzung vor der Dekodierung validiert.
    - Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
    - Die Bereinigung folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur bei, wenn `retainOnSessionKeep: true` gesetzt ist.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle integrierte Tool-Flags. Standardmäßig deaktiviert, außer eine Strict-Agentic-Aktivierungsregel für GPT-5 greift.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: aktiviert das strukturierte Tool `update_plan` für die Nachverfolgung nicht trivialer mehrstufiger Arbeit.
- Standard: `false`, sofern nicht `agents.defaults.embeddedPi.executionContract` (oder eine Überschreibung pro Agent) für einen OpenAI- oder OpenAI Codex-Lauf aus der GPT-5-Familie auf `"strict-agentic"` gesetzt ist. Setzen Sie `true`, um das Tool außerhalb dieses Gültigkeitsbereichs zu erzwingen, oder `false`, um es selbst für strict-agentic GPT-5-Läufe deaktiviert zu lassen.
- Wenn aktiviert, ergänzt der System-Prompt außerdem Nutzungshinweise, damit das Modell es nur für umfangreiche Arbeit verwendet und höchstens einen Schritt auf `in_progress` hält.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: Standardmodell für erzeugte Sub-Agenten. Wenn weggelassen, erben Sub-Agenten das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist der Ziel-Agent-IDs für `sessions_spawn`, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Sub-Agent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und Basis-URLs

OpenClaw verwendet den integrierten Modellkatalog. Fügen Sie benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Authentifizierung und Zusammenführungsrangfolge">
    - Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Authentifizierungsanforderungen.
    - Überschreiben Sie das Stammverzeichnis der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem Alias für eine Legacy-Umgebungsvariable).
    - Zusammenführungsrangfolge für übereinstimmende Provider-IDs:
      - Nicht leere `baseUrl`-Werte aus `models.json` des Agent haben Vorrang.
      - Nicht leere `apiKey`-Werte des Agent haben nur Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profil-Kontext nicht SecretRef-verwaltet ist.
      - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkern (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert, statt aufgelöste Secrets dauerhaft zu speichern.
      - SecretRef-verwaltete Provider-Header-Werte werden aus Quellmarkern (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert.
      - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` in der Konfiguration zurück.
      - Übereinstimmende Modell-`contextWindow`/`maxTokens` verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
      - Übereinstimmende Modell-`contextTokens` bewahren eine explizite Laufzeitbegrenzung, wenn vorhanden; verwenden Sie sie, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
      - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
      - Die Marker-Persistenz ist quellenautoritativ: Marker werden aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Secret-Werten.

  </Accordion>
</AccordionGroup>

### Details zu Provider-Feldern

<AccordionGroup>
  <Accordion title="Katalog auf oberster Ebene">
    - `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
    - `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID verschlüsselt.
      - Sichere Bearbeitungen: Verwenden Sie `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` verweigert destruktive Ersetzungen, sofern Sie nicht `--replace` übergeben.

  </Accordion>
  <Accordion title="Provider-Verbindung und Authentifizierung">
    - `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.). Verwenden Sie für selbst gehostete `/v1/chat/completions`-Backends wie MLX, vLLM, SGLang und die meisten OpenAI-kompatiblen lokalen Server `openai-completions`. Ein benutzerdefinierter Provider mit `baseUrl`, aber ohne `api`, verwendet standardmäßig `openai-completions`; setzen Sie `openai-responses` nur, wenn das Backend `/v1/responses` unterstützt.
    - `models.providers.*.apiKey`: Provider-Anmeldedaten (SecretRef/Env-Substitution bevorzugen).
    - `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: natives Standard-Kontextfenster für Modelle unter diesem Provider, wenn der Modelleintrag `contextWindow` nicht setzt.
    - `models.providers.*.contextTokens`: standardmäßige effektive Laufzeit-Kontextbegrenzung für Modelle unter diesem Provider, wenn der Modelleintrag `contextTokens` nicht setzt.
    - `models.providers.*.maxTokens`: standardmäßige Ausgabetoken-Begrenzung für Modelle unter diesem Provider, wenn der Modelleintrag `maxTokens` nicht setzt.
    - `models.providers.*.timeoutSeconds`: optionaler HTTP-Request-Timeout pro Provider-Modell in Sekunden, einschließlich Verbindung, Headern, Body und Behandlung des gesamten Request-Abbruchs.
    - `models.providers.*.injectNumCtxForOpenAICompat`: fügt für Ollama + `openai-completions` `options.num_ctx` in Requests ein (Standard: `true`).
    - `models.providers.*.authHeader`: erzwingt bei Bedarf die Übertragung der Anmeldedaten im Header `Authorization`.
    - `models.providers.*.baseUrl`: Basis-URL der Upstream-API.
    - `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.

  </Accordion>
  <Accordion title="Überschreibungen für den Request-Transport">
    `models.providers.*.request`: Transport-Überschreibungen für HTTP-Requests an Modell-Provider.

    - `request.headers`: zusätzliche Header (mit Provider-Standards zusammengeführt). Werte akzeptieren SecretRef.
    - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (integrierte Authentifizierung des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optionalem `prefix`).
    - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY`-Env-Vars verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren ein optionales `tls`-Unterobjekt.
    - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: Wenn `true`, HTTPS zu `baseUrl` erlauben, wenn DNS zu privaten, CGNAT- oder ähnlichen Bereichen auflöst, über den HTTP-Fetch-Guard des Providers (Operator-Opt-in für vertrauenswürdige selbst gehostete OpenAI-kompatible Endpunkte). Loopback-Stream-URLs von Modell-Providern wie `localhost`, `127.0.0.1` und `[::1]` sind automatisch erlaubt, sofern dies nicht ausdrücklich auf `false` gesetzt ist; LAN-, Tailnet- und private DNS-Hosts erfordern weiterhin Opt-in. WebSocket verwendet dasselbe `request` für Header/TLS, aber nicht dieses Fetch-SSRF-Gate. Standard `false`.

  </Accordion>
  <Accordion title="Modellkatalog-Einträge">
    - `models.providers.*.models`: explizite Provider-Modellkatalog-Einträge.
    - `models.providers.*.models.*.input`: Modelleingabemodalitäten. Verwenden Sie `["text"]` für reine Textmodelle und `["text", "image"]` für native Bild-/Vision-Modelle. Bildanhänge werden nur in Agent-Turns eingefügt, wenn das ausgewählte Modell als bildfähig markiert ist.
    - `models.providers.*.models.*.contextWindow`: Metadaten zum nativen Modell-Kontextfenster. Dies überschreibt `contextWindow` auf Provider-Ebene für dieses Modell.
    - `models.providers.*.models.*.contextTokens`: optionale Laufzeit-Kontextbegrenzung. Dies überschreibt `contextTokens` auf Provider-Ebene; verwenden Sie es, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells wünschen; `openclaw models list` zeigt beide Werte an, wenn sie sich unterscheiden.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Eine leere/weggelassene `baseUrl` behält das standardmäßige OpenAI-Verhalten bei.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für string-only OpenAI-kompatible Chat-Endpunkte. Wenn `true`, reduziert OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden des Requests auf einfache Strings.

  </Accordion>
  <Accordion title="Amazon Bedrock-Erkennung">
    - `plugins.entries.amazon-bedrock.config.discovery`: Stamm der Bedrock-Auto-Erkennungseinstellungen.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Erkennung ein-/ausschalten.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für die Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für gezielte Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Abfrageintervall für die Erkennungsaktualisierung.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Ausgabetoken bei erkannten Modellen.

  </Accordion>
</AccordionGroup>

Das interaktive Onboarding für benutzerdefinierte Provider leitet Bildeingabe für gängige Vision-Modell-IDs wie GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V und GLM-4V ab und überspringt die zusätzliche Frage für bekannte reine Textfamilien. Unbekannte Modell-IDs fragen weiterhin nach Bildunterstützung. Nicht interaktives Onboarding verwendet dieselbe Ableitung; übergeben Sie `--custom-image-input`, um bildfähige Metadaten zu erzwingen, oder `--custom-text-input`, um reine Textmetadaten zu erzwingen.

### Provider-Beispiele

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Das gebündelte Provider-Plugin `cerebras` kann dies über `openclaw onboard --auth-choice cerebras-api-key` konfigurieren. Verwenden Sie eine explizite Provider-Konfiguration nur, wenn Sie Standardwerte überschreiben.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Verwenden Sie `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für Z.AI direkt.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic-kompatibler, integrierter Provider. Kurzform: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Lokale Modelle (LM Studio)">
    Siehe [Lokale Modelle](/de/gateway/local-models). Kurzfassung: Führen Sie ein großes lokales Modell über die LM Studio Responses API auf leistungsstarker Hardware aus; behalten Sie gehostete Modelle als zusammengeführte Fallback-Option bei.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direkt)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Setzen Sie `MINIMAX_API_KEY`. Kurzbefehle: `openclaw onboard --auth-choice minimax-global-api` oder `openclaw onboard --auth-choice minimax-cn-api`. Der Modellkatalog ist standardmäßig nur auf M2.7 gesetzt. Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking standardmäßig, sofern Sie `thinking` nicht ausdrücklich selbst setzen. `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Für den China-Endpunkt: `baseUrl: "https://api.moonshot.cn/v1"` oder `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Native Moonshot-Endpunkte geben Streaming-Usage-Kompatibilität über den gemeinsamen `openai-completions`-Transport an, und OpenClaw leitet dies aus den Endpunktfunktionen statt allein aus der integrierten Provider-ID ab.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie `opencode/...`-Referenzen für den Zen-Katalog oder `opencode-go/...`-Referenzen für den Go-Katalog. Kurzbefehl: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-kompatibel)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    Die Basis-URL sollte `/v1` auslassen (der Anthropic-Client hängt es an). Kurzbefehl: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` sind akzeptierte Aliasse. Kurzbefehl: `openclaw onboard --auth-choice zai-api-key`.

    - Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
    - Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
    - Definieren Sie für den allgemeinen Endpunkt einen benutzerdefinierten Provider mit der Basis-URL-Überschreibung.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Konfiguration — Agents](/de/gateway/config-agents)
- [Konfiguration — Channels](/de/gateway/config-channels)
- [Konfigurationsreferenz](/de/gateway/configuration-reference) — andere Schlüssel der obersten Ebene
- [Tools und Plugins](/de/tools)
