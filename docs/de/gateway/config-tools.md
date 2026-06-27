---
read_when:
    - Konfigurieren von `tools.*`-Richtlinien, Allowlists oder experimentellen Funktionen
    - Registrieren benutzerdefinierter Provider oder Überschreiben von Basis-URLs
    - Einrichten OpenAI-kompatibler selbst gehosteter Endpunkte
sidebarTitle: Tools and custom providers
summary: Tools-Konfiguration (Policy, experimentelle Umschalter, Provider-gestützte Tools) und benutzerdefinierte Einrichtung von Provider-/Basis-URLs
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-06-27T17:28:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-Konfigurationsschlüssel und benutzerdefinierte Provider-/Base-URL-Einrichtung. Für Agents, Kanäle und andere Konfigurationsschlüssel auf oberster Ebene siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Tools

### Tool-Profile

`tools.profile` legt eine Basis-Allowlist vor `tools.allow`/`tools.deny` fest:

<Note>
Lokales Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn kein Wert gesetzt ist (bestehende explizite Profile bleiben erhalten).
</Note>

| Profil      | Enthält                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                                           |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Alle integrierten Tools (ohne Provider-Plugins)                                                                         |
| `group:plugins`    | Tools, die geladenen Plugins gehören, einschließlich konfigurierter MCP-Server, die über `bundle-mcp` bereitgestellt werden |

### MCP- und Plugin-Tools innerhalb der Sandbox-Tool-Richtlinie

Konfigurierte MCP-Server werden unter der Plugin-ID `bundle-mcp` als Plugin-eigene Tools bereitgestellt. Normale Tool-Profile können sie erlauben, aber `tools.sandbox.tools` ist ein zusätzliches Gate für sandboxed Sitzungen. Wenn der Sandbox-Modus `"all"` oder `"non-main"` ist, nehmen Sie einen dieser Einträge in die Sandbox-Tool-Allowlist auf, wenn MCP-/Plugin-Tools sichtbar sein sollen:

- `bundle-mcp` für von OpenClaw verwaltete MCP-Server aus `mcp.servers`
- die Plugin-ID für ein bestimmtes natives Plugin
- `group:plugins` für alle geladenen Plugin-eigenen Tools
- exakte MCP-Server-Tool-Namen oder Server-Globs wie `outlook__send_mail` oder `outlook__*`, wenn Sie nur einen Server möchten

Server-Globs verwenden das Provider-sichere MCP-Server-Präfix, nicht zwingend den unveränderten `mcp.servers`-Schlüssel. Nicht-`[A-Za-z0-9_-]`-Zeichen werden zu `-`, Namen, die nicht mit einem Buchstaben beginnen, erhalten ein `mcp-`-Präfix, und lange oder doppelte Präfixe können gekürzt oder mit einem Suffix versehen werden; zum Beispiel verwendet `mcp.servers["Outlook Graph"]` einen Glob wie `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Ohne diesen Eintrag auf Sandbox-Ebene kann der MCP-Server weiterhin erfolgreich geladen werden, während seine Tools vor der Provider-Anfrage herausgefiltert werden. Verwenden Sie `openclaw doctor`, um diese Form für von OpenClaw verwaltete Server in `mcp.servers` zu erkennen. MCP-Server, die aus gebündelten Plugin-Manifesten oder Claude `.mcp.json` geladen werden, verwenden dasselbe Sandbox-Gate, aber diese Diagnose listet diese Quellen noch nicht auf; verwenden Sie dieselben Allowlist-Einträge, wenn deren Tools in sandboxed Turns verschwinden.

### `tools.codeMode`

`tools.codeMode` aktiviert die generische Code-Mode-Oberfläche von OpenClaw. Wenn sie
für einen Lauf mit Tools aktiviert ist, sieht das Modell nur `exec` und `wait`; normale OpenClaw-
Tools werden hinter die In-Sandbox-Katalog-Bridge `tools.*` verschoben, und MCP-Tools sind
über den generierten Namespace `MCP` verfügbar.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Die Kurzform wird ebenfalls akzeptiert:

```json5
{
  tools: { codeMode: true },
}
```

MCP-Deklarationen werden im Code-Modus über die schreibgeschützte virtuelle API-Dateioberfläche
bereitgestellt. Gastcode kann `API.list("mcp")` und
`API.read("mcp/<server>.d.ts")` aufrufen, um TypeScript-artige Signaturen zu prüfen, bevor
`MCP.<server>.<tool>()` aufgerufen wird. Siehe [Code-Modus](/de/reference/code-mode) für den
Runtime-Vertrag, Grenzen und Debugging-Schritte.

### `tools.allow` / `tools.deny`

Globale Allow-/Deny-Richtlinie für Tools (Deny gewinnt). Groß-/Kleinschreibung wird ignoriert, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox ausgeschaltet ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` und `apply_patch` sind separate Tool-IDs. `allow: ["write"]` aktiviert bei kompatiblen Modellen auch `apply_patch`, aber `deny: ["write"]` sperrt `apply_patch` nicht. Um alle Dateiänderungen zu blockieren, sperren Sie `group:fs` oder listen Sie jedes mutierende Tool explizit auf:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Schränkt Tools für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Provider-Profil → Allow/Deny.

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

