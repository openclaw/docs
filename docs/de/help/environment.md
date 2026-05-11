---
read_when:
    - Sie müssen wissen, welche Umgebungsvariablen geladen werden und in welcher Reihenfolge
    - Sie debuggen fehlende API-Schlüssel im Gateway
    - Sie dokumentieren Provider-Authentifizierung oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und welche Prioritätsreihenfolge gilt
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-05-11T20:31:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw bezieht Umgebungsvariablen aus mehreren Quellen. Die Regel lautet: **vorhandene Werte niemals überschreiben**.

## Priorität (höchste → niedrigste)

1. **Prozessumgebung** (was der Gateway-Prozess bereits von der übergeordneten Shell bzw. dem übergeordneten Daemon hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nicht).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`; überschreibt nicht).
4. **Konfigurationsblock `env`** in `~/.openclaw/openclaw.json` (wird nur angewendet, wenn der Wert fehlt).
5. **Optionaler Login-Shell-Import** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), wird nur für fehlende erwartete Schlüssel angewendet.

Bei Ubuntu-Neuinstallationen, die das standardmäßige State-Verzeichnis verwenden, behandelt OpenClaw außerdem `~/.config/openclaw/gateway.env` als Kompatibilitäts-Fallback nach der globalen `.env`. Wenn beide Dateien vorhanden sind und sich widersprechen, behält OpenClaw `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Konfigurationsdatei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import wird weiterhin ausgeführt, wenn er aktiviert ist.

## Konfigurationsblock `env`

Zwei gleichwertige Möglichkeiten, Inline-Umgebungsvariablen festzulegen (beide überschreiben nicht):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Shell-Umgebungsimport

`env.shellEnv` führt Ihre Login-Shell aus und importiert nur **fehlende** erwartete Schlüssel:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Entsprechungen als Umgebungsvariablen:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Zur Laufzeit injizierte Umgebungsvariablen

OpenClaw injiziert außerdem Kontextmarker in gestartete Child-Prozesse:

- `OPENCLAW_SHELL=exec`: wird für Befehle gesetzt, die über das `exec`-Tool ausgeführt werden.
- `OPENCLAW_SHELL=acp`: wird für Starts von ACP-Laufzeit-Backend-Prozessen gesetzt (zum Beispiel `acpx`).
- `OPENCLAW_SHELL=acp-client`: wird für `openclaw acp client` gesetzt, wenn der ACP-Bridge-Prozess gestartet wird.
- `OPENCLAW_SHELL=tui-local`: wird für lokale TUI-`!`-Shell-Befehle gesetzt.

Dies sind Laufzeitmarker (keine erforderliche Benutzerkonfiguration). Sie können in Shell-/Profil-Logik verwendet werden,
um kontextspezifische Regeln anzuwenden.

## UI-Umgebungsvariablen

- `OPENCLAW_THEME=light`: erzwingt die helle TUI-Palette, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: erzwingt die dunkle TUI-Palette.
- `COLORFGBG`: wenn Ihr Terminal dies exportiert, verwendet OpenClaw den Hinweis zur Hintergrundfarbe, um die TUI-Palette automatisch auszuwählen.

## Umgebungsvariablensubstitution in der Konfiguration

