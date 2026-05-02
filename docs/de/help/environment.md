---
read_when:
    - Sie müssen wissen, welche Umgebungsvariablen geladen werden und in welcher Reihenfolge
    - Sie debuggen fehlende API-Schlüssel im Gateway
    - Sie dokumentieren Provider-Authentifizierung oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und welche Prioritätsreihenfolge gilt
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-05-02T06:36:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw bezieht Umgebungsvariablen aus mehreren Quellen. Die Regel lautet: **bestehende Werte niemals überschreiben**.

## Priorität (höchste → niedrigste)

1. **Prozessumgebung** (was der Gateway-Prozess bereits von der übergeordneten Shell/dem Daemon hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nicht).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`; überschreibt nicht).
4. **Konfigurationsblock `env`** in `~/.openclaw/openclaw.json` (wird nur angewendet, wenn der Wert fehlt).
5. **Optionaler Login-Shell-Import** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), wird nur für fehlende erwartete Schlüssel angewendet.

Bei Ubuntu-Neuinstallationen, die das Standard-State-Verzeichnis verwenden, behandelt OpenClaw außerdem `~/.config/openclaw/gateway.env` als Kompatibilitäts-Fallback nach der globalen `.env`. Wenn beide Dateien vorhanden sind und voneinander abweichen, behält OpenClaw `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Konfigurationsdatei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import läuft trotzdem, wenn er aktiviert ist.

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

Entsprechende Umgebungsvariablen:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Zur Laufzeit injizierte Umgebungsvariablen

OpenClaw injiziert außerdem Kontextmarker in erzeugte Child-Prozesse:

- `OPENCLAW_SHELL=exec`: wird für Befehle gesetzt, die über das Tool `exec` ausgeführt werden.
- `OPENCLAW_SHELL=acp`: wird für Prozessstarts des ACP-Laufzeit-Backends gesetzt (zum Beispiel `acpx`).
- `OPENCLAW_SHELL=acp-client`: wird für `openclaw acp client` gesetzt, wenn es den ACP-Bridge-Prozess startet.
- `OPENCLAW_SHELL=tui-local`: wird für lokale TUI-`!`-Shell-Befehle gesetzt.

Dies sind Laufzeitmarker (keine erforderliche Benutzerkonfiguration). Sie können in Shell-/Profil-Logik verwendet werden,
um kontextspezifische Regeln anzuwenden.

## UI-Umgebungsvariablen

- `OPENCLAW_THEME=light`: erzwingt die helle TUI-Palette, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: erzwingt die dunkle TUI-Palette.
- `COLORFGBG`: wenn Ihr Terminal sie exportiert, verwendet OpenClaw den Hinweis zur Hintergrundfarbe, um die TUI-Palette automatisch auszuwählen.

## Umgebungsvariablen-Ersetzung in der Konfiguration

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

Ausführliche Details finden Sie unter [Konfiguration: Umgebungsvariablen-Ersetzung](/de/gateway/configuration-reference#env-var-substitution).

## Secret-Refs vs. `${ENV}`-Strings

OpenClaw unterstützt zwei umgebungsbasierte Muster:

- `${VAR}`-String-Ersetzung in Konfigurationswerten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beide werden zum Aktivierungszeitpunkt aus der Prozessumgebung aufgelöst. Details zu SecretRef sind in der [Secret-Verwaltung](/de/gateway/secrets) dokumentiert.

## Pfadbezogene Umgebungsvariablen

| Variable                 | Zweck                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Überschreibt das Home-Verzeichnis, das für die gesamte interne Pfadauflösung verwendet wird (`~/.openclaw/`, Agent-Verzeichnisse, Sitzungen, Zugangsdaten). Nützlich, wenn OpenClaw als dedizierter Service-Benutzer ausgeführt wird. |
| `OPENCLAW_STATE_DIR`     | Überschreibt das State-Verzeichnis (Standard `~/.openclaw`).                                                                                                                                                                  |
| `OPENCLAW_CONFIG_PATH`   | Überschreibt den Pfad zur Konfigurationsdatei (Standard `~/.openclaw/openclaw.json`).                                                                                                                                          |
| `OPENCLAW_INCLUDE_ROOTS` | Pfadliste von Verzeichnissen, in denen `$include`-Direktiven Dateien außerhalb des Konfigurationsverzeichnisses auflösen dürfen (Standard: keine — `$include` ist auf das Konfigurationsverzeichnis beschränkt). Tilde-erweitert. |

## Logging

| Variable             | Zweck                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Überschreibt den Log-Level für Datei und Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Konfiguration. Ungültige Werte werden mit einer Warnung ignoriert. |

### `OPENCLAW_HOME`

Wenn gesetzt, ersetzt `OPENCLAW_HOME` das System-Home-Verzeichnis (`$HOME` / `os.homedir()`) für die gesamte interne Pfadauflösung. Dies ermöglicht vollständige Dateisystemisolation für Headless-Service-Konten.

**Priorität:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Beispiel** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Tilde-Pfad gesetzt werden (z. B. `~/svc`), der vor der Verwendung mit `$HOME` erweitert wird.

## nvm-Nutzer: `web_fetch`-TLS-Fehler

Wenn Node.js über **nvm** installiert wurde (nicht über den Systempaketmanager), verwendet das integrierte `fetch()`
den gebündelten CA-Speicher von nvm, dem moderne Root-CAs fehlen können (ISRG Root X1/X2 für Let's Encrypt,
DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Websites mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die systemd-Service-Umgebung
- der CLI-Einstiegspunkt `openclaw` führt sich selbst vor dem Node-Start erneut mit gesetztem `NODE_EXTRA_CA_CERTS` aus

**Manuelle Korrektur (für ältere Versionen oder direkte `node ...`-Starts):**

Exportieren Sie die Variable, bevor Sie OpenClaw starten:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich für diese Variable nicht darauf, sie nur in `~/.openclaw/.env` zu schreiben; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Veraltete Umgebungsvariablen

OpenClaw liest nur `OPENCLAW_*`-Umgebungsvariablen. Die veralteten
Präfixe `CLAWDBOT_*` und `MOLTBOT_*` aus früheren Releases werden stillschweigend
ignoriert.

Wenn beim Start noch welche im Gateway-Prozess gesetzt sind, gibt OpenClaw eine
einzelne Node-Deprecation-Warnung (`OPENCLAW_LEGACY_ENV_VARS`) aus, die die
erkannten Präfixe und die Gesamtanzahl auflistet. Benennen Sie jeden Wert um, indem Sie das
veraltete Präfix durch `OPENCLAW_` ersetzen (zum Beispiel `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); die alten Namen haben keine Wirkung.

## Verwandte Themen

- [Gateway-Konfiguration](/de/gateway/configuration)
- [FAQ: Umgebungsvariablen und .env-Laden](/de/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/de/concepts/models)
