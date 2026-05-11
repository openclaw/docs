---
read_when:
    - Konfigurieren der `tools.*`-Richtlinie, von Zulassungslisten oder experimentellen Funktionen
    - Benutzerdefinierte Provider registrieren oder Basis-URLs überschreiben
    - OpenAI-kompatible selbst gehostete Endpunkte einrichten
sidebarTitle: Tools and custom providers
summary: Tools-Konfiguration (Richtlinien, experimentelle Toggles, Provider-gestützte Tools) und Einrichtung benutzerdefinierter Provider/Basis-URLs
title: Konfiguration — Tools und benutzerdefinierte Provider
x-i18n:
    generated_at: "2026-05-11T20:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ab0ec823da1e2e8598d9efb998a207c4486ba82dcf4dd65422c6bf90581b46
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*`-Konfigurationsschlüssel und benutzerdefinierte Provider-/Basis-URL-Einrichtung. Informationen zu Agents, Kanälen und anderen Konfigurationsschlüsseln auf oberster Ebene finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Werkzeuge

### Werkzeugprofile

`tools.profile` legt eine Basis-Allowlist vor `tools.allow`/`tools.deny` fest:

<Note>
Das lokale Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn der Wert nicht festgelegt ist (vorhandene explizite Profile bleiben erhalten).
</Note>

| Profil      | Enthält                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Nur `session_status`                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Keine Einschränkung (wie nicht festgelegt)                                                                                      |

### Werkzeuggruppen

| Gruppe             | Werkzeuge                                                                                                               |
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
| `group:openclaw`   | Alle integrierten Werkzeuge (schließt Provider-Plugins aus)                                                             |

### `tools.allow` / `tools.deny`

Globale Allow-/Deny-Richtlinie für Werkzeuge (Deny gewinnt). Groß-/Kleinschreibung wird ignoriert, `*`-Wildcards werden unterstützt. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` und `apply_patch` sind separate Werkzeug-IDs. `allow: ["write"]` aktiviert bei kompatiblen Modellen auch `apply_patch`, aber `deny: ["write"]` sperrt `apply_patch` nicht. Um alle Dateimutationen zu blockieren, sperren Sie `group:fs` oder listen Sie jedes mutierende Werkzeug explizit auf:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Schränkt Werkzeuge für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Provider-Profil → Allow/Deny.

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

Schränkt Werkzeuge für eine bestimmte Identität des Anfragenden ein. Dies ist Defense-in-Depth zusätzlich zur Kanalzugriffskontrolle; Absenderwerte müssen vom Kanaladapter stammen, nicht aus dem Nachrichtentext.

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