### `tools.toolsBySender`

Schränkt Tools für eine bestimmte Identität des Anfragenden ein. Dies ist Defense-in-Depth zusätzlich zur Kanal-Zugriffskontrolle; Sender-Werte müssen vom Kanaladapter stammen, nicht aus dem Nachrichtentext.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Schlüssel verwenden explizite Präfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oder `"*"`. Kanal-IDs sind kanonische OpenClaw-IDs; Aliase wie `teams` werden zu `msteams` normalisiert. Legacy-Schlüssel ohne Präfix werden nur als `id:` akzeptiert. Die Matching-Reihenfolge ist channel+id, id, e164, username, name, dann Wildcard.

`agents.list[].tools.toolsBySender` pro Agent überschreibt den globalen Sender-Match, wenn es passt, auch mit einer leeren Richtlinie `{}`.

### `tools.elevated`

Steuert erhöhten exec-Zugriff außerhalb der Sandbox:

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

- Eine Überschreibung pro Agent (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Zustand pro Sitzung; Inline-Direktiven gelten für eine einzelne Nachricht.
- Erhöhtes `exec` umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das exec-Ziel `node` ist).

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
      commandHighlighting: false,
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
  Maximale Tool-Aufrufhistorie, die für die Schleifenanalyse aufbewahrt wird.
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
  Warnt/blockiert bei alternierenden Paarmustern ohne Fortschritt.
</ParamField>

