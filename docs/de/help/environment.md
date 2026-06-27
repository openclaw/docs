---
read_when:
    - Sie müssen wissen, welche Umgebungsvariablen geladen werden und in welcher Reihenfolge
    - Sie debuggen fehlende API-Schlüssel im Gateway
    - Sie dokumentieren Provider-Authentifizierung oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und in welcher Rangfolge sie gelten
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-06-27T17:35:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw lädt Umgebungsvariablen aus mehreren Quellen. Die Regel lautet: **Bestehende Werte niemals überschreiben**.
Arbeitsbereich-`.env`-Dateien sind eine Quelle mit geringerem Vertrauen: OpenClaw ignoriert Provider-Zugangsdaten und geschützte Laufzeitsteuerungen aus Arbeitsbereich-`.env`, bevor die Rangfolge angewendet wird.

## Rangfolge (höchste → niedrigste)

1. **Prozessumgebung** (was der Gateway-Prozess bereits von der übergeordneten Shell oder dem Daemon hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nicht; Provider-Zugangsdaten und geschützte Laufzeitsteuerungen werden ignoriert).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch bekannt als `$OPENCLAW_STATE_DIR/.env`; empfohlen für Provider-API-Schlüssel; überschreibt nicht).
4. **Config-`env`-Block** in `~/.openclaw/openclaw.json` (nur angewendet, wenn der Wert fehlt).
5. **Optionaler Login-Shell-Import** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), nur für fehlende erwartete Schlüssel angewendet.

Bei frischen Ubuntu-Installationen, die das Standard-State-Verzeichnis verwenden, behandelt OpenClaw außerdem `~/.config/openclaw/gateway.env` als Kompatibilitäts-Fallback nach der globalen `.env`. Wenn beide Dateien vorhanden sind und sich widersprechen, behält OpenClaw `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Config-Datei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import wird weiterhin ausgeführt, wenn er aktiviert ist.

## Provider-Zugangsdaten und Arbeitsbereich-`.env`

Speichern Sie Provider-API-Schlüssel nicht ausschließlich in einer Arbeitsbereich-`.env`. OpenClaw ignoriert Provider-Zugangsdaten-Umgebungsvariablen aus Arbeitsbereich-`.env`-Dateien, einschließlich häufiger Schlüssel wie `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY` und `FIRECRAWL_API_KEY`.

Verwenden Sie eine dieser vertrauenswürdigen Quellen für Provider-Zugangsdaten:

- Die Gateway-Prozessumgebung, z. B. eine Shell, eine launchd-/systemd-Unit, ein Container-Secret oder ein CI-Secret.
- Die globale Laufzeit-dotenv-Datei unter `~/.openclaw/.env` oder `$OPENCLAW_STATE_DIR/.env`.
- Den Config-`env`-Block in `~/.openclaw/openclaw.json`.
- Optionalen Login-Shell-Import, wenn `env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1` aktiviert ist.

Wenn Sie Provider-Schlüssel bisher nur in einer Arbeitsbereich-`.env` gespeichert haben, verschieben Sie sie in eine der oben genannten vertrauenswürdigen Quellen. Arbeitsbereich-`.env` kann weiterhin gewöhnliche Projektvariablen bereitstellen, die keine Zugangsdaten, Endpoint-Weiterleitungen, Host-Überschreibungen oder `OPENCLAW_*`-Laufzeitsteuerungen sind.

Siehe [Arbeitsbereich-`.env`-Dateien](/de/gateway/security#workspace-env-files) für die Sicherheitsbegründung.

## Config-`env`-Block

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

Der Config-`env`-Block akzeptiert nur literale Zeichenkettenwerte. Er erweitert keine
`file:...`-Werte; beispielsweise wird `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
als genau diese Zeichenkette an Provider übergeben.

Für dateibasierte Provider-Schlüssel verwenden Sie eine SecretRef im Zugangsdatenfeld, das
sie unterstützt:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Siehe [Secrets-Verwaltung](/de/gateway/secrets) und die
[SecretRef-Zugangsdatenoberfläche](/de/reference/secretref-credential-surface) für
unterstützte Felder.

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

