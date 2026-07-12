---
read_when:
    - Konfigurieren von `tools.*`-Richtlinien, Zulassungslisten oder experimentellen Funktionen
    - Benutzerdefinierte Provider registrieren oder Basis-URLs überschreiben
    - OpenAI-kompatible selbst gehostete Endpunkte einrichten
sidebarTitle: Tools and custom providers
summary: Tool-Konfiguration (Richtlinien, experimentelle Umschalter, Provider-gestützte Tools) und Einrichtung benutzerdefinierter Provider/Basis-URLs
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-07-12T15:20:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-Konfigurationsschlüssel und Einrichtung benutzerdefinierter Provider/Basis-URLs. Informationen zu Agenten, Kanälen und anderen Konfigurationsschlüsseln der obersten Ebene finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Tools

### Tool-Profile

`tools.profile` legt vor `tools.allow`/`tools.deny` eine grundlegende Zulassungsliste fest:

<Note>
Beim lokalen Onboarding wird für neue lokale Konfigurationen standardmäßig `tools.profile: "coding"` festgelegt, wenn kein Wert gesetzt ist (vorhandene explizite Profile bleiben erhalten).
</Note>

| Profil      | Enthält                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Keine Einschränkung (entspricht einem nicht gesetzten Wert)                                                                                                                                                                  |