<Warning>
Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold` ist, schlägt die Validierung fehl.
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

Konfiguriert das Verstehen eingehender Medien (Bild/Audio/Video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
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
  <Accordion title="Media model entry fields">
    **Provider-Eintrag** (`type: "provider"` oder weggelassen):

    - `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
    - `model`: Überschreibung der Modell-ID
    - `profile` / `preferredProfile`: Profilauswahl aus `auth-profiles.json`

    **CLI-Eintrag** (`type: "cli"`):

    - `command`: auszuführbares Programm
    - `args`: vorlagenbasierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.; `openclaw doctor --fix` migriert veraltete `{input}`-Platzhalter zu `{{MediaPath}}`)

    **Gemeinsame Felder:**

    - `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → Bild, `google` → Bild+Audio+Video, `groq` → Audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
    - `tools.media.image.timeoutSeconds` und passende `timeoutSeconds`-Einträge für Bildmodelle gelten auch, wenn der Agent das explizite `image`-Tool aufruft. Für Bildverständnis gilt dieses Timeout für die Anfrage selbst und wird nicht durch vorherige Vorbereitungsarbeit reduziert.
    - Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

    Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Umgebungsvariablen → `models.providers.*.apiKey`.

    **Felder für asynchrone Completion:**

    - `asyncCompletion.directSend`: veraltetes Kompatibilitäts-Flag. Abgeschlossene asynchrone Medienaufgaben bleiben über die Sitzung des Anfragenden vermittelt, damit der Agent das Ergebnis erhält, entscheidet, wie er den Benutzer informiert, und das Nachrichten-Tool verwendet, wenn die Zustellung über die Quelle dies erfordert.

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

Standard: `tree` (aktuelle Sitzung + von ihr gestartete Sitzungen, zum Beispiel Subagents).

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
  <Accordion title="Visibility scopes">
    - `self`: nur der aktuelle Sitzungsschlüssel.
    - `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Subagents).
    - `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn Sie Sitzungen pro Absender unter derselben Agent-ID ausführen).
    - `all`: jede Sitzung. Agent-übergreifendes Targeting erfordert weiterhin `tools.agentToAgent`.
    - Sandbox-Begrenzung: Wenn die aktuelle Sitzung in einer Sandbox ausgeführt wird und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gesetzt ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gilt.
    - Wenn nicht `all`, enthält `sessions_list` ein kompaktes `visibility`-Feld,
      das den effektiven Modus beschreibt, sowie eine Warnung, dass einige Sitzungen
      außerhalb des aktuellen Geltungsbereichs ausgelassen werden können.

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
  <Accordion title="Attachment notes">
    - Anhänge erfordern `enabled: true`.
    - Subagent-Anhänge werden im untergeordneten Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
    - ACP-Anhänge sind ausschließlich Bilder und werden inline an die ACP-Runtime weitergeleitet, nachdem dieselben Grenzwerte für Dateianzahl, Bytes pro Datei und Gesamtbytes bestanden wurden.
    - Anhangsinhalte werden automatisch aus der Transkript-Persistenz redigiert.
    - Base64-Eingaben werden mit strengen Alphabet-/Padding-Prüfungen und einem Größenwächter vor dem Dekodieren validiert.
    - Dateiberechtigungen für Subagent-Anhänge sind `0700` für Verzeichnisse und `0600` für Dateien.
    - Die Subagent-Bereinigung folgt der `cleanup`-Richtlinie: `delete` entfernt Anhänge immer; `keep` behält sie nur bei, wenn `retainOnSessionKeep: true` gesetzt ist.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle Flags für integrierte Tools. Standardmäßig deaktiviert, außer es greift eine Auto-Aktivierungsregel für strikt-agentische GPT-5-Läufe.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: aktiviert das strukturierte Tool `update_plan` zur Nachverfolgung nicht-trivialer mehrstufiger Arbeit.
- Standard: `false`, außer `agents.defaults.embeddedAgent.executionContract` (oder eine Überschreibung pro Agent) ist für einen Lauf der OpenAI- oder OpenAI-Codex-GPT-5-Familie auf `"strict-agentic"` gesetzt. Setzen Sie `true`, um das Tool außerhalb dieses Geltungsbereichs zu erzwingen, oder `false`, um es selbst für strikt-agentische GPT-5-Läufe deaktiviert zu lassen.
- Wenn aktiviert, fügt der System-Prompt außerdem Nutzungshinweise hinzu, damit das Modell es nur für umfangreiche Arbeit verwendet und höchstens einen Schritt auf `in_progress` hält.

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
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: Standardmodell für gestartete Sub-Agents. Wenn ausgelassen, erben Sub-Agents das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist konfigurierter Ziel-Agent-IDs für `sessions_spawn`, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` setzt (`["*"]` = jedes konfigurierte Ziel; Standard: nur derselbe Agent). Veraltete Einträge, deren Agent-Konfiguration gelöscht wurde, werden von `sessions_spawn` abgelehnt und aus `agents_list` ausgelassen; führen Sie `openclaw doctor --fix` aus, um sie zu bereinigen.
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`. `0` bedeutet kein Timeout.
- `announceTimeoutMs`: Timeout pro Aufruf (Millisekunden) für Gateway-`agent`-Zustellversuche von Announcements. Standard: `120000`. Vorübergehende Wiederholungen können dazu führen, dass die gesamte Wartezeit auf das Announcement länger als ein konfigurierter Timeout ist.
- Tool-Richtlinie pro Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und Basis-URLs

Provider-Plugins veröffentlichen ihre eigenen Modellkatalog-Zeilen. Fügen Sie benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

Die Konfiguration einer `baseUrl` für einen benutzerdefinierten/lokalen Provider ist zugleich die enge Netzwerk-Vertrauensentscheidung für Modell-HTTP-Anfragen: OpenClaw lässt genau diesen `scheme://host:port`-Ursprung durch den geschützten Fetch-Pfad zu, ohne eine separate Konfigurationsoption hinzuzufügen oder anderen privaten Ursprüngen zu vertrauen.

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
    - Überschreiben Sie den Stamm der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR`.
    - Merge-Priorität für übereinstimmende Provider-IDs:
      - Nicht leere `baseUrl`-Werte in `models.json` des Agents haben Vorrang.
      - Nicht leere `apiKey`-Werte des Agents haben nur Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Authentifizierungsprofil-Kontext nicht SecretRef-verwaltet ist.
      - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkierungen (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert, statt aufgelöste Secrets zu persistieren.
      - SecretRef-verwaltete Provider-Headerwerte werden aus Quellmarkierungen (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs) aktualisiert.
      - Leere oder fehlende `apiKey`-/`baseUrl`-Werte des Agents fallen auf `models.providers` in der Konfiguration zurück.
      - Übereinstimmende Modellwerte für `contextWindow`/`maxTokens` verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
      - Übereinstimmendes Modell-`contextTokens` bewahrt eine explizite Runtime-Obergrenze, wenn vorhanden; verwenden Sie dies, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
      - Provider-Plugin-Kataloge werden als generierte Plugin-eigene Katalog-Shards im Plugin-Status des Agents gespeichert.
      - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` und aktive Plugin-Katalog-Shards vollständig neu schreiben soll.
      - Marker-Persistenz ist quellautoritativ: Marker werden aus dem aktiven Quell-Konfigurationssnapshot (vor der Auflösung) geschrieben, nicht aus aufgelösten Runtime-Secret-Werten.

  </Accordion>