## Exec-Shell-Snapshots

Auf Nicht-Windows-Gateway-Hosts verwenden bash- und zsh-`exec`-Befehle standardmäßig einen Start-Snapshot.
Setzen Sie `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` in der Gateway-Prozessumgebung, um diesen Pfad zu deaktivieren.
Die Werte `false`, `no` und `off` deaktivieren ihn ebenfalls. `exec.env`-Werte pro Aufruf können
Snapshots nicht umschalten und den Snapshot-Cache nicht umleiten.

## Laufzeitinjizierte Umgebungsvariablen

OpenClaw injiziert außerdem Kontextmarker in gestartete untergeordnete Prozesse:

- `OPENCLAW_SHELL=exec`: gesetzt für Befehle, die über das `exec`-Tool ausgeführt werden.
- `OPENCLAW_SHELL=acp`: gesetzt für Starts von ACP-Laufzeit-Backend-Prozessen (zum Beispiel `acpx`).
- `OPENCLAW_SHELL=acp-client`: gesetzt für `openclaw acp client`, wenn es den ACP-Bridge-Prozess startet.
- `OPENCLAW_SHELL=tui-local`: gesetzt für lokale TUI-`!`-Shell-Befehle.
- `OPENCLAW_CLI=1`: gesetzt für untergeordnete Prozesse, die vom CLI-Einstiegspunkt gestartet werden.

Dies sind Laufzeitmarker (keine erforderliche Benutzer-Config). Sie können in Shell-/Profil-Logik verwendet werden,
um kontextspezifische Regeln anzuwenden.

## UI-Umgebungsvariablen

- `OPENCLAW_THEME=light`: erzwingt die helle TUI-Palette, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: erzwingt die dunkle TUI-Palette.
- `COLORFGBG`: wenn Ihr Terminal sie exportiert, verwendet OpenClaw den Hinweis auf die Hintergrundfarbe, um die TUI-Palette automatisch auszuwählen.

## Umgebungsvariablen-Ersetzung in der Config

Sie können Umgebungsvariablen direkt in Config-Zeichenkettenwerten mit der `${VAR_NAME}`-Syntax referenzieren:

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

