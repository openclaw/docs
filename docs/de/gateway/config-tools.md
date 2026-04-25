---
read_when:
    - Richtlinie, Allowlists oder experimentelle Funktionen für ``tools.*`` konfigurieren
    - Benutzerdefinierte Provider registrieren oder base-URLs überschreiben
    - OpenAI-kompatible selbstgehostete Endpunkte einrichten
summary: Tools-Konfiguration (Richtlinie, experimentelle Toggles, Provider-gestützte Tools) und Einrichtung benutzerdefinierter Provider/base-URL
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-04-25T13:45:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d63b080550a6c95d714d3bb42c2b079368040aa09378d88c2e498ccd5ec113c1
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*`-Konfigurationsschlüssel und Einrichtung benutzerdefinierter Provider / base-URL. Für Agenten,
Kanäle und andere Konfigurationsschlüssel der obersten Ebene siehe
[Konfigurationsreferenz](/de/gateway/configuration-reference).

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist vor `tools.allow`/`tools.deny`:

Lokales Onboarding setzt bei neuen lokalen Konfigurationen standardmäßig `tools.profile: "coding"`, wenn es nicht gesetzt ist (bestehende explizite Profile bleiben erhalten).

| Profil      | Enthält                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                        |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                          |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                    |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                             |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                     |
| `group:ui`         | `browser`, `canvas`                                                                                                       |
| `group:automation` | `cron`, `gateway`                                                                                                         |
| `group:messaging`  | `message`                                                                                                                 |
| `group:nodes`      | `nodes`                                                                                                                   |
| `group:agents`     | `agents_list`                                                                                                             |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                        |
| `group:openclaw`   | Alle integrierten Tools (ohne Provider-Plugins)                                                                           |

### `tools.allow` / `tools.deny`

Globale Allow-/Deny-Richtlinie für Tools (deny gewinnt). Groß-/Kleinschreibung wird ignoriert, `*`-Wildcards werden unterstützt. Gilt auch dann, wenn die Docker-Sandbox deaktiviert ist.

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

- Der Override pro Agent (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Zustand pro Sitzung; Inline-Direktiven gelten für eine einzelne Nachricht.
- Erhöhtes `exec` umgeht die Sandbox und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das `exec`-Ziel `node` ist).

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

Sicherheitsprüfungen für Tool-Schleifen sind **standardmäßig deaktiviert**. Setze `enabled: true`, um die Erkennung zu aktivieren.
Einstellungen können global in `tools.loopDetection` definiert und pro Agent unter `agents.list[].tools.loopDetection` überschrieben werden.

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

- `historySize`: maximale Tool-Call-Historie, die für die Schleifenanalyse gespeichert wird.
- `warningThreshold`: Schwellenwert für Warnungen bei wiederholten Mustern ohne Fortschritt.
- `criticalThreshold`: höherer Wiederholungsschwellenwert zum Blockieren kritischer Schleifen.
- `globalCircuitBreakerThreshold`: harter Stopp-Schwellenwert für jeden Lauf ohne Fortschritt.
- `detectors.genericRepeat`: warnt bei wiederholten Aufrufen desselben Tools mit denselben Argumenten.
- `detectors.knownPollNoProgress`: warnt/blockiert bei bekannten Poll-Tools (`process.poll`, `command_status` usw.).
- `detectors.pingPong`: warnt/blockiert bei alternierenden Paarmustern ohne Fortschritt.
- Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold`, schlägt die Validierung fehl.

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
        directSend: false, // Opt-in: abgeschlossene asynchrone Musik/Videos direkt an den Kanal senden
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

<Accordion title="Felder für Medienmodell-Einträge">

**Provider-Eintrag** (`type: "provider"` oder weggelassen):

- `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
- `model`: Override der Modell-ID
- `profile` / `preferredProfile`: Profilauswahl aus `auth-profiles.json`

**CLI-Eintrag** (`type: "cli"`):

- `command`: auszuführende Datei
- `args`: template-basierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

**Gemeinsame Felder:**

- `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → Bild, `google` → Bild+Audio+Video, `groq` → Audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Overrides pro Eintrag.
- Bei Fehlern wird auf den nächsten Eintrag zurückgefallen.

Provider-Auth folgt der Standardreihenfolge: `auth-profiles.json` → env vars → `models.providers.*.apiKey`.

**Felder für asynchronen Abschluss:**