Sie können Umgebungsvariablen direkt in String-Werten der Konfiguration mit der Syntax `${VAR_NAME}` referenzieren:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Vollständige Details finden Sie unter [Konfiguration: Umgebungsvariablensubstitution](/de/gateway/configuration-reference#env-var-substitution).

## Secret refs im Vergleich zu `${ENV}`-Strings

OpenClaw unterstützt zwei umgebungsbasierte Muster:

- `${VAR}`-String-Substitution in Konfigurationswerten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beide werden zum Aktivierungszeitpunkt aus der Prozessumgebung aufgelöst. Details zu SecretRef sind unter [Secrets-Verwaltung](/de/gateway/secrets) dokumentiert.

## Pfadbezogene Umgebungsvariablen

| Variable                 | Zweck                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Überschreibt das Home-Verzeichnis, das für die gesamte interne Pfadauflösung verwendet wird (`~/.openclaw/`, Agent-Verzeichnisse, Sitzungen, Anmeldedaten). Nützlich, wenn OpenClaw als dedizierter Service-Benutzer ausgeführt wird. |
| `OPENCLAW_STATE_DIR`     | Überschreibt das State-Verzeichnis (Standard `~/.openclaw`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH`   | Überschreibt den Pfad der Konfigurationsdatei (Standard `~/.openclaw/openclaw.json`).                                                                                                             |
| `OPENCLAW_INCLUDE_ROOTS` | Pfadliste von Verzeichnissen, in denen `$include`-Direktiven Dateien außerhalb des Konfigurationsverzeichnisses auflösen dürfen (Standard: keine — `$include` ist auf das Konfigurationsverzeichnis beschränkt). Tilde wird expandiert.  |

## Logging

| Variable                         | Zweck                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Überschreibt das Log-Level sowohl für Datei als auch Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Konfiguration. Ungültige Werte werden mit einer Warnung ignoriert. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Gibt gezielte Timing-Diagnosen für Modellanfragen/-antworten auf `info`-Ebene aus, ohne globale Debug-Logs zu aktivieren.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Modell-Payload-Diagnosen: `summary`, `tools` oder `full-redacted`. `full-redacted` ist begrenzt und redigiert, kann jedoch Prompt-/Nachrichtentext enthalten.                                               |
| `OPENCLAW_DEBUG_SSE`             | Streaming-Diagnosen: `events` für Timing von Erst-/Abschlussereignis, `peek`, um die ersten fünf redigierten SSE-Ereignisse einzuschließen.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Code-Modus-Diagnosen der Modelloberfläche, einschließlich Ausblenden von Provider-Tools und Durchsetzung von exec/wait-only.                                                                                          |

### `OPENCLAW_HOME`

Wenn gesetzt, ersetzt `OPENCLAW_HOME` das System-Home-Verzeichnis (`$HOME` / `os.homedir()`) für die gesamte interne Pfadauflösung. Dies ermöglicht vollständige Dateisystemisolation für headless Service-Konten.

**Priorität:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Beispiel** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Tilde-Pfad gesetzt werden (z. B. `~/svc`), der vor der Verwendung mit `$HOME` expandiert wird.

## nvm-Benutzer: web_fetch-TLS-Fehler

Wenn Node.js über **nvm** installiert wurde (nicht über den Systempaketmanager), verwendet das integrierte `fetch()`
den von nvm gebündelten CA-Speicher, in dem moderne Root-CAs fehlen können (ISRG Root X1/X2 für Let's Encrypt,
DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Websites mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die systemd-Service-Umgebung
- der `openclaw`-CLI-Einstiegspunkt führt sich selbst mit gesetztem `NODE_EXTRA_CA_CERTS` erneut aus, bevor Node startet

**Manuelle Korrektur (für ältere Versionen oder direkte `node ...`-Starts):**

Exportieren Sie die Variable, bevor Sie OpenClaw starten:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich für diese Variable nicht darauf, sie nur in `~/.openclaw/.env` zu schreiben; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Legacy-Umgebungsvariablen

OpenClaw liest nur `OPENCLAW_*`-Umgebungsvariablen. Die Legacy-Präfixe
`CLAWDBOT_*` und `MOLTBOT_*` aus früheren Releases werden stillschweigend
ignoriert.

Wenn beim Start noch welche im Gateway-Prozess gesetzt sind, gibt OpenClaw eine
einzelne Node-Deprecation-Warnung (`OPENCLAW_LEGACY_ENV_VARS`) aus, die die
erkannten Präfixe und die Gesamtzahl auflistet. Benennen Sie jeden Wert um, indem Sie das
Legacy-Präfix durch `OPENCLAW_` ersetzen (zum Beispiel `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); die alten Namen haben keine Wirkung.

## Verwandte Themen

- [Gateway-Konfiguration](/de/gateway/configuration)
- [FAQ: Umgebungsvariablen und .env-Laden](/de/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/de/concepts/models)