`coding` und `messaging` erlauben außerdem implizit `bundle-mcp` (konfigurierte MCP-Server).

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Alle oben genannten integrierten Tools außer `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (Plugin-Tools ausgeschlossen)               |
| `group:plugins`    | Tools, die von geladenen Plugins bereitgestellt werden, einschließlich konfigurierter MCP-Server, die über `bundle-mcp` verfügbar gemacht werden      |

Mit `spawn_task` kann ein Coding-Agent bestätigte Folgearbeiten vorschlagen, ohne sie zu starten. Die Control UI zeigt Titel und Zusammenfassung als ausführbaren Chip an; eine Gateway-gestützte TUI zeigt eine entsprechende interaktive Eingabeaufforderung an. Wenn Sie eine der beiden Optionen annehmen, wird eine neue Sitzung in einem verwalteten Worktree erstellt und die vollständige Eingabeaufforderung dorthin gesendet, während der aktuelle Durchlauf fortgesetzt wird. `dismiss_task` verwirft einen noch ausstehenden Vorschlag anhand der kurzlebigen `task_id`, die von `spawn_task` zurückgegeben wurde.

Die Tools werden nur angeboten, wenn die initiierende Bedienoberfläche Gateway-Ereignisse für Aufgabenvorschläge empfangen und ausführen kann. Kanalsitzungen und lokale/eingebettete TUI-Sitzungen empfangen diese Ereignisse nicht; Kanaltransporte benötigen eine portable typisierte Aufgabenaktion, bevor sie diesen Ablauf sicher bereitstellen können. Vorschläge sind prozesslokal und verschwinden bei einem Neustart des Gateway. Beide Tools bleiben im Profil `coding` und in `group:sessions`, sodass die normale Richtlinie über `tools.allow` und `tools.deny` sie automatisch konfiguriert, wenn die Oberfläche sie unterstützt.

### MCP- und Plugin-Tools innerhalb der Sandbox-Tool-Richtlinie

Konfigurierte MCP-Server werden als Plugin-eigene Tools unter der Plugin-ID `bundle-mcp` bereitgestellt. Normale Tool-Profile können sie zulassen, aber `tools.sandbox.tools` ist eine zusätzliche Schranke für Sandbox-Sitzungen. Wenn der Sandbox-Modus `"all"` oder `"non-main"` ist, nehmen Sie einen der folgenden Einträge in die Zulassungsliste für Sandbox-Tools auf, wenn MCP-/Plugin-Tools sichtbar sein sollen:

- `bundle-mcp` für von OpenClaw verwaltete MCP-Server aus `mcp.servers`
- die Plugin-ID für ein bestimmtes natives Plugin
- `group:plugins` für alle geladenen Plugin-eigenen Tools
- exakte Tool-Namen von MCP-Servern oder Server-Glob-Muster wie `outlook__send_mail` oder `outlook__*`, wenn Sie nur einen Server verwenden möchten

Server-Glob-Muster verwenden das Provider-sichere MCP-Serverpräfix und nicht unbedingt den unveränderten Schlüssel aus `mcp.servers`. Zeichen außerhalb von `[A-Za-z0-9_-]` werden zu `-`, Namen, die nicht mit einem Buchstaben beginnen, erhalten das Präfix `mcp-`, und lange oder doppelte Präfixe können gekürzt oder mit einem Suffix versehen werden; beispielsweise verwendet `mcp.servers["Outlook Graph"]` ein Glob-Muster wie `outlook-graph__*`.

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

Ohne diesen Eintrag auf Sandbox-Ebene kann der MCP-Server weiterhin erfolgreich geladen werden, während seine Tools vor der Provider-Anfrage herausgefiltert werden. Verwenden Sie `openclaw doctor`, um diese Konstellation bei von OpenClaw verwalteten Servern in `mcp.servers` zu erkennen. MCP-Server, die aus gebündelten Plugin-Manifesten oder der Claude-Datei `.mcp.json` geladen werden, verwenden dieselbe Sandbox-Schranke, diese Diagnose erfasst diese Quellen derzeit jedoch noch nicht; verwenden Sie dieselben Einträge in der Zulassungsliste, wenn deren Tools in Sandbox-Durchläufen verschwinden.

### `tools.codeMode`

`tools.codeMode` aktiviert die generische Code-Modus-Oberfläche von OpenClaw. Wenn sie
für einen Durchlauf mit Tools aktiviert ist, werden normale OpenClaw-Tools hinter die
in der Sandbox verfügbare `tools.*`-Katalogbrücke verschoben, und MCP-Tools sind über den
generierten Namensraum `MCP` verfügbar. Das Modell sieht normalerweise `exec` und `wait`;
Tools wie `computer`, deren strukturierte Ergebnisse die ausschließlich JSON-basierte
Brücke nicht passieren können, bleiben direkt verfügbar.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Auch die Kurzform wird akzeptiert:

```json5
{
  tools: { codeMode: true },
}
```

MCP-Deklarationen werden im Code-Modus über die schreibgeschützte virtuelle API-Dateioberfläche
bereitgestellt. Gastcode kann `API.list("mcp")` und
`API.read("mcp/<server>.d.ts")` aufrufen, um Signaturen im TypeScript-Stil zu prüfen, bevor
`MCP.<server>.<tool>()` aufgerufen wird. Informationen zum Laufzeitvertrag, zu Einschränkungen
und zu Debugging-Schritten finden Sie unter [Code-Modus](/de/reference/code-mode).

### `tools.allow` / `tools.deny`

Globale Richtlinie zum Zulassen/Ablehnen von Tools (Ablehnen hat Vorrang). Groß-/Kleinschreibung wird nicht berücksichtigt, `*`-Platzhalter werden unterstützt. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` und `apply_patch` sind separate Tool-IDs. `allow: ["write"]` aktiviert bei kompatiblen Modellen auch `apply_patch`, aber `deny: ["write"]` lehnt `apply_patch` nicht ab. Um sämtliche Dateiänderungen zu blockieren, lehnen Sie `group:fs` ab oder führen Sie jedes ändernde Tool explizit auf:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` und `alsoAllow` können nicht beide im selben Geltungsbereich (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) festgelegt werden – die Konfigurationsvalidierung lehnt dies ab. Führen Sie die Einträge aus `alsoAllow` mit `allow` zusammen oder entfernen Sie `allow` und verwenden Sie stattdessen `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Schränkt Tools für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Providerprofil → Zulassen/Ablehnen.

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

Schränkt Tools für eine bestimmte Identität des Anfragenden ein. Dies dient als mehrschichtige Absicherung zusätzlich zur Zugriffskontrolle des Kanals; Absenderwerte müssen vom Kanaladapter stammen, nicht aus dem Nachrichtentext.

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

Schlüssel verwenden explizite Präfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oder `"*"`. Kanal-IDs sind kanonische OpenClaw-IDs; Aliase wie `teams` werden zu `msteams` normalisiert. Veraltete Schlüssel ohne Präfix werden nur als `id:` akzeptiert. Die Abgleichsreihenfolge lautet: Kanal+ID, ID, e164, Benutzername, Name und anschließend Platzhalter.