- `asyncCompletion.directSend`: wenn `true`, versuchen abgeschlossene asynchrone `music_generate`-
  und `video_generate`-Aufgaben zuerst eine direkte Zustellung an den Kanal. Standard: `false`
  (älterer Pfad über das Aufwecken der anfordernden Sitzung / Modellzustellung).

</Accordion>

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

Steuert, welche Sitzungen von den Sitzungs-Tools (`sessions_list`, `sessions_history`, `sessions_send`) angesprochen werden können.

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

Hinweise:

- `self`: nur der aktuelle Sitzungsschlüssel.
- `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Subagents).
- `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn du Sitzungen pro Absender unter derselben Agent-ID ausführst).
- `all`: jede Sitzung. Agent-übergreifendes Targeting erfordert weiterhin `tools.agentToAgent`.
- Sandbox-Clamp: Wenn die aktuelle Sitzung sandboxed ist und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gesetzt ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.

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
        retainOnSessionKeep: false, // Anhänge behalten, wenn cleanup="keep"
      },
    },
  },
}
```

Hinweise:

- Anhänge werden nur für `runtime: "subagent"` unterstützt. ACP-Laufzeit lehnt sie ab.
- Dateien werden im Child-Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
- Anhangsinhalte werden automatisch aus der Persistierung von Transkripten redigiert.
- Base64-Eingaben werden mit strikter Prüfung von Alphabet/Padding und einer Größenprüfung vor dem Dekodieren validiert.
- Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
- Die Bereinigung folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur, wenn `retainOnSessionKeep: true` gesetzt ist.

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle integrierte Tool-Flags. Standardmäßig deaktiviert, sofern keine strikte agentische GPT-5-Regel zur automatischen Aktivierung greift.

```json5
{
  tools: {
    experimental: {
      planTool: true, // experimentelles update_plan aktivieren
    },
  },
}
```

Hinweise:

- `planTool`: aktiviert das strukturierte Tool `update_plan` zur Nachverfolgung nicht trivialer Arbeit in mehreren Schritten.
- Standard: `false`, außer wenn `agents.defaults.embeddedPi.executionContract` (oder ein Override pro Agent) für einen OpenAI- oder OpenAI-Codex-GPT-5-Familienlauf auf `"strict-agentic"` gesetzt ist. Setze `true`, um das Tool außerhalb dieses Bereichs zu erzwingen, oder `false`, um es selbst für strikt agentische GPT-5-Läufe deaktiviert zu halten.
- Wenn es aktiviert ist, fügt der System-Prompt auch Nutzungshinweise hinzu, sodass das Modell es nur für substanziellere Arbeit verwendet und höchstens einen Schritt als `in_progress` behält.

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

- `model`: Standardmodell für gestartete Sub-Agents. Wenn weggelassen, erben Sub-Agents das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist der Ziel-Agent-IDs für `sessions_spawn`, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und base-URLs

OpenClaw verwendet den integrierten Modellkatalog. Füge benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

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

- Verwende `authHeader: true` + `headers` für benutzerdefinierte Auth-Anforderungen.
- Überschreibe das Root-Verzeichnis der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem Legacy-Umgebungsvariablen-Alias).
- Merge-Priorität bei übereinstimmenden Provider-IDs:
  - Nicht leere `baseUrl`-Werte in der Agent-`models.json` haben Vorrang.
  - Nicht leere Agent-`apiKey`-Werte haben nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profil-Kontext nicht per SecretRef verwaltet wird.
  - Per SecretRef verwaltete Provider-`apiKey`-Werte werden aus Quell-Markern aktualisiert (`ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs), anstatt aufgelöste Secrets zu persistieren.
  - Per SecretRef verwaltete Provider-Header-Werte werden aus Quell-Markern aktualisiert (`secretref-env:ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs).
  - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` in der Konfiguration zurück.
  - Übereinstimmende Modell-`contextWindow`/`maxTokens` verwenden den höheren Wert zwischen expliziter Konfiguration und impliziten Katalogwerten.
  - Übereinstimmende Modell-`contextTokens` bewahren eine explizite Laufzeitbegrenzung, wenn vorhanden; verwende dies, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
  - Verwende `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
  - Die Persistierung von Markern ist quellenautoritatativ: Marker werden aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Secret-Werten.

### Details zu Provider-Feldern

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Map, nach Provider-ID indiziert.
  - Sichere Bearbeitungen: Verwende `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` verweigert destruktive Ersetzungen, sofern du nicht `--replace` übergibst.
- `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
- `models.providers.*.apiKey`: Provider-Zugangsdaten (bevorzugt SecretRef/env-Substitution).
- `models.providers.*.auth`: Auth-Strategie (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: Für Ollama + `openai-completions` `options.num_ctx` in Requests injizieren (Standard: `true`).
- `models.providers.*.authHeader`: Credential-Transport bei Bedarf im Header `Authorization` erzwingen.
- `models.providers.*.baseUrl`: Upstream-API-base-URL.
- `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.
- `models.providers.*.request`: Transport-Overrides für HTTP-Requests des Modell-Providers.
  - `request.headers`: zusätzliche Header (mit Provider-Standards gemergt). Werte akzeptieren SecretRef.
  - `request.auth`: Override der Auth-Strategie. Modi: `"provider-default"` (integrierte Auth des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
  - `request.proxy`: Override für HTTP-Proxy. Modi: `"env-proxy"` ( `HTTP_PROXY`/`HTTPS_PROXY` env vars verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren optional ein Unterobjekt `tls`.
  - `request.tls`: TLS-Override für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: wenn `true`, HTTPS zu `baseUrl` erlauben, wenn DNS zu privaten, CGNAT- oder ähnlichen Bereichen auflöst, über den Provider-HTTP-Fetch-Guard (Opt-in des Operators für vertrauenswürdige selbstgehostete OpenAI-kompatible Endpunkte). WebSocket verwendet dieselbe `request` für Header/TLS, aber nicht dieses Fetch-SSRF-Gate. Standard `false`.
- `models.providers.*.models`: explizite Katalogeinträge für Provider-Modelle.
- `models.providers.*.models.*.contextWindow`: native Metadaten zum Kontextfenster des Modells.
- `models.providers.*.models.*.contextTokens`: optionale Laufzeit-Kontextbegrenzung. Verwende dies, wenn du ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells möchtest; `openclaw models list` zeigt beide Werte an, wenn sie sich unterscheiden.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit nicht leerer, nicht nativer `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Leere/weggelassene `baseUrl` behält das Standardverhalten von OpenAI bei.
- `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für nur String-basierte OpenAI-kompatible Chat-Endpunkte. Wenn `true`, flacht OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden der Anfrage zu einfachen Strings ab.
- `plugins.entries.amazon-bedrock.config.discovery`: Root für Bedrock-Auto-Discovery-Einstellungen.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Discovery ein-/ausschalten.
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Filter nach Provider-ID für gezielte Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für das Aktualisieren der Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für entdeckte Modelle.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Output-Tokens für entdeckte Modelle.

### Provider-Beispiele

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

Verwende `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für direktes Z.AI.

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

Setze `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwende `opencode/...`-Refs für den Zen-Katalog oder `opencode-go/...`-Refs für den Go-Katalog. Kurzform: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

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

Setze `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` sind akzeptierte Aliasse. Kurzform: `openclaw onboard --auth-choice zai-api-key`.

- Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
- Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
- Für den allgemeinen Endpunkt definiere einen benutzerdefinierten Provider mit dem Override der base-URL.

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

Native Moonshot-Endpunkte melden Streaming-Usage-Kompatibilität auf dem gemeinsamen
Transport `openai-completions`, und OpenClaw koppelt dies an die Endpunkt-Fähigkeiten
statt allein an die integrierte Provider-ID.

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

Anthropic-kompatibler integrierter Provider. Kurzform: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Die base-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kurzform: `openclaw onboard --auth-choice synthetic-api-key`.

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

Setze `MINIMAX_API_KEY`. Kurzformen:
`openclaw onboard --auth-choice minimax-global-api` oder
`openclaw onboard --auth-choice minimax-cn-api`.
Der Modellkatalog verwendet standardmäßig nur M2.7.
Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking
standardmäßig, sofern du `thinking` nicht ausdrücklich selbst setzt. `/fast on` oder
`params.fastMode: true` schreibt `MiniMax-M2.7` zu
`MiniMax-M2.7-highspeed` um.

</Accordion>

<Accordion title="Lokale Modelle (LM Studio)">

Siehe [Local Models](/de/gateway/local-models). Kurzfassung: Führe ein großes lokales Modell über die Responses API von LM Studio auf leistungsfähiger Hardware aus; behalte gehostete Modelle für Fallbacks zusammengeführt.

</Accordion>

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — andere Top-Level-Schlüssel
- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Konfiguration — Kanäle](/de/gateway/config-channels)
- [Tools und Plugins](/de/tools)
