---
read_when:
    - Sie müssen wissen, welche Umgebungsvariablen geladen werden und in welcher Reihenfolge
    - Sie debuggen fehlende API-Schlüssel im Gateway
    - Sie dokumentieren Provider-Authentifizierung oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und in welcher Prioritätsreihenfolge
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-04-30T06:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw lädt Umgebungsvariablen aus mehreren Quellen. Die Regel lautet: **Vorhandene Werte niemals überschreiben**.

## Priorität (höchste → niedrigste)

1. **Prozessumgebung** (was der Gateway-Prozess bereits von der übergeordneten Shell bzw. dem Daemon hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nicht).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`; überschreibt nicht).
4. **Config-`env`-Block** in `~/.openclaw/openclaw.json` (nur angewendet, wenn der Wert fehlt).
5. **Optionaler Login-Shell-Import** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), nur für fehlende erwartete Schlüssel angewendet.

Bei Ubuntu-Neuinstallationen, die das Standard-State-Verzeichnis verwenden, behandelt OpenClaw außerdem `~/.config/openclaw/gateway.env` als Kompatibilitäts-Fallback nach der globalen `.env`. Wenn beide Dateien vorhanden sind und sich widersprechen, behält OpenClaw `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Config-Datei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import wird weiterhin ausgeführt, wenn er aktiviert ist.

## Config-`env`-Block

Zwei gleichwertige Möglichkeiten, Inline-Umgebungsvariablen zu setzen (beide überschreiben nicht):

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

OpenClaw injiziert außerdem Kontextmarker in erzeugte Kindprozesse:

- `OPENCLAW_SHELL=exec`: Wird für Befehle gesetzt, die über das `exec`-Tool ausgeführt werden.
- `OPENCLAW_SHELL=acp`: Wird für ACP-Runtime-Backend-Prozessstarts gesetzt (zum Beispiel `acpx`).
- `OPENCLAW_SHELL=acp-client`: Wird für `openclaw acp client` gesetzt, wenn es den ACP-Bridge-Prozess startet.
- `OPENCLAW_SHELL=tui-local`: Wird für lokale TUI-`!`-Shell-Befehle gesetzt.

Dies sind Laufzeitmarker (keine erforderliche Benutzer-Config). Sie können in Shell-/Profil-Logik verwendet werden,
um kontextspezifische Regeln anzuwenden.

## UI-Umgebungsvariablen

- `OPENCLAW_THEME=light`: Erzwingt die helle TUI-Palette, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: Erzwingt die dunkle TUI-Palette.
- `COLORFGBG`: Wenn Ihr Terminal diese Variable exportiert, verwendet OpenClaw den Hintergrundfarbhinweis, um die TUI-Palette automatisch auszuwählen.

## Ersetzung von Umgebungsvariablen in der Config

Sie können Umgebungsvariablen direkt in Config-String-Werten mit der Syntax `${VAR_NAME}` referenzieren:

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

Vollständige Details finden Sie unter [Konfiguration: Ersetzung von Umgebungsvariablen](/de/gateway/configuration-reference#env-var-substitution).

## Secret-Refs vs. `${ENV}`-Strings

OpenClaw unterstützt zwei umgebungsbasierte Muster:

- `${VAR}`-String-Ersetzung in Config-Werten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beide werden zum Aktivierungszeitpunkt aus der Prozessumgebung aufgelöst. Details zu SecretRef sind unter [Secret-Verwaltung](/de/gateway/secrets) dokumentiert.

## Pfadbezogene Umgebungsvariablen

| Variable               | Zweck                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Überschreibt das Home-Verzeichnis, das für die gesamte interne Pfadauflösung verwendet wird (`~/.openclaw/`, Agent-Verzeichnisse, Sitzungen, Anmeldedaten). Nützlich, wenn OpenClaw als dedizierter Dienstbenutzer ausgeführt wird. |
| `OPENCLAW_STATE_DIR`   | Überschreibt das State-Verzeichnis (Standard: `~/.openclaw`).                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH` | Überschreibt den Pfad der Config-Datei (Standard: `~/.openclaw/openclaw.json`).                                                                                                                 |

## Logging

| Variable             | Zweck                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Überschreibt den Log-Level für Datei und Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Config. Ungültige Werte werden mit einer Warnung ignoriert. |

### `OPENCLAW_HOME`

Wenn gesetzt, ersetzt `OPENCLAW_HOME` das System-Home-Verzeichnis (`$HOME` / `os.homedir()`) für die gesamte interne Pfadauflösung. Dies ermöglicht vollständige Dateisystemisolation für Headless-Dienstkonten.

**Priorität:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Beispiel** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Tilde-Pfad gesetzt werden (z. B. `~/svc`), der vor der Verwendung mithilfe von `$HOME` erweitert wird.

## nvm-Benutzer: web_fetch-TLS-Fehler

Wenn Node.js über **nvm** installiert wurde (nicht über den Systempaketmanager), verwendet das integrierte `fetch()`
den gebündelten CA-Speicher von nvm, dem moderne Root-CAs fehlen können (ISRG Root X1/X2 für Let's Encrypt,
DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Sites mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die systemd-Dienstumgebung
- der `openclaw`-CLI-Einstiegspunkt führt sich vor dem Node-Start mit gesetztem `NODE_EXTRA_CA_CERTS` erneut aus

**Manuelle Korrektur (für ältere Versionen oder direkte `node ...`-Starts):**

Exportieren Sie die Variable, bevor Sie OpenClaw starten:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich für diese Variable nicht darauf, nur in `~/.openclaw/.env` zu schreiben; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Legacy-Umgebungsvariablen

OpenClaw liest nur `OPENCLAW_*`-Umgebungsvariablen. Die Legacy-Präfixe
`CLAWDBOT_*` und `MOLTBOT_*` aus früheren Releases werden stillschweigend
ignoriert.

Wenn beim Start noch welche im Gateway-Prozess gesetzt sind, gibt OpenClaw eine
einzelne Node-Deprecation-Warnung (`OPENCLAW_LEGACY_ENV_VARS`) aus, die die
erkannten Präfixe und die Gesamtanzahl auflistet. Benennen Sie jeden Wert um, indem Sie das
Legacy-Präfix durch `OPENCLAW_` ersetzen (zum Beispiel `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); die alten Namen haben keine Wirkung.

## Verwandte Themen

- [Gateway-Konfiguration](/de/gateway/configuration)
- [FAQ: Umgebungsvariablen und Laden von .env](/de/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/de/concepts/models)
