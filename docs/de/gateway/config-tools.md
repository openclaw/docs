---
read_when:
    - Konfigurieren der `tools.*`-Richtlinie, Allowlists oder experimenteller Funktionen
    - Benutzerdefinierte Provider registrieren oder Basis-URLs überschreiben
    - OpenAI-kompatible selbst gehostete Endpunkte einrichten
sidebarTitle: Tools and custom providers
summary: Tool-Konfiguration (Richtlinie, experimentelle Schalter, Provider-gestützte Tools) und Einrichtung benutzerdefinierter Provider/Basis-URLs
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-05-01T06:42:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97e6bd8c762f6f7a9985b99ec016dde22c8ea8adc925778b11c2ae5103b887a8
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-Konfigurationsschlüssel und benutzerdefinierte Provider-/Base-URL-Einrichtung. Für Agents, Kanäle und andere Top-Level-Konfigurationsschlüssel siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Tools

### Tool-Profile

`tools.profile` legt eine Basis-Allowlist vor `tools.allow`/`tools.deny` fest:

<Note>
Lokales Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn der Wert nicht gesetzt ist (vorhandene explizite Profile bleiben erhalten).
</Note>

| Profil      | Enthält                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                                  |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                         |
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
| `group:openclaw`   | Alle integrierten Tools (schließt Provider-Plugins aus)                                                                          |

### `tools.allow` / `tools.deny`

Globale Tool-Zulassungs-/Sperrrichtlinie (Sperren hat Vorrang). Groß-/Kleinschreibung wird ignoriert, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Schränkt Tools für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Provider-Profil → allow/deny.

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

