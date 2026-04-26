---
read_when:
    - Konfigurieren von Richtlinien, Allowlists oder experimentellen Funktionen für `tools.*`
    - Benutzerdefinierte Provider registrieren oder base URLs überschreiben
    - Einrichten von selbst gehosteten OpenAI-kompatiblen Endpunkten
sidebarTitle: Tools and custom providers
summary: Tools-Konfiguration (Richtlinie, experimentelle Umschalter, Provider-gestützte Tools) und Einrichtung von benutzerdefiniertem Provider/base-URL
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-04-26T11:28:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*`-Konfigurationsschlüssel und Einrichtung von benutzerdefinierten Providern / base URL. Für Agents, Kanäle und andere Konfigurationsschlüssel der obersten Ebene siehe [Configuration reference](/de/gateway/configuration-reference).

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist vor `tools.allow`/`tools.deny`:

<Note>
Lokales Onboarding setzt bei neuen lokalen Konfigurationen standardmäßig `tools.profile: "coding"`, wenn nichts gesetzt ist (bestehende explizite Profile bleiben erhalten).
</Note>

| Profil      | Enthält                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                         |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                      |
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

Globale Richtlinie zum Erlauben/Verweigern von Tools (Verweigern hat Vorrang). Groß-/Kleinschreibung wird ignoriert, `*`-Wildcards werden unterstützt. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

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

Steuert erhöhten Exec-Zugriff außerhalb der Sandbox:

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
- Erhöhtes `exec` umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).

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

Sicherheitsprüfungen für Tool-Schleifen sind standardmäßig **deaktiviert**. Setzen Sie `enabled: true`, um die Erkennung zu aktivieren. Einstellungen können global in `tools.loopDetection` definiert und pro Agent unter `agents.list[].tools.loopDetection` überschrieben werden.

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
  Maximale Tool-Call-Historie, die für die Schleifenanalyse aufbewahrt wird.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Schwellenwert für Warnungen bei sich wiederholenden Mustern ohne Fortschritt.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Höherer Wiederholungsschwellenwert zum Blockieren kritischer Schleifen.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Schwellenwert für einen harten Stopp bei jedem Lauf ohne Fortschritt.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Warnt bei wiederholten Aufrufen desselben Tools mit denselben Argumenten.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Warnt/blockiert bei bekannten Poll-Tools (`process.poll`, `command_status` usw.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Warnt/blockiert bei alternierenden Mustern ohne Fortschritt zwischen Paaren.
</ParamField>

<Warning>
Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold`, schlägt die Validierung fehl.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // oder BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; weglassen für automatische Erkennung
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
        directSend: false, // Opt-in: fertiggestellte asynchrone Musik/Videos direkt an den Kanal senden
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
  <Accordion title="Felder für Medieneinträge von Modellen">
    **Provider-Eintrag** (`type: "provider"` oder weggelassen):

    - `provider`: ID des API-Providers (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
    - `model`: Überschreibung der Modell-ID
    - `profile` / `preferredProfile`: Profilauswahl in `auth-profiles.json`

    **CLI-Eintrag** (`type: "cli"`):

    - `command`: auszuführende Datei
    - `args`: Vorlagen-Args (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

    **Gemeinsame Felder:**

    - `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
    - Bei Fehlern wird auf den nächsten Eintrag zurückgefallen.

    Provider-Auth folgt der Standardreihenfolge: `auth-profiles.json` → Env-Variablen → `models.providers.*.apiKey`.

    **Felder für asynchronen Abschluss:**

    - `asyncCompletion.directSend`: wenn `true`, versuchen abgeschlossene asynchrone Aufgaben `music_generate` und `video_generate` zuerst die direkte Kanalzustellung. Standard: `false` (Legacy-Pfad über Wecksignal der anfordernden Sitzung/Modellzustellung).

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

Steuert, welche Sitzungen von den Sitzungs-Tools (`sessions_list`, `sessions_history`, `sessions_send`) als Ziel verwendet werden können.

Standard: `tree` (aktuelle Sitzung + von ihr gestartete Sitzungen, wie Subagents).

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
    - `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Subagents).
    - `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn Sie pro Absender Sitzungen unter derselben Agent-ID ausführen).
    - `all`: jede Sitzung. Agent-übergreifende Zielverwendung erfordert weiterhin `tools.agentToAgent`.
    - Sandbox-Klammerung: Wenn die aktuelle Sitzung in einer Sandbox läuft und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge bei `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // Opt-in: auf true setzen, um Inline-Dateianhänge zu erlauben
        maxTotalBytes: 5242880, // insgesamt 5 MB über alle Dateien
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB pro Datei
        retainOnSessionKeep: false, // Anhänge beibehalten, wenn cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Hinweise zu Anhängen">
    - Anhänge werden nur für `runtime: "subagent"` unterstützt. Die ACP-Laufzeit lehnt sie ab.
    - Dateien werden im Workspace des untergeordneten Prozesses unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
    - Der Inhalt von Anhängen wird automatisch aus der dauerhaften Speicherung des Transkripts geschwärzt.
    - Base64-Eingaben werden mit strengen Prüfungen von Alphabet/Padding und einer Größenprüfung vor dem Decoding validiert.
    - Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
    - Die Bereinigung folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur bei, wenn `retainOnSessionKeep: true` gesetzt ist.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle Flags für integrierte Tools. Standardmäßig deaktiviert, außer wenn eine Auto-Aktivierungsregel für strikt agentisches GPT-5 greift.

```json5
{
  tools: {
    experimental: {
      planTool: true, // experimentelles update_plan aktivieren
    },
  },
}
```

- `planTool`: aktiviert das strukturierte Tool `update_plan` zur Nachverfolgung nicht trivialer Arbeit in mehreren Schritten.
- Standard: `false`, außer `agents.defaults.embeddedPi.executionContract` (oder eine Überschreibung pro Agent) ist für einen Lauf der GPT-5-Familie von OpenAI oder OpenAI Codex auf `"strict-agentic"` gesetzt. Setzen Sie `true`, um das Tool außerhalb dieses Bereichs zwangsweise zu aktivieren, oder `false`, um es auch bei strikt agentischen GPT-5-Läufen deaktiviert zu halten.
- Wenn aktiviert, fügt der System-Prompt außerdem Nutzungshinweise hinzu, sodass das Modell es nur für substanzielle Arbeit verwendet und höchstens einen Schritt als `in_progress` behält.

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

- `model`: Standardmodell für gestartete Sub-Agents. Wenn weggelassen, übernehmen Sub-Agents das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist von Ziel-Agent-IDs für `sessions_spawn`, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und base URLs

OpenClaw verwendet den integrierten Modellkatalog. Fügen Sie benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

```json5
{
  models: {
    mode: "merge", // merge (Standard) | replace
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
  <Accordion title="Authentifizierung und Merge-Priorität">
    - Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Auth-Anforderungen.
    - Überschreiben Sie das Root-Verzeichnis der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, ein älterer Alias für Umgebungsvariablen).
    - Merge-Priorität für übereinstimmende Provider-IDs:
      - Nicht leere `baseUrl`-Werte in der `models.json` des Agent haben Vorrang.
      - Nicht leere `apiKey`-Werte des Agent haben nur dann Vorrang, wenn dieser Provider im aktuellen Kontext von config/Auth-Profilen nicht durch SecretRef verwaltet wird.
      - Durch SecretRef verwaltete `apiKey`-Werte von Providern werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs), statt aufgelöste Secrets dauerhaft zu speichern.
      - Durch SecretRef verwaltete Header-Werte von Providern werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs).
      - Leeres oder fehlendes `apiKey`/`baseUrl` des Agent fällt auf `models.providers` in der Konfiguration zurück.
      - Bei übereinstimmenden Modellen verwenden `contextWindow`/`maxTokens` den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
      - Bei übereinstimmenden Modellen bewahrt `contextTokens` eine explizite Laufzeitobergrenze, wenn vorhanden; verwenden Sie dies, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
      - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
      - Die Persistenz von Markern ist quellmaßgeblich: Marker werden aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung) geschrieben, nicht aus aufgelösten Secret-Werten der Laufzeit.
  </Accordion>
</AccordionGroup>

### Details zu Provider-Feldern

<AccordionGroup>
  <Accordion title="Katalog auf oberster Ebene">
    - `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
    - `models.providers`: benutzerdefinierte Provider-Map, mit Provider-ID als Schlüssel.
      - Sichere Bearbeitungen: Verwenden Sie `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` verweigert destruktive Ersetzungen, sofern Sie nicht `--replace` übergeben.
  </Accordion>
  <Accordion title="Provider-Verbindung und Auth">
    - `models.providers.*.api`: Anfrage-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
    - `models.providers.*.apiKey`: Provider-Zugangsdaten (bevorzugt SecretRef/Env-Substitution verwenden).
    - `models.providers.*.auth`: Auth-Strategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions`, `options.num_ctx` in Anfragen injizieren (Standard: `true`).
    - `models.providers.*.authHeader`: Übertragung der Zugangsdaten im Header `Authorization` erzwingen, wenn erforderlich.
    - `models.providers.*.baseUrl`: base URL der Upstream-API.
    - `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Mandanten-Routing.
  </Accordion>
  <Accordion title="Überschreibungen des Request-Transports">
    `models.providers.*.request`: Überschreibungen des Transports für HTTP-Anfragen an Modell-Provider.

    - `request.headers`: zusätzliche Header (werden mit den Standardwerten des Providers zusammengeführt). Werte akzeptieren SecretRef.
    - `request.auth`: Überschreibung der Auth-Strategie. Modi: `"provider-default"` (eingebaute Auth des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
    - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (Env-Variablen `HTTP_PROXY`/`HTTPS_PROXY` verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren optional ein Unterobjekt `tls`.
    - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: wenn `true`, HTTPS zu `baseUrl` erlauben, wenn DNS auf private, CGNAT- oder ähnliche Bereiche auflöst, über den HTTP-Fetch-Schutz des Providers (Opt-in des Operators für vertrauenswürdige selbst gehostete OpenAI-kompatible Endpunkte). WebSocket verwendet dasselbe `request` für Header/TLS, aber nicht diesen Fetch-SSRF-Schutz. Standard `false`.

  </Accordion>
  <Accordion title="Einträge im Modellkatalog">
    - `models.providers.*.models`: explizite Einträge des Provider-Modellkatalogs.
    - `models.providers.*.models.*.contextWindow`: native Modellmetadaten zum Kontextfenster.
    - `models.providers.*.models.*.contextTokens`: optionale Laufzeitobergrenze für Kontext. Verwenden Sie dies, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells möchten; `openclaw models list` zeigt beide Werte an, wenn sie voneinander abweichen.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Leere/fehlende `baseUrl` behält das Standardverhalten von OpenAI bei.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für OpenAI-kompatible Chat-Endpunkte, die nur Strings unterstützen. Wenn `true`, glättet OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden der Anfrage zu einfachen Strings.
  </Accordion>
  <Accordion title="Amazon Bedrock Discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: Root der Einstellungen für Bedrock-Autodiscovery.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Discovery ein-/ausschalten.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für Discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für gezielte Discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für die Aktualisierung der Discovery.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für entdeckte Modelle.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Output-Tokens bei entdeckten Modellen.
  </Accordion>
</AccordionGroup>

### Provider-Beispiele

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Verwenden Sie `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für direkte Nutzung von Z.AI.

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

    Anthropic-kompatibel, integrierter Provider. Kurzform: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Lokale Modelle (LM Studio)">
    Siehe [Local Models](/de/gateway/local-models). Kurz gesagt: Führen Sie ein großes lokales Modell über die Responses API von LM Studio auf leistungsfähiger Hardware aus; lassen Sie gehostete Modelle als Fallback zusammengeführt.
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

    Setzen Sie `MINIMAX_API_KEY`. Kurzformen: `openclaw onboard --auth-choice minimax-global-api` oder `openclaw onboard --auth-choice minimax-cn-api`. Der Modellkatalog verwendet standardmäßig nur M2.7. Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw standardmäßig MiniMax-Thinking, sofern Sie `thinking` nicht selbst explizit setzen. `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

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

    Native Moonshot-Endpunkte werben mit Streaming-Nutzungskompatibilität auf dem gemeinsamen Transport `openai-completions`, und OpenClaw macht dies an den Endpunktfunktionen fest und nicht allein an der ID des integrierten Providers.

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

    Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie Refs `opencode/...` für den Zen-Katalog oder Refs `opencode-go/...` für den Go-Katalog. Kurzform: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

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

    Die base URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kurzform: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` werden als Aliasse akzeptiert. Kurzform: `openclaw onboard --auth-choice zai-api-key`.

    - Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
    - Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
    - Für den allgemeinen Endpunkt definieren Sie einen benutzerdefinierten Provider mit der Überschreibung der base URL.

  </Accordion>
</AccordionGroup>

---

## Verwandt

- [Konfiguration — Agents](/de/gateway/config-agents)
- [Konfiguration — Kanäle](/de/gateway/config-channels)
- [Configuration reference](/de/gateway/configuration-reference) — andere Schlüssel der obersten Ebene
- [Tools und Plugins](/de/tools)