</AccordionGroup>

### Details zu Provider-Feldern

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
    - `models.providers`: benutzerdefinierte Provider-Map, indiziert nach Provider-ID.
      - Sichere Bearbeitungen: Verwenden Sie `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` verweigert destruktive Ersetzungen, außer Sie übergeben `--replace`.

  </Accordion>
  <Accordion title="Provider-Verbindung und Authentifizierung">
    - `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.). Für selbst gehostete `/v1/chat/completions`-Backends wie MLX, vLLM, SGLang und die meisten OpenAI-kompatiblen lokalen Server verwenden Sie `openai-completions`. Ein benutzerdefinierter Provider mit `baseUrl`, aber ohne `api`, verwendet standardmäßig `openai-completions`; setzen Sie `openai-responses` nur, wenn das Backend `/v1/responses` unterstützt.
    - `models.providers.*.apiKey`: Provider-Anmeldedaten (SecretRef/env-Ersetzung bevorzugen).
    - `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standardmäßiges natives Kontextfenster für Modelle unter diesem Provider, wenn der Modelleingang `contextWindow` nicht setzt.
    - `models.providers.*.contextTokens`: standardmäßige effektive Laufzeit-Kontextgrenze für Modelle unter diesem Provider, wenn der Modelleingang `contextTokens` nicht setzt.
    - `models.providers.*.maxTokens`: standardmäßige Ausgabe-Token-Grenze für Modelle unter diesem Provider, wenn der Modelleingang `maxTokens` nicht setzt.
    - `models.providers.*.timeoutSeconds`: optionales HTTP-Request-Timeout pro Provider-Modell in Sekunden, einschließlich Verbindung, Headern, Body und Behandlung des gesamten Request-Abbruchs.
    - `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions` `options.num_ctx` in Requests einfügen (Standard: `true`).
    - `models.providers.*.authHeader`: Anmeldedatenübertragung im `Authorization`-Header erzwingen, wenn erforderlich.
    - `models.providers.*.baseUrl`: Basis-URL der Upstream-API.
    - `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.

  </Accordion>
  <Accordion title="Überschreibungen für den Request-Transport">
    `models.providers.*.request`: Transport-Überschreibungen für HTTP-Requests an Modell-Provider.

    - `request.headers`: zusätzliche Header (mit Provider-Standards zusammengeführt). Werte akzeptieren SecretRef.
    - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (integrierte Authentifizierung des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optionalem `prefix`).
    - `request.proxy`: HTTP-Proxy-Überschreibung. Modi: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY`-Umgebungsvariablen verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren ein optionales `tls`-Unterobjekt.
    - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: Wenn `true`, dürfen HTTP-Requests an Modell-Provider private, CGNAT- oder ähnliche Bereiche durch den HTTP-Fetch-Schutz des Providers erreichen. Benutzerdefinierte/lokale Provider-Basis-URLs vertrauen bereits dem exakt konfigurierten Ursprung, mit Ausnahme von Metadata-/Link-Local-Ursprüngen, die ohne explizite Zustimmung blockiert bleiben. Setzen Sie dies auf `false`, um das Vertrauen in den exakten Ursprung abzuwählen. WebSocket verwendet dasselbe `request` für Header/TLS, aber nicht dieses Fetch-SSRF-Gate. Standard `false`.

  </Accordion>
  <Accordion title="Modellkatalogeinträge">
    - `models.providers.*.models`: explizite Modellkatalogeinträge des Providers.
    - `models.providers.*.models.*.input`: Modelleingabemodalitäten. Verwenden Sie `["text"]` für reine Textmodelle und `["text", "image"]` für native Bild-/Vision-Modelle. Bildanhänge werden nur dann in Agent-Turns eingefügt, wenn das ausgewählte Modell als bildfähig markiert ist.
    - `models.providers.*.models.*.contextWindow`: Metadaten zum nativen Modellkontextfenster. Dies überschreibt `contextWindow` auf Provider-Ebene für dieses Modell.
    - `models.providers.*.models.*.contextTokens`: optionale Laufzeit-Kontextgrenze. Dies überschreibt `contextTokens` auf Provider-Ebene; verwenden Sie es, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells wünschen; `openclaw models list` zeigt beide Werte, wenn sie sich unterscheiden.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host ist nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Eine leere/ausgelassene `baseUrl` behält das standardmäßige OpenAI-Verhalten bei.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für reine String-OpenAI-kompatible Chat-Endpunkte. Wenn `true`, glättet OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden des Requests zu einfachen Strings.
    - `models.providers.*.models.*.compat.strictMessageKeys`: optionaler Kompatibilitätshinweis für strikte OpenAI-kompatible Chat-Endpunkte. Wenn `true`, reduziert OpenClaw ausgehende Chat-Completions-Nachrichtenobjekte vor dem Senden des Requests auf `role` und `content`.
    - `models.providers.*.models.*.compat.thinkingFormat`: optionaler Hinweis für Thinking-Payloads. Verwenden Sie `"together"` für Together-artiges `reasoning.enabled`, `"qwen"` für `enable_thinking` auf oberster Ebene oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` auf OpenAI-kompatiblen Servern der Qwen-Familie, die Request-Level-Chat-Template-Kwargs unterstützen, wie vLLM. Konfigurierte vLLM-Qwen-Modelle stellen binäre `/think`-Auswahlen (`off`, `on`) für diese Formate bereit.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: optionaler Kompatibilitätshinweis für DeepSeek-artige Chat-Completions-Backends, die verlangen, dass frühere Assistant-Nachrichten beim Replay `reasoning_content` behalten. Wenn `true`, bewahrt OpenClaw dieses Feld in ausgehenden Assistant-Nachrichten auf. Verwenden Sie dies, wenn Sie einen benutzerdefinierten DeepSeek-kompatiblen Proxy einbinden, der Requests nach entferntem Reasoning ablehnt. Standard `false`.

  </Accordion>
  <Accordion title="Amazon-Bedrock-Erkennung">
    - `plugins.entries.amazon-bedrock.config.discovery`: Wurzel der Bedrock-Einstellungen für automatische Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Erkennung ein-/ausschalten.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für die Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für gezielte Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Abfrageintervall für die Aktualisierung der Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Ausgabe-Token erkannter Modelle.

  </Accordion>
</AccordionGroup>

Das interaktive Onboarding für benutzerdefinierte Provider leitet Bildeingabe für gängige Vision-Modell-IDs wie GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V und GLM-4V ab und überspringt die zusätzliche Frage für bekannte reine Textfamilien. Unbekannte Modell-IDs fragen weiterhin nach Bildunterstützung. Nicht interaktives Onboarding verwendet dieselbe Ableitung; übergeben Sie `--custom-image-input`, um bildfähige Metadaten zu erzwingen, oder `--custom-text-input`, um reine Textmetadaten zu erzwingen.

### Provider-Beispiele

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Das offizielle externe `cerebras`-Provider-Plugin kann dies über `openclaw onboard --auth-choice cerebras-api-key` konfigurieren. Verwenden Sie explizite Provider-Konfiguration nur, wenn Sie Standards überschreiben.

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
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic-kompatibler, integrierter Provider. Kurzbefehl: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Lokale Modelle (LM Studio)">
    Siehe [Lokale Modelle](/de/gateway/local-models). Kurzfassung: Führen Sie ein großes lokales Modell über die LM Studio Responses API auf leistungsfähiger Hardware aus; behalten Sie gehostete Modelle als zusammengeführte Fallbacks bei.
  </Accordion>
  <Accordion title="MiniMax M3 (direkt)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
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
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Setzen Sie `MINIMAX_API_KEY`. Kurzbefehle: `openclaw onboard --auth-choice minimax-global-api` oder `openclaw onboard --auth-choice minimax-cn-api`. Der Modellkatalog verwendet standardmäßig M3 und enthält außerdem die M2.7-Varianten. Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-M2.x-Thinking standardmäßig, sofern Sie `thinking` nicht ausdrücklich selbst setzen; MiniMax-M3 (und M3.x) bleibt standardmäßig auf dem ausgelassenen/adaptiven Thinking-Pfad des Providers. `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

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

    Native Moonshot-Endpunkte melden Streaming-Usage-Kompatibilität auf dem gemeinsamen `openai-completions`-Transport, und OpenClaw leitet dies aus Endpunktfähigkeiten ab statt allein aus der integrierten Provider-ID.

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

    Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie `opencode/...`-Refs für den Zen-Katalog oder `opencode-go/...`-Refs für den Go-Katalog. Kurzbefehl: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetisch (Anthropic-kompatibel)">
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

    Die Basis-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kurzform: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Setzen Sie `ZAI_API_KEY`. Modellreferenzen verwenden die kanonische `zai/*`-Provider-ID. Kurzform: `openclaw onboard --auth-choice zai-api-key`.

    - Allgemeiner Endpoint: `https://api.z.ai/api/paas/v4`
    - Coding-Endpoint (Standard): `https://api.z.ai/api/coding/paas/v4`
    - Definieren Sie für den allgemeinen Endpoint einen benutzerdefinierten Provider mit der Überschreibung der Basis-URL.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Konfiguration — Kanäle](/de/gateway/config-channels)
- [Konfigurationsreferenz](/de/gateway/configuration-reference) — weitere Schlüssel der obersten Ebene
- [Tools und Plugins](/de/tools)