- Agent-spezifische Überschreibung (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Status pro Sitzung; Inline-Direktiven gelten für eine einzelne Nachricht.
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
  Schwellenwert für Warnungen bei wiederholten Mustern ohne Fortschritt.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Höherer Wiederholungsschwellenwert zum Blockieren kritischer Schleifen.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Harte Stoppschwelle für jeden Lauf ohne Fortschritt.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Warnt bei wiederholten Aufrufen desselben Tools mit denselben Argumenten.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Warnt/blockiert bei bekannten Polling-Tools (`process.poll`, `command_status` usw.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Warnt/blockiert bei abwechselnden Paarmustern ohne Fortschritt.
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
        directSend: false, // opt-in: send finished async video directly to the channel
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
    - `profile` / `preferredProfile`: Profilauswahl für `auth-profiles.json`

    **CLI-Eintrag** (`type: "cli"`):

    - `command`: auszuführbare Datei
    - `args`: vorlagenbasierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.; `openclaw doctor --fix` migriert veraltete `{input}`-Platzhalter zu `{{MediaPath}}`)

    **Allgemeine Felder:**

    - `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → Bild, `google` → Bild+Audio+Video, `groq` → Audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
    - `tools.media.image.timeoutSeconds` und passende `timeoutSeconds`-Einträge des Bildmodells gelten auch, wenn der Agent das explizite Tool `image` aufruft.
    - Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

    Die Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Umgebungsvariablen → `models.providers.*.apiKey`.

    **Felder für asynchrone Fertigstellung:**

    - `asyncCompletion.directSend`: Wenn `true`, versuchen abgeschlossene asynchrone Medienaufgaben, die direkte Fertigstellungszustellung unterstützen, zuerst die direkte Zustellung an den Channel. Standard: `false` (Pfad über Aufwecken der anfordernden Sitzung/Modellzustellung). Derzeit gilt dies für asynchrones `video_generate`; Fertigstellungen von asynchronem `music_generate` bleiben über die anfordernde Sitzung vermittelt, selbst wenn dies aktiviert ist.

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

Steuert, welche Sitzungen von den Sitzungs-Tools (`sessions_list`, `sessions_history`, `sessions_send`) adressiert werden können.

Standard: `tree` (aktuelle Sitzung + davon erzeugte Sitzungen, z. B. Subagents).

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
    - `tree`: aktuelle Sitzung + Sitzungen, die von der aktuellen Sitzung erzeugt wurden (Subagents).
    - `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn Sie sitzungsbezogene Sitzungen pro Absender unter derselben Agent-ID ausführen).
    - `all`: jede Sitzung. Agent-übergreifende Adressierung erfordert weiterhin `tools.agentToAgent`.
    - Sandbox-Begrenzung: Wenn die aktuelle Sitzung in einer Sandbox läuft und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` ist.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge bei `sessions_spawn`.

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
    - Anhänge werden nur für `runtime: "subagent"` unterstützt. Die ACP-Laufzeit lehnt sie ab.
    - Dateien werden im untergeordneten Arbeitsbereich unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
    - Inhalte von Anhängen werden automatisch aus der Transkriptpersistenz redigiert.
    - Base64-Eingaben werden mit strengen Alphabet-/Padding-Prüfungen und einer Größenbegrenzung vor der Dekodierung validiert.
    - Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
    - Die Bereinigung folgt der `cleanup`-Richtlinie: `delete` entfernt Anhänge immer; `keep` behält sie nur bei, wenn `retainOnSessionKeep: true` ist.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle Flags für integrierte Tools. Standardmäßig deaktiviert, sofern keine automatische Aktivierungsregel für strict-agentic GPT-5 greift.

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
- Standard: `false`, außer `agents.defaults.embeddedPi.executionContract` (oder eine agentenspezifische Überschreibung) ist für einen OpenAI- oder OpenAI Codex-Lauf der GPT-5-Familie auf `"strict-agentic"` gesetzt. Setzen Sie `true`, um das Tool außerhalb dieses Geltungsbereichs zu erzwingen, oder `false`, um es selbst für strict-agentic GPT-5-Läufe deaktiviert zu lassen.
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

- `model`: Standardmodell für erzeugte Sub-Agents. Wenn weggelassen, übernehmen Sub-Agents das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist von Ziel-Agent-IDs für `sessions_spawn`, wenn der anfragende Agent kein eigenes `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
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
  <Accordion title="Auth and merge precedence">
    - Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Authentifizierungsanforderungen.
    - Überschreiben Sie die Agent-Konfigurationswurzel mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem alten Alias für die Umgebungsvariable).
    - Zusammenführungspriorität für übereinstimmende Provider-IDs:
      - Nicht leere Agent-`models.json`-`baseUrl`-Werte haben Vorrang.
      - Nicht leere Agent-`apiKey`-Werte haben nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profile-Kontext nicht SecretRef-verwaltet ist.
      - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkern (`ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert, statt aufgelöste Secrets dauerhaft zu speichern.
      - SecretRef-verwaltete Provider-Headerwerte werden aus Quellmarkern (`secretref-env:ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert.
      - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` in der Konfiguration zurück.
      - Übereinstimmende Modellwerte für `contextWindow`/`maxTokens` verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
      - Übereinstimmende Modellwerte für `contextTokens` behalten eine explizite Laufzeitobergrenze bei, wenn vorhanden; verwenden Sie sie, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
      - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
      - Marker-Persistenz ist quellenautoritativ: Marker werden aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung) geschrieben, nicht aus aufgelösten Runtime-Secret-Werten.

  </Accordion>
</AccordionGroup>

### Details zu Provider-Feldern

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
    - `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID indiziert.
      - Sichere Bearbeitungen: Verwenden Sie `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` lehnt destruktive Ersetzungen ab, außer Sie übergeben `--replace`.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.). Für selbst gehostete `/v1/chat/completions`-Backends wie MLX, vLLM, SGLang und die meisten OpenAI-kompatiblen lokalen Server verwenden Sie `openai-completions`. Ein benutzerdefinierter Provider mit `baseUrl`, aber ohne `api`, verwendet standardmäßig `openai-completions`; setzen Sie `openai-responses` nur, wenn das Backend `/v1/responses` unterstützt.
    - `models.providers.*.apiKey`: Provider-Anmeldedaten (SecretRef-/Env-Substitution bevorzugen).
    - `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standardmäßiges natives Kontextfenster für Modelle unter diesem Provider, wenn der Modelleintag `contextWindow` nicht setzt.
    - `models.providers.*.contextTokens`: standardmäßige effektive Runtime-Kontextobergrenze für Modelle unter diesem Provider, wenn der Modelleintag `contextTokens` nicht setzt.
    - `models.providers.*.maxTokens`: standardmäßige Obergrenze für Ausgabe-Token für Modelle unter diesem Provider, wenn der Modelleintag `maxTokens` nicht setzt.
    - `models.providers.*.timeoutSeconds`: optionaler HTTP-Request-Timeout pro Provider-Modell in Sekunden, einschließlich Verbindung, Header, Body und Behandlung des Abbruchs der gesamten Anfrage.
    - `models.providers.*.injectNumCtxForOpenAICompat`: injiziert für Ollama + `openai-completions` `options.num_ctx` in Anfragen (Standard: `true`).
    - `models.providers.*.authHeader`: erzwingt den Transport von Anmeldedaten im Header `Authorization`, wenn erforderlich.
    - `models.providers.*.baseUrl`: Basis-URL der Upstream-API.
    - `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: Transport-Überschreibungen für HTTP-Anfragen an Modell-Provider.

    - `request.headers`: zusätzliche Header (mit Provider-Standards zusammengeführt). Werte akzeptieren SecretRef.
    - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (integrierte Authentifizierung des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
    - `request.proxy`: HTTP-Proxy-Überschreibung. Modi: `"env-proxy"` (Env-Variablen `HTTP_PROXY`/`HTTPS_PROXY` verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren ein optionales `tls`-Unterobjekt.
    - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: Wenn `true`, HTTPS zu `baseUrl` zulassen, wenn DNS auf private, CGNAT- oder ähnliche Bereiche auflöst, über den HTTP-Fetch-Schutz des Providers (Operator-Opt-in für vertrauenswürdige selbst gehostete OpenAI-kompatible Endpunkte). Loopback-Stream-URLs für Modell-Provider wie `localhost`, `127.0.0.1` und `[::1]` werden automatisch zugelassen, außer dies ist explizit auf `false` gesetzt; LAN-, Tailnet- und private DNS-Hosts erfordern weiterhin Opt-in. WebSocket verwendet dieselbe `request` für Header/TLS, aber nicht dieses Fetch-SSRF-Gate. Standard `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: explizite Modellkatalogeinträge des Providers.
    - `models.providers.*.models.*.input`: Eingabemodalitäten des Modells. Verwenden Sie `["text"]` für reine Textmodelle und `["text", "image"]` für native Bild-/Vision-Modelle. Bildanhänge werden nur dann in Agent-Turns eingefügt, wenn das ausgewählte Modell als bildfähig markiert ist.
    - `models.providers.*.models.*.contextWindow`: Metadaten zum nativen Kontextfenster des Modells. Dies überschreibt das Provider-weite `contextWindow` für dieses Modell.
    - `models.providers.*.models.*.contextTokens`: optionale Runtime-Kontextobergrenze. Dies überschreibt das Provider-weite `contextTokens`; verwenden Sie es, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells wünschen; `openclaw models list` zeigt beide Werte, wenn sie sich unterscheiden.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw zur Laufzeit `false`. Eine leere/ausgelassene `baseUrl` behält das Standardverhalten von OpenAI bei.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für OpenAI-kompatible Chat-Endpunkte, die nur Strings unterstützen. Wenn `true`, glättet OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden der Anfrage zu einfachen Strings.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: Wurzel der Einstellungen für die automatische Bedrock-Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Erkennung ein-/ausschalten.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für die Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für gezielte Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Abfrageintervall für Erkennungsaktualisierungen.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback-Maximum für Ausgabe-Token für erkannte Modelle.

  </Accordion>
</AccordionGroup>

Das interaktive Onboarding benutzerdefinierter Provider leitet Bildeingabe für gängige Vision-Modell-IDs wie GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V und GLM-4V ab und überspringt die zusätzliche Frage für bekannte reine Textfamilien. Bei unbekannten Modell-IDs wird weiterhin nach Bildunterstützung gefragt. Nicht interaktives Onboarding verwendet dieselbe Ableitung; übergeben Sie `--custom-image-input`, um bildfähige Metadaten zu erzwingen, oder `--custom-text-input`, um reine Textmetadaten zu erzwingen.

### Provider-Beispiele

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Das gebündelte Provider-Plugin `cerebras` kann dies über `openclaw onboard --auth-choice cerebras-api-key` konfigurieren. Verwenden Sie eine explizite Provider-Konfiguration nur, wenn Sie Standards überschreiben.

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

    Anthropic-kompatibler integrierter Provider. Abkürzung: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Lokale Modelle (LM Studio)">
    Siehe [Lokale Modelle](/de/gateway/local-models). TL;DR: Führen Sie ein großes lokales Modell über die LM Studio Responses API auf leistungsfähiger Hardware aus; behalten Sie gehostete Modelle als Fallback zusammengeführt.
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

    Setzen Sie `MINIMAX_API_KEY`. Kurzbefehle: `openclaw onboard --auth-choice minimax-global-api` oder `openclaw onboard --auth-choice minimax-cn-api`. Der Modellkatalog verwendet standardmäßig nur M2.7. Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax Thinking standardmäßig, sofern Sie `thinking` nicht ausdrücklich selbst festlegen. `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

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

    Native Moonshot-Endpunkte geben Streaming-Usage-Kompatibilität auf dem gemeinsamen `openai-completions`-Transport an, und OpenClaw leitet dies aus den Endpunktfähigkeiten ab, nicht allein aus der integrierten Provider-ID.

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

    Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` werden als Aliasse akzeptiert. Kurzbefehl: `openclaw onboard --auth-choice zai-api-key`.

    - Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
    - Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
    - Definieren Sie für den allgemeinen Endpunkt einen benutzerdefinierten Provider mit der Basis-URL-Überschreibung.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Konfiguration — Agents](/de/gateway/config-agents)
- [Konfiguration — Kanäle](/de/gateway/config-channels)
- [Konfigurationsreferenz](/de/gateway/configuration-reference) — andere Schlüssel auf oberster Ebene
- [Tools und Plugins](/de/tools)