Schlüssel verwenden explizite Präfixe: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` oder `"*"`. Kanal-IDs sind kanonische OpenClaw-IDs; Aliase wie `teams` werden zu `msteams` normalisiert. Veraltete Schlüssel ohne Präfix werden nur als `id:` akzeptiert. Die Abgleichreihenfolge ist channel+id, id, e164, username, name, dann Wildcard.

Pro-Agent `agents.list[].tools.toolsBySender` überschreibt den globalen Absenderabgleich, wenn es übereinstimmt, auch mit einer leeren `{}`-Richtlinie.

### `tools.elevated`

Steuert erweiterten `exec`-Zugriff außerhalb der Sandbox:

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

- Eine Pro-Agent-Überschreibung (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Status pro Sitzung; Inline-Direktiven gelten für eine einzelne Nachricht.
- Erweitertes `exec` umgeht die Sandbox und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das `exec`-Ziel `node` ist).

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
  Maximale für die Schleifenanalyse vorgehaltene Tool-Aufruf-Historie.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Schwellenwert für wiederholte Muster ohne Fortschritt, ab dem Warnungen ausgegeben werden.
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
  Warnt/blockiert bei bekannten Polling-Tools (`process.poll`, `command_status` usw.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Warnt/blockiert bei abwechselnden Paarmustern ohne Fortschritt.
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
  <Accordion title="Felder für Medienmodelleinträge">
    **Provider-Eintrag** (`type: "provider"` oder ausgelassen):

    - `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
    - `model`: Überschreibung der Modell-ID
    - `profile` / `preferredProfile`: Profilauswahl aus `auth-profiles.json`

    **CLI-Eintrag** (`type: "cli"`):

    - `command`: auszuführbare Datei
    - `args`: templatisierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.; `openclaw doctor --fix` migriert veraltete `{input}`-Platzhalter zu `{{MediaPath}}`)

    **Gemeinsame Felder:**

    - `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
    - `tools.media.image.timeoutSeconds` und passende `timeoutSeconds`-Einträge für Bildmodelle gelten auch, wenn der Agent das explizite `image`-Tool aufruft.
    - Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

    Die Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Umgebungsvariablen → `models.providers.*.apiKey`.

    **Felder für asynchrone Abschlüsse:**

    - `asyncCompletion.directSend`: veraltetes Kompatibilitäts-Flag. Abgeschlossene asynchrone Medienaufgaben bleiben über die anfragende Sitzung vermittelt, sodass der Agent das Ergebnis erhält, entscheidet, wie er es dem Benutzer mitteilt, und das Nachrichten-Tool verwendet, wenn die Zustellung über die Quelle dies erfordert.

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

Standard: `tree` (aktuelle Sitzung + von ihr gestartete Sitzungen, z. B. Unteragenten).

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
    - `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Unteragenten).
    - `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn Sie Sitzungen pro Absender unter derselben Agent-ID ausführen).
    - `all`: jede Sitzung. Agentenübergreifende Adressierung erfordert weiterhin `tools.agentToAgent`.
    - Sandbox-Begrenzung: Wenn die aktuelle Sitzung in einer Sandbox ausgeführt wird und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gilt, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge in `sessions_spawn`.

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
    - Anhänge werden nur für `runtime: "subagent"` unterstützt. ACP runtime weist sie zurück.
    - Dateien werden im untergeordneten Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
    - Anhangsinhalte werden automatisch aus der Transkriptpersistenz redigiert.
    - Base64-Eingaben werden mit strikten Alphabet-/Padding-Prüfungen und einer Größenprüfung vor dem Decodieren validiert.
    - Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
    - Die Bereinigung folgt der `cleanup`-Richtlinie: `delete` entfernt Anhänge immer; `keep` behält sie nur bei, wenn `retainOnSessionKeep: true` gesetzt ist.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Experimentelle integrierte Tool-Flags. Standardmäßig deaktiviert, sofern keine strict-agentic-Aktivierungsregel für GPT-5 greift.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: aktiviert das strukturierte `update_plan`-Tool zur Nachverfolgung nicht trivialer mehrstufiger Arbeit.
- Standard: `false`, sofern `agents.defaults.embeddedPi.executionContract` (oder eine agentenspezifische Überschreibung) nicht für eine Ausführung der GPT-5-Familie von OpenAI oder OpenAI Codex auf `"strict-agentic"` gesetzt ist. Setzen Sie `true`, um das Tool außerhalb dieses Geltungsbereichs zu erzwingen, oder `false`, um es selbst für strict-agentic-GPT-5-Ausführungen deaktiviert zu lassen.
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
- `allowAgents`: Standard-Allowlist von Ziel-Agent-IDs für `sessions_spawn`, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` auslässt. `0` bedeutet kein Timeout.
- `announceTimeoutMs`: Timeout pro Aufruf (Millisekunden) für Gateway-`agent`-Zustellversuche von Ankündigungen. Standard: `120000`. Vorübergehende Wiederholungen können dazu führen, dass die gesamte Wartezeit für Ankündigungen länger als ein konfiguriertes Timeout ist.
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
  <Accordion title="Authentifizierung und Merge-Priorität">
    - Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Authentifizierungsanforderungen.
    - Überschreiben Sie das Stammverzeichnis der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem Legacy-Alias für Umgebungsvariablen).
    - Merge-Priorität für übereinstimmende Provider-IDs:
      - Nicht leere `baseUrl`-Werte aus der Agent-`models.json` haben Vorrang.
      - Nicht leere Agent-`apiKey`-Werte haben nur Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profil-Kontext nicht SecretRef-verwaltet ist.
      - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs), anstatt aufgelöste Geheimnisse dauerhaft zu speichern.
      - SecretRef-verwaltete Provider-Header-Werte werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Refs, `secretref-managed` für Datei-/Exec-Refs).
      - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` in der Konfiguration zurück.
      - Übereinstimmende Modellwerte für `contextWindow`/`maxTokens` verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
      - Übereinstimmende Modellwerte für `contextTokens` behalten eine explizite Laufzeitobergrenze bei, wenn vorhanden; verwenden Sie dies, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
      - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
      - Marker-Persistenz ist quellautoritativ: Marker werden aus dem aktiven Quell-Konfigurationssnapshot (vor der Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Geheimniswerten.

  </Accordion>
</AccordionGroup>

### Details zu Provider-Feldern

<AccordionGroup>
  <Accordion title="Katalog auf oberster Ebene">
    - `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
    - `models.providers`: Map benutzerdefinierter Provider, nach Provider-ID geschlüsselt.
      - Sichere Bearbeitungen: Verwenden Sie `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oder `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` für additive Aktualisierungen. `config set` verweigert destruktive Ersetzungen, sofern Sie nicht `--replace` übergeben.

  </Accordion>
  <Accordion title="Provider-Verbindung und Authentifizierung">
    - `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.). Für selbst gehostete `/v1/chat/completions`-Backends wie MLX, vLLM, SGLang und die meisten OpenAI-kompatiblen lokalen Server verwenden Sie `openai-completions`. Ein benutzerdefinierter Provider mit `baseUrl`, aber ohne `api`, verwendet standardmäßig `openai-completions`; setzen Sie `openai-responses` nur, wenn das Backend `/v1/responses` unterstützt.
    - `models.providers.*.apiKey`: Provider-Anmeldedaten (SecretRef-/Env-Ersetzung bevorzugen).
    - `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: standardmäßiges natives Kontextfenster für Modelle unter diesem Provider, wenn der Modelleintrag `contextWindow` nicht setzt.
    - `models.providers.*.contextTokens`: standardmäßige effektive Laufzeit-Kontextobergrenze für Modelle unter diesem Provider, wenn der Modelleintrag `contextTokens` nicht setzt.
    - `models.providers.*.maxTokens`: standardmäßige Obergrenze für Ausgabetokens für Modelle unter diesem Provider, wenn der Modelleintrag `maxTokens` nicht setzt.
    - `models.providers.*.timeoutSeconds`: optionales HTTP-Request-Timeout pro Provider-Modell in Sekunden, einschließlich Verbindung, Headern, Body und Behandlung des vollständigen Request-Abbruchs.
    - `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions`, injiziert `options.num_ctx` in Requests (Standard: `true`).
    - `models.providers.*.authHeader`: erzwingt die Übertragung von Anmeldedaten im `Authorization`-Header, wenn erforderlich.
    - `models.providers.*.baseUrl`: Basis-URL der Upstream-API.
    - `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.

  </Accordion>
  <Accordion title="Überschreibungen für Request-Transport">
    `models.providers.*.request`: Transport-Überschreibungen für HTTP-Requests an Modell-Provider.

    - `request.headers`: zusätzliche Header (mit Provider-Standards zusammengeführt). Werte akzeptieren SecretRef.
    - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (integrierte Authentifizierung des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optionalem `prefix`).
    - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (Env-Vars `HTTP_PROXY`/`HTTPS_PROXY` verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren ein optionales `tls`-Unterobjekt.
    - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: Wenn `true`, HTTPS zu `baseUrl` zulassen, wenn DNS zu privaten, CGNAT- oder ähnlichen Bereichen auflöst, über den Provider-HTTP-Fetch-Guard (Operator-Opt-in für vertrauenswürdige selbst gehostete OpenAI-kompatible Endpunkte). Loopback-Stream-URLs von Modell-Providern wie `localhost`, `127.0.0.1` und `[::1]` werden automatisch zugelassen, sofern dies nicht explizit auf `false` gesetzt ist; LAN-, Tailnet- und private DNS-Hosts erfordern weiterhin ein Opt-in. WebSocket verwendet dasselbe `request` für Header/TLS, aber nicht dieses Fetch-SSRF-Gate. Standard `false`.

  </Accordion>
  <Accordion title="Modellkatalogeinträge">
    - `models.providers.*.models`: explizite Modellkatalogeinträge des Providers.
    - `models.providers.*.models.*.input`: Modelleingabemodalitäten. Verwenden Sie `["text"]` für reine Textmodelle und `["text", "image"]` für native Bild-/Vision-Modelle. Bildanhänge werden nur in Agent-Turns injiziert, wenn das ausgewählte Modell als bildfähig markiert ist.
    - `models.providers.*.models.*.contextWindow`: Metadaten zum nativen Modellkontextfenster. Dies überschreibt `contextWindow` auf Provider-Ebene für dieses Modell.
    - `models.providers.*.models.*.contextTokens`: optionale Laufzeit-Kontextobergrenze. Dies überschreibt `contextTokens` auf Provider-Ebene; verwenden Sie es, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells wünschen; `openclaw models list` zeigt beide Werte an, wenn sie sich unterscheiden.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Eine leere/ausgelassene `baseUrl` behält das Standardverhalten von OpenAI bei.
    - `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für string-only OpenAI-kompatible Chat-Endpunkte. Wenn `true`, glättet OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden des Requests zu einfachen Strings.
    - `models.providers.*.models.*.compat.strictMessageKeys`: optionaler Kompatibilitätshinweis für strikte OpenAI-kompatible Chat-Endpunkte. Wenn `true`, reduziert OpenClaw ausgehende Chat-Completions-Nachrichtenobjekte vor dem Senden des Requests auf `role` und `content`.
    - `models.providers.*.models.*.compat.thinkingFormat`: optionaler Hinweis zum Thinking-Payload. Verwenden Sie `"qwen"` für `enable_thinking` auf oberster Ebene oder `"qwen-chat-template"` für `chat_template_kwargs.enable_thinking` auf OpenAI-kompatiblen Servern der Qwen-Familie, die Request-Level-Chat-Template-Kwargs unterstützen, wie vLLM.

  </Accordion>
  <Accordion title="Amazon-Bedrock-Erkennung">
    - `plugins.entries.amazon-bedrock.config.discovery`: Stamm der Bedrock-Auto-Erkennungseinstellungen.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Erkennung ein-/ausschalten.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für die Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für gezielte Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Abfrageintervall für die Aktualisierung der Erkennung.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback-Maximum für Ausgabetokens für erkannte Modelle.

  </Accordion>
</AccordionGroup>

Interaktives Onboarding für benutzerdefinierte Provider leitet Bildeingaben für gängige Vision-Modell-IDs wie GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V und GLM-4V ab und überspringt die zusätzliche Frage für bekannte reine Textfamilien. Unbekannte Modell-IDs fragen weiterhin nach Bildunterstützung. Nicht-interaktives Onboarding verwendet dieselbe Ableitung; übergeben Sie `--custom-image-input`, um bildfähige Metadaten zu erzwingen, oder `--custom-text-input`, um reine Textmetadaten zu erzwingen.

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
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic-kompatibler, integrierter Provider. Kürzel: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    Siehe [Lokale Modelle](/de/gateway/local-models). Kurzfassung: Führen Sie ein großes lokales Modell über die LM Studio Responses API auf leistungsfähiger Hardware aus; behalten Sie gehostete Modelle als zusammengeführte Fallbacks bei.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
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

    Setzen Sie `MINIMAX_API_KEY`. Kürzel: `openclaw onboard --auth-choice minimax-global-api` oder `openclaw onboard --auth-choice minimax-cn-api`. Der Modellkatalog verwendet standardmäßig nur M2.7. Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax Thinking standardmäßig, sofern Sie `thinking` nicht ausdrücklich selbst setzen. `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.

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

    Native Moonshot-Endpunkte geben Streaming-Usage-Kompatibilität auf dem gemeinsam genutzten `openai-completions`-Transport an, und OpenClaw macht dies von Endpunktfähigkeiten abhängig, nicht allein von der integrierten Provider-ID.

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

    Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie `opencode/...`-Refs für den Zen-Katalog oder `opencode-go/...`-Refs für den Go-Katalog. Kürzel: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    Die Basis-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kürzel: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` werden als Aliase akzeptiert. Kürzel: `openclaw onboard --auth-choice zai-api-key`.

    - Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
    - Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
    - Definieren Sie für den allgemeinen Endpunkt einen benutzerdefinierten Provider mit der Überschreibung der Basis-URL.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Konfiguration — Kanäle](/de/gateway/config-channels)
- [Konfigurationsreferenz](/de/gateway/configuration-reference) — weitere Schlüssel der obersten Ebene
- [Tools und Plugins](/de/tools)