Wenn `agents.list[].tools.toolsBySender` pro Agent übereinstimmt, überschreibt es den globalen Abgleich des Absenders, selbst bei einer leeren Richtlinie `{}`.

### `tools.elevated`

Steuert den erhöhten Ausführungszugriff außerhalb der Sandbox:

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

- Die Überschreibung pro Agent (`agents.list[].tools.elevated`) kann die Berechtigungen nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Status pro Sitzung; Inline-Direktiven gelten für eine einzelne Nachricht.
- Erhöhtes `exec` umgeht die Sandbox und verwendet den konfigurierten Ausweichpfad (standardmäßig `gateway` oder `node`, wenn das Ausführungsziel `node` ist).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Die dargestellten Werte sind Standardwerte, mit Ausnahme von `applyPatch.allowModels` (standardmäßig leer/nicht festgelegt, was bedeutet, dass jedes kompatible Modell `apply_patch` verwenden darf). `approvalRunningNoticeMs` gibt bei länger dauernden, genehmigungsbasierten Ausführungen einen Hinweis zum laufenden Vorgang aus; `0` deaktiviert ihn.

### `tools.loopDetection`

Sicherheitsprüfungen auf Tool-Schleifen sind **standardmäßig deaktiviert**. Legen Sie `enabled: true` fest, um die Erkennung zu aktivieren. Einstellungen können global unter `tools.loopDetection` definiert und pro Agent unter `agents.list[].tools.loopDetection` überschrieben werden.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Maximale Historie der Tool-Aufrufe, die für die Schleifenanalyse aufbewahrt wird.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Schwellenwert für Warnungen bei sich wiederholenden Mustern ohne Fortschritt.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Blockiert wiederholte Aufrufe desselben nicht verfügbaren/unbekannten Tool-Namens nach dieser Anzahl von Fehlversuchen.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Höherer Wiederholungsschwellenwert zum Blockieren kritischer Schleifen.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Schwellenwert für den harten Abbruch jedes Laufs ohne Fortschritt.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Warnt bei wiederholten Aufrufen mit demselben Tool und denselben Argumenten.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Warnt/blockiert bei bekannten Abfrage-Tools (`process.poll`, `command_status` usw.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Warnt/blockiert bei alternierenden Paarmustern ohne Fortschritt.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Anzahl der Versuche nach der automatischen Compaction, für die die Schutzfunktion aktiv bleibt; sie bricht ab, wenn der Agent innerhalb dieses Fensters dieselbe Kombination aus Tool, Argumenten und Ergebnis wiederholt.
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
        apiKey: "brave_api_key", // oder Umgebungsvariable BRAVE_API_KEY (Brave-Provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; für automatische Erkennung weglassen
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

Die angezeigten Werte sind Standardwerte, mit Ausnahme von `provider` und `userAgent`. `maxResponseBytes` wird auf 32000–10000000 begrenzt; `maxChars` wird auf `maxCharsCap` begrenzt (erhöhen Sie `maxCharsCap`, um größere Antworten zuzulassen).

### `tools.media`

Konfiguriert das Verständnis eingehender Medien (Bild/Audio/Video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // veraltet: Abschlüsse bleiben agentenvermittelt
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

`concurrency` (Standardwert `2`), `audio.maxBytes` (Standardwert 20 MB) und `video.maxBytes` (Standardwert 50 MB) werden mit ihren Standardwerten angezeigt; der Standardwert für `image.maxBytes` beträgt 10 MB. Standardwerte für Anfragezeitüberschreitungen je Fähigkeit: Bild/Audio `60` s, Video `120` s.

<AccordionGroup>
  <Accordion title="Felder eines Medienmodelleintrags">
    **Provider-Eintrag** (`type: "provider"` oder weggelassen):

    - `provider`: ID des API-Providers (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
    - `model`: Überschreibung der Modell-ID
    - `profile` / `preferredProfile`: Profilauswahl aus `auth-profiles.json`

    **CLI-Eintrag** (`type: "cli"`):

    - `command`: auszuführbare Datei
    - `args`: vorlagenbasierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.; `openclaw doctor --fix` migriert veraltete `{input}`-Platzhalter zu `{{MediaPath}}`)

    **Gemeinsame Felder:**

    - `capabilities`: optionale Liste (`image`, `audio`, `video`). Jedes Provider-Plugin deklariert seinen eigenen Standardsatz an Fähigkeiten; beispielsweise verwendet der gebündelte `openai`-Provider standardmäßig Bild+Audio, `anthropic`/`minimax` Bild, `google` Bild+Audio+Video und `groq` Audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen je Eintrag.
    - `tools.media.image.timeoutSeconds` und entsprechende `timeoutSeconds`-Einträge des Bildmodells gelten auch, wenn der Agent das explizite `image`-Tool aufruft. Für das Bildverständnis gilt diese Zeitüberschreitung für die Anfrage selbst und wird nicht durch vorherige Vorbereitungsarbeiten verkürzt.
    - Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

    Die Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Umgebungsvariablen → `models.providers.*.apiKey`.

    **Felder für den asynchronen Abschluss:**

    - `asyncCompletion.directSend`: veraltetes Kompatibilitätsflag. Abgeschlossene asynchrone Medienaufgaben bleiben über die Sitzung des Anforderers vermittelt, sodass der Agent das Ergebnis erhält, entscheidet, wie er es dem Benutzer mitteilt, und das Nachrichten-Tool verwendet, wenn die Zustellung an die Quelle dies erfordert.

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

Standard: `tree` (aktuelle Sitzung + von ihr gestartete Sitzungen, etwa Subagenten).

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
    - `self`: nur der Schlüssel der aktuellen Sitzung.
    - `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Subagenten).
    - `agent`: jede Sitzung, die zur aktuellen Agenten-ID gehört (kann andere Benutzer einschließen, wenn Sie Sitzungen je Absender unter derselben Agenten-ID ausführen).
    - `all`: jede Sitzung. Die agentenübergreifende Zielauswahl erfordert weiterhin `tools.agentToAgent`.
    - Sandbox-Begrenzung: Wenn die aktuelle Sitzung in einer Sandbox ausgeführt wird und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (der Standardwert) gilt, wird die Sichtbarkeit auf `tree` festgelegt, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.
    - Wenn der Wert nicht `all` ist, enthält `sessions_list` ein kompaktes Feld `visibility`,
      das den effektiven Modus beschreibt und davor warnt, dass einige Sitzungen außerhalb
      des aktuellen Bereichs möglicherweise ausgelassen werden.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Steuert die Unterstützung eingebetteter Anhänge für `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // Opt-in: auf true setzen, um eingebettete Dateianhänge zuzulassen
        maxTotalBytes: 5242880, // insgesamt 5 MB über alle Dateien hinweg
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
    - Anhänge erfordern `enabled: true`.
    - Subagenten-Anhänge werden im untergeordneten Arbeitsbereich unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` bereitgestellt.
    - ACP-Anhänge unterstützen nur Bilder und werden nach erfolgreicher Prüfung derselben Grenzwerte für Dateianzahl, Bytes pro Datei und Gesamtbytes eingebettet an die ACP-Laufzeit weitergeleitet.
    - Der Inhalt von Anhängen wird bei der dauerhaften Speicherung des Transkripts automatisch geschwärzt.
    - Base64-Eingaben werden mit strengen Prüfungen von Alphabet und Auffüllzeichen sowie einer Größenprüfung vor der Dekodierung validiert.
    - Die Dateiberechtigungen für Subagenten-Anhänge sind `0700` für Verzeichnisse und `0600` für Dateien.
    - Die Bereinigung von Subagenten folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur bei, wenn `retainOnSessionKeep: true` gilt.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle Flags für integrierte Tools. Standardmäßig deaktiviert, sofern keine Regel zur automatischen Aktivierung für strikt agentisches GPT-5 gilt.

```json5
{
  tools: {
    experimental: {
      planTool: true, // experimentelles update_plan aktivieren
    },
  },
}
```

- `planTool`: aktiviert das strukturierte Tool `update_plan` zur Nachverfolgung nicht trivialer, mehrstufiger Arbeiten.
- Standard: `false`, sofern `agents.defaults.embeddedAgent.executionContract` (oder eine agentenspezifische Überschreibung) nicht für einen Lauf des Providers `openai` mit einer Modell-ID aus der GPT-5-Familie auf `"strict-agentic"` gesetzt ist (dies umfasst auch Läufe der OpenAI Codex CLI, da die Codex-Authentifizierung und das Modell-Routing unter dem Provider `openai` angesiedelt sind). Setzen Sie den Wert auf `true`, um das Tool außerhalb dieses Bereichs zu erzwingen, oder auf `false`, um es selbst für strikt agentische GPT-5-Läufe deaktiviert zu lassen.
- Wenn es aktiviert ist, fügt der System-Prompt außerdem Nutzungshinweise hinzu, damit das Modell es nur für umfangreiche Arbeiten verwendet und höchstens einen Schritt im Zustand `in_progress` hält.

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

- `model`: Standardmodell für gestartete Subagenten. Wenn der Wert weggelassen wird, übernehmen Subagenten das Modell des Aufrufers.
- `allowAgents`: standardmäßige Positivliste konfigurierter Ziel-Agenten-IDs für `sessions_spawn`, wenn der anfordernde Agent keine eigene Einstellung `subagents.allowAgents` festlegt (`["*"]` = jedes konfigurierte Ziel; Standard: nur derselbe Agent). Veraltete Einträge, deren Agentenkonfiguration gelöscht wurde, werden von `sessions_spawn` abgelehnt und aus `agents_list` ausgelassen; führen Sie `openclaw doctor --fix` aus, um sie zu bereinigen.
- `maxConcurrent`: maximale Anzahl gleichzeitig ausgeführter Subagenten. Standard: `8`.
- `runTimeoutSeconds`: Zeitüberschreitung (Sekunden) für `sessions_spawn`, wenn der Aufrufer keine eigene Überschreibung übergibt. Standard: `0` (keine Zeitüberschreitung); die oben gezeigten `900` sind ein häufig verwendeter Opt-in-Wert, nicht der integrierte Standardwert.
- `announceTimeoutMs`: Zeitüberschreitung pro Aufruf (Millisekunden) für Zustellversuche der Gateway-`agent`-Ankündigung. Standard: `120000`. Vorübergehende Wiederholungsversuche können dazu führen, dass die gesamte Wartezeit für die Ankündigung länger als eine konfigurierte Zeitüberschreitung ist.
- `archiveAfterMinutes`: Minuten nach Abschluss einer Subagenten-Sitzung, bevor sie automatisch archiviert wird. Standard: `60`; `0` deaktiviert die automatische Archivierung.
- Tool-Richtlinie je Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und Basis-URLs

Provider-Plugins veröffentlichen ihre eigenen Modellkatalogzeilen. Fügen Sie benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

Die Konfiguration einer benutzerdefinierten/lokalen Provider-`baseUrl` ist zugleich die eng begrenzte Entscheidung über das Netzwerkvertrauen für Modell-HTTP-Anfragen: OpenClaw lässt genau diesen Ursprung im Format `scheme://host:port` über den geschützten Abrufpfad zu, ohne eine separate Konfigurationsoption hinzuzufügen oder anderen privaten Ursprüngen zu vertrauen.

```json5
{
  models: {
    mode: "merge", // merge (Standard) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | usw.
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
  <Accordion title="Authentifizierung und Zusammenführungspriorität">
    - Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Authentifizierungsanforderungen.
    - Überschreiben Sie das Stammverzeichnis der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR`.
    - Zusammenführungspriorität für übereinstimmende Provider-IDs:
      - Nicht leere `baseUrl`-Werte aus der `models.json` des Agenten haben Vorrang.
      - Nicht leere `apiKey`-Werte des Agenten haben nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Authentifizierungsprofil-Kontext nicht von SecretRef verwaltet wird.
      - Von SecretRef verwaltete `apiKey`-Werte des Providers werden anhand von Quellmarkierungen (`ENV_VAR_NAME` für Umgebungsreferenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert, anstatt aufgelöste Geheimnisse dauerhaft zu speichern.
      - Von SecretRef verwaltete Header-Werte des Providers werden anhand von Quellmarkierungen (`secretref-env:ENV_VAR_NAME` für Umgebungsreferenzen, `secretref-managed` für Datei-/Exec-Referenzen) aktualisiert.
      - Leere oder fehlende `apiKey`-/`baseUrl`-Werte des Agenten greifen auf `models.providers` in der Konfiguration zurück.
      - Bei übereinstimmenden Modellwerten für `contextWindow`/`maxTokens` hat der explizite Konfigurationswert Vorrang, wenn er vorhanden und gültig ist (eine positive endliche Zahl); andernfalls wird der implizite/generierte Katalogwert verwendet.
      - Für `contextTokens` eines übereinstimmenden Modells gilt dieselbe Regel „explizit vor implizit“; verwenden Sie diesen Wert, um den effektiven Kontext zu begrenzen, ohne die nativen Modellmetadaten zu ändern.
      - Kataloge von Provider-Plugins werden als generierte, dem Plugin gehörende Katalog-Shards im Plugin-Zustand des Agenten gespeichert.
      - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben und die Zusammenführung von Katalog-Shards im Besitz von Plugins überspringen soll.
      - Die dauerhafte Speicherung von Markierungen richtet sich verbindlich nach der Quelle: Markierungen werden aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung) geschrieben, nicht aus aufgelösten Geheimniswerten der Laufzeit.

  </Accordion>
</AccordionGroup>

### Details zu Provider-Feldern

<AccordionGroup>
  <Accordion title="Katalog auf oberster Ebene">
    - `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
    - `models.providers`: benutzerdefinierte Provider-Zuordnung, nach Provider-ID verschlüsselt.
      - Sichere Änderungen: Verwenden Sie `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` lehnt destruktive Ersetzungen ab, sofern Sie nicht `--replace` übergeben.

  </Accordion>
  <Accordion title="Provider-Verbindung und Authentifizierung">
    - `models.providers.*.api`: Anfrageadapter (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Verwenden Sie für selbst gehostete `/v1/chat/completions`-Backends wie MLX, vLLM, SGLang und die meisten OpenAI-kompatiblen lokalen Server `openai-completions`. Ein benutzerdefinierter Provider mit `baseUrl`, aber ohne `api`, verwendet standardmäßig `openai-completions`; legen Sie `openai-responses` nur fest, wenn das Backend `/v1/responses` unterstützt.
    - `models.providers.*.apiKey`: Provider-Zugangsdaten (SecretRef-/Umgebungsersetzung bevorzugt).
    - `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standardmäßiges natives Kontextfenster für Modelle dieses Providers, wenn der Modelleintrag `contextWindow` nicht festlegt.
    - `models.providers.*.contextTokens`: standardmäßige effektive Laufzeit-Kontextobergrenze für Modelle dieses Providers, wenn der Modelleintrag `contextTokens` nicht festlegt.
    - `models.providers.*.maxTokens`: standardmäßige Ausgabetoken-Obergrenze für Modelle dieses Providers, wenn der Modelleintrag `maxTokens` nicht festlegt.
    - `models.providers.*.timeoutSeconds`: optionales Provider-spezifisches Zeitlimit in Sekunden für Modell-HTTP-Anfragen, einschließlich Verbindungsaufbau, Headern, Body und Behandlung des Abbruchs der Gesamtanfrage.
    - `models.providers.*.injectNumCtxForOpenAICompat`: Fügt für Ollama + `openai-completions` `options.num_ctx` in Anfragen ein (Standard: `true`).
    - `models.providers.*.authHeader`: Erzwingt bei Bedarf die Übertragung der Zugangsdaten im `Authorization`-Header.
    - `models.providers.*.baseUrl`: Basis-URL der vorgelagerten API.
    - `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Mandanten-Routing.

  </Accordion>
  <Accordion title="Überschreibungen für den Anfragetransport">
    `models.providers.*.request`: Transportüberschreibungen für HTTP-Anfragen an Modell-Provider.

    - `request.headers`: zusätzliche Header (mit den Provider-Standardwerten zusammengeführt). Die Werte akzeptieren SecretRef.
    - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (integrierte Authentifizierung des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
    - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (Umgebungsvariablen `HTTP_PROXY`/`HTTPS_PROXY` verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren ein optionales `tls`-Unterobjekt.
    - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: Wenn `true`, werden HTTP-Anfragen an Modell-Provider durch die HTTP-Abrufsicherung des Providers an private, CGNAT- oder ähnliche Bereiche zugelassen. Benutzerdefinierte/lokale Basis-URLs von Providern vertrauen bereits exakt dem konfigurierten Ursprung; ausgenommen sind Metadaten-/Link-Local-Ursprünge, die ohne ausdrückliche Zustimmung weiterhin blockiert bleiben. Setzen Sie dies auf `false`, um das Vertrauen in den exakten Ursprung zu deaktivieren. WebSocket verwendet dieselbe `request`-Konfiguration für Header/TLS, jedoch nicht diese SSRF-Sicherung für Abrufe. Standard: `false`.

  </Accordion>
  <Accordion title="Einträge im Modellkatalog">
    - `models.providers.*.models`: explizite Modellkatalogeinträge des Providers.
    - `models.providers.*.models.*.input`: Eingabemodalitäten des Modells. Verwenden Sie `["text"]` für reine Textmodelle und `["text", "image"]` für native Bild-/Vision-Modelle. Bildanhänge werden nur in Agent-Durchläufe eingefügt, wenn das ausgewählte Modell als bildfähig gekennzeichnet ist.
    - `models.providers.*.models.*.contextWindow`: Metadaten des nativen Modellkontextfensters. Dies überschreibt für dieses Modell `contextWindow` auf Provider-Ebene.
    - `models.providers.*.models.*.contextTokens`: optionale Laufzeit-Kontextobergrenze. Dies überschreibt `contextTokens` auf Provider-Ebene; verwenden Sie den Wert, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells wünschen; `openclaw models list` zeigt beide Werte an, wenn sie voneinander abweichen.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Bei `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host ist nicht `api.openai.com`) erzwingt OpenClaw zur Laufzeit den Wert `false`. Eine leere/ausgelassene `baseUrl` behält das standardmäßige OpenAI-Verhalten bei.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für ausschließlich Zeichenfolgen unterstützende OpenAI-kompatible Chat-Endpunkte. Wenn `true`, wandelt OpenClaw reine Textarrays vom Typ `messages[].content` vor dem Senden der Anfrage in einfache Zeichenfolgen um.
    - `models.providers.*.models.*.compat.strictMessageKeys`: optionaler Kompatibilitätshinweis für strikte OpenAI-kompatible Chat-Endpunkte. Wenn `true`, reduziert OpenClaw ausgehende Chat-Completions-Nachrichtenobjekte vor dem Senden der Anfrage auf `role` und `content`.
    - `models.providers.*.models.*.compat.thinkingFormat`: optionaler Hinweis zum Thinking-Payload. Verwenden Sie `"together"` für `reasoning.enabled` im Together-Stil, `"qwen"` für `enable_thinking` auf oberster Ebene oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` auf OpenAI-kompatiblen Servern der Qwen-Familie, die Chat-Template-Kwargs auf Anfrageebene unterstützen, beispielsweise vLLM. Konfigurierte Qwen-Modelle von vLLM stellen für diese Formate binäre `/think`-Optionen (`off`, `on`) bereit.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: optionaler Kompatibilitätshinweis für Chat-Completions-Backends im DeepSeek-Stil, die verlangen, dass vorherige Assistentennachrichten bei der erneuten Wiedergabe `reasoning_content` beibehalten. Wenn `true`, bewahrt OpenClaw dieses Feld in ausgehenden Assistentennachrichten. Verwenden Sie dies beim Einrichten eines benutzerdefinierten DeepSeek-kompatiblen Proxys, der Anfragen nach dem Entfernen der Reasoning-Inhalte ablehnt. Standard: `false`.

  </Accordion>
  <Accordion title="Amazon-Bedrock-Erkennung">
    - `plugins.entries.amazon-bedrock.config.discovery`: Stamm der Einstellungen für die automatische Bedrock-Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Erkennung ein-/ausschalten.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für die Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für eine gezielte Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Abfrageintervall für die Aktualisierung der Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Ersatz-Kontextfenster für erkannte Modelle.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: maximale Anzahl an Ausgabetoken als Ersatzwert für erkannte Modelle.

  </Accordion>
</AccordionGroup>

Das interaktive Onboarding benutzerdefinierter Provider leitet die Bildeingabe aus bekannten Mustern für Vision-Modell-IDs ab, darunter GPT-4o/GPT-4.1/GPT-5+, die Reasoning-Familien `o1`/`o3`/`o4`, Claude, Gemini, jede ID mit dem Suffix `-vl` (Qwen-VL und ähnliche) sowie benannte Familien wie LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V und GLM-4V. Bei bekannten reinen Textfamilien (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama und einfache Qwen-IDs ohne vl-/vision-Suffix) wird die zusätzliche Frage übersprungen. Bei unbekannten Modell-IDs wird weiterhin nach Bildunterstützung gefragt. Das nicht interaktive Onboarding verwendet dieselbe Ableitung; übergeben Sie `--custom-image-input`, um bildfähige Metadaten zu erzwingen, oder `--custom-text-input`, um reine Textmetadaten zu erzwingen.

### Provider-Beispiele

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Das offizielle externe Provider-Plugin `cerebras` kann dies über `openclaw onboard --auth-choice cerebras-api-key` konfigurieren. Verwenden Sie eine explizite Provider-Konfiguration nur, wenn Sie Standardwerte überschreiben.

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

    Verwenden Sie `cerebras/zai-glm-4.7` für Cerebras und `zai/glm-4.7` für den direkten Zugriff auf Z.AI.

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

    Anthropic-kompatibler, integrierter Provider. Kurzform: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Lokale Modelle (LM Studio)">
    Siehe [Lokale Modelle](/de/gateway/local-models). Kurz gesagt: Führen Sie über die LM Studio Responses API auf leistungsfähiger Hardware ein großes lokales Modell aus; führen Sie gehostete Modelle weiterhin zusammen, um einen Fallback bereitzustellen.
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

    Setzen Sie `MINIMAX_API_KEY`. Kurzbefehle: `openclaw onboard --auth-choice minimax-global-api` oder `openclaw onboard --auth-choice minimax-cn-api`. Der Modellkatalog verwendet standardmäßig M3 und enthält außerdem die M2.7-Varianten. Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw standardmäßig das Thinking von MiniMax M2.x, sofern Sie `thinking` nicht ausdrücklich selbst festlegen; MiniMax-M3 (und M3.x) verbleibt standardmäßig auf dem ausgelassenen/adaptiven Thinking-Pfad des Providers. `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

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

    Native Moonshot-Endpunkte geben auf dem gemeinsam verwendeten `openai-completions`-Transport Kompatibilität mit der Streaming-Nutzungsstatistik an, und OpenClaw richtet dieses Verhalten nach den Endpunktfunktionen aus statt allein nach der integrierten Provider-ID.

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

    Die Basis-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kurzbefehl: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Setzen Sie `ZAI_API_KEY`. Modellreferenzen verwenden die kanonische Provider-ID `zai/*`. Kurzbefehl: `openclaw onboard --auth-choice zai-api-key`.

    - Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
    - Coding-Endpunkt: `https://api.z.ai/api/coding/paas/v4`
    - Die standardmäßige Authentifizierungsauswahl `zai-api-key` prüft Ihren Schlüssel und erkennt automatisch, zu welchem Endpunkt er gehört (wenn die Erkennung kein eindeutiges Ergebnis liefert, wird auf eine Eingabeaufforderung zurückgegriffen, deren Standardwert Global ist). Für eine explizite Auswahl stehen außerdem separate Authentifizierungsauswahlen für CN und den Coding-Plan zur Verfügung.
    - Definieren Sie für den allgemeinen Endpunkt einen benutzerdefinierten Provider mit überschriebener Basis-URL.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Konfiguration — Kanäle](/de/gateway/config-channels)
- [Konfigurationsreferenz](/de/gateway/configuration-reference) — weitere Schlüssel auf oberster Ebene
- [Tools und Plugins](/de/tools)