Siehe [Konfiguration: Umgebungsvariablen-Ersetzung](/de/gateway/configuration-reference#env-var-substitution) für vollständige Details.

## Secret refs vs. `${ENV}`-Zeichenketten

OpenClaw unterstützt zwei umgebungsgetriebene Muster:

- `${VAR}`-Zeichenkettenersetzung in Config-Werten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beide werden zum Aktivierungszeitpunkt aus der Prozessumgebung aufgelöst. SecretRef-Details sind in der [Secrets-Verwaltung](/de/gateway/secrets) dokumentiert.
Der Config-`env`-Block selbst löst keine SecretRefs oder `file:...`-
Kurzschreibwerte auf.

## Pfadbezogene Umgebungsvariablen

| Variable                 | Zweck                                                                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Überschreibt das Home-Verzeichnis, das für interne OpenClaw-Pfadstandards verwendet wird (`~/.openclaw/`, Agent-Verzeichnisse, Sitzungen, Zugangsdaten, Installer-Onboarding und der standardmäßige Dev-Checkout). Nützlich, wenn OpenClaw als dedizierter Dienstbenutzer ausgeführt wird. |
| `OPENCLAW_STATE_DIR`     | Überschreibt das State-Verzeichnis (Standard `~/.openclaw`).                                                                                                                                                                             |
| `OPENCLAW_CONFIG_PATH`   | Überschreibt den Pfad der Config-Datei (Standard `~/.openclaw/openclaw.json`).                                                                                                                                                           |
| `OPENCLAW_INCLUDE_ROOTS` | Pfadliste von Verzeichnissen, in denen `$include`-Direktiven Dateien außerhalb des Config-Verzeichnisses auflösen dürfen (Standard: keine — `$include` ist auf das Config-Verzeichnis beschränkt). Tilde wird erweitert.                  |

## Logging

| Variable                         | Zweck                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Überschreibt das Log-Level sowohl für Datei als auch Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Config. Ungültige Werte werden mit einer Warnung ignoriert. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Gibt gezielte Diagnoseinformationen zum Timing von Modellanfragen/-antworten auf `info`-Level aus, ohne globale Debug-Logs zu aktivieren.                                                              |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Modell-Payload-Diagnose: `summary`, `tools` oder `full-redacted`. `full-redacted` ist begrenzt und redigiert, kann aber Prompt-/Nachrichtentext enthalten.                                           |
| `OPENCLAW_DEBUG_SSE`             | Streaming-Diagnose: `events` für First-/Done-Timing, `peek`, um die ersten fünf redigierten SSE-Ereignisse einzuschließen.                                                                            |
| `OPENCLAW_DEBUG_CODE_MODE`       | Code-Modus-Diagnose zur Modelloberfläche, einschließlich Ausblenden von Provider-Tools und Durchsetzung von nur exec/wait.                                                                             |

### `OPENCLAW_HOME`

Wenn gesetzt, ersetzt `OPENCLAW_HOME` das System-Home-Verzeichnis (`$HOME` / `os.homedir()`) für interne OpenClaw-Pfadstandards. Dazu gehören das standardmäßige State-Verzeichnis, der Config-Pfad, Agent-Verzeichnisse, Zugangsdaten, der Installer-Onboarding-Arbeitsbereich und der standardmäßige Dev-Checkout, der von `openclaw update --channel dev` verwendet wird.

**Rangfolge:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Termux-`PREFIX`-Home-Fallback auf Android > `os.homedir()`

**Beispiel** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Tilde-Pfad gesetzt werden (z. B. `~/svc`), der vor der Verwendung mit derselben OS-Home-Fallback-Kette erweitert wird.

Explizite Pfadvariablen wie `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` und `OPENCLAW_GIT_DIR` haben weiterhin Vorrang. Aufgaben auf OS-Kontoebene wie Shell-Startdatei-Erkennung, Paketmanager-Einrichtung und Host-`~`-Erweiterung können weiterhin das echte System-Home verwenden.

## nvm-Benutzer: web_fetch-TLS-Fehler

Wenn Node.js über **nvm** installiert wurde (nicht über den Systempaketmanager), verwendet das eingebaute `fetch()`
den von nvm gebündelten CA-Speicher, dem moderne Root-CAs fehlen können (ISRG Root X1/X2 für Let's Encrypt,
DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Seiten mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die systemd-Dienstumgebung
- der `openclaw`-CLI-Einstiegspunkt führt sich selbst erneut mit gesetztem `NODE_EXTRA_CA_CERTS` aus, bevor Node startet

**Manuelle Korrektur (für ältere Versionen oder direkte `node ...`-Starts):**

Exportieren Sie die Variable, bevor Sie OpenClaw starten:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich bei dieser Variable nicht darauf, sie nur in `~/.openclaw/.env` zu schreiben; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Legacy-Umgebungsvariablen

OpenClaw liest nur `OPENCLAW_*`-Umgebungsvariablen. Die Legacy-
Präfixe `CLAWDBOT_*` und `MOLTBOT_*` aus früheren Releases werden stillschweigend
ignoriert.

Wenn beim Start noch welche im Gateway-Prozess gesetzt sind, gibt OpenClaw eine
einzelne Node-Deprecation-Warnung (`OPENCLAW_LEGACY_ENV_VARS`) aus, die die
erkannten Präfixe und die Gesamtanzahl auflistet. Benennen Sie jeden Wert um, indem Sie das
Legacy-Präfix durch `OPENCLAW_` ersetzen (zum Beispiel `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); die alten Namen haben keine Wirkung.

## Verwandte Themen

- [Gateway-Konfiguration](/de/gateway/configuration)
- [FAQ: Umgebungsvariablen und .env-Laden](/de/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/de/concepts/models)
